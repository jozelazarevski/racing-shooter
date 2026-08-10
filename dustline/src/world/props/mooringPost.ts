// MOORING POST — a bollard with a coil of rope. Quayside punctuation at
// knee height: every other marine component is either metres tall or floating,
// and a harbour with nothing small in it looks like a diagram of a harbour.

import * as THREE from 'three';
import { PropTemplate, standard, mergeGeoms, cylinderAt, sphereAt } from './types';

const mooringPost: PropTemplate = {
  id: 'mooringPost',
  name: 'Mooring post',
  category: 'marine',
  description: 'Quayside bollard with a rope coil, 0.9 m. Solid.',

  build: () => [
    {
      key: 'post',
      geometry: mergeGeoms([
        cylinderAt(0.16, 0.22, 0.8, 8, 0),
        sphereAt(0.2, 8, 0.82),
        cylinderAt(0.3, 0.32, 0.1, 8, 0),
      ]),
      material: standard(0x4a4c50, { roughness: 0.75, flatShading: false }),
      castShadow: true,
      tint: (c) => new THREE.Color(0x4a4c50).offsetHSL(0, 0, c.rng.centered(0.06)),
    },
    {
      key: 'rope',
      geometry: mergeGeoms([0.36, 0.44, 0.52].map((y, i) =>
        new THREE.TorusGeometry(0.24 + i * 0.01, 0.045, 5, 10)
          .rotateX(Math.PI / 2).translate(0, y, 0))),
      material: standard(0xbba97e, { roughness: 1, flatShading: false }),
    },
  ],

  physics: {
    shape: (s) => ({ kind: 'cylinder', halfHeight: 0.45 * s, radius: 0.22 * s, centerY: 0.45 * s }),
    solid: true,
    massKg: 260,
  },

  authoring: {
    scale: [0.9, 1.2], defaultScale: 1,
    placement: 'shore', shoreBand: 3,
    minRoadDist: 5, randomYaw: true,
  },
};

export default mooringPost;
