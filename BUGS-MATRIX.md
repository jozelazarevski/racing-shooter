# BUGS — the matrix

Every world against every finding in [BUGS.md](BUGS.md) — the same numbers,
laid out so the shape of them is visible.

`·` is a clean cell. Regenerate with `node tests/world-matrix.mjs` (build-time
columns) — the drive column comes from the full `tests/agent-sweep.mjs` run.

**This is the state AFTER the fixes.** The `lane`, `near`, `wall` and
`flat×` columns were rebuilt against the fixed code; the `laps` and `stall`
columns are the original as-found drive, kept as the record of what was
found. What changed:

| | as found | now |
|---|---|---|
| colliders in the drivable lane | 211, across 29 of 57 worlds | **0** |
| objects inside the promised clearance | 1,884 | 891 |
| wall runs lying inside the road | 64 | **0** |
| stalls, driving all 57 worlds | 7 | **1** — ROCKFALL RAVINE, its own live rockfall |
| self-crossings under 4 u apart | 50 | 50 — open, a route decision |
| samples with no floor under the advertised width | 19 (RED CENTRE RUN) | **0** |

## 1. World × finding

`lane` = colliders inside the advertised drivable width. `near` = inside the
clearance RULES.md §3 promises (`widthAt + r + carRadius`). `laps` = the
agent's lap progress in 60 s (roster median 1.39). `stall` = 3 s with no
progress. `flat×` = self-crossings under 4 u apart vertically. `hole` =
samples with no floor under the width the road advertises.

| # | world | region | lane | near | wall | hole | flat× | stall | laps | minHW | grade | fps | gate |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| 1 | PINE VALLEY | PINE VALLEY | · | · | · | · | · | · | 1.29 | 5.3 | 0.268 | 1.43 | · |
| 2 | DUST CANYON | DUST CANYON | · | · | · | · | · | · | 1.78 | 5.2 | 0.315 | 1.45 | · |
| 3 | FROST PEAK | FROST PEAK | · | · | · | · | · | · | 1.39 | 5.3 | 0.323 | 1.21 | 600 CR |
| 4 | CANYON RUN | DUST CANYON | · | 64 | · | · | · | · | 1.22 | 9 | 0.18 | 1.41 | · |
| 5 | EMBER PASS | EMBER RIDGE | · | · | · | · | · | · | 1.54 | 5.1 | 0.375 | 1.95 | · |
| 6 | SUMMIT CLIMB | PINE VALLEY | · | · | · | · | · | 1 | 1.14 | 5.4 | 0.253 | 1.38 | · |
| 7 | GLACIAL PASS | FROST PEAK | · | 2 | · | · | · | · | 1.63 | 9 | 0.372 | 1.63 | 600 CR |
| 8 | AMAZON RAPIDS | AMAZON | · | · | · | · | · | · | 1.28 | 5.4 | 0.285 | 1.11 | · |
| 9 | THE DUNE SERPENT | DUST CANYON | · | · | · | · | · | · | 1.49 | 5.7 | 0.327 | 2.17 | · |
| 10 | ROCKFALL RAVINE | DUST CANYON | · | · | · | · | · | · | 1.06 | 9 | 0.185 | 1.91 | · |
| 11 | OASIS AMBUSH | DUST CANYON | · | · | · | · | · | 1 | 1.42 | 5.4 | 0.322 | 1.43 | · |
| 12 | REDWOOD RAMPAGE | PINE VALLEY | · | 2 | · | · | · | · | 1.12 | 5.3 | 0.238 | 1.32 | · |
| 13 | LOG FLUME FURY | PINE VALLEY | · | 1 | · | · | · | · | 1.57 | 5.2 | 0.235 | 1.43 | · |
| 14 | FOREST FIRE ESCAPE | PINE VALLEY | · | 1 | · | · | · | · | 0.97 | 5.4 | 0.126 | 1.23 | · |
| 15 | GLACIER'S GRIND | FROST PEAK | · | · | · | · | · | · | 1.83 | 9 | 0.371 | 1.6 | 600 CR |
| 16 | AVALANCHE ALLEY | FROST PEAK | · | 2 | · | · | · | · | 1.08 | 5 | 0.175 | 1.69 | 600 CR |
| 17 | NEON GRID EXPRESSWAY | NEO-KYOTO | · | 2 | · | · | · | · | 1.15 | 5.7 | 0.175 | 1.74 | · |
| 18 | UNDERCITY SLIPSTREAM | NEO-KYOTO | · | 2 | · | · | · | · | 1.39 | 9 | 0.15 | 1.69 | · |
| 19 | GOTTHARD CLIMB | ALPINE PASSES | · | 140 | · | · | · | · | 1.09 | 5.4 | 0.202 | 1.37 | · |
| 20 | TREMOLA DESCENT | ALPINE PASSES | · | 80 | · | · | · | · | 1.10 | 9 | 0.251 | 1.23 | · |
| 21 | FURKA RIDGE | ALPINE PASSES | · | 12 | · | · | · | · | 1.01 | 5.2 | 0.238 | 1.34 | 600 CR |
| 22 | COL DE TURINI | WORLD RALLY | · | · | · | · | · | · | 0.96 | 5.2 | 0.224 | 1.48 | · |
| 23 | OUNINPOHJA | WORLD RALLY | · | · | · | · | · | 1 | 1.90 | 5.4 | 0.387 | 1.38 | · |
| 24 | FAFE LEAP | WORLD RALLY | · | 4 | · | · | · | · | 1.73 | 5.4 | 0.304 | 1.4 | · |
| 25 | PIKES PEAK | WORLD RALLY | · | 1 | · | · | · | · | 0.74 | 5.7 | 0.23 | 1.66 | · |
| 26 | SAFARI PLAINS | WORLD RALLY | · | · | · | · | · | · | 1.44 | 5.2 | 0.209 | 1.73 | · |
| 27 | CORNICHE | WORLD RALLY | · | 1 | · | · | · | · | 1.31 | 9 | 0.249 | 1.66 | · |
| 28 | ESTONIA CRESTS | WORLD RALLY | · | 8 | · | · | · | · | 1.39 | 5.6 | 0.34 | 1.52 | · |
| 29 | OLIVE COAST | MEDITERRANEAN | · | · | · | · | · | · | 1.42 | 5.5 | 0.283 | 1.45 | · |
| 30 | LANTERN QUARTER | OLD TOWN | · | 2 | · | · | · | · | 1.38 | 5.6 | 0.205 | 1.5 | · |
| 31 | HEDGEROW DASH | FARMLAND | · | 1 | · | · | · | · | 1.34 | 5 | 0.297 | 1.12 | · |
| 32 | RED CENTRE RUN | OUTBACK | · | · | · | · | · | · | 0.96 | 6.9 | 0.221 | 1.18 | · |
| 33 | RED BULL RING | GRAND CIRCUITS | · | · | · | · | · | · | 1.43 | 5.6 | 0.288 | 1.21 | · |
| 34 | MONACO STREETS | GRAND CIRCUITS | · | 131 | · | · | · | · | 1.74 | 5.6 | 0.306 | 1.91 | · |
| 35 | SILVERSTONE | GRAND CIRCUITS | · | 1 | · | · | · | · | 1.43 | 5 | 0.322 | 1.24 | · |
| 36 | SPA-FRANCORCHAMPS | GRAND CIRCUITS | · | 2 | · | · | · | · | 1.32 | 5.5 | 0.307 | 1.58 | · |
| 37 | SUZUKA | GRAND CIRCUITS | · | 10 | · | · | · | · | 1.44 | 5.6 | 0.338 | 0.88 | · |
| 38 | NORDSCHLEIFE | GRAND CIRCUITS | · | · | · | · | · | 1 | 1.50 | 5.1 | 0.323 | 1.6 | · |
| 39 | MONZA | GRAND CIRCUITS | · | · | · | · | · | · | 2.08 | 5.5 | 0.285 | 1.24 | · |
| 40 | MARINA BAY | GRAND CIRCUITS | · | 2 | · | · | · | · | 1.52 | 5.6 | 0.315 | 2.19 | · |
| 41 | MOUNT PANORAMA | GRAND CIRCUITS | · | 1 | · | · | · | · | 1.58 | 6.7 | 0.379 | 1.7 | · |
| 42 | RALLYCROSS ARENA | GRAND CIRCUITS | · | 2 | · | · | · | · | 1.80 | 5.2 | 0.332 | 1.41 | · |
| 43 | OULTON PARK | GRAND CIRCUITS | · | · | · | · | · | · | 1.52 | 5 | 0.37 | 1 | · |
| 44 | LAGUNA SECA | GRAND CIRCUITS | · | · | · | · | · | · | 1.48 | 9 | 0.209 | 1.77 | · |
| 45 | TOUR DE CORSE | GRAND CIRCUITS | · | 28 | · | · | · | · | 0.67 | 5.5 | 0.156 | 1.38 | · |
| 46 | VINEYARD VELOCE | HEARTLAND | · | 2 | · | · | · | · | 1.12 | 5.2 | 0.22 | 0.91 | · |
| 47 | DEEPWOOD TRAIL | HEARTLAND | · | 7 | · | · | · | · | 1.29 | 5.2 | 0.212 | 1.34 | · |
| 48 | DOLOMITI CORSA | ALPINE PASSES | · | · | · | · | · | 1 | 0.98 | 5.2 | 0.301 | 1.42 | · |
| 49 | HARBOR QUAY | HEARTLAND | · | 27 | · | · | · | · | 1.90 | 5.5 | 0.383 | 1.46 | · |
| 50 | CINQUE TERRE | MEDITERRANEAN | · | 90 | · | · | · | · | 1.53 | 5.2 | 0.251 | 1.69 | · |
| 51 | AEGEAN BLUE | MEDITERRANEAN | · | 14 | · | · | · | · | 1.55 | 5.5 | 0.283 | 1.44 | · |
| 52 | COSTA BRAVA | MEDITERRANEAN | · | 86 | · | · | · | · | 1.28 | 5.1 | 0.222 | 1.73 | · |
| 53 | DALMATIA DRIVE | MEDITERRANEAN | · | 6 | · | · | · | · | 1.56 | 5.2 | 0.265 | 1.66 | · |
| 54 | COTE D AZUR | MEDITERRANEAN | · | 62 | · | · | · | · | 1.31 | 5.6 | 0.146 | 1.4 | · |
| 55 | BRIDGE RUN | HEARTLAND | · | 60 | · | · | · | · | 1.24 | 5.4 | 0.234 | 0.7 | · |
| 56 | OLIVE CROSSING | MEDITERRANEAN | · | 20 | · | · | 11 | · | 1.11 | 5.3 | 0.177 | 1.16 | · |
| 57 | MOUNTAIN TO SEA | MEDITERRANEAN | · | 15 | · | · | 39 | 2 | 0.79 | 5.4 | 0.139 | 1.98 | · |

**Totals** — 0 colliders in the lane, 891 inside the promised clearance, 0 wall runs inside the road, 0 samples with no floor, 50 flat self-crossings, 7 stalls across 57 worlds.

## 2. Which builder put it there

Colliders **in the lane**, by the call site that placed them. Every column is
the same bug: a fixed lateral offset from the object's own sample, never
re-checked against the rest of the centreline — and every column is now
zero. The as-found counts are kept beside each call site, because the row of
zeros only means something next to what it replaced.

| call site | what it places | as found | now |
|---|---|---:|---:|
| `track.js:17143` | culvert parapet | 106, 17 worlds | **0** |
| `track.js:17070` | ford depth marker | 50, 19 worlds | **0** |
| `track.js:10898` | flyover parapet rail | 25, 1 world | **0** |
| `track.js:6551` | start-gantry leg | 8, 3 worlds | **0** |
| `track.js:16241` | grandstand front | 6, 4 worlds | **0** |
| `track.js:10547` | quay cannon | 4, 3 worlds | **0** |
| `track.js:4741` | narrow-section post | 3, 2 worlds | **0** |
| `track.js:9743` | roadside boulder | 1, 1 world | **0** |
| various | grown trunks | 8, 2 worlds | **0** |
| `_buildableSpot` | every structure in the game | — | gate added |
| `_barrier` | every wall in the game | — | gate added |

57 of 57 worlds carry nothing in the lane.

## 3. Finding × severity × where

| # | finding | sev | worlds (as found) | root cause | status |
|---|---|---|---|---|---|
| 1 | Furniture in the drivable lane | **high** | 29 of 57 | eight call sites, no `_clearsRoad` | fixed — 211 → 0 |
| 2 | Agent stalled against it (7 stalls) | **high** | 6 | two stalls sit 2 samples from a mid-lane parapet | fixed — 7 stalls → 1, and that one is a live hazard |
| 3 | Route crosses itself at its own height | **high** | 2 — 56, 57 | no vertical separation between passes | dressing fixed, both worlds drive; the routes stay open |
| 4 | Wall run inside the road width | med | 2 — 31, 43 | segment colliders laid at lateral 7–8 on a 9 u road | fixed — 64 → 0 |
| 5 | START armed on a world that refuses it | med | 5 — 3, 7, 15, 16, 21 | `_syncStartButton()` never runs at boot | fixed (the gate itself went upstream in r151) |
| 6 | Roster not swept by the old suites | med | roster-wide | `playtest-all` stops at 28, `test-affinity` at 21 | fixed |
| 7 | Player sank under the terrain | med | 1 — 32 | seen once at −7.43 u, did not reproduce | **open** — reproduced later at −3.38 u, intermittent |
| 8 | Lap pace far below the roster median | low | 3 — 25, 45, 57 | TOUR DE CORSE spends 23 % of the lap off the road | **open** — TOUR DE CORSE still 23 % off-road |
| 9 | Documented counts stale | low | roster-wide | README says 18 worlds; the roster is 57 | fixed |

## 4. What every world passed

From the full driving sweep (all 57 worlds), not the build-time probe.

| check | worlds clean |
|---|---|
| NaN in player or AI state | 57 of 57 |
| AI stuck, lost, or gifted a lap | 57 of 57 |
| page errors during build and race | 57 of 57 |
| pickups off the road plane | 57 of 57 |
| declared hazard that never built | 57 of 57 |
| vertical step in the road over 2.5 u | 57 of 57 |
| grade past what the car can climb (>0.45) | 57 of 57 |

## 5. Spread

| measure | min | median | max |
|---|---|---|---|
| lap progress per 60 s | 0.67 | 1.39 | 2.08 |
| narrowest half-width per world (u) | 5 | 5.4 | 9 |
| steepest sustained grade | 0.126 | 0.265 | 0.387 |
| render fps (SwiftShader — relative only) | 0.7 | 1.43 | 2.19 |
| solid colliders per world | 63 | 290 | 824 |

Frame rates are software-rendered and comparable only with each other — not
device performance.
