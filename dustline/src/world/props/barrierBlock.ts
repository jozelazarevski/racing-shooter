// BARRIER BLOCK — concrete. Heavy, immovable, and the right tool when a line
// must be closed rather than discouraged.

import * as THREE from 'three';
import { PropTemplate, standard, mergeGeoms, beam } from './types';

const barrierBlock: PropTemplate = {
  id: 'barrierBlock',
  name: 'Barrier block',
  category: 'trackside',
  description: 'Concrete block. Solid and heavy — closes a line rather than warning about it.',

  build: () => [
    {
      key: 'body',
      geometry: mergeGeoms([
        beam(3.2, 0.62, 0.44, 0, 0.55, 0),          // upper wall
        beam(3.3, 0.28, 0.78, 0, 0.14, 0),          // splayed foot
      ]),
      material: standard(0xcfcabd, { roughness: 0.95, flatShading: false }),
      castShadow: true,
      tint: (c) => new THREE.Color(0xcfcabd).offsetHSL(0, 0, c.rng.centered(0.035)),
    },
    {
      key: 'stripes',
      geometry: mergeGeoms([-1, 1].map((s) => beam(0.34, 0.5, 0.46, s * 1.2, 0.56, 0))),
      material: standard(0xd8452e, { flatShading: false }),
    },
  ],

  physics: {
    shape: (s) => ({ kind: 'box', halfExtents: [1.65 * s, 0.45 * s, 0.4 * s], centerY: 0.45 * s }),
    solid: true,
    massKg: 2400,
  },

  authoring: { scale: [0.9, 1.2], defaultScale: 1, minRoadDist: 6 },
};

export default barrierBlock;
