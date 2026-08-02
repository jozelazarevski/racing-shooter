// Pulse-cannon tracers (instanced pool) + homing missiles.
import * as THREE from 'three';

const MAX_BULLETS = 220;
const BULLET_SPEED = 130;
const MISSILE_SPEED = 82;
const CHOPPER_HIT_R2 = 3.4 * 3.4; // horizontal hit/detonate radius vs choppers

const _aim = new THREE.Vector3();  // scratch: chopper gun aim point
const _dir = new THREE.Vector3();  // scratch: bullet orientation
const _puff = new THREE.Vector3(); // scratch: ground-impact dust
const _FWD = new THREE.Vector3(0, 0, 1);

export class Weapons {
  constructor(game) {
    this.game = game;
    const geo = new THREE.BoxGeometry(0.22, 0.22, 2.6);
    const mat = new THREE.MeshBasicMaterial({ transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
    this.mesh = new THREE.InstancedMesh(geo, mat, MAX_BULLETS);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    game.scene.add(this.mesh);

    this.bullets = [];
    for (let i = 0; i < MAX_BULLETS; i++)
      this.bullets.push({ active: false, pos: new THREE.Vector3(), vel: new THREE.Vector3(), life: 0, owner: null, dmg: 0 });
    this.head = 0;
    this._m = new THREE.Matrix4();
    this._q = new THREE.Quaternion();
    this._zero = new THREE.Matrix4().makeScale(0, 0, 0);
    this._colorPlayer = new THREE.Color('#ffe27d');
    this._colorEnemy = new THREE.Color('#ff5b3d');
    if (this.mesh.instanceColor === null) {
      // force allocation of the color buffer
      for (let i = 0; i < MAX_BULLETS; i++) this.mesh.setColorAt(i, this._colorPlayer);
    }
    this.missiles = [];
    this.mines = [];
    this.shocks = [];
  }

  dropMine(car) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 10, 8),
      new THREE.MeshStandardMaterial({ color: 0x2a2622, metalness: 0.6, roughness: 0.4 })
    );
    body.scale.y = 0.6;
    g.add(body);
    const lampMat = new THREE.MeshBasicMaterial({ color: 0x661111 });
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), lampMat);
    lamp.position.y = 0.35;
    g.add(lamp);
    const back = car.forward.multiplyScalar(-1);
    g.position.copy(car.pos).addScaledVector(back, 3.4).setY(0.3);
    this.game.scene.add(g);
    this.mines.push({ mesh: g, pos: g.position, lampMat, owner: car, armTime: 1.1, life: 30, blink: 0 });
  }

  fireShockwave(car) {
    const g = this.game;
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1, 0.35, 8, 48),
      new THREE.MeshBasicMaterial({
        color: 0xffe8a8, transparent: true, opacity: 0.95,
        blending: THREE.AdditiveBlending, depthWrite: false,
      })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.copy(car.pos).setY(car.pos.y + 0.6);
    g.scene.add(ring);
    this.shocks.push({ mesh: ring, t: 0 });
    g.hud.feed('SHOCKWAVE', 'info');
    g.audio.explosion(false);
    g.shake = Math.min(1, g.shake + 0.35);
    // the pressure wave flattens every prop in radius
    g.smashPropsNear?.(car.pos.x, car.pos.z, 16, car, 26);
    // damage + knockback
    for (const e of g.enemies) {
      if (!e.alive || e.invuln > 0) continue;
      const to = e.pos.clone().sub(car.pos);
      const d = to.length();
      if (d < 16) {
        to.normalize();
        e.vel.addScaledVector(to, 30 * (1 - d / 18));
        g.onEnemyHit(e, THREE.MathUtils.lerp(26, 10, d / 16), 'shock');
      }
    }
    // the pressure wave doesn't care about altitude — choppers in radius get hit
    for (const c of g.choppers ?? []) {
      if (!c.alive) continue;
      const dx = c.pos.x - car.pos.x, dz = c.pos.z - car.pos.z;
      const d = Math.sqrt(dx * dx + dz * dz);
      if (d < 16) {
        if (c.vel && d > 1e-3) {
          c.vel.x += (dx / d) * 24 * (1 - d / 18);
          c.vel.z += (dz / d) * 24 * (1 - d / 18);
        }
        c.damage(THREE.MathUtils.lerp(26, 10, d / 16));
      }
    }
  }

  fireBullet(car, dmg, spread) {
    const b = this.bullets[this.head];
    this.head = (this.head + 1) % MAX_BULLETS;
    b.active = true;
    b.owner = car;
    b.dmg = dmg;
    b.life = 1.1;
    const fwd = car.forward;
    const side = new THREE.Vector3(fwd.z, 0, -fwd.x);
    const muzzleSide = (this.head % 2 === 0 ? 0.7 : -0.7);
    b.pos.copy(car.pos).addScaledVector(fwd, 2.6).addScaledVector(side, muzzleSide).setY(car.pos.y + 0.85);
    const a = (Math.random() - 0.5) * 2 * spread;
    const dir = new THREE.Vector3(
      fwd.x * Math.cos(a) + fwd.z * Math.sin(a), 0,
      -fwd.x * Math.sin(a) + fwd.z * Math.cos(a)
    );
    b.vel.copy(dir).multiplyScalar(BULLET_SPEED).addScaledVector(car.vel, 0.6);
    const idx = this.bullets.indexOf(b);
    this.mesh.setColorAt(idx, car === this.game.player ? this._colorPlayer : this._colorEnemy);
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }

  /** Chopper chin gun: a tracer from the airframe angled down at targetPos.
   *  Pooled with the car bullets — these are the only rounds with a vy. */
  fireChopperBullet(chopper, targetPos) {
    const b = this.bullets[this.head];
    this.head = (this.head + 1) % MAX_BULLETS;
    b.active = true;
    b.owner = chopper;
    b.dmg = 5;
    b.life = 1.4;
    b.pos.copy(chopper.pos);
    b.pos.y -= 0.7; // muzzle under the nose
    // moderate spread on the aim point — dodgeable at speed
    _aim.set(
      targetPos.x + (Math.random() - 0.5) * 4.2,
      targetPos.y,
      targetPos.z + (Math.random() - 0.5) * 4.2
    );
    b.vel.copy(_aim).sub(b.pos).normalize().multiplyScalar(BULLET_SPEED * 0.8);
    const idx = this.bullets.indexOf(b);
    this.mesh.setColorAt(idx, this._colorEnemy);
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }

  fireMissile(car) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.3, 1.7, 8),
      new THREE.MeshStandardMaterial({ color: 0x2a2444, metalness: 0.8, roughness: 0.3 })
    );
    body.rotation.x = Math.PI / 2;
    g.add(body);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.6, 8), new THREE.MeshBasicMaterial({ color: 0xffb52e }));
    tip.rotation.x = Math.PI / 2;
    tip.position.z = 1.1;
    g.add(tip);
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.3, 1.1, 8), new THREE.MeshBasicMaterial({
      color: 0xffb32e, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    flame.rotation.x = -Math.PI / 2;
    flame.position.z = -1.3;
    g.add(flame);

    const fwd = car.forward;
    g.position.copy(car.pos).addScaledVector(fwd, 3).setY(car.pos.y + 1.1);
    this.game.scene.add(g);

    let target = null, best = Infinity;
    if (car === this.game.player) {
      // lock the closest living enemy (or chopper) roughly ahead — the seeker
      // works in XZ, so choppers are ranked by horizontal distance and favored
      for (const e of [...this.game.enemies, ...(this.game.choppers ?? [])]) {
        if (!e.alive) continue;
        const to = e.pos.clone().sub(car.pos);
        to.y = 0;
        const d = to.length();
        if (d > 160 || d < 1e-3) continue;
        to.normalize();
        if (to.dot(fwd) < 0.25) continue;
        const score = e.isChopper ? d * 0.8 : d; // prefer choppers slightly
        if (score < best) { best = score; target = e; }
      }
      if (target) this.game.hud.feed(`LOCKED: ${target.name}`, 'info');
    } else {
      // enemy-owned missiles hunt THE PLAYER (rival cars never shoot each other)
      const p = this.game.player;
      if (p.alive) {
        const to = p.pos.clone().sub(car.pos);
        to.y = 0;
        const d = to.length();
        if (d < 160 && d > 1e-3 && to.normalize().dot(fwd) > 0.25) target = p;
      }
    }
    this.missiles.push({
      mesh: g, pos: g.position, heading: car.heading,
      speed: Math.max(MISSILE_SPEED, car.speedAlong + 30),
      target, life: 5, owner: car, trailClock: 0, ti: car.trackIndex,
    });
  }

  update(dt) {
    const g = this.game;
    // ---- bullets ----
    for (let i = 0; i < MAX_BULLETS; i++) {
      const b = this.bullets[i];
      if (!b.active) { this.mesh.setMatrixAt(i, this._zero); continue; }
      b.life -= dt;
      b.pos.addScaledVector(b.vel, dt); // integrates y too (chopper rounds descend)
      if (b.life <= 0) { b.active = false; this.mesh.setMatrixAt(i, this._zero); continue; }
      // descending rounds bury into the dirt with a small puff (terrain-aware
      // so tracers die on hillsides instead of tunneling to y=0)
      const gy = b.vel.y < 0 && g.track.terrainHeight ? g.track.terrainHeight(b.pos.x, b.pos.z) : 0;
      if (b.pos.y < gy) {
        _puff.set(b.pos.x, gy + 0.1, b.pos.z);
        g.particles.dust(_puff, 0.6);
        b.active = false;
        this.mesh.setMatrixAt(i, this._zero);
        continue;
      }

      // hit tests
      let hit = false;
      if (b.owner !== g.player) {
        // 3D distance — a chopper round has to actually reach car height
        if (g.player.alive && b.pos.distanceToSquared(g.player.pos) < 7.3) {
          g.onPlayerHit(b.dmg, b.owner);
          hit = true;
        }
      } else {
        for (const e of g.enemies) {
          if (!e.alive || e.invuln > 0) continue;
          if (b.pos.distanceToSquared(e.pos) < 7.3) {
            g.onEnemyHit(e, b.dmg, 'cannon');
            hit = true;
            break;
          }
        }
        if (!hit) {
          // cannon fire vs choppers: horizontal distance only — arcade flak
          // handwave, the burst converges on the airframe whatever its altitude
          for (const c of g.choppers ?? []) {
            if (!c.alive) continue;
            const dx = b.pos.x - c.pos.x, dz = b.pos.z - c.pos.z;
            if (dx * dx + dz * dz < CHOPPER_HIT_R2) {
              b.pos.copy(c.pos); // impact sparks read at the airframe
              g.audio.hit();
              c.damage(b.dmg);
              hit = true;
              break;
            }
          }
        }
      }
      // cannon rounds blow up crates/cones/barrels — this is a shooter
      if (!hit && b.owner === g.player && g.smashPropsNear
          && g.smashPropsNear(b.pos.x, b.pos.z, 1.4, b.owner, 18) > 0) {
        hit = true;
      }
      if (hit) {
        g.particles.sparks(b.pos, new THREE.Vector3(0, 1, 0), 6);
        b.active = false;
        this.mesh.setMatrixAt(i, this._zero);
        continue;
      }
      _dir.copy(b.vel).normalize();
      this._q.setFromUnitVectors(_FWD, _dir); // full 3D aim so diving tracers read
      this._m.compose(b.pos, this._q, new THREE.Vector3(1, 1, 1));
      this.mesh.setMatrixAt(i, this._m);
    }
    this.mesh.instanceMatrix.needsUpdate = true;

    // ---- missiles ----
    for (let mi = this.missiles.length - 1; mi >= 0; mi--) {
      const m = this.missiles[mi];
      m.life -= dt;
      if (m.target && !m.target.alive) m.target = null;
      if (m.target) {
        const desired = Math.atan2(m.target.pos.x - m.pos.x, m.target.pos.z - m.pos.z);
        let dh = desired - m.heading;
        while (dh > Math.PI) dh -= Math.PI * 2;
        while (dh < -Math.PI) dh += Math.PI * 2;
        m.heading += THREE.MathUtils.clamp(dh, -3.4 * dt, 3.4 * dt);
      }
      m.speed = Math.min(m.speed + 60 * dt, 120);
      m.pos.x += Math.sin(m.heading) * m.speed * dt;
      m.pos.z += Math.cos(m.heading) * m.speed * dt;
      m.ti = g.track.nearestIndex(m.pos, m.ti);
      // altitude: ease toward the target's height (or hug the road profile when
      // unguided) so missiles neither clip hills nor fly under their targets
      let wantY;
      if (m.target) {
        wantY = m.target.pos.y + 1;
      } else {
        const lat = THREE.MathUtils.clamp(g.track.lateralOffset(m.pos, m.ti), -9, 9);
        wantY = (g.track.groundHeightAt?.(m.ti, lat) ?? 0) + 1.1;
      }
      m.pos.y += (wantY - m.pos.y) * Math.min(1, 6 * dt);
      m.mesh.rotation.y = m.heading;
      m.trailClock -= dt;
      if (m.trailClock <= 0) {
        m.trailClock = 0.016;
        g.particles.trail(m.pos, new THREE.Color('#ffb52e'));
      }

      const fromPlayer = m.owner === g.player;
      let detonate = m.life <= 0;
      if (fromPlayer) {
        for (const e of g.enemies) {
          if (!e.alive || e.invuln > 0) continue;
          if (m.pos.distanceToSquared(e.pos) < 10) { detonate = true; break; }
        }
        // chopper proximity fuse: horizontal distance only (seeker homes in XZ)
        if (!detonate) {
          for (const c of g.choppers ?? []) {
            if (!c.alive) continue;
            const dx = m.pos.x - c.pos.x, dz = m.pos.z - c.pos.z;
            if (dx * dx + dz * dz < CHOPPER_HIT_R2) {
              detonate = true;
              m.pos.y = c.pos.y; // burst up at the airframe, not on the deck
              break;
            }
          }
        }
      } else if (g.player.alive && g.player.invuln <= 0
          && m.pos.distanceToSquared(g.player.pos) < 10) {
        detonate = true; // enemy-owned: proximity fuse against the player only
      }
      // missiles can also clip walls (never in free roam — no walls out there)
      if (!g.freeRoam && Math.abs(g.track.lateralOffset(m.pos, m.ti)) > 10.2) detonate = true;
      // ...and crates/cones/barrels in the flight path set them off
      if (!detonate && g.smashPropsNear?.(m.pos.x, m.pos.z, 1.3, fromPlayer ? m.owner : null, 20) > 0) {
        detonate = true;
      }

      if (detonate) {
        g.particles.explosion(m.pos, false);
        g.audio.explosion(false);
        g.flashLight(m.pos);
        // the blast levels any props in range (score to the player's missiles)
        g.smashPropsNear?.(m.pos.x, m.pos.z, 6, fromPlayer ? m.owner : null, 22);
        // splash damage
        if (fromPlayer) {
          for (const e of g.enemies) {
            if (!e.alive || e.invuln > 0) continue;
            const d = m.pos.distanceTo(e.pos);
            if (d < 9) g.onEnemyHit(e, THREE.MathUtils.lerp(55, 18, d / 9), 'missile');
          }
          for (const c of g.choppers ?? []) {
            if (!c.alive) continue;
            const dx = m.pos.x - c.pos.x, dz = m.pos.z - c.pos.z;
            const d = Math.sqrt(dx * dx + dz * dz);
            if (d < 9) c.damage(THREE.MathUtils.lerp(55, 18, d / 9)); // altitude ignored
          }
        } else {
          // enemy-owned splash: hurts + shoves the player, routed through onPlayerHit
          const p = g.player;
          const d = m.pos.distanceTo(p.pos);
          if (p.alive && d < 9) {
            g.onPlayerHit(THREE.MathUtils.lerp(38, 12, d / 9), m.owner);
            _dir.copy(p.pos).sub(m.pos);
            _dir.y = 0;
            if (_dir.lengthSq() > 1e-6) p.vel.addScaledVector(_dir.normalize(), 14 * (1 - d / 9));
            g.shake = Math.min(1, g.shake + 0.35);
          }
        }
        g.scene.remove(m.mesh);
        this.missiles.splice(mi, 1);
      }
    }

    // ---- mines ----
    for (let i = this.mines.length - 1; i >= 0; i--) {
      const m = this.mines[i];
      m.life -= dt;
      let boom = m.life <= 0;
      if (m.armTime > 0) {
        m.armTime -= dt;
      } else {
        m.blink += dt;
        m.lampMat.color.setHex(Math.floor(m.blink * 5) % 2 === 0 ? 0xff2222 : 0x661111);
        for (const car of [g.player, ...g.enemies]) {
          if (!car.alive || car === m.owner || car.invuln > 0 || car.airborne) continue;
          if (m.pos.distanceToSquared(car.pos) < 8.5) { boom = true; break; }
        }
      }
      if (boom) {
        g.particles.explosion(m.pos, false);
        g.audio.explosion(false);
        g.flashLight(m.pos);
        g.smashPropsNear?.(m.pos.x, m.pos.z, 7, m.owner === g.player ? m.owner : null, 22);
        for (const car of [g.player, ...g.enemies]) {
          if (!car.alive || car.invuln > 0) continue;
          const d = m.pos.distanceTo(car.pos);
          if (d < 8) {
            const dmg = THREE.MathUtils.lerp(48, 14, d / 8);
            if (car === g.player) g.onPlayerHit(dmg, null);
            else g.onEnemyHit(car, dmg, 'mine');
            const push = car.pos.clone().sub(m.pos).normalize();
            car.vel.addScaledVector(push, 20 * (1 - d / 9));
          }
        }
        g.scene.remove(m.mesh);
        this.mines.splice(i, 1);
      }
    }

    // ---- shockwave rings ----
    for (let i = this.shocks.length - 1; i >= 0; i--) {
      const s = this.shocks[i];
      s.t += dt;
      const f = s.t / 0.55;
      const r = 1 + f * 15;
      s.mesh.scale.set(r, r, 1);
      s.mesh.material.opacity = Math.max(0, 0.95 * (1 - f));
      if (f >= 1) {
        g.scene.remove(s.mesh);
        this.shocks.splice(i, 1);
      }
    }
  }

  reset() {
    for (const b of this.bullets) b.active = false;
    for (const m of this.missiles) this.game.scene.remove(m.mesh);
    for (const m of this.mines) this.game.scene.remove(m.mesh);
    for (const s of this.shocks) this.game.scene.remove(s.mesh);
    this.missiles = [];
    this.mines = [];
    this.shocks = [];
  }
}
