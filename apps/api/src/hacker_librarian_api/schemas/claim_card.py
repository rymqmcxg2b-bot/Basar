# SPDX-License-Identifier: Apache-2.0

from datetime import datetime, timezone
from enum import Enum
from pydantic import BaseModel, Field


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


class ClaimType(str, Enum):
    factual = "factual"
    empirical = "empirical"
    theoretical = "theoretical"
    interpretive = "interpretive"
    normative = "normative"
    predictive = "predictive"
    disputed = "disputed"
    unknown = "unknown"


class ClaimStatus(str, Enum):
    supported = "supported"
    contested = "contested"
    contradicted = "contradicted"
    insufficient_evidence = "insufficient_evidence"
    deprecated = "deprecated"
    unknown = "unknown"


class ClaimCard(BaseModel):
    id: str
    claim: str
    claim_type: ClaimType = ClaimType.unknown
    domains: list[str] = Field(default_factory=list)
    status: ClaimStatus = ClaimStatus.unknown
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    supporting_source_ids: list[str] = Field(default_factory=list)
    opposing_source_ids: list[str] = Field(default_factory=list)
    evidence_type: str | None = None
    uncertainty_notes: str | None = None
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)
    last_reviewed_at: datetime | None = None
