// CAMPANILE — the bell tower, and the tallest thing in the library.
//
// SHAPE FROM IGNITE RALLY: `Track._buildCampanile` in `src/track.js` at the
// repository root, carried across part for part: a 30 m stone shaft, an open
// belfry stage, a cornice and a four-sided spire turned 45 deg so its ridges
// face the corners of the shaft. Its own comment says what it is FOR:
//
//   "The one landmark: a cathedral campanile beside the summit square, tall
//    enough to sit above the frontage from anywhere on the upper half of the
//    lap. Hand-placed rather than scattered, because 'visible from three
//    points on the route' is a placement requirement, not a density."
//
// That last sentence is why `minRoadDist` is 24 and the scale range is narrow.
// A landmark is a thing you navigate by, so two of them at different sizes on
// one track destroys the only property it has — you cannot tell whether the
// tower ahead is the near small one or the far big one, which is exactly the
// mistake a distance cue is supposed to prevent.
//
// WHAT CHANGED IN THE PORT, and only this: v1's belfry is a MeshBasicMaterial
// box — an unlit block of colour standing in for a lit lantern stage, so it
// glows at night. dustline has no unlit material in the library, so it is an
// emissive standard material at the same tone, which is the substitution the
// lighthouse's lamp already makes for the same reason.

import * as THREE from 'three';
import { PropTemplate, standard } from './types';

const campanile: PropTemplate = {
  id: 'campanile',
  name: 'Campanile',
  category: 'settlement',
  description: 'Free-standing stone bell tower, 7.4 m shaft on a 9.4 m cornice, 45 m to the spire tip. Solid.',

  build: () => [
    {
      key: 'shaft',
      geometry: new THREE.BoxGeometry(7.4, 30, 7.4).translate(0, 15, 0),
      material: standard(0x9d9585, { roughness: 0.92 }),
      castShadow: true,
    },
    {
      key: 'belfry',
      // "an open lantern stage, lit, which is what makes it read at night"
      geometry: new THREE.BoxGeometry(8.2, 5.0, 8.2).translate(0, 32.4, 0),
      material: standard(0xffc76a, {
        roughness: 0.35, emissive: 0xffc76a, emissiveIntensity: 0.85,
      }),
    },
    {
      key: 'cornice',
      geometry: new THREE.BoxGeometry(9.4, 0.9, 9.4).translate(0, 35.2, 0),
      material: standard(0x8e8778, { roughness: 1 }),
      castShadow: true,
    },
    {
      key: 'spire',
      // four-sided, rolled 45 deg so a ridge points at each corner of the
      // shaft rather than at each face — the pyramid reads as a pyramid from
      // the road instead of as a triangle.
      geometry: new THREE.ConeGeometry(6.2, 9.5, 4)
        .rotateY(Math.PI / 4)
        .translate(0, 40.4, 0),
      material: standard(0x33363c, { roughness: 0.7 }),
      castShadow: true,
    },
  ],

  physics: {
    // The shaft, up to the cornice. Radius 5.2 is v1's own solid radius of 5.4
    // trimmed to the 3.7 m half-width plus the cornice oversail — a cylinder
    // circumscribing a square tower already stops a car at the corners before
    // it reaches the wall, and making it any wider stops it in open air.
    shape: (s) => ({ kind: 'cylinder', halfHeight: 17.6 * s, radius: 5.2 * s, centerY: 17.6 * s }),
    solid: true,
    massKg: 1_800_000,
  },

  authoring: {
    scale: [0.85, 1.1],
    defaultScale: 1,
    minRoadDist: 24,
    randomYaw: true,
    previewDist: 118,
  },
};

export default campanile;
