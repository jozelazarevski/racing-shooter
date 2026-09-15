// TUNNEL MOUTH — a portal: an arched opening in a dressed stone headwall,
// with a short length of bore behind it. Road runs through along +Z, so the
// driver approaches the face from -Z.
//
// SHAPE FROM IGNITE RALLY: `Track._buildTunnel` (`src/track.js` 6090). The
// bore profile is ported VERBATIM, constants included, from
// `src/world/constants.js`:
//
//   HW = TUNNEL_HW = 11.6, WALL = 4.6, APEX = TUNNEL_APEX = 8.6
//   PROF = [[-HW,0], [-HW,WALL], [-HW*0.55,APEX], [0,APEX+0.5],
//           [HW*0.55,APEX], [HW,WALL], [HW,0]]
//
// — vertical jambs to 4.6, chamfered shoulders to a crown at 8.6, and half a
// metre of camber over the centreline. v1's "flared mouths: one extra ring
// past each portal, profile widened" is ported too, at its own 1.16.
//
// That gives a 26.9 m opening at the flare against dustline's 14 m road, which
// is wide. It is v1's number and it is kept: TUNNEL_HW is what its whole
// tunnel system is dimensioned around, and a portal is the one structure where
// generous is right — a bore sized to the carriageway is a letterbox at speed.
//
// The dark bore lining is v1's too, `side: DoubleSide` and `emissive 0x2b2620`
// with no lights in it, for the reason its own comment gives: "a bore lit by
// three PointLights costs every material in the world a recompile."

import * as THREE from 'three';
import { PropTemplate, standard, mergeGeoms, beam } from './types';
import { quad, soup } from '../../templates/geometry';

const HW = 11.6, WALL = 4.6, APEX = 8.6;      // v1 constants, verbatim
const FLARE = 1.16;                            // v1's mouth flare
const PROF: [number, number][] = [
  [-HW, 0], [-HW, WALL], [-HW * 0.55, APEX], [0, APEX + 0.5],
  [HW * 0.55, APEX], [HW, WALL], [HW, 0],
];

const JAMB = HW * FLARE;                       // 13.46 — half the flared opening
const KNEE = HW * 0.55 * FLARE;                // 7.40 — where the shoulder starts
const SPRING = WALL * FLARE;                   // 5.34 — top of the vertical jamb
const SHOULDER = APEX * FLARE;                 // 9.98
const CROWN = (APEX + 0.5) * FLARE;            // 10.56

const FLANK = 3.0;                             // dressed masonry either side
const OUTER = JAMB + FLANK;                    // 16.46 — half the headwall
const TOP = 12.4;                              // top of the headwall
const ZF = -1.5, ZB = 0;                       // headwall face and back

/** The headwall as a flat plate with the profile cut out of it.
 *
 *  Built as trapezoids between the profile's own breakpoints rather than as a
 *  row of boxes: the shoulders are STRAIGHT LINES, so four quads reproduce
 *  them exactly and a box column of any pitch cannot — a stepped chamfer on a
 *  33 m wall is the first thing you see against the sky.
 *
 *  Each span carries its own two heights instead of sampling one function,
 *  because the cut is discontinuous at the jambs: at x = 13.46 the wall is
 *  5.34 m tall on the inside and full height on the outside, and one function
 *  cannot answer both.
 *
 *  Winding is chosen per face. This is a single-sided material, and a quad
 *  wound the wrong way is not a dark triangle, it is nothing at all. */
function headwallFace(): THREE.BufferGeometry {
  const spans: [number, number, number, number][] = [
    [-OUTER, 0, -JAMB, 0],                 // flank, full height to the ground
    [-JAMB, SPRING, -KNEE, SHOULDER],      // shoulder
    [-KNEE, SHOULDER, 0, CROWN],           // camber to the crown
    [0, CROWN, KNEE, SHOULDER],
    [KNEE, SHOULDER, JAMB, SPRING],
    [JAMB, 0, OUTER, 0],
  ];
  const v: number[] = [];
  for (const [x0, h0, x1, h1] of spans) {
    quad(v, [x0, h0, ZF], [x0, TOP, ZF], [x1, TOP, ZF], [x1, h1, ZF]);   // face, -Z
    quad(v, [x0, h0, ZB], [x1, h1, ZB], [x1, TOP, ZB], [x0, TOP, ZB]);   // back, +Z
    if (h0 > 0 || h1 > 0) {
      quad(v, [x0, h0, ZF], [x1, h1, ZF], [x1, h1, ZB], [x0, h0, ZB]);   // reveal
    }
  }
  // The vertical jambs. The span table steps from 5.34 to 0 across x = +/-JAMB
  // and that riser is a face in its own right; without it the portal is open
  // down both sides of the opening.
  for (const sg of [-1, 1]) {
    const x = sg * JAMB;
    if (sg < 0) quad(v, [x, 0, ZF], [x, SPRING, ZF], [x, SPRING, ZB], [x, 0, ZB]);
    else quad(v, [x, 0, ZB], [x, SPRING, ZB], [x, SPRING, ZF], [x, 0, ZF]);
  }
  // outer sides and the top edge, so the plate closes
  for (const sg of [-1, 1]) {
    const x = sg * OUTER;
    if (sg > 0) quad(v, [x, 0, ZF], [x, TOP, ZF], [x, TOP, ZB], [x, 0, ZB]);
    else quad(v, [x, 0, ZB], [x, TOP, ZB], [x, TOP, ZF], [x, 0, ZF]);
  }
  quad(v, [-OUTER, TOP, ZF], [-OUTER, TOP, ZB], [OUTER, TOP, ZB], [OUTER, TOP, ZF]);
  return soup(v);
}

/** The bore, lofted through v1's rings: one flared ring at the mouth and three
 *  plain ones running back into the hill. Only 13 m of it is built — past that
 *  it is a black hole, and nothing beyond earns its triangles. */
function bore(): THREE.BufferGeometry {
  const rings = [
    { z: ZF, f: FLARE }, { z: 1.4, f: 1.0 }, { z: 6.0, f: 1.0 }, { z: 13.0, f: 1.0 },
  ];
  const v: number[] = [];
  for (let r = 0; r < rings.length - 1; r++) {
    const A = rings[r], B = rings[r + 1];
    for (let q = 0; q < PROF.length - 1; q++) {
      const [ax, ay] = PROF[q], [bx, by] = PROF[q + 1];
      quad(v,
        [ax * A.f, ay * A.f, A.z], [bx * A.f, by * A.f, A.z],
        [bx * B.f, by * B.f, B.z], [ax * B.f, ay * B.f, B.z]);
    }
  }
  // cap the far end, or a low sun shines straight down the tunnel and out of
  // the back of a hill that is not modelled
  quad(v, [-HW, 0, 13.0], [-HW, APEX, 13.0], [HW, APEX, 13.0], [HW, 0, 13.0]);
  return soup(v);
}

const tunnelMouth: PropTemplate = {
  id: 'tunnelMouth',
  name: 'Tunnel mouth',
  category: 'structure',
  description: 'Stone portal, 26.9 m opening, road through along +Z. Not solid — you drive through it.',

  build: () => [
    {
      key: 'headwall',
      geometry: mergeGeoms([
        headwallFace(),
        // Coping along the top and a keystone over the crown: the two pieces
        // of dressing that separate a portal from a wall with a hole in it.
        beam(OUTER * 2 + 0.7, 0.5, ZB - ZF + 0.5, 0, TOP + 0.25, (ZF + ZB) / 2),
        beam(1.6, 1.4, ZB - ZF + 0.35, 0, CROWN + 0.5, (ZF + ZB) / 2),
        // Impost bands at the springing — on the FLANKS ONLY. Run across the
        // full width, as a real string course would be, this becomes a stone
        // bar hanging at 5.3 m in the middle of the opening.
        ...[-1, 1].map((sg) => beam(FLANK, 0.32, ZB - ZF + 0.25, sg * (JAMB + FLANK / 2), SPRING, (ZF + ZB) / 2)),
      ]),
      material: standard(0x8f8a80, { roughness: 1 }),   // v1's portal stone
      castShadow: true,
      tint: (c) => new THREE.Color(0x8f8a80).offsetHSL(0, c.rng.centered(0.02), c.rng.centered(0.05)),
    },
    {
      key: 'bore',
      geometry: bore(),
      // v1's bore material, verbatim: two-sided so the loft reads from inside,
      // and a low emissive so the mouth is dark rather than black.
      material: standard(0x55504a, { side: THREE.DoubleSide, emissive: 0x2b2620 }),
      castShadow: true,
    },
  ],

  physics: {
    // NOT SOLID, on the start gantry's rule and for a stronger reason.
    //
    // The component is a 33 m wall with a 27 m hole in it. One convex box
    // either seals the hole — an invisible wall across the road the portal
    // exists to carry — or it does nothing. There is no version of the first
    // that is acceptable: being stopped dead by the tunnel you are driving
    // into is the worst failure this library can produce.
    //
    // And the masonry a car could actually reach is the two flanks, outside
    // |x| = 13.5. A car on a 14 m road never gets within 6 m of them, so the
    // collider given up here is one nobody was going to touch.
    shape: () => ({ kind: 'none' }),
    solid: false,
    massKg: 900000,
  },

  authoring: {
    scale: [0.85, 1.1], defaultScale: 1,
    minRoadDist: 0, randomYaw: false,
  },
};

export default tunnelMouth;
