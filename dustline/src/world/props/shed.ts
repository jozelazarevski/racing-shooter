// SHED — a small lean-to. The half-size companion to the barn, for filling a
// farmyard without repeating the same silhouette.

import * as THREE from 'three';
import { PropTemplate, standard, mergeGeoms, beam, boxAt } from './types';

const shed: PropTemplate = {
  id: 'shed',
  name: 'Shed',
  category: 'structure',
  description: 'Small lean-to outbuilding. Solid.',

  build: () => [
    {
      key: 'walls',
      geometry: boxAt(3.4, 2.3, 2.6, 0),
      material: standard(0x8d7a5e, { roughness: 0.95, flatShading: false }),
      castShadow: true,
      tint: (c) => new THREE.Color(0x8d7a5e).offsetHSL(0, 0, c.rng.centered(0.06)),
    },
    {
      key: 'roof',
      geometry: mergeGeoms([beam(3.9, 0.16, 3.1, 0, 2.55, 0, -0.18, 0, 0)]),
      material: standard(0x55585c, { roughness: 0.9, flatShading: false }),
      castShadow: true,
    },
  ],

  physics: {
    shape: (s) => ({ kind: 'box', halfExtents: [1.7 * s, 1.3 * s, 1.3 * s], centerY: 1.3 * s }),
    solid: true,
    massKg: 8000,
  },

  authoring: { scale: [0.8, 1.3], defaultScale: 1, minRoadDist: 12, randomYaw: true },
};

export default shed;
