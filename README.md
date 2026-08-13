# examples

A gallery of small static sites, published under https://abernier.github.io/examples/

A turborepo of pnpm workspaces: one per project, in `src/<name>/`, each building
itself into its own `dist/`. The site is `dist/` at the root — assembled from
those builds by `./sync.sh` and **not versioned**. CI rebuilds all of it on every
push to `main`.

```
src/foo/  ->  dist/foo/  ->  https://abernier.github.io/examples/foo/
src/bar/  ->  dist/bar/  ->  https://abernier.github.io/examples/bar/
```

```sh
pnpm install
pnpm --filter lp-surf dev   # one example, on a port derived from its slug
pnpm dev                    # the gallery (src/home/) at :5173
pnpm build                  # every example -> dist/
```

A `src/<name>/manifest.json` is what makes a workspace an *example*: the prompt it
was built from, and the vocabulary the gallery filters on. It's what gets built,
synced, screenshot and listed — a workspace without one (`src/home/`, an
unfinished sketch) is still a workspace you can `pnpm --filter <name> dev`, it
simply isn't part of the site. `node bin/examples.mjs` prints the list.

## Contributing (with Claude Code)

Everything here is a react-three-fiber project generated with the
[pmndrs plugin](https://github.com/pmndrs/claude-code-plugin). Fork the repo,
open it in Claude Code and type whatever you want built — the prompt *is* the
brief, the skill doesn't narrow it:

```
/new-example jewelry-boutique
/new-example mix 3+ techniques
/new-example ❤️
/new-example 5 of them in parallel
```

The skill lives in `.claude/skills/new-example/` — it scaffolds the `src/<slug>/`
workspace, ports the scene from real demos of the `pmndrs:examples` skill,
records the prompt in a manifest and tells you what to commit. The pmndrs plugin
is declared in `.claude/settings.json`, so a fresh clone gets it on first launch
(accept the prompt); otherwise `/plugin marketplace add pmndrs/claude-code-plugin`.

Then open a PR — `src/<slug>/`, sources only.

## Adding / updating a project by hand

1. Add the workspace: `src/<name>/`, a Vite app with `base: './'` (or
   `--base=/examples/<name>/`) so its assets resolve under the deploy path, and
   a `manifest.json` next to its `package.json`.
2. `pnpm install`, then build it:
   ```sh
   pnpm build                     # every example, then ./sync.sh into dist/
   pnpm --filter <name> build     # just this one (./sync.sh <name> to collect it)
   ```
3. Commit `src/<name>/` and push → live at
   https://abernier.github.io/examples/<name>/

## Notes

- No Jekyll here (that only happens with the legacy "deploy from a branch"
  source), so no `.nojekyll` needed — `_`-prefixed files are served fine.
- The site is built at deploy time, in four steps:
  1. `pnpm build` — turbo runs each example's own `build`, then `./sync.sh`
     copies every `src/<name>/dist/` into `dist/<name>/` (its `manifest.json`
     rides along, so a page opened on its own still carries its prompt). Turbo
     caches per workspace, and CI carries `.turbo` between runs, so a push that
     touches one example rebuilds one example.
  2. `.github/preview.mjs` screenshots every `dist/<name>/` (Playwright, in the
     `mcr.microsoft.com/playwright` container — browsers already baked in) into
     `dist/_previews/`.
  3. `./build-home.sh` builds `src/home/` (Vite + React + shadcn/ui) into
     `dist/index.html` + `dist/_home/` — a sidebar listing every example (read
     off `src/*/manifest.json` at build time) and a full-viewport iframe of the
     selected one. The selection lives in the hash, so
     https://abernier.github.io/examples/#lp-surf is a link. Over the bottom-right
     corner of the iframe it shows the prompt the page was built from. The same
     manifest feeds the filter in the sidebar header — one combobox, two grouped
     vocabularies, neither of them hardcoded: `kind` is what the page is
     (`landing`, `game`, … one per example, so picking two widens to their union),
     `tags` are the techniques on screen (`water`, `caustics`, `physics`, …,
     several per example, so picking two narrows to the pages carrying both).
     Anything typed but not picked searches the slug, the title and the prompt
     and brief instead. The filter lives in the query string (nuqs), next to the
     hash the selection is in, so
     https://abernier.github.io/examples/?kind=landing&tags=water,caustics&q=surf#lp-surf
     is a link to a shortlist as much as to a page. It's written with
     `replaceState`, so the back button stays about the examples.
  4. `.github/og.mjs` writes the social card tags into every `index.html` in
     `dist/` — `og:image` is that project's thumbnail, `og:title`/`og:description`
     are read from the page's own `<title>`/`<meta name=description>`. The gallery
     itself gets `dist/_previews/_home.jpg`, a contact sheet of the thumbs that
     `preview.mjs` composes. Tags go in a `<!-- og:start -->…<!-- og:end -->`
     block a rerun replaces, and a page that already carries its own `og:image`
     is left alone.

  `git add -f dist/index.html` to hand-write the gallery page instead —
  `build-home.sh` then leaves it alone.
- In dev the gallery has no `dist/<name>/` to iframe, so it points at each
  example's own vite server instead — port derived from the slug
  (`packages/dev/port.mjs`), the same one `pnpm --filter <name> dev` binds. It
  asks its own dev server whether that port answers (`/@up/<port>`, one TCP
  connect) and, when it doesn't, shows the command that starts that workspace
  rather than a broken frame.
- Every PR gets a deployed copy of the same `dist/` on Vercel
  (`.github/workflows/preview.yml`, project `abernier/examples`, repo secret
  `VERCEL_TOKEN`), commented on the PR. These pages are visual — a diff doesn't
  review them, and there is no built output in it to review either. Pages still
  only ever serves `main`, and the preview never touches the Vercel project's
  production URL. PRs from forks skip the job: no secrets there.

  `vercel.json` sets `git.deploymentEnabled: false`, which switches off Vercel's
  own Git integration. It can't build this site: the gallery needs the Playwright
  screenshots (`.github/preview.mjs`) and the social cards (`.github/og.mjs`),
  neither of which happens in a `vercel build`, and it has no access to the
  previews cache — so it either shipped a thumbnail-less gallery or, once the
  output directory didn't match, nothing at all. CI builds the whole `dist/` and
  hands it over prebuilt instead; `vercel deploy --prebuilt` is a CLI deploy and
  is unaffected by that switch.
- From the repo root:
  ```sh
  pnpm dev          # src/home/ in dev — pnpm --filter <name> dev for an example
  pnpm build        # turbo, then ./sync.sh — every example into dist/
  pnpm build:home   # ./build-home.sh — the gallery over it
  pnpm preview      # serve dist/ as deployed
  pnpm shots        # ./preview.sh — build, re-screenshot, gallery (needs Docker)
  pnpm og           # inject the social cards — CI does this on every deploy
  ```
- To regenerate everything locally: `./preview.sh` (the examples with turbo, the
  screenshots in the same container image as CI — needs Docker — then the
  gallery).
- Client-side routed SPAs need a `404.html` copy of their `index.html` inside
  their own folder to survive deep links.
- One-time setup: repo settings → Pages → **Source: GitHub Actions**.
