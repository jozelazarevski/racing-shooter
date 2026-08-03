// One pooled GPU particle system drives every effect: explosions, sparks,
// exhaust, drift smoke, missile trails.
import * as THREE from 'three';
import { particleTexture } from './textures.js';

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
const SPLINTER_DEF = [0xc23b2a, 0xe8e2d4]; // fallback fence colors (theme may override)
const SPLINTER_WHITE = new THREE.Color('#fff8ec');
const _splA = new THREE.Color();
const _splB = new THREE.Color();
// weapon-feel palette (cached — these recipes fire many times per second)
const EXPL_COLS = [new THREE.Color('#fff3b0'), new THREE.Color('#ffb52e'), new THREE.Color('#ff5e2e'), new THREE.Color('#d43a1a')];
const EXPL_WHITE = new THREE.Color('#ffffff');
const EXPL_SMOKE = new THREE.Color('#4a443c');
const MUZZLE_CORE = new THREE.Color('#fffdf2');
const MUZZLE_FLARE = new THREE.Color('#ffd76a');
const RICO_HOT = new THREE.Color('#fffbe8');
const RICO_A = new THREE.Color('#ffe86b');
const RICO_B = new THREE.Color('#ffab3d');
const MISSILE_SMOKE = new THREE.Color('#9a938a');

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
// stave/hoop pairs mirroring track.js BARREL_PALETTES, so a smashed barrel
// sheds ITS colour. setTheme(levelTheme) selects one; unknown themes fall back
// to the wooden default. (Kept here rather than imported: particles.js must
// stay free of track/theme imports.)
const BARREL_TINTS = {
  desert: ['#c29a5c', '#4a3620'], canyon: ['#9a6440', '#33291e'],
  volcano: ['#37322e', '#e8381e'], glacial: ['#7aa8c4', '#2c4456'],
  jungle: ['#5a7a34', '#2c3a1a'], dunes: ['#c9a05e', '#4a3620'],
  ravine: ['#8f5434', '#2e2016'], wildfire: ['#2e2a26', '#e8481e'],
  sheetice: ['#8ab4d0', '#2c4456'], avalanche: ['#7aa8c4', '#2c4456'],
  neon: ['#22262e', '#26f6ff'], undercity: ['#3a4034', '#8a9a3c'],
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
const AMBIENT_RATES = { snow: 150, leaves: 14, sand: 70, dust: 70, embers: 45, rain: 230 };
// phones get a leaner ambient budget — same look, less overdraw
const MOBILE_AMBIENT = (matchMedia?.('(pointer: coarse)').matches || 'ontouchstart' in globalThis) ? 0.5 : 1;
const MOBILE_BURST = MOBILE_AMBIENT < 1 ? 0.6 : 1; // prop-burst count scale on phones
const _amb = new THREE.Color();                // scratch: per-spawn tint mix

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

export class Particles {
  constructor(scene) {
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
    this.head = 0;

    const mat = new THREE.ShaderMaterial({
      uniforms: { uMap: { value: particleTexture() } },
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

  spawn(x, y, z, vx, vy, vz, color, size, life, { drag = 0, grav = 0, shrink = 0.8, alpha = 1 } = {}) {
    const i = this.head;
    this.head = (this.head + 1) % MAX;
    this.pos[i * 3] = x; this.pos[i * 3 + 1] = y; this.pos[i * 3 + 2] = z;
    this.vel[i * 3] = vx; this.vel[i * 3 + 1] = vy; this.vel[i * 3 + 2] = vz;
    this.col[i * 3] = color.r; this.col[i * 3 + 1] = color.g; this.col[i * 3 + 2] = color.b;
    this.life[i] = life; this.maxLife[i] = life;
    this.baseSize[i] = size; this.size[i] = size;
    this.alpha[i] = alpha; this.balpha[i] = alpha;
    this.drag[i] = drag; this.grav[i] = grav; this.shrink[i] = shrink;
  }

  update(dt) {
    this._burstSpent = 0; // prop-burst budget resets every frame
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
    this.geo.attributes.aColor.needsUpdate = true;
    this.geo.attributes.aSize.needsUpdate = true;
    this.geo.attributes.aAlpha.needsUpdate = true;
  }

  // ---- effect recipes ----
  explosion(p, big = false) {
    const n = big ? 90 : 45;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = (Math.random() ** 0.6) * (big ? 26 : 15);
      const up = Math.random() * (big ? 20 : 12);
      this.spawn(p.x, p.y + 0.5, p.z,
        Math.cos(a) * r, up, Math.sin(a) * r,
        EXPL_COLS[(Math.random() * EXPL_COLS.length) | 0],
        (big ? 5 : 3.4) * (0.5 + Math.random()),
        0.5 + Math.random() * (big ? 0.9 : 0.5),
        { drag: 2.2, grav: 8, shrink: 0.3 });
    }
    // white flash core
    for (let i = 0; i < 8; i++)
      this.spawn(p.x, p.y + 1, p.z, (Math.random() - 0.5) * 4, Math.random() * 3, (Math.random() - 0.5) * 4,
        EXPL_WHITE, big ? 14 : 9, 0.18, { shrink: 1 });
    // smoke
    for (let i = 0; i < (big ? 20 : 10); i++) {
      const a = Math.random() * Math.PI * 2, r = Math.random() * 5;
      this.spawn(p.x + Math.cos(a) * 2, p.y + 1, p.z + Math.sin(a) * 2,
        Math.cos(a) * r, 4 + Math.random() * 5, Math.sin(a) * r,
        EXPL_SMOKE, 6 + Math.random() * 5, 1.2 + Math.random(), { drag: 1.5, shrink: 0.2 });
    }
  }

  /** Warhead detonation (missiles, mines): the big fireball PLUS a flat
   *  debris ring skipping outward and a rolling ground-dust ring. Pure
   *  presentation — damage/radius live in weapons.js and are untouched. */
  detonation(p) {
    this.explosion(p, true);
    // debris ring — chunks hurled out flat at even angles, hard and low
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2 + Math.random() * 0.35;
      const sp = 16 + Math.random() * 11;
      this.spawn(p.x, p.y + 0.4, p.z,
        Math.cos(a) * sp, 3 + Math.random() * 5, Math.sin(a) * sp,
        Math.random() < 0.5 ? DEBRIS_A : DEBRIS_B,
        1.8 + Math.random() * 1.4, 0.5 + Math.random() * 0.4,
        { grav: 30, drag: 0.8, shrink: 0.85 });
    }
    // ground shock puffs rolling out under the fireball
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + Math.random() * 0.5;
      this.spawn(p.x + Math.cos(a) * 1.5, p.y + 0.3, p.z + Math.sin(a) * 1.5,
        Math.cos(a) * 20, 1.2, Math.sin(a) * 20,
        Math.random() < 0.5 ? DUST_A : DUST_B, 3.5 + Math.random() * 2, 0.5 + Math.random() * 0.25,
        { drag: 3.2, shrink: 1.4, alpha: 0.5 });
    }
  }

  /** Cannon muzzle flash: one hot core pop + two flares thrown forward.
   *  Very short lives — reads as a punch, costs 3 pool slots per shot. */
  muzzleFlash(p, dir) {
    this.spawn(p.x, p.y, p.z, dir.x * 3, 0.6, dir.z * 3,
      MUZZLE_CORE, 4.6 + Math.random() * 1.8, 0.07, { shrink: 1 });
    for (let i = 0; i < 2; i++) {
      this.spawn(p.x, p.y, p.z,
        dir.x * (10 + Math.random() * 8) + (Math.random() - 0.5) * 3,
        0.8 + Math.random() * 1.6,
        dir.z * (10 + Math.random() * 8) + (Math.random() - 0.5) * 3,
        MUZZLE_FLARE, 2.2 + Math.random() * 1.2, 0.09 + Math.random() * 0.06,
        { drag: 4, shrink: 0.9 });
    }
  }

  /** Bullet ricochet on a world hit: a varied spark burst — count, ejection
   *  cone and heat all jitter so no two impacts read the same. */
  ricochet(p, normal) {
    const n = 4 + (Math.random() * 6 | 0);
    const tiltA = Math.random() * Math.PI * 2, tilt = Math.random() * 0.7;
    const nx = normal.x + Math.cos(tiltA) * tilt, nz = normal.z + Math.sin(tiltA) * tilt;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 4 + Math.random() * 12;
      this.spawn(p.x, p.y + 0.2, p.z,
        nx * sp + Math.cos(a) * 3.5, 2 + Math.random() * 7, nz * sp + Math.sin(a) * 3.5,
        Math.random() < 0.3 ? RICO_HOT : (Math.random() < 0.6 ? RICO_A : RICO_B),
        1.3 + Math.random() * 1.3, 0.16 + Math.random() * 0.3,
        { grav: 26, shrink: 0.4 });
    }
    // hot flash pop right at the impact point
    this.spawn(p.x, p.y + 0.25, p.z, 0, 1.5, 0, RICO_HOT, 3 + Math.random() * 2, 0.08, { shrink: 1 });
  }

  /** Thin grey puff for missile smoke trails (weapons caps at ~20/s each).
   *  shrink > 1 makes the puff grow as it fades — a hanging smoke rope. */
  missileSmoke(p) {
    this.spawn(p.x + (Math.random() - 0.5) * 0.3, p.y + (Math.random() - 0.5) * 0.3, p.z + (Math.random() - 0.5) * 0.3,
      (Math.random() - 0.5) * 1.2, 0.8 + Math.random() * 0.8, (Math.random() - 0.5) * 1.2,
      MISSILE_SMOKE, 1.6 + Math.random() * 1.1, 0.7 + Math.random() * 0.4,
      { drag: 1.2, shrink: 1.6, alpha: 0.55 });
  }

  /** Shockwave ground dust: a full circle kicked outward with the ring.
   *  High drag = fast launch that eases off, matching the pressure wave. */
  shockDust(p, count = 20) {
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + Math.random() * 0.4;
      const sp = 22 + Math.random() * 10;
      this.spawn(p.x + Math.cos(a) * 2, p.y + 0.25, p.z + Math.sin(a) * 2,
        Math.cos(a) * sp, 1.5 + Math.random() * 2, Math.sin(a) * sp,
        Math.random() < 0.5 ? DUST_A : DUST_B,
        3 + Math.random() * 2.2, 0.55 + Math.random() * 0.3,
        { drag: 2.6, shrink: 1.5, alpha: 0.6 });
    }
  }

  /** Point the prop-crush recipes at a world: currently just the barrel
   *  stave/hoop pair, so a smashed drum sheds the theme's own colours.
   *  Safe to call with anything (unknown/undefined → wooden default). */
  setTheme(themeId) {
    this.barrelTint = BARREL_TINTS[themeId] ?? null;
  }

  /** Material-aware crush burst for smashed props. `type` is the prop's
   *  `pr.type` string; `dir` a horizontal unit vector away from the impactor
   *  (null → radial); `energy` 0..1 from impact speed (call sites pass
   *  min(1, |speedAlong|/30), weapons ~0.8); `colors` optionally overrides the
   *  two-tone tint (e.g. theme BARREL_PALETTES [base, hoop]). Pure pooled
   *  sprites — obeys the shared MAX pool + point-size clamp, ×0.6 on mobile.
   *  Set `particles.barrelTint = [hexA, hexB]` once per level as an alternate
   *  way to plumb the theme barrel palette without touching call sites. */
  propBurst(at, type, dir = null, energy = 0.6, colors = null) {
    const k = THREE.MathUtils.clamp(energy, 0, 1);
    const dx = dir?.x ?? 0, dz = dir?.z ?? 0;
    // one shard, thrown out+up biased along dir: shared by the hard recipes
    const shard = (c, size, out, up, life, grav, drag = 0.7, shrink = 0.85, alpha = 1) => {
      const a = Math.random() * Math.PI * 2;
      this.spawn(at.x, at.y + 0.4, at.z,
        dx * out + Math.cos(a) * out * 0.55, up, dz * out + Math.sin(a) * out * 0.55,
        c, size, life, { grav, drag, shrink, alpha });
    };
    // count helper: mobile scale + the per-frame burst budget, and it books
    // what it hands out so a multi-prop blast thins itself instead of the pool
    const thin = (this._burstSpent ?? 0) > BURST_BUDGET ? 0.4 : 1;
    const n = (base, spread) => {
      const c = Math.max(1, Math.round((base + Math.random() * spread) * MOBILE_BURST * thin));
      this._burstSpent = (this._burstSpent ?? 0) + c;
      return c;
    };
    switch (type) {
      case 'crate': {
        // chunky two-tone planks out+up, pale fast slivers, a tan dust puff
        for (let i = n(12, 6 * k); i > 0; i--)
          shard(Math.random() < 0.55 ? CRATE_A : CRATE_B, 2 + Math.random() * 1.4,
            (8 + Math.random() * 8) * (0.5 + k * 0.5), 4 + Math.random() * 5 + k * 3,
            0.3 + Math.random() * 0.3, 30);
        for (let i = n(4, 2); i > 0; i--)
          shard(SPLINTER_WHITE, 1.2 + Math.random() * 0.6,
            14 + Math.random() * 8, 3 + Math.random() * 4, 0.1 + Math.random() * 0.1, 20, 0.3, 1);
        for (let i = n(3, 0); i > 0; i--)
          shard(Math.random() < 0.5 ? DUST_A : DUST_B, 3 + Math.random() * 2,
            2 + Math.random() * 2, 1.5 + Math.random() * 1.5, 0.5 + Math.random() * 0.3, 2, 1.5, 1.4, 0.5);
        break;
      }
      case 'barrel': {
        // stave shards in the theme palette + dark hoop glints, flatter arc
        _pbA.set(colors?.[0] ?? this.barrelTint?.[0] ?? BARREL_DEF_A);
        _pbB.set(colors?.[1] ?? this.barrelTint?.[1] ?? BARREL_DEF_B);
        for (let i = n(10, 6 * k); i > 0; i--)
          shard(Math.random() < 0.7 ? _pbA : _pbB, 1.9 + Math.random() * 1.3,
            (9 + Math.random() * 8) * (0.5 + k * 0.5), 2.5 + Math.random() * 3.5 + k * 2,
            0.3 + Math.random() * 0.3, 32);
        for (let i = n(2, 1); i > 0; i--) // hoop rings skipping out low and fast
          shard(_pbB, 2.4 + Math.random() * 0.8,
            13 + Math.random() * 7, 2 + Math.random() * 2, 0.35 + Math.random() * 0.2, 34, 0.4);
        break;
      }
      case 'hay': {
        // soft golden straw — floats and flutters, no hard chunks, plus chaff
        for (let i = n(16, 8 * k); i > 0; i--) {
          const a = Math.random() * Math.PI * 2;
          this.spawn(at.x, at.y + 0.5, at.z,
            dx * (4 + Math.random() * 5) + Math.cos(a) * 5 + (Math.random() - 0.5) * 4,
            3 + Math.random() * 4.5 + k * 2,
            dz * (4 + Math.random() * 5) + Math.sin(a) * 5 + (Math.random() - 0.5) * 4,
            Math.random() < 0.55 ? HAY_A : HAY_B, 1.2 + Math.random(),
            1 + Math.random() * 0.6, { grav: 6, drag: 0.8, shrink: 0.6, alpha: 0.95 });
        }
        for (let i = n(4, 0); i > 0; i--) // chaff dust cloud hanging where the bale was
          shard(HAY_B, 3.5 + Math.random() * 2.5, 1.5 + Math.random() * 2,
            1.5 + Math.random() * 2, 0.9 + Math.random() * 0.5, 1, 1.2, 1.5, 0.35);
        break;
      }
      case 'snowman': {
        // white/pale-blue chunks + a growing powder puff
        for (let i = n(10, 4 * k); i > 0; i--)
          shard(Math.random() < 0.6 ? SNOW_A : SNOW_B, 1.8 + Math.random() * 1.2,
            (7 + Math.random() * 7) * (0.5 + k * 0.5), 3.5 + Math.random() * 4,
            0.4 + Math.random() * 0.3, 26);
        // powder puff: starts fat and shrinks away as it fades (shrink < 1),
        // the opposite of the tan dust clouds — reads as settling snow
        for (let i = n(5, 0); i > 0; i--)
          shard(SNOW_A, 4.4 + Math.random() * 2.6, 2 + Math.random() * 2.5,
            1.5 + Math.random() * 2, 0.6 + Math.random() * 0.35, 2, 1.4, 0.4, 0.55);
        break;
      }
      case 'cone': {
        for (let i = n(6, 2); i > 0; i--)
          shard(CONE_ORANGE, 1.1 + Math.random() * 0.6,
            12 + Math.random() * 8 * (0.5 + k), 3 + Math.random() * 4,
            0.25 + Math.random() * 0.2, 30, 0.5);
        for (let i = n(2, 0); i > 0; i--)
          shard(CONE_WHITE, 1.1 + Math.random() * 0.5,
            13 + Math.random() * 7, 3 + Math.random() * 3, 0.2 + Math.random() * 0.15, 30, 0.5);
        break;
      }
      case 'rock': {
        // hard low grey chips + brief grey dust
        for (let i = n(8, 2); i > 0; i--)
          shard(Math.random() < 0.5 ? ROCK_A : ROCK_B, 1.5 + Math.random(),
            (10 + Math.random() * 8) * (0.5 + k * 0.5), 1.5 + Math.random() * 2.5,
            0.3 + Math.random() * 0.2, 36, 0.4);
        for (let i = n(3, 0); i > 0; i--)
          shard(SMOKE_GRAY, 3 + Math.random() * 2, 2 + Math.random() * 2,
            1 + Math.random() * 1.5, 0.4 + Math.random() * 0.2, 2, 1.6, 1.4, 0.4);
        break;
      }
      case 'penguin': {
        // comedic: a few dark+white flecks and a feathery flutter
        for (let i = n(6, 2); i > 0; i--)
          shard(Math.random() < 0.5 ? PENG_DARK : PENG_WHITE, 1.3 + Math.random() * 0.7,
            6 + Math.random() * 6, 4 + Math.random() * 4, 0.5 + Math.random() * 0.3, 22);
        for (let i = n(5, 3); i > 0; i--) { // feathers — hay physics, monochrome
          const a = Math.random() * Math.PI * 2;
          this.spawn(at.x, at.y + 0.7, at.z,
            Math.cos(a) * 4 + (Math.random() - 0.5) * 4, 2.5 + Math.random() * 3.5,
            Math.sin(a) * 4 + (Math.random() - 0.5) * 4,
            PENG_WHITE, 1 + Math.random() * 0.7, 1 + Math.random() * 0.5,
            { grav: 5, drag: 0.9, shrink: 0.6, alpha: 0.9 });
        }
        break;
      }
      default: {
        // unknown props (fences, troughs, feed bins): debris look, tintable
        _pbA.set(colors?.[0] ?? DEBRIS_A);
        _pbB.set(colors?.[1] ?? DEBRIS_B);
        for (let i = n(8, 2 + 2 * k); i > 0; i--)
          shard(Math.random() < 0.5 ? _pbA : _pbB, 1.6 + Math.random() * 1.1,
            (6 + Math.random() * 7) * (0.5 + k * 0.5), 4 + Math.random() * 5,
            0.4 + Math.random() * 0.35, 30, 0.4);
      }
    }
  }

  /** Debris-shrapnel contact pop: a small hot spark burst where a flying
   *  chunk clips a car. Cheap — flying debris can land several of these/s. */
  debrisHit(p) {
    for (let i = 0, c = Math.round(5 * MOBILE_BURST); i < c; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 3 + Math.random() * 8;
      this.spawn(p.x, p.y + 0.6, p.z,
        Math.cos(a) * sp, 2 + Math.random() * 5, Math.sin(a) * sp,
        Math.random() < 0.5 ? RICO_A : RICO_B, 1.2 + Math.random(),
        0.15 + Math.random() * 0.2, { grav: 22, shrink: 0.4 });
    }
    this.spawn(p.x, p.y + 0.7, p.z, 0, 1.2, 0, RICO_HOT, 2.6 + Math.random() * 1.4, 0.08, { shrink: 1 });
  }

  sparks(p, normal, count = 10) {
    const c1 = new THREE.Color('#ffe86b'), c2 = new THREE.Color('#2ef7ff');
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 5 + Math.random() * 13;
      this.spawn(p.x, p.y + 0.3, p.z,
        normal.x * sp + Math.cos(a) * 4, 2.5 + Math.random() * 6, normal.z * sp + Math.sin(a) * 4,
        Math.random() < 0.6 ? c1 : c2, 1.6 + Math.random() * 1.2, 0.28 + Math.random() * 0.35,
        { grav: 24, shrink: 0.35 });
    }
    // a couple of white-hot core pops for punch
    const hot = new THREE.Color('#fffbe8');
    for (let i = 0, n = Math.max(1, count >> 2); i < n; i++) {
      this.spawn(p.x, p.y + 0.35, p.z,
        normal.x * 6 + (Math.random() - 0.5) * 5, 3 + Math.random() * 4, normal.z * 6 + (Math.random() - 0.5) * 5,
        hot, 2.4 + Math.random() * 1.4, 0.14 + Math.random() * 0.12, { grav: 14, shrink: 0.7 });
    }
  }

  exhaust(p, back, color, boost = false) {
    const c = boost ? EXHAUST_BOOST : color;
    this.spawn(
      p.x + (Math.random() - 0.5) * 0.5, p.y + 0.35, p.z + (Math.random() - 0.5) * 0.5,
      back.x * (boost ? 26 : 9) + (Math.random() - 0.5) * 2, 0.6, back.z * (boost ? 26 : 9) + (Math.random() - 0.5) * 2,
      c, boost ? 3.4 : 1.7, boost ? 0.4 : 0.28, { drag: 3, shrink: 0.4 });
  }

  driftSmoke(p) {
    // big soft dust cloud kicked up while sliding on the dirt
    this.spawn(p.x + (Math.random() - 0.5) * 0.6, p.y + 0.2, p.z + (Math.random() - 0.5) * 0.6,
      (Math.random() - 0.5) * 3.6, 1.8 + Math.random() * 2.4, (Math.random() - 0.5) * 3.6,
      Math.random() < 0.5 ? DRIFT_A : DRIFT_B, 3.6 + Math.random() * 2.6, 0.85 + Math.random() * 0.5,
      { drag: 1.8, shrink: 0.15 });
  }

  /** Constant rolling dust from wheels on dirt. intensity 0..1 scales size/loft. */
  dust(p, intensity = 0.5) {
    this.spawn(p.x + (Math.random() - 0.5) * 0.6, p.y + 0.15, p.z + (Math.random() - 0.5) * 0.6,
      (Math.random() - 0.5) * 2.5, 1.2 + Math.random() * 1.6 + intensity * 1.5, (Math.random() - 0.5) * 2.5,
      Math.random() < 0.5 ? DUST_A : DUST_B,
      1.7 + Math.random() * 1.4 + intensity * 1.8,
      0.45 + Math.random() * 0.35 + intensity * 0.25,
      { drag: 2.2, shrink: 0.15 });
  }

  /** Engine-bay damage smoke. severity 0..1: gray puffs -> thick dark smoke + fire flickers. */
  damageSmoke(p, severity = 0.5) {
    const dark = severity > 0.5;
    this.spawn(p.x + (Math.random() - 0.5) * 0.5, p.y, p.z + (Math.random() - 0.5) * 0.5,
      (Math.random() - 0.5) * 1.5, 2.2 + severity * 2.5 + Math.random() * 1.5, (Math.random() - 0.5) * 1.5,
      dark ? SMOKE_DARK : SMOKE_GRAY,
      2.2 + severity * 2.4 + Math.random() * 1.2,
      0.7 + severity * 0.5 + Math.random() * 0.3,
      { drag: 1.6, shrink: 0.2 });
    if (dark && Math.random() < 0.45) {
      // orange fire flicker licking out of the engine bay
      this.spawn(p.x + (Math.random() - 0.5) * 0.7, p.y - 0.15, p.z + (Math.random() - 0.5) * 0.7,
        (Math.random() - 0.5) * 1.2, 2.5 + Math.random() * 2.5, (Math.random() - 0.5) * 1.2,
        Math.random() < 0.6 ? FIRE_A : FIRE_B, 1.5 + Math.random() * 1.3, 0.22 + Math.random() * 0.15,
        { drag: 1, shrink: 0.5 });
    }
  }

  /** Fence-post splinters: 8-14 chunky theme-colored shards thrown out and up
   *  off a barrier hit, plus a white flash pop. colors: [hexA, hexB] (theme
   *  splinter pair); intensity 0..1 scales count and throw speed. */
  splinters(p, normal, colors = null, intensity = 0.6) {
    _splA.set(colors?.[0] ?? SPLINTER_DEF[0]);
    _splB.set(colors?.[1] ?? SPLINTER_DEF[1]);
    const k = THREE.MathUtils.clamp(intensity, 0, 1);
    const n = 8 + Math.round(6 * k);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const out = 7 + Math.random() * 8 + k * 7; // strong outward throw off the fence
      this.spawn(p.x, p.y + 0.5, p.z,
        normal.x * out + Math.cos(a) * 5.5, 5 + Math.random() * 6 + k * 4, normal.z * out + Math.sin(a) * 5.5,
        Math.random() < 0.55 ? _splA : _splB,
        2.3 + Math.random() * 1.7,          // big chunks — reads as broken planks
        0.28 + Math.random() * 0.3,         // short life, they tumble and die fast
        { grav: 34, drag: 0.6, shrink: 0.85 });
    }
    // white flash pop right at the break point
    for (let i = 0; i < 3; i++) {
      this.spawn(p.x, p.y + 0.6, p.z,
        (Math.random() - 0.5) * 4, 2 + Math.random() * 3, (Math.random() - 0.5) * 4,
        SPLINTER_WHITE, 4.2 + Math.random() * 2.2, 0.12 + Math.random() * 0.08, { shrink: 1 });
    }
  }

  /** Dark chunks thrown off a car by a heavy hit. */
  debris(p, count = 3) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 5 + Math.random() * 8;
      this.spawn(p.x, p.y + 0.9, p.z,
        Math.cos(a) * sp, 6 + Math.random() * 7, Math.sin(a) * sp,
        Math.random() < 0.5 ? DEBRIS_A : DEBRIS_B, 1.6 + Math.random() * 1.1,
        0.6 + Math.random() * 0.5, { grav: 30, drag: 0.4, shrink: 0.85 });
    }
  }

  trail(p, color) {
    this.spawn(p.x, p.y, p.z,
      (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2,
      color, 2.2, 0.35, { shrink: 0.5 });
  }

  pickupBurst(p, color) {
    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * Math.PI * 2;
      this.spawn(p.x, p.y, p.z, Math.cos(a) * 9, 5 + Math.random() * 4, Math.sin(a) * 9,
        color, 2.2, 0.5, { drag: 2, grav: 6, shrink: 0.4 });
    }
  }

  /** Ambient weather around `center` (the player), called every frame by the
   *  lead with track.theme.weather ({type, color}) — no-op when undefined.
   *  Types: 'snow' | 'leaves' | 'sand' | 'dust' | 'embers'. Budget ≤3 spawns
   *  per call; a fractional accumulator keeps rates frame-rate independent. */
  ambient(center, weather, dt) {
    if (!weather || !weather.type || !(dt > 0)) return;
    const rate = (weather.rate ?? AMBIENT_RATES[weather.type] ?? 0) * MOBILE_AMBIENT;
    if (!rate) return;
    if (this._ambHex !== weather.color) { // theme tint, cached across frames
      this._ambHex = weather.color;
      this._ambColor = this._ambColor || new THREE.Color();
      this._ambColor.set(weather.color ?? 0xffffff);
    }
    if (this._windA === undefined) this._windA = Math.random() * Math.PI * 2; // prevailing wind
    this._ambAcc = (this._ambAcc ?? 0) + rate * dt;
    // rain needs a higher per-frame budget than other weather
    let n = Math.min(weather.type === 'rain' ? 5 : 3, Math.floor(this._ambAcc));
    if (n <= 0) return;
    this._ambAcc -= n;
    const base = this._ambColor;
    const wx = Math.cos(this._windA), wz = Math.sin(this._windA);
    for (; n > 0; n--) {
      const a = Math.random() * Math.PI * 2;
      switch (weather.type) {
        case 'snow': {
          // slow flakes drifting down through a wide column over the player
          const r = 70 * Math.sqrt(Math.random());
          this.spawn(
            center.x + Math.cos(a) * r, center.y + 20 + Math.random() * 10, center.z + Math.sin(a) * r,
            (Math.random() - 0.5) * 3, -6 + (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 3,
            base, 1.0 + Math.random() * 0.5, 4.2 + Math.random() * 1.6,
            { shrink: 1, alpha: 0.9 });
          break;
        }
        case 'leaves': {
          // occasional leaves: slow fall, strong sideways flutter
          const r = 45 * Math.sqrt(Math.random());
          _amb.copy(base).lerp(LEAF_ALT, Math.random() * 0.7);
          this.spawn(
            center.x + Math.cos(a) * r, center.y + 6 + Math.random() * 8, center.z + Math.sin(a) * r,
            (Math.random() - 0.5) * 9, -1.6 - Math.random() * 1.4, (Math.random() - 0.5) * 9,
            _amb, 1.0 + Math.random() * 0.6, 2.8 + Math.random() * 1.6,
            { drag: 0.45, grav: 1.2, shrink: 0.9, alpha: 0.95 });
          break;
        }
        case 'sand':
        case 'dust': {
          // low soft wisps blowing along one prevailing wind direction
          const r = 60 * Math.sqrt(Math.random());
          this.spawn(
            center.x + Math.cos(a) * r, center.y + 0.4 + Math.random() * 1.8, center.z + Math.sin(a) * r,
            wx * (9 + Math.random() * 7) + (Math.random() - 0.5) * 3, 0.5,
            wz * (9 + Math.random() * 7) + (Math.random() - 0.5) * 3,
            base, 4.5 + Math.random() * 3, 1.8 + Math.random() * 1.4,
            { drag: 0.15, shrink: 1.5, alpha: 0.3 }); // shrink>1: wisps grow as they fade
          break;
        }
        case 'rain': {
          // fast thin streaks slanting with the wind, short lives — the eye
          // reads the motion, not the individual drop
          const r = 55 * Math.sqrt(Math.random());
          this.spawn(
            center.x + Math.cos(a) * r, center.y + 14 + Math.random() * 10, center.z + Math.sin(a) * r,
            wx * 4 + (Math.random() - 0.5) * 2, -34 - Math.random() * 8, wz * 4 + (Math.random() - 0.5) * 2,
            base, 0.55 + Math.random() * 0.3, 0.7 + Math.random() * 0.25,
            { shrink: 1, alpha: 0.34 });
          break;
        }
        case 'embers': {
          // glowing motes rising off the ground, short flickery lives
          const r = 40 * Math.sqrt(Math.random());
          _amb.copy(base).lerp(EMBER_HOT, Math.random() < 0.4 ? 0.8 : 0.1);
          this.spawn(
            center.x + Math.cos(a) * r, center.y + 0.2 + Math.random() * 1.2, center.z + Math.sin(a) * r,
            (Math.random() - 0.5) * 3, 3 + Math.random() * 3, (Math.random() - 0.5) * 3,
            _amb, 0.8 + Math.random() * 0.6, 1.5 + Math.random(),
            { drag: 0.3, shrink: 0.4 });
          break;
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Fading tire-skid decals: one InstancedMesh of road-hugging dark quads.
// Cars call add() while sliding; marks sit for a few seconds then shrink away.
const _SK_UP = new THREE.Vector3(0, 1, 0);
const _skM = new THREE.Matrix4();
const _skQ = new THREE.Quaternion();
const _skS = new THREE.Vector3();
const _skP = new THREE.Vector3();

export class SkidMarks {
  constructor(scene, max = 800) {
    this.max = max;
    const geo = new THREE.PlaneGeometry(0.42, 1.55);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x141009, transparent: true, opacity: 0.42, depthWrite: false,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    });
    this.mesh = new THREE.InstancedMesh(geo, mat, max);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 1; // above the road, below particles
    this.life = new Float32Array(max);       // seconds remaining (0 = free slot)
    this.data = new Float32Array(max * 5);   // x, y, z, heading, width-scale
    this.head = 0;
    _skM.makeScale(0, 0, 0);
    for (let i = 0; i < max; i++) this.mesh.setMatrixAt(i, _skM);
    scene.add(this.mesh);
  }

  add(x, y, z, heading, intensity = 1) {
    const i = this.head;
    this.head = (this.head + 1) % this.max;
    this.life[i] = 7;
    const o = i * 5;
    this.data[o] = x; this.data[o + 1] = y; this.data[o + 2] = z;
    this.data[o + 3] = heading;
    this.data[o + 4] = 0.75 + intensity * 0.5;
    this._compose(i, 1);
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  _compose(i, fade) {
    const o = i * 5;
    _skQ.setFromAxisAngle(_SK_UP, this.data[o + 3]);
    _skS.set(this.data[o + 4] * fade, 1, fade);
    _skP.set(this.data[o], this.data[o + 1], this.data[o + 2]);
    _skM.compose(_skP, _skQ, _skS);
    this.mesh.setMatrixAt(i, _skM);
  }

  update(dt) {
    let dirty = false;
    for (let i = 0; i < this.max; i++) {
      if (this.life[i] <= 0) continue;
      this.life[i] -= dt;
      if (this.life[i] <= 0) {
        _skM.makeScale(0, 0, 0);
        this.mesh.setMatrixAt(i, _skM);
        dirty = true;
      } else if (this.life[i] < 1.4) {
        this._compose(i, this.life[i] / 1.4); // shrink out at end of life
        dirty = true;
      }
    }
    if (dirty) this.mesh.instanceMatrix.needsUpdate = true;
  }
}
