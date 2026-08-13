---
name: new-example
description: Add an entry to this react-three-fiber gallery — scaffold the src/<slug>/ workspace, build the scene from real pmndrs demos, and publish it. Use when asked to create/add an example here, to build something in this repo from a prompt, or a batch of several at once.
---

# new-example

A gallery of small react-three-fiber sites, published at
https://abernier.github.io/examples/ . A contribution is one pnpm workspace in
`src/` — sources only: `dist/` is built by CI and isn't in the repo.

**The prompt is the brief.** Build what it asks for, in the form it asks for. It
may name a subject, a technique, a mood, an emoji, or nothing at all — this
skill does not narrow that down and does not assume a shape. What follows is
only the mechanics, fixed because the deploy depends on them.

If the prompt reads two ways and the two lead somewhere genuinely different,
ask. Otherwise decide, and say what you decided. With no prompt at all, build
something the gallery does not have yet (`ls src/`) and say what you picked.

## Prerequisite

The scene is built from the **`pmndrs:examples`** skill — that is the point of
the gallery. `.claude/settings.json` enables the plugin on first launch; if the
skill is not listed:

```
/plugin marketplace add pmndrs/claude-code-plugin
/plugin install pmndrs@pmndrs
```

## 1. Scaffold

Slug: kebab-case, unique in `src/`, and it becomes the public URL —
`/examples/<slug>/`. It is also the workspace name, so `package.json` carries it
as `name`. The existing ones are all `lp-*`; follow that unless the prompt makes
it absurd.

```sh
cd src
pnpm create vite@latest <slug> --template react-ts
cd ../..
pnpm --filter <slug> add three @react-three/fiber @react-three/drei @react-three/postprocessing postprocessing maath
pnpm --filter <slug> add -D @types/three @examples/dev
```

`postprocessing` is a peer of `@react-three/postprocessing`, not a dependency —
leave it out and the build dies on `Rolldown failed to resolve import
"postprocessing"`, with nothing wrong in your own code.

`vite.config.ts`, like every other one here — `base: './'` because the build has
to work both under `/examples/<slug>/` and from `file://`, and the port so the
gallery can iframe this workspace in dev without being told where it is:

```ts
import path from 'node:path'
import { generatePort } from '@examples/dev'
// …
const port = generatePort(path.basename(import.meta.dirname))

export default defineConfig({
  base: './',
  plugins: [react()],
  server: { port, strictPort: true },
  preview: { port, strictPort: true },
})
```

Delete the Vite boilerplate (`src/App.css`, `src/assets/`, the counter demo,
`public/vite.svg`) and replace `README.md` with 3–5 lines: what this is, and
which pmndrs demos it borrows from.

## 2. Port, don't recall

Invoke `pmndrs:examples`, read `examples://index`, then **read the source** of
the demos closest to the prompt before writing scene code. Port the technique;
do not reconstruct it from memory. `pmndrs:docs` for API signatures — never
guess drei props or r3f hooks.

## 3. Manifest

`src/<slug>/manifest.json` — where this came from. The gallery shows `prompt`
over the bottom-right corner of the iframe. Write it while the brief is still in
front of you; reconstructing it later means digging through transcripts.

```json
{
  "title": "Cardia",
  "prompt": "/new-example ❤️",
  "brief": "What that prompt resolved to here.",
  "date": "2026-08-12",
  "model": "opus",
  "kind": "landing",
  "tags": ["bloom", "instancing", "particles", "postprocessing", "transmission"],
  "demos": ["glass-flower", "instanced-particles-effects"]
}
```

`prompt` is required and **verbatim** — what the human typed, not a tidied-up
version, not your restatement.

`brief` is what that prompt had resolved to by the time the thing existed:
argument applied, slug chosen, ambiguity settled. `/new-example ❤️` is not an
instruction, it is an emoji — the instruction is what it became. If you asked
the human which reading they meant, their answer belongs here. If a sub-agent
built it, this is the direction you handed that agent. Skip it only when the
prompt already *is* the instruction and reads that way without you.

`date` is the day it was built, `model` the family that built it (`opus`,
`sonnet`, `haiku`), `demos` the pmndrs slugs it borrows — same list as the
README.

`kind` is what the thing *is*, one word, and every example here so far is a
`landing`. It's the other half of the filter — its own group in the combobox,
above the techniques — so it only earns a new value when the thing genuinely
isn't a landing page any more (a `toy`, a `game`, a `viewer`). One kind per
example; if you hesitate between two, it's a tag you want, not a kind.

`tags` is required, and it is what the sidebar filter offers: the techniques
actually on screen, lowercase, sorted, kebab-case. Name what you rendered, not
what the page is about — `water` because there is water, never `surf-school`.
Reuse a tag the other manifests already use before minting a new one; the
vocabulary is the union of every manifest, so a spelling of your own splits the
filter in two. Current set:

```
bloom  caustics  clouds  depth-of-field  fire  grass  instancing  particles
physics  postprocessing  reflections  scroll  shader  shadows  sky  stars
trails  transmission  volumetric  water
```

A genuinely new technique earns a new tag — add it and it appears in the filter
on its own. `postprocessing` and `bloom` are on most of them, so they narrow
little; the specific ones are what make the filter worth having.

The manifest is also what makes this folder an example rather than just a
workspace: it is what turbo builds, what `sync.sh` ships and what the gallery
lists (`packages/dev/examples.mjs`). No manifest, no entry.

## 4. Build and look at it

```sh
pnpm --filter <slug> build     # tsc -b && vite build — clean, no TS errors
pnpm --filter <slug> preview   # then open the printed URL
```

Look at it before calling it done: first paint, scroll to the bottom, resize
narrow, console quiet.

One constraint the gallery imposes whatever you built: its thumbnail is a
1280×800 screenshot taken **2.5s after load**, no click, no scroll
(`.github/preview.mjs`). Black or half-loaded at that point means invisible in
the gallery. So judge it the same way — a real browser, same viewport, same
wait. Not a Chrome tab you drive in the background: a hidden tab throttles
`requestAnimationFrame` to nothing, the scene renders two frames in ten seconds,
every screenshot comes back black, and it looks exactly like a performance bug
it isn't. Playwright pages are always visible:

```js
const page = await chromium.launch({ channel: 'chrome' }).then((b) => b.newPage({
  viewport: { width: 1280, height: 800 },
}))
await page.goto(url, { waitUntil: 'networkidle' })
await page.waitForTimeout(2500)
await page.screenshot({ path: 'hero.jpg' })
```

## 5. Publish

```sh
./sync.sh <slug>       # src/<slug>/dist/ + manifest.json -> dist/<slug>/
./preview.sh           # optional, needs Docker: regenerates the gallery locally
git add src/<slug>
git commit -m "Add <slug>"
```

Sources only: `dist/` is gitignored, at the root and in the workspace both — CI
rebuilds the whole site on every push, so there is nothing built to commit.
Pushing to `main` deploys.

## Batch

For "5 in parallel", spawn one agent per entry, all in a single message, each
with its own slug and its own direction — distinct enough that five agents don't
converge on the same blue particle field. Each runs steps 1–4 in its own
`src/<slug>/`; run step 5 yourself once they report, so the commit stays
coherent.

Every manifest in a batch carries the same `prompt` — the one the human typed,
once — and its own `brief`. Pass both strings down so no agent has to guess
either.
