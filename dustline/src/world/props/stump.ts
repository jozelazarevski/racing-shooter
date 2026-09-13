// STUMP — what a felled tree leaves. Low, solid, and easy to miss at speed,
// which is the point: a logging area should punish inattention.
//
// SHAPE FROM IGNITE RALLY, from both places v1 builds one:
//
//   `_buildForestFloorDecor(m4)` in `src/world/flora.js` gives the SAWN TOP.
//   v1's stump is one 7-sided cylinder with a three-material list on it,
//   `[barkMat, cutMat, cutMat]` — bark on the side, and on the end caps a
//   `cutMat` that is the trunk colour lerped 0.55 of the way to 0xd8c090. That
//   pale disc is the entire difference between a stump and a rock. This
//   component had four roots, a tapered bole and no cut face at all, so from
//   the only angle you ever see it from — above, at speed — it was a brown
//   lump.
//
//   `_buildCharredTrees(m4)` gives the ROOT FLARE: `stRoot`, a wide shallow
//   drum under the bole, so the stump sits in its own mound of heaved ground
//   instead of being pushed into flat terrain like a peg into a board.
//
// TWO DELIBERATE CHANGES:
//
//   1. THE FLARE IS NARROWER THAN v1'S. v1's is 1.58 times its bole's butt
//      radius; this one is 1.28. The reason is measured, not aesthetic: the
//      collider is 1.2 m across, `tools/verify-physics.mjs` allows a
//      full-coverage collider to fall short of its own footprint by 30% of it,
//      and v1's ratio would put the flare 0.92 m out and break that. Matching
//      the reach of the roots already here (0.74 m) keeps the footprint exactly
//      where it was, so nothing about the collider has to change.
//   2. THE TINT IS A SCALAR. Instance colour MULTIPLIES the material colour, so
//      the old tint — the material's own brown, returned again — rendered
//      0x6b533a squared. v1's wood-jitter idiom is `col.setScalar(0.8 + r*0.35)`
//      and that is what this is now.
//
// TRIANGLES: 161, against 116.
//
// NOT PORTED, and deliberately: v1's charred stump also carries `stShard`, a
// splinter standing up out of the break. That is a SNAPPED stump — a tree the
// wind took — and this component is a sawn one. The shard would contradict the
// cut face on the same object.

import * as THREE from 'three';
import { PropTemplate, cylinderAt, standard, mergeGeoms } from './types';

const stump: PropTemplate = {
  id: 'stump',
  name: 'Stump',
  category: 'flora',
  description: 'Sawn trunk on a root flare, pale cut face on top. Low and solid — easy to miss at speed.',

  build: () => [
    {
      key: 'body',
      geometry: mergeGeoms([
        cylinderAt(0.44, 0.58, 0.85, 9, 0),
        // v1's `stRoot`: the heaved ground the stump stands in — see change 1.
        cylinderAt(0.6, 0.74, 0.16, 9, 0),
        ...[0, 1, 2, 3].map((i) => {
          const a = (i / 4) * Math.PI * 2 + 0.4;
          const g = cylinderAt(0.1, 0.2, 0.7, 5, 0);
          g.rotateZ(1.15);
          g.rotateY(a);
          g.translate(Math.sin(a) * 0.42, 0.1, Math.cos(a) * 0.42);
          return g;
        }),
      ]),
      material: standard(0x6b533a, { flatShading: false }),
      castShadow: true,
      tint: (c) => new THREE.Color().setScalar(0.86 + c.rng.float() * 0.28),
    },
    {
      // v1's `cutMat` as its own disc. A circle, not a cylinder: the underside
      // is inside the bole and would never be seen, so 9 triangles buys the
      // whole read.
      key: 'cut',
      geometry: (() => {
        const g = new THREE.CircleGeometry(0.43, 9);
        g.rotateX(-Math.PI / 2);
        g.translate(0, 0.851, 0);
        return g;
      })(),
      // 0x6b533a lerped 0.55 toward v1's 0xd8c090 — v1's `cutMat`, evaluated
      // against this component's bark colour.
      material: standard(0xa78f69, { flatShading: false }),
    },
  ],

  physics: {
    shape: (s) => ({ kind: 'cylinder', halfHeight: 0.45 * s, radius: 0.6 * s, centerY: 0.45 * s }),
    solid: true,
    massKg: 400,
  },

  authoring: {
    scale: [0.8, 1.5], defaultScale: 1,
    avoidSurfaces: ['tarmac', 'ice', 'sand'], minRoadDist: 9, randomYaw: true,
  },
};

export default stump;
