// HARBOUR CRANE — a small quayside derrick: a stayed king post on a stone
// plinth, a timber jib swung out over the water, and a hand winch at its foot.
//
// NO v1 EQUIVALENT as a crane, but not invented either. `track.js` builds
// exactly this arrangement twice at boat scale — the trawler's stern gantry
// and the "short derrick on the trawler" in `_buildMarina` — and both are
// struts posed from their real endpoints, which is the rule this follows. The
// timbers are the quayside cannon carriage's (0x6b4a2c) and the ironwork is the
// iron from the same block of `_buildQuayside` (0x25282c, metalness 0.65), so
// the crane is dressed out of the harbour's own kit.
//
// SMALL, DELIBERATELY. A container gantry is a different game; this is the
// derrick that lifts an engine out of a fishing boat — 6.9 m to the masthead,
// with the jib head 5.6 m out. That is one and a half car lengths of reach,
// which puts the hook over a boat lying alongside the quay it stands on.
//
// THE JIB SWINGS OUT ALONG +Z. Rotate it to point at the water. The stays run
// back over the land, which is the only way round a derrick can be rigged —
// they carry the whole load and they cannot be over the sea.

import * as THREE from 'three';
import { PropTemplate, standard, beam, cylinderAt } from './types';
import { bundle, strut } from './kit';

const MAST = 6.6;                       // masthead
const HEAD: number[] = [0, 5.2, 5.6];   // jib head — the working reach
const HOOK = 1.9;                       // where the block hangs, chest height

const harbourCrane: PropTemplate = {
  id: 'harbourCrane',
  name: 'Harbour crane',
  category: 'marine',
  description: 'Stayed timber derrick on a stone plinth, 6.9 m, reaching 5.6 m along +Z. Solid.',

  build: () => [
    {
      key: 'plinth',
      geometry: bundle([
        beam(1.9, 0.45, 1.9, 0, 0.225, 0),
        beam(2.2, 0.18, 2.2, 0, 0.09, 0),
      ]),
      material: standard(0x9a9282, { roughness: 1 }),
      castShadow: true,
      tint: (c) => new THREE.Color(0x9a9282).offsetHSL(0, c.rng.centered(0.02), c.rng.centered(0.05)),
    },
    {
      key: 'timber',
      geometry: bundle([
        cylinderAt(0.15, 0.21, MAST - 0.45, 8, 0.45),                  // king post
        strut([0, 0.95, 0.35], HEAD, 0.125, 8),                        // jib
        // The heel brace. Without it the jib meets the post at a point and the
        // whole derrick reads as two sticks leaning together — this is the
        // block the jib actually pivots in.
        strut([0, 0.6, 0.1], [0, 1.5, 0.85], 0.16, 6),
      ]),
      material: standard(0x6b4a2c, { roughness: 1 }),
      castShadow: true,
    },
    {
      key: 'iron',
      geometry: bundle([
        // two back stays, out over the land at 40 degrees either side of the
        // fore-and-aft line, and the topping lift that holds the jib up
        ...[-1, 1].map((sg) => strut([0, MAST, 0], [sg * 2.1, 0.5, -2.8], 0.055, 5)),
        strut([0, MAST, 0], HEAD, 0.05, 5),
        cylinderAt(0.24, 0.2, 0.22, 8, MAST - 0.04),                   // masthead cap
        // the fall, and the hook block on the end of it
        strut([HEAD[0], HEAD[1] - 0.1, HEAD[2]], [HEAD[0], HOOK, HEAD[2]], 0.026, 5),
        beam(0.3, 0.34, 0.22, HEAD[0], HOOK - 0.15, HEAD[2]),
        new THREE.TorusGeometry(0.16, 0.045, 5, 10)
          .rotateY(Math.PI / 2).translate(HEAD[0], HOOK - 0.44, HEAD[2]),
      ]),
      material: standard(0x25282c, { roughness: 0.4, metalness: 0.65 }),
      castShadow: true,
    },
    {
      key: 'winch',
      // Hand winch at the foot: a drum across the post, a pawl and a wheel.
      // Where the rope actually comes from — a derrick with a fall that runs
      // into the ground is a mast with a string on it.
      geometry: bundle([
        new THREE.CylinderGeometry(0.2, 0.2, 1.0, 10).rotateZ(Math.PI / 2).translate(0, 1.05, -0.55),
        ...[-1, 1].map((sg) => beam(0.12, 1.0, 0.5, sg * 0.55, 0.5, -0.55)),
        new THREE.TorusGeometry(0.34, 0.05, 5, 14)
          .rotateY(Math.PI / 2).translate(0.62, 1.05, -0.55),
        strut([0.62, 1.05, -0.55], [0.62, 1.36, -0.55], 0.04, 5),      // the handle
      ]),
      material: standard(0x3a3d42, { roughness: 0.5, metalness: 0.45 }),
      castShadow: true,
    },
  ],

  physics: {
    // The post and its plinth. The jib is 0.25 m of timber out at head height
    // with nothing under it, and a collider that swept its reach would be a
    // 5.6 m invisible cylinder standing on the quay in front of the crane.
    shape: (s) => ({ kind: 'cylinder', halfHeight: (MAST / 2) * s, radius: 1.1 * s, centerY: (MAST / 2) * s }),
    solid: true,
    massKg: 7000,
  },

  authoring: {
    scale: [0.9, 1.2], defaultScale: 1,
    placement: 'shore', shoreBand: 5,
    minRoadDist: 8, randomYaw: false, previewDist: 20,
  },
};

export default harbourCrane;
