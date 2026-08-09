// SAILBOAT — 6.5 m sloop, sail up. The tall thin silhouette on open water:
// the fishing boat is all horizontal, and a bay with only fishing boats in it
// has nothing standing up in it anywhere.

import * as THREE from 'three';
import { PropTemplate, standard, mergeGeoms, beam, cylinderAt } from './types';
import { hullSections } from './rowboat';

/** A single flat triangle. Nothing else in the library needs one — every other
 *  component is made of boxes and cylinders — but a sail is a triangle, and
 *  approximating it out of boxes costs more geometry AND looks worse. */
function triangle(a: number[], b: number[], c: number[]): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(
    new Float32Array([...a, ...b, ...c]), 3,
  ));
  g.computeVertexNormals();
  return g;
}

const sailboat: PropTemplate = {
  id: 'sailboat',
  name: 'Sailboat',
  category: 'marine',
  description: '6.5 m sloop under sail, 8 m mast. Floats. Solid.',

  build: () => [
    {
      key: 'hull',
      geometry: mergeGeoms([
        ...hullSections(6.5, 2.1, 0.55, 0.6, 0.3, 13),
        beam(0.16, 1.0, 1.8, 0, -1.0, -0.3),                        // fin keel
      ]),
      material: standard(0xf2efe6, { roughness: 0.55, flatShading: false }),
      castShadow: true,
      tint: (c) => new THREE.Color(0xf2efe6).offsetHSL(c.rng.centered(0.5), c.rng.centered(0.1), c.rng.centered(0.06)),
    },
    {
      key: 'deck',
      geometry: mergeGeoms([
        beam(1.5, 0.5, 2.0, 0, 0.85, -0.6),                         // coachroof
        beam(1.2, 0.08, 1.4, 0, 0.64, 1.5),                         // cockpit sole
        cylinderAt(0.1, 0.12, 8.0, 6, 0.6).translate(0, 0, -0.3),   // mast
        beam(0.09, 0.09, 3.0, 0, 1.5, 1.1),                         // boom
      ]),
      material: standard(0xb9ae95, { roughness: 0.8, flatShading: false }),
      castShadow: true,
    },
    {
      key: 'sails',
      // Two flat triangles, each ONE triangle. The first cut stacked tapered
      // slabs up the mast, which from any distance reads as a ladder rather
      // than a sail — the steps are wider than the sail is thick.
      geometry: mergeGeoms([
        triangle([0, 1.5, -0.25], [0, 8.4, -0.25], [0, 1.5, 2.5]),   // mainsail
        triangle([0, 1.2, 0.1], [0, 7.6, -0.28], [0, 1.0, 2.9]),     // jib
      ]),
      material: standard(0xfbf8f0, { roughness: 0.9, flatShading: false, side: THREE.DoubleSide }),
      castShadow: true,
    },
  ],

  physics: {
    shape: (s) => ({ kind: 'box', halfExtents: [1.05 * s, 0.7 * s, 3.25 * s], centerY: 0.4 * s }),
    solid: true,
    massKg: 2400,
  },

  authoring: {
    scale: [0.9, 1.15], defaultScale: 1,
    placement: 'water', minDepth: 2.0,
    minRoadDist: 6, randomYaw: true,
  },
};

export default sailboat;
