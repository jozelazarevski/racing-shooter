// BEACON — the small navigation light on a plinth at the harbour mouth, on the
// end of a mole or on a rock off the point.
//
// THE LIGHTHOUSE AT A QUARTER SIZE, AND THAT IS THE WHOLE POINT. `lighthouse.ts`
// is v1's `Track._buildLighthouse` carried across part for part: battered
// plinth, banded tapering tower, gallery on corbels, glazed lantern with
// astragals, domed cap, finial. It is 18 m tall and it is a LANDMARK — one to a
// coastline, sited on a headland, visible from the far side of the bay. A
// harbour also needs the other thing: a 5.6 m light you put three of round the
// entrance, that reads at 40 m and at nothing further.
//
// So this is that same part list at a quarter of the size, not a different
// design — the same battered plinth, the same one red navigation band, the same
// corbelled gallery with a rail you can count, the same glazed lantern under a
// dome. Shrinking it also drops the detail honestly: eight stanchions instead
// of sixteen, six astragals instead of ten, because at a quarter of the
// diameter the extra ones are subpixel and cost the same triangles.
//
// THE PLINTH IS CUT BELOW y = 0, like the jetty's piles and the quay wall's
// face, so a beacon set at the water's edge or on the lip of a breakwater still
// has stone under it when the terrain moves.

import * as THREE from 'three';
import { PropTemplate, standard, cylinderAt } from './types';
import { bundle, strut } from '../../templates/geometry';

const SEG = 12;
const galY = 3.74;            // gallery deck
const galR = 0.72;
const TOP = 5.6;              // finial

const beacon: PropTemplate = {
  id: 'beacon',
  name: 'Beacon',
  category: 'marine',
  description: 'Harbour light on a battered stone plinth, 5.6 m — the lighthouse at a quarter size. Solid.',

  build: () => [
    {
      key: 'plinth',
      geometry: bundle([
        cylinderAt(1.02, 1.30, 2.0, 10, -1.1),        // driven under, see above
        cylinderAt(0.90, 1.02, 0.18, 10, 0.9),        // chamfer course
      ]),
      material: standard(0x8e8778, { roughness: 1 }),
      castShadow: true,
      tint: (c) => new THREE.Color(0x8e8778).offsetHSL(0, c.rng.centered(0.02), c.rng.centered(0.05)),
    },
    {
      key: 'shaft',
      geometry: cylinderAt(0.42, 0.72, 2.5, SEG, 1.08),
      material: standard(0xf2efe6, { roughness: 0.7 }),
      castShadow: true,
    },
    {
      key: 'band',
      // ONE band, not the lighthouse's two. A single band on a 2.5 m shaft is
      // a mark; two on it is a barber's pole.
      geometry: cylinderAt(0.585, 0.625, 0.55, SEG, 2.0),
      material: standard(0xc0392b, { roughness: 0.6 }),
    },
    {
      key: 'gallery',
      geometry: bundle([
        cylinderAt(0.74, 0.44, 0.22, SEG, galY - 0.32),   // corbel ring
        cylinderAt(galR, galR, 0.1, SEG, galY - 0.1),     // deck
      ]),
      material: standard(0x8e8778, { roughness: 1 }),
      castShadow: true,
    },
    {
      key: 'rail',
      // Eight stanchions and two rails, from their real endpoints — the same
      // construction as the lighthouse's sixteen, halved.
      geometry: bundle(Array.from({ length: 8 }, (_, k) => {
        const an = (k / 8) * Math.PI * 2;
        const px = Math.sin(an) * (galR - 0.07), pz = Math.cos(an) * (galR - 0.07);
        const an2 = ((k + 1) / 8) * Math.PI * 2;
        const qx = Math.sin(an2) * (galR - 0.07), qz = Math.cos(an2) * (galR - 0.07);
        return [
          strut([px, galY, pz], [px, galY + 0.6, pz], 0.028, 5),
          strut([px, galY + 0.3, pz], [qx, galY + 0.3, qz], 0.024, 4),
          strut([px, galY + 0.6, pz], [qx, galY + 0.6, qz], 0.024, 4),
        ];
      }).flat()),
      material: standard(0x2b2f34, { roughness: 0.45, metalness: 0.5 }),
    },
    {
      key: 'lantern',
      geometry: bundle([
        ...Array.from({ length: 6 }, (_, k) => {
          const an = (k / 6) * Math.PI * 2;
          const px = Math.sin(an) * 0.44, pz = Math.cos(an) * 0.44;
          return strut([px, galY + 0.05, pz], [px, galY + 1.0, pz], 0.04, 5);
        }),
        cylinderAt(0.52, 0.52, 0.1, 10, galY + 1.0),
        new THREE.SphereGeometry(0.5, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2.4)
          .translate(0, galY + 1.08, 0),
        new THREE.SphereGeometry(0.09, 8, 6).translate(0, galY + 1.5, 0),
        strut([0, galY + 1.48, 0], [0, TOP, 0], 0.025, 5),
      ]),
      material: standard(0xc0392b, { roughness: 0.6 }),
      castShadow: true,
    },
    {
      key: 'lamp',
      // Emissive rather than a real light, exactly as the lighthouse does it —
      // v1 uses MeshBasicMaterial here because it IS the light, not a lit
      // thing, and emissive gets the same read out of the standard material
      // that the rest of the library uses.
      geometry: cylinderAt(0.4, 0.42, 0.85, 10, galY + 0.1),
      material: standard(0xffe9a0, {
        roughness: 0.2, emissive: 0xffd766, emissiveIntensity: 0.9,
      }),
    },
  ],

  physics: {
    // Plinth to finial. The gallery is wider than the shaft but narrower than
    // the plinth, so the plinth's 1.3 m radius is the honest envelope for the
    // whole thing.
    shape: (s) => ({ kind: 'cylinder', halfHeight: (TOP / 2) * s, radius: 1.3 * s, centerY: (TOP / 2) * s }),
    solid: true,
    // Masonry plinth plus a light iron and glass top: a fiftieth of the
    // lighthouse's 600 t, which is roughly what a quarter of its height and a
    // quarter of its diameter comes to.
    massKg: 12000,
  },

  authoring: {
    scale: [0.85, 1.25], defaultScale: 1,
    placement: 'water', minDepth: 0.4,
    minRoadDist: 10, randomYaw: true, previewDist: 14,
  },
};

export default beacon;
