// SCREE — a spill of loose stones. Non-solid on purpose: it is ground texture,
// and a field of individually-collidable pebbles would be both a physics bill
// and a miserable thing to drive over.

import * as THREE from 'three';
import { PropTemplate, standard, mergeGeoms } from './types';

const scree: PropTemplate = {
  id: 'scree',
  name: 'Scree',
  category: 'terrain',
  description: 'Loose stone spill. Ground texture — never solid.',

  build: () => [{
    key: 'stones',
    geometry: mergeGeoms([0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
      const a = (i / 8) * Math.PI * 2 + i * 0.7;
      const r = 0.5 + (i % 3) * 0.55;
      const s = 0.16 + (i % 4) * 0.09;
      const g = new THREE.DodecahedronGeometry(s, 0);
      g.scale(1, 0.6, 1);
      g.translate(Math.sin(a) * r, s * 0.5, Math.cos(a) * r);
      return g;
    })),
    material: standard(0x8d8a82, { roughness: 0.98 }),
    tint: (c) => new THREE.Color()
      .setHex(c.surface === 'snow' ? 0xb4bec8 : c.surface === 'sand' ? 0xc0a075 : 0x8a8780)
      .offsetHSL(0, 0, c.rng.centered(0.05)),
  }],

  physics: { shape: () => ({ kind: 'none' }), solid: false, massKg: 200 },

  authoring: {
    scale: [0.8, 2], defaultScale: 1.2, minRoadDist: 8, randomYaw: true,
  },
};

export default scree;
