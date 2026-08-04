// NEON STRIKE — 3D top-down racing shooter. All visuals procedural.
import * as THREE from 'three';
import { EffectComposer } from '../lib/postprocessing/EffectComposer.js';
import { RenderPass } from '../lib/postprocessing/RenderPass.js';
import { UnrealBloomPass } from '../lib/postprocessing/UnrealBloomPass.js';
import { OutputPass } from '../lib/postprocessing/OutputPass.js';
import { ShaderPass } from '../lib/postprocessing/ShaderPass.js';

import { Track, LEVELS, circuitPoints, disposeSubtree } from './track.js';
import { PlayerCar, EnemyCar, CAR_CATALOG, buildCarMesh } from './vehicles.js';
import { Chopper } from './choppers.js';
import { GunNest, Raider } from './hostiles.js';
import { Weapons } from './weapons.js';
import { Particles, SkidMarks } from './particles.js';
import { Hud, fmtTime } from './hud.js';
import { AudioEngine } from './audio.js';
import { Input } from './input.js';
import { glowTexture } from './textures.js';

const ENEMY_COUNT = 5;
const LAPS = 3;

const DIFFS = {
  easy:   { id: 'easy',   label: 'EASY',   aiSpeed: 0.88, aiAggression: 0.65, rubberBand: 1.25 },
  normal: { id: 'normal', label: 'NORMAL', aiSpeed: 1.0,  aiAggression: 1.0,  rubberBand: 1.0 },
  hard:   { id: 'hard',   label: 'HARD',   aiSpeed: 1.1,  aiAggression: 1.4,  rubberBand: 0.75 },
};

const UPGRADES = [
  { key: 'engine',   name: 'ENGINE WRENCH',     icon: '🔧', desc: '+4% top speed / lvl',       max: 5 },
  { key: 'handling', name: 'SUSPENSION SPRING', icon: '⚙️', desc: 'smoother steering / lvl',   max: 5 },
  { key: 'tires',    name: 'TIRES STACK',       icon: '🛞', desc: '+4% grip / lvl',            max: 5 },
  { key: 'nitro',    name: 'BOOST NITRO CAN',   icon: '⚡', desc: '+22% nitro charge / lvl',   max: 5 },
  { key: 'armor',    name: 'ARMOR SHIELD',      icon: '🛡️', desc: '+15 max hull / lvl',        max: 5 },
  { key: 'cannon',   name: 'CANNON CORE',       icon: '🔥', desc: '+18% cannon damage / lvl',  max: 5 },
];

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
};

// steer: how much of the car's steering rate the player gets in this view.
// From above, a yaw change moves the car against a fixed world and reads as
// exactly what it is. From behind, the camera yaws WITH the car, so the whole
// scene swings and the same rate reads as twitchy — the correction you make is
// always slightly too much, and you saw-saw down the road. The chase views
// therefore drive on a calmer rack. Only the player is scaled; the AI keeps
// its own rate so the field stays as quick as it ever was.
const CAM_MODES = [
  { name: 'TOP-DOWN',  back: 20, h: 52, look: 7,  lookH: 0,   spdBack: 6, spdH: 10, steer: 1 },
  { name: 'TOP FAR',   back: 24, h: 84, look: 1,  lookH: 0,   spdBack: 4, spdH: 10, steer: 1 },
  // CHASE sat at h 7.5 / back 13 / look 10 — down at bumper height and close
  // enough that the car filled the screen, so you could not see far enough up
  // the road to place the next corner ("super hard to drive in this camera
  // mode"). Lifted and pulled back, and the look-ahead point pushed well down
  // the road: you now see the corner before you are in it.
  { name: 'CHASE',     back: 17, h: 11.5, look: 19, lookH: 3.2, spdBack: 4, spdH: 2, chase: true, steer: 0.76 },
  { name: 'CHASE FAR', back: 26, h: 17,   look: 22, lookH: 3.4, spdBack: 4, spdH: 2, chase: true, steer: 0.84 },
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

const CREDIT_RATE = 1 / 12;                // score -> credits
const PODIUM_CR = [200, 120, 60];          // 1st / 2nd / 3rd
const FIRST_CLEAR_CR = 500;                // once per world, on your first podium
// Upgrades escalate QUADRATICALLY: 800 / 1,600 / 4,000 / 8,000 / 13,600 —
// 28,000 to max one line, against ~1,300 CR for a win. The old linear
// 500+400×lvl put a fully maxed line five races away, which made every car
// converge on the same maxed-out feel almost immediately. Steepening the tail
// rather than raising the entry keeps the first upgrade an easy, satisfying
// buy while the last one is a genuine target — and it forces a real choice
// about WHICH line to pour credits into, per car.
const upgradeCost = (lvl) => 800 + lvl * lvl * 800;

// ---- race contracts ----
// Every race offers 3 side objectives that pay flat credits on completion, so
// income has texture and skilled play earns a margin — WITHOUT retuning the
// settled rates above. All checks read existing signals only: the style()
// event labels, this.deaths/kills, per-race counters accumulated in this._ct.
// `gate` filters offers that a world/difficulty can't honor; `lap: true`
// contracts resolve at lap boundaries; `atFinish` ones resolve in finishRace.
const CONTRACT_POOL = [
  { id: 'cleanlap', label: 'CLEAN LAP',      pay: 100, desc: 'a full lap without hull damage', lap: true },
  { id: 'untouch',  label: 'UNTOUCHABLE',    pay: 120, desc: 'finish without wrecking',
    atFinish: true, check: (g) => g.deaths === 0 },
  // `sure: true` marks contracts any driver can complete by active play in any
  // world, whatever the race outcome — the offer always includes at least one.
  { id: 'demo',     label: 'DEMOLITION',     pay: 60,  desc: 'smash 12 props', sure: true,
    check: (g, ct) => ct.props >= 12, prog: (ct) => `${Math.min(ct.props, 12)}/12` },
  { id: 'head',     label: 'HEADHUNTER',     pay: 90,  desc: 'destroy 2 rivals',
    check: (g, ct) => ct.rivalKills >= 2, prog: (ct) => `${Math.min(ct.rivalKills, 2)}/2` },
  { id: 'combo',    label: 'COMBO ARTIST',   pay: 70,  desc: 'reach a ×2.5 style combo', sure: true,
    check: (g, ct) => ct.comboMax >= 2.5 },
  { id: 'draft',    label: 'DRAFT KING',     pay: 60,  desc: '3 slipstream tucks', sure: true,
    check: (g, ct) => ct.drafts >= 3, prog: (ct) => `${Math.min(ct.drafts, 3)}/3` },
  { id: 'air',      label: 'AIRBORNE',       pay: 60,  desc: '2 BIG AIR jumps',
    check: (g, ct) => ct.bigAirs >= 2, prog: (ct) => `${Math.min(ct.bigAirs, 2)}/2` },
  { id: 'hardpod',  label: 'PODIUM ON HARD', pay: 150, desc: 'top 3 on HARD',
    gate: (g) => g.difficulty.id === 'hard', atFinish: true, check: (g, ct, rank) => rank <= 3 },
  { id: 'pacifist', label: 'PACIFIST',       pay: 130, desc: 'podium with zero weapon fire',
    atFinish: true, check: (g, ct, rank) => rank <= 3 && !ct.weaponFired },
  { id: 'start',    label: 'FLAWLESS START', pay: 80,  desc: 'lead at the end of lap 1', lap: true },
  { id: 'herd',     label: 'HERDSMAN',       pay: 50,  desc: 'never hit livestock',
    gate: (g) => (g.herds?.length ?? 0) > 0, atFinish: true, check: (g, ct) => ct.livestock === 0 },
  { id: 'shave',    label: 'CLOSE SHAVE',    pay: 60,  desc: '3 CLOSE CALL passes',
    check: (g, ct) => ct.closeCalls >= 3, prog: (ct) => `${Math.min(ct.closeCalls, 3)}/3` },
];

// which animals graze in which biome (a theme can override with T.livestock).
// Each pasture takes a LEAD species from its roster and the roster shifts from
// world to world; roughly a quarter of each herd is the next species along, so
// neither a field nor a world reads as a monoculture. Rosters are
// biome-plausible only — camels in the dunes, capybaras (never cows) in the
// Amazon, goats on the canyon ledges. Themes with no entry (volcano, neon,
// undercity) simply have no grazing herds.
const LIVESTOCK_BY_THEME = {
  forest:   { kinds: ['cow', 'sheep', 'boar'], perHerd: 4 },
  alpine:   { kinds: ['cow', 'sheep', 'goat'], perHerd: 4 },
  pass:     { kinds: ['cow', 'goat', 'sheep'], perHerd: 5 },
  tremola:  { kinds: ['sheep', 'goat', 'cow'], perHerd: 4 },
  furka:    { kinds: ['goat', 'sheep'],        perHerd: 3 },
  redwood:  { kinds: ['deer', 'boar'],         perHerd: 3 },
  wildfire: { kinds: ['deer', 'boar'],         perHerd: 2 },
  snow:     { kinds: ['deer'],                 perHerd: 3 },
  glacial:  { kinds: ['deer'],                 perHerd: 2 },
  sheetice: { kinds: ['deer'],                 perHerd: 2 },
  avalanche:{ kinds: ['deer'],                 perHerd: 2 },
  desert:   { kinds: ['camel', 'goat'],        perHerd: 3 },
  dunes:    { kinds: ['camel'],                perHerd: 3 },
  canyon:   { kinds: ['goat', 'camel'],        perHerd: 3 },
  ravine:   { kinds: ['goat'],                 perHerd: 2 },
  oasis:    { kinds: ['camel', 'goat', 'cow'], perHerd: 3 },
  jungle:   { kinds: ['capybara', 'boar', 'deer'], perHerd: 3 },
  flume:    { kinds: ['deer', 'cow', 'boar'],  perHerd: 3 },
};

// hazard particle tints (hoisted — per-frame spawns must not allocate)
const AVA_WHITE = new THREE.Color(0xf4faff);
const GEYSER_SAND = new THREE.Color(0xd8b878);

const loadJSON = (key, fallback) => {
  try { return { ...fallback, ...JSON.parse(localStorage.getItem(key) || '{}') }; }
  catch { return { ...fallback }; }
};
const saveJSON = (key, obj) => { try { localStorage.setItem(key, JSON.stringify(obj)); } catch { /* private mode */ } };

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
const DEMANDS = {
  1:  { loose: 0.55, twist: 0.45, fast: 0.17, climb: 0.31 }, // PINE VALLEY
  2:  { loose: 0.18, twist: 0.04, fast: 0.52, climb: 0.67 }, // DUST CANYON
  3:  { loose: 1.00, twist: 0.75, fast: 0.24, climb: 0.77 }, // FROST PEAK
  4:  { loose: 0.12, twist: 0.75, fast: 0.00, climb: 0.21 }, // CANYON RUN
  5:  { loose: 0.12, twist: 0.30, fast: 0.18, climb: 0.79 }, // EMBER PASS
  6:  { loose: 0.12, twist: 0.45, fast: 0.71, climb: 0.69 }, // SUMMIT CLIMB
  7:  { loose: 1.00, twist: 0.52, fast: 0.21, climb: 0.44 }, // GLACIAL PASS
  8:  { loose: 0.55, twist: 0.62, fast: 0.16, climb: 0.26 }, // AMAZON RAPIDS
  9:  { loose: 0.18, twist: 0.26, fast: 0.14, climb: 0.74 }, // THE DUNE SERPENT
  10: { loose: 0.12, twist: 1.00, fast: 0.10, climb: 0.18 }, // ROCKFALL RAVINE
  11: { loose: 0.18, twist: 0.35, fast: 0.19, climb: 0.21 }, // OASIS AMBUSH
  12: { loose: 0.12, twist: 0.22, fast: 0.20, climb: 1.00 }, // REDWOOD RAMPAGE
  13: { loose: 0.12, twist: 0.00, fast: 1.00, climb: 0.54 }, // LOG FLUME FURY
  14: { loose: 0.12, twist: 0.27, fast: 0.25, climb: 0.69 }, // FOREST FIRE ESCAPE
  15: { loose: 1.00, twist: 0.52, fast: 0.07, climb: 0.36 }, // GLACIER'S GRIND
  16: { loose: 1.00, twist: 0.37, fast: 0.25, climb: 0.26 }, // AVALANCHE ALLEY
  17: { loose: 0.55, twist: 0.01, fast: 0.69, climb: 0.33 }, // NEON GRID
  18: { loose: 0.12, twist: 0.78, fast: 0.10, climb: 0.00 }, // UNDERCITY
  19: { loose: 0.12, twist: 0.85, fast: 0.41, climb: 0.56 }, // GOTTHARD CLIMB
  20: { loose: 0.12, twist: 0.81, fast: 0.47, climb: 0.62 }, // TREMOLA DESCENT
  21: { loose: 1.00, twist: 0.64, fast: 0.62, climb: 0.51 }, // FURKA RIDGE
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
  const out = new Map();
  for (const r of rows) {
    const score = 1 - (r.est.seconds - best) / span;      // 1 = quickest here
    const tier = score >= 0.66 ? 'strong' : score >= 0.3 ? 'fair' : 'weak';
    const behind = r.est.seconds - best;
    let note;
    if (tier === 'strong') {
      note = surf === 'snow' ? 'HOLDS THE LOOSE STUFF'
        : surf === 'wet' ? 'SURE-FOOTED IN THE WET' : 'SUITED TO THIS CIRCUIT';
    } else if (tier === 'weak') {
      note = surf === 'snow' || surf === 'wet'
        ? `SLIDES HERE — ${Math.round(behind)}s A LAP` : `OFF THE PACE — ${Math.round(behind)}s A LAP`;
    } else {
      note = `${behind < 0.5 ? 'ON' : `${Math.round(behind)}s OFF`} THE PACE`;
    }
    out.set(r.car.key, { score, tier, note, seconds: r.est.seconds,
      stars: 1 + Math.round(score * 4), behind });
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

    // level selection via URL (?level=N), with ?go=1 for seamless chained starts
    const params = new URLSearchParams(location.search);
    this.levelIndex = Math.min(Math.max((parseInt(params.get('level')) || 1) - 1, 0), LEVELS.length - 1);
    this.level = LEVELS[this.levelIndex];
    this.autoStart = params.get('go') === '1';

    // progression + difficulty + garage (persisted PER PROFILE — several
    // players keep separate careers on one device; settings stay shared)
    this.profiles = loadProfiles();
    this._loadProfileState();
    // mode comes from the URL only — a fresh visit ALWAYS starts in RACE mode
    // (persisting roam silently made races "never finish" for returning players)
    this.freeRoam = params.get('mode') === 'roam';
    // [MISSIONS] mode=missions rides on the roam machinery (open world, no
    // rivals) but layers structured objectives on top — see the MISSIONS block.
    this.missionMode = params.get('mode') === 'missions';
    if (this.missionMode) this.freeRoam = true;
    this.steerSetting = localStorage.getItem('ir-steer') || 'normal';
    this.controlScheme = localStorage.getItem('ir-controls') === 'two' ? 'two' : 'one';
    // touch players get the aid by default — thumbs are coarser than keys
    this.assistSetting = localStorage.getItem('ir-assist')
      || (matchMedia('(pointer: coarse)').matches ? 'assist' : 'standard');
    this.unlockAll = params.get('unlockall') === '1';
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
      uniforms: { tDiffuse: { value: null }, uVig: { value: 0.30 }, uSat: { value: 1.07 }, uCon: { value: 1.05 }, uAber: { value: 0.0017 } },
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
    this.track = new Track(this.scene, this.level);
    this._applyTheme();
    this.particles = new Particles(this.scene);
    this.particles.setTheme?.(this.level?.theme); // smashed barrels shed the theme's own stave/hoop colours
    this.skids = new SkidMarks(this.scene);
    this.husks = [];      // charred wreck shells left where cars died
    this.hitStop = 0;     // slow-motion timer after a brutal impact
    this.fovKick = 0;     // camera punch on the same impacts
    this.audio = new AudioEngine();
    this.input = new Input();
    this.lapsTotal = LAPS;
    this.contractPool = CONTRACT_POOL; // exposed for the headless suites

    const carEntry = CAR_CATALOG.find((c) => c.key === this.cars.selected) || CAR_CATALOG[0];
    this.player = new PlayerCar(this, carEntry);
    this.enemies = [];
    for (let i = 0; i < ENEMY_COUNT; i++) this.enemies.push(new EnemyCar(this, i));
    this.weapons = new Weapons(this);
    this.hud = new Hud(this);
    this.choppers = [];
    // ground enemies — gun nests dug in beside the road, raiders that hunt
    this.hostiles = [];
    this.props = this.track.props ? [...this.track.props] : [];
    this.flyingProps = [];
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
      this.camera.aspect = innerWidth / innerHeight;
      this.baseFov = innerHeight > innerWidth ? 68 : 56; // widen for portrait phones
      this.camera.fov = this.baseFov;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(innerWidth, innerHeight);
      this.composer.setSize(innerWidth, innerHeight);
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

    // camera + pause buttons (work with mouse and touch)
    document.getElementById('cam-btn').addEventListener('click', () => this.cycleCamera());
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
      ].filter(([b, p]) => b && p);
      for (const [btn, panel] of tabs) {
        btn.addEventListener('click', () => {
          for (const [b, p2] of tabs) {
            b.classList.toggle('current', b === btn);
            p2.classList.toggle('off', p2 !== panel);
          }
        });
      }
    }

    this._renderLevelCards();

    // mode chips: RACE | FREE ROAM | MISSIONS
    const msel = document.getElementById('mode-select');
    msel.innerHTML = ''; // never append into a row that might already hold chips
    const curMode = this.missionMode ? 'missions' : this.freeRoam ? 'roam' : 'race';
    for (const [id, label] of [['race', '🏁 RACE'], ['roam', '🌍 FREE ROAM'], ['missions', '🎯 MISSIONS']]) {
      const chip = document.createElement('button');
      chip.className = 'mode-chip' + (id === curMode ? ' current' : '');
      chip.dataset.mode = id;
      chip.textContent = label;
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
          this.input.steerOnly = this.controlScheme === 'two';
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
    document.getElementById('pm-restart').addEventListener('click', () => {
      closeMenu();
      this.resetRace();
      this.startRace();
    });
    document.getElementById('pm-exit').addEventListener('click', () => {
      if (this.freeRoam) this.bankRoamCredits();
      this.showMenu();
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
    if (this.state !== 'title') this.hud.feed(`CAMERA: ${CAM_MODES[this.camMode].name}`, 'info');
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
  _warmShaders() {
    if (!this.renderer?.compile) return;
    const hidden = [];
    try {
      this.scene.traverse((o) => {
        if (o.visible === false) { hidden.push(o); o.visible = true; }
      });
      const t0 = performance.now();
      this.renderer.compile(this.scene, this.camera);
      this.__warmMs = Math.round(performance.now() - t0);
      this.__warmProgs = this.renderer.info.programs?.length ?? -1;
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
   *  Returns false if the level isn't playable, leaving the current one up. */
  swapLevel(level) {
    if (!level || this.state === 'race' || this.state === 'countdown') return false;
    const same = this.level && this.level.id === level.id;
    if (same) return true;

    this.level = level;
    this.levelIndex = Math.max(0, LEVELS.findIndex((l) => l.id === level.id));

    // --- tear down ---
    for (const gsp of this.missionGates ?? []) this.worldLayer.remove(gsp.spr);
    this.missionGates = null;
    this.flyingProps = [];
    this.husks = [];
    this._resetFlashes();                  // pool lights live in the scene, not here
    disposeSubtree(this.worldLayer);       // pickups, herds, stars, hazards, debris
    this.track.dispose();
    this.skids?.reset?.();
    this.particles?.reset?.();

    // --- build the new world ---
    this.track = new Track(this.scene, this.level);
    this._applyTheme();
    this.particles?.setTheme?.(this.level.theme);

    this.props = this.track.props ? [...this.track.props] : [];
    this.chopperTimer = 0;
    this.chopperWave = 0;
    for (const c of this.choppers ?? []) this.worldLayer.remove(c.mesh);
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
    this._warmShaders();   // a new world means new materials — pay for them now
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

  /** (Re)read everything scoped to the ACTIVE PROFILE — career, purse, garage.
   *  Lifted out of the constructor so changing driver is a state reload rather
   *  than a page reload. */
  _loadProfileState() {
    this.profile = this.profiles.list.find((p) => p.id === this.profiles.active) ?? this.profiles.list[0];
    this._pkey = (base) => profileKey(this.profile.id, base);
    this.career = loadJSON(this._pkey('career'), { finished: {} });
    this.garage = loadJSON(this._pkey('garage'), { credits: 0 });
    this.cars = loadJSON(this._pkey('cars'), { owned: [STARTER_CAR], selected: STARTER_CAR });
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
    for (const c of this.choppers ?? []) this.worldLayer.remove(c.mesh);
    this.choppers = [];
    for (const s of this.roamStars ?? []) s.spr?.parent?.remove(s.spr);
    this.roamStars = [];
    this.chopperTimer = 0;
    this.chopperWave = 0;
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
    const start = document.getElementById('start-btn');
    if (start) {
      start.textContent = this.missionMode ? 'START MISSION'
        : this.freeRoam ? 'START EXPLORING' : 'START RACE';
    }
    if (this.missionMode) this._buildMissionPicker?.(); // also sets its own label
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
    this._softURL();
  }

  /** Push the current track's theme into the renderer: fog, the two lights,
   *  the key direction and the IBL dome. Split out of the constructor because
   *  swapping level has to redo every one of these — a new world under the old
   *  world's fog and sun is exactly the "it still looks like the last track"
   *  bug this would otherwise ship with. */
  _applyTheme() {
    const th = this.track.theme;
    if (th) {
      if (th.fogColor !== undefined) this.scene.fog = new THREE.Fog(th.fogColor, th.fogNear ?? 320, th.fogFar ?? 1500);
      if (th.hemiSky !== undefined) this.hemi.color.setHex(th.hemiSky);
      if (th.hemiGround !== undefined) this.hemi.groundColor.setHex(th.hemiGround);
      if (th.hemiIntensity !== undefined) this.hemi.intensity = th.hemiIntensity;
      if (th.sunColor !== undefined) this.moon.color.setHex(th.sunColor);
      if (th.sunIntensity !== undefined) this.moon.intensity = th.sunIntensity;
      // key direction agrees with the sun the player can actually see
      if (th.sunAz !== undefined) {
        const az = th.sunAz;
        const el = THREE.MathUtils.clamp((th.sunEl ?? 0.3) * 0.55 + 0.52, 0.58, 0.81);
        const D = 168;
        this._sunOffset.set(
          Math.cos(az) * Math.cos(el) * D, Math.sin(el) * D, Math.sin(az) * Math.cos(el) * D
        );
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
    p.maxSpeed = entry.stats.maxSpeed;
    p.accel = entry.stats.accel;
    p.grip = entry.stats.grip;
    p.maxHealth = entry.stats.health;
    p.offroadSkill = entry.stats.offroad;
    p.nitroPower = entry.stats.nitroPower ?? 1;
    p.plating = entry.stats.plating ?? 1;
    this._base = null; // applyUpgrades recaptures the new machine's baseline
    this.applyUpgrades();
    p.health = p.maxHealth;
  }

  isLevelUnlocked(id) {
    // a world unlocks only after a PODIUM (top 3) finish on the one before
    const prev = this.career.finished[id - 1];
    return this.unlockAll || id === 1 || (!!prev && prev.place <= 3);
  }

  /** World cards: static circuit-outline badge + flavor + career best per
   *  level, grouped under region headers (region order = first appearance).
   *  The .wc-map badge is card decoration ONLY — never a HUD map (RULES §0).
   *  Rebuildable, because a career reset changes every lock and every best. */
  _renderLevelCards() {
    const sel = document.getElementById('level-select');
    if (!sel) return;
    sel.innerHTML = '';
    const regionRows = new Map();
    const rowFor = (lv) => {
      const rg = lv.region || 'CHAMPIONSHIP';
      let row = regionRows.get(rg);
      if (!row) {
        const head = document.createElement('div');
        head.className = 'region-head';
        head.textContent = rg;
        sel.appendChild(head);
        row = document.createElement('div');
        row.className = 'region-row';
        sel.appendChild(row);
        regionRows.set(rg, row);
      }
      return row;
    };
    LEVELS.forEach((lv, i) => {
      const card = document.createElement('button');
      const unlocked = this.isLevelUnlocked(lv.id);
      card.className = 'level-chip'
        + (i === this.levelIndex ? ' current' : '')
        + (unlocked ? '' : ' locked');
      const best = this.career.finished[lv.id];
      const bestTxt = best
        ? `BEST: ${['1ST', '2ND', '3RD', '4TH', '5TH', '6TH'][best.place - 1] || best.place + 'TH'}`
        : (unlocked ? '★ UNRACED' : '');
      card.innerHTML = `<div class="wc-shot" style="background-image:url('assets/previews/w${lv.id}.jpg')">
          <canvas class="wc-map" width="72" height="52"></canvas>
        </div>
        <div class="wc-name">${unlocked ? '' : '🔒 '}${lv.name}</div>
        <div class="wc-tags">${WORLD_TAGS[lv.theme] || ''}</div>
        ${unlocked ? this._affinityChip(lv.id) : ''}
        <div class="wc-best${best ? '' : ' new'}">${bestTxt}</div>`;
      this._drawCircuitMap(card.querySelector('.wc-map'), lv.theme, !unlocked, i === this.levelIndex);
      card.addEventListener('click', () => {
        if (i === this.levelIndex) return;
        if (!this.isLevelUnlocked(lv.id)) {
          card.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-5px)' },
            { transform: 'translateX(5px)' }, { transform: 'translateX(0)' }], { duration: 200 });
          return;
        }
        // Swap the world under the menu instead of navigating. Falls back to
        // the old reload only if the swap declines (mid-race), so picking a
        // track can never leave you stuck on the one you were leaving.
        if (this.swapLevel(lv)) {
          this._renderLevelCards();      // repaint which card is current
          this.renderCarShop();          // the garage ratings are per-world
          this._buildMissionPicker?.();  // missions are per-world
        } else {
          this.fadeTo(`?level=${lv.id}${this.unlockAll ? '&unlockall=1' : ''}`);
        }
      });
      rowFor(lv).appendChild(card);
    });
  }

  /** The named car's own upgrade levels — upgrades belong to one machine. */
  carUpgrades(carKey = this.cars.selected) {
    const g = this.garage;
    g.upgrades ??= {};
    const up = g.upgrades[carKey] ??= {};
    for (const u of UPGRADES) up[u.key] ??= 0;
    return up;
  }

  /** Apply the SELECTED car's purchased upgrades to the player (base stats
   *  captured once per machine — swapPlayerCar clears the capture). */
  applyUpgrades() {
    const p = this.player;
    if (!this._base) this._base = { maxSpeed: p.maxSpeed, maxHealth: p.maxHealth };
    const g = this.carUpgrades();
    p.maxSpeed = this._base.maxSpeed * (1 + 0.04 * g.engine);
    p.maxHealth = this._base.maxHealth + 15 * g.armor;
    p.health = p.maxHealth;
    p.cannonDamage = 7 * (1 + 0.18 * g.cannon);
    p.nitroRate = 1 + 0.22 * g.nitro;
    p.handling = 0.2 * (g.handling || 0);
    p.gripBoost = 1 + 0.04 * (g.tires || 0);
    p.steerSense = { relaxed: 0.8, normal: 1.0, sharp: 1.25 }[this.steerSetting] || 1.0;
    p.assist = { pro: 0, standard: 0.5, assist: 1 }[this.assistSetting] ?? 0.5;
  }

  /** Draw a smoothed closed track outline on a world-card canvas. */
  _drawCircuitMap(cnv, themeKey, locked, current) {
    const pts = circuitPoints(themeKey);
    const ctx = cnv.getContext('2d');
    const W = cnv.width, H = cnv.height, pad = Math.max(5, W * 0.08);
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
  _carIcons() {
    if (this.__carIcons) return this.__carIcons;
    const W = 148, H = 96;
    const r = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    r.setSize(W, H);
    r.setPixelRatio(2);
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.12;
    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(30, W / H, 0.1, 60);
    cam.position.set(5.2, 3.2, 6.2);
    cam.lookAt(0, 0.55, 0);
    scene.add(new THREE.HemisphereLight(0xbfe0ff, 0x6a5a44, 1.15));
    const sun = new THREE.DirectionalLight(0xfff3d6, 2.2);
    sun.position.set(4, 7, 5);
    scene.add(sun);
    const icons = {};
    for (const car of CAR_CATALOG) {
      const mesh = buildCarMesh(car.spec);
      mesh.rotation.y = Math.PI * 0.82; // 3/4 front view
      scene.add(mesh);
      r.render(scene, cam);
      icons[car.key] = r.domElement.toDataURL();
      scene.remove(mesh);
    }
    r.dispose();
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
      const owned = this.cars.owned.includes(car.key);
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
          ${bar('SPD', S.maxSpeed, 54, 63)}${bar('ACC', S.accel, 34, 40)}
          ${bar('GRP', S.grip, 4.2, 5.6)}${bar('ARM', S.health / (S.plating ?? 1), 80, 170)}
          ${bar('OFF', S.offroad, 0.4, 1)}${bar('NTR', S.nitroPower ?? 1, 0.85, 1.2)}
        </div>
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
        saveJSON(this._pkey('cars'), this.cars);
        // live swap — no reload, the menu stays exactly where you are
        this.swapPlayerCar(car);
        this.renderCarShop();
        this.renderGarage();
        this._renderLevelCards();   // every track card names your car — repaint
        this.hud.feed?.(`NOW DRIVING: ${car.name}`, 'good');
      });
      shop.appendChild(card);
    }
  }

  renderGarage() {
    document.getElementById('credits').textContent = this.garage.credits.toLocaleString();
    // the panel shows and edits the SELECTED car's own levels
    const up = this.carUpgrades();
    const carName = CAR_CATALOG.find((c) => c.key === this.cars.selected)?.name ?? '';
    const head = document.getElementById('garage-up-head');
    if (head) head.textContent = `DETAILED UPGRADES — ${carName}`;
    const rows = document.getElementById('garage-rows');
    rows.innerHTML = '';
    for (const u of UPGRADES) {
      const lvl = up[u.key];
      const row = document.createElement('div');
      row.className = 'up-row';
      const pips = Array.from({ length: u.max },
        (_, i) => `<span class="${i < lvl ? '' : 'off'}">●</span>`).join('');
      row.innerHTML = `<div class="ic">${u.icon}</div>
        <div class="nm">${u.name}<small class="up-lvl">LEVEL ${lvl}/${u.max}</small><small>${u.desc}</small></div>
        <div class="pips">${pips}</div>`;
      const btn = document.createElement('button');
      btn.className = 'up-buy' + (lvl >= u.max ? ' maxed' : '');
      if (lvl >= u.max) {
        btn.textContent = 'MAX';
        btn.disabled = true;
      } else {
        const cost = upgradeCost(lvl);
        btn.textContent = `${cost} CR`;
        btn.disabled = this.garage.credits < cost;
        btn.addEventListener('click', () => {
          if (this.garage.credits < cost) return;
          this.garage.credits -= cost;
          up[u.key]++; // this car only — every other machine keeps its own build
          saveJSON(this._pkey('garage'), this.garage);
          this.applyUpgrades();
          this.renderGarage();
        });
      }
      row.appendChild(btn);
      rows.appendChild(row);
    }
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
      const career = loadJSON(profileKey(p.id, 'career'), { finished: {} });
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
    const cap = reg.list.length >= MAX_PROFILES;
    document.getElementById('profile-create').style.display = cap ? 'none' : '';
    document.getElementById('profile-cap-note').style.display = cap ? '' : 'none';
    this._renderSwatches();
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
    this.career = { finished: {} };
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
          this.hud.feed('+2 MISSILES', 'good');
        } else if (p.type === 'nitro') {
          pl.nitro = Math.min(1, pl.nitro + 0.45 * (pl.nitroRate || 1));
          this.hud.feed('+NITRO CHARGE', 'good');
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
    const picks = arr.slice(0, 3);
    // never deal three long-shots: at least one slot is a `sure` contract any
    // driver can actively complete regardless of world or finishing position
    if (!picks.some((c) => c.sure)) {
      const sure = arr.slice(3).filter((c) => c.sure);
      if (sure.length) picks[2] = sure[(rnd() * sure.length) | 0];
    }
    return picks.map((c) => ({ ...c, done: false }));
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
    // hull-damage detection for CLEAN LAP: any health drop marks the lap
    // (regen/pickups only ever raise it, so a drop is always damage)
    if (ct.prevHealth !== null && p.alive && p.health < ct.prevHealth - 1e-3) ct.lapDamaged = true;
    ct.prevHealth = p.alive ? p.health : null;
    // style-combo high-water mark
    if ((this.comboT ?? 0) > 0) {
      ct.comboMax = Math.max(ct.comboMax, Math.min(4, 1 + (this.comboN ?? 0) * 0.25));
    }
    for (const c of this.contracts) {
      if (!c.done && !c.atFinish && c.check && c.check(this, ct)) this._completeContract(c);
    }
    this.hud.setContracts?.(this.contracts, ct); // diffed inside — cheap
  }

  _completeContract(c) {
    if (c.done) return;
    c.done = true;
    this.contractCredits = (this.contractCredits ?? 0) + c.pay;
    this.hud.feed(`CONTRACT: ${c.label}  +${c.pay} CR`, 'good');
    this.hud.setContracts?.(this.contracts, this._ct);
    this.audio.pickup?.();
    this.buzz([20, 30, 20]);
  }

  _tryContract(id) {
    const c = this.contracts?.find((x) => x.id === id && !x.done);
    if (c) this._completeContract(c);
  }

  /** Lap `lapNo` just completed — resolve the lap-boundary contracts. */
  _lapContracts(lapNo) {
    const ct = this._ct;
    if (!this.contracts?.length || !ct) return;
    if (!ct.lapDamaged) this._tryContract('cleanlap');
    ct.lapDamaged = false;
    if (lapNo === 1 && this.playerRank === 1) this._tryContract('start');
  }

  _checkFinishContracts(rank) {
    if (!this.contracts?.length || !this._ct) return;
    for (const c of this.contracts) {
      if (!c.done && c.atFinish && c.check(this, this._ct, rank)) this._completeContract(c);
    }
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
    sel.innerHTML = '<div class="panel-head">ARENA MISSIONS</div>';
    for (const d of defs) {
      const b = best[`${this.level.id}:${d.id}`] | 0;
      const chip = document.createElement('button');
      chip.className = 'mission-chip' + (d.id === this.missionSel ? ' current' : '');
      const chips = missionTargetChips(d).map((c) => `<span class="mstat">${c}</span>`).join('');
      chip.innerHTML = `<span class="mi">${d.icon}</span>
        <span class="mtext">
          <span class="mhead"><span class="mname">${d.name}</span>
            <span class="mmedal${b ? '' : ' none'}">${b ? MISSION_MEDAL[b] : 'NEW'}</span></span>
          <span class="mdesc">${d.desc}</span>
          <span class="mstats">${chips}<span class="mstat mpay">🎖 ${MISSION_CR[1]}–${MISSION_CR[3]} CR</span></span>
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
    for (const e of this.enemies) { e.alive = false; e.mesh.visible = false; }
    this._raceChopper = true; // blocks the final-lap race-chopper path
    this.mission = {
      def, count: 0, elapsed: 0, started: false, over: false,
      timed: def.time > 0, tLeft: def.time, warn10: false, spawnT: 0, tier: 0,
    };
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
      document.getElementById('results').classList.remove('hidden');
      this.hud.hide();
      document.getElementById('touch-ui').classList.remove('on');
    }, 1400);
  }

  /** Called from resetRace: mission state never survives into the next run. */
  _missionReset() {
    if (!this.missionMode) return;
    this.mission = null;
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

  _spawnFaller(T) {
    const t = this.track;
    const idx = (this.player.trackIndex + 40 + Math.floor(Math.random() * 45)) % t.N;
    const lat = (Math.random() - 0.5) * 13;
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
      for (let i = 0; i < 3; i++) {
        const s = 1.0 + Math.random() * 0.8;
        const b = new THREE.Mesh(new THREE.BoxGeometry(s, s, s),
          new THREE.MeshStandardMaterial({ color: 0x8a6a4c, roughness: 0.95 }));
        b.position.set((Math.random() - 0.5) * 0.9, (Math.random() - 0.5) * 0.7, (Math.random() - 0.5) * 0.9);
        b.rotation.y = Math.random() * 1.5;
        mesh.add(b);
      }
    }
    const startY = p.y + (kind === 'icicle' ? 16 : 30);
    mesh.position.set(p.x, startY, p.z);
    this.worldLayer.add(mesh);
    this.fallers.push({ kind, x: p.x, z: p.z, y: startY, groundY: p.y, vy: 0,
      dmg: T.fallHazard.dmg ?? 20, mesh, landed: false, ttl: 18, solid: null });
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
      if (!f.landed) {
        f.vy += 26 * dt;
        f.y -= f.vy * dt;
        f.mesh.position.y = f.y;
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
          this.particles.debris({ x: f.x, y: f.groundY + 0.5, z: f.z }, 4);
          if (f.kind === 'icicle') { // shatters — no lasting obstacle
            this.particles.splinters(f.mesh.position, new THREE.Vector3(0, 1, 0), [0xcfe8f4, 0x8fd0e8], 0.7);
            this.scene.remove(f.mesh);
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
          this.scene.remove(f.mesh);
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
      this.scene.remove(f.mesh);
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
    this.hostiles = this.hostiles || [];
    const t = this.track;
    // Combat furniture belongs in the combat modes. A rally is a rally: there
    // is nothing to shoot at you on a stage, and being shot at by scenery you
    // cannot answer is not difficulty, it is noise.
    if (!t || !this.freeRoam) return;
    // Same argument one level down. Four of the five missions are driving
    // tests against a clock — a HOT LAP or a RAMPAGE run does not want roadside
    // machine guns any more than a rally stage does. Only SURVIVOR, which is
    // explicitly an assault, gets them; they are built when it launches.
    if (this.missionMode) return;
    this._digGunNests(5);
  }

  /** Place n nests around the circuit, off the racing line. Bypasses the mode
   *  gate above — SURVIVOR calls it directly when the assault mission starts. */
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
   *  arrives in the mirrors rather than materialising in front of you. */
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
    // ...and raiders likewise: they hunt in free roam, not down a rally stage
    if (this.state === 'race' && this.freeRoam && !this.missionMode) {
      this._raiderTimer = (this._raiderTimer ?? 25) - dt;
      const live = this.hostiles.filter((h) => h.alive && h instanceof Raider).length;
      if (this._raiderTimer <= 0 && live < 2) {
        this._raiderTimer = 45;
        this._spawnRaider();
      }
    }
    for (const h of this.hostiles) if (h.alive) h.update(dt);
    this.hostiles = this.hostiles.filter((h) => h.alive);
  }

  _updateChoppers(dt) {
    if (this.state === 'race') {
      if (this.freeRoam && !this.missionMode) { // [MISSIONS] missions run their own spawner
        this.chopperTimer -= dt;
        if (this.chopperTimer <= 0 && this.choppers.filter((c) => c.alive).length < 3) {
          this._spawnChopper();
          this.chopperTimer = 40;
        }
      } else if (!this._raceChopper && this.difficulty.id !== 'easy' && this.player.lap >= this.lapsTotal) {
        // final-lap air support keeps the leaders honest
        this._raceChopper = true;
        this._spawnChopper();
      }
    }
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
      if (f.life <= 0 || f.mesh.position.y < -3) {
        (f.mesh.parent ?? this.scene).remove(f.mesh);
        this.flyingProps.splice(i, 1);
      }
    }
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
      else if (pr.pickup === 'missile') { pl.missiles = Math.min(pl.maxMissiles, pl.missiles + 1); this.hud.feed('CRATE: +1 MISSILE', 'good'); }
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
    });
    const at = new THREE.Vector3(tr.x, (tr.y ?? 0) + 1, tr.z);
    this.particles.debris(at, cactus ? 2 : 4);
    this.particles.driftSmoke(at);
    this.particles.splinters(at, dir,
      cactus ? [0x4a7a3c, 0x9ac878] : [0x6a4a2a, 0x3e5e30], cactus ? 0.95 : 0.6);
    if (car) car.vel.multiplyScalar(0.82); // trees don't stop you, but they cost real speed
    if (car === this.player) {
      this.player.damage(4, null);
      this.buzz(18);
      this.shake = Math.min(1, this.shake + 0.15);
    }
    this.score += 15;
    if (car === this.player) this.styleBump();
    if (Math.random() < 0.3) this.hud.feed(cactus ? 'CACTUS SHREDDED  +15' : 'TIMBER!  +15', 'good');
  }

  /** Material-aware SOLID crash (RULES.md §impact model). `ob.mat`:
   *  'stone' — brutal: rock does not care about toy trucks. A full-speed
   *            head-on all but wrecks you.
   *  'hut'   — heavy: the building shrugs, sheds planks/dust, hurts a lot.
   *  'metal' — firm: the old fence-post feel — sparks and moderate damage. */
  onSolidCrash(ob, car, impact, nx, nz) {
    const n = new THREE.Vector3(nx, 0, nz);
    if (impact > 3) this.particles.sparks(car.pos, n, Math.min(20, 4 + impact));
    const mat = ob.mat ?? 'metal';
    let dmg = 0;
    if (mat === 'stone') {
      dmg = impact > 6 ? Math.min(85, (impact - 6) * 3.5) : 0;
      if (dmg > 0) {
        this.particles.splinters(car.pos, n, [0x8a8378, 0x55504a], Math.min(1, impact / 20));
        this.particles.debris(car.pos, Math.min(8, 2 + (impact / 4 | 0)));
        this.particles.driftSmoke(car.pos);
      }
      if (car === this.player && dmg >= 10) {
        this.hud.feed(`HIT ROCK  −${Math.round(dmg)} HULL`, 'bad');
        this.shake = Math.min(1, this.shake + 0.3 + impact * 0.02);
        this.buzz(60);
        if (dmg >= 18) this.crashDrama();
      }
    } else if (mat === 'hut') {
      dmg = impact > 6 ? Math.min(50, (impact - 6) * 2.2) : 0;
      if (dmg > 0) {
        // the building crashes big: planks burst off the wall + a dust cloud
        const cols = [0x8a6a42, this.track.T?.hutRoof ?? 0x6a4a2a];
        this.particles.splinters(car.pos, n, cols, Math.min(1, impact / 16));
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
      if (car === this.player && dmg >= 8) {
        this.hud.feed(`CRASHED INTO THE HUT  −${Math.round(dmg)} HULL`, 'bad');
        this.shake = Math.min(1, this.shake + 0.25 + impact * 0.015);
        this.buzz(45);
        if (dmg >= 18) this.crashDrama();
      }
    } else {
      dmg = impact > 8 ? Math.min(24, (impact - 8) * 0.9) : 0;
      if (car === this.player && dmg >= 5) this.hud.feed(`WALL SLAM  −${Math.round(dmg)} HULL`, 'bad');
      if (car === this.player && impact > 12) {
        this.shake = Math.min(1, this.shake + 0.15 + impact * 0.015);
        this.buzz(30);
      }
    }
    if (dmg > 0) car.damage(dmg, null);
    if (car === this.player) this.audio.scrape();
  }

  /** Big-impact presentation: slow-mo beat + fov punch + red flash. */
  crashDrama() {
    this.hitStop = 0.32;
    this.fovKick = 1;
    this.hud.damageFlash?.(0.9);
  }

  /** Knock a small accessory (bumper, pod, rack…) off `car` — called when its
   *  hull crosses a damage threshold. The piece flies; the car looks beaten. */
  popCarPart(car) {
    const ud = car.mesh.userData;
    const excluded = new Set([...(ud.wheels ?? []), ...(ud.frontWheels ?? [])]);
    const candidates = car.mesh.children.filter((c) => {
      if (!c.visible || !c.isMesh || !c.geometry || excluded.has(c)) return false;
      if (c.material === ud.bodyMat) return false; // never shed the hull itself
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
  onTreeCrash(tr, car, impact, nx, nz) {
    const n = new THREE.Vector3(nx, 0, nz);
    const at = new THREE.Vector3(tr.x, (tr.y ?? 0) + 2.2, tr.z);
    // canopy sheds needles + a couple of cones/branches
    this.particles.splinters(at, n, [0x2a5a30, 0x6a4a2a], Math.min(1, impact / 14));
    this.particles.debris(at, Math.min(5, 2 + (impact / 6 | 0)));
    this.particles.driftSmoke(car.pos);
    const dmg = impact > 5 ? Math.min(35, (impact - 5) * 1.8) : 0;
    if (dmg > 0) car.damage(dmg, null);
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
      if (!b._hinted) { b._hinted = true; this.hud.feed('WALL HOLDING — KEEP FIRING', 'info'); }
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
    this._missionEvent?.('prop', { type: 'building' });
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
        vel: new THREE.Vector3(
          dir.x * sp * 0.4 + (Math.random() - 0.5) * 6, 5 + Math.random() * 5,
          dir.z * sp * 0.4 + (Math.random() - 0.5) * 6),
        spin: new THREE.Vector3((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10),
        life: 1.8,
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
    this.countdown = 0;
    this.playerRank = ENEMY_COUNT + 1;
    this.weapons.reset();
    this.hitStop = 0;
    this.fovKick = 0;
    this.enemySlowUntil = 0;
    this.comboN = 0; this.comboT = 0; this._lastRank = undefined; this._tauntT = -9;
    // race contracts: fresh slate + counters every race (picked in startRace)
    this.contracts = [];
    this.contractCredits = 0;
    this._ct = { props: 0, rivalKills: 0, drafts: 0, bigAirs: 0, closeCalls: 0,
      livestock: 0, comboMax: 1, weaponFired: false, lapDamaged: false,
      prevHealth: null, prevHeat: 0, prevMissiles: null, prevMines: null, prevShock: 0 };
    this.hud?.setContracts?.([]);
    for (const a2 of this.herds ?? []) { a2.alive = true; a2.mesh.visible = true; a2.x = a2.homeX; a2.z = a2.homeZ; }
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
    this.player.missiles = 3;
    this.player.mines = 2;
    this.player.nitro = 0.3;
    this.player.shockCooldown = 0;
    this.player.heat = 0;
    this.player.overheated = false;
    this.player.bestLap = Infinity;
    this.player.boostTimer = 0;
    this.applyUpgrades();
    const slot = this.track.gridSlot(0);
    this.player.placeAt(slot.index, slot.lateral);

    this.enemies.forEach((e, i) => {
      e.lap = 1;
      e.finished = false;
      e.health = e.maxHealth;
      e.alive = true;
      e.mesh.visible = true;
      e.boostTimer = 0;
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
    this.audio.start();
    document.getElementById('title-screen').classList.add('hidden');
    this.hud.show();
    document.getElementById('touch-ui').classList.add('on');
    if (this.input.resetJoystick) this.input.resetJoystick(); // zone has real bounds only once visible
    this.state = 'countdown';
    this.countdown = 3.6;
    this._lastCount = 4;
    this.player.lapStart = 0;
    this.hud.feed(`${this.level.name} — LEVEL ${this.level.id}`, 'info');
    if (!this.freeRoam) {
      // contracts run in RACE only — roam money stays pure destruction rate
      this.contracts = this._pickContracts();
      this.hud.setContracts?.(this.contracts, this._ct);
    }
    if (this.missionMode) { // [MISSIONS] structured arena challenge, no grid
      this._missionLaunch();
    } else if (this.freeRoam) {
      // no grid, no countdown — the world is yours (and the choppers')
      this.state = 'race';
      this.startScore = this.score;
      this.track.setLights('green');
      this.hud.centerMsg('EXPLORE!');
      this.hud.feed('SMASH EVERYTHING · WATCH THE SKIES', 'info');
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
    if (p.lap > 2 || (p.lap === 2)) {
      if (lapTime < p.bestLap) p.bestLap = lapTime;
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
    this.hud.centerMsg('WRECKED');
    this.hud.feed(attacker ? `WRECKED BY ${attacker.name}  −300` : 'WRECKED  −300', 'bad');
    if (this.missionMode) this._missionEvent('wrecked'); // [MISSIONS]
  }

  finishRace() {
    this.state = 'finished';
    this.player.finished = true;
    const rank = this.playerRank;
    const bonus = [2000, 1200, 800, 500, 300, 150][rank - 1] || 100;
    this.score += bonus;
    const sfx = ['1ST', '2ND', '3RD', '4TH', '5TH', '6TH'][rank - 1] || `${rank}TH`;
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
    const contractCr = this.contractCredits ?? 0;
    const raceCr = Math.round(raceScore * CREDIT_RATE * diffMult);
    const earned = raceCr + podium + firstClear + contractCr;
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
        for (const c of this.contracts ?? []) {
          html += c.done
            ? `<div class="cb-row contract"><span>✓ ${c.label}</span><b>+${c.pay}</b></div>`
            : `<div class="cb-row missed"><span>✗ ${c.label}</span><b>—</b></div>`;
        }
        html += `<div class="cb-row total"><span>TOTAL CREDITS</span><b>+${earned.toLocaleString()}</b></div>`;
        rowsEl.innerHTML = html;
        box.style.display = '';
      }
    }
    this.garage.credits += earned;
    saveJSON(this._pkey('garage'), this.garage);
    this.career.finished[this.level.id] = {
      place: Math.min(rank, prev?.place ?? 99),
      bestScore: Math.max(earned, prev?.bestScore ?? 0),
    };
    saveJSON(this._pkey('career'), this.career);
    this.renderGarage();
    const hasNext = this.levelIndex < LEVELS.length - 1;
    const nextUnlocked = hasNext && this.isLevelUnlocked(LEVELS[this.levelIndex + 1].id);
    if ((!prev || prev.place > 3) && rank <= 3 && hasNext) {
      this.hud.feed(`${LEVELS[this.levelIndex + 1].name} UNLOCKED`, 'good');
    }
    this.hud.centerMsg('FINISH');
    this.audio.lap();
    document.querySelector('#results .game-sub').textContent = rank <= 3 || !hasNext
      ? `${this.level.name} COMPLETE`
      : `${this.level.name} — FINISH TOP 3 TO UNLOCK THE NEXT WORLD`;
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
      document.getElementById('results').classList.remove('hidden');
      this.hud.hide();
      document.getElementById('touch-ui').classList.remove('on');
    }, 1600);
  }

  _updateRank() {
    let rank = 1;
    for (const e of this.enemies) if (e.progress > this.player.progress) rank++;
    this.playerRank = rank;
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
            a.damage(dmg, b);
            b.damage(dmg, a);
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
    const speedZoom = Math.min(1, Math.abs(p.speedAlong) / p.maxSpeed);
    const M = CAM_MODES[this.camMode] || CAM_MODES[0];
    // Chase views used to sit rigidly behind the car's RAW heading, so every
    // steering flick and every drift whipped the whole view sideways — that
    // is what made driving in 3D so hard. The chase yaw now follows a blend
    // of heading and actual travel direction, damped over time, so the view
    // stays settled and the road reads straight ahead.
    let fwd = p.forward;
    if (M.chase) {
      const wrap = (a) => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };
      let yaw = Math.atan2(fwd.x, fwd.z);
      const sp = Math.hypot(p.vel.x, p.vel.z);
      if (sp > 5) yaw += wrap(Math.atan2(p.vel.x, p.vel.z) - yaw) * 0.4; // look where you're going
      const cur = this._camYaw ?? yaw;
      // 4.5 tracked the car closely enough that the view still whipped on a
      // flick. Slower: the camera lags turn-in slightly, so you see the CAR
      // rotate against a steady world instead of the world rotating around you.
      this._camYaw = cur + wrap(yaw - cur) * Math.min(1, 3.6 * dt);
      fwd = new THREE.Vector3(Math.sin(this._camYaw), 0, Math.cos(this._camYaw));
    }
    const targetPos = p.pos.clone()
      .addScaledVector(fwd, -(M.back + speedZoom * (M.spdBack || 0)))
      .add(new THREE.Vector3(0, M.h + speedZoom * (M.spdH || 0), 0));
    const targetLook = p.pos.clone()
      .addScaledVector(fwd, M.look)
      .add(new THREE.Vector3(0, M.lookH || 0, 0));
    // cliff-walled worlds: never let the camera swing through the rock face.
    // Clamp lateral track offset just inside the walls and rise instead —
    // applied to the TARGET and to the LERPED position (the smoothing path
    // cuts corners on hairpins and would otherwise trail through the cliff).
    const tk = this.track;
    const clampCam = (v) => {
      if (!tk?.T?.cliffWalls || !tk.nearestIndex) return;
      const ci = tk.nearestIndex(v, p.trackIndex);
      const lat = tk.lateralOffset(v, ci);
      const lim = 8.4;
      if (Math.abs(lat) > lim) {
        const n = tk.nrm[ci];
        const over = lat - Math.sign(lat) * lim;
        v.x -= n.x * over;
        v.z -= n.z * over;
        v.y += Math.min(4, Math.abs(over) * 0.5);
      }
    };
    clampCam(targetPos);
    const k = 1 - Math.exp(-5.5 * dt);
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
    if (tk?.terrainHeight) {
      const cp = this.camPos, pp = p.pos;
      const dx = pp.x - cp.x, dz = pp.z - cp.z, dy = pp.y - cp.y;
      let lift = 0;
      const STEPS = 7;
      for (let s = 1; s <= STEPS; s++) {
        const f = s / (STEPS + 1);
        const gh = tk.terrainHeight(cp.x + dx * f, cp.z + dz * f) + 1.1;
        const sy = cp.y + dy * f;
        if (gh > sy) lift = Math.max(lift, (gh - sy) / (1 - f));
      }
      if (lift > 0) cp.y += Math.min(lift, 18);
      // ...and never underground wherever it ended up
      const gCam = tk.terrainHeight(cp.x, cp.z) + 2.2;
      if (cp.y < gCam) cp.y = gCam;
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
    // screen shake
    this.shake = Math.max(0, this.shake - dt * 2.2);
    const s = this.shake * this.shake;
    this.camera.position.copy(this.camPos).add(new THREE.Vector3(
      (Math.random() - 0.5) * s * 1.6, (Math.random() - 0.5) * s * 1.2, (Math.random() - 0.5) * s * 1.6
    ));
    this.camera.lookAt(this.camLook);
    // lean into corners
    const rollTarget = this.state === 'race' ? -this.input.steer * speedZoom * 0.045 : 0;
    this._camRoll = (this._camRoll ?? 0) + (rollTarget - (this._camRoll ?? 0)) * Math.min(1, 4 * dt);
    this.camera.rotation.z += this._camRoll;
    // keep the shadow light rig centered on the player (offset = theme sun dir)
    this.moon.position.copy(p.pos).add(this._sunOffset);
    this.moon.target.position.copy(p.pos);
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
    this.hud?.feed?.(`VIEW RESET (${why})`, 'info');
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
   *  instead of a dead session. Reported once, not once per frame. */
  frame() {
    try {
      this._frameBody();
    } catch (err) {
      if (!this._frameErr) {
        this._frameErr = err;
        console.error('[frame] recovered from', err);
        this.hud?.feed?.('GLITCH RECOVERED', 'bad');
      }
      // keep something on screen even if the sim threw
      try { this.composer.render(); } catch { /* renderer itself is gone */ }
    }
  }

  _frameBody() {
    let dt = Math.min(this.clock.getDelta(), 0.05);
    const time = this.clock.elapsedTime;
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
      const fov = (this.baseFov ?? 56) + this.fovKick * 8 + this._fovSpeed * 6;
      if (Math.abs(fov - this.camera.fov) > 0.01) {
        this.camera.fov = fov;
        this.camera.updateProjectionMatrix();
      }
    }
    this.track.update(dt, time);
    this._updateVizZones(dt); // ---- viz-zones: sectional fog / gloom / squall

    if (this.input.justPressed('KeyC')) this.cycleCamera();
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
        const surf = this.track.T?.surface;
        if (surf === 'snow') this.hud.feed('SNOW ROAD — LOW GRIP, LONG SLIDES', 'info');
        else if (surf === 'wet') this.hud.feed('WET ROAD — SLICK UNDER BRAKING', 'info');
        for (const c of this.contracts ?? []) {
          this.hud.feed(`◇ ${c.label}: ${c.desc}  +${c.pay} CR`, 'info');
        }
      }
    }

    if (this.state !== 'paused' && this.state !== 'title') {
      if (this.state === 'race') this.raceTime += dt;
      // pit-crew recovery: leave the wall alone for 5s and the hull patches
      // itself back up to 60% — mistakes cost position, not the whole race
      const pl = this.player;
      if (this.state === 'race' && pl.alive
          && this.raceTime - (pl._lastHurt ?? -9) > 5
          && pl.health < pl.maxHealth * 0.6) {
        pl.health = Math.min(pl.maxHealth * 0.6, pl.health + 3 * dt);
      }
      this.player.update(dt, this.input);
      if (!this.freeRoam && (this.state === 'race' || this.state === 'finished' || this.state === 'countdown')) {
        for (const e of this.enemies) {
          // rivals hold on the grid during countdown
          if (this.state === 'countdown') e.syncMesh(0);
          else e.update(dt);
        }
      }
      if (this.state === 'race' || this.state === 'finished') {
        this.weapons.update(dt);
        this._carCollisions();
        this._updateBoostPads();
        this._updatePickups(dt, time);
        this._updateChoppers(dt);
        this._updateHostiles(dt);
        this._updateProps(dt);
        this._updateWorldHazards(dt, time);
        this._updateCombo(dt);
        this._updateContracts();
        this._updateTaunts();
        this._beginSweep(); // [MISSIONS] shared swept-pickup segment for this frame
        this._updateRoamStars(time);
        this._updateLivestock(dt, time);
        this._updateMission(dt); // [MISSIONS]
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
      // idle attract camera slowly orbiting the start line
      const a = time * 0.12;
      const c = this.track.center[0];
      this.camera.position.set(c.x + Math.cos(a) * 55, 34, c.z + Math.sin(a) * 55);
      this.camera.lookAt(c.x, 0, c.z);
      if (this.particles.ambient && this.track.theme?.weather) {
        this.particles.ambient(new THREE.Vector3(c.x, 0, c.z), this.track.theme.weather, dt);
      }
      this.particles.update(dt);
      for (const p of this.pickups) { p.core.rotation.y += dt * 2.2; }
    }

    if (this.state !== 'title') this._updateCamera(dt);
    this._watchCarVisible(dt);
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
window.__CARS = CAR_CATALOG;   // headless suites drive every machine in turn
// test-affinity.mjs re-derives these from the live tracks and fails on drift
window.__DEMANDS = DEMANDS;
window.__paceEstimate = paceEstimate;
window.__rateCarsFor = rateCarsFor;
