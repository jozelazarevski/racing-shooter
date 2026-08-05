/**
 * rally.constants.ts
 * Single source of truth for all tunable physics and world values.
 * Mirrors RALLY_RULES.md. If a number here disagrees with the document,
 * the document wins and this file must be corrected.
 *
 * Units: metres, kilograms, seconds, newtons, radians.
 */

// ---------------------------------------------------------------------------
// SIMULATION
// ---------------------------------------------------------------------------

export const SIM = {
  fixedTimestep: 1 / 120,
  solverSubsteps: 4,
  maxCatchUpSteps: 5,
  gravity: -11.0,
  ccdSpeedThreshold: 25.0,
} as const;

// ---------------------------------------------------------------------------
// SURFACES
// ---------------------------------------------------------------------------

export interface SurfaceDef {
  muLong: number;
  muLat: number;
  rollingResistance: number;
  deformDepth: number;
  bulldozeCoefficient: number;
  pacejka: { Bx: number; Cx: number; Ex: number; By: number; Cy: number; Ey: number };
  particle: string;
  tyreWearRate: number;
}

const PACEJKA_TARMAC = { Bx: 11.0, Cx: 1.65, Ex: 0.95, By: 10.5, Cy: 1.35, Ey: 0.95 };
const PACEJKA_GRAVEL = { Bx: 6.5, Cx: 1.55, Ex: 0.88, By: 6.0, Cy: 1.28, Ey: 0.90 };
const PACEJKA_SNOW = { Bx: 5.0, Cx: 1.50, Ex: 0.85, By: 4.6, Cy: 1.22, Ey: 0.86 };
const PACEJKA_ICE = { Bx: 4.0, Cx: 1.45, Ex: 0.80, By: 3.6, Cy: 1.18, Ey: 0.82 };

export const SURFACES: Record<string, SurfaceDef> = {
  tarmac_dry:      { muLong: 1.15, muLat: 1.10, rollingResistance: 0.013, deformDepth: 0.00, bulldozeCoefficient: 0.00, pacejka: PACEJKA_TARMAC, particle: "none",   tyreWearRate: 1.00 },
  tarmac_wet:      { muLong: 0.85, muLat: 0.80, rollingResistance: 0.016, deformDepth: 0.00, bulldozeCoefficient: 0.00, pacejka: PACEJKA_TARMAC, particle: "spray",  tyreWearRate: 0.70 },
  tarmac_patched:  { muLong: 1.02, muLat: 0.96, rollingResistance: 0.015, deformDepth: 0.00, bulldozeCoefficient: 0.00, pacejka: PACEJKA_TARMAC, particle: "dust",   tyreWearRate: 1.10 },
  gravel_hardpack: { muLong: 0.92, muLat: 0.86, rollingResistance: 0.028, deformDepth: 0.02, bulldozeCoefficient: 0.35, pacejka: PACEJKA_GRAVEL, particle: "dust",   tyreWearRate: 1.20 },
  gravel_loose:    { muLong: 0.76, muLat: 0.70, rollingResistance: 0.042, deformDepth: 0.06, bulldozeCoefficient: 0.55, pacejka: PACEJKA_GRAVEL, particle: "stones", tyreWearRate: 1.40 },
  gravel_deep:     { muLong: 0.68, muLat: 0.60, rollingResistance: 0.070, deformDepth: 0.12, bulldozeCoefficient: 0.72, pacejka: PACEJKA_GRAVEL, particle: "stones", tyreWearRate: 1.60 },
  dirt_dry:        { muLong: 0.86, muLat: 0.80, rollingResistance: 0.032, deformDepth: 0.05, bulldozeCoefficient: 0.45, pacejka: PACEJKA_GRAVEL, particle: "dust",   tyreWearRate: 1.10 },
  dirt_wet:        { muLong: 0.62, muLat: 0.56, rollingResistance: 0.048, deformDepth: 0.09, bulldozeCoefficient: 0.60, pacejka: PACEJKA_GRAVEL, particle: "mud",    tyreWearRate: 0.90 },
  mud:             { muLong: 0.52, muLat: 0.46, rollingResistance: 0.085, deformDepth: 0.18, bulldozeCoefficient: 0.85, pacejka: PACEJKA_GRAVEL, particle: "mud",    tyreWearRate: 0.60 },
  grass_dry:       { muLong: 0.62, muLat: 0.58, rollingResistance: 0.050, deformDepth: 0.03, bulldozeCoefficient: 0.30, pacejka: PACEJKA_GRAVEL, particle: "grass",  tyreWearRate: 0.80 },
  grass_wet:       { muLong: 0.45, muLat: 0.40, rollingResistance: 0.055, deformDepth: 0.04, bulldozeCoefficient: 0.35, pacejka: PACEJKA_GRAVEL, particle: "grass",  tyreWearRate: 0.60 },
  sand:            { muLong: 0.66, muLat: 0.58, rollingResistance: 0.110, deformDepth: 0.15, bulldozeCoefficient: 0.95, pacejka: PACEJKA_GRAVEL, particle: "sand",   tyreWearRate: 1.70 },
  snow_packed:     { muLong: 0.42, muLat: 0.38, rollingResistance: 0.035, deformDepth: 0.02, bulldozeCoefficient: 0.25, pacejka: PACEJKA_SNOW,   particle: "snow",   tyreWearRate: 0.50 },
  snow_deep:       { muLong: 0.34, muLat: 0.30, rollingResistance: 0.095, deformDepth: 0.22, bulldozeCoefficient: 0.90, pacejka: PACEJKA_SNOW,   particle: "snow",   tyreWearRate: 0.55 },
  ice:             { muLong: 0.16, muLat: 0.14, rollingResistance: 0.020, deformDepth: 0.00, bulldozeCoefficient: 0.00, pacejka: PACEJKA_ICE,    particle: "none",   tyreWearRate: 0.30 },
  water_shallow:   { muLong: 0.48, muLat: 0.42, rollingResistance: 0.130, deformDepth: 0.00, bulldozeCoefficient: 0.00, pacejka: PACEJKA_GRAVEL, particle: "splash", tyreWearRate: 0.40 },
  bridge_plank:    { muLong: 0.94, muLat: 0.88, rollingResistance: 0.020, deformDepth: 0.00, bulldozeCoefficient: 0.00, pacejka: PACEJKA_TARMAC, particle: "none",   tyreWearRate: 1.00 },
  cattle_grid:     { muLong: 0.80, muLat: 0.72, rollingResistance: 0.030, deformDepth: 0.00, bulldozeCoefficient: 0.00, pacejka: PACEJKA_TARMAC, particle: "none",   tyreWearRate: 1.30 },
  cobble:          { muLong: 0.95, muLat: 0.90, rollingResistance: 0.024, deformDepth: 0.00, bulldozeCoefficient: 0.00, pacejka: PACEJKA_TARMAC, particle: "none",   tyreWearRate: 1.25 },
};

export const SURFACE_BLEND_DISTANCE = 0.35; // metres of travel
export const SURFACE_BLEND_MIN_TIME = 0.06; // seconds

// ---------------------------------------------------------------------------
// COMPOUND AND WEATHER MODIFIERS
// ---------------------------------------------------------------------------

export const COMPOUND_FACTORS = {
  tarmac_slick: { tarmac: 1.00, gravel: 0.62, snow: 0.55, ice: 0.50 },
  gravel:       { tarmac: 0.78, gravel: 1.00, snow: 0.82, ice: 0.70 },
  snow_studded: { tarmac: 0.60, gravel: 0.85, snow: 1.00, ice: 2.30 },
} as const;

export const WEATHER = {
  clear:      { muFactor: 1.00, visibility: 1.00 },
  overcast:   { muFactor: 1.00, visibility: 0.92 },
  lightRain:  { muFactor: 0.88, visibility: 0.78 },
  heavyRain:  { muFactor: 0.74, visibility: 0.55 },
  fog:        { muFactor: 0.94, visibility: 0.30 },
  snowfall:   { muFactor: 0.70, visibility: 0.60 },
  night:      { muFactor: 1.00, visibility: 1.00, lowBeamRange: 70, highBeamRange: 140 },
} as const;

export const WEATHER_TRANSITION_SECONDS = 45;

// ---------------------------------------------------------------------------
// VEHICLE
// ---------------------------------------------------------------------------

export const VEHICLE = {
  mass: 1230,
  weightDistributionFront: 0.58,
  cogHeight: 0.52,
  wheelbase: 2.55,
  trackWidth: 1.60,
  inertiaYaw: 1750,
  inertiaRoll: 480,
  inertiaPitch: 1680,
  peakPowerW: 220_000,
  peakTorqueNm: 425,
  peakTorqueRpm: 3500,
  revLimit: 7200,
  gearCount: 5,
  shiftTimeMs: 60,
  centreDiffSplit: 0.50,
  lsdLockFront: 0.40,
  lsdLockRear: 0.65,
  dragCoefficient: 0.38,
  frontalArea: 2.10,
  downforceAt40ms: 180,
  loadSensitivity: 0.12,
  relaxationLengthTarmac: 0.30,
  relaxationLengthLoose: 0.45,
} as const;

export const SUSPENSION = {
  gravel: {
    travel: 0.20,
    springFront: 42_000, springRear: 38_000,      // N/m
    bumpDamping: 4200, reboundDamping: 6100,      // N.s/m
    arbFront: 620, arbRear: 480,                  // Nm/deg
    bumpStopZone: 0.030, bumpStopRateMultiplier: 6,
  },
  tarmac: {
    travel: 0.08,
    springFront: 88_000, springRear: 76_000,
    bumpDamping: 6800, reboundDamping: 9200,
    arbFront: 1450, arbRear: 1100,
    bumpStopZone: 0.015, bumpStopRateMultiplier: 8,
  },
  bumpStopImpactVelocity: 3.5, // m/s, above this counts as a damage event
} as const;

export const STEERING = {
  maxLockGravelDeg: 35,
  maxLockTarmacDeg: 28,
  speedSensitiveFactor: 0.55,
  speedSensitiveReference: 55, // m/s
  rackSpeedDegPerSec: 420,
  counterSteerAssistMax: 0.25,
} as const;

export const BRAKES = {
  torqueFront: 3200,
  torqueRear: 1900,
  biasFrontMin: 0.58,
  biasFrontMax: 0.68,
  lockedGripLossLong: 0.22,
  lockedGripLossLat: 0.45,
  fadeStartTempC: 620,
  fadeEndTempC: 780,
  fadeTorqueAtEnd: 0.62,
  coolingRateCPerSecAt30ms: 0.8,
  handbrakeLockTime: 0.12,
  handbrakeRearLatMultiplier: 0.85,
} as const;

// ---------------------------------------------------------------------------
// AIR AND LANDING
// ---------------------------------------------------------------------------

export const AIR = {
  jumpCrestRadiusThreshold: 45,   // vertical radius below this becomes a jump
  maxIntendedAirtime: 1.8,
  designErrorAirtime: 2.4,
  pitchAuthorityDegPerSec: 14,
  yawAuthorityDegPerSec: 9,
  rollAuthorityDegPerSec: 4,
  rollAuthorityMinAirtime: 0.6,
  authorityDecayAfter: 1.5,
  authorityDecayFactor: 0.40,
  landingClearanceSeconds: 2.2,
} as const;

export const LANDING_BANDS = [
  { maxPitchDeg: 5,   maxVertMs: 6,  speedLoss: [0.00, 0.00], damage: "none" },
  { maxPitchDeg: 15,  maxVertMs: 8,  speedLoss: [0.03, 0.06], damage: "none" },
  { maxPitchDeg: 30,  maxVertMs: 11, speedLoss: [0.10, 0.18], damage: "suspension_roll" },
  { maxPitchDeg: 30,  maxVertMs: Infinity, speedLoss: [0.18, 0.30], damage: "suspension_guaranteed" },
  { maxPitchDeg: Infinity, maxVertMs: Infinity, speedLoss: [0.35, 0.80], damage: "severe" },
] as const;

export const ROLLOVER = {
  triggerRollDeg: 68,
  onRoofResetDelay: 2.5,
  rockRecoveryWindow: 4.0,
} as const;

// ---------------------------------------------------------------------------
// COLLISIONS
// ---------------------------------------------------------------------------

export enum Tier {
  Cosmetic = 0,
  Yielding = 1,
  Deformable = 2,
  HeavyMovable = 3,
  HardStatic = 4,
}

export const SCRAPE_FRICTION = {
  steel_guardrail: 0.12,
  timber: 0.20,
  concrete: 0.24,
  stone: 0.28,
  tree_bark: 0.35,
  earth_bank: 0.42,
} as const;

export const INCIDENCE_BANDS = [
  { maxAngleDeg: 12, name: "graze",   speedLoss: [0.02, 0.05], maxYawDeg: 2,  damage: "cosmetic" },
  { maxAngleDeg: 25, name: "scrape",  speedLoss: [0.06, 0.12], maxYawDeg: 8,  damage: "panel" },
  { maxAngleDeg: 45, name: "glance",  speedLoss: [0.15, 0.30], maxYawDeg: 25, damage: "mechanical_roll" },
  { maxAngleDeg: 70, name: "impact",  speedLoss: [0.40, 0.70], maxYawDeg: 90, damage: "energy" },
  { maxAngleDeg: 90, name: "headOn",  speedLoss: [0.85, 1.00], maxYawDeg: 90, damage: "energy" },
] as const;

export const DAMAGE_ENERGY_BANDS_J = [
  { max: 5_000,   klass: "cosmetic" },
  { max: 25_000,  klass: "panel" },
  { max: 60_000,  klass: "mechanical_minor" },
  { max: 120_000, klass: "major" },
  { max: Infinity, klass: "terminal" },
] as const;

// ---------------------------------------------------------------------------
// WATER
// ---------------------------------------------------------------------------

export const WATER = {
  density: 1000,
  dragCoefficient: 0.90,
  buoyancyEngageFraction: 0.40,
  wheelContactLostFraction: 0.65,
  stallDelayAfterSubmerge: 1.2,
  drowningTimer: 3.0,
  fordMaxEntryAngleDeg: 20,
  fordDestabilisingImpulseFactor: 0.25,
  fordNoseLiftSpeedMs: 25,      // ~90 km/h
  fordMaxExitGradient: 0.14,
  aquaplaneConstant: 3.2,        // v = k * sqrt(P_kPa)
  aquaplaneMu: 0.10,
  aquaplaneOnsetTime: 0.4,
  depthBands: [
    { max: 0.05, muFactor: 0.92, speedBleedPerSec: 0.00 },
    { max: 0.15, muFactor: 0.80, speedBleedPerSec: 0.03 },
    { max: 0.35, muOverride: 0.48, speedBleedPerSec: 0.10, steeringFactor: 0.75 },
    { max: 0.60, muOverride: 0.38, speedBleedPerSec: 0.22, steeringFactor: 0.55 },
    { max: Infinity, outOfBounds: true },
  ],
} as const;

// ---------------------------------------------------------------------------
// WORLD AUTHORING
// ---------------------------------------------------------------------------

export const CORRIDOR = {
  gravel: { roadbedMin: 4.5, roadbedMax: 7.0, shoulderMin: 1.5, shoulderMax: 4.0, tier4Clearance: 2.5 },
  tarmac: { roadbedMin: 5.5, roadbedMax: 8.0, shoulderMin: 0.8, shoulderMax: 2.5, tier4Clearance: 2.0 },
  snow:   { roadbedMin: 5.0, roadbedMax: 7.5, shoulderMin: 2.0, shoulderMax: 5.0, tier4Clearance: 2.5 },
  absoluteMinWidth: 3.6,
  hairpinMaxWidth: 12.0,
  sightLineSeconds: 2.6,
} as const;

export const CORNER_GRADES = [
  { grade: 6, minRadius: 200, call: "flat",    entrySpeedKmh: [160, 999], runoff: 1.5 },
  { grade: 5, minRadius: 120, call: "fast",    entrySpeedKmh: [130, 160], runoff: 2.5 },
  { grade: 4, minRadius: 80,  call: "medium",  entrySpeedKmh: [100, 130], runoff: 3.0 },
  { grade: 3, minRadius: 50,  call: "slow",    entrySpeedKmh: [75, 100],  runoff: 3.5 },
  { grade: 2, minRadius: 30,  call: "acute",   entrySpeedKmh: [50, 75],   runoff: 4.0 },
  { grade: 1, minRadius: 0,   call: "hairpin", entrySpeedKmh: [30, 50],   runoff: 5.0 },
] as const;

export const TERRAIN_LIMITS = {
  climbSustained: 0.22,
  climbShort: 0.30,
  descentSustained: 0.25,
  descentShort: 0.34,
  camberMax: 0.08,
  crestVerticalRadiusMin: 45,
  traversableSlopeDeg: 35,
} as const;

export const RUTS = {
  maxDepth: 0.12,
  latGripBonus: 0.06,
  steeringAuthorityPenalty: 0.15,
  escapeForceFactor: 0.35,
  crossingImpulseFactor: 0.18,
  crossingImpulseDuration: 0.08,
  crossingAngleThresholdDeg: 20,
} as const;

// ---------------------------------------------------------------------------
// FLORA AND SCATTER
// ---------------------------------------------------------------------------

export const FLORA_TIERS = [
  { name: "grass_fern",    maxDiameter: 0.00, tier: Tier.Cosmetic,     speedLoss: [0.00, 0.00] },
  { name: "sapling_bush",  maxDiameter: 0.12, tier: Tier.Yielding,     speedLoss: [0.01, 0.03] },
  { name: "large_bush",    maxDiameter: 0.20, tier: Tier.Deformable,   speedLoss: [0.06, 0.14], maxYawDeg: 4 },
  { name: "young_tree",    maxDiameter: 0.28, tier: Tier.HeavyMovable, massRange: [180, 400] },
  { name: "mature_tree",   maxDiameter: Infinity, tier: Tier.HardStatic },
] as const;

export const FLORA_PLACEMENT = {
  minTrunkSpacing: 1.2,
  canopyMinClearance: 3.2,
  apexOcclusionCheckDistance: 80,
} as const;

/** Objects per 100 m^2 outside the roadbed, indexed [tier0, tier1, tier2, tier3, tier4]. */
export const BIOME_SCATTER_DENSITY = {
  alpine_forest:       [40, 6.0, 2.0, 0.80, 1.60],
  nordic_pine:         [25, 3.5, 1.2, 0.60, 2.20],
  mediterranean_scrub: [55, 9.0, 3.0, 0.30, 0.40],
  farmland:            [70, 2.0, 0.8, 0.10, 0.20],
  desert_wash:         [12, 1.5, 0.5, 0.05, 0.10],
  moorland:            [60, 1.0, 0.3, 0.02, 0.05],
} as const;

// ---------------------------------------------------------------------------
// FAUNA
// ---------------------------------------------------------------------------

export const FAUNA = {
  ambientFleeDistance: 40,
  crossingVisibleSeconds: 2.5,
  crossingClearSeconds: 1.8,
  crossingEventsPerKm: 1 / 1.5,
  crossingSpeedLoss: 0.08,
  crossingYawDisturbanceDeg: 4,
  spectatorMinDistanceFromRoad: 3.0,
  spectatorFleeLookaheadSeconds: 1.2,
  spectatorFleeRadius: 4.0,
  allowGore: false,
  allowTerminalDamageFromFauna: false,
} as const;

// ---------------------------------------------------------------------------
// STRUCTURES
// ---------------------------------------------------------------------------

export const STRUCTURES = {
  hay_bale_round:        { tier: Tier.Deformable,   mass: 320, restitution: 0.10 },
  straw_bale_rect:       { tier: Tier.Deformable,   mass: 180, restitution: 0.05 },
  plastic_barrier_empty: { tier: Tier.Deformable,   mass: 45,  restitution: 0.15 },
  plastic_barrier_full:  { tier: Tier.HeavyMovable, mass: 480, restitution: 0.10 },
  wooden_fence_panel:    { tier: Tier.Deformable,   mass: 60,  restitution: 0.05, breakInto: [4, 7] },
  stone_wall:            { tier: Tier.HardStatic,   mass: 0,   restitution: 0.20 },
  concrete_block:        { tier: Tier.HardStatic,   mass: 0,   restitution: 0.22 },
  wooden_post_marker:    { tier: Tier.Yielding,     mass: 12,  restitution: 0.05 },
  metal_signpost:        { tier: Tier.HeavyMovable, mass: 90,  restitution: 0.18 },
  telegraph_pole:        { tier: Tier.HardStatic,   mass: 0,   restitution: 0.20, minRoadClearance: 4.0 },
  house_wall:            { tier: Tier.HardStatic,   mass: 0,   restitution: 0.18, minRoadClearance: 4.0 },
  house_window:          { tier: Tier.Deformable,   mass: 8,   restitution: 0.05 },
  barn_door:             { tier: Tier.Deformable,   mass: 70,  restitution: 0.08 },
  water_trough:          { tier: Tier.HeavyMovable, mass: 220, restitution: 0.12 },
  tyre_stack:            { tier: Tier.Deformable,   mass: 110, restitution: 0.35 },
  guardrail_steel:       { tier: Tier.HardStatic,   mass: 0,   restitution: 0.25 },
  chevron_board:         { tier: Tier.Yielding,     mass: 15,  restitution: 0.05 },
} as const;

export const BRIDGE = {
  extraWidthOverRoadbed: 0.6,
  straightApproachMin: 25,
  maxDeckLip: 0.08,
  lipRampLength: 0.4,
  guardrailHeight: 0.90,
  maxRailGap: 0.25,
  offDeckResetDelay: 2.0,
} as const;

export const TUNNEL = {
  extraWidthOverRoadbed: 1.2,
  minHeight: 4.5,
  wallRestitution: 0.20,
  baseChamfer: 0.35,
  reverbTransitionDistance: 3.0,
  exposureAdaptInSeconds: 0.8,
  exposureAdaptOutSeconds: 0.5,
  maxUnlitLength: 180,
} as const;

// ---------------------------------------------------------------------------
// RESET AND PENALTIES
// ---------------------------------------------------------------------------

export const RESET = {
  onRoofDelay: 2.5,
  submergedDelay: 3.0,
  outOfBoundsDelay: 2.0,
  offDeckDelay: 2.0,
  playerRequestedDelay: 0.5,
  stuckDelay: 6.0,
  stuckSpeedThreshold: 0.5,
  immunitySeconds: 2.5,
  penaltySeconds: { casual: 5, standard: 10, career: 20 },
  nodeSpacingMax: 120,
  repairsDamage: false,
} as const;

export const CUTTING = {
  wheelsOffThreshold: 3,
  durationThreshold: 1.2,
  penaltyFirst: 2,
  penaltyThird: 5,
} as const;

// ---------------------------------------------------------------------------
// PACENOTES
// ---------------------------------------------------------------------------

export const PACENOTES = {
  callLeadSeconds: 3.2,
  callLeadMinDistance: 45,
  callLeadMaxDistance: 180,
  modifierPriority: ["caution", "dont_cut", "over_crest", "into", "long", "tightens", "opens", "bumpy"],
  silenceDuringImpactSeconds: 1.5,
} as const;

// ---------------------------------------------------------------------------
// PERFORMANCE BUDGETS
// ---------------------------------------------------------------------------

export const BUDGETS = {
  frameTimeTargetMs: 8.3,
  frameTimeFloorMs: 16.6,
  physicsTimeMaxMs: 2.5,
  activeRigidBodiesMax: 400,
  activeCollidersWithin150mMax: 1200,
  drawCallsMax: 900,
  trianglesMax: 4_500_000,
  textureMemoryMB: 2200,
  streamAheadMetres: 600,
  streamBehindMetres: 250,
  lod: [
    { maxDistance: 60,  colliders: "full_active",    visual: "LOD0" },
    { maxDistance: 150, colliders: "full_sleeping",  visual: "LOD1" },
    { maxDistance: 300, colliders: "static_only",    visual: "LOD2" },
    { maxDistance: 600, colliders: "none",           visual: "LOD3_instanced" },
    { maxDistance: Infinity, colliders: "none",      visual: "impostor_or_culled" },
  ],
} as const;

// ---------------------------------------------------------------------------
// STAGE VALIDATION
// ---------------------------------------------------------------------------

export const STAGE_LINT = {
  minLengthMetres: 3500,
  maxLengthMetres: 22_000,
  maxSingleGradeShare: 0.40,
  maxMuStepWithoutBlend: 0.15,
  referenceLapMaxImpactEnergyJ: 8000,
  resetNodeSpacingMax: 120,
} as const;

// ---------------------------------------------------------------------------
// SEEDED RNG CHANNELS
// ---------------------------------------------------------------------------

export const RNG_CHANNELS = ["scatter", "weather", "ambient", "damageRoll"] as const;
export type RngChannel = (typeof RNG_CHANNELS)[number];
