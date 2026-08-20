// PALM — the coastal / oasis tree. A leaning trunk under a crown of drooping
// fronds and a cluster of dates.
//
// SHAPE FROM IGNITE RALLY: `_buildPalms(m4)` in `src/world/flora.js` at the
// repository root, species DATE PALM — "tall bare trunk under a fan crown of
// drooping fronds plus a fruit cluster (the skyline shape)".
//
// THE FROND IS THE PORT, and it is v1's construction step for step: a 4-sided
// cone (radius 0.5, 3.1 long) laid over so its axis runs out along +x, pushed
// out to 1.5, then SCALED (1, 0.22, 0.72) into a flat blade, then drooped by
// rotateZ, then spun into place. Two things fall out of that which the boxes
// this file used could not do. A frond TAPERS TO A POINT — a box is the same
// width at the tip as at the stem, which is a plank, not a leaf. And the droop
// ALTERNATES, `-0.36 - (i % 2) * 0.22`, so the crown is two interleaved rings
// at different angles instead of one flat parasol. v1's fruit cluster comes
// with it, at v1's offset from the crown and in v1's own brown (0x6a4a26), and
// like v1 it is excluded from the frond tint — v1's note on tinting the trunk
// green is that it "rendered near-black: a grove of black poles under pale
// fans, reading as TV aerials rather than palms".
//
// WHAT DID NOT COME ACROSS: v1's trunk, which is one straight cylinder. The
// stacked leaning segments here are dustline's and they are the better shape,
// for the reason already written below.
//
// ONE THING FIXED IN PASSING: the crown was mounted at x = 0, and the trunk it
// stands on leans 0.34 m out by the time it reaches the top. The head of the
// palm was floating a third of a metre off the end of its own trunk. The crown
// and the fruit now sit over the measured trunk head instead.
//
// MEASURED: 372 triangles against 324 — six four-sided cones and the fruit
// against six boxes — and 4.56 m tall against 5.12 m, because v1's fronds
// droop from the crown where the boxes here were tilted UP out of it.

import * as THREE from 'three';
import { PropTemplate, cylinderAt, standard, mergeGeoms } from './types';

/** Where the leaning trunk actually ends: MEASURED, segment 6 of 7 tops out at
 *  y 4.40 displaced `sin(6/7 * 1.5) * 0.35` = 0.336 in x. The crown sits 4 cm
 *  over that, which is where a frond ring grows from. */
const HEAD_X = 0.336;
const HEAD_Y = 4.44;

/** v1's frond, in v1's order of operations. */
function frond(i: number, count: number): THREE.ConeGeometry {
  const g = new THREE.ConeGeometry(0.5, 3.1, 4);
  g.rotateZ(-Math.PI / 2);                        // axis -> +x
  g.translate(1.5, 0, 0);
  g.scale(1, 0.22, 0.72);                         // flattened blade
  g.rotateZ(-0.36 - (i % 2) * 0.22);              // droop, alternating
  g.rotateY(i * (Math.PI * 2 / count) + 0.35);
  g.translate(HEAD_X, HEAD_Y, 0);
  return g;
}

const palm: PropTemplate = {
  id: 'palm',
  name: 'Palm',
  category: 'flora',
  description: 'Leaning trunk, six drooping fronds, a cluster of dates. Solid trunk.',

  build: () => [
    {
      key: 'trunk',
      geometry: (() => {
        // stacked segments with a slight lean, which is what stops a palm
        // reading as a lamp post with a hat
        const segs = [];
        for (let i = 0; i < 7; i++) {
          const t = i / 7;
          const g = cylinderAt(0.2 - t * 0.06, 0.24 - t * 0.06, 0.68, 9, i * 0.62);
          g.translate(Math.sin(t * 1.5) * 0.35, 0, 0);
          segs.push(g);
        }
        return mergeGeoms(segs);
      })(),
      material: standard(0x8a7350, { flatShading: false }),
      castShadow: true,
    },
    {
      key: 'crown',
      geometry: mergeGeoms([0, 1, 2, 3, 4, 5].map((i) => frond(i, 6))),
      material: standard(0xffffff),
      castShadow: true,
      tint: (c) => new THREE.Color().setHSL(0.27, 0.52, 0.3).offsetHSL(0, 0, c.rng.centered(0.04)),
    },
    {
      // v1's fruit cluster, at v1's offset below and outboard of the crown.
      // Its own material and NO TINT — see the header on what tinting the
      // non-foliage parts of a palm does.
      key: 'fruit',
      geometry: (() => {
        const g = new THREE.SphereGeometry(0.22, 6, 5);
        g.translate(HEAD_X + 0.28, HEAD_Y - 0.3, 0.18);
        return g;
      })(),
      material: standard(0x6a4a26, { flatShading: false }),
      castShadow: true,
    },
  ],

  physics: {
    shape: (s) => ({ kind: 'cylinder', halfHeight: 2.2 * s, radius: 0.28 * s, centerY: 2.2 * s }),
    solid: true,
    // COVERAGE — the trunk. Fronds part round a car.
    coverage: 'trunk',
    massKg: 480,
  },

  authoring: {
    scale: [0.9, 1.5], defaultScale: 1.1,
    avoidSurfaces: ['snow', 'ice'], minRoadDist: 10, randomYaw: true,
  },
};

export default palm;
