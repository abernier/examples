#!/usr/bin/env bash
# Sync locally built projects into the deployed dist/
#
#   ./sync.sh              # every src/*/dist
#   ./sync.sh foo bar      # just those
#
# src/<name>/dist/  ->  dist/<name>/  ->  https://abernier.github.io/examples/<name>/
#
# src/home/ is the gallery itself, not an example — it lands at the root of
# dist/ and is built by ./build-home.sh, so it's skipped here.

set -euo pipefail
shopt -s nullglob

cd "$(dirname "$0")"

names=("$@")
if [ ${#names[@]} -eq 0 ]; then
  for d in src/*/dist; do
    name=$(basename "$(dirname "$d")")
    [ "$name" = home ] || names+=("$name")
  done
fi

if [ ${#names[@]} -eq 0 ]; then
  echo "nothing to sync: no src/*/dist found" >&2
  exit 1
fi

for name in "${names[@]}"; do
  src="src/$name/dist"
  if [ ! -d "$src" ]; then
    echo "✗ $name — no $src (build it first)" >&2
    exit 1
  fi
  mkdir -p "dist/$name"
  rsync -a --delete "$src/" "dist/$name/"
  echo "✓ $name"
done

# dist/ entries with no matching source — left alone, just flagged. `_`-prefixed
# ones (_previews/, _home/) are generated, not examples.
for d in dist/*/; do
  name=$(basename "$d")
  case "$name" in _*) continue ;; esac
  [ -d "src/$name/dist" ] || echo "~ dist/$name has no src/$name/dist (stale? rm -rf dist/$name)"
done

echo
echo "Now: git add dist && git commit && git push"
