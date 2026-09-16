# DUSTLINE — Rally Combat Racer
## End-to-End Implementation Spec (original)

**Genre:** Arcade rally racing + vehicular combat (Mario Kart meets Colin McRae meets Twisted Metal)
**Platform:** Web (desktop-first, gamepad + keyboard), packaged later via Electron/Steam
**Stack:** TypeScript, Three.js (rendering), Rapier.js (physics, WASM), Zustand (state), Howler.js (audio), Vite (build)
**Target:** 60 FPS on mid-range hardware, single-player campaign first, ghost multiplayer second

---

## 0. Build Order

| Milestone | Deliverable | Definition of done |
|---|---|---|
| M1 | Driving prototype | One car, one flat test track, raycast vehicle physics, camera, gamepad + keyboard input, 60 FPS |
| M2 | Rally feel | Surface types (tarmac/gravel/mud/snow), drift model, handbrake, terrain from heightmap |
| M3 | Race loop | 3 AI opponents on racing line, lap counting, checkpoints, position tracking, results screen |
| M4 | Combat | 4 weapons, pickups, damage model, destruction states, kill/respawn |
| M5 | Campaign shell | Stage select, 1 full biome (5 tracks), economy, garage, save system (localStorage -> cloud later) |
| M6 | Full content | 5 biomes, 25 tracks, 12 cars, full weapon tree, boss races |
| M7 | Polish | VFX, audio mix, UI juice, difficulty balancing, performance pass |
| M8 | Ghost multiplayer + leaderboards | Async ghosts, weekly challenge seed |

Do not build content (M6) before systems (M1-M5) are locked. Physics feel is the product.

---

## 1. Physics

### 1.1 Vehicle model — raycast car, not rigid-body wheels

Rapier rigid body for the chassis + 4 raycasts for wheels. Never simulate wheels as separate colliders.

Per-wheel raycast, per physics tick (fixed 120 Hz, render-interpolated):
1. Cast ray from wheel mount point downward, length = suspension rest length + max travel.
2. If hit: suspension force F = k * compression + c * compressionVelocity (spring-damper).
3. Apply force at wheel mount point on chassis body.
4. Compute tire forces in the contact patch frame.

Suspension defaults:
```
restLength: 0.45 m
maxTravel: 0.25 m
stiffness k: chassisMass * 9.81 / (4 * 0.5 * restLength)   // sag to 50%
damping c: 2 * sqrt(k * (chassisMass/4)) * 0.4              // 40% critical
```

### 1.2 Tire model — simplified Pacejka

- Longitudinal: slip ratio -> force via F = D * sin(C * atan(B * slip)), clamped by load.
- Lateral: slip angle -> force via same shape, different B/C/D.
- Friction circle: sqrt(Fx^2 + Fy^2) <= mu * Fz; when exceeded scale both down proportionally.

Surface grip table:

| Surface | mu long | mu lat | Rolling resistance | Particle FX |
|---|---|---|---|---|
| Tarmac | 1.00 | 1.00 | 0.015 | smoke on slip |
| Gravel | 0.72 | 0.60 | 0.045 | dust plume |
| Mud | 0.55 | 0.45 | 0.090 | mud spray |
| Snow | 0.45 | 0.38 | 0.060 | snow spray |
| Ice patch | 0.20 | 0.15 | 0.010 | none |
| Sand | 0.60 | 0.50 | 0.110 | sand cloud |

Surface read from a splatmap texture lookup at each wheel contact (RGBA = surface IDs).

### 1.3 Arcade assists

- Drift assist: handbrake + steering -> rear lateral mu -35%, yaw torque toward steering. Release at high slip angle grants drift boost.
- Air control: pitch/yaw torque while airborne.
- Anti-flip: soft righting torque when roll > 60 deg; auto-flip after 2s upside down.
- Downforce fake: force ~ speed^2.
- Steering speed falloff: 35 deg (0 km/h) -> 8 deg (200 km/h).
- Magnetic landing: align chassis pitch to landing slope in last 0.4s of airtime.

### 1.4 Collisions & damage physics

- Chassis convex hull. damage = clamp((impulse - 800) * 0.05, 0, 40).
- Car-vs-car: restitution 0.3 + scripted shove impulse.
- Destructible props: kinematic until hit, then dynamic with impulse, despawn after 5s.

### 1.5 Boost system

- Nitro tank 0-100, consumed 33/s, +40% engine force, FOV +12, exhaust flames.
- Earn: drift (1.5/s at slip > 15 deg), airtime (2/s), near-miss (+8), weapon hit (+12), slipstream (1/s within 8m).

---

## 2. AI

### 2.1 Racing line + arc-following (baked spline; look-ahead clamp(speed*0.35, 6, 30); PID steer; braking-distance prediction). Three priority-blended layers: race / combat / avoid.

### 2.2 Personality vectors per rival: aggression, precision, riskTaking, vengeance, composure. Rivals remember ("VOLKOV IS HUNTING YOU").

### 2.3 Rubber-banding honestly: behind +5% force max, ahead -4%; caps at 8%; never within 10s of finish. Difficulty scales band strength.

### 2.4 Line baking: offline headless sim + optimizer (CMA-ES / hill-climb) -> per-class JSON lines.

### 2.5 Combat AI: utility scores at 5 Hz (fireForward, fireMine, useNitro, block) + 10% noise.

---

## 3. Players & Vehicles

### 3.1 12 cars, 4 classes: Scout (3), Striker (4), Brawler (3), Phantom (2). 4 visible stats + 1 hidden passive.

### 3.2 HP 100 (armor scales 70-160). Visual damage states at 75/50/25. Subsystem crits (engine smoke -8% top speed, bent steering 2 deg pull) repaired at pit gates. Death = 3.5s respawn at checkpoint, 4s shield, drop 25% pickups.

### 3.3 Controls

| Input | Keyboard | Gamepad |
|---|---|---|
| Throttle/Brake | W/S | RT/LT (analog) |
| Steer | A/D | Left stick |
| Handbrake | Space | X/Square |
| Nitro | Shift | A/Cross |
| Fire | LMB / J | RB |
| Rear weapon | RMB / K | LB |
| Look back | C | Right stick down |
| Reset car | R | D-pad up |

Input buffering 80ms, deadzone 0.12 cubic. Rumble on landings/hits/drift.

---

## 4. Stages

5 biomes x 5 tracks + 5 boss events: Costa Roja (tarmac+gravel, falling rocks), Ashfall (sand+gravel, lava vents), Verdant Deep (mud, river crossings), Whiteout (snow+ice, avalanches), Meridian (wet tarmac night city, traffic/gates/EMP).

Track rules: 2.5-4.5 km, 3 laps; >= 2 shortcuts; 1 weapon-alley; 3+ jumps/lap; 1 hero corner; decision point every <= 8s.
Track tech: 1024 heightmap, splatmap, spline-swept road; JSON track data (checkpoints OBBs, spawns, pickups, hazards, lines, minimap, audio zones). In-engine track editor at M5.
Event types: Circuit (8 racers), Rally stage (ghost splits), Elimination, Hunter, Boss.

---

## 5. Weapons

8 weapons; pickups weighted by position; 1 signature-weapon slot per car (guaranteed first pickup).
Scattershot / Javelin (homing, lock 1.2s) / Rail Lance (hitscan, charge) / Spike Mines / Oil Slick / Shockwave (EMP) / Aegis (shield, reflects) / Tempest (ultimate, chases leader).
Rules: hit feedback trinity (sound+reticle+sparks); no one-shots (TTK >= 3 hits); lock-on warning rear-cam flash.

---

## 6. Economy & Progression

Scrap (soft) + Medallions (prestige, event stars). No premium currency.
racePayout = base(300) * positionMult(2.0..0.4) * difficultyMult + kills*40 + driftScore*0.05 + cleanSectors*25.
Upgrades: 5 tiers x 4 branches (Engine/Chassis/Tires/Systems), 400/700/1100/1600/2400, free respec.
3 daily contracts; weekly seeded challenge + ghost of #1; rival liveries.
Campaign gates: 8 / 20 / 34 / 50 Medallions -> Final Boss; post-game Rival Mode.

---

## 7. Graphics

Stylized realism (Art of Rally readability + Rocket League clarity). WebGL2, ACES, sRGB, FXAA.
Single sun + hemisphere per biome; baked AO in vertex colors; night: 24 pooled point lights.
CSM 2 cascades 2048. Post: selective bloom, radial blur on nitro, damage vignette + CA, per-biome LUT.
Speed tricks: FOV 68->82, ground streaks, sightline prop density, shake ~ roughness.
GPU particles (instanced): dust/mud/snow/sparks/flames/explosions/tracers; skid decal ring-buffer 2000.
Budget: physics 3ms, <= 350 draw calls, <= 900k tris, logic 2ms, zero tick allocations. Quality tiers.
HUD: speed BR, position/lap TL, minimap BL, weapon+nitro BC, rival arrows, damage vignette. Menus: diegetic garage, map stage select, 150ms ease-out.

---

## 8. Audio

Granular engine loop by RPM (fake 5-ratio gearbox). Surface loops crossfaded. Weapon: mechanical+impact+tail, sidechain duck. Music intensity by position. Rival barks.

---

## 9. Architecture

src/: core, physics, ai, race, combat, vehicles, tracks, render, economy, ui, audio, data.
Rules: fixed 120 Hz deterministic sim; ALL tunables in data/*.json; event bus; pools for projectiles/particles/pickups; ghost = 20 Hz keyframes delta-compressed ~30 KB; versioned saves; tests (determinism hash, economy snapshots, AI lap smoke in CI).
Debug tooling at M2-M3: free cam, physics wireframe, line visualizer, AI thought bubbles, slow-mo, telemetry graphs, teleport, tune panel.

---

## 10. Difficulty & Accessibility

Casual/Pro/Hardcore/Rival. Assist toggles independent of difficulty. Motion sensitivity mode.

---

## 11. Pillars

1. Feel first (30-second smile rule). 2. Readable chaos (threats red-orange, boosts cyan, pickups gold). 3. One more race (single NEXT EVENT input).
