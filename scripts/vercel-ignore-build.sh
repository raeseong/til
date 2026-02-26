#!/usr/bin/env bash
# Vercel "Ignored Build Step": exit 0 = skip build, exit 1 = run build.
# Run only when one of the given path prefixes (or root files) has changed (or first deploy).
# Usage:
#   Path prefix:  apps/frontend-web  → match apps/frontend-web/*
#   Root file:   package.json        → match package.json (exact, root only)
# Example: bash scripts/vercel-ignore-build.sh apps/frontend-web packages/shared package.json pnpm-lock.yaml pnpm-workspace.yaml
#
# Note: Vercel uses a shallow clone. If VERCEL_GIT_PREVIOUS_SHA is not in the
# clone, git diff fails and we fall back to fetching more history and retrying.
# If that still fails, we build to be safe.

set -e
SCOPES=("$@")

if [ ${#SCOPES[@]} -eq 0 ]; then
  echo "Usage: $0 <path-or-file1> [path-or-file2] ..."
  exit 1
fi

# First deploy: no previous SHA → always build
if [ -z "${VERCEL_GIT_PREVIOUS_SHA}" ]; then
  echo "No previous deployment, building."
  exit 1
fi

# Get changed files between previous and current commit.
# Vercel shallow clone may not contain VERCEL_GIT_PREVIOUS_SHA → fetch more and retry.
CHANGED=$(git diff --name-only "${VERCEL_GIT_PREVIOUS_SHA}" "${VERCEL_GIT_COMMIT_SHA}" 2>/dev/null) || {
  echo "Initial diff failed (e.g. shallow clone), fetching more history..."
  git fetch origin "${VERCEL_GIT_COMMIT_REF:-main}" --depth=100 2>/dev/null || true
  CHANGED=$(git diff --name-only "${VERCEL_GIT_PREVIOUS_SHA}" "${VERCEL_GIT_COMMIT_SHA}" 2>/dev/null) || {
    echo "Could not diff after fetch, building to be safe."
    exit 1
  }
}

for scope in "${SCOPES[@]}"; do
  if [[ "$scope" == */* ]]; then
    # Path prefix (e.g. apps/frontend-web, packages/shared)
    if echo "$CHANGED" | grep -qE "^${scope}/"; then
      echo "Changes in ${scope}/, building."
      exit 1
    fi
  else
    # Root-level file (e.g. package.json, pnpm-lock.yaml)
    if echo "$CHANGED" | grep -qxF "$scope"; then
      echo "Root file ${scope} changed, building."
      exit 1
    fi
  fi
done

echo "No changes in ${SCOPES[*]}, skipping build."
exit 0
