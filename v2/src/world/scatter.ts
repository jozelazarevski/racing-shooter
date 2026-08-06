/* Deterministic scatter placement — the first consumer of the seeded PRNG.
 *
 * This exists for two reasons.
 *
 * 1. N4 says "the same world, byte for byte". You cannot gate that against a
 *    generator alone; you need something that actually builds a world. This is
 *    the smallest honest one — real placement, real spec rules, real output.
 *
 * 2. It is the pattern every later world pass copies. Take a channel, fork it
 *    by pass name, place, and never touch Math.random. If Phase 1 follows this
 *    shape, determinism holds for free; if it does not, we are back to v1.
 *
 * Spec covered here: §1.2 corridor bands, §3.2 placement rules 1-3, §3.3
 * biome density, §16.1 object schema. Rules 4 (apex occlusion) and 5 (canopy
 * clearance) need a racing line and canopy geometry respectively, and are
 * Phase 1 work — they are listed in DETERMINISM.md as known-absent rather than
 * quietly skipped.
 */
import {
  BIOME_SCATTER_DENSITY,
  FLORA_TIERS,
  FLORA_PLACEMENT,
  CORRIDOR as CORRIDOR_SPEC,
  Tier,
} from '../../../spec/rally.constants.ts';
import type { Rng } from '../core/rng.ts';
import type { StageRng } from '../core/stageRng.ts';

export type Biome = keyof typeof BIOME_SCATTER_DENSITY;
/** The three surfaces §1.2 gives corridor widths for. Spelled out rather than
 *  derived from `keyof typeof CORRIDOR_SPEC`, which also carries the scalar
 *  entries (absoluteMinWidth, sightLineSeconds) that are not surfaces. */
export type SurfaceKind = 'gravel' | 'tarmac' | 'snow';

/** One centreline node. A cut-down §16.2 segment: enough to place scatter
 *  against, no more. The full segment record arrives with Phase 1. */
export interface CorridorNode {
  x: number;
  z: number;
  /** Metres, §1.2. */
  roadbedWidth: number;
  /** Verge width to [left, right]. Tier 3 and 4 are forbidden inside it. */
  shoulderWidth: [number, number];
}

export interface Corridor {
  surface: SurfaceKind;
  biome: Biome;
  nodes: CorridorNode[];
  /** How far past the verge scatter may reach, metres. Beyond this is
   *  backdrop, placed by a different pass at a different density. */
  bandDepth: number;
}

/** §16.1, trimmed to the fields this pass can honestly fill in. */
export interface WorldObject {
  id: string;
  archetype: string;
  tier: Tier;
  transform: { position: [number, number, number]; rotationY: number; scale: number };
  collider: { shape: 'none' | 'capsule' | 'box' | 'cylinder'; radius: number; height: number };
  physics: { mass: number };
  hazard: boolean;
  seedGroup: 'scatter';
}

/** Collider shape per tier, from the §3.1 table. */
const SHAPE: Record<number, WorldObject['collider']['shape']> = {
  0: 'none',
  1: 'capsule',
  2: 'box',
  3: 'cylinder',
  4: 'cylinder',
};

/** Trunk diameter sampled inside the tier's band (§3.1). Tier 4 is open-ended
 *  in the spec; 0.28-0.95 m is the mature-trunk range the bible's silhouettes
 *  assume, and it is stated here rather than hidden in a magic number. */
function trunkDiameter(tierIndex: number, rng: Rng): number {
  const lo = tierIndex === 0 ? 0 : (FLORA_TIERS[tierIndex - 1]!.maxDiameter as number);
  const hi = tierIndex === 4 ? 0.95 : (FLORA_TIERS[tierIndex]!.maxDiameter as number);
  return rng.range(Math.max(lo, 0.02), hi);
}

function massFor(tierIndex: number, rng: Rng): number {
  // Tier 4 is static (mass 0 means "immovable" in the §16.1 schema, not
  // weightless). Tier 3 carries the spec's 180-400 kg range.
  if (tierIndex === 4) return 0;
  if (tierIndex === 3) return Math.round(rng.range(180, 400));
  if (tierIndex === 2) return Math.round(rng.range(20, 70));
  if (tierIndex === 1) return Math.round(rng.range(3, 15));
  return 0;
}

/**
 * Place scatter along a corridor.
 *
 * Determinism notes, because they are the point:
 *
 *  - One fork per tier. Retuning tier-1 bushes cannot move a tier-4 tree, so a
 *    density change shows up as a readable diff instead of a full rebuild.
 *  - Counts use `floor(expected) + chance(fraction)` rather than `round`, so
 *    a density of 0.05 per 100 m² produces the right number of objects across
 *    a long stage instead of rounding to nothing on every segment.
 *  - The spacing check (§3.2 rule 3) rejects and moves on rather than
 *    retrying, because a retry loop makes the draw count depend on how full
 *    the neighbourhood already is, and that couples every object to every
 *    earlier one. Rejection costs a little density near clusters; coupling
 *    would cost reproducibility, which is worth more.
 */
export function scatterCorridor(corridor: Corridor, stage: StageRng): WorldObject[] {
  const density = BIOME_SCATTER_DENSITY[corridor.biome];
  const tier4Clearance = CORRIDOR_SPEC[corridor.surface].tier4Clearance;
  const out: WorldObject[] = [];

  // Trunk positions of every Tier 3/4 object placed so far, for rule 3. A flat
  // array is fine at stage scale; a grid is a Phase 1 optimisation, not a
  // correctness change.
  const trunks: Array<[number, number]> = [];

  for (let tierIndex = 0; tierIndex < 5; tierIndex++) {
    const perHundred = density[tierIndex]!;
    if (perHundred <= 0) continue;
    const rng = stage.scatter.fork(`tier${tierIndex}`);
    const flora = FLORA_TIERS[tierIndex]!;
    const isTrunk = tierIndex >= 3;

    for (let i = 0; i + 1 < corridor.nodes.length; i++) {
      const a = corridor.nodes[i]!;
      const b = corridor.nodes[i + 1]!;
      const dx = b.x - a.x;
      const dz = b.z - a.z;
      const segLen = Math.hypot(dx, dz);
      if (segLen <= 0) continue;
      // Unit normal, pointing left of travel.
      const nx = -dz / segLen;
      const nz = dx / segLen;

      for (let side = 0; side < 2; side++) {
        const sign = side === 0 ? 1 : -1;
        const verge = a.shoulderWidth[side]!;
        const edge = a.roadbedWidth / 2;
        const outer = edge + verge + corridor.bandDepth;

        // §3.2 rules 1 and 2. Tier 3/4 start beyond the verge AND beyond the
        // surface's own tier-4 clearance, whichever is further out. Tiers 0-2
        // may go anywhere outside the roadbed — rule 2 constrains what is
        // ALLOWED inside the verge, it does not confine bushes to it.
        const inner = isTrunk ? edge + Math.max(verge, tier4Clearance) : edge;
        const bandWidth = outer - inner;
        if (bandWidth <= 0) continue;

        // §3.3 is "objects per 100 m² OUTSIDE THE ROADBED" — one area basis
        // for every tier, so the table's ratios survive. Counting each tier
        // against its own narrower band instead would have inverted them:
        // measured, tier 3 (0.8/100 m²) came out at 664 objects against tier
        // 2's 191 (2.0/100 m²), because trunks were credited with the whole
        // 22 m backdrop while bushes got only the 2.4 m verge.
        const area = segLen * (outer - edge);
        const expected = (perHundred * area) / 100;
        let n = Math.floor(expected);
        if (rng.chance(expected - n)) n++;

        for (let k = 0; k < n; k++) {
          const t = rng.float();
          const lateral = inner + rng.float() * bandWidth;
          const px = a.x + dx * t + nx * lateral * sign;
          const pz = a.z + dz * t + nz * lateral * sign;

          if (isTrunk) {
            let tooClose = false;
            for (const [tx, tz] of trunks) {
              if (Math.hypot(px - tx, pz - tz) < FLORA_PLACEMENT.minTrunkSpacing) {
                tooClose = true;
                break;
              }
            }
            // Draw the remaining values regardless of rejection, so that the
            // stream position after this object does not depend on whether it
            // survived. Without this, one extra neighbour shifts every later
            // object on the stage.
            const dia = trunkDiameter(tierIndex, rng);
            const height = rng.range(tierIndex === 4 ? 9 : 5, tierIndex === 4 ? 22 : 11);
            const rot = rng.float() * Math.PI * 2;
            const scale = rng.range(0.85, 1.15);
            const mass = massFor(tierIndex, rng);
            if (tooClose) continue;
            trunks.push([px, pz]);
            out.push({
              id: `${flora.name}_${out.length.toString().padStart(5, '0')}`,
              archetype: flora.name,
              tier: flora.tier,
              transform: { position: [px, 0, pz], rotationY: rot, scale },
              collider: { shape: SHAPE[tierIndex]!, radius: dia / 2, height },
              physics: { mass },
              hazard: tierIndex === 4,
              seedGroup: 'scatter',
            });
          } else {
            const dia = trunkDiameter(tierIndex, rng);
            const height = rng.range(0.2, tierIndex === 2 ? 2.2 : 1.0);
            const rot = rng.float() * Math.PI * 2;
            const scale = rng.range(0.85, 1.15);
            const mass = massFor(tierIndex, rng);
            out.push({
              id: `${flora.name}_${out.length.toString().padStart(5, '0')}`,
              archetype: flora.name,
              tier: flora.tier,
              transform: { position: [px, 0, pz], rotationY: rot, scale },
              collider: { shape: SHAPE[tierIndex]!, radius: dia / 2, height },
              physics: { mass },
              hazard: false,
              seedGroup: 'scatter',
            });
          }
        }
      }
    }
  }

  return out;
}

/** Distance from a point to the corridor centreline, and the roadbed half-width
 *  there. Used by the lint checks; kept next to the placement code so the two
 *  cannot disagree about what "beside the road" means. */
export function distanceToCentreline(
  corridor: Corridor,
  px: number,
  pz: number,
): { distance: number; halfWidth: number; verge: number } {
  let best = Infinity;
  let halfWidth = 0;
  let verge = 0;
  for (let i = 0; i + 1 < corridor.nodes.length; i++) {
    const a = corridor.nodes[i]!;
    const b = corridor.nodes[i + 1]!;
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const len2 = dx * dx + dz * dz;
    if (len2 === 0) continue;
    const t = Math.max(0, Math.min(1, ((px - a.x) * dx + (pz - a.z) * dz) / len2));
    const d = Math.hypot(px - (a.x + dx * t), pz - (a.z + dz * t));
    if (d < best) {
      best = d;
      halfWidth = a.roadbedWidth / 2;
      verge = Math.min(a.shoulderWidth[0], a.shoulderWidth[1]);
    }
  }
  return { distance: best, halfWidth, verge };
}
