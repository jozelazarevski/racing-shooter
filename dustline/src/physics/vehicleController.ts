// Raycast vehicle (§1.1): Rapier rigid body chassis + 4 wheel raycasts.
// Tire forces via simplified Pacejka (§1.2) with a friction circle,
// arcade assists layered on top (§1.3). All tunables from data/car.json.

import * as THREE from 'three';
import type RAPIER_API from '@dimforge/rapier3d-compat';
import carData from '../data/car.json';
import surfaces from '../data/surfaces.json';
import type { InputState } from '../core/input';

type Rapier = typeof RAPIER_API;

const KMH = 3.6;

export interface WheelState {
  grounded: boolean;
  compression: number;      // 0..1 of full range
  compressionM: number;     // meters
  slipAngleDeg: number;
  suspForce: number;
  steer: number;            // current steer angle (rad), fronts only
  worldContact: THREE.Vector3;
  spin: number;             // visual wheel roll angle
}

export class VehicleController {
  body: RAPIER_API.RigidBody;
  wheels: WheelState[] = [];
  speedKmh = 0;
  drifting = false;
  airborne = false;
  nitroActive = false;

  // interpolation snapshots
  prevPos = new THREE.Vector3();
  currPos = new THREE.Vector3();
  prevQuat = new THREE.Quaternion();
  currQuat = new THREE.Quaternion();

  private steerCurrent = 0;
  private upsideDownTimer = 0;
  private prevCompression: number[] = [0, 0, 0, 0];
  private spawn: THREE.Vector3;

  // scratch (zero allocations in the tick loop — §7.3)
  private _q = new THREE.Quaternion();
  private _up = new THREE.Vector3();
  private _fwd = new THREE.Vector3();
  private _right = new THREE.Vector3();
  private _mount = new THREE.Vector3();
  private _rayDir = new THREE.Vector3();
  private _vel = new THREE.Vector3();
  private _angvel = new THREE.Vector3();
  private _r = new THREE.Vector3();
  private _pv = new THREE.Vector3();
  private _n = new THREE.Vector3();
  private _tFwd = new THREE.Vector3();
  private _tSide = new THREE.Vector3();
  private _force = new THREE.Vector3();
  private _tmp = new THREE.Vector3();
  private _ray: RAPIER_API.Ray;

  constructor(
    private RAPIER: Rapier,
    private world: RAPIER_API.World,
    spawn: THREE.Vector3,
  ) {
    this.spawn = spawn.clone();
    const c = carData.chassis;
    const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(spawn.x, spawn.y, spawn.z)
      .setLinearDamping(c.linearDamping)
      .setAngularDamping(c.angularDamping)
      .setCanSleep(false);
    this.body = world.createRigidBody(bodyDesc);
    const col = RAPIER.ColliderDesc.cuboid(c.halfExtents[0], c.halfExtents[1], c.halfExtents[2])
      .setMass(c.mass)
      .setFriction(0.35)
      .setRestitution(0.15);
    world.createCollider(col, this.body);
    // lower the center of mass — stability is a feature, not a cheat
    this.body.setAdditionalMassProperties(
      0,
      { x: 0, y: c.comOffsetY, z: 0 },
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 0, z: 0, w: 1 },
      true,
    );

    for (let i = 0; i < 4; i++) {
      this.wheels.push({
        grounded: false, compression: 0, compressionM: 0, slipAngleDeg: 0,
        suspForce: 0, steer: 0, worldContact: new THREE.Vector3(), spin: 0,
      });
    }
    this._ray = new RAPIER.Ray({ x: 0, y: 0, z: 0 }, { x: 0, y: -1, z: 0 });
    this.snapshot();
    this.prevPos.copy(this.currPos);
    this.prevQuat.copy(this.currQuat);
  }

  private snapshot() {
    const t = this.body.translation();
    const r = this.body.rotation();
    this.currPos.set(t.x, t.y, t.z);
    this.currQuat.set(r.x, r.y, r.z, r.w);
  }

  /** Suspension spring constants derived from the spec formulas (§1.1). */
  private get suspK(): number {
    const s = carData.suspension;
    return (carData.chassis.mass * 9.81) / (4 * s.sagRatio * s.restLength);
  }
  private get suspC(): number {
    return 2 * Math.sqrt(this.suspK * (carData.chassis.mass / 4)) * carData.suspension.dampingRatio;
  }

  reset(at?: THREE.Vector3) {
    const p = at ?? this.spawn;
    this.body.setTranslation({ x: p.x, y: p.y + 1.2, z: p.z }, true);
    this.body.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
    this.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
    this.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
    this.upsideDownTimer = 0;
  }

  fixedUpdate(dt: number, input: InputState) {
    const RAPIER = this.RAPIER;
    this.prevPos.copy(this.currPos);
    this.prevQuat.copy(this.currQuat);

    if (input.reset) this.reset();

    const rot = this.body.rotation();
    this._q.set(rot.x, rot.y, rot.z, rot.w);
    this._up.set(0, 1, 0).applyQuaternion(this._q);
    this._fwd.set(0, 0, 1).applyQuaternion(this._q);
    this._right.set(1, 0, 0).applyQuaternion(this._q);
    const lv = this.body.linvel();
    this._vel.set(lv.x, lv.y, lv.z);
    const av = this.body.angvel();
    this._angvel.set(av.x, av.y, av.z);
    const pos = this.body.translation();
    const speed = this._vel.length();
    const fwdSpeed = this._vel.dot(this._fwd);
    this.speedKmh = speed * KMH;

    // ---- steering with speed falloff (§1.3) ----
    const st = carData.steering;
    const falloff = Math.min(1, this.speedKmh / st.falloffTopSpeedKmh);
    const maxSteer = THREE.MathUtils.degToRad(
      THREE.MathUtils.lerp(st.maxAngleDegLow, st.maxAngleDegHigh, falloff),
    );
    const target = input.steer * maxSteer;
    const rate = Math.abs(target) > Math.abs(this.steerCurrent) ? st.rateUp : st.rateDown;
    this.steerCurrent += THREE.MathUtils.clamp(target - this.steerCurrent, -rate * dt, rate * dt);

    // ---- engine / brake split ----
    const eng = carData.engine;
    this.nitroActive = input.nitro && input.throttle > 0;
    const engineForce = eng.force * (this.nitroActive ? carData.nitro.engineForceScale : 1);
    const reversing = input.brake > 0 && fwdSpeed < 0.5;

    // ---- per-wheel raycast + forces (§1.1 / §1.2) ----
    const susp = carData.suspension;
    const tire = carData.tire;
    const surf = surfaces.tarmac; // M1 test track is all tarmac; splatmap in M2
    const rayLen = susp.restLength + susp.maxTravel + tire.wheelRadius;
    let groundedCount = 0;
    this.drifting = false;

    for (let i = 0; i < 4; i++) {
      const w = this.wheels[i];
      const m = susp.mounts[i];
      const isFront = i < 2;
      const isRear = !isFront;

      this._mount.set(m[0], m[1], m[2]).applyQuaternion(this._q);
      this._mount.x += pos.x; this._mount.y += pos.y; this._mount.z += pos.z;
      this._rayDir.copy(this._up).multiplyScalar(-1);

      this._ray.origin.x = this._mount.x; this._ray.origin.y = this._mount.y; this._ray.origin.z = this._mount.z;
      this._ray.dir.x = this._rayDir.x; this._ray.dir.y = this._rayDir.y; this._ray.dir.z = this._rayDir.z;
      const hit = this.world.castRay(this._ray, rayLen, true, undefined, undefined, undefined, this.body);

      w.steer = isFront ? this.steerCurrent : 0;

      if (!hit) {
        w.grounded = false;
        w.compression = 0;
        w.compressionM = 0;
        w.suspForce = 0;
        w.slipAngleDeg = 0;
        this.prevCompression[i] = 0;
        continue;
      }
      groundedCount++;
      w.grounded = true;
      const toi = hit.toi;
      w.worldContact.copy(this._mount).addScaledVector(this._rayDir, toi);

      // -- suspension spring-damper --
      const compression = rayLen - toi;
      const compVel = (compression - this.prevCompression[i]) / dt;
      this.prevCompression[i] = compression;
      w.compressionM = compression;
      w.compression = THREE.MathUtils.clamp(compression / (susp.restLength + susp.maxTravel), 0, 1);
      let fz = this.suspK * compression + this.suspC * compVel;
      fz = Math.max(0, fz);
      w.suspForce = fz;
      this._force.copy(this._up).multiplyScalar(fz * dt);
      this.body.applyImpulseAtPoint(this._force, this._mount, true);

      // -- contact patch frame (steered on fronts) --
      this._n.set(0, 1, 0); // flat test world; M2 reads the hit normal
      this._tFwd.copy(this._fwd);
      if (isFront && w.steer !== 0) this._tFwd.applyAxisAngle(this._up, w.steer);
      this._tFwd.addScaledVector(this._n, -this._tFwd.dot(this._n)).normalize();
      this._tSide.crossVectors(this._n, this._tFwd).normalize();

      // velocity of chassis at contact point
      this._r.copy(w.worldContact).sub(this._tmp.set(pos.x, pos.y, pos.z));
      this._pv.crossVectors(this._angvel, this._r).add(this._vel);
      const vF = this._pv.dot(this._tFwd);
      const vS = this._pv.dot(this._tSide);

      // -- lateral: slip angle -> magic-formula-lite --
      const slipAngle = Math.atan2(vS, Math.max(Math.abs(vF), 1.5));
      w.slipAngleDeg = THREE.MathUtils.radToDeg(slipAngle);
      let muLat = surf.muLat;
      if (isRear && input.handbrake) muLat *= carData.assists.driftRearMuScale; // drift assist
      const latCurve = tire.lat;
      const fade = THREE.MathUtils.clamp(speed / tire.lowSpeedFade, 0, 1);
      let fy = -muLat * fz * latCurve.D * Math.sin(latCurve.C * Math.atan(latCurve.B * slipAngle)) * fade;
      // parking stability: below the fade band, damp lateral crawl directly
      if (fade < 1) fy += -vS * (carData.chassis.mass / 4) * 6 * (1 - fade);

      // -- longitudinal: drive + brake + rolling resistance --
      const driveShare = isFront ? eng.awdFrontShare / 2 : (1 - eng.awdFrontShare) / 2;
      let fx = 0;
      if (reversing) {
        fx -= eng.reverseForce * input.brake * driveShare * 2;
      } else {
        fx += input.throttle * engineForce * driveShare;
        if (input.brake > 0) fx -= Math.sign(vF) * eng.brakeForce * input.brake * 0.25;
      }
      if (input.handbrake && isRear) fx -= Math.sign(vF) * eng.brakeForce * 0.2;
      fx -= Math.sign(vF) * surf.rollingResistance * fz;
      const fxMax = surf.muLong * fz * tire.long.D;
      fx = THREE.MathUtils.clamp(fx, -fxMax, fxMax);

      // -- friction circle (§1.2): one rule, believable drifts --
      const capF = ((surf.muLong + muLat) / 2) * fz;
      const total = Math.sqrt(fx * fx + fy * fy);
      if (total > capF && total > 1e-4) {
        const s = capF / total;
        fx *= s;
        fy *= s;
      }

      this._force.copy(this._tFwd).multiplyScalar(fx * dt).addScaledVector(this._tSide, fy * dt);
      this.body.applyImpulseAtPoint(this._force, this._mount, true);

      // visual spin
      w.spin += (vF / tire.wheelRadius) * dt;

      if (Math.abs(w.slipAngleDeg) > carData.assists.driftSlipAngleDeg && speed > 6) this.drifting = true;
    }

    this.airborne = groundedCount === 0;

    // ---- assists (§1.3) ----
    const A = carData.assists;

    // drift yaw assist: handbrake + steering pulls the nose around
    if (input.handbrake && Math.abs(input.steer) > 0.1 && groundedCount > 0 && Math.abs(fwdSpeed) > 4) {
      this.body.applyTorqueImpulse(
        { x: 0, y: input.steer * A.driftYawTorque * dt * Math.min(1, speed / 15), z: 0 }, true);
    }

    // yaw stability: bleed rotation so slides are recoverable with counter-
    // steer (nearly off while the handbrake is down — that's the drift)
    if (groundedCount > 0) {
      const yawDamp = input.handbrake ? A.yawDampingDrift : A.yawDamping;
      this.body.applyTorqueImpulse({ x: 0, y: -this._angvel.y * yawDamp * dt, z: 0 }, true);
    }

    // fake downforce: v² planted feel
    if (groundedCount > 0) {
      this._force.set(0, -A.downforceCoeff * speed * speed * dt, 0);
      this.body.applyImpulse(this._force, true);
    }

    // aero drag (top speed shaping)
    this._force.copy(this._vel).multiplyScalar(-eng.dragCoeff * speed * dt);
    this.body.applyImpulse(this._force, true);

    // air control: steerable rally jumps
    if (this.airborne) {
      const pitchIn = input.throttle - input.brake;
      this.body.applyTorqueImpulse({
        x: this._right.x * pitchIn * A.airPitchTorque * dt,
        y: input.steer * A.airYawTorque * dt,
        z: this._right.z * pitchIn * A.airPitchTorque * dt,
      }, true);
    }

    // anti-flip: soft righting torque past 60° roll, auto-flip after 2s inverted
    const uprightness = this._up.dot(this._tmp.set(0, 1, 0));
    const rollDeg = THREE.MathUtils.radToDeg(Math.acos(THREE.MathUtils.clamp(uprightness, -1, 1)));
    if (rollDeg > A.antiFlipRollDeg) {
      this._tmp.crossVectors(this._up, this._n.set(0, 1, 0));
      if (this._tmp.lengthSq() > 1e-6) {
        this._tmp.normalize().multiplyScalar(A.antiFlipTorque * dt);
        this.body.applyTorqueImpulse(this._tmp, true);
      }
    }
    if (uprightness < -0.2) {
      this.upsideDownTimer += dt;
      if (this.upsideDownTimer >= A.autoFlipAfterSec) {
        const t = this.body.translation();
        const heading = Math.atan2(this._fwd.x, this._fwd.z);
        this._q.setFromAxisAngle(this._tmp.set(0, 1, 0), heading);
        this.body.setTranslation({ x: t.x, y: t.y + 1.4, z: t.z }, true);
        this.body.setRotation({ x: this._q.x, y: this._q.y, z: this._q.z, w: this._q.w }, true);
        this.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
        this.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
        this.upsideDownTimer = 0;
      }
    } else {
      this.upsideDownTimer = 0;
    }

    this.snapshot();
  }
}
