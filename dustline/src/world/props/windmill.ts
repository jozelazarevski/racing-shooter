// WINDMILL — tapered tower, cap, four sails. The other long-range landmark,
// and the one that suits open farmland where a church spire would not.
//
// The sails are FIXED. Turning them would mean this component owned an update
// hook, and one animated prop is how every prop ends up with an update hook —
// at which point the world stops being a pile of instanced meshes and starts
// being a scene graph you have to walk sixty times a second.

import * as THREE from 'three';
import { PropTemplate, standard, mergeGeoms, beam, cylinderAt, coneAt } from './types';

/** One sail: a lattice of a spar and its slats, laid in the XY plane and
 *  rotated about Z so all four radiate from the hub. */
function sail(angle: number): THREE.BufferGeometry[] {
  const out: THREE.BufferGeometry[] = [beam(0.16, 5.6, 0.12, 0, 3.1, 0, 0, 0, angle)];
  for (let i = 1; i <= 6; i++) {
    const r = 0.6 + i * 0.75;
    out.push(beam(1.1, 0.09, 0.1,
      Math.sin(-angle) * r, Math.cos(angle) * r, 0, 0, 0, angle));
  }
  return out;
}

const windmill: PropTemplate = {
  id: 'windmill',
  name: 'Windmill',
  category: 'settlement',
  description: 'Tapered mill tower with four sails, 11 m to the cap. Solid.',

  build: () => [
    {
      key: 'tower',
      geometry: mergeGeoms([
        cylinderAt(2.0, 3.2, 8.6, 10, 0),
        cylinderAt(2.25, 2.25, 0.35, 10, 8.5),                      // cap ring
        beam(1.0, 2.1, 0.14, 0, 1.05, 3.05),                        // door
      ]),
      material: standard(0xd2c4ad, { roughness: 1, flatShading: false }),
      castShadow: true,
      tint: (c) => new THREE.Color(0xd2c4ad).offsetHSL(0, c.rng.centered(0.04), c.rng.centered(0.06)),
    },
    {
      key: 'cap',
      geometry: mergeGeoms([
        coneAt(2.3, 2.0, 10, 8.85),
        cylinderAt(0.28, 0.28, 1.2, 6, 0).rotateX(Math.PI / 2).translate(0, 9.3, 1.4),
      ]),
      material: standard(0x4f4238, { roughness: 0.9, flatShading: false }),
      castShadow: true,
    },
    {
      key: 'sails',
      geometry: mergeGeoms(
        [0, Math.PI / 2, Math.PI, -Math.PI / 2]
          .flatMap((a) => sail(a))
          .map((g) => g.translate(0, 9.3 - 3.1, 2.1)),
      ),
      material: standard(0xe8e2d2, { roughness: 0.8, flatShading: false }),
      castShadow: true,
    },
  ],

  physics: {
    shape: (s) => ({ kind: 'cylinder', halfHeight: 4.3 * s, radius: 3.0 * s, centerY: 4.3 * s }),
    solid: true,
    massKg: 150000,
  },

  authoring: { scale: [0.85, 1.15], defaultScale: 1, minRoadDist: 18, randomYaw: true },
};

export default windmill;
