// Per-surface wheel FX (§1.2 table): dust plumes on gravel, mud spray, snow
// spray, sand clouds, tire smoke on tarmac slip. One instanced quad pool,
// zero per-frame allocations.

import * as THREE from 'three';
import type { SurfaceId } from '../tracks/terrain';

const MAX = 700;

interface FXDef { color: THREE.Color; size: number; up: number; life: number; onSlipOnly: boolean; }

const FX: Partial<Record<SurfaceId, FXDef>> = {
  tarmac: { color: new THREE.Color(0x9a9a9a), size: 0.9, up: 1.6, life: 0.8, onSlipOnly: true },
  gravel: { color: new THREE.Color(0xc2a878), size: 1.4, up: 2.2, life: 1.1, onSlipOnly: false },
  mud: { color: new THREE.Color(0x5e4326), size: 1.1, up: 3.4, life: 0.9, onSlipOnly: false },
  snow: { color: new THREE.Color(0xf2f6fa), size: 1.3, up: 2.8, life: 1.0, onSlipOnly: false },
  sand: { color: new THREE.Color(0xdcc27e), size: 1.5, up: 2.0, life: 1.2, onSlipOnly: false },
  // ice: none, per the spec table
};

export class WheelFX {
  private mesh: THREE.InstancedMesh;
  private pos = new Float32Array(MAX * 3);
  private vel = new Float32Array(MAX * 3);
  private life = new Float32Array(MAX);
  private maxLife = new Float32Array(MAX);
  private size = new Float32Array(MAX);
  private head = 0;
  alive = 0;
  private _m = new THREE.Matrix4();
  private _q = new THREE.Quaternion();
  private _s = new THREE.Vector3();
  private _p = new THREE.Vector3();
  private _c = new THREE.Color();

  constructor(scene: THREE.Scene, private camera: THREE.Camera) {
    const geo = new THREE.PlaneGeometry(1, 1);
    // soft radial puff texture, generated once
    const cv = document.createElement('canvas');
    cv.width = cv.height = 64;
    const ctx = cv.getContext('2d')!;
    const grad = ctx.createRadialGradient(32, 32, 4, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,255,255,0.9)');
    grad.addColorStop(0.55, 'rgba(255,255,255,0.42)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    const tex = new THREE.CanvasTexture(cv);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffffff, map: tex, transparent: true, opacity: 0.6, depthWrite: false,
    });
    this.mesh = new THREE.InstancedMesh(geo, mat, MAX);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    this._m.makeScale(0, 0, 0);
    for (let i = 0; i < MAX; i++) {
      this.mesh.setMatrixAt(i, this._m);
      this.mesh.setColorAt(i, this._c.setRGB(1, 1, 1));
    }
    scene.add(this.mesh);
  }

  /** Called per wheel per frame from the game — spawns by surface + slip. */
  wheelKick(surface: SurfaceId, slipping: boolean, x: number, y: number, z: number, vx: number, vz: number, speed: number) {
    const fx = FX[surface];
    if (!fx) return;
    if (fx.onSlipOnly && !slipping) return;
    if (speed < 5) return;
    const rate = slipping ? 0.85 : Math.min(0.5, speed / 90);
    if (Math.random() > rate) return;
    const i = this.head;
    this.head = (this.head + 1) % MAX;
    const o = i * 3;
    this.pos[o] = x + (Math.random() - 0.5) * 0.5;
    this.pos[o + 1] = y + 0.15;
    this.pos[o + 2] = z + (Math.random() - 0.5) * 0.5;
    this.vel[o] = -vx * 0.25 + (Math.random() - 0.5) * 2;
    this.vel[o + 1] = fx.up * (0.7 + Math.random() * 0.6);
    this.vel[o + 2] = -vz * 0.25 + (Math.random() - 0.5) * 2;
    this.life[i] = this.maxLife[i] = fx.life * (0.7 + Math.random() * 0.6);
    this.size[i] = fx.size * (0.7 + Math.random() * 0.7);
    this.mesh.setColorAt(i, fx.color);
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }

  update(dt: number) {
    this.camera.getWorldQuaternion(this._q); // billboards face the camera
    let count = 0;
    for (let i = 0; i < MAX; i++) {
      if (this.life[i] <= 0) continue;
      this.life[i] -= dt;
      const o = i * 3;
      if (this.life[i] <= 0) {
        this._m.makeScale(0, 0, 0);
        this.mesh.setMatrixAt(i, this._m);
        continue;
      }
      count++;
      this.vel[o + 1] -= 2.2 * dt;                    // light gravity
      this.vel[o] *= 1 - 1.4 * dt;                    // drag
      this.vel[o + 2] *= 1 - 1.4 * dt;
      this.pos[o] += this.vel[o] * dt;
      this.pos[o + 1] += this.vel[o + 1] * dt;
      this.pos[o + 2] += this.vel[o + 2] * dt;
      const f = this.life[i] / this.maxLife[i];
      const s = this.size[i] * (1.6 - f * 0.9);       // grow as they fade
      this._p.set(this.pos[o], this.pos[o + 1], this.pos[o + 2]);
      this._s.set(s, s, s);
      this._m.compose(this._p, this._q, this._s);
      this.mesh.setMatrixAt(i, this._m);
    }
    this.alive = count;
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}
