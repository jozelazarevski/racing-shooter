// WILLOW — the waterside tree, and the first component to use `shore`
// placement: scatter puts it on dry land but only within a few metres of the
// waterline, so a lake gets a fringe of them without anyone drawing one.

import * as THREE from 'three';
import { PropTemplate, cylinderAt, standard, mergeGeoms, beam } from './types';

/** One drooping frond: a stack of short segments that lean further over as
 *  they go out, which is the whole silhouette of the tree. */
function frond(angle: number, len: number): THREE.BufferGeometry[] {
  const out: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 5; i++) {
    const t = i / 4;
    const r = 0.5 + t * len;
    const y = 4.4 - t * t * 3.2;
    out.push(beam(0.13, 0.9 - t * 0.25, 0.13,
      Math.cos(angle) * r, y, Math.sin(angle) * r, 0, angle, -0.5 - t * 0.8));
  }
  return out;
}

const willow: PropTemplate = {
  id: 'willow',
  name: 'Willow',
  category: 'flora',
  description: 'Weeping waterside tree. Scatters along a shoreline. Solid trunk.',

  build: () => [
    {
      key: 'trunk',
      geometry: mergeGeoms([
        cylinderAt(0.3, 0.5, 3.4, 7, 0),
        beam(0.2, 1.2, 0.2, 0.35, 3.6, 0.1, 0, 0, -0.4),
        beam(0.18, 1.1, 0.18, -0.35, 3.6, -0.15, 0, 0, 0.42),
      ]),
      material: standard(0x6d5c46, { flatShading: false }),
      castShadow: true,
    },
    {
      key: 'fronds',
      geometry: mergeGeoms(
        Array.from({ length: 9 }, (_, i) => frond((i / 9) * Math.PI * 2, 1.5 + (i % 3) * 0.35))
          .flat(),
      ),
      material: standard(0xffffff),
      castShadow: true,
      tint: (c) => new THREE.Color().setHSL(
        0.21 + c.rng.float() * 0.05, 0.42, 0.35 + c.rng.centered(0.05),
      ),
    },
  ],

  physics: {
    shape: (s) => ({ kind: 'cylinder', halfHeight: 1.8 * s, radius: 0.5 * s, centerY: 1.8 * s }),
    solid: true,
    massKg: 2200,
  },

  authoring: {
    scale: [0.85, 1.4], defaultScale: 1.1,
    placement: 'shore', shoreBand: 9,
    avoidSurfaces: ['tarmac', 'ice', 'snow'], minRoadDist: 11, randomYaw: true,
  },
};

export default willow;
