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
                fills = await _fetch_fills(client, start, end, rithmic_acct, user_id=user_id)
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


def _debug_persist(user_id: Optional[str], account_id: str, date_str: str, summary: Any) -> None:
    """Persist a single summary response to the rithmic_debug table for offline inspection.

    Logs are silently swallowed by Railway noise — Supabase is reliable.
    Only the first 5 dates per sync hit this (caller-guarded).
    """
    if user_id is None:
        return
    try:
        s_type = type(summary).__name__ if summary is not None else "NoneType"
        s_repr = str(summary)[:2000] if summary is not None else "None"
        fields_json: Dict[str, Any] = {}
        if summary is not None and hasattr(summary, "ListFields"):
            try:
                for f_desc, f_value in list(summary.ListFields())[:30]:
                    fields_json[f_desc.name] = {
                        "py_type": type(f_value).__name__,
                        "repr": str(f_value)[:500],
                    }
            except Exception as e:  # noqa: BLE001
                fields_json["__error__"] = str(e)[:200]
        elif summary is not None and isinstance(summary, (list, tuple)) and summary:
            fields_json["__list_len__"] = len(summary)
            first = summary[0]
            fields_json["__list_0_type__"] = type(first).__name__
            if hasattr(first, "ListFields"):
                try:
                    for f_desc, f_value in list(first.ListFields())[:30]:
                        fields_json[f"item0.{f_desc.name}"] = {
                            "py_type": type(f_value).__name__,
                            "repr": str(f_value)[:500],
                        }
                except Exception as e:  # noqa: BLE001
                    fields_json["__error__"] = str(e)[:200]
        sb = get_supabase()
        sb.table("rithmic_debug").insert({
            "user_id": user_id,
            "account_id": account_id,
            "date_str": date_str,
            "summary_type": s_type,
            "summary_repr": s_repr,
            "fields_json": fields_json,
        }).execute()
    except Exception as e:  # noqa: BLE001
        logger.warning("debug persist failed (table may not exist yet) : %s", str(e)[:200])


def _persist_strategy_result(user_id: str, strategy_label: str, account_id: str, result: Any) -> None:
    """Persist the result of a DIAG D strategy attempt to rithmic_debug."""
    try:
        if result is None:
            s_type = "NoneType"
            s_repr = "None"
            fields_json = {}
        elif isinstance(result, str):  # exception string from _try
            s_type = "exception_string"
            s_repr = result[:1500]
            fields_json = {}
        else:
            s_type = type(result).__name__
            s_repr = str(result)[:1500]
            fields_json = {}
            if isinstance(result, (list, tuple)):
                fields_json["__list_len__"] = len(result)
                for i, item in enumerate(result[:3]):
                    item_info: Dict[str, Any] = {
                        "py_type": type(item).__name__,
                        "repr": str(item)[:500],
                    }
                    if hasattr(item, "ListFields"):
                        try:
                            item_fields = {}
                            for f_desc, f_value in list(item.ListFields())[:30]:
                                item_fields[f_desc.name] = {
                                    "py_type": type(f_value).__name__,
                                    "repr": str(f_value)[:200],
                                }
                            item_info["fields"] = item_fields
                        except Exception as e:  # noqa: BLE001
                            item_info["fields_error"] = str(e)[:200]
                    fields_json[f"item_{i}"] = item_info
            elif hasattr(result, "ListFields"):
                try:
                    for f_desc, f_value in list(result.ListFields())[:30]:
                        fields_json[f_desc.name] = {
                            "py_type": type(f_value).__name__,
                            "repr": str(f_value)[:500],
                        }
                except Exception as e:  # noqa: BLE001
                    fields_json["__error__"] = str(e)[:200]
            elif isinstance(result, dict):
                for k, v in list(result.items())[:30]:
                    fields_json[str(k)] = {
                        "py_type": type(v).__name__,
                        "repr": str(v)[:200],
                    }

        sb = get_supabase()
        sb.table("rithmic_debug").insert({
            "user_id": user_id,
            "account_id": f"__strat__{strategy_label}__{account_id}",
            "date_str": strategy_label,
            "summary_type": s_type,
            "summary_repr": s_repr,
            "fields_json": fields_json,
        }).execute()
    except Exception as e:  # noqa: BLE001
        logger.warning("strategy persist failed for %s : %s", strategy_label, str(e)[:200])


async def _fetch_fills(
    client,
    start: datetime,
    end: datetime,
    rithmic_acct: Any,
    user_id: Optional[str] = None,
) -> List[Any]:
    """Fetch fill history for a Rithmic account.

    Uses async_rithmic v1.6.1 `get_fill_history(start_time, end_time, account_id=...)`
    on the OrderPlant. This method sends RequestShowFillHistory and synchronously
    collects the response (returns a list of fills).

    Falls back to the legacy show_order_history_dates/summary path if the new
    method is unavailable (e.g. older library version).
    """
    account_id = _account_id(rithmic_acct)

    # ── v1.6.1 path : get_fill_history on order plant
    plants = getattr(client, "plants", None)
    order_plant = None
    if isinstance(plants, dict):
        for key in ("order", "Order", "order_plant", "OrderPlant"):
            if key in plants:
                order_plant = plants[key]
                break

    if order_plant is not None and hasattr(order_plant, "get_fill_history"):
        # Try several kwargs combinations — Rithmic typically wants account_id at minimum
        for kwargs in (
            {"account_id": account_id},
            {"account_id": account_id, "fcm_id": "LucidTrading", "ib_id": "LucidTrading"},
            {},  # last resort : no filter
        ):
            try:
                logger.info("get_fill_history(start=%s, end=%s, %s)",
                            start.isoformat(), end.isoformat(), list(kwargs.keys()))
                fills = await order_plant.get_fill_history(
                    start_time=start, end_time=end, **kwargs,
                )
                fills_list = list(fills) if fills else []
                logger.info("✓ get_fill_history returned %d fills (kwargs=%s)",
                            len(fills_list), list(kwargs.keys()))
                # Persist first fill structure for inspection
                if user_id is not None and fills_list and not getattr(_fetch_fills, "_fill_logged", False):
                    _debug_persist(user_id, account_id, "FILL_SAMPLE", fills_list[0])
                    _fetch_fills._fill_logged = True  # type: ignore[attr-defined]
                if fills_list:
                    return fills_list
            except TypeError as e:
                logger.warning("TypeError calling get_fill_history(%s): %s",
                                list(kwargs.keys()), str(e)[:200])
                continue
            except Exception as e:  # noqa: BLE001
                logger.warning("get_fill_history(%s) raised: %s",
                                list(kwargs.keys()), str(e)[:300])
                # Persist exception for inspection
                if user_id is not None:
                    _persist_strategy_result(
                        user_id, f"get_fill_history_{list(kwargs.keys())}",
                        account_id, f"EXCEPTION: {type(e).__name__}: {str(e)[:300]}",
                    )
                continue
        logger.warning("get_fill_history exhausted all kwargs combos for %s", account_id)

    # ── Legacy fallback (v1.5 path) — kept for older library installations
    logger.info("Falling back to legacy show_order_history_* path")

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

    # ── DIAGNOSTIC C : dump complete client + order-plant async methods to Supabase
    # so we can identify the right fill-fetching method (show_order_history_summary
    # returns [] for all dates — wrong endpoint). Runs once per process.
    if user_id is not None and not getattr(_fetch_fills, "_methods_dumped", False):
        try:
            import inspect
            client_methods = {}
            for name in sorted(dir(client)):
                if name.startswith("_"):
                    continue
                attr = getattr(client, name, None)
                if attr is None:
                    continue
                is_coro = inspect.iscoroutinefunction(attr)
                is_callable = callable(attr)
                if is_callable:
                    try:
                        sig = str(inspect.signature(attr))
                    except (ValueError, TypeError):
                        sig = "?"
                    client_methods[name] = {
                        "async": is_coro,
                        "sig": sig[:200],
                        "type": type(attr).__name__,
                    }
                else:
                    client_methods[name] = {
                        "async": False,
                        "value_type": type(attr).__name__,
                        "repr": str(attr)[:150],
                    }

            order_plant_methods: Dict[str, Any] = {}
            plants = getattr(client, "plants", None)
            if isinstance(plants, dict):
                order_plant = plants.get("order") or plants.get("Order")
                if order_plant is not None:
                    for name in sorted(dir(order_plant)):
                        if name.startswith("_"):
                            continue
                        attr = getattr(order_plant, name, None)
                        if attr is None or not callable(attr):
                            continue
                        try:
                            sig = str(inspect.signature(attr))
                        except (ValueError, TypeError):
                            sig = "?"
                        order_plant_methods[name] = {
                            "async": inspect.iscoroutinefunction(attr),
                            "sig": sig[:200],
                        }

            sb = get_supabase()
            sb.table("rithmic_debug").insert({
                "user_id": user_id,
                "account_id": "__client_introspect__",
                "date_str": "client",
                "summary_type": "introspection",
                "summary_repr": f"{len(client_methods)} public attrs on client",
                "fields_json": client_methods,
            }).execute()
            sb.table("rithmic_debug").insert({
                "user_id": user_id,
                "account_id": "__order_plant_introspect__",
                "date_str": "order_plant",
                "summary_type": "introspection",
                "summary_repr": f"{len(order_plant_methods)} public attrs on order plant",
                "fields_json": order_plant_methods,
            }).execute()
            logger.info("DIAG C : dumped %d client methods + %d order_plant methods to rithmic_debug",
                        len(client_methods), len(order_plant_methods))
        except Exception as e:  # noqa: BLE001
            logger.warning("DIAG C dump failed : %s", str(e)[:200])
        _fetch_fills._methods_dumped = True  # type: ignore[attr-defined]

    # ── DIAGNOSTIC D : try multiple fill-fetching strategies, persist each result
    # to rithmic_debug so we can see which one actually returns fills. Runs once.
    if user_id is not None and not getattr(_fetch_fills, "_strategies_tested", False):
        # Pick a known trading date from rithmic_debug history (we saw 20250413 worked
        # for dates extraction). Use today + a few candidates.
        test_date_compact = "20250413"
        test_date_iso = "2025-04-13"

        async def _try(label: str, coro):
            try:
                result = await coro
                _persist_strategy_result(user_id, label, account_id, result)
                return result
            except Exception as e:  # noqa: BLE001
                _persist_strategy_result(user_id, label, account_id, f"EXCEPTION: {type(e).__name__}: {str(e)[:300]}")
                return None

        try:
            await _try("D1_list_orders_acct", client.list_orders(account_id=account_id))
            await _try("D2_list_orders_noargs", client.list_orders())
            await _try("D3_list_positions_acct", client.list_positions(account_id=account_id))
            await _try("D4_show_summary_no_acct_compact",
                       client.show_order_history_summary(date=test_date_compact))
            await _try("D5_show_summary_iso_with_acct",
                       client.show_order_history_summary(date=test_date_iso, account_id=account_id))
            await _try("D6_list_account_summary",
                       client.list_account_summary(account_id=account_id))
            logger.info("DIAG D : ran 6 fill-fetching strategies, results in rithmic_debug")
        except Exception as e:  # noqa: BLE001
            logger.warning("DIAG D top-level failed : %s", str(e)[:200])
        _fetch_fills._strategies_tested = True  # type: ignore[attr-defined]

    # ── DIAGNOSTIC E : subscribe-then-replay
    # Theory : show_order_history_summary returns [] immediately (just ACK), then
    # the actual fills arrive asynchronously via on_rithmic_order_notification.
    # If we register handlers BEFORE the call and wait, we may capture them.
    if user_id is not None and not getattr(_fetch_fills, "_subscribe_tested", False):
        import asyncio as _asyncio

        # Marker insert : if the block crashes silently, we'll still see this row,
        # confirming the code path was entered.
        try:
            get_supabase().table("rithmic_debug").insert({
                "user_id": user_id,
                "account_id": f"__diag_e_marker__{account_id}",
                "date_str": "E_marker_started",
                "summary_type": "marker",
                "summary_repr": "DIAG E block entered",
                "fields_json": {},
            }).execute()
        except Exception as e:  # noqa: BLE001
            logger.warning("DIAG E marker insert failed : %s", str(e)[:200])

        captured: List[Dict[str, Any]] = []

        def _on_rithmic_order(*args, **kwargs):
            try:
                captured.append({
                    "source": "rithmic_order_notif",
                    "args_count": len(args),
                    "args_types": [type(a).__name__ for a in args[:3]],
                    "args_repr": [str(a)[:300] for a in args[:3]],
                    "kwargs_keys": list(kwargs.keys())[:10],
                })
            except Exception:  # noqa: BLE001
                pass

        def _on_exchange_order(*args, **kwargs):
            try:
                captured.append({
                    "source": "exchange_order_notif",
                    "args_count": len(args),
                    "args_types": [type(a).__name__ for a in args[:3]],
                    "args_repr": [str(a)[:300] for a in args[:3]],
                    "kwargs_keys": list(kwargs.keys())[:10],
                })
            except Exception:  # noqa: BLE001
                pass

        subscribe_method_used = "none"
        try:
            ev1 = getattr(client, "on_rithmic_order_notification", None)
            ev2 = getattr(client, "on_exchange_order_notification", None)

            # async_rithmic uses the `events` package — Event objects are callable
            # and support += operator to add listeners.
            if ev1 is not None:
                try:
                    if hasattr(ev1, "__iadd__"):
                        client.on_rithmic_order_notification += _on_rithmic_order
                        subscribe_method_used = "iadd"
                    elif hasattr(ev1, "subscribe"):
                        ev1.subscribe(_on_rithmic_order)
                        subscribe_method_used = "subscribe_method"
                    elif callable(ev1):
                        try:
                            ev1(_on_rithmic_order)
                            subscribe_method_used = "call"
                        except Exception:  # noqa: BLE001
                            pass
                except Exception as e:  # noqa: BLE001
                    logger.warning("DIAG E : failed to subscribe to on_rithmic_order : %s", str(e)[:200])

            if ev2 is not None:
                try:
                    if hasattr(ev2, "__iadd__"):
                        client.on_exchange_order_notification += _on_exchange_order
                    elif hasattr(ev2, "subscribe"):
                        ev2.subscribe(_on_exchange_order)
                except Exception:  # noqa: BLE001
                    pass

            logger.info("DIAG E : subscribed via '%s', calling show_order_history_summary",
                        subscribe_method_used)

            # Call the trigger — may return [] but should fire async events
            try:
                trigger_result = await client.show_order_history_summary(
                    date="20250413", account_id=account_id
                )
                trigger_repr = str(trigger_result)[:200]
            except Exception as e:  # noqa: BLE001
                trigger_repr = f"EXC: {type(e).__name__}: {str(e)[:200]}"

            # Wait for events to fire
            await _asyncio.sleep(10)

            # Persist the result
            sb = get_supabase()
            sb.table("rithmic_debug").insert({
                "user_id": user_id,
                "account_id": f"__diag_e__{account_id}",
                "date_str": "E_subscribe_replay",
                "summary_type": "subscribe_then_replay",
                "summary_repr": (
                    f"subscribe_via={subscribe_method_used}, "
                    f"trigger_result={trigger_repr}, "
                    f"captured_events={len(captured)}"
                )[:1500],
                "fields_json": {
                    "subscribe_via": subscribe_method_used,
                    "trigger_result": trigger_repr,
                    "captured_count": len(captured),
                    "captured_events": captured[:10],  # first 10 only
                },
            }).execute()
            logger.info("DIAG E : captured %d events after replay trigger", len(captured))
        except Exception as e:  # noqa: BLE001
            logger.warning("DIAG E top-level failed : %s", str(e)[:300])
        _fetch_fills._subscribe_tested = True  # type: ignore[attr-defined]

    # ── Méthode B : show_order_history_dates + show_order_history_summary
    if hasattr(client, "show_order_history_dates") and hasattr(client, "show_order_history_summary"):
        try:
            logger.info("Trying fallback : show_order_history_dates() + show_order_history_summary(date)")
            dates_result = await client.show_order_history_dates()

            # Always log the raw response so we can diagnose extraction issues.
            logger.info(
                "show_order_history_dates raw response : type=%s, len=%s, repr=%s",
                type(dates_result).__name__,
                len(dates_result) if hasattr(dates_result, "__len__") else "n/a",
                str(dates_result)[:500],
            )

            # The result is a list of protobuf messages. Each message has a REPEATED
            # `date` field containing strings in YYYYMMDD format. We extract them all.
            dates_collected = _extract_dates(dates_result)
            logger.info("Extracted %d date(s) from show_order_history_dates : %s",
                        len(dates_collected), dates_collected[:20])

            # Filter to our window (window dates are YYYY-MM-DD ; collected are YYYYMMDD).
            start_compact = start.strftime("%Y%m%d")
            end_compact = end.strftime("%Y%m%d")
            in_window = [d for d in dates_collected if start_compact <= d <= end_compact]
            logger.info("After window filter (%s..%s) : %d dates remain : %s",
                        start_compact, end_compact, len(in_window), in_window[:20])

            # IMPORTANT : we DO NOT filter by window here. Rithmic's show_order_history_dates
            # returns dates the account has been ACCESSED (e.g. login days), not just trading
            # days. So in_window can contain dates with no actual orders (returning 'no data').
            # And actual trading days can be OUTSIDE the user's requested window (e.g. older
            # PropFirm history). Strategy : query ALL extracted dates, skip 'no data' errors.
            dates_to_sync = dates_collected
            logger.info("Querying all %d dates extracted (window filter ignored)", len(dates_to_sync))

            all_fills = []
            no_data_count = 0
            success_count = 0
            error_count = 0

            for d_idx, d in enumerate(dates_to_sync):
                summary = None
                exception_caught = None
                for kwargs in (
                    {"date": d, "account_id": account_id},
                    {"date": d},
                ):
                    try:
                        summary = await client.show_order_history_summary(**kwargs)
                        break
                    except TypeError:
                        continue
                    except Exception as e:  # noqa: BLE001
                        exception_caught = e
                        err_str = str(e).lower()
                        if "no data" in err_str or "'rpcode': ['7'" in err_str:
                            # Date has no orders — silent skip
                            no_data_count += 1
                            summary = None
                            break
                        logger.warning("show_order_history_summary(%s, kwargs=%s) failed : %s",
                                       d, list(kwargs.keys()), str(e)[:200])
                        error_count += 1
                        break

                # ── DIAGNOSTIC : persist first 5 summaries to Supabase (rithmic_debug)
                if d_idx < 5:
                    _debug_persist(user_id, account_id, d, summary)

                # ── DIAGNOSTIC : log first 5 iterations UNCONDITIONALLY
                if d_idx < 5:
                    logger.info(
                        "DIAG[%d] date=%s : summary=%s, exception=%s",
                        d_idx, d,
                        f"type={type(summary).__name__}, repr={str(summary)[:300]}" if summary is not None else "None",
                        type(exception_caught).__name__ if exception_caught else "none",
                    )
                    if summary is not None and hasattr(summary, "ListFields"):
                        try:
                            fields = list(summary.ListFields())
                            logger.info("DIAG[%d] ListFields count=%d", d_idx, len(fields))
                            for f_desc, f_value in fields[:10]:
                                logger.info("DIAG[%d]   field name=%s, type=%s, repr=%s",
                                            d_idx, f_desc.name, type(f_value).__name__,
                                            str(f_value)[:150])
                        except Exception as e:  # noqa: BLE001
                            logger.warning("DIAG[%d] ListFields failed : %s", d_idx, e)
                    elif summary is not None and isinstance(summary, (list, tuple)) and summary:
                        first = summary[0]
                        logger.info("DIAG[%d] list[0] type=%s", d_idx, type(first).__name__)
                        if hasattr(first, "ListFields"):
                            try:
                                for f_desc, f_value in list(first.ListFields())[:10]:
                                    logger.info("DIAG[%d]   list[0] field=%s, type=%s, repr=%s",
                                                d_idx, f_desc.name, type(f_value).__name__,
                                                str(f_value)[:150])
                            except Exception:  # noqa: BLE001
                                pass

                if summary is None:
                    continue

                success_count += 1

                fills_from_summary = _extract_fills_from_summary(summary, account_id, d)
                if fills_from_summary:
                    all_fills.extend(fills_from_summary)

            logger.info(
                "Method B summary : %d dates total → %d with data, %d 'no data', %d errors → %d fills",
                len(dates_to_sync), success_count, no_data_count, error_count, len(all_fills),
            )
            return all_fills
        except Exception as e:  # noqa: BLE001
            logger.warning("show_order_history_dates/summary path failed : %s", e, exc_info=True)

    logger.error("All fill-fetching strategies exhausted for account %s", account_id)
    return []


def _extract_dates(dates_result: Any) -> List[str]:
    """Extract YYYYMMDD date strings from the protobuf response.

    The response is typically a list of protobuf messages, each having a
    REPEATED `date` field. Some messages may also have a single `date` attribute.
    """
    collected = []

    def _add(d) -> None:
        s = str(d).strip().strip('"')
        if s and len(s) == 8 and s.isdigit():
            collected.append(s)

    if dates_result is None:
        return collected

    # If it's a list/iterable of messages
    try:
        iterator = list(iter(dates_result))
    except TypeError:
        iterator = [dates_result]

    for idx, msg in enumerate(iterator):
        # ── DIAGNOSTIC : log message structure once for the first message
        if idx == 0 and not getattr(_extract_dates, "_msg_logged", False):
            msg_attrs = [a for a in dir(msg) if not a.startswith("_") and not a[0].isupper()]
            logger.info(
                "First message in dates_result : type=%s, public attrs=%s",
                type(msg).__name__, msg_attrs[:50],
            )
            # Try ListFields() — standard protobuf method
            if hasattr(msg, "ListFields"):
                try:
                    fields = msg.ListFields()
                    logger.info("ListFields() returned %d fields:", len(fields))
                    for f_desc, f_value in fields:
                        logger.info("  field name=%s, type=%s, value=%s",
                                    f_desc.name, type(f_value).__name__, str(f_value)[:150])
                except Exception as e:  # noqa: BLE001
                    logger.warning("ListFields failed: %s", e)
            _extract_dates._msg_logged = True  # type: ignore[attr-defined]

        # Try direct attribute access
        date_field = getattr(msg, "date", None)
        if date_field is not None:
            try:
                # Repeated fields are iterable in protobuf
                for d in date_field:
                    _add(d)
            except TypeError:
                # Not iterable, single value
                _add(date_field)
        else:
            # Try via ListFields() — guaranteed to work for any protobuf
            if hasattr(msg, "ListFields"):
                try:
                    for f_desc, f_value in msg.ListFields():
                        if f_desc.name == "date":
                            try:
                                for d in f_value:
                                    _add(d)
                            except TypeError:
                                _add(f_value)
                except Exception:  # noqa: BLE001
                    pass
            else:
                # Last resort: maybe the message itself IS a date string
                _add(msg)

    return collected


def _extract_fills_from_summary(summary: Any, account_id: str, date_str: str) -> List[Any]:
    """Extract individual fills/executions from a show_order_history_summary response.

    Response shape varies, but typically has either `orders`, `fills`, or `executions`
    as repeated fields. We try all of them and accumulate.
    """
    fills = []
    if summary is None:
        return fills

    # Iterate if summary is a list of messages
    items = summary if isinstance(summary, (list, tuple)) else [summary]

    for msg in items:
        for field_name in ("fills", "executions", "orders", "order_history", "fill_history"):
            field = getattr(msg, field_name, None)
            if field is None:
                continue
            try:
                if hasattr(field, "__iter__") and not isinstance(field, (str, bytes)):
                    for item in field:
                        # Tag with date in case the item doesn't have one
                        if not hasattr(item, "_quantara_date_str"):
                            try:
                                setattr(item, "_quantara_date_str", date_str)
                            except Exception:  # noqa: BLE001
                                pass
                        fills.append(item)
                else:
                    fills.append(field)
            except Exception:  # noqa: BLE001
                pass

    return fills


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

    # Fallback : use the YYYYMMDD date tag we set when extracting from show_order_history_summary
    date_str = None
    if ts is None:
        tagged = getattr(fill, "_quantara_date_str", None)
        if tagged and len(tagged) == 8 and tagged.isdigit():
            date_str = f"{tagged[:4]}-{tagged[4:6]}-{tagged[6:]}"
    if ts is None and date_str is None:
        ts = datetime.now(timezone.utc)

    if date_str is None:
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
