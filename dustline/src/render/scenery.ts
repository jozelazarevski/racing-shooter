// World dressing: the gradient sky dome and the drifting clouds.
//
// What is here is the world's BACKDROP — the things there is exactly one of,
// that no one places individually. Everything you can point at and put
// somewhere — trees, rocks, tyre stacks, houses, boats — is a COMPONENT, and
// lives in `world/props/` with its own geometry, physical rules and preview.
// See `world/build.ts`.
//
// The horizon left this file when it stopped being a ring of cones; it is now
// `render/horizon.ts`, and it is worth reading for why.
//
// Placement is seeded, so the same track builds the same world every time and
// editing one layer does not move the others.

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

/** Scattered and placed components now live in `world/build.ts`, which owns
 *  one placement routine and one instancing routine for every component in the
 *  game. This file keeps only what is genuinely global to a world: the dome,
 *  the clouds and the horizon ring. */
export { buildComponents as buildVegetation } from '../world/build';

/** The horizon moved to its own file when it stopped being one cone. */
export { buildMountains } from './horizon';
