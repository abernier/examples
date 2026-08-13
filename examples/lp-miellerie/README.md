# lp-miellerie

Landing page for *Miellerie du Val Perdu*, an artisanal honey house — a wall of
honeycomb raked by two warm volumetric spots, with hexagonal cells of raw honey
floating in front of it, tied to the page scroll.

Built from four pmndrs examples, read through the `pmndrs:examples` skill:

- [`inter-epoxy-resin`](https://pmndrs.github.io/examples/examples/inter-epoxy-resin)
  — `MeshTransmissionMaterial` settings (thickness, distortion, chromatic
  aberration) and the declarative `<Environment>` of `<Lightformer>`s, retuned
  from pink epoxy to amber honey.
- [`volumetric-spotlight`](https://pmndrs.github.io/examples/examples/volumetric-spotlight)
  — drei `SpotLight` + `useDepthBuffer({ frames: 1 })` soft particles, target
  lerped towards the pointer.
- [`instances`](https://pmndrs.github.io/examples/examples/instances) — the comb:
  ~400 hexagonal prisms in one instanced draw call, coloured per instance via an
  `instancedBufferAttribute` attached as `attributes-color`.
- [`tying-canvas-to-scroll-offset`](https://pmndrs.github.io/examples/examples/tying-canvas-to-scroll-offset)
  — the DOM keeps the scrollbar, the canvas damps a group towards
  `viewport.height * scroll`; the wall uses a lower factor for parallax.

No downloaded assets — the environment, the comb and the honey are all
procedural, so the page renders offline.

```sh
pnpm --filter lp-miellerie dev
pnpm --filter lp-miellerie build && ../../sync.sh lp-miellerie
```
