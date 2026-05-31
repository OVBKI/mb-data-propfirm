"""Centralised settings — loaded from environment variables."""
from __future__ import annotations

from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Supabase
    supabase_url: str
    supabase_service_role_key: str
    supabase_jwt_secret: str

    # Encryption
    encryption_key: str  # Fernet base64-encoded 32-byte key

    # Rithmic
    rithmic_gateway_uri: str = "wss://rituz00100.rithmic.com:443"
    rithmic_system_name: str = "Rithmic Paper Trading"

    # CORS
    cors_origins: str = "http://localhost:3000"

    # Defaults
    default_sync_days: int = 90

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
