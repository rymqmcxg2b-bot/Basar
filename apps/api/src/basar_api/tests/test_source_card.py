# SPDX-License-Identifier: Apache-2.0

from basar_api.schemas.source_card import SourceCard


def test_source_card_validation() -> None:
    card = SourceCard(id="src_test", title="Public domain record")
    assert card.id == "src_test"
    assert card.quality.needs_verification is True
