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
`test-roam.mjs`, `test-destruction.mjs`, `test-invisible-walls.mjs` (no
mountain stands on any world's road; a car can leave every station on the
racing line; the collider is as wide as the rock is drawn at the same height),
`test-rungs.mjs` (contract rungs: the ladder hardens, the top rung is
HARD-only, a sweep stays worth about one strong race, and climbing persists per
contract).

**The world editor** has eight, each pinning what the ones before it could not
do: `test-editor.mjs` (the sculpt reaches both ground functions and the
physics), `test-editor2.mjs` (clear zones, the world recipe, weather),
`test-editor3.mjs` (road features land where they were asked for),
`test-editor4.mjs` (one undo stack, ERASE, ROTATE, MOVE ROAD, and exit taking
its markers with it), `test-select.mjs` (selecting what the WORLD built, live
in-place delete and move), `test-widen.mjs` (opening and narrowing the
carriageway), `test-editor5.mjs` (NATURE, selection of plants/lakes/zones/road
pins, DUPLICATE, REDO, water levels, brush shape, SNAP, scene codes, the
draft, and CHECK), `test-warp.mjs` (MOVE ROAD cannot knot a lap: the steering
cap sees the warp, a pull is anchored to a station, and a road move can be
selected and deleted).

## Diagnostics — `tool-*.mjs`, not gates

These print a census and exit 0. They exist to answer a question about all 60
worlds at once, and several of them earned their keep by disagreeing with an
assumption someone had already written down.

| Tool | Question |
|---|---|
| `tool-corridor-blockers.mjs` | Walking the ROAD, what is solid at each station across the drivable width? This is the one that found the massif cones standing on FURKA RIDGE's carriageway. |
| `tool-blocker-detail.mjs` | `WORLD="…"` — for one world, every distinct blocker: what it is, how much road it covers, and whether a mesh is drawn at the road's height where it bites. |
| `tool-massif-road.mjs` | Where road runs inside a massif collider: distance from the axis against the width the rock is actually drawn at that height. |
| `tool-corridor-solids.mjs` | The same territory asked the *other* way round — per collider, gated against its own nearest station. Kept as the worked example of a question that cannot find the bug; see its header. |
| `tool-overlap-census.mjs` | Which worlds run two legs of a lap on shared tarmac at grade. |
| `tool-ground-mismatch.mjs` | Where the terrain mesh and `terrainHeight()` disagree near the road — the ground you hit against the ground you see. |

## Writing new checks

Two rules learned the hard way:

1. **Be condition-driven, not time-driven.** Headless frame rate swings
   wildly; poll for the outcome (`for (…; !thing.dead; …) await sleep(200)`)
   instead of sleeping a fixed guess.
2. **Drive, don't teleport.** Setting `player.pos` doesn't stick — physics
   moves the car straight off again, so proximity triggers (pickups, stars)
   never fire. Rail the car along the road through the target instead.
