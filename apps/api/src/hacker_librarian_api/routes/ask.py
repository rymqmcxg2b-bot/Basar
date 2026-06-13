# SPDX-License-Identifier: Apache-2.0

from pydantic import BaseModel
from fastapi import APIRouter
from hacker_librarian_api.config import get_settings
from hacker_librarian_api.db import connect
from hacker_librarian_api.schemas.answer import LibraryAnswer
from hacker_librarian_api.services.ai_service import get_ai_provider
from hacker_librarian_api.services.citation_service import build_answer, no_sources_answer
from hacker_librarian_api.services.retrieval_service import retrieve

router = APIRouter()


class AskRequest(BaseModel):
    question: str
    limit: int = 5


@router.post("/ask")
async def ask(req: AskRequest) -> LibraryAnswer:
    with connect() as conn:
        sources = retrieve(conn, req.question, req.limit)
    if not sources:
        return no_sources_answer()
    provider = get_ai_provider(get_settings())
    generated = await provider.generate(req.question, sources, {"require_citations": True})
    return build_answer(generated, sources)
