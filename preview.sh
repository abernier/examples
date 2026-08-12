#!/usr/bin/env bash
# Regenerate dist/_previews/*.jpg and dist/index.html locally, exactly like CI
# does — same Playwright container image, same script.
#
#   ./preview.sh
#
# Both outputs are gitignored: CI rebuilds them on every deploy. This is only for
# checking the landing page before pushing (serve dist/ and open /examples/).

set -euo pipefail
cd "$(dirname "$0")"

# Keep in sync with .github/workflows/deploy.yml — the npm package must match the
# browsers baked into the image.
PLAYWRIGHT_VERSION=1.62.1

docker run --rm -it \
  -v "$PWD":/work -w /work \
  "mcr.microsoft.com/playwright:v${PLAYWRIGHT_VERSION}-noble" \
  bash -c "npm install --no-save --no-audit --no-fund playwright@${PLAYWRIGHT_VERSION} >/dev/null && node .github/preview.mjs"

echo
echo "dist/index.html + dist/_previews/ regenerated"
