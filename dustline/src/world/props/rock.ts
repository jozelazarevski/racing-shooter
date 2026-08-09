// ROCK — scattered stone. Ported from the hardcoded `buildRocks` loop.
//
// Note the physics rule: `solid` is a PREDICATE on scale, because the original
// only gave colliders to rocks above 1.1 — small ones are meant to be driven
// over. That rule used to live in the scatter loop as a bare `if (s > 1.1)`,
// hundreds of lines from the geometry it applied to.

import * as THREE from 'three';
import { PropTemplate, standard } from './types';

const geo = () => {
  const g = new THREE.DodecahedronGeometry(1, 0);
  g.scale(1, 0.72, 1);
  g.translate(0, 0.15, 0);     // sits ON the ground, not half-buried in it
  return g;
};

const rock: PropTemplate = {
  id: 'rock',
  name: 'Rock',
  category: 'terrain',
  description: 'Field stone. Solid above 1.1 scale — smaller ones are driveable.',

  build: () => [{
    key: 'body',
    geometry: geo(),
    material: standard(0xffffff, { roughness: 0.95 }),
    castShadow: true,
    tint: (c) => new THREE.Color()
      .setHex(c.surface === 'snow' ? 0xb8c4ce : c.surface === 'sand' ? 0xc8a878 : 0x8d8a82)
      .offsetHSL(0, 0, c.rng.centered(0.04)),
  }],

  physics: {
    shape: (s) => ({ kind: 'ball', radius: s * 0.85, centerY: s * 0.3 }),
    solid: (s) => s > 1.1,
    massKg: 1400,
  },

  authoring: {
    scale: [0.5, 1.7],
    defaultScale: 1.4,
    avoidSurfaces: ['mud'],
    minRoadDist: 10,
    randomYaw: true,
   
  },
};

export default rock;
