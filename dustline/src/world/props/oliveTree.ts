// OLIVE — short, fat, multi-stemmed, three overlapping silver crowns. The
// ancient one, not the planted one: 4.9 m tall and 4.9 m across, so it is as
// WIDE AS IT IS HIGH, where the oak is half as wide as it is tall and the pine
// and birch are both tall and narrow. That ratio is the whole silhouette — a
// hillside of these does not look like a hillside of anything else in the set,
// which is the only reason to add a second broadleaf.
//
// SHAPE FROM IGNITE RALLY: `_buildOliveGrove(m4)` in `src/world/flora.js` at
// the repository root, species `oliveOld` — trunk, leaning second stem, and
// crowns A/B/C, at v1's numbers. Its own note on why this shape and not a
// generic tree: the ancient olive is "the tier-4 tree you actually remember".
//
// The crowns are built with THREE.SphereGeometry directly rather than through
// `sphereAt`, for two reasons: they are FLATTENED (scale(1, 0.74, 1)) — a
// sphere is a bush and an olive crown is a cushion — and v1's segment counts
// are (7, 5) and (6, 5), which `sphereAt` cannot express because it derives
// the height segments from the width.

import * as THREE from 'three';
import { PropTemplate, cylinderAt, standard, mergeGeoms } from './types';

/** v1's crown: a low-poly sphere squashed vertically and moved into place. */
function crown(r: number, wSeg: number, hSeg: number, squash: number,
  x: number, y: number, z: number): THREE.SphereGeometry {
  const g = new THREE.SphereGeometry(r, wSeg, hSeg);
  g.scale(1, squash, 1);
  g.translate(x, y, z);
  return g;
}

const oliveTree: PropTemplate = {
  id: 'oliveTree',
  name: 'Olive',
  category: 'flora',
  description: 'Ancient olive: gnarled twin trunk, silver-grey crowns. Solid.',

  build: () => [
    {
      key: 'trunk',
      geometry: mergeGeoms([
        // Fat and short — 2.1 m of trunk under 0.78 m of butt radius. The
        // taper is nearly 2:1 over that height, which is what makes it read as
        // old rather than as a young tree scaled down.
        cylinderAt(0.42, 0.78, 2.1, 7, 0),
        // the second stem, leaning out. An olive that has been coppiced for
        // three centuries is several trees sharing a root.
        (() => {
          const g = new THREE.CylinderGeometry(0.2, 0.34, 1.9, 6);
          g.rotateZ(0.34);
          g.translate(0.42, 1.5, 0.1);
          return g;
        })(),
      ]),
      material: standard(0x7a6a52, { flatShading: false }),
      castShadow: true,
    },
    {
      key: 'crowns',
      geometry: mergeGeoms([
        crown(1.95, 7, 5, 0.74, 0, 3.5, 0),
        crown(1.3, 6, 5, 0.8, 1.35, 3.1, 0.45),
        crown(1.15, 6, 5, 0.8, -1.2, 3.3, -0.5),
      ]),
      material: standard(0xffffff),
      castShadow: true,
      // SILVER-GREY, and that is the whole point of the species. Low
      // saturation and a light well above the oak's, pulled toward yellow-green
      // rather than green: at 0.5 saturation this is just a small oak.
      tint: (c) => new THREE.Color().setHSL(
        0.19 + c.rng.float() * 0.03,
        0.16 + c.rng.float() * 0.07,
        0.42 + c.rng.centered(0.06),
      ),
    },
  ],

  physics: {
    // The collider is the TRUNK — 0.7 m radius over the 2.1 m of stem — not
    // the 4.2 m crown. v1 gives this species rFac 1.15, a crown-sized cylinder,
    // and a grove of those is a field of invisible walls between the trees.
    shape: (s) => ({ kind: 'cylinder', halfHeight: 1.1 * s, radius: 0.7 * s, centerY: 1.1 * s }),
    solid: true,
    massKg: 3000,
  },

  authoring: {
    scale: [0.85, 1.4], defaultScale: 1.05,
    // It is a Mediterranean tree. Scatter refuses snow and ice for the same
    // reason it refuses them for the palm.
    avoidSurfaces: ['tarmac', 'ice', 'snow'],
    minRoadDist: 11, randomYaw: true,
  },
};

export default oliveTree;
