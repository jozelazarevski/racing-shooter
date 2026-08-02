# DUSTLINE — Rally Combat Racer
## End-to-End Implementation Spec (CLAUDE.md)

**Genre:** Arcade rally racing + vehicular combat (Mario Kart meets Colin McRae meets Twisted Metal)
**Platform:** Web (desktop-first, gamepad + keyboard), packaged later via Electron/Steam
**Stack:** TypeScript, Three.js (rendering), Rapier.js (physics, WASM), Zustand (state), Howler.js (audio), Vite (build)
**Target:** 60 FPS on mid-range hardware, single-player campaign first, ghost multiplayer second

> Implementation status: **M2 complete** (rally feel — heightmap terrain with
> shared render/collider grid, six surface zones sampled per wheel contact,
> real contact normals, per-surface particle FX, magnetic landing). Next:
> M3 race loop (AI on racing line, laps, checkpoints, results).

## Build order

| Milestone | Deliverable | Status |
|---|---|---|
| M1 | Driving prototype: raycast car, camera, input, 60 FPS | DONE |
| M2 | Rally feel: surface types, drift model, handbrake, heightmap terrain | DONE |
| M3 | Race loop: 3 AI on racing line, laps, checkpoints, results | next |
| M4 | Combat: 4 weapons, pickups, damage, destruction, kill/respawn | |
| M5 | Campaign shell: stage select, 1 biome (5 tracks), economy, garage, saves | |
| M6 | Full content: 5 biomes, 25 tracks, 12 cars, weapon tree, bosses | |
| M7 | Polish: VFX, audio mix, UI juice, balancing, perf pass | |
| M8 | Ghost multiplayer + leaderboards | |

The complete original specification (physics §1, AI §2, vehicles §3,
stages §4, weapons §5, economy §6, graphics §7, audio §8, architecture §9,
difficulty §10, pillars §11) is preserved in `SPEC.md` next to this file.
Physics feel is the product: do not build content before systems are locked.
