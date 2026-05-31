"""Core sync logic — pulls Rithmic fills into Supabase journal_entries.

Mapping strategy :
1. For each fill returned by Rithmic, look up the matching Quantara account via
   `accounts.rithmic_account_id` (the user must populate this once when they set up
   their account in Quantara).
2. Convert the fill to a `journal_entries` row.
3. Upsert by (user_id, rithmic_fill_id) — idempotent so re-running the sync doesn't
   duplicate trades.

The Rithmic `fill` object structure depends on async_rithmic — we defensively pull
fields by getattr because the proto field names can change between Rithmic versions.
"""
from __future__ import annotations

import logging
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple

from .crypto import decrypt
from .rithmic_client import rithmic_session
from .supabase_client import get_supabase

logger = logging.getLogger(__name__)


# ── Public API ─────────────────────────────────────────────────────────────

async def get_credentials(user_id: str) -> Optional[Dict[str, str]]:
    """Fetch + decrypt the Rithmic credentials for a Quantara user.
    Returns dict with user, password, system_name — or None if not configured."""
    sb = get_supabase()
    res = sb.table("rithmic_credentials").select("*").eq("user_id", user_id).execute()
    if not res.data:
        return None
    row = res.data[0]
    try:
        return {
            "user": decrypt(row["encrypted_username"]),
            "password": decrypt(row["encrypted_password"]),
            "system_name": row["system_name"],
        }
    except ValueError:
        logger.exception("Failed to decrypt credentials for user %s", user_id)
        return None


async def upsert_credentials(user_id: str, username: str, password: str, system_name: str) -> None:
    """Encrypt + upsert (one row per Quantara user)."""
    from .crypto import encrypt
    sb = get_supabase()
    sb.table("rithmic_credentials").upsert({
        "user_id": user_id,
        "encrypted_username": encrypt(username),
        "encrypted_password": encrypt(password),
        "system_name": system_name,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }, on_conflict="user_id").execute()


async def delete_credentials(user_id: str) -> bool:
    sb = get_supabase()
    res = sb.table("rithmic_credentials").delete().eq("user_id", user_id).execute()
    return bool(res.data)


# ── Sync ───────────────────────────────────────────────────────────────────

async def run_historical_sync(
    user_id: str,
    days: int = 90,
    account_filter: Optional[str] = None,
) -> Dict[str, Any]:
    """Sync the last `days` of fills for a user. Returns a summary dict.

    Steps :
      1. Load + decrypt Rithmic creds
      2. Load Quantara accounts that have rithmic_account_id set
      3. Connect to Rithmic
      4. For each Quantara→Rithmic account mapping, pull fill history
      5. Map fills to journal_entries rows
      6. Upsert by (user_id, source_id) to avoid duplicates
    """
    creds = await get_credentials(user_id)
    if not creds:
        raise ValueError("No Rithmic credentials configured for this user")

    sb = get_supabase()
    accounts_query = (
        sb.table("accounts")
        .select("id, user_id, firm_id, rithmic_account_id, plan_size, funded_date, currency")
        .eq("user_id", user_id)
        .not_.is_("rithmic_account_id", "null")
    )
    if account_filter:
        accounts_query = accounts_query.eq("rithmic_account_id", account_filter)
    quantara_accounts = accounts_query.execute().data or []

    if not quantara_accounts:
        return {
            "status": "completed",
            "trades_imported": 0,
            "accounts_synced": 0,
            "note": "No Quantara accounts have rithmic_account_id set. Configure your accounts first.",
        }

    # rithmic_account_id → Quantara account row
    acct_by_rithmic_id: Dict[str, Dict[str, Any]] = {
        a["rithmic_account_id"]: a for a in quantara_accounts if a.get("rithmic_account_id")
    }

    end = datetime.now(timezone.utc)
    start = end - timedelta(days=days)

    total_trades = 0
    accounts_synced = 0
    errors: List[str] = []

    async with rithmic_session(
        user=creds["user"],
        password=creds["password"],
        system_name=creds["system_name"],
    ) as client:
        # Rithmic exposes accounts on the connected client
        rithmic_accounts = await _safe_list_accounts(client)
        logger.info("Rithmic exposes %d accounts; %d configured in Quantara", len(rithmic_accounts), len(acct_by_rithmic_id))

        for rithmic_acct in rithmic_accounts:
            rid = _account_id(rithmic_acct)
            if rid not in acct_by_rithmic_id:
                continue  # not mapped in Quantara, skip

            quantara_acct = acct_by_rithmic_id[rid]
            try:
                fills = await _fetch_fills(client, start, end, rithmic_acct)
                rows = [_fill_to_journal_row(f, quantara_acct) for f in fills]
                rows = [r for r in rows if r is not None]
                if rows:
                    _upsert_journal_rows(rows)
                    total_trades += len(rows)
                accounts_synced += 1
            except Exception as e:  # noqa: BLE001 — we want to record per-account failures
                logger.exception("Sync failed for Rithmic account %s", rid)
                errors.append(f"{rid}: {e}")

    return {
        "status": "completed" if not errors else "completed_with_errors",
        "trades_imported": total_trades,
        "accounts_synced": accounts_synced,
        "window_days": days,
        "errors": errors,
    }


# ── Helpers ────────────────────────────────────────────────────────────────

async def _safe_list_accounts(client) -> List[Any]:
    """async_rithmic exposes accounts via client.accounts (property) and/or list_accounts()."""
    try:
        # Some versions expose a cached property after connect()
        if getattr(client, "accounts", None):
            return list(client.accounts)
    except Exception:
        pass
    try:
        return await client.list_accounts()
    except Exception as e:
        logger.warning("list_accounts failed : %s", e)
        return []


def _account_id(rithmic_acct: Any) -> str:
    """Extract the account_id from a Rithmic account proto, defensively."""
    for attr in ("account_id", "id", "name"):
        v = getattr(rithmic_acct, attr, None)
        if v:
            return str(v)
    return str(rithmic_acct)


async def _fetch_fills(client, start: datetime, end: datetime, rithmic_acct: Any) -> List[Any]:
    """Call client.get_fill_history(start_time, end_time) — fallback to replay_executions."""
    account_id = _account_id(rithmic_acct)
    # Try get_fill_history first (preferred in async_rithmic v1.5+)
    try:
        fills = await client.get_fill_history(start_time=start, end_time=end, account_id=account_id)
        return list(fills) if fills else []
    except TypeError:
        # Some versions don't accept account_id kwarg
        try:
            fills = await client.get_fill_history(start_time=start, end_time=end)
            return list(fills) if fills else []
        except Exception as e:
            logger.warning("get_fill_history failed : %s — trying replay_executions", e)
    except Exception as e:
        logger.warning("get_fill_history failed : %s — trying replay_executions", e)

    try:
        replay = await client.replay_executions(start_time=start, end_time=end, account_id=account_id)
        return list(replay) if replay else []
    except Exception as e:
        logger.error("replay_executions also failed : %s", e)
        return []


def _fill_to_journal_row(fill: Any, quantara_acct: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Map a Rithmic fill to a journal_entries row. Returns None if fill is unusable."""
    # Defensive : grab common Rithmic proto fields
    fill_id = (
        getattr(fill, "exec_id", None)
        or getattr(fill, "execution_id", None)
        or getattr(fill, "trade_id", None)
        or getattr(fill, "id", None)
    )
    if not fill_id:
        return None

    symbol = getattr(fill, "symbol", None) or getattr(fill, "ticker", None) or ""
    side = getattr(fill, "transaction_type", None) or getattr(fill, "side", None) or ""
    qty = float(getattr(fill, "fill_size", 0) or getattr(fill, "qty", 0) or 0)
    price = float(getattr(fill, "fill_price", 0) or getattr(fill, "price", 0) or 0)
    pnl = float(
        getattr(fill, "pnl", None)
        or getattr(fill, "realized_pnl", None)
        or getattr(fill, "net_pnl", None)
        or 0
    )
    commission = float(
        getattr(fill, "commission", None)
        or getattr(fill, "broker_commission", None)
        or 0
    )

    # Timestamp — Rithmic uses ssboe (seconds since epoch) + usecs
    ts = None
    ssboe = getattr(fill, "ssboe", None) or getattr(fill, "fill_ssboe", None)
    if ssboe:
        try:
            ts = datetime.fromtimestamp(int(ssboe), tz=timezone.utc)
        except Exception:
            ts = None
    if ts is None:
        ts = getattr(fill, "timestamp", None) or getattr(fill, "trade_time", None)
    if ts is None:
        ts = datetime.now(timezone.utc)

    date_str = ts.date().isoformat() if isinstance(ts, datetime) else str(ts)[:10]

    net_pnl = pnl - commission

    return {
        "id": str(uuid.uuid4()),
        "user_id": quantara_acct["user_id"],
        "account_id": quantara_acct["id"],
        "date": date_str,
        "instrument": symbol,
        "side": str(side).lower()[:6],
        "qty": qty,
        "entry_price": price,
        "pnl": pnl,
        "net": net_pnl,
        "commission": commission,
        # Idempotency marker — matches the legacy format used by CSV importer
        "notes": f"[rithmic:{quantara_acct.get('rithmic_account_id', '')}/{fill_id}]",
        "source": "rithmic-sync",
        "source_id": str(fill_id),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }


def _upsert_journal_rows(rows: List[Dict[str, Any]]) -> None:
    """Upsert by (user_id, source_id) — requires a unique index to be present in Supabase."""
    if not rows:
        return
    sb = get_supabase()
    # We rely on PostgreSQL UPSERT via on_conflict
    # NOTE : the unique constraint on (user_id, source_id) must exist (see migration SQL)
    sb.table("journal_entries").upsert(rows, on_conflict="user_id,source_id").execute()
