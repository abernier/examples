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
- No `dist/index.html`, so https://abernier.github.io/examples/ itself 404s
  (Pages doesn't do directory listings). Drop one in if you want a landing page.
- Client-side routed SPAs need a `404.html` copy of their `index.html` inside
  their own folder to survive deep links.
- One-time setup: repo settings → Pages → **Source: GitHub Actions**.
