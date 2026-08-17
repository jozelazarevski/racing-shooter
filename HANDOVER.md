# HANDOVER — read this before touching anything

State at handover: `main` = r200, deployed and live, tree clean.
Live: https://jozelazarevski.github.io/racing-shooter/

## THE THREE THINGS THAT MATTER, IN ORDER

### 1. DONE (r199 + r200). The premise was wrong; read this before reusing it.
The "~15 posts standing in rural carriageways" DID NOT EXIST. The numbers came
from `fence.mjs`, whose filter let every geometry with no `width`/`height`
parameter through (`Math.abs(undefined - 0.18) > 0.005` is false, because NaN
comparisons are false). It was counting the sky dome, the world skirt, the haze
bands, the road itself and the start gantry. Real 0.18x1.05 posts on the two
named worlds: PINE VALLEY 15, HEDGEROW DASH 18, **0 on the road** — exactly what
r195 already claimed.

`tool-road-census` now walks `track.group.traverse` with exact point-to-OBB
distances, the game's own height constants, and SIX counted suppression classes.
It found four real defects, all the same one — **an offset is not a distance**,
the fifth and sixth times this repo has met it:

    sponsor boards   (r199)  68 of 419 in a carriageway, 15 worlds  -> 0
    forest corridors (r200)  SUZUKA: 14 SOLID boles on the road     -> 0
    cacti            (r200)  CANYON RUN: 6 on the road              -> 0
    flora mix        (r200)  DEEPWOOD: solid boles inside clearance -> 0
    marker posts     (r200)  CLIFF KNOT: 23 in a carriageway        -> 0

    roster bodies 399 -> 46      trunks inside clearance 482 -> 0

**The 46 that remain are all identified in COORDINATION.md r200 and none of
them needs a hunt.** 14 are RED CENTRE RUN's pylon legs, which are DELIBERATE
(the leg keeps its mesh and drops its collider — do not "fix" it); 8 are start
gantries; 8 are SEA CLIFF RUN / MOUNTAIN TO SEA, which is item 2 below showing
through; the rest are singletons under 6.8 u.

**Do not rebuild on "road furniture is the difficulty curve".** The instance
that theory named was a measurement artifact, and what really does stand in
rural carriageways is the crates, cones and barrels `_buildProps` puts there ON
PURPOSE — "NOT blockers — a car drives straight through one and accelerates".
The real finds above are worth having, but 68 boards and 14 trunks do not
explain finishing 8th of 8. Item 3 is now the first thing to do.

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

### 3. Rival pace — and the number that does not exist. NOW THE TOP ITEM.
Nobody has ever measured a competent HUMAN lap time on any world. Without it
there is no baseline to tune difficulty against. Measure that first; tuning
before you have it is guessing. r199 removed the theory that was standing in
for this measurement, so there is nothing left to hide behind.
Rivals circulate 0.5-0.9 laps/30 s and never wreck (8/8 alive, every run).

## MEASUREMENT DISCIPLINE — earned the hard way, do not skip
Four probes last session produced CONFIDENT WRONG ANSWERS. Each one nearly
shipped a fix for a bug that did not exist:
- an unsteered car at full throttle just drives off the road; its damage is
  crash damage, not a stall
- comparing a start index with an end index cannot tell +500 forward through
  the wrap from -400 backward — accumulate PER FRAME
- a parked player is not a stuck player; give it throttle AND steering
- `fence.mjs` counted everything that was not a Box, because `NaN > 0.005` is
  false, and its output was quoted into this file as a defect (r199). A test
  for a value must first test that the value EXISTS.
- `track.banners` holds sponsor boards AND guard-fence bays. Measuring the
  array without filtering `kind` reported 199 intrusions instead of 68 and
  would have moved guard rails away from the drops they exist to guard.
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
