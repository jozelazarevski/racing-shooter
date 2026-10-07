// DRY-STONE WALL — an 8 m run of field boundary. The settlement counterpart to
// the timber fence run: it divides open country into fields, which is what
// makes farmland look farmed rather than merely green.
//
// Not solid. An 0.9 m wall you cannot cross turns every field into a pen, and
// a rally car clipping one should lose time, not stop dead. When M4 brings
// destructible scenery this is the first thing that should get it.
//
// ---------------------------------------------------------------------------
// 408 TRIANGLES, x61 IN HARBOUR — 49,776 SUBMITTED PER FRAME, AND NONE OF IT
// COMES OUT WITH A TESSELLATION CUT. This was examined in the sub-pixel pass
// that took the boat fenders and the telegraph insulators apart, because by
// submitted-triangle count it is the single most expensive component in the
// harbour. It was left alone, and the reason is a measurement:
//
//   longest edge per triangle, all 408:   <20 cm  0 |  20-50 cm 124 |  >50 cm 284
//
// There is no small geometry here to remove. Every triangle is a face of a
// rectangular block roughly 0.9 m x 0.22 m, and a box is 12 triangles — which
// is already the fewest a box can be. The only levers are:
//
//   FEWER BLOCKS. The stagger IS the read; the file says so two lines below,
//     and the blocks are already 3.5:1 slabs. Nine per course to seven is 24%
//     off and turns a dry-stone wall into precast panels.
//   DROPPING HIDDEN FACES. Tempting — every bottom face sits on the course
//     below — and wrong here. Courses alternate 9 and 8 blocks on a half-block
//     offset, so an even course overhangs the odd one under it by about half a
//     metre at each end, and each block carries a roll of up to 0.06 rad. A
//     face assumed hidden that is not is a see-through hole in a wall, which is
//     the class of defect this repository already has photographs of.
//
// What this component actually needs is per-instance visibility and a distance
// LOD: at 100 m its courses are 1.8 px apart and 61 of them are submitted from
// wherever the camera is looking. That is an engine fix, not a geometry one,
// and cutting the wall's shape to fake it would spend the silhouette twice.

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
