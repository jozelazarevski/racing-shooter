// QUAY WALL — a run of dressed stone quay edge with a coping course. The thing
// a harbour is actually made of: everything else in the marine set stands on
// this, moors to it, or is lowered off it.
//
// SHAPE FROM IGNITE RALLY: `Track._buildQuayside` in `src/track.js` at the
// repository root. Its quay is one capstone per centreline sample —
// `BoxGeometry(0.95, 0.55, 2.6)` in 0xb0a894, composed at `p.y + 0.18` eleven
// metres off the road — under its own comment:
//
//   "the quay wall: one capstone per sample = a near-continuous low wall"
//
// That block, its proportions, its colour and its 0.18 m set-up are the module
// here. v1 gets away with drawing only the coping because its quay is terrain
// that already falls to the water; a component cannot see the terrain, so the
// masonry FACE under the coping is written out — see below.
//
// AXES. v1's capstone is 0.95 x 0.55 x 2.6 because its instances are yawed to
// `headingAt`, which puts local +Z along the quay. Every run component here
// lies along +X instead (guardrail, dry-stone wall), so the same block is
// 2.6 x 0.55 x 0.95 and a run is three of them: 7.8 m, butting end to end.

import * as THREE from 'three';
import { PropTemplate, standard, beam } from './types';
import { bundle } from '../../templates/geometry';

const CAP = 2.6;              // v1's capstone module, along the run
const RUN = CAP * 3;          // 7.8 m — what one component carries
const CH = 0.65;              // masonry course height
const COURSES = 4;            // down to -2.7, which is below any harbour bed
                              // dustline's terrain ramps to at the shore

/** The wall below the coping.
 *
 *  CUT DEEP, AND ON PURPOSE. Same reasoning as the jetty's piles: the base of
 *  a shore component sits on the GROUND, and the ground at the water's edge is
 *  a metre or two of fall that moves whenever the terrain is edited. A face
 *  that stopped at the modelled waterline would leave daylight under half the
 *  quay in the harbour and hang in the air over the other half. Below y = 0 it
 *  is buried on dry land and costs nothing.
 *
 *  Battered, not plumb: each course stands a little further out and a little
 *  deeper than the one above, which is how a wall that holds back fill is
 *  built and is most of what stops this reading as a grey kerb on a box. */
function face(): THREE.BufferGeometry[] {
  const out: THREE.BufferGeometry[] = [];
  for (let c = 0; c < COURSES; c++) {
    const top = -0.1 - c * CH;
    // Alternating five and six blocks to a course, so no joint runs down two
    // courses. Even joints read as brick, which is a different century.
    const n = 6 - (c & 1);
    const w = RUN / n;
    for (let i = 0; i < n; i++) {
      out.push(beam(
        w - 0.05, CH - 0.04, 0.8 + c * 0.06,
        -RUN / 2 + w * (i + 0.5), top - CH / 2, c * 0.03,
      ));
    }
  }
  return out;
}

const quayWall: PropTemplate = {
  id: 'quayWall',
  name: 'Quay wall',
  category: 'marine',
  description: '7.8 m of dressed stone quay with a coping course. Runs along +X — place them end to end. Solid.',

  build: () => [
    {
      key: 'coping',
      // v1's block, at v1's height above the quay surface. The 40 mm taken off
      // the length is the joint: three blocks that exactly meet weld into one
      // 7.8 m slab under flat shading and the module disappears.
      geometry: bundle([-CAP, 0, CAP].map((x) => beam(CAP - 0.04, 0.55, 0.95, x, 0.18, 0))),
      material: standard(0xb0a894, { roughness: 1 }),
      castShadow: true,
      tint: (c) => new THREE.Color(0xb0a894).offsetHSL(0, c.rng.centered(0.02), c.rng.centered(0.05)),
    },
    {
      key: 'face',
      // The mole's stone from `_buildLighthouse`, which is the darker, wetter
      // grey v1 dresses everything below the coping in.
      geometry: bundle(face()),
      material: standard(0x9a9282, { roughness: 1 }),
      castShadow: true,
    },
  ],

  physics: {
    // The COPING, and only the coping. The face is below the ground a car can
    // reach, and a collider round it would be an invisible wall standing in the
    // harbour. 0.46 m of kerb is a small thing to be solid, and it is solid
    // deliberately: the alternative is a quay you drive straight into the water
    // off, which is the one place on a harbour track a barrier is not annoying.
    shape: (s) => ({ kind: 'box', halfExtents: [(RUN / 2) * s, 0.275 * s, 0.475 * s], centerY: 0.18 * s }),
    solid: true,
    massKg: 52000,
  },

  authoring: {
    // Fixed scale, like the guardrail. A run only tiles if every piece in it is
    // the same length, and a 1.15-scale block between two 1.0s is a step in the
    // coping you can see from across the water.
    scale: [1, 1], defaultScale: 1,
    placement: 'shore', shoreBand: 5,
    minRoadDist: 5, randomYaw: false, previewDist: 20,
  },
};

export default quayWall;
