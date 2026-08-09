// SLIPWAY — a concrete ramp running from the hard down into the water. How a
// boat gets out of the harbour and onto a trailer, and the only place on a
// quayside where the land meets the sea at a gradient instead of a wall.
//
// SHAPE FROM IGNITE RALLY: the docking ramp at the end of `Track._buildMarina`
// in `src/track.js`, verbatim — its own numbers and its own comment:
//
//   "the slipway: from the quay lip down under the water, corners placed
//    explicitly so the top meets the ground and the bottom meets the seabed"
//
//   const du = -SPAN * 0.34, HW = 4.5;
//   const a = P(du - HW, -7), b = P(du + HW, -7);
//   const c = P(du + HW, 13), d = P(du - HW, 13);
//   ... quad([a, ty], [b, ty], [c, y - 1.9], [d, y - 1.9], conc)
//
// So: 9 m wide, from 7 m up the hard to 13 m out into the water, falling from
// ground + 0.12 to sea level - 1.9. That is a 1 in 10 fall, which is a real
// slipway gradient, and the reason those numbers are kept rather than rounded.
//
// Z = 0 IS THE WATERLINE, exactly as v1's `dn = 0` is the drawn coastline
// rather than wherever the heightfield happens to cross it — v1 has a long
// comment about that distinction costing it a quay's worth of ankle-deep
// bollards. A `shore` component's origin lands on the ground at the water's
// edge, which is the same anchor, so the slab runs -7 to +13 about it.
//
// CORNERS, NOT A PITCH EULER. That is v1's rule for this exact geometry, and
// the file records what it cost: "the Euler order trap has cost this file three
// bugs". The ramp is built from where it starts and stops.

import * as THREE from 'three';
import { PropTemplate, standard } from './types';
import { bundle, quad, soup } from './kit';

const HW = 4.5;        // v1's half-width
const Z0 = -7;         // up the hard
const Z1 = 13;         // out into the water
const TOP = 0.12;      // v1: terrainHeight + 0.12
const BOT = -1.9;      // v1: sea level - 1.9
const THICK = 0.35;    // v1 draws a single double-sided quad; see below

/** An extruded quad: four top corners with a slab `thick` below them, closed.
 *
 *  v1 gets away with one `THREE.DoubleSide` triangle pair because its ramp is
 *  laid onto terrain and never seen edge-on. A component is previewed from an
 *  arbitrary angle and casts shadows, and a zero-thickness ramp seen from the
 *  side is a line. So the same four corners are extruded into a closed slab —
 *  the deck is v1's, the soffit and the four cheeks are the thickness it
 *  implies. */
function rampSlab(top: number[][], thick: number): THREE.BufferGeometry {
  const low = top.map((p) => [p[0], p[1] - thick, p[2]]);
  const v: number[] = [];
  quad(v, top[0], top[1], top[2], top[3]);              // deck
  quad(v, low[3], low[2], low[1], low[0]);              // soffit, wound the other way
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4;
    quad(v, top[i], low[i], low[j], top[j]);            // cheeks
  }
  return soup(v);
}

/** The ramp surface at a given z, so the kerbs sit ON the ramp rather than
 *  running through it — the one number both parts have to agree on. */
const rampY = (z: number) => TOP + ((z - Z0) / (Z1 - Z0)) * (BOT - TOP);

const slipway: PropTemplate = {
  id: 'slipway',
  name: 'Slipway',
  category: 'marine',
  description: '9 x 20 m concrete ramp into the water, 1 in 10. Runs down along +Z. Not solid — you drive on it.',

  build: () => [
    {
      key: 'ramp',
      geometry: rampSlab([
        [-HW, TOP, Z0], [-HW, BOT, Z1], [HW, BOT, Z1], [HW, TOP, Z0],
      ], THICK),
      material: standard(0x9a9484, { roughness: 1 }),
      castShadow: true,
      tint: (c) => new THREE.Color(0x9a9484).offsetHSL(0, 0, c.rng.centered(0.05)),
    },
    {
      key: 'kerbs',
      // Edge kerbs, which v1 has not got. Without them a 9 x 20 m grey
      // rectangle on a grey quay has no edge to it at all, and the thing a
      // slipway must read as from the driving seat is a gap in the quay wall.
      //
      // Both kerbs are written from their LOW x edge, in the same order as the
      // deck. Mirroring a corner list by flipping the sign of x reverses its
      // winding, which gives you one kerb solid and the other one inside out —
      // and inside out under flat shading is not obviously wrong, it is just
      // dark, which is worse.
      geometry: bundle([-HW, HW - 0.45].map((x0) => rampSlab([
        [x0, rampY(Z0) + 0.22, Z0], [x0, rampY(Z1) + 0.22, Z1],
        [x0 + 0.45, rampY(Z1) + 0.22, Z1], [x0 + 0.45, rampY(Z0) + 0.22, Z0],
      ], 0.5))),
      material: standard(0x8e887a, { roughness: 1 }),
      castShadow: true,
    },
  ],

  physics: {
    // NOT SOLID, AND THAT IS THE POINT OF A RAMP. The collider vocabulary here
    // is boxes, cylinders and balls — none of which is a 1 in 10 slope, and a
    // box round this slab is a 2 m wall across the bottom of the very thing you
    // are meant to drive down. The slab is never more than 0.35 m off the
    // ground it is laid on, so the terrain under it carries the car, which is
    // exactly what happens on the real thing.
    shape: () => ({ kind: 'none' }),
    solid: false,
    massKg: 150000,
  },

  authoring: {
    scale: [0.9, 1.15], defaultScale: 1,
    placement: 'shore', shoreBand: 3,
    minRoadDist: 8, randomYaw: false, previewDist: 34,
  },
};

export default slipway;
