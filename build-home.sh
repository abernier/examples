#!/usr/bin/env bash
# Build the landing page (src/home/, Vite + React + shadcn/ui) and drop it at
# the root of dist/
#
#   ./build-home.sh          (or `npm run build` from the repo root)
#
# Reads dist/<name>/ + dist/_previews/*.jpg to write the gallery, so run it
# *after* .github/preview.mjs has taken the screenshots. Outputs dist/index.html
# and dist/_home/ — both gitignored, rebuilt on every deploy.

set -euo pipefail
cd "$(dirname "$0")"

# Escape hatch: `git add -f dist/index.html` to hand-write the page instead.
if git ls-files --error-unmatch dist/index.html >/dev/null 2>&1; then
  echo "dist/index.html is committed — keeping it"
  exit 0
fi

npm --prefix src/home install --no-audit --no-fund --loglevel error
npm --prefix src/home run build

rm -rf dist/_home
cp -R src/home/dist/. dist/

echo "dist/index.html + dist/_home/ written"
