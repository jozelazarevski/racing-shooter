// GUARDRAIL — a run of steel Armco on posts. Long and thin, so it is placed
// end to end along a drop; rotation is the whole point of this component.

import * as THREE from 'three';
import { PropTemplate, standard, mergeGeoms, beam, cylinderAt } from './types';

const guardrail: PropTemplate = {
  id: 'guardrail',
  name: 'Guardrail',
  category: 'trackside',
  description: 'Steel Armco on posts, 6 m. Solid — place them end to end along a drop.',

  build: () => [
    {
      key: 'posts',
      geometry: mergeGeoms([-2.25, 0, 2.25].map((x) => cylinderAt(0.07, 0.07, 0.78, 6, 0).translate(x, 0, 0))),
      material: standard(0x6d7076, { flatShading: false }),
      castShadow: true,
    },
    {
      key: 'rail',
      geometry: mergeGeoms([
        beam(6, 0.13, 0.1, 0, 0.62, 0.06),
        beam(6, 0.13, 0.1, 0, 0.44, 0.06),
        beam(6, 0.06, 0.13, 0, 0.53, 0.02),        // the W web between the flanges
      ]),
      material: standard(0xb9bcc0, { roughness: 0.55, metalness: 0.35, flatShading: false }),
      castShadow: true,
    },
  ],

  physics: {
    shape: (s) => ({ kind: 'box', halfExtents: [3 * s, 0.42 * s, 0.14 * s], centerY: 0.42 * s }),
    solid: true,
    massKg: 700,
  },

  authoring: { scale: [1, 1], defaultScale: 1, minRoadDist: 6 },
};

export default guardrail;
