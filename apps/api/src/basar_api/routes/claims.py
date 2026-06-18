# SPDX-License-Identifier: Apache-2.0

from fastapi import APIRouter
from basar_api.db import connect, list_claims, upsert_claim
from basar_api.schemas.claim_card import ClaimCard

router = APIRouter()


@router.get("/claims")
def all_claims() -> list[ClaimCard]:
    with connect() as conn:
        return [ClaimCard.model_validate(item) for item in list_claims(conn)]


@router.post("/claims")
def create_claim(card: ClaimCard) -> ClaimCard:
    with connect() as conn:
        upsert_claim(conn, card.id, card.claim, card.model_dump(mode="json"))
    return card
