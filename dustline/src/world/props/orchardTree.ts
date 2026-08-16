// ORCHARD TREE — a small pruned fruit tree, 3.9 m tall and 2.5 m across, for
// planting in grids. Half the oak's height and half its spread.
//
// SHAPE FROM IGNITE RALLY: `_buildOliveGrove(m4)` in `src/world/flora.js`,
// species `oliveRow` — "the small planted one, and the one that lands on the
// grid": a 1.5 m trunk tapering 0.16 → 0.27, one crown of radius 1.38 squashed
// to 0.86 at 2.45 m, and a small top lobe offset from it. Those numbers are
// kept. What is added is the SCAFFOLD — three short limbs splayed off the top
// of the trunk — because a pruned fruit tree is an open goblet on a clear
// stem, and that is the difference between this and a lollipop.
//
// It is deliberately REGULAR where the olive is gnarled: symmetric crown, one
// straight stem, no lean. An orchard reads as an orchard because every tree in
// it is the same tree, planted on a grid — v1 uses a 7 m lattice for exactly
// this, and the irregularity comes from the yaw and the scale, not the shape.

import * as THREE from 'three';
import { PropTemplate, cylinderAt, standard, mergeGeoms, beam } from './types';

const orchardTree: PropTemplate = {
  id: 'orchardTree',
  name: 'Orchard tree',
  category: 'flora',
  description: 'Small pruned fruit tree, 3.9 m. Plants in grids. Solid trunk.',

  build: () => [
    {
      key: 'stem',
      geometry: mergeGeoms([
        cylinderAt(0.16, 0.27, 1.5, 6, 0),
        // three scaffold limbs off the head of the stem, splayed 120° apart.
        // Short: a pruned tree's limbs are cut back every winter.
        ...[0, 1, 2].map((i) => {
          const a = (i / 3) * Math.PI * 2 + 0.4;
          return beam(0.13, 0.9, 0.13,
            Math.sin(a) * 0.24, 1.85, Math.cos(a) * 0.24,
            Math.cos(a) * 0.42, 0, -Math.sin(a) * 0.42);
        }),
      ]),
      material: standard(0x6f5a42, { flatShading: false }),
      castShadow: true,
    },
    {
      key: 'crown',
      geometry: mergeGeoms([
        (() => {
          const g = new THREE.SphereGeometry(1.38, 7, 5);
          g.scale(1, 0.86, 1);
          g.translate(0, 2.45, 0);
          return g;
        })(),
        (() => {
          const g = new THREE.SphereGeometry(0.82, 6, 4);
          g.translate(0.3, 3.15, -0.2);
          return g;
        })(),
      ]),
      material: standard(0xffffff),
      castShadow: true,
      // Greener and lighter than the olive, and a narrow hue band on purpose:
      // a planted orchard is one variety, so the trees should agree with each
      // other far more closely than scattered flora does.
      tint: (c) => new THREE.Color().setHSL(
        0.26 + c.rng.float() * 0.02, 0.38, 0.31 + c.rng.centered(0.04),
      ),
    },
  ],

  physics: {
    // Solid, but the collider is the STEM and nothing else: 0.3 m of radius on
    // a tree with a 2.7 m crown. v1 makes this species non-solid at every
    // scale, and the reason is its collider, not its trunk — v1 sizes tree
    // colliders off the crown (rFac 0.7 here), and a grid of crown-sized
    // hitboxes 7 m apart is a maze you cannot see. With an honest trunk there
    // is no reason to let a car drive through a tree.
    shape: (s) => ({ kind: 'cylinder', halfHeight: 0.85 * s, radius: 0.3 * s, centerY: 0.85 * s }),
    solid: true,
    // COVERAGE — the trunk, not the fruiting crown.
    coverage: 'trunk',
    massKg: 700,
  },

  authoring: {
    scale: [0.85, 1.15], defaultScale: 1,
    avoidSurfaces: ['tarmac', 'ice', 'snow'],
    minRoadDist: 10,
    // Yaw freely: the tree is rotationally symmetric, so this costs nothing and
    // it breaks up the repeat when a hundred of them stand on a lattice.
    randomYaw: true,
  },
};

export default orchardTree;
