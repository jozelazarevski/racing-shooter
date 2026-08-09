// QUAY STEPS — a flight of stone steps down the face of a quay to the water.
// The only way off the hard that is not a ladder or a fall, and the piece that
// makes a quay wall read as a place people work rather than a retaining wall.
//
// NO v1 EQUIVALENT. `_buildQuayside` dresses the quay and `_buildMarina` gets
// down to the water by gangway and slipway; neither cuts a stair. Built in the
// idiom of the surrounding library instead, on the quay wall's own numbers: the
// mole stone of `_buildLighthouse` (0x9a9282) for the masonry, and the same
// habit of cutting the mass well below y = 0 so the flight still reaches water
// when the terrain under it moves.
//
// Runs down along +Z, like the jetty. Rotate it to face the water; butt it
// against a `quayWall` run, which is what its open sides assume — a real stair
// of this kind is recessed INTO the quay, so it has no cheek walls of its own.

import * as THREE from 'three';
import { PropTemplate, standard, beam } from './types';
import { bundle } from './kit';

const N = 12;                 // steps in the flight
const RISE = 0.2;             // shallow and deep: these are worked in wet boots
const GOING = 0.32;           // with an armful, not run down
const W = 1.6;                // two abreast, no more
const LEN = N * GOING;        // 3.84 m of projection
const BOT = -RISE * N - 0.35; // the flight's own footing, -2.75

/** THE TIDE LINE, at -1.2. Everything below it is weeded, and the height is a
 *  guess in the only sense that matters — dustline has no tide, so this is
 *  where the water USUALLY is against a quay that stands about a metre proud of
 *  it. Without the band the flight is a clean grey stair running into the sea,
 *  which is the one thing harbour steps never are. */
const TIDE = -1.2;

/** The masonry: one block per tread, each cut from its own tread down to the
 *  footing and back to the end of the flight, so the flight is a solid mass and
 *  not a stack of floating slabs. */
function flight(): THREE.BufferGeometry[] {
  const out: THREE.BufferGeometry[] = [];
  for (let i = 1; i <= N; i++) {
    const top = -RISE * i;
    const z0 = (i - 1) * GOING;
    const d = LEN - z0;
    out.push(beam(W, top - BOT, d, 0, (top + BOT) / 2, z0 + d / 2));
  }
  // The footing, projecting past the bottom tread — a stair that stops dead at
  // the last riser looks sawn off, and this is where the boat comes alongside.
  out.push(beam(W + 0.3, 0.4, 1.0, 0, BOT + 0.2, LEN + 0.5));
  return out;
}

/** Weed on the drowned half: a facing skin 15 mm proud of the tread and the
 *  riser it belongs to. Proud, not coplanar — coplanar is z-fighting, which
 *  flickers on exactly the surfaces the camera passes closest to. */
function weed(): THREE.BufferGeometry[] {
  const out: THREE.BufferGeometry[] = [];
  for (let i = 1; i <= N; i++) {
    const top = -RISE * i;
    if (top > TIDE) continue;
    out.push(beam(W - 0.06, 0.03, GOING, 0, top + 0.015, (i - 0.5) * GOING));
    out.push(beam(W - 0.06, RISE, 0.03, 0, top + RISE / 2, (i - 1) * GOING - 0.015));
  }
  return out;
}

const quaySteps: PropTemplate = {
  id: 'quaySteps',
  name: 'Quay steps',
  category: 'marine',
  description: '12 stone steps down a quay face to the water, 1.6 x 3.9 m. Runs down along +Z.',

  build: () => [
    {
      key: 'stone',
      geometry: bundle(flight()),
      material: standard(0x9a9282, { roughness: 1 }),
      castShadow: true,
      tint: (c) => new THREE.Color(0x9a9282).offsetHSL(0, c.rng.centered(0.02), c.rng.centered(0.05)),
    },
    {
      key: 'weed',
      geometry: bundle(weed()),
      material: standard(0x4c5340, { roughness: 1 }),
    },
  ],

  physics: {
    // The mass, which is entirely BELOW the quay surface. Nothing here should
    // stop a car driving along the quay — the steps are a hole in it, not an
    // obstacle on it — but the stone is real to anything that ends up in the
    // water beside it, so the collider is the block it is cut from.
    shape: (s) => ({
      kind: 'box',
      halfExtents: [(W / 2) * s, (-BOT / 2) * s, (LEN / 2 + 0.5) * s],
      centerY: (BOT / 2) * s,
    }),
    solid: true,
    massKg: 18000,
  },

  authoring: {
    scale: [1, 1.1], defaultScale: 1,
    placement: 'shore', shoreBand: 3,
    minRoadDist: 6, randomYaw: false, previewDist: 12,
  },
};

export default quaySteps;
