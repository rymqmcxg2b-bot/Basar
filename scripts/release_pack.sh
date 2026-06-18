#!/usr/bin/env bash
set -euo pipefail

VERSION="${1:-v0.1.0-alpha}"
OUTPUT_DIR="artifacts"
ARCHIVE="${OUTPUT_DIR}/basar-${VERSION}.tar.gz"

mkdir -p "${OUTPUT_DIR}"

tar --exclude='./.git' \
  --exclude='./.env' \
  --exclude='./.env.*' \
  --exclude='./.venv' \
  --exclude='./data' \
  --exclude='./artifacts' \
  --exclude='./docs/basar-handoff' \
  --exclude='./apps/web/node_modules' \
  --exclude='./apps/web/dist' \
  --exclude='__pycache__' \
  --exclude='.pytest_cache' \
  --exclude='.ruff_cache' \
  --exclude='*.egg-info' \
  --exclude='*.sqlite' \
  --exclude='*.db' \
  --exclude='*.pem' \
  --exclude='*.key' \
  --exclude='*.token' \
  --exclude='.DS_Store' \
  -czf "${ARCHIVE}" \
  .

echo "Release package ready: ${ARCHIVE}"
