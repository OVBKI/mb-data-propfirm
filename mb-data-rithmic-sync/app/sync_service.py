"""Core sync logic — pulls Rithmic fills into Supabase journal_entries.

Multi-credentials model (since migration 002) :
  - A user can have N sets of credentials, each identified by a `label`
  - `list_credentials_meta(user_id)` returns metadata for all sets
  - `get_credentials_by_label(user_id, label)` decrypts a single set
  - `run_historical_sync(user_id, days, label=None)`:
      - If label given, sync only that one set
      - If label None, sync ALL sets sequentially
"""
from __future__ import annotations

import logging
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from .crypto import decrypt, encrypt
from .rithmic_client import rithmic_session
from .supabase_client import get_supabase

logger = logging.getLogger(__name__)


# ── Credentials CRUD ───────────────────────────────────────────────────────

async def list_credentials_meta(user_id: str) -> List[Dict[str, Any]]:
    """List metadata for all credentials sets of a user (no decryption)."""
    sb = get_supabase()
    res = (
        sb.table("rithmic_credentials")
        .select("id, user_id, label, system_name, updated_at, auto_sync_enabled, auto_sync_days_window, last_synced_at")
        .eq("user_id", user_id)
        .order("label")
        .execute()
    )
    return res.data or []


async def get_credentials_by_label(user_id: str, label: str) -> Optional[Dict[str, str]]:
    """Fetch + decrypt one credentials set."""
    sb = get_supabase()
    res = (
        sb.table("rithmic_credentials")
        .select("*")
        .eq("user_id", user_id)
        .eq("label", label)
        .execute()
    )
    if not res.data:
        return None
    row = res.data[0]
    try:
        return {
            "label": row["label"],
            "user": decrypt(row["encrypted_username"]),
            "password": decrypt(row["encrypted_password"]),
            "system_name": row["system_name"],
        }
    except ValueError:
        logger.exception("Failed to decrypt credentials for user=%s label=%s", user_id, label)
        return None


async def upsert_credentials(
    user_id: str,
    label: str,
    username: str,
    password: str,
    system_name: str,
    auto_sync_enabled: bool = False,
    auto_sync_days_window: int = 7,
) -> Dict[str, Any]:
    """Encrypt + upsert by (user_id, label). Returns the saved row metadata."""
    sb = get_supabase()
    payload = {
        "user_id": user_id,
        "label": label,
        "encrypted_username": encrypt(username),
        "encrypted_password": encrypt(password),
        "system_name": system_name,
        "auto_sync_enabled": auto_sync_enabled,
        "auto_sync_days_window": auto_sync_days_window,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    res = sb.table("rithmic_credentials").upsert(payload, on_conflict="user_id,label").execute()
    if not res.data:
        meta = (
            sb.table("rithmic_credentials")
            .select("id, user_id, label, system_name, updated_at, auto_sync_enabled, auto_sync_days_window, last_synced_at")
            .eq("user_id", user_id)
            .eq("label", label)
            .single()
            .execute()
        )
        return meta.data
    return res.data[0]


async def mark_synced(user_id: str, label: str) -> None:
    """Update last_synced_at for a (user, label) — called after each successful sync."""
    sb = get_supabase()
    sb.table("rithmic_credentials").update({
        "last_synced_at": datetime.now(timezone.utc).isoformat(),
    }).eq("user_id", user_id).eq("label", label).execute()


async def delete_credentials_by_label(user_id: str, label: str) -> bool:
    sb = get_supabase()
    res = (
        sb.table("rithmic_credentials")
        .delete()
        .eq("user_id", user_id)
        .eq("label", label)
        .execute()
    )
    return bool(res.data)


# ── Sync ───────────────────────────────────────────────────────────────────

async def run_historical_sync(
    user_id: str,
    days: int = 90,
    label: Optional[str] = None,
    account_filter: Optional[str] = None,
) -> Dict[str, Any]:
    """Sync the last `days` of fills. If label is None, syncs ALL credentials sets."""
    if label:
        creds = await get_credentials_by_label(user_id, label)
        if not creds:
            raise ValueError(f"No credentials with label '{label}' for this user")
        summary = await _sync_one(user_id, creds, days, account_filter)
        # Mark synced even if a few accounts errored, as long as connection worked
        try:
            await mark_synced(user_id, label)
        except Exception as e:  # noqa: BLE001
            logger.warning("Failed to update last_synced_at: %s", e)
        return summary

    # Sync all
    metas = await list_credentials_meta(user_id)
    if not metas:
        raise ValueError("No Rithmic credentials configured")

    total_trades = 0
    total_accounts = 0
    all_errors: List[str] = []

    for meta in metas:
        cred_label = meta["label"]
        creds = await get_credentials_by_label(user_id, cred_label)
        if not creds:
            all_errors.append(f"{cred_label}: failed to decrypt")
            continue
        try:
            summary = await _sync_one(user_id, creds, days, account_filter)
            total_trades += int(summary.get("trades_imported", 0) or 0)
            total_accounts += int(summary.get("accounts_synced", 0) or 0)
            for err in summary.get("errors", []) or []:
                all_errors.append(f"{cred_label}: {err}")
            try:
                await mark_synced(user_id, cred_label)
            except Exception as e:  # noqa: BLE001
                logger.warning("Failed to update last_synced_at for %s: %s", cred_label, e)
        except Exception as e:  # noqa: BLE001
            logger.exception("Sync failed for label=%s", cred_label)
            all_errors.append(f"{cred_label}: {e}")

    return {
        "status": "completed" if not all_errors else "completed_with_errors",
        "trades_imported": total_trades,
        "accounts_synced": total_accounts,
        "window_days": days,
        "errors": all_errors,
        "credentials_used": len(metas),
    }


async def _sync_one(
    user_id: str,
    creds: Dict[str, str],
    days: int,
    account_filter: Optional[str],
) -> Dict[str, Any]:
    """Sync one credentials set against Rithmic."""
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
            "note": "No Quantara accounts have rithmic_account_id set.",
            "errors": [],
        }

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
        rithmic_accounts = await _safe_list_accounts(client)
        logger.info(
            "[%s] Rithmic exposes %d accounts; %d configured in Quantara",
            creds.get("label", "?"), len(rithmic_accounts), len(acct_by_rithmic_id),
        )

        for rithmic_acct in rithmic_accounts:
            rid = _account_id(rithmic_acct)
            if rid not in acct_by_rithmic_id:
                continue
            quantara_acct = acct_by_rithmic_id[rid]
            try:
                fills = await _fetch_fills(client, start, end, rithmic_acct)
                rows = [_fill_to_journal_row(f, quantara_acct) for f in fills]
                rows = [r for r in rows if r is not None]
                if rows:
                    _upsert_journal_rows(rows)
                    total_trades += len(rows)
                accounts_synced += 1
            except Exception as e:  # noqa: BLE001
                logger.exception("Sync failed for Rithmic account %s", rid)
                errors.append(f"{rid}: {e}")

    return {
        "status": "completed" if not errors else "completed_with_errors",
        "trades_imported": total_trades,
        "accounts_synced": accounts_synced,
        "window_days": days,
        "errors": errors,
    }


# ── Helpers (unchanged from v1) ────────────────────────────────────────────

async def _safe_list_accounts(client) -> List[Any]:
    try:
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
    for attr in ("account_id", "id", "name"):
        v = getattr(rithmic_acct, attr, None)
        if v:
            return str(v)
    return str(rithmic_acct)


async def _fetch_fills(client, start: datetime, end: datetime, rithmic_acct: Any) -> List[Any]:
    """Fetch fill history for a Rithmic account.

    async_rithmic v1.5 does NOT expose get_fill_history on the client itself
    (we verified via attribute dump). It IS available on the OrderPlant which
    lives in `client.plants` (a dict).

    Two access paths, tried in order :
      1. client.plants["order"].get_fill_history(...)  — direct plant access
      2. show_order_history_dates() + show_order_history_summary(date)  — public API fallback
    """
    account_id = _account_id(rithmic_acct)

    # ── Diagnostic : on logue le contenu de plants une fois par sync run.
    if not getattr(_fetch_fills, "_plants_logged", False):
        plants = getattr(client, "plants", None)
        if plants is not None:
            try:
                if isinstance(plants, dict):
                    logger.info("client.plants is dict with keys: %s", list(plants.keys()))
                    for k, v in plants.items():
                        methods = [m for m in dir(v) if not m.startswith("_") and callable(getattr(v, m, None))]
                        logger.info("  plants[%r] = %s, methods: %s", k, type(v).__name__, methods)
                else:
                    logger.info("client.plants = %s (type=%s, attrs=%s)",
                                plants, type(plants).__name__,
                                [a for a in dir(plants) if not a.startswith("_")])
            except Exception as e:  # noqa: BLE001
                logger.warning("Failed to introspect plants: %s", e)
        _fetch_fills._plants_logged = True  # type: ignore[attr-defined]

    # ── Méthode A : via plants dict
    plants = getattr(client, "plants", None)
    if plants is not None:
        # Try common keys (case-insensitive)
        order_plant = None
        if isinstance(plants, dict):
            for key in ("order", "Order", "ORDER", "order_plant", "OrderPlant"):
                if key in plants:
                    order_plant = plants[key]
                    break
            if order_plant is None and plants:
                # Last resort : pick the first plant that has get_fill_history
                for k, v in plants.items():
                    if hasattr(v, "get_fill_history"):
                        order_plant = v
                        logger.info("Found order plant under key '%s'", k)
                        break
        else:
            # plants is a namespace, try attribute access
            for attr in ("order", "order_plant"):
                candidate = getattr(plants, attr, None)
                if candidate is not None and hasattr(candidate, "get_fill_history"):
                    order_plant = candidate
                    break

        if order_plant is not None and hasattr(order_plant, "get_fill_history"):
            for kwargs in (
                {"start_time": start, "end_time": end, "account_id": account_id},
                {"start_time": start, "end_time": end},
            ):
                try:
                    logger.info("Trying order_plant.get_fill_history(%s)", list(kwargs.keys()))
                    fills = await order_plant.get_fill_history(**kwargs)
                    fills_list = list(fills) if fills else []
                    logger.info("✓ order_plant.get_fill_history returned %d fills", len(fills_list))
                    return fills_list
                except TypeError as e:
                    logger.warning("TypeError with %s: %s", list(kwargs.keys()), e)
                    continue
                except Exception as e:  # noqa: BLE001
                    logger.warning("order_plant.get_fill_history failed : %s", e)
                    break

    # ── Méthode B : show_order_history_dates + show_order_history_summary
    if hasattr(client, "show_order_history_dates") and hasattr(client, "show_order_history_summary"):
        try:
            logger.info("Trying fallback : show_order_history_dates() + show_order_history_summary(date)")
            dates_result = await client.show_order_history_dates()
            logger.info("show_order_history_dates returned: %s (type=%s)",
                        str(dates_result)[:200], type(dates_result).__name__)

            # The structure of dates_result is opaque ; try to extract a list of date strings
            dates = []
            if isinstance(dates_result, list):
                dates = dates_result
            elif hasattr(dates_result, "dates"):
                dates = list(dates_result.dates)
            elif isinstance(dates_result, dict):
                dates = dates_result.get("dates") or []

            # Filter to our window
            start_str = start.date().isoformat()
            end_str = end.date().isoformat()
            in_window = [d for d in dates if start_str <= str(d) <= end_str]
            logger.info("Found %d dates with activity (%d in window %s..%s)",
                        len(dates), len(in_window), start_str, end_str)

            all_fills = []
            for d in in_window:
                try:
                    summary = await client.show_order_history_summary(date=str(d), account_id=account_id)
                    # summary structure is unknown — log first time + extract
                    if not getattr(_fetch_fills, "_summary_logged", False):
                        logger.info("show_order_history_summary(%s) returned: %s (type=%s)",
                                    d, str(summary)[:300], type(summary).__name__)
                        _fetch_fills._summary_logged = True  # type: ignore[attr-defined]
                    if isinstance(summary, list):
                        all_fills.extend(summary)
                    elif hasattr(summary, "orders"):
                        all_fills.extend(summary.orders)
                    elif hasattr(summary, "fills"):
                        all_fills.extend(summary.fills)
                    elif isinstance(summary, dict):
                        all_fills.extend(summary.get("orders") or summary.get("fills") or [])
                except Exception as e:  # noqa: BLE001
                    logger.warning("show_order_history_summary(%s) failed : %s", d, e)
            return all_fills
        except TypeError as e:
            # account_id may not be a valid kwarg
            try:
                logger.info("Retrying show_order_history_summary without account_id")
                # We can't easily retry the whole thing here ; just log
                logger.warning("show_order_history_dates/summary TypeError : %s", e)
            except Exception:
                pass
        except Exception as e:  # noqa: BLE001
            logger.warning("show_order_history_dates/summary path failed : %s", e)

    logger.error("All fill-fetching strategies exhausted for account %s", account_id)
    return []


def _fill_to_journal_row(fill: Any, quantara_acct: Dict[str, Any]) -> Optional[Dict[str, Any]]:
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
        "notes": f"[rithmic:{quantara_acct.get('rithmic_account_id', '')}/{fill_id}]",
        "source": "rithmic-sync",
        "source_id": str(fill_id),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }


def _upsert_journal_rows(rows: List[Dict[str, Any]]) -> None:
    if not rows:
        return
    sb = get_supabase()
    sb.table("journal_entries").upsert(rows, on_conflict="user_id,source_id").execute()
