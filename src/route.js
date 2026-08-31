/* RALLY_CORRIDOR_REFACTOR v2.0 — the ROUTE.
 *
 * "The world MUST stay drivable... The race is a list of gates through it."
 * Three things that used to be one thing come apart here: the WORLD (terrain,
 * all of it drivable), the ROUTE (this file: an ordered list of gates that
 * defines what counts as racing), and the ROAD (a fast surface — the best
 * line most of the time, never the only line).
 *
 * BUILD ORDER STEP 1 (§16): gate data, per-stage layouts, telemetry —
 * and NO RULE CHANGES. The route runs in SHADOW MODE: it observes every car,
 * logs gate passes and misses, and decides nothing. Laps are still counted by
 * the old checkpoint mask until step 4 hands the job over. R1/R2 gate this
 * step in tests/test-route.mjs.
 */
import { ROAD_HALF } from './track.js';
import { DRIVING } from './driving.js';

/* §13 stage layouts — section-kind SEQUENCES per lap, in lap order starting
 * at the start/finish line. Step 1 distributes them EVENLY along the spline;
 * step 3 re-authors the three named stages against their real features (the
 * bridge, the gantry, the narrows, the village). Counts are the table's:
 * Canyon Run 3 street + 4 trail + 5 open, Glacier Col 4+6+2, Il Budello
 * 5+3+1 — and every sequence obeys the §4.2 pacing rule (≤3 consecutive
 * street, ≤2 consecutive open, at least one of each kind per lap). */
const LAYOUTS = {
  4:  ['street', 'open', 'open', 'trail', 'open', 'trail', 'street', 'trail',
    'open', 'trail', 'open', 'street'],                       // CANYON RUN
  66: ['street', 'street', 'trail', 'trail', 'open', 'trail', 'street',
    'trail', 'trail', 'open', 'trail', 'street'],             // GLACIER COL
  74: ['street', 'street', 'street', 'trail', 'open', 'trail', 'street',
    'trail', 'street'],                                       // IL BUDELLO
};
// every other stage gets a derived default until it is authored: mostly
// trail, the line at the gantry a street gate, two opens for breathing room
const DEFAULT_LAYOUT = ['street', 'trail', 'trail', 'open', 'trail',
  'trail', 'open', 'trail', 'trail', 'street'];

/* §6 PROP CLASSES — every placed prop answers to one of three words.
 * This is the classifier the validator test and the density pass share;
 * the mass table maps onto what the engine already stores:
 *   smash    — yields on contact, 0 hull, scored. Saplings, cacti, snags
 *              (tree records that yield), plus crates/cones/barrels/tire
 *              stacks/hay, which ride the props system.
 *   shove    — pushed aside, 0 hull, no score. Knockable stones under the
 *              shove radius (the engine's mass class is radius).
 *   obstacle — static, pays the fix-2 contact law. Grown trees, boulders,
 *              huts, metal posts, everything with a wall's job.
 */
export function propClassOf(p) {
  if (p.parts || p.kind !== undefined || p.s !== undefined) {   // a tree record
    const grown = (p.s ?? 1) >= 1.0 && p.kind !== 'cactus' && p.kind !== 'snag';
    return (p.solid === true || grown) ? 'obstacle' : 'smash';
  }
  if (p.mat === 'stone') {
    const shoveR = DRIVING.patch02b?.propShoveRadiusU ?? 1.15;
    return (p.r ?? 9) < shoveR ? 'shove' : 'obstacle';
  }
  return 'obstacle';                                            // metal, hut, cliff
}

export class Route {
  constructor(track, levelId) {
    this.track = track;
    const R = DRIVING.route ?? {};
    const kinds = LAYOUTS[levelId] ?? DEFAULT_LAYOUT;
    const N = track.center.length;
    this.gates = kinds.map((kind, i) => {
      const si = Math.round((i * N) / kinds.length) % N;
      const c = track.center[si], t = track.tan[si], n = track.nrm[si];
      const roadHalf = track.widthAt?.(si) ?? ROAD_HALF;
      const halfWidth = kind === 'street' ? roadHalf + (R.streetPadM ?? 2)
        : kind === 'trail' ? roadHalf + (R.trailPadM ?? 12)
          : (R.openMinHalfWidthM ?? 30);
      return {
        id: i, kind, si, halfWidth,
        x: c.x, y: c.y, z: c.z,
        hx: t.x, hz: t.z,             // direction of travel through the gate
        nx: n.x, nz: n.z,             // lateral axis for the width test
      };
    });
  }

  /** The SECTION kind at a spline index: the section from gate k to k+1
   *  carries gate k's kind. Before gate 0, the lap's last section wraps. */
  kindAtIndex(i) {
    const gs = this.gates;
    for (let k = gs.length - 1; k >= 0; k--) if (i >= gs[k].si) return gs[k].kind;
    return gs[gs.length - 1].kind;
  }

  /** Arm a car at the grid: gate 0 (the line) is next, nothing crossed. */
  reset(car) {
    car._nextGate = 0;
    car._gateAlong = undefined;
    car._routeLaps = 0;
  }

  /** SHADOW-MODE observation, one car, one frame. Returns null most frames;
   *  {passed, id, lateral, kind} when the car crosses the next gate's plane.
   *  A crossing OUTSIDE halfWidth does not advance — the plane re-arms once
   *  the car is back behind it, so driving back through the gate counts
   *  (§17 R2). Teleports (rescues, placeAt) are ignored via the near-plane
   *  window: only a crossing that starts within 30 u of the plane is real. */
  step(car) {
    const g = this.gates[car._nextGate ?? 0];
    if (!g) return null;
    const dx = car.pos.x - g.x, dz = car.pos.z - g.z;
    const along = dx * g.hx + dz * g.hz;
    const prev = car._gateAlong;
    car._gateAlong = along;
    if (prev === undefined) return null;
    if (!(prev < 0 && along >= 0)) return null;          // no plane crossing
    if (prev < -30 || along > 30) return null;           // a teleport, not a drive
    if (Math.abs(car.y - g.y) > 10) return null;         // a deck or plateau ABOVE the gate
    const lateral = Math.abs(dx * g.nx + dz * g.nz);
    if (lateral > g.halfWidth) {
      return { passed: false, id: g.id, lateral: +lateral.toFixed(1), kind: g.kind };
    }
    car._nextGate = (g.id + 1) % this.gates.length;
    car._gateAlong = undefined;                          // re-arm on the next gate
    if (car._nextGate === 0) car._routeLaps = (car._routeLaps ?? 0) + 1;
    return { passed: true, id: g.id, lateral: +lateral.toFixed(1), kind: g.kind };
  }

  // CLAUDE.md v1.2 §3.5 (r302): the yellow ribbon is ERASED — mesh, material
  // and opacity loop all deleted, not hidden. The course polyline survives
  // only as this class's DATA (gates, step(), kindAtIndex) for AI, recovery
  // and telemetry. Nothing renders it, and nothing may again.
}
