// PINE — the forest tree.
//
// SHAPE FROM IGNITE RALLY: `_buildForest(m4)` in `src/world/flora.js` at the
// repository root, species `pineB` — the three-tier conifer, not the two-tier
// `pineA` this file was built from. v1 plants BOTH (its default mix is 0.55
// pineA / 0.45 pineB, and its own comment says the point is "several visually
// distinct species per world, not one silhouette with hue jitter"). dustline
// has one pine component and takes its variety from scale and yaw, so the pick
// is the richer of v1's two: three tiers instead of two, and every tier nudged
// off the trunk axis — +0.2/-0.16/+0.05 in x, -0.12/+0.12/-0.05 in z — so the
// tree stops being a stack of cones sharing a centreline. Getting v1's second
// conifer as well would mean a second component file, which is not this change.
//
// WHAT CAME ACROSS VERBATIM: v1's tier radii, heights, centre heights, lateral
// offsets and segment counts (7 for the trunk and the tiers, 8 for the cap),
// and the snow cap at v1's `capY` of 8.15. Also v1's two colour laws, which
// this file did not have: crown tiers DARKEN DOWNWARD and brighten at the top
// (`f = 0.85 + (ti-1)/(tiers-1) * 0.45`, so 0.85 / 1.075 / 1.3 over three
// tiers), and a trunk that is one of TWO wood tones rather than a continuum.
//
// TWO DELIBERATE CHANGES:
//
//   1. EVERY LENGTH IS v1'S x 0.75. This file was already v1's `pineA` at that
//      factor — v1 has trunk 0.35/0.5 x 2.4 and cones centred at 4.0 and 6.6,
//      topping out at 8.3 m; this had 0.22/0.34 x 1.8 and topped out at 6.25 m,
//      which is 0.735 of it — and the tracks in `src/data/tracks/` carry scale
//      layers tuned to that height. Porting v1's absolute numbers would have
//      made every existing forest a third taller for no reason anybody asked
//      for. K is written out at every use so v1's own numbers stay readable.
//      MEASURED AFTER THE PORT: 6.82 m at scale 1, against 6.25 m before.
//   2. THE PER-INSTANCE RANDOM IS A HASH OF POSITION, not `ctx.rng`. See
//      `siteHash` below — v1's tier law is a RELATIONSHIP between parts, and
//      `ctx.rng` cannot express one.
//
// TRIANGLES: 115 with the snow cap, 91 without (v1's 7-segment cones against
// the 10-segment ones this had), so the third tier arrives 9% CHEAPER than the
// two-tier version it replaces.

import * as THREE from 'three';
import { PropTemplate, PlaceCtx, cylinderAt, standard } from './types';

/** v1's scale factor — see note 1 in the header. */
const K = 0.75;

/** A per-instance number in [0, 1) taken from the instance's POSITION.
 *
 *  `ctx.rng` is no good for anything two parts have to agree on, and this is
 *  the file where that matters. `build.ts` writes ONE PART AT A TIME — every
 *  instance of the trunk, then every instance of the low tier, then the mid —
 *  so two `rng.float()` calls for what is visually the same tree are two
 *  unrelated draws off a shared stream, and a hue rolled per part gives one
 *  pine three unrelated greens stacked on top of each other. Position is
 *  stable, deterministic, and identical in every pass. The hash is the sin
 *  hash `craggy()` in `templates/geometry.ts` already uses, so the file does
 *  not introduce a second idiom for the same job. */
function siteHash(c: PlaceCtx, salt: number): number {
  const n = Math.sin(c.x * 12.9898 + c.z * 78.233 + salt * 37.719) * 43758.5453;
  return n - Math.floor(n);
}

/** v1's tier: a cone whose CENTRE sits at `cy`, nudged off the trunk axis.
 *  v1 writes these as `new ConeGeometry(r, h, seg)` followed by a translate,
 *  which moves the centre rather than the base — `coneAt` would move the base,
 *  so the cones are built the long way here to keep v1's numbers meaning what
 *  they mean in v1. */
function tier(r: number, h: number, seg: number, cy: number, x = 0, z = 0): THREE.ConeGeometry {
  const g = new THREE.ConeGeometry(r, h, seg);
  g.translate(x, cy, z);
  return g;
}

/** The needle colour for one instance, before the tier multiplier. */
function needles(c: PlaceCtx): THREE.Color {
  const snowy = c.surface === 'snow';
  return new THREE.Color().setHSL(
    0.33 + siteHash(c, 1) * 0.05, snowy ? 0.18 : 0.42, snowy ? 0.3 : 0.24,
  );
}

/** v1's tier law: the low tier sits in its own shade, the top catches the sun. */
const tierTint = (f: number) => (c: PlaceCtx) => needles(c).multiplyScalar(f);

const pine: PropTemplate = {
  id: 'pine',
  name: 'Pine',
  category: 'flora',
  description: 'Three-tier conifer with a snow cap above the snow line. Solid trunk.',

  build: () => [
    {
      key: 'trunk',
      geometry: cylinderAt(0.35 * K, 0.5 * K, 2.4 * K, 7, 0),
      material: standard(0x5a4028, { flatShading: false }),
      castShadow: true,
      // v1's TWO WOOD TONES, not a continuum: a stand reads as two ages of
      // timber rather than as one trunk with the brightness knob wobbling.
      tint: (c) => {
        const t = siteHash(c, 2) < 0.5 ? 1.0 : 0.78;
        return new THREE.Color(t, t * 0.96, t * 0.9);
      },
    },
    {
      key: 'low',
      geometry: tier(2.3 * K, 3.4 * K, 7, 3.6 * K, 0.2 * K, -0.12 * K),
      material: standard(0xffffff),
      castShadow: true,
      tint: tierTint(0.85),
    },
    {
      // THE TIER THIS TREE DID NOT HAVE. Two cones is a Christmas tree; three,
      // each one offset the other way, is a conifer that has grown toward the
      // light on one side.
      key: 'mid',
      geometry: tier(1.75 * K, 2.9 * K, 7, 5.6 * K, -0.16 * K, 0.12 * K),
      material: standard(0xffffff),
      castShadow: true,
      tint: tierTint(1.075),
    },
    {
      key: 'top',
      geometry: tier(1.15 * K, 2.6 * K, 7, 7.4 * K, 0.05 * K, -0.05 * K),
      material: standard(0xffffff),
      castShadow: true,
      tint: tierTint(1.3),
    },
    {
      // v1's cap geometry and v1's `capY` for pineB. It sits a little proud of
      // the leading tip, which is v1's number and reads as snow lying on the
      // crown rather than as a fourth tier.
      key: 'cap',
      geometry: tier(1.3 * K, 1.9 * K, 8, 8.15 * K),
      material: standard(0xf2f6fa, { roughness: 0.9 }),
      when: (c) => c.surface === 'snow',
    },
  ],

  physics: {
    // half-height 2.4, radius 0.42, centred 2.2 up — the trunk, not the canopy.
    // A collider around the foliage would stop a car a metre from the tree.
    shape: (s) => ({ kind: 'cylinder', halfHeight: 2.4 * s, radius: 0.42 * s, centerY: 2.2 * s }),
    solid: true,
    // COVERAGE — the trunk. You drive under a canopy, not into it.
    coverage: 'trunk',
    massKg: 900,
  },

  authoring: {
    scale: [0.8, 2.1],
    defaultScale: 1.3,
    avoidSurfaces: ['tarmac', 'mud', 'sand', 'ice'],
    minRoadDist: 11,
    randomYaw: true,

  },
};

export default pine;
