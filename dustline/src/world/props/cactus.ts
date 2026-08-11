// CACTUS — desert flora. Sand and gravel only when scattered; hand placement
// is never restricted, because if you put one on a glacier you meant it.

import * as THREE from 'three';
import { PropTemplate, cylinderAt, standard, mergeGeoms } from './types';

const arm = (side: number) => {
  const up = cylinderAt(0.16, 0.16, 1.1, 8, 0);
  up.translate(side * 0.52, 1.5, 0);
  const across = cylinderAt(0.15, 0.15, 0.62, 8, 0);
  across.rotateZ(Math.PI / 2);
  across.translate(side * 0.28, 1.5, 0);
  return mergeGeoms([up, across]);
};

const cactus: PropTemplate = {
  id: 'cactus',
  name: 'Saguaro',
  category: 'flora',
  description: 'Desert column with two arms. Solid trunk.',

  build: () => [
    { key: 'trunk', geometry: cylinderAt(0.34, 0.42, 3.2, 10, 0), material: standard(0x4e7a45, { flatShading: false }), castShadow: true,
      tint: (c) => new THREE.Color(0x4e7a45).offsetHSL(0, 0, c.rng.centered(0.05)) },
    { key: 'arms', geometry: arm(1), material: standard(0x4e7a45, { flatShading: false }), castShadow: true },
    { key: 'armsB', geometry: arm(-1), material: standard(0x487340, { flatShading: false }), castShadow: true },
  ],

  physics: {
    shape: (s) => ({ kind: 'cylinder', halfHeight: 1.6 * s, radius: 0.4 * s, centerY: 1.6 * s }),
    solid: true,
    // COVERAGE — the stem. The arms are above a bonnet and would not stop one anyway.
    coverage: 'trunk',
    massKg: 700,
  },

  authoring: {
    scale: [0.8, 1.5], defaultScale: 1,
    avoidSurfaces: ['snow', 'ice', 'mud', 'tarmac'], minRoadDist: 10, randomYaw: true,
  },
};

export default cactus;
