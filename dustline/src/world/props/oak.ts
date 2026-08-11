// OAK — broad, heavy, slow. The tree a village grows around, and the one the
// existing set was missing: pine and birch are both TALL and NARROW, so a
// landscape built from them has no wide silhouette in it anywhere.
//
// SHAPE FROM IGNITE RALLY: `_buildForest(m4)` in `src/world/flora.js` at the
// repository root, species `oak` — `oakDome` is a sphere of radius 2.35 at
// (8, 6) segments SQUASHED TO 0.78 OF ITS HEIGHT and set at y 4.0, with
// `oakTop`, radius 1.4 at (7, 5), riding at (0.35, 5.5, 0.2).
//
// THE FLATTENING IS THE PORT. This file already argued that the oak exists to
// be the wide silhouette and then built its crown out of four ROUND spheres,
// which is a bush on a stick. v1 squashes every crown lobe it draws, on every
// broadleaf species it has, and that number is the difference between a crown
// that sits on the tree like a cushion and one that piles up like a ball.
//
// BE CLEAR ABOUT HOW MUCH IT BUYS, because it is less than it sounds and the
// numbers are easy to check. Measured: the crown is 6.86 m across and the tree
// 7.23 m tall, against 7.03 x 7.90 before — width to height goes from 0.89 to
// 0.95. The flattening takes 0.67 m off the height and 0.17 m off the width,
// so what changes is the crown's own PROFILE, not the tree's footprint. v1's
// oak is no wider than it is tall either; the species in this library that
// genuinely is, and says so, is the olive.
//
// ALSO ACROSS: v1's segment counts, which are lower than the ones here were
// (8x6 for the dome, 7x5 for the lobes, against 11x5 and 10x5) — a faceted
// crown is v1's look and it is 54 triangles cheaper; v1's crown tier law, the
// upper lobe brightened and the low crown put in its own shade (v1's
// `f = 0.85 + (ti-1)/(tiers-1) * 0.45`, so 0.85 and 1.3 over two tiers), which
// is why the top lobe is now a part of its own; and v1's two wood tones on the
// trunk.
//
// WHAT DID NOT COME ACROSS, and the honest reason: v1's oak is a bare cylinder
// under two spheres. It has no limbs. The three angled limbs here are
// dustline's and they are better than v1's nothing, so they stay, and so do
// the two side lobes v1's crown does not have. The port is the PROPORTION, not
// the part list.
//
// TRIANGLES: 324, against 378 before.

import * as THREE from 'three';
import { PropTemplate, PlaceCtx, cylinderAt, standard, mergeGeoms, beam } from './types';

/** v1's crown lobe: a low-poly sphere squashed vertically and moved into
 *  place. Built with `THREE.SphereGeometry` directly rather than through
 *  `sphereAt` for the same two reasons `oliveTree.ts` gives — the squash, and
 *  segment counts `sphereAt` cannot express because it derives the height
 *  segments from the width. */
function lobe(r: number, wSeg: number, hSeg: number, squash: number,
  x: number, y: number, z: number): THREE.SphereGeometry {
  const g = new THREE.SphereGeometry(r, wSeg, hSeg);
  g.scale(1, squash, 1);
  g.translate(x, y, z);
  return g;
}

/** Per-instance value from POSITION, not `ctx.rng` — same hash and the same
 *  reason as `pine.ts`, which writes it out: parts are written one at a time,
 *  so the crown and the top lobe cannot agree on a hue through the rng. */
function siteHash(c: PlaceCtx, salt: number): number {
  const n = Math.sin(c.x * 12.9898 + c.z * 78.233 + salt * 37.719) * 43758.5453;
  return n - Math.floor(n);
}

function leaf(c: PlaceCtx): THREE.Color {
  const snowy = c.surface === 'snow';
  return new THREE.Color().setHSL(
    snowy ? 0.11 : 0.24 + siteHash(c, 3) * 0.05,
    snowy ? 0.22 : 0.5,
    snowy ? 0.4 : 0.26 + (siteHash(c, 4) - 0.5) * 0.1,
  );
}

const oak: PropTemplate = {
  id: 'oak',
  name: 'Oak',
  category: 'flora',
  description: 'Broad deciduous tree, flattened cushion crown. Solid trunk.',

  build: () => [
    {
      key: 'trunk',
      geometry: mergeGeoms([
        cylinderAt(0.34, 0.62, 3.0, 10, 0),
        // three limbs, angled out — an oak's shape is in the branching, and a
        // bare cylinder under a sphere reads as a lollipop
        beam(0.22, 1.8, 0.22, 0.5, 3.4, 0.2, 0, 0, -0.55),
        beam(0.2, 1.7, 0.2, -0.55, 3.3, -0.15, 0, 0, 0.5),
        beam(0.18, 1.6, 0.18, 0.05, 3.5, -0.5, 0.45, 0, 0),
      ]),
      material: standard(0x6b5238, { flatShading: false }),
      castShadow: true,
      // v1's two wood tones. An oak trunk is the widest piece of bark in the
      // world and it was one flat colour on every instance.
      tint: (c) => {
        const t = siteHash(c, 2) < 0.5 ? 1.0 : 0.78;
        return new THREE.Color(t, t * 0.96, t * 0.9);
      },
    },
    {
      key: 'canopy',
      geometry: mergeGeoms([
        // v1's dome proportion: squashed to 0.78, so it spreads instead of
        // piling up. The lobes take 0.8, near enough the same cushion.
        lobe(2.5, 8, 6, 0.78, 0, 5.0, 0),
        lobe(1.8, 7, 5, 0.8, 1.9, 4.5, 0.5),
        lobe(1.7, 7, 5, 0.8, -1.8, 4.7, -0.6),
      ]),
      material: standard(0xffffff),
      castShadow: true,
      tint: (c) => leaf(c).multiplyScalar(0.85),
    },
    {
      // ITS OWN PART SO IT CAN BE BRIGHTER. v1 gives every crown tier its own
      // InstancedMesh for exactly this: the top of a broadleaf is in the sun
      // and the mass under it is not, and one merged crown cannot say so.
      key: 'crownTop',
      geometry: lobe(1.5, 7, 5, 0.82, 0.35, 6.0, 0.2),
      material: standard(0xffffff),
      castShadow: true,
      tint: (c) => leaf(c).multiplyScalar(1.3),
    },
  ],

  physics: {
    shape: (s) => ({ kind: 'cylinder', halfHeight: 1.6 * s, radius: 0.62 * s, centerY: 1.6 * s }),
    solid: true,
    // COVERAGE — the trunk. The crown spreads 7 m and stops nothing.
    coverage: 'trunk',
    massKg: 4000,
  },

  authoring: {
    scale: [0.9, 1.7], defaultScale: 1.2,
    avoidSurfaces: ['tarmac', 'ice', 'snow'], minRoadDist: 13, randomYaw: true,
  },
};

export default oak;
