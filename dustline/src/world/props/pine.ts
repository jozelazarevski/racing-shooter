// PINE — the forest tree. Ported verbatim from the hardcoded `buildPines`
// loop in render/scenery.ts, geometry and collider unchanged, so the shipped
// world still looks and drives the way it did.
//
// The snow cap is the reason `when` exists on a part: a pine on snow grows one
// and a pine on grass does not, and expressing that as "a fourth InstancedMesh
// that only some instances write into" is exactly what the old loop did by
// hand with a second counter.

import * as THREE from 'three';
import { PropTemplate, coneAt, cylinderAt, standard } from './types';

const pine: PropTemplate = {
  id: 'pine',
  name: 'Pine',
  category: 'flora',
  description: 'Conifer with a snow cap above the snow line. Solid trunk.',

  build: () => [
    {
      key: 'trunk',
      geometry: cylinderAt(0.22, 0.34, 1.8, 6, 0),
      material: standard(0x5a4028, { flatShading: false }),
      castShadow: true,
    },
    {
      key: 'low',
      geometry: coneAt(1.9, 3.1, 7, 1.45),
      material: standard(0xffffff),
      castShadow: true,
      tint: (c) => {
        const snowy = c.surface === 'snow';
        return new THREE.Color().setHSL(0.33 + c.rng.float() * 0.05, snowy ? 0.18 : 0.42, snowy ? 0.3 : 0.24);
      },
    },
    {
      key: 'top',
      geometry: coneAt(1.25, 2.4, 7, 3.7),
      material: standard(0xffffff),
      castShadow: true,
      tint: (c) => {
        const snowy = c.surface === 'snow';
        return new THREE.Color()
          .setHSL(0.33 + c.rng.float() * 0.05, snowy ? 0.18 : 0.42, snowy ? 0.3 : 0.24)
          .offsetHSL(0, 0, 0.05);
      },
    },
    {
      key: 'cap',
      geometry: coneAt(0.95, 1.5, 7, 4.75),
      material: standard(0xf2f6fa, { roughness: 0.9 }),
      when: (c) => c.surface === 'snow',
    },
  ],

  physics: {
    // half-height 2.4, radius 0.42, centred 2.2 up — the trunk, not the canopy.
    // A collider around the foliage would stop a car a metre from the tree.
    shape: (s) => ({ kind: 'cylinder', halfHeight: 2.4 * s, radius: 0.42 * s, centerY: 2.2 * s }),
    solid: true,
    massKg: 900,
  },

  authoring: {
    scale: [0.8, 2.1],
    defaultScale: 1.3,
    avoidSurfaces: ['tarmac', 'mud', 'sand', 'ice'],
    minRoadDist: 11,
    randomYaw: true,
   
  },
};

export default pine;
