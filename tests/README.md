# IGNITE RALLY — headless test & playtest suites

Every suite drives the real game in headless Chromium (SwiftShader) against a
local server. They assert *behaviour*, not internals, so they double as a
regression net and as a repeatable playtest.

## Running

```bash
python3 -m http.server 8901        # from the repo root, in another shell
node tests/<suite>.mjs
```

Requires `playwright-core` and a Chromium at `/opt/pw-browsers/chromium`
(override the `executablePath` at the top of each file if yours differs).

## Playtests — broad sweeps that hunt for gameplay bugs

| Suite | What it does |
|---|---|
| `playtest-all.mjs` | Races **all 18 worlds**. Flags NaN in car state, cars sinking under terrain, AI that makes no progress or falls out of the world, pickups off the road plane, declared-but-unbuilt hazards, and page errors. |
| `playtest-systems.mjs` | Weapons (cannon / missile / mine / shockwave each damage a rival), wreck→respawn, a full race to the results screen, podium unlock gating, credit economy, upgrade purchase, pickup collection. |
| `playtest-modes.mjs` | Live hazards firing mid-race (rockfall, burning treefall, icicles), the final-lap avalanche chase, the free-roam loop (stars, choppers, credit banking), the pause menu, and mobile touch driving. |

## Regression suites — narrower, law-by-law

`test-final-integration.mjs` (boots every level, mobile smoke, finish flow),
`test-rules.mjs` (RULES.md material/impact conformance), `test-surface.mjs`
(snow/wet handling), `test-slowfield.mjs`, `test-funpack.mjs` (style combo,
slipstream, big air, shield, treasure stars), `test-round-fixes.mjs`
(mines on elevated roads, ramp launch cap, gating, economy),
`test-menu-noreset.mjs` (live car swap + menu state restore),
`test-roam.mjs`, `test-destruction.mjs`.

## Writing new checks

Two rules learned the hard way:

1. **Be condition-driven, not time-driven.** Headless frame rate swings
   wildly; poll for the outcome (`for (…; !thing.dead; …) await sleep(200)`)
   instead of sleeping a fixed guess.
2. **Drive, don't teleport.** Setting `player.pos` doesn't stick — physics
   moves the car straight off again, so proximity triggers (pickups, stars)
   never fire. Rail the car along the road through the target instead.
