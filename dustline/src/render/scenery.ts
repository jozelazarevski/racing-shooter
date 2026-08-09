// World dressing: gradient sky, drifting clouds, horizon mountains, pine
// forest (snow-capped in the north), rocks and bushes — all instanced, all
// placed via the terrain's own height/surface lookups so nothing floats.
// Trees and big rocks get static colliders: no ghost scenery.
//
// What is left here is the world's BACKDROP — the things there is exactly one
// of, that no one places individually: the sky dome, the clouds, the ring of
// horizon mountains. Everything you can point at and put somewhere — trees,
// rocks, tyre stacks — is a COMPONENT, and lives in `world/props/` with its own
// geometry, physical rules and preview. See `world/build.ts`.
//
// Placement is seeded per component, so the same track builds the same world
// every time and editing one layer does not move the others.

import * as THREE from 'three';
import type { TrackDef } from '../tracks/trackDef';
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

/** Scattered and placed components now live in `world/build.ts`, which owns
 *  one placement routine and one instancing routine for every component in the
 *  game. This file keeps only what is genuinely global to a world: the dome,
 *  the clouds and the horizon ring. */
export { buildComponents as buildVegetation } from '../world/build';
