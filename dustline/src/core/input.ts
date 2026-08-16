// Keyboard + Gamepad + TOUCH input with the §3.3 mapping.
// Deadzone 0.12 with cubic response; analog triggers on pads.
//
// THE TOUCH HALF IS PORTED FROM IGNITE RALLY (`src/input.js`, 176 lines).
// dustline had no touch input at all: on a phone the car did not move. v1
// already solved this and then TUNED it, and the tuning is the part that is
// expensive to re-derive — so it is copied rather than reinvented, comments
// and constants intact. Nothing here imports from v1; this is a copy.
//
// WHAT CAME ACROSS VERBATIM — the numbers and the behaviour they produce:
//
//   - `bindJoystick` in full: the floating base that re-centres where the thumb
//     lands, `JOY_R = 62` px of travel, the `JOY_DEAD = 0.14` deadzone, the
//     `joyShape` rescale, the `shapeSteer` cubic blend (`0.42·a + 0.58·a³`),
//     the `steerOnly` horizontal rail, the resting-base placement
//     (`min(120, width·0.45)`, `height − 110`), and the mouse fallback.
//   - `bindTouchButtons`: any element carrying `data-key` behaves exactly like
//     that keyboard key, including the `.active` class the CSS styles.
//   - `passive: false` on `touchstart`/`touchmove` only — those two call
//     `preventDefault()`, which a passive listener may not do, and that call is
//     what stops a steering drag from scrolling the page. `touchend` and
//     `touchcancel` do not need it and v1 does not pass it.
//   - `joySens` and `steerOnly` as live public fields, read on every move, so
//     changing them mid-drive changes the feel without re-binding anything.
//
// FIVE DELIBERATE CHANGES:
//
//   1. TYPES, AND ONE SHARED KEY-PRESS PATH. v1 keeps an edge-triggered
//      `pressed` set that every consumer polls; dustline edge-triggers exactly
//      one thing (`KeyR` → `resetQueued`). So instead of importing v1's set,
//      the keydown listener and the touch buttons both go through `press()` —
//      one place that knows what a press means, which is why the on-screen
//      RESET button works at all.
//   2. NO NEW FIELD ON `InputState`. v1 exposes `get steer()` / `get throttle()`
//      getters; dustline publishes a plain `InputState` that `poll()` fills.
//      `main.ts` and `ai/driver.ts` both build `InputState` object literals, so
//      adding a required field to the interface would fail their typecheck —
//      and neither file is ours to edit. The touch axes merge into the existing
//      fields instead, with the same arithmetic v1's getters use: `max` for the
//      pedals, clamped sum for steer.
//   3. THE MERGE IS AN IDENTITY WHEN NOTHING IS TOUCHED. `analog` is all zeros
//      until a thumb lands, and `max(x, 0) === x`, `clamp(x + 0) === x` for the
//      keyboard's own −1..1 range. That is the reason the merge sits between
//      the keyboard baseline and the gamepad block rather than replacing
//      either: desktop keyboard and pad behaviour is bit-identical to before.
//   4. `autoThrottle` AND `bothSteer` ARE NOT PORTED, deliberately. They belong
//      to v1's OTHER phone scheme — two steer BUTTONS with the throttle held
//      open, where "squeezing both steer buttons IS the brake" because both
//      thumbs are already on steer buttons and there is no third one free.
//      dustline's phone layout is a steering pad, not steer buttons, so that
//      gesture has nothing on screen that could produce it; shipping the getter
//      would be a control that cannot be operated. Written down here rather
//      than silently dropped: if the two-button scheme is ever built, this is
//      the note that says where its brake went.
//   5. THE `data-key` CODES ARE dustline'S, NOT v1'S. v1's DRIFT button sends
//      `ShiftLeft` because shift drifts in v1. Here the handbrake — which is
//      what makes the car drift (M2) — is `Space`, and `ShiftLeft` is nitro.
//      The plumbing is v1's; the mapping is this game's.

const DEADZONE = 0.12;

function shaped(v: number): number {
  const a = Math.abs(v);
  if (a < DEADZONE) return 0;
  const t = (a - DEADZONE) / (1 - DEADZONE);
  return Math.sign(v) * t * t * t; // cubic response curve
}

// v1 `src/input.js:60-62`, verbatim including the reason:
// "52px of travel from centre to full lock meant a thumb twitch was half a
//  turn of the wheel. More travel = more room to be precise."
const JOY_R = 62;      // knob travel radius, px
const JOY_DEAD = 0.14; // deadzone as a fraction of JOY_R

/** v1's `shape` (`src/input.js:72`): drop the deadzone, then rescale so the
 *  first movement past it reads 0 and full travel still reads 1. */
function joyShape(v: number): number {
  const a = Math.abs(v);
  if (a < JOY_DEAD) return 0;
  return Math.sign(v) * Math.min(1, (a - JOY_DEAD) / (1 - JOY_DEAD));
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

  /** Virtual-joystick axes, written by `bindJoystick`, merged in `poll()`.
   *  All zero unless a thumb is down, which is what keeps desktop unchanged. */
  readonly analog = { steer: 0, throttle: 0, brake: 0 };

  /** Player-set joystick sensitivity, 0.5–1.8, 1 = the tuned default. It
   *  scales the steer axis directly: below 1 the thumb travels further for the
   *  same lock, above 1 it takes less. Read live on every move event, so
   *  changing it changes the feel without restarting anything. (v1:11) */
  joySens = 1;

  /** TWO-THUMB scheme: the left pad steers and NOTHING ELSE, because the right
   *  thumb has the pedals. Without this the same drag that turns the car also
   *  lifts off, which is exactly the coupling two thumbs exist to remove.
   *  (v1:12-15.) `ui/touch.ts` owns the toggle and shows the pedals with it. */
  steerOnly = false;

  /** Re-place the resting joystick base — call after a resize or an
   *  orientation flip, when the zone's bounds have moved. Null until
   *  `bindJoystick` has run. (v1:143) */
  resetJoystick: (() => void) | null = null;

  state: InputState = {
    throttle: 0, brake: 0, steer: 0, handbrake: false, nitro: false,
    fire: false, rearFire: false, lookBack: false, reset: false, usingGamepad: false,
  };

  constructor() {
    addEventListener('keydown', (e) => {
      if (['KeyW', 'KeyS', 'KeyA', 'KeyD', 'Space', 'ShiftLeft', 'ShiftRight'].includes(e.code)) e.preventDefault();
      this.press(e.code);
    });
    addEventListener('keyup', (e) => this.release(e.code));
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

  /** The one place that knows what pressing a key means, so a screen button and
   *  a keyboard key cannot drift apart. `reset` is edge-triggered: holding the
   *  button down must queue exactly one reset, not one per frame. */
  private press(code: string) {
    if (code === 'KeyR' && !this.keys.has('KeyR')) this.resetQueued = true;
    this.keys.add(code);
  }

  private release(code: string) {
    this.keys.delete(code);
  }

  /** Wire on-screen buttons: any element with `data-key` acts like that
   *  keyboard key. Ported from v1 `src/input.js:30`. */
  bindTouchButtons(root: ParentNode = document) {
    for (const btn of Array.from(root.querySelectorAll<HTMLElement>('[data-key]'))) {
      const code = btn.dataset.key;
      if (!code) continue;
      const down = (e: Event) => {
        e.preventDefault();
        this.press(code);
        btn.classList.add('active');
      };
      const up = (e: Event) => {
        e.preventDefault();
        this.release(code);
        btn.classList.remove('active');
      };
      // passive:false because both handlers call preventDefault() — without it
      // a press on a button also scrolls, and the browser ignores the call.
      btn.addEventListener('touchstart', down, { passive: false });
      btn.addEventListener('touchend', up, { passive: false });
      btn.addEventListener('touchcancel', up, { passive: false });
      // mouse fallback so the buttons also work with a pointer
      btn.addEventListener('mousedown', down);
      btn.addEventListener('mouseup', up);
      btn.addEventListener('mouseleave', () => { this.release(code); btn.classList.remove('active'); });
    }
  }

  /** Steering gets an expo curve on top of the deadzone rescale. Linear travel
   *  spends the whole useful range — the small corrections you actually make on
   *  a straight — in the first few millimetres of thumb, which is what "way too
   *  sensitive" feels like. The cubic blend keeps full lock at full deflection
   *  but makes the middle of the stick gentle: half travel is now ~30% steer,
   *  not 50%. Sensitivity multiplies the curve, then clamps — turning it up
   *  reaches full lock sooner, turning it down stretches the travel out.
   *  (v1 `src/input.js:77-89`.)
   *
   *  MEASURED, because v1's "~30%" is ambiguous about which half it means and
   *  a ported curve should be checkable: at half of the PHYSICAL travel
   *  (31 px of 62) this returns 0.218 — the deadzone eats the first 14% before
   *  the curve sees anything. v1's ~30% is half of the post-deadzone
   *  deflection, s = 0.5 → 0.283. Full travel is 1.000 and three-quarters is
   *  0.505. All of them far under the 0.5-at-half a linear axis would give,
   *  which is the whole reason the curve is here. */
  private shapeSteer(v: number): number {
    const s = joyShape(v);
    const a = Math.abs(s);
    const curved = 0.42 * a + 0.58 * a * a * a;
    return Math.sign(s) * Math.min(1, curved * (this.joySens ?? 1));
  }

  /**
   * Driving pad: drag anywhere in the zone — left/right steers, up is throttle,
   * down is brake/reverse. The base re-centres where the thumb lands, so it
   * works blind in either orientation. With `steerOnly` the knob slides along a
   * horizontal rail and the pedals live under the other thumb.
   * Ported from v1 `src/input.js:58`.
   */
  bindJoystick(zone: HTMLElement, base: HTMLElement, knob: HTMLElement) {
    let activeId: number | 'mouse' | null = null;
    let cx = 0, cy = 0;

    const setKnob = (dx: number, dy: number) => {
      knob.style.transform = `translate(calc(${dx}px - 50%), calc(${dy}px - 50%))`;
    };
    const rest = () => {
      const r = zone.getBoundingClientRect();
      base.style.left = Math.min(120, r.width * 0.45) + 'px';
      base.style.top = (r.height - 110) + 'px';
      base.classList.remove('live');
      setKnob(0, 0);
    };
    const start = (x: number, y: number, id: number | 'mouse') => {
      const r = zone.getBoundingClientRect();
      activeId = id; cx = x; cy = y;
      base.style.left = (x - r.left) + 'px';
      base.style.top = (y - r.top) + 'px';
      base.classList.add('live');
      setKnob(0, 0);
    };
    const move = (x: number, y: number) => {
      let dx = x - cx, dy = y - cy;
      if (this.steerOnly) {
        // horizontal only: the knob slides along a rail, and a thumb that
        // wanders up or down while cornering cannot touch the throttle
        dx = Math.max(-JOY_R, Math.min(JOY_R, dx));
        setKnob(dx, 0);
        this.analog.steer = -this.shapeSteer(dx / JOY_R);
        return;
      }
      const d = Math.hypot(dx, dy) || 1;
      const cl = Math.min(d, JOY_R);
      dx = (dx / d) * cl; dy = (dy / d) * cl;
      setKnob(dx, dy);
      this.analog.steer = -this.shapeSteer(dx / JOY_R);
      this.analog.throttle = Math.max(0, joyShape(-dy / JOY_R));
      this.analog.brake = Math.max(0, joyShape(dy / JOY_R));
    };
    const end = () => {
      activeId = null;
      this.clearAnalog();
      rest();
    };

    zone.addEventListener('touchstart', (e: TouchEvent) => {
      e.preventDefault();
      if (activeId !== null) return;
      const t = e.changedTouches[0];
      start(t.clientX, t.clientY, t.identifier);
    }, { passive: false });
    zone.addEventListener('touchmove', (e: TouchEvent) => {
      e.preventDefault();
      for (const t of Array.from(e.changedTouches)) if (t.identifier === activeId) move(t.clientX, t.clientY);
    }, { passive: false });
    const endH = (e: TouchEvent) => {
      for (const t of Array.from(e.changedTouches)) if (t.identifier === activeId) end();
    };
    zone.addEventListener('touchend', endH);
    zone.addEventListener('touchcancel', endH);
    // mouse fallback for testing on desktop
    zone.addEventListener('mousedown', (e: MouseEvent) => {
      start(e.clientX, e.clientY, 'mouse');
      const mm = (ev: MouseEvent) => move(ev.clientX, ev.clientY);
      const mu = () => { end(); removeEventListener('mousemove', mm); removeEventListener('mouseup', mu); };
      addEventListener('mousemove', mm);
      addEventListener('mouseup', mu);
    });

    rest();
    this.resetJoystick = rest;
  }

  /** Zero the pad axes. A control-scheme change mid-drag would otherwise leave
   *  the old axis stuck on — v1 `src/main.js:1193` does this for that reason. */
  clearAnalog() {
    this.analog.steer = this.analog.throttle = this.analog.brake = 0;
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

    // touch overlay. The on-screen BUTTONS are already in the baseline above —
    // they push their `data-key` through the same `press()` the keyboard uses —
    // so only the analog pad merges here. Untouched, `analog` is all zeros and
    // every line below is an identity, which is what "desktop must not
    // regress" means in code rather than in a promise.
    s.throttle = Math.max(s.throttle, this.analog.throttle);
    s.brake = Math.max(s.brake, this.analog.brake);
    s.steer = Math.max(-1, Math.min(1, s.steer + this.analog.steer));

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
