# SPDX-License-Identifier: Apache-2.0

import hashlib
import uuid
from pathlib import Path
from urllib.parse import urlparse

from basar_api.config import Settings
from basar_api.db import upsert_source
from basar_api.providers.storage_local import LocalStorageProvider
from basar_api.schemas.source_card import SourceCard, SourceType
from basar_api.services.source_score_service import score_source


def sha256_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def guess_source_type(path_or_url: str) -> SourceType:
    if path_or_url.endswith((".md", ".txt")):
        return SourceType.primary_document
    if urlparse(path_or_url).scheme:
        return SourceType.web_page
    return SourceType.unknown


def ingest_file(conn, settings: Settings, path: str, title: str | None = None) -> SourceCard:
    file_path = Path(path)
    content = file_path.read_text(encoding="utf-8", errors="replace")
    storage = LocalStorageProvider(settings.archive_dir)
    archived_path = storage.put_file(str(file_path), {"kind": "source"})
    card = SourceCard(
        id=f"src_{uuid.uuid4().hex[:12]}",
        title=title or file_path.stem.replace("-", " ").replace("_", " ").title(),
        source_type=guess_source_type(str(file_path)),
        acquired_from=str(file_path),
        local_path=str(file_path),
        archived_uri=archived_path,
        content_hash=sha256_text(content),
        summary=content[:500],
    )
    card.quality = score_source(card)
    upsert_source(conn, card.id, card.title, card.model_dump(mode="json"), content)
    return card


def ingest_url(conn, settings: Settings, url: str, title: str | None = None) -> SourceCard:
    parsed = urlparse(url)
    display_title = title or parsed.netloc + parsed.path
    content = f"URL metadata record for {url}. Full content fetching is intentionally limited in the MVP."
    card = SourceCard(
        id=f"src_{uuid.uuid4().hex[:12]}",
        title=display_title,
        source_type=SourceType.web_page,
        url=url,
        acquired_from=url,
        content_hash=sha256_text(content),
        summary=content,
    )
    card.quality = score_source(card)
    upsert_source(conn, card.id, card.title, card.model_dump(mode="json"), content)
    return card
