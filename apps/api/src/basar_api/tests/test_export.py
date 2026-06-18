# SPDX-License-Identifier: Apache-2.0

from basar_api.db import connect, export_library, upsert_source
from basar_api.schemas.source_card import SourceCard


def test_export_works(tmp_path) -> None:
    with connect(str(tmp_path / "library.sqlite")) as conn:
        card = SourceCard(id="src_export", title="Exportable")
        upsert_source(conn, card.id, card.title, card.model_dump(mode="json"), "")
        exported = export_library(conn)
    assert exported["sources"][0]["id"] == "src_export"
