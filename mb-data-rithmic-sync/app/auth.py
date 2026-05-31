"""Verify Supabase JWT tokens sent by Quantara (Next.js) on every request.

Supports BOTH JWT signing modes that Supabase projects can use :
  1. Legacy HS256 (signed with the project's JWT Secret)
  2. New asymmetric (ES256 / RS256) via JWKS — Supabase's 2025+ default

Tries HS256 first (cheap, no network call). If it fails with a signature error,
falls back to the JWKS endpoint and tries asymmetric verification.
"""
from __future__ import annotations

import logging
from functools import lru_cache

import jwt
from fastapi import Depends, Header, HTTPException, status

from .config import get_settings

logger = logging.getLogger("auth")


def _bearer_token(authorization: str | None) -> str:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="missing bearer token")
    return authorization.split(" ", 1)[1].strip()


@lru_cache(maxsize=1)
def _jwks_client() -> jwt.PyJWKClient | None:
    """Lazy-initialised JWKS client pointing at the project's Supabase auth endpoint."""
    settings = get_settings()
    base = settings.supabase_url.rstrip("/")
    # Supabase exposes JWKS at this path for the new signing keys
    jwks_url = f"{base}/auth/v1/.well-known/jwks.json"
    try:
        return jwt.PyJWKClient(jwks_url, cache_keys=True)
    except Exception as e:  # noqa: BLE001
        logger.warning("Failed to init JWKS client (%s) — falling back to HS256 only", e)
        return None


def _decode_with_hs256(token: str, secret: str) -> dict:
    """Try HS256 with the legacy secret. Tries with audience first, then without."""
    # Most Supabase tokens have aud='authenticated' but some don't — try both.
    try:
        return jwt.decode(token, secret, algorithms=["HS256"], audience="authenticated")
    except jwt.InvalidAudienceError:
        return jwt.decode(token, secret, algorithms=["HS256"], options={"verify_aud": False})


def _decode_with_jwks(token: str) -> dict:
    """Try asymmetric verification using the project's JWKS endpoint."""
    client = _jwks_client()
    if not client:
        raise jwt.InvalidTokenError("JWKS client unavailable")
    signing_key = client.get_signing_key_from_jwt(token)
    try:
        return jwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256", "RS256", "EdDSA"],
            audience="authenticated",
        )
    except jwt.InvalidAudienceError:
        return jwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256", "RS256", "EdDSA"],
            options={"verify_aud": False},
        )


def verify_user(authorization: str | None = Header(default=None)) -> dict:
    """Decode and verify the JWT, return the payload (incl. `sub` = user_id)."""
    token = _bearer_token(authorization)
    settings = get_settings()

    last_error: Exception | None = None

    # 1. Try HS256 with the legacy secret (fast path for non-migrated projects).
    try:
        payload = _decode_with_hs256(token, settings.supabase_jwt_secret)
        logger.debug("Token verified via HS256 legacy secret")
        return _extract_sub(payload)
    except jwt.ExpiredSignatureError as e:
        logger.info("Token expired")
        raise HTTPException(status_code=401, detail="token expired") from e
    except jwt.InvalidSignatureError as e:
        # Likely a token signed with the new asymmetric key → try JWKS
        last_error = e
        logger.info("HS256 signature mismatch — trying JWKS fallback")
    except jwt.InvalidTokenError as e:
        last_error = e
        logger.info("HS256 decode failed (%s) — trying JWKS fallback", e)

    # 2. Fall back to JWKS (asymmetric) verification.
    try:
        payload = _decode_with_jwks(token)
        logger.debug("Token verified via JWKS asymmetric keys")
        return _extract_sub(payload)
    except jwt.ExpiredSignatureError as e:
        raise HTTPException(status_code=401, detail="token expired") from e
    except jwt.InvalidTokenError as e:
        logger.warning("JWKS verification also failed : %s", e)
        # Surface the most informative error
        detail = f"invalid token (tried HS256 + JWKS) : {e or last_error}"
        raise HTTPException(status_code=401, detail=detail) from e


def _extract_sub(payload: dict) -> dict:
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="token missing 'sub' claim")
    return payload


def current_user_id(payload: dict = Depends(verify_user)) -> str:
    """FastAPI dependency that yields the Supabase user_id (uuid string)."""
    return payload["sub"]
