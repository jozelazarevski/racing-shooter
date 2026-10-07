// BARREL STACK — five barriques on their sides, three and two, chocked.
//
// v1 has barrels (`propAssets().barrel`, a 1.5 m drum standing on its end) but
// it has no STACK of them and its barrel is an oil drum, not a cask: straight
// sided, 12 segments, no hoops. A wine barrel is bilged — fattest at the
// middle, drawn in at the heads — and that bulge is the entire silhouette. So
// this is built rather than ported, and each cask is three drums: a fat middle
// band and two tapers to the heads. Cheaper than a lathed profile and it holds
// its shape at the distance anyone sees it from.
//
// The casks lie with their axes along local X (a 0.95 m barrique) and stack
// across +Z, so the stack is 2.5 m of frontage and only 0.95 m deep — which is
// how they are stored, against a wall, and it is also the way round that reads
// from a road running past it.

import * as THREE from 'three';
import { PropTemplate, standard, mergeGeoms, beam, cylinderAt } from './types';

/** Half-length of a barrique along X. */
const HALF = 0.475;
const R_MID = 0.36;
const R_HEAD = 0.29;

/** One cask lying along X, centred on (0, y, z). Built fresh each call —
 *  `cylinderAt` translates the geometry it returns, so a shared one would walk
 *  further from the origin on every build. */
function cask(y: number, z: number): THREE.BufferGeometry[] {
  const lay = (g: THREE.BufferGeometry, x: number) => {
    g.rotateZ(Math.PI / 2);               // axis Y -> X
    g.translate(x, y, z);
    return g;
  };
  return [
    lay(cylinderAt(R_MID, R_MID, 0.5, 12, -0.25), 0),
    // rotateZ(+90°) maps the cylinder's +Y to -X, so the piece built ABOVE the
    // middle band is the one that ends up at the -X head. Worth stating: built
    // by eye it comes out with both tapers on the same side and reads as a
    // funnel.
    lay(cylinderAt(R_HEAD, R_MID, 0.24, 12, 0.25), 0),      // taper to the -X head
    lay(cylinderAt(R_MID, R_HEAD, 0.24, 12, -0.49), 0),     // and to the +X head
  ];
}

/** The two iron hoops on one cask. Separate part, separate material. */
function hoops(y: number, z: number): THREE.BufferGeometry[] {
  const lay = (g: THREE.BufferGeometry, x: number) => {
    g.rotateZ(Math.PI / 2);
    g.translate(x, y, z);
    return g;
  };
  return [
    lay(cylinderAt(R_MID + 0.015, R_MID + 0.015, 0.07, 12, -0.035), -0.16),
    lay(cylinderAt(R_MID + 0.015, R_MID + 0.015, 0.07, 12, -0.035), 0.16),
    lay(cylinderAt(R_HEAD + 0.02, R_HEAD + 0.02, 0.06, 12, -0.03), HALF - 0.05),
    lay(cylinderAt(R_HEAD + 0.02, R_HEAD + 0.02, 0.06, 12, -0.03), -HALF + 0.05),
  ];
}

// bottom row of three, then two nestled in the hollows between them
const LOWER = [-0.78, 0, 0.78];
const UPPER = [-0.39, 0.39];
const Y_LOW = R_MID;
const Y_HIGH = R_MID + 0.62;

const barrelStack: PropTemplate = {
  id: 'barrelStack',
  name: 'Barrel stack',
  category: 'settlement',
  description: 'Five wine casks on their sides, 2.5 m wide. Solid.',

  build: () => [
    {
      key: 'casks',
      geometry: mergeGeoms([
        ...LOWER.flatMap((z) => cask(Y_LOW, z)),
        ...UPPER.flatMap((z) => cask(Y_HIGH, z)),
        // chocks, or the bottom row rolls away and the whole thing is a lie
        beam(0.5, 0.16, 0.22, 0, 0.08, -1.16, 0, 0, 0.3),
        beam(0.5, 0.16, 0.22, 0, 0.08, 1.16, 0, 0, -0.3),
      ]),
      material: standard(0x8a5c34, { roughness: 0.95, flatShading: false }),
      castShadow: true,
      // Oak darkens with age and with what has been in it, so a cellar of
      // identical casks is the giveaway. Brightness only — an instance colour
      // multiplies the material, so anything else here would shift the hue
      // twice.
      tint: (c) => new THREE.Color().setScalar(0.82 + c.rng.float() * 0.32),
    },
    {
      key: 'hoops',
      geometry: mergeGeoms([
        ...LOWER.flatMap((z) => hoops(Y_LOW, z)),
        ...UPPER.flatMap((z) => hoops(Y_HIGH, z)),
      ]),
      material: standard(0x4c4640, { roughness: 0.7, flatShading: false }),
    },
  ],

  physics: {
    // Solid. Full casks are 280 kg each and they are stacked against
    // something; this is the one piece of yard dressing that genuinely does
    // stop a car, and it is low and wide enough that hitting it is obviously
    // your own fault.
    shape: (s) => ({ kind: 'box', halfExtents: [0.5 * s, 0.68 * s, 1.25 * s], centerY: 0.68 * s }),
    solid: true,
    massKg: 1400,
  },

  authoring: {
    scale: [0.9, 1.15], defaultScale: 1,
    minRoadDist: 8,
    randomYaw: true,
  },
};

export default barrelStack;
