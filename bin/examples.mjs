#!/usr/bin/env node
// The examples, one per line — every examples/<slug>/ carrying a manifest.json.
//
//   node bin/examples.mjs             # lp-surf lp-arcade …
//   node bin/examples.mjs --filter    # --filter=lp-surf --filter=lp-arcade …
//
// The second form is what the root `build` script feeds turbo: the site builds
// exactly what it ships, and a workspace that isn't an example (anything under
// apps/, an unfinished sketch) is left out rather than breaking the deploy.

import { listExamples } from '@examples/dev'

const names = listExamples().map(({ name }) => name)

console.log(
  process.argv.includes('--filter')
    ? names.map((name) => `--filter=${name}`).join(' ')
    : names.join('\n')
)
