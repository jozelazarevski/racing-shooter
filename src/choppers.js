// Attack helicopters: gunmetal hunter-killers that orbit the player and rake
// the road with chin-gun bursts. The lead owns spawning/updating/filtering
// (game.choppers = []); this class is self-contained — mesh in on construct,
// full cleanup + game.onChopperKill?.() on death.
import * as THREE from 'three';

const HOVER_ALT = 7;      // hover height above the ground (bob ±0.8 on top)
const ORBIT_R = 14;       // offset of the orbit point from the player
const MAX_SPEED = 46;     // slower than a flat-out car — you can outrun it
const ACCEL = 34;         // horizontal thrust toward the orbit point
const BURST_GAP_MIN = 2.2; // seconds between 4-round bursts
const BURST_GAP_VAR = 1.0; // ...plus up to this much
const GUN_RANGE = 65;      // won't open fire beyond this (horizontal)

// A gunship makes PASSES; it does not hover on your bumper firing forever.
// It shadows you from a distance, commits to an attack run, then breaks off to
// reposition — so there is always a rhythm of pressure and relief instead of a
// constant stream of bullets. Only the RUN phase shoots.
const PHASE = {
  stalk: { time: [3.4, 2.6], radius: 34, fire: false },  // pacing you, out wide
  run:   { time: [3.2, 1.8], radius: ORBIT_R, fire: true }, // committed, guns live
  break: { time: [3.0, 2.0], radius: 52, fire: false },  // peeling away to set up
};

const GUNMETAL = 0x30343a;
const GUNMETAL_DARK = 0x22262b;
const WARN_RED = 0xd8342a;

const _target = new THREE.Vector3(); // scratch: predicted aim point

// ---------- mesh: boxy gunship with spinning rotors ----------
function buildChopperMesh() {
  const g = new THREE.Group();
  const mat = (color, opts = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.25, ...opts });
  const hullMat = mat(GUNMETAL);
  const darkMat = mat(GUNMETAL_DARK);
  const redMat = mat(WARN_RED, { roughness: 0.5 });
  const glassMat = mat(0x0f1620, { roughness: 0.15, metalness: 0.6 });

  const box = (w, h, d, m, x, y, z, shadow = false) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    mesh.position.set(x, y, z);
    if (shadow) mesh.castShadow = true;
    g.add(mesh);
    return mesh;
  };

  // fuselage + canopy nose (forward = +z, same convention as the cars)
  box(1.7, 1.5, 3.4, hullMat, 0, 0, 0.2, true);
  box(1.25, 1.0, 1.2, glassMat, 0, 0.08, 2.15, true);
  box(1.0, 0.55, 0.8, redMat, 0, -0.72, 1.9);        // chin gun pod, warning red
  box(0.24, 0.24, 0.9, darkMat, 0, -0.72, 2.5);      // gun barrel
  // stub wings with rocket pods
  for (const s of [-1, 1]) {
    box(1.4, 0.16, 0.7, hullMat, 1.35 * s, 0.1, 0.4);
    box(0.5, 0.5, 1.1, darkMat, 1.9 * s, -0.15, 0.4);
    box(0.46, 0.12, 0.1, redMat, 1.9 * s, -0.15, 0.98); // pod cap stripe
  }
  // tail boom + fin + tail plane
  box(0.55, 0.55, 3.4, hullMat, 0, 0.28, -3.15, true);
  box(0.58, 0.58, 0.6, redMat, 0, 0.28, -2.2);       // warning band on the boom
  box(0.16, 1.35, 0.85, hullMat, 0, 1.05, -4.6);
  box(1.6, 0.14, 0.5, darkMat, 0, 0.62, -4.35);
  // skids
  for (const s of [-1, 1]) {
    box(0.14, 0.14, 3.0, darkMat, 0.85 * s, -1.2, 0.35);
    box(0.1, 0.55, 0.1, darkMat, 0.85 * s, -0.9, 1.25);
    box(0.1, 0.55, 0.1, darkMat, 0.85 * s, -0.9, -0.6);
  }

  // main rotor: mast + two crossed blades + a faint blur disc
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 0.5, 8), darkMat);
  mast.position.y = 0.95;
  g.add(mast);
  const rotor = new THREE.Group();
  rotor.position.y = 1.2;
  const bladeGeo = new THREE.BoxGeometry(7.6, 0.07, 0.36);
  const bladeMat = mat(0x1b1e22, { roughness: 0.8 });
  const b1 = new THREE.Mesh(bladeGeo, bladeMat);
  const b2 = new THREE.Mesh(bladeGeo, bladeMat);
  b2.rotation.y = Math.PI / 2;
  rotor.add(b1, b2);
  for (const s of [-1, 1]) { // warning-red blade tips
    const t1 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.08, 0.36), redMat);
    t1.position.x = 3.45 * s;
    rotor.add(t1);
  }
  g.add(rotor);
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(3.9, 24),
    new THREE.MeshBasicMaterial({
      color: 0x60656c, transparent: true, opacity: 0.14,
      side: THREE.DoubleSide, depthWrite: false,
    })
  );
  disc.rotation.x = -Math.PI / 2;
  disc.position.y = 1.2;
  g.add(disc);

  // tail rotor (spins around x, mounted on the fin's side)
  const tailRotor = new THREE.Group();
  tailRotor.position.set(0.3, 1.05, -4.75);
  const tGeo = new THREE.BoxGeometry(0.06, 1.6, 0.22);
  const t1 = new THREE.Mesh(tGeo, bladeMat);
  const t2 = new THREE.Mesh(tGeo, bladeMat);
  t2.rotation.x = Math.PI / 2;
  tailRotor.add(t1, t2);
  g.add(tailRotor);

  g.userData.rotor = rotor;
  g.userData.tailRotor = tailRotor;
  return g;
}

export class Chopper {
  constructor(game, pos) {
    this.game = game;
    this.isChopper = true; // weapons.js uses this to bias missile locks
    this.name = 'CHOPPER';
    this.alive = true;
    this.maxHealth = this.health = 80;
    this.pos = pos.clone();
    this.vel = new THREE.Vector3();
    this.heading = 0;

    this.orbitAngle = Math.random() * Math.PI * 2;
    this.orbitDrift = (Math.random() < 0.5 ? -1 : 1) * (0.35 + Math.random() * 0.35); // rad/s — circles the target
    this.bobPhase = Math.random() * Math.PI * 2;
    this.fireTimer = BURST_GAP_MIN + Math.random() * BURST_GAP_VAR;
    this.burstLeft = 0;
    this.burstClock = 0;
    // engagement cycle — start by shadowing, so a fresh gunship announces
    // itself before it starts shooting
    this.phase = 'stalk';
    this.phaseT = PHASE.stalk.time[0] + Math.random() * PHASE.stalk.time[1];

    this._time = 0;
    this._roll = 0;
    this._pitch = 0;
    this._smokeClock = 0;

    this.mesh = buildChopperMesh();
    this.mesh.position.copy(this.pos);
    // worldLayer, NOT scene: a level swap or a mode switch tears down the
    // world layer, and a chopper parented to the scene survived both — that is
    // the helicopter sitting motionless on the grid at the start of a race.
    (game.worldLayer || game.scene).add(this.mesh);
  }

  update(dt) {
    if (!this.alive) return;
    const g = this.game;
    const player = g.player;
    this._time += dt;

    // rotors never stop
    const ud = this.mesh.userData;
    ud.rotor.rotation.y += dt * 26;
    ud.tailRotor.rotation.x += dt * 40;

    // ---- engagement cycle: stalk → attack run → break off → stalk …
    this.phaseT -= dt;
    if (this.phaseT <= 0) {
      this.phase = this.phase === 'run' ? 'break' : this.phase === 'break' ? 'stalk' : 'run';
      const ph = PHASE[this.phase];
      this.phaseT = ph.time[0] + Math.random() * ph.time[1];
      if (this.phase === 'run') {
        // commit: swing round to a fresh angle so runs come from different sides
        this.orbitAngle = Math.random() * Math.PI * 2;
        this.orbitDrift = (Math.random() < 0.5 ? -1 : 1) * (0.35 + Math.random() * 0.35);
        this.fireTimer = 0.35; // guns hot almost immediately once committed
      } else {
        this.burstLeft = 0;  // stop mid-burst when the run ends
      }
    }
    const phase = PHASE[this.phase];

    // ---- chase an orbit point off the player; the angle drifts so it circles
    this.orbitAngle += this.orbitDrift * dt;
    const px = player ? player.pos.x : this.pos.x;
    const pz = player ? player.pos.z : this.pos.z;
    const tx = px + Math.cos(this.orbitAngle) * phase.radius;
    const tz = pz + Math.sin(this.orbitAngle) * phase.radius;
    const dx = tx - this.pos.x, dz = tz - this.pos.z;
    const dist = Math.hypot(dx, dz);
    if (dist > 0.5) {
      this.vel.x += (dx / dist) * ACCEL * dt;
      this.vel.z += (dz / dist) * ACCEL * dt;
    }
    const damp = Math.min(1, 0.9 * dt); // aerodynamic drag
    this.vel.x -= this.vel.x * damp;
    this.vel.z -= this.vel.z * damp;
    const sp = Math.hypot(this.vel.x, this.vel.z);
    if (sp > MAX_SPEED) { this.vel.x *= MAX_SPEED / sp; this.vel.z *= MAX_SPEED / sp; }
    this.pos.x += this.vel.x * dt;
    this.pos.z += this.vel.z * dt;

    // ---- altitude: hover ~7 over the ground (or the player's deck) with a slow bob
    const terrain = g.track && g.track.terrainHeight ? g.track.terrainHeight(this.pos.x, this.pos.z) : 0;
    const deck = Math.max(terrain, player ? player.y : 0, 0);
    const targetY = deck + HOVER_ALT + Math.sin(this._time * 1.7 + this.bobPhase) * 0.8;
    this.pos.y += (targetY - this.pos.y) * Math.min(1, 2.5 * dt);

    // ---- face the player, bank into motion
    if (player) {
      const desired = Math.atan2(px - this.pos.x, pz - this.pos.z);
      let dh = desired - this.heading;
      while (dh > Math.PI) dh -= Math.PI * 2;
      while (dh < -Math.PI) dh += Math.PI * 2;
      this.heading += THREE.MathUtils.clamp(dh, -1.9 * dt, 1.9 * dt);
    }
    const sinH = Math.sin(this.heading), cosH = Math.cos(this.heading);
    const fwdV = this.vel.x * sinH + this.vel.z * cosH;  // body-frame velocity
    const sideV = this.vel.x * cosH - this.vel.z * sinH;
    const rollT = THREE.MathUtils.clamp(-sideV * 0.018, -0.4, 0.4);
    const pitchT = THREE.MathUtils.clamp(fwdV * 0.011, -0.35, 0.35); // nose-down surging forward
    this._roll += (rollT - this._roll) * Math.min(1, 5 * dt);
    this._pitch += (pitchT - this._pitch) * Math.min(1, 5 * dt);
    this.mesh.position.copy(this.pos);
    this.mesh.rotation.set(this._pitch, this.heading, this._roll, 'YXZ');

    // ---- battle damage smoke once it's hurting
    if (this.health < 40) {
      this._smokeClock -= dt;
      if (this._smokeClock <= 0) {
        this._smokeClock = 0.12;
        g.particles.damageSmoke(this.pos, 0.75);
      }
    }

    // ---- chin gun: a 4-round burst every 2.2–3.2 s while the player's in range
    if (this.burstLeft > 0) {
      this.burstClock -= dt;
      if (this.burstClock <= 0) {
        this.burstClock = 0.1; // rounds inside a burst
        this.burstLeft--;
        if (player && player.alive && g.weapons && g.weapons.fireChopperBullet) {
          // lead the shot: aim where the player will be when the round arrives
          const ddx = player.pos.x - this.pos.x, ddz = player.pos.z - this.pos.z;
          const flight = Math.sqrt(ddx * ddx + ddz * ddz + HOVER_ALT * HOVER_ALT) / 104; // matches bullet speed
          _target.set(
            player.pos.x + player.vel.x * flight,
            player.pos.y + 0.8,
            player.pos.z + player.vel.z * flight
          );
          g.weapons.fireChopperBullet(this, _target);
        }
      }
    } else {
      this.fireTimer -= dt;
      if (this.fireTimer <= 0) {
        this.fireTimer = BURST_GAP_MIN + Math.random() * BURST_GAP_VAR;
        // only an attack RUN opens fire — stalking and breaking off are quiet
        if (phase.fire && player && player.alive) {
          const pd = Math.hypot(px - this.pos.x, pz - this.pos.z);
          if (pd < GUN_RANGE) { this.burstLeft = 4; this.burstClock = 0; }
        }
      }
    }
  }

  damage(n) {
    if (!this.alive) return false;
    this.health -= n;
    if (this.health <= 0) {
      this.health = 0;
      this._die();
      return true;
    }
    return false;
  }

  _die() {
    const g = this.game;
    this.alive = false;
    g.particles.explosion(this.pos, true);
    g.particles.debris(this.pos, 6);
    if (g.flashLight) g.flashLight(this.pos);
    if (g.audio && g.audio.explosion) g.audio.explosion(true);
    if (g.hud && g.hud.feed) g.hud.feed('CHOPPER DOWN', 'good');
    g.shake = Math.min(1, (g.shake ?? 0) + 0.35);
    if (g.buzz) g.buzz(40);
    g.onChopperKill?.(this); // lead pays out the kill reward here
    // full mesh cleanup — the wreck doesn't linger
    this.mesh.parent?.remove(this.mesh);   // remove from wherever it actually is
    this.mesh.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
        else o.material.dispose();
      }
    });
  }
}
