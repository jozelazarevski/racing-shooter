/* Input: keyboard, gamepad, and the v1 touch controls brought across intact.
 *
 * §14.2 still holds — `sample()` is called from inside the fixed physics step,
 * never from the render loop. Reading input once per frame and reusing it
 * across a variable number of physics steps is how a 30 fps machine ends up
 * steering twice as hard per step as a 120 fps one.
 *
 * Everything below the keyboard section is a port of v1's `input.js`, numbers
 * included. Those numbers are not arbitrary — each was set in response to a
 * specific complaint about how the game felt on a phone, and re-deriving them
 * from scratch would mean re-earning the same complaints:
 *
 *   R = 62 px      52 px of travel meant a thumb twitch was half a turn of
 *                  the wheel.
 *   DEAD = 0.14    a resting thumb must not steer.
 *   expo curve     linear travel spends the whole useful range — the small
 *                  corrections you make on a straight — in the first few
 *                  millimetres of thumb. That is what "way too sensitive"
 *                  actually feels like.
 *   joySens        player-set, read live, so dragging the slider changes the
 *                  feel without restarting anything.
 *   steerOnly      the left pad steers and NOTHING else, because in two-thumb
 *                  the right thumb has the pedals. Without it the same drag
 *                  that turns the car also lifts off — exactly the coupling
 *                  two thumbs exist to remove.
 */
import type { DriverInput } from '../physics/vehicle.ts';

export type Scheme = 'pad' | 'two-thumb';

const R = 62;        // knob travel radius, px
const DEAD = 0.14;   // deadzone fraction

export class Input {
  private keys = new Set<string>();
  private analog = { steer: 0, throttle: 0, brake: 0 };

  /** Player-set, 0.5–1.8, 1 = the tuned default. Scales the steer axis
   *  directly: below 1 the thumb travels further for the same lock. */
  joySens = 1;
  /** The pad steers only; the pedals live on buttons. */
  steerOnly = false;
  /** Throttle held open so both thumbs are free to steer. */
  autoThrottle = false;

  private shiftUpQueued = false;
  private shiftDownQueued = false;
  private resetQueued = false;
  private cameraQueued = false;

  /** Smoothed steering, so a keyboard gives something like an analogue axis.
   *  Kept here rather than in the vehicle because it is an INPUT property; the
   *  steering rack rate in the vehicle is a separate, physical limit. */
  private steerSmoothed = 0;

  constructor() {
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
    addEventListener('blur', () => { this.keys.clear(); this.rest(); });
  }

  private rest(): void {
    this.analog.steer = 0;
    this.analog.throttle = 0;
    this.analog.brake = 0;
  }

  setScheme(scheme: Scheme): void {
    this.steerOnly = scheme === 'two-thumb';
    this.autoThrottle = scheme === 'two-thumb';
    this.rest();
  }

  /** Any element with data-key behaves like that keyboard key. */
  bindTouchButtons(root: ParentNode = document): void {
    for (const el of Array.from(root.querySelectorAll<HTMLElement>('[data-key]'))) {
      const code = el.dataset.key!;
      const down = (e: Event) => {
        e.preventDefault();
        this.keys.add(code);
        if (code === 'KeyC') this.cameraQueued = true;
        if (code === 'KeyR') this.resetQueued = true;
        el.classList.add('active');
      };
      const up = (e: Event) => {
        e.preventDefault();
        this.keys.delete(code);
        el.classList.remove('active');
      };
      el.addEventListener('touchstart', down, { passive: false });
      el.addEventListener('touchend', up, { passive: false });
      el.addEventListener('touchcancel', up, { passive: false });
      el.addEventListener('mousedown', down);
      el.addEventListener('mouseup', up);
      el.addEventListener('mouseleave', () => { this.keys.delete(code); el.classList.remove('active'); });
    }
  }

  /**
   * The driving pad. Drag anywhere in the zone: left/right steers, up is
   * throttle, down is brake. The base re-centres wherever the thumb lands, so
   * it works blind and in either orientation.
   */
  bindJoystick(zone: HTMLElement, base: HTMLElement, knob: HTMLElement): void {
    let activeId: number | string | null = null;
    let cx = 0;
    let cy = 0;

    const setKnob = (dx: number, dy: number) => {
      knob.style.transform = `translate(calc(${dx}px - 50%), calc(${dy}px - 50%))`;
    };
    const restPad = () => {
      const r = zone.getBoundingClientRect();
      base.style.left = `${Math.min(120, r.width * 0.45)}px`;
      base.style.top = `${r.height - 110}px`;
      base.classList.remove('live');
      setKnob(0, 0);
    };

    const shape = (v: number): number => {
      const a = Math.abs(v);
      if (a < DEAD) return 0;
      return Math.sign(v) * Math.min(1, (a - DEAD) / (1 - DEAD));
    };
    // Cubic blend: full lock at full deflection, but the middle of the stick
    // stays gentle. Half travel is ~30% steer, not 50%.
    const shapeSteer = (v: number): number => {
      const s = shape(v);
      const a = Math.abs(s);
      const curved = 0.42 * a + 0.58 * a * a * a;
      return Math.sign(s) * Math.min(1, curved * this.joySens);
    };

    const start = (x: number, y: number, id: number | string) => {
      const r = zone.getBoundingClientRect();
      activeId = id;
      cx = x;
      cy = y;
      base.style.left = `${x - r.left}px`;
      base.style.top = `${y - r.top}px`;
      base.classList.add('live');
      setKnob(0, 0);
    };

    const move = (x: number, y: number) => {
      let dx = x - cx;
      let dy = y - cy;
      if (this.steerOnly) {
        // Horizontal only: the knob slides along a rail, so a thumb that
        // wanders up or down mid-corner cannot touch the throttle.
        dx = Math.max(-R, Math.min(R, dx));
        setKnob(dx, 0);
        this.analog.steer = shapeSteer(dx / R);
        return;
      }
      const d = Math.hypot(dx, dy) || 1;
      const cl = Math.min(d, R);
      dx = (dx / d) * cl;
      dy = (dy / d) * cl;
      setKnob(dx, dy);
      this.analog.steer = shapeSteer(dx / R);
      this.analog.throttle = Math.max(0, shape(-dy / R));
      this.analog.brake = Math.max(0, shape(dy / R));
    };

    const end = () => {
      activeId = null;
      this.rest();
      restPad();
    };

    zone.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (activeId !== null) return;
      const t = e.changedTouches[0]!;
      start(t.clientX, t.clientY, t.identifier);
    }, { passive: false });
    zone.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (const t of Array.from(e.changedTouches)) if (t.identifier === activeId) move(t.clientX, t.clientY);
    }, { passive: false });
    const endH = (e: TouchEvent) => {
      for (const t of Array.from(e.changedTouches)) if (t.identifier === activeId) end();
    };
    zone.addEventListener('touchend', endH);
    zone.addEventListener('touchcancel', endH);

    // Mouse fallback, so the pad can be exercised on a desktop.
    zone.addEventListener('mousedown', (e) => {
      start(e.clientX, e.clientY, 'mouse');
      const mm = (ev: MouseEvent) => move(ev.clientX, ev.clientY);
      const mu = () => {
        end();
        removeEventListener('mousemove', mm);
        removeEventListener('mouseup', mu);
      };
      addEventListener('mousemove', mm);
      addEventListener('mouseup', mu);
    });

    restPad();
    addEventListener('resize', restPad);
  }

  private gamepadAxis(index: number): number {
    for (const p of navigator.getGamepads?.() ?? []) {
      const v = p?.axes[index] ?? 0;
      if (Math.abs(v) > 0.08) return v;   // deadzone
    }
    return 0;
  }

  private gamepadButton(index: number): number {
    for (const p of navigator.getGamepads?.() ?? []) {
      const b = p?.buttons[index];
      if (b && b.value > 0.03) return b.value;
    }
    return 0;
  }

  /** Called from inside the fixed physics step. */
  sample(dt: number): DriverInput {
    const k = (code: string) => (this.keys.has(code) ? 1 : 0);

    const digital = k('ArrowRight') + k('KeyD') - k('ArrowLeft') - k('KeyA');
    const steerTarget = Math.max(-1, Math.min(1, digital + this.analog.steer + this.gamepadAxis(0)));

    // The pad is already an analogue axis with its own curve, so it goes
    // straight through; only the digital sources need ramping into one.
    const analogueHeld = Math.abs(this.analog.steer) > 0 || Math.abs(this.gamepadAxis(0)) > 0;
    if (analogueHeld) {
      this.steerSmoothed = steerTarget;
    } else {
      // Release snaps back faster than turn-in, which is how a real rack
      // unloads.
      const rate = Math.abs(steerTarget) > Math.abs(this.steerSmoothed) ? 3.2 : 6.0;
      this.steerSmoothed += Math.max(-rate * dt, Math.min(rate * dt, steerTarget - this.steerSmoothed));
    }

    const brake = Math.min(1, k('ArrowDown') + k('KeyS') + this.analog.brake + this.gamepadButton(6));
    // Two-thumb holds the throttle open so both thumbs can steer — but a brake
    // press must still close it, or the car cannot be slowed at all.
    const auto = this.autoThrottle && brake < 0.5 ? 1 : 0;
    const throttle = Math.min(1, k('ArrowUp') + k('KeyW') + this.analog.throttle + this.gamepadButton(7) + auto);

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
