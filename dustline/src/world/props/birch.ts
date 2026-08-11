// BIRCH — pale trunk, loose canopy. The visual counterweight to the pine:
// a forest of nothing but conifers reads as one texture at speed.

import * as THREE from 'three';
import { PropTemplate, coneAt, cylinderAt, sphereAt, standard, mergeGeoms } from './types';

const birch: PropTemplate = {
  id: 'birch',
  name: 'Birch',
  category: 'flora',
  description: 'Pale deciduous tree. Solid trunk, loose canopy.',

  build: () => [
    {
      key: 'trunk',
      geometry: mergeGeoms([
        cylinderAt(0.16, 0.26, 4.2, 9, 0),
        // two dark bark bands, the thing that makes a birch read as a birch
        cylinderAt(0.19, 0.19, 0.22, 9, 1.3),
        cylinderAt(0.175, 0.175, 0.16, 9, 2.5),
      ]),
      material: standard(0xe4e0d4, { flatShading: false }),
      castShadow: true,
    },
    {
      key: 'canopy',
      geometry: mergeGeoms([
        sphereAt(1.5, 10, 5.0),
        sphereAt(1.05, 9, 4.1).translate(0.9, 0, 0.3),
        sphereAt(0.95, 9, 4.4).translate(-0.85, 0, -0.4),
      ]),
      material: standard(0xffffff),
      castShadow: true,
      tint: (c) => new THREE.Color().setHSL(
        c.surface === 'snow' ? 0.12 : 0.26 + c.rng.float() * 0.06,
        c.surface === 'snow' ? 0.3 : 0.45,
        c.surface === 'snow' ? 0.42 : 0.34,
      ),
    },
  ],

  physics: {
    shape: (s) => ({ kind: 'cylinder', halfHeight: 2.1 * s, radius: 0.3 * s, centerY: 2.1 * s }),
    solid: true,
    // COVERAGE — the trunk. A birch is mostly air.
    coverage: 'trunk',
    massKg: 650,
  },

  authoring: {
    scale: [0.8, 1.6], defaultScale: 1.1,
    avoidSurfaces: ['tarmac', 'sand', 'ice'], minRoadDist: 11, randomYaw: true,
  },
};

export default birch;
