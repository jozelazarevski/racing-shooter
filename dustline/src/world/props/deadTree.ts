// DEAD TREE — bare trunk and limbs. Reads as a different biome from the
// pine without needing a new material set.
//
// SHAPE FROM IGNITE RALLY: `_buildCharredTrees(m4)` in `src/world/flora.js` at
// the repository root, species SNAG — "tall bare SNAGS with a few thin dark
// branches still attached": a trunk tapering 0.13 -> 0.34 over 4.8 m at 6
// segments, and three branches `b1`/`b2`/`b3` that are CONES rather than
// cylinders, at rotZ -0.95, rotZ +0.85 and rotX +0.9.
//
// TWO THINGS CAME ACROSS AND BOTH ARE ABOUT TAPER.
//
//   The branches taper TO A POINT. A dead limb is a spike; a cylinder of
//   constant radius with a flat sawn end on it is a scaffold pole, and this
//   file had two of them. v1's cones are also cheaper — 15 triangles against
//   the 24 a 6-sided cylinder costs.
//
//   The trunk tapers HARDER. v1's ratio is 0.13/0.34 = 0.38 top to bottom;
//   this had 0.16/0.36 = 0.44, near enough a post. 0.14/0.36 is v1's ratio on
//   the girth this component already had — see the change note below.
//
// And v1's THIRD BRANCH comes with them, the one that leans out of the x
// plane (rotX 0.9, offset +z). Two limbs in one plane is a silhouette that
// disappears when you drive past it side-on; three, one of them out of plane,
// does not.
//
// TWO DELIBERATE CHANGES:
//
//   1. BRANCH LENGTHS AND HEIGHTS ARE v1'S x 0.75, THEIR RADII ARE NOT. v1's
//      snag is 4.8 m and this component is 3.6 m, which is the same 0.75 the
//      pine port uses and for the same reason — the tracks already scatter
//      this at 3.6 m. Scaling the radii too would have given 7 cm branches on
//      a trunk keeping its full 0.36 m butt, which is a different tree. So the
//      girth is dustline's and the proportions are v1's.
//   2. NOT v1'S COLOUR. v1's snag tint is char — `setHSL(0.06 + r*0.03, 0.12 +
//      r*0.1, 0.08 + r*0.06)`, soot-black to ash-grey, because in v1 this
//      species only ever stands on a lava field. dustline scatters dead trees
//      on ordinary ground, and painting them all volcano-black would say
//      something about the world that is not true. The grey-brown here stays.
//
// MEASURED: 69 triangles against 84, 3.60 m tall against 3.96 (the old limbs
// stuck out of the top of the trunk), and the limbs now reach 1.08 m from the
// axis instead of 1.29 — which matters, because the collider is 0.68 m across
// and every centimetre of overhang is tree you can drive through.

import * as THREE from 'three';
import { PropTemplate, PlaceCtx, cylinderAt, standard, mergeGeoms } from './types';

/** v1's scale factor for the lengths — see note 1 in the header. */
const K = 0.75;

/** Per-instance value from POSITION, not `ctx.rng` — same hash and the same
 *  reason as `pine.ts`: trunk and limbs are two parts and have to weather to
 *  the same shade. */
function siteHash(c: PlaceCtx, salt: number): number {
  const n = Math.sin(c.x * 12.9898 + c.z * 78.233 + salt * 37.719) * 43758.5453;
  return n - Math.floor(n);
}

/** v1's branch: a cone rotated on one axis, with its CENTRE at (x, y, z). */
function branch(r: number, len: number, rz: number, rx: number,
  x: number, y: number, z: number): THREE.ConeGeometry {
  const g = new THREE.ConeGeometry(r, len, 5);
  if (rz) g.rotateZ(rz);
  if (rx) g.rotateX(rx);
  g.translate(x, y, z);
  return g;
}

const deadTree: PropTemplate = {
  id: 'deadTree',
  name: 'Dead tree',
  category: 'flora',
  description: 'Bare tapered trunk and three spike limbs. Solid, and cheap — two parts.',

  build: () => [
    {
      key: 'trunk',
      geometry: cylinderAt(0.14, 0.36, 4.8 * K, 6, 0),
      material: standard(0x6b5b47, { flatShading: false }),
      castShadow: true,
      // A SCALAR, NOT THE COLOUR AGAIN. Instance colour MULTIPLIES the
      // material's, so returning the material's own brown here — which is what
      // this file did — rendered 0x6b5b47 squared: a dead tree about a third as
      // bright as the one the palette says it is. v1's idiom for wood jitter is
      // `col.setScalar(0.8 + r*0.35)` and that is what this is.
      tint: (c) => new THREE.Color().setScalar(0.86 + siteHash(c, 1) * 0.28),
    },
    {
      // v1's three branches, merged: they share a material and a tint, so
      // three parts would have been three draw calls for one silhouette.
      key: 'limbs',
      geometry: mergeGeoms([
        branch(0.1, 2.0 * K, -0.95, 0, 0.62 * K, 3.2 * K, 0),
        branch(0.09, 1.6 * K, 0.85, 0, -0.55 * K, 2.6 * K, 0.1 * K),
        branch(0.08, 1.4 * K, 0, 0.9, 0, 3.7 * K, 0.5 * K),
      ]),
      material: standard(0x60513f, { flatShading: false }),
      castShadow: true,
      // the same scalar off the same hash, so trunk and limbs weather together
      tint: (c) => new THREE.Color().setScalar(0.86 + siteHash(c, 1) * 0.28),
    },
  ],

  physics: {
    shape: (s) => ({ kind: 'cylinder', halfHeight: 1.8 * s, radius: 0.34 * s, centerY: 1.8 * s }),
    solid: true,
    // COVERAGE — the bole. It was not declared before and should have been:
    // the collider is 0.68 m across on a tree whose limbs reach 2.1 m from
    // side to side, and a hitbox that wide would stop a car in clear air under
    // a branch you can see daylight through.
    coverage: 'trunk',
    massKg: 500,
  },

  authoring: {
    scale: [0.8, 1.6], defaultScale: 1.1, avoidSurfaces: ['tarmac', 'ice'], minRoadDist: 10,
    randomYaw: true,
  },
};

export default deadTree;
