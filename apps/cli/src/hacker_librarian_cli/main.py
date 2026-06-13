# SPDX-License-Identifier: Apache-2.0

import argparse
import asyncio
import json
from pathlib import Path

from hacker_librarian_api.config import get_settings
from hacker_librarian_api.db import connect, export_library, get_source, init_db, list_sources, upsert_source
from hacker_librarian_api.schemas.source_card import SourceCard
from hacker_librarian_api.services.ai_service import get_ai_provider
from hacker_librarian_api.services.archive_service import archive_source_to_0g
from hacker_librarian_api.services.citation_service import build_answer, no_sources_answer
from hacker_librarian_api.services.ingest_service import ingest_file, ingest_url
from hacker_librarian_api.services.retrieval_service import retrieve
from hacker_librarian_api.services.source_score_service import score_source


def print_json(obj) -> None:
    if hasattr(obj, "model_dump"):
        obj = obj.model_dump(mode="json")
    print(json.dumps(obj, indent=2, ensure_ascii=False, default=str))


async def ask_question(question: str) -> None:
    settings = get_settings()
    with connect() as conn:
        sources = retrieve(conn, question)
    if not sources:
        print_json(no_sources_answer())
        return
    text = await get_ai_provider(settings).generate(question, sources, {"require_citations": True})
    print_json(build_answer(text, sources))


def main() -> None:
    parser = argparse.ArgumentParser(prog="hacker-librarian")
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("init")
    ingest_file_parser = sub.add_parser("ingest-file")
    ingest_file_parser.add_argument("path")
    ingest_file_parser.add_argument("--title")
    ingest_url_parser = sub.add_parser("ingest-url")
    ingest_url_parser.add_argument("url")
    ingest_url_parser.add_argument("--title")
    sub.add_parser("list-sources")
    show = sub.add_parser("show-source")
    show.add_argument("source_id")
    score = sub.add_parser("score-source")
    score.add_argument("source_id")
    ask = sub.add_parser("ask")
    ask.add_argument("question")
    export = sub.add_parser("export")
    export.add_argument("--format", default="json", choices=["json"])
    archive = sub.add_parser("archive-to-0g")
    archive.add_argument("source_id")
    archive.add_argument("--dry-run", action="store_true", default=True)

    args = parser.parse_args()
    settings = get_settings()

    if args.command == "init":
        with connect(settings.database_path) as conn:
            init_db(conn)
        Path(settings.archive_dir).mkdir(parents=True, exist_ok=True)
        print_json({"ok": True, "database": settings.database_path, "archive_dir": settings.archive_dir})
    elif args.command == "ingest-file":
        with connect() as conn:
            print_json(ingest_file(conn, settings, args.path, args.title))
    elif args.command == "ingest-url":
        with connect() as conn:
            print_json(ingest_url(conn, settings, args.url, args.title))
    elif args.command == "list-sources":
        with connect() as conn:
            print_json(list_sources(conn))
    elif args.command == "show-source":
        with connect() as conn:
            source = get_source(conn, args.source_id)
        print_json(source or {"error": "Source not found"})
    elif args.command == "score-source":
        with connect() as conn:
            source = get_source(conn, args.source_id)
            if not source:
                print_json({"error": "Source not found"})
                return
            card = SourceCard.model_validate(source)
            card.quality = score_source(card)
            upsert_source(conn, card.id, card.title, card.model_dump(mode="json"), card.summary or "")
        print_json(card)
    elif args.command == "ask":
        asyncio.run(ask_question(args.question))
    elif args.command == "export":
        with connect() as conn:
            print_json(export_library(conn))
    elif args.command == "archive-to-0g":
        with connect() as conn:
            source = get_source(conn, args.source_id)
        print_json(archive_source_to_0g(settings, source, args.dry_run) if source else {"error": "Source not found"})


if __name__ == "__main__":
    main()
