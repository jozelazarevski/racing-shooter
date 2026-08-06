/* Input, sampled at physics rate.
 *
 * §14.2: "Input is sampled and timestamped at physics rate, not at render
 * rate." So this class holds raw device state and `sample()` is called from
 * inside the fixed step, never from the render loop. Reading input per frame
 * and reusing it across a variable number of physics steps is how a 30 fps
 * machine ends up steering twice as hard per step as a 120 fps one.
 */
import type { DriverInput } from '../physics/vehicle.ts';

export class Input {
  private keys = new Set<string>();
  private touchSteer = 0;
  private touchThrottle = 0;
  private touchBrake = 0;
  private shiftUpQueued = false;
  private shiftDownQueued = false;
  resetQueued = false;
  cameraQueued = false;

  /** Smoothed steering, so a keyboard gives something like an analogue axis.
   *  Kept here rather than in the vehicle because it is an INPUT property; the
   *  steering rack rate in the vehicle is a separate, physical limit. */
  private steerSmoothed = 0;

  constructor(target: HTMLElement) {
    addEventListener('keydown', (e) => {
      if (e.repeat) return;
      this.keys.add(e.code);
      if (e.code === 'KeyE') this.shiftUpQueued = true;
      if (e.code === 'KeyQ') this.shiftDownQueued = true;
      if (e.code === 'KeyR') this.resetQueued = true;
      if (e.code === 'KeyC') this.cameraQueued = true;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    });
    addEventListener('keyup', (e) => this.keys.delete(e.code));
    addEventListener('blur', () => this.keys.clear());

    // Touch: left half steers, right half is throttle (upper) / brake (lower).
    const touch = (e: TouchEvent) => {
      e.preventDefault();
      this.touchSteer = 0;
      this.touchThrottle = 0;
      this.touchBrake = 0;
      const w = innerWidth;
      const h = innerHeight;
      for (const t of Array.from(e.touches)) {
        if (t.clientX < w / 2) {
          this.touchSteer = Math.max(-1, Math.min(1, ((t.clientX - w / 4) / (w / 4)) * 1.3));
        } else if (t.clientY < h * 0.55) {
          this.touchThrottle = 1;
        } else {
          this.touchBrake = 1;
        }
      }
    };
    target.addEventListener('touchstart', touch, { passive: false });
    target.addEventListener('touchmove', touch, { passive: false });
    target.addEventListener('touchend', touch, { passive: false });
  }

  private gamepadAxis(index: number): number {
    const pads = navigator.getGamepads?.() ?? [];
    for (const p of pads) {
      if (!p) continue;
      const v = p.axes[index] ?? 0;
      if (Math.abs(v) > 0.08) return v;   // deadzone
    }
    return 0;
  }

  private gamepadButton(index: number): number {
    const pads = navigator.getGamepads?.() ?? [];
    for (const p of pads) if (p?.buttons[index]) return p.buttons[index].value;
    return 0;
  }

  /** Called from inside the fixed physics step. */
  sample(dt: number): DriverInput {
    const k = (code: string) => (this.keys.has(code) ? 1 : 0);

    let steerTarget = k('ArrowRight') + k('KeyD') - k('ArrowLeft') - k('KeyA');
    steerTarget = Math.max(-1, Math.min(1, steerTarget + this.touchSteer + this.gamepadAxis(0)));
    // Ramp toward the target; release snaps back faster than turn-in, which is
    // how a real rack unloads.
    const rate = Math.abs(steerTarget) > Math.abs(this.steerSmoothed) ? 3.2 : 6.0;
    this.steerSmoothed += Math.max(-rate * dt, Math.min(rate * dt, steerTarget - this.steerSmoothed));

    const throttle = Math.min(1, k('ArrowUp') + k('KeyW') + this.touchThrottle + this.gamepadButton(7));
    const brake = Math.min(1, k('ArrowDown') + k('KeyS') + this.touchBrake + this.gamepadButton(6));

    const out: DriverInput = {
      steer: this.steerSmoothed,
      throttle,
      brake,
      handbrake: this.keys.has('Space') || this.gamepadButton(0) > 0.5,
      shiftUp: this.shiftUpQueued,
      shiftDown: this.shiftDownQueued,
    };
    this.shiftUpQueued = false;
    this.shiftDownQueued = false;
    return out;
  }

  takeReset(): boolean {
    const v = this.resetQueued;
    this.resetQueued = false;
    return v;
  }

  takeCamera(): boolean {
    const v = this.cameraQueued;
    this.cameraQueued = false;
    return v;
  }
}
