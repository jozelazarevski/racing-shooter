// LOBSTER POTS — a stack of creels and a float, left on the hard. Shore
// dressing that scatters: the marine set is otherwise all deliberate placement,
// and a quayside with nothing casually lying about on it looks swept.

import * as THREE from 'three';
import { PropTemplate, standard, mergeGeoms, beam, cylinderAt, sphereAt } from './types';

/** One creel: a base, a hooped top, and the slats between. */
function creel(x: number, y: number, z: number, yaw: number): THREE.BufferGeometry[] {
  const out = [beam(0.75, 0.06, 0.5, x, y, z, 0, yaw, 0)];
  for (let i = 0; i < 5; i++) {
    const t = i / 4;
    out.push(beam(0.05, 0.34 - Math.abs(t - 0.5) * 0.12, 0.5,
      x + Math.cos(yaw) * (-0.32 + t * 0.64), y + 0.2, z - Math.sin(yaw) * (-0.32 + t * 0.64),
      0, yaw, 0));
  }
  out.push(beam(0.75, 0.05, 0.06, x, y + 0.38, z, 0, yaw, 0));
  return out;
}

const lobsterPots: PropTemplate = {
  id: 'lobsterPots',
  name: 'Lobster pots',
  category: 'marine',
  description: 'Stack of creels with a float. Dressing — not solid.',

  build: () => [
    {
      key: 'creels',
      geometry: mergeGeoms([
        ...creel(0, 0.03, 0, 0),
        ...creel(0.08, 0.45, -0.06, 0.22),
        ...creel(-0.05, 0.87, 0.05, -0.31),
      ]),
      material: standard(0x7d6a4c, { roughness: 1, flatShading: false }),
      castShadow: true,
      tint: (c) => new THREE.Color(0x7d6a4c).offsetHSL(0, c.rng.centered(0.05), c.rng.centered(0.07)),
    },
    {
      key: 'float',
      geometry: mergeGeoms([
        sphereAt(0.22, 8, 0.22).translate(0.7, 0, 0.35),
        cylinderAt(0.04, 0.04, 0.3, 5, 0.4).translate(0.7, 0, 0.35),
      ]),
      material: standard(0xffffff, { roughness: 0.6, flatShading: false }),
      tint: (c) => new THREE.Color().setHSL(
        c.rng.float() < 0.5 ? 0.02 : 0.13, 0.7, 0.5,
      ),
    },
  ],

  physics: { shape: () => ({ kind: 'none' }), solid: false, massKg: 60 },

  authoring: {
    scale: [0.85, 1.25], defaultScale: 1,
    placement: 'shore', shoreBand: 6,
    minRoadDist: 5, randomYaw: true,
  },
};

export default lobsterPots;
