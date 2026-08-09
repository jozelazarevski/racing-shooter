// WATCHTOWER — a marshal's timber tower with a railed platform. Human-scale
// vertical furniture: it tells you a corner is manned.

import * as THREE from 'three';
import { PropTemplate, standard, mergeGeoms, beam, cylinderAt } from './types';

const watchtower: PropTemplate = {
  id: 'watchtower',
  name: 'Watchtower',
  category: 'structure',
  description: 'Timber marshal tower with a railed platform. Solid.',

  build: () => [
    {
      key: 'frame',
      geometry: mergeGeoms([
        ...[[-1.1, -1.1], [1.1, -1.1], [-1.1, 1.1], [1.1, 1.1]].map(([x, z]) =>
          cylinderAt(0.1, 0.12, 4.2, 5, 0).translate(x, 0, z)),
        beam(2.4, 0.09, 0.09, 0, 2.0, -1.1), beam(2.4, 0.09, 0.09, 0, 2.0, 1.1),
        beam(0.09, 0.09, 2.4, -1.1, 2.0, 0), beam(0.09, 0.09, 2.4, 1.1, 2.0, 0),
      ]),
      material: standard(0x8a7350, { flatShading: false }),
      castShadow: true,
    },
    {
      key: 'platform',
      geometry: mergeGeoms([
        beam(2.9, 0.16, 2.9, 0, 4.28, 0),
        // rails
        beam(2.9, 0.08, 0.08, 0, 5.1, -1.4), beam(2.9, 0.08, 0.08, 0, 5.1, 1.4),
        beam(0.08, 0.08, 2.9, -1.4, 5.1, 0), beam(0.08, 0.08, 2.9, 1.4, 5.1, 0),
        beam(3.2, 0.14, 3.2, 0, 6.0, 0),                 // canopy
        ...[[-1.35, -1.35], [1.35, 1.35]].map(([x, z]) =>
          cylinderAt(0.07, 0.07, 0.9, 4, 5.1).translate(x, 0, z)),
      ]),
      material: standard(0x9c8a68, { flatShading: false }),
      castShadow: true,
      tint: (c) => new THREE.Color(0x9c8a68).offsetHSL(0, 0, c.rng.centered(0.05)),
    },
  ],

  physics: {
    shape: (s) => ({ kind: 'box', halfExtents: [1.35 * s, 3.1 * s, 1.35 * s], centerY: 3.1 * s }),
    solid: true,
    massKg: 5000,
  },

  authoring: { scale: [0.85, 1.3], defaultScale: 1, minRoadDist: 11, randomYaw: true },
};

export default watchtower;
