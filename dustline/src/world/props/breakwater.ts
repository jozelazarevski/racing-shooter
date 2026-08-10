// BREAKWATER — a block of stone mole, meant to be placed in a line running out
// from the harbour mouth. The thing that makes the water inside a harbour flat.
//
// SHAPE FROM IGNITE RALLY: the mole in `Track._buildLighthouse`, `src/track.js`
// at the repository root, carried across with its numbers intact. Its comment
// says what it is and why it is dressed:
//
//   "ON A QUAY WORLD THE LIGHT STANDS ON A MOLE — a stone breakwater running
//    out from the harbour mouth, lighthouse on the tip"
//   "the pier: a long low block from the beach out into the bay, plus a
//    slightly wider cap slab so it reads as dressed stone from the quay"
//
//   const runL = 26, runW = 6.5, top = lvl + 1.25;
//   pier = Box(runW, 5.2, runL)      at top - 2.6
//   slab = Box(runW + 1.1, 0.5, runL + 0.8) at top + 0.05
//
// Every one of those numbers is below. v1 lays the mole out from the water
// LEVEL; a shore component's origin is the ground at the water's edge, which is
// the same datum to within the fall of the beach, so `lvl` becomes y = 0 and
// the block still stands 1.25 m proud with its foot 3.95 m under.
//
// v1 builds ONE mole 26 m long. This is that mole as a module: it runs along
// its own +X, so a line of them butts end to end and a harbour arm is however
// many you place. Rotate the line to point out to sea.

import * as THREE from 'three';
import { PropTemplate, standard, beam } from './types';
import { bundle } from '../../templates/geometry';

const RUN_L = 26;             // v1's runL
const RUN_W = 6.5;            // v1's runW
// PLACEMENT IS `water`, NOT `shore`, and that follows from the line below: the
// whole block is authored RELATIVE TO THE WATER, which is how v1 builds its
// mole (`top = lvl + 1.25`). Declared `shore` it stood on the seabed instead,
// and a mole run out across a harbour mouth ended up 12 m under — which the
// component smoke caught by reading the built world rather than the intent.
// `water` puts its origin on the surface, where its own numbers assume it is.
const TOP = 1.25;             // v1's top, relative to the water
const SLAB_W = RUN_W + 1.1;   // v1's cap oversails by 0.55 a side
const SLAB_L = RUN_L + 0.8;

/** ARMOUR AT THE TOE. v1 has no rubble on the mole itself — it pours ten wet
 *  sea rocks around the LIGHTHOUSE at the end of it, out of the sea's spare
 *  instanced slots, because "the reference puts the tower on a rocky
 *  promontory with skerries off the point, not on a paved slab". The same
 *  argument applies to the whole arm: a dressed box meeting the water on a
 *  clean line is a wall, and a breakwater is a wall with the sea's worth of
 *  broken stone tipped against it.
 *
 *  Hashed from the block index rather than drawn from a stream, exactly as
 *  `craggy` in types.ts is: the same mole comes out of every build, and it does
 *  not matter what order components are created in. */
function armour(): THREE.BufferGeometry[] {
  const hsh = (n: number) => { const v = Math.sin(n * 12.9898) * 43758.5453; return v - Math.floor(v); };
  const out: THREE.BufferGeometry[] = [];
  for (let k = 0; k < 18; k++) {
    const sg = k & 1 ? 1 : -1;
    const x = -RUN_L / 2 + ((k >> 1) + 0.5) * (RUN_L / 9);
    const s = 1.1 + hsh(k + 0.7) * 1.5;
    out.push(beam(
      s, s * 0.8, s * 1.1,
      x + hsh(k + 2.3) * 1.6 - 0.8,
      -0.5 - hsh(k + 3.1) * 0.9,
      sg * (RUN_W / 2 + 0.9 + hsh(k + 4.9) * 0.7),
      hsh(k + 5.5) * 0.5, hsh(k + 6.1) * 2, hsh(k + 7.3) * 0.5,
    ));
  }
  return out;
}

const breakwater: PropTemplate = {
  id: 'breakwater',
  name: 'Breakwater',
  category: 'marine',
  description: '26 m block of stone mole, 7.6 m wide, 1.55 m proud. Runs along +X — place them in a line. Solid.',

  build: () => [
    {
      key: 'pier',
      // v1's pier and cap slab, at v1's heights. Together in one part because
      // they are one colour and one material in v1 too — the "dressed stone"
      // read comes from the cap's 0.55 m oversail catching a different light,
      // not from a second tone.
      geometry: bundle([
        beam(RUN_L, 5.2, RUN_W, 0, TOP - 2.6, 0),
        beam(SLAB_L, 0.5, SLAB_W, 0, TOP + 0.05, 0),
      ]),
      material: standard(0x9a9282, { roughness: 1 }),
      castShadow: true,
      tint: (c) => new THREE.Color(0x9a9282).offsetHSL(0, c.rng.centered(0.02), c.rng.centered(0.04)),
    },
    {
      key: 'armour',
      geometry: bundle(armour()),
      material: standard(0x776f66, { roughness: 1 }),
      castShadow: true,
    },
  ],

  physics: {
    // The DRESSED block, from the water up. The 3.95 m of pier under the
    // surface is the seabed's problem, and the armour is a heap of stone lying
    // at and below the waterline either side — including it would widen the
    // hitbox by 3 m a side for rubble whose tops are level with the sea.
    shape: (s) => ({
      kind: 'box',
      halfExtents: [(RUN_L / 2) * s, 0.775 * s, (SLAB_W / 2) * s],
      centerY: 0.775 * s,
    }),
    solid: true,
    // 26 x 6.5 x 5.2 of masonry is about 880 m³, and dressed stone runs
    // 2.4 t/m³. That is heavier than the lighthouse by three and a half times,
    // which is right: this is the thing the lighthouse stands on.
    massKg: 2100000,
  },

  authoring: {
    // Fixed scale: a line of moles is only a mole if the pieces are the same
    // width, and the eye reads a step in a 26 m block from the far quay.
    scale: [1, 1], defaultScale: 1,
    placement: 'water', minDepth: 0.4,
    minRoadDist: 14, randomYaw: false, previewDist: 52,
  },
};

export default breakwater;
