/* The Pacejka tyre, §8.
 *
 * This is the reason Phase 2 exists. v1 had a scalar grip number with slip and
 * drift terms bolted on, tuned by feel until it stopped complaining. Everything
 * about how the car behaved was an emergent property of those tuning passes,
 * which is why every handling change broke two others.
 *
 * The Magic Formula is not more "realistic" for its own sake. It gives you the
 * one thing a scalar cannot: a force curve with a PEAK. Grip rises with slip,
 * maxes out, then falls away. That single shape is what makes a car
 * controllable at the limit, makes trail-braking work, makes a Scandinavian
 * flick work, and makes a snap of oversteer recoverable instead of terminal.
 * You cannot tune a monotonic function into having a peak.
 */
import { SURFACES, VEHICLE, COMPOUND_FACTORS, WEATHER } from '../../../spec/rally.constants.ts';

export type SurfaceId = keyof typeof SURFACES;
export type Compound = keyof typeof COMPOUND_FACTORS;
export type WeatherId = keyof typeof WEATHER;

/**
 * Pacejka Magic Formula, simplified form:
 *
 *   F = D * sin(C * atan(B*s - E*(B*s - atan(B*s))))
 *
 * B shapes the initial stiffness, C the overall shape, D the peak (which is
 * mu * load), E the falloff past the peak. The spec gives B, C and E per
 * surface for both axes; D comes from load and friction.
 */
export function magicFormula(slip: number, B: number, C: number, D: number, E: number): number {
  const Bs = B * slip;
  return D * Math.sin(C * Math.atan(Bs - E * (Bs - Math.atan(Bs))));
}

export interface TyreState {
  /** Longitudinal slip ratio, dimensionless. */
  slipRatio: number;
  /** Lateral slip angle, radians. */
  slipAngle: number;
  /** Normal load, newtons. */
  load: number;
  surface: SurfaceId;
  compound: Compound;
  weather: WeatherId;
}

export interface TyreForce {
  /** Newtons, along the wheel's heading. */
  fx: number;
  /** Newtons, perpendicular to it. */
  fy: number;
  /** How far into the friction budget this tyre is, 0-1+. Above 1 it is
   *  sliding, which is what the dust and the audio key off. */
  utilisation: number;
}

/** Which family of COMPOUND_FACTORS a surface belongs to. */
function compoundClass(surface: SurfaceId): keyof (typeof COMPOUND_FACTORS)['gravel'] {
  if (surface.startsWith('tarmac') || surface === 'cobble' || surface === 'bridge_plank' || surface === 'cattle_grid') return 'tarmac';
  if (surface === 'ice') return 'ice';
  if (surface.startsWith('snow')) return 'snow';
  return 'gravel';
}

/**
 * Force from one tyre.
 *
 * Three things beyond the raw formula, all specified:
 *
 * 1. **Load sensitivity** (§8). Friction falls as load rises — a tyre carrying
 *    twice the weight does not give twice the grip. This is what makes weight
 *    transfer matter, and without it a car corners the same whether or not it
 *    is on the brakes.
 * 2. **The friction ellipse.** Longitudinal and lateral force share one budget.
 *    Brake at the limit and you have no steering left. This is the rule that
 *    makes trail-braking a skill rather than a free lunch.
 * 3. **Compound and weather factors**, which scale mu before any of it.
 */
export function tyreForce(t: TyreState): TyreForce {
  const surf = SURFACES[t.surface] ?? SURFACES.gravel_loose!;
  const compound = COMPOUND_FACTORS[t.compound][compoundClass(t.surface)];
  const weather = WEATHER[t.weather].muFactor;

  // Load sensitivity: mu falls off as load rises above the static per-corner
  // figure. VEHICLE.loadSensitivity is the fractional loss per unit of
  // normalised excess load.
  const nominal = (VEHICLE.mass * 9.81) / 4;
  const excess = Math.max(0, t.load / nominal - 1);
  const loadFactor = 1 / (1 + VEHICLE.loadSensitivity * excess);

  const scale = compound * weather * loadFactor;
  const muX = surf.muLong * scale;
  const muY = surf.muLat * scale;
  const p = surf.pacejka;

  const Dx = muX * t.load;
  const Dy = muY * t.load;

  const fx0 = magicFormula(t.slipRatio, p.Bx, p.Cx, Dx, p.Ex);
  // Slip angle enters in radians but the formula's B constants are calibrated
  // for tan(alpha); at rally slip angles the difference is real.
  const fy0 = -magicFormula(Math.tan(t.slipAngle), p.By, p.Cy, Dy, p.Ey);

  // Friction ellipse. Scale both components so the resultant never exceeds the
  // budget, rather than clamping each independently — independent clamps let a
  // tyre produce full braking AND full cornering at once, which is the single
  // most common way an arcade physics model stops teaching anything.
  const budget = Math.hypot(Dx, Dy) || 1;
  const demand = Math.hypot(fx0, fy0);
  const util = demand / budget;
  const k = util > 1 ? 1 / util : 1;

  return { fx: fx0 * k, fy: fy0 * k, utilisation: util };
}

/**
 * Slip ratio with a relaxation length, §8.
 *
 * A tyre does not develop force instantly — the carcass has to deform, and it
 * takes a fixed distance of travel, not a fixed time. Modelling it as a time
 * constant is the classic mistake: it makes the car feel identical at 20 km/h
 * and 200 km/h, when in reality response sharpens with speed.
 */
export function relaxSlip(current: number, target: number, speed: number, length: number, dt: number): number {
  if (length <= 0) return target;
  // Distance travelled this step over the relaxation length gives the fraction
  // of the way the tyre gets toward its steady-state slip.
  const k = 1 - Math.exp(-(Math.abs(speed) * dt) / length);
  return current + (target - current) * k;
}

/** §8: shorter on tarmac, longer on loose. */
export function relaxationLength(surface: SurfaceId): number {
  return compoundClass(surface) === 'tarmac'
    ? VEHICLE.relaxationLengthTarmac
    : VEHICLE.relaxationLengthLoose;
}
