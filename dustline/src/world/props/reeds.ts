// REEDS — waterside grass. Pure dressing: never solid, and cheap enough to
// scatter in the hundreds along a mud flat.

import * as THREE from 'three';
import { PropTemplate, standard, mergeGeoms, beam } from './types';

const reeds: PropTemplate = {
  id: 'reeds',
  name: 'Reeds',
  category: 'flora',
  description: 'Waterside grass. Dressing only — never solid.',

  build: () => [{
    key: 'clump',
    geometry: mergeGeoms([0, 1, 2, 3, 4, 5, 6].map((i) => {
      const a = (i / 7) * Math.PI * 2;
      const lean = 0.1 + (i % 3) * 0.09;
      const h = 0.9 + (i % 4) * 0.28;
      return beam(0.06, h, 0.06, Math.sin(a) * 0.2, h / 2, Math.cos(a) * 0.2, lean, a, 0);
    })),
    material: standard(0xffffff),
    tint: (c) => new THREE.Color().setHSL(
      c.surface === 'sand' ? 0.13 : 0.24, 0.4, 0.33,
    ).offsetHSL(0, 0, c.rng.centered(0.05)),
  }],

  physics: { shape: () => ({ kind: 'none' }), solid: false, massKg: 5 },

  authoring: {
    scale: [0.7, 1.5], defaultScale: 1,
    avoidSurfaces: ['tarmac', 'ice', 'snow'], minRoadDist: 8, randomYaw: true,
  },
};

export default reeds;
