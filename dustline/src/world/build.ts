// Building the world's components — scattered and hand-placed, one path.
//
// This replaces three near-identical hardcoded loops (`buildPines`,
// `buildRocks`, `buildBushes`), each of which had its own copy of the
// placement rules, its own instanced meshes and its own collider code. They
// differed in ways that were accidents rather than decisions: the pine loop
// had a guard of 4000 and the rock loop 3000, the pine checked spawn distance
// before surface and the rock after.
//
// Now there is ONE placement routine and ONE instancing routine, and what
// differs between a pine and a tyre stack lives in the component file where
// you can see it.
//
// TWO WAYS A COMPONENT REACHES THE WORLD:
//   - a SCATTER LAYER fills the landscape with them, seeded, by rule
//   - a PLACED PROP is one you put somewhere on purpose
// Both end up in the same InstancedMesh per part, so a hand-placed pine costs
// nothing extra over a scattered one.

import * as THREE from 'three';
import type RAPIER_API from '@dimforge/rapier3d-compat';
import type { TrackDef, SceneryLayer, PlacedProp, SurfaceId } from '../tracks/trackDef';
import type { Terrain } from '../tracks/terrain';
import type { PropTemplate, PropPart, PlaceCtx, PhysicsShape, Placement } from './props/types';
import { isSolid } from './props/types';
import { getTemplate, partsFor, resetPartCache } from './props/registry';
import { Rng } from '../core/rng';
// THE SKYLINE'S COLLIDERS ARE CREATED HERE, WITH EVERY OTHER COLLIDER IN THE
// WORLD. `render/horizon.ts` measures the shapes and hands over plain numbers;
// this file turns numbers into Rapier. The alternative — the renderer making
// its own colliders — is exactly the shape of the bug this fixes: v1's r148
// made the massif solid in one file and the skyline stayed bare in another,
// with no check spanning both.
import { horizonSolids } from '../render/horizon';

/** One instance of one component, ready to be written into a matrix. */
interface Instance {
  ctx: PlaceCtx;
  rot: number;
  yOffset: number;
}

/** Where the base of an instance sits, and what it is standing in.
 *
 *  ONE function, used by scatter and by hand placement alike, because the day
 *  they disagree is the day a boat you dragged in floats and the same boat
 *  scattered sits on the bottom. A floating component's base is the waterline;
 *  everything else stands on the ground. */
function siteAt(terrain: Terrain, x: number, z: number, placement: Placement) {
  const ground = terrain.heightAt(x, z);
  const level = terrain.waterLevel;
  const depth = level !== null ? Math.max(0, level - ground) : 0;
  const y = placement === 'water' && level !== null ? Math.max(ground, level) : ground;
  return { y, ground, depth };
}

/** Find room for `layer.count` instances under the layer's rules.
 *
 *  The rejection budget scales with the requested count instead of being a flat
 *  constant, and a shortfall is REPORTED. The old loops silently stopped at a
 *  fixed guard, so a layer whose rules rejected most of the map just quietly
 *  produced forty trees and nothing said why. */
function scatter(
  layer: SceneryLayer, tpl: PropTemplate, terrain: Terrain, rng: Rng,
): Instance[] {
  const def = terrain.def;
  const spread = def.world.size * layer.spread;
  const avoid = layer.avoidSurfaces ?? tpl.authoring.avoidSurfaces ?? [];
  const range = layer.scale ?? tpl.authoring.scale;
  const placement = tpl.authoring.placement ?? 'land';
  const minDepth = tpl.authoring.minDepth ?? 0.4;
  const shoreBand = tpl.authoring.shoreBand ?? 6;
  const out: Instance[] = [];
  const budget = Math.max(3000, layer.count * 20);
  let guard = 0;

  // A boat layer on a track with no water is not a near miss to be retried
  // three thousand times — it is a mistake, and it should say so once.
  if (placement !== 'land' && terrain.waterLevel === null) {
    console.warn(`[world] ${layer.template} needs water (${placement}) and this track has none — layer skipped`);
    return out;
  }

  while (out.length < layer.count && guard++ < budget) {
    const x = rng.centered(spread / 2);
    const z = rng.centered(spread / 2);
    const dRoad = terrain.distToRoad(x, z);
    if (dRoad < layer.minRoadDist) continue;
    if (layer.maxRoadDist !== undefined && dRoad > layer.maxRoadDist) continue;
    if (Math.hypot(x - terrain.spawn.x, z - terrain.spawn.z) < layer.minSpawnDist) continue;
    const site = siteAt(terrain, x, z, placement);
    // Water is a placement rule, not a surface, so it is filtered here rather
    // than through avoidSurfaces — the bed of a lake is still "dirt".
    if (placement === 'land' && site.depth > 0) continue;
    if (placement === 'water' && site.depth < minDepth) continue;
    if (placement === 'shore' && (site.depth > 0 || terrain.distToWater(x, z, shoreBand) > shoreBand)) continue;
    const surface = terrain.surfaceIdAt(x, z) as SurfaceId;
    if (avoid.includes(surface)) continue;
    let scale = rng.range(range[0], range[1]);
    if (layer.scaleBonusOn && layer.scaleBonusOn.surfaces.includes(surface)) {
      scale += rng.float() * layer.scaleBonusOn.extra;
    }
    out.push({
      ctx: { x, z, ...site, surface, scale, rng },
      rot: tpl.authoring.randomYaw ? rng.float() * Math.PI * 2 : 0,
      yOffset: 0,
    });
  }

  if (out.length < layer.count) {
    const why = placement === 'land' ? '' : `, wants ${placement}`;
    console.warn(
      `[world] ${layer.template}: placed ${out.length}/${layer.count} — the rules reject too much `
      + `of the map (minRoadDist ${layer.minRoadDist}, avoids ${avoid.join('/') || 'nothing'}${why})`,
    );
  }
  return out;
}

/** A hand-placed prop. Ground height is looked up NOW rather than stored, so
 *  editing the terrain under a prop moves the prop with it — and raising the
 *  water level lifts the boats you already placed. */
function placed(p: PlacedProp, tpl: PropTemplate, terrain: Terrain, rng: Rng): Instance {
  return {
    ctx: {
      x: p.x, z: p.z,
      ...siteAt(terrain, p.x, p.z, tpl.authoring.placement ?? 'land'),
      surface: terrain.surfaceIdAt(p.x, p.z) as SurfaceId,
      scale: p.scale, rng,
    },
    rot: p.rot,
    yOffset: p.yOffset ?? 0,
  };
}

/** Place one collider for one instance.
 *
 *  TWO THINGS THIS DID NOT USED TO DO, both found by building a set of
 *  components that RUN OUT from their own origin — a jetty, a slipway, a
 *  bridge deck, a flight of quay steps — rather than standing on it:
 *
 *  1. THE OFFSET. A shape could sit anywhere in Y and nowhere else, so a 22 m
 *     jetty deck got a hitbox centred on the shore end with half of it in open
 *     water. `centerX`/`centerZ` fix that, and they are rotated by the
 *     instance's yaw here — a jetty turned to face the water has to take its
 *     collider with it, and an offset applied in world space would swing the
 *     hitbox off the deck the moment you rotated the prop.
 *  2. THE ROTATION. Every box was axis-aligned however the prop was turned, so
 *     a 12 m barn at 45 degrees had a hitbox covering a quite different
 *     footprint from the barn. Boxes now carry the yaw.
 *
 *  Both default to the old behaviour when a component says nothing: offset zero
 *  is the old placement exactly, and a yawed box only differs from an axis
 *  aligned one for props that are actually rotated.
 */
function addCollider(
  shape: PhysicsShape, ctx: PlaceCtx, rot: number, yOffset: number, friction: number,
  world: RAPIER_API.World, RAPIER: typeof RAPIER_API, body: RAPIER_API.RigidBody,
) {
  if (shape.kind === 'none') return;
  const y = ctx.y + yOffset;
  // local offset, turned into the instance's frame
  const ox = shape.centerX ?? 0;
  const oz = shape.centerZ ?? 0;
  const cs = Math.cos(rot), sn = Math.sin(rot);
  const wx = ctx.x + ox * cs + oz * sn;
  const wz = ctx.z - ox * sn + oz * cs;

  let desc: RAPIER_API.ColliderDesc;
  switch (shape.kind) {
    case 'cylinder':
      desc = RAPIER.ColliderDesc.cylinder(shape.halfHeight, shape.radius);
      break;
    case 'ball':
      desc = RAPIER.ColliderDesc.ball(shape.radius);
      break;
    case 'box':
      desc = RAPIER.ColliderDesc.cuboid(...shape.halfExtents);
      break;
  }
  desc.setTranslation(wx, y + shape.centerY, wz);
  // A ball is a ball; a cylinder here is always upright, so yaw about Y does
  // nothing to either. Only the box needs turning.
  if (shape.kind === 'box' && rot) {
    const h = rot / 2;
    desc.setRotation({ x: 0, y: Math.sin(h), z: 0, w: Math.cos(h) });
  }
  world.createCollider(desc.setFriction(friction), body);
}

/** Friction on rock. The terrain trimesh is built with 1 (terrain.ts:484) and a
 *  mountain is the same stone as the ground it stands in, so it carries the
 *  same number rather than Rapier's 0.5 default. It is not cosmetic: against a
 *  hillside the car meets an oblique face, and the friction impulse is what
 *  turns a 54 m/s impact into a stop instead of a 33 m/s slide up the slope. */
const ROCK_FRICTION = 1;

/** MAKE THE SKYLINE SOLID.
 *
 *  One primitive per horizon instance, on the same fixed body as every other
 *  piece of scenery — chosen and sized in `render/horizon.ts`, which measures
 *  the drawn form and hands back a shape that CONTAINS it.
 *
 *  NOTHING IS EXEMPTED, and that is a decision rather than an oversight. The
 *  obvious economy is to skip peaks no car could reach, but "could reach" is a
 *  ballistic envelope off the edge of the terrain that moves with the car's
 *  tuning — `verify-solidity.mjs` recomputes it from `car.json` for exactly
 *  that reason — so any constant here would be a stale number waiting to
 *  become a hole.
 *
 *  MEASURED INSTEAD, because the exemption would only be worth arguing for if
 *  it bought something. 240 `world.step()` calls at the engine's own fixed
 *  timestep, nine batches, median, in the real game with the field spawned:
 *
 *    DUSTBOWL        362 -> 498 colliders   0.370 ms -> 0.378, 0.387 ms
 *    HARBOUR POINT   525 -> 622 colliders   0.521 ms -> 0.487, 0.448 ms
 *    PROVING GROUND  611 -> 722 colliders   0.648 ms -> 0.545, 0.556 ms
 *
 *  Two runs of the same build straddle the one before it — on two tracks the
 *  "after" is FASTER, which is what run-to-run noise looks like and what an
 *  honest reading of this table says: 343 more colliders did not move the step
 *  out of its own variance. They are convex primitives on a fixed body, so the
 *  broad phase sorts them once and the narrow phase never sees a pair. There
 *  is nothing here to buy back by exempting anything. */
function addHorizonSolids(
  def: TrackDef, world: RAPIER_API.World, RAPIER: typeof RAPIER_API, body: RAPIER_API.RigidBody,
) {
  const solids = horizonSolids(def);
  let worst = 0;
  for (const s of solids) {
    let desc: RAPIER_API.ColliderDesc;
    switch (s.kind) {
      case 'cone': desc = RAPIER.ColliderDesc.cone(s.halfHeight, s.radius); break;
      case 'cylinder': desc = RAPIER.ColliderDesc.cylinder(s.halfHeight, s.radius); break;
      case 'ball': desc = RAPIER.ColliderDesc.ball(s.radius); break;
      case 'box': desc = RAPIER.ColliderDesc.cuboid(s.half[0], s.half[1], s.half[2]); break;
    }
    desc.setTranslation(s.x, s.y, s.z);
    // Only the box has corners to turn: the other three are surfaces of
    // revolution about the same Y axis the instance is yawed around.
    if (s.kind === 'box' && s.yaw) {
      const h = s.yaw / 2;
      desc.setRotation({ x: 0, y: Math.sin(h), z: 0, w: Math.cos(h) });
    }
    world.createCollider(desc.setFriction(ROCK_FRICTION), body);
    worst = Math.max(worst, s.margin);
  }
  if (solids.length) {
    // an UPPER BOUND, and labelled as one: it is each fit's own worst case
    // against its form's widest band, not a measurement of the built world.
    // What the world actually does is measured from outside, by rays fired at
    // the colliders and the drawn triangles together.
    console.info(`[world] horizon: ${solids.length} solids, `
      + `fit margin <= ${worst.toFixed(1)} m`);
  }
}

// ===========================================================================
// HOW SCENERY IS DRAWN, AND WHY IT IS NOT ONE INSTANCED MESH PER PART ANY MORE
// ===========================================================================
//
// THE DEFECT. One InstancedMesh per part spans the whole 900 m world, so its
// bounding sphere always intersects the frustum and EVERY instance in the world
// is submitted every frame, in the colour pass and again in the shadow pass.
// Measured on HARBOUR POINT at the worst of sixteen poses round the lap:
// 231,016 colour triangles over 149 draws and 133,640 shadow triangles over 96,
// of which only 19.9% of the triangles were inside the frustum at all. Scenery
// was 89% of the frame's draw calls and 70% of its triangles, against a mobile
// budget of 150,000 triangles and 200 draws (`tools/verify-perf-budget.mjs`).
// Instancing buys draw calls; it does not buy culling.
//
// THE FIX IS SPATIAL, AND THE SHAPE OF IT WAS MEASURED, NOT ARGUED. Four
// designs were built and posed at the same sixteen stations; scenery alone:
//
//   design                                 colour draws  tris   shadow draws  tris
//   world-spanning instanced (was)              149    231,016      96     133,640
//   per-PART buckets, 60 m cells                370     65,405     227      48,223
//   parts merged per TEMPLATE, 60 m cells       162     69,461     106      48,223
//   EVERYTHING IN A CELL MERGED, 60 m cells      53     76,365      23      50,715
//   exact per-instance floor                      —     57,345       —      43,102
//
// Bucketing per part makes draws WORSE — splitting 241 part-meshes spatially
// multiplies them. Only merging ACROSS parts inside a cell gets under budget,
// and it costs +17% triangles over the per-instance floor because a cell is
// drawn whole or not at all. On this engine draws are the binding constraint,
// so that is the trade taken. 60 m is the cell size from that table.
//
// WHAT IT ACTUALLY DID, `tools/verify-perf-budget.mjs`, sixteen stations, the
// SCENERY category alone, measured before and after:
//
//   track            world tris   frame tris   draws   colour   shadow
//   dustbowl  before      73,036      117,440      15       10        5
//            after        73,036       28,317      57       41       16
//   harbour   before     280,588      364,656     245      149       96
//            after       253,188      131,895      86       51       35
//   proving   before     192,548      258,508     180      141       39
//            after       177,888       91,897      89       64       25
//
// The world column moved on its own — components were being trimmed in other
// files while this was measured — so the number that belongs to THIS change is
// the RATIO: a frame used to submit 130-161% of the world's scenery triangles
// (every instance, twice) and now submits 39-52% of it. Whole frame, worst
// portrait pose: dustbowl 242,062 tris / 48 draws -> 158,095 / 89;
// harbour 525,968 / 276 -> 293,375 / 117; proving ground 387,231 / 210 ->
// 213,275 / 119. Every draw-call check on every track is green for the first
// time, colour pass included.
//
// MERGING NEEDS ONE MATERIAL PER BATCH, and `ART-DIRECTION.md` is what makes
// that legal: "flat-shaded faceted geometry everywhere, with the road textured
// ... vertex colour on faceted geometry. No albedo maps." A part's material
// colour and its per-instance tint therefore become a vertex colour attribute,
// which is exactly what `setColorAt` was feeding the shader before — three
// defines `USE_COLOR` for `instancingColor` too, so the fragment arithmetic is
// unchanged (`WebGLProgram.js:794`).
//
// WHAT CANNOT JOIN A MERGED BATCH, counted in the built worlds rather than
// assumed: harbour 46 of 241 parts and proving ground 37 of 235, over 15 and 14
// distinct materials, carrying 26,200 and 17,362 triangles. Every one of them
// is textured, transparent, emissive or two-sided, and the two-sided ones are
// folded in anyway (see `prepare`). So what genuinely stays out is texture and
// emission — and 16,000 of those triangles on every track are ONE component,
// `grassTuft`, which carries an albedo map that `ART-DIRECTION.md` says nothing
// outside the road should have. That map is why the grass cannot share a cell's
// batch with everything else standing in it, and it is the largest single
// draw-call item left in this file's half of the frame: it is 16,000 triangles
// that are now submitted whole in every frame on every track, because splitting
// them costs more draws than the triangles are worth. Dropping the map from
// `grassTuft` (a component file, not this one) would fold it into the shared
// batch, and it would then be culled with everything else for nothing.
//
// ---------------------------------------------------------------------------
// COLLIDERS ARE NOT VISUALS, AND THE PLACEMENT IS STILL PUBLISHED
// ---------------------------------------------------------------------------
//
// This is a RENDERING change only. Every component keeps the per-instance
// Rapier collider it had, built from the same instance list, in the same loop,
// a few lines below the geometry that merged.
//
// But merging destroys the one-mesh-per-part structure that four tools read the
// world's placement out of — `verify-solidity` matches every solid instance to
// its collider and every collider to something drawn, `verify-clearance`
// measures those instances against the road, `components-smoke` checks that
// boats float, `verify-worlds` fingerprints the world. Those checks were red
// hours ago on defects the owner reported three times, and blinding them to win
// a draw call would be a straight loss.
//
// So the builder still publishes every instance's matrix in exactly the form
// they already read: THE PLACEMENT RECORD — the same `<component>:<part>`
// InstancedMesh, the same matrices, the same count, in the same order, holding
// NO GEOMETRY and sitting on a layer no camera renders. It is not a drawable:
// it issues no draw call and no triangle in either pass, and `renderer.info`
// never sees it. It cannot drift from what is drawn, because the batch and the
// record are filled from one instance list in one pass.
//
// TOOLS THAT NEED TO LEARN THE NEW PATH — reported rather than edited here,
// because this file owns none of them:
//   - `verify-solidity.mjs` classifies by name, so a batch lands in `component`
//     with the key `sceneryBatch`, which has no library entry and therefore no
//     verdict. Check 8 stays green and should not: the batch is a NEW DRAWING
//     PATH and the whole point of that census is that a path nobody remembered
//     is the bug. It wants an explicit rule ahead of the `':'` rule —
//     `if (n.startsWith('sceneryBatch:')) return { path: 'backdrop', key: 'sceneryBatch' }`
//     — and a BACKDROP entry saying: merged scenery geometry, solid BY PROXY,
//     every instance inside it is published by the `<component>:<part>`
//     placement records that checks 3 and 4 already match against colliders.

/** Cell size for the spatial batches, in metres. The measured optimum in the
 *  table above: at 60 m a harbour cell carries about 1,400 triangles, which is
 *  roughly two draw calls' worth at the budget's own exchange rate below, so a
 *  cell is worth its call and still small enough to be culled as a unit. */
const CELL_M = 60;

/** WHAT ONE DRAW CALL IS WORTH IN TRIANGLES, from the budget itself:
 *  `verify-perf-budget.mjs` spends 150,000 triangles and 200 draw calls on the
 *  same frame, so at the margin a draw call is worth 750 triangles. Used below
 *  to decide whether a batch is worth splitting spatially at all — a thin layer
 *  spread over the whole map (grass: 16,000 triangles over 79 cells on harbour)
 *  costs more in draws than it saves in triangles, and stays whole. */
const TRIS_PER_DRAW = 150_000 / 200;

/** How much of a batch a worst-case frame actually draws.
 *
 *  MEASURED, and it is the fraction of BATCHES drawn, not of triangles: at each
 *  track's worst portrait pose the renderer issued 64 of 299 harbour batches
 *  (21%), 67 of 283 on dustbowl (24%) and 99 of 318 on proving ground (31%).
 *  Mean 25%. (The three-lens analysis's 19.9% is the neighbouring figure for
 *  TRIANGLES inside the frustum, which is not the same quantity and is not the
 *  one this arithmetic needs.)
 *
 *  BOTH ENDS OF THAT RANGE WERE BUILT AND MEASURED, because the constant moves
 *  exactly one decision — whether the grass layer is split — and that decision
 *  is worth about 25 colour draws and 12,000 triangles a track:
 *
 *              0.20                              0.25
 *    dustbowl  143,594 tris / 115 draws / 93 col  158,095 /  89 /  67
 *    harbour   279,551 / 130 /  89                293,375 / 117 /  76
 *    proving   203,887 / 154 / 123  COLOUR FAIL   213,275 / 119 /  88
 *
 *  0.25 is taken, and it is the measured value rather than the flattering one.
 *  At 0.20 dustbowl slips under the triangle ceiling (96%) and proving ground
 *  misses the colour-pass ceiling; at 0.25 EVERY draw-call check on every track
 *  is green and the whole residual overage is triangles. That is the right way
 *  round for this engine — draws are the binding constraint the four measured
 *  designs above were chosen against — and the triangles that remain are not
 *  this file's: terrain 100,352, water 32,768 and the road 5,760 are one mesh
 *  each, world-spanning, and no camera angle culls any of them. */
const CELL_IN_VIEW = 0.25;

/** The layer the placement records sit on. Nothing in dustline sets `layers`
 *  on a camera, so every camera in the game and in the editor tests against
 *  layer 0 only and a record is skipped before frustum culling, before the
 *  shadow pass and before the raycaster. */
const RECORD_LAYER = 1;

/** One part's geometry, flattened into the form a merge can consume: no index,
 *  normals as that part's own material shades it, in the component's local
 *  space. Built once per part and reused by every instance of it. */
interface Prepared {
  pos: Float32Array;
  nrm: Float32Array;
  verts: number;
  tris: number;
}

/** Everything that goes into one batch from one part. `rgb` is the part's
 *  material colour times its per-instance tint, resolved in the ORDER THE
 *  BUILDER ALREADY WALKED — several tints draw from `ctx.rng` (grassTuft, rock,
 *  bush, birch), so evaluating them anywhere else would move the stream and
 *  reseed the world. */
interface Member {
  part: PropPart;
  src: Prepared;
  instances: Instance[];
  rgb: Uint8Array;
}

interface Bucket {
  /** the material every batch in this bucket is drawn with */
  material: THREE.Material;
  members: Member[];
  tris: number;
  cells: Set<string>;
}

const cellOf = (x: number, z: number) => `${Math.floor(x / CELL_M)},${Math.floor(z / CELL_M)}`;

/** THE ONE MATERIAL THE FLAT-SHADED WORLD MERGES INTO.
 *
 *  `roughness: 1, metalness: 0` is `templates/geometry.ts`'s own `standard()`
 *  default and the library's mode by a wide margin — 162,414 of harbour's
 *  251,276 scenery triangles are authored at exactly this. `flatShading` is
 *  FALSE here and that is not a change of look: a part whose material asks for
 *  flat shading has its face normals baked into the merged buffer by
 *  `prepare()`, which is the same normal the flat-shading derivative would have
 *  produced, so flat parts stay flat and smooth parts stay smooth in one
 *  material. `vertexColors` carries what `setColorAt` used to. */
const litMaterial = () => new THREE.MeshStandardMaterial({
  color: 0xffffff, roughness: 1, metalness: 0, flatShading: false, vertexColors: true,
});

/** ...and the one metals merge into. Kept apart from the matte batch because
 *  metalness is not a colour and cannot become one: a metal part folded into
 *  the matte material loses its environment reflection and reads as flat grey.
 *  The threshold is 0.25 — below it a material is a dielectric with a sheen
 *  (a ceramic insulator at 0.1) and belongs with the matte world; at or above
 *  it the surface is meant to be metal (0.3 to 0.65 across the library). */
const METAL_FLOOR = 0.25;
const metalMaterial = () => new THREE.MeshStandardMaterial({
  color: 0xffffff, roughness: 0.5, metalness: 0.5, flatShading: false, vertexColors: true,
});

/** Can this material's geometry be folded into a shared batch material, with
 *  only its colour surviving as vertex colour?
 *
 *  Everything a shared material would silently throw away disqualifies: any
 *  map, any transparency, any emission, any depth or blend trick. `side` is NOT
 *  in this list — a two-sided or inside-out part is folded into a one-sided
 *  batch by `prepare()` duplicating or reversing its triangles, which is exact
 *  and costs geometry rather than a draw call. */
function sharedShadable(m: THREE.Material): boolean {
  const s = m as THREE.MeshStandardMaterial;
  return m.type === 'MeshStandardMaterial'
    && !s.map && !s.normalMap && !s.emissiveMap && !s.roughnessMap && !s.metalnessMap
    && !s.aoMap && !s.alphaMap && !s.bumpMap && !s.displacementMap && !s.envMap && !s.lightMap
    && m.transparent !== true && m.opacity === 1 && m.alphaTest === 0
    && m.depthWrite !== false && m.depthTest !== false && s.wireframe !== true
    && s.emissive !== undefined && s.emissive.getHex() === 0;
}

/** Which batch a part belongs in. Two shared buckets carry the flat-shaded
 *  world; everything else is grouped by the material it was authored with, so a
 *  textured wall keeps its texture and only joins walls drawn from the same
 *  map. Keyed on the PARAMETERS rather than the material's uuid, because the
 *  twenty-one wall parts of the house table each build their own
 *  `MeshStandardMaterial` around one shared canvas. */
function bucketKey(m: THREE.Material): string {
  const s = m as THREE.MeshStandardMaterial;
  if (sharedShadable(m)) return s.metalness >= METAL_FLOOR ? 'metal' : 'lit';
  const tex = (t?: THREE.Texture | null) => (t ? t.uuid : '-');
  return ['as', m.type, m.side, m.transparent, m.opacity, m.alphaTest, m.depthWrite, m.depthTest,
    s.roughness, s.metalness, s.flatShading, s.emissive?.getHex(), s.emissiveIntensity,
    tex(s.map), tex(s.normalMap), tex(s.emissiveMap), tex(s.alphaMap), tex(s.aoMap),
    tex(s.roughnessMap), tex(s.metalnessMap)].join('|');
}

/** Flatten one part's geometry for merging.
 *
 *  THE NORMALS ARE THE POINT. `flatShading: true` is a fragment-shader
 *  derivative, so it is a property of the MATERIAL and cannot survive a merge
 *  into a shared one. It does not have to: a non-indexed geometry whose normals
 *  are recomputed has exactly the face normal at every vertex, which is what
 *  the derivative would have produced. So flat parts are baked flat here and
 *  the batch material shades smoothly, and both kinds of part look the same
 *  merged as they did instanced.
 *
 *  `fold` handles `side` for the shared buckets, which are FrontSide: a
 *  DoubleSide part is emitted twice, once wound backwards with its normals
 *  negated, and a BackSide part is emitted reversed only. That is exact, and it
 *  buys the boats' open hull shells — 1,912 triangles on harbour, 3,824 once
 *  doubled — a place in the matte batch instead of four materials of their own.
 *
 *  Nothing here mutates the part: `toNonIndexed()` and `clone()` both return a
 *  new geometry, and the shared part cache hands the same `PropPart` to the
 *  editor's palette thumbnails. */
function prepare(part: PropPart, fold: boolean): Prepared {
  const mat = part.material as THREE.MeshStandardMaterial;
  const g = part.geometry;
  const work = g.index ? g.toNonIndexed() : g.clone();
  if (mat.flatShading === true || !work.getAttribute('normal')) work.computeVertexNormals();
  const p = work.getAttribute('position') as THREE.BufferAttribute;
  const n = work.getAttribute('normal') as THREE.BufferAttribute;
  let pos = Float32Array.from(p.array as ArrayLike<number>);
  let nrm = Float32Array.from(n.array as ArrayLike<number>);
  const side = fold ? mat.side : THREE.FrontSide;
  if (side === THREE.DoubleSide || side === THREE.BackSide) {
    const tris = pos.length / 9;
    const back = new Float32Array(pos.length);
    const backN = new Float32Array(nrm.length);
    for (let t = 0; t < tris; t++) {
      // same three corners, wound the other way, facing the other way
      for (let k = 0; k < 3; k++) {
        const from = (t * 3 + [0, 2, 1][k]) * 3;
        const to = (t * 3 + k) * 3;
        back[to] = pos[from]; back[to + 1] = pos[from + 1]; back[to + 2] = pos[from + 2];
        backN[to] = -nrm[from]; backN[to + 1] = -nrm[from + 1]; backN[to + 2] = -nrm[from + 2];
      }
    }
    if (side === THREE.BackSide) { pos = back; nrm = backN; } else {
      const both = new Float32Array(pos.length * 2);
      const bothN = new Float32Array(nrm.length * 2);
      both.set(pos, 0); both.set(back, pos.length);
      bothN.set(nrm, 0); bothN.set(backN, nrm.length);
      pos = both; nrm = bothN;
    }
  }
  work.dispose();
  return { pos, nrm, verts: pos.length / 3, tris: pos.length / 9 };
}

/** IS THIS BUCKET WORTH SPLITTING INTO CELLS AT ALL?
 *
 *  Whole, it is one draw call and every one of its triangles is submitted every
 *  frame. Split, it is one draw call per occupied cell IN VIEW, and only those
 *  cells' triangles are submitted. So splitting buys `(1 - CELL_IN_VIEW) * tris`
 *  and costs `CELL_IN_VIEW * cells - 1` draw calls, and it is worth it exactly
 *  when the triangles saved per extra call beat the budget's own exchange rate.
 *
 *  It matters that this is a rule and not a list. The density pass is next, and
 *  the answer has to move with the world: grass at 4,000 tufts is 16,000
 *  triangles over 79 cells and stays whole, and the same layer at ten times the
 *  density splits, without anybody remembering to come back here. */
function worthSplitting(b: Bucket): boolean {
  const extraDraws = CELL_IN_VIEW * b.cells.size - 1;
  if (extraDraws <= 0) return true;                 // splitting costs nothing on average
  return b.tris * (1 - CELL_IN_VIEW) > TRIS_PER_DRAW * extraDraws;
}

/** One drawn batch: the members of a bucket that fall in one cell, or all of
 *  them when the bucket is not worth splitting. */
interface Group {
  cell: string;
  ox: number;
  oz: number;
  parts: { member: Member; instances: Instance[]; from: number[] }[];
}

/** WELD ONE GROUP INTO ONE BUFFER.
 *
 *  Every instance's geometry is transformed into the batch's frame and written
 *  out: position through the instance matrix, normal through its rotation alone
 *  (the instance scale is uniform, so it does not tilt a normal), colour flat
 *  per instance. That is the whole of the trade this file makes — the geometry
 *  is stored once per INSTANCE rather than once per part, and in exchange the
 *  frustum can throw away a cell of it in one test.
 *
 *  The instance matrix is written by hand rather than through `Matrix4`: it is
 *  a Y rotation and a uniform scale, three multiplies and two adds per
 *  component, and this loop runs over every vertex of every instance in the
 *  world — 759,000 of them on harbour. */
function weld(g: Group, material: THREE.Material, name: string): THREE.InstancedMesh {
  let verts = 0;
  let casts = false;
  for (const p of g.parts) {
    verts += p.member.src.verts * p.instances.length;
    if (p.member.part.castShadow) casts = true;
  }
  const pos = new Float32Array(verts * 3);
  const nrm = new Float32Array(verts * 3);
  const col = new Uint8Array(verts * 3);
  let o = 0;
  for (const p of g.parts) {
    const { pos: sp, nrm: sn, verts: nv } = p.member.src;
    const offsetY = p.member.part.offsetY ?? 0;
    for (let k = 0; k < p.instances.length; k++) {
      const inst = p.instances[k];
      const i0 = p.from[k] * 3;
      const r = p.member.rgb[i0], gr = p.member.rgb[i0 + 1], b = p.member.rgb[i0 + 2];
      const s = inst.ctx.scale;
      const c = Math.cos(inst.rot), sr = Math.sin(inst.rot);
      const tx = inst.ctx.x - g.ox;
      const ty = inst.ctx.y + inst.yOffset + offsetY;
      const tz = inst.ctx.z - g.oz;
      for (let i = 0; i < nv; i++) {
        const a = i * 3, w = o * 3;
        const x = sp[a], y = sp[a + 1], z = sp[a + 2];
        pos[w] = (x * c + z * sr) * s + tx;
        pos[w + 1] = y * s + ty;
        pos[w + 2] = (z * c - x * sr) * s + tz;
        const nx = sn[a], ny = sn[a + 1], nz = sn[a + 2];
        nrm[w] = nx * c + nz * sr;
        nrm[w + 1] = ny;
        nrm[w + 2] = nz * c - nx * sr;
        col[w] = r; col[w + 1] = gr; col[w + 2] = b;
        o++;
      }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
  // Unsigned bytes, normalised: a vertex colour is a flat per-instance constant
  // here, never a gradient, so the quantisation cannot band — it can only shift
  // a whole surface by at most half of 1/255 of the linear range, which at the
  // darkest colour in the library (0x201d1a, linear 0.0144) is under 4% and
  // invisible. It saves 9 bytes a vertex, which on harbour is 6.2 MB.
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3, true));
  // One batch, placed by its own matrix. It is an InstancedMesh with a single
  // instance rather than a Mesh, and the reason is honesty in the instruments
  // rather than rendering: `verify-perf-budget.mjs` identifies scenery as an
  // InstancedMesh whose name carries a ':', and a plain Mesh with a colour
  // attribute would be filed under TERRAIN — which would corrupt the one tool
  // this repository has for the mobile budget, for every other category too.
  const mesh = new THREE.InstancedMesh(geo, material, 1);
  mesh.name = name;
  mesh.castShadow = casts;
  mesh.setMatrixAt(0, new THREE.Matrix4().makeTranslation(g.ox, 0, g.oz));
  mesh.instanceMatrix.needsUpdate = true;
  return mesh;
}

/** Turn the buckets into drawn batches and hang them under one container.
 *
 *  THE CONTAINER IS NOT DECORATION. `editor/preview.ts` raycasts the top level
 *  of the built world to decide where a dropped prop lands, filtering to plain
 *  meshes; and `verify-worlds.mjs` fingerprints the top level, filtering to
 *  InstancedMeshes. Both walk `preview.objects` one level deep, so a batch
 *  parked under a container is invisible to both — the editor still drops props
 *  on the ground rather than on a roof, and the committed golden world
 *  fingerprint is untouched by a change that draws the same world differently.
 *  It is an `Object3D` and not a `Group` because `verify-perf-budget.mjs`
 *  identifies the cloud layer as "the only Group added straight to the scene". */
function emitBatches(scene: THREE.Scene, buckets: Map<string, Bucket>): THREE.Object3D {
  const t0 = performance.now();
  const root = new THREE.Object3D();
  root.name = 'sceneryBatches';
  let batches = 0, split = 0, tris = 0, bytes = 0, alwaysOn = 0, apart = 0;
  let bi = 0;
  for (const [key, bucket] of buckets) {
    if (key !== 'lit' && key !== 'metal') apart++;
    const groups = new Map<string, Group>();
    const doSplit = worthSplitting(bucket);
    if (doSplit) split++; else alwaysOn += bucket.tris;
    for (const member of bucket.members) {
      const byCell = new Map<string, { instances: Instance[]; from: number[] }>();
      for (let i = 0; i < member.instances.length; i++) {
        const inst = member.instances[i];
        const cell = doSplit ? cellOf(inst.ctx.x, inst.ctx.z) : '';
        let e = byCell.get(cell);
        if (!e) { e = { instances: [], from: [] }; byCell.set(cell, e); }
        e.instances.push(inst); e.from.push(i);
      }
      for (const [cell, e] of byCell) {
        let g = groups.get(cell);
        if (!g) {
          const [gx, gz] = cell ? cell.split(',').map(Number) : [0, 0];
          g = {
            cell,
            ox: cell ? (gx + 0.5) * CELL_M : 0,
            oz: cell ? (gz + 0.5) * CELL_M : 0,
            parts: [],
          };
          groups.set(cell, g);
        }
        g.parts.push({ member, instances: e.instances, from: e.from });
      }
    }
    // Sorted, so the built world does not depend on the order a Map happened to
    // fill — `verify-regression-memory` builds every track four times and
    // requires the whole fingerprint, geometry included, to be identical.
    for (const cell of [...groups.keys()].sort()) {
      const g = groups.get(cell)!;
      const mesh = weld(g, bucket.material, `sceneryBatch:${bi}${cell ? `@${cell}` : ''}`);
      root.add(mesh);
      batches++;
      const p = mesh.geometry.getAttribute('position');
      tris += p.count / 3;
      bytes += p.count * 27;                       // pos + normal f32, colour u8
    }
    bi++;
  }
  scene.add(root);
  // Says what the merge could and could not do, every build, because "the road
  // is the only textured surface" is a policy this world does not yet keep and
  // the exceptions are what cost draw calls. `apart` is how many materials
  // refused the two shared ones — textured, transparent, emissive or two-sided
  // — and `alwaysOn` is the geometry too thin to be worth culling, which is
  // submitted whole in every frame and is therefore the number to watch when
  // the density pass lands.
  console.info(`[world] scenery: ${batches} batches over ${buckets.size} materials `
    + `(${buckets.size - apart} shared, ${apart} kept apart; ${split} split into ${CELL_M} m cells, `
    + `${buckets.size - split} left whole at ${alwaysOn.toLocaleString()} always-drawn triangles), `
    + `${tris.toLocaleString()} triangles in ${(bytes / 1048576).toFixed(1)} MB of merged buffers, `
    // The welding cost, on the machine that ran it. It is a LOAD cost and a
    // rebuild cost — the editor rebuilds on every keystroke — and it is the
    // price of the culling, so it is stated rather than left to be discovered.
    + `welded in ${(performance.now() - t0).toFixed(0)} ms`);
  return root;
}

export interface BuiltWorld {
  objects: THREE.Object3D[];
  /** how many of each component actually made it into the world */
  counts: Record<string, number>;
}

/** Build every component the track asks for.
 *
 *  `world`/`RAPIER` may be null — that is the editor preview, which wants to
 *  see the scenery but has no physics and needs no colliders. */
export function buildComponents(
  scene: THREE.Scene, terrain: Terrain,
  world: RAPIER_API.World | null, RAPIER: typeof RAPIER_API | null,
): BuiltWorld {
  const def: TrackDef = terrain.def;
  // Geometry from the previous world has been disposed by the caller, so the
  // shared part cache must go with it or we hand out dead buffers.
  resetPartCache();

  const byTemplate = new Map<string, Instance[]>();
  const push = (id: string, inst: Instance) => {
    const list = byTemplate.get(id);
    if (list) list.push(inst); else byTemplate.set(id, [inst]);
  };

  for (const layer of def.scenery) {
    const tpl = getTemplate(layer.template);
    if (!tpl) { console.warn(`[world] unknown component "${layer.template}" in a scatter layer`); continue; }
    // forked BY COMPONENT, so adding rocks never moves the trees
    const rng = Rng.fork(def.seed, `scatter:${layer.template}`);
    for (const inst of scatter(layer, tpl, terrain, rng)) push(layer.template, inst);
  }

  // Placed props draw from their own stream, so hand-placing something does not
  // reshuffle the scattered world around it.
  const placedRng = Rng.fork(def.seed, 'placed');
  for (const p of def.props ?? []) {
    const tpl = getTemplate(p.template);
    if (!tpl) { console.warn(`[world] unknown component "${p.template}" placed`); continue; }
    push(p.template, placed(p, tpl, terrain, placedRng));
  }

  const objects: THREE.Object3D[] = [];
  const counts: Record<string, number> = {};
  const solids = world && RAPIER ? world.createRigidBody(RAPIER.RigidBodyDesc.fixed()) : null;
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const pos = new THREE.Vector3();
  const scl = new THREE.Vector3();
  const tintCol = new THREE.Color();

  // ONE geometry, shared by every placement record, and it is empty on purpose:
  // a record publishes where the instances are, and the instances are drawn by
  // the batches below. See the essay above `CELL_M`.
  const recordGeometry = new THREE.BufferGeometry();
  const buckets = new Map<string, Bucket>();
  const prepared = new Map<PropPart, Prepared>();

  for (const [id, instances] of byTemplate) {
    const tpl = getTemplate(id)!;
    counts[id] = instances.length;
    if (!instances.length) continue;
    const parts = partsFor(tpl);

    for (const part of parts) {
      const eligible = part.when ? instances.filter((i) => part.when!(i.ctx)) : instances;
      if (!eligible.length) continue;

      // THE PLACEMENT RECORD. Named so tools can find the instances of a given
      // component in a built world. `tools/components-smoke.mjs` reads the
      // actual matrices out of these to check that boats float — a check that
      // restates the placement rule instead of reading the result passes just
      // as happily when the builder is broken, which was true of this one until
      // it was measured. `verify-solidity` and `verify-clearance` read the same
      // matrices to match every solid instance against its collider and against
      // the road. It carries no geometry and no camera renders its layer, so it
      // costs nothing in either pass.
      const mesh = new THREE.InstancedMesh(recordGeometry, part.material, eligible.length);
      mesh.name = `${id}:${part.key}`;
      mesh.layers.set(RECORD_LAYER);
      mesh.frustumCulled = false;        // never reached: the layer test comes first

      const key = bucketKey(part.material);
      let bucket = buckets.get(key);
      if (!bucket) {
        bucket = {
          material: key === 'lit' ? litMaterial() : key === 'metal' ? metalMaterial()
            : Object.assign(part.material.clone(), { vertexColors: true }),
          members: [], tris: 0, cells: new Set(),
        };
        // the batch's own colour is white: every part's colour is in the
        // vertex buffer now, and a tinted batch material would multiply twice
        (bucket.material as THREE.MeshStandardMaterial).color?.setHex(0xffffff);
        buckets.set(key, bucket);
      }
      let src = prepared.get(part);
      // Only the two SHARED materials are FrontSide and therefore need a
      // two-sided part folding into one-sided geometry; an as-authored bucket
      // keeps the `side` its parts were written with.
      if (!src) { src = prepare(part, key === 'lit' || key === 'metal'); prepared.set(part, src); }

      // The tints are resolved HERE, inside the walk the builder already made,
      // because several of them draw from `ctx.rng` — evaluating them later, in
      // cell order, would move the stream and reseed the world.
      const rgb = new Uint8Array(eligible.length * 3);
      const base = (part.material as THREE.MeshStandardMaterial).color;
      let n = 0;
      for (const inst of eligible) {
        const s = inst.ctx.scale;
        pos.set(inst.ctx.x, inst.ctx.y + inst.yOffset + (part.offsetY ?? 0), inst.ctx.z);
        q.setFromAxisAngle(up, inst.rot);
        scl.set(s, s, s);
        m4.compose(pos, q, scl);
        mesh.setMatrixAt(n, m4);
        tintCol.copy(base);
        const tint = part.tint?.(inst.ctx);
        if (tint) tintCol.multiply(tint);
        // three's own arithmetic, byte for byte: material colour times
        // instance colour, in the linear working space both already live in
        rgb[n * 3] = Math.max(0, Math.min(255, Math.round(tintCol.r * 255)));
        rgb[n * 3 + 1] = Math.max(0, Math.min(255, Math.round(tintCol.g * 255)));
        rgb[n * 3 + 2] = Math.max(0, Math.min(255, Math.round(tintCol.b * 255)));
        bucket.cells.add(cellOf(inst.ctx.x, inst.ctx.z));
        n++;
      }
      mesh.count = n;
      mesh.instanceMatrix.needsUpdate = true;
      scene.add(mesh);
      objects.push(mesh);

      bucket.members.push({ part, src, instances: eligible, rgb });
      bucket.tris += src.tris * eligible.length;
    }

    if (solids && world && RAPIER) {
      const friction = tpl.physics.friction ?? 1;
      for (const inst of instances) {
        if (!isSolid(tpl.physics, inst.ctx.scale)) continue;
        addCollider(tpl.physics.shape(inst.ctx.scale), inst.ctx, inst.rot, inst.yOffset, friction, world, RAPIER, solids);
      }
    }
  }

  if (buckets.size) objects.push(emitBatches(scene, buckets));

  // The skyline is scenery too. It is drawn by `render/horizon.ts` and made
  // solid here, on the same body, for the reason above the import: one file
  // creates the colliders in this world, so there is no second path to forget.
  if (solids && world && RAPIER) addHorizonSolids(def, world, RAPIER, solids);

  return { objects, counts };
}
