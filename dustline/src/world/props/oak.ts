// OAK — broad, heavy, slow. The tree a village grows around, and the one the
// existing set was missing: pine and birch are both TALL and NARROW, so a
// landscape built from them has no wide silhouette in it anywhere.

import * as THREE from 'three';
import { PropTemplate, cylinderAt, sphereAt, standard, mergeGeoms, beam } from './types';

const oak: PropTemplate = {
  id: 'oak',
  name: 'Oak',
  category: 'flora',
  description: 'Broad deciduous tree, wide canopy. Solid trunk.',

  build: () => [
    {
      key: 'trunk',
      geometry: mergeGeoms([
        cylinderAt(0.34, 0.62, 3.0, 10, 0),
        // three limbs, angled out — an oak's shape is in the branching, and a
        // bare cylinder under a sphere reads as a lollipop
        beam(0.22, 1.8, 0.22, 0.5, 3.4, 0.2, 0, 0, -0.55),
        beam(0.2, 1.7, 0.2, -0.55, 3.3, -0.15, 0, 0, 0.5),
        beam(0.18, 1.6, 0.18, 0.05, 3.5, -0.5, 0.45, 0, 0),
      ]),
      material: standard(0x6b5238, { flatShading: false }),
      castShadow: true,
    },
    {
      key: 'canopy',
      geometry: mergeGeoms([
        sphereAt(2.5, 11, 5.4),
        sphereAt(1.8, 10, 4.5).translate(1.9, 0, 0.5),
        sphereAt(1.7, 10, 4.7).translate(-1.8, 0, -0.6),
        sphereAt(1.5, 9, 4.3).translate(0.3, 0, -1.9),
      ]),
      material: standard(0xffffff),
      castShadow: true,
      tint: (c) => new THREE.Color().setHSL(
        c.surface === 'snow' ? 0.11 : 0.24 + c.rng.float() * 0.05,
        c.surface === 'snow' ? 0.22 : 0.5,
        c.surface === 'snow' ? 0.4 : 0.26 + c.rng.centered(0.05),
      ),
    },
  ],

  physics: {
    shape: (s) => ({ kind: 'cylinder', halfHeight: 1.6 * s, radius: 0.62 * s, centerY: 1.6 * s }),
    solid: true,
    massKg: 4000,
  },

  authoring: {
    scale: [0.9, 1.7], defaultScale: 1.2,
    avoidSurfaces: ['tarmac', 'ice', 'snow'], minRoadDist: 13, randomYaw: true,
  },
};

export default oak;
