// Car meshes (built from primitives), arcade physics, and rival AI.
import * as THREE from 'three';
import { glowTexture } from './textures.js';
import { ROAD_HALF } from './track.js';

const WALL_LIMIT = ROAD_HALF + 0.55; // barrier clamp for car center

// ---------- mesh factory ----------
let _glowTex = null;

export function buildCarMesh({ body, glow, accent }) {
  if (!_glowTex) _glowTex = glowTexture();
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: body, metalness: 0.8, roughness: 0.28 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x0d0a1a, metalness: 0.6, roughness: 0.5 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x0a1420, metalness: 0.95, roughness: 0.12 });
  const glowMat = new THREE.MeshBasicMaterial({ color: glow });
  const accentMat = new THREE.MeshBasicMaterial({ color: accent });

  // hull
  const hull = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.55, 4.6), bodyMat);
  hull.position.y = 0.62;
  hull.castShadow = true;
  g.add(hull);
  // nose wedge
  const nose = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.36, 1.5), bodyMat);
  nose.position.set(0, 0.52, 2.75);
  nose.rotation.x = 0.09;
  nose.castShadow = true;
  g.add(nose);
  // cabin
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.5, 1.9), glassMat);
  cabin.position.set(0, 1.1, -0.25);
  cabin.castShadow = true;
  g.add(cabin);
  // spoiler
  const wing = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.12, 0.7), bodyMat);
  wing.position.set(0, 1.28, -2.25);
  g.add(wing);
  for (const s of [-1, 1]) {
    const strut = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.5, 0.3), darkMat);
    strut.position.set(0.9 * s, 1.0, -2.25);
    g.add(strut);
  }
  // side accent stripes
  for (const s of [-1, 1]) {
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 3.6), accentMat);
    stripe.position.set(1.18 * s, 0.72, 0.1);
    g.add(stripe);
  }
  // headlights / tail bar
  for (const s of [-1, 1]) {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.14, 0.1), new THREE.MeshBasicMaterial({ color: 0xeaffff }));
    hl.position.set(0.72 * s, 0.62, 3.42);
    g.add(hl);
  }
  const tail = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.16, 0.1), glowMat);
  tail.position.set(0, 0.78, -2.32);
  g.add(tail);
  // wheels
  const wheelGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.4, 14);
  wheelGeo.rotateZ(Math.PI / 2);
  const rimGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.42, 8);
  rimGeo.rotateZ(Math.PI / 2);
  g.userData.wheels = [];
  for (const [x, z] of [[-1.15, 1.55], [1.15, 1.55], [-1.15, -1.55], [1.15, -1.55]]) {
    const w = new THREE.Mesh(wheelGeo, darkMat);
    w.position.set(x, 0.55, z);
    g.add(w);
    const rim = new THREE.Mesh(rimGeo, accentMat);
    rim.position.copy(w.position);
    g.add(rim);
    g.userData.wheels.push(w, rim);
  }
  // underglow
  const under = new THREE.Mesh(
    new THREE.PlaneGeometry(5.2, 7.6),
    new THREE.MeshBasicMaterial({
      map: _glowTex, color: glow, transparent: true, opacity: 0.5,
      blending: THREE.AdditiveBlending, depthWrite: false,
    })
  );
  under.rotation.x = -Math.PI / 2;
  under.position.y = 0.08;
  g.add(under);
  return g;
}

// ---------- physics base ----------
export class Car {
  constructor(game, mesh, { maxSpeed = 52, accel = 34, grip = 5.2, steerRate = 2.5 } = {}) {
    this.game = game;
    this.mesh = mesh;
    game.scene.add(mesh);
    this.pos = new THREE.Vector3();
    this.vel = new THREE.Vector3();
    this.heading = 0;
    this.maxSpeed = maxSpeed;
    this.accel = accel;
    this.grip = grip;
    this.steerRate = steerRate;

    this.health = 100;
    this.maxHealth = 100;
    this.alive = true;
    this.respawnTimer = 0;
    this.invuln = 0;
    this.boostTimer = 0;
    this.fireCooldown = 0;

    // race state
    this.trackIndex = 0;
    this.lap = 1;
    this.lateral = 0;
    this.finished = false;
    this.wallGrind = 0;
  }

  get forward() { return new THREE.Vector3(Math.sin(this.heading), 0, Math.cos(this.heading)); }
  get speedAlong() { return this.vel.dot(this.forward); }
  get progress() { return this.lap + this.trackIndex / this.game.track.N; }

  placeAt(index, lateral) {
    const t = this.game.track;
    this.pos.copy(t.pointAt(index, lateral));
    this.heading = t.headingAt(index);
    this.vel.set(0, 0, 0);
    this.trackIndex = index;
    this.lateral = lateral;
    this.syncMesh(0);
  }

  /** Core integrator. inputs: {throttle, brake, steer 1=left, drift} */
  step(dt, inputs) {
    const fwd = this.forward;
    const side = new THREE.Vector3(fwd.z, 0, -fwd.x);
    let vf = this.vel.dot(fwd);
    let vl = this.vel.dot(side);

    const boosting = this.boostTimer > 0;
    if (boosting) this.boostTimer -= dt;
    const topSpeed = this.maxSpeed * (boosting ? 1.4 : 1);

    // longitudinal
    if (inputs.throttle > 0) vf += this.accel * inputs.throttle * dt;
    if (inputs.brake > 0) {
      if (vf > 0.5) vf -= this.accel * 1.6 * inputs.brake * dt;
      else vf -= this.accel * 0.5 * inputs.brake * dt; // reverse
    }
    vf -= vf * 0.55 * dt;                 // drag
    vf = THREE.MathUtils.clamp(vf, -this.maxSpeed * 0.35, topSpeed);
    if (boosting) vf = Math.max(vf, this.maxSpeed * 1.05);

    // lateral grip (reduced while drifting)
    const grip = inputs.drift ? this.grip * 0.28 : this.grip;
    vl -= vl * Math.min(1, grip * dt);

    // steering scales with speed
    const speedFactor = THREE.MathUtils.clamp(Math.abs(vf) / 16, 0, 1);
    const dir = vf >= 0 ? 1 : -1;
    this.heading += inputs.steer * this.steerRate * speedFactor * dir * dt;

    // recompose velocity (fwd/side change with heading for a nice arcade feel)
    const nf = this.forward;
    const ns = new THREE.Vector3(nf.z, 0, -nf.x);
    this.vel.copy(nf).multiplyScalar(vf).addScaledVector(ns, vl);
    this.pos.addScaledVector(this.vel, dt);

    // track constraint
    const t = this.game.track;
    this.trackIndex = t.nearestIndex(this.pos, this.trackIndex);
    this.lateral = t.lateralOffset(this.pos, this.trackIndex);
    this.wallGrind = Math.max(0, this.wallGrind - dt);
    if (Math.abs(this.lateral) > WALL_LIMIT) {
      const n = t.nrm[this.trackIndex];
      const over = this.lateral - Math.sign(this.lateral) * WALL_LIMIT;
      this.pos.addScaledVector(n, -over);
      const vn = this.vel.dot(n);
      this.vel.addScaledVector(n, -vn * 1.35); // soft bounce
      this.vel.multiplyScalar(0.94);
      this.lateral = Math.sign(this.lateral) * WALL_LIMIT;
      if (this.wallGrind <= 0) {
        this.wallGrind = 0.18;
        this.onWallHit(n, Math.abs(vn));
      }
    }

    if (this.fireCooldown > 0) this.fireCooldown -= dt;
    if (this.invuln > 0) this.invuln -= dt;
    this.syncMesh(dt, vl, inputs);
  }

  syncMesh(dt, vl = 0, inputs = null) {
    this.mesh.position.copy(this.pos);
    this.mesh.rotation.set(0, this.heading, 0);
    // body lean
    const roll = THREE.MathUtils.clamp(-vl * 0.02, -0.16, 0.16);
    const pitch = THREE.MathUtils.clamp(-this.speedAlong * 0.0012, -0.05, 0.05);
    this.mesh.rotation.z = roll;
    this.mesh.rotation.x = pitch;
    // spin wheels
    if (dt > 0 && this.mesh.userData.wheels) {
      const spin = this.speedAlong * dt / 0.55;
      for (const w of this.mesh.userData.wheels) w.rotation.x += spin;
    }
    // invulnerability flicker
    this.mesh.visible = this.alive && (this.invuln <= 0 || Math.floor(this.invuln * 14) % 2 === 0);
  }

  onWallHit(normal, impact) {
    if (impact > 3) {
      this.game.particles.sparks(this.pos, normal, Math.min(20, 4 + impact));
      if (this === this.game.player) this.game.audio.scrape();
    }
  }

  damage(amount, attacker = null) {
    if (!this.alive || this.invuln > 0) return false;
    this.health -= amount;
    if (this.health <= 0) {
      this.health = 0;
      this.destroy(attacker);
      return true;
    }
    return false;
  }

  destroy() {
    this.alive = false;
    this.mesh.visible = false;
    this.respawnTimer = this.respawnDelay ?? 5;
    this.game.particles.explosion(this.pos, true);
    this.game.audio.explosion(true);
    this.game.flashLight(this.pos);
  }

  respawn() {
    this.alive = true;
    this.health = this.maxHealth;
    this.invuln = 2.2;
    this.placeAt(this.trackIndex, THREE.MathUtils.clamp(this.lateral, -6, 6));
  }

  /** Lap bookkeeping — call with previous index before this frame's update. */
  checkLap(prevIndex) {
    const n = this.game.track.N;
    if (prevIndex > n * 0.85 && this.trackIndex < n * 0.15) {
      this.lap++;
      return true;
    }
    if (prevIndex < n * 0.15 && this.trackIndex > n * 0.85) this.lap--; // went backwards over the line
    return false;
  }
}

// ---------- AI rival ----------
const AI_COLORS = [
  { body: 0xd6303f, glow: 0xff3b5b, accent: 0xffb52e, name: 'VIPER' },
  { body: 0x8b2fd6, glow: 0xb85bff, accent: 0x2ef7ff, name: 'RAZOR' },
  { body: 0xd67a2f, glow: 0xffb52e, accent: 0xff2fd6, name: 'HAVOC' },
  { body: 0x2fd68f, glow: 0x4dff88, accent: 0xffffff, name: 'GHOST' },
  { body: 0x3057d6, glow: 0x5b8cff, accent: 0xff2fd6, name: 'NOVA' },
];

export class EnemyCar extends Car {
  constructor(game, slot) {
    const spec = AI_COLORS[slot % AI_COLORS.length];
    super(game, buildCarMesh(spec), {
      maxSpeed: 46 + slot * 1.3 + Math.random() * 2,
      accel: 30 + Math.random() * 5,
      grip: 6,
      steerRate: 2.6,
    });
    this.spec = spec;
    this.name = spec.name;
    this.maxHealth = this.health = 70;
    this.respawnDelay = 5;
    this.lane = THREE.MathUtils.randFloatSpread(8);
    this.laneTimer = 3 + Math.random() * 4;
    this.aggression = 0.5 + Math.random() * 0.5;
    this.glowColor = new THREE.Color(spec.glow);
  }

  update(dt) {
    const g = this.game;
    if (!this.alive) {
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) this.respawn();
      return;
    }
    const t = g.track;
    const prevIndex = this.trackIndex;

    // wander between lanes occasionally
    this.laneTimer -= dt;
    if (this.laneTimer <= 0) {
      this.laneTimer = 3 + Math.random() * 5;
      this.lane = THREE.MathUtils.randFloatSpread(9);
    }

    // steer toward a lookahead point on the centerline
    const look = Math.floor(10 + Math.abs(this.speedAlong) * 0.55);
    const ti = (this.trackIndex + look) % t.N;
    const target = t.pointAt(ti, this.lane);
    const desired = Math.atan2(target.x - this.pos.x, target.z - this.pos.z);
    let dh = desired - this.heading;
    while (dh > Math.PI) dh -= Math.PI * 2;
    while (dh < -Math.PI) dh += Math.PI * 2;
    const steer = THREE.MathUtils.clamp(dh * 2.2, -1, 1);

    // slow down for corners ahead
    let maxCurv = 0;
    for (let k = 0; k < 60; k += 6) maxCurv = Math.max(maxCurv, t.curvature[(this.trackIndex + k) % t.N]);
    let targetSpeed = Math.min(this.maxSpeed, 13 / Math.max(0.05, maxCurv * 22));
    // rubber-banding vs player
    const gap = g.player.progress - this.progress;
    if (gap > 0.08) targetSpeed *= 1.18;
    else if (gap < -0.10) targetSpeed *= 0.88;

    const throttle = this.speedAlong < targetSpeed ? 1 : 0;
    const brake = this.speedAlong > targetSpeed * 1.15 ? 0.7 : 0;
    this.step(dt, { throttle, brake, steer, drift: false });
    if (this.checkLap(prevIndex) === true && this.lap > g.lapsTotal && !this.finished) this.finished = true;

    // exhaust
    if (throttle && Math.random() < 0.5) {
      const back = this.forward.multiplyScalar(-1);
      const tail = this.pos.clone().addScaledVector(back, 2.4);
      g.particles.exhaust(tail, back, this.glowColor, this.boostTimer > 0);
    }

    // take shots at the player when lined up
    const toPlayer = g.player.pos.clone().sub(this.pos);
    const dist = toPlayer.length();
    if (g.player.alive && dist < 55 && this.fireCooldown <= 0) {
      const angle = Math.abs(Math.atan2(toPlayer.x, toPlayer.z) - this.heading);
      const norm = Math.min(angle, Math.PI * 2 - angle);
      if (norm < 0.32) {
        this.fireCooldown = 0.75 / this.aggression;
        g.weapons.fireBullet(this, 4.5, 0.05);
      }
    }
  }
}

export class PlayerCar extends Car {
  constructor(game) {
    super(game, buildCarMesh({ body: 0x18c8d8, glow: 0x2ef7ff, accent: 0xff2fd6 }), {
      maxSpeed: 54, accel: 38, grip: 5.4, steerRate: 2.7,
    });
    this.name = 'YOU';
    this.respawnDelay = 2.5;
    this.heat = 0;        // 0..1
    this.overheated = false;
    this.missiles = 3;
    this.maxMissiles = 5;
    this.glowColor = new THREE.Color('#2ef7ff');
    this.bestLap = Infinity;
    this.lapStart = 0;
  }

  update(dt, input) {
    const g = this.game;
    if (!this.alive) {
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) { this.respawn(); g.hud.feed('REDEPLOYED', 'info'); }
      return;
    }
    const prevIndex = this.trackIndex;
    const controlsLive = g.state === 'race';
    const inputs = controlsLive
      ? { throttle: input.throttle, brake: input.brake, steer: input.steer, drift: input.drift }
      : { throttle: 0, brake: 1, steer: 0, drift: false };
    this.step(dt, inputs);

    if (this.checkLap(prevIndex) && controlsLive) g.onPlayerLap();

    // cannon heat
    if (this.heat > 0) this.heat = Math.max(0, this.heat - dt * (this.overheated ? 0.35 : 0.5));
    if (this.overheated && this.heat < 0.25) this.overheated = false;

    // machine gun
    if (controlsLive && input.fire && !this.overheated && this.fireCooldown <= 0) {
      this.fireCooldown = 0.085;
      this.heat += 0.045;
      if (this.heat >= 1) { this.overheated = true; g.hud.feed('CANNON OVERHEAT', 'bad'); }
      g.weapons.fireBullet(this, 7, 0.022);
      g.audio.shoot();
    }
    // missile
    if (controlsLive && input.justPressed('KeyE')) {
      if (this.missiles > 0) {
        this.missiles--;
        g.weapons.fireMissile(this);
        g.audio.missile();
      } else g.hud.feed('NO MISSILES', 'bad');
    }

    // exhaust + drift smoke
    const back = this.forward.multiplyScalar(-1);
    const tail = this.pos.clone().addScaledVector(back, 2.4);
    if (inputs.throttle > 0 || this.boostTimer > 0)
      g.particles.exhaust(tail, back, this.glowColor, this.boostTimer > 0);
    const side = new THREE.Vector3(this.forward.z, 0, -this.forward.x);
    const slide = Math.abs(this.vel.dot(side));
    if (slide > 7) {
      for (const s of [-1, 1]) {
        const wp = this.pos.clone().addScaledVector(back, 1.6).addScaledVector(side, s * 1.1);
        if (Math.random() < 0.7) g.particles.driftSmoke(wp);
      }
    }
  }

  destroy(attacker) {
    super.destroy();
    this.game.onPlayerDestroyed(attacker);
  }
}
