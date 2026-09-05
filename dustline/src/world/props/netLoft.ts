// NET LOFT — the two-storey harbourside fish store: a stone ground floor you
// back a cart into, a boarded loft over it where nets are mended and dried, an
// outside stair, and a hoist beam over the loft door.
//
// NO v1 EQUIVALENT. `catalog.js` has eighteen dwellings, and every one of them
// is somewhere people live; a working store is a different building and gets
// found out immediately if you dress a cottage up as one. Built in the
// library's idiom instead, out of parts the port already owns: the farm kit's
// stone (0x8d8578) and trim (0x5d4426), the jetty's timber, and — the point of
// the exercise — v1's WALL TEXTURE on the loft storey.
//
// THE LOFT TAKES THE WINDOW TEXTURE, THE STORE DOES NOT. `buildingTexture`
// plus its emissive companion is what makes every dwelling in the harbour read
// as inhabited at dusk with no light source, and a net loft standing in that
// terrace with blank walls is the one dark building on the front. The ground
// floor stays plain stone because it genuinely has no windows — it is a store
// with a cart door. That split is the same one `realize()` keeps for the stone
// cottage's outside stair, and for the same reason: merged into one part, the
// stonework gets windows.
//
// The hoist and the loft door are on the +Z gable. Face that at the water.

import * as THREE from 'three';
import { PropTemplate, standard, beam, mergeGeoms, mergeGeomsUV } from './types';
import { bundle, gablePrismGeo, strut } from '../../templates/geometry';
import { wallMaps } from '../../templates/textures';

const HW = 3.6;               // 7.2 m across
const LEN = 9.6;              // and 9.6 deep — a working footprint, not a house
const FLOOR = 2.8;            // top of the stone store
const EAVE = 5.7;             // top of the loft
const RISE = 1.9;             // ridge at 7.6
const JET = 0.22;             // the loft oversails the store on the long sides
const SW = HW + JET;
const SL = Math.hypot(SW, RISE);
const ANG = Math.atan2(RISE, SW);

/** The outside stair up the -X wall to the loft door. Ten steps, each cut from
 *  its tread down to the ground so the flight is a mass — the same construction
 *  as `quaySteps`, upside down. v1's own outside stairs (`stoneCottage`,
 *  `farmhouse`) are a single sloped box, which is fine at the size a cottage
 *  draws it and reads as a ramp at this one. */
function stair(): THREE.BufferGeometry[] {
  const N = 10, RS = 0.29, GO = 0.45;
  const out: THREE.BufferGeometry[] = [];
  for (let i = 1; i <= N; i++) {
    const top = RS * i;
    out.push(beam(1.1, top, GO * (N - i + 1), -HW - 0.55, top / 2, 3.6 - GO * (i - 1) - (GO * (N - i + 1)) / 2));
  }
  out.push(beam(1.3, 0.24, 1.3, -HW - 0.6, FLOOR + 0.02, -1.5));   // landing at the door
  return out;
}

const netLoft: PropTemplate = {
  id: 'netLoft',
  name: 'Net loft',
  category: 'marine',
  description: 'Two-storey harbourside net loft, 7.6 x 9.6 m, 7.6 m to the ridge. Solid.',

  build: () => {
    const maps = wallMaps('#96683c', true);
    return [
      {
        key: 'stone',
        geometry: mergeGeoms([
          beam(HW * 2, FLOOR, LEN, 0, FLOOR / 2, 0),
          beam(HW * 2 + 0.3, 0.35, LEN + 0.3, 0, 0.175, 0),          // plinth
          ...stair(),
        ]),
        material: standard(0x8d8578, { roughness: 1 }),
        castShadow: true,
        tint: (c) => new THREE.Color(0x8d8578).offsetHSL(0, c.rng.centered(0.02), c.rng.centered(0.05)),
      },
      {
        key: 'wall',
        // UVs carried, or the whole face samples one texel and the loft is a
        // brown box where the windows should be. The gable ends are the same
        // prism the boat shed uses, turned to face down Z.
        geometry: mergeGeomsUV([
          beam(SW * 2, EAVE - FLOOR, LEN, 0, (FLOOR + EAVE) / 2, 0),
          gablePrismGeo().scale(0.16, RISE, SW * 2).rotateY(Math.PI / 2).translate(0, EAVE, -LEN / 2),
          gablePrismGeo().scale(0.16, RISE, SW * 2).rotateY(Math.PI / 2).translate(0, EAVE, LEN / 2),
        ]),
        material: standard(0xdac9a4, {
          roughness: 0.85,
          map: maps.map,
          emissive: 0xffffff,
          emissiveMap: maps.glow,
          emissiveIntensity: 0.5,
        }),
        castShadow: true,
      },
      {
        key: 'roof',
        geometry: bundle([-1, 1].map((sg) => beam(
          SL + 0.4, 0.16, LEN + 0.5,
          sg * (SW / 2 + 0.2 * Math.cos(ANG)),
          EAVE + RISE / 2 - 0.2 * Math.sin(ANG),
          0, 0, 0, -sg * ANG,
        ))),
        material: standard(0x565049, { roughness: 0.9 }),
        castShadow: true,
      },
      {
        key: 'timber',
        // THE HOIST IS WHAT MAKES IT A LOFT. A cantilevered beam out of the
        // gable with a block on the end of it is how everything heavy gets to
        // the first floor of a building with no room inside for a stair, and it
        // is the one detail that cannot be mistaken for a house.
        geometry: bundle([
          beam(0.22, 0.26, 3.2, 0, 6.45, LEN / 2 - 0.5),
          strut([0, 6.32, LEN / 2 + 0.9], [0, 5.1, LEN / 2 - 0.05], 0.07, 5),
          new THREE.TorusGeometry(0.16, 0.05, 5, 10).translate(0, 6.16, LEN / 2 + 0.95),
          strut([0, 6.14, LEN / 2 + 0.95], [0, 4.3, LEN / 2 + 0.95], 0.03, 5),
          beam(0.34, 0.3, 0.3, 0, 4.15, LEN / 2 + 0.95),             // the hook block
          beam(1.9, 0.16, 0.16, 0, EAVE + 0.06, LEN / 2 + 0.28),     // bargeboards
          beam(1.9, 0.16, 0.16, 0, EAVE + 0.06, -LEN / 2 - 0.28),
        ]),
        material: standard(0x5d4426, { roughness: 0.95 }),
        castShadow: true,
      },
      {
        key: 'openings',
        // Doors as recessed dark panels rather than holes: the walls are solid
        // boxes and cutting real openings in them would cost a CSG pass for
        // something read at 30 m from a moving car.
        geometry: mergeGeoms([
          beam(1.5, 2.2, 0.16, 0, 4.2, LEN / 2 - 0.02),              // loft door
          beam(2.4, 2.4, 0.16, 0, 1.2, LEN / 2 - 0.02),              // cart door
          // the loft door off the stair landing — on the OVERSAILING face at
          // -SW, not the store's -HW below it, or it sits 0.22 m inside the wall
          beam(1.0, 2.0, 0.16, -SW + 0.02, FLOOR + 1.0, -1.5, 0, Math.PI / 2, 0),
        ]),
        material: standard(0x2b2119, { roughness: 1 }),
      },
    ];
  },

  physics: {
    // A BOX, OFFSET ONTO THE BUILDING. This was a cylinder, and the note here
    // gave a good reason at the time: the outside stair is 2.9 m of masonry
    // standing clear of the -X wall, and a box "can only be centred on the
    // instance origin in plan", so one wide enough to hold the stair would put
    // the same metre of invisible wall down the far side.
    //
    // That stopped being true when `centerX`/`centerZ` were added to
    // `PhysicsShape` — the jetty needed them for exactly this reason. The
    // workaround outlived the limitation, and it cost a metre of oversail all
    // the way round. The box now sits on the mass, stair included.
    shape: (s) => ({
      kind: 'box',
      halfExtents: [(SW + 0.5) * s, ((EAVE + RISE) / 2) * s, (LEN / 2) * s],
      centerY: ((EAVE + RISE) / 2) * s,
      centerX: -0.32 * s,
    }),
    solid: true,
    // COVERAGE — the mass, stair included. The oversailing loft floor clears it above.
    coverage: 'partial',
    // Stone below, timber above: about 60 m³ of masonry at 2.4 t/m³ plus a
    // boarded storey. Half the church, and more than the townhouse it stands
    // next to, which is what a building with a stone ground floor should be.
    massKg: 150000,
  },

  authoring: {
    scale: [0.9, 1.15], defaultScale: 1,
    placement: 'shore', shoreBand: 14,
    minRoadDist: 12, randomYaw: false, previewDist: 30,
  },
};

export default netLoft;
