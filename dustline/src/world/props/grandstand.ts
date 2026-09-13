// GRANDSTAND — raked seating under a roof. The thing that makes a corner feel
// like an event rather than a road.

import * as THREE from 'three';
import { PropTemplate, standard, mergeGeoms, beam, cylinderAt } from './types';

const TIERS = 6;

const grandstand: PropTemplate = {
  id: 'grandstand',
  name: 'Grandstand',
  category: 'structure',
  description: 'Raked seating under a roof, 14 m wide. Solid.',

  build: () => [
    {
      key: 'structure',
      geometry: mergeGeoms([
        // stepped terrace, rising away from the track
        ...Array.from({ length: TIERS }, (_, i) =>
          beam(14, 0.5 + i * 0.45, 1.15, 0, (0.5 + i * 0.45) / 2, -0.6 - i * 1.15)),
        // roof posts at the back
        ...[-6.4, -2.1, 2.1, 6.4].map((x) => cylinderAt(0.16, 0.16, 5.2, 6, 0).translate(x, 0, -7.2)),
        ...[-6.4, 6.4].map((x) => cylinderAt(0.16, 0.16, 3.4, 6, 0).translate(x, 0, -0.4)),
      ]),
      material: standard(0xa9a49a, { roughness: 0.95, flatShading: false }),
      castShadow: true,
    },
    {
      key: 'seats',
      // a bench per tier, in a livery colour, so the stand reads as occupied
      geometry: mergeGeoms(Array.from({ length: TIERS }, (_, i) =>
        beam(13.4, 0.16, 0.42, 0, 0.62 + i * 0.45, -0.35 - i * 1.15))),
      material: standard(0x2f6f9e, { flatShading: false }),
      tint: (c) => new THREE.Color(0x2f6f9e).offsetHSL(c.rng.centered(0.06), 0, c.rng.centered(0.05)),
    },
    {
      key: 'roof',
      geometry: mergeGeoms([
        beam(15, 0.22, 8.2, 0, 5.3, -3.8, -0.12, 0, 0),
        beam(15, 0.5, 0.3, 0, 5.0, 0.15),                   // front fascia
      ]),
      material: standard(0xd8d2c6, { roughness: 0.85, flatShading: false }),
      castShadow: true,
    },
  ],

  physics: {
    // THE STAND RECEDES BACKWARD. Every tier steps away in -Z and the roof
    // posts stand at -7.2, so the mass runs from the trackside edge back nearly
    // eight metres — while the collider was a box centred on the origin. That
    // put four metres of invisible wall out in FRONT of the barrier, on the
    // racing side, and left the back third of the stand hollow.
    shape: (s) => ({
      kind: 'box',
      halfExtents: [7 * s, 2.6 * s, 4.1 * s],
      centerY: 2.6 * s,
      centerZ: -3.8 * s,
    }),
    solid: true,
    massKg: 30000,
  },

  authoring: { scale: [0.8, 1.4], defaultScale: 1, minRoadDist: 13 },
};

export default grandstand;
