# lp-synth

Landing page for *RACKWERK*, a boutique eurorack shop — a 104 HP two-row case,
generated from real eurorack dimensions (1 HP = 5.08 mm, 3U = 128.5 mm), lit
like a bench and patched with a dozen cables.

Everything on screen is procedural: no model, no texture file, nothing fetched.

- `rack/layout.js` — the catalogue and a deterministic PRNG lay out panels,
  knobs, jacks, LEDs and screws as plain data. The DOM table in
  `site/Page.jsx` reads the same catalogue, so the page and the rack cannot
  disagree.
- `rack/Rack.jsx` — one drei `<Instances>` call per control family (knobs, caps,
  pointers, jacks, nuts, LEDs, screws), so a few thousand parts cost a handful of
  draw calls. The LEDs are driven by a fake 124 BPM sequencer clock.
- `rack/silkscreen.js` — every panel legend painted once into a single canvas
  texture, laid over the faceplates as one plane.
- `rack/Cables.jsx` — patch cables as CatmullRom curves swept into tubes, merged
  into one vertex-coloured buffer and swayed per frame.
- `rack/Scope.jsx` — a live oscilloscope drawn into a `CanvasTexture` at 40 fps.
- `scene/Scene.jsx` — the studio: a declarative `<Environment>` of
  `<Lightformer>` softboxes, which is what brushed aluminium and plated jacks
  actually reflect, plus Bloom for the LEDs.
- `scene/Rig.jsx` — one camera stop per section, picked by scroll and damped.

```sh
pnpm --filter lp-synth dev
pnpm --filter lp-synth build && ../../sync.sh lp-synth
```
