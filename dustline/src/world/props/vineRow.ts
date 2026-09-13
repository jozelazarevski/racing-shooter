// VINE ROW — one 8.1 m bay of trained vines on wire. The unit a vineyard is
// TILED from: rows step 2.9 m apart across local X and butt end to end along
// local Z, which is the axis this component runs down. Everything in the
// vineyard set (trellis post, terrace wall) uses the same +Z convention, so a
// parcel is one rotation applied to a grid of them.
//
// SHAPE FROM IGNITE RALLY: `_buildVineRows()` in `src/track.js` at the
// repository root.
//
// What did NOT come across is the siting. v1 builds a whole hillside parcel in
// one pass — a master contour walked along the local fall line, every row an
// offset curve of it so rows cannot converge or braid — and that is a track
// generator's job, not a component's. A dustline component is one object; the
// contour is the track author's (or a future scatter layer's) problem.
//
// What DID come across is the panel, which is the part you actually read from
// the driving seat, at v1's numbers: SEG = 2.7 m panel length, SPACING = 2.9 m
// row pitch, a strip of tilled soil the full width of that pitch, a canopy
// 1.15 m wide standing from 0.44 m up, ~1.0–1.3 m of it, and trellis posts
// 1.8–2.0 m tall so they stand proud of the leaf. Chest high, not tree high:
// the canopy top sits at about 1.6 m, which is bonnet-and-a-bit on a car
// 1.9 m wide.

import * as THREE from 'three';
import { PropTemplate, standard, mergeGeoms, beam } from './types';

/** Bay length, from v1's SEG. Three of them make the row. */
const BAY = 2.7;
/** Row pitch, from v1's SPACING — the tilled strip is the full width of it. */
const PITCH = 2.9;
/** Bay centres along +Z. */
const BAYS = [-BAY, 0, BAY];
/** Post stations along +Z: one at each bay joint, ends included. */
const POSTS = [-4.05, -1.35, 1.35, 4.05];

const vineRow: PropTemplate = {
  id: 'vineRow',
  name: 'Vine row',
  category: 'flora',
  description: 'Trained vines on wire, 8.1 m along +Z. Dressing — plough straight through.',

  // Fresh geometry every call: `beam` and `.translate()` mutate in place, so a
  // hoisted module-scope geometry would be translated again on a second build.
  build: () => [
    {
      key: 'soil',
      // Tilled soil the full width of the row pitch, so tiled rows leave no
      // green gap between them. v1 sinks it 0.02 into the ground; here the
      // component's base IS the ground, so it just sits on top.
      geometry: beam(PITCH * 0.99, 0.08, BAY * 3 * 1.02, 0, 0.04, 0),
      material: standard(0xffffff),
      tint: (c) => new THREE.Color().setHSL(0.072, 0.36, 0.19 + c.rng.float() * 0.05),
    },
    {
      key: 'canopy',
      // Per-bay height jitter, fixed rather than random: the ragged top line is
      // v1's, but it has to be the same ragged line in every copy of this
      // geometry, because all instances share one buffer.
      geometry: mergeGeoms(BAYS.map((z, i) => {
        const h = [1.06, 1.26, 1.12][i];
        return beam(1.15, h, BAY * 1.02, 0, 0.44 + h / 2, z);
      })),
      material: standard(0xffffff),
      castShadow: true,
      // v1's parcel varietal: one hue per block, jittered per panel. A whole
      // vineyard drawn from one component gets its variation per instance
      // instead, which is the same read from the road.
      tint: (c) => new THREE.Color().setHSL(
        0.245 + c.rng.float() * 0.045,
        0.5 + c.rng.float() * 0.14,
        0.17 + c.rng.float() * 0.06,
      ),
    },
    {
      key: 'trellis',
      // Posts and the two training wires in one part — same timber tone, and a
      // separate InstancedMesh for four sticks is a draw call for nothing.
      geometry: mergeGeoms([
        ...POSTS.map((z) => beam(0.2, 1.9, 0.2, 0, 0.95, z)),
        beam(0.035, 0.035, 8.1, 0, 0.72, 0),   // fruiting wire, under the canopy
        beam(0.035, 0.035, 8.1, 0, 1.72, 0),   // catch wire, above it
      ]),
      material: standard(0x7a5836, { roughness: 1 }),
      castShadow: true,
    },
  ],

  // NOT SOLID, and this is v1's own ruling, in its own words: a trellis panel
  // is "wire and leaf, not masonry". At pace you plough a gap through the row;
  // the row does not shoulder a rally car off its line. When M4 brings
  // destructible scenery this and the crop row are the obvious first customers,
  // because the gap you carve should be the width of the car and no more.
  physics: { shape: () => ({ kind: 'none' }), solid: false, massKg: 300 },

  authoring: {
    // Narrow scale range on purpose. Vines are a managed crop: a parcel of
    // rows at wildly different sizes reads as scrub, and neighbouring tiles
    // stop lining up at their ends.
    scale: [0.95, 1.08], defaultScale: 1,
    avoidSurfaces: ['tarmac', 'ice', 'snow'],
    minRoadDist: 12,
    // Never random. A vineyard's whole identity is that every row is parallel
    // to every other row; yawing them independently is the "hoses dropped on
    // the grass" failure v1 records from its third attempt at this.
    randomYaw: false,
  },
};

export default vineRow;
