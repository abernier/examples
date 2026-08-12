#!/usr/bin/env bash
# Deploy dist/ to Vercel (scope abernier, project "examples").
#
#   ./deploy-vercel.sh              # production
#   ./deploy-vercel.sh --preview    # preview URL instead
#
# CI already deploys to both Pages and Vercel on every push to main — this is the
# manual escape hatch (deploy without pushing, or from a dirty tree). It
# regenerates the previews first (./preview.sh) so the index and thumbnails —
# both gitignored — are in the upload, then ships dist/ as a prebuilt static
# output so nothing else in the repo gets uploaded.

set -euo pipefail
cd "$(dirname "$0")"

SCOPE=abernier
PROJECT=examples
TARGET=--prod
[ "${1:-}" = "--preview" ] && TARGET=""

./preview.sh

# Build Output API v3: .vercel/output/static is served as-is, no build on Vercel.
rm -rf .vercel/output
mkdir -p .vercel/output
cp -r dist .vercel/output/static
echo '{"version":3}' > .vercel/output/config.json

vercel deploy --prebuilt $TARGET --yes --scope "$SCOPE" --project "$PROJECT"
