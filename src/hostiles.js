// IGNITE RALLY — GROUND HOSTILES.
//
// The only thing hunting you used to be a helicopter, which meant every fight
// had the same shape: something circling overhead that you could not reach
// except with the cannon pointed up. These two fight on the ground, on your
// terms, and they read completely differently from each other:
//
//   GUN NEST  a dug-in emplacement beside the road. It never moves, so it is
//             a piece of the circuit you learn — take the far line, or spend
//             a magazine and it is gone for the rest of the race.
//   RAIDER    an armed buggy that hunts. It is deliberately slower flat out
//             than a healthy car (46 vs ~55 u/s), so it can always be
//             outrun — the pressure is that outrunning it costs you the
//             racing line, and it will ram if you let it get alongside.
//
// Both implement the same small contract the chopper does — pos, vel, alive,
// mesh, update(dt), damage(n) — so weapons.js, the blast radius and the
// mission machinery treat all three the same way. They live in game.hostiles
// and are parented to game.worldLayer, so a level swap disposes them.
import * as THREE from 'three';

const _t = new THREE.Vector3();
const _aim = new THREE.Vector3();

/** Squat sandbagged emplacement with a swivelling gun. */
function buildNestMesh() {
  const g = new THREE.Group();
  const sand = new THREE.MeshStandardMaterial({ color: 0x6d6a4e, roughness: 1, flatShading: true });
  const steel = new THREE.MeshStandardMaterial({ color: 0x33363a, roughness: 0.6, metalness: 0.4 });
  // ring of sandbags
  const bag = new THREE.BoxGeometry(1.5, 0.62, 0.95);
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const m = new THREE.Mesh(bag, sand);
    m.position.set(Math.cos(a) * 2.5, 0.32 + (i % 2) * 0.5, Math.sin(a) * 2.5);
    m.rotation.y = -a;
    m.castShadow = true;
    g.add(m);
  }
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.8, 0.5, 16), steel);
  base.position.y = 0.25;
  g.add(base);
  // the head is a child group so it can track the player independently
  const head = new THREE.Group();
  head.position.y = 0.95;
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.95, 1.6), steel);
  g.userData.head = head;
  head.add(body);
  for (const s of [-0.32, 0.32]) {
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 2.6, 8), steel);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(s, 0.12, 1.3);
    head.add(barrel);
  }
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 6),
    new THREE.MeshBasicMaterial({ color: 0xff3a20 }));
  eye.position.set(0, 0.5, 0.4);
  head.add(eye);
  g.userData.eye = eye;
  g.add(head);
  return g;
}

/** Low armoured buggy — reads as hostile at a glance: black plate, red flash. */
function buildRaiderMesh() {
  const g = new THREE.Group();
  const plate = new THREE.MeshStandardMaterial({ color: 0x2a2c30, roughness: 0.65, metalness: 0.35, flatShading: true });
  const trim = new THREE.MeshStandardMaterial({ color: 0xc0271a, roughness: 0.5 });
  const rubber = new THREE.MeshStandardMaterial({ color: 0x151412, roughness: 0.95 });
  const hull = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.85, 4.3), plate);
  hull.position.y = 1.0; hull.castShadow = true;
  g.add(hull);
  const cage = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.75, 1.7), plate);
  cage.position.set(0, 1.75, -0.35);
  g.add(cage);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.55, 0.16, 0.7), trim);
  stripe.position.set(0, 1.35, 1.5);
  g.add(stripe);
  // pintle gun on the roof
  const gun = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 2.2, 8), plate);
  gun.rotation.x = Math.PI / 2;
  gun.position.set(0, 2.25, 0.9);
  g.add(gun);
  const wheel = new THREE.CylinderGeometry(0.72, 0.72, 0.5, 16);
  wheel.rotateZ(Math.PI / 2);
  for (const x of [-1.28, 1.28]) for (const z of [-1.45, 1.45]) {
    const w = new THREE.Mesh(wheel, rubber);
    w.position.set(x, 0.72, z);
    g.add(w);
  }
  return g;
}

/** Shared bits: damage, death, and the little the two have in common. */
class GroundHostile {
  constructor(game, pos, name) {
    this.game = game;
    this.name = name;
    this.alive = true;
    this.pos = pos.clone();
    this.vel = new THREE.Vector3();
    this.heading = 0;
    this.fireTimer = 1.2 + Math.random() * 1.4;
    this.burstLeft = 0;
    this.burstClock = 0;
    this._hitFlash = 0;
  }

  get forward() { return _t.set(Math.sin(this.heading), 0, Math.cos(this.heading)); }

  damage(n) {
    if (!this.alive) return false;
    this.health -= n;
    this._hitFlash = 0.12;
    this.game.particles?.splinters?.(this.pos, new THREE.Vector3(0, 1, 0), [0x8a8a8a, 0xff6a30], 0.3);
    if (this.health <= 0) { this.health = 0; this._die(); return true; }
    return false;
  }

  /** Fire a burst at the player, leading the shot a little so a car at speed
   *  still has to move rather than just holding a straight line. */
  _shoot(dt, range, gap, burst) {
    const g = this.game, p = g.player;
    if (!p || !p.alive) return;
    const d = Math.hypot(p.pos.x - this.pos.x, p.pos.z - this.pos.z);
    if (d > range) { this.fireTimer = Math.max(this.fireTimer, 0.5); return; }
    this.fireTimer -= dt;
    if (this.burstLeft > 0) {
      this.burstClock -= dt;
      if (this.burstClock <= 0) {
        this.burstClock = 0.12;
        this.burstLeft--;
        const lead = d / 150;                       // rough time-of-flight lead
        _aim.set(p.pos.x + p.vel.x * lead, p.pos.y + 0.7, p.pos.z + p.vel.z * lead);
        g.weapons?.fireChopperBullet?.(this, _aim);
        g.audio?.shoot?.();
      }
    } else if (this.fireTimer <= 0) {
      this.fireTimer = gap;
      this.burstLeft = burst;
      this.burstClock = 0;
    }
  }

  _die() {
    const g = this.game;
    this.alive = false;
    g.particles?.explosion?.(this.pos, true);
    g.particles?.debris?.(this.pos, 6);
    g.flashLight?.(this.pos);
    g.audio?.explosion?.(true);
    g.hud?.feed?.(`${this.name} DESTROYED`, 'good');
    g.shake = Math.min(1, (g.shake ?? 0) + 0.3);
    g.buzz?.(35);
    g.score += this.score;
    g.onHostileKill?.(this);
    this.mesh.parent?.remove(this.mesh);
    this.mesh.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      const m = o.material;
      if (Array.isArray(m)) m.forEach((x) => x.dispose()); else m?.dispose();
    });
  }
}

/** Dug in beside the road. Never moves; tracks and fires. */
export class GunNest extends GroundHostile {
  constructor(game, pos) {
    super(game, pos, 'GUN NEST');
    this.maxHealth = this.health = 70;
    this.score = 150;
    this.r = 2.8;                      // cars bounce off the emplacement
    this.muzzleY = 1.5;                // fires from the gun, not from the dirt
    this.mesh = buildNestMesh();
    this.mesh.position.copy(this.pos);
    (game.worldLayer || game.scene).add(this.mesh);
    // Law of Solidity: an emplacement is a thing you hit, not a hologram.
    // Registered as a collider and pulled back out when it is destroyed, so
    // the wreckage never leaves an invisible block on the ground.
    this._solid = { x: pos.x, z: pos.z, r: this.r, y: pos.y + 0.6, mat: 'metal' };
    game.track?.solids?.push(this._solid);
  }

  _die() {
    const list = this.game.track?.solids;
    const i = list ? list.indexOf(this._solid) : -1;
    if (i >= 0) list.splice(i, 1);
    super._die();
  }

  update(dt) {
    if (!this.alive) return;
    const g = this.game, p = g.player;
    if (p && p.alive) {
      const want = Math.atan2(p.pos.x - this.pos.x, p.pos.z - this.pos.z);
      const head = this.mesh.userData.head;
      // swing round rather than snapping, so you can drive out of its arc
      let dA = want - head.rotation.y;
      while (dA > Math.PI) dA -= Math.PI * 2;
      while (dA < -Math.PI) dA += Math.PI * 2;
      head.rotation.y += THREE.MathUtils.clamp(dA, -1.9 * dt, 1.9 * dt);
      this.heading = head.rotation.y;
      // only shoots when it is actually pointing at you
      if (Math.abs(dA) < 0.35) this._shoot(dt, 88, 1.5, 4);
    }
    this._hitFlash = Math.max(0, this._hitFlash - dt);
    const eye = this.mesh.userData.eye;
    if (eye) eye.material.color.setHex(this._hitFlash > 0 ? 0xffffff : 0xff3a20);
  }
}

/** Hunts the player on the ground. Slower flat out than a healthy car, so it
 *  can always be outrun — the cost is the line you give up doing it. */
export class Raider extends GroundHostile {
  constructor(game, pos) {
    super(game, pos, 'RAIDER');
    this.maxHealth = this.health = 120;
    this.score = 200;
    this.r = 2.2;
    this.muzzleY = 2.3;                // roof pintle
    this.topSpeed = 46;
    this.mesh = buildRaiderMesh();
    this.mesh.position.copy(this.pos);
    (game.worldLayer || game.scene).add(this.mesh);
  }

  update(dt) {
    if (!this.alive) return;
    const g = this.game, p = g.player;
    const t = g.track;
    if (p && p.alive) {
      const dx = p.pos.x - this.pos.x, dz = p.pos.z - this.pos.z;
      const d = Math.hypot(dx, dz) || 1;
      // PURSUE, DON'T ORBIT.
      //
      // This used to steer flat at the player and hold most of its speed all
      // the way in. A pure seek with no arrival cannot settle: it overshoots,
      // swings back through, overshoots the other way, and the result is a
      // buggy spinning circles around you for no reason anybody can read.
      //
      // Three states instead, and each one looks like a decision:
      //   CLOSE   far away — drive straight at the player, full speed
      //   STAND   inside its gun range — hold station off one shoulder and
      //           shoot, matching pace rather than boring in
      //   PUSH    lined up and close — commit to a ram, then back off
      const RANGE = 42;
      const side = this._side ?? (this._side = Math.random() < 0.5 ? -1 : 1);
      let aimX = p.pos.x, aimZ = p.pos.z, target = this.topSpeed;
      if (d < RANGE && (this._ramCool ?? 0) > 0.2) {
        // holding: aim at a point off the player's shoulder and match speed,
        // so it sits in your mirror instead of pirouetting around you
        const pf = p.forward;
        aimX = p.pos.x - pf.x * 12 + pf.z * side * 9;
        aimZ = p.pos.z - pf.z * 12 - pf.x * side * 9;
        target = Math.min(this.topSpeed, Math.abs(p.speedAlong) + 4);
      } else if (d < 12) {
        target = this.topSpeed * 0.85;          // committed run-in
      }
      const want = Math.atan2(aimX - this.pos.x, aimZ - this.pos.z);
      let dA = want - this.heading;
      while (dA > Math.PI) dA -= Math.PI * 2;
      while (dA < -Math.PI) dA += Math.PI * 2;
      // turn rate falls off with speed, like something with actual tyres —
      // it can no longer pivot on the spot to keep its nose on you
      const turn = (2.4 - Math.min(1.4, this.vel.length() * 0.03)) * dt;
      this.heading += THREE.MathUtils.clamp(dA, -turn, turn);
      // and it does not accelerate while pointing the wrong way
      if (Math.abs(dA) > 1.1) target *= 0.45;
      const f = this.forward;
      this.vel.x += (f.x * target - this.vel.x) * Math.min(1, 2.4 * dt);
      this.vel.z += (f.z * target - this.vel.z) * Math.min(1, 2.4 * dt);
      this.pos.x += this.vel.x * dt;
      this.pos.z += this.vel.z * dt;
      this.pos.y = t ? t.terrainHeight(this.pos.x, this.pos.z) : 0;
      this._shoot(dt, 62, 2.1, 3);
      // RAM. Contact costs hull and shoves both ways, so being caught is a
      // real event rather than a scrape.
      if (d < 4.0 && (this._ramCool ?? 0) <= 0) {
        // long cooldown, and it switches shoulder afterwards, so a ram is a
        // discrete event you can see coming rather than a continuous grind
        this._ramCool = 4.5;
        this._side = -side;
        const closing = Math.abs(this.vel.length() - p.vel.length());
        g.onPlayerHit?.(Math.min(22, 8 + closing * 0.35), this);
        g.hud?.feed?.('RAMMED', 'bad');
        p.vel.x += (dx / d) * 9; p.vel.z += (dz / d) * 9;
        this.vel.multiplyScalar(0.55);
        g.shake = Math.min(1, (g.shake ?? 0) + 0.25);
      }
    }
    this._ramCool = Math.max(0, (this._ramCool ?? 0) - dt);
    this._hitFlash = Math.max(0, this._hitFlash - dt);
    this.mesh.position.copy(this.pos);
    this.mesh.rotation.y = this.heading;
    // give up and despawn if the player has genuinely left it behind
    if (p && Math.hypot(p.pos.x - this.pos.x, p.pos.z - this.pos.z) > 420) {
      this.alive = false;
      this.mesh.parent?.remove(this.mesh);
    }
  }
}
