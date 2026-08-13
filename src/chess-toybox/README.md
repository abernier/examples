# chess-toybox

**Toybox** — a playable chess set of Toy Story toys on the floor of a kid's
bedroom, cloud wallpaper and all. Click a toy, click a square; the other side
plays back. `chess.js` owns the rules, every toy keeps its identity across moves
so it can be *pushed* to its square rather than teleport there, and the room
itself is two procedural canvas textures — the only things fetched are the six
models below.

Woody is the king, Jessie the queen, Buzz the bishop, Buttercup the knight (a
cavalier, literally), Trixie the rook — the tower on four legs — and eight green
army men the pawns, against eight tan ones.

Ported from pmndrs examples: [`baking-soft-shadows`][1] (the light rig and the
staging), [`mount-transitions`][2] (ContactShadows over a plain lit scene),
[`basic-example`][3] (self-contained components owning their own pointer
events). [`soft-shadows`][4]'s PCSS is deliberately *not* here — see the note in
`src/three/Room.tsx`.

[1]: https://pmndrs.github.io/examples/examples/baking-soft-shadows
[2]: https://pmndrs.github.io/examples/examples/mount-transitions
[3]: https://pmndrs.github.io/examples/examples/basic-example
[4]: https://pmndrs.github.io/examples/examples/soft-shadows

## Models

All six are **CC BY 4.0**, from Sketchfab, and all six are redistributed here
under that licence — reduced to 512px WebP textures and quantized with
`gltf-transform optimize`, which is what gets the whole cast under a megabyte.

| in the set | model | author |
| --- | --- | --- |
| king | [Woody](https://sketchfab.com/3d-models/woody-e4d2cc083bd1425699b01b7241ef6c67) | gaddiellartey2010 |
| queen | [Jessie PSP Rig (Toy Story 3)](https://sketchfab.com/3d-models/jessie-psp-rig-toy-story-3-e18ba1154d0946888bd7f4c604cf1901) | Guilherme Navarro |
| bishop | [Buzz Lightyear PSP Rig (Toy Story 3)](https://sketchfab.com/3d-models/buzz-lightyear-psp-rig-toy-story-3-5bf637a4724e4005a24077fa28860f01) | Guilherme Navarro |
| knight | [Butter Cup](https://sketchfab.com/3d-models/butter-cup-a6500508696e415a9c4c71250142d935) | patrick.ambrose28402 |
| rook | [Trixie](https://sketchfab.com/3d-models/trixie-fa18c2345df249dd8dea185cba60e4e9) | patrick.ambrose28402 |
| pawn | [Green Army Figure](https://sketchfab.com/3d-models/green-army-figure-18bf9d7a04e14f2c9d01d81f1bef1681) | bforeman |

Toy Story and its characters belong to Disney/Pixar. This is a demo of a
rendering technique, not a product.

Three of them are rigged and arrive in a T-pose, which is why `Piece.tsx` turns
two named joints before measuring anything — see the comment there; it is the
most surprising thing in this folder. The rigged Woody is *not* one of them: his
arms are welded to a broken bind matrix and come out as two long spikes, so the
king is the one static mesh in the set.
