// HOUSE TEMPLATES — COPIED FROM IGNITE RALLY, NOT REWRITTEN.
//
// This table is `HOUSE_TEMPLATES` from `src/world/catalog.js` in the v1 game
// at the root of this repository, carried across verbatim: the same part lists,
// the same numbers, the same comments. Nothing here was designed for dustline.
//
// That is the point. dustline's first settlement components were hand-rolled
// boxes with a couple of roof slabs, when the other game in this repository
// already had eighteen worked dwelling archetypes with footings, oversailing
// eaves, porch posts, string courses, jettied upper floors, balcony rails and
// ridge chimneys — and, more to the point, had already found and fixed the
// bugs. The header comment below records one of them: the SAME roof bug
// shipped twice, independently, because two builders each rolled their own
// dwelling geometry. A third copy in a third codebase would have made it three.
//
// A template is a PART LIST, not a function:
//
//     [kind, dx, dy, dz, sx, sy, sz, colourKey, roll?]
//
// `kind` names one of five unit geometries, each base-anchored ONCE in
// `realize()` below — so there is nowhere for an author to forget a translate,
// because no author writes a translate: they write a height. `colourKey` names
// a slot in a KIT (wall / wall2 / roof / trim / stone), so one template reads
// as limewash-and-pantile on the coast and weatherboard-and-tin inland without
// a second copy of the shape. `r` is the collider radius.
//
// WHAT CHANGED IN THE PORT, and only this: the transform is applied to the
// geometry at build time instead of to an instance matrix at draw time, because
// a dustline component is one shared geometry per material rather than five
// world-wide instancing buckets. The composition is identical — scale, then
// roll about Z, then translate — so a part lands exactly where v1 puts it.

import * as THREE from 'three';
import { gablePrismGeo } from './geometry';
import { standard, mergeGeoms, mergeGeomsUV } from './geometry';
import { wallMaps } from './textures';
// TYPE ONLY — see the note in `boats.ts`. Erased at build time, so this folder
// has no runtime dependency on the component catalogue.
import type { PropPart, PropTemplate } from '../world/props/types';

export type HousePart = [string, number, number, number, number, number, number, string | number, number?];
export interface HouseTemplate { r: number; mat?: string; parts: HousePart[] }

export const HOUSE_TEMPLATES: Record<string, HouseTemplate> = {
  // ---- THE MEDITERRANEAN COASTS ----
  // Four archetypes that are genuinely different SHAPES, not the farmhouse
  // retinted: a tall narrow Ligurian terrace house, a flat-roofed Aegean cube,
  // its domed neighbour, and an Andalusian house around a walled patio. The
  // silhouette is what tells you which coast you are on from the driving seat.

  // LIGURIA: four storeys on a small footprint, painted render, shallow
  // pantile roof, a shutter band per floor.
  towerhouse: { r: 4.4, parts: [
    ['box', 0, 0, 0, 5.8, 0.5, 5.4, 'stone'],                // footing
    ['wall', 0, 0.5, 0, 5.4, 11.2, 5.0, 'wall'],             // the tall block
    ['box', 0, 11.7, 0, 6.1, 0.26, 5.7, 'trim'],             // eaves
    ['prism', 0, 11.95, 0, 6.3, 1.5, 5.9, 'roof'],           // shallow pantile
    ['box', 0, 3.0, 2.6, 3.9, 0.5, 0.22, 'trim'],            // shutter bands
    ['box', 0, 5.9, 2.6, 3.9, 0.5, 0.22, 'trim'],
    ['box', 0, 8.8, 2.6, 3.9, 0.5, 0.22, 'trim'],
    ['box', 0, 0.5, 2.6, 1.5, 2.4, 0.2, 'trim'],             // street door
  ] },
  // AEGEAN: a whitewashed cube with a parapet instead of eaves, an outside
  // stair, and one painted door.
  cube: { r: 4.6, parts: [
    ['wall', 0, 0, 0, 8.0, 5.4, 7.2, 'wall'],
    ['box', 0, 5.4, 0, 8.5, 0.55, 7.7, 'wall2'],             // parapet
    ['wall', 2.2, 5.95, 0.8, 3.6, 2.8, 3.4, 'wall'],         // roof room
    ['box', 2.2, 8.75, 0.8, 3.9, 0.45, 3.7, 'wall2'],
    ['box', -2.6, 0, 3.7, 2.6, 2.6, 0.55, 'trim'],           // outside stair
    ['box', 0.9, 0, 3.7, 1.5, 2.5, 0.22, 'trim'],            // blue door
    ['box', -2.8, 3.2, 3.7, 1.2, 1.1, 0.2, 'trim'],          // shutter
  ] },
  // AEGEAN, the one with the dome: same cube, a drum and a blue cap.
  domed: { r: 4.8, parts: [
    ['wall', 0, 0, 0, 7.6, 4.8, 7.0, 'wall'],
    ['box', 0, 4.8, 0, 8.1, 0.5, 7.5, 'wall2'],
    ['cyl', 0, 5.3, 0, 3.4, 1.5, 3.4, 'wall'],               // drum
    ['cone', 0, 6.8, 0, 3.8, 2.2, 3.8, 'roof'],              // the blue cap
    ['box', 0, 0, 3.6, 1.5, 2.5, 0.22, 'trim'],
    ['box', -2.4, 2.6, 3.6, 1.1, 1.0, 0.2, 'trim'],
  ] },
  // ANDALUSIA: the house is half the object - the other half is the walled
  // patio it sits behind, which is what makes the street read as a street.
  courtyard: { r: 6.4, parts: [
    ['box', -1.6, 0, 0, 8.4, 0.6, 7.4, 'stone'],
    ['wall', -1.6, 0.6, 0, 7.8, 5.0, 6.8, 'wall'],
    ['box', -1.6, 5.6, 0, 8.6, 0.3, 7.6, 'trim'],
    ['prism', -1.6, 5.9, 0, 9.0, 2.4, 8.0, 'roof'],
    ['wall', 4.6, 0, 2.9, 4.2, 2.6, 0.7, 'wall2'],           // patio walls
    ['wall', 6.4, 0, 0, 0.7, 2.6, 6.5, 'wall2'],
    ['box', 4.6, 2.6, 2.9, 4.5, 0.35, 1.0, 'roof'],          // coping tiles
    ['box', 6.4, 2.6, 0, 1.0, 0.35, 6.8, 'roof'],
    ['box', -1.6, 0.6, 3.5, 1.6, 2.6, 0.22, 'trim'],
  ] },

  // ---- FARMSTEAD AND VILLAGE ----
  barn: { r: 7.4, parts: [
    ['wall', 0, 0, 0, 12, 6.0, 8.4, 'wall2'],
    ['prism', 0, 6.0, 0, 12.8, 3.4, 9.1, 'roof'],
    ['box', 0, 0.1, 4.3, 3.4, 4.6, 0.35, 'trim'],            // big door
    ['box', 0, 4.9, 4.35, 1.6, 1.4, 0.3, 'trim'],            // hay loft hatch
    ['box', -6.05, 0, 0, 0.4, 6.0, 8.4, 'trim'],
    ['box', 6.05, 0, 0, 0.4, 6.0, 8.4, 'trim'],
  ] },
  // A FARMHOUSE, NOT A BOX WITH A LID. What makes a small rural house read at
  // a glance is not detail, it is MASSING: a stone footing so it sits IN the
  // ground rather than on it, a steep roof whose eaves oversail the walls, and
  // a lower wing so the outline is not a rectangle.
  house: { r: 6.0, parts: [
    ['box', 0, 0, 0, 7.8, 0.75, 6.8, 'stone'],               // stone footing
    ['wall', 0, 0.75, 0, 7.2, 4.8, 6.2, 'wall'],             // main block
    ['box', 0, 5.35, 0, 8.1, 0.28, 7.1, 'trim'],             // eaves fascia
    ['prism', 0, 5.55, 0, 8.6, 3.7, 7.6, 'roof'],            // steeper, oversailing
    ['box', 4.7, 0, 0.6, 3.8, 0.6, 4.9, 'stone'],            // lower side wing
    ['wall', 4.7, 0.6, 0.6, 3.4, 2.9, 4.4, 'wall2'],
    ['prism', 4.7, 3.5, 0.6, 3.9, 1.6, 5.0, 'roof'],
    ['box', -0.6, 3.15, 3.55, 3.4, 0.22, 1.9, 'roof'],       // porch canopy
    ['cyl', -1.9, 0.75, 4.0, 0.24, 2.4, 0.24, 'trim'],
    ['cyl', 0.7, 0.75, 4.0, 0.24, 2.4, 0.24, 'trim'],
    ['box', -0.6, 0.8, 3.05, 1.4, 2.6, 0.28, 'trim'],        // door
    ['cyl', -2.6, 5.4, 0, 0.95, 3.4, 0.95, 'stone'],         // chimney on the ridge
  ] },
  chapel: { r: 4.8, parts: [
    ['wall', 0, 0, 0, 5.6, 5.4, 8.0, 'wall'],
    ['prism', 0, 5.4, 0, 6.2, 3.0, 8.6, 'roof'],
    ['wall', 0, 0, -4.6, 3.6, 9.6, 3.6, 'wall'],             // bell tower
    ['cone', 0, 9.6, -4.6, 4.6, 3.8, 4.6, 'roof'],
    ['box', 0, 13.4, -4.6, 0.22, 1.6, 0.22, 0xf0e6c8],       // cross
    ['box', 0, 14.2, -4.6, 1.0, 0.22, 0.22, 0xf0e6c8],
    ['box', 0, 0.1, 4.1, 1.4, 3.0, 0.3, 'trim'],
  ] },
  shed: { r: 3.4, parts: [
    ['wall', 0, 0, 0, 5.2, 3.2, 4.2, 'wall2'],
    ['box', 0, 3.2, 0.35, 5.8, 0.35, 4.9, 'roof'],           // lean-to roof
    ['box', 0, 0.1, 2.2, 1.3, 2.4, 0.28, 'trim'],
  ] },
  // PUEBLO RUIN: the broken fortress silhouette from the player's canyon
  // reference, standing on the mesa rim. All masonry is kind 'box'/'cyl' -
  // NEVER kind 'wall', whose bucket carries the emissive window map, and a
  // ruin with lit windows is a haunted house. Roofless main block, stepped
  // lower block, breached curtain wall with a doorway gap, a collapsed round
  // tower under a ragged cap, protruding viga beams (the adobe motif), and
  // tumbled rubble. _element's per-placement stretch/mirror/shade means the
  // same ruin never reads twice.
  puebloRuin: { r: 8.5, mat: 'stone', parts: [
    ['box', 0, 0, 0, 10.5, 0.6, 8.5, 'stone'],               // rubble plinth
    ['box', -1.4, 0.6, -0.6, 6.0, 4.6, 6.4, 'wall'],         // roofless main block
    ['box', -2.6, 5.2, -2.2, 3.4, 0.7, 0.9, 'wall2'],        // broken parapet
    ['box', 2.9, 0.6, 1.2, 4.6, 2.9, 5.2, 'wall2'],          // stepped lower block
    ['box', -0.2, 0.6, 3.6, 4.2, 3.2, 0.7, 'wall'],          // curtain wall A
    ['box', 4.5, 0.6, 3.4, 2.6, 2.2, 0.7, 'wall'],           // curtain wall B (gap = gate)
    ['cyl', -4.2, 0.6, 2.4, 3.4, 6.4, 3.4, 'stone'],         // collapsed tower stump
    ['cyl', -4.2, 6.9, 2.4, 3.7, 0.6, 3.7, 'trim'],          // ragged cap ring
    ['cyl', -3.2, 4.4, 2.6, 0.3, 1.3, 0.3, 'trim', Math.PI / 2],   // vigas
    ['cyl', 0.4, 4.0, 2.6, 0.3, 1.3, 0.3, 'trim', Math.PI / 2],
    ['cyl', 2.2, 2.8, 3.9, 0.3, 1.3, 0.3, 'trim', Math.PI / 2],
    ['box', 3.6, 0.6, -2.6, 1.7, 1.1, 1.4, 'stone'],         // tumbled blocks
    ['box', -4.6, 0.6, -1.8, 1.3, 0.9, 1.1, 'stone'],
    ['cone', 1.2, 0.6, -3.4, 2.6, 1.7, 2.6, 'stone'],        // scree heap
  ] },

  adobe: { r: 5.7, parts: [
    ['wall', 0, 0, 0, 8.6, 4.2, 7.2, 'wall'],
    ['box', 0, 4.2, 0, 9.1, 0.7, 7.7, 'wall'],               // parapet
    ['box', 0, 0.1, 3.7, 1.5, 2.9, 0.3, 'trim'],
    ['cyl', -2.2, 3.6, 4.1, 0.35, 1.4, 0.35, 'trim', Math.PI / 2],
    ['cyl', 0, 3.6, 4.1, 0.35, 1.4, 0.35, 'trim', Math.PI / 2],
    ['cyl', 2.2, 3.6, 4.1, 0.35, 1.4, 0.35, 'trim', Math.PI / 2],
  ] },

  // ---- COTTAGES ----
  //
  // Three of them, because the scattered dwellings are the buildings a player
  // sees most and they were ONE shape at a random size: a box with a pyramid,
  // repeated ten times a world. Same kit slots, same base anchoring, different
  // massing — a long low one, a tall narrow one, and a squat gabled one.
  cottageA: { r: 4.6, parts: [
    ['box', 0, 0, 0, 7.0, 0.5, 5.4, 'stone'],
    ['wall', 0, 0.5, 0, 6.5, 3.6, 5.0, 'wall'],
    ['box', 0, 4.0, 0, 7.3, 0.24, 5.8, 'trim'],              // eaves
    ['prism', 0, 4.2, 0, 7.7, 2.6, 6.1, 'roof'],
    ['box', 0, 0.6, 2.6, 1.2, 2.2, 0.26, 'trim'],            // door
    ['cyl', 2.2, 4.1, 0, 0.8, 2.6, 0.8, 'stone'],            // chimney
  ] },
  cottageB: { r: 4.2, parts: [
    ['box', 0, 0, 0, 5.6, 0.6, 5.6, 'stone'],
    ['wall', 0, 0.6, 0, 5.1, 5.2, 5.1, 'wall2'],             // taller, narrower
    ['box', 0, 5.6, 0, 5.9, 0.26, 5.9, 'trim'],
    ['cone', 0, 5.8, 0, 6.4, 3.0, 6.4, 'roof'],              // hipped pyramid roof
    ['box', 0, 0.7, 2.7, 1.1, 2.2, 0.26, 'trim'],
    ['cyl', -1.7, 5.7, 1.2, 0.7, 2.4, 0.7, 'stone'],
  ] },
  cottageC: { r: 5.0, parts: [
    ['box', 0, 0, 0, 8.0, 0.45, 5.0, 'stone'],
    ['wall', 0, 0.45, 0, 7.4, 3.0, 4.5, 'wall'],             // long and low
    ['box', 0, 3.35, 0, 8.3, 0.22, 5.4, 'trim'],
    ['prism', 0, 3.5, 0, 8.7, 2.2, 5.7, 'roof'],
    ['wall', -4.4, 0.45, 0.4, 2.6, 2.2, 3.4, 'wall2'],       // lean-to at the end
    ['box', -4.4, 2.65, 0.4, 3.0, 0.26, 3.8, 'roof'],
    ['box', 1.0, 0.55, 2.4, 1.2, 2.1, 0.26, 'trim'],
    ['cyl', 3.0, 3.4, 0, 0.75, 2.2, 0.75, 'stone'],
  ] },

  // A VILLAGE OF THREE HOUSES IS A VILLAGE OF ONE HOUSE.
  //
  // Every settlement in the game - every hut scatter on every world - drew from
  // COTTAGES, and COTTAGES held exactly three entries. Three silhouettes, hue-
  // jittered, is what makes a street read as the same building stamped down the
  // road, which is the complaint. Five more, and they differ in PLAN and
  // ROOFLINE rather than in tint: an L-plan farmhouse with a porch and a
  // dormer, a two-storey townhouse with a balcony, a half-timbered cottage
  // with its upper floor jettied out over the street, a stone cottage with an
  // outside stair and a woodstore, and a long chalet under a deep eave.
  //
  // They also carry two to three times the parts of the old three - porch
  // posts, sills, braces, balcony rails, ridge chimneys - because at the
  // distance a village is seen it is the number of EDGES catching the light
  // that separates a house from a box, not the smoothness of any one of them.

  // L-PLAN FARMHOUSE: a main range with a return wing, a posted porch and a
  // dormer breaking the eaves.
  cottageD: { r: 5.4, parts: [
    ['box', 0, 0, 0, 8.4, 0.5, 5.6, 'stone'],
    ['wall', 0, 0.5, 0, 7.8, 3.8, 5.0, 'wall'],
    ['box', 0, 4.3, 0, 8.6, 0.26, 5.6, 'trim'],
    ['prism', 0, 4.5, 0, 9.0, 2.8, 5.9, 'roof'],
    ['wall', -3.0, 0.5, -3.6, 4.2, 3.2, 4.2, 'wall'],
    ['box', -3.0, 3.7, -3.6, 4.5, 0.24, 4.5, 'trim'],
    ['prism', -3.0, 3.9, -3.6, 4.8, 2.2, 4.8, 'roof'],
    ['box', 1.6, 0.5, 2.9, 2.8, 0.22, 1.7, 'stone'],
    ['cyl', 0.5, 0.7, 3.3, 0.26, 2.5, 0.26, 'trim'],
    ['cyl', 2.7, 0.7, 3.3, 0.26, 2.5, 0.26, 'trim'],
    ['box', 1.6, 3.2, 3.1, 3.2, 0.22, 1.9, 'roof'],
    ['box', 1.6, 0.6, 2.5, 1.2, 2.2, 0.26, 'trim'],
    ['box', -1.8, 1.9, 2.6, 1.3, 1.1, 0.2, 'trim'],
    ['prism', -1.4, 5.2, 1.6, 1.9, 1.3, 1.8, 'roof'],
    ['cyl', 3.4, 4.4, -1.2, 0.72, 2.8, 0.72, 'stone'],
  ] },

  // TOWNHOUSE: two full storeys, a string course between them, a shallow
  // balcony on the upper floor and a pitched roof end-on to the street.
  cottageE: { r: 4.4, parts: [
    ['box', 0, 0, 0, 6.2, 0.45, 6.6, 'stone'],
    ['wall', 0, 0.45, 0, 5.6, 6.6, 6.0, 'wall'],
    ['box', 0, 3.6, 0, 5.9, 0.26, 6.3, 'trim'],
    ['box', 0, 7.05, 0, 6.4, 0.28, 6.8, 'trim'],
    ['prism', 0, 7.3, 0, 6.7, 2.4, 7.1, 'roof'],
    ['box', 0, 4.3, 3.1, 3.4, 0.2, 1.1, 'trim'],
    ['box', 0, 5.2, 3.5, 3.4, 0.9, 0.16, 'trim'],
    ['box', -1.5, 4.5, 3.5, 0.16, 0.9, 0.16, 'trim'],
    ['box', 1.5, 4.5, 3.5, 0.16, 0.9, 0.16, 'trim'],
    ['box', 0, 0.55, 3.05, 1.2, 2.3, 0.24, 'trim'],
    ['box', -1.7, 1.5, 3.05, 1.0, 1.2, 0.18, 'trim'],
    ['box', 1.7, 1.5, 3.05, 1.0, 1.2, 0.18, 'trim'],
    ['cyl', 2.0, 7.2, -1.6, 0.62, 2.4, 0.62, 'stone'],
    ['cyl', -2.0, 7.2, 1.6, 0.62, 2.0, 0.62, 'stone'],
  ] },

  // HALF-TIMBERED: the upper floor JETTIES out over the lower one, which is
  // the silhouette the eye reads before it reads any timber.
  cottageF: { r: 4.8, parts: [
    ['box', 0, 0, 0, 6.4, 0.4, 5.4, 'stone'],
    ['wall', 0, 0.4, 0, 5.8, 3.0, 4.8, 'stone'],
    ['wall', 0, 3.4, 0, 6.8, 3.0, 5.8, 'wall'],
    ['box', 0, 3.3, 0, 7.1, 0.24, 6.1, 'trim'],
    ['box', 0, 6.4, 0, 7.2, 0.26, 6.2, 'trim'],
    ['prism', 0, 6.6, 0, 7.6, 3.0, 6.5, 'roof'],
    ['box', -2.9, 3.4, 0, 0.24, 3.0, 5.6, 'trim'],
    ['box', 2.9, 3.4, 0, 0.24, 3.0, 5.6, 'trim'],
    ['box', 0, 4.8, 2.9, 6.4, 0.22, 0.2, 'trim'],
    ['box', -1.7, 3.6, 2.9, 0.22, 2.7, 0.2, 'trim'],
    ['box', 1.7, 3.6, 2.9, 0.22, 2.7, 0.2, 'trim'],
    ['box', 0, 0.5, 2.5, 1.2, 2.2, 0.24, 'trim'],
    ['box', -1.9, 1.5, 2.5, 1.1, 1.1, 0.18, 'trim'],
    ['cyl', 2.4, 6.5, -1.0, 0.7, 2.6, 0.7, 'stone'],
  ] },

  // STONE COTTAGE with an outside stair to the upper door and a lean-to
  // woodstore - the plan you get on any hillside.
  cottageG: { r: 5.0, parts: [
    ['box', 0, 0, 0, 7.2, 0.5, 5.2, 'stone'],
    ['wall', 0, 0.5, 0, 6.6, 4.6, 4.6, 'stone'],
    ['box', 0, 5.1, 0, 6.9, 0.26, 5.0, 'trim'],
    ['prism', 0, 5.3, 0, 7.3, 2.6, 5.3, 'roof'],
    ['box', 3.6, 0.5, 1.2, 1.8, 2.6, 0.5, 'stone'],
    ['box', 3.6, 0.5, 0.2, 1.8, 1.7, 0.5, 'stone'],
    ['box', 3.6, 0.5, -0.8, 1.8, 0.9, 0.5, 'stone'],
    ['box', 2.9, 3.1, 1.6, 1.0, 2.0, 0.22, 'trim'],
    ['wall', -4.2, 0.5, 0.6, 2.4, 2.2, 3.2, 'wall2'],
    ['box', -4.2, 2.7, 0.6, 2.8, 0.22, 3.6, 'roof'],
    ['cyl', -4.2, 0.7, 2.0, 0.36, 1.6, 0.36, 'trim'],
    ['cyl', -4.2, 0.7, -0.6, 0.36, 1.6, 0.36, 'trim'],
    ['box', 0, 0.6, 2.4, 1.1, 2.1, 0.24, 'trim'],
    ['cyl', -1.6, 5.2, 0, 0.7, 2.8, 0.7, 'stone'],
  ] },

  // CHALET: long and low under a very deep eave, with a full-width balcony
  // and a woodpile stacked under it.
  cottageH: { r: 5.6, parts: [
    ['box', 0, 0, 0, 9.0, 0.5, 5.4, 'stone'],
    ['wall', 0, 0.5, 0, 8.4, 2.6, 4.8, 'stone'],
    ['wall', 0, 3.1, 0, 8.2, 2.4, 4.6, 'wall2'],
    ['box', 0, 5.5, 0, 10.4, 0.3, 7.0, 'trim'],
    ['prism', 0, 5.8, 0, 10.8, 2.2, 7.3, 'roof'],
    ['box', 0, 3.0, 2.7, 8.8, 0.22, 1.3, 'trim'],
    ['box', 0, 3.9, 3.2, 8.8, 0.9, 0.16, 'trim'],
    ['box', -4.2, 3.2, 3.2, 0.18, 0.9, 0.16, 'trim'],
    ['box', 0, 3.2, 3.2, 0.18, 0.9, 0.16, 'trim'],
    ['box', 4.2, 3.2, 3.2, 0.18, 0.9, 0.16, 'trim'],
    ['box', -2.6, 0.55, 2.5, 1.2, 2.2, 0.24, 'trim'],
    ['box', 1.4, 1.5, 2.5, 1.4, 1.2, 0.18, 'trim'],
    ['cyl', -3.0, 0.6, 1.9, 0.34, 1.4, 0.34, 'trim'],
    ['cyl', 3.2, 5.6, -1.4, 0.68, 2.4, 0.68, 'stone'],
  ] },

  // ---- LANDMARKS AND DRESSING ----
  watchtower: { r: 2.7, parts: [
    ['wall', 0, 0, 0, 3.6, 9.5, 3.6, 'wall2'],
    ['box', 0, 9.5, 0, 5.4, 0.5, 5.4, 'trim'],               // platform
    ['box', -2.4, 10.0, -2.4, 0.28, 1.7, 0.28, 'trim'],
    ['box', 2.4, 10.0, -2.4, 0.28, 1.7, 0.28, 'trim'],
    ['box', -2.4, 10.0, 2.4, 0.28, 1.7, 0.28, 'trim'],
    ['box', 2.4, 10.0, 2.4, 0.28, 1.7, 0.28, 'trim'],
    ['cone', 0, 11.7, 0, 6.0, 2.2, 6.0, 'roof'],
  ] },
  stilt: { r: 3.8, parts: [
    ['cyl', -2.4, 0, -1.9, 0.5, 3.0, 0.5, 'trim'],
    ['cyl', 2.4, 0, -1.9, 0.5, 3.0, 0.5, 'trim'],
    ['cyl', -2.4, 0, 1.9, 0.5, 3.0, 0.5, 'trim'],
    ['cyl', 2.4, 0, 1.9, 0.5, 3.0, 0.5, 'trim'],
    ['cyl', 0, 0, -1.9, 0.5, 3.0, 0.5, 'trim'],
    ['cyl', 0, 0, 1.9, 0.5, 3.0, 0.5, 'trim'],
    ['wall', 0, 3.0, 0, 6.2, 3.0, 5.2, 'wall'],
    ['prism', 0, 6.0, 0, 7.2, 2.6, 6.2, 'roof'],
    ['box', 1.2, 0, 3.4, 3.0, 0.25, 2.4, 'trim'],            // ramp/deck
  ] },
  kiosk: { r: 3.0, parts: [
    ['wall', 0, 0, 0, 4.4, 3.2, 3.4, 'wall'],
    ['box', 0, 3.2, 0, 4.8, 0.4, 3.8, 'roof'],
    ['box', 0, 2.0, 2.1, 4.8, 0.2, 1.6, 'trim'],             // awning
    ['box', 0, 3.7, 0, 3.2, 1.1, 0.24, 'trim'],              // sign board
    ['box', -1.7, 1.9, 1.75, 0.2, 0.2, 1.5, 'trim'],
  ] },
  signalhut: { r: 3.2, parts: [
    ['wall', 0, 0, 0, 4.6, 3.4, 4.2, 'wall'],
    ['prism', 0, 3.4, 0, 5.2, 1.8, 4.8, 'roof'],
    ['cyl', 1.9, 3.4, -1.7, 0.24, 6.4, 0.24, 'trim'],        // antenna mast
    ['box', 1.9, 9.4, -1.7, 1.8, 0.16, 0.16, 'trim'],
    ['box', 0, 0.1, 2.2, 1.2, 2.4, 0.28, 'trim'],
  ] },
  silo: { r: 2.4, mat: 'stone', parts: [
    ['cyl', 0, 0, 0, 4.4, 9.0, 4.4, 'wall'],
    ['cone', 0, 9.0, 0, 4.9, 2.4, 4.9, 'roof'],
    ['cyl', 0, 2.2, 0, 4.6, 0.3, 4.6, 'trim'],
    ['cyl', 0, 4.4, 0, 4.6, 0.3, 4.6, 'trim'],
    ['cyl', 0, 6.6, 0, 4.6, 0.3, 4.6, 'trim'],
  ] },
  // TWO REPAIRS IN THIS TEMPLATE AND THE NEXT, AND ONLY TWO IN THE WHOLE FILE.
  //
  // A rolled part is still BASE-anchored, so it radiates one way from its
  // origin instead of spanning it — which is right for the pueblo's vigas
  // (they protrude from a wall) and wrong for anything that is meant to be a
  // diameter. The windmill's four sails, written at 45 deg apart, came out as
  // a 135 deg FAN rather than a wheel: four arms all on one side of the hub.
  // Rendering the ported library is what made it visible; it is a bug in the
  // v1 table too, and worth fixing there.
  //
  // The repair adds the four opposite arms rather than touching any number
  // that was written. Each pair is one full sail through the hub, and 45 deg
  // spacing then gives the eight-arm mill the original spacing implies.
  windmill: { r: 2.0, mat: 'stone', parts: [
    ['cyl', 0, 0, 0, 3.0, 8.4, 2.4, 'wall'],
    ['cone', 0, 8.4, 0, 3.6, 1.8, 3.0, 'roof'],
    ['cyl', 0, 7.6, 1.6, 0.7, 0.9, 0.7, 'trim', Math.PI / 2],
    ['box', 0, 7.6, 2.0, 0.5, 7.0, 0.22, 'trim', 0.4],
    ['box', 0, 7.6, 2.0, 0.5, 7.0, 0.22, 'trim', Math.PI / 4 + 0.4],
    ['box', 0, 7.6, 2.0, 0.5, 7.0, 0.22, 'trim', Math.PI / 2 + 0.4],
    ['box', 0, 7.6, 2.0, 0.5, 7.0, 0.22, 'trim', 3 * Math.PI / 4 + 0.4],
    ['box', 0, 7.6, 2.0, 0.5, 7.0, 0.22, 'trim', Math.PI + 0.4],
    ['box', 0, 7.6, 2.0, 0.5, 7.0, 0.22, 'trim', 5 * Math.PI / 4 + 0.4],
    ['box', 0, 7.6, 2.0, 0.5, 7.0, 0.22, 'trim', 3 * Math.PI / 2 + 0.4],
    ['box', 0, 7.6, 2.0, 0.5, 7.0, 0.22, 'trim', 7 * Math.PI / 4 + 0.4],
  ] },
  well: { r: 1.8, mat: 'stone', parts: [
    ['cyl', 0, 0, 0, 3.2, 1.3, 3.2, 'stone'],
    ['box', -1.3, 1.3, 0, 0.3, 2.4, 0.3, 'trim'],
    ['box', 1.3, 1.3, 0, 0.3, 2.4, 0.3, 'trim'],
    ['prism', 0, 3.7, 0, 3.4, 0.9, 2.8, 'roof'],
    // The winch barrel, same cause: written at dx 0 it hangs 2.6 out to one
    // side, missing one post and overshooting the other by 1.3. Moved to the
    // post it should start at, so it spans between them; the barrel's own
    // length is untouched.
    ['cyl', 1.3, 3.5, 0, 0.28, 2.6, 0.28, 'trim', Math.PI / 2],
  ] },
  logpile: { r: 2.4, mat: 'stone', parts: [
    ['cyl', 0, 0.55, -1.1, 1.05, 4.6, 1.05, 'trim', Math.PI / 2],
    ['cyl', 0, 0.55, 0, 1.05, 4.6, 1.05, 'trim', Math.PI / 2],
    ['cyl', 0, 0.55, 1.1, 1.05, 4.6, 1.05, 'trim', Math.PI / 2],
    ['cyl', 0, 1.50, -0.55, 1.05, 4.6, 1.05, 'trim', Math.PI / 2],
    ['cyl', 0, 1.50, 0.55, 1.05, 4.6, 1.05, 'trim', Math.PI / 2],
    ['cyl', 0, 2.45, 0, 1.05, 4.6, 1.05, 'trim', Math.PI / 2],
  ] },
};

/** The cottage variants, for anything that scatters dwellings at random.
 *  `catalog.COTTAGES`, verbatim. */
export const COTTAGES = ['cottageA', 'cottageB', 'cottageC',
  'cottageD', 'cottageE', 'cottageF', 'cottageG', 'cottageH'];

/** COLOUR KITS — the five slots a template names, ported from
 *  `catalog.ELEMENT_KITS`. Four of the game's kits are carried over rather than
 *  all sixteen: the point of a kit is that ONE template reads as a different
 *  region without a second copy of the shape, and four regions is enough to
 *  prove it while keeping this file about the shapes. */
export interface Kit {
  wall: number; wall2: number; roof: number; trim: number; stone: number;
  /** How this kit's walls are surfaced under their windows.
   *
   *  v1 has no such field: it planks every wall tile over #96683c and lets the
   *  instance colour multiply it, which makes a limewashed Aegean cube come out
   *  plank-brown. Timber kits keep that; rendered ones take v1's limewash over
   *  white, so the kit colour survives the multiply. */
  wallBase: string;
  planks: boolean;
}

export const KITS: Record<string, Kit> = {
  farm: { wall: 0xdac9a4, wall2: 0xa8442e, roof: 0x8a3a2a, trim: 0x5d4426, stone: 0x8d8578, wallBase: '#96683c', planks: true },
  alpine: { wall: 0xe2d6bc, wall2: 0x9c6c40, roof: 0x7a4630, trim: 0x5d4426, stone: 0x9a978e, wallBase: '#96683c', planks: true },
  dalmatia: { wall: 0xe6dfcd, wall2: 0xd2c9b2, roof: 0xc0603a, trim: 0x4a6b4a, stone: 0xcfc6ae, wallBase: '#ffffff', planks: false },
  liguria: { wall: 0xe8a15c, wall2: 0xd4884a, roof: 0xb4552e, trim: 0x3f6b46, stone: 0xc9b998, wallBase: '#ffffff', planks: false },
  // Three more of v1's, added when the templates that need them were exposed.
  // `cube` and `domed` are the AEGEAN archetypes and their doors and domes are
  // blue — with only the four kits above, the whitewashed cube came out with a
  // dalmatia-green door, which is a missing kit rather than a wrong template.
  aegean: { wall: 0xf4f1ea, wall2: 0xe6e2d8, roof: 0x2f6fae, trim: 0x2f6fae, stone: 0xd8d2c4, wallBase: '#ffffff', planks: false },
  andalusia: { wall: 0xf0e6d2, wall2: 0xe0c893, roof: 0xb85c33, trim: 0x8a5a2c, stone: 0xd6c7a4, wallBase: '#ffffff', planks: false },
  desert: { wall: 0xdcbd90, wall2: 0xc09a68, roof: 0xa8794a, trim: 0x6a4a2c, stone: 0xb08a5c, wallBase: '#ffffff', planks: false },
};

/** The five unit geometries, each base-anchored ONCE — `_realizeElements`.
 *  Built fresh per call: `realize()` mutates copies with scale/rotate/translate,
 *  and a shared master would drift on the second build. */
function unit(kind: string): THREE.BufferGeometry {
  switch (kind) {
    case 'wall': case 'box': return new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
    case 'cyl': return new THREE.CylinderGeometry(0.5, 0.5, 1, 10).translate(0, 0.5, 0);
    case 'cone': return new THREE.ConeGeometry(0.5, 1, 10).translate(0, 0.5, 0);
    case 'prism': return gablePrismGeo();
    default: throw new Error(`unknown house part kind "${kind}"`);
  }
}

/** Turn a template into dustline component parts.
 *
 *  ONE PART PER COLOUR SLOT, not one per box. A cottage is fourteen boxes in
 *  five colours; as fourteen parts a village of forty costs fourteen
 *  InstancedMeshes, and as five it costs five. `wall` and `box` share a
 *  geometry but never a part — in v1 they are separate buckets because the
 *  wall material carries the emissive window map, and keeping the split here
 *  means that texture can be adopted later without re-cutting every template.
 *
 *  Literal-number colour keys (the chapel's cross) get their own part, because
 *  the whole point of writing a literal instead of a slot name is that it must
 *  not be re-tinted with the rest of the building. */
export function realize(
  name: string, kitName = 'farm',
  opts: { castShadow?: boolean } = {},
): PropPart[] {
  const T = HOUSE_TEMPLATES[name];
  if (!T) throw new Error(`unknown house template "${name}"`);
  const K = KITS[kitName] ?? KITS.farm;
  const byColour = new Map<string, { colour: number; wall: boolean; geoms: THREE.BufferGeometry[] }>();

  for (const [kind, dx, dy, dz, sx, sy, sz, colKey, roll = 0] of T.parts) {
    // scale, then roll about Z, then translate — the order `_element` composes.
    const g = unit(kind).scale(sx, sy, sz);
    if (roll) g.rotateZ(roll);
    g.translate(dx, dy, dz);
    const colour = typeof colKey === 'string' ? (K as unknown as Record<string, number>)[colKey] : colKey;
    // KIND 'wall' IS ITS OWN PART, always, even when it shares a colour slot
    // with a footing or a flight of steps. That is the split v1 keeps, and the
    // reason is the window texture: `wall` is the inhabited mass, and the
    // stone cottage's outside stair is written in the same 'stone' slot as the
    // block it climbs. Merged together, the steps get windows.
    const wall = kind === 'wall';
    const key = `${typeof colKey === 'string' ? colKey : `x${colKey.toString(16)}`}${wall ? ':wall' : ''}`;
    const slot = byColour.get(key);
    if (slot) slot.geoms.push(g);
    else byColour.set(key, { colour, wall, geoms: [g] });
  }

  return [...byColour].map(([key, v]) => {
    if (!v.wall) {
      return {
        key,
        geometry: mergeGeoms(v.geoms),
        // Flat shading on everything: these are faceted masses, and smooth
        // normals across a merged buffer of unrelated boxes round the corners
        // off a house.
        material: standard(v.colour, { roughness: 0.9 }),
        castShadow: opts.castShadow ?? true,
      };
    }
    const maps = wallMaps(K.wallBase, K.planks);
    return {
      key,
      // UVs carried: a merged wall without them samples one texel across the
      // whole face, which is a solid box where the windows should be.
      geometry: mergeGeomsUV(v.geoms),
      material: standard(v.colour, {
        roughness: 0.85,
        map: maps.map,
        // The emissive half of v1's trick: one extra map and every dwelling in
        // the world is lit at dusk, with no light source and no per-house cost.
        emissive: 0xffffff,
        emissiveMap: maps.glow,
        emissiveIntensity: 0.5,
      }),
      castShadow: opts.castShadow ?? true,
    };
  });
}

/** A template's own collider, from its own `r`. A building's footprint radius
 *  is written next to its parts in the table; inventing a second one in the
 *  component file is how the two drift apart. */
export function houseCollider(name: string) {
  const T = HOUSE_TEMPLATES[name];
  const r = T ? T.r : 3;
  let top = 1;
  for (const p of T?.parts ?? []) top = Math.max(top, p[2] + p[5]);
  return (s: number) => ({
    kind: 'cylinder' as const,
    halfHeight: (top / 2) * s,
    radius: r * s,
    centerY: (top / 2) * s,
  });
}

/** A dustline component backed by a v1 house template.
 *
 *  Everything a settlement component needs is already in the table — the
 *  shape, the colour slots, the footprint radius — so a component file is a
 *  name, a category and a sentence, and there is no geometry in it left to get
 *  wrong. */
export function dwelling(o: {
  id: string;
  name: string;
  template: string;
  kit?: string;
  description: string;
  category?: PropTemplate['category'];
  massKg: number;
  scale?: [number, number];
  defaultScale?: number;
  minRoadDist?: number;
  solid?: boolean;
  previewDist?: number;
}): PropTemplate {
  return {
    id: o.id,
    name: o.name,
    category: o.category ?? 'settlement',
    description: o.description,
    build: () => realize(o.template, o.kit),
    physics: {
      shape: houseCollider(o.template),
      solid: o.solid ?? true,
      massKg: o.massKg,
    },
    authoring: {
      scale: o.scale ?? [0.85, 1.2],
      defaultScale: o.defaultScale ?? 1,
      minRoadDist: o.minRoadDist ?? 12,
      randomYaw: true,
      previewDist: o.previewDist,
    },
  };
}
