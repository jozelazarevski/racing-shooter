// Chase camera: position spring + velocity-led look-at (§12.2), with a
// nitro FOV push (§1.5) and a look-back flip.

import * as THREE from 'three';
import carData from '../data/car.json';

const BASE_FOV = 68;

export class ChaseCamera {
  camera: THREE.PerspectiveCamera;
  private pos = new THREE.Vector3(0, 5, -10);
  private look = new THREE.Vector3();
  private _desired = new THREE.Vector3();
  private _back = new THREE.Vector3();
  private _lead = new THREE.Vector3();
  private fovCurrent = BASE_FOV;

  constructor() {
    this.camera = new THREE.PerspectiveCamera(BASE_FOV, innerWidth / innerHeight, 0.3, 1500);
    addEventListener('resize', () => {
      this.camera.aspect = innerWidth / innerHeight;
      this.camera.updateProjectionMatrix();
    });
  }

  update(
    dt: number,
    carPos: THREE.Vector3,
    carQuat: THREE.Quaternion,
    vel: THREE.Vector3,
    speedKmh: number,
    nitro: boolean,
    lookBack: boolean,
  ) {
    this._back.set(0, 0, lookBack ? 1 : -1).applyQuaternion(carQuat);
    this._back.y = 0;
    if (this._back.lengthSq() < 1e-4) this._back.set(0, 0, -1);
    this._back.normalize();

    const dist = 7.2 + speedKmh * 0.012;
    this._desired.copy(carPos).addScaledVector(this._back, dist);
    this._desired.y = carPos.y + 2.9;

    const k = 1 - Math.exp(-dt * 5.2); // critically-damped-ish spring
    this.pos.lerp(this._desired, k);

    this._lead.copy(vel);
    this._lead.y = 0;
    this._lead.clampLength(0, 8);
    this.look.copy(carPos).add(this._lead.multiplyScalar(0.7));
    this.look.y = carPos.y + 1.1;

    // speed + nitro FOV (§7.2 speed sensation)
    const speedFov = THREE.MathUtils.lerp(BASE_FOV, 82, Math.min(1, speedKmh / 220));
    const target = speedFov + (nitro ? carData.nitro.fovBoostDeg : 0);
    this.fovCurrent += (target - this.fovCurrent) * (1 - Math.exp(-dt * 4));
    this.camera.fov = this.fovCurrent;
    this.camera.updateProjectionMatrix();

    this.camera.position.copy(this.pos);
    this.camera.lookAt(this.look);
  }
}
