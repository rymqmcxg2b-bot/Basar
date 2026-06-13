# SPDX-License-Identifier: Apache-2.0

from hacker_librarian_api.schemas.claim_card import ClaimCard


def test_claim_card_validation() -> None:
    card = ClaimCard(id="claim_test", claim="A source should cite evidence.", confidence=0.5)
    assert card.claim_type == "unknown"
    assert card.confidence == 0.5
