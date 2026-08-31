/* THE DRIVING TUNING SURFACE — RALLY_DRIVING.md §13, adapted (r293).
 *
 * The spec's rule: every driving constant lives in one place, overridable by
 * a `driving.json` loaded at boot, hot-reloadable in dev. This engine is not
 * the spec's Rapier raycast vehicle, so the constants here are the MAPPED
 * equivalents — each key notes the spec section it answers to. Values are
 * read at RUNTIME (never destructured at import), so a JSON override or a
 * dev-console poke (`window.__DRIVING.brakeCap = ...`) takes effect on the
 * next physics tick.
 *
 * DRIVING_SPEC.md in the repo root records the full mapping and every
 * deviation from the spec's literal tables.
 */
export const DRIVING = {
  // §6 / tests 12.1+12.4 — the spec SHAPE: a modest flat drive force with a
  // small linear drag solves 0-100 (5.8 s) and top speed (~195) from ONE
  // pair: a(v) = 6.6 − 0.122·v integrates to 5.9 s to 100 and tops at 54
  // u/s. launchCapFade 99 = the traction cap never fades: the cap IS the
  // engine now, per the spec, instead of a launch-only guard. The launch
  // traction cap (×gripBudget) and the under-power drag coefficient are the
  // two levers; the pair below is measure-tuned against drivereal.mjs.
  launchTraction: 1.89,      // was 2.8: drive force cap = this × gripBudget
  launchCapFade: 99,        // cap fades out by this × half showroom speed
  dragPower: 0.122,           // proportional drag under throttle (the governor)
  dragCoast: 0.14,           // closed-throttle engine braking + aero
  dragOffRoad: 0.35,         // extra off-road drag when racing…
  dragOffRoadRoam: 0.16,     // …halved for free-roam meadow touring (r292)

  // §8.1 / test 12.3 — 100-0 km/h in 42 m ± 3 (≈0.94 g). All four tyres.
  brakeCap: 2.6,            // brake decel cap = this × gripBudget (was 4.2)

  // §8.2 — the handbrake guarantees the tail steps out when asked.
  hbYawImpulse: 0.18,        // × current lateral velocity, in the steer direction
  hbMinSpeed: 8.4,           // u/s (~30 km/h): below this the impulse scales to 0
  hbIceDisabled: true,       // MUST be disabled on ice/snow surfaces

  // §7.1 — the post-peak plateau. "A car that keeps 70% is an arcade car
  // the player can hold sideways." Was (1 − 0.78·slip) → a 22% floor.
  slipGripFloor: 0.70,       // grip at full slip = this × budget

  // §8.3 — drift assist: counter-steer toward the slide, and a spin line.
  csAssistGain: 0.55,        // adds yaw toward killing lateral velocity
  csAssistSlipMin: 0.22,     // engages above this slip
  spinSlipAngle: 1.13,       // rad (~65°): past this, assist off — the spin is earned

  // §5-equivalent — the yaw caps (this engine steers in yaw-rate space).
  yawRMin: 4.0,              // turning-circle radius floor, u
  yawCapLo: 1.25,             // × budget allowance in the mid-range
  yawCapHi: 1.10,            // × budget allowance at top speed
  reverseAccel: 5.0,         // §6 reverse: a manoeuvre, not a launch
};

/** Boot override — main.js calls this once; failures are silent by design
 *  (no driving.json shipped means the defaults above ARE the tune). */
export async function loadDrivingOverrides(url = './driving.json') {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return false;
    const json = await res.json();
    for (const k of Object.keys(json)) {
      if (k in DRIVING && typeof json[k] === typeof DRIVING[k]) DRIVING[k] = json[k];
    }
    return true;
  } catch { return false; }
}

if (typeof window !== 'undefined') window.__DRIVING = DRIVING;
