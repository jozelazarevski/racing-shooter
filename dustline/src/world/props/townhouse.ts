// TOWNHOUSE — narrow, three storeys, flush party walls. Placed shoulder to
// shoulder along a street it makes a terrace; the frontage is 4.4 m so a row
// of them at 4.4 m spacing meets without a gap.

import * as THREE from 'three';
import { PropTemplate, standard, mergeGeoms, beam, boxAt, cylinderAt } from './types';
import { gabledRoof } from './cottage';

const townhouse: PropTemplate = {
  id: 'townhouse',
  name: 'Townhouse',
  category: 'settlement',
  description: 'Narrow three-storey terrace house, 4.4 m frontage. Solid.',

  build: () => [
    {
      key: 'walls',
      geometry: mergeGeoms([
        boxAt(4.4, 8.2, 5.0, 0),
        cylinderAt(0.3, 0.34, 1.3, 4, 9.6).translate(0, 0, -1.4),
        beam(4.8, 0.3, 0.28, 0, 3.0, 2.6),                         // floor bands
        beam(4.8, 0.3, 0.28, 0, 5.7, 2.6),
      ]),
      material: standard(0xc9a98c, { roughness: 0.95, flatShading: false }),
      castShadow: true,
      // A terrace is only convincing if the houses differ, and the cheapest
      // honest difference is paint. The hue swing is wide on purpose.
      tint: (c) => new THREE.Color().setHSL(
        0.04 + c.rng.float() * 0.14, 0.16 + c.rng.float() * 0.22, 0.52 + c.rng.centered(0.12),
      ),
    },
    {
      key: 'roof',
      geometry: mergeGeoms(gabledRoof(4.4, 5.0, 8.2, 1.4, 0.18).slabs),
      material: standard(0x4a4550, { roughness: 0.95, flatShading: false }),
      castShadow: true,
    },
    {
      key: 'gable',
      geometry: mergeGeoms(gabledRoof(4.4, 5.0, 8.2, 1.4, 0.18).gables),
      material: standard(0xb59a80, { roughness: 0.95, flatShading: false }),
    },
    {
      key: 'openings',
      geometry: mergeGeoms([
        beam(1.1, 2.3, 0.1, -1.2, 1.15, 2.53),                     // street door
        beam(1.5, 1.5, 0.1, 0.9, 1.3, 2.53),                       // shopfront
        ...[3.6, 6.3].flatMap((y) => [
          beam(1.0, 1.5, 0.1, -1.1, y, 2.53),
          beam(1.0, 1.5, 0.1, 1.1, y, 2.53),
          beam(1.0, 1.5, 0.1, 0, y, -2.53),
        ]),
      ]),
      material: standard(0x2f3742, { roughness: 0.5, flatShading: false }),
    },
  ],

  physics: {
    shape: (s) => ({ kind: 'box', halfExtents: [2.2 * s, 4.6 * s, 2.5 * s], centerY: 4.6 * s }),
    solid: true,
    massKg: 120000,
  },

  authoring: { scale: [0.9, 1.1], defaultScale: 1, minRoadDist: 10, randomYaw: false },
};

export default townhouse;
