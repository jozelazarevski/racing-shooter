// Keyboard + touch-button + analog joystick state tracking.
export class Input {
  constructor() {
    this.keys = new Set();
    this.pressed = new Set(); // edge-triggered, consumed each frame
    this.analog = { steer: 0, throttle: 0, brake: 0 }; // virtual joystick
    // Player-set joystick sensitivity, 0.5–1.8, 1 = the tuned default. It
    // scales the steer axis directly: below 1 the thumb travels further for
    // the same lock, above 1 it takes less. Read live on every move event, so
    // dragging the slider changes the feel without restarting anything.
    this.joySens = 1;
    // TWO-THUMB scheme: the left pad steers and NOTHING ELSE, because the right
    // thumb has the pedals. Without this the same drag that turns the car also
    // lifts off, which is exactly the coupling two thumbs exist to remove.
    this.steerOnly = false;
    // TWO-THUMB drives on left/right buttons with the throttle held open, so
    // both thumbs are free to steer and the middle button is the brake.
    this.autoThrottle = false;
    addEventListener('keydown', (e) => {
      if (e.repeat) return;
      this.keys.add(e.code);
      this.pressed.add(e.code);
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    });
    addEventListener('keyup', (e) => this.keys.delete(e.code));
    addEventListener('blur', () => this.keys.clear());
  }

  /** Wire on-screen buttons: any element with data-key acts like that keyboard key. */
  bindTouchButtons(root = document) {
    for (const btn of root.querySelectorAll('[data-key]')) {
      const code = btn.dataset.key;
      const down = (e) => {
        e.preventDefault();
        if (!this.keys.has(code)) this.pressed.add(code);
        this.keys.add(code);
        btn.classList.add('active');
      };
      const up = (e) => {
        e.preventDefault();
        this.keys.delete(code);
        btn.classList.remove('active');
      };
      btn.addEventListener('touchstart', down, { passive: false });
      btn.addEventListener('touchend', up, { passive: false });
      btn.addEventListener('touchcancel', up, { passive: false });
      // mouse fallback so the buttons also work with a pointer
      btn.addEventListener('mousedown', down);
      btn.addEventListener('mouseup', up);
      btn.addEventListener('mouseleave', () => { this.keys.delete(code); btn.classList.remove('active'); });
    }
  }
  /**
   * One-thumb driving pad: drag anywhere in the zone — left/right steers,
   * up is throttle, down is brake/reverse. The base re-centers where the
   * thumb lands, so it works blind in either orientation.
   */
  bindJoystick(zone, base, knob) {
    // 52px of travel from centre to full lock meant a thumb twitch was half a
    // turn of the wheel. More travel = more room to be precise.
    const R = 62;       // knob travel radius (px)
    const DEAD = 0.14;  // deadzone fraction
    let activeId = null, cx = 0, cy = 0;
    const setKnob = (dx, dy) => { knob.style.transform = `translate(calc(${dx}px - 50%), calc(${dy}px - 50%))`; };
    const rest = () => {
      const r = zone.getBoundingClientRect();
      base.style.left = Math.min(120, r.width * 0.45) + 'px';
      // 110 px UP FROM THE BOTTOM, OR A FIFTH OF THE SCREEN, whichever is
      // less. The constant is measured against the zone's own height, and the
      // zone is anchored to the bottom, so it put the ring's centre 110 px off
      // the floor on every screen — on a 402-tall landscape phone that is
      // y=292, and with a 62 px radius the ring reaches up to 230 and lands on
      // the HULL INTEGRITY panel, which is where it was photographed. Changing
      // the ZONE's height does not move it: the first attempt at this fix
      // shrank the zone and the overlap came back identical to the pixel.
      base.style.top = (r.height - Math.min(110, innerHeight * 0.22)) + 'px';
      base.classList.remove('live');
      setKnob(0, 0);
    };
    const shape = (v) => {
      const a = Math.abs(v);
      if (a < DEAD) return 0;
      return Math.sign(v) * Math.min(1, (a - DEAD) / (1 - DEAD));
    };
    // Steering gets an expo curve on top. Linear travel spends the whole
    // useful range — the small corrections you actually make on a straight —
    // in the first few millimetres of thumb, which is what "way too sensitive"
    // feels like. Cubic blend keeps full lock at full deflection but makes the
    // middle of the stick gentle: half travel is now ~30% steer, not 50%.
    const shapeSteer = (v) => {
      const s = shape(v);
      const a = Math.abs(s);
      const curved = 0.42 * a + 0.58 * a * a * a;
      // sensitivity multiplies the curve, then clamps — turning it up reaches
      // full lock sooner, turning it down stretches the travel out
      return Math.sign(s) * Math.min(1, curved * (this.joySens ?? 1));
    };
    const start = (x, y, id) => {
      const r = zone.getBoundingClientRect();
      activeId = id; cx = x; cy = y;
      base.style.left = (x - r.left) + 'px';
      base.style.top = (y - r.top) + 'px';
      base.classList.add('live');
      setKnob(0, 0);
    };
    const move = (x, y) => {
      let dx = x - cx, dy = y - cy;
      if (this.steerOnly) {
        // horizontal only: the knob slides along a rail, and a thumb that
        // wanders up or down while cornering cannot touch the throttle
        dx = Math.max(-R, Math.min(R, dx));
        setKnob(dx, 0);
        this.analog.steer = -shapeSteer(dx / R);
        return;
      }
      const d = Math.hypot(dx, dy) || 1;
      const cl = Math.min(d, R);
      dx = (dx / d) * cl; dy = (dy / d) * cl;
      setKnob(dx, dy);
      this.analog.steer = -shapeSteer(dx / R);
      this.analog.throttle = Math.max(0, shape(-dy / R));
      this.analog.brake = Math.max(0, shape(dy / R));
    };
    const end = () => {
      activeId = null;
      this.analog.steer = this.analog.throttle = this.analog.brake = 0;
      rest();
    };
    zone.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (activeId !== null) return;
      const t = e.changedTouches[0];
      start(t.clientX, t.clientY, t.identifier);
    }, { passive: false });
    zone.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (const t of e.changedTouches) if (t.identifier === activeId) move(t.clientX, t.clientY);
    }, { passive: false });
    const endH = (e) => { for (const t of e.changedTouches) if (t.identifier === activeId) end(); };
    zone.addEventListener('touchend', endH);
    zone.addEventListener('touchcancel', endH);
    // mouse fallback for testing on desktop
    zone.addEventListener('mousedown', (e) => {
      start(e.clientX, e.clientY, 'mouse');
      const mm = (ev) => move(ev.clientX, ev.clientY);
      const mu = () => { end(); removeEventListener('mousemove', mm); removeEventListener('mouseup', mu); };
      addEventListener('mousemove', mm);
      addEventListener('mouseup', mu);
    });
    rest();
    this.resetJoystick = rest; // re-place after orientation changes
  }

  down(...codes) { return codes.some((c) => this.keys.has(c)); }
  justPressed(...codes) { return codes.some((c) => this.pressed.has(c)); }
  endFrame() { this.pressed.clear(); }

  get throttle() {
    // auto-gas: full throttle unless you are actually on the brake
    if (this.autoThrottle) return this.brake > 0 ? 0 : 1;
    return Math.max(this.down('KeyW', 'ArrowUp') ? 1 : 0, this.analog.throttle);
  }
  /** TWO-THUMB: both steer buttons at once IS the brake.
   *  Squeezing both thumbs down is the natural panic gesture, and it beats
   *  reaching for a third button mid-corner — the centre BRAKE stays for
   *  deliberate braking, but you no longer have to find it. Scheme-gated on
   *  autoThrottle, so a keyboard player holding both arrows is unaffected. */
  get bothSteer() {
    return !!this.autoThrottle && this.down('ArrowLeft') && this.down('ArrowRight');
  }

  get brake() {
    if (this.bothSteer) return 1;
    return Math.max(this.down('KeyS', 'ArrowDown') ? 1 : 0, this.analog.brake);
  }

  get steer() {
    if (this.bothSteer) return 0;     // squeezing both is braking, not steering
    const k = (this.down('KeyA', 'ArrowLeft') ? 1 : 0) - (this.down('KeyD', 'ArrowRight') ? 1 : 0);
    return Math.max(-1, Math.min(1, k + this.analog.steer));
  }
  get fire() { return this.down('Space'); }
  get drift() { return this.down('ShiftLeft', 'ShiftRight'); }
}
