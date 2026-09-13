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
// WHAT CHANGED IN THE PORT. Two things, and the second is the interesting one.
//
// v1's belfry is a MeshBasicMaterial box — an unlit block of colour standing in
// for a lit lantern stage, so it glows at night. dustline has no unlit material
// in the library, so it is an emissive standard material at the same tone,
// which is the substitution the lighthouse's lamp already makes.
//
// AND THE SHAFT IS NOT A BARE BOX. The port was faithful and the result was a
// featureless 30 m slab with a yellow band and a black cap — because v1 leans
// the whole reading of this tower on `stoneTexture()`, a masonry map dustline
// does not apply here, and on only ever being seen at distance across an old
// town. Rendered on its own it is the weakest thing in the library.
//
// So the shaft keeps v1's exact massing — 7.4 x 30, cornice at 35.2, spire at
// 40.4, nothing moved — and gains the details a tower of that height cannot be
// read without: a plinth, string courses at the stages, corner pilasters, and
// belfry openings on all four faces. Those are EDGES, which is the same
// argument the v1 house table makes about why its dwellings carry two to three
// times the parts of the ones they replaced: "at the distance a village is seen
// it is the number of EDGES catching the light that separates a house from a
// box, not the smoothness of any one of them."

import * as THREE from 'three';
import { PropTemplate, standard, mergeGeoms, beam } from './types';

const campanile: PropTemplate = {
  id: 'campanile',
  name: 'Campanile',
  category: 'settlement',
  description: 'Free-standing stone bell tower, 7.4 m shaft on a 9.4 m cornice, 45 m to the spire tip. Solid.',

  build: () => [
    {
      key: 'shaft',
      geometry: mergeGeoms([
        new THREE.BoxGeometry(7.4, 30, 7.4).translate(0, 15, 0),
        // plinth
        new THREE.BoxGeometry(8.6, 1.4, 8.6).translate(0, 0.7, 0),
        new THREE.BoxGeometry(8.0, 0.4, 8.0).translate(0, 1.6, 0),
        // corner pilasters, standing proud the whole height — the vertical
        // that stops a 30 m face reading as one flat plane
        ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].flatMap(([sx, sz]) => [
          beam(1.1, 28.4, 1.1, sx * 3.5, 15.9, sz * 3.5),
        ]),
        // string courses at the stages, where a real campanile has them
        ...[8.5, 15.5, 22.5].map((y) => new THREE.BoxGeometry(8.0, 0.45, 8.0).translate(0, y, 0)),
      ]),
      material: standard(0x9d9585, { roughness: 0.92 }),
      castShadow: true,
    },
    {
      key: 'openings',
      // Tall recessed panels up the shaft and the belfry's own arched voids.
      // Inset rather than cut: a real hole means a shell, and a shell is a lot
      // of triangles for something read from two hundred metres.
      geometry: mergeGeoms([
        ...[1, -1].flatMap((sg) => [
          ...[11.5, 18.5].map((y) => beam(1.5, 3.4, 0.25, 0, y, sg * 3.75)),
          ...[11.5, 18.5].map((y) => beam(0.25, 3.4, 1.5, sg * 3.75, y, 0)),
        ]),
        // the belfry openings, one per face
        ...[1, -1].flatMap((sg) => [
          beam(3.2, 4.0, 0.3, 0, 32.4, sg * 4.15),
          beam(0.3, 4.0, 3.2, sg * 4.15, 32.4, 0),
        ]),
      ]),
      material: standard(0x2e2b28, { roughness: 0.9 }),
    },
    {
      key: 'belfry',
      // "an open lantern stage, lit, which is what makes it read at night" —
      // now behind the openings above rather than instead of them, so the glow
      // reads as light coming OUT of a stage instead of as a painted band.
      geometry: mergeGeoms([
        new THREE.BoxGeometry(8.2, 5.0, 8.2).translate(0, 32.4, 0),
        new THREE.BoxGeometry(8.8, 0.5, 8.8).translate(0, 29.9, 0),
      ]),
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
    // THE SHAFT, AND IT IS SQUARE. This was a cylinder of radius 5.2 — v1's own
    // solid radius, trimmed — and the note that used to sit here argued a disc
    // round a square tower is close enough. Measured, it is half a metre of
    // invisible wall off each face and 1.5 m off each corner, on a tower that
    // stands in a village square where cars come past it on all four sides. A
    // box is the shape the building actually is.
    shape: (s) => ({
      kind: 'box',
      halfExtents: [3.7 * s, 17.6 * s, 3.7 * s],
      centerY: 17.6 * s,
    }),
    solid: true,
    // COVERAGE — the shaft. The cornice oversails it 40 m up.
    coverage: 'partial',
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
