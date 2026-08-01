// Keyboard + touch-button state tracking.
export class Input {
  constructor() {
    this.keys = new Set();
    this.pressed = new Set(); // edge-triggered, consumed each frame
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
  down(...codes) { return codes.some((c) => this.keys.has(c)); }
  justPressed(...codes) { return codes.some((c) => this.pressed.has(c)); }
  endFrame() { this.pressed.clear(); }

  get throttle() { return this.down('KeyW', 'ArrowUp') ? 1 : 0; }
  get brake() { return this.down('KeyS', 'ArrowDown') ? 1 : 0; }
  get steer() { return (this.down('KeyA', 'ArrowLeft') ? 1 : 0) - (this.down('KeyD', 'ArrowRight') ? 1 : 0); }
  get fire() { return this.down('Space'); }
  get drift() { return this.down('ShiftLeft', 'ShiftRight'); }
}
