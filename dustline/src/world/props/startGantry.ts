// START GANTRY — the arch over the road. The one component that is placed
// exactly once per track and defines where the lap begins visually.
//
// Deliberately NOT solid: an arch you can hit is an arch you WILL hit on the
// opening lap of a four-car grid, and there is no version of that which is
// good. The legs stand clear of the road; the span is scenery.

import * as THREE from 'three';
import { PropTemplate, standard, mergeGeoms, beam, cylinderAt } from './types';

const startGantry: PropTemplate = {
  id: 'startGantry',
  name: 'Start gantry',
  category: 'structure',
  description: 'Arch over the road, 18 m span. Not solid — the span is scenery.',

  build: () => [
    {
      key: 'legs',
      geometry: mergeGeoms([-8.2, 8.2].flatMap((x) => [
        cylinderAt(0.24, 0.3, 6.4, 8, 0).translate(x, 0, 0),
        beam(1.5, 0.25, 1.5, x, 0.12, 0),                      // base plate
      ])),
      material: standard(0x9aa0a6, { roughness: 0.6, flatShading: false }),
      castShadow: true,
    },
    {
      key: 'truss',
      geometry: mergeGeoms([
        beam(17.4, 0.3, 0.3, 0, 6.4, 0.5),
        beam(17.4, 0.3, 0.3, 0, 6.4, -0.5),
        beam(17.4, 0.3, 0.3, 0, 5.5, 0),
        // diagonal web
        ...Array.from({ length: 11 }, (_, i) => beam(1.25, 0.14, 0.14,
          -7.8 + i * 1.56, 5.95, 0, 0, 0, i % 2 ? 0.62 : -0.62)),
      ]),
      material: standard(0x8a9198, { roughness: 0.6, flatShading: false }),
      castShadow: true,
    },
    {
      key: 'banner',
      geometry: beam(12.5, 1.5, 0.12, 0, 7.5, 0),
      material: standard(0xd8452e, { flatShading: false }),
      castShadow: true,
    },
  ],

  physics: { shape: () => ({ kind: 'none' }), solid: false, massKg: 6000 },

  authoring: { scale: [0.8, 1.3], defaultScale: 1, minRoadDist: 0 },
};

export default startGantry;
