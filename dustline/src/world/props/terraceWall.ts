// TERRACE WALL — 6 m of dry-stone retaining wall, 1.6 m high, holding the
// uphill side of a planted bench. Runs along local X, like the dry-stone field
// wall, so the two can be built into the same boundary.
//
// v1 has no retaining terrace as such — `_stoneWallRun()` builds a FIELD wall,
// 3.2 x 1.15 x 0.85 blocks in a line — so this is that construction taken up
// to terrace proportions, in the same idiom: staggered courses, because an
// even grid reads as brick and brick is a different century. Two things a
// retaining wall has that a field wall does not:
//
//   BATTER. The face leans back into the hill, about 1 in 12, and each course
//   is shallower than the one below it. A vertical dry-stone face 1.6 m high
//   is a wall that has already fallen over; the lean is the whole reason it
//   stands, and it is also what tells you at a glance which side is uphill.
//
//   A COPING COURSE. Stones set on edge along the top, which is what keeps
//   the fill from washing over the lip — and from the road it is the line
//   that reads, because it is the only straight edge on the object.

import * as THREE from 'three';
import { PropTemplate, standard, mergeGeoms, beam } from './types';

const COURSES = 6;
const COURSE_H = 0.24;

const terraceWall: PropTemplate = {
  id: 'terraceWall',
  name: 'Terrace wall',
  category: 'settlement',
  description: '6 m dry-stone terrace, 1.6 m high, battered face. Solid.',

  build: () => [{
    key: 'courses',
    geometry: mergeGeoms([
      ...Array.from({ length: COURSES }, (_, row) =>
        // Alternate courses carry one fewer stone and start half a stone over,
        // which is the stagger; the hash on (i, row) keeps every block a
        // slightly different size without needing a random stream, so the same
        // wall comes out of every build.
        Array.from({ length: 8 - (row & 1) }, (_, i) => {
          const w = 0.7 + ((i * 5 + row * 3) % 5) * 0.05;
          const x = -3 + i * 0.76 + (row & 1 ? 0.38 : 0) + 0.38;
          const d = 0.72 - row * 0.045;                  // thins as it climbs
          const setBack = row * 0.022;                   // batter: ~1 in 12
          return beam(w, COURSE_H, d, x, COURSE_H / 2 + row * COURSE_H, setBack,
            0, 0, ((i + row) % 4) * 0.015);
        })).flat(),
      // coping: stones on edge along the lip
      ...Array.from({ length: 12 }, (_, i) =>
        beam(0.42, 0.3, 0.4, -3 + 0.25 + i * 0.5, COURSES * COURSE_H + 0.15, 0.13,
          0, (i % 3) * 0.04, 0)),
    ]),
    material: standard(0xffffff, { roughness: 1 }),
    castShadow: true,
    tint: (c) => new THREE.Color(0x9d968b).offsetHSL(
      c.rng.centered(0.02), c.rng.centered(0.03), c.rng.centered(0.07),
    ),
  }],

  physics: {
    // SOLID, where the dry-stone field wall deliberately is not, and the
    // difference is what the two walls are FOR. A field wall divides open
    // ground: making it hard turns every field into a pen, so you clip it and
    // lose time. A terrace wall is the face of a STEP in the ground — there is
    // a metre and a half of hillside stacked behind it — so a car that drives
    // through it drives into the hill. Between an invisible wall and a wall you
    // can see, this is the one place to choose the wall you can see.
    shape: (s) => ({ kind: 'box', halfExtents: [3 * s, 0.8 * s, 0.4 * s], centerY: 0.8 * s }),
    solid: true,
    massKg: 16000,
  },

  authoring: {
    scale: [0.9, 1.3], defaultScale: 1,
    minRoadDist: 10,
    // Terraces follow a contour, so they are laid in courses at one heading.
    // Yawing them independently gives a hillside of crossed walls retaining
    // nothing.
    randomYaw: false,
  },
};

export default terraceWall;
