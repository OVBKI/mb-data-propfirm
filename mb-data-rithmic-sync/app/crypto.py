"""Encrypt / decrypt Rithmic credentials using Fernet (symmetric AES-128-CBC + HMAC-SHA256)."""
from __future__ import annotations

from functools import lru_cache

from cryptography.fernet import Fernet, InvalidToken

from .config import get_settings


@lru_cache(maxsize=1)
def _fernet() -> Fernet:
    settings = get_settings()
    key = settings.encryption_key.encode("utf-8")
    return Fernet(key)


def encrypt(plaintext: str) -> str:
    """Encrypt a string. Returns base64-encoded Fernet token."""
    if plaintext is None:
        raise ValueError("encrypt: plaintext is None")
    return _fernet().encrypt(plaintext.encode("utf-8")).decode("utf-8")


def decrypt(token: str) -> str:
    """Decrypt a Fernet token. Raises ValueError on bad token."""
    try:
        return _fernet().decrypt(token.encode("utf-8")).decode("utf-8")
    except InvalidToken as e:
        raise ValueError("invalid encrypted token (key rotated or data tampered)") from e
