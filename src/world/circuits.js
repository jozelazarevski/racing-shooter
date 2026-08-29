// DEAD COPY — NOTHING IMPORTS THIS FILE. The live code is in src/track.js
// (and friends); this directory is an abandoned split that has already
// drifted (this sky.js is missing the horizon-solids fix, its _buildMassif
// registers no colliders). Editing here changes nothing in the game and
// reading here misleads — it cost the mountain-sinking investigation an
// hour. Verified dead by import grep across src/, tests/, index.html.
// Hand-designed circuit control polygons, one per theme, plus the
// switchback generator they share. Pure 2D data — the Track class
// turns these into the sampled centreline.

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
export const CIRCUITS = {
  // SKETCH A, hand-read: the big top loop with a hairpin biting into it, the
  // long sweep down the left, and the strand that cuts back across the lap -
  // the crossing the drawing wants bridged. Olive country.
  oliveCross: [
    [-53, 224], [-23, 233], [7, 241], [38, 239], [68, 231],
    [94, 215], [111, 190], [117, 160], [113, 129], [93, 106],
    [63, 115], [47, 140], [25, 161], [3, 143], [-1, 113],
    [-20, 90], [-48, 98], [-59, 126], [-81, 146], [-104, 125],
    [-108, 95], [-126, 70], [-143, 45], [-153, 16], [-153, -15],
    [-137, -41], [-108, -50], [-77, -53], [-46, -50], [-15, -49],
    [16, -50], [47, -53], [77, -60], [102, -76], [110, -104],
    [95, -131], [65, -137], [34, -138], [3, -135], [-28, -133],
    [-59, -132], [-90, -138], [-114, -157], [-119, -185], [-105, -210],
    [-78, -225], [-47, -227], [-16, -229], [15, -226], [46, -221],
    [76, -213], [103, -199], [127, -179], [144, -153], [150, -123],
    [150, -92], [146, -61], [134, -32], [115, -8], [91, 10],
    [62, 22], [31, 26], [1, 24], [-28, 13], [-51, -9],
    [-72, 12], [-80, 41], [-82, 72], [-79, 103], [-76, 134],
    [-72, 165], [-65, 195],
  ],
  // SKETCH B, hand-read: a vertical CHAIN of lobes, each looping back across
  // the one before - the drawing's stacked coils, mountain on one flank and
  // water on the other. Four crossings, all bridged.
  mountainSea: [
    [-50, -131], [-80, -149], [-92, -181], [-84, -215], [-56, -236],
    [-22, -233], [3, -209], [8, -175], [2, -155], [2, -152],
    [0, -148], [-8, -141], [-17, -108], [-4, -76], [27, -59],
    [60, -66], [81, -94], [77, -117], [61, -119], [39, -92],
    [16, -65], [-6, -38], [-29, -11], [-53, 13], [-82, -6],
    [-92, -39], [-82, -72], [-53, -91], [-19, -87], [4, -61],
    [7, -27], [2, -7], [1, -5], [0, -2], [-8, 5],
    [-13, 37], [0, 70], [29, 87], [63, 77], [82, 49],
    [76, 27], [60, 29], [37, 56], [14, 82], [-8, 109],
    [-31, 136], [-56, 157], [-83, 137], [-92, 103], [-82, 73],
    [-54, 58], [-18, 62], [5, 87], [7, 122], [4, 136],
    [3, 140], [1, 143], [-11, 155], [-16, 189], [1, 219],
    [33, 232], [65, 221], [83, 191], [80, 157], [65, 125],
    [50, 92], [35, 60], [22, 28], [8, -3], [-7, -35],
    [-21, -67], [-35, -100],
  ],

  // SKETCH C, hand-read from the drawing: the tall top loop, two horizontal
  // bars, and the strand up the left that CROSSES both of them - which is
  // where the drawing writes 'Bridge'. Three crossings in all, every one of
  // them built as road-over-road by _planOverpasses. Measured against the
  // game's own spline math: min radius 5.6 u, self-approach 21.0 u.
  bridgeRun: [
    [-21, 197], [5, 198], [31, 200], [57, 199], [65, 192],
    [63, 185], [47, 180], [22, 177], [-3, 174], [-18, 153],
    [-1, 134], [21, 122], [47, 116], [73, 112], [97, 104],
    [95, 87], [71, 79], [45, 75], [20, 67], [0, 51],
    [4, 33], [28, 24], [54, 19], [80, 24], [91, 42],
    [77, 54], [52, 47], [28, 34], [5, 23], [-20, 15],
    [-46, 14], [-73, 14], [-99, 15], [-123, 6], [-135, -16],
    [-130, -41], [-112, -58], [-87, -64], [-61, -64], [-34, -63],
    [-8, -62], [18, -63], [44, -67], [70, -72], [94, -81],
    [108, -104], [107, -129], [102, -155], [91, -179], [77, -201],
    [63, -223], [43, -241], [24, -258], [0, -269], [-21, -256],
    [-37, -235], [-47, -211], [-56, -186], [-63, -161], [-70, -135],
    [-75, -109], [-80, -84], [-81, -57], [-82, -31], [-81, -5],
    [-77, 21], [-72, 47], [-66, 73], [-59, 98], [-52, 124],
    [-45, 150], [-33, 173],
  ],

  // ---- THE MEDITERRANEAN FIVE. Five coasts, five layout IDEAS - a cliff
  // corniche with a village loop, an island round two bays, a seafront blast
  // into inland hairpins, a peninsula through a narrow neck, and a corniche
  // that crosses its own return leg twice so both crossings bridge.
  liguriaRun: [
    [-250, -140], [-140, -175], [-20, -190], [100, -178], [205, -150],
    [280, -100], [318, -30], [300, 45], [240, 92], [160, 108],
    [95, 152], [120, 215], [60, 258], [-30, 244], [-70, 186],
    [-140, 205], [-215, 190], [-268, 130], [-282, 45], [-320, -25],
    [-305, -95],
  ],
  aegeanRun: [
    [-220, -60], [-165, -140], [-70, -178], [30, -166], [95, -110],
    [120, -35], [185, 10], [270, 5], [318, 60], [295, 140],
    [210, 178], [110, 168], [40, 120], [-40, 118], [-95, 165],
    [-190, 172], [-262, 120], [-285, 35], [-258, -20],
  ],
  bravaRun: [
    [-330, 120], [-190, 128], [-40, 132], [110, 130], [250, 120],
    [330, 78], [345, 10], [292, -40], [210, -32], [175, -95],
    [225, -150], [180, -205], [90, -196], [55, -140], [-25, -128],
    [-70, -182], [-160, -190], [-205, -135], [-160, -78], [-235, -46],
    [-320, 20],
  ],
  dalmatiaRun: [
    [-300, -30], [-215, -95], [-120, -120], [-30, -108], [30, -60],
    [55, 15], [125, 55], [215, 48], [292, 82], [318, 155],
    [258, 210], [165, 205], [110, 155], [40, 168], [-30, 210],
    [-125, 215], [-205, 175], [-232, 100], [-190, 40], [-268, 30],
  ],
  azurRun: [
    [-290, 40], [-200, -30], [-90, -70], [30, -60], [120, -10],
    [150, 70], [95, 130], [0, 150], [-95, 130], [-150, 60],
    [-120, -20], [-30, -60], [70, -100], [175, -120], [270, -80],
    [315, 0], [290, 90], [200, 150], [80, 190], [-50, 200],
    [-175, 180], [-270, 130],
  ],
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
  snow: [ // lasso: the valley run, the summit loop, the return leg
    [0.0, 230.0], [-120.0, 225.0], [-200.0, 190.0], [-225.0, 120.0], [-215.0, 40.0],
    [-180.0, -30.0], [-120.0, -90.0], [0.0, -160.0], [120.0, -170.0], [180.0, -100.0],
    [140.0, -30.0], [40.0, -15.0], [-40.0, -55.0], [-61.9, -81.4], [-93.2, -64.3],
    [-95.1, -54.3], [-0.1, 30.7], [60.0, 100.0], [90.0, 170.0], [60.0, 220.0],
  ],
  // slot-canyon: medium-twisty with two long snaking sections east and south
  canyon: [ // square slot doglegs along three long shelves
    [-220.0, 170.0], [-40.0, 172.0], [140.0, 170.0], [215.0, 168.0], [218.0, 60.0],
    [30.0, 60.0], [-190.0, 60.0], [-211.1, 58.1], [-210.1, -49.8], [3.9, -49.9],
    [190.0, -50.0], [215.0, -52.0], [218.0, -160.0], [40.0, -160.0], [-190.0, -160.0],
    [-231.9, -110.1], [-242.9, -20.2], [-235.9, 79.9],
  ],
  // flowing lap with rhythmic S-curves along the lava fields
  volcano: [ // crater orbit: the ring bitten deep north and south
    [225.0, 0.0], [200.0, 100.0], [159.0, 159.0], [70.0, 100.0], [0.0, 120.0],
    [-70.0, 100.0], [-159.0, 159.0], [-200.0, 100.0], [-225.0, 0.0], [-200.0, -100.0],
    [-159.0, -159.0], [-70.0, -100.0], [0.0, -120.0], [70.0, -100.0], [159.0, -159.0],
    [200.0, -100.0],
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
  glacial: [ // pear-valley: narrow moraine neck into a wide cirque toe
    [-40.0, -220.0], [-55.0, -140.0], [-34.0, -40.0], [-48.0, 40.0], [-90.0, 130.0],
    [-95.0, 200.0], [-20.0, 238.0], [60.0, 225.0], [95.0, 160.0], [60.0, 105.0],
    [34.0, -40.0], [52.0, -110.0], [62.0, -170.0], [30.0, -222.0], [-10.0, -228.0],
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
  oasis: [ // trefoil: three palm lobes off a tight core
    [30.0, -20.0], [120.0, -90.0], [195.0, -55.0], [185.0, 35.0], [105.0, 55.0],
    [49.2, 43.8], [60.0, 120.0], [15.0, 200.0], [-70.0, 195.0], [-95.0, 110.0],
    [-35.0, 60.0], [-40.0, 10.0], [-120.0, 40.0], [-200.0, 0.0], [-185.0, -90.0],
    [-100.0, -110.0], [-45.0, -55.0],
  ],
  // REDWOOD RAMPAGE: broad rolling forest lap — fast crests between the giants
  redwood: [ // the Pine Mountain Rally stage, border road home
    [-210.5, -63.9], [-224.2, 16.0], [-226.4, 95.8], [-199.1, 178.0], [-127.2, 223.6],
    [-24.5, 235.0], [72.4, 212.2], [115.8, 166.6], [104.4, 109.5], [61.0, 82.1],
    [95.3, 47.9], [143.2, 52.5], [180.8, 95.8], [207.1, 59.3], [172.8, 25.1],
    [120.4, 18.3], [61.0, 27.4], [17.7, -6.8], [26.8, -50.2], [78.1, -66.2],
    [110.3, -89.1], [95.3, -123.2], [115.8, -157.4], [166.0, -152.9], [183.2, -120.7],
    [211.6, -130.0], [226.4, -175.7], [209.3, -214.5], [118.1, -230.4], [-30.2, -235.0],
    [-161.4, -221.3], [-215.0, -166.6],
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
  wildfire: [ // escape ladder: three tight esses, then the long flight south
    [-153.7, 168.6], [-40.0, 152.0], [150.0, 140.0], [200.0, 110.0], [160.0, 85.0],
    [-30.0, 72.0], [-160.0, 60.0], [-210.0, 28.0], [-170.0, -2.0], [0.0, -16.0],
    [140.0, -30.0], [190.0, -62.0], [150.0, -92.0], [-40.0, -108.0], [-180.0, -122.0],
    [-225.0, -165.0], [-140.0, -212.0], [80.0, -218.0], [180.0, -188.0], [222.0, -90.0],
    [232.0, 30.0], [226.0, 118.0], [178.0, 172.0], [20.0, 196.0], [-140.0, 192.0],
  ],
  // GLACIER'S GRIND: winding sheet-ice canyon, medium sweeps with two folds
  sheetice: [ // flat-out drift tri-oval
    [0.0, -225.0], [140.0, -180.0], [215.0, -90.0], [232.0, 30.0], [170.0, 160.0],
    [40.0, 210.0], [-100.0, 212.0], [-200.0, 140.0], [-232.0, 0.0], [-190.0, -130.0],
    [-90.0, -200.0],
  ],
  // AVALANCHE ALLEY: narrow pass — the climb winds up the east and north
  // sides, then the final third is one long sweeping western descent
  avalanche: [ // diagonal Z-ladder traverses down the slide path
    [-210.0, -190.0], [-20.0, -155.0], [160.0, -120.0], [205.0, -85.0], [150.0, -45.0],
    [-30.0, 4.0], [-177.5, 19.6], [-210.1, 59.1], [-157.5, 99.6], [10.0, 128.0],
    [170.0, 160.0], [210.0, 195.0], [140.0, 225.0], [-10.0, 220.0], [-120.0, 212.0],
    [-192.5, 170.4], [-232.9, 40.9], [-226.5, -99.6],
  ],
  // NEON GRID EXPRESSWAY: huge fast expressway sweeps, minimum corner count
  neon: [ // Manhattan loop: right angles only
    [-200.0, 220.0], [80.0, 220.0], [80.0, 140.0], [200.0, 140.0], [200.0, -40.0],
    [60.0, -40.0], [60.0, -120.0], [180.0, -120.0], [180.0, -220.0], [-60.0, -220.0],
    [-60.0, -140.0], [-160.0, -140.0], [-160.0, -40.0], [-220.0, -40.0], [-220.0, 60.0],
    [-100.0, 60.0], [-100.0, 140.0], [-200.0, 140.0],
  ],
  // UNDERCITY SLIPSTREAM: cramped service-tunnel twists — hairpin folds and
  // short bursts, nothing opens up for long
  undercity: [ // sewer mains: a rectangle with two deep service notches
    [-225.0, 130.0], [-40.0, 131.0], [-40.0, 22.7], [40.0, 22.6], [40.0, 130.8],
    [225.0, 130.0], [225.0, -130.0], [60.0, -130.8], [60.0, -22.6], [-60.0, -22.7],
    [-60.0, -131.0], [-225.0, -130.0],
  ],
  // GOTTHARD CLIMB: alpine village in the valley, a run along the mountain
  // base, then NINE stacked switchback legs (29u apart) hairpinning up the
  // granite face to a summit shelf, and three wide sweeps down the east side
  // back to the valley. Elevation: THEMES.pass.elev climbs ~45u through it.
  pass: [ // the player's green hand-drawn loop: coil summit, three finger valleys
    [70.9, -235.0], [91.0, -230.4], [110.4, -215.8], [128.3, -198.7], [142.2, -179.4],
    [148.9, -156.8], [150.3, -131.9], [150.2, -106.6], [148.7, -82.0], [144.4, -58.4],
    [138.0, -35.6], [131.8, -12.7], [127.1, 10.8], [124.9, 35.3], [125.4, 60.1],
    [127.9, 84.5], [131.9, 108.3], [137.1, 131.6], [142.3, 155.0], [145.4, 178.9],
    [142.1, 201.9], [128.9, 220.0], [108.5, 230.9], [85.2, 235.0], [62.3, 231.0],
    [47.0, 217.0], [48.4, 200.1], [65.1, 188.2], [80.2, 176.9], [77.3, 166.5],
    [57.6, 162.4], [38.1, 157.5], [36.2, 147.6], [52.0, 137.4], [56.2, 128.8],
    [53.2, 120.7], [45.3, 112.3], [44.9, 104.2], [53.8, 97.3], [73.0, 90.1],
    [76.7, 75.0], [62.7, 62.8], [40.3, 61.8], [17.9, 68.9], [-2.8, 80.3],
    [-22.9, 93.3], [-44.0, 104.1], [-66.9, 108.5], [-90.3, 105.9], [-112.6, 98.1],
    [-131.9, 85.2], [-145.0, 66.4], [-150.3, 43.3], [-149.6, 19.0], [-145.7, -4.8],
    [-139.9, -27.9], [-130.4, -49.4], [-115.0, -66.3], [-94.0, -74.9], [-71.2, -72.9],
    [-51.8, -61.0], [-36.1, -43.2], [-19.3, -26.6], [1.5, -16.4], [25.3, -12.8],
    [49.8, -13.9], [72.5, -20.6], [91.7, -33.9], [106.1, -52.6], [114.5, -74.6],
    [117.5, -98.7], [115.6, -122.9], [106.6, -144.3], [90.3, -158.9], [73.1, -159.3],
    [64.0, -143.3], [61.9, -119.7], [57.0, -96.8], [43.7, -78.6], [23.7, -69.9],
    [0.6, -70.7], [-21.3, -78.5], [-34.9, -94.0], [-34.3, -114.8], [-21.4, -131.7],
    [-3.3, -136.4], [7.8, -127.5], [13.2, -119.1], [20.0, -116.3], [27.7, -121.3],
    [22.2, -141.2], [4.2, -153.6], [-18.9, -159.0], [-35.3, -169.4], [-35.3, -187.8],
    [-20.7, -203.5], [1.1, -208.9], [23.5, -206.7], [40.8, -209.3], [54.2, -223.6],
  ],
  // TREMOLA DESCENT: the mirror. The line sits on the summit plateau; the lap
  // drops straight into NINE tighter cobbled hairpins (28u apart) down the
  // face, runs out along the gorge floor, then climbs the long modern road up
  // the east flank back to the plateau.
  tremola: [ // the player's red hand-drawn loop, knots crossed straight through
    [-0.1, -63.6], [2.0, -73.7], [20.4, -82.3], [40.3, -82.7], [59.2, -74.8],
    [77.7, -65.8], [93.2, -67.0], [99.7, -82.2], [97.8, -103.2], [90.4, -122.8],
    [77.4, -138.2], [59.1, -145.2], [39.1, -144.0], [21.8, -144.8], [11.4, -156.6],
    [11.6, -174.6], [15.8, -193.1], [11.8, -211.4], [-1.9, -227.0], [-19.8, -235.0],
    [-37.8, -230.9], [-48.7, -216.6], [-45.6, -199.2], [-33.4, -182.7], [-24.4, -166.0],
    [-27.5, -154.1], [-44.0, -151.8], [-65.5, -151.6], [-84.0, -144.4], [-96.5, -129.1],
    [-103.5, -109.3], [-102.5, -89.6], [-90.1, -75.3], [-73.2, -72.2], [-65.2, -81.3],
    [-65.5, -96.4], [-57.9, -107.5], [-41.9, -106.1], [-31.0, -91.8], [-30.5, -71.8],
    [-37.9, -52.4], [-50.6, -37.0], [-68.6, -27.9], [-88.4, -21.2], [-102.9, -9.3],
    [-104.5, 7.4], [-92.7, 23.2], [-74.3, 32.8], [-53.6, 33.6], [-35.4, 25.7],
    [-21.4, 11.7], [-6.5, 1.1], [9.6, 4.0], [20.1, 19.6], [21.3, 39.2],
    [12.2, 56.6], [-4.4, 68.9], [-23.5, 77.3], [-42.3, 86.7], [-56.2, 100.3],
    [-59.9, 117.7], [-56.5, 137.1], [-50.9, 156.9], [-40.7, 175.0], [-27.2, 191.9],
    [-12.7, 206.6], [0.6, 210.3], [8.2, 197.2], [9.4, 176.2], [6.2, 155.3],
    [5.2, 137.8], [15.1, 129.4], [31.5, 134.4], [43.4, 149.9], [48.1, 170.5],
    [48.8, 192.6], [50.3, 214.5], [58.6, 231.1], [74.7, 235.0], [90.4, 225.4],
    [99.8, 207.8], [104.2, 187.0], [104.5, 165.2], [100.7, 144.1], [93.2, 124.6],
    [81.0, 108.6], [63.9, 98.0], [49.6, 86.2], [46.3, 68.1], [54.6, 53.7],
    [70.8, 49.6], [77.1, 43.2], [76.7, 32.7], [74.7, 14.7], [79.2, -4.6],
    [77.3, -22.9], [63.7, -35.8], [45.0, -43.1], [26.4, -49.3], [6.9, -55.1],
  ],
  // FURKA RIDGE: a deep-winter pass. The valley floor is under snow; the dirt
  // road climbs a jagged grey-rock face in ONE long serpentine of seven legs,
  // so from the upper legs the whole pass is visible snaking down the valley
  // below you. A traverse along the top, then wide sweeps back down.
  furka: [ // the player's downhill-run sketch: one-lap stage, border road home
    [143.4, -235.0], [127.2, -231.4], [112.7, -227.3], [103.6, -218.7], [100.1, -204.0],
    [95.4, -191.0], [83.5, -187.5], [72.4, -188.3], [68.5, -186.0], [66.9, -182.5],
    [67.0, -178.3], [69.4, -172.9], [69.3, -166.5], [65.7, -161.2], [63.9, -159.0],
    [62.8, -156.5], [62.5, -153.6], [63.1, -150.3], [63.9, -146.4], [63.3, -143.1],
    [61.5, -140.3], [58.1, -138.4], [50.2, -139.0], [34.9, -143.1], [25.2, -153.0],
    [18.5, -166.1], [6.5, -172.4], [-6.9, -168.9], [-11.4, -157.7], [-3.9, -147.4],
    [8.9, -138.5], [21.5, -127.5], [36.6, -120.9], [51.6, -116.9], [60.5, -107.4],
    [60.8, -93.4], [52.9, -79.9], [41.0, -68.0], [28.6, -56.4], [14.8, -49.4],
    [-1.6, -48.2], [-18.0, -49.9], [-33.1, -54.1], [-47.1, -53.3], [-57.1, -42.6],
    [-62.4, -27.1], [-64.1, -10.4], [-61.4, 5.7], [-52.6, 18.0], [-38.6, 25.0],
    [-22.5, 27.4], [-6.6, 24.6], [6.0, 15.8], [7.1, 5.6], [-0.7, -1.5],
    [-14.7, -6.4], [-18.5, -15.9], [-13.4, -24.9], [1.4, -28.0], [17.5, -26.8],
    [29.3, -18.6], [34.5, -3.6], [34.9, 13.5], [32.8, 30.2], [26.8, 44.9],
    [15.3, 55.6], [0.2, 60.9], [-16.5, 61.5], [-33.5, 60.2], [-50.3, 58.2],
    [-66.8, 56.3], [-82.2, 58.9], [-93.5, 68.9], [-101.3, 83.0], [-109.7, 96.3],
    [-110.0, 105.0], [-104.1, 111.6], [-88.7, 116.0], [-85.8, 122.9], [-87.8, 129.6],
    [-90.1, 134.3], [-90.7, 139.1], [-89.1, 144.3], [-88.6, 151.1], [-91.6, 157.1],
    [-99.9, 161.2], [-103.1, 165.3], [-103.2, 169.7], [-100.5, 174.3], [-87.1, 181.6],
    [-81.8, 193.1], [-88.4, 203.0], [-102.3, 209.3], [-117.1, 216.1], [-130.8, 224.9],
    [-143.4, 235.0], [-173.4, 265.0], [-173.4, -265.0], [173.4, -265.0],
  ],

  // ======================================================================
  // REAL-RALLY ROUTES. These are SHAPES only — each names an existing theme
  // for its look and a `tune` for its character (see LEVELS). Splitting route
  // from theme is what makes a new circuit cheap: Monte Carlo and Sweden are
  // both snow-and-mountain and drive nothing alike.
  // ======================================================================

  // COL DE TURINI — the Monte Carlo classic. A valley approach, then a dense
  // stack of SHORT hairpin legs up the face (short legs = the corners come at
  // you relentlessly, which is the whole character of Turini), a narrow col
  // traverse, and a long fast plunge down the far side.
  // `dir: -1` is load-bearing, not decoration. The stack's first leg has to
  // START on the side the approach ARRIVES from, and its last leg has to hand
  // over to the descent on the side that leg ENDS. Get it wrong and the spline
  // whips right across the map between two adjacent control points: measured,
  // the first cut of this route bottomed out at a ONE-UNIT corner radius, where
  // the tightest hairpin anywhere else on the roster is four.
  turini: [
    [0, -238], [78, -246], [148, -224], [196, -186], [216, -150],
    // 9 legs, entering eastward-facing (dir -1 starts on the RIGHT), so it
    // exits on the left at z = -132 + 8*27 = 84
    ...switchbackStack({ legs: 9, z0: -132, dz: 27, halfX: 36, hp: 16, dir: -1,
      jag: [0, 5, -4, 3, -6, 4, -3, 6, -5] }),
    // the col: a short shelf at the top before it tips over, picked up on the
    // LEFT where leg 9 left off
    [-90, 96], [-150, 112],
    // the plunge — long, fast, opening radii all the way to the valley
    [-212, 140], [-252, 80], [-244, 6], [-252, -70],
    [-212, -146], [-146, -198], [-72, -230],
  ],

  // OUNINPOHJA — the fastest stage in the sport. Almost no slow corners: very
  // long straights joined by fourth-gear kinks, and the drama is entirely in
  // the CRESTS (see the tune: high ramp count, tall elevation amplitude).
  // A LONG NARROW OVAL, and deliberately not another rounded blob. Finland's
  // signature is the fourth-gear straight, so the silhouette is 500 u long and
  // 145 u wide: two enormous straights joined by two fast bends, and the
  // SHORTEST lap on the roster because the shape encloses so little.
  ouninpohja: [
    [-244, -16], [-186, -58], [-108, -70], [-26, -74], [56, -72],
    [136, -66], [206, -52], [246, -18],
    [250, 20], [212, 56], [140, 70], [58, 76], [-24, 74],
    [-106, 68], [-184, 56], [-238, 22],
  ],

  // FAFE — Portugal. A tight, technical village loop that exists to set up ONE
  // enormous jump: the run-in straightens and drops away over the crest.
  fafe: [ // kite: two flat-out legs to the jump vertex, wide loop home
    [-225.0, 190.0], [-60.0, 130.0], [90.0, 75.0], [200.0, 35.0], [232.0, -20.0],
    [195.0, -60.0], [80.0, -95.0], [-60.0, -145.0], [-170.0, -195.0], [-225.0, -160.0],
    [-235.0, -60.0], [-232.0, 60.0],
  ],

  // PIKES PEAK — one sustained climb, nothing else. A long approach across the
  // apron, then eleven legs up the mountain with no respite, finishing on the
  // summit shelf. The tune gives it the tallest elevation range on the roster.
  pikes: [
    [-30, -246], [50, -252], [130, -238], [196, -206], [230, -168],
    // 11 legs from the RIGHT (see the note on turini), exiting left at
    // z = -150 + 10*27 = 120
    ...switchbackStack({ legs: 11, z0: -150, dz: 27, halfX: 37, hp: 16, dir: -1,
      jag: [0, 6, -5, 4, -7, 5, -4, 7, -6, 3, -2] }),
    // summit shelf, then the long run back down the shoulder to the apron
    [-96, 134], [-166, 150],
    [-228, 176], [-252, 108], [-240, 30], [-252, -50],
    [-222, -130], [-164, -190], [-88, -228],
  ],

  // SAFARI — Kenya. Enormous, open, fast. The slowest corner here is faster
  // than the fastest corner on Turini; the challenge is commitment, not
  // precision. Big radii, long sight lines.
  // A ROUNDED TRIANGLE — three enormous straight-ish edges meeting at three
  // wide corners. Nothing else on the roster has three-fold symmetry, and
  // running the edges out to the rim makes this the LONGEST flat lap: the
  // opposite extreme from OUNINPOHJA's narrow oval, from the same envelope.
  safari: [ // the C: a plains sweep wrapped around one deep waterhole bay
    [60.0, -225.0], [180.0, -175.0], [230.0, -60.0], [225.0, 70.0], [160.0, 175.0],
    [30.0, 225.0], [-110.0, 215.0], [-205.0, 140.0], [-230.0, 20.0], [-190.0, -95.0],
    [-90.0, -105.0], [-20.0, -45.0], [60.0, -20.0], [120.0, -60.0], [95.0, -140.0],
    [16.2, -180.8],
  ],

  // CORNICHE — Corsica, the "rally of ten thousand corners". A cliff road that
  // never has a straight: every corner runs into the next one. Paired with the
  // canyon look, so the rock is right there on both sides.
  corniche: [ // the Coastal Cliffs Run: lighthouse headland to the switchback point
    [-235.0, -147.8], [-146.6, -173.1], [-64.4, -192.0], [11.4, -183.2], [80.9, -213.5],
    [169.3, -226.2], [235.0, -173.1], [209.7, -112.4], [141.5, -97.3], [80.9, -120.0],
    [36.6, -106.1], [2.5, -82.1], [30.3, -50.5], [65.7, -31.6], [53.1, 11.4],
    [2.5, 25.3], [-39.2, 44.2], [-17.7, 82.1], [32.8, 94.8], [70.8, 127.6],
    [93.5, 165.5], [65.7, 208.5], [15.2, 226.2], [-48.0, 213.5], [-91.0, 168.0],
    [-83.4, 117.5], [-59.1, 94.1], [-73.3, 69.5], [-118.8, 77.1], [-149.1, 36.6],
    [-174.4, -16.4], [-199.6, -67.0], [-224.9, -109.9],
  ],

  // ESTONIA — flat-out gravel over a river gorge. Fast open sweeps, big
  // crests, and the tune hangs a hero bridge across the deepest cut, so the
  // lap has one moment where the road is a span with nothing under it.
  estonia: [ // interleaved sinusoid: yumps out, yumps home
    [-230.0, 60.0], [-160.0, 95.0], [-90.0, 25.0], [-20.0, 95.0], [50.0, 25.0],
    [120.0, 95.0], [190.0, 25.0], [228.0, -12.0], [212.0, -58.0], [150.0, -95.0],
    [80.0, -25.0], [10.0, -95.0], [-60.0, -25.0], [-130.0, -95.0], [-205.0, -28.0],
    [-236.0, 12.0],
  ],

  // OLIVE COAST — Sanremo/Corsica tarmac. The fast region on the roster after
  // the sand worlds: median corner radius 152 u and 57 % of the lap above
  // 120 u, so it flows in fourth and fifth. Its shape is a seafront straight,
  // a long climb inland through the terraces, a walled village on the ridge
  // shoulder, and ONE tight linked pair down the dry ravine on the west flank
  // (min radius 20 u) — the single place the stage bites, which is exactly the
  // Bible's 10 % G1 corner budget. Nothing here is a hairpin stack: the threat
  // is the stone at the edge of a road you are carrying speed on.
  medterrace: [
    // seafront: the start line and the fastest run on the lap
    [0, -242], [92, -244], [176, -222], [240, -180],
    // off the coast road and up into the first terraces
    [254, -110], [222, -48],
    // fourth-gear sweeps across the olive benches
    [246, 22], [214, 92],
    // the walled village: right-left through the hamlet
    [232, 156], [172, 200], [98, 208],
    // open ridge-shoulder run west, cypresses on the driveways
    [22, 182], [-56, 196], [-136, 216], [-200, 178],
    // the dry ravine — the one genuinely tight sequence
    [-218, 112], [-172, 62], [-226, 6],
    // fast descent back down to the sea
    [-250, -70], [-212, -146], [-146, -202], [-70, -234],
  ],

  // LANTERN QUARTER — a STREET GRID, not a landscape. Every other circuit on
  // the roster is a road following terrain, so its corners are radii; this one
  // is a town, so its corners are BLOCKS. The shape is a rectilinear loop of
  // straight streets meeting at near-right angles, with two doglegs where the
  // route jinks around a block instead of going through it. The corner triplets
  // are deliberately tight (~24 u between the three points that turn a corner)
  // — that is what holds the average speed down to the region's 82 km/h without
  // a single hairpin, which would read as a mountain road.
  // Parallel legs are never closer than 46 u, well clear of the 22 u
  // self-approach floor that a hand-authored rectilinear route usually trips.
  oldtown: [
    // MAIN STREET: the cobbled run through the lower town, eastbound — and it
    // does NOT run straight through. A single 370 u street would have made
    // this the fastest world on the roster instead of the slowest, so the
    // route detours a block north around the market square and comes back.
    [-150, -214], [-84, -216], [-40, -214],
    [-14, -200], [-8, -176], [22, -168], [54, -174], [62, -198],
    [96, -212], [150, -212],
    // right-angle left onto the east avenue, and the climb starts
    [196, -208], [218, -188], [218, -150],
    // dogleg: the avenue jinks west around the market block and back
    [216, -112], [204, -84], [176, -70], [166, -40],
    [170, -8], [196, 8], [216, 34],
    // left into the cathedral square at the top of the hill
    [214, 70], [192, 94], [156, 100],
    // the square itself — the one place the frontage opens out
    [96, 104], [30, 100], [-26, 104],
    // step north into the lantern quarter proper
    [-62, 112], [-82, 138], [-84, 168],
    // left, west along the rampart street
    [-100, 192], [-140, 198], [-186, 194],
    // left, south down the west wall street. This is deliberately the LONGEST
    // straight on the lap: the arched gateways need a run of 50+ samples under
    // 0.016 curvature to place, and a street grid this broken up only offers
    // two such windows — this one and the cathedral square.
    [-222, 184], [-238, 156], [-236, 110], [-234, 62], [-232, 16],
    // the stepped square: the street kinks around a block and back
    [-214, -12], [-190, -34], [-192, -70], [-214, -92], [-236, -116], [-238, -152],
    // last corner, back east onto the main street
    [-224, -186], [-198, -208],
  ],

  // HEDGEROW DASH — farmland lanes. The road does not choose its own line here:
  // it runs where the field boundaries put it, so the lap is a chain of short
  // headland straights meeting at bends the hedge hides until you are in them.
  // Nothing on the roster is shaped this way — the alpine worlds stack legs up
  // a face, the rally routes flow. This one turns because the field turns.
  // Measured (900 samples): 1851 u lap, tightest radius 17 u, 3.9 % of the lap
  // under 25 u, self-approach 50.9 u — well clear of the 22 u ribbon width.
  farmland: [ // hedgerow polygon: straight field boundaries, odd angles
    [-215.0, 175.0], [30.0, 190.0], [95.0, 120.0], [225.0, 95.0], [215.0, -30.0],
    [120.0, -55.0], [130.0, -140.0], [10.0, -195.0], [-140.0, -180.0], [-120.0, -80.0],
    [-185.0, -40.0], [-230.0, 40.0], [-125.8, 69.5], [-165.0, 120.0],
  ],

  // RED CENTRE RUN — the fastest lap on the roster, and the shape is dictated
  // by the region's negative list: NO tight corners in sequence. There is not
  // one hairpin on it. Every direction change is spread over four control
  // points so it comes out as a 90–150 u sweeper you take flat, joined by the
  // long Finke blast down the south side and the boundary-fence run up the
  // west. Measured against the spline the game actually builds:
  //
  //    min radius 92 u   (next-largest on the roster is NEON GRID at 57;
  //                       DUST CANYON bottoms out at 19)
  //    5th pct    110 u  nothing at all under 60 u
  //    91 % of the lap above a 120 u radius, median radius 282 u
  //
  // The first cut of this route put a 34 u corner ACROSS THE START LINE, which
  // is the one place on a 350 m-sight-line world you must not put a corner —
  // so sample 0 is now mid-straight, and it stays that way if you edit this:
  // the array's first control point is where t = 0 lands.
  outback: [ // the player's double-bridge sketch: two flyovers, up and over
    [-60.5, 13.3], [-69.9, -1.9], [-81.7, -16.0], [-90.4, -31.3], [-93.2, -48.6],
    [-89.5, -65.3], [-79.0, -78.7], [-64.2, -87.8], [-47.8, -94.0], [-30.5, -97.9],
    [-12.5, -98.3], [4.8, -94.3], [19.0, -85.6], [27.0, -71.5], [27.3, -54.5],
    [21.1, -38.1], [11.0, -23.6], [-1.8, -11.0], [-16.3, -0.8], [-32.2, 6.6],
    [-49.1, 11.5], [-66.4, 15.4], [-84.0, 18.7], [-101.8, 19.5], [-119.2, 16.4],
    [-135.6, 10.3], [-149.5, 0.9], [-158.2, -13.3], [-161.3, -30.8], [-159.9, -48.7],
    [-154.6, -65.5], [-147.7, -81.5], [-142.1, -98.2], [-138.6, -115.7], [-134.0, -132.7],
    [-125.5, -148.1], [-115.4, -162.9], [-104.7, -177.4], [-93.0, -191.3], [-79.9, -204.3],
    [-65.9, -215.8], [-50.7, -225.0], [-34.9, -232.5], [-18.5, -238.8], [-1.4, -243.2],
    [16.4, -245.0], [34.7, -244.7], [53.5, -244.2], [72.2, -243.6], [90.1, -241.2],
    [106.4, -235.2], [120.1, -224.1], [130.5, -210.3], [131.5, -198.8], [119.8, -192.2],
    [102.9, -187.3], [86.5, -181.1], [70.6, -173.8], [55.7, -164.6], [44.1, -151.9],
    [38.4, -135.5], [38.7, -117.7], [44.9, -101.3], [56.5, -87.7], [70.6, -76.4],
    [85.2, -65.9], [99.0, -53.8], [111.8, -40.4], [123.2, -26.2], [132.8, -11.4],
    [143.2, 2.6], [154.7, 16.1], [161.3, 31.2], [159.9, 47.8], [154.2, 64.3],
    [146.2, 79.9], [134.8, 93.0], [119.9, 99.6], [104.0, 96.4], [90.5, 85.1],
    [85.0, 71.1], [91.6, 58.3], [102.9, 45.4], [106.9, 30.8], [99.2, 18.5],
    [83.5, 12.7], [65.8, 13.5], [51.1, 21.1], [41.2, 34.7], [33.7, 50.6],
    [27.9, 67.1], [25.6, 84.6], [29.4, 101.4], [39.9, 115.6], [53.9, 126.9],
    [69.3, 135.5], [85.1, 143.1], [98.6, 153.2], [106.2, 168.0], [108.0, 185.9],
    [104.6, 203.3], [94.5, 217.5], [79.9, 227.8], [63.8, 234.5], [46.7, 238.9],
    [28.8, 241.5], [10.2, 242.4], [-7.8, 241.1], [-21.3, 233.6], [-29.2, 231.4],
    [-62.8, 245.0], [-109.1, 236.5], [-135.9, 197.5], [-138.3, 147.5], [-120.0, 104.9],
    [-79.8, 81.7], [-37.2, 84.2], [-12.8, 117.1], [-11.6, 165.8], [-19.2, 189.7],
    [-24.6, 193.1], [-29.4, 191.3], [-33.2, 180.9], [-36.0, 162.1], [-38.8, 143.4],
    [-41.6, 124.7], [-44.5, 105.9], [-47.3, 87.2], [-50.1, 68.5], [-52.9, 49.7],
    [-55.7, 31.0],
  ],

  // ------------------------------------------------------------------------
  // GRAND CIRCUITS — twelve real-world layouts, requested as a reference
  // sheet of "12 distinct race track designs". Each is a hand-traced
  // silhouette of the real circuit at the game's ±250 u scale, riding an
  // EXISTING theme (the WORLD RALLY pattern: a route is geometry, a theme is
  // art), so twelve tracks cost zero new art systems. Corner radii are kept
  // above the game's floors except where the real corner IS the point (the
  // Loews hairpin, the Corkscrew); parallel legs never run closer than 26 u.
  rbring: [ // Red Bull Ring — three big straights, hilltop rights, flowing left sweeps home
    [121.6, 99.3], [142.1, 93.3], [162.6, 87.5], [183.4, 81.4], [203.7, 74.3],
    [222.5, 64.4], [234.4, 49.3], [235.0, 29.8], [228.3, 9.6], [217.2, -8.0],
    [200.2, -18.5], [178.7, -21.4], [155.8, -21.2], [132.8, -20.5], [109.9, -19.7],
    [86.8, -19.3], [63.8, -18.6], [41.2, -17.1], [19.7, -12.9], [0.5, -3.2],
    [-16.2, 11.4], [-33.4, 25.0], [-52.7, 29.3], [-70.7, 21.0], [-84.3, 4.8],
    [-95.3, -13.9], [-101.6, -33.6], [-97.3, -52.2], [-82.0, -64.4], [-61.3, -67.9],
    [-39.3, -66.3], [-17.1, -63.8], [5.1, -63.7], [26.1, -68.8], [44.1, -80.1],
    [56.0, -96.8], [55.1, -112.5], [39.2, -120.2], [16.6, -121.8], [-6.1, -123.1],
    [-28.4, -125.5], [-50.5, -128.2], [-72.8, -130.6], [-94.8, -133.5], [-116.8, -136.7],
    [-139.0, -139.1], [-161.6, -140.4], [-184.3, -140.0], [-206.7, -137.8], [-226.5, -132.6],
    [-235.0, -122.1], [-226.5, -107.4], [-210.0, -91.9], [-193.6, -76.5], [-178.0, -60.2],
    [-164.8, -42.6], [-154.2, -23.7], [-144.5, -4.5], [-134.2, 14.5], [-123.1, 33.1],
    [-111.1, 51.4], [-98.6, 69.5], [-85.8, 87.5], [-72.8, 105.3], [-59.4, 123.1],
    [-43.6, 136.7], [-24.2, 140.4], [-3.4, 136.3], [17.3, 130.0], [37.9, 123.7],
    [58.6, 117.4], [79.3, 111.4], [100.4, 105.4],
  ],
  monaco: [ // Monaco — Ste Devote, the climb to Casino, Loews, the tunnel sweep, Rascasse
    [188.3, -138.2], [199.6, -130.1], [208.6, -120.3], [223.2, -116.1], [235.0, -108.0],
    [233.1, -92.5], [223.2, -75.3], [211.9, -58.5], [199.4, -42.4], [184.4, -28.3],
    [167.3, -17.5], [148.8, -10.5], [128.9, -6.6], [108.1, -4.9], [87.0, -5.0],
    [66.4, -7.0], [46.2, -10.3], [26.5, -14.6], [7.2, -18.1], [-11.6, -19.4],
    [-29.5, -22.5], [-47.4, -29.3], [-66.1, -36.0], [-85.1, -41.9], [-103.9, -48.1],
    [-122.6, -53.1], [-140.5, -51.5], [-156.0, -40.4], [-167.5, -24.0], [-172.6, -5.7],
    [-174.2, 13.4], [-178.5, 32.3], [-187.6, 49.0], [-198.3, 63.9], [-203.3, 81.5],
    [-200.5, 100.9], [-193.6, 119.1], [-193.8, 132.0], [-202.9, 138.2], [-220.2, 133.2],
    [-231.9, 121.0], [-235.0, 103.1], [-233.9, 83.0], [-230.5, 63.3], [-225.1, 44.0],
    [-218.8, 25.1], [-211.7, 6.6], [-203.6, -11.5], [-194.5, -29.3], [-183.6, -46.2],
    [-170.6, -62.3], [-155.4, -74.1], [-137.7, -76.8], [-118.6, -73.2], [-99.3, -67.8],
    [-79.9, -62.5], [-60.3, -57.8], [-40.9, -52.6], [-21.3, -48.2], [-0.5, -46.4],
    [20.3, -44.8], [40.2, -40.8], [59.6, -36.0], [79.5, -34.0], [97.8, -39.0],
    [109.3, -52.8], [111.5, -71.6], [111.9, -90.4], [120.3, -105.9], [136.1, -117.2],
    [153.8, -126.4], [171.6, -135.1],
  ],
  silverstone: [ // Silverstone — Copse, the Maggotts/Becketts esses, Stowe, Club
    [124.1, -123.1], [142.4, -123.6], [161.3, -117.9], [178.9, -109.2], [194.1, -96.5],
    [205.0, -80.3], [212.3, -62.1], [218.4, -43.3], [224.3, -24.5], [230.1, -5.7],
    [235.0, 13.3], [234.4, 31.8], [224.5, 47.2], [208.5, 58.3], [190.7, 66.6],
    [172.1, 72.8], [153.0, 78.0], [133.9, 83.2], [114.9, 88.8], [97.0, 96.4],
    [79.5, 103.9], [60.5, 107.0], [41.4, 110.3], [23.7, 118.5], [6.0, 123.6],
    [-11.5, 118.4], [-27.6, 106.7], [-44.4, 96.3], [-62.8, 89.3], [-81.7, 83.6],
    [-100.5, 77.9], [-119.4, 72.3], [-138.4, 66.7], [-157.3, 61.2], [-176.3, 55.7],
    [-195.2, 50.1], [-213.8, 43.6], [-229.3, 33.4], [-235.0, 18.0], [-227.6, 1.9],
    [-213.6, -12.8], [-199.9, -28.0], [-188.1, -44.3], [-180.1, -61.3], [-178.9, -78.3],
    [-178.0, -94.5], [-167.9, -108.0], [-150.6, -114.4], [-131.9, -112.1], [-113.7, -104.7],
    [-96.0, -96.1], [-78.3, -87.5], [-60.6, -79.1], [-43.0, -70.4], [-27.4, -59.1],
    [-17.4, -43.0], [-12.3, -23.9], [-6.1, -5.2], [5.6, 10.4], [20.6, 23.5],
    [30.2, 37.3], [25.9, 51.4], [22.1, 61.8], [24.8, 69.6], [37.2, 72.3],
    [55.8, 66.4], [71.3, 55.3], [83.0, 39.6], [93.0, 22.5], [103.2, 5.5],
    [113.4, -11.5], [123.6, -28.5], [133.8, -45.5], [142.1, -63.3], [142.6, -80.1],
    [131.1, -90.7], [116.5, -99.1], [113.1, -112.4],
  ],
  spa: [ // Spa — La Source, the Eau Rouge climb, Kemmel, and a long flowing east side
    [-155.4, -5.4], [-169.5, 10.0], [-184.8, 24.5], [-199.6, 39.1], [-212.6, 54.5],
    [-223.1, 71.2], [-231.9, 88.8], [-233.3, 101.2], [-226.6, 106.0], [-210.8, 99.0],
    [-193.9, 88.5], [-177.0, 77.9], [-160.1, 67.4], [-143.0, 57.7], [-126.2, 53.4],
    [-109.6, 55.0], [-91.2, 54.2], [-71.7, 50.0], [-52.8, 44.5], [-34.8, 36.7],
    [-17.1, 28.1], [1.4, 22.6], [20.6, 23.0], [39.6, 27.9], [57.9, 35.0],
    [75.1, 44.6], [89.8, 58.0], [101.7, 74.0], [112.7, 90.7], [125.3, 106.3],
    [140.7, 119.3], [157.8, 129.1], [176.0, 136.5], [194.6, 139.1], [211.5, 132.6],
    [223.4, 118.1], [225.1, 101.4], [214.4, 87.8], [197.8, 77.2], [185.0, 64.8],
    [180.6, 47.6], [176.1, 30.5], [162.9, 19.1], [144.4, 12.4], [125.4, 7.0],
    [106.8, 0.5], [90.6, -9.8], [80.4, -25.4], [79.8, -43.6], [89.8, -58.3],
    [106.6, -66.9], [125.6, -72.5], [144.5, -78.0], [163.2, -84.3], [181.7, -89.9],
    [199.4, -88.8], [215.7, -80.3], [228.6, -80.0], [235.0, -89.0], [227.2, -105.1],
    [213.7, -120.8], [198.5, -133.4], [181.2, -137.7], [162.8, -137.2], [144.3, -139.1],
    [125.6, -139.0], [107.1, -133.6], [88.7, -126.5], [70.4, -119.4], [52.0, -112.6],
    [33.5, -105.9], [15.1, -99.1], [-3.3, -92.1], [-21.7, -85.4], [-39.9, -78.0],
    [-57.3, -68.6], [-73.8, -57.3], [-90.3, -45.7], [-107.3, -35.4], [-125.2, -28.0],
    [-141.6, -19.3],
  ],
  suzuka: [ // the TRUE figure-8 at last - the crossover rides an overpass
    [-50.7, -4.6], [-34.0, -3.6], [-17.1, -13.2], [-3.6, -28.4], [9.7, -44.6],
    [25.2, -58.3], [42.7, -67.9], [60.7, -75.7], [78.6, -82.6], [97.4, -82.7],
    [115.5, -74.5], [131.6, -61.7], [147.0, -47.0], [162.4, -32.3], [177.8, -17.6],
    [193.1, -2.7], [208.4, 12.1], [223.8, 26.9], [238.5, 42.1], [249.2, 58.9],
    [250.0, 76.4], [239.4, 86.8], [223.8, 82.9], [208.7, 69.8], [192.4, 58.3],
    [174.6, 50.5], [160.1, 39.4], [148.0, 25.3], [132.1, 15.8], [114.5, 8.4],
    [103.8, -5.0], [99.5, -23.5], [91.0, -39.1], [74.4, -47.0], [55.5, -46.4],
    [38.7, -38.4], [24.5, -24.9], [12.0, -9.0], [-1.7, 4.9], [-18.9, 14.0],
    [-36.9, 15.7], [-52.7, 8.9], [-61.2, -17.7], [-67.0, -36.6], [-70.2, -56.1],
    [-76.1, -61.9], [-84.0, -61.8], [-97.8, -47.7], [-114.3, -38.2], [-133.6, -36.3],
    [-153.3, -38.4], [-172.0, -43.1], [-187.8, -53.5], [-200.6, -68.8], [-214.3, -82.6],
    [-231.2, -86.8], [-246.2, -78.4], [-250.0, -63.4], [-239.7, -50.0], [-222.5, -40.4],
    [-204.4, -32.1], [-186.4, -23.3], [-167.4, -16.1], [-147.2, -13.1], [-126.8, -11.6],
    [-106.8, -8.7], [-86.8, -5.1], [-68.3, 0.1],
  ],
  nordschleife: [ // Nordschleife — a sprawling Eifel perimeter with the Karussell fold
    [151.0, -122.0], [168.8, -127.0], [186.9, -139.4], [207.2, -141.0], [225.3, -127.6],
    [235.0, -106.6], [233.7, -87.8], [221.4, -71.8], [206.9, -52.8], [191.7, -32.6],
    [172.5, -15.5], [149.9, -5.5], [127.5, 0.8], [118.3, 12.4], [120.6, 29.0],
    [112.7, 45.5], [92.2, 59.2], [69.7, 71.1], [47.2, 83.2], [24.9, 95.5],
    [2.8, 108.3], [-18.5, 122.7], [-37.5, 140.6], [-55.6, 159.0], [-75.4, 169.5],
    [-97.3, 171.4], [-121.0, 171.4], [-144.9, 166.4], [-166.6, 152.4], [-186.6, 135.0],
    [-203.5, 115.9], [-212.0, 92.9], [-214.6, 67.5], [-220.4, 42.9], [-231.2, 20.8],
    [-235.0, 2.8], [-222.0, -12.2], [-203.1, -29.3], [-189.1, -50.4], [-175.4, -71.9],
    [-161.5, -92.3], [-156.7, -112.9], [-156.3, -132.4], [-144.2, -145.2], [-122.3, -147.9],
    [-98.4, -147.8], [-75.7, -153.8], [-54.5, -164.5], [-32.4, -171.4], [-14.7, -166.5],
    [-1.8, -150.7], [16.9, -137.3], [42.0, -131.6], [66.9, -125.7], [90.8, -120.2],
    [114.4, -122.9], [134.4, -125.6],
  ],
  monza: [ // Monza — long straights broken by chicanes, the Lesmos, Parabolica home
    [-58.1, 113.9], [-42.5, 111.7], [-23.6, 111.0], [-1.6, 111.3], [20.8, 111.1],
    [43.3, 111.0], [65.6, 110.7], [87.9, 110.3], [110.3, 109.9], [132.5, 109.4],
    [154.7, 108.7], [176.6, 107.3], [198.1, 104.9], [218.1, 99.2], [232.5, 86.7],
    [235.0, 69.6], [223.7, 56.2], [204.0, 50.9], [181.9, 49.8], [159.6, 49.5],
    [137.2, 49.3], [114.7, 49.3], [92.3, 49.1], [70.0, 48.6], [47.7, 48.2],
    [26.3, 45.6], [6.1, 40.2], [-13.9, 34.2], [-32.8, 25.4], [-49.8, 12.3],
    [-66.2, -2.5], [-82.5, -17.4], [-98.7, -32.5], [-114.5, -48.0], [-128.8, -64.4],
    [-141.4, -81.7], [-154.0, -98.6], [-169.6, -110.7], [-189.1, -113.9], [-209.8, -110.6],
    [-227.1, -102.0], [-235.0, -86.3], [-232.2, -66.9], [-223.6, -47.9], [-214.2, -29.3],
    [-207.4, -9.7], [-203.0, 11.0], [-199.0, 31.8], [-194.3, 52.4], [-187.7, 72.1],
    [-176.9, 89.7], [-160.9, 102.7], [-141.4, 109.9], [-120.0, 112.5], [-97.7, 112.9],
    [-76.1, 113.9],
  ],
  marina: [ // Singapore Marina Bay — right-angle street blocks under lights
    [173.6, -147.4], [188.7, -144.2], [204.8, -133.8], [214.8, -118.5], [219.1, -98.6],
    [221.8, -77.6], [224.5, -56.7], [227.3, -35.7], [230.1, -14.8], [232.8, 6.1],
    [235.0, 27.0], [233.0, 46.9], [222.4, 62.4], [204.6, 69.8], [183.8, 70.5],
    [162.2, 69.3], [140.6, 68.1], [123.4, 61.9], [111.0, 49.9], [94.9, 41.6],
    [76.2, 42.3], [62.3, 51.9], [49.4, 63.1], [31.0, 66.6], [9.6, 64.9],
    [-6.4, 57.2], [-16.0, 43.1], [-29.2, 32.0], [-47.4, 24.6], [-65.1, 14.0],
    [-81.8, 1.1], [-98.8, -7.6], [-113.6, -4.0], [-122.7, 11.6], [-128.2, 31.4],
    [-133.3, 51.4], [-137.9, 71.6], [-141.3, 92.2], [-143.6, 113.3], [-146.3, 134.2],
    [-153.9, 147.4], [-168.2, 144.7], [-184.6, 131.5], [-197.9, 115.0], [-206.8, 97.0],
    [-216.8, 80.9], [-229.4, 66.8], [-235.0, 50.0], [-229.8, 31.4], [-219.8, 13.5],
    [-209.2, -4.2], [-198.5, -21.8], [-187.7, -39.5], [-175.6, -55.7], [-160.5, -63.3],
    [-143.8, -56.9], [-127.1, -45.2], [-111.3, -43.1], [-98.3, -54.7], [-86.0, -71.1],
    [-71.0, -80.5], [-53.5, -77.7], [-35.7, -67.9], [-18.0, -57.2], [-0.4, -46.6],
    [17.6, -36.7], [36.8, -29.9], [57.7, -26.9], [79.3, -25.7], [101.0, -24.8],
    [122.6, -23.9], [144.2, -23.2], [163.7, -26.4], [175.7, -38.6], [177.2, -57.4],
    [171.9, -77.1], [165.3, -96.4], [161.8, -116.4], [164.3, -136.4],
  ],
  panorama: [ // Mount Panorama — the climb, the ridge esses, the plunge, Conrod
    [227.7, -142.7], [208.4, -143.6], [186.4, -139.5], [164.5, -135.4], [142.4, -131.6],
    [120.2, -128.0], [98.1, -126.1], [76.6, -129.1], [56.0, -135.5], [36.7, -135.8],
    [20.4, -124.5], [4.6, -109.8], [-14.6, -100.4], [-36.5, -97.3], [-59.1, -98.1],
    [-79.3, -96.0], [-92.2, -83.4], [-100.1, -63.7], [-111.6, -45.8], [-128.8, -32.3],
    [-147.5, -20.5], [-166.4, -8.9], [-185.4, 2.4], [-204.3, 13.8], [-222.7, 26.0],
    [-235.0, 41.5], [-232.8, 57.4], [-216.5, 65.5], [-194.4, 65.3], [-171.9, 62.6],
    [-149.5, 59.6], [-127.0, 56.7], [-104.5, 54.0], [-82.0, 53.3], [-60.1, 56.7],
    [-39.0, 62.9], [-18.2, 69.7], [-0.2, 79.6], [8.5, 96.0], [9.7, 116.5],
    [16.2, 134.6], [33.0, 143.6], [52.3, 139.8], [66.2, 125.3], [76.2, 106.2],
    [89.8, 92.1], [109.2, 89.0], [130.6, 93.4], [151.7, 99.6], [173.0, 105.3],
    [193.5, 105.3], [208.4, 94.1], [214.6, 74.0], [217.0, 51.3], [222.5, 29.9],
    [226.5, 10.2], [219.0, -5.7], [201.3, -16.4], [183.0, -27.4], [170.6, -44.1],
    [166.6, -65.1], [172.0, -85.0], [186.8, -99.1], [206.2, -108.8], [225.1, -119.0],
    [235.0, -132.3],
  ],
  rallyx: [ // Rallycross — a compact mixed-surface stadium loop
    [-158.9, -48.9], [-117.5, -54.7], [-80.5, -43.1], [-63.5, -19.4], [-77.9, 3.2],
    [-116.0, 16.9], [-157.7, 29.7], [-181.8, 52.3], [-175.9, 77.9], [-145.0, 89.3],
    [-104.0, 80.6], [-62.1, 60.4], [-20.7, 37.3], [20.7, 14.5], [61.8, -5.0],
    [102.0, -13.3], [141.8, -5.8], [181.5, 4.9], [216.5, -1.2], [235.0, -27.8],
    [227.1, -59.7], [194.7, -80.6], [148.8, -88.1], [98.4, -89.3], [47.5, -89.3],
    [-3.5, -89.3], [-54.2, -88.8], [-103.7, -85.2], [-150.0, -74.1], [-192.8, -53.5],
    [-225.9, -25.1], [-224.1, -12.9], [-215.7, -9.4], [-194.9, -26.2],
  ],
  oulton: [ // Oulton Park — parkland kidney with Old Hall, Island, the Hislops flick
    [76.7, 83.6], [95.7, 74.6], [114.3, 65.7], [133.0, 57.5], [151.8, 49.9],
    [170.3, 41.4], [188.9, 32.3], [207.3, 22.9], [223.7, 11.0], [233.8, -5.7],
    [235.0, -25.4], [229.7, -45.2], [222.2, -64.3], [213.6, -83.0], [202.9, -100.9],
    [189.0, -116.6], [171.6, -127.4], [152.0, -130.3], [133.7, -123.4], [119.3, -108.9],
    [108.1, -91.2], [98.2, -73.0], [88.7, -54.7], [77.7, -37.1], [66.0, -20.0],
    [55.4, -3.1], [42.8, 11.4], [26.7, 23.7], [9.7, 35.9], [-8.2, 41.7],
    [-23.8, 34.5], [-31.0, 17.1], [-31.3, -3.9], [-32.4, -24.6], [-39.1, -43.8],
    [-50.2, -61.5], [-64.5, -76.5], [-82.4, -85.1], [-102.4, -85.5], [-122.5, -80.6],
    [-142.3, -74.7], [-162.5, -69.5], [-182.9, -65.0], [-203.6, -61.1], [-223.0, -55.1],
    [-235.0, -42.7], [-233.2, -25.9], [-219.5, -12.2], [-200.4, -5.0], [-180.1, -4.8],
    [-161.7, -12.7], [-145.4, -25.9], [-128.1, -36.9], [-109.3, -38.2], [-93.9, -27.7],
    [-85.8, -9.5], [-81.8, 11.1], [-77.8, 31.8], [-72.2, 51.8], [-65.3, 71.2],
    [-58.1, 90.5], [-50.3, 109.5], [-38.3, 124.8], [-20.9, 130.3], [-1.2, 125.3],
    [18.4, 115.4], [37.8, 104.6], [57.3, 93.7],
  ],
  laguna: [ // Laguna Seca — the Andretti hairpin and the Corkscrew drop
    [109.5, -232.9], [137.3, -224.0], [159.9, -202.8], [178.9, -177.1], [197.2, -151.1],
    [215.7, -125.2], [231.3, -98.4], [235.0, -70.4], [221.2, -47.3], [194.8, -34.0],
    [163.9, -27.5], [132.4, -22.5], [101.4, -16.1], [71.8, -6.6], [43.6, 6.5],
    [17.0, 23.3], [-5.4, 45.0], [-17.7, 72.5], [-19.5, 104.2], [-15.2, 136.0],
    [-2.7, 162.3], [21.4, 176.0], [51.4, 175.6], [80.2, 164.9], [107.5, 150.2],
    [134.0, 144.7], [150.5, 158.0], [144.7, 180.1], [121.2, 197.0], [92.5, 208.8],
    [63.1, 218.9], [32.9, 227.1], [1.5, 232.3], [-30.7, 232.9], [-62.2, 228.7],
    [-93.1, 222.0], [-123.7, 214.9], [-154.3, 207.5], [-184.7, 199.9], [-214.9, 191.9],
    [-235.0, 178.2], [-232.7, 155.2], [-215.8, 129.0], [-197.2, 103.1], [-182.6, 76.0],
    [-180.7, 47.8], [-193.6, 20.7], [-212.6, -5.0], [-228.2, -31.8], [-229.1, -58.3],
    [-210.7, -78.6], [-183.3, -92.9], [-161.3, -110.8], [-145.5, -133.3], [-123.3, -150.6],
    [-94.6, -162.3], [-65.6, -173.5], [-36.7, -184.8], [-7.8, -196.0], [21.2, -207.3],
    [50.1, -218.5], [79.4, -228.7],
  ],
  corse: [ // Tour de Corse — 26 km of Corsican mountain tarmac, hairpin over hairpin
    [82.6, 32.3], [57.4, 29.3], [36.8, 29.3], [16.2, 29.4], [10.1, 33.1],
    [8.8, 39.0], [17.8, 51.7], [26.2, 68.8], [30.0, 87.7], [30.1, 107.6],
    [29.1, 127.6], [31.7, 146.4], [42.3, 159.0], [58.1, 159.4], [69.1, 147.3],
    [71.0, 129.1], [68.8, 109.7], [70.0, 91.3], [79.7, 78.2], [95.1, 76.9],
    [108.8, 87.5], [119.4, 103.4], [131.5, 117.9], [147.6, 127.2], [166.3, 130.3],
    [185.4, 128.1], [203.4, 121.6], [219.4, 111.2], [233.8, 98.0], [247.3, 83.6],
    [259.7, 68.4], [267.9, 51.6], [267.1, 33.8], [257.9, 17.3], [247.3, 1.3],
    [243.6, -15.8], [251.3, -29.2], [267.4, -33.3], [286.1, -32.4], [303.6, -36.3],
    [316.0, -48.5], [320.0, -65.9], [316.6, -84.2], [308.9, -101.7], [299.1, -118.2],
    [287.1, -133.4], [272.6, -146.5], [256.1, -156.6], [238.8, -159.4], [225.3, -151.1],
    [223.0, -135.9], [233.1, -122.4], [249.3, -113.2], [266.0, -103.9], [277.7, -90.8],
    [277.1, -77.1], [263.7, -70.4], [244.7, -70.8], [225.0, -73.0], [206.6, -78.1],
    [191.5, -89.1], [178.6, -103.7], [164.1, -116.1], [146.8, -121.4], [128.7, -118.0],
    [112.1, -108.3], [97.5, -95.6], [89.2, -80.3], [93.2, -65.9], [108.1, -59.5],
    [126.6, -61.3], [144.9, -62.3], [160.3, -54.9], [169.9, -39.6], [175.3, -21.2],
    [179.2, -2.2], [183.0, 16.9], [185.6, 36.1], [182.8, 53.6], [171.0, 62.8],
    [156.5, 58.4], [147.1, 43.5], [142.7, 24.7], [138.2, 6.0], [128.3, -8.3],
    [112.3, -13.1], [93.7, -11.6], [75.6, -13.6], [60.4, -23.7], [49.1, -38.9],
    [37.8, -54.3], [23.2, -66.4], [5.9, -74.4], [-12.4, -80.1], [-31.2, -83.4],
    [-49.5, -80.9], [-66.6, -73.1], [-84.0, -67.4], [-102.7, -67.8], [-121.9, -68.4],
    [-139.1, -62.5], [-151.7, -49.2], [-160.3, -32.2], [-169.4, -16.2], [-182.7, -8.0],
    [-195.5, -13.3], [-199.2, -28.8], [-194.0, -46.5], [-185.3, -63.5], [-176.7, -80.6],
    [-171.2, -98.4], [-174.4, -114.2], [-187.1, -119.9], [-201.1, -112.1], [-211.4, -96.6],
    [-220.3, -79.7], [-231.3, -65.9], [-241.2, -66.2], [-245.6, -76.4], [-241.9, -94.6],
    [-241.7, -111.6], [-251.0, -120.7], [-264.8, -115.6], [-277.1, -101.4], [-287.7, -85.2],
    [-295.4, -67.9], [-296.5, -49.7], [-289.4, -32.4], [-277.0, -17.1], [-265.9, -1.5],
    [-265.1, 12.8], [-276.7, 18.0], [-293.3, 12.1], [-309.5, 7.4], [-320.0, 14.4],
    [-319.1, 30.0], [-314.0, 48.1], [-310.3, 66.2], [-300.9, 79.0], [-283.5, 83.1],
    [-264.2, 84.9], [-246.6, 91.6], [-229.7, 100.0], [-211.9, 102.2], [-194.0, 97.0],
    [-176.0, 90.8], [-157.2, 88.4], [-138.8, 92.3], [-122.4, 102.5], [-107.0, 115.2],
    [-90.8, 125.7], [-72.7, 130.6], [-54.2, 128.0], [-38.6, 118.1], [-28.8, 102.4],
    [-26.4, 84.0], [-30.5, 65.5], [-35.8, 47.1], [-36.9, 28.1], [-31.3, 10.2],
    [-19.5, -3.8], [-2.8, -11.2], [15.7, -12.8], [33.0, -6.5], [48.6, 4.2],
    [64.8, 13.8], [77.9, 14.2], [86.8, 23.2],
  ],
  vineyard: [ // the player's third hand-drawn loop: spiral head, three paw lobes
    [172.3, -40.4], [183.7, -29.9], [200.7, -17.7], [211.0, -1.3], [211.1, 19.9],
    [204.4, 41.6], [194.1, 61.9], [181.2, 81.0], [166.2, 98.9], [149.4, 115.0],
    [130.2, 127.4], [111.0, 131.8], [100.0, 123.3], [103.0, 105.2], [113.1, 84.8],
    [119.3, 63.5], [115.6, 42.4], [101.5, 26.6], [82.4, 23.0], [66.0, 33.6],
    [60.1, 52.0], [63.9, 72.8], [67.2, 95.7], [64.7, 118.8], [54.5, 137.1],
    [35.5, 146.1], [16.1, 144.0], [8.3, 130.7], [10.8, 110.2], [11.7, 87.9],
    [7.3, 65.7], [1.5, 43.5], [-8.9, 26.1], [-27.7, 20.1], [-49.0, 25.3],
    [-62.0, 39.2], [-61.5, 58.9], [-57.2, 80.6], [-61.5, 100.8], [-75.5, 117.3],
    [-93.8, 131.4], [-113.8, 140.9], [-132.1, 138.8], [-143.3, 123.9], [-149.9, 102.8],
    [-151.7, 81.6], [-144.8, 61.3], [-128.8, 50.3], [-120.2, 31.0], [-115.9, 8.6],
    [-118.0, -14.5], [-127.7, -34.3], [-145.1, -47.6], [-165.9, -50.6], [-182.9, -41.1],
    [-186.8, -24.4], [-177.9, -6.9], [-167.6, 12.1], [-164.4, 32.5], [-163.8, 54.2],
    [-176.8, 58.7], [-196.8, 56.7], [-216.4, 47.3], [-229.1, 30.2], [-234.7, 8.2],
    [-235.0, -15.2], [-231.6, -38.2], [-224.2, -59.6], [-211.7, -78.9], [-195.0, -95.3],
    [-175.5, -107.2], [-153.5, -112.7], [-130.3, -112.1], [-108.0, -106.7], [-87.8, -96.7],
    [-71.7, -81.6], [-57.3, -66.9], [-37.7, -60.0], [-14.8, -56.1], [7.6, -50.9],
    [30.7, -47.5], [54.8, -46.4], [78.8, -45.2], [102.6, -43.5], [126.7, -42.5],
    [147.0, -45.3], [150.9, -55.8], [140.5, -74.3], [138.8, -96.1], [144.9, -117.3],
    [157.3, -134.3], [176.2, -144.1], [198.8, -146.1], [220.2, -140.8], [233.8, -127.0],
    [235.0, -106.8], [226.2, -86.6], [211.1, -70.3], [192.5, -57.6], [172.4, -48.4],
  ],
  deepwood: [ // forest weave: flowing esses that never leave the trees
    [-210.0, 150.0], [-90.0, 190.0], [30.0, 160.0], [120.0, 190.0], [200.0, 150.0],
    [225.0, 60.0], [160.0, 10.0], [60.0, 40.0], [-40.0, 10.0], [-120.0, -40.0],
    [-60.0, -95.0], [40.0, -70.0], [140.0, -100.0], [200.0, -160.0], [120.0, -210.0],
    [0.0, -185.0], [-100.0, -215.0], [-190.0, -170.0], [-225.0, -80.0], [-170.0, -20.0],
    [-215.0, 50.0], [-225.0, 110.0],
  ],
  dolomiti: [ // meadow hairpin ladder under the pale rock faces, perimeter home
    [-60.0, 220.0], [-160.0, 200.0], [-215.0, 140.0], [-150.0, 95.0], [-40.0, 110.0],
    [80.0, 120.0], [160.0, 85.0], [90.0, 45.0], [-40.0, 55.0], [-140.0, 30.0],
    [-190.0, -20.0], [-120.0, -60.0], [0.0, -45.0], [110.0, -70.0], [170.0, -120.0],
    [90.0, -165.0], [-30.0, -140.0], [-140.0, -170.0], [-90.0, -215.0], [40.0, -220.0],
    [150.0, -195.0], [215.0, -130.0], [225.0, -30.0], [215.0, 80.0], [150.0, 160.0],
    [40.0, 195.0],
  ],
  harbor: [ // the quay run: seafront straight, headland turn, back lanes home
    [-215, -38], [-150, -42], [-70, -44], [10, -44], [90, -42],
    [160, -40], [215, -46], [252, -20], [258, 25], [230, 55],
    [185, 48], [140, 58], [80, 70], [20, 62], [-45, 74],
    [-110, 62], [-165, 74], [-215, 58], [-243, 20], [-240, -12],
  ],
};


/** Title-screen minimaps: the raw circuit control polygon for a theme. */
export function circuitPoints(themeKey) { return CIRCUITS[themeKey] || CIRCUITS.forest; }
