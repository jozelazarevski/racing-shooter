// BOAT SHED — a timber boathouse with its water-facing end open, and the
// haul-out rails running out of it onto the hard.
//
// NO v1 EQUIVALENT. `catalog.js` has eighteen dwelling archetypes and a barn,
// none of which is open at one end, and the marina builds pontoons and a
// slipway but nothing to keep a boat in. Built in the library's idiom on the
// port's own timbers: the jetty deck's 0x8a6a44 for the boarding and the pile
// timber 0x5f4a30 for the frame, so a shed and the jetty in front of it are cut
// from the same wood.
//
// SIZED OFF THE BOAT, not off a house. v1's hull is 9.4 m long and 3.1 m in the
// beam, and every floating component in this library is that hull at a scale —
// so the shed is 11 m deep and 6.4 m wide inside, which houses the full-size
// one with room to walk down one side of it. For scale against a car: 1.6
// car-lengths deep, three cars wide.
//
// OPEN ALONG +Z, like the jetty runs out along +Z. Rotate it to face the water.
// The gable ABOVE the opening stays closed — a boat shed is a doorway to the
// eaves, not a shed with the front wall left off.

import * as THREE from 'three';
import { PropTemplate, standard, beam } from './types';
import { bundle, gablePrismGeo } from '../../templates/geometry';

const HW = 3.2;               // half-width — 6.4 m clear inside
const LEN = 11;               // z from -5.5 (closed) to +5.5 (open)
const EAVE = 3.2;
const RISE = 1.7;             // ridge at 4.9
const SL = Math.hypot(HW, RISE);
const ANG = Math.atan2(RISE, HW);

/** A gable end: the prism's triangular cross-section lies in its own Z-Y plane,
 *  so it has to be turned a quarter turn to face down +Z. Rotating rather than
 *  writing a fresh triangle soup keeps the roof pitch on ONE number — a gable
 *  cut by hand to a slightly different angle from the roof over it is a seam of
 *  daylight along the ridge that nobody finds until a screenshot. */
function gableEnd(z: number): THREE.BufferGeometry {
  return gablePrismGeo().scale(0.14, RISE, HW * 2).rotateY(Math.PI / 2).translate(0, EAVE, z);
}

function frame(): THREE.BufferGeometry[] {
  const out: THREE.BufferGeometry[] = [];
  for (const sx of [-1, 1]) {
    // sill, eaves plate, and posts at the corners with two between
    out.push(beam(0.22, 0.2, LEN, sx * HW, 0.1, 0));
    out.push(beam(0.18, 0.22, LEN, sx * HW, EAVE - 0.11, 0));
    for (const z of [-5.4, -1.8, 1.8, 5.4]) {
      out.push(beam(0.22, EAVE, 0.22, sx * HW, EAVE / 2, z));
    }
  }
  // ridge beam, and the lintel over the opening — the head of the doorway is
  // what stops the open end reading as a wall that fell off
  out.push(beam(0.18, 0.24, LEN + 0.4, 0, EAVE + RISE - 0.12, 0));
  out.push(beam(HW * 2, 0.3, 0.24, 0, EAVE - 0.15, 5.4));
  return out;
}

function boarding(): THREE.BufferGeometry[] {
  const out: THREE.BufferGeometry[] = [];
  for (const sx of [-1, 1]) {
    out.push(beam(0.12, EAVE - 0.2, LEN - 0.3, sx * HW, 0.2 + (EAVE - 0.2) / 2, 0));
    // three rails proud of the boarding: flat-shaded 11 m of unbroken plank
    // takes one light value down its whole length and reads as sheet metal
    for (const y of [0.75, 1.75, 2.75]) out.push(beam(0.07, 0.16, LEN - 0.3, sx * (HW + 0.08), y, 0));
  }
  out.push(beam(HW * 2 - 0.3, EAVE - 0.2, 0.12, 0, 0.2 + (EAVE - 0.2) / 2, -5.5));
  out.push(gableEnd(-5.5));
  out.push(gableEnd(5.5));
  return out;
}

const boatShed: PropTemplate = {
  id: 'boatShed',
  name: 'Boat shed',
  category: 'marine',
  description: 'Timber boathouse 6.6 x 11 m, open along +Z, with haul-out rails. Solid.',

  build: () => [
    {
      key: 'boarding',
      geometry: bundle(boarding()),
      material: standard(0x8a6a44, { roughness: 1 }),
      castShadow: true,
      tint: (c) => new THREE.Color(0x8a6a44).offsetHSL(0, c.rng.centered(0.04), c.rng.centered(0.06)),
    },
    { key: 'frame', geometry: bundle(frame()), material: standard(0x5f4a30, { roughness: 1 }), castShadow: true },
    {
      key: 'roof',
      // Two planes, each posed by rotating a slab about Z at the pitch and
      // sliding it down-slope by half its overhang — so the eaves oversail by
      // 0.35 and neither plane pokes out through the other at the ridge, which
      // is what you get from simply making both of them longer.
      geometry: bundle([-1, 1].map((sg) => beam(
        SL + 0.35, 0.14, LEN + 0.6,
        sg * (HW / 2 + 0.175 * Math.cos(ANG)),
        EAVE + RISE / 2 - 0.175 * Math.sin(ANG),
        0, 0, 0, -sg * ANG,
      ))),
      material: standard(0x54514b, { roughness: 0.95 }),
      castShadow: true,
    },
    {
      key: 'rails',
      // The haul-out road: two greased baulks running the length of the shed
      // and 4 m out through the opening onto the hard. They are the reason the
      // building faces the water, and they cost four boxes.
      geometry: bundle([-1, 1].flatMap((sx) => [
        beam(0.22, 0.16, LEN + 4, sx * 1.15, 0.08, 2),
        beam(0.3, 0.09, LEN + 4, sx * 1.15, 0.02, 2),
      ])),
      material: standard(0x6b5638, { roughness: 0.9 }),
    },
  ],

  physics: {
    // The building, to the ridge. The rails run 4 m out past the open end and
    // are 0.16 m proud of the ground — you drive over those, and a collider
    // that included them would have to be centred on the origin like every
    // other one, so it would put 4 m of invisible box behind the shed as well.
    shape: (s) => ({
      kind: 'box',
      halfExtents: [(HW + 0.1) * s, ((EAVE + RISE) / 2) * s, (LEN / 2) * s],
      centerY: ((EAVE + RISE) / 2) * s,
    }),
    solid: true,
    massKg: 22000,
  },

  authoring: {
    scale: [0.9, 1.15], defaultScale: 1,
    placement: 'shore', shoreBand: 10,
    minRoadDist: 11, randomYaw: false, previewDist: 26,
  },
};

export default boatShed;
