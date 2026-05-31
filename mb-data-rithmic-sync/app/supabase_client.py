"""Supabase client wrapper — uses service-role key to bypass RLS.

The service role is required because :
- The Rithmic sync service runs ON BEHALF of the user (we already verified their JWT)
- It needs to write to `journal_entries` for any user_id, which RLS would block with the anon key
- It needs to read/write `rithmic_credentials` (which we lock down via RLS so anon CANNOT read)
"""
from __future__ import annotations

from functools import lru_cache

from supabase import Client, create_client

from .config import get_settings


def _project_base(url: str) -> str:
    """Strip any trailing /rest/v1 or /auth/v1 from a SUPABASE_URL — supabase-py
    expects the project root only (e.g. https://xxx.supabase.co)."""
    base = url.rstrip("/")
    for suffix in ("/rest/v1", "/auth/v1"):
        if base.endswith(suffix):
            base = base[: -len(suffix)]
    return base


@lru_cache(maxsize=1)
def get_supabase() -> Client:
    settings = get_settings()
    base_url = _project_base(settings.supabase_url)
    return create_client(base_url, settings.supabase_service_role_key)
