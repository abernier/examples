import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import sirv from 'sirv'
import { defineConfig, type Plugin } from 'vite'

// The landing page of the gallery — https://abernier.github.io/examples/
//
// Its content *is* the deployed dist/: one sidebar entry per dist/<name>/,
// thumbnailed by .github/preview.mjs into dist/_previews/<name>.jpg. The list is
// read from disk at build time and handed to the app as `virtual:examples`.
//
// Build it with ../../build-home.sh, which copies the output over dist/.

const DIST = path.resolve(import.meta.dirname, '../../dist')
const PREVIEWS = path.join(DIST, '_previews')

const VIRTUAL_ID = 'virtual:examples'

// dist/<name>/manifest.json — written by the /new-example skill in src/<name>/
// and carried over by sync.sh. Missing or malformed is fine: the page then just
// has no prompt to show.
function readManifest(name: string) {
  const file = path.join(DIST, name, 'manifest.json')
  if (!existsSync(file)) return undefined
  try {
    return JSON.parse(readFileSync(file, 'utf8'))
  } catch {
    return undefined
  }
}

// Newest first — the sidebar is a feed, and what was built last is what you
// came back to see. `date` comes off the manifest, so an example without one
// falls to the bottom rather than to the middle of the list; the slug breaks
// the ties inside a day, which is most of them here.
function listExamples() {
  if (!existsSync(DIST)) return []
  return readdirSync(DIST, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('_'))
    .map((entry) => ({
      name: entry.name,
      shot: existsSync(path.join(PREVIEWS, `${entry.name}.jpg`)),
      manifest: readManifest(entry.name),
    }))
    .sort(
      (a, b) =>
        (b.manifest?.date ?? '').localeCompare(a.manifest?.date ?? '') ||
        a.name.localeCompare(b.name)
    )
}

function gallery(): Plugin {
  const resolved = `\0${VIRTUAL_ID}`
  return {
    name: 'gallery',
    resolveId: (id) => (id === VIRTUAL_ID ? resolved : null),
    load(id) {
      if (id !== resolved) return null
      const examples = listExamples()
      if (!examples.length) this.warn('no dist/* folders found')
      return `export default ${JSON.stringify(examples)}`
    },

    // `npm run dev` serves the real dist/ under the app, so the iframes and the
    // thumbnails resolve exactly like in production. It can't be publicDir:
    // Vite hands HTML requests to its SPA fallback before looking there, so
    // /lp-foo/ would answer with the app itself — an iframe of an iframe.
    // Registered from configureServer, hence *before* Vite's own middlewares.
    configureServer(server) {
      const serveDist = sirv(DIST, { dev: true, etag: true })
      server.middlewares.use((req, res, next) => {
        const url = (req.url ?? '/').split('?')[0]
        const own = url === '/' || url === '/index.html' || /^\/(@|src\/|node_modules\/)/.test(url)
        if (own) next()
        else serveDist(req, res, next)
      })
    },
  }
}

export default defineConfig({
  // Relative: the page is served from /examples/ on Pages, from / in dev.
  base: './',
  // dist/ is the destination, not an input — the dev server serves it through
  // the middleware in `gallery` instead.
  publicDir: false,
  build: {
    // Next to index.html at the root of dist/, `_`-prefixed so preview.mjs and
    // sync.sh don't mistake it for an example.
    assetsDir: '_home',
  },
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
  plugins: [react(), tailwindcss(), gallery()],
})
