// CACTUS — desert flora. Sand and gravel only when scattered; hand placement
// is never restricted, because if you put one on a glacier you meant it.
//
// SHAPE FROM IGNITE RALLY: `_buildCacti(m4)` in `src/world/flora.js` at the
// repository root, species SAGUARO — "capsule trunk + two elbow arms".
//
// CAPSULES, NOT CYLINDERS, and that is the whole port. A saguaro is a ribbed
// column with a ROUNDED TOP; a cylinder with a flat lid is a length of pipe
// standing in the sand, and at the distance a cactus is actually seen from,
// the top of it is most of what you get. v1's five capsules also sit at five
// different heights and radii — the two arms are NOT a mirrored pair, which is
// what this file had (`arm(1)` and `arm(-1)`, same numbers, opposite sign).
// v1's right arm is taller and thicker than its left, and every saguaro then
// gets a random yaw, so a field of them never lines up.
//
// WHAT CAME ACROSS: v1's five capsule radii, lengths and centres, its elbow
// construction (a capsule laid over on its side to bridge trunk to arm), its
// flat shading, and its colour band — `setHSL(0.30 + r*0.06, 0.35 + r*0.15,
// 0.22 + r*0.12)`, one colour for the whole plant rather than the two
// hard-coded greens that were here.
//
// TWO DELIBERATE CHANGES:
//
//   1. EVERY LENGTH IS v1'S x 0.70. v1's saguaro is 4.6 m at scale 1 and this
//      component was 3.2 m; 4.6 x 0.70 = 3.22, so the port keeps the height
//      the tracks in `src/data/tracks/` are already scattering at instead of
//      making every desert 44% taller. v1's numbers are written out at each
//      use so they stay readable.
//   2. THE CAPS ARE COARSER THAN v1'S. v1 builds all five at 4 cap segments
//      and 8 radial, and its own comment measures the result: "a saguaro is
//      1,360 tris (five 272-tri capsules)". That is eight times what this
//      component cost and it buys smoothness on a flat-shaded object. The
//      trunk keeps a proper 2-segment dome at 8 radial (144 tris) because it
//      is the piece you look at; the arms take 2 and 1 segments at 6 radial.
//      MEASURED: 480 triangles, against 168 before and v1's 1,360.

import * as THREE from 'three';
import { PropTemplate, PlaceCtx, standard, mergeGeoms } from './types';

/** v1's scale factor — see note 1 in the header. */
const K = 0.70;

/** Per-instance value from POSITION, not `ctx.rng` — same hash and the same
 *  reason as `pine.ts`: the trunk and both arms are three separate parts and
 *  they have to come out the same green. */
function siteHash(c: PlaceCtx, salt: number): number {
  const n = Math.sin(c.x * 12.9898 + c.z * 78.233 + salt * 37.719) * 43758.5453;
  return n - Math.floor(n);
}

/** One capsule of the plant. `across` lays it on its side, which is v1's
 *  elbow: the horizontal run that carries an arm out from the trunk before it
 *  turns up. */
function limb(r: number, len: number, capSeg: number, radialSeg: number,
  x: number, y: number, across = false): THREE.CapsuleGeometry {
  const g = new THREE.CapsuleGeometry(r, len, capSeg, radialSeg);
  if (across) g.rotateZ(Math.PI / 2);
  g.translate(x, y, 0);
  return g;
}

/** v1's cactus colour: one band for the whole plant, per instance. */
const green = (c: PlaceCtx) => new THREE.Color().setHSL(
  0.30 + siteHash(c, 1) * 0.06,
  0.35 + siteHash(c, 2) * 0.15,
  0.22 + siteHash(c, 3) * 0.12,
);

const cactus: PropTemplate = {
  id: 'cactus',
  name: 'Saguaro',
  category: 'flora',
  description: 'Desert column with two uneven arms, rounded at every tip. Solid stem.',

  build: () => [
    {
      key: 'trunk',
      geometry: limb(0.5 * K, 3.6 * K, 2, 8, 0, 2.3 * K),
      material: standard(0xffffff),
      castShadow: true,
      tint: green,
    },
    {
      // v1's right arm: the tall one. Up-arm plus the elbow that carries it
      // out of the trunk, merged so the side is one draw call.
      key: 'arms',
      geometry: mergeGeoms([
        limb(0.3 * K, 1.5 * K, 2, 6, 1.05 * K, 3.5 * K),
        limb(0.3 * K, 0.9 * K, 1, 6, 0.6 * K, 2.75 * K, true),
      ]),
      material: standard(0xffffff),
      castShadow: true,
      tint: green,
    },
    {
      // and v1's left arm: shorter, thinner, and set lower down the stem.
      key: 'armsB',
      geometry: mergeGeoms([
        limb(0.28 * K, 1.1 * K, 2, 6, -0.95 * K, 3.0 * K),
        limb(0.28 * K, 0.75 * K, 1, 6, -0.55 * K, 2.4 * K, true),
      ]),
      material: standard(0xffffff),
      castShadow: true,
      tint: (c) => green(c).multiplyScalar(0.94),
    },
  ],

  physics: {
    // 0.36 rather than the 0.4 this carried: v1's trunk capsule is 0.35 m in
    // radius at this scale, and a collider wider than the plant stops a car in
    // clear sand beside it.
    shape: (s) => ({ kind: 'cylinder', halfHeight: 1.6 * s, radius: 0.36 * s, centerY: 1.6 * s }),
    solid: true,
    // COVERAGE — the stem. The arms are above a bonnet and would not stop one anyway.
    coverage: 'trunk',
    massKg: 700,
  },

  authoring: {
    scale: [0.8, 1.5], defaultScale: 1,
    avoidSurfaces: ['snow', 'ice', 'mud', 'tarmac'], minRoadDist: 10, randomYaw: true,
  },
};

export default cactus;
