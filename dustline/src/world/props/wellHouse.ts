// WELL — stone ring, two posts, a little roof. Village-square furniture at a
// scale nothing else in the set covers: waist high, so it fills the gap
// between a fence and a house.

import * as THREE from 'three';
import { PropTemplate, standard, mergeGeoms, beam, cylinderAt } from './types';

const wellHouse: PropTemplate = {
  id: 'wellHouse',
  name: 'Well',
  category: 'settlement',
  description: 'Stone well with a shingled roof, 1.6 m across. Solid.',

  build: () => [
    {
      key: 'ring',
      geometry: mergeGeoms([
        cylinderAt(0.8, 0.85, 0.85, 10, 0),
        cylinderAt(0.62, 0.62, 0.12, 10, 0.75),                     // dark mouth
      ]),
      material: standard(0x9a938a, { roughness: 1, flatShading: false }),
      castShadow: true,
      tint: (c) => new THREE.Color(0x9a938a).offsetHSL(0, 0, c.rng.centered(0.06)),
    },
    {
      key: 'frame',
      geometry: mergeGeoms([
        beam(0.14, 1.9, 0.14, -0.7, 0.95, 0),
        beam(0.14, 1.9, 0.14, 0.7, 0.95, 0),
        cylinderAt(0.12, 0.12, 1.3, 6, 0).rotateZ(Math.PI / 2).translate(0, 1.6, 0),
        beam(2.1, 0.12, 1.5, 0, 2.16, 0.4, -0.5, 0, 0),             // roof slopes
        beam(2.1, 0.12, 1.5, 0, 2.16, -0.4, 0.5, 0, 0),
      ]),
      material: standard(0x7a6247, { roughness: 0.95, flatShading: false }),
      castShadow: true,
    },
  ],

  physics: {
    shape: (s) => ({ kind: 'cylinder', halfHeight: 0.45 * s, radius: 0.85 * s, centerY: 0.45 * s }),
    solid: true,
    massKg: 3000,
  },

  authoring: { scale: [0.9, 1.2], defaultScale: 1, minRoadDist: 8, randomYaw: true },
};

export default wellHouse;
