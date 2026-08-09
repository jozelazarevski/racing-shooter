// World dressing: gradient sky, drifting clouds, horizon mountains, pine
// forest (snow-capped in the north), rocks and bushes — all instanced, all
// placed via the terrain's own height/surface lookups so nothing floats.
// Trees and big rocks get static colliders: no ghost scenery.
//
// Two things changed here when tracks became data:
//
// 1. EVERY PLACEMENT IS SEEDED. This used to call `Math.random()` 580-odd times
//    per load, so no two loads of the same track agreed on where anything was.
//    Each layer now draws from its own named stream forked off the track seed
//    (see core/rng.ts), which means the same track builds the same world every
//    time AND editing one layer does not move the others.
// 2. THE COUNTS, DISTANCES AND EXCLUSIONS ARE TRACK DATA. "260 pines, none
//    within 11 m of the road, never on tarmac or ice" was three hardcoded
//    loops; it is now `scenery` in the TrackDef, which is what lets a desert
//    track and an alpine track differ by more than palette.

import * as THREE from 'three';
import type RAPIER_API from '@dimforge/rapier3d-compat';
import type { Terrain } from '../tracks/terrain';
import type { TrackDef, SceneryLayer } from '../tracks/trackDef';
import { Rng } from '../core/rng';

export function buildSky(scene: THREE.Scene, def: TrackDef): THREE.Object3D {
  const cv = document.createElement('canvas');
  cv.width = 16; cv.height = 256;
  const ctx = cv.getContext('2d')!;
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  const [s0, s1, s2, s3] = def.sky.stops;
  g.addColorStop(0, s0);
  g.addColorStop(0.55, s1);
  g.addColorStop(0.8, s2);
  g.addColorStop(1, s3);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 16, 256);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(Math.max(1100, def.world.size * 1.25), 24, 16),
    new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, fog: false, depthWrite: false }),
  );
  dome.renderOrder = -10;
  scene.add(dome);
  return dome;
}

export function buildClouds(scene: THREE.Scene, def: TrackDef): THREE.Group {
  const rng = Rng.fork(def.seed, 'clouds');
  const group = new THREE.Group();
  const puffGeo = new THREE.IcosahedronGeometry(1, 1);
  // self-lit so the undersides never go muddy against the sky
  const mat = new THREE.MeshStandardMaterial({
    color: 0xffffff, roughness: 1, flatShading: true,
    emissive: 0xe8f0f6, emissiveIntensity: 0.55,
  });
  const N = def.sky.clouds;
  for (let i = 0; i < N; i++) {
    const cloud = new THREE.Group();
    const n = 3 + (i % 3);
    for (let p = 0; p < n; p++) {
      const puff = new THREE.Mesh(puffGeo, mat);
      const s = 9 + rng.float() * 14;
      puff.scale.set(s, s * 0.45, s * 0.8);
      puff.position.set(p * 11 - n * 5 + rng.centered(3), rng.centered(1.5), rng.centered(4));
      cloud.add(puff);
    }
    const a = (i / N) * Math.PI * 2;
    cloud.position.set(
      Math.cos(a) * (250 + rng.float() * 400), 120 + rng.float() * 60, Math.sin(a) * (250 + rng.float() * 400),
    );
    group.add(cloud);
  }
  scene.add(group);
  return group;
}

export function buildMountains(scene: THREE.Scene, def: TrackDef): THREE.Object3D {
  const rng = Rng.fork(def.seed, 'mountains');
  const M = def.sky.mountains;
  const geo = new THREE.ConeGeometry(1, 1, 5);
  geo.translate(0, 0.5, 0);
  const mat = new THREE.MeshStandardMaterial({ roughness: 1, flatShading: true });
  const mounts = new THREE.InstancedMesh(geo, mat, M.count);
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const col = new THREE.Color();
  for (let i = 0; i < M.count; i++) {
    const a = (i / M.count) * Math.PI * 2 + Math.sin(i * 3.7) * 0.1;
    const r = M.radius + Math.sin(i * 2.3) * 120;
    const h = M.height + Math.sin(i * 1.7 + 1) * 45 + rng.float() * 30;
    const w = h * (1.3 + rng.float() * 0.8);
    q.setFromAxisAngle(up, rng.float() * Math.PI);
    m4.compose(new THREE.Vector3(Math.cos(a) * r, -6, Math.sin(a) * r), q, new THREE.Vector3(w, h, w));
    mounts.setMatrixAt(i, m4);
    // far peaks read blue-gray; the ones past the snowline catch snow
    const snowy = Math.sin(a) < M.snowline;
    col.setHex(snowy ? 0xdde8f0 : 0x8195a8).offsetHSL(0, 0, rng.centered(0.025));
    mounts.setColorAt(i, col);
  }
  scene.add(mounts);
  return mounts;
}

interface LayerMeshes {
  meshes: THREE.Object3D[];
  placed: number;
}

/** Shared placement loop. Returns the accepted spots for a layer.
 *
 *  The guard is proportional to the requested count rather than a flat 3000:
 *  a track whose scenery rules reject most of the map (a narrow alpine valley,
 *  say) used to silently come up short against a fixed budget, and "why are
 *  there only 40 trees" is a miserable thing to debug when nothing reports it. */
function placeLayer(
  layer: SceneryLayer, terrain: Terrain, rng: Rng,
): { x: number; z: number; y: number; surf: string; scale: number }[] {
  const spread = terrain.def.world.size * layer.spread;
  const out: { x: number; z: number; y: number; surf: string; scale: number }[] = [];
  const budget = Math.max(3000, layer.count * 20);
  let guard = 0;
  while (out.length < layer.count && guard++ < budget) {
    const x = rng.centered(spread / 2);
    const z = rng.centered(spread / 2);
    if (terrain.distToRoad(x, z) < layer.minRoadDist) continue;
    if (Math.hypot(x - terrain.spawn.x, z - terrain.spawn.z) < layer.minSpawnDist) continue;
    const surf = terrain.surfaceIdAt(x, z);
    if (layer.avoidSurfaces.includes(surf)) continue;
    let s = rng.range(layer.scale[0], layer.scale[1]);
    if (layer.scaleBonusOn && layer.scaleBonusOn.surfaces.includes(surf)) {
      s += rng.float() * layer.scaleBonusOn.extra;
    }
    out.push({ x, z, y: terrain.heightAt(x, z), surf, scale: s });
  }
  if (out.length < layer.count) {
    console.warn(
      `[scenery] ${layer.kind}: placed ${out.length}/${layer.count} — the track's rules reject `
      + `too much of the map (minRoadDist ${layer.minRoadDist}, avoids ${layer.avoidSurfaces.join('/')})`,
    );
  }
  return out;
}

function buildPines(
  scene: THREE.Scene, terrain: Terrain, layer: SceneryLayer, rng: Rng,
  world: RAPIER_API.World | null, RAPIER: typeof RAPIER_API | null, solids: RAPIER_API.RigidBody | null,
): LayerMeshes {
  const spots = placeLayer(layer, terrain, rng);
  const COUNT = Math.max(1, spots.length);
  const trunkGeo = new THREE.CylinderGeometry(0.22, 0.34, 1.8, 6);
  trunkGeo.translate(0, 0.9, 0);
  const lowGeo = new THREE.ConeGeometry(1.9, 3.1, 7);
  lowGeo.translate(0, 3.0, 0);
  const topGeo = new THREE.ConeGeometry(1.25, 2.4, 7);
  topGeo.translate(0, 4.9, 0);
  const capGeo = new THREE.ConeGeometry(0.95, 1.5, 7);
  capGeo.translate(0, 5.5, 0);
  const trunks = new THREE.InstancedMesh(trunkGeo, new THREE.MeshStandardMaterial({ color: 0x5a4028, roughness: 1 }), COUNT);
  const lows = new THREE.InstancedMesh(lowGeo, new THREE.MeshStandardMaterial({ roughness: 1, flatShading: true }), COUNT);
  const tops = new THREE.InstancedMesh(topGeo, new THREE.MeshStandardMaterial({ roughness: 1, flatShading: true }), COUNT);
  const caps = new THREE.InstancedMesh(capGeo, new THREE.MeshStandardMaterial({ color: 0xf2f6fa, roughness: 0.9, flatShading: true }), COUNT);
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const col = new THREE.Color();
  let ti = 0, ci = 0;
  for (const spot of spots) {
    const s = spot.scale;
    q.setFromAxisAngle(up, rng.float() * Math.PI * 2);
    m4.compose(new THREE.Vector3(spot.x, spot.y - 0.2, spot.z), q, new THREE.Vector3(s, s * (0.9 + rng.float() * 0.35), s));
    trunks.setMatrixAt(ti, m4);
    lows.setMatrixAt(ti, m4);
    tops.setMatrixAt(ti, m4);
    const snowy = spot.surf === 'snow';
    col.setHSL(0.33 + rng.float() * 0.05, snowy ? 0.18 : 0.42, snowy ? 0.3 : 0.24);
    lows.setColorAt(ti, col);
    tops.setColorAt(ti, col.clone().offsetHSL(0, 0, 0.05));
    if (snowy) { caps.setMatrixAt(ci, m4); ci++; }
    if (world && RAPIER && solids) {
      world.createCollider(
        RAPIER.ColliderDesc.cylinder(2.4 * s, 0.42 * s).setTranslation(spot.x, spot.y + 2.2 * s, spot.z), solids);
    }
    ti++;
  }
  trunks.count = lows.count = tops.count = ti;
  caps.count = ci;
  trunks.castShadow = lows.castShadow = tops.castShadow = true;
  scene.add(trunks, lows, tops, caps);
  return { meshes: [trunks, lows, tops, caps], placed: ti };
}

function buildRocks(
  scene: THREE.Scene, terrain: Terrain, layer: SceneryLayer, rng: Rng,
  world: RAPIER_API.World | null, RAPIER: typeof RAPIER_API | null, solids: RAPIER_API.RigidBody | null,
): LayerMeshes {
  const spots = placeLayer(layer, terrain, rng);
  const rockGeo = new THREE.DodecahedronGeometry(1, 0);
  rockGeo.scale(1, 0.72, 1);
  const rocks = new THREE.InstancedMesh(rockGeo, new THREE.MeshStandardMaterial({ roughness: 0.95, flatShading: true }), Math.max(1, spots.length));
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const col = new THREE.Color();
  let ri = 0;
  for (const spot of spots) {
    const s = spot.scale;
    q.setFromAxisAngle(up, rng.float() * Math.PI * 2);
    m4.compose(new THREE.Vector3(spot.x, spot.y + s * 0.15, spot.z), q, new THREE.Vector3(s, s, s));
    rocks.setMatrixAt(ri, m4);
    col.setHex(spot.surf === 'snow' ? 0xb8c4ce : spot.surf === 'sand' ? 0xc8a878 : 0x8d8a82)
      .offsetHSL(0, 0, rng.centered(0.04));
    rocks.setColorAt(ri, col);
    if (s > 1.1 && world && RAPIER && solids) {
      world.createCollider(RAPIER.ColliderDesc.ball(s * 0.85).setTranslation(spot.x, spot.y + s * 0.3, spot.z), solids);
    }
    ri++;
  }
  rocks.count = ri;
  rocks.castShadow = true;
  scene.add(rocks);
  return { meshes: [rocks], placed: ri };
}

function buildBushes(scene: THREE.Scene, terrain: Terrain, layer: SceneryLayer, rng: Rng): LayerMeshes {
  const spots = placeLayer(layer, terrain, rng);
  const bushGeo = new THREE.IcosahedronGeometry(1, 0);
  bushGeo.scale(1, 0.6, 1);
  const bushes = new THREE.InstancedMesh(bushGeo, new THREE.MeshStandardMaterial({ roughness: 1, flatShading: true }), Math.max(1, spots.length));
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const col = new THREE.Color();
  let bi = 0;
  for (const spot of spots) {
    const s = spot.scale;
    q.setFromAxisAngle(up, rng.float() * Math.PI * 2);
    m4.compose(new THREE.Vector3(spot.x, spot.y + s * 0.2, spot.z), q, new THREE.Vector3(s, s, s));
    bushes.setMatrixAt(bi, m4);
    col.setHSL(spot.surf === 'sand' ? 0.11 : 0.3, 0.35, 0.24).offsetHSL(0, 0, rng.centered(0.03));
    bushes.setColorAt(bi, col);
    bi++;
  }
  bushes.count = bi;
  scene.add(bushes);
  return { meshes: [bushes], placed: bi };
}

/** Build every scenery layer the track declares. `world`/`RAPIER` may be null,
 *  which is what the editor preview passes: scenery you can see but not hit,
 *  because the preview has no physics and does not need any. */
export function buildVegetation(
  scene: THREE.Scene, terrain: Terrain,
  world: RAPIER_API.World | null, RAPIER: typeof RAPIER_API | null,
): THREE.Object3D[] {
  const def = terrain.def;
  const solids = world && RAPIER ? world.createRigidBody(RAPIER.RigidBodyDesc.fixed()) : null;
  const added: THREE.Object3D[] = [];
  for (const layer of def.scenery) {
    // forked BY KIND, so adding rocks never moves the trees
    const rng = Rng.fork(def.seed, `scenery:${layer.kind}`);
    const res = layer.kind === 'pine' ? buildPines(scene, terrain, layer, rng, world, RAPIER, solids)
      : layer.kind === 'rock' ? buildRocks(scene, terrain, layer, rng, world, RAPIER, solids)
        : buildBushes(scene, terrain, layer, rng);
    added.push(...res.meshes);
  }
  return added;
}
