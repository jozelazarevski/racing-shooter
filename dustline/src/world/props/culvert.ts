// CULVERT — the stone mouth where a stream passes under a road embankment.
//
// SHAPE FROM IGNITE RALLY: `Track._buildRiverCrossings` (`src/track.js` 9245),
// the non-ford branch. Its own comment is the reason this component exists at
// all: the culvert "was correct and completely invisible: the ribbon ran up to
// the shoulder, dived into a grass bank and did not come out, which from the
// car reads as a river that stops dead in a field."
//
// Every dimension below is v1's, with its river half-width (`HALF = 3.2` in
// `_buildRivers`) and a 3.6 m embankment substituted for the values it looked
// up per crossing:
//
//   hw     = R.half + 1.2                 -> 4.4    clear half-opening
//   H      = max(2.4, deck - bedY + 0.6)  -> 3.6    headwall height
//   openH  = min(H * 0.55, 2.2)           -> 1.98   opening height
//   pierW  = 1.5, headwall depth 1.6, wing walls 0.9 x 2.2 x 5.5 at 0.22 rad
//
// The mouth is built v1's way — two piers and a lintel, so the opening is a
// HOLE and not a dark rectangle painted on a slab — with a voussoir ring
// dressing it into an arch.
//
// Mouth faces -Z. The wing walls splay back into the bank along +Z, so place
// it with its back to the hillside.

import * as THREE from 'three';
import { PropTemplate, standard, mergeGeoms, beam } from './types';

/** A VOUSSOIR ARCH RING, from v1's culvert mouth.
 *
 *  Opening in the XY plane, springing on y = 0, barrel running along +/-Z.
 *  `halfSpan` and `rise` describe the INTRADOS (the soffit you see through);
 *  the stones sit outside it by `thick`.
 *
 *  v1 poses each stone with `rotation.set(0, roadYaw, a - PI/2)`, which puts
 *  the box's long axis on the tangent — vertical at the springing, horizontal
 *  at the crown. That is exact for a circle and slightly off for an ellipse,
 *  and at these sizes the error is under a degree, so it is kept.
 *
 *  ONE DELIBERATE CHANGE FROM v1: its stones are 0.5 long on a ring whose arc
 *  step is ~1.4, i.e. dashes drawn on the face of a solid lintel behind them.
 *  Here the arch is a real opening with sky behind it, so the ring has to
 *  close — the stones are sized from the ring's own arc step with a little
 *  overlap. */
export function voussoirRing(
  halfSpan: number, rise: number, thick: number, depth: number, n: number,
): THREE.BufferGeometry[] {
  // half the perimeter of the mid-surface ellipse, Ramanujan-free: at these
  // proportions the (a + b) * PI / 2 approximation is within a couple of
  // percent, and the overlap factor swallows that.
  const a = halfSpan + thick / 2, b = rise + thick / 2;
  const arc = ((Math.PI * (a + b)) / 2 / n) * 1.12;
  const out: THREE.BufferGeometry[] = [];
  for (let k = 0; k < n; k++) {
    const t = (Math.PI * (k + 0.5)) / n;
    out.push(beam(arc, thick, depth, -Math.cos(t) * a, Math.sin(t) * b, 0, 0, 0, t - Math.PI / 2));
  }
  return out;
}

const HW = 4.4;                                   // v1: R.half + 1.2
const H = 3.6;                                    // v1: max(2.4, deck - bedY + 0.6)
const OPEN_H = Math.min(H * 0.55, 2.2);           // v1, verbatim
const PIER_W = 1.5;                               // v1
const WALL_D = 1.6;                               // v1 headwall depth
const FACE_W = HW * 2 + PIER_W * 2;               // v1's lintel width, 11.8

const culvert: PropTemplate = {
  id: 'culvert',
  name: 'Culvert',
  category: 'structure',
  description: 'Stone drainage arch in a battered headwall, 11.8 m wide. Mouth faces -Z. Solid.',

  build: () => [
    {
      key: 'headwall',
      geometry: mergeGeoms([
        // two piers and a lintel: the opening is a gap between masses, which
        // is why it still reads as a hole from an angle
        ...[-1, 1].map((sg) => beam(PIER_W, H, WALL_D, sg * (HW + PIER_W / 2), H / 2, 0)),
        beam(FACE_W, H - OPEN_H, WALL_D, 0, OPEN_H + (H - OPEN_H) / 2, 0),
        // coping course, oversailing the face by 0.15 each way
        beam(FACE_W + 0.6, 0.26, WALL_D + 0.3, 0, H + 0.13, 0),
        // wing walls splayed back into the bank along the water. v1 rotates
        // them by 0.22 rad off the stream bearing; the centres are pushed back
        // so the near end lands on the headwall's rear face rather than
        // hanging in front of it.
        ...[-1, 1].map((sg) => beam(0.9, 2.2, 5.5, sg * 5.6, 1.1, 3.48, 0, sg * 0.22, 0)),
      ]),
      material: standard(0x8e8778, { roughness: 1 }),   // v1 `wallColor` default
      castShadow: true,
      tint: (c) => new THREE.Color(0x8e8778).offsetHSL(0, c.rng.centered(0.02), c.rng.centered(0.06)),
    },
    {
      key: 'arch',
      // v1's seven voussoirs, springing at half the opening height. Depth 1.7
      // against a 1.6 headwall, so the ring stands 50 mm proud on both faces —
      // that shadow line is the whole reason it is a separate ring.
      geometry: mergeGeoms(
        voussoirRing(HW, OPEN_H * 0.5, 0.42, WALL_D + 0.1, 7)
          .map((g) => g.translate(0, OPEN_H * 0.5, 0)),
      ),
      material: standard(0x9a9488, { roughness: 1 }),   // v1 `cap` stone
      castShadow: true,
    },
    {
      key: 'barrel',
      // A SHORT LENGTH OF BARREL BEHIND THE MOUTH. Without it the opening is a
      // hole through a 1.6 m slab and you see daylight out the back, which is
      // a wall standing in a field, not a bank with a drain in it. Darker
      // stone, closed 4 m in — nobody is ever going to see the end of it.
      geometry: mergeGeoms([
        ...[-1, 1].map((sg) => beam(0.5, OPEN_H + 0.4, 3.4, sg * (HW + 0.25), (OPEN_H + 0.4) / 2, 2.4)),
        beam(HW * 2 + 1.0, 0.4, 3.4, 0, OPEN_H + 0.2, 2.4),
        beam(HW * 2 + 1.0, OPEN_H + 0.4, 0.5, 0, (OPEN_H + 0.4) / 2, 4.35),
      ]),
      material: standard(0x4c4842, { roughness: 1 }),
    },
  ],

  physics: {
    // THE OPENING IS NOT A GATEWAY. One convex box cannot have a hole in it,
    // so the choice is an invisible wall across a 1.98 m drain or a headwall a
    // car can drive through. The drain wins: it is knee-high on a bank, the
    // barrel behind it is 4 m long and closed, and a car that got through the
    // mouth would come out the back of terrain that does not exist. So the
    // collider is the whole headwall, opening included, and the wing walls —
    // which stand behind it and are never the first thing you hit — get none.
    shape: (s) => ({ kind: 'box', halfExtents: [(FACE_W / 2) * s, (H / 2) * s, (WALL_D / 2) * s], centerY: (H / 2) * s }),
    solid: true,
    massKg: 280000,
  },

  authoring: {
    scale: [0.8, 1.25], defaultScale: 1,
    minRoadDist: 4, randomYaw: false,
  },
};

export default culvert;
