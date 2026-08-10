// BOAT PARTS — the v1 fleet, one hull.
//
// EVERYTHING HERE IS FROM IGNITE RALLY. The hull loft, the rig, the deck gear,
// the trawler gantry, the coachroof proportions, the fenders and portholes are
// all lifted out of `Track._buildMarina` and `Track._buildSea` in
// `src/track.js` at the repository root, and the reason is written in that
// file's own comments: the first boats there were a BOX WITH A CONE ON TOP,
// and the fix was nine lofted stations with a hard chine. dustline's first
// boats were tapered slabs — the same mistake, one codebase over.
//
// The complaint that produced the v1 rig is quoted in its source: "sailboats
// need the same high poly you've developed". This file is that rig.
//
// WHAT IS DIFFERENT HERE, and it is only this: v1 poses each part with an
// instance matrix at draw time, because it moors thirty boats in one marina. A
// dustline component is one shared geometry per material, so the same offsets
// are baked into the geometry at build time. The numbers are unchanged.

import * as THREE from 'three';
import { PropPart, standard, mergeGeoms } from './types';
import { boatHull, strut, bundle, sailGeo, afloat } from './kit';

/** `DECK` in the marina builder — the deck datum in the hull's own frame. */
export const DECK = 1.0;

/** Materials, ported one for one from the marina's. */
const hullMat = () => new THREE.MeshStandardMaterial({
  color: 0xffffff, roughness: 0.55, side: THREE.DoubleSide, flatShading: true,
});
const deckMat = () => new THREE.MeshStandardMaterial({
  color: 0x9a7c52, roughness: 1, side: THREE.DoubleSide, flatShading: true,
});
const bandMat = () => new THREE.MeshStandardMaterial({
  color: 0x2b2a27, roughness: 0.6, side: THREE.DoubleSide, flatShading: true,
});
export const alloy = () => new THREE.MeshStandardMaterial({
  color: 0xcfcabc, roughness: 0.5, metalness: 0.35, flatShading: true,
});
export const canvasMat = () => new THREE.MeshStandardMaterial({
  color: 0xdcd6c6, roughness: 0.9, flatShading: true, side: THREE.DoubleSide,
});

/** The hull, its deck and its rubbing band, floated so the component's origin
 *  is the waterline. Three parts because they are three materials — white
 *  topsides, timber deck, dark strake — exactly as v1 splits them. */
export function hullParts(scale: number, tint: number): PropPart[] {
  const H = boatHull();
  return [
    {
      key: 'hull',
      geometry: afloat(H.hull, scale),
      material: hullMat(),
      castShadow: true,
      // v1 strides a livery palette per boat; here the variation is per
      // instance, which is the same idea with the component's own rng.
      tint: (c) => new THREE.Color(tint).offsetHSL(
        c.rng.centered(0.06), c.rng.centered(0.12), c.rng.centered(0.1),
      ),
    },
    { key: 'deck', geometry: afloat(H.deck, scale), material: deckMat(), castShadow: true },
    { key: 'band', geometry: afloat(H.band, scale), material: bandMat() },
  ];
}

/** `keelG` — rudder and skeg, under the transom where a boat actually carries
 *  them. */
export const keelGeo = () => bundle([
  new THREE.BoxGeometry(0.14, 0.95, 0.8).translate(0, -1.75, -3.4),
  new THREE.BoxGeometry(0.28, 0.62, 2.6).translate(0, -1.86, -0.6),
]);

/** `rigParts` — yacht standing rigging and guardrails, all in one bundle. */
export function rigGeo(): THREE.BufferGeometry {
  const MH = [0, DECK + 9.2, 0.05];                  // masthead
  const parts = [
    strut(MH, [0, DECK + 0.6, 4.5], 0.035, 4),       // forestay
    strut(MH, [0, DECK + 0.05, -4.2], 0.035, 4),     // backstay
    strut(MH, [-1.34, DECK + 0.1, -0.2], 0.032, 4),  // port shroud
    strut(MH, [1.34, DECK + 0.1, -0.2], 0.032, 4),   // starboard shroud
  ];
  for (const sg of [1, -1]) {
    parts.push(strut([sg * 1.42, DECK + 0.62, -3.3], [sg * 1.5, DECK + 0.62, 2.5], 0.026, 4));
    for (const sz of [-3.3, -1.4, 0.5, 2.5]) {
      parts.push(strut([sg * 1.46, DECK, sz], [sg * 1.46, DECK + 0.64, sz], 0.035, 5));
    }
  }
  return bundle(parts);
}

/** `gearG` — cockpit coaming, two winches, a hatch and the pushpit. */
export const gearGeo = () => bundle([
  strut([-0.95, DECK + 0.02, -3.6], [-0.95, DECK + 0.22, -1.1], 0.07, 4),
  strut([0.95, DECK + 0.02, -3.6], [0.95, DECK + 0.22, -1.1], 0.07, 4),
  strut([-0.95, DECK + 0.22, -3.6], [0.95, DECK + 0.22, -3.6], 0.07, 4),
  new THREE.CylinderGeometry(0.16, 0.19, 0.34, 10).translate(-0.78, DECK + 0.3, -2.2),
  new THREE.CylinderGeometry(0.16, 0.19, 0.34, 10).translate(0.78, DECK + 0.3, -2.2),
  new THREE.BoxGeometry(0.75, 0.1, 0.75).translate(0, DECK + 0.12, 1.55),
  strut([0, DECK + 0.62, 4.4], [-0.7, DECK + 0.62, 3.5], 0.032, 4),
  strut([0, DECK + 0.62, 4.4], [0.7, DECK + 0.62, 3.5], 0.032, 4),
  strut([0, DECK, 4.45], [0, DECK + 0.64, 4.4], 0.035, 5),
]);

/** `gantG` — trawler working gear: stern gantry and net drum. */
export const gantryGeo = () => bundle([
  strut([-1.12, DECK, -3.2], [-0.9, DECK + 1.75, -3.5], 0.07, 6),
  strut([1.12, DECK, -3.2], [0.9, DECK + 1.75, -3.5], 0.07, 6),
  strut([-0.9, DECK + 1.75, -3.5], [0.9, DECK + 1.75, -3.5], 0.07, 6),
  new THREE.CylinderGeometry(0.34, 0.34, 1.5, 12)
    .rotateZ(Math.PI / 2).translate(0, DECK + 0.5, -2.4),
]);

/** `tRailG` — the trawler's working rail. */
export const trawlRailGeo = () => bundle([
  strut([-1.2, DECK, 3.4], [-1.35, DECK + 0.62, 1.4], 0.045, 5),
  strut([1.2, DECK, 3.4], [1.35, DECK + 0.62, 1.4], 0.045, 5),
  strut([-1.35, DECK + 0.62, 1.4], [1.35, DECK + 0.62, 1.4], 0.04, 5),
  strut([-1.35, DECK + 0.62, 1.4], [-1.42, DECK + 0.62, -2.6], 0.04, 5),
  strut([1.35, DECK + 0.62, 1.4], [1.42, DECK + 0.62, -2.6], 0.04, 5),
]);

/** A cabin block, from the marina's `put(cabins, …)` calls: position and scale
 *  of a unit box in the hull's frame. */
export const cab = (y: number, z: number, sx: number, sy: number, sz: number) =>
  new THREE.BoxGeometry(sx, sy, sz).translate(0, DECK + y, z);

/** Fenders and portholes down both topsides — the marina's `fendG`/`portG`,
 *  placed at its own offsets. */
export function trimGeo(): THREE.BufferGeometry {
  const out: THREE.BufferGeometry[] = [];
  for (const sg of [1, -1]) {
    for (const z of [-2.4, 0.2, 2.4]) {
      const f = new THREE.TorusGeometry(0.26, 0.09, 6, 10);
      f.rotateY(Math.PI / 2);
      out.push(f.translate(sg * 1.5, DECK - 0.35, z));
    }
    for (const z of [-2.6, -1.2, 0.4, 1.9]) {
      const p = new THREE.CylinderGeometry(0.15, 0.15, 0.1, 10);
      p.rotateZ(Math.PI / 2);
      out.push(p.translate(sg * 1.44, DECK - 0.42, z));
    }
  }
  return bundle(out);
}

/** `mainG` — A MOORED BOAT DOES NOT FLY ITS SAILS. Twenty of the marina's
 *  thirty boats used to carry a full-size hoisted mainsail AND a jib while
 *  tied up in a slip, which is twenty identical white triangles in a row and
 *  is literally the wall of sails in the player's photograph. Boats at a
 *  mooring have their main flaked on the boom under a cover. */
export const furledMainGeo = () => bundle([
  new THREE.CylinderGeometry(0.19, 0.15, 4.3, 8)
    .rotateX(Math.PI / 2).translate(0, 1.66, -2.15),
  // the cover's tie-downs, three little bands round the bundle
  new THREE.CylinderGeometry(0.22, 0.22, 0.12, 8)
    .rotateX(Math.PI / 2).translate(0, 1.66, -0.6),
  new THREE.CylinderGeometry(0.22, 0.22, 0.12, 8)
    .rotateX(Math.PI / 2).translate(0, 1.66, -2.2),
  new THREE.CylinderGeometry(0.22, 0.22, 0.12, 8)
    .rotateX(Math.PI / 2).translate(0, 1.66, -3.8),
]);

/** `jibG` — the headsail, rolled up the forestay. */
export const furledJibGeo = () => strut([0, 0.85, 4.3], [0, 9.0, 0.08], 0.14, 8);

/** THE FLOTILLA'S RIG — the boats that are actually SAILING, out in the bay,
 *  which is where a sail means something. `_buildSea`'s `sailG`, `bjibG`,
 *  `bboomG`, `bmastG`, `brigG` and `bcabG`, at their own offsets. */
export const daySailGeo = () => sailGeo([0, 1.35, 0.1], [0, 7.3, -0.05], [0, 1.8, -3.4], 0.3);
export const dayJibGeo = () => sailGeo([0, 0.95, 3.6], [0, 6.7, 0.1], [0, 1.1, 0.3], 0.24);
export const dayBoomGeo = () => new THREE.CylinderGeometry(0.07, 0.08, 3.6, 8)
  .rotateX(Math.PI / 2).translate(0, 1.72, -1.7);
export const dayMastGeo = () => new THREE.CylinderGeometry(0.09, 0.13, 7.6, 8)
  .translate(0, 4.8, 0.05);

/** `bcabG` — coachroof and a dark window band, welded so it is one draw call. */
export const dayCabinGeo = () => bundle([
  new THREE.BoxGeometry(1.5, 0.6, 2.6).translate(0, 1.28, -1.0),
  new THREE.BoxGeometry(1.56, 0.2, 2.2).translate(0, 1.42, -1.0),
]);

/** `brigG` — standing rigging and a guardrail, from their real endpoints. */
export function dayRigGeo(): THREE.BufferGeometry {
  const MHb = [0, 8.6, 0.05];
  return bundle([
    strut(MHb, [0, 1.1, 3.9], 0.03, 4),
    strut(MHb, [0, 0.95, -3.7], 0.03, 4),
    strut(MHb, [-1.1, 1.0, -0.2], 0.028, 4),
    strut(MHb, [1.1, 1.0, -0.2], 0.028, 4),
    strut([-1.2, 1.5, -2.8], [-1.25, 1.5, 2.2], 0.024, 4),
    strut([1.2, 1.5, -2.8], [1.25, 1.5, 2.2], 0.024, 4),
  ]);
}

/** The parts every boat in the marina wears regardless of kind: the mast at
 *  its per-kind height, from `put(masts, …)`. */
export const mastGeo = (h: number) => new THREE.CylinderGeometry(0.09, 0.14, 9.4, 12)
  .scale(1, h, 1).translate(0, DECK + 4.7 * h, 0.05);

export { mergeGeoms, standard, afloat, bundle, strut };
