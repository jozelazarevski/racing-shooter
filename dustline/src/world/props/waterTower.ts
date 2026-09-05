// WATER TOWER — a tank on legs. The classic silhouette for making a horizon
// read as inhabited, and useful as a corner reference from a long way out.

import * as THREE from 'three';
import { PropTemplate, standard, mergeGeoms, beam, cylinderAt, coneAt } from './types';

const waterTower: PropTemplate = {
  id: 'waterTower',
  name: 'Water tower',
  category: 'structure',
  description: 'Tank on four legs, 12 m. Solid — a long-range corner reference.',

  build: () => [
    {
      key: 'legs',
      geometry: mergeGeoms([
        ...[[-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5]].map(([x, z]) => {
          const g = cylinderAt(0.13, 0.16, 7.6, 6, 0);
          g.rotateX(z > 0 ? -0.09 : 0.09);
          g.rotateZ(x > 0 ? 0.09 : -0.09);
          return g.translate(x, 0, z);
        }),
        // cross bracing, which is what stops it looking like a table
        beam(3.2, 0.08, 0.08, 0, 3.4, -1.5), beam(3.2, 0.08, 0.08, 0, 3.4, 1.5),
        beam(0.08, 0.08, 3.2, -1.5, 3.4, 0), beam(0.08, 0.08, 3.2, 1.5, 3.4, 0),
      ]),
      material: standard(0x7a8086, { roughness: 0.7, flatShading: false }),
      castShadow: true,
    },
    {
      key: 'tank',
      geometry: mergeGeoms([
        cylinderAt(1.95, 1.95, 2.7, 14, 7.6),
        coneAt(2.05, 1.0, 14, 10.3),
        coneAt(2.05, 0.8, 14, 6.9).rotateX(Math.PI).translate(0, 15.2, 0),
      ]),
      material: standard(0xc9cdd2, { roughness: 0.6, flatShading: false }),
      castShadow: true,
      tint: (c) => new THREE.Color(0xc9cdd2).offsetHSL(0, 0, c.rng.centered(0.04)),
    },
  ],

  physics: {
    shape: (s) => ({ kind: 'cylinder', halfHeight: 5.6 * s, radius: 1.9 * s, centerY: 5.6 * s }),
    solid: true,
    massKg: 45000,
  },

  authoring: { scale: [0.8, 1.3], defaultScale: 1, minRoadDist: 16, randomYaw: true },
};

export default waterTower;
