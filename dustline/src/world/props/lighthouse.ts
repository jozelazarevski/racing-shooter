// LIGHTHOUSE — 18 m striped tower. The tallest thing in the library, and the
// only component built to be read from the far side of the map: the stripes
// exist so it still says "lighthouse" when it is forty pixels tall.

import * as THREE from 'three';
import { PropTemplate, standard, mergeGeoms, beam, cylinderAt, coneAt } from './types';

const lighthouse: PropTemplate = {
  id: 'lighthouse',
  name: 'Lighthouse',
  category: 'marine',
  description: '18 m striped tower with a lamp room. Landmark. Solid.',

  build: () => [
    {
      key: 'tower',
      geometry: mergeGeoms([
        cylinderAt(1.5, 2.8, 14, 12, 0),
        cylinderAt(3.1, 3.4, 1.0, 12, 0),                           // plinth
        beam(1.0, 2.0, 0.2, 0, 1.0, 3.0),                           // door
      ]),
      material: standard(0xf0ece2, { roughness: 0.85, flatShading: false }),
      castShadow: true,
    },
    {
      key: 'bands',
      // Three red hoops, each slightly proud of the taper so they never sink
      // into the tower they are painted on.
      geometry: mergeGeoms([2.0, 6.0, 10.0].map((y) => {
        const r = 2.8 - (y / 14) * 1.3 + 0.02;
        return cylinderAt(r - 0.09, r, 1.6, 12, y);
      })),
      material: standard(0xc23a2c, { roughness: 0.85, flatShading: false }),
    },
    {
      key: 'gallery',
      geometry: mergeGeoms([
        cylinderAt(2.3, 2.3, 0.22, 12, 14),
        ...Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return beam(0.08, 0.9, 0.08, Math.cos(a) * 2.1, 14.65, Math.sin(a) * 2.1);
        }),
        cylinderAt(2.2, 2.2, 0.08, 12, 15.0),                       // handrail
        coneAt(1.8, 1.6, 12, 16.9),                                 // roof
        cylinderAt(0.06, 0.06, 0.7, 4, 18.5),                       // finial
      ]),
      material: standard(0x2e3339, { roughness: 0.7, flatShading: false }),
      castShadow: true,
    },
    {
      key: 'lamp',
      geometry: cylinderAt(1.35, 1.35, 2.1, 10, 14.8),
      material: standard(0xfff3c4, {
        roughness: 0.2,
        emissive: 0xffd766,
        emissiveIntensity: 0.85,
        flatShading: false,
      }),
    },
  ],

  physics: {
    shape: (s) => ({ kind: 'cylinder', halfHeight: 7 * s, radius: 2.8 * s, centerY: 7 * s }),
    solid: true,
    massKg: 600000,
  },

  authoring: {
    scale: [0.8, 1.2], defaultScale: 1,
    placement: 'shore', shoreBand: 14,
    minRoadDist: 20, randomYaw: true, previewDist: 42,
  },
};

export default lighthouse;
