// Pulse-cannon tracers (instanced pool) + homing missiles.
import * as THREE from 'three';

const MAX_BULLETS = 220;
const BULLET_SPEED = 130;
const MISSILE_SPEED = 82;

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

    // lock the closest living enemy roughly ahead
    let target = null, best = Infinity;
    for (const e of this.game.enemies) {
      if (!e.alive) continue;
      const to = e.pos.clone().sub(car.pos);
      const d = to.length();
      if (d > 160) continue;
      to.normalize();
      if (to.dot(fwd) < 0.25) continue;
      if (d < best) { best = d; target = e; }
    }
    this.missiles.push({
      mesh: g, pos: g.position, heading: car.heading,
      speed: Math.max(MISSILE_SPEED, car.speedAlong + 30),
      target, life: 5, owner: car, trailClock: 0, ti: car.trackIndex,
    });
    if (target) this.game.hud.feed(`LOCKED: ${target.name}`, 'info');
  }

  update(dt) {
    const g = this.game;
    // ---- bullets ----
    for (let i = 0; i < MAX_BULLETS; i++) {
      const b = this.bullets[i];
      if (!b.active) { this.mesh.setMatrixAt(i, this._zero); continue; }
      b.life -= dt;
      b.pos.addScaledVector(b.vel, dt);
      if (b.life <= 0) { b.active = false; this.mesh.setMatrixAt(i, this._zero); continue; }

      // hit tests
      let hit = false;
      if (b.owner !== g.player) {
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
      }
      if (hit) {
        g.particles.sparks(b.pos, new THREE.Vector3(0, 1, 0), 6);
        b.active = false;
        this.mesh.setMatrixAt(i, this._zero);
        continue;
      }
      this._q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.atan2(b.vel.x, b.vel.z));
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
      m.mesh.rotation.y = m.heading;
      m.trailClock -= dt;
      if (m.trailClock <= 0) {
        m.trailClock = 0.016;
        g.particles.trail(m.pos, new THREE.Color('#ffb52e'));
      }

      let detonate = m.life <= 0;
      for (const e of g.enemies) {
        if (!e.alive || e.invuln > 0) continue;
        if (m.pos.distanceToSquared(e.pos) < 10) { detonate = true; break; }
      }
      // missiles can also clip walls
      m.ti = g.track.nearestIndex(m.pos, m.ti);
      if (Math.abs(g.track.lateralOffset(m.pos, m.ti)) > 10.2) detonate = true;

      if (detonate) {
        g.particles.explosion(m.pos, false);
        g.audio.explosion(false);
        g.flashLight(m.pos);
        // splash damage
        for (const e of g.enemies) {
          if (!e.alive || e.invuln > 0) continue;
          const d = m.pos.distanceTo(e.pos);
          if (d < 9) g.onEnemyHit(e, THREE.MathUtils.lerp(55, 18, d / 9), 'missile');
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
