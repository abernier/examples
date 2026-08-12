# lp-cardia

Landing page for **Cardia**, a fictional continuous-ECG patch. One glass heart,
beating on a real PQRST waveform — the same `src/lib/cardiac.ts` curve drives the
muscle's squeeze, the trace on screen, the emissive core, the pulse rings and the
BPM readout in the DOM, so nothing can drift out of sync.

Borrowed from the pmndrs gallery:

- [`transparent-aesop-bottles`](https://pmndrs.github.io/examples/examples/transparent-aesop-bottles) — the bright studio + transmission staging
- [`glass-flower`](https://pmndrs.github.io/examples/examples/glass-flower) — `MeshTransmissionMaterial` over a solid emissive core, and the Lightformer env
- [`instanced-particles-effects`](https://pmndrs.github.io/examples/examples/instanced-particles-effects) — the one-draw-call instanced circulation field
- [`bezier-curves-and-nodes`](https://pmndrs.github.io/examples/examples/bezier-curves-and-nodes) — drei's `Line`, here mutated per frame for the ECG trace
- [`tying-canvas-to-scroll-offset`](https://pmndrs.github.io/examples/examples/tying-canvas-to-scroll-offset) — the DOM-owns-the-scrollbar rig
