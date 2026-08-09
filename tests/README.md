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

## Refactor gate — `test-equivalence.mjs`

Not a behaviour test: a **proof that a change to the world builder changed no
world.** It fingerprints every world's built geometry on two servers — the old
code and the new — and fails if any differ. This is what makes the staged
decomposition of `src/track.js` (ARCHITECTURE.md §5.1) safe to continue, because
reading a diff of procedural generation proves nothing: one reordered statement
shifts every subsequent draw from the seeded PRNG, and with it every tree, rock
and building in the world.

```bash
git worktree add /tmp/baseline HEAD
(cd /tmp/baseline && python3 -m http.server 8902 &)
python3 -m http.server 8901 &                        # the working tree
BASE_A=http://localhost:8902/ BASE_B=http://localhost:8901/ \
  node tests/test-equivalence.mjs                    # all worlds; or pass ids
```

Run with only `BASE_A` and it compares a build against itself, which is the
determinism check.

`test-static.mjs` needs no browser and no server — run it first, always. Besides
the conflict-marker and module-parse checks it now walks the real import graph
from `index.html` and fails if `sw.js`'s precache list disagrees with it in
either direction. That check was added after finding `src/sync.js` imported by
`main.js` and missing from the cache list for its whole life: nothing fails in
development, because in development the network is there.

## Writing new checks

Two rules learned the hard way:

1. **Be condition-driven, not time-driven.** Headless frame rate swings
   wildly; poll for the outcome (`for (…; !thing.dead; …) await sleep(200)`)
   instead of sleeping a fixed guess.
2. **Drive, don't teleport.** Setting `player.pos` doesn't stick — physics
   moves the car straight off again, so proximity triggers (pickups, stars)
   never fire. Rail the car along the road through the target instead.
