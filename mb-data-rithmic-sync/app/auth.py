"""Verify Supabase JWT tokens sent by Quantara (Next.js) on every request."""
from __future__ import annotations

import jwt
from fastapi import Depends, Header, HTTPException, status

from .config import get_settings


def _bearer_token(authorization: str | None) -> str:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="missing bearer token")
    return authorization.split(" ", 1)[1].strip()


def verify_user(authorization: str | None = Header(default=None)) -> dict:
    """Decode and verify the JWT, return the payload (incl. `sub` = user_id)."""
    token = _bearer_token(authorization)
    settings = get_settings()
    try:
        # Supabase JWT is HS256, signed with the project's JWT secret
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="token expired")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"invalid token: {e}")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="token missing 'sub' claim")
    return payload


def current_user_id(payload: dict = Depends(verify_user)) -> str:
    """FastAPI dependency that yields the Supabase user_id (uuid string)."""
    return payload["sub"]
