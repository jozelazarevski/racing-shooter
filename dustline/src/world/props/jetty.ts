// JETTY — a 10 m timber deck on piles, running out from the bank.
//
// `shore` placement, not `water`: it stands on the BED, so its base belongs on
// the ground, and putting it at the waterline would leave it hovering. The
// piles are cut long and driven well below y = 0 for the same reason a real
// one is — the bed is not flat, and legs that stop exactly at the modelled
// depth leave a jetty on tiptoe over the first dip.
//
// Placed by hand it points along its own +Z, so rotate it to face the water.

import * as THREE from 'three';
import { PropTemplate, standard, mergeGeoms, beam, cylinderAt } from './types';

const jetty: PropTemplate = {
  id: 'jetty',
  name: 'Jetty',
  category: 'marine',
  description: '10 m timber landing stage on piles. Runs out along +Z. Solid.',

  build: () => [
    {
      key: 'piles',
      geometry: mergeGeoms(
        [-1.1, 1.1].flatMap((x) =>
          [1.2, 3.6, 6.0, 8.4].map((z) => cylinderAt(0.17, 0.19, 6.4, 6, -4.6).translate(x, 0, z))),
      ),
      material: standard(0x5d4c3a, { roughness: 1, flatShading: false }),
      castShadow: true,
    },
    {
      key: 'deck',
      geometry: mergeGeoms([
        // planks, laid across, with the gaps that make a deck read as boards
        ...Array.from({ length: 24 }, (_, i) =>
          beam(2.7, 0.12, 0.32, 0, 1.74, 0.6 + i * 0.4)),
        beam(0.16, 0.16, 9.8, -1.2, 1.6, 5.0),                      // stringers
        beam(0.16, 0.16, 9.8, 1.2, 1.6, 5.0),
      ]),
      material: standard(0x9a825f, { roughness: 0.95, flatShading: false }),
      castShadow: true,
      tint: (c) => new THREE.Color(0x9a825f).offsetHSL(0, c.rng.centered(0.04), c.rng.centered(0.06)),
    },
    {
      key: 'rail',
      geometry: mergeGeoms([
        ...[-1.25, 1.25].flatMap((x) => [
          ...[1.2, 4.2, 7.2, 9.6].map((z) => beam(0.1, 1.0, 0.1, x, 2.3, z)),
          beam(0.09, 0.09, 8.8, x, 2.75, 5.4),
        ]),
      ]),
      material: standard(0x7d6a4e, { roughness: 0.95, flatShading: false }),
    },
  ],

  physics: {
    // The deck, not the piles. Half-extents cover the run; centreY puts the
    // box at deck height so a car ramps onto it rather than into it.
    shape: (s) => ({ kind: 'box', halfExtents: [1.4 * s, 0.15 * s, 5 * s], centerY: 1.7 * s }),
    solid: true,
    massKg: 12000,
  },

  authoring: {
    scale: [0.9, 1.2], defaultScale: 1,
    placement: 'shore', shoreBand: 4,
    minRoadDist: 8, randomYaw: true,
  },
};

export default jetty;
