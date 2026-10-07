// DEAD COPY — NOTHING IMPORTS THIS FILE. The live code is in src/track.js
// (and friends); this directory is an abandoned split that has already
// drifted (this sky.js is missing the horizon-solids fix, its _buildMassif
// registers no colliders). Editing here changes nothing in the game and
// reading here misleads — it cost the mountain-sinking investigation an
// hour. Verified dead by import grep across src/, tests/, index.html.
// Every color and density knob per theme — terrain palettes, sky, fog,
// flora counts, weather, elevation profiles. Pure data: `fogColor…
// sunIntensity` are exposed to main.js via `track.theme`; the rest is
// internal art direction consumed by the Track class.
// Every color and density knob per theme. `fogColor…sunIntensity` are exposed
// to main.js via `track.theme`; the rest is internal art direction.
export const THEMES = {
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
    treeCount: 641, trunkColor: 0x6b4423,
    foliageLow: 0x2c6e2a, foliageTop: 0x3c8a34,
    foliage: { h: 0.29, hVar: 0.06, s: 0.5, sVar: 0.2, l: 0.32, lVar: 0.14 },
    treeSnowCap: false,
    // ground cover
    tuftCount: 1100, grass: {},
    bushCount: 256, bushColor: 0x2f7a30,
    bush: { h: 0.30, hVar: 0.05, s: 0.5, sVar: 0, l: 0.30, lVar: 0.12 },
    rockCount: 162, pebbleCount: 160, rockColor: 0x8d8578, rockSnowCap: false,
    flowerCount: 340, flowerColors: ['#ffe234', '#ff6a8a', '#ffffff', '#ff8a3a', '#c27aff'],
    hutRoof: 0xc9a24d, hayColor: 0xd8b95e,
    // debris chip colors when a fence/wall is scraped (painted pole red/cream)
    splinter: [0xc23b2a, 0xe8e2d4],
    // light drizzle drifting through the pines (rate overrides the default)
    weather: { type: 'rain', color: 0xcfe0ee, rate: 190 },
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
    vegetation: 'cactus', treeCount: 153, trunkColor: 0x4a8a4c,
    foliageLow: 0x3f7a34, foliageTop: 0x4c8a3e,
    foliage: { h: 0.10, hVar: 0.05, s: 0.40, sVar: 0.15, l: 0.45, lVar: 0.15 },
    treeSnowCap: false,
    tuftCount: 520, grass: { bladeA: '#8a7a30', bladeB: '#c8b45e' },
    bushCount: 192, bushColor: 0x8a8050,
    bush: { h: 0.12, hVar: 0.04, s: 0.35, sVar: 0.1, l: 0.42, lVar: 0.12 },
    rockCount: 375, pebbleCount: 240, rockColor: 0xb07a52, rockSnowCap: false,
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
    treeCount: 592, trunkColor: 0x5a4028,
    foliageLow: 0x5a7a62, foliageTop: 0x668a70,
    foliage: { h: 0.38, hVar: 0.04, s: 0.22, sVar: 0.10, l: 0.42, lVar: 0.10 },
    treeSnowCap: true,
    tuftCount: 360, grass: { bladeA: '#5a7a58', bladeB: '#b8d0c0' },
    bushCount: 144, bushColor: 0x9ab8a0,
    bush: { h: 0.40, hVar: 0.05, s: 0.18, sVar: 0.08, l: 0.52, lVar: 0.12 },
    rockCount: 188, pebbleCount: 140, rockColor: 0x9aa6b0, rockSnowCap: true,
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
    vegetation: 'cactus', treeCount: 187, trunkColor: 0x4a8a4c,
    foliageLow: 0x3f7a34, foliageTop: 0x4c8a3e,
    foliage: { h: 0.30, hVar: 0.05, s: 0.40, sVar: 0.15, l: 0.30, lVar: 0.10 },
    treeSnowCap: false,
    tuftCount: 260, grass: { bladeA: '#9a7a30', bladeB: '#d0b060' },
    bushCount: 74, bushColor: 0x8a7a44,
    bush: { h: 0.11, hVar: 0.04, s: 0.34, sVar: 0.1, l: 0.40, lVar: 0.12 },
    rockCount: 188, pebbleCount: 130, rockColor: 0xb5744a, rockSnowCap: false,
    flowerCount: 60, flowerColors: ['#ffd45e', '#ff7a3a', '#e86a8a'],
    hutRoof: 0xb0794a, hayColor: 0xd8b95e, hutCount: 5, hayCount: 22,
    splinter: [0xc9a06a, 0xa06844],                     // sandstone chips
    weather: { type: 'dust', color: 0xc9a06a },
    elev: { amp: 6, ph: [0.3, 3.7, 1.9] },              // gentle canyon-floor undulation
    rampMaxCurv: 0.02, padMaxCurv: 0.0075, boardMaxCurv: 0.018,
    cliffWalls: true, cliffSetback: 26, cliffHeight: 30, cliffRimNotch: 1.0,
    // the canyon ran on the GENERIC tan default - the one cliffWalls theme
    // with no palette of its own. Six bands off the theme's own rock/peak/
    // terrain tones: ochre, rust anchor, deep rust, the pale caliche standout
    // layer the reference shows, and two tones shared with the gorge STRATA
    // so walls and terrain cuts read as the same geology.
    cliffPalette: {
      bands: ['#d9a268', '#b5744a', '#8f4f2e', '#ead9ae', '#c98b52', '#a45f34'],
      seam: 'rgba(70,42,24,0.55)',
      // v is world-locked now (see _cliffRibbon): the canvas's baked rim
      // bleach and talus stripes would sit at absolute height rather than on
      // the rim/foot, so they are off here - vertex colours carry both.
      bleach: 'rgba(0,0,0,0)', talus: 'rgba(0,0,0,0)',
    },
    horizon: 'mesa', bridgeCount: 3, oasis: true, outcrops: true,
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
    vegetation: 'charred', treeCount: 204, trunkColor: 0x241d18,
    foliageLow: 0x2a2018, foliageTop: 0x3a2c20,
    foliage: { h: 0.06, hVar: 0.03, s: 0.20, sVar: 0.1, l: 0.14, lVar: 0.08 },
    treeSnowCap: false,
    tuftCount: 70, grass: { bladeA: '#4a4038', bladeB: '#6a5a48' },  // few scorched tufts
    bushCount: 58, bushColor: 0x3a302a,
    bush: { h: 0.08, hVar: 0.03, s: 0.15, sVar: 0.08, l: 0.16, lVar: 0.08 },
    rockCount: 300, pebbleCount: 380,                   // heavy dark gravel scatter
    // Obsidian at 0x201c22 was invisible against the ground — you only learned
    // a rock was there from the −85 hull. Lifted to a lit basalt that still
    // reads volcanic but silhouettes against the ash in time to swerve.
    rockColor: 0x574c52, rockSnowCap: false, rockRoughness: 0.4,
    flowerCount: 0, flowerColors: ['#ff7a22'],
    hutRoof: 0x4a3a30, hayColor: 0x8a6a3a, hutCount: 7, hayCount: 0,
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
    treeCount: 690, trunkColor: 0x6b4423,
    foliageLow: 0x2a6e34, foliageTop: 0x3f9a44,         // bright alpine pines
    foliage: { h: 0.30, hVar: 0.06, s: 0.55, sVar: 0.2, l: 0.30, lVar: 0.14 },
    treeSnowCap: false,
    tuftCount: 900, grass: {},
    bushCount: 224, bushColor: 0x2f7a30,
    bush: { h: 0.30, hVar: 0.05, s: 0.5, sVar: 0, l: 0.30, lVar: 0.12 },
    // the slopes are strewn with mossy green granite
    rockCount: 425, pebbleCount: 220, rockColor: 0x7a9a6c, rockSnowCap: false,
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
    treeCount: 345, trunkColor: 0x5a4028,
    foliageLow: 0x5a7a62, foliageTop: 0x668a70,
    foliage: { h: 0.38, hVar: 0.04, s: 0.22, sVar: 0.10, l: 0.42, lVar: 0.10 },
    treeSnowCap: true,
    tuftCount: 240, grass: { bladeA: '#6a8a78', bladeB: '#c8dcd0' },
    bushCount: 96, bushColor: 0x9ab8a0,
    bush: { h: 0.40, hVar: 0.05, s: 0.18, sVar: 0.08, l: 0.55, lVar: 0.12 },
    rockCount: 200, pebbleCount: 120, rockColor: 0x9ab4c4, rockSnowCap: true,
    flowerCount: 40, flowerColors: ['#ffffff', '#cfe0ff', '#aef0ff'],
    hutRoof: 0xe8f2f8, hutStyle: 'igloo', hutCount: 14, hayCount: 0,   // nor by the igloos
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
    vegetation: 'jungle', treeCount: 789, trunkColor: 0x7a5c3a,
    foliageLow: 0x1f6e2c, foliageTop: 0x35a03c,
    foliage: { h: 0.31, hVar: 0.08, s: 0.55, sVar: 0.2, l: 0.26, lVar: 0.16 },
    treeSnowCap: false,
    tuftCount: 900, grass: { bladeA: '#2f7a22', bladeB: '#63c243' },
    bushCount: 352, bushColor: 0x2c7a2e,
    bush: { h: 0.31, hVar: 0.06, s: 0.55, sVar: 0.15, l: 0.26, lVar: 0.14 },
    rockCount: 112, pebbleCount: 120, rockColor: 0x6a7a5a, rockSnowCap: false,
    flowerCount: 420, flowerColors: ['#ff4a6a', '#ffd45e', '#ff8a3a', '#e86aff', '#ffffff'],
    hutRoof: 0x7a9a3c, hutCount: 11, hayCount: 0,   // no straw in a rainforest
    splinter: [0x4a9a3c, 0x8a6a42],                     // shredded fronds + wet wood
    weather: { type: 'rain', color: 0xbfd8ea, rate: 220 }, // full tropical downpour
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
    vegetation: 'palm', treeCount: 61, trunkColor: 0x8a6242,
    foliageLow: 0x3f7a34, foliageTop: 0x4c8a3e,
    foliage: { h: 0.26, hVar: 0.05, s: 0.42, sVar: 0.15, l: 0.30, lVar: 0.10 },
    treeSnowCap: false,
    tuftCount: 260, grass: { bladeA: '#a08a3a', bladeB: '#d8c070' },
    bushCount: 70, bushColor: 0x9a8a50,
    bush: { h: 0.12, hVar: 0.04, s: 0.32, sVar: 0.1, l: 0.44, lVar: 0.12 },
    rockCount: 75, pebbleCount: 150, rockColor: 0xc09058, rockSnowCap: false,
    flowerCount: 0, flowerColors: ['#ffd45e'],
    hutRoof: 0xc09a5c, hayColor: 0xd8b95e, hutCount: 5, hayCount: 8,
    splinter: [0xe8c87a, 0xb8905a],
    weather: { type: 'sand', color: 0xe0c080 },
    // ON THE CRESTS. The road was a flat ribbon on flat sand: 61 u of
    // longest straight and nothing to read ahead. A bigger amplitude puts
    // the lap over the dune tops with the sand falling away either side,
    // which gives it a silhouette, a horizon and blind brows to judge.
    elev: { amp: 17, ph: [0.9, 1.9, 2.7] },             // serpent-back rollers
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
    vegetation: 'cactus', treeCount: 119, trunkColor: 0x4a8a4c,
    foliageLow: 0x3f7a34, foliageTop: 0x4c8a3e,
    foliage: { h: 0.30, hVar: 0.05, s: 0.40, sVar: 0.15, l: 0.30, lVar: 0.10 },
    treeSnowCap: false,
    tuftCount: 200, grass: { bladeA: '#96702c', bladeB: '#c8a054' },
    bushCount: 58, bushColor: 0x8a6e3e,
    bush: { h: 0.10, hVar: 0.04, s: 0.32, sVar: 0.1, l: 0.38, lVar: 0.12 },
    rockCount: 212, pebbleCount: 200, rockColor: 0xa5602f, rockSnowCap: false,
    flowerCount: 30, flowerColors: ['#ffd45e', '#ff7a3a'],
    hutRoof: 0xa06844, hayColor: 0xd8b95e, hutCount: 4, hayCount: 10,
    splinter: [0xb87848, 0x8a4a26],                     // red sandstone chips
    weather: { type: 'dust', color: 0xc08a5a },
    elev: { amp: 7, ph: [3.1, 1.2, 4.6] },
    rampMaxCurv: 0.022, padMaxCurv: 0.007, boardMaxCurv: 0.02,
    cliffWalls: true, cliffSetback: 22, cliffHeight: 28, horizon: 'mesa', outcrops: true,
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
    vegetation: 'palm', treeCount: 425, trunkColor: 0x8a6242,
    foliageLow: 0x2f8a3c, foliageTop: 0x45a04a,
    foliage: { h: 0.29, hVar: 0.06, s: 0.5, sVar: 0.18, l: 0.30, lVar: 0.12 },
    treeSnowCap: false, palmGrove: [0.32, 0.58],        // grove section of the lap
    tuftCount: 700, grass: { bladeA: '#5a8a2c', bladeB: '#a8c85e' },
    bushCount: 288, bushColor: 0x4a8a34,
    bush: { h: 0.27, hVar: 0.05, s: 0.45, sVar: 0.12, l: 0.30, lVar: 0.12 },
    rockCount: 112, pebbleCount: 120, rockColor: 0xb08a58, rockSnowCap: false,
    flowerCount: 260, flowerColors: ['#ffd45e', '#ff6a8a', '#ffffff', '#e86aff'],
    hutRoof: 0xc9a24d, hayColor: 0xd8b95e, hutCount: 9, hayCount: 16,
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
    vegetation: 'redwood', treeCount: 468, trunkColor: 0x7a3f24,
    foliageLow: 0x2a5e28, foliageTop: 0x3a7a32,
    foliage: { h: 0.30, hVar: 0.05, s: 0.45, sVar: 0.18, l: 0.26, lVar: 0.10 },
    treeSnowCap: false,
    tuftCount: 800, grass: { bladeA: '#2f6a22', bladeB: '#63b243' },
    bushCount: 272, bushColor: 0x2f7a30,
    bush: { h: 0.30, hVar: 0.05, s: 0.5, sVar: 0, l: 0.28, lVar: 0.12 },
    rockCount: 150, pebbleCount: 150, rockColor: 0x8a8072, rockSnowCap: false,
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
    treeCount: 592, trunkColor: 0x6b4423,
    foliageLow: 0x2c6e2a, foliageTop: 0x3c8a34,
    foliage: { h: 0.29, hVar: 0.06, s: 0.5, sVar: 0.2, l: 0.30, lVar: 0.14 },
    treeSnowCap: false,
    tuftCount: 850, grass: {},
    bushCount: 224, bushColor: 0x2f7a30,
    bush: { h: 0.30, hVar: 0.05, s: 0.5, sVar: 0, l: 0.30, lVar: 0.12 },
    rockCount: 138, pebbleCount: 150, rockColor: 0x8d8578, rockSnowCap: false,
    flowerCount: 200, flowerColors: ['#ffe234', '#ff6a8a', '#ffffff'],
    hutRoof: 0x8a5a2c, hayColor: 0x8a6238,              // hay recolored to cut-log rounds
    hutCount: 11, hayCount: 34,
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
    vegetation: 'burnt', treeCount: 542, trunkColor: 0x241d18,
    foliageLow: 0x4a2814, foliageTop: 0x6a3a1a,         // ember-lit scorched canopy
    foliage: { h: 0.05, hVar: 0.03, s: 0.45, sVar: 0.15, l: 0.16, lVar: 0.08 },
    treeSnowCap: false,
    tuftCount: 80, grass: { bladeA: '#4a4038', bladeB: '#6a5a48' },
    bushCount: 48, bushColor: 0x3a302a,
    bush: { h: 0.08, hVar: 0.03, s: 0.15, sVar: 0.08, l: 0.16, lVar: 0.08 },
    rockCount: 200, pebbleCount: 220, rockColor: 0x3a322c, rockSnowCap: false,
    flowerCount: 0, flowerColors: ['#ff7a22'],
    hutRoof: 0x4a3a30, hayColor: 0x8a6a3a, hutCount: 4, hayCount: 0,
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
    treeCount: 102, trunkColor: 0x5a4028,
    foliageLow: 0x5a7a62, foliageTop: 0x668a70,
    foliage: { h: 0.38, hVar: 0.04, s: 0.22, sVar: 0.10, l: 0.42, lVar: 0.10 },
    treeSnowCap: true,
    tuftCount: 120, grass: { bladeA: '#6a8a78', bladeB: '#c8dcd0' },
    bushCount: 64, bushColor: 0x9ab8a0,
    bush: { h: 0.40, hVar: 0.05, s: 0.18, sVar: 0.08, l: 0.55, lVar: 0.12 },
    rockCount: 175, pebbleCount: 110, rockColor: 0x9ab4c4, rockSnowCap: true,
    flowerCount: 0, flowerColors: ['#ffffff'],
    hutRoof: 0xe8f2f8, hutStyle: 'igloo', hutCount: 11, hayCount: 0,   // nor on sheet ice
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
    treeCount: 323, trunkColor: 0x5a4028,
    foliageLow: 0x5a7a62, foliageTop: 0x668a70,
    foliage: { h: 0.38, hVar: 0.04, s: 0.22, sVar: 0.10, l: 0.42, lVar: 0.10 },
    treeSnowCap: true,
    tuftCount: 260, grass: { bladeA: '#5a7a58', bladeB: '#b8d0c0' },
    bushCount: 96, bushColor: 0x9ab8a0,
    bush: { h: 0.40, hVar: 0.05, s: 0.18, sVar: 0.08, l: 0.52, lVar: 0.12 },
    rockCount: 275, pebbleCount: 160, rockColor: 0x9aa6b0, rockSnowCap: true,
    flowerCount: 30, flowerColors: ['#ffffff', '#cfe0ff'],
    hutRoof: 0xe8eef4, hutCount: 5, hayCount: 0,   // nor on a snowfield
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
    weather: { type: 'rain', color: 0x9ab8e8, rate: 150 },
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
    bushCount: 64, bushColor: 0x3a4a28,
    bush: { h: 0.22, hVar: 0.04, s: 0.3, sVar: 0.1, l: 0.18, lVar: 0.08 },
    rockCount: 162, pebbleCount: 260, rockColor: 0x6e7264, rockSnowCap: false,
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
    treeCount: 789, trunkColor: 0x6b4423,
    foliageLow: 0x276634, foliageTop: 0x3d9444,
    foliage: { h: 0.31, hVar: 0.06, s: 0.52, sVar: 0.2, l: 0.28, lVar: 0.13 },
    treeSnowCap: false,
    treeAltFade: [14, 34],                              // pines thin out with altitude
    tuftCount: 900, grass: {},
    bushCount: 240, bushColor: 0x2f7a30,
    bush: { h: 0.30, hVar: 0.05, s: 0.5, sVar: 0, l: 0.30, lVar: 0.12 },
    rockCount: 520, pebbleCount: 300, rockColor: 0x8b8a82, rockSnowCap: false,
    flowerCount: 240, flowerColors: ['#ffffff', '#ffe234', '#7a9aff', '#ff6a8a'],
    hutRoof: 0x7a4630, hayColor: 0xd8b95e,
    hutCount: 23, hutZone: [0.84, 0.16],                // village clustered in the valley
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
    stoneBridges: { count: 1 },
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
        rows: 30, per: 52,          // small hand-laid setts: ~0.42 u across
      },
    },
    hillColor: 0x4e7248, peakColor: 0xdde8f0,
    treeCount: 542, trunkColor: 0x6b4423,
    foliageLow: 0x2a6636, foliageTop: 0x428a48,
    foliage: { h: 0.29, hVar: 0.07, s: 0.45, sVar: 0.2, l: 0.28, lVar: 0.14 },
    treeSnowCap: false,
    treeAltFade: [-26, -4],                             // larch only low in the gorge
    tuftCount: 780, grass: {},
    bushCount: 208, bushColor: 0x357a34,
    bush: { h: 0.30, hVar: 0.05, s: 0.45, sVar: 0.1, l: 0.28, lVar: 0.12 },
    rockCount: 520, pebbleCount: 340, rockColor: 0x847f76, rockSnowCap: false,
    flowerCount: 200, flowerColors: ['#ffffff', '#ffe234', '#c27aff', '#ff6a8a'],
    hutRoof: 0x6a5b4a, hayColor: 0xd0b46a,
    hutCount: 22, hutZone: [0.62, 0.84],                // hamlet on the gorge floor
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
    // SUMMER, remade against the player's photo of the real pass: bright
    // clear alpine light over GREEN grass slopes and grey rock, the asphalt
    // ribbon switchbacking up the face, snow only on the high fields and the
    // peaks, the Rhone glacier on the skyline — and the pass hotel standing
    // alone at its hairpin. The old deep-winter dressing (snow surface
    // physics, white valley, falling snow) is gone with it.
    fogColor: 0xdcebf4, fogNear: 320, fogFar: 1650,
    hemiSky: 0xaad2f8, hemiGround: 0x7c9468, hemiIntensity: 0.8,
    sunColor: 0xfff4dc, sunIntensity: 2.75,
    skyTop: '#2f76c6', skyHorizon: '#e2eef6', sunGlow: 0xfff8dc,
    sunAz: 0.72, sunEl: 0.72,                           // high mountain summer sun
    cloudCount: 9, cloudOpacity: 0.9, cloudTint: 0xffffff,
    terrainLow: '#4e7c40', terrainHigh: '#98a48c', terrainDirt: '#8a8274',
    terrainScree: '#8e8a7e', hutGlow: 0.45,
    skirtColor: '#8e8a80',                              // rock cut below the shelf
    ground: {
      base: '#6f8a5c', bandLight: 'rgba(214,232,196,0.06)', bandDark: 'rgba(52,72,44,0.06)',
      patchA: 'rgba(120,140,90,0.18)', patchB: 'rgba(160,164,146,0.16)',
      speckA: 'rgba(150,154,142,0.7)', speckB: 'rgba(226,232,222,0.8)', speckCount: 80,
    },
    road: {
      // the real pass is sealed grey asphalt with a painted-on gravel verge
      base: '#6d6862', mottleA: [80, 76, 70], mottleB: [134, 130, 122],
      ruts: false,
      rut: 'rgba(52,50,46,0.45)', rutCore: 'rgba(38,36,34,0.4)', tread: 'rgba(20,18,16,0.45)',
      stoneA: 'rgba(198,194,184,0.65)', stoneB: 'rgba(66,62,56,0.7)',
      fringe: [86, 124, 62], fringeVar: [30, 40, 22],
    },
    hillColor: 0x8a9a84, peakColor: 0xf2f7fb,           // green-grey rock, snow crowns
    treeCount: 740, trunkColor: 0x5a4028,
    foliageLow: 0x2c6a3a, foliageTop: 0x3f8c4c,
    foliage: { h: 0.33, hVar: 0.05, s: 0.48, sVar: 0.15, l: 0.29, lVar: 0.1 },
    treeSnowCap: false,
    treeAltFade: [18, 36],                              // treeline well below the summit
    tuftCount: 950, grass: { bladeA: '#4e7c40', bladeB: '#8fae6a' },
    bushCount: 208, bushColor: 0x3f7c38,
    bush: { h: 0.32, hVar: 0.05, s: 0.45, sVar: 0.1, l: 0.3, lVar: 0.1 },
    rockCount: 520, pebbleCount: 380, rockColor: 0x8e948c, rockSnowCap: false,
    flowerCount: 200, flowerColors: ['#ffffff', '#ffe234', '#7a9aff', '#e05a78'],
    hutRoof: 0x6a4028, hayColor: 0xc8bc94,
    hutCount: 14, hutZone: [0.86, 0.14], hayCount: 12,   // cabins in the valley
    splinter: [0x8a5a32, 0xdce8f0],
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
    snowPatches: { count: 60, minY: 24 },               // summit fields only
    glacier: true,
    passHotel: true,
    // hero crossing: a rope suspension bridge over a red-rock river gorge on
    // the valley run-in (the straightest window in that stretch of the lap)
    heroBridge: { at: [0.82, 0.92], half: 26, len: 230, depth: 30, skew: 0 },
    massif: { az: 1.5, spread: 2.1, count: 11, r0: 380, r1: 660,
      h0: 150, h1: 300, w0: 200, w1: 360 },
  },
  // OLIVE COAST: Mediterranean terrace (RALLY_WORLD_BIBLE 3.6). Fast, sunlit,
  // dusty tarmac between olive terraces and dry stone — warm, open, and
  // deceptively narrow. Everything here is bright and low-saturation: bleached
  // limestone ground, silver-green olive foliage, limewash walls and terracotta
  // pantiles, with ONE hot accent (#C0532E) on the shutters, the poppies and
  // the debris chips. The threat is the STONE WALL at the road edge and the
  // gravel dragged onto the exits, not the drop.
  // NEVER on this world (Bible 3.6): lush grass, northern deciduous trees, any
  // wet surface, any cool colour temperature. Hence no `surface`, no puddles,
  // no fog banks and a warm hemisphere ground bounce.
  medterrace: {
    stoneBridges: { count: 1 },
    // FogExp2 density 0.00060 ≈ 1600 u of visibility; the engine fog is linear,
    // so it is matched at the far end and pushed out at the near end — this is
    // the 140 m sight-line region and the road has to stay readable a long way
    // out (checklist R12)
    // THE AIR IS NOT THE GROUND. Fog, haze, sky horizon, terrain and the
    // house walls all sat inside one narrow beige band, so a hillside view
    // was a single cream sheet with orange roofs floating in it - the walls
    // dissolved into the fog and the roofs were the only thing left. Real
    // Mediterranean distance haze is a milky blue-grey; the limestone stays
    // warm, and now it reads AGAINST the air instead of into it.
    fogColor: 0xc9d3d1, fogNear: 380, fogFar: 1650,
    hemiSky: 0xbcd8f0, hemiGround: 0xa89a72, hemiIntensity: 0.74,
    // 5300 K key at 108000 lux: the brightest, warmest-white sun on the roster
    sunColor: 0xfff0d2, sunIntensity: 2.95,
    skyTop: '#2f7fd1', skyHorizon: '#c6d7dd', sunGlow: 0xffeec8,
    // Bible: azimuth 250°, elevation 58° — high, hard, slightly behind the
    // right shoulder on the seafront run (radians, as the engine wants)
    sunAz: 4.36, sunEl: 1.01,
    // a Mediterranean summer sky is nearly empty; what cloud there is sits high
    cloudCount: 5, cloudOpacity: 0.72, cloudTint: 0xfff6e4,
    // sea haze on the coastal half of the lap, read as a warm pale band
    hazeColor: 0xd2dcd8, hazeOpacity: 0.82,
    // dry maquis low, limestone dust high — ground base #B9A47E is the middle
    terrainLow: '#7c874d', terrainHigh: '#b9a47e', terrainDirt: '#a8905f',
    terrainScree: '#cabf9f', hutGlow: 0.32,             // hot sun, dim windows
    skirtColor: '#c2b28c',                              // cut limestone shoulder
    ground: {
      base: '#b9a47e',
      bandLight: 'rgba(255,246,214,0.07)', bandDark: 'rgba(120,104,64,0.06)',
      patchA: 'rgba(140,144,86,0.20)',                  // maquis patches
      patchB: 'rgba(214,200,164,0.20)',                 // bleached dust
      speckA: 'rgba(150,138,102,0.7)', speckB: 'rgba(226,216,188,0.8)', speckCount: 90,
    },
    road: {
      // tarmac_patched 50 % + tarmac_dry 30 %: sun-bleached grey asphalt with
      // darker patch repairs over it. Kept clearly darker than the ochre
      // landscape so the road stays the highest-contrast element (R12).
      base: '#66625b', mottleA: [72, 69, 64], mottleB: [126, 122, 114],
      ruts: false,           // sealed tarmac never takes a wheel rut
      rut: 'rgba(56,54,50,0.45)', rutCore: 'rgba(40,38,35,0.4)', tread: 'rgba(20,19,17,0.4)',
      // aggregate showing through a worn seal, not loose chippings: the light
      // stone is deliberately weak, or the road reads as gravel from the car
      stoneA: 'rgba(192,184,162,0.30)', stoneB: 'rgba(50,48,44,0.55)',
      fringe: [150, 140, 96], fringeVar: [36, 34, 26],  // dry ochre verge
    },
    hillColor: 0x8f9160, peakColor: 0xdcd0b0,           // dry olive hills, limestone tops
    // FLORA. Olive/cypress/cork oak/umbrella pine — see _buildOliveGrove.
    treeCount: 510, trunkColor: 0x8a7a5e,               // grey olive wood
    foliageLow: 0x6e7a4e, foliageTop: 0x8f9a6c,         // foliage mid → silvered
    // hue 0.21 s 0.22: the olive band. Saturation stays under the 55 % ceiling
    // the checklist sets for foliage (R02).
    foliage: { h: 0.21, hVar: 0.035, s: 0.22, sVar: 0.09, l: 0.36, lVar: 0.10 },
    treeSnowCap: false,
    vegetation: 'olive',
    understorey: 'blob',    // maquis is dense and rounded, not desert-angular
    tuftCount: 820, grass: { bladeA: '#8e8450', bladeB: '#cbbc8a' },  // dry grass + thistle
    bushCount: 420, bushColor: 0x74804e,                // rosemary / cistus maquis
    bush: { h: 0.20, hVar: 0.04, s: 0.24, sVar: 0.08, l: 0.32, lVar: 0.10 },
    rockCount: 475, pebbleCount: 340, rockColor: 0xc0b596, rockSnowCap: false,
    // cistus white, poppy (the region accent), lavender, broom
    flowerCount: 220, flowerColors: ['#efe8d2', '#c0532e', '#b28ac8', '#e8c84a'],
    hutRoof: 0xb4552e, hayColor: 0xd8c48a,              // terracotta pantiles
    hutCount: 22, hutZone: [0.44, 0.62],                // hamlet on the ridge shoulder
    hayCount: 22,
    splinter: [0xd2c7a6, 0xc0532e],                     // limestone chip + shutter red
    // no rain, no snow: the only thing in this air is dust off the verges
    weather: { type: 'dust', color: 0xd8cba4, rate: 30 },
    // Sea level at the start line, a sustained climb inland into the terraces
    // (peak +36 just past half distance), the village along the top, then the
    // ravine and the fast drop back to the coast. Measured: mean grade 4.3 %,
    // steepest 12.9 % — the Bible's 5–13 % band, before the crests go on.
    elev: {
      amp: 36, profile: 'ascent', ph: [0, 0, 0],
      keys: [[0, 0], [0.06, 0], [0.17, 6], [0.27, 17], [0.34, 20], [0.43, 30],
        [0.51, 35], [0.575, 36], [0.635, 30], [0.695, 31], [0.77, 20],
        [0.85, 9], [0.92, 2], [0.965, 0], [1, 0]],
    },
    // A tarmac stage yumps over the brows it has; it does not have take-off
    // ramps built into it. `rampCount: 0` does NOT mean zero (src/track.js
    // `(T.rampCount || 3)`), so the count is 2 and `rampMaxCurv` is tightened
    // to 0.009 until placement starves — MEASURED on the built world: 5 crests,
    // 0 ramps, which is the shape this region wants.
    rampCount: 2, crestHeight: 2.4,
    rampMaxCurv: 0.009, padMaxCurv: 0.0035, boardMaxCurv: 0.008,
    // THE STONE WALL. 1.1 u of dry stone standing right at the edge of a road
    // you are carrying fifth-gear speed on: the region's whole hazard identity.
    // `drop: 1.4` walls far more of the lap than the alpine passes do, because
    // a terrace road is walled almost continuously.
    retainingWalls: { drop: 1.4, lateral: 12.4, height: 1.1, max: 460 },
    // gravel dragged onto the outside of corner exits by earlier passes
    cornerGravel: { count: 7 },
    // stones off the terrace walls, and the road is narrow enough already
    obstacleSpec: { count: 3, style: 'boulder' },
    puddleCount: 0,                                     // never wet here
    narrows: { count: 3, min: 0.62 },                   // "deceptively narrow"
    // NO FORD, and the Bible does ask for one live stream. The world-spanning
    // river is a single held-level reach that only ever descends, and on a
    // profile that climbs 36 u it has to give that height back somewhere: with
    // a crossing on the terraces it put a MEASURED 17.6 u wall of water at the
    // edge of the carriageway, and moving the crossing down to the coast only
    // pushed the fall out onto the tail that runs back over the hillside — a
    // waterfall in dry olive country, which is worse than no stream at all.
    // Doing this properly needs a watercourse that can step down a terraced
    // hillside; the dry ravine beds this region is really made of are already
    // here. Left out on purpose rather than shipped broken.
    // NO bridgeCount: `_buildBridges` builds WOODEN PLANK FOOT-BRIDGES over the
    // road (the canyon archetype). The Bible's crossing here is a single-arch
    // stone span over a dry bed, which is not an archetype the game owns, and a
    // timber walkway over a Mediterranean tarmac road fails R03 outright.
    elements: 'medhill',
    crossroads: 2,
    // the dry inland range standing behind the terraces — low, hazy, bare
    massif: { az: 1.15, spread: 2.0, count: 8, r0: 420, r1: 700,
      h0: 90, h1: 175, w0: 210, w1: 360 },
    // THE SEA. A Mediterranean coast world shipped without one, and the
    // seaward half of every elevated view was therefore pure fog — measured
    // at 26% of the frame in a healthy lap and over half of it in the
    // player's screenshot ("Bug"). The coastline is a half-plane: everything
    // seaward of the a->b line sinks to the sea floor over a beach band, the
    // road corridor is protected the same way the river carve protects it,
    // and a water plane fills the bay. Fitted seaward of the seafront
    // straight; the ravine descent at [-146,-202] stays 120+ u on the land
    // side.
    coast: { a: [-200, -338.6], b: [400, -183.8], level: -2.1, floor: -7, beach: 70 },
    seaColor: 0x3d7f9e,
  },

  // VINEYARD VELOCE: wine country. Trellis rows and golden wheat in the open,
  // and a WALL OF FOREST all around - the fields sit in a broad clearing
  // (treeBelt holds the stands back off the road, then they close in).
  vineyard: {
    stoneBridges: { count: 2 },
    fogColor: 0xdfe4cc, fogNear: 340, fogFar: 1500,
    hemiSky: 0xbcd8f0, hemiGround: 0x9aa46a, hemiIntensity: 0.78,
    sunColor: 0xfff0c8, sunIntensity: 2.7,
    skyTop: '#3d84c8', skyHorizon: '#e8e8cc', sunGlow: 0xffeeb8,
    sunAz: 3.9, sunEl: 0.78,
    cloudCount: 8, cloudOpacity: 0.85, cloudTint: 0xfff8ea,
    terrainLow: '#7a8a4a', terrainHigh: '#c8b878', terrainDirt: '#a08858',
    terrainScree: '#b0a070', hutGlow: 0.4,
    skirtColor: '#a89868',
    ground: {
      base: '#a8a468',
      bandLight: 'rgba(232,220,160,0.09)', bandDark: 'rgba(110,120,60,0.08)',
      patchA: 'rgba(196,170,88,0.28)',                  // ripe wheat blocks
      patchB: 'rgba(120,140,70,0.22)',                  // vine-green blocks
      speckA: 'rgba(160,150,100,0.7)', speckB: 'rgba(230,214,160,0.8)', speckCount: 110,
    },
    road: {
      base: '#8a7a5c', mottleA: [110, 96, 70], mottleB: [160, 146, 112],
      rut: 'rgba(84,70,48,0.5)', rutCore: 'rgba(62,50,34,0.45)', tread: 'rgba(36,28,18,0.45)',
      stoneA: 'rgba(214,202,172,0.65)', stoneB: 'rgba(96,82,58,0.7)',
      fringe: [128, 138, 74], fringeVar: [36, 40, 26],
    },
    hillColor: 0x4e6e38, peakColor: 0x8a9a78,
    treeCount: 900, trunkColor: 0x6b4a28,
    foliageLow: 0x2e6a34, foliageTop: 0x4a8a44,
    foliage: { h: 0.3, hVar: 0.06, s: 0.5, sVar: 0.16, l: 0.28, lVar: 0.12 },
    treeSnowCap: false,
    treeBelt: [48, 150],                                // the forest ring
    tuftCount: 1500, grass: { bladeA: '#c8a850', bladeB: '#e2c878' },   // wheat
    bushCount: 144, bushColor: 0x3f7c38,
    bush: { h: 0.32, hVar: 0.05, s: 0.45, sVar: 0.1, l: 0.3, lVar: 0.1 },
    rockCount: 75, pebbleCount: 160, rockColor: 0x9a9484, rockSnowCap: false,
    flowerCount: 140, flowerColors: ['#c03a2e', '#e8d24a', '#ffffff'],
    hutRoof: 0x8a4630, hayColor: 0xe0c268,
    hutCount: 16, hutZone: [0.8, 0.2], hayCount: 44,
    splinter: [0x8a5a32, 0xe0d4a8],
    vineRows: { count: 85 },                            // carpet the slopes
    windmill: true,
    elev: { amp: 7, ph: [1.1, 2.2, 0.6] },
    rampMaxCurv: 0.02, padMaxCurv: 0.006, boardMaxCurv: 0.018,
    elements: 'medhill',
    crossroads: 2,
  },
  // DEEPWOOD TRAIL: forest ONLY. The stands close right onto the verge on
  // both sides, the fog sits close, and the lap never sees open country.
  deepwood: {
    fogColor: 0xb8c8b0, fogNear: 150, fogFar: 950,
    hemiSky: 0xa8ccb4, hemiGround: 0x54644a, hemiIntensity: 0.88,
    sunColor: 0xf8ecc8, sunIntensity: 2.55,
    skyTop: '#4a7a9c', skyHorizon: '#c8d4bc', sunGlow: 0xf0e8b8,
    sunAz: 2.4, sunEl: 0.62,
    cloudCount: 6, cloudOpacity: 0.8,
    terrainLow: '#41603a', terrainHigh: '#648250', terrainDirt: '#6a5c42',
    terrainScree: '#5a5c48', hutGlow: 0.55,
    skirtColor: '#4e4838',
    ground: {
      base: '#4c6a3c',
      bandLight: 'rgba(140,170,104,0.08)', bandDark: 'rgba(34,52,28,0.07)',
      patchA: 'rgba(70,90,44,0.25)', patchB: 'rgba(96,80,52,0.2)',
      speckA: 'rgba(90,110,70,0.7)', speckB: 'rgba(150,160,120,0.7)', speckCount: 120,
    },
    road: {
      base: '#6a5a42', mottleA: [84, 70, 50], mottleB: [130, 114, 86],
      rut: 'rgba(58,46,30,0.55)', rutCore: 'rgba(40,32,20,0.5)', tread: 'rgba(22,16,10,0.5)',
      stoneA: 'rgba(190,178,150,0.6)', stoneB: 'rgba(70,58,40,0.7)',
      fringe: [62, 88, 46], fringeVar: [26, 34, 20],
    },
    hillColor: 0x33512c, peakColor: 0x4e6a48,
    treeCount: 900, trunkColor: 0x5a4028,
    foliageLow: 0x24522c, foliageTop: 0x36703c,
    foliage: { h: 0.32, hVar: 0.05, s: 0.5, sVar: 0.14, l: 0.24, lVar: 0.1 },
    treeSnowCap: false,
    // THE CANOPY MUST CLOSE. At 12.5 u the stands began a clear three units
    // off the verge and the lap drove through open ground with a forest
    // beside it - an audit called it '1500 trees and no wood'. Starting at
    // 10.4 puts the trunks at the road edge, and pulling the belt in to 52
    // concentrates the same count into the band you actually drive through.
    treeBelt: [10.4, 52],
    tuftCount: 700, grass: { bladeA: '#3e6a34', bladeB: '#6a9a4c' },
    bushCount: 416, bushColor: 0x2c5c2c,
    bush: { h: 0.34, hVar: 0.05, s: 0.42, sVar: 0.1, l: 0.24, lVar: 0.1 },
    rockCount: 225, pebbleCount: 240, rockColor: 0x6e7264, rockSnowCap: false,
    flowerCount: 90, flowerColors: ['#ffffff', '#c8b0ff'],
    hutRoof: 0x4a3424, hayColor: 0x8a7a4e,
    hutCount: 7, hutZone: [0.9, 0.1], hayCount: 6,
    splinter: [0x5a4028, 0x9ab884],
    elev: { amp: 9, ph: [0.8, 1.9, 2.8] },
    rampMaxCurv: 0.02, padMaxCurv: 0.006, boardMaxCurv: 0.018,
    elements: 'alpine',
    vizZoneSpec: { count: 2, kind: 'fogbank' },
  },
  // DOLOMITI CORSA: gravel hairpins over alpine meadow, and the COLOSSAL
  // pale-rose rock faces standing in front - the enrosadira massif is the
  // whole skyline, per the player's Dolomites photo.
  dolomiti: {
    fogColor: 0xdce8f0, fogNear: 340, fogFar: 1650,
    hemiSky: 0xaad0f4, hemiGround: 0x7c9468, hemiIntensity: 0.8,
    sunColor: 0xfff2d8, sunIntensity: 2.8,
    skyTop: '#2f78c8', skyHorizon: '#e6eef2', sunGlow: 0xfff6d8,
    sunAz: 0.9, sunEl: 0.68,
    cloudCount: 10, cloudOpacity: 0.92, cloudTint: 0xffffff,
    terrainLow: '#4e7c40', terrainHigh: '#98a284', terrainDirt: '#8a8274',
    terrainScree: '#a89a88', hutGlow: 0.45,
    skirtColor: '#948a78',
    ground: {
      base: '#6f8a58',
      bandLight: 'rgba(214,232,196,0.06)', bandDark: 'rgba(52,72,44,0.06)',
      patchA: 'rgba(130,150,90,0.2)', patchB: 'rgba(170,168,140,0.16)',
      speckA: 'rgba(150,154,142,0.7)', speckB: 'rgba(226,232,222,0.8)', speckCount: 90,
    },
    road: {
      // pale dolomite gravel, per the hairpin photo
      base: '#b0a48c', mottleA: [150, 138, 116], mottleB: [196, 186, 162],
      rut: 'rgba(120,106,84,0.5)', rutCore: 'rgba(96,84,64,0.45)', tread: 'rgba(60,50,36,0.45)',
      stoneA: 'rgba(230,222,202,0.7)', stoneB: 'rgba(120,108,88,0.7)',
      fringe: [96, 128, 66], fringeVar: [30, 40, 22],
    },
    hillColor: 0x6e8a5c, peakColor: 0xd8c2b0,           // rose-grey rock crowns
    treeCount: 900, trunkColor: 0x5a4028,
    foliageLow: 0x2c6a3a, foliageTop: 0x3f8c4c,
    foliage: { h: 0.33, hVar: 0.05, s: 0.48, sVar: 0.15, l: 0.29, lVar: 0.1 },
    treeSnowCap: false,
    treeAltFade: [16, 34],
    tuftCount: 900, grass: { bladeA: '#4e7c40', bladeB: '#8fae6a' },
    bushCount: 192, bushColor: 0x3f7c38,
    bush: { h: 0.32, hVar: 0.05, s: 0.45, sVar: 0.1, l: 0.3, lVar: 0.1 },
    rockCount: 520, pebbleCount: 320, rockColor: 0xa89a88, rockSnowCap: false,
    flowerCount: 220, flowerColors: ['#ffffff', '#ffe234', '#e05a78', '#7a9aff'],
    hutRoof: 0x6a4028, hayColor: 0xc8bc94,
    hutCount: 18, hutZone: [0.82, 0.18], hayCount: 20,
    splinter: [0x8a5a32, 0xdce8f0],
    elev: { amp: 22, ph: [1.4, 0.5, 2.3] },
    rampMaxCurv: 0.014, padMaxCurv: 0.0045, boardMaxCurv: 0.012,
    guardFence: { lateral: 12.8, color: 0x8a8a8a, max: 220 },
    elements: 'alpine',
    snowPatches: { count: 30, minY: 16 },
    // THE COLOSSI: Sassolungo-scale towers dead ahead - tall, not wide, and
    // far enough out that no cone base reaches the arena (the first cut used
    // w up to 420 at r 360 and a rock face swallowed half the track)
    massif: { az: 4.75, spread: 1.5, count: 7, r0: 500, r1: 660,
      h0: 240, h1: 360, w0: 150, w1: 240 },   // NORTH: dead ahead off the grid
  },

  // MONACO STREETS: Monte Carlo by day - cream Riviera frontage stacked over
  // the harbour, armco-tight streets, the same sea machinery as the coast
  // worlds. The old olive-terrace dressing never looked like Monaco; the
  // buildings ARE the scenery now (frontage drops the cone horizon and puts
  // rooftops on the skyline instead).
  monteCarlo: {
    fogColor: 0xdfe6ea, fogNear: 360, fogFar: 1650,
    hemiSky: 0xbcd8f0, hemiGround: 0xb0a89a, hemiIntensity: 0.8,
    sunColor: 0xfff2d6, sunIntensity: 2.85,
    skyTop: '#2f7fd1', skyHorizon: '#e2e8ea', sunGlow: 0xffeec8,
    sunAz: 4.2, sunEl: 0.95,
    cloudCount: 5, cloudOpacity: 0.7, cloudTint: 0xfff6e4,
    terrainLow: '#9a9a84', terrainHigh: '#c2bcac', terrainDirt: '#b0a890',
    terrainScree: '#c2bcac', hutGlow: 0.3,
    skirtColor: '#b8b2a2',
    ground: {
      base: '#b4aE9c'.toLowerCase(), bandLight: 'rgba(240,238,228,0.06)', bandDark: 'rgba(90,88,76,0.05)',
      patchA: 'rgba(180,176,160,0.16)', patchB: 'rgba(214,210,196,0.16)',
      speckA: 'rgba(160,156,140,0.7)', speckB: 'rgba(230,226,212,0.8)', speckCount: 70,
    },
    road: {
      base: '#5e5c58', mottleA: [72, 70, 66], mottleB: [120, 118, 112],
      ruts: false,
      rut: 'rgba(48,47,44,0.4)', rutCore: 'rgba(36,35,32,0.35)', tread: 'rgba(18,17,16,0.4)',
      stoneA: 'rgba(196,192,184,0.6)', stoneB: 'rgba(60,58,54,0.65)',
      fringe: [150, 146, 134], fringeVar: [24, 22, 18],
    },
    hillColor: 0xa8a292, peakColor: 0xd8d2c2,
    treeCount: 221, trunkColor: 0x6b4a28,
    foliageLow: 0x2e6a34, foliageTop: 0x4a8a44,
    foliage: { h: 0.3, hVar: 0.05, s: 0.5, sVar: 0.14, l: 0.28, lVar: 0.1 },
    treeSnowCap: false,
    tuftCount: 120, grass: { bladeA: '#7a8a5a', bladeB: '#a8b47a' },
    bushCount: 96, bushColor: 0x3f7c38,
    bush: { h: 0.32, hVar: 0.05, s: 0.45, sVar: 0.1, l: 0.3, lVar: 0.1 },
    rockCount: 38, pebbleCount: 60, rockColor: 0xa8a292, rockSnowCap: false,
    flowerCount: 120, flowerColors: ['#e05a78', '#ffffff', '#c03a2e'],
    hutRoof: 0x8a4630, hayColor: 0xc8bc94,
    hutCount: 0, hutZone: [0.9, 0.1], hayCount: 0,
    splinter: [0xb0a890, 0xf0ece0],
    elev: { amp: 9, ph: [1.2, 2.5, 0.8] },
    rampMaxCurv: 0.02, padMaxCurv: 0.006, boardMaxCurv: 0.018,
    guardFence: { lateral: 12.6, color: 0xc8c8c8, max: 260 },
    elements: 'medhill',
    // Monte Carlo apartments: cream, white, apricot - continuous frontage
    frontage: {
      lateral: 16.5, depth: 9, unit: 7.5, height: 12.5, run: [5, 10],
      tints: ['#e8e0d0', '#f2ece0', '#e0c8a8', '#d8cfc0', '#e8d4c0', '#ccc4b4'],
    },
    coast: { a: [-200, -338.6], b: [400, -183.8], level: -2.1, floor: -7, beach: 70 },
    seaColor: 0x2e7f9e,
    tunnels: { count: 1 },
  },

  // HARBOR QUAY: the player's harbour reference - timber frontage down the
  // LAND side only, a cobbled quay, the faceted sea lapping the other side,
  // moored boats, barrels and nets on the stone, a lighthouse on the point.
  harbor: {
    fogColor: 0xdde6e8, fogNear: 340, fogFar: 1600,
    hemiSky: 0xb8d4ec, hemiGround: 0x9a9484, hemiIntensity: 0.8,
    sunColor: 0xffeed0, sunIntensity: 2.6,
    skyTop: '#3f84c4', skyHorizon: '#e4ebe8', sunGlow: 0xffedbe,
    sunAz: 3.6, sunEl: 0.55,
    cloudCount: 8, cloudOpacity: 0.85, cloudTint: 0xfff4e0,
    terrainLow: '#7a8a5c', terrainHigh: '#a8a888', terrainDirt: '#98907a',
    terrainScree: '#a09a88', hutGlow: 0.5,
    skirtColor: '#8e8a7a',
    ground: {
      base: '#9a9678', bandLight: 'rgba(228,224,204,0.07)', bandDark: 'rgba(90,88,70,0.07)',
      patchA: 'rgba(140,150,100,0.2)', patchB: 'rgba(196,190,168,0.18)',
      speckA: 'rgba(150,148,128,0.7)', speckB: 'rgba(226,222,204,0.8)', speckCount: 90,
    },
    road: {
      base: '#8a8578', mottleA: [108, 104, 94], mottleB: [156, 152, 140],
      ruts: false,
      rut: 'rgba(70,68,60,0.4)', rutCore: 'rgba(52,50,44,0.35)', tread: 'rgba(26,25,22,0.4)',
      stoneA: 'rgba(210,206,192,0.65)', stoneB: 'rgba(76,72,64,0.7)',
      fringe: [120, 128, 88], fringeVar: [30, 34, 24],
      cobbles: {
        stones: ['#93907f', '#7f7c6e', '#a19d8c', '#6f6c62', '#a8a291', '#8a8778'],
        mortar: 'rgba(52,50,44,0.9)', lip: 'rgba(255,252,240,0.12)',
        rows: 28, per: 46,          // ~0.48 u x 0.36 u setts, not 1.16 u ovals
      },
    },
    hillColor: 0x6e8a5c, peakColor: 0xa8b098,
    treeCount: 374, trunkColor: 0x5a4028,
    foliageLow: 0x2e6a34, foliageTop: 0x4a8a44,
    foliage: { h: 0.3, hVar: 0.06, s: 0.48, sVar: 0.14, l: 0.28, lVar: 0.1 },
    treeSnowCap: false,
    treeBelt: [40, 130],
    tuftCount: 500, grass: { bladeA: '#5e7a4a', bladeB: '#94aa6c' },
    bushCount: 176, bushColor: 0x3f7c38,
    bush: { h: 0.32, hVar: 0.05, s: 0.45, sVar: 0.1, l: 0.3, lVar: 0.1 },
    rockCount: 175, pebbleCount: 220, rockColor: 0x8e8a7a, rockSnowCap: false,
    flowerCount: 120, flowerColors: ['#ffffff', '#e0b040', '#c05a78'],
    hutRoof: 0x7a4630, hayColor: 0xd0b878,
    hutCount: 9, hutZone: [0.55, 0.35], hayCount: 10,
    splinter: [0x8a5a32, 0xe0d8c0],
    elev: { amp: 5, ph: [0.9, 2.1, 3.0] },
    rampMaxCurv: 0.02, padMaxCurv: 0.006, boardMaxCurv: 0.018,
    elements: 'medhill',
    frontage: {
      lateral: 15.5, depth: 8, unit: 7.2, height: 9.5, run: [6, 12], rows: 6,
      // WARM RENDER, NOT GREY. The shared default paints a muted stone/slate
      // street, which is right for a northern old town and wrong for this
      // one: the reference quay is limewash and painted render, ochre through
      // apricot, and that warmth is most of what makes it read as the south.
      tints: ['#e8c99a', '#dcae7a', '#f0dcc0', '#cf9a6a', '#e6d2ad', '#c98f66'],
      // THE QUAY IS OPEN TO THE WATER. `seaOpen` rejects any frontage block
      // whose centre is within this many units of the waterline (or seaward
      // of it) — so along the seafront straight the houses line ONLY the
      // land side and the seaward flank is bare quay, per the player's
      // harbour reference. The back lanes, well inland, still get both sides.
      seaOpen: 24,
      tints: ['#c9b58e', '#a8906c', '#b09a80', '#8a785e', '#c0a878', '#98826a'],
    },
    coast: { a: [-260, -75], b: [300, -63], level: -1.4, floor: -6.5, beach: 10 },
    seaColor: 0x4585a0,
    lighthouse: true,
    // quay dressing: capstone edge wall, bollards, barrels, crates, rope
    // coils on the stone, and boats moored close in (see _buildQuayside)
    quay: true,
    stoneBridges: { count: 1 },
  },

  // LANTERN QUARTER: the OLD TOWN NIGHT region. Wet cobbles under sodium
  // lamps, continuous masonry frontage on both sides, and ZERO runoff — a
  // mistake here ends against a wall, not in a field.
  //
  // The brief that matters most is the one about what it must NOT be. This is
  // the second night world in the game and it has to be unmistakably not
  // NEO-KYOTO: no cyan, no magenta, no emissive lane-work, no skyscrapers.
  // Every light source here is SODIUM or TUNGSTEN — 2100 K street lamps and
  // 2700 K shop windows — so the whole frame sits on the warm side of neutral
  // and the only cool thing in it is the sky.
  //
  // And it is deliberately lit brighter than the palette suggests. Both
  // existing night worlds were measured too dark to drive (NEON GRID at 20.7
  // mean luminance, UNDERCITY at 7.6) for exactly the same reason: a dark
  // ground texture multiplied by a dark terrain vertex colour lands at an
  // albedo no lamp can rescue. The Bible's #2A2A2E ground base is therefore
  // the DARKEST thing on the ground plane and the wet cobble road is painted
  // well above it, which is also what keeps the road the highest-contrast
  // element in frame (global law G1).
  oldtown: {
    surface: 'wet',                                     // physics reads this
    // the tightest sight line on the roster (region spec: 60 m) — the fog is
    // the reason a town circuit feels claustrophobic rather than merely narrow
    fogColor: 0x1c2436, fogNear: 110, fogFar: 780,
    // hemiSky = the little the night sky gives back; hemiGround = SODIUM
    // BOUNCE off wet stone, which is where most of the warmth in the frame
    // actually comes from. Intensity is high on purpose (see the note above).
    hemiSky: 0x323c60, hemiGround: 0x7a5426, hemiIntensity: 4.2,
    // there is no sun. The key is the sodium wash down the street: warm, low
    // and raking, so the frontage on one side is lit and the other is in
    // silhouette — the "extreme local contrast" the region is graded for.
    sunColor: 0xffb45e, sunIntensity: 2.3,
    // skyCurve WELL ABOVE 1 on purpose: `mix(horizon, top, pow(smoothstep, curve))`
    // means a high exponent holds the horizon colour — which IS the fog colour —
    // far up the dome, so the roofline meets a sky of its own fog value and the
    // skyline is silhouette rather than gradient. The zenith still goes to
    // true night, which is where the stars have to read.
    skyTop: '#0A0E1A', skyHorizon: '#1C2436', sunGlow: 0xffb45e, skyCurve: 2.4,
    sunAz: 1.05, sunEl: 0.30,
    stars: true,
    // Sodium sky-glow ringing the horizon — an orange smear over the rooftops,
    // never NEO-KYOTO's magenta. It can be this strong only because the cone
    // hills that would silhouette against it are dropped (see _buildOldTown).
    hazeColor: 0xc07830, hazeOpacity: 0.40,
    cloudCount: 10, cloudOpacity: 0.45, cloudTint: 0x4a3a3c,  // low lit overcast
    // The Bible's #2A2A2E ground base is the DARKEST value here, not the
    // albedo: the ground texture multiplies the terrain vertex colour, so a
    // literal #2A2A2E on both lands near 20/255 and no lamp can rescue it —
    // the exact fault measured on EMBER PASS and UNDERCITY. Painted at the
    // value it reads AS under 0.6 lux of moon and a sodium bounce.
    terrainLow: '#3a3a42', terrainHigh: '#4e4e58', terrainDirt: '#4c463d',
    terrainScree: '#42424a', hutGlow: 1.1,
    skirtColor: '#4a453e',                              // kerb + gutter stone
    ground: {
      base: '#56565f', bandLight: 'rgba(255,200,130,0.05)', bandDark: 'rgba(0,0,0,0.08)',
      patchA: 'rgba(30,34,48,0.24)', patchB: 'rgba(90,86,80,0.16)',
      speckA: 'rgba(220,180,120,0.4)', speckB: 'rgba(150,160,180,0.4)', speckCount: 90,
    },
    road: {
      // wet granite setts. `cobbles` paints the setts over this base and the
      // `wet` pass darkens and glazes the lot — the polish bands down the
      // wheel tracks come free with the cobble pass.
      base: '#4c4842', mottleA: [58, 55, 50], mottleB: [104, 100, 94],
      rut: 'rgba(30,28,25,0.5)', rutCore: 'rgba(20,19,17,0.45)', tread: 'rgba(12,11,10,0.4)',
      stoneA: 'rgba(150,146,136,0.55)', stoneB: 'rgba(44,42,38,0.7)',
      // the "verge" here is a granite kerb and gutter, never grass
      fringe: [62, 60, 56], fringeVar: [18, 18, 16],
      ruts: false,                                      // stone setts do not rut
      cobbles: {
        stones: ['#7c766c', '#6a655d', '#8a8378', '#5e5a53', '#948c80', '#726d65'],
        mortar: 'rgba(30,29,27,0.9)', lip: 'rgba(255,214,150,0.16)',  // sodium on the crowns
        rows: 28, per: 48,          // fine wet setts under the sodium light
      },
      // roughness 0.32 / reflection 0.85 in the region spec: a hard wet
      // surface, standing water on about a fifth of the roadbed
      wet: { darken: 0.24, gleam: 18, pools: 6 },
    },
    // no massif and no highland: this is a street grid over a hill, and the
    // hill is the road's own elevation profile, not a mountain range
    hillColor: 0x141a28, peakColor: 0x1e2638, hillDrop: 10, highland: 0,
    // FLORA IS MINIMAL BY DESIGN: pollarded planes in the square and around
    // the small park, nothing else. No conifers anywhere near a town.
    treeCount: 44, trunkColor: 0x4a463e,
    foliageLow: 0x1a241c, foliageTop: 0x27331f,
    foliage: { h: 0.28, hVar: 0.03, s: 0.22, sVar: 0.06, l: 0.13, lVar: 0.05 },
    treeSnowCap: false,
    tuftCount: 0, grass: {},                            // paving, not meadow
    bushCount: 42, bushColor: 0x1f2a20,                 // clipped park hedging
    bush: { h: 0.29, hVar: 0.03, s: 0.20, sVar: 0.05, l: 0.14, lVar: 0.05 },
    // NO gravel, NO boulders, NO pebbles — the region's negative list. The
    // rock colour is still needed: the pinch dressing builds its kerb teeth
    // from it, and here they read as the concrete blocks at the arch corners.
    rockCount: 0, pebbleCount: 0, rockColor: 0x6e6e76, rockSnowCap: false,
    heroRock: false,
    flowerCount: 0, flowerColors: ['#f2a93b'],
    hutRoof: 0x565c66, hutCount: 0, hayColor: 0x6a6258, hayCount: 0,  // slate
    splinter: [0x8a8078, 0xf2a93b],                     // masonry chips + accent
    weather: { type: 'rain', color: 0xc8a878, rate: 26 },  // the rain that just stopped
    // A TOWN ON A HILL. The lap starts in the lower town, climbs the east
    // avenue in TWO SHORT COBBLED RAMPS to the cathedral square at the top,
    // and falls the whole way back down the west wall street. 42 u of gain
    // over a 1.7 km lap: a 3–9 % dominant gradient with the two ramps
    // steepening past 15 %, which is the region's terrain table.
    elev: {
      amp: 42, profile: 'ascent', ph: [0, 0, 0],
      keys: [[0, 0], [0.06, 0], [0.125, 3.5], [0.19, 8],
        [0.235, 16],                                    // ramp 1
        [0.29, 20.5], [0.34, 25],
        [0.385, 33],                                    // ramp 2
        [0.44, 38], [0.50, 42], [0.56, 41],
        [0.63, 36], [0.70, 29], [0.77, 21], [0.84, 13], [0.90, 6],
        [0.95, 0], [1, 0]],
    },
    // A street is flat between its buildings: the ground barely moves, and
    // what movement there is comes from the elevation profile, not noise.
    relief: 0.3, blend: { near: 12, far: 46 },
    // Jumps in a town would be absurd, and `rampCount: 0` does NOT mean zero
    // (`T.rampCount || 3`). Starving the placement with a tiny straightness
    // ceiling is the honest way to get short cobbled humps instead of yumps.
    rampMaxCurv: 0.0016, padMaxCurv: 0.0035, boardMaxCurv: 0.008,
    crestHeight: 1.6,                                   // stepped street, not a crest
    // THE SIGNATURE SQUEEZE: arched gateways, twice per stage. The width pinch
    // is the existing narrows machinery; `_buildOldTown` hangs the arch itself
    // over each pinch, so the geometry and the physics agree by construction.
    // Asked for THREE because the placement is a search — it needs a straight
    // window of 50-84 samples clear of the start line, and a street grid this
    // broken up does not always offer two. `_buildOldTown` arches the first two
    // that land; a third, if it lands, is a plain kerbed squeeze.
    narrows: { count: 3, min: 0.62 },
    obstacleSpec: undefined,                            // nothing parked in a street
    puddleCount: 5,
    puddle: {
      rim: '#23252c', mud: '#0d0f14',
      sheen: 'rgba(255,190,120,0.26)', gleam: 'rgba(255,214,150,0.34)',
    },
    // sodium street lamps on the kerb line, 12 m apart counting both sides
    lamps: { color: 0xffb14a, every: 7, height: 4.6 },
    elements: 'oldtown',
    // THE REGION'S OWN GEOMETRY. Continuous townhouse frontage down both sides
    // of the street, the arched gateways, the mid-ground blocks behind, and
    // the cathedral campanile that is visible from three points on the route.
    // See `_buildOldTown`.
    frontage: {
      lateral: 17.5, depth: 8, unit: 7.0, height: 9.0,
      run: [4, 9],                                      // units per terrace block
      tints: ['#c9b58e', '#a89c92', '#b09088', '#9aa0a4', '#c0a878', '#8e9298'],
    },
  },

  // HEDGEROW DASH: farmland lanes, per RALLY_WORLD_BIBLE 3.8. Overcast, low
  // sun straight down the lane, everything green and grey and nothing bright.
  // The identity is the BANK — a 1.9 u earth wall topped with 2.3 u of thorn
  // running both sides of the road, so a car that goes wide meets masonry-hard
  // ground rather than runoff. Mud off the field entrances, blind crests, and
  // no mountain anywhere: the negative list forbids exposed rock, dry dust,
  // bright colour and any sight line worth the name.
  farmland: {
    stoneBridges: { count: 2 },
    surface: 'wet',                                     // "wet mixed" — physics reads this
    // Bible fog is FogExp2 d=0.00150 #C3CBD2; the engine's fog is linear, so
    // near/far are set to the same half-fade (~550) and extinction (~1150).
    fogColor: 0xc3cbd2, fogNear: 170, fogFar: 950,
    // OVERCAST IS NOT DARK. This shipped at 0.58 — the LOWEST hemisphere
    // intensity of all 32 worlds, against a daylight norm of 0.72-0.80 — on the
    // reasoning that an overcast sky is dim. It is the opposite: a solid cloud
    // deck is a very large diffuse source, which is why an overcast day has
    // weak SHADOWS and plenty of light. Measured, the pairing of 0.58 ambient
    // with the roster's second-weakest sun (2.05) and the darkest terrain
    // palette in the game rendered the world essentially black — see the note
    // on terrainLow below. The sun stays weak, which is the real overcast
    // signature (flat, shadowless); the sky dome carries the exposure.
    hemiSky: 0x9fb2c6, hemiGround: 0x6a6350, hemiIntensity: 0.95,
    sunColor: 0xffe4ce, sunIntensity: 2.05,             // 4800 K, broken by cloud
    skyTop: '#6F8CA8', skyHorizon: '#C3CBD2', sunGlow: 0xffe4ce,
    skyCurve: 0.7,                                      // overcast: the pale reaches high
    sunAz: 5.24, sunEl: 0.31,                           // 300° bearing, 18° up — down the lane
    cloudCount: 16, cloudOpacity: 0.95, cloudTint: 0xd6dbe0,
    // THE WHOLE PALETTE HAD TO COME UP. As authored these were 446232 /
    // 7d8a63 / 4e4535, whose relative luminances are 0.102 / 0.234 / 0.061 —
    // the ENTIRE range sat below the DARK end of every other world on the
    // roster (forest 0.201-0.381, alpine 0.200-0.426, outback 0.310-0.506), and
    // the ploughed-earth tone at 0.061 was near enough to black that the field
    // patches read as holes in the ground rather than as soil. Each colour is
    // a plausible sample of a wet English field on its own; as the only three
    // colours in a world lit by the weakest sun on the roster, they are not a
    // world you can see to drive in. Now 0.220 / 0.391 / 0.161 — sitting on
    // forest's band, still the least saturated and the greyest palette in the
    // game, which is what makes this region read as farmland rather than as a
    // forest floor.
    terrainLow: '#6d8a4e', terrainHigh: '#9db075', terrainDirt: '#7d6f56',
    // bank faces and the cut of the sunken lane, both bare earth
    terrainScree: '#5a5442', skirtColor: '#5a4f3c', hutGlow: 0.42,
    ground: {
      // lifted with the terrain palette above — this texture multiplies the
      // vertex colour, so leaving it at the old 4d6b39 would have cancelled
      // most of that lift back out
      base: '#6b8749', bandLight: 'rgba(255,255,255,0.05)', bandDark: 'rgba(40,52,30,0.07)',
      patchA: 'rgba(122,106,80,0.22)',                  // ploughed earth
      patchB: 'rgba(150,160,116,0.16)',                 // cut hay / stubble
      speckA: 'rgba(78,104,58,0.7)', speckB: 'rgba(170,180,140,0.7)', speckCount: 70,
    },
    road: {
      // patched tarmac (35% of the Bible surface mix) with the dirt and mud
      // that make up another 45% of it dragged across the top
      base: '#4c4a44', mottleA: [62, 54, 42], mottleB: [110, 108, 102],
      rut: 'rgba(46,38,26,0.5)', rutCore: 'rgba(32,26,18,0.45)', tread: 'rgba(18,14,10,0.4)',
      stoneA: 'rgba(178,174,164,0.55)', stoneB: 'rgba(52,48,42,0.7)',
      fringe: [58, 92, 40], fringeVar: [28, 38, 22],    // grass right to the edge
      wet: { darken: 0.32, gleam: 9, pools: 5 },
    },
    // no mountains anywhere: a low green ridge line, sunk and half-eaten by fog
    hillColor: 0x54664a, peakColor: 0x8a94a0, hillDrop: 34,
    // the fields come up to the lane fast — that is what a sunken lane is
    blend: { near: 11, far: 44 },
    // Tier-4 flora is ONLY the hedgerow standards: oak and ash on the bank top.
    // `birch` stands in for ash (pale bark, airy crown — the nearest silhouette
    // in the species table). Weights are the Bible's 0.14 / 0.12, renormalised
    // over the tree tier so they sum to 1.0 (checklist R04).
    treeCount: 740, trunkColor: 0x6b5a44,
    foliageLow: 0x35502a, foliageTop: 0x4a6b34,
    foliage: { h: 0.26, hVar: 0.05, s: 0.34, sVar: 0.14, l: 0.25, lVar: 0.10 },
    treeSnowCap: false,
    // bracken and pasture grass; bramble and nettle as the understorey mass
    tuftCount: 1400, grass: { bladeA: '#4a6b34', bladeB: '#7a8f52' },
    understorey: 'blob',                                // broadleaf scrub = bramble
    bushCount: 416, bushColor: 0x35592c,
    bush: { h: 0.26, hVar: 0.04, s: 0.40, sVar: 0.10, l: 0.24, lVar: 0.10 },
    // "Never: exposed rock." No boulders, no hero erratic — only road grit.
    rockCount: 0, pebbleCount: 140, rockColor: 0x7e7468, rockSnowCap: false,
    heroRock: false,
    // "Never: bright colours." Nothing in the verge is allowed to shout.
    flowerCount: 0, flowerColors: ['#e8e4d2'],
    hutRoof: 0x4a5058,                                  // slate
    hutCount: 18,                                       // dispersed, never a village
    hayColor: 0x6e7a52, hayCount: 22,                   // silage bales in green wrap
    hayNear: 18, hayFar: 30,                            // stacked in the field, behind the hedge
    splinter: [0x7e7468, 0xe8e4d2],                     // rubble stone + lime pointing
    weather: { type: 'rain', color: 0xc3cbd2, rate: 90 },
    // rolling farmland: 40-260 m base, 4-12 % dominant gradient. The short
    // crests that make the lane blind come from `rampCount` below, not here.
    elev: { amp: 12, ph: [1.9, 0.7, 2.4] },
    // Crests are the point of this world: ten a lap (rampCount + 3), and the
    // straightness ceiling is loose enough that some of them sit on the entry
    // to a bend — "blind crests into tightening corners", per the Bible.
    rampCount: 9, crestHeight: 3.1,
    rampMaxCurv: 0.016, padMaxCurv: 0.0035, boardMaxCurv: 0.012,
    // 4.2-5.6 m roadbed: the narrowest region outside Old Town. 0.52 asks for
    // a harder pinch than any other world (AVALANCHE ALLEY, the previous
    // worst, is 0.55) and lands on _buildWidthProfile's 5 u floor, so this is
    // as narrow as the engine goes. The count is a request: this lane is
    // turning almost everywhere and only two windows are straight enough for
    // one, which is why the start straight above is dead straight.
    narrows: { count: 3, min: 0.52 },
    // THE BANK. See _buildHedgeBanks — this is the region's hazard signature.
    hedgeBanks: { lateral: 13.6, bankH: 1.9, bankW: 2.4, hedgeH: 2.3, bay: 6.2, max: 640 },
    // streams in the valley bottoms, washing over the lane
    fords: { count: 2 }, riverBank: { base: '#5a5442' }, reedColor: 0x5f7a3a,
    // height fog in the field hollows + a wet squall; NEVER a tree corridor —
    // the viz-corridor builder plants dense trunks where the banks already are
    viz: [['fogbank', 2], ['squall', 1]],
    // mud dragged onto the tarmac at the field entrances: 6-10 patches a stage
    puddleCount: 9,
    puddle: {
      rim: '#4a4030', mud: '#221c12',
      sheen: 'rgba(150,165,180,0.28)', gleam: 'rgba(200,215,225,0.34)',
    },
    elements: 'hedgerow',
    // no massif, no glacier, no obstacleSpec, no hazard specs — the lane, the
    // bank and the weather are the whole of it.
  },

  // OUTBACK RED DIRT (Bible 3.10). The fastest region in the game and the one
  // you can see furthest across: hardpack red laterite over a gibber plain,
  // flat-topped mesa escarpments on the skyline, and a sun 66° up that leaves
  // almost no shadow to read the surface by.
  //
  // It must NOT read as DEEP DESERT with the hue turned round. The dune worlds
  // are a sand SEA — smooth golden rollers, palms, no stone. This is hardpack:
  // the ground is dark red and littered with gibber (hence the very high
  // pebble count and the stony ground speckle), the flora is grey-green and
  // sparse rather than tropical, and the road is a hard, fast, dead-straight
  // graded track rather than a serpent through dunes.
  //
  // The negative list is doing real work here: no rock walls beside the road
  // (no cliffWalls, no stone field walls in the kit), no tight corners in
  // sequence (see CIRCUITS.outback), no cool colours, NO FOG (viz: [] kills
  // the fog banks and squalls outright — the atmosphere is warm dust haze at
  // 350 m, not weather), and no green ground cover (every green in the world
  // is desaturated to olive/grey-green, foliage saturation well under 55 %).
  //
  // Hazard signature: bulldust (puddleCount — the puddle system already gives
  // heavy hull drag, a grip cut and a dust burst, which IS a bulldust hole,
  // and the decal is retinted to the "identical-looking, slightly paler patch"
  // the Bible describes), dry creek crossings that launch a car off the far
  // bank (T.creeks — see _planCreeks), and kangaroos (LIVESTOCK_BY_THEME).
  outback: {
    fogColor: 0xe8c79a, fogNear: 350, fogFar: 1800,      // sight line 350 m — the longest in the game
    // Bible 3.10 gives "ambient sky intensity 0.44, heavy red ground bounce
    // #B85A38". The bounce colour is taken literally. The 0.44 is NOT the same
    // quantity as this engine's hemisphere intensity, and taken literally it
    // rendered the region at Very High contrast — black shadow sides on every
    // rock and hut under a near-overhead sun — when the comparison table in
    // section 4 calls for MEDIUM. 0.72 is the value that produces the contrast
    // the document asks for; the deviation is deliberate and measured.
    hemiSky: 0xa8cdea, hemiGround: 0xb85a38, hemiIntensity: 0.72,
    sunColor: 0xffedcc, sunIntensity: 3.15,              // 5500 K, 122000 lux — the brightest world
    skyTop: '#3a86c9', skyHorizon: '#e8c79a', sunGlow: 0xffe6b0,
    sunAz: 0.96, sunEl: 1.15,                            // 55° bearing, 66° elevation: near-overhead
    cloudCount: 4, cloudOpacity: 0.42, cloudTint: 0xfff2e0,
    hazeColor: 0xe8c79a, hazeOpacity: 0.95,
    // THE GROUND IS A PRODUCT, NOT A COLOUR. The terrain material carries the
    // ground texture AND per-vertex colours, so what you see is
    // `ground.base x terrainLow` multiplied in linear space. Writing the
    // Bible's ground base (#A8452A) into both squares it and the plain came
    // out as near-black crimson. These are the square ROOTS of the palette
    // values, so the albedo that actually reaches the screen is the palette:
    // #cf8568 x #cf8568 -> #A8452A, measured.
    //
    // `terrainDirt` is the patch colour the terrain sprinkles on a ~140 u
    // sinusoid, and it is LIGHTER than the base on purpose: a darker one read
    // as a black checkerboard laid over the plain, where what the outback
    // shows is drifts of pale bleached dust over the red.
    terrainLow: '#cf8568', terrainHigh: '#e0b492', terrainDirt: '#e2c3a4',
    // steep-face colour for the faceted ground + warmth in the homestead windows
    terrainScree: '#c07a5c', hutGlow: 0.4,
    skirtColor: '#a85234',
    // a plain, not a range: the local relief is dialled back so the sight line
    // survives, but `highland` stays at full so the massif and the mesas still
    // stand up out at r > 400
    relief: 0.55, highland: 1, blend: { near: 18, far: 84 },
    ground: {
      // dark red laterite, stony rather than sandy: patches of bleached dust
      // over it and a heavy dark speckle for the gibber
      base: '#cf8568', bandLight: 'rgba(255,232,200,0.05)', bandDark: 'rgba(112,48,28,0.06)',
      patchA: 'rgba(150,72,44,0.20)', patchB: 'rgba(226,178,132,0.16)',
      speckA: 'rgba(64,34,24,0.8)', speckB: 'rgba(232,204,170,0.7)', speckCount: 140,
    },
    road: {
      // graded hardpack: paler and pinker than the verge because the traffic
      // has polished the dust off it, with loose gravel scattered across
      base: '#b4573a', mottleA: [140, 66, 42], mottleB: [206, 134, 94],
      rut: 'rgba(128,54,30,0.5)', rutCore: 'rgba(96,38,20,0.42)', tread: 'rgba(58,24,12,0.45)',
      stoneA: 'rgba(226,198,160,0.72)', stoneB: 'rgba(112,52,32,0.7)',
      fringe: [152, 132, 76], fringeVar: [34, 30, 26],   // dry spinifex verge, never a green kerb
    },
    hillColor: 0x9c4630, peakColor: 0xc8865a, horizon: 'mesa', // mesa escarpments
    // OUTBACK FLORA (Bible 3.10 table): river red gum on the creek lines,
    // desert oak and mulga on the plain. See _buildOutbackScrub.
    vegetation: 'outback', treeCount: 255, trunkColor: 0xc4b79f,
    foliageLow: 0x6e785c, foliageTop: 0x848e6c,
    foliage: { h: 0.215, hVar: 0.03, s: 0.13, sVar: 0.07, l: 0.40, lVar: 0.08 },
    treeSnowCap: false,
    // spinifex: dry gold hummocks, everywhere, right up to the road edge
    tuftCount: 1000, grass: { bladeA: '#9a8f46', bladeB: '#cdbc70' },
    // saltbush — the 'spike' silhouette is the desert-scrub one
    bushCount: 384, bushColor: 0x8b9070, understorey: 'spike',
    bush: { h: 0.22, hVar: 0.04, s: 0.12, sVar: 0.06, l: 0.42, lVar: 0.08 },
    // GIBBER PLAIN: the pebble count is the highest in the game on purpose —
    // the ground is supposed to be paved with small dark stones
    rockCount: 475, pebbleCount: 900, rockColor: 0x8e4a30, rockSnowCap: false,
    rockRoughness: 1,
    flowerCount: 130, flowerColors: ['#e8c23a', '#d8523a', '#f0e0b8'],
    hutRoof: 0x9aa0a2, hayColor: 0xc9b177,               // corrugated iron, station fodder
    hutCount: 22, hutZone: [0.30, 0.48], hayCount: 34,   // the station cluster
    splinter: [0xc9b9a2, 0x8e8478],                      // weatherboard bleached to grey
    weather: { type: 'dust', color: 0xc4703f, rate: 84 },// red dust always in the air
    // 2–8 % dominant gradient over long swells; the sharp gradients in this
    // world are the creek banks, not the profile
    elev: { amp: 5, ph: [2.1, 0.9, 1.6] },
    // fast open world: crests are allowed on almost anything, and there are a
    // lot of them, because a plain with no vertical event in it is a corridor
    rampCount: 6, crestHeight: 3.4,
    rampMaxCurv: 0.020, padMaxCurv: 0.005, boardMaxCurv: 0.016,
    // BULLDUST: 11 holes a lap (Bible says 8–15), sitting anywhere across the
    // width including mid-road, with the decal knocked back to a matte pale
    // dust patch — the whole point is that it looks like the road
    puddleCount: 11,
    puddle: { rim: '#b06a44', mud: '#c99a72', sheen: 'rgba(226,196,160,0.30)',
      gleam: 'rgba(240,222,192,0.22)' },
    puddleRough: 0.95, puddleMetal: 0,                   // dust, not water: no gleam
    // DRY CREEK CROSSINGS: the region's other trap. Four notches a lap, each
    // one a 15 %-ish drop into a sand bed and a climb out over a bank you can
    // launch off. See _planCreeks / _buildCreekBeds.
    creeks: { count: 4, depth: 3.6, len: 34, half: 9 },
    // the one authored water crossing — a permanent waterhole in a creek
    fords: { count: 1 },
    // NEVER FOG (negative list). Explicit [] so the theme can never inherit a
    // fog bank or a squall from a table default.
    viz: [],
    // a soft shoulder that falls away, not a squeeze: two gentle pinches only
    narrows: { count: 2, min: 0.74 },
    // no boulders in the road: the region's runoff is High and its sight line
    // is 350 m, so a rock on a straight is not a hazard, it is a lie
    obstacleSpec: null,
    crossroads: 3,                                       // station tracks off the main road
    elements: 'outback',                                 // homestead kit (weatherboard + iron)
    // mesas standing off the north-east horizon rather than a mountain wall
    massif: { az: 0.9, spread: 2.4, count: 7, r0: 460, r1: 720,
      h0: 90, h1: 165, w0: 260, w1: 430 },
  },
};

/** THE MEDITERRANEAN FIVE.
 *
 *  Built by CLONING the harbour, deliberately: the coastal machinery (the
 *  faceted sea, the quay strip, the open-to-the-water frontage rule, the
 *  lighthouse, the cobbles) is the same problem on every one of these coasts,
 *  and forking it five times is how the back half of the roster became five
 *  copies of one world. What differs is what actually differs between these
 *  places - the building culture, the paint, the light and the water.
 *
 *  Each names its own ELEMENT KIT (different house SHAPES, not a retint) and
 *  its own frontage tints, so a street in Liguria and a street in the Aegean
 *  cannot be mistaken for one another from the driving seat.
 */
for (const [key, over] of [
  ['liguria', {
    vegetation: 'olive',
    hutGlow: 0.12,                                   // ITALY - Cinque Terre
    elements: 'liguria',
    frontage: { tints: ['#e98d5a', '#e8b45c', '#d9686a', '#e4c37a', '#c9705a', '#efd9a6'], roof: 0xb4552e, face: { render: '#f0e4cf', plinth: '#a98a68', trim: '#f6ecd8', frame: '#3f6b46', shutter: '#3f6b46' } },
    seaColor: 0x2f7fa8, sunColor: 0xffe8c0, sunIntensity: 2.7,
    skyTop: '#2f7fd1', skyHorizon: '#e8ddc6',
    terrainLow: '#7d8a4e', terrainHigh: '#a89a68',
    hillColor: 0x8a8a58, peakColor: 0xb0a67e,
  }],
  ['aegean', {
    vegetation: 'olive',
    hutGlow: 0.12,                                    // GREECE
    elements: 'aegean',
    frontage: { tints: ['#f6f4ee', '#efece2', '#f8f6f2', '#e9e6dc', '#f2efe6'], roof: 0x3f86c6, face: { render: '#f7f5ef', plinth: '#e2ded4', trim: '#ffffff', frame: '#2f6fae', shutter: '#2f6fae' } },
    seaColor: 0x1f7fc4, sunColor: 0xfff4d8, sunIntensity: 3.0,
    skyTop: '#2a86dc', skyHorizon: '#eaf1f4',
    terrainLow: '#9a9a6a', terrainHigh: '#c0b489',
    hillColor: 0xa8a276, peakColor: 0xcabf94,
  }],
  ['brava', {
    vegetation: 'olive',
    hutGlow: 0.12,                                     // SPAIN - Costa Brava
    elements: 'andalusia',
    frontage: { tints: ['#f4ecdc', '#eed8a8', '#e8c88c', '#f6f0e4', '#dcb87a'], roof: 0xb85c33, face: { render: '#f4ecda', plinth: '#c9b592', trim: '#fdf6e8', frame: '#7a5a34', shutter: '#8a5a2c' } },
    seaColor: 0x2b6f9c, sunColor: 0xffe6b4, sunIntensity: 2.9,
    skyTop: '#3182cc', skyHorizon: '#efe2c6',
    terrainLow: '#8a8a52', terrainHigh: '#c2ad78',
    hillColor: 0x9c9060, peakColor: 0xc4b485,
  }],
  ['dalmatia', {
    vegetation: 'olive',
    hutGlow: 0.12,                                  // CROATIA
    elements: 'dalmatia',
    frontage: { tints: ['#e9e2d0', '#dfd6c2', '#f0ebdc', '#d8cfba', '#e6dcc6'], roof: 0xc0603a, face: { render: '#f0ead9', plinth: '#c2b9a2', trim: '#f8f2e4', frame: '#4a6b4a', shutter: '#4a6b4a' } },
    seaColor: 0x1c86ae, sunColor: 0xfff0d4, sunIntensity: 2.8,
    skyTop: '#2f8ad4', skyHorizon: '#e6eee8',
    terrainLow: '#6f8450', terrainHigh: '#a8a276',
    hillColor: 0x8e9464, peakColor: 0xc0bb96,
  }],
  ['azur', {
    vegetation: 'olive',
    hutGlow: 0.12,                                      // FRANCE - Cote d'Azur
    elements: 'azur',
    frontage: { tints: ['#f3d9c4', '#efc9b0', '#e8c8cf', '#dcd2e2', '#f6ead6', '#e9d3a8'], roof: 0xc07a52, face: { render: '#f6e7d6', plinth: '#d8c4ae', trim: '#fbf0e2', frame: '#8fb4cc', shutter: '#8fb4cc' } },
    seaColor: 0x2f74a6, sunColor: 0xffeccc, sunIntensity: 2.6,
    skyTop: '#3a86c8', skyHorizon: '#eee4d2',
    terrainLow: '#7f8a58', terrainHigh: '#b0a478',
    hillColor: 0x94926a, peakColor: 0xbcb491,
  }],
]) {
  THEMES[key] = {
    ...THEMES.harbor,
    ...over,
    // the frontage override is a PATCH, not a replacement: geometry (lateral,
    // depth, unit, height, run, seaOpen, side) stays the harbour's
    frontage: { ...THEMES.harbor.frontage, ...(over.frontage || {}) },
  };
}


// SKETCH A and SKETCH B get their own places.
//
// OLIVE COUNTRY is OLIVE COAST inland: the same terraces, groves and limewash,
// with the sea removed, because that route never reaches a shore and a coast
// block it cannot see only risks flooding a lap (which is exactly how BRIDGE
// RUN first came out - the car floating in a tunnel bore).
//
// MOUNTAIN TO SEA puts the water on ONE flank, east of the whole route, and
// the massif opposite: the drawing labels one side "mountain" and the other
// "sea", and that is the entire idea of the layout.
// OLIVE CROSSING: medterrace WITHOUT the sea - and that is exactly what broke
// it. medterrace's haze and sky horizon are a pale sand (#ddd6be over fog
// 0xd8d0b8) which works on a COAST, because the sea lays a blue band between
// the beige ground and the beige sky. Take the sea away and ground, haze, sky
// and the horizon mountains are all the same colour: the player's screenshot of
// this world is two thirds featureless beige with no horizon line in it at all.
// An inland world needs its own air - cooler and lighter than its ground - and
// hills that are not the colour of the sky they stand against.
THEMES.olivecountry = { ...THEMES.medterrace, coast: undefined, quay: false,
  skyTop: '#3a86cf', skyHorizon: '#bcd2dc',
  fogColor: 0xc4d2d6, fogNear: 520, fogFar: 2200,
  hillColor: 0x7c8a58, peakColor: 0x9aa886,
  treeCount: Math.round((THEMES.medterrace.treeCount ?? 500) * 1.35) };
THEMES.mountainsea = {
  ...THEMES.dalmatia,
  // The sea sits BELOW the road's lowest point, not at the harbour's default.
  // This route dips to -4.3 u, and at the inherited -1.4 the lap's low
  // sections were underwater 150 u inland - 514 of its samples read as wet.
  coast: { a: [255, -580], b: [285, 580], level: -11, beach: 14 },
  massif: { az: 3.14, spread: 1.9, count: 8, r0: 430, r1: 700,
    h0: 110, h1: 200, w0: 200, w1: 340 },
};


/** SAFARI PLAINS gets its OWN place.
 *
 *  It shared the `dunes` theme with THE DUNE SERPENT - not a similar theme,
 *  the SAME one - which is why an audit measuring frame similarity found them
 *  closer to each other than any other pair on the roster. The layout was
 *  never the problem: a C wrapped round a bay is a good shape. It had no
 *  ground of its own.
 *
 *  So: bleached savanna grass instead of dune sand, flat-crowned acacias
 *  instead of palms, rust-red termite mounds instead of pale desert stone, and
 *  a green horizon rather than a dune sea. The cactus builder already carries
 *  the acacia; it only ever needed to be asked for it.
 */
THEMES.savanna = {
  ...THEMES.dunes,
  terrainLow: '#b8a05a', terrainHigh: '#e0cf8a', terrainDirt: '#a8834a',
  hillColor: 0xa8a05e, peakColor: 0xcabf80, horizon: undefined,
  skyTop: '#6fa8d8', skyHorizon: '#f0e2b0',
  vegetation: 'cactus', treeCount: 255, trunkColor: 0x6a5138,
  tuftCount: 900, grass: { bladeA: '#c9b45e', bladeB: '#e8dca0' },
  bushCount: 192, bushColor: 0x8a8a4a,
  rockCount: 112, pebbleCount: 160, rockColor: 0xa8603a,
  hutCount: 7, hayCount: 0,
};
