# SPDX-License-Identifier: Apache-2.0

import json
import sqlite3
from pathlib import Path
from typing import Any

from hacker_librarian_api.config import get_settings


def connect(db_path: str | None = None) -> sqlite3.Connection:
    path = Path(db_path or get_settings().database_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    init_db(conn)
    return conn


def init_db(conn: sqlite3.Connection) -> None:
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS sources (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          card_json TEXT NOT NULL,
          content TEXT NOT NULL DEFAULT ''
        );
        CREATE TABLE IF NOT EXISTS claims (
          id TEXT PRIMARY KEY,
          claim TEXT NOT NULL,
          card_json TEXT NOT NULL
        );
        CREATE VIRTUAL TABLE IF NOT EXISTS source_fts
        USING fts5(id UNINDEXED, title, content);
        """
    )
    conn.commit()


def upsert_source(conn: sqlite3.Connection, source_id: str, title: str, card: dict[str, Any], content: str = "") -> None:
    payload = json.dumps(card, default=str, ensure_ascii=False)
    conn.execute(
        "INSERT OR REPLACE INTO sources (id, title, card_json, content) VALUES (?, ?, ?, ?)",
        (source_id, title, payload, content),
    )
    conn.execute("DELETE FROM source_fts WHERE id = ?", (source_id,))
    conn.execute("INSERT INTO source_fts (id, title, content) VALUES (?, ?, ?)", (source_id, title, content))
    conn.commit()


def get_source(conn: sqlite3.Connection, source_id: str) -> dict[str, Any] | None:
    row = conn.execute("SELECT card_json FROM sources WHERE id = ?", (source_id,)).fetchone()
    return json.loads(row["card_json"]) if row else None


def list_sources(conn: sqlite3.Connection) -> list[dict[str, Any]]:
    rows = conn.execute("SELECT card_json FROM sources ORDER BY title").fetchall()
    return [json.loads(row["card_json"]) for row in rows]


def upsert_claim(conn: sqlite3.Connection, claim_id: str, claim: str, card: dict[str, Any]) -> None:
    conn.execute(
        "INSERT OR REPLACE INTO claims (id, claim, card_json) VALUES (?, ?, ?)",
        (claim_id, claim, json.dumps(card, default=str, ensure_ascii=False)),
    )
    conn.commit()


def list_claims(conn: sqlite3.Connection) -> list[dict[str, Any]]:
    rows = conn.execute("SELECT card_json FROM claims ORDER BY claim").fetchall()
    return [json.loads(row["card_json"]) for row in rows]


def search_sources(conn: sqlite3.Connection, query: str, limit: int = 5) -> list[dict[str, Any]]:
    try:
        rows = conn.execute(
            """
            SELECT s.card_json, snippet(source_fts, 2, '[', ']', '...', 24) AS excerpt
            FROM source_fts JOIN sources s ON source_fts.id = s.id
            WHERE source_fts MATCH ?
            LIMIT ?
            """,
            (query, limit),
        ).fetchall()
    except sqlite3.OperationalError:
        like = f"%{query}%"
        rows = conn.execute(
            "SELECT card_json, substr(content, 1, 500) AS excerpt FROM sources WHERE title LIKE ? OR content LIKE ? LIMIT ?",
            (like, like, limit),
        ).fetchall()
    results = []
    for row in rows:
        card = json.loads(row["card_json"])
        card["_excerpt"] = row["excerpt"] or card.get("summary") or ""
        results.append(card)
    return results


def export_library(conn: sqlite3.Connection) -> dict[str, Any]:
    return {"sources": list_sources(conn), "claims": list_claims(conn)}
