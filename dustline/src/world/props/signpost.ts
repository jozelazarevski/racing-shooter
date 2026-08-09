// SIGNPOST — a fingerpost: a white post with three pointed arms, one to each
// way out of a junction.
//
// NO v1 EQUIVALENT. IGNITE RALLY signs the world with banners and checkpoint
// gates (`Track._buildHeroBridge`, `bannerTexture`), which are race furniture;
// a fingerpost is village furniture and there is none. Built in the library's
// idiom instead, next to `chevronSign` — the two do opposite jobs and should
// not be confused. A chevron board says WHERE THE ROAD GOES in the next two
// seconds. A fingerpost says where the ROADS go, and it is set at a junction
// so you slow down to read it, which is the whole reason it is worth having.
//
// The arms carry no lettering. A texture per destination is a texture nobody
// can read at 90 km/h, and the silhouette — three fingers at three angles —
// is what does the work at any distance where the post is visible at all.

import * as THREE from 'three';
import { PropTemplate, standard, mergeGeoms, beam, cylinderAt, sphereAt } from './types';

const POST_H = 2.55;         // arms reach 1.57 m, so the post spans 3.14 m

/** One finger: a plate with a point on the end.
 *
 *  The point is a box turned 45 degrees about Y, not a cone or a triangle
 *  soup. At this size the diamond reads as a chevron tip from every angle a
 *  driver sees it from, and it merges into the same buffer as the plate. */
function finger(y: number, yaw: number): THREE.BufferGeometry[] {
  const plate = beam(0.06, 0.26, 1.25, 0, y, 0.72).rotateY(yaw);
  const tip = beam(0.19, 0.26, 0.19, 0, y, 1.43, 0, Math.PI / 4, 0).rotateY(yaw);
  return [plate, tip];
}

const signpost: PropTemplate = {
  id: 'signpost',
  name: 'Signpost',
  category: 'trackside',
  description: 'Three-armed fingerpost, 2.7 m, 3.1 m across. Solid post.',

  build: () => [
    {
      key: 'post',
      geometry: mergeGeoms([
        cylinderAt(0.075, 0.095, POST_H, 8, 0),
        sphereAt(0.105, 8, POST_H + 0.06),        // finial
        cylinderAt(0.13, 0.15, 0.2, 8, 0),        // collar at the foot
      ]),
      material: standard(0xeae5d6, { roughness: 0.85, flatShading: false }),
      castShadow: true,
    },
    {
      key: 'arms',
      // Two opposed at the top and one across at the lower level. Stacking
      // them at different heights is not decoration: three fingers on one
      // plane become one blob the moment the post is more than 30 m away.
      geometry: mergeGeoms([
        ...finger(2.12, 0),
        ...finger(2.12, Math.PI),
        ...finger(1.78, Math.PI / 2),
      ]),
      material: standard(0xf2eee2, { roughness: 0.85, flatShading: false }),
      castShadow: true,
      tint: (c) => new THREE.Color(0xf2eee2).offsetHSL(0, 0, c.rng.centered(0.05)),
    },
  ],

  physics: {
    // The post only. The arms are 26 mm-thick boards at head height — they are
    // above a car, and a collider wide enough to hold them would be a 3.1 m
    // invisible slab on a verge.
    shape: (s) => ({ kind: 'cylinder', halfHeight: (POST_H / 2) * s, radius: 0.11 * s, centerY: (POST_H / 2) * s }),
    solid: true,
    massKg: 70,
  },

  authoring: {
    scale: [0.95, 1.1], defaultScale: 1,
    minRoadDist: 8, randomYaw: true,
  },
};

export default signpost;
