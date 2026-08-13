import { existsSync } from 'node:fs'
import net from 'node:net'
import path from 'node:path'
import { DIST, listExamples } from '@examples/dev'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import sirv from 'sirv'
import { defineConfig, type Plugin } from 'vite'

// The landing page of the gallery — https://abernier.github.io/examples/
//
// Its content is the workspaces next door: one sidebar entry per src/<name>/
// carrying a manifest.json (see packages/dev/examples.mjs), thumbnailed by
// .github/preview.mjs into dist/_previews/<name>.jpg. The list is read from
// disk at build time and handed to the app as `virtual:examples`.
//
// Build it with ../../build-home.sh, which copies the output over dist/.

const PREVIEWS = path.join(DIST, '_previews')

const VIRTUAL_ID = 'virtual:examples'

// Dev only. The gallery iframes each example's own vite server — one per
// workspace, on a port derived from its slug — and there is usually only the
// one you're working on running. Whether the others answer is something the
// page cannot find out for itself: a cross-origin fetch to a closed port fails
// the same way an opaque success does. Its own dev server can, in one TCP
// connect, and answers `/@up/<port>`; the app turns a `false` into the command
// that starts that workspace.
const UP_ROUTE = '/@up'

function isUp(port: number) {
  return new Promise<boolean>((resolve) => {
    // `localhost`, not 127.0.0.1: vite binds whichever of ::1 / 127.0.0.1 the
    // name resolves to first, and node tries both from the name.
    const socket = net.connect({ port, host: 'localhost' })
    const settle = (up: boolean) => {
      socket.destroy()
      resolve(up)
    }
    socket.setTimeout(500)
    socket.on('connect', () => settle(true))
    socket.on('timeout', () => settle(false))
    socket.on('error', () => settle(false))
  })
}

function gallery(): Plugin {
  const resolved = `\0${VIRTUAL_ID}`
  return {
    name: 'gallery',
    resolveId: (id) => (id === VIRTUAL_ID ? resolved : null),
    load(id) {
      if (id !== resolved) return null
      // `shot` is the only part that comes from dist/ — the thumbnails are a
      // build artifact of the deploy, not of this package.
      const examples = listExamples().map((example) => ({
        ...example,
        shot: existsSync(path.join(PREVIEWS, `${example.name}.jpg`)),
      }))
      if (!examples.length) this.warn('no src/*/manifest.json found')
      return `export default ${JSON.stringify(examples)}`
    },

    configureServer(server) {
      server.middlewares.use(UP_ROUTE, async (req, res) => {
        const port = Number((req.url ?? '').slice(1))
        res.setHeader('content-type', 'application/json')
        res.end(JSON.stringify({ up: port ? await isUp(port) : false }))
      })

      // `pnpm dev` serves the real dist/ under the app, so the thumbnails
      // resolve — and so do the built pages, for anything still linking at
      // them. It can't be publicDir: Vite hands HTML requests to its SPA
      // fallback before looking there, so /lp-foo/ would answer with the app
      // itself — an iframe of an iframe. Registered from configureServer, hence
      // *before* Vite's own middlewares. dist/ is a build output, so it may
      // simply not be there yet.
      if (!existsSync(DIST)) return
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
