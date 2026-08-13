# chess-toybox

**Toybox** — a playable chess set on the floor of a kid's bedroom, cloud
wallpaper and all, with the toy box on one side of the board and the kitchen from
*Ratatouille* on the other. Click a piece, click a square; the other side plays
back. `chess.js` owns the rules, every piece keeps its identity across moves so
it can be *pushed* to its square rather than teleport there, and the room itself
is two procedural canvas textures — the only things fetched are the twelve models
below.

|  | white — the toy box | black — the kitchen |
| --- | --- | --- |
| king | Woody | Linguini, the commis |
| queen | Bo Peep | Colette, the chef |
| bishop | Buzz — the diagonal is the closest thing to flying | Anton Ego, the critic, who only ever comes at you sideways |
| knight | Buttercup, a cavalier, literally | Émile, Rémy's brother |
| rook | Trixie, the tower on legs | Mabel, and her shotgun |
| pawn | eight army men | eight Rémys — the colony |

The knight is the only piece that leaves the board: everything else slides.

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

All twelve are **CC BY 4.0** from Sketchfab, redistributed here under that
licence — reduced to 512px WebP textures and quantized with `gltf-transform
optimize`, which is what gets both armies under a megabyte and a half. Nine of
them are by the same author, [Guilherme Navarro][gn], who rips and rigs them from
the games.

[gn]: https://sketchfab.com/guinavarro.al

| model | author |
| --- | --- |
| [Woody — Disney Magic Kingdoms](https://sketchfab.com/3d-models/woody-disney-magic-kingdoms-13bb7a933204457f9291ddccdec1747a) | Guilherme Navarro |
| [Bo Peep (Adventure)](https://sketchfab.com/3d-models/bo-peep-adventure-toy-story-83da7fb8b1284fa6bf5b743db3893f80) | Guilherme Navarro |
| [Buzz Lightyear (KH3)](https://sketchfab.com/3d-models/buzz-lightyear-toy-story-kh3-d5943db8541d43fe844b9b3b0c107a96) | Guilherme Navarro |
| [Linguini](https://sketchfab.com/3d-models/linguini-ratatouille-b0b42a28db8f4e9db0c1b65a2bef7e4a) | Guilherme Navarro |
| [Colette](https://sketchfab.com/3d-models/colette-ratatouille-f0c8a13574bd4931bc5c6d8c5edebe11) | Guilherme Navarro |
| [Anton Ego](https://sketchfab.com/3d-models/anton-ego-ratatouille-b2c622c109e9481ca5062ee6621af6f9) | Guilherme Navarro |
| [Emile](https://sketchfab.com/3d-models/emile-ratatouille-6c72dcdfdbca45c1951419cb346e84d9) | Guilherme Navarro |
| [Mabel](https://sketchfab.com/3d-models/mabel-ratatouille-a43c6ad44ba044d98189c168e4052598) | Guilherme Navarro |
| [Remy](https://sketchfab.com/3d-models/remy-ratatouille-63f94ee51a6340cabdb8ae2da924c7f9) | Guilherme Navarro |
| [Butter Cup](https://sketchfab.com/3d-models/butter-cup-a6500508696e415a9c4c71250142d935) | patrick.ambrose28402 |
| [Trixie](https://sketchfab.com/3d-models/trixie-fa18c2345df249dd8dea185cba60e4e9) | patrick.ambrose28402 |
| [Green Army Figure](https://sketchfab.com/3d-models/green-army-figure-18bf9d7a04e14f2c9d01d81f1bef1681) | bforeman |

Toy Story, Ratatouille and their characters belong to Disney/Pixar. This is a
demo of a rendering technique, not a product.

Most of them arrive in a T-pose, which is why `Piece.tsx` lowers the arms before
measuring anything — the most surprising thing in this folder, and worth reading
the comment there. It works off the skeletons' own joint names rather than a
table of per-model numbers, so it also covers the ones that don't need it. Mabel
is the exception: her file has no skeleton at all, so she keeps her arms out,
which for the woman who chases Rémy out of her kitchen with a shotgun is close
enough to right.
