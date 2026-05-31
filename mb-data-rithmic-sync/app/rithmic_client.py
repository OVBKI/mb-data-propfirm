"""Thin wrapper around async_rithmic.RithmicClient — handles connect/disconnect lifecycle."""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import AsyncIterator

from async_rithmic import RithmicClient

from .config import get_settings

logger = logging.getLogger(__name__)

APP_NAME = "Quantara"
APP_VERSION = "0.1.0"


@asynccontextmanager
async def rithmic_session(
    user: str,
    password: str,
    system_name: str,
) -> AsyncIterator[RithmicClient]:
    """Async context manager : connects, yields the client, disconnects cleanly.

    Usage:
        async with rithmic_session(user, pwd, system) as client:
            accounts = await client.list_accounts()
    """
    settings = get_settings()
    client = RithmicClient(
        user=user,
        password=password,
        system_name=system_name,
        app_name=APP_NAME,
        app_version=APP_VERSION,
        url=settings.rithmic_gateway_uri,
    )
    try:
        logger.info("Connecting to Rithmic gateway %s (system=%s)", settings.rithmic_gateway_uri, system_name)
        await client.connect()
        yield client
    finally:
        try:
            await client.disconnect(timeout=5.0)
        except Exception as e:
            logger.warning("Error during Rithmic disconnect : %s", e)
