/* A driver that can actually get down a stage.
 *
 * This started life inside the smoke test, as a crash-test dummy whose only job
 * was to prove the car was drivable at all. It earned promotion: the same
 * controller, given a skill level, is the rival. Keeping one implementation
 * means the thing the tests exercise is the thing that ships.
 *
 * Phase 3 replaced what it steers at and what it aims to be doing:
 *
 *   - it follows the RACING LINE (`race/line.ts`), not the centreline plus a
 *     fixed offset;
 *   - its target speed is that line's speed profile, which already knows where
 *     braking has to start, instead of the midpoint of a §1.3 grade band read
 *     out of a fixed horizon ahead;
 *   - it steers by the pure-pursuit geometric law, and divides by the
 *     speed-sensitive steering factor the car itself applies (§4), because a
 *     driver who does not know their own steering rack understeers at speed and
 *     saws at it in a hairpin.
 *
 * The old version's braking model was "if the tightest grade within
 * v² × 0.05 m is slower than now, brake". Every part of that was an
 * approximation of something the speed profile computes exactly.
 */
import { SIM, STEERING, SURFACES, VEHICLE } from '../../../spec/rally.constants.ts';
import type { Corridor, Segment } from '../world/corridor.ts';
import type { DriverInput } from '../physics/vehicle.ts';
import { buildRacingLine, type RacingLine } from './line.ts';

export interface DriverState {
  /** Index of the nearest centreline segment. Monotonic, so the driver cannot
   *  be teleported backwards by a hairpin that passes close to itself. */
  cursor: number;
  /** Metres along the centreline. */
  distance: number;
  /** Signed offset from the centreline, metres. */
  lateral: number;
}

export interface DriverOptions {
  /** The line to drive. Built from the corridor if not supplied — but a stage
   *  already has one, and building a second costs a relaxation pass. */
  line?: RacingLine;
  /** Metres of extra offset held at the start and faded out over the first
   *  `biasFade` metres. This is how the rival stays off the player's door on
   *  the start straight without spending the whole stage off the line. */
  bias?: number;
  biasFade?: number;
}

/**
 * Understeer gradient: extra steering angle per unit of lateral acceleration,
 * rad per m/s². A kinematic model says a car needs L/R of lock to hold a radius
 * R; a real one needs more, because the front tyres are running at a slip angle
 * and the rears at a smaller one. 0.0035 rad per m/s² is about 2 degrees per g,
 * which is the middle of the range for a car with §3's weight distribution.
 *
 * It is a property of the CAR, so it does not scale with skill: a slow driver
 * turns the wheel just as far, they simply arrive slower.
 */
const UNDERSTEER_RAD_PER_MS2 = 0.0035;

/** How hard the pure-pursuit correction pulls back to the line. 1.0 is the
 *  textbook law and tracks a metre wide at rally speeds; 2.4 holds the line
 *  without the sawing that starts somewhere above 3. */
const PURSUIT_GAIN = 2.4;

export class RoadDriver {
  readonly state: DriverState = { cursor: 0, distance: 0, lateral: 0 };
  readonly line: RacingLine;
  private readonly bias: number;
  private readonly biasFade: number;

  /**
   * @param skill 0..1. Scales the fraction of the line's speed profile the
   *              driver is willing to use. 0.78 is a rival you can beat; 1.0
   *              is the reference lap.
   */
  constructor(
    private readonly corridor: Corridor,
    public skill = 0.8,
    opts: DriverOptions = {},
  ) {
    this.line = opts.line ?? buildRacingLine(corridor);
    this.bias = opts.bias ?? 0;
    this.biasFade = opts.biasFade ?? 120;
  }

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

  /** Signed curvature of the line at a segment, 1/m. Positive turns right. */
  lineCurvature(i: number): number {
    const k = Math.max(0, Math.min(this.line.curvature.length - 1, i));
    return this.line.curvature[k]!;
  }

  /** How fast the driver wants to be going at a segment, m/s. */
  targetSpeed(i: number): number {
    const k = Math.max(0, Math.min(this.line.speed.length - 1, i));
    // A driver at skill 1.0 aims at the profile itself; below that, at a
    // fraction of it. The floor keeps a low-skill driver moving through a
    // hairpin rather than stopping in it.
    return Math.max(6, this.line.speed[k]! * (0.62 + 0.38 * this.skill));
  }

  /** One control decision. */
  drive(px: number, pz: number, headingX: number, headingZ: number, speedMs: number): DriverInput {
    const segs = this.corridor.segments;
    this.locate(px, pz);
    const step = this.corridor.step;

    // Lookahead: the pure-pursuit gain. Too short and the car saws at speed;
    // too long and it cuts the apex off every corner. Speed-proportional with a
    // floor is the standard answer, and the floor is what makes a hairpin work.
    const lookMetres = Math.max(6, Math.min(30, 3.5 + speedMs * 0.5));
    const ahead = Math.max(2, Math.round(lookMetres / step));
    const i = Math.min(segs.length - 1, this.state.cursor + ahead);
    const seg: Segment = segs[i]!;

    // Aim at the line, plus whatever start-bias has not yet faded out.
    const fade = Math.max(0, 1 - this.state.distance / this.biasFade);
    const offset = this.line.offset[i]! + this.bias * fade;
    const tx = seg.x + -seg.hz * offset;
    const tz = seg.z + seg.hx * offset;

    // --- steering: feed-forward on the corner, feedback on the error --------
    //
    // Pure pursuit ALONE does not steer this car. Measured on Ouninpohja's
    // first fast corner: the geometric law asks for 0.07 of lock where the
    // corner needs about 0.13, so the car ran wide, off the road, and into the
    // trees — while still under its target speed, which is what made the cause
    // obvious. The law is not wrong; it is a KINEMATIC law, and it describes a
    // car whose tyres do not slip. A real one needs the kinematic angle PLUS
    // the understeer the tyres add, which grows with lateral acceleration.
    //
    // So the command is built from two parts, which is how a driver's hands
    // work anyway:
    //   feed-forward — the angle this corner needs at this speed, known before
    //                  any error has happened;
    //   feedback     — pure pursuit, correcting what the feed-forward missed.
    const kappa = this.lineCurvature(this.state.cursor + Math.round(Math.max(4, speedMs * 0.35) / step));
    const ay = kappa * speedMs * speedMs;
    const deltaFF = VEHICLE.wheelbase * kappa + UNDERSTEER_RAD_PER_MS2 * ay;

    const dx = tx - px;
    const dz = tz - pz;
    const ld = Math.hypot(dx, dz) || 1;
    const sinAlpha = (headingX * dz - headingZ * dx) / ld;
    const cosAlpha = (headingX * dx + headingZ * dz) / ld;
    const deltaFB = PURSUIT_GAIN * Math.atan2(2 * VEHICLE.wheelbase * sinAlpha, ld);

    // §4: the car scales steering input by speed before it reaches the rack, so
    // a driver asking for an angle has to ask for more of it at speed. Without
    // this the AI cannot generate the lock a fast corner needs — it commands
    // 1.0 and receives 0.45.
    const maxLock =
      ((this.corridor.surface === 'tarmac' ? STEERING.maxLockTarmacDeg : STEERING.maxLockGravelDeg) *
        Math.PI) / 180;
    const speedFactor =
      1 - STEERING.speedSensitiveFactor * Math.min(1, speedMs / STEERING.speedSensitiveReference);

    // NEVER ASK FOR MORE LOCK THAN THE TYRE CAN USE.
    //
    // This is the single most important line in the controller, and it took a
    // trace to find. The angle that generates peak lateral acceleration is
    // L·a/v² plus the understeer the tyres add; beyond it the front slip angle
    // is past the Magic Formula's peak and MORE steering produces LESS grip.
    // Without the cap, a small drift at 135 km/h made the driver wind on half a
    // turn, the front washed out, and the correction became the accident. With
    // it, the same drift is answered by the largest correction physics allows
    // and no more — which is what separates a driver from a passenger holding
    // the wheel.
    const ayMax = (SURFACES[seg.surfaceId]?.muLat ?? 0.7) * Math.abs(SIM.gravity);
    const deltaMax =
      (VEHICLE.wheelbase * ayMax) / Math.max(4, speedMs * speedMs) + UNDERSTEER_RAD_PER_MS2 * ayMax;
    const delta = Math.max(-deltaMax, Math.min(deltaMax, deltaFF + deltaFB));
    let steer = Math.max(-1, Math.min(1, delta / (maxLock * speedFactor)));

    // Facing the wrong way — after a spin, or on the way out of a reset. Pure
    // pursuit gives a sensible answer here too (full lock), but the throttle
    // must not: accelerating hard while pointing backwards is how the old
    // driver turned a spin into a trip into the trees.
    const wrongWay = cosAlpha < 0.0;
    if (wrongWay) steer = Math.sign(sinAlpha || 1);

    // --- speed, from the profile -------------------------------------------
    // Preview: aim at the SLOWEST point the car will reach within its own
    // reaction distance. The profile already contains the braking curve, so
    // this only covers the step between decisions, not the corner ahead.
    const preview = Math.max(1, Math.round((speedMs * 0.45) / step));
    let target = Infinity;
    for (let k = this.state.cursor; k <= this.state.cursor + preview; k++) {
      target = Math.min(target, this.targetSpeed(k));
    }

    // OFF THE LINE, SLOW DOWN. The profile answers "how fast can I go through
    // this corner ON the line" and says nothing about being three metres wide
    // of it — where the corner you are actually driving is tighter, the surface
    // is shoulder rather than roadbed, and the trees are close.
    //
    // Without this the driver ran wide out of a snow hairpin on Monte Carlo,
    // held its target speed of 52 km/h all the way across the road because the
    // profile still said 52 was fine, and hit a tree 4 m off the line at 382 m.
    // The steering was already saturated at the friction limit; nothing about
    // it was recoverable at that speed. Lifting is the only control left.
    const lineError = Math.abs(this.state.lateral - this.line.offset[this.state.cursor]!);
    const room = Math.max(1, segs[this.state.cursor]!.roadbedWidth / 2);
    target *= Math.max(0.35, Math.min(1, 1 - (lineError / room - 0.5) * 0.55));

    if (wrongWay) target = Math.min(target, 8);

    // Proportional either side of the target, with a deliberate asymmetry: a
    // driver lifts gently and brakes hard. `over` is a ratio rather than a
    // difference so the same gain works at 12 m/s and at 45.
    const over = speedMs / Math.max(1, target);
    let throttle = speedMs < target ? Math.min(1, (target - speedMs) * 0.6 + 0.25) : 0;
    const brake = over > 1.02 ? Math.min(1, (over - 1.02) * 5) : 0;

    // §8's friction ellipse, applied by the driver rather than discovered by
    // the tyre. Grip spent turning is not available for accelerating, so the
    // throttle comes out in proportion to what the steering is already using.
    // Measured before this: 63% of the friction budget on throttle alone at
    // 135 km/h, which left nothing for the correction the driver was
    // simultaneously asking for.
    const lateralUse = Math.min(1, Math.abs(delta) / Math.max(1e-6, deltaMax));
    throttle *= Math.sqrt(Math.max(0.05, 1 - lateralUse * lateralUse));

    // Pointing the wrong way: scrub the speed off first, then turn round.
    // Driving out of a spin on the throttle is how a spin becomes a crash, and
    // the old version did exactly that — full throttle, facing backwards.
    //
    // It does NOT brake to a standstill. The first version did, and it cost
    // clean runs on Ouninpohja and Safari: a car stopped in the road for four
    // seconds is "stuck" by the recovery rule, so a spin the driver would have
    // caught became a counted reset instead.
    if (wrongWay && speedMs > 6) return { steer, throttle: 0, brake: 0.7, handbrake: false };

    return { steer, throttle, brake, handbrake: false };
  }
}
