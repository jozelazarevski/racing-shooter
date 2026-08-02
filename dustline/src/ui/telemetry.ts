// Debug telemetry overlay (§12.3): FPS, sim rate, speed, per-wheel slip
// angles + suspension compression bars, drift/air flags. Built BEFORE tuning.

import type { VehicleController } from '../physics/vehicleController';
import type { GameLoop } from '../core/loop';

export class Telemetry {
  private el: HTMLDivElement;
  private rows: HTMLDivElement[] = [];
  private timer = 0;

  constructor() {
    this.el = document.createElement('div');
    this.el.id = 'telemetry';
    this.el.innerHTML = '<div class="t-head">DUSTLINE M1 — telemetry</div>';
    for (let i = 0; i < 8; i++) {
      const r = document.createElement('div');
      r.className = 't-row';
      this.el.appendChild(r);
      this.rows.push(r);
    }
    document.body.appendChild(this.el);
  }

  update(dt: number, loop: GameLoop, car: VehicleController) {
    this.timer -= dt;
    if (this.timer > 0) return;
    this.timer = 0.1; // 10 Hz refresh

    const bar = (f: number, n = 14) => {
      const k = Math.round(Math.max(0, Math.min(1, f)) * n);
      return '█'.repeat(k) + '░'.repeat(n - k);
    };
    const names = ['FL', 'FR', 'RL', 'RR'];
    this.rows[0].textContent = `fps ${loop.fps.toFixed(0).padStart(3)}   sim ${loop.simHz.toFixed(0)} Hz`;
    this.rows[1].textContent = `speed ${car.speedKmh.toFixed(0).padStart(3)} km/h  ${car.drifting ? 'DRIFT' : '     '}  ${car.airborne ? 'AIR' : '   '}  ${car.nitroActive ? 'NITRO' : ''}`;
    for (let i = 0; i < 4; i++) {
      const w = car.wheels[i];
      this.rows[2 + i].textContent =
        `${names[i]} ${w.grounded ? '●' : '○'} ${(w.surface ?? '').padEnd(6)} slip ${w.slipAngleDeg.toFixed(1).padStart(6)}°  susp ${bar(w.compression)}`;
    }
    this.rows[6].textContent = 'WASD drive · SPACE handbrake · SHIFT nitro · R reset · C look back';
    this.rows[7].textContent = 'gamepad: sticks + triggers · X handbrake · A nitro';
  }
}
