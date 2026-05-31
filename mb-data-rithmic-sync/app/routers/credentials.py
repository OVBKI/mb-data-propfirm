"""Endpoints to manage Rithmic credentials (multi-credentials per user)."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from ..auth import current_user_id
from ..models import CredentialsIn, CredentialsOut
from ..sync_service import (
    delete_credentials_by_label,
    list_credentials_meta,
    upsert_credentials,
)

router = APIRouter(prefix="/credentials", tags=["credentials"])


@router.get("", response_model=list[CredentialsOut])
async def list_all(user_id: str = Depends(current_user_id)) -> list[CredentialsOut]:
    """List all credentials sets for the authenticated user (no passwords)."""
    rows = await list_credentials_meta(user_id)
    return [
        CredentialsOut(
            id=str(r["id"]),
            user_id=str(r["user_id"]),
            label=r["label"],
            system_name=r["system_name"],
            has_credentials=True,
            updated_at=r["updated_at"],
        )
        for r in rows
    ]


@router.post("", response_model=CredentialsOut)
async def add_or_update(
    body: CredentialsIn,
    user_id: str = Depends(current_user_id),
) -> CredentialsOut:
    """Add a new credentials set or update an existing one (matched by label)."""
    row = await upsert_credentials(
        user_id=user_id,
        label=body.label,
        username=body.username,
        password=body.password,
        system_name=body.system_name,
    )
    return CredentialsOut(
        id=str(row["id"]),
        user_id=str(row["user_id"]),
        label=row["label"],
        system_name=row["system_name"],
        has_credentials=True,
        updated_at=row["updated_at"],
    )


@router.delete("/{label}")
async def delete_by_label(
    label: str,
    user_id: str = Depends(current_user_id),
) -> dict:
    """Delete the credentials set with the given label (idempotent : 200 either way)."""
    deleted = await delete_credentials_by_label(user_id=user_id, label=label)
    return {"deleted": bool(deleted), "label": label}
