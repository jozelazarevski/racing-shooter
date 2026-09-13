// CONE — the lightest marker there is. Deliberately NOT solid: a traffic cone
// that stops a rally car is the single most immersion-breaking object a track
// can contain. It marks a line; it does not enforce one.

import * as THREE from 'three';
import { PropTemplate, standard, mergeGeoms, coneAt, boxAt, cylinderAt } from './types';

const cone: PropTemplate = {
  id: 'cone',
  name: 'Cone',
  category: 'trackside',
  description: 'Traffic cone. Marks a line, never blocks one — no collider.',

  build: () => [
    {
      key: 'body',
      geometry: mergeGeoms([boxAt(0.42, 0.05, 0.42, 0), coneAt(0.17, 0.62, 10, 0.04)]),
      material: standard(0xe4622a, { flatShading: false }),
      castShadow: true,
    },
    {
      key: 'band',
      geometry: cylinderAt(0.115, 0.135, 0.11, 10, 0.3),
      material: standard(0xf2ede0, { flatShading: false }),
    },
  ],

  physics: { shape: () => ({ kind: 'none' }), solid: false, massKg: 4 },

  authoring: { scale: [0.9, 1.1], defaultScale: 1, minRoadDist: 0, randomYaw: true },
};

export default cone;
