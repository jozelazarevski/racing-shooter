// DEAD COPY — NOTHING IMPORTS THIS FILE. The live code is in src/track.js
// (and friends); this directory is an abandoned split that has already
// drifted (this sky.js is missing the horizon-solids fix, its _buildMassif
// registers no colliders). Editing here changes nothing in the game and
// reading here misleads — it cost the mountain-sinking investigation an
// hour. Verified dead by import grep across src/, tests/, index.html.
// The career roster: one entry per world — id, name, theme, route,
// difficulty tuning and unlock order. Pure data: no three.js, no DOM.
// Split from track.js (r128) so the roster can be read and edited
// without touching world-construction code.
export const LEVELS = [
  { id: 1, name: 'PINE VALLEY',  theme: 'forest',  region: 'PINE VALLEY' },
  { id: 2, name: 'DUST CANYON',  theme: 'desert',  region: 'DUST CANYON' },
  { id: 3, name: 'FROST PEAK',   theme: 'snow',    region: 'FROST PEAK' },
  { id: 4, name: 'CANYON RUN',   theme: 'canyon',  region: 'DUST CANYON',
    tune: { gorgeJump: { count: 2, depth: 26 }, tunnels: { count: 1 } } },
  { id: 5, name: 'EMBER PASS',   theme: 'volcano', region: 'EMBER RIDGE' },
  { id: 6, name: 'SUMMIT CLIMB', theme: 'alpine',  region: 'PINE VALLEY' },
  { id: 7, name: 'GLACIAL PASS', theme: 'glacial', region: 'FROST PEAK' },
  { id: 8, name: 'AMAZON RAPIDS', theme: 'jungle', region: 'AMAZON' },
  { id: 9, name: 'THE DUNE SERPENT', theme: 'dunes', region: 'DUST CANYON' },
  { id: 11, name: 'OASIS AMBUSH', theme: 'oasis', region: 'DUST CANYON' },
  { id: 12, name: 'REDWOOD RAMPAGE', theme: 'redwood', region: 'PINE VALLEY' },
  { id: 13, name: 'LOG FLUME FURY', theme: 'flume', region: 'PINE VALLEY' },
  { id: 14, name: 'FOREST FIRE ESCAPE', theme: 'wildfire', region: 'PINE VALLEY' },
  { id: 15, name: "GLACIER'S GRIND", theme: 'sheetice', region: 'FROST PEAK' },
  { id: 16, name: 'AVALANCHE ALLEY', theme: 'avalanche', region: 'FROST PEAK' },
  { id: 17, name: 'NEON GRID EXPRESSWAY', theme: 'neon', region: 'NEO-KYOTO' },
  { id: 18, name: 'UNDERCITY SLIPSTREAM', theme: 'undercity', region: 'NEO-KYOTO' },
  // ---- CAREER ORDER IS THIS ARRAY, NOT THE ids. ROCKFALL RAVINE sat at slot
  // 10 of 21 and measured as the HARDEST track in the game: 25.8 % of its lap
  // under a 40 u corner radius and 14.3 % under 25 u — both the worst figures
  // on the roster, ahead of GOTTHARD (22.9 / 11.8) and TREMOLA (21.3 / 10.8),
  // on the tightest median radius (87 u) — and it is one of only five worlds
  // with solid cliff walls, and the only one that ALSO drops live rockfall.
  // Since a world opens only on a podium finish on the one before it, that put
  // the game's hardest circuit as a hard gate across the middle of the career.
  // It is now the technical exam immediately before the alpine finale.
  { id: 10, name: 'ROCKFALL RAVINE', theme: 'ravine', region: 'DUST CANYON',
    tune: { gorgeJump: { count: 1 } } },
  { id: 19, name: 'GOTTHARD CLIMB', theme: 'pass', region: 'ALPINE PASSES',
    tune: { tunnels: { count: 2 } } },
  { id: 20, name: 'TREMOLA DESCENT', theme: 'tremola', region: 'ALPINE PASSES',
    tune: { tunnels: { count: 1 } } },
  { id: 21, name: 'FURKA RIDGE', theme: 'furka', region: 'ALPINE PASSES', laps: 1,
    tune: { tunnels: { count: 1 } } },

  // ---- WORLD RALLY: real stages, each a ROUTE over a borrowed THEME with its
  // own `tune`. `tune` is layered over the theme object, so anything a theme
  // sets can be overridden per level — elevation, jump count, cliff walls, the
  // hero bridge. Career order is this array; ids are stable and never reused.
  { id: 22, name: 'COL DE TURINI', theme: 'pass', route: 'turini', region: 'WORLD RALLY',
    // relentless short hairpins, and jumps would be absurd on a tarmac col
    tune: { elev: { amp: 19, ph: [1.1, 2.4, 0.7] }, rampCount: 0 } },
  { id: 23, name: 'OUNINPOHJA', theme: 'forest', route: 'ouninpohja', region: 'WORLD RALLY',
    // the fastest stage in the sport: everything is crests and yumps
    tune: { elev: { amp: 4, ph: [0.4, 1.9, 3.3] }, rampCount: 9, rampMaxCurv: 0.02 } },
  { id: 24, name: 'FAFE LEAP', theme: 'redwood', route: 'fafe', region: 'WORLD RALLY',
    tune: { elev: { amp: 8, ph: [2.2, 0.6, 1.4] }, rampCount: 7, rampMaxCurv: 0.022 } },
  { id: 25, name: 'PIKES PEAK', theme: 'alpine', route: 'pikes', region: 'WORLD RALLY',
    // the tallest climb on the roster, and nothing but the climb
    tune: { elev: { amp: 27, ph: [1.7, 0.3, 2.8] }, rampCount: 0 } },
  { id: 26, name: 'SAFARI PLAINS', theme: 'savanna', route: 'safari', region: 'WORLD RALLY',
    tune: { elev: { amp: 4, ph: [0.9, 2.6, 1.2] }, rampCount: 5 } },
  { id: 27, name: 'CORNICHE', theme: 'canyon', route: 'corniche', region: 'WORLD RALLY',
    tune: { elev: { amp: 7, ph: [2.9, 1.1, 0.5] }, rampCount: 0 } },
  { id: 28, name: 'ESTONIA CRESTS', theme: 'forest', route: 'estonia', region: 'WORLD RALLY',
    // the only world besides CANYON RUN to hang a hero bridge over a gorge
    tune: { // DAWN over the yumps: first light
      sunColor: 0xffc8a0, sunIntensity: 2.3, sunEl: 0.22, sunAz: 0.4,
      skyTop: '#3a5a94', skyHorizon: '#ffc8b0', fogColor: 0xe8c8c0, hemiIntensity: 0.62, elev: { amp: 9, ph: [1.4, 3.1, 0.8] }, rampCount: 8,
      heroBridge: { at: [0.55, 0.66], half: 24, len: 210, depth: 28, skew: 0 } } },

  // ---- MEDITERRANEAN. Appended, so nothing before it is re-priced (career
  // order is this array, not the ids — see the note above ROCKFALL RAVINE).
  //
  // `cost` OVERRIDES THE INDEX PRICE, and `fresh` marks the world as new on
  // the tracks screen. Both exist because append-only pricing has a flaw the
  // roster only just grew into: every NEW region automatically costs more
  // than everything before it, forever. Measured on a fresh save, these four
  // sat 26-29 stars deep — about thirteen podiums before a player could touch
  // the newest content in the game, at the bottom of a 32-card list. Reported
  // as "I don't see the new tracks", twice. New regions now ship at
  // mid-career prices and announce themselves; the override never touches an
  // existing world's cost.
  { id: 29, name: 'OLIVE COAST', theme: 'medterrace', region: 'MEDITERRANEAN', cost: 6, fresh: true },

  // ---- OLD TOWN: the only urban region, and the only night stage that is not
  // NEO-KYOTO. Appended, never inserted — career order is this array and
  // `starCost` prices a world by its INDEX, so a mid-array insert silently
  // re-prices every world after it in an existing save.
  { id: 30, name: 'LANTERN QUARTER', theme: 'oldtown', region: 'OLD TOWN', cost: 8, fresh: true },
  // ---- FARMLAND. Appended, so no existing world's star price moves (career
  // order is this array; starCost() = index - 2).
  { id: 31, name: 'HEDGEROW DASH', theme: 'farmland', region: 'FARMLAND', cost: 10, fresh: true },
  // ---- OUTBACK RED DIRT. Appended at the END of the array on purpose: career
  // order is array position (starCost = index - 2), so anything inserted higher
  // re-prices every world after it in a save that already exists.
  { id: 32, name: 'RED CENTRE RUN', theme: 'outback', region: 'OUTBACK', cost: 12, fresh: true,
    tune: { gorgeJump: { count: 1 } } },

  // ---- GRAND CIRCUITS: the reference sheet of twelve real layouts, each a
  // route over an existing theme (art is the theme's; the geometry is the
  // circuit's). Appended, priced with explicit `cost` like every fresh
  // region, laddered so the collection spans a career.
  { id: 33, name: 'ALPENRING', theme: 'alpine', route: 'alpenring', region: 'GRAND CIRCUITS',
    cost: 5, fresh: true, tune: { elev: { amp: 7, ph: [1.2, 2.4, 0.6] }, rampCount: 0 } },
  { id: 34, name: 'PRINCIPALITY STREETS', theme: 'principality', route: 'principality', region: 'GRAND CIRCUITS',
    cost: 6, fresh: true, tune: { tunnels: { count: 1 }, elev: { amp: 5, ph: [0.8, 1.9, 2.7] }, rampCount: 0 } },
  { id: 35, name: 'AERODROME CIRCUIT', theme: 'farmland', route: 'aerodrome', region: 'GRAND CIRCUITS',
    cost: 7, fresh: true, tune: { // OVERCAST: flat grey racing light, no hard sun
      sunColor: 0xe8e8e8, sunIntensity: 1.7, hemiIntensity: 1.05,
      skyTop: '#7a8a9a', skyHorizon: '#d8dde2', fogColor: 0xd0d6da, cloudCount: 22, cloudOpacity: 1, elev: { amp: 2, ph: [1, 2, 3] }, rampCount: 0 } },
  { id: 36, name: 'ARDENNES SWEEP', theme: 'forest', route: 'ardennes', region: 'GRAND CIRCUITS',
    cost: 8, fresh: true, tune: { elev: { amp: 9, ph: [2.1, 0.7, 1.4] }, rampCount: 0 } },
  { id: 37, name: 'CROSSOVER RING', theme: 'redwood', route: 'crossover', region: 'GRAND CIRCUITS',
    cost: 9, fresh: true, tune: { japan: { torii: 5, pagodas: 3 }, elev: { amp: 4, ph: [1.6, 2.8, 0.3] }, rampCount: 0 } },
  { id: 38, name: 'WALDSCHLEIFE', theme: 'forest', route: 'waldschleife', region: 'GRAND CIRCUITS',
    cost: 10, fresh: true, tune: { elev: { amp: 8, ph: [0.4, 1.8, 2.9] }, rampCount: 0 } },
  { id: 39, name: 'AUTODROMO VELOCE', theme: 'medterrace', route: 'autodromo', region: 'GRAND CIRCUITS',
    cost: 11, fresh: true, tune: { elev: { amp: 1.5, ph: [1, 2, 3] }, rampCount: 0 } },
  { id: 40, name: 'NEON MARINA', theme: 'neon', route: 'marina', region: 'GRAND CIRCUITS',
    cost: 12, fresh: true, tune: { rampCount: 0 } },
  { id: 41, name: 'RAZORBACK MOUNTAIN', theme: 'outback', route: 'panorama', region: 'GRAND CIRCUITS',
    cost: 13, fresh: true, tune: { // DUSK over the mountain: ember sky, violet ranges
      sunColor: 0xffb078, sunIntensity: 1.9, sunEl: 0.18, sunAz: 5.6,
      skyTop: '#3a3564', skyHorizon: '#ff9a58', fogColor: 0xc8a090, hemiIntensity: 0.78, hemiSky: 0x8a80b8, hemiGround: 0x6a5464, elev: { amp: 11, ph: [2.4, 1.1, 0.5] }, rampCount: 2 } },
  { id: 42, name: 'RALLYCROSS ARENA', theme: 'flume', route: 'rallyx', region: 'GRAND CIRCUITS',
    cost: 14, fresh: true, tune: { elev: { amp: 3, ph: [1.3, 2.2, 0.9] }, rampCount: 4 } },
  { id: 43, name: 'ORCHARD PARK', theme: 'farmland', route: 'orchard', region: 'GRAND CIRCUITS',
    cost: 15, fresh: true, tune: { elev: { amp: 4, ph: [0.6, 1.5, 2.4] }, rampCount: 0,
      // AUTUMN: copper woods under a low golden sun
      foliageLow: 0x9a5a20, foliageTop: 0xc8842c,
      foliage: { h: 0.07, hVar: 0.04, s: 0.62, sVar: 0.15, l: 0.36, lVar: 0.12 },
      sunColor: 0xffd898, sunIntensity: 2.5, sunEl: 0.34, hemiGround: 0xa07a48,
      skyTop: '#4a7ab8', skyHorizon: '#f0d8a8', fogColor: 0xe8d8b0,
      terrainLow: '#8a7a3e', terrainHigh: '#b89a58' } },
  { id: 44, name: 'DRY LAGOON', theme: 'canyon', route: 'laguna', region: 'GRAND CIRCUITS',
    cost: 16, fresh: true, tune: { elev: { amp: 9, ph: [1.9, 0.4, 2.6] }, rampCount: 0 } },
  // the 25.8 km Corsican tarmac stage from the player's card: a 3000 u lap,
  // hairpin over hairpin, on the Mediterranean island theme
  { id: 45, name: 'TOUR DES CAPS', theme: 'medterrace', route: 'caps', region: 'GRAND CIRCUITS',
    cost: 17, fresh: true, tune: { tunnels: { count: 1 }, elev: { amp: 10, ph: [0.8, 1.7, 2.9] }, rampCount: 0 } },
  // wine country, deep forest, and the Dolomites - the player's three asks,
  // the vineyard lap tracing their third hand-drawn loop
  { id: 46, name: 'VINEYARD VELOCE', theme: 'vineyard', region: 'HEARTLAND', cost: 18, fresh: true },
  { id: 47, name: 'DEEPWOOD TRAIL', theme: 'deepwood', region: 'HEARTLAND', cost: 19, fresh: true },
  { id: 48, name: 'DOLOMITI CORSA', theme: 'dolomiti', region: 'ALPINE PASSES', cost: 20, fresh: true },
  { id: 49, name: 'HARBOR QUAY', theme: 'harbor', region: 'HEARTLAND', cost: 21, fresh: true },
  // THE MEDITERRANEAN FIVE - one coast each, all with bridges where the route
  // crosses itself and tunnels where a headland gets in the way.
  { id: 50, name: 'CINQUE TERRE', theme: 'liguria', region: 'MEDITERRANEAN', cost: 22, fresh: true,
    route: 'liguriaRun', tune: { tunnels: { count: 1 } } },
  { id: 51, name: 'AEGEAN BLUE', theme: 'aegean', region: 'MEDITERRANEAN', cost: 23, fresh: true,
    route: 'aegeanRun' },
  { id: 52, name: 'COSTA BRAVA', theme: 'brava', region: 'MEDITERRANEAN', cost: 24, fresh: true,
    route: 'bravaRun', tune: { tunnels: { count: 1 } } },
  { id: 53, name: 'DALMATIA DRIVE', theme: 'dalmatia', region: 'MEDITERRANEAN', cost: 25, fresh: true,
    route: 'dalmatiaRun' },
  { id: 54, name: 'COTE D AZUR', theme: 'azur', region: 'MEDITERRANEAN', cost: 26, fresh: true,
    route: 'azurRun', tune: { tunnels: { count: 1 } } },
  // ON LAND, deliberately. First cut put this on a coastal theme and part of
  // the lap ran through the sea - the chase frame was the car floating in a
  // flooded tunnel bore. The drawing has no water in it; it has bridges.
  { id: 55, name: 'BRIDGE RUN', theme: 'vineyard', region: 'HEARTLAND',
    cost: 27, fresh: true, route: 'bridgeRun', tune: { tunnels: { count: 1 } } },
  { id: 56, name: 'OLIVE CROSSING', theme: 'olivecountry', region: 'MEDITERRANEAN',
    cost: 28, fresh: true, route: 'oliveCross', tune: { tunnels: { count: 1 } } },
  { id: 57, name: 'MOUNTAIN TO SEA', theme: 'mountainsea', region: 'MEDITERRANEAN',
    cost: 29, fresh: true, route: 'mountainSea', tune: { tunnels: { count: 1 } } },
];
