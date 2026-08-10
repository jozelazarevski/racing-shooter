// FOUNTAIN — the village square, in one object.
//
// NO v1 EQUIVALENT. IGNITE RALLY's `Track._buildStreetLife` promises one in its
// own header — "stalls under striped awnings, produce crates stacked at the
// doors, barrels against the render, and a fountain where the road opens out" —
// and then never builds it: the function makes stalls, legs, awnings and
// produce and stops. So this is new, built in the idiom of the surrounding
// library rather than ported, and the shape follows the market stall's rule
// about what village dressing is for: a square with a fountain in it has been
// LIVED IN, where the same square with only houses could have been abandoned.
//
// It is an OCTAGON, not a circle. Eight flat panels catch eight different
// amounts of light, and at the distance a village is seen it is the count of
// edges that separates a basin from a drum — the same reasoning the house
// templates give for their porch posts and string courses. Eight also makes
// the basin cheap: the floor and water are 8-segment cylinders whose flats
// land exactly on the panels' inner faces at 2.03 m, so the basin is a real
// hollow with a water plane in it rather than a solid disc painted blue.

import * as THREE from 'three';
import { PropTemplate, standard, mergeGeoms, beam, cylinderAt, sphereAt } from './types';
import { strut } from '../../templates/geometry';

const R = 2.2;              // circumradius to the centre of each rim panel
const WALL = 0.34;          // rim thickness, radial
const RIM_H = 0.75;
const INNER = R - WALL / 2; // 2.03 — where the floor and the water stop
const WATER_Y = 0.5;        // 0.25 of dry rim above the surface: a basin, not a puddle

/** The eight rim panels. A panel rotated by `ang` about Y has its local +Z
 *  pointing radially outward and its local +X along the tangent, which is why
 *  the width is the octagon's side (1.78 for a 2.2 circumradius, laid slightly
 *  long so the corners overlap instead of showing daylight). */
function rim(): THREE.BufferGeometry[] {
  return Array.from({ length: 8 }, (_, k) => {
    const ang = (k / 8) * Math.PI * 2;
    return beam(1.78, RIM_H, WALL, Math.sin(ang) * R, RIM_H / 2, Math.cos(ang) * R, 0, ang, 0);
  });
}

const fountain: PropTemplate = {
  id: 'fountain',
  name: 'Fountain',
  category: 'settlement',
  description: 'Octagonal stone basin with a spouted plinth, 4.7 m across, 2.4 m tall. Solid at the rim.',

  build: () => [
    {
      key: 'basin',
      geometry: mergeGeoms([
        ...rim(),
        // The floor is turned 22.5 deg: three.js starts an 8-segment cylinder
        // with a VERTEX at angle 0, so unrotated its corners point at the
        // panels and its flats at the joints. Rotated, its flats sit on the
        // panels' inner faces and the basin has no gaps at the bottom.
        cylinderAt(R, R, 0.16, 8, 0).rotateY(Math.PI / 8),
      ]),
      material: standard(0xb3aa96, { roughness: 0.95 }),
      castShadow: true,
    },
    {
      key: 'plinth',
      geometry: mergeGeoms([
        cylinderAt(0.62, 0.72, 0.9, 8, 0.16),                 // column, out of the water
        cylinderAt(0.8, 0.8, 0.16, 8, 1.06),                  // moulding
        cylinderAt(0.92, 0.42, 0.34, 8, 1.22),                // upper bowl, widening
        cylinderAt(0.11, 0.13, 0.5, 6, 1.56),                 // stem
        sphereAt(0.2, 10, 2.16),                              // finial
        // four spouts, angled down out of the column
        ...Array.from({ length: 4 }, (_, k) => {
          const a = (k / 4) * Math.PI * 2 + Math.PI / 8;
          const s = Math.sin(a), c = Math.cos(a);
          return strut([s * 0.5, 0.98, c * 0.5], [s * 0.95, 0.9, c * 0.95], 0.06, 5);
        }),
      ]),
      material: standard(0xa39a86, { roughness: 0.9 }),
      castShadow: true,
    },
    {
      key: 'water',
      // The surface plus the four falling streams. Inset 0.04 inside the
      // panels so it never z-fights the stone it meets.
      geometry: mergeGeoms([
        cylinderAt(INNER - 0.04, INNER - 0.04, 0.04, 8, WATER_Y).rotateY(Math.PI / 8),
        ...Array.from({ length: 4 }, (_, k) => {
          const a = (k / 4) * Math.PI * 2 + Math.PI / 8;
          const s = Math.sin(a) * 0.95, c = Math.cos(a) * 0.95;
          return strut([s, 0.9, c], [s, WATER_Y, c], 0.035, 4);
        }),
      ]),
      material: standard(0x6f9fa8, {
        roughness: 0.15, metalness: 0.15, flatShading: false,
        // No transparency: a transparent part in an InstancedMesh has to be
        // depth-sorted per instance, which is a real cost for a 4 m puddle. A
        // lit opaque tone reads as water at any distance a car sees it from.
        emissive: 0x1d3a42, emissiveIntensity: 0.35,
      }),
    },
  ],

  physics: {
    // The RIM, and nothing above it. A car meets a fountain at the basin wall,
    // never at the plinth — the basin is 2.4 m of stone in every direction from
    // the column — so a collider tall enough to contain the finial would be
    // 2.4 m of invisible wall standing over a 0.75 m obstacle.
    shape: (s) => ({ kind: 'cylinder', halfHeight: 0.42 * s, radius: 2.4 * s, centerY: 0.42 * s }),
    solid: true,
    massKg: 14000,
  },

  authoring: {
    scale: [0.9, 1.2],
    defaultScale: 1,
    minRoadDist: 9,
    // An octagon with a symmetric plinth has nothing to randomise: yaw would
    // buy variety on paper and none on screen.
    randomYaw: false,
  },
};

export default fountain;
