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
};

const CAM_MODES = [
  { name: 'TOP-DOWN',  back: 20, h: 52, look: 7,  lookH: 0,   spdBack: 6, spdH: 10 },
  { name: 'TOP FAR',   back: 24, h: 84, look: 1,  lookH: 0,   spdBack: 4, spdH: 10 },
  { name: 'CHASE',     back: 13, h: 7.5, look: 10, lookH: 2.8, spdBack: 2, spdH: 1 },
  { name: 'CHASE FAR', back: 24, h: 15, look: 13, lookH: 3,   spdBack: 3, spdH: 2 },
];
const upgradeCost = (lvl) => 400 + lvl * 350;

const loadJSON = (key, fallback) => {
  try { return { ...fallback, ...JSON.parse(localStorage.getItem(key) || '{}') }; }
  catch { return { ...fallback }; }
};
const saveJSON = (key, obj) => { try { localStorage.setItem(key, JSON.stringify(obj)); } catch { /* private mode */ } };

class Game {
  constructor() {
    this.isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
    if (this.isTouch) document.body.classList.add('touch');

    // level selection via URL (?level=N), with ?go=1 for seamless chained starts
    const params = new URLSearchParams(location.search);
    this.levelIndex = Math.min(Math.max((parseInt(params.get('level')) || 1) - 1, 0), LEVELS.length - 1);
    this.level = LEVELS[this.levelIndex];
    this.autoStart = params.get('go') === '1';

    // progression + difficulty + garage (persisted)
    this.career = loadJSON('ir-career', { finished: {} });
    this.garage = loadJSON('ir-garage', { credits: 0, engine: 0, armor: 0, cannon: 0, nitro: 0, handling: 0, tires: 0 });
    this.cars = loadJSON('ir-cars', { owned: ['brawler'], selected: 'brawler' });
    if (!this.cars.owned.includes(this.cars.selected)) this.cars.selected = 'brawler';
    // mode comes from the URL only — a fresh visit ALWAYS starts in RACE mode
    // (persisting roam silently made races "never finish" for returning players)
    this.freeRoam = params.get('mode') === 'roam';
    this.steerSetting = localStorage.getItem('ir-steer') || 'normal';
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
    sc.left = -120; sc.right = 120; sc.top = 120; sc.bottom = -120;
    sc.near = 10; sc.far = 400;
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
      uniforms: { tDiffuse: { value: null }, uVig: { value: 0.30 }, uSat: { value: 1.07 }, uCon: { value: 1.05 } },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */ `
        uniform sampler2D tDiffuse; uniform float uVig, uSat, uCon; varying vec2 vUv;
        void main() {
          vec4 c = texture2D(tDiffuse, vUv);
          float l = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722));
          c.rgb = mix(vec3(l), c.rgb, uSat);
          c.rgb = (c.rgb - 0.5) * uCon + 0.5;
          vec2 q = vUv - 0.5;
          c.rgb *= 1.0 - uVig * smoothstep(0.35, 0.95, dot(q, q) * 2.6);
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

    // world cards: track-shape minimap + flavor + career best per level
    const sel = document.getElementById('level-select');
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
      card.innerHTML = `<canvas class="wc-map" width="150" height="104"></canvas>
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
        this.fadeTo(`?level=${lv.id}`);
      });
      sel.appendChild(card);
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

    this.renderGarage();
    this.renderCarShop();

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
    const earned = Math.max(0, this.score - (this.startScore ?? 0));
    if (earned > 0) {
      this.garage.credits += earned;
      saveJSON('ir-garage', this.garage);
    }
  }

  /** Fade to black, then navigate — used for level changes. */
  fadeTo(url) {
    document.getElementById('fade').classList.add('dark');
    setTimeout(() => { location.href = url; }, 480);
  }

  isLevelUnlocked(id) {
    return this.unlockAll || id === 1 || !!this.career.finished[id - 1];
  }

  /** Apply purchased upgrades to the player (base stats captured once). */
  applyUpgrades() {
    const p = this.player;
    if (!this._base) this._base = { maxSpeed: p.maxSpeed, maxHealth: p.maxHealth };
    const g = this.garage;
    p.maxSpeed = this._base.maxSpeed * (1 + 0.04 * g.engine);
    p.maxHealth = this._base.maxHealth + 15 * g.armor;
    p.health = p.maxHealth;
    p.cannonDamage = 7 * (1 + 0.18 * g.cannon);
    p.nitroRate = 1 + 0.22 * g.nitro;
    p.handling = 0.2 * (g.handling || 0);
    p.gripBoost = 1 + 0.04 * (g.tires || 0);
    p.steerSense = { relaxed: 0.8, normal: 1.0, sharp: 1.25 }[this.steerSetting] || 1.0;
  }

  /** Draw a smoothed closed track outline on a world-card canvas. */
  _drawCircuitMap(cnv, themeKey, locked, current) {
    const pts = circuitPoints(themeKey);
    const ctx = cnv.getContext('2d');
    const W = cnv.width, H = cnv.height, pad = 12;
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
    path(); ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.lineWidth = 7; ctx.stroke();
    path();
    ctx.strokeStyle = locked ? 'rgba(255,233,168,.35)' : current ? '#ffd400' : '#e8c887';
    ctx.lineWidth = 3; ctx.stroke();
    if (!locked) { // start-line dot
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(P[0][0], P[0][1], 3, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 1.5; ctx.stroke();
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
      card.innerHTML = `<img class="car-icon" src="${icons[car.key]}" alt="${car.name}">
        <div class="cname">${car.name}</div><div class="cdesc">${car.desc}</div>
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
          saveJSON('ir-garage', this.garage);
        }
        this.cars.selected = car.key;
        saveJSON('ir-cars', this.cars);
        // swap requires a rebuild of the player mesh — cleanest via reload
        this.fadeTo(`?level=${this.level.id}`);
      });
      shop.appendChild(card);
    }
  }

  renderGarage() {
    document.getElementById('credits').textContent = this.garage.credits.toLocaleString();
    const rows = document.getElementById('garage-rows');
    rows.innerHTML = '';
    for (const u of UPGRADES) {
      const lvl = this.garage[u.key];
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
          this.garage[u.key]++;
          saveJSON('ir-garage', this.garage);
          this.applyUpgrades();
          this.renderGarage();
        });
      }
      row.appendChild(btn);
      rows.appendChild(row);
    }
  }

  // ---------- pickups ----------
  _buildPickups() {
    this.pickups = [];
    const t = this.track;
    const TYPES = ['health', 'missile', 'nitro', 'mine'];
    const COLORS = { health: 0x4dff88, missile: 0xffb52e, nitro: 0x7fd4ff, mine: 0xff5b3d, slowfield: 0x8e7bff };
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
    this.flyingProps.push({
      mesh,
      vel: new THREE.Vector3(
        dir.x * sp * 0.35 + (car ? car.vel.x * 0.35 : 0), 5 + sp * 0.12,
        dir.z * sp * 0.35 + (car ? car.vel.z * 0.35 : 0)),
      // topple away from the impact plus a bit of chaos
      spin: new THREE.Vector3(dir.z * 3.5 + (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 4, -dir.x * 3.5 + (Math.random() - 0.5) * 2),
      life: 2.2,
    });
    const at = new THREE.Vector3(tr.x, (tr.y ?? 0) + 1, tr.z);
    this.particles.debris(at, 4);
    this.particles.driftSmoke(at);
    this.particles.splinters(at, dir, [0x6a4a2a, 0x3e5e30], 0.6);
    if (car) car.vel.multiplyScalar(0.82); // trees don't stop you, but they cost real speed
    if (car === this.player) {
      this.player.damage(4, null);
      this.buzz(18);
      this.shake = Math.min(1, this.shake + 0.15);
    }
    this.score += 15;
    if (Math.random() < 0.3) this.hud.feed('TIMBER!  +15', 'good');
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

    // career progress + credits
    const earned = Math.max(0, this.score - (this.startScore ?? 0));
    document.getElementById('r-credits').textContent = `+${earned.toLocaleString()}`;
    this.garage.credits += earned;
    saveJSON('ir-garage', this.garage);
    const prev = this.career.finished[this.level.id];
    this.career.finished[this.level.id] = {
      place: Math.min(rank, prev?.place ?? 99),
      bestScore: Math.max(earned, prev?.bestScore ?? 0),
    };
    saveJSON('ir-career', this.career);
    this.renderGarage();
    if (!prev && this.levelIndex < LEVELS.length - 1) {
      this.hud.feed(`${LEVELS[this.levelIndex + 1].name} UNLOCKED`, 'good');
    }
    this.hud.centerMsg('FINISH');
    this.audio.lap();
    document.querySelector('#results .game-sub').textContent = `${this.level.name} COMPLETE`;
    const nextBtn = document.getElementById('next-level-btn');
    if (this.levelIndex < LEVELS.length - 1) {
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
    const fwd = p.forward;
    const speedZoom = Math.min(1, Math.abs(p.speedAlong) / p.maxSpeed);
    const M = CAM_MODES[this.camMode] || CAM_MODES[0];
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
    // camera punch: fov widens on the hit and eases home
    if (this.fovKick > 0) {
      this.fovKick = Math.max(0, this.fovKick - dt * 2.6);
      this.camera.fov = (this.baseFov ?? 56) + this.fovKick * 8;
      this.camera.updateProjectionMatrix();
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
      }
    }

    if (this.state !== 'paused' && this.state !== 'title') {
      if (this.state === 'race') this.raceTime += dt;
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
    this.composer.render();
  }
}

window.__game = new Game();
