/* THE RALLY — progression across stages.
 *
 * Six stages exist and each one has been a separate, forgetful event: drive it,
 * see a time, reload the page. Nothing carried. That is a stage demo, not a
 * rally, and it wastes the two systems that make consecutive stages mean
 * something — the damage model, and the penalties.
 *
 * §11.2.6 is the whole design: **"Damage is not repaired by a reset. Only a
 * service park repairs damage."** That single line implies everything here.
 * Damage must survive the end of a stage, or the sentence has no content. If it
 * survives, there has to be somewhere it stops surviving, and the spec names
 * it. And if damage accumulates across an itinerary, then §9's terminal band is
 * no longer an abstract ceiling — it is retirement from the rally.
 *
 * So a rally is: an ordered itinerary, a running classification that includes
 * every §11 penalty, damage carried from stage to stage, a service park in the
 * middle that repairs it, and a terminal-damage retirement. Nothing here is a
 * new mechanic; it is the existing ones given somewhere to accumulate.
 *
 * This module is pure state. It does not know what a car is.
 */
import { DAMAGE_ENERGY_BANDS_J } from '../../../spec/rally.constants.ts';

/** §9: the top of the "major" band. Beyond it the car is terminal. */
export const TERMINAL_DAMAGE_J =
  DAMAGE_ENERGY_BANDS_J[DAMAGE_ENERGY_BANDS_J.length - 2]!.max;

export interface RallyLeg {
  stageId: string;
  /** True if a service park sits BEFORE this leg. §11.2.6's only repair. */
  service: boolean;
}

export interface LegResult {
  stageId: string;
  /** Seconds of driving. */
  raw: number;
  /** Seconds of §11 penalties. */
  penalty: number;
  resets: number;
  cuts: number;
  /** Cumulative impact energy carried out of this leg, joules. */
  damageJ: number;
}

export interface RallyState {
  /** Index of the leg to drive next. Equal to the itinerary length when the
   *  rally is complete. */
  leg: number;
  results: LegResult[];
  /** Damage carried INTO the next leg. */
  damageJ: number;
  retired: boolean;
}

/**
 * The itinerary.
 *
 * Order is a rally organiser's decision, not the spec's, and it is made on one
 * principle: the two stages the car is most likely to be destroyed on should
 * not both fall on the same side of the service park. Col de Turini and Monte
 * Carlo are the switchback stages; they sit either side of it.
 */
export const ITINERARY: RallyLeg[] = [
  { stageId: 'ouninpohja', service: false },
  { stageId: 'col-de-turini', service: false },
  { stageId: 'fafe', service: false },
  { stageId: 'monte-carlo', service: true },
  { stageId: 'safari', service: false },
  { stageId: 'sweet-lamb', service: false },
];

const KEY = 'ignite-v2-rally';

export function emptyRally(): RallyState {
  return { leg: 0, results: [], damageJ: 0, retired: false };
}

/** Load, defensively. A corrupt store must start a new rally, never throw:
 *  the same rule the personal best follows, for the same reason. */
export function loadRally(): RallyState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyRally();
    const v = JSON.parse(raw) as RallyState;
    if (typeof v?.leg !== 'number' || !Array.isArray(v.results)) return emptyRally();
    return {
      leg: Math.max(0, Math.min(ITINERARY.length, Math.floor(v.leg))),
      results: v.results.filter((r) => r && typeof r.raw === 'number'),
      damageJ: Number.isFinite(v.damageJ) ? Math.max(0, v.damageJ) : 0,
      retired: v.retired === true,
    };
  } catch {
    return emptyRally();
  }
}

export function saveRally(state: RallyState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch { /* private mode, quota — never worth failing a rally over */ }
}

/**
 * Finish a leg.
 *
 * Returns a NEW state rather than mutating, so a caller can show "this is what
 * that stage cost you" beside "this is where you are" without having to keep a
 * copy of the old one.
 */
export function completeLeg(state: RallyState, result: LegResult): RallyState {
  if (state.retired || state.leg >= ITINERARY.length) return state;
  const results = [...state.results, result];
  const leg = state.leg + 1;
  // §9: past the major band, the car does not start the next stage.
  const retired = result.damageJ >= TERMINAL_DAMAGE_J;
  // §11.2.6: the service park before the NEXT leg is what repairs it — so the
  // repair happens on arrival at that leg, not on leaving this one. A car that
  // retires does not reach the service park.
  const repaired = !retired && ITINERARY[leg]?.service === true;
  return { leg, results, damageJ: repaired ? 0 : result.damageJ, retired };
}

/** Total classification: driving plus every penalty, over every leg driven. */
export function classification(state: RallyState): number {
  return state.results.reduce((a, r) => a + r.raw + r.penalty, 0);
}

/** Which stages the player may start. Everything up to and including the leg
 *  they are on: a rally is an order, but re-driving a stage you have reached is
 *  practice, not a cheat — the classification only counts the legs as run. */
export function unlocked(state: RallyState): Set<string> {
  const out = new Set<string>();
  for (let i = 0; i <= Math.min(state.leg, ITINERARY.length - 1); i++) {
    out.add(ITINERARY[i]!.stageId);
  }
  return out;
}

export function legFor(stageId: string): number {
  return ITINERARY.findIndex((l) => l.stageId === stageId);
}

export function isComplete(state: RallyState): boolean {
  return state.leg >= ITINERARY.length;
}

/** §9's own vocabulary for how bent the car is, for the itinerary screen. */
export function damageClass(damageJ: number): string {
  return DAMAGE_ENERGY_BANDS_J.find((b) => damageJ <= b.max)!.klass;
}
