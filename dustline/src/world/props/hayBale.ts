// HAY BALE — the classic rally chicane marker. Solid, and heavy enough to
// hurt: rally hay bales are notoriously not the soft option they look.

import * as THREE from 'three';
import { PropTemplate, cylinderAt, standard } from './types';

const hayBale: PropTemplate = {
  id: 'hayBale',
  name: 'Hay bale',
  category: 'trackside',
  description: 'Round bale on its side. Solid, and heavier than it looks.',

  build: () => {
    const g = cylinderAt(0.75, 0.75, 1.3, 16, 0);
    g.rotateZ(Math.PI / 2);          // lying down, axis across the track
    g.translate(0, 0.75, 0);
    return [{
      key: 'bale',
      geometry: g,
      material: standard(0xd8b95e, { roughness: 1, flatShading: false }),
      castShadow: true,
      tint: (c) => new THREE.Color(0xd8b95e).offsetHSL(0, 0, c.rng.centered(0.05)),
    }];
  },

  physics: {
    shape: (s) => ({ kind: 'box', halfExtents: [0.68 * s, 0.75 * s, 0.78 * s], centerY: 0.75 * s }),
    solid: true,
    massKg: 320,
  },

  authoring: { scale: [0.9, 1.15], defaultScale: 1, minRoadDist: 8, randomYaw: true },
};

export default hayBale;
