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
  // r312 MACHINES DIFFER: the BRAWLER's showroom accel (36.5) is the datum
  // the accel-aware traction cap scales around, so a quicker engine really
  // launches quicker (0-100 spreads across the catalog) without re-tuning
  // launchTraction. Bounded [0.85, 1.18] in vehicles.js.
  accelRef: 36.5,
  dragPower: 0.122,           // proportional drag under throttle (the governor)
  dragCoast: 0.14,           // closed-throttle engine braking + aero
  // v1.5 §11.6 / F7 (r314): every DRIVABLE off-road surface must top out at
  // 55-75% of road top speed — measured at the old 0.35, grass ran 24-34%
  // (a wall, not a surface). 0.08 lands PINE at 56% and GLACIER at 71%,
  // both in band; 0-30 km/h off-road is 1.6 s (law: < 3). One value,
  // applied globally, racing and roam alike (racing sat above roam's
  // touring tune, which inverted r292's own reasoning the moment F7 bound).
  // r340: 0.0775, from 0.08 — the 2x straights let the ROAD top read its
  // honest maximum (171 on GLACIER COL against ~166 before), which pushed
  // grass to 54% of road and out of F7's 55-75 band by one point. The
  // slightly lighter drag lifts grass ~1.5%; both fixture worlds re-measure
  // in band.
  dragOffRoad: 0.0775,
  dragOffRoadRoam: 0.0775,
  // r315: the off-road CLIMB divisor (the uphill vCap term's slope divisor
  // when off-road; on-road keeps 0.55). F7 freed the flats; this is what
  // keeps a mountainside from being a road — "I can still enter a
  // mountain" was a 29 u/s charge up a 30° face into the drawn rock.
  offRoadClimbDiv: 0.14,
  offRoadClimbBleed: 14,     // u/s² toward the climb cap: banks cross, charges die
  offRoadClimbFreeGrade: 0.15, // rolling grass under this grade climbs free (F7)
  rejoinBandU: 34,           // r328: within this of the road, banks are a
                             // scramble, not a wall (v2.3 §3.8/P9); real
                             // mountain faces live past the 60 u wilds fence
  offRoadClimbDivNear: 0.5,  // inside the band a climb prices like a ROAD climb
                             // (0.30 still walled FURKA grade-1.1 banks at 24%)
  offRoadClimbBleedNear: 6,  // u/s² graze inside the band (14 outside)
  fallEdgeDrop: 3,           // ground this far below the car is a FALL, not a slope:
                             // the car goes ballistic and onLand prices the impact
                             // (the r320 cliff report — the ease was rappelling
                             // cars down 30 u walls at 11 u/s, unhurt)
  fallWreckOver: 16,         // impact past free+this wrecks outright, any hull
                             // (free 22 + 16 = 38 u/s ≈ a 28 u drop on stock
                             // dampers; dampers raise the bar through `free`)

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
  // r307 ("when I drift it does not seem it helping me turn, just sliding"):
  // the held-drift laws. Measured before: a 2 s handbrake drift at 70 km/h
  // yawed the nose 52° while scrubbing 70 -> 2 km/h — all slide, no turn.
  driftScrubCap: 2.1,        // × budget kinetic ceiling WITH the handbrake (unloaded tyres); 4.4 otherwise
  driftReward: 0.5,          // slice of scrubbed slide returned as forward speed while held (0.35 free)
  driftYawAssist: 0.85,      // rad/s of rotation help toward the steer, 15°-65° slip, handbrake held
  // r341 (owner, on r340: "Drift is spinning the car way too much"): a held
  // drift HOLDS its angle. Measured (tools-scratch/driftspin.mjs): while the
  // handbrake is down the over-budget lag pins the velocity vector, so slip
  // is the raw INTEGRAL of yaw — kick + assist + relaxed cap kept adding
  // rotation and a 0.8 s flick at any speed sailed through the controllable
  // band to ~89° of slip, a guaranteed spin-out. Past driftBetaMax the nose
  // and the velocity rotate TOGETHER: the turn continues at full rate (the
  // r307 drift promise), the angle stops deepening, and the 65° "earned"
  // spin stays reachable — just not handed out by the assist stack. The
  // carried turn is budget-priced (driftCarryCap), so the ceiling is a
  // controlled arc, not free rotation.
  driftBetaMax: 1.0,         // rad (~57°): held-drift slip ceiling, under the spin line
  driftBetaEase: 6,          // 1/s: rate the remaining room closes at (τ ≈ 0.17 s)
  driftCarryCap: 1.0,        // × budget: lateral the carried turn may spend — over yawCapLo (1.45,
                             // the flat-out grip arc), under the scrub's 2.1: the drift out-turns
                             // grip without the 7 g donut

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
    speedLinesFromKmh: 95,   // r309 "do not feel I go 70": speed must LOOK like speed well before 150
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
  // trailPadM / openMinHalfWidthM; the rest go live with their
  // build steps (slope and surfaces in step 2, prop masses in 3, returns and
  // recovery in 4, cuts and rivals in 5-6). They are declared now because
  // the spec is the authority on their values, and each step wiring one in
  // must not also be the round that invents its number.
  // CLAUDE.md v1.5 §12 — STAGE TEMPLATES. Every world declares exactly one
  // template kind; the generator takes these as inputs and §11 checks the
  // output regardless. designSpeedKmh drives the derived nitro ceiling
  // (§11.5): nitroCeilingKmh = min(designSpeedKmh + 20, gearTop + 40) —
  // derived, never set by hand. Ceilings are in DISPLAYED km/h (the spec's
  // numbers come from recordings of the HUD; recording E read 205-213 in
  // streets built for 140).
  templates: {
    street:  { designSpeedKmh: 140 },
    canyon:  { designSpeedKmh: 170 },
    forest:  { designSpeedKmh: 160 },
    circuit: { designSpeedKmh: 190 },
    open:    { designSpeedKmh: 200 },
    snow:    { designSpeedKmh: 150 },
  },
  // theme -> template kind. Anything unlisted is 'forest' (160): the middle
  // of the table, and the roster's most common shape.
  templateOf: {
    riviera: 'street', genova: 'street', sanremo: 'street', oldtown: 'street',
    principality: 'street', harbor: 'street', citadel: 'street', neon: 'street',
    undercity: 'street', liguria: 'street', brava: 'street', dalmatia: 'street',
    azur: 'street', aegean: 'street', medterrace: 'street', olivecountry: 'street',
    canyon: 'canyon', desert: 'canyon', ravine: 'canyon', tremola: 'canyon',
    furka: 'canyon', pass: 'canyon', dolomiti: 'canyon', mountainsea: 'canyon',
    outback: 'open', dunes: 'open', savanna: 'open', oasis: 'open',
    snow: 'snow', glacial: 'snow', sheetice: 'snow', avalanche: 'snow',
    alpine: 'forest', farmland: 'forest', vineyard: 'forest',
  },

  route: {
    streetPadM: 2,
    trailPadM: 12,
    openMinHalfWidthM: 30,
    openMaxHalfWidthM: 60,
    missedGateGraceS: 4.0,
    returnAheadM: 6,
    returnSpeedKmh: 0,  // r324 owner override of §3.6's 40: a restarted car
                        // STANDS — under touch auto-gas, 40 km/h at respawn
                        // read as an instant nitro launch
    maxClimbDeg: 35,
    // v2.3 §3.3 (r330): past maxClimbDeg the face sheds the car — onset
    // after slopeLatDecayS (the spec's lateral-decay window), downhill
    // slide speed capped at steepSlideCapU
    slopeLatDecayS: 0.5,
    steepSlideCapU: 22,
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
    killRespawnHoldS: 4.0,   // §6.10: a destroyed rival holds this long, then its last gate
    // v2.3 §3.2 (r329): the below-terrain watchdog. Datum is
    // min(terrainHeight, physics ground); healthy driving measured 0.83 u
    // worst-case (voiddepth.mjs), so 1.0 held voidConfirmS is a lost car.
    belowTerrainM: 1.0,
    voidDeepM: 4.0,          // this deep is unambiguous: return at once
    voidConfirmS: 0.5,
    // v2.3 §3.9 (r329): a camera clamped inside camMinDistU of the car
    // rises toward top-down (car + ~15 u of surroundings) instead of
    // pulling in — the recording-F waterfall frames
    camMinDistU: 6,
    camCloseRiseU: 16,
    camClearanceM: 1.5,
    // ribbonNearM is GONE (r302): the ribbon and the gate arrow it fed are
    // erased under CLAUDE.md v1.2 §3.5 — a key nothing reads is a config
    // that lies.
  },

  // §5 (r313): THE GRID IS SEVEN DRIVERS, NOT ONE ALGORITHM IN SEVEN CARS.
  // The rubber band is DELETED — convergence toward any car is forbidden
  // except through the ONE pressure rival, clamped to pressureClampPct.
  // Personalities ride the roster in slot order (slot i drives roster[i]);
  // "Field spread follows from pace spread; no other mechanism."
  ai: {
    roster: [
      { name: 'rabbit', paceOffset: -0.02, consistency: 0.95, aggression: 0.4, cutChance: 0.2, defence: 0.8 },
      { name: 'racer1', paceOffset: 0.00, consistency: 0.90, aggression: 0.6, cutChance: 0.2, defence: 0.7 },
      { name: 'racer2', paceOffset: 0.012, consistency: 0.88, aggression: 0.7, cutChance: 0.3, defence: 0.6 },
      { name: 'mid1', paceOffset: 0.024, consistency: 0.80, aggression: 0.5, cutChance: 0.3, defence: 0.5 },
      { name: 'mid2', paceOffset: 0.038, consistency: 0.80, aggression: 0.8, cutChance: 0.3, defence: 0.4 },
      // offsets re-laddered to EVEN steps of the full allowed range (spec
      // ships 0.05/0.05 twins and a 0.03/0.05 gap; twins raced glued —
      // the mid/back four formed the standing 4-car clump Q12 forbids, and
      // the shipped spread measured under Q11's 8 s floor)
      { name: 'back1', paceOffset: 0.048, consistency: 0.65, aggression: 0.3, cutChance: 0.5, defence: 0.3 },
      { name: 'back2', paceOffset: 0.06, consistency: 0.65, aggression: 0.9, cutChance: 0.4, defence: 0.3 },
    ],
    pressureClampPct: 3, pressurePickAfterS: 15,
    separationM: 6, followGapS: 0.4, setupMaxS: 1.5, commitS: 2.0,
    defenceMovesPerStraight: 1, lapBoundaryNoConvergeS: 10,
    playerTokensEarly: 1, playerTokensLate: 2, tokenRotateS: 6, rivalRamCapPerHit: 8,
    launchReactionMinS: 0.2, launchReactionMaxS: 0.8,
    lateralNoiseTrailM: 4, lateralNoiseOpenM: 12,
    // the corner budget a paceOffset-0 driver plans (aLat, u/s²) BEFORE the
    // difficulty knobs — replaces `26 + 26 * cornerSkill`, whose random
    // spread was the old "personality" (§5.1 says pace spread is the only
    // mechanism, so the random is gone and this one number is par).
    parCornerALat: 44,
    // how hard paceOffset reaches the corner budget: lap time dilutes aLat
    // (~lap ∝ aLat^0.26 measured), so the naive square delivered half the
    // roster's spread; the exponent calibrates the dilution away. Swept in
    // r313 against Q11's [8, 25] s lap-1 band.
    paceCornerExp: 6,
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

/** §12: resolve a level to its template kind. The GRAND CIRCUITS chapter is
 *  circuit-kind BY REGION whatever its theme dresses it as; everything else
 *  resolves by theme, defaulting to forest (the roster's common shape). */
export function stageTemplate(level) {
  if (!level) return 'forest';
  if (level.region === 'GRAND CIRCUITS') return 'circuit';
  return DRIVING.templateOf?.[level.theme] ?? 'forest';
}

/** §11.5: the nitro ceiling, DERIVED, in displayed km/h — never hand-set.
 *  gearTop is the car's showroom top in the same displayed unit. A stage may
 *  override designSpeedKmh by ±10 via level.tune.designSpeedKmh (§12). */
export function nitroCeilingKmh(level, gearTopKmh) {
  const kind = stageTemplate(level);
  let design = DRIVING.templates?.[kind]?.designSpeedKmh ?? 160;
  const o = level?.tune?.designSpeedKmh;
  if (Number.isFinite(o)) design = Math.max(design - 10, Math.min(design + 10, o));
  return Math.min(design + 20, (gearTopKmh ?? 200) + 40);
}

if (typeof window !== 'undefined') window.__DRIVING = DRIVING;
