// PIT BUILDING — a run of garages with a first-floor balcony. The largest
// component in the library and the one that turns a loop into a circuit.

import * as THREE from 'three';
import { PropTemplate, standard, mergeGeoms, beam, boxAt } from './types';

const BAYS = 5;

const pitBuilding: PropTemplate = {
  id: 'pitBuilding',
  name: 'Pit building',
  category: 'structure',
  description: 'Five garages with a balcony, 26 m. Solid — turns a loop into a circuit.',

  build: () => [
    {
      key: 'shell',
      geometry: mergeGeoms([
        boxAt(26, 6.2, 8, 0),
        beam(27.5, 0.4, 9.6, 0, 6.4, 0),                    // roof slab
        beam(27.5, 0.3, 2.6, 0, 4.3, 5.0),                  // balcony floor
        beam(27.5, 0.5, 0.2, 0, 4.9, 6.2),                  // balcony rail
      ]),
      material: standard(0xd4cec2, { roughness: 0.92, flatShading: false }),
      castShadow: true,
    },
    {
      key: 'doors',
      geometry: mergeGeoms(Array.from({ length: BAYS }, (_, i) =>
        beam(3.6, 3.4, 0.18, -10.4 + i * 5.2, 1.7, 4.05))),
      material: standard(0x35393e, { roughness: 0.75, flatShading: false }),
    },
    {
      key: 'stripe',
      geometry: beam(26.2, 0.42, 0.1, 0, 4.05, 4.06),
      material: standard(0xd8452e, { flatShading: false }),
    },
  ],

  physics: {
    shape: (s) => ({ kind: 'box', halfExtents: [13 * s, 3.2 * s, 4.2 * s], centerY: 3.2 * s }),
    solid: true,
    massKg: 200000,
  },

  authoring: { scale: [0.8, 1.2], defaultScale: 1, minRoadDist: 16 },
};

export default pitBuilding;
