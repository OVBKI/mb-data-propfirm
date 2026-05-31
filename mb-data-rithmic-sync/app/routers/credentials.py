"""Endpoints to store/read/delete encrypted Rithmic credentials."""
from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from ..auth import current_user_id
from ..models import CredentialsIn, CredentialsOut
from ..sync_service import delete_credentials, get_credentials, upsert_credentials

router = APIRouter(prefix="/credentials", tags=["credentials"])


@router.post("", response_model=CredentialsOut)
async def store_credentials(
    body: CredentialsIn,
    user_id: str = Depends(current_user_id),
) -> CredentialsOut:
    """Encrypt and store Rithmic credentials. Overwrites any existing entry for this user."""
    await upsert_credentials(
        user_id=user_id,
        username=body.username,
        password=body.password,
        system_name=body.system_name,
    )
    return CredentialsOut(
        user_id=user_id,
        system_name=body.system_name,
        has_credentials=True,
        updated_at=datetime.now(timezone.utc),
    )


@router.get("", response_model=CredentialsOut)
async def get_credentials_status(user_id: str = Depends(current_user_id)) -> CredentialsOut:
    """Returns whether the user has credentials configured, but NEVER returns the actual creds."""
    creds = await get_credentials(user_id)
    if not creds:
        return CredentialsOut(
            user_id=user_id,
            system_name="",
            has_credentials=False,
            updated_at=datetime.now(timezone.utc),
        )
    return CredentialsOut(
        user_id=user_id,
        system_name=creds["system_name"],
        has_credentials=True,
        updated_at=datetime.now(timezone.utc),
    )


@router.delete("")
async def remove_credentials(user_id: str = Depends(current_user_id)) -> dict:
    """Delete the user's Rithmic credentials. Always returns 200 (idempotent)."""
    deleted = await delete_credentials(user_id)
    return {"deleted": bool(deleted)}
