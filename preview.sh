#!/usr/bin/env bash
# Rebuild the whole dist/ locally, exactly like CI does — the examples with
# turbo, the screenshots in the same Playwright container image, then the
# landing page with ./build-home.sh (Vite, on the host).
#
#   ./preview.sh
#
# Nothing here is committed: CI rebuilds all of it on every deploy. This is only
# for checking the gallery before pushing (`pnpm preview`, then open /examples/).

set -euo pipefail
cd "$(dirname "$0")"

# Keep in sync with .github/workflows/deploy.yml — the npm package must match the
# browsers baked into the image.
PLAYWRIGHT_VERSION=1.62.1

# The examples into dist/ — turbo skips the ones nothing changed in.
pnpm build

# Installed globally rather than into the repo: this is a pnpm workspace on the
# host, and preview.mjs falls back to the global root to require playwright.
docker run --rm \
  -v "$PWD":/work -w /work \
  "mcr.microsoft.com/playwright:v${PLAYWRIGHT_VERSION}-noble" \
  bash -c "npm install -g --no-audit --no-fund playwright@${PLAYWRIGHT_VERSION} >/dev/null && node .github/preview.mjs"

./build-home.sh

echo
echo "dist/ regenerated — examples, previews and gallery"
