/* §11 — RESET, PENALTIES, BOUNDARIES.
 *
 * Everything in this file is specified. §11.1 gives six triggers with their
 * delays, §11.2 gives six rules for what a reset does, §11.3 defines a cut and
 * its penalty, and §15 L12 requires a reset node at least every 120 m. Until
 * now v2 had a single hand-written recovery that put the car back two segments
 * ahead of wherever it stopped — which is not in the spec, is not fair (it can
 * gain you ground), and has no cost.
 *
 * The one thing here that is NOT the spec's is the meaning of "collision
 * immunity" in §11.2.4. Taken literally it would mean the car passes through
 * scenery for 2.5 s, which turns a reset into a shortcut through a forest. It
 * is implemented as DAMAGE immunity: the car still collides, but the joules do
 * not count. That is the reading that protects a player from being destroyed by
 * the wreck they were just recovered from, without handing them a wall pass.
 */
import { RESET, CUTTING, STAGE_LINT } from '../../../spec/rally.constants.ts';
import type { Corridor, Segment } from '../world/corridor.ts';

export interface ResetNode {
  /** Index into the corridor's segments. */
  index: number;
  /** Metres along the centreline. */
  distance: number;
  x: number;
  z: number;
  /** Radians, in the vehicle's yaw convention: atan2(hx, hz). */
  heading: number;
}

/**
 * Reset nodes, at most `RESET.nodeSpacingMax` apart (§11.2.1, L12).
 *
 * They are not laid down every 120 m regardless of what is there. A node in the
 * middle of a hairpin respawns the car pointing at the apex with no run-up,
 * which is a worse place to restart than 30 m earlier on the approach. So each
 * node is the STRAIGHTEST segment in the window that keeps the spacing legal —
 * the search window is trimmed to the spacing limit, so the rule is never
 * traded away for a nicer node.
 */
export function buildResetNodes(corridor: Corridor): ResetNode[] {
  const segs = corridor.segments;
  const maxGap = RESET.nodeSpacingMax;
  const nodes: ResetNode[] = [node(segs[0]!)];

  while (true) {
    const from = nodes[nodes.length - 1]!;
    const last = segs[segs.length - 1]!;
    if (last.distance - from.distance <= maxGap) break;

    // Candidates: everything from just past the previous node out to the limit.
    // Prefer the flattest — the largest corner radius — and among equals the
    // furthest along, so nodes do not bunch up at the start of every straight.
    let best = from.index + 1;
    let bestScore = -Infinity;
    for (let i = from.index + 1; i < segs.length; i++) {
      const gap = segs[i]!.distance - from.distance;
      if (gap > maxGap) break;
      const s = segs[i]!;
      // Flatness dominates; position breaks ties. A straight scores 1.0 and a
      // 20 m hairpin scores 0.1, so a node will move up to a hundred metres to
      // get out of a hairpin but will not skip a straight to reach a better one.
      const flat = Math.min(1, (Number.isFinite(s.cornerRadius) ? s.cornerRadius : 400) / 200);
      const score = flat + (gap / maxGap) * 0.35;
      if (score >= bestScore) { bestScore = score; best = i; }
    }
    nodes.push(node(segs[best]!));
  }

  // The finish is a node too. Without it the last stretch of a stage can be up
  // to 120 m from the nearest upstream node, which is legal but mean.
  const last = segs[segs.length - 1]!;
  if (last.distance - nodes[nodes.length - 1]!.distance > 1) nodes.push(node(last));
  return nodes;
}

function node(s: Segment): ResetNode {
  return { index: s.index, distance: s.distance, x: s.x, z: s.z, heading: Math.atan2(s.hx, s.hz) };
}

/**
 * §11.2.1: "Respawn at the nearest upstream centreline node that the car
 * legitimately passed."
 *
 * Upstream, not nearest: a car that has just fallen off the outside of a corner
 * is often physically closest to a node it has not reached, and putting it
 * there would be a shortcut. `passed` is the driver's monotonic distance, which
 * is what makes "legitimately" true — it cannot be advanced by a car being
 * thrown down the mountain.
 */
export function nodeFor(nodes: ResetNode[], passed: number): ResetNode {
  let out = nodes[0]!;
  for (const n of nodes) {
    if (n.distance <= passed) out = n; else break;
  }
  return out;
}

/** §11.1, with the spec's own delays. */
export type ResetTrigger = 'roof' | 'outOfBounds' | 'offDeck' | 'stuck' | 'player';

export const RESET_DELAY: Record<ResetTrigger, number> = {
  roof: RESET.onRoofDelay,
  outOfBounds: RESET.outOfBoundsDelay,
  offDeck: RESET.offDeckDelay,
  stuck: RESET.stuckDelay,
  player: RESET.playerRequestedDelay,
};

/**
 * The state machine for one car: which trigger is active, how long it has been
 * active, and whether that is long enough yet.
 *
 * Holding a timer per trigger rather than one shared timer matters: a car on
 * its roof at the bottom of a ravine is both `roof` (2.5 s) and `offDeck`
 * (2.0 s), and the right answer is the first one to ripen, not whichever was
 * noticed first.
 */
export class ResetMonitor {
  private held: Record<ResetTrigger, number> = {
    roof: 0, outOfBounds: 0, offDeck: 0, stuck: 0, player: 0,
  };
  /** Seconds of §11.2.4 immunity remaining. */
  immunity = 0;
  /** Total §11.2.5 time penalty accumulated, seconds. */
  penaltySeconds = 0;
  /** How many resets have been served. */
  count = 0;

  /**
   * @param active which triggers are true this step
   * @returns the trigger that has now been held long enough, or null
   */
  update(dt: number, active: Partial<Record<ResetTrigger, boolean>>): ResetTrigger | null {
    let due: ResetTrigger | null = null;
    let worstOverrun = 0;
    for (const key of Object.keys(this.held) as ResetTrigger[]) {
      if (!active[key]) { this.held[key] = 0; continue; }
      this.held[key] += dt;
      const over = this.held[key] - RESET_DELAY[key];
      if (over >= 0 && over >= worstOverrun) { worstOverrun = over; due = key; }
    }
    if (this.immunity > 0) this.immunity = Math.max(0, this.immunity - dt);
    return due;
  }

  /** Record that a reset happened: clear the timers, start the immunity, and
   *  take the §11.2.5 penalty. */
  serve(mode: keyof typeof RESET.penaltySeconds = 'standard'): void {
    for (const key of Object.keys(this.held) as ResetTrigger[]) this.held[key] = 0;
    this.immunity = RESET.immunitySeconds;
    this.penaltySeconds += RESET.penaltySeconds[mode];
    this.count++;
  }

  /** §11.2.4: immunity "ending early on first throttle input". */
  onThrottle(): void {
    this.immunity = 0;
  }
}

/**
 * §11.3 — cutting.
 *
 * "A cut is registered when three or more wheels leave the corridor for more
 *  than 1.2 s and the exit point is later on the centreline than the entry
 *  point." The second half is the part that makes it a cut rather than a
 * mistake: a car that runs wide, stops and rejoins behind itself has not gained
 * anything and is not penalised.
 *
 * The corridor for this purpose is roadbed PLUS shoulder, per §11.3's first
 * line — not the roadbed alone, which would penalise every normal wide entry.
 */
export class CutMonitor {
  private outFor = 0;
  private entryDistance = 0;
  private counted = false;
  /** Cuts registered this stage. */
  cuts = 0;
  /** Total penalty from cuts, seconds. */
  penaltySeconds = 0;
  /** Set for a moment when a cut is registered, for the HUD. */
  justCut = false;

  update(dt: number, wheelsOutside: number, distance: number): void {
    this.justCut = false;
    if (wheelsOutside < CUTTING.wheelsOffThreshold) {
      // Rejoined. Decide whether the excursion was a cut.
      if (this.outFor > CUTTING.durationThreshold && !this.counted && distance > this.entryDistance) {
        this.register();
      }
      this.outFor = 0;
      this.counted = false;
      return;
    }
    if (this.outFor === 0) this.entryDistance = distance;
    this.outFor += dt;
    // A long excursion counts as soon as it has clearly gained ground, rather
    // than waiting for a rejoin that may never come.
    if (!this.counted && this.outFor > CUTTING.durationThreshold && distance > this.entryDistance + 5) {
      this.register();
      this.counted = true;
    }
  }

  private register(): void {
    this.cuts++;
    // "2 s per cut, escalating to 5 s on the third cut in one stage."
    this.penaltySeconds += this.cuts >= 3 ? CUTTING.penaltyThird : CUTTING.penaltyFirst;
    this.justCut = true;
  }
}

/** L12, as a function, so the lint and the tests ask the same question. */
export function worstNodeGap(nodes: ResetNode[]): number {
  let worst = 0;
  for (let i = 1; i < nodes.length; i++) {
    worst = Math.max(worst, nodes[i]!.distance - nodes[i - 1]!.distance);
  }
  return worst;
}

export const NODE_SPACING_MAX = STAGE_LINT.resetNodeSpacingMax;
