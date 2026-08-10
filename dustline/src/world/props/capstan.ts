// CAPSTAN — the hand winch on the quay, for warping a boat alongside and for
// hauling anything up the slipway.
//
// NO v1 EQUIVALENT. `_buildQuayside` dresses its quay with bollards, barrels,
// crates and coiled line and stops there; the only winches in `track.js` are
// the pair of yacht sheet winches in the marina's deck gear
// (`CylinderGeometry(0.16, 0.19, 0.34, 10)`) and the trawler's net drum
// (`CylinderGeometry(0.34, 0.34, 1.5, 12)` laid on its side), both of which are
// boat gear at a third of this size. So this is built in the library's idiom on
// v1's quayside palette: its bollard iron (0x26282c, metalness 0.55) and its
// barrel timber (0x7a5a34).
//
// A CAPSTAN IS A WAISTED BARREL, and that is the whole silhouette. A straight
// cylinder with a lid is a bollard, which the marine set already has one of —
// the waist is what the rope grips, so it is what tells you which of the two
// you are looking at from a car going past.

import * as THREE from 'three';
import { PropTemplate, standard, cylinderAt, beam } from './types';
import { bundle, strut } from './kit';

const H_HEAD = 0.88;          // top of the barrel, underside of the drumhead
const H_TOP = 1.11;           // overall — waist height, like every capstan
const R_BASE = 0.7;
const BAR = 1.7;              // shipped capstan bar, from the head outward

/** Whelps: the vertical ribs down the barrel. Eight of them, radial, built by
 *  rotating each box about Y before it is placed, so its depth axis points out
 *  from the centre rather than along Z for all eight. */
function whelps(): THREE.BufferGeometry[] {
  return Array.from({ length: 8 }, (_, k) => {
    const a = (k / 8) * Math.PI * 2;
    return beam(0.09, 0.58, 0.13, Math.sin(a) * 0.34, 0.55, Math.cos(a) * 0.34, 0, a, 0);
  });
}

const capstan: PropTemplate = {
  id: 'capstan',
  name: 'Capstan',
  category: 'marine',
  description: 'Cast-iron quayside capstan with two bars shipped, 1.1 m. Solid.',

  build: () => [
    {
      key: 'iron',
      geometry: bundle([
        cylinderAt(0.62, R_BASE, 0.14, 10, 0),            // bedplate, bolted down
        cylinderAt(0.50, 0.52, 0.10, 10, 0.14),           // pawl rim
        cylinderAt(0.30, 0.40, 0.34, 10, 0.24),           // barrel, in to the waist
        cylinderAt(0.40, 0.30, 0.30, 10, 0.58),           // and out again
        ...whelps(),
        cylinderAt(0.46, 0.42, 0.16, 10, H_HEAD),         // drumhead
        cylinderAt(0.40, 0.46, 0.07, 10, 1.04),           // cap
      ]),
      material: standard(0x26282c, { roughness: 0.5, metalness: 0.55 }),
      castShadow: true,
      tint: (c) => new THREE.Color(0x26282c).offsetHSL(0, 0, c.rng.centered(0.05)),
    },
    {
      key: 'bars',
      // TWO BARS, NOT SIX. A capstan is worked by a full set shipped in the
      // pigeonholes, and six bars 1.7 m long is a 3.4 m starfish lying across
      // the quay — a prop you cannot walk a car past and cannot place next to
      // anything. Two is what gets left in when the job stops for the day.
      geometry: bundle([0.4, 0.4 + Math.PI].map((a) => strut(
        [Math.sin(a) * 0.26, H_HEAD + 0.1, Math.cos(a) * 0.26],
        [Math.sin(a) * BAR, H_HEAD - 0.16, Math.cos(a) * BAR],
        0.055, 6,
      ))),
      material: standard(0x7a5a34, { roughness: 0.9 }),
      castShadow: true,
    },
    {
      key: 'rope',
      // Three turns in the waist. Same treatment as the mooring post's coil,
      // and for the same reason: rope is what says this is working gear.
      geometry: bundle([0.42, 0.5, 0.58].map((y, i) =>
        new THREE.TorusGeometry(0.33 + i * 0.005, 0.045, 5, 12)
          .rotateX(Math.PI / 2).translate(0, y, 0))),
      material: standard(0xbba97e, { roughness: 1 }),
    },
  ],

  physics: {
    // The CASTING, not the bars. A capstan bar is a loose length of timber
    // shipped in a hole — a car that clips one takes it with it, and a collider
    // out at 1.7 m would be an invisible 3.4 m disc on the quay.
    shape: (s) => ({ kind: 'cylinder', halfHeight: (H_TOP / 2) * s, radius: R_BASE * s, centerY: (H_TOP / 2) * s }),
    solid: true,
    massKg: 1400,
  },

  authoring: {
    scale: [0.9, 1.15], defaultScale: 1,
    placement: 'shore', shoreBand: 4,
    minRoadDist: 5, randomYaw: true, previewDist: 5,
  },
};

export default capstan;
