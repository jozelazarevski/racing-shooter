// Fixed-timestep simulation (120 Hz) with render interpolation (§9.2).
// The sim NEVER sees a variable dt; rendering blends the last two sim states.

export const FIXED_HZ = 120;
export const FIXED_DT = 1 / FIXED_HZ;
const MAX_FRAME_DT = 0.25; // tab-switch guard: never spiral

export interface LoopHooks {
  fixedUpdate: (dt: number) => void;
  render: (alpha: number, frameDt: number) => void;
}

export class GameLoop {
  private acc = 0;
  private last = 0;
  private running = false;
  fps = 0;
  simHz = 0;
  private fpsSmooth = 60;
  private ticksThisSecond = 0;
  private tickTimer = 0;

  constructor(private hooks: LoopHooks) {}

  start() {
    this.running = true;
    this.last = performance.now();
    const frame = (now: number) => {
      if (!this.running) return;
      let dt = (now - this.last) / 1000;
      this.last = now;
      if (dt > MAX_FRAME_DT) dt = MAX_FRAME_DT;
      this.fpsSmooth += (1 / Math.max(1e-4, dt) - this.fpsSmooth) * 0.05;
      this.fps = this.fpsSmooth;

      this.acc += dt;
      while (this.acc >= FIXED_DT) {
        this.hooks.fixedUpdate(FIXED_DT);
        this.acc -= FIXED_DT;
        this.ticksThisSecond++;
      }
      this.tickTimer += dt;
      if (this.tickTimer >= 1) {
        this.simHz = this.ticksThisSecond / this.tickTimer;
        this.ticksThisSecond = 0;
        this.tickTimer = 0;
      }
      this.hooks.render(this.acc / FIXED_DT, dt);
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  stop() { this.running = false; }
}
