# DUSTLINE — Rally Combat Racer

Arcade rally racing + vehicular combat. Full end-to-end spec lives in
`CLAUDE.md` (milestones M1–M8). **Current status: M3 complete, plus track
authoring.**

```bash
npm install
npm run dev        # game at /, editor at /editor.html
npm run gate       # typecheck + prove the track format reproduces the world
```

## Tracks are data, and there is an editor — see `TRACKS.md`

A track used to be a literal in `Terrain`'s constructor, with its snow line and
mud flat and jump crest written as comparisons inside three functions. All of
that is now a JSON file (`src/data/tracks/*.json`, typed in
`src/tracks/trackDef.ts`), and **`editor.html`** authors it: a live 2D map with
shaded relief, surfaces and corner-speed colouring, above a 3D preview that
builds the *real* `Terrain` rather than an approximation.

Tracks save to `localStorage`, export as JSON, or pack whole into a URL — which
is the useful bug-report format, because generation is seeded and the link
therefore reproduces the world rather than just its outline.

`npm run verify:track` proves the format did not lose anything: it drives the
original hardcoded implementation and the data path over 48,400 grid samples
and requires them to agree.

## M3 — race loop (done)

- **Racing line bake** (`ai/racingLine.ts`, spec 2.1/2.4-lite): per-node
  target speeds from Menger curvature + per-surface muLat
  (v = sqrt(mu*g*R)), backward braking pass + forward acceleration pass —
  runs once at boot, deterministic
- **3 AI drivers** (`ai/driver.ts`): spec look-ahead clamp(speed*0.35, 6,
  30), P-steer + yaw damping, braking-distance speed control against the
  baked profile, lateral avoid layer, stuck-recovery. Named liveries
  (KESKI / MORROW / ONYX) with per-driver pace + lane
- **Race director** (`race/director.ts`): countdown, ordered sector
  checkpoints (cutting earns nothing), 3 laps, best-lap tracking, live
  positions from gate-relative progress, finish + results
- **Race HUD** (`ui/hud.ts`): position + lap + timer, standings ticker,
  countdown, results screen with single-input NEXT RACE (pillar 3)
- Found & fixed in acceptance: countdown "hold brake" made the whole grid
  reverse at 40 km/h (brake at standstill = reverse) — grids now pin with
  the handbrake; standings progress is gate-relative so grid cars no
  longer rank as nearly a lap ahead

## M2 — rally feel (done)

- **Heightmap terrain**: procedural rolling hills with a carved 480-sample
  rally loop (one jump crest at t=0.62); the render mesh and the Rapier
  trimesh collider share the exact same 160x160 grid
- **Surface zones** (`tracks/terrain.ts`): tarmac start leg, long gravel
  rally leg, a mud river-crossing west, snow + ice patches north, sand
  east — sampled per wheel contact each tick (the splatmap role), feeding
  the spec 1.2 mu table from `data/surfaces.json`
- **Real contact normals**: `castRayAndGetNormal` drives the contact-patch
  frame, so the chassis rides and tilts with the slope
- **Per-surface wheel FX**: soft-billboard pool (700, zero allocs) — dust
  plumes on gravel, mud spray, snow spray, sand clouds, tire smoke only on
  tarmac slip, nothing on ice (per the spec table)
- **Magnetic landing** assist: last 0.4 s of airtime aligns the chassis to
  the slope it is about to meet
- Spawn stays a flat tarmac pad, so every M1 acceptance test still passes
  (measured: mud caps the same 2.5 s full-throttle run at 52.5 km/h vs
  62.5 on tarmac; determinism holds on terrain)

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
