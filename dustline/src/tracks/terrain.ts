// M2 terrain: procedural heightmap with a carved rally loop, surface zones,
// a shared render mesh + Rapier trimesh collider, and O(1) surface lookup.
// The same functions feed physics (mu), rendering (vertex color) and FX.

import * as THREE from 'three';
import type RAPIER_API from '@dimforge/rapier3d-compat';
import surfacesJson from '../data/surfaces.json';

export type SurfaceId = keyof typeof surfacesJson;
export interface SurfaceDef { muLong: number; muLat: number; rollingResistance: number; }

const SIZE = 900;        // world meters, centered on origin
const RES = 160;         // grid cells per side (mesh + collider share this)
const ROAD_HALF = 6.5;   // road corridor half-width
const ROAD_BLEND = 15;   // terrain flattens toward road inside this distance
const PAD_R = 55;        // flat tarmac spawn pad radius (keeps M1 tests true)
const SDF_RES = 220;     // road-distance lookup grid

const SURF_COLORS: Record<SurfaceId, THREE.Color> = {
  tarmac: new THREE.Color(0x494b4f),
  gravel: new THREE.Color(0xb09a6a),
  mud: new THREE.Color(0x5e4a30),
  snow: new THREE.Color(0xeef2f6),
  ice: new THREE.Color(0xbcd8e8),
  sand: new THREE.Color(0xd8c07a),
};
const GRASS = new THREE.Color(0x6f9150);

export class Terrain {
  readonly spawn = new THREE.Vector3(0, 1.2, -24);
  private roadPts: THREE.Vector3[] = [];
  private sdfDist = new Float32Array(SDF_RES * SDF_RES);
  private sdfT = new Float32Array(SDF_RES * SDF_RES);
  private mudCenter = new THREE.Vector2(-210, 160);

  constructor() {
    // closed rally loop that tours the biome zones (snow north, sand east,
    // mud west) and comes home across the spawn pad
    const ctrl: THREE.Vector3[] = [];
    const loop: [number, number][] = [
      [0, -24], [120, -60], [230, 20], [250, 150], [150, 240],
      [10, 260], [-130, 230], [-230, 120], [-240, -40], [-150, -140], [-60, -110],
    ];
    for (const [x, z] of loop) ctrl.push(new THREE.Vector3(x, 0, z));
    const curve = new THREE.CatmullRomCurve3(ctrl, true, 'centripetal');
    for (let i = 0; i < 480; i++) this.roadPts.push(curve.getPoint(i / 480));

    // bake the road distance field once
    for (let gz = 0; gz < SDF_RES; gz++) {
      for (let gx = 0; gx < SDF_RES; gx++) {
        const x = (gx / (SDF_RES - 1) - 0.5) * SIZE;
        const z = (gz / (SDF_RES - 1) - 0.5) * SIZE;
        let best = 1e9, bestT = 0;
        for (let i = 0; i < this.roadPts.length; i++) {
          const p = this.roadPts[i];
          const d = (p.x - x) * (p.x - x) + (p.z - z) * (p.z - z);
          if (d < best) { best = d; bestT = i / this.roadPts.length; }
        }
        const o = gz * SDF_RES + gx;
        this.sdfDist[o] = Math.sqrt(best);
        this.sdfT[o] = bestT;
      }
    }
  }

  private sdf(x: number, z: number): { d: number; t: number } {
    const gx = Math.round(((x / SIZE) + 0.5) * (SDF_RES - 1));
    const gz = Math.round(((z / SIZE) + 0.5) * (SDF_RES - 1));
    const cx = Math.max(0, Math.min(SDF_RES - 1, gx));
    const cz = Math.max(0, Math.min(SDF_RES - 1, gz));
    const o = cz * SDF_RES + cx;
    return { d: this.sdfDist[o], t: this.sdfT[o] };
  }

  /** Raw rolling-hill field before the road carve. */
  private hills(x: number, z: number): number {
    return (
      Math.sin(x * 0.011 + 1.7) * Math.cos(z * 0.009 + 0.4) * 7.5 +
      Math.sin(x * 0.027 - 0.8) * Math.sin(z * 0.031 + 2.1) * 3.2 +
      Math.sin((x + z) * 0.05) * 1.1 +
      (z < -140 ? Math.min(14, (-140 - z) * 0.08) : 0) // north rises to the snow line
    );
  }

  /** Road elevation along t: gentle rises + one sharp jump crest. */
  private roadHeight(t: number): number {
    let h = Math.sin(t * Math.PI * 2 * 2 + 0.7) * 3.4 + Math.sin(t * Math.PI * 2 * 5 + 2.2) * 1.4;
    const crest = Math.exp(-((t - 0.62) * (t - 0.62)) / 0.00028); // the jump
    h += crest * 5.5;
    return h;
  }

  heightAt(x: number, z: number): number {
    const pad = Math.hypot(x - this.spawn.x, z - this.spawn.z);
    const { d, t } = this.sdf(x, z);
    let h = this.hills(x, z);
    const road = this.roadHeight(t);
    const k = THREE.MathUtils.smoothstep(d, ROAD_HALF, ROAD_HALF + ROAD_BLEND);
    h = THREE.MathUtils.lerp(road, h, k);
    // spawn pad: dead flat tarmac apron
    const pk = THREE.MathUtils.smoothstep(pad, PAD_R * 0.7, PAD_R);
    return THREE.MathUtils.lerp(0, h, pk);
  }

  normalAt(x: number, z: number, out: THREE.Vector3): THREE.Vector3 {
    const e = 1.6;
    const hx = this.heightAt(x + e, z) - this.heightAt(x - e, z);
    const hz = this.heightAt(x, z + e) - this.heightAt(x, z - e);
    return out.set(-hx, 2 * e, -hz).normalize();
  }

  /** Distance to the road centerline (scenery keeps clear of the route). */
  distToRoad(x: number, z: number): number {
    return this.sdf(x, z).d;
  }

  /** The 480 baked centerline samples (read-only — the racing line bakes from these). */
  get roadPoints(): readonly THREE.Vector3[] {
    return this.roadPts;
  }

  surfaceIdAt(x: number, z: number): SurfaceId {
    const pad = Math.hypot(x - this.spawn.x, z - this.spawn.z);
    if (pad < PAD_R) return 'tarmac';
    const { d, t } = this.sdf(x, z);
    const snowZone = z < -150 || this.heightAt(x, z) > 13;
    if (d < ROAD_HALF + 1.5) {
      // the loop alternates: tarmac start leg, long gravel rally leg,
      // mud river crossing on the west, snow-packed leg through the north
      if (snowZone) return t % 0.07 < 0.012 ? 'ice' : 'snow';
      if (Math.hypot(x - this.mudCenter.x, z - this.mudCenter.y) < 80) return 'mud';
      if (t > 0.08 && t < 0.52) return 'gravel';
      return 'tarmac';
    }
    // off-road zones
    if (snowZone) return 'snow';
    if (Math.hypot(x - this.mudCenter.x, z - this.mudCenter.y) < 90) return 'mud';
    if (x > 190) return 'sand';
    return 'gravel';
  }

  surfaceAt(x: number, z: number): SurfaceDef {
    return surfacesJson[this.surfaceIdAt(x, z)];
  }

  colorAt(x: number, z: number, out: THREE.Color): THREE.Color {
    const id = this.surfaceIdAt(x, z);
    const { d } = this.sdf(x, z);
    if (Math.hypot(x - this.spawn.x, z - this.spawn.z) < PAD_R && d > ROAD_HALF + 1.5) {
      return out.setHex(0x9a988e); // spawn pad: light concrete apron
    }
    if (d < ROAD_HALF + 1.5) {
      return out.copy(SURF_COLORS[id]);
    }
    // off-road: blend zone tint over grass so the map reads
    out.copy(GRASS).lerp(SURF_COLORS[id], id === 'gravel' ? 0.25 : 0.75);
    // slope shading: steep faces read as exposed rock/dirt
    const e = 2.5;
    const gx = (this.heightAt(x + e, z) - this.heightAt(x - e, z)) / (2 * e);
    const gz = (this.heightAt(x, z + e) - this.heightAt(x, z - e)) / (2 * e);
    const slope = Math.hypot(gx, gz);
    if (slope > 0.28) out.lerp(new THREE.Color(0x7d7466), Math.min(0.75, (slope - 0.28) * 2.6));
    // valleys sit a touch darker (cheap baked-AO feel), crests a touch lighter
    const h = this.heightAt(x, z);
    const n = Math.sin(x * 0.13) * Math.sin(z * 0.17) * 0.05 + Math.sin(x * 0.041 + z * 0.037) * 0.035;
    return out.offsetHSL(0, 0, n + THREE.MathUtils.clamp(h * 0.006, -0.045, 0.05));
  }

  /** Shared grid: render mesh (vertex-colored) + Rapier trimesh collider. */
  build(scene: THREE.Scene, world: RAPIER_API.World, RAPIER: typeof RAPIER_API) {
    const verts = new Float32Array((RES + 1) * (RES + 1) * 3);
    const cols = new Float32Array((RES + 1) * (RES + 1) * 3);
    const idx: number[] = [];
    const c = new THREE.Color();
    for (let gz = 0; gz <= RES; gz++) {
      for (let gx = 0; gx <= RES; gx++) {
        const x = (gx / RES - 0.5) * SIZE;
        const z = (gz / RES - 0.5) * SIZE;
        const o = (gz * (RES + 1) + gx) * 3;
        verts[o] = x;
        verts[o + 1] = this.heightAt(x, z);
        verts[o + 2] = z;
        this.colorAt(x, z, c);
        cols[o] = c.r; cols[o + 1] = c.g; cols[o + 2] = c.b;
      }
    }
    for (let gz = 0; gz < RES; gz++) {
      for (let gx = 0; gx < RES; gx++) {
        const a = gz * (RES + 1) + gx;
        const b = a + 1;
        const d2 = a + RES + 1;
        const e = d2 + 1;
        idx.push(a, d2, b, b, d2, e);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.96 }));
    mesh.receiveShadow = true;
    scene.add(mesh);

    const body = world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
    world.createCollider(RAPIER.ColliderDesc.trimesh(verts, new Uint32Array(idx)).setFriction(1), body);

    // ---- textured road ribbon swept along the loop (visual only — the
    // trimesh below it is the drivable surface). Crowned profile with edge
    // skirts that tuck into the terrain, per-vertex surface tint. ----
    const rcv = document.createElement('canvas');
    rcv.width = 128; rcv.height = 128;
    const rctx = rcv.getContext('2d')!;
    rctx.fillStyle = '#a6a6a4';
    rctx.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 700; i++) { // asphalt speckle
      const g = 120 + Math.random() * 60 | 0;
      rctx.fillStyle = `rgba(${g},${g},${g},0.5)`;
      rctx.fillRect(Math.random() * 128, Math.random() * 128, 2, 2);
    }
    rctx.fillStyle = '#f2ede0';                 // edge lines run along v edges
    rctx.fillRect(0, 3, 128, 4);
    rctx.fillRect(0, 121, 128, 4);
    const rtex = new THREE.CanvasTexture(rcv);
    rtex.wrapS = rtex.wrapT = THREE.RepeatWrapping;
    rtex.colorSpace = THREE.SRGBColorSpace;
    const NPTS = this.roadPts.length;
    const COLS = 4;
    const H = ROAD_HALF + 0.6;
    const lats = [-(H + 1.7), -(H - 0.15), H - 0.15, H + 1.7];
    const lifts = [-0.3, 0.14, 0.14, -0.3];
    const vvs = [0, 0.06, 0.94, 1];
    const rVerts = new Float32Array((NPTS + 1) * COLS * 3);
    const rCols = new Float32Array((NPTS + 1) * COLS * 3);
    const rUvs = new Float32Array((NPTS + 1) * COLS * 2);
    const rIdx: number[] = [];
    const tint = new THREE.Color();
    for (let i = 0; i <= NPTS; i++) {
      const j = i % NPTS;
      const p = this.roadPts[j];
      const p2 = this.roadPts[(j + 1) % NPTS];
      let nx = p2.z - p.z, nz = -(p2.x - p.x);
      const nl = Math.hypot(nx, nz) || 1;
      nx /= nl; nz /= nl;
      const id = this.surfaceIdAt(p.x, p.z);
      tint.copy(SURF_COLORS[id]).multiplyScalar(1.7).offsetHSL(0, 0, 0.06);
      for (let cIdx = 0; cIdx < COLS; cIdx++) {
        const px = p.x + nx * lats[cIdx];
        const pz = p.z + nz * lats[cIdx];
        const o = (i * COLS + cIdx) * 3;
        rVerts[o] = px;
        rVerts[o + 1] = this.heightAt(px, pz) + lifts[cIdx] + 0.1;
        rVerts[o + 2] = pz;
        rCols[o] = tint.r; rCols[o + 1] = tint.g; rCols[o + 2] = tint.b;
        const uo = (i * COLS + cIdx) * 2;
        rUvs[uo] = i * 0.55;
        rUvs[uo + 1] = vvs[cIdx];
      }
      if (i < NPTS) {
        for (let cIdx = 0; cIdx < COLS - 1; cIdx++) {
          const a = i * COLS + cIdx;
          const b2 = a + 1;
          const c2 = a + COLS;
          const d3 = c2 + 1;
          rIdx.push(a, c2, b2, b2, c2, d3);
        }
      }
    }
    const rGeo = new THREE.BufferGeometry();
    rGeo.setAttribute('position', new THREE.BufferAttribute(rVerts, 3));
    rGeo.setAttribute('color', new THREE.BufferAttribute(rCols, 3));
    rGeo.setAttribute('uv', new THREE.BufferAttribute(rUvs, 2));
    rGeo.setIndex(rIdx);
    rGeo.computeVertexNormals();
    const road = new THREE.Mesh(rGeo, new THREE.MeshStandardMaterial({
      map: rtex, vertexColors: true, roughness: 0.93,
      polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
    }));
    road.receiveShadow = true;
    scene.add(road);

    // road edge posts every ~20 samples so the route reads at speed
    const postGeo = new THREE.BoxGeometry(0.22, 1.0, 0.22);
    const postMat = new THREE.MeshStandardMaterial({ color: 0xe8e2d4, roughness: 0.8 });
    const posts = new THREE.InstancedMesh(postGeo, postMat, Math.ceil(this.roadPts.length / 10) * 2);
    const m4 = new THREE.Matrix4();
    let pi = 0;
    for (let i = 0; i < this.roadPts.length; i += 10) {
      const p = this.roadPts[i];
      const p2 = this.roadPts[(i + 1) % this.roadPts.length];
      const tx = p2.x - p.x, tz = p2.z - p.z;
      const len = Math.hypot(tx, tz) || 1;
      const nx = tz / len, nz = -tx / len;
      for (const s of [-1, 1]) {
        const px = p.x + nx * s * (ROAD_HALF + 1.2);
        const pz = p.z + nz * s * (ROAD_HALF + 1.2);
        m4.setPosition(px, this.heightAt(px, pz) + 0.5, pz);
        posts.setMatrixAt(pi++, m4);
      }
    }
    posts.count = pi;
    posts.castShadow = true;
    scene.add(posts);
  }
}
