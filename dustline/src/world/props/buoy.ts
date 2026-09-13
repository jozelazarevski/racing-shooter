// CHANNEL BUOY — a floating marker. The one marine component that is scatter
// food: a handful across a bay costs nothing and makes the water look used.
//
// Not solid. A buoy is a plastic float on a chain; stopping a car dead on one
// would be a lie, and colliders on scattered water dressing is exactly the
// kind of cost that adds up without anyone noticing.

import * as THREE from 'three';
import { PropTemplate, standard, mergeGeoms, cylinderAt, coneAt, beam } from './types';

const buoy: PropTemplate = {
  id: 'buoy',
  name: 'Channel buoy',
  category: 'marine',
  description: 'Floating channel marker, 2 m. Dressing — not solid.',

  build: () => [
    {
      key: 'float',
      geometry: mergeGeoms([
        cylinderAt(0.42, 0.5, 0.75, 8, -0.35),
        coneAt(0.42, 0.35, 8, 0.4),
      ]),
      material: standard(0xffffff, { roughness: 0.6, flatShading: false }),
      // Red or green, the two that mean something, plus the odd yellow.
      tint: (c) => {
        const r = c.rng.float();
        return new THREE.Color(r < 0.45 ? 0xd23b2e : r < 0.9 ? 0x2fa85c : 0xe8c53a);
      },
    },
    {
      key: 'topmark',
      geometry: mergeGeoms([
        cylinderAt(0.05, 0.05, 1.1, 5, 0.7),
        beam(0.3, 0.3, 0.06, 0, 1.7, 0, 0, 0, Math.PI / 4),
      ]),
      material: standard(0x2b2f34, { roughness: 0.7, flatShading: false }),
    },
  ],

  physics: { shape: () => ({ kind: 'none' }), solid: false, massKg: 90 },

  authoring: {
    scale: [0.8, 1.2], defaultScale: 1,
    placement: 'water', minDepth: 1.0,
    minRoadDist: 4, randomYaw: true,
  },
};

export default buoy;
