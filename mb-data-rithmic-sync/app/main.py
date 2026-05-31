"""FastAPI entry point."""
from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import __version__
from .config import get_settings
from .routers import credentials, cron, health, sync

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("quantara-rithmic-sync")

settings = get_settings()

app = FastAPI(
    title="Quantara Rithmic Sync",
    version=__version__,
    description="Pulls Rithmic trades into Quantara's Supabase journal_entries.",
    docs_url="/docs",
    redoc_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(health.router)
app.include_router(credentials.router)
app.include_router(sync.router)
app.include_router(cron.router)


@app.on_event("startup")
async def on_startup() -> None:
    logger.info("Quantara Rithmic Sync v%s starting up", __version__)
    logger.info("CORS origins : %s", settings.cors_origins_list)
    logger.info("Rithmic gateway : %s", settings.rithmic_gateway_uri)


@app.on_event("shutdown")
async def on_shutdown() -> None:
    logger.info("Shutting down")
