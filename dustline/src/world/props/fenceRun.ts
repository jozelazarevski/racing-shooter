// FENCE RUN — 8 m of post-and-rail. Non-solid: a wooden field fence should
// splinter, and until there is destruction to splinter it, driving through is
// closer to the truth than bouncing off.

import * as THREE from 'three';
import { PropTemplate, standard, mergeGeoms, beam, cylinderAt } from './types';

const fenceRun: PropTemplate = {
  id: 'fenceRun',
  name: 'Fence run',
  category: 'structure',
  description: 'Post-and-rail, 8 m. Not solid — a field fence should give way.',

  build: () => [{
    key: 'fence',
    geometry: mergeGeoms([
      ...[-4, -2, 0, 2, 4].map((x) => cylinderAt(0.08, 0.09, 1.25, 6, 0).translate(x, 0, 0)),
      beam(8.1, 0.1, 0.06, 0, 1.05, 0),
      beam(8.1, 0.1, 0.06, 0, 0.62, 0),
    ]),
    material: standard(0x9a8261, { flatShading: false }),
    castShadow: true,
    tint: (c) => new THREE.Color(0x9a8261).offsetHSL(0, 0, c.rng.centered(0.05)),
  }],

  physics: { shape: () => ({ kind: 'none' }), solid: false, massKg: 120 },

  authoring: { scale: [1, 1], defaultScale: 1, minRoadDist: 8 },
};

export default fenceRun;
