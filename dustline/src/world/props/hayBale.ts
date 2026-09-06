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
    // LYING DOWN, AXIS ACROSS THE TRACK. `cylinderAt` is base-anchored — it
    // spans y = 0 .. 1.3 — so rolling it a quarter turn about Z swings it out
    // to x = -1.3 .. 0 rather than turning it on the spot. Without the 0.65
    // back the bale renders two thirds of a metre from where it was placed,
    // with its collider sitting on the empty side of the origin: you clip
    // through half a visible bale and hit an invisible one beside it.
    g.rotateZ(Math.PI / 2);
    g.translate(0.65, 0.75, 0);
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
