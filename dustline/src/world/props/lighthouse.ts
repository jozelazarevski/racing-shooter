// LIGHTHOUSE.
//
// SHAPE FROM IGNITE RALLY: `Track._buildLighthouse` in `src/track.js` at the
// repository root, carried across part for part. Its own comment says why it
// looks like this:
//
//   "built the way the reference draws one: a battered stone plinth, a banded
//    tapering tower, a GALLERY on corbels with a railing you can count the
//    stanchions on, a glazed lantern room with astragals, and a domed cap
//    under a finial. The old one was four primitives — a cone on a cylinder —
//    and read as a traffic bollard from the quay."
//
// dustline's first lighthouse was five primitives with three painted hoops,
// which is the same bollard with stripes on. Everything rigid bundles down to
// five parts, so a coastline full of them is five draw calls.

import * as THREE from 'three';
import { PropTemplate, standard } from './types';
import { bundle, strut } from './kit';

const SEG = 20;
const at2 = (geo: THREE.BufferGeometry, yy: number) => geo.translate(0, yy, 0);
const galY = 13.7;
const galR = 2.45;

const lighthouse: PropTemplate = {
  id: 'lighthouse',
  name: 'Lighthouse',
  category: 'marine',
  description: 'Banded tower with a corbelled gallery and a glazed lantern, 18 m. Solid.',

  build: () => [
    {
      key: 'shaft',
      // plinth, shaft — the two navigation bands are their own part below
      geometry: bundle([
        at2(new THREE.CylinderGeometry(3.05, 3.5, 1.1, SEG), 0.55),
        at2(new THREE.CylinderGeometry(2.85, 3.05, 0.35, SEG), 1.28),
        at2(new THREE.CylinderGeometry(1.72, 2.85, 12.2, SEG), 7.55),
      ]),
      material: standard(0xf2efe6, { roughness: 0.7 }),
      castShadow: true,
    },
    {
      key: 'bands',
      geometry: bundle([
        at2(new THREE.CylinderGeometry(2.45, 2.6, 2.0, SEG), 5.1),
        at2(new THREE.CylinderGeometry(1.99, 2.07, 1.7, SEG), 11.3),
      ]),
      material: standard(0xc0392b, { roughness: 0.6 }),
    },
    {
      key: 'gallery',
      // corbel ring and deck
      geometry: bundle([
        at2(new THREE.CylinderGeometry(2.35, 1.7, 0.5, SEG), galY - 0.35),
        at2(new THREE.CylinderGeometry(galR, galR, 0.18, SEG), galY),
      ]),
      material: standard(0x8e8778, { roughness: 1 }),
      castShadow: true,
    },
    {
      key: 'rail',
      // sixteen stanchions and two handrails, from their real endpoints — and
      // the door, which is what gives the tower a scale you can read
      geometry: bundle([
        ...Array.from({ length: 16 }, (_, k) => {
          const an = (k / 16) * Math.PI * 2;
          const px = Math.sin(an) * (galR - 0.14), pz = Math.cos(an) * (galR - 0.14);
          const an2 = ((k + 1) / 16) * Math.PI * 2;
          const qx = Math.sin(an2) * (galR - 0.14), qz = Math.cos(an2) * (galR - 0.14);
          return [
            strut([px, galY, pz], [px, galY + 0.95, pz], 0.045, 5),
            strut([px, galY + 0.45, pz], [qx, galY + 0.45, qz], 0.04, 4),
            strut([px, galY + 0.95, pz], [qx, galY + 0.95, qz], 0.04, 4),
          ];
        }).flat(),
        new THREE.BoxGeometry(1.05, 1.9, 0.3).translate(0, 2.5, 2.72),
      ]),
      material: standard(0x2b2f34, { roughness: 0.45, metalness: 0.5 }),
    },
    {
      key: 'lantern',
      // glazing between vertical astragals, capped by a dome and a finial
      geometry: bundle([
        ...Array.from({ length: 10 }, (_, k) => {
          const an = (k / 10) * Math.PI * 2;
          const px = Math.sin(an) * 1.56, pz = Math.cos(an) * 1.56;
          return strut([px, galY + 0.2, pz], [px, galY + 2.3, pz], 0.06, 5);
        }),
        at2(new THREE.CylinderGeometry(1.68, 1.68, 0.2, 12), galY + 2.35),
        at2(new THREE.SphereGeometry(1.62, 14, 7, 0, Math.PI * 2, 0, Math.PI / 2.4), galY + 2.4),
        at2(new THREE.SphereGeometry(0.24, 10, 8), galY + 3.62),
        strut([0, galY + 3.6, 0], [0, galY + 4.35, 0], 0.05, 5),
      ]),
      material: standard(0xc0392b, { roughness: 0.6 }),
      castShadow: true,
    },
    {
      key: 'lamp',
      geometry: new THREE.CylinderGeometry(1.5, 1.55, 2.1, 12).translate(0, galY + 1.25, 0),
      // v1 uses MeshBasicMaterial here — it is the light, not a lit thing. This
      // keeps the standard material the rest of the library uses, and gets the
      // same read out of emissive.
      material: standard(0xffe9a0, {
        roughness: 0.2, emissive: 0xffd766, emissiveIntensity: 0.9,
      }),
    },
  ],

  physics: {
    shape: (s) => ({ kind: 'cylinder', halfHeight: 7 * s, radius: 3.0 * s, centerY: 7 * s }),
    solid: true,
    massKg: 600000,
  },

  authoring: {
    scale: [0.8, 1.2], defaultScale: 1,
    placement: 'shore', shoreBand: 14,
    minRoadDist: 20, randomYaw: true, previewDist: 44,
  },
};

export default lighthouse;
