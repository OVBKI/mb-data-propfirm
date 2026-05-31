"""Internal scheduler — runs poll_all every 15 min directly in the service process.

We use APScheduler's AsyncIOScheduler so jobs run on the same asyncio loop as FastAPI.
No external cron infrastructure needed — Railway already runs this service 24/7.

Started in app.main:on_startup, stopped in on_shutdown.
"""
from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from .supabase_client import get_supabase
from .sync_service import (
    get_credentials_by_label,
    mark_synced,
    run_historical_sync,
)

logger = logging.getLogger("scheduler")

_scheduler: AsyncIOScheduler | None = None
_MIN_INTERVAL = timedelta(minutes=10)  # Safety against duplicate triggers


def start_scheduler() -> None:
    """Initialise and start the AsyncIO scheduler. Safe to call multiple times."""
    global _scheduler
    if _scheduler is not None and _scheduler.running:
        logger.info("Scheduler already running, skipping")
        return

    _scheduler = AsyncIOScheduler(timezone="UTC")
    # Every 15 minutes at xx:00, xx:15, xx:30, xx:45 UTC
    _scheduler.add_job(
        _run_poll_all,
        trigger=CronTrigger(minute="*/15"),
        id="rithmic_poll_all",
        replace_existing=True,
        coalesce=True,  # If multiple invocations are queued, only run once
        max_instances=1,  # Never overlap runs
    )
    _scheduler.start()
    logger.info("Scheduler started : poll-all every 15 min")


def stop_scheduler() -> None:
    global _scheduler
    if _scheduler is not None and _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("Scheduler stopped")
    _scheduler = None


async def _run_poll_all() -> None:
    """Poll all credentials sets that have auto_sync_enabled=true."""
    sb = get_supabase()
    try:
        res = (
            sb.table("rithmic_credentials")
            .select("user_id, label, auto_sync_days_window, last_synced_at")
            .eq("auto_sync_enabled", True)
            .execute()
        )
    except Exception as e:  # noqa: BLE001
        logger.exception("Scheduler : failed to query opt-in credentials")
        return

    candidates = res.data or []
    if not candidates:
        logger.debug("Scheduler tick : no opt-in credentials, nothing to sync")
        return

    now = datetime.now(timezone.utc)
    synced = 0
    skipped = 0
    errors = 0

    for row in candidates:
        user_id = row["user_id"]
        label = row["label"]

        # Skip if synced very recently
        last_at = row.get("last_synced_at")
        if last_at:
            try:
                last_dt = datetime.fromisoformat(str(last_at).replace("Z", "+00:00"))
                if now - last_dt < _MIN_INTERVAL:
                    skipped += 1
                    continue
            except Exception:  # noqa: BLE001
                pass

        creds = await get_credentials_by_label(user_id, label)
        if not creds:
            errors += 1
            continue

        try:
            await run_historical_sync(
                user_id=user_id,
                label=label,
                days=int(row.get("auto_sync_days_window") or 7),
            )
            synced += 1
        except Exception as e:  # noqa: BLE001
            logger.warning("Scheduler : sync failed for %s/%s : %s", user_id[:8], label, e)
            errors += 1
            # mark_synced even on failure to avoid retry storms
            try:
                await mark_synced(user_id, label)
            except Exception:
                pass

    logger.info(
        "Scheduler tick : %d synced, %d skipped (recent), %d errors (out of %d candidates)",
        synced, skipped, errors, len(candidates),
    )
