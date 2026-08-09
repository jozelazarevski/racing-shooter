// PALM — the coastal / oasis tree. A leaning trunk and six drooping fronds.

import * as THREE from 'three';
import { PropTemplate, cylinderAt, standard, mergeGeoms, beam } from './types';

const frond = (angle: number) => {
  // a tapered blade, tilted down and out from the crown
  const g = beam(0.55, 0.07, 2.9, 0, 0, 1.45, 0.42, 0, 0);
  g.rotateY(angle);
  g.translate(0, 4.5, 0);
  return g;
};

const palm: PropTemplate = {
  id: 'palm',
  name: 'Palm',
  category: 'flora',
  description: 'Leaning trunk, six fronds. Solid trunk.',

  build: () => [
    {
      key: 'trunk',
      geometry: (() => {
        // stacked segments with a slight lean, which is what stops a palm
        // reading as a lamp post with a hat
        const segs = [];
        for (let i = 0; i < 7; i++) {
          const t = i / 7;
          const g = cylinderAt(0.2 - t * 0.06, 0.24 - t * 0.06, 0.68, 9, i * 0.62);
          g.translate(Math.sin(t * 1.5) * 0.35, 0, 0);
          segs.push(g);
        }
        return mergeGeoms(segs);
      })(),
      material: standard(0x8a7350, { flatShading: false }),
      castShadow: true,
    },
    {
      key: 'crown',
      geometry: mergeGeoms([0, 1, 2, 3, 4, 5].map((i) => frond((i / 6) * Math.PI * 2))),
      material: standard(0xffffff),
      castShadow: true,
      tint: (c) => new THREE.Color().setHSL(0.27, 0.52, 0.3).offsetHSL(0, 0, c.rng.centered(0.04)),
    },
  ],

  physics: {
    shape: (s) => ({ kind: 'cylinder', halfHeight: 2.2 * s, radius: 0.28 * s, centerY: 2.2 * s }),
    solid: true,
    massKg: 480,
  },

  authoring: {
    scale: [0.9, 1.5], defaultScale: 1.1,
    avoidSurfaces: ['snow', 'ice'], minRoadDist: 10, randomYaw: true,
  },
};

export default palm;
