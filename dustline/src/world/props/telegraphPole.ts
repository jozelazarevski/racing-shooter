// TELEGRAPH POLE — the thing you plant in a LINE.
//
// NO v1 EQUIVALENT. IGNITE RALLY has guard fences, bollards and lamp posts and
// nothing that runs off across country, so this is new, built in the idiom of
// the surrounding library.
//
// It is the only component in the set whose job is done by the SECOND one. A
// single pole in a field is a stick; a dozen of them stepping away over a rise
// at even spacing is the strongest depth cue a landscape can be given, and it
// costs two draw calls for the whole run. Everything about the file is bent
// toward being copied twelve times:
//
//  - TWO PARTS, not five. Pole, cap, arms, braces and step bolts are all one
//    creosoted timber colour, so they weld into one buffer; only the ceramic
//    insulators need a second. A line of twelve is then 2 draw calls, not 60.
//  - NO RANDOM YAW, and a scale range of +-8%. Poles in a run were put in by
//    the same gang on the same day: they are square to the line and the same
//    height. Jittered rotation turns a telegraph line into a scatter of dead
//    trees with planks nailed on, which is the exact failure this component
//    exists to avoid.
//
// NO WIRES. A wire needs to know where the NEXT pole is, and a component is
// built once and instanced — it cannot see its neighbours, and a catenary baked
// into the geometry would be right at one spacing and wrong at every other. If
// wires arrive they belong to whatever places the run, not to the pole.

import * as THREE from 'three';
import { PropTemplate, standard, mergeGeoms, beam, cylinderAt, coneAt } from './types';
import { strut } from '../../templates/geometry';

const ARM_LO = 6.7, ARM_HI = 7.45;   // crossarm centres
const ARM_T = 0.11;                  // arm thickness, so an insulator sits on ARM + half

/** Insulators standing on a crossarm: a ceramic body and a wider skirt, which
 *  is the silhouette that reads at 60 m — a plain peg reads as a nail.
 *
 *  480 TRIANGLES, AND THE FILE'S OWN HEADER SAYS WHY THAT WAS ABSURD. This
 *  component is built to be planted twelve at a time; at 26 poles the ten
 *  insulators on each were 12,480 triangles of the frame — more than the entire
 *  horizon — for ten objects 15 cm tall on an 8.2 m pole. The closest the road
 *  ever comes is `minRoadDist` 6 m, which with 7 m of pole above the car is a
 *  slant of 8 m, and at 8 m a 15 cm skirt is 15 px.
 *
 *  Two changes, both of them removing geometry that cannot be seen from a road:
 *
 *  SIX SIDES -> FOUR. At 8 m the chord error goes from 1 cm to 2.2 cm, which is
 *  1.3 px to 2.8 px, and beyond 15 m neither is resolvable at all. The
 *  silhouette this comment is about — narrow body, wider skirt — is untouched,
 *  and `randomYaw: false` means every pole in a run presents the same face, so
 *  a four-sided peg reads as a peg rather than rotating through its corners.
 *
 *  THE BODY LOSES ITS CAPS. Both of them are coincident with another surface
 *  rather than merely hidden: the bottom disc sits exactly on the crossarm's
 *  top face (`ARM + ARM_T/2` is that face), and the top disc is coplanar with,
 *  and inside, the skirt's own top disc. They were two z-fighting pairs, and
 *  removing them is a fix as much as a saving. The skirt keeps both of its caps
 *  — the underside is what you see when the line passes over the road. */
function insulators(y: number, xs: number[]) {
  return xs.flatMap((x) => [
    // openEnded: the 6th argument. Base at `y`, like `cylinderAt`.
    new THREE.CylinderGeometry(0.05, 0.062, 0.15, 4, 1, true)
      .translate(x, y + 0.075, 0),
    cylinderAt(0.075, 0.075, 0.05, 4, y + 0.1).translate(x, 0, 0),
  ]);
}

const telegraphPole: PropTemplate = {
  id: 'telegraphPole',
  name: 'Telegraph pole',
  category: 'trackside',
  description: 'Creosoted pole with two crossarms and ten insulators, 8.2 m. Solid. Plant in lines.',

  build: () => [
    {
      key: 'timber',
      geometry: mergeGeoms([
        cylinderAt(0.11, 0.17, 8.0, 8, 0),                       // tapered shaft
        coneAt(0.115, 0.2, 8, 8.0),                              // weathered top
        beam(2.0, ARM_T, 0.13, 0, ARM_LO, 0),                    // lower crossarm
        beam(1.5, ARM_T, 0.13, 0, ARM_HI, 0),                    // upper, shorter
        // Diagonal braces under each arm. Built from their real endpoints
        // rather than posed with an Euler — the reason `strut` exists.
        ...[-1, 1].flatMap((sg) => [
          strut([sg * 0.78, ARM_LO - 0.05, 0], [0, ARM_LO - 0.62, 0], 0.035, 4),
          strut([sg * 0.6, ARM_HI - 0.05, 0], [0, ARM_HI - 0.5, 0], 0.032, 4),
        ]),
        // step bolts: two pegs, and the only thing on the pole that gives it a
        // human scale from close up
        beam(0.34, 0.035, 0.035, 0, 2.6, 0),
        beam(0.34, 0.035, 0.035, 0, 3.35, 0),
      ]),
      material: standard(0x5b4632, { roughness: 1 }),
      castShadow: true,
    },
    {
      key: 'insulators',
      geometry: mergeGeoms([
        ...insulators(ARM_LO + ARM_T / 2, [-0.85, -0.5, -0.15, 0.15, 0.5, 0.85]),
        ...insulators(ARM_HI + ARM_T / 2, [-0.6, -0.22, 0.22, 0.6]),
      ]),
      // Glazed porcelain: the one part of the pole that is not matte, and the
      // glint off the top of a line is most of what makes it visible against a
      // bright sky.
      material: standard(0xd9e2e4, { roughness: 0.25, metalness: 0.1, flatShading: false }),
    },
  ],

  physics: {
    // Radius 0.2 rather than the shaft's 0.17: a car meeting a pole should stop
    // at the wood, and a collider trimmed exactly to the taper lets the bumper
    // visibly enter it before anything happens.
    shape: (s) => ({ kind: 'cylinder', halfHeight: 4.1 * s, radius: 0.2 * s, centerY: 4.1 * s }),
    solid: true,
    // COVERAGE — the pole. The crossarms and wire are overhead.
    coverage: 'trunk',
    massKg: 450,
  },

  authoring: {
    scale: [0.92, 1.08],
    defaultScale: 1,
    minRoadDist: 6,
    randomYaw: false,
    previewDist: 22,
  },
};

export default telegraphPole;
