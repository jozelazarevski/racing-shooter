// AI driver (§2.1): follow the baked line with speed-scaled look-ahead,
// proportional steering with yaw damping, braking-distance throttle control,
// a lateral avoid layer, and a stuck-recovery reset. Pure function of state —
// no randomness at tick time (determinism holds).

import * as THREE from 'three';
import type { VehicleController } from '../physics/vehicleController';
import type { InputState } from '../core/input';
import { LineNode, nearestNode } from './racingLine';
import aiData from '../data/ai.json';

const _fwd = new THREE.Vector3();

export interface DriverSpec { name: string; color: number; accent: number; speedScale: number; lane: number; }

export class AIDriver {
  lineIdx = 0;
  private stuckTimer = 0;
  private avoidBias = 0;
  private input: InputState = {
    throttle: 0, brake: 0, steer: 0, handbrake: false, nitro: false,
    fire: false, rearFire: false, lookBack: false, reset: false, usingGamepad: false,
  };

  constructor(
    public car: VehicleController,
    private line: LineNode[],
    public spec: DriverSpec,
  ) {}

  /** Compute this tick's inputs. `others` feed the avoid layer. */
  update(dt: number, others: VehicleController[], racing: boolean): InputState {
    const inp = this.input;
    const body = this.car.body;
    const t = body.translation();
    const n = this.line.length;
    this.lineIdx = nearestNode(this.line, t.x, t.z, this.lineIdx);

    if (!racing) {
      // grid hold: brake would mean reverse at standstill — pin with the handbrake
      inp.throttle = 0; inp.brake = 0; inp.steer = 0; inp.handbrake = true;
      return inp;
    }

    const rot = body.rotation();
    _fwd.set(0, 0, 1).applyQuaternion(new THREE.Quaternion(rot.x, rot.y, rot.z, rot.w));
    const heading = Math.atan2(_fwd.x, _fwd.z);
    const lv = body.linvel();
    const speed = Math.hypot(lv.x, lv.z);

    // ---- look-ahead point (spec: clamp(speed*0.35, 6, 30) meters) ----
    const look = THREE.MathUtils.clamp(speed * aiData.lookAheadFactor, aiData.lookAheadMin, aiData.lookAheadMax);
    let acc = 0, li = this.lineIdx;
    while (acc < look) {
      const a = this.line[li], b = this.line[(li + 1) % n];
      acc += Math.hypot(b.x - a.x, b.z - a.z);
      li = (li + 1) % n;
    }
    const node = this.line[li];

    // ---- avoid layer: another car close ahead in my lane -> bias sideways ----
    let avoidTarget = 0;
    for (const o of others) {
      if (o === this.car) continue;
      const ot = o.body.translation();
      const dx = ot.x - t.x, dz = ot.z - t.z;
      const along = dx * _fwd.x + dz * _fwd.z;
      if (along < 2 || along > aiData.avoidRange) continue;
      const across = dx * _fwd.z - dz * _fwd.x;
      if (Math.abs(across) < aiData.avoidLateral) {
        avoidTarget = across >= 0 ? -aiData.avoidOffset : aiData.avoidOffset;
        break;
      }
    }
    this.avoidBias += (avoidTarget - this.avoidBias) * Math.min(1, 5 * dt);

    // target point = look-ahead node + lane offset (+ avoid bias) along its normal
    const lane = this.spec.lane + this.avoidBias;
    const tx = node.x + node.dirZ * lane;
    const tz = node.z - node.dirX * lane;

    // ---- steering: heading error P-control + yaw-rate damping ----
    let err = Math.atan2(tx - t.x, tz - t.z) - heading;
    while (err > Math.PI) err -= Math.PI * 2;
    while (err < -Math.PI) err += Math.PI * 2;
    const yawRate = body.angvel().y;
    inp.steer = THREE.MathUtils.clamp(err * aiData.steerKp - yawRate * aiData.steerYawDamp, -1, 1);

    // ---- speed control against the baked profile ----
    const speedNode = this.line[(this.lineIdx + aiData.speedNodeAhead) % n];
    const vt = speedNode.targetSpeed * this.spec.speedScale;
    if (speed < vt - aiData.throttleBand) {
      inp.throttle = 1; inp.brake = 0;
    } else if (speed > vt + aiData.brakeBand) {
      inp.throttle = 0;
      inp.brake = THREE.MathUtils.clamp((speed - vt) * aiData.brakeGain, 0.2, 1);
    } else {
      inp.throttle = 0.35; inp.brake = 0;
    }
    inp.handbrake = false;

    // ---- stuck recovery: crawl for too long -> reset onto the line ----
    if (speed < aiData.stuckSpeed) this.stuckTimer += dt;
    else this.stuckTimer = 0;
    if (this.stuckTimer > aiData.stuckAfterSec) {
      this.stuckTimer = 0;
      this.placeOnLine(this.lineIdx);
    }
    return inp;
  }

  placeOnLine(idx: number) {
    const n = this.line.length;
    const node = this.line[idx % n];
    const h = Math.atan2(node.dirX, node.dirZ);
    this.car.body.setTranslation({ x: node.x + node.dirZ * this.spec.lane, y: node.y + 1.0, z: node.z - node.dirX * this.spec.lane }, true);
    this.car.body.setRotation({ x: 0, y: Math.sin(h / 2), z: 0, w: Math.cos(h / 2) }, true);
    this.car.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
    this.car.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
    this.lineIdx = idx % n;
  }
}
