# DUSTLINE — Rally Combat Racer
## End-to-End Implementation Spec (CLAUDE.md)

**Genre:** Arcade rally racing + vehicular combat (Mario Kart meets Colin McRae meets Twisted Metal)
**Platform:** Web (desktop-first, gamepad + keyboard), packaged later via Electron/Steam
**Stack:** TypeScript, Three.js (rendering), Rapier.js (physics, WASM), Zustand (state), Howler.js (audio), Vite (build)
**Target:** 60 FPS on mid-range hardware, single-player campaign first, ghost multiplayer second

> Implementation status: **M3 complete** (race loop — baked racing line with
> speed profile, 3 AI drivers with look-ahead steering + avoid layer, race
> director with ordered sectors / laps / live positions, countdown, results
> screen with one-input restart). Next: M4 combat (weapons, pickups, damage,
> destruction, kill/respawn).
>
> **Out of milestone order: track authoring landed early.** Tracks are now data
> (`src/data/tracks/*.json`, typed in `src/tracks/trackDef.ts`) with a visual
> editor at `editor.html` — see `TRACKS.md`. This is M5/M6 infrastructure
> arriving before M4, done deliberately because authoring worlds by editing
> constructor literals was the bottleneck on everything else. It is systems,
> not content, so it does not violate "do not build content before systems are
> locked" — but the ordering is a conscious departure and worth knowing about.
> Seeded generation (`src/core/rng.ts`) came with it, which M6 would have
> needed anyway and which is far cheaper to add before there are 25 tracks.

## Build order

| Milestone | Deliverable | Status |
|---|---|---|
| M1 | Driving prototype: raycast car, camera, input, 60 FPS | DONE |
| M2 | Rally feel: surface types, drift model, handbrake, heightmap terrain | DONE |
| M3 | Race loop: 3 AI on racing line, laps, checkpoints, results | DONE |
| M4 | Combat: 4 weapons, pickups, damage, destruction, kill/respawn | next |
| M5 | Campaign shell: stage select, 1 biome (5 tracks), economy, garage, saves | |
| M6 | Full content: 5 biomes, 25 tracks, 12 cars, weapon tree, bosses | |
| M7 | Polish: VFX, audio mix, UI juice, balancing, perf pass | |
| M8 | Ghost multiplayer + leaderboards | |

The complete original specification (physics §1, AI §2, vehicles §3,
stages §4, weapons §5, economy §6, graphics §7, audio §8, architecture §9,
difficulty §10, pillars §11) is preserved in `SPEC.md` next to this file.
Physics feel is the product: do not build content before systems are locked.
