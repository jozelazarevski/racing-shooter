// FISHING BOAT — 9 m working hull with a wheelhouse and a derrick. The boat
// that makes a stretch of water read as a HARBOUR rather than a lake: rowboats
// alone say picnic, one of these says the place has a trade.

import * as THREE from 'three';
import { PropTemplate, standard, mergeGeoms, beam, cylinderAt } from './types';
import { hullSections } from './rowboat';

const fishingBoat: PropTemplate = {
  id: 'fishingBoat',
  name: 'Fishing boat',
  category: 'marine',
  description: '9 m working boat with a wheelhouse. Floats. Solid.',

  build: () => [
    {
      key: 'hull',
      geometry: mergeGeoms(hullSections(9, 3.1, 0.85, 1.0, 0.5, 13)),
      material: standard(0xffffff, { roughness: 0.7, flatShading: false }),
      castShadow: true,
      tint: (c) => new THREE.Color().setHSL(
        c.rng.float() < 0.5 ? 0.58 + c.rng.centered(0.06) : 0.02 + c.rng.centered(0.04),
        0.4 + c.rng.float() * 0.3, 0.38 + c.rng.centered(0.12),
      ),
    },
    {
      key: 'boot-top',
      // The dark band at the waterline. One strip of paint, and it is most of
      // what makes a hull look like a hull instead of a tapered box.
      geometry: mergeGeoms(hullSections(9.02, 3.16, 0.12, 0.16, 0.08, 13)),
      material: standard(0x23282e, { roughness: 0.8, flatShading: false }),
    },
    {
      key: 'wheelhouse',
      geometry: mergeGeoms([
        beam(2.2, 1.9, 2.4, 0, 1.95, -1.9),
        beam(2.4, 0.14, 2.6, 0, 2.97, -1.9),                        // roof
        cylinderAt(0.16, 0.16, 1.0, 6, 3.0).translate(0.6, 0, -2.4), // funnel
        beam(0.5, 0.06, 0.5, 0, 1.03, 1.4),                         // hatch
      ]),
      material: standard(0xe6e2d6, { roughness: 0.85, flatShading: false }),
      castShadow: true,
    },
    {
      key: 'gear',
      geometry: mergeGeoms([
        cylinderAt(0.1, 0.12, 5.2, 6, 1.0).translate(0, 0, -0.4),   // mast
        beam(0.09, 0.09, 3.0, 0, 4.4, 0.9, 0.5, 0, 0),              // derrick boom
        beam(3.0, 0.1, 0.1, 0, 5.4, -0.4),                          // spreader
        // net drum aft
        cylinderAt(0.5, 0.5, 1.6, 8, 0).rotateZ(Math.PI / 2).translate(0, 1.4, -3.5),
      ]),
      material: standard(0x6f7278, { roughness: 0.8, flatShading: false }),
      castShadow: true,
    },
  ],

  physics: {
    shape: (s) => ({ kind: 'box', halfExtents: [1.55 * s, 1.2 * s, 4.5 * s], centerY: 0.9 * s }),
    solid: true,
    massKg: 9000,
  },

  authoring: {
    scale: [0.85, 1.15], defaultScale: 1,
    placement: 'water', minDepth: 1.6,
    minRoadDist: 6, randomYaw: true,
  },
};

export default fishingBoat;
