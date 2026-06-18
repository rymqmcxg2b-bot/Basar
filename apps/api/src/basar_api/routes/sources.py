# SPDX-License-Identifier: Apache-2.0

from fastapi import APIRouter, HTTPException
from basar_api.db import connect, get_source, list_sources, upsert_source
from basar_api.schemas.source_card import SourceCard
from basar_api.services.source_score_service import score_source

router = APIRouter()


@router.get("/sources")
def all_sources() -> list[SourceCard]:
    with connect() as conn:
        return [SourceCard.model_validate(item) for item in list_sources(conn)]


@router.post("/sources")
def create_source(card: SourceCard) -> SourceCard:
    with connect() as conn:
        upsert_source(conn, card.id, card.title, card.model_dump(mode="json"), card.summary or "")
    return card


@router.get("/sources/{source_id}")
def one_source(source_id: str) -> SourceCard:
    with connect() as conn:
        data = get_source(conn, source_id)
    if not data:
        raise HTTPException(status_code=404, detail="Source not found")
    return SourceCard.model_validate(data)


@router.post("/sources/{source_id}/score")
def score_existing_source(source_id: str) -> SourceCard:
    with connect() as conn:
        data = get_source(conn, source_id)
        if not data:
            raise HTTPException(status_code=404, detail="Source not found")
        card = SourceCard.model_validate(data)
        card.quality = score_source(card)
        upsert_source(conn, card.id, card.title, card.model_dump(mode="json"), card.summary or "")
    return card
