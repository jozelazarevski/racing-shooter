// BUSH — soft dressing. Ported from the hardcoded `buildBushes` loop.
// No collider at any size: the original gave bushes none, and a bush that
// stops a rally car is a worse lie than one you drive through.

import * as THREE from 'three';
import { PropTemplate, standard } from './types';

const geo = () => {
  const g = new THREE.IcosahedronGeometry(1, 0);
  g.scale(1, 0.6, 1);
  g.translate(0, 0.2, 0);
  return g;
};

const bush: PropTemplate = {
  id: 'bush',
  name: 'Bush',
  category: 'flora',
  description: 'Low scrub. Dressing only — never solid.',

  build: () => [{
    key: 'body',
    geometry: geo(),
    material: standard(0xffffff),
    tint: (c) => new THREE.Color()
      .setHSL(c.surface === 'sand' ? 0.11 : 0.3, 0.35, 0.24)
      .offsetHSL(0, 0, c.rng.centered(0.03)),
  }],

  physics: { shape: () => ({ kind: 'none' }), solid: false, massKg: 30 },

  authoring: {
    scale: [0.5, 1.4],
    defaultScale: 0.9,
    avoidSurfaces: ['snow', 'ice'],
    minRoadDist: 9,
    randomYaw: true,
   
  },
};

export default bush;
