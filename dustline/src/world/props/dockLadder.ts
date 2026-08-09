// DOCK LADDER — an iron ladder bolted down a quay face, with grab handles
// hooping over the coping. What is at the bottom of every quay in the world and
// what anybody who goes in the water swims for.
//
// NO v1 EQUIVALENT — `track.js` has no ladder of any kind (its only `ladder` is
// the coordinate ladder in the sea mesh, which is a spacing table). Built in the
// library's idiom: `strut` from real endpoints, which is the rule the
// lighthouse's sixteen gallery stanchions and every piece of standing rigging
// in the port already follow, on v1's quayside bollard iron (0x26282c,
// roughness 0.5, metalness 0.55).
//
// FACES ITS WALL ALONG -Z. The stiles stand 0.12 m off the masonry on
// brackets, so the origin sits ON the quay face and the ladder hangs in front
// of it: place it against a `quayWall` run with the wall behind, or on the side
// of a `jetty`.

import * as THREE from 'three';
import { PropTemplate, standard } from './types';
import { bundle, strut } from './kit';

const HALF = 0.22;            // stiles 0.44 apart — one person, both hands
const OUT = -0.12;            // standoff from the face, for boots
const FOOT = -2.6;            // driven below the waterline, like the jetty's
                              // piles: the bottom rung of a ladder you can only
                              // reach at low water is a ladder nobody reaches
const HEAD = 0.9;             // grab handles, proud of the quay surface
const STEP = 0.3;             // rung pitch

function bars(): THREE.BufferGeometry[] {
  const out: THREE.BufferGeometry[] = [];
  for (const sg of [-1, 1]) {
    const x = sg * HALF;
    out.push(strut([x, FOOT, OUT], [x, HEAD, OUT], 0.035, 6));
    // the hook: the stile turns back over the coping, which is the part you
    // actually hold to get the last step out of the water
    out.push(strut([x, HEAD, OUT], [x, HEAD + 0.14, OUT + 0.26], 0.035, 6));
  }
  // rungs, from just off the bottom to just under the quay surface
  for (let y = FOOT + 0.1; y < -0.05; y += STEP) {
    out.push(strut([-HALF, y, OUT], [HALF, y, OUT], 0.028, 6));
  }
  // brackets back to the wall — four, which is what holds a ladder on and what
  // stops the stiles reading as two bars floating in front of the stone
  for (const y of [FOOT + 0.25, -1.7, -0.85, -0.05]) {
    for (const sg of [-1, 1]) out.push(strut([sg * HALF, y, OUT], [sg * HALF, y, 0.02], 0.03, 5));
  }
  return out;
}

const dockLadder: PropTemplate = {
  id: 'dockLadder',
  name: 'Dock ladder',
  category: 'marine',
  description: 'Iron ladder down a quay face, 3.6 m. Faces its wall along -Z. Dressing — not solid.',

  build: () => [
    {
      key: 'iron',
      geometry: bundle(bars()),
      material: standard(0x26282c, { roughness: 0.5, metalness: 0.55 }),
      castShadow: true,
      tint: (c) => new THREE.Color(0x26282c).offsetHSL(
        c.rng.centered(0.03), c.rng.centered(0.06), c.rng.centered(0.04),
      ),
    },
  ],

  physics: {
    // NOT SOLID. Two 35 mm bars and nine rungs are not what stops a car — the
    // quay wall they are bolted to is, and that wall is its own component with
    // its own collider. Giving the ladder one as well puts a second invisible
    // box a hand's breadth in front of the first, which is the classic way a
    // decorated wall ends up thicker than the wall.
    shape: () => ({ kind: 'none' }),
    solid: false,
    massKg: 180,
  },

  authoring: {
    scale: [1, 1.1], defaultScale: 1,
    placement: 'shore', shoreBand: 2,
    minRoadDist: 4, randomYaw: false, previewDist: 7,
  },
};

export default dockLadder;
