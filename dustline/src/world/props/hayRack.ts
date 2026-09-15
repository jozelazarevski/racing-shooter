// HAY RACK — a field feeder, 3 m of timber frame with a bite of hay in it.
//
// SHAPE FROM IGNITE RALLY: `_fieldProp(x, z, rot, 'hayrack', K)` in
// `src/track.js` at the repository root, ported box for box:
//
//     { w: 0.24, h: 2.0, d: 0.24, x: -1.4, y: 1.0, z: -0.7 }   tall back posts
//     { w: 0.24, h: 2.0, d: 0.24, x:  1.4, y: 1.0, z: -0.7 }
//     { w: 0.24, h: 1.4, d: 0.24, x: -1.4, y: 0.7, z:  0.7 }   short front posts
//     { w: 0.24, h: 1.4, d: 0.24, x:  1.4, y: 0.7, z:  0.7 }
//     { w: 3.0,  h: 0.18, d: 1.7, x: 0, y: 1.5, z: 0 }         sloping-back top
//     { w: 3.0,  h: 0.9,  d: 0.16, x: 0, y: 1.0, z: -0.7 }     back boarding
//
// v1's mergeBoxes centres each box on the y given, and its meshes are placed
// with their base on the ground, so those y values transfer straight into
// `beam` with no rebasing. The front is open and the back is boarded, which is
// how a feeder stands against a hedge; it runs along local X.
//
// TWO THINGS ADDED. v1's rack is empty — it is dressing in a world where the
// hay is a separate prop — and a feeder with nothing in it reads as a bench.
// So there is hay in it, and four slats across the open front to hold the hay
// in, which is the only reason a rack has an open front instead of no front.

import * as THREE from 'three';
import { PropTemplate, standard, mergeGeoms, beam } from './types';

const hayRack: PropTemplate = {
  id: 'hayRack',
  name: 'Hay rack',
  category: 'settlement',
  description: 'Field feeder, 3 m, with hay in it. Not solid — light timber.',

  build: () => [
    {
      key: 'frame',
      geometry: mergeGeoms([
        beam(0.24, 2.0, 0.24, -1.4, 1.0, -0.7),
        beam(0.24, 2.0, 0.24, 1.4, 1.0, -0.7),
        beam(0.24, 1.4, 0.24, -1.4, 0.7, 0.7),
        beam(0.24, 1.4, 0.24, 1.4, 0.7, 0.7),
        beam(3.0, 0.18, 1.7, 0, 1.5, 0),
        beam(3.0, 0.9, 0.16, 0, 1.0, -0.7),
        // added: four slats across the open front, the hay's only restraint
        ...[-1.05, -0.35, 0.35, 1.05].map((x) => beam(0.1, 1.0, 0.1, x, 0.9, 0.7)),
        beam(3.0, 0.12, 0.14, 0, 0.42, 0.7),                  // bottom front rail
      ]),
      material: standard(0x8a6b45, { roughness: 0.95 }),
      castShadow: true,
      tint: (c) => new THREE.Color().setScalar(0.88 + c.rng.float() * 0.22),
    },
    {
      key: 'hay',
      // Sits under the sloping top and pushes out through the front slats,
      // which is what says "full" — a neat block inside the frame reads as a
      // crate.
      geometry: mergeGeoms([
        beam(2.6, 0.85, 1.2, 0, 0.95, -0.12),
        beam(2.2, 0.4, 0.5, 0, 1.24, 0.62, 0.22),             // spilling over the front
        beam(0.8, 0.3, 0.4, -0.9, 0.2, 0.95, 0.1, 0.3, 0),    // dropped on the ground
      ]),
      material: standard(0xffffff),
      castShadow: true,
      tint: (c) => new THREE.Color().setHSL(0.125, 0.44, 0.5 + c.rng.centered(0.07)),
    },
  ],

  // NOT SOLID, and it is the odd one out among the three pieces of pasture
  // furniture here. The trough is stone full of water and the feed bin is a
  // tonne of grain; this is an open rail frame of light timber that two people
  // carry to where the cattle are. v1 registers all three as BREAKABLE props —
  // cars and weapons destroy them — and of the three this is the one where
  // "you go through it" is the closer approximation until M4 can splinter it.
  physics: { shape: () => ({ kind: 'none' }), solid: false, massKg: 240 },

  authoring: {
    scale: [0.9, 1.15], defaultScale: 1,
    minRoadDist: 9, randomYaw: true,
  },
};

export default hayRack;
