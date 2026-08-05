// Procedural race circuits + rich themed worlds around them.
// Five levels share one Track class: the level's theme picks the circuit layout
// and every color in the world (terrain, sky, vegetation, road tint, lighting).
import * as THREE from 'three';
import {
  roadTexture, wallTexture, groundTexture, buildingTexture, buildingGlowTexture,
  chevronTexture, checkerTexture, glowTexture, cloudTexture,
  grassTexture, bannerTexture, hazardTexture, crowdTexture, awningTexture,
  finishBannerTexture, cliffTexture, puddleTexture, plankTexture,
  crateTexture, coneTexture, barrelTexture, riverTexture, riverBankTexture, iglooTexture,
  sunTexture, hazeTexture, roadNeonEmissiveTexture, towerTexture,
  contactShadowTexture, horizonTexture, stoneTexture, junctionTexture,
} from './textures.js';

export const LEVELS = [
  { id: 1, name: 'PINE VALLEY',  theme: 'forest',  region: 'PINE VALLEY' },
  { id: 2, name: 'DUST CANYON',  theme: 'desert',  region: 'DUST CANYON' },
  { id: 3, name: 'FROST PEAK',   theme: 'snow',    region: 'FROST PEAK' },
  { id: 4, name: 'CANYON RUN',   theme: 'canyon',  region: 'DUST CANYON' },
  { id: 5, name: 'EMBER PASS',   theme: 'volcano', region: 'EMBER RIDGE' },
  { id: 6, name: 'SUMMIT CLIMB', theme: 'alpine',  region: 'PINE VALLEY' },
  { id: 7, name: 'GLACIAL PASS', theme: 'glacial', region: 'FROST PEAK' },
  { id: 8, name: 'AMAZON RAPIDS', theme: 'jungle', region: 'AMAZON' },
  { id: 9, name: 'THE DUNE SERPENT', theme: 'dunes', region: 'DUST CANYON' },
  { id: 10, name: 'ROCKFALL RAVINE', theme: 'ravine', region: 'DUST CANYON' },
  { id: 11, name: 'OASIS AMBUSH', theme: 'oasis', region: 'DUST CANYON' },
  { id: 12, name: 'REDWOOD RAMPAGE', theme: 'redwood', region: 'PINE VALLEY' },
  { id: 13, name: 'LOG FLUME FURY', theme: 'flume', region: 'PINE VALLEY' },
  { id: 14, name: 'FOREST FIRE ESCAPE', theme: 'wildfire', region: 'PINE VALLEY' },
  { id: 15, name: "GLACIER'S GRIND", theme: 'sheetice', region: 'FROST PEAK' },
  { id: 16, name: 'AVALANCHE ALLEY', theme: 'avalanche', region: 'FROST PEAK' },
  { id: 17, name: 'NEON GRID EXPRESSWAY', theme: 'neon', region: 'NEO-KYOTO' },
  { id: 18, name: 'UNDERCITY SLIPSTREAM', theme: 'undercity', region: 'NEO-KYOTO' },
  { id: 19, name: 'GOTTHARD CLIMB', theme: 'pass', region: 'ALPINE PASSES' },
  { id: 20, name: 'TREMOLA DESCENT', theme: 'tremola', region: 'ALPINE PASSES' },
  { id: 21, name: 'FURKA RIDGE', theme: 'furka', region: 'ALPINE PASSES' },
];

/** Stacked hairpin switchbacks up (or down) a mountain face — the Gotthard /
 *  Tremola signature. Every leg runs east-west at a fixed z, the next leg sits
 *  `dz` further along, and a single control point `hp` beyond the leg end folds
 *  the road back through a 180°. Legs stay exactly parallel (a wobble in z eats
 *  the gap between ribbons and trips the self-approach check); the variety
 *  comes from `jag`, which lengthens/shortens each leg instead.
 *  `dir` +1 = the first leg runs east, -1 = west. An ODD leg count exits on the
 *  opposite side of the face from the entry. */
function switchbackStack({ legs, z0, dz, halfX, hp, dir = 1,
  jag = [0, 4, -3, 2, -5, 3, -2, 5, -4, 1] }) {
  const out = [];
  for (let k = 0; k < legs; k++) {
    const s = (k % 2 === 0 ? 1 : -1) * dir;
    const z = z0 + k * dz;
    const hx = halfX + jag[k % jag.length];
    out.push([-s * hx, z], [0, z], [s * hx, z]);
    if (k < legs - 1) out.push([s * (hx + hp), z + dz / 2]);
  }
  return out;
}

// Hand-designed circuit control points (x, z) per theme.
const CIRCUITS = {
  // classic forest rally loop
  forest: [
    [0, -180], [90, -170], [150, -120], [215, -130], [252, -70],
    [230, 10], [160, 42], [152, 112], [205, 172], [140, 232],
    [40, 202], [-42, 238], [-132, 212], [-162, 130], [-120, 62],
    [-192, 12], [-252, -62], [-212, -142], [-120, -122], [-62, -172],
  ],
  // wide, fast sweepers with one lazy esses section through the dunes
  desert: [
    [0, -235], [100, -225], [185, -185], [245, -110], [255, -15],
    [230, 80], [160, 150], [70, 180], [-10, 150], [-70, 90],
    [-140, 70], [-215, 125], [-255, 40], [-245, -55], [-200, -135],
    [-120, -190], [-40, -220],
  ],
  // tight, twisty mountain switchbacks
  snow: [
    [0, -215], [85, -210], [160, -185], [150, -110], [215, -125],
    [255, -60], [215, -5], [250, 55], [205, 115], [235, 180],
    [150, 205], [75, 160], [0, 205], [-85, 225], [-145, 165],
    [-105, 100], [-180, 70], [-245, 110], [-255, 25], [-190, -30],
    [-245, -105], [-180, -170], [-90, -145], [-55, -210],
  ],
  // slot-canyon: medium-twisty with two long snaking sections east and south
  canyon: [
    [0, -235], [80, -240], [140, -205], [200, -235], [252, -195],
    [245, -120], [200, -85], [235, -20], [195, 40], [240, 105],
    [190, 165], [120, 150], [80, 205], [0, 235], [-80, 200],
    [-150, 235], [-215, 190], [-180, 120], [-245, 80], [-235, 0],
    [-180, -40], [-235, -95], [-180, -150], [-100, -130], [-60, -195],
  ],
  // flowing lap with rhythmic S-curves along the lava fields
  volcano: [
    [0, -240], [90, -235], [170, -200], [225, -140], [250, -60],
    [225, 20], [250, 100], [200, 170], [110, 205], [30, 170],
    [-50, 205], [-140, 225], [-220, 180], [-250, 100], [-215, 30],
    [-250, -45], [-210, -120], [-150, -90], [-90, -140], [-30, -180],
  ],
  // SUMMIT CLIMB: valley run along the mountain base, then FIVE stacked
  // switchback legs (east-west, ~26u apart in z, joined by 180° hairpins)
  // climbing the east face, a short summit shelf, and a wide fast descent
  // down the west side back to the valley. The ascent elevation profile
  // (THEMES.alpine.elev) climbs steadily through the leg stack.
  alpine: [
    // valley run at the mountain base
    [0, -210], [70, -218], [140, -205], [195, -172], [218, -142],
    // leg 1 (west-bound)
    [215, -124], [160, -127], [112, -123],
    [92, -108],                                   // hairpin W
    // leg 2 (east-bound)
    [112, -93], [160, -96], [206, -92],
    [226, -77],                                   // hairpin E
    // leg 3 (west-bound)
    [206, -62], [158, -65], [112, -61],
    [92, -46],                                    // hairpin W
    // leg 4 (east-bound)
    [112, -31], [160, -34], [206, -30],
    [226, -15],                                   // hairpin E
    // leg 5 (west-bound) → summit shelf
    [206, 0], [150, -2], [100, 2],
    [40, 10], [-15, 20],
    // fast sweeping descent down the far side
    [-90, 34], [-160, 48], [-225, 10], [-240, -60], [-205, -130],
    [-140, -175], [-70, -195],
  ],
  // GLACIAL PASS: winding ice-canyon course, medium technicality
  glacial: [
    [0, -225], [85, -235], [160, -210], [210, -160], [250, -100],
    [225, -35], [250, 30], [205, 90], [215, 155], [150, 195],
    [75, 165], [10, 200], [-70, 225], [-150, 200], [-190, 140],
    [-155, 80], [-215, 45], [-245, -25], [-200, -85], [-235, -150],
    [-165, -190], [-90, -160], [-45, -215],
  ],
  // AMAZON RAPIDS: snaking jungle lap threading between the river crossings
  jungle: [
    [0, -220], [90, -230], [165, -195], [230, -150], [245, -70],
    [200, -20], [235, 50], [190, 120], [215, 185], [130, 220],
    [50, 185], [-30, 225], [-110, 190], [-95, 120], [-160, 85],
    [-230, 120], [-250, 40], [-205, -20], [-245, -90], [-195, -155],
    [-120, -120], [-80, -185], [-30, -225],
  ],
  // THE DUNE SERPENT: high-speed flow over the dune backs — long sweepers and
  // one lazy esses section, nothing tighter than a fast sweep
  dunes: [
    [0, -235], [110, -240], [200, -200], [250, -120], [240, -30],
    [190, 50], [212, 140], [150, 210], [55, 235], [-30, 200],
    [-60, 120], [-130, 92], [-210, 130], [-252, 55], [-230, -30],
    [-160, -80], [-205, -160], [-130, -218], [-55, -238],
  ],
  // ROCKFALL RAVINE: tight technical slot-canyon zigzag — short walls of
  // corners split by hazard straights
  ravine: [
    [0, -230], [70, -245], [125, -205], [185, -240], [240, -200],
    [250, -130], [196, -95], [245, -45], [200, 5], [250, 60],
    [215, 120], [250, 175], [185, 215], [115, 180], [60, 225],
    [-15, 190], [-80, 230], [-150, 195], [-122, 130], [-188, 96],
    [-250, 130], [-245, 45], [-186, 8], [-240, -42], [-190, -90],
    [-245, -140], [-185, -196], [-110, -160], [-60, -215],
  ],
  // OASIS AMBUSH: rolling desert approach that dives through the palm grove
  // on the west half of the lap
  oasis: [
    [0, -225], [95, -235], [175, -200], [235, -140], [250, -55],
    [215, 25], [245, 105], [195, 175], [110, 210], [25, 180],
    [-55, 215], [-140, 235], [-215, 185], [-245, 110], [-200, 50],
    [-250, -20], [-215, -95], [-235, -170], [-155, -205], [-75, -170],
    [-30, -220],
  ],
  // REDWOOD RAMPAGE: broad rolling forest lap — fast crests between the giants
  redwood: [
    [0, -220], [90, -235], [170, -210], [230, -155], [250, -75],
    [220, 0], [250, 80], [215, 155], [140, 195], [65, 165],
    [0, 210], [-85, 235], [-165, 200], [-230, 145], [-250, 65],
    [-215, -10], [-245, -90], [-195, -160], [-110, -195], [-45, -230],
  ],
  // LOG FLUME FURY: three long haul-road straights for the flume lanes,
  // joined by mid-speed corners around the timber yards
  flume: [
    [-30, -230], [80, -235], [190, -235], [245, -175], [250, -70],
    [245, 40], [195, 120], [110, 150], [20, 185], [-70, 220],
    [-170, 230], [-240, 175], [-250, 75], [-245, -30], [-235, -135],
    [-180, -200], [-90, -182],
  ],
  // FOREST FIRE ESCAPE: flowing escape run with rhythmic esses through the burn
  wildfire: [
    [0, -235], [100, -230], [180, -195], [240, -130], [250, -45],
    [215, 35], [245, 115], [195, 185], [105, 215], [15, 185],
    [-70, 215], [-160, 230], [-230, 175], [-250, 90], [-215, 15],
    [-245, -65], [-205, -140], [-135, -105], [-75, -152], [-25, -192],
  ],
  // GLACIER'S GRIND: winding sheet-ice canyon, medium sweeps with two folds
  sheetice: [
    [0, -230], [90, -240], [170, -215], [225, -160], [250, -85],
    [230, -5], [250, 70], [210, 140], [225, 200], [145, 230],
    [65, 195], [-20, 230], [-105, 200], [-150, 140], [-215, 172],
    [-255, 100], [-225, 30], [-250, -45], [-205, -110], [-235, -180],
    [-160, -220], [-80, -190], [-35, -235],
  ],
  // AVALANCHE ALLEY: narrow pass — the climb winds up the east and north
  // sides, then the final third is one long sweeping western descent
  avalanche: [
    [0, -225], [85, -240], [160, -210], [210, -155], [245, -90],
    [235, -15], [250, 60], [220, 130], [235, 195], [160, 230],
    [80, 200], [10, 235], [-80, 230], [-150, 190], [-192, 235],
    [-250, 190], [-235, 110], [-250, 30], [-230, -55], [-245, -135],
    [-190, -195], [-110, -230], [-55, -190],
  ],
  // NEON GRID EXPRESSWAY: huge fast expressway sweeps, minimum corner count
  neon: [
    [0, -240], [120, -225], [215, -175], [252, -70], [235, 40],
    [250, 145], [180, 215], [70, 240], [-40, 215], [-140, 240],
    [-230, 190], [-252, 85], [-225, -20], [-250, -125], [-195, -200],
    [-90, -240],
  ],
  // UNDERCITY SLIPSTREAM: cramped service-tunnel twists — hairpin folds and
  // short bursts, nothing opens up for long
  undercity: [
    [0, -215], [75, -230], [140, -195], [130, -125], [195, -140],
    [245, -85], [205, -25], [245, 35], [200, 95], [230, 155],
    [165, 195], [95, 160], [30, 205], [-50, 230], [-120, 190],
    [-92, 122], [-160, 90], [-225, 125], [-250, 45], [-195, -5],
    [-240, -70], [-250, -150], [-180, -195], [-95, -160], [-50, -215],
  ],
  // GOTTHARD CLIMB: alpine village in the valley, a run along the mountain
  // base, then NINE stacked switchback legs (29u apart) hairpinning up the
  // granite face to a summit shelf, and three wide sweeps down the east side
  // back to the valley. Elevation: THEMES.pass.elev climbs ~45u through it.
  pass: [
    // valley floor: start line, village, run west along the base
    [-60, -244], [-140, -232], [-196, -192], [-224, -142], [-218, -98],
    [-176, -72], [-118, -64],
    // the face: 9 legs, 8 hairpins, ~70u legs
    ...switchbackStack({ legs: 9, z0: -64, dz: 29, halfX: 35, hp: 15 }),
    // summit shelf running east along the crest
    [96, 176], [158, 168], [214, 146],
    // three wide switchback sweeps down the east face
    [244, 104], [204, 72], [140, 62],
    [104, 22], [162, -4], [226, -12],
    [250, -70], [206, -102], [140, -114],
    // valley run-in back to the line
    [116, -164], [140, -210], [86, -242], [16, -250],
  ],
  // TREMOLA DESCENT: the mirror. The line sits on the summit plateau; the lap
  // drops straight into NINE tighter cobbled hairpins (28u apart) down the
  // face, runs out along the gorge floor, then climbs the long modern road up
  // the east flank back to the plateau.
  tremola: [
    // summit plateau + start line
    [170, 206], [104, 196], [52, 182],
    // the cobbled face, descending
    ...switchbackStack({ legs: 9, z0: 176, dz: -28, halfX: 35, hp: 15, dir: -1 }),
    // out of the last hairpin into the gorge
    [-78, -74], [-124, -112], [-152, -164],
    // valley run-out east along the gorge floor
    [-116, -216], [-46, -244], [34, -250], [110, -234], [176, -200],
    // the long climb back up the east flank to the plateau
    [224, -148], [246, -78], [230, -4], [248, 72], [224, 140], [232, 192],
  ],
  // FURKA RIDGE: a deep-winter pass. The valley floor is under snow; the dirt
  // road climbs a jagged grey-rock face in ONE long serpentine of seven legs,
  // so from the upper legs the whole pass is visible snaking down the valley
  // below you. A traverse along the top, then wide sweeps back down.
  furka: [
    // snowbound valley floor: start line + log cabins
    [-40, -244], [-124, -232], [-192, -198], [-230, -148], [-224, -100],
    [-182, -74], [-122, -66],
    // the serpentine: 7 legs, 6 hairpins, cut into the face
    ...switchbackStack({ legs: 7, z0: -66, dz: 30, halfX: 38, hp: 16 }),
    // high traverse along the shoulder, looking back down the whole pass
    [100, 118], [166, 110], [220, 86],
    // wide sweeps back down the east side to the valley
    [250, 40], [214, 2], [152, -8],
    [118, -58], [170, -92], [234, -104],
    [250, -160], [214, -206], [150, -232], [70, -246],
  ],
};

// Every color and density knob per theme. `fogColor…sunIntensity` are exposed
// to main.js via `track.theme`; the rest is internal art direction.
const THEMES = {
  forest: {
    // drizzle-soaked rally stage: physics reads `surface`
    surface: 'wet',
    // lighting / fog (plain numbers; also applied to scene.fog by Track itself)
    fogColor: 0xcfe8f5, fogNear: 320, fogFar: 1500,
    hemiSky: 0xa8ccff, hemiGround: 0x4a7a34, hemiIntensity: 0.76,
    sunColor: 0xfff0cc, sunIntensity: 2.75,
    // sky dome + sun sprite + clouds
    skyTop: '#3f8de0', skyHorizon: '#e8f0d8', sunGlow: 0xfff2b8,
    sunAz: 0.7, sunEl: 0.30,
    cloudCount: 12, cloudOpacity: 0.9,
    // terrain vertex colors + ground texture
    terrainLow: '#4f8a35', terrainHigh: '#83b455', terrainDirt: '#9c7a48',
    // steep-face colour for the faceted ground + warmth in the hut windows
    terrainScree: '#7a6242', hutGlow: 0.45,
    ground: {},  // groundTexture defaults are the forest palette
    // rain-darkened forest dirt: gentle wet overlay on the default palette
    road: { wet: { darken: 0.26, gleam: 10, pools: 3 } },
    // horizon silhouettes
    hillColor: 0x4e8a3c, peakColor: 0x8d8578,
    // trees (material color multiplies per-instance HSL variation)
    treeCount: 260, trunkColor: 0x6b4423,
    foliageLow: 0x2c6e2a, foliageTop: 0x3c8a34,
    foliage: { h: 0.29, hVar: 0.06, s: 0.5, sVar: 0.2, l: 0.32, lVar: 0.14 },
    treeSnowCap: false,
    // ground cover
    tuftCount: 1100, grass: {},
    bushCount: 160, bushColor: 0x2f7a30,
    bush: { h: 0.30, hVar: 0.05, s: 0.5, sVar: 0, l: 0.30, lVar: 0.12 },
    rockCount: 130, pebbleCount: 160, rockColor: 0x8d8578, rockSnowCap: false,
    flowerCount: 340, flowerColors: ['#ffe234', '#ff6a8a', '#ffffff', '#ff8a3a', '#c27aff'],
    hutRoof: 0xc9a24d, hayColor: 0xd8b95e,
    // debris chip colors when a fence/wall is scraped (painted pole red/cream)
    splinter: [0xc23b2a, 0xe8e2d4],
    // light drizzle drifting through the pines (rate overrides the default)
    weather: { type: 'rain', color: 0xcfe0ee, rate: 130 },
    // elevation profile: amplitude + deterministic per-octave phases
    elev: { amp: 8, ph: [0.9, 2.6, 4.2] },
    // per-level gameplay-placement tuning
    rampMaxCurv: 0.014, padMaxCurv: 0.004, boardMaxCurv: 0.012,
  },
  desert: {
    fogColor: 0xf2ddb6, fogNear: 280, fogFar: 1350,
    hemiSky: 0xd6dcf2, hemiGround: 0xd8ac66, hemiIntensity: 0.72,
    sunColor: 0xffe2a4, sunIntensity: 3,
    skyTop: '#6fa8d8', skyHorizon: '#ffd9a0', sunGlow: 0xffdca0,
    sunAz: 0.55, sunEl: 0.20,                           // low golden desert sun
    cloudCount: 5, cloudOpacity: 0.55,
    terrainLow: '#c9a86a', terrainHigh: '#e2c78e', terrainDirt: '#b06e3c',
    // steep-face colour for the faceted ground + warmth in the hut windows
    terrainScree: '#b8814c', hutGlow: 0.45,
    ground: {
      base: '#c9a86a', bandLight: 'rgba(255,255,255,0.04)', bandDark: 'rgba(0,0,0,0.04)',
      patchA: 'rgba(160,110,60,0.18)', patchB: 'rgba(235,205,140,0.16)',
      speckA: 'rgba(140,90,50,0.7)', speckB: 'rgba(240,225,190,0.8)', speckCount: 90,
    },
    road: {
      base: '#c2a06b', mottleA: [150, 112, 66], mottleB: [214, 180, 126],
      rut: 'rgba(122,86,48,0.55)', rutCore: 'rgba(96,64,34,0.45)', tread: 'rgba(66,42,22,0.5)',
      stoneA: 'rgba(230,210,175,0.7)', stoneB: 'rgba(140,100,62,0.7)',
      fringe: [168, 140, 66], fringeVar: [40, 34, 26],
    },
    hillColor: 0xa85a32, peakColor: 0xc27a4a,
    // saguaros, not pine scrub: a desert should never grow SOLID trees that
    // stop a car dead — cacti all yield and burst on impact
    vegetation: 'cactus', treeCount: 90, trunkColor: 0x4a8a4c,
    foliageLow: 0x3f7a34, foliageTop: 0x4c8a3e,
    foliage: { h: 0.10, hVar: 0.05, s: 0.40, sVar: 0.15, l: 0.45, lVar: 0.15 },
    treeSnowCap: false,
    tuftCount: 520, grass: { bladeA: '#8a7a30', bladeB: '#c8b45e' },
    bushCount: 120, bushColor: 0x8a8050,
    bush: { h: 0.12, hVar: 0.04, s: 0.35, sVar: 0.1, l: 0.42, lVar: 0.12 },
    rockCount: 300, pebbleCount: 240, rockColor: 0xb07a52, rockSnowCap: false,
    flowerCount: 90, flowerColors: ['#ffd45e', '#ff8a3a', '#e86a8a'],
    hutRoof: 0xb0794a, hayColor: 0xd8b95e,
    splinter: [0xe8b83a, 0xe8e2d4],                     // sun-bleached painted fence
    weather: { type: 'sand', color: 0xd8b878 },
    elev: { amp: 10, ph: [1.7, 0.4, 3.3] },             // long dune rollers
    rampMaxCurv: 0.014, padMaxCurv: 0.004, boardMaxCurv: 0.012,
  },
  snow: {
    surface: 'snow',                                    // physics reads this
    fogColor: 0xe2edf6, fogNear: 240, fogFar: 1250,
    hemiSky: 0x9ec4f2, hemiGround: 0x8fa0c8, hemiIntensity: 0.8,
    sunColor: 0xfff2dc, sunIntensity: 2.25,
    skyTop: '#639fd8', skyHorizon: '#eaf3fa', sunGlow: 0xffffff,
    sunAz: 0.82, sunEl: 0.28,
    cloudCount: 9, cloudOpacity: 0.95,
    terrainLow: '#dde8ee', terrainHigh: '#ffffff', terrainDirt: '#b7c4cd',
    // steep-face colour for the faceted ground + warmth in the hut windows
    terrainScree: '#9fb2c8', hutGlow: 0.7,
    ground: {
      base: '#e6edf2', bandLight: 'rgba(255,255,255,0.06)', bandDark: 'rgba(120,150,175,0.06)',
      patchA: 'rgba(165,190,210,0.20)', patchB: 'rgba(255,255,255,0.22)',
      speckA: 'rgba(200,220,235,0.8)', speckB: 'rgba(255,255,255,0.9)', speckCount: 80,
    },
    road: {
      base: '#6f5638', mottleA: [82, 60, 38], mottleB: [130, 102, 70],
      rut: 'rgba(46,32,20,0.6)', rutCore: 'rgba(30,20,12,0.5)', tread: 'rgba(14,9,5,0.55)',
      stoneA: 'rgba(190,200,210,0.7)', stoneB: 'rgba(70,55,40,0.7)',
      fringe: [228, 238, 246], fringeVar: [24, 16, 10],   // snow creeping onto the road
      // white cover with two carved channels down the churned mud beneath
      snowCover: { slush: [206, 216, 226], slushAlpha: 0.38 },
    },
    hillColor: 0xcfdce4, peakColor: 0xeef4f8,
    treeCount: 240, trunkColor: 0x5a4028,
    foliageLow: 0x5a7a62, foliageTop: 0x668a70,
    foliage: { h: 0.38, hVar: 0.04, s: 0.22, sVar: 0.10, l: 0.42, lVar: 0.10 },
    treeSnowCap: true,
    tuftCount: 360, grass: { bladeA: '#5a7a58', bladeB: '#b8d0c0' },
    bushCount: 90, bushColor: 0x9ab8a0,
    bush: { h: 0.40, hVar: 0.05, s: 0.18, sVar: 0.08, l: 0.52, lVar: 0.12 },
    rockCount: 150, pebbleCount: 140, rockColor: 0x9aa6b0, rockSnowCap: true,
    flowerCount: 60, flowerColors: ['#ffffff', '#cfe0ff', '#ffd0e0'],
    hutRoof: 0xe8eef4, hayColor: 0xd8c07a,
    splinter: [0xdce8f0, 0x9fc4d8],                     // icy chips
    weather: { type: 'snow', color: 0xffffff },
    elev: { amp: 14, ph: [2.6, 1.2, 5.1] },             // proper mountain climb
    rampMaxCurv: 0.022, padMaxCurv: 0.0075, boardMaxCurv: 0.02,
  },
  // CANYON RUN: the road snakes between tall stratified sandstone cliffs.
  // Extra knobs: cliffWalls (cliff ribbons replace the pole fence — physics
  // clamp stays at WALL_OFF), horizon 'mesa', vegetation 'cactus', bridges,
  // oasis pond, on-road hoodoo obstacles and mud puddles.
  canyon: {
    fogColor: 0xe8bd8a, fogNear: 200, fogFar: 1150,   // warm haze, close for canyon tightness
    hemiSky: 0xcfd8f0, hemiGround: 0xc07a48, hemiIntensity: 0.72,
    sunColor: 0xffc98a, sunIntensity: 2.85,
    skyTop: '#6f95c0', skyHorizon: '#ffcf96', sunGlow: 0xffc070,
    sunAz: 0.5, sunEl: 0.22,                             // late sun raking the walls
    cloudCount: 4, cloudOpacity: 0.5,
    terrainLow: '#c08050', terrainHigh: '#e0a870', terrainDirt: '#8f5430',
    // steep-face colour for the faceted ground + warmth in the hut windows
    terrainScree: '#9a5c34', hutGlow: 0.45,
    ground: {
      base: '#c68d58', bandLight: 'rgba(255,235,205,0.05)', bandDark: 'rgba(90,50,25,0.05)',
      patchA: 'rgba(150,90,45,0.20)', patchB: 'rgba(235,190,130,0.16)',
      speckA: 'rgba(120,70,35,0.7)', speckB: 'rgba(245,220,180,0.8)', speckCount: 90,
    },
    road: {
      base: '#c28a52', mottleA: [150, 95, 52], mottleB: [220, 170, 110],
      rut: 'rgba(120,72,38,0.55)', rutCore: 'rgba(92,54,26,0.45)', tread: 'rgba(60,36,18,0.5)',
      stoneA: 'rgba(238,206,164,0.7)', stoneB: 'rgba(130,84,48,0.7)',
      fringe: [172, 122, 62], fringeVar: [42, 32, 22],  // dry brush fringe
    },
    hillColor: 0xb06a3c, peakColor: 0xd09263,           // mesa strata base/top tones
    vegetation: 'cactus', treeCount: 110, trunkColor: 0x4a8a4c,
    foliageLow: 0x3f7a34, foliageTop: 0x4c8a3e,
    foliage: { h: 0.30, hVar: 0.05, s: 0.40, sVar: 0.15, l: 0.30, lVar: 0.10 },
    treeSnowCap: false,
    tuftCount: 260, grass: { bladeA: '#9a7a30', bladeB: '#d0b060' },
    bushCount: 46, bushColor: 0x8a7a44,
    bush: { h: 0.11, hVar: 0.04, s: 0.34, sVar: 0.1, l: 0.40, lVar: 0.12 },
    rockCount: 150, pebbleCount: 130, rockColor: 0xb5744a, rockSnowCap: false,
    flowerCount: 60, flowerColors: ['#ffd45e', '#ff7a3a', '#e86a8a'],
    hutRoof: 0xb0794a, hayColor: 0xd8b95e, hutCount: 3, hayCount: 22,
    splinter: [0xc9a06a, 0xa06844],                     // sandstone chips
    weather: { type: 'dust', color: 0xc9a06a },
    elev: { amp: 6, ph: [0.3, 3.7, 1.9] },              // gentle canyon-floor undulation
    rampMaxCurv: 0.02, padMaxCurv: 0.0075, boardMaxCurv: 0.018,
    cliffWalls: true, horizon: 'mesa', bridgeCount: 3, oasis: true, outcrops: true,
    obstacleSpec: { count: 6, style: 'hoodoo' }, puddleCount: 5,
  },
  // EMBER PASS: charred basalt world — dark ash road, glowing ground fissures,
  // obsidian rocks, bare burnt trees, red-black mountains, dim ember light.
  volcano: {
    fogColor: 0x6a4636, fogNear: 260, fogFar: 1150,
    // EMBER PASS was unplayable: fill 1.0 against a near-black ash albedo left
    // the road and terrain reading as pure black — only the lava cracks and the
    // cars were visible, so you could not see where the road went. The mood is
    // meant to be a volcanic dusk, not an unlit one; fill raised and the ground
    // tone lifted so the driving surface reads while the embers still glow.
    hemiSky: 0xe8b088, hemiGround: 0x8a6c58, hemiIntensity: 3.1,
    sunColor: 0xffa060, sunIntensity: 3.2,
    skyTop: '#4e2a3a', skyHorizon: '#dd541c', sunGlow: 0xff6a28, skyCurve: 0.72,
    sunAz: 0.6, sunEl: 0.17,                             // ember sun low on the haze
    cloudCount: 7, cloudOpacity: 0.35, cloudTint: 0x8a6a58,
    terrainLow: '#877668', terrainHigh: '#9a8676', terrainDirt: '#ac6a4a',
    // steep-face colour for the faceted ground + warmth in the hut windows
    terrainScree: '#6a574d', hutGlow: 1.3,
    ground: {
      // The ground texture MULTIPLIES the terrain vertex colour, so a dark
      // base here cannot be compensated by any amount of light: at '#332e2a'
      // the albedo landed near 15/255 and the level rendered 94% black. Ash
      // is grey, not soot — this is what makes the ground read at all.
      base: '#7a6c62', bandLight: 'rgba(255,255,255,0.05)', bandDark: 'rgba(0,0,0,0.05)',
      patchA: 'rgba(48,38,32,0.20)', patchB: 'rgba(150,124,102,0.16)',
      speckA: 'rgba(255,140,60,0.9)', speckB: 'rgba(200,192,182,0.7)', speckCount: 70,
      veins: { color: '#ff7a22', glow: 'rgba(255,96,20,0.30)', count: 7 },  // ember cracks
    },
    road: {
      // the ash field around it is warm and light, so the carriageway is a
      // cool dark basalt — clearly a different surface, not a shade of dirt
      base: '#4a4744', mottleA: [58, 55, 52], mottleB: [112, 108, 104],
      rut: 'rgba(152,150,152,0.30)', rutCore: 'rgba(180,177,180,0.26)',    // lighter gray ruts
      tread: 'rgba(18,14,12,0.55)',
      stoneA: 'rgba(190,185,180,0.7)', stoneB: 'rgba(28,24,22,0.8)',
      fringe: [72, 62, 54], fringeVar: [30, 24, 18],    // ash fringe
    },
    hillColor: 0x4a2018, peakColor: 0x2a1512,           // red-black mountains
    vegetation: 'charred', treeCount: 120, trunkColor: 0x241d18,
    foliageLow: 0x2a2018, foliageTop: 0x3a2c20,
    foliage: { h: 0.06, hVar: 0.03, s: 0.20, sVar: 0.1, l: 0.14, lVar: 0.08 },
    treeSnowCap: false,
    tuftCount: 70, grass: { bladeA: '#4a4038', bladeB: '#6a5a48' },  // few scorched tufts
    bushCount: 36, bushColor: 0x3a302a,
    bush: { h: 0.08, hVar: 0.03, s: 0.15, sVar: 0.08, l: 0.16, lVar: 0.08 },
    rockCount: 240, pebbleCount: 380,                   // heavy dark gravel scatter
    // Obsidian at 0x201c22 was invisible against the ground — you only learned
    // a rock was there from the −85 hull. Lifted to a lit basalt that still
    // reads volcanic but silhouettes against the ash in time to swerve.
    rockColor: 0x574c52, rockSnowCap: false, rockRoughness: 0.4,
    flowerCount: 0, flowerColors: ['#ff7a22'],
    hutRoof: 0x4a3a30, hayColor: 0x8a6a3a, hutCount: 4, hayCount: 0,
    splinter: [0x3a3634, 0xff5e2e],                     // basalt + ember chips
    weather: { type: 'embers', color: 0xff7a2e },
    elev: { amp: 12, ph: [4.1, 2.8, 0.7] },             // heaving lava-field climbs
    rampMaxCurv: 0.02, padMaxCurv: 0.006, boardMaxCurv: 0.016,
    obstacleSpec: { count: 4, style: 'basalt' }, puddleCount: 0,
  },
  // SUMMIT CLIMB: bright alpine pass — stacked switchback legs climb the
  // mountain face (hand-shaped 'ascent' elevation profile, summit ≈ 33u),
  // mossy green boulders, crisp cold sky, snow drifting near the summit.
  alpine: {
    fogColor: 0xdcecf8, fogNear: 300, fogFar: 1500,
    hemiSky: 0xa8ccff, hemiGround: 0x5c8a46, hemiIntensity: 0.76,
    sunColor: 0xfff2d2, sunIntensity: 2.8,
    skyTop: '#2f6fc8', skyHorizon: '#dceef8', sunGlow: 0xfff4cc,
    sunAz: 0.9, sunEl: 0.32,
    cloudCount: 10, cloudOpacity: 0.92,
    terrainLow: '#4c8a3c', terrainHigh: '#9ab87a', terrainDirt: '#8a7a5a',
    // steep-face colour for the faceted ground + warmth in the hut windows
    terrainScree: '#8f8163', hutGlow: 0.45,
    ground: {},   // lush meadow defaults read right at altitude too
    road: {},     // classic dirt rally surface
    hillColor: 0x54804a, peakColor: 0xdde8f0,           // snow-dusted horizon peaks
    treeCount: 280, trunkColor: 0x6b4423,
    foliageLow: 0x2a6e34, foliageTop: 0x3f9a44,         // bright alpine pines
    foliage: { h: 0.30, hVar: 0.06, s: 0.55, sVar: 0.2, l: 0.30, lVar: 0.14 },
    treeSnowCap: false,
    tuftCount: 900, grass: {},
    bushCount: 140, bushColor: 0x2f7a30,
    bush: { h: 0.30, hVar: 0.05, s: 0.5, sVar: 0, l: 0.30, lVar: 0.12 },
    // the slopes are strewn with mossy green granite
    rockCount: 340, pebbleCount: 220, rockColor: 0x7a9a6c, rockSnowCap: false,
    flowerCount: 260, flowerColors: ['#ffffff', '#ffe234', '#7a9aff', '#ff6a8a'],
    hutRoof: 0x8a4a2a, hayColor: 0xd8b95e,
    splinter: [0x8a5a32, 0xe8e2d4],                     // pale mountain timber
    weather: { type: 'snow', color: 0xffffff },         // gentle snow off the summit
    // hand-shaped monotonic climb: flat valley → steady rise through the
    // switchback stack → summit shelf ≈ 33u → fast descent back to 0.
    // keys are [lapFraction, roadY]; see _elevProfile's 'ascent' branch.
    elev: {
      amp: 33, profile: 'ascent', ph: [0, 0, 0],
      keys: [[0, 0], [0.05, 0], [0.15, 3], [0.57, 33], [0.65, 32], [0.94, 0], [1, 0]],
    },
    rampMaxCurv: 0.014, padMaxCurv: 0.004, boardMaxCurv: 0.012,
    // loose granite boulders block the fast descent (downhill sections only)
    obstacleSpec: { count: 4, style: 'boulder', downhill: true }, puddleCount: 2,
  },
  // GLACIAL PASS: blue-white ice canyon — glacial cliff ribbons, packed-snow
  // road with frozen slicks, igloos, penguins and driving snow.
  glacial: {
    surface: 'snow',                                    // physics reads this
    fogColor: 0xd8e8f4, fogNear: 210, fogFar: 1200,
    hemiSky: 0xa2c8f6, hemiGround: 0x8ea6cc, hemiIntensity: 0.8,
    sunColor: 0xfff0dc, sunIntensity: 2.3,
    skyTop: '#4c8ecf', skyHorizon: '#dff0fa', sunGlow: 0xeafaff,
    sunAz: 0.7, sunEl: 0.24,                            // low polar sun
    cloudCount: 8, cloudOpacity: 0.9,
    terrainLow: '#cfe0ec', terrainHigh: '#ffffff', terrainDirt: '#9fb8c8',
    // steep-face colour for the faceted ground + warmth in the hut windows
    terrainScree: '#93aec4', hutGlow: 0.7,
    ground: {
      base: '#dfeaf2', bandLight: 'rgba(255,255,255,0.06)', bandDark: 'rgba(110,145,175,0.07)',
      patchA: 'rgba(150,185,215,0.22)', patchB: 'rgba(255,255,255,0.22)',
      speckA: 'rgba(190,220,240,0.8)', speckB: 'rgba(255,255,255,0.9)', speckCount: 90,
    },
    road: {
      // packed snow, bluer than FROST PEAK's churned mud
      // A road you cannot pick out of the snow is not a road. This was
      // '#b6c9d6' against a '#cfe0ec'-to-white snowfield: measured 21 points
      // of separation, i.e. none. Ploughed grit, still cold in tone.
      base: '#7c8894', mottleA: [92, 102, 112], mottleB: [150, 165, 180],
      rut: 'rgba(96,120,142,0.55)', rutCore: 'rgba(74,96,118,0.5)', tread: 'rgba(52,68,86,0.5)',
      stoneA: 'rgba(235,245,252,0.8)', stoneB: 'rgba(120,148,170,0.7)',
      fringe: [226, 238, 248], fringeVar: [24, 14, 8],  // snowbanks creeping in
      // bluer glacial cover: icier slush carved over the packed-snow base
      snowCover: {
        snow: [240, 247, 253], shade: [178, 200, 224],
        slush: [186, 206, 224], slushAlpha: 0.44, sparkle: 190,
      },
    },
    hillColor: 0xbdd2e0, peakColor: 0xeef6fc,
    treeCount: 140, trunkColor: 0x5a4028,
    foliageLow: 0x5a7a62, foliageTop: 0x668a70,
    foliage: { h: 0.38, hVar: 0.04, s: 0.22, sVar: 0.10, l: 0.42, lVar: 0.10 },
    treeSnowCap: true,
    tuftCount: 240, grass: { bladeA: '#6a8a78', bladeB: '#c8dcd0' },
    bushCount: 60, bushColor: 0x9ab8a0,
    bush: { h: 0.40, hVar: 0.05, s: 0.18, sVar: 0.08, l: 0.55, lVar: 0.12 },
    rockCount: 160, pebbleCount: 120, rockColor: 0x9ab4c4, rockSnowCap: true,
    flowerCount: 40, flowerColors: ['#ffffff', '#cfe0ff', '#aef0ff'],
    hutRoof: 0xe8f2f8, hutStyle: 'igloo', hutCount: 8, hayColor: 0xd8c07a, hayCount: 10,
    splinter: [0xcfe8f4, 0x8fd0e8],                     // shattered ice chips
    weather: { type: 'snow', color: 0xffffff },
    elev: { amp: 9, ph: [1.4, 3.1, 0.6] },
    rampMaxCurv: 0.02, padMaxCurv: 0.006, boardMaxCurv: 0.018,
    // glacial cliff ribbons: pale blue-white strata split by cyan cracks
    cliffWalls: true,
    cliffPalette: {
      bands: ['#dceef8', '#c2dcee', '#a8cce4', '#d4e8f4', '#b4d4e8'],
      seam: 'rgba(120,160,190,0.45)',
      crack: 'rgba(40,150,190,',                        // cyan crevasses
      bleach: 'rgba(255,255,255,0.22)',
      talus: 'rgba(90,120,150,0.28)',
      mottleLight: '255,255,255', mottleDark: '120,160,200',
      streakLight: '240,250,255', streakDark: '130,170,205',
    },
    // frozen slicks: the puddle mechanic re-skinned icy blue-white
    puddle: {
      rim: '#cfe4f0', mud: '#9cc8e0',
      sheen: 'rgba(235,250,255,0.5)', gleam: 'rgba(255,255,255,0.75)',
    },
    puddleCount: 5,
  },
  // AMAZON RAPIDS: dense deep-green jungle — layered canopies close over a
  // dark mud road, rivers cross beneath it, humid haze hangs low.
  jungle: {
    surface: 'wet',                                    // downpour — physics reads this
    // Measured at 84% of the drivable frame near-black — the darkest daylight
    // world in the game by a wide margin, and unreadable on a phone. A real
    // rainforest under a high sun is not dim, it is HAZY: strong green bounce
    // off wet leaves, a bright humid veil between you and the far trees. So the
    // bounce goes up hard and the haze comes in, rather than the sun going up
    // (which would just blow out the canopy tops and leave the floor black).
    fogColor: 0xc4e0b4, fogNear: 210, fogFar: 1150,    // humid green haze
    hemiSky: 0xd6f0ff, hemiGround: 0x5e8a42, hemiIntensity: 1.45,
    sunColor: 0xfff4d2, sunIntensity: 2.95,
    skyTop: '#5a9ac8', skyHorizon: '#cfe8b8', sunGlow: 0xf8ffd0,
    sunAz: 1.0, sunEl: 0.34,                           // high tropical sun
    cloudCount: 10, cloudOpacity: 0.85,
    terrainLow: '#3f7d36', terrainHigh: '#69a44a', terrainDirt: '#7a5636',
    // steep-face colour for the faceted ground + warmth in the hut windows
    terrainScree: '#6a4a2c', hutGlow: 0.6,
    ground: {
      base: '#4d8c3b', bandLight: 'rgba(255,255,255,0.05)', bandDark: 'rgba(0,40,0,0.05)',
      patchA: 'rgba(20,70,24,0.22)', patchB: 'rgba(120,180,70,0.16)',
      speckA: 'rgba(255,220,120,0.8)', speckB: 'rgba(190,240,150,0.8)', speckCount: 70,
    },
    road: {
      // wet, dark rainforest mud — deeper and slicker than canyon dirt
      base: '#5c4128', mottleA: [58, 40, 24], mottleB: [110, 82, 52],
      rut: 'rgba(38,26,14,0.6)', rutCore: 'rgba(24,16,8,0.55)', tread: 'rgba(12,8,4,0.6)',
      stoneA: 'rgba(150,140,110,0.6)', stoneB: 'rgba(52,40,26,0.7)',
      fringe: [46, 110, 38], fringeVar: [30, 50, 22],   // jungle green creeping in
      // rain-hammered mud: heavy darkening, lots of gleam + standing water
      wet: { darken: 0.38, gleam: 15, pools: 6 },
    },
    hillColor: 0x2e6a34, peakColor: 0x4a8a4c,
    vegetation: 'jungle', treeCount: 320, trunkColor: 0x7a5c3a,
    foliageLow: 0x1f6e2c, foliageTop: 0x35a03c,
    foliage: { h: 0.31, hVar: 0.08, s: 0.55, sVar: 0.2, l: 0.26, lVar: 0.16 },
    treeSnowCap: false,
    tuftCount: 900, grass: { bladeA: '#2f7a22', bladeB: '#63c243' },
    bushCount: 220, bushColor: 0x2c7a2e,
    bush: { h: 0.31, hVar: 0.06, s: 0.55, sVar: 0.15, l: 0.26, lVar: 0.14 },
    rockCount: 90, pebbleCount: 120, rockColor: 0x6a7a5a, rockSnowCap: false,
    flowerCount: 420, flowerColors: ['#ff4a6a', '#ffd45e', '#ff8a3a', '#e86aff', '#ffffff'],
    hutRoof: 0x7a9a3c, hayColor: 0xc8b45e, hutCount: 6, hayCount: 30,
    splinter: [0x4a9a3c, 0x8a6a42],                     // shredded fronds + wet wood
    weather: { type: 'rain', color: 0xbfd8ea },         // full tropical downpour
    elev: { amp: 7, ph: [2.2, 0.9, 4.4] },
    rampMaxCurv: 0.016, padMaxCurv: 0.005, boardMaxCurv: 0.014,
    // fallen log piles on the road (SOLID circle colliders like all obstacles)
    obstacleSpec: { count: 3, style: 'logs' }, puddleCount: 8,
    riverCount: 3,                                      // streams crossing under the road
  },
  // THE DUNE SERPENT: deep-desert dune sea — golden ridged horizon, rippled
  // sand road, sparse palms. Hazard contract: geysers (lead implements).
  dunes: {
    fogColor: 0xf5dfae, fogNear: 300, fogFar: 1400,
    hemiSky: 0xd2dcf4, hemiGround: 0xd8ac66, hemiIntensity: 0.72,
    sunColor: 0xffe0a0, sunIntensity: 3.05,
    skyTop: '#77aede', skyHorizon: '#ffe0a8', sunGlow: 0xffd890,
    sunAz: 0.5, sunEl: 0.18,
    cloudCount: 3, cloudOpacity: 0.5,
    terrainLow: '#d4ac6a', terrainHigh: '#f0d492', terrainDirt: '#b8823f',
    // steep-face colour for the faceted ground + warmth in the hut windows
    terrainScree: '#c08d50', hutGlow: 0.45,
    ground: {
      base: '#d8b273', bandLight: 'rgba(255,240,200,0.07)', bandDark: 'rgba(150,100,50,0.06)',
      patchA: 'rgba(170,120,60,0.16)', patchB: 'rgba(245,220,160,0.18)',
      speckA: 'rgba(150,100,55,0.7)', speckB: 'rgba(250,235,200,0.8)', speckCount: 80,
    },
    road: {
      base: '#d0a865', mottleA: [166, 126, 74], mottleB: [226, 194, 138],
      rut: 'rgba(150,108,58,0.45)', rutCore: 'rgba(122,84,42,0.4)', tread: 'rgba(92,60,30,0.45)',
      stoneA: 'rgba(244,224,184,0.7)', stoneB: 'rgba(150,106,62,0.7)',
      fringe: [190, 156, 84], fringeVar: [40, 34, 26],
      ripples: true,                                    // wind-carved sand crests
    },
    hillColor: 0xd8a95e, peakColor: 0xf2d492, horizon: 'dunes',
    vegetation: 'palm', treeCount: 36, trunkColor: 0x8a6242,
    foliageLow: 0x3f7a34, foliageTop: 0x4c8a3e,
    foliage: { h: 0.26, hVar: 0.05, s: 0.42, sVar: 0.15, l: 0.30, lVar: 0.10 },
    treeSnowCap: false,
    tuftCount: 260, grass: { bladeA: '#a08a3a', bladeB: '#d8c070' },
    bushCount: 44, bushColor: 0x9a8a50,
    bush: { h: 0.12, hVar: 0.04, s: 0.32, sVar: 0.1, l: 0.44, lVar: 0.12 },
    rockCount: 60, pebbleCount: 150, rockColor: 0xc09058, rockSnowCap: false,
    flowerCount: 0, flowerColors: ['#ffd45e'],
    hutRoof: 0xc09a5c, hayColor: 0xd8b95e, hutCount: 3, hayCount: 8,
    splinter: [0xe8c87a, 0xb8905a],
    weather: { type: 'sand', color: 0xe0c080 },
    elev: { amp: 12, ph: [0.6, 2.9, 1.8] },             // serpent-back rollers
    rampMaxCurv: 0.012, padMaxCurv: 0.005, boardMaxCurv: 0.012,
    geysers: { count: 6 },                              // hazard spec (lead implements)
  },
  // ROCKFALL RAVINE: narrow treacherous slot canyon — deep red-brown strata
  // walls, tight corners, rockfall straights. Hazard contract: fallHazard.
  ravine: {
    fogColor: 0xdba87c, fogNear: 170, fogFar: 1000,
    hemiSky: 0xd8d4e8, hemiGround: 0xa8663c, hemiIntensity: 0.72,
    sunColor: 0xffbe7e, sunIntensity: 2.75,
    skyTop: '#6f92ba', skyHorizon: '#f8c088', sunGlow: 0xffb868,
    sunAz: 0.45, sunEl: 0.2,
    cloudCount: 3, cloudOpacity: 0.45,
    terrainLow: '#b06a3e', terrainHigh: '#d29057', terrainDirt: '#7e4426',
    // steep-face colour for the faceted ground + warmth in the hut windows
    terrainScree: '#7e4426', hutGlow: 0.45,
    ground: {
      base: '#b57a48', bandLight: 'rgba(255,225,190,0.05)', bandDark: 'rgba(80,40,20,0.06)',
      patchA: 'rgba(130,70,35,0.22)', patchB: 'rgba(220,170,110,0.16)',
      speckA: 'rgba(105,58,28,0.7)', speckB: 'rgba(235,205,160,0.8)', speckCount: 90,
    },
    road: {
      base: '#b07a48', mottleA: [132, 82, 44], mottleB: [200, 148, 94],
      rut: 'rgba(105,60,30,0.55)', rutCore: 'rgba(80,44,20,0.45)', tread: 'rgba(52,30,14,0.5)',
      stoneA: 'rgba(230,192,148,0.7)', stoneB: 'rgba(115,70,38,0.7)',
      fringe: [155, 105, 52], fringeVar: [42, 32, 22],
    },
    hillColor: 0x9c4f28, peakColor: 0xc27848,
    vegetation: 'cactus', treeCount: 70, trunkColor: 0x4a8a4c,
    foliageLow: 0x3f7a34, foliageTop: 0x4c8a3e,
    foliage: { h: 0.30, hVar: 0.05, s: 0.40, sVar: 0.15, l: 0.30, lVar: 0.10 },
    treeSnowCap: false,
    tuftCount: 200, grass: { bladeA: '#96702c', bladeB: '#c8a054' },
    bushCount: 36, bushColor: 0x8a6e3e,
    bush: { h: 0.10, hVar: 0.04, s: 0.32, sVar: 0.1, l: 0.38, lVar: 0.12 },
    rockCount: 170, pebbleCount: 200, rockColor: 0xa5602f, rockSnowCap: false,
    flowerCount: 30, flowerColors: ['#ffd45e', '#ff7a3a'],
    hutRoof: 0xa06844, hayColor: 0xd8b95e, hutCount: 2, hayCount: 10,
    splinter: [0xb87848, 0x8a4a26],                     // red sandstone chips
    weather: { type: 'dust', color: 0xc08a5a },
    elev: { amp: 7, ph: [3.1, 1.2, 4.6] },
    rampMaxCurv: 0.022, padMaxCurv: 0.007, boardMaxCurv: 0.02,
    cliffWalls: true, horizon: 'mesa', outcrops: true,
    cliffPalette: {                                     // deep red-brown strata
      bands: ['#b06a3c', '#8f4d28', '#7a3e1f', '#c07e48', '#9a5830'],
      seam: 'rgba(52,26,14,0.5)',
      crack: 'rgba(48,22,10,',
      bleach: 'rgba(255,205,155,0.14)',
      talus: 'rgba(40,20,10,0.3)',
      mottleLight: '245,200,150', mottleDark: '70,36,18',
      streakLight: '225,170,120', streakDark: '52,26,12',
    },
    obstacleSpec: { count: 5, style: 'hoodoo' }, puddleCount: 2,
    fallHazard: { kind: 'rock', period: 6, dmg: 24 },   // hazard spec (lead implements)
  },
  // OASIS AMBUSH: a hidden lush pocket in the desert — dense palm grove, three
  // ponds, mud everywhere. Hazard contract: critters (scorpions).
  oasis: {
    fogColor: 0xead9a8, fogNear: 260, fogFar: 1300,
    hemiSky: 0xcfdcf8, hemiGround: 0x86a04c, hemiIntensity: 0.72,
    sunColor: 0xffeaa8, sunIntensity: 2.85,
    skyTop: '#5aa2d8', skyHorizon: '#ffe4a8', sunGlow: 0xffe0a0,
    sunAz: 0.62, sunEl: 0.26,
    cloudCount: 6, cloudOpacity: 0.7,
    terrainLow: '#8faa52', terrainHigh: '#e0c488', terrainDirt: '#b08648',
    // steep-face colour for the faceted ground + warmth in the hut windows
    terrainScree: '#a8813f', hutGlow: 0.45,
    ground: {
      base: '#b0a266', bandLight: 'rgba(255,245,200,0.05)', bandDark: 'rgba(60,70,20,0.05)',
      patchA: 'rgba(80,120,40,0.20)', patchB: 'rgba(235,215,150,0.16)',
      speckA: 'rgba(120,150,60,0.7)', speckB: 'rgba(250,240,200,0.8)', speckCount: 80,
    },
    road: {
      base: '#b4915c', mottleA: [140, 106, 62], mottleB: [206, 174, 118],
      rut: 'rgba(115,82,44,0.55)', rutCore: 'rgba(90,60,30,0.45)', tread: 'rgba(60,38,18,0.5)',
      stoneA: 'rgba(235,214,172,0.7)', stoneB: 'rgba(130,94,54,0.7)',
      fringe: [95, 130, 45], fringeVar: [36, 46, 24],   // green creeping in
    },
    hillColor: 0xc89858, peakColor: 0xe8cc90,
    vegetation: 'palm', treeCount: 250, trunkColor: 0x8a6242,
    foliageLow: 0x2f8a3c, foliageTop: 0x45a04a,
    foliage: { h: 0.29, hVar: 0.06, s: 0.5, sVar: 0.18, l: 0.30, lVar: 0.12 },
    treeSnowCap: false, palmGrove: [0.32, 0.58],        // grove section of the lap
    tuftCount: 700, grass: { bladeA: '#5a8a2c', bladeB: '#a8c85e' },
    bushCount: 180, bushColor: 0x4a8a34,
    bush: { h: 0.27, hVar: 0.05, s: 0.45, sVar: 0.12, l: 0.30, lVar: 0.12 },
    rockCount: 90, pebbleCount: 120, rockColor: 0xb08a58, rockSnowCap: false,
    flowerCount: 260, flowerColors: ['#ffd45e', '#ff6a8a', '#ffffff', '#e86aff'],
    hutRoof: 0xc9a24d, hayColor: 0xd8b95e, hutCount: 5, hayCount: 16,
    splinter: [0x4a9a3c, 0xc9a06a],                     // shredded fronds + dry wood
    weather: { type: 'leaves', color: 0x7ac84a },
    elev: { amp: 6, ph: [1.9, 4.2, 0.8] },
    rampMaxCurv: 0.016, padMaxCurv: 0.005, boardMaxCurv: 0.014,
    oasis: true, oasisCount: 3, bridgeCount: 2, puddleCount: 9,
    critters: { kind: 'scorpion', count: 10 },          // hazard spec (lead implements)
  },
  // REDWOOD RAMPAGE: gargantuan redwood forest — the giants are SOLID and kept
  // off the road, exposed roots bump the shoulders, one hollow trunk arches
  // over the road. Strong rolling elevation, extra ramps.
  redwood: {
    fogColor: 0xd8e4cf, fogNear: 240, fogFar: 1300,
    hemiSky: 0xc8e0f4, hemiGround: 0x5a7a4a, hemiIntensity: 1.15,
    sunColor: 0xffeec8, sunIntensity: 2.6,
    skyTop: '#4e8ecf', skyHorizon: '#e0ecd0', sunGlow: 0xfff0b8,
    sunAz: 0.75, sunEl: 0.3,
    cloudCount: 8, cloudOpacity: 0.85,
    terrainLow: '#3f7a2e', terrainHigh: '#6fa04a', terrainDirt: '#7a5638',
    // steep-face colour for the faceted ground + warmth in the hut windows
    terrainScree: '#6f5236', hutGlow: 0.5,
    ground: {
      base: '#4f8636', bandLight: 'rgba(255,255,255,0.04)', bandDark: 'rgba(0,20,0,0.06)',
      patchA: 'rgba(40,80,28,0.20)', patchB: 'rgba(140,180,90,0.14)',
      speckA: 'rgba(190,140,80,0.7)', speckB: 'rgba(230,240,190,0.8)', speckCount: 70,
    },
    road: {
      base: '#8a5f3c', mottleA: [96, 64, 38], mottleB: [156, 118, 76],
      rut: 'rgba(62,42,22,0.55)', rutCore: 'rgba(44,28,14,0.45)', tread: 'rgba(26,16,8,0.5)',
      stoneA: 'rgba(196,176,146,0.7)', stoneB: 'rgba(84,58,34,0.7)',
      fringe: [48, 110, 36], fringeVar: [30, 46, 22],
    },
    hillColor: 0x3f6e34, peakColor: 0x8a8578,
    vegetation: 'redwood', treeCount: 190, trunkColor: 0x7a3f24,
    foliageLow: 0x2a5e28, foliageTop: 0x3a7a32,
    foliage: { h: 0.30, hVar: 0.05, s: 0.45, sVar: 0.18, l: 0.26, lVar: 0.10 },
    treeSnowCap: false,
    tuftCount: 800, grass: { bladeA: '#2f6a22', bladeB: '#63b243' },
    bushCount: 170, bushColor: 0x2f7a30,
    bush: { h: 0.30, hVar: 0.05, s: 0.5, sVar: 0, l: 0.28, lVar: 0.12 },
    rockCount: 120, pebbleCount: 150, rockColor: 0x8a8072, rockSnowCap: false,
    flowerCount: 160, flowerColors: ['#ffe234', '#ffffff', '#c27aff'],
    hutRoof: 0x8a5a2c, hayColor: 0xc8a468,
    splinter: [0x8a4a2a, 0xe8e2d4],                     // red bark chips
    weather: { type: 'leaves', color: 0x8a6a3a },       // drifting needle litter
    elev: { amp: 14, ph: [1.1, 3.5, 2.4] },             // strong rolling crests
    rampCount: 5, rampMaxCurv: 0.02, padMaxCurv: 0.006, boardMaxCurv: 0.016,
    obstacleSpec: { count: 5, style: 'roots' },         // exposed-root speed bumps
    hollowArch: true, puddleCount: 3,
  },
  // LOG FLUME FURY: old logging operation — sawmill camp, log-pile obstacles,
  // plank bridges. Hazard contract: strips (water-flume speed lanes).
  flume: {
    fogColor: 0xd6e2d0, fogNear: 280, fogFar: 1400,
    hemiSky: 0xb8d8f4, hemiGround: 0x527a44, hemiIntensity: 0.76,
    sunColor: 0xfff2d0, sunIntensity: 2.7,
    skyTop: '#4a90d0', skyHorizon: '#e8f0d8', sunGlow: 0xfff0c0,
    sunAz: 0.8, sunEl: 0.32,
    cloudCount: 10, cloudOpacity: 0.9,
    terrainLow: '#4c8434', terrainHigh: '#7cae52', terrainDirt: '#96703f',
    // steep-face colour for the faceted ground + warmth in the hut windows
    terrainScree: '#8a6a40', hutGlow: 0.5,
    ground: {},
    road: {
      base: '#9b7444', mottleA: [110, 78, 44], mottleB: [172, 134, 86],
      rut: 'rgba(70,48,26,0.55)', rutCore: 'rgba(50,32,16,0.45)', tread: 'rgba(30,18,8,0.5)',
      stoneA: 'rgba(200,180,150,0.7)', stoneB: 'rgba(92,66,40,0.7)',
      fringe: [64, 124, 40], fringeVar: [34, 46, 20],
    },
    hillColor: 0x4e7a3c, peakColor: 0x8d8578,
    treeCount: 240, trunkColor: 0x6b4423,
    foliageLow: 0x2c6e2a, foliageTop: 0x3c8a34,
    foliage: { h: 0.29, hVar: 0.06, s: 0.5, sVar: 0.2, l: 0.30, lVar: 0.14 },
    treeSnowCap: false,
    tuftCount: 850, grass: {},
    bushCount: 140, bushColor: 0x2f7a30,
    bush: { h: 0.30, hVar: 0.05, s: 0.5, sVar: 0, l: 0.30, lVar: 0.12 },
    rockCount: 110, pebbleCount: 150, rockColor: 0x8d8578, rockSnowCap: false,
    flowerCount: 200, flowerColors: ['#ffe234', '#ff6a8a', '#ffffff'],
    hutRoof: 0x8a5a2c, hayColor: 0x8a6238,              // hay recolored to cut-log rounds
    hutCount: 6, hayCount: 34,
    splinter: [0x8a5a32, 0xd8c89a],                     // fresh-cut timber
    weather: { type: 'leaves', color: 0xc8a468 },       // sawdust drift
    elev: { amp: 9, ph: [2.4, 0.6, 3.8] },
    rampMaxCurv: 0.014, padMaxCurv: 0.005, boardMaxCurv: 0.012,
    obstacleSpec: { count: 5, style: 'logs' }, bridgeCount: 3, puddleCount: 4,
    logYards: 12,                                       // trackside timber stacks
    strips: { kind: 'flume', count: 3 },                // hazard spec (lead implements)
  },
  // FOREST FIRE ESCAPE: the forest is burning — ember dusk, smoke sky, glowing
  // ground fissures, scorched + burning trees. Hazard contract: fallHazard.
  wildfire: {
    fogColor: 0x6a3e28, fogNear: 190, fogFar: 900,
    // smoke and firelight, but measured 22.5 mean / 52% near-black — you were
    // escaping a fire you could not see the road through
    hemiSky: 0xf0ab74, hemiGround: 0x94705a, hemiIntensity: 2.9,
    sunColor: 0xff8a48, sunIntensity: 2.6,
    skyTop: '#46292c', skyHorizon: '#e8601e', sunGlow: 0xff6a20, skyCurve: 0.66,
    sunAz: 0.55, sunEl: 0.15,
    cloudCount: 9, cloudOpacity: 0.5, cloudTint: 0x5a4238,   // smoke columns
    terrainLow: '#705a42', terrainHigh: '#94785a', terrainDirt: '#a86436',
    // steep-face colour for the faceted ground + warmth in the hut windows
    terrainScree: '#8c5a34', hutGlow: 1.2,
    ground: {
      base: '#7a6752', bandLight: 'rgba(255,255,255,0.04)', bandDark: 'rgba(0,0,0,0.06)',
      patchA: 'rgba(30,20,14,0.24)', patchB: 'rgba(130,100,68,0.14)',
      speckA: 'rgba(255,150,60,0.9)', speckB: 'rgba(190,170,150,0.7)', speckCount: 90,
      veins: { color: '#ff8a26', glow: 'rgba(255,110,20,0.4)', count: 10 },  // burning fissures
    },
    road: {
      base: '#655349', mottleA: [72, 56, 46], mottleB: [124, 104, 88],
      rut: 'rgba(140,132,128,0.3)', rutCore: 'rgba(168,158,152,0.26)',
      tread: 'rgba(22,16,12,0.55)',
      stoneA: 'rgba(185,175,165,0.7)', stoneB: 'rgba(34,26,22,0.8)',
      fringe: [90, 70, 50], fringeVar: [34, 26, 18],    // ash-choked verge
    },
    hillColor: 0x54291c, peakColor: 0x2e1812,
    vegetation: 'burnt', treeCount: 220, trunkColor: 0x241d18,
    foliageLow: 0x4a2814, foliageTop: 0x6a3a1a,         // ember-lit scorched canopy
    foliage: { h: 0.05, hVar: 0.03, s: 0.45, sVar: 0.15, l: 0.16, lVar: 0.08 },
    treeSnowCap: false,
    tuftCount: 80, grass: { bladeA: '#4a4038', bladeB: '#6a5a48' },
    bushCount: 30, bushColor: 0x3a302a,
    bush: { h: 0.08, hVar: 0.03, s: 0.15, sVar: 0.08, l: 0.16, lVar: 0.08 },
    rockCount: 160, pebbleCount: 220, rockColor: 0x3a322c, rockSnowCap: false,
    flowerCount: 0, flowerColors: ['#ff7a22'],
    hutRoof: 0x4a3a30, hayColor: 0x8a6a3a, hutCount: 2, hayCount: 0,
    splinter: [0x2c2420, 0xff6a2e],                     // charcoal + ember chips
    weather: { type: 'embers', color: 0xff8a2e },
    elev: { amp: 10, ph: [3.7, 1.5, 5.3] },
    rampMaxCurv: 0.018, padMaxCurv: 0.006, boardMaxCurv: 0.016,
    puddleCount: 0,
    fallHazard: { kind: 'burningTree', period: 7, dmg: 20 },  // hazard spec (lead implements)
  },
  // GLACIER'S GRIND: racing ON the glacier — bare blue-white sheet ice with
  // crevasse cracks, frozen slicks, pale ice canyon walls. Hazard: icicles.
  sheetice: {
    surface: 'snow',                                    // physics reads this
    fogColor: 0xdceef8, fogNear: 230, fogFar: 1250,
    hemiSky: 0xa6ccf8, hemiGround: 0x92a8cc, hemiIntensity: 0.78,
    sunColor: 0xfff2e0, sunIntensity: 2.3,
    skyTop: '#3d84c8', skyHorizon: '#e4f4fc', sunGlow: 0xf0fbff,
    sunAz: 0.75, sunEl: 0.22,
    cloudCount: 6, cloudOpacity: 0.8,
    terrainLow: '#d8e8f2', terrainHigh: '#ffffff', terrainDirt: '#a4c0d2',
    // steep-face colour for the faceted ground + warmth in the hut windows
    terrainScree: '#a8bccc', hutGlow: 0.7,
    ground: {
      base: '#e2edf4', bandLight: 'rgba(255,255,255,0.06)', bandDark: 'rgba(110,150,180,0.07)',
      patchA: 'rgba(140,180,215,0.22)', patchB: 'rgba(255,255,255,0.22)',
      speckA: 'rgba(180,215,240,0.8)', speckB: 'rgba(255,255,255,0.9)', speckCount: 100,
    },
    road: {
      // near-white blue glacier ice, crevasse-cracked by the overlay
      // was '#d5e6f2' on white ice — 22 points of separation. Swept ice over
      // a dark bed reads as a lane you can aim at.
      base: '#83919e', mottleA: [98, 110, 124], mottleB: [162, 180, 198],
      rut: 'rgba(140,168,192,0.4)', rutCore: 'rgba(120,148,176,0.35)', tread: 'rgba(96,122,150,0.4)',
      stoneA: 'rgba(245,250,255,0.8)', stoneB: 'rgba(150,180,205,0.7)',
      fringe: [232, 242, 250], fringeVar: [20, 12, 6],
      ice: true,                                        // sheet-ice glaze + crevasse cracks
      ruts: false,                                      // glazed ice never ruts
    },
    hillColor: 0xc2d8e6, peakColor: 0xf0f8fc,
    treeCount: 60, trunkColor: 0x5a4028,
    foliageLow: 0x5a7a62, foliageTop: 0x668a70,
    foliage: { h: 0.38, hVar: 0.04, s: 0.22, sVar: 0.10, l: 0.42, lVar: 0.10 },
    treeSnowCap: true,
    tuftCount: 120, grass: { bladeA: '#6a8a78', bladeB: '#c8dcd0' },
    bushCount: 40, bushColor: 0x9ab8a0,
    bush: { h: 0.40, hVar: 0.05, s: 0.18, sVar: 0.08, l: 0.55, lVar: 0.12 },
    rockCount: 140, pebbleCount: 110, rockColor: 0x9ab4c4, rockSnowCap: true,
    flowerCount: 0, flowerColors: ['#ffffff'],
    hutRoof: 0xe8f2f8, hutStyle: 'igloo', hutCount: 6, hayColor: 0xd8c07a, hayCount: 6,
    splinter: [0xdff2fc, 0x9fd8f0],                     // shattered ice chips
    weather: { type: 'snow', color: 0xffffff },
    elev: { amp: 8, ph: [2.1, 0.8, 3.9] },
    rampMaxCurv: 0.02, padMaxCurv: 0.006, boardMaxCurv: 0.018,
    // pale blue-white ice walls — tighter/taller than glacial for a tunnel feel
    cliffWalls: true,
    cliffPalette: {
      bands: ['#e6f4fb', '#cfe6f4', '#b4d6ec', '#dcedf8', '#c0dcf0'],
      seam: 'rgba(130,170,200,0.4)',
      crack: 'rgba(30,140,190,',
      bleach: 'rgba(255,255,255,0.26)',
      talus: 'rgba(100,130,160,0.26)',
      mottleLight: '255,255,255', mottleDark: '130,170,210',
      streakLight: '245,252,255', streakDark: '140,180,215',
    },
    // frozen slicks: puddle mechanic re-skinned as clear blue ice
    puddle: {
      rim: '#d8ecf6', mud: '#a8d2ea',
      sheen: 'rgba(240,252,255,0.5)', gleam: 'rgba(255,255,255,0.8)',
    },
    puddleCount: 8,
    fallHazard: { kind: 'icicle', period: 6, dmg: 16 }, // hazard spec (lead implements)
  },
  // AVALANCHE ALLEY: narrow high pass — dramatic hand-shaped climb with a long
  // downhill final third, multi-ramp jumps. Hazard contract: chase wall.
  avalanche: {
    surface: 'snow',                                    // physics reads this
    fogColor: 0xe6eef6, fogNear: 250, fogFar: 1300,
    hemiSky: 0x9ec4f2, hemiGround: 0x8fa2c8, hemiIntensity: 0.8,
    sunColor: 0xfff0dc, sunIntensity: 2.3,
    skyTop: '#5590cc', skyHorizon: '#eef6fc', sunGlow: 0xffffff,
    sunAz: 0.85, sunEl: 0.3,
    cloudCount: 10, cloudOpacity: 0.95,
    terrainLow: '#e2eaf0', terrainHigh: '#ffffff', terrainDirt: '#b0bec8',
    // steep-face colour for the faceted ground + warmth in the hut windows
    terrainScree: '#a2b4c4', hutGlow: 0.7,
    ground: {
      base: '#e6edf2', bandLight: 'rgba(255,255,255,0.06)', bandDark: 'rgba(120,150,175,0.06)',
      patchA: 'rgba(165,190,210,0.20)', patchB: 'rgba(255,255,255,0.22)',
      speckA: 'rgba(200,220,235,0.8)', speckB: 'rgba(255,255,255,0.9)', speckCount: 80,
    },
    road: {
      base: '#6f5638', mottleA: [82, 60, 38], mottleB: [130, 102, 70],
      rut: 'rgba(46,32,20,0.6)', rutCore: 'rgba(30,20,12,0.5)', tread: 'rgba(14,9,5,0.55)',
      stoneA: 'rgba(190,200,210,0.7)', stoneB: 'rgba(70,55,40,0.7)',
      fringe: [228, 238, 246], fringeVar: [24, 16, 10],
      snowCover: { slush: [206, 216, 226], slushAlpha: 0.38 },
    },
    hillColor: 0xcfdce4, peakColor: 0xf4f8fc,
    treeCount: 190, trunkColor: 0x5a4028,
    foliageLow: 0x5a7a62, foliageTop: 0x668a70,
    foliage: { h: 0.38, hVar: 0.04, s: 0.22, sVar: 0.10, l: 0.42, lVar: 0.10 },
    treeSnowCap: true,
    tuftCount: 260, grass: { bladeA: '#5a7a58', bladeB: '#b8d0c0' },
    bushCount: 60, bushColor: 0x9ab8a0,
    bush: { h: 0.40, hVar: 0.05, s: 0.18, sVar: 0.08, l: 0.52, lVar: 0.12 },
    rockCount: 220, pebbleCount: 160, rockColor: 0x9aa6b0, rockSnowCap: true,
    flowerCount: 30, flowerColors: ['#ffffff', '#cfe0ff'],
    hutRoof: 0xe8eef4, hayColor: 0xd8c07a, hutCount: 3, hayCount: 8,
    splinter: [0xdce8f0, 0x9fc4d8],
    weather: { type: 'snow', color: 0xffffff },
    // hand-shaped pass: climb through the lap's middle, hold the crest, then
    // one long committed descent through the final third — chase-wall country
    elev: {
      amp: 16, profile: 'ascent', ph: [0, 0, 0],
      keys: [[0, 0], [0.05, 0], [0.16, 5], [0.44, 14], [0.60, 16], [0.70, 15], [0.95, 0], [1, 0]],
    },
    rampCount: 5, rampMaxCurv: 0.024, padMaxCurv: 0.008, boardMaxCurv: 0.02,
    puddleCount: 3,
    chase: { kind: 'avalanche' },                       // hazard spec (lead implements)
  },
  // NEON GRID EXPRESSWAY: cyberpunk night city — near-black sky, glowing road
  // edge lines, skyscraper light-grid horizon, holo boards. Hazard: maglev strips.
  neon: {
    surface: 'wet',                                     // glossy glass-asphalt
    fogColor: 0x0a0a18, fogNear: 260, fogFar: 1400,
    // a night city still has to be a road you can place a corner on: measured
    // 20.7 mean with 39% of the frame near-black. Lifted enough to see the
    // surface between the neon linework, without losing the after-dark mood.
    hemiSky: 0x36406a, hemiGround: 0x3c3060, hemiIntensity: 2.8,
    sunColor: 0x8a9aff, sunIntensity: 2.0,               // cold moonlight
    skyTop: '#16162a', skyHorizon: '#5c2a86', sunGlow: 0xff40c0, skyCurve: 0.8,
    sunAz: 0.6, sunEl: 0.5, sunSprite: false, stars: true,
    hazeColor: 0xb93ee8, hazeOpacity: 0.4,              // city glow ringing the horizon
    cloudCount: 0, cloudOpacity: 0,
    terrainLow: '#32324a', terrainHigh: '#4a4a66', terrainDirt: '#483c66',
    // steep-face colour for the faceted ground + warmth in the hut windows
    terrainScree: '#3c3458', hutGlow: 1,
    ground: {
      base: '#3a3a4e', bandLight: 'rgba(80,240,255,0.06)', bandDark: 'rgba(0,0,0,0.07)',
      patchA: 'rgba(40,20,80,0.25)', patchB: 'rgba(30,60,90,0.18)',
      speckA: 'rgba(120,220,255,0.7)', speckB: 'rgba(255,80,220,0.6)', speckCount: 150,
    },
    road: {
      base: '#2c3140', mottleA: [40, 45, 58], mottleB: [76, 84, 104],
      rut: 'rgba(8,10,14,0.5)', rutCore: 'rgba(4,6,10,0.45)', tread: 'rgba(0,0,0,0.5)',
      stoneA: 'rgba(70,80,100,0.5)', stoneB: 'rgba(10,12,18,0.7)',
      fringe: [24, 26, 40], fringeVar: [12, 12, 20],
      wet: { darken: 0.2, gleam: 14, pools: 4 },
      neon: { edgeA: '#2af6ff', edgeB: '#ff3af0', dash: '#9a6cff' },
      ruts: false,                                      // glass-asphalt doesn't rut
    },
    roadNeon: { edgeA: '#2af6ff', edgeB: '#ff3af0', dash: '#9a6cff' },  // emissive line-work
    hillColor: 0x0e1420, peakColor: 0x141b2c, horizon: 'city',
    vegetation: 'none', treeCount: 0, trunkColor: 0x333344,
    foliageLow: 0x223344, foliageTop: 0x334455,
    foliage: { h: 0.6, hVar: 0.05, s: 0.2, sVar: 0.1, l: 0.2, lVar: 0.1 },
    treeSnowCap: false,
    tuftCount: 0, grass: {},
    bushCount: 0, bushColor: 0x223322,
    bush: { h: 0.3, hVar: 0.05, s: 0.2, sVar: 0.1, l: 0.2, lVar: 0.1 },
    rockCount: 0, pebbleCount: 0, rockColor: 0x2a2e3a, rockSnowCap: false,
    heroRock: false,
    flowerCount: 0, flowerColors: ['#26f6ff'],
    hutRoof: 0x22262e, hutCount: 0, hayColor: 0x33363e, hayCount: 0,
    splinter: [0x26f6ff, 0xff3af0],                     // shattered neon shards
    weather: { type: 'rain', color: 0x9ab8e8, rate: 90 },
    elev: { amp: 7, ph: [1.3, 4.4, 2.7] },              // gentle overpass swells
    rampMaxCurv: 0.012, padMaxCurv: 0.005, boardMaxCurv: 0.014,
    bannerStyle: 'neon',                                // holographic sponsor boards
    lamps: { color: 0x6af6ff, every: 38, height: 6.4 }, // cyan expressway lamps
    puddle: {
      rim: '#101018', mud: '#05070c',
      sheen: 'rgba(120,220,255,0.30)', gleam: 'rgba(255,80,220,0.35)',
    },
    puddleCount: 4,
    strips: { kind: 'maglev', count: 4 },               // hazard spec (lead implements)
  },
  // UNDERCITY SLIPSTREAM: the sewer underbelly — crushing dark fog, grimy
  // concrete tunnel walls, sickly lamp light, debris. Hazard: rats.
  undercity: {
    // MEASURED THE DARKEST WORLD IN THE GAME: mean luminance 7.6/255 with 95%
    // of the frame below 18 — against 89 and 1.8% for Pine Valley. Grimy is a
    // look; unlit is not. Same fault as Ember Pass: the ground texture
    // multiplies the terrain vertex colour, and '#262a20' over '#23261e' lands
    // at an albedo of about 6/255, which no lamp can rescue. Fog closing at
    // 460 u finished the job. Lit like a sodium-lamp service tunnel now — the
    // sickly green cast is intact, you can just see the road in it.
    fogColor: 0x3a4430, fogNear: 130, fogFar: 950,
    // Proved by experiment rather than argued: tripling the fill (2.7 -> 9)
    // doubled frame luminance, so the walls were simply under-lit, not shadowed
    // or mis-normalled. The slot canyon is most of what you look at here, and
    // vertical faces get almost nothing but this term.
    hemiSky: 0x8a9a5c, hemiGround: 0x5a5e46, hemiIntensity: 5.5,
    sunColor: 0xd8e87a, sunIntensity: 3.0,               // sickly grate-light shafts
    // The sky was the other half of it. Lighting the ground does nothing for
    // the top half of a chase-camera frame, and skyTop '#05070a' is black —
    // so roughly half the screen stayed at zero however bright the road got.
    skyTop: '#222c1e', skyHorizon: '#3e4a2e', sunGlow: 0x9aa858, skyCurve: 0.8,
    sunAz: 0.4, sunEl: 0.6, sunSprite: false,
    hazeColor: 0x4a5436, hazeOpacity: 0.32,
    cloudCount: 0, cloudOpacity: 0,
    terrainLow: '#4e5442', terrainHigh: '#6e745c', terrainDirt: '#5e4e36',
    // steep-face colour for the faceted ground + warmth in the hut windows
    terrainScree: '#585648', hutGlow: 1,
    ground: {
      base: '#5e6550', bandLight: 'rgba(255,255,255,0.04)', bandDark: 'rgba(0,0,0,0.07)',
      patchA: 'rgba(36,42,28,0.22)', patchB: 'rgba(120,130,96,0.16)',
      speckA: 'rgba(150,170,90,0.5)', speckB: 'rgba(140,150,160,0.6)', speckCount: 60,
    },
    road: {
      // grimy stained concrete
      base: '#4a4e44', mottleA: [54, 58, 50], mottleB: [98, 102, 92],
      rut: 'rgba(20,24,18,0.55)', rutCore: 'rgba(12,15,10,0.5)', tread: 'rgba(5,7,4,0.55)',
      stoneA: 'rgba(140,146,134,0.6)', stoneB: 'rgba(24,28,20,0.7)',
      fringe: [42, 50, 32], fringeVar: [18, 22, 14],    // slime creeping from the walls
      wet: { darken: 0.12, gleam: 10, pools: 5 },       // permanently damp
      ruts: false,                                      // poured concrete doesn't rut
    },
    hillColor: 0x3a4030, peakColor: 0x4a5240,
    vegetation: 'none', treeCount: 0, trunkColor: 0x33362c,
    foliageLow: 0x2a3020, foliageTop: 0x3a4030,
    foliage: { h: 0.2, hVar: 0.05, s: 0.2, sVar: 0.1, l: 0.2, lVar: 0.1 },
    treeSnowCap: false,
    tuftCount: 90, grass: { bladeA: '#5a6a30', bladeB: '#8a9a48' },
    bushCount: 40, bushColor: 0x3a4a28,
    bush: { h: 0.22, hVar: 0.04, s: 0.3, sVar: 0.1, l: 0.18, lVar: 0.08 },
    rockCount: 130, pebbleCount: 260, rockColor: 0x6e7264, rockSnowCap: false,
    flowerCount: 0, flowerColors: ['#8a9a48'],
    hutRoof: 0x3a3e34, hutCount: 0, hayColor: 0x5a5e50, hayCount: 0,
    splinter: [0x4a4e44, 0x8a9a48],                     // concrete + slime chips
    weather: { type: 'dust', color: 0x6a7048 },         // drifting spore motes
    elev: { amp: 5, ph: [0.8, 2.3, 4.9] },
    rampMaxCurv: 0.022, padMaxCurv: 0.0075, boardMaxCurv: 0.02,
    cliffWalls: true,
    cliffPalette: {                                     // stained tunnel concrete
      bands: ['#6e7466', '#5c6256', '#7c8272', '#545a4c', '#666c5e'],
      seam: 'rgba(20,24,18,0.6)',
      crack: 'rgba(100,120,55,',                        // moss-choked cracks
      bleach: 'rgba(160,170,140,0.1)',
      talus: 'rgba(10,12,8,0.35)',
      mottleLight: '140,150,120', mottleDark: '20,24,16',
      streakLight: '120,130,100', streakDark: '15,18,10',
    },
    lamps: { color: 0xd8e87a, every: 22, height: 4.6 }, // sickly service lamps
    puddle: {
      rim: '#20241c', mud: '#0a0e08',
      sheen: 'rgba(140,160,90,0.25)', gleam: 'rgba(190,210,120,0.3)',
    },
    puddleCount: 7,
    critters: { kind: 'rat', count: 12 },               // hazard spec (lead implements)
  },
  // GOTTHARD CLIMB: the flagship pass. Eight stacked hairpins climb a granite
  // face; dry-stone retaining walls line every outside edge, the alpine
  // village sits in the valley around the start line, and the pine forest
  // thins to bare rock as the road gains altitude.
  pass: {
    fogColor: 0xd6eaf8, fogNear: 330, fogFar: 1600,
    hemiSky: 0xa8ccff, hemiGround: 0x548044, hemiIntensity: 0.76,
    sunColor: 0xfff4dc, sunIntensity: 2.8,
    skyTop: '#2a68c4', skyHorizon: '#dceffa', sunGlow: 0xfff4cc,
    sunAz: 0.95, sunEl: 0.34,
    cloudCount: 12, cloudOpacity: 0.9,
    terrainLow: '#4e8a3e', terrainHigh: '#94a888', terrainDirt: '#8a8074',
    // steep-face colour for the faceted ground + warmth in the hut windows
    terrainScree: '#8a8074', hutGlow: 0.5,
    skirtColor: '#948f85',                              // grey masonry cut face
    ground: {},
    road: {
      // weathered grey mountain asphalt over a gravel base
      base: '#6f6a63', mottleA: [82, 78, 72], mottleB: [136, 132, 124],
      ruts: false,          // sealed asphalt — hard ground never takes a rut
      rut: 'rgba(52,50,46,0.45)', rutCore: 'rgba(38,36,34,0.4)', tread: 'rgba(20,18,16,0.45)',
      stoneA: 'rgba(200,196,186,0.65)', stoneB: 'rgba(68,64,58,0.7)',
      fringe: [70, 118, 50], fringeVar: [34, 46, 24],
    },
    hillColor: 0x557a4e, peakColor: 0xe4edf4,
    treeCount: 320, trunkColor: 0x6b4423,
    foliageLow: 0x276634, foliageTop: 0x3d9444,
    foliage: { h: 0.31, hVar: 0.06, s: 0.52, sVar: 0.2, l: 0.28, lVar: 0.13 },
    treeSnowCap: false,
    treeAltFade: [14, 34],                              // pines thin out with altitude
    tuftCount: 900, grass: {},
    bushCount: 150, bushColor: 0x2f7a30,
    bush: { h: 0.30, hVar: 0.05, s: 0.5, sVar: 0, l: 0.30, lVar: 0.12 },
    rockCount: 420, pebbleCount: 300, rockColor: 0x8b8a82, rockSnowCap: false,
    flowerCount: 240, flowerColors: ['#ffffff', '#ffe234', '#7a9aff', '#ff6a8a'],
    hutRoof: 0x7a4630, hayColor: 0xd8b95e,
    hutCount: 13, hutZone: [0.84, 0.16],                // village clustered in the valley
    hayCount: 34,
    splinter: [0x8a5a32, 0xe8e2d4],
    weather: { type: 'snow', color: 0xffffff, rate: 60 },
    // hand-shaped monotone climb through the switchback stack: valley → face
    // → summit shelf ≈ 45u → three sweeps back down to the valley floor.
    elev: {
      amp: 45, profile: 'ascent', ph: [0, 0, 0],
      keys: [[0, 0], [0.05, 0], [0.145, 4], [0.25, 14], [0.35, 24], [0.45, 34],
        [0.545, 44], [0.58, 45], [0.64, 36.6], [0.70, 28.2], [0.76, 19.8],
        [0.82, 11.4], [0.90, 0], [1, 0]],
    },
    rampMaxCurv: 0.012, padMaxCurv: 0.0035, boardMaxCurv: 0.010,
    // dry-stone parapets on every edge that drops away
    retainingWalls: { drop: 2.0, lateral: 12.7, height: 1.5, max: 460 },
    obstacleSpec: { count: 3, style: 'boulder', downhill: true }, puddleCount: 2,
    elements: 'alpine',
    snowPatches: { count: 70, minY: 28 },                // altitude snowfields
    // the mountain the road climbs into, standing beyond the summit shelf
    massif: { az: 1.45, spread: 1.7, count: 9, r0: 380, r1: 620,
      h0: 130, h1: 260, w0: 190, w1: 340 },
  },
  // TREMOLA DESCENT: the old cobbled road. The lap starts on the summit
  // plateau and falls straight into nine tighter hairpins of stone setts,
  // stone parapets on the outside of each, then a gorge run-out and the long
  // modern climb back up the east flank.
  tremola: {
    fogColor: 0xcfdfec, fogNear: 300, fogFar: 1500,
    hemiSky: 0xa8cbf0, hemiGround: 0x58724a, hemiIntensity: 0.76,
    sunColor: 0xffeed4, sunIntensity: 2.7,
    skyTop: '#3570bc', skyHorizon: '#dae8f2', sunGlow: 0xffeec8,
    sunAz: 0.42, sunEl: 0.26,                           // low afternoon sun down the valley
    cloudCount: 13, cloudOpacity: 0.95,
    terrainLow: '#4a7c3e', terrainHigh: '#8f9a84', terrainDirt: '#7d766a',
    // steep-face colour for the faceted ground + warmth in the hut windows
    terrainScree: '#837a6e', hutGlow: 0.5,
    skirtColor: '#8b8579',
    ground: {},
    road: {
      // dark granite base — the setts are painted over it by `cobbles`
      base: '#5f5b54', mottleA: [70, 67, 62], mottleB: [118, 114, 106],
      rut: 'rgba(44,42,38,0.5)', rutCore: 'rgba(30,29,26,0.45)', tread: 'rgba(16,15,13,0.4)',
      stoneA: 'rgba(186,182,172,0.6)', stoneB: 'rgba(62,59,54,0.7)',
      fringe: [78, 112, 54], fringeVar: [32, 44, 24],
      ruts: false,          // stone setts don't rut — polish bands come from the cobble pass
      cobbles: {                                        // Tremola stone setts
        stones: ['#7d7a73', '#6c6963', '#87817a', '#5e5c58', '#8e887e', '#74726d'],
        mortar: 'rgba(38,36,33,0.9)', lip: 'rgba(255,250,235,0.13)',
        rows: 32, per: 21,                              // small hand-laid setts
      },
    },
    hillColor: 0x4e7248, peakColor: 0xdde8f0,
    treeCount: 220, trunkColor: 0x6b4423,
    foliageLow: 0x2a6636, foliageTop: 0x428a48,
    foliage: { h: 0.29, hVar: 0.07, s: 0.45, sVar: 0.2, l: 0.28, lVar: 0.14 },
    treeSnowCap: false,
    treeAltFade: [-26, -4],                             // larch only low in the gorge
    tuftCount: 780, grass: {},
    bushCount: 130, bushColor: 0x357a34,
    bush: { h: 0.30, hVar: 0.05, s: 0.45, sVar: 0.1, l: 0.28, lVar: 0.12 },
    rockCount: 460, pebbleCount: 340, rockColor: 0x847f76, rockSnowCap: false,
    flowerCount: 200, flowerColors: ['#ffffff', '#ffe234', '#c27aff', '#ff6a8a'],
    hutRoof: 0x6a5b4a, hayColor: 0xd0b46a,
    hutCount: 12, hutZone: [0.62, 0.84],                // hamlet on the gorge floor
    hayCount: 26,
    splinter: [0x8a8378, 0xe8e2d4],
    weather: { type: 'leaves', color: 0x9aa878 },
    // starts on the plateau (the start line is always y=0), falls 40u through
    // the cobbled stack to the gorge floor, then climbs the far flank back
    elev: {
      amp: 40, profile: 'ascent', ph: [0, 0, 0],
      keys: [[0, 0], [0.05, 0], [0.145, -4], [0.24, -13], [0.33, -22], [0.42, -30],
        [0.515, -39], [0.56, -40], [0.64, -32], [0.72, -24], [0.80, -16],
        [0.88, -7], [0.95, 0], [1, 0]],
    },
    rampMaxCurv: 0.012, padMaxCurv: 0.0035, boardMaxCurv: 0.010,
    retainingWalls: { drop: 2.0, lateral: 12.7, height: 1.35, max: 460 },
    obstacleSpec: { count: 3, style: 'boulder', downhill: true }, puddleCount: 0,
    elements: 'alpine',
    massif: { az: 1.45, spread: 1.8, count: 9, r0: 400, r1: 640,
      h0: 140, h1: 270, w0: 200, w1: 350 },
  },
  // FURKA RIDGE: deep-winter alpine pass — snow-white valley, jagged grey rock
  // with snow on every ledge, snow-capped pines, log cabins on the shelves and
  // a reddish wooden guard fence running the downhill edge of the serpentine.
  // The road itself stays brown rutted dirt, ploughed clear of the snow.
  furka: {
    surface: 'snow',                                    // physics reads this
    fogColor: 0xdfeaf4, fogNear: 300, fogFar: 1600,
    hemiSky: 0xb0d0ff, hemiGround: 0x94a6c4, hemiIntensity: 0.78,
    sunColor: 0xfff2e0, sunIntensity: 2.45,
    skyTop: '#3f7fc8', skyHorizon: '#e6f1f8', sunGlow: 0xfffbe8,
    // high sun: a low winter sun threw car/tower shadows the length of the
    // bridge deck and read as a black stripe down the middle of the crossing
    sunAz: 0.72, sunEl: 0.62,
    cloudCount: 10, cloudOpacity: 0.9,
    terrainLow: '#dfe7ec', terrainHigh: '#ffffff', terrainDirt: '#9a8a72',
    // steep-face colour for the faceted ground + warmth in the hut windows
    terrainScree: '#9a8a72', hutGlow: 0.65,
    skirtColor: '#8e8a80',                              // rock cut below the shelf
    ground: {
      base: '#e8eef3', bandLight: 'rgba(255,255,255,0.06)', bandDark: 'rgba(120,150,175,0.05)',
      patchA: 'rgba(150,140,120,0.16)', patchB: 'rgba(255,255,255,0.24)',
      speckA: 'rgba(190,200,210,0.7)', speckB: 'rgba(255,255,255,0.9)', speckCount: 80,
    },
    road: {
      // classic brown rutted dirt, ploughed clear — but the verge is snow,
      // not grass, and the ruts run a little darker in the wet cold
      base: '#8a6a44', mottleA: [104, 78, 48], mottleB: [166, 132, 88],
      rut: 'rgba(62,44,26,0.55)', rutCore: 'rgba(44,30,16,0.45)', tread: 'rgba(24,16,8,0.5)',
      stoneA: 'rgba(214,206,190,0.7)', stoneB: 'rgba(88,66,42,0.7)',
      fringe: [222, 232, 240], fringeVar: [24, 16, 10],
    },
    hillColor: 0x9aa4ac, peakColor: 0xf2f7fb,           // grey rock, snow crowns
    treeCount: 320, trunkColor: 0x5a4028,
    foliageLow: 0x2c6a3a, foliageTop: 0x3f8c4c,         // deep winter green
    foliage: { h: 0.35, hVar: 0.04, s: 0.42, sVar: 0.12, l: 0.30, lVar: 0.08 },
    treeSnowCap: true,                                  // white tips on every tier
    treeAltFade: [22, 40],                              // thinning towards the top
    tuftCount: 300, grass: { bladeA: '#5a7a58', bladeB: '#c8d8d0' },
    bushCount: 70, bushColor: 0x9ab8a0,
    bush: { h: 0.40, hVar: 0.05, s: 0.18, sVar: 0.08, l: 0.52, lVar: 0.12 },
    rockCount: 520, pebbleCount: 380, rockColor: 0x9aa4ac, rockSnowCap: true,
    flowerCount: 0, flowerColors: ['#ffffff'],
    hutRoof: 0x6a4028, hayColor: 0xc8bc94,
    hutCount: 8, hutZone: [0.86, 0.14], hayCount: 12,   // cabins in the valley
    splinter: [0x8a5a32, 0xdce8f0],
    weather: { type: 'snow', color: 0xffffff },
    // climb the face through the serpentine, traverse the shoulder, drop back
    elev: {
      amp: 34, profile: 'ascent', ph: [0, 0, 0],
      keys: [[0, 0], [0.05, 0], [0.145, 4], [0.25, 12], [0.35, 20], [0.45, 28],
        [0.575, 34], [0.61, 34], [0.69, 26], [0.77, 18], [0.85, 9], [0.93, 0], [1, 0]],
    },
    // the shelf: ground leaves the road close in and the open valley sits well
    // below the road datum, so every leg stands proud of the one beneath it
    blend: { near: 14, far: 62 }, hillDrop: 8,
    shelfRoad: true,                                    // steep cut face, no apron
    rampMaxCurv: 0.012, padMaxCurv: 0.0035, boardMaxCurv: 0.010,
    // reddish-brown BREAKABLE rail fence down the outside edge of the pass
    guardFence: { lateral: 12.8, color: 0x8a4a2e, max: 190 },
    roadCabins: 5,                                      // log cabins on the shelves
    obstacleSpec: { count: 3, style: 'boulder', downhill: true }, puddleCount: 0,
    elements: 'alpine',
    snowPatches: { count: 60, minY: 20 },
    glacier: true,
    // hero crossing: a rope suspension bridge over a red-rock river gorge on
    // the valley run-in (the straightest window in that stretch of the lap)
    heroBridge: { at: [0.82, 0.92], half: 26, len: 230, depth: 30, skew: 0 },
    massif: { az: 1.5, spread: 2.1, count: 11, r0: 380, r1: 660,
      h0: 150, h1: 300, w0: 200, w1: 360 },
  },
};

/** Free every geometry, material and texture under `root`, then empty it.
 *
 *  GPU resources are not garbage collected — dropping the last JS reference to
 *  a mesh leaves its buffers and textures resident until dispose() is called.
 *  Swapping level without this leaked a whole world each time (measured: ~290
 *  geometries and ~180 textures over eight swaps, on a phone).
 *
 *  Everything textures.js hands out is freshly made per call, so it belongs to
 *  the world that asked for it — the sole exception is the memoised contact
 *  shadow, which tags itself `userData.shared` and is left alone. Geometry can
 *  opt out the same way. */
export function disposeSubtree(root) {
  if (!root) return;
  const geos = new Set(), mats = new Set();
  const freeTex = (t) => { if (t && t.isTexture && !t.userData?.shared) t.dispose(); };
  const freeMat = (m) => {
    if (!m || mats.has(m) || m.userData?.shared) return;
    mats.add(m);
    for (const k of ['map', 'emissiveMap', 'normalMap', 'roughnessMap', 'metalnessMap',
      'alphaMap', 'aoMap', 'bumpMap', 'displacementMap', 'lightMap', 'envMap']) freeTex(m[k]);
    m.dispose();
  };
  root.traverse((o) => {
    const g = o.geometry;
    if (g && !geos.has(g) && !g.userData?.shared) { geos.add(g); g.dispose(); }
    const m = o.material;
    if (Array.isArray(m)) m.forEach(freeMat); else freeMat(m);
  });
  root.clear();
}

/** Where the world's border wall begins. Vehicles read this: the traction
 *  limit that makes the wall unclimbable must apply HERE and nowhere else. */
export const RIM_RADIUS = 1620;
const _clearV = new THREE.Vector3();   // scratch for _clearsRoad

/** Hermite ease on an already-normalised 0..1 ramp (clamps its own ends). */
const smoothstep01 = (t) => {
  const u = t <= 0 ? 0 : t >= 1 ? 1 : t;
  return u * u * (3 - 2 * u);
};

const N = 900;              // centerline samples
/** Title-screen minimaps: the raw circuit control polygon for a theme. */
export function circuitPoints(themeKey) { return CIRCUITS[themeKey] || CIRCUITS.forest; }

export const ROAD_HALF = 9; // drivable half-width
export const WALL_OFF = 10.4;

// ---- width-variation ----
// Per-theme narrow-section tuning: {count, min} — `min` is the pinch floor as
// a fraction of ROAD_HALF. Themes may also declare `narrows` directly on their
// THEMES entry (it wins). Cliff-walled corridors (canyon/glacial/ravine/
// sheetice/undercity) are auto-off — those roads are already the constraint.
// Everything else defaults to { count: 3, min: 0.6 }.
const NARROW_TUNE = {
  avalanche: { count: 4, min: 0.55 },  // the pass squeezes hardest
  alpine: { count: 2, min: 0.62 },     // switchback stack is left alone
  dunes: { count: 2, min: 0.65 },      // fast flow world — gentler pinches
  neon: { count: 2, min: 0.65 },       // expressway keeps its speed
};
// ---- river-fords ----
// Worlds with shallow watercourses crossing the road (visible stream + splash
// + wet-tire traction loss; consumed by the vehicle code via track.fords).
// Themes may declare `fords: {count}` on their THEMES entry (it wins).
const FORD_TUNE = {
  forest: { count: 2 }, alpine: { count: 2 }, jungle: { count: 3 },
  oasis: { count: 2 }, flume: { count: 2 }, redwood: { count: 2 },
};
// ---- viz-zones ----
// Sectional visibility hazards, per theme: [kind, count] pairs.
//   'forest'  — thick tree corridor pressed against both road edges + gloom
//   'fogbank' — localized dense fog (pure zone data; runtime pulls fog in)
//   'squall'  — rain burst + fog pull on wet worlds
// Exposed as track.vizZones [{i0, i1, len, mid, half, kind, strength}];
// the game lead lerps scene fog from it, rivals slow inside.
const VIZ_TUNE = {
  forest: [['forest', 2], ['squall', 1]],
  alpine: [['forest', 2], ['fogbank', 1]],
  redwood: [['forest', 2]],
  flume: [['forest', 2]],
  wildfire: [['forest', 1]],
  jungle: [['forest', 2], ['squall', 1]],
  avalanche: [['forest', 1], ['fogbank', 2]],
  snow: [['fogbank', 2]],
  glacial: [['fogbank', 1]],
  sheetice: [['fogbank', 1]],
};

const SPONSORS = [
  ['AETHER', '#14243a', '#7fd4ff'],
  ['HYPER-FLUX', '#2a1436', '#ff7fd4'],
  ['CLAW TIRES', '#1c1812', '#e8b83a'],
  ['VOLT FUEL', '#26300f', '#d4ff5e'],
  ['RALLY CO.', '#3a1414', '#ffd4c2'],
];
// NEO-KYOTO holo sponsors: near-black panels, searing neon lettering
const NEON_SPONSORS = [
  ['KIRIN CYBER', '#050510', '#2af6ff'],
  ['LOTUS-9', '#0a0514', '#ff3af0'],
  ['HYPER-FLUX', '#02101a', '#7fd4ff'],
  ['ONI RAMEN', '#140505', '#ffd23a'],
  ['VOLT', '#0a1405', '#d4ff5e'],
];

// ---------- destructible prop catalog ----------
// Per-theme mix of smashable roadside props ([type, count]); every level totals
// well under 60 individual meshes. Geometry (and theme-independent materials)
// are shared module-wide — each prop is still its own cheap Mesh/Group so the
// game code can knock it flying individually.
const PROP_SPECS = {
  forest: [['hay', 22], ['crate', 16], ['cone', 14]],
  desert: [['crate', 16], ['cone', 14], ['barrel', 18]],
  snow: [['snowman', 16], ['crate', 16], ['cone', 14]],
  canyon: [['crate', 16], ['barrel', 13], ['cone', 13], ['rock', 8]],
  volcano: [['barrel', 18], ['crate', 16], ['cone', 14]],
  alpine: [['hay', 20], ['crate', 16], ['cone', 14]],
  glacial: [['penguin', 10], ['snowman', 10], ['crate', 14], ['barrel', 10]],
  jungle: [['crate', 14], ['barrel', 12], ['cone', 12], ['hay', 14]],
  dunes: [['barrel', 16], ['crate', 16], ['cone', 14]],
  ravine: [['crate', 14], ['barrel', 14], ['cone', 12], ['rock', 8]],
  oasis: [['crate', 16], ['barrel', 12], ['hay', 14], ['cone', 10]],
  redwood: [['hay', 18], ['crate', 16], ['cone', 12]],
  flume: [['hay', 26], ['crate', 16], ['barrel', 12]],   // hay = cut-log rounds here
  wildfire: [['barrel', 18], ['crate', 14], ['cone', 12]],
  sheetice: [['penguin', 10], ['snowman', 10], ['crate', 14], ['barrel', 10]],
  avalanche: [['snowman', 14], ['crate', 16], ['cone', 12], ['hay', 10]],
  neon: [['barrel', 18], ['crate', 16], ['cone', 14]],
  undercity: [['crate', 18], ['barrel', 18], ['cone', 12]],
  pass: [['hay', 20], ['crate', 16], ['cone', 14], ['rock', 8]],
  tremola: [['hay', 16], ['crate', 16], ['cone', 14], ['rock', 10]],
  furka: [['snowman', 10], ['crate', 16], ['cone', 14], ['rock', 12]],
};
const PROP_SCORE = { cone: 25, crate: 50, hay: 40, barrel: 60, snowman: 75, rock: 20, penguin: 40 };
const _m4 = new THREE.Matrix4(); // scratch (smashTree instance-zeroing)
const PROP_PICKUPS = ['health', 'missile', 'nitro', 'mine'];
// theme tints for the barrel drum texture
const BARREL_PALETTES = {
  desert: { base: '#c29a5c', hoop: '#4a3620' },
  canyon: { base: '#9a6440', hoop: '#33291e' },
  volcano: { base: '#37322e', hoop: '#191512', stripe: '#e8381e' },
  glacial: { base: '#7aa8c4', hoop: '#2c4456', stripe: '#e8f2f8' },
  jungle: { base: '#5a7a34', hoop: '#2c3a1a', stripe: '#c8b45e' },
  dunes: { base: '#c9a05e', hoop: '#4a3620' },
  ravine: { base: '#8f5434', hoop: '#2e2016' },
  wildfire: { base: '#2e2a26', hoop: '#141210', stripe: '#e8481e' },
  sheetice: { base: '#8ab4d0', hoop: '#2c4456', stripe: '#eef6fc' },
  avalanche: { base: '#7aa8c4', hoop: '#2c4456', stripe: '#e8f2f8' },
  neon: { base: '#22262e', hoop: '#101318', stripe: '#26f6ff' },
  undercity: { base: '#3a4034', hoop: '#181c14', stripe: '#8a9a3c' },
};

// ---------- world elements: farms, chapels, outposts, field walls ----------
// Every world gets lived-in structures out in the country: places to go and
// smash. A "kit" is one theme family's palette + which archetypes it builds.
// Buildings are SOLID ('hut' → they crash big); field walls are SOLID stone;
// rail fences, troughs, feed bins and hay racks are BREAKABLE props (they go
// through this.props, so cars AND weapons destroy them).
const ELEMENT_KITS = {
  alpine: {
    wall: 0xe2d6bc, wall2: 0x9c6c40, roof: 0x7a4630, trim: 0x5d4426, stone: 0x9a978e,
    builds: ['barn', 'house', 'house', 'shed'], landmarks: ['chapel', 'silo'],
    dress: ['logpile', 'well'], fenceColor: 0xc4a87c, stoneWalls: 5,
  },
  farm: {
    wall: 0xdac9a4, wall2: 0xa8442e, roof: 0x8a3a2a, trim: 0x5d4426, stone: 0x8d8578,
    builds: ['barn', 'house', 'shed', 'house'], landmarks: ['silo', 'windmill'],
    dress: ['logpile', 'well'], fenceColor: 0xc8b48a, stoneWalls: 3,
  },
  desert: {
    wall: 0xdcbd90, wall2: 0xc09a68, roof: 0xa8794a, trim: 0x6a4a2c, stone: 0xb08a5c,
    builds: ['adobe', 'adobe', 'shed'], landmarks: ['watchtower', 'well'],
    dress: ['well', 'logpile'], fenceColor: 0xc9a06a, stoneWalls: 4,
  },
  jungle: {
    wall: 0xac9660, wall2: 0x8a7a44, roof: 0x6f8a38, trim: 0x5a4a28, stone: 0x6a7a5a,
    builds: ['stilt', 'stilt', 'shed'], landmarks: ['watchtower'],
    dress: ['logpile'], fenceColor: 0x9a8a54, stoneWalls: 1,
  },
  ice: {
    wall: 0xd2dae2, wall2: 0x8a9aa8, roof: 0x56646f, trim: 0x3a4650, stone: 0x9ab0c0,
    builds: ['signalhut', 'shed', 'shed'], landmarks: ['watchtower'],
    dress: ['logpile'], fenceColor: 0xb8c4cc, stoneWalls: 2,
  },
  city: {
    wall: 0x3c424a, wall2: 0x2a3038, roof: 0x22262c, trim: 0x6a7280, stone: 0x4a4e54,
    builds: ['kiosk', 'shed', 'kiosk'], landmarks: ['watchtower'],
    dress: ['logpile'], fenceColor: 0x5a6068, stoneWalls: 2,
    // no cattle under the expressway: the livestock dressing (water trough,
    // feed bin, hay rack) is dropped and the budget goes into more grey
    // barrier runs, which read as crowd/works hoarding in a city
    field: [], fenceRuns: 5,
  },
  burnt: {
    wall: 0x4c4038, wall2: 0x3a3028, roof: 0x2e2620, trim: 0x241d18, stone: 0x4a4238,
    builds: ['shed', 'house', 'barn'], landmarks: ['watchtower'],
    dress: ['logpile'], fenceColor: 0x4a3c30, stoneWalls: 3,
  },
};
// Species mix for the default (conifer-family) forest builder, per theme:
// [[species, weight]...]. Species live in _buildForest. Themes not listed
// fall back to the classic two-pine stand; a theme can override the whole
// mix via T.floraMix.
const FLORA_MIX = {
  forest: [['pineA', 0.34], ['pineB', 0.22], ['birch', 0.24], ['oak', 0.20]],
  // Amazon: emergents over a closed mid-storey over tree ferns. Weighted so the
  // emergents are the minority they are in life — they read because they tower,
  // not because there are many of them.
  jungle: [['cecropia', 0.44], ['treeFern', 0.32], ['kapok', 0.24]],
  flume: [['pineA', 0.38], ['pineB', 0.20], ['birch', 0.20], ['oak', 0.22]],
  snow: [['pineA', 0.42], ['pineB', 0.23], ['birchBare', 0.35]],
  glacial: [['pineA', 0.45], ['pineB', 0.25], ['birchBare', 0.30]],
  sheetice: [['pineA', 0.5], ['birchBare', 0.5]],
  avalanche: [['pineA', 0.35], ['pineB', 0.20], ['larch', 0.25], ['birchBare', 0.20]],
  alpine: [['pineA', 0.40], ['pineB', 0.25], ['larch', 0.35]],
  pass: [['pineA', 0.34], ['pineB', 0.22], ['larch', 0.28], ['birch', 0.16]],
  tremola: [['pineA', 0.36], ['pineB', 0.22], ['larch', 0.42]],
  furka: [['pineA', 0.40], ['pineB', 0.22], ['larch', 0.38]],
};

// How many decorative side-road junctions each RURAL world gets (city, ice
// and cliff-walled worlds get none). A theme can override via T.crossroads.
const THEME_CROSSROADS = {
  forest: 3, desert: 2, snow: 2, alpine: 3, oasis: 2, redwood: 2, flume: 2,
  wildfire: 2, pass: 3, tremola: 2, furka: 2,
};
const ELEMENT_KIT_BY_THEME = {
  forest: 'farm', desert: 'desert', snow: 'alpine', canyon: 'desert', volcano: 'burnt',
  alpine: 'alpine', glacial: 'ice', jungle: 'jungle', dunes: 'desert', ravine: 'desert',
  oasis: 'desert', redwood: 'farm', flume: 'farm', wildfire: 'burnt', sheetice: 'ice',
  avalanche: 'alpine', neon: 'city', undercity: 'city',
  pass: 'alpine', tremola: 'alpine', furka: 'alpine',
};

/** Unit gable-roof prism: 1×1×1, base at y=0, ridge running along local X at
 *  (y=1, z=0). Eight triangles, shared by every pitched roof in the game. */
let PRISM_GEO = null;
function gablePrismGeo() {
  if (PRISM_GEO) return PRISM_GEO;
  const A = [-0.5, 0, -0.5], Bv = [0.5, 0, -0.5], C = [0.5, 0, 0.5], D = [-0.5, 0, 0.5];
  const E = [-0.5, 1, 0], F = [0.5, 1, 0];
  const tris = [
    [A, Bv, C], [A, C, D],            // floor
    [A, F, Bv], [A, E, F],            // back pitch
    [D, C, F], [D, F, E],             // front pitch
    [A, D, E], [Bv, F, C],            // gable ends
  ];
  const pos = new Float32Array(tris.length * 9);
  const uv = new Float32Array(tris.length * 6);
  let o = 0, u = 0;
  for (const t of tris) {
    for (const v of t) {
      pos[o++] = v[0]; pos[o++] = v[1]; pos[o++] = v[2];
      uv[u++] = v[0] + 0.5; uv[u++] = v[1];
    }
  }
  PRISM_GEO = new THREE.BufferGeometry();
  PRISM_GEO.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  PRISM_GEO.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  PRISM_GEO.computeVertexNormals();
  return PRISM_GEO;
}

/** Merge a list of box specs {w,h,d,x,y,z,ry?} into ONE BufferGeometry so a
 *  multi-part smashable (a fence bay, a trough, a hay rack) costs a single
 *  mesh. Build-time only. */
function mergeBoxes(specs) {
  const geos = specs.map((s) => {
    const g = new THREE.BoxGeometry(s.w, s.h, s.d).toNonIndexed();
    const m = new THREE.Matrix4().makeRotationY(s.ry || 0);
    m.setPosition(s.x, s.y, s.z);
    g.applyMatrix4(m);
    return g;
  });
  let total = 0;
  for (const g of geos) total += g.attributes.position.count;
  const pos = new Float32Array(total * 3), nrm = new Float32Array(total * 3);
  const uv = new Float32Array(total * 2);
  let o = 0;
  for (const g of geos) {
    const n = g.attributes.position.count;
    pos.set(g.attributes.position.array, o * 3);
    nrm.set(g.attributes.normal.array, o * 3);
    uv.set(g.attributes.uv.array, o * 2);
    o += n;
    g.dispose();
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
  out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return out;
}

let PROP_ASSETS = null;
function propAssets() {
  if (PROP_ASSETS) return PROP_ASSETS;
  const hay = new THREE.CylinderGeometry(0.8, 0.8, 1.5, 10);
  hay.rotateZ(Math.PI / 2);
  hay.translate(0, 0.8, 0);
  const crate = new THREE.BoxGeometry(1.55, 1.55, 1.55);
  crate.translate(0, 0.78, 0);
  const cone = new THREE.ConeGeometry(0.55, 1.35, 10);
  cone.translate(0, 0.74, 0);
  const coneBase = new THREE.BoxGeometry(1.05, 0.14, 1.05);
  coneBase.translate(0, 0.07, 0);
  const barrel = new THREE.CylinderGeometry(0.62, 0.66, 1.5, 12);
  barrel.translate(0, 0.75, 0);
  const rock = new THREE.DodecahedronGeometry(0.7, 0);
  rock.translate(0, 0.32, 0);
  PROP_ASSETS = {
    geo: {
      hay, crate, cone, coneBase, barrel, rock,
      ballBody: new THREE.SphereGeometry(0.8, 12, 9),
      ballHead: new THREE.SphereGeometry(0.52, 12, 9),
      eye: new THREE.SphereGeometry(0.07, 6, 5),
      carrot: new THREE.ConeGeometry(0.1, 0.5, 6),
      // voxel penguin parts (glacial): boxes only, r ≈ 0.6
      pengBody: new THREE.BoxGeometry(0.62, 0.9, 0.54),
      pengBelly: new THREE.BoxGeometry(0.44, 0.66, 0.1),
      pengHead: new THREE.BoxGeometry(0.46, 0.36, 0.42),
      pengWing: new THREE.BoxGeometry(0.1, 0.5, 0.3),
      pengBeak: new THREE.BoxGeometry(0.14, 0.1, 0.22),
      pengFoot: new THREE.BoxGeometry(0.2, 0.08, 0.3),
    },
    mat: {
      crate: new THREE.MeshStandardMaterial({ map: crateTexture(), roughness: 0.9 }),
      cone: new THREE.MeshStandardMaterial({ map: coneTexture(), roughness: 0.75 }),
      coneBase: new THREE.MeshStandardMaterial({ color: 0xd85f10, roughness: 0.9 }),
      barrelCap: new THREE.MeshStandardMaterial({ color: 0x3a2c1a, roughness: 0.95 }),
      snow: new THREE.MeshStandardMaterial({ color: 0xf4f8fc, roughness: 0.85 }),
      coal: new THREE.MeshStandardMaterial({ color: 0x201c18, roughness: 0.8 }),
      carrot: new THREE.MeshStandardMaterial({ color: 0xe8641e, roughness: 0.8 }),
      rock: new THREE.MeshStandardMaterial({ color: 0xb5744a, flatShading: true, roughness: 1 }),
      pengBlack: new THREE.MeshStandardMaterial({ color: 0x1c2026, roughness: 0.8 }),
      pengWhite: new THREE.MeshStandardMaterial({ color: 0xf4f8fc, roughness: 0.75 }),
      pengOrange: new THREE.MeshStandardMaterial({ color: 0xe8862e, roughness: 0.8 }),
    },
  };
  return PROP_ASSETS;
}

export class Track {
  constructor(scene, level = LEVELS[0]) {
    this.scene = scene;
    this.level = level;
    const T = THEMES[level && level.theme] || THEMES.forest;
    this.T = T;
    // plain-number lighting/fog summary for main.js
    this.theme = {
      fogColor: T.fogColor, fogNear: T.fogNear, fogFar: T.fogFar,
      hemiSky: T.hemiSky, hemiGround: T.hemiGround, hemiIntensity: T.hemiIntensity,
      sunColor: T.sunColor, sunIntensity: T.sunIntensity,
      // compass bearing / height of the sun this level DRAWS in its sky — the
      // directional key is aimed from the same bearing so shadows point the way
      // the visible sun says they should
      sunAz: T.sunAz, sunEl: T.sunEl,
      skyTop: T.skyTop, skyHorizon: T.skyHorizon,
      // [hexA, hexB] debris chip colors for fence/cliff scrape particles
      splinter: T.splinter,
      // ambient weather particle recipe for this level: { type, color, rate? }
      weather: T.weather,
      // surface condition tag: 'snow' | 'wet' | undefined (dry)
      surface: T.surface,
      // hazard-system spec contract (data only — runtime systems live in the
      // game code): each is undefined on levels without that hazard.
      geysers: T.geysers,        // { count }
      fallHazard: T.fallHazard,  // { kind: 'rock'|'burningTree'|'icicle', period, dmg }
      chase: T.chase,            // { kind: 'avalanche' }
      strips: T.strips,          // { kind: 'flume'|'maglev', count }
      critters: T.critters,      // { kind: 'scorpion'|'rat', count }
    };
    // levels are self-contained: fog is set here (main.js may re-apply from theme)
    scene.fog = new THREE.Fog(T.fogColor, T.fogNear, T.fogFar);

    // EVERYTHING the track builds goes in here, nothing straight into the
    // scene. That is what makes a level swappable without reloading the page:
    // one node to remove, one subtree to dispose. Adding to the scene direct
    // (52 call sites, once) left orphans behind on every rebuild.
    this.group = new THREE.Group();
    scene.add(this.group);

    const pts = CIRCUITS[level && level.theme] || CIRCUITS.forest;
    this.curve = new THREE.CatmullRomCurve3(
      pts.map(([x, z]) => new THREE.Vector3(x, 0, z)),
      true, 'centripetal'
    );
    this.N = N;
    this.center = [];
    this.tan = [];
    this.nrm = []; // "left" normal (up × tangent)
    for (let i = 0; i < N; i++) {
      const t = i / N;
      const p = this.curve.getPointAt(t);
      const tg = this.curve.getTangentAt(t); tg.y = 0; tg.normalize();
      this.center.push(p);
      this.tan.push(tg);
      this.nrm.push(new THREE.Vector3(tg.z, 0, -tg.x));
    }
    // Elevation profile: the road climbs and descends over the lap (tan/nrm and
    // curvature stay XZ-based — heading math is unaffected by the y channel).
    for (let i = 0; i < N; i++) this.center[i].y = this._elevProfile(i);
    this.length = this.curve.getLength();
    this.segLen = this.length / N;

    // grade (dY/ds along travel) per sample, for slope forces + mesh pitching
    this._slope = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      this._slope[i] =
        (this.center[(i + 2) % N].y - this.center[(i - 2 + N) % N].y) / (4 * this.segLen);
    }

    // curvature per sample (radians of heading change per world unit)
    this.curvature = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const a = this.tan[(i - 8 + N) % N];
      const b = this.tan[(i + 8) % N];
      this.curvature[i] = Math.acos(THREE.MathUtils.clamp(a.dot(b), -1, 1)) / (16 * this.segLen);
    }

    // ---- width-variation: per-sample drivable half-width (pinch sections) ----
    this._buildWidthProfile();

    // Natural jumps. Must happen HERE — before any mesh is built — so the road
    // ribbon, its skirts, the ruts, the terrain blend and every prop placement
    // follow the hump for free.
    this._buildCrests();

    this._checkLayout();

    // the hero gorge must exist before ANY height is sampled (terrain mesh,
    // road skirts and every scenery placement read it through _blendHeight)
    if (this.T.heroBridge) this._planGorge();

    this.animated = { flags: [], clouds: [] };
    // World-space circle colliders for on-road obstacles: [{x, z, r}].
    // Always present; [] on levels without obstacles. Consumed by car physics.
    this.obstacles = [];
    // World-space mud puddles on the road: [{x, z, r}]. Always present; [] on
    // levels without them. Visual decals here — driving effects live elsewhere.
    this.puddles = [];
    // ---- river-fords: shallow water bands crossing the road. [{i, x, z, y,
    // half}] where `half` is the half-width of the band in world units along
    // the track. Always present; [] on dry levels. Splash/wet-tire physics
    // lives in the vehicle code.
    this.fords = [];
    // ---- viz-zones: sectional visibility hazards [{i0, i1, len, mid, half,
    // kind, strength}]. Always present; [] on clear worlds. The game lead
    // reads this to pull scene fog in while the player is inside.
    this.vizZones = [];
    // Destructible roadside props: [{mesh, x, z, r, type, scoreValue, pickup}].
    // Always present. The game code detects car contact, removes the entry and
    // animates the mesh flying away itself; `pickup` is a type string on the
    // crates that carry a reward (else null).
    this.props = [];
    // Smashable trees: [{x, z, y, r, id, parts, kind, s, dead}] — every tree /
    // cactus / snag instance, so cars can fell them (mostly a free-roam thing).
    this.trees = [];
    // SOLID scenery circle colliders (Law of Solidity — no ghost scenery):
    // [{x, z, r, y}] for big boulders, huts, gantry legs, the grandstand
    // front and distant mesas. Car physics treats them like this.obstacles.
    this.solids = [];
    // Shootable buildings: [{x, z, y, r, w, h, hp, solid, parts, dead}]. Huts
    // and igloos are instanced, so `parts` names the mesh + slot to blank when
    // one is levelled, and `solid` is the collider to pull out of this.solids.
    this.buildings = [];
    // Smashable trackside tire stacks: [{x, z, y, r, ids, dead}] — one entry
    // per STACK; ids are the instance indices inside the tire InstancedMesh.
    this.tireStacks = [];
    // Soft bushes cars brush through: [{x, z, y, r, id, lastHit}].
    this.bushes = [];
    this.bushColor = this.T.bushColor;   // leaf-particle tint for the consumer
    // Knockable sponsor boards: [{x, z, y, r, dead, group, board, heading}].
    this.banners = [];
    // Open grazing ground for the animal system: [{x, z, r}] — flat, road-free
    // circles out in the country. Data only; behaviour lives in the game code.
    this.pastures = [];
    // decorative side-road junctions: [{index, side, angle, len}] — the
    // traffic system reads these; geometry is scenery only
    this.crossroads = [];
    // (fences were removed from the game entirely — the world is open and
    // off-road slowness is the boundary; see RULES.md)
    // Soft world radius for free-roam driving; the game turns players around
    // once they wander past it.
    this.worldBounds = 1400;
    // Baked contact-shadow specs {x, z, r, y} collected by every builder and
    // realized as ONE instanced decal mesh at the end of _buildEnvironment.
    this._shadows = [];
    this._buildRoad();
    // dirt shoulder aprons under the road edges: they bury themselves where
    // the ground meets the road, and skin the cut face where it falls away
    // (switchback faces, hill folds). Cliff-walled levels are skinned by the
    // cliff ribbons instead.
    if (!T.cliffWalls) this._buildRoadSkirts();
    this._buildWalls();
    this._buildStartGate();
    this._buildRamps();      // ramps claim the straightest sections…
    this._buildBoostPads();  // …then pads fill in around them
    this._buildObstacles();  // …then rock towers block straights between them
    this._buildPuddles();
    this._buildFords();      // ---- river-fords: streams wash over the road
    this._buildVizZones();   // ---- viz-zones: forest tunnels / fog banks / squalls
    this._buildNarrowDressing(); // ---- width-variation: pinch edge markers
    this._buildProps();      // …and smashable props fill the roadsides
    this._buildEnvironment();
  }

  /** Dev sanity check: warn if the centerline passes too close to itself
   *  (any two non-adjacent samples nearer than the full road ribbon width). */
  _checkLayout() {
    const minGap = (WALL_OFF + 0.6) * 2;
    let worst = Infinity, wi = -1, wj = -1;
    for (let i = 0; i < N; i += 2) {
      const jMax = Math.min(N - 1, i + N - 40);
      for (let j = i + 40; j <= jMax; j += 2) {
        const dx = this.center[i].x - this.center[j].x;
        const dz = this.center[i].z - this.center[j].z;
        const d2 = dx * dx + dz * dz;
        if (d2 < worst) { worst = d2; wi = i; wj = j; }
      }
    }
    const d = Math.sqrt(worst);
    if (d < minGap) {
      console.warn(
        `Track layout "${this.level && this.level.name}": centerline self-approach ` +
        `${d.toFixed(1)}u between samples ${wi} and ${wj} (< ${minGap.toFixed(1)}u road width)`
      );
    }
  }

  /** Road elevation at sample i: 2–3 smooth sine octaves over the lap, forced
   *  flat around the start line so the grid/gate/grandstand sit at y=0. All
   *  phases are fixed per theme — layouts stay deterministic across loads. */
  _elevProfile(i) {
    const E = this.T.elev || { amp: 0, ph: [0, 0, 0] };
    const flat = THREE.MathUtils.smoothstep(this._circDist(i, 0), 45, 130);
    if (E.profile === 'ascent') {
      // Hand-shaped mountain-pass profile: E.keys is a monotone-in-t list of
      // [lapFraction, roadY] pairs, smoothstepped between neighbours (the sine
      // octaves can't produce a sustained climb). The zigzag switchback layout
      // makes path length >> height gain, so road grades stay drivable.
      const f = i / N;
      const K = E.keys;
      let y = K[K.length - 1][1];
      for (let k = 0; k < K.length - 1; k++) {
        if (f <= K[k + 1][0]) {
          y = K[k][1] + (K[k + 1][1] - K[k][1])
            * THREE.MathUtils.smoothstep(f, K[k][0], K[k + 1][0]);
          break;
        }
      }
      return y * flat;
    }
    const t = (i / N) * Math.PI * 2;
    const raw =
      0.52 * Math.sin(2 * t + E.ph[0]) +      // period ~N/2
      0.34 * Math.sin(3.3 * t + E.ph[1]) +    // period ~N/3.3
      0.14 * Math.sin(7 * t + E.ph[2]);       // period ~N/7
    // dead-flat within ±45 samples of the start, easing up to full amplitude
    return E.amp * raw * flat;
  }

  /** Grade dY/ds (rise per unit of travel) at sample i. Positive = climbing. */
  slopeAt(i) {
    return this._slope[((i % N) + N) % N];
  }

  // ---- width-variation ----------------------------------------------------
  /** Drivable half-width at sample i. ROAD_HALF everywhere except inside a
   *  narrow section, where it smoothly pinches to ~55–65% and back. Physics
   *  callers use `t.widthAt?.(i) ?? ROAD_HALF` so either side of a merge
   *  degrades gracefully. */
  widthAt(i) {
    const w = this._width;
    return w ? w[((i % N) + N) % N] : ROAD_HALF;
  }

  /** True when sample i lies within `pad` samples of a narrow section
   *  (used by ramp/pad/obstacle/prop placement so nothing big lands in, or
   *  hangs off, a pinched stretch of road). */
  _nearNarrow(i, pad = 0) {
    return (this._narrowSecs ?? []).some((s) => this._circDist(i, s.mid) < s.half + pad);
  }

  /** Deterministic per-theme narrow sections: 2–4 stretches of 34–68 samples
   *  on straights/mild curves where the road pinches to `min`×ROAD_HALF with
   *  smooth cosine shoulders. Off for cliff-walled corridors (already tight). */
  _buildWidthProfile() {
    this._width = new Float32Array(N).fill(ROAD_HALF);
    this._narrowSecs = [];
    const T = this.T;
    const themeKey = (this.level && this.level.theme) || 'forest';
    const spec = T.narrows !== undefined
      ? T.narrows
      : T.cliffWalls ? false : (NARROW_TUNE[themeKey] ?? { count: 3, min: 0.6 });
    if (!spec || !(spec.count > 0)) return;
    // seeded LCG from the theme name — layouts stay deterministic across loads
    let seed = 2166136261 >>> 0;
    for (let k = 0; k < themeKey.length; k++) {
      seed = ((seed ^ themeKey.charCodeAt(k)) * 16777619) >>> 0;
    }
    const rnd = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    for (let tries = 0; tries < 500 && this._narrowSecs.length < spec.count; tries++) {
      const len = 34 + Math.floor(rnd() * 34);            // 34–68 samples
      const i0 = Math.floor(rnd() * N);
      // clear of the start/grid both ends
      if (this._circDist(i0, 0) < 90 || this._circDist((i0 + len) % N, 0) < 90) continue;
      // straights / mild curves only — never mid-hairpin
      let ok = true;
      for (let k = -8; ok && k <= len + 8; k++) {
        if (this.curvature[(i0 + k + N) % N] > 0.016) ok = false;
      }
      if (!ok) continue;
      const mid = (i0 + (len >> 1)) % N;
      const half = len / 2;
      if (this._narrowSecs.some((s) => this._circDist(mid, s.mid) < s.half + half + 110)) continue;
      // pinch floor ≈ 55–65% of ROAD_HALF (never below 5u half-width)
      const minW = Math.max(5, ROAD_HALF * (spec.min ?? 0.6) * (0.95 + rnd() * 0.12));
      this._narrowSecs.push({ i0, len, mid, half, minW });
      for (let k = 0; k <= len; k++) {
        // cosine shoulders over the outer 35% each side, flat floor between
        const edge = Math.min(k, len - k) / (len * 0.35);
        const f = THREE.MathUtils.smoothstep(Math.min(1, edge), 0, 1);
        const j = (i0 + k) % N;
        this._width[j] = Math.min(this._width[j], ROAD_HALF + (minW - ROAD_HALF) * f);
      }
    }
  }

  /** Pinch dressing: the squeeze must read as intentional — stone markers and
   *  a hazard-striped post pair at each pinch entry/exit, plus rocks tracing
   *  the narrowed edges. Markers are SOLID stone (Law of Solidity).
   *
   *  A pinch is a SQUEEZE, never a trap: every marker is pushed out far enough
   *  that its collision face clears the declared drivable width. The car body
   *  collides as a CAR_R-radius disc against `solids` (see vehicles.js), so a
   *  marker of radius r must sit at |lateral| ≥ widthAt + r + CAR_R for the
   *  full width to stay honestly free. Clip one and you were already off the
   *  road — running wide is punished, threading the gap is not. */
  _buildNarrowDressing() {
    if (!this._narrowSecs || !this._narrowSecs.length) return;
    const CAR_R = 1.8; // car collision radius used by the solids sweep
    const rockMat = new THREE.MeshStandardMaterial({
      color: this.T.rockColor ?? 0x8d8578, flatShading: true, roughness: 1,
    });
    const postMat = new THREE.MeshStandardMaterial({ map: hazardTexture(), roughness: 0.85 });
    const rockGeo = new THREE.DodecahedronGeometry(1, 0);
    const postGeo = new THREE.CylinderGeometry(0.16, 0.22, 2.2, 6);
    const hash = (n) => { const s = Math.sin(n) * 43758.5453; return s - Math.floor(s); };
    for (const sec of this._narrowSecs) {
      for (const side of [1, -1]) {
        // striped posts flag the entry and the exit of the squeeze
        for (const k of [2, sec.len - 2]) {
          const j = (sec.i0 + k) % N;
          const lat = (this.widthAt(j) + 0.45 + CAR_R + 0.2) * side;
          const p = this.pointAt(j, lat);
          const post = new THREE.Mesh(postGeo, postMat);
          post.position.set(p.x, p.y + 1.05, p.z);
          post.castShadow = true;
          this.group.add(post);
          this.solids.push({ x: p.x, z: p.z, r: 0.45, y: p.y, mat: 'metal' });
          this._addShadow(p.x, p.z, 0.8, p.y);
        }
        // low stone teeth trace the pinched edge so it reads as built, not broken
        for (let k = 6; k < sec.len - 4; k += 7) {
          const j = (sec.i0 + k) % N;
          const w = this.widthAt(j);
          if (w > ROAD_HALF - 0.8) continue;             // only along the squeeze
          const s = 0.55 + hash(j * 7.7 - side) * 0.5;
          const lat = (w + s * 0.95 + CAR_R + 0.2 + hash(j * 3.1 + side) * 0.7) * side;
          const p = this.pointAt(j, lat);
          // fine at this sample, inside the road two samples later where the
          // centreline swings under it — that is the rock you cannot see coming
          if (!this._clearsRoad(p.x, p.z, s * 0.95, 0.9)) continue;
          const rock = new THREE.Mesh(rockGeo, rockMat);
          rock.scale.set(s, s * 0.75, s * 0.9);
          rock.rotation.y = hash(j * 1.3) * Math.PI * 2;
          rock.position.set(p.x, p.y + s * 0.3, p.z);
          rock.castShadow = true;
          this.group.add(rock);
          this.solids.push({ x: p.x, z: p.z, r: s * 0.95, y: p.y, mat: 'stone' });
          this._addShadow(p.x, p.z, s * 1.3, p.y);
        }
      }
    }
  }
  // ---- end width-variation -------------------------------------------------

  // ---------- queries ----------
  nearestIndex(pos, hint = null) {
    // XZ distance only — the elevated centerline must not bias index tracking
    const d2 = (i) => {
      const dx = pos.x - this.center[i].x, dz = pos.z - this.center[i].z;
      return dx * dx + dz * dz;
    };
    let best = -1, bd = Infinity;
    if (hint === null) {
      for (let i = 0; i < N; i += 4) {
        const d = d2(i);
        if (d < bd) { bd = d; best = i; }
      }
      hint = best; bd = Infinity;
    }
    for (let k = -30; k <= 30; k++) {
      const i = (hint + k + N) % N;
      const d = d2(i);
      if (d < bd) { bd = d; best = i; }
    }
    return best;
  }

  lateralOffset(pos, i) {
    const dx = pos.x - this.center[i].x, dz = pos.z - this.center[i].z;
    return dx * this.nrm[i].x + dz * this.nrm[i].z;
  }

  pointAt(i, lateral) {
    // road surface is flat across its width — y comes straight from the profile
    return new THREE.Vector3(
      this.center[i].x + this.nrm[i].x * lateral,
      this.center[i].y,
      this.center[i].z + this.nrm[i].z * lateral
    );
  }

  headingAt(i) { return Math.atan2(this.tan[i].x, this.tan[i].z); }

  gridSlot(slot) {
    const row = Math.floor(slot / 2);
    const i = (N - 10 - row * 8 + N) % N;
    const lateral = (slot % 2 === 0 ? -1 : 1) * 3.6;
    return { index: i, lateral };
  }

  /** Road surface height at a track position: the elevation profile, plus the
   *  ramp wedge height when inside a ramp zone (ramps ADD to road height). */
  groundHeightAt(i, lateral) {
    const roadY = this.center[i].y;
    for (const r of this.ramps) {
      const di = (i - r.index + N) % N;
      if (di < r.len && Math.abs(lateral - r.lateral) < r.halfW) {
        return roadY + r.height * (di / r.len);
      }
    }
    return roadY;
  }

  /** Distance from (x,z) to the nearest centerline sample (coarse), plus that
   *  sample's road elevation. Returns [dist, roadY]. */
  _nearRoad(x, z) {
    let best = Infinity, bi = 0;
    for (let i = 0; i < N; i += 5) {
      const dx = x - this.center[i].x, dz = z - this.center[i].z;
      const d = dx * dx + dz * dz;
      if (d < best) { best = d; bi = i; }
    }
    return [Math.sqrt(best), this.center[bi].y];
  }

  /** Distance from (x,z) to the nearest centerline sample (coarse). */
  _distToTrack(x, z) {
    return this._nearRoad(x, z)[0];
  }

  /** Track distance + nearest-sample road y on a lazy 8-unit grid, bilinearly
   *  blended between the four surrounding corners. Each corner runs _nearRoad
   *  once, then is memoized, so warm calls are a handful of ops — cheap enough
   *  for per-frame use. Writes {d, y} into this._fieldTmp and returns it. */
  _roadFieldCoarse(x, z) {
    const out = this._fieldTmp || (this._fieldTmp = { d: 0, y: 0 });
    const CS = 8, HALF = 2048, CELLS = (HALF * 2) / CS;
    const gx = (x + HALF) / CS, gz = (z + HALF) / CS;
    const x0 = Math.floor(gx), z0 = Math.floor(gz);
    if (x0 < 0 || z0 < 0 || x0 >= CELLS || z0 >= CELLS) {
      const v = this._nearRoad(x, z);
      out.d = v[0]; out.y = v[1];
      return out;
    }
    const cache = this._distCache || (this._distCache = new Map());
    const corner = (cx, cz) => {
      const key = cx * 1024 + cz;
      let v = cache.get(key);
      if (v === undefined) {
        v = this._nearRoad(cx * CS - HALF, cz * CS - HALF);
        cache.set(key, v);
      }
      return v;
    };
    const fx = gx - x0, fz = gz - z0;
    const c00 = corner(x0, z0), c10 = corner(x0 + 1, z0);
    const c01 = corner(x0, z0 + 1), c11 = corner(x0 + 1, z0 + 1);
    const a = c00[0] * (1 - fx) + c10[0] * fx;
    const b = c01[0] * (1 - fx) + c11[0] * fx;
    out.d = a * (1 - fz) + b * fz;
    const ya = c00[1] * (1 - fx) + c10[1] * fx;
    const yb = c01[1] * (1 - fx) + c11[1] * fx;
    out.y = ya * (1 - fz) + yb * fz;
    return out;
  }

  _distToTrackCoarse(x, z) {
    return this._roadFieldCoarse(x, z).d;
  }

  /** Open-country rolling hills (no road influence). `hillDrop` sinks the whole
   *  open field below the road datum — FURKA RIDGE uses it so the ridge road
   *  stands well proud of everything around it. */
  _hillNoise(x, z) {
    // Fourth octave (λ ≈ 55 u, ≈ 5 terrain cells) exists purely so the FACETS
    // read: with only the three long octaves every 10 u quad was very nearly
    // coplanar with its neighbours, so flat shading had no tone to give and the
    // open field rendered as one smooth green sheet. Max grade added is
    // 1.4 × 0.114 ≈ 9°, well inside what the car drives over in free roam, and
    // the SAME function feeds prop placement (terrainHeight) and the mesh, so
    // nothing floats. `relief` lets a theme dial it out (neon grid, salt flats).
    const rel = this.T.relief !== undefined ? this.T.relief : 1;
    return (
      Math.sin(x * 0.012) * Math.cos(z * 0.010) * 3.4 +
      Math.sin(x * 0.030 + 1.7) * Math.cos(z * 0.026 + 0.6) * 1.7 +
      Math.sin(x * 0.070 + 3.1) * Math.cos(z * 0.062 + 2.2) * 0.7 +
      Math.sin(x * 0.114 + 5.3) * Math.cos(z * 0.101 + 1.4) * 2.2 * rel
      - (this.T.hillDrop || 0)
      + this._highland(x, z)
    );
  }

  /** THE MOUNTAINS YOU CAN ACTUALLY DRIVE UP.
   *
   *  The drivable world used to span barely nine units of height, top to
   *  bottom: a pancake with painted cones sitting on the horizon behind it.
   *  Head for the hills in free roam and you never arrived — the "mountains"
   *  were scenery at r ≈ 800 with no collision and no slope to climb.
   *
   *  This raises the real ground into a massif that rings the world. No track
   *  reaches past r = 320 in any of the 21 worlds (measured), so starting the
   *  climb at 400 leaves every racing line untouched, and _blendHeight has
   *  already finished its corridor blend by 70 u out.
   *
   *  GRADE IS THE WHOLE POINT: a mountain you cannot climb is the bug being
   *  fixed. The radial ramp contributes ~10% and the ridge octaves ~5% on top,
   *  so the steepest ground is around 15% — a real climb that a car pulls up
   *  with speed in hand, rather than a wall. */
  _highland(x, z) {
    const scale = this.T.highland !== undefined ? this.T.highland
      : (this.T.relief === 0 ? 0 : 1);       // flat-by-design worlds opt out
    if (!scale) return 0;
    const t = smoothstep01((Math.hypot(x, z) - 400) / 1050);
    if (t <= 0) return 0;
    // ridged octaves so the massif has spurs, saddles and side valleys to pick
    // a line through instead of being one smooth cone
    const ridge =
      Math.sin(x * 0.0042 + 0.9) * Math.cos(z * 0.0039 - 0.4) * 0.55 +
      Math.sin(x * 0.0091 - 2.1) * Math.cos(z * 0.0084 + 1.3) * 0.30 +
      Math.sin(x * 0.0180 + 4.2) * Math.cos(z * 0.0165 + 2.7) * 0.15;
    const massif = t * 68 * (0.72 + 0.28 * ridge) * this._riverValley(x, z);
    return scale * (massif + this._rimWall(x, z));
  }

  /** THE BORDER. Beyond the climbable massif the ground turns up into a wall
   *  that rings the world — a headwall no car gets over, so the scenery reads
   *  as a closed bowl end to end instead of trailing off into nothing.
   *
   *  This is deliberately NOT an invisible barrier. It is the same terrain the
   *  car already drives on, just steeper than traction allows: the ramp gains
   *  260 u over 260 u of run, which is a ~100% grade at the steepest point
   *  against the ~20% the massif tops out at. You drive up, slow, and slide
   *  back — the world stops you with a mountain, not with a wall you cannot
   *  see. The river valley cuts it too, so the water still has a way out.
   *
   *  RIM_R sits past the far terrain patch's useful radius, well beyond the
   *  fog, so from the road it is a skyline rather than a fence. */
  _rimWall(x, z) {
    const RIM_R = RIM_RADIUS, RIM_RUN = 260, RIM_H = 260;
    const r = Math.hypot(x, z);
    if (r <= RIM_R) return 0;
    // ease in so the foot of the wall meets the massif smoothly, then climb
    const u = Math.min(1, (r - RIM_R) / RIM_RUN);
    const crest = 0.55 + 0.45 * Math.sin(Math.atan2(z, x) * 3.7 + 1.1);  // uneven skyline
    return RIM_H * u * u * (0.75 + 0.25 * crest) * this._riverValley(x, z);
  }

  /** 0 in the river's valley floor, easing to 1 well clear of it. The river
   *  runs out to r ≈ 1100, straight through where the massif now stands, and
   *  water does not climb a mountain — so the mountain opens a valley for it
   *  to leave through. _riverDist only reaches one 42 u cell, far too short
   *  for a valley this wide, so this walks a downsampled centreline. */
  _riverValley(x, z) {
    const R = this._river;
    if (!R) return 1;
    let best = Infinity;
    const line = R.coarse ?? R.line;
    for (const p of line) {
      const d = (p.x - x) * (p.x - x) + (p.z - z) * (p.z - z);
      if (d < best) best = d;
    }
    // The valley DEEPENS the ground around the river, it does not delete the
    // massif — cutting the full 68 u either flattened the range wherever the
    // river wandered, or (taper it sharply to avoid that) turned the valley
    // sides into the very wall this whole change exists to remove. Taking 45%
    // over a 240 u run leaves the river in a proper gorge with ~23% sides.
    return 0.55 + 0.45 * smoothstep01((Math.sqrt(best) - 60) / 240);
  }

  /** Terrain cap from OTHER road strands passing near (x,z): the lowest road y
   *  among samples 11–25.2u away in XZ that fold back much closer than their path
   *  distance from the nearest sample (hairpins, S-folds, stacked legs). Where two strands at
   *  different heights run close (frost S-folds, the alpine switchback stack),
   *  ground near the lower ribbon must never rise above it — un-capped blends
   *  poke sawtooth wedges up through the road. Infinity when no strand near. */
  _roadClampY(x, z) {
    let best = Infinity, bi = 0;
    for (let i = 0; i < N; i += 4) {
      const dx = x - this.center[i].x, dz = z - this.center[i].z;
      const d = dx * dx + dz * dz;
      if (d < best) { best = d; bi = i; }
    }
    if (best > 25.2 * 25.2) return Infinity;   // no strand in capping range
    let clamp = Infinity;
    for (let i = 0; i < N; i += 4) {
      const di = Math.abs(i - bi);
      const gap = Math.min(di, N - di);
      if (gap <= 12) continue;                              // own path neighbours
      const dx = x - this.center[i].x, dz = z - this.center[i].z;
      const d2 = dx * dx + dz * dz;
      if (d2 < 11 * 11 || d2 > 25.2 * 25.2 || this.center[i].y >= clamp) continue;
      // an ordinary along-road sample sits nearly its path-distance away in
      // XZ; only genuine fold-backs (hairpins, S-folds, stacked legs) come
      // much closer than their path distance — those are what get capped
      if (Math.sqrt(d2) > 0.72 * gap * this.segLen) continue;
      clamp = this.center[i].y;
    }
    return clamp;
  }

  /** Shared road→hills height blend. `tuck` eases the corridor slightly UNDER
   *  the ribbon (full 0.45 by d=14, zero at the drivable edge) so residual
   *  mesh interpolation error stays hidden below the road surface. */
  _blendHeight(d, roadY, x, z) {
    const B = this.T.blend;
    const near = B ? B.near : 15, far = B ? B.far : 70;
    // Pass worlds stack road strands 26-30u apart at different heights, so the
    // nearest-sample blend can hand a point under one leg the height of the
    // NEXT leg up and poke a lip through the ribbon. An extra tuck under the
    // whole corridor (hidden by the skirt) keeps the ground below the road.
    // THE ROAD IS THE FLOOR. This used to ramp the tuck IN from d = 10.8, which
    // is the drivable edge — meaning under the carriageway itself the tuck was
    // zero and the terrain mesh sat exactly coplanar with the road ribbon.
    // Coplanar surfaces z-fight, and the ground samples every 10 u while the
    // road is smooth, so wherever interpolation put a terrain triangle a hair
    // high it painted straight over the road. That is the road vanishing under
    // the hillside. The tuck is now DEEPEST under the road and eases out to
    // nothing at the far edge of the blend, so the ribbon always has clear air
    // beneath it and there is nothing to fight with.
    const tuck = 0.55 * (1 - THREE.MathUtils.smoothstep(d, 12, 30))
      + (this.T.retainingWalls || this.T.shelfRoad
        ? 0.75 * THREE.MathUtils.smoothstep(d, 2, 11) : 0);
    let h;
    if (d <= near) h = roadY - tuck;
    else {
      const n = this._hillNoise(x, z);
      if (d >= far) h = n;
      else {
        const f = THREE.MathUtils.smoothstep(d, near, far);
        h = (roadY - tuck) * (1 - f) + n * f;
      }
    }
    // the hero gorge is carved out of whatever the ground would otherwise be,
    // road corridor included — that is the hole the suspension bridge spans
    if (this._gorge) h -= this._gorgeCut(x, z);
    // the river runs in a real bed, not on top of the field — but the channel
    // is flattened out again as it nears the road so the FORD stays a shallow
    // wash across the carriageway instead of a trench (and so the road skirts,
    // which were built before the river was planned, still meet the ground)
    if (this._river && this._river.bed) {
      // Blend the ground toward the smoothed bed profile rather than denting
      // whatever noise happened to be here — see _planRiver. The ford still
      // flattens out (the fade on `d`) so the crossing stays a shallow wash on
      // the carriageway instead of a trench across the racing line.
      const R = this._river;
      const outer = R.half + R.bank;
      const { d: rd, k } = this._riverNearest(x, z);
      if (rd < outer) {
        const bedY = R.bed[k]
          - R.depth * Math.pow(Math.cos((rd / outer) * Math.PI * 0.5), 1.4);
        const w = smoothstep01(1 - rd / outer) * THREE.MathUtils.smoothstep(d, 9, 22);
        h = h * (1 - w) + bedY * w;
      }
    }
    return h;
  }

  // ---- continuous river ------------------------------------------------------
  /** Plan ONE waterway that spans the whole world and threads every ford.
   *
   *  What shipped before was a 130 u meander built independently at each ford,
   *  so from above you saw two disconnected flat quads with hard straight ends
   *  whose banks did not even line up across the road. This builds a single
   *  centripetal spline: it enters at one world edge, passes through each ford
   *  crossing perpendicular to the road at that point, and leaves at the far
   *  edge. Everything downstream (bed carve, water ribbon, banks, reeds, ford
   *  wash) reads this one curve, so the crossing cannot mismatch.
   *
   *  `chosen` = the ford samples picked by _buildFords, ascending by index. */
  _planRiver(chosen) {
    if (!chosen.length) return;
    const pts = [];
    const lead = 34;                       // straight run either side of a ford
    const order = chosen.slice().sort((a, b) => a.i - b.i);
    const P = (x, z, lock) => { const v = new THREE.Vector3(x, 0, z); v.lock = !!lock; return v; };
    // The circuit is a CLOSED loop, so `nrm` points to the same hand all the
    // way round. Entering every ford from the same side would force the reach
    // between two crossings back over the carriageway — which is exactly the
    // stray second water band the first build produced. Alternate instead: come
    // out of ford k on one side, and enter ford k+1 from that same side.
    let enter = -1;
    for (let k = 0; k < order.length; k++) {
      const fd = order[k];
      const c = this.center[fd.i], n = this.nrm[fd.i];
      const exit = -enter;
      // the crossing itself: dead straight and square to the road, and LOCKED
      // (the road-avoidance pass below must never move a crossing point)
      pts.push(P(c.x + n.x * lead * enter, c.z + n.z * lead * enter, true));
      pts.push(P(c.x, c.z, true));
      pts.push(P(c.x + n.x * lead * exit, c.z + n.z * lead * exit, true));
      // Reach to the next crossing. A straight line between two fords cuts
      // straight back over the carriageway wherever the circuit bends between
      // them (the track is a loop, so "the far side of ford k" and "the near
      // side of ford k+1" are only connected without crossing if you go the way
      // the ROAD goes). So the reach is generated FROM THE CENTERLINE, held out
      // at a wandering 48-78 u offset on the side the river is currently on —
      // it parallels the circuit and can never re-cross it.
      if (k + 1 < order.length) {
        const from = fd.i, to = order[k + 1].i;
        const span = ((to - from) + N) % N;
        const steps = Math.max(3, Math.round(span / 14));
        for (let s = 1; s < steps; s++) {
          const t = s / steps;
          const gi = (from + Math.round(span * t)) % N;
          const off = 62 + Math.sin(t * Math.PI * 2.4 + fd.i * 0.31) * 16;
          const q = this.pointAt(gi, exit * off);
          pts.push(P(q.x, q.z));
        }
      }
      enter = exit;
    }
    // Run both ends out past the visible world so the river never "starts".
    // Seven fixed 150 u steps did not do that: the tails follow the local
    // tangent rather than heading straight out, so they were petering out
    // around r ≈ 1100 — inside the far terrain (r 2100) and inside the fog,
    // which is a river that stops in the middle of a field. Keep stepping
    // until the tail is genuinely past the world edge.
    const OUT_R = 2600;                    // clear of the far terrain and the fog
    const extend = (from, to, sign) => {
      let dx = to.x - from.x, dz = to.z - from.z;
      const l = Math.hypot(dx, dz) || 1;
      dx /= l; dz /= l;
      for (let k = 1; k <= 30; k++) {
        const step = 150 * k;
        const sway = Math.sin(k * 0.75 + (sign > 0 ? 1.3 : 4.1)) * 40;
        const nx = to.x + dx * step - dz * sway;
        const nz = to.z + dz * step + dx * sway;
        pts[sign > 0 ? 'push' : 'unshift'](P(nx, nz));
        if (Math.hypot(nx, nz) > OUT_R) break;
      }
    };
    extend(pts[1], pts[0], -1);
    extend(pts[pts.length - 2], pts[pts.length - 1], 1);
    // ROAD AVOIDANCE. Between the locked crossings the spline is free to wander,
    // and left alone it happily loops back over the carriageway — which is what
    // put a second, ford-less water band across the road in the first build.
    // Any unlocked control point that strays inside the corridor is pushed back
    // out along the road normal at its nearest sample.
    const KEEP = 46;
    const tmpv = new THREE.Vector3();
    for (const p of pts) {
      if (p.lock) continue;
      for (let pass = 0; pass < 5; pass++) {
        const i = this.nearestIndex(tmpv.set(p.x, 0, p.z), null);
        const c = this.center[i];
        const d = Math.hypot(p.x - c.x, p.z - c.z);
        if (d >= KEEP) break;
        const n = this.nrm[i];
        const sgn = (p.x - c.x) * n.x + (p.z - c.z) * n.z >= 0 ? 1 : -1;
        p.x = c.x + n.x * KEEP * sgn;
        p.z = c.z + n.z * KEEP * sgn;
      }
    }

    const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
    const half = 4.0, bank = 6.0;
    // dense polyline for distance queries + a uniform hash grid over it
    const SAMP = Math.max(64, Math.ceil(curve.getLength() / 11));
    const line = [];
    for (let s = 0; s <= SAMP; s++) line.push(curve.getPointAt(s / SAMP));
    const CELL = 42;                        // > half + bank, so a 3×3 lookup is exact
    const grid = new Map();
    for (let k = 0; k < line.length; k++) {
      const key = `${Math.floor(line[k].x / CELL)},${Math.floor(line[k].z / CELL)}`;
      let a = grid.get(key);
      if (!a) grid.set(key, a = []);
      a.push(k);
    }
    // depth 1.5 barely dented the ground; the banks need to actually rise
    // around the water for it to read as a river rather than blue paint
    // every 6th sample is plenty to measure a 250 u-wide valley against, and
    // _riverValley scans this list once per terrain vertex — keep it short
    const coarse = line.filter((_, i) => i % 6 === 0);
    this._river = { curve, line, coarse, grid, CELL, half, bank, depth: 2.6, bed: null, fords: order };

    // THE BED. Carving used to mean "subtract a bump from whatever the ground
    // was doing", which is not a riverbed: the hill octaves vary by about as
    // much across ten units as the whole channel was deep, so ridges pushed up
    // through a level water surface and broke the reach into disconnected blue
    // shards. So sample the ground the river crosses, smooth it along the
    // flow, and force it to fall — water does not run uphill — then blend the
    // terrain TOWARD that profile inside the channel instead of denting it.
    // _blendHeight skips the channel entirely while `bed` is null, so these
    // samples see the pre-river ground and this cannot feed on itself.
    const raw = line.map((p) => this.terrainHeight(p.x, p.z));
    const SM = 10;                                    // smoothing half-window
    const smooth = raw.map((_, k) => {
      let s = 0, n = 0;
      for (let j = -SM; j <= SM; j++) {
        const i = k + j;
        if (i >= 0 && i < raw.length) { s += raw[i]; n++; }
      }
      return s / n;
    });
    // walk downhill from whichever end is higher so the profile never climbs
    const flowsForward = smooth[0] >= smooth[smooth.length - 1];
    const bed = smooth.slice();
    if (flowsForward) {
      for (let k = 1; k < bed.length; k++) bed[k] = Math.min(bed[k], bed[k - 1]);
    } else {
      for (let k = bed.length - 2; k >= 0; k--) bed[k] = Math.min(bed[k], bed[k + 1]);
    }
    this._river.bed = bed;
  }

  /** Nearest centreline sample to (x, z): {d, k}. d is Infinity past the bed. */
  _riverNearest(x, z) {
    const R = this._river;
    const cx = Math.floor(x / R.CELL), cz = Math.floor(z / R.CELL);
    let best = Infinity, bk = -1;
    for (let a = -1; a <= 1; a++) {
      for (let b = -1; b <= 1; b++) {
        const arr = R.grid.get(`${cx + a},${cz + b}`);
        if (!arr) continue;
        for (const k of arr) {
          const p = R.line[k];
          const d = (p.x - x) * (p.x - x) + (p.z - z) * (p.z - z);
          if (d < best) { best = d; bk = k; }
        }
      }
    }
    return { d: best === Infinity ? Infinity : Math.sqrt(best), k: bk };
  }

  /** Distance from (x, z) to the river centreline, or Infinity past the bed. */
  _riverDist(x, z) {
    const R = this._river;
    const cx = Math.floor(x / R.CELL), cz = Math.floor(z / R.CELL);
    let best = Infinity;
    for (let a = -1; a <= 1; a++) {
      for (let b = -1; b <= 1; b++) {
        const arr = R.grid.get(`${cx + a},${cz + b}`);
        if (!arr) continue;
        for (const k of arr) {
          const p = R.line[k];
          const d = (p.x - x) * (p.x - x) + (p.z - z) * (p.z - z);
          if (d < best) best = d;
        }
      }
    }
    return best === Infinity ? Infinity : Math.sqrt(best);
  }

  // ---- end continuous river --------------------------------------------------

  /** Depth of the river gorge at (x, z): 0 everywhere outside it, easing to
   *  the full depth along the channel. Applied inside _blendHeight so the
   *  scenery field, the terrain mesh and the free-roam ground all agree. */
  _gorgeCut(x, z) {
    const G = this._gorge;
    const dx = x - G.x, dz = z - G.z;
    const u = dx * G.ax + dz * G.az;          // along the gorge
    const v = dx * G.vx + dz * G.vz;          // across it (= along the road)
    const au = Math.abs(u), av = Math.abs(v);
    if (au > G.len || av >= G.half) return 0;
    const along = 1 - THREE.MathUtils.smoothstep(au, G.len * 0.55, G.len);
    // U-shaped channel: full depth down the middle, rims easing back to grade
    const prof = Math.pow(Math.cos((av / G.half) * Math.PI * 0.5), 1.5);
    return G.depth * prof * along;
  }

  /** True when sample i lies within `pad` samples of the bridge span (so
   *  ramps, pads, obstacles, puddles and props keep off the crossing). */
  _nearGorge(i, pad) {
    return !!this._gorge && this._circDist(i, this._gorge.i) < pad;
  }

  /** Pick where the gorge crosses the road. Runs BEFORE any geometry is built
   *  (the terrain, the skirts and the scenery all read _gorgeCut). */
  _planGorge() {
    const H = this.T.heroBridge;
    const [f0, f1] = H.at;
    let best = -1, bc = Infinity;
    for (let i = (f0 * N) | 0; i < (f1 * N) | 0; i += 2) {
      if (this._circDist(i, 0) < 70) continue;
      let mc = 0;
      for (let k = -14; k <= 14; k++) mc = Math.max(mc, this.curvature[(i + k + N) % N]);
      if (mc < bc) { bc = mc; best = i; }
    }
    if (best < 0) return;
    const c = this.center[best], t = this.tan[best], n = this.nrm[best];
    // the gorge crosses the road at a slant, not square on: from the deck the
    // chasm and its river then run away diagonally into the distance instead
    // of hiding directly beneath you
    const th = H.skew !== undefined ? H.skew : 0.72;
    const cs = Math.cos(th), sn = Math.sin(th);
    const ax = n.x * cs + t.x * sn, az = n.z * cs + t.z * sn;   // along the gorge
    const vx = -n.x * sn + t.x * cs, vz = -n.z * sn + t.z * cs; // across it
    this._gorge = {
      i: best, x: c.x, z: c.z,
      ax, az, vx, vz,
      half: H.half, len: H.len, depth: H.depth,
      // how far along the ROAD the channel reaches, given the slant
      spanU: H.half / Math.max(0.35, Math.abs(t.x * vx + t.z * vz)),
      floorY: c.y - H.depth,
    };
  }

  /** Rolling-hill height used by scenery placement and the free-roam mode's
   *  per-frame ground queries (track distance is cached). Near the road it
   *  blends to the ROAD's elevation at the nearest centerline sample, so the
   *  meadow rises to meet the climbing road; the strand cap (_roadClampY)
   *  keeps it under any OTHER ribbon passing close by. */
  terrainHeight(x, z) {
    const fld = this._roadFieldCoarse(x, z);
    let h = this._blendHeight(fld.d, fld.y, x, z);
    if (fld.d <= 27) {
      const clamp = this._roadClampY(x, z);
      if (clamp < Infinity) h = Math.min(h, clamp - 0.45);
    }
    return this._roadFloor(x, z, h, fld.d);
  }

  /** THE ROAD IS THE FLOOR — the hard guarantee, applied last.
   *
   *  Everything above works off a COARSE road field, which bilinearly mixes
   *  the heights of whatever strands are nearby. Where two legs of a pass run
   *  close at different elevations that mix is not either of them, so the
   *  ground beside the lower leg could still come out above its surface —
   *  measured up to 1.9 u proud at the road edge on Gotthard, which is the
   *  carriageway disappearing into the hillside.
   *
   *  So after all the blending, take the height of the ACTUAL nearest road
   *  sample and refuse to let the ground near it exceed that. Cheap because it
   *  only runs near the road, and exact because it scans the centreline rather
   *  than a smoothed field. Eased out over the verge so the shoulder still
   *  rises naturally away from the carriageway instead of ending in a step. */
  _roadFloor(x, z, h, coarseD) {
    if (coarseD > 34) return h;                 // nowhere near the road
    let best = Infinity, bi = 0;
    for (let i = 0; i < N; i += 4) {
      const dx = x - this.center[i].x, dz = z - this.center[i].z;
      const d2 = dx * dx + dz * dz;
      if (d2 < best) { best = d2; bi = i; }
    }
    for (let k = -4; k <= 4; k++) {             // refine around the coarse pick
      const i = (bi + k + N) % N;
      const dx = x - this.center[i].x, dz = z - this.center[i].z;
      const d2 = dx * dx + dz * dz;
      if (d2 < best) { best = d2; bi = i; }
    }
    const d = Math.sqrt(best);
    return Math.min(h, this._roadCeil(bi, d));
  }

  /** The highest the ground may be at distance `d` from road sample `bi`.
   *
   *  This started as a smoothstep that relaxed the clamp over 15 u, and that
   *  is the wrong shape for the job. The RIBBON is drawn wider than the
   *  drivable width (widthAt + WALL_OFF + 0.6 - ROAD_HALF, a fringe of about
   *  2 u), and the terrain mesh only samples every 10 u. So a vertex just
   *  inside the fringe was clamped hard while its neighbour a cell further out
   *  was barely clamped at all, and the triangle BETWEEN them crossed back up
   *  over the ribbon's outer edge — the jagged wedges of grass eating into the
   *  carriageway. In a cutting, where the ground climbs fast, that is most of
   *  the road edge.
   *
   *  A cone fixes it by construction: full clearance right across the visible
   *  ribbon, then a straight ramp away at a bounded gradient. Because the
   *  ceiling is linear in `d`, interpolating between two vertices that both
   *  satisfy it cannot produce a point that violates it — which is exactly the
   *  guarantee the smoothstep could not give. 0.5 still lets a hillside climb
   *  10 u within 20 u of the verge, so cuttings still read as cuttings. */
  _roadCeil(bi, d) {
    const drivable = this.widthAt ? this.widthAt(bi) : ROAD_HALF;
    // the ribbon as DRAWN, not as driven — the fringe is part of the road
    const ribbon = drivable + (WALL_OFF + 0.6 - ROAD_HALF);
    const edge = ribbon + 1.5;
    return this.center[bi].y - 0.35 + Math.max(0, d - edge) * 0.5;
  }

  /** Terrain-MESH vertex height: same blend as terrainHeight but with an
   *  EXACT full-resolution nearest scan (build-time only) — the coarse
   *  bilinear field mixes y values of different strands where two road
   *  strands at different elevations pass near each other, which is what
   *  tore the terrain into sawtooth wedges through the ribbon. */
  _terrainMeshHeight(x, z) {
    let best = Infinity, bi = 0;
    for (let i = 0; i < N; i += 3) {
      const dx = x - this.center[i].x, dz = z - this.center[i].z;
      const d = dx * dx + dz * dz;
      if (d < best) { best = d; bi = i; }
    }
    for (let k = -2; k <= 2; k++) {
      const i = (bi + k + N) % N;
      const dx = x - this.center[i].x, dz = z - this.center[i].z;
      const d = dx * dx + dz * dz;
      if (d < best) { best = d; bi = i; }
    }
    const d = Math.sqrt(best);
    let h = this._blendHeight(d, this.center[bi].y, x, z);
    if (d <= 27) {
      // exact strand cap (window/exclusion mirror _roadClampY)
      let clamp = Infinity;
      for (let i = 0; i < N; i += 2) {
        const di = Math.abs(i - bi);
        const gap = Math.min(di, N - di);
        if (gap <= 12) continue;
        const dx = x - this.center[i].x, dz = z - this.center[i].z;
        const d2 = dx * dx + dz * dz;
        if (d2 < 11 * 11 || d2 > 25.2 * 25.2 || this.center[i].y >= clamp) continue;
        if (Math.sqrt(d2) > 0.72 * gap * this.segLen) continue;
        clamp = this.center[i].y;
      }
      if (clamp < Infinity) h = Math.min(h, clamp - 0.45);
    }
    // and the same hard ceiling the physics height uses — this is the function
    // that actually feeds the rendered vertices, so without it the ground can
    // still be DRAWN through the carriageway even when the car drives level
    h = Math.min(h, this._roadCeil(bi, d));
    return h;
  }

  // ---------- track construction ----------
  _buildRoad() {
    const geo = new THREE.BufferGeometry();
    const verts = new Float32Array((N + 1) * 2 * 3);
    const uvs = new Float32Array((N + 1) * 2 * 2);
    const idx = [];
    for (let i = 0; i <= N; i++) {
      const j = i % N;
      const c = this.center[j], n = this.nrm[j];
      // ---- width-variation: the ribbon follows the drivable width profile
      // (fringe margin beyond ROAD_HALF is preserved, so edges converge) ----
      const w = this.widthAt(j) + (WALL_OFF + 0.6 - ROAD_HALF);
      const o = i * 6;
      // under a hero bridge the ribbon drops away so the plank deck laid on
      // top of it is never coplanar (coplanar strips z-fight into dark bands
      // at grazing angles). Physics still reads center[j].y — the DECK is the
      // surface the car drives on there.
      const y = c.y - this._deckDip(j);
      verts[o] = c.x + n.x * w; verts[o + 1] = y; verts[o + 2] = c.z + n.z * w;
      verts[o + 3] = c.x - n.x * w; verts[o + 4] = y; verts[o + 5] = c.z - n.z * w;
      const v = (i * this.segLen) / 10;
      uvs[i * 4] = 0; uvs[i * 4 + 1] = v;
      uvs[i * 4 + 2] = 1; uvs[i * 4 + 3] = v;
    }
    for (let i = 0; i < N; i++) {
      const a = i * 2, b = i * 2 + 1, c = i * 2 + 2, d = i * 2 + 3;
      idx.push(a, b, c, b, d, c);
    }
    geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    const tex = roadTexture(this.T.road);
    tex.anisotropy = 8;
    // surface condition drives the material response: wet roads go glossy and
    // catch the scene environment (main.js supplies a PMREM env), snow stays
    // soft with a faint icy sheen, dry dirt is fully rough as before.
    // envMapIntensity is a standard-material property, safe before env exists.
    const surf = this.T.surface;
    // Roughness pulled UP and env pulled DOWN from 0.30/1.3 and 0.55/0.6: with
    // the key light now ~35 % stronger and raked lower, a 0.30-rough road threw
    // a broad white specular smear straight down the carriageway that the bloom
    // pass then blew out — the same failure mode as the sun billboard. Wet road
    // still reads wet (sheen + the roadTexture's own gleam), it just no longer
    // mirrors the sun into the player's eyes.
    const mat = new THREE.MeshStandardMaterial({
      map: tex, metalness: 0,
      roughness: surf === 'wet' ? 0.52 : surf === 'snow' ? 0.7 : 1,
      envMapIntensity: surf === 'wet' ? 0.75 : surf === 'snow' ? 0.45 : 1,
    });
    // NEO-KYOTO: the edge line-work glows through an emissive companion map
    // (black except the lines) so bloom catches it against the night
    if (this.T.roadNeon) {
      mat.emissive = new THREE.Color(0xffffff);
      mat.emissiveMap = roadNeonEmissiveTexture(this.T.roadNeon);
      mat.emissiveMap.anisotropy = 8;
      mat.emissiveIntensity = 1.7;
    }
    // ...and belt-and-braces on top of the tuck: bias the road toward the
    // camera in the depth test so that even where a stray terrain triangle
    // does come up level with it, the carriageway is what you see. The road is
    // the one surface in this game that must never be occluded by the ground.
    mat.polygonOffset = true;
    mat.polygonOffsetFactor = -4;
    mat.polygonOffsetUnits = -4;
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = 'road';
    mesh.receiveShadow = true;
    mesh.renderOrder = 1;
    this.group.add(mesh);
  }

  /** How far the road ribbon drops below the centerline at sample j so a hero
   *  bridge deck can sit on top of it (0 everywhere else). Feathered over a
   *  few samples at each end so the ribbon has no hard step. */
  _deckDip(j) {
    if (!this._gorge) return 0;
    const d = this._circDist(j, this._gorge.i);
    const span = this._spanSamples();
    if (d > span + 4) return 0;
    return 0.34 * (1 - THREE.MathUtils.smoothstep(d, span - 1, span + 4));
  }

  /** Mountain-pass embankments (ascent-profile levels): a dirt apron drops
   *  from each road edge down the slope, so from below every switchback leg
   *  reads as a chunky stacked band on the face instead of an edge-on sliver.
   *  On the uphill side the apron simply buries itself inside the hill. */
  _buildRoadSkirts() {
    // Pass worlds are built as a shelf cut into the face: instead of a broad
    // dirt apron the edge falls almost vertically, so each switchback leg
    // reads as its own stone-faced terrace with the parapet on its lip.
    const steep = !!(this.T.retainingWalls || this.T.shelfRoad);
    const dirt = this.T.skirtColor
      ? new THREE.Color(this.T.skirtColor)
      : new THREE.Color(this.T.terrainDirt).lerp(new THREE.Color(0x8a5a32), 0.4);
    const dark = dirt.clone().multiplyScalar(steep ? 0.86 : 0.7);
    for (const side of [1, -1]) {
      const rows = 3;
      const verts = new Float32Array((N + 1) * rows * 3);
      const colors = new Float32Array((N + 1) * rows * 3);
      const idx = [];
      for (let i = 0; i <= N; i++) {
        const j = i % N;
        const c = this.center[j], n = this.nrm[j];
        const t = j * (Math.PI * 2 / N);
        // On the INSIDE of tight turns the apron may not reach past the turn
        // radius, or the ribbon folds over itself and sweeps up across the
        // road (visible as pale shards on hairpins/S-folds). Clamp reach.
        const a = this.tan[j], b = this.tan[(j + 8) % N];
        const insideSign = (a.x * b.z - a.z * b.x) > 0 ? 1 : -1;
        const maxLat = side === insideSign
          ? Math.max(WALL_OFF + 0.6, 0.85 / Math.max(this.curvature[j], 1e-4))
          : Infinity;
        // [lateral, y, color] — a shoulder lip, a steep face, and a toe that
        // reaches down to the LOCAL terrain (strand-capped folds drop far
        // below the road; a fixed-depth toe would hang in the air there)
        // over the gorge the road is a bridge deck: the apron collapses to a
        // thin lip instead of hanging a curtain down into the chasm
        const onSpan = this._gorge && this._circDist(j, this._gorge.i) < this._spanSamples() + 4;
        // ---- width-variation: skirts hug the (possibly pinched) road edge ----
        const wOff = WALL_OFF + this.widthAt(j) - ROAD_HALF;
        const face = onSpan ? 0.5 : steep
          ? 1.35 + Math.sin(9 * t + side) * 0.18
          : 2.6 + Math.sin(9 * t + side) * 0.4;
        const latToe = Math.min(wOff + face + (onSpan ? 0.3 : steep ? 1.1 : 2.8), maxLat);
        const ground = this._terrainMeshHeight(c.x + n.x * latToe * side, c.z + n.z * latToe * side);
        // on a bridge span the apron collapses to a hair under the deck edge
        const toeY = onSpan ? c.y - 1.6 : Math.min(c.y - 2.9, ground - 0.6);
        const rowSpec = [
          [Math.min(wOff + 0.55, maxLat), c.y - (onSpan ? 0.34 : 0.06), dirt],
          [Math.min(wOff + face, maxLat),
            c.y - (steep ? 1.5 : 2.1) - Math.sin(17 * t - side) * 0.35, dirt],
          [latToe, toeY, dark],
        ];
        for (let r = 0; r < rows; r++) {
          const [lat, y, col] = rowSpec[r];
          const o = (i * rows + r) * 3;
          verts[o] = c.x + n.x * lat * side;
          verts[o + 1] = y;
          verts[o + 2] = c.z + n.z * lat * side;
          colors[o] = col.r; colors[o + 1] = col.g; colors[o + 2] = col.b;
        }
      }
      for (let i = 0; i < N; i++) {
        for (let r = 0; r < rows - 1; r++) {
          const a = i * rows + r, b = a + 1, c = (i + 1) * rows + r, d = c + 1;
          idx.push(a, c, b, b, c, d);
        }
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geo.setIndex(idx);
      geo.computeVertexNormals();
      const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
        vertexColors: true, roughness: 1, side: THREE.DoubleSide,
      }));
      mesh.name = 'road-skirt';
      mesh.receiveShadow = true;
      this.group.add(mesh);
    }
  }

  _buildWalls() {
    if (this.T.cliffWalls) {
      // Slot-canyon look: tall stratified cliff ribbons just outside the road.
      // Purely visual — the physics clamp stays at WALL_OFF like every level.
      // T.cliffPalette re-skins the face per theme (glacial blue-white ice).
      const tex = cliffTexture(this.T.cliffPalette);
      tex.anisotropy = 4;
      this._cliffRibbon(1, tex);
      this._cliffRibbon(-1, tex);
      return;
    }
    // Open-world tracks: no fences anywhere. The road is fastest; drifting
    // wide just puts you on slow rough ground (see RULES.md — off-road IS
    // the boundary). Canyon keeps its rock walls above because stone is real.
  }

  /** Deterministic canyon-wall profile at sample j (independent of Math.random
   *  so cactus/rim placement can query the same shape). All frequencies are
   *  integer multiples of one lap, so the ribbon closes seamlessly. */
  _cliffProfile(j, side) {
    const t = (j % N) * (Math.PI * 2 / N);
    const ph = side * 2.13;                      // asymmetric left/right walls
    // the walls open up around the start line so the gate + grandstand read
    const gap = THREE.MathUtils.smoothstep(this._circDist(j % N, 0), 30, 85);
    let h = 18
      + Math.sin(9 * t + ph) * 2.6
      + Math.sin(23 * t + 1.3 - ph) * 1.5
      + Math.sin(61 * t + 4.1 + ph) * 0.9;       // ≈14–22 when fully walled
    h = Math.max(1.7, h * gap);                  // low stone berm through the gap
    const base = WALL_OFF + 0.65 + 0.24 * (Math.sin(31 * t + 2.2 + ph) + 1);
    const l1 = 0.85 + 0.5 * Math.sin(17 * t + 0.7 - ph);   // mid-face lean
    const l2 = 2.0 + 0.85 * Math.sin(13 * t + 2.9 + ph) + 0.4 * Math.sin(47 * t - ph);
    return { h, base, l1, l2 };
  }

  _cliffRibbon(side, tex) {
    const rows = 5;                       // base, mid, rim edge, rim plateau, outer ground
    const verts = new Float32Array((N + 1) * rows * 3);
    const uvs = new Float32Array((N + 1) * rows * 2);
    const idx = [];
    // deterministic per-vertex jitter, identical at the i=0 / i=N seam
    const hash = (n) => { const s = Math.sin(n) * 43758.5453; return s - Math.floor(s); };
    for (let i = 0; i <= N; i++) {
      const j = i % N;
      const c = this.center[j], n = this.nrm[j];
      const P = this._cliffProfile(j, side);
      const jt = (k) => hash(j * 12.9898 + k * 78.233 + side * 37.719) - 0.5;
      const tt = j * (Math.PI * 2 / N);
      const rimY = Math.max(0.9, P.h * 0.97 + jt(9) * 0.5);
      const rowSpec = [                            // [lateral, y, v]
        [P.base + jt(0) * 0.14, 0, 0.02],
        [P.base + P.l1 + jt(1) * 0.55, P.h * 0.52 + jt(2) * 0.7, 0.5],
        [P.base + P.l2 + jt(3) * 0.55, P.h + jt(4) * 0.8, 0.985],  // noisy rim edge
        [P.base + P.l2 + 5.5 + Math.sin(29 * tt + side) * 1.2, rimY, 0.94],
        [P.base + P.l2 + 12.5 + Math.sin(19 * tt - side) * 2.0, 0, 0.10],
      ];
      const u = (i * this.segLen) / 20;
      for (let r = 0; r < rows; r++) {
        const [lat, y, v] = rowSpec[r];
        const o = (i * rows + r) * 3;
        verts[o] = c.x + n.x * lat * side;
        verts[o + 1] = c.y + y;                // cliffs base at (and ride) the road y
        verts[o + 2] = c.z + n.z * lat * side;
        uvs[(i * rows + r) * 2] = u;
        uvs[(i * rows + r) * 2 + 1] = v;
      }
    }
    for (let i = 0; i < N; i++) {
      for (let r = 0; r < rows - 1; r++) {
        const a = i * rows + r, b = a + 1, c = (i + 1) * rows + r, d = c + 1;
        idx.push(a, c, b, b, c, d);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
      map: tex, roughness: 1, side: THREE.DoubleSide,
    }));
    mesh.receiveShadow = true;
    this.group.add(mesh);
  }

  _checkerFlag(x, y, z) {
    const flag = new THREE.Mesh(
      new THREE.PlaneGeometry(1.7, 1.1),
      new THREE.MeshBasicMaterial({ map: checkerTexture(), side: THREE.DoubleSide })
    );
    flag.material.map = checkerTexture();
    flag.material.map.repeat.set(3, 1);
    flag.geometry.translate(0.85, 0, 0); // pivot at the pole
    flag.position.set(x, y, z);
    this.group.add(flag);
    this.animated.flags.push({ mesh: flag, phase: Math.random() * 9 });
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.07, 2.2, 6),
      new THREE.MeshStandardMaterial({ color: 0xd8d2c2 })
    );
    pole.position.set(x, y - 0.4, z);
    this.group.add(pole);
  }

  _buildStartGate() {
    const i = 0;
    const c = this.center[i], n = this.nrm[i];
    const heading = this.headingAt(i);
    // checkered strip on the road
    const strip = new THREE.Mesh(
      new THREE.PlaneGeometry(ROAD_HALF * 2 + 2, 4),
      new THREE.MeshBasicMaterial({ map: checkerTexture(), transparent: true, opacity: 0.92 })
    );
    strip.material.map.repeat.set(5, 1);
    strip.rotation.order = 'YXZ';
    strip.rotation.y = heading;
    strip.rotation.x = -Math.PI / 2;
    strip.position.set(c.x, c.y + 0.04, c.z);  // start area is flat (c.y = 0)
    this.group.add(strip);

    // scaffold towers + banner
    const wood = new THREE.MeshStandardMaterial({
      color: 0x5d4426, roughness: 0.8, envMapIntensity: 0.5,
    });
    const steel = new THREE.MeshStandardMaterial({
      color: 0x4a4640, roughness: 0.35, metalness: 0.7, envMapIntensity: 0.5,
    });
    for (const side of [1, -1]) {
      const bx = c.x + n.x * 12.5 * side, bz = c.z + n.z * 12.5 * side;
      for (const [ox, oz] of [[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 10, 8), steel);
        leg.position.set(bx + ox, 5, bz + oz);
        leg.castShadow = true;
        this.group.add(leg);
        this.solids.push({ x: bx + ox, z: bz + oz, r: 0.6, y: c.y, mat: 'metal' });
      }
      for (let ly = 2.5; ly <= 8.5; ly += 3) {
        const brace = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.22, 2.1), wood);
        brace.position.set(bx, ly, bz);
        brace.castShadow = true;
        this.group.add(brace);
      }
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.7, 2.6), wood);
      cabin.position.set(bx, 10, bz);
      cabin.castShadow = true;
      this.group.add(cabin);
      this._addShadow(bx, bz, 2.6, c.y);        // grounds the gantry legs
      // waving checkered flags on the towers
      this._checkerFlag(bx, 11.8, bz);
    }
    const banner = new THREE.Mesh(
      new THREE.BoxGeometry(26, 2.4, 0.5),
      new THREE.MeshStandardMaterial({ map: wallTexture(), roughness: 0.85 })
    );
    banner.material.map = wallTexture();
    banner.material.map.repeat.set(6, 1);
    banner.position.set(c.x, 9, c.z);
    banner.rotation.y = heading;
    banner.castShadow = true;
    this.group.add(banner);

    // FINISH banner hung on the crossbar, visible from both directions
    const finTex = finishBannerTexture();
    for (const flip of [0, Math.PI]) {
      const fin = new THREE.Mesh(
        new THREE.PlaneGeometry(24, 2.15),
        new THREE.MeshStandardMaterial({ map: finTex, roughness: 0.85 })
      );
      fin.position.set(c.x, 9, c.z);
      fin.rotation.y = heading + flip;
      fin.translateZ(0.32);
      this.group.add(fin);
    }

    // traffic-light box hanging from the banner
    const housing = new THREE.Mesh(
      new THREE.BoxGeometry(7.4, 2.6, 1.2),
      new THREE.MeshStandardMaterial({
        color: 0x24211c, roughness: 0.35, metalness: 0.7, envMapIntensity: 0.5,
      })
    );
    housing.position.set(c.x, 6.6, c.z);
    housing.rotation.y = heading;
    housing.castShadow = true;
    this.group.add(housing);
    this.lampMats = {};
    const lampSpecs = [['red', -2.3, 0xff3222], ['yellow', 0, 0xffd022], ['green', 2.3, 0x35e04a]];
    for (const [name, off, lit] of lampSpecs) {
      const mat = new THREE.MeshBasicMaterial({ color: 0x2a2622 });
      mat.userData = { lit: new THREE.Color(lit), dim: new THREE.Color(lit).multiplyScalar(0.12) };
      mat.color.copy(mat.userData.dim);
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.85, 14, 10), mat);
      lamp.position.set(c.x, 6.6, c.z);
      lamp.rotation.y = heading;
      lamp.translateX(off);
      this.group.add(lamp);
      this.lampMats[name] = mat;
    }
    this.setLights('red');
  }

  /** phase: 'red' | 'yellow' | 'green' | 'off' */
  setLights(phase) {
    for (const [name, mat] of Object.entries(this.lampMats)) {
      mat.color.copy(name === phase ? mat.userData.lit : mat.userData.dim);
    }
  }

  _circDist(a, b) {
    const d = Math.abs(a - b) % N;
    return Math.min(d, N - d);
  }

  _buildBoostPads() {
    // Boost pads are GONE. Speed should come from driving — the racing line,
    // a slipstream tow, nitro you earned — not from stamped chevrons that hand
    // it out for touching the right patch of road. Array kept so the "clear of
    // a pad" placement guards elsewhere still resolve.
    this.boostPads = [];
    if (this.boostPads.length === 0) return;
    const tex = chevronTexture();
    const min = this.T.padMaxCurv;
    let last = -999;
    for (let i = 40; i < N && this.boostPads.length < 5; i += 10) {
      if (this._nearNarrow(i, 14)) continue; // ---- width-variation: pads clear of pinches
      if (this.ramps.some((r) => this._circDist(i, r.index) < 50)) continue;
      if (this._nearGorge(i, 50)) continue;
      if (this.curvature[i] < min && i - last > 140) {
        last = i;
        const lateral = (this.boostPads.length % 2 === 0) ? -3.2 : 3.2;
        this.boostPads.push({ index: i, lateral });
        const p = this.pointAt(i, lateral);
        const pad = new THREE.Mesh(
          new THREE.PlaneGeometry(5.4, 8.5),
          new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })
        );
        pad.rotation.order = 'YXZ';
        pad.rotation.y = this.headingAt(i);
        // pitch the decal to hug the sloped road (tilt back on climbs)
        pad.rotation.x = -Math.PI / 2 - Math.atan(this.slopeAt(i));
        pad.position.set(p.x, p.y + 0.06, p.z);
        this.group.add(pad);
      }
    }
  }

  /** Natural jumps: the ROAD ITSELF lifts into a smooth crest — a rise, a
   *  brow, and a fall you can launch off if you take it fast enough. This
   *  replaces the old prop ramps, which were plywood wedges bolted onto the
   *  surface that launched you off a hard lip at their far edge. A crest is
   *  landscape, not furniture: take it slowly and you simply roll over it.
   *
   *  Baked into the elevation profile (see the call site) rather than added by
   *  `groundHeightAt`, so everything downstream inherits the shape.
   *
   *  The hump is half a cosine wave, which starts and ends with ZERO gradient —
   *  no lip to catch a wheel, and the join into the flat road is invisible. */
  _buildCrests() {
    this.crests = [];
    // Two or three identical humps a lap is not "jumps in the road", it is a
    // feature you meet twice and stop noticing. More of them, and no two the
    // same size: a long shallow brow you skim, a short sharp one that throws
    // the car, and everything between. Heights and lengths are rolled per
    // crest, so a world is not the same set of jumps every time you load it.
    const want = (this.T.rampCount || 3) + 3;
    const baseH = this.T.crestHeight ?? 2.9;
    const len = 22;                       // nominal samples spanned by the hump
    // rank windows by how straight they are across the crest's full length —
    // a jump landing mid-corner is a wreck, not a thrill
    const windows = [];
    for (let i = 0; i < N; i += 5) {
      if (i < 60 || i > N - 90) continue;   // clear of the start gate
      if (this._nearNarrow(i, 30)) continue; // never inside a pinch
      let maxCurv = 0;
      for (let k = -4; k < len + 2; k++) maxCurv = Math.max(maxCurv, this.curvature[(i + k + N) % N]);
      windows.push({ i, maxCurv });
    }
    windows.sort((a, b) => a.maxCurv - b.maxCurv);
    // tighter spacing than before, or the extra crests have nowhere to go
    const gap = Math.min(120, ((N - 150) / want) | 0);
    const chosen = [];
    const take = (limit) => {
      for (const w of windows) {
        if (chosen.length >= want) return;
        if (w.maxCurv > limit) return;               // sorted: nothing later is straighter
        if (this._nearGorge(w.i, 60)) continue;
        if (chosen.some((c) => this._circDist(w.i, c) < gap)) continue;
        chosen.push(w.i);
      }
    };
    take(this.T.rampMaxCurv);
    // A twisty circuit can have no window straight enough to clear the ramp
    // threshold, which used to mean a track with no jumps at all. Crests are
    // part of the terrain now, not bolted-on furniture, so every world gets
    // some: relax the straightness limit until the quota is filled, rather than
    // stopping at two. PINE VALLEY was shipping a single jump a lap this way.
    if (chosen.length < want) take(this.T.rampMaxCurv * 2.2);
    if (chosen.length < want) take(this.T.rampMaxCurv * 4);
    if (chosen.length < Math.min(3, want)) take(Infinity);
    for (const i of chosen) {
      // A SHORT crest of a given height is a launch; a LONG one of the same
      // height is a brow you float over. Rolling the two together is what makes
      // them feel like different jumps rather than one jump repeated.
      const h = baseH * (0.72 + Math.random() * 0.85);       // ~2.1 .. 4.6 u
      const L = Math.round(len * (0.7 + Math.random() * 0.7)); // ~15 .. 33 samples
      this.crests.push({ index: i, len: L, height: +h.toFixed(2) });
      for (let k = 0; k < L; k++) {
        const f = k / L;                                     // 0..1 across it
        this.center[(i + k) % N].y += h * 0.5 * (1 - Math.cos(f * Math.PI * 2));
      }
    }
    // the elevation just changed under us — the grade the physics and the mesh
    // pitching read has to be rebuilt or cars will climb a hill they can't feel
    for (let i = 0; i < N; i++) {
      this._slope[i] =
        (this.center[(i + 2) % N].y - this.center[(i - 2 + N) % N].y) / (4 * this.segLen);
    }
  }

  _buildRamps() {
    // Prop launch ramps are GONE — replaced by natural crests baked into the
    // road's own elevation (`_buildCrests`). The array stays so the many
    // "keep clear of a ramp" placement guards elsewhere still resolve; they
    // simply never match now.
    this.ramps = [];
    if (this.ramps.length === 0) return;
    const woodTex = buildingTexture();
    const hazTex = hazardTexture();
    // rank every window by how straight it is over the ramp's whole length
    const windows = [];
    for (let i = 0; i < N; i += 5) {
      if (i < 60 || i > N - 90) continue; // keep clear of the start gate
      if (this._nearNarrow(i, 30)) continue; // ---- width-variation: no ramps in pinches
      let maxCurv = 0;
      for (let k = -4; k < 22; k++) maxCurv = Math.max(maxCurv, this.curvature[(i + k + N) % N]);
      windows.push({ i, maxCurv });
    }
    windows.sort((a, b) => a.maxCurv - b.maxCurv);
    // jump-heavy levels (redwood crests, the avalanche pass) place extra ramps
    const want = this.T.rampCount || 3;
    const gap = Math.min(180, ((N - 150) / want) | 0);
    const chosen = [];
    for (const w of windows) {
      if (chosen.length >= want) break;
      if (w.maxCurv > this.T.rampMaxCurv) break;
      if (this._nearGorge(w.i, 60)) continue;
      if (chosen.some((c) => this._circDist(w.i, c) < gap)) continue;
      chosen.push(w.i);
    }
    for (const i of chosen) {
      {
        const lateral = [-3.4, 3.4, 0, 3.4, -3.4, 0][this.ramps.length];
        const len = 16, height = 3.1, halfW = 3.3;
        this.ramps.push({ index: i, lateral, len, height, halfW });
        // wedge mesh: an inclined deck with hazard-striped sides
        const L = len * this.segLen;
        const mid = (i + len / 2) % N;
        const p = this.pointAt(mid, lateral);
        const g = new THREE.Group();
        const angle = Math.atan2(height, L);
        const deck = new THREE.Mesh(
          new THREE.BoxGeometry(halfW * 2, 0.4, Math.hypot(L, height)),
          new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.95 })
        );
        deck.rotation.x = -angle;
        deck.position.y = height / 2 - 0.1;
        deck.castShadow = true;
        g.add(deck);
        for (const s of [-1, 1]) {
          const rail = new THREE.Mesh(
            new THREE.BoxGeometry(0.25, 0.8, Math.hypot(L, height)),
            new THREE.MeshStandardMaterial({ map: hazTex, roughness: 0.9 })
          );
          rail.rotation.x = -angle;
          rail.position.set(s * (halfW + 0.1), height / 2 + 0.2, 0);
          g.add(rail);
        }
        // back support wall
        const back = new THREE.Mesh(
          new THREE.BoxGeometry(halfW * 2, height, 0.5),
          new THREE.MeshStandardMaterial({ map: hazTex, roughness: 0.9 })
        );
        back.position.set(0, height / 2, L / 2 - 0.2);
        g.add(back);
        // sit the wedge on the elevated road at its mid index and pitch the
        // whole group with the road grade so both ends meet the surface
        g.position.set(p.x, p.y, p.z);
        g.rotation.order = 'YXZ';
        g.rotation.y = this.headingAt(mid);
        g.rotation.x = -Math.atan(this.slopeAt(mid));
        this.group.add(g);
      }
    }
  }

  /** On-road rock obstacles (canyon hoodoos / volcano basalt boulders).
   *  Fills this.obstacles with world-space colliders {x, z, r}; the car
   *  collision response against them lives in the vehicle code. */
  _buildObstacles() {
    this._obstacleIdx = [];
    const spec = this.T.obstacleSpec;
    if (!spec) return;
    // straight-ish sections only, clear of start, ramps, pads and each other
    const chosen = [];
    for (let i = 0; i < N && chosen.length < spec.count; i += 7) {
      if (this._circDist(i, 0) < 60) continue;
      if (this._nearGorge(i, 45)) continue;
      if (this._nearNarrow(i, 25)) continue; // ---- width-variation: keep blockers out of pinches
      // alpine: loose boulders litter the fast DESCENT only (the downhill
      // window is short, so they pack tighter, and rockfall on a sweeper is
      // fair game — elsewhere obstacles keep to straights)
      if (this.curvature[i] > (spec.downhill ? 0.02 : 0.012)) continue;
      if (spec.downhill && this.slopeAt(i) > -0.02) continue;
      if (this.ramps.some((r) => this._circDist(i, r.index) < 41)) continue;  // 25 + ramp len
      if (this.boostPads.some((p) => this._circDist(i, p.index) < 25)) continue;
      if (chosen.some((c) => this._circDist(i, c) < (spec.downhill ? 38 : 120))) continue;
      chosen.push(i);
    }
    this._obstacleIdx = chosen;
    const strata = ['#cf9a5e', '#a06844', '#b8845a', '#8f5a36', '#c9a06a'].map(
      (c) => new THREE.MeshStandardMaterial({ color: c, flatShading: true, roughness: 1 })
    );
    const basaltMat = new THREE.MeshStandardMaterial({
      color: 0x25212a, flatShading: true, roughness: 0.45, metalness: 0.1, emissive: 0x1c0a04,
    });
    // alpine rockfall: mossy granite, matching the trackside boulder palette
    const graniteMat = new THREE.MeshStandardMaterial({
      color: 0x7a9a6c, flatShading: true, roughness: 1,
    });
    const logMat = new THREE.MeshStandardMaterial({ color: 0x7a5230, roughness: 0.95 });
    const logCapMat = new THREE.MeshStandardMaterial({ color: 0xc8a468, roughness: 0.9 });
    const rootMat = new THREE.MeshStandardMaterial({ color: 0x5e3820, roughness: 1 });
    chosen.forEach((i, k) => {
      // exposed-root bumps are small and hug the road EDGE; everything else is
      // a big mid-lane blocker
      const roots = spec.style === 'roots';
      const r = roots ? 1.2 + Math.random() * 0.5 : 2.2 + Math.random();
      const side = k % 2 === 0 ? -1 : 1;
      const lateral = roots
        ? side * (5.6 + Math.random() * 2.2)               // near the shoulder
        : side * (1.2 + Math.random() * 3.3);              // within ±4.5 of centerline
      const p = this.pointAt(i, lateral);
      if (spec.style === 'roots') {
        // gnarled redwood roots breaking the surface: 3 low half-buried ridges
        const g = new THREE.Group();
        for (let s = 0; s < 3; s++) {
          const seg = new THREE.Mesh(
            new THREE.CylinderGeometry(0.2 + Math.random() * 0.12, 0.32, r * (1.4 + Math.random() * 0.7), 6),
            rootMat
          );
          seg.rotation.z = Math.PI / 2 + (Math.random() - 0.5) * 0.3;  // lie low
          seg.rotation.y = (Math.random() - 0.5) * 1.4;
          seg.position.set((Math.random() - 0.5) * r, 0.12 + s * 0.14, (Math.random() - 0.5) * r);
          seg.castShadow = true;
          g.add(seg);
        }
        g.position.set(p.x, p.y, p.z);
        g.rotation.y = this.headingAt(i) + Math.PI / 2;    // roots reach across the lane
        this.group.add(g);
      } else if (spec.style === 'logs') {
        // jungle log pile: 2-3 stacked horizontal trunks lying across the lane
        const g = new THREE.Group();
        const nLogs = 2 + (Math.random() < 0.5 ? 1 : 0);
        const len = r * 2.1;
        const lr = 0.62;
        const spots = [[-lr * 1.05, lr], [lr * 1.05, lr], [0, lr * 2.7]];
        for (let s = 0; s < nLogs; s++) {
          const log = new THREE.Mesh(
            new THREE.CylinderGeometry(lr * (0.9 + Math.random() * 0.2), lr, len, 9),
            [logMat, logCapMat, logCapMat]
          );
          log.rotation.z = Math.PI / 2;                    // lie flat, axis along local X
          log.rotation.y = (Math.random() - 0.5) * 0.16;
          log.position.set(spots[s][0] + (Math.random() - 0.5) * 0.3, spots[s][1], (Math.random() - 0.5) * 0.3);
          log.castShadow = true;
          g.add(log);
        }
        g.position.set(p.x, p.y, p.z);
        // logs run across the road (local X = world road-normal direction)
        g.rotation.y = this.headingAt(i) + Math.PI / 2 + (Math.random() - 0.5) * 0.4;
        this.group.add(g);
      } else if (spec.style === 'basalt' || spec.style === 'boulder') {
        // two-lump boulder: glossy obsidian (volcano) or mossy granite (alpine)
        const rockMat = spec.style === 'boulder' ? graniteMat : basaltMat;
        const g = new THREE.Group();
        const low = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 0), rockMat);
        low.scale.set(r, r * 0.72, r * 0.9);
        low.position.y = r * 0.42;
        low.rotation.y = Math.random() * Math.PI * 2;
        low.castShadow = true;
        g.add(low);
        const top = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 0), rockMat);
        top.scale.set(r * 0.55, r * 0.5, r * 0.55);
        top.position.y = r * 0.95;
        top.rotation.y = Math.random() * Math.PI * 2;
        top.castShadow = true;
        g.add(top);
        g.position.set(p.x, p.y, p.z);
        this.group.add(g);
      } else {
        // hoodoo: 4–5 stacked tapered sandstone drums with a wider cap stone
        const g = new THREE.Group();
        const nSeg = 4 + (Math.random() < 0.4 ? 1 : 0);
        const wr = [1, 0.8, 0.64, 0.78, 0.55];
        let y = p.y;                                     // stack up from the road surface
        for (let s = 0; s < nSeg; s++) {
          const rad = r * wr[Math.min(s, wr.length - 1)] * (0.92 + Math.random() * 0.16);
          const hh = (2.5 - s * 0.25) * (0.85 + Math.random() * 0.35);
          const seg = new THREE.Mesh(
            new THREE.CylinderGeometry(rad * 0.8, rad, hh, 8),
            strata[s % strata.length]
          );
          seg.position.set(
            p.x + (Math.random() - 0.5) * 0.5, y + hh / 2,
            p.z + (Math.random() - 0.5) * 0.5
          );
          seg.rotation.y = Math.random() * Math.PI * 2;
          seg.castShadow = true;
          g.add(seg);
          y += hh * 0.96;
        }
        this.group.add(g);
      }
      // collision stays horizontal ({x, z, r}); y is the road height for visuals
      this.obstacles.push({ x: p.x, z: p.z, r, y: p.y });
      this._addShadow(p.x, p.z, r * 1.35, p.y);
    });
  }

  /** Flat mud-puddle decals on the road surface (visual only here; the
   *  splash/slowdown reaction lives in the vehicle code via this.puddles). */
  _buildPuddles() {
    const count = this.T.puddleCount | 0;
    if (!count) return;
    // theme knob T.puddle re-tints the decal (glacial's icy frozen slicks)
    const tex = puddleTexture(this.T.puddle);
    const chosen = [];
    for (let i = 3; i < N && chosen.length < count; i += 5) {
      if (this._circDist(i, 0) < 50) continue;
      if (this._nearGorge(i, 40)) continue;
      if (this._nearNarrow(i, 6)) continue; // ---- width-variation: puddles clear of pinches
      if (this.ramps.some((r) => this._circDist(i, r.index) < 41)) continue;
      if (this.boostPads.some((p) => this._circDist(i, p.index) < 25)) continue;
      if (this._obstacleIdx.some((o) => this._circDist(i, o) < 25)) continue;
      // high-count levels (jungle's 8 river-fed pools) pack a little tighter
      if (chosen.some((c) => this._circDist(i, c) < (count > 6 ? 55 : 80))) continue;
      chosen.push(i);
    }
    for (const i of chosen) {
      const rad = 3 + Math.random() * 2;
      const lateral = Math.random() * 7 - 3.5;             // may sit mid-road
      const p = this.pointAt(i, lateral);
      const m = new THREE.Mesh(
        new THREE.CircleGeometry(1, 26),
        new THREE.MeshStandardMaterial({
          map: tex, transparent: true, roughness: 0.25, metalness: 0.08, depthWrite: false,
        })
      );
      m.rotation.order = 'YXZ';
      m.rotation.y = this.headingAt(i);
      // pitch with the road grade so the decal hugs the slope; the in-plane
      // spin variety moves to rotation.z (applied first in YXZ order)
      m.rotation.x = -Math.PI / 2 - Math.atan(this.slopeAt(i));
      m.rotation.z = Math.random() * Math.PI * 2;
      m.scale.set(rad, rad * (0.72 + Math.random() * 0.25), 1);
      m.position.set(p.x, p.y + 0.04, p.z);
      m.renderOrder = 1;
      this.group.add(m);
      this.puddles.push({ x: p.x, z: p.z, r: rad, y: p.y });
    }
  }

  // ---- river-fords ---------------------------------------------------------
  /** River fords: a visible watercourse crossing the ROAD perpendicular-ish,
   *  4–8u wide, with shallow water OVER the road surface (the jungle's
   *  _buildRivers streams pass UNDER the deck — these wash across it). The
   *  stream ribbon meanders off into the landscape on both sides; foam lines
   *  mark the water's edge across the road. Physics (splash, drag, wet tires)
   *  is consumed from track.fords by the vehicle code. */
  _buildFords() {
    const themeKey = (this.level && this.level.theme) || 'forest';
    const spec = this.T.fords !== undefined ? this.T.fords : FORD_TUNE[themeKey];
    const count = spec && spec.count | 0;
    if (!count) return;
    // deterministic per theme (offset seed so fords never mirror the narrows)
    let seed = 374761393 >>> 0;
    for (let k = 0; k < themeKey.length; k++) {
      seed = ((seed ^ themeKey.charCodeAt(k)) * 2246822519) >>> 0;
    }
    const rnd = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const chosen = [];
    for (let tries = 0; tries < 400 && chosen.length < count; tries++) {
      const i = 60 + Math.floor(rnd() * (N - 120));
      if (this.curvature[i] > 0.013) continue;                 // straight-ish crossings
      if (this._circDist(i, 0) < 70) continue;
      if (this._nearNarrow(i, 20)) continue;
      if (this.ramps.some((r) => this._circDist(i, r.index) < 45)) continue;
      if (this.boostPads.some((p) => this._circDist(i, p.index) < 25)) continue;
      if (this._obstacleIdx.some((o) => this._circDist(i, o) < 25)) continue;
      if (chosen.some((c) => this._circDist(i, c.i) < 150)) continue;
      chosen.push({ i, half: 3 + rnd() * 2 });                 // 6–10u wide band
    }
    if (!chosen.length) return;
    // ONE river through all of them (see _planRiver): the water ribbon itself
    // is built later, in _buildRiver, from that single curve — this loop now
    // only registers the physics bands and paints the foam lines on the road.
    this._planRiver(chosen);
    const foamMat = new THREE.MeshBasicMaterial({
      color: 0xf2fbff, transparent: true, opacity: 0.4, depthWrite: false,
    });
    for (const fd of chosen) {
      const c = this.center[fd.i];
      const roadW = this.widthAt(fd.i);
      this.fords.push({ i: fd.i, x: c.x, z: c.z, y: c.y, half: fd.half });
      // foam lines where the water meets the road at both edges of the band
      const heading = this.headingAt(fd.i);
      for (const s of [-1, 1]) {
        const foam = new THREE.Mesh(new THREE.PlaneGeometry(roadW * 2 + 2.5, 0.55), foamMat);
        foam.rotation.order = 'YXZ';
        foam.rotation.y = heading;
        foam.rotation.x = -Math.PI / 2 - Math.atan(this.slopeAt(fd.i));
        const fp = this.pointAt(fd.i, 0);
        foam.position.set(
          fp.x + this.tan[fd.i].x * fd.half * s * 0.9,
          fp.y + 0.09,
          fp.z + this.tan[fd.i].z * fd.half * s * 0.9
        );
        foam.renderOrder = 2;
        this.group.add(foam);
      }
    }
  }
  // ---- end river-fords -----------------------------------------------------

  // ---- viz-zones -----------------------------------------------------------
  /** Deterministic per-theme visibility zones: 40–90-sample sections where
   *  sight is impaired — 'forest' (dense tree corridor + canopy gloom),
   *  'fogbank' (pure data; runtime pulls fog in) and 'squall' (rain burst).
   *  The runtime fog response lives in the game lead; rivals read the zones
   *  through their corner-speed planner. */
  _buildVizZones() {
    const themeKey = (this.level && this.level.theme) || 'forest';
    const spec = this.T.viz !== undefined ? this.T.viz : VIZ_TUNE[themeKey];
    if (!spec || !spec.length) return;
    let seed = 668265263 >>> 0;
    for (let k = 0; k < themeKey.length; k++) {
      seed = ((seed ^ themeKey.charCodeAt(k)) * 374761393) >>> 0;
    }
    const rnd = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    for (const [kind, count] of spec) {
      for (let want = 0, tries = 0; want < count && tries < 400; tries++) {
        // corridors run a bit shorter than fog banks (their tree walls need a
        // gentle stretch of road); fog/squalls take 40–90 samples anywhere
        const len = kind === 'forest' ? 40 + Math.floor(rnd() * 26) : 40 + Math.floor(rnd() * 50);
        const i0 = Math.floor(rnd() * N);
        if (this._circDist(i0, 0) < 80 || this._circDist((i0 + len) % N, 0) < 80) continue;
        const mid = (i0 + (len >> 1)) % N, half = len / 2;
        if (this._nearNarrow(mid, half + 8)) continue;        // keep clear of pinches
        if (this.vizZones.some((z) => this._circDist(mid, z.mid) < z.half + half + 50)) continue;
        // forest corridors want gentle road (trees at the edge of a hairpin
        // block the sight line the driver NEEDS); fog can sit anywhere
        if (kind === 'forest') {
          let ok = true;
          for (let k2 = -4; ok && k2 <= len + 4; k2++) {
            if (this.curvature[(i0 + k2 + N) % N] > 0.024) ok = false;
          }
          if (!ok) continue;
          // …and never over a ford: the canopy gloom decal would swallow the
          // white bow-wave that sells the crossing (fords are built first)
          if (this.fords.some((f) => this._circDist(mid, f.i) < half + 10)) continue;
        }
        this.vizZones.push({ i0, i1: (i0 + len) % N, len, mid, half, kind, strength: 1 });
        want++;
      }
    }
    if (this.vizZones.some((z) => z.kind === 'forest')) this._buildVizCorridors();
  }

  /** Thick-forest corridors: big canopy pines planted DENSE along both road
   *  edges of every 'forest' viz zone, leaning inward so the road reads as a
   *  tunnel through the woods, plus a translucent canopy-shadow ribbon over
   *  the road for under-canopy gloom. Trees register in this.trees (kind
   *  'pine', s ≥ 1.0 ⇒ SOLID trunks per the material law), kept ~1.5–2u off
   *  the drivable edge so wide lines are punished, never blocked. */
  _buildVizCorridors() {
    const T = this.T;
    const zones = this.vizZones.filter((z) => z.kind === 'forest');
    // shared instanced pine (theme-tinted): trunk + two canopy tiers (+ cap)
    let cap = 0;
    for (const z of zones) cap += Math.ceil(z.len / 2) * 2 + 4;
    // Broadleaf themes get broadleaf corridors. These are the DENSE trees that
    // form the tunnel and therefore dominate the view, so leaving them as cones
    // meant the Amazon still read as a pine forest no matter what was planted
    // in the scatter around it: 86 of its 486 trees were conifers, and they were
    // the ones you actually drive between.
    const broadleaf = (this.level?.theme === 'jungle' || this.level?.theme === 'redwood');
    const trunkGeo = broadleaf
      ? new THREE.CylinderGeometry(0.34, 0.66, 5.4, 7)   // clear bole, no low branches
      : new THREE.CylinderGeometry(0.42, 0.6, 3.2, 7);
    trunkGeo.translate(0, broadleaf ? 2.7 : 1.6, 0);
    let lowGeo, topGeo;
    if (broadleaf) {
      // stacked parasols: a closed canopy seen from underneath
      lowGeo = new THREE.SphereGeometry(3.6, 9, 5);
      lowGeo.scale(1, 0.46, 1);
      lowGeo.translate(0, 6.4, 0);
      topGeo = new THREE.SphereGeometry(2.5, 8, 5);
      topGeo.scale(1, 0.5, 1);
      topGeo.translate(0.5, 8.3, -0.4);
    } else {
      lowGeo = new THREE.ConeGeometry(3.1, 4.8, 8);
      lowGeo.translate(0, 5.1, 0);
      topGeo = new THREE.ConeGeometry(2.1, 3.9, 8);
      topGeo.translate(0, 8.1, 0);
    }
    const trunkMat = new THREE.MeshStandardMaterial({ color: T.trunkColor ?? 0x5a4028, roughness: 1 });
    const lowMat = new THREE.MeshStandardMaterial({ color: T.foliageLow ?? 0x2c6e2a, flatShading: true, roughness: 1 });
    const topMat = new THREE.MeshStandardMaterial({ color: T.foliageTop ?? 0x3c8a34, flatShading: true, roughness: 1 });
    const parts = [
      new THREE.InstancedMesh(trunkGeo, trunkMat, cap),
      new THREE.InstancedMesh(lowGeo, lowMat, cap),
      new THREE.InstancedMesh(topGeo, topMat, cap),
    ];
    if (T.treeSnowCap) {
      const capGeo = new THREE.ConeGeometry(1.5, 2.1, 8);
      capGeo.translate(0, 8.9, 0);
      parts.push(new THREE.InstancedMesh(
        capGeo, new THREE.MeshStandardMaterial({ color: 0xf2f6fa, flatShading: true, roughness: 0.9 }), cap));
    }
    for (const part of parts) part.castShadow = true;
    const hash = (n) => { const s = Math.sin(n) * 43758.5453; return s - Math.floor(s); };
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const pos = new THREE.Vector3(), scl = new THREE.Vector3();
    const color = new THREE.Color();
    const F = T.foliage || { h: 0.29, hVar: 0.06, s: 0.5, sVar: 0.2, l: 0.32, lVar: 0.14 };
    let k = 0;
    for (const z of zones) {
      for (let s = 0; s < z.len && k < cap; s += 2) {   // a pair every ~3.8u: thick
        const j = (z.i0 + s) % N;
        for (const side of [1, -1]) {
          if (k >= cap) break;
          const h1 = hash(j * 5.7 + side * 2.3);
          // two staggered rows pressed near the road edge. The trunks are
          // SOLID, so like the pinch markers they are pushed out until the
          // collision face (trunk r + the 1.8u car radius) clears the drivable
          // width — the canopy leans in over the road, the trunks never do.
          const row = h1 < 0.55 ? 0 : 1;
          const sc = 1.15 + hash(j * 9.1 - side) * 0.75;      // big canopy pines
          const lat = (this.widthAt(j) + 0.75 * sc + 2.0 + row * 3.2 + h1 * 1.4) * side;
          const p = this.pointAt(j, lat);
          const ty = this.terrainHeight(p.x, p.z) - 0.2;
          // lean the whole tree inward over the road (rotation about the tangent)
          const lean = (0.10 + hash(j * 3.3 + side) * 0.12) * side;
          q.setFromAxisAngle(this.tan[j], lean);
          pos.set(p.x, ty, p.z);
          scl.set(sc, sc * (0.95 + hash(j * 1.9) * 0.35), sc);
          m4.compose(pos, q, scl);
          for (const part of parts) part.setMatrixAt(k, m4);
          color.setHSL(
            F.h + hash(j * 2.2 + side) * F.hVar,
            F.s + hash(j * 4.4 - side) * F.sVar,
            Math.max(0.1, (F.l + hash(j * 6.6) * F.lVar) * 0.82)  // corridor reads darker
          );
          parts[1].setColorAt(k, color);
          parts[2].setColorAt(k, color.clone().multiplyScalar(1.15));
          parts[0].setColorAt(k, color.clone().setScalar(0.85));
          // collision r tracks the TRUNK, not the canopy (the canopy overhangs
          // the road; only the trunk is solid) — see the clearance note above
          this.trees.push({ x: p.x, z: p.z, y: ty, r: 0.75 * sc, id: k, parts, kind: 'pine', s: sc });
          this._addShadow(p.x, p.z, 2.6 * sc, ty + 0.2);
          k++;
        }
      }
      // under-canopy gloom: a dark translucent ribbon over the road, tapering
      // out at both ends (same decal spirit as the baked contact shadows)
      const rows = 2;
      const gv = new Float32Array((z.len + 1) * rows * 3);
      const gidx = [];
      for (let s2 = 0; s2 <= z.len; s2++) {
        const j = (z.i0 + s2) % N;
        const c = this.center[j], n = this.nrm[j];
        const taper = Math.min(1, Math.min(s2, z.len - s2) / 7);
        const w = (this.widthAt(j) + 2.2) * taper;
        const o = s2 * rows * 3;
        gv[o] = c.x + n.x * w; gv[o + 1] = c.y + 0.05; gv[o + 2] = c.z + n.z * w;
        gv[o + 3] = c.x - n.x * w; gv[o + 4] = c.y + 0.05; gv[o + 5] = c.z - n.z * w;
      }
      for (let s2 = 0; s2 < z.len; s2++) {
        const a = s2 * 2, b = a + 1, c2 = a + 2, d2 = a + 3;
        gidx.push(a, b, c2, b, d2, c2);
      }
      const ggeo = new THREE.BufferGeometry();
      ggeo.setAttribute('position', new THREE.BufferAttribute(gv, 3));
      ggeo.setIndex(gidx);
      const gloom = new THREE.Mesh(ggeo, new THREE.MeshBasicMaterial({
        color: 0x03130a, transparent: true, opacity: 0.34, depthWrite: false,
      }));
      gloom.renderOrder = 1;
      this.group.add(gloom);
    }
    for (const part of parts) {
      part.count = k;
      if (part.instanceColor) part.instanceColor.needsUpdate = true;
    }
    this.group.add(...parts);
  }
  // ---- end viz-zones -------------------------------------------------------

  /** Build one prop mesh (origin at its base). Returns {mesh, r} — geometry and
   *  most materials are shared; only theme tints (hay color, barrel wrap) vary. */
  _makeProp(type) {
    const A = propAssets();
    switch (type) {
      case 'hay': {
        if (!this._hayPropMat) {
          this._hayPropMat = new THREE.MeshStandardMaterial({ color: this.T.hayColor, roughness: 1 });
        }
        const m = new THREE.Mesh(A.geo.hay, this._hayPropMat);
        m.castShadow = true;
        return { mesh: m, r: 1.5 };
      }
      case 'crate': {
        const m = new THREE.Mesh(A.geo.crate, A.mat.crate);
        m.castShadow = true;
        return { mesh: m, r: 1.6 };
      }
      case 'cone': {
        const g = new THREE.Group();
        g.add(new THREE.Mesh(A.geo.coneBase, A.mat.coneBase));
        const c = new THREE.Mesh(A.geo.cone, A.mat.cone);
        c.castShadow = true;
        g.add(c);
        return { mesh: g, r: 1.0 };
      }
      case 'barrel': {
        if (!this._barrelPropMat) {
          const pal = BARREL_PALETTES[this.level && this.level.theme] || {};
          this._barrelPropMat = new THREE.MeshStandardMaterial({
            map: barrelTexture(pal), roughness: 0.9,
          });
        }
        const m = new THREE.Mesh(A.geo.barrel, [this._barrelPropMat, A.mat.barrelCap, A.mat.barrelCap]);
        m.castShadow = true;
        return { mesh: m, r: 1.3 };
      }
      case 'snowman': {
        const g = new THREE.Group();
        const body = new THREE.Mesh(A.geo.ballBody, A.mat.snow);
        body.position.y = 0.68;
        body.castShadow = true;
        g.add(body);
        const head = new THREE.Mesh(A.geo.ballHead, A.mat.snow);
        head.position.y = 1.75;
        g.add(head);
        const nose = new THREE.Mesh(A.geo.carrot, A.mat.carrot);
        nose.rotation.x = Math.PI / 2;                   // carrot points +z
        nose.position.set(0, 1.8, 0.62);
        g.add(nose);
        for (const s of [-1, 1]) {
          const eye = new THREE.Mesh(A.geo.eye, A.mat.coal);
          eye.position.set(s * 0.18, 1.95, 0.44);
          g.add(eye);
        }
        return { mesh: g, r: 1.4 };
      }
      case 'penguin': {
        // little voxel penguin waddling near the road (glacial)
        const g = new THREE.Group();
        const body = new THREE.Mesh(A.geo.pengBody, A.mat.pengBlack);
        body.position.y = 0.53;
        body.castShadow = true;
        g.add(body);
        const belly = new THREE.Mesh(A.geo.pengBelly, A.mat.pengWhite);
        belly.position.set(0, 0.5, 0.25);
        g.add(belly);
        const head = new THREE.Mesh(A.geo.pengHead, A.mat.pengBlack);
        head.position.y = 1.14;
        g.add(head);
        const beak = new THREE.Mesh(A.geo.pengBeak, A.mat.pengOrange);
        beak.position.set(0, 1.1, 0.3);
        g.add(beak);
        for (const s of [-1, 1]) {
          const eye = new THREE.Mesh(A.geo.eye, A.mat.pengWhite);
          eye.position.set(s * 0.13, 1.2, 0.21);
          g.add(eye);
          const wing = new THREE.Mesh(A.geo.pengWing, A.mat.pengBlack);
          wing.position.set(s * 0.38, 0.6, 0);
          wing.rotation.z = s * 0.22;
          g.add(wing);
          const foot = new THREE.Mesh(A.geo.pengFoot, A.mat.pengOrange);
          foot.position.set(s * 0.16, 0.04, 0.08);
          g.add(foot);
        }
        return { mesh: g, r: 0.6 };
      }
      default: {                                         // 'rock' — small pebble
        const m = new THREE.Mesh(A.geo.rock, A.mat.rock);
        m.castShadow = true;
        return { mesh: m, r: 1.0 };
      }
    }
  }

  /** Scatter this level's destructible props near the road: MOST sit inside
   *  the fences on the drivable surface (|lateral| 3.5–8.5) so racing actually
   *  smashes them; the rest dress the trackside (|lateral| 10.5–22, hugging
   *  the cliff base on canyon). Keeps clear of the start, ramps, boost pads
   *  and rock obstacles. */
  _buildProps() {
    const themeKey = PROP_SPECS[this.level && this.level.theme] ? this.level.theme : 'forest';
    const usedI = [];
    const spotFor = (shoulder) => {
      for (let tries = 0; tries < 40; tries++) {
        const i = (Math.random() * N) | 0;
        if (this._circDist(i, 0) < 30) continue;                                  // start grid + gate
        if (this._nearGorge(i, 40)) continue;                                     // the bridge span
        if (this.ramps.some((r) => this._circDist(i, r.index) < 36)) continue;    // 20 + ramp len
        if (this.boostPads.some((p) => this._circDist(i, p.index) < 20)) continue;
        if (this._obstacleIdx.some((o) => this._circDist(i, o) < 20)) continue;
        if (usedI.some((u) => this._circDist(i, u) < 4)) continue;                // no piles
        if (shoulder && this._nearNarrow(i, 6)) continue; // ---- width-variation: keep the pinch lane clear
        const side = Math.random() < 0.5 ? -1 : 1;
        const lateral = shoulder
          ? side * (3.5 + Math.random() * 5)           // in the drivable lane
          : this.T.cliffWalls
            ? side * (10.5 + Math.random() * 0.8)      // hug the canyon walls
            : side * (10.5 + Math.random() * 11.5);
        usedI.push(i);
        const p = this.pointAt(i, lateral);
        // shoulder props sit on the road surface; trackside ones on the terrain
        const y = Math.abs(lateral) <= 9.5 ? p.y : this.terrainHeight(p.x, p.z);
        return { x: p.x, y, z: p.z };
      }
      return null;
    };
    for (const [type, count] of PROP_SPECS[themeKey]) {
      // ~25% of crates carry a random pickup (always at least one per level)
      let pickupSet = null;
      if (type === 'crate') {
        pickupSet = new Set();
        const order = Array.from({ length: count }, (_, k) => k);
        for (let k = order.length - 1; k > 0; k--) {
          const j = (Math.random() * (k + 1)) | 0;
          [order[k], order[j]] = [order[j], order[k]];
        }
        for (let k = 0; k < Math.max(1, Math.round(count * 0.25)); k++) pickupSet.add(order[k]);
      }
      for (let k = 0; k < count; k++) {
        const spot = spotFor(Math.random() < 0.62);
        if (!spot) continue;
        const { mesh, r } = this._makeProp(type);
        mesh.position.set(spot.x, spot.y, spot.z);
        mesh.rotation.y = Math.random() * Math.PI * 2;
        const s = 0.9 + Math.random() * 0.25;
        mesh.scale.setScalar(s);
        this.group.add(mesh);
        this._addShadow(spot.x, spot.z, r * s * 1.2, spot.y);
        this.props.push({
          mesh, x: spot.x, y: spot.y, z: spot.z, r: r * s, type,
          scoreValue: PROP_SCORE[type],
          pickup: pickupSet && pickupSet.has(k)
            ? PROP_PICKUPS[(Math.random() * PROP_PICKUPS.length) | 0]
            : null,
        });
      }
    }
    // placement is randomized — make absolutely sure a pickup crate survived
    if (!this.props.some((p) => p.type === 'crate' && p.pickup)) {
      const c = this.props.find((p) => p.type === 'crate');
      if (c) c.pickup = PROP_PICKUPS[(Math.random() * PROP_PICKUPS.length) | 0];
    }
  }

  /** Fell tree `tr`: hide its instanced parts and hand back a one-off
   *  stand-in mesh the game can send flying. Returns null if already dead.
   *  The stand-in is rebuilt from the tree's OWN instanced part geometry and
   *  per-instance tint, so a felled cactus flies away as a cactus, a snag as
   *  a snag, a palm as a palm — never as a generic pine. */
  smashTree(tr) {
    if (tr.dead) return null;
    tr.dead = true;
    const g = new THREE.Group();
    const tint = new THREE.Color();
    for (const part of tr.parts) {
      // capture the per-instance color BEFORE zeroing the instance out
      if (part.instanceColor) part.getColorAt(tr.id, tint);
      else tint.setScalar(1);
      const src = part.material;
      const m = new THREE.Mesh(part.geometry, new THREE.MeshStandardMaterial({
        color: (src.color ? src.color.clone() : new THREE.Color(1, 1, 1)).multiply(tint),
        map: src.map ?? null,
        flatShading: !!src.flatShading,
        roughness: src.roughness ?? 1,
      }));
      m.castShadow = true;
      g.add(m);
      _m4.makeScale(0, 0, 0);
      part.setMatrixAt(tr.id, _m4);
      part.instanceMatrix.needsUpdate = true;
    }
    g.position.set(tr.x, tr.y ?? this.terrainHeight(tr.x, tr.z), tr.z);
    g.scale.setScalar(tr.s ?? 1);
    return g;
  }

  // ---------- environment ----------
  _buildEnvironment() {
    this._buildTerrain();
    this._buildSky();
    const m4 = new THREE.Matrix4();
    this._buildHorizon(m4);
    this._buildForest(m4);
    this._buildGroundCover(m4);
    this._buildHuts(m4);
    this._buildTrackside(m4);
    this._buildBanners();
    this._buildGrandstand();
    if (this.T.outcrops) this._buildOutcrops(m4);    // mesas + hoodoos beyond the canyon
    if (this.T.bridgeCount) this._buildBridges();
    if (this.T.oasis) {
      // oasisCount ponds (OASIS AMBUSH scatters three; canyon keeps its one)
      for (let k = 0, n = this.T.oasisCount || 1; k < n; k++) this._buildOasis();
    }
    if (this._river) this._buildRiver();             // the one world-spanning waterway
    if (this.T.riverCount) this._buildRivers();      // jungle streams under the road
    if (this.T.hollowArch) this._buildHollowArch();  // redwood drive-through trunk
    if (this.T.lamps) this._buildLamps();            // neon / undercity road lamps
    if (this.T.logYards) this._buildLogYards();      // flume timber stacks
    if (this.T.retainingWalls) this._buildRetainingWalls();   // alpine-pass parapets
    if (this.T.heroBridge) this._buildHeroBridge();           // hero rope crossing
    if (this.T.guardFence) this._buildGuardFence();           // breakable mountain rail fence
    if (this.T.roadCabins) this._buildRoadCabins();           // log cabins on the shelves
    if (this.T.snowPatches) this._buildSnowPatches(m4);       // old snow at altitude
    this._buildWorldElements(m4);                    // farms, chapels, fences, dressing
    this._buildPastures();                           // grazing spots for the animal system
    this._buildCrossroads();                         // dirt side-road junctions (rural worlds)
    this._buildRoadsideDetail(m4);                   // corner markers + gravel
    this._buildContactShadows();                     // baked AO under everything
  }

  /** ALPINE PASSES: dry-stone retaining parapets. A pass is built as a shelf
   *  cut into the face — every edge that falls away is held up by masonry, and
   *  the outside of every hairpin is walled. Instanced blocks with one small
   *  SOLID collider each, sitting far enough out (T.retainingWalls.lateral)
   *  that they never eat into the racing line: you only meet the stone if you
   *  have already left the road. */
  _buildRetainingWalls() {
    const S = this.T.retainingWalls;
    const LAT = S.lateral, H = S.height, MAX = S.max || 380;
    const geo = new THREE.BoxGeometry(3.4, H, 0.9);
    geo.translate(0, H / 2, 0);
    const mesh = new THREE.InstancedMesh(
      geo,
      new THREE.MeshStandardMaterial({
        map: stoneTexture(), roughness: 1, envMapIntensity: 0.4, vertexColors: false,
      }),
      MAX
    );
    mesh.castShadow = mesh.receiveShadow = true;
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0), col = new THREE.Color();
    let k = 0;
    for (let i = 0; i < N && k < MAX; i++) {
      if (this._circDist(i, 0) < 26) continue;              // keep the start gate clear
      const tight = this.curvature[i] > 0.028;
      // outside of the corner (the hairpin's exposed edge)
      const a = this.tan[i], b = this.tan[(i + 12) % N];
      const outside = (a.x * b.z - a.z * b.x) > 0 ? -1 : 1;
      for (const side of [1, -1]) {
        if (k >= MAX) break;
        const p = this.pointAt(i, LAT * side);
        // A fixed lateral offset is measured along ONE sample's normal, and on
        // the inside of a hairpin that lands well inside the road proper. On
        // GOTTHARD and TREMOLA the wall was sitting 5.7 u from the centreline —
        // over 3 u inside your own lane, as an 85-hull stone. Skip any block
        // that cannot clear the carriageway.
        if (!this._clearsRoad(p.x, p.z, 1.2, 1.0)) continue;
        const ground = this._terrainMeshHeight(p.x, p.z);
        // wall it where the shelf falls away, and always around tight bends
        if (p.y - ground < S.drop && !(tight && side === outside)) continue;
        q.setFromAxisAngle(up, this.headingAt(i));
        m4.compose(new THREE.Vector3(p.x, p.y - 0.55, p.z), q, new THREE.Vector3(1, 1, 1));
        mesh.setMatrixAt(k, m4);
        col.setScalar(0.86 + Math.random() * 0.28);
        mesh.setColorAt(k++, col);
        this.solids.push({ x: p.x, z: p.z, r: 1.2, y: p.y, mat: 'stone' });
      }
    }
    mesh.count = k;
    mesh.name = 'retaining-wall';
    if (k) this.group.add(mesh);
  }

  /** How many samples the bridge deck covers each way from the gorge centre. */
  _spanSamples() {
    return Math.ceil((this._gorge.spanU + 3.5) / this.segLen);
  }

  /** HERO CROSSING: a rope suspension bridge over the red-rock river gorge.
   *  Plank deck laid on the road, chunky timber towers at both ends, hemp main
   *  cables sagging in a catenary between them, vertical hangers down to rope
   *  railings along both edges — and a CHECKPOINT gate arch on the far bank
   *  with a log pile and fallen timber beside it. Collision comes only from
   *  the four tower posts and the two gate posts; the deck is just road. */
  _buildHeroBridge() {
    const G = this._gorge;
    if (!G) return;
    const span = this._spanSamples();
    const i0 = (G.i - span + N) % N, i1 = (G.i + span) % N;
    const deckW = WALL_OFF + 0.6;
    const wood = new THREE.MeshStandardMaterial({ color: 0x5a3a22, roughness: 0.95 });
    const darkWood = new THREE.MeshStandardMaterial({ color: 0x3e2716, roughness: 1 });
    const rope = new THREE.MeshStandardMaterial({ color: 0xc7a271, roughness: 1 });
    const g = new THREE.Group();

    // --- plank deck: individual timber baulks laid across the roadway ---
    // (discrete boxes, not one flat ribbon — a ribbon laid a few centimetres
    // over the road ribbon z-fights into black bands at grazing angles)
    {
      const rows = span * 2;
      const plankGeo = new THREE.BoxGeometry(deckW * 2, 0.22, 1.15);
      const tex = plankTexture();
      tex.anisotropy = 8;
      const planks = new THREE.InstancedMesh(
        plankGeo,
        new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 }),
        rows * 3
      );
      planks.name = 'bridge-deck';
      planks.receiveShadow = planks.castShadow = true;
      const m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
      const up = new THREE.Vector3(0, 1, 0), col = new THREE.Color();
      let k = 0;
      const step = 1.5 / this.segLen;                 // a baulk every ~1.5u
      for (let f = 0; f <= rows; f += step) {
        const j = (i0 + Math.round(f) + N) % N;
        const c = this.center[j];
        q.setFromAxisAngle(up, this.headingAt(j));
        m4.compose(new THREE.Vector3(c.x, c.y - 0.02, c.z), q, new THREE.Vector3(1, 1, 1));
        planks.setMatrixAt(k, m4);
        col.setScalar(0.86 + Math.random() * 0.28);
        planks.setColorAt(k++, col);
        if (k >= rows * 3) break;
      }
      planks.count = k;
      g.add(planks);
    }

    // --- towers at both ends ---
    const towerH = 7.4;
    const towerTop = [];
    for (const end of [i0, i1]) {
      const c = this.center[end], n = this.nrm[end];
      const pair = [];
      for (const side of [1, -1]) {
        const px = c.x + n.x * (deckW - 0.5) * side, pz = c.z + n.z * (deckW - 0.5) * side;
        const post = new THREE.Mesh(new THREE.BoxGeometry(1.5, towerH, 1.5), darkWood);
        post.position.set(px, c.y + towerH / 2 - 0.4, pz);
        post.rotation.y = this.headingAt(end);
        post.castShadow = true;
        g.add(post);
        pair.push(new THREE.Vector3(px, c.y + towerH - 0.6, pz));
        this.solids.push({ x: px, z: pz, r: 1.5, y: c.y + 1, mat: 'hut' });
        this._addShadow(px, pz, 2.4, c.y);
      }
      // cross beam over the roadway
      const beam = new THREE.Mesh(
        new THREE.BoxGeometry((deckW - 0.5) * 2 + 1.5, 0.7, 0.9), darkWood);
      beam.position.set(c.x, c.y + towerH - 0.9, c.z);
      beam.rotation.y = this.headingAt(end) + Math.PI / 2;
      beam.castShadow = true;
      g.add(beam);
      towerTop.push(pair);
    }

    // --- main cables (catenary) + hangers + rope railings ---
    const SEG = 22;
    for (let s = 0; s < 2; s++) {
      const side = s === 0 ? 1 : -1;
      const cable = [], railTop = [], railMid = [];
      for (let k = 0; k <= SEG; k++) {
        const t = k / SEG;
        const j = (i0 + Math.round(t * span * 2)) % N;
        const c = this.center[j], n = this.nrm[j];
        const x = c.x + n.x * (deckW - 0.5) * side, z = c.z + n.z * (deckW - 0.5) * side;
        // catenary: full tower height at the ends, sagging near the deck mid-span
        const sag = Math.cosh((t - 0.5) * 3.4) / Math.cosh(1.7);
        const y = c.y + 1.5 + (towerH - 2.1) * sag;
        cable.push(new THREE.Vector3(x, y, z));
        const dip = 0.55 * Math.sin(t * Math.PI);      // rope rails dip slightly
        railTop.push(new THREE.Vector3(x, c.y + 1.25 - dip * 0.35, z));
        railMid.push(new THREE.Vector3(x, c.y + 0.62 - dip * 0.3, z));
      }
      const tube = (pts, r, seg, mat) => {
        const m = new THREE.Mesh(
          new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), seg, r, 5, false), mat);
        m.castShadow = true;
        g.add(m);
      };
      tube(cable, 0.22, 30, rope);
      tube(railTop, 0.11, 26, rope);
      tube(railMid, 0.09, 26, rope);
      // vertical hangers from the cable down to the rail
      for (let k = 2; k < SEG - 1; k += 2) {
        const a = cable[k], b = railTop[k];
        const hang = new THREE.Mesh(new THREE.BoxGeometry(0.11, a.y - b.y, 0.11), rope);
        hang.position.set(a.x, (a.y + b.y) / 2, a.z);
        g.add(hang);
      }
      // deck-edge kerb rail the hangers land on
      for (let k = 0; k < SEG; k += 1) {
        const a = railMid[k], b = railMid[k + 1];
        if (!b) break;
        const len = a.distanceTo(b);
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.35, 0.16), wood);
        post.position.set(a.x, a.y - 0.35, a.z);
        g.add(post);
        if (len <= 0) break;
      }
    }
    this.group.add(g);

    // --- CHECKPOINT gate arch on the far bank ---
    const gi = (i1 + Math.round(11 / this.segLen)) % N;
    {
      const c = this.center[gi], n = this.nrm[gi];
      const arch = new THREE.Group();
      for (const side of [1, -1]) {
        const px = c.x + n.x * (deckW + 0.9) * side, pz = c.z + n.z * (deckW + 0.9) * side;
        const post = new THREE.Mesh(new THREE.BoxGeometry(1.3, 8.6, 1.3), darkWood);
        post.position.set(px, c.y + 4.3, pz);
        post.rotation.y = this.headingAt(gi);
        post.castShadow = true;
        arch.add(post);
        this.solids.push({ x: px, z: pz, r: 1.3, y: c.y + 1, mat: 'hut' });
        this._addShadow(px, pz, 2.2, c.y);
      }
      const w = (deckW + 0.9) * 2 + 1.3;
      const beam = new THREE.Mesh(new THREE.BoxGeometry(w, 1.0, 1.0), darkWood);
      beam.position.set(c.x, c.y + 8.1, c.z);
      beam.rotation.y = this.headingAt(gi) + Math.PI / 2;
      beam.castShadow = true;
      arch.add(beam);
      // plank sign reading CHECKPOINT, visible from both approaches
      const signTex = bannerTexture('CHECKPOINT', '#3a2414', '#f0cf94');
      for (const flip of [0, Math.PI]) {
        const sign = new THREE.Mesh(
          new THREE.PlaneGeometry(w * 0.62, 2.2),
          new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.9 }));
        sign.position.set(c.x, c.y + 6.6, c.z);
        sign.rotation.y = this.headingAt(gi) + Math.PI / 2 + flip;
        sign.translateZ(0.56);
        arch.add(sign);
      }
      const cap = new THREE.Mesh(new THREE.BoxGeometry(w * 0.66, 0.34, 1.6), wood);
      cap.position.set(c.x, c.y + 8.75, c.z);
      cap.rotation.y = this.headingAt(gi) + Math.PI / 2;
      arch.add(cap);
      this.group.add(arch);
    }

    // --- log pile + fallen timber on the far bank ---
    {
      const K = ELEMENT_KITS[this.T.elements || 'alpine'];
      const B = { wall: [], box: [], cyl: [], cone: [], prism: [] };
      const c = this.center[(gi + Math.round(16 / this.segLen)) % N], n = this.nrm[gi];
      for (const [off, side] of [[15, 1], [19, -1]]) {
        const px = c.x + n.x * off * side, pz = c.z + n.z * off * side;
        if (!this._buildableSpot(px, pz, 4, 3.2)) continue;
        this._element(B, 'logpile', px, pz, this.headingAt(gi) + (Math.random() - 0.5), K);
      }
      if (B.cyl.length) this._realizeElements(B, new THREE.Matrix4());
      // a couple of loose fallen logs
      const logGeo = new THREE.CylinderGeometry(0.55, 0.62, 6.5, 8);
      logGeo.rotateZ(Math.PI / 2);
      for (let k = 0; k < 3; k++) {
        const off = (13 + Math.random() * 9) * (k % 2 ? 1 : -1);
        const px = c.x + n.x * off, pz = c.z + n.z * off;
        const log = new THREE.Mesh(logGeo, wood);
        log.position.set(px, this.terrainHeight(px, pz) + 0.5, pz);
        log.rotation.y = Math.random() * Math.PI;
        log.castShadow = true;
        this.group.add(log);
        this._addShadow(px, pz, 3.4);
      }
    }

    this._buildGorgeRiver();
  }

  /** The pale turquoise river winding along the bottom of the hero gorge. */
  _buildGorgeRiver() {
    const G = this._gorge;
    const SEG = 26, HALF = 7.5;
    const verts = new Float32Array((SEG + 1) * 2 * 3);
    const uvs = new Float32Array((SEG + 1) * 2 * 2);
    const idx = [];
    for (let k = 0; k <= SEG; k++) {
      const t = (k / SEG - 0.5) * 2 * G.len;
      // the channel meanders a little as it runs down the gorge
      const wob = Math.sin(t * 0.035) * 4.5 + Math.sin(t * 0.011 + 1.3) * 3;
      const x = G.x + G.ax * t + G.vx * wob;
      const z = G.z + G.az * t + G.vz * wob;
      const y = G.floorY + 0.55 + Math.abs(t) * 0.02;
      const o = k * 6;
      verts[o] = x + G.vx * HALF; verts[o + 1] = y; verts[o + 2] = z + G.vz * HALF;
      verts[o + 3] = x - G.vx * HALF; verts[o + 4] = y; verts[o + 5] = z - G.vz * HALF;
      uvs[k * 4] = 0; uvs[k * 4 + 1] = t / 26;
      uvs[k * 4 + 2] = 1; uvs[k * 4 + 3] = t / 26;
    }
    for (let k = 0; k < SEG; k++) {
      const a = k * 2, b = a + 1, c = a + 2, d = a + 3;
      idx.push(a, b, c, b, d, c);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    const tex = riverTexture();
    tex.wrapT = THREE.RepeatWrapping;
    const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
      map: tex, roughness: 0.25, metalness: 0.05,
      color: 0x9fe4e0,                                  // pale glacial turquoise
      envMapIntensity: 1.2, transparent: true, opacity: 0.94,
    }));
    mesh.name = 'gorge-river';
    this.group.add(mesh);
  }

  /** FURKA RIDGE: the reddish wooden guard fence that runs the DOWNHILL edge
   *  of a mountain pass — posts and two rails, following the road all the way
   *  down the serpentine, with gaps through the hairpins.
   *
   *  It is BREAKABLE, never a wall: every bay is one instance of a single
   *  InstancedMesh (one draw call for the whole pass) plus an entry in the
   *  existing knockable-board array, so a car bursts through it at speed and
   *  missiles/blasts level it, exactly like a sponsor board. `smashBanner`
   *  below zeroes the instance and hands back a loose bay to fling. */
  _buildGuardFence() {
    const S = this.T.guardFence;
    const LAT = S.lateral, MAX = S.max || 190;
    const geo = mergeBoxes([
      { w: 0.24, h: 1.5, d: 0.24, x: -2.5, y: 0.75, z: 0 },
      { w: 0.24, h: 1.5, d: 0.24, x: 2.5, y: 0.75, z: 0 },
      { w: 5.4, h: 0.2, d: 0.14, x: 0, y: 1.28, z: 0 },
      { w: 5.4, h: 0.2, d: 0.14, x: 0, y: 0.78, z: 0 },
    ]);
    const mat = new THREE.MeshStandardMaterial({ color: S.color, roughness: 0.95 });
    const mesh = new THREE.InstancedMesh(geo, mat, MAX);
    mesh.castShadow = true;
    mesh.name = 'guard-fence';
    this._guardFenceMesh = mesh;
    this._guardFenceGeo = geo;
    this._guardFenceMat = mat;
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    const step = Math.max(2, Math.round(5.6 / this.segLen));   // one bay ≈ 5.6u
    let k = 0;
    for (let i = 0; i < N && k < MAX; i += step) {
      if (this._circDist(i, 0) < 30) continue;                 // clear of the gate
      if (this._nearGorge(i, 42)) continue;                    // the bridge has its own rails
      if (this.curvature[i] > 0.045) continue;                 // gap through hairpins
      // downhill side: the edge that falls away
      let side = 0, drop = 0;
      for (const sd of [1, -1]) {
        const p = this.pointAt(i, LAT * sd);
        const d = p.y - this._terrainMeshHeight(p.x, p.z);
        if (d > drop) { drop = d; side = sd; }
      }
      if (!side || drop < 1.4) continue;
      const p = this.pointAt(i, LAT * side);
      q.setFromAxisAngle(up, this.headingAt(i));
      m4.compose(new THREE.Vector3(p.x, p.y - 0.35, p.z), q, new THREE.Vector3(1, 1, 1));
      mesh.setMatrixAt(k, m4);
      this.banners.push({
        x: p.x, z: p.z, y: p.y - 0.35, r: 1.2, dead: false,
        kind: 'fence', id: k, heading: this.headingAt(i),
      });
      k++;
    }
    mesh.count = k;
    if (k) this.group.add(mesh);
  }

  /** Log cabins standing on the shelves right beside the pass, the way real
   *  mountain huts do. Uses the world-element archetypes so they are SOLID
   *  'hut' colliders with plank-burst crashes like every other building. */
  _buildRoadCabins() {
    const K = ELEMENT_KITS[this.T.elements || 'alpine'];
    const B = { wall: [], box: [], cyl: [], cone: [], prism: [] };
    let placed = 0;
    for (let tries = 0; tries < 220 && placed < this.T.roadCabins; tries++) {
      const i = (Math.random() * N) | 0;
      if (this._circDist(i, 0) < 40) continue;
      const side = Math.random() < 0.5 ? 1 : -1;
      const p = this.pointAt(i, side * (20 + Math.random() * 14));
      if (!this._buildableSpot(p.x, p.z, 7, 2.4)) continue;
      // face the road
      const rot = this.headingAt(i) + (side > 0 ? -Math.PI / 2 : Math.PI / 2);
      this._element(B, Math.random() < 0.7 ? 'house' : 'shed', p.x, p.z, rot, K);
      placed++;
    }
    if (placed) this._realizeElements(B, new THREE.Matrix4());
  }

  /** Old snow lying in the hollows above `minY`: flat white decals conformed
   *  to the ground, one instanced draw call. Pure decoration. */
  _buildSnowPatches(m4) {
    const S = this.T.snowPatches;
    const geo = new THREE.CircleGeometry(1, 9);
    geo.rotateX(-Math.PI / 2);
    const mesh = new THREE.InstancedMesh(
      geo,
      new THREE.MeshStandardMaterial({
        color: 0xd8e2ea, roughness: 1, polygonOffset: true,
        polygonOffsetFactor: -1, polygonOffsetUnits: -1,
      }),
      S.count
    );
    const q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
    const nrm = new THREE.Vector3();
    let k = 0;
    this._scatter(S.count, () => {
      const p = Math.random() < 0.5
        ? this._trackSidePos(20, 70)
        : (() => {
            const a = Math.random() * Math.PI * 2, r = 70 + Math.random() * 420;
            const x = Math.cos(a) * r, z = Math.sin(a) * r;
            return this._distToTrack(x, z) < 20 ? null : { x, z };
          })();
      if (!p) return null;
      return this.terrainHeight(p.x, p.z) >= S.minY ? p : null;
    }, (p) => {
      const r = 2.2 + Math.random() * 5.5;
      const y = this.terrainHeight(p.x, p.z);
      const e = r * 0.7;
      const hx = this.terrainHeight(p.x + e, p.z) - this.terrainHeight(p.x - e, p.z);
      const hz = this.terrainHeight(p.x, p.z + e) - this.terrainHeight(p.x, p.z - e);
      nrm.set(-hx / (2 * e), 1, -hz / (2 * e)).normalize();
      q.setFromUnitVectors(up, nrm);
      m4.compose(new THREE.Vector3(p.x, y + 0.09, p.z), q,
        new THREE.Vector3(r, 1, r * (0.6 + Math.random() * 0.7)));
      mesh.setMatrixAt(k++, m4);
    });
    mesh.count = k;
    mesh.name = 'snow-patches';
    if (k) this.group.add(mesh);
  }

  /** A near massif: the mountain the pass actually climbs into. A fan of big
   *  rock peaks standing a few hundred units beyond the summit, so from the
   *  valley the road visibly disappears into a wall of mountain instead of a
   *  flat green horizon. SOLID (free roamers can reach them). */
  _buildMassif(m4) {
    const M = this.T.massif;
    const rock = new THREE.InstancedMesh(
      new THREE.ConeGeometry(1, 1, 6),
      new THREE.MeshStandardMaterial({
        map: this._horizonGrad(this.T.peakColor, 0.34, 0.04), flatShading: true, roughness: 1,
      }),
      M.count
    );
    const q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
    for (let k = 0; k < M.count; k++) {
      const t = M.count > 1 ? k / (M.count - 1) : 0.5;
      const a = M.az + (t - 0.5) * M.spread + (Math.random() - 0.5) * 0.1;
      const r = M.r0 + Math.random() * (M.r1 - M.r0);
      const h = M.h0 + Math.random() * (M.h1 - M.h0);
      const w = M.w0 + Math.random() * (M.w1 - M.w0);
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      q.setFromAxisAngle(up, Math.random() * Math.PI);
      const y = -12 - (this.T.hillDrop || 0) + this._highland(x, z);
      m4.compose(new THREE.Vector3(x, y + h / 2, z), q, new THREE.Vector3(w, h, w * 0.85));
      rock.setMatrixAt(k, m4);
      this.solids.push({ x, z, r: w * 0.3, y: y + 4, mat: 'stone' });
    }
    rock.name = 'massif';
    this.group.add(rock);
  }

  /** FURKA RIDGE: the Rhône glacier tongue spilling off the skyline — a
   *  stepped ice field of big pale slabs, well outside the drivable world. */
  _buildGlacier(m4) {
    const ice = new THREE.MeshStandardMaterial({
      color: 0xdff0fb, roughness: 0.55, flatShading: true, envMapIntensity: 0.7,
    });
    const geo = new THREE.BoxGeometry(1, 1, 1);
    geo.translate(0, 0.5, 0);
    const slabs = new THREE.InstancedMesh(geo, ice, 14);
    const q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
    const col = new THREE.Color();
    // the tongue pours down a north-west flank towards the road
    const a0 = -2.25;
    for (let k = 0; k < 14; k++) {
      const t = k / 13;
      const r = 560 + t * 320;
      const a = a0 + (t - 0.5) * 0.34 + (k % 2 ? 0.05 : -0.05);
      const w = 210 - t * 90, d = 130 - t * 40, h = 26 + t * 96;
      q.setFromAxisAngle(up, a + 1.2);
      const gx = Math.cos(a) * r, gz = Math.sin(a) * r;
      m4.compose(
        new THREE.Vector3(gx, -18 - (this.T.hillDrop || 0) + t * 4 + this._highland(gx, gz), gz),
        q, new THREE.Vector3(w, h, d)
      );
      slabs.setMatrixAt(k, m4);
      col.setRGB(0.86 + t * 0.12, 0.93 + t * 0.06, 1.0).multiplyScalar(0.92 + Math.random() * 0.14);
      slabs.setColorAt(k, col);
    }
    slabs.name = 'glacier';
    this.group.add(slabs);
  }

  /** Queue a baked contact shadow under an object. r is the DECAL radius in
   *  world units (≈1.3× the object footprint). Pass y for objects sitting on
   *  the road/cliff (quad stays flat there); omit it for terrain objects —
   *  the decal then samples terrainHeight and tilts to the local slope. */
  _addShadow(x, z, r, y = null) {
    this._shadows.push({ x, z, r, y });
  }

  /** One InstancedMesh of soft dark radial decals hugging the ground under
   *  every tree / big rock / hut / obstacle / prop — the cheapest possible
   *  fake ambient occlusion, and the thing that visually glues the props to
   *  the terrain. Build-time only; a single extra draw call per world. */
  _buildContactShadows() {
    const specs = this._shadows;
    if (!specs.length) return;
    const geo = new THREE.PlaneGeometry(2, 2);       // scale r → radius r
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({
      map: contactShadowTexture(), transparent: true, opacity: 0.4,
      depthWrite: false,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    });
    const mesh = new THREE.InstancedMesh(geo, mat, specs.length);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0), nrm = new THREE.Vector3();
    const pos = new THREE.Vector3(), scl = new THREE.Vector3();
    let k = 0;
    for (const s of specs) {
      let y = s.y;
      if (y === null) {
        y = this.terrainHeight(s.x, s.z);
        // conform to the local ground slope (finite differences, build-time)
        const e = Math.max(1.0, s.r * 0.6);
        const hx = this.terrainHeight(s.x + e, s.z) - this.terrainHeight(s.x - e, s.z);
        const hz = this.terrainHeight(s.x, s.z + e) - this.terrainHeight(s.x, s.z - e);
        nrm.set(-hx / (2 * e), 1, -hz / (2 * e)).normalize();
        q.setFromUnitVectors(up, nrm);
      } else {
        q.identity();
      }
      m4.compose(pos.set(s.x, y + 0.07, s.z), q, scl.set(s.r, 1, s.r));
      mesh.setMatrixAt(k++, m4);
    }
    mesh.renderOrder = 1;
    mesh.name = 'contact-shadows';
    this.group.add(mesh);
  }

  // ---------- world elements (farms, chapels, outposts, fences) ----------

  /** Is (x, z) flat enough (± `tol` over a `r` radius) to build on, and clear
   *  of everything already standing there? */
  _buildableSpot(x, z, r, tol = 2.2) {
    const h = this.terrainHeight(x, z);
    for (const [dx, dz] of [[r, 0], [-r, 0], [0, r], [0, -r],
      [r * 0.7, r * 0.7], [-r * 0.7, -r * 0.7], [r * 0.7, -r * 0.7], [-r * 0.7, r * 0.7]]) {
      if (Math.abs(this.terrainHeight(x + dx, z + dz) - h) > tol) return false;
    }
    for (const s of this.solids) {
      const dx = s.x - x, dz = s.z - z, rr = r + s.r + 2;
      if (dx * dx + dz * dz < rr * rr) return false;
    }
    for (const t of this.trees) {
      const dx = t.x - x, dz = t.z - z, rr = r + 2.5;
      if (dx * dx + dz * dz < rr * rr) return false;
    }
    return true;
  }

  /** One structure. Pushes its parts into the instancing buckets `B`, adds the
   *  SOLID collider + contact shadow, and returns its footprint radius. */
  _element(B, type, x, z, rot, K) {
    const y = this.terrainHeight(x, z) - 0.25;
    const cs = Math.cos(rot), sn = Math.sin(rot);
    const put = (kind, dx, dy, dz, sx, sy, sz, color, roll = 0) => {
      B[kind].push({
        x: x + dx * cs - dz * sn, y: y + dy, z: z + dx * sn + dz * cs,
        sx, sy, sz, rot, roll, color,
      });
    };
    let r = 4, mat = 'hut';
    switch (type) {
      case 'barn':
        put('wall', 0, 0, 0, 12, 6.0, 8.4, K.wall2);
        put('prism', 0, 6.0, 0, 12.8, 3.4, 9.1, K.roof);
        put('box', 0, 0.1, 4.3, 3.4, 4.6, 0.35, K.trim);           // big door
        put('box', 0, 4.9, 4.35, 1.6, 1.4, 0.3, K.trim);           // hay loft hatch
        put('box', -6.05, 0, 0, 0.4, 6.0, 8.4, K.trim);
        put('box', 6.05, 0, 0, 0.4, 6.0, 8.4, K.trim);
        r = 7.4;
        break;
      case 'house':
        put('wall', 0, 0, 0, 7.6, 5.0, 6.6, K.wall);
        put('prism', 0, 5.0, 0, 8.4, 2.9, 7.4, K.roof);
        put('box', 0, 0.1, 3.4, 1.5, 3.0, 0.3, K.trim);            // door
        put('box', 2.2, 2.6, 0, 0.3, 5.6, 0.9, K.trim, 0);         // corner post
        put('cyl', -2.2, 5.6, -1.6, 1.0, 2.6, 1.0, K.trim);        // chimney
        r = 5.0;
        break;
      case 'chapel':
        put('wall', 0, 0, 0, 5.6, 5.4, 8.0, K.wall);
        put('prism', 0, 5.4, 0, 6.2, 3.0, 8.6, K.roof);
        put('wall', 0, 0, -4.6, 3.6, 9.6, 3.6, K.wall);            // bell tower
        put('cone', 0, 9.6, -4.6, 4.6, 3.8, 4.6, K.roof);
        put('box', 0, 13.4, -4.6, 0.22, 1.6, 0.22, 0xf0e6c8);      // cross
        put('box', 0, 14.2, -4.6, 1.0, 0.22, 0.22, 0xf0e6c8);
        put('box', 0, 0.1, 4.1, 1.4, 3.0, 0.3, K.trim);
        r = 4.8;
        break;
      case 'shed':
        put('wall', 0, 0, 0, 5.2, 3.2, 4.2, K.wall2);
        put('box', 0, 3.2, 0.35, 5.8, 0.35, 4.9, K.roof);          // lean-to roof
        put('box', 0, 0.1, 2.2, 1.3, 2.4, 0.28, K.trim);
        r = 3.4;
        break;
      case 'adobe':
        put('wall', 0, 0, 0, 8.6, 4.2, 7.2, K.wall);
        put('box', 0, 4.2, 0, 9.1, 0.7, 7.7, K.wall);              // parapet
        put('box', 0, 0.1, 3.7, 1.5, 2.9, 0.3, K.trim);
        for (const d of [-2.2, 0, 2.2]) put('cyl', d, 3.6, 4.1, 0.35, 1.4, 0.35, K.trim, Math.PI / 2);
        r = 5.7;
        break;
      case 'watchtower':
        put('wall', 0, 0, 0, 3.6, 9.5, 3.6, K.wall2);
        put('box', 0, 9.5, 0, 5.4, 0.5, 5.4, K.trim);              // platform
        for (const [dx, dz] of [[-2.4, -2.4], [2.4, -2.4], [-2.4, 2.4], [2.4, 2.4]]) {
          put('box', dx, 10.0, dz, 0.28, 1.7, 0.28, K.trim);
        }
        put('cone', 0, 11.7, 0, 6.0, 2.2, 6.0, K.roof);
        r = 2.7;
        break;
      case 'stilt':
        for (const [dx, dz] of [[-2.4, -1.9], [2.4, -1.9], [-2.4, 1.9], [2.4, 1.9], [0, -1.9], [0, 1.9]]) {
          put('cyl', dx, 0, dz, 0.5, 3.0, 0.5, K.trim);
        }
        put('wall', 0, 3.0, 0, 6.2, 3.0, 5.2, K.wall);
        put('prism', 0, 6.0, 0, 7.2, 2.6, 6.2, K.roof);
        put('box', 1.2, 0, 3.4, 3.0, 0.25, 2.4, K.trim);           // ramp/deck
        r = 3.8;
        break;
      case 'kiosk':
        put('wall', 0, 0, 0, 4.4, 3.2, 3.4, K.wall);
        put('box', 0, 3.2, 0, 4.8, 0.4, 3.8, K.roof);
        put('box', 0, 2.0, 2.1, 4.8, 0.2, 1.6, K.trim);            // awning
        put('box', 0, 3.7, 0, 3.2, 1.1, 0.24, K.trim);             // sign board
        put('box', -1.7, 1.9, 1.75, 0.2, 0.2, 1.5, K.trim);
        r = 3.0;
        break;
      case 'signalhut':
        put('wall', 0, 0, 0, 4.6, 3.4, 4.2, K.wall);
        put('prism', 0, 3.4, 0, 5.2, 1.8, 4.8, K.roof);
        put('cyl', 1.9, 3.4, -1.7, 0.24, 6.4, 0.24, K.trim);       // antenna mast
        put('box', 1.9, 9.4, -1.7, 1.8, 0.16, 0.16, K.trim);
        put('box', 0, 0.1, 2.2, 1.2, 2.4, 0.28, K.trim);
        r = 3.2;
        break;
      case 'silo':
        put('cyl', 0, 0, 0, 4.4, 9.0, 4.4, K.wall);
        put('cone', 0, 9.0, 0, 4.9, 2.4, 4.9, K.roof);
        for (let b = 1; b <= 3; b++) put('cyl', 0, b * 2.2, 0, 4.6, 0.3, 4.6, K.trim);
        r = 2.4; mat = 'stone';
        break;
      case 'windmill':
        put('cyl', 0, 0, 0, 3.0, 8.4, 2.4, K.wall);
        put('cone', 0, 8.4, 0, 3.6, 1.8, 3.0, K.roof);
        put('cyl', 0, 7.6, 1.6, 0.7, 0.9, 0.7, K.trim, Math.PI / 2);
        for (let b = 0; b < 4; b++) {
          put('box', 0, 7.6, 2.0, 0.5, 7.0, 0.22, K.trim, b * Math.PI / 4 + 0.4);
        }
        r = 2.0; mat = 'stone';
        break;
      case 'well':
        put('cyl', 0, 0, 0, 3.2, 1.3, 3.2, K.stone);
        for (const d of [-1.3, 1.3]) put('box', d, 1.3, 0, 0.3, 2.4, 0.3, K.trim);
        put('prism', 0, 3.7, 0, 3.4, 0.9, 2.8, K.roof);
        put('cyl', 0, 3.5, 0, 0.28, 2.6, 0.28, K.trim, Math.PI / 2);
        r = 1.8; mat = 'stone';
        break;
      default: {                                                   // 'logpile'
        for (let t = 0; t < 3; t++) {
          const row = [[-1.1, 0, 1.1], [-0.55, 0.55], [0]][t];
          for (const off of row) put('cyl', 0, 0.55 + t * 0.95, off, 1.05, 4.6, 1.05, K.trim, Math.PI / 2);
        }
        r = 2.4; mat = 'stone';
        break;
      }
    }
    this.solids.push({ x, z, r, y: y + 0.6, mat });
    this._addShadow(x, z, r * 1.35);
    return r;
  }

  /** Everything the world is dressed with beyond the road: farmsteads and
   *  outposts (SOLID), field walls (SOLID stone), and BREAKABLE rail fences,
   *  troughs, feed bins and hay racks out in the fields. All the rigid parts
   *  land in five InstancedMeshes; the breakables become this.props entries so
   *  the existing smash/weapon paths handle them with no new systems. */
  _buildWorldElements(m4) {
    const kitName = this.T.elements
      || ELEMENT_KIT_BY_THEME[this.level && this.level.theme] || 'farm';
    const K = ELEMENT_KITS[kitName];
    if (!K) return;
    // breakable field dressing this kit uses (livestock gear by default)
    const FIELD = K.field ?? ['trough', 'feedbin', 'hayrack'];
    const B = { wall: [], box: [], cyl: [], cone: [], prism: [] };

    // --- pick 3 farmstead / outpost sites well off the racing line ---
    const sites = [];
    for (let s = 0; s < 3; s++) {
      for (let tries = 0; tries < 40; tries++) {
        const p = this._trackSidePos(34, 108);
        if (!p) continue;
        if (sites.some((q) => (q.x - p.x) ** 2 + (q.z - p.z) ** 2 < 90 * 90)) continue;
        if (!this._buildableSpot(p.x, p.z, 16, 2.6)) continue;
        sites.push({ x: p.x, z: p.z, rot: Math.random() * Math.PI * 2 });
        break;
      }
    }
    const pastures = [];
    for (const site of sites) {
      const cs = Math.cos(site.rot), sn = Math.sin(site.rot);
      const at = (dx, dz) => ({ x: site.x + dx * cs - dz * sn, z: site.z + dx * sn + dz * cs });
      // main building + two outbuildings around a yard
      const layout = [[0, 0, K.builds[0]], [-17, 9, K.builds[1 % K.builds.length]],
        [13, 13, K.builds[2 % K.builds.length]]];
      for (const [dx, dz, type] of layout) {
        const p = at(dx, dz);
        if (!this._buildableSpot(p.x, p.z, 8, 3.2)) continue;
        this._element(B, type, p.x, p.z, site.rot + (Math.random() - 0.5) * 0.7, K);
      }
      const dp = at(-4, 16);
      if (this._buildableSpot(dp.x, dp.z, 4, 3.0)) {
        this._element(B, K.dress[(Math.random() * K.dress.length) | 0], dp.x, dp.z,
          Math.random() * Math.PI * 2, K);
      }
      // paddock: a rail fence run along the open side, with the grazing ground
      // it encloses handed to the animal system as a pasture
      const pd = at(-6, 34);
      this._fenceRun(pd.x, pd.z, site.rot + Math.PI / 2, 6, K);
      if (this._buildableSpot(pd.x, pd.z, 12, 3.0)) pastures.push({ x: pd.x, z: pd.z, r: 13 });
      // trough / feed bin / hay rack in the paddock (kits without livestock —
      // the city — declare `field: []` and get none)
      const fp = at(-14, 30);
      if (FIELD.length) {
        this._fieldProp(fp.x, fp.z, Math.random() * Math.PI * 2,
          FIELD[(Math.random() * FIELD.length) | 0], K);
      }
    }

    // --- two landmarks somewhere else on the lap (chapel / silo / tower) ---
    for (const type of K.landmarks) {
      for (let tries = 0; tries < 30; tries++) {
        const p = this._trackSidePos(30, 130);
        if (!p || !this._buildableSpot(p.x, p.z, 9, 2.6)) continue;
        this._element(B, type, p.x, p.z, Math.random() * Math.PI * 2, K);
        break;
      }
    }

    // --- field walls: dry-stone boundaries running across open country ---
    for (let w = 0; w < (K.stoneWalls || 0); w++) {
      for (let tries = 0; tries < 24; tries++) {
        const p = this._trackSidePos(30, 130);
        if (!p || !this._buildableSpot(p.x, p.z, 8, 3.0)) continue;
        this._stoneWallRun(B, p.x, p.z, Math.random() * Math.PI * 2, 6 + ((Math.random() * 5) | 0), K);
        break;
      }
    }

    // --- standalone fence runs + field dressing out in the open ---
    for (let f = 0, nf = K.fenceRuns ?? 2; f < nf; f++) {
      const p = this._trackSidePos(26, 120);
      if (p && this._buildableSpot(p.x, p.z, 10, 3.2)) {
        this._fenceRun(p.x, p.z, Math.random() * Math.PI * 2, 5, K);
      }
    }
    for (let d = 0; d < 3 && FIELD.length; d++) {
      const p = this._trackSidePos(22, 110);
      if (p) {
        this._fieldProp(p.x, p.z, Math.random() * Math.PI * 2,
          FIELD[(Math.random() * FIELD.length) | 0], K);
      }
    }

    this._sitePastures = pastures;
    this._realizeElements(B, m4);
  }

  /** Turn the five part buckets into five InstancedMeshes (one draw call each
   *  for every building in the world). */
  _realizeElements(B, m4) {
    const gWall = new THREE.BoxGeometry(1, 1, 1); gWall.translate(0, 0.5, 0);
    const gBox = new THREE.BoxGeometry(1, 1, 1); gBox.translate(0, 0.5, 0);
    const gCyl = new THREE.CylinderGeometry(0.5, 0.5, 1, 10); gCyl.translate(0, 0.5, 0);
    const gCone = new THREE.ConeGeometry(0.5, 1, 10); gCone.translate(0, 0.5, 0);
    const specs = [
      ['wall', gWall, new THREE.MeshStandardMaterial({
        map: buildingTexture(), roughness: 0.85, envMapIntensity: 0.45,
      })],
      ['box', gBox, new THREE.MeshStandardMaterial({ roughness: 0.9, envMapIntensity: 0.4 })],
      ['cyl', gCyl, new THREE.MeshStandardMaterial({ roughness: 0.9, envMapIntensity: 0.4 })],
      ['cone', gCone, new THREE.MeshStandardMaterial({
        flatShading: true, roughness: 0.9, envMapIntensity: 0.4,
      })],
      ['prism', gablePrismGeo(), new THREE.MeshStandardMaterial({
        flatShading: true, roughness: 0.9, envMapIntensity: 0.4,
      })],
    ];
    const q = new THREE.Quaternion(), qr = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0), fwd = new THREE.Vector3(0, 0, 1);
    const col = new THREE.Color();
    for (const [key, geo, mat] of specs) {
      const list = B[key];
      if (!list.length) continue;
      const mesh = new THREE.InstancedMesh(geo, mat, list.length);
      mesh.name = 'element-' + key;
      mesh.castShadow = mesh.receiveShadow = true;
      list.forEach((p, k) => {
        q.setFromAxisAngle(up, p.rot);
        if (p.roll) q.multiply(qr.setFromAxisAngle(fwd, p.roll));
        m4.compose(new THREE.Vector3(p.x, p.y, p.z), q, new THREE.Vector3(p.sx, p.sy, p.sz));
        mesh.setMatrixAt(k, m4);
        col.set(p.color).multiplyScalar(0.92 + Math.random() * 0.16);
        mesh.setColorAt(k, col);
      });
      this.group.add(mesh);
    }
  }

  /** A dry-stone field wall: `n` instanced blocks in a line, each a small
   *  SOLID stone collider. Runs out in the fields, never along the road. */
  _stoneWallRun(B, x, z, rot, n, K) {
    const cs = Math.cos(rot), sn = Math.sin(rot);
    for (let k = 0; k < n; k++) {
      const d = (k - (n - 1) / 2) * 3.1;
      const wx = x + cs * d, wz = z + sn * d;
      const wy = this.terrainHeight(wx, wz) - 0.3;
      B.box.push({
        x: wx, y: wy, z: wz, sx: 3.2, sy: 1.15 + Math.random() * 0.3, sz: 0.85,
        rot: rot + Math.PI / 2, roll: 0, color: K.stone,
      });
      this.solids.push({ x: wx, z: wz, r: 1.3, y: wy + 0.6, mat: 'stone' });
    }
    this._addShadow(x, z, n * 1.7);
  }

  /** BREAKABLE wooden rail fence: `n` bays in a line, each its own prop entry
   *  (a car smashes through it, a missile blows it apart). Scenery only — it
   *  encloses fields and paddocks, it never lines the road. */
  _fenceRun(x, z, rot, n, K) {
    if (!this._fenceGeo) {
      this._fenceGeo = mergeBoxes([
        { w: 0.26, h: 1.6, d: 0.26, x: -2.0, y: 0.8, z: 0 },
        { w: 0.26, h: 1.6, d: 0.26, x: 2.0, y: 0.8, z: 0 },
        { w: 4.2, h: 0.18, d: 0.14, x: 0, y: 1.32, z: 0 },
        { w: 4.2, h: 0.18, d: 0.14, x: 0, y: 0.78, z: 0 },
      ]);
    }
    if (!this._fenceMat) {
      this._fenceMat = new THREE.MeshStandardMaterial({ color: K.fenceColor, roughness: 0.95 });
    }
    const cs = Math.cos(rot), sn = Math.sin(rot);
    for (let k = 0; k < n; k++) {
      const d = (k - (n - 1) / 2) * 4.2;
      const fx = x + cs * d, fz = z + sn * d;
      if (this._distToTrack(fx, fz) < 20) continue;          // never near the road
      const fy = this.terrainHeight(fx, fz) - 0.15;
      const mesh = new THREE.Mesh(this._fenceGeo, this._fenceMat);
      mesh.name = 'fence';
      mesh.position.set(fx, fy, fz);
      mesh.rotation.y = rot + Math.PI / 2;
      mesh.castShadow = true;
      this.group.add(mesh);
      this.props.push({
        mesh, x: fx, y: fy, z: fz, r: 2.1, type: 'fence', scoreValue: 30, pickup: null,
      });
      this._addShadow(fx, fz, 2.4);
    }
  }

  /** BREAKABLE farm dressing: water trough / feed bin / hay rack. One merged
   *  mesh each, registered as a prop. */
  _fieldProp(x, z, rot, type, K) {
    if (this._distToTrack(x, z) < 18) return;
    const cache = this._fieldGeos || (this._fieldGeos = {});
    if (!cache[type]) {
      cache[type] = type === 'trough'
        ? mergeBoxes([
            { w: 4.0, h: 0.25, d: 1.4, x: 0, y: 0.62, z: 0 },
            { w: 4.0, h: 0.7, d: 0.16, x: 0, y: 0.9, z: 0.62 },
            { w: 4.0, h: 0.7, d: 0.16, x: 0, y: 0.9, z: -0.62 },
            { w: 0.3, h: 0.6, d: 1.4, x: -1.7, y: 0.3, z: 0 },
            { w: 0.3, h: 0.6, d: 1.4, x: 1.7, y: 0.3, z: 0 },
          ])
        : type === 'feedbin'
          ? mergeBoxes([
              { w: 1.8, h: 1.7, d: 1.8, x: 0, y: 0.85, z: 0 },
              { w: 2.1, h: 0.22, d: 2.1, x: 0, y: 1.8, z: 0 },
              { w: 0.9, h: 0.5, d: 0.2, x: 0, y: 0.5, z: 0.9 },
            ])
          : mergeBoxes([                                       // hay rack
              { w: 0.24, h: 2.0, d: 0.24, x: -1.4, y: 1.0, z: -0.7 },
              { w: 0.24, h: 2.0, d: 0.24, x: 1.4, y: 1.0, z: -0.7 },
              { w: 0.24, h: 1.4, d: 0.24, x: -1.4, y: 0.7, z: 0.7 },
              { w: 0.24, h: 1.4, d: 0.24, x: 1.4, y: 0.7, z: 0.7 },
              { w: 3.0, h: 0.18, d: 1.7, x: 0, y: 1.5, z: 0 },
              { w: 3.0, h: 0.9, d: 0.16, x: 0, y: 1.0, z: -0.7 },
            ]);
    }
    if (!this._fieldMat) {
      this._fieldMat = new THREE.MeshStandardMaterial({ color: K.trim, roughness: 0.95 });
    }
    const y = this.terrainHeight(x, z) - 0.1;
    const mesh = new THREE.Mesh(cache[type], this._fieldMat);
    mesh.name = 'field-prop';
    mesh.position.set(x, y, z);
    mesh.rotation.y = rot;
    mesh.castShadow = true;
    this.group.add(mesh);
    this.props.push({
      mesh, x, y, z, r: type === 'trough' ? 2.2 : 1.5, type,
      scoreValue: 35, pickup: null,
    });
    this._addShadow(x, z, 2.4);
  }

  /** Decorative crossroads: short dirt side-roads that join the circuit at
   *  plausible angles (60-120°) and head off toward the farms, pastures and
   *  cabins the world is dressed with. They are TERRAIN, not track — drivable
   *  under the normal off-road rules, no colliders. Each junction gets a
   *  widened, radially-faded intersection patch over the road edge.
   *
   *  Data for the traffic agent — `track.crossroads` is an array of:
   *    index    main-road centerline sample at the junction (0..N-1)
   *    side     +1 / -1, which side of the road the spur leaves on
   *             (matches the `lateral` sign used by pointAt/nearestIndex)
   *    angle    radians between the spur and the road tangent, 0..PI
   *    len      graded length of the spur in world units (12..30)
   *    x, z     world position of the spur mouth (on the road edge)
   *    dx, dz   unit direction of the spur, pointing away from the road
   *    endX,endZ far end of the graded surface
   *    halfWidth lane half-width at the far end (the mouth flares to 5.4)
   *    y        road centerline height at the junction
   *  The first four are the canonical schema; the rest are derived
   *  conveniences (dx,dz === tan*cos(angle) + nrm*side*sin(angle)). */
  _buildCrossroads() {
    const want = Math.min(4,
      (this.T.crossroads ?? THEME_CROSSROADS[this.level && this.level.theme] ?? 0) | 0);
    if (!want) return;
    // spurs lead somewhere: pastures and farm buildings, nearest-road first
    const targets = [
      ...(this.pastures || []).map((p) => ({ x: p.x, z: p.z, r: p.r })),
      ...this.solids.filter((s) => s.mat === 'hut').map((s) => ({ x: s.x, z: s.z, r: s.r + 8 })),
    ];
    if (!targets.length) return;
    // one shared surface: the theme's own dirt palette, overlays stripped
    // (a spur is bare graded dirt whatever dresses the main carriageway)
    const spurTex = roadTexture({
      ...this.T.road, wet: null, snowCover: null, ice: null, cobbles: null, neon: null, ruts: true,
    });
    spurTex.anisotropy = 8;
    // RGBA vertex colours drive the feather: the ribbon used to be a blunt
    // rectangle that stopped dead in open grass (and from the default TOP-DOWN
    // camera that straight cut is the first thing you see). Alpha now runs to 0
    // along an outer skirt column on each side and over the last third of the
    // run, so the surface dissolves into the field instead of being cut off.
    const spurMat = new THREE.MeshStandardMaterial({
      map: spurTex, roughness: 1, vertexColors: true,
      transparent: true, depthWrite: false,
      polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3,
    });
    // junction + destination dressing, all instanced across every spur
    const dress = this._spurDressing(want);
    const patchMat = new THREE.MeshStandardMaterial({
      map: junctionTexture(this.T.road), roughness: 1, transparent: true,
      depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4,
    });
    const tmp = new THREE.Vector3();
    const MAXC = 0.5;                                  // cos 60° — junction angle cone
    const used = [];
    for (const tg of targets) {
      if (this.crossroads.length >= want) break;
      const i = this.nearestIndex(tmp.set(tg.x, 0, tg.z), null);
      if (this._circDist(i, 0) < 45) continue;               // clear of the gate
      if (this._gorge && this._nearGorge(i, this._spanSamples() + 14)) continue;
      if (used.some((u) => this._circDist(i, u) < 70)) continue;
      let mc = 0;
      for (let k = -6; k <= 6; k++) mc = Math.max(mc, this.curvature[(i + k + N) % N]);
      if (mc > 0.022) continue;                              // junctions live on straights
      const c = this.center[i], n = this.nrm[i], t = this.tan[i];
      const side = (tg.x - c.x) * n.x + (tg.z - c.z) * n.z >= 0 ? 1 : -1;
      // the approach must sit near road grade — no spurs off a shelf edge or
      // through a retaining wall / guard fence drop
      const e1 = this.pointAt(i, side * 15);
      if (Math.abs(c.y - this.terrainHeight(e1.x, e1.z)) > 2.2) continue;
      // direction toward the target, clamped into the 60-120° cone
      let dx = tg.x - c.x, dz = tg.z - c.z;
      const dl = Math.hypot(dx, dz) || 1;
      dx /= dl; dz /= dl;
      const along = dx * t.x + dz * t.z;
      let ux = dx, uz = dz;
      if (Math.abs(along) > MAXC) {
        const sa = Math.sign(along) || 1, sn2 = Math.sqrt(1 - MAXC * MAXC);
        ux = t.x * sa * MAXC + n.x * side * sn2;
        uz = t.z * sa * MAXC + n.z * side * sn2;
      }
      const len = Math.min(30, Math.max(12, dl - (tg.r || 10)));
      // never lay a spur (or its farmstead) into the river: the reach runs
      // parallel to the circuit at ~62 u, which is exactly the band the
      // pastures and huts these spurs aim at live in
      const mouth = this.pointAt(i, side * 8);
      if (this._river) {
        let wet = false;
        for (let f = 0; f <= len + 18 && !wet; f += 5) {
          if (this._riverDist(mouth.x + ux * f, mouth.z + uz * f) < 17) wet = true;
        }
        if (wet) continue;
      }
      // --- spur ribbon: starts under the road edge, conforms to the terrain ---
      const S = Math.max(4, Math.ceil(len / 3));
      const p0 = this.pointAt(i, side * 8);
      const y0 = c.y - 0.06;
      // Across the spur. This MUST match the handedness the road ribbon uses
      // (nrm = (tan.z, 0, -tan.x)) — the triangle winding below is copied from
      // _buildRoad, so flipping this normal flips the face. It was `(-uz, ux)`,
      // which made computeVertexNormals emit ny = -1: every spur was built
      // upside-down and back-face-culled away, invisible from the car and from
      // straight above even though the mesh sat correctly on the terrain.
      const px = uz, pz = -ux;
      // FOUR columns per row, not two: an outer skirt at alpha 0 on each side
      // feathers the spur into the grass, and the far end tapers AND fades.
      const COLS = 4;
      const verts = new Float32Array((S + 1) * COLS * 3);
      const uvs = new Float32Array((S + 1) * COLS * 2);
      const cols = new Float32Array((S + 1) * COLS * 4);
      const idx = [];
      const base = new THREE.Color(1, 1, 1);
      for (let s = 0; s <= S; s++) {
        const f = s / S;
        // junction flare → lane → nothing: the last third narrows to a track
        const half = (5.4 - 2.0 * f) * (1 - 0.62 * THREE.MathUtils.smoothstep(f, 0.55, 1));
        const feather = 1.1 + 0.9 * (1 - f);
        const qx = p0.x + ux * f * len, qz = p0.z + uz * f * len;
        const blend = THREE.MathUtils.smoothstep(f, 0, 0.4);
        // opaque up the graded run, gone by the end
        const aLong = 1 - THREE.MathUtils.smoothstep(f, 0.62, 1);
        for (let cI = 0; cI < COLS; cI++) {
          // columns: outer-left, left, right, outer-right
          const sl = cI < 2 ? 1 : -1;
          const outer = (cI === 0 || cI === 3);
          const off = half + (outer ? feather : 0);
          const vx = qx + px * off * sl, vz = qz + pz * off * sl;
          const ty = this._terrainMeshHeight(vx, vz) + (outer ? 0.13 : 0.22);
          const o = (s * COLS + cI) * 3;
          verts[o] = vx;
          verts[o + 1] = y0 * (1 - blend) + ty * blend;
          verts[o + 2] = vz;
          const u = (s * COLS + cI) * 2;
          uvs[u] = outer ? (sl > 0 ? -0.12 : 1.12) : (sl > 0 ? 0 : 1);
          uvs[u + 1] = (f * len) / 10;
          const cq = (s * COLS + cI) * 4;
          cols[cq] = base.r; cols[cq + 1] = base.g; cols[cq + 2] = base.b;
          cols[cq + 3] = aLong * (outer ? 0 : 1);
        }
      }
      for (let s = 0; s < S; s++) {
        for (let cI = 0; cI < COLS - 1; cI++) {
          const a = s * COLS + cI, b = a + 1;
          const d = (s + 1) * COLS + cI, e = d + 1;
          idx.push(a, b, d, b, e, d);
        }
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
      geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
      geo.setAttribute('color', new THREE.BufferAttribute(cols, 4));
      geo.setIndex(idx);
      geo.computeVertexNormals();
      const spur = new THREE.Mesh(geo, spurMat);
      spur.name = 'crossroad-spur';
      spur.receiveShadow = true;
      this.group.add(spur);
      // --- widened intersection patch straddling the road edge ---
      const pc = this.pointAt(i, side * 9.5);
      const patch = new THREE.Mesh(this._patchGeo || (this._patchGeo = (() => {
        const pg = new THREE.PlaneGeometry(17, 17);
        pg.rotateX(-Math.PI / 2);
        return pg;
      })()), patchMat);
      patch.name = 'crossroad-patch';
      patch.position.set(pc.x, c.y + 0.05, pc.z);
      patch.rotation.y = Math.atan2(ux, uz);
      patch.renderOrder = 2;
      patch.receiveShadow = true;
      this.group.add(patch);
      used.push(i);
      dress.place(p0, ux, uz, px, pz, len, c.y, tg);
      // Traffic-agent contract (see the doc comment above): the four required
      // fields plus a ready-made world-space ray so a router never has to redo
      // the cone maths. u = tan*cos(angle) + nrm*side*sin(angle) reconstructs
      // (dx, dz) exactly from {index, side, angle} if only those are wanted.
      this.crossroads.push({
        index: i, side, angle: Math.acos(THREE.MathUtils.clamp(ux * t.x + uz * t.z, -1, 1)), len,
        x: p0.x, z: p0.z,                                    // mouth, on the road edge
        dx: ux, dz: uz,                                      // unit direction away from the road
        endX: p0.x + ux * len, endZ: p0.z + uz * len,        // far end of the graded spur
        halfWidth: 3.4,                                      // lane half-width at the far end
        y: c.y,                                              // road height at the junction
      });
    }
    dress.finish();
  }

  /** Junction + destination dressing for the crossroad spurs.
   *
   *  A graded strip running into empty grass reads as unfinished geometry, so
   *  every spur now gets (a) a mouth you can recognise as a gateway — two gate
   *  posts, an open five-bar gate leaf and a short post-and-rail fence flanking
   *  the first stretch — and (b) a VISIBLE DESTINATION at the far end: a
   *  farmstead of barn + silo + feed trough, so from the junction it is obvious
   *  the track goes somewhere.
   *
   *  COST: eight InstancedMeshes total for the whole level regardless of how
   *  many junctions there are (`want` ≤ 4), i.e. 8 extra draw calls and ~1.4 k
   *  triangles. Everything reuses box/cylinder/cone primitives that are already
   *  in the level's geometry set.
   *
   *  SOLIDITY (RULES §1): the barn and silo push out as 'hut'; gate posts and
   *  fence rails join the SOLID fence family. Nothing here is ghost scenery. */
  _spurDressing(want) {
    const T = this.T;
    const q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), v3 = new THREE.Vector3();
    const m4 = new THREE.Matrix4();
    const mk = (geo, mat, n, cast = true) => {
      const im = new THREE.InstancedMesh(geo, mat, Math.max(1, n));
      im.castShadow = cast; im.receiveShadow = true; im.count = 0;
      return im;
    };
    const box = new THREE.BoxGeometry(1, 1, 1); box.translate(0, 0.5, 0);
    const cyl = new THREE.CylinderGeometry(1, 1, 1, 8); cyl.translate(0, 0.5, 0);
    const cone = new THREE.ConeGeometry(1, 1, 8); cone.translate(0, 0.5, 0);
    const roof = new THREE.ConeGeometry(0.86, 0.5, 4); roof.rotateY(Math.PI / 4);
    const timber = new THREE.MeshStandardMaterial({
      color: 0x6b4a2a, flatShading: true, roughness: 0.95,
    });
    const wallMat = new THREE.MeshStandardMaterial({
      map: buildingTexture(), roughness: 0.85, envMapIntensity: 0.4,
      emissive: 0xffffff, emissiveMap: buildingGlowTexture(),
      emissiveIntensity: T.hutGlow !== undefined ? T.hutGlow : 0.45,
    });
    const roofMat = new THREE.MeshStandardMaterial({
      // a shade deeper than the cottage roofs so the barn reads as its own
      // building rather than a bright plate dropped on the field
      color: new THREE.Color(T.hutRoof).multiplyScalar(0.78),
      flatShading: true, roughness: 0.85,
    });
    const siloMat = new THREE.MeshStandardMaterial({
      color: 0xc8c2b4, flatShading: true, roughness: 0.7, metalness: 0.15,
    });
    const M = {
      posts: mk(box, timber, want * 10),          // gate posts + fence posts
      rails: mk(box, timber, want * 8),           // gate leaf + post-and-rail
      barn: mk(box, wallMat, want),
      barnRoof: mk(roof, roofMat, want),
      silo: mk(cyl, siloMat, want),
      siloCap: mk(cone, roofMat, want),
      trough: mk(box, timber, want * 2),
      grid: mk(box, timber, want * 5),            // cattle-grid bars at the mouth
    };
    const push = (im, x, y, z, rot, sx, sy, sz) => {
      if (im.count >= im.instanceMatrix.count) return;
      q.setFromAxisAngle(up, rot);
      m4.compose(v3.set(x, y, z), q, new THREE.Vector3(sx, sy, sz));
      im.setMatrixAt(im.count++, m4);
    };
    return {
      /** p0 = spur mouth, (ux,uz) = along the spur, (px,pz) = across it. */
      place: (p0, ux, uz, px, pz, len, roadY, tan) => {
        const rot = Math.atan2(ux, uz);
        const gy = (x, z) => this.terrainHeight(x, z);
        // --- cattle grid: five bars laid across the mouth ---
        for (let k = 0; k < 5; k++) {
          const f = 2.0 + k * 0.85;
          const x = p0.x + ux * f, z = p0.z + uz * f;
          push(M.grid, x, roadY - 0.02, z, rot, 9.4, 0.18, 0.34);
        }
        // --- gate posts + open leaf, 6 u up the spur ---
        const gx = p0.x + ux * 6.5, gz = p0.z + uz * 6.5;
        for (const sl of [1, -1]) {
          const x = gx + px * 5.0 * sl, z = gz + pz * 5.0 * sl;
          const y = gy(x, z);
          push(M.posts, x, y - 0.2, z, rot, 0.55, 2.6, 0.55);
          this.solids.push({ x, z, r: 0.5, y, mat: 'fence' });
        }
        // the leaf swung open along the fence line, so the way in reads OPEN
        for (let k = 0; k < 3; k++) {
          const x = gx + px * 5.0 + ux * (1.4 + k * 0.0), z = gz + pz * 5.0 + uz * 1.4;
          push(M.rails, x, gy(x, z) + 0.6 + k * 0.62, z, rot + 1.15, 3.0, 0.16, 0.14);
        }
        // --- post-and-rail fence flanking the first stretch ---
        for (const sl of [1, -1]) {
          for (let k = 0; k < 3; k++) {
            const f = 10 + k * 5.5;
            const off = 5.0 + f * 0.06;
            const x = p0.x + ux * f + px * off * sl, z = p0.z + uz * f + pz * off * sl;
            const y = gy(x, z);
            push(M.posts, x, y - 0.15, z, rot, 0.36, 1.9, 0.36);
            this.solids.push({ x, z, r: 0.34, y, mat: 'fence' });
            if (k < 2) {
              const f2 = f + 2.75, off2 = 5.0 + f2 * 0.06;
              const rx = p0.x + ux * f2 + px * off2 * sl, rz = p0.z + uz * f2 + pz * off2 * sl;
              push(M.rails, rx, gy(rx, rz) + 1.15, rz, rot, 0.13, 0.16, 5.6);
            }
          }
        }
        // --- destination: barn + silo + trough, squared up at the far end ---
        const ex = p0.x + ux * (len + 15), ez = p0.z + uz * (len + 15);
        const ey = gy(ex, ez);
        const bw = 8.0, bh = 5.0;
        // instance slots have to be grabbed BEFORE the push — `push` bumps
        // im.count itself, so afterwards the index is already gone
        const bi = M.barn.count, bri = M.barnRoof.count;
        push(M.barn, ex, ey - 0.5, ez, rot + 0.22, bw, bh, bw * 0.78);
        push(M.barnRoof, ex, ey - 0.5 + bh, ez, rot + 0.22, bw * 1.22, bh * 0.8, bw * 1.02);
        const barnSolid = { x: ex, z: ez, r: bw * 0.62, y: ey, mat: 'hut' };
        this.solids.push(barnSolid);
        // the farm buildings are buildings too — you can shoot these down
        this.buildings.push({
          x: ex, z: ez, y: ey, r: bw * 0.62, w: bw, h: bh, hp: 150, solid: barnSolid,
          parts: [{ mesh: M.barn, i: bi }, { mesh: M.barnRoof, i: bri }],
          roofColor: this.T.hutRoof,
        });
        this._addShadow(ex, ez, bw * 0.8);
        const sx2 = ex + px * 7.5, sz2 = ez + pz * 7.5;
        const sy2 = gy(sx2, sz2);
        const si = M.silo.count, sci = M.siloCap.count;
        push(M.silo, sx2, sy2 - 0.4, sz2, rot, 1.9, 7.6, 1.9);
        push(M.siloCap, sx2, sy2 - 0.4 + 7.6, sz2, rot, 2.2, 1.5, 2.2);
        const siloSolid = { x: sx2, z: sz2, r: 2.0, y: sy2, mat: 'hut' };
        this.solids.push(siloSolid);
        this.buildings.push({
          x: sx2, z: sz2, y: sy2, r: 2.2, w: 4, h: 7.6, hp: 100, solid: siloSolid,
          parts: [{ mesh: M.silo, i: si }, { mesh: M.siloCap, i: sci }],
          roofColor: 0xd8d2c4,
        });
        this._addShadow(sx2, sz2, 2.5);
        const tx = ex - px * 6.5 - ux * 3, tz = ez - pz * 6.5 - uz * 3;
        push(M.trough, tx, gy(tx, tz) - 0.1, tz, rot + 0.5, 1.1, 0.75, 4.2);
      },
      finish: () => {
        for (const im of Object.values(M)) {
          if (!im.count) continue;
          im.instanceMatrix.needsUpdate = true;
          this.group.add(im);
        }
      },
    };
  }

  /** Open grazing ground for the animal system: 4-8 flat, road-free circles.
   *  Data only — behaviour lives in the game code. */
  _buildPastures() {
    const out = (this._sitePastures || []).slice(0, 4);
    for (let tries = 0; tries < 160 && out.length < 7; tries++) {
      const p = this._trackSidePos(30, 150);
      if (!p) continue;
      const r = 12 + Math.random() * 8;
      if (out.some((q) => (q.x - p.x) ** 2 + (q.z - p.z) ** 2 < (r + q.r + 14) ** 2)) continue;
      if (!this._buildableSpot(p.x, p.z, r * 0.75, 2.4)) continue;
      out.push({ x: p.x, z: p.z, r });
    }
    // world-space grazing spots: [{x, z, r}]
    this.pastures = out;
  }

  /** DECOR micro-detail along the road fringes (no collision): gravel spill
   *  clusters just off the edge, and reflector marker posts on the OUTSIDE of
   *  corners (skipped on cliff-walled worlds where rock lines the road). */
  _buildRoadsideDetail(m4) {
    const T = this.T;
    const q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
    // --- gravel spill clusters (skip worlds with no loose-stone language) ---
    if (T.pebbleCount > 0) {
      const SPOTS = 40;
      const gravelGeo = this._rockGeo || (this._rockGeo = this._topLitRockGeo(0));
      const gravel = new THREE.InstancedMesh(
        gravelGeo,
        new THREE.MeshStandardMaterial({
          color: T.rockColor, flatShading: true, roughness: 1, vertexColors: true,
        }),
        SPOTS * 3
      );
      const gcol = new THREE.Color();
      let gk = 0;
      this._scatter(SPOTS, () => this._trackSidePos(10.9, 14), (p) => {
        for (let c = 0; c < 3; c++) {
          const ox = (Math.random() - 0.5) * 1.6, oz = (Math.random() - 0.5) * 1.6;
          const s = 0.16 + Math.random() * 0.26;
          const gy = this.terrainHeight(p.x + ox, p.z + oz) + s * 0.2;
          q.setFromAxisAngle(up, Math.random() * Math.PI * 2);
          m4.compose(new THREE.Vector3(p.x + ox, gy, p.z + oz), q, new THREE.Vector3(s, s * 0.55, s));
          gravel.setMatrixAt(gk, m4);
          gcol.setScalar(0.85 + Math.random() * 0.3);
          gravel.setColorAt(gk++, gcol);
        }
      });
      gravel.count = gk;
      this.group.add(gravel);
    }
    // --- reflector marker posts on corner outsides ---
    // (skipped where stone already lines the road: canyon cliffs, pass parapets)
    if (T.cliffWalls || T.retainingWalls || T.guardFence) return;
    const postGeo = new THREE.BoxGeometry(0.15, 0.85, 0.15);
    postGeo.translate(0, 0.43, 0);
    const bandGeo = new THREE.BoxGeometry(0.18, 0.22, 0.18);
    bandGeo.translate(0, 0.74, 0);
    const postMat = new THREE.MeshStandardMaterial({ color: 0xe8e4da, roughness: 0.7 });
    // reflective head: unlit + theme-accented so it pops at dusk/night too
    const bandColor = new THREE.Color(T.splinter[0]).lerp(new THREE.Color(0xffffff), 0.2);
    const bandMat = new THREE.MeshBasicMaterial({ color: bandColor });
    const MAXM = 90;
    const posts = new THREE.InstancedMesh(postGeo, postMat, MAXM);
    const bands = new THREE.InstancedMesh(bandGeo, bandMat, MAXM);
    let mk = 0, lastI = -999;
    for (let i = 0; i < N && mk < MAXM; i += 4) {
      if (this.curvature[i] < 0.017 || i - lastI < 14) continue;
      if (this._circDist(i, 0) < 40) continue;
      lastI = i;
      // outside of the corner
      const a = this.tan[i], b = this.tan[(i + 12) % N];
      const side = (a.x * b.z - a.z * b.x) > 0 ? -1 : 1;
      const p = this.pointAt(i, (WALL_OFF + 1.7) * side);
      const y = this.terrainHeight(p.x, p.z);
      q.setFromAxisAngle(up, this.headingAt(i));
      m4.compose(new THREE.Vector3(p.x, y, p.z), q, new THREE.Vector3(1, 1, 1));
      posts.setMatrixAt(mk, m4);
      bands.setMatrixAt(mk++, m4);
    }
    posts.count = bands.count = mk;
    if (mk) this.group.add(posts, bands);
  }

  /** Shared top-lit rock geometry: a dodecahedron with a baked vertex-color
   *  brightness gradient (dark underside → sun-catching crown) that multiplies
   *  whatever material/instance color rides on top. */
  _topLitRockGeo(detail) {
    const geo = new THREE.DodecahedronGeometry(1, detail);
    const pos = geo.attributes.position;
    const cols = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const t = THREE.MathUtils.clamp((pos.getY(i) + 1) / 2, 0, 1);
      const v = 0.68 + 0.52 * t;
      cols[i * 3] = v; cols[i * 3 + 1] = v; cols[i * 3 + 2] = v;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    return geo;
  }

  /** LOG FLUME FURY: trackside timber yards — pyramid stacks of cut logs
   *  (6 per stack) close enough to the road to sell the logging operation.
   *  Each stack gets one SOLID collider (stacked timber does not yield). */
  _buildLogYards() {
    const count = this.T.logYards | 0;
    const logGeo = new THREE.CylinderGeometry(0.55, 0.55, 1, 9);
    logGeo.rotateZ(Math.PI / 2);                        // axis → local x
    const logMat = new THREE.MeshStandardMaterial({ color: 0x8a6238, roughness: 0.95 });
    const logs = new THREE.InstancedMesh(logGeo, logMat, count * 6);
    logs.castShadow = true;
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
    const col = new THREE.Color();
    let k = 0;
    // half the yards cluster in the start bowl (visible from the grid), the
    // rest scatter down the lap
    const makePos = () => {
      if (Math.random() < 0.5) {
        const gi = (((Math.random() * 160 - 80) | 0) + N) % N;
        const side = Math.random() < 0.5 ? 1 : -1;
        const p = this.pointAt(gi, side * (13.5 + Math.random() * 9));
        if (this._distToTrack(p.x, p.z) < 12.5) return null;
        return { x: p.x, z: p.z };
      }
      return this._trackSidePos(13, 26);
    };
    this._scatter(count, makePos, (p) => {
      const y = this.terrainHeight(p.x, p.z);
      const rot = Math.random() * Math.PI;
      const len = 4 + Math.random() * 2;
      q.setFromAxisAngle(up, rot);
      const dx = Math.sin(rot + Math.PI / 2), dz = Math.cos(rot + Math.PI / 2);
      // 3 + 2 + 1 pyramid across the stack's local z
      const rows = [[-1.15, 0, 1.15], [-0.58, 0.58], [0]];
      rows.forEach((offs, tier) => {
        for (const off of offs) {
          m4.compose(
            new THREE.Vector3(p.x + dx * off, y + 0.55 + tier * 0.95, p.z + dz * off),
            q, new THREE.Vector3(len * (0.9 + Math.random() * 0.2), 1, 1)
          );
          logs.setMatrixAt(k, m4);
          col.setHSL(0.07 + Math.random() * 0.03, 0.4, 0.3 + Math.random() * 0.12);
          logs.setColorAt(k++, col);
        }
      });
      this.solids.push({ x: p.x, z: p.z, r: 2.4, y, mat: 'hut' });
      this._addShadow(p.x, p.z, 4.0);
    });
    logs.count = k;
    this.group.add(logs);
  }

  /** REDWOOD RAMPAGE: one fallen giant straddles the road — cars drive under
   *  it. Decorative beam (≥ 6u clearance over the deck); collision comes ONLY
   *  from the two trunk-half SOLIDS standing at the road edges. */
  _buildHollowArch() {
    // straightest window well away from the start and any ramp
    let best = -1, bc = Infinity;
    for (let i = 90; i < N - 90; i += 5) {
      if (this.ramps.some((r) => this._circDist(i, r.index) < 60)) continue;
      let mc = 0;
      for (let k = -6; k <= 6; k++) mc = Math.max(mc, this.curvature[(i + k + N) % N]);
      if (mc < bc) { bc = mc; best = i; }
    }
    if (best < 0) return;
    const i = best;
    const c = this.center[i];
    const bark = new THREE.MeshStandardMaterial({ color: 0x6a3922, roughness: 1 });
    const barkDark = new THREE.MeshStandardMaterial({ color: 0x4a2716, roughness: 1 });
    const cut = new THREE.MeshStandardMaterial({ color: 0xb88a54, roughness: 0.9 });
    const g = new THREE.Group();
    for (const side of [1, -1]) {
      // shattered trunk halves the fallen giant rests on
      const stump = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 3.3, 12, 10), bark);
      stump.position.set(side * 12.4, 6, 0);
      stump.castShadow = true;
      g.add(stump);
      // root flare at the base
      const flare = new THREE.Mesh(new THREE.ConeGeometry(4.4, 3.4, 8), barkDark);
      flare.position.set(side * 12.4, 1.4, 0);
      flare.castShadow = true;
      g.add(flare);
    }
    // the fallen trunk itself, lying across the road (bottom ≈ y 9 — well
    // clear of the 6u minimum and of any nearby ramp apex)
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(3.1, 3.3, 33, 12), [bark, cut, cut]);
    beam.rotation.z = Math.PI / 2;
    beam.position.y = 12.2;
    beam.castShadow = true;
    g.add(beam);
    // a couple of snapped branch stubs on top
    for (const [bx, ba] of [[-4, 0.5], [5.5, -0.4]]) {
      const stub = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.75, 4.5, 7), barkDark);
      stub.position.set(bx, 14.6, 0.6);
      stub.rotation.z = ba;
      g.add(stub);
    }
    g.position.set(c.x, c.y, c.z);
    g.rotation.order = 'YXZ';
    g.rotation.y = this.headingAt(i);                 // local +x = road normal
    g.rotation.x = -Math.atan(this.slopeAt(i));
    this.group.add(g);
    // collision: ONLY the two trunk halves, at the road edges
    const n = this.nrm[i];
    for (const side of [1, -1]) {
      this.solids.push({
        x: c.x + n.x * 12.4 * side, z: c.z + n.z * 12.4 * side,
        r: 3.4, y: c.y, mat: 'hut',
      });
    }
  }

  /** Trackside lamps (NEO-KYOTO / undercity): unlit emissive heads on dark
   *  posts down both road edges — pure set dressing, bloom does the glowing. */
  _buildLamps() {
    const L = { color: 0xffffff, every: 38, height: 6.4, ...this.T.lamps };
    const specs = [];
    for (let i = 10; i < N; i += L.every) {
      specs.push({ i, side: (specs.length % 2 === 0) ? 1 : -1 });
    }
    const postGeo = new THREE.CylinderGeometry(0.09, 0.13, L.height, 6);
    postGeo.translate(0, L.height / 2, 0);
    const headGeo = new THREE.SphereGeometry(0.3, 8, 6);
    headGeo.translate(0, L.height + 0.15, 0);
    const postMat = new THREE.MeshStandardMaterial({ color: 0x1c1e24, roughness: 0.6, metalness: 0.5 });
    const headMat = new THREE.MeshBasicMaterial({ color: L.color });
    const posts = new THREE.InstancedMesh(postGeo, postMat, specs.length);
    const heads = new THREE.InstancedMesh(headGeo, headMat, specs.length);
    const m4 = new THREE.Matrix4();
    let k = 0;
    for (const s of specs) {
      const p = this.pointAt(s.i, (WALL_OFF + 0.9) * s.side);
      m4.makeTranslation(p.x, p.y, p.z);
      posts.setMatrixAt(k, m4);
      heads.setMatrixAt(k++, m4);
    }
    posts.count = heads.count = k;
    this.group.add(posts, heads);
  }

  _buildTerrain() {
    const T = this.T;
    const STRATA = ['#c98b52', '#a45f34', '#b5764a', '#8d4c2a', '#cfa06a', '#96552f']
      .map((c) => new THREE.Color(c));
    // TWO PATCHES, not one 4200 u plane at a uniform 10 u.
    //
    // The old single grid was 352 800 triangles — 63–72 % of every world's
    // entire budget — spread evenly out to ±2100 u. But no circuit reaches
    // past ~320 u from the origin and fog closes between 1150 and 1600 u, so
    // the great majority of those triangles were drawn inside opaque fog.
    //
    //   near: ±1000 u at 10 u cells (80 k tris) — three times the widest
    //         circuit, and 10 u is LOAD-BEARING: it guarantees no triangle can
    //         span a road ribbon and rise through it (cap window 25.2 ≥ 11 +
    //         cell diagonal). This is the only region that can touch a road.
    //   far : the full 4200 u at 40 u cells (22 k tris) — distant hills seen
    //         through haze, where a 40 u facet is indistinguishable.
    //
    // The far patch is dropped 0.4 u so the near one always wins where they
    // overlap: no seam stitching, no T-junction cracks, and at that distance
    // the step is well inside the fog.
    //
    // Physics is untouched: terrainHeight() is analytic (_blendHeight), it
    // never samples this mesh, so nothing here can move a car.
    const SIZE = 2000, SEG = 200;
    const UNITS_PER_TILE = 87.5;                 // 4200/48 — keep texel density
    this._buildFarTerrain(4200, 105, UNITS_PER_TILE);
    const geo = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const cLow = new THREE.Color(T.terrainLow);
    const cHigh = new THREE.Color(T.terrainHigh);
    const cDirt = new THREE.Color(T.terrainDirt);
    const tmp = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      const far = Math.max(Math.abs(x), Math.abs(z)) > 900;
      const h = far
        // skip the track-distance falloff far away, but keep the FULL hill
        // noise: dropping octaves here left a visible ±2.4 u step at the 900 u
        // ring where the two height functions disagreed
        ? this._hillNoise(x, z)
        : this._terrainMeshHeight(x, z);
      pos.setY(i, h - 0.12);
      const t = THREE.MathUtils.clamp((h + 2) / 7, 0, 1);
      tmp.copy(cLow).lerp(cHigh, t);
      // sprinkle dirt patches
      const dirt = Math.max(0, Math.sin(x * 0.045 + 2) * Math.sin(z * 0.05) - 0.72) * 3;
      tmp.lerp(cDirt, THREE.MathUtils.clamp(dirt, 0, 0.55));
      // Valley shading: hollows sit a little deeper in tone than the crests, so
      // the rolling ground reads as form instead of a flat wash. Gentler than
      // it was (0.84) because this MULTIPLIES a colour that is already lerping
      // down to terrainLow in the same hollows — the two stack, and on a dark
      // world the bottom of a dip came out ~3.6x darker than the rise before
      // it. Measured on Ember: the road and the lava field both fell to a mean
      // of 9/255 in the low sections, so there was no way to see where to
      // drive. Form, not a hole.
      tmp.multiplyScalar(0.93 + 0.07 * t);
      // the hero gorge is cut through red-rock strata: banded ochre/rust walls
      // fading back to the snowfield at the rim
      if (this._gorge) {
        const cut = this._gorgeCut(x, z);
        if (cut > 0.6) {
          const band = STRATA[((Math.floor(h * 0.42) % STRATA.length) + STRATA.length) % STRATA.length];
          tmp.lerp(band, THREE.MathUtils.clamp(cut / 6, 0, 1) * 0.94);
        }
      }
      colors[i * 3] = tmp.r; colors[i * 3 + 1] = tmp.g; colors[i * 3 + 2] = tmp.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    const REPEAT = SIZE / UNITS_PER_TILE;        // same texel density as before
    const gtex = groundTexture(T.ground).clone();
    gtex.needsUpdate = true;
    gtex.repeat.set(REPEAT, REPEAT);
    // 2×, not 4×: the ground is by far the largest surface on screen and the
    // facet mosaic now carries the detail the anisotropic filtering used to be
    // paying for. Buys back part of what flat shading + the facet maths cost.
    gtex.anisotropy = 2;
    const mat = new THREE.MeshStandardMaterial({
      // FLAT SHADING IS THE WHOLE LOOK and it is free: three derives the face
      // normal from screen-space derivatives of vViewPosition, so every
      // triangle gets one constant tone with no extra geometry, no extra
      // attribute and no extra draw call.
      map: gtex, vertexColors: true, roughness: 1, metalness: 0, flatShading: true,
    });
    this._facetGround(mat, SEG / REPEAT);
    const ground = new THREE.Mesh(geo, mat);
    ground.receiveShadow = true;
    this.group.add(ground);
  }

  /** The distant ring of the ground, at a quarter of the near patch's
   *  resolution. Everything out here is seen through haze and fog, so it needs
   *  height and tone but not detail. Heights come from `_hillNoise` alone,
   *  which is what the old grid already switched to beyond 900 u — using the
   *  full mesh height function here would only cost time for a result nothing
   *  can resolve. No shadow receipt: nothing casts this far out. */
  _buildFarTerrain(size, seg, unitsPerTile) {
    const T = this.T;
    const geo = new THREE.PlaneGeometry(size, size, seg, seg);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const cLow = new THREE.Color(T.terrainLow);
    const cHigh = new THREE.Color(T.terrainHigh);
    const cDirt = new THREE.Color(T.terrainDirt);
    const tmp = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      let h = this._hillNoise(x, z);
      // SINK THIS MESH WHERE THE NEAR PATCH COVERS IT.
      //
      // This ring exists only to carry the horizon PAST the near patch, but it
      // was built across the whole 4200 u plane — including straight under the
      // track — out of raw hill noise, which knows nothing about the road. The
      // near patch is cut down for the carriageway and this one is not, so
      // wherever the road runs through a cutting this mesh sat ABOVE it and
      // painted over it: measured up to 13.7 u proud, across ~50% of the
      // carriageway on Pine Valley, Frost Peak and Redwood. That is the road
      // disappearing under the hillside, and the car driving along under it.
      //
      // The near patch already switches to pure _hillNoise beyond 900 u (same
      // square metric), so the two agree out there and the seam is invisible.
      // Inside that, drop this mesh far enough that it can never show through.
      const m = Math.max(Math.abs(x), Math.abs(z));
      h -= 60 * (1 - smoothstep01((m - 820) / 80));
      pos.setY(i, h - 0.52);                    // 0.4 under the near patch
      const t = THREE.MathUtils.clamp((h + 2) / 7, 0, 1);
      tmp.copy(cLow).lerp(cHigh, t);
      const dirt = Math.max(0, Math.sin(x * 0.045 + 2) * Math.sin(z * 0.05) - 0.72) * 3;
      tmp.lerp(cDirt, THREE.MathUtils.clamp(dirt, 0, 0.55));
      tmp.multiplyScalar(0.93 + 0.07 * t);      // matches the near patch
      colors[i * 3] = tmp.r; colors[i * 3 + 1] = tmp.g; colors[i * 3 + 2] = tmp.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    const REPEAT = size / unitsPerTile;
    const gtex = groundTexture(T.ground).clone();
    gtex.needsUpdate = true;
    gtex.repeat.set(REPEAT, REPEAT);
    gtex.anisotropy = 1;
    const mat = new THREE.MeshStandardMaterial({
      map: gtex, vertexColors: true, roughness: 1, metalness: 0, flatShading: true,
    });
    this._facetGround(mat, seg / REPEAT);
    this.group.add(new THREE.Mesh(geo, mat));
  }

  /** Per-facet ground tone + slope tint, injected into the standard shader.
   *
   *  Flat shading alone gives each triangle a constant *light* response; the
   *  reference art also gives each one a slightly different *albedo*, which is
   *  what makes low-poly ground read as a hand-placed mosaic. Two additions,
   *  together about a dozen fragment ALU ops and zero new varyings/attributes:
   *
   *   1. a hash keyed on the terrain quad index (derived from the map uv, which
   *      is already a varying) — deterministic in world space, so it never
   *      shimmers as the camera moves, and aligned to the 10 u grid so tone
   *      steps land exactly on quad edges;
   *   2. a slope tint toward the theme's scree colour, using the world-space
   *      geometric normal (`normal` under FLAT_SHADED, rotated back out of view
   *      space by the always-declared `viewMatrix` uniform). Steep faces turn to
   *      bare rock/earth the way a real hillside does; flat ground is untouched.
   */
  _facetGround(mat, cellScale) {
    const T = this.T;
    const scree = new THREE.Color(T.terrainScree !== undefined ? T.terrainScree : T.terrainDirt);
    // NOTE ON UNITS: `slope` below is 1 − |n·up|, not an angle. The open field
    // only reaches ~20° (slope ≈ 0.06), so the useful band is TINY — an
    // innocent-looking [0.16, 0.55] range never fires at all. Road cuts, gorge
    // walls and the sunk-field rims are the only places that reach 0.2+.
    const amp = T.facetAmp !== undefined ? T.facetAmp : 0.34;
    const range = T.screeSlope || [0.018, 0.115];
    mat.onBeforeCompile = (sh) => {
      mat.userData.shader = sh;             // live-tunable from the gfx harness
      sh.uniforms.uFacetCell = { value: cellScale };
      sh.uniforms.uFacetAmp = { value: amp };
      sh.uniforms.uScree = { value: scree };
      sh.uniforms.uScreeRange = { value: new THREE.Vector2(range[0], range[1]) };
      sh.uniforms.uScreeMax = { value: T.screeMax !== undefined ? T.screeMax : 0.45 };
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>
          uniform float uFacetCell, uFacetAmp, uScreeMax;
          uniform vec3 uScree;
          uniform vec2 uScreeRange;`)
        .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
          {
            // sine-free hash: the classic fract(sin(dot(..))*43758) DEGENERATES
            // here — the cell index runs to ~420, and sin() of an argument that
            // large is near-constant on SwiftShader and on plenty of mobile
            // GPUs, so the whole field came out one flat tone. This one is
            // exact in float and costs less.
            vec2 fcell = floor(vMapUv * uFacetCell);
            vec3 fp = fract(vec3(fcell.xyx) * 0.1031);
            fp += dot(fp, fp.yzx + 33.33);
            float fh = fract((fp.x + fp.y) * fp.z);
            diffuseColor.rgb *= 1.0 + (fh - 0.5) * uFacetAmp;
            vec3 wN = normalize((vec4(normal, 0.0) * viewMatrix).xyz);
            float slope = 1.0 - clamp(abs(wN.y), 0.0, 1.0);
            diffuseColor.rgb = mix(diffuseColor.rgb, uScree,
              uScreeMax * smoothstep(uScreeRange.x, uScreeRange.y, slope));
          }`);
    };
    // distinct key so this program is not shared with plain ground materials
    mat.customProgramCacheKey = () => 'facetGround';
  }

  _buildSky() {
    const T = this.T;
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(1500, 24, 12),
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          top: { value: new THREE.Color(T.skyTop) },
          horizon: { value: new THREE.Color(T.skyHorizon) },
          // < 1 lets the horizon glow reach higher (volcano's deep red haze)
          curve: { value: T.skyCurve !== undefined ? T.skyCurve : 1.0 },
        },
        vertexShader: `varying float vY; void main(){ vY = normalize(position).y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `uniform vec3 top; uniform vec3 horizon; uniform float curve; varying float vY;
          void main(){ float t = pow(smoothstep(0.0, 0.5, max(vY, 0.0)), curve); gl_FragColor = vec4(mix(horizon, top, t), 1.0); }`,
      })
    );
    this.group.add(sky);

    // night skies (NEO-KYOTO): a field of star points well above the horizon
    if (T.stars) {
      const starPos = new Float32Array(340 * 3);
      for (let i = 0; i < 340; i++) {
        const a = Math.random() * Math.PI * 2;
        const el = 0.08 + Math.random() * 1.35;           // keep off the glow band
        const r = 1400;
        starPos[i * 3] = Math.cos(a) * Math.cos(el) * r;
        starPos[i * 3 + 1] = Math.sin(el) * r;
        starPos[i * 3 + 2] = Math.sin(a) * Math.cos(el) * r;
      }
      const starGeo = new THREE.BufferGeometry();
      starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
      const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
        color: 0xcfd8ff, size: 2.4, sizeAttenuation: false,
        fog: false, transparent: true, opacity: 0.85, depthWrite: false,
      }));
      this.group.add(stars);
    }

    // sun: a hot disc inside a wide soft halo, placed per-theme (azimuth /
    // elevation in radians) so every level's light reads from somewhere real.
    // Night themes (sunSprite: false) skip the sprite — the light still comes
    // from sunAz/sunEl, it just has no visible source.
    const az = T.sunAz !== undefined ? T.sunAz : 0.68;
    const el = T.sunEl !== undefined ? T.sunEl : 0.3;
    const sunDir = new THREE.Vector3(
      Math.cos(az) * Math.cos(el), Math.sin(el), Math.sin(az) * Math.cos(el)
    );
    // NO SUN SPRITE. A 560-unit additive halo with depthWrite off washed a hot
    // white smear across the road and grass — the default camera looks DOWN,
    // so a sky billboard ends up laid over the play surface rather than sitting
    // on the horizon, and the bloom pass then amplified it. The light itself
    // still comes from sunAz/sunEl; it simply has no drawn source.
    // Do not reintroduce a sun disc, halo or lens flare without checking it
    // from the top-down camera first.

    // layered horizon haze band: a tinted translucent cylinder ringing the
    // world between the near hill ring and the far peaks, so the skyline
    // stacks (hills → haze → peaks → sky) instead of reading as one gradient
    const hazeMat = new THREE.MeshBasicMaterial({
      map: hazeTexture(), color: T.hazeColor !== undefined ? T.hazeColor : T.fogColor,
      transparent: true, opacity: T.hazeOpacity !== undefined ? T.hazeOpacity : 0.9,
      side: THREE.BackSide, fog: false, depthWrite: false,
    });
    const haze = new THREE.Mesh(
      new THREE.CylinderGeometry(940, 940, 300, 48, 1, true), hazeMat
    );
    haze.position.y = 95;                 // dense band hugs the horizon line
    this.group.add(haze);

    const ctex = cloudTexture();
    for (let i = 0; i < T.cloudCount; i++) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({
        map: ctex, transparent: true, opacity: T.cloudOpacity, fog: false, depthWrite: false,
        color: T.cloudTint !== undefined ? T.cloudTint : 0xffffff,
      }));
      const a = (i / T.cloudCount) * Math.PI * 2 + Math.random();
      const r = 550 + Math.random() * 500;
      sp.position.set(Math.cos(a) * r, 190 + Math.random() * 160, Math.sin(a) * r);
      const s = 160 + Math.random() * 180;
      sp.scale.set(s, s * 0.5, 1);
      this.group.add(sp);
      this.animated.clouds.push({ sprite: sp, speed: 1.5 + Math.random() * 2.5 });
    }
  }

  /** Atmospheric-perspective gradient map for a horizon ring: the silhouette
   *  color fades toward the fog color at the base (and desaturates for far
   *  rings) so stacked ridgelines read with real depth. */
  _horizonGrad(hex, baseMix, topMix, desat = 0) {
    const fogC = new THREE.Color(this.T.fogColor);
    const c = new THREE.Color(hex);
    if (desat) {
      const hsl = { h: 0, s: 0, l: 0 };
      c.getHSL(hsl);
      c.setHSL(hsl.h, hsl.s * (1 - desat), hsl.l);
    }
    const top = c.clone().lerp(fogC, topMix);
    const base = c.clone().lerp(fogC, baseMix);
    return horizonTexture('#' + top.getHexString(), '#' + base.getHexString());
  }

  _buildHorizon(m4) {
    const T = this.T;
    if (T.horizon === 'mesa') return this._buildMesaHorizon(m4);
    if (T.horizon === 'dunes') return this._buildDuneHorizon(m4);
    if (T.horizon === 'city') return this._buildCityHorizon(m4);
    const hills = new THREE.InstancedMesh(
      new THREE.ConeGeometry(1, 1, 7),
      new THREE.MeshStandardMaterial({
        map: this._horizonGrad(T.hillColor, 0.52, 0.10),
        flatShading: true, roughness: 1,
      }),
      40
    );
    const peaks = new THREE.InstancedMesh(
      new THREE.ConeGeometry(1, 1, 5),
      new THREE.MeshStandardMaterial({
        // far ring: paler base + slight desaturation so distance reads
        map: this._horizonGrad(T.peakColor, 0.68, 0.26, 0.3),
        flatShading: true, roughness: 1,
      }),
      30
    );
    const base = -8 - (T.hillDrop || 0);      // sit on the (possibly sunk) field
    // The drivable massif now rises through where these cones used to stand,
    // so each one is seated on the real ground beneath it instead of on the
    // old flat field — otherwise the terrain swallows them to the shoulders.
    // They become the peaks the highland climbs toward rather than a backdrop.
    const seat = (x, z) => base + this._highland(x, z);
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * Math.PI * 2;
      const r = 900 + Math.random() * 140;
      const h = 70 + Math.random() * 90;
      const w = 130 + Math.random() * 150;
      const px = Math.cos(a) * r, pz = Math.sin(a) * r;
      m4.makeScale(w, h, w);
      m4.setPosition(px, h / 2 + seat(px, pz), pz);
      hills.setMatrixAt(i, m4);
    }
    for (let i = 0; i < 30; i++) {
      const a = (i / 30) * Math.PI * 2 + 0.1;
      const r = 1120 + Math.random() * 160;
      const h = 160 + Math.random() * 140;
      const w = 120 + Math.random() * 140;
      const px = Math.cos(a) * r, pz = Math.sin(a) * r;
      m4.makeScale(w, h, w);
      m4.setPosition(px, h / 2 + seat(px, pz), pz);
      peaks.setMatrixAt(i, m4);
    }
    this.group.add(hills, peaks);
    if (T.massif) this._buildMassif(m4);
    if (T.glacier) this._buildGlacier(m4);
  }

  /** Add flat-topped stratified mesas (3 stacked shrinking slabs each) for
   *  every spec {x, z, w, h}. Colors band from T.hillColor up to T.peakColor. */
  _addMesaTiers(m4, specs) {
    const tierGeo = new THREE.BoxGeometry(1, 1, 1);
    tierGeo.translate(0, 0.5, 0);
    const mesh = new THREE.InstancedMesh(
      tierGeo,
      new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true, roughness: 1 }),
      specs.length * 3
    );
    const cBase = new THREE.Color(this.T.hillColor);
    const cTop = new THREE.Color(this.T.peakColor);
    const q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
    const col = new THREE.Color();
    let k = 0;
    for (const s of specs) {
      const rot = Math.random() * Math.PI;
      const hr = [0.5, 0.32, 0.2], wr = [1, 0.74, 0.5];
      // seated on the real ground: the massif rises to 68 u out where the
      // horizon mesas stand, and a fixed -2 would sink them into it
      let y = -2 + this._highland(s.x, s.z);
      q.setFromAxisAngle(up, rot);
      for (let t = 0; t < 3; t++) {
        const w = s.w * wr[t];
        const d = s.w * wr[t] * (0.7 + Math.random() * 0.5);
        const hh = s.h * hr[t];
        m4.compose(
          new THREE.Vector3(
            s.x + (Math.random() - 0.5) * s.w * 0.06, y,
            s.z + (Math.random() - 0.5) * s.w * 0.06
          ),
          q, new THREE.Vector3(w, hh, d)
        );
        mesh.setMatrixAt(k, m4);
        col.copy(cBase).lerp(cTop, t / 2).multiplyScalar(0.94 + Math.random() * 0.12);
        mesh.setColorAt(k++, col);
        y += hh;
      }
    }
    this.group.add(mesh);
  }

  /** Dune-sea horizon: two rings of huge, low, smooth elongated golden ridges
   *  instead of pointy cone hills — the serpent-back dune skyline. */
  _buildDuneHorizon(m4) {
    const q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
    const rings = [
      { count: 28, r0: 720, rv: 130, w0: 240, wv: 190, h0: 34, hv: 32,
        map: this._horizonGrad(this.T.hillColor, 0.5, 0.1) },
      { count: 20, r0: 950, rv: 170, w0: 320, wv: 220, h0: 62, hv: 52,
        map: this._horizonGrad(this.T.peakColor, 0.66, 0.24, 0.3) },
    ];
    for (const R of rings) {
      const mesh = new THREE.InstancedMesh(
        new THREE.ConeGeometry(1, 1, 10),
        new THREE.MeshStandardMaterial({ map: R.map, flatShading: true, roughness: 1 }),
        R.count
      );
      for (let i = 0; i < R.count; i++) {
        const a = (i / R.count) * Math.PI * 2 + Math.random() * 0.2;
        const r = R.r0 + Math.random() * R.rv;
        const w = R.w0 + Math.random() * R.wv;
        const h = R.h0 + Math.random() * R.hv;
        q.setFromAxisAngle(up, Math.random() * Math.PI);
        const dx = Math.cos(a) * r, dz = Math.sin(a) * r;
        m4.compose(
          new THREE.Vector3(dx, h / 2 - 6 + this._highland(dx, dz), dz),
          q,
          new THREE.Vector3(w, h, w * (0.4 + Math.random() * 0.3))  // long wind-carved ridges
        );
        mesh.setMatrixAt(i, m4);
      }
      this.group.add(mesh);
    }
  }

  /** NEO-KYOTO horizon: rings of dark skyscrapers with lit window grids —
   *  towerTexture doubles as its own emissive map so the windows glow, plus a
   *  handful of reachable mid-distance towers (SOLID) for parallax. */
  _buildCityHorizon(m4) {
    const tex = towerTexture();
    tex.anisotropy = 4;
    const mat = new THREE.MeshStandardMaterial({
      map: tex, emissive: 0xbfccff, emissiveMap: tex, emissiveIntensity: 0.85,
      roughness: 0.85,
    });
    const geo = new THREE.BoxGeometry(1, 1, 1);
    geo.translate(0, 0.5, 0);
    const midSpecs = [];
    let guard = 0;
    while (midSpecs.length < 14 && guard++ < 300) {
      const a = Math.random() * Math.PI * 2;
      const r = 260 + Math.random() * 280;
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (this._distToTrack(x, z) < 90) continue;
      midSpecs.push({ x, z, w: 22 + Math.random() * 26, h: 60 + Math.random() * 110 });
    }
    const COUNT = 42 + 30 + midSpecs.length;
    const towers = new THREE.InstancedMesh(geo, mat, COUNT);
    const q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
    let k = 0;
    const put = (x, z, w, h) => {
      q.setFromAxisAngle(up, Math.random() * Math.PI);
      m4.compose(
        new THREE.Vector3(x, -4 + this._highland(x, z), z), q,
        new THREE.Vector3(w, h, w * (0.6 + Math.random() * 0.8))
      );
      towers.setMatrixAt(k++, m4);
    };
    for (let i = 0; i < 42; i++) {
      const a = (i / 42) * Math.PI * 2 + Math.random() * 0.12;
      const r = 680 + Math.random() * 130;
      put(Math.cos(a) * r, Math.sin(a) * r, 36 + Math.random() * 48, 90 + Math.random() * 140);
    }
    for (let i = 0; i < 30; i++) {
      const a = (i / 30) * Math.PI * 2 + 0.11;
      const r = 890 + Math.random() * 160;
      put(Math.cos(a) * r, Math.sin(a) * r, 60 + Math.random() * 60, 160 + Math.random() * 160);
    }
    for (const s of midSpecs) {
      put(s.x, s.z, s.w, s.h);
      this.solids.push({ x: s.x, z: s.z, r: s.w * 0.7, y: this.terrainHeight(s.x, s.z), mat: 'metal' });
    }
    towers.count = k;
    this.group.add(towers);
  }

  /** Canyon horizon: rings of big flat-topped mesas instead of cone hills. */
  _buildMesaHorizon(m4) {
    const specs = [];
    for (let i = 0; i < 34; i++) {
      const a = (i / 34) * Math.PI * 2 + Math.random() * 0.15;
      const r = 750 + Math.random() * 130;
      specs.push({
        x: Math.cos(a) * r, z: Math.sin(a) * r,
        w: 110 + Math.random() * 130, h: 60 + Math.random() * 60,
      });
    }
    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * Math.PI * 2 + 0.13;
      const r = 980 + Math.random() * 150;
      specs.push({
        x: Math.cos(a) * r, z: Math.sin(a) * r,
        w: 160 + Math.random() * 170, h: 95 + Math.random() * 85,
      });
    }
    this._addMesaTiers(m4, specs);
  }

  /** Mid-distance canyon country outside the walls: smaller mesa blocks and a
   *  field of freestanding hoodoo towers, so rims and gaps read as desert. */
  _buildOutcrops(m4) {
    const mesaSpecs = [];
    let guard = 0;
    while (mesaSpecs.length < 18 && guard++ < 400) {
      const a = Math.random() * Math.PI * 2;
      const r = 120 + Math.random() * 480;
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (this._distToTrack(x, z) < 70) continue;
      mesaSpecs.push({ x, z, w: 20 + Math.random() * 40, h: 14 + Math.random() * 20 });
    }
    this._addMesaTiers(m4, mesaSpecs);
    // free-roamers can reach these — one solid per mesa (base tier is a unit
    // box scaled to w wide, so base footprint radius ≈ w/2)
    for (const s of mesaSpecs) {
      this.solids.push({
        x: s.x, z: s.z, r: s.w * 0.5 * 0.85, y: this.terrainHeight(s.x, s.z), mat: 'stone',
      });
    }

    // freestanding hoodoos: 4 stacked drums per tower, wider cap stone
    const COUNT = 40, SEGS = 4;
    const segGeo = new THREE.CylinderGeometry(0.8, 1, 1, 7);
    segGeo.translate(0, 0.5, 0);
    const hoodoos = new THREE.InstancedMesh(
      segGeo,
      new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true, roughness: 0.9 }),
      COUNT * SEGS
    );
    hoodoos.castShadow = true;
    const strata = ['#cf9a5e', '#a06844', '#b8845a', '#96603c'].map((c) => new THREE.Color(c));
    const q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
    const col = new THREE.Color();
    const wr = [1, 0.78, 0.6, 0.82];
    let k = 0, placed = 0;
    guard = 0;
    while (placed < COUNT && guard++ < 800) {
      const a = Math.random() * Math.PI * 2;
      const rr = 60 + Math.random() * 320;
      const x = Math.cos(a) * rr, z = Math.sin(a) * rr;
      const d = this._distToTrack(x, z);
      if (d < 26 || d > 140) continue;
      const r0 = 1.4 + Math.random() * 1.2;
      const hTot = 7 + Math.random() * 9;
      let y = this.terrainHeight(x, z) - 0.4;
      for (let s = 0; s < SEGS; s++) {
        const rad = r0 * wr[s] * (0.9 + Math.random() * 0.2);
        const hh = (hTot / SEGS) * (0.8 + Math.random() * 0.4);
        q.setFromAxisAngle(up, Math.random() * Math.PI * 2);
        m4.compose(
          new THREE.Vector3(x + (Math.random() - 0.5) * 0.4, y, z + (Math.random() - 0.5) * 0.4),
          q, new THREE.Vector3(rad, hh, rad)
        );
        hoodoos.setMatrixAt(k, m4);
        col.copy(strata[s % strata.length]).multiplyScalar(0.92 + Math.random() * 0.16);
        hoodoos.setColorAt(k++, col);
        y += hh * 0.97;
      }
      this._addShadow(x, z, r0 * 1.6);
      placed++;
    }
    hoodoos.count = k;
    this.group.add(hoodoos);
  }

  _scatter(count, makePos, place) {
    let placed = 0, guard = 0;
    while (placed < count && guard++ < count * 30) {
      const p = makePos();
      if (!p) continue;
      place(p, placed);
      placed++;
    }
    return placed;
  }

  /** The largest a stone at (x,z) may be without reaching the carriageway.
   *
   *  Scatter positions are measured along the normal at one sample, but on the
   *  inside of a bend the true distance to the road is much less than that —
   *  and then the boulder's own radius eats further in. Measured across the 21
   *  worlds, 313 solid stones reached onto the drivable road, the worst of them
   *  4.5 u inside a 9 u half-width: a rock parked in your lane, at up to 85 hull
   *  a hit. Stone is supposed to be brutal; it is not supposed to be unavoidable.
   *
   *  Returns 0 when the spot is too close to carry a stone at all — the caller
   *  must then place nothing, because a boulder you can see and drive through
   *  breaks the Law of Solidity just as badly.
   */
  _stoneFit(x, z, want) {
    const room = this._distToTrack(x, z) - (ROAD_HALF + 2.4);
    return room <= 0.4 ? 0 : Math.min(want, room);
  }

  /** Does a stone of radius r at (x,z) stay out of the road AS IT IS THERE?
   *
   *  `_stoneFit` measures against the nominal half-width, which is right for the
   *  open scatter but wrong for the deliberate edge furniture — a kerb marking a
   *  pinch is supposed to sit close. This asks the sharper question: how wide is
   *  the road at the point nearest this stone, and does the stone clear it?
   *
   *  It is the difference that matters on a hairpin. A block placed along one
   *  sample's normal is fine at that sample and inside the road two samples
   *  later, where the centreline has swung under it. */
  _clearsRoad(x, z, r, margin = 1.2) {
    _clearV.set(x, 0, z);
    const i = this.nearestIndex(_clearV);          // no hint: search the whole lap
    const half = this.widthAt ? this.widthAt(i) : ROAD_HALF;
    return this._distToTrack(x, z) - r >= half + margin;
  }

  _trackSidePos(minD, maxD) {
    const i = (Math.random() * N) | 0;
    const side = Math.random() < 0.5 ? 1 : -1;
    const dist = minD + Math.random() * (maxD - minD);
    const x = this.center[i].x + this.nrm[i].x * side * dist;
    const z = this.center[i].z + this.nrm[i].z * side * dist;
    if (this._distToTrack(x, z) < minD - 1) return null;
    return { x, z };
  }

  /** Trackside position restricted to one stretch of the lap. `zone` is a pair
   *  of lap fractions; f0 > f1 wraps through the start line. */
  _zonePos(zone, minD, maxD) {
    const [f0, f1] = zone;
    const span = (f1 - f0 + 1) % 1 || 1;
    const i = (((f0 + Math.random() * span) % 1) * N) | 0;
    const side = Math.random() < 0.5 ? 1 : -1;
    const dist = minD + Math.random() * (maxD - minD);
    const x = this.center[i].x + this.nrm[i].x * side * dist;
    const z = this.center[i].z + this.nrm[i].z * side * dist;
    if (this._distToTrack(x, z) < minD - 1) return null;
    return { x, z };
  }

  /** treeAltFade [y0, y1]: roll a trunk against the local ground height so a
   *  stand thins out with altitude — a mountain pass climbs out of its forest
   *  into bare rock exactly the way a real one does. True when there is no
   *  fade configured for the theme. */
  _altOK(x, z) {
    const fade = this.T.treeAltFade;
    if (!fade) return true;
    return Math.random() > THREE.MathUtils.smoothstep(this.terrainHeight(x, z), fade[0], fade[1]);
  }

  _buildForest(m4) {
    const T = this.T;
    if (T.vegetation === 'none' || !T.treeCount) return;
    if (T.vegetation === 'cactus') return this._buildCacti(m4);
    if (T.vegetation === 'charred') return this._buildCharredTrees(m4);
    if (T.vegetation === 'jungle') return this._buildJungleTrees(m4);
    if (T.vegetation === 'palm') return this._buildPalms(m4);
    if (T.vegetation === 'redwood') return this._buildRedwoods(m4);
    if (T.vegetation === 'burnt') return this._buildBurntForest(m4);
    const COUNT = T.treeCount;
    const trunkGeo = new THREE.CylinderGeometry(0.35, 0.5, 2.4, 7);
    trunkGeo.translate(0, 1.2, 0);
    const trunkMat = new THREE.MeshStandardMaterial({ color: T.trunkColor, roughness: 1 });
    const lowMat = new THREE.MeshStandardMaterial({ color: T.foliageLow, flatShading: true, roughness: 1 });
    const topMat = new THREE.MeshStandardMaterial({ color: T.foliageTop, flatShading: true, roughness: 1 });
    const capMat = T.treeSnowCap
      ? new THREE.MeshStandardMaterial({ color: 0xf2f6fa, flatShading: true, roughness: 0.9 })
      : null;
    // A REAL MIXED STAND: several visually distinct species per world, not one
    // silhouette with hue jitter. Which species and in what ratio comes from
    // T.floraMix (or the per-theme FLORA_MIX default): conifers (two pine
    // silhouettes + sparse-tiered larch), deciduous (pale-trunked birch,
    // round-crowned oak) and winter bare birches. Every species is its own
    // set of InstancedMeshes — one draw call per part regardless of count.
    const capFor = (parts, capY) => {
      if (!capMat || capY == null) return;
      const capGeo = new THREE.ConeGeometry(1.3, 1.9, 8);
      capGeo.translate(0, capY, 0);
      parts.push(new THREE.InstancedMesh(capGeo, capMat, COUNT));
    };
    const mkParts = (trunk, tiers, capY) => {
      const parts = [new THREE.InstancedMesh(trunk[0], trunk[1], COUNT)];
      for (const [geoSpec, mat] of tiers) parts.push(new THREE.InstancedMesh(geoSpec, mat, COUNT));
      capFor(parts, capY);
      for (const part of parts) part.castShadow = true;
      return parts;
    };
    // --- conifers ---
    const lowA = new THREE.ConeGeometry(2.6, 4.2, 8);
    lowA.translate(0, 4.0, 0);
    const topA = new THREE.ConeGeometry(1.8, 3.4, 8);
    topA.translate(0, 6.6, 0);
    const lowB = new THREE.ConeGeometry(2.3, 3.4, 7);
    lowB.translate(0.2, 3.6, -0.12);
    const midB = new THREE.ConeGeometry(1.75, 2.9, 7);
    midB.translate(-0.16, 5.6, 0.12);
    const topB = new THREE.ConeGeometry(1.15, 2.6, 7);
    topB.translate(0.05, 7.4, -0.05);
    const larchTiers = [];
    for (const [r, y] of [[1.55, 3.3], [1.25, 4.9], [0.95, 6.3], [0.6, 7.6]]) {
      const tg = new THREE.ConeGeometry(r, 1.5, 7);      // sparse gappy tiers
      tg.translate(0, y, 0);
      larchTiers.push([tg, lowMat]);
    }
    // --- deciduous ---
    const birchTrunk = new THREE.CylinderGeometry(0.2, 0.28, 3.6, 6);
    birchTrunk.translate(0, 1.8, 0);
    const birchBark = new THREE.MeshStandardMaterial({ color: 0xe6e8e0, roughness: 0.9 });
    const birchCrown = new THREE.SphereGeometry(1.45, 7, 5);
    birchCrown.scale(1, 1.3, 1);
    birchCrown.translate(0, 4.7, 0);
    const birchTop = new THREE.SphereGeometry(0.85, 6, 5);
    birchTop.translate(0.15, 6.1, -0.1);
    const bareBranch = (rz, tx, ty2, tz) => {
      const bg = new THREE.ConeGeometry(0.09, 1.9, 5);
      bg.rotateZ(rz);
      bg.translate(tx, ty2, tz);
      return [bg, trunkMat];
    };
    const oakTrunk = new THREE.CylinderGeometry(0.42, 0.6, 2.7, 7);
    oakTrunk.translate(0, 1.35, 0);
    const oakDome = new THREE.SphereGeometry(2.35, 8, 6);
    oakDome.scale(1, 0.78, 1);
    oakDome.translate(0, 4.0, 0);
    const oakTop = new THREE.SphereGeometry(1.4, 7, 5);
    oakTop.translate(0.35, 5.5, 0.2);
    // --- rainforest ---
    // AMAZON RAPIDS was falling through to the default two-pine stand, so the
    // Amazon was planted with conifers. Three storeys instead, which is what
    // actually reads as rainforest from a car: a buttressed emergent standing
    // clear of everything, an umbrella-crowned mid-storey, and a low tree fern.
    const kapokTrunk = new THREE.CylinderGeometry(0.30, 0.72, 8.6, 7);
    kapokTrunk.translate(0, 4.3, 0);
    const kapokButtress = new THREE.ConeGeometry(1.25, 2.4, 6);   // flared root flare
    kapokButtress.translate(0, 1.2, 0);
    // emergents are flat-topped: the crown spreads sideways above the canopy
    const kapokCrown = new THREE.SphereGeometry(3.5, 9, 5);
    kapokCrown.scale(1, 0.42, 1);
    kapokCrown.translate(0, 9.1, 0);
    const kapokCrown2 = new THREE.SphereGeometry(2.2, 8, 5);
    kapokCrown2.scale(1, 0.5, 1);
    kapokCrown2.translate(0.9, 8.2, -0.6);
    const cecTrunk = new THREE.CylinderGeometry(0.20, 0.30, 5.4, 6);
    cecTrunk.translate(0, 2.7, 0);
    const cecCrown = new THREE.SphereGeometry(2.5, 8, 5);          // parasol
    cecCrown.scale(1, 0.5, 1);
    cecCrown.translate(0, 5.9, 0);
    const fernTrunk = new THREE.CylinderGeometry(0.16, 0.24, 1.9, 6);
    fernTrunk.translate(0, 0.95, 0);
    const fernFrond = new THREE.SphereGeometry(1.55, 7, 4);
    fernFrond.scale(1, 0.34, 1);
    fernFrond.translate(0, 2.35, 0);
    const SPECIES = {
      kapok: { parts: mkParts([kapokTrunk, trunkMat],
        [[kapokButtress, trunkMat], [kapokCrown, lowMat], [kapokCrown2, topMat]], null),
      kind: 'kapok', rFac: 1.25, solidAt: 1.0, tint: 'canopy', tiers: 3 },
      cecropia: { parts: mkParts([cecTrunk, trunkMat], [[cecCrown, lowMat]], null),
        kind: 'cecropia', rFac: 0.8, solidAt: 1.45, tint: 'canopy', tiers: 1 },
      treeFern: { parts: mkParts([fernTrunk, trunkMat], [[fernFrond, topMat]], null),
        kind: 'fern', rFac: 0.5, solidAt: null, tint: 'understorey', tiers: 1 },
      pineA: { parts: mkParts([trunkGeo, trunkMat], [[lowA, lowMat], [topA, topMat]], 7.35),
        kind: 'pine', rFac: 1.0, solidAt: 1.0, tint: 'conifer', tiers: 2 },
      pineB: { parts: mkParts([trunkGeo, trunkMat], [[lowB, lowMat], [midB, lowMat], [topB, topMat]], 8.15),
        kind: 'pine', rFac: 1.0, solidAt: 1.0, tint: 'conifer', tiers: 3 },
      larch: { parts: mkParts([trunkGeo, trunkMat], larchTiers, 8.3),
        kind: 'larch', rFac: 0.85, solidAt: null, tint: 'larch', tiers: 4 },
      birch: { parts: mkParts([birchTrunk, birchBark], [[birchCrown, lowMat], [birchTop, topMat]], null),
        kind: 'birch', rFac: 0.7, solidAt: null, tint: 'birch', tiers: 2 },
      birchBare: { parts: mkParts([birchTrunk, birchBark],
        [bareBranch(-0.85, 0.7, 3.4, 0), bareBranch(0.8, -0.6, 2.9, 0.1), bareBranch(-0.3, 0.15, 4.3, -0.4)], null),
        kind: 'birch', rFac: 0.55, solidAt: null, tint: 'bare', tiers: 3 },
      oak: { parts: mkParts([oakTrunk, trunkMat], [[oakDome, lowMat], [oakTop, topMat]], null),
        kind: 'oak', rFac: 1.15, solidAt: 1.35, tint: 'oak', tiers: 2 },
    };
    const mix = T.floraMix
      || FLORA_MIX[this.level && this.level.theme]
      || [['pineA', 0.55], ['pineB', 0.45]];
    const ks = {};
    for (const [name] of mix) ks[name] = 0;
    const pick = () => {
      let roll = Math.random(), acc = 0;
      for (const [name, wt] of mix) { acc += wt; if (roll < acc) return name; }
      return mix[mix.length - 1][0];
    };
    const color = new THREE.Color();
    const F = T.foliage;

    const placed = this._scatter(COUNT,
      () => {
        let p;
        if (Math.random() < 0.62) p = this._trackSidePos(15, 46);
        else {
          const a = Math.random() * Math.PI * 2;
          const r = 80 + Math.random() * 560;
          const x = Math.cos(a) * r, z = Math.sin(a) * r;
          p = this._distToTrack(x, z) < 14.5 ? null : { x, z };
        }
        return p && this._altOK(p.x, p.z) ? p : null;
      },
      (p) => {
        const name = pick();
        const spec = SPECIES[name];
        const parts = spec.parts;
        const k = ks[name]++;
        const s = 0.75 + Math.random() * 1.25;
        const ty = this.terrainHeight(p.x, p.z) - 0.25;
        m4.makeScale(s, s * (0.85 + Math.random() * 0.45), s);
        m4.setPosition(p.x, ty, p.z);
        for (const part of parts) part.setMatrixAt(k, m4);
        this.trees.push({
          x: p.x, z: p.z, y: ty, r: spec.rFac * s, id: k, parts, kind: spec.kind, s,
          // explicit material law: true stops a car dead, false always yields
          solid: spec.solidAt != null && s >= spec.solidAt,
        });
        // per-tree foliage variation (themed hue band, shifted per species)
        switch (spec.tint) {
          case 'larch':   // paler, yellow-shifted soft needles
            color.setHSL(F.h - 0.045 + Math.random() * F.hVar, F.s * 0.85,
              Math.min(0.6, F.l + 0.10 + Math.random() * F.lVar)); break;
          case 'birch':   // light airy crown
            color.setHSL(F.h + 0.02 + Math.random() * F.hVar, F.s * 0.8,
              Math.min(0.62, F.l + 0.16 + Math.random() * F.lVar)); break;
          case 'oak':     // deep saturated dome
            color.setHSL(F.h + Math.random() * F.hVar, Math.min(1, F.s + 0.12),
              Math.max(0.16, F.l - 0.03 + Math.random() * F.lVar)); break;
          case 'canopy':  // rainforest broadleaf — deep, wet, slightly blue-green
            color.setHSL(F.h + 0.012 + Math.random() * F.hVar, Math.min(1, F.s + 0.16),
              Math.max(0.15, F.l - 0.01 + Math.random() * F.lVar)); break;
          case 'understorey': // ferns in the gloom: darker and more saturated
            color.setHSL(F.h + 0.02 + Math.random() * F.hVar, Math.min(1, F.s + 0.22),
              Math.max(0.11, F.l - 0.07 + Math.random() * F.lVar)); break;
          case 'bare':    // dark winter branches
            color.setHSL(0.07, 0.18, 0.16 + Math.random() * 0.08); break;
          default:
            color.setHSL(F.h + Math.random() * F.hVar, F.s + Math.random() * F.sVar,
              F.l + Math.random() * F.lVar);
        }
        // trunk: two wood tones, or near-white bark for the birches
        if (spec.tint === 'birch' || spec.tint === 'bare') {
          const bt = 0.92 + Math.random() * 0.14;
          parts[0].setColorAt(k, new THREE.Color(bt, bt, bt * 0.97));
        } else {
          const trunkTone = Math.random() < 0.5 ? 1.0 : 0.78;
          parts[0].setColorAt(k, new THREE.Color(trunkTone, trunkTone * 0.96, trunkTone * 0.9));
        }
        // crown tiers darken downward, brighten at the top (bare: branches)
        for (let ti = 1; ti <= spec.tiers; ti++) {
          const f = spec.tiers === 1 ? 1.2 : 0.85 + (ti - 1) / (spec.tiers - 1) * 0.45;
          parts[ti].setColorAt(k, color.clone().multiplyScalar(spec.tint === 'bare' ? 1 : f));
        }
        this._addShadow(p.x, p.z, 2.4 * spec.rFac * s);
      });
    for (const name of Object.keys(ks)) {
      for (const part of SPECIES[name].parts) part.count = ks[name];
      this.group.add(...SPECIES[name].parts);
    }
    // DECOR (no collision, < 0.5u tall): fallen logs and cut stumps scattered
    // through the stand so the forest floor reads lived-in
    if (placed > 20) this._buildForestFloorDecor(m4);
  }

  /** Instanced fallen logs + stumps among the trees. Pure decoration: nothing
   *  is pushed to trees/solids/obstacles, and everything stays low. */
  _buildForestFloorDecor(m4) {
    const T = this.T;
    const LOGS = Math.min(36, Math.max(10, (T.treeCount * 0.12) | 0));
    const STUMPS = Math.min(26, Math.max(8, (T.treeCount * 0.08) | 0));
    const q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
    const logGeo = new THREE.CylinderGeometry(0.26, 0.33, 2.8, 7);
    logGeo.rotateZ(Math.PI / 2);                    // lie along local X
    logGeo.translate(0, 0.26, 0);
    const stumpGeo = new THREE.CylinderGeometry(0.4, 0.5, 0.48, 7);
    stumpGeo.translate(0, 0.24, 0);
    const barkMat = new THREE.MeshStandardMaterial({ color: T.trunkColor, roughness: 1 });
    const cutMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(T.trunkColor).lerp(new THREE.Color(0xd8c090), 0.55), roughness: 0.95,
    });
    const logs = new THREE.InstancedMesh(logGeo, barkMat, LOGS);
    const stumps = new THREE.InstancedMesh(stumpGeo, [barkMat, cutMat, cutMat], STUMPS);
    const mossy = new THREE.Color(T.foliageLow);
    const col = new THREE.Color();
    let lk = 0;
    this._scatter(LOGS, () => this._trackSidePos(12.5, 42), (p) => {
      const s = 0.8 + Math.random() * 0.7;
      q.setFromAxisAngle(up, Math.random() * Math.PI * 2);
      m4.compose(
        new THREE.Vector3(p.x, this.terrainHeight(p.x, p.z) - 0.04, p.z),
        q, new THREE.Vector3(s, s * 0.9, s * 0.9)
      );
      logs.setMatrixAt(lk, m4);
      // some logs moss over toward the foliage tone
      col.setScalar(0.8 + Math.random() * 0.35);
      if (Math.random() < 0.4) col.lerp(mossy, 0.45);
      logs.setColorAt(lk++, col);
    });
    logs.count = lk;
    let sk = 0;
    this._scatter(STUMPS, () => this._trackSidePos(12, 34), (p) => {
      const s = 0.7 + Math.random() * 0.7;
      q.setFromAxisAngle(up, Math.random() * Math.PI * 2);
      m4.compose(
        new THREE.Vector3(p.x, this.terrainHeight(p.x, p.z) - 0.04, p.z),
        q, new THREE.Vector3(s, s, s)
      );
      stumps.setMatrixAt(sk++, m4);
    });
    stumps.count = sk;
    this.group.add(logs, stumps);
  }

  /** Canyon vegetation: instanced saguaros (capsule trunk + two elbow arms).
   *  Placed where they'll actually be seen: along the road inside the walls,
   *  up on the cliff rims, and around the open start bowl. */
  _buildCacti(m4) {
    const COUNT = this.T.treeCount;
    const trunkGeo = new THREE.CapsuleGeometry(0.5, 3.6, 4, 8);
    trunkGeo.translate(0, 2.3, 0);
    const armUpA = new THREE.CapsuleGeometry(0.3, 1.5, 4, 8);
    armUpA.translate(1.05, 3.5, 0);
    const armElbowA = new THREE.CapsuleGeometry(0.3, 0.9, 4, 8);
    armElbowA.rotateZ(Math.PI / 2);
    armElbowA.translate(0.6, 2.75, 0);
    const armUpB = new THREE.CapsuleGeometry(0.28, 1.1, 4, 8);
    armUpB.translate(-0.95, 3.0, 0);
    const armElbowB = new THREE.CapsuleGeometry(0.28, 0.75, 4, 8);
    armElbowB.rotateZ(Math.PI / 2);
    armElbowB.translate(-0.55, 2.4, 0);
    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true, roughness: 0.9 });
    const parts = [trunkGeo, armUpA, armElbowA, armUpB, armElbowB]
      .map((geoPart) => new THREE.InstancedMesh(geoPart, mat, COUNT));
    // DESERT FLORA MIX: saguaros plus two more species so the desert never
    // reads copy-pasted — squat ribbed BARREL cacti with a blossom crown, and
    // dry flat-topped ACACIA scrub. All of them yield to a car.
    const barrelBody = new THREE.CylinderGeometry(0.62, 0.78, 1.05, 9);
    barrelBody.translate(0, 0.55, 0);
    const barrelCrown = new THREE.SphereGeometry(0.3, 6, 5);
    barrelCrown.translate(0, 1.15, 0);
    const barrelParts = [
      new THREE.InstancedMesh(barrelBody, mat, COUNT),
      new THREE.InstancedMesh(barrelCrown,
        new THREE.MeshStandardMaterial({ color: 0xe89a4a, flatShading: true, roughness: 0.9 }), COUNT),
    ];
    const acTrunk = new THREE.CylinderGeometry(0.12, 0.22, 2.6, 6);
    acTrunk.rotateZ(0.16);
    acTrunk.translate(0, 1.3, 0);
    const acBough = new THREE.CylinderGeometry(0.08, 0.12, 1.4, 5);
    acBough.rotateZ(-0.8);
    acBough.translate(0.75, 2.2, 0);
    const acCrown = new THREE.SphereGeometry(1.9, 8, 4);
    acCrown.scale(1, 0.22, 1);
    acCrown.translate(0.35, 3.0, 0);
    const acaciaParts = [
      new THREE.InstancedMesh(acTrunk, new THREE.MeshStandardMaterial({ color: 0x6a5138, roughness: 1 }), COUNT),
      new THREE.InstancedMesh(acBough, new THREE.MeshStandardMaterial({ color: 0x6a5138, roughness: 1 }), COUNT),
      new THREE.InstancedMesh(acCrown,
        new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true, roughness: 1 }), COUNT),
    ];
    for (const part of [...parts, ...barrelParts, ...acaciaParts]) part.castShadow = true;
    const ks = { saguaro: 0, barrel: 0, acacia: 0 };
    const q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
    const color = new THREE.Color();
    this._scatter(COUNT,
      () => {
        const roll = Math.random();
        const i = (Math.random() * N) | 0;
        const side = Math.random() < 0.5 ? 1 : -1;
        if (roll < 0.5) {
          // roadside, hugging the cliff base (small ones); dy is relative to road y
          return { i, lateral: side * (10.55 + Math.random() * 0.35), dy: 0, s: 0.5 + Math.random() * 0.35 };
        }
        if (roll < 0.8 && this.T.cliffWalls) {
          // silhouetted on the canyon rim (cliff heights are relative to road y)
          const prof = this._cliffProfile(i, side);
          if (prof.h < 7) return null;
          return {
            i, lateral: side * (prof.base + prof.l2 + 1 + Math.random() * 3.5),
            dy: prof.h * 0.97 - 0.35, s: 0.7 + Math.random() * 0.6,
          };
        }
        // open bowl around the start line — absolute terrain height
        const gi = ((Math.random() * 140 - 70 | 0) + N) % N;
        const lat = side * (13 + Math.random() * 22);
        return { i: gi, lateral: lat, terrain: true, s: 0.8 + Math.random() * 0.7 };
      },
      (spot, k) => {
        const p = this.pointAt(spot.i, spot.lateral);
        const y = spot.terrain ? this.terrainHeight(p.x, p.z) : p.y + spot.dy;
        // rim spots stay saguaro (their silhouette carries the skyline);
        // ground spots mix in barrels and dry acacia
        const roll = spot.dy ? 0 : Math.random();
        const species = roll < 0.55 ? 'saguaro' : roll < 0.8 ? 'barrel' : 'acacia';
        const sp = species === 'saguaro' ? parts : species === 'barrel' ? barrelParts : acaciaParts;
        const k2 = ks[species]++;
        const s = species === 'acacia' ? spot.s * 1.35 : spot.s;
        q.setFromAxisAngle(up, Math.random() * Math.PI * 2);
        m4.compose(
          new THREE.Vector3(p.x, y - 0.15, p.z),
          q, new THREE.Vector3(s, s * (0.9 + Math.random() * 0.3), s)
        );
        if (species === 'acacia') {
          color.setHSL(0.155 + Math.random() * 0.04, 0.32 + Math.random() * 0.12, 0.3 + Math.random() * 0.1);
        } else {
          color.setHSL(0.30 + Math.random() * 0.06, 0.35 + Math.random() * 0.15, 0.22 + Math.random() * 0.12);
        }
        for (const part of sp) {
          part.setMatrixAt(k2, m4);
          part.setColorAt(k2, color);
        }
        this.trees.push({
          x: p.x, z: p.z, y: y - 0.15, id: k2, parts: sp, s,
          r: (species === 'barrel' ? 0.6 : 0.75) * s,
          kind: species === 'acacia' ? 'acacia' : 'cactus',
          solid: false,                                  // desert scrub always yields
        });
        this._addShadow(p.x, p.z, 1.6 * s, spot.terrain ? null : y - 0.15);
      });
    for (const part of parts) { part.count = ks.saguaro; this.group.add(part); }
    for (const part of barrelParts) { part.count = ks.barrel; this.group.add(part); }
    for (const part of acaciaParts) { part.count = ks.acacia; this.group.add(part); }
  }

  /** Volcano vegetation: nothing green survives a lava field, so the "flora"
   *  is two stages of the same death — tall bare SNAGS with a few thin dark
   *  branches still attached, and squat broken STUMPS the ash has buried to
   *  the shoulder. Both are BREAKABLE (kind 'snag'), both jitter in scale and
   *  in how far the char has bleached them. */
  _buildCharredTrees(m4) {
    const COUNT = this.T.treeCount;
    const trunkGeo = new THREE.CylinderGeometry(0.13, 0.34, 4.8, 6);
    trunkGeo.translate(0, 2.4, 0);
    const b1 = new THREE.ConeGeometry(0.1, 2.0, 5);
    b1.rotateZ(-0.95);
    b1.translate(0.62, 3.2, 0);
    const b2 = new THREE.ConeGeometry(0.09, 1.6, 5);
    b2.rotateZ(0.85);
    b2.translate(-0.55, 2.6, 0.1);
    const b3 = new THREE.ConeGeometry(0.08, 1.4, 5);
    b3.rotateX(0.9);
    b3.translate(0, 3.7, 0.5);
    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true, roughness: 1 });
    const parts = [trunkGeo, b1, b2, b3].map((geoPart) => new THREE.InstancedMesh(geoPart, mat, COUNT));
    // stump: a snapped-off trunk with a jagged shoulder, half-buried in ash
    const stTrunk = new THREE.CylinderGeometry(0.34, 0.6, 1.5, 6);
    stTrunk.translate(0, 0.75, 0);
    const stShard = new THREE.ConeGeometry(0.2, 0.9, 4);
    stShard.rotateZ(0.22);
    stShard.translate(0.16, 1.7, 0);
    const stRoot = new THREE.CylinderGeometry(0.62, 0.95, 0.36, 6);
    stRoot.translate(0, 0.18, 0);
    const stumpParts = [stTrunk, stShard, stRoot]
      .map((geoPart) => new THREE.InstancedMesh(geoPart, mat, COUNT));
    for (const part of [...parts, ...stumpParts]) part.castShadow = true;
    const q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
    const color = new THREE.Color();
    let snags = 0, stumps = 0;
    this._scatter(COUNT,
      () => {
        if (Math.random() < 0.62) return this._trackSidePos(15, 46);
        const a = Math.random() * Math.PI * 2;
        const r = 80 + Math.random() * 560;
        const x = Math.cos(a) * r, z = Math.sin(a) * r;
        if (this._distToTrack(x, z) < 14.5) return null;
        return { x, z };
      },
      (p) => {
        // 70 % standing snags, 30 % snapped stumps
        const stump = Math.random() < 0.3;
        const sp = stump ? stumpParts : parts;
        const k = stump ? stumps++ : snags++;
        const s = stump ? 0.8 + Math.random() * 0.9 : 0.7 + Math.random() * 1.1;
        const ty = this.terrainHeight(p.x, p.z) - 0.2;
        q.setFromAxisAngle(up, Math.random() * Math.PI * 2);
        m4.compose(
          new THREE.Vector3(p.x, ty, p.z),
          q, new THREE.Vector3(s, s * (0.8 + Math.random() * 0.5), s)
        );
        // char jitter: from soot-black to ash-dusted grey (stumps sit in the
        // fallout so they run a touch greyer, never brighter than the field)
        color.setHSL(0.06 + Math.random() * 0.03,
          (0.12 + Math.random() * 0.1) * (stump ? 0.6 : 1),
          (stump ? 0.06 : 0.08) + Math.random() * 0.06);
        for (const part of sp) {
          part.setMatrixAt(k, m4);
          part.setColorAt(k, color);
        }
        this.trees.push({
          x: p.x, z: p.z, y: ty, r: (stump ? 0.6 : 0.45) * s, id: k, parts: sp,
          kind: 'snag', s, solid: false,
        });
        this._addShadow(p.x, p.z, (stump ? 1.0 : 1.2) * s);
      });
    for (const part of parts) { part.count = snags; this.group.add(part); }
    for (const part of stumpParts) { part.count = stumps; this.group.add(part); }
  }

  /** Jungle canopy — TROPICAL SPECIES ONLY. There is not one conifer anywhere
   *  on a jungle world: no cone-and-trunk pine geometry is built here and the
   *  theme never reaches the default `_buildForest` stand.
   *
   *  Four canopy species plus undergrowth, each with scale and colour jitter:
   *    KAPOK      emergent — pale buttressed trunk, broad flat plate crown,
   *               liana strands hanging off it. SOLID at full scale.
   *    BROADLEAF  mid-story — short trunk, rounded stacked crowns. Yields.
   *    PALM       tall bare stem under a fan of drooping fronds. Yields.
   *    TREEFERN   squat fibrous trunk under an arching frond rosette. Yields.
   *  plus banana-ish giant-leaf plants fanning out along the verges.
   *  Everything except the full-grown kapoks sets solid:false, which is what
   *  vehicles.js reads (`tr.solid`) to decide whether a car fells it. */
  _buildJungleTrees(m4) {
    const T = this.T;
    const COUNT = T.treeCount;
    const trunkMat = new THREE.MeshStandardMaterial({ color: T.trunkColor, roughness: 1 });
    const canMatLow = new THREE.MeshStandardMaterial({ color: T.foliageLow, flatShading: true, roughness: 1 });
    const canMatTop = new THREE.MeshStandardMaterial({ color: T.foliageTop, flatShading: true, roughness: 1 });
    // kapok: tall trunk, flared buttress base, wide plate crown + side domes
    const kTrunk = new THREE.CylinderGeometry(0.26, 0.4, 7.0, 7);
    kTrunk.translate(0, 3.5, 0);
    const kButtress = new THREE.CylinderGeometry(0.62, 1.05, 1.5, 7);
    kButtress.translate(0, 0.75, 0);
    const kCrown = new THREE.SphereGeometry(3.6, 8, 5);
    kCrown.scale(1, 0.34, 1);
    kCrown.translate(0, 7.3, 0);
    const kDomeA = new THREE.SphereGeometry(2.0, 7, 5);
    kDomeA.scale(1, 0.42, 1);
    kDomeA.translate(1.9, 6.8, 0.6);
    const kDomeB = new THREE.SphereGeometry(1.7, 7, 5);
    kDomeB.scale(1, 0.45, 1);
    kDomeB.translate(-1.8, 6.9, -0.5);
    // lianas: three thin strands dangling from the kapok crown — the single
    // most tropical read there is, and free (they ride the same instance)
    const vineMat = new THREE.MeshStandardMaterial({ color: 0x3e6b2c, roughness: 1 });
    // every strand must hang from somewhere: keep them inside the crown plate
    // footprint (radius 3.6) or they read as sticks floating in mid-air
    const vineGeos = [[2.4, 3.4, 1.2], [-2.2, 2.6, -1.0], [0.9, 3.0, -2.4]]
      .map(([vx, vlen, vz]) => {
        const v = new THREE.CylinderGeometry(0.055, 0.045, vlen, 4);
        v.translate(vx, 6.9 - vlen / 2, vz);
        return v;
      });
    const kapokParts = [
      new THREE.InstancedMesh(kTrunk, trunkMat, COUNT),
      new THREE.InstancedMesh(kButtress, trunkMat, COUNT),
      new THREE.InstancedMesh(kCrown, canMatLow, COUNT),
      new THREE.InstancedMesh(kDomeA, canMatLow, COUNT),
      new THREE.InstancedMesh(kDomeB, canMatTop, COUNT),
      ...vineGeos.map((v) => new THREE.InstancedMesh(v, vineMat, COUNT)),
    ];
    // broadleaf: short trunk, two rounded stacked crowns
    const bTrunk = new THREE.CylinderGeometry(0.24, 0.36, 4.2, 7);
    bTrunk.translate(0, 2.1, 0);
    const bCrown = new THREE.SphereGeometry(2.45, 8, 6);
    bCrown.scale(1, 0.72, 1);
    bCrown.translate(0, 4.7, 0);
    const bTop = new THREE.SphereGeometry(1.5, 7, 5);
    bTop.scale(1, 0.75, 1);
    bTop.translate(0.4, 6.0, 0.3);
    const broadParts = [
      new THREE.InstancedMesh(bTrunk, trunkMat, COUNT),
      new THREE.InstancedMesh(bCrown, canMatLow, COUNT),
      new THREE.InstancedMesh(bTop, canMatTop, COUNT),
    ];
    // rainforest palm: slim bare stem, 7 drooping fronds, a nut cluster
    const pTrunk = new THREE.CylinderGeometry(0.15, 0.28, 6.2, 6);
    pTrunk.translate(0, 3.1, 0);
    const palmGeos = [pTrunk];
    for (let li = 0; li < 7; li++) {
      const fr = new THREE.ConeGeometry(0.46, 3.3, 4);
      fr.rotateZ(-Math.PI / 2);                          // axis → +x
      fr.translate(1.6, 0, 0);
      fr.scale(1, 0.2, 0.68);                            // flattened frond
      fr.rotateZ(-0.30 - (li % 2) * 0.26);               // droop, alternating
      fr.rotateY(li * (Math.PI * 2 / 7) + 0.4);
      fr.translate(0, 6.15, 0);
      palmGeos.push(fr);
    }
    const pNut = new THREE.SphereGeometry(0.2, 6, 5);
    pNut.translate(0.26, 5.85, 0.16);
    const palmParts = [
      new THREE.InstancedMesh(pTrunk, trunkMat, COUNT),
      ...palmGeos.slice(1).map((fr) => new THREE.InstancedMesh(fr, canMatTop, COUNT)),
      new THREE.InstancedMesh(pNut, new THREE.MeshStandardMaterial({ color: 0x6a4a26, roughness: 1 }), COUNT),
    ];
    // tree fern: squat fibrous trunk under an arching frond rosette
    const fTrunk = new THREE.CylinderGeometry(0.2, 0.34, 2.0, 6);
    fTrunk.translate(0, 1.0, 0);
    const fernParts = [new THREE.InstancedMesh(fTrunk, trunkMat, COUNT)];
    for (let li = 0; li < 6; li++) {
      const fr = new THREE.BoxGeometry(0.34, 0.06, 2.2);
      fr.translate(0, 0, 1.25);
      fr.rotateX(-0.5 - (li % 2) * 0.2);                 // arch up then over
      fr.rotateY(li * (Math.PI * 2 / 6) + 0.25);
      fr.translate(0, 2.05, 0);
      fernParts.push(new THREE.InstancedMesh(fr, canMatLow, COUNT));
    }
    for (const part of [...kapokParts, ...broadParts, ...palmParts, ...fernParts]) {
      part.castShadow = true;
    }
    const color = new THREE.Color();
    const F = T.foliage;
    const ks = { kapok: 0, broad: 0, palm: 0, fern: 0 };
    // species table: [name, parts, colour-tinted part indices, radius, scale range]
    const SPECIES = [
      ['kapok', kapokParts, [2, 3, 4], 1.0, [0.9, 1.1]],
      ['broadleaf', broadParts, [1, 2], 0.8, [0.7, 0.8]],
      ['palm', palmParts, palmParts.map((_, pi) => pi).slice(1, -1), 0.55, [0.85, 0.6]],
      ['treefern', fernParts, fernParts.map((_, pi) => pi).slice(1), 0.5, [0.6, 0.5]],
    ];
    const SLOT = { kapok: 'kapok', broadleaf: 'broad', palm: 'palm', treefern: 'fern' };
    this._scatter(COUNT,
      () => {
        // denser and closer than the pine forests: a real green wall
        if (Math.random() < 0.7) return this._trackSidePos(13.5, 40);
        const a = Math.random() * Math.PI * 2;
        const r = 60 + Math.random() * 480;
        const x = Math.cos(a) * r, z = Math.sin(a) * r;
        if (this._distToTrack(x, z) < 13) return null;
        return { x, z };
      },
      (p) => {
        // 40 % emergent kapok, 25 % broadleaf, 20 % palm, 15 % tree fern
        const roll = Math.random();
        const sp = SPECIES[roll < 0.40 ? 0 : roll < 0.65 ? 1 : roll < 0.85 ? 2 : 3];
        const [kind, parts, tintIdx, rad, [s0, sVar]] = sp;
        const k = ks[SLOT[kind]]++;
        const s = s0 + Math.random() * sVar;
        const ty = this.terrainHeight(p.x, p.z) - 0.25;
        m4.makeScale(s, s * (0.85 + Math.random() * 0.4), s);
        m4.setPosition(p.x, ty, p.z);
        for (const part of parts) part.setMatrixAt(k, m4);
        this.trees.push({
          x: p.x, z: p.z, y: ty, r: rad * s, id: k, parts, kind, s,
          // kapok emergents at full growth stop a car; everything else yields
          solid: kind === 'kapok' && s >= 1.0,
        });
        color.setHSL(
          F.h + Math.random() * F.hVar,
          F.s + Math.random() * F.sVar,
          F.l + Math.random() * F.lVar
        );
        // per-instance tint, brightening toward the top of the canopy
        for (let ti = 0; ti < tintIdx.length; ti++) {
          parts[tintIdx[ti]].setColorAt(k,
            color.clone().multiplyScalar(0.85 + (ti / Math.max(1, tintIdx.length - 1)) * 0.4));
        }
        this._addShadow(p.x, p.z, (kind === 'kapok' ? 3.0 : kind === 'broadleaf' ? 2.4 : 1.8) * s);
      });
    for (const [kind, parts] of SPECIES) for (const part of parts) part.count = ks[SLOT[kind]];
    this.group.add(...kapokParts, ...broadParts, ...palmParts, ...fernParts);

    // giant-leaf plants near the road: 5 flat stretched leaves fanned from a base
    const PLANTS = 90;
    const leafMat = new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true, roughness: 0.85 });
    const leafParts = [];
    for (let li = 0; li < 5; li++) {
      const leaf = new THREE.BoxGeometry(0.55, 0.07, 2.3);
      leaf.translate(0, 0, 1.35);
      leaf.rotateX(-0.42 - (li % 2) * 0.16);             // tips lifted, alternating droop
      leaf.rotateY(li * (Math.PI * 2 / 5) + 0.3);
      leaf.translate(0, 0.5, 0);
      leafParts.push(new THREE.InstancedMesh(leaf, leafMat, PLANTS));
    }
    const q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
    const pPlaced = this._scatter(PLANTS,
      () => this._trackSidePos(11.2, 17),
      (p, k) => {
        const s = 0.55 + Math.random() * 0.4;            // small → always smashable
        const py = this.terrainHeight(p.x, p.z) - 0.05;
        q.setFromAxisAngle(up, Math.random() * Math.PI * 2);
        m4.compose(
          new THREE.Vector3(p.x, py, p.z),
          q, new THREE.Vector3(s, s * (0.9 + Math.random() * 0.3), s)
        );
        color.setHSL(0.30 + Math.random() * 0.07, 0.5 + Math.random() * 0.2, 0.26 + Math.random() * 0.12);
        for (const part of leafParts) {
          part.setMatrixAt(k, m4);
          part.setColorAt(k, color);
        }
        this.trees.push({ x: p.x, z: p.z, y: py, r: 0.65 * s, id: k, parts: leafParts, kind: 'jungle', s, solid: false });
      });
    for (const part of leafParts) { part.count = pPlaced; this.group.add(part); }
  }

  /** Desert palms — TWO species so an oasis never reads copy-pasted:
   *    DATE PALM  tall bare trunk under a fan crown of drooping fronds plus a
   *               fruit cluster (the skyline shape).
   *    DOUM PALM  squat, thicker, wider stiff fan with no fruit — the scrubby
   *               understory palm that grows in clumps at the water's edge.
   *  Both carry kind 'palm' (NOT 'pine') and solid:false, so cars always fell
   *  them. The oasis level packs most of its palms into one dense grove
   *  section of the lap (T.palmGrove = [fracA, fracB]); the dune level
   *  scatters them thin. */
  _buildPalms(m4) {
    const T = this.T;
    const COUNT = T.treeCount;
    const trunkGeo = new THREE.CylinderGeometry(0.16, 0.32, 5.4, 7);
    trunkGeo.translate(0, 2.7, 0);
    const partGeos = [trunkGeo];
    for (let li = 0; li < 6; li++) {
      const fr = new THREE.ConeGeometry(0.5, 3.1, 4);
      fr.rotateZ(-Math.PI / 2);                     // axis → +x
      fr.translate(1.5, 0, 0);
      fr.scale(1, 0.22, 0.72);                      // flattened frond
      fr.rotateZ(-0.36 - (li % 2) * 0.22);          // droop, alternating
      fr.rotateY(li * (Math.PI * 2 / 6) + 0.35);
      fr.translate(0, 5.35, 0);
      partGeos.push(fr);
    }
    const nutGeo = new THREE.SphereGeometry(0.22, 6, 5);
    nutGeo.translate(0.28, 5.05, 0.18);
    partGeos.push(nutGeo);
    const trunkMat = new THREE.MeshStandardMaterial({ color: T.trunkColor, roughness: 1 });
    const frondMat = new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true, roughness: 0.9 });
    const nutMat = new THREE.MeshStandardMaterial({ color: 0x6a4a26, roughness: 1 });
    const parts = partGeos.map((geoPart, gi) => new THREE.InstancedMesh(
      geoPart, gi === 0 ? trunkMat : gi === partGeos.length - 1 ? nutMat : frondMat, COUNT
    ));
    // --- doum palm: short thick trunk, 8 stiff wide fans, no fruit ---
    const dTrunk = new THREE.CylinderGeometry(0.3, 0.46, 2.5, 7);
    dTrunk.translate(0, 1.25, 0);
    const doumGeos = [dTrunk];
    for (let li = 0; li < 8; li++) {
      const fr = new THREE.ConeGeometry(0.72, 2.4, 4);
      fr.rotateZ(-Math.PI / 2);
      fr.translate(1.15, 0, 0);
      fr.scale(1, 0.16, 0.9);                       // broad flat fan
      fr.rotateZ(-0.02 - (li % 3) * 0.2);           // near-horizontal, uneven
      fr.rotateY(li * (Math.PI * 2 / 8) + 0.2);
      fr.translate(0, 2.55, 0);
      doumGeos.push(fr);
    }
    const doumParts = doumGeos.map((geoPart, gi) => new THREE.InstancedMesh(
      geoPart, gi === 0 ? trunkMat : frondMat, COUNT
    ));
    for (const part of [...parts, ...doumParts]) part.castShadow = true;
    const q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
    const color = new THREE.Color();
    const F = T.foliage;
    const grove = T.palmGrove;
    let doums = 0, dates = 0;
    this._scatter(COUNT,
      () => {
        if (grove && Math.random() < 0.6) {
          // the hidden grove: dense stand along one stretch of the lap
          const i = ((grove[0] + Math.random() * (grove[1] - grove[0])) * N) | 0;
          const side = Math.random() < 0.5 ? 1 : -1;
          const p = this.pointAt(i % N, side * (12 + Math.random() * 26));
          if (this._distToTrack(p.x, p.z) < 11.5) return null;
          return { x: p.x, z: p.z };
        }
        if (Math.random() < 0.55) return this._trackSidePos(12, 42);
        const a = Math.random() * Math.PI * 2;
        const r = 70 + Math.random() * 480;
        const x = Math.cos(a) * r, z = Math.sin(a) * r;
        if (this._distToTrack(x, z) < 11.5) return null;
        return { x, z };
      },
      (p) => {
        // 68 % date palms (the skyline), 32 % squat doum clumps
        const doum = Math.random() < 0.32;
        const sp = doum ? doumParts : parts;
        const k = doum ? doums++ : dates++;
        const s = doum ? 0.75 + Math.random() * 0.6 : 0.8 + Math.random() * 0.75;
        const ty = this.terrainHeight(p.x, p.z) - 0.2;
        q.setFromAxisAngle(up, Math.random() * Math.PI * 2);
        m4.compose(
          new THREE.Vector3(p.x, ty, p.z),
          q, new THREE.Vector3(s, s * (0.9 + Math.random() * 0.35), s)
        );
        color.setHSL(
          F.h + Math.random() * F.hVar,
          // the doums run drier and duller than the fruiting date palms
          (F.s + Math.random() * F.sVar) * (doum ? 0.78 : 1),
          F.l + Math.random() * F.lVar
        );
        for (const part of sp) {
          part.setMatrixAt(k, m4);
          part.setColorAt(k, color);
        }
        // NOT 'pine' → the material law lets any car snap a palm
        this.trees.push({
          x: p.x, z: p.z, y: ty, r: (doum ? 0.7 : 0.55) * s, id: k, parts: sp,
          kind: doum ? 'doum' : 'palm', s, solid: false,
        });
        this._addShadow(p.x, p.z, (doum ? 1.5 : 1.9) * s);
      });
    for (const part of parts) { part.count = dates; this.group.add(part); }
    for (const part of doumParts) { part.count = doums; this.group.add(part); }
  }

  /** Gargantuan redwoods: scale 2.2–3.2 → the s ≥ 1.0 'pine' rule makes every
   *  one SOLID, so they are all placed OFF the road. Two more species dress
   *  the floor and keep the stand from reading as one repeated tree: small
   *  (smashable) redwood saplings on the verges, and TANOAK broadleaves in a
   *  lighter yellow-green — the real coast-redwood understory. */
  _buildRedwoods(m4) {
    const T = this.T;
    const COUNT = T.treeCount;
    const trunkGeo = new THREE.CylinderGeometry(0.5, 0.9, 9, 8);
    trunkGeo.translate(0, 4.5, 0);
    const lowGeo = new THREE.ConeGeometry(3.0, 6.5, 8);
    lowGeo.translate(0, 11.4, 0);
    const midGeo = new THREE.ConeGeometry(2.3, 5.5, 8);
    midGeo.translate(0, 15.1, 0);
    const topGeo = new THREE.ConeGeometry(1.5, 4.6, 8);
    topGeo.translate(0, 18.6, 0);
    const trunkMat = new THREE.MeshStandardMaterial({ color: T.trunkColor, roughness: 1 });
    const lowMat = new THREE.MeshStandardMaterial({ color: T.foliageLow, flatShading: true, roughness: 1 });
    const topMat = new THREE.MeshStandardMaterial({ color: T.foliageTop, flatShading: true, roughness: 1 });
    const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, COUNT);
    const lows = new THREE.InstancedMesh(lowGeo, lowMat, COUNT);
    const mids = new THREE.InstancedMesh(midGeo, lowMat, COUNT);
    const tops = new THREE.InstancedMesh(topGeo, topMat, COUNT);
    trunks.castShadow = lows.castShadow = mids.castShadow = tops.castShadow = true;
    const giantParts = [trunks, lows, mids, tops];
    const color = new THREE.Color();
    const F = T.foliage;
    const placed = this._scatter(COUNT,
      () => {
        // giants never crowd the ribbon: min 17u from the centerline
        if (Math.random() < 0.6) return this._trackSidePos(17, 60);
        const a = Math.random() * Math.PI * 2;
        const r = 80 + Math.random() * 540;
        const x = Math.cos(a) * r, z = Math.sin(a) * r;
        if (this._distToTrack(x, z) < 17) return null;
        return { x, z };
      },
      (p, k) => {
        const s = 2.2 + Math.random() * 1.0;             // 46–67u tall — gargantuan
        const ty = this.terrainHeight(p.x, p.z) - 0.4;
        m4.makeScale(s, s * (0.9 + Math.random() * 0.25), s);
        m4.setPosition(p.x, ty, p.z);
        for (const part of giantParts) part.setMatrixAt(k, m4);
        // kind 'pine' at s ≥ 1.0 → SOLID: hitting a giant stops a car dead
        this.trees.push({ x: p.x, z: p.z, y: ty, r: 0.85 * s, id: k, parts: giantParts, kind: 'pine', s, solid: true });
        this._addShadow(p.x, p.z, 1.6 * s);
        color.setHSL(
          F.h + Math.random() * F.hVar,
          F.s + Math.random() * F.sVar,
          F.l + Math.random() * F.lVar
        );
        lows.setColorAt(k, color);
        mids.setColorAt(k, color.clone().multiplyScalar(0.88));
        tops.setColorAt(k, color.clone().multiplyScalar(1.22));
      });
    trunks.count = lows.count = mids.count = tops.count = placed;
    this.group.add(trunks, lows, mids, tops);

    // smashable understory: the same geometry at sapling scale near the road
    const SAPS = 110;
    const sTrunks = new THREE.InstancedMesh(trunkGeo, trunkMat, SAPS);
    const sLows = new THREE.InstancedMesh(lowGeo, lowMat, SAPS);
    const sTops = new THREE.InstancedMesh(topGeo, topMat, SAPS);
    sTrunks.castShadow = sLows.castShadow = sTops.castShadow = true;
    const sapParts = [sTrunks, sLows, sTops];
    const sapPlaced = this._scatter(SAPS,
      () => this._trackSidePos(12.5, 26),
      (p, k) => {
        const s = 0.22 + Math.random() * 0.2;            // 4.5–9u saplings
        const ty = this.terrainHeight(p.x, p.z) - 0.15;
        m4.makeScale(s, s * (0.9 + Math.random() * 0.3), s);
        m4.setPosition(p.x, ty, p.z);
        for (const part of sapParts) part.setMatrixAt(k, m4);
        this.trees.push({ x: p.x, z: p.z, y: ty, r: 0.85 * s, id: k, parts: sapParts, kind: 'pine', s, solid: false });
        color.setHSL(F.h + Math.random() * F.hVar, F.s, F.l + 0.06 + Math.random() * 0.1);
        sLows.setColorAt(k, color);
        sTops.setColorAt(k, color.clone().multiplyScalar(1.2));
      });
    for (const part of sapParts) { part.count = sapPlaced; this.group.add(part); }

    // --- TANOAK: the broadleaf that actually grows under coast redwoods.
    // Short crooked trunk under two rounded crowns in a lighter, yellower
    // green than the conifers, so the stand never reads as one repeated tree.
    const OAKS = 120;
    const oTrunk = new THREE.CylinderGeometry(0.26, 0.42, 4.4, 6);
    oTrunk.rotateZ(0.06);
    oTrunk.translate(0, 2.2, 0);
    const oCrown = new THREE.SphereGeometry(2.3, 8, 6);
    oCrown.scale(1, 0.82, 1);
    oCrown.translate(0, 5.1, 0);
    const oTop = new THREE.SphereGeometry(1.4, 7, 5);
    oTop.scale(1, 0.85, 1);
    oTop.translate(0.45, 6.3, 0.3);
    // reuse the theme's canopy materials so the tanoaks sit in the same
    // brightness family as the conifers — the per-instance tint below only
    // shifts them yellower and a shade lighter
    const oakParts = [
      new THREE.InstancedMesh(oTrunk, trunkMat, OAKS),
      new THREE.InstancedMesh(oCrown, lowMat, OAKS),
      new THREE.InstancedMesh(oTop, topMat, OAKS),
    ];
    for (const part of oakParts) part.castShadow = true;
    const oakPlaced = this._scatter(OAKS,
      () => (Math.random() < 0.7 ? this._trackSidePos(13, 45) : this._trackSidePos(45, 130)),
      (p, k) => {
        const s = 0.7 + Math.random() * 0.7;
        const ty = this.terrainHeight(p.x, p.z) - 0.2;
        m4.makeScale(s, s * (0.85 + Math.random() * 0.4), s);
        m4.setPosition(p.x, ty, p.z);
        for (const part of oakParts) part.setMatrixAt(k, m4);
        // broadleaf, never a giant → always yields to a bumper
        this.trees.push({ x: p.x, z: p.z, y: ty, r: 0.75 * s, id: k, parts: oakParts, kind: 'oak', s, solid: false });
        // yellower and a shade lighter than the conifers, same brightness band
        color.setHSL(
          F.h - 0.035 + Math.random() * F.hVar,
          Math.min(1, F.s + 0.08),
          Math.min(0.55, F.l + 0.05 + Math.random() * F.lVar)
        );
        oakParts[1].setColorAt(k, color);
        oakParts[2].setColorAt(k, color.clone().multiplyScalar(1.2));
        this._addShadow(p.x, p.z, 2.2 * s);
      });
    for (const part of oakParts) { part.count = oakPlaced; this.group.add(part); }
  }

  /** Burning forest: a mix of bare charred snags (ember-rim emissive) and
   *  still-standing pines whose canopies are scorched to ember-lit browns. */
  _buildBurntForest(m4) {
    const T = this.T;
    const q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
    const color = new THREE.Color();
    // --- charred snags (60%) ---
    const SNAGS = Math.round(T.treeCount * 0.6);
    const trunkGeo = new THREE.CylinderGeometry(0.13, 0.34, 4.8, 6);
    trunkGeo.translate(0, 2.4, 0);
    const b1 = new THREE.ConeGeometry(0.1, 2.0, 5);
    b1.rotateZ(-0.95);
    b1.translate(0.62, 3.2, 0);
    const b2 = new THREE.ConeGeometry(0.09, 1.6, 5);
    b2.rotateZ(0.85);
    b2.translate(-0.55, 2.6, 0.1);
    const snagMat = new THREE.MeshStandardMaterial({
      color: 0xffffff, flatShading: true, roughness: 1,
      emissive: 0x341000, emissiveIntensity: 0.55,       // ember rim
    });
    const snagParts = [trunkGeo, b1, b2].map((g0) => new THREE.InstancedMesh(g0, snagMat, SNAGS));
    for (const part of snagParts) part.castShadow = true;
    const snagPlaced = this._scatter(SNAGS,
      () => {
        if (Math.random() < 0.6) return this._trackSidePos(14, 44);
        const a = Math.random() * Math.PI * 2;
        const r = 80 + Math.random() * 520;
        const x = Math.cos(a) * r, z = Math.sin(a) * r;
        if (this._distToTrack(x, z) < 14) return null;
        return { x, z };
      },
      (p, k) => {
        const s = 0.7 + Math.random() * 1.1;
        const ty = this.terrainHeight(p.x, p.z) - 0.2;
        q.setFromAxisAngle(up, Math.random() * Math.PI * 2);
        m4.compose(new THREE.Vector3(p.x, ty, p.z), q, new THREE.Vector3(s, s * (0.8 + Math.random() * 0.5), s));
        color.setHSL(0.05 + Math.random() * 0.03, 0.14 + Math.random() * 0.1, 0.07 + Math.random() * 0.05);
        for (const part of snagParts) {
          part.setMatrixAt(k, m4);
          part.setColorAt(k, color);
        }
        this.trees.push({ x: p.x, z: p.z, y: ty, r: 0.45 * s, id: k, parts: snagParts, kind: 'snag', s, solid: false });
        this._addShadow(p.x, p.z, 1.2 * s);
      });
    for (const part of snagParts) { part.count = snagPlaced; this.group.add(part); }

    // --- scorched standing pines (40%), canopies glowing from within ---
    const PINES = T.treeCount - SNAGS;
    const pTrunk = new THREE.CylinderGeometry(0.35, 0.5, 2.4, 7);
    pTrunk.translate(0, 1.2, 0);
    const pLow = new THREE.ConeGeometry(2.6, 4.2, 8);
    pLow.translate(0, 4.0, 0);
    const pTop = new THREE.ConeGeometry(1.8, 3.4, 8);
    pTop.translate(0, 6.6, 0);
    const pTrunkMat = new THREE.MeshStandardMaterial({ color: T.trunkColor, roughness: 1 });
    const scorchMat = new THREE.MeshStandardMaterial({
      color: T.foliageLow, flatShading: true, roughness: 1,
      emissive: 0x552008, emissiveIntensity: 0.6,        // fire smouldering inside
    });
    const scorchTopMat = new THREE.MeshStandardMaterial({
      color: T.foliageTop, flatShading: true, roughness: 1,
      emissive: 0x6a2408, emissiveIntensity: 0.55,
    });
    const pTrunks = new THREE.InstancedMesh(pTrunk, pTrunkMat, PINES);
    const pLows = new THREE.InstancedMesh(pLow, scorchMat, PINES);
    const pTops = new THREE.InstancedMesh(pTop, scorchTopMat, PINES);
    pTrunks.castShadow = pLows.castShadow = pTops.castShadow = true;
    const pineParts = [pTrunks, pLows, pTops];
    const F = T.foliage;
    const pinePlaced = this._scatter(PINES,
      () => {
        if (Math.random() < 0.62) return this._trackSidePos(15, 46);
        const a = Math.random() * Math.PI * 2;
        const r = 80 + Math.random() * 560;
        const x = Math.cos(a) * r, z = Math.sin(a) * r;
        if (this._distToTrack(x, z) < 14.5) return null;
        return { x, z };
      },
      (p, k) => {
        const s = 0.75 + Math.random() * 1.1;
        const ty = this.terrainHeight(p.x, p.z) - 0.25;
        m4.makeScale(s, s * (0.85 + Math.random() * 0.4), s);
        m4.setPosition(p.x, ty, p.z);
        for (const part of pineParts) part.setMatrixAt(k, m4);
        this.trees.push({ x: p.x, z: p.z, y: ty, r: 1.0 * s, id: k, parts: pineParts, kind: 'pine', s, solid: s >= 1.0 });
        color.setHSL(
          F.h + Math.random() * F.hVar,
          F.s + Math.random() * F.sVar,
          F.l + Math.random() * F.lVar
        );
        pLows.setColorAt(k, color);
        pTops.setColorAt(k, color.clone().multiplyScalar(1.25));
        this._addShadow(p.x, p.z, 2.4 * s);
      });
    pTrunks.count = pLows.count = pTops.count = pinePlaced;
    this.group.add(pTrunks, pLows, pTops);
  }

  _buildGroundCover(m4) {
    const T = this.T;
    const q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
    // grass tufts: two crossed alpha-cut planes, dense right beside the road
    const gtex = grassTexture(T.grass);
    const tuftGeo = new THREE.PlaneGeometry(1.6, 1.3);
    tuftGeo.translate(0, 0.6, 0);
    const tuftMat = new THREE.MeshStandardMaterial({
      map: gtex, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 1,
    });
    const tufts = new THREE.InstancedMesh(tuftGeo, tuftMat, T.tuftCount * 2);
    let k = 0;
    this._scatter(T.tuftCount,
      () => (Math.random() < 0.7 ? this._trackSidePos(11.2, 32) : this._trackSidePos(26, 62)),
      (p) => {
        const y = this.terrainHeight(p.x, p.z) - 0.05;
        const s = 0.7 + Math.random() * 1.1;
        const rot = Math.random() * Math.PI;
        for (const dr of [0, Math.PI / 2]) {
          q.setFromAxisAngle(up, rot + dr);
          m4.compose(new THREE.Vector3(p.x, y, p.z), q, new THREE.Vector3(s, s, s));
          tufts.setMatrixAt(k++, m4);
        }
      });
    tufts.count = k;
    this.group.add(tufts);

    // Understorey. One squashed blob stood in for every biome's ground layer —
    // the same shape under redwoods, in the Amazon, on an ice sheet and in a
    // wadi. It is the layer you see most of at eye height, so it is the layer
    // that most gives away that the worlds are the same world repainted.
    //
    // Four silhouettes now, chosen by what actually grows there:
    //   frond   fern / sword fern   — rainforest and redwood floor
    //   spray   tussock / bunchgrass — alpine pasture, snow edge, ice moraine
    //   spike   saltbush / creosote  — deserts, canyons, wadis
    //   blob    broadleaf scrub      — everywhere else (the original)
    const UNDER = {
      jungle: 'frond', redwood: 'frond', flume: 'frond',
      alpine: 'spray', pass: 'spray', tremola: 'spray', furka: 'spray',
      snow: 'spray', glacial: 'spray', sheetice: 'spray', avalanche: 'spray',
      desert: 'spike', dunes: 'spike', canyon: 'spike', ravine: 'spike', oasis: 'spike',
    };
    const underKind = T.understorey ?? UNDER[this.level?.theme] ?? 'blob';
    let bushGeo;
    if (underKind === 'frond') {
      // a low rosette of fronds: wide, flat, overlapping
      bushGeo = new THREE.SphereGeometry(1.15, 7, 3);
      bushGeo.scale(1, 0.3, 1);
    } else if (underKind === 'spray') {
      // bunchgrass: narrow at the base, splaying up and out
      bushGeo = new THREE.ConeGeometry(0.95, 1.5, 6, 1, true);
      bushGeo.translate(0, 0.45, 0);
    } else if (underKind === 'spike') {
      // desert scrub: sparse, angular, twice as tall as it is wide
      bushGeo = new THREE.OctahedronGeometry(0.85, 0);
      bushGeo.scale(0.8, 1.35, 0.8);
    } else {
      bushGeo = new THREE.IcosahedronGeometry(1, 0);
      bushGeo.scale(1, 0.62, 1);
    }
    const bushes = new THREE.InstancedMesh(
      bushGeo,
      new THREE.MeshStandardMaterial({ color: T.bushColor, flatShading: true, roughness: 1,
        side: (underKind === 'spray' || underKind === 'frond') ? THREE.DoubleSide : THREE.FrontSide }),
      T.bushCount
    );
    const B = T.bush;
    const bcolor = new THREE.Color();
    let bk = 0;
    this._scatter(T.bushCount, () => this._trackSidePos(13, 70), (p) => {
      const s = 0.7 + Math.random() * 1.5;
      const by = this.terrainHeight(p.x, p.z) + s * 0.3;
      m4.makeScale(s, s, s);
      m4.setPosition(p.x, by, p.z);
      bushes.setMatrixAt(bk, m4);
      bcolor.setHSL(
        B.h + Math.random() * B.hVar,
        B.s + Math.random() * B.sVar,
        B.l + Math.random() * B.lVar
      );
      // SOFT scenery: cars brush through, spraying leaves — no removal needed
      this.bushes.push({ x: p.x, z: p.z, y: by, r: 1.0 * s, id: bk, lastHit: 0 });
      bushes.setColorAt(bk++, bcolor);
    });
    bushes.count = bk;
    this.group.add(bushes);

    // boulders (snow theme gets white caps on top; volcano gets glossy obsidian)
    // — top-lit via a baked vertex-color gradient, plus a smaller offset lump
    // beside each one so they cluster instead of reading as lone blobs
    const rockRough = T.rockRoughness !== undefined ? T.rockRoughness : 0.9;
    const rockGeo = this._rockGeo || (this._rockGeo = this._topLitRockGeo(0));
    const rockMat = new THREE.MeshStandardMaterial({
      color: T.rockColor, flatShading: true, roughness: rockRough, envMapIntensity: 0.5,
      vertexColors: true,
    });
    const rocks = new THREE.InstancedMesh(rockGeo, rockMat, T.rockCount);
    const lumps = new THREE.InstancedMesh(rockGeo, rockMat, T.rockCount);
    rocks.castShadow = true;
    const caps = T.rockSnowCap
      ? new THREE.InstancedMesh(
          new THREE.DodecahedronGeometry(1, 0),
          new THREE.MeshStandardMaterial({ color: 0xf2f6fa, flatShading: true, roughness: 0.9 }),
          T.rockCount
        )
      : null;
    if (caps) caps.castShadow = true;
    const rcol = new THREE.Color();
    let rk = 0, lk = 0;
    this._scatter(T.rockCount, () => this._trackSidePos(12.5, 90), (p) => {
      let s = 0.5 + Math.random() * 2.2;
      // never let a boulder reach into the carriageway — shrink it to fit, and
      // if it cannot fit, place nothing here at all
      const fit = this._stoneFit(p.x, p.z, s * 0.9);
      if (fit <= 0) return;
      s = Math.min(s, fit / 0.9);
      const sy = s * (0.6 + Math.random() * 0.5);
      const y = this.terrainHeight(p.x, p.z) + s * 0.25;
      // big boulders are SOLID (geometry base radius 1 × instance scale s)
      if (s > 0.9) this.solids.push({ x: p.x, z: p.z, r: s * 0.9, y: y - s * 0.25, mat: 'stone' });
      const rot = Math.random() * Math.PI * 2;
      q.setFromAxisAngle(up, rot);
      m4.compose(new THREE.Vector3(p.x, y, p.z), q, new THREE.Vector3(s, sy, s));
      rocks.setMatrixAt(rk, m4);
      // per-rock tone jitter (multiplies the top-lit vertex gradient)
      rcol.setScalar(0.86 + Math.random() * 0.28);
      rocks.setColorAt(rk, rcol);
      if (caps) {
        m4.compose(
          new THREE.Vector3(p.x, y + sy * 0.55, p.z),
          q, new THREE.Vector3(s * 0.8, sy * 0.4, s * 0.8)
        );
        caps.setMatrixAt(rk, m4);
      }
      // companion lump shoulders most boulders for a clustered, shattered look
      if (s > 0.75 && Math.random() < 0.8) {
        const la = Math.random() * Math.PI * 2;
        const ls = s * (0.3 + Math.random() * 0.25);
        const lx = p.x + Math.cos(la) * s * 0.95, lz = p.z + Math.sin(la) * s * 0.95;
        q.setFromAxisAngle(up, Math.random() * Math.PI * 2);
        m4.compose(
          new THREE.Vector3(lx, this.terrainHeight(lx, lz) + ls * 0.3, lz),
          q, new THREE.Vector3(ls, ls * (0.6 + Math.random() * 0.4), ls)
        );
        lumps.setMatrixAt(lk, m4);
        rcol.setScalar(0.82 + Math.random() * 0.28);
        lumps.setColorAt(lk++, rcol);
      }
      if (s > 0.8) this._addShadow(p.x, p.z, s * 1.5);
      rk++;
    });
    rocks.count = rk;
    lumps.count = lk;
    this.group.add(rocks, lumps);
    if (caps) { caps.count = rk; this.group.add(caps); }

    // small stones scattered right off the road edge
    const pebbles = new THREE.InstancedMesh(rockGeo, rockMat, T.pebbleCount);
    const pcol = new THREE.Color();
    let pk = 0;
    this._scatter(T.pebbleCount, () => this._trackSidePos(11.3, 16), (p) => {
      const s = 0.12 + Math.random() * 0.32;
      q.setFromAxisAngle(up, Math.random() * Math.PI * 2);
      m4.compose(
        new THREE.Vector3(p.x, this.terrainHeight(p.x, p.z) + s * 0.3, p.z),
        q, new THREE.Vector3(s, s * 0.7, s)
      );
      pebbles.setMatrixAt(pk, m4);
      pcol.setScalar(0.85 + Math.random() * 0.3);
      pebbles.setColorAt(pk++, pcol);
    });
    pebbles.count = pk;
    this.group.add(pebbles);

    // one big hero boulder close to the racing line (in the open start bowl on
    // cliff-walled levels, where trackside ground is actually visible).
    // heroRock: false skips it (the neon expressway has no boulders).
    if (T.heroRock === false) return;
    const fallbackP = this.pointAt((N * 0.42) | 0, WALL_OFF + 7);
    const heroP = T.cliffWalls ? this.pointAt(48, -(WALL_OFF + 5.5)) : null;
    const hp = heroP
      ? { x: heroP.x, z: heroP.z }
      : (this._trackSidePos(14, 18) || { x: fallbackP.x, z: fallbackP.z });
    const hero = new THREE.Mesh(this._topLitRockGeo(1), rockMat);
    hero.scale.set(4.6, 3.3, 4.1);
    hero.rotation.y = 1.3;
    hero.position.set(hp.x, this.terrainHeight(hp.x, hp.z) + 0.9, hp.z);
    hero.castShadow = true;
    this.group.add(hero);
    // hero boulder is solid too: footprint radius ≈ (4.6 + 4.1) / 2 = 4.35
    this.solids.push({ x: hp.x, z: hp.z, r: Math.min(4.35 * 0.9, Math.max(0.5, this._stoneFit(hp.x, hp.z, 4.35 * 0.9))), y: this.terrainHeight(hp.x, hp.z), mat: 'stone' });
    this._addShadow(hp.x, hp.z, 5.8);
    if (T.rockSnowCap) {
      const heroCap = new THREE.Mesh(
        new THREE.DodecahedronGeometry(1, 1),
        new THREE.MeshStandardMaterial({ color: 0xf2f6fa, flatShading: true, roughness: 0.9 })
      );
      heroCap.scale.set(3.8, 1.4, 3.4);
      heroCap.rotation.y = 1.3;
      heroCap.position.set(hp.x, hero.position.y + 2.2, hp.z);
      this.group.add(heroCap);
    }

    // flowers sprinkled close to the road
    const flowers = new THREE.InstancedMesh(
      new THREE.SphereGeometry(0.22, 6, 5),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 }),
      T.flowerCount
    );
    const fcolors = T.flowerColors;
    const fc = new THREE.Color();
    let fk = 0;
    this._scatter(T.flowerCount, () => this._trackSidePos(11.8, 42), (p) => {
      m4.makeScale(1, 1, 1);
      m4.setPosition(p.x, this.terrainHeight(p.x, p.z) + 0.22, p.z);
      flowers.setMatrixAt(fk, m4);
      fc.set(fcolors[(Math.random() * fcolors.length) | 0]);
      flowers.setColorAt(fk++, fc);
    });
    flowers.count = fk;
    this.group.add(flowers);
  }

  _buildHuts(m4) {
    if (this.T.hutStyle === 'igloo') return this._buildIgloos(m4);
    const COUNT = this.T.hutCount !== undefined ? this.T.hutCount : 14;
    const wallGeo = new THREE.BoxGeometry(1, 1, 1);
    wallGeo.translate(0, 0.5, 0);
    const roofGeo = new THREE.ConeGeometry(0.85, 0.55, 4);
    roofGeo.rotateY(Math.PI / 4);
    // warm lit windows: the emissive map is black except the panes, so this is
    // one extra texture fetch on ~14 instanced boxes and the huts stop reading
    // as empty crates. `hutGlow` per theme — brightest at dusk (volcano,
    // wildfire, neon) and in snow, where the reference art leans hardest on it.
    const wallMat = new THREE.MeshStandardMaterial({
      map: buildingTexture(), roughness: 0.8, envMapIntensity: 0.5,
      emissive: 0xffffff, emissiveMap: buildingGlowTexture(),
      emissiveIntensity: this.T.hutGlow !== undefined ? this.T.hutGlow : 0.5,
    });
    const roofMat = new THREE.MeshStandardMaterial({
      color: this.T.hutRoof, flatShading: true, roughness: 0.8, envMapIntensity: 0.5,
    });
    const walls = new THREE.InstancedMesh(wallGeo, wallMat, COUNT);
    const roofs = new THREE.InstancedMesh(roofGeo, roofMat, COUNT);
    walls.castShadow = roofs.castShadow = true;
    const q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
    let placed = 0;
    // hutZone [f0, f1] clusters the dwellings into one stretch of the lap (the
    // valley village at the foot of a pass); f0 > f1 wraps through the line
    const makePos = this.T.hutZone
      ? () => this._zonePos(this.T.hutZone, 20, 62)
      : () => this._trackSidePos(24, 64);
    this._scatter(COUNT, makePos, (p) => {
      // SCALE. The car is 4.4 u long and 2.6 u wide, so a 9-15 u hut under a
      // roof scaled to w·1.6 towered over it — the pyramid's flats reached
      // 0.96 w to each side, nearly twice the wall, which is what made the
      // houses read as giant. A cottage is a bit wider than a car is long and
      // about as tall again; the roof gets an eave, not a marquee.
      const w = 6 + Math.random() * 3;
      const h = 3.6 + Math.random() * 1.4;
      const rot = Math.random() * Math.PI * 2;
      const y = this.terrainHeight(p.x, p.z) - 0.6;
      q.setFromAxisAngle(up, rot);
      m4.compose(new THREE.Vector3(p.x, y, p.z), q, new THREE.Vector3(w, h, w));
      walls.setMatrixAt(placed, m4);
      m4.compose(new THREE.Vector3(p.x, y + h, p.z), q, new THREE.Vector3(w * 0.88, h * 0.72, w * 0.88));
      roofs.setMatrixAt(placed, m4);
      // solid hut: walls are a unit box scaled w×w, so half the world-space
      // diagonal of the footprint is w·√2/2
      const solid = { x: p.x, z: p.z, r: (w * Math.SQRT2) / 2, y: y + 0.6, mat: 'hut' };
      this.solids.push(solid);
      // A building is a target, not scenery: register it so cannon rounds and
      // blasts can level it. `parts` carries the instanced meshes and the slot
      // to blank when it comes down. Stone walls soak a lot more than a crate.
      this.buildings.push({
        x: p.x, z: p.z, y, r: w * 0.62, w, h, hp: 120, solid,
        parts: [{ mesh: walls, i: placed }, { mesh: roofs, i: placed }],
        roofColor: this.T.hutRoof,
      });
      this._addShadow(p.x, p.z, w * 0.85);
      placed++;
    });
    walls.count = roofs.count = placed;
    this.group.add(walls, roofs);
  }

  /** Blank a destroyed building's instances and drop its collider, so you can
   *  drive through the rubble afterwards. Returns its debris recipe. */
  smashBuilding(b) {
    if (b.dead) return null;
    b.dead = true;
    const zero = new THREE.Matrix4().makeScale(0, 0, 0);
    for (const p of b.parts) {
      p.mesh.setMatrixAt(p.i, zero);
      p.mesh.instanceMatrix.needsUpdate = true;
    }
    const si = this.solids.indexOf(b.solid);
    if (si >= 0) this.solids.splice(si, 1);
    return b;
  }

  /** Glacial dwellings: white ice-block domes (half-sunk spheres) with a short
   *  entrance tunnel. Same trackside placement + SOLID 'hut' collider as huts. */
  _buildIgloos(m4) {
    const COUNT = this.T.hutCount !== undefined ? this.T.hutCount : 8;
    const domeGeo = new THREE.SphereGeometry(1, 16, 10);
    const tunnelGeo = new THREE.CylinderGeometry(1, 1, 1, 10, 1, false);
    tunnelGeo.rotateX(Math.PI / 2);                 // axis along local Z
    const iceMat = new THREE.MeshStandardMaterial({
      map: iglooTexture(), roughness: 0.75, envMapIntensity: 0.55,
    });
    const doorMat = new THREE.MeshStandardMaterial({ color: 0x22303c, roughness: 1 });
    const domes = new THREE.InstancedMesh(domeGeo, iceMat, COUNT);
    const tunnels = new THREE.InstancedMesh(tunnelGeo, iceMat, COUNT);
    const doors = new THREE.InstancedMesh(new THREE.CircleGeometry(1, 10), doorMat, COUNT);
    domes.castShadow = tunnels.castShadow = true;
    const q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
    let placed = 0;
    // cliff-walled levels: the canyon walls open up around the start line, so
    // the village sits in that bowl where racers actually see it
    const makePos = this.T.cliffWalls
      ? () => {
          const gi = (((Math.random() * 150 - 75) | 0) + N) % N;
          const side = Math.random() < 0.5 ? 1 : -1;
          const p = this.pointAt(gi, side * (15 + Math.random() * 22));
          if (this._distToTrack(p.x, p.z) < 14) return null;
          return { x: p.x, z: p.z };
        }
      : () => this._trackSidePos(18, 52);
    this._scatter(COUNT, makePos, (p) => {
      const R = 3.2 + Math.random() * 1.6;          // dome radius
      const rot = Math.random() * Math.PI * 2;      // entrance direction
      const y = this.terrainHeight(p.x, p.z) - R * 0.35;   // half-sunk into the snow
      q.setFromAxisAngle(up, rot);
      m4.compose(new THREE.Vector3(p.x, y, p.z), q, new THREE.Vector3(R, R * 0.92, R));
      domes.setMatrixAt(placed, m4);
      // entrance tunnel pokes out of the dome along the rotated +Z
      const dx = Math.sin(rot), dz = Math.cos(rot);
      const tr = R * 0.34;
      const tx = p.x + dx * R * 0.92, tz = p.z + dz * R * 0.92;
      m4.compose(new THREE.Vector3(tx, y + R * 0.35 + tr * 0.4, tz), q, new THREE.Vector3(tr, tr, R * 0.7));
      tunnels.setMatrixAt(placed, m4);
      // dark doorway disc capping the tunnel mouth
      m4.compose(
        new THREE.Vector3(tx + dx * R * 0.36, y + R * 0.35 + tr * 0.4, tz + dz * R * 0.36),
        q, new THREE.Vector3(tr * 0.82, tr * 0.82, 1)
      );
      doors.setMatrixAt(placed, m4);
      const solid = { x: p.x, z: p.z, r: R * 0.95, y: y + R * 0.35, mat: 'hut' };
      this.solids.push(solid);
      // ice blocks come apart easier than stone walls
      this.buildings.push({
        x: p.x, z: p.z, y, r: R * 0.95, w: R * 2, h: R, hp: 90, solid,
        parts: [{ mesh: domes, i: placed }, { mesh: tunnels, i: placed }, { mesh: doors, i: placed }],
        roofColor: 0xdfeef8,
      });
      this._addShadow(p.x, p.z, R * 1.3);
      placed++;
    });
    domes.count = tunnels.count = doors.count = placed;
    this.group.add(domes, tunnels, doors);
  }

  _buildTrackside(m4) {
    const q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
    // tire stacks guarding the sharpest corners (2 or 3 tires high)
    const tireGeo = new THREE.TorusGeometry(0.62, 0.3, 8, 14);
    tireGeo.rotateX(Math.PI / 2);
    const tires = new THREE.InstancedMesh(
      tireGeo, new THREE.MeshStandardMaterial({ color: 0x22201c, roughness: 0.95 }), 190
    );
    tires.castShadow = true;
    const tcolor = new THREE.Color();
    let tk = 0;
    for (let i = 0; i < N && tk < 180; i += 6) {
      if (this.curvature[i] > 0.017) {
        // outside of the corner: opposite the direction the tangent is turning
        const a = this.tan[i], b = this.tan[(i + 12) % N];
        const side = (a.x * b.z - a.z * b.x) > 0 ? -1 : 1;
        // cliff-walled levels stack the tires right against the rock face;
        // pass levels tuck them inside the stone parapet
        const tireOff = this.T.cliffWalls ? WALL_OFF + 0.8
          : (this.T.retainingWalls || this.T.guardFence) ? WALL_OFF + 1.2 : WALL_OFF + 2.2;
        const p = this.pointAt(i, tireOff * side);
        const stack = Math.random() < 0.5 ? 3 : 2;
        const ids = [];
        for (let s = 0; s < stack && tk < 180; s++) {
          m4.makeTranslation(p.x + (Math.random() - 0.5) * 0.4, p.y + 0.32 + s * 0.62, p.z + (Math.random() - 0.5) * 0.4);
          tires.setMatrixAt(tk, m4);
          tcolor.set(s === stack - 1 && Math.random() < 0.5 ? 0xd8d2c2 : 0x22201c);
          ids.push(tk);
          tires.setColorAt(tk++, tcolor);
        }
        // one smashable entry per STACK (see smashTireStack)
        if (ids.length) {
          this.tireStacks.push({ x: p.x, z: p.z, y: p.y, r: 1.1, ids, dead: false });
          this._addShadow(p.x, p.z, 1.45, p.y);
        }
      }
    }
    tires.count = tk;
    this._tireMesh = tires;
    this.group.add(tires);

    // hay bales
    const hayCount = this.T.hayCount !== undefined ? this.T.hayCount : 50;
    const hayGeo = new THREE.CylinderGeometry(0.8, 0.8, 1.5, 10);
    hayGeo.rotateZ(Math.PI / 2);
    const hay = new THREE.InstancedMesh(
      hayGeo, new THREE.MeshStandardMaterial({ color: this.T.hayColor, roughness: 1 }), Math.max(hayCount, 1)
    );
    hay.castShadow = true;
    let hk = 0;
    this._scatter(hayCount, () => this._trackSidePos(12.5, 20), (p) => {
      q.setFromAxisAngle(up, Math.random() * Math.PI);
      m4.compose(new THREE.Vector3(p.x, this.terrainHeight(p.x, p.z) + 0.8, p.z), q, new THREE.Vector3(1, 1, 1));
      hay.setMatrixAt(hk++, m4);
      this._addShadow(p.x, p.z, 1.6);
    });
    hay.count = hk;
    this.group.add(hay);
  }

  _buildBanners() {
    // sponsor boards facing the track. NEO-KYOTO swaps in holographic boards:
    // neon sponsor palettes on unlit (MeshBasic) panels so they burn through
    // the night and bloom picks up the lettering.
    const neonStyle = this.T.bannerStyle === 'neon';
    const post = new THREE.CylinderGeometry(0.14, 0.16, 3.4, 7);
    const postMat = new THREE.MeshStandardMaterial({
      color: 0x4a4640, roughness: 0.35, metalness: 0.7, envMapIntensity: 0.5,
    });
    const boardGeo = new THREE.PlaneGeometry(9, 2.2);
    const sponsors = neonStyle ? NEON_SPONSORS : SPONSORS;
    const mats = sponsors.map(([text, bg, fg]) => neonStyle
      ? new THREE.MeshBasicMaterial({ map: bannerTexture(text, bg, fg), side: THREE.DoubleSide })
      : new THREE.MeshStandardMaterial({ map: bannerTexture(text, bg, fg), roughness: 0.8, side: THREE.DoubleSide }));
    // cliff-walled levels stand the boards right at the rock face so they stay
    // inside the canyon instead of vanishing behind it; pass levels stand them
    // clear of the stone parapet
    const boardOff = this.T.cliffWalls ? WALL_OFF + 0.75
      : (this.T.retainingWalls || this.T.guardFence) ? WALL_OFF + 6.4 : WALL_OFF + 3.6;
    for (let b = 0; b < 10; b++) {
      const i = ((b + 0.5) * N / 10) | 0;
      if (this.curvature[i] > this.T.boardMaxCurv) continue; // keep boards off tight corners
      const side = b % 2 === 0 ? 1 : -1;
      const p = this.pointAt(i, boardOff * side);
      const g = new THREE.Group();
      const board = new THREE.Mesh(boardGeo, mats[b % mats.length]);
      board.position.y = 2.6;
      board.castShadow = true;
      g.add(board);
      for (const s of [-1, 1]) {
        const pl = new THREE.Mesh(post, postMat);
        pl.position.set(s * 4, 1.7, -0.1);
        g.add(pl);
      }
      g.position.set(p.x, this.terrainHeight(p.x, p.z), p.z);
      g.rotation.y = this.headingAt(i) + (side > 0 ? Math.PI : 0);
      this.group.add(g);
      this.banners.push({
        x: p.x, z: p.z, y: g.position.y, r: 1.3, dead: false,
        group: g, board, heading: g.rotation.y,
      });
      this._addShadow(p.x, p.z, 3.2);
    }
  }

  /** Knock sponsor board `b` down: hide the standing group and hand back one
   *  standalone board+post group for the game to fling. Null if already dead. */
  smashBanner(b) {
    if (!b || b.dead) return null;
    b.dead = true;
    // guard-fence bay: zero its instance and hand back a loose bay to fling
    if (b.kind === 'fence') {
      if (!this._guardFenceMesh) return null;
      _m4.makeScale(0, 0, 0);
      this._guardFenceMesh.setMatrixAt(b.id, _m4);
      this._guardFenceMesh.instanceMatrix.needsUpdate = true;
      const bay = new THREE.Mesh(this._guardFenceGeo, this._guardFenceMat);
      bay.castShadow = true;
      bay.position.set(b.x, b.y, b.z);
      bay.rotation.y = b.heading;
      return bay;
    }
    b.group.visible = false;
    const g = new THREE.Group();
    const board = new THREE.Mesh(b.board.geometry, b.board.material);
    board.position.y = 2.6;
    g.add(board);
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.16, 3.4, 7),
      new THREE.MeshStandardMaterial({ color: 0x4a4640, roughness: 0.6, metalness: 0.5 })
    );
    post.position.set(0, 1.7, -0.1);
    g.add(post);
    g.position.set(b.x, b.y, b.z);
    g.rotation.y = b.heading;
    return g;
  }

  /** Smash tire stack `st`: zero its instances and hand back 2-3 loose tire
   *  meshes (NOT added to the scene) for the game to fling. Null if dead. */
  smashTireStack(st) {
    if (!st || st.dead || !this._tireMesh) return null;
    st.dead = true;
    _m4.makeScale(0, 0, 0);
    for (const id of st.ids) this._tireMesh.setMatrixAt(id, _m4);
    this._tireMesh.instanceMatrix.needsUpdate = true;
    if (!this._looseTireGeo) {
      this._looseTireGeo = new THREE.TorusGeometry(0.62, 0.3, 6, 10);
      this._looseTireGeo.rotateX(Math.PI / 2);
      this._looseTireMat = new THREE.MeshStandardMaterial({ color: 0x22201c, roughness: 0.95 });
    }
    return st.ids.map((id, k) => {
      const m = new THREE.Mesh(this._looseTireGeo, this._looseTireMat);
      m.castShadow = true;
      m.position.set(st.x, st.y + 0.32 + k * 0.62, st.z);
      return m;
    });
  }

  _buildGrandstand() {
    // stepped stand full of spectators near the start line
    const i = (N - 40 + N) % N;
    const p = this.pointAt(i, WALL_OFF + 16);
    const g = new THREE.Group();
    const crowd = crowdTexture();
    const frame = new THREE.MeshStandardMaterial({ color: 0x5d4426, roughness: 0.9 });
    for (let row = 0; row < 3; row++) {
      const step = new THREE.Mesh(
        new THREE.BoxGeometry(20, 2.2, 3.2),
        new THREE.MeshStandardMaterial({ map: crowd, roughness: 1 })
      );
      step.position.set(0, 1.1 + row * 1.9, row * 3.0);
      step.castShadow = true;
      g.add(step);
    }
    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(21, 0.35, 9),
      new THREE.MeshStandardMaterial({ map: awningTexture(), roughness: 0.9 })
    );
    roof.material.map.repeat.set(6, 1);
    roof.position.set(0, 8.6, 3.2);
    roof.rotation.x = 0.14;
    roof.castShadow = true;
    g.add(roof);
    for (const [ox, oz] of [[-9.8, -0.5], [9.8, -0.5], [-9.8, 7.2], [9.8, 7.2]]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.5, 8.6, 0.5), frame);
      leg.position.set(ox, 4.3, oz);
      g.add(leg);
    }
    g.position.copy(p);
    // width runs along the track; step rows climb away from it
    g.rotation.y = this.headingAt(i) + Math.PI / 2;
    this.group.add(g);
    // 3 solid colliders along the 20-unit front face (which runs with the track)
    for (const off of [-7, 0, 7]) {
      this.solids.push({
        x: p.x + this.tan[i].x * off,
        z: p.z + this.tan[i].z * off,
        r: 2.5, y: p.y, mat: 'metal',
      });
    }
  }

  /** Wooden plank foot-bridges spanning the canyon overhead. Deck sits at
   *  y=9 — well above the max ramp-jump apex — so cars never clip it. */
  _buildBridges() {
    const count = this.T.bridgeCount | 0;
    if (!count) return;
    const chosen = [];
    for (let i = 60; i < N && chosen.length < count; i += 10) {
      if (this._circDist(i, 0) < 120) continue;                 // clear of the start bowl
      if (this.curvature[i] > 0.02) continue;
      if (this.ramps.some((r) => this._circDist(i, r.index) < 45)) continue;
      if (chosen.some((c) => this._circDist(i, c) < 200)) continue;
      chosen.push(i);
    }
    const span = (WALL_OFF + 4.5) * 2;                          // ends embed into the cliffs
    const deckTex = plankTexture();
    deckTex.repeat.set(9, 1);
    const deckMat = new THREE.MeshStandardMaterial({
      map: deckTex, roughness: 0.8, envMapIntensity: 0.5,
    });
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x6a4a2c, roughness: 0.8, envMapIntensity: 0.5,
    });
    const ropeMat = new THREE.MeshStandardMaterial({ color: 0x8a7048, roughness: 1 });
    for (const i of chosen) {
      const c = this.center[i];
      const g = new THREE.Group();
      const deck = new THREE.Mesh(new THREE.BoxGeometry(span, 0.35, 3.2), deckMat);
      deck.position.y = 9;
      deck.castShadow = deck.receiveShadow = true;
      g.add(deck);
      // under-beams
      for (const s of [-1, 1]) {
        const beam = new THREE.Mesh(new THREE.BoxGeometry(span, 0.28, 0.5), woodMat);
        beam.position.set(0, 8.75, s * 1.15);
        g.add(beam);
      }
      // rope rails on short posts down both edges of the deck
      for (const s of [-1, 1]) {
        for (const ry of [9.6, 10.1]) {
          const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, span, 5), ropeMat);
          rope.rotation.z = Math.PI / 2;
          rope.position.set(0, ry, s * 1.45);
          g.add(rope);
        }
        for (let px = -span / 2 + 1.2; px <= span / 2 - 1.1; px += 3.4) {
          const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 1.25, 6), woodMat);
          post.position.set(px, 9.75, s * 1.45);
          g.add(post);
        }
      }
      g.position.set(c.x, c.y, c.z);      // deck rides at road y + 9, above any jump
      g.rotation.y = this.headingAt(i);   // local X = road normal → deck spans the canyon
      this.group.add(g);
    }
  }

  /** One small palm oasis pond, well off-track. */
  _buildOasis() {
    // hunt for a reasonably flat spot away from the road
    let spot = null;
    for (let tries = 0; tries < 60 && !spot; tries++) {
      const p = this._trackSidePos(34, 58);
      if (!p) continue;
      const h0 = this.terrainHeight(p.x, p.z);
      let flat = true;
      for (const [dx, dz] of [[7, 0], [-7, 0], [0, 7], [0, -7]]) {
        if (Math.abs(this.terrainHeight(p.x + dx, p.z + dz) - h0) > 0.9) { flat = false; break; }
      }
      if (flat) spot = { x: p.x, z: p.z, y: h0 };
    }
    if (!spot) {
      const p = this.pointAt((N * 0.3) | 0, 40);
      spot = { x: p.x, z: p.z, y: this.terrainHeight(p.x, p.z) };
    }
    // pond: darker wet-mud rim under a blue water ellipse
    const rim = new THREE.Mesh(
      new THREE.CircleGeometry(1, 26),
      new THREE.MeshStandardMaterial({ color: 0x6a4a2c, roughness: 0.9 })
    );
    rim.rotation.x = -Math.PI / 2;
    rim.scale.set(8.6, 6.4, 1);
    rim.position.set(spot.x, spot.y + 0.3, spot.z);
    this.group.add(rim);
    const water = new THREE.Mesh(
      new THREE.CircleGeometry(1, 26),
      new THREE.MeshStandardMaterial({ color: 0x2e86c8, roughness: 0.15, metalness: 0.1 })
    );
    water.rotation.x = -Math.PI / 2;
    water.scale.set(7.2, 5.2, 1);
    water.position.set(spot.x, spot.y + 0.38, spot.z);
    this.group.add(water);
    // palms leaning over the water
    const up = new THREE.Vector3(0, 1, 0);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8a6242, roughness: 1 });
    const frondMat = new THREE.MeshStandardMaterial({
      color: 0x2f8a3c, flatShading: true, roughness: 0.9, side: THREE.DoubleSide,
    });
    const leafGeo = new THREE.ConeGeometry(0.5, 2.6, 4);
    leafGeo.rotateZ(-Math.PI / 2);       // axis → +x
    leafGeo.translate(1.15, 0, 0);
    leafGeo.scale(1, 0.28, 0.75);        // flattened frond
    const nPalms = 2 + (Math.random() < 0.5 ? 1 : 0);
    for (let pi = 0; pi < nPalms; pi++) {
      const ang = (pi / nPalms) * Math.PI * 2 + Math.random() * 0.8;
      const px = spot.x + Math.cos(ang) * (7.6 + Math.random() * 1.5);
      const pz = spot.z + Math.sin(ang) * (5.8 + Math.random() * 1.5);
      const g = new THREE.Group();
      const leanDir = Math.atan2(spot.z - pz, spot.x - px);   // lean toward the water
      let tip = new THREE.Vector3(0, 0, 0);
      let tiltA = 0;
      for (let s = 0; s < 3; s++) {
        tiltA += 0.16 + Math.random() * 0.06;
        const len = 1.6;
        const dir = new THREE.Vector3(
          Math.sin(tiltA) * Math.cos(leanDir), Math.cos(tiltA), Math.sin(tiltA) * Math.sin(leanDir)
        );
        const seg = new THREE.Mesh(
          new THREE.CylinderGeometry(0.14 + (2 - s) * 0.035, 0.17 + (2 - s) * 0.035, len, 6),
          trunkMat
        );
        seg.position.copy(tip).addScaledVector(dir, len / 2);
        seg.quaternion.setFromUnitVectors(up, dir);
        seg.castShadow = true;
        g.add(seg);
        tip.addScaledVector(dir, len * 0.96);
      }
      const nLeaves = 5 + (Math.random() < 0.5 ? 1 : 0);
      for (let k = 0; k < nLeaves; k++) {
        const leaf = new THREE.Mesh(leafGeo, frondMat);
        leaf.position.copy(tip);
        const q1 = new THREE.Quaternion().setFromAxisAngle(up, (k / nLeaves) * Math.PI * 2 + Math.random() * 0.5);
        const q2 = new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(0, 0, 1), -0.45 - Math.random() * 0.3
        );
        leaf.quaternion.copy(q1).multiply(q2);
        g.add(leaf);
      }
      // coconuts
      for (let k = 0; k < 2; k++) {
        const nut = new THREE.Mesh(
          new THREE.SphereGeometry(0.17, 6, 5),
          new THREE.MeshStandardMaterial({ color: 0x6a4a26, roughness: 1 })
        );
        nut.position.copy(tip).add(new THREE.Vector3((Math.random() - 0.5) * 0.5, -0.25, (Math.random() - 0.5) * 0.5));
        g.add(nut);
      }
      const s = 0.9 + Math.random() * 0.5;
      g.scale.setScalar(s);
      g.position.set(px, spot.y + 0.25, pz);
      this.group.add(g);
    }
  }

  /** Jungle streams: blue water ribbons with foam-painted banks, meandering
   *  across the circuit slightly BELOW road level (the road bridges over).
   *  Each river threads through one of the road's mud puddles — that puddle
   *  IS the crossing hazard, so the existing puddle mechanic covers it. */
  /** Build the one continuous waterway planned by _planRiver: a shoreline band
   *  laid in the carved bed, the water ribbon inside it (lifting to a shallow
   *  sheet where it washes across the road at a ford), reeds along the margin
   *  and a scatter of rocks breaking the surface.
   *
   *  BUDGET — four extra draw calls and roughly 5 k triangles for the whole
   *  world, which is less than the two throwaway 64-segment ford quads this
   *  replaces plus the reeds. Everything is one mesh or one InstancedMesh; the
   *  water is a single strip, not a per-crossing patch. */
  _buildRiver() {
    const R = this._river;
    const curve = R.curve;
    const total = curve.getLength();
    // Density, not a fixed budget: the reach is now ~5.5 km end to end because
    // both tails run past the world edge, and the old cap of 230 would have
    // stretched those segments to 24 u — coarsening the water right where you
    // drive through it to pay for geometry out in the fog.
    const SEGS = Math.max(90, Math.min(460, Math.round(total / 13)));
    const waterTex = riverTexture();
    waterTex.anisotropy = 4;
    const bankTex = riverBankTexture(this.T.riverBank);
    bankTex.anisotropy = 4;
    bankTex.repeat.set(1, 1);

    // sample once; both ribbons and all the dressing reuse these frames
    const F = [];
    for (let s = 0; s <= SEGS; s++) {
      const t = s / SEGS;
      const p = curve.getPointAt(t);
      const tn = curve.getTangentAt(t);
      const nx = tn.z, nz = -tn.x;
      // width breathes a little so the reach never reads as a canal
      const wob = 1 + 0.24 * Math.sin(t * 41 + 0.7) + 0.12 * Math.sin(t * 17.3);
      const df = this._distToTrackCoarse(p.x, p.z);
      F.push({ t, x: p.x, z: p.z, nx, nz, w: R.half * wob, df });
    }

    const strip = (cols, yFor, uvFor, alphaFor) => {
      const C = cols.length;
      const verts = new Float32Array((SEGS + 1) * C * 3);
      const uvs = new Float32Array((SEGS + 1) * C * 2);
      const colA = new Float32Array((SEGS + 1) * C * 4);
      const idx = [];
      for (let s = 0; s <= SEGS; s++) {
        const f = F[s];
        for (let c = 0; c < C; c++) {
          const off = cols[c] * f.w;
          const vx = f.x + f.nx * off, vz = f.z + f.nz * off;
          const o = (s * C + c) * 3;
          verts[o] = vx; verts[o + 1] = yFor(f, off, vx, vz); verts[o + 2] = vz;
          const u = (s * C + c) * 2;
          const uv = uvFor(f, c, C);
          uvs[u] = uv[0]; uvs[u + 1] = uv[1];
          const q = (s * C + c) * 4;
          colA[q] = colA[q + 1] = colA[q + 2] = 1;
          colA[q + 3] = alphaFor(f, c, C);
        }
      }
      for (let s = 0; s < SEGS; s++) {
        for (let c = 0; c < C - 1; c++) {
          const a = s * C + c, b = a + 1, d = (s + 1) * C + c, e = d + 1;
          // WINDING: columns run along +normal and rows along +tangent, and
          // n × t points DOWN — so the naive (a,b,d) order builds the ribbon
          // face-down and FrontSide materials cull it away entirely. Reversed.
          idx.push(a, d, b, b, d, e);
        }
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
      geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
      geo.setAttribute('color', new THREE.BufferAttribute(colA, 4));
      geo.setIndex(idx);
      geo.computeVertexNormals();
      return geo;
    };

    // --- shoreline: pebbles/mud from the waterline out over the bank top ---
    const BANK = (R.half + R.bank) / R.half;
    const bankGeo = strip(
      [-BANK, -1.02, 1.02, BANK],
      (f, off, vx, vz) => this.terrainHeight(vx, vz) + 0.05,
      (f, c) => [f.t * (total / 26), c === 0 ? 0 : c === 1 ? 0.42 : c === 2 ? 0.58 : 1],
      // outer columns feather into the grass; the whole band also fades out
      // across the road so the ford stays clean water on the carriageway
      (f, c, C) => (c === 0 || c === C - 1 ? 0 : 1)
        * THREE.MathUtils.smoothstep(f.df, 9, 20)
        // ...and the shoreline fades out with the water at the tails
        * Math.min(smoothstep01(f.t / 0.06), smoothstep01((1 - f.t) / 0.06))
    );
    const bank = new THREE.Mesh(bankGeo, new THREE.MeshStandardMaterial({
      map: bankTex, roughness: 1, vertexColors: true, transparent: true,
      depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    }));
    bank.name = 'river-bank';
    bank.receiveShadow = true;
    this.group.add(bank);

    // --- water: sits IN the bed, rises to a shallow sheet over the ford ---
    const waterY = (f, off, vx, vz) => {
      const lift = 1 - THREE.MathUtils.smoothstep(f.df, 10, 26);
      // LEVEL ACROSS THE WIDTH. Sampling the bed under each vertex made the
      // surface follow the ground sideways, so on any slope the river banked
      // over like a tilted tray and its edge climbed out onto the grass. Real
      // water is level bank to bank and only falls along its length, so the
      // height comes from the flow profile and the same value is used right
      // across the ribbon. Reading the profile rather than the mesh also means
      // the surface cannot be sliced up by whatever the hill noise is doing.
      const bed = R.bed ? R.bed[this._riverNearest(f.x, f.z).k] : this.terrainHeight(f.x, f.z);
      const open = bed + R.depth * 0.42;      // partway up the carved channel
      if (lift <= 0) return open;
      // ACROSS THE ROAD THE WASH SITS ON THE DECK, NOT ON THE BED.
      //
      // "just proud of the deck" was measured from the river bed, and the road
      // deck is metres above the carved channel — at every ford on AMAZON
      // RAPIDS the water surface came out 1.3 to 3.0 u BELOW the road, and 8.3 u
      // below it on LOG FLUME. So the water was buried inside the road mesh and
      // a crossing rendered as two white foam lines with dry dirt between them:
      // an unexplained stripe across the carriageway rather than a stream.
      _clearV.set(f.x, 0, f.z);
      const deck = this.center[this.nearestIndex(_clearV)].y;
      return open * (1 - lift) + (deck + 0.05) * lift;
    };
    const waterGeo = strip(
      [-1, -0.35, 0.35, 1],
      waterY,
      (f, c, C) => [f.t * (total / 18), c / (C - 1)],
      // Fade the last stretch of each tail to nothing. The reach now runs well
      // past the fog, but a hard-edged rectangle of water is the exact thing
      // that reads as "the river stops here" if one ever does come into view.
      (f) => Math.min(smoothstep01(f.t / 0.06), smoothstep01((1 - f.t) / 0.06))
    );
    const water = new THREE.Mesh(waterGeo, new THREE.MeshStandardMaterial({
      map: waterTex, roughness: 0.18, metalness: 0.06, side: THREE.DoubleSide,
      transparent: true, opacity: 0.9, vertexColors: true, depthWrite: false,
    }));
    water.name = 'river-water';
    water.renderOrder = 1;
    water.receiveShadow = true;
    this.group.add(water);

    // --- margin dressing: reeds along the bank, boulders in the stream ---
    const q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
    const m4 = new THREE.Matrix4(), v3 = new THREE.Vector3();
    const reedGeo = new THREE.ConeGeometry(0.5, 1, 4);
    reedGeo.translate(0, 0.5, 0);
    const reeds = new THREE.InstancedMesh(reedGeo, new THREE.MeshStandardMaterial({
      color: this.T.reedColor !== undefined ? this.T.reedColor : 0x6f8a3e,
      flatShading: true, roughness: 1,
    }), 160);
    reeds.count = 0;
    const rockGeo = this._rockGeo || (this._rockGeo = this._topLitRockGeo(0));
    const rocks = new THREE.InstancedMesh(rockGeo, new THREE.MeshStandardMaterial({
      color: this.T.rockColor, flatShading: true, roughness: 0.9, vertexColors: true,
    }), 40);
    rocks.count = 0;
    rocks.castShadow = true;
    const put = (im, x, y, z, rot, sx, sy, sz) => {
      if (im.count >= im.instanceMatrix.count) return;
      q.setFromAxisAngle(up, rot);
      m4.compose(v3.set(x, y, z), q, new THREE.Vector3(sx, sy, sz));
      im.setMatrixAt(im.count++, m4);
    };
    for (let s = 2; s < SEGS - 2; s += 2) {
      const f = F[s];
      if (f.df < 22) continue;                       // keep the ford approach clear
      for (const sl of [1, -1]) {
        if (Math.random() > 0.5) continue;
        const off = f.w * (1.05 + Math.random() * 0.5);
        const x = f.x + f.nx * off * sl, z = f.z + f.nz * off * sl;
        const y = this.terrainHeight(x, z);
        const h = 0.9 + Math.random() * 1.5;
        put(reeds, x, y - 0.1, z, Math.random() * 3.14, 0.5 + Math.random() * 0.3, h, 0.5);
      }
      if (Math.random() < 0.16) {
        const off = f.w * (Math.random() - 0.5) * 1.2;
        const x = f.x + f.nx * off, z = f.z + f.nz * off;
        const sc = 0.5 + Math.random() * 0.7;
        put(rocks, x, this.terrainHeight(x, z) + sc * 0.3, z, Math.random() * 3.14, sc, sc * 0.8, sc);
      }
    }
    if (reeds.count) { reeds.instanceMatrix.needsUpdate = true; this.group.add(reeds); }
    if (rocks.count) { rocks.instanceMatrix.needsUpdate = true; this.group.add(rocks); }
  }

  _buildRivers() {
    const count = Math.min(this.T.riverCount | 0, this.puddles.length);
    if (!count) return;
    // pick well-separated puddles as crossing points
    const cross = [];
    for (const pd of this.puddles) {
      if (cross.length >= count) break;
      if (cross.some((c) => Math.hypot(c.x - pd.x, c.z - pd.z) < 140)) continue;
      cross.push(pd);
    }
    const tex = riverTexture();
    tex.anisotropy = 4;
    const mat = new THREE.MeshStandardMaterial({
      map: tex, roughness: 0.2, metalness: 0.05, side: THREE.DoubleSide,
    });
    const tmp = new THREE.Vector3();
    for (const pd of cross) {
      const ci = this.nearestIndex(tmp.set(pd.x, 0, pd.z));
      const n = this.nrm[ci], tg = this.tan[ci];
      // meandering path perpendicular to the road; dead straight at the crossing
      const pts = [];
      for (let s = -5; s <= 5; s++) {
        const d = s * 15;
        const sway = Math.sin(s * 1.25 + ci * 0.7) * 9 * Math.min(1, Math.abs(s) / 2.2);
        pts.push(new THREE.Vector3(pd.x + n.x * d + tg.x * sway, 0, pd.z + n.z * d + tg.z * sway));
      }
      const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
      const SEGS = 64, HALF = 3.2;
      const verts = new Float32Array((SEGS + 1) * 2 * 3);
      const uvs = new Float32Array((SEGS + 1) * 2 * 2);
      const idx = [];
      for (let s = 0; s <= SEGS; s++) {
        const t = s / SEGS;
        const p = curve.getPointAt(t);
        const tn = curve.getTangentAt(t);
        // floats above the (coarsely tessellated) terrain in the open, and
        // dips just below the road deck through the crossing
        const df = this._distToTrackCoarse(p.x, p.z);
        const y = this.terrainHeight(p.x, p.z) - 0.12
          + 0.45 * THREE.MathUtils.smoothstep(df, 11, 17);
        // banks taper into the undergrowth at both ends
        const wv = HALF * (0.3 + 0.7 * Math.sqrt(Math.sin(Math.PI * t)));
        const o = s * 6;
        verts[o] = p.x + tn.z * wv; verts[o + 1] = y; verts[o + 2] = p.z - tn.x * wv;
        verts[o + 3] = p.x - tn.z * wv; verts[o + 4] = y; verts[o + 5] = p.z + tn.x * wv;
        uvs[s * 4] = t * 6; uvs[s * 4 + 1] = 0;
        uvs[s * 4 + 2] = t * 6; uvs[s * 4 + 3] = 1;
      }
      for (let s = 0; s < SEGS; s++) {
        const a = s * 2, b = s * 2 + 1, c = s * 2 + 2, d2 = s * 2 + 3;
        idx.push(a, b, c, b, d2, c);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
      geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
      geo.setIndex(idx);
      geo.computeVertexNormals();
      const mesh = new THREE.Mesh(geo, mat);
      mesh.receiveShadow = true;
      this.group.add(mesh);
    }
  }

  /** Per-frame ambient animation: waving flags, drifting clouds. */
  update(dt, time) {
    for (const f of this.animated.flags) {
      f.mesh.rotation.y = Math.sin(time * 5 + f.phase) * 0.35 + Math.sin(time * 1.7 + f.phase) * 0.2;
    }
    for (const c of this.animated.clouds) {
      c.sprite.position.x += c.speed * dt;
      if (c.sprite.position.x > 1100) c.sprite.position.x = -1100;
    }
  }

  /** Tear the whole world down so another one can be built in its place
   *  without reloading the page. Everything the track made lives under
   *  `this.group`, so this is one detach plus a walk to free GPU memory —
   *  geometries and textures are NOT garbage collected on their own, and a
   *  player hopping between tracks would otherwise leak a world each time.
   *
   *  Shared module-level assets (the prop geometry cache, the texture makers'
   *  memoised canvases) are deliberately left alone: they are reused by the
   *  next world and disposing them would cost a rebuild for nothing. */
  dispose() {
    disposeSubtree(this.group);
    this.scene.remove(this.group);
    // drop the world-sized lookup tables too — these are the big retained
    // arrays (900 centreline samples, every collider, the river grid)
    this.solids = []; this.buildings = []; this.trees = []; this.props = [];
    this.tireStacks = []; this.banners = [];
    this._river = null;
    this.disposed = true;
  }
}
