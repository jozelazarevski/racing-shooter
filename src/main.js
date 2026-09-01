// NEON STRIKE — 3D top-down racing shooter. All visuals procedural.
import * as THREE from 'three';
import { EffectComposer } from '../lib/postprocessing/EffectComposer.js';
import { RenderPass } from '../lib/postprocessing/RenderPass.js';
import { UnrealBloomPass } from '../lib/postprocessing/UnrealBloomPass.js';
import { OutputPass } from '../lib/postprocessing/OutputPass.js';
import { ShaderPass } from '../lib/postprocessing/ShaderPass.js';

import { Track, LEVELS, circuitPoints, disposeSubtree, withSeed, seedForLevel,
  HOUSE_TEMPLATES, worldFacets, surfaceClass, surfaceSlick, SURFACE_LABEL, TYRE_NAME,
  CHAPTERS, CHAPTER_GATE, chapterSpans } from './track.js';
import { WorldEditor } from './editor.js';
import { loadDrivingOverrides, nitroCeilingKmh, stageTemplate } from './driving.js';
import { runStageValidator } from './stagecheck.js';
import { installRally } from './telemetry.js';
import { Route } from './route.js';
// RALLY_DRIVING.md §13: driving.json overrides load at boot, fire-and-forget
// — no file shipped means the defaults in driving.js ARE the tune.
loadDrivingOverrides();
import { SyncService, encodeSyncCode, decodeSyncCode, cloudConfigured, mergeSnapshots } from './sync.js';
import { PlayerCar, EnemyCar, CAR_CATALOG, buildCarMesh,
  tyreClass, tyreMaxClass, tyreLevelFor, TYRE_LABEL, tyrePenalty,
  applyUpgradeKit, buildPartIcon, worldIsDark, fadeCarLights } from './vehicles.js';
import { Chopper } from './choppers.js';
import { GunNest, Raider } from './hostiles.js';
import { Weapons } from './weapons.js';
import { Particles, SkidMarks } from './particles.js';
import { Hud, fmtTime } from './hud.js';
import { AudioEngine } from './audio.js';
import { Input } from './input.js';
import { glowTexture, contactShadowTexture } from './textures.js';

// EIGHT CARS ON THE GRID, NOT SIX. Reported as "it's 8 cars not 6, update
// that across all game" — the field size leaked into a dozen literals: the
// ordinal arrays stopped at '6TH', the finish bonus was a six-entry table,
// and every piece of copy that said "of 6" said it in prose. There is now
// exactly ONE number, and everything else is derived from it.
const ENEMY_COUNT = 7;
const FIELD = ENEMY_COUNT + 1;          // cars on the grid, player included
const LAPS = 3;

// THREE HULLS AND THE RACE IS OVER. Asked for as "if I get destroyed 3 times
// it is game over, I need to restart the track."
//
// `deaths` was counted and then spent on nothing but a −300 score hit and the
// CLEAN RUN bonus, so being wrecked cost a respawn wait and no more: you could
// hand the car over to the scenery all afternoon and still finish the lap.
// Three is the number because it leaves room for two genuine mistakes — the
// automatic rescue nets and the UNSTUCK button both exist precisely so that
// being STUCK never spends a hull — while making the third one matter.
//
// Free roam has no race to lose and missions run their own one-hull rule, so
// the limit applies to races only.
const HULL_LIVES = 3;

// STARS PER RUNG on the old per-world career ladder.
//
// IT NO LONGER GATES ANYTHING. Worlds open by CHAPTER now (see CHAPTERS in
// track.js and `isChapterOpen`), and every world inside an open chapter is
// raceable immediately. `starCost` is kept because a rung is still a useful
// statement about where in the career a world sits — the level table's own
// `cost` overrides lean on it — but nothing reads it to decide a padlock.
// Left exported so the arithmetic stays pinnable by a test rather than
// re-derived from a rounded price and disagreeing by half a star.
export const LADDER_SLOPE = 0.5;

/** "1ST".."8TH" — the ordinal for a finishing position. Was a literal array
 *  in three places, each of which stopped at 6 and fell through to a bare
 *  `${n}TH` for anything beyond, so a 7th place read "7TH" while 1st..6th
 *  read from the table. One function now, correct for any field size. */
const ordinal = (n) => {
  const t = n % 100;
  const suffix = t >= 11 && t <= 13 ? 'TH'
    : ['TH', 'ST', 'ND', 'RD'][n % 10] || 'TH';
  return `${n}${suffix}`;
};

// THE RUBBER BAND USED TO CANCEL THE DIFFICULTY KNOB.
//
// Rival pace is `baseMaxSpeed * aiSpeed * max(0.7, band)`, and `band` scales
// with `rubberBand` — which ran BACKWARDS against `aiSpeed`. EASY carried the
// biggest catch-up boost (1.25) and HARD the smallest (0.75), so at the moment
// the player was leading — exactly when a difficulty setting is supposed to
// bite — the three tiers converged to within 11 % of each other, against a
// nominal spread of 25 %. Measured over a 70 s run on PINE VALLEY, the best
// HARD rival was only 15 % quicker than the best EASY one, and a stand-in
// player holding THREE-QUARTER throttle finished P1 of 6 on all three tiers.
//
// So the two knobs now point the same way. HARD races to its own pace: the
// band is nearly off, a mistake is not repaid, and the field will drive away
// from you if you drop it. EASY keeps its strong band, which is what makes it
// forgiving — the pack waits for you.
// `aiCorner` EXISTS BECAUSE `aiSpeed` IS A WEAK LEVER.
//
// A rival's pace is set by its braking model, not its top speed: it corners at
// `vMax = sqrt(aLat / curvature)`, and `aLat` carried `aiSpeed`. Under the
// square root, raising aiSpeed by 16 % bought 7.7 % of corner speed — measured,
// exactly the +7 % of race distance it produced. Pushing aiSpeed far enough to
// matter would have made rivals quicker in a straight line than any car in the
// garage (rival base is 53-60, player cars 54-63), which is a different and
// worse problem.
//
// So top speed and cornering are separate knobs now. `aiSpeed` stays near the
// player's range and governs straights; `aiCorner` multiplies the lateral
// grip budget and is what actually makes a tier faster, because corners are
// where the time is.
const DIFFS = {
  // aiCorner AFTER THE GRIP BUDGET (r284): the player's tyres now obey
  // a_lat <= 4·grip, so a tier that plans corners far above 1.0 is a field
  // openly exempt from physics the player can feel. Measured with whokilled
  // on the new physics, NORMAL at 1.10 ran rivals 20-27% faster than a
  // 75%-margin driver; at 1.00 the field corners AT the limit — beatable by
  // anyone who drifts well, still ahead of anyone who doesn't. HARD keeps a
  // visible edge (1.15, plus its aiSpeed) as the arcade villain rather than
  // the old 1.60, which was sixty percent past a law of nature.
  // ...and re-tuned against test-difficulty's five laws once corners
  // stopped being free: the old tiers were priced for a player who railed
  // every bend at any speed, and with that cheat gone HARD at aiSpeed 1.15
  // was unwinnable by a clean full-throttle stand-in and EASY beat a casual
  // one. The laws are the arbiter: pace still rises with tier, the gap is
  // still real, EASY is casual-winnable, HARD is clean-winnable.
  //
  // aiCorner CUT AGAIN (r285), from the measurement the laws forced: the
  // stand-in gains only ~9% going from 75% throttle to full — under the
  // grip budget a player is CORNER-limited, sustaining ~20 u/s² where the
  // rival model still plans 30-60. Rivals are corner-limited 95% of the
  // time, so field pace goes as sqrt(aiSpeed·aiCorner); these values put
  // HARD's best lap within a clean drifting player's 0.80 reach (was 0.74-
  // 0.76) and let a 75%-throttle casual actually hold P1 on EASY (was
  // re-passed on FURKA by 15%).
  // ...solved rather than nudged (r285): the measured dilution between the
  // corner budget and LAP pace is lap ∝ aLat^0.26 (clamps, straights and the
  // crawl floor absorb the rest), so the laws' targets convert directly:
  // HARD's best lap inside a clean player's 0.80 with margin, NORMAL a real
  // step below HARD, EASY beaten by a 75%-throttle casual on FURKA's narrow
  // laps too, not just PINE's. HARD rivals now plan 19-37 u/s² — the same
  // neighbourhood a drifting player actually sustains, which is the first
  // time the villain obeys the physics it sells.
  // HARD's edge lives in aiCorner a notch over NORMAL's, and aiSpeed stays
  // at 1.06: 1.10 was tried and INVERTED the tier order on PINE — the
  // backfire this file already recorded once, where a raised maxSpeed drops
  // rivals under the `v > maxSpeed*0.55` nitro gate and they boost half as
  // often. The knob that reads fastest makes the field slower.
  // rubberBand/bandUp are GONE (r313, §5): the band itself is deleted from
  // EnemyCar — convergence now lives ONLY in the pressure rival's ±3% lease
  // — and a key nothing reads is a config that lies. A tier's whole pace is
  // aiSpeed × aiCorner; its forgiveness is that pace being low, not a pack
  // that waits.
  easy:   { id: 'easy',   label: 'EASY',   aiSpeed: 0.74, aiCorner: 0.26, aiAggression: 0.65 },
  normal: { id: 'normal', label: 'NORMAL', aiSpeed: 0.97, aiCorner: 0.58, aiAggression: 1.0 },
  // hard aiCorner 0.65 (r291): the drag restore lifted absolute speeds and
  // the tier-blind pinch caps bind sooner, compressing normal and hard to a
  // 3-point coin flip on open worlds (1212 vs 1209 measured). Two points of
  // corner budget give HARD back a real edge without re-crossing the
  // clean-winnable bound.
  hard:   { id: 'hard',   label: 'HARD',   aiSpeed: 1.06, aiCorner: 0.65, aiAggression: 1.4 },
};

const UPGRADES = [
  { key: 'engine',   name: 'ENGINE WRENCH',     icon: '🔧', desc: '+4% top speed / lvl',       max: 5 },
  { key: 'handling', name: 'SUSPENSION SPRING', icon: '⚙️', desc: 'smoother steering / lvl',   max: 5 },
  { key: 'tires',    name: 'TIRES STACK',       icon: '🛞', desc: '+4% grip / lvl',            max: 5 },
  { key: 'nitro',    name: 'BOOST NITRO CAN',   icon: '⚡', desc: '+22% nitro charge / lvl',   max: 5 },
  { key: 'armor',    name: 'ARMOR SHIELD',      icon: '🛡️', desc: '+15 max hull / lvl',        max: 5 },
  { key: 'cannon',   name: 'CANNON CORE',       icon: '🔥', desc: '+18% cannon damage / lvl',  max: 5 },
  // Landings are the one thing the garage had no answer to: a stock car pays
  // hull for every unit of impact speed past a fixed threshold, so a big air
  // was a wreck no matter what you had bought. Dampers raise the speed a
  // landing is free at AND halve what the rest of it costs, which turns "don't
  // jump that" into "buy the springs and jump it".
  { key: 'dampers',  name: 'LONG-TRAVEL DAMPERS', icon: '🪂', desc: 'survive bigger drops / lvl', max: 5 },
  // ---- THE THREE THAT SELL CAPACITY, NOT PERFORMANCE (r173) ----
  //
  // "Rockets and gun needs to have limited and upgradable slots. Same for the
  // sos. Limited and buyable." Everything above makes the car better at what
  // it already does; these decide how much of a race you can spend fighting.
  // A stock machine now leaves the line with 90 rounds, one rocket, one mine
  // and one recovery charge, so the shooter half of the game is a resource to
  // manage rather than a button that is always available.
  { key: 'magazine', name: 'MAGAZINE DRUM',  icon: '📦', desc: '+30 cannon rounds / lvl', max: 5 },
  { key: 'rack',     name: 'ORDNANCE RACK',  icon: '🚀', desc: '+1 rocket and +1 mine / lvl', max: 5 },
  // Capped at 3 deliberately: four rescues is already a lot of get-out-of-jail
  // on a three-hull race, and the 30 s cooldown still applies on top, so extra
  // charges buy you SEPARATE incidents rather than a second try at one corner.
  { key: 'beacon',   name: 'RECOVERY BEACON', icon: '🆘', desc: '+1 SOS charge / lvl', max: 3 },
];

// ===== [PARTS] THE BUILD BAY — hardware you CHOOSE, not levels you climb =====
//
// Asked for as: "Create a garage where I can custom build the car. Shows the
// tires, weapons, looks engine v4-8-12, add spoilers etc. I would purchase
// parts and race for other parts."
//
// The ten UPGRADES above are TUNING: one ladder per line, every rung strictly
// better than the last, no decision to make beyond what to spend next. Parts
// are the other half — a SLOT holds exactly one part, the options TRADE
// against each other rather than stacking, and picking one is a real choice
// about how the car drives. A V12 is not "a better engine"; it is more power
// than the tyres can put down, and you buy a wing to get it back.
//
// Every part is visible from the chase camera (see applyUpgradeKit): the
// engine sets how many pipes come out of the tail, the spoiler is the
// silhouette. Money buys most of them; the top part in each slot is EARNED,
// which is the "race for other parts" half.
//
// Fitment is PER CAR, exactly like upgrade levels — buying a V8 for the
// BRAWLER does not put one in the SLEEK. `lock` is evaluated against career
// data the game already keeps, so no new tracking rides along.
const PART_SLOTS = [
  {
    key: 'engine', name: 'ENGINE BLOCK', icon: '🔩',
    blurb: 'Power against grip. Bigger blocks pull harder and slide sooner.',
    // WHAT RAISES THE CEILING. A bay is only so big and a chassis only so
    // stiff: `mount` is the ladder that lets this car carry a bigger one, the
    // same way TIRES STACK opens a compound.
    mount: 'engine', mountName: 'ENGINE WRENCH',
    parts: [
      { id: 'v4', name: 'V4 INLINE', sub: 'Stock. Honest and tidy.', tier: 0,
        cost: 0, stock: true, speed: 1, accel: 1, grip: 1, pipes: 2 },
      { id: 'v6', name: 'V6 TURBO', sub: 'A real shove out of slow corners.', tier: 1,
        cost: 1800, speed: 1.06, accel: 1.10, grip: 0.97, pipes: 2 },
      { id: 'v8', name: 'V8 BLOCK', sub: 'Fast everywhere, loose everywhere.', tier: 2,
        cost: 4200, speed: 1.14, accel: 1.18, grip: 0.93, pipes: 4 },
      { id: 'v12', name: 'V12 MONSTER', sub: 'More engine than tyre. Fit a wing.', tier: 3,
        cost: 9000, speed: 1.24, accel: 1.24, grip: 0.86, pipes: 6,
        lock: { kind: 'cleared', n: 6, label: 'WIN 6 WORLDS OUTRIGHT' } },
    ],
  },
  {
    key: 'spoiler', name: 'REAR WING', icon: '🪽',
    blurb: 'Downforce: grip that arrives with speed, paid for in top end.',
    mount: 'handling', mountName: 'SUSPENSION SPRING',
    parts: [
      { id: 'none', name: 'NO WING', sub: 'Nothing to slow you down.', tier: 0,
        cost: 0, stock: true, speed: 1, down: 0 },
      { id: 'lip', name: 'LIP SPOILER', sub: 'A little stability, barely a cost.', tier: 1,
        cost: 900, speed: 0.99, down: 0.10 },
      { id: 'duck', name: 'DUCKTAIL', sub: 'Planted through the quick stuff.', tier: 2,
        cost: 2200, speed: 0.975, down: 0.22 },
      { id: 'gt', name: 'GT WING', sub: 'Enormous. Corners like it is on rails.', tier: 3,
        cost: 5000, speed: 0.95, down: 0.40,
        lock: { kind: 'medals', n: 3, label: 'TAKE 3 MISSION MEDALS' } },
    ],
  },
];
const PART_SLOT = Object.fromEntries(PART_SLOTS.map((s) => [s.key, s]));

// WHAT EACH CHASSIS CAN CARRY BEFORE ANY MONEY IS SPENT.
//
// "Not all elements should be available for all chassis. That's the reason for
// upgrades on chassis." Exactly the shape the TYRE system already has: a car
// has a class of its own, and a ladder raises it. So a bay is only so big and
// a body only so stiff — engine tier is what the ENGINE WRENCH opens up, wing
// tier is what the SUSPENSION SPRING opens up, and a maxed ladder adds +2.
//
// The numbers come from what each machine IS, so the roster reads as eight
// different cars rather than eight price points:
//   BASTION and PIT are heavy haulers — huge engine bays, bodies too soft and
//     too tall to ever carry a GT wing
//   SLEEK is a little hatch — the wing bolts straight on, the big blocks never
//     will
//   FLATSIX and CROWN are the tarmac cars: room for both, at a price
//   DUNE is built to climb, not to corner — big lump, no aero
// A car can therefore be the ONLY home for a part, which is the point: the
// V12 lives in the heavy cars, the GT wing in the light ones, and no single
// machine in the game can wear both.
const CHASSIS_MOUNT = {
  brawler: { engine: 1, spoiler: 1 },
  sleek: { engine: 0, spoiler: 2 },
  crown: { engine: 1, spoiler: 2 },
  dune: { engine: 2, spoiler: 0 },
  flatsix: { engine: 1, spoiler: 2 },   // light coupe: big wing, never a big block
  bastion: { engine: 3, spoiler: 0 },
  alpine: { engine: 1, spoiler: 2 },
  pit: { engine: 3, spoiler: 1 },
};
const MOUNT_MAX = 3;
/** A LADDER IS WORTH EXACTLY ONE MOUNT CLASS, at level 3.
 *
 *  It was two (one every other rung), and that let six of the eight chassis
 *  reach the top class — which makes "not every part fits every chassis" true
 *  on paper and meaningless in play. One class means the CAR decides what it
 *  can ever wear and the ladder only ever moves you one step, so the roster
 *  splits cleanly: the heavy machines take the big blocks, the light ones take
 *  the big wings, and NO CAR IN THE GAME CAN WEAR BOTH. */
const mountFromLevel = (lvl) => ((lvl | 0) >= 3 ? 1 : 0);
/** The stock part of a slot — what an unbuilt car is wearing, and the thing
 *  every save written before parts existed is treated as having. */
const stockPart = (slot) => slot.parts.find((p) => p.stock) || slot.parts[0];
// ===== end [PARTS] =====

// world-card flavor lines (surface + signature hazards per theme)
const WORLD_TAGS = {
  forest: '🌧 wet road · drizzle', desert: 'fast sweepers · dust',
  snow: '❄ snow road · low grip', canyon: 'cliff walls · bridges',
  volcano: 'embers · boulders', alpine: 'switchback mountain climb',
  glacial: '❄ ice canyon · igloos', jungle: '🌧 river fords · rain',
  dunes: 'sand geysers · dune sweeps', ravine: '⚠ live rockfall',
  oasis: 'mud · 🦂 scorpions', redwood: 'giant redwoods · root jumps',
  flume: '💧 flume runs · log yard', wildfire: '🔥 burning treefall',
  sheetice: '❄ sheet ice · icicles', avalanche: '❄ avalanche chase',
  neon: 'maglev lanes · night city', undercity: '🐀 rats · tunnels',
  medterrace: 'stone walls · gravel on the exits',
  oldtown: '💧 wet cobbles · no runoff',
  farmland: '🌧 hedge banks · mud · blind crests',
  outback: 'bulldust holes · creek jumps · 🦘',
  autumnwood: '🍂 wet leaves · low sun',
  riviera: '🌊 seafront tarmac · town walls',
  genova: '🏙 port city · caruggi and docks',
  sanremo: '⛰ mountain stage · olive terraces',
  harvestvale: '🍂 stubble fields · long shadows',
  mistfell: '🌫 bracken moor · mist banks',
};

// TRACK-LIST FILTERS. The vocabulary lives here and the facets themselves are
// derived in track.js (`worldFacets`), so adding a world adds its chips.
//
// Within a group the chips are OR — RAIN *or* SNOW — because picking two
// weathers means "either will do". Across groups they are AND, because
// picking NIGHT and WET means you want a wet night stage, not a list of
// everything that is one or the other. An empty group constrains nothing.
const FILTER_GROUPS = [
  { key: 'time', label: 'TIME', tags: [
    ['DAY', '☀ DAY'], ['DUSK', '🌅 DUSK'], ['NIGHT', '🌙 NIGHT']] },
  { key: 'weather', label: 'WEATHER', tags: [
    ['CLEAR', '☁ CLEAR'], ['RAIN', '🌧 RAIN'], ['SNOW', '❄ SNOW'],
    ['DUST', '🌪 DUST'], ['EMBERS', '🔥 EMBERS'], ['MIST', '🌫 MIST']] },
  { key: 'scenery', label: 'SCENERY', tags: [
    ['FOREST', '🌲 FOREST'], ['MOUNTAIN', '⛰ MOUNTAIN'], ['SNOWFIELD', '🏔 SNOWFIELD'],
    ['COAST', '🌊 COAST'], ['DESERT', '🏜 DESERT'], ['CANYON', '🪨 CANYON'],
    ['JUNGLE', '🌴 JUNGLE'], ['FARMLAND', '🌾 FARMLAND'], ['PLAINS', '🦓 PLAINS'],
    ['CITY', '🏙 CITY'], ['VOLCANIC', '🌋 VOLCANIC']] },
  // Grip, not looks — this is the `surface` the physics reads, so a WET chip
  // promises a road that actually behaves wet.
  { key: 'road', label: 'ROAD', tags: [
    ['DRY', 'DRY'], ['WET', '💧 WET'], ['SNOW', '❄ SNOW/ICE']] },
  // SEASON. Worth its own row rather than a scenery tag, because a season cuts
  // ACROSS scenery: autumn is a wood AND farm country AND a moor, and filing
  // it under any one of those hides the other two.
  { key: 'season', label: 'SEASON', tags: [
    ['AUTUMN', '🍂 AUTUMN'], ['WINTER', '❄ WINTER']] },
];

// steer: how much of the car's steering rate the player gets in this view.
// From above, a yaw change moves the car against a fixed world and reads as
// exactly what it is. From behind, the camera yaws WITH the car, so the whole
// scene swings and the same rate reads as twitchy — the correction you make is
// always slightly too much, and you saw-saw down the road. The chase views
// therefore drive on a calmer rack. Only the player is scaled; the AI keeps
// its own rate so the field stays as quick as it ever was.
// THE OVERHEAD VIEWS FOLLOW THE ROAD, NOT THE CAR.
//
// Both of them used to sit behind the car's RAW heading, which is the one
// thing a top-down view must not do: from directly above there is no horizon
// to steady the picture, so every flick of the wheel span the entire world
// around a car that appeared not to move. The chase family was given a damped
// travel-direction yaw for exactly this reason and these two were left behind
// — which is why driving them felt worse the more you steered.
//
// `roadYaw` takes the CENTRELINE's heading instead. The road then runs
// straight up the screen and stays there; the car visibly yaws against it,
// which is the information you actually want (am I pointing where the road
// goes?). The world only turns when the ROAD turns, and it turns at the rate
// you drive into the corner rather than at the rate you move your thumb.
//
// `look` is the other half. It was 7 here and 1 on TOP FAR — from 56 and 87 u
// away, so the car sat dead centre with half the screen showing tarmac
// already driven, and the start gantry filling the rest. Pushed well out, the
// car sits low in frame and the corner arrives on screen before you reach it.
// The studio's eye directions. `SHOT_RIG` is the three-quarter view every part
// icon has always used against the cyclorama; `SHOT_RIG_GROUND` is a wider
// azimuth and a LOWER eye, for subjects standing in the diorama — it has to
// leave the horizon inside the frame, which a part held up to a sweep does
// not care about. See `_shoot` for what was measured.
const SHOT_RIG = new THREE.Vector3(5.2, 3.2, 6.2);
const SHOT_RIG_GROUND = new THREE.Vector3(8.0, 2.5, 3.2);

// RALLY_HUD_REVIEW §4 (r296): the CAR ANCHOR sits at 52-58% of viewport
// height in every non-driver mode, so the car can never ride under the
// controls band (it used to sit at 68-79% — directly beneath the weapon
// cluster, finding 3.1). `look`/`lookH` below are MEASURED, not styled:
// binary-searched per mode against the projected car position on a 390x844
// portrait viewport (tools-scratch/anchortune.mjs), then baked. The cost is
// look-ahead — the aim point rides much nearer the car — which the high
// camera angle absorbs; the H1 gate in test-hudreview holds the band.
const CAM_MODES = [
  // spdH 16/24 -> 8/10 (r309, "I don't feel I go 70 per hour"): the speed
  // rise LIFTED the camera 35% at pace, which shrinks everything on screen
  // exactly when the player wants to feel fast. 1.17x/1.14x keeps a rise
  // (§6.8's envelope is 1.0-1.35x) without eating the sensation; the speed
  // lines now start at 95 km/h to carry the rest.
  { name: 'TOP-DOWN',  back: 16, h: 46, look: 4,  lookH: 0,   spdBack: 8, spdH: 8, steer: 1, roadYaw: true },
  { name: 'TOP FAR',   back: 20, h: 72, look: 5.5, lookH: 0,  spdBack: 6, spdH: 10, steer: 1, roadYaw: true },
  // CHASE sat at h 7.5 / back 13 / look 10 — down at bumper height and close
  // enough that the car filled the screen, so you could not see far enough up
  // the road to place the next corner ("super hard to drive in this camera
  // mode"). Lifted and pulled back, and the look-ahead point pushed well down
  // the road: you now see the corner before you are in it.
  // TRAIL sits between the overhead family and the chase family, and exists for
  // one reason: SPOTTING ROCKS. From TOP-DOWN (52 up, 20 back = 69° elevation,
  // 56 u away) a boulder is a flat disc against flat ground — no side face, no
  // useful shadow, and the car is small enough that judging a gap is guesswork.
  // Dropping to 51° elevation and 33 u away shows every solid's side and its
  // cast shadow, and roughly doubles the car on screen. `chase: true` matters
  // here: at this height the view is close enough that the raw-heading camera
  // whips on every steering flick, so it takes the damped travel-direction yaw.
  { name: 'TRAIL',     back: 21, h: 26,   look: 2.5, lookH: 1.6, spdBack: 5, spdH: 6, chase: true, steer: 0.9, cliffLift: 11 },
  { name: 'CHASE',     back: 17, h: 11.5, look: 4,  lookH: 0.1, spdBack: 4, spdH: 2, chase: true, steer: 0.76 },
  { name: 'DRIVER', driver: true, back: -0.42, h: 2.30, look: 34, lookH: 1.15,
    steer: 0.70, fov: 6, spdFov: 11 },
  { name: 'CHASE FAR', back: 26, h: 17,   look: 4,  lookH: 0.35, spdBack: 4, spdH: 2, chase: true, steer: 0.84 },
  // DRIVER'S VIEW — the eye where the driver's head is, riding the car rather
  // than a boom behind it. It is LAST in the list on purpose: every mode above
  // it is a variation on "watch your car", this one is not, and the cycle
  // button should reach the familiar ones first.
  //
  // `driver: true` sends `_updateCamera` down a completely separate path
  // (`_driverCamera`). None of the chase machinery applies: there is no boom to
  // damp, no sightline to the car to keep clear, and the "lift over the hill in
  // front" rule would put the lens on the roof.
  //
  // The numbers are NOT a chase mode with small values. `h` is the eye height
  // above the contact patch and is only a FALLBACK — the real one is read off
  // the car's own roofline (`userData.rig.capTop`), because the roster runs
  // 2.5 to 3.5 u tall and a constant would sit a BRAWLER driver at chest
  // height and a SLEEK driver through the roof. `back` is negative: the head
  // sits AHEAD of the car's centre, in the cabin. They are also what
  // `_watchCarVisible` re-seats with, so they have to be honest.
  //
  // `steer` is the lowest on the roster (0.70). This view yaws WITH the car
  // more completely than any chase camera does — there is no boom lagging
  // behind to steady it — so the same rack that reads calm from behind reads
  // twitchy from the seat.
  //
  // `fov` widens the base by 6 and `spdFov` nearly doubles the speed stretch
  // (11 against the 6 every other view gets). From a fixed eye with no boom,
  // pace has to be sold by the frame itself, and a wide lens is also what buys
  // back the peripheral road a cockpit loses by being 12 u closer to it.
];
// ---- economy ----
// Score is the arcade number (it inflates fast: 500/lap, big rank bonus,
// points for every smashed crate). Credits are DELIBERATELY a small slice of
// it, so a good race funds real progress but never buys the garage outright.
// Heavy debris: which smashed things throw chunks that can hurt another car,
// and how hard (RULES: debris is shrapnel). Straw, cones, penguins and cacti
// are pulp — they carry no entry here and so never bite.
const DEBRIS_DMG = { crate: 6, snowman: 6, barrel: 9, rock: 10, tree: 14 };

// Hut planks are spawned per crash; building the geometry and material inline
// leaked one of each per plank, since the mesh is dropped without disposing.
const PLANK_GEO = new THREE.BoxGeometry(1.4, 0.3, 0.1);
const PLANK_MATS = new Map(); // colour -> shared material
const plankMat = (col) => {
  let m = PLANK_MATS.get(col);
  if (!m) { m = new THREE.MeshStandardMaterial({ color: col, roughness: 0.9 }); PLANK_MATS.set(col, m); }
  return m;
};

const CREDIT_RATE = 1 / 5;                 // score -> credits
const PODIUM_CR = [650, 400, 220];         // 1st / 2nd / 3rd
const FIRST_CLEAR_CR = 1200;               // once per world, on your first podium
const CLEAN_RUN_CR = 350;                  // finished without wrecking
const SWEEP_CR = 600;                      // all three contracts in one race
// Upgrades escalate QUADRATICALLY: 800 / 1,600 / 4,000 / 8,000 / 13,600 —
// 28,000 to max one line, against ~1,300 CR for a win. The old linear
// 500+400×lvl put a fully maxed line five races away, which made every car
// converge on the same maxed-out feel almost immediately. Steepening the tail
// rather than raising the entry keeps the first upgrade an easy, satisfying
// buy while the last one is a genuine target — and it forces a real choice
// about WHICH line to pour credits into, per car.
// THE UPGRADE LADDER, RE-PRICED.
//
// It was 800 + lvl^2 * 800: steps of 800 / 1600 / 4000 / 8000 / 13600, so one
// line cost 28,000 CR and a fully built car 196,000 across seven lines. A
// strong race paid about 730. That is 267 races to finish ONE car and 203 to
// own the roster, against a campaign of 61 worlds — the content was priced
// out of reach of the game that earns it.
//
// Now 600 + lvl^2 * 500: 600 / 1100 / 2600 / 5100 / 8600, 18,000 a line. The
// SHAPE is kept — the last level is still the one you save for — but the top
// step is 14x the first instead of 17x, and the whole line is affordable.
const upgradeCost = (lvl) => 600 + lvl * lvl * 500;

// ---- race contracts ----
// Every race offers 3 side objectives that pay flat credits on completion, so
// income has texture and skilled play earns a margin — WITHOUT retuning the
// settled rates above. All checks read existing signals only: the style()
// event labels, this.deaths/kills, per-race counters accumulated in this._ct.
// `gate` filters offers that a world/difficulty can't honor; `lap: true`
// contracts resolve at lap boundaries; `atFinish` ones resolve in finishRace.
const _dv = new THREE.Vector3();   // scratch for debris ground lookups
/* RACE CONTRACTS — the side objectives, and the rung you are standing on.
 *
 * These used to be flat: DEMOLITION asked for twelve props on the fiftieth
 * race exactly as it did on the first, and paid the same 60 CR for it. By then
 * a player smashes twelve props without noticing, so the objective had stopped
 * being an objective and become a tax rebate.
 *
 * Each contract now has RUNGS. Complete one and that contract — only that one
 * — steps up for you permanently: a harder target, a bigger payout, and at
 * rung III a difficulty floor. Keep failing it and it stays where it is. The
 * result is a difficulty curve the player writes themselves by playing, and it
 * needs no new systems: the offer screen, the progress readout and the itemised
 * payout were all already there.
 *
 * `need` is what the rung asks for; `check` and `prog` are handed it, so the
 * numbers live in ONE place instead of being repeated in the description, the
 * predicate and the progress string (where they used to disagree the moment
 * anyone edited one of them).
 *
 * `hard: true` on the top rung is the bound the plan asked for: rung III is
 * only reachable on HARD, so a full sweep of three of them is worth about one
 * strong race rather than three, and the side objectives cannot quietly become
 * the main way to earn.
 */
/* ---------- TRACK FEATS: what this world wants from your garage ----------
 *
 * Contracts are the DAILY money game — three picks, reshuffled every day,
 * doable in any world. They answer "what shall I do in this race". They do
 * not answer "why should I buy the dampers", and they never make one world
 * feel different from the next.
 *
 * A feat is the other axis. It is PERMANENT (once per world, banked in the
 * career), it is FIXED to the world rather than rerolled, and every one of
 * them is gated behind a specific line of the garage at a specific level.
 * There is exactly one archetype per upgrade, which is the point: each thing
 * you can buy has worlds that ask for it by name, so the garage stops being a
 * flat "more is better" list and becomes a set of keys to specific doors.
 *
 * A locked feat is SHOWN, not hidden — seeing "GORGE LEAP · needs DAMPERS 2"
 * on a track you cannot yet beat is the whole mechanism. It turns the credit
 * you are saving into a named thing you are saving FOR.
 *
 * The pay is deliberately near a mid upgrade rung (upgradeCost(2) = 2600), so
 * clearing a world's pair funds roughly the next level of the thing that
 * unlocked them.
 */
/** What an unmet gate costs you HERE, in the words the chip prints. Kept
 *  beside the feats themselves so a new archetype cannot ship a padlock with
 *  nothing behind it. Mirrors Game.kitPenalties exactly. */
const LOCK_COST = {
  tires: 'GRIP −14%', cannon: 'GUN −45%', dampers: 'NO DAMPERS',
  nitro: 'NITRO −40%', armor: 'HULL −18%', engine: 'TOP END −6%',
  handling: 'GRIP −8%',
};

const TRACK_FEATS = [
  { id: 'leap', label: 'GORGE LEAP', icon: '🪂', need: { key: 'dampers', lvl: 2 }, pay: 420,
    desc: 'land 3 big airs and finish with the car in one piece',
    check: (g, ct) => ct.bigAirs >= 3 && g.deaths === 0 },
  { id: 'flatout', label: 'FLAT OUT', icon: '🔧', need: { key: 'engine', lvl: 3 }, pay: 460,
    desc: 'break 190 km/h on this circuit',
    check: (g, ct) => (ct.topKph ?? 0) >= 190 },
  { id: 'surefoot', label: 'SURE-FOOTED', icon: '🛞', need: { key: 'tires', lvl: 2 }, pay: 400,
    desc: 'take two laps without a scratch',
    check: (g, ct) => ct.cleanLaps >= 2 },
  { id: 'boostrun', label: 'BOOST RUN', icon: '⚡', need: { key: 'nitro', lvl: 2 }, pay: 380,
    desc: 'hold the boost for 6 seconds in one race',
    check: (g, ct) => (ct.boostHeld ?? 0) >= 6 },
  { id: 'ironhull', label: 'IRON HULL', icon: '🛡️', need: { key: 'armor', lvl: 2 }, pay: 400,
    desc: 'finish on the podium with most of the hull left',
    check: (g, ct, rank) => rank <= 3 && g.player.health >= g.player.maxHealth * 0.7 },
  { id: 'gunnery', label: 'GUNNERY', icon: '🔥', need: { key: 'cannon', lvl: 2 }, pay: 440,
    desc: 'wreck 3 rivals with the guns',
    check: (g, ct) => ct.rivalKills >= 3 },
  { id: 'onrails', label: 'ON RAILS', icon: '⚙️', need: { key: 'handling', lvl: 2 }, pay: 400,
    desc: 'finish without once dropping a wheel off the road',
    check: (g, ct) => !ct.leftRoad },
];

/** The two feats this world asks for — FIXED to the world, not rerolled.
 *  Seeded from the id alone so a track's pair is part of its identity and can
 *  be learned, printed on a card, and worked toward. */
function featsFor(levelId) {
  let s = ((levelId * 2654435761) ^ 0x9e3779b9) >>> 0;
  const rnd = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
  const arr = [...TRACK_FEATS];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (rnd() * (i + 1)) | 0;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, 2);
}

/* ==========================================================================
 * QUESTS — the layer above contracts, and the only thing in the game that
 * pays in PARTS.
 *
 * Asked for as "create quests or contracts that I have to race and achieve to
 * earn bonus credits or some upgrades".
 *
 * The distinction that makes this worth having as a SEPARATE system rather
 * than a fourth contract rung:
 *
 *   CONTRACTS are per-race, rerolled daily, and doable anywhere. They answer
 *   "what shall I do in this race" and pay credits.
 *   FEATS are fixed to a world, banked once, gated on a part. They answer
 *   "why this world" and pay credits.
 *   QUESTS span MANY races, persist in the career, and pay a free upgrade
 *   LEVEL. They answer "what am I working toward", and they are the first
 *   reward in the game that is not a number.
 *
 * A quest's `count` is how many qualifying races it needs; `test(g, rank)` is
 * asked once per finished race and returns the key it should count under, or
 * null. Counting by KEY rather than by tally is what stops "podium in three
 * ALPINE worlds" being satisfied by winning the same world three times.
 * ======================================================================== */
const QUESTS = [
  {
    id: 'licence-alpine', name: 'ALPINE LICENCE', icon: '🏔',
    desc: 'Podium in 3 different ALPINE PASSES worlds',
    count: 3, reward: { part: 'handling', cr: 1200 },
    test: (g, rank) => (rank <= 3 && g.level.region === 'ALPINE PASSES' ? `w${g.level.id}` : null),
  },
  {
    id: 'licence-circuit', name: 'CIRCUIT LICENCE', icon: '🏁',
    desc: 'Podium in 3 different GRAND CIRCUITS worlds',
    count: 3, reward: { part: 'engine', cr: 1200 },
    test: (g, rank) => (rank <= 3 && g.level.region === 'GRAND CIRCUITS' ? `w${g.level.id}` : null),
  },
  {
    id: 'rally-school', name: 'RALLY SCHOOL', icon: '🌲',
    desc: 'Podium on 3 different LOOSE or ICE stages',
    count: 3, reward: { part: 'tires', cr: 1400 },
    test: (g, rank) => (rank <= 3 && surfaceClass(g.level) > 0 ? `w${g.level.id}` : null),
  },
  {
    id: 'gunsmith', name: 'GUNSMITH', icon: '🔥',
    desc: 'Wreck 12 rivals with the guns, across any races',
    // The only quest that counts EVENTS rather than worlds, so its key is the
    // running total — which is exactly what makes a finite magazine matter.
    count: 12, reward: { part: 'magazine', cr: 900 },
    tally: (g) => g._ct?.rivalKills ?? 0,
  },
  {
    id: 'ironman', name: 'IRONMAN', icon: '🛡',
    desc: 'Finish 5 races in a row without ever being wrecked out',
    count: 5, reward: { part: 'armor', cr: 1600 }, streak: true,
    test: (g) => (g.raceOver ? false : `r${(g.career.questSeq = (g.career.questSeq ?? 0) + 1)}`),
  },
  {
    id: 'marque-zenith', name: 'ZENITH CONTRACT', icon: '⚙',
    desc: 'Win 3 different worlds in a ZENITH machine',
    count: 3, reward: { part: 'nitro', cr: 1500 },
    test: (g, rank) => {
      const car = CAR_CATALOG.find((c) => c.key === g.cars.selected);
      return rank === 1 && car?.spec?.brand === 'ZENITH' ? `w${g.level.id}` : null;
    },
  },
  {
    id: 'recovery', name: 'CLEAN HANDS', icon: '🆘',
    desc: 'Finish 4 different worlds without ever calling the SOS',
    count: 4, reward: { part: 'beacon', cr: 1000 },
    test: (g) => (g.player.sos >= g.player.maxSos ? `w${g.level.id}` : null),
  },
  {
    id: 'stuntman', name: 'STUNTMAN', icon: '🪂',
    desc: 'Land 20 big airs, across any races',
    count: 20, reward: { part: 'dampers', cr: 1100 },
    tally: (g) => g._ct?.bigAirs ?? 0,
  },
];

const CONTRACT_POOL = [
  { id: 'cleanlap', label: 'CLEAN LAP', desc: (n) => `${n} lap${n > 1 ? 's' : ''} without hull damage`,
    lap: true, rungs: [{ need: 1, pay: 100 }, { need: 2, pay: 220 }, { need: 3, pay: 400, hard: true }],
    check: (g, ct, rank, need) => ct.cleanLaps >= need,
    prog: (ct, need) => `${Math.min(ct.cleanLaps, need)}/${need}` },
  { id: 'untouch', label: 'UNTOUCHABLE', desc: () => 'finish without wrecking',
    atFinish: true, rungs: [{ pay: 120 }, { pay: 260 }, { pay: 420, hard: true }],
    check: (g) => g.deaths === 0 },
  // `sure: true` marks contracts any driver can complete by active play in any
  // world, whatever the race outcome — the offer always includes at least one.
  { id: 'demo', label: 'DEMOLITION', desc: (n) => `smash ${n} props`, sure: true,
    rungs: [{ need: 12, pay: 60 }, { need: 25, pay: 140 }, { need: 40, pay: 320, hard: true }],
    check: (g, ct, rank, need) => ct.props >= need,
    prog: (ct, need) => `${Math.min(ct.props, need)}/${need}` },
  { id: 'head', label: 'HEADHUNTER', desc: (n) => `destroy ${n} rivals`,
    rungs: [{ need: 2, pay: 90 }, { need: 3, pay: 200 }, { need: 4, pay: 380, hard: true }],
    check: (g, ct, rank, need) => ct.rivalKills >= need,
    prog: (ct, need) => `${Math.min(ct.rivalKills, need)}/${need}` },
  { id: 'combo', label: 'COMBO ARTIST', desc: (n) => `reach a ×${n} style combo`, sure: true,
    rungs: [{ need: 2.5, pay: 70 }, { need: 3.25, pay: 160 }, { need: 4, pay: 340, hard: true }],
    check: (g, ct, rank, need) => ct.comboMax >= need },
  { id: 'draft', label: 'DRAFT KING', desc: (n) => `${n} slipstream tucks`, sure: true,
    rungs: [{ need: 3, pay: 60 }, { need: 6, pay: 150 }, { need: 10, pay: 330, hard: true }],
    check: (g, ct, rank, need) => ct.drafts >= need,
    prog: (ct, need) => `${Math.min(ct.drafts, need)}/${need}` },
  { id: 'air', label: 'AIRBORNE', desc: (n) => `${n} BIG AIR jumps`,
    rungs: [{ need: 2, pay: 60 }, { need: 4, pay: 150 }, { need: 6, pay: 320, hard: true }],
    check: (g, ct, rank, need) => ct.bigAirs >= need,
    prog: (ct, need) => `${Math.min(ct.bigAirs, need)}/${need}` },
  { id: 'hardpod', label: 'PODIUM ON HARD', desc: (n) => `top ${n} on HARD`,
    gate: (g) => g.difficulty.id === 'hard', atFinish: true,
    rungs: [{ need: 3, pay: 150 }, { need: 2, pay: 300 }, { need: 1, pay: 480, hard: true }],
    check: (g, ct, rank, need) => rank <= need },
  { id: 'pacifist', label: 'PACIFIST', desc: (n) => `top ${n} with zero weapon fire`,
    atFinish: true, rungs: [{ need: 3, pay: 130 }, { need: 2, pay: 280 }, { need: 1, pay: 450, hard: true }],
    check: (g, ct, rank, need) => rank <= need && !ct.weaponFired },
  { id: 'start', label: 'FLAWLESS START', desc: () => 'lead at the end of lap 1',
    lap: true, rungs: [{ pay: 80 }, { pay: 180 }, { pay: 350, hard: true }] },
  { id: 'herd', label: 'HERDSMAN', desc: () => 'never hit livestock',
    gate: (g) => (g.herds?.length ?? 0) > 0, atFinish: true,
    rungs: [{ pay: 50 }, { pay: 120 }, { pay: 280, hard: true }],
    check: (g, ct) => ct.livestock === 0 },
  { id: 'shave', label: 'CLOSE SHAVE', desc: (n) => `${n} CLOSE CALL passes`,
    rungs: [{ need: 3, pay: 60 }, { need: 6, pay: 150 }, { need: 10, pay: 330, hard: true }],
    check: (g, ct, rank, need) => ct.closeCalls >= need,
    prog: (ct, need) => `${Math.min(ct.closeCalls, need)}/${need}` },
];

/* ==========================================================================
 * JOBS — the board you choose FROM, and the only objective in the game you
 * go SOMEWHERE to do.
 *
 * Asked for as "expand the jobs, and I can take a job and start driving it to
 * fulfil it". The second half is the whole feature: everything the game had
 * until now was handed to you for whatever world you happened to be standing
 * on. Contracts are dealt at the start line for the current world; quests tick
 * along behind whatever you were going to do anyway; feats are stapled to a
 * world you have to find first. None of them is a DECISION, because none of
 * them is refusable in advance and none of them sends you anywhere.
 *
 * A job is: a named world, a named objective, a named price, and a button that
 * takes you there. You hold ONE at a time — that is what makes taking it mean
 * something — and it stays taken until you finish it or drop it, so a failed
 * run is a retry rather than a lost offer.
 *
 * How a kind becomes an offer: `where` says which worlds it can be posted on,
 * `need` turns the world and a seeded roll into a target (or null to decline
 * the world), and `pay` prices it. The objective itself is checked by the
 * SAME `check`/`prog`/`atFinish`/`lap` contract the per-race contracts use, so
 * a job rides the existing per-frame bookkeeping and the existing HUD row
 * rather than growing a second copy of both.
 * ======================================================================== */
const JOB_POOL = [
  {
    id: 'haul', label: 'HAULAGE RUN', icon: '📦', base: 460,
    line: (n) => `finish inside the top ${n}`,
    need: (g, lv, rnd) => 2 + ((rnd() * 3) | 0),
    atFinish: true,
    check: (g, ct, rank, need) => rank > 0 && rank <= need,
  },
  {
    id: 'bounty', label: 'BOUNTY', icon: '🎯', base: 520,
    line: (n) => `destroy ${n} rivals`,
    need: (g, lv, rnd) => 2 + ((rnd() * 3) | 0),
    check: (g, ct, rank, need) => ct.rivalKills >= need,
    prog: (ct, need) => `${Math.min(ct.rivalKills, need)}/${need}`,
  },
  {
    id: 'scrap', label: 'SCRAP RUN', icon: '🔩', base: 380,
    line: (n) => `smash ${n} props`,
    need: (g, lv, rnd) => 20 + ((rnd() * 4) | 0) * 5,
    check: (g, ct, rank, need) => ct.props >= need,
    prog: (ct, need) => `${Math.min(ct.props, need)}/${need}`,
  },
  {
    // The only job whose target is YOUR OWN previous run, which is why it is
    // only ever posted on a world you have already raced: "beat 1:42.6" is a
    // number the player recognises, and "under 1:40" on a world they have
    // never seen is a number nobody can judge before accepting.
    id: 'pace', label: 'PACE NOTE', icon: '⏱', base: 700,
    line: (n) => `set a lap under ${fmtTime(n)}`,
    where: (g, lv) => (g.career.finished?.[lv.id]?.bestLap ?? 0) > 0,
    need: (g, lv) => {
      const best = g.career.finished?.[lv.id]?.bestLap ?? 0;
      return best > 0 ? Math.round(best * 0.985 * 10) / 10 : null;
    },
    atFinish: true,
    check: (g, ct, rank, need) => (g.player.bestLap ?? Infinity) <= need,
  },
  {
    id: 'nofire', label: 'NO-FIRE CONTRACT', icon: '🕊', base: 640,
    line: (n) => `top ${n}, and not one shot fired`,
    need: (g, lv, rnd) => 3 + ((rnd() * 2) | 0),
    atFinish: true,
    check: (g, ct, rank, need) => rank > 0 && rank <= need && !ct.weaponFired,
  },
  {
    id: 'iron', label: 'IRON RUN', icon: '🛡', base: 600,
    line: () => 'finish it without being wrecked once',
    atFinish: true,
    check: (g) => g.deaths === 0,
  },
  {
    id: 'solo', label: 'NO BEACON', icon: '🆘', base: 480,
    line: () => 'finish without calling the rescue',
    atFinish: true,
    check: (g) => (g.player.sos ?? 0) >= (g.player.maxSos ?? 1),
  },
  {
    id: 'reel', label: 'STUNT REEL', icon: '🪂', base: 440,
    line: (n) => `land ${n} big airs`,
    need: (g, lv, rnd) => 3 + ((rnd() * 3) | 0),
    check: (g, ct, rank, need) => ct.bigAirs >= need,
    prog: (ct, need) => `${Math.min(ct.bigAirs, need)}/${need}`,
  },
  {
    id: 'tuck', label: 'SLIPSTREAM JOB', icon: '💨', base: 400,
    line: (n) => `${n} slipstream tucks`,
    need: (g, lv, rnd) => 5 + ((rnd() * 4) | 0),
    check: (g, ct, rank, need) => ct.drafts >= need,
    prog: (ct, need) => `${Math.min(ct.drafts, need)}/${need}`,
  },
  {
    // Posted only where the surface actually punishes the wrong compound, and
    // the tyre bay is the whole point: it asks you to go and FIT something.
    id: 'boots', label: 'WRONG BOOTS', icon: '🛞', base: 900, part: 'tires',
    line: (n) => `top ${n} on road tyres — on this`,
    where: (g, lv) => surfaceClass(lv) > 0,
    need: (g, lv, rnd) => 4 + ((rnd() * 2) | 0),
    atFinish: true,
    check: (g, ct, rank, need) => rank > 0 && rank <= need && (g.fittedTyre?.(g.cars?.selected, g.level) ?? 1) === 0,
  },
  {
    id: 'sweep', label: 'CLEAN SWEEP', icon: '✨', base: 900, part: 'armor',
    line: () => 'win it, and take no hull damage at all',
    atFinish: true,
    check: (g, ct, rank) => rank === 1 && g.deaths === 0 && !ct.lapDamaged && ct.cleanLaps >= 1,
  },
  {
    // A marque job names the maker, so it is also the game telling you a
    // showroom exists — the one place the car shop is advertised by a job.
    id: 'marque', label: 'FACTORY DRIVE', icon: '⚙', base: 850, part: 'engine',
    line: (n, lv, j) => `win it in ${/^[AEIOU]/.test(j.brand || '') ? 'an' : 'a'} ${j.brand} machine`,
    where: (g) => CAR_CATALOG.some((c) => c.spec?.brand && g.cars?.owned?.includes?.(c.key)),
    extra: (g, lv, rnd) => {
      const brands = [...new Set(CAR_CATALOG
        .filter((c) => c.spec?.brand && g.cars?.owned?.includes?.(c.key))
        .map((c) => c.spec.brand))];
      return brands.length ? { brand: brands[(rnd() * brands.length) | 0] } : null;
    },
    atFinish: true,
    check: (g, ct, rank, need, j) => {
      const car = CAR_CATALOG.find((c) => c.key === g.cars.selected);
      return rank === 1 && car?.spec?.brand === j.brand;
    },
  },
];

/** Roman numerals for the three rungs, because "DEMOLITION II" reads as a
 *  standing at a glance and "DEMOLITION (rung 1)" does not. */
const RUNG_NUMERAL = ['I', 'II', 'III'];

/** Resolve a contract to the rung this player stands on, clamped to what the
 *  contract actually offers and to what the difficulty allows: a `hard` rung
 *  is not dealt on EASY or NORMAL, so the offer is always one the player in
 *  front of it can complete. */
function contractAtRung(c, level, difficulty) {
  let ix = Math.max(0, Math.min(c.rungs.length - 1, level | 0));
  while (ix > 0 && c.rungs[ix].hard && difficulty !== 'hard') ix--;
  const r = c.rungs[ix];
  return { ...c, rungIx: ix, need: r.need, pay: r.pay,
    label: `${c.label} ${RUNG_NUMERAL[ix] ?? ix + 1}`, done: false };
}

// which animals graze in which biome (a theme can override with T.livestock).
// Each pasture takes a LEAD species from its roster and the roster shifts from
// world to world; roughly a quarter of each herd is the next species along, so
// neither a field nor a world reads as a monoculture. Rosters are
// biome-plausible only — camels in the dunes, capybaras (never cows) in the
// Amazon, goats on the canyon ledges. Themes with no entry (volcano, neon,
// undercity) simply have no grazing herds.
const LIVESTOCK_BY_THEME = {
  forest:   { kinds: ['cow', 'sheep', 'boar'], perHerd: 4 },
  alpine:   { kinds: ['cow', 'sheep', 'ibex'], perHerd: 4 },
  pass:     { kinds: ['cow', 'ibex', 'sheep'], perHerd: 5 },
  tremola:  { kinds: ['sheep', 'ibex', 'cow'], perHerd: 4 },
  furka:    { kinds: ['ibex', 'sheep'],        perHerd: 3 },
  redwood:  { kinds: ['deer', 'boar'],         perHerd: 3 },
  wildfire: { kinds: ['deer', 'boar'],         perHerd: 2 },
  snow:     { kinds: ['deer', 'hare'],         perHerd: 3 },
  glacial:  { kinds: ['seal', 'hare'],         perHerd: 2 },
  sheetice: { kinds: ['seal'],                 perHerd: 2 },
  avalanche:{ kinds: ['ibex', 'hare'],         perHerd: 2 },
  desert:   { kinds: ['coyote', 'camel'],      perHerd: 3 },
  dunes:    { kinds: ['camel', 'coyote'],      perHerd: 3 },
  canyon:   { kinds: ['coyote', 'goat'],       perHerd: 3 },
  ravine:   { kinds: ['coyote', 'goat'],       perHerd: 2 },
  oasis:    { kinds: ['camel', 'goat', 'coyote'], perHerd: 3 },
  jungle:   { kinds: ['capybara', 'boar', 'deer'], perHerd: 3 },
  flume:    { kinds: ['deer', 'cow', 'boar'],  perHerd: 3 },
  // OLIVE COAST: sheep flocks behind wire on the terraces, and the wild boar
  // that is the region's authored crossing
  medterrace: { kinds: ['sheep', 'boar', 'goat'], perHerd: 5 },
  // FARMLAND: sheep and cattle in the fields behind the hedge, and nothing else
  farmland: { kinds: ['sheep', 'cow'],         perHerd: 5 },
  // OUTBACK RED DIRT: the Bible gives this region the HIGHEST authored
  // fauna rate in the game — roos first, emus running the fence line, and
  // unfenced station cattle near the homestead.
  outback:  { kinds: ['kangaroo', 'emu', 'cow'], perHerd: 5 },
};

// hazard particle tints (hoisted — per-frame spawns must not allocate)
const AVA_WHITE = new THREE.Color(0xf4faff);
const GEYSER_SAND = new THREE.Color(0xd8b878);

const loadJSON = (key, fallback) => {
  try { return { ...fallback, ...JSON.parse(localStorage.getItem(key) || '{}') }; }
  catch { return { ...fallback }; }
};
const saveJSON = (key, obj) => {
  try { localStorage.setItem(key, JSON.stringify(obj)); } catch { /* private mode */ }
  // any profile-scoped write marks the career dirty for the cloud row —
  // sync.js registers this hook; before it does, writes are just local
  if (key.startsWith('ir-p')) window.__igniteSyncDirty?.();
};

// ---- player profiles (local careers — several people share one device) ----
// Registry `ir-profiles`: { list: [{id, name, color, created}], active }.
// Per-player state (career / garage / cars) lives under ir-p<id>-* keys;
// device-wide settings (ir-steer / ir-assist / ir-diff) stay shared.
const PROFILE_KEYS = ['career', 'garage', 'cars'];
const PROFILE_COLORS = ['#ff8c1a', '#f2c81e', '#2440b8', '#4a9ad8', '#2f9e44', '#1c1a18']; // car livery hexes
const MAX_PROFILES = 6;
const CONFIRM_MS = 3000;          // how long a two-tap destructive button stays armed
const STARTER_CAR = 'brawler';    // the free machine every career begins with
const profileKey = (id, base) => `ir-p${id}-${base}`;
// PROFILE_KEYS is only the LEGACY adoption list (the un-namespaced keys an old
// build wrote). Wiping a profile must never use it: whatever key a future
// feature parks under the namespace has to die with the career too, so both
// reset and delete enumerate localStorage BY PREFIX instead of by name.
const profilePrefix = (id) => `ir-p${id}-`;
function profileStorageKeys(id) {
  const pre = profilePrefix(id), out = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(pre)) out.push(k);
    }
  } catch { /* private mode */ }
  return out;
}
/** Erase every stored byte belonging to one profile. The single wipe path. */
function wipeProfileData(id) {
  const keys = profileStorageKeys(id);
  try { for (const k of keys) localStorage.removeItem(k); } catch { /* private mode */ }
  return keys;
}
const sanitizeProfileName = (raw) =>
  String(raw ?? '').toUpperCase().replace(/[^A-Z0-9 \-]/g, '').replace(/\s+/g, ' ').trim().slice(0, 10);

function loadProfiles() {
  let reg = null;
  try { reg = JSON.parse(localStorage.getItem('ir-profiles') || 'null'); } catch { /* corrupt */ }
  if (!reg || !Array.isArray(reg.list) || !reg.list.length) {
    // first run on this device: profile 1 adopts whatever career already exists
    reg = { list: [{ id: 1, name: 'PLAYER 01', color: PROFILE_COLORS[0], created: Date.now() }], active: 1 };
  }
  if (!reg.list.some((p) => p.id === reg.active)) reg.active = reg.list[0].id;
  // adopt any un-namespaced legacy keys into the ACTIVE profile (first boot,
  // or data written by an old build) — nobody loses their career, ever
  try {
    for (const base of PROFILE_KEYS) {
      const legacy = localStorage.getItem(`ir-${base}`);
      if (legacy !== null) {
        localStorage.setItem(profileKey(reg.active, base), legacy);
        localStorage.removeItem(`ir-${base}`);
      }
    }
    saveJSON('ir-profiles', reg);
  } catch { /* private mode */ }
  return reg;
}

// ===== [MISSIONS] arena-mission constants (missions-design) =====
// Payouts sit in the SAME BAND as a race contract (40–150 CR) and never above
// it: a gold medal (130) is worth a bit more than a 3rd-place podium (60) and
// a bit less than a win (200). Missions are two-minute skill snacks, not a
// credit farm — no score→credit conversion, medal money only, and a repeat run
// pays the same flat medal price so grinding one mission beats nothing.
// Medal index: 0 none, 1 bronze, 2 silver, 3 gold.
const MISSION_CR = [0, 40, 80, 130];
// seconds out of contact before a SURVIVOR gunship repositions into your path
const REDEPLOY_T = 2.5;
const MISSION_MEDAL = ['—', '🥉', '🥈', '🥇'];
const MISSION_MEDAL_WORD = ['NO MEDAL', '🥉 BRONZE', '🥈 SILVER', '🥇 GOLD'];
/** One line of medal targets, phrased for the mission's shape: race missions
 *  want a time BELOW the target, endurance missions want one ABOVE it. */
const missionTargetLine = (d) => (d.survive
  ? `🥇 ${fmtTime(d.gold)}+ · 🥈 ${fmtTime(d.silver)}+ · 🥉 ${fmtTime(d.bronze)}+ SURVIVED`
  : `🥇 ${fmtTime(d.gold)} · 🥈 ${fmtTime(d.silver)} · 🥉 ANY FINISH`);
// Same targets, but as separate chunks the card can lay out without breaking a
// time in half or orphaning "CR" onto its own line.
const missionTargetChips = (d) => (d.survive
  ? [`🥇 ${fmtTime(d.gold)}+`, `🥈 ${fmtTime(d.silver)}+`, `🥉 ${fmtTime(d.bronze)}+`]
  : [`🥇 ${fmtTime(d.gold)}`, `🥈 ${fmtTime(d.silver)}`, `🥉 FINISH`]);
// scratch for the knocked-rock roller — a per-frame path must not allocate
const _rollQ = new THREE.Quaternion();
const _rollM = new THREE.Matrix4();
const _rollS = new THREE.Vector3();

// ===== end [MISSIONS] constants =====

// ---------------------------------------------------------------------------
// WHICH CAR FOR WHICH WORLD
//
// The worlds already reward different machines — that falls out of the physics,
// it is not a label bolted on top. Measured with a fixed autopilot at a fixed
// timestep, one lap, every car:
//
//   FROST PEAK (snow)   DUNE 39.1s ... BRAWLER 47.1s   — 8 seconds
//   LOG FLUME (dry)     CROWN 31.9s ... SLEEK   34.0s   — and DUNE is 5th
//   AMAZON RAPIDS (wet) DUNE 34.9s ... BRAWLER 40.7s
//
// Six different orderings across eight worlds. What was missing was any way for
// a player to KNOW that before buying, so the garage read as "bigger numbers are
// better" instead of "the right tool for the stage".
//
// DEMANDS below are measured from each track's own geometry (mean curvature,
// straight fraction, mean gradient) and its surface. tests/test-affinity.mjs
// recomputes them from the live tracks and fails if this table has drifted, so
// it cannot quietly become fiction.
// The normalisation bounds live here, and the test reads them off `window` —
// two copies of these numbers is exactly how a table starts lying. The gradient
// range was re-derived after the crest work raised every world's mean grade.
const DEMAND_BOUNDS = { twist: [0.0059, 0.0206], fast: [12.4, 47.4], climb: [2.8, 6.8] };
const DEMANDS = {
  1:  { loose: 0.55, twist: 0.46, fast: 0.17, climb: 0.33 }, // PINE VALLEY
  2:  { loose: 0.12, twist: 0.04, fast: 0.53, climb: 0.62 }, // DUST CANYON
  3:  { loose: 1.00, twist: 0.76, fast: 0.25, climb: 0.74 }, // FROST PEAK
  4:  { loose: 0.12, twist: 0.75, fast: 0.00, climb: 0.12 }, // CANYON RUN
  5:  { loose: 0.12, twist: 0.30, fast: 0.18, climb: 0.71 }, // EMBER PASS
  6:  { loose: 0.12, twist: 0.46, fast: 0.71, climb: 0.59 }, // SUMMIT CLIMB
  7:  { loose: 1.00, twist: 0.53, fast: 0.20, climb: 0.42 }, // GLACIAL PASS
  8:  { loose: 0.55, twist: 0.64, fast: 0.16, climb: 0.29 }, // AMAZON RAPIDS
  9:  { loose: 0.12, twist: 0.26, fast: 0.14, climb: 0.61 }, // THE DUNE SERPENT
  10: { loose: 0.12, twist: 1.00, fast: 0.10, climb: 0.05 }, // ROCKFALL RAVINE
  11: { loose: 0.12, twist: 0.35, fast: 0.19, climb: 0.19 }, // OASIS AMBUSH
  12: { loose: 0.12, twist: 0.22, fast: 0.20, climb: 0.95 }, // REDWOOD RAMPAGE
  13: { loose: 0.12, twist: 0.00, fast: 1.00, climb: 0.45 }, // LOG FLUME FURY
  14: { loose: 0.12, twist: 0.26, fast: 0.25, climb: 0.50 }, // FOREST FIRE ESCAPE
  15: { loose: 1.00, twist: 0.52, fast: 0.07, climb: 0.37 }, // GLACIER'S GRIND
  16: { loose: 1.00, twist: 0.37, fast: 0.25, climb: 0.22 }, // AVALANCHE ALLEY
  17: { loose: 0.55, twist: 0.00, fast: 0.70, climb: 0.32 }, // NEON GRID
  18: { loose: 0.12, twist: 0.78, fast: 0.10, climb: 0.00 }, // UNDERCITY
  19: { loose: 0.12, twist: 0.85, fast: 0.40, climb: 0.44 }, // GOTTHARD CLIMB
  20: { loose: 0.12, twist: 0.81, fast: 0.46, climb: 0.56 }, // TREMOLA DESCENT
  21: { loose: 1.00, twist: 0.64, fast: 0.62, climb: 0.35 }, // FURKA RIDGE
  // ---- WORLD RALLY. `twist` and `climb` are MEASURED on the same geometry
  // formula the original table used — validated by reproducing all 21 published
  // values above to within 0.02 twist / 0.12 climb before it was trusted here.
  // `fast` could NOT be reproduced that way, so it is assigned from the share
  // of the lap running above a 120 u radius, which rank-orders against the
  // published values at Spearman 0.65 — directionally right, not exact.
  22: { loose: 0.12, twist: 0.73, fast: 0.35, climb: 0.66 }, // COL DE TURINI
  23: { loose: 0.55, twist: 0.00, fast: 0.95, climb: 0.90 }, // OUNINPOHJA
  24: { loose: 0.12, twist: 0.52, fast: 0.34, climb: 0.80 }, // FAFE LEAP
  // PIKES PEAK's `twist` is RE-MEASURED, because its road changed. It used to
  // be COL DE TURINI's switchback stack with two numbers moved, and the two
  // cards read the same TWISTY · STEEP because the two roads were the same —
  // 52% of Turini's lap sat inside Pikes' carriageway. r210b re-authored it
  // into two bursts of corners at different scales; measured on the new
  // geometry with the same expression this table's other rows use, twist is
  // 0.55, which is under WORLD_TRAITS' 0.6 line, so the card now reads
  // FAST · STEEP and stops impersonating its neighbour. Only `twist` is taken
  // from that measurement — `fast` for this block is assigned by the different
  // method the comment above describes, so it is left alone.
  25: { loose: 0.12, twist: 0.55, fast: 0.32, climb: 1.00 }, // PIKES PEAK
  26: { loose: 0.12, twist: 0.00, fast: 0.88, climb: 0.35 }, // SAFARI PLAINS
  27: { loose: 0.12, twist: 0.88, fast: 0.06, climb: 0.48 }, // CORNICHE
  28: { loose: 0.55, twist: 0.09, fast: 0.78, climb: 0.69 }, // ESTONIA CRESTS
  // MEDITERRANEAN. twist / fast / climb are read off the built world with the
  // same expression tests/test-affinity.mjs uses, so this row is measured, not
  // assigned. `loose` is 0.12: dry tarmac.
  29: { loose: 0.12, twist: 0.24, fast: 0.57, climb: 0.63 }, // OLIVE COAST
  // ---- OLD TOWN. Measured on the live geometry with the same formula the
  // test uses (kMean 0.01459, 29.2 % straight, mean grade 5.06 %), not
  // estimated: a street grid of hard corners joined by short straights, on a
  // hill, on a wet surface.
  30: { loose: 0.55, twist: 0.59, fast: 0.48, climb: 0.57 }, // LANTERN QUARTER
  // ---- FARMLAND. twist / fast / climb MEASURED off the built track with the
  // same formula test-affinity.mjs uses, then rounded to 2 dp.
  31: { loose: 0.55, twist: 0.59, fast: 0.22, climb: 0.75 }, // HEDGEROW DASH
  // measured on the built track by the same formulae as the World Rally block
  32: { loose: 0.12, twist: 0.00, fast: 1.00, climb: 0.71 }, // RED CENTRE RUN
  // ---- GRAND CIRCUITS. ESTIMATED from each layout's character (surface from
  // the theme, twist/fast from the traced geometry), not yet measured — the
  // measured convention needs a built world per row and there are twelve.
  // If test-affinity reports measured values for these ids, adopt them.
  33: { loose: 0.12, twist: 0.30, fast: 0.72, climb: 0.45 }, // RED BULL RING
  34: { loose: 0.12, twist: 0.85, fast: 0.15, climb: 0.35 }, // MONACO STREETS
  35: { loose: 0.55, twist: 0.35, fast: 0.80, climb: 0.10 }, // SILVERSTONE
  36: { loose: 0.55, twist: 0.45, fast: 0.65, climb: 0.50 }, // SPA-FRANCORCHAMPS
  37: { loose: 0.12, twist: 0.70, fast: 0.45, climb: 0.30 }, // SUZUKA
  38: { loose: 0.55, twist: 0.60, fast: 0.55, climb: 0.55 }, // NORDSCHLEIFE
  39: { loose: 0.12, twist: 0.25, fast: 0.95, climb: 0.08 }, // MONZA
  40: { loose: 0.12, twist: 0.65, fast: 0.50, climb: 0.05 }, // MARINA BAY
  41: { loose: 0.12, twist: 0.55, fast: 0.70, climb: 0.65 }, // MOUNT PANORAMA
  42: { loose: 0.55, twist: 0.75, fast: 0.25, climb: 0.20 }, // RALLYCROSS ARENA
  43: { loose: 0.55, twist: 0.55, fast: 0.50, climb: 0.30 }, // OULTON PARK
  44: { loose: 0.12, twist: 0.60, fast: 0.55, climb: 0.55 }, // LAGUNA SECA
  45: { loose: 0.10, twist: 0.95, fast: 0.15, climb: 0.60 }, // TOUR DE CORSE
  46: { loose: 0.25, twist: 0.70, fast: 0.35, climb: 0.20 }, // VINEYARD VELOCE
  47: { loose: 0.45, twist: 0.60, fast: 0.40, climb: 0.25 }, // DEEPWOOD TRAIL
  48: { loose: 0.60, twist: 0.75, fast: 0.30, climb: 0.65 }, // DOLOMITI CORSA
  49: { loose: 0.15, twist: 0.55, fast: 0.50, climb: 0.10 }, // HARBOR QUAY
  // THE MEDITERRANEAN FIVE. Estimates from each route's own geometry, not
  // measured laps: corniche shelves are fast and twisty and barely climb, the
  // island is tighter, the Brava's seafront straight makes it the fastest.
  50: { loose: 0.20, twist: 0.62, fast: 0.48, climb: 0.30 }, // CINQUE TERRE
  51: { loose: 0.28, twist: 0.58, fast: 0.45, climb: 0.18 }, // AEGEAN BLUE
  52: { loose: 0.22, twist: 0.50, fast: 0.62, climb: 0.20 }, // COSTA BRAVA
  53: { loose: 0.24, twist: 0.55, fast: 0.52, climb: 0.16 }, // DALMATIA DRIVE
  54: { loose: 0.18, twist: 0.60, fast: 0.55, climb: 0.24 }, // COTE D AZUR
  55: { loose: 0.22, twist: 0.64, fast: 0.44, climb: 0.20 }, // BRIDGE RUN
  56: { loose: 0.24, twist: 0.58, fast: 0.50, climb: 0.26 }, // OLIVE CROSSING
  57: { loose: 0.20, twist: 0.70, fast: 0.38, climb: 0.34 }, // MOUNTAIN TO SEA
  // shares the Aegean lap, so it inherits its demands
  58: { loose: 0.28, twist: 0.58, fast: 0.45, climb: 0.18 }, // CITADEL BAY
};
// The short human-readable character of each world, from the same measurements.
const WORLD_TRAITS = (id) => {
  const d = DEMANDS[id];
  if (!d) return [];
  const out = [];
  if (d.loose >= 0.9) out.push('❄ LOOSE');
  else if (d.loose >= 0.4) out.push('💧 SLICK');
  if (d.twist >= 0.6) out.push('↩ TWISTY');
  else if (d.fast >= 0.6) out.push('➔ FAST');
  if (d.climb >= 0.6) out.push('⛰ STEEP');
  return out;
};

/** How fast this machine can theoretically get round this track.
 *
 *  NOT a simulated lap. I tried that first and it was worthless: two different
 *  autopilots produced opposite rankings on the same world — one put the DUNE
 *  first at FROST PEAK, the other put it last — because a crude driver's lap
 *  time measures the driver, not the car. Baking either would have been baking
 *  noise and calling it advice.
 *
 *  This instead walks the real centreline and, at each sample, takes the lowest
 *  of the three limits the physics actually imposes, using that car's own
 *  constants:
 *
 *    vCap    the slope-aware speed ceiling  (vehicles.js: GRADE / DOWNHILL_CAP)
 *    vYaw    steering authority vs the corner's curvature
 *    vGrip   the speed at which the sustained slide (v²k/grip) still fits
 *            inside the road — this is where the car's grip and the surface,
 *            including its OFF-ROAD recovery, actually bite
 *
 *  Then sums ds / v. No driver, no randomness, same answer every time, and
 *  every term traceable to a line of the integrator. Acceleration is a
 *  transient and is deliberately not modelled here.
 */
function paceEstimate(car, track) {
  if (!car?.stats || !track?.center) return null;
  const S = car.stats;
  const GRADE = 16, DOWNHILL_CAP = 1.18, SLIDE = 4.0;
  const surf = track.T?.surface;
  const base = surf === 'snow' ? 0.55 : surf === 'wet' ? 0.78 : 1;
  const gripEff = S.grip * (base + (1 - base) * 0.62 * S.offroad);
  const steerRate = 2.7, steerTaper = 0.26;
  const N = track.N;
  let t = 0, len = 0;
  const wrap = (a) => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };
  for (let i = 0; i < N; i += 2) {
    const a = track.center[i], c = track.center[(i + 2) % N];
    const ds = Math.hypot(c.x - a.x, c.z - a.z) || 1;
    const k = Math.abs(wrap(track.headingAt((i + 2) % N) - track.headingAt(i))) / ds;
    const slope = (c.y - a.y) / ds;
    let vCap = S.maxSpeed;
    if (slope > 0) vCap = Math.max(S.maxSpeed * 0.55, S.maxSpeed - (GRADE * slope) / 0.55);
    else if (slope < 0) vCap = Math.min(S.maxSpeed * DOWNHILL_CAP, S.maxSpeed + (GRADE * -slope) / 0.55);
    // steering authority: yaw available must out-turn v*k (taper ignored here —
    // it only bites near top speed, where the corner limit already dominates)
    const vYaw = k > 1e-5 ? steerRate * (1 - steerTaper) / k : Infinity;
    const vGrip = k > 1e-5 ? Math.sqrt(SLIDE * gripEff / k) : Infinity;
    const v = Math.max(4, Math.min(vCap, vYaw, vGrip));
    t += ds / v;
    len += ds;
  }
  return { seconds: t, length: len, gripEff: +gripEff.toFixed(2) };
}

/** WHY this machine is quick or slow HERE, in one phrase, per car.
 *
 *  The blurb used to be a pure function of (tier, surface), so with six cars
 *  and three tiers duplicates were not a risk, they were arithmetic: measured
 *  across seven worlds, EVERY ONE showed a repeat, and the worst had three
 *  distinct sentences for six cars — OLIVE COAST told four different machines
 *  "OFF THE PACE — 1s A LAP". A garage that says the same thing about half its
 *  stock is not telling you anything about any of it.
 *
 *  The replacement is a sensitivity measurement, not a hand-written rule. For
 *  each lever, re-run the SAME pace model with that one stat nudged and see
 *  what the lap does:
 *
 *    reward[lever]  averaged over the field, how many seconds this TRACK pays
 *                   for that stat — a flat circuit pays for top end, a
 *                   switchback pays for grip, and this measures which
 *    edge[lever]    how far THIS car sits from the field on that stat
 *
 *  reward x edge is then "how much this car's own character explains its lap
 *  time here", signed. The most positive term is why it is fast; the most
 *  negative is why it is slow. Nothing is asserted about a car — the model
 *  that ranks them is the same model that explains them, so the two can never
 *  drift apart.
 */
const LEVER_NUDGE = { maxSpeed: 1.10, grip: 1.10, offroad: 1.25, accel: 1.10 };
// TWO WAYS TO SAY EACH THING, because on a DRY world the roster has only two
// live levers: `offroad` multiplies into gripEff through (1 - base), and on dry
// tarmac base is 1, so its sensitivity is exactly zero and it drops out — as
// does `accel`, which the pace model does not attempt to represent at all.
// One phrase per lever per polarity therefore left four sentences for six
// cars on half the roster, and two machines a lap fell through to the generic
// fallback. A second wording per polarity is not padding: it is what makes the
// supply of phrases exceed the number of cars in the worst real case.
//
// A THIRD WORDING, because the roster grew to eight. The note above sized this
// table at two phrases per lever per polarity for SIX cars; adding the 911 and
// the CAYENNE pushed the generic fallback to 6 of 40 cells (15 %) against a
// 10 % ceiling, and left a four-star ALPINE captioned with a weakness on RED
// CENTRE RUN because every positive phrase above it was already spoken for.
// The supply of phrases has to exceed the number of cars in the worst real
// case, so it grows with the garage — the alternative is loosening a test that
// is telling the truth.
//
// { plus: [primary, secondary, third], minus: [primary, secondary, third] }
const LEVER_PHRASE = {
  maxSpeed: {
    plus: ['USES ALL OF ITS TOP END', 'STRONG DOWN THE LONG STRAIGHTS',
      'KEEPS PULLING WHERE OTHERS STOP'],
    minus: ['GIVING IT AWAY ON THE STRAIGHTS', 'SHORT ON TOP END FOR THIS ONE',
      'OUT OF LEGS BEFORE THE BRAKING'],
  },
  grip: {
    plus: ['PLANTED THROUGH THE CORNERS', 'CARRIES SPEED THROUGH THE TURNS',
      'STAYS TIED DOWN MID-CORNER'],
    minus: ['RUNS OUT OF GRIP IN THE TURNS', 'WASHES WIDE ON THE FAST BENDS',
      'PUSHES ON AT EVERY APEX'],
  },
  accel: {
    plus: ['FIRES OUT OF THE SLOW CORNERS', 'QUICK TO REBUILD ITS SPEED',
      'LEAPS OFF THE SLOW STUFF'],
    minus: ['SLOW TO WIND BACK UP', 'LABOURS OUT OF THE HAIRPINS',
      'TAKES AN AGE TO GET GOING'],
  },
  offroad: {
    snow: { plus: ['HOLDS THE LOOSE STUFF', 'FINDS GRIP IN THE SNOW',
      'DIGS IN WHERE IT IS SLIPPERY'],
    minus: ['SPINS UP ON THE LOOSE', 'LOSES THE REAR ON SNOW',
      'SCRABBLES ON THE PACKED SNOW'] },
    wet: { plus: ['SURE-FOOTED IN THE WET', 'CONFIDENT ON A WET LINE',
      'READS THE STANDING WATER WELL'],
    minus: ['SLIDES ON THE WET STUFF', 'NERVOUS ON A WET LINE',
      'SKATES ONCE THE ROAD IS WET'] },
    dry: { plus: ['SETTLED OVER THE ROUGH', 'SHRUGS OFF THE BROKEN STUFF',
      'SOAKS UP THE RUTS AND STONES'],
    minus: ['UNSETTLED OVER THE ROUGH', 'UPSET BY THE BROKEN STUFF',
      'CRASHES THROUGH THE RUTS'] },
  },
};
const LEVERS = ['maxSpeed', 'grip', 'accel', 'offroad'];

/** Rank every machine on the CURRENT track by that estimate, and phrase the
 *  result. Relative, because the absolute number means nothing to a player. */
function rateCarsFor(track) {
  const rows = CAR_CATALOG.map((car) => ({ car, est: paceEstimate(car, track) }))
    .filter((r) => r.est);
  if (!rows.length) return new Map();
  const best = Math.min(...rows.map((r) => r.est.seconds));
  const worst = Math.max(...rows.map((r) => r.est.seconds));
  const span = Math.max(1e-6, worst - best);
  const surf = track.T?.surface;
  const dryish = surf === 'snow' || surf === 'wet' ? surf : 'dry';

  // --- how many seconds does THIS TRACK pay for each stat? ---
  // Measured by nudging one stat at a time and re-running the lap. `accel` is
  // deliberately included even though paceEstimate does not model it: the
  // sensitivity comes back as exactly zero, which correctly removes it from
  // contention rather than letting a phrase be picked for a reason the model
  // cannot see.
  const sens = new Map();
  for (const r of rows) {
    const s = {};
    for (const lever of LEVERS) {
      const stats = { ...r.car.stats, [lever]: r.car.stats[lever] * LEVER_NUDGE[lever] };
      if (lever === 'offroad') stats.offroad = Math.min(1, stats.offroad);
      s[lever] = r.est.seconds - (paceEstimate({ stats }, track)?.seconds ?? r.est.seconds);
    }
    sens.set(r.car.key, s);
  }
  const reward = {};
  for (const lever of LEVERS) {
    reward[lever] = rows.reduce((a, r) => a + sens.get(r.car.key)[lever], 0) / rows.length;
  }
  // --- and how far does each car sit from the field on that stat? ---
  const edge = new Map();
  for (const lever of LEVERS) {
    const vals = rows.map((r) => r.car.stats[lever] ?? 0);
    const mean = vals.reduce((a, v) => a + v, 0) / vals.length;
    const spread = Math.max(1e-6, Math.max(...vals) - Math.min(...vals));
    rows.forEach((r, i) => {
      const e = edge.get(r.car.key) ?? {};
      e[lever] = (vals[i] - mean) / spread;
      edge.set(r.car.key, e);
    });
  }

  const out = new Map();
  // Assign in RANK ORDER and never reuse a phrase: the quickest car gets first
  // claim on the reason it is quickest, and a car further down that shares the
  // same headline falls through to its next-strongest term. That is what makes
  // uniqueness a property of the output rather than a hope about the inputs.
  const taken = new Set();
  const ranked = [...rows].sort((a, c) => a.est.seconds - c.est.seconds);
  for (const r of ranked) {
    const score = 1 - (r.est.seconds - best) / span;      // 1 = quickest here
    const tier = score >= 0.66 ? 'strong' : score >= 0.3 ? 'fair' : 'weak';
    const behind = r.est.seconds - best;
    const e = edge.get(r.car.key);
    // positive term = a strength worth naming, negative = a weakness
    const terms = LEVERS
      .map((lever) => ({ lever, v: reward[lever] * e[lever] }))
      .filter((t) => Math.abs(t.v) > 1e-9);
    // A leading car is explained by what it HAS; a trailing one by what it
    // LACKS. Polarity is forced by tier rather than merely preferred: without
    // that, a four-star machine whose positive phrases had all been claimed by
    // the cars above it was handed the leftover NEGATIVE one, and PIT-99 sat
    // second quickest on RED CENTRE RUN under the caption "RUNS OUT OF GRIP IN
    // THE TURNS". A mid-pack car takes whichever term is larger either way.
    //
    // ...and polarity is forced by STARS, not by `tier`, because stars are
    // what the player sees and what the rule is written in. The two disagree
    // at their boundaries: `stars = 1 + round(score * 4)` reaches four at
    // score 0.625 while `tier` only reaches 'strong' at 0.66, so a car in that
    // band showed FOUR STARS while the picker treated it as mid-pack and
    // handed it a leftover weakness — measured, a 4-star ALPINE captioned
    // "GIVING IT AWAY ON THE STRAIGHTS" on RED CENTRE RUN. The same gap exists
    // at the bottom (2 stars from 0.375, 'weak' only below 0.3). Deriving the
    // sign from stars closes both by construction rather than by tuning two
    // thresholds to agree.
    const starCount = 1 + Math.round(score * 4);
    const want = starCount >= 4 ? 1 : starCount <= 2 ? -1 : 0;
    terms.sort((a, c) => (want === 0 ? Math.abs(c.v) - Math.abs(a.v) : (c.v - a.v) * want));
    let note = null, polarity = 0, why = null;
    for (const t of terms) {
      if (want && Math.sign(t.v) !== want) continue;          // never miscaption a tier
      const set = t.lever === 'offroad' ? LEVER_PHRASE.offroad[dryish] : LEVER_PHRASE[t.lever];
      // primary wording first, then the alternate for the next car that lands
      // on the same lever and polarity
      for (const phrase of set[t.v >= 0 ? 'plus' : 'minus']) {
        if (taken.has(phrase)) continue;
        taken.add(phrase);
        note = phrase;
        polarity = t.v >= 0 ? 1 : -1;
        why = t.lever;
        break;
      }
      if (note) break;
    }
    // Last resort when a car has no term of the right sign left. Kept vague on
    // purpose — inventing a reason here would be the one thing this whole
    // function exists to avoid.
    if (!note) note = behind < 0.05 ? 'THE ONE TO BEAT' : 'MIDFIELD HERE';
    if (behind >= 0.5) note += ` · ${behind.toFixed(behind < 10 ? 1 : 0)}s OFF`;
    // `polarity` and `why` are not used by the UI — they are what lets
    // tests/test-cars.mjs assert that a four-star machine is never captioned
    // with a weakness, without the test having to keep its own copy of the
    // phrase table and drift out of step with this one.
    out.set(r.car.key, { score, tier, note, seconds: r.est.seconds,
      stars: starCount, behind, polarity, why });
  }
  return out;
}

/** A pickup that LOOKS LIKE WHAT IT GIVES YOU.
 *
 *  Every pickup used to be the same glowing ball in a different colour, so the
 *  only way to know what you were about to drive through was to have memorised
 *  a palette — at 200 km/h, from behind, in a world that is itself orange or
 *  green. Now each one is a small readable object: a missile is a missile, a
 *  mine is a spiked ball, hull is a medical cross.
 *
 *  Kept deliberately chunky and low-poly to match the toy-box art, and still
 *  fully emissive so the silhouette reads at distance exactly like the orb did.
 */
function buildPickupIcon(type, color) {
  const g = new THREE.Group();
  // An orb was one small facet, so 1.6 emissive read as "glowing". These shapes
  // carry far more surface, and at 1.6 the bloom washed every one of them to
  // white — a white cross and a white hexagon are not colour-coded any more.
  // Base faces glow enough to read at distance; only accents go hot.
  const mat = (c = color, emissive = 0.95) => new THREE.MeshStandardMaterial({
    color: c, emissive: c, emissiveIntensity: emissive, metalness: 0.3, roughness: 0.25,
  });
  const dark = new THREE.Color(color).multiplyScalar(0.45).getHex();
  const add = (geo, m, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => {
    const mesh = new THREE.Mesh(geo, m);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    g.add(mesh);
    return mesh;
  };

  if (type === 'missile') {
    // body + nose cone + three tail fins, tipped nose-up so it reads in profile
    const body = mat();
    add(new THREE.CylinderGeometry(0.26, 0.26, 1.15, 8), body);
    add(new THREE.ConeGeometry(0.26, 0.5, 8), mat(0xfff0c0, 1.5), 0, 0.82, 0);
    const fin = new THREE.BoxGeometry(0.06, 0.36, 0.34);
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      add(fin, mat(dark, 1.1), Math.cos(a) * 0.22, -0.5, Math.sin(a) * 0.22, 0, -a, 0);
    }
    g.rotation.z = 0.28;
  } else if (type === 'health') {
    // a fat medical cross — the one shape nobody has to be taught
    const arm = new THREE.BoxGeometry(1.5, 0.5, 0.42);
    add(arm, mat());
    add(new THREE.BoxGeometry(0.5, 1.5, 0.42), mat());
    add(new THREE.BoxGeometry(1.62, 0.62, 0.3), mat(0xffffff, 0.35), 0, 0, -0.09);
  } else if (type === 'nitro') {
    // a gas bottle: cylinder, shoulder, valve — plus a bolt down its face
    add(new THREE.CylinderGeometry(0.42, 0.42, 1.05, 10), mat());
    add(new THREE.SphereGeometry(0.42, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat(), 0, 0.52, 0);
    add(new THREE.CylinderGeometry(0.13, 0.13, 0.34, 6), mat(dark, 1.0), 0, 0.95, 0);
    const bolt = mat(0xfff6d0, 1.7);
    add(new THREE.BoxGeometry(0.16, 0.5, 0.1), bolt, -0.08, 0.16, 0.4, 0, 0, 0.5);
    add(new THREE.BoxGeometry(0.16, 0.5, 0.1), bolt, 0.08, -0.2, 0.4, 0, 0, 0.5);
  } else if (type === 'mine') {
    // spiked ball — the universal "do not touch, but also: take me"
    add(new THREE.IcosahedronGeometry(0.5, 0), mat());
    const spike = new THREE.ConeGeometry(0.14, 0.42, 5);
    const dirs = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
    for (const [x, y, z] of dirs) {
      const m = add(spike, mat(dark, 1.2), x * 0.62, y * 0.62, z * 0.62);
      m.lookAt(new THREE.Vector3(x * 3, y * 3, z * 3));
      m.rotateX(Math.PI / 2);
    }
  } else if (type === 'shield') {
    // a heater shield: a hexagonal plate with a raised boss, standing upright
    add(new THREE.CylinderGeometry(0.78, 0.78, 0.18, 6), mat(), 0, 0, 0, Math.PI / 2, 0, 0);
    add(new THREE.CylinderGeometry(0.5, 0.5, 0.26, 6), mat(dark, 0.55), 0, 0, 0.1, Math.PI / 2, 0, 0);
    add(new THREE.SphereGeometry(0.2, 8, 6), mat(0xffffff, 1.4), 0, 0, 0.24);
  } else {
    // slowfield: a six-point frost star
    const spar = new THREE.BoxGeometry(1.7, 0.16, 0.16);
    for (let i = 0; i < 3; i++) add(spar, mat(), 0, 0, 0, 0, 0, (i / 3) * Math.PI);
    add(new THREE.IcosahedronGeometry(0.3, 0), mat(0xffffff, 1.2));
  }
  return g;
}

class Game {
  constructor() {
    this.isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
    if (this.isTouch) document.body.classList.add('touch');
    // Published for the HUD and the suites: hud.js cannot import from main.js
    // (main.js imports hud.js), so the rule travels on the game object rather
    // than being written down a second time.
    this.hullLives = HULL_LIVES;
    this.fieldSize = FIELD;

    // level selection via URL (?level=N), with ?go=1 for seamless chained starts
    const params = new URLSearchParams(location.search);
    // ?level= is a world ID, not a position in the array. Those were the same
    // number until ROCKFALL RAVINE moved in the career order; resolving by id
    // keeps every existing link, bookmark and test URL pointing at the world it
    // has always meant. Falls back to a positional read for anything unmatched.
    const wantLv = parseInt(params.get('level')) || 1;
    const byId = LEVELS.findIndex((l) => l.id === wantLv);
    this.levelIndex = byId >= 0 ? byId
      : Math.min(Math.max(wantLv - 1, 0), LEVELS.length - 1);
    this.level = LEVELS[this.levelIndex];
    this.autoStart = params.get('go') === '1';
    // ?seed=N forces a specific world build. A bug report that carries a seed
    // is a bug report anyone can reproduce, which is the whole point of making
    // generation deterministic in the first place.
    const wantSeed = parseInt(params.get('seed'), 10);
    this._seedOverride = Number.isFinite(wantSeed) ? wantSeed >>> 0 : null;

    // progression + difficulty + garage (persisted PER PROFILE — several
    // players keep separate careers on one device; settings stay shared)
    this.profiles = loadProfiles();
    this.sync = new SyncService(this);
    // boot: converge with the cloud row if this profile has one. Async and
    // quiet — offline or unconfigured costs nothing, localStorage remains the
    // device's source of truth.
    setTimeout(() => this.sync.pullMerge(), 1500);
    this._loadProfileState();
    // mode comes from the URL only — a fresh visit ALWAYS starts in RACE mode
    // (persisting roam silently made races "never finish" for returning players)
    this.freeRoam = params.get('mode') === 'roam';
    // [MISSIONS] mode=missions rides on the roam machinery (open world, no
    // rivals) but layers structured objectives on top — see the MISSIONS block.
    this.missionMode = params.get('mode') === 'missions';
    if (this.missionMode) this.freeRoam = true;
    this.tracksView = this._loadTracksView();
    this.steerSetting = localStorage.getItem('ir-steer') || 'normal';
    this.controlScheme = localStorage.getItem('ir-controls') === 'two' ? 'two' : 'one';
    // touch players get the aid by default — thumbs are coarser than keys
    this.assistSetting = localStorage.getItem('ir-assist')
      || (matchMedia('(pointer: coarse)').matches ? 'assist' : 'standard');
    // OPEN ALL — a REMEMBERED switch, not just a URL flag. `?unlockall=1` was
    // the only way in, so it lasted exactly as long as the browser tab and was
    // gone the moment the game was opened from the home screen or as a PWA.
    // The flag still forces it on (every headless suite passes it), and it also
    // WRITES the setting, so arriving by link and then reloading keeps it.
    if (params.get('unlockall') === '1') {
      try { localStorage.setItem('ir-openall', '1'); } catch { /* private mode */ }
    }
    this.unlockAll = params.get('unlockall') === '1'
      || localStorage.getItem('ir-openall') === '1';
    // ADMIN — the owner's build tools, off the main game.
    //
    // The WORLD EDITOR used to sit under START RACE on the tracks tab, which
    // put a level-sculpting tool in front of every player who ever opened the
    // menu. Asked for as: "Place the world editor under a admin link and
    // remove it from the main game."
    //
    // Same REMEMBERED-SWITCH shape as `unlockall` directly above, and for the
    // same reason: a URL-only flag lasts exactly as long as the browser tab
    // and is gone the moment the game is opened from the home screen or as a
    // PWA, which is how the owner actually opens it. `?admin=1` turns it on
    // and writes it; `?admin=0` turns it off again, because a switch you
    // cannot unset is a trap — without it the only way back would be clearing
    // site data, which also throws away the career.
    const adminParam = params.get('admin');
    if (adminParam === '1' || adminParam === '0') {
      try { localStorage.setItem('ir-admin', adminParam); } catch { /* private mode */ }
    }
    this.adminMode = adminParam === '1'
      || (adminParam !== '0' && localStorage.getItem('ir-admin') === '1');
    const diffId = localStorage.getItem('ir-diff') || 'normal';
    this.difficulty = DIFFS[diffId] || DIFFS.normal;
    // guard: don't start a locked level via URL tampering
    if (!this.isLevelUnlocked(this.level.id)) {
      this.levelIndex = 0;
      this.level = LEVELS[0];
      this.autoStart = false;
    }

    this.canvas = document.getElementById('game-canvas');
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas, antialias: true, powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, this.isTouch ? 1.75 : 2));
    // `setSize` MUST WRITE THE CSS SIZE. r271 passed `false` here to stop it
    // doing that, on the theory that `#game-canvas{position:fixed;inset:0}`
    // would size the element instead and cover an iOS safe-area band. It does
    // not, and cannot: a <canvas> is a REPLACED element, so its used width
    // comes from its intrinsic size — the width/height ATTRIBUTES, which are
    // the drawing buffer — and `left`/`right` do not stretch it. With the
    // style write gone the element laid itself out at buffer size in CSS
    // pixels: measured 703x1529 on a 402x874 screen, because the touch pixel
    // ratio is 1.75. The view was zoomed 75% and cropped to the top-left
    // corner on every touch device, which is what "camera is broken overall"
    // was. `camsanity.mjs` is the gate for it now.
    this.renderer.setSize(innerWidth, innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    // Lifted from 1.12 after the lighting retune measured 35 % darker overall
    // (mean scene luminance 71 -> 46 on PINE VALLEY). The retune's fill/key
    // RATIO is what buys the shadow contrast, so exposure is the right lever to
    // put the brightness back without flattening it again.
    this.renderer.toneMappingExposure = 1.46;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0xcfe8f5, 320, 1500);
    this.camera = new THREE.PerspectiveCamera(56, innerWidth / innerHeight, 0.5, 3200);

    // LIGHTING: warm key / cool fill.
    // The old rig was a 0.85-intensity hemisphere against a 2.0 sun, which is
    // close to a 1:2 fill ratio — enough ambient to erase the cast shadows
    // entirely, so every world rendered as flat poster colour. The reference
    // art is the opposite: one strong warm key, a weak COOL sky fill, and
    // shadow sides that go blue-violet rather than grey. Themes now carry the
    // ratio (hemiIntensity ~0.40-0.55 against sunIntensity ~2.4-3.0).
    this.hemi = new THREE.HemisphereLight(0xbfe0ff, 0x5a8a3c, 0.5);
    this.scene.add(this.hemi);
    const sun = new THREE.DirectionalLight(0xfff3d6, 2.6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(this.isTouch ? 1024 : 2048, this.isTouch ? 1024 : 2048);
    const sc = sun.shadow.camera;
    // tight frustum around the player (the rig follows them) = crisp shadows
    sc.left = -72; sc.right = 72; sc.top = 72; sc.bottom = -72;
    sc.near = 10; sc.far = 400;
    sc.updateProjectionMatrix();
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.035;   // kills the acne the raked sun exposes
    // A 1024 map stretched over a 144 u frustum is 0.14 u per texel, so a car
    // shadow is ~30 texels across and its edge steps visibly — a hard black
    // wedge on the ground rather than a shadow. Widen the PCF kernel so the
    // edge is soft at the size a car actually casts.
    sun.shadow.radius = 3.5;
    this.scene.add(sun, sun.target);
    this.moon = sun; // shadow rig follows the player (name kept for the camera code)
    // The shadow rig used to sit at a hard-coded (70,130,50) — 56° up and in a
    // fixed compass direction — while each theme drew its sun sprite from
    // sunAz/sunEl. Light and visible sun disagreed on every level. The offset
    // is now derived from the theme's own azimuth, with the elevation raised
    // out of the sprite's near-horizon range into a 33-46° key that still
    // throws long, readable shadows. `_sunOffset` is what _updateCamera adds
    // to the player each frame.
    this._sunOffset = new THREE.Vector3(70, 130, 50);

    // post-processing: a whisper of bloom for lamps, tracers and explosions
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.38, 0.45, 0.88);
    this.composer.addPass(this.bloom);
    // film grade: gentle saturation + contrast lift and a soft vignette —
    // runs pre-OutputPass (linear space), so it grades under the tone map
    this.grade = new ShaderPass({
      uniforms: { tDiffuse: { value: null }, uVig: { value: 0.30 }, uSat: { value: 1.07 }, uCon: { value: 1.05 }, uAber: { value: 0.0006 } },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */ `
        uniform sampler2D tDiffuse; uniform float uVig, uSat, uCon, uAber; varying vec2 vUv;
        void main() {
          vec2 q = vUv - 0.5;
          float r2 = dot(q, q);
          // subtle radial chromatic fringe, only toward the frame edges
          vec2 off = q * r2 * uAber * 12.0;
          vec4 c = texture2D(tDiffuse, vUv);
          c.r = texture2D(tDiffuse, vUv - off).r;
          c.b = texture2D(tDiffuse, vUv + off).b;
          float l = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722));
          c.rgb = mix(vec3(l), c.rgb, uSat);
          c.rgb = (c.rgb - 0.5) * uCon + 0.5;
          c.rgb *= 1.0 - uVig * smoothstep(0.35, 0.95, r2 * 2.6);
          gl_FragColor = c;
        }`,
    });
    this.composer.addPass(this.grade);
    this.composer.addPass(new OutputPass());

    // world + systems
    //
    // Everything that belongs to ONE level — pickups, livestock, stars, gates,
    // hazards, debris, husks — goes under worldLayer, and the track keeps its
    // own group. Between them that is the entire level, held by two nodes, so
    // switching tracks is a teardown and a rebuild rather than a page reload.
    this.worldLayer = new THREE.Group();
    this.scene.add(this.worldLayer);
    // Seeded: the same world every time, so a bug found here can be found again.
    // ?seed= overrides it, which is what turns a report into a repro.
    this.worldSeed = this._seedOverride ?? seedForLevel(this.level);
    this.track = withSeed(this.worldSeed,
      () => new Track(this.scene, this.level, this.editScene));
    this._applyTheme();
    this._buildRoute();   // CORRIDOR: the race's own structure, shadow mode
    this.particles = new Particles(this.scene);
    this.particles.setTheme?.(this.level?.theme); // smashed barrels shed the theme's own stave/hoop colours
    this.skids = new SkidMarks(this.scene);
    this.husks = [];      // charred wreck shells left where cars died
    this.hitStop = 0;     // slow-motion timer after a brutal impact
    this.fovKick = 0;     // camera punch on the same impacts
    this.audio = new AudioEngine();
    this.input = new Input();
    // a point-to-point stage (FURKA) races ONE long lap; circuits race 3
    this.lapsTotal = this.level?.laps ?? LAPS;
    this.contractPool = CONTRACT_POOL; // exposed for the headless suites

    const carEntry = CAR_CATALOG.find((c) => c.key === this.cars.selected) || CAR_CATALOG[0];
    this.player = new PlayerCar(this, carEntry);
    this.enemies = [];
    for (let i = 0; i < ENEMY_COUNT; i++) this.enemies.push(new EnemyCar(this, i, ENEMY_COUNT));
    // The first `_applyTheme` ran before any of these existed, so the opening
    // world's headlights are switched HERE. Every later world goes through
    // `_applyTheme` with the cars already built.
    this._syncCarLights();
    this.weapons = new Weapons(this);
    this.hud = new Hud(this);
    installRally(this);   // PATCH_02 fix 0: the race log
    this.choppers = [];
    // ground enemies — gun nests dug in beside the road, raiders that hunt
    this.hostiles = [];
    this.props = this.track.props ? [...this.track.props] : [];
    this.flyingProps = [];
    this.debris = this.debris ?? [];   // settled wreckage — see _settleDebris
    this.chopperTimer = 0;
    this.chopperWave = 0;

    this._buildPickups();
    this._initWorldHazards();
    this._buildRoamStars();
    this._buildLivestock();
    this._buildGunNests();
    this._initFlashPool();
    this.camMode = 0; // 0 = top-down, 1 = low chase
    this.camPos = new THREE.Vector3();
    this.camLook = new THREE.Vector3();
    this.shake = 0;

    this.state = 'title';
    this.resetRace();
    this._warmShaders();

    this.input.bindTouchButtons();
    const joyZone = document.getElementById('joy-zone');
    if (joyZone) {
      this.input.bindJoystick(joyZone, document.getElementById('joy-base'), document.getElementById('joy-knob'));
    }
    const applyViewport = () => {
      // ---- REACHING INTO THE SAFE-AREA BANDS ------------------------------
      //
      // Reported twice: a green bar down each edge in landscape. Measured off
      // the screenshot rather than guessed at — `bandscan.mjs` scans in from
      // both sides for the first column that is not flat page background:
      //
      //     2868 px wide, left band 185, right band 186, colour #7eb75c
      //
      // #7eb75c is `body`'s old background exactly, and the main renderer has
      // no `alpha`, so its canvas is OPAQUE and cannot be showing anything
      // behind it. The canvas simply is not there. 2868/3 = 956 pt — an iPhone
      // 16 Pro Max in landscape, whose safe-area inset is 62 pt, and 185/3 is
      // 61.7. So the layout viewport is 832 on a 956 pt screen: `viewport-fit=
      // cover` is in the meta, has been since r245, and is not taking effect.
      //
      // Nothing inside the page can be positioned into those bands... except
      // that THE BACKGROUND IS ALREADY PAINTING THERE. The browser's page
      // surface does span the full 956; only the CSS coordinate space is 832
      // wide. So an element pulled left of zero and made wide enough does
      // reach them — and `screen.width` is the one API that still reports the
      // real screen when `innerWidth` does not.
      //
      // Guarded hard, because this must be a NO-OP everywhere it is not
      // needed: touch only (on a desktop `screen.width` is the monitor, not
      // the window), only when the screen is wider than the viewport, and only
      // by an amount an inset could plausibly be. Vertical is deliberately
      // left alone — in landscape the browser's own chrome makes
      // `screen.height` meaningless.
      const sw = window.screen?.width || 0;
      const gap = sw - innerWidth;
      const over = (this.isTouch && gap > 0 && gap <= 200) ? gap / 2 : 0;
      const vw = innerWidth + over * 2, vh = innerHeight;
      this.camera.aspect = vw / vh;
      this.baseFov = vh > vw ? 68 : 56;                        // widen for portrait phones
      this.camera.fov = this.baseFov;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(vw, vh);                           // see the ctor
      this.composer.setSize(vw, vh);
      // `setSize` has just written `style.left`-agnostic width/height; the
      // offset has to go on afterwards or it is overwritten.
      this.canvas.style.left = over ? `${-over}px` : '';
      if (this.input.resetJoystick) this.input.resetJoystick();
    };
    applyViewport();
    addEventListener('resize', applyViewport);
    // orientation flips: some mobile browsers report stale sizes for a beat
    addEventListener('orientationchange', () => {
      applyViewport();
      setTimeout(applyViewport, 300);
      setTimeout(applyViewport, 800);
    });
    // auto-pause into the menu when the app is backgrounded mid-race
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.state === 'race') this.togglePause();
    });
    document.getElementById('start-btn').addEventListener('click', () => this.startRace());
    this._wireBack();
    // THE WORLD EDITOR — ADMIN ONLY. Mounted lazily on first use: it builds
    // its own DOM and takes the pointer, and a player who never opens it
    // should pay nothing.
    //
    // The button is REMOVED from the document rather than hidden with CSS.
    // Hiding it would leave a real, clickable, keyboard-reachable control in
    // the tab order of every player's menu — "not visible" is not "not there",
    // and a tab-stop that sculpts terrain is worse than a visible one because
    // nobody can see what they just hit.
    const edBtn = document.getElementById('editor-btn');
    if (!this.adminMode) document.getElementById('admin-panel')?.remove();
    else edBtn?.addEventListener('click', () => {
      this._flushPick?.();   // the editor must open on the world that was picked
      if (!this.editor) this.editor = new WorldEditor(this);
      this.editor.enter();
    });
    document.getElementById('restart-btn').addEventListener('click', () => {
      document.getElementById('results').classList.add('hidden');
      this.resetRace();
      this.startRace();
    });
    // leave the results screen for the garage — the credits you just banked are
    // only useful somewhere else, so the podium must never be the only exit
    document.getElementById('garage-btn')?.addEventListener('click', () => {
      this.showMenu('garage');
    });

    // camera cycle: on the HUD again (r303, user ask) AND in the pause menu
    document.getElementById('cam-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();               // a camera tap must never also steer
      this.cycleCamera();
    });
    document.getElementById('pause-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      this.togglePause();
    });

    // menu tabs: PRE-RACE (tracks + settings) | GARAGE (cars + upgrades)
    {
      const tabs = [
        [document.getElementById('tab-btn-race'), document.getElementById('tab-race')],
        [document.getElementById('tab-btn-garage'), document.getElementById('tab-garage')],
        [document.getElementById('tab-btn-settings'), document.getElementById('tab-settings')],
        [document.getElementById('tab-btn-mode'), document.getElementById('tab-mode')],
        [document.getElementById('tab-btn-jobs'), document.getElementById('tab-jobs')],
      ].filter(([b, p]) => b && p);
      for (const [btn, panel] of tabs) {
        btn.addEventListener('click', () => {
          for (const [b, p2] of tabs) {
            b.classList.toggle('current', b === btn);
            p2.classList.toggle('off', p2 !== panel);
          }
          // TRACKS is on screen: the deferred world art is wanted NOW
          if (btn.id === 'tab-btn-jobs') this._renderJobs();
          if (btn.id === 'tab-btn-race') {
            this._loadAllShots();
            // ...and land on the rung the player is actually up to. Opening a
            // 60-world ladder at rung 1 makes them scroll past everything they
            // have already cleared to find the one card that matters. After a
            // frame, so the panel it lives in has been laid out and the card
            // has a measurable position.
            requestAnimationFrame(() => this._scrollToNextTrack('smooth'));
          }
          // the tab IS a level on the back ladder, so the label moves with it
          this._syncBackBtn();
          // ...and the shop floor only turns while you are standing in it
          this._stageRun(btn.id === 'tab-btn-garage');
        });
      }
    }

    this._renderLevelCards();
    // TRACKS is the tab the menu opens on, so the boot path needs the same
    // landing the tab button gives. Two frames: one for the list to lay out,
    // one for the fonts to settle the row heights it is measured against.
    requestAnimationFrame(() => requestAnimationFrame(() => this._scrollToNextTrack('auto')));

    // mode chips: RACE | FREE ROAM | MISSIONS
    const msel = document.getElementById('mode-select');
    msel.innerHTML = ''; // never append into a row that might already hold chips
    const curMode = this.missionMode ? 'missions' : this.freeRoam ? 'roam' : 'race';
    // ICON AND WORD ARE SEPARATE SPANS because the three chips share one row
    // now, and at 93px a chip "🌍 FREE ROAM" is a couple of pixels too wide and
    // clips. The word is the information and the icon is decoration, so below
    // 430px the CSS drops the icon rather than truncating the label.
    for (const [id, icon, label] of [['race', '🏁', 'RACE'], ['roam', '🌍', 'FREE ROAM'],
      ['missions', '🎯', 'MISSIONS']]) {
      const chip = document.createElement('button');
      chip.className = 'mode-chip' + (id === curMode ? ' current' : '');
      chip.dataset.mode = id;
      chip.innerHTML = `<span class="mc-ico">${icon}</span><span class="mc-lbl">${label}</span>`;
      chip.addEventListener('click', () => {
        // in place; the reload is only a fallback for the mid-race case, which
        // the menu cannot actually reach
        if (!this.setMode(id)) this.fadeTo(`?level=${this.level.id}&mode=${id}`);
      });
      msel.appendChild(chip);
    }
    if (this.freeRoam) document.getElementById('start-btn').textContent = 'START EXPLORING';
    if (this.missionMode) this._buildMissionPicker(); // [MISSIONS] also sets the start label

    // difficulty chips
    const dsel = document.getElementById('diff-select');
    dsel.innerHTML = '';
    for (const d of Object.values(DIFFS)) {
      const chip = document.createElement('button');
      chip.className = 'diff-chip' + (d.id === this.difficulty.id ? ` current ${d.id}` : '');
      chip.textContent = d.label;
      chip.addEventListener('click', () => {
        this.difficulty = d;
        localStorage.setItem('ir-diff', d.id);
        for (const c of dsel.children) c.className = 'diff-chip';
        chip.className = `diff-chip current ${d.id}`;
      });
      dsel.appendChild(chip);
    }

    // steering sensitivity chips (also cycled from the pause menu)
    const ssel = document.getElementById('steer-select');
    ssel.innerHTML = ''; // the STEERING label lives in the settings row markup now
    const STEERS = [['relaxed', 'RELAXED'], ['normal', 'NORMAL'], ['sharp', 'SHARP']];
    const applySteerChips = () => {
      for (const c of ssel.querySelectorAll('.diff-chip')) {
        c.className = 'diff-chip' + (c.dataset.id === this.steerSetting ? ' current normal' : '');
      }
      const pmBtn = document.getElementById('pm-steer');
      pmBtn.textContent = `STEERING: ${this.steerSetting.toUpperCase()}`;
    };
    for (const [id, label] of STEERS) {
      const chip = document.createElement('button');
      chip.className = 'diff-chip';
      chip.dataset.id = id;
      chip.textContent = label;
      chip.addEventListener('click', () => {
        this.steerSetting = id;
        localStorage.setItem('ir-steer', id);
        this.applyUpgrades();
        applySteerChips();
      });
      ssel.appendChild(chip);
    }
    // OPEN ALL chips. Rebuilding the track list and the car shop is the whole
    // effect — everything else already asks `isLevelUnlocked` per call, so
    // nothing needs reloading.
    const oaSel = document.getElementById('open-all-select');
    if (oaSel) {
      const paint = () => {
        for (const c of oaSel.children) c.classList.toggle('on', (c.dataset.id === '1') === !!this.unlockAll);
      };
      for (const [id, label] of [['0', 'CAREER'], ['1', 'OPEN ALL']]) {
        const chip = document.createElement('button');
        chip.className = 'diff-chip';
        chip.dataset.id = id;
        chip.textContent = label;
        chip.addEventListener('click', () => {
          this.unlockAll = id === '1';
          try { localStorage.setItem('ir-openall', id); } catch { /* private mode */ }
          paint();
          this._renderLevelCards();
          this.renderCarShop?.();
          this._renderJobs?.();
          this._syncStartButton?.();
          this.audio?.ui?.();
          this.hud?.feed?.(this.unlockAll ? 'EVERY WORLD AND CAR OPEN' : 'BACK TO THE CAREER LADDER', 'info');
        });
        oaSel.appendChild(chip);
      }
      paint();
    }
    // TEST FUNDS. Deliberately a REAL credit, written to the garage the same way
    // a race payout is — not a display-only fiction like OPEN ALL, because a
    // fake balance that empties on reload is worse than no button at all. Also
    // reachable as `?credits=300000` so a link can hand someone a test save.
    const grantCr = (n, why) => {
      this.garage.credits = Math.max(0, (this.garage.credits | 0) + n);
      saveJSON(this._pkey('garage'), this.garage);
      this.renderGarage?.();
      this.renderCarShop?.();
      this.hud?.feed?.(`${n > 0 ? '+' : ''}${n.toLocaleString()} CR — ${why}`, 'good');
    };
    document.getElementById('grant-cr')?.addEventListener('click', () => {
      grantCr(300000, 'TEST FUNDS');
      this.audio?.ui?.();
    });
    const wantCr = Number(new URLSearchParams(location.search).get('credits'));
    if (Number.isFinite(wantCr) && wantCr > 0 && !this._creditsGranted) {
      this._creditsGranted = true;
      grantCr(Math.min(9e6, Math.round(wantCr)), 'FROM THE LINK');
    }
    document.getElementById('pm-steer').addEventListener('click', () => {
      const ids = STEERS.map(([i]) => i);
      this.steerSetting = ids[(ids.indexOf(this.steerSetting) + 1) % ids.length];
      localStorage.setItem('ir-steer', this.steerSetting);
      this.applyUpgrades();
      applySteerChips();
      this.hud.feed(`STEERING: ${this.steerSetting.toUpperCase()}`, 'info');
    });
    applySteerChips();

    // driving aid: gentle auto-straightening, the fix for "hard to control in
    // 3D view". Defaults ON for touch devices, STANDARD on desktop.
    const asel = document.getElementById('assist-select');
    // the label is markup now (.set-lbl in the RACE SETTINGS row) — writing one
    // here too rendered "DRIVING AID DRIVING AID"
    asel.innerHTML = '';
    const AIDS = [['pro', 'PRO', 0], ['standard', 'STANDARD', 0.5], ['assist', 'ASSIST', 1]];
    const applyAidChips = () => {
      for (const c of asel.querySelectorAll('.diff-chip')) {
        c.className = 'diff-chip' + (c.dataset.id === this.assistSetting ? ' current normal' : '');
      }
    };
    for (const [id, label] of AIDS) {
      const chip = document.createElement('button');
      chip.className = 'diff-chip';
      chip.dataset.id = id;
      chip.textContent = label;
      chip.addEventListener('click', () => {
        this.assistSetting = id;
        localStorage.setItem('ir-assist', id);
        this.applyUpgrades();
        applyAidChips();
      });
      asel.appendChild(chip);
    }
    applyAidChips();

    // control scheme: one thumb doing everything, or thumbs split between
    // steering and pedals. Touch only, and switchable mid-race from the pause
    // menu — you discover a scheme is wrong for you while driving, not before.
    {
      const row = document.getElementById('scheme-row');
      const sel = document.getElementById('scheme-select');
      const pmBtn = document.getElementById('pm-scheme');
      if (row && sel) {
        if (this.isTouch) row.classList.add('on'); else if (pmBtn) pmBtn.style.display = 'none';
        const SCHEMES = [['one', 'ONE THUMB'], ['two', 'TWO THUMB']];
        const paint = () => {
          for (const c of sel.querySelectorAll('.diff-chip')) {
            c.className = 'diff-chip' + (c.dataset.id === this.controlScheme ? ' current normal' : '');
          }
          if (pmBtn) {
            pmBtn.textContent = `CONTROLS: ${(SCHEMES.find(([i]) => i === this.controlScheme)?.[1]) ?? ''}`;
          }
        };
        this._applyControlScheme = (id, save) => {
          this.controlScheme = id === 'two' ? 'two' : 'one';
          document.body.classList.toggle('two-thumb', this.controlScheme === 'two');
          this.input.steerOnly = false;                       // the pad is gone in two-thumb
          this.input.autoThrottle = this.controlScheme === 'two';
          // a scheme change mid-drag would otherwise leave the old axis stuck on
          this.input.analog.steer = this.input.analog.throttle = this.input.analog.brake = 0;
          this.input.resetJoystick?.();
          if (save) localStorage.setItem('ir-controls', this.controlScheme);
          paint();
        };
        for (const [id, label] of SCHEMES) {
          const chip = document.createElement('button');
          chip.className = 'diff-chip';
          chip.dataset.id = id;
          chip.textContent = label;
          chip.addEventListener('click', () => this._applyControlScheme(id, true));
          sel.appendChild(chip);
        }
        pmBtn?.addEventListener('click', () => {
          this._applyControlScheme(this.controlScheme === 'one' ? 'two' : 'one', true);
          this.hud.feed(`CONTROLS: ${this.controlScheme === 'two' ? 'TWO THUMB' : 'ONE THUMB'}`, 'info');
        });
        this._applyControlScheme(this.controlScheme, false);
      }
    }

    // joystick sensitivity — a real slider, because "a bit less than that" is
    // not something three preset chips can express. Touch only: it does
    // nothing for a keyboard, so it does not clutter a desktop settings panel.
    {
      const row = document.getElementById('joy-row');
      const slider = document.getElementById('joy-sens');
      const val = document.getElementById('joy-val');
      if (row && slider) {
        if (this.isTouch) row.classList.add('on');
        const stored = parseInt(localStorage.getItem('ir-joysens') || '100', 10);
        const apply = (pct, save) => {
          const p = Math.max(50, Math.min(180, pct || 100));
          slider.value = String(p);
          if (val) val.textContent = `${p}%`;
          this.input.joySens = p / 100;
          if (save) localStorage.setItem('ir-joysens', String(p));
        };
        apply(stored, false);
        // 'input' so it tracks the thumb live; the value is only persisted on
        // release, so dragging does not hammer localStorage
        slider.addEventListener('input', () => apply(+slider.value, false));
        slider.addEventListener('change', () => apply(+slider.value, true));
        // the slider lives inside the scrolling menu — let it own its drags
        for (const ev of ['touchstart', 'touchmove', 'pointerdown']) {
          slider.addEventListener(ev, (e) => e.stopPropagation(), { passive: true });
        }
      }
    }

    this.renderGarage();
    this.renderCarShop();
    // Paint the start button ONCE ON BOOT. It repaints on every pick, car
    // change, upgrade and mode switch — but a fresh page load (career
    // fallthrough, shared link) reached the menu without a single one of
    // those, so the tyre-price label was only ever correct after the first
    // interaction. Found by the track-testing agent's sweep (BUGS.md #5).
    this._syncStartButton();
    this._initProfileUI();

    // pause menu
    const pm = document.getElementById('pause-menu');
    this._openPauseMenu = () => pm.classList.remove('hidden');
    const closeMenu = () => pm.classList.add('hidden');
    document.getElementById('pm-resume').addEventListener('click', () => {
      closeMenu();
      if (this.state === 'paused') { this.state = 'race'; this.hud.centerMsg('GO'); }
    });
    document.getElementById('pm-camera').addEventListener('click', () => this.cycleCamera());
    document.getElementById('pm-driver')?.addEventListener('click', () => this.setDriverView());
    document.getElementById('pm-restart').addEventListener('click', () => {
      closeMenu();
      this.resetRace();
      this.startRace();
    });
    document.getElementById('pm-exit').addEventListener('click', () => {
      if (this.freeRoam) this.bankRoamCredits();
      this.showMenu();
    });
    // RALLY_PATCH_02 fix 0 — the race log, one tap from the pause menu. The
    // clipboard is the transport (on iOS the paste target is the share
    // sheet); the button labels itself with the outcome so a failed
    // clipboard permission is not a silent nothing.
    document.getElementById('pm-copylog')?.addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      const text = window.__rally?.dump?.() ?? '';
      let ok = false;
      try { await navigator.clipboard.writeText(text || '(race log empty)'); ok = true; }
      catch { /* clipboard denied — fall through to the label */ }
      const n = this.telemetry?.n ?? 0;
      btn.textContent = ok
        ? `COPIED ${n} EVENT${n === 1 ? '' : 'S'} ✓`
        : 'CLIPBOARD BLOCKED ✗';
      clearTimeout(this._copylogT);
      this._copylogT = setTimeout(() => { btn.textContent = 'COPY RACE LOG 📋'; }, 2200);
    });

    // next-level chaining from the results screen
    document.getElementById('next-level-btn').addEventListener('click', () => {
      if (this.missionMode) { // [MISSIONS] the button doubles as "back to mission select"
        this.showMenu();
        return;
      }
      // straight into the next world, in place: swap the track under the menu,
      // then launch. Falls back to the old navigate only if the swap declines.
      const next = LEVELS[this.levelIndex + 1];
      const carried = this.score;   // swapLevel resets the race, so keep it here
      document.getElementById('results').classList.add('hidden');
      if (next && this.swapLevel(next)) {
        this._renderLevelCards();
        this._softURL();
        this.startRace();
        this.score = carried;       // the running total follows you up the ladder
      } else if (next) {
        sessionStorage.setItem('ir-score', String(this.score));
        this.fadeTo(`?level=${next.id}&go=1`);
      } else {
        this.showMenu();
      }
    });

    // fade in on load (covers level-to-level transitions)
    const fade = document.getElementById('fade');
    fade.style.transition = 'none';
    fade.classList.add('dark');
    // CLEAR IT WHATEVER HAPPENS. This used to rely on a double rAF, and rAF
    // does not fire while the page is backgrounded — so loading with the phone
    // locked, or switching apps mid-load, left the screen dark forever. A
    // timer runs even when hidden, and re-clearing on visibilitychange covers
    // a load that finishes while the tab is away.
    const lift = () => {
      fade.style.transition = '';
      fade.classList.remove('dark');
    };
    requestAnimationFrame(() => requestAnimationFrame(lift));
    setTimeout(lift, 900);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) lift();
    });

    this.clock = new THREE.Clock();
    this.renderer.setAnimationLoop(() => this.frame());

    if (this.autoStart) {
      // arriving from a level transition: skip the title, keep the running score
      document.getElementById('title-screen').classList.add('hidden');
      this.startRace();
      const carried = parseInt(sessionStorage.getItem('ir-score') || '0');
      if (carried > 0) this.score = carried;
      sessionStorage.removeItem('ir-score');
    } else {
      this._restoreMenuState(); // picked a track from the menu: come back to the same spot
    }
  }

  togglePause() {
    if (this.state === 'race') {
      this.state = 'paused';
      this._openPauseMenu();
    } else if (this.state === 'paused') {
      document.getElementById('pause-menu').classList.add('hidden');
      this.state = 'race';
      this.hud.centerMsg('GO');
    }
  }

  cycleCamera() {
    this.camMode = (this.camMode + 1) % CAM_MODES.length;
    this._syncViewBtn();
    if (this.state !== 'title') this.hud.feed(`CAMERA: ${CAM_MODES[this.camMode].name}`, 'info');
  }

  /** Index of the driver's view in CAM_MODES, found by its flag rather than
   *  written down as a 5 — the list is edited often and a stale constant here
   *  would silently switch you to CHASE FAR. */
  /** The view names in cycle order. Published so a gate does not hardcode the
   *  list — `test-camera` did, BY INDEX, so moving DRIVER up the cycle would
   *  have had it testing the seat while calling it CHASE FAR. */
  static get CAM_NAMES() { return CAM_MODES.map((m) => m.name); }

  /** The mode table itself, published for the HUD-review anchor gate (H1):
   *  the car anchor is a measured property of these numbers, and the rig
   *  that holds it to the 52-58% band needs to read and probe them. */
  static get CAM_MODES() { return CAM_MODES; }

  static get DRIVER_MODE() {
    const i = CAM_MODES.findIndex((m) => m.driver);
    return i < 0 ? 0 : i;
  }

  /** THE ONE-PRESS TOGGLE — now for the KEYBOARD and the PAUSE MENU only.
   *
   *  The 👁 button is gone by request and 📷 cycles to the seat like any other
   *  view. This stays because V and the pause menu are single presses already,
   *  and because it remembers which boom you came from, so leaving the seat
   *  returns you where you were rather than to the top of the list.
   *
   *  `on` omitted toggles; passing it explicitly is for the pause menu, which
   *  wants a checkbox rather than a flip. */
  setDriverView(on) {
    const D = Game.DRIVER_MODE;
    const isOn = this.camMode === D;
    const want = on === undefined ? !isOn : !!on;
    if (want === isOn) return;
    if (want) { this._preDriverMode = this.camMode; this.camMode = D; }
    else this.camMode = (this._preDriverMode ?? 3) === D ? 3 : (this._preDriverMode ?? 3);
    this._syncViewBtn();
    if (this.state !== 'title') {
      this.hud.feed(want ? "DRIVER'S VIEW" : `CAMERA: ${CAM_MODES[this.camMode].name}`, 'info');
    }
  }

  /** Paint the pause menu's driver-view entry. Called from every path that can
   *  change camMode, so the label cannot disagree with the camera.
   *
   *  The 👁 HUD button this also used to paint is gone — "remove the eye and
   *  integrate the switch as part of the camera". The seat was always a stop on
   *  the 📷 cycle as well as a toggle, so the cycle is now the on-screen route
   *  and the HUD is back to two icon buttons. */
  _syncViewBtn() {
    const pb = document.getElementById('pm-driver');
    if (pb) pb.textContent = this.camMode === Game.DRIVER_MODE ? "CHASE VIEW 📷" : "DRIVER'S VIEW 👁";
  }

  /** Compile every shader the world can need BEFORE anyone is driving.
   *
   * THIS IS THE FREEZE. WebGL links a shader program the first time a material
   * is actually drawn, on the main thread, and nothing else happens until it
   * finishes. Measured: one render call that introduced 16 new programs blocked
   * for 1083 ms. Since a material only draws when it first becomes VISIBLE,
   * the hitch lands exactly when something new happens — the first shot, the
   * first explosion, the first wreck. Which is what "it freezes when I'm
   * shooting" and "it's freezing overall" both are.
   *
   * The cure is to pay that cost up front, on the title screen, where a pause
   * is invisible. Everything transient — bullets, sparks, smoke, husks, flying
   * debris — already exists in the graph from boot; it is merely hidden. So we
   * unhide the whole graph for the length of one compile() call (compile does
   * not draw, so nothing reaches the screen), let three build every program,
   * and put the visibility flags back exactly as they were.
   */
  _warmShaders(sync = false) {
    if (!this.renderer?.compile) return;
    const hidden = [];
    try {
      this.scene.traverse((o) => {
        if (o.visible === false) { hidden.push(o); o.visible = true; }
      });
      const t0 = performance.now();
      // PREFER compileAsync. It calls compile() synchronously — same traverse,
      // same programs queued — and only the LINK is awaited, handed to the
      // driver through KHR_parallel_shader_compile. Measured, the blocking warm
      // was the single largest task in the whole boot at 5.5 s; this hands most
      // of that to the GPU's own threads.
      //
      // Restoring visibility is deliberately NOT in the promise: compile() has
      // already traversed by the time compileAsync returns, so the flags can go
      // back before the render loop starts. Leave it to the .then() and the
      // title screen spends the warm-up drawing bullets, husks and explosions.
      // ...BUT NOT WHEN THE WORLD IS ABOUT TO BE TORN DOWN AGAIN.
      //
      // `compileAsync` polls its captured material list from a timer of its
      // own, reading `materialProperties.currentProgram.isReady()`. Dispose
      // those materials before the poll lands — which is exactly what a world
      // rebuild does — and `currentProgram` is undefined, so three throws
      // "Cannot read properties of undefined (reading 'isReady')" from inside
      // its own timer, where the promise's .catch() cannot reach it. Every
      // APPLY in the editor produced one. On a rebuild the synchronous compile
      // is used instead: it is slower, and it cannot outlive its own scene.
      if (this.renderer.compileAsync && !sync) {
        const p = this.renderer.compileAsync(this.scene, this.camera);
        for (const o of hidden) o.visible = false;
        hidden.length = 0;
        this.__warming = p.then(() => {
          this.__warmMs = Math.round(performance.now() - t0);
          this.__warmProgs = this.renderer.info.programs?.length ?? -1;
        }).catch((err) => console.warn('[warm] async precompile failed:', err?.message));
      } else {
        this.renderer.compile(this.scene, this.camera);
        this.__warmMs = Math.round(performance.now() - t0);
        this.__warmProgs = this.renderer.info.programs?.length ?? -1;
      }
    } catch (err) {
      // a warm-up must never be the reason the game fails to boot
      console.warn('[warm] shader precompile skipped:', err?.message);
    } finally {
      for (const o of hidden) o.visible = false;
    }
  }

  /** Steering scale for the view currently being driven — see CAM_MODES.
   *  A getter rather than a stored field so it stays right no matter how
   *  camMode was set (button, keyboard, pause menu, restored preference). */
  get camSteerMul() {
    return (CAM_MODES[this.camMode] || CAM_MODES[0]).steer ?? 1;
  }

  /** In roam mode, exiting banks the destruction score as credits. */
  bankRoamCredits() {
    if (this.missionMode) return; // [MISSIONS] missions pay by medal only
    // roam pays the same rate as racing — otherwise farming props off the
    // clock is strictly better money than actually competing
    const raw = Math.max(0, this.score - (this.startScore ?? 0));
    const earned = Math.round(raw * CREDIT_RATE);
    if (earned > 0) {
      this.garage.credits += earned;
    this._syncCredits();
      this._syncCredits();
      saveJSON(this._pkey('garage'), this.garage);
    }
  }

  /** Swap to another level IN PLACE — no page reload, no losing the menu.
   *
   *  Picking a track used to navigate, which meant a white flash, a fresh
   *  download of the module graph and a rebuild of everything including the
   *  parts that had nothing to do with the track. Cars already swap live; this
   *  makes tracks behave the same way.
   *
   *  Order matters. Tear the old world down FIRST — the track's group and the
   *  worldLayer between them hold every level-scoped object — then build the
   *  new one, then re-apply the theme, and only then put the cars on the new
   *  grid, because placeAt reads the new track's centreline.
   *
   *  Returns false if the level isn't playable, leaving the current one up.
   *
   *  `scene` IS THE THIRD ARGUMENT ON PURPOSE. It used to be ambient state —
   *  `this.editScene`, set once by the editor and never cleared — and the
   *  result was the worst bug the editor has had: sculpt a hill on PINE
   *  VALLEY, go back to the track list, and every world you opened after that
   *  carried your hill, including PINE VALLEY itself. The shipped world could
   *  not be got back at all, because `same && !force` made re-picking it a
   *  no-op. Measured: PINE VALLEY's ground at one probe point went -5.66 ->
   *  12.34 and stayed there, and the edit leaked into DUST CANYON badly
   *  enough to split its physics ground (16.31) from its drawn ground (11.17).
   *
   *  So the edits now travel WITH the request. Passing nothing means the
   *  shipped world, which is what every ordinary track-list click wants, and
   *  a caller has to ask for edits explicitly to get them. */
  swapLevel(level, force = false, scene = null) {
    if (!level || this.state === 'race' || this.state === 'countdown') return false;
    const same = this.level && this.level.id === level.id;
    // A world already up but standing on DIFFERENT edits is not the world
    // being asked for, so this is a real change however same the id looks.
    const sameEdits = (this.editScene || null) === (scene || null);
    if (same && sameEdits && !force) return true;
    this.editScene = scene || null;

    this.level = level;
    this.levelIndex = Math.max(0, LEVELS.findIndex((l) => l.id === level.id));
    // THE LAP COUNT BELONGS TO THE WORLD, NOT TO THE PAGE LOAD.
    //
    // This was set in the constructor and nowhere else, so it described
    // whichever world the page happened to BOOT on, for the rest of the
    // session. FURKA RIDGE is the one point-to-point stage and the only
    // world that declares `laps: 1` — boot there, then swap to anything
    // (the r152 picker, "next level", the menu, all of which swap in place)
    // and the whole campaign quietly became one lap. Reported as a
    // screenshot of LAP 1/1 on a circuit: "I see lap 1/1. Why?"
    //
    // It sits here with the other per-level refreshes because it is one of
    // them: the seed, the track, the theme and the particle palette are all
    // recomputed a few lines below off `this.level`, and this line was the
    // only sibling that got left behind.
    this.lapsTotal = this.level?.laps ?? LAPS;

    // --- tear down ---
    for (const gsp of this.missionGates ?? []) this.worldLayer.remove(gsp.spr);
    this.missionGates = null;
    this.flyingProps = [];
    // the settled wreckage lives under worldLayer and goes with it
    this.debris = [];
    this.husks = [];
    this._resetFlashes();                  // pool lights live in the scene, not here
    this._rolling = [];                    // knocked rocks belong to the old world
    disposeSubtree(this.worldLayer);       // pickups, herds, stars, hazards, debris
    this.track.dispose();
    this.skids?.reset?.();
    this.particles?.reset?.();

    // --- build the new world ---
    // Seeded: the same world every time, so a bug found here can be found again.
    // ?seed= overrides it, which is what turns a report into a repro.
    this.worldSeed = this._seedOverride ?? seedForLevel(this.level);
    this.track = withSeed(this.worldSeed,
      () => new Track(this.scene, this.level, this.editScene));
    this._applyTheme();
    this._buildRoute();   // CORRIDOR: rebuilt with the world it threads
    this._applyTyreClass();          // a new world can be a new tyre demand
    this.particles?.setTheme?.(this.level.theme);

    this.props = this.track.props ? [...this.track.props] : [];
    this.chopperTimer = 0;
    this.chopperWave = 0;
    for (const c of this.choppers ?? []) c.mesh?.parent?.remove(c.mesh);
    this.choppers = [];
    this.hostiles = [];          // their meshes went with the worldLayer
    this._buildGunNests();

    this._buildPickups();
    this._initWorldHazards();
    this._buildRoamStars();
    this._buildLivestock();

    // --- put everyone on the new grid ---
    this.__ratingsFor = null;   // car ratings are per-world
    this.resetRace();
    // SYNCHRONOUS here: a rebuild disposes the materials an async compile is
    // still polling, and three throws 'isReady' from its own timer where no
    // .catch() of ours can reach it. Every editor APPLY produced one.
    this._warmShaders(true);   // a new world means new materials — pay for them now
    this.hud?.feed?.(`${this.level.name}`, 'good');
    // Keep the address bar honest without navigating — a refresh (or a shared
    // link) then lands on the world you actually picked.
    try {
      const q = new URLSearchParams(location.search);
      q.set('level', String(this.level.id));
      history.replaceState(null, '', `${location.pathname}?${q}`);
    } catch { /* history is not worth failing a track swap over */ }
    return true;
  }

  /** Rebuild the CURRENT world from scratch — the world editor's Apply.
   *
   *  Goes through swapLevel rather than round-tripping the menu because that
   *  is the one path that disposes everything a world owns (worldLayer
   *  subtree, track group, pickups, hazards, choppers, hostiles, debris) and
   *  then re-seats the cars on the new centreline. Editing is exactly a level
   *  swap where the level happens to be the same one, so `force` is all it
   *  needs; the sculpt reaches the builder through `this.editScene`. */
  rebuildWorld() {
    if (!this.level) return false;
    // the editor's own rebuild — it has just put the pending edits on
    // `editScene`, and this is the one caller that means to keep them
    return this.swapLevel(this.level, true, this.editScene);
  }

  /** (Re)read everything scoped to the ACTIVE PROFILE — career, purse, garage.
   *  Lifted out of the constructor so changing driver is a state reload rather
   *  than a page reload. */
  /** sync.js contract: persist the registry (it stamps syncIds onto it). */
  saveProfiles() { saveJSON('ir-profiles', this.profiles); }

  /** sync.js contract: storage changed under us — reread and repaint. */
  reloadProfileState() {
    this._loadProfileState();
    this.renderGarage?.();
    this._renderLevelCards?.();
    this._renderProfiles?.();
  }

  _loadProfileState() {
    this.profile = this.profiles.list.find((p) => p.id === this.profiles.active) ?? this.profiles.list[0];
    this._pkey = (base) => profileKey(this.profile.id, base);
    // `rungs` is the contract-progression field: {contractId: rungIndex}. It
    // lives on CAREER rather than on the garage because it is progression, not
    // money, and career is already profile-scoped and carried by the sync
    // engine. Absent on every save written before this, which reads as rung I
    // everywhere — the correct default for an existing player.
    this.career = loadJSON(this._pkey('career'), { finished: {}, rungs: {} });
    this.career.rungs ??= {};
    this.garage = loadJSON(this._pkey('garage'), { credits: 0 });
    this.cars = loadJSON(this._pkey('cars'), { owned: [STARTER_CAR], selected: STARTER_CAR });
    // RENAMED MACHINES. r142 shipped two cars under marque names and r143
    // renamed them; a car key is what a purchase is recorded as, so without
    // this anyone who bought one in that window silently loses it and the
    // credits with it. Carry the key across — owned list, selection, and the
    // per-car upgrade row, which is keyed the same way.
    const RENAMED = { nine11: 'flatsix', cayen: 'bastion' };
    this.cars.owned = (this.cars.owned || []).map((k) => RENAMED[k] || k);
    if (RENAMED[this.cars.selected]) this.cars.selected = RENAMED[this.cars.selected];
    if (this.garage.upgrades) {
      for (const [was, now] of Object.entries(RENAMED)) {
        if (this.garage.upgrades[was] && !this.garage.upgrades[now]) {
          this.garage.upgrades[now] = this.garage.upgrades[was];
        }
        delete this.garage.upgrades[was];
      }
    }
    if (!this.cars.owned.length) this.cars.owned = [STARTER_CAR];
    if (!this.cars.owned.includes(this.cars.selected)) this.cars.selected = STARTER_CAR;
    // upgrades are PER-CAR (`garage.upgrades[carKey]`) — a newly bought
    // machine arrives stock. Old saves kept one flat global level set: those
    // levels migrate once onto the car the player had selected, so the main
    // ride visibly keeps its build; every other car starts at level 0.
    if (!this.garage.upgrades) {
      const flat = {};
      for (const u of UPGRADES) { flat[u.key] = this.garage[u.key] ?? 0; delete this.garage[u.key]; }
      this.garage.upgrades = { [this.cars.selected]: flat };
      saveJSON(this._pkey('garage'), this.garage);
    }
  }

  /** Hand the wheel to the active profile IN PLACE: their career unlocks,
   *  their purse, their car, their upgrade levels. */
  _applyProfileInPlace() {
    this._loadProfileState();
    // this driver may not have unlocked the world that is currently loaded
    if (!this.isLevelUnlocked(this.level.id)) this.swapLevel(LEVELS[0]);
    const entry = CAR_CATALOG.find((c) => c.key === this.cars.selected) || CAR_CATALOG[0];
    if (entry && this.player?.catalogKey !== entry.key) this.swapPlayerCar(entry);
    this.applyUpgrades();
    this.showMenu('settings');
    this.hud?.feed?.(`DRIVER: ${this.profile.name}`, 'good');
  }

  /** Cached ratings for the world that is actually loaded. Every other world's
   *  card shows its CHARACTER instead of a rating — the estimate needs the real
   *  centreline, and inventing one for 20 unbuilt tracks would be guessing. */
  _ratings() {
    if (this.__ratingsFor !== this.level.id) {
      this.__ratings = rateCarsFor(this.track);
      this.__ratingsFor = this.level.id;
    }
    return this.__ratings;
  }

  /** The surface line every card carries: what the road is made of, and — in
   *  the same glance — whether the car you have selected may race on it.
   *
   *  This is deliberately the loudest thing on the card after the name. The
   *  old affinity chip said "weak", which is a review; this says "YOU CANNOT
   *  START", which is a fact you can act on. */
  _surfaceChip(lv) {
    const f = this.carFitness(lv.id);
    if (!f) return '';
    const surf = SURFACE_LABEL[f.need];
    if (f.ok) {
      const over = f.over > 0
        ? `<span class="wc-over" title="over-tyred: slower here">${TYRE_LABEL[f.have]} — SLOW HERE</span>`
        : '<span class="wc-fitok">✓</span>';
      return `<div class="wc-surf ok">${surf} ${over}</div>`;
    }
    const why = `${TYRE_LABEL[f.have]} TYRES −${f.pen}% GRIP`;
    return `<div class="wc-surf bad">${surf} · ${why}`
      + `<span class="wc-fix">${f.fix.text}</span></div>`;
  }

  /** CAN THIS CAR RACE THIS WORLD? The one question the garage now answers.
   *
   *  Returns what the world demands, what the car is running, and — when it
   *  cannot go — the CHEAPEST thing the player can do about it, named and
   *  priced. "You need better tyres" is not advice; "FIT GRAVEL TYRES — 800
   *  CR" is. Where no upgrade reaches the class, it names a car they could
   *  buy instead, preferring one they already own. */
  carFitness(levelId, carKey = this.cars.selected) {
    const lv = LEVELS.find((l) => l.id === levelId);
    if (!lv) return null;
    const need = surfaceClass(lv);
    const have = tyreClass(carKey, (this.garage.upgrades || {})[carKey], this.fittedTyre(carKey, lv));
    // ONE CLASS EITHER SIDE IS THE IDEAL WINDOW, NOT A PERMISSION.
    //
    // If a bigger tyre always counted as ideal, the whole rule would collapse
    // into a ladder again — buy the snow set once and every world in the game
    // reads READY — which is the single-decision garage this replaces. The
    // window is what keeps the roster mutually exclusive ON MERIT: an
    // all-terrain machine pays grip on the sealed circuits exactly as a road
    // car pays it on the loose stages, and no single car is ideal everywhere,
    // so there is a reason to buy in both directions.
    // `ok` means "in the ideal window", not "allowed to race" — nothing
    // is barred (r151). One eligible car per surface turned the roster into
    // one car per trail, reported as exactly that; the mismatch is priced in
    // grip instead (see tyrePenalty), and `pen` is that price as a percent so
    // every label can state it rather than assert a prohibition.
    const overC = Math.max(0, have - need), underC = Math.max(0, need - have);
    // The quoted price is the price the PHYSICS will charge on this world, not
    // a roster-wide average: since r172 the under-spec penalty is weighted by
    // how slippery the road is, so the same road tyres cost a few percent on a
    // dry gravel stage and most of the grip in a blizzard. A card that quoted
    // one number for both would be lying about one of them.
    const pen = Math.round((1 - tyrePenalty(overC, underC, surfaceSlick(lv),
      ((this.garage.upgrades || {})[carKey] || {}).tires | 0)) * 100);
    if (have >= need && have - need <= 1) {
      return { ok: true, need, have, over: have - need, under: 0, pen };
    }
    if (have > need) {
      // TOO MUCH TYRE IS A FREE FIX NOW. Before the tyre bay existed, class
      // could only go UP, so the only remedies on offer were "drive another
      // car" or "buy one" — and both could name a machine you were already
      // sitting in, which is how CANYON RUN came to advise BUY THE BRAWLER —
      // 0 CR to somebody driving a BRAWLER. Fitting down is instant and costs
      // nothing, so that is the advice.
      return { ok: false, need, have, over: have - need, under: 0, pen, tooMuch: true,
        fix: { kind: 'fit', cls: need,
          text: `FIT ${TYRE_NAME[need]} IN THE TYRE BAY — FREE` } };
    }
    // cheapest route back to legal: an upgrade if one reaches, else a car
    const lvl = tyreLevelFor(carKey, (this.garage.upgrades || {})[carKey], need);
    let fix = null;
    if (lvl != null) {
      const cur = ((this.garage.upgrades || {})[carKey] || {}).tires | 0;
      let cost = 0;
      for (let k = cur; k < lvl; k++) cost += upgradeCost(k);
      fix = { kind: 'upgrade', level: lvl, cost,
        text: `FIT ${TYRE_NAME[need]} — ${cost.toLocaleString()} CR IN THE GARAGE` };
    } else {
      const owned = this.cars.owned
        .filter((k) => tyreMaxClass(k, (this.garage.upgrades || {})[k]) >= need);
      if (owned.length) {
        const name = CAR_CATALOG.find((c) => c.key === owned[0]).name;
        fix = { kind: 'own', car: owned[0], text: `DRIVE YOUR ${name}` };
      } else {
        const buy = CAR_CATALOG
          .filter((c) => tyreClass(c.key, null) >= need)
          .sort((a, b) => a.price - b.price)[0];
        fix = buy
          ? { kind: 'buy', car: buy.key,
            text: `BUY THE ${buy.name} — ${buy.price.toLocaleString()} CR` }
          : { kind: 'none', text: 'NO MACHINE IN THE GARAGE CAN TAKE THIS' };
      }
    }
    // `pen`/`under` ride on EVERY path — the under-tyred one shipped without
    // them in r151 and every label built from it read "−undefined% GRIP".
    return { ok: false, need, have, over: 0, under: underC, pen, fix };
  }

  /** The line on a track card: what the world is like, and — for the world you
   *  are on — whether the machine you picked is the right one for it. */
  _affinityChip(levelId) {
    const traits = WORLD_TRAITS(levelId);
    const tagLine = traits.length ? `<div class="wc-fit fair">${traits.join(' · ')}</div>` : '';
    if (levelId !== this.level.id) return tagLine;
    const r = this._ratings().get(this.cars.selected);
    if (!r) return tagLine;
    const car = CAR_CATALOG.find((c) => c.key === this.cars.selected);
    if (r.tier === 'weak') {
      // name a machine they ALREADY OWN — "buy something else" is not advice
      let alt = null;
      for (const key of this.cars.owned) {
        const o = this._ratings().get(key);
        if (o && (!alt || o.score > alt.r.score)) alt = { key, r: o };
      }
      const altName = alt && alt.key !== car.key
        ? ` · TRY ${CAR_CATALOG.find((c) => c.key === alt.key).name}` : '';
      return `<div class="wc-fit weak">⚠ ${car.name} ${r.note}${altName}</div>`;
    }
    return `<div class="wc-fit ${r.tier}">${r.tier === 'strong' ? '★' : '•'} ${car.name} — ${r.note}</div>`;
  }

  /** Rebuild the parts of the world that depend on WHICH MODE you are in.
   *  Shared by setMode() and by anything that needs the mode furniture redone
   *  without touching the track itself. */
  _rebuildModeWorld() {
    for (const gsp of this.missionGates ?? []) this.worldLayer.remove(gsp.spr);
    this.missionGates = null;
    this.mission = null;
    // these all live in worldLayer, which a mode switch does NOT tear down —
    // only a level swap does — so each one has to be taken out by hand or it
    // haunts the next mode (roam turrets standing around a rally stage)
    for (const h of this.hostiles ?? []) h.mesh?.parent?.remove(h.mesh);
    this.hostiles = [];
    for (const c of this.choppers ?? []) c.mesh?.parent?.remove(c.mesh);
    this.choppers = [];
    for (const s of this.roamStars ?? []) s.spr?.parent?.remove(s.spr);
    this.roamStars = [];
    this.chopperTimer = 0;
    this.chopperWave = 0;
    // ...and the raider countdown, which was the one spawn timer nobody reset.
    // Measured, it held 24.4 s unchanged across four mode switches and four
    // race resets while chopperTimer correctly returned to its start value, so
    // a second free-roam session inherited a part-elapsed countdown instead of
    // a fresh one. It cannot fire in a race (the spawner is freeRoam-gated),
    // which is why it went unnoticed.
    this._raiderTimer = 25;
    this._resetFlashes();
    this._buildGunNests();
    this._buildRoamStars();
    this.resetRace();
  }

  /** Switch RACE / FREE ROAM / MISSIONS in place — no page reload.
   *
   *  These three used to navigate, which threw away the whole module graph and
   *  rebuilt the world from scratch to change two booleans. Everything that
   *  actually differs between the modes is mode furniture (gun nests, roam
   *  stars, mission gates, the start button, the picker), and all of it can be
   *  rebuilt in a frame. Returns false mid-race, where a swap is not safe.
   */
  setMode(id) {
    if (this.state === 'race' || this.state === 'countdown') return false;
    const flags = { race: [false, false], roam: [true, false], missions: [true, true] }[id];
    if (!flags) return false;
    if (this.freeRoam === flags[0] && this.missionMode === flags[1]) return true;

    this._flushPick?.();   // mode rebuilds the world — make it the picked one
    if (this.freeRoam && this.state !== 'title') this.bankRoamCredits();
    [this.freeRoam, this.missionMode] = flags;
    this.__missionDefs = null;      // targets are per-mode and per-world
    this._rebuildModeWorld();
    this._syncModeUI();
    this._softURL();
    return true;
  }

  /** Repaint everything in the menu that reads the current mode. */
  _syncModeUI() {
    const cur = this.missionMode ? 'missions' : this.freeRoam ? 'roam' : 'race';
    for (const chip of document.querySelectorAll('#mode-select .mode-chip')) {
      chip.classList.toggle('current', chip.dataset.mode === cur);
    }
    const sel = document.getElementById('mission-select');
    if (sel) sel.style.display = this.missionMode ? 'flex' : 'none';
    this._syncStartButton();
    if (this.missionMode) this._buildMissionPicker?.(); // also sets its own label
  }

  /** The start button says what will happen when you press it.
   *
   *  A button that looks armed and then refuses is worse than one that tells
   *  you first, so when the tyres are wrong it names the tyre the world wants
   *  and goes visibly cold. Repainted on every level pick, car pick, upgrade
   *  and mode switch — anything that can change the answer. */
  _syncStartButton() {
    const start = document.getElementById('start-btn');
    if (!start) return;
    // THE BUTTON NEVER BLOCKS ON TYRES ANY MORE. It states the price instead:
    // the wrong set costs grip, and grip is a number, not a prohibition.
    const f = this.freeRoam ? null : this.carFitness(this.level.id);
    const warned = !!(f && !f.ok);
    start.classList.remove('blocked');
    start.classList.toggle('warned', warned);
    // ...AND IT SAYS WHAT TO DO ABOUT IT. "Misleading message, as there is no
    // way to change tyres" — the button stated a penalty and named no remedy,
    // and until the tyre bay existed there genuinely was none for an
    // over-tyred car. It now carries the fix on a second line, which for the
    // common case is one free tap in the garage.
    const fixLine = f?.fix?.text ? `\n${f.fix.text}` : '';
    // A JOB IN HAND IS A REASON TO BE HERE, and a job for SOMEWHERE ELSE is a
    // reason not to be: the objective only rides on the world it names, so
    // starting anywhere else silently does not count toward it. Saying which
    // is the difference between a commitment and a thing you forgot you took.
    const job = this.freeRoam || this.missionMode ? null : this.activeJob();
    const jobLine = !job ? ''
      : job.lvId === this.level?.id ? `\nJOB: ${job.label} — ${job.text}`
        : `\nJOB IS AT ${job.lv.name} — THIS RACE WILL NOT COUNT FOR IT`;
    start.classList.toggle('has-job', !!job && job.lvId === this.level?.id);
    start.textContent = (warned
      ? `START — WRONG TYRES (−${f.pen}% GRIP)${fixLine}`
      : this.missionMode ? 'START MISSION'
        : this.freeRoam ? 'START EXPLORING' : 'START RACE') + jobLine;
  }

  /** Keep the address bar in step with the live state, without navigating, so
   *  a refresh or a shared link lands exactly where the player is. */
  _softURL() {
    try {
      const q = new URLSearchParams(location.search);
      q.set('level', String(this.level.id));
      if (this.missionMode) q.set('mode', 'missions');
      else if (this.freeRoam) q.set('mode', 'roam');
      else q.delete('mode');
      history.replaceState(null, '', `${location.pathname}?${q}`);
    } catch { /* history is never worth failing a transition over */ }
  }

  /** Come back to the title screen IN PLACE — the counterpart to startRace().
   *  Every exit path (pause > exit, results > garage, mission debrief, next
   *  level) routes through here instead of reloading the page. */
  /* ---- BACK ---------------------------------------------------------------
   *
   * ASKED FOR AS: "I need back button."
   *
   * There was no back ANYWHERE. Not a button, not Escape, and — the part that
   * actually bites on a phone — nothing on the browser's own back gesture, so
   * the only way out of a garage tab or a chapter was to find the control that
   * happened to lead there, and a swipe-back left the game entirely.
   *
   * One ladder, one handler, three ways to pull it: the button, the phone's
   * back gesture, and Escape. Naming the target separately from acting on it
   * is what lets the button HIDE when there is nothing above you, rather than
   * sitting there doing nothing — a back button that sometimes does nothing is
   * how a player stops trusting it.
   */

  /** Where does BACK go from here — a label, or null at the top. Ordered
   *  deepest-first, because these states nest: the editor sits over the menu,
   *  a chapter sits inside the tracks tab. */
  backTarget() {
    if (this.editor?.active) return { at: 'editor', label: 'LEAVE EDITOR' };
    if (this.state === 'finished') return { at: 'results', label: 'MENU' };
    if (!document.getElementById('pause-menu')?.classList.contains('hidden')) {
      return { at: 'pause', label: 'RESUME' };
    }
    // racing, or out in free roam: back is the pause menu, which is the screen
    // that holds every real exit
    if (this.state === 'race' || this.state === 'countdown') {
      return { at: 'racing', label: 'PAUSE' };
    }
    if (this.state === 'title') {
      const tab = ['mode', 'jobs', 'garage', 'settings']
        .find((t) => document.getElementById(`tab-btn-${t}`)?.classList.contains('current'));
      // inside a chapter, back is the chapter index — checked BEFORE the tab,
      // because the chapter is a level deeper than the tab that holds it
      if (!tab && this.tracksView === 'timeline' && this._chapterIn != null) {
        return { at: 'chapter', label: 'ALL CHAPTERS' };
      }
      if (tab) return { at: 'tab', label: 'TRACKS' };
    }
    return null;
  }

  /** Take one step up the ladder. Safe to call when there is nowhere to go. */
  goBack() {
    const t = this.backTarget();
    if (!t) return false;
    switch (t.at) {
      case 'editor': this.editor.exit(); break;
      case 'results': this.showMenu(); break;
      // there is no separate resume — the pause menu is a toggle
      case 'pause': case 'racing': this.togglePause?.(); break;
      // back to the index lands you at the TOP of it — leaving a chapter from
      // 900px down and arriving 900px down a different list is a lost player
      case 'chapter':
        this._chapterIn = null;
        this._renderLevelCards();
        { const sc = document.getElementById('title-screen'); if (sc) sc.scrollTop = 0; }
        break;
      case 'tab': document.getElementById('tab-btn-race')?.click(); break;
      default: return false;
    }
    this._syncBackBtn();
    return true;
  }

  /** ONE BACK BUTTON, IN ONE PLACE, SAYING ONE WORD.
   *
   *  It used to be two: a header button on the tabs and a differently-worded
   *  bar inside a chapter. Measured, that put the control at y=92 on GARAGE,
   *  y=152 on MODE, y=8 inside a chapter, and nowhere at the chapter index —
   *  and the first two scrolled away with the page. A control that moves is a
   *  control you have to hunt for, which is what "I miss the back button" was
   *  about.
   *
   *  So the bar is up in EVERY menu state that has a level above it, the
   *  button always reads BACK, and the label beside it says where you are —
   *  `backTarget` already knows where the tap lands.
   */
  /** THE BALANCE, wherever it is being shown. It lives in the top bar now, so
   *  it is on screen during a race debrief and every menu tab — and a stale
   *  number there is worse than the old one that scrolled away, because this
   *  one is always in view. Called from every path that moves it. */
  _syncCredits() {
    const el = document.getElementById('credits');
    if (el) el.textContent = this.garage.credits.toLocaleString();
  }

  _syncBackBtn() {
    const t = this.backTarget();
    // THE BAR IS UP FOR THE WHOLE MENU, not only when there is a way back. It
    // carries the wordmark and the credit balance now, and both were asked for
    // as "always visible" — a balance you have to scroll up to read is no use
    // on a screen whose whole job is spending it.
    const inMenu = this.state === 'title';
    const canBack = !!t && inMenu;
    const inChapter = canBack && t.at === 'chapter';
    const bar = document.getElementById('topbar');
    if (bar) bar.classList.toggle('hidden', !inMenu);
    const back = document.getElementById('topbar-back');
    // BACK still comes and goes — it is the one thing here that leads
    // somewhere, and a dead one at the front door is a button that lies.
    if (back) back.classList.toggle('hidden', !canBack);
    const where = document.getElementById('topbar-where');
    const stars = document.getElementById('topbar-stars');
    if (inMenu && !inChapter && where) {
      const tab = document.querySelector('#menu-tabs .menu-tab.current');
      const onTracks = !tab || tab.id === 'tab-btn-race';
      // WHERE YOU ARE, and at the front door that is the game itself — which
      // is why the wordmark lives in this slot rather than in a fourth one the
      // 320px phone has no room for.
      where.innerHTML = canBack && tab && !onTracks
        ? `<b>${tab.textContent.trim()}</b>`
        : '<b class="tb-brand">IGNITE RALLY</b>';
      if (stars) stars.textContent = '';
    }
    const ts = document.getElementById('title-screen');
    if (ts) {
      ts.classList.toggle('with-topbar', inMenu);
      ts.classList.toggle('compact', inMenu);
    }
  }

  /** THE PHONE'S OWN BACK GESTURE  /** THE PHONE'S OWN BACK GESTURE, which is the one people actually use.
   *
   *  A single-page game gets ONE history entry, so the first swipe-back leaves
   *  the site — mid-race, mid-chapter, whatever. This keeps a spare entry on
   *  the stack and consumes it: while there is somewhere to go, back goes
   *  there and the entry is replaced.
   *
   *  IT DELIBERATELY STOPS TRAPPING at the top of the ladder. Re-pushing
   *  forever would make the game impossible to leave, which is a worse bug
   *  than the one this fixes — so when `backTarget` returns null the entry is
   *  not replaced and the next back does what the player expects.
   */
  _wireBack() {
    document.getElementById('topbar-back')?.addEventListener('click', () => this.goBack());
    window.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (document.activeElement?.tagName === 'INPUT') return;   // fields own Escape
      if (this.goBack()) e.preventDefault();
    });
    const arm = () => {
      try { history.pushState({ ir: 1 }, ''); } catch { /* file:// */ }
    };
    window.addEventListener('popstate', () => {
      if (this.goBack()) arm();     // consumed it — keep one in hand
    });
    arm();
    this._syncBackBtn();
  }

  showMenu(tab = null) {
    document.getElementById('results')?.classList.add('hidden');
    document.getElementById('pause-menu')?.classList.add('hidden');
    document.getElementById('touch-ui')?.classList.remove('on');
    this.hud.hide();
    this.state = 'title';
    this._rebuildModeWorld();
    const ts = document.getElementById('title-screen');
    ts?.classList.remove('hidden');
    this._renderLevelCards();
    this.renderGarage();
    this.renderCarShop();
    this._syncModeUI();
    this._renderProfiles?.();
    if (tab) document.getElementById(`tab-btn-${tab}`)?.click();
    else document.getElementById('tab-btn-race')?.click();
    if (ts) ts.scrollTop = 0;
    this._syncBackBtn();
    this._softURL();
  }

  /** Stop anything the menu was animating. Called on the way into a race —
   *  the shop floor must not keep drawing behind a world. */
  _menuIdle() { this._stageRun(false); }

  /** Push the current track's theme into the renderer: fog, the two lights,
   *  the key direction and the IBL dome. Split out of the constructor because
   *  swapping level has to redo every one of these — a new world under the old
   *  world's fog and sun is exactly the "it still looks like the last track"
   *  bug this would otherwise ship with. */
  /** HEADLIGHTS FOLLOW THE WORLD, and they are switched HERE because a car
   *  can outlive a level and the player's car is built before its first one.
   *  Called from `_applyTheme`, which every world change goes through. */
  _syncCarLights() {
    const dark = worldIsDark(this.track?.T ?? this.track?.theme);
    const all = [this.player, ...(this.enemies ?? [])];
    for (const c of all) {
      const lt = c?.mesh?.userData?.carLights;
      if (lt) lt.visible = dark;
      if (c) c._litFor = this.track;
    }
  }

  _applyTheme() {
    const th = this.track.theme;
    this._syncCarLights();
    if (th) {
      if (th.fogColor !== undefined) {
        // same near-plane pull as the track ctor (aerial layering), local only
        const fn = th.fogNear ?? 320;
        this.scene.fog = new THREE.Fog(th.fogColor,
          Math.max(fn * 0.72, Math.min(fn, 190)), th.fogFar ?? 1500);
      }
      if (th.hemiSky !== undefined) this.hemi.color.setHex(th.hemiSky);
      if (th.hemiGround !== undefined) {
        this.hemi.groundColor.setHex(th.hemiGround);
        // GROUND BOUNCE HAS A COLOUR. The reference's shadow sides pick up
        // the ground's own hue; a desaturated bounce is why shaded faces read
        // grey. Saturation only - lightness untouched so nothing brightens -
        // and faded out on the few very-hot-hemi worlds where it would tint.
        const w = 1 - THREE.MathUtils.smoothstep(th.hemiIntensity ?? 1, 1.6, 2.6);
        if (w > 0) {
          const hsl = { h: 0, s: 0, l: 0 };
          this.hemi.groundColor.getHSL(hsl);
          this.hemi.groundColor.setHSL(hsl.h, Math.min(1, hsl.s * (1 + 0.22 * w)), hsl.l);
        }
      }
      if (th.hemiIntensity !== undefined) this.hemi.intensity = th.hemiIntensity;
      if (th.sunColor !== undefined) this.moon.color.setHex(th.sunColor);
      if (th.sunIntensity !== undefined) this.moon.intensity = th.sunIntensity;
      // the vignette breathes with the world: bright hazy worlds take a
      // firmer edge (it is what focuses the road in the reference), dark
      // night worlds keep a light one so the frame edge stays readable
      if (this.grade && this.grade.uniforms && this.grade.uniforms.uVig) {
        const fc = new THREE.Color(th.fogColor ?? 0x888888);
        const fl = 0.2126 * fc.r + 0.7152 * fc.g + 0.0722 * fc.b;
        this.grade.uniforms.uVig.value = Math.min(0.38,
          0.26 + 0.10 * THREE.MathUtils.smoothstep(fl, 0.15, 0.45));
      }
      // key direction agrees with the sun the player can actually see
      if (th.sunAz !== undefined) {
        const az = th.sunAz;
        const el = THREE.MathUtils.clamp((th.sunEl ?? 0.3) * 0.55 + 0.52, 0.58, 0.81);
        const D = 168;
        this._sunOffset.set(
          Math.cos(az) * Math.cos(el) * D, Math.sin(el) * D, Math.sin(az) * Math.cos(el) * D
        );
        // ...AND SEAT THE RIG NOW, not only per frame. The follow lives at the
        // tail of _updateCamera, which only runs while you are driving — so on
        // the TITLE SCREEN the shadow light still sat at its construction
        // default (0,1,0) and every shadow pointed somewhere the sun is not.
        // Found on FURKA RIDGE, where the tyre gate refuses the stock car and
        // the world therefore idles on the menu: shadows 41.3 deg off the
        // drawn sun, every time. Any world browsed from the menu had it.
        const at = this.player?.pos ?? this.track?.center?.[0];
        if (at) {
          this.moon.position.set(at.x + this._sunOffset.x, at.y + this._sunOffset.y,
            at.z + this._sunOffset.z);
          this.moon.target.position.set(at.x, at.y, at.z);
        }
      }
    }
    // image-based lighting: a tiny theme-tinted gradient dome through PMREM.
    // Standard materials pick up soft sky reflections (glossy wet roads, car
    // paint sheen). Dimmed at bake time — r160 has no scene.environmentIntensity.
    {
      // dimmer than it was: the IBL is a THIRD ambient term on top of the
      // hemisphere, and at the old strength it re-filled every shadow the
      // key/fill rebalance had just opened up. It is here for sheen on paint
      // and wet road, not for lighting the world.
      const top = new THREE.Color(th?.skyTop ?? '#68b7e8').multiplyScalar(0.34);
      const hor = new THREE.Color(th?.skyHorizon ?? '#dff0fa').multiplyScalar(0.30);
      const gnd = new THREE.Color(th?.hemiGround !== undefined ? th.hemiGround : 0x5a8a3c).multiplyScalar(0.20);
      const cnv = document.createElement('canvas'); cnv.width = 2; cnv.height = 64;
      const cx = cnv.getContext('2d');
      const gr = cx.createLinearGradient(0, 0, 0, 64);
      gr.addColorStop(0, '#' + top.getHexString());
      gr.addColorStop(0.5, '#' + hor.getHexString());
      gr.addColorStop(0.56, '#' + gnd.getHexString());
      gr.addColorStop(1, '#' + gnd.multiplyScalar(0.6).getHexString());
      cx.fillStyle = gr; cx.fillRect(0, 0, 2, 64);
      const envTex = new THREE.CanvasTexture(cnv);
      envTex.colorSpace = THREE.SRGBColorSpace;
      const pmrem = new THREE.PMREMGenerator(this.renderer);
      const dome = new THREE.Mesh(
        new THREE.SphereGeometry(10, 16, 12),
        new THREE.MeshBasicMaterial({ map: envTex, side: THREE.BackSide }));
      const envScene = new THREE.Scene();
      envScene.add(dome);
      this.scene.environment = pmrem.fromScene(envScene, 0.06).texture;
      pmrem.dispose(); dome.geometry.dispose(); dome.material.dispose(); envTex.dispose();
    }
  }

  /** Fade to black, then navigate — used for level changes. Saves the menu's
   *  tab + scroll so the title screen comes back exactly where you left it
   *  instead of resetting to the top. */
  fadeTo(url, forceTab = null) {
    try {
      sessionStorage.setItem('ir-menu-state', JSON.stringify({
        tab: forceTab ?? (['garage', 'settings', 'mode'].find(
          (t) => document.getElementById(`tab-btn-${t}`)?.classList.contains('current')) ?? 'race'),
        scroll: document.getElementById('title-screen')?.scrollTop ?? 0,
      }));
    } catch { /* private mode */ }
    document.getElementById('fade').classList.add('dark');
    setTimeout(() => { location.href = url; }, 480);
  }

  /** Restore the saved menu tab + scroll after a selection reload. */
  _restoreMenuState() {
    try {
      const raw = sessionStorage.getItem('ir-menu-state');
      if (!raw) return;
      sessionStorage.removeItem('ir-menu-state');
      const st = JSON.parse(raw);
      if (st.tab && st.tab !== 'race') document.getElementById(`tab-btn-${st.tab}`)?.click();
      const ts = document.getElementById('title-screen');
      if (ts && st.scroll) requestAnimationFrame(() => { ts.scrollTop = st.scroll; });
    } catch { /* ignore */ }
  }

  /** Swap the player's machine in place — no reload, no menu reset. */
  swapPlayerCar(entry) {
    const p = this.player;
    this.scene.remove(p.mesh);
    const mesh = buildCarMesh(entry.spec);
    mesh.position.copy(p.mesh.position);
    mesh.rotation.copy(p.mesh.rotation);
    this.scene.add(mesh);
    p.mesh = mesh;
    p.catalogKey = entry.key;
    p._popped = [];
    p._litFor = null;      // fresh mesh, fresh lamps: re-decide on the new rig
    this._syncCarLights();
    p.maxSpeed = entry.stats.maxSpeed;
    p.accel = entry.stats.accel;
    p.grip = entry.stats.grip;
    // r312 MACHINES DIFFER: steering authority and drift response follow
    // the machine too, not just the engine — same reads as the build path.
    p.steerRate = entry.stats.steer ?? 2.5;
    p.driftLag = entry.stats.driftL ?? 0.22;
    p.maxHealth = entry.stats.health;
    p.offroadSkill = entry.stats.offroad;
    p.nitroPower = entry.stats.nitroPower ?? 1;
    p.plating = entry.stats.plating ?? 1;
    this._base = null; // applyUpgrades recaptures the new machine's baseline
    this.applyUpgrades();
    p.health = p.maxHealth;
  }

  /** The world that must be podiumed to open `id` — the one BEFORE it in
   *  career order, which is the order of the LEVELS array and NOT `id - 1`.
   *  Those were the same thing until ROCKFALL RAVINE moved; ids stay fixed so
   *  saved careers, preview art and the DEMANDS table all keep working. */
  _prevLevel(id) {
    const i = LEVELS.findIndex((l) => l.id === id);
    return i > 0 ? LEVELS[i - 1] : null;
  }

  /** ---- RALLY STARS ----------------------------------------------------
   *  The career used to be a single chain: podium world N or you never see
   *  N+1. One track you could not crack ended the game, which is exactly what
   *  happened on ROCKFALL RAVINE.
   *
   *  Stars replace the chain with a bank. Every world is worth up to THREE, you
   *  keep your best ever on each, and the total opens worlds by threshold — so
   *  you pick what to race, anything you race pays into everything else, and a
   *  world you have already beaten is still worth returning to for the stars
   *  you left behind.
   *
   *      ★    FINISH   cross the line at all
   *      ★★   PODIUM   top three
   *      ★★★  WIN      first
   *
   *  THREE and not five, and that is a measured decision. Driving clean and
   *  sweeping the contracts were stars in the first cut, which put a 5× spread
   *  between what an ace and a finisher bank per race — and no single
   *  threshold curve survives that. Simulated over the full roster, any slope
   *  gentle enough to keep a finish-only driver moving let an ace open all 21
   *  worlds in FOUR races. At 3 the spread is 3× and both ends work. Clean runs
   *  and contract sweeps pay CREDITS instead, where a wide spread is harmless.
   */
  starsFor(rec) {
    if (!rec) return 0;
    if (rec.stars != null) return Math.min(3, rec.stars);
    // careers saved before stars existed only recorded a place; grant what
    // that place proves, so nobody is demoted by the update
    const p = rec.place ?? 99;
    return p <= 1 ? 3 : p <= 3 ? 2 : p < 99 ? 1 : 0;
  }

  starsIn(rank) {
    if (rank === 1) return 3;
    if (rank <= 3) return 2;
    return rank > 0 ? 1 : 0;
  }

  totalStars() {
    let n = 0;
    for (const lv of LEVELS) n += this.starsFor(this.career.finished[lv.id]);
    return n;
  }

  /** What `id` costs to open — by CAREER POSITION, so the roster still unrolls
   *  in a sensible order while you choose the route through it.
   *
   *  THE RUNG is the position; LADDER_SLOPE is what a rung costs. The slope
   *  used to be exactly 1★ per rung and that was load-bearing, because the
   *  ONLY guarantee against a wall was "a finish banks 1★, so a finisher
   *  always earns a rung a race". Simulated over the real 60-world price
   *  table, that slope opens 19 worlds after three races and 58 of 60 after
   *  ten — the whole roster is on the table before the player has met a
   *  quarter of it. Reported as "tracks are opening too fast".
   *
   *  The wall is now closed by a rule instead of by a number (see
   *  `_freeUnlock`): clear everything that is open and the next world opens
   *  regardless of stars, and a world you have already raced never re-locks.
   *  With that floor underneath, the slope is free to be a difficulty knob.
   *  Simulated across the three player profiles (win every race / podium
   *  every race / finish last every race), worlds open after 3 / 6 / 10 / 20
   *  races:
   *      slope 1.0  19/39/58/60   12/27/43/60   6/12/22/43   ← shipped before
   *      slope 2.0   7/19/33/58    6/12/22/43   4/ 7/11/22
   *      slope 2.5   6/14/27/51    5/ 7/17/35   4/ 7/11/21   ← shipped now
   *      slope 3.0   6/12/22/43    5/ 7/12/29   4/ 7/11/21
   *  All three profiles still reach 60/60 at every slope — that is the floor
   *  doing its job. 2.5 was taken because it is the point where a winner
   *  spends about twenty races unrolling the roster instead of ten, while the
   *  worst driver in the game is unaffected: their pace is pinned at one
   *  world a race by the floor, not by the price.
   *
   *  AND THEN 2.5 WAS ASKED FOR BACK THE OTHER WAY. At 2.5 a rung costs two
   *  and a half stars, so a star buys less than half a world and the board
   *  reads as a row of four-figure walls: on the save that prompted this,
   *  16 stars against neighbours priced 55, 58, 60 and 63 — "39 TO GO" on the
   *  very next card. Asked for directly: "open a few tracks per star earned,
   *  not five, six like we're doing now."
   *
   *  0.5 inverts the unit. A rung costs half a star, so ONE star opens about
   *  TWO worlds, and the same neighbours price at 11, 12, 12 and 13. This is
   *  deliberately the opposite call to the one r178 made on the same number
   *  after "tracks are opening too fast" — the roster has since grown and the
   *  complaint reversed, and a knob that was set by report is being reset by
   *  report. The floor and the never-re-lock rule are untouched, so nothing
   *  below depends on the value.
   *
   *  The first three are free, so there is a real choice from the very first
   *  race. Deliberately written as a relation and not a fixed number, which
   *  was true of a 21-world roster and quietly stopped being true as worlds
   *  were appended.
   *
   *  The slope multiplies a level's OWN `cost` too. A per-level price is a
   *  statement about where in the career that world sits (see the
   *  MEDITERRANEAN note in the level table), not about how steep the ladder
   *  is, so scaling both keeps the running order identical and moves only the
   *  pace. */
  starCost(id) {
    const i = LEVELS.findIndex((l) => l.id === id);
    // a level may carry its own rung — see the MEDITERRANEAN note in the
    // level table for why new regions must not inherit the append-only slope
    const rung = LEVELS[i]?.cost != null ? LEVELS[i].cost : (i < 3 ? 0 : i - 2);
    return Math.round(rung * LADDER_SLOPE);
  }

  /* THE OLD PER-WORLD FLOOR (`_freeUnlock`) LIVED HERE and is gone with the
   * price ladder it propped up. Its guarantee is not gone: it was "clear
   * everything you can afford and the cheapest world you cannot opens anyway",
   * and it is now "race a chapter out and the next chapter opens anyway" —
   * see `isChapterOpen`. Do not reintroduce a per-world grant on top of the
   * chapter gate: two floors under one career is how a player ends up looking
   * at a card that is open for a reason the board cannot explain.
   */

  /* ---- CHAPTERS ---------------------------------------------------------
   *
   * The career is read in parts now (see CHAPTERS in track.js). One gate per
   * chapter; inside an open chapter every world is raceable immediately.
   *
   * Everything below is DERIVED on every call from `career.finished`, never
   * stored. That is what lets an existing save carry straight over: a player
   * mid-way up the old star ladder already has the finishes, so their chapter
   * standing computes without a migration step.
   */

  /** The chapter spans, computed once per session — `chapterSpans` walks the
   *  whole roster and this is called from render loops and card builders. */
  chapters() {
    return (this._chapterCache ??= chapterSpans().map((c, k) => ({ ...c, _k: k })));
  }

  /** Which chapter a world belongs to, as an index into `chapters()`.
   *  -1 for a level not on the roster (the editor can stand one up). */
  chapterOf(id) {
    const ch = this.chapters();
    for (let k = 0; k < ch.length; k++) {
      if (ch[k].levels.some((l) => l.id === id)) return k;
    }
    return -1;
  }

  /** Stars banked inside one chapter, and the most it can hold. */
  chapterStars(k) {
    const c = this.chapters()[k];
    if (!c) return 0;
    return c.levels.reduce((n, l) => n + this.starsFor(this.career.finished[l.id]), 0);
  }

  /** WHAT THE NEXT CHAPTER COSTS — a FRACTION of the chapter you are in, not
   *  a constant.
   *
   *  A flat number cannot serve both a 3-world chapter and a 15-world one: set
   *  it for the small one and the big one opens after a fifth of its content,
   *  set it for the big one and the small one is a wall. Scaling with the
   *  chapter keeps the ASK the same everywhere — "take about 60 % of what is
   *  on this table" — which is roughly two podiums in three starts, and reads
   *  the same on every chapter of the roster. */
  chapterNeed(k) {
    const c = this.chapters()[k];
    if (!c) return 0;
    return Math.ceil(c.levels.length * 3 * CHAPTER_GATE);
  }

  /** IS THIS CHAPTER OPEN — and the floor that stops the career stalling.
   *
   *  The first chapter is always open. After that a chapter opens when the
   *  previous one has paid its gate.
   *
   *  ...OR when the previous chapter has been RACED OUT. This is the same
   *  guarantee the old star ladder's `_freeUnlock` made, restated for
   *  chapters, and it is not optional: the gate asks for 1.8 stars a world
   *  while a driver who only ever FINISHES banks exactly 1, so without a floor
   *  that player is walled in permanently at chapter 2. With it, the rule a
   *  player can actually feel is: drive well and move on early, or drive
   *  EVERYTHING and move on anyway. Progress is never slower than one chapter
   *  per full chapter raced. */
  isChapterOpen(k) {
    if (this.unlockAll) return true;
    if (k <= 0) return true;
    const prev = this.chapters()[k - 1];
    if (!prev) return true;
    if (this.chapterStars(k - 1) >= this.chapterNeed(k - 1)) return true;
    return prev.levels.every((l) => this.career.finished[l.id]);   // the floor
  }

  /** The furthest chapter currently open, as an index. */
  currentChapter() {
    const ch = this.chapters();
    let last = 0;
    for (let k = 0; k < ch.length; k++) if (this.isChapterOpen(k)) last = k;
    return last;
  }

  isLevelUnlocked(id) {
    if (this.unlockAll) return true;
    // a world you have raced is yours — it must never show a padlock again
    if (this.career.finished[id]) return true;
    const k = this.chapterOf(id);
    // a world off the roster (an editor scene) is not gated by a chapter
    if (k < 0) return true;
    return this.isChapterOpen(k);
  }

  /** WHERE YOU ARE UP TO — one answer, used by everything.
   *
   *  The roster is a ladder: career order is the LEVELS array and the price
   *  rises a fixed number of stars per rung (see `starCost`). That makes "the next
   *  track" a real, derivable thing rather than a guess, and it is what the
   *  timeline scrolls to, badges, and counts up to. Derived on every call,
   *  never stored, so it cannot drift from the unlock rule.
   *
   *  Three answers in priority order, because they are three different
   *  situations and a player in each wants a different card put in front of
   *  them:
   *    'unraced' — the first rung you can enter and have never driven. The
   *                overwhelmingly common case, and the one people mean.
   *    'stars'   — everything open has been driven, but one still has stars
   *                on the table. Going back for those is now the way forward.
   *    'locked'  — nothing open is outstanding, so the next thing that
   *                matters is what you are working TOWARD. Showing a shut
   *                gate is honest here; showing nothing is not.
   */
  nextTrack() {
    const fin = this.career.finished;
    // WITHIN THE CURRENT CHAPTER FIRST. The chapter is the unit of progress
    // now, so "what next" is a question about the chapter you are standing in
    // — offering a world from three chapters back because it happens to sit
    // earlier in the array would undo the structure the chapters exist for.
    const ch = this.chapters();
    const here = this.currentChapter();
    const scan = [ch[here], ...ch.slice(0, here)].filter(Boolean);
    for (const c of scan) {
      const lv = c.levels.find((l) => this.isLevelUnlocked(l.id) && !fin[l.id]);
      if (lv) return { lv, why: 'unraced' };
    }
    // everything open has been driven — the way forward is back, for stars
    for (const c of scan) {
      const lv = c.levels.find((l) => this.isLevelUnlocked(l.id)
        && this.starsFor(fin[l.id]) < 3);
      if (lv) return { lv, why: 'stars' };
    }
    // nothing outstanding: show the gate being worked toward. With the floor
    // in place this is only reachable once a chapter is fully three-starred.
    const shut = ch[here + 1];
    if (shut) return { lv: shut.levels[0], why: 'locked' };
    return null;
  }

  /** The one header the board gets, and it earns its line by counting: which
   *  chapter you are in, how far through the roster that puts you, and how
   *  much of it you have actually cleared. */
  _ladderHeading() {
    const ch = this.chapters();
    const here = this.currentChapter();
    const c = ch[here];
    const open = LEVELS.filter((l) => this.isLevelUnlocked(l.id)).length;
    const done = LEVELS.filter((l) => this.starsFor(this.career.finished[l.id]) >= 3).length;
    return `CHAPTER ${c ? c.n : 1} OF ${ch.length} · ${c ? c.name : ''}`
      + ` · ${open} OF ${LEVELS.length} WORLDS OPEN · ${done} CLEARED`;
  }

  /** The one line that says where the next gate is and what it costs, in the
   *  chapter's own terms. Returns null once every chapter is open. */
  chapterGateLine() {
    const ch = this.chapters();
    const here = this.currentChapter();
    const next = ch[here + 1];
    if (!next) return null;
    const have = this.chapterStars(here);
    const need = this.chapterNeed(here);
    const left = Math.max(0, need - have);
    const unraced = ch[here].levels.filter((l) => !this.career.finished[l.id]).length;
    // Both ways through the gate are stated, because both are real and a
    // player who cannot podium needs to know the second one exists.
    return left === 0
      ? `CHAPTER ${next.n} · ${next.name} IS OPEN`
      : `${left}★ MORE IN THIS CHAPTER OPENS CHAPTER ${next.n} · ${next.name}`
        + (unraced ? ` — OR RACE ALL ${unraced} LEFT HERE` : '');
  }

  /** REGIONS (the browsing view) or TIMELINE (the progression view).
   *  Timeline is the default: on a 60-world roster the question a player
   *  actually arrives with is "what do I race next", and only career order
   *  answers it. */
  _loadTracksView() {
    try { return localStorage.getItem('ir-tracks-view') === 'regions' ? 'regions' : 'timeline'; }
    catch { return 'timeline'; }
  }

  _setTracksView(v) {
    this.tracksView = v === 'regions' ? 'regions' : 'timeline';
    try { localStorage.setItem('ir-tracks-view', this.tracksView); } catch { /* private mode */ }
    this._renderLevelCards();
    this._scrollToNextTrack('auto');
  }

  /** Put the next rung in front of the player instead of making them hunt for
   *  it. Lands the card a third of the way down rather than hard against the
   *  top edge, so the rungs you already cleared stay visible above it — that
   *  context is most of what a progression view is for. */
  _scrollToNextTrack(behavior = 'smooth') {
    const n = this.nextTrack();
    if (!n) return null;
    // AT THE CHAPTER INDEX THERE IS NO WORLD CARD TO SCROLL TO, and the right
    // answer is not to enter a chapter on the player's behalf — arriving at
    // the tracks tab should show them the map. The index's equivalent of "your
    // next track is here" is the chapter that holds it, so scroll to THAT card
    // and return the world id anyway: callers ask this for the id, and the
    // answer to "what is next" does not change with which page is showing.
    const k = this.chapterOf(n.lv.id);
    const card = document.querySelector(`#level-select .level-chip[data-lvid="${n.lv.id}"]`)
      || (k >= 0 ? document.querySelector(
        `#level-select .chapter-card[data-chn="${this.chapters()[k]?.n}"]`) : null);
    if (!card) return null;
    // a card the current filter has hidden is not somewhere to scroll to
    if (card.classList.contains('wf-out')) return null;
    const scroller = card.closest('.screen');
    if (!scroller) return null;
    const cRect = card.getBoundingClientRect();
    const sRect = scroller.getBoundingClientRect();
    const top = scroller.scrollTop + (cRect.top - sRect.top) - scroller.clientHeight * 0.33;
    scroller.scrollTo({ top: Math.max(0, top), behavior });
    return n.lv.id;
  }

  /** SAY HOW STARS ARE EARNED, WHERE THEY ARE SPENT.
   *
   *  The award rule — finish / podium / win — was only ever written on the
   *  post-race panel, which appears AFTER the decision it should inform. The
   *  track list, meanwhile, was full of cards reading "NEEDS 27★ — 13 TO GO"
   *  at a player with no way to know what a star costs to earn, or that the
   *  three they left on a world they already beat are still there for the
   *  taking. Reported as: "How do you earn the stars? That needs to be clear."
   *
   *  Everything here is derived, never stored: the totals and the next
   *  threshold come from the same `starsFor` / `starCost` the unlock check
   *  uses, so the legend cannot describe a rule the game does not follow.
   */
  _renderStarKey() {
    const el = document.getElementById('star-key');
    if (!el) return;
    const now = this.totalStars();
    const max = LEVELS.length * 3;
    // Worlds you have RACED and not maxed out — the ones with stars still on
    // the table. The `finished` check is the point: without it a fresh career
    // reported "3 WORLDS STILL HOLDING STARS" about three worlds nobody had
    // entered yet, which reads as a nag rather than as unfinished business.
    const partial = LEVELS
      .filter((lv) => this.career.finished[lv.id] && this.starsFor(this.career.finished[lv.id]) < 3)
      .length;
    // WHAT THE STARS ARE FOR, NOW THAT THEY BUY CHAPTERS AND NOT WORLDS.
    // This used to quote the next world's price, which was the truth under the
    // old per-world ladder and is a lie under chapters — no single world has a
    // price any more. `chapterGateLine` is the one sentence that is still true.
    const gate = this.chapterGateLine();
    const RULES = [['★', 'FINISH — ANY PLACE'], ['★★', 'PODIUM — TOP 3'], ['★★★', 'WIN IT']];
    // FOLDED BY DEFAULT, because a legend is read once and then it is furniture:
    // five lines of it sat between the tabs and the first world card on every
    // visit. What stays up is the running total and the gate line — the two
    // numbers that actually move. The rules are one tap below.
    if (this._starKeyOpen == null) {
      try { this._starKeyOpen = localStorage.getItem('ir-starkey') === '1'; } catch { this._starKeyOpen = false; }
    }
    const open = this._starKeyOpen;
    el.className = open ? 'open' : '';
    el.innerHTML = `
      <div class="sk-top">
        <span class="sk-total">${now}<small>/${max}★</small></span>
        <span class="sk-brief"><b>★</b> FINISH · <b>★★</b> PODIUM · <b>★★★</b> WIN</span>
        <span class="sk-more">${open ? 'LESS ▴' : 'HOW ▾'}</span>
      </div>
      <div class="sk-full">
        <span class="sk-title">RALLY STARS — HOW THEY ARE EARNED</span>
        <div class="sk-rules">
          ${RULES.map(([s, t]) => `<span class="sk-rule"><b>${s}</b>${t}</span>`).join('')}
        </div>
      </div>
      <div class="sk-next">${gate
    ? gate
    : 'EVERY CHAPTER IS OPEN — THE REMAINING STARS ARE FOR THE RECORD'}${
  partial ? ` · ${partial} WORLD${partial === 1 ? '' : 'S'} STILL HOLDING STARS` : ''}</div>`;
    // The whole box is the hit target — a 10px chevron is not a phone control.
    // Bound here rather than once at boot because this method replaces the
    // innerHTML, but the listener is on `el` itself, which survives that.
    if (!el.dataset.wired) {
      el.dataset.wired = '1';
      el.addEventListener('click', () => {
        this._starKeyOpen = !this._starKeyOpen;
        try { localStorage.setItem('ir-starkey', this._starKeyOpen ? '1' : '0'); } catch { /* private mode */ }
        this._renderStarKey();
      });
    }
  }

  /** World cards: static circuit-outline badge + flavor + career best per
   *  level, grouped under region headers (region order = first appearance).
   *  The .wc-map badge is card decoration ONLY — never a HUD map (RULES §0).
  /** MY SCENES — the worlds the owner built, above the shipped roster.
   *
   *  A saved scene is a base level plus its edits, so launching one is a level
   *  load with `editScene` primed: no new world id, no career entry, nothing
   *  in the star economy. They sit at the top because a tool you cannot find
   *  your own work in is not a tool. The row is absent entirely when nothing
   *  has been saved, so a player who never opens the editor never sees it. */
  _renderSceneCards(sel) {
    // through WorldEditor, so the track list reads the SAME profile-scoped
    // store the editor writes and the sync engine carries
    const scenes = WorldEditor.list(this);
    const names = Object.keys(scenes);
    if (!names.length) return;
    const head = document.createElement('div');
    head.className = 'region-head';
    head.textContent = 'MY SCENES';
    sel.appendChild(head);
    const row = document.createElement('div');
    row.className = 'region-row';
    sel.appendChild(row);
    for (const name of names) {
      const data = scenes[name];
      const base = LEVELS.find((l) => l.id === data.base);
      const card = document.createElement('button');
      card.className = 'level-chip scene-chip';
      card.innerHTML = `<div class="wc-name">${name}</div>`
        + `<div class="wc-sub">${base ? base.name : 'WORLD ' + data.base}`
        + ` · ${(data.dabs || []).length} edits · ${(data.elements || []).length} objects</div>`
        + '<div class="wc-del" title="delete this scene">✕</div>';
      card.addEventListener('click', (ev) => {
        // DELETE. A world you made is yours to throw away, and there was no
        // way to do it at all — saved scenes accumulated with no bin.
        if (ev.target.classList.contains('wc-del')) {
          ev.stopPropagation();
          if (!card.classList.contains('confirm')) {
            // two taps, because this cannot be undone and the card is small
            card.classList.add('confirm');
            card.querySelector('.wc-del').textContent = 'DELETE?';
            setTimeout(() => {
              card.classList.remove('confirm');
              const x = card.querySelector('.wc-del');
              if (x) x.textContent = '✕';
            }, 3000);
            return;
          }
          WorldEditor.remove(name, this);
          // if the world you just deleted is the one standing, get off it
          if (this.editScene && this.level && base && this.level.id === base.id) {
            this.swapLevel(base, true, null);
          }
          this._renderLevelCards();
          this.hud?.feed?.(`DELETED ${name}`, 'bad');
          return;
        }
        if (!base) return;
        // same veil-then-build as a track pick: the swap is a seconds-long
        // synchronous world build and must not run before the tap has painted
        this._pendingPick = null;
        clearTimeout(this._pickTimer);
        const veil = document.getElementById('build-veil');
        if (veil) { veil.textContent = `BUILDING ${name} …`; veil.classList.add('on'); }
        setTimeout(() => {
          if (!this.editor) this.editor = new WorldEditor(this);
          this.editor.load(data);
          // the edits travel WITH the request — see swapLevel
          this.swapLevel(base, true, this.editor.buildPayload());
          this.hud?.feed?.(name, 'good');
          veil?.classList.remove('on');
        }, 60);
      });
      row.appendChild(card);
    }
  }

  /** FILTERS. Fifty-eight worlds in one scroll is a list you hunt through.
   *
   *  The bar is built once and then only ever toggled: filtering hides cards
   *  with a class instead of re-rendering the list, so the lazy preview-image
   *  observers survive a filter change and a world you have already scrolled
   *  to keeps its art. The chips themselves come from FILTER_GROUPS and the
   *  per-world facets from `worldFacets`, so neither list is hand-maintained.
   *
   *  The choice persists, which is the whole point of a filter you set once —
   *  and is exactly why the count line below it is not optional: "SHOWING 9 OF
   *  58" is what stops a filter left on last week from reading as lost worlds. */
  _loadFilters() {
    const F = { q: '' };
    for (const g of FILTER_GROUPS) F[g.key] = new Set();
    try {
      const s = JSON.parse(localStorage.getItem('ir-filters') || '{}');
      for (const g of FILTER_GROUPS) {
        const known = new Set(g.tags.map(([t]) => t));
        // drop anything this build no longer has a chip for, so a stored
        // filter can never hide the whole list with a tag nothing carries
        for (const t of (s[g.key] || [])) if (known.has(t)) F[g.key].add(t);
      }
      if (typeof s.q === 'string') F.q = s.q;
      if (typeof s.open === 'boolean') F.open = s.open;
    } catch { /* a corrupt filter is not worth a broken menu */ }
    return F;
  }

  _saveFilters() {
    const s = { q: this.filters.q, open: this.filters.open };
    for (const g of FILTER_GROUPS) s[g.key] = [...this.filters[g.key]];
    try { localStorage.setItem('ir-filters', JSON.stringify(s)); } catch { /* private mode */ }
  }

  _buildFilterBar() {
    const host = document.getElementById('world-filters');
    if (!host || host.dataset.built) return;
    host.dataset.built = '1';
    if (!this.filters) this.filters = this._loadFilters();

    const top = document.createElement('div');
    top.className = 'wf-top';
    const search = document.createElement('input');
    search.id = 'wf-search';
    search.type = 'search';
    search.placeholder = 'SEARCH WORLDS, REGIONS, ROUTES';
    search.autocomplete = 'off';
    search.value = this.filters.q;
    search.addEventListener('input', () => {
      this.filters.q = search.value;
      this._saveFilters();
      this._applyWorldFilter();
    });
    // COLLAPSE. Four rows of chips is most of a phone screen, and the thing
    // the player came here for is the cards. Folded, the bar keeps the search
    // box, the count, and the chips that are actually ON — so a filter you set
    // is never hidden from you, which is the one thing a fold must not do.
    const fold = document.createElement('button');
    fold.id = 'wf-toggle';
    fold.addEventListener('click', () => {
      host.classList.toggle('wf-collapsed');
      this.filters.open = !host.classList.contains('wf-collapsed');
      this._saveFilters();
      this._applyWorldFilter();
    });
    const clear = document.createElement('button');
    clear.id = 'wf-clear';
    clear.textContent = 'CLEAR';
    clear.addEventListener('click', () => {
      for (const g of FILTER_GROUPS) this.filters[g.key].clear();
      this.filters.q = '';
      search.value = '';
      host.querySelectorAll('.wf-chip.on').forEach((c) => c.classList.remove('on'));
      this._saveFilters();
      this._applyWorldFilter();
    });
    // VIEW SWITCH. Two genuinely different questions get asked of a 60-world
    // roster, and one list cannot answer both: "what do I race next" is career
    // order, "show me a night rally in the desert" is regions plus filters.
    // Lives in the top row so it survives the fold — a view you cannot see you
    // are in is worse than no switch at all.
    const view = document.createElement('div');
    view.id = 'wf-view';
    for (const [key, label] of [['timeline', '⛳ TIMELINE'], ['regions', '🗺 REGIONS']]) {
      const b = document.createElement('button');
      b.className = 'wf-viewbtn' + (this.tracksView === key ? ' on' : '');
      b.dataset.view = key;
      b.textContent = label;
      b.addEventListener('click', () => {
        if (this.tracksView === key) return;
        this._setTracksView(key);
        for (const o of view.querySelectorAll('.wf-viewbtn')) {
          o.classList.toggle('on', o.dataset.view === key);
        }
      });
      view.appendChild(b);
    }
    top.append(search, view, fold, clear);
    host.appendChild(top);

    this._filterRows = new Map();
    for (const g of FILTER_GROUPS) {
      const row = document.createElement('div');
      row.className = 'wf-group';
      this._filterRows.set(g.key, row);
      const lbl = document.createElement('span');
      lbl.className = 'wf-glabel';
      lbl.textContent = g.label;
      row.appendChild(lbl);
      for (const [tag, text] of g.tags) {
        const chip = document.createElement('button');
        chip.className = 'wf-chip' + (this.filters[g.key].has(tag) ? ' on' : '');
        chip.textContent = text;
        chip.addEventListener('click', () => {
          const set = this.filters[g.key];
          if (set.has(tag)) set.delete(tag); else set.add(tag);
          chip.classList.toggle('on', set.has(tag));
          this._saveFilters();
          this._applyWorldFilter();
        });
        row.appendChild(chip);
      }
      host.appendChild(row);
    }
    const count = document.createElement('div');
    count.id = 'wf-count';
    host.appendChild(count);
    // Open on a screen with room for it, folded on a phone — unless the
    // player last left it the other way.
    const roomy = !window.matchMedia?.('(max-width:620px)').matches;
    host.classList.toggle('wf-collapsed', !(this.filters.open ?? roomy));
  }

  /** Show/hide the already-rendered cards. Region headers go with their rows,
   *  so a filtered list never leaves a heading standing over nothing. */
  /** Is anything filtering the board — a search term or any chip. ONE
   *  definition, because two would be a bug: the renderer uses it to decide
   *  whether to flatten the chapters and the matcher uses it to decide whether
   *  to hide cards, and a board that flattens without matching (or matches
   *  without flattening) is a board showing the wrong list. */
  _filtersActive() {
    if (!this.filters) this.filters = this._loadFilters();
    return !!this.filters.q.trim()
      || FILTER_GROUPS.some((g) => this.filters[g.key]?.size);
  }

  _applyWorldFilter() {
    if (!this.filters) this.filters = this._loadFilters();
    const F = this.filters;
    const q = F.q.trim().toLowerCase();
    let shown = 0, total = 0, filtering = !!q;
    for (const g of FILTER_GROUPS) if (F[g.key].size) filtering = true;

    // A SEARCH HAS TO BREAK OUT OF THE CHAPTER YOU ARE STANDING IN, and that
    // is a re-render, not a class toggle. This function only ever hides cards
    // that are already on the page, so at the chapter INDEX — where there are
    // no world cards at all — typing would have filtered nothing and shown
    // nothing. When the filtered/unfiltered state flips, rebuild first.
    if (this.tracksView === 'timeline' && filtering !== !!this._flatRender) {
      this._renderLevelCards();
      return;
    }

    for (const { head, row } of (this._regionRows || new Map()).values()) {
      let live = 0;
      for (const card of row.children) {
        total++;
        let hit = !q || (card.dataset.q || '').includes(q);
        for (const g of FILTER_GROUPS) {
          if (!hit) break;
          const want = F[g.key];
          if (!want.size) continue;
          const have = (card.dataset[g.key] || '').split(' ');
          hit = [...want].some((t) => have.includes(t));
        }
        card.classList.toggle('wf-out', !hit);
        if (hit) { shown++; live++; }
      }
      head.classList.toggle('wf-out', !live);
      row.classList.toggle('wf-out', !live);
    }

    const count = document.getElementById('wf-count');
    if (count) {
      count.textContent = !filtering
        ? `${total} WORLDS`
        : shown ? `SHOWING ${shown} OF ${total} WORLDS`
          : 'NO WORLD MATCHES — TAP CLEAR TO SEE THEM ALL';
      count.classList.toggle('none', filtering && !shown);
    }
    const clear = document.getElementById('wf-clear');
    if (clear) clear.classList.toggle('on', filtering);

    // Folded, the bar shows only the groups with something switched on, so
    // what is filtering the list is always on screen.
    let set = 0;
    for (const g of FILTER_GROUPS) {
      set += F[g.key].size;
      this._filterRows?.get(g.key)?.classList.toggle('wf-empty', !F[g.key].size);
    }
    const fold = document.getElementById('wf-toggle');
    if (fold) {
      const open = !document.getElementById('world-filters').classList.contains('wf-collapsed');
      fold.textContent = open ? 'HIDE ▲' : set ? `FILTERS ${set} ▼` : 'FILTERS ▼';
      fold.classList.toggle('on', !open && set > 0);
    }
  }

  /** THE CHAPTER INDEX — the top level of the tracks tab.
   *
   *  Twelve cards instead of seventy-two, so the screen is a map of the career
   *  rather than a scroll through it. Each states the one thing you would have
   *  had to scroll to find out: how far into that chapter you are, and — if it
   *  is shut — exactly what opens it.
   */
  _renderChapterIndex(sel) {
    this._flatRender = false;
    const chs = this.chapters();
    const here = this.currentChapter();
    const head = document.createElement('div');
    head.className = 'region-head';
    head.textContent = this._ladderHeading();
    sel.appendChild(head);
    const grid = document.createElement('div');
    grid.className = 'chapter-grid';
    sel.appendChild(grid);
    for (const c of chs) {
      const open = this.isChapterOpen(c._k);
      const have = this.chapterStars(c._k);
      const max = c.levels.length * 3;
      const need = this.chapterNeed(c._k);
      const done = c.levels.filter((l) => this.starsFor(this.career.finished[l.id]) >= 3).length;
      const raced = c.levels.filter((l) => this.career.finished[l.id]).length;
      const prev = chs[c._k - 1];
      const short = Math.max(0, this.chapterNeed(c._k - 1) - this.chapterStars(c._k - 1));
      const card = document.createElement('button');
      card.className = `chapter-card${open ? '' : ' locked'}${c._k === here ? ' here' : ''}`;
      card.dataset.chn = c.n;
      // The shut card names its price in the PREVIOUS chapter's terms, because
      // that is where the player has to go and do something about it.
      const line = open
        ? `${raced}/${c.levels.length} RACED · ${done} CLEARED`
        : `NEEDS ${short}★ MORE IN CHAPTER ${prev ? prev.n : ''}`;
      card.innerHTML = `
        <div class="cc-top">
          <span class="cc-n">${open ? c.n : '🔒'}</span>
          <span class="cc-name">${c.name}</span>
        </div>
        <div class="cc-blurb">${c.blurb}</div>
        <div class="cc-foot">
          <span class="cc-line">${line}</span>
          <span class="cc-stars">${have}/${max}★</span>
        </div>
        <div class="ch-bar"><i style="width:${max ? Math.round(100 * have / max) : 0}%"></i>
          <u style="left:${max ? Math.min(100, Math.round(100 * need / max)) : 0}%"></u></div>`;
      card.addEventListener('click', () => {
        // A SHUT CHAPTER STILL OPENS — you may look at what you are working
        // toward. Every world inside it stays locked and says so, which is
        // more use than a card that refuses to be tapped.
        this._chapterIn = c.n;
        this._renderLevelCards();
        this._syncBackBtn();
        const sc = sel.closest('.screen');
        if (sc) sc.scrollTop = 0;
      });
      grid.appendChild(card);
    }
  }

  /** Where you are, written into the fixed top bar.
   *
   *  This USED TO BUILD A NODE and hand it to the list, which put a third back
   *  control on a screen that already had two — the header BACK button and the
   *  bottom-left pill. The bar is a single element in the page now (`#topbar`)
   *  and this fills it; `_syncBackBtn` is what shows and hides it.
   */
  _fillTopbar(c) {
    const where = document.getElementById('topbar-where');
    const stars = document.getElementById('topbar-stars');
    if (where) where.innerHTML = `<b>CHAPTER ${c.n}</b> ${c.name}`;
    if (stars) stars.textContent = `${this.chapterStars(c._k)}/${c.levels.length * 3}★`;
  }

  /*  Rebuildable, because a career reset changes every lock and every best. */
  _renderLevelCards() {
    const sel = document.getElementById('level-select');
    if (!sel) return;
    // A repaint replaces every card, and the menu screen scrolls: emptying the
    // list collapses its height for a beat and the browser clamps the scroll
    // to the top — the list JUMPED on each rebuild. Hold the place.
    const scroller = sel.closest('.screen');
    const keepScroll = scroller ? scroller.scrollTop : 0;
    // The outgoing cards are dead: stop observing them, or every repaint grows
    // the lazy-shot set by a listful of detached nodes (measured 60 → 300
    // after four repaints).
    this.__shotObs?.disconnect();
    this.__lazyShots?.clear();
    sel.innerHTML = '';
    this._renderSceneCards(sel);
    this._buildFilterBar();
    const regionRows = new Map();
    this._regionRows = regionRows;
    const timeline = this.tracksView === 'timeline';
    sel.classList.toggle('tl-view', timeline);

    /* ---- CHAPTERS ARE ROOMS YOU ENTER, NOT HEADINGS YOU SCROLL PAST -------
     *
     * REPORTED: "Package them in separate sections that I can enter. Like this
     * the screen is cleaner and no endless scrolling."
     *
     * The first cut at chapters put a header above each chapter's cards and
     * left all 72 worlds on one page. That gives the career a SHAPE but does
     * nothing about its LENGTH — the thing you actually do on that screen is
     * still scroll past sixty worlds you are not going to race.
     *
     * So the timeline view is now two screens deep. The top level is the
     * chapter index: twelve cards, one screenful, each stating where you are
     * in it. Entering one shows that chapter's worlds AND NOTHING ELSE.
     *
     * `_chapterIn` is null at the index and a chapter key inside one. It is
     * keyed by the chapter's stable `n`, not by its array position, so a
     * roster edit that inserts a chapter cannot silently teleport a player
     * into a different one. It is remembered across repaints (the board
     * rebuilds on every star earned) but deliberately NOT persisted to disk:
     * arriving at the tracks tab should show you the map, not the room you
     * were last standing in.
     *
     * SEARCH AND FILTERS OVERRIDE ALL OF IT. A filter is a question about the
     * WHOLE roster — "show me the night rallies" — and answering it inside one
     * chapter would answer a question nobody asked. When either is active the
     * board flattens to every matching world, across every chapter.
     */
    const chs = this.chapters();
    const searching = this._filtersActive();
    const inChapter = timeline && !searching && this._chapterIn != null
      ? chs.find((c) => c.n === this._chapterIn) : null;
    if (timeline && !searching && !inChapter) {
      this._renderChapterIndex(sel);
      // The index is a different page, not a shorter one — so it still owes
      // the player everything the board owes them. Skipping these was the
      // first cut's bug: the star legend vanished, the filter chips came up
      // unlabelled and the count read nothing, because all three are set on
      // the way OUT of the card render this path returns before reaching.
      this._renderStarKey();
      this._applyWorldFilter();
      const n = document.getElementById('wf-count');
      // ...and the count has to count what is ON SCREEN. `_applyWorldFilter`
      // walks the world cards, and at the index there are none, so it would
      // announce "0 WORLDS" over a full page of chapters.
      if (n) {
        n.textContent = `${this.chapters().length} CHAPTERS · ${LEVELS.length} WORLDS`;
        n.classList.remove('none');
      }
      if (scroller) scroller.scrollTop = keepScroll;
      return;
    }
    sel.classList.toggle('ch-inside', !!inChapter);
    if (inChapter) this._fillTopbar(inChapter);
    // THE LADDER IS ONE LADDER. Regions do not run in contiguous blocks of
    // career order — PINE VALLEY owns rungs 1, 6, 11, 12, 13 — so grouping the
    // timeline by region produces a "sequence" that counts 1, 6, 11, 3, and
    // reads as broken. A progression view gets ONE unbroken run and carries
    // the region on each card instead; the REGIONS view keeps the headers,
    // which is the whole reason to have two views.
    // THE TIMELINE VIEW IS NOW THE CHAPTER VIEW. It used to be one unbroken
    // run of 67 cards under a single header — a progression with no shape,
    // which is what "make it more structured" was about. Each chapter gets its
    // own header carrying its number, name, blurb and a star bar, so the board
    // reads as parts of a career instead of a wall.
    //
    // The REGIONS view is untouched and still groups by region: the two views
    // answer different questions ("where am I up to" vs "show me the coast"),
    // which is the whole reason there are two.
    const chapterHead = (c) => {
      const have = this.chapterStars(c._k);
      const max = c.levels.length * 3;
      const need = this.chapterNeed(c._k);
      const open = this.isChapterOpen(c._k);
      const done = c.levels.filter((l) => this.starsFor(this.career.finished[l.id]) >= 3).length;
      const head = document.createElement('div');
      head.className = `chapter-head${open ? '' : ' locked'}`;
      // A shut chapter says what opens it — in the PREVIOUS chapter's terms,
      // because that is where the player has to go and do something about it.
      const prev = this.chapters()[c._k - 1];
      const short = Math.max(0, this.chapterNeed(c._k - 1) - this.chapterStars(c._k - 1));
      const gate = open
        ? `${have}/${max}★ · ${done} CLEARED`
        : `🔒 ${short}★ MORE IN CHAPTER ${prev ? prev.n : ''}`;
      head.innerHTML = `
        <div class="ch-top">
          <span class="ch-n">CHAPTER ${c.n}</span>
          <span class="ch-name">${c.name}</span>
          <span class="ch-gate">${gate}</span>
        </div>
        <div class="ch-blurb">${c.blurb}</div>
        <div class="ch-bar"><i style="width:${max ? Math.round(100 * have / max) : 0}%"></i>
          <u style="left:${max ? Math.min(100, Math.round(100 * need / max)) : 0}%"></u></div>`;
      return head;
    };
    const rowFor = (lv) => {
      const key = timeline ? `ch${this.chapterOf(lv.id)}` : (lv.region || 'CHAMPIONSHIP');
      let pair = regionRows.get(key);
      if (!pair) {
        let head;
        if (inChapter) {
          // the chapter bar at the top of the page already says which chapter
          // this is; a second header under it would be the same words twice
          head = document.createElement('div');
          head.className = 'chapter-head-none';
        } else if (timeline) {
          const c = this.chapters()[this.chapterOf(lv.id)];
          head = c ? chapterHead(c) : document.createElement('div');
          if (!c) { head.className = 'region-head'; head.textContent = this._ladderHeading(); }
        } else {
          head = document.createElement('div');
          head.className = 'region-head';
          head.textContent = key;
        }
        sel.appendChild(head);
        const row = document.createElement('div');
        row.className = 'region-row';
        sel.appendChild(row);
        pair = { head, row };
        regionRows.set(key, pair);
      }
      return pair.row;
    };
    this._renderStarKey();
    // FRESH REGIONS RENDER FIRST — in the REGIONS view only. Career order
    // (pricing, progression) is the array and stays untouched; this is display
    // order only. New content at the BOTTOM of a 32-card list is new content
    // nobody sees: measured on a fresh save, the four newest worlds were the
    // last four cards, locked at 26-29 stars. Reported as "I don't see the new
    // tracks". The TIMELINE view deliberately does NOT do this: the whole
    // point of a ladder is that rung 12 comes after rung 11, and re-ordering
    // it to surface new content would make the ladder lie about the career.
    const freshRegions = new Set(LEVELS.filter((l) => l.fresh).map((l) => l.region));
    // while a picked world is still building, the highlight belongs to the pick
    const curId = this._pendingPick?.id ?? this.level?.id;
    const nextUp = this.nextTrack();
    // WHAT YOU CAN DRIVE COMES FIRST. ALWAYS.
    //
    // The career array is in rung order and the PRICES are not monotonic with
    // it — a world can carry its own `cost`, so the board ran 58, 60, 63 and
    // then 20 a few cards later. Add the floor handing a world over for free
    // and the result was OLIVE COAST sitting OPEN underneath three padlocks,
    // with the one thing the player could actually race buried below the
    // things they could not. Reported from the phone with a screenshot of
    // exactly that.
    //
    // So: unlocked first, locked after, and the locked half ordered by what it
    // COSTS rather than by where it happens to sit in the array — that is the
    // order a player reads a wall in ("what's next?"), and it is the order the
    // prices were always trying to express.
    //
    // Career order (pricing, progression, `nextTrack`) is the array and is
    // untouched; this is display only. It does override the timeline view's
    // old rule that rung 12 must follow rung 11 — that rule assumed prices
    // rose with the array, and they do not.
    this._flatRender = searching;
    // INSIDE A CHAPTER, THE BOARD IS THAT CHAPTER. This is the whole point of
    // the drill-down: sixty worlds you are not going to race are not made
    // better by a header above them, they are made better by not being there.
    const rows = LEVELS
      .map((lv, i) => ({ lv, i, open: this.isLevelUnlocked(lv.id) }))
      .filter(({ lv }) => !inChapter || inChapter.levels.some((l) => l.id === lv.id));
    rows.sort((a, b) => (timeline
      // CHAPTER VIEW RUNS IN CAREER ORDER, FULL STOP. The old rule floated
      // every open world above every shut one, which was right when worlds
      // opened individually in price order and is wrong now: a chapter is a
      // CONTIGUOUS run, and re-ordering across it would scatter one chapter's
      // worlds under another chapter's header.
      ? a.i - b.i
      : (a.open ? 0 : 1) - (b.open ? 0 : 1)
        || (freshRegions.has(a.lv.region) ? 0 : 1) - (freshRegions.has(b.lv.region) ? 0 : 1)
        || a.i - b.i));
    rows.forEach(({ lv, i }) => {
      const card = document.createElement('button');
      const unlocked = this.isLevelUnlocked(lv.id);
      card.className = 'level-chip'
        + (lv.id === curId ? ' current' : '')
        + (unlocked ? '' : ' locked');
      // What this world IS, stamped on the card so filtering is an attribute
      // read rather than a rebuild. `q` is everything you might type at it:
      // the name, the region, the theme and route keys (a player who knows
      // "spa" should not have to know it is dressed as a forest), and the
      // facet words themselves, so typing "night" works without the chips.
      const F = worldFacets(lv);
      for (const g of FILTER_GROUPS) card.dataset[g.key] = F[g.key].join(' ');
      card.dataset.q = [lv.name, lv.region, lv.theme, lv.route || '',
        WORLD_TAGS[lv.theme] || '', F.time.join(' '), F.weather.join(' '),
        F.scenery.join(' '), F.road.join(' '), F.season.join(' ')].join(' ').toLowerCase();
      const best = this.career.finished[lv.id];
      // Stars carry both halves of the story: how much of this world you have
      // taken, and — when it is shut — exactly what it costs to open. A bare
      // padlock tells you nothing you can act on.
      const got = this.starsFor(best);
      const starRow = '★'.repeat(got) + '☆'.repeat(3 - got);
      // A SHUT WORLD NAMES ITS CHAPTER, NOT A PRICE. Under chapters no world
      // has a price of its own, so "NEEDS 27★" was quoting a number that no
      // longer decides anything. What a player can act on is which chapter the
      // world is behind and how far off that chapter's gate they are.
      const ck = this.chapterOf(lv.id);
      const ch = this.chapters()[ck];
      // The chapter's HEADER carries the price, once. Repeating it on every
      // card underneath stacked the same sentence eight times down a shut
      // chapter — so the card names the chapter it is waiting on and stops
      // there, which is the part a player tapping THIS card does not already
      // have on screen.
      const bestTxt = unlocked
        ? (best ? `BEST: ${ordinal(best.place)}` : '★ UNRACED')
        : `CHAPTER ${ch ? ch.n : '?'} · ${ch ? ch.name : ''}`;
      // THE LADDER, STATED ON THE CARD. `i` is the career rung — the same
      // index `starCost` prices from — so the number, the gate and the lock
      // are three faces of one rule rather than three things to keep in sync.
      const isNext = nextUp && nextUp.lv.id === lv.id;
      if (isNext) card.classList.add('next');
      if (unlocked && got >= 3) card.classList.add('done');
      else if (unlocked && best) card.classList.add('raced');
      card.dataset.rung = i + 1;
      const state = !unlocked ? 'LOCKED' : got >= 3 ? 'CLEARED' : best ? 'STARS LEFT' : 'OPEN';
      const badge = isNext
        ? `<div class="tl-next">${nextUp.why === 'locked' ? 'NEXT UNLOCK' : 'NEXT UP'}</div>` : '';
      card.innerHTML = `${lv.fresh ? '<div class="wc-new">NEW</div>' : ''}${badge}<div class="wc-shot" data-shot="assets/previews/w${lv.id}.jpg">
          <canvas class="wc-map" width="72" height="52"></canvas>
        </div>
        <div class="tl-rung">${i + 1}</div>
        <div class="wc-name">${unlocked ? '' : '🔒 '}${lv.name}</div>
        ${this._surfaceChip(lv)}
        <div class="wc-tags">${timeline && lv.region
    ? `<b class="tl-rg">${lv.region}</b> · ` : ''}${WORLD_TAGS[lv.theme] || ''}</div>
        <div class="wc-stars${got ? '' : ' none'}">${starRow}</div>
        ${unlocked ? this._affinityChip(lv.id) : ''}
        <div class="tl-state ${state.toLowerCase().replace(' ', '-')}">${state}</div>
        ${unlocked ? this._featChips(lv.id) : ''}
        <div class="wc-best${best ? '' : ' new'}${unlocked ? '' : ' cost'}">${bestTxt}</div>`;
      this._drawCircuitMap(card.querySelector(".wc-map"), lv.route || lv.theme, !unlocked, lv.id === curId);
      card.dataset.lvid = lv.id;
      card.addEventListener('click', () => {
        // "Already on it" is only true if what is standing is the SHIPPED
        // world. With an edited build up, this card is the way back to the
        // real one, and returning early here is what made the original
        // unreachable — you could see PINE VALLEY in the list, tap it, and
        // keep the hill you had sculpted on it.
        const curId = this._pendingPick?.id ?? this.level?.id;
        if (lv.id === curId && !this.editScene) return;
        if (!this.isLevelUnlocked(lv.id)) {
          card.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-5px)' },
            { transform: 'translateX(5px)' }, { transform: 'translateX(0)' }], { duration: 200 });
          return;
        }
        // the tap moves the highlight; the world build follows — see _pickLevel
        this._pickLevel(lv);
      });
      rowFor(lv).appendChild(card);
      this._watchShot(card.querySelector('.wc-shot'));
    });
    this._applyWorldFilter();
    if (scroller) scroller.scrollTop = keepScroll;
  }

  /** A card tap must FEEL like a tap. swapLevel is a full synchronous world
   *  build — measured 5–13 s per pick under software GL, whole seconds on a
   *  phone — and it used to run INSIDE the click handler: the menu froze
   *  before the new highlight had painted, taps made during the freeze
   *  replayed later against a rebuilt card list, and every one of them bought
   *  another full build. Reported as "selecting tracks is buggy and lagging".
   *
   *  A tap now just moves the highlight and raises the BUILDING veil; the
   *  build runs after the browser has painted them, and browsing taps
   *  coalesce into ONE build of the last card picked. Anything that needs the
   *  world to be real (start, editor, mode switch) flushes the pick first. */
  _pickLevel(lv) {
    this._pendingPick = lv;
    this._markCurrentCard();
    const veil = document.getElementById('build-veil');
    if (veil) { veil.textContent = `BUILDING ${lv.name} …`; veil.classList.add('on'); }
    clearTimeout(this._pickTimer);
    this._pickTimer = setTimeout(() => this._flushPick(), 180);
  }

  _flushPick() {
    clearTimeout(this._pickTimer);
    this._pickTimer = null;
    const lv = this._pendingPick;
    if (!lv) return;
    this._pendingPick = null;
    // Swap the world under the menu instead of navigating. Falls back to
    // the old reload only if the swap declines (mid-race), so picking a
    // track can never leave you stuck on the one you were leaving.
    // no third argument: a track-list pick is always the shipped world
    if (this.swapLevel(lv, !!this.editScene)) {
      this._markCurrentCard();       // highlight now backed by the real world
      this.renderCarShop();          // the garage ratings are per-world
      // ...AND SO IS THE TYRE BAY, which was left naming the world you LEFT.
      // Measured after waiting for the swap to settle: `game.level.name` and
      // `#garage-shop-head` both read AVALANCHE ALLEY while the bay's own head
      // still read "TYRE BAY — PINE VALLEY WANTS GRAVEL" and put "IDEAL HERE"
      // on the wrong compound — so the one panel whose entire job is telling
      // you which tyre this world wants was advising you about a different
      // world. The GARAGE tab's click handler does not render either, so
      // nothing else caught it up.
      this.renderGarage?.();
      this._syncStartButton();       // a new world can change the tyre price
      this._buildMissionPicker?.();  // missions are per-world
      this._renderJobs?.();          // ...and so is the contract slate under the jobs
    } else {
      this.fadeTo(`?level=${lv.id}${this.unlockAll ? '&unlockall=1' : ''}`);
    }
    document.getElementById('build-veil')?.classList.remove('on');
  }

  /** Move the CURRENT ring without rebuilding the list. The full repaint on
   *  every pick was half the bug: it cleared and re-created all ~60 cards,
   *  which snapped the menu's scroll back to the top of the list. */
  _markCurrentCard() {
    const curId = this._pendingPick?.id ?? this.level?.id;
    for (const card of document.querySelectorAll('#level-select .level-chip')) {
      const cur = +card.dataset.lvid === curId;
      if (card.classList.contains('current') === cur) continue;
      card.classList.toggle('current', cur);
      const lv = LEVELS.find((l) => l.id === +card.dataset.lvid);
      if (lv) {
        this._drawCircuitMap(card.querySelector('.wc-map'), lv.route || lv.theme,
          !this.isLevelUnlocked(lv.id), cur);
      }
    }
  }

  /** LAZY WORLD ART. The 21 preview jpgs are 1.15 MB — 40 % of everything the
   *  game ships — and the cards are built during boot, so every one of them
   *  used to be requested while the player was still looking at the title
   *  screen, for a menu they had not opened. Measured on a cold load: 21
   *  requests firing at once the moment the world finished building.
   *
   *  The url now waits on the element actually approaching the viewport, which
   *  on a hidden screen means "not until you open the menu, and then only the
   *  cards you scroll to". */
  _watchShot(el) {
    if (!el || !el.dataset.shot) return;
    // Load through an Image so a MISSING preview is a known outcome rather than
    // a broken card: worlds added after the 21 hand-shot jpgs have no art, and
    // they fall back to a themed wash with the circuit outline the .wc-map
    // canvas already draws on top. No placeholder jpgs to author or ship.
    const load = (node) => {
      const url = node.dataset.shot;
      if (!url) return;
      delete node.dataset.shot;
      const img = new Image();
      img.onload = () => { node.style.backgroundImage = `url('${url}')`; };
      img.onerror = () => { node.classList.add('no-shot'); };
      img.src = url;
    };
    this.__lazyShots ??= new Set();
    this.__lazyShots.add(el);
    if (typeof IntersectionObserver !== 'function') { load(el); return; }
    this.__shotObs ??= new IntersectionObserver((entries, obs) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        load(e.target);
        this.__lazyShots?.delete(e.target);
        obs.unobserve(e.target);
      }
      // 300 px of lead time, so a card is painted before it is scrolled to
    }, { rootMargin: '300px' });
    this.__shotObs.observe(el);
  }

  /** Force every outstanding preview in. Deferring art is only a win if the art
   *  still ARRIVES: measured, the observer alone left 16 of 21 cards blank even
   *  after the track list was opened and scrolled, because the region rows
   *  scroll horizontally inside a clipped container and never tripped it. The
   *  observer stays for eagerness; this is the guarantee. */
  _loadAllShots() {
    if (!this.__lazyShots?.size) return;
    for (const el of this.__lazyShots) {
      const url = el.dataset?.shot;
      if (url) { el.style.backgroundImage = `url('${url}')`; delete el.dataset.shot; }
      this.__shotObs?.unobserve(el);
    }
    this.__lazyShots.clear();
  }

  /** The named car's own upgrade levels — upgrades belong to one machine. */
  carUpgrades(carKey = this.cars.selected) {
    const g = this.garage;
    g.upgrades ??= {};
    const up = g.upgrades[carKey] ??= {};
    for (const u of UPGRADES) up[u.key] ??= 0;
    return up;
  }

  /** WHAT THIS CAR IS BUILT FROM — the fitted part per slot, and what it owns.
   *
   *  Per car, like upgrade levels: a V8 bought for the BRAWLER stays in the
   *  BRAWLER. Defaults are the STOCK part of every slot, owned and fitted, so
   *  a save written before the build bay existed reads as a stock car rather
   *  than as a car with holes in it — and nothing needs a migration pass.
   *  Clamped on READ: a fitted id that no longer exists (a part renamed, a
   *  save hand-edited) falls back to stock instead of throwing.
   */
  carParts(carKey = this.cars.selected) {
    const g = this.garage;
    g.parts ??= {};
    const rec = g.parts[carKey] ??= { fitted: {}, owned: {} };
    rec.fitted ??= {};
    rec.owned ??= {};
    for (const slot of PART_SLOTS) {
      const stock = stockPart(slot);
      rec.owned[`${slot.key}:${stock.id}`] = 1;             // stock is never bought
      const fit = rec.fitted[slot.key];
      const pt = slot.parts.find((x) => x.id === fit);
      // CLAMPED ON READ, exactly like the tyre compound, and for the same
      // reason: the ceiling moves. Swapping to a smaller chassis — or a career
      // reset dropping the ladder back to zero — must not leave a V12 bolted
      // into a bay that cannot hold one. Owning it is kept; wearing it is not.
      if (!pt || (pt.tier | 0) > this.mountMax(slot.key, carKey)) rec.fitted[slot.key] = stock.id;
    }
    return rec;
  }

  /** The part object fitted in a slot right now. Never null. */
  fittedPart(slotKey, carKey = this.cars.selected) {
    const slot = PART_SLOT[slotKey];
    const rec = this.carParts(carKey);
    return slot.parts.find((p) => p.id === rec.fitted[slot.key]) || stockPart(slot);
  }

  ownsPart(slotKey, partId, carKey = this.cars.selected) {
    return !!this.carParts(carKey).owned[`${slotKey}:${partId}`];
  }

  /** RACE FOR THE PART. The top item in each slot cannot be bought at any
   *  price until it is earned, and both conditions read data the career
   *  already keeps rather than adding a counter to maintain:
   *    cleared — worlds taken outright (a win, which is what 3 stars means)
   *    medals  — arena-mission medals held, of any colour, across the roster
   *  Returns { open, have, need } so the card can show progress, not just a
   *  padlock. A part with no `lock` is always open. */
  partLock(part) {
    if (!part.lock) return { open: true, have: 0, need: 0 };
    const { kind, n } = part.lock;
    let have = 0;
    if (kind === 'cleared') {
      have = LEVELS.filter((l) => this.starsFor(this.career.finished[l.id]) >= 3).length;
    } else if (kind === 'medals') {
      have = Object.values(this._missionBest?.() || {}).filter((m) => m > 0).length;
    }
    return { open: have >= n, have, need: n };
  }

  /** THE HIGHEST MOUNT CLASS THIS CAR CAN CARRY IN A SLOT, right now. */
  mountMax(slotKey, carKey = this.cars.selected, up = null) {
    const base = CHASSIS_MOUNT[carKey]?.[slotKey] ?? 1;
    const slot = PART_SLOT[slotKey];
    const lv = (up ?? this.carUpgrades(carKey))[slot.mount] | 0;
    return Math.min(MOUNT_MAX, base + mountFromLevel(lv));
  }

  /** CAN THIS CAR TAKE THIS PART, and if not, is that a thing money can fix?
   *
   *  Three outcomes, and the difference between the last two is the whole
   *  reason this exists — one is a purchase, the other is a different car:
   *    ok        it fits
   *    !ok       the ladder is not high enough YET (`via` names it, `need` is
   *              the level required)
   *    capped    even a maxed ladder cannot get there on this chassis
   */
  /** WHICH MACHINES COULD EVER WEAR THIS PART. A "won't fit" with no way
   *  forward is a dead end; naming the chassis that can turns it into a
   *  reason to own another car, which is what the gating is for. */
  partHomes(slot, part) {
    const tier = part.tier | 0;
    return CAR_CATALOG.filter((c) => {
      const base = CHASSIS_MOUNT[c.key]?.[slot.key] ?? 1;
      return Math.min(MOUNT_MAX, base + mountFromLevel(5)) >= tier;
    }).map((c) => c.name);
  }

  partFits(slot, part, carKey = this.cars.selected) {
    const tier = part.tier | 0;
    const have = this.mountMax(slot.key, carKey);
    if (tier <= have) return { ok: true };
    const base = CHASSIS_MOUNT[carKey]?.[slot.key] ?? 1;
    const ceiling = Math.min(MOUNT_MAX, base + mountFromLevel(5));
    if (tier > ceiling) return { ok: false, capped: true, via: slot.mountName };
    // the lowest ladder level whose mount class reaches this tier
    let need = 0;
    while (need <= 5 && Math.min(MOUNT_MAX, base + mountFromLevel(need)) < tier) need++;
    return { ok: false, capped: false, via: slot.mountName, need,
      at: this.carUpgrades(carKey)[slot.mount] | 0 };
  }

  /** WHICH COMPOUND IS ON THIS CAR RIGHT NOW.
   *
   *  Stored per car in `garage.fitted`, defaulting to the best the car has
   *  unlocked — which is exactly what every save written before this was doing
   *  implicitly, so nobody's setup changes underneath them. Clamped on READ
   *  rather than on write, because swapping cars and buying an upgrade can
   *  both move the ceiling under a stored choice. */
  fittedTyre(carKey = this.cars.selected, lv = this.level) {
    const g = this.garage;
    g.fitted ??= {};
    const max = tyreMaxClass(carKey, (g.upgrades || {})[carKey]);
    const want = g.fitted[carKey];
    if (want != null) return Math.max(0, Math.min(max, want | 0));
    // ---- AUTO: THE RIGHT COMPOUND FOR THE WORLD YOU ARE ABOUT TO RACE ----
    //
    // The first cut defaulted to the BEST compound owned, which is the worst
    // possible default and was reported as "what's the point if I don't buy
    // them?". Measured: of 60 worlds, 40 are SEALED, 16 LOOSE and 4 ICE. So a
    // player who bought SNOW tyres — the expensive end of the line — was
    // handed a −18 % liability on FORTY worlds and had to walk into the
    // garage and undo their own purchase before each one. Owning the best
    // tyre made you worse by default, which is an indefensible thing for a
    // shop to sell.
    //
    // Fitting the compound the world asks for, capped by what you own, makes
    // the purchase do what a purchase should: buying SNOW means "I am now
    // ideal on the ice too", automatically, and it never costs you anywhere
    // else. The bay stays as an override for anyone who wants to run
    // deliberately over- or under-tyred.
    const need = lv ? surfaceClass(lv) : max;
    return Math.max(0, Math.min(max, need));
  }

  /** Fit a compound and remember it. FREE, always — going down a class is
   *  never a purchase; only unlocking a higher one costs money. */
  fitTyre(cls, carKey = this.cars.selected) {
    const g = this.garage;
    g.fitted ??= {};
    // `null` means AUTO — clear the override and let the world decide again.
    if (cls == null) delete g.fitted[carKey];
    else {
      g.fitted[carKey] = Math.max(0,
        Math.min(tyreMaxClass(carKey, (g.upgrades || {})[carKey]), cls | 0));
    }
    saveJSON(this._pkey('garage'), g);
    this.applyUpgrades();
    this.renderGarage();
    this._renderLevelCards?.();
    this._syncStartButton?.();
    this.hud?.feed?.(cls == null
      ? `AUTO — FITTING ${TYRE_LABEL[this.fittedTyre(carKey)]} FOR THIS WORLD`
      : `FITTED ${TYRE_LABEL[g.fitted[carKey]]} TYRES`, 'good');
    return this.fittedTyre(carKey);
  }

  /** Tell the car how far its tyres miss this world's surface in BOTH
   *  directions — the physics prices over- and under-spec separately
   *  (see tyrePenalty in vehicles.js; nothing is refused since r151). */
  _applyTyreClass() {
    if (!this.player || !this.level) return;
    const f = this.carFitness(this.level.id);
    this.player._tyreOver = f ? Math.max(0, f.over) : 0;
    this.player._tyreUnder = f ? Math.max(0, f.need - f.have) : 0;
    // ...and how GOOD the set is, which is what levels 2-5 of TIRES now buy:
    // a better tyre copes better with the wrong surface (see tyrePenalty).
    this.player._tyreLevel = (this.carUpgrades()?.tires) | 0;
  }

  /** Apply the SELECTED car's purchased upgrades to the player (base stats
   *  captured once per machine — swapPlayerCar clears the capture). */
  applyUpgrades() {
    this._applyTyreClass();
    const p = this.player;
    if (!this._base) this._base = { maxSpeed: p.maxSpeed, maxHealth: p.maxHealth, accel: p.accel };
    const g = this.carUpgrades();
    // [PARTS] The fitted block and wing multiply what the tuning ladder has
    // already bought, rather than replacing it: ENGINE WRENCH still buys its
    // 4% a rung, and the block decides what that 4% is 4% OF. A V12 on a maxed
    // engine is the fastest thing in the game and the hardest to hold.
    const eng = this.fittedPart('engine');
    const wing = this.fittedPart('spoiler');
    p.maxSpeed = this._base.maxSpeed * (1 + 0.04 * g.engine) * eng.speed * wing.speed;
    p.accel = this._base.accel * eng.accel;
    p.maxHealth = this._base.maxHealth + 15 * g.armor;
    p.health = p.maxHealth;
    // THE CANNON IS THE UPGRADE NOW, not a stat the upgrade nudges.
    //
    // "Make the weapons significantly less powerful at the beginning." It was
    // 7 * (1 + 0.18 * lvl): 7 stock and 13.3 maxed, a 1.9x curve over five
    // levels costing ~9,000 CR — so the stock gun was already most of the gun,
    // and CANNON CORE bought a rounding error. Against a 70-hull rival that is
    // 10 hits stock and 6 maxed, which is not a decision.
    // Now 3.5 -> 12.6, a 3.6x curve: 20 hits stock, 6 maxed. Same ceiling for
    // a player who has paid; a chip weapon for one who has not.
    p.cannonDamage = 3.5 * (1 + 0.52 * g.cannon);
    // ---- capacity, which the race then spends (see PlayerCar) ----
    p.maxRounds = 90 + 30 * (g.magazine || 0);
    p.maxMissiles = 1 + (g.rack || 0);
    p.maxMines = 1 + (g.rack || 0);
    p.maxSos = 1 + (g.beacon || 0);
    p.nitroRate = 1 + 0.22 * g.nitro;
    p.handling = 0.2 * (g.handling || 0);
    // The block's grip cost is constant; the wing's grip GAIN arrives with
    // speed (see `downforce` in Car.update), which is the whole reason a wing
    // is a trade and not simply a purchase.
    p.gripBoost = (1 + 0.04 * (g.tires || 0)) * eng.grip;
    p.downforce = wing.down || 0;
    p.damperLvl = g.dampers || 0;                // read by Car.onLand
    p.steerSense = { relaxed: 0.8, normal: 1.0, sharp: 1.25 }[this.steerSetting] || 1.0;
    p.assist = { pro: 0, standard: 0.5, assist: 1 }[this.assistSetting] ?? 0.5;
    // ...AND THE CAR LOOKS LIKE WHAT YOU BOUGHT. Every upgrade until now was
    // an invisible multiplier: a fully built machine was identical to the one
    // on the forecourt, so the money had nothing to show for itself. Rebuilt
    // here rather than at purchase time because applyUpgrades() is already the
    // one place that reads the garage row, so the mesh cannot drift from the
    // numbers.
    applyUpgradeKit(p.mesh, g, { engine: eng, spoiler: wing });
  }

  /** RACE FOR THE PART, ANNOUNCED. The locks read live career data, so a part
   *  opens the instant the sixth world falls or the third medal lands — but a
   *  thing that silently becomes buyable in a menu two taps away is a thing
   *  nobody finds. Called on every finish, race and mission alike: any part
   *  whose lock has just come open gets the banner, once.
   *
   *  `garage.partSeen` is the "once". It is written the first time a part is
   *  announced, so re-racing does not re-announce, and it is keyed by
   *  slot:part rather than by car — you earn the RIGHT to the part, and every
   *  car in the collection can then buy one.
   */
  _announcePartUnlocks() {
    const el = document.getElementById('part-unlock');
    if (el) el.style.display = 'none';
    const g = this.garage;
    g.partSeen ??= {};
    const fresh = [];
    for (const slot of PART_SLOTS) {
      for (const part of slot.parts) {
        if (!part.lock) continue;
        const key = `${slot.key}:${part.id}`;
        if (g.partSeen[key]) continue;
        if (!this.partLock(part).open) continue;
        g.partSeen[key] = 1;
        fresh.push({ slot, part });
      }
    }
    if (!fresh.length) return;
    saveJSON(this._pkey('garage'), g);
    if (!el) return;
    // One banner even if two open at once — the second line names the rest
    // rather than stacking a second box on a screen that is already full.
    const first = fresh[0];
    el.innerHTML = `<span class="pu-top">🔧 PART EARNED</span>
      <span class="pu-name">${first.part.name}</span>
      <span class="pu-sub">${first.slot.name} · ${first.part.cost.toLocaleString()} CR IN THE BUILD BAY${
  fresh.length > 1 ? ` · AND ${fresh.length - 1} MORE` : ''}</span>`;
    el.style.display = '';
  }

  /** THE GARAGE, AS A WORKSHOP.
   *
   *  One screen: the machine you have built, then the bays that built it.
   *  Every bay speaks the same card language whether it sells a CHOICE (one
   *  part at a time, the options trading against each other) or a LADDER (an
   *  upgrade line, each rung better than the last) — picture, name, a bar for
   *  how much of it you have, and one button that says what tapping does.
   *
   *  That is the marriage the report asked for. The two systems were never in
   *  conflict; they were wearing different clothes, and the upgrade ladders
   *  were a wall of grey rows underneath a shop that had pictures.
   *
   *  Every one of the ten UPGRADES lands in exactly one bay, so nothing is
   *  orphaned by the regrouping:
   *    ENGINE SHOP   the blocks, and the ENGINE WRENCH that tunes whichever
   *                  one is in
   *    BODY KIT      the wings, and the suspension that makes them worth it
   *    TIRE BAY      the compounds, and the TIRES ladder that unlocks them
   *    WEAPONS CACHE cannon, rockets, drums
   *    CHASSIS       armour, nitro, dampers, the recovery beacon
   */
  _renderGarageBays() {
    this._renderBuildPreview();
    const host = document.getElementById('garage-bays');
    if (!host) return;
    const icons = this._partIcons();
    const up = this.carUpgrades();
    const rec = this.carParts();
    host.innerHTML = '';

    const BAYS = [
      { name: 'ENGINE SHOP', icon: '🔩', slot: 'engine', ups: ['engine'] },
      { name: 'BODY KIT & SPOILERS', icon: '🪽', slot: 'spoiler', ups: ['handling'] },
      { name: 'TIRE BAY', icon: '🛞', tyres: true, ups: ['tires'] },
      { name: 'WEAPONS CACHE', icon: '🔫', ups: ['cannon', 'rack', 'magazine'] },
      { name: 'CHASSIS & CREW', icon: '🛡️', ups: ['armor', 'nitro', 'dampers', 'beacon'] },
    ];

    for (const bay of BAYS) {
      const box = document.createElement('div');
      box.className = 'bay';
      // A SLOT BAY SAYS WHAT THIS CHASSIS CAN TAKE, up front, so the greyed
      // cards below are explained before they are met.
      const cap = bay.slot
        ? `<b class="bay-cap">CHASSIS CLASS ${this.mountMax(bay.slot)}${
  this.mountMax(bay.slot) < MOUNT_MAX ? ` · ${PART_SLOT[bay.slot].mountName} RAISES IT` : ' · MAXED'}</b>`
        : '';
      box.innerHTML = `<div class="bay-head"><span>${bay.icon}</span>${bay.name}${cap}</div>`;

      // ---- the CHOICE half: parts, as pictures
      if (bay.slot) {
        const slot = PART_SLOT[bay.slot];
        const fit = this.fittedPart(slot.key);
        const grid = document.createElement('div');
        grid.className = 'bay-grid';
        // POWER is what the mockup's bars promise, so it has to mean
        // something: for a block it is speed x pull, for a wing it is the
        // downforce it makes. Both normalised against the best in the slot, so
        // a full bar is "the strongest thing here" rather than an arbitrary
        // number that looks precise and is not.
        const power = (pt) => (slot.key === 'engine'
          ? (pt.speed ?? 1) * (pt.accel ?? 1) : 1 + (pt.down ?? 0) * 2);
        const top = Math.max(...slot.parts.map(power));
        for (const pt of slot.parts) {
          const owned = !!rec.owned[`${slot.key}:${pt.id}`];
          const on = pt.id === fit.id;
          const lock = this.partLock(pt);
          const mount = this.partFits(slot, pt);
          // A CARD HAS TO SAY WHICH OF THREE WALLS IS IN THE WAY, because they
          // want three different things from the player: a race, a chassis
          // ladder, or a different car entirely. Lumping them into one padlock
          // is what makes a shop feel arbitrary.
          const wall = !mount.ok ? (mount.capped ? 'capped' : 'mount')
            : !lock.open && !owned ? 'earn' : null;
          const card = document.createElement('button');
          card.className = 'part-card' + (on ? ' on' : '')
            + (wall ? ` blocked ${wall}` : '') + (owned && !on ? ' owned' : '');
          card.dataset.slot = slot.key;
          card.dataset.part = pt.id;
          card.dataset.tier = pt.tier | 0;
          const pct = Math.round((power(pt) / top) * 100);
          const act = on ? ['fitted', 'FITTED']
            : wall === 'capped' ? ['lock', '⛔ WON\u2019T FIT']
              : wall === 'mount' ? ['lock', `🔧 ${mount.via.split(' ')[0]} ${mount.need}`]
                : wall === 'earn' ? ['lock', `🔒 ${lock.have}/${lock.need}`]
                  : owned ? ['own', 'INSTALL'] : ['buy', `${pt.cost.toLocaleString()} CR`];
          const why = wall === 'capped'
            ? `This body tops out at class ${this.mountMax(slot.key)}. Fits: ${
  this.partHomes(slot, pt).join(', ') || 'nothing in the catalogue'}`
            : wall === 'mount' ? `Needs ${mount.via} ${mount.need} (you are at ${mount.at})`
              : wall === 'earn' ? pt.lock.label : pt.sub;
          // MOUNT CLASS, ON EVERY CARD. It is the number the whole bay turns
          // on, so it is stated even when the part fits — otherwise a player
          // only ever meets it as a refusal.
          card.innerHTML = `<span class="pc-cls">CLASS ${pt.tier | 0}</span>
            <img class="pc-art" src="${icons[`${slot.key}:${pt.id}`]}" alt="">
            <span class="pc-name">${pt.name}</span>
            <span class="pc-bar"><i style="width:${pct}%"></i></span>
            <span class="pc-act ${act[0]}">${act[1]}</span>
            <span class="pc-sub">${why}</span>`;
          card.addEventListener('click', () => this._partAction(slot, pt));
          grid.appendChild(card);
        }
        box.appendChild(grid);
        const msg = this._buildMsg?.slot === slot.key ? this._buildMsg.text : '';
        if (msg) box.insertAdjacentHTML('beforeend', `<p class="bay-msg">${msg}</p>`);
      }

      // ---- the TYRE BAY keeps its own renderer; it already knows about
      // compounds, what this world wants and what the ladder has unlocked
      if (bay.tyres) {
        const slotEl = document.createElement('div');
        slotEl.id = 'tyre-bay';
        box.appendChild(slotEl);
      }

      // ---- the LADDER half: upgrade lines, in the same clothes
      for (const key of bay.ups) {
        const u = UPGRADES.find((x) => x.key === key);
        if (!u) continue;
        box.appendChild(this._upgradeCard(u, up, icons));
      }
      host.appendChild(box);
    }
    this._renderTyreBay();
  }

  /** One upgrade line as a card — the same shape as a part card, because a
   *  player does not care which of the game's two systems a thing came out of.
   *  The bar is the LEVEL, the button is the next rung's price. */
  _upgradeCard(u, up, icons = null) {
    const lvl = up[u.key] | 0;
    const card = document.createElement('div');
    card.className = 'up-card' + (lvl >= u.max ? ' maxed' : '');
    card.dataset.up = u.key;
    // TIRES says which rung opens a compound rather than repeating "+4% grip"
    // on the rungs where it opens nothing — kept from the old row renderer,
    // because it is the one line here that was ever misleading.
    let desc = u.desc;
    if (u.key === 'tires') {
      const nowMax = tyreMaxClass(this.cars.selected, up);
      const nextMax = tyreMaxClass(this.cars.selected, { ...up, tires: lvl + 1 });
      desc = nextMax > nowMax
        ? `NEXT LEVEL UNLOCKS ${TYRE_LABEL[nextMax]} TYRES · +4% grip`
        : `+4% grip / lvl · ${TYRE_LABEL[nowMax]} IS YOUR BEST COMPOUND`;
    }
    const pips = Array.from({ length: u.max },
      (_, i) => `<b class="${i < lvl ? '' : 'off'}"></b>`).join('');
    // A RENDERED PART BEATS AN EMOJI wherever one exists. Three of the ten
    // ladders sell hardware the shop already has a model of — the gun, the
    // rocket rail, the drum — and the tyre ladder sells rubber. The rest are
    // tools and fluids with nothing to photograph, and keep their glyph.
    const ART = { cannon: 'weapon:cannon', rack: 'weapon:rack',
      magazine: 'weapon:magazine', tires: 'tyre:gravel' };
    const art = icons?.[ART[u.key]];
    card.innerHTML = `<span class="uc-ic">${
  art ? `<img src="${art}" alt="">` : u.icon}</span>
      <span class="uc-main"><span class="uc-nm">${u.name}</span>
        <span class="uc-pips">${pips}<i>LVL ${lvl}/${u.max}</i></span>
        <span class="uc-desc">${desc}</span></span>`;
    const btn = document.createElement('button');
    btn.className = 'up-buy' + (lvl >= u.max ? ' maxed' : '');
    if (lvl >= u.max) {
      btn.textContent = 'MAX';
      btn.disabled = true;
    } else {
      const cost = upgradeCost(lvl);
      btn.textContent = `${cost.toLocaleString()} CR`;
      btn.disabled = this.garage.credits < cost;
      btn.addEventListener('click', () => {
        if (this.garage.credits < cost) return;
        this.garage.credits -= cost;
        up[u.key]++;  // this car only — every other machine keeps its own build
        saveJSON(this._pkey('garage'), this.garage);
        this.applyUpgrades();
        this.renderGarage();
        // a TIRES level can change which worlds this car may enter, so the
        // track list, the shop and the start button all have to be retold
        this.renderCarShop();
        this._renderLevelCards();
        this._syncStartButton();
      });
    }
    card.appendChild(btn);
    return card;
  }

  /** THE SHOP FLOOR — a live view of the car you are building.
   *
   *  "Match the graphics and change the look realtime." The still picture was
   *  honest but dead: you fitted a wing and a new JPEG appeared. This is the
   *  real car on a real floor, turning, and a part lands on it the instant you
   *  buy it.
   *
   *  IT COSTS A SECOND WebGL CONTEXT, so it earns it back three ways:
   *    - it only ever runs while the GARAGE tab is actually on screen. Leaving
   *      the tab, opening a race, or backgrounding the page stops the loop
   *      dead (see _stageRun).
   *    - it renders at 30fps, not 60. Nothing here moves fast enough to tell,
   *      and this is a menu on a phone that has a world drawing behind it.
   *    - the canvas is small and the pixel ratio is capped at 2.
   *  The still-picture path is kept for the car SHELF, which needs 6 pictures
   *  at once and must not animate.
   */
  _stage() {
    if (this.__stage) return this.__stage;
    const cvs = document.createElement('canvas');
    cvs.className = 'bp-stage';
    const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, canvas: cvs });
    r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    r.toneMapping = THREE.ACESFilmicToneMapping;
    // 1.34, UP FROM 1.28. The canopy gobo is a multiply: it can only darken,
    // and covering the ground with it cost the bay 16 points of mean
    // luminance (`bayblack.mjs`: 122 -> 106) — which is exactly what putting a
    // scrim over a set does. So open up. The sky dome is `toneMapped: false`
    // and does not move with this; only the lit world comes back up.
    r.toneMappingExposure = 1.34;
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    const scene = new THREE.Scene();
    // FAR 600, NOT 120. The diorama's sky dome is at 210 u and its far treeline
    // at 150, and at a far plane of 120 both were clipped away entirely — which
    // is what 7-9% of the bay rendering TRANSPARENT actually was, and why
    // replacing a flat backdrop with a cylinder and then a dome moved the
    // number not at all. Two backdrops were redesigned before the camera was
    // asked whether it could see either of them.
    const cam = new THREE.PerspectiveCamera(32, 1.6, 0.1, 600);

    // ---- THE TRAIL IN THE PINES. See `_diorama`: the bay is a place in the
    // game's own world now, not a painted room, and the repaint-for-contrast,
    // the moving wall band and the coloured back lamps went with the room.
    scene.add(this._diorama());
    // DEPTH COMES FROM AIR. Every world in this game is fogged (`THEMES.forest`
    // runs 320 to 1500); without it a 160 u wood is a flat wall of identical
    // cones and the near trees read the same as the far. Scaled to the
    // diorama and starting well beyond the car, which sits 10 u out.
    scene.fog = new THREE.Fog(0xd2e2cc, 46, 185);

    // Forest light, straight off `THEMES.forest`: a warm sun a little over
    // the shoulder, a cool sky bounce, green off the ground.
    scene.add(new THREE.HemisphereLight(0xa8ccff, 0x4a7a34, 1.15));
    const key = new THREE.DirectionalLight(0xfff0cc, 2.5);
    key.position.set(5, 9, 6);
    key.castShadow = true;
    // A TIGHT FRUSTUM ROUND THE CAR. The trail runs 300 u and the wood 160;
    // a shadow camera that tried to cover them would have no resolution left
    // for the one thing this screen is about. Only the car casts.
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -10; key.shadow.camera.right = 10;
    key.shadow.camera.top = 10; key.shadow.camera.bottom = -10;
    key.shadow.camera.far = 40;
    key.shadow.normalBias = 0.02;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xbcd8ff, 0.55);
    fill.position.set(-6, 4, -5);
    scene.add(fill);
    // the rim off the trees behind, so a dark flank still has an edge
    const rim = new THREE.DirectionalLight(0xffe0b0, 1.25);
    rim.position.set(-4, 5.5, -8);
    scene.add(rim);

    const pivot = new THREE.Group();
    scene.add(pivot);
    this.__stage = { cvs, r, scene, cam, pivot, spin: 0, sig: null, raf: 0, last: 0 };
    return this.__stage;
  }

  /** Throw away a stage car.
   *
   *  GEOMETRY ALWAYS; MATERIALS ONLY OUTSIDE THE KIT. The upgrade kit's
   *  materials are shared module-level singletons — disposing one blanks the
   *  kit on every car in the game and can pull a material out from under an
   *  in-flight compile (see disposeKit in vehicles.js, and r230). The BODY's
   *  materials are built per mesh, so those are ours to free, and a player who
   *  fits fifty parts in a session would otherwise leave fifty bodies' worth
   *  of them behind.
   */
  _dropCarMesh(mesh) {
    const kit = mesh.getObjectByName('upgradeKit');
    const inKit = (o) => { for (let n = o; n; n = n.parent) if (n === kit) return true; return false; };
    mesh.traverse((o) => {
      if (o.geometry) o.geometry.dispose?.();
      // ...and NOT the lamp rig's material either. It is a module singleton
      // shared by every car in the game (vehicles.js `carLightMaterial`), so
      // disposing one bay car's copy would blank the headlights on all of
      // them — the same trap as the upgrade kit's shared materials above.
      if (!o.material || (kit && inKit(o)) || o === mesh.userData?.carLights) return;
      for (const m of (Array.isArray(o.material) ? o.material : [o.material])) m.dispose?.();
    });
  }

  /** Put the current build on the stage — only when it has actually changed. */
  _stageSync() {
    const st = this._stage();
    const car = CAR_CATALOG.find((c) => c.key === this.cars.selected);
    if (!car) return;
    const up = this.carUpgrades();
    const sig = JSON.stringify([car.key, up, this.carParts().fitted]);
    if (st.sig === sig) return;
    st.sig = sig;
    if (st.car) { st.pivot.remove(st.car); this._dropCarMesh(st.car); }
    const mesh = buildCarMesh(car.spec);
    applyUpgradeKit(mesh, up, {
      engine: this.fittedPart('engine'), spoiler: this.fittedPart('spoiler') });
    // ...but NOT the lamp rig. It is additive quads, and three.js casts from
    // the depth material regardless of blending — a beam lying on the floor
    // would print itself back as a black strip.
    mesh.traverse((o) => { if (o.isMesh) o.castShadow = o !== mesh.userData?.carLights; });
    st.car = mesh;
    st.pivot.add(mesh);
    // A CONTACT SHADOW, because the key light cannot give one here. The key
    // sits at (5, 9, 6) and the camera looks in from (6.4, 3.4, 7.6) — nearly
    // the same azimuth — so the cast shadow falls behind the car and the car
    // hides all of it. Moving the key to throw the shadow into view would take
    // the light off the face the camera is looking at. A painted disc grounds
    // the machine without touching the lighting, which is what a product shot
    // does. It rides the pivot so it turns with the car.
    if (!st.contact) {
      st.contact = new THREE.Mesh(new THREE.PlaneGeometry(1, 1),
        new THREE.MeshBasicMaterial({ map: contactShadowTexture(), color: 0x241c14,
          transparent: true, opacity: 0.62, depthWrite: false }));
      st.contact.rotation.x = -Math.PI / 2;
      st.contact.renderOrder = 1;
      st.pivot.add(st.contact);
    }
    {
      const b = new THREE.Box3().setFromObject(mesh);
      const sz = b.getSize(new THREE.Vector3());
      st.contact.scale.set(sz.x * 1.35, sz.z * 1.15, 1);
      st.contact.position.set(b.getCenter(new THREE.Vector3()).x, 0.006, 0);
    }
    // KICKED-UP DUST, and it is not a cheat. The pivot turns the car at
    // 0.42 rad/s with all four tyres planted, so they are scrubbing SIDEWAYS
    // across loose gravel the whole time this screen is open — which throws
    // dust in the real world. It is also the only moving thing in the picture
    // that reports on the SURFACE rather than on the car, which is what the
    // dust behind a rally car is for.
    //
    // Polygonal, not a soft sprite: flat-shaded icosahedra, lit by the same
    // key as everything else, so a puff has a bright face and a dark one and
    // belongs to this scene instead of being pasted over it.
    if (!st.dust) {
      const geo = new THREE.IcosahedronGeometry(1, 0);
      // SIXTEEN SMALL ONES, NOT TEN BIG ONES. The first cut peaked at 0.32
      // opacity on a 0.9 u puff and the result sat against the rear tyre
      // looking like a boulder someone had parked there — one solid lump with
      // a lit face and a dark one is a ROCK, whatever colour it is. Dust is a
      // cluster, it is paler than the stone around it, and you can see through
      // it: half the size, two-thirds the opacity, and a good half-metre
      // further back so it trails the wheel instead of touching it.
      st.dust = [];
      for (let i = 0; i < 16; i++) {
        const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
          color: 0xd8c8ac, roughness: 1, flatShading: true,
          transparent: true, opacity: 0, depthWrite: false }));
        m.renderOrder = 2;                 // over the contact disc, under nothing
        st.pivot.add(m);
        st.dust.push({ m, t: i / 16, side: i % 2 ? 1 : -1, jx: 0, jz: 0 });
      }
    }
    if (st.cam.aspect) this._frameStage(st);
  }

  /** FRAME THE CAR FROM THE CAR, not from a guessed number.
   *
   *  The first cut divided a constant by the aspect ratio and put the camera
   *  6 units from a 6.5-unit-long car — the shot came out inside the door.
   *  Measure the build's bounding sphere and back off far enough that it fits
   *  the TIGHTER of the two fields of view, which is the vertical one on a
   *  phone and the horizontal one on a wide canvas. Self-tuning: it holds for
   *  any car in the catalogue, any wing, and any canvas the layout hands it.
   */
  _frameStage(st) {
    if (!st.car) return;
    // This measures BODYWORK even though the car carries a lamp rig whose
    // beams reach 19 u ahead: the rig reports the body's box as its own
    // (vehicles.js, `lg.boundingBox`), so there is one place that knows the
    // difference rather than one per caller.
    const box = new THREE.Box3().setFromObject(st.car);
    const size = box.getSize(new THREE.Vector3());
    const mid = box.getCenter(new THREE.Vector3());
    // A BOUNDING SPHERE IS THE WRONG SHAPE FOR A CAR. It has to contain the
    // diagonal, so a 6.5-long, 1.6-tall machine gets a radius set by its
    // LENGTH and the framing leaves half the canvas empty above and below it.
    // Fit the box instead: the widest silhouette it can turn to is its length,
    // and the height is just its height.
    const vfov = (st.cam.fov * Math.PI) / 180;
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * st.cam.aspect);
    const halfW = 0.5 * Math.max(size.x, size.z);      // worst case as it spins
    const halfH = 0.5 * size.y;
    // THE MULTIPLIER IS MEASURED, NOT DERIVED. The small-angle fit above is a
    // long way out for a 6.4 m car seen from a 3/4 angle 10 m away — its near
    // end projects three times the size of its far end — so `bayfit.mjs`
    // sweeps distance against the car's actual pixel box.
    //
    // 2.0, up from the 1.62 that framed the car in a painted room. The bay is
    // a place now, and a photograph on a rally trail wants the trail in it:
    // at 1.62 the car sat on bare dirt with the wood cropped away above it.
    const dist = Math.max(halfW / Math.tan(hfov / 2), halfH / Math.tan(vfov / 2)) * 2.0;
    st.cam.position.set(6.4, 3.4, 7.6).normalize().multiplyScalar(dist);
    st.cam.lookAt(0, mid.y * 0.9, 0);
    st.cam.updateProjectionMatrix();
  }

  /** Start or stop the loop. The ONLY thing that should ever keep it running
   *  is the garage tab being visible on the title screen. */
  _stageRun(on) {
    const st = this.__stage;
    if (!st) return;
    if (!on) {
      if (st.raf) cancelAnimationFrame(st.raf);
      st.raf = 0;
      return;
    }
    if (st.raf) return;
    const tick = (t) => {
      st.raf = requestAnimationFrame(tick);
      const vis = this.state === 'title'
        && !document.getElementById('title-screen')?.classList.contains('hidden')
        && document.getElementById('tab-btn-garage')?.classList.contains('current')
        && st.cvs.isConnected;
      if (!vis) { this._stageRun(false); return; }
      if (t - st.last < 33) return;                    // 30fps is plenty for a turntable
      const dt = Math.min(0.1, (t - st.last) / 1000);
      st.last = t;
      st.spin += dt * 0.42;
      st.pivot.rotation.y = st.spin;
      // the rear contact patches are fixed at (+/-1.3, -1.5) on every car in
      // the catalogue (vehicles.js builds its wheels off that literal), so the
      // emitters do not need to measure anything
      for (const p of st.dust || []) {
        p.t += dt * 0.58;
        if (p.t >= 1) {
          p.t -= 1;
          p.jx = (Math.random() - 0.5) * 0.42;
          p.jz = (Math.random() - 0.5) * 0.36;
        }
        const k = p.t, s = 0.085 + k * 0.30;
        p.m.scale.set(s * 1.55, s * 0.55, s * 1.35);   // low and wide: it hugs the ground
        p.m.position.set(p.side * (1.26 + k * 0.52) + p.jx, 0.05 + k * 0.26,
          -1.78 + p.jz - k * 0.62);
        p.m.rotation.set(k * 1.1, k * 1.7 * p.side, 0);
        p.m.material.opacity = Math.sin(Math.PI * k) ** 1.4 * 0.26;
      }
      const w = st.cvs.clientWidth || 300;
      const h = st.cvs.clientHeight || 190;
      if (st.w !== w || st.h !== h || st.framedFor !== st.sig) {
        st.w = w; st.h = h; st.framedFor = st.sig;
        st.r.setSize(w, h, false);
        st.cam.aspect = w / h;
        st.cam.updateProjectionMatrix();
        this._frameStage(st);
      }
      st.r.render(st.scene, st.cam);
    };
    st.last = performance.now();
    st.raf = requestAnimationFrame(tick);
  }

  /** THE MACHINE YOU HAVE BUILT, at the top of its own garage. */
  _renderBuildPreview() {
    const el = document.getElementById('build-preview');
    if (!el) return;
    const car = CAR_CATALOG.find((c) => c.key === this.cars.selected);
    if (!car) return;
    const eng = this.fittedPart('engine');
    const wing = this.fittedPart('spoiler');
    const p = this.player;
    const tc = tyreClass(this.cars.selected, this.carUpgrades(), this.fittedTyre());
    // WHAT IS UPGRADED, SAID OUT LOUD. A spec chip is lit when it is above
    // the stock part and dim when it is not, every stat carries its delta
    // against a STOCK example of the same chassis, and the mods strip counts
    // what the money has actually bought. Before this the panel showed four
    // numbers with nothing to compare them to — "TOP 56" tells a player
    // nothing about whether 56 is what they started with.
    const up = this.carUpgrades();
    const engStock = stockPart(PART_SLOT.engine);
    const wingStock = stockPart(PART_SLOT.spoiler);
    const base = this._base ?? { maxSpeed: p?.maxSpeed ?? 0, accel: p?.accel ?? 0, maxHealth: p?.maxHealth ?? 0 };
    const chip = (label, mod) => `<span class="${mod ? 'up' : ''}">${mod ? '▲ ' : ''}${label}</span>`;
    const num = (label, now, was, unit = '') => {
      const d = Math.round(now) - Math.round(was);
      return `<span><i>${label}</i><b>${Math.round(now)}${unit}</b>${
  d ? `<u class="${d > 0 ? 'up' : 'dn'}">${d > 0 ? '+' : ''}${d}</u>` : ''}</span>`;
    };
    const ladders = UPGRADES.reduce((n, u) => n + (up[u.key] | 0), 0);
    const swapped = (eng.id !== engStock.id ? 1 : 0) + (wing.id !== wingStock.id ? 1 : 0);
    el.innerHTML = `<div class="bp-shop"></div>
      <div class="bp-side">
        <div class="bp-name">${car?.name ?? ''}${
  ladders || swapped ? '<b class="bp-tag">MODIFIED</b>' : '<b class="bp-tag stock">STOCK</b>'}</div>
        <div class="bp-spec">${chip(eng.name, eng.id !== engStock.id)}${
  chip(wing.name, wing.id !== wingStock.id)}${chip(`${TYRE_LABEL[tc]} TYRES`, tc > 0)}</div>
        <div class="bp-nums">
          ${num('TOP', p?.maxSpeed ?? 0, base.maxSpeed)}
          ${num('PULL', p?.accel ?? 0, base.accel)}
          ${num('HULL', p?.maxHealth ?? 0, base.maxHealth)}
          ${num('DOWN', (p?.downforce ?? 0) * 100, 0, '%')}
        </div>
        <div class="bp-mods">${swapped} PART${swapped === 1 ? '' : 'S'} SWAPPED ·
          ${ladders} UPGRADE${ladders === 1 ? '' : 'S'} FITTED</div>
      </div>`;
    // THE LIVE CANVAS IS MOVED, NEVER REBUILT. innerHTML above throws away
    // whatever was in the box, so the stage is re-attached afterwards — a new
    // WebGL context per repaint of the garage would be a context leak, and
    // browsers cap how many a page may hold.
    const st = this._stage();
    el.querySelector('.bp-shop')?.appendChild(st.cvs);
    this._stageSync();
    this._stageRun(true);
  }

  /** Tap a part: fit it if it is yours, buy it if you can afford it, and say
   *  why not if neither. Buying FITS immediately — nobody buys a wing to leave
   *  it on the shelf, and a second tap to wear it is a step with no decision
   *  in it. */
  _partAction(slot, part) {
    const carKey = this.cars.selected;
    const rec = this.carParts(carKey);
    const key = `${slot.key}:${part.id}`;
    const say = (text) => { this._buildMsg = { slot: slot.key, text }; };
    // THE CHASSIS IS CHECKED BEFORE THE WALLET. Buying a part you cannot bolt
    // on is the worst outcome available here, so the bay says no first.
    const fit = this.partFits(slot, part, carKey);
    if (!fit.ok) {
      say(fit.capped
        ? `${part.name} WILL NOT GO ON A ${(CAR_CATALOG.find((c) => c.key === carKey)?.name) || 'THIS'}`
          + ` — THIS CHASSIS TOPS OUT BELOW IT. IT FITS: ${this.partHomes(slot, part).join(', ')}.`
        : `${part.name} NEEDS ${fit.via} LEVEL ${fit.need} — YOU ARE AT ${fit.at}.`
          + ` THE CHASSIS CANNOT CARRY IT YET.`);
      this._renderGarageBays();
      return;
    }
    if (!rec.owned[key]) {
      const lock = this.partLock(part);
      if (!lock.open) {
        say(`🔒 ${part.name} IS EARNED, NOT BOUGHT — ${part.lock.label}`
          + ` · YOU ARE AT ${lock.have} OF ${lock.need}`);
        this._renderGarageBays();
        return;
      }
      if (this.garage.credits < part.cost) {
        say(`${part.name} COSTS ${part.cost.toLocaleString()} CR — YOU HAVE `
          + `${this.garage.credits.toLocaleString()} CR. RACE FOR THE REST.`);
        this._renderGarageBays();
        return;
      }
      this.garage.credits -= part.cost;
      rec.owned[key] = 1;
      say(`🔧 BOUGHT AND FITTED ${part.name}`);
    } else {
      say(`🔧 FITTED ${part.name}`);
    }
    rec.fitted[slot.key] = part.id;
    saveJSON(this._pkey('garage'), this.garage);
    this.applyUpgrades();          // stats AND the mesh, in one place
    this.renderGarage();           // rebuilds every bay, and the preview
    this.renderCarShop();          // the shelf quotes this car's ratings
    this._syncStartButton();
  }

  /** THE TYRE BAY — the answer to "there is no way to change tyres".
   *
   *  Three compounds. Anything at or below the car's own class is always
   *  available, because a machine can always run road rubber; anything above
   *  is what the TIRES line unlocks. What is FITTED is a free choice, so
   *  "WRONG TYRES" on a start button is now a thing you can act on rather
   *  than a fact about a purchase you cannot undo. */
  _renderTyreBay() {
    const el = document.getElementById('tyre-bay');
    if (!el) return;
    const car = this.cars.selected;
    const up = (this.garage.upgrades || {})[car];
    const max = tyreMaxClass(car, up);
    const now = this.fittedTyre(car);
    const need = this.level ? surfaceClass(this.level) : null;
    // REAL RUBBER, not three glyphs. The compounds differ by TREAD and the
    // shop already renders each one — a slick band, chunky blocks, fine sipes.
    const art = this._partIcons();
    const ICON = ['road', 'gravel', 'snow'].map(
      (id) => `<img class="tyre-art" src="${art[`tyre:${id}`]}" alt="">`);
    const auto = this.garage.fitted?.[car] == null;
    const btns = [0, 1, 2].map((c) => {
      const locked = c > max;
      const cls = ['tyre-opt', !auto && c === now ? 'on' : '', locked ? 'locked' : '',
        need === c ? 'want' : ''].filter(Boolean).join(' ');
      return `<button class="${cls}" data-tyre="${c}"${locked ? ' disabled' : ''}>`
        + `${locked ? '🔒' : ICON[c]}<b>${TYRE_LABEL[c]}</b>`
        + `<i>${locked ? 'BUY TIRES ' + (c >= 2 ? 3 : 1) : need === c ? 'IDEAL HERE' : ''}</i></button>`;
    }).join('');
    // AUTO IS THE DEFAULT AND IT IS THE POINT OF BUYING TYRES AT ALL: it fits
    // the compound each world asks for, capped by what you own, so a purchase
    // widens where you are ideal instead of handing you something to undo.
    const autoBtn = `<button class="tyre-opt tyre-auto${auto ? ' on' : ''}" data-tyre="auto">`
      + `⚙<b>AUTO</b><i>${auto ? `FITTED ${TYRE_LABEL[now]}` : 'FIT PER WORLD'}</i></button>`;
    el.innerHTML = `<div class="panel-head">TYRE BAY${this.level
      ? ` — ${this.level.name} WANTS ${TYRE_LABEL[need]}` : ''}</div>`
      + `<div class="tyre-row">${autoBtn}${btns}</div>`
      + (max < 2
        ? `<div id="jobs-note">You own up to ${TYRE_LABEL[max]}. `
          + `TIRES STACK ${max < 1 ? 1 : 3} unlocks ${TYRE_LABEL[max + 1]}, `
          + `which is what the ${TYRE_LABEL[2] === TYRE_LABEL[max + 1] ? 'ICE' : 'LOOSE'} `
          + `stages want.</div>`
        : '');
    for (const b of el.querySelectorAll('.tyre-opt')) {
      b.addEventListener('click', () => {
        this.audio?.ui?.();
        this.fitTyre(b.dataset.tyre === 'auto' ? null : +b.dataset.tyre);
      });
    }
  }

  /** Draw a smoothed closed track outline on a world-card canvas. */
  _drawCircuitMap(cnv, themeKey, locked, current) {
    const pts = circuitPoints(themeKey);
    const ctx = cnv.getContext('2d');
    const W = cnv.width, H = cnv.height, pad = Math.max(5, W * 0.08);
    ctx.clearRect(0, 0, W, H);   // redrawn in place when the highlight moves
    const lw = W / 150; // stroke scale — the badge canvas is small
    let nx = Infinity, xx = -Infinity, nz = Infinity, xz = -Infinity;
    for (const [x, z] of pts) {
      nx = Math.min(nx, x); xx = Math.max(xx, x);
      nz = Math.min(nz, z); xz = Math.max(xz, z);
    }
    const s = Math.min((W - pad * 2) / (xx - nx), (H - pad * 2) / (xz - nz));
    const ox = (W - (xx - nx) * s) / 2 - nx * s;
    const oz = (H - (xz - nz) * s) / 2 - nz * s;
    const P = pts.map(([x, z]) => [x * s + ox, z * s + oz]);
    const n = P.length;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const path = () => {
      ctx.beginPath();
      ctx.moveTo((P[0][0] + P[n - 1][0]) / 2, (P[0][1] + P[n - 1][1]) / 2);
      for (let i = 0; i < n; i++) {
        const a = P[i], b = P[(i + 1) % n];
        ctx.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
      }
      ctx.closePath();
    };
    path(); ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.lineWidth = 7 * lw; ctx.stroke();
    path();
    ctx.strokeStyle = locked ? 'rgba(255,233,168,.35)' : current ? '#ffd400' : '#f4e2b8';
    ctx.lineWidth = 3 * lw; ctx.stroke();
    if (!locked) { // start-line dot
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(P[0][0], P[0][1], 3 * lw, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 1.5 * lw; ctx.stroke();
    }
  }

  /** Render each catalog car's real voxel mesh to a 3/4-view icon (cached). */
  /** ONE OFF-SCREEN STUDIO, borrowed by everything that needs a picture of a
   *  mesh: the car shelf, the part shop and the build preview.
   *
   *  It was inlined in `_carIcons` and rendered six cars once at boot. The
   *  graphical garage asks for a picture of every PART as well, and of the
   *  player's own car every time the build changes, so the renderer, the
   *  lights and the camera are set up once and handed out.
   *
   *  DELIBERATELY NOT A LIVE CANVAS. A second WebGL context animating behind
   *  the menu costs a frame budget on the phone this game is for, and the menu
   *  already has a world rendering behind it. Every picture here is rendered
   *  ONCE to a data URL and then it is an `<img>` — free to scroll, free to
   *  re-layout, and gone from the GPU the moment it is drawn.
   */
  /** THE SWEEP BEHIND EVERY STUDIO PICTURE.
   *
   *  Reported directly: "light up all background in the garage, so it is not
   *  black". The build bay's own canvas measures a mean luminance of 121 and
   *  is fine; the CARDS are the problem — the studio renders with `alpha:true`
   *  and no backdrop at all, so every car and every part is a cut-out floating
   *  on whatever is behind it, and behind it is a near-black panel. Measured
   *  on the shelf: 20-31% of each icon's opaque pixels under luminance 34, on
   *  a card darker still.
   *
   *  A photographer's answer, not a lighting one: a cyclorama. One unlit
   *  gradient plane, light at the top and falling to a warmer floor tone, big
   *  enough and far enough back to fill the frame at every distance the studio
   *  shoots from. Unlit and untone-mapped so it is EXACTLY the colour asked
   *  for whatever the exposure, and `depthWrite: false` with a renderOrder
   *  behind everything so it can never occlude the subject.
   */
  /** THE FOREST THE CAR IS PARKED IN.
   *
   *  Asked for with a picture and "use this example 1:1": the garage's cars
   *  stand on a rally trail in the pines, not in a studio. This replaces the
   *  painted room of r259-r260 entirely — the repaint-for-contrast, the moving
   *  wall band and the coloured back lamps are all gone with it, because a
   *  photograph taken on the stage has no wall to light.
   *
   *  BUILT FROM THE GAME'S OWN NUMBERS. The silhouettes are `_buildTrees`'s
   *  two-tier and three-tier pines (track.js), and every colour is lifted
   *  straight out of `THEMES.forest` — trunk 0x6b4423, foliage 0x2c6e2a over
   *  0x3c8a34, terrain 0x4f8a35 with 0x9c7a48 dirt, rock 0x8d8578. A backdrop
   *  invented alongside the world it is meant to belong to is the one way this
   *  could look wrong.
   *
   *  DETERMINISTIC. The shelf icons are rendered once and cached while the bay
   *  is live, so a forest that reseeds per load would put a different wood
   *  behind the same car in two places on one screen.
   */
  _diorama() {
    // BUILT ONCE, MOUNTED TWICE. The bay and the studio are separate scenes
    // and a Mesh belongs to one parent, but the GEOMETRY and the MATERIALS
    // behind it are the expensive half — four canvas textures and about seven
    // thousand welded triangles — and those are shared. Without this the
    // garage pays for two identical forests.
    //
    // IT MUST BE A CLONE, NOT A PARTS LIST. This used to keep `[geometry,
    // material]` pairs and remount them as `new THREE.Mesh(geo, mat)`, which
    // silently DROPPED every transform that lives on the Object3D instead of
    // in the vertices. Most of this diorama is welded, so most of it survived
    // that and the loss was invisible in the bay — but five things carry their
    // placement on the mesh, and all five broke in the second mount:
    //
    //   - the ground plane lost `rotation.x = -PI/2` and stood UP as a
    //     420 x 420 green wall through the origin,
    //   - the painted far treeline lost `position.y = 26` and sank into it,
    //   - the trail, the dapple gobo and the dome lost theirs with them.
    //
    // The studio takes the second mount, so that wall is what every car shelf
    // icon was shot against: measured at 82% of the frame, with every tree,
    // rock and bush in the diorama contributing 0%. Reported as cards that
    // look like a car on a green screen, and that is exactly what they were.
    //
    // `Object3D.clone()` copies transforms, `visible`, `receiveShadow` and
    // `renderOrder`, and shares geometry and material BY REFERENCE — which is
    // the whole saving the parts list was after, without the part it got
    // wrong. Every caller gets a clone, including the first, so no one holds
    // the template and one mount cannot hide the other by toggling `visible`.
    if (this.__dio) return this.__dio.clone();
    const F = { trunk: 0x6b4423, low: 0x2c6e2a, mid: 0x347a2f, top: 0x3c8a34,
      grass: 0x4f8a35, dirt: 0x9c7a48, rut: 0x86663a, rock: 0x8d8578, bush: 0x2f7a30,
      moss: 0x4c7f33 };
    const g = new THREE.Group();
    // ONE STREAM PER SUBSYSTEM, and this is a measurement tool, not tidiness.
    // The whole diorama used to draw from a single seeded `rnd()`, which means
    // INSERTING a call anywhere re-rolls every placement after it: adding the
    // canopy gobo moved every tree, rock and bush, and adding a per-tree tint
    // moved them all again. Twice that turned a before/after into two
    // different forests and made the numbers meaningless — and once it dropped
    // a bush, then a pine, into the camera's lap. Separate streams mean a
    // change to the pines cannot move a rock, and an A/B is an A/B.
    const stream = (n) => {
      let v = n >>> 0;
      return () => ((v = (v * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
    };
    const rSky = stream(20260823), rTrail = stream(0x51ee11), rDap = stream(0xc0ffee),
      rTree = stream(0x7a1115), rRock = stream(0x9b0c17), rScrub = stream(0x3ee9a2);

    // --- the sky, and the far treeline ------------------------------------
    //
    // A DOME, NOT A PANEL AND NOT A BAND. Measured twice: a flat plane behind
    // the origin left 7.4% of the bay rendering TRANSPARENT — a hole in the
    // sky with the dark panel showing through — because the camera looks in
    // from +x +z and at 150 u back its view axis is a hundred metres off to
    // one side. An open-topped cylinder was worse at 9.6%, since the frame
    // reaches over its rim. A sphere seen from inside has no edge to miss.
    const skyC = document.createElement('canvas');
    skyC.width = 8; skyC.height = 256;
    const s2 = skyC.getContext('2d');
    const sky = s2.createLinearGradient(0, 0, 0, 256);
    sky.addColorStop(0, '#2f7ac8');
    sky.addColorStop(0.42, '#549ad8');
    sky.addColorStop(0.74, '#9cc4de');
    sky.addColorStop(1, '#cfe0cc');
    s2.fillStyle = sky; s2.fillRect(0, 0, 8, 256);
    const skyTex = new THREE.CanvasTexture(skyC);
    skyTex.colorSpace = THREE.SRGBColorSpace;
    const dome = new THREE.Mesh(new THREE.SphereGeometry(210, 24, 16),
      new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide,
        toneMapped: false, depthWrite: false, fog: false }));
    dome.renderOrder = -2;
    g.add(dome);

    // The far wood is DRAWN, on a ring inside the dome: at 150 u back it is a
    // silhouette and nothing more, and a hundred more cones for it would cost
    // draw calls on the phone this menu is for.
    const cv = document.createElement('canvas');
    cv.width = 1024; cv.height = 128;
    const x = cv.getContext('2d');
    x.clearRect(0, 0, 1024, 128);
    for (const [band, col, base, hi] of [[0, '#7ea882', 74, 30], [1, '#547f5a', 92, 40],
      [2, '#365f40', 112, 50]]) {
      x.fillStyle = col;
      x.beginPath();
      x.moveTo(0, 128);
      for (let px = -10; px < 1034; px += 9 + band * 3) {
        const h = base - hi * (0.45 + rSky() * 0.55);
        x.lineTo(px, h); x.lineTo(px + (5 + band * 2), base);
      }
      x.lineTo(1034, 128); x.closePath(); x.fill();
    }
    const backTex = new THREE.CanvasTexture(cv);
    backTex.colorSpace = THREE.SRGBColorSpace;
    backTex.wrapS = THREE.RepeatWrapping;
    backTex.repeat.set(2.5, 1);
    const back = new THREE.Mesh(
      new THREE.CylinderGeometry(150, 150, 52, 48, 1, true),
      new THREE.MeshBasicMaterial({ map: backTex, side: THREE.BackSide,
        transparent: true, toneMapped: false, depthWrite: false, fog: false }));
    back.position.set(0, 26, 0);
    back.renderOrder = -1;
    g.add(back);

    // --- the ground, and the trail cut through it -------------------------
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(420, 420),
      new THREE.MeshStandardMaterial({ color: F.grass, roughness: 1 }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.02;
    ground.receiveShadow = true;
    g.add(ground);
    // The trail is PAINTED, not a flat fill: two wheel ruts, gravel speckle and
    // a few damp patches, on a texture that repeats down its length. A plain
    // tan plane with a razor edge was the one thing in this picture that said
    // "placed in a hurry".
    const tc = document.createElement('canvas');
    tc.width = 128; tc.height = 256;
    const t2 = tc.getContext('2d');
    t2.fillStyle = '#9c7a48'; t2.fillRect(0, 0, 128, 256);
    for (const [rx, rw] of [[30, 20], [78, 20]]) {
      const rg = t2.createLinearGradient(rx, 0, rx + rw, 0);
      rg.addColorStop(0, 'rgba(120,92,52,0)');
      rg.addColorStop(0.5, 'rgba(112,86,50,0.55)');
      rg.addColorStop(1, 'rgba(120,92,52,0)');
      t2.fillStyle = rg; t2.fillRect(rx, 0, rw, 256);
    }
    for (let i = 0; i < 420; i++) {                  // gravel
      const v = 130 + (rTrail() * 70 | 0);
      t2.fillStyle = `rgba(${v},${v - 18},${v - 46},${0.2 + rTrail() * 0.35})`;
      t2.fillRect(rTrail() * 128, rTrail() * 256, 1 + rTrail() * 2, 1 + rTrail() * 2);
    }
    for (let i = 0; i < 14; i++) {                   // damp patches
      t2.fillStyle = `rgba(96,74,44,${0.10 + rTrail() * 0.14})`;
      t2.beginPath();
      t2.ellipse(rTrail() * 128, rTrail() * 256, 6 + rTrail() * 16, 4 + rTrail() * 10, rTrail() * 3, 0, 6.3);
      t2.fill();
    }
    const trailTex = new THREE.CanvasTexture(tc);
    trailTex.wrapS = trailTex.wrapT = THREE.RepeatWrapping;
    trailTex.repeat.set(1, 14);
    trailTex.anisotropy = 4;
    trailTex.colorSpace = THREE.SRGBColorSpace;
    const trail = new THREE.Mesh(new THREE.PlaneGeometry(10.5, 300),
      new THREE.MeshStandardMaterial({ map: trailTex, roughness: 1 }));
    trail.rotation.x = -Math.PI / 2;
    trail.position.set(0, 0.005, -40);
    trail.receiveShadow = true;
    g.add(trail);
    // ...and the edge is BROKEN. A straight boundary between dirt and grass is
    // a line no trail has: these are worn patches straddling it.
    const scuffs = [];
    for (let i = 0; i < 46; i++) {
      const side = i % 2 ? 1 : -1;
      const w = 1.4 + rTrail() * 3.4, d = 1.6 + rTrail() * 4;
      const sx = side * (5.25 + (rTrail() - 0.35) * 2.2);
      const sz = -70 + rTrail() * 96;
      const q = new THREE.PlaneGeometry(w, d);
      q.rotateX(-Math.PI / 2);
      q.rotateY(rTrail() * 3);
      q.translate(sx, 0.008, sz);
      scuffs.push(q);
    }

    // --- dappled light through the canopy ----------------------------------
    // A GOBO, NOT A SHADOW. Real dapple would mean the wood casting, and the
    // key's shadow camera is a tight +/-10 box round the car precisely so the
    // one thing this screen is about keeps its 1024 px — widening it to cover
    // a 160 u wood spends that resolution on trees nobody is looking at. So
    // the canopy is painted and MULTIPLIED over the ground: white where the
    // sun lands, cool grey where a branch is in the way. Multiply can only
    // darken, so it can never blow out the trail, and it needs `toneMapped:
    // false` or white stops being white and the whole plane reads as haze.
    const dc = document.createElement('canvas');
    dc.width = dc.height = 512;
    const d2 = dc.getContext('2d');
    d2.fillStyle = '#ffffff'; d2.fillRect(0, 0, 512, 512);
    const blob = (cx, cy, r, a) => {
      const rg = d2.createRadialGradient(cx, cy, 0, cx, cy, r);
      rg.addColorStop(0, `rgba(122,140,150,${a})`);
      rg.addColorStop(0.5, `rgba(154,168,176,${a * 0.6})`);
      rg.addColorStop(1, 'rgba(255,255,255,0)');
      d2.save();
      d2.translate(cx, cy); d2.rotate(rDap() * 3); d2.scale(1, 0.5 + rDap() * 0.7);
      d2.translate(-cx, -cy);
      d2.fillStyle = rg;
      d2.beginPath(); d2.arc(cx, cy, r, 0, 6.3); d2.fill();
      d2.restore();
    };
    // kept off the border, so the plane's own rectangular edge is pure white
    // and there is no line in the grass where the dapple stops
    for (let i = 0; i < 19; i++) blob(70 + rDap() * 372, 70 + rDap() * 372, 34 + rDap() * 70, 0.72 + rDap() * 0.28);
    for (let i = 0; i < 22; i++) blob(70 + rDap() * 372, 70 + rDap() * 372, 8 + rDap() * 18, 0.45 + rDap() * 0.35);
    // ...and the long ones. A canopy throws round patches, but the TRUNKS
    // throw bars right across the trail, and those are what tell you the sun
    // is low and off to one side rather than straight overhead.
    for (let i = 0; i < 7; i++) {
      const bx = 60 + rDap() * 392, by = 60 + rDap() * 392, bl = 90 + rDap() * 150;
      d2.save();
      d2.translate(bx, by); d2.rotate(1.05 + (rDap() - 0.5) * 0.5);
      const lg = d2.createLinearGradient(0, -bl / 2, 0, bl / 2);
      lg.addColorStop(0, 'rgba(255,255,255,0)');
      lg.addColorStop(0.5, 'rgba(128,146,156,0.62)');
      lg.addColorStop(1, 'rgba(255,255,255,0)');
      d2.fillStyle = lg;
      d2.filter = 'blur(6px)';
      d2.fillRect(-(7 + rDap() * 9), -bl / 2, 14 + rDap() * 18, bl);
      d2.restore();
    }
    d2.filter = 'none';
    const dapTex = new THREE.CanvasTexture(dc);
    dapTex.colorSpace = THREE.SRGBColorSpace;
    // 62 ACROSS, NOT 46. The bay camera sees well past the verge on the near
    // side, and grass outside the gobo is grass with no canopy over it — a
    // pale flat band down one edge of the frame.
    const dapple = new THREE.Mesh(new THREE.PlaneGeometry(62, 104),
      new THREE.MeshBasicMaterial({ map: dapTex, transparent: true, fog: false,
        blending: THREE.MultiplyBlending, depthWrite: false, toneMapped: false }));
    dapple.rotation.x = -Math.PI / 2;
    dapple.position.set(0, 0.014, -30);
    g.add(dapple);

    // --- the pines ---------------------------------------------------------
    // POSITIONS ONLY, MERGED PER MATERIAL. Eighteen trees as separate meshes
    // is fifty-four draw calls behind a menu; merged by part it is three.
    const trunks = [], lows = [], mids = [], tops = [], rocks = [], bushes = [],
      moss = [];
    // `tint` is a PER-PIECE MULTIPLIER carried through the weld as a vertex
    // colour. Welding by material is what keeps this menu at three draw calls
    // for fifty trees, and the price has always been that every tree is
    // exactly the same green. A colour attribute costs one buffer and no draw
    // calls at all, and it is the only way to have both.
    const put = (arr, geo, sx, sy, sz, tx, ty, tz, ry = 0, tint = null) => {
      const q = geo.clone();
      q.scale(sx, sy, sz);
      if (ry) q.rotateY(ry);
      q.translate(tx, ty, tz);
      // ASSIGN A FRESH OBJECT, do not write into the one that is there.
      // `BufferGeometry.clone()` copies `userData` BY REFERENCE, so every
      // clone of `lowGeo` shares one object with `lowGeo` itself: writing
      // `q.userData.tint` gave all fifty trees the LAST tint assigned. The
      // wood looked varied in the screenshot and was not — `tintab.mjs`
      // reported the same numbers with the tints on and off, and the count of
      // distinct tints in the welded buffer was 1.
      q.userData = { tint };
      arr.push(q);
    };
    // ONE TINT PER TREE, not per tier: a trunk, a skirt and a crown that each
    // rolled their own would be three plants stacked up. Value spread plus a
    // warm/cool shift, because a wood varies in both.
    const treeTint = () => {
      // RANGE SET BY MEASUREMENT. At +/-20% value and +/-9% warmth,
      // `tintab.mjs` put the pine skirts at luminance sd 16.5 against 14.5
      // flat and the WARM spread at 4.3 -> 4.4, which is nothing: the tint was
      // there but too narrow to see past the facet shading. Wider on both
      // axes, and the warm one nearly doubled, because a wood varies in hue
      // more than it varies in brightness.
      const k = 0.72 + rTree() * 0.56;
      const w = (rTree() - 0.5) * 0.34;
      return [k * (1 + w), k, k * (1 - w * 0.9)];
    };
    const trunkGeo = new THREE.CylinderGeometry(0.3, 0.52, 3.4, 6);
    trunkGeo.translate(0, 1.7, 0);
    // THREE TIERS, NOT TWO. A pine in this style is stacked skirts, and two
    // cones make a fir-shaped blob; the third is what turns the silhouette
    // into something built. Measured at 16 triangles a tier — see the r264
    // entry in HANDOVER.md for what it bought.
    const lowGeo = new THREE.ConeGeometry(2.6, 4.2, 8);
    lowGeo.translate(0, 4.6, 0);
    const midGeo = new THREE.ConeGeometry(2.15, 3.7, 8);
    midGeo.translate(0, 6.3, 0);
    const topGeo = new THREE.ConeGeometry(1.45, 3.0, 8);
    topGeo.translate(0, 8.4, 0);
    for (let i = 0; i < 30; i++) {
      const side = i % 2 ? 1 : -1;
      // IN TO 9.6, from 11.5. The trail edge is at 5.25 and a skirt is 2.6
      // across, so a tree on this lane reaches to within two metres of the
      // dirt — which is what makes the path read as confined rather than as a
      // clearing with a wood somewhere behind it. 8.2 was closer still and
      // cropped every near crown off the top of the frame, which throws away
      // the stacked silhouette the third tier exists for.
      const lane = 9.6 + rTree() * 22;
      const tx = side * lane;
      // BEHIND THE CAR, like the bushes and the rocks. This ran to z +16, and
      // a 10 u pine that close to the camera is a green wedge across the
      // corner of a picture whose whole job is to show you a car.
      const tz = -58 + rTree() * 56;
      const sc = 0.78 + rTree() * 0.85;
      const t = treeTint();
      put(trunks, trunkGeo, sc, sc, sc, tx, 0, tz, 0, t);
      put(lows, lowGeo, sc, sc, sc, tx, 0, tz, 0, t);
      put(mids, midGeo, sc, sc, sc, tx, 0, tz, 0, t);
      put(tops, topGeo, sc, sc, sc, tx, 0, tz, 0, t);
    }
    // a mask row across the back, so the ground never meets the painted sky
    for (let i = 0; i < 22; i++) {
      const tx = -80 + i * 7.4 + rTree() * 3;
      const sc = 1.1 + rTree() * 0.6;
      const t = treeTint();
      put(trunks, trunkGeo, sc, sc, sc, tx, 0, -78 - rTree() * 12, 0, t);
      put(lows, lowGeo, sc, sc, sc, tx, 0, -78 - rTree() * 12, 0, t);
      put(mids, midGeo, sc, sc, sc, tx, 0, -78 - rTree() * 12, 0, t);
      // NO CROWN ON THE MASK ROW. `dioparts.mjs` put the top tier at 1.5
      // pixels per triangle — the worst rate in the diorama by four times —
      // and this row is the reason: it is 78 u back behind fog, doing one job,
      // which is stopping the ground from meeting the painted sky. The low
      // and mid tiers make that silhouette; the tip is 22 trees' worth of
      // triangles spent on nothing.
    }
    // --- rocks and scrub along the trail edge ------------------------------
    const rockGeo = new THREE.IcosahedronGeometry(1, 0);
    const bushGeo = new THREE.SphereGeometry(1, 6, 4);
    // ROADSIDE HAZARDS BELONG AT THE ROADSIDE. These sat 1.4 to 6 u off the
    // dirt, out in the field, where a boulder is scenery. Brought in to
    // straddle the 5.25 u trail edge they are what the outside of the corner
    // is made of, which is the only reason a rock is interesting.
    for (let i = 0; i < 16; i++) {
      const side = i % 2 ? 1 : -1;
      const rx = side * (5.4 + rRock() * 3.6);
      const rz = -38 + rRock() * 40;              // never in front of the car
      const sc = 0.5 + rRock() * 1.1;
      const ry = rRock() * 3;
      put(rocks, rockGeo, sc * 1.3, sc * 0.72, sc * 1.1, rx, sc * 0.3, rz, ry);
      // ...and the big ones wear moss on top, which is the one detail that
      // says the rock has been there longer than the trail has.
      if (sc > 0.76) put(moss, rockGeo, sc * 0.98, sc * 0.19, sc * 0.8, rx, sc * 0.88, rz, ry);
    }
    // NO LOOSE STONE. r264 scattered 150 squashed tetrahedra and octahedra on
    // the trail so the surface would have something the key light could catch,
    // on the argument that painted gravel is flat. At the size these are
    // actually seen — a shelf card is 148 px wide — four and eight-sided
    // solids do not read as gravel at all. They read as tiny white PYRAMIDS
    // dotted over the grass, which is what they were reported as, and the
    // shape is unmistakable once you zoom one up.
    //
    // `dioparts.mjs` had already put them at 0.9% of the bay for 752 triangles
    // — 3.0 pixels a triangle, the second-weakest thing in the diorama — so
    // they were marginal on the numbers before they were wrong on the eye.
    // Gone. The trail texture keeps its painted gravel, speckle and damp
    // patches, which is what carries "loose surface" from any distance the
    // game actually shows it from.
    for (let i = 0; i < 14; i++) {
      const side = i % 2 ? 1 : -1;
      const bx = side * (7.5 + rScrub() * 12);
      // BEHIND THE SUBJECT, ALWAYS. This ran to z +10, which is nearer the
      // camera than the car is, and a 2.5 u scrub bush there is a green blob
      // across the corner of a picture whose whole job is to show you a car.
      const bz = -46 + rScrub() * 44;
      const sc = 0.8 + rScrub() * 0.9;
      put(bushes, bushGeo, sc * 1.5, sc * 0.85, sc * 1.4, bx, sc * 0.5, bz);
    }
    const weld = (geos) => {
      // toNonIndexed() DROPS userData, so the tint has to be read off the
      // source geometry and carried across by hand.
      const parts = geos.map((q) => {
        const t = q.userData.tint;
        const r = q.index ? q.toNonIndexed() : q;
        r.userData.tint = t;
        return r;
      });
      let n = 0;
      for (const q of parts) n += q.attributes.position.array.length;
      const pos = new Float32Array(n);
      const col = parts.some((q) => q.userData.tint) ? new Float32Array(n) : null;
      let o = 0;
      for (const q of parts) {
        const a = q.attributes.position.array;
        pos.set(a, o);
        if (col) {
          const t = q.userData.tint || [1, 1, 1];
          for (let k = 0; k < a.length; k += 3) { col[o + k] = t[0]; col[o + k + 1] = t[1]; col[o + k + 2] = t[2]; }
        }
        o += a.length;
      }
      const out = new THREE.BufferGeometry();
      out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      if (col) out.setAttribute('color', new THREE.BufferAttribute(col, 3));
      out.computeVertexNormals();
      return out;
    };
    // Tufts LINING THE TRAIL, not sprinkled over the field. The first cut put
    // 150 small ones across nine metres of verge: 1800 triangles — 22% of the
    // whole diorama's geometry — for 1.4% of the frame, because at this camera
    // distance a 0.75 u blade is two pixels. Ninety, half again as tall, and
    // held inside four metres of the edge where the eye is already looking.
    const tufts = [];
    const tuftGeo = new THREE.ConeGeometry(0.3, 1.15, 4);
    tuftGeo.translate(0, 0.57, 0);
    for (let i = 0; i < 90; i++) {
      const side = i % 2 ? 1 : -1;
      const gx = side * (5.5 + rScrub() * 4.2);
      const gz = -58 + rScrub() * 82;
      const sc = 0.9 + rScrub() * 1.0;
      put(tufts, tuftGeo, sc, sc * (0.85 + rScrub() * 0.8), sc, gx, 0, gz, rScrub() * 3);
    }
    for (const [geos, col, flat] of [[trunks, F.trunk, false], [lows, F.low, true],
      [mids, F.mid, true], [tops, F.top, true], [rocks, F.rock, true],
      [moss, F.moss, true], [bushes, F.bush, true],
      [tufts, 0x5e8f3e, true], [scuffs, F.dirt, false]]) {
      const geo = weld(geos);
      const m = new THREE.Mesh(geo,
        new THREE.MeshStandardMaterial({ color: col, roughness: 0.95, flatShading: flat,
          vertexColors: !!geo.attributes.color }));
      m.receiveShadow = true;
      g.add(m);
    }
    // remember what was built, so the second scene mounts the same forest —
    // see the note at the top of this method for why this is the whole group
    // and not a list of its geometries
    this.__dio = g;
    return g.clone();
  }

  /** THE SWEEP BEHIND EVERY STUDIO PICTURE.
   *
   *  Reported directly: "light up all background in the garage, so it is not
   *  black". The build bay's own canvas measures a mean luminance of 121 and
   *  is fine; the CARDS are the problem — the studio renders with `alpha:true`
   *  and no backdrop at all, so every car and every part is a cut-out floating
   *  on whatever is behind it, and behind it is a near-black panel. Measured
   *  on the shelf: 20-31% of each icon's opaque pixels under luminance 34, on
   *  a card darker still.
   *
   *  A photographer's answer, not a lighting one: a cyclorama. One unlit
   *  gradient plane, light at the top and falling to a warmer floor tone, big
   *  enough and far enough back to fill the frame at every distance the studio
   *  shoots from. Unlit and untone-mapped so it is EXACTLY the colour asked
   *  for whatever the exposure, and `depthWrite: false` with a renderOrder
   *  behind everything so it can never occlude the subject.
   */
  _studioSweep() {
    const c = document.createElement('canvas');
    c.width = 4; c.height = 256;
    const g = c.getContext('2d');
    const grd = g.createLinearGradient(0, 0, 0, 256);
    grd.addColorStop(0, '#cfc5b5');
    grd.addColorStop(0.46, '#bcb1a0');
    grd.addColorStop(0.72, '#a2988a');
    grd.addColorStop(1, '#8b8175');
    g.fillStyle = grd;
    g.fillRect(0, 0, 4, 256);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  _studio(w, h, dist = 6.2) {
    let st = this.__studio;
    if (!st) {
      const r = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      r.setPixelRatio(2);
      r.toneMapping = THREE.ACESFilmicToneMapping;
      r.toneMappingExposure = 1.24;
      const scene = new THREE.Scene();
      scene.add(new THREE.HemisphereLight(0xbfe0ff, 0x6a5a44, 1.15));
      const sun = new THREE.DirectionalLight(0xfff3d6, 2.2);
      sun.position.set(4, 7, 5);
      scene.add(sun);
      // a second, colder key from the far side stops the dark parts of a black
      // carbon wing reading as a hole in the picture
      const fill = new THREE.DirectionalLight(0x9fc8ff, 0.55);
      fill.position.set(-5, 3, -4);
      scene.add(fill);
      // A RIM FROM BEHIND is what separates a chrome part from a dark card.
      // Without it the polished faces have nothing to catch and every block
      // came out as a silhouette.
      const rim = new THREE.DirectionalLight(0xffd9a0, 1.5);
      rim.position.set(-3, 5, -7);
      scene.add(rim);
      // THE CYCLORAMA. Every `_shoot` uses the same three-quarter rig
      // direction, so one plane squared up to it covers all of them: 110 u
      // across at 42 u behind the origin fills a 30-degree frame from any
      // distance the studio uses (the widest is the car shelf at 8.7).
      const dir = new THREE.Vector3(5.2, 3.2, 6.2).normalize();
      const sweep = new THREE.Mesh(new THREE.PlaneGeometry(110, 110),
        new THREE.MeshBasicMaterial({ map: this._studioSweep(), toneMapped: false,
          depthWrite: false }));
      sweep.position.copy(dir).multiplyScalar(-42);
      sweep.lookAt(dir.x * 10, dir.y * 10, dir.z * 10);
      sweep.renderOrder = -1;
      scene.add(sweep);
      // ...and the shadow the sweep cannot cast. A car on a seamless
      // background with nothing under it floats; a painted disc grounds it
      // without a shadow map, which is the same trick the build bay uses.
      const contact = new THREE.Mesh(new THREE.PlaneGeometry(1, 1),
        new THREE.MeshBasicMaterial({ map: contactShadowTexture(), color: 0x2e261d,
          transparent: true, opacity: 0.55, depthWrite: false, toneMapped: false }));
      contact.rotation.x = -Math.PI / 2;
      contact.visible = false;
      scene.add(contact);
      // THE SAME FOREST THE BAY STANDS IN, for the CAR pictures. A part icon
      // keeps the plain sweep — a gearbox held up to the light does not stand
      // on a rally trail, and a wood behind a 40 px chip is noise.
      const forest = this._diorama();
      forest.visible = false;
      scene.add(forest);
      // THE SAME AIR AS THE BAY. Not only for the look — a material shared
      // between a fogged scene and an unfogged one compiles a second program
      // and swaps between them every time the other scene draws it.
      scene.fog = new THREE.Fog(0xd2e2cc, 46, 185);
      st = this.__studio = { r, scene, sun, cam: null, sweep, contact, forest };
    }
    st.r.setSize(w, h);
    return st;
  }

  /** Render one mesh to a data URL and take it back out of the scene.
   *
   *  `dist` is the camera's TRUE distance from the origin along the original
   *  three-quarter rig, and `look` is the height it aims at. Both are spelled
   *  out because the first cut scaled a hardcoded (5.2, 3.2, 6.2) by
   *  `dist / 8.86` — and that rig is 8.70 long, not 8.86, so every call was
   *  framed slightly wrong and passing "6.2" for the car shelf (meaning "the
   *  old z") silently moved the camera 30% closer and cropped the cars.
   */
  /** HOW FAR BACK THIS BOX HAS TO SIT TO FIT THE FRAME — measured, not derived.
   *
   *  Trigonometry on the bounding box gets this wrong and `_frameStage` has
   *  said so for rounds: a car seen at three-quarters has its near end
   *  projecting far larger than its far end, so the half-width you compute
   *  from the box is not the half-width that lands on the canvas. Deriving it
   *  fitted the roof and then clipped the wheels off the bottom, because the
   *  nearest bottom corner projects lower than any formula on the box's
   *  extents predicts.
   *
   *  So project the eight corners and ask the projection. Three passes is
   *  plenty — each one scales the distance by however far outside the target
   *  frame the worst corner landed, and the error falls off geometrically.
   *  0.86 leaves a small, even margin all round.
   */
  _fitDist(bx, cam, aim, target = 0.86, rig = SHOT_RIG) {
    const dir = rig.clone().normalize();
    const look = new THREE.Vector3(0, aim, 0);
    const corners = [];
    for (const x of [bx.min.x, bx.max.x]) for (const y of [bx.min.y, bx.max.y])
      for (const z of [bx.min.z, bx.max.z]) corners.push(new THREE.Vector3(x, y, z));
    let d = Math.max(6, bx.getSize(new THREE.Vector3()).length());
    for (let i = 0; i < 3; i++) {
      cam.position.copy(dir).multiplyScalar(d);
      cam.lookAt(look);
      cam.updateMatrixWorld(true);
      cam.updateProjectionMatrix();
      let worst = 0;
      for (const c of corners) {
        const v = c.clone().project(cam);
        worst = Math.max(worst, Math.abs(v.x), Math.abs(v.y));
      }
      if (!Number.isFinite(worst) || worst <= 1e-3) break;
      d *= worst / target;
    }
    return d;
  }

  _shoot(mesh, w, h, { dist, look, ground = false } = {}) {
    const st = this._studio(w, h);
    const cam = new THREE.PerspectiveCamera(30, w / h, 0.1, 600);  // see `_stage`
    // FRAME THE SUBJECT FROM THE SUBJECT — the same rule `_frameStage` already
    // states for the build bay, and the one the shelf icons never got.
    //
    // `dist` was a constant 8.7 with the look point pinned at y 0.55. At 30
    // degrees that leaves 2.33 u of half-height, and BRAWLER measures 3.46 u
    // tall: the icon cut the car off, which is how it was reported. The number
    // was presumably right for whatever the cars were the day it was written,
    // and nothing has told it since that they grew roof racks.
    //
    // Measured instead: fit the bounding box to the tighter of the two fields
    // of view, worst-case width being the diagonal because these are shot at
    // three-quarters, and look at the box's own centre rather than at a fixed
    // height. An explicit `dist`/`look` still wins — the PART icons pass their
    // own, and those are framed against a sweep, not standing on ground.
    const bx = new THREE.Box3().setFromObject(mesh);
    const sz = bx.getSize(new THREE.Vector3());
    const mid = bx.getCenter(new THREE.Vector3());
    const vfov = (30 * Math.PI) / 180;
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * (w / h));
    // The look point is NOT the box centre. Aiming at the middle of a car that
    // is 3.5 u tall lifts the horizon most of the way up the frame and the
    // background becomes a wall of trail — rendered and looked at: the whole
    // car fitted, and the picture was worse. Half way between the old fixed
    // 0.55 and the centre keeps the original three-quarter look-down, which is
    // what puts grass and a diagonal of dirt behind the car.
    const aim = look ?? (0.55 + (mid.y - 0.55) * 0.5);
    // A DIFFERENT AZIMUTH FOR ANYTHING STANDING ON THE GROUND — not a higher
    // one. Fitting the tallest car pushes the lens back to about fourteen
    // units, past where the diorama's near pines start (lane 9.6), and a trunk
    // came through the frame and across one car's nose. Lifting the eye to
    // look over them was tried and is worse: from up there the trail reads as
    // a vertical band with the car pasted on it. A part held up to a sweep
    // keeps the original rig.
    //
    // ...AND A LOWER ONE, BECAUSE THE HORIZON WAS OFF THE TOP OF THE FRAME.
    // Measured at the framing the shelf ships — `_carIcons` picks one distance
    // and one aim for the whole row, so these are the row's numbers, not one
    // car's. At (3.9, 3.3, 7.4) the lens sat 15.9 u out and 5.84 up, aiming at
    // 1.14: 17.6 degrees below horizontal against a 15 degree half-FOV. The
    // horizon therefore sat at clip-space y tan(17.6)/tan(15) = 1.19 — ABOVE
    // THE TOP EDGE. Every pixel of every card was ground by construction: 0%
    // of the frame above the horizon, and the sky dome and the painted far
    // treeline each measuring 0% of it, whatever the diorama put behind the
    // car. Restoring the diorama's dropped transforms (r279) gave those cards
    // a real wood again, and it was still a wood photographed from above with
    // nothing to stand it against.
    //
    // NEITHER AIM NOR PITCH ALONE FIXES IT. Raising the aim is self-cancelling:
    // `_fitDist` pushes the lens back as the aim rises and the eye goes up with
    // it. Walked at this rig, the aim has to reach the tallest car's own
    // ROOFLINE before the horizon comes down to 0.91, and even the box centre
    // only moves it 1.19 -> 1.08 — still off the top, and it has already pushed
    // the lens from 15.9 u to 17.8. Flattening the pitch on its own is the
    // vertical-band failure above, because at 27.8 degrees the lens is looking
    // down the trail's own axis. The two together work: swing the azimuth
    // ACROSS the trail, so a flat pitch lays the dirt over the frame instead of
    // down it. At 68 degrees off the axis and 16 of elevation the lens sits
    // 12.1 u out and 3.37 up — 10.9 degrees of pitch, horizon at 0.72 with 14%
    // of the frame above it, and the painted far treeline, which no card had
    // ever shown a pixel of, measuring 9.8%. Trail across the bottom, verge,
    // treeline, wood: the shape of a photograph rather than a plan of one.
    //
    // THE TREE LANE IS STILL CLEAR, and that is what stopped the swing at 68
    // rather than carrying it round to where more of the sky is. Ray-sampled
    // over the projected box of EVERY car in the catalogue — a trunk that
    // misses the saloon can still cross the truck — nothing in the wood is
    // nearer the lens than the car is, on all eight. Swing further and it comes
    // back: at 94 degrees the scrub takes 2% of the tallest car's samples, and
    // by 112 something is in front of ALL of them. `_fitDist` still fits the
    // tallest roof rack; the worst projected corner over the eight is 0.86, the
    // same margin the row had before.
    const rig = ground ? SHOT_RIG_GROUND : SHOT_RIG;
    const fit = dist ?? this._fitDist(bx, cam, aim, 0.86, rig);
    cam.position.copy(rig).normalize().multiplyScalar(fit);
    cam.lookAt(0, aim, 0);
    st.scene.add(mesh);
    // `ground` is for things that STAND on something — a car. A gearbox held
    // up to the light does not get a shadow under it.
    if (ground) {
      const bx = new THREE.Box3().setFromObject(mesh);
      const sz = bx.getSize(new THREE.Vector3());
      st.contact.scale.set(sz.x * 1.3, sz.z * 1.15, 1);
      st.contact.position.set(bx.getCenter(new THREE.Vector3()).x, bx.min.y + 0.01, 0);
      st.contact.visible = true;
      st.forest.visible = true;
      st.sweep.visible = false;
      // OPEN UP FOR THE GOBO, and only here. The forest carries a multiply
      // canopy over its ground (see `_diorama`), which can only darken: with
      // the studio left at 1.24 the car cards came back at mean luminance
      // 73-92 against a sweep shot at 131-168, and "the cards are dark" is the
      // exact complaint this whole ground treatment exists to answer. The
      // PART shots do not show the forest and must not move, so the
      // compensation rides with the forest rather than with the renderer.
      st.r.toneMappingExposure = 1.42;
    }
    st.r.render(st.scene, cam);
    const url = st.r.domElement.toDataURL();
    st.scene.remove(mesh);
    st.contact.visible = false;
    st.forest.visible = false;
    st.sweep.visible = true;
    st.r.toneMappingExposure = 1.24;
    return url;
  }

  /** [PARTS] A PICTURE OF EVERY PART, rendered once and cached.
   *
   *  Keyed `kind:id`. Same studio as the car shelf, closer in, and each part
   *  is turned to the angle that shows what makes it different: a block from
   *  the side so the pipes count, a wing from behind so the span reads.
   */
  _partIcons() {
    if (this.__partIcons) return this.__partIcons;
    const out = {};
    const shoot = (kind, id, ry, dist, look = 0) => {
      const m = buildPartIcon(kind, id);
      m.rotation.y = ry;
      out[`${kind}:${id}`] = this._shoot(m, 168, 126, { dist, look });
    };
    // each part is turned to the angle that shows what makes it different: a
    // block from its pipe side, a wing from behind so the span reads
    // THE PIPES ARE THE POINT, so the block is turned to show the flank they
    // are on. The studio camera looks in from +X/+Y/+Z, and the stacks are
    // built on +X: rotating the block away hid every one of them and left a
    // V4 and a V8 as the same black box.
    for (const p of PART_SLOT.engine.parts) shoot('engine', p.id, -Math.PI * 0.13, 4.5, 0.22);
    for (const p of PART_SLOT.spoiler.parts) shoot('spoiler', p.id, Math.PI * 0.9, 4.4);
    for (const id of ['road', 'gravel', 'snow']) shoot('tyre', id, Math.PI * 0.5, 4.2);
    for (const id of ['cannon', 'rack', 'magazine']) shoot('weapon', id, Math.PI * 0.78, 4.2);
    this.__partIcons = out;
    return out;
  }

  // THE STILL BUILD PICTURE IS GONE (r232). It rendered the built car to a
  // data URL and swapped an <img> — honest, but dead: you fitted a wing and a
  // new JPEG appeared. `_stage` shows the real car on a real floor, turning,
  // and the part lands on it as you buy it. The still path survives only for
  // the car SHELF (`_carIcons`), which needs six pictures at once and must not
  // animate.

  _carIcons() {
    if (this.__carIcons) return this.__carIcons;
    // ONE DISTANCE FOR THE WHOLE SHELF. Fitting each car on its own is right
    // for one picture and wrong for a ROW of them: the catalogue runs from a
    // 2.47 u saloon to a 3.46 u truck with a roof rack, so per-car fitting
    // zooms each card differently and — because the eye moves with the
    // camera — lands each one on a different part of the trail. Measured
    // side by side: one card on grass, the next against a wall of dirt.
    // Fit them all, take the furthest, shoot every card from there. The big
    // machines fill their cards and the small ones sit in more scenery, which
    // is the truth about them anyway.
    // THE CAR'S ANGLE IS DERIVED FROM THE RIG, not written down beside it.
    // `Math.PI * 0.82` was a three-quarter FRONT view of the eye that existed
    // when it was typed; move the eye and the same constant shows you the back
    // of the car, which is what happened the moment the ground rig swung along
    // the trail. Hold the offset between the two instead and the pose survives
    // the next time the camera moves.
    const FRONT_OFF = Math.PI * 0.82 - Math.atan2(SHOT_RIG.x, SHOT_RIG.z);
    const yaw = Math.atan2(SHOT_RIG_GROUND.x, SHOT_RIG_GROUND.z) + FRONT_OFF;
    const built = CAR_CATALOG.map((car) => {
      const mesh = buildCarMesh(car.spec);
      mesh.rotation.y = yaw;            // three-quarter front, from wherever the eye is
      return { car, mesh };
    });
    // ONE AIM AS WELL AS ONE DISTANCE. Leaving `_shoot` to pick the look point
    // per car makes each card a slightly different camera — the aim follows the
    // box centre, which runs from 1.24 on a saloon to 1.73 on the truck — and
    // a row of cards shot from eight slightly different eyes lands each car on
    // a different patch of the diorama. One rig for the row.
    const probe = new THREE.PerspectiveCamera(30, 148 / 96, 0.1, 600);
    const boxes = built.map(({ mesh }) => new THREE.Box3().setFromObject(mesh));
    const tall = boxes.reduce((a, b2) => (b2.max.y > a.max.y ? b2 : a));
    const look = 0.55 + (tall.getCenter(new THREE.Vector3()).y - 0.55) * 0.5;
    let dist = 0;
    for (const bx of boxes) {
      dist = Math.max(dist, this._fitDist(bx, probe, look, 0.86, SHOT_RIG_GROUND));
    }
    const icons = {};
    for (const { car, mesh } of built) {
      icons[car.key] = this._shoot(mesh, 148, 96, { ground: true, dist, look });
    }
    this.__carIcons = icons;
    return icons;
  }

  renderCarShop() {
    const shop = document.getElementById('car-shop');
    shop.innerHTML = '';
    // the ratings below are for the world currently selected, so say which
    const head = document.getElementById('garage-shop-head');
    if (head) head.textContent = `RATED FOR ${this.level.name}`;
    const icons = this._carIcons();
    for (const car of CAR_CATALOG) {
      // OPEN ALL lends you the whole catalogue without BUYING it: `owned` is
      // read here and nothing is written to `cars.owned`, so switching the
      // setting back leaves the garage exactly as it was — the cars you
      // actually paid for, and no others.
      const owned = this.cars.owned.includes(car.key) || !!this.unlockAll;
      const selected = this.cars.selected === car.key;
      const card = document.createElement('button');
      card.className = 'car-card' + (owned ? ' owned' : ' locked') + (selected ? ' selected' : '');
      const S = car.stats;
      const bar = (lbl, v, lo, hi) => {
        const pct = Math.round(THREE.MathUtils.clamp((v - lo) / (hi - lo), 0.06, 1) * 100);
        return `<div class="cs-row"><span>${lbl}</span><i><b style="width:${pct}%"></b></i></div>`;
      };
      card.innerHTML = `<img class="car-icon" src="${icons[car.key]}" alt="${car.name}">
        <div class="cname">${car.name}</div><div class="cdesc">${car.desc}</div>
        <div class="cstats">
          <!-- THE FLOOR OF EACH RANGE USED TO BE THE ROSTER MINIMUM, so the
               weakest car in a stat rendered as an empty 6% stub — which reads
               as ZERO. Measured across the catalogue, five of six machines had
               one, and three showed it on ARM. The SLEEK read as having no top
               speed at all on 54 against a best of 63: 86 % of the fastest car
               in the game, drawn as nothing. Each range now brackets the
               roster with headroom at both ends, so the weakest lands near a
               quarter-full and the differences between machines are still the
               thing the eye picks up. -->
          ${bar('SPD', S.maxSpeed, 50, 64)}${bar('ACC', S.accel, 34, 40.5)}
          ${bar('GRP', S.grip, 4.2, 5.7)}${bar('ARM', S.health / (S.plating ?? 1), 45, 175)}
          ${bar('OFF', S.offroad, 0.18, 1.05)}${bar('NTR', S.nitroPower ?? 1, 0.78, 1.22)}
        </div>
        ${(() => {
    // WHAT IT IS SHOD WITH, and whether that is legal here. This is the line
    // that decides the purchase, so it sits above the star rating: a machine
    // that cannot take the start is not "three stars", it is not eligible.
    const f = this.carFitness(this.level.id, car.key);
    if (!f) return '';
    const tc = tyreClass(car.key, (this.garage.upgrades || {})[car.key], this.fittedTyre(car.key));
    const badge = `<b>${TYRE_LABEL[tc]}</b> TYRES`;
    if (!f.ok) return `<div class="ctyre bad">${badge} · −${f.pen}% GRIP HERE</div>`;
    if (f.over > 0) return `<div class="ctyre over">${badge} · OVER-TYRED, −${f.pen}%</div>`;
    return `<div class="ctyre ok">${badge} · READY</div>`;
  })()}
        ${(() => {
    // how this machine suits the world you are about to run — the whole point
    // of owning more than one, and useless information anywhere but here
    const a = this._ratings().get(car.key);
    if (!a) return '';
    return `<div class="cfit ${a.tier}">${'★'.repeat(a.stars)}${'☆'.repeat(5 - a.stars)} <span>${a.note}</span></div>`;
  })()}
        <div class="cprice${owned || selected ? '' : (this.garage.credits >= car.price ? ' afford' : ' short')}">${
  selected ? 'DRIVING' : owned ? 'DRIVE'
    : `${this.garage.credits >= car.price ? '' : '🔒 '}${car.price.toLocaleString()} CR`}</div>`;
      card.addEventListener('click', () => {
        if (!owned) {
          if (this.garage.credits < car.price) {
            card.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-4px)' },
              { transform: 'translateX(4px)' }, { transform: 'translateX(0)' }], { duration: 180 });
            return;
          }
          this.garage.credits -= car.price;
          this.cars.owned.push(car.key);
          saveJSON(this._pkey('garage'), this.garage);
        }
        this.cars.selected = car.key;
        // ...but a car you were only LENT is not written to the save, or
        // turning OPEN ALL off would leave you driving something you never
        // bought — and `_loadProfileState` would bounce you to the starter.
        if (this.cars.owned.includes(car.key)) saveJSON(this._pkey('cars'), this.cars);
        // live swap — no reload, the menu stays exactly where you are
        this.swapPlayerCar(car);
        this.renderCarShop();
        this.renderGarage();
        this._renderLevelCards();   // every track card names your car — repaint
        this._syncStartButton();    // ...and whether it may take the start
        this.hud.feed?.(`NOW DRIVING: ${car.name}`, 'good');
      });
      shop.appendChild(card);
    }
  }

  renderGarage() {
    this._syncCredits();
    this._renderQuests();
    // ONE CALL. This used to render a build bay, a tyre bay and then ten grey
    // upgrade rows into three separate containers; the bays own all of it now,
    // including the preview at the top and the tyre bay nested inside its own.
    this._renderGarageBays();
  }

  // ---------- player profiles (menu header chip + panel) ----------
  _initProfileUI() {
    const chip = document.getElementById('profile-chip');
    const screenEl = document.getElementById('profile-screen');
    if (!chip || !screenEl) return;
    document.getElementById('profile-name').textContent = this.profile.name;
    chip.addEventListener('click', () => {
      this._renderProfiles();
      screenEl.classList.remove('hidden');
    });
    document.getElementById('profile-close').addEventListener('click', () => screenEl.classList.add('hidden'));
    // the name input must never fight the game's window-level key handlers
    // (it only exists on the title screen, but keys are captured globally):
    // keystrokes stop at the field while typing
    const input = document.getElementById('profile-name-input');
    for (const ev of ['keydown', 'keyup', 'keypress']) {
      input.addEventListener(ev, (e) => {
        e.stopPropagation();
        if (ev === 'keydown' && e.key === 'Enter') document.getElementById('profile-create-btn').click();
      });
    }
    input.addEventListener('input', () => {
      // live cleanup (uppercase A-Z 0-9 space dash, ≤10) without eating the
      // caret on every keystroke — only rewrite when something was illegal
      const clean = input.value.toUpperCase().replace(/[^A-Z0-9 \-]/g, '').slice(0, 10);
      if (input.value !== clean) input.value = clean;
    });
    document.getElementById('profile-create-btn').addEventListener('click', () => this._createProfile());
  }

  _renderProfiles() {
    const reg = this.profiles;
    const listEl = document.getElementById('profile-list');
    listEl.innerHTML = '';
    for (const p of reg.list) {
      // per-profile career summary read straight from its namespaced keys
      const career = loadJSON(profileKey(p.id, 'career'), { finished: {}, rungs: {} });
      const garage = loadJSON(profileKey(p.id, 'garage'), { credits: 0 });
      const worlds = Object.values(career.finished).filter((f) => f && f.place <= 3).length;
      const active = p.id === reg.active;
      const row = document.createElement('div');
      row.className = 'prof-row' + (active ? ' active' : '');
      row.innerHTML = `<span class="prof-dot" style="background:${p.color}"></span>
        <span class="prof-info"><b>${p.name}</b>
          <small>${worlds} WORLD${worlds === 1 ? '' : 'S'} · ${(garage.credits ?? 0).toLocaleString()} CR</small></span>`;
      if (active) {
        const tag = document.createElement('span');
        tag.className = 'prof-active';
        tag.textContent = '● DRIVING';
        row.appendChild(tag);
      } else {
        const sw = document.createElement('button');
        sw.className = 'up-buy prof-btn';
        sw.textContent = 'SWITCH';
        sw.addEventListener('click', () => this._switchProfile(p.id));
        row.appendChild(sw);
      }
      const ren = document.createElement('button');
      ren.className = 'up-buy prof-btn';
      ren.textContent = '✎';
      ren.title = 'Rename profile';
      ren.addEventListener('click', () => this._editProfileName(row, p));
      row.appendChild(ren);
      // DELETE removes the driver entirely (RESET, below, keeps them and
      // empties them). Always offered — deleting the last profile hands the
      // device to a fresh PLAYER 01 rather than leaving an empty registry.
      const del = document.createElement('button');
      del.className = 'up-buy prof-btn danger';
      del.id = active ? 'profile-del-btn' : '';
      del.textContent = '✕';
      del.title = 'Delete profile';
      this._armConfirm(del, '✕', 'DELETE?', () => this._deleteProfile(p.id));
      row.appendChild(del);
      listEl.appendChild(row);
    }
    this._renderResetBlock();
    this._bindSyncUI();
    const cap = reg.list.length >= MAX_PROFILES;
    document.getElementById('profile-create').style.display = cap ? 'none' : '';
    document.getElementById('profile-cap-note').style.display = cap ? '' : 'none';
    this._renderSwatches();
  }

  /** CROSS-DEVICE SYNC UI. Two buttons over one engine (src/sync.js):
   *  export packs the whole career into a code and puts it on the clipboard
   *  (and in the box, for devices where the clipboard API is fenced off);
   *  import merges a pasted code into the ACTIVE profile — merge, never
   *  overwrite, so running it twice or in the wrong order cannot lose a
   *  career. When the cloud row is configured the same engine syncs by
   *  itself and this section mostly just reports it. */
  _bindSyncUI() {
    const box = document.getElementById('sync-code-box');
    const exp = document.getElementById('sync-export');
    const imp = document.getElementById('sync-import');
    if (!box || !exp || !imp || exp._bound) return;
    exp._bound = true;
    exp.addEventListener('click', async () => {
      const code = await encodeSyncCode(this.sync.snapshot());
      box.value = code;
      box.classList.add('open');
      box.select?.();
      try { await navigator.clipboard.writeText(code); exp.textContent = 'COPIED ✓'; }
      catch { exp.textContent = 'SELECT + COPY'; }
      setTimeout(() => { exp.textContent = 'COPY SYNC CODE'; }, 2500);
    });
    imp.addEventListener('click', async () => {
      if (!box.classList.contains('open') || box.value.startsWith('IGNITE') === false) {
        box.value = '';
        box.classList.add('open');
        box.focus();
        imp.textContent = 'IMPORT PASTED CODE';
        return;
      }
      try {
        const snap = await decodeSyncCode(box.value);
        this.sync.adopt(snap);
        this.sync.schedulePush();
        imp.textContent = 'MERGED ✓';
        box.classList.remove('open');
        this.hud?.feed?.('CAREER SYNCED', 'good');
      } catch {
        imp.textContent = 'NOT A SYNC CODE';
      }
      setTimeout(() => { imp.textContent = 'ENTER SYNC CODE'; }, 2500);
    });
    this._renderSyncStatus();
  }

  _renderSyncStatus() {
    const el = document.getElementById('sync-status');
    if (!el) return;
    if (!cloudConfigured()) {
      el.textContent = 'CLOUD OFF — CODES ONLY (SEE db/README.md TO ENABLE)';
      return;
    }
    const id = this.profile?.syncId;
    const word = { idle: 'CLOUD READY', sync: 'SYNCING…', ok: 'CLOUD ✓ IN SYNC', error: 'CLOUD UNREACHABLE — CHANGES KEPT LOCALLY' }[this.sync.status] ?? '';
    el.textContent = id ? `${word} · ID ${id.slice(0, 6)}…` : word;
  }

  /** Two-tap confirm. The first tap ARMS the button (it says `armed` and goes
   *  hot); only a second tap inside CONFIRM_MS runs the action, and the arm
   *  relaxes by itself. Careers are not something a fat thumb may delete. */
  _armConfirm(btn, idle, armed, run) {
    const relax = () => {
      clearTimeout(btn._armT);
      delete btn.dataset.arm;
      btn.classList.remove('armed');
      btn.textContent = idle;
    };
    btn.addEventListener('click', () => {
      if (btn.dataset.arm) { relax(); run(); return; }
      btn.dataset.arm = '1';
      btn.classList.add('armed');
      btn.textContent = armed;
      btn._armT = setTimeout(relax, CONFIRM_MS);
    });
    return btn;
  }

  /** DANGER ZONE: wipe the ACTIVE driver's career but keep the driver. The
   *  loss line spells out exactly what dies so the confirm is informed. */
  _renderResetBlock() {
    const box = document.getElementById('profile-reset');
    if (!box) return;
    const p = this.profile;
    const worlds = Object.values(this.career.finished ?? {}).filter((f) => f && f.place <= 3).length;
    const cars = this.cars.owned.length;
    const ups = Object.values(this.garage.upgrades ?? {})
      .reduce((n, set) => n + Object.values(set).reduce((a, b) => a + (b || 0), 0), 0);
    const loss = document.getElementById('profile-reset-loss');
    if (loss) {
      loss.textContent = `${p.name}: ${(this.garage.credits ?? 0).toLocaleString()} CR · `
        + `${worlds} WORLD${worlds === 1 ? '' : 'S'} · ${cars} CAR${cars === 1 ? '' : 'S'} · `
        + `${ups} UPGRADE${ups === 1 ? '' : 'S'} — ALL LOST`;
    }
    const old = document.getElementById('profile-reset-btn');
    if (!old) return;
    // rebuild the button so a stale armed state never survives a re-render
    const btn = old.cloneNode(false);
    btn.textContent = 'RESET CAREER';
    this._armConfirm(btn, 'RESET CAREER', 'CONFIRM RESET?', () => this._resetCareer(this.profile.id));
    old.replaceWith(btn);
  }

  /** Erase one profile's whole career and re-seed factory defaults. Storage
   *  is cleared BY PREFIX (see wipeProfileData) so nothing a later feature
   *  parks in the namespace survives. The active driver's menu re-renders
   *  live — no reload — unless the world they're sitting on just relocked. */
  _resetCareer(id) {
    const keys = wipeProfileData(id);
    if (id !== this.profile.id) { this._renderProfiles(); return keys; }
    this.career = { finished: {}, rungs: {} };
    this.garage = { credits: 0, upgrades: {} };
    this.cars = { owned: [STARTER_CAR], selected: STARTER_CAR };
    saveJSON(this._pkey('career'), this.career);
    saveJSON(this._pkey('garage'), this.garage);
    saveJSON(this._pkey('cars'), this.cars);
    // back to the stock starter machine, live
    const starter = CAR_CATALOG.find((c) => c.key === STARTER_CAR) ?? CAR_CATALOG[0];
    this.swapPlayerCar(starter);
    this.renderCarShop();
    this.renderGarage();
    this._renderLevelCards();
    this._renderProfiles();
    this.hud?.feed?.('CAREER RESET — BACK TO THE STARTING GRID', 'info');
    // sitting on a world the fresh career hasn't unlocked? that world is no
    // longer legally raceable — swap back to the first one, in place.
    if (!this.isLevelUnlocked(this.level.id)) {
      if (this.swapLevel(LEVELS[0])) { this._renderLevelCards(); this._softURL(); }
      else this.fadeTo(`?level=1${this.unlockAll ? '&unlockall=1' : ''}`);
    }
    return keys;
  }

  _renderSwatches() {
    const sw = document.getElementById('profile-swatches');
    sw.innerHTML = '';
    this._newColor ??= PROFILE_COLORS[this.profiles.list.length % PROFILE_COLORS.length];
    for (const c of PROFILE_COLORS) {
      const b = document.createElement('button');
      b.className = 'prof-swatch' + (c === this._newColor ? ' sel' : '');
      b.style.background = c;
      b.addEventListener('click', () => { this._newColor = c; this._renderSwatches(); });
      sw.appendChild(b);
    }
  }

  /** Inline rename: the row's name becomes a text field until Enter or blur.
   *  Esc abandons the edit. Names sanitize exactly like a new profile's. */
  _editProfileName(row, p) {
    const info = row.querySelector('.prof-info');
    if (!info || info.querySelector('input')) return;
    const b = info.querySelector('b');
    const inp = document.createElement('input');
    inp.className = 'prof-rename';
    inp.maxLength = 10;
    inp.value = p.name;
    inp.autocomplete = 'off';
    inp.spellcheck = false;
    b.replaceWith(inp);
    // keystrokes must stop here — the game's key handlers are window-level
    for (const ev of ['keydown', 'keyup', 'keypress']) {
      inp.addEventListener(ev, (e) => {
        e.stopPropagation();
        if (ev !== 'keydown') return;
        if (e.key === 'Enter') inp.blur();
        else if (e.key === 'Escape') { inp.dataset.cancel = '1'; inp.blur(); }
      });
    }
    inp.addEventListener('input', () => {
      const clean = inp.value.toUpperCase().replace(/[^A-Z0-9 \-]/g, '').slice(0, 10);
      if (inp.value !== clean) inp.value = clean;
    });
    inp.addEventListener('blur', () => {
      if (!inp.dataset.cancel) this._renameProfile(p.id, inp.value);
      this._renderProfiles();
    });
    inp.focus();
    inp.select();
  }

  /** Rename in the registry (careers live under the id, so nothing moves). */
  _renameProfile(id, raw) {
    const p = this.profiles.list.find((x) => x.id === id);
    const name = sanitizeProfileName(raw);
    if (!p || !name || name === p.name) return false;
    p.name = name;
    saveJSON('ir-profiles', this.profiles);
    if (id === this.profile.id) {
      this.profile.name = name;
      const chip = document.getElementById('profile-name');
      if (chip) chip.textContent = name;
    }
    return true;
  }

  _createProfile() {
    const reg = this.profiles;
    if (reg.list.length >= MAX_PROFILES) return;
    const input = document.getElementById('profile-name-input');
    const name = sanitizeProfileName(input.value);
    if (!name) {
      input.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-5px)' },
        { transform: 'translateX(5px)' }, { transform: 'translateX(0)' }], { duration: 200 });
      input.focus();
      return;
    }
    const id = Math.max(0, ...reg.list.map((p) => p.id)) + 1;
    reg.list.push({ id, name, color: this._newColor ?? PROFILE_COLORS[0], created: Date.now() });
    reg.active = id;
    saveJSON('ir-profiles', reg);
    // fresh careers start at world 1 — in place, no reload
    this.swapLevel(LEVELS[0]);
    this._applyProfileInPlace();
  }

  _switchProfile(id) {
    const reg = this.profiles;
    if (id === reg.active || !reg.list.some((p) => p.id === id)) return;
    reg.active = id;
    saveJSON('ir-profiles', reg);
    // in place; _applyProfileInPlace drops the new driver back to world 1 if
    // this track isn't unlocked for them
    this._applyProfileInPlace();
  }

  _deleteProfile(id) {
    const reg = this.profiles;
    const i = reg.list.findIndex((p) => p.id === id);
    if (i < 0) return;
    reg.list.splice(i, 1);
    wipeProfileData(id); // by prefix — the same one path a reset uses
    if (!reg.list.length) {
      // the registry may never be empty: the device falls back to a brand-new
      // driver instead of booting into a profile-less void
      reg.list.push({ id: 1, name: 'PLAYER 01', color: PROFILE_COLORS[0], created: Date.now() });
      reg.active = 1;
      wipeProfileData(1);
      saveJSON('ir-profiles', reg);
      this.swapLevel(LEVELS[0]);
      this._applyProfileInPlace();
      return;
    }
    if (reg.active === id) {
      // deleted the active driver: hand the wheel to the first remaining one
      reg.active = reg.list[0].id;
      saveJSON('ir-profiles', reg);
      this._applyProfileInPlace();
      return;
    }
    saveJSON('ir-profiles', reg);
    this._renderProfiles();
  }

  // ---------- pickups ----------
  _buildPickups() {
    this.pickups = [];
    const t = this.track;
    const TYPES = ['health', 'missile', 'nitro', 'mine'];
    const COLORS = { health: 0x4dff88, missile: 0xffb52e, nitro: 0x7fd4ff, mine: 0xff5b3d, slowfield: 0x8e7bff, shield: 0x7dffd8 };
    const defs = [];
    for (let k = 0; k < 12; k++) {
      defs.push({
        type: TYPES[k % TYPES.length],
        index: Math.floor((k + 0.5) * t.N / 12),
        lateral: (k % 2 === 0 ? -1 : 1) * (2 + (k % 3) * 1.8),
      });
    }
    // world special (concept screens): FREEZE STRIKE on GLACIAL PASS,
    // JUNGLE FURY on AMAZON RAPIDS — one violet orb that slows every rival
    const themeKey = this.level?.theme;
    if (themeKey === 'glacial' || themeKey === 'jungle') {
      defs.push({ type: 'slowfield', index: Math.floor(t.N * 0.55), lateral: 0 });
      defs.push({ type: 'slowfield', index: Math.floor(t.N * 0.05), lateral: 0 });
    }
    // shield orbs: brief invulnerability, two per lap
    defs.push({ type: 'shield', index: Math.floor(t.N * 0.30), lateral: 2.5 });
    defs.push({ type: 'shield', index: Math.floor(t.N * 0.80), lateral: -2.5 });
    // v1.5 §11.2 (r310), GENERATOR-SIDE: nitro pickups per lap follow the
    // template (street-kind 1, everything else 2 — the round-robin above
    // dealt 3), and NO nitro lives within 80 m of the finish line in either
    // direction (recording E: a charge on the finish straight fed the 205
    // km/h offs). Extras become hull pickups — the slot stays interesting,
    // the speed stays budgeted. The validator re-checks this output.
    {
      const cap = stageTemplate(this.level) === 'street' ? 1 : 2;
      const sampleLen = Math.max(1, Math.hypot(
        t.center[1].x - t.center[0].x, t.center[1].z - t.center[0].z));
      const guard = Math.round(80 / sampleLen);
      const nitros = defs.filter((d) => d.type === 'nitro')
        .sort((a, b) => Math.abs(a.index - t.N / 2) - Math.abs(b.index - t.N / 2));
      for (let k = 0; k < nitros.length; k++) {
        if (k >= cap || Math.min(nitros[k].index, t.N - nitros[k].index) <= guard) {
          nitros[k].type = 'health';
        }
      }
    }
    const glow = glowTexture();
    for (const d of defs) {
      const color = COLORS[d.type];
      const group = new THREE.Group();
      const core = buildPickupIcon(d.type, color);
      core.position.y = 1.4;
      group.add(core);
      const halo = new THREE.Mesh(
        new THREE.PlaneGeometry(5, 5),
        new THREE.MeshBasicMaterial({
          map: glow, color, transparent: true, opacity: 0.5,
          blending: THREE.AdditiveBlending, depthWrite: false,
        })
      );
      halo.rotation.x = -Math.PI / 2;
      halo.position.y = 0.1;
      group.add(halo);
      const p = t.pointAt(d.index, d.lateral);
      group.position.copy(p);
      this.worldLayer.add(group);
      this.pickups.push({
        ...d, pos: p, mesh: group, core, active: true, respawn: 0,
        color: '#' + color.toString(16).padStart(6, '0'),
      });
    }
  }

  _updatePickups(dt, time) {
    for (const p of this.pickups) {
      if (!p.active) {
        p.respawn -= dt;
        if (p.respawn <= 0) { p.active = true; p.mesh.visible = true; }
        continue;
      }
      p.core.rotation.y += dt * 2.2;
      p.core.position.y = 1.4 + Math.sin(time * 2.5 + p.index) * 0.25;
      if ((this.player._noPickupT ?? 0) > 0) continue;   // PATCH_02 §3.7: no rescue loot
      if (this.player.alive && this.player.pos.distanceToSquared(p.pos) < 8.5) {
        p.active = false;
        p.mesh.visible = false;
        p.respawn = 14;
        this.audio.pickup();
        this.particles.pickupBurst(p.pos, new THREE.Color(p.color));
        this.score += 50;
        const pl = this.player;
        if (p.type === 'health') {
          pl.health = Math.min(pl.maxHealth, pl.health + 35);
          this.hud.feed('+35 HULL', 'good');
          // patched up enough? bolt the shed parts back on
          if (pl.health / pl.maxHealth > 0.66) this.restoreCarParts(pl);
        } else if (p.type === 'missile') {
          pl.missiles = Math.min(pl.maxMissiles, pl.missiles + 2);
          // ...and a belt of cannon rounds with it. Since r173 the magazine is
          // finite, so an ordnance pickup that refilled only the racks would
          // leave a dry gun with no route back inside a race.
          const belt = Math.round(pl.maxRounds * 0.34);
          pl.rounds = Math.min(pl.maxRounds, (pl.rounds ?? 0) + belt);
          this.hud.feed(`+2 MISSILES · +${belt} ROUNDS`, 'good');
        } else if (p.type === 'nitro') {
          // PATCH_02 §3.7: NITRO IS A RATION, NOT A ROAD SURFACE. The
          // recording shows a can every 4-6 s and the car boosting half the
          // lap — the drivetrain never mattered. Two charges per lap; a can
          // past the ration pays score only.
          if ((pl._nitroLap ?? 0) !== pl.lap) { pl._nitroLap = pl.lap; pl._nitroTaken = 0; }
          if ((pl._nitroTaken ?? 0) < (window.__DRIVING?.patch02?.nitroPickupsPerLap ?? 2)) {
            pl._nitroTaken = (pl._nitroTaken ?? 0) + 1;
            pl.nitro = Math.min(1, pl.nitro + 0.45 * (pl.nitroRate || 1));
            this.telemetry?.log('nitro', { reason: 'pickup', taken: pl._nitroTaken });
            this.hud.feed('+NITRO CHARGE', 'good');
          } else {
            this.score += 100;
            this.hud.feed('NITRO RATIONED — +100 PTS', 'info');
          }
        } else if (p.type === 'shield') {
          pl.invuln = Math.max(pl.invuln, 4);
          this.hud.feed('SHIELD — 4s INVULNERABLE', 'good');
          this.buzz([20, 30, 20]);
        } else if (p.type === 'slowfield') {
          // world special: every rival crawls at half pace for 6 seconds
          this.enemySlowUntil = this.raceTime + 6;
          const jungle = this.level?.theme === 'jungle';
          this.hud.centerMsg(jungle ? 'JUNGLE FURY!' : 'FREEZE STRIKE!');
          this.hud.feed(jungle ? 'MUD SLOW ×2.0 — RIVALS BOGGED' : 'ICE SLOW ×2.0 — RIVALS FROZEN', 'good');
          this.buzz([30, 40, 60]);
          this.score += 100;
        } else {
          pl.mines = Math.min(pl.maxMines, pl.mines + 2);
          this.hud.feed('+2 MINES', 'good');
        }
      }
    }
  }

  // Boost pads were removed — speed comes from driving now, not from touching
  // a stamped chevron. Kept as a no-op guard in case a track still lists any.
  _updateBoostPads() {
    if (!this.track.boostPads || !this.track.boostPads.length) return;
    for (const pad of this.track.boostPads) {
      for (const car of [this.player, ...this.enemies]) {
        if (!car.alive) continue;
        // slow-field rule: pads give no boost to rivals while the field is live
        if (car !== this.player && this.enemySlowUntil && this.raceTime < this.enemySlowUntil) continue;
        const di = (car.trackIndex - pad.index + this.track.N) % this.track.N;
        if ((di < 6 || di > this.track.N - 6) && Math.abs(car.lateral - pad.lateral) < 3.4 && car.boostTimer <= 0.2) {
          car.boostTimer = 1.6;
          if (car === this.player) { this.audio.boost(); this.hud.feed('BOOST', 'info'); }
        }
      }
    }
  }

  // ---------- style & combo (the fun engine) ----------
  // Every stylish act — smash, kill, drift, big air, close call, slipstream —
  // feeds one chain. Each event extends a 5s window and raises the multiplier
  // (×1.0 → ×4.0); points scored through style() are multiplied. HUD chip
  // shows the chain and its remaining time.
  style(basePts, label) {
    if (this.state !== 'race') return;
    // contract counters ride the existing style events (labels are the
    // activation signals vehicles.js already emits — no hooks added there)
    const ct = this._ct;
    if (ct) {
      if (label === 'SLIPSTREAM') ct.drafts++;
      else if (label === 'BIG AIR') ct.bigAirs++;
      else if (label === 'CLOSE CALL') ct.closeCalls++;
    }
    this.comboN = Math.min(12, (this.comboN ?? 0) + 1);
    this.comboT = 5;
    const mult = Math.min(4, 1 + this.comboN * 0.25);
    const pts = Math.round(basePts * mult);
    this.score += pts;
    if (label) this.hud.feed(`${label}  +${pts}${mult > 1.9 ? `  (×${mult.toFixed(2).replace(/\.?0+$/, '')})` : ''}`, 'good');
    // hot chains feed the nitro too
    if (this.comboN >= 4) this.player.nitro = Math.min(1, this.player.nitro + 0.03);
  }

  /** Cheap combo bump for events that already pay their own score. */
  styleBump() {
    if (this.state !== 'race') return;
    this.comboN = Math.min(12, (this.comboN ?? 0) + 1);
    this.comboT = 5;
  }

  _updateCombo(dt) {
    const el = this._comboEl ??= {
      root: document.getElementById('combo'),
      x: document.getElementById('combo-x'),
      bar: document.querySelector('#combo-bar b'),
    };
    if (!el.root) return;
    if ((this.comboT ?? 0) > 0 && this.state === 'race') {
      this.comboT -= dt;
      if (this.comboT <= 0) { this.comboN = 0; el.root.classList.remove('on', 'hot'); return; }
      const mult = Math.min(4, 1 + this.comboN * 0.25);
      if (this.comboN >= 2) {
        el.root.classList.add('on');
        el.root.classList.toggle('hot', mult >= 2.5);
        el.x.textContent = `×${mult.toFixed(2).replace(/\.?0+$/, '')}`;
        el.bar.style.width = `${Math.round((this.comboT / 5) * 100)}%`;
      }
    } else if (el.root.classList.contains('on')) {
      el.root.classList.remove('on', 'hot');
    }
  }

  // ---------- race contracts (the money game) ----------
  // 3 side objectives per race, seeded per level+day+difficulty so a given
  // world offers the same slate all day. Completions pay into contractCredits,
  // folded into `earned` at finishRace. Never offered in free roam.
  /** Contracts you have turned down for this world, by id. Per world, because
   *  the offer is per world; kept on the career so it survives a reload. */
  _declined() {
    const d = (this.career.declined ??= {});
    return (d[this.level?.id] ??= []);
  }

  _pickContracts() {
    const pool = CONTRACT_POOL.filter((c) => !c.gate || c.gate(this));
    const day = Math.floor(Date.now() / 864e5);
    let s = ((this.level.id * 73856093) ^ (day * 19349663)
      ^ (this.difficulty.id.charCodeAt(0) * 83492791)) >>> 0;
    const rnd = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
    const arr = [...pool];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = (rnd() * (i + 1)) | 0;
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    // deal each pick at the rung THIS player stands on for that contract
    const rungs = this.career.rungs ?? {};
    const atRung = (c) => contractAtRung(c, rungs[c.id] ?? 0, this.difficulty.id);
    const picks = arr.slice(0, 3);
    // never deal three long-shots: at least one slot is a `sure` contract any
    // driver can actively complete regardless of world or finishing position
    if (!picks.some((c) => c.sure)) {
      const sure = arr.slice(3).filter((c) => c.sure);
      if (sure.length) picks[2] = sure[(rnd() * sure.length) | 0];
    }
    // ...AND YOU CAN TURN THEM DOWN. "So I can choose to race them or not."
    // A declined contract is not dealt at all, which matters because CLEAN LAP
    // and PACIFIST pull in opposite directions from HEADHUNTER — being handed
    // three you cannot hold at once made the row read as noise rather than as
    // an offer.
    const no = this._declined();
    return picks.map(atRung).filter((c) => !no.includes(c.id));
  }

  /* ---- JOBS: the board you choose from ---------------------------------- */

  /** THE DAY'S POSTINGS. Five, seeded on the day and the profile so the board
   *  is the same all day for this driver and different for the next one — a
   *  board that rerolls on every repaint is a slot machine, not an offer.
   *
   *  Only worlds that are OPEN are posted, because a job you cannot drive is
   *  an advert for a padlock. Each kind gets at most one posting, so five rows
   *  are five different things to do rather than the same errand five times. */
  _jobOffers() {
    if (this._jobsDay === this._today() && this._jobsCache) return this._jobsCache;
    const open = LEVELS.filter((lv) => this.isLevelUnlocked(lv.id));
    if (!open.length) return [];
    let s = ((this._today() * 19349663) ^ ((this.profile?.id ?? 1) * 83492791)) >>> 0;
    const rnd = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
    const kinds = [...JOB_POOL];
    for (let i = kinds.length - 1; i > 0; i--) {
      const j = (rnd() * (i + 1)) | 0;
      [kinds[i], kinds[j]] = [kinds[j], kinds[i]];
    }
    // A JOB YOU FINISHED TODAY DOES NOT COME BACK TODAY. Without this the
    // board reposts the kind you just banked the moment it is cleared, and a
    // single BOUNTY becomes an unlimited credit tap for the price of one race
    // repeated — the day's board has to be a finite day's work.
    const done = this._jobsDoneToday();
    const out = [];
    for (const k of kinds) {
      if (out.length >= 5) break;
      if (done.includes(k.id)) continue;
      // try a few worlds before giving up on a kind: PACE NOTE only posts on a
      // world you have already set a time on, WRONG BOOTS only where the
      // surface is loose, and one unlucky draw should not drop the kind
      for (let attempt = 0; attempt < 6; attempt++) {
        const lv = open[(rnd() * open.length) | 0];
        if (k.where && !k.where(this, lv)) continue;
        const need = k.need ? k.need(this, lv, rnd) : null;
        if (k.need && (need == null || !Number.isFinite(need))) continue;
        const extra = k.extra ? k.extra(this, lv, rnd) : {};
        if (k.extra && !extra) continue;
        out.push({ id: k.id, lvId: lv.id, need, ...extra,
          pay: this._jobPay(k, lv), part: k.part ?? null });
        break;
      }
    }
    this._jobsDay = this._today();
    this._jobsCache = out;
    return out;
  }

  _today() { return Math.floor(Date.now() / 864e5); }

  /** Kinds banked today, reset by the calendar rather than by the session so
   *  a reload cannot re-open the board. */
  _jobsDoneToday() {
    const r = (this.career.jobsDone ??= { day: this._today(), ids: [] });
    if (r.day !== this._today()) { r.day = this._today(); r.ids = []; }
    return r.ids;
  }

  /** WHAT A JOB IS WORTH. The kind's base, scaled by how far down the ladder
   *  the world sits — a bounty on rung 50 is a harder night's work than the
   *  same bounty on rung 4, and paying both the same is what makes a board
   *  stop being worth reading once you are past the first region. */
  _jobPay(k, lv) {
    const rung = Math.max(0, LEVELS.findIndex((l) => l.id === lv.id));
    // CAPPED, and the cap is the point. Uncapped, rung 58 paid 2.7x and a
    // single CLEAN SWEEP posting came to 2,970 CR plus a free part — against
    // the ~1,800 CR of a strong race that ECONOMY-PLAN prices everything
    // against, and the 2,200 ceiling test-rungs holds the contract sweep to.
    // A job should be worth about one good race, not three.
    const scale = Math.min(1.9, 1 + rung / 34);
    const hard = this.difficulty?.id === 'hard' ? 1.25 : this.difficulty?.id === 'easy' ? 0.8 : 1;
    return Math.round((k.base * scale * hard) / 10) * 10;
  }

  /** The job in hand, resolved against the pool — or null. Stored on the
   *  career as plain data (kind id, world id, target) and rebuilt through the
   *  pool on every read, so a saved job can never carry a stale objective. */
  activeJob() {
    const j = this.career.job;
    if (!j) return null;
    const k = JOB_POOL.find((x) => x.id === j.id);
    const lv = LEVELS.find((l) => l.id === j.lvId);
    if (!k || !lv) return null;
    return { ...j, kind: k, lv,
      label: k.label, icon: k.icon,
      text: k.line(j.need, lv, j) };
  }

  _takeJob(o) {
    this.career.job = { id: o.id, lvId: o.lvId, need: o.need, pay: o.pay,
      part: o.part, brand: o.brand, day: this._today() };
    saveJSON(this._pkey('career'), this.career);
    this.audio?.ui?.();
    this._renderJobs();
  }

  _dropJob() {
    this.career.job = null;
    saveJSON(this._pkey('career'), this.career);
    this.audio?.ui?.();
    this._renderJobs();
  }

  /** The job as a CONTRACT — the same shape `_updateContracts`, the HUD and
   *  the finish check already understand. Only ever returned for the world the
   *  job names, which is what makes "go there" the point of taking it. */
  _jobContract() {
    const j = this.activeJob();
    if (!j || !this.level || j.lvId !== this.level.id) return null;
    const k = j.kind;
    return { id: `job:${k.id}`, job: true, part: j.part, brand: j.brand,
      label: `JOB · ${k.label}`, need: j.need, pay: j.pay, done: false,
      atFinish: !!k.atFinish, lap: !!k.lap,
      prog: k.prog, check: (g, ct, rank, need) => k.check(g, ct, rank, need, j) };
  }

  /** Paid at the moment the objective is met, and cleared from the career the
   *  same instant — a job cannot be banked twice, and the board is free to
   *  post the next one. */
  _payJob(c) {
    const kindId = String(c.id).replace(/^job:/, '');
    const done = this._jobsDoneToday();
    if (!done.includes(kindId)) done.push(kindId);
    this._jobsCache = null;                 // the board has one fewer posting
    this.career.job = null;
    if (c.part) {
      const up = this.carUpgrades();
      const line = UPGRADES.find((u) => u.key === c.part);
      if (line && (up[c.part] | 0) < line.max) {
        up[c.part] = (up[c.part] | 0) + 1;
        saveJSON(this._pkey('garage'), this.garage);
        this.hud.feed(`JOB PAID — FREE ${line.name} ${up[c.part]}`, 'good');
      } else {
        this.contractCredits = (this.contractCredits ?? 0) + c.pay;
        this.hud.feed(`JOB PAID — ${line?.name ?? 'PART'} MAXED, DOUBLE PAY INSTEAD`, 'good');
      }
    }
    saveJSON(this._pkey('career'), this.career);
    this._renderJobs?.();
  }

  /** The offer for this world, whether or not it has been accepted. Used by
   *  the board — `_pickContracts` returns only what will actually run. */
  _offeredContracts() {
    const no = this._declined();
    const keep = this.career.declined?.[this.level?.id];
    if (keep) this.career.declined[this.level.id] = [];
    const all = this._pickContracts();
    if (keep) this.career.declined[this.level.id] = keep;
    return all.map((c) => ({ ...c, declined: no.includes(c.id) }));
  }

  /** THE JOBS BOARD — the daily offer and the long chains, in one place.
   *  Contracts pay credits and can be declined; quests pay PARTS and run in
   *  the background. Seeing them together is the point: one is what to do in
   *  THIS race, the other is what you are working toward. */
  /** THE JOB BOARD. Five postings, one held at a time, and a button on the
   *  held one that goes and drives it — which is the entire reason the board
   *  exists rather than another row of things handed to you where you stand.
   *
   *  A held job is drawn FIRST and separately, because it is not an offer any
   *  more: it is the thing you are doing, and the only two questions about it
   *  are "where" and "how do I get there". */
  _renderJobBoard() {
    const el = document.getElementById('job-board');
    if (!el) return;
    const held = this.activeJob();
    let html = `<div class="cb-head">JOBS <b>${held ? 'ONE IN HAND' : 'TAKE ONE'}</b></div>`;
    if (held) {
      const done = this.career.finished?.[held.lvId];
      html += `<div class="jobrow held">
        <span class="jicon">${held.icon}</span>
        <span class="jmain"><b>${held.label} — ${held.lv.name}</b>
          <i>${held.text}</i>
          <u>${done ? `your best here: ${ordinal(done.place)}` : 'never raced here'}</u></span>
        <span class="jpay">+${held.pay} CR${held.part
    ? `<br><em>+ FREE ${(UPGRADES.find((u) => u.key === held.part)?.name ?? held.part).split(' ')[0]}</em>` : ''}</span>
      </div>
      <div class="jobact">
        <button id="job-drive">DRIVE IT — ${held.lv.name}</button>
        <button id="job-drop" class="ghost">DROP</button>
      </div>`;
    } else {
      const offers = this._jobOffers();
      if (!offers.length) {
        html += '<div id="jobs-note">No postings — open a world first.</div>';
      } else {
        html += '<div id="jobs-note">One job at a time. Take it and the board '
          + 'hands you the world it is on; finish it and the next posting is yours.</div>';
        for (const o of offers) {
          const k = JOB_POOL.find((x) => x.id === o.id);
          const lv = LEVELS.find((l) => l.id === o.lvId);
          if (!k || !lv) continue;
          html += `<div class="jobrow">
            <span class="jicon">${k.icon}</span>
            <span class="jmain"><b>${k.label} — ${lv.name}</b>
              <i>${k.line(o.need, lv, o)}</i></span>
            <span class="jpay">+${o.pay} CR${o.part
    ? `<br><em>+ FREE ${(UPGRADES.find((u) => u.key === o.part)?.name ?? o.part).split(' ')[0]}</em>` : ''}</span>
            <button class="jtake" data-job="${o.id}">TAKE</button>
          </div>`;
        }
      }
    }
    el.innerHTML = html;
    for (const b of el.querySelectorAll('.jtake')) {
      b.addEventListener('click', () => {
        const o = this._jobOffers().find((x) => x.id === b.dataset.job);
        if (o) this._takeJob(o);
      });
    }
    document.getElementById('job-drop')?.addEventListener('click', () => this._dropJob());
    document.getElementById('job-drive')?.addEventListener('click', () => {
      const j = this.activeJob();
      if (!j) return;
      this.audio?.ui?.();
      // Already standing on it: nothing to swap, just go. Otherwise take the
      // same route the track list takes and flush it synchronously, so the
      // race that starts is the world the job names and not the one that
      // happened to be under the menu.
      if (this.level?.id !== j.lvId) { this._pickLevel(j.lv); this._flushPick(); }
      if (this.level?.id !== j.lvId) {
        // the swap declined (mid-race): fall back to a reload that lands on
        // the world, and let the player press START themselves
        this.fadeTo(`?level=${j.lvId}${this.unlockAll ? '&unlockall=1' : ''}`);
        return;
      }
      this.startRace();
    });
  }

  _renderJobs() {
    this._renderJobBoard();
    const el = document.getElementById('contract-board');
    if (!el) return;
    if (this.freeRoam || !this.level) {
      el.innerHTML = '<div class="cb-head">CONTRACTS</div>'
        + '<div id="jobs-note">Contracts run in RACE mode only.</div>';
      this._renderQuests();
      return;
    }
    const offers = this._offeredContracts();
    const rows = offers.map((c) => `<div class="jrow${c.declined ? ' off' : ''}">
      <span class="jmain"><b>${c.label}</b><i>${
  typeof c.desc === 'function' ? c.desc(c.need) : c.desc}</i></span>
      <span class="jpay">+${c.pay} CR</span>
      <button class="jbtn${c.declined ? ' declined' : ''}" data-cid="${c.id}">${
  c.declined ? 'DECLINED' : 'ACCEPTED'}</button>
    </div>`).join('');
    el.innerHTML = `<div class="cb-head">CONTRACTS — ${this.level.name}</div>`
      + `<div id="jobs-note">Today's offer for this world. Tap one to turn it down — `
      + `a declined contract is not dealt at the start line, so you are not `
      + `carrying an objective that fights the one you actually want.</div>${rows}`;
    for (const b of el.querySelectorAll('.jbtn')) {
      b.addEventListener('click', () => {
        const no = this._declined();
        const id = b.dataset.cid;
        const at = no.indexOf(id);
        if (at >= 0) no.splice(at, 1); else no.push(id);
        saveJSON(this._pkey('career'), this.career);
        this.audio?.ui?.();
        this._renderJobs();
      });
    }
    this._renderQuests();
  }

  /** Per-frame contract bookkeeping. Only ever OBSERVES state other systems
   *  already expose (heat/ammo/health deltas, _draftOn is counted via the
   *  style() labels) — no hooks into files owned by the other agents. */
  _updateContracts() {
    if (this.freeRoam || this.state !== 'race' || !this.contracts?.length) return;
    const ct = this._ct, p = this.player;
    if (!ct) return;
    // weapon-fire detection by state transition (cannon heats, ammo drops,
    // shock cooldown jumps) — input alone would count dry-fires
    if (p.heat > (ct.prevHeat ?? 0) + 1e-4) ct.weaponFired = true;
    if (ct.prevMissiles !== null && p.missiles < ct.prevMissiles) ct.weaponFired = true;
    if (ct.prevMines !== null && p.mines < ct.prevMines) ct.weaponFired = true;
    if (p.shockCooldown > (ct.prevShock ?? 0) + 1) ct.weaponFired = true;
    ct.prevHeat = p.heat; ct.prevMissiles = p.missiles;
    ct.prevMines = p.mines; ct.prevShock = p.shockCooldown;
    // ---- TRACK FEATS need three things contracts never asked for ----
    // Read off state the car already keeps, same as everything above it.
    const kph = Math.hypot(p.vel.x, p.vel.z) * 3.6;
    if (kph > (ct.topKph ?? 0)) ct.topKph = kph;
    if (p.boosting || (p.nitroT ?? 0) > 0) ct.boostHeld = (ct.boostHeld ?? 0) + (this.clock?.lastDt ?? 1 / 60);
    // ON RAILS: a wheel off the tarmac ends it. `lateral` against the world's
    // own width profile, so a pinched section is judged by ITS width and not
    // by a constant — and never while airborne, since a jump is not a mistake.
    if (p.alive && !p.airborne) {
      const halfW = this.track?.widthAt?.(p.trackIndex) ?? 9;
      if (Math.abs(p.lateral ?? 0) > halfW) ct.leftRoad = true;
    }
    // hull-damage detection for CLEAN LAP: any health drop marks the lap
    // (regen/pickups only ever raise it, so a drop is always damage)
    if (ct.prevHealth !== null && p.alive && p.health < ct.prevHealth - 1e-3) ct.lapDamaged = true;
    ct.prevHealth = p.alive ? p.health : null;
    // style-combo high-water mark
    if ((this.comboT ?? 0) > 0) {
      ct.comboMax = Math.max(ct.comboMax, Math.min(4, 1 + (this.comboN ?? 0) * 0.25));
    }
    for (const c of this.contracts) {
      if (!c.done && !c.atFinish && c.check && c.check(this, ct, this.playerRank, c.need)) {
        this._completeContract(c);
      }
    }
    this.hud.setContracts?.(this.contracts, ct); // diffed inside — cheap
  }

  _completeContract(c) {
    if (c.done) return;
    c.done = true;
    this.contractCredits = (this.contractCredits ?? 0) + c.pay;
    // A JOB IS NOT A CONTRACT RUNG. It rides in the same list for the plumbing
    // (see startRace) but it has no ladder to climb and it is spent on
    // completion, so it takes the credit and leaves before any of that.
    if (c.job) {
      this.hud.feed(`JOB DONE: ${c.label.replace(/^JOB · /, '')}  +${c.pay} CR`, 'good');
      this._payJob(c);
      this.hud.setContracts?.(this.contracts, this._ct);
      this.audio.pickup?.();
      this.buzz([30, 40, 30, 40, 30]);
      return;
    }
    // THE RUNG YOU CLIMBED STAYS CLIMBED. Only this contract advances, and
    // only past the rung that was actually completed — so a player who is
    // handed rung I because HARD was not selected cannot skip II by winning it.
    const rungs = (this.career.rungs ??= {});
    const was = rungs[c.id] ?? 0;
    const top = (CONTRACT_POOL.find((x) => x.id === c.id)?.rungs.length ?? 1) - 1;
    if (c.rungIx >= was && was < top) {
      rungs[c.id] = was + 1;
      saveJSON(this._pkey('career'), this.career);
      this.hud.feed(`${c.label.replace(/ [IVX]+$/, '')} steps up to `
        + `${RUNG_NUMERAL[was + 1]}`, 'info');
    }
    this.hud.feed(`CONTRACT: ${c.label}  +${c.pay} CR`, 'good');
    this.hud.setContracts?.(this.contracts, this._ct);
    this.audio.pickup?.();
    this.buzz([20, 30, 20]);
  }

  /** Fire a contract that is resolved by an EVENT rather than by polling. If
   *  it carries a predicate (CLEAN LAP counts laps now, so it does) the
   *  predicate still has to pass — the event only says "now is a moment when
   *  this could be true", not "it is". */
  _tryContract(id) {
    const c = this.contracts?.find((x) => x.id === id && !x.done);
    if (!c) return;
    if (c.check && !c.check(this, this._ct, this.playerRank, c.need)) return;
    this._completeContract(c);
  }

  /** Lap `lapNo` just completed — resolve the lap-boundary contracts. */
  _lapContracts(lapNo) {
    const ct = this._ct;
    if (!this.contracts?.length || !ct) return;
    if (!ct.lapDamaged) ct.cleanLaps = (ct.cleanLaps ?? 0) + 1;
    this._tryContract('cleanlap');
    ct.lapDamaged = false;
    if (lapNo === 1 && this.playerRank === 1) this._tryContract('start');
  }

  _checkFinishContracts(rank) {
    if (!this.contracts?.length || !this._ct) return;
    for (const c of this.contracts) {
      if (!c.done && c.atFinish && c.check(this, this._ct, rank, c.need)) this._completeContract(c);
    }
  }

  /** The two feat chips on a world card. A LOCKED one names the part and the
   *  level that opens it — that is the whole mechanism, and hiding it would
   *  leave the player saving credits with nothing to save them for. */
  _featChips(levelId) {
    const fs = this.featsOf(levelId);
    if (!fs.length) return '';
    const part = (k) => (UPGRADES.find((u) => u.key === k)?.name || k).split(' ')[0];
    return `<div class="wc-feats">${fs.map((f) => f.done
      ? `<span class="wc-feat done" title="${f.desc}">${f.icon} ${f.label} ✔</span>`
      : f.locked
        ? `<span class="wc-feat locked" title="${f.desc} — ${LOCK_COST[f.need.key] ?? 'the grid gets quicker'}">`
          + `🔒 ${f.label} · ${part(f.need.key)} ${f.need.lvl}`
          + `<i>${LOCK_COST[f.need.key] ?? 'GRID QUICKER'}</i></span>`
        : `<span class="wc-feat open" title="${f.desc}">${f.icon} ${f.label} · ${f.pay}CR</span>`
    ).join('')}</div>`;
  }

  /** HOW READY THIS CAR IS FOR THIS WORLD — 0, 0.5 or 1.
   *
   *  The world's two feats name the parts it wants, at the levels it wants
   *  them. Meeting neither is turning up underprepared; meeting both is being
   *  kitted for the job. Nothing new to learn and nothing hidden: the same
   *  two chips already printed on the track card are the measure. */
  kitReady() {
    const fs = this.featsOf();
    if (!fs.length) return 1;
    return fs.filter((f) => !f.locked).length / fs.length;
  }

  /** What that readiness does to the grid. At 1 this is exactly 1 — the
   *  balance every other suite was tuned against is untouched for a player
   *  who has done the work. Underprepared, the rivals are quicker AND far
   *  more willing to lean on you, which is the difference between losing and
   *  being destroyed in sixth.
   *
   *  Free roam and missions are exempt: there is no grid to lose to, and
   *  punishing exploration for an unbought upgrade would be nonsense. */
  kitHandicap() {
    if (this.freeRoam || this.missionMode) return 1;
    // 0.16 was a nudge, and the padlocks read as decoration because of it —
    // "the locks with items mean nothing now". A full 8 % per unmet gate is
    // most of the gap between a podium and the back of an eight-car grid, and
    // it stacks with the aggression term in startRace().
    return 1 + 0.32 * (1 - this.kitReady());
  }

  /** THE OTHER HALF OF THE LOCK, AND THE HALF THAT MAKES IT A LOCK.
   *
   *  A quicker grid alone is a difficulty knob: you lose by more. A lock has to
   *  mean the world is asking for something you have not brought, so an unmet
   *  gate ALSO takes it out of YOUR car, in the exact currency the gate names.
   *  DAMPERS 2 unmet and the landings hurt; TIRES 2 unmet and the grip is
   *  down; CANNON 2 unmet and the gun is weak here. The part you did not buy
   *  is the part the world takes away.
   *
   *  Applied per-race in startRace(), reverted by applyUpgrades() on the next
   *  one, so nothing here is persistent state that can drift.
   */
  kitPenalties() {
    const out = { grip: 1, cannon: 1, dampers: 0, nitro: 1, hull: 1, speed: 1 };
    if (this.freeRoam || this.missionMode) return out;
    for (const f of this.featsOf()) {
      if (!f.locked) continue;
      switch (f.need.key) {
        case 'tires':    out.grip *= 0.86; break;   // no grip for the loose stuff
        case 'cannon':   out.cannon *= 0.55; break; // the gun this world wanted
        case 'dampers':  out.dampers = 1; break;    // landings cost full price
        case 'nitro':    out.nitro *= 0.6; break;
        case 'armor':    out.hull *= 0.82; break;
        case 'engine':   out.speed *= 0.94; break;
        case 'handling': out.grip *= 0.92; break;
        default: break;
      }
    }
    return out;
  }

  /** Said out loud at the start line, once. A player who cannot podium needs
   *  to know it is the garage and not the driving — otherwise the race just
   *  reads as broken, which is worse than losing. */
  _warnKit() {
    const r = this.kitReady();
    if (r >= 1) return;
    const missing = this.featsOf().filter((f) => f.locked);
    const part = (k) => (UPGRADES.find((u) => u.key === k)?.name || k).split(' ')[0];
    const list = missing.map((f) => `${part(f.need.key)} ${f.need.lvl}`).join(' + ');
    this.hud.feed(r <= 0 ? `UNDERGEARED FOR THIS WORLD — the grid will bury you (${list})`
      : `HALF-KITTED — the grid has the edge here (${list})`, 'bad');
    // Say what it actually costs, not just that it costs. A player who can see
    // "CANNON 2 — your gun is at 55% here" knows what to buy and why.
    const kp = this.kitPenalties();
    const bits = [];
    if (kp.cannon < 1) bits.push(`GUN ${Math.round(kp.cannon * 100)}%`);
    if (kp.grip < 1) bits.push(`GRIP ${Math.round(kp.grip * 100)}%`);
    if (kp.hull < 1) bits.push(`HULL ${Math.round(kp.hull * 100)}%`);
    if (kp.nitro < 1) bits.push(`NITRO ${Math.round(kp.nitro * 100)}%`);
    if (kp.speed < 1) bits.push(`TOP END ${Math.round(kp.speed * 100)}%`);
    if (kp.dampers) bits.push('NO DAMPERS — LANDINGS HURT');
    if (bits.length) this.hud.feed(`THIS WORLD TAKES: ${bits.join(' · ')}`, 'bad');
  }

  /** The garage level THIS car brings to a feat's gate. Per-car, like every
   *  other upgrade read — a feat cleared in the brawler is not cleared by
   *  swapping to a stock machine. */
  featLevel(key) {
    return this.garage?.upgrades?.[this.cars.selected]?.[key] ?? 0;
  }

  /** Feats for a world, each tagged with whether the garage opens it and
   *  whether it is already banked. One shape for the card, the pre-race panel
   *  and the award path, so none of them can describe a different rule. */
  featsOf(levelId = this.level.id) {
    const done = (this.career.feats ??= {})[levelId] ?? [];
    return featsFor(levelId).map((f) => ({
      ...f,
      done: done.includes(f.id),
      have: this.featLevel(f.need.key),
      locked: this.featLevel(f.need.key) < f.need.lvl,
    }));
  }

  /* ---- QUESTS: the long game, and the only reward paid in parts ---------- */

  /** Every quest, tagged with where this career has got to. One shape for the
   *  menu list, the finish-line check and the award path. */
  questState() {
    const q = (this.career.quests ??= {});
    return QUESTS.map((def) => {
      const rec = q[def.id] ?? { keys: [], n: 0, done: false };
      const have = def.tally ? (rec.n | 0) : (rec.keys?.length ?? 0);
      return { ...def, have: Math.min(have, def.count), done: !!rec.done };
    });
  }

  /** Asked once per finished race. Returns the quests that completed, so the
   *  results screen can say so — and pays the part, which is the whole point:
   *  every other reward in this game is a number.
   *
   *  A quest that pays a part the car has already maxed pays CREDITS instead
   *  at three times the rate, so finishing one is never a null result. */
  _checkQuests(rank) {
    if (this.freeRoam || this.missionMode || !this.level) return [];
    const q = (this.career.quests ??= {});
    const won = [];
    for (const def of QUESTS) {
      const rec = (q[def.id] ??= { keys: [], n: 0, done: false });
      if (rec.done) continue;
      if (def.tally) {
        rec.n = (rec.n | 0) + (def.tally(this) | 0);
      } else {
        const key = def.test(this, rank);
        // A STREAK QUEST BREAKS. `false` is "you failed the condition this
        // race", which is different from `null` ("this race did not count"):
        // the first wipes the run, the second leaves it alone.
        if (key === false && def.streak) rec.keys = [];
        else if (key && !rec.keys.includes(key)) rec.keys.push(key);
      }
      const have = def.tally ? (rec.n | 0) : rec.keys.length;
      if (have < def.count) continue;
      rec.done = true;
      won.push(def);
      // ---- pay it ----
      const up = this.carUpgrades();
      const line = UPGRADES.find((u) => u.key === def.reward.part);
      const maxed = !line || (up[def.reward.part] | 0) >= line.max;
      if (maxed) {
        this.contractCredits = (this.contractCredits ?? 0) + def.reward.cr * 3;
        this.hud.feed(`QUEST: ${def.name} — ${line?.name ?? 'PART'} ALREADY MAXED, `
          + `+${def.reward.cr * 3} CR INSTEAD`, 'good');
      } else {
        up[def.reward.part] = (up[def.reward.part] | 0) + 1;
        this.contractCredits = (this.contractCredits ?? 0) + def.reward.cr;
        this.hud.feed(`QUEST: ${def.name} — FREE ${line.name} ${up[def.reward.part]} `
          + `+${def.reward.cr} CR`, 'good');
        saveJSON(this._pkey('garage'), this.garage);
      }
    }
    saveJSON(this._pkey('career'), this.career);
    if (won.length) this._renderQuests?.();
    return won;
  }

  /** The quest board, in the GARAGE tab beside the parts it pays for. */
  _renderQuests() {
    const el = document.getElementById('quest-board');
    if (!el) return;
    const rows = this.questState().map((q) => {
      const pct = Math.round((q.have / q.count) * 100);
      const part = UPGRADES.find((u) => u.key === q.reward.part)?.name ?? q.reward.part;
      return `<div class="qrow${q.done ? ' done' : ''}">
        <span class="qicon">${q.done ? '✔' : q.icon}</span>
        <span class="qmain"><b>${q.name}</b><i>${q.desc}</i>
          <span class="qbar"><span style="width:${pct}%"></span></span></span>
        <span class="qpay">${q.done ? 'CLAIMED' : `FREE ${part.split(' ')[0]}<br>+${q.reward.cr} CR`}</span>
        <span class="qn">${q.have}/${q.count}</span>
      </div>`;
    }).join('');
    const open = this.questState().filter((q) => !q.done).length;
    el.innerHTML = `<div class="cb-head">QUESTS <b>${open} OPEN</b></div>${rows}`;
  }

  /** Banked at the finish. Permanent, once per world, and never awarded for a
   *  run made in a car that did not meet the gate — otherwise the gate is
   *  decoration and the whole mechanism is a lie. */
  _checkFeats(rank) {
    if (this.freeRoam || this.missionMode || !this._ct) return;
    const done = (this.career.feats ??= {})[this.level.id] ?? [];
    let banked = 0;
    for (const f of this.featsOf()) {
      if (f.done || f.locked) continue;
      if (!f.check(this, this._ct, rank)) continue;
      done.push(f.id);
      this.contractCredits = (this.contractCredits ?? 0) + f.pay;
      this.hud.feed(`FEAT: ${f.label}  +${f.pay} CR`, 'good');
      banked++;
    }
    if (!banked) return;
    this.career.feats[this.level.id] = done;
    saveJSON(this._pkey('career'), this.career);
    this._renderLevelCards?.();
  }

  // rivals have opinions: short barks when the position changes hands
  _updateTaunts() {
    const r = this.playerRank;
    if (this._lastRank === undefined) { this._lastRank = r; return; }
    if (r === this._lastRank) return;
    const now = this.raceTime;
    if (now - (this._tauntT ?? -9) > 6 && this.state === 'race') {
      this._tauntT = now;
      if (r > this._lastRank) {
        // someone got past us — find who sits directly ahead now
        const ahead = this.enemies.filter(e => e.alive && e.progress > this.player.progress)
          .sort((a, b) => a.progress - b.progress)[0];
        if (ahead) {
          const lines = ['eat dust!', 'too slow!', 'see ya!', 'nice try, rookie', 'was that it?'];
          this.hud.feed(`${ahead.name}: “${lines[(Math.random() * lines.length) | 0]}”`, 'bad');
        }
      } else {
        const lines = ['CLEAN PASS', 'OVERTAKE!', 'THROUGH THE GAP'];
        this.style(30, lines[(Math.random() * lines.length) | 0]);
      }
    }
    this._lastRank = r;
  }

  // ---------- livestock: cows, sheep, deer that live in the world ----------
  // They graze in herds out in the pastures, scatter when a car comes at them,
  // and a full-speed collision is a real event: heavy for you, fatal for them.
  _buildLivestock() {
    this.herds = [];
    const t = this.track;
    // a theme may declare its own; otherwise pick what belongs in that biome
    // (deserts, lava fields and city tunnels simply have no grazing herds)
    const spec = t.T?.livestock ?? LIVESTOCK_BY_THEME[this.level?.theme];
    if (!spec) return;
    const spots = (t.pastures?.length ? t.pastures : null)
      ?? Array.from({ length: 5 }, (_, k) => {
        const idx = Math.floor(t.N * (k + 0.5) / 5);
        const lat = (k % 2 ? -1 : 1) * (26 + (k * 9) % 20);
        const c = t.pointAt(idx, 0), n = t.nrm[idx];
        return { x: c.x + n.x * lat, z: c.z + n.z * lat, r: 12 };
      });
    // per-species stats: `flee` = sprint speed when spooked (default 11),
    // `spookR` = how close a car gets before they run (default 18),
    // `amble` = grazing walk speed (default 0.9). Damage stays 10+22×mass.
    const KINDS = {
      cow:      { body: 0xf2efe6, spot: 0x2b2521, w: 1.5,  h: 1.5,  d: 2.6, mass: 1.0,  pts: 60 },
      sheep:    { body: 0xe8e4d8, spot: 0x3a3128, w: 1.0,  h: 1.0,  d: 1.6, mass: 0.5,  pts: 40 },
      deer:     { body: 0xa9764a, spot: 0x6b4526, w: 1.0,  h: 1.3,  d: 2.0, mass: 0.6,  pts: 80 },
      goat:     { body: 0xd9d5c9, spot: 0x77705f, w: 0.85, h: 1.0,  d: 1.5, mass: 0.45, pts: 50, flee: 13 },
      camel:    { body: 0xcfa05f, spot: 0x8a6a3c, w: 1.3,  h: 2.2,  d: 2.9, mass: 0.9,  pts: 70, flee: 9, amble: 0.55 },
      boar:     { body: 0x4a3222, spot: 0x2e2014, w: 0.95, h: 0.75, d: 1.6, mass: 0.55, pts: 55, flee: 12 },
      capybara: { body: 0x9a6f42, spot: 0x6e4e2c, w: 0.9,  h: 0.7,  d: 1.4, mass: 0.5,  pts: 90, flee: 8, spookR: 10 },
      // SCENES.md: the alpine passes had generic goats, the deserts had camels
      // standing in for everything, and every ice world had DEER on it — an
      // animal that does not live on an ice sheet. One species per biome that
      // actually belongs there.
      ibex:     { body: 0xa8977c, spot: 0x554a3a, w: 0.95, h: 1.25, d: 1.7, mass: 0.55, pts: 110, flee: 15, spookR: 22, amble: 0.7 },
      coyote:   { body: 0xb08d61, spot: 0x6d5438, w: 0.7,  h: 0.85, d: 1.7, mass: 0.35, pts: 95,  flee: 17, spookR: 26, amble: 1.4 },
      seal:     { body: 0x8f96a2, spot: 0x50565f, w: 0.9,  h: 0.6,  d: 2.0, mass: 0.6,  pts: 85,  flee: 5,  spookR: 9,  amble: 0.35 },
      hare:     { body: 0xe6e2d8, spot: 0xb8b2a4, w: 0.42, h: 0.5,  d: 0.72, mass: 0.18, pts: 70, flee: 19, spookR: 24, amble: 1.1 },
      // OUTBACK RED DIRT. The roo is the region's authored crossing: it sees
      // you from a long way off on an open plain and it bolts, so it gets the
      // widest spook radius and the fastest flee on the roster.
      kangaroo: { body: 0xa87250, spot: 0x6a4630, w: 0.62, h: 1.5,  d: 1.1, mass: 0.5,  pts: 100, flee: 21, spookR: 30, amble: 0.8 },
      emu:      { body: 0x6f5f4c, spot: 0x3e3428, w: 0.6,  h: 1.7,  d: 1.0, mass: 0.45, pts: 90,  flee: 18, spookR: 28, amble: 1.3 },
    };
    // roster shifts per world so two worlds on the same roster don't open with
    // the same species, and one animal in four is the NEXT species along —
    // herds read mixed instead of cloned
    const roster = spec.kinds.filter((k) => KINDS[k]);
    if (!roster.length) return;
    const shift = (this.level?.id ?? 0) % roster.length;
    for (let s = 0; s < spots.length; s++) {
      const spot = spots[s];
      const lead = (s + shift) % roster.length;
      const n = spec.perHerd ?? 4;
      for (let k = 0; k < n; k++) {
        const kind = roster[(lead + (Math.random() < 0.26 ? 1 : 0)) % roster.length];
        const K = KINDS[kind];
        const a = (k / n) * Math.PI * 2;
        const rr = (spot.r ?? 12) * 0.55;
        const x = spot.x + Math.cos(a) * rr, z = spot.z + Math.sin(a) * rr;
        const g = new THREE.Group();
        const bodyMat = new THREE.MeshStandardMaterial({ color: K.body, roughness: 0.92 });
        const darkMat = new THREE.MeshStandardMaterial({ color: K.spot, roughness: 0.95 });
        const body = new THREE.Mesh(new THREE.BoxGeometry(K.w, K.h * 0.75, K.d), bodyMat);
        body.position.y = K.h * 0.75;
        body.castShadow = true;
        g.add(body);
        const head = new THREE.Mesh(new THREE.BoxGeometry(K.w * 0.62, K.h * 0.5, K.d * 0.34), bodyMat);
        head.position.set(0, K.h * 0.98, K.d * 0.56);
        g.add(head);
        if (kind === 'deer') { // antlers
          for (const sx of [-1, 1]) {
            const ant = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 0.08), darkMat);
            ant.position.set(sx * 0.22, K.h * 1.34, K.d * 0.5);
            g.add(ant);
          }
        } else if (kind === 'cow') { // patches
          const patch = new THREE.Mesh(new THREE.BoxGeometry(K.w * 0.5, K.h * 0.3, K.d * 0.35), darkMat);
          patch.position.set(K.w * 0.28, K.h * 0.85, -K.d * 0.12);
          g.add(patch);
        } else if (kind === 'goat') { // little swept-back horns
          for (const sx of [-1, 1]) {
            const horn = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.3, 0.07), darkMat);
            horn.position.set(sx * 0.14, K.h * 1.28, K.d * 0.46);
            horn.rotation.x = -0.55;
            g.add(horn);
          }
        } else if (kind === 'camel') { // neck block up to a raised head + hump
          head.position.y = K.h * 1.34; // the default head sits at cow height
          const neck = new THREE.Mesh(new THREE.BoxGeometry(K.w * 0.34, K.h * 0.6, K.w * 0.36), bodyMat);
          neck.position.set(0, K.h * 1.02, K.d * 0.44);
          g.add(neck);
          const hump = new THREE.Mesh(new THREE.BoxGeometry(K.w * 0.62, K.h * 0.26, K.d * 0.34), darkMat);
          hump.position.set(0, K.h * 1.18, -K.d * 0.08);
          g.add(hump);
        } else if (kind === 'boar') { // low snout
          const snout = new THREE.Mesh(new THREE.BoxGeometry(K.w * 0.3, K.h * 0.3, K.d * 0.2), darkMat);
          snout.position.set(0, K.h * 0.8, K.d * 0.7);
          g.add(snout);
        } else if (kind === 'capybara') { // blunt rounded muzzle, sits low
          head.position.set(0, K.h * 0.86, K.d * 0.5);
          head.scale.set(1.15, 0.9, 1.2);
        } else if (kind === 'kangaroo') { // upright on a heavy tail
          head.position.set(0, K.h * 1.12, K.d * 0.42);
          head.scale.set(0.8, 0.8, 1.1);
          const tail = new THREE.Mesh(new THREE.BoxGeometry(K.w * 0.34, K.h * 0.16, K.d * 1.5), darkMat);
          tail.position.set(0, K.h * 0.34, -K.d * 0.85);
          tail.rotation.x = 0.32;
          g.add(tail);
          for (const sx of [-1, 1]) { // ears
            const ear = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.28, 0.07), darkMat);
            ear.position.set(sx * 0.13, K.h * 1.4, K.d * 0.38);
            g.add(ear);
          }
        } else if (kind === 'emu') { // long bare neck, tiny head, shaggy body
          head.position.set(0, K.h * 1.3, K.d * 0.44);
          head.scale.set(0.5, 0.42, 0.9);
          const neck = new THREE.Mesh(new THREE.BoxGeometry(K.w * 0.22, K.h * 0.62, K.w * 0.24), darkMat);
          neck.position.set(0, K.h * 0.98, K.d * 0.36);
          g.add(neck);
        }
        // camels carry their bulk on long legs; everyone else is knee-high
        const legH = kind === 'camel' ? K.h * 0.68 : K.h * 0.55;
        const legY = kind === 'camel' ? K.h * 0.36 : K.h * 0.28;
        for (const [lx, lz] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) {
          const leg = new THREE.Mesh(new THREE.BoxGeometry(0.16, legH, 0.16), darkMat);
          leg.position.set(lx * K.w * 0.32, legY, lz * K.d * 0.3);
          g.add(leg);
        }
        g.position.set(x, t.terrainHeight?.(x, z) ?? 0, z);
        g.rotation.y = a;
        g.scale.setScalar(0.85 + Math.random() * 0.3); // ±15% so herds aren't clones
        this.worldLayer.add(g);
        this.herds.push({ kind, K, x, z, homeX: spot.x, homeZ: spot.z, homeR: spot.r ?? 12,
          ang: a, mesh: g, alive: true, spooked: 0, y: g.position.y, _yT: 0, bob: k * 1.7 });
      }
    }
  }

  _updateLivestock(dt, time) {
    if (!this.herds?.length) return;
    const t = this.track;
    const cars = (this._carsAll ??= [this.player, ...this.enemies]);
    for (const a of this.herds) {
      if (!a.alive) continue;
      // spook: a car inside the species' comfort radius (18u default; calm
      // capybaras let cars within 10u) sends them running directly away
      const sr = a.K.spookR ?? 18;
      let flee = null;
      for (const car of cars) {
        if (!car.alive) continue;
        const dx = a.x - car.pos.x, dz = a.z - car.pos.z;
        const d2 = dx * dx + dz * dz;
        if (d2 < sr * sr) { flee = { dx, dz, d: Math.sqrt(d2) || 0.01 }; break; }
      }
      let speed;
      if (flee) {
        a.spooked = 1.6;
        a.ang = Math.atan2(flee.dx, flee.dz);
        speed = a.K.flee ?? 11; // nimble goats bolt, camels lope
      } else if (a.spooked > 0) {
        a.spooked -= dt;
        speed = (a.K.flee ?? 11) * 0.62;
      } else {
        // graze: amble slowly, drifting back toward the middle of the pasture
        a.ang += Math.sin(time * 0.4 + a.bob) * 0.5 * dt;
        if (Math.hypot(a.x - a.homeX, a.z - a.homeZ) > a.homeR)
          a.ang = Math.atan2(a.homeX - a.x, a.homeZ - a.z);
        speed = a.K.amble ?? 0.9;
      }
      a.x += Math.sin(a.ang) * speed * dt;
      a.z += Math.cos(a.ang) * speed * dt;
      a._yT -= dt;
      if (a._yT <= 0) { a._yT = 0.25; a.y = t.terrainHeight?.(a.x, a.z) ?? 0; }
      a.mesh.position.set(a.x, a.y, a.z);
      a.mesh.rotation.y = a.ang;
      // running animation: a little vertical bounce while spooked
      if (a.spooked > 0) a.mesh.position.y += Math.abs(Math.sin(time * 11 + a.bob)) * 0.16;

      // collision — a cow is a lot of animal to hit at speed
      for (const car of cars) {
        if (!car.alive) continue;
        const d = Math.hypot(car.pos.x - a.x, car.pos.z - a.z);
        if (d > 1.6 + a.K.w * 0.5) continue;
        const sp = Math.hypot(car.vel.x, car.vel.z);
        if (sp < 4) { // nudging — they just get out of the way
          a.ang = Math.atan2(a.x - car.pos.x, a.z - car.pos.z);
          a.spooked = 1.6;
          break;
        }
        a.alive = false;
        a.mesh.visible = false;
        const at = new THREE.Vector3(a.x, a.y + 0.8, a.z);
        this.particles.debris(at, 4);
        this.particles.splinters(at, new THREE.Vector3(0, 1, 0), [a.K.body, a.K.spot], 0.8);
        car.vel.multiplyScalar(1 - 0.30 * a.K.mass);          // big animal, big drag
        if (car === this.player) {
          // rate-limited: ploughing a whole herd should be costly and
          // memorable, not an instant wreck from four hits in one second
          if (this.raceTime - (this._stockHurt ?? -9) > 0.8) {
            this._stockHurt = this.raceTime;
            car.damage(10 + 22 * a.K.mass, null);
            this.crashDrama?.();
            this.hud.feed(`HIT A ${a.kind.toUpperCase()}!  −${Math.round(10 + 22 * a.K.mass)} HULL`, 'bad');
            this.buzz([50, 30, 50]);
          }
          this.style?.(a.K.pts, 'LIVESTOCK'); // grim, but it is a combat racer
          if (this._ct) this._ct.livestock++; // HERDSMAN contract is now lost
        }
        break;
      }
    }
  }

  // ---------- free-roam treasure stars ----------
  // [MISSIONS] pass 'mission' to rebuild the field on demand for STAR RUSH;
  // plain mission launches keep the world star-free so objectives stay clean.
  // Roam scatters stars far out in the wild (exploration is the point). STAR
  // RUSH is on a clock, so its stars sit in a tighter band that is genuinely
  // reachable at speed — and INSIDE the cliff walls on canyon worlds, which
  // start at |lateral| ≈ 10.5, so no star is ever behind a rock face.
  _buildRoamStars(mode) {
    this.roamStars = [];
    if (!mode && (!this.freeRoam || this.missionMode)) return;
    const t = this.track;
    const glow = glowTexture();
    // canyon worlds: clear the rock band (~15u) so no star spawns inside a
    // cliff face — roamers reach these by driving out through the start berm
    const walled = !!t.T?.cliffWalls;
    const mission = mode === 'mission';
    const minLat = mission ? (walled ? 5 : 7) : walled ? 24 : 16;
    const span = mission ? (walled ? 4 : 12) : 26;
    for (let k = 0; k < 12; k++) {
      const idx = Math.floor(t.N * (k + 0.5) / 12);
      const lat = (k % 2 ? -1 : 1) * (minLat + (k * 7) % span); // properly off-road
      const c = t.pointAt(idx, 0), n = t.nrm[idx];
      const x = c.x + n.x * lat, z = c.z + n.z * lat;
      // close-in mission stars ride the road surface, far ones the terrain
      // (same split the prop scatter uses, so nothing floats or sinks)
      const y = Math.abs(lat) <= 9.5 ? t.pointAt(idx, lat).y : t.terrainHeight(x, z);
      const spr = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glow, color: 0xffd400, transparent: true, opacity: 0.95,
        blending: THREE.AdditiveBlending, depthWrite: false }));
      spr.scale.set(4.5, 4.5, 1);
      spr.position.set(x, y + 2.2, z);
      this.worldLayer.add(spr);
      this.roamStars.push({ x, z, y, spr, got: false });
    }
    // THE SUMMIT STAR. A goat peak is a destination, and a destination pays:
    // one big star on the crown, worth four ordinary finds. Roam only — a
    // mission's stars are its own economy.
    const G = t._goat;
    if (G && !mission) {
      const y = t.terrainHeight(G.x, G.z);
      const spr = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glow, color: 0xfff1b8, transparent: true, opacity: 0.98,
        blending: THREE.AdditiveBlending, depthWrite: false }));
      spr.scale.set(8, 8, 1);
      spr.position.set(G.x, y + 3.2, G.z);
      this.worldLayer.add(spr);
      this.roamStars.push({ x: G.x, z: G.z, y, spr, got: false, summit: true });
    }
  }

  /** Squared distance from (px,pz) to the segment (ax,az)–(bx,bz). Pickups use
   *  this instead of a point test: at 60 fps the car moves ~0.7 u per frame,
   *  but on a hitch (or a slow device) it can move 4+ u in one step and skip
   *  clean THROUGH a pickup radius. A swept test can't be tunnelled. */
  static _segDist2(ax, az, bx, bz, px, pz) {
    const vx = bx - ax, vz = bz - az;
    const len2 = vx * vx + vz * vz;
    let t = len2 > 1e-6 ? ((px - ax) * vx + (pz - az) * vz) / len2 : 0;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    const dx = px - (ax + vx * t), dz = pz - (az + vz * t);
    return dx * dx + dz * dz;
  }

  /** Advance the one-per-frame pickup sweep: where the player was last frame
   *  → where it is now. Every pickup test this frame shares this segment. */
  _beginSweep() {
    const p = this.player.pos;
    const prev = this._sweepPrev;
    // a respawn / placeAt must not sweep a pickup line across the whole map
    const jumped = !prev || (p.x - prev.x) ** 2 + (p.z - prev.z) ** 2 > 900;
    this._sweep = jumped ? { x: p.x, z: p.z } : prev;
    this._sweepPrev = { x: p.x, z: p.z };
  }

  _updateRoamStars(time) {
    if (!this.roamStars?.length) return;
    const p = this.player;
    const from = this._sweep ?? p.pos;
    for (const s of this.roamStars) {
      if (s.got) continue;
      s.spr.position.y = s.y + 2.2 + Math.sin(time * 2 + s.x) * 0.5;
      if (Game._segDist2(from.x, from.z, p.pos.x, p.pos.z, s.x, s.z) < 16) {
        s.got = true;
        this.scene.remove(s.spr);
        if (this.missionMode) { this._missionEvent('star', s); continue; } // [MISSIONS]
        if (s.summit) {
          this.score += 600;
          this.hud.centerMsg('⛰ SUMMIT!');
          this.hud.feed(`⛰ SUMMIT OF ${this.level?.name ?? 'THE PEAK'}  +600`, 'good');
          this.style?.(120, 'SUMMIT');
          this.buzz([40, 40, 40, 40, 80]);
          this.particles.pickupBurst(new THREE.Vector3(s.x, s.y + 2.5, s.z), new THREE.Color(0xfff1b8));
          continue;
        }
        this.score += 150;
        this.hud.feed('⭐ TREASURE STAR  +150', 'good');
        this.buzz([25, 30, 45]);
        this.particles.pickupBurst(new THREE.Vector3(s.x, s.y + 1.5, s.z), new THREE.Color(0xffd400));
        const left = this.roamStars.filter(x => !x.got).length;
        if (left > 0) this.hud.feed(`${left} STARS LEFT OUT THERE`, 'info');
        else this.hud.centerMsg('ALL STARS!');
      }
    }
  }

  // ======================================================================
  // [MISSIONS] — structured arena challenges layered on the roam machinery.
  // Everything mission-scoped lives between these banners (missions-design).
  //
  //   RAMPAGE   timed destruction — every smash feeds the clock back
  //   STAR RUSH 12 stars scattered off the racing line, against the clock
  //   BLITZ     beacon-to-beacon sprint around the circuit
  //   SURVIVOR  outlast an escalating chopper assault — no timer, one life
  //   HOT LAP   one flying lap, no rivals, vs the medal times
  //
  // Two medal shapes. Most missions are RACES: finish fast, `elapsed` is
  // compared UP to gold/silver. SURVIVOR is an ENDURANCE mission (def.survive)
  // and inverts that — you are medalled for how long you LAST, so its
  // thresholds are compared DOWN, and reaching gold ends the run as a win.
  // Payouts are flat per medal (MISSION_CR) and never scale with score.
  // NOTE (RULES.md §0): no minimap, ever. Objectives are found with the HUD
  // arrow, the distance readout and the world itself — never a map overlay.
  // ======================================================================

  /** Medal book storage key. Medals are a CAREER record, so they live under
   *  the active driver profile (ir-p<id>-missions) exactly like career/garage/
   *  cars — two people sharing a device do not share each other's golds. */
  _missionStoreKey() {
    return this._pkey ? this._pkey('missions') : 'ir-missions';
  }

  _missionBest() { return loadJSON(this._missionStoreKey(), {}); }

  /** REFERENCE LAP: what a clean, flat-out lap of this circuit costs — walk the
   *  centreline and integrate segment time at a curvature-limited speed. Every
   *  race-mission target is a multiple of this, so a long technical world and a
   *  short open one both get honest medals instead of one hand-tuned number.
   *
   *  Calibration: an instrumented flat-out lap of PINE VALLEY (N=900, 1699 u)
   *  measured 30.7 s. The raw integral came out at 38.7 s, so it carries a
   *  0.79 correction — the integral is pessimistic because it never lets the
   *  car carry speed through a corner sequence. Snow/wet keep their handicap.
   */
  _missionLapEstimate() {
    const t = this.track;
    let est = 0;
    for (let i = 0; i < t.N; i++) {
      const v = Math.max(24, 58 * Math.min(1, 1 - t.curvature[i] * 14));
      est += t.segLen / v;
    }
    const surf = t.T?.surface;
    return est * 0.79 * (surf === 'snow' ? 1.15 : surf === 'wet' ? 1.06 : 1);
  }

  /** The mission roster for the current world (5, tuned per circuit).
   *  For race missions gold/silver are ELAPSED-time targets and `time` is the
   *  fail clock (0 = none). For a `survive` mission they are SURVIVAL targets
   *  and bigger is better. Every world gets all five — a mission that only
   *  exists on some tracks reads as a bug, not as variety. */
  _missionDefs() {
    if (this.__missionDefs) return this.__missionDefs;
    const t = this.track;
    const surf = t.T?.surface;
    const slow = surf === 'snow' ? 1.2 : surf === 'wet' ? 1.08 : 1;
    const lapT = this._missionLapEstimate(); // already carries the surface handicap
    const defs = [];
    {
      // 25 props out of the ~85 the world carries, most of them on the
      // drivable shoulder — a lap and a bit of committed weaving. The clock
      // starts short and mean and is REFILLED by smashing, so the mission
      // rewards never lifting: stop hitting things and it kills you.
      // Measured: the first handful come at ~0.8 s each, but the field thins
      // as you clear it and the back half costs ~1.7 s a prop, so a full set
      // is worth about 1.3 laps of driving — which is what the targets say.
      // 2.2 s back per smash keeps a committed run ahead of the clock (it
      // hovered 20–50 s in the probe) and lets a hesitant one drown.
      const goal = 25;
      defs.push({
        id: 'rampage', icon: '💥', name: 'RAMPAGE', tip: `SMASH ${goal} PROPS`,
        goal, time: Math.round(26 * slow), bonus: 2.2, chainBonus: 1.5, circuit: false,
        gold: lapT * 1.3 + 2, silver: lapT * 1.9 + 2,
        desc: 'Timed destruction — every smash +2.2s, a hot combo chain +3.7s. Keep the wrecking going or the clock dies.',
      });
    }
    {
      // Par run = one lap plus ~4 s of detour per star. The fail clock only
      // hands you a third of that up front; the rest has to be EARNED back
      // star by star, and the per-star bonus is set just above the par cost
      // of reaching the next one, so a tidy run gains and a sloppy one bleeds.
      const T = lapT + 12 * 4;
      defs.push({
        id: 'starrush', icon: '⭐', name: 'STAR RUSH', tip: 'GRAB ALL 12 STARS',
        // Measured: a car that never lifts and always takes the nearest star
        // collects one every ~4.9 s, i.e. ~59 s for the set on PINE VALLEY —
        // so GOLD sits exactly on that near-optimal route and SILVER forgives
        // a couple of missed lines.
        // circuit:false — the stars ring the world but the ROUTE is yours, so
        // the wrong-way banner must not fire at someone cutting to a star.
        goal: 12, time: Math.round(T * 0.32), bonus: Math.max(5, Math.round(T * 0.09)), circuit: false,
        gold: T * 0.75, silver: T * 0.98,
        desc: '12 stars strung around the world, off the racing line. Each one buys seconds — chain them or run dry.',
      });
    }
    {
      // `par` is the reference cost of one beacon-to-beacon leg (a tenth of a
      // lap). The clock hands you three legs up front and each beacon buys
      // 1.7 legs back — enough headroom to swing wide onto a beacon, not
      // enough to cruise.
      const par = lapT / 10;
      defs.push({
        id: 'blitz', icon: '🚩', name: 'CHECKPOINT BLITZ', tip: 'HIT 10 BEACONS',
        goal: 10, time: Math.round(par * 3 + 2), bonus: Math.round(par * 1.7 * 10) / 10, circuit: true,
        gold: lapT * 1.22 + 3, silver: lapT * 1.5 + 3,
        desc: 'Sprint beacon to beacon around the circuit — each gate buys seconds. Miss the pace and the clock wins.',
      });
    }
    {
      // ENDURANCE: no objective count, no fail clock — just you, one hull and
      // an assault that thickens. Medals are survival times; reaching gold is
      // extraction and ends the run a winner.
      // ~70 s is the whole run: one chopper, two from bronze, three from
      // silver, and the gaps between spawns shorten with each tier. Any
      // longer and the last tier is just attrition, not escalation.
      const g = 70, s = 45, b = 25;
      defs.push({
        id: 'survivor', icon: '🚁', name: 'SURVIVOR', tip: 'STAY ALIVE',
        goal: 0, time: 0, bonus: 0, survive: true, circuit: false,
        gold: g, silver: s, bronze: b,
        desc: `Waves thicken until the sky is full. The clock only runs while they can reach you — ${fmtTime(b)} pays, ${fmtTime(g)} is extraction. One hull, no respawn.`,
      });
    }
    /* ---- THE THREE THAT HAVE SOMETHING TO BEAT ------------------------
     *
     * Reported as "missions needs to be redesigned, they are boring now".
     * The diagnosis is structural, not a matter of tuning: RAMPAGE, STAR RUSH
     * and CHECKPOINT BLITZ are the SAME loop — collect N of X before a clock —
     * with a different pickup mesh on it, and four of the five put you alone
     * in an empty world. A mission with no antagonist is a time trial with
     * extra steps, however well the clock is tuned.
     *
     * These three each have something on the road with you. They deliberately
     * reuse the race machinery (the rival AI, the racing line, the standings)
     * rather than inventing a new one, because that AI is the most interesting
     * thing in the game and the arena modes were throwing it away.
     */
    {
      // ONE RIVAL, ONE LAP, NO WEAPONS ON EITHER SIDE. The purest version of
      // the thing missions were missing. Medals are MARGINS, not times, so the
      // result reads as "I beat them by four seconds" rather than as a
      // stopwatch number you have to know the track to interpret.
      defs.push({
        id: 'duel', icon: '⚔', name: 'DUEL', tip: 'BEAT YOUR RIVAL, ONE LAP',
        goal: 1, time: Math.round(lapT * 2.6 + 14), bonus: 0, circuit: true, duel: true,
        gold: 4, silver: 1.2, bronze: 0.01,   // seconds of margin at the flag
        desc: 'One rival, one lap, wheel to wheel. No rockets, no mines — just '
          + 'the pair of you and the road. Win by four seconds for gold.',
      });
    }
    {
      // THEY RUN, YOU CHASE, AND THEY SHOOT BACKWARDS. Rewards being CLOSE
      // rather than being fast — a different skill from every other mission
      // here, and the one that most rewards knowing a corner.
      defs.push({
        id: 'pursuit', icon: '🎯', name: 'PURSUIT', tip: 'HOLD THEM IN RANGE',
        goal: 20, time: Math.round(lapT * 1.9 + 16), bonus: 0, circuit: false, pursuit: true,
        gold: 20, silver: 13, bronze: 7,       // seconds banked inside 26 u
        desc: 'A runner ahead, armed and unwilling. Time only banks while you '
          + 'are within 26 u of them — close it down and keep it closed.',
      });
    }
    {
      // NO GUNS, LIVE HAZARDS. The world is the opponent. Every fall hazard,
      // rockfall and burning treefall the theme carries is switched on and the
      // cannon is switched off, so the only tool is the car.
      defs.push({
        id: 'gauntlet', icon: '☠', name: 'GAUNTLET', tip: 'ONE LAP, NO WEAPONS',
        goal: 1, time: Math.round(lapT * 2.6 + 14), bonus: 0, circuit: true, gauntlet: true,
        gold: lapT * 1.16 + 2, silver: lapT * 1.45 + 2,
        desc: 'The road at its worst and nothing to shoot back with. Rockfall, '
          + 'burning treefall, whatever this world throws — drive through it.',
      });
    }
    defs.push({
      id: 'hotlap', icon: '⏱', name: 'HOT LAP', tip: 'ONE LAP VS THE CLOCK',
      // Standing start off the grid, so the targets carry a ~2s launch tax on
      // top of the reference lap. GOLD is a clean flat-out lap with almost
      // nothing given away; SILVER absorbs one scruffy corner. The fail clock
      // is deliberately loose — a spin still lets you limp home for bronze,
      // it just costs the medal.
      goal: 1, time: Math.round(lapT * 2.4 + 12), bonus: 0, circuit: true,
      gold: lapT * 1.06 + 2, silver: lapT * 1.32 + 2,
      desc: 'The circuit, your machine, no rivals. One lap from a standing start — beat the gold time.',
    });
    return (this.__missionDefs = defs);
  }

  /** Build the mission picker into #mission-select (missions mode only). */
  _buildMissionPicker() {
    const sel = document.getElementById('mission-select');
    if (!sel) return;
    sel.classList.add('on');
    const defs = this._missionDefs();
    const best = this._missionBest();
    let saved = null;
    try { saved = sessionStorage.getItem('ir-mission-sel'); } catch { /* private mode */ }
    this.missionSel = defs.some((d) => d.id === saved) ? saved : defs[0].id;
    // ONE SCREEN, NOT FOUR AND A HALF. Eight missions each carrying a full
    // paragraph and its own copy of the payout came to a 1369px list on a
    // 390x830 phone — the same wall the track list was before chapters, and
    // reported the same way. Every row is now a LINE: icon, name, the medal you
    // hold, and the one number you are chasing. The prose and the full medal
    // ladder belong to the mission you have actually selected, which is the
    // only one you are about to play.
    //
    // The payout is identical on all eight, so it is stated ONCE in the head
    // instead of eight times in the cards.
    const medalsHeld = defs.filter((d) => best[`${this.level.id}:${d.id}`]).length;
    sel.innerHTML = `<div class="panel-head">ARENA MISSIONS</div>
      <div class="ms-note"><b>${medalsHeld}/${defs.length}</b> MEDALLED HERE ·
        EVERY MISSION PAYS <b>${MISSION_CR[1]}–${MISSION_CR[3]} CR</b> BY MEDAL</div>`;
    for (const d of defs) {
      const b = best[`${this.level.id}:${d.id}`] | 0;
      const chip = document.createElement('button');
      chip.className = 'mission-chip' + (d.id === this.missionSel ? ' current' : '');
      const targets = missionTargetChips(d).map((c) => `<span class="mstat">${c}</span>`).join('');
      // the collapsed line quotes GOLD only — the number you are actually
      // chasing. Silver and bronze are in the ladder on the open card.
      const goldOnly = missionTargetChips(d)[0];
      chip.innerHTML = `<span class="mi">${d.icon}</span>
        <span class="mtext">
          <span class="mhead"><span class="mname">${d.name}</span>
            <span class="mgoal">${goldOnly}</span>
            <span class="mmedal${b ? '' : ' none'}">${b ? MISSION_MEDAL[b] : '—'}</span></span>
          <span class="mopen">
            <span class="mdesc">${d.desc}</span>
            <span class="mstats">${targets}</span>
          </span>
        </span>`;
      chip.addEventListener('click', () => {
        this.missionSel = d.id;
        try { sessionStorage.setItem('ir-mission-sel', d.id); } catch { /* private mode */ }
        for (const c of sel.querySelectorAll('.mission-chip')) c.classList.toggle('current', c === chip);
      });
      sel.appendChild(chip);
    }
    document.getElementById('start-btn').textContent = 'START MISSION';
  }

  /** Launch the selected mission (called from startRace instead of the roam path). */
  _missionLaunch() {
    const defs = this._missionDefs();
    const def = defs.find((d) => d.id === this.missionSel) || defs[0];
    this.state = 'race';
    this.startScore = this.score;
    this.track.setLights('green');
    // THE GRID IS NOT ALWAYS SWEPT ANY MORE. Every mission used to begin by
    // deleting the field, which is exactly what made four of the five lonely.
    // DUEL and PURSUIT keep ONE rival and use the real race AI on it.
    const keepsRival = def.duel || def.pursuit;
    this.enemies.forEach((e, i) => {
      const keep = keepsRival && i === 0;
      e.alive = keep;
      e.mesh.visible = keep;
    });
    this._raceChopper = true; // blocks the final-lap race-chopper path
    this.mission = {
      def, count: 0, elapsed: 0, started: false, over: false,
      timed: def.time > 0, tLeft: def.time, warn10: false, spawnT: 0, tier: 0,
      inRange: 0, bestGap: -999,
    };
    if (keepsRival) {
      const foe = this.enemies[0];
      this.missionFoe = foe;
      foe.health = foe.maxHealth;
      // A DUEL IS A FAIR FIGHT: neither car shoots. `noGuns` is read by the
      // rival's own weapon timers and by the player's fire path, so "no
      // rockets, no mines" on the card is enforced rather than merely stated.
      this.missionNoGuns = !!def.duel || !!def.gauntlet;
      if (def.pursuit) {
        // The runner starts a third of a lap up the road and drives its own
        // race flat out; the mission is entirely about closing that down.
        foe.aggression = Math.min(2, (foe.baseAggression ??= foe.aggression) * 1.4);
        foe.placeAt((this.track.gridSlot(0).index + Math.round(this.track.N * 0.09)) % this.track.N, 0);
      } else {
        const s2 = this.track.gridSlot(1);
        foe.placeAt(s2.index, s2.lateral);
      }
      foe.lap = 1;
      foe.finished = false;
      this.hud.feed(`⚔ ${foe.name} — ${def.duel ? 'BEAT THEM' : 'RUN THEM DOWN'}`, 'bad');
    } else {
      this.missionFoe = null;
      this.missionNoGuns = !!def.gauntlet;
    }
    if (def.gauntlet) this.hud.feed('WEAPONS COLD — THE CAR IS THE ONLY TOOL', 'bad');
    if (def.id === 'starrush') this._buildRoamStars('mission');
    if (def.id === 'blitz') this._missionBuildGates(def);
    // SURVIVOR is the only mission that is about being shot at, so it is the
    // only one that gets dug-in guns. The other four are driving tests.
    if (def.survive) this._digGunNests(4);
    // objective counter borrows the LAP row: "💥 4/18" instead of "LAP 1/3"
    const lapEl = document.getElementById('lap');
    if (lapEl?.parentElement?.firstChild?.nodeType === 3) {
      lapEl.parentElement.firstChild.textContent = def.icon + ' ';
    }
    this.hud.centerMsg(def.name);
    this.hud.feed(`🎯 ${def.tip}`, 'info');
    this.hud.feed(missionTargetLine(def), 'info');
    if (def.survive) this.hud.feed('ONE HULL — NO RESPAWN', 'bad');
    else if (def.time > 0) this.hud.feed('CLOCK STARTS WHEN YOU MOVE', 'info');
    this.buzz([20, 30, 20]);
  }

  /** CHECKPOINT BLITZ: glowing beacon pillars around the circuit; only the
   *  next one is lit. Lateral offsets alternate to force real lines. */
  _missionBuildGates(def) {
    const t = this.track, slot = t.gridSlot(0);
    const glow = glowTexture();
    this.missionGates = [];
    // A pillar of light told you roughly where to be but never where the gate
    // was — no width, no threshold, nothing to aim at. This is a real gate:
    // two posts the width of the opening, a beam across the top, and a lit
    // banner between them. The glow stays as a soft aura so it still reads
    // from a distance, but the structure is what you drive through.
    const HALF = 7;                       // half the opening, in world units
    const postGeo = new THREE.BoxGeometry(0.8, 7.2, 0.8);
    postGeo.translate(0, 3.6, 0);
    const beamGeo = new THREE.BoxGeometry(HALF * 2 + 1.6, 0.9, 0.9);
    const bannerGeo = new THREE.PlaneGeometry(HALF * 2 - 0.6, 2.4);
    for (let k = 1; k <= def.goal; k++) {
      const idx = (slot.index + Math.round(t.N * k / def.goal)) % t.N;
      const lat = k === def.goal ? 0 : [-3.5, 3.5, 0][k % 3];
      const p = t.pointAt(idx, lat);
      // square the gate to the road so you drive through it, not past it
      const ahead = t.pointAt((idx + 4) % t.N, lat);
      const yaw = Math.atan2(ahead.x - p.x, ahead.z - p.z);
      const gate = new THREE.Group();
      gate.position.set(p.x, p.y, p.z);
      gate.rotation.y = yaw;
      const postMat = new THREE.MeshStandardMaterial({
        color: 0x1d2b33, emissive: 0x37f6ff, emissiveIntensity: 0.55, roughness: 0.5 });
      const trimMat = new THREE.MeshStandardMaterial({
        color: 0x37f6ff, emissive: 0x37f6ff, emissiveIntensity: 1.5, roughness: 0.4 });
      for (const s of [-1, 1]) {
        const post = new THREE.Mesh(postGeo, postMat);
        post.position.x = s * HALF;
        post.castShadow = true;
        gate.add(post);
      }
      const beam = new THREE.Mesh(beamGeo, trimMat);
      beam.position.y = 7.2;
      gate.add(beam);
      const banner = new THREE.Mesh(bannerGeo, new THREE.MeshBasicMaterial({
        map: glow, color: 0x37f6ff, transparent: true, opacity: 0.42,
        blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
      banner.position.y = 5.4;
      gate.add(banner);
      // soft aura so the next gate is still findable across the valley
      const aura = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glow, color: 0x37f6ff, transparent: true, opacity: 0.5,
        blending: THREE.AdditiveBlending, depthWrite: false }));
      aura.scale.set(5, 16, 1);
      aura.position.y = 8;
      gate.add(aura);
      gate.visible = k === 1;
      this.worldLayer.add(gate);
      this.missionGates.push({ x: p.x, y: p.y, z: p.z, spr: gate });
    }
  }

  /** Mission event bus — the tiny hooks in shared code all land here. */
  _missionEvent(kind, data) {
    const M = this.mission;
    if (!M || M.over || this.state !== 'race') return;
    const def = M.def;
    if (kind === 'wrecked') {
      // ENDURANCE ends here and you keep whatever time you bought; every other
      // mission just eats the respawn wait, which the clock punishes already.
      if (def.survive) this._missionFinish(true, 'SHOT DOWN');
      return;
    }
    if (kind === 'prop' && def.id === 'rampage') {
      M.count++;
      this.styleBump(); // smashes feed the style chain…
      let add = def.bonus;
      if ((this.comboN ?? 0) >= 3) add += def.chainBonus; // …and hot chains pay extra time
      M.tLeft = Math.min(def.time + M.count * 1.2, M.tLeft + add);
      this.hud.feed(`💥 ${M.count}/${def.goal}  +${add}s`, 'good');
      if (M.count === (def.goal >> 1)) this.hud.centerMsg('HALFWAY!');
      if (M.count >= def.goal) this._missionFinish(true);
    } else if (kind === 'star' && def.id === 'starrush') {
      M.count++;
      M.tLeft += def.bonus;
      this.score += 150;
      this.particles.pickupBurst(new THREE.Vector3(data.x, data.y + 1.5, data.z), new THREE.Color(0xffd400));
      this.buzz([25, 30, 45]);
      this.hud.feed(`⭐ ${M.count}/${def.goal}  +${def.bonus}s`, 'good');
      if (M.count >= def.goal) this._missionFinish(true);
    } else if (kind === 'chopper' && def.survive) {
      // kills don't end an endurance run — they buy breathing room (and a
      // hull patch), which is the only healing SURVIVOR offers.
      M.count++;
      const p = this.player;
      p.health = Math.min(p.maxHealth, p.health + p.maxHealth * 0.15);
      M.spawnT = Math.max(M.spawnT, 2.5);
      this.hud.feed(`🚁 ${M.count} DOWN — HULL PATCHED`, 'good');
    } else if (kind === 'lap' && (def.duel || def.gauntlet)) {
      // Same standing-start, one-lap shape as HOT LAP. A DUEL is won on the
      // margin at this moment, which _missionMedal reads off M.bestGap.
      M.count++;
      this._missionFinish(true, def.duel
        ? ((M.bestGap ?? 0) > 0 ? 'BEAT THEM' : 'BEATEN') : undefined);
    } else if (kind === 'lap' && def.id === 'hotlap') {
      // Standing start from the grid, exactly one lap. We never re-place the
      // car, so `placeAt(slot.index, slot.lateral)` (keepCP defaulting to
      // false) is doing the right thing: the grid sits at ~0.99N, OUTSIDE the
      // 0.4N–0.85N credit window, so the mid-track checkpoint starts unearned
      // and only a genuine full lap can fire onPlayerLap. There is no "arming"
      // crossing to swallow — the FIRST event here is the finished lap, and
      // the targets are calibrated for a standing start.
      M.count++;
      this._missionFinish(true);
    }
  }

  /** Objective guidance WITHOUT a map (RULES.md §0 forbids minimaps in every
   *  form, objective overlays included): the nearest live objective becomes a
   *  compass arrow relative to where the car is pointing, plus a distance in
   *  metres. Everything else is finding it with your eyes. */
  _missionNav(M) {
    let tx = 0, tz = 0, best = Infinity, icon = '';
    if (M.def.id === 'starrush') {
      for (const s of this.roamStars ?? []) {
        if (s.got) continue;
        const dx = s.x - this.player.pos.x, dz = s.z - this.player.pos.z;
        const d = dx * dx + dz * dz;
        if (d < best) { best = d; tx = s.x; tz = s.z; icon = '⭐'; }
      }
    } else if (M.def.id === 'blitz') {
      const gate = this.missionGates?.[M.count];
      if (gate) { tx = gate.x; tz = gate.z; icon = '🚩'; best = 0; }
    }
    if (!icon) { M.nav = null; return; }
    const dx = tx - this.player.pos.x, dz = tz - this.player.pos.z;
    const f = this.player.forward;
    // signed bearing: +ve = target is to the left of the nose
    const ang = Math.atan2(f.z * dx - f.x * dz, f.x * dx + f.z * dz);
    const sector = ((Math.round(ang / (Math.PI / 4)) % 8) + 8) % 8;
    M.nav = {
      icon,
      dist: Math.round(Math.hypot(dx, dz)),
      arrow: ['↑', '↖', '←', '↙', '↓', '↘', '→', '↗'][sector],
    };
  }

  /** Per-frame mission logic: clock, warnings, gates, survivor waves. */
  _updateMission(dt) {
    const M = this.mission;
    if (!this.missionMode || !M || M.over || this.state !== 'race') return;
    const p = this.player;
    if (!M.started) { // the clock arms on the first real input — read the card in peace
      if (Math.abs(p.speedAlong) > 1.5 || this.input.throttle > 0.2) {
        M.started = true;
        if (M.timed) this.hud.centerMsg('GO!');
      } else return;
    }
    if (M.def.survive) {
      // The assault thickens on the CLOCK, not on kills — surviving longer is
      // the only thing that makes it harder, which is the whole mission.
      // 2 airborne → 3 at bronze → 4 at silver, and the gaps shorten too.
      // They spawn as INTERCEPTORS (see _spawnChopper) because a car at full
      // throttle simply outruns anything dropped behind it.
      const d = M.def;
      // THE ENGAGEMENT RULE: you are only SURVIVING while something is
      // actually shooting at you. A gunship tops out at 46 u/s and a flat-out
      // car does ~55, so without this the mission is "drive a circle for 70 s"
      // and never take a scratch — measured, hull untouched the whole run.
      // Bank time by staying in the fight; run and the clock simply stops.
      M.engaged = this.choppers.some((c) => c.alive
        && (c.pos.x - p.pos.x) ** 2 + (c.pos.z - p.pos.z) ** 2 < 80 * 80);
      if (M.engaged) { M.elapsed += dt; M.redeployT = REDEPLOY_T; } else {
        if (this.raceTime - (M.hintT ?? -9) > 5) {
          M.hintT = this.raceTime;
          this.hud.feed('⚠ OUT OF THE FIGHT — CLOCK PAUSED', 'bad');
        }
        // …but a stalemate is not an outcome either. Break contact and the
        // farthest gunship peels off and redeploys into your path, so the
        // fight always comes back. You can shake them; you cannot escape them.
        M.redeployT = (M.redeployT ?? REDEPLOY_T) - dt;
        if (M.redeployT <= 0) {
          M.redeployT = REDEPLOY_T;
          let far = null, fd = -1;
          for (const c of this.choppers) {
            if (!c.alive) continue;
            const d2 = (c.pos.x - p.pos.x) ** 2 + (c.pos.z - p.pos.z) ** 2;
            if (d2 > fd) { fd = d2; far = c; }
          }
          // silent removal, NOT a kill — no score, no hull patch, no feed line
          if (far) { far.alive = false; this.scene.remove(far.mesh); }
          this._spawnChopper(true);
        }
      }
      const tier = M.elapsed >= d.silver ? 2 : M.elapsed >= d.bronze ? 1 : 0;
      if (tier > M.tier) {
        M.tier = tier;
        this.hud.centerMsg(tier === 2 ? 'THEY KEEP COMING' : 'WAVE 2');
        this.hud.feed('⚠ ASSAULT ESCALATING', 'bad');
      }
      const cap = 2 + tier;
      const alive = this.choppers.filter((c) => c.alive).length;
      M.spawnT -= dt;
      if (alive < cap && M.spawnT <= 0) { M.spawnT = 4.5 - tier * 1.2; this._spawnChopper(true); }
      if (M.elapsed >= d.gold) { // extraction — you outlasted the whole thing
        this.hud.feed('🚁 EXTRACTION — YOU OUTLASTED THEM', 'good');
        this._missionFinish(true, 'EXTRACTED');
        return;
      }
    } else {
      M.elapsed += dt;
    }
    // ---- PURSUIT: time only banks while you are actually on them ---------
    if (M.def.pursuit) {
      const foe = this.missionFoe;
      if (!foe || !foe.alive) {          // wrecked them: that ends it, and well
        this._missionFinish(true, 'RUNNER DOWN');
        return;
      }
      const d = Math.hypot(foe.pos.x - p.pos.x, foe.pos.z - p.pos.z);
      const close = d < 26;
      if (close) M.inRange = (M.inRange ?? 0) + dt;
      M.count = Math.floor(M.inRange ?? 0);
      if (close !== M.wasClose) {
        M.wasClose = close;
        this.hud.feed(close ? '🎯 IN RANGE — BANKING' : '⚠ LOST THEM — CLOCK PAUSED',
          close ? 'good' : 'bad');
      }
      if ((M.inRange ?? 0) >= M.def.gold) { this._missionFinish(true, 'RUN DOWN'); return; }
    }
    // ---- DUEL: the flag falls when EITHER car completes the lap ----------
    if (M.def.duel) {
      const foe = this.missionFoe;
      if (foe) {
        // margin in seconds, positive when the player is ahead: progress
        // difference over the leader's speed is a fair reading of a gap that
        // has to work at any point on the lap, not just at the line.
        const gap = (p.progress - foe.progress) * (this.track.N * 0.9)
          / Math.max(8, Math.abs(p.speedAlong));
        M.count = Math.round(gap);
        M.bestGap = gap;
        if (!foe.alive) { this._missionFinish(true, 'RIVAL WRECKED'); return; }
      }
    }
    if (M.def.id === 'blitz' && this.missionGates) {
      const gate = this.missionGates[M.count];
      if (gate) {
        // swept, like the stars — a beacon you drove through at 200 km/h must
        // never be missed because the frame was long
        const s = this._sweep ?? p.pos;
        if (Game._segDist2(s.x, s.z, p.pos.x, p.pos.z, gate.x, gate.z) < 55) { // ~7.4u
          gate.spr.visible = false;
          M.count++;
          M.tLeft += M.def.bonus;
          this.score += 100;
          this.styleBump();
          this.particles.pickupBurst(new THREE.Vector3(gate.x, gate.y + 1.5, gate.z), new THREE.Color(0x37f6ff));
          this.buzz(25);
          const next = this.missionGates[M.count];
          if (next) next.spr.visible = true;
          this.hud.feed(`🚩 GATE ${M.count}/${M.def.goal}  +${M.def.bonus}s`, 'good');
          if (M.count >= M.def.goal) this._missionFinish(true);
        }
      }
    }
    this._missionNav(M);
    if (M.timed && !M.over) {
      M.tLeft -= dt;
      if (M.tLeft <= 10.2 && M.tLeft > 0 && !M.warn10) {
        M.warn10 = true;
        this.hud.feed('⏱ 10 SECONDS!', 'bad');
        this.buzz(40);
      }
      if (M.tLeft > 10.2) M.warn10 = false; // bonus time pushed the clock back up
      if (M.tLeft <= 0) { M.tLeft = 0; this._missionFinish(false, 'OUT OF TIME'); }
    }
  }

  /** Medal for a finished run. Race missions are graded DOWN from gold (fast
   *  wins); endurance missions are graded UP (lasting wins) and can still take
   *  a medal home from a run that ended in a wreck. */
  _missionMedal(win, M) {
    const d = M.def;
    if (d.survive) {
      const t = M.elapsed;
      return t >= d.gold ? 3 : t >= d.silver ? 2 : t >= d.bronze ? 1 : 0;
    }
    // DUEL and PURSUIT are scored on a MARGIN and on TIME-ON-TARGET, both of
    // which are "more is better" — the opposite of every other mission here,
    // where the medal is a lap time and less is better. Reading them through
    // the `<=` below would award gold for losing by four seconds.
    if (d.duel) {
      const gap = M.bestGap ?? -999;
      if (gap <= 0) return 0;                 // beaten is beaten, however close
      return gap >= d.gold ? 3 : gap >= d.silver ? 2 : 1;
    }
    if (d.pursuit) {
      const t = M.inRange ?? 0;
      return t >= d.gold ? 3 : t >= d.silver ? 2 : t >= d.bronze ? 1 : 0;
    }
    if (!win) return 0; // a race mission that ran out of clock earns nothing
    return M.elapsed <= d.gold ? 3 : M.elapsed <= d.silver ? 2 : 1;
  }

  /** Win/fail: medal by time, modest CR payout, best-medal persistence,
   *  and the shared results card dressed as a mission debrief. */
  _missionFinish(win, reason) {
    const M = this.mission;
    if (!M || M.over) return;
    M.over = true;
    this.state = 'finished';
    const def = M.def;
    // survivor stragglers stop shooting the debrief screen
    for (const c of this.choppers) if (c.alive) { c.alive = false; this.scene.remove(c.mesh); }
    const medal = this._missionMedal(win, M);
    if (def.survive) win = medal > 0; // outlasted nothing = failed the run
    const cr = MISSION_CR[medal] | 0;
    if (cr > 0) {
      this.garage.credits += cr;
      this._syncCredits();
      saveJSON(this._pkey('garage'), this.garage); // per-profile purse (economy agent)
      this.renderGarage();
    }
    if (medal > 0) {
      const best = this._missionBest();
      const key = `${this.level.id}:${def.id}`;
      if (medal > (best[key] | 0)) {
        best[key] = medal;
        saveJSON(this._missionStoreKey(), best);
      }
    }
    this.hud.centerMsg(win ? ['', 'BRONZE!', 'SILVER!', 'GOLD!'][medal] : 'MISSION FAILED');
    if (win) { this.audio.lap(); this.buzz([40, 40, 80]); }
    else { this.hud.damageFlash?.(0.6); this.buzz(60); }
    // Results card, re-dressed as a debrief. The card is `.results-card >
    // .result-stats > .rrow`, each row `<span>LABEL</span><b id=…>value</b>`,
    // so a label is the value node's PREVIOUS sibling. Labels are only ever
    // rewritten in-memory; a reload restores the race wording from the markup.
    const setRow = (id, label, value) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.textContent = value;
      if (el.previousElementSibling) el.previousElementSibling.textContent = label;
    };
    document.querySelector('#results .game-sub').textContent = win
      ? `MISSION COMPLETE${reason ? ' — ' + reason : ''}`
      : `MISSION FAILED${reason ? ' — ' + reason : ''}`;
    document.getElementById('result-place').textContent = win ? MISSION_MEDAL_WORD[medal] : 'FAILED';
    setRow('r-score', 'MISSION SCORE', Math.max(0, this.score - (this.startScore ?? 0)).toLocaleString());
    setRow('r-kills', def.survive ? 'CHOPPERS DOWN' : 'OBJECTIVE',
      def.survive ? `${M.count}` : `${M.count}/${def.goal}`);
    setRow('r-time', def.survive ? 'SURVIVED' : 'MISSION TIME', fmtTime(M.elapsed));
    setRow('r-best', 'GOLD / SILVER', def.survive
      ? `${fmtTime(def.gold)}+ / ${fmtTime(def.silver)}+`
      : `${fmtTime(def.gold)} / ${fmtTime(def.silver)}`);
    // the medal itself gets its own .rrow, revealed for missions only
    const medalRow = document.getElementById('rrow-medal');
    if (medalRow) medalRow.style.display = '';
    // missions share the results screen but earn no rally stars — leaving the
    // panel up would show the last RACE's stars against a mission debrief
    const starBox = document.getElementById('star-panel');
    if (starBox) starBox.style.display = 'none';
    setRow('r-medal', 'MEDAL', MISSION_MEDAL_WORD[medal]);
    document.getElementById('r-credits').textContent = `+${cr}`;
    // itemized breakdown, same box the race payout uses — one line, so the
    // player can see at a glance that a mission is medal money and nothing else
    {
      const box = document.getElementById('credit-breakdown');
      const rowsEl = document.getElementById('cb-rows');
      if (box && rowsEl) {
        rowsEl.innerHTML =
          `<div class="cb-row${medal ? '' : ' missed'}"><span>${medal ? '✓' : '✗'} ${def.name} — ${MISSION_MEDAL_WORD[medal]}</span><b>+${cr}</b></div>`
          + '<div class="cb-row missed"><span>MISSION SCORE — NO CREDIT RATE</span><b>—</b></div>'
          + `<div class="cb-row total"><span>TOTAL CREDITS</span><b>+${cr}</b></div>`;
        box.style.display = '';
      }
    }
    if (cr > 0) this.hud.feed(`MEDAL PAYOUT  +${cr} CR`, 'good');
    const nextBtn = document.getElementById('next-level-btn');
    nextBtn.style.display = '';
    nextBtn.textContent = '🎯 MISSION SELECT';
    document.getElementById('restart-btn').textContent = win ? 'RUN IT AGAIN' : 'RETRY MISSION';
    setTimeout(() => {
      if (this.state !== 'finished') return; // player already restarted
      this._announcePartUnlocks();   // [PARTS] a part the race just opened
      document.getElementById('results').classList.remove('hidden');
      this.hud.hide();
      document.getElementById('touch-ui').classList.remove('on');
    }, 1400);
  }

  /** Called from resetRace: mission state never survives into the next run. */
  _missionReset() {
    if (!this.missionMode) return;
    this.mission = null;
    // ...and the two flags the rival-bearing missions set. Left standing,
    // `missionNoGuns` would follow you out of a DUEL and disarm the next race.
    this.missionFoe = null;
    this.missionNoGuns = false;
    for (const gsp of this.missionGates ?? []) this.scene.remove(gsp.spr);
    this.missionGates = null;
    for (const s of this.roamStars ?? []) if (!s.got) this.scene.remove(s.spr);
    this.roamStars = [];
  }

  // ======================================================================
  // [MISSIONS] end
  // ======================================================================

  // ---------- dynamic world hazards (theme-declared; see RULES.md) ----------
  // Themes opt in with data only: geysers {count}, fallHazard {kind,period,dmg},
  // chase {kind}, strips {kind,count}, critters {kind,count}. All systems are
  // defensive no-ops when the theme declares nothing.
  _initWorldHazards() {
    const t = this.track, T = t?.T || {};
    this.fallers = [];
    this._fallT = 5;
    this.chaseWall = null;
    this.geysers = [];
    this.strips = [];
    this.critters = [];

    if (T.geysers?.count) {
      const n = T.geysers.count;
      for (let k = 0; k < n; k++) {
        const idx = Math.floor(t.N * (k + 0.5) / n);
        const latr = (k % 2 === 0 ? -1 : 1) * 3.5;
        const p = t.pointAt(idx, latr);
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(1.6, 3.0, 20),
          new THREE.MeshBasicMaterial({ color: 0xc9a06a, transparent: true, opacity: 0.55, side: THREE.DoubleSide }));
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(p.x, p.y + 0.06, p.z);
        this.worldLayer.add(ring);
        this.geysers.push({ x: p.x, y: p.y, z: p.z, phase: k * 1.9, ring });
      }
    }

    if (T.strips?.count) {
      // claim the straightest non-overlapping runs of ~36 samples
      const LEN = 36, used = new Set();
      const runs = [];
      for (let i = 0; i < t.N; i += 4) {
        let c = 0;
        for (let k = 0; k < LEN; k += 4) c = Math.max(c, t.curvature[(i + k) % t.N]);
        runs.push([c, i]);
      }
      runs.sort((a, b) => a[0] - b[0]);
      const color = T.strips.kind === 'maglev' ? 0x37f6ff : 0x66c8ff;
      for (const [, i0] of runs) {
        if (this.strips.length >= T.strips.count) break;
        let clash = false;
        for (let k = -LEN; k < LEN * 2; k++) if (used.has((i0 + k + t.N) % t.N)) { clash = true; break; }
        if (clash) continue;
        for (let k = 0; k < LEN; k++) used.add((i0 + k) % t.N);
        // glowing lane ribbon down the road center
        const verts = [], idxs = [];
        for (let k = 0; k <= LEN; k++) {
          const j = (i0 + k) % t.N;
          const c = t.pointAt(j, 0), nrm = t.nrm[j];
          verts.push(c.x - nrm.x * 2.2, c.y + 0.09, c.z - nrm.z * 2.2,
                     c.x + nrm.x * 2.2, c.y + 0.09, c.z + nrm.z * 2.2);
          if (k) { const b = k * 2; idxs.push(b - 2, b - 1, b, b - 1, b + 1, b); }
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts), 3));
        g.setIndex(idxs);
        const mesh = new THREE.Mesh(g, new THREE.MeshBasicMaterial({
          color, transparent: true, opacity: 0.42, blending: THREE.AdditiveBlending, depthWrite: false }));
        this.worldLayer.add(mesh);
        this.strips.push({ i0, i1: (i0 + LEN) % t.N, len: LEN, mesh });
      }
    }

    if (T.critters?.count) {
      const rat = T.critters.kind === 'rat';
      for (let k = 0; k < T.critters.count; k++) {
        const idx = Math.floor(t.N * (k + 0.35) / T.critters.count);
        const lat = (k % 2 === 0 ? -1 : 1) * (7 + (k % 3) * 2);
        const p = t.pointAt(idx, lat);
        const m = new THREE.Group();
        const bodyC = rat ? 0x8a8580 : 0x7a2f1d;
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.32, 1.0),
          new THREE.MeshStandardMaterial({ color: bodyC, roughness: 0.9 }));
        body.position.y = 0.18;
        m.add(body);
        const tail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.7),
          new THREE.MeshStandardMaterial({ color: bodyC, roughness: 0.9 }));
        tail.position.set(0, rat ? 0.15 : 0.55, -0.75);
        if (!rat) tail.rotation.x = -0.9; // scorpion tail curls up
        m.add(tail);
        m.position.set(p.x, t.terrainHeight?.(p.x, p.z) ?? p.y, p.z);
        this.worldLayer.add(m);
        this.critters.push({ baseX: p.x, baseZ: p.z, x: p.x, z: p.z, ang: k * 1.3, alive: true, mesh: m, lastSting: -9 });
      }
    }
  }

  /** Fall hazards must COME FROM SOMEWHERE.
   *
   * Every faller used to be spawned 30 u straight up over the middle of the
   * road and dropped, so on screen a boulder simply materialised in clear sky
   * — reported as "rocks are falling from the sky, which is funny and not
   * correct". Nothing was above it, because nothing put it there.
   *
   * Each kind is now launched off the thing it would actually come from:
   *
   *   rock / icicle — the canyon RIM. `_cliffProfile` gives the wall's height
   *     and lateral reach at that point, so the hazard starts ON the rock face
   *     and gets exactly the horizontal velocity that carries it to the
   *     intended landing spot. It visibly lets go and arcs onto the road.
   *   burningTree — the VERGE. A tree does not drop, it TOPPLES: it stands at
   *     the roadside and rotates about its base across the carriageway, at the
   *     angular acceleration of a real falling rod (slow, then all at once).
   *
   * The landing point is unchanged in every case, so the hazard is exactly as
   * dangerous as it was — it just has a cause now.
   */
  _spawnFaller(T) {
    const t = this.track;
    // Pick the side FIRST: a rock off the left wall should land on the left of
    // the road, not be flung across it. Mostly same-side, occasionally over the
    // centre line, so the arc stays a rockfall and never reads as a catapult.
    const side = Math.random() < 0.5 ? 1 : -1;
    // …and pick a spot with a WALL WORTH FALLING OFF. `_cliffProfile` drops to
    // a 1.7 u berm where the canyon opens around the start bowl; measured, a
    // rock launched there fell 3.4 u in 0.42 s — no origin the player can read
    // and no time to react. Sample a few candidates for a real face first.
    let idx = (this.player.trackIndex + 40 + Math.floor(Math.random() * 45)) % t.N;
    if (t._cliffProfile) {
      for (let k = 0; k < 6; k++) {
        if (t._cliffProfile(idx, side).h >= 8) break;
        idx = (this.player.trackIndex + 40 + Math.floor(Math.random() * 45)) % t.N;
      }
    }
    const half = t.widthAt?.(idx) ?? 9;
    const lat = side * (Math.random() * 0.95 - 0.18) * half;
    const p = t.pointAt(idx, lat);
    const kind = T.fallHazard.kind;
    let mesh;
    if (kind === 'icicle') {
      mesh = new THREE.Mesh(new THREE.ConeGeometry(0.55, 2.6, 6),
        new THREE.MeshStandardMaterial({ color: 0xcfeaf8, roughness: 0.25, envMapIntensity: 1.2 }));
      mesh.rotation.x = Math.PI; // point down
    } else if (kind === 'burningTree') {
      mesh = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.BoxGeometry(0.9, 5.4, 0.9),
        new THREE.MeshStandardMaterial({ color: 0x3a2a1c, roughness: 0.9 }));
      trunk.position.y = 2.7;
      const glow = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.6, 1.1),
        new THREE.MeshStandardMaterial({ color: 0xff7a2a, emissive: 0xff5a1a, emissiveIntensity: 1.6 }));
      glow.position.y = 4.6;
      mesh.add(trunk, glow);
    } else {
      mesh = new THREE.Group();
      // A rock that has JUST BROKEN OFF shows a fresh face — unweathered, and
      // far paler than the wall it left. That is what real rock does, and it is
      // also the only reason you can see the thing: measured against the cliff
      // behind it, the old flat 0x8a6a4c box read at a max-channel contrast of
      // 31/255 — 12 %. That is camouflage, not a hazard. Taken from the theme's
      // own chip colour so it still belongs to the world it fell off.
      const fresh = new THREE.Color(t.T?.splinter?.[0] ?? 0x8a6a4c)
        .lerp(new THREE.Color(0xffffff), 0.55);
      for (let i = 0; i < 3; i++) {
        const s = 1.0 + Math.random() * 0.8;
        const b = new THREE.Mesh(new THREE.BoxGeometry(s, s, s),
          new THREE.MeshStandardMaterial({
            // a little per-lump variation so it reads as broken rock, not a toy
            color: fresh.clone().multiplyScalar(0.88 + Math.random() * 0.24),
            roughness: 0.95,
          }));
        b.position.set((Math.random() - 0.5) * 0.9, (Math.random() - 0.5) * 0.7, (Math.random() - 0.5) * 0.9);
        b.rotation.y = Math.random() * 1.5;
        mesh.add(b);
      }
    }
    const f = { kind, x: p.x, z: p.z, y: p.y, groundY: p.y, vy: 0, vx: 0, vz: 0,
      dmg: T.fallHazard.dmg ?? 20, mesh, landed: false, ttl: 18, solid: null };
    const prof = t._cliffProfile ? t._cliffProfile(idx, side) : null;

    if (kind === 'burningTree') {
      // TOPPLE, don't drop. The trunk geometry is already built base-at-origin
      // (trunk.position.y = 2.7 on a 5.4 tall box), so rotating the group about
      // its own origin pivots it exactly on its stump.
      // Stand it just off the tarmac, not out in the scrub: the trunk is 5.4
      // long, so from `half + 3.5` its tip landed at lateral 7.1 — technically
      // on the road and blocking nothing. From here it lies across roughly half
      // the carriageway, which is a hazard you actually have to drive around.
      const b = t.pointAt(idx, side * (half + 1.2));
      const c = t.center[idx], c2 = t.center[(idx + 1) % t.N];
      // spin axis along the road, so it comes down ACROSS the carriageway
      f.axis = new THREE.Vector3(c2.x - c.x, 0, c2.z - c.z).normalize();
      // …and falls inward, toward the centreline it is standing beside
      const n = t.nrm[idx];
      f.tipDir = new THREE.Vector3(-side * n.x, 0, -side * n.z);
      f.x = b.x; f.z = b.z; f.y = b.y; f.groundY = b.y;
      f.len = 5.4; f.topple = 0.14; f.toppleV = 0; f.side = side;
      mesh.position.set(b.x, b.y, b.z);
      mesh.quaternion.setFromAxisAngle(f.axis, f.topple * side);
    } else if (prof) {
      // OFF THE RIM. Start on the cliff top and solve for the horizontal speed
      // that puts it on the intended landing spot when gravity gets it there.
      const r = t.pointAt(idx, side * (prof.base + prof.l1 + prof.l2));
      const startY = p.y + prof.h + 1.2;
      const fall = Math.max(0.35, Math.sqrt(2 * (startY - p.y) / 26));
      f.x = r.x; f.z = r.z; f.y = startY;
      f.vx = (p.x - r.x) / fall; f.vz = (p.z - r.z) / fall;
      mesh.position.set(r.x, startY, r.z);
      // it lets go — dust and grit burst off the face where it broke away
      this.particles.debris?.({ x: r.x, y: startY, z: r.z }, 5);
      this.particles.dust?.({ x: r.x, y: startY, z: r.z }, 0.9);
    } else {
      // no cliff on this world: fall back to the old straight drop rather than
      // inventing an origin that isn't there
      f.y = p.y + (kind === 'icicle' ? 16 : 30);
      mesh.position.set(p.x, f.y, p.z);
    }
    this.worldLayer.add(mesh);
    this.fallers.push(f);
  }

  _updateWorldHazards(dt, time) {
    const t = this.track, T = t?.T || {};
    const cars = (this._carsAll ??= [this.player, ...this.enemies]);

    // ---- falling hazards ----
    if (T.fallHazard && this.state === 'race') {
      this._fallT -= dt;
      if (this._fallT <= 0 && this.fallers.filter(f => !f.landed).length < 4) {
        this._fallT = (T.fallHazard.period ?? 6) * (0.7 + Math.random() * 0.6);
        this._spawnFaller(T);
      }
    }
    for (let i = this.fallers.length - 1; i >= 0; i--) {
      const f = this.fallers[i];
      if (!f.landed && f.topple !== undefined) {
        // ---- a tree comes down as a ROD PIVOTING ON ITS STUMP: angular
        // acceleration 3g·sin(θ)/2L, so it starts almost imperceptibly and
        // arrives all at once. That timing is the whole read — you get a beat
        // to notice it leaning before it is across the road.
        f.toppleV += (3 * 26 / (2 * f.len)) * Math.sin(f.topple) * dt;
        f.topple = Math.min(Math.PI / 2, f.topple + f.toppleV * dt);
        f.mesh.quaternion.setFromAxisAngle(f.axis, f.topple * f.side);
        // the trunk SWEEPS: once it is past ~55° it can catch a car anywhere
        // along its span, not just at the stump
        if (f.topple > 0.95) {
          const reach = f.len * Math.sin(f.topple);
          for (const car of cars) {
            if (!car.alive || car.invuln > 0) continue;
            // distance from the car to the trunk segment (base -> current tip)
            const rx = car.pos.x - f.x, rz = car.pos.z - f.z;
            const along = THREE.MathUtils.clamp(rx * f.tipDir.x + rz * f.tipDir.z, 0, reach);
            const d = Math.hypot(rx - f.tipDir.x * along, rz - f.tipDir.z * along);
            if (d < 2.3 && f.groundY + f.len * Math.cos(f.topple) < car.pos.y + 3.2) {
              car.damage(f.dmg, null);
              car.vel.addScaledVector(f.tipDir, 6);
              if (car === this.player) {
                this.crashDrama?.();
                this.hud.feed('CRUSHED BY BURNING TREE!', 'bad');
              }
              car.invuln = Math.max(car.invuln, 0.6); // one strike per fall
            }
          }
        }
        if (f.topple >= Math.PI / 2 - 0.02) {
          f.landed = true;
          const near = Math.hypot(this.player.pos.x - f.x, this.player.pos.z - f.z);
          if (near < 40) this.shake = Math.min(1, this.shake + 0.3);
          const mx = f.x + f.tipDir.x * f.len * 0.5, mz = f.z + f.tipDir.z * f.len * 0.5;
          this.particles.debris({ x: mx, y: f.groundY + 0.5, z: mz }, 6);
          this.particles.dust?.({ x: mx, y: f.groundY + 0.4, z: mz }, 1.3);
          // the obstacle is the FALLEN TRUNK lying across the road, so the
          // collider sits at its mid-span — not back at the stump on the verge
          f.solid = { x: mx, z: mz, r: 2.6, y: f.groundY, mat: 'stone', _faller: true };
          t.solids?.push(f.solid);
        }
      } else if (!f.landed) {
        f.vy += 26 * dt;
        f.y -= f.vy * dt;
        f.x += f.vx * dt;
        f.z += f.vz * dt;
        f.mesh.position.set(f.x, f.y, f.z);
        // GRIT TRAIL. A rock coming off a dry face sheds dust the whole way
        // down, and that hanging trail — not the rock — is what makes the fall
        // readable from 100 u back, where the rock itself is a 1 u box against a
        // cliff of the same colour. One sprite every 40 ms, so a whole flight
        // costs ~29 of a 620/frame budget.
        if (f.kind === 'rock') {
          f.dustT = (f.dustT ?? 0) - dt;
          if (f.dustT <= 0) {
            f.dustT = 0.04;
            this.particles.dust?.({ x: f.x, y: f.y, z: f.z }, 0.35);
          }
        }
        // clobber anything under it on the way down
        for (const car of cars) {
          if (!car.alive || car.invuln > 0) continue;
          const d = Math.hypot(car.pos.x - f.x, car.pos.z - f.z);
          if (d < 2.3 && Math.abs(car.pos.y - f.y) < 3.2) {
            car.damage(f.dmg, null);
            car.vel.x += (car.pos.x - f.x) * 3; car.vel.z += (car.pos.z - f.z) * 3;
            if (car === this.player) {
              this.crashDrama?.();
              this.hud.feed(f.kind === 'icicle' ? 'ICICLE STRIKE!' : f.kind === 'burningTree' ? 'CRUSHED BY BURNING TREE!' : 'ROCKFALL HIT!', 'bad');
            }
          }
        }
        if (f.y <= f.groundY + (f.kind === 'burningTree' ? 0 : 0.6)) {
          f.landed = true;
          const near = Math.hypot(this.player.pos.x - f.x, this.player.pos.z - f.z);
          if (near < 40) this.shake = Math.min(1, this.shake + 0.3);
          // The impact has to read from DOWN THE ROAD. Measured, a rock lands
          // 111–197 u ahead of you and you are still 3.7–6.6 s of driving away
          // when it hits — so the plume is usually the first thing you see of
          // the hazard, and four bits of debris was not enough to notice.
          this.particles.debris({ x: f.x, y: f.groundY + 0.5, z: f.z }, f.kind === 'icicle' ? 4 : 9);
          if (f.kind !== 'icicle') {
            for (let d = 0; d < 5; d++)
              this.particles.dust?.({ x: f.x, y: f.groundY + 0.3, z: f.z }, 1.3);
          }
          if (f.kind === 'icicle') { // shatters — no lasting obstacle
            this.particles.splinters(f.mesh.position, new THREE.Vector3(0, 1, 0), [0xcfe8f4, 0x8fd0e8], 0.7);
            // parent, NOT scene: fallers live on worldLayer, so scene.remove
            // was a no-op and every shattered icicle stayed in the graph
            f.mesh.parent?.remove(f.mesh);
            this.fallers.splice(i, 1);
            continue;
          }
          f.mesh.position.y = f.groundY + (f.kind === 'burningTree' ? 0 : 0.6);
          f.solid = { x: f.x, z: f.z, r: 1.5, y: f.groundY, mat: 'stone', _faller: true };
          t.solids?.push(f.solid);
        }
      } else {
        f.ttl -= dt;
        if (f.ttl <= 0) {
          f.mesh.parent?.remove(f.mesh);   // parent, not scene — see above
          if (f.solid && t.solids) {
            const si = t.solids.indexOf(f.solid);
            if (si >= 0) t.solids.splice(si, 1);
          }
          this.fallers.splice(i, 1);
        }
      }
    }

    // ---- geysers ----
    for (const gy of this.geysers) {
      const ph = (this.raceTime + gy.phase) % 7.5;
      if (ph > 5.6 && ph < 6.4) { // pre-blow rumble
        if (Math.random() < 0.3) this.particles.spawnDust?.(gy.x, gy.y, gy.z);
        gy.ring.material.opacity = 0.85;
      } else if (ph >= 6.4) {     // eruption
        gy.ring.material.opacity = 0.55;
        for (let s = 0; s < 2; s++) {
          this.particles.spawn(gy.x + (Math.random() - 0.5), gy.y + 0.3, gy.z + (Math.random() - 0.5),
            (Math.random() - 0.5) * 3, 14 + Math.random() * 6, (Math.random() - 0.5) * 3,
            GEYSER_SAND, 2.4, 0.8, { drag: 0.2, grav: 12, shrink: 1.1, alpha: 0.7 });
        }
        for (const car of cars) {
          if (!car.alive) continue;
          if ((car._geyserCd ?? 0) > this.raceTime) continue;
          if (Math.hypot(car.pos.x - gy.x, car.pos.z - gy.z) < 3.2) {
            car._geyserCd = this.raceTime + 2.5;
            car.vy = Math.max(car.vy, 15);
            car.airborne = true;
            car.damage(3, null);
            if (car === this.player) { this.hud.feed('SAND GEYSER LAUNCH!', 'info'); this.buzz(40); }
          }
        }
      } else gy.ring.material.opacity = 0.55;
    }

    // ---- speed strips (flume / maglev) ----
    if (this.strips.length) {
      for (const car of cars) {
        car.stripLock = null;
        if (!car.alive) continue;
        for (const st of this.strips) {
          const rel = (car.trackIndex - st.i0 + t.N) % t.N;
          if (rel <= st.len && Math.abs(car.lateral) < 6) {
            const lock = (car._stripLockObj ??= { vmin: 0, steerMul: 0.45 });
            lock.vmin = car.maxSpeed * 1.22;
            car.stripLock = lock;
            // reel the car onto the lane center
            const n = t.nrm[car.trackIndex];
            const pull = Math.min(1, 2.5 * dt) * car.lateral;
            car.pos.x -= n.x * pull; car.pos.z -= n.z * pull;
            if (car === this.player && (this._stripCd ?? 0) < this.raceTime) {
              this._stripCd = this.raceTime + 4;
              this.hud.feed(t.T.strips.kind === 'maglev' ? 'MAGLEV LANE ENGAGED' : 'FLUME RUN!', 'info');
            }
            break;
          }
        }
      }
    }

    // ---- critters (scorpions / rats) ----
    for (const cr of this.critters) {
      if (!cr.alive) continue;
      cr.ang += Math.sin(time * 0.7 + cr.baseX) * 0.9 * dt;
      cr.x += Math.sin(cr.ang) * 1.4 * dt;
      cr.z += Math.cos(cr.ang) * 1.4 * dt;
      const wanderD = Math.hypot(cr.x - cr.baseX, cr.z - cr.baseZ);
      if (wanderD > 6) cr.ang += Math.PI * 0.5 * dt * 4; // turn back home
      // terrain height only every ~0.2s per critter — the exact-scan sampler
      // is too pricey to run 12x per frame
      cr._yT = (cr._yT ?? 0) - dt;
      if (cr._yT <= 0) { cr._yT = 0.2; cr._y = t.terrainHeight?.(cr.x, cr.z) ?? 0; }
      cr.mesh.position.set(cr.x, cr._y ?? 0, cr.z);
      cr.mesh.rotation.y = cr.ang;
      for (const car of cars) {
        if (!car.alive) continue;
        const d = Math.hypot(car.pos.x - cr.x, car.pos.z - cr.z);
        if (d > 1.7) continue;
        const spd = Math.hypot(car.vel.x, car.vel.z);
        if (spd > 7) { // squashed flat
          cr.alive = false;
          cr.mesh.scale.set(1.4, 0.12, 1.4);
          this.particles.debris(cr.mesh.position, 2);
          if (car === this.player) this.style(25, 'PEST CONTROL');
        } else if (this.raceTime - cr.lastSting > 3) { // sting/bite
          cr.lastSting = this.raceTime;
          car.stungUntil = this.raceTime + 1.6;
          car.damage(2, null);
          if (car === this.player) {
            this.hud.feed(t.T.critters.kind === 'rat' ? 'RAT BITE — SPEED CUT!' : 'SCORPION STING — SPEED CUT!', 'bad');
            this.buzz(30);
          }
        }
        break;
      }
    }

    // ---- avalanche chase wall (final lap) ----
    if (T.chase && this.state === 'race' && !this.freeRoam) {
      const p = this.player;
      if (!this.chaseWall && p.lap >= this.lapsTotal && p.alive) {
        this.chaseWall = { prog: (p.trackIndex - 170 + t.N) % t.N, speed: 30, warned: false };
        this.hud.centerMsg('⚠ AVALANCHE!');
        this.hud.feed('AVALANCHE RELEASED — OUTRUN IT!', 'bad');
        this.buzz([60, 40, 80]);
      }
      const w = this.chaseWall;
      if (w) {
        w.speed = Math.min(58, w.speed + dt * 1.4); // it keeps picking up pace
        w.prog = (w.prog + (w.speed * dt) / t.segLen) % t.N;
        const wp = t.pointAt(Math.floor(w.prog), 0);
        // billowing white front across the whole road width (kept lean:
        // these are the biggest sprites in the game)
        for (let s = 0; s < 2; s++) {
          const latr = (Math.random() - 0.5) * 16;
          const bp = t.pointAt(Math.floor(w.prog), latr);
          this.particles.spawn(bp.x, bp.y + Math.random() * 3, bp.z,
            (Math.random() - 0.5) * 4, 2 + Math.random() * 4, (Math.random() - 0.5) * 4,
            AVA_WHITE, 3.6, 1.1, { drag: 0.2, shrink: 1.6, alpha: 0.8 });
        }
        const gap = (p.trackIndex - Math.floor(w.prog) + t.N) % t.N;
        if (gap < 55 && gap > 4 && (this._avaCd ?? 0) < this.raceTime) {
          this._avaCd = this.raceTime + 3;
          this.hud.feed(`AVALANCHE ${Math.round(gap * t.segLen)}m BEHIND!`, 'bad');
          this.shake = Math.min(1, this.shake + 0.2);
        }
        if (gap <= 4 && p.alive && p.invuln <= 0) { // caught
          p.damage(40, null);
          p.vel.copy(p.forward).multiplyScalar(Math.max(30, Math.hypot(p.vel.x, p.vel.z) + 14));
          p.vy = 8; p.airborne = true;
          this.crashDrama?.();
          this.hud.feed('SWALLOWED BY THE AVALANCHE −40', 'bad');
          w.prog = (p.trackIndex - 120 + t.N) % t.N; // resets behind for another run
        }
        if (this.state !== 'race' || !p.alive) { /* keep rolling; resets clear it */ }
      }
    }
  }

  _clearWorldHazards() {
    for (const f of this.fallers ?? []) {
      f.mesh.parent?.remove(f.mesh);   // parent, not scene — fallers live on worldLayer
      if (f.solid && this.track.solids) {
        const si = this.track.solids.indexOf(f.solid);
        if (si >= 0) this.track.solids.splice(si, 1);
      }
    }
    this.fallers = [];
    this._fallT = 5;
    this.chaseWall = null;
    for (const cr of this.critters ?? []) {
      cr.alive = true;
      cr.mesh.scale.set(1, 1, 1);
      cr.x = cr.baseX; cr.z = cr.baseZ;
    }
    for (const car of [this.player, ...this.enemies]) {
      car.stripLock = null;
      car.stungUntil = 0;
    }
  }

  // ---------- choppers ----------
  /** `intercept` drops the gunship in the player's PATH instead of on a random
   *  bearing. [MISSIONS] SURVIVOR needs it: a chopper tops out at 46 u/s and a
   *  flat-out car does ~55, so one spawned 80 u away on a random bearing can
   *  never close and the whole assault turns into scenery you outrun. An
   *  interceptor lands ahead and off to one side, so the player drives into
   *  gun range and has to actually fight or break the line. */
  _spawnChopper(intercept = false) {
    const p = this.player.pos;
    let pos;
    if (intercept) {
      const f = this.player.forward;
      const s = Math.random() < 0.5 ? -1 : 1;   // alternate shoulders, never head-on
      pos = new THREE.Vector3(p.x + f.x * 46 + f.z * s * 18, 9, p.z + f.z * 46 - f.x * s * 18);
    } else {
      const a = Math.random() * Math.PI * 2;
      pos = new THREE.Vector3(p.x + Math.cos(a) * 80, 9, p.z + Math.sin(a) * 80);
    }
    const ch = new Chopper(this, pos);
    // An interceptor arrives HOT: a fresh gunship idles 2–3 s before its first
    // burst, by which time a flat-out car is 150 u past it and out of range,
    // so an unarmed interceptor is just scenery. Roam spawns keep the wind-up.
    // ...and it must arrive mid-attack-run, not shadowing: gunships now cycle
    // stalk → run → break, and SURVIVOR depends on an interceptor engaging the
    // moment it inserts.
    if (intercept) { ch.fireTimer = 0.35; ch.phase = 'run'; ch.phaseT = 5.0; }
    this.choppers.push(ch);
    this.hud.feed('⚠ ATTACK CHOPPER INBOUND', 'bad');
    this.buzz([40, 30, 40]);
  }

  /** Dig gun nests in beside the circuit. Placed off the racing line but
   *  inside cannon range of it, so they threaten the fast line without ever
   *  blocking it, and spaced around the lap so you meet them one at a time. */
  _buildGunNests() {
    // FREE ROAM HAS NO ENEMIES. Asked for directly: "remove the enemies from
    // free roam." Roam is exploration and destruction-scoring now — the stars,
    // the props, the world — and nothing in it shoots back.
    //
    // This function survives as the AUTOMATIC path and now builds nothing at
    // all, because the automatic path only ever fired for plain roam: a race
    // was excluded by `!this.freeRoam` and every mission by `!this.missionMode`
    // (SURVIVOR calls `_digGunNests` directly, below). Deleting it outright
    // would mean deleting three call sites that also mean "reset the mode
    // furniture" — the level swap, the mode swap and the boot — and one of them
    // is the cleanup that stops roam turrets haunting a rally stage. It keeps
    // the list allocated and does nothing else, so those three sites stay
    // honest without a fourth reader having to know why.
    //
    // The reason the old rule existed is unchanged and worth keeping: combat
    // furniture belongs in the combat modes. Being shot at by scenery you
    // cannot answer is not difficulty, it is noise. Roam has simply joined the
    // rally stage on the other side of that line.
    this.hostiles = this.hostiles || [];
  }

  /** Place n nests around the circuit, off the racing line.
   *
   *  THE ONLY THING THAT DIGS A NEST NOW. It was always the unconditional half
   *  of the pair — `_buildGunNests` carried the mode gate and this carried the
   *  placement — and SURVIVOR has always called it directly, because SURVIVOR
   *  is the one mission that is explicitly an assault rather than a driving
   *  test against a clock. With roam disarmed that direct call is the whole
   *  story: no gate above it fires any more, so anything that wants guns by the
   *  road has to ask for them here, by name. */
  _digGunNests(count) {
    const t = this.track;
    if (!t) return;
    this.hostiles = this.hostiles || [];
    for (let k = 0; k < count; k++) {
      const idx = Math.floor(t.N * ((k + 0.5) / count + Math.random() * 0.08)) % t.N;
      const side = Math.random() < 0.5 ? -1 : 1;
      const p = t.pointAt(idx, side * (17 + Math.random() * 9));
      const y = t.terrainHeight(p.x, p.z);
      this.hostiles.push(new GunNest(this, new THREE.Vector3(p.x, y, p.z)));
    }
  }

  /** Send a raider after the player. Spawns behind and to one side so it
   *  arrives in the mirrors rather than materialising in front of you.
   *
   *  NOTHING CALLS THIS ANY MORE. The roam timer that did was removed when free
   *  roam was disarmed, and it is kept for the same reason `_digGunNests` is:
   *  it is the placement, not the policy, and a mission that wants a car-shaped
   *  hostile should be able to ask for one by name rather than re-derive where
   *  a fair spawn is. Delete it only together with the `Raider` class. */
  _spawnRaider() {
    const p = this.player, f = p.forward;
    const s = Math.random() < 0.5 ? -1 : 1;
    const x = p.pos.x - f.x * 60 + f.z * s * 20;
    const z = p.pos.z - f.z * 60 - f.x * s * 20;
    const y = this.track.terrainHeight(x, z);
    this.hostiles.push(new Raider(this, new THREE.Vector3(x, y, z)));
    this.hud.feed('⚠ RAIDER ON YOUR TAIL', 'bad');
    this.buzz([30, 25, 30]);
  }

  _updateHostiles(dt) {
    // NO RAIDER SPAWNER. It ran on `freeRoam && !missionMode` — plain roam and
    // nowhere else — and plain roam is exploration now. Nothing replaces it:
    // missions that want a hostile spawn it themselves.
    //
    // The step below stays, and must: SURVIVOR's nests are hostiles and they
    // still have to shoot, take damage and be cleared from the list when they
    // die. An empty list simply costs two no-op loops.
    for (const h of this.hostiles) if (h.alive) h.update(dt);
    this.hostiles = this.hostiles.filter((h) => h.alive);
  }

  _updateChoppers(dt) {
    // NO GUNSHIP SPAWNER EITHER, on the same reasoning: the 40-second timer
    // here was gated on `freeRoam && !missionMode`, which is plain roam, and
    // plain roam no longer fights anything.
    //
    // No air support in a plain race, unchanged — a rally is a rally, and
    // "final-lap air support keeps the leaders honest" read as being jumped by
    // a helicopter you never asked to fight on the lap that decides the race.
    //
    // SURVIVOR is untouched. It runs its own escalating spawner out of
    // `_updateMission` (waves, the redeploy on a break of contact, the cap that
    // climbs with the tier) and calls `_spawnChopper(true)` directly, so it
    // never depended on this timer. The step and the sweep below are what keep
    // those gunships flying.
    for (const c of this.choppers) if (c.alive) c.update(dt);
    this.choppers = this.choppers.filter((c) => c.alive);
  }

  onChopperKill() {
    this.kills++;
    this.style?.(0, null); // kill extends the chain
    this.score += 500;
    this.player.nitro = Math.min(1, this.player.nitro + 0.3 * (this.player.nitroRate || 1));
    this.hud.centerMsg('CHOPPER DOWN');
    this.hud.feed('CHOPPER DESTROYED  +500', 'good');
    this.buzz(60);
    if (this.missionMode) this._missionEvent('chopper'); // [MISSIONS]
  }

  // ---------- destructible props ----------
  _updateProps(dt) {
    const cars = [this.player, ...(this.freeRoam ? [] : this.enemies)].filter((c) => c.alive);
    for (let i = this.props.length - 1; i >= 0; i--) {
      const pr = this.props[i];
      for (const car of cars) {
        const dx = car.pos.x - pr.x, dz = car.pos.z - pr.z;
        const rr = pr.r + 2.3;
        if (dx * dx + dz * dz < rr * rr && Math.abs(car.speedAlong) > 2) {
          this.props.splice(i, 1);
          this._smashProp(pr, car);
          break;
        }
      }
    }
    for (let i = this.flyingProps.length - 1; i >= 0; i--) {
      const f = this.flyingProps[i];
      f.life -= dt;
      f.age = (f.age ?? 0) + dt;
      // Heavy chunks are shrapnel: a crate plank or a felled trunk still
      // carrying real speed hurts whatever it lands on (RULES: debris is
      // shrapnel). Straw and cones carry no dmg tag and so never bite.
      if (f.dmg && !f.hit) {
        const v = Math.hypot(f.vel.x, f.vel.y, f.vel.z);
        if (v > 8) {
          const fp = f.mesh.position;
          for (const car of cars) {
            if (car.invuln > 0) continue;
            if (car === f.owner && f.age < 0.45) continue;      // not off your own bumper
            if (this.raceTime < (car._debrisCd ?? 0)) continue; // 0.5s per-car throttle
            const dx = car.pos.x - fp.x, dy = car.pos.y - fp.y, dz = car.pos.z - fp.z;
            if (dx * dx + dy * dy + dz * dz > 4.84) continue;   // 2.2u
            const dmg = f.dmg * THREE.MathUtils.clamp(v / 25, 0.5, 1.2);
            car._debrisCd = this.raceTime + 0.5;
            f.hit = true;
            this.particles.debrisHit?.(car.pos);
            if (car === this.player) {
              // null attacker, not a string: destroy() prints the attacker's
              // name, and 'debris' would read as "WRECKED BY undefined"
              car.damage(dmg, null);
              this.hud.damageFlash(0.35);
              this.buzz(18);
              if (this.raceTime - (this._debrisFeedAt ?? -9) > 2) {
                this._debrisFeedAt = this.raceTime;
                this.hud.feed('DEBRIS HIT', 'bad');
              }
            } else if (f.owner === this.player) {
              this.onEnemyHit(car, dmg, 'debris'); // keeps kill credit
              this.score += 40;
              this.styleBump?.();
              this.hud.feed('DEBRIS STRIKE  +40', 'good');
            } else {
              car.damage(dmg, null);
            }
            break;
          }
        }
      }
      f.vel.y -= 24 * dt;
      f.mesh.position.addScaledVector(f.vel, dt);
      f.mesh.rotation.x += f.spin.x * dt;
      f.mesh.rotation.y += f.spin.y * dt;
      f.mesh.rotation.z += f.spin.z * dt;

      // ---- IT LANDS, AND IT STAYS THERE ----
      //
      // Every piece used to be deleted on a timer, so a smashed tyre stack, a
      // felled tree and a blown-out house all evaporated a couple of seconds
      // after the hit. Nothing you broke was on the track when you came round
      // again, and nothing you broke was ever in anyone else's way.
      //
      // A piece now falls until it meets the ground, bounces off what speed it
      // has left, and comes to rest where it stopped — visible for the whole
      // race and, once settled, a real obstacle for every car (see
      // `game.debris`, read by the car step alongside the standing props).
      const gy = this._debrisGround(f.mesh.position.x, f.mesh.position.z);
      if (f.mesh.position.y <= gy) {
        f.mesh.position.y = gy;
        const speed = Math.hypot(f.vel.x, f.vel.y, f.vel.z);
        if (speed > 4.5 && (f.bounces ?? 0) < 2) {
          // one or two bounces, shedding most of the energy each time — a
          // wheel that lands at 30 u/s does not simply stop dead
          f.bounces = (f.bounces ?? 0) + 1;
          f.vel.y = Math.abs(f.vel.y) * 0.34;
          f.vel.x *= 0.55; f.vel.z *= 0.55;
          f.spin.x *= 0.5; f.spin.y *= 0.5; f.spin.z *= 0.5;
        } else {
          this._settleDebris(f);
          this.flyingProps.splice(i, 1);
        }
      } else if (f.mesh.position.y < -3) {
        // fell out of the world (off a cliff, into a gorge) — nothing to keep
        (f.mesh.parent ?? this.scene).remove(f.mesh);
        this.flyingProps.splice(i, 1);
      }
    }
    this._pushCarsOffDebris();
  }

  /** Destroy every prop within `radius` of (x,z). `credit` gets score/pickups
   *  (weapons pass their owner; explosions with no owner pass null). */
  smashPropsNear(x, z, radius, credit = null, minFling = 16) {
    let n = 0;
    for (let i = this.props.length - 1; i >= 0; i--) {
      const pr = this.props[i];
      const dx = pr.x - x, dz = pr.z - z;
      const rr = radius + pr.r;
      if (dx * dx + dz * dz < rr * rr) {
        this.props.splice(i, 1);
        this._smashProp(pr, credit, minFling);
        n++;
      }
    }
    return n;
  }

  /** SETTLED WRECKAGE PUSHES CARS — and it has to happen HERE, after every
   *  car has finished moving, not inside the car step.
   *
   *  It was inside the step first, next to the standing-prop push-out, and
   *  instrumentation showed it firing correctly on the right frame and setting
   *  the right position — and the car still ended the frame sitting on top of
   *  the wreck, 0.08 u from its centre against the 2.35 u it had just been
   *  moved to. Something later in the step rebuilds the position, so a push
   *  applied mid-step is simply overwritten. Running it once per frame over
   *  the finished positions cannot be undone by anything, and it covers every
   *  car in the field for free.
   */
  _pushCarsOffDebris() {
    if (!this.debris?.length) return;
    const cars = [this.player, ...(this.enemies ?? [])];
    for (const c of cars) {
      if (!c || !c.alive) continue;
      for (const d of this.debris) {
        const dx = c.pos.x - d.x, dz = c.pos.z - d.z;
        const rr = d.r + 1.5;
        if (dx * dx + dz * dz >= rr * rr) continue;
        if (Math.abs((c.y ?? c.pos.y) - d.y) > 4.5) continue;   // on a bridge over it
        const dist = Math.max(0.01, Math.sqrt(dx * dx + dz * dz));
        const nx = dx / dist, nz = dz / dist;
        const vn = c.vel.x * nx + c.vel.z * nz;
        // MASS MATTERS. The first cut repositioned the car out of every piece
        // it touched and killed the closing speed — so a car that drove into
        // two settled tyres wedged between the alternating push-outs and went
        // from 14 u/s to zero, a bollard made of rubber. A loose wheel weighs
        // forty kilos: at speed the CAR wins — it punts the piece away down
        // its own line of travel and pays a slice of momentum for it. Only a
        // crawling car is walled out, because you cannot park inside a wreck.
        if (vn < -6) {
          const kick = Math.min(9, -vn * 0.9 / (d.r * d.r));   // r² as a mass proxy
          d.x -= nx * kick; d.z -= nz * kick;
          d.y = this._debrisGround(d.x, d.z);
          d.mesh.position.set(d.x, d.y, d.mesh.position.z = d.z);
          d.mesh.rotation.y += kick * 0.4;
          c.vel.multiplyScalar(Math.max(0.7, 1 - 0.10 / d.r));  // heavier = costlier
        } else {
          c.pos.x = d.x + nx * rr;
          c.pos.z = d.z + nz * rr;
          if (vn < 0) { c.vel.x -= nx * vn; c.vel.z -= nz * vn; }
        }
        break;
      }
    }
  }

  /** Ground height for a piece of debris, road deck included — a tyre that
   *  lands on the carriageway must sit ON it, not sink to the field beside it,
   *  because the carriageway is exactly where it has to be in the way. */
  _debrisGround(x, z) {
    const t = this.track;
    if (!t?.center?.length) return 0;
    _dv.set(x, 0, z);
    const i = t.nearestIndex(_dv);
    const lat = Math.abs(t.lateralOffset(_dv, i));
    const half = t.widthAt ? t.widthAt(i) : 9;
    if (lat <= half + 1.5 && t.groundHeightAtPos) return t.groundHeightAtPos(_dv, i) + 0.18;
    return (t.terrainHeight ? t.terrainHeight(x, z) : 0) + 0.18;
  }

  /** Park a piece of debris where it stopped: kill its motion, lie it down,
   *  and register a collider so every car has to deal with it for the rest of
   *  the race.
   *
   *  CAPPED, because "stays forever" and "unbounded" are different promises. A
   *  long race through a timber world can smash a lot; past the cap the OLDEST
   *  piece is recycled, which is the one a driver is least likely to be about
   *  to meet. */
  _settleDebris(f) {
    const DEBRIS_MAX = 300;
    const m = f.mesh;
    m.position.y = this._debrisGround(m.position.x, m.position.z);
    // lie flat-ish: a settled object rests on a face, it does not stand on a
    // corner in the middle of the road
    m.rotation.set((Math.random() - 0.5) * 0.5, Math.random() * Math.PI * 2, (Math.random() - 0.5) * 0.5);
    m.castShadow = true;
    if (!m.parent) (this.worldLayer ?? this.scene).add(m);
    const r = Math.max(0.5, (f.r ?? 0.8));
    const entry = { x: m.position.x, z: m.position.z, y: m.position.y, r, mesh: m,
      kind: f.kind ?? 'debris' };
    this.debris.push(entry);
    while (this.debris.length > DEBRIS_MAX) {
      const old = this.debris.shift();
      (old.mesh.parent ?? this.scene).remove(old.mesh);
    }
  }

  _smashProp(pr, car, minFling = 0) {
    const dir = car
      ? new THREE.Vector3(pr.x - car.pos.x, 0, pr.z - car.pos.z).normalize()
      : new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
    const speed = Math.max(minFling, car ? Math.abs(car.speedAlong) : 0);
    // IT MUST COME APART. Flinging the intact mesh made a crate cartwheel away
    // as a whole box with sparks around it — the particles said "shattered"
    // while the object itself said "shoved". So the mesh is broken into pieces
    // that fly on their own paths: same geometry, quarter scale, scattered.
    // Only the first piece carries the damage tag, so shrapnel rules are
    // unchanged (a prop still lands at most one hit).
    const PIECES = 4;
    const base = pr.mesh;
    base.updateMatrixWorld();
    for (let k = 0; k < PIECES; k++) {
      const piece = k === 0 ? base : base.clone();
      piece.position.copy(base.position);
      piece.scale.copy(base.scale).multiplyScalar(0.34 + Math.random() * 0.2);
      // start each fragment offset inside the old silhouette so they read as
      // parts of the thing rather than copies of it
      piece.position.x += (Math.random() - 0.5) * pr.r * 1.2;
      piece.position.y += Math.random() * pr.r * 0.9;
      piece.position.z += (Math.random() - 0.5) * pr.r * 1.2;
      if (k > 0) this.worldLayer.add(piece);
      const spread = 4.5 + Math.random() * 5;
      this.flyingProps.push({
        mesh: piece,
        vel: new THREE.Vector3(
          dir.x * speed * 0.45 + (car ? car.vel.x * 0.4 : 0) + (Math.random() - 0.5) * spread,
          5 + speed * 0.14 + Math.random() * 3.5,
          dir.z * speed * 0.45 + (car ? car.vel.z * 0.4 : 0) + (Math.random() - 0.5) * spread),
        spin: new THREE.Vector3((Math.random() - 0.5) * 16, (Math.random() - 0.5) * 16, (Math.random() - 0.5) * 16),
        life: 1.1 + Math.random() * 0.7,
        dmg: k === 0 ? (DEBRIS_DMG[pr.type] ?? 0) : 0, owner: car, age: 0,
        // the collider it will get once it settles — quarter-scale pieces, so
        // a shattered crate leaves four small obstacles rather than one big one
        r: Math.max(0.45, (pr.r ?? 1.2) * 0.3), kind: pr.type,
      });
    }
    const at = new THREE.Vector3(pr.x, (pr.y ?? 0) + 0.6, pr.z);
    // Crush it in its own material — planks, staves, straw, snow or chips in
    // the prop's own colours. The old generic debris puff made every prop
    // look identical (RULES: crush bursts).
    this.particles.propBurst(at, pr.type, dir, Math.min(1, speed / 30),
      pr.type === 'barrel' ? null : this.track.T?.splinter);
    this.particles.driftSmoke(at);
    this.shake = Math.min(1, this.shake + (car === this.player ? 0.12 : 0.05));
    if (car === this.player) {
      this.score += pr.scoreValue || 25;
      if (this._ct) this._ct.props++; // DEMOLITION contract
      this.styleBump();               // RULES §3: a smash extends the chain
      this.buzz(15);
      if (this.missionMode) this._missionEvent('prop', pr); // [MISSIONS]
      const pl = this.player;
      if (pr.pickup === 'health') {
        pl.health = Math.min(pl.maxHealth, pl.health + 25);
        this.hud.feed('CRATE: +25 HULL', 'good');
        if (pl.health / pl.maxHealth > 0.66) this.restoreCarParts(pl);
      }
      else if (pr.pickup === 'missile') {
        pl.missiles = Math.min(pl.maxMissiles, pl.missiles + 1);
        const belt = Math.round(pl.maxRounds * 0.2);
        pl.rounds = Math.min(pl.maxRounds, (pl.rounds ?? 0) + belt);
        this.hud.feed(`CRATE: +1 MISSILE · +${belt} ROUNDS`, 'good');
      }
      else if (pr.pickup === 'nitro') { pl.nitro = Math.min(1, pl.nitro + 0.35 * (pl.nitroRate || 1)); this.hud.feed('CRATE: NITRO CHARGE', 'good'); }
      else if (pr.pickup === 'mine') { pl.mines = Math.min(pl.maxMines, pl.mines + 1); this.hud.feed('CRATE: +1 MINE', 'good'); }
      else if (Math.random() < 0.35) this.hud.feed(`SMASHED  +${pr.scoreValue || 25}`, 'good');
    }
  }

  /** Tree `tr` goes down: fell it, fling it. `car` rammed it (slowed + hurt);
   *  a null car means a weapon did it — `ox/oz` is then the blast/shot origin. */
  onTreeSmash(tr, car, ox, oz) {
    const mesh = this.track.smashTree(tr);
    if (!mesh) return;
    this.worldLayer.add(mesh);
    const fx = car ? car.pos.x : (ox ?? tr.x - 1), fz = car ? car.pos.z : (oz ?? tr.z - 1);
    const dir = new THREE.Vector3(tr.x - fx, 0, tr.z - fz).normalize();
    const sp = car ? Math.abs(car.speedAlong) : 22;
    // a cactus is pulp, not timber: it bursts and slumps on the spot instead
    // of toppling and rolling away like a felled pine
    const cactus = tr.kind === 'cactus';
    this.flyingProps.push({
      mesh,
      vel: cactus
        ? new THREE.Vector3(dir.x * sp * 0.12, 2.5 + sp * 0.04, dir.z * sp * 0.12)
        : new THREE.Vector3(
          dir.x * sp * 0.35 + (car ? car.vel.x * 0.35 : 0), 5 + sp * 0.12,
          dir.z * sp * 0.35 + (car ? car.vel.z * 0.35 : 0)),
      // pines topple away from the impact with a bit of chaos; cacti barely tip
      spin: cactus
        ? new THREE.Vector3(dir.z * 0.9, (Math.random() - 0.5) * 0.8, -dir.x * 0.9)
        : new THREE.Vector3(dir.z * 3.5 + (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 4, -dir.x * 3.5 + (Math.random() - 0.5) * 2),
      life: cactus ? 0.85 : 2.2,
      // a felled trunk is the heaviest thing in flight; a cactus is pulp
      dmg: cactus ? 0 : DEBRIS_DMG.tree, owner: car, age: 0,
      // A FELLED TREE LIES WHERE IT FELL. The widest collider of the three,
      // because a trunk across a lane is exactly the sort of thing that should
      // still be there when the pack comes round again.
      r: cactus ? 1.2 : 2.4, kind: cactus ? 'cactus' : 'trunk',
    });
    const at = new THREE.Vector3(tr.x, (tr.y ?? 0) + 1, tr.z);
    this.particles.debris(at, cactus ? 2 : 4);
    this.particles.driftSmoke(at);
    this.particles.splinters(at, dir,
      cactus ? [0x4a7a3c, 0x9ac878] : [0x6a4a2a, 0x3e5e30], cactus ? 0.95 : 0.6);
    if (car) car.vel.multiplyScalar(0.82); // trees don't stop you, but they cost real speed
    if (car === this.player) {
      // fix 10: a sapling is a light prop — the speed scrub above is the whole
      // price. (Charged 4 hull before; "TIMBER! +15" read as an award that hurt.)
      this.buzz(18);
      this.shake = Math.min(1, this.shake + 0.15);
    }
    // CORRIDOR §6: the smash class pays 25 and feeds Demolition contracts
    this.score += 25;
    if (car === this.player) this.styleBump();
    if (Math.random() < 0.3) this.hud.feed(cactus ? 'CACTUS SHREDDED  +25' : 'TIMBER!  +25', 'good');
  }

  /** A small stone shunted out of the way: it costs you speed and paint, then
   *  rolls clear and sheds chips. Reported as "rocks should not wreck the car
   *  but damage it and roll / break apart" — before this every stone, however
   *  small, was an immovable wall that could end a race.
   *
   *  The solid is retired immediately (so it cannot be hit twice) and its
   *  instance is thrown clear of the road, tumbled and part-buried, so the rock
   *  you hit is visibly gone from where it was. */
  knockStone(ob, car, impact, dx, dz, square = 1) {
    ob.knocked = true;
    const heft = THREE.MathUtils.clamp((ob.r ?? 0.8) / 1.15, 0.35, 1);
    // ANGLE: punting a stone square-on costs the full figure; catching one with
    // the corner of the bumper flicks it away and barely marks you.
    const glance = square < 0.55;
    // PATCH_02 v1.2 fix 10 (prop tiers): a knockable stone is a light prop —
    // it SHOVES, it does not bill. Hull cost is 0; the price is the speed it
    // scrubs (angle-scaled below) plus the moment of shake. Boulders 1.15 u
    // and up never reach this path — they are static and pay the full
    // contact law in onSolidCrash. (The old line here charged
    // max(3,(impact−9)·0.9·heft) and made a kerb stone a wall with extra
    // steps; recording B lost three hulls to trackside furniture.)
    // …the speed it takes answers the angle too
    car.vel.multiplyScalar(1 - 0.12 * heft * (0.3 + 0.7 * square));
    const at = new THREE.Vector3(ob.x, (ob.y ?? car.pos.y) + 0.4, ob.z);
    this.particles.splinters(at, new THREE.Vector3(dx, 0.3, dz), [0x8a8378, 0x55504a], 0.7);
    this.particles.debris(at, 4 + (impact / 6 | 0));
    this.particles.dust?.(at, 1.1);
    this.audio?.thud?.(glance ? 0.35 : 0.6);
    this.shake = Math.min(1, (this.shake ?? 0) + (glance ? 0.05 : 0.12));
    if (car === this.player) {
      this.buzz(glance ? 14 : 30);
      // CORRIDOR §6 refiled this rock: a knockable stone is the SHOVE class
      // — pushed aside, 0 hull, NO score (v1.2 fix 10 said award Smashed;
      // the corridor's prop table is newer and says shove pays nothing —
      // the smash class and its +25 belong to things that BREAK). The feed
      // stays so the shove reads as the free event it is.
      this.hud.feed(glance ? 'ROCK FLICKED ASIDE' : 'ROCK SHOVED CLEAR', 'info');
    }
    // Hand it to the roller. Snapping the instance to its final spot in one
    // frame was a teleport — the rock appeared to vanish and reappear, which is
    // not what being hit by a car looks like. It tumbles now.
    const im = ob.im;
    if (im && ob.inst !== undefined && im.setMatrixAt) {
      (this._rolling ??= []).push({
        im, inst: ob.inst, sc: (ob.sc ?? 1) * 0.95,
        p: new THREE.Vector3(ob.x, (ob.y ?? car.pos.y) + 0.3, ob.z),
        v: new THREE.Vector3(dx * (5 + impact * 0.30), 2.4 + impact * 0.10,
          dz * (5 + impact * 0.30)),
        // spin axis square to the direction of travel, so it rolls rather than
        // spinning on the spot like a coin
        axis: new THREE.Vector3(-dz, 0.35, dx).normalize(),
        ang: 0, spin: 5 + impact * 0.35, life: 3.2,
      });
    }
    ob.r = 0;                                          // retired from collision
  }

  /** Material-aware SOLID crash (RULES.md §impact model). `ob.mat`:
   *  'stone' — brutal: rock does not care about toy trucks. A full-speed
   *            head-on all but wrecks you.
   *  'hut'   — heavy: the building shrugs, sheds planks/dust, hurts a lot.
   *  'metal' — firm: the old fence-post feel — sparks and moderate damage. */
  onSolidCrash(ob, car, impact, nx, nz, square = 1) {
    car._wallTouchT = 0.3;   // PATCH_02 §3.6
    const n = new THREE.Vector3(nx, 0, nz);
    // ---- ANGLE OF ATTACK. `square` is the share of the car's speed aimed into
    // the surface: 1 = dead-on, 0 = running parallel to it. A sideswipe and a
    // head-on can arrive with the SAME normal speed, and until now that made
    // them the same event — same hull cost, same shake, same hit-stop freeze.
    // They are not the same thing. A brush costs paint and lets you carry your
    // speed through; a square hit stops the car.
    const glance = square < 0.55;
    // RALLY_PATCH_02 §3.2: glancing contact under ~20° (square < 0.34) MUST
    // cost 0 hull — a 199 km/h wall scrape is paint, not 76 hull. Sparks and
    // sound still fire; only the damage line is forgiven.
    const scrapeFree = square < (window.__DRIVING?.patch02?.contactGlanceSquare ?? 0.34);
    // Hull taper. Dead-on (square = 1) is EXACTLY the old figure, so nothing at
    // the heavy end of the model moves; a pure brush pays about half.
    const angleMul = 0.45 + 0.55 * THREE.MathUtils.clamp(square, 0, 1);
    // Sparks throw the way the contact actually throws them: a burst off the
    // face for a real hit, a streak dragged ALONG the rock for a scrape.
    const dir = n.clone();
    if (glance) {
      const tx = -nz, tz = nx;
      const s = Math.sign(car.vel.x * tx + car.vel.z * tz) || 1;
      dir.set(tx * s * 0.9 + nx * 0.3, 0.16, tz * s * 0.9 + nz * 0.3).normalize();
    }
    if (impact > 3 || (glance && impact > 1.5))
      this.particles.sparks(car.pos, dir, Math.min(22, (glance ? 8 : 4) + impact));
    const mat = ob.mat ?? 'metal';
    let dmg = 0;
    if (mat === 'stone') {
      // Stone is brutal — but a knee-high rock at the verge was costing the same
      // 85 hull as a cliff face, which is what turned "clipped a stone" into
      // "race over". Size now scales the ceiling: a 0.6 u kerb stone tops out
      // around 30, a real boulder still all but wrecks you. Anything without a
      // radius (cliffs, mesas, walls) keeps the full figure.
      // 1.4 u and up is a proper boulder and keeps the full figure — the rule
      // that a full-speed head-on all but wrecks a healthy car has to survive
      // this. Only the small stuff at the verge is discounted.
      const r = ob.r ?? 99;
      const heft = THREE.MathUtils.clamp(r / 1.4, 0.34, 1);
      // QUADRATIC IN IMPACT SPEED, because that is what energy is. The old
      // curve was linear, so brushing a wall at 10 u/s still cost a seventh of
      // your hull — and the cliff worlds grind you down by contact rather than
      // by crashes (measured: 53 hull a lap on ROCKFALL RAVINE, all of it wall
      // contact). Squared, a touch costs almost nothing and a real hit is
      // unchanged: the constant is set so a full-speed head-on lands exactly
      // where it did before.
      // LINEAR IN CLOSING SPEED (PATCH_02 v1.1, which corrected its own
      // P2.3): dmg = K·max(0, vN − threshold), so a head-on at 100 km/h is
      // 20 ± 2 and only a 200 km/h head-on reaches the 45 cap. The old
      // quadratic was this game's guess at the same intent; the spec's
      // worked values are now consistent, so the spec wins. `heft` still
      // discounts kerb stones — a knee-high rock is not a cliff.
      const P2 = window.__DRIVING?.patch02 ?? {};
      dmg = !scrapeFree
        ? Math.min((P2.contactDamageCapPerHit ?? 45) * heft,
            (P2.contactDamageK ?? 0.9) * Math.max(0, impact - (P2.contactDamageThresholdMs ?? 5)) * heft)
        : 0;
      if (dmg > 0) {
        this.particles.splinters(car.pos, dir, [0x8a8378, 0x55504a], Math.min(1, impact / 20));
        this.particles.debris(car.pos, Math.min(8, 2 + (impact / 4 | 0)));
        this.particles.driftSmoke(car.pos);
      }
      // A scrape announces itself sooner and quieter: the player has to be able
      // to LEARN the difference, and it can only be learned if it is labelled.
      if (car === this.player && dmg >= (glance ? 5 : 10)) {
        this.hud.feed(glance ? `SIDESWIPED ROCK  −${Math.round(dmg)} HULL`
          : `HIT ROCK  −${Math.round(dmg)} HULL`, 'bad');
        this.shake = Math.min(1, this.shake + (glance ? 0.1 + impact * 0.006 : 0.3 + impact * 0.02));
        this.buzz(glance ? 25 : 60);
        // NEVER hit-stop a graze. Freezing the frame for a third of a second is
        // the single loudest thing the game does, and spending it on a brush is
        // most of why a brush felt like a wreck.
        if (dmg >= 18) { if (glance) this.glanceDrama(); else this.crashDrama(); }
      }
    } else if (mat === 'hut') {
      const P2h = window.__DRIVING?.patch02 ?? {};
      dmg = !scrapeFree
        ? Math.min(P2h.contactDamageCapPerHit ?? 45,
            (P2h.contactDamageK ?? 0.9) * 0.8 * Math.max(0, impact - (P2h.contactDamageThresholdMs ?? 5)))
        : 0;
      if (dmg > 0) {
        // the building crashes big: planks burst off the wall + a dust cloud
        const cols = [0x8a6a42, this.track.T?.hutRoof ?? 0x6a4a2a];
        this.particles.splinters(car.pos, dir, cols, Math.min(1, impact / 16));
        this.particles.debris(car.pos, Math.min(8, 3 + (impact / 5 | 0)));
        this.particles.dust?.(car.pos, 1.2);
        for (let k = 0; k < Math.min(3, 1 + (impact / 10 | 0)); k++) {
          const plank = new THREE.Mesh(PLANK_GEO, plankMat(cols[k % 2]));
          plank.position.set(car.pos.x + nx * 2, car.pos.y + 1 + k * 0.4, car.pos.z + nz * 2);
          this.worldLayer.add(plank);
          this.flyingProps.push({
            mesh: plank,
            vel: new THREE.Vector3(nx * 8 + (Math.random() - 0.5) * 5, 6 + Math.random() * 3,
              nz * 8 + (Math.random() - 0.5) * 5),
            spin: new THREE.Vector3((Math.random() - 0.5) * 9, (Math.random() - 0.5) * 9, (Math.random() - 0.5) * 9),
            life: 1.8,
          });
        }
      }
      if (car === this.player && dmg >= (glance ? 5 : 8)) {
        this.hud.feed(glance ? `CLIPPED THE HUT  −${Math.round(dmg)} HULL`
          : `CRASHED INTO THE HUT  −${Math.round(dmg)} HULL`, 'bad');
        this.shake = Math.min(1, this.shake + (glance ? 0.1 : 0.25 + impact * 0.015));
        this.buzz(glance ? 22 : 45);
        if (dmg >= 18) { if (glance) this.glanceDrama(); else this.crashDrama(); }
      }
    } else {
      dmg = impact > 8 ? Math.min(24, (impact - 8) * 0.9) * angleMul : 0;
      if (car === this.player && dmg >= 5)
        this.hud.feed(glance ? `SCRAPED THE BARRIER  −${Math.round(dmg)} HULL`
          : `WALL SLAM  −${Math.round(dmg)} HULL`, 'bad');
      if (car === this.player && impact > 12 && !glance) {
        this.shake = Math.min(1, this.shake + 0.15 + impact * 0.015);
        this.buzz(30);
      } else if (car === this.player && impact > 12) {
        this.shake = Math.min(1, this.shake + 0.08);
      }
    }
    // RALLY_PATCH_02 §3.2: at most 60 hull per rolling second from the
    // static world — grinding along a canyon must cost speed, not the race.
    if (dmg > 0 && car === this.player) {
      const now = this.raceTime ?? 0;
      if (now - (car._wdmgAt ?? -9) > 1) { car._wdmgAt = now; car._wdmgSum = 0; }
      const room = Math.max(0, 60 - (car._wdmgSum ?? 0));
      dmg = Math.min(dmg, room);
      car._wdmgSum = (car._wdmgSum ?? 0) + dmg;
    }
    if (dmg > 0) car.damage(dmg, null, true);  // raw: the contact law IS the budget
    if (car === this.player && dmg > 0) {
      this.telemetry?.log('damage', { src: mat === 'stone' ? 'rock' : 'wall',
        amount: +dmg.toFixed(1), vNormal: +impact.toFixed(1),
        square: +square.toFixed(2), hullAfter: Math.round(car.health) });
    }
    if (car === this.player) this.audio.scrape();
  }

  /** Big-impact presentation: slow-mo beat + fov punch + red flash. */
  crashDrama() {
    this.hitStop = 0.32;
    this.fovKick = 1;
    this.hud.damageFlash?.(0.9);
  }

  /** …and the sideswipe version. A hard scrape still deserves to be felt, but
   *  it must NOT stop time: you are still moving, and a 0.32 s freeze while
   *  the car is carrying speed past a rock is what made a graze read as a
   *  wreck. Fov punch and flash only — the frame keeps running. */
  glanceDrama() {
    this.fovKick = 0.55;
    this.hud.damageFlash?.(0.45);
  }

  /** Knock a small accessory (bumper, pod, rack…) off `car` — called when its
   *  hull crosses a damage threshold. The piece flies; the car looks beaten. */
  popCarPart(car) {
    const ud = car.mesh.userData;
    const excluded = new Set([...(ud.wheels ?? []), ...(ud.frontWheels ?? [])]);
    const candidates = car.mesh.children.filter((c) => {
      if (!c.visible || !c.isMesh || !c.geometry || excluded.has(c)) return false;
      if (c.material === ud.bodyMat) return false; // never shed the hull itself
      if (c === ud.carLights) return false;        // nor the lamps, as one flying quad
      if (c.userData.vol === undefined) {
        c.geometry.computeBoundingBox();
        const s = c.geometry.boundingBox.getSize(new THREE.Vector3());
        c.userData.vol = s.x * s.y * s.z * (c.scale.x * c.scale.y * c.scale.z || 1);
      }
      return c.userData.vol > 0.001 && c.userData.vol < 0.9;
    });
    if (!candidates.length) return;
    const part = candidates[(Math.random() * candidates.length) | 0];
    part.visible = false;
    (car._popped ??= []).push(part);
    const fly = part.clone();
    part.getWorldPosition(fly.position);
    part.getWorldQuaternion(fly.quaternion);
    this.worldLayer.add(fly);
    this.flyingProps.push({
      mesh: fly,
      vel: new THREE.Vector3(car.vel.x * 0.5 + (Math.random() - 0.5) * 6, 6 + Math.random() * 3,
        car.vel.z * 0.5 + (Math.random() - 0.5) * 6),
      spin: new THREE.Vector3((Math.random() - 0.5) * 12, (Math.random() - 0.5) * 12, (Math.random() - 0.5) * 12),
      life: 1.6,
    });
    this.particles.sparks(car.pos, new THREE.Vector3(0, 1, 0), 8);
  }

  restoreCarParts(car) {
    for (const c of car._popped ?? []) c.visible = true;
    car._popped = [];
  }

  /** Leave a charred, smoking husk where a car was wrecked (fades out ~9s). */
  spawnHusk(car) {
    if (this.husks.length >= 6) return;
    const husk = car.mesh.clone(true);
    this._huskMat ??= new THREE.MeshStandardMaterial({ color: 0x1d1a16, roughness: 1 });
    husk.traverse((o) => { if (o.isMesh) o.material = this._huskMat; });
    husk.position.copy(car.mesh.position);
    husk.rotation.copy(car.mesh.rotation);
    husk.rotation.z += (Math.random() - 0.5) * 0.45; // slumped where it died
    husk.visible = true;
    this.worldLayer.add(husk);
    this.husks.push({ mesh: husk, life: 9, pos: car.pos.clone() });
  }

  _updateHusks(dt) {
    for (let i = this.husks.length - 1; i >= 0; i--) {
      const h = this.husks[i];
      h.life -= dt;
      if (h.life > 3 && Math.random() < 0.25) {
        this.particles.damageSmoke?.(new THREE.Vector3(h.pos.x, h.pos.y + 1, h.pos.z), 0.7);
      }
      if (h.life < 1.5) h.mesh.position.y -= dt * 1.4; // sink away
      if (h.life <= 0) { this.scene.remove(h.mesh); this.husks.splice(i, 1); }
    }
  }

  /** Rammed a BIG tree: the tree wins. Needle shower, real trunk damage. */
  onTreeCrash(tr, car, impact, nx, nz, square = 1) {
    const n = new THREE.Vector3(nx, 0, nz);
    const at = new THREE.Vector3(tr.x, (tr.y ?? 0) + 2.2, tr.z);
    // canopy sheds needles + a couple of cones/branches
    this.particles.splinters(at, n, [0x2a5a30, 0x6a4a2a], Math.min(1, impact / 14));
    this.particles.debris(at, Math.min(5, 2 + (impact / 6 | 0)));
    this.particles.driftSmoke(car.pos);
    // PATCH_02 v1.2: the ONE contact law, trees included — glancing contact
    // under square 0.34 is bark and paint; a real hit pays the linear rate
    // to the same 45 cap the rocks answer to. (Was (impact−5)·1.8 cap 35
    // with no angle term at all: recording B's 145 km/h brush cost 33.)
    const P2t = window.__DRIVING?.patch02 ?? {};
    const scrapeFree = square < (P2t.contactGlanceSquare ?? 0.34);
    let dmg = !scrapeFree
      ? Math.min(P2t.contactDamageCapPerHit ?? 45,
          (P2t.contactDamageK ?? 0.9) * Math.max(0, impact - (P2t.contactDamageThresholdMs ?? 5)))
      : 0;
    // trees draw on the same 60/s world-damage budget as stone (PATCH_02 §3.2)
    if (dmg > 0 && car === this.player) {
      const now = this.raceTime ?? 0;
      if (now - (car._wdmgAt ?? -9) > 1) { car._wdmgAt = now; car._wdmgSum = 0; }
      dmg = Math.min(dmg, Math.max(0, 60 - (car._wdmgSum ?? 0)));
      car._wdmgSum = (car._wdmgSum ?? 0) + dmg;
    }
    if (dmg > 0) car.damage(dmg, null, true);  // raw: the contact law IS the budget
    if (car === this.player && dmg > 0) {
      this.telemetry?.log('damage', { src: 'tree', amount: +dmg.toFixed(1),
        vNormal: +impact.toFixed(1), square: +square.toFixed(2),
        hullAfter: Math.round(car.health) });
    }
    if (car === this.player) {
      this.audio.scrape();
      if (dmg >= 8) this.hud.feed(`HIT A TREE  −${Math.round(dmg)} HULL`, 'bad');
      this.shake = Math.min(1, this.shake + 0.2 + impact * 0.015);
      this.buzz(40);
      if (dmg >= 18) this.crashDrama();
    }
  }

  /** Put rounds into a building. Returns true once it actually comes down, so
   *  the caller knows to stop the projectile either way — a wall you are
   *  chipping still has to eat the bullet. */
  hitBuilding(b, dmg, at, credit = null) {
    if (!b || b.dead) return false;
    b.maxHp = b.maxHp ?? b.hp;
    b.hp -= dmg;
    // dust and chips off the wall on every hit, so shooting one reads as
    // progress long before it falls over
    this.particles.splinters(at ?? new THREE.Vector3(b.x, b.y + b.h * 0.5, b.z),
      new THREE.Vector3(0, 1, 0), [0x9a8a78, b.roofColor ?? 0x8a5a3a], 0.34);
    // A house takes most of a magazine, so without a word of feedback the
    // first burst reads as "bullets do nothing to buildings". Say it once,
    // on the first hit, and again when it is nearly down.
    if (credit === this.player && b.hp > 0) {
      // "WALL HOLDING" was reported as arena text leaking into a race, and the
      // reading is fair: a bare singular "WALL" parses as an objective noun,
      // not as the wall of the house you are shooting. It never was a leak —
      // this is mode-agnostic building feedback on purpose — but the wording
      // invited the bug report, and it now matches its own second stage below.
      if (!b._hinted) { b._hinted = true; this.hud.feed('STRUCTURE HOLDING — KEEP FIRING', 'info'); }
      else if (!b._hinted2 && b.hp < b.maxHp * 0.35) {
        b._hinted2 = true; this.hud.feed('STRUCTURE FAILING', 'good');
      }
    }
    if (b.hp > 0) return false;
    this.onBuildingSmash(b, credit);
    return true;
  }

  /** Level a building: blank the instances, drop the collider, throw the walls
   *  and roof out as debris. Scored like the big trackside kills. */
  onBuildingSmash(b, credit = null) {
    if (!this.track.smashBuilding?.(b)) return;
    const at = new THREE.Vector3(b.x, b.y + b.h * 0.5, b.z);
    // the roof goes up as one slab and the walls come apart into planks
    const cols = [0x9a8a78, b.roofColor ?? 0x8a5a3a];
    for (let k = 0; k < 9; k++) {
      const plank = new THREE.Mesh(PLANK_GEO, plankMat(cols[k % 2]));
      const s = 0.8 + Math.random() * 1.5;
      plank.scale.set(s * (b.w / 8), s, s * 2.2);
      plank.position.set(
        b.x + (Math.random() - 0.5) * b.w * 0.8,
        b.y + 0.6 + Math.random() * b.h,
        b.z + (Math.random() - 0.5) * b.w * 0.8);
      this.worldLayer.add(plank);
      this.flyingProps.push({
        mesh: plank,
        vel: new THREE.Vector3((Math.random() - 0.5) * 16, 6 + Math.random() * 9,
          (Math.random() - 0.5) * 16),
        spin: new THREE.Vector3((Math.random() - 0.5) * 9, (Math.random() - 0.5) * 9,
          (Math.random() - 0.5) * 9),
        life: 2.4,
        r: 1.1, kind: 'rubble',       // the wreck of the house stays on the ground
      });
    }
    this.particles.explosion(at, false);
    this.particles.driftSmoke(at);
    this.audio.explosion(false);
    this.flashLight(at);
    this.shake = Math.min(1, this.shake + 0.22);
    this.hud.feed('BUILDING DOWN', 'good');
    this.score += 120;
    if (credit === this.player) this.buzz(30);
    // Guarded like its siblings. `_missionEvent` early-returns outside a
    // mission anyway, so this is consistency rather than a fix — but it was
    // the only race-side call into the mission bus, which is exactly the shape
    // that makes an auditor suspect a mode leak.
    if (this.missionMode) this._missionEvent?.('prop', { type: 'building' });
  }

  onTireSmash(st, car, ox, oz) {
    const tires = this.track.smashTireStack?.(st);
    if (!tires) return;
    const fx = car ? car.pos.x : (ox ?? st.x - 1), fz = car ? car.pos.z : (oz ?? st.z - 1);
    const dir = new THREE.Vector3(st.x - fx, 0, st.z - fz).normalize();
    const sp = car ? Math.abs(car.speedAlong) : 20;
    for (const tm of tires) {
      this.worldLayer.add(tm);
      this.flyingProps.push({
        mesh: tm,
        // A STACK BURSTS, IT DOES NOT GET SHOVED. Every tyre used to leave on
        // the same vector — straight away from the car — so the wreckage
        // always ended up further off the road than the stack had been, and
        // "hit the tyres and they end up in the road" never happened. A stack
        // struck at speed throws wheels in every direction; the impact
        // direction is a bias on that, not the whole of it.
        vel: new THREE.Vector3(
          dir.x * sp * 0.26 + (Math.random() - 0.5) * 15, 5 + Math.random() * 5,
          dir.z * sp * 0.26 + (Math.random() - 0.5) * 15),
        spin: new THREE.Vector3((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10),
        life: 1.8,
        r: 0.85, kind: 'tire',        // settles as a wheel lying in the road
      });
    }
    const at = new THREE.Vector3(st.x, (st.y ?? 0) + 0.6, st.z);
    this.particles.driftSmoke(at);
    this.particles.debris(at, 3);
    if (car) car.vel.multiplyScalar(0.9);
    if (car === this.player) { this.buzz(15); this.shake = Math.min(1, this.shake + 0.1); }
    this.score += 10;
  }

  onBannerSmash(bn, car, ox, oz) {
    const mesh = this.track.smashBanner?.(bn);
    if (!mesh) return;
    this.worldLayer.add(mesh);
    const fx = car ? car.pos.x : (ox ?? bn.x - 1), fz = car ? car.pos.z : (oz ?? bn.z - 1);
    const dir = new THREE.Vector3(bn.x - fx, 0, bn.z - fz).normalize();
    const sp = car ? Math.abs(car.speedAlong) : 20;
    this.flyingProps.push({
      mesh,
      vel: new THREE.Vector3(dir.x * sp * 0.4, 6 + sp * 0.1, dir.z * sp * 0.4),
      spin: new THREE.Vector3(dir.z * 4, (Math.random() - 0.5) * 5, -dir.x * 4),
      life: 2,
    });
    const at = new THREE.Vector3(bn.x, (bn.y ?? 0) + 1.5, bn.z);
    this.particles.debris(at, 3);
    this.particles.splinters(at, dir, [0x8a8378, 0xe8e2d4], 0.5);
    if (car) {
      car.vel.multiplyScalar(0.85);
      if (car === this.player) {
        this.player.damage(2, null);
        this.buzz(20);
        this.shake = Math.min(1, this.shake + 0.15);
      }
    }
    this.score += 20;
    if (Math.random() < 0.5) this.hud.feed('BILLBOARD DOWN  +20', 'good');
  }

  onBushBrush(bu, car) {
    // once per pass — `|| -9` so the track's lastHit:0 init means "never hit",
    // not "hit at t=0" (which silenced every bush for the first 2s of a race)
    if (this.raceTime - (bu.lastHit || -9) < 2) return;
    bu.lastHit = Math.max(0.001, this.raceTime);
    car.vel.multiplyScalar(0.85); // soft, but it drags
    const at = new THREE.Vector3(bu.x, (bu.y ?? 0) + 0.7, bu.z);
    const col = this.track.bushColor ?? 0x3e6a30;
    this.particles.splinters(at, new THREE.Vector3(0, 1, 0), [col, col], 0.45);
    this.particles.driftSmoke(at);
    if (car === this.player) this.buzz(8);
    this.score += 5;
  }

  /** One blast levels everything breakable in radius: props, trees, tire
   *  stacks, sponsor boards. Used by missiles, mines and the shockwave. */
  blastWorld(x, z, radius, credit = null) {
    this.smashPropsNear(x, z, radius, credit, 22);
    const t = this.track;
    for (const tr of t.trees ?? []) {
      if (tr.dead) continue;
      const dx = tr.x - x, dz = tr.z - z;
      if (dx * dx + dz * dz < (radius + tr.r) * (radius + tr.r)) this.onTreeSmash(tr, null, x, z);
    }
    for (const st of t.tireStacks ?? []) {
      if (st.dead) continue;
      const dx = st.x - x, dz = st.z - z;
      if (dx * dx + dz * dz < (radius + st.r) * (radius + st.r)) this.onTireSmash(st, null, x, z);
    }
    for (const bn of t.banners ?? []) {
      if (bn.dead) continue;
      const dx = bn.x - x, dz = bn.z - z;
      if (dx * dx + dz * dz < (radius + bn.r) * (radius + bn.r)) this.onBannerSmash(bn, null, x, z);
    }
    // ground enemies caught in a blast take it like anything else
    for (const h of this.hostiles ?? []) {
      if (!h.alive) continue;
      const dx = h.pos.x - x, dz = h.pos.z - z;
      const reach = radius + (h.r ?? 2.2);
      if (dx * dx + dz * dz < reach * reach) h.damage(70);
    }
    // a direct missile hit flattens a house outright; a near miss just chips it
    for (const bd of t.buildings ?? []) {
      if (bd.dead) continue;
      const dx = bd.x - x, dz = bd.z - z;
      const reach = radius + bd.r;
      if (dx * dx + dz * dz > reach * reach) continue;
      this.hitBuilding(bd, 150, new THREE.Vector3(x, bd.y + bd.h * 0.5, z), credit);
    }
  }

  // ---------- transient explosion lights ----------
  //
  // THIS WAS THE OTHER FREEZE, and the reason it showed up "when I'm shooting".
  // Every explosion used to construct a new PointLight and add it to the scene.
  // Adding a light changes the light COUNT, and the light count is part of every
  // material's shader cache key — so three threw away the whole scene's programs
  // and recompiled them, on the main thread, mid-explosion. Measured: 18 programs
  // in one render call, 1507 ms of dead screen.
  //
  // It also leaked. The light was added to `worldLayer` and removed from `scene`,
  // and removing a child from a node that is not its parent does nothing, so the
  // lights piled up forever — each one paying the recompile again.
  //
  // Now the lights are a fixed pool, created once, parented to the scene (not the
  // world layer, so a track swap cannot take them). The count never changes, so
  // there is nothing to recompile: a flash is a position and an intensity.
  _initFlashPool(n = 4) {
    this._flashPool = [];
    for (let i = 0; i < n; i++) {
      const l = new THREE.PointLight(0xffa040, 0, 46, 1.8);
      l.userData.life = 0;
      this.scene.add(l);
      this._flashPool.push(l);
    }
  }

  flashLight(pos) {
    const pool = this._flashPool;
    if (!pool || !pool.length) return;
    // a spare light if there is one, otherwise recycle the one closest to done
    let pick = pool[0];
    for (const l of pool) {
      if (l.userData.life <= 0) { pick = l; break; }
      if (l.userData.life < pick.userData.life) pick = l;
    }
    pick.position.copy(pos).setY(3);
    pick.userData.life = 0.35;
    pick.intensity = 60;
  }

  _updateFlashes(dt) {
    for (const l of this._flashPool ?? []) {
      if (l.userData.life <= 0) continue;
      l.userData.life -= dt;
      l.intensity = Math.max(0, l.userData.life / 0.35) * 60;
    }
  }

  /** Tumble the stones that have been knocked loose: gravity, a bounce off the
   *  ground that loses most of its energy, roll-coupled spin, and a rest. Cheap
   *  — it only ever holds the handful of rocks you have actually hit. */
  _updateRolledRocks(dt) {
    const list = this._rolling;
    if (!list || !list.length) return;
    const t = this.track;
    for (let i = list.length - 1; i >= 0; i--) {
      const r = list[i];
      r.life -= dt;
      r.v.y -= 26 * dt;                                   // gravity
      r.p.addScaledVector(r.v, dt);
      const gy = (t?.terrainHeight?.(r.p.x, r.p.z) ?? 0) + r.sc * 0.45;
      if (r.p.y <= gy) {
        r.p.y = gy;
        if (r.v.y < -1.5) { r.v.y *= -0.32; r.v.x *= 0.72; r.v.z *= 0.72; }
        else { r.v.y = 0; r.v.x *= 1 - Math.min(1, 2.6 * dt); r.v.z *= 1 - Math.min(1, 2.6 * dt); }
      }
      const speed = Math.hypot(r.v.x, r.v.z);
      r.ang += (speed > 0.2 ? r.spin * (speed / 8) : 0) * dt;
      _rollQ.setFromAxisAngle(r.axis, r.ang);
      _rollM.compose(r.p, _rollQ, _rollS.set(r.sc, r.sc * 0.78, r.sc));
      r.im.setMatrixAt(r.inst, _rollM);
      r.im.instanceMatrix.needsUpdate = true;
      if (r.life <= 0 || (speed < 0.15 && r.p.y <= gy + 0.01 && r.life < 2.6)) list.splice(i, 1);
    }
  }

  /** Douse every flash — used when a world is torn down mid-flash. */
  _resetFlashes() {
    for (const l of this._flashPool ?? []) { l.userData.life = 0; l.intensity = 0; }
  }

  // ---------- race flow ----------
  resetRace() {
    this.score = 0;
    this.kills = 0;
    this.deaths = 0;
    this.raceTime = 0;
    // v1.5 §11.5 (r310): the stage's derived nitro ceiling, in u/s. gearTop
    // is the SHOWROOM top in displayed km/h (x3.1, the HUD's own unit —
    // the spec's numbers come from recordings of the HUD).
    this._nitroCeilU = nitroCeilingKmh(this.level,
      (this.player?.baseMaxSpeed ?? this.player?.maxSpeed ?? 52) * 3.1) / 3.1;
    this.countdown = 0;
    this.raceOver = false;
    if (this.player) this.player.outOfHulls = false;
    this.playerRank = FIELD;
    this.weapons.reset();
    this.hitStop = 0;
    this.fovKick = 0;
    this.enemySlowUntil = 0;
    this.comboN = 0; this.comboT = 0; this._lastRank = undefined; this._tauntT = -9;
    // race contracts: fresh slate + counters every race (picked in startRace)
    this.contracts = [];
    this.contractCredits = 0;
    this._ct = { props: 0, rivalKills: 0, drafts: 0, bigAirs: 0, closeCalls: 0,
      livestock: 0, comboMax: 1, cleanLaps: 0, weaponFired: false, lapDamaged: false,
      prevHealth: null, prevHeat: 0, prevMissiles: null, prevMines: null, prevShock: 0 };
    this.hud?.setContracts?.([]);
    for (const a2 of this.herds ?? []) { a2.alive = true; a2.mesh.visible = true; a2.x = a2.homeX; a2.z = a2.homeZ; }
    // Stand the world back up. Props, herds, pickups, husks and car parts were
    // already restored here; buildings and trees never were, so a house you
    // flattened in race 1 was still rubble in race 2 of the same session.
    this.track?.restoreSmashed?.();
    this._missionReset?.(); // [MISSIONS] mission state never survives a reset
    this._clearWorldHazards?.();
    for (const h of this.husks) this.scene.remove(h.mesh);
    this.husks.length = 0;
    this.restoreCarParts(this.player);
    for (const e of this.enemies) this.restoreCarParts(e);

    this.player.lap = 1;
    this.player.finished = false;
    this.player.health = this.player.maxHealth;
    this.player.alive = true;
    this.player.mesh.visible = true;
    // PATCH_02 v1.3 fix 8 RE-OPEN, root cause found: `_everCP1` — the flag
    // that arms the line after the first checkpoint — was set in checkLap
    // and NEVER cleared, so it survived into every subsequent race of the
    // session. Race one was silent; race two onward shouted CHECKPOINT
    // MISSED at the grid crossing, which is why the recordings kept
    // catching it (B at 0:06, C at 0:06 — never the session's first race,
    // never reproducible on a fresh boot). Every lap-gate flag resets with
    // the race now, on every car.
    for (const c of [this.player, ...this.enemies]) {
      c._everCP1 = false; c._cpMask = 0; c._midCP = false;
      c._missedCP = false; c._wraps = 0;
    }
    // A RACE STARTS WITH FULL RACKS — capacity is bought once in the garage,
    // not refilled with credits between rounds. applyUpgrades() below sets the
    // maxima; these are filled from them a few lines later, once it has run.
    this.player.nitro = 0.3;
    this.player.shockCooldown = 0;
    this.player.heat = 0;
    this.player.overheated = false;
    this.player.bestLap = Infinity;
    this.player.boostTimer = 0;
    this.applyUpgrades();
    // ...and now the racks are full to whatever the garage just set.
    this.player.rounds = this.player.maxRounds;
    this.player.missiles = this.player.maxMissiles;
    this.player.mines = this.player.maxMines;
    this.player.sos = this.player.maxSos;
    const slot = this.track.gridSlot(0);
    this.player.placeAt(slot.index, slot.lateral);

    this.enemies.forEach((e, i) => {
      e.lap = 1;
      e.finished = false;
      e.health = e.maxHealth;
      e.alive = true;
      e.mesh.visible = true;
      e.boostTimer = 0;
      e._launchHold = e._launchReaction ?? 0;   // §5.5: a restart re-arms the lights
      const s = this.track.gridSlot(i + 1);
      e.placeAt(s.index, s.lateral);
    });
    for (const p of this.pickups) { p.active = true; p.mesh.visible = true; }
    this.track.setLights('red');

    // choppers + destructible props back to pristine
    for (const c of this.choppers) if (c.alive && c.mesh) this.scene.remove(c.mesh);
    this.choppers = [];
    this._raceChopper = false;
    this.chopperTimer = 15;
    for (const f of this.flyingProps) this.scene.remove(f.mesh);
    this.flyingProps = [];
    // A NEW RACE STARTS ON A CLEAN ROAD. The wreckage persists for the whole
    // race, which is the point of it — but restarting means restarting, and
    // the props and buildings are being stood back up on the next few lines.
    for (const d of (this.debris ?? [])) (d.mesh.parent ?? this.scene).remove(d.mesh);
    this.debris = [];
    if (this.track.props) {
      this.props = [...this.track.props];
      for (const p of this.props) {
        if (!p._orig) p._orig = { pos: p.mesh.position.clone(), rot: p.mesh.rotation.clone(), scale: p.mesh.scale.clone() };
        p.mesh.position.copy(p._orig.pos);
        p.mesh.rotation.copy(p._orig.rot);
        p.mesh.scale.copy(p._orig.scale);
        if (!p.mesh.parent) this.worldLayer.add(p.mesh);
      }
    }
  }

  startRace() {
    // DEBUG TELL: which world is this frame from. Every screenshot report so
    // far has had to be attributed by its palette, its contract slate or its
    // camera height — one was chased across four wrong levels before its
    // contracts gave it away. The build tag already survives every screenshot,
    // so the stage rides with it.
    {
      const bt = document.getElementById('build-tag');
      if (bt) {
        bt.dataset.rev ??= bt.textContent;
        bt.textContent = `${bt.dataset.rev} · ${this.level?.name ?? '?'}`;
      }
    }
    this._menuIdle();      // the shop floor stops turning the moment you leave it
    this._flushPick?.();   // a tapped card whose build hasn't run yet — build it now
    // NO GATE — A WARNING WITH A NUMBER ON IT. The start line used to refuse
    // the wrong tyres outright, and with one eligible car per surface that
    // collapsed the roster into one car per trail. You now take the start on
    // anything; the physics prices the mismatch, and this pair of lines makes
    // sure you knew before the lights went out.
    if (!this.freeRoam) {
      const f = this.carFitness(this.level.id);
      if (f && !f.ok) {
        this.hud.feed(`${TYRE_LABEL[f.have]} TYRES ON A ${SURFACE_LABEL[f.need]} STAGE `
          + `— GRIP −${f.pen}%`, 'bad');
        if (f.fix && f.fix.text) this.hud.feed(f.fix.text, 'info');
        // ...and if the road is slick as well as the wrong class, say the OTHER
        // thing that can now happen to you, because a car being written off for
        // sitting still is only fair if it was announced first.
        if (f.under > 0 && surfaceSlick(this.level) > 0) {
          this.hud.feed('DIG IN ON THESE AND THE CAR IS WRITTEN OFF — KEEP IT ROLLING', 'bad');
        }
      }
    }
    this.audio.start();
    document.getElementById('title-screen').classList.add('hidden');
    this.hud.show();
    document.getElementById('touch-ui').classList.add('on');
    if (this.input.resetJoystick) this.input.resetJoystick(); // zone has real bounds only once visible
    // every race starts with the rescue in hand — a cooldown must never
    // carry across a restart, or a retry begins already punished
    this.player.unstuckCool = 0;
    // ...with full racks, and with all three hulls. Same argument each time,
    // and the same trap: startRace() is the player-facing entry and does NOT
    // call resetRace() in this order, so anything reset only there is never
    // reached on a retry.
    this.applyUpgrades();
    this.player.rounds = this.player.maxRounds;
    this.player.missiles = this.player.maxMissiles;
    this.player.mines = this.player.maxMines;
    this.player.sos = this.player.maxSos;
    this.deaths = 0;
    this.raceOver = false;
    this.player.outOfHulls = false;
    this.state = 'countdown';
    this.countdown = 3.6;
    // §5.2 (r313): the pressure lease starts vacant every race
    this._pressureRival = null;
    this._pressurePickedLap = 0;
    // §5.4 (r313): so do the target tokens. Leases expire against raceTime,
    // so a lease granted late in race N (until ≈ 90) read as LIVE for all of
    // race N+1's early window after a restart — two stale tokens beat the
    // early cap of one (caught by the acceptance harness's restart loop).
    this._aggro = [];
    // PATCH_02 §3.1: NOBODY DIES ON THE GRID. The recording lost 26 hull
    // before the car ever moved. Every car is invulnerable and weapon-locked
    // from grid spawn to GO + 1.5 s; rivals may not make the player their
    // target until GO + 4 (see aiCanTarget).
    this.player.invuln = Math.max(this.player.invuln ?? 0, this.countdown + 1.5);
    for (const e of this.enemies ?? []) e.invuln = Math.max(e.invuln ?? 0, this.countdown + 1.5);
    // CORRIDOR: arm every car at gate 0 (the line) — shadow counters only
    if (this.route) for (const c of [this.player, ...this.enemies]) this.route.reset(c);
    this._lastCount = 4;
    this.player.lapStart = 0;
    this.hud.feed(`${this.level.name} — LEVEL ${this.level.id}`, 'info');
    if (!this.freeRoam) {
      // contracts run in RACE only — roam money stays pure destruction rate
      this.contracts = this._pickContracts();
      // THE JOB RIDES WITH THEM, and only on the world it names. Slotting it
      // into the same list is what buys it the per-frame progress, the lap and
      // finish hooks and the HUD row without a second copy of any of them —
      // `job: true` is the only thing that tells them apart, and it is read in
      // exactly one place (`_completeContract`).
      const jc = this._jobContract();
      if (jc) this.contracts.unshift(jc);
      this.hud.setContracts?.(this.contracts, this._ct);
      // …and the grid is told how hard to lean on an underprepared driver
      const kitGap = 1 - this.kitReady();
      for (const e of this.enemies) {
        e.aggression = (e.baseAggression ??= e.aggression) * (1 + 0.9 * kitGap);
      }
      // ...and the world takes back the exact part you did not bring. This is
      // what turns the padlock on the card from a label into a lock: it names
      // a part, and racing without it is measurably a different car. Applied
      // AFTER applyUpgrades() so it multiplies the finished figures, and never
      // stored — the next applyUpgrades() rebuilds them from the garage.
      const kp = this.kitPenalties();
      const p = this.player;
      p.gripBoost = (p.gripBoost ?? 1) * kp.grip;
      p.cannonDamage *= kp.cannon;
      p.nitroRate *= kp.nitro;
      p.maxSpeed *= kp.speed;
      p.maxHealth = Math.round(p.maxHealth * kp.hull);
      p.health = p.maxHealth;
      if (kp.dampers) p.damperLvl = 0;   // the springs this world wanted, gone
      this._warnKit();
    }
    if (this.missionMode) { // [MISSIONS] structured arena challenge, no grid
      this._missionLaunch();
    } else if (this.freeRoam) {
      // no grid, no countdown, and since the roam spawners were removed, no
      // gunships and no raiders either — the world is yours, full stop
      this.state = 'race';
      this.startScore = this.score;
      this.track.setLights('green');
      this.hud.centerMsg('EXPLORE!');
      // ...so the opening line no longer promises a fight that will not arrive
      this.hud.feed('SMASH EVERYTHING · FIND THE STARS', 'info');
      for (const e of this.enemies) { e.alive = false; e.mesh.visible = false; }
      this.chopperTimer = 15;
    }
  }

  onPlayerLap() {
    if (this.missionMode) { this._missionEvent('lap'); return; } // [MISSIONS]
    if (this.freeRoam) { this.score += 100; return; }
    const p = this.player;
    // contracts that resolve at lap boundaries (lap p.lap-1 just completed) —
    // BEFORE the finish branch so a clean final lap still counts
    this._lapContracts(p.lap - 1);
    if (p.lap > this.lapsTotal) { this.finishRace(); return; }
    const lapTime = this.raceTime - p.lapStart;
    p.lapStart = this.raceTime;
    if (p.lap >= 2) {
      // announce only a lap that BEAT one, not the first timed lap of the
      // race — lap 2's time is always "the best so far" and saying so is noise
      const beat = Number.isFinite(p.bestLap) && lapTime < p.bestLap;
      if (lapTime < p.bestLap) p.bestLap = lapTime;
      if (beat) this.hud.feed(`★ BEST LAP — ${fmtTime(lapTime)}`, 'good');
    }
    this.score += 500;
    this.audio.lap();
    if (p.lap === this.lapsTotal) {
      this.hud.centerMsg('FINAL LAP!');
      if (this.difficulty.id !== 'easy') this.hud.feed('⚠ AIR SUPPORT EXPECTED', 'bad');
    } else {
      this.hud.centerMsg(`LAP ${p.lap}`);
    }
    this.hud.feed(`LAP ${p.lap - 1} — ${fmtTime(lapTime)}  +500`, 'good');
  }

  onEnemyHit(enemy, dmg, source) {
    const killed = enemy.damage(dmg, this.player);
    this.audio.hit();
    if (killed) {
      this.kills++;
      if (this._ct) this._ct.rivalKills++; // HEADHUNTER contract
      this.style?.(0, null); // kill extends the chain
      this.score += 250;
      this.player.nitro = Math.min(1, this.player.nitro + 0.25 * (this.player.nitroRate || 1));
      this.buzz(45);
      this.hud.centerMsg('DESTROYED');
      this.hud.feed(`${enemy.name} DESTROYED  +250`, 'good');
      this.shake = Math.min(1, this.shake + 0.5);
    } else if (source === 'missile') {
      this.shake = Math.min(1, this.shake + 0.2);
    }
  }

  onPlayerHit(dmg, attacker) {
    this.player.damage(dmg, attacker);
    this.hud.damageFlash(0.45);
    this.audio.hit();
    this.buzz(25);
  }

  /** Haptic tick on supported touch devices. */
  buzz(pattern) {
    if (this.isTouch && navigator.vibrate) navigator.vibrate(pattern);
  }

  onPlayerDestroyed(attacker) {
    this.deaths++;
    this.score = Math.max(0, this.score - 300);
    this.buzz([70, 40, 70]);
    this.shake = 1;
    this.hud.damageFlash(1.2);
    if (this.missionMode) { // [MISSIONS] — one hull, its own rule
      this.hud.centerMsg('WRECKED');
      this.hud.feed(attacker ? `WRECKED BY ${attacker.name}  −300` : 'WRECKED  −300', 'bad');
      this._missionEvent('wrecked');
      return;
    }
    // ---- the three-hull rule ----
    const counts = !this.freeRoam && (this.state === 'race' || this.state === 'countdown');
    const left = HULL_LIVES - this.deaths;
    if (counts && left <= 0) {
      this.hud.centerMsg('DESTROYED');
      this.hud.feed(attacker ? `WRECKED BY ${attacker.name} — NO HULLS LEFT` : 'WRECKED — NO HULLS LEFT', 'bad');
      this._raceOver(attacker);
      return;
    }
    this.hud.centerMsg('WRECKED');
    this.hud.feed(attacker ? `WRECKED BY ${attacker.name}  −300` : 'WRECKED  −300', 'bad');
    if (counts) {
      this.hud.feed(`${left} HULL${left === 1 ? '' : 'S'} LEFT — THEN THE RACE IS OVER`,
        left === 1 ? 'bad' : 'info');
      this.buzz([70, 40, 70, 40, 70]);
    }
  }

  /** OUT OF HULLS. Not a finish — nothing is banked, no place is recorded, no
   *  star is awarded and the world keeps whatever best it already had. The
   *  results card is reused because it is the screen that already knows how to
   *  offer RACE AGAIN and BACK TO GARAGE, but it is dressed as what this is.
   *
   *  Deliberately NOT routed through finishRace(): that function writes to
   *  `career.finished`, pays credits and rolls contracts and feats. Being
   *  destroyed out of the race must reward none of it, or the three-hull rule
   *  is a slower way to collect the same prize. */
  _raceOver(attacker) {
    if (this.state === 'finished') return;
    this.state = 'finished';
    this.player.finished = true;
    this.player.outOfHulls = true;      // stops the respawn tick in PlayerCar.update
    this.raceOver = true;               // read by the HUD and by the results dressing
    for (const e of this.enemies) e.finished = true;
    document.getElementById('result-place').textContent = 'DESTROYED';
    document.getElementById('r-score').textContent = this.score.toLocaleString();
    document.getElementById('r-kills').textContent = this.kills;
    document.getElementById('r-time').textContent = fmtTime(this.raceTime);
    document.getElementById('r-best').textContent = fmtTime(this.player.bestLap);
    document.getElementById('r-credits').textContent = '+0';
    const sp = document.getElementById('star-panel');
    if (sp) sp.style.display = 'none';
    const box = document.getElementById('credit-breakdown');
    const rowsEl = document.getElementById('cb-rows');
    if (box && rowsEl) {
      // Say WHY nothing was paid, in the place the payout normally appears.
      // A silent +0 reads as a bug; an itemised zero reads as a rule.
      rowsEl.innerHTML =
        `<div class="cb-row missed"><span>✗ HULLS SPENT</span><b>${HULL_LIVES} / ${HULL_LIVES}</b></div>`
        + `<div class="cb-row missed"><span>✗ RACE NOT FINISHED</span><b>—</b></div>`
        + `<div class="cb-row missed"><span>✗ NO CREDITS, NO STARS</span><b>—</b></div>`
        + `<div class="cb-row total"><span>RUN THE TRACK AGAIN</span><b>+0</b></div>`;
      box.style.display = '';
    }
    document.querySelector('#results .game-sub').textContent =
      `${this.level?.name ?? 'RACE'} — WRECKED OUT${attacker ? ` BY ${attacker.name}` : ''}`;
    const nextBtn = document.getElementById('next-level-btn');
    if (nextBtn) nextBtn.style.display = 'none';
    const again = document.getElementById('restart-btn');
    if (again) again.textContent = 'RESTART TRACK';
    this.audio?.explosion?.(true);
    setTimeout(() => {
      if (this.state !== 'finished') return;   // left already — don't pop over the menu
      this._announcePartUnlocks();   // [PARTS] a part the race just opened
      document.getElementById('results').classList.remove('hidden');
      this.hud.hide();
      document.getElementById('touch-ui').classList.remove('on');
    }, 1900);
  }

  finishRace() {
    this.state = 'finished';
    this.player.finished = true;
    const rank = this.playerRank;
    // THE LINE DESERVES A MOMENT. Crossing it used to be 1.6 silent seconds
    // and then a form: no banner, no beat, nothing on the track — the game's
    // biggest event presented smaller than a sideswipe (crashDrama gives a
    // wall tap slow-mo and a flash). So: the placing announced in the same
    // centre pop the countdown uses, a short slow beat — hitStop WITHOUT the
    // damage flash, this is not a crash — and, for a podium, confetti raining
    // over the car for the whole gap before the results card (see _festT in
    // the update loop). The gap itself stretches to 2.6 s on a podium so the
    // moment is watchable; a mid-field finish keeps the brisk 1.6.
    this.hud.centerMsg(rank === 1 ? 'YOU WIN!' : `FINISH — ${ordinal(rank)}`);
    this.hitStop = Math.max(this.hitStop, 0.38);
    this.fovKick = Math.max(this.fovKick ?? 0, 0.5);
    this._festT = rank <= 3 ? 2.4 : 0;
    if (rank <= 3) this.particles.confetti(this.player.pos, 40);
    // The finish bonus was a six-entry table for a six-car grid, so with eight
    // on the line 7th and 8th both fell through to a flat 100. The old table
    // was very close to a geometric decay from 2000 to 150 — 2000·0.075^r fits
    // it to within 10 % at every entry — so that is what it is now, stretched
    // across whatever FIELD holds. A win still pays 2000 and last still pays
    // 150; the two new places land inside the curve instead of off the end.
    const bonus = Math.round(2000 * (150 / 2000) ** ((rank - 1) / Math.max(1, FIELD - 1)) / 10) * 10;
    this.score += bonus;
    const sfx = ordinal(rank);
    document.getElementById('result-place').textContent = sfx;
    document.getElementById('r-score').textContent = this.score.toLocaleString();
    document.getElementById('r-kills').textContent = this.kills;
    document.getElementById('r-time').textContent = fmtTime(this.raceTime);
    document.getElementById('r-best').textContent = fmtTime(this.player.bestLap);

    // career progress + credits — the economy pays for risk and results:
    // race score scaled by difficulty, plus podium and first-conquest bonuses
    const prev = this.career.finished[this.level.id];
    const diffMult = { easy: 0.7, normal: 1.0, hard: 1.5 }[this.difficulty.id] ?? 1;
    const podium = rank <= 3 ? PODIUM_CR[rank - 1] : 0;
    const firstClear = (!prev || prev.place > 3) && rank <= 3 ? FIRST_CLEAR_CR : 0;
    const raceScore = Math.max(0, this.score - (this.startScore ?? 0));
    // finish-line contracts resolve now (UNTOUCHABLE / PACIFIST / HERDSMAN /
    // PODIUM ON HARD), then the whole contract pot rides into `earned`
    this._checkFinishContracts(rank);
    // …and the world's own feats, which pay into the same pot
    this._checkFeats(rank);
    // …and the long chains, which are the only thing here that pays a PART
    const questsWon = this._checkQuests(rank);
    const contractCr = this.contractCredits ?? 0;
    // Driving clean and sweeping all three contracts were stars in the first
    // cut of this system; they pay CREDITS instead, because the star ladder
    // cannot carry a 5x spread between an ace and a finisher (see starsFor).
    // Credits can: nothing is gated on them.
    const cleanCr = (this.deaths ?? 0) === 0 ? CLEAN_RUN_CR : 0;
    // THE SWEEP IS THE THREE CONTRACTS, and a job is not one of them. r181
    // unshifted the held job into this same list to reuse its plumbing, which
    // quietly made taking a job cost you the 600 CR sweep bonus whenever the
    // job itself was the thing you missed — a penalty for accepting work.
    const slate = (this.contracts ?? []).filter((c) => !c.job);
    const sweepCr = slate.length > 0 && slate.every((c) => c.done) ? SWEEP_CR : 0;
    const raceCr = Math.round(raceScore * CREDIT_RATE * diffMult);
    const earned = raceCr + podium + firstClear + contractCr + cleanCr + sweepCr;
    document.getElementById('r-credits').textContent = `+${earned.toLocaleString()}`;
    if (podium) this.hud.feed(`PODIUM BONUS  +${podium} CR`, 'good');
    if (firstClear) this.hud.feed(`WORLD CONQUERED  +${FIRST_CLEAR_CR} CR`, 'good');
    if (diffMult !== 1) this.hud.feed(`${this.difficulty.id.toUpperCase()} PAYS ×${diffMult} CREDITS`, 'info');
    // itemized credits breakdown on the results screen
    {
      const box = document.getElementById('credit-breakdown');
      const rowsEl = document.getElementById('cb-rows');
      if (box && rowsEl) {
        let html = `<div class="cb-row"><span>RACE SCORE${diffMult !== 1 ? ` ×${diffMult}` : ''}</span><b>+${raceCr.toLocaleString()}</b></div>`;
        if (podium) html += `<div class="cb-row"><span>PODIUM — ${sfx}</span><b>+${podium}</b></div>`;
        if (firstClear) html += `<div class="cb-row"><span>FIRST CONQUEST</span><b>+${firstClear}</b></div>`;
        for (const q of questsWon) {
          const part = UPGRADES.find((u) => u.key === q.reward.part)?.name ?? q.reward.part;
          html += `<div class="cb-row contract"><span>🏆 QUEST ${q.name} — FREE ${part}</span>`
            + `<b>+${q.reward.cr}</b></div>`;
        }
        if (cleanCr) html += `<div class="cb-row"><span>CLEAN RUN — NO WRECKS</span><b>+${cleanCr}</b></div>`;
        if (sweepCr) html += `<div class="cb-row"><span>CLEAN SWEEP — ALL CONTRACTS</span><b>+${sweepCr}</b></div>`;
        for (const c of this.contracts ?? []) {
          // A MISSED JOB IS NOT A LOST JOB. A bare "✗ JOB · CLEAN SWEEP —"
          // reads as forfeited, when in fact it is still in hand and RACE
          // AGAIN is the retry — so the row says so.
          html += c.done
            ? `<div class="cb-row contract"><span>✓ ${c.label}</span><b>+${c.pay}</b></div>`
            : `<div class="cb-row missed"><span>✗ ${c.label}${
  c.job ? ' — STILL YOURS, RACE AGAIN' : ''}</span><b>—</b></div>`;
        }
        html += `<div class="cb-row total"><span>TOTAL CREDITS</span><b>+${earned.toLocaleString()}</b></div>`;
        rowsEl.innerHTML = html;
        box.style.display = '';
      }
    }
    this.garage.credits += earned;
    saveJSON(this._pkey('garage'), this.garage);
    // ---- RALLY STARS: what this run was worth, against your best here so far
    const runStars = this.starsIn(rank);
    const hadStars = this.starsFor(prev);
    const bestStars = Math.max(runStars, hadStars);
    const starsBefore = this.totalStars();
    // Which chapter stood open BEFORE this result was banked. `_showStars`
    // compares it with the state afterwards, which is the only honest way to
    // say "this race opened a chapter" — a star total cannot, now that the
    // gate is a fraction of one chapter rather than a price per world.
    const chapBefore = this.currentChapter();
    // THE LAP RECORD IS PART OF THE RECORD. The PACE NOTE job ("set a lap
    // under your own best") gates on `career.finished[id].bestLap` — and this
    // write never stored it, so the one job whose target is the player's own
    // history could never be posted, on any world, since the day it was
    // written. Stored rounded to a tenth, 0 meaning "no lap yet" (Infinity
    // does not survive JSON).
    const lapRec = Math.min(prev?.bestLap || Infinity,
      Number.isFinite(this.player.bestLap) ? this.player.bestLap : Infinity);
    if ((prev?.bestLap || 0) > 0 && lapRec < prev.bestLap) {
      this.hud.feed(`★ LAP RECORD — ${fmtTime(lapRec)}`, 'good');
      document.getElementById('r-best').textContent += '  ★ RECORD';
    }
    this.career.finished[this.level.id] = {
      place: Math.min(rank, prev?.place ?? 99),
      bestScore: Math.max(earned, prev?.bestScore ?? 0),
      bestLap: Number.isFinite(lapRec) ? Math.round(lapRec * 10) / 10 : 0,
      stars: bestStars,
    };
    saveJSON(this._pkey('career'), this.career);
    this._showStars(bestStars, hadStars, starsBefore, rank, chapBefore);
    this.renderGarage();
    const hasNext = this.levelIndex < LEVELS.length - 1;
    const nextUnlocked = hasNext && this.isLevelUnlocked(LEVELS[this.levelIndex + 1].id);
    if ((!prev || prev.place > 3) && rank <= 3 && hasNext) {
      this.hud.feed(`${LEVELS[this.levelIndex + 1].name} UNLOCKED`, 'good');
    }
    // (the placing banner at the top of this function is the centre pop now —
    // a plain 'FINISH' here overwrote it the same frame it was shown)
    this.audio.lap();
    document.querySelector('#results .game-sub').textContent = `${this.level.name} COMPLETE`;
    // _raceOver relabels this button to RESTART TRACK; a real finish is a race
    // you may repeat, not one you must, so put the word back.
    const again = document.getElementById('restart-btn');
    if (again) again.textContent = 'RACE AGAIN';
    const nextBtn = document.getElementById('next-level-btn');
    if (nextUnlocked) {
      nextBtn.style.display = '';
      nextBtn.textContent = `NEXT: ${LEVELS[this.levelIndex + 1].name} ▶`;
    } else {
      nextBtn.style.display = 'none';
    }
    setTimeout(() => {
      // Guard like the mission debrief already does. Without it, leaving the
      // podium inside this 1.6 s window — restart, or straight to the garage —
      // let the results card pop back up OVER the menu you had just reached.
      if (this.state !== 'finished') return;
      this._announcePartUnlocks();   // [PARTS] a part the race just opened
      document.getElementById('results').classList.remove('hidden');
      this.hud.hide();
      document.getElementById('touch-ui').classList.remove('on');
    }, rank <= 3 ? 2600 : 1600);
  }

  /** The star panel on the results screen: which of the five you took, what
   *  your best on this world now is, and — the part that makes a star mean
   *  something — exactly which worlds the new total just opened. */
  _showStars(best, had, before, rank, chapBefore = 0) {
    const box = document.getElementById('star-panel');
    const rowsEl = document.getElementById('sp-rows');
    if (!box || !rowsEl) return;
    // THE SAME WORDS AS THE MENU LEGEND, tier by tier. The reported mismatch:
    // a P6 (dead last) banked a star under a menu that reads like stars are
    // competitive rewards. The award is BY DESIGN — a finish always pays, and
    // the chapter floor in `isChapterOpen` guarantees the career cannot stall
    // on top of that — so the words on BOTH surfaces now say so explicitly.
    const got = [['FINISH — ANY PLACE', rank > 0], ['PODIUM — TOP 3', rank <= 3], ['WIN', rank === 1]];
    let html = '';
    for (const [label, won] of got) {
      html += `<div class="cb-row${won ? '' : ' missed'}"><span>${won ? '★' : '☆'} ${label}</span><b>${won ? '+1' : '—'}</b></div>`;
    }
    const now = this.totalStars();
    const gained = now - before;
    html += `<div class="cb-row total"><span>${best > had ? `NEW BEST HERE — ${best}/3` : `BEST HERE — ${best}/3`}</span><b>${gained > 0 ? `+${gained}★` : 'NO GAIN'}</b></div>`;
    // WHAT DID THAT BUY? A CHAPTER, OR PROGRESS TOWARD ONE.
    //
    // This used to diff the per-world price table across the new star total,
    // which was exactly right while worlds had prices. Under chapters the only
    // thing a race can open is the next chapter, so the panel compares the
    // chapter that stood open before the result was banked with the one that
    // stands open now — and when nothing opened, says how far the gate is in
    // the chapter's own terms, including the "race them all" route.
    const chapNow = this.currentChapter();
    const chs = this.chapters();
    if (chapNow > chapBefore) {
      for (let k = chapBefore + 1; k <= chapNow; k++) {
        const c = chs[k];
        if (!c) continue;
        html += `<div class="cb-row contract"><span>✓ CHAPTER ${c.n} OPEN — ${c.name}</span>`
          + `<b>${c.levels.length} WORLDS</b></div>`;
        this.hud.feed(`CHAPTER ${c.n} — ${c.name} UNLOCKED`, 'good');
      }
    } else {
      const gate = this.chapterGateLine();
      const nx = chs[chapNow + 1];
      if (gate && nx) {
        const left = Math.max(0, this.chapterNeed(chapNow) - this.chapterStars(chapNow));
        html += `<div class="cb-row"><span>NEXT CHAPTER — ${nx.name}</span>`
          + `<b>${left}★ TO GO</b></div>`;
      }
    }
    document.getElementById('sp-total').textContent = `${now}★`;
    rowsEl.innerHTML = html;
    box.style.display = '';
  }

  _updateRank() {
    let rank = 1;
    for (const e of this.enemies) if (e.progress > this.player.progress) rank++;
    this.playerRank = rank;
  }

  /** CORRIDOR step 1 — build the route for this world. Pure data + math:
   *  CLAUDE.md v1.2 §3.5 erased the ribbon, so the course polyline is never
   *  rendered — gates, AI and telemetry are its only consumers. */
  _buildRoute() {
    this.route = new Route(this.track, this.level?.id);
  }

  /** CORRIDOR steps 1+4 — the route observes every car, and since r301 it
   *  also OWNS the miss: a player who leaves the next gate behind gets the
   *  arrow for missedGateGraceS (a near-miss stays recoverable by driving),
   *  then returnToGate. Laps are still counted by the checkpoint mask —
   *  the return makes cut laps physically rare instead of scolded. */
  _stepRoute() {
    if (!this.route || this.freeRoam || this.missionMode) return;
    // CORRIDOR §6: the obstacle ration runs ONCE per build, on the first
    // race frame — at _buildRoute time the prop lists are still filling
    // (measured: the pass saw 1 of Canyon's 62 corridor obstacles from the
    // constructor), and racing is where the corridor exists. Roam keeps
    // the full scenery on purpose: out there the world is the point.
    if (!this.track._densityDone) {
      this.track._densityDone = true;
      this.track.applyRouteDensity?.(this.route);
      // v1.5 §11 (r310): the stage validator runs on the same first race
      // frame — same reason (the prop lists fill late), same world state
      // the race will actually be run on. Auto-fixes apply; the rest is
      // logged as stageViolation for the generator round (§13.3).
      try { runStageValidator(this); } catch (e) { console.warn('[stagecheck]', e); }
    }
    for (const car of [this.player, ...this.enemies]) {
      if (!car.alive) continue;
      const ev = this.route.step(car);
      if (ev) {
        // §5.4 (r313): every car's gate passage is stamped — a rival within
        // 1.5 s of its own gate is driving, not shooting (vehicles.js reads
        // _lastGateT at all three weapon gates)
        if (ev.passed) car._lastGateT = this.raceTime;
        if (car === this.player) {
          this.telemetry?.log('gate', { id: ev.id, passed: ev.passed,
            lateralM: ev.lateral, section: ev.kind });
        }
      }
    }
    // §5.2 (r313): THE PRESSURE RIVAL — the honest rubber band. At GO+15,
    // the ONE rival nearest the player in progress holds the lease (nearest
    // progress IS nearest live pace: progress = pace × time from the same
    // start); re-picked each player lap. Only that rival's pace may track
    // the player, clamped ±pressureClampPct in vehicles.js — everyone else
    // races their own race.
    {
      const AI2 = window.__DRIVING?.ai ?? {};
      const pickAfter = AI2.pressurePickAfterS ?? 15;
      const plLap = this.player.lap ?? 1;
      if (this.raceTime >= pickAfter
          && (!this._pressureRival || this._pressurePickedLap !== plLap)) {
        let best = null, bestD = 1e9;
        for (const e of this.enemies) {
          if (!e.alive) continue;
          const d = Math.abs((e.progress ?? 0) - (this.player.progress ?? 0));
          if (d < bestD) { bestD = d; best = e; }
        }
        if (best && best !== this._pressureRival) {
          this._pressureRival = best;
          this.telemetry?.log('aiState', { rival: best.persona ?? best.name,
            state: 'PRESSURE', targetId: 'player' });
        }
        this._pressurePickedLap = plLap;
      }
    }
    // §4.4 the missed-gate grace: the next gate sitting BEHIND the car
    // (forward route-distance past half a lap) means it was left behind
    const pl = this.player, N = this.track.center.length;
    const gate = this.route.gates[pl._nextGate ?? 0];
    const dt = 1 / 60;
    if (pl.alive && this.state === 'race' && gate) {
      const ahead = (gate.si - pl.trackIndex + N) % N;
      const overshot = ahead > N * 0.5;
      // §3.2's own word is UNCORRECTED. A player driving back toward the
      // gate — reversing to it, or turned around and heading for it — is
      // correcting, and yanking them mid-manoeuvre read as "I can't drive
      // backwards" (r304 report; with §3.5's silence there was nothing on
      // screen to say why the snap happened). While their velocity closes
      // on the gate at better than walking pace the grace HOLDS: it does
      // not accrue and does not reset, so stopping again resumes the clock.
      const toGx = gate.x - pl.pos.x, toGz = gate.z - pl.pos.z;
      const dist = Math.hypot(toGx, toGz) || 1;
      const closing = (pl.vel.x * toGx + pl.vel.z * toGz) / dist;
      const correcting = closing > 2;
      if (!overshot) this._gateMissT = 0;
      else if (!correcting) this._gateMissT = (this._gateMissT ?? 0) + dt;
      const RT = window.__DRIVING?.route ?? {};
      if (this._gateMissT > (RT.missedGateGraceS ?? 4)) {
        this._gateMissT = 0;
        this.returnToGate(pl, gate.id, 'missed');
      }
    } else this._gateMissT = 0;
  }

  /** CORRIDOR §10 — ONE return function. Free, instant, never a resource:
   *  the car re-enters `returnAheadM` before the gate on its heading at
   *  `returnSpeedKmh`, still owing the gate. */
  returnToGate(car, gateId, reason) {
    const gt = this.route?.gates?.[gateId];
    if (!gt) return;
    const N = this.track.center.length;
    const sampleLen = Math.max(1, Math.hypot(
      this.track.center[1].x - this.track.center[0].x,
      this.track.center[1].z - this.track.center[0].z));
    const RT = window.__DRIVING?.route ?? {};
    const back = Math.max(1, Math.round((RT.returnAheadM ?? 6) / sampleLen));
    car._nextGate = gateId;                  // the gate is still owed
    car._gateAlong = undefined;
    // never wrap backwards past the lap line — for gate 0 the return seats
    // ON the line instead, or progress reads the teleport as a lap gained
    // (r311, caught on the rival kill-respawn; same arithmetic here)
    const rawIdx = gt.si - back;
    car.placeAt(rawIdx < 0 ? gt.si : rawIdx, 0, true);
    const sp = (RT.returnSpeedKmh ?? 40) / 3.6;
    car.vel.set(Math.sin(car.heading), 0, Math.cos(car.heading)).multiplyScalar(sp);
    car.vy = 0; car.airborne = false;
    car.invuln = Math.max(car.invuln ?? 0, 1.5);
    car._noPickupT = 1.5;                    // a return never grants nitro
    car._lastReturnT = this.raceTime;        // probes read this (Q13/Q19 audits)
    if (car === this.player) {
      this.telemetry?.log('return', { reason, gateId });
    }
    // no toast — §8: the fade-and-reappear IS the message
  }

  /** PATCH_02 §3.1 + §3.3 (v1.1): the AGGRO TICKET OFFICE. No rival may make
   *  the player its target before GO + 4 s; after that at most ONE rival holds
   *  a ticket in the first 20 s and two thereafter. A ticket is a 6 s lease
   *  that is NEVER renewed by use — it lapses and someone else gets a turn,
   *  so pressure rotates instead of piling. */
  aiCanTarget(rival) {
    if (this.state !== 'race') return false;
    const now = this.raceTime;
    this._aggro = (this._aggro ?? []).filter((a) => a.until > now && a.r.alive);
    const P2 = window.__DRIVING?.patch02 ?? {};
    const AIT = window.__DRIVING?.ai ?? {};   // v1.5 §5.4 owns these knobs now
    if (now < (P2.rivalTargetDelayS ?? 4)) return false;
    const mine = this._aggro.find((a) => a.r === rival);
    if (mine) return true;   // v1.1: tokens ROTATE — a lease is 6 s, never renewed on use
    const cap = now < (P2.playerTargetEarlyUntilS ?? 20)
      ? (AIT.playerTokensEarly ?? P2.playerTargetTokensEarly ?? 1)
      : (AIT.playerTokensLate ?? P2.playerTargetTokensLate ?? 2);
    if (this._aggro.length < cap) {
      this._aggro.push({ r: rival, until: now + (AIT.tokenRotateS ?? P2.targetTokenRotateS ?? 6) });
      this.telemetry?.log('rivalTarget', { rivalId: rival.name ?? 'rival', acquire: true });
      return true;
    }
    return false;
  }

  // ---------- car vs car pushes ----------
  _carCollisions() {
    const cars = [this.player, ...this.enemies].filter((c) => c.alive);
    for (let i = 0; i < cars.length; i++)
      for (let j = i + 1; j < cars.length; j++) {
        const a = cars[i], b = cars[j];
        const d = a.pos.distanceTo(b.pos);
        if (d < 4.4 && d > 0.01) {
          const push = a.pos.clone().sub(b.pos).normalize().multiplyScalar((4.4 - d) / 2);
          a.pos.add(push);
          b.pos.sub(push);
          const rel = a.vel.clone().sub(b.vel);
          const impact = rel.length();
          if (impact > 8) {
            const mid = a.pos.clone().add(b.pos).multiplyScalar(0.5);
            this.particles.sparks(mid, push.normalize(), Math.min(18, 4 + impact | 0));
            if (a === this.player || b === this.player) this.audio.scrape();
          }
          // trading paint is free; real collisions dent BOTH hulls
          // (rate-limited per car so a lingering rub isn't a damage hose)
          if (impact > 9 && (a._crashT ?? -9) < this.raceTime - 0.5
                         && (b._crashT ?? -9) < this.raceTime - 0.5) {
            a._crashT = b._crashT = this.raceTime;
            const dmg = Math.min(20, (impact - 9) * 0.6);
            // PATCH_02 §3.3 / v1.5 §5.4: a rival ramming the PLAYER costs at
            // most rivalRamCapPerHit (8) — the pack must pressure with
            // position, not delete a hull.
            const ramCap = window.__DRIVING?.ai?.rivalRamCapPerHit ?? 8;
            a.damage(a === this.player && b !== this.player ? Math.min(ramCap, dmg) : dmg, b);
            b.damage(b === this.player && a !== this.player ? Math.min(ramCap, dmg) : dmg, a);
            const mid = a.pos.clone().add(b.pos).multiplyScalar(0.5);
            this.particles.debris(mid, 3);
            if (a === this.player || b === this.player) {
              this.shake = Math.min(1, this.shake + 0.2 + impact * 0.01);
              this.buzz(25);
              if (dmg >= 4) this.hud.feed(`CRASH −${Math.round(dmg)} HULL`, 'bad');
              if (dmg >= 13) this.crashDrama();
            }
          }
          a.vel.addScaledVector(rel, -0.12);
          b.vel.addScaledVector(rel, 0.12);
        }
      }
  }

  // ---------- camera ----------
  _updateCamera(dt) {
    const p = this.player;
    // PATCH_02 §3.9: the zoom EASES over ~400 ms so the eye reads the
    // change as acceleration, not a cut — and the speed-lines overlay
    // fades in past 150 km/h.
    const speedZoomRaw = Math.min(1, Math.abs(p.speedAlong) / p.maxSpeed);
    this._camSpd = (this._camSpd ?? 0) + (speedZoomRaw - (this._camSpd ?? 0)) * Math.min(1, dt / 0.4);
    const speedZoom = this._camSpd;
    {
      const sl = document.getElementById('speed-lines');
      if (sl) {
        const kmh = Math.abs(p.speedAlong) * 3.6;
        sl.style.opacity = kmh > (window.__DRIVING?.patch02?.speedLinesFromKmh ?? 95) ? Math.min(0.45, (kmh - (window.__DRIVING?.patch02?.speedLinesFromKmh ?? 95)) / 110).toFixed(2) : "0";
      }
    }
    const M = CAM_MODES[this.camMode] || CAM_MODES[0];
    // THE DRIVER'S VIEW IS NOT A SHORT BOOM. Everything below this line exists
    // to place a camera some distance behind the car and keep the line between
    // the two clear — of hillsides, of cliff faces, of pine trunks. From the
    // driver's seat there is no such line: the lens is the car. Running that
    // machinery on it would lift the eye over the hill ahead, slide it off a
    // trunk it is nowhere near, and lerp it out of the cabin on every corner.
    // THE SEAT NEEDS A CLOSER NEAR PLANE THAN A BOOM DOES, and this is the
    // whole of "there is the bug in the view".
    //
    // Measured on REDWOOD RAMPAGE by unprojecting the frame's own pixels: at
    // 70% down the ray meets bodywork at 2.1 u, and at 80% and 92% it meets
    // bodywork at 0.3 u — INSIDE the 0.5 near plane the chase cameras use. So
    // the bottom third of the seat's view was not a dark object, it was
    // geometry CLIPPED AWAY, rendering as background. That is why hiding the
    // cockpit, the whole car, the shadows and even the road changed the black
    // by nothing: there was never anything being drawn there to hide.
    //
    // 0.12 clears the closest bodywork with room to spare. It is restored to
    // 0.5 the moment any other view is selected, because a near plane that
    // small costs depth precision at distance and no boom needs it.
    const wantNear = M.driver ? 0.12 : 0.5;
    if (this.camera.near !== wantNear) {
      this.camera.near = wantNear;
      this.camera.updateProjectionMatrix();
    }
    if (M.driver) { this._driverCamera(dt, M); this._applyCamera(dt, speedZoom, M); return; }
    // Leaving the seat: re-seed the smoothed state next time. The visibility
    // line is no longer undoing anything (the seat draws the car now that the
    // eye is inside it) — it is kept because it asserts the correct state for
    // a WRECKED player, whose husk `syncMesh` will not touch until respawn.
    if (this._dWasDriver) {
      this._dWasDriver = false;
      if (p.mesh) p.mesh.visible = p.alive;
      // the shadow comes back with the outside view — see the seat's entry
      for (const o of this._dCasters ?? []) o.castShadow = true;
      this._dCasters = [];
      const blob = p.mesh?.userData?.aoBlob;
      if (blob) blob.visible = this._dBlobWas ?? true;
      // and the brand comes back the moment you are outside the car again,
      // while the interior goes away — it would show through the windows
      for (const d of p.mesh?.userData?.outwardDecals ?? []) d.visible = true;
      const pit = p.mesh?.userData?.cockpit;
      if (pit) pit.visible = false;
      // ...and the hood comes back. It is removed for the seat only (see
      // `_driverCamera`); a chase camera looking at a car with no front half
      // would be a far worse bug than the one that removal fixes.
      for (const c of p.mesh?.userData?._hoodParts ?? []) c.visible = true;
    }
    // Chase views used to sit rigidly behind the car's RAW heading, so every
    // steering flick and every drift whipped the whole view sideways — that
    // is what made driving in 3D so hard. The chase yaw now follows a blend
    // of heading and actual travel direction, damped over time, so the view
    // stays settled and the road reads straight ahead.
    let fwd = p.forward;
    if (M.roadYaw && this.track?.headingAt && p.trackIndex !== undefined) {
      // The road's own heading, damped the same way the chase yaw is. Damping
      // still matters even though the road is smooth: `trackIndex` steps
      // between samples, and an undamped step shows up as a visible jolt.
      // Falls back to the car's heading if the lap index is not usable yet.
      const wrap = (a) => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };
      const road = this.track.headingAt(p.trackIndex);
      if (Number.isFinite(road)) {
        const cur = this._camYaw ?? road;
        this._camYaw = cur + wrap(road - cur) * (1 - Math.exp(-5.0 * (this._camDt ?? dt)));
        fwd = new THREE.Vector3(Math.sin(this._camYaw), 0, Math.cos(this._camYaw));
      }
    } else if (M.chase) {
      const wrap = (a) => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };
      let yaw = Math.atan2(fwd.x, fwd.z);
      const sp = Math.hypot(p.vel.x, p.vel.z);
      if (sp > 5) yaw += wrap(Math.atan2(p.vel.x, p.vel.z) - yaw) * 0.4; // look where you're going
      const cur = this._camYaw ?? yaw;
      // 4.5 linear tracked the car closely enough that the view still whipped
      // on a flick, and 3.6 cured that — at 60 fps. On CLAMPED dt the factor
      // decays with frame rate (see _camDt above), and at phone frame rates
      // the cure became "the camera still shows the side of the car in a
      // turn". 5.0 exponential on wall time sits just above the old 60 fps
      // response and, crucially, STAYS there when the frame rate halves; the
      // travel-direction blend above is what keeps a flick from whipping the
      // view, not sheer sluggishness.
      this._camYaw = cur + wrap(yaw - cur) * (1 - Math.exp(-5.0 * (this._camDt ?? dt)));
      fwd = new THREE.Vector3(Math.sin(this._camYaw), 0, Math.cos(this._camYaw));
    }
    // Cliff worlds are a special case for any LOW view. `clampCam` below already
    // stops the camera swinging THROUGH the rock, but on the outside of a bend
    // the face sits squarely in the sightline and eats the road ahead — measured
    // on CANYON RUN, TRAIL saw roughly half the road that TOP-DOWN did from the
    // same spot. Modes that ask for it rise between the walls rather than being
    // unusable on a third of the worlds.
    const lift = (M.cliffLift && this.track?.T?.cliffWalls) ? M.cliffLift : 0;
    // r306 ("clean this up", CANYON RUN screenshot): a TOP camera never
    // dives into a gorge. The jump gorges drop the deck ~26 u below the
    // rim for a few samples, and an overhead boom that follows the car
    // down spends those seconds inside the slot — wall faces filling the
    // whole frame. The overhead family (roadYaw modes) floors its HEIGHT
    // anchor at the local road datum's rim, so a dip is seen from above:
    // the slot, the walls and the car in plan, not the wall's interior.
    // The look target still follows the car, so the eye tracks it down.
    // TRIGGER AT +8, NOT +1 (r308, "driving feels slow motion"): at +1 the
    // lift engaged on 25-49% of every lap — any ordinary hill puts the
    // local datum a few metres over the car (measured max +5.3 across four
    // worlds), so since r306 the overhead camera floated up to 5 m higher
    // on half the road, and everything on screen moved smaller and slower.
    // A real gorge drops the CAR ~28 below the datum; +8 splits the two
    // populations with margin, and subtracting the threshold eases the
    // onset instead of popping.
    let gorgeLift = 0;
    if (M.roadYaw && this.track?.center && p.trackIndex !== undefined) {
      const Nc = this.track.center.length;
      let rim = -Infinity;
      for (let q = -12; q <= 12; q += 3) {
        rim = Math.max(rim, this.track.center[(p.trackIndex + q + Nc) % Nc].y);
      }
      if (rim > p.pos.y + 8) gorgeLift = Math.min(30, rim - p.pos.y - 8);
    }
    const targetPos = p.pos.clone()
      .addScaledVector(fwd, -(M.back + speedZoom * (M.spdBack || 0)))
      .add(new THREE.Vector3(0, gorgeLift + M.h + lift + speedZoom * (M.spdH || 0), 0));
    const targetLook = p.pos.clone()
      .addScaledVector(fwd, M.look)
      .add(new THREE.Vector3(0, M.lookH || 0, 0));
    // cliff-walled worlds: never let the camera swing through the rock face.
    // Clamp lateral track offset just inside the walls and rise instead —
    // applied to the TARGET and to the LERPED position (the smoothing path
    // cuts corners on hairpins and would otherwise trail through the cliff).
    const tk = this.track;
    //
    // A CLAMP MAY ONLY PULL THE CAMERA IN, NEVER PUSH IT OUT. `nearestIndex`
    // searches +-30 samples around its hint, so once the camera has drifted
    // further than that window it resolves against the WRONG piece of track,
    // `lateralOffset` is then measured from a centreline that is nowhere near,
    // and this pushes the camera along a normal that points somewhere
    // arbitrary — which makes the next frame's offset bigger still. Measured
    // with `caproll.mjs`, railing the car round a lap: on CANYON RUN the
    // camera-to-car distance ran 51 -> 110 -> 240 -> 372 -> 439 -> 490 and
    // never recovered, while PINE VALLEY, whose only difference is
    // `cliffWalls: false`, held 51.1 to 52.0 at every sample of the same lap.
    // This branch is the only code gated on that flag.
    //
    // The guard is one line and it cannot be argued with: if the correction
    // would leave the camera further from the car than it already is, it is
    // not a correction.
    const clampCam = (v) => {
      if (!tk?.T?.cliffWalls || !tk.nearestIndex) return;
      const ci = tk.nearestIndex(v, p.trackIndex);
      const lat = tk.lateralOffset(v, ci);
      // 8.4, OR CLOSER IF THE ROCK IS CLOSER. The constant on its own was a
      // coincidence that happened to hold. The cliff foot is nominally 37 u
      // out on CANYON RUN, but `_cliffCap` pulls it in to 11.3 wherever the
      // lap comes back past itself — sixteen stations of that lap, measured by
      // `cliffgap.mjs` — and this limit knew about neither number. It cleared
      // the rock by 2.9 u for no reason anyone had checked. `track.cliffFoot`
      // publishes the measured foot per station and per side, so the eye is
      // bounded by the rock it is being kept out of instead of by a number
      // that matches it today. `Math.min`, so this can only ever tighten and
      // never let the camera further out than it already goes.
      const foot = tk.cliffFoot?.[ci * 2 + (lat < 0 ? 1 : 0)];
      const lim = Number.isFinite(foot) ? Math.min(8.4, foot - 2.6) : 8.4;
      if (Math.abs(lat) <= lim) return;
      const n = tk.nrm[ci];
      const over = lat - Math.sign(lat) * lim;
      const nx = v.x - n.x * over, nz = v.z - n.z * over;
      if (Math.hypot(nx - p.pos.x, nz - p.pos.z)
        > Math.hypot(v.x - p.pos.x, v.z - p.pos.z)) return;
      v.x = nx;
      v.z = nz;
      v.y += Math.min(4, Math.abs(over) * 0.5);
    };
    clampCam(targetPos);
    const k = 1 - Math.exp(-5.5 * (this._camDt ?? dt));
    this.camPos.lerp(targetPos, k);
    this.camLook.lerp(targetLook, k);
    clampCam(this.camPos);

    // THE GROUND MUST NEVER GET BETWEEN YOU AND YOUR CAR.
    //
    // There was a guard for cliff-walled worlds and a guard for pine trunks,
    // and nothing at all for plain terrain. So on any rolling world the camera
    // could sit inside a hillside: the frame fills with green, the car is
    // behind it, and it reads exactly like the car has vanished — which is
    // what it has been reported as, repeatedly, on snow and on grass alike.
    //
    // Two rules. Stay above the ground you are over, and clear the highest
    // point on the sightline to the car. Lifting rather than pulling in,
    // because pulling in far enough on a steep rise puts the camera inside
    // the car; a slightly higher view still shows the road.
    // ...EXCEPT in a tunnel, where "the ground" is the hill you are driving
    // UNDER. Over a bore terrainHeight returns the ridge, so the rule below
    // lifted the camera clean through the roof and left you looking down at
    // the mountainside while the car ran somewhere inside it. In the bore the
    // camera obeys the BORE: over the roadway, under the crown, inside the
    // walls. Either end counts — the car enters before the camera does and
    // leaves before it too, and neither hand-off may flick the view outside.
    const tun = tk?.tunnelAt
      ? (tk.tunnelAt(p.pos, p.trackIndex, 6) || tk.tunnelAt(this.camPos, p.trackIndex, 6))
      : null;
    if (tun) {
      const cp = this.camPos;
      const ci = tk.nearestIndex(cp, tun.i);
      const lat = tk.lateralOffset(cp, ci);
      const lim = tun.half - 2.4;
      if (Math.abs(lat) > lim) {                       // never inside the rock
        const n = tk.nrm[ci];
        const over = lat - Math.sign(lat) * lim;
        cp.x -= n.x * over;
        cp.z -= n.z * over;
      }
      const fy = tk.center[ci].y;
      cp.y = Math.max(fy + 1.9, Math.min(cp.y, fy + tun.apex - 1.3));
    } else if (tk?.deckOverhead
      && (tk.deckOverhead(p.pos, p.trackIndex) || tk.deckOverhead(this.camPos, p.trackIndex))) {
      // UNDER A BRIDGE, OBEY THE BRIDGE — the same rule as the bore above.
      //
      // Without this the chase camera rises over the deck on the approach and
      // the driver watches the top of a flyover while the car runs underneath
      // it, out of sight, at speed. Asked for directly: "when under bridge,
      // change the camera to same camera mode like in tunnels."
      //
      // Same clamp shape as the tunnel branch: keep the eye above the road and
      // below the soffit, and hold it inside the span so it cannot swing out
      // through a pier. Either the car or the camera being under the deck
      // counts, because the camera trails and neither hand-off may flick the
      // view through the deck.
      const dk = tk.deckOverhead(p.pos, p.trackIndex) || tk.deckOverhead(this.camPos, p.trackIndex);
      const cp = this.camPos;
      const ci = tk.nearestIndex(cp, dk.i, true);
      const lat = tk.lateralOffset(cp, ci);
      const lim = dk.half - 2.4;
      if (Math.abs(lat) > lim) {
        const n = tk.nrm[ci];
        const over = lat - Math.sign(lat) * lim;
        cp.x -= n.x * over;
        cp.z -= n.z * over;
      }
      cp.y = Math.max(dk.floorY + 1.9, Math.min(cp.y, dk.deckY - 0.8));
    } else if (tk?.terrainHeight) {
      const cp = this.camPos, pp = p.pos;
      const dx = pp.x - cp.x, dz = pp.z - cp.z, dy = pp.y - cp.y;
      let lift = 0;
      const STEPS = 7;
      // A sample close to the car divides by a small (1 - f), so a modest
      // intrusion there becomes an enormous lift — measured at 57 to 105 u on
      // FURKA's tunnel mouth, where the ridge stands over the road by design.
      // Samples inside a bore are not obstacles, they are the roof: skip them.
      const probe = this._camProbe || (this._camProbe = new THREE.Vector3());
      // v1.5 §6.8 (r310): BUILDINGS ARE IN THE PROBE. The sight line only
      // ever asked the terrain, so in towns the boom sank into facades and
      // hut roofs (recording E: "camera enters buildings and walls"). A
      // 20 Hz-refreshed cache of the tall solids near the player keeps the
      // per-frame cost at ~a dozen circle tests; solids carry no height,
      // so a building-ish radius stands in for one (a 3 u+ solid is a
      // structure, not a bollard).
      if (!this._camSolids || (this._camSolidsAge = (this._camSolidsAge ?? 0) + 1) > 12) {
        this._camSolidsAge = 0;
        const near = [];
        for (const sld of tk.solids ?? []) {
          // 3-20 u: buildings, huts, towers. Below is a bollard; above is
          // LANDSCAPE (massif cones, cliff anchors) that the terrain probe
          // already owns — a 396 u cone in this cache lifted the boom
          // everywhere near town.
          if ((sld.r ?? 0) < 3 || sld.r > 20 || sld.y === -9999) continue;
          const d2 = (sld.x - pp.x) * (sld.x - pp.x) + (sld.z - pp.z) * (sld.z - pp.z);
          if (d2 < 70 * 70) near.push(sld);
        }
        this._camSolids = near;
      }
      for (let s = 1; s <= STEPS; s++) {
        const f = s / (STEPS + 1);
        const sx = cp.x + dx * f, sz = cp.z + dz * f;
        if (tk.tunnelAt && tk.tunnelAt(probe.set(sx, 0, sz), p.trackIndex, 10)) continue;
        let gh = tk.terrainHeight(sx, sz) + 1.1;
        for (const sld of this._camSolids) {
          const dxs = sx - sld.x, dzs = sz - sld.z;
          if (dxs * dxs + dzs * dzs < sld.r * sld.r) {
            const top = (sld.y ?? tk.terrainHeight(sld.x, sld.z))
              + (sld.h ?? Math.min(14, sld.r * 1.6)) + 1.1;
            if (top > gh) gh = top;
          }
        }
        const sy = cp.y + dy * f;
        if (gh > sy) lift = Math.max(lift, (gh - sy) / (1 - f));
      }
      if (lift > 0) cp.y += Math.min(lift, 18);
      // ...and never underground wherever it ended up (PATCH_02 v1.2 fix 13
      // names this clearance; 2.2 is this engine's measured-good value)
      const gCam = tk.terrainHeight(cp.x, cp.z)
        + (window.__DRIVING?.patch02b?.camClearanceM ?? 2.2);
      if (cp.y < gCam) cp.y = gCam;

      // A CAMERA HIGH ENOUGH TO CLEAR THE HILL IS NOT A CAMERA ANY MORE.
      //
      // Both rules above raise the lens and neither bounds it against the
      // CAR. Park at the foot of a steep bank - which is where a car ends up
      // after leaving the road - and the ground behind stands 50 u over the
      // roof, so "stay above the ground you are over" put the lens 52 u up
      // (measured: car y 2.0, camera y 54.0). From there the frame is a
      // single featureless slab of hillside with the world in a sliver at
      // the edge, which is exactly what the player photographed and called a
      // void.
      //
      // Height above the car is capped. When the cap bites, the boom comes IN
      // instead - a nearer, lower view still shows the car and the road,
      // where a high one shows neither - and it stops short of the bonnet so
      // the fix can never put the lens inside the car.
      //
      // THE CAP IS ON THE LIFT, NOT ON THE MODE. Written as a flat 13 it was
      // sized for the chase family (h 11.5-17) and quietly demolished the
      // overhead pair, whose entire reason to exist is to be 46 and 72 u up:
      // measured, TOP-DOWN, TOP FAR, TRAIL and CHASE all sat at exactly 13 u
      // above the car, so "top-down" was a chase camera with a worse angle
      // and no amount of editing CAM_MODES.h could change it. The bug this
      // guards against is the ground-clearance LIFT running away (car y 2,
      // camera y 54), so the allowance is the mode's own height plus room for
      // a reasonable lift — and never below the old 13, so the chase family
      // keeps exactly the behaviour it was tuned with.
      // ...and the r306 gorge floor is a DELIBERATE lift: over a gorge dip
      // the overhead anchor rides the rim, so the allowance carries it —
      // without this the cap clipped the camera right back into the slot
      // (measured: target 54.8, capped to 27.3, wall interiors again).
      const MAX_UP = Math.max(13, (M.h || 0) + gorgeLift + (lift > 0 ? 4 : 0.5));
      if (cp.y > pp.y + MAX_UP) {
        cp.y = pp.y + MAX_UP;
        for (let k = 0; k < 6; k++) {
          const g2 = tk.terrainHeight(cp.x, cp.z) + 2.2;
          if (cp.y >= g2) break;                 // clear of the slope: done
          const ox = cp.x - pp.x, oz = cp.z - pp.z;
          if (Math.hypot(ox, oz) < 4) { cp.y = g2; break; }   // never in the car
          cp.x = pp.x + ox * 0.72;
          cp.z = pp.z + oz * 0.72;
        }
      }
    }

    // a solid pine on the camera->player sightline fills the whole frame —
    // slide the camera sideways off the trunk instead
    if (tk?.trees) {
      const cp = this.camPos, pp = p.pos;
      const dx = pp.x - cp.x, dz = pp.z - cp.z;
      const L2 = dx * dx + dz * dz;
      if (L2 > 1) {
        for (const tr of tk.trees) {
          if (tr.dead || tr.kind !== 'pine' || tr.s < 1.0) continue;
          const t01 = ((tr.x - cp.x) * dx + (tr.z - cp.z) * dz) / L2;
          if (t01 < 0 || t01 > 0.9) continue;
          const qx = cp.x + dx * t01, qz = cp.z + dz * t01;
          const dTr = Math.hypot(tr.x - qx, tr.z - qz);
          const rr = (tr.r ?? 1) + 1.7;
          if (dTr < rr) {
            const pl = Math.sqrt(L2);
            const px = -dz / pl, pz = dx / pl;                  // sightline perpendicular
            const side = Math.sign((tr.x - qx) * px + (tr.z - qz) * pz) || 1;
            const push = (rr - dTr) * 1.15;
            cp.x -= px * side * push;
            cp.z -= pz * side * push;
          }
        }
      }
    }
    // THE BOOM HAS A LENGTH, AND IT IS NOT NEGOTIABLE.
    //
    // Every guard above — the cliff clamp, the ground lift, the tunnel and
    // deck clamps, the pine sidestep — moves the eye for a good reason, and
    // any of them can be wrong about where it has put it. None of them checks
    // the one thing that is always true: a chase camera is a boom of a known
    // length, and a boom that is three times its own length from the car has
    // failed, whatever the reason. `caproll.mjs` caught exactly that on the
    // cliff worlds (49 u nominal, 490 u measured, never recovering).
    //
    // So: a leash. Past twice the boom, snap back to where the mode says the
    // eye belongs. It costs nothing when nothing is wrong — in a healthy lap
    // the distance never leaves 51-52 against a nominal 48.7 — and it turns
    // any future version of that bug from a lost car into a single frame of
    // camera movement.
    {
      const boom = Math.hypot(M.back + speedZoom * (M.spdBack || 0),
        M.h + lift + speedZoom * (M.spdH || 0));
      if (this.camPos.distanceTo(p.pos) > boom * 2) {
        this.camPos.copy(targetPos);
        this.camLook.copy(targetLook);
      }
    }
    this._applyCamera(dt, speedZoom, M);
  }

  /** Everything every view does once its eye and its look-point are decided:
   *  the impact shake, the aim, the corner lean, and the shadow rig follow.
   *  Split out so the driver's view can share it without also inheriting the
   *  boom, the ground-clearance lift and the sightline guards above, none of
   *  which mean anything from inside the car. */
  _applyCamera(dt, speedZoom, M) {
    const p = this.player;
    // screen shake
    this.shake = Math.max(0, this.shake - dt * 2.2);
    // FROM THE SEAT, THE SHAKE IS THE CAR'S, NOT THE CAMERA OPERATOR'S. A boom
    // 20 u out turns 1.6 u of jitter into a small wobble; the same figure on an
    // eye that is already inside the cabin throws the whole world about and
    // makes the road unreadable exactly when you have just been hit. Halved.
    const s = this.shake * this.shake * (M?.driver ? 0.45 : 1);
    this.camera.position.copy(this.camPos).add(new THREE.Vector3(
      (Math.random() - 0.5) * s * 1.6, (Math.random() - 0.5) * s * 1.2, (Math.random() - 0.5) * s * 1.6
    ));
    this.camera.lookAt(this.camLook);
    // lean into corners
    const rollTarget = this.state === 'race' ? -this.input.steer * speedZoom * 0.045 : 0;
    this._camRoll = (this._camRoll ?? 0) + (rollTarget - (this._camRoll ?? 0)) * Math.min(1, 4 * dt);
    // ...and from the seat you also lean with the BODY. That lean is the
    // cornering roll plus the CAMBER of the ground under the wheels, and it is
    // the one cue a fixed eye loses the moment the bodywork stops being on
    // screen: without it a car sitting across a slope reads as a level one.
    //
    // Taken as a measured angle rather than read off `mesh.rotation.z`, which
    // is an Euler component in the car's own frame and means nothing until it
    // has been through the yaw. How far the car's up-vector leans toward the
    // camera's right is the honest number, and it is sign-correct by
    // construction: +rotation.z tilts the camera's up to the LEFT, so banking
    // WITH a car whose roof has gone right is a negative roll.
    let bank = 0;
    if (M?.driver && p.mesh) {
      const up = (this._dUp ??= new THREE.Vector3()).set(0, 1, 0).applyQuaternion(p.mesh.quaternion);
      const dir = (this._dDir ??= new THREE.Vector3()).subVectors(this.camLook, this.camPos);
      // right = forward x worldUp = (-fz, 0, fx). Note this is the OPPOSITE of
      // the `side` vector used elsewhere in the codebase, which is (fz,0,-fx)
      // and points left; the sign of the bank hangs on getting this one right.
      const rgt = (this._dRgt ??= new THREE.Vector3()).set(-dir.z, 0, dir.x);
      if (rgt.lengthSq() > 1e-6) {
        rgt.normalize();
        bank = -Math.asin(Math.max(-1, Math.min(1, up.dot(rgt)))) * 0.55;
      }
    }
    this.camera.rotation.z += this._camRoll + bank;
    // THE HEADLIGHT BEAMS ARE FLAT ON THE ROAD, so what the lens sees of them
    // depends on how steeply it looks down — and this is the one place every
    // camera mode, the seat included, ends up. Cheap: one write to one shared
    // material for the whole grid.
    fadeCarLights(this.camera);
    // keep the shadow light rig centered on the player (offset = theme sun dir)
    this.moon.position.copy(p.pos).add(this._sunOffset);
    this.moon.target.position.copy(p.pos);
  }

  /** THE DRIVER'S VIEW.
   *
   *  An eye at the driver's head, rigidly attached to the car — no boom, no
   *  positional smoothing. "Planted" is the whole point: a lerped eye inside a
   *  cabin swims, and swimming at 55 u/s on a 430 px screen is nausea.
   *  Everything that DOES move is a small, bounded offset on top of a rigid
   *  mount: head mass under acceleration, a lean under lateral load, and a yaw
   *  that leads the slide. All three are clamped, because the thing this view
   *  is worst at is showing you the next corner and none of them may spend the
   *  frame on drama.
   *
   *  WHY THE EYE IS WHERE IT IS. Not a bumper cam: at 1.1 u the road ahead
   *  compresses into a band a few pixels tall and a crest 40 u out hides the
   *  whole corner behind it, which on a 430x932 portrait phone — where the HUD
   *  already owns the top and the bottom of the screen — leaves nothing to
   *  drive by. Not a roof cam either: high enough for a good sightline and the
   *  bonnet leaves the frame and the view stops reading as a car at all.
   *
   *  So: the seat, read off the car's OWN roofline (`capTop - 0.25`), with the
   *  pitch below doing the work the height would otherwise be asked to do.
   *  Reading it off the rig rather than writing a constant keeps the difference
   *  between a tall truck and a low coupe, which is worth having.
   *
   *  THE PITCH FOLLOWS THE ROAD, NOT THE CAR. A fixed downward tilt is right on
   *  the flat and wrong everywhere else: over a crest it aims at sky, into a
   *  dip it aims at tarmac 8 u away. The look-point instead takes the HEIGHT of
   *  the centreline `look` metres up the lap, so the frame stays full of road
   *  through a crest and a compression alike — and is then clamped to a sane
   *  cone so a broken lap index or a car pointing off a cliff cannot spin the
   *  horizon out of frame.
   */
  _driverCamera(dt, M) {
    const p = this.player, tk = this.track;
    const wrap = (a) => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };
    const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
    const step = Math.min(1, dt > 0 ? dt : 1 / 60);
    // FIRST FRAME BACK IN THE SEAT STARTS FROM THE CAR, NOT FROM MEMORY. All
    // the smoothed state below persists across a mode switch, so a player who
    // drops to CHASE for half a lap and comes back would otherwise arrive with
    // a yaw and a g-load from wherever they were when they left, and watch the
    // view swing into place over the next quarter second.
    if (!this._dWasDriver) {
      this._dWasDriver = true;
      this._dYaw = undefined; this._dSpd = undefined;
      this._dSurge = 0; this._dLean = 0;
      // THE SEAT DOES NOT CARRY ITS OWN SHADOW. Raycast + paint-probe on the
      // reported black band: the pixels under the dash were ROAD, 5-6 u
      // ahead, near-black — the car's cast shadow plus the AO blob, lying
      // exactly where the seat looks whenever the sun is behind you. From
      // inside the car neither is ever seen AS a shadow, only as a dark hole
      // the view drags along the carriageway. Off for the seat, restored on
      // leave; the list is cached so leaving restores exactly what cast.
      this._dCasters = [];
      p.mesh?.traverse((o) => {
        if (o.castShadow) { this._dCasters.push(o); o.castShadow = false; }
      });
      const blob = p.mesh?.userData?.aoBlob;
      if (blob) { this._dBlobWas = blob.visible; blob.visible = false; }
    }
    // THE CAR STAYS ON SCREEN. It used to be hidden here, and the reasoning
    // was sound for the eye it had: the first cut seated the head at
    // `capTop - 0.25`, and `capTop` is the top of the ROOF CAP — so the camera
    // sat ON the roof. From up there the body really did fill the bottom third
    // of a 430x932 frame with roof, and a sponsor decal read as APEX in mirror
    // writing, because those decals are one-sided and face away from a lens
    // that is outside the car.
    //
    // The eye is now INSIDE the glasshouse (see below), and every one of those
    // problems is a property of being outside it. Three.js defaults to
    // FrontSide, and nothing in `buildVoxelRacer` asks for DoubleSide, so from
    // within the cabin the greenhouse box, the roof cap's underside and the
    // far side of every panel are back-facing and cull. What is left in frame
    // is the bonnet ahead — top face pointed straight at the eye — which is
    // exactly the thing a cockpit view is supposed to have.
    //
    // Reported as "drivers view should be looking from inside the car".
    if (p.mesh) p.mesh.visible = true;
    // AND THE HOOD COMES OFF, BECAUSE ON A PHONE IT IS THE VIEW.
    //
    // Measured on PINE VALLEY, portrait, 430x830: the car's own bodywork fills
    // 26-33% of the frame, and on a -13% grade the render contains grass,
    // trees and a house but NOT ONE PIXEL OF ROAD — which is the phone
    // screenshot in the report. It is not the aim pitching into the metal (the
    // hood grazes at 23 degrees against an aim capped at 17.8; clamping to the
    // silhouette was tried and changed nothing on any car). It is simply that
    // a hood two and a half metres long, seen from a head sitting 0.4 m above
    // it, subtends about thirty degrees — and thirty degrees of an 82 degree
    // vertical lens is a third of the screen. No eye height or dash placement
    // inside the cabin gets that back; the hood has to not be drawn.
    //
    // Everything AHEAD of the eye goes; the cabin, pillars, roof and tail stay,
    // and so does the cockpit below. That is a cockpit view: you see the car
    // you are sitting in, not the car you are sitting on.
    //
    // The split is computed ONCE per mesh and cached — it is a question about
    // the model, which does not change — and it is stored as the parts to hide
    // rather than the parts to show, so anything added to the car later shows
    // by default instead of silently vanishing.
    if (p.mesh && !p.mesh.userData._hoodParts) {
      const eyeCut = (p.mesh.userData.rig?.cabZ ?? 0) + (p.mesh.userData.rig?.cabL ?? 2) * 0.30;
      const bb = new THREE.Box3();
      p.mesh.userData._hoodParts = p.mesh.children.filter((c) => {
        if (c === p.mesh.userData.cockpit) return false;
        bb.setFromObject(c);
        if (!Number.isFinite(bb.min.z)) return false;
        // the local box is in world space here; fall back to the object's own
        // position when the mesh has not been placed yet
        const z = c.position.z;
        return z > eyeCut;
      });
    }
    for (const c of p.mesh?.userData?._hoodParts ?? []) c.visible = false;
    // ONE THING DOES HAVE TO GO, AND IT IS NOT BODYWORK. The brand decal is a
    // textured plane laid on the hood slope "reading right-side-up from the
    // car's FRONT" (vehicles.js). A driver sits behind it and reads it
    // backwards — measured as a white mapped plane at 71% of a 430x932 frame,
    // and it is the APEX-in-mirror-writing in the report. Back-face culling
    // cannot help: this is the decal's front face. Hidden for the seat only.
    for (const d of p.mesh?.userData?.outwardDecals ?? []) d.visible = false;
    // AND THE INSIDE OF THE CAR COMES ON. Built with the body (vehicles.js) and
    // hidden everywhere else, because from a chase camera a dashboard sitting
    // in the middle of the shell is visible through the windows.
    const pit = p.mesh?.userData?.cockpit;
    if (pit) pit.visible = true;
    // The wheel is the one piece that is not furniture: it answers the steering
    // the way the car does, off the SMOOTHED input rather than the raw axis, so
    // it does not twitch. ~1.6 rad of lock each way reads as a wheel being
    // turned rather than a dial being spun.
    const w = p.mesh?.userData?.wheel;
    if (w) w.rotation.y = -(p.steerSmooth ?? 0) * 1.6;

    // ---- where the head is pointed -----------------------------------------
    // The car's own heading leads, because that is what a driver's head does.
    // A THIRD of the way toward the travel direction on top of it, so a slide
    // shows you where the car is actually going instead of where its nose
    // happens to be — the one piece of information a fixed forward eye loses,
    // and the reason a cockpit view is normally hopeless in a drift.
    let yaw = Math.atan2(p.forward.x, p.forward.z);
    const sp = Math.hypot(p.vel.x, p.vel.z);
    if (sp > 5) yaw += wrap(Math.atan2(p.vel.x, p.vel.z) - yaw) * 0.34;
    // Damped at 14/s, not the chase family's 3.6: a boom is allowed to lag
    // turn-in because you can see the car rotate under it. From the seat, lag
    // reads as the steering not being connected to anything.
    const cur = this._dYaw ?? yaw;
    this._dYaw = cur + wrap(yaw - cur) * Math.min(1, 14 * step);
    const fwd = (this._dFwd ??= new THREE.Vector3()).set(Math.sin(this._dYaw), 0, Math.cos(this._dYaw));
    const side = (this._dSide ??= new THREE.Vector3()).set(fwd.z, 0, -fwd.x);

    // ---- head movement ------------------------------------------------------
    // Longitudinal g, measured off the car's own speed rather than the throttle
    // so a nitro burst, a boost pad and a wall all move the head. Braking
    // throws it forward and down, power settles it back and up.
    const sa = p.speedAlong;
    const acc = dt > 0 ? (sa - (this._dSpd ?? sa)) / dt : 0;
    this._dSpd = sa;
    const gz = clamp(acc / 26, -1, 1);
    this._dSurge = (this._dSurge ?? 0) + (gz - (this._dSurge ?? 0)) * Math.min(1, 7 * step);
    // Lateral load, taken from the sideways component of the velocity — which
    // is the drift, not the steering angle, so it only fires when the car is
    // genuinely sliding.
    const gx = clamp(p.vel.dot(side) / 13, -1, 1);
    this._dLean = (this._dLean ?? 0) + (gx - (this._dLean ?? 0)) * Math.min(1, 6 * step);

    // ---- the eye ------------------------------------------------------------
    // Read off this car's own roofline: the roster runs 2.5-3.5 u tall, so a
    // constant seats a truck driver at chest height and a coupe driver through
    // the roof. `p.pos.y` is the contact patch, so this is height above tarmac.
    // INSIDE THE GREENHOUSE, not on top of it. The rig publishes the cabin the
    // body was actually built with, so this lands in the driver's seat on all
    // eight styles rather than at one constant that suits none of them: `cabY`
    // is the cabin's centre and `cabH` its height, so a fifth of the way up
    // from centre is head height, and `cabZ` is where that cabin sits fore and
    // aft (it ranges -0.45 on the sleek to +0.1 on the dune). Being inside is
    // what makes the body safe to draw — see the note above.
    //
    // The clamps keep the eye strictly within the glasshouse even if a future
    // body reports something odd: outside it, the box stops culling and the
    // player is looking at the inside of a dark panel.
    const rig = p.mesh?.userData?.rig;
    const cabY = rig?.cabY, cabH = rig?.cabH ?? 0.7, cabL = rig?.cabL ?? 2.0;
    // TUNABLE AT RUNTIME so the seat can be SWEPT rather than guessed at. How
    // much bonnet a cockpit shows is the whole difference between "in the car"
    // and "behind a wall", and it is a screen-coverage question that cannot be
    // answered by reading numbers in this file — see tools-scratch/eyesweep.mjs.
    // MEASURED, NOT CHOSEN. Reported as the bonnet filling the screen. Pixel
    // coverage of the player's own bodywork at a fixed station on PINE VALLEY,
    // 430x932, at speed:
    //
    // BONNET IS NOT THE ONLY WASTED FRAME — SKY IS TOO, and optimising on bonnet
    // alone picks the wrong seat. Measured at one mid-lap station, 430x932, at
    // speed, counting the player's own bodywork in pixels and the sky above the
    // horizon in pixels; what is left is the world you are driving through:
    //
    //     up    lookH    bonnet    sky     ROAD
    //     0.20  1.15      27.0%   32.4%   40.6%   <- shipped in r213
    //     0.45  1.15      21.4%   32.4%   46.2%   <- this
    //     0.45  2.50      21.8%   35.1%   43.1%
    //     0.45  4.00      22.4%   38.2%   39.4%
    //     0.45  6.00      18.7%   41.6%   39.7%
    //
    // Raising the aim LOSES road: the bonnet it saves is handed straight back
    // as sky, and 6.00 buys the smallest bonnet on the board while showing less
    // of the road than 1.15 does. The lever that worked is the EYE HEIGHT, and
    // an earlier sweep missed it by testing 0.50 and 0.65 — both ABOVE the
    // clamp at cabY + cabH * 0.45, so they returned an identical eyeY and read
    // as "this parameter does nothing". 0.45 is the ceiling: higher puts the
    // eye through the roof and out of the glasshouse that culls it.
    // WIDER, asked for as "make the view a bit wider" — but widening ALONE makes
    // the seat worse, because at 74 degrees the bonnet's edges are already off
    // the frame and a wider lens pulls them back IN. Measured, mid-lap, at
    // speed, as shares of the frame:
    //
    //     fov+  fwd    lens   bonnet    sky    ROAD
    //      6   0.14     74     21.4%   32.4%   46.2%   <- r214
    //     12   0.14     80     24.5%   34.0%   41.5%   widening alone: worse
    //     12   0.42     80     19.3%   34.1%   46.6%   <- this
    //     18   0.42     86     22.1%   35.5%   42.4%
    //     24   0.14     92     29.6%   36.8%   33.6%
    //
    // So the widening is paid for by sliding the eye forward in the cabin: the
    // extra bonnet the lens reveals ends up BEHIND the camera. 12/0.42 is wider
    // than r214 and shows less bodywork and more road than it did.
    // RE-SEATED FOR THE INTERIOR. The numbers above were found with the cabin
    // EMPTY, and they do not survive furnishing it: fwd 0.42 puts the eye
    // inside the dash slab (which spans cabZ + 0.03..0.45 of cabL) and up 0.45
    // puts it level with the header. The eye now sits BEHIND the dash and at a
    // driver's eye line, which is what makes the dash, the pillars and the
    // wheel read as a car around you rather than clip through the lens.
    // CLOSE TO THE SCREEN, AND THE REASONING FOR THIS WAS INVERTED ONCE.
    // Moving the eye BACK to get clear of the furniture does the opposite of
    // what it sounds like: at fwd -0.34 the aperture is 1.68 u ahead and only
    // 0.35 u tall, so it subtends about 12 degrees inside an 80 degree lens and
    // the whole view becomes a letterbox slot with black above and below.
    //
    // A windscreen fills your vision because your eyes are just behind it. At
    // fwd 0.38 the aperture is ~0.24 u ahead and subtends most of the frame,
    // which puts the pillars and header at the EDGES where a car's frame
    // belongs. `up` centres the eye vertically in that aperture.
    //
    // What made the first cut fail was never the eye being forward — it was
    // modelling a roof lining and a deep dash BEHIND and BELOW the eye, which
    // are a hand's breadth away wherever it sits. Those are gone.
    const T = (this._driverTune ??= { up: 0.18, fwd: 0.38, lookH: 1.15, fov: 12 });
    const eyeH = cabY !== undefined
      ? clamp(cabY + cabH * T.up, cabY - cabH * 0.35, cabY + cabH * 0.45)
      : (M.h ?? 2.3);
    // Sit a little forward of the cabin's centre, the way a driver does, but
    // never out through the windscreen.
    // The cap was 0.45 and it bound at almost every setting, which is why an
    // earlier sweep of `fwd` returned identical rows. It is now bounded by the
    // CABIN the eye has to stay inside — 42% of the cabin's length forward of
    // its centre is still well within the glasshouse whose back faces cull, and
    // that is what keeps the body drawable from in here.
    const eyeZ = rig?.cabZ !== undefined
      ? rig.cabZ + Math.min(cabL * 0.42, cabL * T.fwd) : -(M.back ?? -0.42);
    const cp = this.camPos;
    cp.set(p.pos.x, p.pos.y + eyeH, p.pos.z)
      .addScaledVector(fwd, eyeZ - this._dSurge * 0.16)
      .addScaledVector(side, this._dLean * 0.20);
    cp.y += this._dSurge * 0.10;

    // ---- the look-point -----------------------------------------------------
    const look = M.look ?? 34;
    let roadY = p.pos.y;
    if (tk?.center && tk.center.length && p.trackIndex !== undefined && tk.segLen > 0) {
      const N = tk.center.length;
      const j = ((Math.round(p.trackIndex + look / tk.segLen) % N) + N) % N;
      const cy = tk.center[j]?.y;
      // Weighted toward the road but never entirely: off the carriageway the
      // lap index is a guess and the car's own height is the honest number.
      if (Number.isFinite(cy)) roadY = p.pos.y * 0.35 + cy * 0.65;
    }
    let lookY = roadY + (this._driverTune?.lookH ?? M.lookH ?? 1.15);
    // THE HOOD SILHOUETTE IS NOT THE BINDING CONSTRAINT — MEASURED, AND
    // RECORDED SO IT IS NOT TRIED AGAIN. The obvious reading of "the frame
    // fills with bodywork on a descent" is that the aim pitches into the hood,
    // so the aim was clamped to the ray grazing it (`deckY`/`noseY`, published
    // on the rig for this). It changed nothing, on any car: the tightest hood
    // on the roster grazes at 23 degrees and the aim is already capped at
    // 17.8, so the clamp could never bind. What actually sets the top edge of
    // the interior is the DASH — see `_driverTune` and vehicles.js.
    // The cone. Up is tight (5.9°) because sky is never information; down is
    // looser (17.7°) because that is where a compression puts the road.
    lookY = clamp(lookY, cp.y - look * 0.32, cp.y + look * 0.104);
    this.camLook.set(cp.x, lookY, cp.z)
      .addScaledVector(fwd, look)
      // lead the slide by a little more than the yaw blend already does: at
      // full lateral load the aim point walks ~2.4 u toward the outside of the
      // corner, which is where the road you are about to need actually is.
      .addScaledVector(side, this._dLean * 2.4);

    // ---- and never inside anything -----------------------------------------
    // Short, because the eye rides the car and the car has its own collision.
    // The cases that remain are the ones where the CAR is momentarily wrong:
    // half-buried on a bank, mid-landing, or wedged into a cliff.
    // Order matters and is the same as the chase path's: over a bore
    // `terrainHeight` returns the RIDGE, so asking it first would put the eye
    // through the tunnel roof and out the mountainside.
    if (tk) {
      const tun = tk.tunnelAt ? tk.tunnelAt(cp, p.trackIndex, 4) : null;
      if (tun) {
        const ci = tk.nearestIndex(cp, tun.i);
        const lat = tk.lateralOffset(cp, ci);
        const lim = Math.max(1.2, tun.half - 1.0);
        if (Math.abs(lat) > lim) {
          const n = tk.nrm[ci];
          const over = lat - Math.sign(lat) * lim;
          cp.x -= n.x * over;
          cp.z -= n.z * over;
        }
        const fy = tk.center[ci].y;
        cp.y = Math.max(fy + 0.8, Math.min(cp.y, fy + tun.apex - 0.5));
      } else if (tk.deckOverhead && tk.deckOverhead(cp, p.trackIndex)) {
        const dk = tk.deckOverhead(cp, p.trackIndex);
        cp.y = Math.max(dk.floorY + 0.8, Math.min(cp.y, dk.deckY - 0.5));
      } else if (tk.terrainHeight) {
        const gy = tk.terrainHeight(cp.x, cp.z) + 0.7;
        if (cp.y < gy) cp.y = gy;
      }
    }
  }

  /** WATCHDOG: you must always be able to see your own car.
   *
   *  This has been reported several times — on snow, on grass, in race and in
   *  roam — and each time the cause turned out to be different: a 14 Hz
   *  visibility toggle, then a translucent pulse that bottomed out at 21%
   *  opacity, then terrain drawn over the carriageway. Each was real and each
   *  was fixed, and it came back, which says the useful thing to build is not
   *  another guess at the cause but a check on the SYMPTOM.
   *
   *  So: once a second of the car being un-seeable — off screen, flagged
   *  invisible, or under the ground — put it right and say so. The feed line
   *  is deliberate; if this ever fires in a screenshot we know immediately
   *  which of the three it was, instead of inferring it from the picture. */
  _watchCarVisible(dt) {
    const p = this.player;
    if (this.state !== 'race' || !p || !p.alive) { this._blindT = 0; return; }
    // ...EXCEPT FROM THE DRIVER'S SEAT, where not seeing your own car is the
    // feature. The eye sits at the driver's head, so the car's origin projects
    // to somewhere behind the near plane every single frame and this watchdog
    // would fire once a second forever, spamming the feed and yanking the eye
    // out of the cabin onto a chase boom.
    //
    // The half of it that still means something is the BURIED test — it is
    // about where the car is, not where the lens is — so that is kept, and the
    // camera's own floor guard in `_driverCamera` covers the rest.
    if ((CAM_MODES[this.camMode] || CAM_MODES[0]).driver) {
      this._blindT = 0;
      const g0 = this.track.terrainHeight(p.pos.x, p.pos.z);
      if (p.y < g0 - 1.2) { p.y = g0; p.pos.y = g0; p.vy = Math.max(0, p.vy); }
      return;
    }
    const v = p.mesh.position.clone().project(this.camera);
    const onScreen = v.x > -1.05 && v.x < 1.05 && v.y > -1.05 && v.y < 1.05 && v.z < 1;
    const gy = this.track.terrainHeight(p.pos.x, p.pos.z);
    const buried = p.y < gy - 1.2;
    const why = !p.mesh.visible ? 'hidden' : buried ? 'buried' : !onScreen ? 'offscreen' : null;
    this._blindT = why ? (this._blindT ?? 0) + dt : 0;
    if (this._blindT <= 1.0) return;
    this._blindT = 0;
    if (buried) { p.y = gy; p.pos.y = gy; p.vy = Math.max(0, p.vy); }
    p.mesh.visible = true;
    // re-seat the camera behind the car rather than letting it lerp back from
    // wherever it had wandered to
    const M = CAM_MODES[this.camMode] || CAM_MODES[0];
    const f = p.forward;
    this.camPos.set(p.pos.x - f.x * M.back, p.y + M.h, p.pos.z - f.z * M.back);
    this.camLook.set(p.pos.x + f.x * M.look, p.y + (M.lookH || 0), p.pos.z + f.z * M.look);
    // r301: no VIEW RESET toast (§8) — the re-seat is self-evident
    console.warn('[watchdog] car not visible:', why, {
      y: +p.y.toFixed(2), groundY: +gy.toFixed(2), camMode: this.camMode,
      cam: [Math.round(this.camera.position.x), Math.round(this.camera.position.y),
        Math.round(this.camera.position.z)],
    });
  }

  // ---------- main loop ----------
  /** The animation loop, wrapped so one bad frame cannot wedge the game.
   *
   *  setAnimationLoop keeps calling us after a throw, but if the throw repeats
   *  every frame nothing past it ever runs again — the picture stops updating
   *  and input stops being read, which to a player is simply a frozen game
   *  with no way out. Catching means the renderer still draws and the pause
   *  button still works, so a bug becomes a glitch you can walk away from
   *  instead of a dead session.
   *
   *  ONCE PER DISTINCT FAULT, NOT ONCE EVER. This used to keep a single
   *  `_frameErr` and report only if it was unset, so the FIRST throw of a
   *  session silenced every different one after it for good — and a throw that
   *  repeats every frame, which is the normal case, means the first one is
   *  always already there. `_syncLights` (r266) sat in that shadow: it fired
   *  on frame one of every level, so any second bug in the same session was
   *  invisible, to a player and to every probe. Keyed on the message and the
   *  top stack frame instead: each distinct fault still reports exactly once,
   *  and a new one is never hidden by an old one. */
  frame() {
    try {
      this._frameBody();
    } catch (err) {
      this._frameErrs ??= new Set();
      const key = `${err?.message || err}@${String(err?.stack || '').split('\n')[1]?.trim() || '?'}`;
      if (!this._frameErrs.has(key)) {
        this._frameErrs.add(key);
        this._frameErr ??= err;             // first one, for anything that asks
        console.error('[frame] recovered from', err);
        this.hud?.feed?.('GLITCH RECOVERED', 'bad');
      }
      // keep something on screen even if the sim threw
      try { this.composer.render(); } catch { /* renderer itself is gone */ }
    }
  }

  _frameBody() {
    const dtRaw = this.clock.getDelta();
    let dt = Math.min(dtRaw, 0.05);
    // THE CAMERA RUNS ON WALL TIME. The sim dt is clamped to 0.05 so physics
    // cannot explode on a hitch — but every camera smoothing term also ran on
    // the clamped value, which means the slower the phone renders, the slower
    // the view pans: at 12 fps a frame is 0.083 s and the camera was fed 0.05,
    // so it turned at 60% of real speed exactly when the machine was already
    // struggling. Reported as "delayed response in the turns — I can turn and
    // the camera still shows the side. Hard to drive." The camera gets its own
    // dt, bounded loosely (a one-second hitch must not whip the view round),
    // and the smoothing below uses exponential form so the response per
    // SECOND is the same at any frame rate.
    this._camDt = Math.min(dtRaw, 0.12);
    const time = this.clock.elapsedTime;
    // THE EDITOR OWNS THE FRAME. It drives its own camera and renders
    // straight (no composer, no post) so a sculpt reads as geometry rather
    // than through bloom and grade; the race sim below must not run at all,
    // or the cars would drive the world out from under the brush.
    if (this.state === 'editor') { this.editor.update(dt); return; }
    // brutal-impact slow motion: time crawls for a beat, then snaps back
    if (this.hitStop > 0) {
      this.hitStop = Math.max(0, this.hitStop - dt);
      dt *= 0.3;
    }
    // speed stretch + crash punch: fov widens smoothly with pace (modern
    // racer feel — the world rushes at you near top speed) and kicks on hits
    {
      if (this.fovKick > 0) this.fovKick = Math.max(0, this.fovKick - dt * 2.6);
      const p = this.player;
      const speedN = this.state === 'race'
        ? Math.min(1, Math.hypot(p.vel.x, p.vel.z) / (p.maxSpeed * 1.2)) : 0;
      this._fovSpeed = (this._fovSpeed ?? 0) + (speedN - (this._fovSpeed ?? 0)) * Math.min(1, 3 * dt);
      // THE LENS BELONGS TO THE VIEW. Every boom camera shares one base and one
      // speed stretch because they all see the car against a lot of world. The
      // driver's view sees neither: it is 12 u closer to the road than CHASE
      // and has no boom to sell pace with, so it takes a wider base (+6) and
      // nearly double the speed stretch. Read off CAM_MODES so a view that
      // wants its own lens says so in one place instead of here.
      const MF = CAM_MODES[this.camMode] || CAM_MODES[0];
      // The seat's own widening is tunable at runtime so it can be SWEPT and
      // measured (tools-scratch/fovshot.mjs) rather than picked by eye.
      const modeFov = MF.driver ? (this._driverTune?.fov ?? MF.fov ?? 0) : (MF.fov ?? 0);
      const fov = (this.baseFov ?? 56) + modeFov
        + this.fovKick * 8 + this._fovSpeed * (MF.spdFov ?? 6);
      if (Math.abs(fov - this.camera.fov) > 0.01) {
        this.camera.fov = fov;
        this.camera.updateProjectionMatrix();
      }
    }
    this.track.update(dt, time);
    this._updateVizZones(dt); // ---- viz-zones: sectional fog / gloom / squall

    if (this.input.justPressed('KeyC')) this.cycleCamera();
    if (this.input.justPressed('KeyV')) this.setDriverView();
    if (this.input.justPressed('KeyP') && (this.state === 'race' || this.state === 'paused')) {
      this.togglePause();
    }

    if (this.state === 'countdown') {
      this.countdown -= dt;
      const n = Math.ceil(this.countdown);
      if (n < this._lastCount && n >= 1) {
        this.hud.centerMsg(String(n));
        this.track.setLights(n === 3 ? 'red' : 'yellow');
        this._lastCount = n;
      }
      if (this.countdown <= 0) {
        this.state = 'race';
        this.startScore = this.score; // credits are earned on top of any carried score
        this.hud.centerMsg('GO!');
        this.track.setLights('green');
        this._lightsLive = true;
        this.telemetry?.log('startLights', { state: 'green' });
        // HUD_REVIEW §4: nothing toasts until GO + 3 s — the countdown owns
        // the screen. The surface warning waits out the window (it matters
        // for the first corner, which comes later than 3 s); the contract
        // toasts are gone outright — contracts read from the pause menu now.
        const surf = this.track.T?.surface;
        if (surf === 'snow' || surf === 'wet') {
          setTimeout(() => {
            if (this.state !== 'race') return;
            this.hud.feed(surf === 'snow' ? 'SNOW ROAD — LOW GRIP, LONG SLIDES'
              : 'WET ROAD — SLICK UNDER BRAKING', 'info');
          }, 3200);
        }
      }
    }

    if (this.state !== 'paused' && this.state !== 'title') {
      if (this.state === 'race') this.raceTime += dt;
      // the start gantry goes DARK once the race is running (r294: it held
      // green through every lap crossing — a start state, not a race state)
      if (this.state === 'race' && this._lightsLive && this.raceTime > 2.5) {
        this.track.setLights('off');
        this._lightsLive = false;
      }
      // pit-crew recovery: leave the wall alone for 5s and the hull patches
      // itself back up to 60% — mistakes cost position, not the whole race
      const pl = this.player;
      if (this.state === 'race' && pl.alive
          && this.raceTime - (pl._lastHurt ?? -9) > 5
          && pl.health < pl.maxHealth * 0.6) {
        pl.health = Math.min(pl.maxHealth * 0.6, pl.health + 3 * dt);
      }
      this.player.update(dt, this.input);
      // A MISSION RIVAL IS DRAWN EVERY FRAME AND WAS STEPPED NEVER.
      //
      // Reported as "mission duel is broken, opponent cars are frozen", and it
      // was exactly that. `mode=missions` sets `freeRoam = true` — missions
      // ride on the roam machinery — and this step was gated on
      // `!this.freeRoam`. So the ONE rival a DUEL deliberately keeps, makes
      // alive, makes visible and names in the HUD feed never had `update`
      // called on it. Measured in a real rAF run: 0 of 1535 frames stepped,
      // 0.000 lap travelled, against a race control of 1036 of 1216 frames and
      // +0.451 lap. PURSUIT — the other `keepsRival` mode — was identically
      // broken, which is what proves the fault is in the SHARED path and not
      // in the duel branch.
      //
      // `_raceLine` reading 0 on those runs is a CONSEQUENCE, not the cause:
      // the racing line is built lazily inside `EnemyCar.update`, so a car
      // that is never stepped never gets one.
      //
      // DO NOT SIMPLY DROP THE `!freeRoam` GATE. `_missionLaunch` culls the
      // other six with `e.alive = false` and never touches `respawnTimer`,
      // which the constructor leaves at 0 — and the dead branch of
      // `EnemyCar.update` is `respawnTimer -= dt; if (<= 0) respawn()`.
      // Measured: stepping the whole field puts ALL SEVEN back on the road
      // within 12 s and a duel silently becomes a race. So step the mission
      // foe and nothing else. `_missionReset` nulls `missionFoe`, so this
      // expires by itself.
      const rivals = this.freeRoam
        ? (this.missionFoe?.alive ? [this.missionFoe] : [])
        : this.enemies;
      if (rivals.length && (this.state === 'race' || this.state === 'finished' || this.state === 'countdown')) {
        for (const e of rivals) {
          // rivals hold on the grid during countdown
          if (this.state === 'countdown') e.syncMesh(0);
          else e.update(dt);
        }
      }
      if (this.state === 'race' || this.state === 'finished') {
        // THE PODIUM MOMENT. `_festT` is set by finishRace for a top-three
        // place and burns down here, raining confetti over the car during the
        // beat between the line and the results card. Rate-not-burst so the
        // pieces hang in the air the whole window instead of one puff that has
        // faded before the eye finds it.
        if (this._festT > 0) {
          this._festT -= dt;
          if (Math.random() < 0.5) this.particles.confetti(this.player.pos, 7);
        }
        this.weapons.update(dt);
        this._carCollisions();
        this._updateBoostPads();
        this._updatePickups(dt, time);
        this._updateChoppers(dt);
        this._updateHostiles(dt);
        this._updateProps(dt);
        this._updateRolledRocks(dt);
        this._updateWorldHazards(dt, time);
        this._updateCombo(dt);
        this._updateContracts();
        this._updateTaunts();
        this._beginSweep(); // [MISSIONS] shared swept-pickup segment for this frame
        this._updateRoamStars(time);
        this._updateLivestock(dt, time);
        this._updateMission(dt); // [MISSIONS]
        this._stepRoute();       // CORRIDOR step 1: shadow observation only
      }
      if (this.freeRoam) this.playerRank = 1;
      else this._updateRank();
      if (this.particles.ambient && this.track.theme?.weather) {
        this.particles.ambient(this.player.pos, this.track.theme.weather, dt);
      }
      this.particles.update(dt);
      this.skids.update(dt);
      this._updateFlashes(dt);
      this._updateHusks(dt);
      this.hud.update(dt);
      this.audio.engine(
        Math.abs(this.player.speedAlong) / this.player.maxSpeed,
        this.state === 'race' ? this.input.throttle : 0
      );
    } else if (this.state === 'title') {
      // IDLE ATTRACT CAMERA, ORBITING YOUR CAR — not the centreline.
      //
      // This orbited `track.center[0]` at radius 55 and looked at the road's
      // centre. The player starts EIGHTH, which is the grid slot furthest from
      // that centre: measured at 18.8 u off it, which puts the car at NDC 0.87
      // — hard against the right edge, behind the menu or cropped away. The
      // attract shot was an empty hillside with the whole field jammed into
      // one corner, and it was reported as exactly that: "car is not visible
      // here".
      //
      // So orbit the CAR, and closer, so it reads at this size. Aimed a little
      // BELOW it, which lifts it into the upper part of the frame — the strip
      // a bottom-anchored menu panel leaves free.
      const a = time * 0.12;
      const c = this.player?.mesh?.position ?? this.track.center[0];
      this.camera.position.set(c.x + Math.cos(a) * 26, c.y + 11, c.z + Math.sin(a) * 26);
      this.camera.lookAt(c.x, c.y - 12.5, c.z);
      if (this.particles.ambient && this.track.theme?.weather) {
        this.particles.ambient(new THREE.Vector3(c.x, 0, c.z), this.track.theme.weather, dt);
      }
      this.particles.update(dt);
      for (const p of this.pickups) { p.core.rotation.y += dt * 2.2; }
    }

    if (this.state !== 'title') this._updateCamera(dt);
    // horizon dressing is for horizon views: a steep-down camera (roam TOP
    // FAR) must never see the haze cylinder's far wall as a white sheet
    if (this.track?.hazeBand) {
      this.camera.getWorldDirection(this._camDir ??= new THREE.Vector3());
      this.track.hazeBand.visible = this._camDir.y > -0.45;
      if (this.track.hazeBand2) this.track.hazeBand2.visible = this.track.hazeBand.visible;
    }
    this._watchCarVisible(dt);
    // r304 ("I can't drive backwards"): auto-gas reads this flag. While the
    // car is actually rolling backwards, releasing the brake must COAST,
    // not slam full forward throttle — that lurch was cancelling every
    // reverse the moment the thumb lifted to steer.
    this.input.reverseRolling = (this.player?.speedAlong ?? 0) < -0.5;
    this.input.endFrame();
    this._autoQuality();
    this.composer.render();
  }

  // ---- viz-zones -----------------------------------------------------------
  /** Sectional visibility: while the player's trackIndex is inside one of
   *  track.vizZones ('forest' tree tunnel / 'fogbank' / 'squall'), smoothly
   *  pull scene.fog in toward the zone's impaired values and back out again
   *  on exit (~1.5s each way, far floored at 110 so it stays playable).
   *  Squalls also double the ambient rain rate while inside. Defensive:
   *  no-ops entirely when the track build predates the feature. */
  _updateVizZones(dt) {
    const t = this.track, fog = this.scene?.fog;
    if (!t || !fog || !(dt > 0)) return;
    if (this._vizTrack !== t) {           // fresh world: reset all zone state
      // theme.weather is a SHARED module constant — hand back any squall
      // multiplier before letting go of it, or the x2 compounds next race
      if (this._vizRainW && this._vizBaseRain !== undefined) this._vizRainW.rate = this._vizBaseRain;
      this._vizTrack = t;
      this._vizRainW = null;
      this._vizBaseRain = undefined;
      this._vizZoneLast = null;
    }
    const p = this.player;
    let zone = null;
    if (t.vizZones && t.vizZones.length && p
        && (this.state === 'race' || this.state === 'finished' || this.state === 'paused')) {
      for (const z of t.vizZones) {
        const d = (p.trackIndex - z.i0 + t.N) % t.N;
        if (d <= z.len) { zone = z; break; }
      }
    }
    const baseNear = t.theme?.fogNear ?? 320;
    const baseFar = t.theme?.fogFar ?? 1500;
    let wantNear = baseNear, wantFar = baseFar;
    if (zone) {
      const s = zone.strength ?? 1;
      if (zone.kind === 'fogbank') { wantNear = 20; wantFar = 140 / s; }
      else if (zone.kind === 'squall') { wantNear = 40; wantFar = 180; }
      else { wantNear = 45; wantFar = 200; }   // forest: the gloom decal + trees do the rest
      wantFar = Math.min(baseFar, Math.max(110, wantFar));
      wantNear = Math.min(baseNear, wantNear);
      if (this._vizZoneLast !== zone
          && (this.raceTime ?? 0) - (this._vizFeedAt ?? -99) > 4) {
        this._vizFeedAt = this.raceTime ?? 0;
        this.hud?.feed?.(zone.kind === 'fogbank' ? 'FOG BANK'
          : zone.kind === 'squall' ? 'DOWNPOUR' : 'INTO THE TREES', 'info');
      }
    }
    this._vizZoneLast = zone;
    const k = Math.min(1, 2.2 * dt);      // ≈96% of the way in 1.5s, both directions
    fog.near += (wantNear - fog.near) * k;
    fog.far += (wantFar - fog.far) * k;
    // squalls double the downpour on top of the fog pull (rain worlds only —
    // that is why track.js only ever places 'squall' on a wet theme)
    const w = t.theme?.weather;
    if (w && w.type === 'rain') {
      if (this._vizRainW !== w) { this._vizRainW = w; this._vizBaseRain = w.rate ?? 230; }
      w.rate = this._vizBaseRain * (zone && zone.kind === 'squall' ? 2 : 1);
    }
  }
  // ---- end viz-zones -------------------------------------------------------

  /** Adaptive quality governor: if sustained fps sags mid-race, step down —
   *  render scale first, then shadows, then bloom — so weak phones self-tune
   *  instead of freezing. Never steps back up mid-session (no flip-flop). */
  _autoQuality() {
    // wall-clock window — the physics dt is clamped and lies at low fps
    const now = performance.now();
    if (this.state !== 'race') { this._fpsWin = now; this._fpsN = 0; return; }
    this._fpsWin ??= now;
    this._fpsN = (this._fpsN ?? 0) + 1;
    const span = now - this._fpsWin;
    if (span < 2500) return;
    const fps = this._fpsN / (span / 1000);
    this._fpsWin = now; this._fpsN = 0;
    if (fps >= 26 || (this._quality ?? 0) >= 3) return;
    const q = this._quality = (this._quality ?? 0) + 1;
    const baseDpr = Math.min(devicePixelRatio, this.isTouch ? 1.75 : 2);
    if (q === 1) {
      this.renderer.setPixelRatio(baseDpr * 0.75);
      this.composer.setSize(innerWidth, innerHeight);
    } else if (q === 2) {
      // This step used to switch the sun's shadow OFF, and that was one of the
      // two freezes. Changing the shadow-caster count rewrites every material's
      // program cache key, so three recompiles the ENTIRE scene inside one
      // render call — measured at 1.2 s of dead screen. Worse still, it fired
      // precisely when the frame rate was already struggling, which is the
      // moment a one-second stall is least affordable.
      //
      // Shrinking the map costs a texture reallocation and no shader work at
      // all: same caster count, same cache keys, same programs.
      const sh = this.moon.shadow;
      if (sh && sh.mapSize.width > 512) {
        sh.mapSize.set(512, 512);
        sh.map?.dispose();
        sh.map = null;                 // three rebuilds it at the new size
      }
    } else {
      this.bloom.enabled = false;
      this.renderer.setPixelRatio(Math.min(baseDpr, 1));
      this.composer.setSize(innerWidth, innerHeight);
    }
    this.hud?.feed?.(`AUTO QUALITY ${q}/3 — smoothing frame rate`, 'info');
  }
}

// Guard: a bad release once shipped two <script> tags for this module at two
// different ?v= URLs, so the browser loaded it twice and built two whole games
// on top of each other (duplicated menu chips, half the frame rate). One game.
if (!window.__game) window.__game = new Game();
// the world table, for the headless suites (swapLevel takes a level object)
window.__LEVELS = LEVELS;
window.__DIFFS = DIFFS;   // headless balance probes read the shipping table
window.__CARS = CAR_CATALOG;   // headless suites drive every machine in turn
window.__HOUSE_TEMPLATES = HOUSE_TEMPLATES;  // tests/test-buildings.mjs checks the shapes as data
window.__sync = { encodeSyncCode, decodeSyncCode, mergeSnapshots };  // tests/test-sync.mjs drives the engine directly
// test-affinity.mjs re-derives these from the live tracks and fails on drift
window.__DEMANDS = DEMANDS;
window.__DEMAND_BOUNDS = DEMAND_BOUNDS;
window.__paceEstimate = paceEstimate;
window.__rateCarsFor = rateCarsFor;
