#!/usr/bin/env bash
# Build the landing page (src/home/, Vite + React + shadcn/ui) and drop it at
# the root of dist/
#
#   ./build-home.sh          (or `pnpm build:home` from the repo root)
#
# Reads dist/<name>/ + dist/_previews/*.jpg to write the gallery, so run it
# *after* `pnpm build` has assembled dist/ and .github/preview.mjs has taken the
# screenshots. Outputs dist/index.html and dist/_home/.
#
# Not through turbo: the gallery is built from the assembled dist/, which is
# nothing turbo can hash — see the `home#build` note in turbo.json.

set -euo pipefail
cd "$(dirname "$0")"

# Escape hatch: `git add -f dist/index.html` to hand-write the page instead.
if git ls-files --error-unmatch dist/index.html >/dev/null 2>&1; then
  echo "dist/index.html is committed — keeping it"
  exit 0
fi

pnpm --filter home build

rm -rf dist/_home
cp -R src/home/dist/. dist/

echo "dist/index.html + dist/_home/ written"
