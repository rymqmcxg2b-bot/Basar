# SPDX-License-Identifier: Apache-2.0

from datetime import datetime, timezone
from enum import Enum

from pydantic import BaseModel, Field


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


class KnowledgeCardStatus(str, Enum):
    draft = "draft"
    needs_review = "needs_review"
    reviewed = "reviewed"
    deprecated = "deprecated"


class KnowledgeCard(BaseModel):
    id: str
    title: str
    summary: str
    source_ids: list[str] = Field(default_factory=list)
    claim_ids: list[str] = Field(default_factory=list)
    evidence_notes: list[str] = Field(default_factory=list)
    validation_status: KnowledgeCardStatus = KnowledgeCardStatus.draft
    validation_notes: list[str] = Field(default_factory=list)
    provenance: list[str] = Field(default_factory=list)
    storage_pointer: str | None = None
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)
