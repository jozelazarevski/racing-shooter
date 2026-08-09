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
import type { PropTemplate, PlaceCtx, PhysicsShape, Placement } from './props/types';
import { isSolid } from './props/types';
import { getTemplate, partsFor, resetPartCache } from './props/registry';
import { Rng } from '../core/rng';

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
    if (terrain.distToRoad(x, z) < layer.minRoadDist) continue;
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

  for (const [id, instances] of byTemplate) {
    const tpl = getTemplate(id)!;
    counts[id] = instances.length;
    if (!instances.length) continue;
    const parts = partsFor(tpl);

    for (const part of parts) {
      const eligible = part.when ? instances.filter((i) => part.when!(i.ctx)) : instances;
      if (!eligible.length) continue;
      const mesh = new THREE.InstancedMesh(part.geometry, part.material, eligible.length);
      // Named so tools can find the instances of a given component in a built
      // world. `tools/components-smoke.mjs` reads the actual matrices out of
      // these to check that boats float — a check that restates the placement
      // rule instead of reading the result passes just as happily when the
      // builder is broken, which was true of this one until it was measured.
      mesh.name = `${id}:${part.key}`;
      mesh.castShadow = part.castShadow ?? false;
      let n = 0;
      for (const inst of eligible) {
        const s = inst.ctx.scale;
        pos.set(inst.ctx.x, inst.ctx.y + inst.yOffset + (part.offsetY ?? 0), inst.ctx.z);
        q.setFromAxisAngle(up, inst.rot);
        scl.set(s, s, s);
        m4.compose(pos, q, scl);
        mesh.setMatrixAt(n, m4);
        const tint = part.tint?.(inst.ctx);
        if (tint) mesh.setColorAt(n, tint);
        n++;
      }
      mesh.count = n;
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      scene.add(mesh);
      objects.push(mesh);
    }

    if (solids && world && RAPIER) {
      const friction = tpl.physics.friction ?? 1;
      for (const inst of instances) {
        if (!isSolid(tpl.physics, inst.ctx.scale)) continue;
        addCollider(tpl.physics.shape(inst.ctx.scale), inst.ctx, inst.rot, inst.yOffset, friction, world, RAPIER, solids);
      }
    }
  }

  return { objects, counts };
}
