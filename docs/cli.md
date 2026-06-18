# Basar CLI

The Basar CLI is the engineer-facing entry point for local-first evidence
archives. It uses the same SQLite database and archive directory as the API,
but it can run without the web UI or any paid AI provider.

## Install

```bash
python -m pip install -e 'apps/api[test]'
python -m pip install -e apps/cli --no-deps
basar --version
```

## First Run

```bash
basar doctor
basar demo
basar status
```

`doctor` checks local readiness, schema JSON, SQLite FTS5 support, the security
boundary file, and the built-in public demo source.

`demo` initializes the local database, ingests the public sample text, and asks
a cited question using the default mock AI provider.

## Runtime Paths

Every command accepts these runtime options:

```bash
basar status --database /tmp/basar.sqlite --archive-dir /tmp/basar-archive
basar demo --database /tmp/basar.sqlite --archive-dir /tmp/basar-archive
```

The same values can also be set with `DATABASE_PATH` and `ARCHIVE_DIR`.

## Common Workflow

```bash
basar init
basar ingest-file examples/sample_public_domain_texts/knowledge_trail.txt
basar search evidence --limit 3
basar ask "What should research tools preserve?"
basar export --output artifacts/basar-library.json
```

The CLI writes JSON to stdout by default so it can be piped into scripts, test
jobs, or review tools.

## Source Operations

```bash
basar list-sources --limit 20
basar show-source src_example
basar score-source src_example
```

`score-source` recalculates the deterministic source-quality rubric for an
existing source card.

## 0G Archive

The archive command is safe by default:

```bash
basar archive-to-0g src_example
```

That returns a dry-run `0g://dry-run/...` URI. A real upload requires explicit
execution and configured 0G storage settings:

```bash
ZEROG_STORAGE_ENDPOINT=https://example.invalid \
ZEROG_API_KEY=... \
basar archive-to-0g --execute src_example
```

Keep credentials in environment variables or local secret managers. Do not
commit `.env` files, local databases, archives, API keys, wallet keys, cookies,
or private source collections.
