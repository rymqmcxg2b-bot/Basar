# SPDX-License-Identifier: Apache-2.0

from basar_api.db import connect, upsert_source
from basar_api.schemas.source_card import SourceCard
from basar_api.services.retrieval_service import retrieve


def test_retrieval_returns_known_source(tmp_path) -> None:
    db = tmp_path / "library.sqlite"
    with connect(str(db)) as conn:
        card = SourceCard(id="src_retrieval", title="Local-first archives", summary="local archives preserve evidence")
        upsert_source(conn, card.id, card.title, card.model_dump(mode="json"), "local archives preserve evidence")
        results = retrieve(conn, "local evidence")
    assert results[0]["id"] == "src_retrieval"
