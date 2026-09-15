// WATER TROUGH — 4 m of stone livestock trough on timber feet, standing full.
//
// SHAPE FROM IGNITE RALLY: `_fieldProp(x, z, rot, 'trough', K)` in
// `src/track.js` at the repository root, ported box for box:
//
//     { w: 4.0, h: 0.25, d: 1.4,  x: 0,    y: 0.62, z: 0 }      floor slab
//     { w: 4.0, h: 0.7,  d: 0.16, x: 0,    y: 0.9,  z:  0.62 }  long sides
//     { w: 4.0, h: 0.7,  d: 0.16, x: 0,    y: 0.9,  z: -0.62 }
//     { w: 0.3, h: 0.6,  d: 1.4,  x: -1.7, y: 0.3,  z: 0 }      end feet
//     { w: 0.3, h: 0.6,  d: 1.4,  x:  1.7, y: 0.3,  z: 0 }
//
// v1's y values are box CENTRES with the mesh based on the ground, so they
// carry over into `beam` unchanged. It runs along local X.
//
// TWO THINGS ADDED, both because v1's trough cannot hold water: it has long
// sides and no ENDS, so it is a channel open at both ends. Two end walls close
// it, and then there is a water surface in it, which is the only part of the
// object with any colour in it and the thing that says at 60 mph that this is
// a trough and not a planter.

import * as THREE from 'three';
import { PropTemplate, standard, mergeGeoms, beam } from './types';

const waterTrough: PropTemplate = {
  id: 'waterTrough',
  name: 'Water trough',
  category: 'settlement',
  description: '4 m stone trough on feet, standing full. Solid.',

  build: () => [
    {
      key: 'trough',
      geometry: mergeGeoms([
        beam(4.0, 0.25, 1.4, 0, 0.62, 0),
        beam(4.0, 0.7, 0.16, 0, 0.9, 0.62),
        beam(4.0, 0.7, 0.16, 0, 0.9, -0.62),
        beam(0.3, 0.6, 1.4, -1.7, 0.3, 0),
        beam(0.3, 0.6, 1.4, 1.7, 0.3, 0),
        // added: end walls, so it holds what is in it
        beam(0.16, 0.7, 1.4, -1.92, 0.9, 0),
        beam(0.16, 0.7, 1.4, 1.92, 0.9, 0),
      ]),
      material: standard(0x9d968b, { roughness: 1 }),
      castShadow: true,
      tint: (c) => new THREE.Color().setScalar(0.86 + c.rng.float() * 0.26),
    },
    {
      key: 'water',
      // A single face, 5 cm below the rim. Anything thicker is visible through
      // the ends as a slab of solid blue, and there is no refraction here to
      // hide it behind.
      geometry: beam(3.76, 0.02, 1.08, 0, 1.14, 0),
      material: standard(0x4b6a72, { roughness: 0.25, flatShading: false }),
      // Standing water in a field goes green. Per-instance so a farmyard is
      // not a row of identical puddles.
      tint: (c) => new THREE.Color().setHSL(0.47 + c.rng.centered(0.04), 0.22, 0.34),
    },
  ],

  physics: {
    // SOLID, unlike the hay rack next to it. This is a stone tank a metre and a
    // quarter high with the better part of two cubic metres of water in it —
    // about two tonnes standing on the ground, and nothing a car moves. It is
    // also low and long, so it is easy to see and easy to avoid; the collider
    // is the tank, feet included.
    shape: (s) => ({ kind: 'box', halfExtents: [2 * s, 0.62 * s, 0.7 * s], centerY: 0.62 * s }),
    solid: true,
    massKg: 2400,
  },

  authoring: {
    scale: [0.9, 1.15], defaultScale: 1,
    minRoadDist: 9, randomYaw: true,
  },
};

export default waterTrough;
