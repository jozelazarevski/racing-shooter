/**
 * biomes.constants.ts
 * Machine-readable mirror of RALLY_WORLD_BIBLE.md.
 * Pairs with rally.constants.ts (physics). The bible is normative.
 * Any disagreement between this file and the document is a bug in this file.
 */

// ---------------------------------------------------------------------------
// GLOBAL
// ---------------------------------------------------------------------------

export const REFERENCE_CAR_DIMENSIONS = { length: 4.10, width: 1.82, height: 1.36 } as const;

export const BUILD_ORDER = [
  "heightfield",
  "centreline",
  "roadbed",
  "surface_paint",
  "hydrology",
  "structures",
  "flora",
  "props",
  "fauna",
  "lighting",
  "lint",
] as const;

export const CAMERA = {
  chaseFovStatic: 68,
  chaseFovAtMaxSpeed: 82,
  chaseFovSpeedReference: 55,
  bonnetFov: 72,
  exposureAdaptSeconds: 0.9,
  exposureClampEV: 1.5,
  motionBlurShutterDeg: 180,
  motionBlurMinSpeed: 8,
  depthOfFieldInGameplay: false,
  bloomThreshold: 1.6,
  bloomIntensity: 0.35,
  chromaticAberration: 0.0,
  filmGrainMax: 0.02,
  sharpening: 0.25,
} as const;

// ---------------------------------------------------------------------------
// MATERIALS
// ---------------------------------------------------------------------------

export interface MaterialDef {
  albedo: string;
  roughness: number;
  metallic: number;
}

export const MATERIALS: Record<string, MaterialDef> = {
  tarmac_new:        { albedo: "#2E2E30", roughness: 0.82, metallic: 0.00 },
  tarmac_worn:       { albedo: "#3A3A38", roughness: 0.88, metallic: 0.00 },
  gravel_road:       { albedo: "#8A7E6C", roughness: 0.94, metallic: 0.00 },
  dirt_packed:       { albedo: "#6E5A42", roughness: 0.93, metallic: 0.00 },
  mud_wet:           { albedo: "#453424", roughness: 0.42, metallic: 0.00 },
  sand_fine:         { albedo: "#C9A472", roughness: 0.96, metallic: 0.00 },
  red_dirt:          { albedo: "#A8492C", roughness: 0.95, metallic: 0.00 },
  black_sand:        { albedo: "#26231F", roughness: 0.90, metallic: 0.00 },
  snow_fresh:        { albedo: "#EEF2F6", roughness: 0.72, metallic: 0.00 },
  snow_packed_mat:   { albedo: "#DCE3EA", roughness: 0.60, metallic: 0.00 },
  ice_black:         { albedo: "#4A5258", roughness: 0.18, metallic: 0.00 },
  stone_granite:     { albedo: "#7A7770", roughness: 0.85, metallic: 0.00 },
  stone_limestone:   { albedo: "#B5AC98", roughness: 0.88, metallic: 0.00 },
  stone_rubble_wall: { albedo: "#8E8578", roughness: 0.90, metallic: 0.00 },
  pise_earth:        { albedo: "#C08A55", roughness: 0.92, metallic: 0.00 },
  render_limewash:   { albedo: "#E0D6C0", roughness: 0.86, metallic: 0.00 },
  timber_weathered:  { albedo: "#6B5641", roughness: 0.88, metallic: 0.00 },
  timber_painted:    { albedo: "#6E2A26", roughness: 0.74, metallic: 0.00 },
  slate_roof:        { albedo: "#4A4E52", roughness: 0.68, metallic: 0.00 },
  terracotta_tile:   { albedo: "#B5623A", roughness: 0.80, metallic: 0.00 },
  corrugated_iron:   { albedo: "#8E8478", roughness: 0.55, metallic: 0.85 },
  corrugated_painted:{ albedo: "#B8402E", roughness: 0.50, metallic: 0.60 },
  thatch:            { albedo: "#A88B52", roughness: 0.95, metallic: 0.00 },
  concrete_cast:     { albedo: "#9A9894", roughness: 0.86, metallic: 0.00 },
  steel_guardrail:   { albedo: "#9EA2A4", roughness: 0.42, metallic: 0.90 },
  glass_window:      { albedo: "#1A2028", roughness: 0.08, metallic: 0.00 },
  rust_heavy:        { albedo: "#7A4326", roughness: 0.92, metallic: 0.55 },
  cobble_wet:        { albedo: "#3E3C3A", roughness: 0.32, metallic: 0.00 },
};

// ---------------------------------------------------------------------------
// ARCHITECTURE
// ---------------------------------------------------------------------------

export interface HouseArchetype {
  name: string;
  footprint: [number, number];
  storeys: number;
  floorHeight: number;
  raisedOn?: number;
  roofPitchDeg: number;
  roofMaterial: string;
  wallMaterial: string;
  windowSize: [number, number] | null;
  bayCount: number;
  overhang: number;
  accent: string;
  region: string[];
}

export const SETTLEMENT = {
  minSetbackFromRoadbed: 4.0,
  bufferRequiredWithin: 6.0,
  gateMinClearWidth: 4.5,
  gateStraightApproach: 20,
  landmarkSpacing: 200,
  maxContinuousFrontage: 120,
  maxShareOfStageLength: 0.18,
  windowSillHeight: 0.95,
  windowHeadBelowCeiling: 0.35,
} as const;

export const HOUSE_ARCHETYPES: Record<string, HouseArchetype> = {
  H_ALP_CHALET:    { name: "Alpine chalet",         footprint: [9.5, 7.5],  storeys: 2, floorHeight: 2.6, roofPitchDeg: 22, roofMaterial: "timber_weathered", wallMaterial: "stone_granite",     windowSize: [1.1, 1.3], bayCount: 4, overhang: 1.20, accent: "#C4362C", region: ["alpine_pass"] },
  H_ALP_STADEL:    { name: "Hay barn on stilts",    footprint: [7.0, 5.5],  storeys: 1, floorHeight: 3.0, raisedOn: 0.9, roofPitchDeg: 18, roofMaterial: "timber_weathered", wallMaterial: "timber_weathered", windowSize: null, bayCount: 0, overhang: 0.60, accent: "#6B5641", region: ["alpine_pass"] },
  H_OAS_KASBAH:    { name: "Pise courtyard house",  footprint: [12.0, 12.0],storeys: 2, floorHeight: 2.8, roofPitchDeg: 2,  roofMaterial: "pise_earth",        wallMaterial: "pise_earth",        windowSize: [0.6, 0.9], bayCount: 3, overhang: 0.25, accent: "#2E6E7E", region: ["mountain_oasis"] },
  H_OAS_TOWER:     { name: "Corner granary tower",  footprint: [4.5, 4.5],  storeys: 3, floorHeight: 2.6, roofPitchDeg: 0,  roofMaterial: "pise_earth",        wallMaterial: "pise_earth",        windowSize: [0.4, 0.6], bayCount: 1, overhang: 0.20, accent: "#C08A55", region: ["mountain_oasis"] },
  H_DES_OUTPOST:   { name: "Mud brick outpost",     footprint: [8.0, 6.0],  storeys: 1, floorHeight: 2.8, roofPitchDeg: 3,  roofMaterial: "pise_earth",        wallMaterial: "pise_earth",        windowSize: [0.7, 0.8], bayCount: 2, overhang: 0.30, accent: "#D8D2C4", region: ["deep_desert"] },
  H_DES_TENT:      { name: "Nomad tent",            footprint: [9.0, 5.0],  storeys: 1, floorHeight: 2.6, roofPitchDeg: 12, roofMaterial: "thatch",            wallMaterial: "thatch",            windowSize: null, bayCount: 0, overhang: 1.00, accent: "#C0532E", region: ["deep_desert"] },
  H_AMZ_STILT:     { name: "Stilt house",           footprint: [8.0, 6.0],  storeys: 1, floorHeight: 2.6, raisedOn: 1.8, roofPitchDeg: 26, roofMaterial: "corrugated_iron",  wallMaterial: "timber_weathered", windowSize: [0.9, 1.1], bayCount: 3, overhang: 0.70, accent: "#C25A2E", region: ["amazon_forest"] },
  H_NOR_FARM:      { name: "Falu red farmhouse",    footprint: [11.0, 7.0], storeys: 2, floorHeight: 2.5, roofPitchDeg: 38, roofMaterial: "terracotta_tile",   wallMaterial: "timber_painted",    windowSize: [1.0, 1.2], bayCount: 5, overhang: 0.55, accent: "#F2F4F6", region: ["nordic_winter"] },
  H_MED_CORTIJO:   { name: "Limewash cottage",      footprint: [10.0, 8.0], storeys: 2, floorHeight: 2.7, roofPitchDeg: 20, roofMaterial: "terracotta_tile",   wallMaterial: "render_limewash",   windowSize: [0.9, 1.1], bayCount: 3, overhang: 0.45, accent: "#C0532E", region: ["med_terrace"] },
  H_URB_TOWNHOUSE: { name: "Old town row unit",     footprint: [6.5, 11.0], storeys: 4, floorHeight: 2.7, roofPitchDeg: 45, roofMaterial: "slate_roof",        wallMaterial: "render_limewash",   windowSize: [1.0, 1.8], bayCount: 3, overhang: 0.35, accent: "#F2A93B", region: ["old_town_night"] },
  H_FRM_LONGHOUSE: { name: "Stone longhouse",       footprint: [14.0, 6.0], storeys: 2, floorHeight: 2.4, roofPitchDeg: 42, roofMaterial: "slate_roof",        wallMaterial: "stone_rubble_wall", windowSize: [0.8, 1.0], bayCount: 4, overhang: 0.30, accent: "#2F4A3C", region: ["farmland_hedgerow"] },
  H_VOL_CORRUGATE: { name: "Corrugated house",      footprint: [8.5, 7.0],  storeys: 1, floorHeight: 2.6, roofPitchDeg: 30, roofMaterial: "corrugated_painted",wallMaterial: "corrugated_iron",   windowSize: [1.0, 1.2], bayCount: 3, overhang: 0.40, accent: "#B8402E", region: ["volcanic_highland"] },
  H_OUT_HOMESTEAD: { name: "Veranda homestead",     footprint: [16.0, 10.0],storeys: 1, floorHeight: 3.0, roofPitchDeg: 15, roofMaterial: "corrugated_iron",   wallMaterial: "timber_weathered",  windowSize: [1.0, 1.4], bayCount: 6, overhang: 2.70, accent: "#2E6B5A", region: ["outback_red"] },
  S_UNI_SERVICE:   { name: "Service park tent",     footprint: [12.0, 8.0], storeys: 1, floorHeight: 3.2, roofPitchDeg: 4,  roofMaterial: "thatch",            wallMaterial: "thatch",            windowSize: null, bayCount: 0, overhang: 1.50, accent: "#F2A93B", region: ["*"] },
  S_UNI_FUEL:      { name: "Roadside fuel stop",    footprint: [10.0, 6.0], storeys: 1, floorHeight: 3.0, roofPitchDeg: 2,  roofMaterial: "concrete_cast",     wallMaterial: "render_limewash",   windowSize: [2.0, 1.6], bayCount: 2, overhang: 2.00, accent: "#C4362C", region: ["*"] },
  S_UNI_CHAPEL:    { name: "Wayside chapel",        footprint: [5.0, 7.0],  storeys: 1, floorHeight: 4.2, roofPitchDeg: 40, roofMaterial: "slate_roof",        wallMaterial: "render_limewash",   windowSize: [0.7, 1.6], bayCount: 2, overhang: 0.40, accent: "#E8E4DC", region: ["*"] },
};

// ---------------------------------------------------------------------------
// REGIONS
// ---------------------------------------------------------------------------

export interface RegionPalette {
  skyZenith: string;
  skyHorizon: string;
  groundBase: string;
  foliageMid: string;
  structurePrimary: string;
  accent: string;
}

export interface RegionLighting {
  sunElevationDeg: number;
  sunAzimuthDeg: number;
  colourTemperatureK: number;
  directionalLux: number;
  ambientIntensity: number;
  shadowSoftnessDeg: number;
  fogDensity: number;
  fogColour: string;
  baseEV100: number;
}

export interface RegionFloraEntry {
  species: string;
  tier: 0 | 1 | 2 | 3 | 4;
  heightRange: [number, number];
  trunkDiameter: number | null;
  weight: number;
}

export interface RegionDef {
  key: string;
  displayName: string;
  elevationRange: [number, number];
  elevationChangePerStage: [number, number];
  gradientRange: [number, number];
  cornerGradeDistribution: [number, number, number, number, number, number]; // G1..G6
  surfaceMix: Record<string, number>;
  roadbedWidth: [number, number];
  palette: RegionPalette;
  lighting: RegionLighting;
  flora: RegionFloraEntry[];
  archetypes: string[];
  weatherStates: string[];
  averageSpeedKmh: number;
  sightLineMetres: number;
  fordCountPerStage: [number, number];
  neverList: string[];
}

export const REGIONS: Record<string, RegionDef> = {
  alpine_pass: {
    key: "alpine_pass",
    displayName: "Alpine Pass",
    elevationRange: [900, 1850],
    elevationChangePerStage: [550, 900],
    gradientRange: [0.08, 0.18],
    cornerGradeDistribution: [0.18, 0.24, 0.26, 0.18, 0.10, 0.04],
    surfaceMix: { tarmac_patched: 0.55, tarmac_dry: 0.25, gravel_hardpack: 0.15, cobble: 0.05 },
    roadbedWidth: [5.5, 7.0],
    palette: { skyZenith: "#2C6FBF", skyHorizon: "#A9C8E6", groundBase: "#6E6A5E", foliageMid: "#33452C", structurePrimary: "#6B5641", accent: "#C4362C" },
    lighting: { sunElevationDeg: 38, sunAzimuthDeg: 130, colourTemperatureK: 5600, directionalLux: 95000, ambientIntensity: 0.35, shadowSoftnessDeg: 2.5, fogDensity: 0.00035, fogColour: "#B4C6D8", baseEV100: 14.2 },
    flora: [
      { species: "spruce_mature", tier: 4, heightRange: [18, 26], trunkDiameter: 0.42, weight: 0.34 },
      { species: "spruce_young",  tier: 3, heightRange: [6, 11],  trunkDiameter: 0.23, weight: 0.18 },
      { species: "larch",         tier: 4, heightRange: [15, 22], trunkDiameter: 0.36, weight: 0.14 },
      { species: "rhododendron",  tier: 2, heightRange: [0.9, 0.9], trunkDiameter: null, weight: 0.16 },
      { species: "heath_mat",     tier: 0, heightRange: [0.3, 0.3], trunkDiameter: null, weight: 0.12 },
      { species: "meadow_grass",  tier: 0, heightRange: [0.4, 0.4], trunkDiameter: null, weight: 0.06 },
    ],
    archetypes: ["H_ALP_CHALET", "H_ALP_STADEL", "S_UNI_CHAPEL"],
    weatherStates: ["clear", "overcast", "lightRain"],
    averageSpeedKmh: 105,
    sightLineMetres: 90,
    fordCountPerStage: [0, 0],
    neverList: ["trees within 6m of the exposed edge", "guardrails on hairpins", "guardrail runs over 80m", "snow below 1400m in summer"],
  },

  mountain_oasis: {
    key: "mountain_oasis",
    displayName: "Mountain Oasis",
    elevationRange: [1200, 2100],
    elevationChangePerStage: [400, 700],
    gradientRange: [0.06, 0.14],
    cornerGradeDistribution: [0.14, 0.20, 0.24, 0.22, 0.14, 0.06],
    surfaceMix: { gravel_hardpack: 0.40, dirt_dry: 0.30, tarmac_patched: 0.20, cobble: 0.10 },
    roadbedWidth: [4.8, 6.5],
    palette: { skyZenith: "#3F86C4", skyHorizon: "#E4CFA8", groundBase: "#B5793F", foliageMid: "#4B6B2E", structurePrimary: "#C08A55", accent: "#2E6E7E" },
    lighting: { sunElevationDeg: 62, sunAzimuthDeg: 95, colourTemperatureK: 5100, directionalLux: 118000, ambientIntensity: 0.42, shadowSoftnessDeg: 1.2, fogDensity: 0.00055, fogColour: "#DCC9A6", baseEV100: 15.4 },
    flora: [
      { species: "date_palm",     tier: 4, heightRange: [12, 18], trunkDiameter: 0.42, weight: 0.22 },
      { species: "palm_young",    tier: 3, heightRange: [4, 7],   trunkDiameter: 0.28, weight: 0.10 },
      { species: "olive_gnarled", tier: 4, heightRange: [5, 8],   trunkDiameter: 0.70, weight: 0.14 },
      { species: "fig_pomegranate", tier: 3, heightRange: [3, 5], trunkDiameter: 0.22, weight: 0.12 },
      { species: "oleander",      tier: 2, heightRange: [1.8, 1.8], trunkDiameter: null, weight: 0.16 },
      { species: "tamarisk",      tier: 1, heightRange: [1.2, 1.2], trunkDiameter: null, weight: 0.14 },
      { species: "barley_crop",   tier: 0, heightRange: [0.7, 0.7], trunkDiameter: null, weight: 0.12 },
    ],
    archetypes: ["H_OAS_KASBAH", "H_OAS_TOWER", "S_UNI_SERVICE"],
    weatherStates: ["clear", "overcast", "dustHaze"],
    averageSpeedKmh: 95,
    sightLineMetres: 120,
    fordCountPerStage: [3, 3],
    neverList: ["green grass", "temperate trees", "guardrails", "tarmac in villages", "buildings contrasting with local rock"],
  },

  deep_desert: {
    key: "deep_desert",
    displayName: "Deep Desert",
    elevationRange: [200, 600],
    elevationChangePerStage: [120, 250],
    gradientRange: [0.02, 0.07],
    cornerGradeDistribution: [0.04, 0.08, 0.14, 0.22, 0.28, 0.24],
    surfaceMix: { sand: 0.35, gravel_loose: 0.25, dirt_dry: 0.25, gravel_deep: 0.15 },
    roadbedWidth: [6.0, 9.0],
    palette: { skyZenith: "#2E7BC8", skyHorizon: "#F0D9AE", groundBase: "#C97A46", foliageMid: "#7A8455", structurePrimary: "#9C8B6E", accent: "#D8D2C4" },
    lighting: { sunElevationDeg: 71, sunAzimuthDeg: 20, colourTemperatureK: 5400, directionalLux: 128000, ambientIntensity: 0.48, shadowSoftnessDeg: 0.9, fogDensity: 0.00110, fogColour: "#E8D2AC", baseEV100: 16.1 },
    flora: [
      { species: "acacia_mature", tier: 4, heightRange: [6, 9], trunkDiameter: 0.38, weight: 0.10 },
      { species: "acacia_young",  tier: 3, heightRange: [3, 4], trunkDiameter: 0.18, weight: 0.12 },
      { species: "desert_scrub",  tier: 1, heightRange: [0.8, 0.8], trunkDiameter: null, weight: 0.38 },
      { species: "tussock_grass", tier: 0, heightRange: [0.5, 0.5], trunkDiameter: null, weight: 0.32 },
      { species: "dead_wood",     tier: 3, heightRange: [0.4, 0.9], trunkDiameter: 0.30, weight: 0.08 },
    ],
    archetypes: ["H_DES_OUTPOST", "H_DES_TENT", "S_UNI_FUEL"],
    weatherStates: ["clear", "lowSun", "dustStorm"],
    averageSpeedKmh: 145,
    sightLineMetres: 400,
    fordCountPerStage: [0, 1],
    neverList: ["green vegetation", "standing water outside the authored flood", "tarmac", "dense object clusters", "fog other than dust"],
  },

  amazon_forest: {
    key: "amazon_forest",
    displayName: "Amazon Rainforest",
    elevationRange: [60, 320],
    elevationChangePerStage: [90, 200],
    gradientRange: [0.03, 0.11],
    cornerGradeDistribution: [0.10, 0.18, 0.26, 0.24, 0.16, 0.06],
    surfaceMix: { dirt_wet: 0.35, mud: 0.25, dirt_dry: 0.20, gravel_loose: 0.15, water_shallow: 0.05 },
    roadbedWidth: [4.5, 6.0],
    palette: { skyZenith: "#7E9BA8", skyHorizon: "#C8D2C4", groundBase: "#4A3524", foliageMid: "#1E4A25", structurePrimary: "#7A6A4E", accent: "#C25A2E" },
    lighting: { sunElevationDeg: 74, sunAzimuthDeg: 175, colourTemperatureK: 6200, directionalLux: 110000, ambientIntensity: 0.55, shadowSoftnessDeg: 4.0, fogDensity: 0.00420, fogColour: "#C0CDBE", baseEV100: 11.8 },
    flora: [
      { species: "emergent_kapok",   tier: 4, heightRange: [35, 50], trunkDiameter: 1.20, weight: 0.06 },
      { species: "canopy_hardwood",  tier: 4, heightRange: [22, 34], trunkDiameter: 0.60, weight: 0.20 },
      { species: "understorey_tree", tier: 3, heightRange: [8, 15],  trunkDiameter: 0.25, weight: 0.16 },
      { species: "acai_palm",        tier: 3, heightRange: [10, 16], trunkDiameter: 0.20, weight: 0.12 },
      { species: "tree_fern",        tier: 2, heightRange: [2.0, 3.5], trunkDiameter: null, weight: 0.18 },
      { species: "liana_curtain",    tier: 1, heightRange: [2.0, 4.0], trunkDiameter: null, weight: 0.12 },
      { species: "ground_fern",      tier: 0, heightRange: [0.6, 0.6], trunkDiameter: null, weight: 0.16 },
    ],
    archetypes: ["H_AMZ_STILT", "S_UNI_SERVICE"],
    weatherStates: ["overcast", "heavyRain", "dawnMist"],
    averageSpeedKmh: 78,
    sightLineMetres: 70,
    fordCountPerStage: [2, 4],
    neverList: ["long sight lines", "open sky above the road outside stream crossings", "saturated greens", "dry dust", "stone construction"],
  },

  nordic_winter: {
    key: "nordic_winter",
    displayName: "Nordic Winter",
    elevationRange: [80, 340],
    elevationChangePerStage: [100, 220],
    gradientRange: [0.04, 0.12],
    cornerGradeDistribution: [0.06, 0.14, 0.22, 0.26, 0.22, 0.10],
    surfaceMix: { snow_packed: 0.55, ice: 0.20, snow_deep: 0.15, gravel_hardpack: 0.10 },
    roadbedWidth: [5.0, 7.5],
    palette: { skyZenith: "#4A6E9E", skyHorizon: "#DCE6EF", groundBase: "#E8EDF2", foliageMid: "#1F3328", structurePrimary: "#6E2A26", accent: "#F2F4F6" },
    lighting: { sunElevationDeg: 9, sunAzimuthDeg: 210, colourTemperatureK: 4200, directionalLux: 32000, ambientIntensity: 0.62, shadowSoftnessDeg: 3.5, fogDensity: 0.00095, fogColour: "#DCE6EF", baseEV100: 15.8 },
    flora: [
      { species: "scots_pine",    tier: 4, heightRange: [20, 28], trunkDiameter: 0.44, weight: 0.30 },
      { species: "spruce_snow",   tier: 4, heightRange: [14, 22], trunkDiameter: 0.37, weight: 0.26 },
      { species: "birch_bare",    tier: 3, heightRange: [8, 14],  trunkDiameter: 0.22, weight: 0.20 },
      { species: "pine_young",    tier: 3, heightRange: [4, 7],   trunkDiameter: 0.20, weight: 0.12 },
      { species: "buried_shrub",  tier: 1, heightRange: [0.7, 0.7], trunkDiameter: null, weight: 0.12 },
    ],
    archetypes: ["H_NOR_FARM", "S_UNI_SERVICE", "S_UNI_CHAPEL"],
    weatherStates: ["clear", "overcast", "snowfall"],
    averageSpeedKmh: 118,
    sightLineMetres: 160,
    fordCountPerStage: [0, 0],
    neverList: ["bare ground", "deciduous foliage in leaf", "guardrails", "saturated colours beyond falu red and marker orange"],
  },

  med_terrace: {
    key: "med_terrace",
    displayName: "Mediterranean Terrace",
    elevationRange: [60, 700],
    elevationChangePerStage: [250, 500],
    gradientRange: [0.05, 0.13],
    cornerGradeDistribution: [0.10, 0.18, 0.24, 0.24, 0.16, 0.08],
    surfaceMix: { tarmac_patched: 0.50, tarmac_dry: 0.30, gravel_hardpack: 0.12, cobble: 0.08 },
    roadbedWidth: [5.2, 7.0],
    palette: { skyZenith: "#2F7FD1", skyHorizon: "#DDD6BE", groundBase: "#B9A47E", foliageMid: "#6E7A4E", structurePrimary: "#E0D6C0", accent: "#C0532E" },
    lighting: { sunElevationDeg: 58, sunAzimuthDeg: 250, colourTemperatureK: 5300, directionalLux: 108000, ambientIntensity: 0.40, shadowSoftnessDeg: 1.4, fogDensity: 0.00060, fogColour: "#D8D0B8", baseEV100: 15.2 },
    flora: [
      { species: "olive_ancient",  tier: 4, heightRange: [5, 8],   trunkDiameter: 0.75, weight: 0.22 },
      { species: "olive_grove",    tier: 3, heightRange: [3, 5],   trunkDiameter: 0.24, weight: 0.18 },
      { species: "cork_oak",       tier: 4, heightRange: [9, 14],  trunkDiameter: 0.48, weight: 0.10 },
      { species: "umbrella_pine",  tier: 4, heightRange: [12, 18], trunkDiameter: 0.55, weight: 0.08 },
      { species: "cypress",        tier: 3, heightRange: [10, 16], trunkDiameter: 0.30, weight: 0.06 },
      { species: "maquis_scrub",   tier: 1, heightRange: [0.9, 1.5], trunkDiameter: null, weight: 0.24 },
      { species: "dry_grass",      tier: 0, heightRange: [0.5, 0.5], trunkDiameter: null, weight: 0.12 },
    ],
    archetypes: ["H_MED_CORTIJO", "S_UNI_CHAPEL", "S_UNI_FUEL"],
    weatherStates: ["clear", "overcast", "lightRain"],
    averageSpeedKmh: 122,
    sightLineMetres: 140,
    fordCountPerStage: [0, 1],
    neverList: ["lush grass", "northern deciduous trees", "wet surfaces outside the adverse variant", "cool colour temperature"],
  },

  old_town_night: {
    key: "old_town_night",
    displayName: "Old Town Night",
    elevationRange: [10, 90],
    elevationChangePerStage: [40, 90],
    gradientRange: [0.03, 0.09],
    cornerGradeDistribution: [0.22, 0.28, 0.24, 0.16, 0.08, 0.02],
    surfaceMix: { cobble: 0.45, tarmac_wet: 0.35, tarmac_patched: 0.15, ice: 0.05 },
    roadbedWidth: [5.5, 8.0],
    palette: { skyZenith: "#0A0E1A", skyHorizon: "#1C2436", groundBase: "#2A2A2E", foliageMid: "#1A241C", structurePrimary: "#3A3430", accent: "#F2A93B" },
    lighting: { sunElevationDeg: 24, sunAzimuthDeg: 0, colourTemperatureK: 4400, directionalLux: 0.6, ambientIntensity: 0.08, shadowSoftnessDeg: 0.5, fogDensity: 0.00160, fogColour: "#1C2436", baseEV100: 6.4 },
    flora: [
      { species: "plane_pollarded", tier: 4, heightRange: [8, 12], trunkDiameter: 0.40, weight: 0.60 },
      { species: "window_box",      tier: 0, heightRange: [0.3, 0.3], trunkDiameter: null, weight: 0.40 },
    ],
    archetypes: ["H_URB_TOWNHOUSE", "S_UNI_CHAPEL"],
    weatherStates: ["wetNight", "lightRain", "snowNight"],
    averageSpeedKmh: 82,
    sightLineMetres: 60,
    fordCountPerStage: [0, 0],
    neverList: ["daylight", "dirt", "open ground", "guardrails", "gravel", "non-architectural silhouettes"],
  },

  farmland_hedgerow: {
    key: "farmland_hedgerow",
    displayName: "Farmland Hedgerow",
    elevationRange: [40, 260],
    elevationChangePerStage: [120, 240],
    gradientRange: [0.04, 0.12],
    cornerGradeDistribution: [0.14, 0.22, 0.26, 0.20, 0.12, 0.06],
    surfaceMix: { tarmac_patched: 0.35, dirt_wet: 0.25, mud: 0.20, gravel_loose: 0.12, grass_wet: 0.08 },
    roadbedWidth: [4.2, 5.6],
    palette: { skyZenith: "#6F8CA8", skyHorizon: "#C3CBD2", groundBase: "#4E4535", foliageMid: "#3E5A2E", structurePrimary: "#7E7468", accent: "#2F4A3C" },
    lighting: { sunElevationDeg: 18, sunAzimuthDeg: 300, colourTemperatureK: 4800, directionalLux: 46000, ambientIntensity: 0.58, shadowSoftnessDeg: 4.5, fogDensity: 0.00150, fogColour: "#C3CBD2", baseEV100: 12.6 },
    flora: [
      { species: "oak_standard",  tier: 4, heightRange: [14, 20], trunkDiameter: 0.70, weight: 0.14 },
      { species: "ash",           tier: 4, heightRange: [12, 18], trunkDiameter: 0.40, weight: 0.12 },
      { species: "hawthorn_hedge",tier: 2, heightRange: [1.6, 2.4], trunkDiameter: null, weight: 0.34 },
      { species: "bramble_mass",  tier: 1, heightRange: [0.9, 0.9], trunkDiameter: null, weight: 0.20 },
      { species: "bracken",       tier: 0, heightRange: [0.8, 0.8], trunkDiameter: null, weight: 0.12 },
      { species: "pasture_grass", tier: 0, heightRange: [0.2, 0.2], trunkDiameter: null, weight: 0.08 },
    ],
    archetypes: ["H_FRM_LONGHOUSE", "S_UNI_CHAPEL"],
    weatherStates: ["overcast", "lightRain", "fog"],
    averageSpeedKmh: 96,
    sightLineMetres: 100,
    fordCountPerStage: [1, 1],
    neverList: ["wide roads", "sight lines beyond 140m", "dry dust", "bright colours", "exposed rock"],
  },

  volcanic_highland: {
    key: "volcanic_highland",
    displayName: "Volcanic Highland",
    elevationRange: [300, 900],
    elevationChangePerStage: [200, 420],
    gradientRange: [0.04, 0.14],
    cornerGradeDistribution: [0.08, 0.16, 0.22, 0.24, 0.20, 0.10],
    surfaceMix: { gravel_loose: 0.35, dirt_dry: 0.20, gravel_deep: 0.20, water_shallow: 0.10, snow_packed: 0.15 },
    roadbedWidth: [5.0, 7.0],
    palette: { skyZenith: "#5A6E7E", skyHorizon: "#B8BFC2", groundBase: "#2A2724", foliageMid: "#5E6B3E", structurePrimary: "#B8402E", accent: "#E8E4DC" },
    lighting: { sunElevationDeg: 22, sunAzimuthDeg: 340, colourTemperatureK: 6400, directionalLux: 38000, ambientIntensity: 0.70, shadowSoftnessDeg: 6.0, fogDensity: 0.00180, fogColour: "#B8BFC2", baseEV100: 13.4 },
    flora: [
      { species: "moss_carpet",   tier: 0, heightRange: [0.15, 0.15], trunkDiameter: null, weight: 0.52 },
      { species: "dwarf_birch",   tier: 1, heightRange: [0.6, 1.1], trunkDiameter: null, weight: 0.26 },
      { species: "willow_mat",    tier: 0, heightRange: [0.2, 0.2], trunkDiameter: null, weight: 0.14 },
      { species: "lupin_stand",   tier: 1, heightRange: [0.8, 0.8], trunkDiameter: null, weight: 0.06 },
      { species: "birch_stunted", tier: 3, heightRange: [3, 5], trunkDiameter: 0.16, weight: 0.02 },
    ],
    archetypes: ["H_VOL_CORRUGATE", "S_UNI_CHAPEL"],
    weatherStates: ["overcast", "windDrivenRain", "sleet"],
    averageSpeedKmh: 112,
    sightLineMetres: 200,
    fordCountPerStage: [4, 6],
    neverList: ["trees", "warm light", "dust", "guardrails", "dense settlements", "saturated ground colour"],
  },

  outback_red: {
    key: "outback_red",
    displayName: "Outback Red Dirt",
    elevationRange: [150, 480],
    elevationChangePerStage: [80, 180],
    gradientRange: [0.02, 0.08],
    cornerGradeDistribution: [0.06, 0.12, 0.18, 0.24, 0.26, 0.14],
    surfaceMix: { dirt_dry: 0.40, gravel_hardpack: 0.25, sand: 0.20, gravel_loose: 0.15 },
    roadbedWidth: [6.0, 8.5],
    palette: { skyZenith: "#3A86C9", skyHorizon: "#E8C79A", groundBase: "#A8452A", foliageMid: "#7E8C63", structurePrimary: "#8E8478", accent: "#2E6B5A" },
    lighting: { sunElevationDeg: 66, sunAzimuthDeg: 55, colourTemperatureK: 5500, directionalLux: 122000, ambientIntensity: 0.44, shadowSoftnessDeg: 1.0, fogDensity: 0.00080, fogColour: "#E8C79A", baseEV100: 15.9 },
    flora: [
      { species: "river_red_gum", tier: 4, heightRange: [16, 24], trunkDiameter: 0.95, weight: 0.12 },
      { species: "desert_oak",    tier: 4, heightRange: [8, 12],  trunkDiameter: 0.40, weight: 0.10 },
      { species: "mulga",         tier: 3, heightRange: [4, 7],   trunkDiameter: 0.22, weight: 0.18 },
      { species: "spinifex",      tier: 1, heightRange: [0.6, 0.6], trunkDiameter: null, weight: 0.40 },
      { species: "saltbush",      tier: 1, heightRange: [0.7, 0.7], trunkDiameter: null, weight: 0.14 },
      { species: "dry_grass",     tier: 0, heightRange: [0.4, 0.4], trunkDiameter: null, weight: 0.06 },
    ],
    archetypes: ["H_OUT_HOMESTEAD", "S_UNI_FUEL"],
    weatherStates: ["clear", "lowSun", "dustHaze"],
    averageSpeedKmh: 152,
    sightLineMetres: 350,
    fordCountPerStage: [0, 1],
    neverList: ["rock walls beside the road", "tight corners in sequence", "cool colours", "fog", "green ground cover"],
  },
};

// ---------------------------------------------------------------------------
// REGION-SPECIFIC MECHANICS
// ---------------------------------------------------------------------------

export const REGION_MECHANICS = {
  nordic_winter: {
    snowBankHeight: [0.9, 1.6] as [number, number],
    snowBankSoftTopDepth: 0.5,
    maxUnbrokenIceLength: 80,
    markerPoleSpacing: 20,
  },
  amazon_forest: {
    canopyClosureShare: 0.70,
    canopyHeight: 22,
    canopyTransmission: [0.06, 0.40] as [number, number],
    buttressRootRadius: 2.5,
    persistentRutDepth: [0.08, 0.12] as [number, number],
    streamSpacing: [300, 600] as [number, number],
  },
  outback_red: {
    bulldustHolesPerStage: [8, 15] as [number, number],
    bulldustHoleLength: [4, 12] as [number, number],
    dustPlumePersistSeconds: 6,
    dustPlumeOpacity: 0.85,
    dustDriftSpeed: 3.0,
    creekSpacing: [500, 900] as [number, number],
  },
  volcanic_highland: {
    crosswindMaxForceN: 900,
    crosswindGustHz: 0.3,
    fordDepthRange: [0.20, 0.45] as [number, number],
    depthMarkersRequired: true,
  },
  old_town_night: {
    streetLampSpacing: 12,
    streetLampHeight: 4.5,
    streetLampKelvin: 2100,
    streetLampLumens: 8000,
    streetLampRadius: 18,
    litShopfrontShare: 0.15,
    tramRailShare: 0.25,
    tramRailHeight: 0.06,
    paintedCrossingMuPenalty: 0.08,
    archClearWidth: [4.2, 5.0] as [number, number],
    archClearHeight: 4.6,
    minStageLength: 2500,
    spectatorFlashPerSecondPer10: 0.8,
  },
  farmland_hedgerow: {
    mudPatchesPerStage: [6, 10] as [number, number],
    mudPatchLength: 12,
    bankHeight: [1.2, 2.2] as [number, number],
    hedgeStandardSpacing: [20, 45] as [number, number],
    standardSetbackFromBankCrest: 1.0,
    leaningTreeCount: 3,
  },
  med_terrace: {
    gravelSpillCornerShare: 0.40,
    gravelSpillWidth: 1.2,
    oliveGridSpacing: 7.0,
    shrineSpacing: 2000,
  },
  alpine_pass: {
    treeLineElevation: 1750,
    snowPoleSpacingAboveTreeLine: 25,
    parapetHeight: 0.55,
    maxGuardrailRun: 80,
    hairpinWidth: 11.0,
    hairpinOffCamber: -0.06,
  },
  mountain_oasis: {
    irrigatedFloraBandFromWadi: 40,
    wallBatterDeg: 4,
    beamProtrusion: 0.35,
    retainingWallHeight: [0.8, 2.4] as [number, number],
  },
  deep_desert: {
    landmarkAcaciaSpacing: [200, 400] as [number, number],
    cairnSpacing: 120,
    cairnHeight: 1.1,
    plinthBandHeight: 0.9,
    heatShimmerAmplitude: 0.0025,
    heatShimmerMinDistance: 40,
  },
} as const;

// ---------------------------------------------------------------------------
// LEGACY KEY MAPPING
// ---------------------------------------------------------------------------

export const LEGACY_BIOME_MAP: Record<string, string> = {
  alpine_forest: "alpine_pass",
  nordic_pine: "nordic_winter",
  mediterranean_scrub: "med_terrace",
  farmland: "farmland_hedgerow",
  desert_wash: "deep_desert",
  moorland: "volcanic_highland",
};

// ---------------------------------------------------------------------------
// RALLY SEQUENCING
// ---------------------------------------------------------------------------

export const RALLY_SEQUENCING = {
  minSpeedBandSeparationKmh: 15,
  disallowConsecutiveSameSurfaceFamily: true,
  surfaceFamily: {
    alpine_pass: "tarmac",
    med_terrace: "tarmac",
    old_town_night: "hard_wet",
    deep_desert: "loose_dry",
    outback_red: "loose_dry",
    volcanic_highland: "loose_wet",
    amazon_forest: "wet_loose",
    farmland_hedgerow: "wet_mixed",
    nordic_winter: "snow",
    mountain_oasis: "mixed_dry",
  },
} as const;

// ---------------------------------------------------------------------------
// REGION LINT
// ---------------------------------------------------------------------------

export const REGION_LINT = {
  paletteHueToleranceDeg: 12,
  maxFoliageSaturation: 0.55,
  maxStructureSaturation: 0.45,
  scatterWeightSumTolerance: 0.001,
  maxOffPaletteScreenShare: 0.04,
  maxHeroColours: 6,
} as const;
