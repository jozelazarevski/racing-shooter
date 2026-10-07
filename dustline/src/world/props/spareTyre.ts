// SPARE TYRE — one tyre lying flat. The smallest thing in the library, and
// not solid: a loose tyre on the deck is something you drive over.

import * as THREE from 'three';
import { PropTemplate, standard, cylinderAt } from './types';

const spareTyre: PropTemplate = {
  id: 'spareTyre',
  name: 'Spare tyre',
  category: 'debris',
  description: 'Single tyre lying flat. Not solid — drive over it.',

  build: () => [{
    key: 'tyre',
    geometry: cylinderAt(0.6, 0.6, 0.3, 16, 0),
    material: standard(0x1e2024, { roughness: 0.95, flatShading: false }),
    castShadow: true,
    tint: (c) => new THREE.Color(0x1e2024).offsetHSL(0, 0, c.rng.centered(0.02)),
  }],

  physics: { shape: () => ({ kind: 'none' }), solid: false, massKg: 12 },

  authoring: { scale: [0.9, 1.1], defaultScale: 1, minRoadDist: 5, randomYaw: true },
};

export default spareTyre;
