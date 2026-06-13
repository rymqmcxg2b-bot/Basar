# SPDX-License-Identifier: Apache-2.0

from hacker_librarian_api.schemas.answer import EvidenceItem, LibraryAnswer


def no_sources_answer() -> LibraryAnswer:
    return LibraryAnswer(
        answer="No relevant local sources were found, so I cannot answer with citations from this library.",
        citations=[],
        evidence=[],
        source_quality_notes=[],
        uncertainty="No retrieved evidence is available.",
        suggested_next_actions=["Ingest relevant primary sources.", "Add source metadata and run source scoring."],
    )


def build_answer(text: str, sources: list[dict]) -> LibraryAnswer:
    evidence = [
        EvidenceItem(
            source_id=s["id"],
            title=s["title"],
            excerpt=s.get("_excerpt") or s.get("summary") or "",
            quality_score=s.get("quality", {}).get("score", 0),
        )
        for s in sources
    ]
    return LibraryAnswer(
        answer=text,
        citations=[s["id"] for s in sources],
        evidence=evidence,
        source_quality_notes=[f"{s['id']}: {s.get('quality', {}).get('tier', 'unscored')}" for s in sources],
        uncertainty="This answer is limited to the retrieved local library sources.",
        suggested_next_actions=["Review cited source cards.", "Add opposing or corroborating sources if needed."],
    )
