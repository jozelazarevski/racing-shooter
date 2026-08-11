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

## The road gate — run this one

```bash
node tests/verify-roads.mjs      # ~12 min, exits 1 on any violation
```

Boots every world in `levels.js` and asks the game itself — `track.roadAudit()`
— whether it holds the three things RULES.md §3 promises: nothing standing
inside the advertised drivable width, no wall run lying in the road, and floor
under every metre of that width. All three are zero on the shipped roster, and
each was a real bug first: 211 colliders in the racing line, 64 wall runs
across it, and a 21 u hole in RED CENTRE RUN that dropped the car through the
world.

The same function backs `?audit=1`, which paints the violations in the world
where an author can see them, and `world-matrix.mjs`, so a check cannot drift
from the code it checks.

## Playtests — broad sweeps that hunt for gameplay bugs

| Suite | What it does |
|---|---|
| `agent-sweep.mjs` | An autopilot **drives every world in `levels.js`** on the analog steer/throttle/brake a touch player uses — no rail, no teleport — and audits the built world around it: colliders standing in the drivable lane, walls across the road, steps and grades in the road surface, flat self-crossings, pickups off the plane, unbuilt hazards. Findings from the first full run are written up in `../BUGS.md`. |
| `playtest-all.mjs` | Races **every world in `levels.js`**. Flags NaN in car state, cars sinking under terrain, AI that makes no progress or falls out of the world, pickups off the road plane, declared-but-unbuilt hazards, and page errors. (It used to stop at level 28 of a 57-world roster; it reads the roster now — see `BUGS.md` §6.) |
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
3. **A rail is not a driver.** Railing gets a probe past a proximity trigger,
   and it also drives straight through every boulder, wall and pinch in the
   road — which is the whole class of bug a playtest exists to find. When the
   question is "can this world be driven", write to `input.analog` and let the
   physics answer; see `agent-sweep.mjs`.
4. **Stub the composer for long drives.** SwiftShader draws a world at ~1 fps
   and `dt` is clamped at 0.05, so a rendered probe runs at a tenth of real
   time. `game.composer.render = () => {}` puts the simulation back to 60 fps
   and real time; restore it afterwards, and measure the rendered path
   separately.
