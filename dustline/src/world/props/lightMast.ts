// LIGHT MAST — a tall floodlight tower. Vertical landmarks are what make a
// flat stage navigable; this one is visible from anywhere on the map.

import * as THREE from 'three';
import { PropTemplate, standard, mergeGeoms, beam, cylinderAt } from './types';

const lightMast: PropTemplate = {
  id: 'lightMast',
  name: 'Light mast',
  category: 'structure',
  description: '11 m floodlight tower. Solid, and visible across the map.',

  build: () => [
    {
      key: 'mast',
      geometry: mergeGeoms([
        cylinderAt(0.14, 0.3, 10.5, 6, 0),
        beam(1.1, 0.3, 1.1, 0, 0.15, 0),
      ]),
      material: standard(0x7d848a, { roughness: 0.7, flatShading: false }),
      castShadow: true,
    },
    {
      key: 'lamps',
      geometry: mergeGeoms([-0.62, 0, 0.62].flatMap((x) => [
        beam(0.5, 0.34, 0.22, x, 10.9, 0.18, -0.5, 0, 0),
      ]).concat([beam(2.1, 0.12, 0.4, 0, 10.6, 0)])),
      material: standard(0xf4efdc, { emissive: 0x6a6250, emissiveIntensity: 0.35, flatShading: false }),
      castShadow: true,
    },
  ],

  physics: {
    shape: (s) => ({ kind: 'cylinder', halfHeight: 5.3 * s, radius: 0.32 * s, centerY: 5.3 * s }),
    solid: true,
    // COVERAGE — the mast. The lamp gantry is 9 m up.
    coverage: 'trunk',
    massKg: 3500,
  },

  authoring: { scale: [0.8, 1.4], defaultScale: 1, minRoadDist: 10, randomYaw: true },
};

export default lightMast;
