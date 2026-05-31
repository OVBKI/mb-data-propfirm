"""Healthcheck endpoint — used by Railway healthcheck + uptime monitors."""
from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter

from .. import __version__

router = APIRouter(tags=["health"])


@router.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "service": "quantara-rithmic-sync",
        "version": __version__,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
