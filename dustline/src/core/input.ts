// Keyboard + Gamepad input with the §3.3 mapping.
// Deadzone 0.12 with cubic response; analog triggers on pads.

const DEADZONE = 0.12;

function shaped(v: number): number {
  const a = Math.abs(v);
  if (a < DEADZONE) return 0;
  const t = (a - DEADZONE) / (1 - DEADZONE);
  return Math.sign(v) * t * t * t; // cubic response curve
}

export interface InputState {
  throttle: number;   // 0..1
  brake: number;      // 0..1
  steer: number;      // -1 (right) .. 1 (left)
  handbrake: boolean;
  nitro: boolean;
  fire: boolean;
  rearFire: boolean;
  lookBack: boolean;
  reset: boolean;     // edge-triggered
  usingGamepad: boolean;
}

export class Input {
  private keys = new Set<string>();
  private resetQueued = false;
  state: InputState = {
    throttle: 0, brake: 0, steer: 0, handbrake: false, nitro: false,
    fire: false, rearFire: false, lookBack: false, reset: false, usingGamepad: false,
  };

  constructor() {
    addEventListener('keydown', (e) => {
      if (['KeyW', 'KeyS', 'KeyA', 'KeyD', 'Space', 'ShiftLeft', 'ShiftRight'].includes(e.code)) e.preventDefault();
      if (e.code === 'KeyR' && !this.keys.has('KeyR')) this.resetQueued = true;
      this.keys.add(e.code);
    });
    addEventListener('keyup', (e) => this.keys.delete(e.code));
    addEventListener('mousedown', (e) => {
      if (e.button === 0) this.keys.add('MouseL');
      if (e.button === 2) this.keys.add('MouseR');
    });
    addEventListener('mouseup', (e) => {
      if (e.button === 0) this.keys.delete('MouseL');
      if (e.button === 2) this.keys.delete('MouseR');
    });
    addEventListener('contextmenu', (e) => e.preventDefault());
    addEventListener('blur', () => this.keys.clear());
  }

  /** Poll once per fixed tick. Gamepad (if any) wins over keyboard. */
  poll() {
    const s = this.state;
    const k = this.keys;
    // keyboard baseline
    s.throttle = k.has('KeyW') || k.has('ArrowUp') ? 1 : 0;
    s.brake = k.has('KeyS') || k.has('ArrowDown') ? 1 : 0;
    s.steer = (k.has('KeyA') || k.has('ArrowLeft') ? 1 : 0) - (k.has('KeyD') || k.has('ArrowRight') ? 1 : 0);
    s.handbrake = k.has('Space');
    s.nitro = k.has('ShiftLeft') || k.has('ShiftRight');
    s.fire = k.has('MouseL') || k.has('KeyJ');
    s.rearFire = k.has('MouseR') || k.has('KeyK');
    s.lookBack = k.has('KeyC');
    s.usingGamepad = false;

    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gp = pads && pads[0];
    if (gp && gp.connected) {
      const stickX = shaped(gp.axes[0] ?? 0);
      const rt = gp.buttons[7]?.value ?? 0; // RT analog
      const lt = gp.buttons[6]?.value ?? 0; // LT analog
      if (Math.abs(stickX) > 0 || rt > 0.02 || lt > 0.02 || gp.buttons.some((b) => b.pressed)) {
        s.usingGamepad = true;
        s.steer = -stickX;
        s.throttle = rt;
        s.brake = lt;
        s.handbrake = gp.buttons[2]?.pressed ?? false; // X/Square
        s.nitro = gp.buttons[0]?.pressed ?? false;     // A/Cross
        s.fire = gp.buttons[5]?.pressed ?? false;      // RB
        s.rearFire = gp.buttons[4]?.pressed ?? false;  // LB
        s.lookBack = (gp.axes[3] ?? 0) > 0.6;          // right stick down
        if (gp.buttons[12]?.pressed) this.resetQueued = true; // D-pad up
      }
    }

    s.reset = this.resetQueued;
    this.resetQueued = false;
  }
}
