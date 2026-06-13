#!/usr/bin/env bash
set -euo pipefail

REPO_URL="${1:-}"
TAG="${2:-v0.1.0-alpha}"
RELEASE_FILE="${3:-docs/releases/v0.1.0-alpha.md}"

if [ -z "$REPO_URL" ]; then
  echo "Usage: ./scripts/publish_github.sh <repo-url> [tag] [release-body-file]"
  exit 1
fi

if ! command -v git >/dev/null 2>&1; then
  echo "git not found"
  exit 1
fi

if git remote | grep -q '^origin$'; then
  git remote set-url origin "$REPO_URL"
else
  git remote add origin "$REPO_URL"
fi

git fetch origin --tags || true
git push -u origin "${TAG}"
git push origin main

tag=$(git describe --tags --exact-match --dirty 2>/dev/null || echo "$TAG")
if [ -z "$tag" ]; then
  git tag -f "$TAG"
  git push -f origin "$TAG"
else
  git tag -f "$TAG"
  git push -f origin "$TAG"
fi

echo "Preparing release body from $RELEASE_FILE"
if [ -f "$RELEASE_FILE" ]; then
  BODY_ARGS=(--notes-file "$RELEASE_FILE")
else
  BODY_ARGS=(--title "$tag" --notes "Hacker Librarian release")
fi

echo "Release ready locally: ${tag}."
echo "Use GitHub UI/API to publish a release for ${tag} with notes in ${RELEASE_FILE}."
