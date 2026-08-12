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
import carJson from '../data/car.json';
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

// ---------------------------------------------------------------------------
// HOW BIG AN ERROR IS NO ERROR — the two numbers the visual LOD below is
// allowed to spend, and where each one comes from.
// ---------------------------------------------------------------------------
//
// ONE PIXEL OF THE PHONE THIS IS AIMED AT. `tools/verify-perf-budget.mjs`
// checks the budget at 390 x 844 CSS px — "the iPhone 14 / 13 / 12 viewport,
// which is also close to the middle of the Android mid-range" — and
// `render/scene.ts` clamps a touch device to `devicePixelRatio` 1.75, so the
// frame the driver is handed is 844 x 1.75 = 1,477 device pixels tall.
// `render/camera.ts` opens at `BASE_FOV = 68` degrees vertical and only ever
// WIDENS with speed (to 82), and a wider lens makes a metre subtend fewer
// pixels, so 68 is the worst case rather than the typical one. A vertical error
// of `e` metres at range `d` therefore covers
//
//     e / d * 1477 / (2 * tan(34 deg))  =  e / d * 1095   device pixels.
//
// Inverted, that is the error budget: `d / 1095` metres buys exactly one pixel.
const PIXELS_PER_RADIAN = 1477 / (2 * Math.tan((68 / 2) * (Math.PI / 180)));
const SCREEN_ERROR_PIXELS = 1;

// ...AND THE PIXEL RULE ALONE IS NOT ENOUGH, because it assumes the eye is on
// the road. dustline has no wall, no out-of-bounds and no reset: a car can
// drive to the rim of the 900 m map, so there is no radius beyond which "the
// car cannot be here" is TRUE, and any LOD that leans on one is leaning on
// nothing. This is the second bound and it holds wherever the car goes.
//
// WHEEL DROOP, straight off the car: `sagRatio * restLength`. It is the
// extension left in a wheel that is resting, and it is the number
// `tools/verify-terrain-integrity.mjs` uses for exactly this question — its own
// words are "ground more than this below where a wheel expects it has already
// unloaded that corner". So a drawn surface within one droop of the collider is
// the SAME surface as far as the car is concerned: park anywhere on it and the
// wheel is still inside its own slack. Read from `data/car.json` rather than
// typed, so the two cannot come to disagree about what the car is.
const WHEEL_DROOP = carJson.suspension.sagRatio * carJson.suspension.restLength;

// The chase camera's own reach, so "range" is measured from the EYE and not
// from the car. `render/camera.ts` puts it `7.2 + speedKmh * 0.012` behind and
// 2.9 m above; the car cannot pass its own terminal speed,
// `sqrt(engine.force / engine.dragCoeff)` = 53.6 m/s = 193 km/h (the same
// expression `tools/verify-solidity.mjs` calls V_TERM), so the eye is never
// further than hypot(7.2 + 193 * 0.012, 2.9) = 9.9 m from the car.
const CAMERA_TRAIL = Math.hypot(
  7.2 + Math.sqrt(carJson.engine.force / carJson.engine.dragCoeff) * 3.6 * 0.012, 2.9,
);

// The largest block the merge is allowed to consider, in lattice cells. 16
// cells is 64.3 m on a 900 m / 224 map, and it is a measurement rather than a
// taste: at the far rim of dustbowl the budget above is 0.225 m (the droop cap
// binds past 256 m) and NOT ONE 16-cell block on any of the three tracks comes
// within that — the widest that merges anywhere is 8 cells. Setting the cap
// higher only pays for tests that always fail.
const LOD_MAX_BLOCK = 16;

export interface LodResult {
  /** The render index. Positions are untouched — this is the only thing that
   *  differs from the collider. */
  index: number[];
  /** The largest vertical gap between what is drawn and the fine lattice,
   *  anywhere on the surface. Zero when nothing merged. */
  maxDeviation: number;
  /** Leaves emitted, and the widest one in cells — for reporting. */
  leaves: number;
  widest: number;
}

/** A CRACK-FREE RENDER INDEX OVER A LATTICE THE CALLER ALREADY OWNS.
 *
 *  THE PROBLEM THIS SOLVES. `build()` lays one `RES + 1` square lattice of
 *  `heightAt` and hands the SAME `Float32Array` to three.js as the visible
 *  ground and to Rapier as the one and only trimesh collider. On the shipped
 *  tracks that is 50,625 vertices and 100,352 triangles in ONE mesh spanning
 *  the whole 900 m map, so no camera angle culls any of it: the same 100,352
 *  triangles are submitted at every pose on every lap of every track. Measured
 *  by `tools/verify-perf-budget.mjs` against a 150,000 ceiling, that was 70% of
 *  dustbowl's worst portrait frame and 49% of proving-ground's.
 *
 *  It cannot be thinned by moving a vertex, because the collider is those
 *  vertices. BUGS.md #7 and the owner's "is the car above the ground beneath
 *  it" are what happens when the two surfaces stop being one surface, and
 *  `tools/verify-solidity.mjs` check 7 exists to say so.
 *
 *  So NOTHING HERE TOUCHES A VERTEX. Only the INDEX changes: out in the far
 *  field a square block of cells is drawn as a fan through its own corners and
 *  centre instead of as 2 * S * S triangles, which skips lattice nodes without
 *  moving one. The position buffer, and therefore the collider, is bit-for-bit
 *  what it was — literally the same array object, not a copy of it.
 *
 *  WHERE A BLOCK IS ALLOWED TO MERGE is the caller's decision, made by
 *  `mergeable` against the block's own measured error. `fanDev` below is that
 *  measurement: the fan's height is evaluated at EVERY fine node the fan would
 *  replace and compared with the lattice, so the number handed to `mergeable`
 *  is the worst gap that block would actually open, not an estimate of it.
 *
 *  NO CRACKS, AND THAT IS THE FIDDLY PART. Two neighbouring blocks of different
 *  size share an edge; if the coarse one draws it corner-to-corner while the
 *  fine one walks its nodes, the surfaces part company along a T-junction and a
 *  hairline of sky shows through the ground. Two things prevent it. The leaf
 *  sizes are BALANCED first, so no leaf touches one more than one level finer
 *  than itself; then each leaf splits an edge in two exactly when the leaf
 *  across it is finer. Both sides of every interior edge then agree node for
 *  node. (Proved by counting: every interior edge of the emitted mesh is used
 *  by exactly two triangles — see the note in the task report.)
 *
 *  `drawn` marks cells that are not drawn at all — the water surface uses it to
 *  drop the two thirds of its plane that sit under dry land. An undrawn cell
 *  keeps leaf size 1 so that its live neighbours are never merged across it and
 *  never mis-stitch to it; it simply emits nothing.
 *
 *  @param RES     cells per side; the lattice is (RES + 1) squared nodes,
 *                 indexed `gz * (RES + 1) + gx` — the layout `build()` uses.
 *  @param nodeY   height of a lattice node, in metres.
 *  @param mergeable  may this S x S block at (bx, bz) be drawn as one fan,
 *                 given the worst gap `dev` that would open if it were?
 *  @param drawn   is this cell drawn at all? Defaults to all of them.
 *  @param maxBlock  largest block to consider, in cells. 1 disables merging
 *                 entirely and leaves only `drawn` doing work. */
export function lodIndex(
  RES: number,
  nodeY: (gx: number, gz: number) => number,
  mergeable: (bx: number, bz: number, S: number, dev: number) => boolean,
  drawn?: (cx: number, cz: number) => boolean,
  maxBlock: number = LOD_MAX_BLOCK,
): LodResult {
  const N = RES + 1;
  const at = (gx: number, gz: number) => gz * N + gx;

  // The largest ALIGNED block the lattice divides into. 224 = 2^5 * 7, so this
  // lands on 16 with the cap above and would land on 4 for a 100-cell lattice —
  // a track with an awkward `meshRes` degrades to a smaller block rather than
  // to a misaligned one.
  let MAXS = 1;
  while (MAXS * 2 <= maxBlock && RES % (MAXS * 2) === 0) MAXS *= 2;

  /** The worst vertical gap the four-triangle fan over this block would open,
   *  measured against the lattice at every node inside it.
   *
   *  The fan's two diagonals cut the block into four triangles, each spanned by
   *  the centre node and one edge's two corners. Which triangle a node falls in
   *  is decided by the signs of `v - u` and `u + v - 1`, and inside it the
   *  barycentric weights come out as differences of `u` and `v` — no matrix
   *  solve, and exact at all five nodes the fan keeps. */
  const fanDev = (bx: number, bz: number, S: number): number => {
    const hc = nodeY(bx + S / 2, bz + S / 2);
    const h00 = nodeY(bx, bz), h10 = nodeY(bx + S, bz);
    const h01 = nodeY(bx, bz + S), h11 = nodeY(bx + S, bz + S);
    let worst = 0;
    for (let j = 0; j <= S; j++) {
      const v = j / S;
      for (let i = 0; i <= S; i++) {
        const u = i / S;
        let l1: number, l2: number, ha: number, hb: number;
        if (v <= u && v <= 1 - u) { l1 = 1 - u - v; l2 = u - v; ha = h00; hb = h10; }
        else if (v >= u && v >= 1 - u) { l1 = v - u; l2 = u + v - 1; ha = h01; hb = h11; }
        else if (u <= v && u <= 1 - v) { l1 = 1 - u - v; l2 = v - u; ha = h00; hb = h01; }
        else { l1 = u - v; l2 = u + v - 1; ha = h10; hb = h11; }
        const e = Math.abs(hc * (1 - l1 - l2) + l1 * ha + l2 * hb - nodeY(bx + i, bz + j));
        if (e > worst) worst = e;
      }
    }
    return worst;
  };

  // Leaf size covering each CELL. Every leaf is a power of two and aligned to
  // its own size, so `cx % S === 0 && cz % S === 0` identifies its origin and
  // no separate tree needs storing.
  const leaf = new Int32Array(RES * RES);
  const fill = (bx: number, bz: number, S: number) => {
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) leaf[(bz + j) * RES + bx + i] = S;
  };
  const allDrawn = (bx: number, bz: number, S: number) => {
    if (!drawn) return true;
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) if (!drawn(bx + i, bz + j)) return false;
    return true;
  };
  const consider = (bx: number, bz: number, S: number) => {
    if (S === 1) { leaf[bz * RES + bx] = 1; return; }
    if (allDrawn(bx, bz, S) && mergeable(bx, bz, S, fanDev(bx, bz, S))) { fill(bx, bz, S); return; }
    const h = S >> 1;
    consider(bx, bz, h); consider(bx + h, bz, h);
    consider(bx, bz + h, h); consider(bx + h, bz + h, h);
  };
  for (let bz = 0; bz < RES; bz += MAXS) for (let bx = 0; bx < RES; bx += MAXS) consider(bx, bz, MAXS);

  // BALANCE: no leaf may touch one more than one level finer than itself. Sizes
  // only ever decrease here, so the loop terminates; the bound is a guard, not
  // a schedule, and MAXS levels of splitting can need at most that many sweeps
  // to propagate across the map.
  for (let sweep = 0; sweep < 64; sweep++) {
    let changed = false;
    for (let bz = 0; bz < RES; bz++) {
      for (let bx = 0; bx < RES; bx++) {
        const S = leaf[bz * RES + bx];
        if (S < 2 || bx % S || bz % S) continue;
        const h = S >> 1;
        let split = false;
        for (let k = 0; k < S && !split; k++) {
          if (bx > 0 && leaf[(bz + k) * RES + bx - 1] < h) split = true;
          if (bx + S < RES && leaf[(bz + k) * RES + bx + S] < h) split = true;
          if (bz > 0 && leaf[(bz - 1) * RES + bx + k] < h) split = true;
          if (bz + S < RES && leaf[(bz + S) * RES + bx + k] < h) split = true;
        }
        if (!split) continue;
        fill(bx, bz, h); fill(bx + h, bz, h); fill(bx, bz + h, h); fill(bx + h, bz + h, h);
        changed = true;
      }
    }
    if (!changed) break;
  }

  // EMIT. A leaf of one cell is triangulated exactly as the collider is, so the
  // near field is not merely close to the collider, it is the same triangles.
  const index: number[] = [];
  let leaves = 0, widest = 1, maxDeviation = 0;
  /** Does any leaf along this run of neighbour cells sit finer than `S`? */
  const finerAcross = (cx: number, cz: number, sx: number, sz: number, S: number) => {
    for (let k = 0; k < S; k++) {
      const x = cx + sx * k, z = cz + sz * k;
      if (x < 0 || z < 0 || x >= RES || z >= RES) return false;   // the map's rim: nothing to match
      if (leaf[z * RES + x] < S) return true;
    }
    return false;
  };
  for (let bz = 0; bz < RES; bz++) {
    for (let bx = 0; bx < RES; bx++) {
      const S = leaf[bz * RES + bx];
      if (bx % S || bz % S) continue;
      leaves++;
      if (S === 1) {
        if (drawn && !drawn(bx, bz)) continue;
        const a = at(bx, bz), b = at(bx + 1, bz), d = at(bx, bz + 1), e = at(bx + 1, bz + 1);
        index.push(a, d, b, b, d, e);
        continue;
      }
      if (S > widest) widest = S;
      const dev = fanDev(bx, bz, S);
      if (dev > maxDeviation) maxDeviation = dev;
      const h = S >> 1;
      // The perimeter, walked so that (centre, ring[k], ring[k+1]) faces +Y —
      // the same way up as the collider's own `a, d, b` winding. Each edge
      // gains its midpoint exactly when the leaf across it is finer, which is
      // what makes the two sides agree node for node.
      const ring: number[] = [];
      ring.push(at(bx, bz));
      if (finerAcross(bx - 1, bz, 0, 1, S)) ring.push(at(bx, bz + h));
      ring.push(at(bx, bz + S));
      if (finerAcross(bx, bz + S, 1, 0, S)) ring.push(at(bx + h, bz + S));
      ring.push(at(bx + S, bz + S));
      if (finerAcross(bx + S, bz, 0, 1, S)) ring.push(at(bx + S, bz + h));
      ring.push(at(bx + S, bz));
      if (finerAcross(bx, bz - 1, 1, 0, S)) ring.push(at(bx + h, bz));
      const c = at(bx + h, bz + h);
      for (let k = 0; k < ring.length; k++) index.push(c, ring[k], ring[(k + 1) % ring.length]);
    }
  }
  return { index, maxDeviation, leaves, widest };
}

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

  /** HOW FAR OUT THE DRAWN GROUND MUST BE THE COLLIDER EXACTLY — not within a
   *  tolerance of it, the same triangles.
   *
   *  Three things stand on this ground and read its exact height, and this is
   *  the outermost of them. None is a taste threshold; all three are read off
   *  the track being built, so a track that scatters differently gets a
   *  different radius without anyone editing this file.
   *
   *    THE CORRIDOR THE ROAD OWNS. `heightAt` is `roadHeightAt` out to
   *      `halfWidth` and is blended to the hills by `halfWidth + blend` —
   *      21.5 m on dustbowl, 24 m on harbour. Inside it the ribbon is swept at
   *      `heightAt + lift + 0.1` with its outer skirt at `lift = -0.3`, i.e.
   *      0.2 m BELOW the ground, deliberately, so the edge tucks in. Move the
   *      ground by more than that skirt and the seam either opens or swallows
   *      the road edge.
   *    THE START PAD, flattened to zero within `padRadius` of the first road
   *      sample — so every point of it is within `padRadius` of the road.
   *    EVERY BOUNDED SCATTER BELT. On all three shipped tracks that is
   *      `grassTuft`: 4,000 instances of a 0.7 m tuft, `minRoadDist 6`,
   *      `maxRoadDist 60`, seated on `heightAt` and authored right up to the
   *      verge — `tools/verify-solidity.mjs` names it as the thing that "hides
   *      the seam where the road ribbon tucks into the terrain". It is the
   *      SMALLEST thing standing on this ground, so it is the last one that
   *      could show the ground moving under it, and 60 m is where it stops.
   *
   *  A track with no scatter at all falls back to the corridor and the pad,
   *  which is the right answer for it: there is then nothing out there whose
   *  footing could disagree with what is drawn. */
  nearFieldRadius(): number {
    const def = this.def;
    let r = Math.max(def.road.halfWidth + def.road.blend, def.start.padRadius);
    for (const l of def.scenery) if (l.maxRoadDist !== undefined) r = Math.max(r, l.maxRoadDist);
    return r;
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
    // ---- ONE LATTICE, TWO INDEXES ------------------------------------------
    //
    // `idx` above is the whole lattice: 100,352 triangles, and it is what
    // Rapier gets. `ground` below is the same vertices drawn with fewer
    // triangles in the far field — see `lodIndex`. The `position` attribute and
    // the collider are handed the SAME `verts` array, so the drawn surface and
    // the driven surface are not two things kept in agreement, they are one
    // buffer read twice.
    //
    // WHAT A MERGED BLOCK IS ALLOWED TO COST, and it is two bounds at once
    // because one of them is not enough:
    //
    //   NEARER THAN `nearFieldRadius()` — nothing merges. Not "within a
    //     tolerance": the same triangles as the collider, because that is where
    //     the ribbon tucks in, where the pad is flattened and where the 0.7 m
    //     grass belt is seated.
    //   BEYOND IT — a block may merge when the gap it would open is under a
    //     pixel of the target phone's screen AT THE NEAREST RANGE THE EYE CAN
    //     SEE IT FROM, which is the block's own distance to the road less the
    //     chase camera's 9.9 m trail. That keeps the change invisible for a car
    //     on the route.
    //   AND UNDER ONE WHEEL DROOP, everywhere, whatever the range. The pixel
    //     rule assumes the eye is on the road, and a car that leaves the road
    //     takes the eye with it; this second bound is what holds when it does.
    //     0.225 m is the slack already in a resting wheel, so a car parked on
    //     the far rim is still standing on the ground it can see.
    //
    // The droop cap binds past 256 m (0.225 * 1095 + 9.9); inside that the
    // pixel rule is the tighter of the two.
    const near = this.nearFieldRadius();
    const dist = new Float32Array((RES + 1) * (RES + 1));
    for (let gz = 0; gz <= RES; gz++) {
      for (let gx = 0; gx <= RES; gx++) {
        dist[gz * (RES + 1) + gx] = this.sdf((gx / RES - 0.5) * SIZE, (gz / RES - 0.5) * SIZE).d;
      }
    }
    const ground = lodIndex(
      RES,
      (gx, gz) => verts[(gz * (RES + 1) + gx) * 3 + 1],
      (bx, bz, S, dev) => {
        let dmin = Infinity;
        for (let j = 0; j <= S; j++) {
          for (let i = 0; i <= S; i++) {
            const d = dist[(bz + j) * (RES + 1) + bx + i];
            if (d < dmin) dmin = d;
          }
        }
        if (dmin < near) return false;
        const range = dmin - CAMERA_TRAIL;
        return dev <= Math.min(range * SCREEN_ERROR_PIXELS / PIXELS_PER_RADIAN, WHEEL_DROOP);
      },
    );

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    geo.setIndex(ground.index);
    // Normals come off the DRAWN triangles, which is what shades them. Lattice
    // nodes no triangle references keep a zero normal and are never fetched:
    // an indexed draw only ever pulls the vertices its index names.
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
      // THE GRID WAS 128 SQUARE — 32,768 triangles, a fifth of the whole mobile
      // budget, on a surface nothing collides with. Two thirds of that was not
      // buying anything, and it took measuring the swell to see which two
      // thirds.
      //
      // WHAT THE SWELL ACTUALLY IS. The two sine terms below run at |k| 0.3536
      // and 0.2195 rad/m, i.e. wavelengths of 17.77 m and 28.62 m. The plane
      // spans SIZE * 1.4 = 1,260 m, so a 128 grid samples the FINER octave 1.81
      // times per wavelength — BELOW the Nyquist limit of 2. The old grid was
      // not resolving the swell, it was aliasing it: measured against the
      // written formula on a 1 m lattice, what 128 draws departs from it by
      // 0.098 m peak and 0.040 m rms, and the swell's own rms is 0.0765 m. Over
      // half of the ripple you could see was already not the ripple that was
      // written. So there is no resolution here to protect — 96 trades one
      // alias for another (1.35 samples per wavelength) and loses no feature
      // the grid was ever resolving.
      //
      // WHAT 96 DOES COST, measured, both of it:
      //   THE DEPTH GRADIENT, which the comment above calls the thing that
      //     makes a shoreline read: worst per-channel error over the whole wet
      //     surface goes 4.6 -> 6.3 of 255, and its rms goes 0.39 -> 0.60 —
      //     still under one 8-bit quantisation step, so on nearly all of the
      //     surface the byte that gets drawn does not change at all.
      //   THE SHADING RELIEF, which is what the swell is for: rms surface slope
      //     goes 0.78 -> 0.55 degrees, keeping 71% of it. (64 would keep 28%
      //     and is where the water starts going flat; that is the floor, and
      //     this is one step above it.)
      const SEG = 96;
      const span = SIZE * 1.4;
      const wStep = span / SEG;
      const wN = SEG + 1;
      const wVerts = new Float32Array(wN * wN * 3);
      const wCols = new Float32Array(wN * wN * 3);
      const shallow = new THREE.Color(W.color);
      const deep = new THREE.Color(W.deep);
      const wc = new THREE.Color();
      for (let iz = 0; iz < wN; iz++) {
        for (let ix = 0; ix < wN; ix++) {
          const x = ix * wStep - span / 2;
          const z = iz * wStep - span / 2;
          const o = (iz * wN + ix) * 3;
          wVerts[o] = x;
          wVerts[o + 1] = Math.sin(x * 0.31 + z * 0.17) * 0.09 + Math.sin(x * 0.11 - z * 0.19 + 2.1) * 0.06;
          wVerts[o + 2] = z;
          const d = W.level - this.heightAt(x, z);
          // Linear, and capped short of the full deep colour. Squaring it looked
          // right in isolation and came out near-black in the world, because the
          // BED is darkened too (see colorAt) and the two multiply through a
          // translucent surface. Between them the channel was swallowing the
          // middle distance.
          const t = THREE.MathUtils.clamp(d / Math.max(0.5, W.deepAt), 0, 1);
          wc.copy(shallow).lerp(deep, t * 0.88);
          wCols[o] = wc.r; wCols[o + 1] = wc.g; wCols[o + 2] = wc.b;
        }
      }

      // ---- AND MOST OF THE PLANE IS UNDER DRY LAND ---------------------------
      //
      // The sheet is 1,260 m square over a 900 m map and it is drawn whole, so
      // every quad standing under a hillside is rasterised, depth-tested
      // against the ground in front of it and thrown away. Those quads are free
      // to delete: this is not an approximation, it is geometry that could
      // never produce a pixel.
      //
      // "Could never" has to be proved rather than assumed, and the margin is
      // where the proof lives. A quad is dropped only when the LOWEST the drawn
      // ground gets anywhere under it or under any of its eight neighbours is
      // more than WHEEL_DROOP above the waterline. The neighbour ring covers a
      // low point sitting just across a quad edge; the droop covers the far
      // field, where `lodIndex` above is allowed to draw the ground up to
      // exactly that much below the lattice and no further. Take those minima
      // off the terrain lattice `build()` has already computed — 4.02 m, finer
      // than a 13.1 m water quad — so this costs no extra `heightAt` at all.
      //
      // Anything not wholly inside the map keeps its water: past the rim there
      // is no drawn ground to hide behind, and `heightAt` out there is still
      // evaluating hills that nothing draws.
      const lo = new Float64Array(SEG * SEG).fill(Infinity);
      for (let gz = 0; gz <= RES; gz++) {
        for (let gx = 0; gx <= RES; gx++) {
          const qx = Math.floor(((gx / RES - 0.5) * SIZE + span / 2) / wStep);
          const qz = Math.floor(((gz / RES - 0.5) * SIZE + span / 2) / wStep);
          if (qx < 0 || qz < 0 || qx >= SEG || qz >= SEG) continue;
          const h = verts[(gz * (RES + 1) + gx) * 3 + 1];
          if (h < lo[qz * SEG + qx]) lo[qz * SEG + qx] = h;
        }
      }
      const hidden = (qx: number, qz: number) => {
        const x0 = qx * wStep - span / 2, z0 = qz * wStep - span / 2;
        if (x0 < -SIZE / 2 || x0 + wStep > SIZE / 2
          || z0 < -SIZE / 2 || z0 + wStep > SIZE / 2) return false;
        const m = lo[qz * SEG + qx];
        return Number.isFinite(m) && m > W.level + WHEEL_DROOP;
      };
      const wet = (qx: number, qz: number) => {
        for (let j = -1; j <= 1; j++) {
          for (let i = -1; i <= 1; i++) {
            const x = qx + i, z = qz + j;
            if (x < 0 || z < 0 || x >= SEG || z >= SEG) return true;
            if (!hidden(x, z)) return true;
          }
        }
        return false;
      };
      // maxBlock 1: the quads that survive are drawn at full resolution. The
      // shoreline is the whole reason this surface has vertices, and merging
      // out in the open sea would want a colour bound as well as a height one —
      // that is a separate change with its own measurement, noted in the report
      // rather than smuggled in here.
      const wIdx = lodIndex(SEG, (gx, gz) => wVerts[(gz * wN + gx) * 3 + 1], () => false, wet, 1);

      const wGeo = new THREE.BufferGeometry();
      wGeo.setAttribute('position', new THREE.BufferAttribute(wVerts, 3));
      wGeo.setAttribute('color', new THREE.BufferAttribute(wCols, 3));
      wGeo.setIndex(wIdx.index);
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
