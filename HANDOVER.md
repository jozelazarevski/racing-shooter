# HANDOVER — read this before touching anything

State at handover: `main` = r198, deployed and live, tree clean.
Live: https://jozelazarevski.github.io/racing-shooter/

## THE THREE THINGS THAT MATTER, IN ORDER

### 1. Road furniture IS the difficulty curve — finish clearing it
The single most important realisation of the last session, and it reframes
everything else.

The AI follows a precomputed racing line and never touches trackside furniture.
The player does. So every object standing in a carriageway is a penalty applied
ONLY to the human. That is most of why the owner finishes 8th of 8 on every
screenshot (12:53, 12:56, 12:58, 13:59, 14:23 — five sessions, five last
places, different tracks) while rivals finish 8/8 alive.

It is NOT a damage bug. `Car.damage()` gives the PLAYER a discount (0.62x on
normal, 0.45x easy); AI cars take full damage. Do not go looking there again.

STILL BROKEN: ~15 posts stand in rural carriageways — PINE VALLEY 3,
HEDGEROW DASH 12, worst bite **9.5 u into a 9 u half-width**, i.e. dead centre.
The builder is UNIDENTIFIED. A literal grep for `0.18 x 1.05` finds only
`_buildJunctionFences` (mine, and it is clean — proven by stashing it and
re-counting), so the offenders build with COMPUTED dimensions and text search
will not find them.

THE JOB: `tests/tool-road-census.mjs` only walks `track.solids`. That blind
spot has now hidden three separate defect classes — barriers (fixed r191),
bridge piers (r193), and these posts. Extend it to walk the built scene graph
(`track.group.traverse`) and measure every mesh against the carriageway, then
clear what it finds. `scratchpad/fence.mjs` already does exactly this walk and
is the starting point.

### 2. SEA CLIFF RUN (level 60) — 80 u of road stacked on road
Measured, specific, untouched:
- samples **530-566 run directly over 655-682**
- centreline gap falls to **1.91 u**; under 18 u for ~80 u of lap
- vertical separation only 1.48-6.35 u
- both legs are on the racing line (~60% and ~74% of the lap)

Cause: `_planOverpasses` only fires on a true XZ segment INTERSECTION. This is
a near-parallel pass, so no crossing is registered, no deck, no ramp — the two
carriageways simply interpenetrate. `_checkLayout` does not warn because it
prints only the single global minimum, which here is the legitimate overpass
at 610/707 elsewhere on the lap.

FIX SHAPE: register near-miss pairs as crossings so the clearance solver
handles them. This touches the code r197 just changed — measure all eight
overpass worlds with `scratchpad/gaps.mjs` before and after.

### 3. Rival pace — and the number that does not exist
Nobody has ever measured a competent HUMAN lap time on any world. Without it
there is no baseline to tune difficulty against. Measure that first; tuning
before you have it is guessing.
Rivals circulate 0.5-0.9 laps/30 s and never wreck (8/8 alive, every run).

## MEASUREMENT DISCIPLINE — earned the hard way, do not skip
Four probes last session produced CONFIDENT WRONG ANSWERS. Each one nearly
shipped a fix for a bug that did not exist:
- an unsteered car at full throttle just drives off the road; its damage is
  crash damage, not a stall
- comparing a start index with an end index cannot tell +500 forward through
  the wrap from -400 backward — accumulate PER FRAME
- a parked player is not a stuck player; give it throttle AND steering
- traffic owns its own `requestAnimationFrame`. The fixed-step `g.frame()`
  harness NEVER drives it, and its clock runs ~0.125 s per real second under
  swiftshader — a 9 s crossroad wait needs ~75 s of wall clock. A 20 s sample
  proves nothing.

ALWAYS baseline against pristine `origin/main` served on a second port. Two
regressions last session were caught only that way (the gantry that moved
DEEPER into the road, 4.52 -> 7.59 u; and `test-jumps`' FURKA failures, which
turned out to be pre-existing).

## TRAPS
- `git reset --hard origin/main` to realign the branch DISCARDS uncommitted
  work. It ate two edits last session. Commit first, always.
- `test-surface.mjs` and `test-menu-noreset.mjs` HARDCODE port 8901 and ignore
  `BASE`. They fail to connect silently and read as "not run".
- `pgrep -f 'ab\.mjs'` also matches `srvlab.mjs`. Killing probes has killed the
  static server mid-run more than once. Use `scratchpad/keep.sh` to hold a
  server up across tool-call timeouts.
- Version bump is 4 sites in index.html + 1 in sw.js: `sed -i 's/rNNN/rNNN+1/g'`

## POLICY, SET BY THE OWNER
- `V2/` is a SEPARATE bundled build, live at `/racing-shooter/V2/`.
  **Deliberately NOT kept in sync.** Do not port fixes into it. A defect found
  there is not a defect in this game.
- `origin/kimi-overpass-3052a9a` holds a third-party commit that briefly
  replaced `main` (force-pushed back at the owner's instruction, after saving
  it). It claims to fix "overpass terrain clipping and detection bugs" — the
  same area as r190-r197. If it is ever revived, DIFF IT FIRST; otherwise the
  same bug gets solved twice, incompatibly.

## MOUNTAIN TO SEA'S VIADUCT — two dead ends, do not repeat them
Both tried to remove deck height AFTER the solve. Both failed the same way:
the inherited height is LOAD-BEARING for the neighbouring crossing.
- rebuild-from-requirement + re-erode: over-14 u went 3 -> 0, but one crossing
  fell to **4.1 u** — undriveable.
- the same trim gated on a 10.5 u floor: all keep-levels failed the floor, a
  no-op on all five overpass worlds.
r197 solved it from the other end — shorten the ramp so they never overlap
(`HALF` scales with crossing count). Peak 17.39 -> 15.04, over-14 3 -> 1, none
undriveable. The 0.72 floor is deliberate: at 0.62 a crossing hit 9.53 u, under
the 9.65 u where `nearestIndex` can capture the wrong leg.

## TOOLS (in the session scratchpad — copy anything you want to keep)
`gaps.mjs` every crossing's clearance + grade p90/max, per world — the
            acceptance test for any overpass change
`fence.mjs` walks scene meshes and measures them against the carriageway —
            the basis for the census extension in item 1
`ab.mjs`    before/after across both builds: clearance, grade, index correctness
`srv.mjs`   plain static server; `keep.sh` keeps it alive across timeouts

## OPEN, LOWER PRIORITY
- `test-jumps`: 2 pre-existing FURKA RIDGE failures — "0 jumps in 90 s" on a
  stage whose whole point is crests. Suspicious in its own right.
- The "I jump straight up" report is UNREPRODUCED. The trace showed an ordinary
  ramp launch (ground rising 12 u/s for 10 frames, vy 8.9, under the cap).
  Needs the track name and whether it happens driving INTO a bank or sitting on
  one.
- iOS cannot lock orientation from a manifest and has no meta equivalent. If
  landscape lock matters it needs an in-page portrait prompt — a design call.
