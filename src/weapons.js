// Pulse-cannon tracers (instanced pool) + homing missiles.
import * as THREE from 'three';

const MAX_BULLETS = 220;
const BULLET_SPEED = 130;
const MISSILE_SPEED = 82;
const CHOPPER_HIT_R2 = 3.4 * 3.4; // horizontal hit/detonate radius vs choppers
// Hard ceiling on live mines. Each one is a Group + two cloned materials that
// sits for 45 s; ammo normally bounds it, but a long free-roam session with
// every car laying mines must never grow the scene without limit — over the
// cap the oldest mine is quietly retired (meshes removed, materials disposed).
const MAX_LIVE_MINES = 24;

const _aim = new THREE.Vector3();  // scratch: chopper gun aim point
const _dir = new THREE.Vector3();  // scratch: bullet orientation
const _puff = new THREE.Vector3(); // scratch: ground-impact dust
const _side = new THREE.Vector3(); // scratch: muzzle offset
const _bdir = new THREE.Vector3(); // scratch: bullet launch direction
const _scl = new THREE.Vector3();  // scratch: tracer stretch (no per-frame alloc)
const _heat = new THREE.Color();   // scratch: tracer heat tint
const _FWD = new THREE.Vector3(0, 0, 1);
const _UP = new THREE.Vector3(0, 1, 0);
const _WHITE_HOT = new THREE.Color('#fffdf4');
const TRAIL_FIRE = new THREE.Color('#ffb52e');

// ---- shared geometry & immutable materials (built once — a launch allocates
// no GPU resources, and removal needs no dispose; only per-instance ANIMATED
// materials below are cloned per launch and disposed on removal) ----
const MISSILE_BODY_GEO = new THREE.CylinderGeometry(0.22, 0.3, 1.7, 8);
const MISSILE_BODY_MAT = new THREE.MeshStandardMaterial({ color: 0x2a2444, metalness: 0.8, roughness: 0.3 });
const MISSILE_TIP_GEO = new THREE.ConeGeometry(0.24, 0.6, 8);
const MISSILE_TIP_MAT = new THREE.MeshBasicMaterial({ color: 0xffb52e });
const MISSILE_FLAME_GEO = new THREE.ConeGeometry(0.3, 1.1, 8);
const MISSILE_FLAME_MAT = new THREE.MeshBasicMaterial({
  color: 0xffb32e, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false,
});
const MISSILE_GLOW_GEO = new THREE.SphereGeometry(0.34, 8, 6);
const MISSILE_GLOW_MAT = new THREE.MeshBasicMaterial({
  color: 0xffe9a0, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false,
});
const MINE_BODY_GEO = new THREE.SphereGeometry(0.5, 10, 8);
const MINE_BODY_MAT = new THREE.MeshStandardMaterial({ color: 0x2a2622, metalness: 0.6, roughness: 0.4 });
const MINE_LAMP_GEO = new THREE.SphereGeometry(0.14, 8, 6);
const MINE_RING_GEO = new THREE.RingGeometry(0.55, 1.6, 24); // armed ground-glow
const SHOCK_RING_GEO = new THREE.TorusGeometry(1, 0.35, 8, 48);

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
      this.bullets.push({ active: false, pos: new THREE.Vector3(), vel: new THREE.Vector3(), life: 0, maxLife: 1, owner: null, dmg: 0, base: null, hotK: 0 });
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
    while (this.mines.length >= MAX_LIVE_MINES) {
      const old = this.mines.shift();
      this.game.scene.remove(old.mesh);
      old.lampMat.dispose();
      old.ringMat.dispose();
    }
    const g = new THREE.Group();
    const body = new THREE.Mesh(MINE_BODY_GEO, MINE_BODY_MAT);
    body.scale.y = 0.6;
    g.add(body);
    // lamp + ground ring animate per-mine → cloned materials, disposed on boom
    const lampMat = new THREE.MeshBasicMaterial({ color: 0x661111 });
    const lamp = new THREE.Mesh(MINE_LAMP_GEO, lampMat);
    lamp.position.y = 0.35;
    g.add(lamp);
    // faint red danger ring hugging the road under the mine — invisible until
    // armed, then it pulses in sync with the lamp, harder as a car closes in
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xff2a1a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending,
      depthWrite: false, side: THREE.DoubleSide,
      polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3,
    });
    const ring = new THREE.Mesh(MINE_RING_GEO, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -0.26; // just above the road surface (mine sits at +0.3)
    ring.renderOrder = 1;
    g.add(ring);
    const back = car.forward.multiplyScalar(-1);
    const gm = this.game, t = gm.track;
    const p = car.pos.clone().addScaledVector(back, 3.4);
    // sit the mine ON the road surface (a fixed y=0.3 left mines buried far
    // beneath elevated roads, where the 3D trigger could never fire) and
    // snap it toward the racing lane so pursuers actually meet it
    p.y = 0.3;
    if (t?.nearestIndex) {
      const idx = t.nearestIndex(p, car.trackIndex);
      const lat = THREE.MathUtils.clamp(t.lateralOffset(p, idx), -5.5, 5.5);
      const c = t.pointAt(idx, lat);
      p.set(c.x, c.y + 0.3, c.z);
    }
    g.position.copy(p);
    this.game.scene.add(g);
    this.mines.push({ mesh: g, pos: g.position, lampMat, ringMat, owner: car, armTime: 0.8, life: 45, blink: 0 });
  }

  fireShockwave(car) {
    const g = this.game;
    // double ring: amber pressure front + a white-hot inner ring chasing it,
    // over a circle of ground dust — reads as a real blast wave. Materials
    // animate opacity per shock, so they're cloned here and disposed at end.
    const matA = new THREE.MeshBasicMaterial({
      color: 0xffe8a8, transparent: true, opacity: 0.95,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const ring = new THREE.Mesh(SHOCK_RING_GEO, matA);
    ring.rotation.x = Math.PI / 2;
    ring.position.copy(car.pos).setY(car.pos.y + 0.6);
    g.scene.add(ring);
    const matB = new THREE.MeshBasicMaterial({
      color: 0xfffdf0, transparent: true, opacity: 0.9,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const ringB = new THREE.Mesh(SHOCK_RING_GEO, matB);
    ringB.rotation.x = Math.PI / 2;
    ringB.position.copy(car.pos).setY(car.pos.y + 0.85);
    g.scene.add(ringB);
    this.shocks.push({ mesh: ring, matA, meshB: ringB, matB, t: 0 });
    g.particles.shockDust(car.pos, 20);
    g.hud.feed('SHOCKWAVE', 'info');
    g.audio.explosion(false);
    g.shake = Math.min(1, g.shake + 0.35);
    // the pressure wave flattens everything breakable in radius
    if (g.blastWorld) g.blastWorld(car.pos.x, car.pos.z, 16, car);
    else g.smashPropsNear?.(car.pos.x, car.pos.z, 16, car, 26);
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
    const idx = this.head;
    const b = this.bullets[idx];
    this.head = (this.head + 1) % MAX_BULLETS;
    b.active = true;
    b.owner = car;
    b.dmg = dmg;
    b.life = b.maxLife = 1.1;
    const fwd = car.forward;
    _side.set(fwd.z, 0, -fwd.x);
    const muzzleSide = (this.head % 2 === 0 ? 0.7 : -0.7);
    b.pos.copy(car.pos).addScaledVector(fwd, 2.6).addScaledVector(_side, muzzleSide).setY(car.pos.y + 0.85);
    const a = (Math.random() - 0.5) * 2 * spread;
    _bdir.set(
      fwd.x * Math.cos(a) + fwd.z * Math.sin(a), 0,
      -fwd.x * Math.sin(a) + fwd.z * Math.cos(a)
    );
    b.vel.copy(_bdir).multiplyScalar(BULLET_SPEED).addScaledVector(car.vel, 0.6);
    const player = car === this.game.player;
    b.base = player ? this._colorPlayer : this._colorEnemy;
    b.hotK = player ? 0.85 : 0.45; // how white-hot the fresh tracer runs
    this.mesh.setColorAt(idx, b.base);
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
    // muzzle punch: bright core pop + flares thrown along the shot line
    this.game.particles.muzzleFlash(b.pos, _bdir);
  }

  /** Chopper chin gun: a tracer from the airframe angled down at targetPos.
   *  Pooled with the car bullets — these are the only rounds with a vy. */
  fireChopperBullet(chopper, targetPos) {
    const idx = this.head;
    const b = this.bullets[idx];
    this.head = (this.head + 1) % MAX_BULLETS;
    b.active = true;
    b.owner = chopper;
    b.dmg = 5;
    b.life = b.maxLife = 1.4;
    b.base = this._colorEnemy;
    b.hotK = 0.45;
    b.pos.copy(chopper.pos);
    b.pos.y -= 0.7; // muzzle under the nose
    // moderate spread on the aim point — dodgeable at speed
    _aim.set(
      targetPos.x + (Math.random() - 0.5) * 4.2,
      targetPos.y,
      targetPos.z + (Math.random() - 0.5) * 4.2
    );
    b.vel.copy(_aim).sub(b.pos).normalize().multiplyScalar(BULLET_SPEED * 0.8);
    this.mesh.setColorAt(idx, this._colorEnemy);
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }

  fireMissile(car) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(MISSILE_BODY_GEO, MISSILE_BODY_MAT);
    body.rotation.x = Math.PI / 2;
    g.add(body);
    const tip = new THREE.Mesh(MISSILE_TIP_GEO, MISSILE_TIP_MAT);
    tip.rotation.x = Math.PI / 2;
    tip.position.z = 1.1;
    g.add(tip);
    const flame = new THREE.Mesh(MISSILE_FLAME_GEO, MISSILE_FLAME_MAT);
    flame.rotation.x = -Math.PI / 2;
    flame.position.z = -1.3;
    g.add(flame);
    // bright engine glow ball riding the exhaust — flickers per frame
    const glow = new THREE.Mesh(MISSILE_GLOW_GEO, MISSILE_GLOW_MAT);
    glow.position.z = -1.05;
    g.add(glow);

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
      target, life: 5, owner: car, trailClock: 0, smokeClock: 0,
      flame, glow, ti: car.trackIndex,
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
      // ...chip trees down (3-ish hits fells one), burst tire stacks, drop
      // boards. Bullets cover several units per frame, so hit-test the whole
      // segment flown this frame — a point check tunnels through thin trunks.
      if (!hit && b.owner === g.player) {
        const sx = b.pos.x - b.vel.x * dt, sz = b.pos.z - b.vel.z * dt;
        const segX = b.pos.x - sx, segZ = b.pos.z - sz;
        const segLen2 = segX * segX + segZ * segZ || 1e-9;
        const segHits = (cx, cz, r) => {
          const u = Math.max(0, Math.min(1, ((cx - sx) * segX + (cz - sz) * segZ) / segLen2));
          const dx = sx + segX * u - cx, dz = sz + segZ * u - cz;
          return dx * dx + dz * dz < r * r;
        };
        for (const tr of g.track.trees ?? []) {
          if (tr.dead) continue;
          if (!segHits(tr.x, tr.z, tr.r + 1.1)) continue;
          // bigger trunks soak more rounds (~3 hits for a sapling, ~5 for a giant)
          tr.hp = (tr.hp ?? (24 + (tr.s ?? 1) * 16)) - b.dmg;
          g.particles.splinters(b.pos, _UP, [0x6a4a2a, 0x3e5e30], 0.3);
          if (tr.hp <= 0) g.onTreeSmash?.(tr, null, b.owner.pos.x, b.owner.pos.z);
          hit = true;
          break;
        }
        if (!hit) for (const st of g.track.tireStacks ?? []) {
          if (st.dead) continue;
          if (segHits(st.x, st.z, st.r + 1.1)) { g.onTireSmash?.(st, null, b.owner.pos.x, b.owner.pos.z); hit = true; break; }
        }
        if (!hit) for (const bn of g.track.banners ?? []) {
          if (bn.dead) continue;
          if (segHits(bn.x, bn.z, bn.r + 1.1)) { g.onBannerSmash?.(bn, null, b.owner.pos.x, b.owner.pos.z); hit = true; break; }
        }
      }
      if (hit) {
        g.particles.ricochet(b.pos, _UP); // varied spark burst — no two alike
        b.active = false;
        this.mesh.setMatrixAt(i, this._zero);
        continue;
      }
      _dir.copy(b.vel).normalize();
      this._q.setFromUnitVectors(_FWD, _dir); // full 3D aim so diving tracers read
      // heat reading: fresh rounds run white-hot and slightly stretched,
      // cooling to the owner color over the first ~0.2 s of flight
      const heat = Math.max(0, 1 - (b.maxLife - b.life) / 0.22);
      _scl.set(1, 1, 1 + heat * 0.9);
      this._m.compose(b.pos, this._q, _scl);
      this.mesh.setMatrixAt(i, this._m);
      if (b.base) {
        _heat.copy(b.base).lerp(_WHITE_HOT, heat * b.hotK);
        this.mesh.setColorAt(i, _heat);
      }
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;

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
        g.particles.trail(m.pos, TRAIL_FIRE);
      }
      // grey smoke rope hanging behind the fire trail (capped at 20/s)
      m.smokeClock -= dt;
      if (m.smokeClock <= 0) {
        m.smokeClock = 0.05;
        g.particles.missileSmoke(m.pos);
      }
      // engine flicker: glow ball + flame length jitter every frame (no allocs)
      if (m.glow) m.glow.scale.setScalar(0.8 + Math.random() * 0.55);
      if (m.flame) m.flame.scale.y = 0.85 + Math.random() * 0.45;

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
        g.particles.detonation(m.pos); // big flash + fireball + debris ring
        g.audio.explosion(false);
        g.flashLight(m.pos);
        // the blast levels everything breakable in range (props, trees, tires, boards)
        if (g.blastWorld) g.blastWorld(m.pos.x, m.pos.z, 6, fromPlayer ? m.owner : null);
        else g.smashPropsNear?.(m.pos.x, m.pos.z, 6, fromPlayer ? m.owner : null, 22);
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
        // trigger check + telegraph: track the closest threat so the lamp
        // blink ramps up and the ground ring burns brighter as a car closes in
        let d2min = Infinity;
        for (const car of [g.player, ...g.enemies]) {
          if (!car.alive || car === m.owner || car.invuln > 0 || car.airborne) continue;
          const d2 = m.pos.distanceToSquared(car.pos);
          if (d2 < d2min) d2min = d2;
          if (d2 < 17.5) { boom = true; break; }
        }
        // proximity 0 beyond ~18 u → 1 at the 4.2 u trigger radius
        const prox = THREE.MathUtils.clamp(1 - (Math.sqrt(Math.min(d2min, 1e6)) - 4.2) / 14, 0, 1);
        m.blink += dt * THREE.MathUtils.lerp(5, 22, prox); // blink rate ramp
        const on = Math.floor(m.blink) % 2 === 0;
        m.lampMat.color.setHex(on ? 0xff2222 : 0x661111);
        m.ringMat.opacity = on ? 0.22 + 0.3 * prox : 0.08;
      }
      if (boom) {
        g.particles.detonation(m.pos);
        g.audio.explosion(false);
        g.flashLight(m.pos);
        if (g.blastWorld) g.blastWorld(m.pos.x, m.pos.z, 7, m.owner === g.player ? m.owner : null);
        else g.smashPropsNear?.(m.pos.x, m.pos.z, 7, m.owner === g.player ? m.owner : null, 22);
        for (const car of [g.player, ...g.enemies]) {
          if (!car.alive || car.invuln > 0) continue;
          const d = m.pos.distanceTo(car.pos);
          if (d < 9.5) {
            const dmg = THREE.MathUtils.lerp(52, 16, d / 9.5);
            if (car === g.player) g.onPlayerHit(dmg, null);
            else g.onEnemyHit(car, dmg, 'mine');
            const push = car.pos.clone().sub(m.pos).normalize();
            car.vel.addScaledVector(push, 22 * (1 - d / 10.5));
          }
        }
        g.scene.remove(m.mesh);
        m.lampMat.dispose();
        m.ringMat.dispose();
        this.mines.splice(i, 1);
      }
    }

    // ---- shockwave rings ----
    for (let i = this.shocks.length - 1; i >= 0; i--) {
      const s = this.shocks[i];
      s.t += dt;
      // ease-out expansion: the front leaps off the car then decelerates —
      // reads as a pressure wave, still peaks at the same 16 u damage radius
      const f = Math.min(1, s.t / 0.55);
      const e = 1 - (1 - f) * (1 - f);
      const r = 1 + e * 15;
      s.mesh.scale.set(r, r, 1);
      s.matA.opacity = Math.max(0, 0.95 * (1 - f));
      if (s.meshB) {
        // inner white ring launches a beat later and chases the front
        const f2 = THREE.MathUtils.clamp((s.t - 0.06) / 0.55, 0, 1);
        const e2 = 1 - (1 - f2) * (1 - f2);
        const r2 = 1 + e2 * 12.5;
        s.meshB.scale.set(r2, r2, 0.6);
        s.matB.opacity = Math.max(0, 0.85 * (1 - f2));
      }
      if (s.t >= 0.62) {
        g.scene.remove(s.mesh);
        s.matA.dispose();
        if (s.meshB) { g.scene.remove(s.meshB); s.matB.dispose(); }
        this.shocks.splice(i, 1);
      }
    }
  }

  reset() {
    for (const b of this.bullets) b.active = false;
    for (const m of this.missiles) this.game.scene.remove(m.mesh);
    for (const m of this.mines) {
      this.game.scene.remove(m.mesh);
      m.lampMat.dispose();
      m.ringMat.dispose();
    }
    for (const s of this.shocks) {
      this.game.scene.remove(s.mesh);
      s.matA?.dispose();
      if (s.meshB) { this.game.scene.remove(s.meshB); s.matB.dispose(); }
    }
    this.missiles = [];
    this.mines = [];
    this.shocks = [];
  }
}
