# SPDX-License-Identifier: Apache-2.0

from pydantic import BaseModel
from fastapi import APIRouter, HTTPException
from hacker_librarian_api.config import get_settings
from hacker_librarian_api.db import connect, get_source
from hacker_librarian_api.providers.storage_0g import ZeroGStorageProvider
from hacker_librarian_api.providers.ai_0g import ZeroGComputeProvider
from hacker_librarian_api.services.archive_service import archive_source_to_0g

router = APIRouter()


class ArchiveRequest(BaseModel):
    source_id: str
    dry_run: bool = True


@router.get("/0g/health")
async def og_health() -> dict:
    settings = get_settings()
    compute = await ZeroGComputeProvider(settings).health_check()
    storage = ZeroGStorageProvider(settings).health_check()
    return {"compute": compute, "storage": storage}


@router.post("/0g/archive-source")
def archive_source(req: ArchiveRequest) -> dict:
    with connect() as conn:
        source = get_source(conn, req.source_id)
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")
    return archive_source_to_0g(get_settings(), source, req.dry_run)
