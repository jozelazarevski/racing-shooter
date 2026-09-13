// TYRE STACK — the standard corner marker. Solid, but light: it exists to
// punish a missed apex without ending the run.

import * as THREE from 'three';
import { PropTemplate, cylinderAt, standard } from './types';

const tyreStack: PropTemplate = {
  id: 'tyreStack',
  name: 'Tyre stack',
  category: 'trackside',
  description: 'Three stacked tyres. Solid, light — marks a corner, does not end a race.',

  build: () => [0, 1, 2].map((i) => ({
    key: `tyre${i}`,
    geometry: cylinderAt(0.62, 0.62, 0.42, 14, i * 0.42),
    material: standard(0x1c1e22, { roughness: 0.95, flatShading: false }),
    castShadow: true,
    tint: (c) => (i === 2 && c.rng.float() < 0.5
      ? new THREE.Color(0xd8d2c4) : null),   // occasional white top, as at a real circuit
  })),

  physics: {
    shape: (s) => ({ kind: 'cylinder', halfHeight: 0.63 * s, radius: 0.66 * s, centerY: 0.63 * s }),
    solid: true,
    massKg: 60,
  },

  authoring: {
    scale: [0.9, 1.2], defaultScale: 1, minRoadDist: 8, randomYaw: true,
  },
};

export default tyreStack;
