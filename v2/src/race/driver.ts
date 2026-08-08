/* A driver that can actually get down a stage.
 *
 * This started life inside the smoke test, as a crash-test dummy whose only job
 * was to prove the car was drivable at all. It earned promotion: the same
 * controller, given a skill level, is the rival. Keeping one implementation
 * means the thing the tests exercise is the thing that ships.
 *
 * Pure pursuit with corner anticipation:
 *   - track position along the centreline with a monotonic cursor
 *   - steer at a lookahead point that moves further out with speed
 *   - set a target speed from the TIGHTEST corner grade in the next ~100 m,
 *     not the grade underneath the lookahead point
 *
 * That last part is the difference between a driver and a passenger. Reading
 * the grade at a single point ahead means arriving at a hairpin still seeing
 * the straight before it, which is exactly how the first version kept putting
 * the car into the scenery.
 */
import { CORNER_GRADES } from '../../../spec/rally.constants.ts';
import type { Corridor, Segment } from '../world/corridor.ts';
import type { DriverInput } from '../physics/vehicle.ts';

export interface DriverState {
  /** Index of the nearest centreline segment. Monotonic, so the driver cannot
   *  be teleported backwards by a hairpin that passes close to itself. */
  cursor: number;
  /** Metres along the centreline. */
  distance: number;
  /** Signed offset from the centreline, metres. */
  lateral: number;
}

/** Entry speeds per §1.3, in m/s, indexed by grade. The table gives km/h ranges
 *  per grade; the midpoint is what a driver aims for. */
const GRADE_SPEED: Record<number, number> = (() => {
  const out: Record<number, number> = {};
  for (const g of CORNER_GRADES) {
    const [lo, hi] = g.entrySpeedKmh;
    out[g.grade] = ((lo + Math.min(hi, 200)) / 2) / 3.6;
  }
  return out;
})();

export class RoadDriver {
  readonly state: DriverState = { cursor: 0, distance: 0, lateral: 0 };

  /**
   * @param skill 0..1. Scales target speed and how late the driver brakes.
   *              0.75 is a rival you can beat; 1.0 is close to the limit.
   * @param line  Lateral offset the driver aims for, metres. Giving the rival a
   *              non-zero line keeps it out of the player's way on the start
   *              straight instead of fighting for the same piece of road.
   */
  constructor(
    private readonly corridor: Corridor,
    public skill = 0.8,
    public line = 0,
  ) {}

  /** Update the cursor from a world position. Searches forward only, over a
   *  window, so it costs nothing per frame and cannot jump to a different part
   *  of the stage that happens to be nearby. */
  locate(px: number, pz: number): DriverState {
    const segs = this.corridor.segments;
    let best = Infinity;
    let bestI = this.state.cursor;
    // Look a little behind as well, so a spin or a reversal recovers.
    const from = Math.max(0, this.state.cursor - 12);
    const to = Math.min(segs.length, this.state.cursor + 140);
    for (let i = from; i < to; i++) {
      const d = (segs[i]!.x - px) ** 2 + (segs[i]!.z - pz) ** 2;
      if (d < best) { best = d; bestI = i; }
    }
    const s = segs[bestI]!;
    this.state.cursor = bestI;
    this.state.distance = s.distance;
    this.state.lateral = (px - s.x) * -s.hz + (pz - s.z) * s.hx;
    return this.state;
  }

  /** Tightest corner grade within `metres` ahead. */
  private gradeAhead(metres: number): number {
    const segs = this.corridor.segments;
    const n = Math.round(metres / this.corridor.step);
    let worst = 6;
    for (let i = this.state.cursor; i < Math.min(segs.length, this.state.cursor + n); i++) {
      if (segs[i]!.cornerGrade < worst) worst = segs[i]!.cornerGrade;
    }
    return worst;
  }

  /** One control decision. */
  drive(px: number, pz: number, headingX: number, headingZ: number, speedMs: number): DriverInput {
    const segs = this.corridor.segments;
    this.locate(px, pz);

    // Lookahead grows with speed: a fixed distance oversteers at 40 m/s and
    // wanders at 10.
    const ahead = Math.round(6 + speedMs * 1.1);
    const look: Segment = segs[Math.min(segs.length - 1, this.state.cursor + ahead)]!;
    // Aim at the driver's line, not the centreline.
    const tx = look.x + -look.hz * this.line;
    const tz = look.z + look.hx * this.line;

    const dx = tx - px;
    const dz = tz - pz;
    const len = Math.hypot(dx, dz) || 1;
    const cross = (headingX * dz - headingZ * dx) / len;
    const steer = Math.max(-1, Math.min(1, cross * 1.7));

    // Braking distance scales with the square of the overspeed, which is why a
    // fixed lookahead never works: at 40 m/s a hairpin needs ~120 m of warning.
    const horizon = Math.max(40, speedMs * speedMs * 0.05);
    const target = (GRADE_SPEED[this.gradeAhead(horizon)] ?? 30) * (0.55 + 0.45 * this.skill);

    return {
      steer,
      throttle: speedMs < target ? 1 : 0,
      brake: speedMs > target * 1.15 ? Math.min(1, (speedMs / target - 1) * 3) : 0,
      handbrake: false,
    };
  }
}
