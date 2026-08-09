// ROWBOAT — the small open boat, and the reference for every hull in the set.
//
// A FLOATING COMPONENT'S ORIGIN IS THE WATERLINE, not its keel. The builder
// puts a `water` placement at the water surface, so everything below y = 0
// here is the part that is under it. That is what lets one boat sit correctly
// in a metre of water and in eight, without knowing the depth: it does not
// float because someone measured the bed, it floats because its zero is the
// waterline by construction.

import * as THREE from 'three';
import { PropTemplate, standard, mergeGeoms, beam, cylinderAt } from './types';

/** A hull as a row of transverse slabs, pinched at the bow.
 *
 *  Exported: the fishing boat and the sailing boat are the same hull at
 *  different sizes, and three hand-tuned copies of this taper is three
 *  chances to get one of them wrong. */
export function hullSections(
  len: number, beamW: number, draught: number, freeboard: number,
  sheer = 0, stations = 11,
): THREE.BufferGeometry[] {
  const out: THREE.BufferGeometry[] = [];
  const step = (len / (stations - 1)) * 1.06;      // slight overlap, no gaps
  for (let i = 0; i < stations; i++) {
    const t = i / (stations - 1);                  // 0 at the transom, 1 at the bow
    const z = -len / 2 + t * len;
    // A wide transom, the maximum beam a little aft of amidships, and a point
    // at the bow. Raising sin to a fractional power is what keeps the sides
    // full rather than lens-shaped.
    const w = beamW * Math.pow(Math.sin(Math.PI * (0.12 + 0.88 * t)), 0.55);
    const rise = sheer * t * t;
    const h = draught + freeboard + rise;
    out.push(beam(Math.max(0.08, w), h, step, 0, (freeboard + rise - draught) / 2, z));
  }
  return out;
}

const rowboat: PropTemplate = {
  id: 'rowboat',
  name: 'Rowboat',
  category: 'marine',
  description: 'Open 3.6 m boat with oars. Floats — sits at the waterline.',

  build: () => [
    {
      key: 'hull',
      geometry: mergeGeoms(hullSections(3.6, 1.35, 0.28, 0.42, 0.16)),
      material: standard(0xffffff, { roughness: 0.75, flatShading: false }),
      castShadow: true,
      // Small boats are painted whatever was in the shed, which is a licence
      // for the widest hue range in the library.
      tint: (c) => new THREE.Color().setHSL(
        c.rng.float(), 0.35 + c.rng.float() * 0.35, 0.45 + c.rng.centered(0.15),
      ),
    },
    {
      key: 'fit-out',
      geometry: mergeGeoms([
        beam(1.15, 0.07, 0.26, 0, 0.16, -0.5),                      // thwarts
        beam(1.0, 0.07, 0.26, 0, 0.16, 0.6),
        // oars, shipped along the gunwale rather than in the water
        cylinderAt(0.045, 0.045, 2.6, 5, 0).rotateX(Math.PI / 2).translate(-0.42, 0.2, 0.1),
        cylinderAt(0.045, 0.045, 2.6, 5, 0).rotateX(Math.PI / 2).translate(0.42, 0.2, 0.1),
        beam(0.14, 0.03, 0.5, -0.42, 0.2, 1.5),
        beam(0.14, 0.03, 0.5, 0.42, 0.2, 1.5),
      ]),
      material: standard(0x8a6f4c, { roughness: 0.9, flatShading: false }),
    },
  ],

  physics: {
    // Solid, and sized to the hull above the water. A boat you can drive
    // through is worse than no boat; a boat whose collider includes its
    // submerged half would stop a car that is nowhere near it.
    shape: (s) => ({ kind: 'box', halfExtents: [0.7 * s, 0.3 * s, 1.8 * s], centerY: 0.2 * s }),
    solid: true,
    massKg: 140,
  },

  authoring: {
    scale: [0.85, 1.2], defaultScale: 1,
    placement: 'water', minDepth: 0.45,
    minRoadDist: 4, randomYaw: true,
  },
};

export default rowboat;
