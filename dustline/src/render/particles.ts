// THE PARTICLE SYSTEM — PORTED FROM IGNITE RALLY (`src/particles.js`).
//
// v1 drives every effect in that game from one pooled system: explosions and
// warhead detonations, muzzle flashes, ricochets, missile smoke, shock dust,
// prop-crush bursts, fence splinters, car debris, sparks, exhaust, drift smoke,
// rolling wheel dust, engine damage smoke, pickup bursts and five kinds of
// ambient weather. dustline had one effect — `WheelFX`, the per-surface wheel
// spray in SPEC §1.2 — and no general emitter at all. All twenty of v1's
// recipes are below, with their tuning constants.
//
// WHAT CAME ACROSS VERBATIM: the two shaders, the integrator, and every number
// in every recipe — counts, speeds, sizes, lives, drag, gravity, shrink, alpha,
// and the whole cached palette at the top of v1's file. Those numbers are the
// look; a recipe retuned by eye is a new effect wearing a ported name. v1's
// comments explaining why a number is what it is came with them.
//
// SIX DELIBERATE CHANGES:
//
//   1. THE POOL STAYS ON `THREE.Points`, WHICH IS NOT WHAT `WheelFX` DOES, and
//      the reason is the size unit. v1's vertex shader sizes a sprite in
//      SCREEN PIXELS — `gl_PointSize = min(aSize * (280.0 / -mv.z), 46.0)` —
//      so `explosion`'s white flash core at size 14 is 140 px at 28 m and
//      clamps to 46 px up close. `WheelFX` (kept, below) sizes its instanced
//      quads in METRES, where 14 is a fourteen-metre billboard. Converting the
//      pool to instanced quads would mean
//      re-deriving roughly two hundred size constants across twenty recipes by
//      eye, which is the point at which a port stops being one. The pool
//      discipline dustline asks for is met either way and is unchanged here:
//      fixed `MAX`, ring-buffer `head`, typed arrays, `DynamicDrawUsage`, and
//      no allocation on spawn or on update.
//   2. THE RANDOM STREAM IS SEEDED. Every jitter in v1 is `Math.random()`.
//      `core/rng.ts` says in as many words that runtime jitter — "tyre smoke,
//      damage rolls, AI jitter" — is deliberately NOT seeded there, so this is
//      a departure from that note rather than a straight application of it: a
//      fixed stream costs the same per call, takes `Math.random` out of the
//      file entirely, and makes two runs that issue the same spawns draw the
//      same picture, which is what a visual regression check needs. It does
//      not make the game deterministic — spawn ORDER still follows physics.
//   3. THE PER-CALL COLOUR ALLOCATIONS ARE HOISTED. v1's `sparks()` builds
//      three `THREE.Color` objects every time it fires, and it fires on every
//      scrape; `propBurst` allocates two closures per smashed prop. Those are
//      the only allocations in v1's hot path and they are gone — the colours
//      are module constants next to the rest of the palette, and the two
//      closures are private methods reading scratch fields. Same numbers.
//   4. THE MOBILE CHECK IS LAZY. v1 reads `matchMedia` at module scope. Here it
//      runs in the constructor, so importing this file does nothing: the
//      headless tools import the render layer and have no `matchMedia`.
//   5. `aColor` UPLOADS ONLY AFTER A SPAWN. Colour is written on spawn and
//      never touched by the integrator, so re-uploading 72 KB of it every frame
//      buys nothing. Position, size and alpha still upload every frame because
//      the integrator writes all three.
//   6. POSITIONS ARE `Vec3Like`, not `THREE.Vector3`. Call sites pass Rapier
//      translations and wheel contacts, and requiring a Vector3 would mean an
//      allocation at the call site to satisfy a type — the recipes only ever
//      read `.x/.y/.z`.
//
// WHAT WAS NOT DONE: `WheelFX` was not folded into the pool. The race loop
// calls it every frame for every wheel of every racer, its per-surface table is
// SPEC §1.2 rather than anything of v1's, and merging it would mean retuning
// that table into screen-space sizes for no stated gain. It keeps its own pool
// and its table; the two changes made to it are noted above its definition.
// v1's recipe for the same job — the snow/water rooster tail inlined at
// `src/vehicles.js:1150-1174` — is ported as `Particles.spray()` instead, so
// the two can be compared in motion before either is dropped.

import * as THREE from 'three';
import { Rng } from '../core/rng';
import { particleTexture } from '../templates/textures';
import type { SurfaceId } from '../tracks/terrain';

/** Anything with a position. Rapier vectors, wheel contacts and Vector3 all
 *  satisfy it, and no recipe needs more than the three components. */
export interface Vec3Like { x: number; y: number; z: number }

/** ONE OWNED COPY OF v1's SPRITE, shared by both pools in this file.
 *
 *  It is a CLONE and that is not fussiness. `particleTexture()` is `cached()`,
 *  and `resetPartCache()` calls `disposeCachedTextures()` at the top of every
 *  `buildComponents()` — so a pool that held the cached instance directly would
 *  be left holding a disposed texture the first time a world is rebuilt, which
 *  `templates/canvas.ts` records as rendering black and logging nothing. Both
 *  pools here are built once and outlive world builds. The clone shares the
 *  canvas and takes its own GPU handle and its own dispose, which is what
 *  `render/sky.ts` does with its sprite maps for the same reason.
 *
 *  Not freed: it is one 64x64 texture and it lives as long as the renderer. */
let _sprite: THREE.Texture | null = null;
function sprite(): THREE.Texture {
  if (!_sprite) {
    _sprite = particleTexture().clone();
    _sprite.needsUpdate = true;
  }
  return _sprite;
}

const MAX = 6000;

// cached colors for per-frame recipes (avoid GC churn)
const DUST_A = new THREE.Color('#a8905f');
const DUST_B = new THREE.Color('#bda87a');
const DRIFT_A = new THREE.Color('#b39a6e');
const DRIFT_B = new THREE.Color('#c9b489');
const SMOKE_GRAY = new THREE.Color('#8a8378');
const SMOKE_DARK = new THREE.Color('#332e29');
const FIRE_A = new THREE.Color('#ff8c1a');
const FIRE_B = new THREE.Color('#ffc23e');
const DEBRIS_A = new THREE.Color('#2a2521');
const DEBRIS_B = new THREE.Color('#4a4038');
const EXHAUST_BOOST = new THREE.Color('#ffb32e');
const SPLINTER_DEF = ['#c23b2a', '#e8e2d4']; // fallback fence colors (theme may override)
const SPLINTER_WHITE = new THREE.Color('#fff8ec');
const _splA = new THREE.Color();
const _splB = new THREE.Color();
// weapon-feel palette (cached — these recipes fire many times per second)
const EXPL_COLS = [
  new THREE.Color('#fff3b0'), new THREE.Color('#ffb52e'),
  new THREE.Color('#ff5e2e'), new THREE.Color('#d43a1a'),
];
const EXPL_WHITE = new THREE.Color('#ffffff');
const EXPL_SMOKE = new THREE.Color('#4a443c');
const MUZZLE_CORE = new THREE.Color('#fffdf2');
const MUZZLE_FLARE = new THREE.Color('#ffd76a');
const RICO_HOT = new THREE.Color('#fffbe8');
const RICO_A = new THREE.Color('#ffe86b');
const RICO_B = new THREE.Color('#ffab3d');
const MISSILE_SMOKE = new THREE.Color('#9a938a');
// CHANGE 3: v1's `sparks()` builds these three every call. Two of them are the
// same colours as RICO_A / RICO_HOT above; only the cool one is new.
const SPARK_COOL = new THREE.Color('#2ef7ff');
// tire spray tints, from `src/vehicles.js:7-8` (snow / wet), used by `spray()`
const SPRAY_SNOW = new THREE.Color(0xf4faff);
const SPRAY_WET = new THREE.Color(0x9dbcd2);

// ---- prop-crush palette (cached; propBurst fires on every smashed prop) ----
const CRATE_A = new THREE.Color('#8a5a2a');   // dark plank (crateTexture grain)
const CRATE_B = new THREE.Color('#c9a25e');   // lit plank face
const HAY_A = new THREE.Color('#e0c25a');     // bright straw
const HAY_B = new THREE.Color('#b89232');     // dry straw
const SNOW_A = new THREE.Color('#f4f8fc');    // snow chunk
const SNOW_B = new THREE.Color('#c8ddef');    // pale-blue shadowed snow
const CONE_ORANGE = new THREE.Color('#e8641a');
const CONE_WHITE = new THREE.Color('#f2f2ee');
const ROCK_A = new THREE.Color('#8a8378');    // grey chip (matches stone crash)
const ROCK_B = new THREE.Color('#55504a');
const PENG_DARK = new THREE.Color('#20242a');
const PENG_WHITE = new THREE.Color('#e8eef2');
const BARREL_DEF_A = new THREE.Color('#c29a5c'); // default stave (desert palette)
const BARREL_DEF_B = new THREE.Color('#4a3620'); // default hoop
const _pbA = new THREE.Color();               // scratch: propBurst tint pair
const _pbB = new THREE.Color();

/** Stave/hoop pairs mirroring v1's `BARREL_PALETTES` in `track.js`, so a
 *  smashed barrel sheds ITS colour. `setTheme(id)` selects one; an unknown id
 *  falls back to the wooden default. (Kept here rather than imported: v1's note
 *  is that `particles.js` must stay free of track/theme imports, which holds
 *  here for the same reason — this file may not reach into `tracks/`.)
 *
 *  NONE OF THESE KEYS MATCHES A DUSTLINE PRESET. v1 names a theme
 *  ('canyon', 'glacial'); dustline names a land and a weather
 *  (`presets.ts` — 'Canyon plateau' x 'Storm light'). So `setTheme` is inert
 *  until something maps one onto the other, and the working route today is
 *  `propBurst(at, type, dir, energy, [staveHex, hoopHex])`, which every barrel
 *  component can pass from its own palette. The table stays because it is the
 *  palette, not because it is currently reachable. */
const BARREL_TINTS: Record<string, [string, string]> = {
  desert: ['#c29a5c', '#4a3620'], canyon: ['#9a6440', '#33291e'],
  volcano: ['#37322e', '#e8381e'], glacial: ['#7aa8c4', '#2c4456'],
  jungle: ['#5a7a34', '#2c3a1a'], dunes: ['#c9a05e', '#4a3620'],
  ravine: ['#8f5434', '#2e2016'], wildfire: ['#2e2a26', '#e8481e'],
  sheetice: ['#8ab4d0', '#2c4456'], avalanche: ['#7aa8c4', '#2c4456'],
  neon: ['#22262e', '#26f6ff'], undercity: ['#3a4034', '#8a9a3c'],
  oldtown: ['#3a4048', '#f2a93b'],
  farmland: ['#5a6450', '#2c3226'],
  outback: ['#9a5a38', '#3e2a1c'],
};

// Per-frame prop-burst budget (sprites). A shockwave levels a dozen props in
// ONE frame; uncapped that is a four-figure spawn spike in a single tick —
// exactly the pressure that used to freeze the game. Over budget, later
// bursts in the same frame thin to 40 % instead of being dropped, so every
// prop still visibly crushes.
const BURST_BUDGET = 620;

// ---- ambient weather (cached colors + per-type spawn rates, spawns/second) ----
const LEAF_ALT = new THREE.Color('#c9a83a');   // dry-yellow leaf variant
const EMBER_HOT = new THREE.Color('#ffc94e');  // bright flicker variant
const AMBIENT_RATES: Record<AmbientType, number> = {
  snow: 150, leaves: 14, sand: 70, dust: 70, embers: 45, rain: 230,
};
const _amb = new THREE.Color();                // scratch: per-spawn tint mix

export type AmbientType = 'snow' | 'leaves' | 'sand' | 'dust' | 'embers' | 'rain';

/** What v1 reads off `track.theme.weather`. `TrackDef` carries no equivalent —
 *  its `sky` block is lighting only — so the caller supplies this. */
export interface AmbientWeather {
  type: AmbientType;
  /** Tint, mixed per spawn for leaves and embers. Defaults to white. */
  color?: string | number;
  /** Spawns per second. Defaults to the per-type rate above. */
  rate?: number;
}

/** Per-particle spawn options. v1's defaults, unchanged. */
export interface SpawnOpts {
  drag?: number;
  grav?: number;
  /** Size multiplier at end of life. Below 1 the sprite shrinks away; ABOVE 1
   *  it grows as it fades, which is what makes smoke and dust hang. */
  shrink?: number;
  alpha?: number;
}

const VERT = /* glsl */ `
  attribute float aSize;
  attribute float aAlpha;
  attribute vec3 aColor;
  varying float vAlpha;
  varying vec3 vColor;
  void main() {
    vAlpha = aAlpha;
    vColor = aColor;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    // clamp: huge near-camera additive points are pure fill-rate murder on
    // phone GPUs (the "freezing" report) — 46px is visually identical
    gl_PointSize = min(aSize * (280.0 / -mv.z), 46.0);
    gl_Position = projectionMatrix * mv;
  }
`;
const FRAG = /* glsl */ `
  uniform sampler2D uMap;
  varying float vAlpha;
  varying vec3 vColor;
  void main() {
    vec4 tex = texture2D(uMap, gl_PointCoord);
    gl_FragColor = vec4(vColor, tex.a * vAlpha);
  }
`;

/** One pooled GPU particle system for every effect.
 *
 *  MEMORY CEILING, MEASURED FROM THE ARRAY LENGTHS: eleven `Float32Array`s over
 *  `MAX = 6000` — four attribute buffers (position 3, colour 3, size 1, alpha
 *  1) at 192 KB and seven CPU-side ones (velocity 3, life, maxLife, drag, grav,
 *  shrink, baseSize, balpha) at 264 KB, so about 456 KB resident, plus the same
 *  192 KB again on the GPU. Fixed at construction and never reallocated: an
 *  over-budget frame overwrites the oldest sprite instead of growing. */
export class Particles {
  readonly points: THREE.Points;
  private geo: THREE.BufferGeometry;
  private pos: Float32Array;
  private col: Float32Array;
  private size: Float32Array;
  private alpha: Float32Array;
  private vel: Float32Array;
  private life: Float32Array;
  private maxLife: Float32Array;
  private drag: Float32Array;
  private grav: Float32Array;
  private shrink: Float32Array;
  private baseSize: Float32Array;
  private balpha: Float32Array;
  private head = 0;

  /** Global cut for the burst recipes — an adaptive quality governor can dial
   *  this down (0..1) on a struggling device without touching call sites. */
  fxScale = 1;

  private rng: Rng;
  /** CHANGE 2: every `Math.random()` in v1's bodies reads this instead. */
  private r = (): number => this.rng.float();

  private mobileAmbient: number;
  private mobileBurst: number;
  private burstSpent = 0;
  private colDirty = false;

  private barrelTint: [string, string] | null = null;
  private ambHex: string | number | undefined;
  private ambColor = new THREE.Color();
  private ambAcc = 0;
  private windA: number;

  // scratch for the prop-burst shard helper (CHANGE 3: v1 closes over these)
  private bx = 0; private by = 0; private bz = 0;
  private bdx = 0; private bdz = 0;

  constructor(scene: THREE.Scene, seed = 0) {
    this.rng = Rng.fork(seed, 'particles');
    // CHANGE 4: v1 evaluates this at module scope; the headless tools import
    // the render layer with no `matchMedia` and no `ontouchstart`.
    const coarse = (typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches)
      || 'ontouchstart' in globalThis;
    // phones get a leaner ambient budget — same look, less overdraw
    this.mobileAmbient = coarse ? 0.5 : 1;
    this.mobileBurst = coarse ? 0.6 : 1; // prop-burst count scale on phones
    this.windA = this.r() * Math.PI * 2;  // prevailing wind, one draw per world

    this.geo = new THREE.BufferGeometry();
    this.pos = new Float32Array(MAX * 3);
    this.col = new Float32Array(MAX * 3);
    this.size = new Float32Array(MAX);
    this.alpha = new Float32Array(MAX);
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    this.geo.setAttribute('aColor', new THREE.BufferAttribute(this.col, 3).setUsage(THREE.DynamicDrawUsage));
    this.geo.setAttribute('aSize', new THREE.BufferAttribute(this.size, 1).setUsage(THREE.DynamicDrawUsage));
    this.geo.setAttribute('aAlpha', new THREE.BufferAttribute(this.alpha, 1).setUsage(THREE.DynamicDrawUsage));

    // CPU-side state
    this.vel = new Float32Array(MAX * 3);
    this.life = new Float32Array(MAX);
    this.maxLife = new Float32Array(MAX);
    this.drag = new Float32Array(MAX);
    this.grav = new Float32Array(MAX);
    this.shrink = new Float32Array(MAX);
    this.baseSize = new Float32Array(MAX);
    this.balpha = new Float32Array(MAX).fill(1); // per-particle peak alpha

    const mat = new THREE.ShaderMaterial({
      uniforms: { uMap: { value: sprite() } },
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });
    this.points = new THREE.Points(this.geo, mat);
    this.points.frustumCulled = false;
    scene.add(this.points);
    // park everything far below the world
    for (let i = 0; i < MAX; i++) this.pos[i * 3 + 1] = -9999;
  }

  spawn(
    x: number, y: number, z: number,
    vx: number, vy: number, vz: number,
    color: THREE.Color, size: number, life: number,
    { drag = 0, grav = 0, shrink = 0.8, alpha = 1 }: SpawnOpts = {},
  ) {
    const i = this.head;
    this.head = (this.head + 1) % MAX;
    this.pos[i * 3] = x; this.pos[i * 3 + 1] = y; this.pos[i * 3 + 2] = z;
    this.vel[i * 3] = vx; this.vel[i * 3 + 1] = vy; this.vel[i * 3 + 2] = vz;
    this.col[i * 3] = color.r; this.col[i * 3 + 1] = color.g; this.col[i * 3 + 2] = color.b;
    this.life[i] = life; this.maxLife[i] = life;
    this.baseSize[i] = size; this.size[i] = size;
    this.alpha[i] = alpha; this.balpha[i] = alpha;
    this.drag[i] = drag; this.grav[i] = grav; this.shrink[i] = shrink;
    this.colDirty = true;
  }

  update(dt: number) {
    this.burstSpent = 0; // prop-burst budget resets every frame
    for (let i = 0; i < MAX; i++) {
      if (this.life[i] <= 0) continue;
      this.life[i] -= dt;
      if (this.life[i] <= 0) { this.pos[i * 3 + 1] = -9999; this.alpha[i] = 0; continue; }
      const k = 1 - this.drag[i] * dt;
      this.vel[i * 3] *= k;
      this.vel[i * 3 + 1] = this.vel[i * 3 + 1] * k - this.grav[i] * dt;
      this.vel[i * 3 + 2] *= k;
      this.pos[i * 3] += this.vel[i * 3] * dt;
      this.pos[i * 3 + 1] += this.vel[i * 3 + 1] * dt;
      this.pos[i * 3 + 2] += this.vel[i * 3 + 2] * dt;
      const f = this.life[i] / this.maxLife[i];
      this.alpha[i] = this.balpha[i] * f * f;
      this.size[i] = this.baseSize[i] * (this.shrink[i] + (1 - this.shrink[i]) * f);
    }
    this.geo.attributes.position.needsUpdate = true;
    this.geo.attributes.aSize.needsUpdate = true;
    this.geo.attributes.aAlpha.needsUpdate = true;
    // CHANGE 5: colour is written on spawn and never by the integrator above.
    if (this.colDirty) { this.geo.attributes.aColor.needsUpdate = true; this.colDirty = false; }
  }

  /** Kill every live particle. Without this the old world's dust, embers and
   *  smoke keep drifting over the new one after a level swap. */
  reset() {
    this.life.fill(0);
    this.alpha.fill(0);
    this.geo.attributes.aAlpha.needsUpdate = true;
  }

  /** Point the prop-crush recipes at a world: currently just the barrel
   *  stave/hoop pair, so a smashed drum sheds the theme's own colours.
   *  Safe to call with anything (unknown/undefined -> wooden default).
   *  See BARREL_TINTS for why no dustline preset id reaches it yet. */
  setTheme(themeId: string | undefined) {
    this.barrelTint = (themeId && BARREL_TINTS[themeId]) || null;
  }

  dispose() {
    this.points.removeFromParent();
    this.geo.dispose();
    (this.points.material as THREE.Material).dispose();
    // the sprite is the module-level clone, shared with WheelFX — see `sprite()`
  }

  // ---- effect recipes ----

  explosion(p: Vec3Like, big = false) {
    const r = this.r;
    const n = big ? 90 : 45;
    for (let i = 0; i < n; i++) {
      const a = r() * Math.PI * 2;
      const rad = (r() ** 0.6) * (big ? 26 : 15);
      const up = r() * (big ? 20 : 12);
      this.spawn(p.x, p.y + 0.5, p.z,
        Math.cos(a) * rad, up, Math.sin(a) * rad,
        EXPL_COLS[(r() * EXPL_COLS.length) | 0],
        (big ? 5 : 3.4) * (0.5 + r()),
        0.5 + r() * (big ? 0.9 : 0.5),
        { drag: 2.2, grav: 8, shrink: 0.3 });
    }
    // white flash core
    for (let i = 0; i < 8; i++)
      this.spawn(p.x, p.y + 1, p.z, (r() - 0.5) * 4, r() * 3, (r() - 0.5) * 4,
        EXPL_WHITE, big ? 14 : 9, 0.18, { shrink: 1 });
    // smoke
    for (let i = 0; i < (big ? 20 : 10); i++) {
      const a = r() * Math.PI * 2, rad = r() * 5;
      this.spawn(p.x + Math.cos(a) * 2, p.y + 1, p.z + Math.sin(a) * 2,
        Math.cos(a) * rad, 4 + r() * 5, Math.sin(a) * rad,
        EXPL_SMOKE, 6 + r() * 5, 1.2 + r(), { drag: 1.5, shrink: 0.2 });
    }
  }

  /** Warhead detonation (missiles, mines): the big fireball PLUS a flat
   *  debris ring skipping outward and a rolling ground-dust ring. Pure
   *  presentation — damage/radius live in the weapon and are untouched. */
  detonation(p: Vec3Like) {
    const r = this.r;
    this.explosion(p, true);
    // debris ring — chunks hurled out flat at even angles, hard and low
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2 + r() * 0.35;
      const sp = 16 + r() * 11;
      this.spawn(p.x, p.y + 0.4, p.z,
        Math.cos(a) * sp, 3 + r() * 5, Math.sin(a) * sp,
        r() < 0.5 ? DEBRIS_A : DEBRIS_B,
        1.8 + r() * 1.4, 0.5 + r() * 0.4,
        { grav: 30, drag: 0.8, shrink: 0.85 });
    }
    // ground shock puffs rolling out under the fireball
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + r() * 0.5;
      this.spawn(p.x + Math.cos(a) * 1.5, p.y + 0.3, p.z + Math.sin(a) * 1.5,
        Math.cos(a) * 20, 1.2, Math.sin(a) * 20,
        r() < 0.5 ? DUST_A : DUST_B, 3.5 + r() * 2, 0.5 + r() * 0.25,
        { drag: 3.2, shrink: 1.4, alpha: 0.5 });
    }
  }

  /** Cannon muzzle flash: one hot core pop + two flares thrown forward.
   *  Very short lives — reads as a punch, costs 3 pool slots per shot. */
  muzzleFlash(p: Vec3Like, dir: Vec3Like) {
    const r = this.r;
    this.spawn(p.x, p.y, p.z, dir.x * 3, 0.6, dir.z * 3,
      MUZZLE_CORE, 4.6 + r() * 1.8, 0.07, { shrink: 1 });
    for (let i = 0; i < 2; i++) {
      this.spawn(p.x, p.y, p.z,
        dir.x * (10 + r() * 8) + (r() - 0.5) * 3,
        0.8 + r() * 1.6,
        dir.z * (10 + r() * 8) + (r() - 0.5) * 3,
        MUZZLE_FLARE, 2.2 + r() * 1.2, 0.09 + r() * 0.06,
        { drag: 4, shrink: 0.9 });
    }
  }

  /** Bullet ricochet on a world hit: a varied spark burst — count, ejection
   *  cone and heat all jitter so no two impacts read the same. */
  ricochet(p: Vec3Like, normal: Vec3Like) {
    const r = this.r;
    const n = 4 + (r() * 6 | 0);
    const tiltA = r() * Math.PI * 2, tilt = r() * 0.7;
    const nx = normal.x + Math.cos(tiltA) * tilt, nz = normal.z + Math.sin(tiltA) * tilt;
    for (let i = 0; i < n; i++) {
      const a = r() * Math.PI * 2;
      const sp = 4 + r() * 12;
      this.spawn(p.x, p.y + 0.2, p.z,
        nx * sp + Math.cos(a) * 3.5, 2 + r() * 7, nz * sp + Math.sin(a) * 3.5,
        r() < 0.3 ? RICO_HOT : (r() < 0.6 ? RICO_A : RICO_B),
        1.3 + r() * 1.3, 0.16 + r() * 0.3,
        { grav: 26, shrink: 0.4 });
    }
    // hot flash pop right at the impact point
    this.spawn(p.x, p.y + 0.25, p.z, 0, 1.5, 0, RICO_HOT, 3 + r() * 2, 0.08, { shrink: 1 });
  }

  /** Thin grey puff for missile smoke trails (v1's weapons cap at ~20/s each).
   *  shrink > 1 makes the puff grow as it fades — a hanging smoke rope. */
  missileSmoke(p: Vec3Like) {
    const r = this.r;
    this.spawn(p.x + (r() - 0.5) * 0.3, p.y + (r() - 0.5) * 0.3, p.z + (r() - 0.5) * 0.3,
      (r() - 0.5) * 1.2, 0.8 + r() * 0.8, (r() - 0.5) * 1.2,
      MISSILE_SMOKE, 1.6 + r() * 1.1, 0.7 + r() * 0.4,
      { drag: 1.2, shrink: 1.6, alpha: 0.55 });
  }

  /** Shockwave ground dust: a full circle kicked outward with the ring.
   *  High drag = fast launch that eases off, matching the pressure wave. */
  shockDust(p: Vec3Like, count = 20) {
    const r = this.r;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + r() * 0.4;
      const sp = 22 + r() * 10;
      this.spawn(p.x + Math.cos(a) * 2, p.y + 0.25, p.z + Math.sin(a) * 2,
        Math.cos(a) * sp, 1.5 + r() * 2, Math.sin(a) * sp,
        r() < 0.5 ? DUST_A : DUST_B,
        3 + r() * 2.2, 0.55 + r() * 0.3,
        { drag: 2.6, shrink: 1.5, alpha: 0.6 });
    }
  }

  /** One shard for the prop-crush recipes, thrown out+up biased along `dir`.
   *  CHANGE 3: v1 declares this as a closure inside `propBurst`, capturing
   *  `at`, `dx` and `dz`; those live in the `b*` scratch fields instead so a
   *  burst allocates nothing. */
  private shard(
    c: THREE.Color, size: number, out: number, up: number, life: number,
    grav: number, drag = 0.7, shrink = 0.85, alpha = 1,
  ) {
    const a = this.r() * Math.PI * 2;
    this.spawn(this.bx, this.by + 0.4, this.bz,
      this.bdx * out + Math.cos(a) * out * 0.55, up, this.bdz * out + Math.sin(a) * out * 0.55,
      c, size, life, { grav, drag, shrink, alpha });
  }

  /** Count helper: mobile scale + the per-frame burst budget. It books what it
   *  hands out, so a multi-prop blast thins itself instead of the pool. */
  private count(base: number, spread: number): number {
    const thin = (this.burstSpent > BURST_BUDGET ? 0.4 : 1) * this.fxScale;
    const c = Math.max(1, Math.round((base + this.r() * spread) * this.mobileBurst * thin));
    this.burstSpent += c;
    return c;
  }

  /** Material-aware crush burst for smashed props. `type` is the component's
   *  kind string; `dir` a horizontal unit vector away from the impactor
   *  (null → radial); `energy` 0..1 from impact speed (v1's call sites pass
   *  min(1, |speedAlong|/30), weapons ~0.8); `colors` optionally overrides the
   *  two-tone tint (e.g. a barrel palette [base, hoop]). Pure pooled sprites —
   *  obeys the shared MAX pool + point-size clamp, x0.6 on mobile. */
  propBurst(
    at: Vec3Like, type: string, dir: Vec3Like | null = null,
    energy = 0.6, colors: [string, string] | null = null,
  ) {
    const r = this.r;
    const k = THREE.MathUtils.clamp(energy, 0, 1);
    this.bx = at.x; this.by = at.y; this.bz = at.z;
    this.bdx = dir?.x ?? 0; this.bdz = dir?.z ?? 0;
    switch (type) {
      case 'crate': {
        // chunky two-tone planks out+up, pale fast slivers, a tan dust puff
        for (let i = this.count(12, 6 * k); i > 0; i--)
          this.shard(r() < 0.55 ? CRATE_A : CRATE_B, 2.2 + r() * 1.8,
            (8 + r() * 8) * (0.5 + k * 0.5), 4 + r() * 5 + k * 3,
            0.35 + r() * 0.4, 30);
        for (let i = this.count(4, 2); i > 0; i--)
          this.shard(SPLINTER_WHITE, 1.8 + r() * 1,
            14 + r() * 8, 3 + r() * 4, 0.16 + r() * 0.18, 20, 0.3, 1);
        // white snap-flash at the break point — two sprites, and the whole
        // burst suddenly reads as WOOD BREAKING instead of brown-on-brown
        for (let i = this.count(2, 0); i > 0; i--)
          this.shard(SPLINTER_WHITE, 4.4 + r() * 2.2, 1.5 + r() * 2,
            1.5 + r() * 2, 0.1 + r() * 0.06, 0, 0, 1);
        for (let i = this.count(3, 0); i > 0; i--)
          this.shard(r() < 0.5 ? DUST_A : DUST_B, 3.4 + r() * 2.4,
            2 + r() * 2, 1.5 + r() * 1.5, 0.5 + r() * 0.3, 2, 1.5, 1.4, 0.5);
        break;
      }
      case 'barrel': {
        // stave shards in the theme palette + dark hoop glints, flatter arc
        _pbA.set(colors?.[0] ?? this.barrelTint?.[0] ?? BARREL_DEF_A);
        _pbB.set(colors?.[1] ?? this.barrelTint?.[1] ?? BARREL_DEF_B);
        for (let i = this.count(10, 6 * k); i > 0; i--)
          this.shard(r() < 0.7 ? _pbA : _pbB, 2.1 + r() * 1.6,
            (9 + r() * 8) * (0.5 + k * 0.5), 2.5 + r() * 3.5 + k * 2,
            0.35 + r() * 0.35, 32);
        for (let i = this.count(2, 1); i > 0; i--) // hoop rings skipping out low and fast
          this.shard(_pbB, 2.6 + r() * 1,
            13 + r() * 7, 2 + r() * 2, 0.4 + r() * 0.25, 34, 0.4);
        break;
      }
      case 'hay': {
        // soft golden straw — floats and flutters, no hard chunks, plus chaff
        for (let i = this.count(16, 8 * k); i > 0; i--) {
          const a = r() * Math.PI * 2;
          this.spawn(at.x, at.y + 0.5, at.z,
            this.bdx * (4 + r() * 5) + Math.cos(a) * 5 + (r() - 0.5) * 4,
            3 + r() * 4.5 + k * 2,
            this.bdz * (4 + r() * 5) + Math.sin(a) * 5 + (r() - 0.5) * 4,
            r() < 0.55 ? HAY_A : HAY_B, 1.5 + r() * 1.2,
            1 + r() * 0.6, { grav: 6, drag: 0.8, shrink: 0.6, alpha: 0.95 });
        }
        for (let i = this.count(4, 0); i > 0; i--) // chaff hanging where the bale was
          this.shard(HAY_B, 3.5 + r() * 2.5, 1.5 + r() * 2,
            1.5 + r() * 2, 0.9 + r() * 0.5, 1, 1.2, 1.5, 0.35);
        break;
      }
      case 'snowman': {
        // white/pale-blue chunks + a growing powder puff
        for (let i = this.count(10, 4 * k); i > 0; i--)
          this.shard(r() < 0.6 ? SNOW_A : SNOW_B, 2 + r() * 1.5,
            (7 + r() * 7) * (0.5 + k * 0.5), 3.5 + r() * 4,
            0.45 + r() * 0.35, 26);
        // powder puff: starts fat and shrinks away as it fades (shrink < 1),
        // the opposite of the tan dust clouds — reads as settling snow
        for (let i = this.count(5, 0); i > 0; i--)
          this.shard(SNOW_A, 4.4 + r() * 2.6, 2 + r() * 2.5,
            1.5 + r() * 2, 0.6 + r() * 0.35, 2, 1.4, 0.4, 0.55);
        break;
      }
      case 'cone': {
        for (let i = this.count(6, 2); i > 0; i--)
          this.shard(CONE_ORANGE, 1.5 + r() * 0.9,
            12 + r() * 8 * (0.5 + k), 3 + r() * 4,
            0.3 + r() * 0.25, 30, 0.5);
        for (let i = this.count(2, 0); i > 0; i--)
          this.shard(CONE_WHITE, 1.5 + r() * 0.8,
            13 + r() * 7, 3 + r() * 3, 0.24 + r() * 0.18, 30, 0.5);
        break;
      }
      case 'rock': {
        // hard low grey chips + brief grey dust
        for (let i = this.count(8, 2); i > 0; i--)
          this.shard(r() < 0.5 ? ROCK_A : ROCK_B, 1.8 + r() * 1.3,
            (10 + r() * 8) * (0.5 + k * 0.5), 1.5 + r() * 2.5,
            0.35 + r() * 0.25, 36, 0.4);
        for (let i = this.count(3, 0); i > 0; i--)
          this.shard(SMOKE_GRAY, 3.2 + r() * 2.2, 2 + r() * 2,
            1 + r() * 1.5, 0.4 + r() * 0.2, 2, 1.6, 1.4, 0.4);
        break;
      }
      case 'penguin': {
        // comedic: a few dark+white flecks and a feathery flutter
        for (let i = this.count(6, 2); i > 0; i--)
          this.shard(r() < 0.5 ? PENG_DARK : PENG_WHITE, 1.6 + r() * 1,
            6 + r() * 6, 4 + r() * 4, 0.55 + r() * 0.35, 22);
        for (let i = this.count(5, 3); i > 0; i--) { // feathers — hay physics, monochrome
          const a = r() * Math.PI * 2;
          this.spawn(at.x, at.y + 0.7, at.z,
            Math.cos(a) * 4 + (r() - 0.5) * 4, 2.5 + r() * 3.5,
            Math.sin(a) * 4 + (r() - 0.5) * 4,
            PENG_WHITE, 1 + r() * 0.7, 1 + r() * 0.5,
            { grav: 5, drag: 0.9, shrink: 0.6, alpha: 0.9 });
        }
        break;
      }
      default: {
        // unknown props (fences, troughs, feed bins): debris look, tintable
        _pbA.set(colors?.[0] ?? DEBRIS_A);
        _pbB.set(colors?.[1] ?? DEBRIS_B);
        for (let i = this.count(8, 2 + 2 * k); i > 0; i--)
          this.shard(r() < 0.5 ? _pbA : _pbB, 1.9 + r() * 1.4,
            (6 + r() * 7) * (0.5 + k * 0.5), 4 + r() * 5,
            0.45 + r() * 0.4, 30, 0.4);
      }
    }
  }

  /** Debris-shrapnel contact pop: a small hot spark burst where a flying
   *  chunk clips a car. Cheap — flying debris can land several of these/s. */
  debrisHit(p: Vec3Like) {
    const r = this.r;
    for (let i = 0, c = Math.round(5 * this.mobileBurst); i < c; i++) {
      const a = r() * Math.PI * 2;
      const sp = 3 + r() * 8;
      this.spawn(p.x, p.y + 0.6, p.z,
        Math.cos(a) * sp, 2 + r() * 5, Math.sin(a) * sp,
        r() < 0.5 ? RICO_A : RICO_B, 1.2 + r(),
        0.15 + r() * 0.2, { grav: 22, shrink: 0.4 });
    }
    this.spawn(p.x, p.y + 0.7, p.z, 0, 1.2, 0, RICO_HOT, 2.6 + r() * 1.4, 0.08, { shrink: 1 });
  }

  sparks(p: Vec3Like, normal: Vec3Like, count = 10) {
    const r = this.r;
    for (let i = 0; i < count; i++) {
      const a = r() * Math.PI * 2;
      const sp = 5 + r() * 13;
      this.spawn(p.x, p.y + 0.3, p.z,
        normal.x * sp + Math.cos(a) * 4, 2.5 + r() * 6, normal.z * sp + Math.sin(a) * 4,
        r() < 0.6 ? RICO_A : SPARK_COOL, 1.6 + r() * 1.2, 0.28 + r() * 0.35,
        { grav: 24, shrink: 0.35 });
    }
    // a couple of white-hot core pops for punch
    for (let i = 0, n = Math.max(1, count >> 2); i < n; i++) {
      this.spawn(p.x, p.y + 0.35, p.z,
        normal.x * 6 + (r() - 0.5) * 5, 3 + r() * 4, normal.z * 6 + (r() - 0.5) * 5,
        RICO_HOT, 2.4 + r() * 1.4, 0.14 + r() * 0.12, { grav: 14, shrink: 0.7 });
    }
  }

  exhaust(p: Vec3Like, back: Vec3Like, color: THREE.Color, boost = false) {
    const r = this.r;
    const c = boost ? EXHAUST_BOOST : color;
    this.spawn(
      p.x + (r() - 0.5) * 0.5, p.y + 0.35, p.z + (r() - 0.5) * 0.5,
      back.x * (boost ? 26 : 9) + (r() - 0.5) * 2, 0.6, back.z * (boost ? 26 : 9) + (r() - 0.5) * 2,
      c, boost ? 3.4 : 1.7, boost ? 0.4 : 0.28, { drag: 3, shrink: 0.4 });
  }

  driftSmoke(p: Vec3Like) {
    const r = this.r;
    // big soft dust cloud kicked up while sliding on the dirt
    this.spawn(p.x + (r() - 0.5) * 0.6, p.y + 0.2, p.z + (r() - 0.5) * 0.6,
      (r() - 0.5) * 3.6, 1.8 + r() * 2.4, (r() - 0.5) * 3.6,
      r() < 0.5 ? DRIFT_A : DRIFT_B, 3.6 + r() * 2.6, 0.85 + r() * 0.5,
      { drag: 1.8, shrink: 0.15 });
  }

  /** Constant rolling dust from wheels on dirt. intensity 0..1 scales size/loft. */
  dust(p: Vec3Like, intensity = 0.5) {
    const r = this.r;
    this.spawn(p.x + (r() - 0.5) * 0.6, p.y + 0.15, p.z + (r() - 0.5) * 0.6,
      (r() - 0.5) * 2.5, 1.2 + r() * 1.6 + intensity * 1.5, (r() - 0.5) * 2.5,
      r() < 0.5 ? DUST_A : DUST_B,
      1.7 + r() * 1.4 + intensity * 1.8,
      0.45 + r() * 0.35 + intensity * 0.25,
      { drag: 2.2, shrink: 0.15 });
  }

  /** Rooster tail off the tires on snow or standing water.
   *
   *  This one is not from v1's `particles.js` — it is the inline `spawn()` call
   *  at `src/vehicles.js:1150-1174`, the only surface-aware wheel effect that
   *  game has, and the direct counterpart to dustline's `WheelFX`. Every number
   *  is that block's. The emission gate around it stays with the caller, as it
   *  does in v1: it is per-car state (`_sprayAcc`, a distance cull, a per-frame
   *  cap of 2) and this class holds no per-car state.
   *
   *  `back` is the car's BACKWARD unit vector; `speed` is m/s. */
  spray(p: Vec3Like, back: Vec3Like, speed: number, snow: boolean) {
    const r = this.r;
    this.spawn(
      p.x + back.x * 1.1 + (r() - 0.5) * 1.5, p.y + 0.25,
      p.z + back.z * 1.1 + (r() - 0.5) * 1.5,
      back.x * speed * 0.22 + (r() - 0.5) * 3, 1.8 + r() * 2.4,
      back.z * speed * 0.22 + (r() - 0.5) * 3,
      snow ? SPRAY_SNOW : SPRAY_WET, snow ? 1.7 : 1.1, 0.45 + r() * 0.35,
      snow
        ? { drag: 1.2, grav: 5, shrink: 1.3, alpha: 0.55 }
        : { drag: 1.2, grav: 9, shrink: 0.7, alpha: 0.45 });
  }

  /** Engine-bay damage smoke. severity 0..1: gray puffs -> thick dark smoke + fire flickers. */
  damageSmoke(p: Vec3Like, severity = 0.5) {
    const r = this.r;
    const dark = severity > 0.5;
    this.spawn(p.x + (r() - 0.5) * 0.5, p.y, p.z + (r() - 0.5) * 0.5,
      (r() - 0.5) * 1.5, 2.2 + severity * 2.5 + r() * 1.5, (r() - 0.5) * 1.5,
      dark ? SMOKE_DARK : SMOKE_GRAY,
      2.2 + severity * 2.4 + r() * 1.2,
      0.7 + severity * 0.5 + r() * 0.3,
      { drag: 1.6, shrink: 0.2 });
    if (dark && r() < 0.45) {
      // orange fire flicker licking out of the engine bay
      this.spawn(p.x + (r() - 0.5) * 0.7, p.y - 0.15, p.z + (r() - 0.5) * 0.7,
        (r() - 0.5) * 1.2, 2.5 + r() * 2.5, (r() - 0.5) * 1.2,
        r() < 0.6 ? FIRE_A : FIRE_B, 1.5 + r() * 1.3, 0.22 + r() * 0.15,
        { drag: 1, shrink: 0.5 });
    }
  }

  /** Fence-post splinters: 8-14 chunky theme-colored shards thrown out and up
   *  off a barrier hit, plus a white flash pop. colors: [hexA, hexB] (theme
   *  splinter pair); intensity 0..1 scales count and throw speed. */
  splinters(p: Vec3Like, normal: Vec3Like, colors: [string, string] | null = null, intensity = 0.6) {
    const r = this.r;
    _splA.set(colors?.[0] ?? SPLINTER_DEF[0]);
    _splB.set(colors?.[1] ?? SPLINTER_DEF[1]);
    const k = THREE.MathUtils.clamp(intensity, 0, 1);
    const n = 8 + Math.round(6 * k);
    for (let i = 0; i < n; i++) {
      const a = r() * Math.PI * 2;
      const out = 7 + r() * 8 + k * 7; // strong outward throw off the fence
      this.spawn(p.x, p.y + 0.5, p.z,
        normal.x * out + Math.cos(a) * 5.5, 5 + r() * 6 + k * 4, normal.z * out + Math.sin(a) * 5.5,
        r() < 0.55 ? _splA : _splB,
        2.3 + r() * 1.7,          // big chunks — reads as broken planks
        0.28 + r() * 0.3,         // short life, they tumble and die fast
        { grav: 34, drag: 0.6, shrink: 0.85 });
    }
    // white flash pop right at the break point
    for (let i = 0; i < 3; i++) {
      this.spawn(p.x, p.y + 0.6, p.z,
        (r() - 0.5) * 4, 2 + r() * 3, (r() - 0.5) * 4,
        SPLINTER_WHITE, 4.2 + r() * 2.2, 0.12 + r() * 0.08, { shrink: 1 });
    }
  }

  /** Dark chunks thrown off a car by a heavy hit. */
  debris(p: Vec3Like, count = 3) {
    const r = this.r;
    for (let i = 0; i < count; i++) {
      const a = r() * Math.PI * 2;
      const sp = 5 + r() * 8;
      this.spawn(p.x, p.y + 0.9, p.z,
        Math.cos(a) * sp, 6 + r() * 7, Math.sin(a) * sp,
        r() < 0.5 ? DEBRIS_A : DEBRIS_B, 1.6 + r() * 1.1,
        0.6 + r() * 0.5, { grav: 30, drag: 0.4, shrink: 0.85 });
    }
  }

  trail(p: Vec3Like, color: THREE.Color) {
    const r = this.r;
    this.spawn(p.x, p.y, p.z,
      (r() - 0.5) * 2, (r() - 0.5) * 2, (r() - 0.5) * 2,
      color, 2.2, 0.35, { shrink: 0.5 });
  }

  pickupBurst(p: Vec3Like, color: THREE.Color) {
    const r = this.r;
    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * Math.PI * 2;
      this.spawn(p.x, p.y, p.z, Math.cos(a) * 9, 5 + r() * 4, Math.sin(a) * 9,
        color, 2.2, 0.5, { drag: 2, grav: 6, shrink: 0.4 });
    }
  }

  /** Ambient weather around `center` (the player), called every frame with the
   *  world's weather — no-op when undefined. Budget <=3 spawns per call (5 for
   *  rain); a fractional accumulator keeps rates frame-rate independent. */
  ambient(center: Vec3Like, weather: AmbientWeather | undefined | null, dt: number) {
    if (!weather || !weather.type || !(dt > 0)) return;
    const r = this.r;
    const rate = (weather.rate ?? AMBIENT_RATES[weather.type] ?? 0) * this.mobileAmbient;
    if (!rate) return;
    if (this.ambHex !== weather.color) { // theme tint, cached across frames
      this.ambHex = weather.color;
      this.ambColor.set(weather.color ?? 0xffffff);
    }
    this.ambAcc += rate * dt;
    // rain needs a higher per-frame budget than other weather
    let n = Math.min(weather.type === 'rain' ? 5 : 3, Math.floor(this.ambAcc));
    if (n <= 0) return;
    this.ambAcc -= n;
    const base = this.ambColor;
    const wx = Math.cos(this.windA), wz = Math.sin(this.windA);
    for (; n > 0; n--) {
      const a = r() * Math.PI * 2;
      switch (weather.type) {
        case 'snow': {
          // slow flakes drifting down through a wide column over the player
          const rr = 70 * Math.sqrt(r());
          this.spawn(
            center.x + Math.cos(a) * rr, center.y + 20 + r() * 10, center.z + Math.sin(a) * rr,
            (r() - 0.5) * 3, -6 + (r() - 0.5) * 2, (r() - 0.5) * 3,
            base, 1.0 + r() * 0.5, 4.2 + r() * 1.6,
            { shrink: 1, alpha: 0.9 });
          break;
        }
        case 'leaves': {
          // occasional leaves: slow fall, strong sideways flutter
          const rr = 45 * Math.sqrt(r());
          _amb.copy(base).lerp(LEAF_ALT, r() * 0.7);
          this.spawn(
            center.x + Math.cos(a) * rr, center.y + 6 + r() * 8, center.z + Math.sin(a) * rr,
            (r() - 0.5) * 9, -1.6 - r() * 1.4, (r() - 0.5) * 9,
            _amb, 1.0 + r() * 0.6, 2.8 + r() * 1.6,
            { drag: 0.45, grav: 1.2, shrink: 0.9, alpha: 0.95 });
          break;
        }
        case 'sand':
        case 'dust': {
          // low soft wisps blowing along one prevailing wind direction
          const rr = 60 * Math.sqrt(r());
          this.spawn(
            center.x + Math.cos(a) * rr, center.y + 0.4 + r() * 1.8, center.z + Math.sin(a) * rr,
            wx * (9 + r() * 7) + (r() - 0.5) * 3, 0.5,
            wz * (9 + r() * 7) + (r() - 0.5) * 3,
            base, 4.5 + r() * 3, 1.8 + r() * 1.4,
            { drag: 0.15, shrink: 1.5, alpha: 0.3 }); // shrink>1: wisps grow as they fade
          break;
        }
        case 'rain': {
          // fast thin streaks slanting with the wind, short lives — the eye
          // reads the motion, not the individual drop
          const rr = 55 * Math.sqrt(r());
          this.spawn(
            center.x + Math.cos(a) * rr, center.y + 14 + r() * 10, center.z + Math.sin(a) * rr,
            wx * 4 + (r() - 0.5) * 2, -34 - r() * 8, wz * 4 + (r() - 0.5) * 2,
            base, 0.55 + r() * 0.3, 0.7 + r() * 0.25,
            { shrink: 1, alpha: 0.34 });
          break;
        }
        case 'embers': {
          // glowing motes rising off the ground, short flickery lives
          const rr = 40 * Math.sqrt(r());
          _amb.copy(base).lerp(EMBER_HOT, r() < 0.4 ? 0.8 : 0.1);
          this.spawn(
            center.x + Math.cos(a) * rr, center.y + 0.2 + r() * 1.2, center.z + Math.sin(a) * rr,
            (r() - 0.5) * 3, 3 + r() * 3, (r() - 0.5) * 3,
            _amb, 0.8 + r() * 0.6, 1.5 + r(),
            { drag: 0.3, shrink: 0.4 });
          break;
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// PER-SURFACE WHEEL FX (SPEC §1.2) — DUSTLINE'S OWN, KEPT.
//
// This is not a port. It is the effect dustline already had, it is the one the
// race loop calls every frame for every wheel of every racer, and its per-
// surface table is the §1.2 table. Two things changed, both stated below; the
// table, the pool size, the integrator and the growth curve are untouched.
//
// It renders instanced world-space quads, where `Particles` above renders
// screen-sized points — that difference is deliberate and explained at the top
// of this file. The v1 recipe for the same job is `Particles.spray()`.
// ---------------------------------------------------------------------------

const FX_MAX = 700;

interface FXDef { color: THREE.Color; size: number; up: number; life: number; onSlipOnly: boolean }

const FX: Partial<Record<SurfaceId, FXDef>> = {
  tarmac: { color: new THREE.Color(0x9a9a9a), size: 0.9, up: 1.6, life: 0.8, onSlipOnly: true },
  gravel: { color: new THREE.Color(0xc2a878), size: 1.4, up: 2.2, life: 1.1, onSlipOnly: false },
  mud: { color: new THREE.Color(0x5e4326), size: 1.1, up: 3.4, life: 0.9, onSlipOnly: false },
  snow: { color: new THREE.Color(0xf2f6fa), size: 1.3, up: 2.8, life: 1.0, onSlipOnly: false },
  sand: { color: new THREE.Color(0xdcc27e), size: 1.5, up: 2.0, life: 1.2, onSlipOnly: false },
  // ice: none, per the spec table
};

export class WheelFX {
  private mesh: THREE.InstancedMesh;
  private pos = new Float32Array(FX_MAX * 3);
  private vel = new Float32Array(FX_MAX * 3);
  private life = new Float32Array(FX_MAX);
  private maxLife = new Float32Array(FX_MAX);
  private size = new Float32Array(FX_MAX);
  private head = 0;
  alive = 0;
  private _m = new THREE.Matrix4();
  private _q = new THREE.Quaternion();
  private _s = new THREE.Vector3();
  private _p = new THREE.Vector3();
  private _c = new THREE.Color();
  private rng: Rng;
  private r = (): number => this.rng.float();

  constructor(scene: THREE.Scene, private camera: THREE.Camera, seed = 0) {
    // CHANGE A: the puff sprite is v1's `particleTexture()` from
    // `templates/textures.ts` (via `sprite()` above) instead of a radial
    // gradient built inline in this constructor. It is the sprite every
    // particle in v1 uses, so the wheel spray and the pool above share one
    // look and one texture, and it stops each WheelFX from building a canvas
    // of its own. The stops differ from the inline version this replaces
    // (v1: 1.0 / 0.6@0.35 / 0 — the old inline one: 0.9 / 0.42@0.55 / 0),
    // which makes the puff core harder and its falloff longer.
    // CHANGE B: the jitter is seeded, for the reason given at the top.
    this.rng = Rng.fork(seed, 'wheelfx');
    const geo = new THREE.PlaneGeometry(1, 1);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffffff, map: sprite(), transparent: true, opacity: 0.6, depthWrite: false,
    });
    this.mesh = new THREE.InstancedMesh(geo, mat, FX_MAX);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    this._m.makeScale(0, 0, 0);
    for (let i = 0; i < FX_MAX; i++) {
      this.mesh.setMatrixAt(i, this._m);
      this.mesh.setColorAt(i, this._c.setRGB(1, 1, 1));
    }
    scene.add(this.mesh);
  }

  /** Called per wheel per frame from the game — spawns by surface + slip. */
  wheelKick(surface: SurfaceId, slipping: boolean, x: number, y: number, z: number, vx: number, vz: number, speed: number) {
    const fx = FX[surface];
    if (!fx) return;
    if (fx.onSlipOnly && !slipping) return;
    if (speed < 5) return;
    const r = this.r;
    const rate = slipping ? 0.85 : Math.min(0.5, speed / 90);
    if (r() > rate) return;
    const i = this.head;
    this.head = (this.head + 1) % FX_MAX;
    const o = i * 3;
    this.pos[o] = x + (r() - 0.5) * 0.5;
    this.pos[o + 1] = y + 0.15;
    this.pos[o + 2] = z + (r() - 0.5) * 0.5;
    this.vel[o] = -vx * 0.25 + (r() - 0.5) * 2;
    this.vel[o + 1] = fx.up * (0.7 + r() * 0.6);
    this.vel[o + 2] = -vz * 0.25 + (r() - 0.5) * 2;
    this.life[i] = this.maxLife[i] = fx.life * (0.7 + r() * 0.6);
    this.size[i] = fx.size * (0.7 + r() * 0.7);
    this.mesh.setColorAt(i, fx.color);
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }

  update(dt: number) {
    this.camera.getWorldQuaternion(this._q); // billboards face the camera
    let count = 0;
    for (let i = 0; i < FX_MAX; i++) {
      if (this.life[i] <= 0) continue;
      this.life[i] -= dt;
      const o = i * 3;
      if (this.life[i] <= 0) {
        this._m.makeScale(0, 0, 0);
        this.mesh.setMatrixAt(i, this._m);
        continue;
      }
      count++;
      this.vel[o + 1] -= 2.2 * dt;                    // light gravity
      this.vel[o] *= 1 - 1.4 * dt;                    // drag
      this.vel[o + 2] *= 1 - 1.4 * dt;
      this.pos[o] += this.vel[o] * dt;
      this.pos[o + 1] += this.vel[o + 1] * dt;
      this.pos[o + 2] += this.vel[o + 2] * dt;
      const f = this.life[i] / this.maxLife[i];
      const s = this.size[i] * (1.6 - f * 0.9);       // grow as they fade
      this._p.set(this.pos[o], this.pos[o + 1], this.pos[o + 2]);
      this._s.set(s, s, s);
      this._m.compose(this._p, this._q, this._s);
      this.mesh.setMatrixAt(i, this._m);
    }
    this.alive = count;
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  /** Drop every live puff. Same reason as `Particles.reset()`: a level swap
   *  otherwise leaves the last world's spray hanging over the new one. */
  reset() {
    this.life.fill(0);
    this._m.makeScale(0, 0, 0);
    for (let i = 0; i < FX_MAX; i++) this.mesh.setMatrixAt(i, this._m);
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}
