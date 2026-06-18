# SPDX-License-Identifier: Apache-2.0

from basar_api.services.citation_service import no_sources_answer


def test_no_source_answer_has_no_hallucinated_citations() -> None:
    answer = no_sources_answer()
    assert answer.citations == []
    assert "No relevant local sources" in answer.answer
