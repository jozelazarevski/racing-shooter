// SAILBOAT — the day boat under sail.
//
// SHAPE FROM IGNITE RALLY: the RIGGED flotilla boat in `Track._buildSea` — the
// marina hull at 0.62–0.72, a coachroof, mast, boom, mainsail, jib and
// standing rigging. That rig exists in v1 because of a complaint recorded in
// its source: the bay's boats were carrying "a bare pole and one flat
// triangle" while the moored fleet had the whole wardrobe, and from the
// seafront the difference is obvious.
//
// dustline's first sailboat was a stack of tapered slabs up a mast, which read
// as a ladder. This is the wardrobe.

import { PropTemplate } from './types';
import {
  hullParts, dayCabinGeo, dayMastGeo, dayBoomGeo, daySailGeo, dayJibGeo,
  dayRigGeo, trimGeo, afloat, standard, alloy, canvasMat,
} from './boatParts';

/** v1's rigged day boat sits at `bs = 0.62 + (k % 3) * 0.05`. */
const S = 0.66;

const sailboat: PropTemplate = {
  id: 'sailboat',
  name: 'Sailboat',
  category: 'marine',
  description: '6 m sloop under main and jib, on the lofted hull. Floats.',

  build: () => [
    ...hullParts(S, 0xf2ede2),
    { key: 'cabin', geometry: afloat(dayCabinGeo(), S), material: standard(0xf2ede2, { roughness: 0.8 }), castShadow: true },
    { key: 'spars', geometry: afloat(dayMastGeo(), S), material: alloy(), castShadow: true },
    { key: 'boom', geometry: afloat(dayBoomGeo(), S), material: alloy(), castShadow: true },
    { key: 'main', geometry: afloat(daySailGeo(), S), material: canvasMat(), castShadow: true },
    { key: 'jib', geometry: afloat(dayJibGeo(), S), material: canvasMat(), castShadow: true },
    { key: 'rig', geometry: afloat(dayRigGeo(), S), material: alloy() },
    { key: 'trim', geometry: afloat(trimGeo(), S), material: standard(0x201d1a, { roughness: 0.9 }) },
  ],

  physics: {
    shape: (s) => ({ kind: 'box', halfExtents: [1.05 * s, 0.7 * s, 3.0 * s], centerY: 0.5 * s }),
    solid: true,
    massKg: 2400,
  },

  authoring: {
    scale: [0.9, 1.2], defaultScale: 1,
    placement: 'water', minDepth: 1.4,
    minRoadDist: 6, randomYaw: true, previewDist: 20,
  },
};

export default sailboat;
