# SPDX-License-Identifier: Apache-2.0

from hacker_librarian_api.schemas.source_card import SourceCard, SourceQuality


TIERS = [
    (90, "core high-trust source"),
    (75, "strong source, verify in important contexts"),
    (60, "useful but not sufficient alone"),
    (40, "lead/source clue only"),
    (0, "low-trust or unreliable"),
]


def tier_for(score: int) -> str:
    for minimum, tier in TIERS:
        if score >= minimum:
            return tier
    return "low-trust or unreliable"


def score_source(card: SourceCard) -> SourceQuality:
    score = 45
    reasons: list[str] = []
    warnings: list[str] = []

    if card.source_type.value in {"primary_document", "official_record", "legal_document", "dataset"}:
        score += 25
        reasons.append("Source type is close to primary evidence.")
    elif card.source_type.value in {"academic_paper", "code_repository"}:
        score += 18
        reasons.append("Source type can provide inspectable methods or artifacts.")
    elif card.source_type.value in {"news_report", "web_page"}:
        score += 8
        reasons.append("Source may be useful but should be corroborated.")
    elif card.source_type.value in {"commentary", "social_media"}:
        score -= 8
        warnings.append("Commentary or social media should not be treated as sufficient evidence alone.")
    else:
        warnings.append("Unknown source type requires manual verification.")

    if card.authors:
        score += 8
        reasons.append("Author information is present.")
    else:
        score -= 5
        warnings.append("Missing author information.")

    if card.identifiers.doi or card.identifiers.isbn or card.identifiers.arxiv_id:
        score += 8
        reasons.append("Stable identifier is present.")

    if card.content_hash:
        score += 7
        reasons.append("Content hash preserves an audit trail.")

    if card.url or card.local_path:
        score += 5
        reasons.append("Source has a retrievable location.")

    if "sensational" in " ".join(card.tags).lower():
        score -= 15
        warnings.append("Sensationalism flag lowers confidence.")

    if card.quality.conflict_of_interest_notes:
        score -= 7
        warnings.append("Conflict-of-interest note requires review.")

    score = max(0, min(100, score))
    return SourceQuality(
        score=score,
        tier=tier_for(score),
        reasons=reasons or ["Deterministic baseline score applied."],
        evidence_type=card.quality.evidence_type,
        needs_verification=score < 90,
        primary_source_status="likely_primary" if card.source_type.value in {"primary_document", "official_record", "dataset"} else "unknown",
        conflict_of_interest_notes=card.quality.conflict_of_interest_notes,
        verification_warnings=warnings,
    )
