# SPDX-License-Identifier: Apache-2.0

from pydantic import BaseModel, Field


class EvidenceItem(BaseModel):
    source_id: str
    title: str
    excerpt: str
    quality_score: int


class LibraryAnswer(BaseModel):
    answer: str
    citations: list[str] = Field(default_factory=list)
    evidence: list[EvidenceItem] = Field(default_factory=list)
    source_quality_notes: list[str] = Field(default_factory=list)
    counter_evidence: list[EvidenceItem] = Field(default_factory=list)
    uncertainty: str
    suggested_next_actions: list[str] = Field(default_factory=list)
