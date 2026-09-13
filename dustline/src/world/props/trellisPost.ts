// TRELLIS POST — the braced anchor at the end of a vine row.
//
// v1 has no equivalent: `_buildVineRows()` plants a single 0.2 x 0.2 stake
// every third panel and nothing at the ends, which is fine at the density it
// draws them and wrong the moment a row is a placeable object with a visible
// END. A real row is held up at its ends, not along its length — the wire is
// in tension and the intermediate stakes only carry the weight of leaf. So the
// post itself is v1's stake (0.2 m square, 2.1 m of it), and the brace and
// foot are built in the idiom of the surrounding library.
//
// Lines up with `vineRow`: the row runs along +Z, so the brace rakes back into
// -Z, away from the vines it is pulling against. Drop one at each end of a run
// with the same yaw as the rows.

import * as THREE from 'three';
import { PropTemplate, standard, mergeGeoms, beam } from './types';

const trellisPost: PropTemplate = {
  id: 'trellisPost',
  name: 'Trellis post',
  category: 'settlement',
  description: 'Braced end post for a vine row, 2.1 m. Not solid — it snaps.',

  build: () => [{
    key: 'post',
    geometry: mergeGeoms([
      // The post leans a few degrees INTO the pull of the wire. Dead upright
      // it reads as a fence post that wandered into a vineyard.
      beam(0.2, 2.15, 0.2, 0, 1.06, 0, -0.06),
      // Brace from 1.55 m on the post down to a foot 1.35 m behind it:
      // dy = -1.5, dz = -1.25, so length 1.95 and a rake of atan(1.25/1.5).
      // Rotating +θ about X tilts the strut's top toward +Z, which is the end
      // that meets the post — that sign is easy to get backwards and produces
      // a brace propping thin air.
      beam(0.14, 1.95, 0.14, 0, 0.8, -0.72, 0.696),
      beam(0.16, 0.42, 0.16, 0, 0.21, -1.35),          // foot stake in the ground
      beam(0.28, 0.1, 0.28, 0, 2.18, 0, -0.06),        // sawn cap over the end grain
    ]),
    material: standard(0x7a5836, { roughness: 1 }),
    castShadow: true,
    // Weathering only — the material carries the colour, and an instance tint
    // MULTIPLIES it, so anything but a near-white here darkens the timber twice.
    tint: (c) => new THREE.Color().setScalar(0.88 + c.rng.float() * 0.24),
  }],

  // Not solid, for the same reason the fence run is not: it is a 0.2 m timber
  // stake, and a rally car takes it with it. Making the END of a vine row the
  // one hard thing in the vineyard would be the worst of both worlds — you
  // plough happily through 40 m of vines and then hit a bollard.
  physics: { shape: () => ({ kind: 'none' }), solid: false, massKg: 60 },

  authoring: {
    scale: [0.95, 1.1], defaultScale: 1,
    minRoadDist: 10,
    // Aligned with the row it anchors, never yawed at random.
    randomYaw: false,
  },
};

export default trellisPost;
