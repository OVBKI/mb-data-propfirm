"""Verify Supabase JWT tokens sent by Quantara (Next.js) on every request.

Supports BOTH JWT signing modes that Supabase projects can use :
  1. Legacy HS256 (signed with the project's JWT Secret)
  2. New asymmetric (ES256 / RS256) via JWKS — Supabase's 2025+ default

Tries HS256 first (cheap, no network call). If it fails with a signature error
or algorithm mismatch, falls back to fetching Supabase's JWKS (which requires
the `apikey` header — that's why we can't use PyJWKClient's default fetcher).
"""
from __future__ import annotations

import json
import logging
from functools import lru_cache

import httpx
import jwt
from fastapi import Depends, Header, HTTPException, status
from jwt.algorithms import ECAlgorithm, RSAAlgorithm

from .config import get_settings

logger = logging.getLogger("auth")

# Supabase's JWKS endpoint is documented but requires an apikey header.
# We cache the JWKS for the lifetime of the worker — keys only rotate rarely.
_JWKS_CACHE: dict | None = None


def _bearer_token(authorization: str | None) -> str:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="missing bearer token")
    return authorization.split(" ", 1)[1].strip()


def _fetch_jwks() -> dict:
    """Fetch Supabase JWKS using the apikey header. Cached after first call."""
    global _JWKS_CACHE
    if _JWKS_CACHE is not None:
        return _JWKS_CACHE
    settings = get_settings()
    base = settings.supabase_url.rstrip("/")
    url = f"{base}/auth/v1/.well-known/jwks.json"
    # Supabase requires `apikey` header on auth endpoints; service_role works.
    headers = {"apikey": settings.supabase_service_role_key}
    logger.info("Fetching JWKS from %s", url)
    r = httpx.get(url, headers=headers, timeout=10.0)
    r.raise_for_status()
    _JWKS_CACHE = r.json()
    n = len(_JWKS_CACHE.get("keys", []))
    logger.info("JWKS fetched : %d signing key(s) cached", n)
    return _JWKS_CACHE


def _signing_key_for(kid: str, alg: str):
    """Look up a JWK by kid and convert it to a PyJWT-compatible signing key."""
    jwks = _fetch_jwks()
    matching = next((k for k in jwks.get("keys", []) if k.get("kid") == kid), None)
    if not matching:
        # Try refreshing the cache once (in case keys rotated)
        global _JWKS_CACHE
        _JWKS_CACHE = None
        jwks = _fetch_jwks()
        matching = next((k for k in jwks.get("keys", []) if k.get("kid") == kid), None)
    if not matching:
        raise jwt.InvalidTokenError(f"no JWK found for kid={kid}")
    jwk_json = json.dumps(matching)
    a = alg.upper()
    if a.startswith("RS") or a.startswith("PS"):
        return RSAAlgorithm.from_jwk(jwk_json)
    if a.startswith("ES"):
        return ECAlgorithm.from_jwk(jwk_json)
    raise jwt.InvalidTokenError(f"unsupported JWT algorithm : {alg}")


def _decode_with_hs256(token: str, secret: str) -> dict:
    """Try HS256 with the legacy secret. Tries with audience first, then without."""
    try:
        return jwt.decode(token, secret, algorithms=["HS256"], audience="authenticated")
    except jwt.InvalidAudienceError:
        return jwt.decode(token, secret, algorithms=["HS256"], options={"verify_aud": False})


def _decode_with_jwks(token: str) -> dict:
    """Verify token with the matching key from Supabase's JWKS."""
    header = jwt.get_unverified_header(token)
    kid = header.get("kid")
    alg = header.get("alg", "ES256")
    if not kid:
        raise jwt.InvalidTokenError("token header missing 'kid'")
    signing_key = _signing_key_for(kid, alg)
    try:
        return jwt.decode(token, signing_key, algorithms=[alg], audience="authenticated")
    except jwt.InvalidAudienceError:
        return jwt.decode(token, signing_key, algorithms=[alg], options={"verify_aud": False})


def verify_user(authorization: str | None = Header(default=None)) -> dict:
    """Decode and verify the JWT, return the payload (incl. `sub` = user_id)."""
    token = _bearer_token(authorization)
    settings = get_settings()
    last_error: Exception | None = None

    # 1. Fast path : HS256 with legacy secret (non-migrated projects)
    try:
        payload = _decode_with_hs256(token, settings.supabase_jwt_secret)
        logger.debug("Token verified via HS256 legacy secret")
        return _extract_sub(payload)
    except jwt.ExpiredSignatureError as e:
        raise HTTPException(status_code=401, detail="token expired") from e
    except (jwt.InvalidSignatureError, jwt.InvalidAlgorithmError) as e:
        last_error = e
        logger.info("HS256 not applicable (%s) — trying JWKS fallback", type(e).__name__)
    except jwt.InvalidTokenError as e:
        last_error = e
        logger.info("HS256 decode failed (%s) — trying JWKS fallback", e)

    # 2. Asymmetric path : fetch JWKS from Supabase and verify
    try:
        payload = _decode_with_jwks(token)
        logger.debug("Token verified via JWKS asymmetric keys")
        return _extract_sub(payload)
    except jwt.ExpiredSignatureError as e:
        raise HTTPException(status_code=401, detail="token expired") from e
    except httpx.HTTPError as e:
        logger.exception("JWKS fetch failed")
        raise HTTPException(status_code=500, detail=f"JWKS fetch failed : {e}") from e
    except jwt.InvalidTokenError as e:
        logger.warning("JWKS verification failed : %s", e)
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
