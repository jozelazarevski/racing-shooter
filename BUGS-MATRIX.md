# BUGS — the matrix

Every world against every finding in [BUGS.md](BUGS.md) — the same numbers,
laid out so the shape of them is visible.

`·` is a clean cell. Regenerate with `node tests/world-matrix.mjs` (build-time
columns) — the drive column comes from the full `tests/agent-sweep.mjs` run.

The build-time columns were measured in a **separate build** of every world
from the one that was driven, and CONFORMANCE.md warns that a world differs
between two builds. The in-lane totals came back identical to the driving
sweep's — 211, with the same split per call site — which is itself the
finding: this furniture lands in the road every time, not by luck of a seed.

## 1. World × finding

`lane` = colliders inside the advertised drivable width. `near` = inside the
clearance RULES.md §3 promises (`widthAt + r + carRadius`). `laps` = the
agent's lap progress in 60 s (roster median 1.39). `stall` = 3 s with no
progress. `flat×` = self-crossings under 4 u apart vertically.

| # | world | region | lane | near | wall | flat× | stall | laps | minHW | grade | fps | gate |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| 1 | PINE VALLEY | PINE VALLEY | 7 | 8 | · | · | · | 1.29 | 5.3 | 0.268 | 1.31 | · |
| 2 | DUST CANYON | DUST CANYON | · | 61 | · | · | · | 1.78 | 5.2 | 0.315 | 1.25 | · |
| 3 | FROST PEAK | FROST PEAK | · | · | · | · | · | 1.39 | 5.3 | 0.323 | 1.01 | 600 CR |
| 4 | CANYON RUN | DUST CANYON | 6 | 148 | · | · | · | 1.22 | 9 | 0.18 | 1.14 | · |
| 5 | EMBER PASS | EMBER RIDGE | · | · | · | · | · | 1.54 | 5.1 | 0.375 | 1.6 | · |
| 6 | SUMMIT CLIMB | PINE VALLEY | 10 | 12 | · | · | 1 | 1.14 | 5.4 | 0.253 | 1.27 | · |
| 7 | GLACIAL PASS | FROST PEAK | · | 2 | · | · | · | 1.63 | 9 | 0.372 | 1.42 | 600 CR |
| 8 | AMAZON RAPIDS | AMAZON | 5 | 8 | · | · | · | 1.28 | 5.4 | 0.285 | 0.97 | · |
| 9 | THE DUNE SERPENT | DUST CANYON | · | · | · | · | · | 1.49 | 5.7 | 0.327 | 1.81 | · |
| 10 | ROCKFALL RAVINE | DUST CANYON | · | 69 | · | · | · | 1.06 | 9 | 0.185 | 1.57 | · |
| 11 | OASIS AMBUSH | DUST CANYON | 9 | 10 | · | · | 1 | 1.42 | 5.4 | 0.322 | 1.1 | · |
| 12 | REDWOOD RAMPAGE | PINE VALLEY | 12 | 15 | · | · | · | 1.12 | 5.3 | 0.238 | 1.17 | · |
| 13 | LOG FLUME FURY | PINE VALLEY | 6 | 8 | · | · | · | 1.57 | 5.2 | 0.235 | 1.3 | · |
| 14 | FOREST FIRE ESCAPE | PINE VALLEY | · | 4 | · | · | · | 0.97 | 5.4 | 0.126 | 1.03 | · |
| 15 | GLACIER'S GRIND | FROST PEAK | · | · | · | · | · | 1.83 | 9 | 0.371 | 1.48 | 600 CR |
| 16 | AVALANCHE ALLEY | FROST PEAK | · | 2 | · | · | · | 1.08 | 5 | 0.175 | 1.38 | 600 CR |
| 17 | NEON GRID EXPRESSWAY | NEO-KYOTO | · | 2 | · | · | · | 1.15 | 5.7 | 0.175 | 1.41 | · |
| 18 | UNDERCITY SLIPSTREAM | NEO-KYOTO | · | 2 | · | · | · | 1.39 | 9 | 0.15 | 1.43 | · |
| 19 | GOTTHARD CLIMB | ALPINE PASSES | · | 140 | · | · | · | 1.09 | 5.4 | 0.202 | 1.18 | · |
| 20 | TREMOLA DESCENT | ALPINE PASSES | · | 80 | · | · | · | 1.10 | 9 | 0.251 | 1.1 | · |
| 21 | FURKA RIDGE | ALPINE PASSES | · | 12 | · | · | · | 1.01 | 5.2 | 0.238 | 1.31 | 600 CR |
| 22 | COL DE TURINI | WORLD RALLY | · | · | · | · | · | 0.96 | 5.2 | 0.224 | 1.47 | · |
| 23 | OUNINPOHJA | WORLD RALLY | 8 | 8 | · | · | 1 | 1.90 | 5.4 | 0.387 | 1.14 | · |
| 24 | FAFE LEAP | WORLD RALLY | 4 | 8 | · | · | · | 1.73 | 5.4 | 0.304 | 1.05 | · |
| 25 | PIKES PEAK | WORLD RALLY | 8 | 12 | · | · | · | 0.74 | 5.7 | 0.23 | 1.35 | · |
| 26 | SAFARI PLAINS | WORLD RALLY | · | 110 | · | · | · | 1.44 | 5.2 | 0.209 | 1.37 | · |
| 27 | CORNICHE | WORLD RALLY | · | 89 | · | · | · | 1.31 | 9 | 0.249 | 1.74 | · |
| 28 | ESTONIA CRESTS | WORLD RALLY | 5 | 14 | · | · | · | 1.39 | 5.6 | 0.34 | 1.29 | · |
| 29 | OLIVE COAST | MEDITERRANEAN | · | · | · | · | · | 1.42 | 5.5 | 0.283 | 1.21 | · |
| 30 | LANTERN QUARTER | OLD TOWN | · | 2 | · | · | · | 1.38 | 5.6 | 0.205 | 1.27 | · |
| 31 | HEDGEROW DASH | FARMLAND | 2 | 7 | 1 | · | · | 1.34 | 5 | 0.297 | 0.99 | · |
| 32 | RED CENTRE RUN | OUTBACK | 9 | 33 | · | · | · | 0.96 | 6.9 | 0.221 | 1 | · |
| 33 | RED BULL RING | GRAND CIRCUITS | 16 | 18 | · | · | · | 1.43 | 5.6 | 0.288 | 1.02 | · |
| 34 | MONACO STREETS | GRAND CIRCUITS | · | 133 | · | · | · | 1.74 | 5.6 | 0.306 | 1.68 | · |
| 35 | SILVERSTONE | GRAND CIRCUITS | 4 | 7 | · | · | · | 1.43 | 5 | 0.322 | 1.06 | · |
| 36 | SPA-FRANCORCHAMPS | GRAND CIRCUITS | 13 | 16 | · | · | · | 1.32 | 5.5 | 0.307 | 1.26 | · |
| 37 | SUZUKA | GRAND CIRCUITS | 15 | 75 | · | · | · | 1.44 | 5.6 | 0.338 | 0.66 | · |
| 38 | NORDSCHLEIFE | GRAND CIRCUITS | 8 | 8 | · | · | 1 | 1.50 | 5.1 | 0.323 | 1.11 | · |
| 39 | MONZA | GRAND CIRCUITS | · | · | · | · | · | 2.08 | 5.5 | 0.285 | 0.95 | · |
| 40 | MARINA BAY | GRAND CIRCUITS | · | 2 | · | · | · | 1.52 | 5.6 | 0.315 | 1.95 | · |
| 41 | MOUNT PANORAMA | GRAND CIRCUITS | 4 | 9 | · | · | · | 1.58 | 6.7 | 0.379 | 1.44 | · |
| 42 | RALLYCROSS ARENA | GRAND CIRCUITS | 8 | 11 | · | · | · | 1.80 | 5.2 | 0.332 | 0.96 | · |
| 43 | OULTON PARK | GRAND CIRCUITS | 7 | 8 | 1 | · | · | 1.52 | 5 | 0.37 | 1.06 | · |
| 44 | LAGUNA SECA | GRAND CIRCUITS | · | 96 | · | · | · | 1.48 | 9 | 0.209 | 1.81 | · |
| 45 | TOUR DE CORSE | GRAND CIRCUITS | 4 | 32 | · | · | · | 0.67 | 5.5 | 0.156 | 0.99 | · |
| 46 | VINEYARD VELOCE | HEARTLAND | 2 | 4 | · | · | · | 1.12 | 5.2 | 0.22 | 0.78 | · |
| 47 | DEEPWOOD TRAIL | HEARTLAND | · | 15 | · | · | · | 1.29 | 5.2 | 0.212 | 1.1 | · |
| 48 | DOLOMITI CORSA | ALPINE PASSES | · | · | · | · | 1 | 0.98 | 5.2 | 0.301 | 0.94 | · |
| 49 | HARBOR QUAY | HEARTLAND | 1 | 30 | · | · | · | 1.90 | 5.5 | 0.383 | 1.03 | · |
| 50 | CINQUE TERRE | MEDITERRANEAN | · | 90 | · | · | · | 1.53 | 5.2 | 0.251 | 1.16 | · |
| 51 | AEGEAN BLUE | MEDITERRANEAN | · | 14 | · | · | · | 1.55 | 5.5 | 0.283 | 1.09 | · |
| 52 | COSTA BRAVA | MEDITERRANEAN | 1 | 87 | · | · | · | 1.28 | 5.1 | 0.222 | 1.07 | · |
| 53 | DALMATIA DRIVE | MEDITERRANEAN | · | 6 | · | · | · | 1.56 | 5.2 | 0.265 | 1.16 | · |
| 54 | COTE D AZUR | MEDITERRANEAN | 8 | 94 | · | · | · | 1.31 | 5.6 | 0.146 | 1.11 | · |
| 55 | BRIDGE RUN | HEARTLAND | 1 | 100 | · | · | · | 1.24 | 5.4 | 0.234 | 0.83 | · |
| 56 | OLIVE CROSSING | MEDITERRANEAN | 1 | 23 | · | · | · | 1.11 | 5.3 | 0.177 | 1.04 | · |
| 57 | MOUNTAIN TO SEA | MEDITERRANEAN | 27 | 140 | · | 58 | 2 | 0.79 | 5.4 | 0.139 | 1.8 | · |

**Totals** — 211 colliders in the lane, 1884 inside the promised clearance, 2 wall runs inside the road, 58 flat self-crossings, 7 stalls across 57 worlds.

## 2. Which builder put it there

Colliders **in the lane**, by the call site that placed them. Every column is
the same bug: a fixed lateral offset from the object's own sample, never
re-checked against the rest of the centreline.

| # | world | culvert parapet | ford marker | overpass rail | gantry leg | grandstand | quay cannon | narrow post | boulder | tree | other | total |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | PINE VALLEY | 4 | 3 | · | · | · | · | · | · | · | · | **7** |
| 4 | CANYON RUN | · | · | · | · | 2 | · | · | · | 4 | · | **6** |
| 6 | SUMMIT CLIMB | 8 | 2 | · | · | · | · | · | · | · | · | **10** |
| 8 | AMAZON RAPIDS | 2 | 3 | · | · | · | · | · | · | · | · | **5** |
| 11 | OASIS AMBUSH | 6 | 3 | · | · | · | · | · | · | · | · | **9** |
| 12 | REDWOOD RAMPAGE | 10 | 2 | · | · | · | · | · | · | · | · | **12** |
| 13 | LOG FLUME FURY | 4 | 2 | · | · | · | · | · | · | · | · | **6** |
| 23 | OUNINPOHJA | 4 | 4 | · | · | · | · | · | · | · | · | **8** |
| 24 | FAFE LEAP | · | 4 | · | · | · | · | · | · | · | · | **4** |
| 25 | PIKES PEAK | 6 | 2 | · | · | · | · | · | · | · | · | **8** |
| 28 | ESTONIA CRESTS | · | 4 | · | · | · | · | · | 1 | · | · | **5** |
| 31 | HEDGEROW DASH | · | 2 | · | · | · | · | · | · | · | · | **2** |
| 32 | RED CENTRE RUN | 8 | 1 | · | · | · | · | · | · | · | · | **9** |
| 33 | RED BULL RING | 14 | 2 | · | · | · | · | · | · | · | · | **16** |
| 35 | SILVERSTONE | 2 | 2 | · | · | · | · | · | · | · | · | **4** |
| 36 | SPA-FRANCORCHAMPS | 10 | 3 | · | · | · | · | · | · | · | · | **13** |
| 37 | SUZUKA | 10 | · | · | · | 1 | · | · | · | 4 | · | **15** |
| 38 | NORDSCHLEIFE | 4 | 4 | · | · | · | · | · | · | · | · | **8** |
| 41 | MOUNT PANORAMA | 2 | 2 | · | · | · | · | · | · | · | · | **4** |
| 42 | RALLYCROSS ARENA | · | 4 | · | 2 | 2 | · | · | · | · | · | **8** |
| 43 | OULTON PARK | 6 | 1 | · | · | · | · | · | · | · | · | **7** |
| 45 | TOUR DE CORSE | · | · | · | 4 | · | · | · | · | · | · | **4** |
| 46 | VINEYARD VELOCE | · | · | · | 2 | · | · | · | · | · | · | **2** |
| 49 | HARBOR QUAY | · | · | · | · | · | 1 | · | · | · | · | **1** |
| 52 | COSTA BRAVA | · | · | · | · | · | 1 | · | · | · | · | **1** |
| 54 | COTE D AZUR | 6 | · | · | · | · | 2 | · | · | · | · | **8** |
| 55 | BRIDGE RUN | · | · | · | · | · | · | 1 | · | · | · | **1** |
| 56 | OLIVE CROSSING | · | · | · | · | 1 | · | · | · | · | · | **1** |
| 57 | MOUNTAIN TO SEA | · | · | 25 | · | · | · | 2 | · | · | · | **27** |
| | **all worlds** | **106** | **50** | **25** | **8** | **6** | **4** | **3** | **1** | **8** | **0** | **211** |
| | *worlds hit* | 17 | 19 | 1 | 3 | 4 | 3 | 2 | 1 | 2 | · | 29 |
| | *call site* | `track.js:17143` | `track.js:17070` | `track.js:10898` | `track.js:6551` | `track.js:16241` | `track.js:10547` | `track.js:4741` | `track.js:9743` | `various` | `—` | |

28 of 57 worlds carry nothing in the lane.

## 3. Finding × severity × where

| # | finding | sev | worlds | root cause | fix |
|---|---|---|---|---|---|
| 1 | Furniture in the drivable lane | **high** | 29 — 1, 4, 6, 8, 11, 12, 13, 23, 24, 25, 28, 31, 32, 33, 35, 36, 37, 38, 41, 42, 43, 45, 46, 49, 52, 54, 55, 56, 57 | eight call sites, no `_clearsRoad` | gate each push on `_clearsRoad(x, z, r, 1.8)` |
| 2 | Agent stalled against it (7 stalls) | **high** | 6 — 6, 11, 23, 38, 48, 57 | two stalls sit 2 samples from a mid-lane parapet | falls out with #1; four want eyes on screen |
| 3 | Route crosses itself at its own height | **high** | 1 — 57 | no vertical separation between passes | separate the decks or route through the bridge/tunnel path |
| 4 | Wall run inside the road width | med | 2 — 31, 43 | segment colliders laid at lateral 7–8 on a 9 u road | push the run beyond `widthAt + hw + carRadius` |
| 5 | START armed on a world that refuses it | med | 5 — 3, 7, 15, 16, 21 | `_syncStartButton()` never runs at boot | call it once after the profile and car load |
| 6 | Roster not swept by the old suites | med | roster-wide | `playtest-all` stops at 28, `test-affinity` at 21 | read the roster from `levels.js` |
| 7 | Player sank under the terrain | med | 1 — 32 | seen once at −7.43 u, did not reproduce | re-run with sample capture |
| 8 | Lap pace far below the roster median | low | 3 — 25, 45, 57 | TOUR DE CORSE spends 23 % of the lap off the road | check the racing line against the corridor |
| 9 | Documented counts stale | low | roster-wide | README says 18 worlds; the roster is 57 | derive the counts |

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
| render fps (SwiftShader — relative only) | 0.66 | 1.16 | 1.95 |
| solid colliders per world | 64 | 303 | 878 |

Frame rates are software-rendered and comparable only with each other — not
device performance.
