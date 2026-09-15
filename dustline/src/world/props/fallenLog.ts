// FALLEN LOG — a trunk lying across the ground. Solid, and oriented along its
// own local X, so rotating it is how you decide whether it blocks a line or
// runs beside it.
//
// SHAPE FROM IGNITE RALLY: nothing, and that is the honest answer. v1 builds
// logs in `_buildForestFloorDecor(m4)` (`src/world/flora.js`) as a single
// 2.8 m cylinder lying on its side — shorter, plainer, and with no broken-off
// length beside it. The geometry here is better and it is untouched.
//
// WHAT DID COME ACROSS IS v1'S MOSS RULE: "some logs moss over toward the
// foliage tone", two in five of them, lerped 0.45 of the way. It is the one
// thing in v1's decor pass that says a log has been lying there for years
// rather than having been dropped off a lorry last week, and it costs nothing.
//
// The scalar is also a correction. Instance colour MULTIPLIES the material
// colour, so the old tint — this file's own brown, returned a second time —
// rendered 0x6a5540 squared. v1's idiom is `col.setScalar(0.8 + r*0.35)`,
// which is what is here now, and the moss lerp rides on top of it exactly as
// it does in v1.

import * as THREE from 'three';
import { PropTemplate, standard, mergeGeoms, cylinderAt } from './types';

/** v1 lerps toward the world's `foliageLow`. There is no theme on a component
 *  here, so this is a fixed green — and note it is a MULTIPLIER, like every
 *  instance colour: it pulls red and blue down and leaves green alone, rather
 *  than painting the log green. */
const MOSS = new THREE.Color(0.45, 0.95, 0.4);

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
    tint: (c) => {
      const col = new THREE.Color().setScalar(0.8 + c.rng.float() * 0.35);
      return c.rng.float() < 0.4 ? col.lerp(MOSS, 0.45) : col;
    },
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
