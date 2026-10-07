// SCARECROW — a cross of two stakes, a sacking head and a coat, 2.2 m.
//
// v1 has no scarecrow. Its nearest relative is the glacial snowman in
// `propAssets()` (`src/world/catalog.js`): a body sphere, a head sphere, coal
// eyes and a carrot — a breakable, scoreable figure standing in a field. This
// is built to the same brief, in this library's idiom, because the thing a
// scarecrow does for a landscape is what the snowman does for a snowfield: it
// is the only object out there at HUMAN size and shape, which is what gives
// everything else its scale.
//
// The frame is the point. A scarecrow is a cross first and a figure second —
// the arms are a single stake through the post, so the silhouette is two
// straight lines however the coat hangs, and that reads at a distance where a
// stuffed shirt does not. It faces local +Z.

import * as THREE from 'three';
import { PropTemplate, standard, mergeGeoms, beam, sphereAt, cylinderAt } from './types';

const scarecrow: PropTemplate = {
  id: 'scarecrow',
  name: 'Scarecrow',
  category: 'settlement',
  description: 'Cross-frame scarecrow, 2.2 m. Dressing — not solid.',

  build: () => [
    {
      key: 'frame',
      geometry: mergeGeoms([
        // The post leans very slightly. Dead vertical it looks surveyed in;
        // nobody ever set one of these with a spirit level.
        beam(0.1, 2.2, 0.1, 0, 1.1, 0, 0, 0, 0.035),
        beam(1.55, 0.09, 0.09, 0, 1.56, 0, 0, 0, -0.06),       // the arm stake
      ]),
      material: standard(0x6b5a42, { roughness: 1 }),
      castShadow: true,
    },
    {
      key: 'clothes',
      geometry: mergeGeoms([
        beam(0.66, 0.72, 0.26, 0, 1.24, 0),                    // coat body
        beam(0.34, 0.3, 0.22, -0.55, 1.5, 0, 0, 0, 0.12),      // sleeves, over the stake
        beam(0.34, 0.3, 0.22, 0.55, 1.5, 0, 0, 0, -0.12),
        beam(0.5, 0.34, 0.24, 0, 0.78, 0),                     // the coat's ragged tail
      ]),
      material: standard(0xffffff),
      castShadow: true,
      // A scarecrow wears whatever the farm had spare, so the coat carries all
      // the variety — full hue, low saturation, so it reads as old cloth and
      // not as a flag.
      tint: (c) => new THREE.Color().setHSL(c.rng.float(), 0.3, 0.36 + c.rng.centered(0.08)),
    },
    {
      key: 'head',
      geometry: mergeGeoms([
        sphereAt(0.21, 8, 1.84),                               // sacking head
        // The hat sits ON the head, so the brim is at 1.90 and not at the top
        // of the skull — put it above 2.0 and it floats, which is what the
        // first pass did.
        cylinderAt(0.34, 0.34, 0.035, 10, 1.9),                // brim
        cylinderAt(0.24, 0.26, 0.18, 10, 1.9),                 // and crown
        // straw at the wrists and the neck: the tell that it is stuffed.
        beam(0.16, 0.2, 0.16, -0.76, 1.46, 0, 0, 0, 0.3),
        beam(0.16, 0.2, 0.16, 0.76, 1.46, 0, 0, 0, -0.3),
      ]),
      material: standard(0xffffff),
      castShadow: true,
      tint: (c) => new THREE.Color().setHSL(0.11, 0.34, 0.52 + c.rng.centered(0.06)),
    },
  ],

  // Not solid, and not a close call: it is two sticks and a coat. It is also
  // exactly the kind of object a player will aim at, so it must not be the
  // thing that ends their stage — the reward for hitting one should be
  // arriving on the other side of it wearing the hat.
  physics: { shape: () => ({ kind: 'none' }), solid: false, massKg: 25 },

  authoring: {
    scale: [0.9, 1.12], defaultScale: 1,
    avoidSurfaces: ['tarmac', 'ice', 'snow'],
    minRoadDist: 8, randomYaw: true,
  },
};

export default scarecrow;
