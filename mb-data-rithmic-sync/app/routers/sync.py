"""Sync endpoints — historical (live), polling (stub), live stream (stub)."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from ..auth import current_user_id
from ..jobs import get_job, list_user_jobs, schedule_historical
from ..models import HistoricalSyncIn, SyncJob

router = APIRouter(prefix="/sync", tags=["sync"])


@router.post("/historical", response_model=SyncJob, status_code=202)
async def start_historical_sync(
    body: HistoricalSyncIn,
    user_id: str = Depends(current_user_id),
) -> SyncJob:
    """Schedule a historical sync job. Returns immediately with a job_id ; poll /jobs/{id}."""
    job = schedule_historical(user_id=user_id, days=body.days, account_filter=body.account_id)
    return job


@router.get("/jobs/{job_id}", response_model=SyncJob)
async def get_sync_job(job_id: str, user_id: str = Depends(current_user_id)) -> SyncJob:
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="job not found")
    if job.user_id != user_id:
        # Don't leak existence of other users' jobs
        raise HTTPException(status_code=404, detail="job not found")
    return job


@router.get("/jobs", response_model=list[SyncJob])
async def list_jobs(user_id: str = Depends(current_user_id)) -> list[SyncJob]:
    return list_user_jobs(user_id)


# ── Live stream (Phase 2) ──────────────────────────────────────────────────

@router.post("/live/start", status_code=501)
async def start_live_stream(user_id: str = Depends(current_user_id)) -> dict:
    """Phase 2 : open a persistent WebSocket connection to Rithmic and stream new fills.

    Requires :
      - A persistent worker process (Railway 'Worker' service, not just web)
      - A connection pool keyed by user_id
      - Either a server-sent-events endpoint OR a Supabase Realtime channel for push
    """
    return {
        "status": "not_implemented",
        "detail": "Live streaming is a Phase 2 feature. Use POST /sync/historical for now.",
    }


@router.post("/live/stop", status_code=501)
async def stop_live_stream(user_id: str = Depends(current_user_id)) -> dict:
    return {"status": "not_implemented"}


# ── Polling cron (Phase 2) ─────────────────────────────────────────────────

@router.post("/polling/refresh", status_code=501)
async def polling_refresh(user_id: str = Depends(current_user_id)) -> dict:
    """Phase 2 : called by a cron (every N min) to pull the latest fills since last sync.

    Will need :
      - A `last_synced_at` column on rithmic_credentials
      - Cron-friendly auth (separate service token, not user JWT)
    """
    return {
        "status": "not_implemented",
        "detail": "Polling refresh is a Phase 2 feature.",
    }
