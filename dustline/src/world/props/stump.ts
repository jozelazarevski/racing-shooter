// STUMP — what a felled tree leaves. Low, solid, and easy to miss at speed,
// which is the point: a logging area should punish inattention.

import * as THREE from 'three';
import { PropTemplate, cylinderAt, standard, mergeGeoms } from './types';

const stump: PropTemplate = {
  id: 'stump',
  name: 'Stump',
  category: 'flora',
  description: 'Cut trunk with roots. Low and solid — easy to miss at speed.',

  build: () => [{
    key: 'body',
    geometry: mergeGeoms([
      cylinderAt(0.44, 0.58, 0.85, 9, 0),
      ...[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2 + 0.4;
        const g = cylinderAt(0.1, 0.2, 0.7, 5, 0);
        g.rotateZ(1.15);
        g.rotateY(a);
        g.translate(Math.sin(a) * 0.42, 0.1, Math.cos(a) * 0.42);
        return g;
      }),
    ]),
    material: standard(0x6b533a, { flatShading: false }),
    castShadow: true,
    tint: (c) => new THREE.Color(0x6b533a).offsetHSL(0, 0, c.rng.centered(0.05)),
  }],

  physics: {
    shape: (s) => ({ kind: 'cylinder', halfHeight: 0.45 * s, radius: 0.6 * s, centerY: 0.45 * s }),
    solid: true,
    massKg: 400,
  },

  authoring: {
    scale: [0.8, 1.5], defaultScale: 1,
    avoidSurfaces: ['tarmac', 'ice', 'sand'], minRoadDist: 9, randomYaw: true,
  },
};

export default stump;
