// Car meshes (built from primitives), arcade physics, and rival AI.
import * as THREE from 'three';
import { ROAD_HALF } from './track.js';
import { numberPlateTexture } from './textures.js';

const WALL_LIMIT = ROAD_HALF + 0.55; // barrier clamp for car center
const SCORCH = new THREE.Color(0x1c1a18); // damage tint target

// ---------- roof sponsor decals ----------
// Small canvas-drawn sponsor plates (white rounded rect + fictional brand word),
// like the liveries on toy rally trucks. Cached per brand string.
const BRANDS = ['APEX', 'SCORP', 'RAIDER', 'ECO-PWR', 'GEARHD', 'VOLT'];
const decalCache = new Map();
function roofDecalTexture(text) {
  if (decalCache.has(text)) return decalCache.get(text);
  const c = document.createElement('canvas');
  c.width = 256; c.height = 128;
  const ctx = c.getContext('2d');
  // rounded white plate with dark outline (manual path for compatibility)
  const x = 8, y = 20, w = 240, h = 88, r = 24;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
  ctx.fillStyle = '#f4f1e8';
  ctx.fill();
  ctx.lineWidth = 7;
  ctx.strokeStyle = '#1c1a18';
  ctx.stroke();
  // red accent bar under the word
  ctx.fillStyle = '#d8342a';
  ctx.fillRect(x + 30, y + h - 24, w - 60, 9);
  // brand word, shrunk to fit
  ctx.fillStyle = '#1c1a18';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let size = 54;
  ctx.font = `900 ${size}px Arial, sans-serif`;
  while (ctx.measureText(text).width > w - 44 && size > 18) {
    size -= 4;
    ctx.font = `900 ${size}px Arial, sans-serif`;
  }
  ctx.fillText(text, 128, y + (h - 14) / 2);
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  decalCache.set(text, tex);
  return tex;
}

// ---------- mesh factory: the Voxel Racers collection ----------
// Blocky toy racers with liveries: brawler (off-road hero), crown (low-slung
// racer), sleek (compact hatch), dune (rally wagon), alpine (striped rally
// coupe), pit (black stock car).
export function buildVoxelRacer(spec) {
  const { body, accent, stripe = null, number = null, style = 'crown' } = spec;
  const g = new THREE.Group();
  const mat = (color, opts = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0.05, ...opts });
  const bodyMat = mat(body);
  const accentMat = mat(accent);
  const darkMat = mat(0x24201c);
  const glassMat = mat(0x121a22, { roughness: 0.15, metalness: 0.6 });
  const rimMat = mat(0xd8d2c2, { roughness: 0.4, metalness: 0.3 });
  const tireMat = mat(0x181614, { roughness: 0.95 });
  const headMat = new THREE.MeshBasicMaterial({ color: 0xfff6d8 });
  const tailMat = new THREE.MeshBasicMaterial({ color: 0xd82222 });

  const tall = style === 'brawler' || style === 'dune';
  const low = style === 'crown' || style === 'alpine' || style === 'pit';
  const wheelR = style === 'brawler' ? 0.85 : tall ? 0.76 : 0.62;
  const wheelY = wheelR;
  const baseY = wheelY + (low ? 0.18 : 0.34); // chassis floor height

  const box = (w, h, d, m, x, y, z, shadow = false) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    mesh.position.set(x, y, z);
    if (shadow) mesh.castShadow = true;
    g.add(mesh);
    return mesh;
  };

  // ---- chassis + body block ----
  const bodyLen = style === 'crown' || style === 'pit' ? 4.7 : style === 'sleek' ? 4.0 : 4.4;
  const bodyH = low ? 0.62 : 0.78;
  box(2.5, 0.4, bodyLen - 0.3, darkMat, 0, baseY, 0);                    // chassis
  const hull = box(2.6, bodyH, bodyLen, bodyMat, 0, baseY + bodyH / 2 + 0.12, 0, true);

  // ---- cabin with inset windows ----
  const cabW = 2.15, cabH = low ? 0.6 : 0.78;
  const cabZ = style === 'sleek' ? -0.55 : -0.15;
  const cabL = style === 'sleek' ? 1.7 : 2.0;
  const cabY = baseY + bodyH + 0.12 + cabH / 2;
  box(cabW, cabH, cabL, style === 'pit' ? bodyMat : accentMat, 0, cabY, cabZ, true);
  const windshield = box(cabW - 0.25, cabH - 0.14, 0.1, glassMat, 0, cabY + 0.02, cabZ + cabL / 2 + 0.01);
  windshield.rotation.x = low ? -0.30 : -0.16;
  windshield.position.z += low ? 0.16 : 0.08;
  box(cabW - 0.25, cabH - 0.18, 0.08, glassMat, 0, cabY, cabZ - cabL / 2 - 0.02);
  for (const s of [-1, 1]) box(0.06, cabH - 0.2, cabL - 0.5, glassMat, (cabW / 2) * s + 0.02 * s, cabY, cabZ);

  // ---- style-specific silhouettes ----
  if (style === 'brawler') {
    // roof rack with spare + twin rocket tubes, bull bar
    box(1.9, 0.12, 1.7, darkMat, 0, cabY + cabH / 2 + 0.1, cabZ);
    const spare = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.34, 10), tireMat);
    spare.position.set(-0.45, cabY + cabH / 2 + 0.42, cabZ - 0.2);
    g.add(spare);
    const tubeGeo = new THREE.CylinderGeometry(0.14, 0.14, 1.1, 8);
    tubeGeo.rotateX(Math.PI / 2);
    for (const s of [0.35, 0.75]) {
      const t = new THREE.Mesh(tubeGeo, darkMat);
      t.position.set(s, cabY + cabH / 2 + 0.35, cabZ + 0.1);
      g.add(t);
      const tip = new THREE.Mesh(new THREE.CircleGeometry(0.1, 8), new THREE.MeshBasicMaterial({ color: 0xffb52e }));
      tip.position.set(s, cabY + cabH / 2 + 0.35, cabZ + 0.66);
      g.add(tip);
    }
    box(2.2, 0.5, 0.16, darkMat, 0, baseY + 0.35, bodyLen / 2 + 0.12); // bull bar
  }
  if (style === 'crown') {
    box(2.3, 0.16, 0.6, accentMat, 0, baseY + bodyH + 0.2, -bodyLen / 2 + 0.35); // ducktail
  }
  if (style === 'pit') {
    box(2.45, 0.12, 0.55, darkMat, 0, baseY + bodyH + 0.26, -bodyLen / 2 + 0.3);
    for (const s of [-1, 1]) box(0.12, 0.3, 0.3, darkMat, 1.0 * s, baseY + bodyH + 0.1, -bodyLen / 2 + 0.3);
  }
  if (style === 'alpine') {
    // rally lamp pod on the nose
    for (const s of [-0.55, -0.2, 0.2, 0.55]) box(0.26, 0.26, 0.12, headMat, s, baseY + bodyH * 0.5 + 0.12, bodyLen / 2 - 0.1);
  }
  if (style === 'dune') {
    box(1.5, 0.22, 0.5, darkMat, 0, cabY + cabH / 2 + 0.11, cabZ + 0.55); // roof light pod
    for (const s of [-0.45, -0.15, 0.15, 0.45]) box(0.2, 0.14, 0.08, headMat, s, cabY + cabH / 2 + 0.13, cabZ + 0.82);
    for (const s of [-1, 1]) box(0.1, 0.24, bodyLen - 1.2, darkMat, 1.32 * s, baseY - 0.06, 0); // mud skirts
  }
  if (style === 'sleek') {
    box(2.0, 0.14, 0.5, accentMat, 0, cabY + cabH / 2 + 0.06, cabZ - cabL / 2 + 0.2); // hatch lip
  }

  // ---- livery: center stripes + door numbers ----
  if (stripe) {
    const sm = mat(stripe[0]);
    box(0.62, 0.05, bodyLen - 0.2, sm, 0, baseY + bodyH + 0.16, 0);
    box(0.62, 0.05, cabL - 0.2, sm, 0, cabY + cabH / 2 + 0.04, cabZ);
    if (stripe[1]) {
      const sm2 = mat(stripe[1]);
      for (const s of [-1, 1]) {
        box(0.2, 0.05, bodyLen - 0.2, sm2, 0.5 * s, baseY + bodyH + 0.16, 0);
        box(0.2, 0.05, cabL - 0.2, sm2, 0.5 * s, cabY + cabH / 2 + 0.04, cabZ);
      }
    }
  }
  if (number !== null) {
    const plateTex = numberPlateTexture(number);
    const plateMat = new THREE.MeshBasicMaterial({ map: plateTex, transparent: true });
    const plateGeo = new THREE.PlaneGeometry(0.78, 0.78);
    for (const s of [-1, 1]) {
      const p = new THREE.Mesh(plateGeo, plateMat);
      p.position.set((1.31) * s, baseY + bodyH / 2 + 0.14, 0.55);
      p.rotation.y = s * Math.PI / 2;
      g.add(p);
    }
  }

  // ---- bumpers, lights, grille ----
  box(2.55, 0.32, 0.35, darkMat, 0, baseY + 0.02, bodyLen / 2 + 0.05);
  box(2.55, 0.32, 0.35, darkMat, 0, baseY + 0.02, -bodyLen / 2 - 0.05);
  box(1.5, 0.24, 0.08, darkMat, 0, baseY + bodyH * 0.5 + 0.1, bodyLen / 2 + 0.02); // grille
  for (const s of [-1, 1]) {
    box(0.4, 0.24, 0.08, headMat, 0.92 * s, baseY + bodyH * 0.5 + 0.1, bodyLen / 2 + 0.04);
    box(0.4, 0.22, 0.08, tailMat, 0.92 * s, baseY + bodyH * 0.5 + 0.1, -bodyLen / 2 - 0.04);
  }

  // ---- fender flares on the tall cars ----
  if (tall) {
    for (const [x, z] of [[-1.3, 1.5], [1.3, 1.5], [-1.3, -1.5], [1.3, -1.5]]) {
      box(0.45, 0.26, wheelR * 2 + 0.4, darkMat, x, wheelY + wheelR * 0.72, z);
    }
  }

  // ---- roof sponsor decal (hood on the brawler — its roof carries the rack) ----
  const brand = spec.brand ?? BRANDS[Math.abs(number ?? 0) % BRANDS.length];
  const decal = new THREE.Mesh(
    new THREE.PlaneGeometry(1.7, 0.85),
    new THREE.MeshBasicMaterial({
      map: roofDecalTexture(brand), transparent: true,
      polygonOffset: true, polygonOffsetFactor: -2,
    })
  );
  decal.rotation.set(-Math.PI / 2, 0, Math.PI); // lie flat, word reads toward the nose
  if (style === 'brawler') decal.position.set(0, baseY + bodyH + 0.21, bodyLen / 2 - 1.05);
  else if (style === 'dune') decal.position.set(0, cabY + cabH / 2 + 0.075, cabZ - 0.3);
  else decal.position.set(0, cabY + cabH / 2 + 0.075, cabZ);
  g.add(decal);

  // ---- wheels ----
  const tireGeo = new THREE.CylinderGeometry(wheelR, wheelR, 0.55, 10);
  tireGeo.rotateZ(Math.PI / 2);
  const rimGeo = new THREE.CylinderGeometry(wheelR * 0.5, wheelR * 0.5, 0.57, 8);
  rimGeo.rotateZ(Math.PI / 2);
  g.userData.wheels = [];       // every wheel mesh, spun via rotation.x
  g.userData.frontWheels = [];  // z=+1.5 pair (+rims), yawed with steering input
  for (const [x, z] of [[-1.3, 1.5], [1.3, 1.5], [-1.3, -1.5], [1.3, -1.5]]) {
    const tire = new THREE.Mesh(tireGeo, tireMat);
    tire.position.set(x, wheelY, z);
    tire.castShadow = true;
    g.add(tire);
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.position.copy(tire.position);
    g.add(rim);
    g.userData.wheels.push(tire, rim);
    if (z > 0) {
      // yaw around Y first, then spin around the axle
      tire.rotation.order = 'YXZ';
      rim.rotation.order = 'YXZ';
      g.userData.frontWheels.push(tire, rim);
    }
  }

  // body material handle for damage scorch tinting
  g.userData.bodyMat = bodyMat;
  g.userData.baseBodyColor = new THREE.Color(body);
  return g;
}

// kept as a thin wrapper so older call sites keep working
export function buildCarMesh(spec) { return buildVoxelRacer(spec); }


// ---------- physics base ----------
export class Car {
  constructor(game, mesh, { maxSpeed = 52, accel = 34, grip = 5.2, steerRate = 2.5, driftLag = 0.22 } = {}) {
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
    this.driftLag = driftLag; // how much velocity lags the yaw at full slip (drift depth)

    this.health = 100;
    this.maxHealth = 100;
    this.alive = true;
    this.respawnTimer = 0;
    this.invuln = 0;
    this.boostTimer = 0;
    this.fireCooldown = 0;

    // vertical state for ramps/jumps
    this.y = 0;
    this.vy = 0;
    this.airborne = false;
    this.jumpPitch = 0;
    this._lastGY = 0;
    this._climbRate = 0;

    // race state
    this.trackIndex = 0;
    this.lap = 1;
    this.lateral = 0;
    this.finished = false;
    this.wallGrind = 0;

    // drift / feel state
    this.slip = 0;          // smoothed 0..1 grip-loss from cornering load
    this.landGrip = 0;      // loose-grip timer after landing a jump
    this.reverseTimer = 0;  // sustained-brake timer gating reverse gear
    this.visYaw = 0;        // smoothed visual slip-angle offset for the mesh
    this.steerVis = 0;      // smoothed steering input for front-wheel visuals
    this._dustSide = 1;
    this._smokeClock = 0;
    this._tintFrac = -1;    // last health fraction the scorch tint was computed for
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
    this.y = 0; this.vy = 0; this.airborne = false;
    this._lastGY = 0; this._climbRate = 0; this.jumpPitch = 0;
    this.slip = 0; this.landGrip = 0; this.reverseTimer = 0;
    this.visYaw = 0; this.steerVis = 0;
    this.syncMesh(0);
  }

  /** Core integrator. inputs: {throttle, brake, steer 1=left, drift, hold} */
  step(dt, inputs) {
    const fwd = this.forward;
    const side = new THREE.Vector3(fwd.z, 0, -fwd.x);
    let vf = this.vel.dot(fwd);
    let vl = this.vel.dot(side);
    const sliding = Math.abs(vl) > 5.5;

    const boosting = this.boostTimer > 0;
    if (boosting) this.boostTimer -= dt;
    const topSpeed = this.maxSpeed * (boosting ? 1.4 : 1);

    // ---- longitudinal ----
    if (inputs.hold) {
      // grid/pause hold: bleed speed to a stop, never push backwards
      vf -= vf * Math.min(1, 8 * dt);
      if (Math.abs(vf) < 0.35) vf = 0;
      this.reverseTimer = 0;
    } else {
      if (inputs.throttle > 0) {
        // punchier launch: up to +55% thrust below half speed, fading to 1x
        const punch = 1 + 0.55 * (1 - THREE.MathUtils.clamp(Math.abs(vf) / (this.maxSpeed * 0.5), 0, 1));
        vf += this.accel * punch * inputs.throttle * dt;
        this.reverseTimer = 0;
      }
      if (inputs.brake > 0.05) {
        if (vf > 0.5) {
          vf -= this.accel * 1.6 * inputs.brake * dt;
          this.reverseTimer = 0;
        } else {
          // reverse only engages from a deliberate, sustained brake near standstill
          if (inputs.brake >= 0.35 && Math.abs(vf) < 1) this.reverseTimer += dt;
          if (this.reverseTimer >= 0.25) vf -= this.accel * 0.5 * inputs.brake * dt;
          else vf -= vf * Math.min(1, 6 * dt); // settle to a stop instead of creeping
        }
      } else {
        this.reverseTimer = 0;
      }
    }
    vf -= vf * (sliding ? 0.40 : 0.55) * dt; // drag (eased while drifting: slides keep speed)
    vf = THREE.MathUtils.clamp(vf, -this.maxSpeed * 0.35, topSpeed);
    if (boosting) vf = Math.max(vf, this.maxSpeed * 1.05);

    // ---- lateral grip: cornering load breaks the rear loose ----
    const speedN = THREE.MathUtils.clamp(Math.abs(vf) / this.maxSpeed, 0, 1);
    const cornerLoad = Math.abs(inputs.steer) * speedN;
    let slipTarget = THREE.MathUtils.clamp((cornerLoad - 0.28) * 1.7, 0, 1);
    if (inputs.drift) slipTarget = 1; // handbrake forces a full slide
    const slipRate = slipTarget > this.slip ? 7 : 3.2; // break loose fast, recover smoothly
    this.slip += (slipTarget - this.slip) * Math.min(1, slipRate * dt);
    let grip = this.grip * (1 - 0.78 * this.slip);
    if (inputs.drift) grip = Math.min(grip, this.grip * 0.22);
    if (this.landGrip > 0) { this.landGrip -= dt; grip *= 0.4; } // loose for ~0.4s after landing
    const vlBefore = vl;
    vl -= vl * Math.min(1, grip * dt);
    // drift reward: convert a slice of the scrubbed-off slide back into forward speed
    if (this.slip > 0.4) vf = Math.min(topSpeed, vf + Math.abs(vlBefore - vl) * 0.35 * (vf >= 0 ? 1 : -1));

    // ---- steering: quick to come in, gentle taper at very high speed ----
    const sp = Math.abs(vf);
    const rise = THREE.MathUtils.clamp(sp / 13, 0, 1);
    const taper = 1 - 0.18 * THREE.MathUtils.clamp((sp - this.maxSpeed * 0.6) / (this.maxSpeed * 0.55), 0, 1);
    const authority = rise * taper * (1 + 0.35 * this.slip); // extra yaw mid-slide for counter-steer
    const dir = vf >= 0 ? 1 : -1;
    const dTheta = inputs.steer * this.steerRate * authority * dir * dt;
    this.heading += dTheta;
    // While gripped the velocity turns with the car (arcade rails). While slipping
    // it lags the yaw: part of the turn spills forward speed into lateral slide,
    // so hard cornering at speed visibly breaks the rear loose.
    const lag = this.slip * this.driftLag;
    if (lag > 0) {
      const nvf = vf + vl * dTheta * lag;
      vl -= vf * dTheta * lag;
      vf = nvf;
      // total speed can't inflate past ~top speed while sideways
      const vmax = topSpeed * 1.08;
      const vsq = vf * vf + vl * vl;
      if (vsq > vmax * vmax) {
        const s = vmax / Math.sqrt(vsq);
        vf *= s; vl *= s;
      }
    }

    // recompose velocity (fwd/side change with heading for a nice arcade feel)
    const nf = this.forward;
    const ns = new THREE.Vector3(nf.z, 0, -nf.x);
    this.vel.copy(nf).multiplyScalar(vf).addScaledVector(ns, vl);
    this.pos.addScaledVector(this.vel, dt);

    // ---- rolling dust from the rear wheels (cheap, distance-culled for AI) ----
    const gm = this.game;
    if (this.alive && !this.airborne && sp > 11 && gm.player) {
      const isPlayer = this === gm.player;
      if (isPlayer || this.pos.distanceToSquared(gm.player.pos) < 14400) {
        const density = isPlayer ? 0.5 + 0.45 * speedN : 0.28 + 0.25 * speedN;
        if (Math.random() < density) {
          this._dustSide = -this._dustSide;
          const wp = this.pos.clone().addScaledVector(nf, -1.55).addScaledVector(ns, this._dustSide * 1.25);
          wp.y = this.y + 0.1;
          gm.particles.dust(wp, speedN);
          if (isPlayer && speedN > 0.75 && Math.random() < 0.5) {
            const wp2 = this.pos.clone().addScaledVector(nf, -1.55).addScaledVector(ns, -this._dustSide * 1.25);
            wp2.y = this.y + 0.1;
            gm.particles.dust(wp2, speedN);
          }
        }
      }
    }

    // ---- damage smoke + scorch tint ----
    const frac = this.health / this.maxHealth;
    if (this.alive && frac < 0.55) {
      this._smokeClock -= dt;
      if (this._smokeClock <= 0) {
        const sev = 1 - frac / 0.55; // 0 at 55% health -> 1 at dead (fire kicks in below 28%)
        this._smokeClock = THREE.MathUtils.lerp(0.16, 0.05, sev);
        const ep = this.pos.clone().addScaledVector(nf, 1.5);
        ep.y = this.y + 1.1;
        gm.particles.damageSmoke(ep, sev);
      }
    }
    if (frac !== this._tintFrac) { this._tintFrac = frac; this._applyScorch(frac); }

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
      this.vel.multiplyScalar(0.96); // grinding the wall stings, but doesn't end the race
      this.lateral = Math.sign(this.lateral) * WALL_LIMIT;
      if (this.wallGrind <= 0) {
        this.wallGrind = 0.18;
        this.onWallHit(n, Math.abs(vn));
      }
    }

    // ---- vertical motion (ramps & jumps) ----
    const gY = t.groundHeightAt(this.trackIndex, this.lateral);
    if (this.airborne) {
      this.vy -= 26 * dt;
      this.y += this.vy * dt;
      if (this.y <= gY + 0.01) {
        this.y = gY;
        this.vy = 0;
        this.airborne = false;
        this._lastGY = gY;
        this.onLand();
      }
    } else {
      const drop = this._lastGY - gY;
      if (drop > 0.6 && this._climbRate > 1) {
        // launched off a ramp lip
        this.airborne = true;
        this.vy = this._climbRate;
        this.y += this.vy * dt;
      } else {
        this._climbRate = dt > 0 ? (gY - this._lastGY) / dt : 0;
        this.y = gY;
        this._lastGY = gY;
      }
    }
    this.pos.y = this.y;
    // nose up while climbing/launching, nose down while falling
    const pitchTarget = this.airborne || this._climbRate > 0.5
      ? THREE.MathUtils.clamp((this.airborne ? this.vy : this._climbRate) * 0.05, -0.4, 0.42)
      : 0;
    this.jumpPitch += (pitchTarget - this.jumpPitch) * Math.min(1, 8 * dt);

    if (this.fireCooldown > 0) this.fireCooldown -= dt;
    if (this.invuln > 0) this.invuln -= dt;
    this.syncMesh(dt, vl, inputs);
  }

  onLand() {
    this.landGrip = 0.4; // brief loose grip for a nice slidey landing
    if (Math.abs(this.speedAlong) > 12) {
      const side = new THREE.Vector3(this.forward.z, 0, -this.forward.x);
      for (const s of [-1, 1]) {
        const wp = this.pos.clone().addScaledVector(side, s * 1.2);
        this.game.particles.driftSmoke(wp);
        this.game.particles.driftSmoke(wp);
      }
      if (this === this.game.player) this.game.shake = Math.min(1, this.game.shake + 0.22);
    }
  }

  syncMesh(dt, vl = 0, inputs = null) {
    this.mesh.position.copy(this.pos);
    if (dt > 0) {
      // visual slip angle: the body yaws past the velocity direction while sliding
      const yawT = THREE.MathUtils.clamp(-vl * 0.02, -0.35, 0.35);
      this.visYaw += (yawT - this.visYaw) * Math.min(1, 9 * dt);
      const steerT = inputs ? inputs.steer : 0;
      this.steerVis += (steerT - this.steerVis) * Math.min(1, 10 * dt);
    }
    this.mesh.rotation.set(0, this.heading + this.visYaw, 0);
    // body lean
    const roll = THREE.MathUtils.clamp(-vl * 0.02, -0.18, 0.18);
    const pitch = THREE.MathUtils.clamp(-this.speedAlong * 0.0012, -0.05, 0.05);
    this.mesh.rotation.z = roll;
    this.mesh.rotation.x = pitch + this.jumpPitch;
    // spin wheels + steer the front pair
    if (dt > 0 && this.mesh.userData.wheels) {
      const spin = this.speedAlong * dt / 0.78;
      for (const w of this.mesh.userData.wheels) w.rotation.x += spin;
    }
    if (this.mesh.userData.frontWheels) {
      const sa = this.steerVis * 0.42;
      for (const w of this.mesh.userData.frontWheels) w.rotation.y = sa;
    }
    // invulnerability flicker
    this.mesh.visible = this.alive && (this.invuln <= 0 || Math.floor(this.invuln * 14) % 2 === 0);
  }

  /** Lerp the body paint toward charcoal as health drops (up to 55% at zero health). */
  _applyScorch(frac) {
    const ud = this.mesh.userData;
    if (!ud.bodyMat || !ud.baseBodyColor) return;
    const t = THREE.MathUtils.clamp(1 - frac, 0, 1) * 0.55;
    ud.bodyMat.color.copy(ud.baseBodyColor).lerp(SCORCH, t);
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
    if (amount >= 15) this.game.particles.debris(this.pos, 2 + (Math.random() < 0.5 ? 1 : 0));
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
    this._tintFrac = 1;
    this._applyScorch(1); // fresh paint job with the fresh hull
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
// The Voxel Racers collection — rival lineup
const AI_COLORS = [
  { name: 'CROWN', style: 'crown', body: 0x2440b8, accent: 0x1a2c8a, stripe: [0xf2f0e8, 0xd8342a], number: 77, brand: 'VOLT' },
  { name: 'SLEEK', style: 'sleek', body: 0xf2c81e, accent: 0xe8b83a, number: 3, brand: 'ECO-PWR' },
  { name: 'DUNE', style: 'dune', body: 0xdce8f0, accent: 0x4a9ad8, stripe: [0x4a9ad8], number: 12, brand: 'RAIDER' },
  { name: 'ALPINE', style: 'alpine', body: 0xf2f0e8, accent: 0xe8e2d4, stripe: [0x2f9e44, 0xd8342a], number: 4, brand: 'GEARHD' },
  { name: 'PIT-99', style: 'pit', body: 0x1c1a18, accent: 0x2a2724, stripe: [0xe8b83a], number: 99, brand: 'SCORP' },
];

export class EnemyCar extends Car {
  constructor(game, slot) {
    const spec = AI_COLORS[slot % AI_COLORS.length];
    super(game, buildCarMesh(spec), {
      maxSpeed: 50 + slot * 1.4 + Math.random() * 1.6, // ~50..57 across the grid
      accel: 34 + slot * 1.1 + Math.random() * 2,      // ~34..40
      grip: 5.6,
      steerRate: 2.85,
      driftLag: 0.15, // they slide a little, but hold the racing line
    });
    this.spec = spec;
    this.name = spec.name;
    this.maxHealth = this.health = 70;
    this.respawnDelay = 5;
    this.lane = THREE.MathUtils.randFloatSpread(8);
    this.laneTimer = 3 + Math.random() * 4;
    this.aggression = 0.5 + Math.random() * 0.5;
    this.glowColor = new THREE.Color(0x9a938a); // exhaust smoke tint
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

    // deliberately line up for a boost pad when one is coming up in reach
    let lane = this.lane;
    if (this.boostTimer <= 0.3 && t.boostPads) {
      for (const pad of t.boostPads) {
        const di = (pad.index - this.trackIndex + t.N) % t.N;
        if (di > 4 && di < 60) {
          lane = THREE.MathUtils.lerp(this.lane, pad.lateral, 0.85);
          break;
        }
      }
    }

    // steer toward a lookahead point on the centerline
    const look = Math.floor(10 + Math.abs(this.speedAlong) * 0.55);
    const ti = (this.trackIndex + look) % t.N;
    const target = t.pointAt(ti, lane);
    const desired = Math.atan2(target.x - this.pos.x, target.z - this.pos.z);
    let dh = desired - this.heading;
    while (dh > Math.PI) dh -= Math.PI * 2;
    while (dh < -Math.PI) dh += Math.PI * 2;
    const steer = THREE.MathUtils.clamp(dh * 2.6, -1, 1);

    // slow down for corners ahead — but carry real speed and let the tail slide
    let maxCurv = 0;
    for (let k = 0; k < 60; k += 6) maxCurv = Math.max(maxCurv, t.curvature[(this.trackIndex + k) % t.N]);
    let targetSpeed = Math.min(this.maxSpeed, 18 / Math.max(0.06, maxCurv * 15));
    // rubber-banding vs player: ramp to +25% when far behind, -10% when far ahead
    const gap = g.player.progress - this.progress;
    if (gap > 0.02) targetSpeed *= 1 + 0.25 * THREE.MathUtils.clamp((gap - 0.02) / 0.08, 0, 1);
    else if (gap < -0.12) targetSpeed *= 0.90;

    const throttle = this.speedAlong < targetSpeed ? 1 : 0;
    const brake = this.speedAlong > targetSpeed * 1.15 ? 0.7 : 0;
    this.step(dt, { throttle, brake, steer, drift: false });
    if (this.checkLap(prevIndex) === true && this.lap > g.lapsTotal && !this.finished) this.finished = true;

    // slide smoke when the AI breaks loose (only near the player, keep it cheap)
    const sideV = Math.abs(this.vel.dot(new THREE.Vector3(this.forward.z, 0, -this.forward.x)));
    if (sideV > 7 && !this.airborne && Math.random() < 0.35
        && this.pos.distanceToSquared(g.player.pos) < 14400) {
      const back2 = this.forward.multiplyScalar(-1);
      g.particles.driftSmoke(this.pos.clone().addScaledVector(back2, 1.6));
    }

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
    super(game, buildCarMesh({
      name: 'BRAWLER', style: 'brawler',
      body: 0xff8c1a, accent: 0xe86a10, stripe: [0x241d16], number: 1, brand: 'APEX',
    }), {
      maxSpeed: 58, accel: 38, grip: 5.0, steerRate: 3.0, driftLag: 0.25,
    });
    this.name = 'YOU';
    this.respawnDelay = 2.5;
    this.heat = 0;        // 0..1
    this.overheated = false;
    this.missiles = 3;
    this.maxMissiles = 5;
    this.mines = 2;
    this.maxMines = 4;
    this.nitro = 0.3;       // 0..1, charged by drifting, kills and pickups
    this.shockCooldown = 0; // seconds until the shockwave is ready
    this.glowColor = new THREE.Color(0x9a938a); // exhaust smoke tint
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
      : { throttle: 0, brake: 0, steer: 0, drift: false, hold: true }; // grid hold — no reverse creep
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
    // mine
    if (controlsLive && input.justPressed('KeyX')) {
      if (this.mines > 0) {
        this.mines--;
        g.weapons.dropMine(this);
        g.hud.feed('MINE DEPLOYED', 'info');
      } else g.hud.feed('NO MINES', 'bad');
    }
    // shockwave
    if (controlsLive && input.justPressed('KeyQ')) {
      if (this.shockCooldown <= 0) {
        this.shockCooldown = 12;
        g.weapons.fireShockwave(this);
      } else g.hud.feed(`SHOCK IN ${Math.ceil(this.shockCooldown)}s`, 'bad');
    }
    if (this.shockCooldown > 0) this.shockCooldown -= dt;
    // nitro: passive trickle + fire on demand
    this.nitro = Math.min(1, this.nitro + dt * 0.02);
    if (controlsLive && input.justPressed('KeyF')) {
      if (this.nitro >= 0.25) {
        this.boostTimer = Math.max(this.boostTimer, this.nitro * 3.2);
        this.nitro = 0;
        g.hud.feed('NITRO!', 'info');
        g.audio.boost();
      } else g.hud.feed('NITRO LOW', 'bad');
    }

    // exhaust + drift smoke
    const back = this.forward.multiplyScalar(-1);
    const tail = this.pos.clone().addScaledVector(back, 2.4);
    if (inputs.throttle > 0 || this.boostTimer > 0)
      g.particles.exhaust(tail, back, this.glowColor, this.boostTimer > 0);
    const side = new THREE.Vector3(this.forward.z, 0, -this.forward.x);
    const slide = Math.abs(this.vel.dot(side));
    if (slide > 6 && !this.airborne) {
      // drifting is the fast way to bank nitro
      this.nitro = Math.min(1, this.nitro + dt * 0.22 * Math.min(1, slide / 14));
      for (const s of [-1, 1]) {
        const wp = this.pos.clone().addScaledVector(back, 1.6).addScaledVector(side, s * 1.1);
        g.particles.driftSmoke(wp);
        if (slide > 10 && Math.random() < 0.5) g.particles.dust(wp, 1);
      }
    }
  }

  destroy(attacker) {
    super.destroy();
    this.game.onPlayerDestroyed(attacker);
  }
}
