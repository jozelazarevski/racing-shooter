// WILLOW — the waterside tree, and the first component to use `shore`
// placement: scatter puts it on dry land but only within a few metres of the
// waterline, so a lake gets a fringe of them without anyone drawing one.

import * as THREE from 'three';
import { PropTemplate, cylinderAt, standard, mergeGeoms, beam } from './types';

/** A WITHY: one short length of hanging branch, three-sided instead of four.
 *
 *  A box is 12 triangles and that is already the cheapest box there is, so the
 *  only way down is to stop using a box — and a stick is the one shape where
 *  that is free. You can never see more than two side faces of a four-sided
 *  stick from any single viewpoint, and you can never see more than two of a
 *  three-sided one either, so the fourth face is a face that exists to be
 *  hidden. Dropping it takes a segment from 12 triangles to 8: three side quads
 *  and two end triangles.
 *
 *  IT IS STILL CLOSED, and that is the point of building it by hand rather than
 *  reaching for an open-ended `CylinderGeometry(r, r, h, 3)`. This tree's fronds
 *  are DASHED — measured, consecutive segments overlap near the trunk and stand
 *  apart by up to 0.77 m at the tip — so the ends of the outer segments are in
 *  open air and face the camera. Open ends would be holes you can see into.
 *
 *  `R` is the circumradius. A 0.13 m square section presents between 0.13 m and
 *  0.18 m depending on which way it is turned; an equilateral triangle of
 *  R = 0.085 presents between 0.128 m and 0.147 m. At the 11 m `minRoadDist`
 *  that is 12-13 px where the box was 12-17 px: the curtain is a touch more
 *  even and no thinner where it counts.
 *
 *  Arguments match `beam`'s: size, then centre, then a yaw and a lean applied
 *  in that order, because that is the order `beam` applies `ry` then `rz` and
 *  the frond's droop depends on it. */
const R = 0.085;
function withy(h: number, x: number, y: number, z: number, ry: number, rz: number) {
  const g = new THREE.BufferGeometry();
  const v: number[] = [];
  // three corners of the section, in the XZ plane, extruded along local Y
  const c = [0, 1, 2].map((k) => {
    const a = (k / 3) * Math.PI * 2 + Math.PI / 2;
    return [Math.cos(a) * R, Math.sin(a) * R];
  });
  const P = (k: number, sg: number) => [c[k][0], sg * h / 2, c[k][1]];
  for (let k = 0; k < 3; k++) {
    const j = (k + 1) % 3;
    // side quad, wound so its normal points OUT of the prism. Checked, not
    // guessed: for k = 0 the cross product comes out along (-0.866, 0, 0.5),
    // which is the outward bisector of that edge. A prism wound inside-out is
    // invisible under `FrontSide`, and this material is `FrontSide`.
    v.push(...P(k, -1), ...P(j, 1), ...P(j, -1));
    v.push(...P(k, -1), ...P(k, 1), ...P(j, 1));
  }
  v.push(...P(2, 1), ...P(1, 1), ...P(0, 1));       // top, front-facing up
  v.push(...P(0, -1), ...P(1, -1), ...P(2, -1));    // bottom, front-facing down
  g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  g.rotateY(ry);
  g.rotateZ(rz);
  g.translate(x, y, z);
  g.computeVertexNormals();
  return g;
}

/** One drooping frond: a stack of short segments that lean further over as
 *  they go out, which is the whole silhouette of the tree. */
function frond(angle: number, len: number): THREE.BufferGeometry[] {
  const out: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 5; i++) {
    const t = i / 4;
    const r = 0.5 + t * len;
    const y = 4.4 - t * t * 3.2;
    // FIVE SEGMENTS, NINE FRONDS, SAME ARC. The curtain of withies is 90% of
    // this tree and it is the entire reason the component exists, so the
    // reduction here is in each segment's section and NOT in how many there are
    // — the count and the droop are the silhouette, and 45 x 4 triangles of
    // hidden fourth face are not.
    out.push(withy(0.9 - t * 0.25,
      Math.cos(angle) * r, y, Math.sin(angle) * r, angle, -0.5 - t * 0.8));
  }
  return out;
}

const willow: PropTemplate = {
  id: 'willow',
  name: 'Willow',
  category: 'flora',
  description: 'Weeping waterside tree. Scatters along a shoreline. Solid trunk.',

  build: () => [
    {
      key: 'trunk',
      geometry: mergeGeoms([
        cylinderAt(0.3, 0.5, 3.4, 9, 0),
        beam(0.2, 1.2, 0.2, 0.35, 3.6, 0.1, 0, 0, -0.4),
        beam(0.18, 1.1, 0.18, -0.35, 3.6, -0.15, 0, 0, 0.42),
      ]),
      material: standard(0x6d5c46, { flatShading: false }),
      castShadow: true,
    },
    {
      key: 'fronds',
      geometry: mergeGeoms(
        Array.from({ length: 9 }, (_, i) => frond((i / 9) * Math.PI * 2, 1.5 + (i % 3) * 0.35))
          .flat(),
      ),
      material: standard(0xffffff),
      castShadow: true,
      tint: (c) => new THREE.Color().setHSL(
        0.21 + c.rng.float() * 0.05, 0.42, 0.35 + c.rng.centered(0.05),
      ),
    },
  ],

  physics: {
    shape: (s) => ({ kind: 'cylinder', halfHeight: 1.8 * s, radius: 0.5 * s, centerY: 1.8 * s }),
    solid: true,
    // COVERAGE — the trunk. The curtain of withies is not a wall.
    coverage: 'trunk',
    massKg: 2200,
  },

  authoring: {
    scale: [0.85, 1.4], defaultScale: 1.1,
    placement: 'shore', shoreBand: 9,
    avoidSurfaces: ['tarmac', 'ice', 'snow'], minRoadDist: 11, randomYaw: true,
  },
};

export default willow;
