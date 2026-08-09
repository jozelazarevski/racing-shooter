// CHURCH — nave, tower, spire. The landmark of a settlement: the one building
// tall enough to see from the far side of the map, which makes it the thing
// that tells you where the village is while you are still driving towards it.

import * as THREE from 'three';
import { PropTemplate, standard, mergeGeoms, beam, boxAt, coneAt } from './types';
import { gabledRoof } from './cottage';

const church: PropTemplate = {
  id: 'church',
  name: 'Church',
  category: 'settlement',
  description: 'Stone nave with a 14 m spire. Solid, and visible across the map.',

  build: () => [
    {
      key: 'stone',
      geometry: mergeGeoms([
        boxAt(12, 5.4, 7, 0),                                       // nave
        boxAt(4.2, 11, 4.2, 0).translate(-7, 0, 0),                 // tower
        // buttresses down the long walls — the detail that stops the nave from
        // reading as a shed with a steeple next to it
        ...[-3.5, 0, 3.5].flatMap((x) => [
          beam(0.7, 4.2, 0.8, x, 2.1, 3.8),
          beam(0.7, 4.2, 0.8, x, 2.1, -3.8),
        ]),
      ]),
      material: standard(0xc2bdb0, { roughness: 1, flatShading: false }),
      castShadow: true,
      tint: (c) => new THREE.Color(0xc2bdb0).offsetHSL(0, c.rng.centered(0.03), c.rng.centered(0.05)),
    },
    {
      key: 'roof',
      geometry: mergeGeoms([
        ...gabledRoof(12, 7, 5.4, 2.2).slabs,
        // A spire is TALL and NARROW. The first cut was 3.4 m across and 5.6
        // high, wider than the tower under it, which reads as a tent pitched on
        // a chimney rather than as a steeple.
        coneAt(2.6, 8.5, 4, 11.2).translate(-7, 0, 0),
        boxAt(4.8, 0.3, 4.8, 10.7).translate(-7, 0, 0),             // tower cornice
      ]),
      material: standard(0x4d5a58, { roughness: 0.9, flatShading: false }),
      castShadow: true,
    },
    {
      key: 'gable',
      geometry: mergeGeoms(gabledRoof(12, 7, 5.4, 2.2).gables),
      material: standard(0xb3ada0, { roughness: 1, flatShading: false }),
    },
    {
      key: 'openings',
      geometry: mergeGeoms([
        beam(1.6, 3.0, 0.12, -7, 1.5, 2.16),                        // tower door
        ...[-3.2, 0, 3.2].flatMap((x) => [
          beam(0.9, 2.4, 0.12, x, 1.9, 3.56),
          beam(0.9, 2.4, 0.12, x, 1.9, -3.56),
        ]),
        // belfry openings, all four faces of the tower
        beam(1.2, 1.8, 0.12, -7, 8.2, 2.16), beam(1.2, 1.8, 0.12, -7, 8.2, -2.16),
        beam(0.12, 1.8, 1.2, -9.16, 8.2, 0), beam(0.12, 1.8, 1.2, -4.84, 8.2, 0),
      ]),
      material: standard(0x2b2f38, { roughness: 0.5, flatShading: false }),
    },
  ],

  physics: {
    // Nave only. The tower stands 7 m off the centre and the half-extent
    // covers it, which is close enough for a building nothing is meant to
    // squeeze past.
    shape: (s) => ({ kind: 'box', halfExtents: [9.2 * s, 4 * s, 3.5 * s], centerY: 4 * s }),
    solid: true,
    massKg: 400000,
  },

  authoring: { scale: [0.9, 1.2], defaultScale: 1, minRoadDist: 20, randomYaw: true },
};

export default church;
