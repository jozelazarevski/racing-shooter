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

import { PropTemplate, standard, mergeGeoms, beam, cylinderAt, coneAt } from './types';
import { strut } from './kit';

const ARM_LO = 6.7, ARM_HI = 7.45;   // crossarm centres
const ARM_T = 0.11;                  // arm thickness, so an insulator sits on ARM + half

/** Insulators standing on a crossarm: a ceramic body and a wider skirt, which
 *  is the silhouette that reads at 60 m — a plain peg reads as a nail. */
function insulators(y: number, xs: number[]) {
  return xs.flatMap((x) => [
    cylinderAt(0.05, 0.062, 0.15, 6, y).translate(x, 0, 0),
    cylinderAt(0.075, 0.075, 0.05, 6, y + 0.1).translate(x, 0, 0),
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
