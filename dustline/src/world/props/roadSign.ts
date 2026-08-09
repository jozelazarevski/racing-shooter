// ROAD SIGN — a warning triangle on a post. Faces -Z, so it reads to a driver
// coming towards it.
//
// NO v1 EQUIVALENT as a component: IGNITE RALLY paints its warnings onto the
// road (`_buildRoadsideDetail`'s reflector posts, the chevron boards) and
// hangs its lettering on gantries. The one v1 idea taken here is the reason
// those exist at all — a warning has to be legible as a SHAPE, because the
// colour is gone by dusk and the text was never readable at speed.
//
// So the sign is a triangle and nothing else: circumradius 0.62, which is a
// 1.07 m side — real signage size, sitting with its apex at 2.9 m. The symbol
// on it is one bar and one dot, the universal "something ahead", because a
// specific pictogram is a texture per hazard and this library does not have
// textures for that.
//
// THE PLATE IS A THREE-SIDED CYLINDER. `CylinderGeometry(r, r, t, 3)` is a
// triangular prism, and rotateX(-PI/2) stands it on edge with a vertex up —
// eight vertices for a sign blank, against a triangle soup that would need its
// winding argued about.

import * as THREE from 'three';
import { PropTemplate, standard, mergeGeoms, beam, cylinderAt } from './types';

const POST_H = 2.05;
const R = 0.62;              // circumradius: apex 0.62 up, base edge 0.31 down
const CY = 2.28;             // centre of the plate

const plate = (r: number, t: number, z: number) =>
  new THREE.CylinderGeometry(r, r, t, 3).rotateX(-Math.PI / 2).translate(0, CY, z);

const roadSign: PropTemplate = {
  id: 'roadSign',
  name: 'Road sign',
  category: 'trackside',
  description: 'Warning triangle on a post, 2.9 m. Faces -Z. Solid but light.',

  build: () => [
    {
      key: 'post',
      geometry: mergeGeoms([
        cylinderAt(0.055, 0.07, POST_H, 8, 0),
        beam(0.3, 0.1, 0.3, 0, 0.05, 0),          // foot plate
        // stay behind the plate: a sign this size on a single 55 mm post
        // visibly hangs unless something braces it
        beam(0.05, 0.7, 0.05, 0, CY - 0.28, 0.09),
      ]),
      material: standard(0x5a5d62, { roughness: 0.6, flatShading: false }),
      castShadow: true,
    },
    {
      key: 'rim',
      geometry: plate(R, 0.07, 0),
      material: standard(0xc0392b, { roughness: 0.7, flatShading: false }),
      castShadow: true,
    },
    {
      key: 'face',
      // The white ground, set 15 mm forward of the rim. Same triangle scaled
      // down, so the red border is an even width all the way round without
      // anything having to compute an inset.
      geometry: mergeGeoms([
        plate(R * 0.76, 0.05, -0.05),
        beam(0.085, 0.3, 0.03, 0, CY + 0.03, -0.09),      // the bar
        beam(0.085, 0.085, 0.03, 0, CY - 0.19, -0.09),    // and the dot
      ]),
      material: standard(0xf3efe4, { roughness: 0.8, flatShading: false }),
    },
  ],

  physics: {
    // Solid, and deliberately the same weight class as `marshalPost` and
    // `chevronSign`: a sign on a post should be worth avoiding and should
    // never be worth more than the corner it warns about. The collider is the
    // post, not the plate — the plate is at 2.3 m, over the roof of a car.
    shape: (s) => ({ kind: 'cylinder', halfHeight: 1.1 * s, radius: 0.09 * s, centerY: 1.1 * s }),
    solid: true,
    massKg: 45,
  },

  authoring: {
    scale: [0.9, 1.15], defaultScale: 1,
    minRoadDist: 7, randomYaw: false,
  },
};

export default roadSign;
