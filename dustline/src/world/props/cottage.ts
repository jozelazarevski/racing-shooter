// COTTAGE — the small dwelling. One storey, pitched roof, chimney.
//
// The whole settlement set is built from this shape: a box, two rotated roof
// slabs, and a gable slab at each end to close the triangle. That is the same
// recipe the barn uses, and keeping it identical is deliberate — a village
// made of five unrelated modelling tricks reads as five unrelated villages.

import * as THREE from 'three';
import { PropTemplate, standard, mergeGeoms, beam, boxAt, cylinderAt } from './types';

/** Roof, gables and all, for a rectangular building.
 *
 *  Exported because the church, the farmhouse and the townhouse all need one
 *  and the arithmetic — half-span, pitch angle, where the ridge lands — is
 *  exactly the sort of thing that ends up subtly different in each copy. A
 *  roof that misses its walls by 4 cm on one building and not the others is a
 *  bug you find by squinting, which is the worst way to find one. */
export function gabledRoof(
  width: number, depth: number, wallTop: number, rise: number, overhang = 0.3,
): { slabs: THREE.BufferGeometry[]; gables: THREE.BufferGeometry[]; ridgeY: number } {
  const half = depth / 2;
  const pitch = Math.atan2(rise, half);
  const slope = Math.hypot(half, rise) + overhang;
  // A slab is laid along the ridge and tilted; its centre sits half-way up the
  // slope, which is what puts its lower edge on the wall top.
  const cz = (slope / 2) * Math.cos(pitch) - overhang / 2;
  const cy = wallTop + (slope / 2) * Math.sin(pitch) - overhang / 2;
  const slabs = [
    beam(width + overhang * 2, 0.18, slope, 0, cy, cz, -pitch, 0, 0),
    beam(width + overhang * 2, 0.18, slope, 0, cy, -cz, pitch, 0, 0),
  ];
  const gables = [-width / 2, width / 2].flatMap((x) => [
    beam(0.16, 0.9, Math.hypot(half, rise), x, wallTop + rise * 0.45, half / 2, -pitch, 0, 0),
    beam(0.16, 0.9, Math.hypot(half, rise), x, wallTop + rise * 0.45, -half / 2, pitch, 0, 0),
  ]);
  return { slabs, gables, ridgeY: wallTop + rise };
}

const cottage: PropTemplate = {
  id: 'cottage',
  name: 'Cottage',
  category: 'settlement',
  description: 'Small one-storey dwelling, 6 x 4.5 m, with a chimney. Solid.',

  build: () => [
    {
      key: 'walls',
      geometry: mergeGeoms([
        boxAt(6, 2.7, 4.5, 0),
        cylinderAt(0.34, 0.38, 1.5, 4, 3.4).translate(2.0, 0, 0),   // chimney
      ]),
      material: standard(0xe4dccb, { roughness: 0.95, flatShading: false }),
      castShadow: true,
      // Whitewash weathers unevenly, and a street of identically-coloured
      // houses is the fastest way to make a village look printed.
      tint: (c) => new THREE.Color(0xe4dccb).offsetHSL(
        c.rng.centered(0.04), c.rng.centered(0.06), c.rng.centered(0.07),
      ),
    },
    {
      key: 'roof',
      geometry: mergeGeoms(gabledRoof(6, 4.5, 2.7, 1.5).slabs),
      material: standard(0x6b4438, { roughness: 0.95, flatShading: false }),
      castShadow: true,
      tint: (c) => new THREE.Color(0x6b4438).offsetHSL(0, 0, c.rng.centered(0.05)),
    },
    {
      key: 'gable',
      geometry: mergeGeoms(gabledRoof(6, 4.5, 2.7, 1.5).gables),
      material: standard(0xd8cfbc, { roughness: 0.95, flatShading: false }),
    },
    {
      key: 'openings',
      // Door and windows as shallow inset panels. Real holes would need the
      // walls to be a shell, which costs a lot of triangles for something you
      // read at 90 km/h.
      geometry: mergeGeoms([
        beam(1.0, 2.0, 0.1, 0, 1.0, 2.28),
        beam(0.9, 0.85, 0.1, -1.9, 1.6, 2.28),
        beam(0.9, 0.85, 0.1, 1.9, 1.6, 2.28),
        beam(0.9, 0.85, 0.1, 0, 1.6, -2.28),
        beam(0.1, 0.85, 0.9, -3.05, 1.6, 0),
      ]),
      material: standard(0x3a3f4a, { roughness: 0.6, flatShading: false }),
    },
  ],

  physics: {
    shape: (s) => ({ kind: 'box', halfExtents: [3 * s, 2.1 * s, 2.25 * s], centerY: 2.1 * s }),
    solid: true,
    massKg: 40000,
  },

  authoring: { scale: [0.85, 1.2], defaultScale: 1, minRoadDist: 12, randomYaw: true },
};

export default cottage;
