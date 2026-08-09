// ROWBOAT — the small open boat.
//
// SHAPE FROM IGNITE RALLY: the flotilla's unrigged boat in `Track._buildSea`,
// which is the lofted marina hull at its own scale of 0.42 with a coachroof
// and nothing aloft. Its geometry is `boatParts.ts`; the whole of this file is
// which parts and how big.
//
// A FLOATING COMPONENT'S ORIGIN IS THE WATERLINE, not its keel. v1 moors a
// boat at `seaLevel + 0.38 * scale`, so `afloat()` lifts every part by that
// before scaling — which is what lets one boat sit correctly in a metre of
// water and in eight without knowing the depth.

import { PropTemplate } from './types';
import { hullParts, dayCabinGeo, trimGeo, afloat, standard } from './boatParts';

/** v1's rowing boat: `bs = 0.42` in the flotilla loop. */
const S = 0.42;

const rowboat: PropTemplate = {
  id: 'rowboat',
  name: 'Rowboat',
  category: 'marine',
  description: 'Small open boat, 3.8 m, on the lofted hull. Floats at the waterline.',

  build: () => [
    ...hullParts(S, 0xf2ede2),
    { key: 'cabin', geometry: afloat(dayCabinGeo(), S), material: standard(0xf2ede2, { roughness: 0.8 }), castShadow: true },
    { key: 'trim', geometry: afloat(trimGeo(), S), material: standard(0x201d1a, { roughness: 0.9 }) },
  ],

  physics: {
    // The hull above the water. A boat you can drive through is worse than no
    // boat; a collider that included the submerged half would stop a car that
    // is nowhere near it.
    shape: (s) => ({ kind: 'box', halfExtents: [0.68 * s, 0.45 * s, 1.9 * s], centerY: 0.35 * s }),
    solid: true,
    massKg: 140,
  },

  authoring: {
    scale: [0.85, 1.25], defaultScale: 1,
    placement: 'water', minDepth: 0.45,
    minRoadDist: 4, randomYaw: true, previewDist: 12,
  },
};

export default rowboat;
