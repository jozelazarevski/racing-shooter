# DUSTLINE — Rally Combat Racer

> **Scope: DUSTLINE (`dustline/`) only.** The normative documents at the
> repository root — `RULES.md`, `NATURE.md`, `STRUCTURES.md`, `SCENES.md`
> and `spec/` — describe IGNITE RALLY, a different game in the same
> repository. None of them governs this one.

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
> **Out of milestone order: the whole world-authoring pipeline landed early.**
> Tracks are data (`src/data/tracks/*.json`, typed in `src/tracks/trackDef.ts`),
> authored in a visual editor at `editor.html` — see `TRACKS.md`. Around it:
>
> - **109 world components** (`src/world/props/`), one file per placeable
>   thing, discovered by glob with no manifest — see `COMPONENTS.md`. Most are
>   ported verbatim from IGNITE RALLY rather than redesigned.
> - **A shared shape library** (`src/templates/`) — geometry helpers, 18
>   dwelling archetypes, boat parts, wall/window textures, horizon forms. It
>   depends only on `three` and `core/`, and `verify:templates` proves it.
> - **Water** — a level, a swell surface, depth shading, and `land` / `water` /
>   `shore` placement so a hull's origin is its waterline.
> - **New-track presets** (`src/tracks/presets.ts`) — 8 lands × 7 weathers,
>   lighting numbers ported from v1's `THEMES`.
> - **Save publishes to the game.** The editor writes into
>   `src/data/tracks/`, the registry globs that folder, and the picker
>   (`src/ui/trackSelect.ts`) draws each track's real road outline.
> - **Deployed** to GitHub Pages on push to `main`.
>
> This is M5/M6 infrastructure arriving before M4, done deliberately because
> authoring worlds by editing constructor literals was the bottleneck on
> everything else. It is systems, not content, so it does not violate "do not
> build content before systems are locked" — but the ordering is a conscious
> departure and worth knowing about. Seeded generation (`src/core/rng.ts`) came
> with it, which M6 would have needed anyway and which is far cheaper to add
> before there are 25 tracks.
>
> **Before you push:** `npm run gate` for the static checks, `npm run gate:full`
> for those plus the build, the golden worlds, both smoke suites and a deploy
> rehearsal served under a Pages-style sub-path.

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
