# SPDX-License-Identifier: Apache-2.0

from datetime import datetime, timezone
from enum import Enum
from pydantic import BaseModel, Field


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


class SourceType(str, Enum):
    primary_document = "primary_document"
    academic_paper = "academic_paper"
    book = "book"
    dataset = "dataset"
    official_record = "official_record"
    legal_document = "legal_document"
    news_report = "news_report"
    commentary = "commentary"
    social_media = "social_media"
    code_repository = "code_repository"
    web_page = "web_page"
    unknown = "unknown"


class Identifiers(BaseModel):
    doi: str | None = None
    isbn: str | None = None
    arxiv_id: str | None = None
    other: dict[str, str] = Field(default_factory=dict)


class SourceQuality(BaseModel):
    score: int = Field(default=0, ge=0, le=100)
    tier: str = "unscored"
    reasons: list[str] = Field(default_factory=list)
    evidence_type: str | None = None
    needs_verification: bool = True
    primary_source_status: str = "unknown"
    conflict_of_interest_notes: str | None = None
    verification_warnings: list[str] = Field(default_factory=list)


class SourceCard(BaseModel):
    id: str
    title: str
    authors: list[str] = Field(default_factory=list)
    source_type: SourceType = SourceType.unknown
    url: str | None = None
    identifiers: Identifiers = Field(default_factory=Identifiers)
    publication_date: str | None = None
    acquired_at: datetime = Field(default_factory=now_utc)
    acquired_from: str | None = None
    local_path: str | None = None
    archived_uri: str | None = None
    content_hash: str | None = None
    language: str = "unknown"
    domains: list[str] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)
    quality: SourceQuality = Field(default_factory=SourceQuality)
    summary: str | None = None
    extracted_claim_ids: list[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)
