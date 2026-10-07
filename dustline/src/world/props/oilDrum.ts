// OIL DRUM — the universal loose obstacle. Light, solid, and stackable by
// hand into a chicane.

import * as THREE from 'three';
import { PropTemplate, standard, mergeGeoms, cylinderAt } from './types';

const oilDrum: PropTemplate = {
  id: 'oilDrum',
  name: 'Oil drum',
  category: 'debris',
  description: 'Steel barrel. Solid and light — stack them into a chicane.',

  build: () => [{
    key: 'drum',
    geometry: mergeGeoms([
      cylinderAt(0.31, 0.31, 0.9, 14, 0),
      cylinderAt(0.33, 0.33, 0.07, 14, 0.22),   // rolling hoops
      cylinderAt(0.33, 0.33, 0.07, 14, 0.6),
    ]),
    material: standard(0xffffff, { roughness: 0.7, flatShading: false }),
    castShadow: true,
    tint: (c) => new THREE.Color()
      .setHex(c.rng.pick([0xc4462e, 0x3f7fae, 0xd8b53a, 0x4e7a45]))
      .offsetHSL(0, 0, c.rng.centered(0.04)),
  }],

  physics: {
    shape: (s) => ({ kind: 'cylinder', halfHeight: 0.45 * s, radius: 0.33 * s, centerY: 0.45 * s }),
    solid: true,
    massKg: 45,
  },

  authoring: { scale: [0.9, 1.1], defaultScale: 1, minRoadDist: 7, randomYaw: true },
};

export default oilDrum;
