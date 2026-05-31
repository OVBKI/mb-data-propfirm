"""Cron endpoints — called by Vercel scheduled tasks via the Next.js proxy.

These endpoints are NOT user-authenticated. They use a shared CRON_SECRET sent
in the `X-Cron-Secret` HTTP header. Vercel's cron sends the secret, Next.js
forwards it, this service verifies it.
"""
from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Header, HTTPException

from ..config import get_settings
from ..supabase_client import get_supabase
from ..sync_service import (
    get_credentials_by_label,
    mark_synced,
    run_historical_sync,
)

router = APIRouter(prefix="/cron", tags=["cron"])
logger = logging.getLogger("cron")

# Don't re-sync more often than this (safety net against duplicate cron triggers)
_MIN_INTERVAL = timedelta(minutes=10)


def _verify_cron(secret: Optional[str]) -> None:
    expected = get_settings().rithmic_cron_secret
    if not expected:
        raise HTTPException(status_code=503, detail="RITHMIC_CRON_SECRET not configured on the service")
    if secret != expected:
        raise HTTPException(status_code=401, detail="invalid cron secret")


@router.post("/poll-all")
async def poll_all_auto_sync(
    x_cron_secret: Optional[str] = Header(default=None, alias="X-Cron-Secret"),
) -> dict:
    """For each (user, label) with auto_sync_enabled=true, run a historical sync.

    Called by Vercel cron every 15 minutes via the /api/cron/rithmic-poll proxy.
    """
    _verify_cron(x_cron_secret)

    sb = get_supabase()
    res = (
        sb.table("rithmic_credentials")
        .select("user_id, label, auto_sync_days_window, last_synced_at")
        .eq("auto_sync_enabled", True)
        .execute()
    )
    candidates = res.data or []

    if not candidates:
        return {"polled": 0, "skipped": 0, "results": []}

    now = datetime.now(timezone.utc)
    results = []
    skipped = 0

    for row in candidates:
        user_id = row["user_id"]
        label = row["label"]

        # Skip if synced very recently (guards against duplicate cron triggers
        # or manual sync that just happened)
        last_at = row.get("last_synced_at")
        if last_at:
            try:
                last_dt = datetime.fromisoformat(str(last_at).replace("Z", "+00:00"))
                if now - last_dt < _MIN_INTERVAL:
                    skipped += 1
                    continue
            except Exception:  # noqa: BLE001
                pass

        days = int(row.get("auto_sync_days_window") or 7)
        creds = await get_credentials_by_label(user_id, label)
        if not creds:
            results.append({"user_id": user_id[:8] + "…", "label": label, "error": "creds_not_found"})
            continue

        try:
            summary = await run_historical_sync(user_id=user_id, label=label, days=days)
            results.append({
                "user_id": user_id[:8] + "…",
                "label": label,
                "trades_imported": int(summary.get("trades_imported", 0) or 0),
                "accounts_synced": int(summary.get("accounts_synced", 0) or 0),
            })
        except Exception as e:  # noqa: BLE001
            logger.exception("Cron sync failed for user=%s label=%s", user_id, label)
            # mark_synced is best-effort even on failure to avoid retry storms
            try:
                await mark_synced(user_id, label)
            except Exception:
                pass
            results.append({"user_id": user_id[:8] + "…", "label": label, "error": str(e)[:200]})

    return {
        "polled": len(results),
        "skipped": skipped,
        "results": results,
        "ran_at": now.isoformat(),
    }
