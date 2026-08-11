// MARKET STALL — trestle and a striped awning. What puts PEOPLE in a village
// without modelling any: a square with stalls in it has been used this morning,
// where the same square with only houses could have been abandoned for years.

import * as THREE from 'three';
import { PropTemplate, standard, mergeGeoms, mergeGeomsUV, beam } from './types';
import { awningTexture } from '../../templates/markings';

const marketStall: PropTemplate = {
  id: 'marketStall',
  name: 'Market stall',
  category: 'settlement',
  description: 'Trestle table under a striped awning, 2.6 m. Solid.',

  build: () => [
    {
      key: 'frame',
      geometry: mergeGeoms([
        beam(2.6, 0.1, 1.1, 0, 0.9, 0),                             // table top
        ...[[-1.15, -0.45], [1.15, -0.45], [-1.15, 0.45], [1.15, 0.45]].map(
          ([x, z]) => beam(0.09, 0.9, 0.09, x, 0.45, z)),
        ...[[-1.2, -0.6], [1.2, -0.6], [-1.2, 0.6], [1.2, 0.6]].map(
          ([x, z]) => beam(0.08, 2.3, 0.08, x, 1.15, z)),           // awning posts
      ]),
      material: standard(0x8f7550, { roughness: 0.95, flatShading: false }),
      castShadow: true,
    },
    {
      key: 'awning',
      geometry: mergeGeomsUV([
        beam(2.9, 0.08, 0.95, 0, 2.5, 0.35, -0.42, 0, 0),
        beam(2.9, 0.08, 0.95, 0, 2.5, -0.35, 0.42, 0, 0),
      ]),
      // PALE STRIPES, NOT v1'S RED — the tint below is the whole point of this
      // part, a different canopy colour per stall, and a red/cream map
      // multiplied by a random hue is mud. White/grey stripes take the tint:
      // full-strength colour and a dimmed band of the same colour.
      material: standard(0xffffff, {
        roughness: 0.85, flatShading: false,
        map: awningTexture('#ffffff', '#a9a9a9'),
      }),
      // The awning is the only part anyone sees from a distance, so it carries
      // all the variety — a market of identical canopies looks like a car park.
      tint: (c) => new THREE.Color().setHSL(
        c.rng.float(), 0.45 + c.rng.float() * 0.25, 0.52,
      ),
      castShadow: true,
    },
    {
      key: 'goods',
      geometry: mergeGeoms([
        beam(0.5, 0.22, 0.4, -0.8, 1.06, 0),
        beam(0.45, 0.3, 0.4, -0.1, 1.1, 0.05),
        beam(0.55, 0.18, 0.42, 0.75, 1.04, -0.03),
      ]),
      material: standard(0xc7863f, { roughness: 1 }),
      tint: (c) => new THREE.Color().setHSL(0.06 + c.rng.float() * 0.2, 0.5, 0.42),
    },
  ],

  physics: {
    shape: (s) => ({ kind: 'box', halfExtents: [1.3 * s, 0.5 * s, 0.6 * s], centerY: 0.5 * s }),
    solid: true,
    // COVERAGE — the counter and frame. The canvas canopy is over your roofline.
    coverage: 'partial',
    massKg: 220,
  },

  authoring: { scale: [0.9, 1.15], defaultScale: 1, minRoadDist: 7, randomYaw: true },
};

export default marketStall;
