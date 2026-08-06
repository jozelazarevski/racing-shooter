/* Stage geometry: a centreline, graded corners, and the terrain under it.
 *
 * Phase 1 work. Everything here is specified rather than tuned:
 *   §1.2  corridor widths per surface
 *   §1.3  corner grading G1-G6 by radius, with pacenote calls
 *   §13   terrain gradient limits
 *   §16.2 segment record
 *
 * The one thing that is NOT specified is the shape of any particular stage —
 * that is authoring. Stages are described by a short list of instructions
 * (straight, corner, crest, dip) and expanded here, which keeps the interesting
 * part readable and lets the lint check the result.
 */
import {
  CORNER_GRADES,
  CORRIDOR,
  TERRAIN_LIMITS,
} from '../../../spec/rally.constants.ts';
import type { Rng } from '../core/rng.ts';

export type SurfaceKind = 'gravel' | 'tarmac' | 'snow';

/** An authored instruction. Lengths in metres, angles in degrees. */
export type StageMove =
  | { kind: 'straight'; length: number; grade?: number }
  | { kind: 'corner'; angle: number; radius: number; grade?: number }
  | { kind: 'crest'; length: number; height: number }
  | { kind: 'dip'; length: number; depth: number };

/** §16.2, trimmed to what the game reads. */
export interface Segment {
  index: number;
  x: number;
  y: number;
  z: number;
  /** Unit heading in the xz plane. */
  hx: number;
  hz: number;
  roadbedWidth: number;
  /** §1.2 shoulder — drivable with a grip penalty, never a hard stop. This is
   *  also the runoff L08 checks on the outside of slow corners. */
  shoulderWidth: [number, number];
  /** §1.2 verge — Tier 1 and Tier 2 objects only. Tier 3 and 4 start beyond
   *  shoulder + verge, which is the "barrier band". */
  vergeWidth: [number, number];
  surfaceId: string;
  /** Signed curvature radius, metres. Infinity on a straight. */
  cornerRadius: number;
  cornerGrade: number;
  /** dy/dlength. */
  gradient: number;
  camber: number;
  /** Distance along the centreline from the start, metres. */
  distance: number;
}

export interface Corridor {
  surface: SurfaceKind;
  segments: Segment[];
  /** Metres. */
  length: number;
  /** Spacing between segments, metres. */
  step: number;
}

/** §1.3. Returns the coarsest grade whose minimum radius the corner clears —
 *  the table is ordered fastest-first, so the first match is the right one. */
export function gradeForRadius(radius: number): (typeof CORNER_GRADES)[number] {
  for (const g of CORNER_GRADES) if (radius >= g.minRadius) return g;
  return CORNER_GRADES[CORNER_GRADES.length - 1]!;
}

/** The pacenote a co-driver would call. §15 L06 wants one per corner. */
export function pacenote(seg: Segment, direction: 'left' | 'right'): string {
  const g = gradeForRadius(seg.cornerRadius);
  return `${direction} ${g.call}`;
}

const STEP = 4; // metres between segments. 4 m keeps a 30 m hairpin smooth.

/**
 * Expand authored moves into a segment list.
 *
 * Terrain height is carried as a running value so gradients are continuous:
 * a crest that rises 6 m over 90 m leaves the road 6 m higher afterwards,
 * which is what makes a stage feel like it goes somewhere rather than
 * oscillating around zero.
 */
export function buildCorridor(
  moves: StageMove[],
  surface: SurfaceKind,
  rng: Rng,
): Corridor {
  const spec = CORRIDOR[surface];
  const segments: Segment[] = [];

  let x = 0;
  let z = 0;
  let y = 0;
  let heading = 0;          // radians, 0 = +x
  let distance = 0;

  const push = (radius: number, gradient: number, camber: number) => {
    // §1.2 width bands. Tighter corners get more road, which is both real and
    // the difference between a hairpin that works and one that is a wall.
    const grade = gradeForRadius(Math.abs(radius));
    const t = grade.grade >= 5 ? 0 : (6 - grade.grade) / 5;
    let width = spec.roadbedMin + (spec.roadbedMax - spec.roadbedMin) * t;
    // A little authored variation, seeded — never Math.random.
    width += rng.jitter(0.25);
    width = Math.max(CORRIDOR.absoluteMinWidth, Math.min(CORRIDOR.hairpinMaxWidth, width));

    const shoulder = (): number =>
      spec.shoulderMin + rng.float() * (spec.shoulderMax - spec.shoulderMin);

    segments.push({
      index: segments.length,
      x, y, z,
      hx: Math.cos(heading),
      hz: Math.sin(heading),
      roadbedWidth: width,
      shoulderWidth: [shoulder(), shoulder()],
      vergeWidth: [
        spec.vergeMin + rng.float() * (spec.vergeMax - spec.vergeMin),
        spec.vergeMin + rng.float() * (spec.vergeMax - spec.vergeMin),
      ],
      surfaceId: surface === 'gravel' ? 'gravel_loose' : surface === 'tarmac' ? 'tarmac_dry' : 'snow_packed',
      cornerRadius: Math.abs(radius),
      cornerGrade: grade.grade,
      gradient,
      camber,
      distance,
    });
  };

  const advance = (dist: number, dy: number) => {
    x += Math.cos(heading) * dist;
    z += Math.sin(heading) * dist;
    y += dy;
    distance += dist;
  };

  for (const move of moves) {
    if (move.kind === 'straight') {
      const grade = clampGrade(move.grade ?? 0);
      const n = Math.max(1, Math.round(move.length / STEP));
      for (let i = 0; i < n; i++) {
        push(Infinity, grade, 0);
        advance(STEP, grade * STEP);
      }
    } else if (move.kind === 'corner') {
      const radius = Math.max(8, move.radius);
      const sweep = (Math.abs(move.angle) * Math.PI) / 180;
      const arc = sweep * radius;
      const n = Math.max(2, Math.round(arc / STEP));
      const dir = Math.sign(move.angle) || 1;
      const grade = clampGrade(move.grade ?? 0);
      // §13: camber into the corner, capped by the spec.
      const camber = Math.min(TERRAIN_LIMITS.camberMax, 0.02 + 40 / radius / 100) * dir;
      for (let i = 0; i < n; i++) {
        push(radius * dir, grade, camber);
        heading += (dir * sweep) / n;
        advance(arc / n, (grade * arc) / n);
      }
    } else if (move.kind === 'crest' || move.kind === 'dip') {
      const rise = move.kind === 'crest' ? move.height : -move.depth;
      const n = Math.max(2, Math.round(move.length / STEP));
      for (let i = 0; i < n; i++) {
        // A raised cosine: zero gradient at both ends, so a crest joins the
        // straights either side without a kink. The peak gradient is
        // pi*rise/length, which is what the limit check below is applied to.
        const phase = (i / n) * Math.PI * 2;
        const dy = ((rise / 2) * (Math.PI / n)) * Math.sin(phase);
        push(Infinity, dy / STEP, 0);
        advance(STEP, dy);
      }
    }
  }

  const corridor: Corridor = { surface, segments, length: distance, step: STEP };

  // L08 runoff, applied per CORNER RUN rather than per segment.
  //
  // A run is graded on its tightest radius, so two adjacent corner moves —
  // radius 62 into radius 44, same direction, no straight between — merge into
  // one Grade 3 corner even though the first move's segments were individually
  // Grade 4 and got no runoff. Widening at push() time cannot see that; the
  // run does.
  for (const run of cornerRuns(corridor)) {
    if (run.grade > 3) continue;
    const needed = CORNER_GRADES.find((g) => g.grade === run.grade)?.runoff ?? 0;
    // Runoff belongs on the OUTSIDE of the corner: a left-hander runs off to
    // the right.
    const side = run.direction === 'left' ? 1 : 0;
    for (let i = run.from; i <= run.to; i++) {
      const s = segments[i]!;
      s.shoulderWidth[side] = Math.max(s.shoulderWidth[side]!, needed);
    }
  }

  return corridor;
}

/** §13 TERRAIN_LIMITS. A stage may not ask for a gradient the spec forbids. */
function clampGrade(g: number): number {
  const max = TERRAIN_LIMITS.climbShort;
  const min = -TERRAIN_LIMITS.descentShort;
  return Math.max(min, Math.min(max, g));
}

/** Nearest segment to a world point, plus signed lateral offset.
 *  Linear scan: a stage is a few thousand segments and this runs once per
 *  query, not per frame per object. */
export function locate(
  corridor: Corridor,
  px: number,
  pz: number,
): { seg: Segment; lateral: number; distance: number } {
  let best = corridor.segments[0]!;
  let bestD2 = Infinity;
  for (const s of corridor.segments) {
    const d2 = (s.x - px) ** 2 + (s.z - pz) ** 2;
    if (d2 < bestD2) { bestD2 = d2; best = s; }
  }
  // Left-normal of the heading.
  const nx = -best.hz;
  const nz = best.hx;
  const lateral = (px - best.x) * nx + (pz - best.z) * nz;
  return { seg: best, lateral, distance: Math.sqrt(bestD2) };
}

/** Corner runs, for pacenotes and for the L06/L17 lint. A run is a maximal
 *  stretch of consecutive segments turning the same way. */
export interface CornerRun {
  from: number;
  to: number;
  radius: number;
  grade: number;
  direction: 'left' | 'right';
  call: string;
}

export function cornerRuns(corridor: Corridor): CornerRun[] {
  const runs: CornerRun[] = [];
  let start = -1;
  let dir: 'left' | 'right' | null = null;

  const close = (end: number) => {
    if (start < 0 || dir === null) return;
    let radius = Infinity;
    for (let i = start; i <= end; i++) radius = Math.min(radius, corridor.segments[i]!.cornerRadius);
    const g = gradeForRadius(radius);
    runs.push({ from: start, to: end, radius, grade: g.grade, direction: dir, call: `${dir} ${g.call}` });
    start = -1;
    dir = null;
  };

  for (let i = 0; i < corridor.segments.length; i++) {
    const s = corridor.segments[i]!;
    if (!Number.isFinite(s.cornerRadius)) { close(i - 1); continue; }
    // Turn direction from the heading change, which survives the arc being
    // split into many small segments.
    const next = corridor.segments[i + 1];
    if (!next) { close(i); break; }
    const cross = s.hx * next.hz - s.hz * next.hx;
    const d: 'left' | 'right' = cross > 0 ? 'right' : 'left';
    if (dir !== d) { close(i - 1); start = i; dir = d; }
  }
  close(corridor.segments.length - 1);
  return runs;
}
