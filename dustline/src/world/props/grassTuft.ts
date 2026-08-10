// GRASS TUFT — the thing that was missing between everything else.
//
// The library had 108 components and a world still read as objects standing on
// a painted plane, because the PLANE was empty: outside the road corridor there
// was nothing smaller than a bush anywhere, so the eye had no scale reference
// between a 0.6 m rock and 900 m of vertex-coloured ground.
//
// v1 solves the same problem with `_buildGroundCover` — thousands of tiny
// instanced tufts, no colliders, scattered on the surfaces that can grow. This
// is that, as a component, so a track can ask for it by rule like anything else.
//
// SIX BLADES, ONE PART, NO COLLIDER. This is the one component in the library
// that gets placed in the thousands, so its cost is the only thing about it
// that matters: six tapered quads is 24 triangles, and at 1,200 instances that
// is one draw call and 29k triangles for the entire ground cover of a world.
// Anything cleverer here is paid for twelve hundred times.

import * as THREE from 'three';
import { PropTemplate, standard, mergeGeoms } from './types';

/** One blade: a tapered strip leaning out from the clump's centre. Built as
 *  raw triangles rather than a scaled box because a blade wants to come to a
 *  POINT, and a box that tapers is two more triangles doing nothing. */
function blade(angle: number, lean: number, h: number, w: number): THREE.BufferGeometry {
  const cx = Math.cos(angle), cz = Math.sin(angle);
  // tip displaced by the lean, base a hair off centre so the clump has a spread
  const bx = cx * 0.05, bz = cz * 0.05;
  const tx = bx + cx * lean, tz = bz + cz * lean;
  // the blade's own width axis, perpendicular to the direction it leans
  const px = -cz * w, pz = cx * w;
  const v = [
    bx - px, 0, bz - pz,
    bx + px, 0, bz + pz,
    tx, h, tz,
  ];
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  g.computeVertexNormals();
  return g;
}

const grassTuft: PropTemplate = {
  id: 'grassTuft',
  name: 'Grass tuft',
  category: 'flora',
  description: 'A clump of six blades, 0.5 m. Ground cover — scatter it in the thousands. Never solid.',

  build: () => [{
    key: 'blades',
    geometry: mergeGeoms([0, 1, 2, 3, 4, 5].map((i) => {
      const a = (i / 6) * Math.PI * 2 + (i % 2) * 0.4;
      // 0.45–0.66 m, not the 0.3 the first cut used. That was the realistic
      // height of meadow grass and it was INVISIBLE from the chase camera —
      // ground cover has to read at the distance it is actually seen from,
      // which is thirty metres, not one.
      return blade(a, 0.1 + (i % 3) * 0.07, 0.45 + (i % 4) * 0.07, 0.03);
    })),
    // DoubleSide, and it is not optional: a blade is one triangle, so from
    // behind a single-sided one is a hole in the ground where a tuft should be.
    material: standard(0xffffff, { roughness: 1, side: THREE.DoubleSide }),
    // Colour follows the ground it grew on, the same rule the pine's snow cap
    // uses. Dry gold on sand, bleached on snow, green everywhere else, with
    // enough per-instance swing that a field is not one flat colour.
    tint: (c) => {
      if (c.surface === 'snow' || c.surface === 'ice') {
        return new THREE.Color().setHSL(0.13, 0.10, 0.62 + c.rng.centered(0.07));
      }
      if (c.surface === 'sand') {
        return new THREE.Color().setHSL(0.12, 0.34, 0.46 + c.rng.centered(0.09));
      }
      return new THREE.Color().setHSL(
        0.23 + c.rng.float() * 0.07, 0.36 + c.rng.float() * 0.2, 0.3 + c.rng.centered(0.09),
      );
    },
  }],

  // Never. A tuft of grass with a collider would be 1,200 colliders per world
  // for something a car drives through without noticing.
  physics: { shape: () => ({ kind: 'none' }), solid: false, massKg: 1 },

  authoring: {
    scale: [0.7, 2.2], defaultScale: 1.2,
    avoidSurfaces: ['tarmac'],
    // Right up to the verge: this is the component that hides the seam where
    // the road ribbon's skirt tucks into the terrain.
    minRoadDist: 6,
    randomYaw: true,
    previewDist: 2.2,
  },
};

export default grassTuft;
