// NEON STRIKE — 3D top-down racing shooter. All visuals procedural.
import * as THREE from 'three';
import { EffectComposer } from '../lib/postprocessing/EffectComposer.js';
import { RenderPass } from '../lib/postprocessing/RenderPass.js';
import { UnrealBloomPass } from '../lib/postprocessing/UnrealBloomPass.js';
import { OutputPass } from '../lib/postprocessing/OutputPass.js';
import { ShaderPass } from '../lib/postprocessing/ShaderPass.js';

import { Track, LEVELS, circuitPoints } from './track.js';
import { PlayerCar, EnemyCar, CAR_CATALOG, buildCarMesh } from './vehicles.js';
import { Chopper } from './choppers.js';
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

const CAM_MODES = [
  { name: 'TOP-DOWN',  back: 20, h: 52, look: 7,  lookH: 0,   spdBack: 6, spdH: 10 },
  { name: 'TOP FAR',   back: 24, h: 84, look: 1,  lookH: 0,   spdBack: 4, spdH: 10 },
  { name: 'CHASE',     back: 13, h: 7.5, look: 10, lookH: 2.8, spdBack: 2, spdH: 1, chase: true },
  { name: 'CHASE FAR', back: 24, h: 15, look: 13, lookH: 3,   spdBack: 3, spdH: 2, chase: true },
];
// ---- economy ----
// Score is the arcade number (it inflates fast: 500/lap, big rank bonus,
// points for every smashed crate). Credits are DELIBERATELY a small slice of
// it, so a good race funds real progress but never buys the garage outright.
const CREDIT_RATE = 1 / 12;                // score -> credits
const PODIUM_CR = [200, 120, 60];          // 1st / 2nd / 3rd
const FIRST_CLEAR_CR = 500;                // once per world, on your first podium
const upgradeCost = (lvl) => 500 + lvl * 400;   // 500/900/1300/1700/2100 per line

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
// Each pasture hosts one species; the roster cycles across a world's pastures,
// so biomes read mixed (alpine roads pass cows, sheep AND goats).
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
  desert:   { kinds: ['camel'],                perHerd: 3 },
  dunes:    { kinds: ['camel'],                perHerd: 3 },
  oasis:    { kinds: ['camel', 'cow'],         perHerd: 3 },
  jungle:   { kinds: ['capybara', 'deer'],     perHerd: 3 },
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
const profileKey = (id, base) => `ir-p${id}-${base}`;
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
    this.profile = this.profiles.list.find((p) => p.id === this.profiles.active) ?? this.profiles.list[0];
    this._pkey = (base) => profileKey(this.profile.id, base);
    this.career = loadJSON(this._pkey('career'), { finished: {} });
    this.garage = loadJSON(this._pkey('garage'), { credits: 0 });
    this.cars = loadJSON(this._pkey('cars'), { owned: ['brawler'], selected: 'brawler' });
    if (!this.cars.owned.includes(this.cars.selected)) this.cars.selected = 'brawler';
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
    // mode comes from the URL only — a fresh visit ALWAYS starts in RACE mode
    // (persisting roam silently made races "never finish" for returning players)
    this.freeRoam = params.get('mode') === 'roam';
    this.steerSetting = localStorage.getItem('ir-steer') || 'normal';
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
    this.renderer.toneMappingExposure = 1.12;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0xcfe8f5, 320, 1500);
    this.camera = new THREE.PerspectiveCamera(56, innerWidth / innerHeight, 0.5, 3200);

    // lighting: bright summer sun + sky bounce (theme may recolor below)
    this.hemi = new THREE.HemisphereLight(0xbfe0ff, 0x5a8a3c, 0.85);
    this.scene.add(this.hemi);
    const sun = new THREE.DirectionalLight(0xfff3d6, 2.0);
    sun.castShadow = true;
    sun.shadow.mapSize.set(this.isTouch ? 1024 : 2048, this.isTouch ? 1024 : 2048);
    const sc = sun.shadow.camera;
    // tight frustum around the player (the rig follows them) = crisp shadows
    sc.left = -72; sc.right = 72; sc.top = 72; sc.bottom = -72;
    sc.near = 10; sc.far = 400;
    sun.shadow.bias = -0.0004;
    this.scene.add(sun, sun.target);
    this.moon = sun; // shadow rig follows the player (name kept for the camera code)

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
    this.track = new Track(this.scene, this.level);
    const th = this.track.theme;
    if (th) {
      if (th.fogColor !== undefined) this.scene.fog = new THREE.Fog(th.fogColor, th.fogNear ?? 320, th.fogFar ?? 1500);
      if (th.hemiSky !== undefined) this.hemi.color.setHex(th.hemiSky);
      if (th.hemiGround !== undefined) this.hemi.groundColor.setHex(th.hemiGround);
      if (th.hemiIntensity !== undefined) this.hemi.intensity = th.hemiIntensity;
      if (th.sunColor !== undefined) this.moon.color.setHex(th.sunColor);
      if (th.sunIntensity !== undefined) this.moon.intensity = th.sunIntensity;
    }
    // image-based lighting: a tiny theme-tinted gradient dome through PMREM.
    // Standard materials pick up soft sky reflections (glossy wet roads, car
    // paint sheen). Dimmed at bake time — r160 has no scene.environmentIntensity.
    {
      const top = new THREE.Color(th?.skyTop ?? '#68b7e8').multiplyScalar(0.55);
      const hor = new THREE.Color(th?.skyHorizon ?? '#dff0fa').multiplyScalar(0.50);
      const gnd = new THREE.Color(th?.hemiGround !== undefined ? th.hemiGround : 0x5a8a3c).multiplyScalar(0.35);
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
    this.particles = new Particles(this.scene);
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
    this.props = this.track.props ? [...this.track.props] : [];
    this.flyingProps = [];
    this.chopperTimer = 0;
    this.chopperWave = 0;

    this._buildPickups();
    this._initWorldHazards();
    this._buildRoamStars();
    this._buildLivestock();
    this._flashes = [];
    this.camMode = 0; // 0 = top-down, 1 = low chase
    this.camPos = new THREE.Vector3();
    this.camLook = new THREE.Vector3();
    this.shake = 0;

    this.state = 'title';
    this.resetRace();

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
      ];
      for (const [btn, panel] of tabs) {
        btn.addEventListener('click', () => {
          for (const [b, p2] of tabs) {
            b.classList.toggle('current', b === btn);
            p2.classList.toggle('off', p2 !== panel);
          }
        });
      }
    }

    // world cards: track-shape minimap + flavor + career best per level,
    // grouped under region headers (region order = first appearance)
    const sel = document.getElementById('level-select');
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
        <div class="wc-best${best ? '' : ' new'}">${bestTxt}</div>`;
      this._drawCircuitMap(card.querySelector('.wc-map'), lv.theme, !unlocked, i === this.levelIndex);
      card.addEventListener('click', () => {
        if (i === this.levelIndex) return;
        if (!this.isLevelUnlocked(lv.id)) {
          card.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-5px)' },
            { transform: 'translateX(5px)' }, { transform: 'translateX(0)' }], { duration: 200 });
          return;
        }
        this.fadeTo(`?level=${lv.id}${this.unlockAll ? '&unlockall=1' : ''}`);
      });
      rowFor(lv).appendChild(card);
    });

    // mode chips: RACE | FREE ROAM
    const msel = document.getElementById('mode-select');
    for (const [id, label] of [['race', '🏁 RACE'], ['roam', '🌍 FREE ROAM']]) {
      const chip = document.createElement('button');
      const active = (id === 'roam') === this.freeRoam;
      chip.className = 'mode-chip' + (active ? ' current' : '');
      chip.textContent = label;
      chip.addEventListener('click', () => {
        if ((id === 'roam') === this.freeRoam) return;
        this.fadeTo(`?level=${this.level.id}&mode=${id}`);
      });
      msel.appendChild(chip);
    }
    if (this.freeRoam) document.getElementById('start-btn').textContent = 'START EXPLORING';

    // difficulty chips
    const dsel = document.getElementById('diff-select');
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
    ssel.innerHTML = '<span class="lbl">STEERING</span>';
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
    asel.innerHTML = '<span class="lbl">DRIVING AID</span>';
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
      this.fadeTo(`?level=${this.level.id}${this.freeRoam ? '&mode=roam' : ''}`);
    });

    // next-level chaining from the results screen
    document.getElementById('next-level-btn').addEventListener('click', () => {
      sessionStorage.setItem('ir-score', String(this.score));
      this.fadeTo(`?level=${LEVELS[this.levelIndex + 1].id}&go=1`);
    });

    // fade in on load (covers level-to-level transitions)
    const fade = document.getElementById('fade');
    fade.style.transition = 'none';
    fade.classList.add('dark');
    requestAnimationFrame(() => requestAnimationFrame(() => {
      fade.style.transition = '';
      fade.classList.remove('dark');
    }));

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

  /** In roam mode, exiting banks the destruction score as credits. */
  bankRoamCredits() {
    // roam pays the same rate as racing — otherwise farming props off the
    // clock is strictly better money than actually competing
    const raw = Math.max(0, this.score - (this.startScore ?? 0));
    const earned = Math.round(raw * CREDIT_RATE);
    if (earned > 0) {
      this.garage.credits += earned;
      saveJSON(this._pkey('garage'), this.garage);
    }
  }

  /** Fade to black, then navigate — used for level changes. Saves the menu's
   *  tab + scroll so the title screen comes back exactly where you left it
   *  instead of resetting to the top. */
  fadeTo(url) {
    try {
      sessionStorage.setItem('ir-menu-state', JSON.stringify({
        tab: document.getElementById('tab-btn-garage')?.classList.contains('current') ? 'garage' : 'race',
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
      if (st.tab === 'garage') document.getElementById('tab-btn-garage')?.click();
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
        <div class="cprice">${selected ? 'DRIVING' : owned ? 'DRIVE' : car.price.toLocaleString() + ' CR'}</div>`;
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
          <small>${worlds} WORLD${worlds === 1 ? '' : 'S'} CONQUERED · ${(garage.credits ?? 0).toLocaleString()} CR</small></span>`;
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
      if (reg.list.length > 1) {
        // two-tap confirm; the arm state relaxes by itself
        const del = document.createElement('button');
        del.className = 'up-buy prof-btn danger';
        del.textContent = '✕';
        del.title = 'Delete profile';
        del.addEventListener('click', () => {
          if (del.dataset.arm) { this._deleteProfile(p.id); return; }
          del.dataset.arm = '1';
          del.textContent = 'SURE?';
          setTimeout(() => { delete del.dataset.arm; del.textContent = '✕'; }, 2600);
        });
        row.appendChild(del);
      }
      listEl.appendChild(row);
    }
    const cap = reg.list.length >= MAX_PROFILES;
    document.getElementById('profile-create').style.display = cap ? 'none' : '';
    document.getElementById('profile-cap-note').style.display = cap ? '' : 'none';
    this._renderSwatches();
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
    // fresh careers start at world 1 — reload through the standard fade
    this.fadeTo(`?level=1${this.unlockAll ? '&unlockall=1' : ''}`);
  }

  _switchProfile(id) {
    const reg = this.profiles;
    if (id === reg.active || !reg.list.some((p) => p.id === id)) return;
    reg.active = id;
    saveJSON('ir-profiles', reg);
    // reload via the standard fade; the constructor's locked-level guard drops
    // the new driver back to world 1 if this track isn't unlocked for them
    this.fadeTo(`?level=${this.level.id}${this.unlockAll ? '&unlockall=1' : ''}`);
  }

  _deleteProfile(id) {
    const reg = this.profiles;
    if (reg.list.length <= 1) return; // the last profile can never be deleted
    const i = reg.list.findIndex((p) => p.id === id);
    if (i < 0) return;
    reg.list.splice(i, 1);
    try { for (const base of PROFILE_KEYS) localStorage.removeItem(profileKey(id, base)); } catch { /* private mode */ }
    if (reg.active === id) {
      // deleted the active driver: hand the wheel to the first remaining one
      reg.active = reg.list[0].id;
      saveJSON('ir-profiles', reg);
      this.fadeTo(`?level=1${this.unlockAll ? '&unlockall=1' : ''}`);
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
      const core = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.85, 0),
        new THREE.MeshStandardMaterial({
          color, emissive: color, emissiveIntensity: 1.6, metalness: 0.3, roughness: 0.25,
        })
      );
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
      this.scene.add(group);
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

  _updateBoostPads() {
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
    for (let s = 0; s < spots.length; s++) {
      const spot = spots[s];
      const kind = spec.kinds[s % spec.kinds.length];
      const K = KINDS[kind] || KINDS.cow;
      const n = spec.perHerd ?? 4;
      for (let k = 0; k < n; k++) {
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
        this.scene.add(g);
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
  _buildRoamStars() {
    this.roamStars = [];
    if (!this.freeRoam) return;
    const t = this.track;
    const glow = glowTexture();
    // canyon worlds: clear the rock band (~15u) so no star spawns inside a
    // cliff face — roamers reach these by driving out through the start berm
    const minLat = t.T?.cliffWalls ? 24 : 16;
    for (let k = 0; k < 12; k++) {
      const idx = Math.floor(t.N * (k + 0.5) / 12);
      const lat = (k % 2 ? -1 : 1) * (minLat + (k * 7) % 26); // properly off-road
      const c = t.pointAt(idx, 0), n = t.nrm[idx];
      const x = c.x + n.x * lat, z = c.z + n.z * lat;
      const y = t.terrainHeight(x, z);
      const spr = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glow, color: 0xffd400, transparent: true, opacity: 0.95,
        blending: THREE.AdditiveBlending, depthWrite: false }));
      spr.scale.set(4.5, 4.5, 1);
      spr.position.set(x, y + 2.2, z);
      this.scene.add(spr);
      this.roamStars.push({ x, z, y, spr, got: false });
    }
  }

  _updateRoamStars(time) {
    if (!this.roamStars?.length) return;
    const p = this.player;
    for (const s of this.roamStars) {
      if (s.got) continue;
      s.spr.position.y = s.y + 2.2 + Math.sin(time * 2 + s.x) * 0.5;
      const dx = p.pos.x - s.x, dz = p.pos.z - s.z;
      if (dx * dx + dz * dz < 16) {
        s.got = true;
        this.scene.remove(s.spr);
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
        this.scene.add(ring);
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
        this.scene.add(mesh);
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
        this.scene.add(m);
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
    this.scene.add(mesh);
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
  _spawnChopper() {
    const p = this.player.pos;
    const a = Math.random() * Math.PI * 2;
    const pos = new THREE.Vector3(p.x + Math.cos(a) * 80, 9, p.z + Math.sin(a) * 80);
    this.choppers.push(new Chopper(this, pos));
    this.hud.feed('⚠ ATTACK CHOPPER INBOUND', 'bad');
    this.buzz([40, 30, 40]);
  }

  _updateChoppers(dt) {
    if (this.state === 'race') {
      if (this.freeRoam) {
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
    this.flyingProps.push({
      mesh: pr.mesh,
      vel: new THREE.Vector3(
        dir.x * speed * 0.45 + (car ? car.vel.x * 0.4 : 0), 6 + speed * 0.15,
        dir.z * speed * 0.45 + (car ? car.vel.z * 0.4 : 0)),
      spin: new THREE.Vector3((Math.random() - 0.5) * 11, (Math.random() - 0.5) * 11, (Math.random() - 0.5) * 11),
      life: 1.5,
    });
    const at = new THREE.Vector3(pr.x, (pr.y ?? 0) + 0.6, pr.z);
    if (this.particles.debris) this.particles.debris(at, 6);
    this.particles.driftSmoke(at);
    this.particles.dust?.(at, 1);
    this.shake = Math.min(1, this.shake + (car === this.player ? 0.12 : 0.05));
    if (car === this.player) {
      this.score += pr.scoreValue || 25;
      if (this._ct) this._ct.props++; // DEMOLITION contract
      this.buzz(15);
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
    this.scene.add(mesh);
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
          const plank = new THREE.Mesh(
            new THREE.BoxGeometry(1.4, 0.3, 0.1),
            new THREE.MeshStandardMaterial({ color: cols[k % 2], roughness: 0.9 }));
          plank.position.set(car.pos.x + nx * 2, car.pos.y + 1 + k * 0.4, car.pos.z + nz * 2);
          this.scene.add(plank);
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
    this.scene.add(fly);
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
    this.scene.add(husk);
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

  onTireSmash(st, car, ox, oz) {
    const tires = this.track.smashTireStack?.(st);
    if (!tires) return;
    const fx = car ? car.pos.x : (ox ?? st.x - 1), fz = car ? car.pos.z : (oz ?? st.z - 1);
    const dir = new THREE.Vector3(st.x - fx, 0, st.z - fz).normalize();
    const sp = car ? Math.abs(car.speedAlong) : 20;
    for (const tm of tires) {
      this.scene.add(tm);
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
    this.scene.add(mesh);
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
  }

  // ---------- transient explosion lights ----------
  flashLight(pos) {
    if (this._flashes.length > 4) return;
    const l = new THREE.PointLight(0xffa040, 60, 46, 1.8);
    l.position.copy(pos).setY(3);
    this.scene.add(l);
    this._flashes.push({ light: l, life: 0.35 });
  }

  _updateFlashes(dt) {
    for (let i = this._flashes.length - 1; i >= 0; i--) {
      const f = this._flashes[i];
      f.life -= dt;
      f.light.intensity = Math.max(0, f.life / 0.35) * 60;
      if (f.life <= 0) { this.scene.remove(f.light); this._flashes.splice(i, 1); }
    }
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
        if (!p.mesh.parent) this.scene.add(p.mesh);
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
    if (this.freeRoam) {
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
      this._camYaw = cur + wrap(yaw - cur) * Math.min(1, 4.5 * dt);
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
    // keep the shadow light rig centered on the player
    this.moon.position.copy(p.pos).add(new THREE.Vector3(70, 130, 50));
    this.moon.target.position.copy(p.pos);
  }

  // ---------- main loop ----------
  frame() {
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
        this._updateProps(dt);
        this._updateWorldHazards(dt, time);
        this._updateCombo(dt);
        this._updateContracts();
        this._updateTaunts();
        this._updateRoamStars(time);
        this._updateLivestock(dt, time);
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
    this.input.endFrame();
    this._autoQuality();
    this.composer.render();
  }

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
      this.moon.castShadow = false;
    } else {
      this.bloom.enabled = false;
      this.renderer.setPixelRatio(Math.min(baseDpr, 1));
      this.composer.setSize(innerWidth, innerHeight);
    }
    this.hud?.feed?.(`AUTO QUALITY ${q}/3 — smoothing frame rate`, 'info');
  }
}

window.__game = new Game();
window.__LEVELS = LEVELS; // headless test harness reads the roster
