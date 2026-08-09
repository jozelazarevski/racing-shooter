// FARMHOUSE — two storeys and a lean-to. The anchor of a rural settlement:
// bigger than a cottage, lower than anything in a town, and asymmetric enough
// that a row of them does not look like a row.

import * as THREE from 'three';
import { PropTemplate, standard, mergeGeoms, beam, boxAt, cylinderAt } from './types';
import { gabledRoof } from './cottage';

// Built per call, NOT hoisted to module scope. `translate` mutates a geometry
// in place and the part cache is reset whenever a world is rebuilt, so a
// shared roof would drift 6 m sideways on the second build and hand out
// disposed buffers on the third.
const main = () => gabledRoof(8, 5.5, 5.2, 1.9);
const lean = () => gabledRoof(4, 3.4, 2.4, 0.8);

const farmhouse: PropTemplate = {
  id: 'farmhouse',
  name: 'Farmhouse',
  category: 'settlement',
  description: 'Two-storey house, 8 x 5.5 m, with a lean-to. Solid.',

  build: () => [
    {
      key: 'walls',
      geometry: mergeGeoms([
        boxAt(8, 5.2, 5.5, 0),
        boxAt(4, 2.4, 3.4, 0).translate(6, 0, 0),                   // lean-to
        cylinderAt(0.4, 0.46, 1.8, 4, 6.6).translate(-2.8, 0, 0),
      ]),
      material: standard(0xd6c8ae, { roughness: 0.95, flatShading: false }),
      castShadow: true,
      tint: (c) => new THREE.Color(0xd6c8ae).offsetHSL(
        c.rng.centered(0.03), c.rng.centered(0.05), c.rng.centered(0.06),
      ),
    },
    {
      key: 'roof',
      geometry: mergeGeoms([
        ...main().slabs,
        ...lean().slabs.map((g) => g.translate(6, 0, 0)),
      ]),
      material: standard(0x5a4a52, { roughness: 0.95, flatShading: false }),
      castShadow: true,
      tint: (c) => new THREE.Color(0x5a4a52).offsetHSL(0, 0, c.rng.centered(0.05)),
    },
    {
      key: 'gable',
      geometry: mergeGeoms([
        ...main().gables,
        ...lean().gables.map((g) => g.translate(6, 0, 0)),
      ]),
      material: standard(0xcbbb9e, { roughness: 0.95, flatShading: false }),
    },
    {
      key: 'openings',
      geometry: mergeGeoms([
        beam(1.1, 2.2, 0.1, -1.2, 1.1, 2.78),                       // door
        // upstairs and downstairs windows, on both long faces
        ...[-2.9, 0.6, 2.9].flatMap((x) => [
          beam(1.0, 1.2, 0.1, x, 3.7, 2.78),
          beam(1.0, 1.2, 0.1, x, 3.7, -2.78),
        ]),
        beam(1.0, 1.2, 0.1, 1.8, 1.4, 2.78),
        beam(1.0, 1.2, 0.1, -1.5, 1.4, -2.78),
        beam(0.1, 1.0, 1.0, -4.05, 3.6, 0),
      ]),
      material: standard(0x39414d, { roughness: 0.6, flatShading: false }),
    },
  ],

  physics: {
    // The lean-to is inside the box on purpose: two colliders per instance for
    // a 2.4 m outhouse is not worth doubling the collider count of a village.
    shape: (s) => ({ kind: 'box', halfExtents: [5 * s, 3.4 * s, 2.75 * s], centerY: 3.4 * s }),
    solid: true,
    massKg: 90000,
  },

  authoring: { scale: [0.9, 1.15], defaultScale: 1, minRoadDist: 14, randomYaw: true },
};

export default farmhouse;
