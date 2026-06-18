#!/usr/bin/env bash
set -euo pipefail

EXECUTE="false"
if [ "${1:-}" = "--execute" ]; then
  EXECUTE="true"
  shift
fi

REPO_URL="${1:-}"
TAG="${2:-v0.1.0-alpha}"
RELEASE_FILE="${3:-docs/releases/v0.1.0-alpha.md}"

if [ -z "$REPO_URL" ]; then
  echo "Usage: ./scripts/publish_github.sh [--execute] <repo-url> [tag] [release-body-file]"
  exit 1
fi

if ! command -v git >/dev/null 2>&1; then
  echo "git not found"
  exit 1
fi

tag=$(git describe --tags --exact-match --dirty 2>/dev/null || echo "$TAG")

cat <<EOF
GitHub publish plan
repo: $REPO_URL
branch: main
tag: $tag
release notes: $RELEASE_FILE
execute: $EXECUTE
EOF

if [ "$EXECUTE" != "true" ]; then
  echo "Dry run only. Re-run with --execute after security review and maintainer approval."
  exit 0
fi

if git remote | grep -q '^origin$'; then
  git remote set-url origin "$REPO_URL"
else
  git remote add origin "$REPO_URL"
fi

git fetch origin --tags || true
git tag -f "$TAG"
git push origin main
git push -f origin "$TAG"

if [ -f "$RELEASE_FILE" ]; then
  BODY_ARGS=(--notes-file "$RELEASE_FILE")
else
  BODY_ARGS=(--title "$tag" --notes "Basar release")
fi

echo "Release ready locally: ${tag}."
echo "Use GitHub UI/API to publish a release for ${tag} with notes in ${RELEASE_FILE}."
