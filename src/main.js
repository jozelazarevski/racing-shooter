// NEON STRIKE — 3D top-down racing shooter. All visuals procedural.
import * as THREE from 'three';
import { EffectComposer } from '../lib/postprocessing/EffectComposer.js';
import { RenderPass } from '../lib/postprocessing/RenderPass.js';
import { UnrealBloomPass } from '../lib/postprocessing/UnrealBloomPass.js';
import { OutputPass } from '../lib/postprocessing/OutputPass.js';

import { Track, LEVELS } from './track.js';
import { PlayerCar, EnemyCar } from './vehicles.js';
import { Weapons } from './weapons.js';
import { Particles } from './particles.js';
import { Hud, fmtTime } from './hud.js';
import { AudioEngine } from './audio.js';
import { Input } from './input.js';
import { glowTexture } from './textures.js';

const ENEMY_COUNT = 5;
const LAPS = 3;

class Game {
  constructor() {
    this.isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
    if (this.isTouch) document.body.classList.add('touch');

    // level selection via URL (?level=N), with ?go=1 for seamless chained starts
    const params = new URLSearchParams(location.search);
    this.levelIndex = Math.min(Math.max((parseInt(params.get('level')) || 1) - 1, 0), LEVELS.length - 1);
    this.level = LEVELS[this.levelIndex];
    this.autoStart = params.get('go') === '1';

    this.canvas = document.getElementById('game-canvas');
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas, antialias: true, powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, this.isTouch ? 1.75 : 2));
    this.renderer.setSize(innerWidth, innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

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
    this.bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.3, 0.4, 0.9);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());

    // world + systems
    this.track = new Track(this.scene, this.level);
    const th = this.track.theme;
    if (th) {
      if (th.fogColor !== undefined) this.scene.fog = new THREE.Fog(th.fogColor, th.fogNear ?? 320, th.fogFar ?? 1500);
      if (th.hemiSky !== undefined) this.hemi.color.setHex(th.hemiSky);
      if (th.hemiGround !== undefined) this.hemi.groundColor.setHex(th.hemiGround);
      if (th.sunColor !== undefined) this.moon.color.setHex(th.sunColor);
      if (th.sunIntensity !== undefined) this.moon.intensity = th.sunIntensity;
    }
    this.particles = new Particles(this.scene);
    this.audio = new AudioEngine();
    this.input = new Input();
    this.lapsTotal = LAPS;

    this.player = new PlayerCar(this);
    this.enemies = [];
    for (let i = 0; i < ENEMY_COUNT; i++) this.enemies.push(new EnemyCar(this, i));
    this.weapons = new Weapons(this);
    this.hud = new Hud(this);

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
      this.camera.fov = innerHeight > innerWidth ? 68 : 56; // widen for portrait phones
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
    // auto-pause when the app is backgrounded mid-race; tap anywhere to resume
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.state === 'race') {
        this.state = 'paused';
        this.hud.centerMsg('PAUSED');
      }
    });
    addEventListener('pointerdown', () => {
      if (this.state === 'paused') {
        this.state = 'race';
        this.hud.centerMsg('GO');
      }
    }, true);
    document.getElementById('start-btn').addEventListener('click', () => this.startRace());
    document.getElementById('restart-btn').addEventListener('click', () => {
      document.getElementById('results').classList.add('hidden');
      this.resetRace();
      this.startRace();
    });

    // camera + pause buttons (work with mouse and touch)
    document.getElementById('cam-btn').addEventListener('click', () => { this.camMode = 1 - this.camMode; });
    document.getElementById('pause-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.state === 'race') { this.state = 'paused'; this.hud.centerMsg('PAUSED'); }
      else if (this.state === 'paused') { this.state = 'race'; this.hud.centerMsg('GO'); }
    });

    // level select chips on the title screen
    const sel = document.getElementById('level-select');
    LEVELS.forEach((lv, i) => {
      const chip = document.createElement('button');
      chip.className = 'level-chip' + (i === this.levelIndex ? ' current' : '');
      chip.textContent = lv.name;
      chip.addEventListener('click', () => {
        if (i === this.levelIndex) return;
        this.fadeTo(`?level=${lv.id}`);
      });
      sel.appendChild(chip);
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

  /** Fade to black, then navigate — used for level changes. */
  fadeTo(url) {
    document.getElementById('fade').classList.add('dark');
    setTimeout(() => { location.href = url; }, 480);
  }

  // ---------- pickups ----------
  _buildPickups() {
    this.pickups = [];
    const t = this.track;
    const TYPES = ['health', 'missile', 'nitro', 'mine'];
    const COLORS = { health: 0x4dff88, missile: 0xffb52e, nitro: 0x7fd4ff, mine: 0xff5b3d };
    const defs = [];
    for (let k = 0; k < 12; k++) {
      defs.push({
        type: TYPES[k % TYPES.length],
        index: Math.floor((k + 0.5) * t.N / 12),
        lateral: (k % 2 === 0 ? -1 : 1) * (2 + (k % 3) * 1.8),
      });
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
        } else if (p.type === 'missile') {
          pl.missiles = Math.min(pl.maxMissiles, pl.missiles + 2);
          this.hud.feed('+2 MISSILES', 'good');
        } else if (p.type === 'nitro') {
          pl.nitro = Math.min(1, pl.nitro + 0.45);
          this.hud.feed('+NITRO CHARGE', 'good');
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
        const di = (car.trackIndex - pad.index + this.track.N) % this.track.N;
        if ((di < 6 || di > this.track.N - 6) && Math.abs(car.lateral - pad.lateral) < 3.4 && car.boostTimer <= 0.2) {
          car.boostTimer = 1.6;
          if (car === this.player) { this.audio.boost(); this.hud.feed('BOOST', 'info'); }
        }
      }
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
  }

  onPlayerLap() {
    const p = this.player;
    if (p.lap > this.lapsTotal) { this.finishRace(); return; }
    const lapTime = this.raceTime - p.lapStart;
    p.lapStart = this.raceTime;
    if (p.lap > 2 || (p.lap === 2)) {
      if (lapTime < p.bestLap) p.bestLap = lapTime;
    }
    this.score += 500;
    this.audio.lap();
    this.hud.centerMsg(`LAP ${p.lap}`);
    this.hud.feed(`LAP ${p.lap - 1} — ${fmtTime(lapTime)}  +500`, 'good');
  }

  onEnemyHit(enemy, dmg, source) {
    const killed = enemy.damage(dmg, this.player);
    this.audio.hit();
    if (killed) {
      this.kills++;
      this.score += 250;
      this.player.nitro = Math.min(1, this.player.nitro + 0.25);
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
    this.hud.centerMsg('FINISH');
    this.audio.lap();
    document.querySelector('#results .game-sub').textContent = `${this.level.name} COMPLETE`;
    document.getElementById('next-level-btn').style.display =
      this.levelIndex < LEVELS.length - 1 ? '' : 'none';
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
            this.particles.sparks(mid, push.normalize(), 8);
            if (a === this.player || b === this.player) this.audio.scrape();
          }
          a.vel.addScaledVector(rel, -0.18);
          b.vel.addScaledVector(rel, 0.18);
        }
      }
  }

  // ---------- camera ----------
  _updateCamera(dt) {
    const p = this.player;
    const fwd = p.forward;
    const speedZoom = Math.min(1, Math.abs(p.speedAlong) / p.maxSpeed);
    let targetPos, targetLook;
    if (this.camMode === 0) {
      // top-down with a hint of tilt so the 3D reads
      targetPos = p.pos.clone().addScaledVector(fwd, -20 - speedZoom * 6).add(new THREE.Vector3(0, 52 + speedZoom * 10, 0));
      targetLook = p.pos.clone().addScaledVector(fwd, 7); // keep the car clear of the speedo
    } else {
      targetPos = p.pos.clone().addScaledVector(fwd, -13).add(new THREE.Vector3(0, 7.5, 0));
      targetLook = p.pos.clone().addScaledVector(fwd, 10).add(new THREE.Vector3(0, 2.8, 0));
    }
    const k = 1 - Math.exp(-5.5 * dt);
    this.camPos.lerp(targetPos, k);
    this.camLook.lerp(targetLook, k);
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
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const time = this.clock.elapsedTime;
    this.track.update(dt, time);

    if (this.input.justPressed('KeyC')) this.camMode = 1 - this.camMode;
    if (this.input.justPressed('KeyP') && (this.state === 'race' || this.state === 'paused')) {
      this.state = this.state === 'paused' ? 'race' : 'paused';
      this.hud.centerMsg(this.state === 'paused' ? 'PAUSED' : 'GO');
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
        this.hud.centerMsg('GO!');
        this.track.setLights('green');
      }
    }

    if (this.state !== 'paused' && this.state !== 'title') {
      if (this.state === 'race') this.raceTime += dt;
      this.player.update(dt, this.input);
      if (this.state === 'race' || this.state === 'finished' || this.state === 'countdown') {
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
      }
      this._updateRank();
      this.particles.update(dt);
      this._updateFlashes(dt);
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
      this.particles.update(dt);
      for (const p of this.pickups) { p.core.rotation.y += dt * 2.2; }
    }

    if (this.state !== 'title') this._updateCamera(dt);
    this.input.endFrame();
    this.composer.render();
  }
}

window.__game = new Game();
