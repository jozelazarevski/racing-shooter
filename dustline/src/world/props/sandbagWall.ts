// SANDBAG WALL — the improvised barrier. Solid, and heavy enough to matter,
// but it reads as temporary in a way concrete does not.

import * as THREE from 'three';
import { PropTemplate, standard, mergeGeoms, sphereAt } from './types';

const bag = (x: number, y: number, z: number) => {
  const g = sphereAt(0.32, 6, 0);
  g.scale(1.5, 0.62, 0.95);
  g.translate(x, y, z);
  return g;
};

const sandbagWall: PropTemplate = {
  id: 'sandbagWall',
  name: 'Sandbag wall',
  category: 'trackside',
  description: 'Stacked bags, three courses. Solid — reads temporary, hits hard.',

  build: () => [{
    key: 'bags',
    geometry: mergeGeoms([
      ...[-1.4, -0.45, 0.5, 1.45].map((x) => bag(x, 0.2, 0)),
      ...[-0.95, 0, 0.95].map((x) => bag(x, 0.58, 0)),
      ...[-0.5, 0.45].map((x) => bag(x, 0.96, 0)),
    ]),
    material: standard(0xc2ab7c, { roughness: 1, flatShading: false }),
    castShadow: true,
    tint: (c) => new THREE.Color(0xc2ab7c).offsetHSL(0, 0, c.rng.centered(0.05)),
  }],

  physics: {
    shape: (s) => ({ kind: 'box', halfExtents: [1.85 * s, 0.62 * s, 0.35 * s], centerY: 0.62 * s }),
    solid: true,
    massKg: 1600,
  },

  authoring: { scale: [0.9, 1.3], defaultScale: 1, minRoadDist: 6 },
};

export default sandbagWall;
