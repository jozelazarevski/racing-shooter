/* The heightfield.
 *
 * THE ARCHITECTURAL POINT OF v2 IS IN THIS FILE.
 *
 * In v1 the road was a ribbon of mesh floating over a separately generated
 * terrain, and the car's height came from whichever of the two the code
 * currently believed it was on. That is the sinking bug, the floating-bridge
 * bug and half the jumping: two sources of truth for "where is the ground",
 * reconciled by hand, and the hand was sometimes wrong.
 *
 * Here there is ONE source of truth. The heightfield is carved so that its
 * surface IS the road along the corridor and blends out to open terrain
 * beyond. The road is not placed on the terrain; the road is a property of the
 * terrain. A rigid body resting on it cannot sink into it or float above it,
 * because there is nothing else to be on.
 */
import type { Corridor, Segment } from './corridor.ts';
import type { Rng } from '../core/rng.ts';

export interface Heightfield {
  /** Cell size, metres. */
  cell: number;
  /** Grid dimensions in cells (heights array is (nx+1) * (nz+1)). */
  nx: number;
  nz: number;
  /** World position of grid origin. */
  x0: number;
  z0: number;
  /** Heights, length (nx+1) * (nz+1), indexed `i * (nz+1) + j` where i steps
   *  along x and j along z.
   *
   *  THAT ORDER IS NOT ARBITRARY and it is not the obvious one. Rapier's
   *  heightfield reads its buffer as a column-major matrix whose FIRST index
   *  is z and second is x — the transpose of the natural row-major layout.
   *  Getting it wrong does not throw: the collider is built happily, from
   *  transposed terrain, and the car falls through the world at the start
   *  line. Verified empirically with a ramp probe rather than from the docs;
   *  see `hf-probe.mjs`. Use `hfIndex` and never index this by hand. */
  heights: Float32Array;
  /** 0 = open terrain, 1 = roadbed. Same layout as heights. */
  roadMask: Float32Array;
  minY: number;
  maxY: number;
}

const CELL = 4;
const MARGIN = 90; // metres of terrain beyond the widest corridor point

/** Buckets segments by grid cell so the carve is O(cells) not O(cells x segs).
 *  A 3.5 km stage is ~900 segments over ~100k cells; the naive version is 90
 *  million distance tests and takes long enough to feel like a hang. */
class SegmentIndex {
  private readonly buckets = new Map<number, Segment[]>();
  private readonly size: number;

  constructor(segments: Segment[], size = 32) {
    this.size = size;
    for (const s of segments) {
      const key = this.key(s.x, s.z);
      let b = this.buckets.get(key);
      if (!b) { b = []; this.buckets.set(key, b); }
      b.push(s);
    }
  }

  private key(x: number, z: number): number {
    // 16-bit fold. Stage extents never approach the wrap distance.
    return (Math.floor(x / this.size) & 0xffff) * 65536 + (Math.floor(z / this.size) & 0xffff);
  }

  /** Nearest segment in the 3x3 bucket neighbourhood, or null.
   *
   *  Returns the winner rather than a list on purpose: this runs once per grid
   *  point — hundreds of thousands of times per stage — and building a fresh
   *  array of candidates at each one dominated the build. Ouninpohja took 5.8 s
   *  that way, which is a visible stall on a page load. */
  nearest(x: number, z: number): Segment | null {
    let best: Segment | null = null;
    let bestD2 = Infinity;
    const bx = Math.floor(x / this.size);
    const bz = Math.floor(z / this.size);
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const b = this.buckets.get(((bx + i) & 0xffff) * 65536 + ((bz + j) & 0xffff));
        if (!b) continue;
        for (let k = 0; k < b.length; k++) {
          const s = b[k]!;
          const d2 = (s.x - x) ** 2 + (s.z - z) ** 2;
          if (d2 < bestD2) { bestD2 = d2; best = s; }
        }
      }
    }
    return best;
  }
}

/**
 * Build the heightfield for a corridor.
 *
 * For each grid point:
 *   - find the nearest centreline segment
 *   - inside the roadbed, take the road height exactly (plus camber)
 *   - across the verge, blend smoothly from road height to terrain height
 *   - beyond, open terrain
 *
 * The blend is smoothstep over the verge width. A linear blend leaves a
 * visible and drivable crease at the roadbed edge; smoothstep makes the verge
 * a shoulder you can put two wheels on, which is what a rally verge is for.
 */
export function buildHeightfield(corridor: Corridor, rng: Rng): Heightfield {
  const segs = corridor.segments;
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (const s of segs) {
    if (s.x < minX) minX = s.x;
    if (s.x > maxX) maxX = s.x;
    if (s.z < minZ) minZ = s.z;
    if (s.z > maxZ) maxZ = s.z;
  }
  const x0 = minX - MARGIN;
  const z0 = minZ - MARGIN;
  const nx = Math.ceil((maxX - minX + MARGIN * 2) / CELL);
  const nz = Math.ceil((maxZ - minZ + MARGIN * 2) / CELL);

  const heights = new Float32Array((nx + 1) * (nz + 1));
  const roadMask = new Float32Array((nx + 1) * (nz + 1));
  const index = new SegmentIndex(segs);

  // Terrain noise. Deterministic: three octaves of value noise on a seeded
  // lattice, sampled with smoothstep interpolation. Not Perlin — this is
  // background relief, and value noise is enough for it.
  const lattice = makeLattice(rng, 512);

  let minY = Infinity;
  let maxY = -Infinity;

  for (let j = 0; j <= nz; j++) {
    const wz = z0 + j * CELL;
    for (let i = 0; i <= nx; i++) {
      const wx = x0 + i * CELL;

      const best = index.nearest(wx, wz);

      const open = terrainHeight(lattice, wx, wz);
      let h = open;
      let mask = 0;

      if (best) {
        const nxr = -best.hz;
        const nzr = best.hx;
        const lateral = (wx - best.x) * nxr + (wz - best.z) * nzr;
        const dist = Math.abs(lateral);
        const half = best.roadbedWidth / 2;
        const side = lateral >= 0 ? 0 : 1;
        // Shoulder and verge together are the soft band the road eases across.
        const verge = best.shoulderWidth[side] + best.vergeWidth[side];

        // The carve must be wider than the roadbed by more than one cell on
        // each side, or bilinear sampling ON the road mixes in a grid point
        // that has already started blending toward open terrain. With a 5.4 m
        // road and 4 m cells that error measured up to 14 m — the v1 sinking
        // bug, reproduced exactly, in code that looks obviously correct. One
        // cell of margin left 0.42 m of error on tight corners, where the
        // nearest segment changes fast; 1.5 cells clears it.
        const flat = half + CELL * 1.5;

        if (dist <= flat) {
          // Road height is the ground height, exactly. One source of truth.
          h = best.y + Math.max(-half, Math.min(half, lateral)) * best.camber;
          mask = dist <= half ? 1 : 0.5;
        } else if (dist <= flat + verge) {
          const t = smoothstep((dist - flat) / verge);
          const edge = best.y + Math.sign(lateral) * half * best.camber;
          h = edge * (1 - t) + open * t;
          mask = 0.5 * (1 - t);
        } else {
          // Beyond the verge, ease the remaining distance so the terrain does
          // not step away from the shoulder.
          const t = smoothstep(Math.min(1, (dist - flat - verge) / 25));
          const edge = best.y + Math.sign(lateral) * half * best.camber;
          h = edge * (1 - t) + open * t;
        }
      }

      const idx = i * (nz + 1) + j;
      heights[idx] = h;
      roadMask[idx] = mask;
      if (h < minY) minY = h;
      if (h > maxY) maxY = h;
    }
  }

  return { cell: CELL, nx, nz, x0, z0, heights, roadMask, minY, maxY };
}

function smoothstep(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

function makeLattice(rng: Rng, n: number): Float32Array {
  const a = new Float32Array(n * n);
  for (let i = 0; i < a.length; i++) a[i] = rng.float();
  return a;
}

function latticeAt(l: Float32Array, ix: number, iz: number): number {
  const n = 512;
  return l[((iz % n) + n) % n * n + (((ix % n) + n) % n)]!;
}

function valueNoise(l: Float32Array, x: number, z: number): number {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = smoothstep(x - ix);
  const fz = smoothstep(z - iz);
  const a = latticeAt(l, ix, iz);
  const b = latticeAt(l, ix + 1, iz);
  const c = latticeAt(l, ix, iz + 1);
  const d = latticeAt(l, ix + 1, iz + 1);
  return (a * (1 - fx) + b * fx) * (1 - fz) + (c * (1 - fx) + d * fx) * fz;
}

/** Open terrain relief in metres, three octaves. */
function terrainHeight(l: Float32Array, x: number, z: number): number {
  return (
    (valueNoise(l, x / 220, z / 220) - 0.5) * 46 +
    (valueNoise(l, x / 70, z / 70) - 0.5) * 11 +
    (valueNoise(l, x / 22, z / 22) - 0.5) * 2.4
  );
}

/** The one place that knows the buffer layout. */
export function hfIndex(hf: Heightfield, i: number, j: number): number {
  return i * (hf.nz + 1) + j;
}

/** Bilinear sample. The renderer and the lint both use this so they cannot
 *  disagree with each other about where the ground is; Rapier reads the same
 *  array directly. */
export function sampleHeight(hf: Heightfield, x: number, z: number): number {
  const fx = (x - hf.x0) / hf.cell;
  const fz = (z - hf.z0) / hf.cell;
  const i = Math.max(0, Math.min(hf.nx - 1, Math.floor(fx)));
  const j = Math.max(0, Math.min(hf.nz - 1, Math.floor(fz)));
  const tx = Math.max(0, Math.min(1, fx - i));
  const tz = Math.max(0, Math.min(1, fz - j));
  const s = hf.nz + 1;
  const h00 = hf.heights[i * s + j]!;
  const h10 = hf.heights[(i + 1) * s + j]!;
  const h01 = hf.heights[i * s + j + 1]!;
  const h11 = hf.heights[(i + 1) * s + j + 1]!;
  return (h00 * (1 - tx) + h10 * tx) * (1 - tz) + (h01 * (1 - tx) + h11 * tx) * tz;
}

/** Uphill surface normal, from the same samples the physics uses. */
export function sampleNormal(hf: Heightfield, x: number, z: number): [number, number, number] {
  const d = hf.cell;
  const hx = sampleHeight(hf, x + d, z) - sampleHeight(hf, x - d, z);
  const hz = sampleHeight(hf, x, z + d) - sampleHeight(hf, x, z - d);
  const nx = -hx / (2 * d);
  const nz = -hz / (2 * d);
  const len = Math.hypot(nx, 1, nz);
  return [nx / len, 1 / len, nz / len];
}
