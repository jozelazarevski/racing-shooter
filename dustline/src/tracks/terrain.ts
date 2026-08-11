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
   *  This used to be brute force — every grid cell against every road sample,
   *  220 x 220 x 480 = 23.2 M distance tests, measured at ~32 ms. It was the
   *  single most expensive thing about building a track, and the editor pays it
   *  again on every preview rebuild.
   *
   *  It is now a bucketed nearest-neighbour search: road samples are sorted
   *  into a coarse uniform grid, and each cell searches outward one ring of
   *  buckets at a time, stopping once the next ring cannot possibly contain
   *  anything closer than what it has already found.
   *
   *  WHY NOT A DISTANCE TRANSFORM. The obvious answer is a chamfer pass over
   *  the rasterised road — one sweep instead of a search. It is also wrong
   *  here: chamfer distance is an APPROXIMATION, a few percent out, and this
   *  field decides where the road surface ends, where the terrain stops being
   *  flattened, and how far scenery must keep clear. A few percent is a
   *  different world. Bucketing keeps the answer exact.
   *
   *  EXACT means exact, including tie-breaking. A linear scan keeps the FIRST
   *  index that achieved the minimum; buckets are not visited in index order,
   *  so that ordering is restored explicitly by breaking ties on index.
   *  `bakeSdfReference()` below is the original loop, kept as the oracle that
   *  `tools/verify-sdf.mjs` checks this against — bit for bit, not within a
   *  tolerance. */
  private bakeSdf() {
    const R = this.sdfRes, S = this.size, pts = this.roadPts, n = pts.length;

    // Bucket size is a real trade, and it was measured rather than guessed.
    // Small buckets mean few points per bucket but many (mostly empty) buckets
    // to walk for a cell far from the road; large buckets mean the opposite.
    // At S/12 a near-road cell resolves in one ring and a far corner still
    // walks well under a hundred buckets.
    const BUCKET = Math.max(8, S / 12);
    const B = Math.max(1, Math.ceil(S / BUCKET));
    const bucketOf = (v: number) => Math.max(0, Math.min(B - 1, Math.floor(((v / S) + 0.5) * B)));

    // counting sort of the samples into buckets: one flat Int32Array of sample
    // indices plus a start offset per bucket, so the hot loop touches two typed
    // arrays and allocates nothing
    const starts = new Int32Array(B * B + 1);
    for (let i = 0; i < n; i++) starts[bucketOf(pts[i].z) * B + bucketOf(pts[i].x) + 1]++;
    for (let i = 0; i < B * B; i++) starts[i + 1] += starts[i];
    const items = new Int32Array(n);
    const cursor = starts.slice(0, B * B);
    for (let i = 0; i < n; i++) items[cursor[bucketOf(pts[i].z) * B + bucketOf(pts[i].x)]++] = i;

    // flat copies of the sample coordinates — pts[i].x on a Vector3 is a
    // property load per test, and this loop runs millions of times
    const px = new Float64Array(n), pz = new Float64Array(n);
    for (let i = 0; i < n; i++) { px[i] = pts[i].x; pz[i] = pts[i].z; }

    // ROW COHERENCE. Neighbouring cells almost always share a nearest sample,
    // so each cell starts from the previous cell's winner. That is only an
    // initial upper bound — the search still visits every bucket that could
    // hold something closer — but it makes the bound tight immediately, and
    // most cells then terminate at ring 0 or 1 instead of expanding outward
    // until they stumble into the road. Measured: this is where the speedup is.
    let prevIdx = -1;
    for (let gz = 0; gz < R; gz++) {
      const z = (gz / (R - 1) - 0.5) * S;
      const bz = bucketOf(z);
      prevIdx = -1;                       // rows are scanned independently
      for (let gx = 0; gx < R; gx++) {
        const x = (gx / (R - 1) - 0.5) * S;
        const bx = bucketOf(x);

        let best = Infinity, bestIdx = -1;
        if (prevIdx >= 0) {
          const dx = px[prevIdx] - x, dz = pz[prevIdx] - z;
          best = dx * dx + dz * dz;
          bestIdx = prevIdx;
        }
        const maxRing = Math.max(bx, B - 1 - bx, bz, B - 1 - bz);
        for (let ring = 0; ring <= maxRing; ring++) {
          // Everything not yet visited lies at least (ring-1) whole buckets
          // away, so once the best hit is closer than that, nothing further
          // out can beat it.
          if (bestIdx >= 0) {
            const bound = (ring - 1) * BUCKET;
            // STRICTLY less than, not <=. A sample sitting at exactly the bound
            // must still be examined, or a tie could be decided by which ring
            // it happened to fall in rather than by index — and the whole point
            // of the tie-break is that the answer does not depend on traversal
            // order.
            if (bound > 0 && best < bound * bound) break;
          }
          const x0 = Math.max(0, bx - ring), x1 = Math.min(B - 1, bx + ring);
          const z0 = Math.max(0, bz - ring), z1 = Math.min(B - 1, bz + ring);
          for (let cz = z0; cz <= z1; cz++) {
            const onZEdge = cz === bz - ring || cz === bz + ring;
            for (let cx = x0; cx <= x1; cx++) {
              // interior buckets were covered by an earlier ring
              if (ring > 0 && !onZEdge && cx !== bx - ring && cx !== bx + ring) continue;
              const c = cz * B + cx;
              const end = starts[c + 1];
              for (let k = starts[c]; k < end; k++) {
                const i = items[k];
                const dx = px[i] - x, dz = pz[i] - z;
                const d = dx * dx + dz * dz;
                // `d < best` reproduces the brute-force winner; the tie-break
                // on index reproduces its ORDER, because a linear scan keeps
                // the first index that achieved the minimum. Buckets are not
                // visited in index order, so the tie has to be broken here.
                if (d < best || (d === best && i < bestIdx)) { best = d; bestIdx = i; }
              }
            }
          }
        }

        prevIdx = bestIdx;
        const o = gz * R + gx;
        this.sdfDist[o] = Math.sqrt(best);
        this.sdfT[o] = bestIdx / n;
      }
    }
  }

  /** Re-run the fast bake in place. Exists so `tools/verify-sdf.mjs` can time
   *  the bake ALONE — timing `new Terrain()` also times curve sampling, which
   *  is common to both paths and quietly flattens whatever difference there is. */
  rebake() { this.bakeSdf(); }

  /** The original brute-force bake, kept as the ORACLE.
   *
   *  Not dead code: `tools/verify-sdf.mjs` builds both and requires them to
   *  agree bit for bit on every track. An optimisation whose reference
   *  implementation has been deleted is an optimisation nobody can check. */
  bakeSdfReference(): { dist: Float32Array; t: Float32Array } {
    const R = this.sdfRes, S = this.size, pts = this.roadPts, n = pts.length;
    const dist = new Float32Array(R * R);
    const t = new Float32Array(R * R);
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
        dist[o] = Math.sqrt(best);
        t[o] = bestT;
      }
    }
    return { dist, t };
  }

  /** The baked field, for the verifier. Note this is the BAKE, which `sdf()`
   *  below now reads bilinearly — the two are separate concerns, and
   *  `verify:sdf` still compares this bake against `bakeSdfReference()`'s
   *  brute force cell for cell, which is the same comparison it always made. */
  get sdfField(): { dist: Float32Array; t: Float32Array } {
    return { dist: this.sdfDist, t: this.sdfT };
  }

  /** READ the baked field at a point — BILINEARLY, in both `d` and `t`.
   *
   *  THE BUG THIS FIXES: "is the car above the ground beneath it".
   *
   *  Two surfaces are built from `heightAt` at two different rates. The
   *  COLLIDER is a lattice of it at `world.meshRes` (4.02 m on dustbowl) and is
   *  the only thing the car stands on; the PAINTED ROAD is a ribbon that
   *  evaluates it continuously along the centreline. They agree only where
   *  `heightAt` is smooth at the lattice's spacing.
   *
   *  This function used to answer with the NEAREST CELL, which made `heightAt`
   *  a STAIRCASE with treads of one sdf cell (4.11 m) — coarser than the
   *  lattice sampling it. A staircase cannot be represented by a lattice at all:
   *  the collider linearly interpolates across the risers and cuts a chord,
   *  while the ribbon lands wherever it lands. Measured by
   *  `tools/verify-terrain-integrity.mjs` on dustbowl, that put the painted road
   *  1.262 m clear of the ground under it — 119% of the car's 1.06 m wheel ray,
   *  so a wheel set on the paint there cast down and found NOTHING.
   *
   *  Both terms of the staircase had to go, and they are two different bugs:
   *
   *    `d` — the corridor blend is `smoothstep(d, halfWidth, halfWidth+blend)`,
   *      so a lattice node genuinely inside the road can be handed a
   *      whole-cell-too-large `d`, be blended toward the hills and drag the
   *      corridor EDGE down with it. This is the 1.262 m float at sample 76.
   *      Interpolating `d` alone measured 0.953 m.
   *    `t` — inside the corridor `k` is 0, so the height is `roadHeightAt(t)`
   *      and NOTHING ELSE. dustbowl's crest is a gaussian of sigma 0.0118 of a
   *      lap standing 5.5 m tall, whose steepest flank runs at ~282 m per unit
   *      t; one 4.11 m cell of lap is 0.0028 of t, so each tread of the `t`
   *      staircase was a 0.78 m step in the road's own centreline. That is the
   *      residual 0.953 m BURY at sample 303 — which sits at t=0.631, right on
   *      that flank. Interpolating `t` as well is what removes it.
   *
   *  Together: 1.262 -> 0.511 m, 48% of the wheel ray, and the stations past
   *  the 0.225 m a resting wheel can droop fall from 853 to 103.
   *
   *  WHY NOT A FINER FIELD. `world.sdfRes` 220 -> 330 was measured at 0.801 m
   *  and costs 25 -> 45 ms of bake on EVERY world build, including the editor's
   *  per-keystroke rebuild against a ~121 ms budget — and it is not even
   *  monotone (440 measures 0.927 m, worse than 330), because resolution only
   *  makes the treads shorter and never stops them being treads. Interpolating
   *  removes the treads. It also costs nothing measurable: the bake is untouched
   *  (23.2 -> 23.6 ms, inside run-to-run noise) and `heightAt` over dustbowl's
   *  50,625 lattice nodes goes 12.04 -> 12.05 ms, because this function's
   *  handful of array reads sits next to three octaves of trigonometry.
   *
   *  This is a better answer, not merely a smoother one: distance-to-the-loop
   *  and nearest-arc-length are both CONTINUOUS fields, and the staircase was
   *  an artifact of rasterising them. `distToRoad` (scenery clearance) and the
   *  `d < halfWidth + 1.5` surface edge get the same accuracy for free.
   *
   *  THE SEAM. `t` is a lap fraction and wraps, so interpolating 0.998 against
   *  0.002 naively yields 0.5 — the far side of the lap, which is `_jumpCut`
   *  all over again. Each corner is unwrapped to within half a lap of `t00`
   *  first, and the result wrapped back. Where the four corners genuinely
   *  disagree by more than half a lap the unwrap is arbitrary — but that only
   *  happens on the medial axis between two stretches of road, which is at
   *  least a corner radius away from either, so `k` is 1 there (the hills own
   *  the height) and `t` is not consulted for surface at all: `surfaceAt` reads
   *  `t` only for bands and stripes, and both are gated on `onRoad`. */
  private sdf(x: number, z: number): { d: number; t: number } {
    const R = this.sdfRes;
    const fx = ((x / this.size) + 0.5) * (R - 1);
    const fz = ((z / this.size) + 0.5) * (R - 1);
    // Clamp the CELL, then the fraction within it, so a point off the edge of
    // the world reads the edge value exactly as the nearest-cell version did.
    const x0 = fx <= 0 ? 0 : (fx >= R - 2 ? R - 2 : Math.floor(fx));
    const z0 = fz <= 0 ? 0 : (fz >= R - 2 ? R - 2 : Math.floor(fz));
    const u = fx - x0 <= 0 ? 0 : (fx - x0 >= 1 ? 1 : fx - x0);
    const v = fz - z0 <= 0 ? 0 : (fz - z0 >= 1 ? 1 : fz - z0);
    const o00 = z0 * R + x0, o10 = o00 + 1, o01 = o00 + R, o11 = o01 + 1;

    // `d` is a distance, so it is smooth except at the centreline, where it has
    // a V. Interpolating across that V overestimates — but the corners of a
    // cell straddling the centreline are at most one half-diagonal (2.91 m)
    // from it, well inside the 6.5 m half-width, so the overestimate never
    // reaches the blend and the corridor floor stays flat.
    const D = this.sdfDist;
    const d = (D[o00] * (1 - u) + D[o10] * u) * (1 - v) + (D[o01] * (1 - u) + D[o11] * u) * v;

    const T = this.sdfT;
    const t00 = T[o00];
    let t10 = T[o10], t01 = T[o01], t11 = T[o11];
    if (t10 - t00 > 0.5) t10 -= 1; else if (t00 - t10 > 0.5) t10 += 1;
    if (t01 - t00 > 0.5) t01 -= 1; else if (t00 - t01 > 0.5) t01 += 1;
    if (t11 - t00 > 0.5) t11 -= 1; else if (t00 - t11 > 0.5) t11 += 1;
    let t = (t00 * (1 - u) + t10 * u) * (1 - v) + (t01 * (1 - u) + t11 * u) * v;
    t -= Math.floor(t);                 // back into [0, 1) after the unwrap
    return { d, t };
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

  /** Surface height of standing water, or null when the track has none.
   *  Components that float read this instead of the ground. */
  get waterLevel(): number | null {
    return this.def.water ? this.def.water.level : null;
  }

  /** Is this point under water? Used by scatter (nothing grows in a lake) and
   *  by the map. */
  isSubmerged(x: number, z: number): boolean {
    const w = this.def.water;
    return !!w && this.heightAt(x, z) < w.level;
  }

  /** Roughly how far it is to the waterline, giving up past `maxDist`.
   *
   *  Deliberately a probe and not a field. The shoreline is wherever the
   *  heightfield crosses one number, so it moves every time you touch an
   *  octave; baking a distance field for it would cost as much as the road's
   *  and be thrown away as often. Scatter only ever asks "is the water within
   *  a few metres", which eight rays answer well enough — and being an
   *  approximation is safe here because the only thing it decides is where a
   *  clump of reeds is allowed to grow. */
  distToWater(x: number, z: number, maxDist: number): number {
    if (!this.def.water) return Infinity;
    if (this.isSubmerged(x, z)) return 0;
    const RAYS = 8;
    const STEPS = 4;
    for (let s = 1; s <= STEPS; s++) {
      const r = (maxDist * s) / STEPS;
      for (let i = 0; i < RAYS; i++) {
        const a = (i / RAYS) * Math.PI * 2;
        if (this.isSubmerged(x + Math.cos(a) * r, z + Math.sin(a) * r)) return r;
      }
    }
    return Infinity;
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
    out.offsetHSL(0, 0, n + THREE.MathUtils.clamp(h * 0.006, -0.045, 0.05));
    // SUBMERGED GROUND IS DARKENED HERE, not left to the water plane. The plane
    // is translucent, so a seabed painted like a meadow shows through as a
    // green lagoon; darkening the bed is what makes a shore read as depth
    // rather than as a blue sheet laid over a field.
    const w = def.water;
    if (w && h < w.level) {
      // Lighter than it was. The water SURFACE now carries a depth gradient of
      // its own, so the bed only has to stop reading as a meadow under glass —
      // doing the whole job twice made deep water black.
      const depth = THREE.MathUtils.clamp((w.level - h) / Math.max(0.5, w.deepAt), 0, 1);
      out.lerp(new THREE.Color(w.deep), 0.22 + 0.3 * depth);
      out.offsetHSL(0, 0.04 * depth, -0.04 * depth);
    }
    return out;
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
    // THE ROAD IS THE SURFACE A PLAYER LOOKS AT FOR AN ENTIRE LAP, and it was
    // a 128 px tile of flat grey with 700 two-pixel dots on it. From the chase
    // camera that is a painted band. v1's `roadTexture` is built the other way
    // round — a base colour, then LARGE soft blotches, then finer grain over
    // them, then aggregate — and the layering is what stops asphalt reading as
    // noise on a flat colour. That structure is ported here at its resolution;
    // the tone and the edge lines stay dustline's.
    //
    // 512, not 1024: v1 raises the tile only for cobbles, on the grounds that
    // "a sett needs texels" and broad mottle does not.
    const speckle = Rng.fork(def.seed, 'roadTexture');
    const RTEX = 512;
    const rcv = document.createElement('canvas');
    rcv.width = RTEX; rcv.height = RTEX;
    const rctx = rcv.getContext('2d')!;
    rctx.fillStyle = '#9d9d9b';
    rctx.fillRect(0, 0, RTEX, RTEX);
    const blotch = (n: number, rMin: number, rSpan: number, aMin: number, aSpan: number) => {
      for (let i = 0; i < n; i++) {
        const g = 108 + speckle.float() * 70 | 0;
        rctx.fillStyle = `rgba(${g},${g},${g + (speckle.float() * 6 | 0)},${aMin + speckle.float() * aSpan})`;
        rctx.beginPath();
        rctx.arc(speckle.float() * RTEX, speckle.float() * RTEX, rMin + speckle.float() * rSpan, 0, Math.PI * 2);
        rctx.fill();
      }
    };
    blotch(420, 9, 26, 0.05, 0.10);            // patched and weathered areas
    blotch(1800, 2, 6, 0.06, 0.14);            // grain over them
    for (let i = 0; i < 2600; i++) {           // aggregate: chips in the binder
      const g = 150 + speckle.float() * 80 | 0;
      rctx.fillStyle = `rgba(${g},${g},${g},${0.10 + speckle.float() * 0.25})`;
      const sz = 1 + speckle.float() * 2.2;
      rctx.fillRect(speckle.float() * RTEX, speckle.float() * RTEX, sz, sz);
    }
    // A worn crown: the middle of the lane is polished by traffic, the edges
    // are not. One gradient, and it is what makes the camber read.
    const crown = rctx.createLinearGradient(0, 0, 0, RTEX);
    crown.addColorStop(0, 'rgba(40,40,44,0.18)');
    crown.addColorStop(0.5, 'rgba(255,255,255,0.05)');
    crown.addColorStop(1, 'rgba(40,40,44,0.18)');
    rctx.fillStyle = crown;
    rctx.fillRect(0, 0, RTEX, RTEX);
    rctx.fillStyle = '#f2ede0';                 // edge lines run along v edges
    rctx.fillRect(0, RTEX * 0.023, RTEX, RTEX * 0.031);
    rctx.fillRect(0, RTEX * 0.945, RTEX, RTEX * 0.031);
    const rtex = new THREE.CanvasTexture(rcv);
    rtex.wrapS = rtex.wrapT = THREE.RepeatWrapping;
    rtex.colorSpace = THREE.SRGBColorSpace;
    const NPTS = this.roadPts.length;
    // SEVEN COLUMNS, NOT FOUR. With four the ribbon is a flat plane between its
    // two inner edges, so the crown painted into the texture above has no
    // geometry under it and the road takes the same light right across. Three
    // more columns cost one more quad per sample and give the surface an actual
    // camber to catch it — 12 cm at the centreline, which is a real road's.
    const COLS = 7;
    const H = def.road.halfWidth + 0.6;
    const lats = [-(H + 1.7), -(H - 0.15), -H * 0.5, 0, H * 0.5, H - 0.15, H + 1.7];
    const lifts = [-0.3, 0.14, 0.2, 0.26, 0.2, 0.14, -0.3];
    const vvs = [0, 0.06, 0.3, 0.5, 0.7, 0.94, 1];
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

    // ---- standing water ----------------------------------------------------
    //
    // A SEA IS NOT ONE QUAD. The first cut was a single 1x1 plane: two
    // triangles, one flat colour, and the only thing telling you where the
    // shallows were was the darkened bed showing through it. From the quay
    // that reads as a sheet of blue plastic laid over the beach.
    //
    // Three things fix it, and all three are cheap because they are vertex
    // work on a grid nothing collides with:
    //
    //   SWELL — a two-octave standing wave, ~15 cm and ~20 m across. It is
    //     STATIC, not animated: at this scale it reads as surface texture
    //     rather than frozen waves, and animating it would mean the water
    //     owned an update hook, which is how every prop ends up with one.
    //   DEPTH COLOUR — per vertex, from the bed under it. This is what makes
    //     a shoreline read: the shallows go pale over the sand, the channel
    //     goes dark, and the gradient between them is where the beach is.
    //   A SHORE FADE — the surface goes transparent as it meets the land, so
    //     the waterline is a wet margin instead of a cut edge.
    if (def.water) {
      const W = def.water;
      const SEG = 128;                       // 32k triangles, no collider
      const span = SIZE * 1.4;
      const wGeo = new THREE.PlaneGeometry(span, span, SEG, SEG);
      wGeo.rotateX(-Math.PI / 2);
      const wp = wGeo.getAttribute('position') as THREE.BufferAttribute;
      const wc = new Float32Array(wp.count * 3);
      const shallow = new THREE.Color(W.color);
      const deep = new THREE.Color(W.deep);
      const c = new THREE.Color();
      for (let i = 0; i < wp.count; i++) {
        const x = wp.getX(i), z = wp.getZ(i);
        wp.setY(i, Math.sin(x * 0.31 + z * 0.17) * 0.09 + Math.sin(x * 0.11 - z * 0.19 + 2.1) * 0.06);
        const d = W.level - this.heightAt(x, z);
        // Linear, and capped short of the full deep colour. Squaring it looked
        // right in isolation and came out near-black in the world, because the
        // BED is darkened too (see colorAt) and the two multiply through a
        // translucent surface. Between them the channel was swallowing the
        // middle distance.
        const t = THREE.MathUtils.clamp(d / Math.max(0.5, W.deepAt), 0, 1);
        c.copy(shallow).lerp(deep, t * 0.88);
        wc[i * 3] = c.r; wc[i * 3 + 1] = c.g; wc[i * 3 + 2] = c.b;
      }
      wGeo.setAttribute('color', new THREE.BufferAttribute(wc, 3));
      wGeo.computeVertexNormals();
      const water = new THREE.Mesh(wGeo, new THREE.MeshStandardMaterial({
        vertexColors: true,
        transparent: true,
        opacity: W.opacity,
        roughness: 0.18,
        metalness: 0.25,
        // Off, on purpose. With depthWrite on, the translucent surface hides
        // whatever is drawn after it — including every boat sitting on it.
        depthWrite: false,
      }));
      water.position.y = W.level;
      water.renderOrder = 1;
      scene.add(water);
      added.push(water);
    }

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
