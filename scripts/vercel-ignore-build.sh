#!/usr/bin/env bash
# Vercel "Ignored Build Step": exit 0 = skip build, exit 1 = run build.
# Run only when one of the given path prefixes has changed (or first deploy).
# Usage: bash scripts/vercel-ignore-build.sh apps/frontend-web packages/shared

set -e
SCOPES=("$@")

if [ ${#SCOPES[@]} -eq 0 ]; then
  echo "Usage: $0 <path1> [path2] ... (e.g. apps/frontend-web packages/shared)"
  exit 1
fi

# First deploy: no previous SHA → always build
if [ -z "${VERCEL_GIT_PREVIOUS_SHA}" ]; then
  echo "No previous deployment, building."
  exit 1
fi

# Check if any file in the given scopes changed
CHANGED=$(git diff --name-only "${VERCEL_GIT_PREVIOUS_SHA}" "${VERCEL_GIT_COMMIT_SHA}" 2>/dev/null) || {
  echo "Could not diff (e.g. shallow clone), building to be safe."
  exit 1
}

for scope in "${SCOPES[@]}"; do
  if echo "$CHANGED" | grep -qE "^${scope}/"; then
    echo "Changes in ${scope}/, building."
    exit 1
  fi
done

echo "No changes in ${SCOPES[*]}, skipping build."
exit 0
