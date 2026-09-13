// STONE BRIDGE — a single-span masonry arch with parapets. Deck runs along +Z,
// so the car drives up its own +Z and the arch spans across underneath.
//
// SHAPE FROM IGNITE RALLY: `Track._buildStoneBridges` (`src/track.js` 5735).
// The section is its, verbatim:
//
//   parapet walls   1.1 wide x 1.6 high, the length of the span
//   arch masonry    2.2 x 9 x 3.2 blocks descending under the deck
//   stone           0x9a9188, flat shaded, roughness 1
//
// THE LATERAL OFFSETS ARE NOT PORTED, and that is deliberate. v1 puts its
// parapets at 10.6 from the centreline because v1's road is 18 m wide with its
// barrier line at WALL_OFF = 10.4 (`src/world/constants.js`). dustline's road
// is 14 m (`road.halfWidth: 7`), so a verbatim 10.6 would leave a 7 m gutter
// of bridge outside the carriageway on each side. The parapets sit at 7.55
// instead — inner face exactly on the road edge, 14.0 m clear between them,
// deck 16.2 m overall. Everything vertical is v1's.
//
// v1 raises the road 1.5 m through the crossing and lets the ground fall away;
// a placeable component cannot move the terrain, so it carries its own
// masonry down to y = 0 and the arch springs from the bed.

import * as THREE from 'three';
import { PropTemplate, standard, mergeGeoms, beam } from './types';
import { voussoirRing } from './culvert';

const HALF_X = 8.1;          // deck half-width: 14 m of road plus its parapets
const LEN_Z = 26;            // one span, end to end
const ARCH_HALF = 9;         // half the clear opening, along the deck
const RISE = 3.6;            // segmental, not semicircular — a road arch is flat
const RING_T = 0.8;          // voussoir depth
const DECK_UNDER = RISE + RING_T;   // 4.4 — the extrados crown IS the deck soffit
const DECK_T = 0.6;
const DECK_TOP = DECK_UNDER + DECK_T;   // 5.0

/** The spandrel: the masonry between the arch's back and the deck.
 *
 *  Built as vertical columns whose feet sit on the extrados, which is what
 *  gives the bridge an arched SILHOUETTE rather than an arch-shaped hole in a
 *  box. Each column's foot takes the LOWER of the extrados height at its two
 *  edges, so it overlaps the ring instead of leaving a crescent of daylight
 *  between them — a gap here reads as a crack right through the bridge. */
function spandrel(): THREE.BufferGeometry[] {
  const a = ARCH_HALF + RING_T, b = RISE + RING_T;
  const ext = (z: number) => b * Math.sqrt(Math.max(0, 1 - (z / a) ** 2));
  const COLS = 18;
  const pitch = (a * 2) / COLS;
  const out: THREE.BufferGeometry[] = [];
  for (let i = 0; i < COLS; i++) {
    const z0 = -a + i * pitch, z1 = z0 + pitch;
    const foot = Math.min(ext(z0), ext(z1));
    const h = DECK_UNDER - foot;
    if (h < 0.05) continue;
    out.push(beam(HALF_X * 2, h, pitch * 1.04, 0, foot + h / 2, (z0 + z1) / 2));
  }
  return out;
}

const stoneBridge: PropTemplate = {
  id: 'stoneBridge',
  name: 'Stone bridge',
  category: 'structure',
  description: '26 m masonry arch, 14 m between parapets. Deck runs along +Z. Solid deck.',

  build: () => [
    {
      key: 'masonry',
      geometry: mergeGeoms([
        // the barrel: one ring of voussoirs the full width of the bridge. Built
        // in the culvert's XY convention and quarter-turned, because there the
        // stream runs through the arch and here the ROAD runs over it.
        ...voussoirRing(ARCH_HALF, RISE, RING_T, HALF_X * 2, 21).map((g) => g.rotateY(Math.PI / 2)),
        ...spandrel(),
        // abutments beyond the springing, carrying the deck onto the banks
        ...[-1, 1].map((sg) => beam(HALF_X * 2, DECK_UNDER, 3.2, 0, DECK_UNDER / 2, sg * 11.4)),
        // cornice: the projecting band under the deck. v1 has none — it never
        // sees its bridges side-on — but without it the deck edge and the
        // spandrel are one flat face and the whole thing reads as a ramp.
        beam(HALF_X * 2 + 0.8, 0.3, LEN_Z + 0.4, 0, DECK_UNDER - 0.15, 0),
        beam(HALF_X * 2, DECK_T, LEN_Z, 0, DECK_UNDER + DECK_T / 2, 0),
      ]),
      material: standard(0x9a9188, { roughness: 1 }),   // v1's stone, verbatim
      castShadow: true,
      tint: (c) => new THREE.Color(0x9a9188).offsetHSL(0, c.rng.centered(0.02), c.rng.centered(0.05)),
    },
    {
      key: 'parapets',
      geometry: mergeGeoms([
        // v1's 1.1 x 1.6 parapet wall, run the length of the span
        ...[-1, 1].flatMap((sg) => [
          beam(1.1, 1.6, LEN_Z, sg * 7.55, DECK_TOP + 0.8, 0),
          beam(1.3, 0.18, LEN_Z, sg * 7.55, DECK_TOP + 1.69, 0),      // coping
        ]),
      ]),
      material: standard(0xa8a094, { roughness: 1 }),
      castShadow: true,
    },
  ],

  physics: {
    // THE DECK IS THE COLLIDER, AND IT IS A SLAB, NOT A BLOCK.
    //
    // Same problem `jetty.ts` solves and the same answer: a box filling the
    // bridge from the bed to the roadway is a solid lump of stone with the
    // road on top of it, so the car meets a 5 m wall at the abutment instead
    // of driving on. The collider is the deck slab only — 0.6 m thick, its top
    // face at 5.0 — and the arch below it stays open, which is the whole point
    // of an arch. The car ramps onto the deck exactly as it ramps onto the
    // jetty.
    //
    // WHAT THIS COSTS: the parapets are not solid, so you can drive off the
    // side. One convex shape per component, and a deck you fall THROUGH is a
    // far worse bug than a parapet you drive through — guardrails are their
    // own component if a span needs to be fenced.
    shape: (s) => ({
      kind: 'box',
      halfExtents: [HALF_X * s, (DECK_T / 2) * s, (LEN_Z / 2) * s],
      centerY: (DECK_UNDER + DECK_T / 2) * s,
    }),
    solid: true,
    massKg: 3200000,
  },

  authoring: {
    scale: [0.9, 1.15], defaultScale: 1,
    minRoadDist: 0, randomYaw: false,
  },
};

export default stoneBridge;
