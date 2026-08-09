// ARCH GATEWAY — the town gate you drive through.
//
// SHAPE FROM IGNITE RALLY: `Track._buildArchGateway` in `src/track.js` at the
// repository root, carried across part for part. Two masonry piers, a voussoir
// ring between them, a storey of gatehouse carried over the top and a lantern
// hung under the keystone. Its own comment explains the ring:
//
//   "voussoir ring: a close-laid semicircle of wedge blocks over the opening.
//    Spacing matters — at nine blocks over a 35 u arc it read as loose rubble
//    rather than an arch, so they are laid nearly edge to edge."
//
// and the storey:
//
//   "the storey carried over the arch — this is a BUILDING you drive through,
//    so it is built as a short TERRACE of unit-width bays rather than one
//    stretched box, which is what makes it read as a gatehouse"
//
// WHAT THE PORT HAD TO PIN DOWN. v1 sizes the opening from the road it is
// standing on: `lat = widthAt(mid) + 1.5 + CAR_R + 0.3`, where `widthAt`
// returns the road HALF-width and `CAR_R` is 1.8. A component knows nothing
// about the road it will be placed beside, so that formula is evaluated once
// here against dustline's 14 m road — half-width 7 — and the result written
// down as a number. Every other dimension is v1's untouched.
//
// ORIENTATION: local +X spans the road, local +Z runs ALONG it, which is v1's
// ("local +x = road normal", placed at `rotation.y = headingAt(mid)`). Place
// this with its rotation set to the road heading or you will build a wall.

import * as THREE from 'three';
import { PropTemplate, standard, mergeGeoms, mergeGeomsUV } from './types';
import { gablePrismGeo } from './kit';
import { wallMaps } from './wallTexture';

const CAR_R = 1.8;
const ROAD_HALF = 7;                                  // dustline's 14 m road
const LAT = ROAD_HALF + 1.5 + CAR_R + 0.3;            // 10.6 — pier centre
const PIER_W = 2.6, PIER_D = 5.0;
const CLEAR = 6.4;                                    // soffit height, v1's
const SPAN = LAT - PIER_W * 0.5;                      // 9.3
const RISE = 0.5;
const VN = 16;
const BAYS = 3;                                       // 23.8 m of frontage at v1's ~7.2 m bay unit
const TOTAL = LAT * 2 + PIER_W;                       // 23.8
const Y_OVER = CLEAR + SPAN * RISE + 2.8;             // 13.85

// MEASURED, not asserted. The opening is 18.6 m clear between the pier faces,
// and the lowest piece of structure anywhere over the 14 m carriageway is at
// 8.1 m — 6.4 m at the smallest scale this component offers, where the ring
// comes down closer to the road edge. A car is 1.9 x 3.9 m and about 1.4 m
// tall, so it fits with the whole road to spare. This is the only number on
// the component that MUST be right: everything else being wrong is cosmetic,
// and this being wrong is a wall across the track.

const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);

const archGateway: PropTemplate = {
  id: 'archGateway',
  name: 'Arch gateway',
  category: 'settlement',
  description: 'Stone gatehouse over the road: 18.6 m opening, 8.1 m headroom, 19 m tall. Not solid — see the file.',

  build: () => [
    {
      key: 'stone',
      // piers, then the voussoir ring. The blocks are rotated by the CIRCLE
      // tangent (`a - PI/2`) while the ring itself is an ellipse — v1's, and
      // left alone: laid this close the joints are hidden, and "correct" ellipse
      // normals would only rotate each block a couple of degrees.
      geometry: mergeGeoms([
        ...[1, -1].map((side) => box(PIER_W, CLEAR, PIER_D).translate(side * LAT, CLEAR / 2, 0)),
        ...Array.from({ length: VN + 1 }, (_, s) => {
          const a = (s / VN) * Math.PI;
          const g = box(2.9, 1.5, PIER_D);
          g.rotateZ(a - Math.PI / 2);
          g.translate(-Math.cos(a) * SPAN, CLEAR + Math.sin(a) * SPAN * RISE, 0);
          return g;
        }),
      ]),
      material: standard(0xa9a294, { roughness: 0.92 }),
      castShadow: true,
    },
    {
      key: 'facade',
      // The bays. UVs carried, because these are the only walls on the
      // component and a merged wall without them samples one texel across the
      // whole face — a blank box where the windows should be.
      geometry: mergeGeomsUV(Array.from({ length: BAYS }, (_, s) => {
        const bw = TOTAL / BAYS;
        const x = -TOTAL / 2 + bw * (s + 0.5);
        return box(bw * 1.01, 5.4, PIER_D * 1.3).translate(x, Y_OVER, 0);
      })),
      // v1 renders this face with `townhouseTexture({ render: '#a89c88' })` and
      // its glow companion. The dustline equivalent is the limewash wall map —
      // `planks: false` — drawn over WHITE with the render tone carried as the
      // material colour, which is the split the rendered kits use: painting the
      // base and multiplying by the colour is what makes limewash come out mud.
      material: standard(0xa89c88, {
        roughness: 0.88,
        map: wallMaps('#ffffff', false).map,
        emissive: 0xffffff,
        emissiveMap: wallMaps('#ffffff', false).glow,
        emissiveIntensity: 0.4,
      }),
      castShadow: true,
    },
    {
      key: 'roof',
      // "the gatehouse spans the street, so its ridge runs ACROSS it (local +X)
      // and the pitches fall up and down the road — the prism's own orientation"
      geometry: gablePrismGeo().scale(TOTAL, 2.6, PIER_D * 1.36).translate(0, Y_OVER + 2.7, 0),
      material: standard(0x565c66, { roughness: 0.72 }),
      castShadow: true,
    },
    {
      key: 'lamp',
      // the lantern hung under the keystone. v1 uses MeshBasicMaterial — it is
      // the light, not a lit thing — and emissive gets the same read here.
      geometry: new THREE.SphereGeometry(0.34, 8, 6)
        .translate(0, CLEAR + SPAN * RISE - 1.4, 0),
      material: standard(0xffb14a, { roughness: 0.3, emissive: 0xffb14a, emissiveIntensity: 0.9 }),
    },
  ],

  // THE COLLIDER, AND WHY IT IS NOTHING.
  //
  // A component gets ONE convex shape, and every shape available — box,
  // cylinder, ball — that is big enough to cover the piers also covers the
  // 18.6 m hole between them. On an object whose entire purpose is that you
  // drive THROUGH it, that is an invisible wall straight across the racing
  // line: the worst failure a collider can have, and one that would be found
  // by a player at 140 km/h rather than by a test.
  //
  // So it is not solid, on the same reasoning as the start gantry: the
  // structure stands clear of the drivable width — the pier faces are 1.37 m
  // outside a 14 m road even at the SMALLEST scale offered — so a car that
  // could hit a pier has already left the road, and the mass is recorded for
  // the day there is something to knock over.
  //
  // If per-instance compound colliders ever arrive, this becomes exactly two
  // boxes: half-extents [1.3, 3.2, 2.5] at x = +-10.6, y centre 3.2. That is
  // written here so nobody has to re-derive it from the geometry.
  physics: { shape: () => ({ kind: 'none' }), solid: false, massKg: 1_400_000 },

  authoring: {
    // The scale floor is LOAD-BEARING, not taste. The opening scales with the
    // instance, and at 0.75 it is 14 m — the exact width of the road, with no
    // margin for a car that is not perfectly centred. 0.9 keeps 2.4 m of total
    // slack; anything below that needs the road pinched the way v1 pinches it.
    scale: [0.9, 1.15],
    defaultScale: 1,
    minRoadDist: 0,                                   // it straddles the road; that is the point
    randomYaw: false,                                 // rotation must match the road heading
    previewDist: 52,
  },
};

export default archGateway;
