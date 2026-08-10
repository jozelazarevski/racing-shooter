// DRY-STONE WALL — an 8 m run of field boundary. The settlement counterpart to
// the timber fence run: it divides open country into fields, which is what
// makes farmland look farmed rather than merely green.
//
// Not solid. An 0.9 m wall you cannot cross turns every field into a pen, and
// a rally car clipping one should lose time, not stop dead. When M4 brings
// destructible scenery this is the first thing that should get it.

import * as THREE from 'three';
import { PropTemplate, standard, mergeGeoms, beam } from './types';

const stoneWall: PropTemplate = {
  id: 'stoneWall',
  name: 'Dry-stone wall',
  category: 'settlement',
  description: '8 m field wall, 0.9 m high. Dressing — not solid.',

  build: () => [{
    key: 'course',
    // Four courses of staggered blocks. The stagger is what reads as stone;
    // an even grid reads as brick, which is a different century.
    geometry: mergeGeoms([0, 1, 2, 3].flatMap((row) =>
      Array.from({ length: 9 - (row & 1) }, (_, i) => {
        const w = 0.78 + ((i * 7 + row * 3) % 5) * 0.06;
        const x = -4 + i * 0.9 + (row & 1 ? 0.45 : 0) + 0.45;
        const h = 0.2 + ((i + row) % 3) * 0.025;
        return beam(w, h, 0.44 - row * 0.05, x, 0.11 + row * 0.22, 0, 0, ((i + row) % 4) * 0.02, 0);
      }))),
    material: standard(0x9d968b, { roughness: 1 }),
    castShadow: true,
    tint: (c) => new THREE.Color(0x9d968b).offsetHSL(
      c.rng.centered(0.02), c.rng.centered(0.03), c.rng.centered(0.07),
    ),
  }],

  physics: { shape: () => ({ kind: 'none' }), solid: false, massKg: 6000 },

  authoring: { scale: [0.9, 1.2], defaultScale: 1, minRoadDist: 9, randomYaw: true },
};

export default stoneWall;
