# examples

Dumb static host, published under https://abernier.github.io/examples/

`dist/` *is* the site: every push to `main` publishes it as-is — no build step,
no dependencies. Each project's source lives next to it in `src/<name>/` (its own
`node_modules/` and `dist/` are gitignored).

```
dist/foo/  ->  https://abernier.github.io/examples/foo/
dist/bar/  ->  https://abernier.github.io/examples/bar/
```

## Contributing a landing page (with Claude Code)

Most projects here are react-three-fiber landing pages generated with the
[pmndrs plugin](https://github.com/pmndrs/claude-code-plugin). Fork the repo,
open it in Claude Code and:

```
/new-example jewelry-boutique          # a landing page for a usecase
/new-example mix 3+ techniques         # a landing page mixing pmndrs demos
/new-example 5 usecases in parallel    # a batch, one agent each
```

The skill lives in `.claude/skills/new-example/` — it scaffolds `src/<slug>/`,
builds the scene from real demos of the `pmndrs:examples` skill, syncs it into
`dist/` and tells you what to commit. The pmndrs plugin is declared in
`.claude/settings.json`, so a fresh clone gets it on first launch (accept the
prompt); otherwise `/plugin marketplace add pmndrs/claude-code-plugin`.

Then open a PR — `src/<slug>/` + `dist/<slug>/`.

## Adding / updating a project by hand

1. Build it in `src/<name>/` with the right base path — for Vite:
   ```sh
   vite build --base=/examples/<name>/
   ```
   (or `--base=./` for fully relative URLs)
2. Sync it into `dist/`:
   ```sh
   ./sync.sh            # every src/*/dist
   ./sync.sh <name>     # just one (or a few)
   ```
3. Commit `src/<name>/` + `dist/<name>/` and push → live at
   https://abernier.github.io/examples/<name>/

## Notes

- No Jekyll here (that only happens with the legacy "deploy from a branch"
  source), so no `.nojekyll` needed — `_`-prefixed files are served fine.
- The landing page at https://abernier.github.io/examples/ is generated at deploy
  time, in three steps:
  1. `.github/preview.mjs` screenshots every `dist/<name>/` (Playwright, in the
     `mcr.microsoft.com/playwright` container — browsers already baked in) into
     `dist/_previews/`.
  2. `./build-home.sh` builds `src/home/` (Vite + React + shadcn/ui) into
     `dist/index.html` + `dist/_home/` — a sidebar listing every `dist/<name>/`
     (the list is read from disk at build time) and a full-viewport iframe of the
     selected one. The selection lives in the hash, so
     https://abernier.github.io/examples/#lp-surf is a link. Over the bottom-right
     corner of the iframe it shows the prompt the page was built from, read from
     `dist/<name>/manifest.json` (written in `src/<name>/`, carried over by
     `sync.sh` — see `.claude/skills/new-example/SKILL.md`).
  3. `.github/og.mjs` writes the social card tags into every `index.html` in
     `dist/` — `og:image` is that project's thumbnail, `og:title`/`og:description`
     are read from the page's own `<title>`/`<meta name=description>`. The gallery
     itself gets `dist/_previews/_home.jpg`, a contact sheet of the thumbs that
     `preview.mjs` composes. Tags go in a `<!-- og:start -->…<!-- og:end -->`
     block a rerun replaces, and a page that already carries its own `og:image`
     is left alone.

  `dist/index.html`, `dist/_home/` and `dist/_previews/` are gitignored: they're
  rebuilt on every deploy. `git add -f dist/index.html` to hand-write the page
  instead — `build-home.sh` then leaves it alone.
- Every PR gets a deployed copy of the same `dist/` on Vercel
  (`.github/workflows/preview.yml`, project `abernier/examples`, repo secret
  `VERCEL_TOKEN`), commented on the PR. These pages are visual — a diff doesn't
  review them. Pages still only ever serves `main`, and the preview never
  touches the Vercel project's production URL. PRs from forks skip the job: no
  secrets there.

  `vercel.json` sets `git.deploymentEnabled: false`, which switches off Vercel's
  own Git integration. It can't build this site: the gallery needs the Playwright
  screenshots (`.github/preview.mjs`) and the social cards (`.github/og.mjs`),
  neither of which happens in a `vercel build`, and it has no access to the
  previews cache — so it either shipped a thumbnail-less gallery or, once the
  output directory didn't match, nothing at all. CI builds the whole `dist/` and
  hands it over prebuilt instead; `vercel deploy --prebuilt` is a CLI deploy and
  is unaffected by that switch.
- To work on the landing page, from the repo root:
  ```sh
  npm run dev       # src/home/ in dev — it serves the real dist/, so the
                    # iframes and thumbnails resolve
  npm run build     # ./build-home.sh — build + copy into dist/
  npm run preview   # serve dist/ as deployed
  npm run shots     # ./preview.sh — re-screenshot, then build (needs Docker)
  npm run og        # inject the social cards — CI does this on every deploy,
                    # so locally it only dirties the committed dist/*/index.html
                    # (`git checkout dist` to undo)
  ```
- To regenerate everything locally: `./preview.sh` (screenshots in the same
  container image as CI — needs Docker — then the Vite build).
- Client-side routed SPAs need a `404.html` copy of their `index.html` inside
  their own folder to survive deep links.
- One-time setup: repo settings → Pages → **Source: GitHub Actions**.
