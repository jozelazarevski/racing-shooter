// FEED BIN — a covered bulk bin on legs, 1.8 m square and 2.6 m to the ridge.
//
// SHAPE FROM IGNITE RALLY: `_fieldProp(x, z, rot, 'feedbin', K)` in
// `src/track.js` at the repository root:
//
//     { w: 1.8, h: 1.7, d: 1.8, x: 0, y: 0.85, z: 0 }    the body
//     { w: 2.1, h: 0.22, d: 2.1, x: 0, y: 1.8, z: 0 }    the lid, oversailing
//     { w: 0.9, h: 0.5,  d: 0.2, x: 0, y: 0.5, z: 0.9 }  the hatch
//
// Body and lid keep v1's dimensions. What changes is that it is ON LEGS: v1's
// bin sits flat on the ground, and a feed bin that does is a feed bin the rats
// have emptied. Standing it 0.45 m up also gives the hatch something to
// discharge INTO — a bucket, or the trough it stands next to — which is the
// only reason the hatch is where it is.
//
// The lid is pitched rather than flat, for the same reason a flat one would be
// wrong: it is outdoors and it is full of grain. The hatch faces local +Z.

import * as THREE from 'three';
import { PropTemplate, standard, mergeGeoms, beam } from './types';

/** How far off the ground the body sits. Everything above is v1's y plus this. */
const LEG = 0.45;

const feedBin: PropTemplate = {
  id: 'feedBin',
  name: 'Feed bin',
  category: 'settlement',
  description: 'Covered bulk feed bin on legs, 2.6 m. Solid.',

  build: () => [
    {
      key: 'legs',
      geometry: mergeGeoms([
        ...[[-0.75, -0.75], [0.75, -0.75], [-0.75, 0.75], [0.75, 0.75]].map(
          ([x, z]) => beam(0.16, LEG, 0.16, x, LEG / 2, z)),
        // Feet plates. A leg that ends in a point is a leg sinking into the
        // field, and at this height the feet are at eye level for the camera.
        ...[[-0.75, -0.75], [0.75, -0.75], [-0.75, 0.75], [0.75, 0.75]].map(
          ([x, z]) => beam(0.3, 0.07, 0.3, x, 0.035, z)),
        beam(1.7, 0.12, 0.12, 0, LEG - 0.1, -0.75),            // cross bracing
        beam(1.7, 0.12, 0.12, 0, LEG - 0.1, 0.75),
      ]),
      material: standard(0x6d6a63, { roughness: 0.9 }),
      castShadow: true,
    },
    {
      key: 'body',
      geometry: mergeGeoms([
        beam(1.8, 1.7, 1.8, 0, 0.85 + LEG, 0),
        beam(0.9, 0.5, 0.2, 0, 0.5 + LEG, 0.9),                // hatch, on +Z
        beam(1.0, 0.1, 0.16, 0, 0.22 + LEG, 0.92),             // and its lip
      ]),
      material: standard(0x8a7a5c, { roughness: 0.95 }),
      castShadow: true,
      tint: (c) => new THREE.Color().setScalar(0.9 + c.rng.float() * 0.2),
    },
    {
      key: 'lid',
      geometry: mergeGeoms([
        // v1's oversailing 2.1 m lid, split into two pitched leaves so rain
        // runs off it. The overhang is what keeps the hatch dry and it is the
        // only shape cue that separates this from a crate on stilts.
        beam(2.15, 0.14, 1.16, 0, 1.94 + LEG, 0.52, -0.28, 0, 0),
        beam(2.15, 0.14, 1.16, 0, 1.94 + LEG, -0.52, 0.28, 0, 0),
        beam(2.2, 0.12, 0.16, 0, 2.12 + LEG, 0),               // ridge cap
      ]),
      material: standard(0x5c5f5a, { roughness: 0.8 }),
      castShadow: true,
    },
  ],

  physics: {
    // Solid. A full bulk bin is most of a tonne of grain in a box you cannot
    // see through, standing on braced legs — the trough's argument, with more
    // of it above the bumper. The collider is the BODY and the legs under it,
    // not the oversailing lid: a hitbox 2.2 m across on a 1.8 m object is the
    // classic complaint of clipping something you never touched.
    shape: (s) => ({ kind: 'box', halfExtents: [0.9 * s, 1.07 * s, 0.9 * s], centerY: 1.07 * s }),
    solid: true,
    massKg: 900,
  },

  authoring: {
    scale: [0.9, 1.15], defaultScale: 1,
    minRoadDist: 9, randomYaw: true,
  },
};

export default feedBin;
