#!/usr/bin/env bash
set -euo pipefail

VERSION="${1:-v0.1.0-alpha}"
OUTPUT_DIR="artifacts"
ARCHIVE="${OUTPUT_DIR}/hacker-librarian-${VERSION}.tar.gz"

mkdir -p "${OUTPUT_DIR}"

tar --exclude='./.git' \
  --exclude='./.venv' \
  --exclude='./data' \
  --exclude='./artifacts' \
  --exclude='./apps/web/node_modules' \
  --exclude='./apps/web/dist' \
  --exclude='*.sqlite' \
  -czf "${ARCHIVE}" \
  .

echo "Release package ready: ${ARCHIVE}"
