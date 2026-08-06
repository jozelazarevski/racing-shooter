/* Stage assembly and the stage list.
 *
 * A stage is: an authored move list (§1.3 shapes), a surface, a biome, and a
 * seed. Everything else — widths, camber, terrain, scatter, pacenotes — is
 * derived. That is the Phase 1 bargain: the interesting decisions stay
 * readable, and everything downstream of them is specified rather than tuned.
 */
import { StageRng, withoutMathRandom } from '../core/stageRng.ts';
import { buildCorridor, cornerRuns, type Corridor, type StageMove, type SurfaceKind, type CornerRun } from './corridor.ts';
import { buildHeightfield, sampleHeight, type Heightfield } from './terrain.ts';
import { scatterCorridor, type WorldObject, type Biome } from './scatter.ts';
import { buildRacingLine, type RacingLine } from '../race/line.ts';

export interface StageDef {
  id: string;
  name: string;
  country: string;
  surface: SurfaceKind;
  biome: Biome;
  moves: StageMove[];
}

export interface Stage {
  def: StageDef;
  rng: StageRng;
  corridor: Corridor;
  heightfield: Heightfield;
  objects: WorldObject[];
  corners: CornerRun[];
  /** The minimum-curvature path through the corridor and its speed profile.
   *  Part of the stage rather than of the AI: it is a deterministic property of
   *  the geometry, the lint reads it, and the rival and the reference lap must
   *  be driving the same one or the reference lap measures nothing. */
  line: RacingLine;
  /** Metres. */
  length: number;
}

/**
 * Build a whole stage, deterministically.
 *
 * The `withoutMathRandom` wrapper is the Phase 0 guard doing its job: if any
 * pass added later reaches for an unseeded draw, the stage fails to build
 * rather than quietly becoming irreproducible.
 */
export function buildStage(def: StageDef): Stage {
  return withoutMathRandom(() => {
    const rng = new StageRng(def.id);
    // The corridor takes its jitter from `scatter`, not a channel of its own:
    // the spec lists four channels and says never share, so road geometry
    // rides on the world-building one rather than inventing a fifth.
    const corridor = buildCorridor(def.moves, def.surface, rng.scatter.fork('corridor'));
    const heightfield = buildHeightfield(corridor, rng.scatter.fork('terrain'));
    const objects = scatterCorridor(
      {
        surface: def.surface,
        biome: def.biome,
        nodes: corridor.segments,
        bandDepth: 26,
        heightAt: (x, z) => sampleHeight(heightfield, x, z),
      },
      rng,
    );
    return {
      def,
      rng,
      corridor,
      heightfield,
      objects,
      corners: cornerRuns(corridor),
      line: buildRacingLine(corridor),
      length: corridor.length,
    };
  });
}

// ---------------------------------------------------------------------------
// The stages
// ---------------------------------------------------------------------------
//
// Lengths are chosen to satisfy L16 (3.5-22 km) and the grade mix to satisfy
// L17 (no grade above 40% of corners). The lint checks both, so these are
// claims the build tests rather than promises in a comment.

const KM = 1000;

/* Two authoring helpers, both shaped by what the lint rejected.
 *
 * The rule they exist to respect: a 2D heightfield holds ONE height per xz, so
 * a stage may never pass over itself. X04 measures it; these keep it true by
 * construction. The first version of this file did not, and Col de Turini came
 * back with two pieces of road 1.3 m apart horizontally and 11.5 m apart
 * vertically — one of them necessarily hanging in mid-air. */

/** Radii chosen one per §1.3 grade band, so a flowing section spreads across
 *  G2-G6 rather than piling into one. L17 caps any single grade at 40% of a
 *  stage's corners, and a naive "base + i*18" ramp put 53% in G5. */
const GRADE_RADII = [34, 62, 95, 140, 210];

/**
 * A run of alternating corners that returns to its entry heading.
 *
 * Each pair is equal and opposite. That matters: an earlier version varied the
 * angle within the pair, which left a few degrees of net rotation per pair,
 * and over a dozen corners the stage curled round and crossed itself.
 */
function flowing(pairs: number, offset = 0): StageMove[] {
  const out: StageMove[] = [];
  for (let i = 0; i < pairs; i++) {
    const radius = GRADE_RADII[(i + offset) % GRADE_RADII.length]!;
    // Sweep angle scaled so tight corners stay short and open ones stay long;
    // the arc length lands in a similar band either way.
    const angle = Math.max(18, Math.min(60, 2400 / radius));
    out.push({ kind: 'straight', length: 70 + (i % 3) * 45 });
    out.push({ kind: 'corner', angle, radius });
    out.push({ kind: 'straight', length: 60 + (i % 2) * 40 });
    out.push({ kind: 'corner', angle: -angle, radius });
  }
  return out;
}

/**
 * A switchback ladder — the real shape of a mountain col.
 *
 * Traverse, hairpin, traverse back, hairpin, climbing throughout. Consecutive
 * traverses sit 2 x radius apart, so the separation is a parameter rather than
 * an accident: at radius 20 the legs are 40 m apart, comfortably clear of the
 * 24 m X04 needs for the carve not to overlap.
 */
function switchbacks(count: number, traverse: number, radii: number[], grade: number): StageMove[] {
  // The count MUST be even. An odd ladder leaves the stage travelling back the
  // way it came, so the next ladder marches its rungs straight back over the
  // ones already laid down — which is exactly how Col de Turini ended up with
  // two roads 0.8 m apart and 23 m of height between them.
  const n = count % 2 === 0 ? count : count + 1;
  const out: StageMove[] = [];
  for (let i = 0; i < n; i++) {
    // Radii cycle so a col is not eleven identical G1 hairpins: L17 caps any
    // one grade at 40%, and a fixed radius under 30 m put 73% in G1.
    const radius = radii[i % radii.length]!;
    out.push({ kind: 'straight', length: traverse, grade });
    out.push({ kind: 'corner', angle: i % 2 === 0 ? 180 : -180, radius, grade });
  }
  return out;
}

export const STAGES: StageDef[] = [
  {
    id: 'ouninpohja',
    name: 'OUNINPOHJA',
    country: 'Finland',
    surface: 'gravel',
    biome: 'nordic_pine',
    moves: [
      { kind: 'straight', length: 240, grade: 0.02 },
      { kind: 'crest', length: 90, height: 7 },
      ...flowing(3, 3),
      { kind: 'crest', length: 70, height: 5.5 },
      ...flowing(3, 0),
      { kind: 'crest', length: 80, height: 8 },
      { kind: 'straight', length: 300, grade: -0.04 },
      ...flowing(3, 1),
      { kind: 'dip', length: 100, depth: 6 },
      ...flowing(2, 4),
      { kind: 'straight', length: 420 },
      { kind: 'crest', length: 90, height: 9 },
      { kind: 'straight', length: 280, grade: -0.03 },
    ],
  },
  {
    id: 'col-de-turini',
    name: 'COL DE TURINI',
    country: 'Monaco',
    surface: 'tarmac',
    biome: 'mediterranean_scrub',
    moves: [
      { kind: 'straight', length: 300, grade: 0.05 },
      ...switchbacks(6, 250, [20, 34, 30], 0.07),
      ...flowing(2, 2),
      ...switchbacks(4, 230, [55, 24], -0.07),
      { kind: 'straight', length: 360, grade: -0.04 },
    ],
  },
  {
    id: 'fafe',
    name: 'FAFE',
    country: 'Portugal',
    surface: 'gravel',
    biome: 'alpine_forest',
    moves: [
      { kind: 'straight', length: 200 },
      ...flowing(3, 0),
      // The famous one: a short, steep crest taken flat out.
      { kind: 'straight', length: 220, grade: 0.05 },
      { kind: 'crest', length: 55, height: 9 },
      { kind: 'straight', length: 260, grade: -0.05 },
      ...flowing(3, 2),
      { kind: 'crest', length: 60, height: 7 },
      ...flowing(2, 4),
      { kind: 'straight', length: 340 },
      ...flowing(2, 1),
      { kind: 'straight', length: 220 },
    ],
  },
  {
    id: 'monte-carlo',
    name: 'MONTE CARLO',
    country: 'France',
    surface: 'snow',
    biome: 'alpine_forest',
    moves: [
      { kind: 'straight', length: 260, grade: -0.03 },
      ...flowing(3, 1),
      ...switchbacks(4, 240, [21, 36], -0.06),
      { kind: 'dip', length: 90, depth: 5 },
      ...flowing(3, 3),
      { kind: 'straight', length: 380, grade: -0.04 },
      { kind: 'crest', length: 70, height: 4 },
      ...flowing(2, 0),
      { kind: 'straight', length: 300 },
    ],
  },
  {
    id: 'safari',
    name: 'SAFARI',
    country: 'Kenya',
    surface: 'gravel',
    biome: 'desert_wash',
    moves: [
      { kind: 'straight', length: 600, grade: 0.01 },
      ...flowing(2, 4),
      { kind: 'straight', length: 520 },
      { kind: 'dip', length: 120, depth: 4 },
      ...flowing(2, 3),
      { kind: 'straight', length: 700 },
      { kind: 'crest', length: 110, height: 6 },
      ...flowing(3, 0),
      { kind: 'straight', length: 560 },
      ...flowing(2, 1),
      { kind: 'straight', length: 640 },
    ],
  },
  {
    id: 'sweet-lamb',
    name: 'SWEET LAMB',
    country: 'Wales',
    surface: 'gravel',
    biome: 'moorland',
    moves: [
      { kind: 'straight', length: 220, grade: 0.04 },
      ...flowing(3, 0),
      { kind: 'straight', length: 150, grade: -0.08 },
      { kind: 'dip', length: 80, depth: 7 },
      { kind: 'straight', length: 120, grade: 0.09 },
      ...switchbacks(4, 210, [19, 33], 0.05),
      ...flowing(3, 2),
      { kind: 'crest', length: 65, height: 5 },
      ...flowing(2, 4),
      { kind: 'straight', length: 260, grade: -0.05 },
      { kind: 'straight', length: 240 },
    ],
  },
];

export function stageById(id: string): StageDef | undefined {
  return STAGES.find((s) => s.id === id);
}

export { KM };
