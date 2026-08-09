// CROP ROW — a 4 x 8 m strip of standing crop over its own furrows, drilled
// along local +Z. Same axis convention as `vineRow`, so a farm laid out from
// these components has one heading for all of it: rows step 4 m across local
// X and butt end to end along Z.
//
// SHAPE FROM IGNITE RALLY, by analogy rather than by copy: `_buildVineRows()`
// in `src/track.js` builds each vine panel as a tilled soil strip with a
// canopy box standing on it, and a field is the same object at a different
// height — furrow ridges with the crop standing between them. v1 has no crop
// as such (its fields are terrain colour), so the drill spacing and the ear
// height are new: 0.5 m between drills, 1.0 m of standing wheat, which is
// waist high on a person and a third the height of the vine trellis.
//
// SIX drills, not sixty. This is scattered by the dozen to fill a field, so it
// has to cost two draw calls and a few hundred triangles; the ragged top line
// does the work that density would.

import * as THREE from 'three';
import { PropTemplate, standard, mergeGeoms, beam } from './types';

const LEN = 8;
/** Drill centres across local X: 0.5 m spacing, eight of them, so the strip is
 *  4 m wide including the outer half-drills and tiles cleanly on 4 m. */
const DRILLS = [-1.75, -1.25, -0.75, -0.25, 0.25, 0.75, 1.25, 1.75];

const cropRow: PropTemplate = {
  id: 'cropRow',
  name: 'Crop row',
  category: 'flora',
  description: '4 x 8 m strip of standing crop, drilled along +Z. Dressing — drive through it.',

  build: () => [
    {
      key: 'furrows',
      // The ploughed ground under the crop. Ridges rather than a flat slab: at
      // a shallow angle the furrow lines are most of what you see of a field,
      // and they are free — the same box count either way.
      geometry: mergeGeoms(DRILLS.map((x) => beam(0.34, 0.12, LEN, x, 0.06, 0))),
      material: standard(0xffffff),
      // v1's tilled-soil tone from the vine rows, unchanged.
      tint: (c) => new THREE.Color().setHSL(0.072, 0.36, 0.19 + c.rng.float() * 0.05),
    },
    {
      key: 'crop',
      // Fixed per-drill jitter, not random: every instance shares this one
      // buffer, so the jitter has to be baked. The lean alternates so the
      // strip does not read as a comb.
      geometry: mergeGeoms(DRILLS.map((x, i) => {
        const h = 0.88 + ((i * 3) % 4) * 0.055;
        const lean = ((i % 3) - 1) * 0.035;
        return beam(0.42, h, LEN * 1.01, x, 0.1 + h / 2, 0, 0, 0, lean);
      })),
      material: standard(0xffffff),
      castShadow: true,
      // Ripeness per instance, over a wide band: a field that has been cut in
      // strips, or is ripening unevenly, is what farmland actually looks like.
      // Green through to straw.
      tint: (c) => new THREE.Color().setHSL(
        0.13 + c.rng.float() * 0.09,
        0.34 + c.rng.float() * 0.16,
        0.36 + c.rng.float() * 0.16,
      ),
    },
  ],

  // Never solid. A car goes through standing wheat and comes out the other
  // side covered in it; a metre of crop that stops a rally car is the single
  // most immersion-breaking thing a field could contain. Mass is the CROP, not
  // the ground it stands in — 32 m² of wheat is a couple of hundred kilos.
  physics: { shape: () => ({ kind: 'none' }), solid: false, massKg: 200 },

  authoring: {
    scale: [0.95, 1.1], defaultScale: 1,
    avoidSurfaces: ['tarmac', 'ice', 'snow'],
    minRoadDist: 9,
    // A field is drilled in one direction. Random yaw turns a farm into a
    // patchwork of squares at angles to each other, which reads as allotments.
    randomYaw: false,
  },
};

export default cropRow;
