// BARN — the rally-stage building. Every real stage runs past one, and it is
// the cheapest way to make open country read as farmed rather than empty.

import * as THREE from 'three';
import { PropTemplate, standard, mergeGeoms, beam, boxAt } from './types';

const barn: PropTemplate = {
  id: 'barn',
  name: 'Barn',
  category: 'structure',
  description: 'Gabled farm building, 9 x 6 m. Solid.',

  build: () => [
    {
      key: 'walls',
      geometry: mergeGeoms([
        boxAt(9, 4, 6, 0),
        beam(1.9, 2.6, 0.16, -2.4, 1.3, 3.0),        // door leaf
        beam(1.9, 2.6, 0.16, 2.4, 1.3, 3.0),
      ]),
      material: standard(0xb0503a, { roughness: 0.95, flatShading: false }),
      castShadow: true,
      tint: (c) => new THREE.Color(0xb0503a).offsetHSL(0, 0, c.rng.centered(0.05)),
    },
    {
      key: 'roof',
      geometry: mergeGeoms([
        beam(9.5, 0.28, 3.7, 0, 4.85, 1.55, -0.62, 0, 0),
        beam(9.5, 0.28, 3.7, 0, 4.85, -1.55, 0.62, 0, 0),
      ]),
      material: standard(0x4a4f55, { roughness: 0.9, flatShading: false }),
      castShadow: true,
    },
    {
      key: 'gable',
      // the triangular end walls, as two rotated slabs meeting at the ridge
      geometry: mergeGeoms([-4.5, 4.5].flatMap((x) => [
        beam(0.16, 2.0, 3.3, x, 4.35, 1.5, -0.62, 0, 0),
        beam(0.16, 2.0, 3.3, x, 4.35, -1.5, 0.62, 0, 0),
      ])),
      material: standard(0xa04832, { roughness: 0.95, flatShading: false }),
    },
  ],

  physics: {
    shape: (s) => ({ kind: 'box', halfExtents: [4.5 * s, 3 * s, 3 * s], centerY: 3 * s }),
    solid: true,
    massKg: 60000,
  },

  authoring: { scale: [0.8, 1.4], defaultScale: 1, minRoadDist: 15, randomYaw: true },
};

export default barn;
