# HANDOVER — read this before touching anything

State at handover: `main` = r223, deployed and live, tree clean.
Live: https://jozelazarevski.github.io/racing-shooter/

## THE ONE DEFECT THIS REPO KEEPS SHIPPING

Every real find of the last two sessions is the same mistake wearing a
different builder's clothes:

> **Something computes a position that clears the road AT ONE SAMPLE, and
> nothing asks how far the thing reaches from it.**

Sponsor boards, forest corridors, cacti, marker posts, bridge piers, arch
faces, deck rails, the start gantry, the banner boards, the rail bays. Ten
builders, one bug. `_distToTrack` searches the whole lap and answers it;
`_clearsRoad` is flat and cannot answer the 3-D form, which is what
`_pierInRoad` exists for.

r207 found the same shape one level up, in an EXEMPTION rather than a
placement, and r209 fixed it: `_buildEdgeRails` skipped any station within 40
samples of a gorge, overpass or tunnel on the grounds that those build "its own
rails". The exemption was 40 samples wide; the thing it defers to is not. **A
promise made over a wider span than the thing that keeps it.** See item 2 — and
look for the same shape next in `tunnelFitAt`, `_buildStoneBridges` and the
26-30 sample start-gate skip every builder carries.

## THE THREE THINGS THAT MATTER, IN ORDER

### 1. Rival pace — and the number that does not exist. STILL THE TOP ITEM.
Nobody has ever measured a competent HUMAN lap time on any world. Without it
there is no baseline to tune difficulty against. Measure that first; tuning
before you have it is guessing. Rivals circulate 0.5-0.9 laps/30 s and never
wreck (8/8 alive, every run).

The theory that used to stand in for this measurement — "road furniture is the
difficulty curve" — was killed in r199 and must not be rebuilt. The instance it
named was a measurement artifact (see MEASUREMENT DISCIPLINE). What really does
stand in rural carriageways is the crates, cones and barrels `_buildProps` puts
there ON PURPOSE: "NOT blockers — a car drives straight through one and
accelerates."

Note the asymmetry that makes any of this matter: the AI follows a precomputed
racing line and never touches trackside furniture. The player does. So every
obstacle, and every open corner, is a penalty or an advantage applied to the
human alone.

### 2. DONE (r209). The gorge exemption is fixed; do not re-add it.
`_buildEdgeRails` used to skip any station within 40 samples of a gorge,
overpass or bore because those "build its own rails" — a promise 40 samples
wide kept by something much narrower, and it was every long unwalled corner in
the game (SEA CLIFF RUN 749-761, GLACIER COL 753-774, TIMBER GORGE 307-330).

Now only a JUMP GORGE is exempt, at full width, because a rail across a launch
or a landing is a wall in the flight path. The hero gorge and overpass decks
fall through to the `guarded` test, which skips only where masonry actually
stands — it can, because the deck and bridge builders run BEFORE the rail
builder (8872 and 8895 against 8898). Swept over eleven worlds, no regressions:

    GLACIER COL   76 -> 90%    TIMBER GORGE  78 -> 94%    OLIVE PASS  71 -> 88%
    SEA CLIFF RUN 64 -> 71%    TERRAZZA ALTA 82 -> 85%
    the four with no gorge in the way: unchanged, as they should be

`test-cornerwalls`' `KNOWN_OPEN` list is EMPTY as a result. Keep it that way —
adding to it needs a name, a measured number and a reason, and raising
`MAXOPENRUN` instead would hide the next one on every world at once.

### 3. SEA CLIFF RUN (level 60) — 80 u of road stacked on road
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
handles them. This touches the code r197 changed — measure all eight overpass
worlds with `scratchpad/gaps.mjs` before and after. Law 4 of
`tests/test-roadclear.mjs` pins the current list so a fourth does not appear
unnoticed.

## THE GATES — run these before claiming anything

    tests/test-roadclear.mjs     4 laws about what may stand near a carriageway
    tests/test-cornerwalls.mjs   3 laws about whether a corner can be cut
    tests/test-mountainrun.mjs   the four in-mountain worlds are enclosed, and
                                 OLIVE COAST is the CONTROL that must stay open
    tests/test-tunnels.mjs       every bore driven in one portal and out the other
    tests/test-carriageway.mjs   the r199/r200 clearance fixes, pinned
    tests/test-edgerails.mjs     rails are solid, one draw call, off the road

`tool-road-census.mjs`, `tool-tree-clearance.mjs`, `tool-banner-clearance.mjs`
and `tool-overlap-census.mjs` are EXPLORERS: they print numbers and exit 0, and
they are how each defect above was found. The gates are the other half.

## MEASUREMENT DISCIPLINE — earned the hard way, do not skip
Probes have produced CONFIDENT WRONG ANSWERS repeatedly. Each nearly shipped a
fix for a bug that did not exist:
- **A test for a value must first test that the value EXISTS.** `fence.mjs`
  counted everything that was not a Box, because `Math.abs(undefined - 0.18) >
  0.005` is false — NaN comparisons are false. Its output was quoted into this
  file as a defect. The same shape has now appeared three times: `_erased(NaN,
  NaN)` meant the editor's eraser had never reached the desert.
- **Inference from a derived number is not a measurement.** A code comment
  claimed "RED CENTRE RUN starts at y = 5.4", derived by arithmetic from census
  output. A direct sweep said -3.99.
- **A cap that bites in silence reads as success.** TERRAZZA ALTA built 340 of
  the 374 rail bays it asked for and looked walled from every angle except the
  one that mattered. If a builder bounds anything, publish what it refused.
- **Ask the page, do not wait for the screenshot.** `Identifier 'bk' has already
  been declared` is a runtime binding error that `node --check` passes. Two
  screenshots silently failed to render before anyone asked the page for its
  `pageerror` list. `scratchpad/err.mjs` does that.
- `track.banners` holds sponsor boards AND guard-fence bays. Measuring the
  array without filtering `kind` reported 199 intrusions instead of 68.
- Judge a decal by its NORMAL, not its aspect ratio: an upright 9x2.2 sponsor
  board was reported as a puddle.
- An unsteered car at full throttle just drives off the road; its damage is
  crash damage, not a stall. A parked player is not a stuck player — give it
  throttle AND steering.
- Comparing a start index with an end index cannot tell +500 forward through the
  wrap from -400 backward — accumulate PER FRAME.
- Traffic owns its own `requestAnimationFrame`. The fixed-step `g.frame()`
  harness NEVER drives it, and its clock runs ~0.125 s per real second under
  swiftshader — a 9 s crossroad wait needs ~75 s of wall clock.

ALWAYS baseline against pristine `origin/main` served on a second port
(working tree 8920, pristine 8930 by convention). Regressions have been caught
only that way: the gantry that moved DEEPER into the road (4.52 -> 7.59 u), and
`test-jumps`' FURKA failures, which turned out to be pre-existing.

## TRAPS
- `git reset --hard origin/main` to realign the branch DISCARDS uncommitted
  work. It has eaten edits twice. Commit first, always.
- `test-surface.mjs`, `test-menu-noreset.mjs` and `test-affinity.mjs` HARDCODE
  port 8901 (affinity uses `127.0.0.1:8901`) and ignore `BASE`. They do not
  fail loudly — they throw a connection error that scrolls past and reads as
  "not run", and `| tail` hides it completely. Serve the tree on 8901 as well
  (`setsid node tools-scratch/srv.mjs 8901 &`) before believing any of them.
- `pgrep -f 'ab\.mjs'` also matches `srvlab.mjs`. Killing probes has killed the
  static server mid-run more than once. Use `scratchpad/keep.sh`.
  The same trap in its other form: `pkill -f "test-river.mjs|..."` matches the
  SHELL RUNNING THAT VERY COMMAND, so it kills the run it just started along
  with every wait-loop watching for it. Don't reach for `pkill` with a pattern
  that could match your own command line.
- **A DOUBLE COMMA IN AN ARRAY LITERAL IS NOT A SYNTAX ERROR.** Appending to
  `LEVELS` produced `] },,` — a HOLE, which `node --check` accepts happily
  because `[a, , b]` is valid JS. The game then died on
  `Cannot read properties of undefined (reading 'id')` from `totalStars`. Same
  lesson as the `ELEMENTS`/`HOUSE_TEMPLATES` break: a syntax check is necessary
  and never sufficient — boot the game.
- **`kill -0 $!` after `nohup ... &` races.** `$!` is the wrapper, not node, so
  an `until ! kill -0 $PID` loop can fall through while the test is still
  running — it reported test-river "finished" with 15 PASS and no closing line,
  which reads exactly like a crash. Wait on a marker file the job writes when
  it is genuinely done (`... ; echo ALLDONE > sweep.done`).
- **Version bump is 4 sites in index.html + 1 in sw.js**: `sed -i
  's/rNNN/rNNN+1/g' index.html && sed -i 's/rNNN/rNNN+1/' sw.js`. The service
  worker caches by version name; without the bump the deploy serves the old
  bundle and the change looks like it did nothing. This has happened.
- Deploy runs ONLY on push to `main` (`.github/workflows/deploy.yml`). Work
  sitting on the feature branch is not live, however green it is.
- **A GREEN WORKFLOW IS NOT A DEPLOY.** Pages publishing is TWO workflows: ours
  ("Deploy to GitHub Pages") only pushes the `gh-pages` branch, and GitHub's own
  "pages build and deployment" is what actually serves it. r208 was reported as
  live on the strength of the first one while the second had failed 503 in a
  GitHub outage, and the owner had to correct it. The ONLY proof is fetching a
  path that exists in the new build and not the old one — a 404 there means
  unpublished, and no amount of waiting for a CDN changes that.
- **`node --check src/foo.js` IS NOT A SYNTAX CHECK IN THIS REPO, AND EXITS 0
  ON GARBAGE.** There is no `package.json`, so node parses `.js` as CommonJS,
  hits the ESM `import` on line 1, retries as ESM, and on that fallback path
  prints nothing and EXITS 0. Verified: append a literal `@@@garbage@@@` line to
  `src/vehicles.js` and `node --check` passes it. It was passing a file whose
  block comment closed twice. Copy to `.mjs` and check THAT — and read node's
  own exit status, not a pipeline's (`node --check x.mjs | head` reports
  `head`'s 0 and hides the error, which cost a second round here):

      cp src/foo.js /tmp/s.mjs && node --check /tmp/s.mjs; echo $?

  `.mjs` files under `tests/` are checked correctly as they are. Any check of a
  `.js` file needs a POSITIVE CONTROL — break a copy on purpose and require the
  checker to say so — because this one failed silently for a whole session.
- **A GATE READ THROUGH `| tail` IS NOT A GATE RUN.** A capture of
  `test-goat.mjs` ended `23 passed, 3 failed` with exactly ONE `FAIL` line in
  the file, because the runner tailed it — the other two scrolled off and the
  fragment read like a single near-miss. Related: `| grep PASS` with no
  `--line-buffered` writes NOTHING until the process exits, so a long gate looks
  hung. Capture whole, filter after.
- World generation is seeded (`Math.random = seededRandom(seed)`). Changing how
  many of ANYTHING a builder makes cascades through the RNG stream and moves
  unrelated scenery. Diff what you did not mean to change.

## POLICY, SET BY THE OWNER
- `V2/` is a SEPARATE bundled build, live at `/racing-shooter/V2/`.
  **Deliberately NOT kept in sync.** Do not port fixes into it. A defect found
  there is not a defect in this game.
- `origin/kimi-overpass-3052a9a` holds a third-party commit that briefly
  replaced `main` (force-pushed back at the owner's instruction, after saving
  it). It claims to fix "overpass terrain clipping and detection bugs" — the
  same area as r190-r197. If it is ever revived, DIFF IT FIRST.

## THE OLIVE FAMILY — what "make more like the one I enjoy" turned out to mean
The owner named OLIVE COAST (id 29) as the world he enjoys most. r205 added
three siblings; r207 had to fix them, because a sibling needs its own ROAD:

    62 CAPE OLIVETO   route liguriaRun  relief 32.9 u  3 bores   INSIDE MOUNTAINS
    63 TERRAZZA ALTA  route corse       relief 27.5 u  42% tight the hill climb
    64 SALINE SPRINT  route monza       relief  5.3 u  no bores  the flat one

r208 turned 62 from the headland one into the mountain one, on request. Read
`_valleyWall` before touching terrain: a MASSIF IS RADIAL and can only close a
closed lap from outside, and global `_hillNoise` has no wavelength short enough
to be a corridor — so neither produces a valley, and both look like they should.
Measured, no world on this roster ran inside mountains before it; SUMMIT CLIMB,
an alpine world, scores 0 walled flanks of 156. `valleyWalls` is opt-in and
`tests/test-mountainrun.mjs` keeps OLIVE COAST as the control that it stays so.

## THE IN-MOUNTAIN FAMILY (62, 65, 66, 67)
r209 added three more on request. `h / run` is the flank's GRADE and `run` is
how far off the road the wall stands, so they differ in the SHAPE of the
valley, not its height:

    65 GRANITE NARROWS  dolomiti  ouninpohja   64/130 = 49%  100% enclosed, 2 bores
    66 GLACIER COL      furka     panorama    135/360 = 38%   96% enclosed, 1 bore
    67 TIMBER GORGE     deepwood  estonia      74/250 = 30%   96% enclosed, 1 bore

**`valleyWalls` DOES NOT WALL A CORNER, and assuming it does is the trap.**
`_valleyWall` returns ZERO inside the corridor blend, so the first ~70 u either
side of the road stays at road height. It encloses a LAP; only edge rails stop
a corner being cut. GRANITE NARROWS scores 35% on `test-cornerwalls` against
the family's 76-78% and that is real, not covered by its mountains.

The first cut gave all three a `tune` — elevation, tunnels, bridges, coast —
and left the plan alone, so all four worlds shared OLIVE COAST's exact
centreline: identical plan digest, identical sample-100 coordinates, the same
93 tight stations. **Same corners in the same order is the same track wearing a
different hat, however different the profile over it.** Distinct authored
routes are the pattern the roster already uses (CITADEL BAY on AEGEAN BLUE's,
OLIVE PASS on COL DE TURINI's). `scratchpad/plan.mjs` computes the plan-only
digest that catches this.

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

Related, same lesson: clamping the sea floor AFTER the overpass solve cost COTE
D AZUR 11.5 -> 7.5 u of clearance. Moving the clamp INSIDE `sink()` restored
11.25.

## `roadWidth` — MOUNTAIN TO SEA IS 5x AND THE CASCADE IS NOT FINISHED
`tune.roadWidth` multiplies the one profile `widthAt(i)` serves. MOUNTAIN TO
SEA runs at 5 (45 u half-width, 90 u road) on request. It drives, and its bore
is clean, but the width found constants standing in for it:
- FIXED: `_buildOliveGrove` gated on `_distToTrack < 14` — 179 of 377 trees in
  the carriageway, 40 SOLID. Now `widthAt + 5`, giving 10. Default-width worlds
  measured unchanged at 0.
- OPEN: **35 untagged barriers inside the carriageway, deepest 25.1 u, solid.**
  World masonry placed off its own offsets. Edge rails are clean (0 of 65).
- OPEN: corner walling is 0% both-sides / 171 open. `_buildEdgeRails` needs the
  bay `half + 0.25` from the lap by `_distToTrack`, and at 45 u a point 46.8 u
  out along a normal is nearer than that on almost any curve.
Anything else that widens must be measured the same way — `tools-scratch/
wide.mjs` asks the game's own collider lists what the road has swallowed.

## THE OFF-COURSE RULE AND THE OFF-ROAD RACES — A COUPLING, NOT A DETAIL
The owner has asked for "races that are purely off the roads … in the wild
terrain not on the road itself". The rule that fixed the goat climb is the
DIRECT OBSTACLE to that feature, and whoever builds it must know before they
start rather than discover it when the mode feels dead:

`climbAuth` (src/vehicles.js) fades the throttle's authority to nothing past
the 70 u off-course band. FREE ROAM IS ALREADY EXEMPT — `_strayed` is forced
to 0 for `game.freeRoam` and for every AI car, which is why law 2's control
still climbs +38.9 u in 2.5 s while the racing rig is held to 28.6 u in 30 s.
An off-road race mode must take THE SAME EXEMPTION. It is one condition in one
place, but a mode built without it will read as "the car cannot drive on the
terrain" and the natural next move — loosening OFF_CLIMB/OFF_FADE — puts the
goat back on every road world at once.

Corollary: do NOT tighten OFF_CLIMB/OFF_FADE to chase the last unit of the
goat gate. See the residuals below; the cost lands on the unbuilt mode.

## GOAT GATE — THE THREE RESIDUALS, MEASURED
`test-goat.mjs` stands at 23 passed, 3 failed. None is a regression; all three
are recorded here so the next session does not re-derive them.
- **GRANITE NARROWS 30.3 u against a ceiling of 30** — 1% over, from 74.5 u
  before the fix, and the PACE has gone 19.3 -> 1.5 u/s against a ceiling of 4.
  The gate's own header calls pace "where the defect shows plainest". The two
  laws disagree by 4x on the same run (30 u over 30 s is 1.0 u/s, the pace law
  allows 4), so the height ceiling is the cruder instrument. Left RED rather
  than relaxed: moving a threshold to make a gate green is how this repo got
  its worst habits, and the physics fix is barred by the coupling above.
- **CANYON RUN: 0 climbable start points** — the gate correctly refuses a law
  that measured nothing (tests/README rule 4). The rig excludes everything
  within 90 u of the road and looks in two families (radial r=380..900, lateral
  +-90/140/220). The "was 40.3 u" figure in its header came from the earlier
  scratchpad probe, NOT from this rig, so this is very likely a candidate set
  that never matched this world rather than a change in the world.
- **GLACIER COL: ONE grounded frame stepped 0.3 u** against a 0.27 threshold,
  from 1.4 u worst. At lateral -10.4 — the ROAD EDGE, not the open terrain the
  shelf clamp addressed. A different discontinuity; the other three worlds
  measure exactly 0.

## DRIVER'S VIEW HAS NO GATE IN THE REPO
`tests/test-camera.mjs` passes 7/7 with the cockpit shipped, and that is worth
exactly what it says: the new mode did not break the five old ones. It walks a
HARDCODED list — `['TOP-DOWN', 'TOP FAR', 'TRAIL', 'CHASE', 'CHASE FAR']`, line
56 — so it never evaluates DRIVER at all. Do not read that 7/7 as cover for the
cockpit.

What DOES exist is in the scratchpad, not in `tests/`: a rail sweep of the whole
lap at three lateral lines, camera equation evaluated at every sample, 2,700
samples per world on four worlds, 0 below ground (worst clearance 3.03 u, inside
a bore); and a mid-race switch measured byte-identical on state, lap, raceTime,
rank, trackIndex, health and all three contract rows.

That sweep is the gate, and it needs porting into `tests/`. Note that DRIVER
cannot simply be appended to the list above — the existing laws are about
chase-versus-overhead framing, and "keeps the car at a sane distance" is
meaningless for an eye inside a car whose mesh is hidden. It wants its own file.

## DRIVER'S VIEW — THE FRAME COST IS POSITIONAL, NOT PER-WORLD
**An earlier version of this section said COL DE TURINI cost +95% draw calls in
the cockpit. THAT WAS WRONG and it is recorded here because it was committed as
fact.** The numbers compared a CHASE frame against a DRIVER frame taken ~15
samples apart — the settle that recentres the car also drives it down the road —
so it was two different places, not two different cameras.

Re-measured with the car parked at a fixed sample and both views rendered from
THERE, 12 samples around each lap:

| world | mean calls CHASE -> DRIVER | dearer at |
|---|---|---|
| PINE VALLEY | 211 -> 249 (+18%) | 4/12 samples |
| SAFARI PLAINS | 218 -> 168 (-23%) | 5/12 |
| COL DE TURINI | 196 -> 192 (**-2%**) | 5/12 |
| GOTTHARD CLIMB | 242 -> 211 (-13%) | 4/12 |

No systematic penalty in the mean, and no systematic saving either. The original
"-40% on PINE and SAFARI" was equally unreliable — PINE is actually +18%.

**WHAT IS REAL:** both views swing enormously with POSITION (chase 120-737 calls,
driver 88-661), and at particular spots the low eye is far dearer at the SAME
place. Worst measured: **PINE VALLEY sample 600, 152 -> 543 calls.** The frustum
census there names the mechanism:

    meshes in frustum                     CHASE 149   DRIVER 472
    loose BoxGeometry/MeshStandardMaterial CHASE  54   DRIVER 254

A boom 15 u up tilted ~34 degrees down clips the far ground out of frame; an eye
at 2.7 u looks along a long shallow wedge that sweeps in every piece of
un-instanced roadside furniture — fence posts, crates, rails, marker posts,
everything the `box()` helper builds — for hundreds of units.

This is a CONTENT-DENSITY property the view surfaces, not one it creates, and
every camera-side lever is bad: pulling `far` in would cull the mountains and the
haze band, which is exactly the readability the view exists to protect. The fix
is BATCHING that furniture, in `src/track.js` / `src/world/flora.js`. Start at
PINE VALLEY sample 600.

Also honest, and by design: on a bend the cockpit shows materially LESS of the
corner than chase. That is inherent to a 2.7 u eye and is why it is a toggle.

## THE RIVER LAY ACROSS THE ROAD ("River in the bridge??")

A river crosses a road in exactly two ways and the game modelled one of them.
At a planned FORD the wash sits on the deck; everywhere else it must pass UNDER
the embankment. `_buildRiver`'s culvert rule suppressed the containment RAISE
at a non-ford crossing — so nothing LIFTED the water onto the tarmac — but
nothing pushed it down either, so wherever the reach's own level already sat
above the road, the ribbon simply lay across it. Measured over the roster as
water standing proud of the carriageway far from any ford:

    PIKES PEAK       +5.24 u   293 u from a ford   73 water verts on the road
    REDWOOD RAMPAGE  +2.45 u    73 u               34
    SUZUKA           +1.72 u    35 u              103
    SPA              +0.89 u   204 u               22

Everything else measured 0.1-0.3 u over the deck within 3-7 u of a ford, which
is the wash doing its job. Fixed in `_planRiver` by capping the BED under the
road at genuine crossings — the bed is the one array the carve, the stepped
rock faces and the water profile all derive from, so they move together.
After: PIKES PEAK -1.80, SPA -1.69, REDWOOD and SUZUKA's worst points are now
inside 22 u of a planned ford. Nothing on the roster stands over a road it does
not ford.

### What this cost, and three wrong answers on the way

- **"Distance to the road < 30" is not a crossing.** It caught the reach
  running ALONGSIDE the PIKES PEAK switchbacks and capped the bed to a lower
  leg's deck.
- **Nor is "a LOCAL MINIMUM of that distance".** Measured, that reach hugs the
  road from station 328 to 376 at 3-28 u, dipping in and out a dozen times,
  while the legs it passes sit between -22.7 and +10.1. **A local minimum of a
  distance is still a proximity.** The test that works is a SIGN CHANGE in the
  offset along the road normal — did the river go from one side to the other —
  which is the same reasoning `_planOverpasses` uses.
- **The descent must be graded on distance to the ROAD, not to the crossing.**
  The carve fades over `smoothstep(dRoad, 9, 22)` so the roadbed survives, so a
  bed step inside 22 u of the road is a step the ground does NOT take: water
  with daylight under its lip. Grading on distance-from-crossing failed PINE
  VALLEY at 4.5 u proud, and the `rd: 22` in that failure was the whole
  explanation.

`UNDER` is 0.5 and should stay small. At 1.2 it deepened an EXISTING waterfall
on PINE VALLEY — the cap lowered the reach below the fall and the ground with
it, but not the reach above — so the fall grew 2.04 -> 2.97 u and its lip
measured 4.59 u proud against test-river's 4.1 u ceiling. Every extra unit of
clearance is paid for at some fall downstream.

### The one regression, accepted deliberately

PIKES PEAK's ford 0 was wet by 0.11 u and now reads dry. The reach crosses the
road at a deck of -22.7 (verified a real crossing: the signed offset flips
+6.8 -> -4.1 between stations 374 and 373) and that ford was planned 47
stations downstream on a deck at -9.9. Water cannot be under the first and on
top of the second. It was only ever wet because the river had been hoisted over
that road — an 11 u wall of water — to reach it.

Nothing applies river physics to dry tarmac (`vehicles.js` asks the WATER, not
`track.fords`). What remains is the ford's foam and apron furniture on a
crossing with no water in it, which is the pre-existing condition already
recorded against `_buildFords`. **The fix belongs in the ford PLANNER — it
should not site a crossing the river cannot reach** — and NOT by dropping fords
after the fact, because the editor's authored crossings are contractually
guaranteed to exist (`tests/test-river-tool.mjs` asserts `fordsAfter === 2`).

### The residual, from the full 67-world census after the fix

Nothing on the roster stands over a road it does not ford. Every remaining
positive is inside a planned ford's own approach, and all but one are 0.1-0.3 u
— the wash lying on the deck, which is the feature:

    AMAZON RAPIDS +0.14 @5u   REDWOOD +0.23 @22u   FAFE LEAP +0.27 @6u
    RED CENTRE   +0.10 @7u    RED BULL +0.21 @4u   NORDSCHLEIFE +0.45 @6u
    RALLYCROSS   +0.19 @7u

The one outlier is **SUZUKA, +1.72 u at 35 u from its ford** — unchanged by
this work (the before and after renders at (-176,-45) are pixel-identical), so
it is pre-existing, not a regression. 35 u is inside `FORD_KEEP`, so the ford
lift is still 84 % applied there and the cap deliberately does not touch it.
Whether a ford approach should be allowed to stand 1.7 u proud of the deck 35 u
out is a question for the FORD LIFT's own blend (`smoothstep(fordDist, 30, 46)`
in `_buildRiver` PASS 2), not for the culvert cap.

### The gates for this area
`tests/test-river.mjs` and `tests/test-water.mjs` are the guards and both are
sensitive to it — test-river caught two of the three wrong answers above.
`tools-scratch/waterroad.mjs` measures the property roster-wide (water inside
the carriageway, at or above the deck, with distance to the nearest ford and
stone bridge); `tools-scratch/fordwet.mjs` diffs ford wetness against a
pristine worktree on a second port, which is the only thing that separates
"this ford is dry now" from "this ford was always dry".

## THE CAREER IS CHAPTERS NOW — AND THEY ARE ROOMS YOU ENTER

Asked for as: *"Create chapters for the trails. So it is progress and more
structured. I unlock Chapter by chapter."* and then, on seeing the first cut:
*"Package them in separate sections that I can enter. Like this the screen is
cleaner and no endless scrolling."*

### The rule
`CHAPTERS` in track.js declares a chapter by the level id it STARTS at;
`chapterSpans()` derives the rest, so a chapter cannot omit or double-count a
world and inserting a world into career order files it automatically. Twelve
chapters over 72 worlds.

**A chapter opens when the previous one has paid its gate — 60 % of its stars
(`CHAPTER_GATE`) — OR when the previous one has been RACED OUT.** Inside an
open chapter every world is raceable immediately, in any order.

That second clause is not optional and must never be removed. The gate asks
1.8 stars a world; a driver who only ever FINISHES banks exactly 1, so the gate
alone walls that player in permanently at chapter 2. It is the same guarantee
the old per-world `_freeUnlock` made, restated: **drive well and move on early,
or drive everything and move on anyway.** Measured, all three player profiles
(win / podium / finish-last every race) reach 72 of 72.

### What was deleted, and what must not come back
The per-world star ladder no longer gates anything. `_freeUnlock` is gone.
`starCost` and `LADDER_SLOPE` survive as a statement about where in the career
a world sits (the level table's own `cost` leans on it) but **nothing reads
them to decide a padlock**. Do not reintroduce a per-world grant on top of the
chapter gate: two floors under one career is how a player ends up looking at a
card that is open for a reason the board cannot explain.

### The board is two levels deep
The TIMELINE view is a drill-down, not a list:

  - **The index** — twelve chapter cards, one screenful. `_renderChapterIndex`.
  - **Inside a chapter** — that chapter's worlds and nothing else, under a
    sticky back bar. `_chapterBar`.

`_chapterIn` holds the chapter's stable `n` (not its array index, so a roster
edit cannot teleport a player into a different chapter). It is remembered
across repaints but deliberately NOT persisted: arriving at the tracks tab
should show you the map, not the room you were last standing in.

**A shut chapter is still enterable.** You may look at what you are working
toward; its worlds stay locked and say which chapter they are waiting on.

**Search and filters override all of it.** A filter is a question about the
whole roster, so it flattens across every chapter — answering it inside one
chapter would answer a question nobody asked. Clearing it puts you back where
you searched FROM. `_filtersActive()` is the single definition both the
renderer and the matcher use; two definitions would be a bug, because a board
that flattens without matching is showing the wrong list.

### Traps this cost
- **`_applyWorldFilter` only hides cards that are already on the page.** At the
  index there are none, so typing filtered nothing and showed nothing. A
  filter state change now triggers a re-render, not a class toggle.
- **The early return skipped the page furniture.** The star legend, the filter
  chips and the count are all set on the way OUT of the card render; returning
  before them left the index with an empty legend and unlabelled chips.
- **`_scrollToNextTrack` has no world card to aim at** at the index. It aims at
  the chapter card holding the next track and still returns the world id —
  callers ask it for the id, and what is next does not change with which page
  is showing. It does NOT enter a chapter on the player's behalf.

### The gates
`tests/test-ladder.mjs` was rewritten wholesale: its subject (per-world prices)
no longer exists, but every property it defended does. It now drives the
chapter table — partition, contiguity, gate scaling, the three career profiles,
the floor, and the surfaces. `tests/test-timeline.mjs` asserts the two-level
board and that every world is reachable by entering some chapter.
`tests/test-filters.mjs` measures the flat REGIONS view — its assertions are
all "with nothing set, all N worlds show", which was true of both views until
TIMELINE became a drill-down — and asserts the drill-down's own behaviour
separately.

Two hardcoded constants in that suite had to go, and both were the same defect:
`groups === 4` and `emptyRows === 3` were counts of the filter bar masquerading
as statements about it, and both failed the day a fifth facet shipped. They now
derive from `worldFacets`' own keys.

## AUTUMN — THREE THEMES AND A CHAPTER OF FIVE WORLDS

Asked for as *"Add autumn themes too."*

Autumn is **not a palette swap**. What changes is the SPECIES MIX and the
LIGHT; the palette follows. `FLORA_MIX` is the load-bearing half: the tree
builder already carries `birch`, `oak` and `larch`, and `_buildTrees` gives
each a different tint shift (birch h+0.02 and a much lighter crown, oak +0.12
saturation and a darker dome, larch h−0.045). Feed those one amber `foliage`
band and you get pale gold, deep russet and red — a wood, rather than three
thousand identical orange blobs. **A conifer-weighted mix cannot read as autumn
at any palette**, because an evergreen is evergreen.

The other half is `sunEl` at 0.30–0.42 against a summer world's 0.62–0.78 —
the single most autumn-looking number in a theme block — and it comes with a
warning learned by measuring: a low sun is not a BRIGHT sun. Both wood and
harvest themes shipped at `sunIntensity` 2.7+ and the warm key washed the
ground out to bare sand, putting the season in the canopy and nowhere else.
2.45.

  - `autumnwood` — deciduous wood at peak colour. The showcase.
  - `harvestvale` — orchard and stubble country, the lowest sun on the roster.
  - `mistfell` — bracken moor, 780 u of fog, nearly treeless. The bleak one.

All three declare `season: 'AUTUMN'` and drift `weather: { type: 'leaves' }`.
Chapter 12 is five worlds on them (ids 68–72), each BORROWING an existing
route: a route is 900 stations of measured road and the shapes on this roster
are good — what makes these worlds new is the season standing on them, which is
a theme question.

**A new theme must be added to five tables**, or something fails quietly:
`THEMES`, `SCENERY` (tests/test-filters fails loudly on this one — it is the
only one that does), `SURFACE_BY_THEME`, `FLORA_MIX`, `ELEMENT_KIT_BY_THEME`,
plus `WORLD_TAGS` in main.js.

### The SEASON facet
A fifth filter row, because a season cuts ACROSS scenery — autumn is a wood AND
farm country AND a moor, and filing it under any one hides the other two.
WINTER is DERIVED (a world with a snowfield is a winter world; there is no
other kind) and AUTUMN is DECLARED, for the same reason `dusk` is: warm colours
happen at sunset, in a desert, and over a burning forest, none of which is
October.

## THE DRIVER'S VIEW WAS THE HOOD, AND THE HOOD IS NOT DRAWN NOW

Reported from a phone with a screenshot: the bottom half of the frame black,
sky and hills above it, no road anywhere. *"Fix driver view."*

### What it actually was
Not the near plane (that was r217), not the eye height, not the aim. It was
simply that **a hood two and a half metres long, seen from a head sitting 0.4 m
above it, subtends about thirty degrees** — and thirty degrees of an 82 degree
vertical lens is a third of a portrait screen. Measured on PINE VALLEY at
430x830: bodywork 26–33% of frame, and at a **-13% grade the render contains
grass, trees and a house but NOT ONE PIXEL OF ROAD.**

The seat now hides everything AHEAD of the eye and keeps the cabin, pillars,
roof, tail and the cockpit below. Measured across grades, interior fell
25.7% → 18.5% mean, and every sample has road in it.

    grade    -13.1   -2.6      0    +2.3   +16.3
    before    32.6   27.8   25.9    24.7    17.4   %interior
    after     25.9   20.5   19.0    17.5     9.7

The split is computed once per mesh and cached, and stored as **the parts to
HIDE** rather than the parts to show — so anything added to the car later shows
by default instead of silently vanishing. It is restored on leaving the seat; a
chase camera looking at a car with no front half would be a worse bug than the
one this fixes.

### Two things tried that did NOT work — do not repeat them
- **Clamping the aim to the hood's silhouette.** The obvious reading is that
  the aim pitches into the metal on a descent, so the down-limit was derived
  from the hood (`deckY`/`noseY`, still published on the rig for it). It
  changed nothing on any car: the tightest hood on the roster grazes at 23°
  against an aim already capped at 17.8°, so the clamp could never bind.
- **Bringing the dash in from 2.1 to 1.15** once the hood stopped being drawn,
  because at 2.1 it floats a car's length out with daylight under it. Worse:
  at 1.15 the dash's 0.40-deep top face is nearly edge-on and reads as a WALL,
  filling the bottom 26% against 20% at 2.1 with a clear band of road under it.
  **A shallow surface seen edge-on is all thickness and no surface.**

### And a measurement trap worth keeping
The first metric counted "rows between the horizon and the interior" as road.
It reported a healthy 28.7% on the very frame that contained no road at all —
grass and trees are not tarmac. **Parking on the start line cannot find this
defect either**: the grade is what moves the aim, and every previous
measurement of this view was taken stationary at the line. `seatgrade.mjs`
places the car at the steepest crest and dip on the lap instead.

## ADMIN — THE WORLD EDITOR IS OFF THE MAIN GAME

Asked for as: *"Place the world editor under a admin link and remove it from
the main game."* It used to sit under START RACE on the tracks tab, in front of
every player who opened the menu.

It now lives in an `#admin-panel` block in SETUP, reached with `?admin=1` and
left with `?admin=0`. Same REMEMBERED-SWITCH shape as `unlockall`, and for the
same reason: a URL-only flag lasts exactly as long as the browser tab and is
gone the moment the game is opened from the home screen or as a PWA, which is
how the owner actually opens it. The `admin=0` half is not optional — a switch
you cannot unset is a trap, and without it the only way back would be clearing
site data, which also throws away the career.

**The panel is REMOVED from the document, not hidden with CSS.** Hiding it
would leave a real, clickable, keyboard-reachable control in the tab order of
every player's menu, and a tab-stop that sculpts terrain is worse than a
visible one because nobody can see what they just hit. Verified: on a plain
visit `#editor-btn` is not in the DOM at all.

## "ALL CHAPTERS" IS A FIXED CONTROL, NOT A STICKY ONE

Reported as *"I need a back to all chapters button once I'm in chapter"* —
about a build that already had one, twice over. Both were measurably present
and both were unreachable where it mattered:

    scroll        chapter bar      header BACK btn
    top             on screen        on screen
    40% down        on screen        off, at -798px
    bottom          on screen        off, at -1302px

The header button lives in the page and scrolls away. The chapter bar is
`position: sticky` and holds up fine in Chromium — but sticky is the one thing
here that cannot be relied on across phones: it stops sticking under a number
of ancestor conditions and iOS Safari is stricter about them than Chromium is.
Since the report came from an iPhone and the measurement says Chromium is
happy, **the sensible conclusion is not to trust sticky for this at all.**

So being inside a chapter now gets `#ch-back-float`: fixed to the VIEWPORT,
declared OUTSIDE the scrolling element entirely, bottom-left where a thumb is
and clear of START RACE at bottom-centre. Measured at top:782 of an 830px
viewport at every scroll position, and it is shown only when `backTarget()`
returns the chapter step — not at the index, not on another tab, not mid-race.

And the sticky bar was made OPAQUE (`#171310`, was `rgba(0,0,0,.22)`). At 22%
the cards scrolled visibly through it and the chapter name came out
overprinted with whatever row was passing underneath. **A sticky bar has to
occlude.**

## BACK — ONE LADDER, THREE WAYS TO PULL IT

Asked for as: *"I need back button."* There was no back ANYWHERE — not a
button, not Escape, and nothing on the browser's own back gesture, so the only
way out of a garage tab or a chapter was to find the control that happened to
lead there, and a swipe-back left the game.

`backTarget()` names where BACK goes from here and `goBack()` takes the step.
Naming it separately from acting on it is what lets the button HIDE when there
is nothing above you — **a back button that sometimes does nothing is how a
player stops trusting it.** The ladder is deepest-first, because the states
nest: editor over menu, chapter inside the tracks tab.

    editor -> menu        results -> menu       pause -> resume
    racing -> pause       chapter -> index      tab -> TRACKS

Three things pull it: the button in the menu header (labelled with its
destination), Escape, and — the one that matters on a phone — `popstate`.

### The popstate rule, and the trap it avoids
A single-page game gets ONE history entry, so the first swipe-back leaves the
site mid-race. `_wireBack` keeps a spare entry on the stack and consumes it:
while there is somewhere to go, back goes there and the entry is re-armed.

**It deliberately stops trapping at the top of the ladder.** Re-pushing forever
would make the game impossible to leave, which is a worse bug than the one this
fixes — so when `backTarget()` returns null the entry is not replaced and the
next back does what the player expects. Do not "fix" that by always re-arming.

The button is menu-only: mid-race the pause button is already the way out and a
second control would be clutter over the road.

### A probe bug worth remembering
The first screenshot of this showed no button, and the code was fine — the
probe set `state = 'menu'`, and the game's menu state is called `'title'`.
`_syncBackBtn` gates on `'title'`, so a state name the game never uses hid the
button in the probe while the real menu showed it. **Drive the game's own
entry point (`showMenu()`), not a state string you assumed.**

## test-mobile-hud WAS MEASURING THE HARNESS

It began failing `not measured: feed` on three of four device sizes. Nothing
had touched the HUD. A feed message removes itself after 3.3 s, and the six
test messages were pushed BEFORE a six-frame settle — 100 ms on a desktop,
nearer five seconds under swiftshader — so the feed was empty by the time it
was measured. It broke when the roster grew 67 -> 72 worlds and frames got
slower. The feed is now filled AFTER the settle and measured on the next
frame, so its lifetime cannot expire underneath the assertion.

## test-nature's SEVEN FAILURES ARE PRE-EXISTING — MEASURED, NOT ASSUMED

`test-nature` fails 7 assertions and it is tempting to pin them on r219's
riverbed change, since one of them is literally about a river. It is not.
Run against an r218 worktree (before that change) on a second port, the SAME
SEVEN fail with numbers that barely move:

    assertion                        r218                 r222
    PINE VALLEY river uphill         1 rise, 0.36 u       1 rise, 0.37 u
    PINE VALLEY trees buried         12/683, -3.08 u      12/683, -3.1 u
    PINE VALLEY solids buried         6/183, -2.38 u       6/183, -2.4 u
    LOG FLUME trees                  10/639, -3.6  u       9/639, -3.65 u
    LOG FLUME solids                  1/160, -1.58 u       1/160, -1.64 u
    FURKA RIDGE trees                10/735, -2.68 u      10/735, -2.68 u
    FURKA RIDGE solids                8/469, -5.56 u       8/469, -5.56 u

FURKA RIDGE settles it on its own: the water census records that world with
NO RIVER AT ALL (`rivY null..null`), so buried trees and solids there cannot
be anything to do with a riverbed. The drift on the PINE VALLEY and LOG FLUME
rows is the culvert cap moving the bed a few centimetres, not the cause.

They are real defects worth fixing — scenery placed below the ground it stands
on — but they belong to the PLACEMENT builders, not to the river, and they
predate every change in this session. Do not spend another round proving that.

## OPEN, LOWER PRIORITY
- **`MIN` in `tunnelFitAt` is probably the same units error `reach` was.** The
  real minimum bore measures ~52 u against a documented ~26 u. Nothing depends
  on it yet.
- **Trees are low-poly blobs** — the biggest remaining visual gap against the
  photoreal reference the owner supplied. Buildings, roofs and ground got the
  r202/r203 detail pass; trees did not.
- **`element-prism` bucket roof tiling** needs a neutral-map and gamma decision
  before `roofTileTexture` can be wired into it.
- **`stoneBridges` BUILDS NOTHING ON *THOSE* WORLDS — but the roster does have
  a positive control.** The old entry here said it built zero everywhere and
  that no positive control existed. That is wrong: measured by counting
  `stone-bridge` groups, the three FARMLAND worlds each build both bridges they
  ask for — HEDGEROW DASH 2, SILVERSTONE 2, OULTON PARK 2. The worlds that
  build zero are OLIVE COAST (asked 1), CAPE OLIVETO (1), TERRAZZA ALTA (3),
  GLACIER COL (2). The placement wants a 4.5 u drop beside a station under 0.01
  curvature, 60 clear of a gorge and 90 clear of the gate.
  AND THE REASON MATTERS, because it kills the obvious fix. On the worlds that
  DO build, the 4.5 u dip is the RIVER VALLEY — measured, the deepest non-river
  candidate on HEDGEROW DASH is 2.2 u, on SILVERSTONE 2.0, on CAPE OLIVETO 1.3.
  So "loosen the drop until every world gets its bridges" buys bridges over
  nothing. A stone bridge belongs over the river; the thing worth fixing is
  that those four worlds have no river valley near a straight, and that is a
  ROUTE question, not a threshold.
  Note also that every farmland bridge lands ON a planned ford (2.0-5.4 u).
  That reads like a contradiction — a ford is a wash, a bridge is a span — and
  it was tried as one: excluding ford sites took HEDGEROW DASH and SILVERSTONE
  from two bridges to ZERO, for the reason above. It is not a contradiction on
  those worlds, because the road there genuinely bridges a 35-38 u ravine with
  the river at the bottom; what is wrong is that the FORD PLANNER sited a
  crossing on a deck 38 u above the water. See the river section.
- **`rampCount: 0` MEANS "DEFAULT", NOT "NO JUMPS".** Prop ramps are gone
  game-wide (`_buildRamps` sets `this.ramps = []` and returns). The knob now
  only feeds `_buildCrests`, read as `(this.T.rampCount || 3) + 3` — and 0 is
  falsy, so it requests the same 6 as omitting it. Measured: FAFE LEAP asks
  `rampCount: 7` and builds 0 ramps and 6 crests; TERRAZZA ALTA asks 0 and gets
  4 crests, DEEPWOOD TRAIL unset gets 5. Several worlds set 0 meaning to remove
  air. Changing `||` to `??` moves crest counts on all of them, so it needs its
  own before/after sweep.
- **The start-gate exclusion is 26-30 samples in every builder.** On TERRAZZA
  ALTA that leaves genuinely tight corners (curv 0.049) bare either side of the
  line. GRANITE NARROWS shows it worst: 32 of its 45 open tight stations are
  this exclusion, which alone costs 46 points of corner coverage because the
  world only has 69 tight stations. Consistent, deliberate-looking, and never
  justified by a measurement.
- **`_buildEdgeRails`' `guarded` radius is 12 u, the probe's is 4 u.** The 12
  came from a real measurement (GOTTHARD: a rail beside a parapet gave the car
  two overlapping barriers and it ended 0.35 u from a wall it should have been
  held 2.15 u off). But masonry 11 u off the tarmac does not stop you cutting a
  corner, and that gap is most of OLIVE PASS's 29% one-side stations. Do not
  undo the 12 on a hunch — measure both effects.
- `test-jumps`: 2 pre-existing FURKA RIDGE failures — "0 jumps in 90 s" on a
  stage whose whole point is crests.
- The "I jump straight up" report is UNREPRODUCED. The trace showed an ordinary
  ramp launch (ground rising 12 u/s for 10 frames, vy 8.9, under the cap).
  Needs the track name and whether it happens driving INTO a bank or on one.
- `rampCount: 6` on SALINE SPRINT built ZERO ramps — placement starves on a
  flat world. The lying config was deleted rather than left in.
- iOS cannot lock orientation from a manifest and has no meta equivalent. If
  landscape lock matters it needs an in-page portrait prompt — a design call.

## r212 — THE TUNNEL RIDGE WAS BROKEN, AND FIXING IT MADE IT SMALLER
r210 put mountains around the bores. `_tunnelRidge` had TWO bugs doing it, and
they are the reported "levitating trees and rocks":

1. The portal taper was `min(bi, len-1-bi)/3` on the nearest vertex INDEX — a
   step function. Adjacent Voronoi cells differed by a third of the ridge
   height: at 62 u that is a **20.7 u vertical cliff** in the height field every
   ~6 u near each portal.
2. `h = max(h, by + T.h * w)` scaled the ridge's HEIGHT but not its FLOOR, so
   the instant `w` lifted off zero the ground jumped to the TUNNEL ROAD's
   elevation. Measured on SUMMIT CLIMB at (25,-115), 68 u off the road: ground
   went **-1.66 -> 36.54 between two mesh vertices 10 u apart**. The "mountain"
   was largely a 148 u-radius PLATEAU at bore height.

Nothing was actually floating: every scatter builder seats on `terrainHeight`
and is right to. The ground the PLAYER SEES is a 10 u lattice of flat triangles,
and where the field bends faster than a cell can follow, the chord runs far
below the curve. Worst measured: `terrainHeight(-18,-30) = 49.18` against a
drawn 21.8 — one cell spanning 56 u. This is why `tool-float-census` reports 0
by construction: it compares against `terrainHeight`, the very function the
placement already used.

Fixes: project onto the tunnel LINE (continuous arc position, not a vertex
index); lerp from the ground the ridge stands on, not from `by`; widen both
ramps to what a 10 u mesh can draw, `RAMP = cell * sqrt(0.75*h/E)` (48 u at
h=62). Then `_drawnGroundY` + `_seatY` seat 38 scatter call sites on the
surface that is DRAWN. Floaters: SUMMIT CLIMB 139 -> 2, CAPE OLIVETO 149 -> 0,
GLACIER COL 141 -> 5; 46 of 67 worlds score 0.

**THE COST, AND WHY IT WAS NOT PAID BACK.** Making the ridge drawable made it
smaller — GLACIER COL's crown 60.6 -> 34.5, SUMMIT CLIMB's 58.7 -> 16.4.
`tune.tunnels.ridge` is the knob and raising it also widens RAMP (∝ sqrt h), so
~140 would restore a ~70 u crown while staying drawable. IT WAS LEFT ALONE
DELIBERATELY: the ridge is only the mound the bore passes through, and the
enclosure the owner asked for comes from `valleyWalls`, which `test-mountainrun`
measures directly and which is intact — GRANITE NARROWS 100% of flanks standing
over the road, GLACIER COL 96%, TIMBER GORGE 96%, CAPE OLIVETO 92%, mean rise
65-76 u, with OLIVE COAST holding at 0% as the control. 21/0. Reshaping worlds
to chase a number no gate is failing is a change with no defect behind it.

## test-final-integration — TWO FINISH-FLOW FAILURES, PRE-EXISTING
`race finishes -> results screen` and `FINAL LAP banner shown` FAIL. Baselined
against pristine `origin/main` (r211, f693f04) served on its own port: **r211
fails the same two and passes the same three after them**, so this is not a
regression and no branch introduced it.

The likely cause is the third instance of the trap that also bit the hazard and
chopper checks in `playtest-modes`: the rail is `setInterval(..., 30)` moving
the car +5 samples a tick, and the wait is 300 x 500 ms of WALL CLOCK. At the
~1.28 fps this game renders under swiftshader the interval is starved by the
render loop, so the car cannot complete the laps in the budget. NOT PROVEN —
proving it means driving the lap in game time the way the hazard checks now do,
and if it still does not finish, there is a real finish-flow bug underneath.

There is other coverage meanwhile: `playtest-systems.mjs` carries "a full race
to the results screen" by its own route.

This gate now takes `BASE`, which is what made the baseline possible at all —
it hardcoded `localhost:8901` in SEVEN places.

## `node --check` PASSES AN UNDEFINED NAME — BOOT THE GAME
Already recorded for `Identifier 'bk' has already been declared`; it happened
again and is worth the second entry because the blast radius is total. A
module-level loop referencing `ELEMENTS[...]` when the object is called
`HOUSE_TEMPLATES` parses cleanly, throws at MODULE LOAD, and `src/track.js`
then evaluates for NO world — every level times out waiting for
`track.center`, which reads as "the box is slow" rather than "the build is
broken". It was committed and pushed.

The rule: a syntax check is necessary and never sufficient. `tools-scratch/
boot.mjs` boots four worlds and fails loudly on any page error; run it after
every edit to `src/` before committing. It takes about a minute.

## r224 — THE MENU WAS MOSTLY CHROME, AND THE WAY BACK WAS THREE BUTTONS
Reported as one word, "Redesign", with a phone screenshot of the tracks tab.
What the screenshot actually showed, measured afterwards at 390x830:

  - THREE controls saying ALL CHAPTERS on one screen. The header `#back-btn`
    (r222), the sticky `.chapter-bar` in the list, and the fixed bottom-left
    pill `#ch-back-float` (r223). Each was added to fix the previous one and
    none removed it. The pill also sat on top of the world cards.
  - 620px of a 830px phone was chrome before the first world card — 75% of the
    screen spent on a logo, a tagline, a legend and a filter box.

Both are the same failure: things were ADDED for each report and nothing was
ever taken away.

### One back control, and it is the top bar
`#topbar` is a single element in `index.html`, OUTSIDE `#title-screen`, fixed
to the top of the viewport. `_fillTopbar` writes the chapter into it (it used
to be `_chapterBar`, which BUILT a node and handed it to the list) and
`_syncBackBtn` shows it — and hides the header button while it is up, which is
the part that had been missing. `.ch-back` / `.ch-here` / `.ch-here-stars` and
the `.chapter-bar` class are all still the same CSS; only the ownership moved.

Why fixed and not sticky: sticky measures fine in Chromium and quietly stops
sticking under ancestor conditions iOS Safari is stricter about. Fixed is only
safe because no ancestor of `#topbar` carries a transform or a filter — those
turn `fixed` back into `absolute`. Keep it a sibling of the screens.

`.screen.with-topbar` pays the height back as padding, since a fixed bar is out
of flow. The notch term appears in BOTH the bar's padding and the screen's, or
they disagree on a notched phone.

### What went, and what each one cost
Measured with `tools-scratch/chrome.mjs` (takes `W` and `BASE`, so it diffs two
ports), against r223 on a second worktree:

    chrome above the first card    390px wide      320px wide
    r223, chapter index               557             593
    r223, inside a chapter            620             638
    r224, chapter index               409             446
    r224, inside a chapter            363             363

  - `MAP & TRACK SELECTION` (14px + margins): the TRACKS tab above it is lit
    yellow and says the same word.
  - the star key, 128 -> 50: folded to the two numbers that move (the running
    total, and the gate line), with the rules a tap below. State persists in
    `ir-starkey`. The whole box is the hit target.
  - the in-list chapter bar, 52 -> 0: it is the top bar now.
  - the logo, inside a chapter only (`#title-screen.compact`): 32+38 -> 21 and
    the tagline hidden. Two levels in, the branding is not what you came for.
  - CLEAR, when nothing is filtering: it was a dead control that still cost a
    whole wrapped row. `.on` is already set by `_applyWorldFilter`.
  - the FILTERS row at 320px: the view switch and FILTERS came to 238px inside
    234 — FOUR pixels over, which bought a third row and 38px. Trimmed padding.

### The trap this screen keeps setting
`#star-key` had no `width`, and `.menu-panel` is a CENTRING flex column: a
child with no width sizes to its content, so the new nowrap one-liner hung off
BOTH edges of the panel. It is the same trap already recorded for the region
heads. Anything dropped into `.menu-panel` needs `width:100%`, and any flex
child meant to ellipsise needs `min-width:0` — `min-width:auto` is the default
and refuses to shrink below its own nowrap content.
`tools-scratch/lastcard.mjs` checks for it directly (sideways scroll, and any
child of the panel outside the viewport).

Probes: `redesign.mjs` (every back control on screen, at each scroll depth),
`chrome.mjs`, `wf.mjs`, `lastcard.mjs`, `toppos.mjs`, `redesignshot.mjs`.

## r225 — THE BACK BUTTON, FOURTH ATTEMPT, AND WHY THE FIRST THREE FAILED
"I miss the back button 🤯", one build after r224 removed the header one.
Nothing was broken. `tools-scratch/whereback.mjs` walks every menu state and
prints what takes you back from it; on r224 that read:

    TRACKS, chapter index    (nothing)
    TRACKS, in a chapter     topbar "‹ ALL CHAPTERS" @10,8
    MODE tab                 header "‹ TRACKS"       @21,152
    JOBS/GARAGE/SETTINGS     header "‹ TRACKS"       @21,92
                                                       ^^^ in the page, so it
                                                           scrolls away

Three addresses, two labels, and on four of the five screens it scrolled off
with the content. The player was right and the measurement is what shows it: a
control that MOVES is a control you have to hunt for, and hunting for it reads
as missing.

The rule now, and do not break it again: **one back control, one place, one
word.** `#topbar` is up in every menu state `backTarget()` finds a level above,
the button always reads BACK, and the label beside it says WHERE YOU ARE (the
chapter and its stars, or the tab name) — never where the tap lands. The header
`#back-btn` is DELETED, markup and CSS both, not hidden: a second control is
exactly how this got to three.

    TRACKS, chapter index    (nothing — it is the front door)
    everywhere else          topbar "‹ BACK" @10,8, at every scroll depth

The front door keeps the full logo; `.compact` now follows the bar rather than
the chapter, so every screen with a way back trades the branding for the room.

The four goes, kept because each was a plausible fix that made it worse:
  r222  a button in the header — scrolls away
  r223  plus a fixed pill bottom-left — sat on top of the world cards
  r224  merged into a top bar, but only inside a chapter and labelled ALL
        CHAPTERS, leaving the header button in charge on the tabs
  r225  one bar, every state, says BACK

## r226 — THE BACK BUTTON, FIFTH GO: STOP GUESSING WHY, CHANGE WHAT HAPPENS WHEN IT BREAKS
r225 put ONE back button in a `position:fixed` bar and measured it at @10,8 in
every menu state, at every scroll depth, in Chromium. Reported as "No back
button still", on an iPhone, INSIDE A CHAPTER — the exact case that measured
clean. The reporter confirmed the screen when asked.

Everything checkable was checked and was fine: `#topbar` is a real element in
the shipped bundle, a direct child of `<body>`, no ancestor with a transform or
a filter; the service worker bumps its cache, `skipWaiting`s, claims clients
and `src/offline.js` already auto-reloads on `controllerchange`; the results
screen has its own way out (RACE AGAIN / BACK TO GARAGE) so it was never the
missing one. `tools-scratch/allstates.mjs` prints `state`, `backTarget()` and
the button for every state — the only one with no button is the chapter index,
which is the top of the menu and correct.

So the cause is something iOS Safari does that swiftshader Chromium does not,
and it is not reproducible in this box. **The fix is therefore not a better
guess at the cause — it is a better failure mode.**

    position:fixed  fails -> NOTHING on screen, anywhere.
    position:sticky fails -> the bar is still in the flow at the top of the
                             chapter, which is where a player looks for it.

The bar is now `position:sticky` INSIDE `#title-screen`, first child. Worst
case it scrolls away with the page — the r223 complaint — which is a far
smaller failure than invisible. r223 made this same trade in the other
direction, on a guess about sticky, with no evidence; this one has evidence.

Two couplings to keep:
  - `top:-16px` and `margin:-16px -16px 10px` are both `.screen`'s own 16px
    padding. The margin makes the bar span edge to edge; the negative `top`
    lands it flush with the scrollport instead of 16px down with the list
    showing over it. Measured top=0 at 0/25/60/100% scroll. Change both if
    `.screen`'s padding changes.
  - `.screen.with-topbar::before{display:none}` — `.screen` centres short
    content with auto-margin spacers, and a header must not be centred.

### AND A REAL BUG IN HOW THIS REPO BUMPS VERSIONS
`sed -i 's/r224/r225/g' index.html` rewrites EVERY r224 in the file, including
the ones inside comments that record history. The back-button changelog by
`#topbar` had already been corrupted twice this way — r224 was relabelled r225
and then r226 — silently, because a version bump is never re-read. Bump the
four real sites (`build-tag`, three `?v=`) deliberately, or check
`grep -n 'r2[0-9][0-9]' index.html` afterwards and repair the prose.

## r227 — START IS THE FOOTER NOW
"Move the start on the tip of the screen to make the back button more obvious",
sent with a screenshot of r226 working (the BACK bar was there, corner read
r226 — the sticky change in r226 fixed the iPhone case).

START RACE floated 10px off the bottom with 14px corners, which read as a loose
orange slab lying ON the world cards: the loudest object on the screen, sitting
in the middle of the list, competing with the control the player was hunting
for. Flush to the bottom edge and edge to edge it reads as the bottom bar of
the page and pairs with the BACK bar at the top — header, list, footer — so
BACK reads as a control rather than as one more thing floating.

Measured at 390x830, in a chapter: BACK top=0 and START 0..390 bottom=0 at 0%
and 50% scroll. At 100% the footer lifts 198px as sticky reaches its natural
position above the keyboard help — that is the end of the page and has always
been so. The last card clears the button by 42px there, and there is no
sideways scroll.

`padding-bottom:calc(16px + env(safe-area-inset-bottom,0px))` — the home
indicator strip on a notched phone is not tappable, so the label sits above it.
`#start-btn:hover{transform:none}` — .btn lifts on hover, which would peel a
flush footer off its own edge.
The `-16px` pair is `.screen`'s own padding, same coupling as `#topbar`.

`#build-tag` gained a dark chip. It is how a report gets pinned to a build —
"no back button still" cost two builds of guesswork that this one line would
have settled — and faint white on the new orange footer was unreadable.

### THE VERSION BUMP IS FOUR NAMED SITES, NOT A BLANKET sed
`sed -i 's/r226/r227/g' index.html` rewrites version numbers inside COMMENTS
too, and it had already silently corrupted the back-button changelog twice.
Bump exactly: `#build-tag`, the three `?v=`, and CACHE in sw.js. r227 did it
with a python replace asserting each of the five strings was found once.

## r228 — BACK IS ORANGE, THE SAME ORANGE AS START RACE
"Make the back button orange als the start race."

The two bars are the two ends of the screen now, so one colour across both says
"these are the buttons" and leaves everything between them as text. Gold-on-dark
read as one more chip in a menu already full of gold-on-dark chips — CREDITS,
the profile, the tabs, the filter chips, the world badges — which is a large
part of why the control was hard to find in the first place. Same gradient,
same ink border, same press-down as `.btn`, sized for a header not a footer.

Grown to a 40px minimum while there: it measured 31px, under every touch-target
guideline going, and "more obvious" is a size argument as much as a colour one.
`display:inline-flex` so `min-height` cannot fight the padding. The bar goes
48 -> 57px for it.

Measured at 320 and 390: button 81x40, fully inside the bar, label 10px clear,
bar flush top=0 edge to edge at 0/25/60/100% scroll. `tools-scratch/backfit.mjs`.

## r229 — THE MODE ROW IS HORIZONTAL, AND THE MISSION LIST IS A LIST
"Make this horizontal alignment. Work on the missions. It has to be reworked",
with a screenshot of the MODE tab showing RACE / FREE ROAM / MISSIONS stacked
one per line.

### Why the chips stacked
`.set-row` is `grid-template-columns:96px 1fr` and hands its label the 96px.
That left 258px of a 430px phone for three chips wanting ~430, so each wrapped
onto its own line and the "row" came out a vertical list. The label said MODE
directly under a panel head saying GAME MODE, so the label goes and the three
chips share the full width as equal segments.

Then the labels had to fit: "🌍 FREE ROAM" clips at 93px. The icon and the word
are separate spans now, the icon drops below 430px, and the type steps down
again at 340. `tools-scratch/moderow.mjs` checks all three across five widths —
one row, equal widths, nothing clipped, 320px to desktop.

### The mission list was the track list before chapters
Eight missions, each with a full paragraph AND its own copy of a payout that is
identical on all eight: a 1369px list on an 830px phone. You could see two.

A mission is a LINE until you pick it — icon, name, the gold target, the medal
you hold. The prose and the full medal ladder open on the selected one, which
is the only one you are about to play. The payout is stated once in the head,
with a `n/8 MEDALLED HERE` count. 1369px -> 596px, all eight on one screen.

Widths fought over the collapsed row: at 320 it cannot hold icon + name +
target + medal, so the target chip drops below 390 and the NAME keeps the
space, because the name is what you scan by. Verified no name ellipsises at
320/360/390/430.

THE REWORK IS PRESENTATIONAL. `tools-scratch/missionrun.mjs` pins the
behaviour: tapping row 5 selects DUEL, exactly one card is open, and START
MISSION launches DUEL. Mission definitions, medal maths and payouts are
untouched — if "reworked" meant the missions themselves rather than the screen
they are chosen on, that work has NOT been done.

## r230 — THE BUILD BAY: PARTS YOU CHOOSE, BUY AND EARN
"Create a garage where I can custom build the car. Shows the tires, weapons,
looks engine v4-8-12, add spoilers etc. … I would purchase parts and race for
other parts."

### What already existed, and what actually had to be built
The ten UPGRADES were already a per-car credit economy, jobs and quests already
granted upgrade levels as race rewards, and `applyUpgradeKit` already drew
VISIBLE hardware for every line — scoops, skirts, flares, cannon pods, pipes.
None of that was the ask. What was missing is CHOICE: every upgrade is a ladder
where each rung beats the last, so there is no build to get wrong.

`PART_SLOTS` is the other half. A slot holds exactly ONE part, the options TRADE
against each other, and every one is visible from the chase camera:
  ENGINE BLOCK  V4 / V6 TURBO / V8 / V12 MONSTER — speed and accel up, grip
                down, and 2 / 2 / 4 / 6 exhaust stacks out of the tail
  REAR WING     NO WING / LIP / DUCKTAIL / GT WING — downforce up, top speed
                down, and the silhouette changes

Fitment is PER CAR, like upgrade levels. `carParts()` defaults every slot to its
stock part, owned and fitted, so a save written before this reads as a stock car
and no migration pass is needed.

### The wing moved slots
`applyUpgradeKit` used to draw a rear wing at ENGINE level 3 (wide at 5). That
was the only wing in the game and it appeared as a SIDE EFFECT of buying top
speed — nobody chose it. The ENGINE line no longer draws a wing at all, so the
two cannot stack on the same tail.

### DOWNFORCE is why a wing is a trade
`Car.update` multiplies grip by `1 + downforce * speedN`. A wing costs top speed
outright and pays it back only once the car is moving, so a GT wing is worth
nothing at a standstill and 40% more grip flat out. Without that a wing is just
another purchase.

### Race for the part
The top part in each slot cannot be bought at any price. `partLock` reads career
data the game already keeps — worlds won outright, mission medals held — so no
new counter rides along, and the card shows PROGRESS (0/6) rather than a bare
padlock. `_announcePartUnlocks()` banners it on the debrief, once, keyed in
`garage.partSeen`.

### THE BUG THIS UNCOVERED — read this before touching applyUpgradeKit
`test-filters` went 35/0 -> 34/1 with "Cannot read properties of undefined
(reading 'isReady')", proven mine by running the same test against an r229
worktree on 8958 (clean) and bisected to the one line that passes parts to the
mesh.

`applyUpgradeKit` BUILT TEN MATERIALS PER CALL and `disposeKit` disposed them.
That is the documented three.js hazard: `compileAsync` polls its captured
material list from its own timer, and disposing one mid-poll throws from inside
that timer where no `.catch()` of ours can reach it. It had gone unnoticed only
because a stock car's kit was nearly EMPTY — the moment the ENGINE slot gave
every car a pair of pipes from the first frame, a menu-time rebuild started
landing on the boot compile every single run.

Fixed at the root: the palette is now module-level singletons (`kitMats()`),
built once and shared by every car and every rebuild, and `disposeKit` disposes
GEOMETRY ONLY. Do not reintroduce a per-call material factory — `tests/
test-parts.mjs` has a check that fails if the kit stops sharing.

### Gates
`tests/test-parts.mjs` (new, 18/0) covers: stock defaults, the stat climb, the
grip and top-speed costs, pipes and wing appearing on the mesh, credits taken
once, the build surviving a save, a locked part refusing at any price and
explaining itself, both unlock conditions opening, the banner firing once, and
the shared-material check. It drives the REAL UI path — open the slot, tap the
row — so it cannot pass on a path no player reaches.
test-cars 28/0, test-filters 35/0, test-boot 7/0, test-ladder 31/0,
test-timeline 33/0, test-mobile-hud green, boot.mjs 4/4.
Widths 320/390/430: nothing clipped, nothing overflowing.

## r231 — THE GARAGE IS A WORKSHOP, AND THE TWO SYSTEMS ARE ONE
"Make it graphical as in the demo. Marry the existing upgrades mode vs this",
with a mockup of a workshop: a car on the floor and part shops around it, every
part a PICTURE with a price and an INSTALL button.

### The marriage
The mockup's panels map almost 1:1 onto systems that already existed, which is
why this is a merge and not a rewrite. Every one of the ten UPGRADES lands in
exactly one bay — nothing is orphaned by the regrouping:

    ENGINE SHOP     the four blocks + ENGINE WRENCH
    BODY KIT        the four wings + SUSPENSION SPRING
    TIRE BAY        the three compounds + TIRES STACK
    WEAPONS CACHE   CANNON CORE, ORDNANCE RACK, MAGAZINE DRUM
    CHASSIS & CREW  ARMOR, NITRO, DAMPERS, RECOVERY BEACON

A bay sells CHOICES (one at a time, trading against each other) or LADDERS
(each rung better than the last) and both wear the same card: picture, bar,
price, one button that says what tapping does. `renderGarage()` is four lines
now; it used to fill three separate containers with three different layouts.

### Pictures, from the real meshes
`buildPartIcon(kind, id)` in vehicles.js builds a showroom model from the SAME
primitives and the SAME palette the part uses on the car, so the picture in the
shop is the thing you bolt on. `_studio` / `_shoot` in main.js is the one
off-screen renderer, extracted from `_carIcons`, and every picture is rendered
ONCE to a data URL and then it is an `<img>` — no second live WebGL context
animating behind a menu that already has a world rendering behind it.

`_buildPreview()` is the centrepiece: the selected car wearing its fitted parts
AND its whole upgrade kit, re-rendered only when the build signature changes.

### THREE FRAMING BUGS WORTH REMEMBERING
  - `_shoot` first took `dist` and scaled a hardcoded (5.2, 3.2, 6.2) rig by
    `dist / 8.86`. That rig is 8.70 long, not 8.86 — and passing "6.2" for the
    car shelf (meaning "the old z") moved the camera 30% closer and cropped
    every car on the shelf. `dist` is the TRUE camera distance now.
  - The studio camera looks in from +X/+Y/+Z and the exhaust stacks are built
    on +X. The blocks were first shot at `ry = 0.62π`, which put every pipe
    behind the block: a V4 and a V8 rendered as the same black box. They face
    their pipe side now.
  - A V4 and a V6 both have two pipes, so pipe count alone cannot separate
    them. The V6 wears the turbo its name promises — and it had to move to the
    FRONT face, because on the far flank it was hidden by the block.
  The icon meshes put every pipe on the camera side. On the car they are split
  across two banks, which is right there and useless in a 128px picture.

### Gates
test-parts 22/0 — now also pins that every part shows a rendered picture, that
no two parts share one (which is what proves the blocks read apart), that the
preview draws, and that all ten ladders find a bay. test-cars 28/0,
test-filters 35/0, test-boot 7/0, test-ladder 31/0, test-timeline 33/0,
test-mobile-hud green, boot.mjs 4/4.
`tools-scratch/garagefit.mjs` at 320/390/430: 0 overflowing, 0 clipped labels,
0 tap targets under 34px, 0 sideways scroll. It skips `.shelf-wrap`, because
the car shelf scrolls sideways on purpose and counting its children reported
200 false positives.

## r232 — THE SHOP FLOOR IS LIVE
"Match the graphics u sent and change the look realtime."

The still picture was honest and dead: you fitted a wing and a new data URL
appeared. `_stage()` is a real WebGL view — the car you have built, turning, on
a workshop floor with a painted bay outline, a back wall, a shop lamp and a
cast shadow. Fitting a part rebuilds the car on the stage in place, so the
hardware lands as you buy it.

### A SECOND WebGL CONTEXT HAS TO EARN ITS KEEP, and this one does it three
ways. Break any of them and the phone pays for a menu it is not looking at:
  - the loop runs ONLY while the GARAGE tab is on screen. `_stageRun(false)` on
    every other tab, and `_menuIdle()` from `startRace`. The tick itself
    re-checks visibility each frame and stops dead if it is wrong.
  - 30fps, not 60. It is a turntable.
  - small canvas, pixel ratio capped at 2, 512px shadow map.
The canvas is MOVED between repaints, never rebuilt — `_renderBuildPreview`
sets innerHTML, so the stage is re-appended afterwards. A context per repaint
would hit the browser's cap in a dozen tab switches.

### TWO FRAMING BUGS, both from guessing instead of measuring
  - The first cut divided a constant by the aspect ratio and put the camera 6
    units from a 6.5-unit car: the shot came out inside the door.
  - The fix used the bounding SPHERE, which is the wrong shape for a car — it
    has to contain the diagonal, so a long low machine got a radius set by its
    LENGTH and half the canvas was empty above and below it.
  `_frameStage` fits the BOX: the widest silhouette it can turn to is its
  length, the height is its height, and the distance is whichever of the two
  fields of view is tighter. Self-tuning for any car, any wing, any canvas.

### Also
`_dropCarMesh` frees a stage car: geometry always, materials only OUTSIDE the
upgrade kit — the kit's are shared singletons and disposing one blanks every
car in the game (r230). The still-preview path is deleted; `_carIcons` keeps it
for the car SHELF, which needs six pictures at once and must not animate.

On a phone the floor is full width with the spec underneath — side by side it
was 156px of a 390px screen, a stamp, when the machine on the shop floor is the
whole point. Two columns return at 620px.

test-parts 23/0 (now pins that the stage is a live mounted canvas carrying the
fitted build), test-cars 28/0, test-filters 35/0, test-boot 7/0, test-ladder
31/0, test-timeline 33/0, test-mobile-hud green, boot.mjs 4/4.
`tools-scratch/stage.mjs` proves it turns, that a fitted V8 adds hardware with
no reload, and that the loop STOPS on another tab and mid-race.

## r233 — THE CHASSIS DECIDES WHAT IT CAN WEAR
"Improve the designs. Make the elements more visible and exciting. Not all
elements should be available for all chassis. That's the reason for upgrades on
chassis. Add more explicit ways to signify what's upgraded."

Note for whoever reads the report images: the screenshot sent alongside showed
a "BODY KIT (STAGE 1)" card and coin icons that have never existed in this
repo — checked against the live bundle before building anything. Both images
were TARGETS, not bug reports. Do not go hunting for that card.

### Mount classes — the same shape the tyres already had
`CHASSIS_MOUNT` gives every car a base class per slot; a ladder raises it, and
which ladder is declared on the slot (`mount`, `mountName`). ENGINE WRENCH
opens engine bays, SUSPENSION SPRING opens wings — which is the answer to
"that's the reason for upgrades on chassis": those two lines now have a second
job, exactly like TIRES STACK opening a compound.

A LADDER IS WORTH EXACTLY ONE CLASS, at level 3. It was one per two rungs
first, and that let six of eight chassis reach the top class — true on paper,
meaningless in play. At one class the roster splits and stays split:

    V12 (class 3)   DUNE, BASTION, PIT      the heavy machines
    GT WING         SLEEK, CROWN, FLATSIX, ALPINE   the light ones
    NO CAR IN THE GAME CAN WEAR BOTH, and the starter BRAWLER can wear
    neither — which is a reason to buy a second machine.

Fitment is clamped ON READ, like the tyre compound: drop the ladder or swap to
a smaller chassis and a V12 comes off the car but stays OWNED.

### Three walls, told apart
A part can be out of reach three ways and they want three different things, so
they must not share one padlock:
    earn    a race you have not run          "🔒 2/3", amber
    mount   a ladder you have not climbed    "🔧 ENGINE 3", blue, names the
                                             level AND where you are
    capped  a chassis that will never take it "⛔ WON'T FIT", greyscaled, and
                                             it NAMES the cars that can
`partHomes()` is what makes the last one actionable — a dead end becomes a
reason to own another car.

### Saying what is upgraded
Spec chips light up when they are above the stock part; every stat carries its
delta against the chassis baseline (TOP 63 +7); the name carries STOCK or
MODIFIED; a mods line counts parts swapped and upgrades fitted; every part card
shows its CLASS; and each slot bay states the chassis ceiling and which ladder
raises it.

### Showroom paint
`iconMats()` is a SECOND palette, for shop pictures only. The kit's own palette
is deliberately dark because those parts live on a car at speed where bright
reads as damage; a thumbnail has the opposite job. Red crackle cam covers,
chrome, brass headers, alloy wheels with spokes.
THE PLENUM WAS A LID: at 1.28 wide it covered the cam covers and every block
rendered as a black box with gold pipes. It is 0.62 now and the red shows either
side — that one change is most of why the engines read at 100px.

### Gates
test-parts 30/0 — adds the capped refusal, that it names compatible machines,
the mount refusal naming its ladder and level, the part falling off when the
ladder drops (while staying owned), and going back on when allowed.
test-cars 28/0, test-filters 35/0, test-boot 7/0, test-ladder 31/0,
test-timeline 33/0, boot.mjs 4/4, and 320/390/430 clean — the ceiling chip
wraps rather than running 379px wide out of a 320px panel.

## r234 — HEADER PINNED, START RACE CHARGED, AND ALASSIO
Three asks in one report: "Move title name and credits at the top, make them
always visible. Make start race sparkly electric as in the screen. Create race
tracks inspired by this city Alassio Italy."

### The bar carries the wordmark and the balance
Both were in the page and scrolled away, and the balance is the number every
purchase in the garage below is measured against. The bar is up for the WHOLE
menu now (it used to appear only when there was a way back) with three slots:
BACK when there is somewhere to go, WHERE YOU ARE in the middle — the wordmark
at the front door, since there is nowhere more specific to name — and CREDITS
pinned right, which never shrinks. The in-page hero title and credits chip are
deleted; keeping both is the duplication that made this header 500px tall.
`_syncCredits()` is called from every path that moves the balance, because a
stale number in a bar that is ALWAYS on screen is worse than one that scrolled
away.

### START RACE, charged
Three composited layers, no JS and no extra elements: a sheen travelling across
the face (::before), a spark field drifting up (::after), and a breathing glow
on the box-shadow. Silenced under `prefers-reduced-motion`, and killed on
`.blocked` so a button that cannot be pressed does not advertise.

TRAP, AND IT COST A BUILD: the new rule opened with `position:relative`, which
silently overrode the `position:sticky` the footer runs on. The button dropped
out of its pinned spot into the flow and was only visible at the very bottom of
the page. Sticky already establishes the containing block the pseudo-elements
need — do not re-declare position on `#start-btn`.

### ALASSIO — chapter 13, worlds 73-76
`THEMES.riviera` is DERIVED from `medterrace`, because that theme already has
the sea machinery, the pantile roofs and the olive hills right. What Alassio
needs on top is: the Ligurian pastel palette (ochre/apricot/rose with green
shutters — `splinter` is the most direct statement of what the walls are made
of), sand rather than limestone dust underfoot, softer hazier air than the hard
olive-terrace sun, and three times the houses over most of the lap because it
is a TOWN.

It is also the one Mediterranean theme that is genuinely SEALED — a promenade
and a town's own streets are tarmac in a way an olive terrace is not, and it
gives the ROAD compound a home.

Four worlds, because the town has four kinds of road and one lap would waste
all of them. Every one borrows an existing route shape:
    73 ALASSIO SEAFRONT  corniche  the four-kilometre arc of sand
    74 IL BUDELLO        monaco    the lane — walls both sides, no run-off
    75 PORTO MOLO        marina    the quays, sea on both sides
    76 CAPO MELE         turini    the headland, hairpin on hairpin

TRAP: `elev.profile: 'ascent'` IS HAND-SHAPED AND REQUIRES `elev.keys`. The
ascent branch reads `E.keys` directly, so an ascent without them throws
"Cannot read properties of undefined (reading 'length')" during world build and
the level never appears — `node --check` cannot see it and the other three
worlds booted fine. CAPO MELE has its key list now. Use the sine form
(amp + ph) unless you are hand-shaping a climb.

Built and measured: 73 len 1881u / tightest 19u, 74 len 1370u / tightest 13u
(the tightest lap on the roster), 75 len 1541u / 16u, 76 N=900 on turini.

test-parts 30/0, test-cars 28/0, test-filters 35/0, test-boot 7/0,
test-ladder 31/0, test-timeline 33/0, test-mobile-hud green, boot.mjs 4/4.

## r235 — ALASSIO'S BUILDINGS, DESIGNED
"Screenshots. Make sure it's matching my reference meaning new buildings needs
to be designed."

### The bug was one inherited word
`THEMES.riviera` derives from `medterrace`, and that inheritance brought
`elements: 'medhill'` with it — the generic Mediterranean HILL kit, squat farm
houses on an olive terrace. Alassio is not a hill village; it is four and five
storeys of painted render standing shoulder to shoulder along a seafront. The
worlds shipped in r234 with the wrong town in them and nothing failed, because
a theme that picks a real kit is never wrong, only wrong-looking.

WATCH THIS WHEN DERIVING A THEME: `elements` selects from `ELEMENT_KITS`, and
an unknown name falls back to `farm` SILENTLY. Deriving a coastal theme from an
inland one and forgetting `elements` gives you farm buildings on a promenade
with no error anywhere.

### Two new archetypes
The existing `towerhouse` is a Cinque Terre hill house — four storeys on a
small square footprint. The reference photograph is a different building, so:

  palazzina  FIVE storeys, wider than deep because it is one of a terrace: a
             three-pier shop arcade at street level under a canvas awning, a
             stone string course between every floor, a balcony on each of the
             three middle floors, shuttered pairs above. What reads from a car
             is the ORDER OF HORIZONTALS — awning, three balconies, eaves — so
             everything else serves keeping that rhythm legible.
  shopfront  the budello's own building: narrow, three storeys, almost all
             shop at the bottom. Deliberately SHORTER than the palazzina — a
             lane where every building is the same height reads as a corridor.

`ELEMENT_KITS.alassio` builds palazzina / shopfront / palazzina / towerhouse
and drops the farm shed, because there is no farm on a seafront. `frontage`
gives the town its own paint — apricot and rose against Cinque Terre's
saturated coral, with the dark green of the photograph on both frame and
shutter.

### THE SCREENSHOT PROBE, AND TWO WAYS IT LIED
  - It first searched the scene for objects named like buildings and reported
    "0 buildings" on a world holding 12,632 instanced objects. Houses land in
    SHARED InstancedMeshes; there is no per-building node to find. Park the
    camera on the road at a fraction of the lap instead.
  - It then wrote a 12KB blank. `render()` and `toDataURL()` MUST HAPPEN IN
    ONE `evaluate`: the drawing buffer is not preserved and the game's own rAF
    loop re-renders from the car's camera the moment the call returns. Same
    rule already recorded for hillshot.mjs — third time this has been paid for.
    A real frame weighs ~900KB.
`tools-scratch/townshot.mjs` takes LV and F.

## r236 — THE LIGURIAN MODULE SET, AND TWO MORE DISTRICTS
"Add Sanremo mountains and Genova. Make sure they are all unique looking. Don't
use that template. Create a Ligurian template that will match the designs."
Sent with village-builder sheets naming the archetypes.

### The four modules
r235's `palazzina` and `shopfront` were a GUESS at a Ligurian building. The
sheets name the real ones and are specific about what separates them, so the
guess is gone and these are modelled instead. One of each on a street reads as
a town; four of one reads as a texture.

  ligSlender   six storeys on 4.6u — three times taller than it is wide. The
               PROPORTION is the design; no balconies, a strict jalousie grid.
  ligTwin      two bays sharing a party wall at DIFFERENT heights and colours.
               The height step is the whole tell — level, it is one fat house.
  ligCorner    the block that turns a junction: stepped chamfer, shop arcade
               under two awnings on each street face, heavy cornice, parapet.
  ligRural     the hinterland house: low, wide, stone ground floor, and GREEN
               SLATE rather than pantile. The sheets treat that one material
               swap as what separates a mountain village from a seafront, and
               they are right — it does more work than any other single change.

TRAP: the ninth element of a part tuple is `roll`, a rotation about Z, NOT a
yaw. The corner's 45-degree chamfer was first written as a rotated slab and
would have come out lying on its side. It is four stepped boxes now, which
makes the same silhouette with no rotation at all.

### Three districts off one module set
Same modules, different weights and paint — which is how three towns on one
coast stop looking like one town:
  alassio  slender/twin/slender/corner  Golfo Paradiso pastels, pantile
  genova   corner/slender/corner/twin   deep reds and burnt ochre, urban,
                                        10 stone walls, a working port
  sanremo  rural/rural/slender/twin     cream render, GREEN SLATE, drystone

### The two new worlds
  77 GENOVA PORTO   `panorama` — flat-then-mountain, which is Genova exactly:
                    the docks, then straight up into the hills the city is
                    stacked on. 118 buildings, the most built-up lap on the
                    roster.
  78 SANREMO STAGE  `corse` — the rally runs in the mountains BEHIND the town,
                    so this world has `coast: undefined` and no sea in it at
                    all. Cold high sun (el 1.02 against the coast's 0.82),
                    880 trees, 720 rocks.

### NOT DONE, and it is the larger half of the request
"Re design all templates according" was sent with WINE REGION and SCOTTISH
HIGHLANDS sheets. Those are different regions entirely — Alsace/Burgundy wine
villages, Scottish crofts under heavy slate — and the roster has a dozen more
building kits besides (alpine, medhill, oldtown, hedgerow, outback, farm...).
Redesigning every one of them from those sheets is a much bigger piece of work
than this commit. Only the LIGURIAN set is redesigned here.

## r237 — HIGH POLY, AND THE BUG THAT FOUND
"Make it high poli."

### THE REAL FINDING: r236's buildings were not being placed
Measuring the budget before adding a triangle is what caught it. IL BUDELLO
reported 156 wall instances — about a hundred dwellings — but its box count did
NOT move when the four Ligurian templates tripled in detail. That can only mean
one thing: the buildings standing in Alassio were not the Ligurian ones.

`_buildHuts` places the ~96 dwellings that MAKE a town, and it always drew them
from the global `COTTAGES` list — eight generic cottages — while the district
kit's own `builds` list was read by nothing but a three-house village layout.
So the whole module set shipped in r236 stood in three buildings out of a
hundred, and Alassio was a coast of English cottages wearing a pastel palette.

`_buildHuts` prefers `K.builds` now and falls back to COTTAGES, so no existing
world changes. Measured on IL BUDELLO: box instances 2,478 -> 10,997.

LESSON, AND IT IS THE SAME ONE AS THE MISSIONS SCREEN: shipping a template is
not shipping a building. Check the instance count, not the diff.

### The detail itself
`ligWin` / `ligRail` / `ligCornice` / `ligTiles` / `ligChimney` are a shared kit
above HOUSE_TEMPLATES, because a window is the same assembly eighty times over
and eighty hand-written copies is where transcription errors live. A window is
now a recessed pane, two reveals, a lintel, a projecting sill and two shutter
leaves — six parts that each catch their own shadow. This engine has no normal
maps, so DEPTH is the only way a facade stops reading as a texture.

`element-cyl` went 10 segments to 16 and `element-cone` to 14 — both are single
shared geometries feeding one InstancedMesh each, so it is paid once per world.

### THE 9TH ELEMENT OF A PART IS `roll`, NOT A YAW
It rotates about the FORWARD axis. The corner building's chamfer was authored
as `['wall', ..., 0.785]` expecting a plan rotation, which would have tipped the
wall onto its side. There is no per-part yaw. The corner is a DRUM now — a
cylinder with banding rings and a turret cap — which needs no rotation and
looks the same from every approach, which is what a corner has to do.

### The budget, measured either side
    before  326k tris / 313 draw calls   (and the wrong buildings)
    after   464k tris / 319 draw calls   IL BUDELLO, the densest town
            514k tris / 270 draw calls   SANREMO
DRAW CALLS ARE FLAT — that is the number that matters on a phone, and it holds
because every building part lands in one of five InstancedMeshes. Triangles are
the cheap axis here; calls are not. Do not add a building part that needs its
own material.

test-buildings green (66 destructible buildings, 0 unresolved parts), test-boot
7/0, test-ladder 31/0, test-timeline 33/0, boot.mjs 4/4.

### STILL OPEN
The scatter puts the town to ONE SIDE of the road with bare ground opposite —
see the r237 screenshot of IL BUDELLO. A budello should be walled both sides.
That is `_element`'s road-clearance gate and the `_zonePos` scatter, not the
templates, and it is the next thing worth doing on these worlds.

## r238 — THE SEGMENT BUMP THAT DID NOT SHIP IN r237
r237 claimed `element-cyl` went to 16 segments. It did not: there are TWO
`_realizeElements`-style sites building `gCyl`/`gCone`, the edit asserted
`count == 1`, the assert threw, and the file was never written. The assert did
its job — the failure was invisible because that command was backgrounded and
its output was never read.

TWO LESSONS, both cheap:
  - `grep -c` the thing you changed before believing it shipped. The r237
    deploy check did exactly that and printed `rounder primitives: 0`, which is
    the only reason this was caught.
  - Do not background a command whose output is the proof it worked.

Applied at both sites now: cylinders 10 -> 16 segments, cones 10 -> 14.
IL BUDELLO: 464k -> 503k triangles, draw calls still 319. element-cyl 64k ->
102k, which is what a hundred buildings' worth of balusters, downpipes, chimney
pots, arcade columns and corner drums costs to stop being decagons.

## r239 — THE ARRANGEMENT WAS THE PROBLEM, NOT THE MODELS
"It is nothing like the screenshots I sent. Follow those 1:1."

Fair. Three passes had gone into DETAILING buildings and none into how they are
ARRANGED, and the reference sheets are about arrangement: their subject is
TERRACES — houses sharing party walls in a continuous run down both sides of a
street, four and five storeys, three bays each, shops at the foot. Free-standing
towers scattered in a field cannot look like that however good each one is.

Three concrete gaps, all now closed:
  1. PROPORTION AND WINDOW COUNT. The frontage inherited the default street:
     two-storey market-town units. `BAYSETS.liguria` in textures.js is four and
     five storeys of three bays, and `height: 14 / unit: 7.2` is the sheet's
     own near-2:1 block. This is the one the eye reads first, from a car, long
     before any moulding.
  2. THE GREEN PERSIANE. Every building on every sheet shares one colour: the
     dark green shutter. It is now the frontage's `shutter` AND the tint list
     is the sheet's own stucco swatches in order.
  3. TWO SYSTEMS DRAWING THE SAME TOWN. `frontage` builds the street wall and
     `_buildHuts` scattered 96 free-standing houses behind it, so the budello
     had a terrace along the road AND a field of towers. The scatter stands
     down to a handful of backland buildings where a frontage exists.

### THE BUG: `str.replace` REPLACES EVERY OCCURRENCE
Threading `set` into `townhouseBays` was written as a plain Python replace of
`const VB = townhouseBays(variant);` — which hit TWO call sites. The second is
`townhouseGlowTexture`, which has no `set` in scope, so every Riviera world
died at build with "set is not defined" and `node --check` saw nothing wrong.
The fix is not just scoping: the glow texture MUST take the same bayset as the
facade, because its whole job is lighting the same openings — its own header
records the earlier bug where lit rectangles landed on blank wall.

Use an explicit count assertion on every replace. r237's segment bump was lost
to the same class of mistake in the other direction.

### STILL NOT 1:1, and worth naming
  - The street wall is ONE-SIDED at the start line. The frontage validates each
    block against the carriageway and the grid start is open ground, so the
    inside of that corner stays bare.
  - The ground is still sand. A town street should be paved to the building
    line; `riviera` inherits a beach ground from `medterrace`.
  - The corner building is a drum (r237). The sheets draw a CHAMFERED corner
    with a ground-floor arcade. There is no per-part yaw, so a true chamfer
    needs either a new primitive or a yawed sub-group.

boot.mjs 4/4, test-boot 7/0, test-buildings green, test-ladder 31/0,
test-timeline 33/0.

## r240 — THE ROAD WAS THE PROBLEM
"Change the design drastically to look 1:1."

Four passes had gone into buildings. The buildings were never the problem.

### A 9 u HALF-WIDTH ROAD CANNOT HAVE A STREET WALL
`_clearsRoad` refuses any frontage block whose face lands inside
`widthAt(i) + 1.6`. On a default road that is 10.6 u from the centreline, and
with `lateral 15 / depth 8.5` the face sat at 10.75 — passing by 15 cm on a
straight and FAILING everywhere the road widened or turned. That is why the
terrace kept coming out sparse and one-sided, and no amount of detailing a
template could have fixed it.

    roadWidth: 0.55   IL BUDELLO — "the gut" is one car wide
    roadWidth: 0.7    GENOVA — a caruggio, barely wider
    lateral: 9.6, depth: 7.0, height: 17.0

`height: 17` is the number that turns a road with houses beside it into a
STREET: it is what encloses the view.

### AND A STREET HAS NO COUNTRYSIDE IN IT
Rocks, scrub, tufts and wildflowers between kerb and wall are what kept reading
as "road through a field". All zeroed on the two town worlds, and the ground is
`TOWN_GROUND` — worn paving, not the beach sand `riviera` inherits from
`medterrace`. The ground is most of the frame from a chase camera; a
sand-coloured one puts the town in a desert.

### CHECK THE SHOT YOU ARE JUDGING FROM
Every screenshot up to here was taken at the START LINE, from above. The grid
is deliberately open ground on every world in the game, so it is the one place
a street world looks least like a street — four rounds of "it still doesn't
match" were partly me judging from the worst possible camera.
`tools-scratch/lapshot.mjs` stands on the road at driver height at a given lap
fraction. Use it for anything about how a world LOOKS.

boot.mjs 4/4, test-boot 7/0, test-buildings green, test-ladder 31/0.

## r241 — THE STREET SURFACE AND THE PALETTE, FROM THE TARGET IMAGE
A render was sent with "this is how I want it to look, anything else won't be
acceptable". Compared against r240 the gaps were mostly NOT the buildings:

  1. THE ROAD IS ~40% OF THAT FRAME. Theirs is large irregular setts in pale
     greys, beiges and a faint lilac, with a TRAM LINE bedded in tan running
     down it. Mine was speckle noise on grey.
  2. The palette is muted taupe / stone / ox-blood with PALE window frames
     against dark glass — not saturated pastel.

### Tram rails are a texture pass, not geometry
The road canvas maps its WIDTH across the 22 u ribbon and its HEIGHT along the
direction of travel (see RUT_CX), so a vertical stripe on that canvas is a line
running down the road. `applyTramRails` paints two bedded rails for the cost of
a few fills — a mile of rail geometry would have been absurd for the same
result. Drawn AFTER the cobbles, which is the right order: track is laid INTO a
street, not under it.

`TOWN_ROAD` sets the setts at `rows: 20, per: 26` — 22 u across 26 stones is
~0.85 u each, about a dinner plate, roughly twice Tremola's hand-laid sett and
what the reference shows.

### The pale window frame is doing more work than it looks
`frame: '#efe9dc'` against `pane: '#1e232b'`. A light frame on dark glass is
what makes a window grid read from the far end of a street; the saturated
version had a dark frame on dark glass and the grid dissolved past ~40 u.

### STILL SHORT OF THE TARGET
  - NO HALF-TIMBERING. The reference has dark timber framing over cream infill
    on several facades and it is a strong part of that look. It wants a facade
    variant in townhouseTexture, not a new building.
  - The setts are more REGULAR than the reference's, which vary in size and
    shape as well as tone. `applyCobbleRoad` lays a strict staggered grid.
  - That reference is a northern/Hanseatic street, not a Ligurian one. The
    palette now follows the image rather than Alassio, which is what was asked
    for — say so if the colour should come back.

boot.mjs 4/4, test-boot 7/0, test-buildings green.

## r242 — HALF-TIMBERING, WHICH IS WHAT THE HOUSE DESIGN ACTUALLY IS
"Follow the design I sent you. Focus on the house design." The second reference
is a Fachwerk street: dark timber framing with diagonal braces over light
infill, warm rust and tan, steep street-facing gables, a flower box under
nearly every window.

`applyHalfTimber` paints the frame into the facade texture — a sill and head
beam per storey, posts between the bays, and the DIAGONAL BRACES that are the
whole reason the style reads. Without the diagonals it is a grid of lines and
the eye takes it for a modern curtain wall.

Painted, not modelled, and deliberately: this is one texture on a frontage
block, so the alternative is a hundred slender boxes per building. It is drawn
over the render and UNDER the joinery, so sashes still sit proud of the frame
as they do on a real one. `townhouseBays` returns `rows`/`xs`/`bh` now, or the
posts land through the windows.

### THREE THINGS THAT WERE WRONG ON THE FIRST TRY, all worth keeping
  1. TINTS MULTIPLY THE WHOLE FACE, so they are the INFILL colour and must stay
     LIGHT. The first cut used the reference's rust and brick reds as tints and
     got dark-on-dark: a near-black frame over a dark red panel, pattern
     invisible. On a timbered building the panel is limewash and the frame is
     the dark thing — the CONTRAST is the style. The reds live in the roofs.
  2. CORRECT SCALE IS INVISIBLE. At `w/32` the beam is a true 25 cm and gone
     past twenty units. This texture is read at speed from the far end of a
     street; `w/22` is a heavy oak frame and is also what the reference draws.
  3. ONE DIAGONAL READS AS A MISTAKE. It needs the opposing pair to close the
     panel into the "Mann" figure before it reads as a frame at all.

Also: `hemiIntensity` 0.7 -> 1.15. "Shade between four-storey terraces" was
true and wrong — once the buildings grew to 17 u they shadowed each other and
the whole frame went to mud. A street like this is lit by bounce off pale
render, so the ambient carries it rather than the key.

Flower boxes are painted under every upper bay (`boxes` in the face palette).
Most of the colour in the reference street comes from them.

STILL SHORT: the walls sit darker and browner than the reference's sunlit cream
and rust, and there is no jettying (the upper storeys overhang in the
reference; ours are flush).

boot.mjs 4/4, test-boot 7/0, test-buildings green.

## r244 — THE REFERENCE IS LIGURIAN, AND HAS BEEN ALL ALONG
Six sheets: two Monte Carlo renders, a WINE REGION and a SCOTTISH HIGHLANDS
builder, and THE LIGURIAN VILLAGE BUILDER — sent twice, which is the one that
says what the houses are. Ochre and yellow stucco, a pale architrave round
every opening, dark green louvred shutters, wrought iron across the upper
windows, terracotta pantile.

r242 built a Fachwerk street. That reference was northern and it is not in
this brief; almost everything this round is undoing it.

### THE FOUR THINGS THAT WERE NORTHERN
  1. HALF-TIMBERING. Gone from the coast. `applyHalfTimber` stays in
     src/textures.js — the wine-region sheet IS timbered and will want it.
  2. THE GABLE END TO THE STREET. Every roof in every Ligurian reference runs
     its RIDGE ALONG THE STREET and shows the road its eaves. `ridge: 'along'`
     on a frontage turns the prism a quarter turn and swaps its scale with it;
     the terrace is then capped by one continuous line of tile instead of a
     sawtooth. It is a rotation, not a model, and it is the largest single
     change in the silhouette.
  3. THE JETTY. The medieval overhang was r243's read of the Fachwerk street.
     A Ligurian facade is flush from pavement to cornice, so the course is
     `F.jetty` now and the riviera does not ask for it.
  4. THE TRAM. Two tan stripes down the middle of the road, from r241's
     Hanseatic image. There is no tramway anywhere in these references.

### THE THREE THINGS THAT ARE LIGURIAN, all painted into townhouseTexture
`surround`, `jalousie` and `iron` — each off by default, so a world that does
not ask keeps the facade it had.

  - JALOUSIE, and it is drawn INSIDE ITS OWN REVEAL. r243 had to shrink the
    old folded leaves to a fifth of the pier because three bays leave 18 px
    between windows and a pair either side ate all of it. A shutter folded
    back into its reveal takes no pier at all and is the same green block in
    the same place from a car. A third are shut; the rest leave the middle
    glazed.
  - SURROUND, and it is a LINE, NOT A PANEL. The first cut filled the
    architrave and it made 40 px of white per column out of a 192 px face:
    three columns merged into pilasters and the stucco, which is the whole
    colour of the building, was left as a margin. Same failure as the r243
    shutters, in the same 18 px, and the same fix.
  - IRON at the SILL, not across the middle of the opening, where it read as a
    bar through the window and took the glass with it.

### TINTS ARE SAMPLED UNIFORMLY, SO THE PALETTE IS A WEIGHTING
Eight swatches with three dark ones builds a street that is three-eighths
dark. The reference terrace is overwhelmingly yellow, ochre and cream with the
deep red as punctuation — one corner building in a block — so the pale entries
repeat in the list and each red appears once.

### MEASURE THE LIGHT, DO NOT LOOK AT IT
`tools-scratch/roadlum.mjs` prints the mean colour of the carriageway and of
both walls from the driver's shot, and it overturned two things three passes
of squinting had "established":
  - the paving was never blown out. 0% above 240 at any setting tried, mean
    158. It looks white in a 900 px screenshot next to a shaded wall at 67.
  - the sun barely reaches a wall in a lane this narrow: 2.4 -> 3.0 moves the
    shaded wall by nothing and the sunlit one by two units, and everything
    else it touches is the road. So the key came DOWN and the ambient, which
    is what actually lights these facades, carries the street.
`tools-scratch/roadtex.mjs` is the companion: it prints the cobble palette the
RUNNING theme is using and dumps the road mesh's own map. Between them, three
rounds of "the road is too bright" became one measurement.

### A CHIMNEY WAS FLOATING OVER MOST OF THE GAME'S COTTAGES
Not from this round. `chimAt` was handed `placed.y + hh` — the height the
terrace ASKED for — while `put` builds the body at `hh * [1, .62, 1.24, .94]`
for its variant. On the cottage, which is weighted heaviest and is therefore
most of every street, that is 38% of the wall height of clear sky between the
roof and its stack: the dark boxes hanging over the seafront in every shot
since r238. It takes `placed.h` and `placed.rh` now, and the stack is rendered
masonry rather than a near-black bar.

Gates: boot 4/4, test-boot 7/0, test-buildings green, test-carriageway green,
test-floating 6/0, test-cars green.

STILL SHORT: the sky. Both Monte Carlo renders sit under a faceted grey
overcast and every riviera world is under a deep blue one. That is a mood
change for six worlds rather than a facade fix, so it was left alone
deliberately — say the word and it is a `skyTop`/`skyHorizon` pass. The
sheet's palms, cypresses and standing street lamps are the other half of its
street-level panel and are flora/props work, not frontage.

## r245 — A BALCONY BELONGS TO A WINDOW
"The balcony is all over the place." It was, and it was made of three numbers
that knew nothing about the facade painted under them: a slab at
`baseY + hh * 0.52`, `wAlong * 0.42` wide, jittered a random third of the
frontage sideways.

### FOUR FAULTS IN ONE PLACEMENT
  1. `hh` IS THE HEIGHT THE TERRACE ASKED FOR. `put` builds the body at
     `hh * [1, 0.62, 1.24, 0.94]` for its variant, so 0.52 of `hh` is 84% of
     the way up a cottage — a balcony under the gutter — and 42% of the way up
     a merchant house. Same call, same street, a different storey on every
     house. This is the CHIMNEY BUG AGAIN (r244): anything hung on a house has
     to measure from what was BUILT, never from what was requested.
  2. It was never on a storey line, so on a five-storey face it cut across the
     middle of a row of windows.
  3. It was never on a BAY, so it hung on blank wall as often as not.
  4. At 0.42 of the frontage it was wider than the two windows it sat between.

### THE FIX IS TO ASK THE PAINTER
`townhouseAnchors(variant, set)` returns the sills, heads, bay centres and the
shopfront head of a facade in FRACTIONS OF THE BLOCK — v from the kerb up, u
from the middle of the frontage. The frontage builds one per variant and hands
it to `faceAt`, which then puts the slab on a real sill, centres it on a real
bay, and sizes it to one and a half bay widths.

The awnings had the same disease and the same cure: a flat `baseY + 2.95`
became the head of the shopfront that is actually painted there, and they only
go on the variants that HAVE a shopfront — an awning over a front door is not
a thing this street has.

### MEASURED, WITH A BASELINE
`tools-scratch/balconies.mjs` counts how many balconies and awnings sit within
2 cm of one of the painted storey lines. Run against r244 and then against
this build:

    balconies on a painted storey   196/319  ->  311/319
    awnings on the shopfront head    49/158  ->   89/90
    distinct awning heights              25  ->        6

The eight balconies and one awning still outside are the probe's own slack: it
matches each to the NEAREST body, and a cottage beside a merchant house can
claim its neighbour's. The number is a floor on the true figure, not a defect
count.

Gates: boot 4/4, test-boot 7/0, test-buildings green, test-carriageway green.

## r246 — THE SQUARES, AND THE FOUNTAINS IN THEM
Asked for straight off the sheet, which gives FOUNTAIN MODULES, STREET LAMP
OPTIONS and PLANT & TREE TEMPLATES a panel each, and off the Monte Carlo
render, whose entire foreground is a paved terrace with a fountain, lamps and
planters on it.

### A SQUARE IS A HOLE IN THE STREET WALL
That is the part that is not decoration, and it is why `_buildPiazzas` runs
BEFORE `_buildOldTown`: the frontage asks `_inPiazza` before placing every
block and refuses any house that would stand in the square. Without it the
fountain ends up in somebody's front room.

The same question belongs in `_clearsRoad`, which is the choke point every
scatter in the game already goes through — forest, ground cover, huts,
trackside kit and props are all built after the squares and all ask it. One
line there is the difference between a piazza and a piazza with a tree growing
out of its fountain. (`_clearsRoad` exists TWICE, on Track and in flora.js,
and flora's copy shadows the class's — both were changed.)

### SEAT ON THE HIGH CORNER
Seated at the LOW corner's height, the ground rises through the paving
everywhere else: the first cut was a slab buried in a beach with a fountain
apparently standing on sand. It seats on the HIGH corner and the plate is made
thick enough to reach the ground at the low one, which is also how it gets the
raised-terrace-with-a-kerb look the reference has. Sites with more than 1.7 u
of fall across them are refused outright — no seating fixes a flat plate on a
hillside.

### BUILT BIG, OR IT IS A BIRDBATH
A 2.4 u basin is correct against a person and invisible against a street of
14-17 u houses. 6 u across the basin and 4.7 u to the top of the jet is a
fountain you could sit six people round, which is what the reference draws.
The water sits a centimetre PROUD of the rim: dropped inside, the basin's own
solid top face hides it and the fountain is a stone drum.

### ONE DRAW CALL PER PART, NOT PER SQUARE
Every square in a world is the same size and carries the same kit, so the
basin is one InstancedMesh with an instance per square rather than a mesh in
each of three groups. As loose meshes it came to ~42 draw calls a square;
instanced it is 20 for the whole world however many squares are in it
(measured: `tools-scratch/pzcount.mjs`, 20 calls / 92 pieces / 2 squares). The
street frontage — hundreds of houses — costs eight, and this had to be in the
same order of magnitude.

### AND NO HAND-WRITTEN ROTATIONS
Local-to-world goes through three.js: `applyAxisAngle` for the site test, a
composed matrix for the parts, and the INVERSE of that same matrix for
`_inPiazza`. A rotation written out by hand at the placement end and again at
the test end is two chances to get a sign wrong and no way to notice, which is
how furniture ends up mirrored across a square.

Tunes: `piazza: { count, depth, width }` on riviera (2 squares), genova (2)
and IL BUDELLO (1, and smaller — a lane whose houses stand 6 u off the
centreline cannot take the seafront's 17 u square, it would be refused at
every station on the lap).

Probes: `tools-scratch/piazza.mjs` (where they landed, how far the inner edge
clears the road, and how many houses stand inside one — must be 0),
`piazzashot.mjs` (the driver's view OF a square, which is not the view down
the street that lapshot gives), `pzcount.mjs` (draw calls).

Gates: boot 4/4, test-carriageway green, test-buildings green. The road
census was run over the four square worlds BEFORE and AFTER, and comes back
identical — same 5 bodies, same 1 floater, same worst bites, all of them
pre-existing (four 10.8 u poles on SANREMO, a dodecahedron rock on ALASSIO).
The only thing that moved is the solid count, which is the squares' own
furniture registering. Running it on one build and calling it clean would not
have told anybody anything: three of those four worlds were already dirty.

## r247 — THE CHURCH AND THE MONUMENT
More squares (riviera 3, genova 3, sanremo 2), and two things to put in them.

### A SQUARE THAT REPEATS IS ONE SQUARE SEEN THREE TIMES
So the centrepiece alternates: a fountain on the even ones, a MONUMENT on the
odd — a bronze on a column on a stepped plinth, 16 u to the top of its raised
arm. Taller than the fountain on purpose: a fountain is furniture you look
down into and a monument is a thing you look up at, and standing a storey
above the four-storey terrace is what makes the second square read as a
different place rather than as the first one again. The figure is three boxes
and a sphere — at the distance a driver reads it the silhouette is the whole
content, and anything more is polygons nobody will see.

### THE CHURCH IS THE ONE LANDMARK, SO IT IS BUILT ONCE
On the first square that can take one. A town has one parish church, not one
per square, and it is what the rest of the lap is oriented by.

A LIGURIAN PARISH CHURCH IS A FLAT GABLED FACADE AND A SEPARATE TOWER — not a
spire on a nave. The campanile stands apart, square in plan, with an open
belfry stage and a low pyramid cap; getting that pairing right is most of what
makes it read as this region.

Four things were wrong on the first try, all of the same kind — building the
right shape and then not looking at it from where the player stands:

  1. STONE. It used `stoneTexture`, which is the campanile's dark rubble, and
     19 u of it put a black cliff across the head of the square. A Ligurian
     church is PAINTED — flat render a shade lighter than the terrace, which
     is righter and cheaper both.
  2. THE BELFRY was a solid dark box, which at any distance is a black cube on
     a white tower. It is light stone now with a dark opening driven through
     both axes: an arch on all four faces for two instances, and those
     openings are the whole silhouette of a campanile.
  3. THE DOOR AND THE ROSE WINDOW WERE INSIDE THE WALL. `outward` points AWAY
     from the square, and both were placed at `+outward` — so they showed a
     couple of centimetres on the BACK of the facade and the square looked at
     a blank white wall. Caught by standing in the square and looking at it
     (`piazzashot.mjs FACE=1`), which is the only shot that could have.
  4. THE GROUND BEYOND A SQUARE IS NOT THE SQUARE'S GROUND. The flatness test
     covers the paving; the church hangs 19 u past its far edge, which on the
     seafront is often the top of a bank. It gets a plinth that reaches 5 u
     down — fixed height, because every part of this kit is one memoised
     geometry drawn at unit scale and a box buried in a hillside costs nothing
     — and the fit test refuses a site with more than 4 u of fall.

### A COLLIDER SEATS ON THE GROUND UNDER IT, NOT ON THE PLATE
The square is seated on its HIGH corner, so a solid registered at plate height
over ground that falls away is air — and the road census calls anything over
2.5 u a FLOATER. The church's own solids tripped exactly that: GENOVA PORTO
went from clean to two floaters at 3.9 u, and `tools-scratch/floaters.mjs`
named them by radius (5.46 = CHURCH_WID * 0.52) in one run. Every piazza solid
takes `min(plate, ground) + 0.6` now, and the census is back to baseline: 73
clean, 77 clean, and the one floater on 74 and four bodies on 78 are the same
pre-existing ones from before r246.

Also: the nave gets THREE solids along its length rather than one round it. A
single circle big enough to cover a 19 u building reaches back over the
square's own paving and puts an invisible wall across it.

Cost: 50 draw calls for the whole civic kit — squares, fountains, monuments,
church and campanile — against 1056 in the scene, and it does not grow with
the number of squares. If it ever needs to come down, the church's ~20 are
mergeable by material into about five.

Gates: boot 4/4, test-boot 7/0, test-buildings green, test-carriageway green,
road census over 73/74/77/78 back to the pre-r246 baseline.

## r248 — HIGH DETAIL, AND WHAT IT COST
"Add high details. Overall." A detail pass over the whole town: the facade
painter, the roofline, and the ground between the kerb and the front door.

### THE FACADE IS AUTHORED IN A 192x256 GRID, SO DO NOT MOVE THE GRID
Every bay table, string course and sill offset in textures.js is a number in
that space. Rescaling the canvas means rescaling all of them, and one missed
constant is a shutter through a window. So the canvas grows and the CONTEXT is
scaled to match — `g.scale(TH_SS, TH_SS)` and a local `w`/`h` of the authored
size — and every existing coordinate stays valid. On a 17 u wall the old
texels were 9 cm, coarser than the joinery drawn on them; at 1.75x the
louvres, architraves and ironwork survive the mip chain to the end of a
street.

1.75 and not 2: this is eight facade maps a world, and the gain stops once a
texel is finer than the beam it draws.

THE GLOW MAP DOES NOT GET IT. The two meet in UV space, not in texels — a
thing the first cut's own comment got wrong — and the glow draws soft light
behind glass, which has no edge worth the pixels. Eight of those at 1.75x was
2.7 MB spent blurring a blur.

### WHAT THE RESOLUTION BOUGHT
  - THE CORNICE IS A MOULDING, not a flat 9 px band: corona, dentil course,
    bed mould, and the shadow each throws. It is the line the whole terrace is
    read against from the far end of a street.
  - QUOINS up both edges of every front. On a terrace the texture's edges ARE
    the party walls, so this also gives the eye the line between one house and
    the next — which a run of twelve identical boxes had nothing to mark.
  - A KEYSTONE on every opening, which is the piece of an architrave the eye
    picks out at distance.
  - A DOWNPIPE with collars. Nothing says "built" like the one vertical on a
    facade that is not architecture.

### AND THE STREET GOT A FOOTWAY
Between the kerb and the front door was open ground: the terrace stood on the
same dirt the countryside is scattered on, and no amount of facade detail
fixes a street with no pavement in it. A slab per house from the building line
out to the road edge, a kerb course at the end of it, and a bollard every
third house — all instanced, and all held 0.7 u clear of the driveable edge so
none of it can ever be something you hit. The census agrees: its "road
surfaces" suppression count went 306 -> 446 and nothing new appeared in a
carriageway.

Also: a RIDGE CAP on every roof (the gable prism met itself in a bare arris,
and since r244 that arris is the longest single line in the frame), a POT on
every chimney, and a VALANCE on every awning — the flap off the front edge,
which is the only part of an awning seen straight on from a car.

ONE JITTER, SHARED. The valance takes the awning's own random offset rather
than drawing its own: two calls to `Math.random()` there and the flap belongs
to a different shopfront from the sheet it hangs off.

### THE PRICE, MEASURED
`tools-scratch/towncost.mjs`, IL BUDELLO, before and after:

    draw calls   1110  ->  1117      (+7: ridges, pots, paving, kerbs,
                                      bollards x2, valances)
    instances   10707  -> 13318
    textures    17.4 MB -> 19.3 MB   (the supersample, less the glow maps)

Seven draw calls and 1.9 MB for the whole pass. Every new thing is one
instanced mesh for the world, which is the only reason the number is seven.

Gates: boot 4/4, test-carriageway green, test-buildings green, road census
over 73/74/77/78 unchanged from baseline.

## r249 — THE SKY, AND THE PEOPLE UNDER IT
The two things left between these worlds and the reference renders, and they
turn out to be the two biggest areas of every one of those frames.

### THE FACETED CLOUD BANK
Every reference image is roofed by angular slabs of cloud with a lit face and a
shaded one. Ours was a field of soft round sprites, which is a different
picture entirely.

THE FACETS ARE NOT PAINTED. `_buildCloudBank` puts real geometry — a squashed,
knocked-out-of-true icosahedron — in the scene's own directional light with
`flatShading`, so the sun that lights the street lights the cloud and the light
and dark faces fall where the sun actually is. No texture could have done that,
and a billboard certainly could not.

The vertex jitter is a HASH OF THE VERTEX POSITION, not `Math.random()`: the
two ends of a shared edge have to agree or the hull opens up.

IT IS ALSO CHEAPER THAN WHAT IT REPLACED. `_buildSky`'s own note has asked
since it was written for "one InstancedMesh billboard layer, which makes the
whole sky ONE draw" — this is that, minus the billboard. Measured on IL
BUDELLO: 14 cloud sprites (14 draw calls) became one mesh holding 37 clouds,
and the world's total went 1117 -> 1109 draw calls even after adding three
more meshes of people.

Three tunings, each from looking at the result:
  - NOT DIRECTLY OVERHEAD. Under 600 u a 400 u slab at 250 u up hangs over the
    street like a lid; one read as a flying saucer parked above the town. The
    bank belongs on the horizon half of the dome.
  - THE DARK END IS A SHADED CLOUD, NOT A THUNDERCLOUD. Past about three
    quarters of the way to `cloudDeep` a slab stops reading as lit from one
    side and starts reading as a hole in the sky.
  - AND THE STREET STAYS SUNLIT. The references are dramatic overhead and
    bright at ground level; the first pass at full overcast made a racing game
    look like weather. Seventeen clouds, not twenty-six.

`cloudKind: 'faceted'` is the only line that switches it. Drop it and the
sprite field comes straight back.

### TOWNSFOLK
A town with nobody in it reads as a film set however good the joinery is. The
sheet gives people a panel under STREET-LEVEL PROPS and both Monte Carlo
renders put a dozen on the pavement.

Three boxes and a sphere, instanced, per-instance colour, and no more: at the
distance a driver passes them the content is a silhouette and a colour.
Cosmetic and NOT registered — no solid, no prop, no score. They stand on the
footway r248 built, off the racing line, and nothing in this game is going to
be rewarded for driving at them.

TWO THINGS WERE WRONG, both found by measuring rather than squinting
(`tools-scratch/townsfolk.mjs`):
  1. A RING, NOT A BOX WITH A HOLE IN IT. Sampling a rectangle over the square
     and rejecting everything within 4.5 u of the fountain threw away most of a
     12 u-deep piazza: it asked for fifteen people and placed five.
  2. THE PLATE IS THE FLOOR. Square-goers seated on `_seatY` — the ground —
     stood buried to the shoulders, because the paving is seated on its HIGH
     corner and stands proud of the field by up to two metres. The square's own
     matrix already knows where its floor is; the transformed point comes back
     at it. Now 0 of 53 are sunk on ALASSIO and 0 of 14 on IL BUDELLO, and 0 of
     299 people across the two worlds stand on a carriageway.

### A CORRECTION TO r246
That entry says `_clearsRoad` "exists TWICE, on Track and in flora.js, and
flora's copy shadows the class's". The first half is true and the second is
not: `src/world/flora.js` and `src/world/sky.js` export `floraMethods` and
`skyMethods` and NOTHING IMPORTS THEM. They are a half-finished extraction, and
the live code for all of it is in track.js. Both copies were edited, so the
behaviour r246 describes is correct — but a future session looking for the
sky or the scatter should look in track.js and nowhere else.

Gates: boot 4/4, test-carriageway green, test-buildings green, road census over
73/74/77/78 at baseline (73's one body is the same dodecahedron at bite 1.24,
74's floater the same metal one at 3.8, 78's four the same poles).

## r250 — WHAT THE ITERATION FOUND
Four things, one of them a real bug that only showed up on one world.

### THE CLOUDS WERE TAKING THEIR COLOUR FROM THE DIRT
SANREMO STAGE's sky came out SAGE GREEN. The cloud bank r249 built was a
MeshStandardMaterial standing in the scene's lights — and a cloud is a big flat
slab seen from BELOW, so the face the player looks at is lit by the hemisphere
light's GROUND colour. Sanremo's ground bounce is olive, so its clouds were
olive. Every world would have tinted its own sky with its own dirt, and the
three worlds it was tuned on happened to have grey-brown ground.

The fix is to light them with nothing. `_cloudShardGeo` BAKES the shading into
a vertex-colour attribute — 0.52 straight down to 1.0 straight up, plus a
little per-face grain — and the material is MeshBasic. That is:
  - rotation-invariant, because it keys off the vertical only, so instances can
    still yaw freely (a sun-direction bake could not have);
  - identical in every world, which is the point;
  - free at runtime, and MeshBasic is the cheapest material there is for
    forty 400 u slabs covering a third of the frame;
  - and it leaves the per-cloud tint to the instance colour, which multiplies
    it, so `cloudTint`/`cloudDeep` still work.

### THE SHOPFRONT WAS A BLACK HOLE AT EYE LEVEL
The one part of a building a driver passes at two metres was a flat fill of the
unlit-glass colour, and a street of them is a row of caves. A shopfront in
daylight is a bright band at the top where the glass takes the sky, a dark room
behind it, something coloured on a shelf, and a painted fascia over the lot —
all four are painted now, and the fascia's lettering band is the only saturated
colour at street level, which is what the reference has. The plain-front
variant gets a fanlight and a doorstep for the same reason.

### A FOOTWAY IS FLAGGED
r248's pavement was a flat colour, which beside a cobbled road reads as poured
concrete. `pavingTexture` goes on the same instanced box; its UVs stretch the
courses ALONG the pavement, which is how flags are laid.

### AND THE ROOFLINE STOPPED REPEATING
Every roof was the same prism at the same pitch — a sawtooth to the vanishing
point. `flatRoofs` gives about one house in five a flat top behind a parapet,
which is the sheet's own corner building, and it breaks the rhythm at exactly
the place the eye reads a street. Two more instances off the trim mesh that
already existed, so it costs no draw call; the roof prism collapses to nothing
and the chimney is told to stand on the deck instead of on a ridge that is not
there.

### COST
No new meshes at all this round: the paving is a map on an existing instanced
box, the parapets are two more instances of `frontage-trim`, the flat roof is a
scale, the shopfront is paint, and the cloud change swapped one material for a
cheaper one. Textures +0.3 MB for the paving map.

Gates: boot 4/4, test-buildings green (including "every roof sits on its
house", which the collapsed prisms had to pass), test-carriageway green, road
census over 73/74/77/78 at baseline.

## r251 — THE CLOUDS AGAIN, BECAUSE THEY LOOKED BAD
Reported plainly and correctly. r249 gave each cloud ONE squashed icosahedron,
and a single convex hull has one silhouette and no internal form at all: from
the ground it is a hard-edged sheet hanging in the air. A paper cutout, or a
boulder.

### A CLOUD IS A CLUSTER, NOT A SLAB
Two things make one read: a BUMPY TOP EDGE of overlapping lobes, and a base
that is cut off. `_cloudClusterGeo` builds five to seven lumps in a row —
biggest in the middle, tapering to the ends, because that profile is most of
what makes a row of blobs read as ONE cloud rather than as a string — merges
them into a single geometry, and cuts the bottoms off.

Four things had to be got right, each found by looking at the render:
  1. FEWER, BIGGER LOBES. Ten small lumps packed into two radii overlap so
     heavily that what you see is the SEAMS between them: a crumpled-paper
     interior and no clean silhouette anywhere.
  2. HEIGHT. The first cluster spread its lumps over three radii of width with
     0.7 of a radius of rise — a strip of foam, not a cumulus.
  3. THE BASE IS RUMPLED, NOT PLANAR. Clamping every low vertex to y = 0 gives
     one enormous flat polygon underneath, and from a street you look straight
     at it — a pale sheet with a hard edge, which is the ice-floe read the
     slabs had and the whole reason for the rebuild. The cut-off height wanders
     with x and z instead.
  4. THE TINT IS NOT WHITE. The renderer tone-maps at 1.46 exposure, so a
     near-white cloud colour leaves the shader ABOVE white and every facet
     clips to the same value — perfectly good baked shading, rendered flat.
     Starting from a pale grey puts the whole range under the clip.

### AND THERE ARE FEWER OF THEM
The reference is a still photograph of an overcast. A bank dense enough to
match it rings the horizon, and from a car — camera at 2.6 u looking ALONG the
road, not up — thirty-seven clouds at a shallow angle stop being clouds and
become a lid. Twenty distinct ones against blue is the same style and a much
better sky to drive under. `tools-scratch/skyshot.mjs` is the shot that settles
this: pitched up, so the frame is mostly sky. Tuning a cloud bank from a street
shot means tuning it on the one strip a building has not already covered.

Three silhouettes, one instanced mesh each, so the sky is three draw calls;
still eleven fewer than the sprite field it replaced.

Gates: boot 4/4, test-carriageway green, test-buildings green, road census over
73/74/77/78 at baseline.

## r252 — EVERY TOWN, NOT JUST THE RIVIERA
"Fix all cities and places that have buildings, apply the same attention to
detail." Most of r244-r251 was already global — the pavement, kerbs, bollards,
ridge caps, chimney pots, the shopfront, the balcony and awning anchoring, the
townsfolk and the cornice all key off `T.frontage` and reach every town on the
roster. What was riviera-only was the JOINERY, the roofline and the squares.

Ten worlds gained them. The regional split is the point: painted surrounds,
quoins and downpipes are ARCHITECTURE, not a region, and go nearly everywhere;
the louvre, the ironwork and the roof orientation are regional and do not.

  - MONACO STREETS was the last town still built out of grey boxes, which is
    absurd — both renders this whole design came from are of THAT place. It
    gets the full coast treatment plus the faceted sky, with GREY-BLUE
    shutters rather than the coast's green, which is what the hairpin render
    draws and the one thing keeping it from reading as another Ligurian
    village.
  - HARBOR QUAY and its five regional variants: surrounds, louvres, quoins,
    downpipes and a square each.
      AEGEAN gets NO QUOINS — a Cycladic house is one limewashed mass and
      drawing stone blocks on it is the one detail that says "not Greece" —
      but half its roofs go FLAT.
      BRAVA gets the ironwork, because Andalusia is ironwork.
      DALMATIA and AZUR run their terraces eaves-on to the street like the
      Ligurian ones; LIGURIA and the rest keep the gable end, which is what a
      house standing in a stack up a cliff presents.
  - CITADEL BAY is quarried, not rendered: paler stone for the joinery, real
    quoins, and no ironwork on a fortified town.
  - LANTERN QUARTER gets the same care and not the same kit: surrounds, quoins
    and pipes, but the older BOARDED shutter folded onto the pier rather than
    the Mediterranean louvre, and its gable stays end-on to the street.

### A SMALL SQUARE BEATS NO SQUARE
LANTERN QUARTER built NOTHING and said nothing about it. The flatness gate
refuses more than 1.7 u of fall across the paving, and that town drops 26 u
beside its own street — `tools-scratch/pzwhy.mjs` (written for this: it re-runs
every gate in the site search and counts which one refuses) put 350 of 481
stations on FALL and zero anywhere on the lap. Every site is tried at full
size, then three quarters, then three fifths, and the fall tolerance grows as
the footprint shrinks, because a smaller square on a thicker plate is a
RETAINING TERRACE, which is exactly what a hill town builds. Past a kerb's
height that plate stops being something you bump over and becomes masonry, so
it registers solids.

### AND A CLEARANCE TEST THAT ASKS THE RIGHT QUESTION
The census found three people standing in MONACO's racing line. r249's
townsfolk compared `_distToTrack` against the width at the station they were
SAMPLED from; the census compares it against the width at the NEAREST station,
and on a lap that folds back the two differ by more than a pavement. It uses
`_clearsRoad` now, which asks the nearest-station question — and whose piazza
clause is welcome here, since people in squares are placed separately, on the
paving. Monaco's townsfolk bodies: 4 -> 0.

### A COMMENT THAT HAD BEEN LOSING AN ARGUMENT WITH ITS OWN OBJECT
`harbor` and `citadel` each carried a paragraph titled "WARM RENDER, NOT GREY"
arguing for a limewash palette — and eight lines below it, a SECOND `tints`
key with the grey palette the paragraph argues against. Last key wins, so both
quays have been building grey ever since with the reasoning sitting right
above. One key now, and it is the warm one.

Gates: boot 4/4, test-carriageway green, test-buildings green. Road census run
over 30/34/49/51/58 before and after: every floater and the one remaining body
is pre-existing and unchanged, and Monaco's four townsfolk-in-the-road are
gone.

## r253 — THINGS STANDING IN THE ROAD
An iteration spent on the road census's own backlog rather than on new
geometry. Three defects it had been reporting all session, and two it reports
that are older than this work.

### THE START GANTRY'S LEGS
`_buildStartGate` sites its scaffold towers by walking outward and scoring
each offset, and where nothing clears — a lap that comes back past its own
start line has no clear offset, which is TOUR DE CORSE and SANREMO STAGE — it
takes the least-bad spot and drops the COLLIDER, per the r167 rule. That was
right as far as it went, and it left an 11 u steel mast standing 4.2 u inside
the racing line at the start of two worlds, which the census scored as a body
on every run of this session.

A leg that cannot stand clear of the road no longer comes down to the ground:
it stops above the cars, the beam is carried by the side that DID clear, and
what was a body in a carriageway becomes overhead — which is what a gantry
over a road looks like anyway.

AND THE HEADROOM IS MEASURED OVER THE ROAD UNDER THE LEG, not over the start
line. RALLYCROSS ARENA's stray leg stands where the lap returns two metres
higher than sample 0, and a cut referenced to `y0` left it grazing that
carriageway at 1.01 u — a body again, in a different class.

    TOUR DE CORSE   4 bodies, worst bite 4.19 u  ->  clean
    SANREMO STAGE   4 bodies, worst bite 4.19 u  ->  clean
    RALLYCROSS      2 bodies, worst bite 1.01 u  ->  clean

### THE CONTACT SHADOWS
GOTTHARD CLIMB had two shadow decals scoring as bodies at a 4 u bite. A
contact shadow is fake occlusion for something standing on the GROUND; over a
road it is a dark patch floating across the tarmac.

THE ROAD IT IS OVER NEED NOT BE THE NEAREST ONE. Two cuts of this asked
`nearestIndex`, which on Gotthard answers with the hairpin the decal is ON,
while the one it hangs over is the shelf BELOW — same x and z, eight metres
down. A probe built on the same question duly reported zero while the census
reported 4 u: the two were not asking the same thing. It walks the stations
that could reach the decal at all and tests each on its own height; where the
road is at the decal's own level the RADIUS IS TRIMMED to the kerb instead of
the decal dropped, so a roadside prop keeps the shadow that glues it down.

A tilt cap was tried on the way — a decal following a 45-degree slope is a
sheet standing out of the hillside — and it made the census WORSE, so it is
not in the tree. A change that cannot be shown to be an improvement does not
ship.

    GOTTHARD CLIMB  2 bodies, worst bite 4.03 u  ->  clean

### TWO HARDENINGS, BOTH MEASURED HARMLESS
  - `_buildObstacles` compared `_distToTrack` — a lap-wide answer — against
    the half-width at the sample the offset was measured FROM. Same defect as
    the townsfolk in r252 and the gantry before them; it asks `_clearsRoad`
    now. No world changed, which is the point of a hardening.
  - r252's piazza terrace registered three colliders of radius D/2 down the
    middle of the plate. A collider describes the FACE a car can hit, not the
    area the thing covers, and D/2 is the square's own size — it reaches back
    across the road. Now a row of small ones along the road-facing edge, each
    only registered if it clears the carriageway.

### AND TWO THAT ARE OLDER THAN ANY OF THIS
Reported rather than fixed, with the evidence, because both need work in
systems this session has not touched:
  - CINQUE TERRE stands three element-kit boulders up to 6.28 u into a 9 u
    half-width, plus two blockers. Confirmed pre-existing by building the
    commit before r252 and running the same census: identical.
  - MOUNTAIN TO SEA reports a 45 u HALF-WIDTH at sample 456. That is a 90 u
    road, and everything within it — 72 blockers, 37 bodies — is scored
    against it. The width profile is what wants looking at there, not the
    scenery.
  - COTE D AZUR's fourteen stone blockers at a 9.27 u bite are likewise
    pre-existing: the same fourteen at the same bite on the pre-r252 build.

Gates: boot 4/4, test-carriageway green, test-buildings green.

## r254 — AND THE ONE THAT BROKE A WORLD
r253 hardened the piazza terrace's colliders and read `outward` — which way is
away from the road — a hundred lines above where that `const` is declared. A
`const` read before its declaration is a ReferenceError, it fired inside
`_buildPiazzas`, and it took the whole world build down with it: SANREMO STAGE
stopped producing a track at all.

IT WAS SHIPPED, AND BOTH GATES LET IT THROUGH.
  - `boot.mjs` builds levels 1, 6 and 1-roam. None of them has a piazza, so
    all four checks passed on a build that could no longer make a town.
  - The road census reports a world that fails to build as `SKIP  SANREMO
    STAGE` — one line, no marker, in the middle of a list of results. I read
    past it twice and took it for machine load, because the census had been
    slow all session.

A world that does not build is the worst defect there is and it had the
quietest possible signature. `tools-scratch/buildtime.mjs` is the answer:
a list of levels, a short cap, and a line per world saying built or FAIL with
the page error that caused it. It found this in one run, and it names the
exception rather than reporting a timeout.

    LV=30,34,49,50,51,52,53,54,58,73,74,75,76,77,78 node tools-scratch/buildtime.mjs

All fifteen town worlds build clean with no page errors.

RUN IT AFTER ANY CHANGE TO A SHARED BUILDER. `boot.mjs` covers the engine
coming up; this covers the worlds actually coming out.

## r255 — FIX ALL: THE ROAD CENSUS BACKLOG
Four defects, one of them mine from two rounds ago, and the tool that found
each of them.

### THE LIGHTHOUSE WAS CHECKING THE WRONG POINT
`_buildLighthouse` tested the MOLE'S WATERLINE ANCHOR against a coarse
distance and then put the tower 30 u further along the normal, unchecked. On
CINQUE TERRE that landed the tower 4.18 u inside the carriageway with a 2.7 u
collider biting 1.95 — and the skerries poured around it went in with it. The
anchor walks ALONG the coast until the TOWER itself clears, and the mole is not
built until it does. The headland fallback asks `_clearsRoad` too, not just the
coarse field.

### A PREDICATE THAT WROTE THE CALLER'S SCRATCH — mine, r253
HARBOR QUAY grew four invisible colliders on its racing line, biting up to
10.1 u, with no mesh anywhere near them. The guard that was supposed to stop
that ran and PASSED, and the same test on the same coordinates said "in the
road" afterwards. Both were true:

`_inPiazza` used `_pzV`, the module scratch, and it is reached through
`_clearsRoad`, which every builder calls — usually while holding a point in
`_pzV` that it is about to use. So the terrace's collider loop set `_pzV`,
called the gate, and the gate quietly rewrote `_pzV` into a square's LOCAL
frame; the solid was then registered at that local coordinate treated as
world. The gate tested the right spot and the collider went in at the wrong
one.

`_inPiazza` has its own vector now, and the two call sites read their point
out into locals before calling anything. A PREDICATE MUST NOT WRITE THE
CALLER'S SCRATCH — it is called from inside expressions, by code that cannot
see it.

### THE TUNNEL WALLS WERE NEVER ASKED
`_buildTunnel` puts a collider every 2 samples at 11.6 u either side of ITS
centreline, unguarded. Where a bore passes near a different leg of the lap —
COTE D AZUR does, fourteen times — that lands in the OTHER carriageway as an
invisible wall. And MOUNTAIN TO SEA is the same defect from the other
direction: its road is five times normal width, so a fixed 11.6 u bore is
inside its own carriageway for the tunnel's whole length. The wall MESH stays
either way; only the collider is dropped, which is the rule the grandstand and
the start gantry both settled on.

    COTE D AZUR      14 blockers, worst bite 9.27 u  ->  0
    MOUNTAIN TO SEA  72 blockers                     ->  2

### AND THE SEA ROCKS
Two of CINQUE TERRE's skerries stood 6.28 u inside its shore road. A sea rock
is in the sea, and on a coast road the sea comes close; the scatter asks
`_clearsRoad` for the rock AND the shoulder lump beside it.

### WHERE THE ROSTER STANDS
    GOTTHARD CLIMB   clean        TOUR DE CORSE   clean
    HARBOR QUAY      clean        CINQUE TERRE    clean
    COTE D AZUR      clean        RALLYCROSS      clean
(each still reports FLOATERS, and every one of those measured is a solid over
water — a lighthouse on a mole, a massif's own 198 u collider — which is what
that test is for and not a defect.)

STILL OPEN, reported not fixed:
  - MOUNTAIN TO SEA: 2 colliders and 37 meshes inside a carriageway that is
    90 u wide BY REQUEST (`roadWidth: 5`). `_stoneFit` and `_trackSidePos`
    were both already taught to scale with `widthAt` in earlier sessions; what
    is left comes from builders that were not, and finding them is a pass on
    that one world rather than a general fix.
  - TREMOLA DESCENT: one contact-shadow decal at road level, 0.79 u. A flat
    decal on the tarmac is not an obstruction.

### THE TOOLS
`tools-scratch/whosolid.mjs` is the one that broke this open: colliders carry
no provenance, so it pairs each offending solid with the nearest MESH and
prints that mesh's parent chain. Its own lesson is in its header — it first
asked `_clearsRoad`, which since r246 also refuses anything inside a SQUARE,
so it reported every piazza lamp as "in the road" and buried the four real
ones. `offenders.mjs` does the same job from the mesh side.

Gates: boot 4/4, test-carriageway green, test-buildings green, and
`buildtime.mjs` over twenty worlds — all built, no page errors.

## r256 — THE BAY, AND HEADLIGHTS THAT ARE ACTUALLY LIGHTS
Two screenshots, two asks: "make the car stand out, make lighter background"
on the build bay, and "make the light like real car light, other cars should
have light too" on a night race.

### THE BAY WAS A DARK ROOM WITH A DARK CAR IN IT
The garage stage lit a near-black car against a near-black floor and a wall
too small to be one. The floor is light concrete (0x8b8073) at 90x90, the
wall pale (0xb2a695) at 160x70 with a dado band under it, the bay lines
brighter, and a rim light added behind the car so its shoulder line separates
from the wall.

The wedge of black down one side was NOT the shadow frustum. Widening the
shadow camera changed nothing; hiding the wall found it in one shot — the
floor and the wall both ENDED inside frame and the camera was looking at
empty scene past their edges. Both were enlarged. Measure by bisection, not
by fixing the thing that sounds most likely.

### EVERY CAR NOW HAS LAMPS, AND THEY ARE ONE DRAW CALL
`buildVoxelRacer` welds a lamp rig into every car it builds: two headlamps
(a wide soft halo plus a small hot core), two tail clusters the same way, and
two beams on the tarmac. It is ONE additive mesh with per-vertex colour, so
the whole rig costs one draw call per car — six separate meshes would have
been 48 on an eight-car grid, most of a world's budget for something nobody
would have called scenery. NO POINT LIGHTS: this game bans per-car lights,
and what sells a headlight from a chase camera is the lamp burning and the
pool it lays on the road. Both are painted.

`glowTexture` is opaque white at its centre, so a quad whose four UVs all sit
at (0.5, 0.5) takes a FLAT alpha and lets vertex colour do all the shaping.
That is the trick that lets a soft round lamp and a hard-edged beam wedge
share one material.

### WHAT THE FIRST CUT GOT WRONG, AND HOW EACH WAS CAUGHT
**The lamps were never switched on.** `worldIsDark` and the per-frame
`Car._syncLights` were both right, and `carLights: OFF x8` on a `#16162a`
sky anyway. Two reasons: `_syncCarLights` read `this.rivals` and `this.traffic`,
neither of which exists (the field is `this.enemies`), and the one
`_applyTheme` that runs on a fresh load happens BEFORE the player and the
enemies are constructed. The sync is now called once more right after the
grid is built, and again on `swapPlayerCar`, which hands the player a new mesh
with dark lamps.

**The beam was a puddle parked under the nose.** One big quad with the radial
glow stretched over it. It is a GRID now — the falloff lives in the vertex
colours, which is the only way to get a wedge that leaves the lamp narrow,
opens out down the road and fades at its far edge and both sides.

**And the probe was lying about it.** `nightshot.mjs` invented a camera at
6.5 up and 13 back. The game's CHASE is 11.5 up and 17 back looking 19 ahead;
at the flatter angle the beam compressed into the car's own silhouette and
read as a halo. The probe also floated the car 0.4 above the road — a car's
mesh origin IS the tarmac (`pos.y = groundHeightAt`), so the beam was
measured from the wrong height too. JUDGE A LIGHT FROM THE CAMERA THE PLAYER
HAS.

**A false read corrected.** The red bars at the tail in the first isolation
shot were the car's OWN modelled lenses (`tailMat`, always there), not the
new rig, because the shot kept the player's bodywork. With every other mesh
hidden the rig turned out to be two blobs and two dots. The tail glow was
then sized to bloom over the whole modelled cluster (x 0.66 to 1.35) instead
of sitting beside it.

`lightdiff.mjs` is the gate that settles all of this: render the frame twice,
rig hidden then shown, and report the pixel delta and the box it falls in.
The first cut changed 0.39% of the frame, all of it inside the car's own
footprint. `LIFT=0.6` separates "not drawn" from "buried in the road".

### A BEAM IS LIGHT, NOT BODYWORK — the bug the lights caused elsewhere
The beams reach 19 u down the road, and they went into the car's mesh as a
child. So `new THREE.Box3().setFromObject(car)` — which is how the garage bay
frames its camera and how the kit-fit test measures the nose — started
returning a box the length of a bus. The bay backed its camera off from 9.7 u
to 27.7 u: THE CAR GOT SMALLER THE ROUND THE LIGHTS WENT IN, in the same
screen whose report was "make the car stand out". `test-cars` caught the other
half as a 0.09 u nose spread across eight cars, seven of which agreed exactly
— which is the signature of one car's bodywork differing from a constant, not
of a kit that has moved.

Fixed at the source rather than at each caller: `Box3` uses a geometry's own
`boundingBox` when it has one, so the rig publishes the BODY's box as its own
and `frustumCulled` goes off to guarantee the shrunken box can never cull the
beam away. Every car's overall box now equals its bodywork box again, the nose
spread is 0, and `popCarPart` grew an explicit exclusion because the rig's
volume is no longer large enough to be filtered out by accident.

WHEN YOU ADD A CHILD THAT IS BIGGER THAN THE THING IT IS ON, GO AND LOOK AT
WHO ASKS THAT THING HOW BIG IT IS.

### AND THE BAY'S FRAMING WAS WRONG BEFORE THAT
With the box fixed the framing multiplier was still guesswork: the small-angle
fit in `_frameStage` is a long way out for a 6.4 m car seen from 10 m up a 3/4
angle, because its near end projects three times the size of its far end.
`bayfit.mjs` sweeps camera distance against the car's measured pixel box, and
1.62 is read off that sweep — ~95% of the panel height, ~67% of its width.

The bay also has no cast shadow to give, and that is geometry, not a bug: the
key sits at (5, 9, 6) and the camera looks in from (6.4, 3.4, 7.6), nearly the
same azimuth, so the shadow falls behind the car and the car hides all of it.
Moving the key to throw it into view takes the light off the face the camera is
looking at. A painted contact disc on the pivot grounds the machine without
touching the lighting, which is what a product shot does. The shadow camera
went back to a tight +-10 at 1024 (0.02 u/texel) now that the dark wedge it had
been widened to +-22 for is known to have been the floor's own edge.

## r257 — THE BEAM FROM EVERY CAMERA, NOT JUST THE ONE I TUNED IT ON
A phone shot of a night race: a pale wedge fanning up the carriageway from the
car's nose, washing the road out. The rig from r256, seen from a camera it was
never checked against.

### THE FADE
A headlight beam is a FLAT QUAD LYING ON THE ROAD, so how much of it the lens
sees is decided entirely by how steeply the lens looks down. CHASE, the one
view r256 was tuned from, sees it at a 13-degree grazing angle and gets a soft
pool. TOP-DOWN sees the same quad face-on from 46 u up, and an additive quad
over dark tarmac saturates.

`fadeCarLights(camera)` takes the downward component of the view direction —
0.03 in the seat, 0.22 on CHASE, 0.56 on TRAIL, 0.82 on TOP FAR — and smooth-
steps 72% of the rig's opacity away between 0.28 and 0.74. Measured by
`tools-scratch/beamlook.mjs`, which drives the GAME's own `_updateCamera` for
each mode and diffs the frame with the rig hidden against the frame with it
shown. What the rig ADDS, before → after:

    TOP-DOWN   mean +71 → +27   peak 395 → 111
    TOP FAR    mean +29 → +14   peak 209 →  59
    TRAIL      mean +77 → +45   peak 607 → 320
    CHASE / CHASE FAR / DRIVER   unchanged

The lamps and tail lenses fade with the beam, and that costs nothing: they are
vertical quads, edge-on from overhead, and each car's own modelled `tailMat`
bars are solid geometry the fade never touches.

### AND THE MATERIAL IS ONE OBJECT NOW
The fade has to be written every frame. Nothing about the lamp material varies
per car, so it is a module singleton (`carLightMaterial`) — one write for the
whole grid instead of eight, and one glow texture instead of eight. `visible`
stays per mesh, which is what the per-world switch needs. `_dropCarMesh` grew
an exclusion to go with it: it disposes the materials of everything outside the
upgrade kit, and disposing one bay car's copy would now blank the headlights on
every car in the game — the same trap the kit's shared materials carry.

### FOUR WRONG ANSWERS, AND WHAT KILLED EACH
Worth writing down, because each looked right:

1. **"It is the road's specular lobe."** A wet road is roughness 0.52, and the
   comment above it records this exact failure being fixed once already. Swept
   roughness 0.52 → 0.92 and envMapIntensity 0.75 → 0.35 at the worst point on
   the lap: bright pixels moved from 0.88% to 0.86%. Roughness only darkened
   the road (mean 31 → 17); it never touched the highlight. There is no env map
   bound at all, so that lever was doing nothing whatever.
2. **"It is the shadow frustum's edge."** The shadow camera follows the player,
   which fits an artefact anchored to the car. Turning `moon.castShadow` off,
   scaling the frustum 2.5x and re-biasing all left the wedge at 31528 pixels
   against a base of 31528.
3. **"The deployed build has it too, so it is not mine."** It does not. The
   probe was pointed at port 8902 with a gh-pages worktree as its CWD — and
   `srv.mjs` takes its root from `argv[3]`, defaulting to the working tree
   whatever the CWD. Port 8902 was serving MY branch. Served properly on 8903,
   r245 has no `carLights` and no wedge, mid-lap or on the grid.
4. **"Hide every additive object and see what goes."** The first hunt scored on
   frame-wide bright pixels, and on a neon world those are the road's emissive
   edge lines — so it named `road` and stopped. Scored on the wedge itself
   (road pixels above the road's OWN median in the band ahead of the nose) the
   same sweep names `carLights` at 46% on the first pass.

CHECK THE PROBE'S ROOT BEFORE BELIEVING A BASELINE. An A/B against a pristine
build is worth nothing if both ports serve the same tree, and it fails silently
— the page loads, the game runs, the numbers look plausible.

## r258 — THE BLOTCHES WERE THE WHOLE PROBLEM
The building round. Three changes, two of them small, and the small one that
turned out to be doing all the damage.

### 620 SPECKS INSTEAD OF 160 STAINS
`townhouseTexture`'s limewash erosion laid 160 discs of up to 22 px radius at
up to 10% alpha into a 192-px-wide authored wall. The biggest were a ninth of
the wall across, and at 1.7x total coverage they were not grain — they were
soft circular damp stains, visible on every town render, worst on the pale
renders. 620 discs at a quarter the radius and half the alpha.

That change alone moved the facades most of the way to the reference. Measured
through a flat-white mask of the frontage itself, at a pinned point on the lap
(reference: P50 124, P90 188, saturation 0.33):

    IL BUDELLO    sat 0.64 → 0.41   P50  78 → 124   P90 132 → 196
    COTE D AZUR   sat 0.29 → 0.24   P50  96 → 102   P10  12 →  37
    CINQUE TERRE  sat 0.69 → 0.66   P50  66 →  59   P90 103 → 122

IL BUDELLO now sits on the reference almost exactly. THE MOTTLE WAS NOT
COSMETIC: a wash of dark grey-brown at 1.7x coverage was dragging the whole
palette down and desaturating it, which is why the streets read heavy and why
the tints never looked like the tints.

### CINQUE TERRE'S PALETTE
Still the outlier after that — its lit walls half the reference's brightness
and twice its saturation. Three mid-saturated entries in `liguria`'s tint list
lifted toward the sheet's own pastels, two pale ones added, render nudged from
`#f2e8d4` to `#f6ecdc`: saturation 0.66 → 0.59 and P50 59 → 81. It stays warmer
than ALASSIO, which is the district's whole point; it stops being a different
exposure.

### A CARRUGIO IS A SLOT, NOT A MISSING HOUSE
The side alley between terrace runs skipped one or two whole bays, which at a
7 u unit is a hole up to twice a house wide. It is bracketed now — a narrow
block either side of a ~2 u slot — and capped at one bay. Modest: open pairs
27.2 → 27.2 / 17.4 → 18.9 / 38.2 → 33.2 percent, but every open gap narrower
(mean 12.2 → 10.4, 7.3 → 6.9, 10.3 → 9.2 u) and CINQUE TERRE's P75 gap 4.6 →
2.5. Shipped because it is an improvement on every gap measure, not because it
is a big one.

### TWO THINGS THAT LOOKED RIGHT AND WERE NOT
**"Lift the shade floor with the hemisphere fill."** The facades bottom out at
luminance 9-15 against the reference's 68, and hemisphere light is the obvious
lever. Swept 1x to 3x: P10 moved 10 → 17 while P50 went 71 → 108 and the frame
mean 96 → 126. It washes the world out and never touches the floor, because
LIGHT MULTIPLIES ALBEDO — you cannot brighten a near-black texel by pointing
more light at it. Paler hemisphere ground colours did the same. The floor moved
in the end from the mottle change (COTE D AZUR P10 12 → 37), which lifted the
albedo instead.

**"53-71% of the streetwall has an open gap."** That was `frontagegaps.mjs`
before it was right, twice over: it took `max(sx, sz)` of the instance matrix
as the along-street width, and column 2 is the 8.5 u DEPTH, so abutting houses
read as gaps; and it scored the whole `oldtown-frontage` mesh, which carries
the five deliberately-sparse ranks BEHIND the terrace as well as the street. On
the frontage rank alone, with column 0 as the width, the real figures are
17-38% and the terrace mostly abuts. MEASURE THE POPULATION YOU MEAN.

## r259 — A GARAGE THAT IS NOT BLACK, AND A ROOM THAT MOVES
Two reports, one screen. "Light up all background in the garage, so it is not
black" and then, on a navy car standing on grey concrete, "make it move
contrasting background".

### THE BAY WAS NOT THE PROBLEM
`bayblack.mjs` reads the stage's own canvas and grids the dark pixels. The bay
measures a mean luminance of 121 with 17% dark, and that 17% is the car's own
tyres, glass and bumper. The CARDS were black: `_studio` renders with
`alpha: true` and no backdrop at all, so every car and part picture was a
cut-out floating on a near-black panel — 20-31% of each shelf icon's opaque
pixels under luminance 34, mean 28.

A cyclorama fixes all of them at once: one unlit gradient plane squared up to
the studio's fixed three-quarter rig, 110 u across at 42 u back, which fills a
30-degree frame from every distance the studio shoots from. Untone-mapped, so
it is exactly the colour asked for whatever the exposure. Shelf icons go 28 →
107 mean with no transparency left. Car shots also get a painted contact disc,
because a car on a seamless sweep with nothing under it floats. The four
upgrade ladders that show a glyph rather than a rendered part got the same pale
plate in CSS — three photographs among four holes is a ragged column.

### THE ROOM TAKES ITS COLOUR FROM THE CAR
A fixed set cannot serve a navy car and a white one. `_bayPalette` reads the
hull colour, and goes the other way: lightness interpolated against the car's
own luminance, hue pushed a third of the wheel off the car's so a warm car
never stands on warm concrete, saturation kept near zero because this is
concrete and not a colour wash. The bay lines swap gold for a darker ochre when
the room goes pale, or they vanish into it.

Body-to-wall gap, per car, at the shipped setting: BASTION 71, PIT 67, CROWN
41, ALPINE 83, DUNE 90, SLEEK 75, FLATSIX 35, BRAWLER 13.

### AND THE WALL HAS LIGHT CROSSING IT
A `RepeatWrapping` band texture on the wall, white so the material's colour
carries the hue, with the offset walked in the turntable's own tick. Slow — a
feature crosses the visible slice in about eight seconds. A backdrop you look
AT is a worse failure than one you look past.

### THE METRIC SENT ME THE WRONG WAY FIRST
The dark end of the lightness ramp was tuned against the mean luminance of the
car's pixels, and a car's pixels are half tyre and half glass: that mean says
ALPINE, which is white, is a mid-grey at 96. Tuned on it, darkening the room
made the measured gap SMALLER and I read that as the change being wrong. On
body brightness (car P75) the sweep is unambiguous — 0.22 / 0.30 / 0.42 gives
SLEEK 67/51/33, DUNE 88/72/54, ALPINE 80/64/46, FLATSIX 35/18/0. 0.42 makes the
silver FLATSIX vanish into its own backdrop entirely. MEASURE THE SUBJECT, NOT
ITS SILHOUETTE.

BRAWLER's 13 is the one weak number and it is shipped as is: an orange body on
a grey-green wall, where the hue offset carries a contrast that a luminance gap
cannot see.

## r260 — A RED LIGHT IN THE BACK
"Make the background more eye pleasing. Like a red light or something in the
back." The repainted room from r259 solved the contrast and left a grey box.

Five painted lamps, no new light sources: a warm wash and a small additive
core on the back wall, a cool wash beside it, and both colours pooling on the
floor. A PointLight far enough back to wash a 160 u wall would light the car
too and undo r259's contrast work; these paint the wall and the floor and
nothing else, and they share `glowTexture` with the headlamps.

The wall is only about a sixth of this frame — the floor is the picture — so
the lamps that matter most are the two lying on the tarmac.

### THREE THINGS MEASUREMENT CAUGHT
**A wash paints; additive only adds.** The first cut was additive throughout,
which fails exactly where the room is palest: adding red to a near-white wall
makes it whiter, not redder, and a dark car's bright room came out milky pink.
The wash is NORMAL blending now — it tints whatever the wall is — with a small
additive core inside it as the source itself.

**Both cool lamps were outside the picture.** `baylamps.mjs` projects each lamp
into the bay camera: they sat at screen x 244% and 184%. The visible slice of
that 160 u wall is about FOURTEEN world units, x -17.5 to -3, because the
camera is off to +x and looks back across the origin. Their measured positions
are in the source now, with the mapping that produced them.

**And the lamps ate the contrast they were added to.** Painting a saturated red
over a pale wall darkens it, and the pale rooms are precisely the ones a dark
car needs: BASTION's body-to-wall gap went 71 → 39, PIT 67 → 41, CROWN 41 → 15.
So the lamps are tuned to the room — a pale room gets a pale tint at a lighter
touch, colouring it without spending its brightness — and a warm hull gets a
CRIMSON warm lamp rather than an orange-red one, because a red light behind a
red car is no light at all. Restored: BASTION 65, PIT 66, CROWN 39, and every
light car up (SLEEK 78, DUNE 92, ALPINE 86, FLATSIX 43).

BRAWLER measures 2, against 13 before the lamps. Its rendered body sits at 127
and its background at 124, and the metric cannot see that one is orange and the
other is grey-green under a crimson wash. The shot reads clearly; the number
does not. Recorded rather than tuned away, because tuning the whole bay to one
car on one blind metric is how the last three rounds went wrong.

### AND THE ONE THAT COST AN HOUR
`node --check src/main.js` PASSED on a file with two `const lamp` declarations
in one scope, because it parses as a SCRIPT and the duplicate is a module-
instantiation error. The page never booted, and every probe after it timed out
waiting for `window.__game` with no error anywhere in its output. `pageerr.mjs`
answers "did it boot, and what stopped it" in ten seconds. RUN IT AFTER EVERY
EDIT TO main.js — `node --check` IS NOT A GATE FOR THIS FILE.

## r261 — THE GARAGE IS A PLACE IN THE GAME NOW
A screenshot and four words: "use this example 1:1". The cars stand on a rally
trail in the pines, in the shelf cards and in the build bay both.

`_diorama()` builds it: painted sky with three bands of drawn treeline, a grass
plane, a dirt trail with two ruts, fifty-two pines, sixteen rocks and fourteen
bushes. It replaces the painted room of r259-r260 ENTIRELY — the
repaint-for-contrast ramp, `BAY_DARK_END`, the moving wall band and the five
coloured back lamps are all deleted, along with the two probes that measured
them. A photograph taken on a trail has no wall to light.

BUILT FROM THE GAME'S OWN NUMBERS, which is the whole of "1:1". The silhouettes
are `_buildTrees`'s two-tier pine — trunk cylinder 0.3/0.52, cones 2.6x4.2 and
1.8x3.4 — and every colour is lifted out of `THEMES.forest`: trunk 0x6b4423,
foliage 0x2c6e2a under 0x3c8a34, ground 0x4f8a35, dirt 0x9c7a48, rock 0x8d8578.
A backdrop invented alongside the world it is meant to belong to is the one way
this could have looked wrong.

Three things it is careful about:

- **Deterministic.** One fixed LCG, not `Math.random`. The shelf icons are
  rendered once and cached while the bay is live, so a forest that reseeded per
  load would put a different wood behind the same car twice on one screen.
- **Merged per material.** Fifty-two trees as separate meshes is 156 draw calls
  behind a menu; welded by part it is three, plus one each for rocks and scrub.
  The far treeline is PAINTED into the sky plane rather than built, because at
  150 u back it is a silhouette and nothing else.
- **Only the car casts.** The trail runs 300 u and the wood 160; a shadow
  camera that covered them would have no resolution left for the one thing this
  screen is about.

The bay's framing multiplier went 1.62 to 2.0 with it. At 1.62 — tuned to fill
a painted room — the car sat on bare dirt with the wood cropped away above it.
A photograph on a trail wants the trail in it.

Part icons keep the plain sweep. A gearbox held up to the light does not stand
on a rally trail, and a wood behind a 40 px chip is noise.

## r262 — THE FAR PLANE, AND TWO BACKDROPS REDESIGNED FOR NOTHING
Iterating on r261's forest. The trail got a painted texture — two wheel ruts,
gravel speckle, damp patches — and a broken edge, because a razor-straight line
between dirt and grass is a line no trail has. The scene got FOG: every world
in this game is fogged (`THEMES.forest` runs 320 to 1500) and without it a
160 u wood is a flat wall of identical cones. Scaled to 46-185, starting well
beyond the car at 10 u.

### THE GRASS TUFTS, MEASURED
`dioparts.mjs` hides each welded piece and counts the pixels that change, with
its triangle count beside it. The first cut sprinkled 150 tufts across nine
metres of verge: 1800 triangles — 22% of the whole diorama's geometry — for
1.4% of the frame, because at this camera distance a 0.75 u blade is two
pixels. Ninety, half again as tall, held within four metres of the trail edge:
1080 triangles for 3.6%. Forty percent less geometry, two and a half times the
effect.

### AND THE ONE THAT WASTED THE ROUND
A white wedge sat in the top corner of the bay. `bayblack.mjs` named it: 7.4%
of the bay rendering TRANSPARENT — a hole with the dark panel showing through.
The obvious reading is that the backdrop is too small, so:

  1. the flat plane became a wrap-around CYLINDER, since the camera looks in
     from +x +z and at 150 u back its view axis is a hundred metres off to one
     side, so a plane centred on the origin wastes half its width. Measured
     after: **9.6%. Worse.**
  2. the cylinder became a sky DOME plus a separate treeline ring, because an
     open-topped band still lets the frame reach over its rim. Measured after:
     **9.6%. Identical, to the tenth.**

A number that does not move AT ALL under two different fixes is not a tuning
problem. The stage camera is `PerspectiveCamera(32, 1.6, 0.1, 120)` — FAR 120 —
and the dome is at 210 with the treeline at 150. Both were clipped away
entirely; the "far trees" visible all along were the built mask row at z -78.
Far 600 on both stage and studio cameras: transparent 9.6% → **0**.

ASK WHETHER THE CAMERA CAN SEE A THING BEFORE REDESIGNING IT. Two backdrops
were rebuilt to fix a hole that neither of them was ever being drawn into.

## r263 — AUDIT EVERY CAMERA, THEN BUILD THE FOREST ONCE
r262 ended on a rule: ask whether the camera can see a thing before redesigning
it. `farplane.mjs` turns that rule into a probe. It walks every camera in the
running game — race, stage, studio — and measures each one's near/far against
the bounding sphere of everything its scene actually draws, so a clipped
backdrop is a line of output instead of a round of guesswork.

The first run flagged the race camera: near 0.5, far 3200, against something at
**10 034**. It is not a bug. `src/particles.js:147` parks dead particles at
`y = -9999` and sets `frustumCulled = false`, so the pool draws unconditionally
and its bounding sphere sits ten thousand units out and means nothing. That
flag is now the probe's exemption: an object that opts out of culling has opted
out of this audit too. Stars checked by hand at r 2850 (`src/track.js:18837`),
inside far 3200. With the exemption in, every camera comes back clean.

### BUILT ONCE, MOUNTED TWICE
The bay and the shelf-card studio are separate scenes, and a `Mesh` belongs to
one parent, so each needed its own forest — and was building one. But the mesh
is the cheap half. The GEOMETRY and the MATERIALS behind it are four canvas
textures and about seven thousand welded triangles, and those are shareable.
`_diorama()` now caches `[geometry, material]` pairs on first build and mounts
fresh `Mesh` wrappers over them the second time; `_studio()` was given the bay's
fog, because a material compiles a second shader program when the scene fog
under it differs.

`diocost.mjs`, before/after by `git stash`:

```
BEFORE  geometries 96  materials 45  textures 12  triangles 13113  2nd diorama 64.5 ms  mem 56.7 MB
AFTER   geometries 85  materials 34  textures  9  triangles  7196  2nd diorama  0.1 ms  mem 54.4 MB
```

The second forest costs nothing now. Gates held: `pageerr.mjs` `game? true`,
`bayblack.mjs` transparent 0% / mean luma 122, `boot.mjs` PASS 4/4, and the
garage screenshots are pixel-identical — cars on the trail in the shelf cards
and in the build bay, same as before.

## r264 — THE TRAIL, ITEM BY ITEM OFF THE REFERENCE
A design breakdown of the Art of Rally trail arrived as a table — gravel
surface, loose stones, motion dust, soft shadow, stacked pines, mossy roadside
rock, dappled light — with "apply all above". Four of those the diorama already
had (r261-263 built the painted gravel trail with its broken edge, the pines,
the rocks, and the contact shadow under the car). This round is the other four.

### LOOSE STONES: PAINTED GRAVEL IS FLAT
The trail texture already had gravel speckled into it, and painted gravel has
no lit edge, no shadow side, and turns with the surface instead of sitting on
it. What makes a surface read as LOOSE is stone the key light can catch, so it
gets geometry — squashed TETRAHEDRA and OCTAHEDRA, 4 and 8 triangles, because
an icosahedron is 20 for a thing four pixels across.

The first cut was one pale grey at 0.3 u and it read as **torn paper** scattered
over the dirt. Two faults: gravel is not one colour, and a stone that never
goes darker than its ground has no weight. Two tones, half the size (biggest is
now 0.2 u — a fist beside a 4.4 u car), 150 of them held to the length of trail
the bay camera actually frames. 752 triangles.

### DAPPLED LIGHT: A GOBO, NOT A SHADOW
Real dapple means the wood casting, and the key's shadow camera is a tight ±10
box round the car precisely so the one thing this screen is about keeps its
1024 px — widening it to cover a 160 u wood spends that resolution on trees.
So the canopy is PAINTED and MULTIPLIED over the ground: white where the sun
lands, cool grey where a branch is in the way, plus seven long soft bars for
the trunks, which are what say the sun is low and off to one side. Multiply can
only darken, so it can never blow out the trail.

Two things it must have. `toneMapped: false`, or white stops being white and
the whole plane reads as haze. And `fog: false` — the fog colour is 0xd2e2cc,
which multiplies to a green-grey, so a fogged gobo TINTS the far ground
instead of releasing it.

**Two triangles, and hiding it changes 45.5% of the bay.** Best rate in the
diorama by three orders of magnitude.

It also costs a stop, which is what putting a scrim over a set does:
`bayblack.mjs` mean luminance 122 → 106. So open up — stage exposure 1.28 →
1.34, and 113 with the dapple in. The sky dome is `toneMapped: false` and does
not move with the exposure; only the lit world comes back up.

The shelf CARDS needed the same and are a different renderer: they came back at
73-92 against part cards at 131-168. The compensation rides with the forest
rather than with the renderer — `_shoot` lifts the studio to 1.42 only for
`ground: true` and puts it back — because the part shots do not show the forest
and must not move. Car icons 72-92 before this round → **79-100 after**, with a
canopy shadow added.

### DUST OFF THE TYRES, AND IT IS NOT A CHEAT
The pivot turns the car at 0.42 rad/s with all four tyres planted, so they are
scrubbing SIDEWAYS across loose gravel the whole time the screen is open. That
throws dust. It is also the only moving thing in the picture that reports on
the SURFACE rather than on the car, which is what dust behind a rally car is
for. Flat-shaded icosahedra lit by the same key as everything else, so a puff
has a bright face and a dark one and belongs to the scene.

The first cut — ten puffs, 0.9 u, peak opacity 0.32 — parked what looked like a
**boulder** against the rear tyre. One solid lump with a lit face and a dark
one is a rock, whatever colour it is. Dust is a cluster, it is paler than the
stone around it, and you can see through it: sixteen puffs at half the size,
two-thirds the opacity, flattened to 0.55 in y so they hug the ground, and half
a metre further back so they trail the wheel instead of touching it.

`bayshot2.mjs`'s SPIN is useless here — the next frame of the stage loop
overwrites `pivot.rotation.y` before the screenshot lands, so a puff behind the
rear wheels is never in shot. `dustlook.mjs` stops the loop first.

### MOSS, AND ROCKS THAT ARE ACTUALLY AT THE ROADSIDE
The boulders sat 1.4 to 6 u off the dirt, out in the field, where a boulder is
scenery. Brought in to straddle the 5.25 u trail edge they are what the outside
of the corner is made of, which is the only reason a rock is interesting. The
big ones wear moss on top — the one detail that says the rock has been there
longer than the trail has. 240 triangles, and the weakest thing in the picture
at 0.3% of the bay; kept because the reference names it and it is 2% of the
geometry.

### THE THIRD TIER, AND WHAT IT EXPOSED
Two cones make a fir-shaped blob; the reference's pines are stacked skirts. A
mid tier at 16 triangles a tree came in at **4.1% of the bay, 8.0 px/triangle**
— five times the rate of the TOP tier it sits under, which `dioparts.mjs` then
showed to be the worst thing in the diorama at **1.5 px/triangle**.

Most of that waste was the mask row: 22 trees at z -78, behind fog, doing one
job — stopping the ground from meeting the painted sky. The low and mid tiers
make that silhouette; the crowns were triangles spent on nothing. Cut, 528
triangles back, and the top tier's contribution fell 0.8% → 0.2%, which is the
proof that the crowns nobody could see were most of what it was drawing.

Net: 7196 → 8829 triangles, second diorama still 0.2 ms (the r263 sharing is
intact), `bayblack.mjs` transparent 0%, `boot.mjs` 4/4, `farplane.mjs` clean.

### A NOTE ON THE BEFORE/AFTER
The canopy painter draws from the diorama's own seeded `rnd()`, so adding it
shifted every placement downstream — trees, rocks, bushes and tufts all
re-rolled. Nothing wrong with the new layout, but it dropped a 2.5 u scrub bush
and a boulder into the foreground, nearer the camera than the car. Bushes are
now held to z -46..-2 and rocks to -38..+2, both behind the subject, because
the whole job of this screen is to show you a car.

`baypair.mjs` shoots the bay at a PARKED angle from a port you name, so the two
halves of an A/B are the same picture of the same car — and prints the build
tag it actually loaded, since srv.mjs has served one branch on both ports.

## r265 — THE FLATTEST THING IN THE PICTURE, AND A TINT THAT WAS NOT THERE
"It looks a bit plain" is not a finding, so `flatsurf.mjs` makes it one: take
each welded piece of the diorama, work out which pixels it owns (hide it, diff,
mask), then report the SPREAD of luminance over those pixels in the real frame.
A big surface with a tiny spread is a flat fill pretending to be a material.

The answer was not the grass — the canopy gobo is painting variation onto that
already (sd 23.3). It was the PINE SKIRTS: 9.9% of the bay at **sd 14.0**, the
lowest spread of anything large in the frame. Fifty trees, one green.

### VERTEX COLOURS, BECAUSE WELDING IS WHY THEY MATCH
Welding by material is what keeps this menu at three draw calls for fifty
trees, and the price has always been that every tree is the same colour. A
colour attribute costs one buffer and no draw calls at all, so `weld()` now
carries a per-piece tint through, and each tree gets ONE — trunk, skirt and
crown together, because three tiers that each rolled their own are three plants
stacked up.

### AND IT DID NOTHING, TWICE
First measurement: pine skirt sd 14 → 11.9. *Flatter.* But the tint call draws
from the diorama's `rnd()`, so it had re-rolled every placement after it and
the two forests were different — the same confound that had already invalidated
the r264 before/after. So `tintab.mjs` flips `material.vertexColors` on the
already-built geometry instead: same trees, same camera, one flag.

Second measurement: **every number identical to the tenth, on all four
meshes.** A change that measures as exactly nothing is usually not a weak
change; it is an input that never arrived. It hadn't:

> `BufferGeometry.clone()` copies `userData` BY REFERENCE. Every clone of
> `lowGeo` shared one object with `lowGeo` itself, so `q.userData.tint = t`
> wrote into that one object and all fifty trees read the last write.

The welded buffer held **one distinct tint**. The screenshot had looked more
varied to me and it was not; what I was reading as fifty greens was facet
shading and fog. `q.userData = { tint }` — assign a fresh object, never write
into the one that is there. `tintab.mjs` now reports `distinctTints` FIRST,
because that is the check that catches this in one line.

With real tints: skirts **sd 14.5 → 16.5**. Still narrow, so the range went to
±28% value and ±17% warmth, measured again: **18.0**, and the warm spread on
the crowns 6.5 → 8.2. A wood varies in hue more than in brightness, and the
first range was too tight on exactly that axis.

### ONE RNG STREAM PER SUBSYSTEM
Three rounds running, an insertion re-rolled the whole forest: the gobo moved
every tree, the tint moved them all again, and twice that turned a before/after
into two different pictures. It also dropped a bush into the camera's lap in
r264 and a whole pine into it here. So the single `rnd()` is now six streams —
`rSky`, `rTrail`, `rDap`, `rTree`, `rRock`, `rScrub`. A change to the pines
cannot move a rock, and an A/B is an A/B.

With that stable, three framing fixes that were being masked by the churn: near
pines held to z -58..-2 (they ran to +16, and a 10 u tree that close is a green
wedge across the corner), their lane in from 11.5 to 9.6 so the wood crowds the
trail instead of standing back from it — 8.2 was closer still and cropped every
near crown off the top, which throws away the silhouette the third tier exists
for — and the canopy plane out from 46 to 62, because the camera sees well past
the verge and grass outside the gobo is a pale flat band down one edge.

Gates: bay mean luminance 115, transparent 0%; car icons unchanged at 79-100;
`boot.mjs` 4/4; `farplane.mjs` clean; second diorama still free; 8829 → 8909
triangles (the colour buffer, not geometry).

## r266 — A GREEN SCREENSHOT, AND THE BUG UNDER IT
Reported off a phone with one line: "Fix needed." NEO-KYOTO, the whole frame
one radioactive olive.

### FIRST, MEASURE THE PICTURE
`shotcast.mjs` reads a screenshot's mean RGB. The phone frame came back at
**(65.5, 82.5, 16.0)** — the BLUE CHANNEL ALL BUT DEAD — with green 41.7 points
over the red/blue average. That is not a haze, it is a gamut collapse, and it
named the world in one search: `undercity` is the only theme whose lights are
that saturated.

### AND THEN THE THING THAT WAS NOT THE COMPLAINT
`worldcast.mjs` reproduces a world's cast from the camera it is played from.
NEO-KYOTO measured luminance 9 with 77% of the frame black — nothing like the
phone. Two runs with different physics returned **identical numbers to the
decimal**, which no two runs of a moving car can. The scene graph said why:
`camPos [0, 0, 0]`, and in the console, once a frame, swallowed —

> `[frame] recovered from TypeError: this._syncLights is not a function at
> PlayerCar.update (vehicles.js:4779)`

`_syncLights` was written on `EnemyCar` while its own comment already said
"both the player and the rivals come through this class", and `PlayerCar.update`
calls it on its FIRST line. So on EVERY LEVEL the player's entire update threw
and was skipped. The frame loop catches and recovers, so there was no crash, no
stack in `pageerr.mjs`, and `boot.mjs` sat at 4/4 the whole time: no player
physics, no player headlights, and a chase camera parked at the world origin.
Moved to the base `Car`. Anything both subclasses call belongs there.

`playermoves.mjs` is the gate that would have caught it — held throttle, then
assert the car moves, the camera is not at the origin, and nothing was
swallowed by the frame loop's catch. Verified by REINSTATING the fault: it
fails with `CAM AT ORIGIN` and prints the swallowed TypeError.

### THE GREEN ITSELF
With the player driving again, the reproduction matched the phone: mean
**(54.8, 69.3, 9.5)** against PINE VALLEY's (67.6, 84.1, 60.4).

The theme comment above these constants tells the first half of the story — an
earlier round measured `undercity` as the darkest world in the game at 7.6/255
and fixed it. It fixed it by getting BRIGHTNESS OUT OF A SATURATED LIGHT:
hemiSky `#8a9a5c` at intensity **5.5**, a `#d8e87a` sun at 3.0. That does not
light a green world, it multiplies every albedo in it by green and clips the
rest. The tell is the car — its yellow paint came out cyan-white. A car whose
paint you cannot see is the clearest evidence a cast is broken.

Light with intensity, tint with colour. The lights come most of the way back to
neutral; the sickly cast stays where a cast belongs, in the fog, the haze and
the materials, all untouched. `castsweep.mjs` patches the lights in the running
scene and re-measures, five tunes in one load, because NEO-KYOTO takes ninety
seconds to build and reloading per guess is an afternoon:

```
as-is  (54.6, 69.1,  9.2)  green+37.2  lum 61.7  dark 11.7%
A      (42.2, 53.5, 16.1)  green+24.4  lum 48.4  dark 18.9%
B      (42.3, 49.5, 18.6)  green+19.0  lum 45.7  dark 21.0%
C      (51.9, 60.3, 25.8)  green+21.5  lum 56.0  dark 14.9%   <-- shipped
D      (50.9, 63.7, 21.9)  green+27.3  lum 57.9  dark 14.1%
```

C: blue nearly tripled, green excess down to what a forest reads (PINE VALLEY
is 20.2), and luminance held at 56 — the world stays lit, which was the whole
point of the first fix. `hemiSky 0x929c88`, `hemiGround 0x5f6252`, hemi 4.2,
`sunColor 0xe0e8c0`, sun 2.8.

The blown-out headlight in the same screenshot needed no separate fix: an
additive beam on a road that is already flooded has nowhere to go. At the chase
camera in the corrected world, **0% of the frame is blown**, and the player's
lamps are on (they could not have been before — `_syncLights` threw).

### THREE PROBE FAULTS PAID FOR ALONG THE WAY
1. `drawImage(renderer.domElement)` returns a BLANK after the frame is
   presented — no `preserveDrawingBuffer` — and re-running `composer.render()`
   first does not help. Every world read as (0,0,0). Screenshot through the
   compositor instead.
2. `input.throttle` is a GETTER with no setter (`input.js:150`). `g.input.throttle
   = 1` silently does nothing, so the first three runs of `playermoves.mjs`
   measured a car free-rolling and called five worlds broken. `input.analog.throttle`
   is the settable one; with it, NEO-KYOTO drives at 27 — faster than PINE VALLEY.
3. Frame counts are not time. "180 frames" under swiftshader is a different
   amount of simulated time every run — the same gate passed PINE VALLEY at 172 u
   travelled and failed it at 64 u ten minutes later. Wall-clock windows, and
   `camToCar` is REPORTED rather than asserted: the camera lerps in from the
   origin and a grid 264 u out is still arriving when the window shuts.

## r267 — A CLEAN BILL OF HEALTH, AND A PHANTOM
r266 found `_syncLights` by accident, and the thing that made it invisible was
the frame loop's own catch. So this round went looking for the rest of that
class, and for whatever else the undercity green was a symptom of. One real
fix, one clean sweep, and one bug that turned out not to exist.

### THE CATCH REPORTED ONCE. EVER.
`Game.frame()` kept a single `_frameErr` and reported only if it was unset, so
the FIRST throw of a session silenced every DIFFERENT one after it, permanently.
And a throw that repeats every frame — which is the normal case — means the
first one is always already there. `_syncLights` sat in exactly that shadow: it
fired on frame one of every level, so any second fault in the same session was
invisible to a player and to every probe. Keyed on the message and the top
stack frame now: each distinct fault reports exactly once, and a new one is
never hidden behind an old one.

### AND THEN NOTHING WAS HIDING
`swallowed.mjs` drives each level for seven seconds — throttle, steering,
cannon, missiles, mines, shockwave — and collects whatever the catch printed.
Twelve levels across every biome: **nothing swallowed.** `_syncLights` was the
only one of its kind.

The first cut of that sweep reported clean having tested nothing. It called
`g.fireCannon?.()`, `g.dropMine?.()` and three more names that do not exist —
the real API is `game.weapons.fireBullet/fireMissile/dropMine/fireShockwave(car)`
— and `?.` turned every one into a silent no-op. Same shape as r266's
`input.throttle` getter. **A probe that cannot find its subject must SAY SO,
not pass**: it now throws on a missing name.

### THE PHANTOM, IN THREE WRONG METRICS
The undercity green was found because a saturated light drags every albedo in
the frame toward one hue. Does that swallow the CARS anywhere else? A static
scan for the same signature — saturation times intensity — flagged `volcano`,
`wildfire`, `oldtown` and `neon`, and `worldcast.mjs` gained `minChannel`, the
number that named NEO-KYOTO (blue at 9/255). EMBER PASS came back at
(86, 28.6, **8.6**) and FOREST FIRE ESCAPE at (95, 26.1, **11**) — worse, on
that measure, than the undercity ever was. And looking at FOREST FIRE ESCAPE, a
red rival on a red road looked genuinely lost.

So `carvisible.mjs`: mask each car, measure its CIE76 distance from the ground
ring around it. Three metrics before one of them was right.

1. **Mask by diffing a hidden car.** Reported delta-E 1 to 4 for EVERY world,
   PINE VALLEY included, where the car is plainly visible. A metric that cannot
   separate a world you know works from one you suspect does not is measuring
   noise — and it was: a threshold of 22 summed over three channels is met by
   seven per channel, so the mask filled with antialiasing and drifting embers.
   Key-colour masking instead, which is the ground truth `eyesweep.mjs` had to
   learn for the same reason.
2. **Mean car against mean ground.** Now it discriminated — and said the fire
   worlds were fine (26 to 35) while the pale rival was at **5.8** on PINE
   VALLEY, 6.4 on REDWOOD, 8.5 on NEO-KYOTO. Two of seven rivals are near-white
   (DUNE `#dce8f0`, ALPINE `#f2f0e8`) and almost every ground in this game is
   pale. That reads as a real, structural bug, so every car got a thin dark
   ground plate — paint-independent, sized inside the wheel track so no
   bounding box moved. It changed the number by **0.3**.
3. **Per pixel.** A change that measures as almost nothing is usually the
   metric, not the change (r265, the tree tints). It was. The mean of a car
   against the mean of its ground asks whether the car matches ON AVERAGE, and
   that is not what makes a shape visible: a car holding both black tyres and
   pale bodywork averages out to the colour of the road while every part of it
   separates cleanly. Score each car pixel instead:

```
                      visible%   median dE
PINE VALLEY  rival 2    86.7       34.1     (mean-vs-mean said 5.8)
REDWOOD      rival 2    72.8       33.1     (said 6.4)
every car, every world  73-99      33-66
```

**There was no visibility bug.** The plate is reverted: it bought under 1.5
points on a metric where everything already passes, and this repo does not ship
geometry that cannot show its work — the same rule that cut the grass tufts and
the pine crowns. The probe stays, with its three failures written into it, and
the `PLATE=off` toggle stays as the shape of a correct A/B: hide the thing,
never rebuild the scene without it.

## r268 — HEADLIGHTS ON EVERY CAR, AND A CAMERA THAT WAS LOSING THE CAR
Two phone reports. The second one turned up something worse than either.

### "ALL CARS NEED TO HAVE HEADLIGHTS" — THEY ALL DO
`lampcheck.mjs` lists every car with whether it HAS a lamp rig and whether the
rig is on, sampled on the grid and again racing, because "no lights" and
"lights that only arrive after the lights go green" are different bugs. On
NEON GRID all eight — player and every one of the seven rival styles — report
`rig: true, on: true` in both states. They also share ONE material
(`carLightMaterial`), so no car can be lit differently from another. There was
nothing to fix in the cars.

What differed was the CAMERA. `fadeCarLights` dims that shared material by how
far down the camera looks, because a beam lying flat on the road seen from
straight above is a painted puddle rather than light. `beamread.mjs` reads the
opacity it settles on per mode:

```
TOP-DOWN  down 0.76   opacity 0.238
TOP FAR   down 0.82   opacity 0.238
TRAIL     down 0.55   opacity 0.461
CHASE     down 0.23   opacity 0.850
```

Both overhead modes sat on the floor of the curve at 28% — **and TOP-DOWN is
the camera the game starts in.** At that strength the nearest, best-angled car
still throws a visible beam and the others do not, which reads exactly as "some
cars have headlights and some don't". `CAR_LIGHT_TOPDOWN_CUT` 0.72 -> 0.45:
TOP-DOWN opacity 0.238 -> 0.468, TRAIL 0.461 -> 0.607, CHASE unchanged. The
fade stays, because the reason for it is real; it just may not take the whole
read away.

**A metric that did not work, stated as such:** `beamread.mjs` also counts the
pixels that change when every rig is hidden, and on NEON GRID that count barely
moved (22 338 -> 23 400 in TOP-DOWN) while the opacity doubled. The world
animates — neon strips, holo boards, particles — and at a diff threshold that
low the count is mostly animation. The opacity is exact and the before/after
screenshots are plain; the pixel count is not evidence here and is not quoted
as any.

### AND THE CAMERA WAS LEAVING THE CAR BEHIND
The other report: CANYON RUN, half the frame a flat slab of cliff, the car
shoved into the corner behind the buttons. `_watchCarVisible` does not fire on
that and is right not to — it tests hidden, buried and OFF SCREEN, and the car
was none of those. It was on screen and behind a rock.

Parking the car and pushing it sideways showed nothing: the lateral clamp held
out to 30 u off the racing line and the car stayed dead centre of frame.
Teleporting between stations showed a camera 100-180 u away, but that was the
probe — a camera asked to catch up from a third of a lap is not a thing a
player ever does. So `caproll.mjs` RAILS the car: one small index step a frame,
all the way round, sampling as it goes.

```
CANYON RUN   camDist  51 -> 110 -> 240 -> 372 -> 439 -> 490, never recovering
PINE VALLEY  camDist  51.1 to 52.0 at every sample of the same lap
```

The only difference between those two worlds on this path is `cliffWalls`, and
the only code gated on it is `clampCam`. `nearestIndex` searches ±30 samples
around its hint, so once the camera drifts past that window it resolves against
the WRONG piece of track; `lateralOffset` is then measured from a centreline
that is nowhere near, and the clamp pushes the camera along an arbitrary
normal — which makes the next frame's offset bigger. A correction that
compounds.

Two fixes. The cause: **a clamp may only pull the camera in, never push it
out** — one line, and it cannot be argued with. And the symptom, in the spirit
of the watchdog above it: **the boom has a length.** Every guard in that
function moves the eye for a good reason and any of them can be wrong about
where it put it; none checked the one thing always true, which is that a chase
camera three times its own boom length from the car has failed whatever the
reason. Past twice the boom it snaps to where the mode says the eye belongs.

After: camDist median **51.2** across the whole lap, max 80.3 — inside the
leash, and two transient samples rather than a runaway. `boot.mjs` 4/4,
`playermoves.mjs` passes CANYON RUN as well as PINE VALLEY.
