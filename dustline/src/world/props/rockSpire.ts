// ROCK SPIRE — a tall thin pillar. Reads as desert or badlands country and,
// unlike a boulder, is a landmark you can navigate by.

import * as THREE from 'three';
import { PropTemplate, standard, mergeGeoms, cylinderAt } from './types';

const rockSpire: PropTemplate = {
  id: 'rockSpire',
  name: 'Rock spire',
  category: 'terrain',
  description: 'Tall stone pillar. Always solid — a landmark you can navigate by.',

  build: () => [{
    key: 'body',
    geometry: mergeGeoms([
      cylinderAt(0.9, 1.5, 3.2, 9, 0),
      cylinderAt(0.62, 0.95, 2.6, 9, 3.1),
      cylinderAt(0.3, 0.66, 1.8, 9, 5.6),
    ]),
    material: standard(0x9a8874, { roughness: 0.98 }),
    castShadow: true,
    tint: (c) => new THREE.Color()
      .setHex(c.surface === 'snow' ? 0xc0c8d0 : c.surface === 'sand' ? 0xc09468 : 0x968574)
      .offsetHSL(0, 0, c.rng.centered(0.05)),
  }],

  physics: {
    shape: (s) => ({ kind: 'cylinder', halfHeight: 3.7 * s, radius: 1.2 * s, centerY: 3.7 * s }),
    solid: true,
    massKg: 40000,
  },

  authoring: {
    scale: [0.8, 2.2], defaultScale: 1.2,
    avoidSurfaces: ['tarmac'], minRoadDist: 14, randomYaw: true,
  },
};

export default rockSpire;
