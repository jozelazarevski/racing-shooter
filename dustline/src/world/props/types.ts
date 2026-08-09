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

// ---- small shared helpers, so templates stay declarative -------------------

/** A cone whose BASE sits at `baseY` — three.js centres cones on their origin,
 *  and forgetting to translate is why half of every roof used to be inside the
 *  house it belonged to. */
export function coneAt(radius: number, height: number, seg: number, baseY: number): THREE.ConeGeometry {
  const g = new THREE.ConeGeometry(radius, height, seg);
  g.translate(0, baseY + height / 2, 0);
  return g;
}

export function cylinderAt(rTop: number, rBottom: number, height: number, seg: number, baseY: number) {
  const g = new THREE.CylinderGeometry(rTop, rBottom, height, seg);
  g.translate(0, baseY + height / 2, 0);
  return g;
}

export function boxAt(w: number, h: number, d: number, baseY: number): THREE.BoxGeometry {
  const g = new THREE.BoxGeometry(w, h, d);
  g.translate(0, baseY + h / 2, 0);
  return g;
}

export const standard = (color: number, opts: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 1, flatShading: true, ...opts });

export function sphereAt(radius: number, seg: number, centreY: number): THREE.SphereGeometry {
  const g = new THREE.SphereGeometry(radius, seg, Math.max(4, seg >> 1));
  g.translate(0, centreY, 0);
  return g;
}

/** Merge geometries into one buffer.
 *
 *  three's own BufferGeometryUtils lives in examples/ and pulling that module in
 *  for a handful of boxes is not worth the bytes. This keeps position and
 *  normal only, which is all any component here needs — none of them are
 *  textured, and carrying empty UV arrays into every instanced mesh in the
 *  world is a real cost for nothing.
 *
 *  Merging matters for INSTANCING: a fence made of five separate parts is five
 *  InstancedMeshes and five draw calls, where one merged part is one. Parts
 *  should stay separate only when they need different materials or their own
 *  per-instance tint. */
export function mergeGeoms(list: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const flat = list.map((g) => (g.index ? g.toNonIndexed() : g));
  for (const g of flat) if (!g.getAttribute('normal')) g.computeVertexNormals();
  let total = 0;
  for (const g of flat) total += g.getAttribute('position').count;
  const pos = new Float32Array(total * 3);
  const nrm = new Float32Array(total * 3);
  let o = 0;
  for (const g of flat) {
    const p = g.getAttribute('position') as THREE.BufferAttribute;
    const n = g.getAttribute('normal') as THREE.BufferAttribute;
    pos.set(p.array as Float32Array, o * 3);
    nrm.set(n.array as Float32Array, o * 3);
    o += p.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
  return out;
}

/** ROUGHEN A SHAPE, without rounding it off.
 *
 *  A rock is a Dodecahedron. Subdividing one to get more polygons just makes it
 *  a SPHERE — more triangles and a worse rock — so the extra detail has to buy
 *  irregularity rather than smoothness. Every vertex is pushed along its own
 *  radius by a hash of where it is, which keeps the facets flat and hard but
 *  stops any two faces agreeing on a plane.
 *
 *  The hash is a function of position, not a random stream: the same shape
 *  comes out of every build, and it does not matter what order geometries are
 *  created in. */
export function craggy(g: THREE.BufferGeometry, amount: number): THREE.BufferGeometry {
  const p = g.getAttribute('position') as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const n = Math.sin(v.x * 12.9898 + v.y * 78.233 + v.z * 37.719) * 43758.5453;
    const k = 1 + (n - Math.floor(n) - 0.5) * 2 * amount;
    p.setXYZ(i, v.x * k, v.y * k, v.z * k);
  }
  p.needsUpdate = true;
  g.computeVertexNormals();
  return g;
}

/** Merge geometries KEEPING UVs.
 *
 *  `mergeGeoms` drops them on purpose — nothing in the library was textured, and
 *  carrying empty UV arrays into every instanced mesh in the world is a real
 *  cost for nothing. Then the house templates arrived with a window texture,
 *  and a merged wall with no UVs samples texel (0,0) across its whole face: a
 *  solid brown box where the windows should be.
 *
 *  So this is the same merge with the UV channel carried through, used ONLY by
 *  the parts that are textured. Anything without a `uv` attribute contributes
 *  zeroes rather than shifting every following vertex's UVs, which is the bug
 *  you get from packing a short array. */
export function mergeGeomsUV(list: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const flat = list.map((g) => (g.index ? g.toNonIndexed() : g));
  for (const g of flat) if (!g.getAttribute('normal')) g.computeVertexNormals();
  let total = 0;
  for (const g of flat) total += g.getAttribute('position').count;
  const pos = new Float32Array(total * 3);
  const nrm = new Float32Array(total * 3);
  const uvs = new Float32Array(total * 2);
  let o = 0;
  for (const g of flat) {
    const p = g.getAttribute('position') as THREE.BufferAttribute;
    const n = g.getAttribute('normal') as THREE.BufferAttribute;
    const u = g.getAttribute('uv') as THREE.BufferAttribute | undefined;
    pos.set(p.array as Float32Array, o * 3);
    nrm.set(n.array as Float32Array, o * 3);
    if (u) uvs.set(u.array as Float32Array, o * 2);
    o += p.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
  out.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  return out;
}

/** A box placed and rotated in the component's local space — the workhorse for
 *  anything built out of planks, posts and panels. */
export function beam(
  w: number, h: number, d: number,
  x: number, y: number, z: number,
  rx = 0, ry = 0, rz = 0,
): THREE.BoxGeometry {
  const g = new THREE.BoxGeometry(w, h, d);
  if (rx) g.rotateX(rx);
  if (ry) g.rotateY(ry);
  if (rz) g.rotateZ(rz);
  g.translate(x, y, z);
  return g;
}
