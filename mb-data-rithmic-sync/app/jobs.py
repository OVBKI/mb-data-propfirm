"""In-memory job tracker for sync operations.

NOTE : This is a single-instance in-memory store, perfect for the MVP. When we scale
to multiple Railway instances or want persistence, swap this for a Supabase table
or Redis. The API surface is intentionally minimal so the migration is mechanical.
"""
from __future__ import annotations

import asyncio
import logging
import re
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from .models import SyncJob
from .sync_service import run_historical_sync

logger = logging.getLogger(__name__)

_JOBS: Dict[str, SyncJob] = {}
_TASKS: Dict[str, asyncio.Task] = {}


# Regexes to strip any field that might contain a secret from an error message.
_SECRET_RE = re.compile(
    r"'(password|user|encrypted_username|encrypted_password|token|api_key|secret)'\s*:\s*'[^']*'",
    re.IGNORECASE,
)


def _sanitize_error(err: str) -> str:
    if not err:
        return err
    return _SECRET_RE.sub(lambda m: f"'{m.group(1)}': '***REDACTED***'", err)


def create_job(user_id: str) -> SyncJob:
    job_id = str(uuid.uuid4())
    job = SyncJob(
        job_id=job_id,
        user_id=user_id,
        status="pending",
        started_at=datetime.now(timezone.utc),
    )
    _JOBS[job_id] = job
    return job


def get_job(job_id: str) -> Optional[SyncJob]:
    return _JOBS.get(job_id)


def list_user_jobs(user_id: str) -> list[SyncJob]:
    return [j for j in _JOBS.values() if j.user_id == user_id]


async def _run_historical(
    job_id: str,
    user_id: str,
    days: int,
    label: Optional[str],
    account_filter: Optional[str],
) -> None:
    job = _JOBS[job_id]
    job.status = "running"
    try:
        summary: Dict[str, Any] = await run_historical_sync(
            user_id=user_id, days=days, label=label, account_filter=account_filter,
        )
        job.trades_imported = int(summary.get("trades_imported", 0) or 0)
        job.accounts_synced = int(summary.get("accounts_synced", 0) or 0)
        if summary.get("errors"):
            job.error = _sanitize_error("; ".join(summary["errors"]))
        job.status = "completed"
    except Exception as e:  # noqa: BLE001
        logger.exception("Sync job %s failed", job_id)
        job.status = "failed"
        job.error = _sanitize_error(str(e))
    finally:
        job.completed_at = datetime.now(timezone.utc)
        _TASKS.pop(job_id, None)


def schedule_historical(
    user_id: str,
    days: int = 90,
    label: Optional[str] = None,
    account_filter: Optional[str] = None,
) -> SyncJob:
    job = create_job(user_id)
    task = asyncio.create_task(
        _run_historical(job.job_id, user_id, days, label, account_filter)
    )
    _TASKS[job.job_id] = task
    return job
