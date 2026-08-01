// Keyboard state tracking.
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
  down(...codes) { return codes.some((c) => this.keys.has(c)); }
  justPressed(...codes) { return codes.some((c) => this.pressed.has(c)); }
  endFrame() { this.pressed.clear(); }

  get throttle() { return this.down('KeyW', 'ArrowUp') ? 1 : 0; }
  get brake() { return this.down('KeyS', 'ArrowDown') ? 1 : 0; }
  get steer() { return (this.down('KeyA', 'ArrowLeft') ? 1 : 0) - (this.down('KeyD', 'ArrowRight') ? 1 : 0); }
  get fire() { return this.down('Space'); }
  get drift() { return this.down('ShiftLeft', 'ShiftRight'); }
}
