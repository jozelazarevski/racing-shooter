// STREET LAMP — a cast-iron post with a lantern. Deliberately NOT a light
// source: a village of forty lamps would be forty shadow-casting lights, which
// is a frame budget spent on something nobody looks at. The emissive lantern
// glass gives the read at a hundredth of the cost.

import { PropTemplate, standard, mergeGeoms, beam, cylinderAt, coneAt } from './types';

const streetLamp: PropTemplate = {
  id: 'streetLamp',
  name: 'Street lamp',
  category: 'settlement',
  description: 'Cast-iron lamp post, 4 m. Solid post — casts no light.',

  build: () => [
    {
      key: 'post',
      geometry: mergeGeoms([
        cylinderAt(0.09, 0.2, 3.5, 8, 0),
        cylinderAt(0.26, 0.3, 0.28, 8, 0),                          // base collar
        beam(0.06, 0.06, 0.5, 0, 3.3, 0.25),                        // bracket
      ]),
      material: standard(0x2f3338, { roughness: 0.6, flatShading: false }),
      castShadow: true,
    },
    {
      key: 'lantern',
      geometry: mergeGeoms([
        cylinderAt(0.22, 0.16, 0.42, 6, 3.5),
        coneAt(0.3, 0.22, 6, 3.92),
      ]),
      material: standard(0xffe9b0, {
        roughness: 0.35,
        emissive: 0xffca57,
        emissiveIntensity: 0.55,
        flatShading: false,
      }),
    },
  ],

  physics: {
    shape: (s) => ({ kind: 'cylinder', halfHeight: 1.8 * s, radius: 0.16 * s, centerY: 1.8 * s }),
    solid: true,
    // COVERAGE — the column. The lantern and its bracket overhang at 3.5 m.
    coverage: 'trunk',
    massKg: 180,
  },

  authoring: { scale: [0.95, 1.1], defaultScale: 1, minRoadDist: 7, randomYaw: true },
};

export default streetLamp;
