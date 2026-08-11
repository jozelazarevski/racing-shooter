// FALLEN LOG — a trunk lying across the ground. Solid, and oriented along its
// own local X, so rotating it is how you decide whether it blocks a line or
// runs beside it.

import * as THREE from 'three';
import { PropTemplate, standard, mergeGeoms, cylinderAt } from './types';

const lying = (rTop: number, rBot: number, len: number, x: number) => {
  const g = cylinderAt(rTop, rBot, len, 9, 0);
  g.rotateZ(Math.PI / 2);
  g.translate(x, 0.42, 0);
  return g;
};

const fallenLog: PropTemplate = {
  id: 'fallenLog',
  name: 'Fallen log',
  category: 'terrain',
  description: 'Trunk lying across the ground. Solid; rotate it to block a line.',

  build: () => [{
    key: 'log',
    geometry: mergeGeoms([
      lying(0.42, 0.46, 4.4, 0),
      lying(0.2, 0.26, 1.1, 2.6),        // a broken-off length beside it
    ]),
    material: standard(0x6a5540, { flatShading: false }),
    castShadow: true,
    tint: (c) => new THREE.Color(0x6a5540).offsetHSL(0, 0, c.rng.centered(0.06)),
  }],

  physics: {
    // THE WHOLE LOG, AND IT IS NOT CENTRED ON THE ORIGIN. This was 4.6 m of
    // collider under a 7 m trunk, so a metre of timber at each end was scenery
    // you drove through — on the one prop in the library whose entire job is to
    // be lying across your line.
    //
    // The offset is the other half of it. `lying()` rolls a base-anchored
    // cylinder a quarter turn, which swings it out to one side rather than
    // turning it on the spot, so the main log runs x = -4.4 .. 0 and the broken
    // length beside it reaches +2.6. The mass sits at -0.9, and a collider
    // centred on the origin covered open ground at one end and left bare timber
    // at the other.
    shape: (s) => ({
      kind: 'box',
      halfExtents: [3.5 * s, 0.44 * s, 0.46 * s],
      centerY: 0.42 * s,
      centerX: -0.9 * s,
    }),
    solid: true,
    massKg: 800,
  },

  authoring: {
    scale: [0.8, 1.6], defaultScale: 1,
    avoidSurfaces: ['tarmac', 'ice'], minRoadDist: 9, randomYaw: true,
  },
};

export default fallenLog;
