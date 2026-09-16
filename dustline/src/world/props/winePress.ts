// WINE PRESS — a timber screw press: staved basket on a plinth, two uprights
// carrying a head beam, and the screw running down through it onto the
// follower plate. 3 m to the capstan bars, and the tallest thing in a working
// yard that is not a building.
//
// v1 has no press — its wine country is rows and nothing else — so this is
// built in the library's idiom rather than ported. The proportions come from
// the object: the basket is a barrel-sized 1.7 m across because that is what
// one day's picking fills, and the capstan bars are 2 m long because a man on
// the end of one is the machine's engine. The first cut had the head beam at
// 3 m and the bars at 3.7, which is a press nobody standing on the ground can
// operate — the whole frame came down 0.5 m and the object reads as a machine
// instead of as a gantry.
//
// It faces its own +Z: the spout and the trough it drains into are on that
// side, so a press placed with its back to the viewer is the wrong way round.

import * as THREE from 'three';
import {
  PropTemplate, standard, mergeGeoms, beam, cylinderAt,
} from './types';

const winePress: PropTemplate = {
  id: 'winePress',
  name: 'Wine press',
  category: 'settlement',
  description: 'Timber screw press, 2.3 m square and 3 m tall. Solid.',

  build: () => [
    {
      key: 'frame',
      geometry: mergeGeoms([
        beam(2.3, 0.3, 2.3, 0, 0.15, 0),                       // plinth
        beam(0.22, 2.4, 0.22, -1.02, 1.3, 0),                  // uprights
        beam(0.22, 2.4, 0.22, 1.02, 1.3, 0),
        beam(2.5, 0.28, 0.34, 0, 2.62, 0),                     // head beam
        beam(0.34, 0.4, 0.34, -1.02, 2.68, 0),                 // upright heads, proud
        beam(0.34, 0.4, 0.34, 1.02, 2.68, 0),
        beam(1.4, 0.16, 0.3, 0, 0.42, 1.18, 0, 0, -0.09),      // drain lip, falling to +Z
      ]),
      material: standard(0x8a6b45, { roughness: 0.95 }),
      castShadow: true,
    },
    {
      key: 'basket',
      // Staves, drawn as one tapered drum rather than 24 separate boards. At
      // the size this reads from — it is 1.7 m across in a world where the car
      // is 3.9 m long — individual staves cost 24 times the triangles to add
      // detail nobody resolves; the hoops are what says "basket".
      geometry: mergeGeoms([
        cylinderAt(0.85, 0.9, 1.0, 14, 0.3),
        cylinderAt(0.78, 0.78, 0.18, 14, 1.34),                // follower plate, part way down
      ]),
      material: standard(0xa8874f, { roughness: 1 }),
      castShadow: true,
    },
    {
      key: 'iron',
      geometry: mergeGeoms([
        cylinderAt(0.92, 0.92, 0.09, 14, 0.42),                // hoops
        cylinderAt(0.9, 0.9, 0.09, 14, 0.86),
        cylinderAt(0.86, 0.86, 0.09, 14, 1.18),
        cylinderAt(0.1, 0.1, 1.6, 8, 1.4),                     // screw, up through the beam
        beam(2.0, 0.09, 0.09, 0, 2.96, 0),                     // capstan bars, crossed
        beam(0.09, 0.09, 2.0, 0, 2.96, 0),
      ]),
      material: standard(0x5a554e, { roughness: 0.8, flatShading: false }),
      castShadow: true,
    },
  ],

  physics: {
    // The collider is the machine, not the capstan bars: a box round the
    // plinth and basket, 2.3 m square. Wrapping the bars would give a 4 m
    // hitbox on a 2.3 m object, which is the invisible wall you cannot see the
    // reason for.
    shape: (s) => ({ kind: 'box', halfExtents: [1.15 * s, 1.3 * s, 1.15 * s], centerY: 1.3 * s }),
    solid: true,
    massKg: 1800,
  },

  authoring: {
    scale: [0.9, 1.15], defaultScale: 1,
    minRoadDist: 9,
    // A press stands in a yard at whatever angle the yard is, so yaw freely —
    // unlike the rows it serves, nothing has to line up with it.
    randomYaw: true,
  },
};

export default winePress;
