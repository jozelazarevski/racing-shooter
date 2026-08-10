// CATTLE GRID — bars over a pit across a lane, with the side rails that stop
// stock walking round it. Lane runs along +Z, the same convention as the two
// bridges, so a grid drops straight onto a spur mouth.
//
// SHAPE FROM IGNITE RALLY: `Track._spurDressing` (`src/track.js` 6927), the
// cattle grid at the mouth of every crossroads spur. Ported verbatim:
//
//   five bars, 9.4 across x 0.18 x 0.34, at a pitch of 0.85
//   gate post   0.55 x 2.6 x 0.55, timber 0x6b4a2a
//   rail        3.0 x 0.16 x 0.14
//
// v1 lays its bars at `roadY - 0.02` — flush with the surface, not standing on
// it — and that is kept: the bars' tops sit 0.09 above the component's base,
// which is a kerb lip, not a ramp.
//
// WHAT V1 DOES NOT HAVE is the pit. Its grid is five bars painted on a road,
// which is right when the thing is 30 m away at the end of a spur and wrong
// when you drive over it. A grid whose gaps show the ground through them is a
// ladder lying in a field, so there is a dark void under the bars here.

import * as THREE from 'three';
import { PropTemplate, standard, mergeGeoms, beam } from './types';

const BAR_W = 9.4;           // v1
const BAR_H = 0.18;          // v1
const BAR_D = 0.34;          // v1
const PITCH = 0.85;          // v1
const BARS = 5;              // v1
const RUN = BARS * PITCH;    // 4.25 — the pit, mouth to mouth
const TOP = BAR_H / 2;       // bar tops 0.09 proud, v1's flush-ish grid

const cattleGrid: PropTemplate = {
  id: 'cattleGrid',
  name: 'Cattle grid',
  category: 'trackside',
  description: 'Five-bar grid over a pit, 9.4 m across a lane running +Z. Drive over it.',

  build: () => [
    {
      key: 'pit',
      // Sunk below the component's base. Geometry under y = 0 is normal here —
      // the jetty's piles do the same — and it is what makes the gaps between
      // the bars read as a hole instead of as grass.
      geometry: mergeGeoms([
        beam(BAR_W + 0.5, 1.0, RUN + 0.4, 0, -0.5, 0),
      ]),
      material: standard(0x25231f, { roughness: 1 }),
    },
    {
      key: 'bars',
      geometry: mergeGeoms(
        Array.from({ length: BARS }, (_, k) =>
          beam(BAR_W, BAR_H, BAR_D, 0, TOP - BAR_H / 2, -RUN / 2 + (k + 0.5) * PITCH)),
      ),
      material: standard(0x6e7176, { roughness: 0.6, metalness: 0.3, flatShading: false }),
      castShadow: true,
    },
    {
      key: 'kerbs',
      // The concrete frame the bars land on, across both mouths and down both
      // sides. Without it the bars end in mid-air at the pit edge.
      geometry: mergeGeoms([
        ...[-1, 1].map((sg) => beam(BAR_W + 0.9, 0.4, 0.45, 0, TOP - 0.2, sg * (RUN / 2 + 0.22))),
        ...[-1, 1].map((sg) => beam(0.45, 0.4, RUN + 0.9, sg * (BAR_W / 2 + 0.22), TOP - 0.2, 0)),
      ]),
      material: standard(0xa9a498, { roughness: 1 }),
      castShadow: true,
      tint: (c) => new THREE.Color(0xa9a498).offsetHSL(0, 0, c.rng.centered(0.05)),
    },
    {
      key: 'rails',
      // v1's gate posts and rails, at the four corners of the pit, fencing the
      // grid off so nothing walks round the end of it.
      geometry: mergeGeoms([-1, 1].flatMap((sx) => [
        ...[-1, 1].map((sz) => beam(0.55, 2.6, 0.55, sx * (BAR_W / 2 + 0.5), 1.3, sz * (RUN / 2 + 0.4))),
        ...[0.75, 1.5].map((y) => beam(0.16, 0.14, RUN + 0.8, sx * (BAR_W / 2 + 0.5), y, 0)),
      ])),
      material: standard(0x6b4a2a, { roughness: 0.95 }),   // v1's timber
      castShadow: true,
    },
  ],

  physics: {
    // A SLAB AT BAR HEIGHT, for the reason `jetty.ts` gives and this component
    // needs most of all: you DRIVE OVER a cattle grid. A box filling the pit
    // is a block of concrete in the road; a box at bar height with nothing
    // under it is exactly what the bars are — a surface over a void.
    //
    // It spans the kerbs as well as the bars, so the frame is not a lip you
    // catch a wheel on. The side rails get no collider: 0.55 m timber posts
    // 5.2 m off the lane centreline are not what stops a car here, and a box
    // wide enough to include them would seal the lane.
    shape: (s) => ({
      kind: 'box',
      halfExtents: [(BAR_W / 2 + 0.45) * s, (TOP / 2) * s, (RUN / 2 + 0.45) * s],
      centerY: (TOP / 2) * s,
    }),
    solid: true,
    // Hollow section bars, not solid billets: five 9.4 m solid steel bars of
    // this cross-section would weigh 22 tonnes on their own, which is not what
    // anybody drops into a farm lane.
    massKg: 3500,
  },

  authoring: {
    scale: [0.9, 1.1], defaultScale: 1,
    minRoadDist: 0, randomYaw: false,
  },
};

export default cattleGrid;
