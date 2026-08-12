# examples

Dumb static host, published under https://abernier.github.io/examples/

Only `dist/` is versioned: it *is* the site. Every push to `main` publishes it
as-is — no build step, no dependencies. `src/` stays local (gitignored).

```
dist/foo/  ->  https://abernier.github.io/examples/foo/
dist/bar/  ->  https://abernier.github.io/examples/bar/
```

## Adding / updating a project

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
3. Commit `dist/` and push → live at https://abernier.github.io/examples/<name>/

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
