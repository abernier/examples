#!/usr/bin/env bash
# Build the gallery (apps/website/, Vite + React + shadcn/ui) and drop it at the
# root of dist/
#
#   ./build-website.sh          (or `pnpm build:website` from the repo root)
#
# Reads dist/<name>/ + dist/_previews/*.jpg to write the gallery, so run it
# *after* `pnpm build` has assembled dist/ and .github/preview.mjs has taken the
# screenshots. Outputs dist/index.html and dist/_home/ — the site's home page,
# hence the name, `_`-prefixed so nothing mistakes it for an example.
#
# Not through turbo: the gallery is built from the assembled dist/, which is
# nothing turbo can hash — see the `website#build` note in turbo.json.

set -euo pipefail
cd "$(dirname "$0")"

# Escape hatch: `git add -f dist/index.html` to hand-write the page instead.
if git ls-files --error-unmatch dist/index.html >/dev/null 2>&1; then
  echo "dist/index.html is committed — keeping it"
  exit 0
fi

pnpm --filter website build

rm -rf dist/_home
cp -R apps/website/dist/. dist/

echo "dist/index.html + dist/_home/ written"
