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
  time by `.github/preview.mjs`: it screenshots every `dist/<name>/` (Playwright,
  in the `mcr.microsoft.com/playwright` container — browsers already baked in) into
  `dist/_previews/` and writes an index of thumbnails. Both are gitignored since
  they're rebuilt on every deploy. `git add -f dist/index.html` to hand-write it
  instead.
- To regenerate previews locally: `./preview.sh` (same container image as CI,
  needs Docker).
- Client-side routed SPAs need a `404.html` copy of their `index.html` inside
  their own folder to survive deep links.
- One-time setup: repo settings → Pages → **Source: GitHub Actions**.
