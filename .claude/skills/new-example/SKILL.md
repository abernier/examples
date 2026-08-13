---
name: new-example
description: Add a react-three-fiber landing page to this gallery — scaffold src/<slug>/, build the scene from real pmndrs demos, sync it into dist/ and publish it. Use when asked to create/add an example, a landing page, "impress me with a landing-page for X", "mix N techniques", or a batch of several at once.
---

# new-example

This repo is a gallery of small r3f landing pages, published at
https://abernier.github.io/examples/ . A contribution is one folder in `src/`
plus its build copied into `dist/`.

Two briefs, both valid:

- **usecase** — `/new-example jewelry-boutique` · a landing page *for* something.
- **mix** — `/new-example mix 3 techniques` · a landing page whose point is
  combining 3+ techniques from the pmndrs gallery.

With no argument, pick a usecase nobody has done yet (`ls src/`) and say which.

## Prerequisite

The scene must be built from the **`pmndrs:examples`** skill — the whole point of
the gallery. `.claude/settings.json` enables the plugin on first launch; if the
skill is not listed, install it:

```
/plugin marketplace add pmndrs/claude-code-plugin
/plugin install pmndrs@pmndrs
```

## 1. Slug

`lp-<theme>`, kebab-case, unique in `src/` and `dist/` — `lp-jewelry`,
`lp-deepsea`. The slug becomes the public URL: `/examples/<slug>/`.

## 2. Scaffold

```sh
cd src
npm create vite@latest <slug> -- --template react-ts
cd <slug>
npm i three @react-three/fiber @react-three/drei @react-three/postprocessing postprocessing maath
npm i -D @types/three
```

`postprocessing` is a peer of `@react-three/postprocessing`, not a dependency —
leave it out and the build dies on `Rolldown failed to resolve import
"postprocessing"`, with nothing wrong in your own code.

Then, in `vite.config.ts`, set a relative base so the build works both under
`/examples/<slug>/` and from `file://`:

```ts
export default defineConfig({
  base: './',
  plugins: [react()],
})
```

Delete the Vite boilerplate (`src/App.css`, `src/assets/`, the counter demo,
`public/vite.svg`) and replace `README.md` with 3–5 lines: what the page is, and
which pmndrs demos it borrows from.

## 2b. Manifest

`src/<slug>/manifest.json` — where the page came from. The gallery shows
`prompt` over the iframe, bottom-right, so a visitor sees what produced the page
they are looking at. Write it now, while the brief is still in front of you;
reconstructing it afterwards means digging through transcripts.

```json
{
  "title": "Cardia",
  "prompt": "/new-example ❤️",
  "brief": "One line on what that prompt turned into here.",
  "date": "2026-08-12",
  "model": "opus",
  "demos": ["glass-flower", "instanced-particles-effects"]
}
```

Only `prompt` is required, and it is **verbatim** — the argument the human typed,
not a tidied-up version of it, not your restatement of the task.

`brief` is the other half: what that prompt actually resolved to by the time
this page got built. `/new-example ❤️` is not an instruction, it is an emoji —
the instruction is what the skill turned it into once the argument was applied,
the slug chosen and the ambiguity settled. Write that. Two cases where it does
the most work:

- **A slash-command invocation.** Say which argument, what it resolved to, and
  any call you made along the way — if you asked the human which of two readings
  they meant, the answer they gave belongs here. With no argument at all, say
  which untouched usecase you picked.
- **A batch.** One prompt built five sites, so each manifest names the direction
  its own agent was handed.

Skip it only when the prompt already *is* the instruction, and reads that way
without you.

`date` is the day it was built, `model` the family that built it (`opus`,
`sonnet`, `haiku`), `demos` the pmndrs demo slugs it borrows from — same list as
the README.

`sync.sh` copies the manifest into `dist/<slug>/`, and `src/home/vite.config.ts`
reads it from there at build time.

## 3. Design from real demos — not from memory

Invoke `pmndrs:examples` and read `examples://index` before writing any scene
code. Open the 2–4 demos closest to the brief and **read their source**; port the
technique, don't reconstruct it from recollection. For the *mix* brief, the 3+
techniques must come from 3+ distinct demos and must be named in the README.

Use `pmndrs:docs` for API signatures (drei props, r3f hooks) — never guess them.

Suggested layout, matching what is already in `src/`:

```
src/
  main.tsx  App.tsx  styles.css
  three/     Experience.tsx + one file per effect
  site/      the DOM overlay (copy, nav, CTA)
```

## 4. The bar

It is called *impress-me* for a reason. A page ships when:

- **One strong idea**, executed fully — a hero material, a scroll rig, a
  particle system — not five half-effects.
- **Real copy.** A named brand, a headline, real sections, a CTA. No lorem, no
  "Your Title Here".
- **It reads at first frame.** The gallery thumbnail is a 1280×800 screenshot
  taken 2.5s after load (`.github/preview.mjs`) — no click, no scroll. If the
  page is black or half-loaded at that point, it is invisible in the gallery.
- **60fps on an integrated GPU.** Watch the drawcalls, instance instead of
  looping, keep the postprocessing stack short, `dispose()` what you create.
- **Responsive-ish** — a laptop and a phone should both get something sane.
- **Self-contained.** Assets live in `public/`. `<Environment preset>` and drei's
  asset helpers hit a CDN — fine, but know the page then needs the network.
- **Small.** Keep `dist/` around 1–2 MB; anything over ~4 MB needs a reason
  (compress textures, `.glb` over `.gltf`, draco).

Two things that reliably cost more than they look:

- `MeshTransmissionMaterial` renders the whole scene into its own buffer on every
  frame it is drawn — including cells scrolled far off screen. Six of them is
  nine scene renders per frame. Set `visible = false` on the sections that are
  not in view, and give the small ones lower `samples`/`resolution` and no
  `backside`.
- A transmissive object over a dark background has no silhouette: all you see is
  its rim. Give it something bright to refract — a lit plate behind it, or a lit
  wall — or it reads as a smudge.

## 5. Build and look at it

```sh
npm run build          # tsc -b && vite build — must be clean, no TS errors
npm run preview        # then open the printed URL in a browser tab
```

Actually look at the page before calling it done: first paint, scroll to the
bottom, resize narrow, check the console is quiet.

**Judge it the way the gallery will.** Drive a real browser at 1280×800 and wait
2.5s, exactly like `.github/preview.mjs`, and screenshot each section. Do not
judge from a Chrome tab you are driving in the background: a hidden tab throttles
`requestAnimationFrame` to nothing, so the scene renders two frames in ten
seconds and every screenshot comes back black. That looks precisely like a
performance bug and is not one. Playwright pages are always visible:

```js
const page = await chromium.launch({ channel: 'chrome' }).then((b) => b.newPage({
  viewport: { width: 1280, height: 800 },
}))
await page.goto(url, { waitUntil: 'networkidle' })
await page.waitForTimeout(2500)
await page.screenshot({ path: 'hero.jpg' })
```

Measure fps in that page too (count `requestAnimationFrame` calls over 2s)
rather than trusting how it feels.

## 6. Publish

From the repo root:

```sh
./sync.sh <slug>       # src/<slug>/dist/ + manifest.json -> dist/<slug>/
./preview.sh           # optional, needs Docker: regenerates the gallery locally
git add src/<slug> dist/<slug>
git commit -m "Add <slug> landing page"
```

`sync.sh` warns if `manifest.json` is missing — the page still deploys, it just
shows up promptless in the gallery.

`src/<slug>/dist/` and `node_modules/` are gitignored — commit the source and the
synced copy only. Pushing to `main` deploys.

## Batch mode

For "5 of them in parallel", spawn **one agent per site**, all in a single
message, each with its own slug and its own brief — and give each a distinct
direction (palette, technique, mood) so the batch does not converge on five blue
particle fields. Each agent runs steps 1–5 in its own `src/<slug>/`; run step 6
yourself once they all report back, so the commit stays coherent.

Every manifest in a batch carries the *same* `prompt` — the one prompt the human
typed, once — and its own `brief`, the direction you handed that agent, which is
what that prompt resolved to for that one site. Pass both strings down in the
agent's instructions so it does not have to guess either.
