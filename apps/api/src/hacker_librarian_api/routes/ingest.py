# SPDX-License-Identifier: Apache-2.0

from pydantic import BaseModel
from fastapi import APIRouter
from hacker_librarian_api.config import get_settings
from hacker_librarian_api.db import connect
from hacker_librarian_api.schemas.source_card import SourceCard
from hacker_librarian_api.services.ingest_service import ingest_file, ingest_url

router = APIRouter()


class FileIngestRequest(BaseModel):
    path: str
    title: str | None = None


class UrlIngestRequest(BaseModel):
    url: str
    title: str | None = None


@router.post("/ingest/file")
def ingest_file_route(req: FileIngestRequest) -> SourceCard:
    with connect() as conn:
        return ingest_file(conn, get_settings(), req.path, req.title)


@router.post("/ingest/url")
def ingest_url_route(req: UrlIngestRequest) -> SourceCard:
    with connect() as conn:
        return ingest_url(conn, get_settings(), req.url, req.title)
