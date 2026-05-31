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


@lru_cache(maxsize=1)
def get_supabase() -> Client:
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_service_role_key)
