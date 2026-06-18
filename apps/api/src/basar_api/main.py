# SPDX-License-Identifier: Apache-2.0

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from basar_api.config import get_settings
from basar_api.routes import ask, claims, export, health, ingest, og, sources

settings = get_settings()

app = FastAPI(
    title="Basar API",
    version="0.1.0-alpha",
    description="Local-first, source-preserving research librarian API.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials="*" not in settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(sources.router)
app.include_router(claims.router)
app.include_router(ingest.router)
app.include_router(ask.router)
app.include_router(export.router)
app.include_router(og.router)
