// MOTOR LAUNCH — the boat with nothing aloft.
//
// SHAPE FROM IGNITE RALLY: `KIND` 0 in `Track._buildMarina`, at its `SCALE_OF`
// of 0.86 — the lofted hull, a long low coachroof with a window band, a
// cockpit hatch, the deck gear, rudder and skeg, fenders and portholes, and no
// rig at all.
//
// It is its own component rather than a sailboat with the mast switched off
// because of what v1 learned putting thirty boats in one basin: a marina of
// nothing but masts is a picket fence, and a THIRD of its population carries
// nothing aloft precisely to break that skyline.

import { PropTemplate } from './types';
import {
  hullParts, cab, gearGeo, keelGeo, trimGeo, afloat, standard, mergeGeoms,
} from '../../templates/boats';

const S = 0.86;

const launch: PropTemplate = {
  id: 'launch',
  name: 'Motor launch',
  category: 'marine',
  description: '8 m launch with a long coachroof. No rig. Floats. Solid.',

  build: () => [
    ...hullParts(S, 0xefe6d2),
    {
      key: 'cabin',
      geometry: afloat(mergeGeoms([
        cab(0.36, -1.25, 1.85, 1.15, 4.4),
        cab(0.22, 0.9, 1.35, 0.34, 1.1),
      ]), S),
      material: standard(0xf4efe4, { roughness: 0.8 }),
      castShadow: true,
    },
    {
      key: 'glazing',
      geometry: afloat(cab(0.46, -1.25, 1.9, 0.26, 3.0), S),
      material: standard(0x39424e, { roughness: 0.5 }),
    },
    { key: 'gear', geometry: afloat(gearGeo(), S), material: standard(0xe8e3d6, { roughness: 0.7 }) },
    { key: 'keel', geometry: afloat(keelGeo(), S), material: standard(0x2c3138, { roughness: 0.8 }) },
    { key: 'trim', geometry: afloat(trimGeo(), S), material: standard(0x201d1a, { roughness: 0.9 }) },
  ],

  physics: {
    shape: (s) => ({ kind: 'box', halfExtents: [1.35 * s, 0.9 * s, 3.9 * s], centerY: 0.7 * s }),
    solid: true,
    massKg: 3200,
  },

  authoring: {
    scale: [0.85, 1.2], defaultScale: 1,
    placement: 'water', minDepth: 1.2,
    minRoadDist: 5, randomYaw: true, previewDist: 22,
  },
};

export default launch;
