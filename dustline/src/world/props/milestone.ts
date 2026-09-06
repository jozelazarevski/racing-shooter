// MILESTONE — the roadside distance stone. Waist high, whitewashed, with a
// painted cap and a dark inscription panel on its face.
//
// NO v1 EQUIVALENT. IGNITE RALLY has nothing between a marshal post and a
// dry-stone wall on the verge; the closest thing is the reflector marker post
// in `Track._buildRoadsideDetail` (`src/track.js` 7060), a 0.15 x 0.85 x 0.15
// box, which is a plastic delineator and not a stone. So this is built in the
// library's idiom rather than ported, and the numbers are from the object: a
// milestone is cut to be readable from a cart at walking pace, which puts the
// panel at 0.6 m and the whole stone at 0.91.
//
// The face is the -Z side, so a milestone reads to a driver approaching from
// -Z. Nothing about it is symmetric, which is the point — it says WHICH WAY.

import * as THREE from 'three';
import { PropTemplate, standard, mergeGeoms, beam } from './types';

const W = 0.42, D = 0.28, SHAFT = 0.7, R = W / 2;

/** The round top. A milestone is a rectangular shaft with a half-cylinder head
 *  — the shape exists so rain runs off the inscription — and the thetaStart of
 *  PI/2 is what selects the UPPER half after the quarter-turn onto the Z axis.
 *  A plain half-cylinder comes out as the +X half, on its side. */
function head(): THREE.BufferGeometry {
  return new THREE.CylinderGeometry(R, R, D, 14, 1, false, Math.PI / 2, Math.PI)
    .rotateX(Math.PI / 2)
    .translate(0, SHAFT, 0);
}

const milestone: PropTemplate = {
  id: 'milestone',
  name: 'Milestone',
  category: 'trackside',
  description: 'Whitewashed distance stone, 0.91 m. Face reads to -Z. Solid.',

  build: () => [
    {
      key: 'stone',
      geometry: mergeGeoms([
        beam(W, SHAFT, D, 0, SHAFT / 2, 0),
        head(),
      ]),
      material: standard(0xe6e1d3, { roughness: 1 }),
      castShadow: true,
      // Whitewash goes grey and green where it is not maintained, which is
      // every milestone anybody has actually seen.
      tint: (c) => new THREE.Color(0xe6e1d3).offsetHSL(c.rng.centered(0.04), 0, c.rng.centered(0.09)),
    },
    {
      key: 'paint',
      geometry: mergeGeoms([
        // painted cap over the round head
        new THREE.CylinderGeometry(R + 0.012, R + 0.012, D + 0.012, 14, 1, false, Math.PI / 2, Math.PI)
          .rotateX(Math.PI / 2).translate(0, SHAFT, 0),
        // inscription panel, sunk into the face and standing proud of it by a
        // millimetre so it never z-fights with the shaft behind it
        beam(0.3, 0.34, 0.02, 0, 0.5, -D / 2 - 0.005),
      ]),
      material: standard(0x33302b, { roughness: 0.9 }),
    },
  ],

  physics: {
    // Solid. It is a cut block of stone a quarter of a tonne heavy, standing
    // on the verge — the same call as `barrierBlock`, several sizes down. A
    // milestone you drive through is one that has stopped being stone.
    shape: (s) => ({ kind: 'box', halfExtents: [(W / 2) * s, 0.455 * s, (D / 2) * s], centerY: 0.455 * s }),
    solid: true,
    massKg: 240,
  },

  authoring: {
    scale: [0.9, 1.15], defaultScale: 1,
    minRoadDist: 8, randomYaw: false,
  },
};

export default milestone;
