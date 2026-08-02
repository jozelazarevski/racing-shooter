// World dressing: gradient sky, drifting clouds, horizon mountains, pine
// forest (snow-capped in the north), rocks and bushes — all instanced, all
// placed via the terrain's own height/surface lookups so nothing floats.
// Trees and big rocks get static colliders: no ghost scenery.

import * as THREE from 'three';
import type RAPIER_API from '@dimforge/rapier3d-compat';
import type { Terrain } from '../tracks/terrain';

export function buildSky(scene: THREE.Scene) {
  const cv = document.createElement('canvas');
  cv.width = 16; cv.height = 256;
  const ctx = cv.getContext('2d')!;
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#3d7fd0');
  g.addColorStop(0.55, '#7db4e6');
  g.addColorStop(0.8, '#cfe6f4');
  g.addColorStop(1, '#e8dfc8');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 16, 256);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(1100, 24, 16),
    new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, fog: false, depthWrite: false }),
  );
  dome.renderOrder = -10;
  scene.add(dome);
}

export function buildClouds(scene: THREE.Scene): THREE.Group {
  const group = new THREE.Group();
  const puffGeo = new THREE.IcosahedronGeometry(1, 1);
  // self-lit so the undersides never go muddy against the sky
  const mat = new THREE.MeshStandardMaterial({
    color: 0xffffff, roughness: 1, flatShading: true,
    emissive: 0xe8f0f6, emissiveIntensity: 0.55,
  });
  for (let i = 0; i < 14; i++) {
    const cloud = new THREE.Group();
    const n = 3 + (i % 3);
    for (let p = 0; p < n; p++) {
      const puff = new THREE.Mesh(puffGeo, mat);
      const s = 9 + Math.random() * 14;
      puff.scale.set(s, s * 0.45, s * 0.8);
      puff.position.set(p * 11 - n * 5 + (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 8);
      cloud.add(puff);
    }
    const a = (i / 14) * Math.PI * 2;
    cloud.position.set(Math.cos(a) * (250 + Math.random() * 400), 120 + Math.random() * 60, Math.sin(a) * (250 + Math.random() * 400));
    group.add(cloud);
  }
  scene.add(group);
  return group;
}

export function buildMountains(scene: THREE.Scene) {
  const geo = new THREE.ConeGeometry(1, 1, 5);
  geo.translate(0, 0.5, 0);
  const mat = new THREE.MeshStandardMaterial({ roughness: 1, flatShading: true });
  const mounts = new THREE.InstancedMesh(geo, mat, 30);
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const col = new THREE.Color();
  for (let i = 0; i < 30; i++) {
    const a = (i / 30) * Math.PI * 2 + Math.sin(i * 3.7) * 0.1;
    const r = 640 + Math.sin(i * 2.3) * 120;
    const h = 90 + Math.sin(i * 1.7 + 1) * 45 + Math.random() * 30;
    const w = h * (1.3 + Math.random() * 0.8);
    q.setFromAxisAngle(up, Math.random() * Math.PI);
    m4.compose(new THREE.Vector3(Math.cos(a) * r, -6, Math.sin(a) * r), q, new THREE.Vector3(w, h, w));
    mounts.setMatrixAt(i, m4);
    // far peaks read blue-gray; the northern ones catch snow
    const snowy = Math.sin(a) < -0.3;
    col.setHex(snowy ? 0xdde8f0 : 0x8195a8).offsetHSL(0, 0, (Math.random() - 0.5) * 0.05);
    mounts.setColorAt(i, col);
  }
  scene.add(mounts);
}

export function buildVegetation(
  scene: THREE.Scene, terrain: Terrain, world: RAPIER_API.World, RAPIER: typeof RAPIER_API,
) {
  const solids = world.createRigidBody(RAPIER.RigidBodyDesc.fixed());

  // ---- pines: trunk + two foliage cones (+ snow cap up north) ----
  const COUNT = 260;
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
  let guard = 0;
  while (ti < COUNT && guard++ < 4000) {
    const x = (Math.random() - 0.5) * 850;
    const z = (Math.random() - 0.5) * 850;
    const surf = terrain.surfaceIdAt(x, z);
    if (surf === 'tarmac' || surf === 'mud' || surf === 'sand' || surf === 'ice') continue;
    if (terrain.distToRoad(x, z) < 11) continue;
    if (Math.hypot(x - terrain.spawn.x, z - terrain.spawn.z) < 62) continue;
    const y = terrain.heightAt(x, z);
    const s = 0.8 + Math.random() * 1.3;
    q.setFromAxisAngle(up, Math.random() * Math.PI * 2);
    m4.compose(new THREE.Vector3(x, y - 0.2, z), q, new THREE.Vector3(s, s * (0.9 + Math.random() * 0.35), s));
    trunks.setMatrixAt(ti, m4);
    lows.setMatrixAt(ti, m4);
    tops.setMatrixAt(ti, m4);
    const snowy = surf === 'snow';
    col.setHSL(0.33 + Math.random() * 0.05, snowy ? 0.18 : 0.42, snowy ? 0.3 : 0.24);
    lows.setColorAt(ti, col);
    tops.setColorAt(ti, col.clone().offsetHSL(0, 0, 0.05));
    if (snowy) { caps.setMatrixAt(ci, m4); ci++; }
    world.createCollider(
      RAPIER.ColliderDesc.cylinder(2.4 * s, 0.42 * s).setTranslation(x, y + 2.2 * s, z), solids);
    ti++;
  }
  trunks.count = lows.count = tops.count = ti;
  caps.count = ci;
  trunks.castShadow = lows.castShadow = tops.castShadow = true;
  scene.add(trunks, lows, tops, caps);

  // ---- rocks (big ones are solid) ----
  const ROCKS = 150;
  const rockGeo = new THREE.DodecahedronGeometry(1, 0);
  rockGeo.scale(1, 0.72, 1);
  const rocks = new THREE.InstancedMesh(rockGeo, new THREE.MeshStandardMaterial({ roughness: 0.95, flatShading: true }), ROCKS);
  let ri = 0; guard = 0;
  while (ri < ROCKS && guard++ < 3000) {
    const x = (Math.random() - 0.5) * 860;
    const z = (Math.random() - 0.5) * 860;
    if (terrain.distToRoad(x, z) < 10) continue;
    if (Math.hypot(x - terrain.spawn.x, z - terrain.spawn.z) < 62) continue;
    const surf = terrain.surfaceIdAt(x, z);
    if (surf === 'mud') continue;
    const y = terrain.heightAt(x, z);
    const s = 0.5 + Math.random() * (surf === 'sand' || surf === 'gravel' ? 2.1 : 1.2);
    q.setFromAxisAngle(up, Math.random() * Math.PI * 2);
    m4.compose(new THREE.Vector3(x, y + s * 0.15, z), q, new THREE.Vector3(s, s, s));
    rocks.setMatrixAt(ri, m4);
    col.setHex(surf === 'snow' ? 0xb8c4ce : surf === 'sand' ? 0xc8a878 : 0x8d8a82).offsetHSL(0, 0, (Math.random() - 0.5) * 0.08);
    rocks.setColorAt(ri, col);
    if (s > 1.1) {
      world.createCollider(RAPIER.ColliderDesc.ball(s * 0.85).setTranslation(x, y + s * 0.3, z), solids);
    }
    ri++;
  }
  rocks.count = ri;
  rocks.castShadow = true;
  scene.add(rocks);

  // ---- bushes (soft dressing, no colliders) ----
  const BUSHES = 170;
  const bushGeo = new THREE.IcosahedronGeometry(1, 0);
  bushGeo.scale(1, 0.6, 1);
  const bushes = new THREE.InstancedMesh(bushGeo, new THREE.MeshStandardMaterial({ roughness: 1, flatShading: true }), BUSHES);
  let bi = 0; guard = 0;
  while (bi < BUSHES && guard++ < 3000) {
    const x = (Math.random() - 0.5) * 860;
    const z = (Math.random() - 0.5) * 860;
    if (terrain.distToRoad(x, z) < 9) continue;
    if (Math.hypot(x - terrain.spawn.x, z - terrain.spawn.z) < 60) continue;
    const surf = terrain.surfaceIdAt(x, z);
    if (surf === 'snow' || surf === 'ice') continue;
    const y = terrain.heightAt(x, z);
    const s = 0.5 + Math.random() * 0.9;
    q.setFromAxisAngle(up, Math.random() * Math.PI * 2);
    m4.compose(new THREE.Vector3(x, y + s * 0.2, z), q, new THREE.Vector3(s, s, s));
    bushes.setMatrixAt(bi, m4);
    col.setHSL(surf === 'sand' ? 0.11 : 0.3, 0.35, 0.24).offsetHSL(0, 0, (Math.random() - 0.5) * 0.06);
    bushes.setColorAt(bi, col);
    bi++;
  }
  bushes.count = bi;
  scene.add(bushes);
}
