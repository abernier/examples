import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'

import { generatePort } from './port.mjs'

/** The repo root — this package sits at packages/dev/. */
export const ROOT = path.resolve(import.meta.dirname, '../..')
export const SRC = path.join(ROOT, 'src')
export const DIST = path.join(ROOT, 'dist')

/**
 * `src/<slug>/manifest.json` — how the page came to exist, written by the
 * /new-example skill. Missing or malformed is not an error here: the caller
 * decides what a folder without one means.
 */
function readManifest(dir) {
  const file = path.join(SRC, dir, 'manifest.json')
  if (!existsSync(file)) return undefined
  try {
    return JSON.parse(readFileSync(file, 'utf8'))
  } catch {
    return undefined
  }
}

/**
 * The examples: every `src/<slug>/` carrying a manifest.json.
 *
 * That file is what makes a workspace an example rather than just a folder —
 * it's what gets built, synced into dist/, screenshot and listed in the
 * gallery. A workspace without one (`src/home/`, a sketch you haven't
 * finished) is still a workspace you can `pnpm --filter <slug> dev`; it simply
 * isn't part of the site.
 *
 * Newest first — the sidebar is a feed, and what was built last is what you
 * came back to see. `date` comes off the manifest, so an example without one
 * falls to the bottom rather than to the middle of the list; the slug breaks
 * the ties inside a day, which is most of them here.
 */
export function listExamples() {
  if (!existsSync(SRC)) return []
  return readdirSync(SRC, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => ({
      name: entry.name,
      manifest: readManifest(entry.name),
      port: generatePort(entry.name),
    }))
    .filter((example) => example.manifest !== undefined)
    .sort(
      (a, b) =>
        (b.manifest?.date ?? '').localeCompare(a.manifest?.date ?? '') ||
        a.name.localeCompare(b.name)
    )
}
