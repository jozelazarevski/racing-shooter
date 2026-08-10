// CRATE — a plank box. Non-solid below 0.7 scale, on the same principle as
// the rock: a small one should be scenery, not a wall.

import * as THREE from 'three';
import { PropTemplate, standard, mergeGeoms, boxAt, beam } from './types';

const crate: PropTemplate = {
  id: 'crate',
  name: 'Crate',
  category: 'debris',
  description: 'Plank box. Solid at 0.7 scale and up; smaller ones are scenery.',

  build: () => [{
    key: 'box',
    geometry: mergeGeoms([
      boxAt(1.1, 1.1, 1.1, 0),
      // corner battens, so it reads as timber rather than a grey cube
      beam(1.16, 0.1, 0.1, 0, 0.08, 0.55), beam(1.16, 0.1, 0.1, 0, 1.02, 0.55),
      beam(1.16, 0.1, 0.1, 0, 0.08, -0.55), beam(1.16, 0.1, 0.1, 0, 1.02, -0.55),
      beam(0.1, 0.1, 1.16, 0.55, 0.08, 0), beam(0.1, 0.1, 1.16, 0.55, 1.02, 0),
    ]),
    material: standard(0xb08a52, { flatShading: false }),
    castShadow: true,
    tint: (c) => new THREE.Color(0xb08a52).offsetHSL(0, 0, c.rng.centered(0.06)),
  }],

  physics: {
    shape: (s) => ({ kind: 'box', halfExtents: [0.57 * s, 0.55 * s, 0.57 * s], centerY: 0.55 * s }),
    solid: (s) => s >= 0.7,
    massKg: 90,
  },

  authoring: { scale: [0.6, 1.4], defaultScale: 1, minRoadDist: 7, randomYaw: true },
};

export default crate;
