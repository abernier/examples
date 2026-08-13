#!/usr/bin/env bash
# Collect the examples' own builds into the dist/ that ships.
#
#   ./sync.sh              # every example (see bin/examples.mjs)
#   ./sync.sh foo bar      # just those
#
# src/<name>/dist/  ->  dist/<name>/  ->  https://abernier.github.io/examples/<name>/
#
# Build first — `pnpm build` does both, turbo then this. Nothing here is
# versioned: dist/ is rebuilt on every deploy.
#
# src/<name>/manifest.json rides along, so a deployed page carries the prompt it
# was built from. The gallery reads its own copy from src/, but a page opened on
# its own still has it.
#
# src/home/ is the gallery itself, not an example — it lands at the root of
# dist/ and is built by ./build-home.sh, so it's not in the list.

set -euo pipefail
shopt -s nullglob

cd "$(dirname "$0")"

names=("$@")
if [ ${#names[@]} -eq 0 ]; then
  mapfile -t names < <(node bin/examples.mjs)
fi

if [ ${#names[@]} -eq 0 ]; then
  echo "nothing to sync: no src/*/manifest.json found" >&2
  exit 1
fi

for name in "${names[@]}"; do
  src="src/$name/dist"
  if [ ! -d "$src" ]; then
    echo "✗ $name — no $src (build it: pnpm --filter $name build)" >&2
    exit 1
  fi
  mkdir -p "dist/$name"
  rsync -a --delete "$src/" "dist/$name/"
  # After the rsync, not before: --delete would wipe it.
  if [ -f "src/$name/manifest.json" ]; then
    cp "src/$name/manifest.json" "dist/$name/manifest.json"
  else
    echo "~ $name has no src/$name/manifest.json — it'll show up promptless in the gallery"
  fi
  echo "✓ $name"
done

# dist/ entries with no matching example — a slug that was renamed or dropped,
# left behind by an earlier run. `_`-prefixed ones (_previews/, _home/) are
# generated, not examples.
for d in dist/*/; do
  name=$(basename "$d")
  case "$name" in _*) continue ;; esac
  [ -f "src/$name/manifest.json" ] || echo "~ dist/$name is not an example any more (rm -rf dist/$name)"
done
