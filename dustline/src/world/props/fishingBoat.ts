// FISHING BOAT — the trawler.
//
// SHAPE FROM IGNITE RALLY: `KIND` 3 in `Track._buildMarina`, at its own
// `SCALE_OF` of 1.10 — the full 9 m hull with a tall wheelhouse forward, a
// window band, a stubby funnel behind it, the stern gantry and net drum, the
// working rail, a short mast and a derrick boom raked over the deck. Working
// boats wear working colours, and the `WORK` palette is why this one is not
// the same white as the yachts.

import * as THREE from 'three';
import { PropTemplate } from './types';
import {
  hullParts, cab, mastGeo, gantryGeo, trawlRailGeo, keelGeo, trimGeo,
  afloat, standard, alloy, mergeGeoms, DECK,
} from '../../templates/boats';

const S = 1.1;

/** The derrick: v1 rakes the trawler's boom by 0.62 rad about X and squashes
 *  it to 0.62 of its length. Same numbers, baked in rather than composed. */
function derrickGeo(): THREE.BufferGeometry {
  const g = new THREE.CylinderGeometry(0.08, 0.09, 4.6, 10);
  g.rotateX(Math.PI / 2);
  g.scale(1, 1, 0.62);
  g.rotateX(0.62);
  g.translate(0, DECK + 2.3, -1.2);
  return g;
}

const fishingBoat: PropTemplate = {
  id: 'fishingBoat',
  name: 'Fishing boat',
  category: 'marine',
  description: '10 m trawler — wheelhouse, gantry, net drum, derrick. Floats. Solid.',

  build: () => [
    ...hullParts(S, 0x2f5f8f),
    {
      key: 'wheelhouse',
      geometry: afloat(mergeGeoms([cab(0.77, 0.9, 2.0, 1.5, 2.1)]), S),
      material: standard(0xece7d8, { roughness: 0.8 }),
      castShadow: true,
    },
    {
      key: 'glazing',
      geometry: afloat(cab(1.15, 0.9, 2.06, 0.5, 2.16), S),
      material: standard(0x2b3038, { roughness: 0.5 }),
    },
    {
      key: 'funnel',
      geometry: afloat(cab(1.42, -0.6, 0.5, 0.9, 0.5), S),
      material: standard(0x8a4a3a, { roughness: 0.85 }),
      castShadow: true,
    },
    { key: 'gantry', geometry: afloat(gantryGeo(), S), material: standard(0x8f4232, { roughness: 0.85 }), castShadow: true },
    { key: 'rail', geometry: afloat(trawlRailGeo(), S), material: alloy() },
    // 0.46 is v1's trawler mast height factor — a short pole, not a yacht's.
    { key: 'mast', geometry: afloat(mastGeo(0.46), S), material: alloy(), castShadow: true },
    { key: 'derrick', geometry: afloat(derrickGeo(), S), material: alloy(), castShadow: true },
    { key: 'keel', geometry: afloat(keelGeo(), S), material: standard(0x2c3138, { roughness: 0.8 }) },
    { key: 'trim', geometry: afloat(trimGeo(), S), material: standard(0x201d1a, { roughness: 0.9 }) },
  ],

  physics: {
    shape: (s) => ({ kind: 'box', halfExtents: [1.7 * s, 1.3 * s, 5.0 * s], centerY: 1.0 * s }),
    solid: true,
    massKg: 9000,
  },

  authoring: {
    scale: [0.85, 1.15], defaultScale: 1,
    placement: 'water', minDepth: 1.6,
    minRoadDist: 6, randomYaw: true, previewDist: 26,
  },
};

export default fishingBoat;
