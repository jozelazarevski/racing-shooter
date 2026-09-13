// PALLET — flat timber. Non-solid, because it lies on the ground and a car
// should ride over it; it exists to make a yard look used.

import * as THREE from 'three';
import { PropTemplate, standard, mergeGeoms, beam } from './types';

const pallet: PropTemplate = {
  id: 'pallet',
  name: 'Pallet',
  category: 'debris',
  description: 'Flat timber pallet. Lies on the ground — not solid.',

  build: () => [{
    key: 'boards',
    geometry: mergeGeoms([
      ...[-0.5, -0.17, 0.17, 0.5].map((z) => beam(1.2, 0.05, 0.16, 0, 0.17, z)),
      ...[-0.5, 0, 0.5].map((x) => beam(0.12, 0.14, 1.2, x, 0.07, 0)),
      ...[-0.5, 0.5].map((z) => beam(1.2, 0.05, 0.16, 0, 0.0, z)),
    ]),
    material: standard(0xa88b5c, { flatShading: false }),
    castShadow: true,
    tint: (c) => new THREE.Color(0xa88b5c).offsetHSL(0, 0, c.rng.centered(0.06)),
  }],

  physics: { shape: () => ({ kind: 'none' }), solid: false, massKg: 18 },

  authoring: { scale: [0.9, 1.2], defaultScale: 1, minRoadDist: 6, randomYaw: true },
};

export default pallet;
