#!/usr/bin/env bash
set -euo pipefail

SOURCE_ID="${1:-}"
DRY_RUN="${2:-true}"

if ! command -v hacker-librarian >/dev/null 2>&1; then
  echo "Install CLI package first: python -m pip install -e apps/cli --no-deps"
  exit 1
fi

if [ -z "$SOURCE_ID" ]; then
  echo "No source id provided; creating a local seed source from sample_public_domain_texts/knowledge_trail.txt"
  SAMPLE_SOURCE_ID=$(python - <<'PY'
from hacker_librarian_api.db import connect, list_sources
from hacker_librarian_api.config import get_settings
from hacker_librarian_api.services.ingest_service import ingest_file
import json
from pathlib import Path
with connect() as conn:
    card = ingest_file(conn, get_settings(), 'examples/sample_public_domain_texts/knowledge_trail.txt')
    print(card.id)
PY)
  SOURCE_ID="$SAMPLE_SOURCE_ID"
fi

if [ "$DRY_RUN" = "true" ]; then
  python - <<PY
import json
from hacker_librarian_api.config import get_settings
from hacker_librarian_api.db import connect, get_source
from hacker_librarian_api.services.archive_service import archive_source_to_0g
source_id = "$SOURCE_ID"
with connect() as conn:
    source = get_source(conn, source_id)
if not source:
    raise SystemExit(f'source not found: {source_id}')
print(archive_source_to_0g(get_settings(), source, dry_run=True))
PY
else
  echo "Non-dry-run 0G publish requires full SDK implementation and credentials. Current release is scaffold-only for safe production guardrails."
  exit 1
fi
