// Procedural race circuits + rich themed worlds around them.
// Five levels share one Track class: the level's theme picks the circuit layout
// and every color in the world (terrain, sky, vegetation, road tint, lighting).
import * as THREE from 'three';
import {
  roadTexture, wallTexture, groundTexture, buildingTexture,
  chevronTexture, checkerTexture, glowTexture, cloudTexture,
  grassTexture, bannerTexture, hazardTexture, crowdTexture, awningTexture,
  finishBannerTexture, cliffTexture, puddleTexture, plankTexture,
  crateTexture, coneTexture, barrelTexture,
} from './textures.js';

export const LEVELS = [
  { id: 1, name: 'PINE VALLEY',  theme: 'forest' },
  { id: 2, name: 'DUST CANYON',  theme: 'desert' },
  { id: 3, name: 'FROST PEAK',   theme: 'snow' },
  { id: 4, name: 'CANYON RUN',   theme: 'canyon' },
  { id: 5, name: 'EMBER PASS',   theme: 'volcano' },
];

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
};

// Every color and density knob per theme. `fogColor…sunIntensity` are exposed
// to main.js via `track.theme`; the rest is internal art direction.
const THEMES = {
  forest: {
    // lighting / fog (plain numbers; also applied to scene.fog by Track itself)
    fogColor: 0xcfe8f5, fogNear: 320, fogFar: 1500,
    hemiSky: 0xbfe0ff, hemiGround: 0x5a8a3c,
    sunColor: 0xfff3d6, sunIntensity: 2.0,
    // sky dome + sun sprite + clouds
    skyTop: '#3f8de0', skyHorizon: '#e8f0d8', sunGlow: 0xfff2b8,
    cloudCount: 12, cloudOpacity: 0.9,
    // terrain vertex colors + ground texture
    terrainLow: '#4f8a35', terrainHigh: '#83b455', terrainDirt: '#9c7a48',
    ground: {},  // groundTexture defaults are the forest palette
    road: {},    // roadTexture defaults are the forest palette
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
    // ambient drifting weather particles (recipe implemented by particles.js)
    weather: { type: 'leaves', color: 0x9ab84a },
    // elevation profile: amplitude + deterministic per-octave phases
    elev: { amp: 8, ph: [0.9, 2.6, 4.2] },
    // per-level gameplay-placement tuning
    rampMaxCurv: 0.014, padMaxCurv: 0.004, boardMaxCurv: 0.012,
  },
  desert: {
    fogColor: 0xf2ddb6, fogNear: 280, fogFar: 1350,
    hemiSky: 0xffe9c4, hemiGround: 0xc9a86a,
    sunColor: 0xffe6b0, sunIntensity: 2.2,
    skyTop: '#6fa8d8', skyHorizon: '#ffd9a0', sunGlow: 0xffdca0,
    cloudCount: 5, cloudOpacity: 0.55,
    terrainLow: '#c9a86a', terrainHigh: '#e2c78e', terrainDirt: '#b06e3c',
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
    treeCount: 90, trunkColor: 0x7a5230,
    foliageLow: 0x8a7444, foliageTop: 0x967e4a,
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
    fogColor: 0xe2edf6, fogNear: 240, fogFar: 1250,
    hemiSky: 0xdfeaf8, hemiGround: 0xb8c6d2,
    sunColor: 0xeaf2ff, sunIntensity: 1.7,
    skyTop: '#639fd8', skyHorizon: '#eaf3fa', sunGlow: 0xffffff,
    cloudCount: 9, cloudOpacity: 0.95,
    terrainLow: '#dde8ee', terrainHigh: '#ffffff', terrainDirt: '#b7c4cd',
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
    hemiSky: 0xffd9a8, hemiGround: 0xb5764a,
    sunColor: 0xffc98a, sunIntensity: 2.1,
    skyTop: '#6f95c0', skyHorizon: '#ffcf96', sunGlow: 0xffc070,
    cloudCount: 4, cloudOpacity: 0.5,
    terrainLow: '#c08050', terrainHigh: '#e0a870', terrainDirt: '#8f5430',
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
    cliffWalls: true, horizon: 'mesa', bridgeCount: 3, oasis: true,
    obstacleSpec: { count: 6, style: 'hoodoo' }, puddleCount: 5,
  },
  // EMBER PASS: charred basalt world — dark ash road, glowing ground fissures,
  // obsidian rocks, bare burnt trees, red-black mountains, dim ember light.
  volcano: {
    fogColor: 0x4a322a, fogNear: 230, fogFar: 1050,
    hemiSky: 0xc98a66, hemiGround: 0x4a3a32, hemiIntensity: 1.05,  // ember dusk, but readable
    sunColor: 0xff8a4a, sunIntensity: 2.0,
    skyTop: '#341a28', skyHorizon: '#dd541c', sunGlow: 0xff6a28, skyCurve: 0.72,
    cloudCount: 7, cloudOpacity: 0.35, cloudTint: 0x8a6a58,
    terrainLow: '#322c28', terrainHigh: '#564a40', terrainDirt: '#6a3c2c',
    ground: {
      base: '#332e2a', bandLight: 'rgba(255,255,255,0.03)', bandDark: 'rgba(0,0,0,0.06)',
      patchA: 'rgba(18,14,12,0.22)', patchB: 'rgba(96,74,58,0.14)',
      speckA: 'rgba(255,140,60,0.9)', speckB: 'rgba(165,155,145,0.7)', speckCount: 70,
      veins: { color: '#ff7a22', glow: 'rgba(255,96,20,0.30)', count: 7 },  // ember cracks
    },
    road: {
      base: '#3c3835', mottleA: [40, 36, 34], mottleB: [88, 82, 78],
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
    rockColor: 0x201c22, rockSnowCap: false, rockRoughness: 0.4,  // glossy obsidian
    flowerCount: 0, flowerColors: ['#ff7a22'],
    hutRoof: 0x4a3a30, hayColor: 0x8a6a3a, hutCount: 4, hayCount: 0,
    splinter: [0x3a3634, 0xff5e2e],                     // basalt + ember chips
    weather: { type: 'embers', color: 0xff7a2e },
    elev: { amp: 12, ph: [4.1, 2.8, 0.7] },             // heaving lava-field climbs
    rampMaxCurv: 0.02, padMaxCurv: 0.006, boardMaxCurv: 0.016,
    obstacleSpec: { count: 4, style: 'basalt' }, puddleCount: 0,
  },
};

const N = 900;              // centerline samples
export const ROAD_HALF = 9; // drivable half-width
export const WALL_OFF = 10.4;

const SPONSORS = [
  ['AETHER', '#14243a', '#7fd4ff'],
  ['HYPER-FLUX', '#2a1436', '#ff7fd4'],
  ['CLAW TIRES', '#1c1812', '#e8b83a'],
  ['VOLT FUEL', '#26300f', '#d4ff5e'],
  ['RALLY CO.', '#3a1414', '#ffd4c2'],
];

// ---------- destructible prop catalog ----------
// Per-theme mix of smashable roadside props ([type, count]); every level totals
// well under 60 individual meshes. Geometry (and theme-independent materials)
// are shared module-wide — each prop is still its own cheap Mesh/Group so the
// game code can knock it flying individually.
const PROP_SPECS = {
  forest: [['hay', 18], ['crate', 12], ['cone', 10]],
  desert: [['crate', 12], ['cone', 10], ['barrel', 14]],
  snow: [['snowman', 12], ['crate', 12], ['cone', 10]],
  canyon: [['crate', 12], ['barrel', 10], ['cone', 10], ['rock', 6]],
  volcano: [['barrel', 14], ['crate', 12], ['cone', 10]],
};
const PROP_SCORE = { cone: 25, crate: 50, hay: 40, barrel: 60, snowman: 75, rock: 20 };
const PROP_PICKUPS = ['health', 'missile', 'nitro', 'mine'];
// theme tints for the barrel drum texture
const BARREL_PALETTES = {
  desert: { base: '#c29a5c', hoop: '#4a3620' },
  canyon: { base: '#9a6440', hoop: '#33291e' },
  volcano: { base: '#37322e', hoop: '#191512', stripe: '#e8381e' },
};

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
      // [hexA, hexB] debris chip colors for fence/cliff scrape particles
      splinter: T.splinter,
      // ambient weather particle recipe for this level: { type, color }
      weather: T.weather,
    };
    // levels are self-contained: fog is set here (main.js may re-apply from theme)
    scene.fog = new THREE.Fog(T.fogColor, T.fogNear, T.fogFar);

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

    this._checkLayout();

    this.animated = { flags: [], clouds: [] };
    // World-space circle colliders for on-road obstacles: [{x, z, r}].
    // Always present; [] on levels without obstacles. Consumed by car physics.
    this.obstacles = [];
    // World-space mud puddles on the road: [{x, z, r}]. Always present; [] on
    // levels without them. Visual decals here — driving effects live elsewhere.
    this.puddles = [];
    // Destructible roadside props: [{mesh, x, z, r, type, scoreValue, pickup}].
    // Always present. The game code detects car contact, removes the entry and
    // animates the mesh flying away itself; `pickup` is a type string on the
    // crates that carry a reward (else null).
    this.props = [];
    // Soft world radius for free-roam driving; the game turns players around
    // once they wander past it.
    this.worldBounds = 1400;
    this._buildRoad();
    this._buildWalls();
    this._buildStartGate();
    this._buildRamps();      // ramps claim the straightest sections…
    this._buildBoostPads();  // …then pads fill in around them
    this._buildObstacles();  // …then rock towers block straights between them
    this._buildPuddles();
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
    const t = (i / N) * Math.PI * 2;
    const raw =
      0.52 * Math.sin(2 * t + E.ph[0]) +      // period ~N/2
      0.34 * Math.sin(3.3 * t + E.ph[1]) +    // period ~N/3.3
      0.14 * Math.sin(7 * t + E.ph[2]);       // period ~N/7
    // dead-flat within ±45 samples of the start, easing up to full amplitude
    return E.amp * raw * THREE.MathUtils.smoothstep(this._circDist(i, 0), 45, 130);
  }

  /** Grade dY/ds (rise per unit of travel) at sample i. Positive = climbing. */
  slopeAt(i) {
    return this._slope[((i % N) + N) % N];
  }

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

  /** Rolling-hill height used by the terrain mesh, scenery placement and the
   *  free-roam mode's per-frame ground queries (track distance is cached).
   *  Near the road it blends to the ROAD's elevation at the nearest centerline
   *  sample, so the meadow rises to meet the climbing road. */
  terrainHeight(x, z) {
    const fld = this._roadFieldCoarse(x, z);
    const d = fld.d;
    if (d <= 15) return fld.y;                 // flattened corridor along the road
    const n =
      Math.sin(x * 0.012) * Math.cos(z * 0.010) * 3.4 +
      Math.sin(x * 0.030 + 1.7) * Math.cos(z * 0.026 + 0.6) * 1.7 +
      Math.sin(x * 0.070 + 3.1) * Math.cos(z * 0.062 + 2.2) * 0.7;
    if (d >= 70) return n;
    const f = THREE.MathUtils.smoothstep(d, 15, 70);
    return fld.y * (1 - f) + n * f;
  }

  // ---------- track construction ----------
  _buildRoad() {
    const geo = new THREE.BufferGeometry();
    const verts = new Float32Array((N + 1) * 2 * 3);
    const uvs = new Float32Array((N + 1) * 2 * 2);
    const idx = [];
    const w = WALL_OFF + 0.6;
    for (let i = 0; i <= N; i++) {
      const j = i % N;
      const c = this.center[j], n = this.nrm[j];
      const o = i * 6;
      verts[o] = c.x + n.x * w; verts[o + 1] = c.y; verts[o + 2] = c.z + n.z * w;
      verts[o + 3] = c.x - n.x * w; verts[o + 4] = c.y; verts[o + 5] = c.z - n.z * w;
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
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 1, metalness: 0 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.receiveShadow = true;
    this.group.add(mesh);
  }

  _wallRibbon(side) {
    const geo = new THREE.BufferGeometry();
    const verts = new Float32Array((N + 1) * 2 * 3);
    const uvs = new Float32Array((N + 1) * 2 * 2);
    const idx = [];
    const h = 1.35;
    for (let i = 0; i <= N; i++) {
      const j = i % N;
      const c = this.center[j], n = this.nrm[j];
      const x = c.x + n.x * WALL_OFF * side, z = c.z + n.z * WALL_OFF * side;
      const o = i * 6;
      verts[o] = x; verts[o + 1] = c.y; verts[o + 2] = z;
      verts[o + 3] = x; verts[o + 4] = c.y + h; verts[o + 5] = z;
      const u = (i * this.segLen) / 8;
      uvs[i * 4] = u; uvs[i * 4 + 1] = 0;
      uvs[i * 4 + 2] = u; uvs[i * 4 + 3] = 1;
    }
    for (let i = 0; i < N; i++) {
      const a = i * 2, b = i * 2 + 1, c = i * 2 + 2, d = i * 2 + 3;
      idx.push(a, b, c, b, d, c);
    }
    geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    const mat = new THREE.MeshStandardMaterial({ map: wallTexture(), roughness: 0.9, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    this.group.add(mesh);
  }

  _buildWalls() {
    if (this.T.cliffWalls) {
      // Slot-canyon look: tall stratified cliff ribbons just outside the road.
      // Purely visual — the physics clamp stays at WALL_OFF like every level.
      const tex = cliffTexture();
      tex.anisotropy = 4;
      this._cliffRibbon(1, tex);
      this._cliffRibbon(-1, tex);
      return;
    }
    this._wallRibbon(1);
    this._wallRibbon(-1);
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
    const wood = new THREE.MeshStandardMaterial({ color: 0x5d4426, roughness: 0.85 });
    const steel = new THREE.MeshStandardMaterial({ color: 0x4a4640, roughness: 0.5, metalness: 0.6 });
    for (const side of [1, -1]) {
      const bx = c.x + n.x * 12.5 * side, bz = c.z + n.z * 12.5 * side;
      for (const [ox, oz] of [[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 10, 8), steel);
        leg.position.set(bx + ox, 5, bz + oz);
        leg.castShadow = true;
        this.group.add(leg);
      }
      for (let ly = 2.5; ly <= 8.5; ly += 3) {
        const brace = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.22, 2.1), wood);
        brace.position.set(bx, ly, bz);
        this.group.add(brace);
      }
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.7, 2.6), wood);
      cabin.position.set(bx, 10, bz);
      cabin.castShadow = true;
      this.group.add(cabin);
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
      new THREE.MeshStandardMaterial({ color: 0x24211c, roughness: 0.6, metalness: 0.4 })
    );
    housing.position.set(c.x, 6.6, c.z);
    housing.rotation.y = heading;
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
    this.boostPads = [];
    const tex = chevronTexture();
    const min = this.T.padMaxCurv;
    let last = -999;
    for (let i = 40; i < N && this.boostPads.length < 5; i += 10) {
      if (this.ramps.some((r) => this._circDist(i, r.index) < 50)) continue;
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

  _buildRamps() {
    // launch ramps on the straightest sections of the circuit
    this.ramps = [];
    const woodTex = buildingTexture();
    const hazTex = hazardTexture();
    // rank every window by how straight it is over the ramp's whole length
    const windows = [];
    for (let i = 0; i < N; i += 5) {
      if (i < 60 || i > N - 90) continue; // keep clear of the start gate
      let maxCurv = 0;
      for (let k = -4; k < 22; k++) maxCurv = Math.max(maxCurv, this.curvature[(i + k + N) % N]);
      windows.push({ i, maxCurv });
    }
    windows.sort((a, b) => a.maxCurv - b.maxCurv);
    const chosen = [];
    for (const w of windows) {
      if (chosen.length >= 3) break;
      if (w.maxCurv > this.T.rampMaxCurv) break;
      if (chosen.some((c) => this._circDist(w.i, c) < 180)) continue;
      chosen.push(w.i);
    }
    for (const i of chosen) {
      {
        const lateral = [-3.4, 3.4, 0][this.ramps.length];
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
      if (this.curvature[i] > 0.012) continue;
      if (this.ramps.some((r) => this._circDist(i, r.index) < 41)) continue;  // 25 + ramp len
      if (this.boostPads.some((p) => this._circDist(i, p.index) < 25)) continue;
      if (chosen.some((c) => this._circDist(i, c) < 120)) continue;
      chosen.push(i);
    }
    this._obstacleIdx = chosen;
    const strata = ['#cf9a5e', '#a06844', '#b8845a', '#8f5a36', '#c9a06a'].map(
      (c) => new THREE.MeshStandardMaterial({ color: c, flatShading: true, roughness: 1 })
    );
    const basaltMat = new THREE.MeshStandardMaterial({
      color: 0x25212a, flatShading: true, roughness: 0.45, metalness: 0.1, emissive: 0x1c0a04,
    });
    chosen.forEach((i, k) => {
      const r = 2.2 + Math.random();                       // collider radius 2.2–3.2
      const side = k % 2 === 0 ? -1 : 1;
      const lateral = side * (1.2 + Math.random() * 3.3);  // within ±4.5 of centerline
      const p = this.pointAt(i, lateral);
      if (spec.style === 'basalt') {
        // two-lump obsidian boulder
        const g = new THREE.Group();
        const low = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 0), basaltMat);
        low.scale.set(r, r * 0.72, r * 0.9);
        low.position.y = r * 0.42;
        low.rotation.y = Math.random() * Math.PI * 2;
        low.castShadow = true;
        g.add(low);
        const top = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 0), basaltMat);
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
    });
  }

  /** Flat mud-puddle decals on the road surface (visual only here; the
   *  splash/slowdown reaction lives in the vehicle code via this.puddles). */
  _buildPuddles() {
    const count = this.T.puddleCount | 0;
    if (!count) return;
    const tex = puddleTexture();
    const chosen = [];
    for (let i = 3; i < N && chosen.length < count; i += 5) {
      if (this._circDist(i, 0) < 50) continue;
      if (this.ramps.some((r) => this._circDist(i, r.index) < 41)) continue;
      if (this.boostPads.some((p) => this._circDist(i, p.index) < 25)) continue;
      if (this._obstacleIdx.some((o) => this._circDist(i, o) < 25)) continue;
      if (chosen.some((c) => this._circDist(i, c) < 80)) continue;
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
        if (this.ramps.some((r) => this._circDist(i, r.index) < 36)) continue;    // 20 + ramp len
        if (this.boostPads.some((p) => this._circDist(i, p.index) < 20)) continue;
        if (this._obstacleIdx.some((o) => this._circDist(i, o) < 20)) continue;
        if (usedI.some((u) => this._circDist(i, u) < 4)) continue;                // no piles
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
    if (this.T.cliffWalls) this._buildOutcrops(m4);  // mesas + hoodoos beyond the canyon
    if (this.T.bridgeCount) this._buildBridges();
    if (this.T.oasis) this._buildOasis();
  }

  _buildTerrain() {
    const T = this.T;
    const SIZE = 4200, SEG = 150;
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
        ? Math.sin(x * 0.012) * Math.cos(z * 0.010) * 3.4 // skip track-distance falloff far away
        : this.terrainHeight(x, z);
      pos.setY(i, h - 0.12);
      const t = THREE.MathUtils.clamp((h + 2) / 7, 0, 1);
      tmp.copy(cLow).lerp(cHigh, t);
      // sprinkle dirt patches
      const dirt = Math.max(0, Math.sin(x * 0.045 + 2) * Math.sin(z * 0.05) - 0.72) * 3;
      tmp.lerp(cDirt, THREE.MathUtils.clamp(dirt, 0, 0.55));
      colors[i * 3] = tmp.r; colors[i * 3 + 1] = tmp.g; colors[i * 3 + 2] = tmp.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    const gtex = groundTexture(T.ground);
    gtex.repeat.set(48, 48);
    gtex.anisotropy = 4;
    const ground = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
      map: gtex, vertexColors: true, roughness: 1, metalness: 0,
    }));
    ground.receiveShadow = true;
    this.scene.add(ground);
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
    this.scene.add(sky);

    const sun = new THREE.Mesh(
      new THREE.PlaneGeometry(400, 400),
      new THREE.MeshBasicMaterial({
        map: glowTexture(), color: T.sunGlow, transparent: true, fog: false,
        depthWrite: false, blending: THREE.AdditiveBlending,
      })
    );
    sun.position.set(500, 900, 400);
    sun.lookAt(0, 0, 0);
    this.scene.add(sun);

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
      this.scene.add(sp);
      this.animated.clouds.push({ sprite: sp, speed: 1.5 + Math.random() * 2.5 });
    }
  }

  _buildHorizon(m4) {
    const T = this.T;
    if (T.horizon === 'mesa') return this._buildMesaHorizon(m4);
    const hills = new THREE.InstancedMesh(
      new THREE.ConeGeometry(1, 1, 7),
      new THREE.MeshStandardMaterial({ color: T.hillColor, flatShading: true, roughness: 1 }),
      40
    );
    const peaks = new THREE.InstancedMesh(
      new THREE.ConeGeometry(1, 1, 5),
      new THREE.MeshStandardMaterial({ color: T.peakColor, flatShading: true, roughness: 1 }),
      30
    );
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * Math.PI * 2;
      const r = 760 + Math.random() * 110;
      const h = 70 + Math.random() * 90;
      const w = 130 + Math.random() * 150;
      m4.makeScale(w, h, w);
      m4.setPosition(Math.cos(a) * r, h / 2 - 8, Math.sin(a) * r);
      hills.setMatrixAt(i, m4);
    }
    for (let i = 0; i < 30; i++) {
      const a = (i / 30) * Math.PI * 2 + 0.1;
      const r = 980 + Math.random() * 140;
      const h = 160 + Math.random() * 140;
      const w = 120 + Math.random() * 140;
      m4.makeScale(w, h, w);
      m4.setPosition(Math.cos(a) * r, h / 2 - 8, Math.sin(a) * r);
      peaks.setMatrixAt(i, m4);
    }
    this.scene.add(hills, peaks);
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
      let y = -2;
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
    this.scene.add(mesh);
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

    // freestanding hoodoos: 4 stacked drums per tower, wider cap stone
    const COUNT = 40, SEGS = 4;
    const segGeo = new THREE.CylinderGeometry(0.8, 1, 1, 7);
    segGeo.translate(0, 0.5, 0);
    const hoodoos = new THREE.InstancedMesh(
      segGeo,
      new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true, roughness: 1 }),
      COUNT * SEGS
    );
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
      placed++;
    }
    hoodoos.count = k;
    this.scene.add(hoodoos);
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

  _trackSidePos(minD, maxD) {
    const i = (Math.random() * N) | 0;
    const side = Math.random() < 0.5 ? 1 : -1;
    const dist = minD + Math.random() * (maxD - minD);
    const x = this.center[i].x + this.nrm[i].x * side * dist;
    const z = this.center[i].z + this.nrm[i].z * side * dist;
    if (this._distToTrack(x, z) < minD - 1) return null;
    return { x, z };
  }

  _buildForest(m4) {
    const T = this.T;
    if (T.vegetation === 'cactus') return this._buildCacti(m4);
    if (T.vegetation === 'charred') return this._buildCharredTrees(m4);
    const COUNT = T.treeCount;
    const trunkGeo = new THREE.CylinderGeometry(0.35, 0.5, 2.4, 7);
    trunkGeo.translate(0, 1.2, 0);
    const lowGeo = new THREE.ConeGeometry(2.6, 4.2, 8);
    lowGeo.translate(0, 4.0, 0);
    const topGeo = new THREE.ConeGeometry(1.8, 3.4, 8);
    topGeo.translate(0, 6.6, 0);
    const trunkMat = new THREE.MeshStandardMaterial({ color: T.trunkColor, roughness: 1 });
    const lowMat = new THREE.MeshStandardMaterial({ color: T.foliageLow, flatShading: true, roughness: 1 });
    const topMat = new THREE.MeshStandardMaterial({ color: T.foliageTop, flatShading: true, roughness: 1 });
    const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, COUNT);
    const lows = new THREE.InstancedMesh(lowGeo, lowMat, COUNT);
    const tops = new THREE.InstancedMesh(topGeo, topMat, COUNT);
    lows.castShadow = tops.castShadow = true;
    // snowy pines get a white cap cone over the upper foliage
    let caps = null;
    if (T.treeSnowCap) {
      const capGeo = new THREE.ConeGeometry(1.35, 2.0, 8);
      capGeo.translate(0, 7.35, 0);
      caps = new THREE.InstancedMesh(
        capGeo,
        new THREE.MeshStandardMaterial({ color: 0xf2f6fa, flatShading: true, roughness: 0.9 }),
        COUNT
      );
    }
    const color = new THREE.Color();
    const F = T.foliage;

    const placed = this._scatter(COUNT,
      () => {
        if (Math.random() < 0.62) return this._trackSidePos(15, 46);
        const a = Math.random() * Math.PI * 2;
        const r = 80 + Math.random() * 560;
        const x = Math.cos(a) * r, z = Math.sin(a) * r;
        if (this._distToTrack(x, z) < 14.5) return null;
        return { x, z };
      },
      (p, k) => {
        const s = 0.75 + Math.random() * 1.25;
        m4.makeScale(s, s * (0.85 + Math.random() * 0.45), s);
        m4.setPosition(p.x, this.terrainHeight(p.x, p.z) - 0.25, p.z);
        trunks.setMatrixAt(k, m4);
        lows.setMatrixAt(k, m4);
        tops.setMatrixAt(k, m4);
        if (caps) caps.setMatrixAt(k, m4);
        // per-tree foliage variation (themed hue band)
        color.setHSL(
          F.h + Math.random() * F.hVar,
          F.s + Math.random() * F.sVar,
          F.l + Math.random() * F.lVar
        );
        lows.setColorAt(k, color);
        tops.setColorAt(k, color.clone().multiplyScalar(1.2));
      });
    trunks.count = lows.count = tops.count = placed;
    this.scene.add(trunks, lows, tops);
    if (caps) { caps.count = placed; this.scene.add(caps); }
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
    parts[0].castShadow = true;
    const q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
    const color = new THREE.Color();
    const placed = this._scatter(COUNT,
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
        q.setFromAxisAngle(up, Math.random() * Math.PI * 2);
        m4.compose(
          new THREE.Vector3(p.x, y - 0.15, p.z),
          q, new THREE.Vector3(spot.s, spot.s * (0.9 + Math.random() * 0.3), spot.s)
        );
        color.setHSL(0.30 + Math.random() * 0.06, 0.35 + Math.random() * 0.15, 0.22 + Math.random() * 0.12);
        for (const part of parts) {
          part.setMatrixAt(k, m4);
          part.setColorAt(k, color);
        }
      });
    for (const part of parts) { part.count = placed; this.scene.add(part); }
  }

  /** Volcano vegetation: sparse burnt snags — bare trunk + a few thin dark
   *  branch cones, scattered like the pines are on the other levels. */
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
    parts[0].castShadow = true;
    const q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
    const color = new THREE.Color();
    const placed = this._scatter(COUNT,
      () => {
        if (Math.random() < 0.62) return this._trackSidePos(15, 46);
        const a = Math.random() * Math.PI * 2;
        const r = 80 + Math.random() * 560;
        const x = Math.cos(a) * r, z = Math.sin(a) * r;
        if (this._distToTrack(x, z) < 14.5) return null;
        return { x, z };
      },
      (p, k) => {
        const s = 0.7 + Math.random() * 1.1;
        q.setFromAxisAngle(up, Math.random() * Math.PI * 2);
        m4.compose(
          new THREE.Vector3(p.x, this.terrainHeight(p.x, p.z) - 0.2, p.z),
          q, new THREE.Vector3(s, s * (0.8 + Math.random() * 0.5), s)
        );
        color.setHSL(0.06 + Math.random() * 0.03, 0.12 + Math.random() * 0.1, 0.08 + Math.random() * 0.06);
        for (const part of parts) {
          part.setMatrixAt(k, m4);
          part.setColorAt(k, color);
        }
      });
    for (const part of parts) { part.count = placed; this.scene.add(part); }
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
    this.scene.add(tufts);

    // bushes (lush, dry or frosted depending on theme)
    const bushGeo = new THREE.IcosahedronGeometry(1, 0);
    bushGeo.scale(1, 0.62, 1);
    const bushes = new THREE.InstancedMesh(
      bushGeo,
      new THREE.MeshStandardMaterial({ color: T.bushColor, flatShading: true, roughness: 1 }),
      T.bushCount
    );
    const B = T.bush;
    const bcolor = new THREE.Color();
    let bk = 0;
    this._scatter(T.bushCount, () => this._trackSidePos(13, 70), (p) => {
      const s = 0.7 + Math.random() * 1.5;
      m4.makeScale(s, s, s);
      m4.setPosition(p.x, this.terrainHeight(p.x, p.z) + s * 0.3, p.z);
      bushes.setMatrixAt(bk, m4);
      bcolor.setHSL(
        B.h + Math.random() * B.hVar,
        B.s + Math.random() * B.sVar,
        B.l + Math.random() * B.lVar
      );
      bushes.setColorAt(bk++, bcolor);
    });
    bushes.count = bk;
    this.scene.add(bushes);

    // boulders (snow theme gets white caps on top; volcano gets glossy obsidian)
    const rockRough = T.rockRoughness !== undefined ? T.rockRoughness : 1;
    const rocks = new THREE.InstancedMesh(
      new THREE.DodecahedronGeometry(1, 0),
      new THREE.MeshStandardMaterial({ color: T.rockColor, flatShading: true, roughness: rockRough }),
      T.rockCount
    );
    rocks.castShadow = true;
    const caps = T.rockSnowCap
      ? new THREE.InstancedMesh(
          new THREE.DodecahedronGeometry(1, 0),
          new THREE.MeshStandardMaterial({ color: 0xf2f6fa, flatShading: true, roughness: 0.9 }),
          T.rockCount
        )
      : null;
    let rk = 0;
    this._scatter(T.rockCount, () => this._trackSidePos(12.5, 90), (p) => {
      const s = 0.5 + Math.random() * 2.2;
      const sy = s * (0.6 + Math.random() * 0.5);
      const y = this.terrainHeight(p.x, p.z) + s * 0.25;
      q.setFromAxisAngle(up, Math.random() * Math.PI * 2);
      m4.compose(new THREE.Vector3(p.x, y, p.z), q, new THREE.Vector3(s, sy, s));
      rocks.setMatrixAt(rk, m4);
      if (caps) {
        m4.compose(
          new THREE.Vector3(p.x, y + sy * 0.55, p.z),
          q, new THREE.Vector3(s * 0.8, sy * 0.4, s * 0.8)
        );
        caps.setMatrixAt(rk, m4);
      }
      rk++;
    });
    rocks.count = rk;
    this.scene.add(rocks);
    if (caps) { caps.count = rk; this.scene.add(caps); }

    // small stones scattered right off the road edge
    const pebbles = new THREE.InstancedMesh(
      new THREE.DodecahedronGeometry(1, 0),
      new THREE.MeshStandardMaterial({ color: T.rockColor, flatShading: true, roughness: rockRough }),
      T.pebbleCount
    );
    let pk = 0;
    this._scatter(T.pebbleCount, () => this._trackSidePos(11.3, 16), (p) => {
      const s = 0.12 + Math.random() * 0.32;
      q.setFromAxisAngle(up, Math.random() * Math.PI * 2);
      m4.compose(
        new THREE.Vector3(p.x, this.terrainHeight(p.x, p.z) + s * 0.3, p.z),
        q, new THREE.Vector3(s, s * 0.7, s)
      );
      pebbles.setMatrixAt(pk++, m4);
    });
    pebbles.count = pk;
    this.scene.add(pebbles);

    // one big hero boulder close to the racing line (in the open start bowl on
    // cliff-walled levels, where trackside ground is actually visible)
    const fallbackP = this.pointAt((N * 0.42) | 0, WALL_OFF + 7);
    const heroP = T.cliffWalls ? this.pointAt(48, -(WALL_OFF + 5.5)) : null;
    const hp = heroP
      ? { x: heroP.x, z: heroP.z }
      : (this._trackSidePos(14, 18) || { x: fallbackP.x, z: fallbackP.z });
    const hero = new THREE.Mesh(
      new THREE.DodecahedronGeometry(1, 1),
      new THREE.MeshStandardMaterial({ color: T.rockColor, flatShading: true, roughness: rockRough })
    );
    hero.scale.set(4.6, 3.3, 4.1);
    hero.rotation.y = 1.3;
    hero.position.set(hp.x, this.terrainHeight(hp.x, hp.z) + 0.9, hp.z);
    hero.castShadow = true;
    this.scene.add(hero);
    if (T.rockSnowCap) {
      const heroCap = new THREE.Mesh(
        new THREE.DodecahedronGeometry(1, 1),
        new THREE.MeshStandardMaterial({ color: 0xf2f6fa, flatShading: true, roughness: 0.9 })
      );
      heroCap.scale.set(3.8, 1.4, 3.4);
      heroCap.rotation.y = 1.3;
      heroCap.position.set(hp.x, hero.position.y + 2.2, hp.z);
      this.scene.add(heroCap);
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
    this.scene.add(flowers);
  }

  _buildHuts(m4) {
    const COUNT = this.T.hutCount !== undefined ? this.T.hutCount : 14;
    const wallGeo = new THREE.BoxGeometry(1, 1, 1);
    wallGeo.translate(0, 0.5, 0);
    const roofGeo = new THREE.ConeGeometry(0.85, 0.55, 4);
    roofGeo.rotateY(Math.PI / 4);
    const wallMat = new THREE.MeshStandardMaterial({ map: buildingTexture(), roughness: 1 });
    const roofMat = new THREE.MeshStandardMaterial({ color: this.T.hutRoof, flatShading: true, roughness: 1 });
    const walls = new THREE.InstancedMesh(wallGeo, wallMat, COUNT);
    const roofs = new THREE.InstancedMesh(roofGeo, roofMat, COUNT);
    walls.castShadow = roofs.castShadow = true;
    const q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
    let placed = 0;
    this._scatter(COUNT, () => this._trackSidePos(24, 64), (p) => {
      const w = 9 + Math.random() * 6;
      const h = 5 + Math.random() * 2.5;
      const rot = Math.random() * Math.PI * 2;
      const y = this.terrainHeight(p.x, p.z) - 0.6;
      q.setFromAxisAngle(up, rot);
      m4.compose(new THREE.Vector3(p.x, y, p.z), q, new THREE.Vector3(w, h, w));
      walls.setMatrixAt(placed, m4);
      m4.compose(new THREE.Vector3(p.x, y + h, p.z), q, new THREE.Vector3(w * 1.6, h * 1.1, w * 1.6));
      roofs.setMatrixAt(placed++, m4);
    });
    walls.count = roofs.count = placed;
    this.scene.add(walls, roofs);
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
        // cliff-walled levels stack the tires right against the rock face
        const tireOff = this.T.cliffWalls ? WALL_OFF + 0.8 : WALL_OFF + 2.2;
        const p = this.pointAt(i, tireOff * side);
        const stack = Math.random() < 0.5 ? 3 : 2;
        for (let s = 0; s < stack && tk < 180; s++) {
          m4.makeTranslation(p.x + (Math.random() - 0.5) * 0.4, p.y + 0.32 + s * 0.62, p.z + (Math.random() - 0.5) * 0.4);
          tires.setMatrixAt(tk, m4);
          tcolor.set(s === stack - 1 && Math.random() < 0.5 ? 0xd8d2c2 : 0x22201c);
          tires.setColorAt(tk++, tcolor);
        }
      }
    }
    tires.count = tk;
    this.scene.add(tires);

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
    });
    hay.count = hk;
    this.scene.add(hay);
  }

  _buildBanners() {
    // sponsor boards facing the track
    const post = new THREE.CylinderGeometry(0.14, 0.16, 3.4, 7);
    const postMat = new THREE.MeshStandardMaterial({ color: 0x4a4640, roughness: 0.6, metalness: 0.5 });
    const boardGeo = new THREE.PlaneGeometry(9, 2.2);
    const mats = SPONSORS.map(([text, bg, fg]) =>
      new THREE.MeshStandardMaterial({ map: bannerTexture(text, bg, fg), roughness: 0.8, side: THREE.DoubleSide }));
    // cliff-walled levels stand the boards right at the rock face so they stay
    // inside the canyon instead of vanishing behind it
    const boardOff = this.T.cliffWalls ? WALL_OFF + 0.75 : WALL_OFF + 3.6;
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
    }
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
    const deckMat = new THREE.MeshStandardMaterial({ map: deckTex, roughness: 0.95 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x6a4a2c, roughness: 0.95 });
    const ropeMat = new THREE.MeshStandardMaterial({ color: 0x8a7048, roughness: 1 });
    for (const i of chosen) {
      const c = this.center[i];
      const g = new THREE.Group();
      const deck = new THREE.Mesh(new THREE.BoxGeometry(span, 0.35, 3.2), deckMat);
      deck.position.y = 9;
      deck.castShadow = true;
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
    this.scene.add(rim);
    const water = new THREE.Mesh(
      new THREE.CircleGeometry(1, 26),
      new THREE.MeshStandardMaterial({ color: 0x2e86c8, roughness: 0.15, metalness: 0.1 })
    );
    water.rotation.x = -Math.PI / 2;
    water.scale.set(7.2, 5.2, 1);
    water.position.set(spot.x, spot.y + 0.38, spot.z);
    this.scene.add(water);
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
      this.scene.add(g);
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
}
