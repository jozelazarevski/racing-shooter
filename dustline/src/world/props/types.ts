// WHAT A WORLD COMPONENT IS.
//
// One file per element. Each one carries the three things that used to be
// scattered across the codebase for every object in the world:
//
//   1. ITS GEOMETRY — how it is built, in local space, base at y = 0.
//   2. ITS PHYSICAL RULES — what collider it gets, whether it is solid, how
//      heavy it is. Previously this lived hundreds of lines away from the mesh
//      it belonged to, in the scatter loop, which is how you end up with a tree
//      whose trunk collider is a different size from its trunk.
//   3. HOW IT MAY BE PLACED — what surfaces it belongs on, how far it must sit
//      from the road, how it varies.
//
// The preview is not a fourth thing to maintain: it is RENDERED FROM THE
// GEOMETRY. A hand-made thumbnail is a picture that starts out accurate and
// then quietly stops being, which is worse than no picture at all.
//
// INSTANCING IS THE REASON FOR `parts`. A world holds hundreds of trees. Each
// part becomes one InstancedMesh shared by every copy, so 260 pines with four
// parts cost four draw calls, not 1,040. A template therefore describes its
// geometry ONCE, in parts, rather than building a Group per instance.

import * as THREE from 'three';
import type { SurfaceId } from '../../tracks/trackDef';
import type { Rng } from '../../core/rng';

/** Where an instance is going, and what it is standing on. Handed to the
 *  per-instance hooks so a template can react to its surroundings — the pine
 *  that grows a snow cap in the north does it with this. */
export interface PlaceCtx {
  x: number;
  z: number;
  /** The height the component's base sits at — ground for most things, the
   *  water surface for a floating one. Not necessarily the terrain height:
   *  read `ground` for that. */
  y: number;
  /** terrain height at (x, z), whether or not it is under water */
  ground: number;
  /** How deep the water is here, 0 on dry land. A jetty reads this to know how
   *  long its legs must be. */
  depth: number;
  surface: SurfaceId;
  /** uniform scale chosen for this instance */
  scale: number;
  rng: Rng;
}

/** One instanced piece of a component. */
export interface PropPart {
  key: string;
  /** Local space, base at y = 0, unit-ish size — the instance matrix scales it. */
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  /** Per-instance colour. Returning null leaves the material colour alone. */
  tint?: (ctx: PlaceCtx) => THREE.Color | null;
  /** Per-instance opt-out — the snow cap that only appears on snow. */
  when?: (ctx: PlaceCtx) => boolean;
  /** Extra local transform for this part, applied before the instance matrix. */
  offsetY?: number;
  castShadow?: boolean;
}

/** A collider, in the component's own local frame.
 *
 *  `centerX` and `centerZ` DEFAULT TO ZERO, and for most of the library that is
 *  right: a tree, a rock, a house is centred on its own origin. It is wrong for
 *  anything that RUNS OUT from its origin — a jetty, a slipway, a flight of
 *  quay steps, a bridge deck — and until these two fields existed those
 *  components had half their hitbox in empty space beside them. The jetty
 *  shipped that way: 22 m of deck running out along +Z, and a collider centred
 *  on the shore end.
 *
 *  The offset is in LOCAL space and is rotated by the instance's yaw when the
 *  collider is placed, which is the whole point — a jetty turned to face the
 *  water has to take its hitbox with it. */
export type PhysicsShape =
  | { kind: 'none' }
  | { kind: 'cylinder'; halfHeight: number; radius: number; centerY: number; centerX?: number; centerZ?: number }
  | { kind: 'ball'; radius: number; centerY: number; centerX?: number; centerZ?: number }
  | { kind: 'box'; halfExtents: [number, number, number]; centerY: number; centerX?: number; centerZ?: number };

/** The physical rules, as data. `shape` is a function of scale because a
 *  collider that ignores the instance scale is the classic invisible-wall bug:
 *  a small rock you can drive over and a large one you cannot must not share a
 *  hitbox. */
export interface PhysicsRule {
  /** Collider for an instance at this scale, in local space relative to the
   *  instance origin (which sits on the ground). */
  shape: (scale: number) => PhysicsShape;
  /** Solid things stop a car. Non-solid things are dressing and get no
   *  collider at all, however big they look. */
  solid: boolean | ((scale: number) => boolean);
  /** Static mass in kg, for the day M4 lets you knock things over. Recorded now
   *  because it is a property of the object, and inventing it later per-object
   *  is how a hay bale ends up heavier than a boulder. */
  massKg?: number;
  friction?: number;
}

/** WHAT A COMPONENT STANDS ON.
 *
 *  - `land`   — the default. Sits on the terrain, and scatter refuses to put it
 *               under water: a pine growing on a lake bed is the giveaway that
 *               nothing in the system knows the lake is there.
 *  - `water`  — floats. Its base is the WATER SURFACE, not the bed, so a boat
 *               in 1 m and a boat in 8 m of water both sit at the waterline.
 *               Scatter only puts it where there is water deep enough.
 *  - `shore`  — wants the boundary: scatter keeps it on land, but within
 *               `shoreBand` metres of the waterline. Reeds and jetties.
 *
 *  This governs SCATTER. Hand placement is never refused — drop a rowboat in a
 *  field if you mean to — but a floating component always floats, wherever you
 *  put it, because "it is a boat" is a fact about the component and not about
 *  where it was dropped. */
export type Placement = 'land' | 'water' | 'shore';

export interface AuthoringRule {
  /** scale range offered when placing by hand and when scattering */
  scale: [number, number];
  /** Default `land`. */
  placement?: Placement;
  /** For `water`: the least depth this thing can sit in without looking
   *  beached. For `shore`: how far inland from the waterline it may stray. */
  shoreBand?: number;
  minDepth?: number;
  /** default when dropped from the palette */
  defaultScale: number;
  /** never scattered onto these surfaces (hand placement is always allowed —
   *  if you drop a palm on ice, you meant to) */
  avoidSurfaces?: SurfaceId[];
  /** scattering keeps this far from the road centreline */
  minRoadDist?: number;
  /** instances get a random Y rotation when scattered */
  randomYaw?: boolean;
  /** distance from the camera at which the preview thumbnail is framed */
  previewDist?: number;
}

export interface PropTemplate {
  id: string;
  name: string;
  category: 'flora' | 'terrain' | 'trackside' | 'structure' | 'settlement' | 'marine' | 'debris';
  /** one line, shown under the palette thumbnail */
  description: string;
  /** Built once per world. Geometries and materials are shared by every
   *  instance, so this must not close over per-instance state. */
  build: () => PropPart[];
  physics: PhysicsRule;
  authoring: AuthoringRule;
}

/** Resolve `solid`, which may be a predicate on scale. */
export function isSolid(rule: PhysicsRule, scale: number): boolean {
  return typeof rule.solid === 'function' ? rule.solid(scale) : rule.solid;
}

// ---- geometry helpers live in `src/templates/` -----------------------------
//
// They used to be defined here, at the bottom of the file that defines what a
// component IS. That was fine while they were only ever used by components, and
// stopped being fine the moment the horizon, the boats and the house table
// wanted them too — a shared shape library should not live inside the contract
// for one of its consumers.
//
// They are re-exported rather than merely moved so a component file still has
// ONE import for "the thing I am and the tools I build with". Nothing that
// imports `./types` had to change.
export {
  coneAt, cylinderAt, boxAt, sphereAt, beam, standard, mergeGeoms, mergeGeomsUV, craggy,
} from '../../templates/geometry';
