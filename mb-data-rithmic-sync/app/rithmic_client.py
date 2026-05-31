"""Thin wrapper around async_rithmic.RithmicClient — handles connect/disconnect lifecycle."""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import AsyncIterator

from async_rithmic import RithmicClient, SysInfraType
from async_rithmic.objects import RetrySettings

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
    # Fail-fast retry settings : 1 retry + 12s timeout instead of default 3×30s=90s
    # per call. This avoids 10+ minute sync hangs when Rithmic doesn't respond.
    fast_retry = RetrySettings(
        max_retries=1,
        timeout=12.0,
        jitter_range=(0.5, 1.0),
    )
    client = RithmicClient(
        user=user,
        password=password,
        system_name=system_name,
        app_name=APP_NAME,
        app_version=APP_VERSION,
        url=settings.rithmic_gateway_uri,
        retry_settings=fast_retry,
    )
    try:
        logger.info("Connecting to Rithmic gateway %s (system=%s, plants=[ORDER])",
                    settings.rithmic_gateway_uri, system_name)
        # Connect ONLY to the order plant. Lucid's API user (LT-*) typically has
        # permission denied (rpCode 13) on ticker/history/pnl plants, and async_rithmic
        # otherwise enters an infinite reconnection loop on the failing plant.
        await client.connect(plants=[SysInfraType.ORDER_PLANT])
        yield client
    finally:
        try:
            await client.disconnect(timeout=5.0)
        except Exception as e:
            logger.warning("Error during Rithmic disconnect : %s", e)
