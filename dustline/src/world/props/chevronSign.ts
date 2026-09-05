// CHEVRON SIGN — the board on the outside of a corner that tells you which way
// it goes before you can see it. The most functional object on this list: it
// is navigation, not decoration.

import * as THREE from 'three';
import { PropTemplate, standard, mergeGeoms, beam, cylinderAt } from './types';

const chevronSign: PropTemplate = {
  id: 'chevronSign',
  name: 'Chevron board',
  category: 'trackside',
  description: 'Direction board for a blind corner. Solid but light.',

  build: () => [
    {
      key: 'posts',
      geometry: mergeGeoms([-0.55, 0.55].map((x) => cylinderAt(0.06, 0.06, 1.5, 6, 0).translate(x, 0, 0))),
      material: standard(0x55524c, { flatShading: false }),
      castShadow: true,
    },
    {
      key: 'board',
      geometry: beam(1.7, 0.72, 0.07, 0, 1.5, 0),
      material: standard(0x1d1f22, { flatShading: false }),
      castShadow: true,
    },
    {
      key: 'chevrons',
      // three arrow heads, made of paired angled bars
      geometry: mergeGeoms([-0.55, 0, 0.55].flatMap((x) => [
        beam(0.44, 0.13, 0.03, x - 0.06, 1.66, 0.05, 0, 0, -0.72),
        beam(0.44, 0.13, 0.03, x - 0.06, 1.34, 0.05, 0, 0, 0.72),
      ])),
      material: standard(0xf2ede0, { flatShading: false }),
    },
  ],

  physics: {
    shape: (s) => ({ kind: 'box', halfExtents: [0.85 * s, 0.95 * s, 0.12 * s], centerY: 0.95 * s }),
    solid: true,
    massKg: 40,
  },

  authoring: { scale: [0.9, 1.2], defaultScale: 1, minRoadDist: 6 },
};

export default chevronSign;
