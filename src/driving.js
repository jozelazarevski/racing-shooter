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
  // 1.45 mid-range (r294, "impossible to steer in this curve at this
  // speed", IL BUDELLO at 99): at 1.25 an old-town corner (R~30) was
  // unmakeable even with a lift. At 1.45, flat-out still runs wide — the
  // drift promise — but lifting to ~85 km/h turns R27 and makes it. The
  // churn stays bounded because a corner is 1-2 s, not a held circle.
  yawRMin: 4.0,              // turning-circle radius floor, u
  yawCapLo: 1.45,             // × budget allowance in the mid-range
  yawCapHi: 1.15,            // × budget allowance at top speed
  reverseAccel: 5.0,         // §6 reverse: a manoeuvre, not a launch

  // RALLY_PATCH_02 §7 (v1.1) — the race-loop constants, all shipping
  // defaults. The glance rule is expressed as `square` (share of speed
  // into the surface): incidence < 20° ⇔ square < sin(20°) ≈ 0.34 — the
  // patch's own algorithm line has the angle geometry inverted (it would
  // zero head-ons and contradict its P2.3), so the acceptance tests are
  // the authority here.
  patch02: {
    gridLaunchInvulnS: 1.5,
    rivalTargetDelayS: 4.0,
    contactDamageK: 0.9,
    contactDamageThresholdMs: 5.0,
    contactGlanceSquare: 0.34,
    contactDamageCapPerHit: 45,
    contactDamageCapPerSec: 60,
    rivalRamCapPerHit: 8,
    playerTargetTokensEarly: 1,
    playerTargetTokensLate: 2,
    playerTargetEarlyUntilS: 20,
    targetTokenRotateS: 6,
    rubberbandMaxPct: 8,
    offmeshAutoReturnS: 2.0,
    landingAssistMs: 300,
    landingYawClampDps: 60,
    wallEscapeMaxKmh: 30,
    wallEscapeMinAngleDeg: 45,
    nitroPickupsPerLap: 2,
    nitroBonusKmh: 40,
    camHeightMaxMul: 1.35,
    camEaseMs: 400,
    speedLinesFromKmh: 150,
  },

  // RALLY_PATCH_02 v1.2 §9 — recording B (Glacier Col) constants. Only the
  // keys this engine actually READS live here; a key nothing reads is a
  // config that lies. Deviations from the patch's names/values:
  //   propShoveMaxKg 200  -> propShoveRadiusU 1.15 (props carry no mass;
  //                          the knockable-stone class is radius-based)
  //   camClearanceM 1.5   -> 2.2 (this engine's measured-good clearance —
  //                          stricter than the spec's floor, kept)
  //   spawnBehindLineM    -> not wired: the grid already places every car
  //                          on the spline at tangent (probed on Glacier
  //                          Col: lateral 3.6 u, heading offset 0°)
  //   stuckDetectS / lowSpeedTorqueMul -> fix 14, next build per rollout
  patch02b: {
    propShoveRadiusU: 1.15,
    camClearanceM: 2.2,
  },

  // RALLY_CORRIDOR_REFACTOR v2.0 §14 — the route constants, complete as the
  // spec ships them. This is a STAGED build (§16): step 1 reads streetPadM /
  // trailPadM / openMinHalfWidthM / ribbonNearM; the rest go live with their
  // build steps (slope and surfaces in step 2, prop masses in 3, returns and
  // recovery in 4, cuts and rivals in 5-6). They are declared now because
  // the spec is the authority on their values, and each step wiring one in
  // must not also be the round that invents its number.
  route: {
    streetPadM: 2,
    trailPadM: 12,
    openMinHalfWidthM: 30,
    openMaxHalfWidthM: 60,
    missedGateGraceS: 4.0,
    returnAheadM: 6,
    returnSpeedKmh: 40,
    maxClimbDeg: 35,
    fatalDropM: 12,
    waterDepthM: 1.2,
    smashMaxKg: 80,
    shoveMaxKg: 600,
    obstacleMinHeightM: 1.6,
    obstacleExclusionM: 4,
    obstacleDensityPer20m: 1,
    rivalCutChance: 0.3,
    rivalLateralNoiseTrailM: 4,
    rivalLateralNoiseOpenM: 12,
    stuckDetectS: 2.5,
    upsideDownS: 2.0,
    playerResetDelayS: 1.5,
    camClearanceM: 1.5,
    ribbonNearM: 15,
  },
};

/** Boot override — main.js calls this once; failures are silent by design
 *  (no driving.json shipped means the defaults above ARE the tune). */
export async function loadDrivingOverrides(url = './driving.json') {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return false;
    const json = await res.json();
    for (const k of Object.keys(json)) {
      if (!(k in DRIVING) || typeof json[k] !== typeof DRIVING[k]) continue;
      if (json[k] && typeof json[k] === 'object') {
        // nested block (patch02): merge key-by-key so a partial override
        // — one constant in the JSON — doesn't wipe the other defaults
        for (const kk of Object.keys(json[k])) {
          if (kk in DRIVING[k] && typeof json[k][kk] === typeof DRIVING[k][kk]) {
            DRIVING[k][kk] = json[k][kk];
          }
        }
      } else DRIVING[k] = json[k];
    }
    return true;
  } catch { return false; }
}

if (typeof window !== 'undefined') window.__DRIVING = DRIVING;
