// JETTY — a timber walkway on piles, with fingers off it.
//
// SHAPE FROM IGNITE RALLY: the pontoon, fingers and piles of
// `Track._buildMarina` — a 3.4 m walkway deck, 14 m fingers projecting seaward
// at an 8.6 m pitch, three piles under each. The dimensions and the two
// timber tones are its, so a jetty here and a marina there are the same
// structure at different lengths.
//
// `shore` placement, not `water`: it stands on the BED, so its base belongs on
// the ground and putting it at the waterline would leave it hovering. The
// piles are cut long and driven well below y = 0 for the same reason a real
// one is — the bed is not flat, and legs that stop exactly at the modelled
// depth leave a jetty on tiptoe over the first dip.
//
// Placed by hand it runs out along its own +Z, so rotate it to face the water.

import * as THREE from 'three';
import { PropTemplate, standard } from './types';
import { bundle } from './kit';

/** v1's marina constants. */
const FLEN = 14;      // finger length
const PITCH = 8.6;    // finger pitch along the pontoon
const RUN = 22;       // how much walkway this component carries

const jetty: PropTemplate = {
  id: 'jetty',
  name: 'Jetty',
  category: 'marine',
  description: '22 m timber walkway with two fingers, on piles. Runs out along +Z. Solid.',

  build: () => [
    {
      key: 'deck',
      geometry: bundle([
        // the walkway itself — the marina's `bw`, 3.4 x 0.42
        new THREE.BoxGeometry(3.4, 0.42, RUN).translate(0, 1.71, RUN / 2 - 2),
        // two fingers, at the marina's own pitch and length
        ...[-1, 1].map((sg) => new THREE.BoxGeometry(FLEN, 0.5, 2.2)
          .translate(sg * (FLEN / 2 + 1.7), 1.7, PITCH)),
      ]),
      material: standard(0x8a6a44, { roughness: 1 }),
      castShadow: true,
      tint: (c) => new THREE.Color(0x8a6a44).offsetHSL(0, c.rng.centered(0.04), c.rng.centered(0.06)),
    },
    {
      key: 'piles',
      // three under each finger, plus a row down the walkway
      geometry: bundle([
        ...[-1, 1].flatMap((sg) => [0, 1, 2].map((k) => {
          const g = new THREE.CylinderGeometry(0.22, 0.26, 6.8, 6);
          return g.translate(sg * (2.4 + k * (FLEN / 2.6)), -1.4, PITCH);
        })),
        ...[-0.5, 5, 11, 17].map((z) => new THREE.CylinderGeometry(0.22, 0.26, 6.8, 6)
          .translate(0, -1.4, z)),
      ]),
      material: standard(0x5f4a30, { roughness: 1 }),
      castShadow: true,
    },
  ],

  physics: {
    // The walkway, not the fingers, at deck height so a car ramps onto it
    // rather than into it — AND OFFSET ALONG +Z, because the deck runs out from
    // the origin instead of standing on it. This shipped without the offset:
    // 22 m of jetty with its hitbox centred on the shore end, half of it in
    // open water and the seaward half of the deck not solid at all. It is the
    // reason `centerX`/`centerZ` exist on `PhysicsShape`; the geometry puts the
    // walkway from z = -2 to z = 20, so its middle is at 9.
    shape: (s) => ({
      kind: 'box',
      halfExtents: [1.7 * s, 0.21 * s, (RUN / 2) * s],
      centerY: 1.71 * s,
      centerZ: (RUN / 2 - 2) * s,
    }),
    solid: true,
    massKg: 12000,
  },

  authoring: {
    scale: [0.9, 1.2], defaultScale: 1,
    placement: 'shore', shoreBand: 4,
    minRoadDist: 8, randomYaw: true, previewDist: 34,
  },
};

export default jetty;
