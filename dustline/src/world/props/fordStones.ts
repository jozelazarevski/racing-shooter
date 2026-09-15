// FORD STONES — the marker posts and stepping stones at a water crossing. The
// only trackside component that belongs at the waterline, so `placement:
// 'shore'`: scatter keeps it on dry land within a few metres of the water, and
// the stones run out from there along +Z.
//
// SHAPE FROM IGNITE RALLY: the depth markers of `Track._buildRiverCrossings`
// (`src/track.js` 9355), ported verbatim, dimension for dimension:
//
//   post   CylinderGeometry(0.16, 0.19, 2.2, 8), colour 0xe8e4d8
//   band   CylinderGeometry(0.18, 0.18, 0.34, 8), colour 0xb3352c,
//          centred 0.4 above the post's own centre — i.e. 1.5 up from the bed
//
// v1's reason for them is the right one and is kept: "a pair of depth markers,
// so the crossing announces itself before you are in it." A ford you discover
// by being in it is a ford that has already cost you the stage.
//
// THE STEPPING STONES ARE NOT v1's. It has no footpath furniture at all. They
// are here because two posts on their own are two posts — it is the line of
// stones between them that says the water is shallow and where.

import * as THREE from 'three';
import { PropTemplate, standard, mergeGeoms, cylinderAt, craggy } from './types';

/** One stepping stone: a flattened, roughened boulder.
 *
 *  Each is built at its own radius so `craggy` — which hashes vertex POSITION
 *  rather than drawing from a stream — gives every stone a different set of
 *  facets. Five copies of one geometry laid in a row is a row of identical
 *  stones, which is the one thing river stones never are. */
function steppingStone(r: number, x: number, z: number, yaw: number): THREE.BufferGeometry {
  const g = craggy(new THREE.DodecahedronGeometry(r, 0), 0.26);
  g.scale(1, 0.36, 1);
  g.rotateY(yaw);
  // Centre on y = 0, so half of each stone is in the bed and the top stands
  // about 0.2 proud. Set flush with the base they would vanish the moment the
  // water is an inch up, which is exactly when you need to see them.
  return g.translate(x, 0.03, z);
}

const fordStones: PropTemplate = {
  id: 'fordStones',
  name: 'Ford stones',
  category: 'trackside',
  description: 'Depth markers and stepping stones at a crossing. Runs out along +Z. Not solid.',

  build: () => [
    {
      key: 'posts',
      // v1's pair, flanking the crossing line
      geometry: mergeGeoms([-1, 1].map((sg) => cylinderAt(0.16, 0.19, 2.2, 8, 0).translate(sg * 3.4, 0, 0.5))),
      material: standard(0xe8e4d8, { roughness: 0.9, flatShading: false }),
      castShadow: true,
    },
    {
      key: 'bands',
      geometry: mergeGeoms([-1, 1].map((sg) => cylinderAt(0.18, 0.18, 0.34, 8, 1.33).translate(sg * 3.4, 0, 0.5))),
      material: standard(0xb3352c, { roughness: 0.9, flatShading: false }),
    },
    {
      key: 'stones',
      geometry: mergeGeoms([
        steppingStone(0.58, -0.22, 1.1, 0.4),
        steppingStone(0.64, 0.18, 2.5, 1.9),
        steppingStone(0.55, -0.15, 3.9, 3.3),
        steppingStone(0.68, 0.24, 5.3, 0.9),
        steppingStone(0.6, -0.2, 6.7, 2.4),
      ]),
      material: standard(0x8d8a82, { roughness: 0.95 }),
      castShadow: true,
      tint: (c) => new THREE.Color(0x8d8a82).offsetHSL(0, c.rng.centered(0.02), c.rng.centered(0.06)),
    },
  ],

  physics: {
    // NOT SOLID, against v1, which pushes its depth markers as solids.
    //
    // v1 can afford that because its solids are per-object circles of r 0.35
    // and it can push two of them. Here a component gets ONE convex shape, and
    // the only shape that covers both posts is a 7 m box across the crossing —
    // an invisible wall through the water, standing in for two 0.19 m timber
    // posts that a rally car would take out without noticing.
    //
    // Everything else here is loose stone at ankle height in a riverbed, which
    // is the `pallet` rule: you drive over it. So nothing is solid, and the
    // component is what it looks like — a marker, not an obstacle.
    shape: () => ({ kind: 'none' }),
    solid: false,
    massKg: 900,
  },

  authoring: {
    scale: [0.9, 1.2], defaultScale: 1,
    placement: 'shore', shoreBand: 3,
    minRoadDist: 6, randomYaw: true,
  },
};

export default fordStones;
