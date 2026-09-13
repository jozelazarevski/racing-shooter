// BUS SHELTER — the roadside three-sided box with a bench in it.
//
// NO v1 EQUIVALENT. IGNITE RALLY dresses its streets with stalls, produce,
// barrels and bollards and has nothing for the ROAD between the villages, so
// this is new, built in the idiom of the surrounding library. It earns its
// place by being the only thing in the set that implies a timetable: a village
// with a bus stop on the road out of it is connected to somewhere else, and
// that is a fact about the WORLD that no amount of cottages states.
//
// Three sides and open to the road, deliberately. A four-sided shelter is a
// hut — the library already has one — and the open face is what makes the
// bench inside visible at speed, which is the only detail on the object that
// anybody driving past will actually resolve.
//
// ORIENTATION: local +Z is the OPEN side, so an instance must face the road.
// That is why it does not take a random yaw; see `authoring`.

import { PropTemplate, standard, mergeGeoms, beam } from './types';

const busShelter: PropTemplate = {
  id: 'busShelter',
  name: 'Bus shelter',
  category: 'trackside',
  description: 'Three-sided roadside shelter with a bench, 3.5 x 2.1 m over the roof, 2.4 m tall. Solid.',

  build: () => [
    {
      key: 'shell',
      geometry: mergeGeoms([
        beam(3.2, 0.14, 1.8, 0, 0.07, 0),                       // concrete pad
        beam(3.0, 2.0, 0.12, 0, 1.14, -0.78),                   // back wall
        beam(0.12, 2.0, 1.5, -1.44, 1.14, -0.09),               // end panels
        beam(0.12, 2.0, 1.5, 1.44, 1.14, -0.09),
        // A stub of the open face at each end, so the front reads as a FRAME
        // rather than as two loose walls with a lid across them.
        beam(0.5, 2.0, 0.12, -1.25, 1.14, 0.6),
        beam(0.5, 2.0, 0.12, 1.25, 1.14, 0.6),
      ]),
      material: standard(0xcac2b0, { roughness: 0.95 }),
      castShadow: true,
    },
    {
      key: 'roof',
      // Tilted 4 deg so rain runs off toward the road and, more usefully, so
      // the sheet catches a different light from the walls under it — a flat
      // lid at the same angle as the pad disappears into the box.
      geometry: mergeGeoms([
        beam(3.5, 0.1, 2.1, 0, 2.24, 0.05, -0.07, 0, 0),
        beam(3.5, 0.16, 0.1, 0, 2.12, 1.06),                    // front fascia
      ]),
      material: standard(0x7d848a, { roughness: 0.7, flatShading: false }),
      castShadow: true,
    },
    {
      key: 'bench',
      geometry: mergeGeoms([
        beam(2.5, 0.08, 0.2, 0, 0.5, -0.42),                    // two seat slats
        beam(2.5, 0.08, 0.2, 0, 0.5, -0.16),
        beam(2.5, 0.08, 0.16, 0, 0.92, -0.66),                  // back rail
        beam(0.1, 0.42, 0.5, -1.1, 0.29, -0.29),                // brackets
        beam(0.1, 0.42, 0.5, 1.1, 0.29, -0.29),
      ]),
      material: standard(0x8f7550, { roughness: 1 }),
      castShadow: true,
    },
  ],

  physics: {
    // The full footprint, INCLUDING the open side. The shelter is hollow and
    // the collider is not, which is on purpose: a hollow collider means a car
    // that clips the corner ends up parked inside a 1.5 m box with the roof
    // through its windscreen, and there is no version of that which is better
    // than being stopped at the wall.
    shape: (s) => ({ kind: 'box', halfExtents: [1.75 * s, 1.2 * s, 0.95 * s], centerY: 1.2 * s }),
    solid: true,
    massKg: 1800,
  },

  authoring: {
    scale: [0.95, 1.1],                                          // a bus shelter is a bus shelter
    defaultScale: 1,
    minRoadDist: 8,
    // NO RANDOM YAW. The open face has to point at the road; scattered with a
    // random rotation, half of them would be standing with their backs to it,
    // which is the one thing about this object anyone would notice.
    randomYaw: false,
  },
};

export default busShelter;
