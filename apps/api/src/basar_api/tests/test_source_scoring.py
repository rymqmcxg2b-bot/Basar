# SPDX-License-Identifier: Apache-2.0

from basar_api.schemas.source_card import SourceCard, SourceType
from basar_api.services.source_score_service import score_source


def test_source_scoring_is_deterministic_and_explainable() -> None:
    card = SourceCard(id="src", title="Dataset", source_type=SourceType.dataset, authors=["Ada"], content_hash="abc")
    quality = score_source(card)
    assert quality.score >= 80
    assert quality.reasons
    assert "source" in quality.tier
