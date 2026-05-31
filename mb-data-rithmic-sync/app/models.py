"""Pydantic request/response models."""
from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


# ── Credentials ────────────────────────────────────────────────────────────

class CredentialsIn(BaseModel):
    """Payload from Quantara to store Rithmic creds."""
    username: str = Field(min_length=1, max_length=200)
    password: str = Field(min_length=1, max_length=200)
    system_name: str = Field(min_length=1, max_length=80, description="e.g. 'TopstepTrader', 'Apex', 'Rithmic Paper Trading'")


class CredentialsOut(BaseModel):
    """Returned after storing — never contains the actual password."""
    user_id: str
    system_name: str
    has_credentials: bool
    updated_at: datetime


# ── Sync ───────────────────────────────────────────────────────────────────

SyncStatus = Literal["pending", "running", "completed", "failed"]


class HistoricalSyncIn(BaseModel):
    """Request to sync the last N days of fills."""
    days: int = Field(default=90, ge=1, le=365)
    # Optional account filter — if None, sync all accounts under the Rithmic login
    account_id: Optional[str] = Field(default=None, max_length=80)


class SyncJob(BaseModel):
    job_id: str
    user_id: str
    status: SyncStatus
    started_at: datetime
    completed_at: Optional[datetime] = None
    trades_imported: int = 0
    accounts_synced: int = 0
    error: Optional[str] = None
