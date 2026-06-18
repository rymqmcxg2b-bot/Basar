# SPDX-License-Identifier: Apache-2.0

import argparse
import asyncio
import json
import os
import sqlite3
from pathlib import Path
from typing import Any

from basar_api.config import Settings, get_settings
from basar_api.db import connect, export_library, get_source, init_db, list_sources, search_sources, upsert_source
from basar_api.schemas.source_card import SourceCard
from basar_api.services.ai_service import get_ai_provider
from basar_api.services.archive_service import archive_source_to_0g
from basar_api.services.citation_service import build_answer, no_sources_answer
from basar_api.services.ingest_service import ingest_file, ingest_url
from basar_api.services.retrieval_service import retrieve
from basar_api.services.source_score_service import score_source
from basar_cli import __version__

DEFAULT_DEMO_QUESTION = "What should research tools preserve?"
DEMO_SOURCE = "examples/sample_public_domain_texts/knowledge_trail.txt"


def normalize_obj(obj: Any) -> Any:
    if hasattr(obj, "model_dump"):
        return obj.model_dump(mode="json")
    return obj


def json_text(obj: Any) -> str:
    return json.dumps(normalize_obj(obj), indent=2, ensure_ascii=False, default=str)


def print_json(obj: Any) -> None:
    print(json_text(obj))


def fail(message: str, **extra: Any) -> None:
    payload = {"ok": False, "error": message}
    payload.update(extra)
    print_json(payload)
    raise SystemExit(1)


def find_project_root() -> Path:
    starts = [Path.cwd(), Path(__file__).resolve()]
    for start in starts:
        current = start if start.is_dir() else start.parent
        for parent in (current, *current.parents):
            if (parent / "SECURITY_BOUNDARY.md").exists() and (parent / "README.md").exists():
                return parent
    return Path.cwd()


def nearest_existing_parent(path: Path) -> Path:
    current = path if path.exists() else path.parent
    for parent in (current, *current.parents):
        if parent.exists():
            return parent
    return Path(".").resolve()


def target_parent_ready(path: Path) -> tuple[bool, str]:
    parent = path.parent if path.suffix else path
    if parent.exists():
        return os.access(parent, os.W_OK), str(parent)
    nearest = nearest_existing_parent(parent)
    return os.access(nearest, os.W_OK), f"{parent} can be created under {nearest}"


def apply_runtime_overrides(settings: Settings, args: argparse.Namespace) -> Settings:
    database = getattr(args, "database", None)
    archive_dir = getattr(args, "archive_dir", None)
    if database:
        settings.database_path = database
    if archive_dir:
        settings.archive_dir = archive_dir
    return settings


def add_runtime_options(parser: argparse.ArgumentParser) -> None:
    parser.add_argument(
        "--database",
        default=argparse.SUPPRESS,
        help="SQLite database path. Defaults to DATABASE_PATH or data/basar.sqlite.",
    )
    parser.add_argument(
        "--archive-dir",
        default=argparse.SUPPRESS,
        help="Local archive directory. Defaults to ARCHIVE_DIR or data/archive.",
    )


def build_parser() -> argparse.ArgumentParser:
    runtime_options = argparse.ArgumentParser(add_help=False)
    add_runtime_options(runtime_options)

    parser = argparse.ArgumentParser(
        prog="basar",
        parents=[runtime_options],
        description="Basar CLI for local-first evidence archives.",
    )
    parser.add_argument("--version", action="version", version=f"%(prog)s {__version__}")
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("init", parents=[runtime_options], help="Create the local database and archive directory.")
    sub.add_parser("status", parents=[runtime_options], help="Show local runtime status without creating files.")
    sub.add_parser("doctor", parents=[runtime_options], help="Run local readiness checks.")

    demo = sub.add_parser("demo", parents=[runtime_options], help="Initialize and load the built-in public demo source.")
    demo.add_argument("--question", default=DEFAULT_DEMO_QUESTION, help="Question to ask after loading the demo source.")
    demo.add_argument("--no-ask", action="store_true", help="Only load the demo source.")

    ingest_file_parser = sub.add_parser("ingest-file", parents=[runtime_options], help="Ingest a local text or markdown file.")
    ingest_file_parser.add_argument("path")
    ingest_file_parser.add_argument("--title")

    ingest_url_parser = sub.add_parser("ingest-url", parents=[runtime_options], help="Record URL provenance metadata.")
    ingest_url_parser.add_argument("url")
    ingest_url_parser.add_argument("--title")

    list_parser = sub.add_parser("list-sources", parents=[runtime_options], help="List source cards.")
    list_parser.add_argument("--limit", type=int, default=None)

    search = sub.add_parser("search", parents=[runtime_options], help="Search local sources without calling an AI provider.")
    search.add_argument("query", nargs="+")
    search.add_argument("--limit", type=int, default=5)

    show = sub.add_parser("show-source", parents=[runtime_options], help="Show one source card.")
    show.add_argument("source_id")

    score = sub.add_parser("score-source", parents=[runtime_options], help="Recalculate a source quality score.")
    score.add_argument("source_id")

    ask = sub.add_parser("ask", parents=[runtime_options], help="Ask a cited question against retrieved local sources.")
    ask.add_argument("question", nargs="+")
    ask.add_argument("--limit", type=int, default=5)

    export = sub.add_parser("export", parents=[runtime_options], help="Export source and claim cards.")
    export.add_argument("--format", default="json", choices=["json"])
    export.add_argument("--output", "-o", help="Write export JSON to a file instead of stdout.")

    archive = sub.add_parser("archive-to-0g", parents=[runtime_options], help="Archive a source card to a 0G storage endpoint.")
    archive.add_argument("source_id")
    archive.add_argument("--dry-run", action="store_true", help="Return a dry-run 0G URI. This is the default.")
    archive.add_argument("--execute", action="store_true", help="Perform a real upload using configured 0G storage settings.")

    return parser


def source_count_status(database_path: str) -> dict[str, Any]:
    path = Path(database_path)
    if not path.exists():
        return {"exists": False, "initialized": False, "source_count": 0}
    try:
        with sqlite3.connect(path) as conn:
            row = conn.execute("SELECT COUNT(*) FROM sources").fetchone()
        return {"exists": True, "initialized": True, "source_count": row[0] if row else 0}
    except sqlite3.Error as exc:
        return {"exists": True, "initialized": False, "source_count": None, "error": str(exc)}


def status_payload(settings: Settings) -> dict[str, Any]:
    archive_path = Path(settings.archive_dir)
    return {
        "ok": True,
        "version": __version__,
        "database": {"path": settings.database_path, **source_count_status(settings.database_path)},
        "archive": {"path": settings.archive_dir, "exists": archive_path.exists()},
        "ai_provider": settings.ai_provider,
        "zerog": {
            "dry_run": settings.zerog_dry_run,
            "storage_endpoint_configured": bool(settings.zerog_storage_endpoint),
            "compute_endpoint_configured": bool(settings.zerog_compute_endpoint),
            "compute_model_configured": bool(settings.zerog_compute_model),
        },
    }


def add_check(checks: list[dict[str, Any]], name: str, ok: bool, detail: str) -> None:
    checks.append({"name": name, "ok": ok, "detail": detail})


def doctor_payload(settings: Settings) -> dict[str, Any]:
    root = find_project_root()
    checks: list[dict[str, Any]] = []

    db_ready, db_detail = target_parent_ready(Path(settings.database_path))
    add_check(checks, "database_path_ready", db_ready, db_detail)

    archive_ready, archive_detail = target_parent_ready(Path(settings.archive_dir))
    add_check(checks, "archive_dir_ready", archive_ready, archive_detail)

    security_boundary = root / "SECURITY_BOUNDARY.md"
    add_check(checks, "security_boundary_present", security_boundary.exists(), str(security_boundary))

    sample = root / DEMO_SOURCE
    add_check(checks, "demo_source_present", sample.exists(), str(sample))

    schema_dir = root / "packages" / "schemas"
    schema_files = sorted(schema_dir.glob("*.schema.json"))
    schema_errors: list[str] = []
    for schema_file in schema_files:
        try:
            json.loads(schema_file.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            schema_errors.append(f"{schema_file}: {exc}")
    add_check(
        checks,
        "schemas_parse",
        bool(schema_files) and not schema_errors,
        f"{len(schema_files)} schema file(s)" if not schema_errors else "; ".join(schema_errors),
    )

    try:
        with sqlite3.connect(":memory:") as conn:
            conn.execute("CREATE VIRTUAL TABLE source_fts USING fts5(content)")
        add_check(checks, "sqlite_fts5_available", True, "sqlite FTS5 is available")
    except sqlite3.Error as exc:
        add_check(checks, "sqlite_fts5_available", False, str(exc))

    add_check(checks, "api_importable", True, "basar_api imported")
    add_check(checks, "web_package_present", (root / "apps" / "web" / "package.json").exists(), "apps/web/package.json")

    return {"ok": all(check["ok"] for check in checks), "version": __version__, "project_root": str(root), "checks": checks}


async def answer_question(settings: Settings, question: str, limit: int = 5) -> dict[str, Any]:
    with connect(settings.database_path) as conn:
        sources = retrieve(conn, question, limit=limit)
    if not sources:
        return no_sources_answer().model_dump(mode="json")
    text = await get_ai_provider(settings).generate(question, sources, {"require_citations": True})
    return build_answer(text, sources).model_dump(mode="json")


def existing_demo_source(conn, sample_path: Path) -> dict[str, Any] | None:
    sample = str(sample_path)
    for source in list_sources(conn):
        if source.get("local_path") == sample or source.get("acquired_from") == sample:
            return source
    return None


async def run_demo(settings: Settings, question: str, ask: bool) -> dict[str, Any]:
    root = find_project_root()
    sample = root / DEMO_SOURCE
    if not sample.exists():
        fail("Demo source not found", path=str(sample))

    Path(settings.archive_dir).mkdir(parents=True, exist_ok=True)
    with connect(settings.database_path) as conn:
        source = existing_demo_source(conn, sample)
        created = False
        if not source:
            source = ingest_file(conn, settings, str(sample), "Basar Evidence Trail Demo").model_dump(mode="json")
            created = True

    payload: dict[str, Any] = {
        "ok": True,
        "database": settings.database_path,
        "archive_dir": settings.archive_dir,
        "created": created,
        "source": source,
    }
    if ask:
        payload["question"] = question
        payload["answer"] = await answer_question(settings, question)
    return payload


def command_init(settings: Settings) -> None:
    with connect(settings.database_path) as conn:
        init_db(conn)
    Path(settings.archive_dir).mkdir(parents=True, exist_ok=True)
    print_json({"ok": True, "database": settings.database_path, "archive_dir": settings.archive_dir})


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()
    settings = apply_runtime_overrides(get_settings(), args)

    if args.command == "init":
        command_init(settings)
    elif args.command == "status":
        print_json(status_payload(settings))
    elif args.command == "doctor":
        payload = doctor_payload(settings)
        print_json(payload)
        if not payload["ok"]:
            raise SystemExit(1)
    elif args.command == "demo":
        print_json(asyncio.run(run_demo(settings, args.question, not args.no_ask)))
    elif args.command == "ingest-file":
        with connect(settings.database_path) as conn:
            print_json(ingest_file(conn, settings, args.path, args.title))
    elif args.command == "ingest-url":
        with connect(settings.database_path) as conn:
            print_json(ingest_url(conn, settings, args.url, args.title))
    elif args.command == "list-sources":
        with connect(settings.database_path) as conn:
            sources = list_sources(conn)
        print_json(sources[: args.limit] if args.limit else sources)
    elif args.command == "search":
        with connect(settings.database_path) as conn:
            print_json(search_sources(conn, " ".join(args.query), limit=args.limit))
    elif args.command == "show-source":
        with connect(settings.database_path) as conn:
            source = get_source(conn, args.source_id)
        if not source:
            fail("Source not found", source_id=args.source_id)
        print_json(source)
    elif args.command == "score-source":
        with connect(settings.database_path) as conn:
            source = get_source(conn, args.source_id)
            if not source:
                fail("Source not found", source_id=args.source_id)
            card = SourceCard.model_validate(source)
            card.quality = score_source(card)
            upsert_source(conn, card.id, card.title, card.model_dump(mode="json"), card.summary or "")
        print_json(card)
    elif args.command == "ask":
        print_json(asyncio.run(answer_question(settings, " ".join(args.question), limit=args.limit)))
    elif args.command == "export":
        with connect(settings.database_path) as conn:
            payload = export_library(conn)
        if args.output:
            output_path = Path(args.output)
            output_path.parent.mkdir(parents=True, exist_ok=True)
            output_path.write_text(json_text(payload) + "\n", encoding="utf-8")
            print_json(
                {
                    "ok": True,
                    "output": str(output_path),
                    "sources": len(payload["sources"]),
                    "claims": len(payload["claims"]),
                }
            )
        else:
            print_json(payload)
    elif args.command == "archive-to-0g":
        if args.dry_run and args.execute:
            fail("Use either --dry-run or --execute, not both.")
        with connect(settings.database_path) as conn:
            source = get_source(conn, args.source_id)
        if not source:
            fail("Source not found", source_id=args.source_id)
        print_json(archive_source_to_0g(settings, source, dry_run=not args.execute))


if __name__ == "__main__":
    main()
