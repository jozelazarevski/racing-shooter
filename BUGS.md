# BUGS — an agent drove all 57 worlds

An autopilot drove every world in the career with real control inputs and the
world audited around it. This is what it found, worst first, with the evidence
for each and the line that causes it. Nothing here is a guess: every claim is a
measurement, and the ones that did not reproduce say so.

Run it yourself:

```bash
python3 -m http.server 8901          # repo root, another shell
node tests/agent-sweep.mjs           # all 57 worlds, ~55 min
node tests/agent-sweep.mjs --levels 1,11,57 --secs 60
```

## How it was driven

`tests/agent-sweep.mjs` writes only the analog steer/throttle/brake a touch
player writes — never `pos`, never `heading`. It aims at the racing line at a
curvature-scaled lookahead and brakes on the rivals' own physics model
(`v = sqrt(aLat / curvature)` over the next 90 samples), so it laps at rival
pace: **median 1.39 laps per 60 s across the roster**, against ~1.33 for the
shipped AI on PINE VALLEY. Anything it cannot get past is something a player
cannot get past either.

Two things had to be solved first, and both are worth knowing:

- **The renderer, not the game, was the bottleneck.** SwiftShader draws these
  worlds at 0.5–1.3 fps, `dt` is clamped at 0.05, and a 30 s probe was covering
  ~3 s of race — which is why `playtest-all.mjs` has to accept 0.05 of a lap as
  "the AI made progress". With the composer stubbed during the drive the
  simulation runs at 60 fps and real time (measured sim ratio 0.95–1.00).
- **Five worlds refuse the stock car** (see #5). Fitted with snow tyres they
  drive clean.

## Status

Everything below was found on the roster as it stood at the top of this
branch. All of it has since been fixed on the same branch except where the row
says otherwise, and every fix was re-measured rather than assumed. The numbers
in each section are the ones that were found; the status line says where it
stands now.

| # | What | Severity | Worlds | Now |
|---|---|---|---|---|
| 1 | Trackside furniture standing in the drivable lane | **high** | 29 of 57 | **fixed** — 211 → 0 |
| 2 | The agent parked against it — 7 stalls | **high** | 6 | **fixed** — 7 → 0 |
| 3 | Flyover parapets in the road under them | **high** | 2 | **fixed** — see #3 |
| 3b | A car under a flyover collided with its parapet | **high** | roster-wide | **fixed** — MOUNTAIN TO SEA 0.18 → 1.09 laps/min |
| 4 | Wall runs laid inside the road width | med | 2 | **fixed** |
| 5 | START looks armed on a world that refuses it | med | 5 | **fixed** — gate itself removed upstream by r151 |
| 6 | Half the roster is not swept by the existing suites | med | — | **fixed** |
| 7 | A hole in the road — the car fell through the world | **high** | 1 | **fixed** — a gorge cut applied away from its own jump |
| 8 | Three worlds lap at half the roster's pace | low | 3 | **not a bug** — the rivals lap them at the same pace |
| 9 | Documented counts no longer match the roster | low | — | **fixed** |
| 10 | Routes that cross themselves at their own height | med | 2 | **open by design** — see below |

**#10, the one that is left.** OLIVE CROSSING crosses itself 11 times and
MOUNTAIN TO SEA 39 times with under 4 u of vertical separation. The overpass
planner asks for 11.5 u of lift and its eroder is allowed to take that back,
deliberately — in a dense knot a road you cannot drive up is worse than a low
deck. Both worlds now drive cleanly, because the dressing no longer pretends
there is a bridge where there is no clearance, and a crossing at grade is a
junction. But the routes still ask for more crossings than the terrain can
lift, and that is a route-design decision, not a bug to patch in the builder.

---

## 1. Trackside furniture standing in the drivable lane — 211 colliders, 29 worlds

**The rule it breaks.** RULES.md §3: *"Every marker beside a narrow section …
is pushed out until its collision face clears the declared drivable width:
`lateral ≥ widthAt + r + carRadius`. The width the road advertises is always
genuinely free at racing speed; clipping a marker means you were already off
the road."*

**What is there instead.** Measured at world build, on every world, counting
only colliders whose whole footprint sits *inside* the advertised half-width —
a car driving the centre of the road hits them:

| Source | file | signature | in lane | worlds |
|---|---|---|---|---|
| Culvert parapets | `src/track.js:17143` | stone r 1.4 | **106** | 17 |
| Ford depth markers | `src/track.js:17070` | wood r 0.35 | **50** | 19 |
| Overpass parapet rails | `src/track.js:10898` | stone r 1.2 | **25** | 1 (all MOUNTAIN TO SEA — see #3) |
| Start-gantry legs | `src/track.js:6551` | metal r 0.6 | 8 | 3 |
| Grandstand front | `src/track.js:16241` | metal r 2.5 | 6 | 4 |
| Quay cannons | `src/track.js:10547` | stone r 1.5 | 4 | 3 |
| Narrow-section striped posts | `src/track.js:4741` | metal r 0.45 | 3 | 2 |
| Trees (pine, cactus, acacia) | various | — | 8 | 2 (CANYON RUN, SUZUKA) |
| Roadside boulder | `src/track.js:9743` | stone r 2.7 | 1 | 1 |

Against the documented margin rather than the strict in-lane test, **1,884**
objects are inside the clearance the road promises.

**The cause is one mistake made eight times.** Each of these is placed at a
fixed lateral offset from *its own* sample and never checked against the rest
of the centreline. On a bend the lap curls back under the offset and the object
lands in a different stretch of road — at the same height, in the racing line.
PINE VALLEY's culvert parapets are pushed to `ROAD_HALF + 1.1` from the
crossing and end up at lateral **0.4 and 0.5** of samples 846 and 835.

The codebase already knows this. Three of these call sites sit directly
underneath a sibling that does it correctly:

- `track.js:17087` — the culvert **headwall** validates with `_clearsRoad`, and
  its comment says why: *"a headwall 3.5 u beyond the edge of a bend can be
  inside the carriageway once the lap curls back under it … If the stonework
  cannot stand clear of the road it does not get built."* The **parapet** 56
  lines below it does not make that call.
- `track.js:4754` — the narrow-section **stone teeth** validate, with the
  comment *"fine at this sample, inside the road two samples later where the
  centreline swings under it — that is the rock you cannot see coming."* The
  **striped posts** 13 lines above, in the same loop, do not.
- `track.js:17070` — the ford **depth markers** are offset along the *river's*
  bearing, so any crossing that is not perpendicular to the road puts both
  posts in the carriageway. Measured on PINE VALLEY: lateral 5.3 and −7.1.

**Fix.** Gate every one of these pushes on the check that already exists:

```js
if (!this._clearsRoad(x, z, r, 1.8)) continue;   // 1.7 for trees
```

Eight call sites — `4741`, `6551`, `9743`, `10547`, `10898`, `16241`, `17070`,
`17143`.
That clears all 211. Two of them (parapets, ford markers) are 156 on their own.

**Worst worlds:** MOUNTAIN TO SEA 27, RED BULL RING 16, SUZUKA 15,
SPA-FRANCORCHAMPS 13, REDWOOD RAMPAGE 12, SUMMIT CLIMB 10.

**Not this:** ROCKFALL RAVINE's three in-road stone colliders are *landed
rockfall*, which belongs in the road for 18 s by design. The sweep now skips
solids carrying `_faller`.

---

## 2. The agent parked against it — 7 stalls on 6 worlds

A stall is three seconds with no lap progress while the agent is trying to
drive. Two of the seven are directly attributable to #1 — the car stopped within
two samples of a mid-lane parapet:

| World | stalled at | what is there |
|---|---|---|
| OASIS AMBUSH | sample 474 | parapets at 476 and 488, lateral **0.1** |
| OUNINPOHJA | sample 684 | parapets at 686 and 702, lateral **0.7** |
| SUMMIT CLIMB | sample 606 | half-width 5.4 — a pinch |
| NORDSCHLEIFE | sample 266 | speed 0, on the road, half-width 9 |
| DOLOMITI CORSA | sample 405 | on the road, half-width 9 |
| MOUNTAIN TO SEA | samples 359, 514 | on an elevated deck, ground 6–9 u below |

The last four have no collider on record at the stall point and want a look on
screen — a stall in the middle of a 9 u road with nothing in the inventory is
either geometry or a physics corner the audit does not model.

---

## 3. MOUNTAIN TO SEA crosses itself at its own height

The lap has **127 places** where two stretches more than 40 samples apart pass
within 12 u of each other, and **58 of them are within 4 u vertically** — e.g.
samples 147 and 364 at 3.1 u apart in plan and 3.4 u in height. At that
separation the two roads are the same piece of ground.

(The first sweep said 6. That was the harness counting a list it had already
truncated to six examples; `agent-sweep.mjs` now counts before it slices. The
finding is four times worse than first reported, not better.)

This is also why it holds the roster's worst collider count (27, and 25 of them
are overpass rails from `track.js:10898`): the bridge's own parapets fall into
the road it is supposed to be bridging. It is the slowest-but-two world on the
roster (0.79 laps/60 s against a 1.39 median) and it took two of the seven
stalls, both on an elevated deck with the terrain 6–9 u below.

Either give the crossings real vertical separation or route them through the
tunnel/bridge machinery the other Mediterranean worlds use.

---

## 3b. A car under a flyover collided with its parapet

Found while fixing #3, and the deepest thing in this report.

The barrier test knew when a car had **cleared** a wall — `pos.y` above the
coping — and nothing about a car **underneath** one. A wall spans `y` to
`y + h`, so a parapet on a deck ten units overhead was still a wall in the face
of anything driving the leg below it.

MOUNTAIN TO SEA carries nine crossings on one lap, which is what made it
visible: driven, the whole field was pinned within a few samples of the grid —
the agent covering **0.18 of a lap in a minute** against a roster median of
1.39, the five rivals moving **0.003 between them**, one of them dead where it
stood. It read as a world with impassable scenery; it was the physics.

With the test completed — a car more than a car's height below a wall's base is
under it, not against it — the same world drives **1.09 laps** in the minute
with no stalls, and the rivals race. `src/vehicles.js`, the `t.barriers` block.

This one was roster-wide in reach: every world with a flyover was paying some
of it.

---

## 4. Wall runs laid inside the road width

Dry-stone field walls sitting inside the advertised 9 u, rather than beyond it:

- **HEDGEROW DASH** — sample 291, both ends at lateral −8.0
- **OULTON PARK** — sample 255, both ends at lateral −7.4

A wall is a segment collider, so this is a continuous barrier a metre inside
the road edge, not a single clippable post.

---

## 5. START looks armed on a world that refuses it

Load `?level=3` (or 7, 15, 16, 21) and the button reads **"START RACE"** with
no `blocked` class, while `carFitness(3).ok === false`. Pressing it does
nothing visible: `startRace()` returns early at the tyre gate, feeds two HUD
lines and switches to the garage tab. The world stays on the title screen.

`_syncStartButton()` (`src/main.js:1799`) is called on a level pick, a car pick,
an upgrade and a mode switch — **never on boot**. So the button is only correct
after you have already pressed it once, and its own doc comment says that is
the wrong way round: *"A button that looks armed and then refuses is worse than
one that tells you first."*

This is not only a hand-typed URL: the career's own "next world" transition
falls back to `fadeTo('?level=N')` (`src/main.js:2445`, `2953`), which is a page
load, so advancing into a snow world lands on the mis-painted button.

**Fix.** Call `_syncStartButton()` once during boot, after the profile and car
are loaded.

The gate itself is working as designed — the stock BRAWLER is legal on **52 of
57** worlds and the five snow worlds want a 600 CR set. Worth a design look
separately: FROST PEAK is world 3, and 600 CR is a wall in front of a world the
career offers early.

---

## 6. Half the roster is not swept by the existing suites

- `tests/playtest-all.mjs:11` — `for (let lvl = 1; lvl <= 28; lvl++)` on a
  57-world roster. Worlds 29–57 — every MEDITERRANEAN, GRAND CIRCUITS,
  HEARTLAND, FARMLAND, OUTBACK and OLD TOWN world — have never been swept. Six
  of the eight worst worlds in #1 are in that range.
- `tests/test-affinity.mjs:32,147` — `lvl <= 21`.

Both should read the roster from `src/world/levels.js` the way
`tests/agent-sweep.mjs` does, so a world added tomorrow is swept tomorrow.

---

## 7. There was a hole in the road — RED CENTRE RUN

The first drive recorded the car **7.43 u below `terrainHeight`**; a second did
not reproduce it; a third hit it again at −3.38 u. Intermittent because it
depended on where the lap happened to take the car.

It is not a physics glitch. A jump gorge is a **trench** — this one 190 u long
and 24 u deep — and the collapse was applied to the road *wherever the trench
passed under it*, on distance alone, with nothing tying it to the crossing it
was designed for. RED CENTRE RUN's lap meets that trench twice, so it got two
holes and one jump: the designed crossing at sample 416 with its raised lips,
its gap warning and its launch, and a bare **21.75 u drop at samples 95–106**
with nothing to read it by and nothing to clear it with. Measured there: road
surface −0.4, ground under its own centreline −21.2.

Away from its own crossing the road now bridges the trench, which is what a
road does when it meets a ravine it was not built to jump. `src/track.js`, the
`_jumpCut` loop.

**The audit could not have caught this, so the audit changed.** Nothing stood
in the lane, nothing was drawn wrong, every collider check passed — the floor
simply was not there. `tests/world-matrix.mjs` now walks out from each
centreline until the physics ground drops away, and reports any sample whose
edge falls inside the width the road advertises. Declared gorges are excepted,
because a jump is supposed to have no floor.

---

## 8. Three worlds lap at half the roster's pace — and that is correct

Median is 1.39 laps per 60 s; TOUR DE CORSE managed 0.67 and PIKES PEAK 0.74.
I wrote that the racing line and the road must therefore disagree. Measured,
they do not: across all three worlds, **zero** samples put the line plus a
car's width outside the corridor.

They are simply tight. Minimum corner radius is 17.3 u on TOUR DE CORSE, 16.2
on PIKES PEAK and 15.2 on COL DE TURINI, against a lateral budget worth about
27 u/s through a 17 u corner. The shipped rivals agree: driven on TOUR DE
CORSE they lap at **0.68–0.72** — the same pace — with **0 %** of samples off
the road.

So these worlds are slow by design, and the off-road fraction was my autopilot
running wide on hairpins rather than anything in the world. Left here rather
than deleted, because the first version of this section diagnosed it wrongly
from a single number.

---

## 9. Documented counts no longer match the roster

The roster is 57 worlds. These say otherwise:

- `README.md:7,86` — "eighteen themed worlds across six regions", "18 worlds in
  6 regions".
- `src/main.js:2057` — starCost's comment, "on the 32 worlds that ship today".
- `src/main.js:1652` — carFitness's comment, "legal on 53 of 58". Measured: **52
  of 57**.
- `src/world/levels.js` — star costs are not monotonic in career order: RED BULL
  RING (id 33) costs **5★** immediately after RED CENTRE RUN (id 32) at **12★**.
  Deliberate for a fresh region, per the code's own note, but it does mean the
  cheapest unraced world on the list is not the next one on it.

---

## Appendix — every world, driven

`laps in 60 s` is the agent's lap progress; `stuck` is three-second stalls;
`colliders in lane` is the build-time count from #1.

| # | world | laps in 60 s | stuck | colliders in lane |
|---|---|---|---|---|
| 1 | PINE VALLEY | 1.29 | 0 | 7 |
| 2 | DUST CANYON | 1.78 | 0 | 0 |
| 3 | FROST PEAK | 1.39 | 0 | 0 |
| 4 | CANYON RUN | 1.22 | 0 | 6 |
| 5 | EMBER PASS | 1.54 | 0 | 0 |
| 6 | SUMMIT CLIMB | 1.14 | 1 | 10 |
| 7 | GLACIAL PASS | 1.63 | 0 | 0 |
| 8 | AMAZON RAPIDS | 1.28 | 0 | 5 |
| 9 | THE DUNE SERPENT | 1.49 | 0 | 0 |
| 10 | ROCKFALL RAVINE | 1.06 | 0 | 0 |
| 11 | OASIS AMBUSH | 1.42 | 1 | 9 |
| 12 | REDWOOD RAMPAGE | 1.12 | 0 | 12 |
| 13 | LOG FLUME FURY | 1.57 | 0 | 6 |
| 14 | FOREST FIRE ESCAPE | 0.97 | 0 | 0 |
| 15 | GLACIER'S GRIND | 1.83 | 0 | 0 |
| 16 | AVALANCHE ALLEY | 1.08 | 0 | 0 |
| 17 | NEON GRID EXPRESSWAY | 1.15 | 0 | 0 |
| 18 | UNDERCITY SLIPSTREAM | 1.39 | 0 | 0 |
| 19 | GOTTHARD CLIMB | 1.09 | 0 | 0 |
| 20 | TREMOLA DESCENT | 1.10 | 0 | 0 |
| 21 | FURKA RIDGE | 1.01 | 0 | 0 |
| 22 | COL DE TURINI | 0.96 | 0 | 0 |
| 23 | OUNINPOHJA | 1.90 | 1 | 8 |
| 24 | FAFE LEAP | 1.73 | 0 | 4 |
| 25 | PIKES PEAK | 0.74 | 0 | 8 |
| 26 | SAFARI PLAINS | 1.44 | 0 | 0 |
| 27 | CORNICHE | 1.31 | 0 | 0 |
| 28 | ESTONIA CRESTS | 1.39 | 0 | 5 |
| 29 | OLIVE COAST | 1.42 | 0 | 0 |
| 30 | LANTERN QUARTER | 1.38 | 0 | 0 |
| 31 | HEDGEROW DASH | 1.34 | 0 | 2 |
| 32 | RED CENTRE RUN | 0.96 | 0 | 9 |
| 33 | RED BULL RING | 1.43 | 0 | 16 |
| 34 | MONACO STREETS | 1.74 | 0 | 0 |
| 35 | SILVERSTONE | 1.43 | 0 | 4 |
| 36 | SPA-FRANCORCHAMPS | 1.32 | 0 | 13 |
| 37 | SUZUKA | 1.44 | 0 | 15 |
| 38 | NORDSCHLEIFE | 1.50 | 1 | 8 |
| 39 | MONZA | 2.08 | 0 | 0 |
| 40 | MARINA BAY | 1.52 | 0 | 0 |
| 41 | MOUNT PANORAMA | 1.58 | 0 | 4 |
| 42 | RALLYCROSS ARENA | 1.80 | 0 | 8 |
| 43 | OULTON PARK | 1.52 | 0 | 7 |
| 44 | LAGUNA SECA | 1.48 | 0 | 0 |
| 45 | TOUR DE CORSE | 0.67 | 0 | 4 |
| 46 | VINEYARD VELOCE | 1.12 | 0 | 2 |
| 47 | DEEPWOOD TRAIL | 1.29 | 0 | 0 |
| 48 | DOLOMITI CORSA | 0.98 | 1 | 0 |
| 49 | HARBOR QUAY | 1.90 | 0 | 1 |
| 50 | CINQUE TERRE | 1.53 | 0 | 0 |
| 51 | AEGEAN BLUE | 1.55 | 0 | 0 |
| 52 | COSTA BRAVA | 1.28 | 0 | 1 |
| 53 | DALMATIA DRIVE | 1.56 | 0 | 0 |
| 54 | COTE D AZUR | 1.31 | 0 | 8 |
| 55 | BRIDGE RUN | 1.24 | 0 | 1 |
| 56 | OLIVE CROSSING | 1.11 | 0 | 1 |
| 57 | MOUNTAIN TO SEA | 0.79 | 2 | 27 |

## What came back clean

Worth recording, because it is most of the game:

- **No NaN**, in player or AI state, on any world.
- **No AI stuck, no AI out of the world, no free lap at the grid** — every
  rival made real progress on all 57.
- **No page errors and no failed requests** on any world.
- **No pickup off the road plane** — 0 of 14 per world, on all 57.
- **No declared hazard that failed to build** (geysers, strips, critters).
- **No vertical step in a road surface** above 2.5 u, and no grade past what the
  car can climb (worst sustained: NORDSCHLEIFE 0.32, DOLOMITI CORSA 0.30).
- **28 of 57 worlds carry nothing at all in the lane.**

## Not covered

- **`dustline/`**, the second game, has three tracks of its own and is not
  swept here. Its `npm` dependencies are not installed in this environment, so
  `verify:track`, `verify:sdf` and `verify:generated` all fail on a missing
  `three` — an environment gap, not a finding. It needs `npm install` and its
  own pass.
- **Free roam and missions.** The sweep drives RACE mode only.
- **Real-GPU frame rate.** Every world here draws at 0.5–1.3 fps under
  SwiftShader; the numbers are only meaningful relative to each other (slowest:
  BRIDGE RUN 0.49, AMAZON RAPIDS 0.54, TREMOLA DESCENT 0.56). Do not quote them
  as device performance.
