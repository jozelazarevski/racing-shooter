# DUSTLINE — Rally Combat Racer

Arcade rally racing + vehicular combat. Full end-to-end spec lives in
`CLAUDE.md` (milestones M1–M8). **Current status: M1 complete.**

## M1 — driving prototype (done)

- Fixed-timestep sim at **120 Hz** with render interpolation (`core/loop.ts`);
  deterministic per seed (verified: identical 240-tick replays)
- **Raycast vehicle** on a Rapier rigid-body chassis (`physics/vehicleController.ts`):
  per-wheel suspension spring-damper (spec formulas: 50% sag, 40% critical
  damping), simplified-Pacejka lateral/longitudinal tire curves, friction
  circle
- **Arcade assists**: handbrake drift (rear mu ×0.65 + yaw assist), yaw
  stability so slides catch with countersteer, speed-falloff steering
  (35°→8°), v² downforce, air control, anti-flip + 2s auto-flip, nitro
  (+40% force, FOV push)
- Chase camera with position spring + velocity-led look-at
- Keyboard + Gamepad input per spec §3.3 (deadzone 0.12, cubic curve)
- Debug telemetry overlay: FPS/sim rate, speed, per-wheel slip angle +
  suspension compression, drift/air flags
- Figure-8 tarmac tuning circuit with cones

Drift feel (measured): handbrake kicks the rear to ~35–40° slip; lifting
throttle catches it in ~1.3 s, staying on power holds the slide ~2.8 s.

## Run

```bash
cd dustline
npm install
npm run dev        # dev server
npm run build      # outputs ../play-dustline (served by GitHub Pages)
```

Play the built version: https://jozelazarevski.github.io/racing-shooter/play-dustline/

All tunables live in `src/data/*.json` — zero magic numbers in code.
