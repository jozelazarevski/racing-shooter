// BIRCH — pale trunk, loose canopy. The visual counterweight to the pine:
// a forest of nothing but conifers reads as one texture at speed.
//
// SHAPE FROM IGNITE RALLY: `_buildForest(m4)` in `src/world/flora.js` at the
// repository root, TWO of its nine species:
//
//   `birch`     — `birchCrown`, a sphere of radius 1.45 at (7, 5) segments
//                 STRETCHED TO 1.3 OF ITS HEIGHT, at y 4.7, with `birchTop`
//                 riding above it.
//   `birchBare` — the same trunk with no crown at all: three `bareBranch`
//                 cones (radius 0.09, 1.9 long, 5 segments) at rotZ -0.85,
//                 +0.8 and -0.3. v1 carries it as a separate species so a
//                 winter world can mix leafed and bare birches by weight.
//
// THE STRETCH IS THE FIRST PORT, and it is the mirror image of the change the
// oak needed. An oak crown is squashed and a birch crown is stretched — that
// is the pair of numbers that keeps two broadleaves from being the same tree
// in different greens. This file drew three round spheres, so its birch was a
// small oak with a white trunk. Measured: the crown now stands 3.9 m in its
// own height against 3.0 m, on the same 3.65 m of width, and the tree tops out
// at 6.95 m against 6.50 m.
//
// THE BARE WINTER TREE IS THE SECOND, and it is the one deliberate liberty in
// this file. v1 selects `birchBare` by MIX WEIGHT — a fraction of the stand,
// anywhere. dustline has no per-species mix (one component is one silhouette),
// so the selector here is the ground instead: a birch standing on snow is a
// birch in winter and has no leaves on it. That is the same mechanism the
// pine's snow cap already uses, applied to a bigger part of the tree. It means
// a snow track that scatters birch now gets bare ones — which is the intent,
// and is worth knowing before you scatter it.
//
// WHAT DID NOT COME ACROSS: v1's trunk is a plain cylinder in a near-white
// bark material. The two dark bark bands here are dustline's and they do more
// for the read than v1's does, so they stay.
//
// TRIANGLES: 260 leafed (against 296 before), 153 bare.

import * as THREE from 'three';
import { PropTemplate, cylinderAt, standard, mergeGeoms } from './types';

/** v1's crown lobe, STRETCHED rather than squashed — see the header. */
function lobe(r: number, wSeg: number, hSeg: number, stretch: number,
  x: number, y: number, z: number): THREE.SphereGeometry {
  const g = new THREE.SphereGeometry(r, wSeg, hSeg);
  g.scale(1, stretch, 1);
  g.translate(x, y, z);
  return g;
}

/** v1's `bareBranch`: a cone laid over at `rz` with its CENTRE at (x, y, z).
 *  v1's branch dimensions unchanged; the heights are v1's lifted by 1.167,
 *  because v1's birch trunk is 3.6 m and this one is 4.2 m. */
function bareBranch(rz: number, x: number, y: number, z: number): THREE.ConeGeometry {
  const g = new THREE.ConeGeometry(0.09, 1.9, 5);
  g.rotateZ(rz);
  g.translate(x, y, z);
  return g;
}

const birch: PropTemplate = {
  id: 'birch',
  name: 'Birch',
  category: 'flora',
  description: 'Pale deciduous tree, tall narrow crown — bare of leaf on snow. Solid trunk.',

  build: () => [
    {
      key: 'trunk',
      geometry: mergeGeoms([
        cylinderAt(0.16, 0.26, 4.2, 9, 0),
        // two dark bark bands, the thing that makes a birch read as a birch
        cylinderAt(0.19, 0.19, 0.22, 9, 1.3),
        cylinderAt(0.175, 0.175, 0.16, 9, 2.5),
      ]),
      material: standard(0xe4e0d4, { flatShading: false }),
      castShadow: true,
    },
    {
      key: 'canopy',
      geometry: mergeGeoms([
        lobe(1.5, 7, 5, 1.3, 0, 5.0, 0),
        lobe(1.05, 6, 5, 1.2, 0.9, 4.3, 0.3),
        lobe(0.95, 6, 5, 1.2, -0.85, 4.6, -0.4),
      ]),
      material: standard(0xffffff),
      castShadow: true,
      when: (c) => c.surface !== 'snow',
      tint: (c) => new THREE.Color().setHSL(
        0.26 + c.rng.float() * 0.06, 0.45, 0.34,
      ),
    },
    {
      key: 'bare',
      geometry: mergeGeoms([
        bareBranch(-0.85, 0.7, 3.97, 0),
        bareBranch(0.8, -0.6, 3.38, 0.12),
        bareBranch(-0.3, 0.15, 5.02, -0.47),
      ]),
      material: standard(0xffffff),
      castShadow: true,
      when: (c) => c.surface === 'snow',
      // v1's `bare` colour band, verbatim: dark winter branches, and dark on
      // purpose — the branches have to read against a white ground, and a pale
      // twig on snow is invisible.
      tint: (c) => new THREE.Color().setHSL(0.07, 0.18, 0.16 + c.rng.float() * 0.08),
    },
  ],

  physics: {
    shape: (s) => ({ kind: 'cylinder', halfHeight: 2.1 * s, radius: 0.3 * s, centerY: 2.1 * s }),
    solid: true,
    // COVERAGE — the trunk. A birch is mostly air.
    coverage: 'trunk',
    massKg: 650,
  },

  authoring: {
    scale: [0.8, 1.6], defaultScale: 1.1,
    avoidSurfaces: ['tarmac', 'sand', 'ice'], minRoadDist: 11, randomYaw: true,
  },
};

export default birch;
