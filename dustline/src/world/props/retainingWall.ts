// RETAINING WALL — a battered masonry run with a parapet on top, for the
// downhill edge of a shelf road. Runs along its own X, like `guardrail` and
// `stoneWall`, so a hillside is built by laying them end to end.
//
// SHAPE FROM IGNITE RALLY: `Track._buildRetainingWalls` (`src/track.js` 3343),
// the alpine pass parapets. Ported from it:
//
//   block          3.4 long x 0.9 deep — this run is three of them, 10.2 m
//   parapet        1.0 x 0.95 (from the same file's culvert coping, 9429)
//   colour         a per-instance scalar of 0.86..1.14 on the stone
//
// v1's own heights are 1.1 to 1.5 (`themes.js`: GOTTHARD, TREMOLA, STELVIO),
// and they are NOT ported, because they are not the height of the wall. v1
// sinks the block 0.55 into the shelf and shows only its top — it is drawing a
// parapet and letting the terrain be the retaining structure behind it. A
// placeable component has no shelf to sink into, so it carries the whole wall:
// a 2.4 m battered face with v1's parapet standing on it.
//
// THE BATTER IS THE POINT. A vertical stone face is a garden wall; a wall that
// leans back into the hill is holding something up, and that lean is the only
// thing that says so from a car. Five courses, each narrower and set back.

import * as THREE from 'three';
import { PropTemplate, standard, mergeGeoms, beam } from './types';

const RUN = 10.2;            // three of v1's 3.4 m blocks
const FACE_H = 2.4;          // the retaining face
const BASE_D = 1.25;         // thickness at the footing
const TOP_D = 0.8;           // thickness at the top of the face — v1's 0.9, near enough
const PARAPET_H = 0.95;      // v1, verbatim
const PARAPET_W = 1.0;       // v1, verbatim
const COURSES = 5;

/** The battered face. Each course is thinner than the one below it and set
 *  back on the ROAD side only: the back of the wall stays flat against the
 *  ground it retains, which is where the earth actually is. */
function face(): THREE.BufferGeometry[] {
  const out: THREE.BufferGeometry[] = [];
  const ch = FACE_H / COURSES;
  for (let i = 0; i < COURSES; i++) {
    const t = (i + 0.5) / COURSES;
    const d = BASE_D + (TOP_D - BASE_D) * t;
    // back face pinned at z = +BASE_D/2, so only the exposed face leans
    const z = BASE_D / 2 - d / 2;
    // courses alternate by a few centimetres so the joints are not one plane
    const jog = (i % 2 ? 0.04 : 0) - 0.02;
    out.push(beam(RUN, ch * 1.02, d, 0, ch * (i + 0.5), z + jog));
  }
  return out;
}

const retainingWall: PropTemplate = {
  id: 'retainingWall',
  name: 'Retaining wall',
  category: 'structure',
  description: '10.2 m battered stone wall with a parapet, 3.35 m. Runs along X. Solid.',

  build: () => [
    {
      key: 'wall',
      geometry: mergeGeoms([
        ...face(),
        // a footing course kicked out at the bottom, where the load goes
        beam(RUN + 0.2, 0.28, BASE_D + 0.3, 0, 0.14, BASE_D / 2 - (BASE_D + 0.3) / 2),
      ]),
      material: standard(0x8e8778, { roughness: 1 }),
      castShadow: true,
      // v1 jitters each block's colour by setScalar(0.86 + random * 0.28), so a
      // run of them is masonry rather than one long extruded object
      tint: (c) => new THREE.Color(0x8e8778).offsetHSL(0, c.rng.centered(0.02), c.rng.centered(0.07)),
    },
    {
      key: 'parapet',
      geometry: mergeGeoms([
        beam(RUN, PARAPET_H, PARAPET_W, 0, FACE_H + PARAPET_H / 2, BASE_D / 2 - PARAPET_W / 2),
        // coping slabs, oversailing both faces — the shadow line that makes a
        // parapet read as finished rather than as a wall that ran out
        beam(RUN, 0.16, PARAPET_W + 0.3, 0, FACE_H + PARAPET_H + 0.08, BASE_D / 2 - PARAPET_W / 2),
      ]),
      material: standard(0xa39c8f, { roughness: 1 }),
      castShadow: true,
    },
  ],

  physics: {
    // Solid, unlike `stoneWall`. The dry-stone wall is not solid because a
    // field boundary you cannot cross turns every field into a pen; this is
    // the opposite object — it is the edge of the road, and the whole reason
    // it exists is that there is a drop behind it. A parapet you drive through
    // is a parapet that does not do its job.
    //
    // The box covers face and parapet together, at the parapet's thickness, so
    // it is honest at the height a car meets it.
    shape: (s) => ({
      kind: 'box',
      halfExtents: [(RUN / 2) * s, ((FACE_H + PARAPET_H) / 2) * s, (BASE_D / 2) * s],
      centerY: ((FACE_H + PARAPET_H) / 2) * s,
    }),
    solid: true,
    massKg: 80000,
  },

  authoring: {
    scale: [0.9, 1.2], defaultScale: 1,
    minRoadDist: 6, randomYaw: false,
  },
};

export default retainingWall;
