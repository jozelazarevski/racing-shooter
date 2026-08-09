// DEAD TREE — bare trunk and two limbs. Reads as a different biome from the
// pine without needing a new material set.

import * as THREE from 'three';
import { PropTemplate, cylinderAt, standard } from './types';

const limb = (angle: number, lean: number) => {
  const g = cylinderAt(0.06, 0.12, 2.1, 6, 0);
  g.rotateZ(lean);
  g.rotateY(angle);
  g.translate(0, 2.2, 0);
  return g;
};

const deadTree: PropTemplate = {
  id: 'deadTree',
  name: 'Dead tree',
  category: 'flora',
  description: 'Bare trunk and limbs. Solid, and cheap — three parts.',

  build: () => [
    { key: 'trunk', geometry: cylinderAt(0.16, 0.36, 3.6, 9, 0), material: standard(0x6b5b47, { flatShading: false }), castShadow: true,
      tint: (c) => new THREE.Color(0x6b5b47).offsetHSL(0, 0, c.rng.centered(0.05)) },
    { key: 'limbA', geometry: limb(0.4, 0.7), material: standard(0x6b5b47, { flatShading: false }), castShadow: true },
    { key: 'limbB', geometry: limb(2.6, -0.6), material: standard(0x60513f, { flatShading: false }), castShadow: true },
  ],

  physics: {
    shape: (s) => ({ kind: 'cylinder', halfHeight: 1.8 * s, radius: 0.34 * s, centerY: 1.8 * s }),
    solid: true,
    massKg: 500,
  },

  authoring: {
    scale: [0.8, 1.6], defaultScale: 1.1, avoidSurfaces: ['tarmac', 'ice'], minRoadDist: 10,
    randomYaw: true,
  },
};

export default deadTree;
