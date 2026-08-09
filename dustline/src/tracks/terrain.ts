// Terrain: turns a TrackDef into a heightfield, a surface map, a render mesh
// and a Rapier trimesh collider. The same functions feed physics (mu),
// rendering (vertex color) and FX.
//
// WHAT CHANGED, AND WHY IT MATTERS: this class used to CONTAIN a track. The
// loop was a literal in the constructor, the landscape was three hand-written
// sine terms, and the snow line was `z < -150` typed into an if. Now it
// contains none of that — it takes a `TrackDef` and evaluates it. Every number
// that used to be here lives in `data/tracks/*.json`, and `trackDef.ts` owns
// the maths that reads it.
//
// The generated world is unchanged: `dustbowl.json` is the old constructor
// written out in the new format, and it builds the same terrain to the metre.

import * as THREE from 'three';
import type RAPIER_API from '@dimforge/rapier3d-compat';
import surfacesJson from '../data/surfaces.json';
import {
  TrackDef, SurfaceId, hillsAt, roadHeightAt, surfaceAt as surfaceForPoint,
} from './trackDef';
import { Rng } from '../core/rng';

export type { SurfaceId };
export interface SurfaceDef { muLong: number; muLat: number; rollingResistance: number; }

const SURF_COLORS: Record<SurfaceId, THREE.Color> = {
  tarmac: new THREE.Color(0x494b4f),
  gravel: new THREE.Color(0xb09a6a),
  mud: new THREE.Color(0x5e4a30),
  snow: new THREE.Color(0xeef2f6),
  ice: new THREE.Color(0xbcd8e8),
  sand: new THREE.Color(0xd8c07a),
};
const GRASS = new THREE.Color(0x6f9150);
const ROCKFACE = new THREE.Color(0x7d7466);

export class Terrain {
  readonly def: TrackDef;
  readonly spawn = new THREE.Vector3();
  private roadPts: THREE.Vector3[] = [];
  private sdfDist: Float32Array;
  private sdfT: Float32Array;
  private size: number;
  private sdfRes: number;

  constructor(def: TrackDef) {
    this.def = def;
    this.size = def.world.size;
    this.sdfRes = def.world.sdfRes;
    this.sdfDist = new Float32Array(this.sdfRes * this.sdfRes);
    this.sdfT = new Float32Array(this.sdfRes * this.sdfRes);

    const ctrl = def.road.points.map(([x, z]) => new THREE.Vector3(x, 0, z));
    const curve = new THREE.CatmullRomCurve3(ctrl, true, 'centripetal');
    const n = def.road.samples;
    for (let i = 0; i < n; i++) this.roadPts.push(curve.getPoint(i / n));

    // The start line is the top of the loop, so the pad follows the track
    // rather than being a second thing to keep in sync with it.
    this.spawn.set(this.roadPts[0].x, 1.2, this.roadPts[0].z);

    this.bakeSdf();
  }

  /** Nearest-road distance and lap fraction, on a grid, baked once.
   *
   *  Brute force over every road sample: at the shipped resolution that is
   *  220 x 220 x 480 = 23.2 M distance tests, measured at ~32 ms. That is
   *  affordable once at boot and it is the single most expensive thing about
   *  building a track — if track loading ever needs to be faster than this, a
   *  chamfer distance transform over the rasterised road turns it into one
   *  pass over the grid (~48 K operations) and is the change to make. It is
   *  left alone for now because 32 ms is not a problem anybody has. */
  private bakeSdf() {
    const R = this.sdfRes, S = this.size, pts = this.roadPts, n = pts.length;
    for (let gz = 0; gz < R; gz++) {
      for (let gx = 0; gx < R; gx++) {
        const x = (gx / (R - 1) - 0.5) * S;
        const z = (gz / (R - 1) - 0.5) * S;
        let best = 1e9, bestT = 0;
        for (let i = 0; i < n; i++) {
          const p = pts[i];
          const d = (p.x - x) * (p.x - x) + (p.z - z) * (p.z - z);
          if (d < best) { best = d; bestT = i / n; }
        }
        const o = gz * R + gx;
        this.sdfDist[o] = Math.sqrt(best);
        this.sdfT[o] = bestT;
      }
    }
  }

  private sdf(x: number, z: number): { d: number; t: number } {
    const R = this.sdfRes;
    const gx = Math.round(((x / this.size) + 0.5) * (R - 1));
    const gz = Math.round(((z / this.size) + 0.5) * (R - 1));
    const cx = Math.max(0, Math.min(R - 1, gx));
    const cz = Math.max(0, Math.min(R - 1, gz));
    const o = cz * R + cx;
    return { d: this.sdfDist[o], t: this.sdfT[o] };
  }

  heightAt(x: number, z: number): number {
    const def = this.def;
    const pad = Math.hypot(x - this.spawn.x, z - this.spawn.z);
    const { d, t } = this.sdf(x, z);
    let h = hillsAt(def, x, z);
    const road = roadHeightAt(def, t);
    const k = THREE.MathUtils.smoothstep(d, def.road.halfWidth, def.road.halfWidth + def.road.blend);
    h = THREE.MathUtils.lerp(road, h, k);
    const pk = THREE.MathUtils.smoothstep(pad, def.start.padRadius * 0.7, def.start.padRadius);
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

  /** The baked centerline samples (read-only — the racing line bakes from these). */
  get roadPoints(): readonly THREE.Vector3[] {
    return this.roadPts;
  }

  surfaceIdAt(x: number, z: number): SurfaceId {
    const def = this.def;
    const pad = Math.hypot(x - this.spawn.x, z - this.spawn.z);
    const onPad = pad < def.start.padRadius;
    const { d, t } = this.sdf(x, z);
    const onRoad = d < def.road.halfWidth + 1.5;
    // `height` is only consulted by aboveHeight predicates, but it is not free
    // — computing it eagerly would add a full heightAt to every surface lookup,
    // and surface lookups run per wheel per physics tick at 120 Hz.
    const needsHeight = def.surfaces.zones.some(
      (zn) => (onRoad ? zn.onRoad : zn.offRoad) && zn.any.some((p) => p.kind === 'aboveHeight'),
    );
    const height = needsHeight ? this.heightAt(x, z) : 0;
    return surfaceForPoint(def, x, z, { onRoad, t, height, onPad });
  }

  surfaceAt(x: number, z: number): SurfaceDef {
    return surfacesJson[this.surfaceIdAt(x, z)];
  }

  colorAt(x: number, z: number, out: THREE.Color): THREE.Color {
    const def = this.def;
    const id = this.surfaceIdAt(x, z);
    const { d } = this.sdf(x, z);
    const edge = def.road.halfWidth + 1.5;
    if (Math.hypot(x - this.spawn.x, z - this.spawn.z) < def.start.padRadius && d > edge) {
      return out.setHex(0x9a988e); // spawn pad: light concrete apron
    }
    if (d < edge) return out.copy(SURF_COLORS[id]);
    // off-road: blend zone tint over grass so the map reads
    out.copy(GRASS).lerp(SURF_COLORS[id], id === 'gravel' ? 0.25 : 0.75);
    // slope shading: steep faces read as exposed rock/dirt
    const e = 2.5;
    const gx = (this.heightAt(x + e, z) - this.heightAt(x - e, z)) / (2 * e);
    const gz = (this.heightAt(x, z + e) - this.heightAt(x, z - e)) / (2 * e);
    const slope = Math.hypot(gx, gz);
    if (slope > 0.28) out.lerp(ROCKFACE, Math.min(0.75, (slope - 0.28) * 2.6));
    // valleys sit a touch darker (cheap baked-AO feel), crests a touch lighter
    const h = this.heightAt(x, z);
    const n = Math.sin(x * 0.13) * Math.sin(z * 0.17) * 0.05 + Math.sin(x * 0.041 + z * 0.037) * 0.035;
    return out.offsetHSL(0, 0, n + THREE.MathUtils.clamp(h * 0.006, -0.045, 0.05));
  }

  /** Shared grid: render mesh (vertex-colored) + Rapier trimesh collider.
   *  Returns the objects it added so a caller that rebuilds — the editor —
   *  can dispose them without hunting through the scene graph. */
  build(scene: THREE.Scene, world: RAPIER_API.World, RAPIER: typeof RAPIER_API): THREE.Object3D[] {
    const def = this.def;
    const RES = def.world.meshRes;
    const SIZE = this.size;
    const added: THREE.Object3D[] = [];

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
    added.push(mesh);

    if (world && RAPIER) {
      const body = world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
      world.createCollider(RAPIER.ColliderDesc.trimesh(verts, new Uint32Array(idx)).setFriction(1), body);
    }

    // ---- textured road ribbon swept along the loop (visual only — the
    // trimesh below it is the drivable surface). Crowned profile with edge
    // skirts that tuck into the terrain, per-vertex surface tint. ----
    const speckle = Rng.fork(def.seed, 'roadTexture');
    const rcv = document.createElement('canvas');
    rcv.width = 128; rcv.height = 128;
    const rctx = rcv.getContext('2d')!;
    rctx.fillStyle = '#a6a6a4';
    rctx.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 700; i++) { // asphalt speckle
      const g = 120 + speckle.float() * 60 | 0;
      rctx.fillStyle = `rgba(${g},${g},${g},0.5)`;
      rctx.fillRect(speckle.float() * 128, speckle.float() * 128, 2, 2);
    }
    rctx.fillStyle = '#f2ede0';                 // edge lines run along v edges
    rctx.fillRect(0, 3, 128, 4);
    rctx.fillRect(0, 121, 128, 4);
    const rtex = new THREE.CanvasTexture(rcv);
    rtex.wrapS = rtex.wrapT = THREE.RepeatWrapping;
    rtex.colorSpace = THREE.SRGBColorSpace;
    const NPTS = this.roadPts.length;
    const COLS = 4;
    const H = def.road.halfWidth + 0.6;
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
    added.push(road);

    // road edge posts every ~10 samples so the route reads at speed
    const postGeo = new THREE.BoxGeometry(0.22, 1.0, 0.22);
    const postMat = new THREE.MeshStandardMaterial({ color: 0xe8e2d4, roughness: 0.8 });
    const posts = new THREE.InstancedMesh(postGeo, postMat, Math.ceil(NPTS / 10) * 2);
    const m4 = new THREE.Matrix4();
    let pi = 0;
    for (let i = 0; i < NPTS; i += 10) {
      const p = this.roadPts[i];
      const p2 = this.roadPts[(i + 1) % NPTS];
      const tx = p2.x - p.x, tz = p2.z - p.z;
      const len = Math.hypot(tx, tz) || 1;
      const nx = tz / len, nz = -tx / len;
      for (const s of [-1, 1]) {
        const px = p.x + nx * s * (def.road.halfWidth + 1.2);
        const pz = p.z + nz * s * (def.road.halfWidth + 1.2);
        m4.setPosition(px, this.heightAt(px, pz) + 0.5, pz);
        posts.setMatrixAt(pi++, m4);
      }
    }
    posts.count = pi;
    posts.castShadow = true;
    scene.add(posts);
    added.push(posts);

    return added;
  }
}
