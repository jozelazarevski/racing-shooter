// Keyboard + touch-button + analog joystick state tracking.
export class Input {
  constructor() {
    this.keys = new Set();
    this.pressed = new Set(); // edge-triggered, consumed each frame
    this.analog = { steer: 0, throttle: 0, brake: 0 }; // virtual joystick
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
      base.style.top = (r.height - 110) + 'px';
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
      return Math.sign(s) * (0.42 * a + 0.58 * a * a * a);
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

  get throttle() { return Math.max(this.down('KeyW', 'ArrowUp') ? 1 : 0, this.analog.throttle); }
  get brake() { return Math.max(this.down('KeyS', 'ArrowDown') ? 1 : 0, this.analog.brake); }
  get steer() {
    const k = (this.down('KeyA', 'ArrowLeft') ? 1 : 0) - (this.down('KeyD', 'ArrowRight') ? 1 : 0);
    return Math.max(-1, Math.min(1, k + this.analog.steer));
  }
  get fire() { return this.down('Space'); }
  get drift() { return this.down('ShiftLeft', 'ShiftRight'); }
}
