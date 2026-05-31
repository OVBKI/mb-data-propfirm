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
    """Schedule a historical sync job. Returns immediately with a job_id ; poll /jobs/{id}.

    If `label` is provided, syncs only that credentials set.
    If `label` is None, syncs ALL credentials sets sequentially.
    """
    return schedule_historical(
        user_id=user_id,
        days=body.days,
        label=body.label,
        account_filter=body.account_id,
    )


@router.get("/jobs/{job_id}", response_model=SyncJob)
async def get_sync_job(job_id: str, user_id: str = Depends(current_user_id)) -> SyncJob:
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="job not found")
    if job.user_id != user_id:
        raise HTTPException(status_code=404, detail="job not found")
    return job


@router.get("/jobs", response_model=list[SyncJob])
async def list_jobs(user_id: str = Depends(current_user_id)) -> list[SyncJob]:
    return list_user_jobs(user_id)


# ── Stubs (Phase 2) ────────────────────────────────────────────────────────

@router.post("/live/start", status_code=501)
async def start_live_stream(user_id: str = Depends(current_user_id)) -> dict:
    return {
        "status": "not_implemented",
        "detail": "Live streaming is a Phase 2 feature. Use POST /sync/historical for now.",
    }


@router.post("/live/stop", status_code=501)
async def stop_live_stream(user_id: str = Depends(current_user_id)) -> dict:
    return {"status": "not_implemented"}


@router.post("/polling/refresh", status_code=501)
async def polling_refresh(user_id: str = Depends(current_user_id)) -> dict:
    return {
        "status": "not_implemented",
        "detail": "Polling refresh is a Phase 2 feature.",
    }
