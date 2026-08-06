/* THE RACING LINE, and the speed profile that belongs to it.
 *
 * Until now the AI drove the centreline with a fixed lateral offset and picked
 * a target speed from §1.3's grade table — the midpoint of the entry-speed band
 * for the tightest corner within a braking horizon. That is a passenger's model
 * of driving. It has two defects that no amount of gain-tuning fixes:
 *
 *   1. The centreline is not the fast way round a corner. A car on it turns at
 *      the corner's own radius everywhere, which is the tightest path the
 *      corridor allows, so it is grip-limited earlier than it needs to be.
 *   2. A grade band is a range for a whole corner. Reading one number out of it
 *      cannot know that this particular corner opens at the exit, so the driver
 *      stays slow through a section it should already be accelerating out of —
 *      or, worse, carries a G4 speed into the tightening half of a G4 corner.
 *
 * So: build the line as geometry, and derive the speed from the line.
 *
 * The line is a minimum-curvature path inside the roadbed, found by constrained
 * Laplacian relaxation. Each point is repeatedly moved toward the midpoint of
 * its neighbours — which is the discrete statement of "straighten this" — and
 * then clamped back inside the corridor. Where there is room the path
 * straightens; where there is not, it presses against the boundary. That
 * produces out-in-out through a corner without anybody writing out-in-out: the
 * apex is where the clamp binds on the inside, and the entry and exit are where
 * it binds on the outside.
 *
 * The speed profile is the standard three passes over that geometry:
 *   - the lateral friction limit at each point, v = sqrt(mu_lat * g * r)
 *   - a backward pass, so every point is slow enough to still make the corner
 *     after it: v_i <= sqrt(v_{i+1}^2 + 2 * a_brake * ds)
 *   - a forward pass under the same rule with the drive limit, which is
 *     traction at low speed and POWER at high speed: a = min(mu*g, P/(m*v))
 *
 * That backward pass is the part that replaces "brake if the tightest grade in
 * the next 120 m is slower than now". It is not a heuristic with a horizon; it
 * is the exact solution of where you have to be slow, propagated as far back up
 * the stage as the physics requires.
 *
 * Every number here comes from the spec: SURFACES for mu, SIM.gravity for g,
 * VEHICLE for mass, power and track width. The two that do not are marked.
 */
import { SIM, SURFACES, VEHICLE } from '../../../spec/rally.constants.ts';
import type { Corridor, Segment } from '../world/corridor.ts';

export interface RacingLine {
  /** Signed lateral offset from the centreline, metres, one per segment.
   *  Positive is the +normal side — the driver's right. */
  offset: Float64Array;
  /** World position of the line at each segment. */
  px: Float64Array;
  pz: Float64Array;
  /** Signed curvature, 1/m. Positive turns right, matching `offset`. */
  curvature: Float64Array;
  /** How fast a car at the friction limit can be going here, m/s. */
  speed: Float64Array;
  /** Distance along the LINE, metres — a little longer than the centreline
   *  through the corners and a little shorter through the apexes. */
  distance: Float64Array;
  /** The clamp that produced the line, metres either side. Exposed because the
   *  lint and the tests check the line against it rather than against a
   *  constant written twice. */
  limit: Float64Array;
}

/** Half the car, plus the margin it wants between a wheel and the edge of the
 *  road. Not in the spec: the spec says how wide the road is, not how close to
 *  its edge a driver should aim. 0.25 m is a car's width of hesitation. */
const EDGE_MARGIN = 0.25;

/**
 * How much of the friction circle the reference line spends.
 *
 * A real driver does not sit at exactly 100% of the tyre's peak, and neither
 * does the tyre model: §8's Magic Formula peak is at a slip angle the car only
 * reaches while sliding.
 *
 * 0.92 measured best over six reference laps, and the measurement is worth
 * recording because it is NOT monotonic. Dropping it to 0.75 made Monte Carlo
 * far better (15 recoveries to 3) and Col de Turini far worse (DNF at 1.25 km
 * against 2.26 km); 0.85 was worse than either. A slower car still beaches at a
 * hairpin it cannot steer round, so the stages that still fail are not failing
 * on this number.
 */
const LIMIT_FRACTION = 0.92;

export interface LineOptions {
  /** Relaxation sweeps. 240 is convergence to under a millimetre on every
   *  stage in the game; it is not a quality dial. */
  iterations?: number;
  /** Fraction of the way to the neighbour midpoint per sweep. */
  rate?: number;
}

/**
 * Build the racing line for a corridor. Pure, deterministic, no RNG: the same
 * corridor always gives the same line, which is what lets the reference lap be
 * a repeatable measurement rather than an anecdote.
 */
export function buildRacingLine(corridor: Corridor, opts: LineOptions = {}): RacingLine {
  const segs = corridor.segments;
  const n = segs.length;
  const iterations = opts.iterations ?? 240;
  const rate = opts.rate ?? 0.35;

  const offset = new Float64Array(n);
  const limit = new Float64Array(n);
  const px = new Float64Array(n);
  const pz = new Float64Array(n);

  const halfCar = VEHICLE.trackWidth / 2 + EDGE_MARGIN;
  for (let i = 0; i < n; i++) {
    // Stay on the roadbed. The shoulder is drivable — §11.3 counts it as part
    // of the corridor for cutting — but §3.2 lets Tier 1 and Tier 2 scatter sit
    // anywhere outside the roadbed, so a line that used the shoulder would be a
    // line through the bushes.
    limit[i] = Math.max(0.05, segs[i]!.roadbedWidth / 2 - halfCar);
  }
  // THE CLAMP HAS TO BE SMOOTH, and this is not cosmetic.
  //
  // §1.2 widths carry a seeded jitter of +/-0.25 m, so the raw limit rattles by
  // a decimetre between segments 4 m apart. Through a corner the line sits
  // against the clamp the whole way, so it inherits that rattle — and a 0.1 m
  // wobble over a 4 m baseline IS a 320 m radius. Measured on Ouninpohja, it
  // turned a 140 m corner into a 116 m one and cost the profile 10 km/h through
  // every fast corner on every stage.
  //
  // A minimum filter followed by a blur is smooth AND provably still inside the
  // road: after a min filter of radius r, every value is a minimum over a
  // window of r either side, so as long as the number of blur passes does not
  // exceed r, every term the blur reaches still had this segment inside its own
  // window and is therefore no larger than this segment's raw limit. Hence
  // radius 4 with four passes, and not the other way round.
  minFilter(limit, 4);
  smooth(limit, 4);

  const place = (i: number) => {
    const s = segs[i]!;
    px[i] = s.x + -s.hz * offset[i]!;
    pz[i] = s.z + s.hx * offset[i]!;
  };
  for (let i = 0; i < n; i++) place(i);

  // Constrained Laplacian relaxation, in place (Gauss-Seidel): each sweep sees
  // the neighbours the previous point already moved, which converges roughly
  // twice as fast as a Jacobi sweep and is just as deterministic because the
  // order is fixed.
  //
  // The ends are pinned to the centreline. The start is the grid, which is on
  // the centreline by definition; pinning the finish costs a few tenths over
  // the last corner and saves having to define what a line "off the end of the
  // stage" means.
  for (let k = 0; k < iterations; k++) {
    for (let i = 1; i < n - 1; i++) {
      const s = segs[i]!;
      const mx = (px[i - 1]! + px[i + 1]!) / 2;
      const mz = (pz[i - 1]! + pz[i + 1]!) / 2;
      // Project the midpoint back onto this segment's normal: the line is
      // allowed to move across the road, never along it. Keeping the
      // longitudinal spacing fixed is what makes `distance` meaningful and
      // stops the relaxation from bunching points at the apex.
      const want = (mx - s.x) * -s.hz + (mz - s.z) * s.hx;
      const next = offset[i]! + (want - offset[i]!) * rate;
      offset[i] = Math.max(-limit[i]!, Math.min(limit[i]!, next));
      place(i);
    }
  }

  // --- geometry of the result ---------------------------------------------
  const curvature = new Float64Array(n);
  const distance = new Float64Array(n);
  for (let i = 1; i < n; i++) {
    distance[i] = distance[i - 1]! + Math.hypot(px[i]! - px[i - 1]!, pz[i]! - pz[i - 1]!);
  }
  // Curvature over a 2-segment stride rather than adjacent points. Menger
  // curvature through three points ON A CIRCLE is exactly 1/R whatever their
  // spacing, so a wider baseline costs nothing on a real corner and divides the
  // numerical noise on a straight by four. That is why the noise is filtered
  // HERE and not by smoothing the curvature afterwards: blurring curvature
  // would also flatten the peak at a hairpin, which is the one number the
  // speed profile must not be optimistic about.
  const STRIDE = 2;
  for (let i = 0; i < n; i++) {
    const a = Math.max(0, i - STRIDE);
    const c = Math.min(n - 1, i + STRIDE);
    curvature[i] = a === i || c === i
      ? 0
      : mengerCurvature(px[a]!, pz[a]!, px[i]!, pz[i]!, px[c]!, pz[c]!);
  }
  curvature[0] = curvature[STRIDE] ?? 0;
  curvature[n - 1] = curvature[n - 1 - STRIDE] ?? 0;

  return { offset, px, pz, curvature, speed: speedProfile(corridor, curvature, distance), distance, limit };
}

/**
 * The speed profile: what a car at the friction limit can do at each point of
 * the line, given what comes after it.
 */
function speedProfile(corridor: Corridor, curvature: Float64Array, distance: Float64Array): Float64Array {
  const segs = corridor.segments;
  const n = segs.length;
  const g = Math.abs(SIM.gravity);
  const v = new Float64Array(n);

  // Terminal speed from the spec's own aerodynamics: at steady state, power
  // equals drag, so v = cbrt(2P / (rho Cd A)). For 220 kW, 0.38 and 2.1 m2 that
  // is about 80 m/s — well above anything a 4 km stage reaches, so it is a
  // ceiling that never binds rather than a tuned cap.
  const vMax = Math.cbrt((2 * VEHICLE.peakPowerW) / (1.225 * VEHICLE.dragCoefficient * VEHICLE.frontalArea));

  for (let i = 0; i < n; i++) {
    const surf = SURFACES[segs[i]!.surfaceId];
    const muLat = (surf?.muLat ?? 0.7) * LIMIT_FRACTION;
    const r = Math.abs(curvature[i]!) > 1e-6 ? 1 / Math.abs(curvature[i]!) : Infinity;
    v[i] = Math.min(vMax, Math.sqrt(muLat * g * r), crestLimit(corridor, i, g));
  }

  // Backward: be slow enough now to be slow enough later. This is the whole
  // braking model, and it is exact rather than a horizon heuristic.
  for (let i = n - 2; i >= 0; i--) {
    const surf = SURFACES[segs[i]!.surfaceId];
    const muLong = (surf?.muLong ?? 0.7) * LIMIT_FRACTION;
    const ds = Math.max(0.01, distance[i + 1]! - distance[i]!);
    // Braking and cornering share one friction circle (§8's ellipse). A car
    // already using most of its grip to turn has little left to slow down
    // with, which is why trail-braking into a hairpin is delicate and why a
    // profile that ignores it asks for decelerations the tyre cannot deliver.
    const lat = Math.min(1, v[i + 1]! ** 2 * Math.abs(curvature[i]!) / (muLong * g));
    const aBrake = muLong * g * Math.sqrt(Math.max(0.15, 1 - lat * lat));
    v[i] = Math.min(v[i]!, Math.sqrt(v[i + 1]! ** 2 + 2 * aBrake * ds));
  }

  // A stage starts from a standing start. Without this the profile opened at
  // the aerodynamic terminal speed — it told the driver that 276 km/h was
  // available on the grid, which is harmless as a command (the car simply goes
  // flat out) but makes the profile useless as a statement about the stage.
  v[0] = 0;

  // Forward: you cannot be at the limit before you have accelerated to it.
  // Traction-limited at low speed, power-limited at high — a = P / (m v) is why
  // the car keeps pulling out of a hairpin long after it has stopped pulling on
  // the straight.
  for (let i = 1; i < n; i++) {
    const surf = SURFACES[segs[i]!.surfaceId];
    const muLong = (surf?.muLong ?? 0.7) * LIMIT_FRACTION;
    const ds = Math.max(0.01, distance[i]! - distance[i - 1]!);
    const vPrev = Math.max(2, v[i - 1]!);
    const aDrive = Math.min(muLong * g, VEHICLE.peakPowerW / (VEHICLE.mass * vPrev));
    v[i] = Math.min(v[i]!, Math.sqrt(v[i - 1]! ** 2 + 2 * aDrive * ds));
  }

  return v;
}

/**
 * How fast a car may cross a crest — and this one was found the hard way.
 *
 * The first profile limited lateral acceleration and nothing else, so on
 * Ouninpohja it sent the car over the 240 m crest at 135 km/h. The crest has a
 * vertical radius of about 80 m, so v²/r there is over 2 g: the car was thrown
 * into the air with all four wheels unloaded, drifted while it had no grip to
 * correct with, and landed off the road. The driver was blamed twice before the
 * trace showed `grounded: 0` for half a second in the middle of the excursion.
 *
 * A car needs g of centripetal acceleration to follow a crest at all, and every
 * m/s² beyond that is airtime. Allowing 1.3 g means a short hop over a real
 * crest — this is a rally game, §6 exists, and a reference driver that crawled
 * over every rise would be a worse model of the stage than one that flies a
 * little. It is the 2 g launch that ends runs.
 */
const CREST_LOAD_FACTOR = 1.3;

function crestLimit(corridor: Corridor, i: number, g: number): number {
  const segs = corridor.segments;
  const a = segs[Math.max(0, i - 1)]!;
  const b = segs[Math.min(segs.length - 1, i + 1)]!;
  const ds = Math.max(1e-3, b.distance - a.distance);
  // Vertical curvature = rate of change of gradient. Negative is a crest;
  // a dip loads the car rather than unloading it and needs no limit here.
  const k = (b.gradient - a.gradient) / ds;
  if (k > -1e-6) return Infinity;
  return Math.sqrt((CREST_LOAD_FACTOR * g) / -k);
}

/** Signed curvature through three points. Positive turns toward the +normal
 *  side (right), matching the sign convention of `offset`. */
function mengerCurvature(
  ax: number, az: number, bx: number, bz: number, cx: number, cz: number,
): number {
  const abx = bx - ax, abz = bz - az;
  const bcx = cx - bx, bcz = cz - bz;
  const ab = Math.hypot(abx, abz);
  const bc = Math.hypot(bcx, bcz);
  const ca = Math.hypot(cx - ax, cz - az);
  if (ab < 1e-9 || bc < 1e-9 || ca < 1e-9) return 0;
  // Twice the signed area of the triangle, over the product of the sides.
  const cross = abx * bcz - abz * bcx;
  return (2 * cross) / (ab * bc * ca);
}

/** In-place minimum over a window of `radius` either side. */
function minFilter(a: Float64Array, radius: number): void {
  const n = a.length;
  const tmp = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    let m = Infinity;
    for (let k = Math.max(0, i - radius); k <= Math.min(n - 1, i + radius); k++) {
      m = Math.min(m, a[k]!);
    }
    tmp[i] = m;
  }
  a.set(tmp);
}

/** In-place box blur, `passes` times. */
function smooth(a: Float64Array, passes: number): void {
  const n = a.length;
  const tmp = new Float64Array(n);
  for (let p = 0; p < passes; p++) {
    for (let i = 0; i < n; i++) {
      const l = a[Math.max(0, i - 1)]!;
      const r = a[Math.min(n - 1, i + 1)]!;
      tmp[i] = (l + 2 * a[i]! + r) / 4;
    }
    a.set(tmp);
  }
}

/** The line's lateral offset and target speed at a segment index, clamped to
 *  the ends. Small enough to inline, named because the driver reads it in two
 *  places and an off-by-one between them is a silent understeer. */
export function lineAt(line: RacingLine, i: number): { offset: number; speed: number } {
  const k = Math.max(0, Math.min(line.offset.length - 1, i));
  return { offset: line.offset[k]!, speed: line.speed[k]! };
}

/** World point of the line at a segment index. */
export function linePoint(line: RacingLine, segs: Segment[], i: number): { x: number; z: number } {
  const k = Math.max(0, Math.min(segs.length - 1, i));
  return { x: line.px[k]!, z: line.pz[k]! };
}
