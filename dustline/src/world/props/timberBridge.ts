// TIMBER BRIDGE — a plank deck on trestles. Deck runs along +Z, same axis
// convention as `stoneBridge`, so the two are interchangeable over a gully.
//
// SHAPE FROM IGNITE RALLY: `Track._buildBridges` (`src/track.js` 8554) for the
// structure and `Track._buildHeroBridge` (3405) for the deck. Sections ported
// verbatim:
//
//   plank baulk     deckW x 0.22 x 1.15, laid every ~1.5 u   (hero bridge)
//   deck slab       0.35 thick, under-beams 0.28 x 0.5       (_buildBridges)
//   trestle leg     CylinderGeometry(0.16, 0.26, drop, 6), splayed +/-1
//   cross brace     0.16 x 0.16 x 2.5
//   rope rail       r 0.055, at deck + 0.6 and deck + 1.1
//   rail post       CylinderGeometry(0.09, 0.11, 1.25, 6) every 3.4
//   timber          0x6a4a2c, rope 0x8a7048
//
// THE WIDTH IS NOT PORTED. v1's deck is 3.2 m across — that bridge is a
// footbridge its cars are never on, and its own repair comment ("hanging
// bridges are flying") is about supports, not width. A 1.9 m car on a 3.2 m
// deck is a stunt, so the deck goes to 15 m: dustline's 14 m road plus a
// half-metre of margin each side before the rail. Every SECTION above is v1's;
// only how many of them there are is not.
//
// v1's other lesson is taken whole: "A structure is either supported or it is
// not there — it is never floating." Both bents and the mid bent run down to
// y = 0, and the legs are cut long so a bank that dips under one of them does
// not leave the bridge on tiptoe.

import * as THREE from 'three';
import { PropTemplate, standard, mergeGeoms, beam } from './types';
import { strut } from '../../templates/geometry';

const HALF_X = 7.5;          // 15 m deck
const LEN_Z = 24;            // span, end to end
const DECK_TOP = 4.0;        // over a gully deep enough to need a bridge
const PLANK_T = 0.22;        // v1 hero-bridge baulk
const RAIL_X = 7.15;

/** The plank field. v1 lays discrete baulks rather than one ribbon; its reason
 *  there is z-fighting against the road mesh underneath, which does not apply
 *  to a free-standing deck — but the reading does. A flat slab is a table, and
 *  the shadow lines between baulks are most of what says timber. Pitch is
 *  tightened from 1.5 to 1.2 so the gaps are joints and not holes. */
function planks(): THREE.BufferGeometry[] {
  const out: THREE.BufferGeometry[] = [];
  const PITCH = 1.2, N = Math.round(LEN_Z / PITCH);
  for (let i = 0; i < N; i++) {
    const z = -LEN_Z / 2 + (i + 0.5) * PITCH;
    out.push(beam(HALF_X * 2, PLANK_T, 1.16, 0, DECK_TOP - PLANK_T / 2, z));
  }
  return out;
}

/** One trestle bent: four legs splayed off the vertical, plus v1's cross
 *  brace. v1 splays its pair "lean * -0.05" and says why — "a single post
 *  under a 25 u span reads as a stilt, not a trestle" — so the feet are
 *  pushed out rather than dropped straight down. Built with `strut` from real
 *  endpoints, which is the kit helper that exists precisely so posed legs stop
 *  being an Euler-angle guess. */
function bent(z: number): THREE.BufferGeometry[] {
  const head = DECK_TOP - 0.55;
  const out: THREE.BufferGeometry[] = [];
  for (const sx of [-1, 1]) {
    for (const k of [0, 1]) {
      const top = sx * (2.6 + k * 4.1);
      const foot = top + sx * 0.55;                 // splayed, v1's lean
      out.push(strut([top, head, z], [foot, -0.6, z], 0.21, 6));
    }
  }
  // v1's brace, one per bent, at 55% of the drop
  out.push(beam(HALF_X * 2 - 1.2, 0.16, 0.16, 0, head * 0.45, z));
  out.push(beam(0.4, 0.5, 1.0, 0, head - 0.25, z));   // cap sill under the stringers
  return out;
}

const timberBridge: PropTemplate = {
  id: 'timberBridge',
  name: 'Timber bridge',
  category: 'structure',
  description: '24 m plank deck on three trestles, 15 m wide. Runs along +Z. Solid deck.',

  build: () => [
    {
      key: 'deck',
      geometry: mergeGeoms([
        ...planks(),
        // four stringers under the baulks — v1's 0.28 x 0.5 under-beam, one
        // pair per wheel track plus the edges
        ...[-6.6, -2.4, 2.4, 6.6].map((x) => beam(0.5, 0.45, LEN_Z, x, DECK_TOP - PLANK_T - 0.225, 0)),
      ]),
      material: standard(0x8a6a44, { roughness: 1 }),
      castShadow: true,
      tint: (c) => new THREE.Color(0x8a6a44).offsetHSL(0, c.rng.centered(0.03), c.rng.centered(0.06)),
    },
    {
      key: 'trestles',
      geometry: mergeGeoms([-9.6, 0, 9.6].flatMap((z) => bent(z))),
      material: standard(0x6a4a2c, { roughness: 0.8 }),   // v1's woodMat
      castShadow: true,
    },
    {
      key: 'rails',
      geometry: mergeGeoms([-1, 1].flatMap((sg) => [
        // v1 spaces its rail posts 3.4 apart and stands them 1.25 tall
        ...Array.from({ length: Math.floor(LEN_Z / 3.4) + 1 }, (_, i) =>
          beam(0.2, 1.25, 0.2, sg * RAIL_X, DECK_TOP + 0.625, -LEN_Z / 2 + 0.9 + i * 3.4)),
        // and runs two ropes, at deck + 0.6 and deck + 1.1
        beam(0.13, 0.13, LEN_Z, sg * RAIL_X, DECK_TOP + 0.6, 0),
        beam(0.13, 0.13, LEN_Z, sg * RAIL_X, DECK_TOP + 1.1, 0),
      ])),
      material: standard(0x8a7048, { roughness: 1 }),      // v1's ropeMat
      castShadow: true,
    },
  ],

  physics: {
    // The deck slab, exactly as `jetty.ts` and `stoneBridge.ts` do it: a thin
    // box whose TOP face is the running surface, so the car drives onto the
    // bridge instead of into it, and the space under the deck stays empty.
    // A block from the gully floor to the planks would collide with the car
    // long before it reached the trestle it is pretending to be.
    //
    // The legs and the rails get nothing. The rails are rope on 0.2 m posts —
    // they would not hold a car back in life and pretending otherwise turns a
    // 15 m deck into a 14.3 m one with invisible sides.
    shape: (s) => ({
      kind: 'box',
      halfExtents: [HALF_X * s, 0.24 * s, (LEN_Z / 2) * s],
      centerY: (DECK_TOP - 0.24) * s,
    }),
    solid: true,
    massKg: 74000,
  },

  authoring: {
    scale: [0.9, 1.15], defaultScale: 1,
    minRoadDist: 0, randomYaw: false,
  },
};

export default timberBridge;
