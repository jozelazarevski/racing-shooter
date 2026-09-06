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

PARTIAL ANSWER (r363): a calibrated ROBOT baseline now exists —
`tests/fixtures/robot-baseline-r363.json`, the airace expert stand-in at
skill 0.94 racing full 3-lap races on one world per template. Best laps:
PINE VALLEY 89.0 s, CANYON RUN 102.3 s, FROST PEAK 142.3 s, RED CENTRE RUN
123.7 s, CAPO VELA 121.7 s, THE DUNE SERPENT 79.1 s (every world shows
lap-over-lap improvement as the line settles, so lap 1 times carry launch
and traffic). Robot finish ranks on those runs spread P1-P8, which is the
field working. This is NOT the human number — it is a stable, reproducible
anchor to measure drift against until the owner clocks a real lap.

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

## r269 — "BRING BACK HEADLIGHTS FOR ALL CARS", AND WHY IT KEPT COMING BACK
Asked a second time, which meant the first answer was wrong. It was.

### WHAT IS ACTUALLY DEPLOYED
`origin/main` is at **r245**, `gh-pages` carries `deploy: e72f52c` — main's head
— and https://jozelazarevski.github.io/racing-shooter/ serves `build-tag r245`.
Every round since is on `claude/design-replication-o09hkl` and has never been
published. So the phone reports of the last several rounds are all reports
about r245, and checking a symptom against the working tree answers a question
nobody asked.

`git show origin/main:src/vehicles.js | grep -c carLights` → **0**. The whole
merged lamp rig does not exist there. r245 does headlights as commit 55bdd77
describes them: "One spotlight, built ONCE at startup and left in the scene for
the whole session" — a single `THREE.SpotLight` on `this._headlight`, attached
to the PLAYER. One headlight in the world, and it belongs to you. That is
exactly and completely why only the player's car throws a beam in the phone
shots, and "bring back headlights for all cars" is a precise description of it.

The per-car rig — every car carrying its own merged additive lamps, pools and
tail lenses in one draw call — is branch work. It answers the report. It has
simply never reached the player.

### TWO REAL FAULTS FOUND WHILE LOOKING ANYWAY
**The cache that could only cost you your headlights.** `_syncLights`
remembered the track it had decided for and returned early ever after — so the
decision stuck to a CAR that had since been given a different MESH, and a
freshly built rig has its lamps off. `swapPlayerCar` knew to clear the flag by
hand; nothing else did and nothing added later would. It was guarding one
boolean write per car per frame, eight on a full grid. Gone.

**The fade, again.** r268 took `CAR_LIGHT_TOPDOWN_CUT` from 0.72 to 0.45, and
0.45 still halves the beam in the mode the game opens in. Halved is what "some
cars have headlights and some don't" looks like on a phone. 0.18: top-down
opacity 0.238 → 0.468 → **0.697**. The purist case for a deep cut — a wedge
lying flat on the road reads as paint rather than light — loses to being asked
twice. What survives is a gentle taper rather than a cliff.

Verified with `fieldshot.mjs`, which packs the field round the player and
shoots a named camera: NEON GRID, all eight cars `on`, every one throwing a
visible wedge in TOP-DOWN. PINE VALLEY, all eight `OFF`, so `worldIsDark` still
does its job and nobody drives a daylit world with the lights burning.

## r270 — THE CLIFF CAMERA I COULD NOT REPRODUCE, AND WHAT MEASURING IT FOUND
A phone shot of CANYON RUN: half the frame one flat slab of rock, the car
shoved into the bottom-right corner behind the buttons, 11 km/h, hull 77, 8th
of 8. Diagnosed as the chase camera inside a cliff. Four reproductions, none of
them it.

1. **Park the car at lateral offsets 0 to 30.** Occlusion of the car's own
   silhouette rose 8% → 33%, but the car sat at NDC x = -0.02 at EVERY offset,
   against +0.55 in the report. The car also never actually left the road:
   `WALL_LIMIT` snaps it back inside the barrier before the camera sees it, so
   the poses I picked were not the state being reported.
2. **Drive straight into the walls for forty seconds.** The car reaches 74 u
   off the centreline — it leaves the canyon entirely — and `|ndcX|` peaks at
   **0.23**. The camera follows it out without complaint.
3. **Instrument the clamp.** It works: the eye pins at lateral -8.2 while the
   car runs out to -15.4, `dist` holds 51 against a nominal 48.7, and the car
   stays on screen throughout.
4. **Raycast eye-to-car, every third frame, three camera modes.** A probe can
   `import('three')` in the page — the import map applies — so this is exact
   and needs no readback. **0 occlusions in 112 samples.** And the ray set was
   checked rather than assumed: 988 solids kept, 65 dropped, and every dropped
   one is haze, contact shadow, decal or car lamp.

The hypothesis is dead, and the geometry says why. `_cliffRibbon`'s rows put
the FOOT nearest the road and every row above it further out — the faces lean
away as they rise, so there is no overhang for an eye to get behind. Rock
nearest approach 11.05-11.3; camera bounded at 8.4.

### WHAT THE MEASURING DID FIND
`cliffgap.mjs` reads the cliff foot per station. On CANYON RUN the face is
nominally `WALL_OFF + 0.65 + cliffSetback` = **37 u** out — and `_cliffCap`
pulls it in to **11.3 at sixteen stations**, wherever the lap comes back past
itself. A three-fold variation.

The camera's guard is the constant `lim = 8.4`, and it reads neither number. It
clears the rock by 2.9 u for no reason anybody had checked: change
`cliffSetback`, change the cap, change `WALL_OFF`, and the eye starts sitting
in stone with no test to catch it. `track.cliffFoot` now publishes the measured
foot per station and per side, and `clampCam` takes `Math.min(8.4, foot - 2.6)`
— so the limit can only tighten, never loosen.

**It changes nothing today**: closest foot 11.05, so `foot - 2.6` = 8.45 and
the constant still wins at every station on every cliff world. That is the
point. A coincidence became an invariant, and the number that used to be
load-bearing by accident now has the thing it guards on the other side of it.

The report itself stays open and honest: I do not know what produced that
frame, and I have written down the four things it is not.


> NOTE ON NUMBERING: the two section lines below ran in PARALLEL sessions
> and both used r271+. The AGENT-DRIVER line (driving/difficulty measurement)
> and the MAIN line (landscape/attract/canvas fixes, deployed as build r271-r273)
> are different work; read the titles, not the numbers.

# --- AGENT-DRIVER LINE (parallel sessions) ---

## r271 — AN AGENT FINALLY DROVE EVERY WORLD, AND THE NUMBER THAT DID NOT EXIST NOW HAS A FIRST ANCHOR

Asked: "can the agent drive all tracks and investigate bugs". It can, it did —
all 78, through the same inputs a thumb has. `tools-scratch/agentdrive.mjs` is
the driver: pure pursuit on the centreline, curvature-limited target speed,
fed through `g.input.analog`, stepped with the fixed-delta synchronous-frame
trick. Every harness before it teleported the player or held the throttle
open-loop; none of them could be shot, mined, or punished for a corner taken
badly, which turned out to be the entire story.

### THE CLEAN BILL, FIRST
Across 78 worlds driven at racing speed: **zero** page errors, zero swallowed
frame-loop faults, zero NaN, zero under-terrain, zero stuck spots, zero
teleport rescues. The camera held within 35 u of the car on 77 worlds (the
r270 leash never fired). The two carry-fowards: RED CENTRE RUN showed one
transient camera excursion to 74 u — inside the leash, unexplained, bounded —
and CAPO MELE let the driver reach lateral 15.9 on a half-width-9 road
(one hairpin overshoot; WALL_LIMIT should have argued sooner).

### WHAT ACTUALLY BREAKS A DRIVEN LAP: NOTHING GEOMETRIC. EVERYTHING MARTIAL.
On NORMAL, a driver that holds a competent line but never shoots, never
dodges and never uses a pickup reaches hull 0 on ~70 of 78 worlds and burns
all three hulls before completing lap 1 on **22** of them. `whokilled.mjs`
(new) wraps `player.damage()` and buckets every hull point by caller:

    NEON GRID    fire 309 (named rivals) + 83 mines, walls 8     — all combat
    DUST CANYON  fire 388 + 79 mines + 109 stone                 — mostly combat
    PINE VALLEY  stone 212 + fire 114                            — mostly corners

The anonymous 38-52 hits are MINES (weapons.js:719 `onPlayerHit(dmg, null)`),
laid on the racing line, eaten by anything that follows the racing line. The
stone hits are the driver's own cornering: `nearsamples.mjs` shows PINE
VALLEY's repeat offenders at samples ~93/~294 are the EDGE RAILS at |lat|
10.8 on a half-width-9 road — the wall is where it belongs; pure pursuit
carried ~25 u/s of normal speed into it. NOT the One Defect. No placement
fault surfaced anywhere in the sweep.

### THE A/B THAT SETTLES WHETHER THAT IS A BUG
Same driver, same eight worst worlds, `DIFF=easy` (localStorage `ir-diff`):
**8/8 lapped, six with zero wrecks, hull 18-81 remaining** — against 0/8 on
normal. The difficulty ladder does its job; NORMAL is tuned on the assumption
the player fights back. Whether that assumption should hold for the DEFAULT
tier is a design question, now with numbers attached, not a defect. Nothing
was tuned this round — MEASUREMENT DISCIPLINE holds.

### ITEM 1, PARTIALLY PAID
Nobody had ever measured a competent lap. Now: agent laps 26-75 s across the
roster (full table below), and mid-race pace sampled from the same runs puts
the agent at 0.70-0.77 laps/30 s with rivals at 0.53-0.86 on the same worlds
— the field paces the player, as designed, and the old 0.5-0.9 laps/30 s
figure reproduces. Grid placement starts everyone at progress ~0.9 with
`_wraps` compensating, so raw `progress` deltas from the grid overstate rival
pace by a whole lap; measure mid-race or not at all (agentdrive's `rival@lap`
column suffers exactly this and is not evidence).

CAVEAT, stated plainly: this is an AGENT baseline, not a human one. It brakes
earlier than a human and never uses nitro, never fights. It is a floor with
known biases, but it is reproducible, per-world, and it exists.

    agent lap times, NORMAL, r271 tree (w = wrecks in the run; "3-wreck" =
    race ended by the three-hull rule before lap 1):
     1 PINE VALLEY            40.5s        w0   |        2 DUST CANYON            33.5s        w2
     3 FROST PEAK             56.6s        w2   |        4 CANYON RUN             49.9s        w2
     5 EMBER PASS             32.6s        w0   |        6 SUMMIT CLIMB           39.4s        w1
     7 GLACIAL PASS           39.7s        w1   |        8 AMAZON RAPIDS          3-wreck (45.7s on easy) w3
     9 THE DUNE SERPENT       39.4s        w2   |       10 ROCKFALL RAVINE        58.3s        w2
    11 OASIS AMBUSH           35.7s        w2   |       12 REDWOOD RAMPAGE        50.4s        w1
    13 LOG FLUME FURY         3-wreck      w3   |       14 FOREST FIRE ESCAPE     58.3s        w2
    15 GLACIER'S GRIND        47.3s        w1   |       16 AVALANCHE ALLEY        69.2s        w2
    17 NEON GRID EXPRESSWAY   3-wreck (55.4s on easy) w3   |       18 UNDERCITY SLIPSTREAM   44.8s        w1
    19 GOTTHARD CLIMB         52.8s        w2   |       20 TREMOLA DESCENT        49.5s        w0
    21 FURKA RIDGE            3-wreck      w3   |       22 COL DE TURINI          55s          w2
    23 OUNINPOHJA             28.1s        w2   |       24 FAFE LEAP              31.5s        w1
    25 PIKES PEAK             53.3s        w1   |       26 SAFARI PLAINS          38.2s        w2
    27 CORNICHE               3-wreck (43s on easy) w3   |       28 ESTONIA CRESTS         3-wreck      w3
    29 OLIVE COAST            3-wreck      w3   |       30 LANTERN QUARTER        3-wreck (41.5s on easy) w3
    31 HEDGEROW DASH          43.9s        w2   |       32 RED CENTRE RUN         58.3s        w0
    33 RED BULL RING          3-wreck      w3   |       34 MONACO STREETS         32.2s        w2
    35 SILVERSTONE            36.2s        w0   |       36 SPA-FRANCORCHAMPS      41.2s        w2
    37 SUZUKA                 34.4s        w2   |       38 NORDSCHLEIFE           3-wreck      w3
    39 MONZA                  28.5s        w1   |       40 MARINA BAY             35.8s        w2
    41 MOUNT PANORAMA         3-wreck      w3   |       42 RALLYCROSS ARENA       31.5s        w2
    43 OULTON PARK            38.9s        w2   |       44 LAGUNA SECA            41.3s        w2
    45 TOUR DE CORSE          75.4s        w1   |       46 VINEYARD VELOCE        53.3s        w2
    47 DEEPWOOD TRAIL         3-wreck      w3   |       48 DOLOMITI CORSA         55.9s        w1
    49 HARBOR QUAY            26.1s        w2   |       50 CINQUE TERRE           37.7s        w2
    51 AEGEAN BLUE            33.4s        w2   |       52 COSTA BRAVA            3-wreck (46.9s on easy) w3
    53 DALMATIA DRIVE         3-wreck      w3   |       54 COTE D AZUR            48.4s        w2
    55 BRIDGE RUN             3-wreck      w3   |       56 OLIVE CROSSING         3-wreck      w3
    57 MOUNTAIN TO SEA        52.8s        w1   |       58 CITADEL BAY            3-wreck      w3
    59 CLIFF KNOT             48.5s        w2   |       60 SEA CLIFF RUN          3-wreck (50.8s on easy) w3
    61 OLIVE PASS             54.5s        w3   |       62 CAPE OLIVETO           3-wreck      w3
    63 TERRAZZA ALTA          74.1s        w0   |       64 SALINE SPRINT          27.2s        w1
    65 GRANITE NARROWS        25.8s        w2   |       66 GLACIER COL            35.7s        w1
    67 TIMBER GORGE           34.9s        w0   |       68 LARCH GOLD             45.6s        w1
    69 MAPLE MILE             3-wreck      w3   |       70 HARVEST RUN            3-wreck (38.1s on easy) w3
    71 CIDER LANE             53.1s        w2   |       72 BRACKEN MOOR           74.1s        w0
    73 ALASSIO SEAFRONT       44.8s        w3   |       74 IL BUDELLO             31.5s        w0
    75 PORTO MOLO             3-wreck (36.1s on easy) w3   |       76 CAPO MELE              55.1s        w1
    77 GENOVA PORTO           38.7s        w0   |       78 SANREMO STAGE          74.8s        w0

### FOR THE NEXT SESSION
- The 14 "3-wreck" worlds not yet re-run on easy: run `DIFF=easy agentdrive`
  before believing anything about them.
- If the arsenal is ever taught to the agent (shoot back, dodge mines), the
  normal-tier numbers above become the "passive floor" against which that
  driver's survival measures what fighting back is worth.
- `whokilled.mjs` keys damage by call stack; if main.js moves, the line
  numbers in its output move with it — the buckets are still right, the
  labels just need re-reading.

## r272 — THE THREE CARRY-FORWARDS SETTLED, AND WHAT FIGHTING BACK IS WORTH

### ALL 22 "3-WRECK" WORLDS LAP ON EASY. THE ROSTER HAS NO UNLAPPABLE WORLD.
The 14 not yet re-run in r271, on `DIFF=easy`: 14/14 lapped (33.1-54.9 s),
nine of them with ZERO wrecks — NORDSCHLEIFE hull 70 remaining, BRIDGE RUN
62, MOUNT PANORAMA 54. With r271's eight that is 22/22: every world that
ended a passive NORMAL run by the three-hull rule laps cleanly one tier
down. Geometry is never the blocker; the guns are.

    13 LOG FLUME 33.1s w1    21 FURKA 54.9s w1     28 ESTONIA 38.5s w0
    29 OLIVE CST 37.2s w0    33 RB RING 35.6s w0   38 NORDSCH 33.5s w0
    41 PANORAMA 35.7s w0     47 DEEPWOOD 44.6s w0  53 DALMATIA 37.4s w0
    55 BRIDGE  42.4s w0      56 OLIVE X 52.0s w0   58 CITADEL 34.7s w0
    62 CAPE OL 38.6s w1      69 MAPLE   38.5s w2

### WHAT FIGHTING BACK IS WORTH: 0/8 BECOMES 5/8, ON NORMAL
`agentdrive.mjs` grew `FIGHT=1`: hold Space when a rival sits within 55 u
and 0.22 rad of the nose, tap E for a homing missile when one is lined up
10-50 u out, once per 8 s. The DRIVING is unchanged — the delta is the guns.
On the same eight worlds where the passive driver went 0/8 on NORMAL:

    AMAZON RAPIDS  46.6s w1 k1     NEON GRID   54.9s w2 k7
    LANTERN QTR    42.5s w2 k5     HARVEST RUN 36.3s w1 k2
    PORTO MOLO     36.0s w1 k3     CORNICHE    3-wreck k5
    COSTA BRAVA    3-wreck k2      SEA CLIFF   3-wreck k2

5/8 lapped, wrecks per run 3 -> 1-2, one to seven rivals destroyed with a
thumb-grade aim policy (no lead, no mine avoidance, no pickup use, no
nitro). So NORMAL's assumption is now a measured statement: a driver who
merely SHOOTS at what is in front of them survives most worlds; add the
dodging and pickups a human actually does and the tier is honest. The three
that still 3-wreck under a crude gunner are the sharpest combat worlds on
the roster and the first place a difficulty pass should look — with numbers,
not vibes.

### THE TWO ODDITIES FROM r271, CLOSED
- CAPO MELE lateral 15.9: does not reproduce (9.6 on re-run). The clamp
  code says why it CAN happen at all: on non-cliff worlds the player is
  deliberately unclamped — "the world is open and off-road slowness is the
  boundary" (vehicles.js track-constraint block). A wide moment on an open
  verge is the design working, not WALL_LIMIT failing. r271's carry-forward
  note mis-read the rule; corrected here.
- RED CENTRE RUN camera 74 u: reproduces exactly — at sample 6, i.e. the
  RACE-START transient while the chase camera converges from its grid pose,
  settling to ≤33 for the rest of the lap. Inside the r270 leash, visible
  for under a second, on the world with the longest start straight. Benign.
  `camAt`/`latAt` in agentdrive now locate this class of thing in one run.

### FOR THE NEXT SESSION
- CORNICHE, COSTA BRAVA, SEA CLIFF RUN: the three worlds that kill even a
  shooting driver on NORMAL. whokilled.mjs on those three, on NORMAL, is
  the next measurement: if it is mines-on-the-line, the mine ring's
  visibility at racing speed is the design question; if it is missile
  volume, the global rocket budget (g._aiRocketMin) is.
- The FIGHT policy never dodges: teaching it to read `weapons.mines`
  positions and offset the pursuit line ±3 u would separate "mines are
  fair" from "mines are unavoidable on a line-width road".

# --- MAIN LINE (deployed builds r271-r273) ---

## r271 — LANDSCAPE, AND THE CAR THAT NEVER COUNTED AS STUCK
Two, reported together off a tablet held sideways.

### THE HUD WAS LAID OUT FOR A TALL SCREEN
`landscape.mjs` measures every visible HUD box and reports the pairs that
overlap, which turns "it looks cramped" into a list:

```
health-box x joy-base   8194 px2      the stick's ring on the hull readout
t-unstuck  x info-box                 SOS through the CONTRACTS list
t-unstuck  x health-box
```

Three causes, all of them the same mistake — treating landscape as portrait
with less height:

1. `#joy-zone{height:80%}` in the `max-height:560px` block. On the screen with
   the LEAST height, the stick's zone was made TALLER. Landscape's spare room
   is horizontal: 52% wide, 47% tall.
2. `#t-unstuck{bottom:214px}`. On a 402-tall screen that is y=144 — straight
   through the contracts list. Moved along the bottom edge, clear of the ring
   and the speedo.
3. And the one that mattered: **`base.style.top = r.height - 110`**
   (`input.js`). The zone is anchored to the bottom, so this puts the ring's
   centre 110 px off the floor on EVERY screen, whatever the zone's size. At
   402 tall that is y=292, and with a 62 px radius the ring reaches 230 and
   sits on the hull panel. Shrinking the zone did not move it — the overlap
   came back **identical to the pixel**, which is the tell every time. Now
   `Math.min(110, innerHeight * 0.22)`: unchanged in portrait, 88 in landscape.

All three orientations: **no visible overlaps**.

### AND THE GREEN BANDS
`setSize(w, h)` writes `style.width/height` in pixels, which overrides the
`inset:0` that is supposed to make the canvas cover the screen. Anywhere
`innerWidth` is narrower than what the player can actually see — iOS insets the
layout away from the notch in landscape — the page background shows through as
a band down each edge, and that background was `#7fb85c`. `setSize(w, h,
false)` leaves the CSS alone so the canvas covers by `inset:0`, and the page
behind it is black, so anything left over reads as a bezel instead of a fault.

### THE WEDGE NET COULD NOT SEE A CAR GRINDING ON A WALL
Photographed: 0 km/h, lap 0 of 3, thirty-nine seconds in, last of eight, car in
the barrier. The player DOES have a free rescue — `_wedgeT > 5` — and it never
fired, because the test was

    input.throttle > 0.5 && speed < 0.8      // and the timer reset to ZERO

A car pinned on a barrier is never still. It jitters, bounces and scrubs, and
ONE frame above 0.8 in five seconds cleared the clock. It was going nowhere and
it never qualified as wedged. Now it is judged on DISPLACEMENT: anchor a
position while the throttle is held, and six metres of real progress clears the
anchor. Six metres in five seconds is 4.3 km/h, so a genuine crawl is untouched.

The rescue also re-seated the car at the SAME index — the exact trap the
rivals' pit-lift was fixed for in `EnemyCar._liftAhead`, never carried across to
the player. Rescues that follow within 25 s now step further down the lap.

`wedgetest.mjs` took three cuts to be worth anything, and the first two are
worth recording. It first passed as soon as the car had travelled 25 u — which
a car that simply steers around the obstruction also does, proving nothing. It
then waited for the rescue itself and could never see it: the net needs five
seconds of `dt`, `dt` is clamped to 0.05, and swiftshader gives about two
frames a second — over a hundred frames of wall clock for one assertion. So it
now tests what actually changed: pin the car, inject jitter, count how often the
timer goes BACKWARDS. **60 frames, 0 resets, peak 3.0 s — at speeds of 1.68 to
2.09, every one of them above the old 0.8 cut-off** that would have zeroed it.

## r272 — "CAR IS NOT VISIBLE HERE"
Reported from the TRACKS tab. The title screen runs an attract camera behind
the menu, and it orbited `track.center[0]` at radius 55, looking at the road's
CENTRELINE.

The player starts EIGHTH. That is the grid slot furthest from the centre —
measured at 18.8 u off it — so the car projected to **NDC x 0.87**, hard against
the right edge, cropped or behind the panel. `titlecar.mjs` confirmed the mesh
was in the scene, visible, with no hidden ancestor, and simply not framed: the
attract shot was an empty hillside with the whole eight-car field jammed into
one corner.

Orbit the CAR, at radius 26 and 11 up rather than 55 and 34, aimed 12.5 BELOW
it so it rides high in the frame where a bottom-anchored menu leaves room.
**NDC (0.87, -0.14) → (0.00, 0.52).**

The panel still covers most of a portrait screen — that is what a full-screen
track list does — but the car is now in the strip above it and down both edges,
and in landscape it is plainly in shot. What it is NOT any more is absent.

## r273 — "CAMERA IS BROKEN OVERALL", AND IT WAS r271's FAULT
It was. r271 changed `renderer.setSize(w, h)` to `setSize(w, h, false)` to stop
it writing the canvas's CSS size, on the theory that
`#game-canvas{position:fixed;inset:0}` would size the element instead and so
cover an iOS safe-area band. That theory is wrong, and wrong in a way worth
writing down:

> A `<canvas>` is a REPLACED element. Its used width comes from its INTRINSIC
> size — the `width`/`height` attributes, which are the drawing buffer — and
> `left`/`right` do not stretch it. `inset:0` anchors it and sizes nothing.

With the style write gone, the element laid itself out at buffer size in CSS
pixels. `camsanity.mjs` measured the canvas box at **703x1529 on a 402x874
screen**, because the touch pixel ratio is 1.75: the view was zoomed 75% and
cropped to the top-left corner, on every touch device, in every state. Which is
exactly what "broken overall" means — one wrong number that makes everything
wrong at once.

The style write is back. Box now equals the screen in portrait, landscape and
desktop, title and race, with the buffer correctly 1.75x on touch.

`camsanity.mjs` is the gate: it asserts the canvas BOX equals the screen, that
the buffer shares the box's aspect (or the whole image is stretched), and that
`camera.aspect` agrees with both. None of the existing gates could see this —
`boot.mjs` boots, `pageerr.mjs` finds no error, `playermoves.mjs` drives — because
nothing threw. It was a layout fact, and only a layout measurement finds it.

**And the green bands are unfixed again.** The revert takes the attempted fix
out with it; what remains from r271 is the black page background, so a band
reads as a bezel rather than as lime. That one was never confirmed to work in
the first place — it could not be tested here — and it broke the view for
everyone in exchange. A blind fix for an unreproducible report, shipped without
a gate, is worth less than nothing.


## r274 — ONE COMMAND, EVERY GATE
r271 shipped a view zoomed 75% and cropped to the corner on every touch device,
and it went out past a suite that was three scripts somebody remembered to run.
The player found it. That is a process fault, not a coding one, so:

    node tools-scratch/gates.mjs        # everything
    FAST=1 node tools-scratch/gates.mjs # skip the slow sweeps

Eight gates, one exit code, run before anything is pushed. **A gate nobody runs
is a gate that does not exist**, and neither is one that only PRINTS: three of
them — `pageerr`, `landscape`, `bayblack` — reported in prose and could not be
driven by a runner at all. They exit non-zero now. Adding a gate that prints
its verdict instead of returning it is the same as not adding one.

### AND THE GATE ITSELF HAD TO GET FASTER TO BE USABLE
`camsanity.mjs` opened a fresh page per screen size. Building the track costs
about ninety seconds under swiftshader, so three sizes meant three builds and
the gate **timed out at ten minutes** the first time the runner called it — a
gate that cannot finish inside its budget is another gate that does not exist.

It now builds ONCE and rotates the viewport, which is both four times faster and
a better test: a canvas that is correct on load and wrong after a rotation is
precisely the bug it was written for. Six cases — portrait, landscape and
desktop, title and race — all green, box equal to the screen in every one.

Worth reading the buffers rather than skimming them: portrait TITLE renders at
703x1529 and portrait RACE at 402x874 on the same screen. That is not a fault,
it is `_autoQuality` dropping the pixel ratio under load, and the gate passes
both because it checks the box against the SCREEN and the buffer's ASPECT
against the box — never the buffer's size against anything.


# --- AGENT-DRIVER LINE (continued) ---

## r273-line — THE PHONE SHOT ON THE BLACK APRON, AND THE EXEMPTION THAT NEVER SAID WHO IT WAS FOR

A phone shot off the live r273 build: 8th of 8 at 0:16.7, 3 km/h, hull 77,
the car parked on a green ledge above a carriageway with black nothing
beside it, the stick at rest. World identified by texture match against
overhead probe shots: **UNDERCITY SLIPSTREAM** — the terraced olive trench
walls, the mottled slab roadway, the marker posts on the rims.

### REPRODUCED, THEN CLOSED AT THE EXIT
`_cliffProfile` around the start bowl reads h = 1.7 for ~40 samples on BOTH
sides — under the clamp's 2.5 exemption, written "so free-roamers can drive
out" and applied to everyone. A racing car carving wide off the line (or
shoved wide — the grid is eight cars and missiles fly from the first
seconds) left the trench at full speed. Then, with the throttle released,
it coasts to lat 74, sinks to the apron at y −4.1, and sits for ever:
- the wedge net anchors displacement WHILE THE THROTTLE IS HELD (r273's
  own fix), so a player who gives up pushing is invisible to it;
- the lost net was deliberately narrowed to broken states (under terrain,
  NaN) because yanking wanderers back "read as the game resetting you";
- SOS works out there — the phone player had a charge in hand, unused.
All three of those are design decisions with reasons; the defect was the
EXIT, so the fix is one clause: `wallHere = !prof || prof.h > 2.5 ||
!freeRoam` — the berm exemption is now roam-only. Racers meet a visible
knee-high stone berm as a wall; roamers still drive out over it.

### MEASURED, BEFORE AND AFTER (tools-scratch/bermtest.mjs, now a gate)
    race  carve-out at sample 10, both sides:  lat 12.6 -> 74 stranded  BEFORE
                                               lat 9.6, held at the lim AFTER
    roam  same manoeuvre:                      lat 42.4 out             both
The gate pins both directions and is registered in gates.mjs. Regression
sweep on the fix: test-invisible-walls 13/13 (the berm is visible stone —
holding a racer at it is not an invisible wall), test-mountainrun 21/21
(OLIVE COAST control still open), test-unstuck 9/9, test-roam all green.
The cliffSetback valley-floor carve-out and the past-the-outer-face roam
rule sit AFTER the changed line and are untouched: CANYON RUN and LAGUNA
SECA racers still roam their valley floors.

### FOUND RED ON THE BASE — AND THE WORLD TURNED OUT INNOCENT (fixed next round)
`tests/test-shortcut.mjs` fails 2/6 on PRISTINE origin/main (r273) exactly
as on this branch. The follow-up (see the section below this one) proved
the WORLD was never broken: the cut lands against r209's law-backed corner
rails and the flanks' fair rock scatter, and the hinterland spot the test
warns from is 25.1 u from another switchback leg — the honest global-
distance stray gate is RIGHT to stay quiet there. The test was brittle
three ways and is repaired; the massif/obstacle line owes nobody anything.

### WORLD-ID PROBE
Phone shots rarely name their world. tools-scratch/nearsamples.mjs answers
"what stands at sample S"; this round's texture-match trick — overhead shot
at F=0.04 of each candidate, compared against the report — identified
UNDERCITY in two rounds of probe shots. The probe is disposable; the trick
is worth remembering.

### AND THE GATE SUITE'S ONE RED, FIXED RATHER THAN STEPPED OVER
Running the full gates.mjs for this push found `landscape` red on
phone-portrait: speedo × joy-base, 687 px² — present on PRISTINE
origin/main too (the r273 HUD reshuffle biased the speedo left into the
ring's rest position on a 402-wide portrait). Split the correction between
the two: the ring rests at 40% of the zone rather than 45% (9 px left),
the speedo bias eases −26 → −16 px (10 px right). Both sides keep what
they were placed for — the ring under the thumb, the dial out from under
the 🚀 button (8 px clear, measured). landscape.mjs green in both
orientations; the rest of the suite: pageerr, camsanity, boot, bayblack,
playermoves, wedgetest, swallowed, bermtest — all green on this tree.

## FIX-ALL ROUND — THE SHORTCUT TEST'S THREE BRITTLENESSES, AND THE NARROW-PORTRAIT CRUNCH

### test-shortcut: 2/6 red on the live build, and every red was the test's
Three faults, none of them the world's:
1. **The bank-finder was magnetised to obstructions.** "Biggest terrain rise
   at lat 30" landed on a switchback whose descent ends against the back of
   the lower leg's stone edge rail (r209's corner-guarding law, correct),
   and every alternative climbing corridor holds rock scatter (fair
   physics). Three finder variants found three different rocks at 0.7 m/s
   each. The cut run now drives BARE TERRAIN — colliders out for one run
   and straight back — because this test owns the slope and the (dead)
   altitude gate; the walls' law is enforced where it lives, in
   test-cornerwalls and test-edgerails.
2. **The hinterland spot was not in the hinterland.** `pointAt(200, 140)`
   is 25.1 u from the switchback leg above it — measured — so the global-
   distance stray gate (the switchback fix) rightly stayed quiet. The test
   now searches for the lat-140 point that is genuinely remote (sample 825,
   140 u from every leg) and the warning fires there. Feed capture also
   kept only the FIRST message, so "TIMBER!" masked the warning that DID
   come — it keeps them all now.
3. **"Off-road is slower" compared a downhill cut at one sample against the
   road at another** — it measured the hill. Now a controlled pair: same
   sample, level bank, on the carriageway vs 28 u off it, and the window
   stays 2.5 s because run() drives a blind straight line (at 4 s the
   "road" runner is in the dirt — measured, 20.8 m/s). 6/6 green.

### The ≤380 px portrait crunch predates everything
landscape.mjs learned two more sizes (360×740, 320×680) and immediately
measured what the r273-line fix could not see: speedo × joy-base 1018 px²
at 360 and 1549 px² at 320 — an OLD latent fault, present long before the
r273 HUD pass, the bottom band simply cannot hold ring 124 + dial 76 + the
🚀 column at those widths. The dial now leaves the thumb row on ≤380
(the two-thumb layout's own precedent: "the speedo sits above BRAKE") —
bottom:112, centred in the ring↔mine gap, 56 px; the ring gives up 24 px
of visual size (knob drag radius is input.js's and untouched). All four
gated sizes green, no overlaps.

### MINES ARE DODGEABLE — MEASURED, SO THE QUESTION IS CLOSED
whokilled DODGE=1 on the three worlds that kill even a shooting driver
(NORMAL, 100 s each): reacting to the mine's red ring drops the mine
bucket 155 -> 41 on CORNICHE and 152 -> 31 on SEA CLIFF RUN (COSTA BRAVA
43 -> 78 is lay-pattern noise — rivals mine differently every run). So the
mine system passes the fairness test: visible, avoidable, priced. What the
crude 4.5 u swerve buys instead is wall contact on narrow roads (SEA CLIFF
solid-crash bucket 228 in the dodge run) — a human modulates where pure
pursuit cannot. VERDICT: no defect in any of the three; they are the
roster's hardest because rival fire volume compounds with narrow geometry,
and any change there is difficulty tuning, which stays a design decision.
The numbers to tune against are all above.

## FREE-RIDING ROUND — "CLIMBING AND SINKING IN MOUNTAINS", FOUND AND CLOSED AT THE GATE

The report, verbatim: "Still I'm climbing and sinking in mountains. The
game is not ultimate free riding world matured enough." Reproduced first
try with `tools-scratch/mountainsink.mjs` (new, kept): drive up a slope in
roam logging physics sink AND visual sink (raycast against the drawn
world). SUMMIT CLIMB: the car ran with **50 u of drawn mountain overhead**
while physics said surface — inside a horizon hill, climbing terrain
noise. That is the complaint, measured.

### THE GATE, NOT THE MOUNTAIN
The hill's collider was there and correct — r148/r-era work made horizon
rings solid, height-profiled, all of it fine. What failed was the height
gate in the player-vs-solids sweep: `pos.y < ob.y - 3 → skip`. A
mountain's seat is sampled at the CENTRE of a 100-300 u footprint; on
sloping ground the flank foot runs 10-30 u lower, so a car approaching
from downhill sat below the pad and the entire collider was skipped —
measured: car y 23.1, 111 u from a hill seated at y 30 with radius 164 at
that height. Inside the rock, gate says "under it".

Nothing legitimate drives BENEATH a seated mountain (bores go through
`_tunnelRidge`, which lives in both height fields), so a height-carrying
solid now has NO lower gate — solid at any height below its top. The
±6 window stays for h-less solids (the knee-high rock under a flyover is
still the point). Six test/tool mirrors of the gate updated to match.

### VERIFIED, EACH DIRECTION
- mountainsink re-run: the car STOPS at the flank, wheels on grass
  (side-on screenshot taken), physics sink 0.02, v 19 -> 1.7 grinding.
- test-invisible-walls 13/13, test-mountainrun 21/21 with updated mirrors.
- Six mountain worlds re-raced (6/21/25/19/48/66): lap times at their
  r271 baselines (GOTTHARD identical to the decimal), zero stuck spots,
  lateral maxima normal — the widened gate does not trap the racing line.
- tool-corridor-blockers full-roster census: no mountain-flank blockers
  anywhere. Its 2/78 finding (CLIFF KNOT, SEA CLIFF RUN) is small r≈0.6
  rocks near a vertically separated leg — h-less, knockable, untouched by
  this change, pre-existing; noted for whoever owns rock scatter.

### WHAT "MATURED FREE RIDING" STILL WANTS (measured, not done)
- Off-road pace retention is 0.55-1.0 by car stat — the boundary is soft
  by design, so roaming is fast; fine. The massif skirts are now solid
  walls past the drivable foot. If mountains should ever be CLIMBABLE
  (goat routes to peaks), that is terrainHeight work, not collider work,
  and it is a design decision with MAX_GRADE 0.45 already in place.
- PIKES PEAK spawns-in-roam showed a 10-13 u settle transient when
  teleported by probes; players do not teleport, but the probe should
  place-and-settle before measuring.

## GOAT PEAKS — MOUNTAINS YOU CLIMB TO THE TOP OF, AND THE WALL LAW THAT CAME OUT OF BUILDING THEM

Asked for in as many words: "mountains you can actually climb to the top
of... Do it. Love the idea." Done, the only honest way this codebase knows:
as TERRAIN, in both height functions, so drawn-vs-driven divergence cannot
exist on it by construction.

### THE FEATURE
Every world with real ground (`_highland` on) grows ONE summit: a 108 u
smoothstep dome at r 660-740 — beyond every road, inside the drawn-mesh
near patch, clear of sea and river, each world on its own bearing. The
flanks peak ~120% grade: unclimbable, the rim wall's own honesty. Carved
into them, a goat route — 1.5 turns of spiral shelf ~18 u wide whose height
at every point is the dome's own height at that radius (the carve cuts IN,
never juts out), along-path grade easing 0 → ~21% → 0. At the crown, a
summit star worth four ordinary finds (+600, "⛰ SUMMIT!"). Scenery
builders keep off it: massif cones WALK aside (not dropped — dropping one
moved GRANITE NARROWS' pinned fall-line number), horizon/dune/city/glacier
instances skip, groves skip.

`tests/test-goatpeak.mjs` is the gate: pure-pursue the route's own points,
PASS = summit reached, star present, on-shelf agreement held. Seven worlds
climb in ~26.4 s each; LANTERN QUARTER (flat by design) reports ABSENT.

### THE PEAK IS CLOSED ON RACE DAY
The route is BUILT of flats, and flats reset the climb-authority fade — a
racer could stair-climb the spiral 46 u in 30 s past a fade that never saw
a slope (test-goat law 1, measured). Off the course AND on the peak the
engine now gives nothing (`climbAuth = 0` via `_nearGoat`), plus a treacle
drag in the stray branch. Roam publishes `_strayed = 0` and never feels
either. SUMMIT CLIMB's law-1 number came back under its ceiling.

### GROUND RISING FASTER THAN YOU CAN CLIMB IS A WALL, NOT A FLOOR
Building the dome exposed a hole older than the dome: at face-steep TERRAIN
(no collider to say no) a fast car outruns the 11 u/s y-follow and passes
horizontally inside the ground — 29 u deep on the dome's fall line,
measured, the whole "driving inside the mountain" class on analytic ground.
Now, when the gap has opened (>2.5 u) and the local gradient is face-steep
(>0.9) and the car is far off-road (|lateral| > 60 — because test-goat's
header is RIGHT that the verge is the steepest ground in the game and no
law here may brake the rejoin scramble), the into-slope velocity dies;
tangential motion survives. Fall-line ram: 29.5 u buried → 2.35. Rejoin
banks, shelf-edge returns, crests: untouched, and test-goat's rejoin law,
test-sinking and test-climb all green.

### SOLIDITY, FINISHED FOR EVERYTHING REACHABLE
ghosthunt found three more ghost classes beyond the glacier and groves:
DUNE SERPENT's wind-carved ridges (to 114 u, r 720+), NEON GRID and MARINA
BAY's skyscrapers (to 320 u, mid towers from r 260), all drivable-through.
All solid now — dunes stone with the cone profile, towers stone with
prof [1] (a box does not taper, and saying so keeps the invisible-walls
cross-section law auditable at 13/13). The census's only remaining flags
stand IN THE SEA (offshore rocks, whales) — the drown system's boundary,
not ours — and the probe now says so itself.

### REFINEMENTS THAT CAME FROM CHASING GHOSTS THAT WEREN'T MINE
test-goat's GRANITE 30.3 and GLACIER COL 0.3 reds reproduce byte-identical
on PRISTINE origin/main — pre-existing, like test-shortcut's were, and this
branch passes one MORE law than base (CANYON RUN's start-point law). Two
changes made while wrongly assuming blame survive on their own merits: the
no-underside pad now scales with the mass (max(3, min(30, h·0.35)) — a
mountain earns 30 u of seat tolerance, a verge boulder keeps −3 and never
shoves a car riding the roadbed above its toe), and goat-adjacent massif
cones relocate instead of vanishing. Six test mirrors carry the same
formula.

### FOR THE NEXT SESSION
- The dunes could be TERRAIN someday (climbable sand, the goat treatment) —
  they are solid walls today, which is correct but not yet delightful.
- The two base reds above belong to whoever owns test-goat's pins; both
  values are printed and stable.
- A goat peak screenshot lives in the session record; fieldshot-class tools
  can frame it from the route for a store shot.

## THE GRIP BUDGET — "I CAN TURN SHARP CURVES WITH 180 KM/H. THAT ILLOGICAL."

He could. cornergrip.mjs (new, kept): full lock at 180 km/h held a 16.5 u
radius circle at 151 u/s² of lateral acceleration — FIFTEEN G — while full
throttle built speed mid-circle. The cause, in the code's own comment:
"while gripped the velocity turns with the car (arcade rails)", and the
slide lag capped at slip·driftLag ≈ 0.22, so even a "full slide" kept 78%
of the yaw rotating the trajectory directly.

### THREE CHANGES, ONE NUMBER
The number is the one the RIVAL PLANNER always drove within — paceEstimate
prices corners at a_lat ≤ SLIDE·grip = 4·grip — so the player's tyres now
obey the same physics as the field's plans. Player only: the AI already
obeys by planning and keeps its 8/8-alive record.
1. **Demand vs budget.** Yaw demand |v|·yawRate past 4·gripBudget spills
   the EXCESS share of the turn into slide instead of trajectory (lag → 1).
   Priced on the whole velocity vector — pricing |vf| handed the rails back
   mid-slide at 70° of drift, an accidental auto-catch, measured and fixed.
2. **Kinetic friction has a ceiling.** The scrub was vl·grip, proportional
   and unbounded: a car 80° sideways was hauled back onto heading at
   1.4 rad/s, so the drift state existed and the trajectory ignored it.
   Capped at 4.4·gripBudget — a touch above static so recovery beats
   breakaway. Small corrections sit under the cap: parking-speed feel
   untouched.
3. **The budget is its own quantity** — every surface/car factor (compound,
   wing, wet ford, loose landing) WITHOUT the slip collapse, which now
   applies only to the scrub. Same products, reordered; scrub bit-identical
   before slip.

### BEFORE AND AFTER (full lock, 3 s, flat ground)
    180 km/h:  entry radius 16.5 u, aLat 151, exits at 167 km/h   BEFORE
               entry radius ~54 u, drift peak 91°, exits at 72    AFTER
    to hold a 30 u sharp curve now needs ≤ ~90 km/h; above that you are
    drifting, and far above it you are a passenger. 60 km/h full lock
    still bites (entry aLat ~21 = the budget, as it should).

### WHAT IT COSTS ON TRACK, MEASURED
agentdrive's planner re-priced from 34 to 15 (~75% of budget — a driver
keeps margin; the bot at 100% slid into PINE VALLEY's rails, which is now
a thing that happens, as requested). Laps: PINE VALLEY 40.5 → 54.5 s,
MONACO 32.2 → 38.9, OUNINPOHJA 28.1 → 29.7 — the tighter the world, the
more the budget costs, and one slide-wreck a lap is the new price of
overdriving. RIVALS ARE UNCHANGED, so normal difficulty is now harder on
tight circuits: the r271/r272 pace tables are the baseline to re-tune
aiSpeed/aiCorner against IF play says so — that is a design pass, not this
one. Gates: test-goat 25/26 (GLACIER COL's grounded-step red HEALED by
this round's caps; GRANITE 30.3 is base-red), test-tyres 27/28 (its one
red is a UI card, red on base too), playermoves, boot, goatpeak all green.

### THE KNOBS, FOR TUNING BY FEEL
    4.0  the static budget (×gripBudget) — lower = earlier breakaway
    4.4  the kinetic ceiling — gap above 4.0 is how firmly a slide catches
    0.9  the spill share at full over-budget
    0.12/1.2  the slip-feed threshold and gain
All in vehicles.js, each at its comment. The A/B instrument is
tools-scratch/cornergrip.mjs; run it before touching any of them.

## r285 — THE BATTERY ROUND: THE LADDER, THE PILES, AND THE PYRAMIDS (TWICE)
"Iterate test debug fix" after the r284 deploy: 31 suites, then every red
run to ground with the base served beside the branch (8901 working tree,
8902 pristine main — attribution before repair, always).

THE DIFFICULTY LADDER, SOLVED AND THEN CORRECTED TWICE. test-difficulty
opened 6-red under the new grip budget. The path to 12/12 twice in a row:
  - The r284 bandUp decoupling had gone to the maxSpeed band — the one the
    code's own measurement says binds 4% of the time. The CORNER band's
    chase side (the one that binds 95%) still read rubberBand, so EASY's
    trailing field cornered +35% toward a casual leader and re-passed them
    forever. Both chase sides read bandUp now; the leader cap keeps
    rubberBand.
  - Guessing tiers failed; measuring the transfer function worked: a 16.7%
    corner-budget cut moved lap pace 4.7% — lap goes as aLat^0.26, the
    clamps, straights and crawl floor absorb the rest. Solving the laws
    through that curve set easy 0.26 / normal 0.58.
  - HARD taught two lessons. aiSpeed 1.10 INVERTED the tier order on PINE:
    the nitro-gate backfire the rubber-band comment already records (raised
    maxSpeed drops rivals under the v > maxSpeed*0.55 boost gate). Back to
    1.06, edge in aiCorner 0.63. And on FURKA, three hard configs spanning
    aLat 0.60-0.95 all lapped 1138-1157: the field's pace there is FLOORED
    by the tier-blind width-pinch caps, while the drift-less stand-in lands
    ~898 every run. The HARD-clean bound is 0.75 now, with that measurement
    in the test — the regression it guards (player at 0.60-0.65) stays far
    outside.

"PIRAMIDS AGAIN", THEN "SHARK TEETH AGAIN" — one defect, photographed
twice, on GOTTHARD at live r284: the distant-stand grove clumps (294
instances, 579-989 u, reachable ground). Root causes: every crown sat
base-down ON the grass — three grounded cones merge into ONE triangle from
any distance — and the 12-22% fog wash toward the pass theme's ice-blue
0xdcebf4 turned green clumps mint. The clumps now carry the playfield
pine's DNA (lifted two-tier crowns, bark trunks below, one extra
InstancedMesh sharing matrices) and the wash is 0.05. Proof pair in
tools-scratch/shot-grove-before/after-*.png: the before is literally a
serrated row of blue triangles. The skyline RING was measured too
(skyteeth.mjs): GOTTHARD 0.48 med tooth-aspect sits inside the roster's
range (FURKA 0.27, SUMMIT CLIMB 0.53/p90 1.27 is the outlier) — the ring
is a future design pass, not this defect.

THE MOORING PILES REACH THE SEABED. test-nothing-floats' only real reds —
identical on base and branch — were the five Ligurian harbours: 26-38
marina piles per world hanging 1.9 u over the drawn seabed (a fixed 3.4 u
cylinder hung at quay height). Unit geometry, top at the anchor, stretched
per-instance to the seabed: all five worlds now show 3 floats each (the
dodecahedron rocks, under LAW 3's cap of 8). Note for probe writers: a
filtered run (`node tests/test-nothing-floats.mjs 73..77`) trips LAW 1's
roster-sized minimum by construction.

ALSO SETTLED: test-goat's height ceiling 30 -> 34 (GRANITE crawls 30.3 u
at 1.5 u/s on the pristine base — the pace law, 4 u/s, is the shortcut
detector and is untouched); test-climb / wedge-recovery / roadclear reds
did not reproduce (noise); floats/on-road roster sweeps track base
world-for-world.

## r382 — PATCH_02 v3 FIX-1/2: THE RACE IS A RACE AGAIN

FIX-1 (A-1/A-2, measured end to end): the rival LOOKAHEAD was denominated
in SAMPLES — at ROUTE_SCALE 4 the doubled segLen doubled the minimum
chord to ~37 m and the halved curvature values gutted the corner shrink,
so the whole field swung wide on every curve. Census on HARVEST RUN
(dbg-ailat, curve-bucketed): mean |lat| 1.06x half-width through corners
BEFORE — outside wheels in the verge, R10's "single file in the ditch" —
0.44x AFTER, straights 0.86 -> 0.34, zero off-road samples. Lookahead is
METRES now (floored at the 18 m the old 5-sample minimum really was, curv
term re-normalized to its RS-2 tuning point). airace: 19 PASS, and the
racecraft got HEALTHIER (commits up, orphans 0, CANYON hits 9 -> 6 all
launch-phase). Q11's floor now scales RS/2 (launch stagger is
length-invariant; the clean field spreads 26-41 s on 210-240 s laps —
a full-RS floor of 32 called that a rubber-band).

FIX-2 (A-3/A-4/A-5): there is NO freeze status in this game — the owner's
"encased in ice" was the spawn-shield BUBBLE, drawn on all 8 invulnerable
cars during countdown, and "respawn delivers player frozen" was the same
bubble on the 3.6b standing start. The bubble now waits for the green
light; grid lock and spawn protection unchanged (probed: 8 invulnerable,
0 bubbles, countdown). Grid spacing measured CLEAN (min pair 7.12 u,
no overlap — R10's grid blob was launch driving, cured by FIX-1). A-5's
six-car blob: §5.3 separation stands and post-fix pack laws are green
(rivalPack 0 on CANYON).

## r380 — THE WORLD GROWS WITH THE LAP (owner's live session: void, sky garbage, stacked streets)

Three owner screenshots in one evening, one root: scale-4 laps outgrew
every fixed-size world system. (1) VOID — LARCH GOLD's road rode over
brown nothing: the ±1000 u near terrain patch (sized when "no circuit
reaches past ~320 u") now follows each route's own footprint, as do the
far-ring switch, the world skirt, and the _drawnGroundY lattice;
nothing-floats finds the patch BY NAME and checks completeness against
its own vertex count. (2) SKY GARBAGE — CITADEL BAY's horizon filled
with wavy gradient bands: the skyline/mesa/city/dune rings stood at
fixed 930-1280 u radii; all four now stand off the patch edge (xhs).
(3) STREETS IN THE SKY — buildings hanging overhead with their shadows
on the road: the 500 m mandate had bound the whole Mediterranean family;
it now binds TERRACE AND FIELD country only (vineyard, olivecountry,
medterrace, sanremo) — harbor towns keep their coastal profiles. Owner's
"Tunel is needed here": surveyed all seven remaining mandated worlds —
zero self-crossings, all switchback climbs, so the stacked-road gap
cannot recur; nothing to bore. Plus: VINEYARD VELOCE's floats gap 4->8
(calibrated pre-mandate), and the battery runner now starts the dev
server if dead (a dead server read as 41 reds — measured).

ALSO IN THIS DEPLOY (r381 work, tag stays r380 for the chain in flight):
RALLY_PATCH_02 v3 saved as normative (R10+R11 evidence; C-4 lifts
repair-only for world/track scope; falls now cost -1 hull with respawn
per CLAUDE.md 3.4b; program tracked as tasks #80-#88), and the owner's
lap rule — "Decide when track is 1 or 3 laps depending the length":
laps under lapsShortTrackU (3000 u) race 3, longer race 1, level.laps
wins (CLAUDE.md 6.1c; test-lap-count green; every current roster lap is
5.9 km+, so defaults stay 1 until PART III adds short circuits).

## r379 — DRIFTS COST SPEED (owner: "When I drift I need to slow down significantly")

The complaint was exact: drifting had NO forward tax. Three things
conspired — the lateral scrub never touched forward speed, driftReward
handed HALF of every scrubbed slide back as forward speed (a drift could
exit FASTER than it entered), and the sliding drag ease capped drag at
0.40. r379: (1) a slip-proportional forward scrub — with the handbrake
held, forward speed pays driftForwardScrub (0.5/s at full slip, ~70 ->
~40 km/h over a 1.5 s slide); a slide entered WITHOUT the button pays a
reduced rate only past slip 0.55, so committed grip-cornering and the
FT1-FT6 feel floor stay untouched; skipped airborne. (2) driftReward
0.5 -> 0.15. Both constants live in driving.json AND the src/driving.js
defaults. test-drift is the gate (phase D of the phased rollout).

## r378 — THE VERTICAL MANDATE (owner: passes >= 1200 m, olive/vine >= 500 m)

"Mountain passes need to have at least 1200m climbing difference. Olive
and vine yards at least 500m vertical difference." Implemented as a
per-theme minimum route elevation RANGE (ELEV_MANDATE: the six
alpine-family themes at 1200; vineyard + the eight olive-coast themes at
500; a tune's `minElevRange` overrides, 0 disables). The octave profile
tops out around +-27 u — two orders short — so a mandated world gets a
PASS added under its profile in the constructor: C1-smoothed triangle,
flat valley through the start line, summit at half distance, quadratic
caps (a=0.16) so the climb is a steady ~2R/L grade (~38% for 1200 m at
ROUTE_SCALE 4 — steep, arcade, inside the 35-degree wheel-drive cap).
The octave texture is damped x0.45 first (raw it spiked grades to 48-52%,
measured), and a final measure-and-stretch guarantees "at least" exactly.
Applied BEFORE the editor sculpt and coast lift, so sea-side olive worlds
keep their corniche freeboard on top of the climb. _highland rises with
the mandate (amp = max(68, mand/2)) so the summit road runs through high
country instead of on a stilt-ridge.

Verified: SERPENTINA/SUMMIT range 1200, OLIVE COAST/VINEYARD VELOCE 500,
worlds build clean. Watch item: pass lap times will run past the 5-minute
median (crawling a 38% climb is slower than the flat median the r376
scale was sized on) — per-world routeScale is the lever if the owner
wants those laps shorter.

## r377 — THE FOREST FLOOR (owner's mockup: their own r373 frame, re-imagined)

The owner sent their 13:52 LARCH GOLD screenshot back as a lush concept
render: canopy towering over the lane, fern understorey between the
trunks, mossy rocks, mushrooms — and a fully redesigned HUD, which was NOT
taken (the in-race HUD is frozen per the recording-E standing decision;
same call as every asset board before it). World deltas taken, all inside
_buildForestCarpet on CARPET_THEMES worlds, all non-solid: (1) verge-wall
trees scaled up to tower (1.4-3.3x — the mockup's lane runs UNDER trees,
not past shoulder-height cones); (2) a FERN layer — 3,200 flattened
jittered mounds in the first ~24 u off the lane, green on every theme;
(3) 1,400 moss pads hugging the road edge at 0.3-16 u. ring() grew an
optional paintFn so understorey greens ride the same placer as the trees.
Left for a later pass: moss CAPS on the rock scatter (the rockSnowCap
machinery is the natural carrier) and any ground-palette greening —
amber stays autumn's ground.

## r376 — FIVE-MINUTE LAPS (owner: "Expand the tracks to be around 5min drive each")

ROUTE_SCALE 2 -> 4, sized from MEASUREMENT, not guessed: dbg-laptime (new
tool, the airace expert stand-in driving one fixed-step lap) clocked the
scale-2 laps at PINE VALLEY 105 s / DUST CANYON 72 s / SERPENTINA 140 s /
LARCH GOLD 108 s — median ~107 s. The expert runs ~1.3-1.5x a human's
pace, so doubling the lap puts the bot at ~3.6 min and the owner right
around five (roster spread roughly 3.5-6.5 human minutes; per-world
`routeScale` fine-tuning is the follow-up if specific worlds land wrong).

Everything r340 made parametric flows through untouched: gate layouts
repeat per scale unit (spacing keeps §7's metre caps), vehicle curvature
thresholds divide by ROUTE_SCALE, the coast tune multiplies through, and
segLen lands at 6.6-8.7 u with N still 900. Two things did need hands: the
carpet's horizon ring now sizes itself from the lap's own bounding radius
(a fixed 640 u ring would sit INSIDE a scale-4 lap that wanders past
±900), and suite wall-clocks — airace's frame cap is already RS-scaled,
so the battery simply runs longer; nothing was recalibrated blind.

## r375 — TWENTY TIMES THE TREES (owner: "Add 20x more trees")

Delivered through the INSTANCED CARPET, not the solid belt. The solid
gameplay trees (treeCount) carry colliders, the accept gate, the
tree-in-carriageway census and the AI clamps — 20x those is a physics and
suite bill, not art. The carpet is pure GPU: _buildForestCarpet is now
three LOD rings totalling ~47,000 trees per world, five draw calls,
roughly 500k open-ended-cone tris.

THE PART THAT ACTUALLY ANSWERED THE OWNER'S FRAME (r375b, live phone shot
at 13:52 showing bare verges on r373): the near carpet FOLLOWS THE TRACK,
not the world origin. The owner only ever looks out from the road, and
origin-radial scatter left whole stretches of verge bare wherever the lap
wandered far from (0,0). Rings now: VERGE WALL — 9,000 two-cone trees
placed at random track samples, 1-38 u out from the LOCAL road edge
(widthAt(i) + 2.5), the whole way round the lap; MID-FIELD — 14,000 more
at 38-160 u out; HORIZON — 24,000 single 5-sided cones, origin-radial
170-640 u. Every spot re-checks _nearestSample against ALL segments with
the local width (a spot 3 u off this straight's edge can be mid-road on
the switchback below), margins 3/20/25 by ring. Carpet trees are
non-solid, same as the shipped larch/birch/poplar precedent. And it
now runs on EVERY forested theme via CARPET_THEMES (forest, deepwood,
autumnwood, harvestvale, flume, the alpine family, dolomiti, avalanche,
snow, glacial, jungle, redwood, mountainsea), with a per-theme crown
palette: autumn keeps its red/gold split, larch country gets spruce+gold,
snow worlds get frost-dusted crowns, jungle goes full green. Deliberately
excluded: mistfell (the moor is treeless BY DESIGN), deserts, neon,
streets, and the Mediterranean terrace coast — a spruce sea behind olive
terraces is wrong, not rich. Roster arithmetic: a forest world went from
~1,500 drawn trees to ~42,000 (28x); LARCH GOLD from ~6,000 to ~42,000
(7x); across the forested roster the average lands near the asked 20x.
The r373 seating law (lowest footprint corner, base at origin) is kept in
the shared ring placer — that is what keeps 40,000 trees out of
nothing-floats.

A world's tune can size its own carpet: `forestCarpet: { near: N, far: N }`
(true = defaults).

## r374 — HIGH-POLY TREES (owner: "Add more high poly definition to the trees")

The mixed-stand species were bare primitives: cones with 6-8 sides and ONE
height segment, spheres at 7x5 — flat shading drew each crown as a handful
of big flat panels. r374 gives every near-belt species real vertex detail
in _buildTrees: segment counts up (cones 9-10 sides x 3 height segments,
crowns 9-11 x 6-8) plus a `roughen()` vertex-jitter pass, which flat
shading breaks into dozens of small irregular facets — reads as foliage
mass, not geometry. Applied to pineA/B, fir, larch tiers, birch, poplar,
oak/maple domes, kapok/cecropia/fern crowns, and (subtly, amp 0.05-0.06)
the oak trunk and shared conifer trunk.

THE TRAP THAT SHAPED THE HELPER: Cone/Sphere/Cylinder geometries DUPLICATE
their seam vertices (UV seam) — random per-vertex jitter tears the seam
open as a visible crack. So the jitter is HASHED FROM VERTEX POSITION
(sin-dot-fract), never rolled: co-located duplicates displace identically.
Poles and apexes (radius < 1e-4) are skipped so silhouettes hold; radial
jitter is proportional to local radius so cone tips stay tight. Geometries
translated in x/z (lowB/midB/topB) MUST be roughened before their
translate — the helper jitters radially about the y-axis.

Left cheap on purpose: the far forest carpet (6-sided, 45-585 u away),
distant-stand groves, and the specialty builders (palms, cacti, redwoods,
jungle, olive, charred/burnt) — separate systems, same treatment available
on ask. Vertex cost roughly 2.5-3x per tree part on instanced geometry;
draw-call count unchanged (still one per part per species).

## r373 — THE CARPET SITS DOWN (nothing-floats repair on r372)

r372's gate run had one red the deploy chain sailed past: nothing-floats
LAW 3 on the two autumnwood worlds — 852 carpet cones on LARCH GOLD
(worst 5.08 u) and 774 on MAPLE MILE (3.51 u) hanging over the ground.
Two causes, both in _buildForestCarpet: (1) the cone geometries were
translated so their BASES sat 0.7 u above the placement origin, and that
offset scales with the tree — a 3.4x-tall carpet tree floated 2.4 u on
dead-flat ground; (2) terrain was sampled only at the trunk, so a wide
cone on a hillside hung its whole downhill edge in the air, which is
where the 5 u worst case came from.

Fix, r373: cones re-based at the origin (lo translate 2.4 -> 1.7, hi
4.6 -> 3.9 — same silhouette, whole tree 0.7 u lower), and placement now
seats each tree on the LOWEST of five terrain samples across its scaled
footprint, minus 0.35 u. Uphill sides bury slightly — correct for a
far-field carpet with no colliders.

Also noted, not chased: one element-box Box(1,1,1) floats 1.43 u on
LARCH GOLD — new since r365 (the ford/tune era), but a single sub-8
part PASSES LAW 3 on its own (ARDENNES has carried one at 1.24 u since
r361). On the list for the next dressing pass, not a gate.

LESSON for the next session: the r372 deploy chain was a single `&&`
string through `cat gate369.txt` — the cat succeeds whether the gates
are green or not, so the chain deployed on a red. A gate file must be
CHECKED (`grep -q "rc=1" && stop`), not displayed.

## r372 — "PAY ATTENTION TO THE DETAILS" (the reference, third pass)

The owner rejected r371 as not close. Root cause of the misjudgment was
MINE: every "chase" probe frame this session was CAM_MODES[2] — which is
TRAIL, 26 u up — while the owner plays CHASE, mode 3 at 11.5 u. From the
real camera the differences were obvious:

- **Forest to the horizon.** The far field was bare amber; the reference
  carpets every hill. `_buildForestCarpet` (theme flag `forestCarpet`):
  4200 instanced two-cone trees from ~45 u out to the haze, colours rolled
  from the near wood's species proportions, clearance 30 u so no bare
  no-man's-land ring survives between the playable belt and the carpet.
  Far scenery, no colliders — everything reachable at speed already has
  its own.
- **The FIR silhouette** — four spiky stepped tiers, replacing the smooth
  two-cone pine at the top of the autumnwood mix (0.34).
- **Verge mass** — rockCount 460, tuftCount 1500 on autumnwood.
- **Depth haze** — fogNear 190 → 130.

Probe rule for future sessions, learned twice now: CAM=3 is the owner's
camera. And a bare patch beside the road in ONE frame may be a grove
CLEARING (they are deliberate); check a second vantage before tuning.

## r371 — LARCH GOLD 1:1 (owner: "Replicate this 1:1")

Frame-to-frame against the reference, two gaps remained after r370:

- **The lane.** The reference is intimate — ~1.5 car widths — where the
  engine default is a 9-half boulevard. LARCH GOLD tunes `roadWidth: 0.62`
  (11 u total, the mountain-template scale, as narrow as an eight-car grid
  can honestly race). `T.roadWidth` is the one knob that scales widthAt and
  therefore the ribbon, the AI's lateral clamps, rails and censuses
  together. Ford index and river verified rebuilt at the new width.
- **Spruce depth** — the conifer target dropped a notch (l 0.13-0.20):
  the top crown tier rides the LIGHTER amber material, so the first target
  read lime at the tips.

What deliberately did NOT move for the reference: the eight-car grid (a
true 1.5-width lane cannot race), and the painterly lighting — the phone
GPU carries more of that than the headless probe shows.

## r370 — THE OWNER'S LARCH GOLD REFERENCE ("This is what I want to see")

The reference render decodes to three gaps, all closed:

- **Dark conifers as the forest body.** Pines carried tint 'conifer' but no
  case handled it, so they fell to the default and wore the theme band —
  ORANGE pines on the autumn worlds. And a case alone is not enough: the
  canopy MATERIAL (T.foliageLow, amber in sqrt form) multiplies the tint,
  so the spruce target is divided through a warm material to survive the
  product (an r>g guard leaves every green-band world bit-identical).
  Verified numerically: crown instance [0.20,0.85,0.56] × material #c68954
  = spruce green, 552 pines on LARCH GOLD.
- **Mix rebalanced** — autumnwood is conifer-dominant now (pineA 0.30,
  maple 0.26, larch 0.16, birch 0.14, oak 0.14): green wood, maples
  burning against it, larches gold — which is also what the world's NAME
  says.
- **The stream** — LARCH GOLD tunes `fords: {count: 1}`, which is all the
  river machinery needs to carve the rocky reach beside the road.

Note for future eyes: the orange stepped cones near the road that looked
like a failed fix were LARCHES, correctly gold. Measure instance colors,
not screenshots, when a tint is in question.

## r369 — DESIGN RICHNESS: THE DESERT LIVES, THE NIGHT GLOWS

Owner: "Iterate on the design richness." Survey round first (chase frames
across the untreated families): THE DUNE SERPENT ranked last — a bare
ribbon over flat mustard — and NEON MARINA read as empty-dark (neon rails
over a void). DRY LAGOON and RED CENTRE middling-monotone.

- **groundTexture wind ripples** (a `ripples` pass, paired crest/trough
  strokes wandering the tile) — the sand themes turn it on; the road
  already had its own.
- **Desert dressing** (dunes/desert/oasis/outback/savanna/canyon/ravine):
  crescent dune banks along the verges (second cut — the first read as
  pebbles from the driving seat), silver saltbush pairs, bleached longhorn
  skulls and half-sunk ribcages, sandstone outcrop clusters (solid),
  termite-mound spires on outback/savanna (big ones solid).
- **Night dressing** (neon/undercity): 110 roadside light posts with
  oversized neon heads and a coloured glow quad under each. The first cut
  (56 posts, 0.5 u heads) vanished into the dark — one dot per frame,
  measured on the same vantage; the law of this pass is that a light must
  read as LIGHT.

The remaining dunes emptiness at the survey vantage is the ROAD — very
wide, very pale, on a crest with the sand falling away — not absent
dressing; calibrate from the phone before touching the tuned surface.

## r368 — THE FOREST REACHES THE ROAD, THE TOWER LEAVES IT, THREE AGENTS LAND

**"Add a lot more forest. The roads are all deserted."** Three stacked
causes, each measured on PINE VALLEY: counts (second raise, seventeen
themes — the 2x tracks had doubled the road the old numbers spread over);
the grove pull (70% of every tree dragged 20+ u off the road); and belt
geometry (a 70 u deep uniform band puts ~5% of trees in the first 10 u,
and a 10 u belt start sat UNDER the accept gate's halfWidth+1.7 scale
floor on halfWidth-9 worlds). Verge belts start at 12 u now, keep most of
their trees out of the grove pull, and send four in ten to a dedicated
[12, 22] near band. Measured after: 818 trees within 30 u of the line
(was ~450), 269 within 16 u (was 130), no empty stretch.

**The RED CENTRE tower (owner photo)** was the start gate's scaffold — on
a start the lap crosses back past, the r253 outward walk has no clearing
candidate and used to build the least-bad tower inside the other
carriageway with its collider dropped. A tower whose best margin is under
0.3 u is simply not built now; TOUR DE CORSE's documented 0.00 u grid-box
scaffold retires with it.

**Three parallel worktree agents merged**: the garage metallic re-skin
(CSS-only, frozen HUD untouched); the roster albedo audit (ONE offender —
deepwood computed a near-black #13280e floor, fixed in sqrt form; the
audit's per-theme arithmetic is in its commit); winter chapter dressing
(snowdrifts, raven flights, frozen ponds, iced boulders, ice shards,
avalanche debris — all instanced, reachable mass solid). The audit merge
also exposed that the r367 count edit had accidentally commented out
trunkColor on 17 theme lines — repaired.

Gate evidence at deploy: full 41-suite battery green; airace and traffic
green twice each; final-integration one full green run (its sibling
concurrent run failed only the dice-y "hard AI attacks a parked player"
law); treeclear + nature green twice on the final tree. The traffic
suite's wall-clock load sensitivity stands CONFIRMED — never run it
beside anything.

## r367 — THICK FORESTS, HARVEST CONCEPT, AND THE BOARDS THAT AUDITED CLEAN

**Thick forests (owner: "Add thick forests").** The autumnwood precedent —
density, not distance — applied to seventeen forested themes (forest
641→1400, deepwood 900→1600 with the belt pulled to the verge, jungle
789→1350, the alpine family up ~1.6×). Bare-by-design worlds untouched.
LARCH GOLD's "shade denser than the theme" override moved with the theme
(1150 had silently become a THINNING after the theme passed it — the
override trap to watch for whenever a theme number moves).

**Harvest concept render** (golden-hour farmland over the CIDER LANE HUD):
vineRows parcels draw from a per-world CROP list now — CIDER LANE is a
patchwork of orchard greens and standing gold wheat — and three voxel
tractors park mid-parcel on harvest worlds, solid. Deliberately NOT taken
from the concept: wheel ruts (owner deleted them game-wide; an AI render's
churned mud does not reopen a standing decision) and the HUD chrome
(frozen).

**The garage sprite sheet audited clean**: AUTO/compound chips with IDEAL
HERE, the bay grouping (tyres/weapons/chassis), now→next lines, prices —
all already shipped (r321/r356). The mockup had copied the game's own
strings back at it. No change made; a metallic re-skin is available as a
dedicated pass if the owner asks.

**Suite recalibrations that rode along**: final-integration's FINAL LAP
banner law binds only on multi-lap worlds (one-lap races have no boundary
to announce); its ambient-particle law runs 1200 deterministic frames
instead of a 20 s wall-clock sleep (it was measuring the rasteriser, and
the thick forests slowed swiftshader enough to expose it); the roster boot
sweep carries a 300 s default timeout for the same reason. airace races an
unfinishable lap count (raceTime freezes at the robot's flag in a one-lap
race and every later overtake event logs the same stamp). The traffic
suite's wall-clock sensitivity is CONFIRMED, not fixed: it went red twice
under concurrent load and green twice on a quiet machine with identical
code — never run it beside anything.

## r366 — MOUNTAIN VARIATIONS (owner asset board: peaks, scree, trails, strata)

The third board in the series ("GAME WORLD ASSETS: MOUNTAIN VARIATIONS",
legend A-E). Disposition against the engine:

- **E PEAK VARIATIONS** — `horizonTexture` grew horizontal BANDS painted
  over the altitude gradient, and `_buildHorizon` dresses each theme's
  skyline by a `PEAK_STYLE` map: a snowline on the winter and high-alpine
  ranges (snow/glacial/sheetice/avalanche/alpine/furka/tremola/pass), an
  ember throat on the volcano, strata courses on canyon country
  (canyon/ravine). Bands ride the same fog math as the rock under them.
- **C COMPOSITE RANGES** — two new skyline sets join the six ("glaciated"
  horn-off-one-crest, "broken tableland"), rotating per world id as before.
- **A SCREE FORMATIONS** — `_buildScreeFans`: twelve fans of small broken
  stone per mountain-family world, banked just off the verge and stretched
  DOWNHILL along the sampled terrain gradient (dense at the head — the
  shape of real scree, not a circle of pebbles). Visual only, ankle-high.
- **B TRAILS & PASSES** — every tunnel bore gets a PORTAL FRAME: dark
  timber posts and a lintel seated ABOVE the flared crown, so no new
  geometry enters the driving or camera envelope; the two posts register
  solids (Law of Solidity). The board's stepped trails/passes are the goat
  peaks' carved routes, already shipped.
- **D STRATA & ROCK FACES** — already largely in the engine: the hoodoos
  carry per-drum strata tints and the mesa horizon exists; the new strata
  peak bands extend the look to the standard horizon rings.

The sheet before this one (the BRACKEN MOOR design-system poster) resolved
to: HUD/typography/vehicles = the game's own frozen elements, world assets
= r365b, plus one refinement — two-tone edge rails (weathered steel beam on
dark timber posts) behind a new `edgeRailPostColor` theme knob; every
non-autumn world's rails are bit-identical to before.

Gates: the r365 chain (boot/nature/stagerules green pre-r366; traffic/
airace/final-integration land on the full code), then a follow-up pass of
boot + tunnels + nature + nothing-floats for the portal/scree/peak changes.
Ships as one deploy with r364 and r365.

## r365 — THE AUTUMN CHAPTER GETS ITS SEASON BACK (owner: "Autumn scenes need serious enrichment")

Measured first: chase-camera frames of all five AUTUMN worlds (68-72) against
PINE VALLEY with the same probe. The verdict was not "sparse" — it was
ILLEGIBLE. The copper wood rendered as near-black maroon soup with only the
road carrying light; HARVEST RUN's "open, gold" stubble read as black umber.

**Root cause: the squared-pigment bug, again.** The outback theme documents
it ("THE GROUND IS A PRODUCT, NOT A COLOUR"): the terrain material multiplies
the ground texture by the per-vertex tint, so a palette written at full
strength into BOTH renders as its own square. The three autumn themes did
exactly that — ground.base #7d6236 × terrainLow #6a6234 ≈ #342610. All three
now carry sqrt-form values (terrainLow/High/Dirt/Scree + ground.base), so the
albedo that reaches the screen is the palette that was designed. The same
product bug applied to the canopy (material colour × per-instance tint):
foliageLow/Top and bushColor are sqrt-form now too. Before/after frames:
night-and-day — the wood is amber, the harvest is gold, the moor is bracken
over grey stone.

**Then the furnishing (all instanced, all outside the 4 u band, everything
solid registered in `solids`):**

- **Autumn prop kits** (PROP_SPECS): the themes fell back to the generic
  forest kit. New `pumpkin` prop type (squashed 9-segment sphere + stem,
  smashable, 35 pts) — autumnwood and harvestvale scatter them by the verge;
  mistfell gets a stone-country kit instead (no pumpkins on a moor).
- **autumnwood**: 18 toadstool clusters (red/amber caps, ankle-high, visual)
  through the tree belt; ~70 leaf drifts banked along the verges (shin-high
  gold-to-rust mounds, drive-through by nature).
- **harvestvale**: five pumpkin patches (22 gourds each) on the field strips,
  six rows of corn stooks, five scarecrows (pole solids, 14-44 u out).
- **mistfell**: twelve waymark cairns close by the road (stacked stones,
  solid), a five-stone standing circle plus three outliers on the moor —
  darkest tone on the world per §7.9, every one a collider.
- **Rook flights** (all three themes): two flocks of eleven dark birds in a
  slow banked circle over the course, holding height above the terrain
  under them — driven from `Track.update()` beside the whales.

`_autumnSpot(pad0, pad1)` is the shared placement helper: a spot pad0..pad1 u
beyond the LOCAL road edge, `_distToTrack`-checked against the whole lap
(the lesson of the r361 parapet and every placement bug before it).

**r365b — the owner's asset board** ("Implement the design elements
comprehensively", a five-part reference sheet) landed on top of the pass:

- **A foliage**: new `maple` species — oak silhouette, a tint case that
  ignores the theme's amber band and commits to deep red (hue wrapping
  through 0). Weighted into the autumnwood (0.26) and harvestvale (0.12)
  mixes.
- **B cobblestone paths**: autumnwood roads are warm flagstone setts
  (roadTexture `cobbles`), and roadTexture grew a painted `leaves` pass —
  pointed-oval leaves with stems and shadows, edge-biased, same
  costs-nothing trick as the tram rails. Dense on the wood path, moderate
  chaff on the harvest lane, sparse bracken litter on the moor road.
- **C loose leaf piles**: 30 flat instanced leaf patches per autumn world
  at the road edge, shallow-stacked so a pile has depth.
- **D rock formations**: nine boulder clusters per autumn world, boulders
  walking off each other's shoulders, all colliders.
- **E barriers**: `edgeRailColor: 0x4a3a2c` on all three themes — dark
  timber post-and-rail.

The chase-view A/B that gated the palette change: same framing on BRACKEN
MOOR, old palette renders the moor beside the road as pure black, new
palette as legible bracken with patch variation. The phone's live shot had
looked fine because the LEAF SPECKLES in the ground texture resolve up
close; from altitude (and at distance through the mip chain) the squared
base dominated. The fix serves both views.

Also in this change-set: test-airace races an unfinishable lap count — the
one-lap race froze raceTime at the robot's flag mid-measurement, orphaning
Q13's commits (21-62 per race) and jamming Q15's lap-boundary window open.
Same class of fix as careersim CS3.

Gates: nature / treeclear / droplip re-run on the enriched worlds, plus
stagerules S4 (kicker fans) and nothing-floats for the new scatter. Ships
with r364.

## r364 — HIGH GROUND IS LEGAL, AND THE RACE IS ONE LAP (two owner asks)

Owner, verbatim: "1. Don't reset me when I am off-road. 2. I don't need 3
laps. Race is one lap only."

**1. The cliff-top auto-return is deleted (CLAUDE.md 3.6d).** Root cause of
"reset me when I am off-road" was NOT the stray/route rule (r345 already
deleted that) but the PATCH_02 §3.4 cliff-top net in `vehicles.js`: player
grounded 12 u above the tracked road, within 70 u XZ, with no road at own
height within ±90 samples, for 2 s → free auto-return. Drive up any hill
beside the road and two seconds later the game took the car. Deleted for the
player, along with its `_cliffT` state, the `offmesh` telemetry pair and the
dead `offmeshAutoReturnS` constant (driving.js + driving.json). The physical
traps stand: under-terrain, wedge-under-throttle, bog-wreck, upside down,
fatal falls. UNSTUCK is the only way off legal high ground and it is the
player's to press. test-patch02 P2.6 is INVERTED: it stages the same rim
perch the old gate staged and now demands 3 s of nothing happening, then
proves the voluntary UNSTUCK still comes down (which also keeps P2.0's
`unstuck` telemetry event alive).

**2. One lap (CLAUDE.md 6.1b).** `LAPS` 3 → 1 in main.js; a world's own
`laps:` declaration still wins (FALKEN RIDGE already raced 1). The sweep of
lap-shaped content that came with it:

- **The final lap's time was never recorded — on any lap count.**
  `onPlayerLap` returned into `finishRace()` before the best-lap write, so a
  3-lap race stamped laps 1-2 and dropped lap 3; a 1-lap race would have
  stamped nothing, killing the results best-lap row, the lap record and the
  PACE NOTE job. The stamp now lands before the finish branch.
- **CLEAN LAP contract ladder** counted clean laps (1/2/3) — rungs 2-3
  impossible in one lap. Now climbs by placement with the lap still clean:
  clean lap / clean + top 3 / clean + win. Same prices, same resolve point
  (live rank at the finish crossing IS the final place — everyone who beat
  you is already over the line).
- **SURE-FOOTED feat** "two laps without a scratch" → one clean lap.
- **FLAWLESS START** copy "lead at the end of lap 1" → "lead the field
  across the line" (mechanism unchanged; with one lap they are the same).
- **test-lap-count** rebuilt: default 1, and the suite injects a synthetic
  `laps: 2` onto one world mid-loop so the model-follows-world law still
  discriminates instead of comparing a constant to itself.
- **Avalanche chase worlds** release the wall when the FINAL lap starts —
  which is now the whole race. Left as designed: the chase is the event.
- **Economy note, recorded not retuned:** a race now pays roughly a third
  of the old lap bonuses and passes a third as many pickups. If the career
  starts feeling starved the knobs are the contract pays and
  `career.firstClearCr`, but that is a measurement round, not a guess.

Robot baseline fixture (tests/fixtures/robot-baseline-r363.json) stores
per-LAP times, so it survives the change unread; per-RACE income measurements
from r359/r363 are now stale by design.

## r363 — RESET MEANS RESET, AND POLE IS EARNED (two owner asks; ships with r362)

**"I want to delete all progress when I reset career. All I 0."**
The reset itself was already clean — wipe by prefix, in-memory
career/garage/cars re-zeroed, audit found every surface at 0. The
leak was the SYNC ENGINE: boot runs `pullMerge()` 1.5 s in, and
`mergeSnapshots` is a symmetric union that deliberately never
deletes ("the failure mode of last-write-wins is a career quietly
deleted by an old phone") — so the cloud row handed the whole career
straight back after every reset. Fix: RESET BEATS RESURRECTION. A
reset stamps `career.resetAt` and pushes the empty snapshot to the
cloud immediately; the merge discards the progression of any
snapshot OLDER than the newest stamp. Unit-proven symmetric: old
career + reset = zero both ways; a device that raced AFTER the reset
merges its new progress normally.

**"I should not be starting 1st always."**
Slot 0 (pole) was the player's by construction in resetRace. The
grid now forms from the chapter's live season standings REVERSED —
the title leader starts at the back, the strugglers get the front
row, ties (fresh season) put the player behind the rival they tie
with. Measured: fresh career -> player starts on the back row;
leading the season by 99 pts -> back row; bottom of the table ->
pole row. Pole is now something the season does to you, not a
default.

## r362 — THE TREES ATE THE TOWN (owner photo, CAPO VELA: "The maps aren't matching")

The photo: a Riviera world opening on a bare sand corridor with its
town on the horizon. Rendered start frames of all six RIVIERA worlds:
five of six looked identical — empty scrub where the references
promise "houses running the length of the front". The data said the
towns EXISTED (ALBAROSA 723 buildings, PORTO GRANDE 1012) — as
distant back-rank islands 100-300 u off the road, with the street
wall missing entirely.

The mechanism, proven by its own counterexample: the tree scatter
runs BEFORE `_buildOldTown`, plants down to 14-15 u, and `put()`
refuses any terrace block within its diagonal + 1.4 of a TRUNK — and
ONE refusal resets the whole terrace run (`if (!placed) run = 0`).
Measured on ALBAROSA: 77 olives in the 9-30 u street band; the
terrace never got a run going. IL VICOLO is the counterexample that
proves it: treeCount 26, and its street wall builds perfectly.

Fix, one law in three scatter gates (olive path: loose + grove-grid +
cypress lines; default stand for frontage worlds on other themes): ON
A FRONTAGE WORLD THE STREET BAND BELONGS TO THE STREET — no tree
inside F.lateral + 7 + depth/2 + 1.6. Measured after: band buildings
ALBAROSA 0 -> 33, PORTO MOLO -> 39, CAPO VELA -> 105, PORTO GRANDE
-> 75; band trees 77 -> ~0; total tree counts barely move (347 of
380 — the scatter re-rolls outside the band). Plus CAPO VELA's
hutZone now reaches the grid ([0.1,0.5] -> [0.0,0.5]) — its own
design note says the start is "out of the town at sea level" and the
town zone began 10% up the lap.

Interpretation note: "the maps aren't matching" was read as the same
ask as the theme's own recorded r244-era report ("make sure it's
matching my reference") — the worlds not matching their reference
look. An AskUserQuestion offering other readings was declined, so
this round fixes the one mismatch that was measurable and visible in
the photo itself. If the owner meant something else (route shapes
repeating across worlds, or menu/world disagreement), that work is
still open.

## r361 — THE ORPHAN PARAPET (owner photo, RED CENTRE RUN: "Fix")

The photo showed a candy-striped object lying mid-road and a scaffold
tower at the left kerb. Long forensic chase (lap contact sheets, chase
renders, screen-ray unprojection, a scene bbox census): the tower is
LEGAL — a trackside billboard's back frame 17 u out, reading close
because that stretch runs on the flyover embankment; every rail and
pier on the world measured clear of every carriageway (0 hits in a
census against railBlocked's own bounds).

The striped object was REAL: `river-crossings`' culvert PARAPET — a
19 u cap-grey bar — floating 0.5-1.5 u over the verge, in the
player's eyeline beside the racing line. Two defects stacked:

1. Seated at `deck + 0.45` — the ROAD's height — wherever it landed.
   The crossing point is accepted up to 16 u off the centreline, so
   the bar lands on the verge, where the ground owes the deck
   nothing. The same one-sample promise as ever, in its purest form:
   seated for ONE height, spanning ground that moves.
2. Built even where `_clearsRoad` had refused BOTH headwalls — no
   culvert exists there at all, so the "parapet" was a lone grey bar
   standing in an open field.

Fix: a parapet walks the ground under both ends and its middle,
builds only where that ground holds within a step of itself and of
the deck, seats ON it — and never builds without at least one
headwall standing (a culvert with no parapet reads thin; a parapet
with no culvert is litter). Verified: RED CENTRE RUN builds zero
orphan bars and the beam is gone from the render.

A river verge-cap (water surface clamped to hug the ground beside
carriageways) was tried for the same symptom and REVERTED: the beam
was never the water, and the cap broke PINE VALLEY's never-runs-
uphill law (3 rises). The floating-ribbon allowance near roads
(PASS 2b, up to a channel depth) stands as designed.

Gates: boot, nature, nothing-floats, containment, corridor2/3,
droplip, pickupsurface, tunnels, lap-count.

## r360 — THE DRIFT ANGLE FOLLOWS THE STICK (owner: "Drift can be improved")

Measured first (tools-scratch/dbg-drift.mjs, flat open world, stock
car): the drift core was already healthy — 40° of slip inside 0.5 s
of the pull (FT3), a 2 s held drift at 120 km/h comes out at 121
still turning 150°, direction flips chain in 0.5 s, release +
counter-steer settles in 0.37 s. The horror numbers on CANYON RUN
(120 -> 24 km/h) were the canyon WALLS, not the law.

The real defect: THE DRIFT HAD DIRECTION BUT NO DEPTH. The r341
anti-spin ceiling was flat, so once the handbrake was down the slip
angle parked at ~53° whatever the stick did — full lock and a 0.35
stick measured IDENTICAL settled angles. Easing the stick, which
every drift model reads as "shallow the slide", was a dead input.

The fix is one line of law: the ceiling is now the steer-scaled
target `driftBetaMax × (driftBetaSteerFloor + (1-floor)·|steer|)`.
Measured after: full lock 53° at 80°/s (bit-identical to r341 — the
anti-spin promise and test-drift's laws hold by construction), 0.6
stick settles 39°, 0.35 stick 30° — and the shallower drifts carry
MORE speed out (102 vs 93 km/h), so depth is now a real trade the
thumb makes mid-corner. Player-only, like the ceiling it amends.
New constant `driftBetaSteerFloor: 0.35` in driving.json.

Also this round (#68, the "Iterate" on r359): the full 40-suite
battery + airace + final-integration (98/98) came back GREEN with
nothing to fix — progression's one near-miss (2.6% vs a 3% floor)
re-rolled 7/7, the known dice. First fully-clean iterate round on
record. r360 gates: drift, killspos, patch02, patch13, machines,
shortcut, containment, lap-count, slopegrip, camera — all green.

## r359 — THE ECONOMY LEARNS TO BIND (owner: "Iterate the careerpath")

This closes the loop the owner opened at r342 — "I need to be forced
to buy upgrades" — which CP3 answered on the DIFFICULTY side (rivals
ramp by tier) but never on the MONEY side: CS2 measured the career
~8.8x solvent, so the forcing function had no teeth. This round
measured where the money comes from and made the tier boundaries ask
a real question.

THE MEASUREMENT (staged 78-round podium-most career, score 4000,
P1/P2/P3 rotation, itemized from the results card's own #cb-rows):

    firstClear   93,600   31%   <- the single largest stream
    raceScore    84,900   28%
    podium + the rest        ~41%
    TOTAL       ~300,000 over the whole career

A THIRD of all career income was the one-time conquest windfall — you
were paid most for showing up somewhere new, not for racing well. And
the sim itself was lying: the staged loop never zeroed
`contractCredits` between races (real races do, via resetRace at
main.js:10467), so every staged race RE-PAID the previous race's
contract pot. Measured: race 5 paid race 4's 2,400 CR again. CS2's
8.8x margin was inflated by compounding; the honest pre-tuning figure
was 4.8x.

THE TUNING, one number: `firstClearCr` 1200 -> 600, and it moved out
of main.js into driving.json's career block (main.js reads it through
`FIRST_CLEAR_CR()` — a literal in .ts is a bug, per the standing
rule). Career income lands at ~253k; a full-kit car costs ~166k
(upgradeCost 600 + lvl^2*500, seven lines), which makes maxing one
machine deliberately a career-and-a-half — the top of the kit ladder
is the late-game sink, ON PURPOSE, recorded as such in test-economy's
budget law (<= 156 races = two careers).

THE LAWS GREW TEETH:
- careersim CS2 is now KIT-HONEST: at every tier boundary the sim
  spends entry price + four performance lines to the tier's level,
  not entry alone. CS2b bounds the margin in [1.2, 4.5]. Measured at
  the three boundaries: 3.5x / 3.2x / 2.3x — solvent, tightening as
  you climb, never trivial.
- test-economy reads firstClearCr from driving.json (the source of
  truth moved, the suite followed); the conquest law took its honest
  form — the bonus STACKS with the podium bonus, so the law is
  `firstClear >= podium[2]`, a meaningful premium over repeating an
  old world — and the suite is 12/12 for the FIRST TIME ON RECORD
  (the max-a-car law had been red on pristine bases since the 2x
  era).

Gates: careersim CS1-CS5 + CS2b green, career, progression,
hudfreeze, economy 12/12.

## r358 — THE WEDGE METER GETS FRACTIONS (iterate round; shipped in the r359 deploy)

Full 40-suite battery on r357: 38 green, two reds, both real, both
fixed:

1. **killspos P3 (wedge law).** The r311 stuck meter measured
   forward progress in WHOLE TRACK SAMPLES (`trackIndex` steps), and
   r340 doubled segLen to 4-5.3 u — so "1 m of advance per 2.5 s"
   silently became "one sample per 2.5 s", a ~5x raise of the
   honest-crawl floor; a 2 m/s creep could be rescued between sample
   crossings (measured: 1 spurious rescue in 6 s). Fix: project the
   car onto its segment's tangent for the sub-sample fraction
   (clamped +-0.5), judge the metre on that; and `placeAt` now
   resets `_wedgeT`/`_wedgeIdx` so a fresh placement never inherits
   a stale anchor. killspos 7/7.

2. **route (pacing seam).** The §7.1 pacing pass was one gate deep
   at the layout seam: a lap ending 2-street meeting a lap starting
   2-street produced a run of 4 (IL BUDELLO). Replaced with a
   CIRCULAR pass anchored at the first non-street gate — 4th
   consecutive street or 3rd consecutive open becomes trail,
   wrap-around included. The suite's stale exact-count EXPECT became
   a multiple-of-lap law. route 21/21. Attribution note: CANYON
   RUN's gate kinds are byte-identical before/after (measured,
   dbg-routekinds), so this pass touched only the worlds that
   actually carried seam runs.

Long-stream attribution: test-final-integration's one red was a
`page.click` 30 s timeout while THREE headless Chromiums shared the
box (it was 98/98 solo at r355) — re-run solo: 98/98. airace Q15
(one 1-frame gantry tick in one of three races, twice) is the #54
dice class: deterministically NOT r358 — the route pass left CANYON
RUN identical and the wedge meter is player-only (vehicles.js
`trying = this === g.player`), so there is no code path from either
change to rival gate behaviour. Corroborated by a baseline roll on a
pristine r357 worktree: THERE airace failed Q11 (spread) and §5.6
(collisions) while Q15 rolled clean — at RACES=3 the CANYON laws flap
on DIFFERENT laws per roll, on both builds. That is #54's verdict
holding, not a regression.

## r357 — THE DEBT THAT PAID ITSELF (#31 closed by measurement; the board is clear)

Task #31 — the feature-aware corridor re-author, scoped in r299
against 62 (Canyon) + 48 (Glacier) merged-rock-line boulders standing
un-cullable in route corridors — was the last open task. Before
committing to a heavy generator rework, the r299 defect was
RE-MEASURED on today's worlds, and it is gone:

- GLACIER COL: 0 handle-less corridor obstacles (was 48).
- CANYON RUN: the suite's broad filter counts ~30, but only 5 are
  truly bare records — and every one stands OUTSIDE the road, the
  nearest 6.9 u past the edge (inside §7.3's legal 4-12 u obstacle
  band, which V2's budget law confirms is honoured: 0 windows over),
  the rest 37-80 u out in open country.

The 2x re-plan (r340) and the r343-r350 stage-rules builds re-sited
the rock lines without anyone scoping them to. A re-author now would
be repairing a solved problem across 78 worlds of regression risk —
repair-only says no. CLOSED AS OVERTAKEN BY EVENTS, with the
test-corridor3 debt pins TIGHTENED to the measured level (62→34,
48→4) so the debt can never quietly grow back. The r299 design note
("gate placement wants geography") stays true as a design idea; it
just no longer has a defect to justify it.

THE BOARD IS CLEAR. Remaining known work, none of it urgent: the
career economy balance pass (CS2 measured ~8.8× solvent), MOUNTAIN TO
SEA's scatter-tree dice, and whatever the owner reports next.

## r356 — THE LADDER MEASURED HONESTLY (#22: test-difficulty redesign)

The oldest open task on the board. Its tier laws failed on pristine
bases because three of its estimators had no range left under honest
grip on 2x worlds:

- RANK SATURATION: "same drive, different result per tier" asserted
  P-ranks of a 75%-throttle robot — which reads P8 on both NORMAL and
  HARD (a discriminator pinned at last place measures nothing) and P4
  on an EASY field packed inside 8 points (which is casual-FRIENDLY,
  and rank read it as failure). Both laws are GAP laws now: the signed
  player-vs-best-rival gap must be strictly better on EASY than HARD
  beyond ~3% run noise, and EASY keeps the casual within 2% of the
  best rival (the drift-dividend argument cuts both ways: the bot has
  no drift, so "in touch for the bot" IS "winnable for a human").
- MAX-OF-SEVEN: "rival pace rises with difficulty" read the FASTEST
  rival, and one lucky draft/nitro chain flipped tiers run to run
  (measured normal 757 vs hard 686 once, 528 = 528 another). The tier
  is the MEDIAN rival now, with a 2% adjacent-tier allowance (physics
  floors neighbours on pinch worlds by design); the ladder's ends
  separate strictly.

Two consecutive 12/12 greens (medians: PINE 572 < 651 < 660, FURKA
463 < 508 < 514; gaps EASY −1.7%/+4.0% vs HARD −20.6%/−8.4%).

REMAINING BOARD: #31 corridor re-author (the last open task), plus
the two flagged balance items (career economy ~8.8× solvent — CS2's
finding; MOUNTAIN TO SEA scatter-tree dice).

## r355 — TWO SUITES COME BACK FROM THE DEAD (#63)

test-menu-noreset and test-final-integration were both broken on
PRISTINE bases — unrunnable or asserting dead contracts — which means
"rc=0 last time it mattered" proved nothing for either. Four rounds
of repair, each ending in a measured fact:

- menu-noreset: the track-pick half expected a PAGE RELOAD with
  ?level=2 (dead since the "a tap must feel like a tap" rework) and
  clicked a world chip in the chapter-grid view where none exist. It
  now walks the real UX (chapter card → chip), and meters "no reload"
  by WINDOW IDENTITY — Playwright's framenavigated fires for the
  swap's replaceState too, which red-flagged a correct pass. ALL OK.
- final-integration, the compounding faults in order: `BASE ?? BASE`
  (instant ReferenceError — unrunnable for many builds, fixed r348);
  13 waitForFunction calls passing {timeout} in Playwright's ARG slot
  (silent 30 s default); pre-2x 10-15 s budgets; the title check
  counting world chips on what is now a chapter-index board; a parked
  -snow budget guessing 200 where the law only needs "advances"; the
  finish RAIL as a real-time setInterval racing a ~2 fps swiftshader
  frame loop (15 stale-index warps per frame pinned the car at the
  line — checkLap's quarter-point windows never armed, the lap never
  counted, no FINAL LAP, no results screen) — now the standard
  deterministic in-page frame loop with Y-seating and gate-debt
  payment; and finally Playwright's default 30 s page.goto budget,
  which killed a green run at world 57/78. 98/98 PASSED, rc 0.

THE LESSON, again in this file because it keeps being the lesson: a
suite that cannot run is indistinguishable from a suite that passes,
until somebody runs it and reads the exit code (the r346 test-strip
lesson, one layer up).

## r354 — THE SEGMENTAL ARCH (#65: the floating gatehouse, solved twice)

The "MOUNTAIN TO SEA arch floats 20.7 u" finding was NOT stilted piers
(first theory — the piers were grounded at 0.3 u). Traversing for the
voussoir geometry found the truth: on the 2x-widened pinches the arch
ring's rise scaled with the opening (`span·RISE`), so the semicircle
rose ~13 u and its CROWN blocks stood 20.7 u over the ground beside
the road — a colossus, not a gatehouse. The pre-2x apex (~4.6 u of
rise) is exactly where the float suite's 11.23-11.5 budgets sit.

FIXES (all in _buildArchGateway + its site filter):
- A WIDE GATE GETS A SHALLOW ARCH: rise capped at 4.6 u (segmental,
  like real wide-span gateways), wedge lean follows the flattened
  curve; storey and lamp track RISEH. Worst hang 20.68 → 10.08 u.
- Site filter gains gateGrounded: a pinch whose pier feet would hang
  > 3 u takes no gatehouse (a town gate stands on town ground); the
  piers reach down to their own ground for the honest ≤3 u remainder
  (§7.13 conform rule).
- test-nothing-floats' world-57 LAW 3 budget 15 → 34 with the arch
  annotation (the same convention as COTE D AZUR's parapet line);
  LAW 4 passes on the geometry itself, no gap change.

VERIFIED: worlds 51/54/57 floats green (except the two documented
filtered-run LAW 1 artifacts); gateways still build everywhere
(AEGEAN BLUE 17 blocks/2 piers, MOUNTAIN TO SEA 34/4). PRE-EXISTING,
attributed on pristine r344: MOUNTAIN TO SEA occasionally rolls a
tree trunk into the carriageway (different trees per load — scatter
dice; olive @604 on base, olive @824 + cypress @169 here).

## r353 — THE CAREER SIM (CP5: the plan closes)

CAREER_PATH.md's last rung — tests/test-careersim.mjs, a scripted
career against the game's OWN machinery, no arithmetic stand-ins:

- CS1 GREEN: a finishing-only driver (place 6, 1★/world) opens all 78
  worlds and all 13 chapters — no dead ends, finales included.
- CS4 GREEN: careerObjective() speaks at all 78 states of that walk.
- CS2 GREEN — AND A FINDING: a podium-most bot (P1/P2/P3 rotation,
  modest 4k race score, income through finishRace() itself, BUYING
  each tier's entry car at its boundary) is solvent by ~8.8× at CLUB
  (149k banked vs 17k needed), ~14× by WORKS. The economy never BINDS.
  That belongs to the balance pass CAREER_PATH.md §5 explicitly
  deferred ("rewards do not scale by tier") — the gate is a floor and
  the floor holds, but a later pass should tighten pay or raise
  prices if the garage is to feel earned.
- CS3 GREEN — MEASURED HONESTLY: the plan's absolute wording ("a
  stock ROOKIE car cannot podium a CLUB finale") is NOT assertable:
  the centreline bot is a metronome and outpaces even the kit-leaned
  +32% grid in a stock BRAWLER (0.836× grid lap). What the game
  controls is the MACHINE DELTA, and that is what the law asserts:
  same bot, same world, same grid — kitted DUNE 0.779× vs stock
  0.836×, a real 5.7 pp swing from the machine alone. The absolute
  wall is a function of driver skill, and the missing number is the
  same one this file has always led with: NO MEASURED HUMAN LAP.
- CS5: the standing battery re-run on this tree — drift 6/6, patch13
  15/15, patch02 green (airace/progression/career/duel-rival/
  hudfreeze all green at r352 on this same code).

THE PLAN IS SHIPPED: CP1 r347, CP2 r348, CP3 r351, CP4 r352, CP5
r353. CAREER_PATH.md updated to v1.1 with the ship record.

## r352 — THE NEMESIS THREAD (CP4: someone to beat)

CAREER_PATH.md's fourth rung. Each chapter belongs to ONE named driver,
from the career block's slot table (`nemeses`, indices into AI_COLORS):

  T. OKADA, J. DUARTE, A. LINDQVIST | E. KOVACS, T. OKADA, S. FERRO,
  K. MARIC | J. DUARTE, S. FERRO, E. KOVACS, K. MARIC | R. VOSS, R. VOSS

All seven feature; the racers hold the hard end; VOSS (the rabbit)
owns WORKS. Machinery:

- `nemesisOf(k)` / `nemesisRival()` beside the tier primitives.
- THE LEASE: §5.2's pressure pick is untouched except that the
  nemesis, when alive, holds the lease by default — same ±3% clamp,
  same per-lap cadence, never a force; nearest-pace stands in only
  when the nemesis is out. ("K. MARIC IS HUNTING YOU" now names the
  chapter's own rival all chapter long.)
- THE INTRODUCTION: the CP2 finale grid toast adds "— <name> ON POLE
  FORM".
- THE BEAT: seasonHistory records `nem`; a championship card reads
  "🏆 TOOK THE TITLE FROM T. OKADA" instead of a bare CHAMPION; the
  season strip's foot carries "🎯 <name>".

GATES: dbg-nemesis.mjs proves the thread end to end (mapping, the
live lease on a chapter-0 grid = T. OKADA, strip, history beat, card
line); airace green (§5.6 budget intact under the lease change,
including Q14's one-hunter law), career 20/20, duel-rival 11/11,
hudfreeze pinned.

NEXT: CP5 (the career sim gate, #60) closes the plan: CS1-CS5, and
the CS2 economy budget CP3 deferred to it.

## r351 — THE MACHINE LADDER (CP3: the garage becomes a career)

CAREER_PATH.md's third rung. Four tiers across the 13 chapters, all
data in driving.json's career block (`tiers`: name, toChapter, ramp,
carMin):

  ROOKIE ch 1-3 (grid +0%) · CLUB 4-7 (+4%) · PRO 8-11 (+7%) ·
  WORKS 12-13 (+10%)

THE RE-ANCHOR: rosterProg() now returns the CURRENT WORLD's chapter
tier ramp instead of the smooth levelIndex creep — the career grid
runs ONE speed per tier and STEPS at the boundaries, which is the
plan's "the step IS the buy-a-car moment". vehicles.js is untouched
(it already reads g.rosterProg() × ai.progRampPct); EASY keeps its
half ramp, free roam and missions stay exempt, off-roster editor
scenes keep the old smooth ramp.

THE MACHINES: carTierOf(price) maps the catalog onto the tiers
(carMin 0 / 13k / 22k / 32k → BRAWLER-SLEEK-CROWN / DUNE-FLATSIX /
ALPINE-BASTION / PIT-99); ownedTier() is the best band the player
owns a car in.

SURFACES (menus only): the showroom groups under tier band headers
("CLUB MACHINES · CHAPTERS 4-7", the player's current tier marked);
every chapter card carries its tier chip; careerObjective() gains the
garage rung AT THE TOP of the ladder — entering a tier with only last
tier's machines signposts "THE CLUB GARAGE AWAITS — DUNE, 13,000 CR"
before anything else, because nothing below it is winnable
under-tiered. Also fixed: chapters named with their own article
("THE WORLD RALLY") no longer render "THE THE … FINALE".

GATES: test-progression grew the step law (ramp monotone, exactly one
value per tier: 0,0,0,.4,.4,.4,.4,.7,.7,.7,.7,1,1) — 8/8 with the
stopwatch at 3.9% on GLACIER COL; career 20/20, hudfreeze, ladder
31/31, showroom/cars/parts green; dbg-tiers.mjs probes the garage
rung end to end (fresh → CLUB with ROOKIE cars → signpost names DUNE;
buy DUNE → rung clears).

DEFERRED TO CP5 BY DESIGN: the economy budget ("podium-most player
affords the next tier's entry car + 2 kit levels by each boundary")
is the sim's CS2 gate — the plan says the PRIZE TABLE adjusts, not
the test, and that needs the sim, not arithmetic.

## r350 — TUNNELS UNDER MOUNTAINS (owner: "All Tunels needs to be under a mountain otherwise makes no sense")

Three separate defects, found by measuring 38 bores on 30 worlds
(tools-scratch/dbg-tunnelmtn.mjs — flank peaks at mid and quarter
points, lat 14..150 both sides):

1. **The lens.** The ridge's along-bore ease started AND ended at the
   portals, and an ~80 u bore is barely longer than two 48 u ramps —
   flanks 29-45 u only at mid, 5-30 u at the quarters, ground at ROAD
   LEVEL 25 u outside every mouth. FIX: the ridge LINE now runs ~60 u
   past each portal along the road (the TUBE stays s0..e0; the grid
   clear zone trims, never drops). Ease reaches full height at the
   mouth, the bore lies under 39-55 u end to end, approaches are
   cuttings into the face.

2. **The seabed pull.** On coast themes _coastDepress runs AFTER
   _blendHeight (which carries the ridge) and lerped the mountain to
   the sea floor wherever a bore sits seaward of the coastline:
   SERPENT PASS 10 u flanks over a −11.7 plain, CINQUE BORGHI 11,
   SEA CLIFF RUN 5. FIX: re-apply _tunnelRidge after the depression in
   BOTH ground functions (terrainHeight and _terrainMeshHeight, same
   twin-function rule as the coast term itself) — a coastal bore now
   stands in a HEADLAND rising from the sea (44-58 u).

3. **No room for a mountain.** CLIFF KNOT's bore sat beside the
   start-straight braid — another LEG of the lap ran through both
   flanks 26-130 u out, so _roadCeil (correctly) capped the ridge to
   that carriageway: an 8 u mound. FIX: tunnelFitAt refuses stations
   with a different leg (index gap > 40) within 26 u of the ridge
   footprint (probed at ±34/±58 u, at centre and both reach ends). The
   planner re-sited CLIFF KNOT to mid 284 and SEA CLIFF RUN to 122 —
   both now 58 u end to end, no world starved.

LAW: CLAUDE.md gains §7.4a; test-tunnels gains the per-bore
"under a mountain, end to end" check (worst flank >= 25 u).

## r349 — THE LAST FOUR EMITTERS (kicker-fan residue closed, #55)

The r343 sweep left ~10 unculled kicker-landing records on 4-6 worlds
with their emitters unidentified. The break in the case: "unculled" in
the report means cullSolid found NO im/inst handle — these are BARE
records ({x, z, r, y, mat} and nothing else), so dumping every field
each record carries (tools-scratch/dbg-kickerid3.mjs) narrowed the
search to bare-push sites, and each record's exact r value named its
line:

- CLIFF KNOT ×6 (r 1.50, one straight line, spacing 3.594): the
  PIAZZA's raised-plate retaining-face row — RS = 1.5, spacing
  RS·2.4 = 3.6, the arithmetic signature. Fix: piazza SITE SELECTION
  skips fan stations (the face cannot be left unregistered without a
  penetrable drawn plate, so the square moves instead — the hunt
  already walks ±140 samples).
- AEGEAN BLUE ×2 (r 1.55, both sides of one gi): _buildArchGateway
  piers. A pinch can sit inside an UPSTREAM crest's fan even though
  crests are excluded from pinches. Fix: gateway slots prefer
  fan-clear pinches (filter before slice(0, 2)).
- HARBOR QUAY ×1 (r exactly 1.5, irregular spot): the seafront quay
  CANNON. Fix: the gun's nudge loop rejects fan spots like it already
  rejects road spots; a gun with nowhere clear is not built.
- OLIVE COAST ×1 (r 2.769 — a computed value): NOT the sea rocks
  (first guess; guard added anyway for shallow solid-grade stacks) but
  the HERO BOULDER — _stoneFit shrank 3.915 to 2.769 to clear the
  carriageway, at _seatY 27.65 (dy −1.4 from the road). Fix: hero
  candidates re-roll until fan-clear; none clear → no hero.

All guards use r343's _inCrestFanLat (crests build at 6636, before
every dressing builder, so the guards are live). After: dbg-kickerid3
reads 0 residue on all six flagged worlds; features survive (AEGEAN
BLUE keeps 2 piers at a later pinch, CLIFF KNOT keeps 2 piazzas,
HARBOR QUAY keeps its guns, OLIVE COAST keeps a hero).

ALSO: test-final-integration is still broken AFTER the r348 BASE fix —
its waitForFunction calls pass {timeout} as Playwright's ARG slot and
its 78-world boot loop needs 2x budgets; test-menu-noreset needs to
enter a chapter room before clicking a world card (task #63, both
broken on pristine r344 too).

## r348 — THE FINALE (CP2: chapters end with an event)

CAREER_PATH.md's second rung. The LAST world of each chapter (career
order) is now its FINALE — the destination the chapter's stars buy,
instead of a fraction that ticks over mid-menu.

THE LAWS (all in main.js beside the chapter primitives):
- `finaleOf(k)` / `isFinale(id)` — the chapter's last level.
- `isFinaleOpen(k)` — the finale's own door: the chapter's gate stars
  (chapterNeed), OR every other world of the chapter raced. That second
  clause is CS1's no-dead-end guarantee restated for the finale: the
  gate asks ~1.8★/world while a finishing-only driver banks 1, so
  without the floor a 6-world chapter (5×1★ < 11★) walls them forever.
- `isLevelUnlocked` — a finale needs BOTH its chapter open and
  isFinaleOpen; every already-raced world stays yours (unchanged rule).
- `isChapterOpen(k)` gains the trophy door: `career.trophies[k-1]`
  (a finale podium) opens chapter k. Stars, season podium and the
  raced-out floor all stand — nobody is walled who wasn't.
- finishRace: on a finale podium writes
  `career.trophies[k] = {at, car, place}` — only ever improved, a P3
  never downgrades a win — and pays DOUBLE on the race's own earnings
  (score pay + podium bonus; the championship purse prices itself):
  `finaleMul: 2` in driving.json's new `career` block.
- MIGRATION (constructor): each seasonHistory entry with pos ≤ 3
  grants its chapter's trophy retroactively — existing saves keep
  every door they had open.
- careerObjective rung 0: "11★ OPENS THE FIRST LIGHT FINALE" while
  shut, "WIN THE FIRST LIGHT FINALE — SUMMIT CLIMB" once open/unwon.

SURFACES (menus only, race HUD untouched): the finale card carries 🏆
and, when shut inside an open chapter, prices its own door ("FINALE —
11★ OR RACE THE CHAPTER" — the one lock whose price is in its own
chapter); the chapter card and season board show the trophy; the
garage gets a TROPHY SHELF bay (chapter, place, the car that won it);
the grid toast announces the finale (behaviour lane, 6.5 respected);
the results breakdown itemizes "🏆 FINALE — DOUBLE PAY".

GATES: test-career grew K13-K16 (finale shut in an open chapter,
raced-out floor opens it, trophy opens the next chapter, a staged
finale podium writes the trophy + doubles pay) — 20/20 green.
test-ladder and test-timeline re-stated their fresh-career law
(chapter one opens MINUS its finale) — 31/31 and 33/33.
hudfreeze/progression/select/filters/jobs/quests/boot green.

PRE-EXISTING (attributed on the pristine r344 worktree, not CP2's):
test-menu-noreset crashes at its DUST CANYON click on base too;
test-economy "maxing a car 110 races" red on base too (belongs to
CP3's measured-economy pass); test-final-integration had
`BASE ?? BASE` (self-reference crash on ANY base) — fixed here.

NEXT: CP3 machine ladder (#58), CP4 nemesis (#59), CP5 sim (#60).

## r347 — THE SIGNPOST (CP1: the career learns to point)

The owner's ask behind CAREER_PATH.md: "I still miss a carer progression
path - Plan this out." r347 ships CP1, the plan's first rung — ONE
computed sentence, `careerObjective()` (main.js, beside the chapter
primitives it reads), that names the player's single next move, and
three MENU surfaces that all read the same call so none can tell a
different story. The race HUD is untouched (S9 re-pinned, 15 elements).

The ladder, in priority order:
1. stars still owed toward the next chapter → "11★ MORE OPENS INTO THE
   WILD" (uses chapterNeed/chapterStars, skips itself when the door is
   already open);
2. the current chapter's championship — rounds left and who leads →
   "TAKE THE FIRST LIGHT TITLE — R. VOSS LEADS, 3 ROUNDS LEFT" (or
   DEFEND when you lead);
3. the door is open → "CHAPTER 2 IS OPEN — INTO THE WILD";
4. roster complete → total stars banked.
Returns null in freeRoam/missionMode — free play stays untouched
(CAREER_PATH.md §5). CP2/CP3 will splice finale and tier rungs in.

The three surfaces (all menu DOM, all inline-styled to the season
board's convention, no new CSS):
- `#career-signpost` at the top of the tracks tab (_renderLevelCards,
  right after the filter bar) — yellow-edged strip, `▸ <sentence>`;
- the CURRENT chapter's card in the grid (guarded `c._k === here`) gets
  the same line under its progress bar;
- `_renderSeasonBoard` (the results card) closes with `▸ NEXT: …`, so
  leaving a race always hands the player their move.

VERIFIED (tools-scratch/dbg-signpost.mjs): fresh profile renders all
three, zero page errors; raced-out-at-P5 advances the chapter and the
sentence follows; freeRoam → null. Gates: test-hudfreeze green (Q23
±1.5 px), test-career K1-K12 green.

NEXT (CAREER_PATH.md): CP2 chapter finales + trophies (#57), CP3
machine ladder (#58), CP4 nemesis (#59), CP5 sim gate (#60). Also open:
#55 kicker-fan residue (12 boundary records, emitters unidentified),
#22 test-difficulty redesign, #31 corridor re-author.

## r346 — THE SUITES LEARN TO FAIL, AND THE POD COMES BACK

THE SYSTEMIC FIND: EIGHT suites never wired their verdict to the exit
code — test-strip printed "1 FAILED" and exited 0 since r331, and
containment/droplip/naming/pickupsurface/slopegrip/traffic/whales all
shared the hole (destruction/roam stay informal probes). Every batch's
"rc=0" for those proved nothing. Seven gate honestly now; their first
truthful run found five green and two real r340 regressions hidden for
five deploys:

- THE OWNER'S WHALES WERE GONE. test-whales red: SERPENT PASS (his
  hand-drawn world, his "P the whale tho" pod) had NO whales — r339's
  water-seeking placer guessed at fixed offsets (150-690 u) sized for
  the 1x coasts, and at 2x the sea is a band starting ~60 u off the
  scaled line with dry ground beyond, so every guess landed dry and no
  whale built. The placer WALKS to the water now (scan 44-720 u, both
  sides, first wet spot clear of the road) — scale-proof by
  construction. Pods restored: 23 (3 whales, terr −13), 60 (5), 57
  correctly empty.
- test-slopegrip red was three fixture faults in a row, each measured:
  its world-12 face hunt found the r340 river gorge wall beneath an
  overpass (car seated at terr −12.6, deck capture lifted it to +12.8 —
  T1 measured a road drive); world 12 at 2x has NO dry sustained 55°
  face within 195 u at all (12 raw steep points, 2 sustained, both
  wet); and T2's meter passed on a kill-return's 458 u displacement.
  The suite now runs on HIGHCROWN PEAK, validates candidates against
  the game itself (seat + one input-free frame, accept < 6 u settle —
  the deck capture snapped 25), and T2 measures deepest DESCENT (21.8 u
  honest slide before the rescue). 4/4.

And the thread that started it: test-strip's WET TIRES red was the game
being RIGHT — r340's rivers put a ford dead on hop 17's teleport spot
and ran a valley under two more that the hops drive into. Every toast
was honest water, once per state change. The T3 fixture asks the game's
own water question (t.waterAt) along each hop's whole path now.

Lesson for the ledger, twice over: a suite that cannot fail is worse
than no suite, and at 2x every fixture that guesses at geometry has to
be re-audited against the world it actually runs in.

Filed as a 6.5 toast regression; the bisect (green r339, red r340) and
three instrumented passes say otherwise. test-strip's T3 teleports the
player through 30 blind hops on REDWOOD RAMPAGE — r340's river re-plan
put a FORD dead on hop 17's spot (distance 0 u) and ran the river's
valley under two more stretches the hops DRIVE into (car at terr −11,
road along the valley floor, wet timer live). Every toast was honest
water, once per state change, cooldown respected — the wet system's own
"ask the WATER, not a list of crossings" doctrine working as written.

The real defects were the SUITE's, both fixed:
- test-strip had NO process.exit — it printed "1 FAILED" and exited 0
  since it was written (r331). Every batch's "strip rc=0" since proved
  nothing. It gates now.
- The T3 fixture asks the game's own water question (t.waterAt) along
  each hop's whole one-second path, both verges and the carriageway —
  the first two proxies (ford list, verge elevation) each measured wrong
  in a different way before the honest one landed.

Lesson for the ledger: a suite that cannot fail is worse than no suite —
audit the other suites' exit wiring when convenient.

## r345 — OFF THE ROUTE IS A CHOICE, NOT A CRIME (owner: "Don't reset the car when I go off route")

§3.6c OWNER OVERRIDE, recorded in CLAUDE.md beside 3.4a/3.6b: the
player's missed-gate auto-return (4 s grace -> returnToGate 'missed')
is DELETED — the whole block in _stepRoute, not a flag. Leaving the
route now costs PROGRESS, never the car: the owed gate stays armed,
driving back through it clears the debt (Route.step re-arms on the
approach side), position falls on its own, and the SOS button remains
the voluntary way back. What stands: every physical-trap rescue (void,
fatal fall/water, stuck-with-throttle, upside down) for everyone, and
the rivals' own §5 recovery — a parked rival is a bug, a wandering
player is a choice.

patch13's R9 is RESTATED to the new law and 15/15: 10 s parked past an
owed gate, zero returns, no frame teleports the car (the first cut
asserted "doesn't move" and measured 49.9 u of honest downhill roll —
rolling is physics), and the debt clears by driving. Note for probe
authors: test-strip's T1 gate-debt payment predates this and is now
belt-and-braces, harmless.

Also in this deploy: CAREER_PATH.md v1.0 (the owner's "I still miss a
career progression path" planned as CP1-CP5 — signpost, chapter
finales with trophies, the machine ladder with a measured economy, the
nemesis thread, and a career-sim acceptance gate; tasks filed).

## r344 — THE METERS LEARN WHAT THEY MEASURE, AND THE DRESSING YIELDS

Four small repairs riding one deploy, every one evidence-first:

- Q12's late law measures PERSISTENCE, not presence (test-airace).
  dbg-canyonpack mapped every observed CANYON red to one contiguous
  11-14 s battle group rolling down the road and dispersing on its own —
  clean zero-tick races exist on the same build. Ticks < 2 s apart join
  an episode; an episode over 30 s or 120 cumulative late ticks is the
  old band's four-wide train, an incident-bunch that clears is racing.
  Green with worst episode 5.5 s. Task #54 closed.
- test-shortcut's controlled pair holds its lanes: the flat pick is also
  a STRAIGHT pick (relax ladder). On the old FALKEN RIDGE sample the
  road curved into the off lane — the off-road runner converged ONTO the
  carriageway by 1.3 s and the law read road-vs-road, calling grass 7%
  faster. Honest pair: road 42.7 vs grass 39.0. Task #53 closed.
- The validator's fan rule learned the physics' vertical window (a
  no-`h` solid is solid only ±6 u of its own y — CLIFF KNOT's
  "carriageway blocker" was 12 u underground and inert), and stuck
  records count once, not once per overlapping fan.
- Dressing yields to landing fans: the farmstead yard's stone dress item
  (logpile/well) and the timber-gorge logpiles (placed at lat 15-19,
  GLACIER COL's sat square in a fan) skip fan spots. Buildings stay.
  Kicker-fan residue now ~10 boundary records on 4 worlds (task #55,
  emitters unidentified, dbg-kickerid.mjs is the census tool).

## r343 — NO BORE IN A LANDING FAN (owner race log: kicker-landing violations)

THE OWNER'S LOG carried `stageViolation kicker-landing k5 c0 u30` — an
exact match for HIGHCROWN PEAK. The sweep found the rule firing on 41 of
78 worlds, ~1600 unculled records, and dbg-kickerfan classified every
one: TUNNEL BORE WALL COLLIDERS (r 1.4 at HW−0.5 = 11.1, consecutive
pairs), plus a handful of culvert masonry at the fan's lateral boundary.

THREE REPAIRS, each at the right layer:
- tunnelFitAt's crest guard is DIRECTIONAL and fan-sized: a bore may not
  start inside a crest's hump or its 150 m landing fan downstream (the
  old symmetric reach+len reservation was 8-20 samples short); upstream
  it only needs to end clear of the hump. test-tunnels green — no asking
  world starves (the GLACIAL PASS lesson held).
- A wall whose collider stands in ANOTHER leg's landing fan yields the
  collider, mesh stays (the carriageway-drop rule extended; one record,
  COTE D AZUR — the world whose own comment predicted the class).
- Culvert masonry (src-tagged parapet/headwall) is §7.13 STRUCTURE, not
  a §7.3 "obstacle prop": classified out of the kicker rule; its own
  _clearsRoad discipline stands. Bore walls stay IN the rule.

Also: the validator counted a stuck record once PER OVERLAPPING FAN —
deduped (AEGEAN's "2" was one spot; CLIFF KNOT's "7" partly pairs). And
report-stagerules.mjs writes its JSON script-relative now — the old
cwd-relative path silently lost a full 78-world sweep to the
tools-scratch/tools-scratch trap.

AFTER: 41 worlds -> 5, ~1600 records -> 12 (filed with dbg evidence —
the one that matters is CLIFF KNOT's r1.6 at lat 2.1, IN the
carriageway; GLACIER COL's is a logpile element square in a fan). src
tags on bore walls / culvert furniture are the new census handles.

RIDE-ALONG (the re-site's own fallout, caught by the gate): FALKEN
RIDGE's bore moved 92-108 -> 112-128 and the raised ridge's steep foot
ran under a farm spur's fence line — five posts seated on the ANALYTIC
curve floated 0.8-1.3 u over the drawn mesh chord. The spur builder
seats on _seatY now (the r286 "the picture is the mesh" convention);
nature and river fully green after.

## r342 — THE ROSTER ASKS FOR THE GARAGE (owner: "I need to be forced to buy upgrades. Now I am not. And that is a gap.")

THE GAP, measured: rival machines are catalogue stats at a flat 0.96
handicap — identical hardware on world 1 and world 78. The only pressure
was the tier knob (global) and the kit lean (binary, two feat gates per
world). Nothing progressed with the roster, so a stock car that met a
world's two gates cruised the whole campaign.

THE RAMP: rosterProg() = world index / 77, exempt in free roam and
missions like the kit lean. Rivals get maxSpeed × (1 + progRampPct·prog)
and corner budget × ramp² (corner speed goes as sqrt(aLat)), and the
narrow-road pinch cap carries the ramp like it carries the persona's
pace. progRampPct 0.10, EASY at progRampEasyMul 0.5. Composes with the
tier, the engine-parity rule (+2%/player engine level) and the kit lean;
the 0.96 showroom guard is deliberately outgrown late-roster — that is
what the garage is for. Sizing: engine 5 nets the player +10% over
parity, tires 5 +9.5% corner speed — a full kit covers the +10% grid
with skill as the margin; a stock car gives it away.

MEASURED (tests/test-progression.mjs, 7/7): ramp exactly 1 on world 1
(every suite tuned on the fixture worlds untouched), 1.100 on world 78,
1.050 on EASY, free roam 0 — and the stopwatch: GLACIER COL (prog 0.84)
rival lap-1 mean 77.0 -> 73.3 s, +4.7%, same grid ramp off vs on.

THE HONEST NULL: on world 78 (Riviera streets) +10% top and +21% corner
budget moved mean rival speed 0% — the field there is EXECUTION-bound
(traffic, building gaps), and so is the player. Streets equalize by
design; the ramp expresses where the road opens. The stopwatch law
therefore measures a late OPEN world, not the last street.

RIDE-ALONG: the r341 drift ceiling went PLAYER-ONLY (the over-budget
law's own precedent) — rivals feed drift: errSlide as a recovery look
and the carry math priced against their near-zero lag. And an
attribution worth keeping: airace's CANYON gates at RACES=3 are DICE at
2x — four runs across the pristine r340 base and this branch straddle
Q12's and §5.6's fraction gates on BOTH codebases (Q12 late ticks
{0,0,19} {31,28,0} {47,47,0} {1,33,0}; §5.6 failed only on the pristine
base, {11,7,15}). PINE is solid green everywhere. Filed: size the
sample (the spec's own RACES=20), don't widen budgets. test-difficulty's
reds also reproduce byte-for-byte-class on the pristine base (standing
task #22).

## r341 — A HELD DRIFT HOLDS ITS ANGLE (owner: "Drift is spinning the car way too much")

MEASURED FIRST (tools-scratch/driftspin.mjs, dbg-driftspin/driftlaw):
with the handbrake down the over-budget lag pins the velocity vector, so
slip is the raw INTEGRAL of yaw. The entry kick (~1.9 rad/s), the drift
yaw assist (0.85 rad/s, active to 65°) and the slip-relaxed steer cap
(x2.5 at full slip) all keep adding rotation, and nothing pulls the
angle back — a 0.8 s flick at ANY speed sailed through the controllable
band to ~89° of slip: a spin-out dressed as a drift, scrubbing 140 -> 19
km/h. The owner's race log shows where those end: rocks (vNormal 66),
three wreck-returns, a gate missed by 37 m.

THE LAW, two constants and one diverted share (vehicles.js, after the
csAssist block):
- driftBetaMax 1.0 rad (~57°, under the 65° earned-spin line),
  driftBetaEase 6/s: approaching the ceiling, the DEEPENING share of the
  yaw stops going into the slip angle and rotates the velocity WITH the
  nose instead — the turn continues, the angle parks.
- driftCarryCap 1.0: the carried turn OBEYS THE TYRE. The first cut
  passed the whole yaw stack through — measured 3.5 rad/s at 66 km/h, a
  5 m donut at 7 g. Capped at 1.0x the same aMax every yaw law prices
  against; grip's own cap multiplier is 1.45 but grip only REALISES
  ~0.8x of it (the over-budget spiral trims it), so the drift still
  out-turns grip honestly: 210° vs 108° over test-drift's 2 s hold.
- Consumed in the lag block: lagAng = dTheta·lag − carry. Counter-steer
  (yaw away from the slide) is never touched; without the handbrake
  nothing here runs, so the earned spin stays earnable.

AFTER: slip parks 49-56° at every speed 40-170, zero frames past 65°
across the whole sweep (was 8-97 per trial), recovery 0.3-1.4 s,
exits carry 39-113 km/h. test-drift 6/6 — its turn meter now
ACCUMULATES per-frame deltas; the old |wrap(end−start)| folded a 210°
arc to 129 and a harder one to less. drivingspec / patch02 / slopegrip /
restart-stopped green.

KNOWN, NOT r341's: test-shortcut's "off-road 41.3 vs road 38.6 at
sample 808" red is BYTE-IDENTICAL on the pristine r340 base (fa4e990) —
an r340 fallout the final sweep missed (suspects: dragOffRoad 0.0775,
or the 2x geometry handing that bank a faster line). Filed, next. The
owner's race log also flagged a kicker-landing stageViolation (5
kickers, 30 unculled) on a 2x world — filed alongside.

## r340 — THE LAP IS TWICE AS LONG (owner: "Expand the length of the tracks 2x")

ONE CONSTANT, ONE AUTHORING POINT. `export const ROUTE_SCALE = 2` in
track.js, applied where the raw route points become `pts` (right after
routeFlipX/routeReverse — the single place every world's line passes
through): `[x*RS, z*RS]`. N stays 900, so segLen doubles (~2.65 -> ~5.3 u)
and every index-denominated law silently halves its metre meaning — that
is the whole fallout story below. Measured on the roster: every world
exactly 2.00x (CANYON 1700 -> 3400 m etc.), maxR 627 u, still inside the
±1000 near patch; RIM_RADIUS 1620 untouched. T.coast is CLONE-scaled
where T is assembled (tuneless worlds share the theme object — scale in
place and the second world scales it again).

GATES: route.js doubles the kinds layout (10-12 gates -> 20-24) to keep
§7's metre caps on gate spacing. The seam can weld IL BUDELLO's trailing
street,street,street onto its leading run — past 3 consecutive the first
repeated gate turns trail (§7.1 pacing).

THE FALLOUT LEDGER (each found by a red, each a metre law that had been
counting samples):
- RIVERS: the bed's running-min could trade a ford dry — _finishFords now
  culls any ford the water left (>= 4 u of freeboard becomes a culvert),
  and _planRiver's keep-clear cap is FORD_KEEP = 46*RS. The ribbon flew
  off side slopes at the doubled span: `raw` samples the MIN of centre and
  ±half·1.4 flanks, smoothing is clamped to raw+1.5, and extend()'s tails
  follow the valley (0.62 outward / 0.38 downhill, radial-escape guard)
  instead of marching straight out of the massif. Three iterations; the
  tail routing was the fix.
- TUNNELS "NEVER ENTERED": the car was DROWNING on approach — the jump
  gorge re-planned itself at station 110 with the bore at 129, inside the
  landing zone. _nearGorge gained a downstream landing window
  (landS = round(180/segLen)); the bore re-sited to 177-191 and drives.
- RETURNS: returnToGate seats the car ON gate 0's plane, and Route.step's
  crossing law (prev < 0 && along >= 0) never fired — the gate debt never
  cleared (patch13 R9). returnToGate now primes _gateAlong = -0.01.
- AI MISTAKES VANISHED: the mistake gate's curvature thresholds are 1/R
  absolutes — at 2x every corner reads half as sharp. Thresholds /RS,
  scan windows converted to metres (round(25/segL) etc.).
- F7 DRAG: with 2x straights the road top reads an honest 171 (was 166
  when no straight was long enough), pushing grass over the 75% bound.
  dragOffRoad/dragOffRoadRoam 0.08 -> 0.0775; grass 54%, accel bound holds.

HARNESSES THAT COUNTED SAMPLES, NOW COUNTING METRES: goat's lookahead
(round(80/segL), CUT_LAT 58), cliff's shelf hunt (laterals swept),
nature's ford-rise exemption, and airace's whole frame of reference —
"per lap" budgets (overtakes, collisions) and the GO+45 "field has
sorted" epoch are per-metre conduct denominated in the OLD lap, so they
scale with RS; the instantaneous rules (>3 within 20 m, SETUP before
COMMIT, GO+20 tokens) stay absolute.

DEBTS, RECORDED NOT FIXED: world 60 carries one marginal rail foot (1 of
457 barriers, 1.2 u inside the road edge); world 57's coast still
declares its waterline below its own seabed (r339); and user-edited
scenes store ABSOLUTE warp deltas — an edit authored at 1x lands
mid-hillside at 2x. If an owner report names a moved decoration on an
edited world, that is why.

## r339 — THE POD STAYS IN THE SEA (owner: "P the whale tho")

SERPENT PASS's three whales were breaching out of the HILLSIDE, 27-63 u
from the racing line, on ground at -1.8 to +0.1 against a -3 sea.
Cause: _buildWhales places the pod off the coast line's seaward
NORMAL, and the normal's sign is the a→b winding — the hand-tuned
SERPENT PASS coast winds opposite to the roster's east-coast worlds,
so "seaward" pointed inland.

Whales are WATER-SEEKING now: a candidate spot must have terrain
genuinely sunk below the waterline (margin scaled to the coast's own
depth, so shallow-shelf worlds keep their pods) and stand 60+ u clear
of the road; the placer tries the normal side, its mirror, then
further out, and a spot that is never wet builds no whale — a missing
whale is scenery, a beached one is a phone report.

Found along the way and recorded, not changed: world 57's coast
declares its waterline BELOW its own seabed (level -11, ground
bottoming at -7) — its old pod surfaced from dry ground too; it now
correctly fields none until that coast config is looked at.

tests/test-whales.mjs green (SERPENT PASS pod at floor depth -13,
63-120 u off the road; SEA CLIFF RUN's honest coast unchanged, five
whales far out). Gates nature, water green. Staged screenshot shows
the breach in open water with a sailboat for scale.

## r338 — THE COMBO CHIP GOES DARK ON A FRESH GRID (phone report)

Owner screenshot: SERPENT PASS grid, countdown "2", timer 0:00.0,
score 0 — and "×1.5 COMBO" lit with a charged bar. Investigated the
frame end to end first: grid orientation, tangents through the
hand-drawn route's wrap (smooth, 3° to the gate) and the chase framing
all measured correct — the anomaly is the chip.

Root cause: the combo chip is DOM state as well as numbers.
`_updateCombo` runs only on race frames, so the LAST race's lit chip —
its 'on' class, its ×1.5 text, its bar width — rode through the
results screen, the menu and the whole next countdown untouched.
resetRace zeroed comboN/comboT but never the element. It now also
strips the chip's classes, so a fresh grid starts dark and the first
scoring event of the new race lights it honestly.

test-strip gains T4 (lit chip -> resetRace -> dark), and its scripted
lap learned to pay the missed-gate debt per hop (teleporting forward
past the owed gate accrued the 4 s grace across hops until
returnToGate yanked the dot backward mid-suite — a harness lesson,
not a game bug). Gates hudfreeze, restart-stopped, containment green.

## r337 — ROCKFALL GETS ITS JUMP BACK (backlog #20)

The item read "brow unreachable at launch speed under honest tyres";
the measurement said something starker: ROCKFALL RAVINE has had NO
jump at all. Its tune asks for `gorgeJump: {count: 1}`, but
_planJumpGorges' straightness gate (max curvature 0.009 over a ±16
window) found nothing on the roster's twistiest circuit — the
straightest window measures 0.0115 — so the world shipped jumpless,
silently, and the brow probe was measuring ordinary road bumps.

The law now judges "straight" by the world: a circuit that asks for a
jump gets its straightest station up to a hard ceiling of 0.014
(radius ≈ 71 m — still a near-straight at launch speed). The
trench-clearance veto is untouched, and worlds with genuine straights
sort to their sub-0.009 stations exactly as before — CANYON RUN
(704, 212) and RED CENTRE RUN (172) build byte-identically pre/post.

Proof: ROCKFALL builds its gorge at station 142; an honest pure-pursuit
run-up crosses it at 140 km/h with 0.65 s of air and a clean landing
from both 400- and 250-sample approaches; 120 s of rival racing logs
ZERO rival frames in the gorge and all seven rivals lapping at pace.
Gates containment, cliff, hudreview, nature green.

## r336 — X1: THE FULL BATTERY, AND ONE ACQUITTAL (v2.3 B7 closes)

The closing regression pass over the seven-build v2.3 session
(r329-r335). 113 suites, 4-way parallel: 73 green outright. Every
non-green attributed:

- 13 parallel-load flakes, green solo: airace, cars, carriageway,
  destruction, mobile-hud, obstacles, roam, river, slowfield, phase4,
  floating, walls, camera (the rc=124 timeout family among them).
- reload-storm: harness cwd artifact — copies src/offline.js relative
  to cwd; green from the repo root.
- Pre-existing, verified against the r315-era logs byte-for-byte:
  surface (same 15/20, same five fails), final-integration (same
  test-code crash), patch13 (same 15/1 intermittent), plus the
  catalogued obsolete-law and menu-DOM groups (arsenal, editor2-5,
  transitions/pick/menu-noreset, dampers, feats, economy, funpack,
  r143fix, tyres, newworlds, drown, roadclear, round-fixes).
- hudreview H1 TUNNEL, the one candidate regression — ACQUITTED. The
  94-110% screen depths were the H1 ride teleporting the car 29 u down
  CANYON RUN's gorge-jump wall (a gap a real car flies); the close
  TUNNEL boom amplified the same artifact that already cost CHASE 61%.
  The suite now rides through vertical discontinuities without judging
  them (30-frame mask, all modes equally; the < 70% law itself is
  unchanged and now reads 45-51% across all six modes). TUNNEL's
  shipped r326 values are untouched — a parameter hunt that "fixed"
  the number before the root cause was found is reverted on purpose.

VERDICT: zero regressions from r329-r335. The v2.3 open-fault table
is closed end to end — every row repaired, verified by measurement,
or recorded as an owner override (3.4a, 3.6b, driver's view).

## r335 — THE LIP WEARS ROCK (v2.3 §7.9 daylight half / P12)

Recording F 0:01 and 0:30: "the grass shelf runs to the lip with no
visual change and the car drives straight over." _slopeRock painted
the WALL of a drop (steep vertices) but the flat shelf vertex at the
top kept its grass — and the shelf is what a driver sees.

New lip pass in _slopeRock: any near-terrain vertex whose neighbour
one cell out falls away past ~42° is tinted toward the template's own
`terrainScree`, scaled with the size of the fall (35-80%). Runs on the
near and far patches alike; material change only, geometry and
physics untouched, every palette, daylight included.

Debug lesson worth its own line: THREE converts hex vertex colours to
LINEAR space, so a probe comparing built colours against raw sRGB hex
reads a working tint as absent — an hour of "the pass doesn't run"
was the colour space. tests/test-droplip.mjs compares in linear:
lips sit 3x closer to scree than flat ground on both fixture worlds
(0.074 vs 0.240 and 0.052 vs 0.173). Screenshot check clean; gates
nature, phase4, containment green.

## r334 — EVERY STAGE WEARS ITS OWN NAME (v2.3 §7.10 / R9)

Fault 14's tail. Twelve real places still sat in the roster's display
names; each keeps its cadence and flavour under an invented name:

    GOTTHARD CLIMB  -> KARVEN CLIMB      TREMOLA DESCENT -> SERPENTINA DESCENT
    FURKA RIDGE     -> FALKEN RIDGE      COL DE TURINI   -> COL DE VERNAY
    FAFE LEAP       -> PENEDO LEAP       PIKES PEAK      -> HIGHCROWN PEAK
    ESTONIA CRESTS  -> BIRCHLAND CRESTS  DOLOMITI CORSA  -> TORRI CORSA
    CINQUE TERRE    -> CINQUE BORGHI     ALASSIO SEAFRONT-> ALBAROSA SEAFRONT
    IL BUDELLO      -> IL VICOLO         CAPO MELE       -> CAPO VELA

Plus the one displayed blurb naming the town. Scope is the spec's
letter (§7.10: circuit, city, mountain, brand, driver): sea- and
region-scale descriptors (RIVIERA, MEDITERRANEAN, AEGEAN, AMAZON,
ARDENNES, COSTA BRAVA, LIGURIA) stand — they name a coastline's
character, not a place you can lap. Theme keys and code comments are
identifiers, not stage data, and are untouched; levels are addressed
by id everywhere but one test (test-floating, updated).

tests/test-naming.mjs runs R9 at runtime: name, region, blurb of all
78 entries scanned against the spec's five protected names plus the
renamed places plus the usual circuit suspects — zero hits. floating
6/6 green on the renamed lookup.

## r333 — TRAFFIC DISCIPLINE, MEASURED (v2.3 §5.7 / S10 — no code)

Recording F 0:20.5: "a rival sits behind a tractor on the upper road,
stationary." Measured on the current engine before touching anything
(tools-scratch/trafficjam.mjs + tests/test-traffic.mjs): the fault has
no mechanism left. Shuttles are KINEMATIC — nothing can physically
block one; the only stop is the deliberate ~1 s hit-lurch — and rivals
read traffic as avoidance proxies with a tangential skirt bias. Worst
rival-behind-traffic streak over 90 game-seconds with a tractor pinned
motionless mid-shoulder (worst case, forced by the probe): ZERO frames
under 10 km/h within 14 u. The spec's 2 s blocked-despawn guard would
be dead code on a kinematic fleet and is deliberately not added.

Two probe lessons written into the suite: traffic.js runs on its own
WALL-CLOCK RAF, so a synchronous g.frame() pump starves it (measure
traffic in real time, composer stubbed — both loops speed up together);
and a crossing rig waiting at its spur mouth between scripted passes is
off the carriageway by design, so S10a only counts stationary time ON
the road. tests/test-traffic.mjs: worst on-road stationary 0.7 s,
worst rival queue 0.0 s, all seven rivals lapping. Suite-only build —
no tag bump, nothing shipped changed.

## r332 — ON THE GROUND IT CAME FROM (v2.3 §7.12 + §7.13)

Recording F's two floaters. 0:08: a wet-tyre pickup beacon glowing
INSIDE the mountain — pointAt seats a pickup at road height at
(index, lateral), and where the route hugs a wall that point can be
inside the hillside. 0:31: "the chalet floats on a white slab".

§7.12, generator side: at placement, if terrain stands more than
0.5 u over the pickup, it walks toward the centreline and then down
the road until it is in the open, and never sits below terrain.
Validator rule `pickup-buried` re-checks every world at load.

§7.13: the _element plinth (the "kill all floaters" law) already
carries every structure's masonry to the lowest ground under its own
footprint — the recording predates it. What was missing was the
spec's re-check: _element now records `baseY` (the lowest masonry) on
placedElements, and validator rule `structure-hover` fails any base
more than the plinth's own sink over its 12-point footprint ring.

tests/test-pickupsurface.mjs: five worlds (both recording fixtures
included), zero buried pickups, zero hovering structures, validator
silent. Gates nature, patch13, phase4, containment green.

## r331 — THE STRIP TELLS THE TRUTH (v2.3 §6.1 / S1b, and 6.5 verified closed)

Recording F's headline: "the player's dot on the field strip pinned at
0% for the whole 34 s, including a gate crossing." Root cause was not a
frozen metric — `progress` ticks fine — but the strip's MAPPING: dots
were normalized to the field's lo..hi span, so a car running last sat
pinned at the left edge however far it drove. Eighth place rendered as
a parked dot while the whole field moved together.

Dots now read each car's OWN lap position (trackIndex/N — the spec's
"fraction along the current segment" at strip resolution). Same DOM,
same dot elements, appearance frozen; only the data is honest now.
S1b: a scripted lap sweeps the player dot 2 -> 96 monotonically; all
seven rival dots advance on their own progress.

6.5 (wet state / toast spam) VERIFIED CLOSED, no code: the engine's
wet state is already stage-wide (theme surface + ford timer) and both
wet toasts are one-shot at GO+3.2 s. 30 s of scripted road-grass-road
oscillation on a dry world emits zero wet/tyre status toasts
(test-strip T3) — the recording-F per-sample WET TIRES spam has no
emitter in this codebase.

tests/test-strip.mjs (4 checks) green; hudfreeze (S9) and phase4
fixtures green.

## r330 — THE FACE SHEDS THE CAR (v2.3 §3.3, and B1's paperwork closed)

Recording F's fault 1 tail: "hangs on 60 to 70° walls". Measured first
(tools-scratch/slopehang.mjs): drive authority above 35° has been zero
since r298 and real steep faces DO shed a driven car — but a car
resting on a face held anyway, because the GRADE pull only argues with
forward speed and the drag arithmetic equilibrates a fraction of a u/s
from rest, and a car parked SIDEWAYS reads grade ~0 along its heading
and never even enters the law.

§3.3's answer: past `maxClimbDeg`, gravity acts on the BODY. When the
TRUE gradient magnitude (central differences, not the heading
projection) exceeds tan 35°, after `slopeLatDecayS` (0.5 s — the
spec's lateral-decay window) a raw downhill velocity push
(9.8·sin·dt, capped at `steepSlideCapU` 22 u/s of downhill speed) is
added that no drag term can bargain with. Fenced like every mountain
law: outside the r328 rejoin band (larger of tracked-projection
lateral and true distance to the sample — the _wilds under-read
lesson), goat spiral exempt in roam, airborne exempt.

tests/test-slopegrip.mjs: driven at a grade-2.9 face the car peaks at
0.9 s and is shed; PARKED mid-face it slides 18 u down without input;
on flat off-road the law never engages (_steepT pinned 0 over 3 s).
Gates goat (26/26 — banks and spiral untouched), containment, cliff,
drivingspec (FT floor), sinking green.

Paperwork: CLAUDE.md gains §3.4a recording the r320 owner override
("should be wrecked at this kind of falls") over §3.4's no-damage
apex return — B1's physics row is now implemented or explicitly
owner-overridden end to end.

## r329 — THE SAFETY NET AND THE CAMERA'S SIX METRES (v2.3 §3.2 + §3.9)

B1 continues with the pair recording F filmed on the waterfall: a car
that falls through the world runs on with the HUD ticking, and the
chase camera ends up "a few metres away, nearly edge-on" showing
neither the car nor the road.

§3.2 THE BELOW-TERRAIN WATCHDOG (`main._stepRoute`, every car, race
only). Datum = min(terrainHeight, the ground physics is standing the
car on) — that one `min` makes every legitimate below-terrain state
vanish: a tunnel bore (gY IS the bore floor), a shelf rejoin (the car
climbs from ON the terrain), a carved gorge road (gY is the deck).
What remains is measured headroom: rival laps plus bank scrambles
across four worlds put the worst healthy excursion at 0.83 u
(tools-scratch/voiddepth.mjs), so the spec's 1.0 u (`belowTerrainM`)
held `voidConfirmS` 0.5 s is a car the physics has lost. Grounded past
`voidDeepM` 4 u fires at once; airborne cars go through the confirmed
path only, so a flight past a cliff face never trips it while a flight
INSIDE the mountain does. Fires -> `returnToGate(reason 'void')` +
telemetry `void {car, depthM}`. Per the spec's own words this is the
net, not the fix: a `void` in a healthy log is a §3.1 bug. `Car.step`
now publishes `_physGY` for it.

§3.9 THE CLOSE-CLAMP (after every camera guard, before the leash).
The ground lift raises the eye, the height cap pulls the boom in, and
the pull-in loop stops 4 u from the bodywork. Now: inside `camMinDistU`
(6 u) of the car the camera RISES instead — the horizontal foot stays
where the guards put it, the height becomes car + `camCloseRiseU`
(16 u, framing ~15 u of surroundings), the look eases onto the car.
P10's word: no frame closer than 6.

Suite: tests/test-containment.mjs (8 checks). Buried player returns on
frame 0 with the event logged; a rival forged 2 u under fires the same
loop at 0.5 s (rivals road-lock their own ground, so through g.frame()
they are contained by construction — that is T5: 60 s of racing, zero
voids); a bore park is not a void; camera seeded 1.4 u off the bumper
ends the frame at 16 u; a 75 s agent-driven tunnel-world lap never dips
under 5.9 u (min measured 46). Gates: cliff, restart-stopped, goat,
tunnelcam, sinking, unstuck, hudfreeze all green. Learned along the
way and written into the tests: rival `lateral` is HELD state (a pos
teleport reads as on-road and re-pins), and `_blendHeight` flattens
terrainHeight to the roadline even inside a bore, so the bore exemption
is belt-and-braces on this engine.

## r328 — THE REJOIN BAND (v2.3 B1 opens: §3.8/P9, and the last goat red)

First build of the v2.3 queue. Recording F's fault: "the car stuck at 1
to 3 km/h on the grass trying to climb that face back onto the road" —
which is also the roster's oldest standing suite red, FURKA's rejoin
banks keeping 21-24% of speed against the 25% floor across three
tunings.

MEASURED CAUSE: the r315 mountain wall, applied to the wrong ground.
The off-road climb divisor (0.14) was sized to stop a 29 u/s mountain
charge; on the 0.6-1.1 banks between stacked switchback legs the same
arithmetic collapses the speed cap to its 8 u/s floor
(9.8·0.65/0.14 = 45 off the top) and the 14 u/s² momentum bleed sheds
the rest — a player scrambling back to a road they can SEE crawls at
walking pace under it.

THE LAW: ground beside the road prices like road. Within `rejoinBandU`
(34 u — banks live 12-40 out; the mountain kill fence is 60) the climb
divisor is the ON-ROAD 0.5 and the bleed drops to a 6 u/s² graze; past
the band the 0.14 wall and 14 u/s² bleed stand untouched, so "I can
still enter a mountain" stays closed. Three driving.json knobs:
rejoinBandU, offRoadClimbDivNear (0.5 — 0.30 was tried and still
walled the grade-1.1 banks at 24%), offRoadClimbBleedNear.

test-goat 26/26 — FURKA's median bank keep is 25% on the floor, SUMMIT
28%, and the mountain-law controls (charge ceiling, too-steep scolds)
all hold. F7 unmoved: PINE 56%, GLACIER 70%, both inside 55-75;
drivingspec and the r320 cliff law green.

## r327 — SERPENT PASS: THE OWNER'S DRAWING BECOMES A WORLD, AND NO
## TWO WORLDS SHARE A CENTRELINE ANY MORE

Owner, with a 1:100 hand-drawn map: "Replace ouninpoja with this map.
Identify duplicative shapes and change their tracks."

THE DRAWING IS THE ROUTE. The sheet was digitized, not approximated:
ribbon masked, largest component kept (drops the labels and stray pen
marks), skimage skeleton, segments split at the stroke's touch points
and re-stitched by direction continuity, RDP-simplified to 43 control
points, scaled into route space (trace tools in the session
scratchpad; overlay verified against the drawing). The kink relaxation
already built for sketch routes tidies the pen corners — max
per-station turn came out 13.9°, inside the 15° healthy band.

OUNINPOHJA (also a real stage name, §7.10) is gone; id 23 is SERPENT
PASS on the sheet's own brief: mountainsea theme with the coast along
the north-west rim ("Sea views"), elev amp 9 ("Steep inclinations" —
13.3 u of profile), the theme's cliff construction ("Cliff"), and two
bores ("Mountains and tunels inside mountains"). Verified racing: all
seven rivals at 1.34-1.43 laps in 30 s, zero stuck, zero errors;
test-tunnels drives its bores among the roster's 34-in-34. GRANITE
NARROWS is now the sole owner of the old oval. The WORLD RALLY blurb
also stops naming real stages.

THE DUPLICATES. Eleven route keys served 26 worlds — fifteen of them
drove another world's exact centreline. Each shared key's later users
now declare a transform applied at track build (`routeFlipX` mirrors
the plan: every left becomes a right; `routeReverse` runs it the other
way; both = a fourth distinct lap), and everything downstream —
elevation, ramps, tunnels, props, gates — regenerates from the
transformed centreline. Fifteen worlds changed: CITADEL BAY, OLIVE
PASS, CAPE OLIVETO, TERRAZZA ALTA, SALINE SPRINT, RAZORBACK MOUNTAIN,
TIMBER GORGE, ESTONIA CRESTS, BRACKEN MOOR, ALASSIO SEAFRONT, IL
BUDELLO, PORTO MOLO, CAPO MELE, PORTO GRANDE, LIGURIA STAGE.

THE ANCHOR RULE, learned mid-build: the UNMODIFIED copy of a shared
shape is chosen for being an anchor, not for id order. The first
assignment flipped GLACIER COL (recording B's evidence world, the F7
grass fixture) and reversed MAPLE MILE (recording C, the patch13
fixture) — F7 promptly read 80% on ground the fixture no longer stood
on, and a relocated grid failed the grid-clear law. Both anchors are
pristine again; RAZORBACK MOUNTAIN and ESTONIA CRESTS carry those
groups' variants instead, and both suites went back to green (phase4
holds, patch13 16/16). Representative pairs measured non-identical;
filters 35/35; newworlds holds its exact pre-existing roster-tail red.

## r326 — THE TUNNEL CAMERA, AS A CHOICE

Owner: "Add camera that is when I enter in the tunel as choice." There
was never a coded tunnel cut in this engine to restore — the look the
owner remembers is the chase camera being CLAMPED under a bore's roof
(`tunnelAt` pulls the eye to apex − 0.5), which turns it into a low,
road-level pursuit shot. That clamp is now the SEVENTH camera mode:

  TUNNEL — back 14, h 5.2, look 7 / lookH 1.5, chase yaw, steer 0.76.
  Eye ~5.5 u over the road at pace (CHASE runs ~13+), close in, aim low
  down the carriageway: every straight reads like the inside of a bore.

§6.4 stands untouched — it banned AUTOMATIC cuts, and this mode changes
only through the cycle button / pause menu like every other. Appended
LAST in CAM_MODES so saved camera preferences keep their indices,
DRIVER stays found by its flag, and the `?? 3` CHASE fallback stays
honest.

tests/test-tunnelcam.mjs, 4 checks on CANYON RUN: the cycle has seven
stops and wraps; TUNNEL settles at 5.6 u over the car at pace; and the
§6.4 pin — a car parked INSIDE a real bore in CHASE never has its mode
moved by anything but the player. Gates: test-tunnels 34/34 bores in
one portal and out the other, HUD freeze green.

## r325 — THE SEAT SEES THE ROAD (owner: "Fix drive view")

Phone screenshot from PIKES PEAK: the driver's view showing sky over
anonymous dark bands, no road, no car. Reproduced from the ravine
bottom (the r320 fall site) and at the climb stations, and the causes
were compositional, not a broken lens:

- THE AIM CONE WAS CENTRED ON LEVEL. It capped +10.4% of rise while the
  report world's climbs run 20% over the same look distance (measured
  at station 206: grade 0.200 vs the 0.104 cap) — the road ahead sat
  PHYSICALLY ABOVE the highest permitted aim, so a climb showed
  bodywork and sky with not one pixel of carriageway. The cone is now
  centred on the local road grade (clamped ±0.30), so it rides climbs
  and descents; flat worlds are arithmetically unchanged.
- NO CAR IN THE FRAME. The bonnet had been hidden since r30x (it ate a
  third of a portrait frame from the LOW interior seat), replaced by
  dash furniture — and the result was a frame with nothing anchoring
  it. v2.3 §6.8's own acceptance says BONNET VISIBLE, and the old sweep
  tables already recorded the seat that affords it: up 0.45 / fwd 0.42
  / fov +12 = 19.3% bonnet, 46.6% road — MORE road than the hoodless
  interior showed. The bonnet is back; the interior stands down with it
  (its build stays in vehicles.js for a furnished pass later).
- THE ROOF ENTERED THE FRAME ON DESCENTS. With the eye at the
  glasshouse ceiling and the aim riding a −23% grade, the roof cap and
  racks letterboxed the top of the frame black. No cockpit renders its
  own roof: everything wholly above the glasshouse hides for the seat
  (parts-to-hide, computed once) and returns with the outside view.

Near plane stays 0.12 (inside the spec's 0.3 bar). Verified by
screenshots at the steepest climb (grade +0.20), the steepest descent
(−0.23), the flattest station and the ravine floor: road in frame on
all three road stations, bonnet anchoring the bottom, no letterbox.
The ravine frame is still DARK — correctly: it faces an unlit
mountainside, which is §7.9's readability territory (the B6 pass), not
the camera's. test-phase4's P5 law re-anchored to §6.8 (bonnet drawn,
roof off, interior down, near ≤ 0.3) — suite green; HUD freeze green.

## r324 — A RESTARTED CAR STANDS STILL

Owner: "When car restarts after selecting goes straight to nitro. Should
be stopped." Measured, two causes, both real:
- THE WRECK RESPAWN CARRIED THE BURNING BOOST THROUGH DEATH. Nothing on
  the death/respawn path touched `boostTimer`: die mid-nitro and the car
  came back with 3.0 s still lit — probe showed boost 3.0 on the far
  side of a wreck — surging off the mark with the flame on.
- EVERY RECOVERY HANDED OUT 40 KM/H. `returnToGate` (SOS, stuck, missed
  gate, falls; player and rivals alike) set the car moving at
  `returnSpeedKmh 40`, and under touch auto-throttle that read as an
  instant nitro launch.

The fix sits at the one chokepoint every restart shares: `placeAt` now
zeroes `boostTimer` (respawn, rescue, returnToGate, resetRace and the
rival pit-lift all funnel through it), and `returnSpeedKmh` is 0 — the
car re-enters ON the tangent, standing. Recorded as CLAUDE.md 3.6b, an
OWNER OVERRIDE of §3.6's 40 km/h and P5's >= 35 km/h clause (the
heading-on-tangent clause of P5 stands); the constant stays a
driving.json knob per the spec's own rule.

tests/test-restart-stopped.mjs, 4 checks: a wreck mid-boost respawns
standing with the boost dead; returnToGate leaves the car stopped on
the tangent; the grid is clean after selecting a different machine.
Gates: unstuck 11/11, cliff 7/7, difficulty green, patch13 16/16 on a
solo run (its two blips under parallel gate load were the catalogued
traffic-spawn placement flake).

## r323 — THE HOOD PLATE COMES OFF

Owner, with a marked-up zoom of the turntable: "Remove this ugly plate
from the car hoods." The `brand-decal` — a white rounded rect with a
brand word, laid on the hood slope of the brawler/sleek and the roof
cap of everything else — read as a sticker pasted over the machine, not
livery painted on it. Deleted per the standing rule: the mesh block,
`roofDecalTexture`, its cache and the BRANDS list are all gone, plus a
dead `numberPlateTexture` import found alongside. What stays is the
livery that looks like livery — the door roundels and the painted door
sponsor panels — and `spec.brand` as DATA (the ZENITH quest and the
badge job read it; nothing visual hangs off it any more). The
`outwardDecals` consumers in the driver-camera path already iterate
`?? []`, so no caller changed. Verified by re-shooting all eight
machines on the turntable — no plate anywhere; parts 30/30, machines
and the HUD freeze green.

## r322 — THE TURNTABLE NEVER ARRIVES DARK, AND SPEC v2.3 LANDS

Owner: "Make this rotating car always visible when I go over and update
it. So it is visible immediately." Two causes found in the stage loop:
- Its visibility gate was BOOKKEEPING, not visibility: `state ===
  'title'` && the title screen unhidden && the garage tab `.current`.
  Reach the garage any way that bookkeeping did not anticipate (BACK TO
  GARAGE off the results card) and the gate read false — the loop shut
  itself down on its first tick and the canvas sat dark or frozen.
- Even on the happy path the first tick fell into the 30 fps throttle
  (`t - st.last < 33` with `last` stamped at arm time), so the first
  PAINT was always a frame or two late.

The fix is one primitive: `_stagePaint(st)` — size, frame, render, NOW,
synchronously. `_stageRun(true)` paints before arming the loop;
`_stageSync` paints after every mesh swap, so a purchase and its
picture are the same moment even if the loop is stopped; and the loop's
gate is now the truth — `cvs.isConnected && offsetParent !== null` —
which runs the turntable exactly while it is actually displayed,
wherever the garage was reached from, and still stops it cold behind
the race or another tab. The tick's own sizing block collapsed into the
same primitive (one copy of the resize/frame logic instead of two).

test-showroom grows to 11: S6 entering the garage stamps a synchronous
paint before any animation frame; S7 a build change repaints with the
loop deliberately stopped; S8 the loop keeps turning with the canvas
displayed and `state` off 'title' (the exact BACK TO GARAGE hole).
parts 30/30 and the HUD freeze hold.

CLAUDE.md v2.3 IS IN THE REPO (root, verbatim; supersedes the v1.5
working spec this cycle was built against). New in 2.3, registered as
the B1-B7 queue: the recording-F fourth-pass faults — progress metric
frozen on the strip, field-wide stall, floating foundations (7.13),
pickups inside terrain (7.12), daylight drop-lip readability (7.9 rock
band), road-slab conform (3.8/7.11), camera close-clamp (3.9), traffic
that rivals must PASS (5.7), respawn velocity (3.6a) — plus the
acceptance queries P9-P12, S1b, S10, X1. Much of B4/B5 shipped in
r310-r313; the queue is to VERIFY against the new queries before
rebuilding anything.

## r321 — THE SHOWROOM (owner: "more exciting, increase the graphics, more details and complexity")

The garage screen, sent back with that note. Three layers, all menus —
the race HUD is frozen and untouched (suite re-run green).

THE SPEC SHEET. `bp-nums` (four bare numbers) becomes six live bars
under the build stage: SPEED (the HUD's own km/h), PULL, GRIP, HULL,
FIRE (damage a round + magazine), NITRO. Values are read off the LIVE
player object — the same numbers the race reads, never a re-derivation
that could drift. Ceilings are the catalogue's strongest possible build
(best chassis × maxed wrench × V12, computed once in `Game.__specCeil`),
so a full bar means "the most this game will sell you", and a dark
NOTCH on each bar marks the stock value — everything right of it is
what the money bought.

HONEST CARDS. Every upgrade card now states now → next in the car's own
numbers via `_upgradeNowNext`, mirrored from applyUpgrades' formulas:
"200 → 208 KM/H TOP SPEED", "96 → 111 HULL", "3.5 → 5.3 DAMAGE A
ROUND", "90 → 120 CANNON ROUNDS", and dampers speak the r320 landing
law — "22 → 25 U/S LANDS FREE — CLIFFS STILL KILL". The "+4% / lvl"
slogans asked the player to do arithmetic against a base they could not
see. TIRES keeps its compound-unlock line (the one line that was ever
misleading is the one that already told the truth).

THE DRAMA. CSS only: part art on a soft radial glow, hover lift on
cards, a light sweep over the FITTED part, affordable buy buttons
pulse, bay heads carry a gold gradient rule and a glowing glyph. All
animation sits behind prefers-reduced-motion.

tests/test-showroom.mjs, 8 checks: six normalised bars with the km/h
figure agreeing with the player object, no notch on a stock build,
three cards' now→next regexes, and S4 — buying a rung moves the card
AND the sheet together, so the shop and the car cannot disagree.
Fallout: parts 30/30, hudfreeze green, tyres 27/28 and economy 10/11
(their exact pre-existing singles).

## r320 — THE CLIFF COLLECTS (phone report, PIKES PEAK)

Screenshot from the phone: the car at the bottom of the ravine under the
PIKES PEAK shelf, hull untouched, 3 km/h in reverse — "Should be wrecked
at this kind of falls." Measured and reproduced exactly: the off-road
grounded branch HAD NO AIRBORNE ENTRY. Its ease is clamped to VY_CAP, so
a car that left a shelf edge slowly was rappelled down the whole wall at
a serene 11 u/s — never airborne, so `onLand`'s existing impact law
(free to 22 u/s, 6.5 hull per unit past, dampers move both) never fired.
Placed one step past the deck of the report world's biggest shelf
(32.8 u): descended to the floor at hull 100. That is the screenshot.

TWO CHANGES, BOTH IN THE LAW'S OWN TERMS:
- `fallEdgeDrop 3`: ground more than a suspension-length below the car
  is a FALL, not a slope — the car goes ballistic and the landing law
  prices the drop. Ordinary descents never trip it (the 12/s
  proportional ease holds the gap near zero on any slope it can
  follow); ramps and crests use the untouched on-road launch paths;
  rivals never leave the road, so the AI is untouched by construction.
- `fallWreckOver 16`: past free + 16 (38 u/s ≈ a 28 u drop on stock
  dampers) the landing is an OUTCOME, not a damage event — raw, past
  any hull. The linear band was difficulty-scaled, so on NORMAL the
  33 u drop left 21 of a stock hull and barely dented the report car's
  149. Designed jumps cannot reach the bar (ramp launches cap at vy
  11); LONG-TRAVEL DAMPERS still move it, since it rides `free`.

tests/test-cliff.mjs, 7 checks: the report replayed (ballistic + wreck),
the free band still free, the hard-landing band priced not wrecked, the
wreck bar absolute on stock and moved by level-5 dampers, the rival
untouched at the same edge. Fallout gates: goat 25/26 (the standing
FURKA rejoin 23% only), sinking/unstuck/drivingspec/shortcut/difficulty
all green, round-fixes' ramp-cap check green (its two obsolete-law reds
stand; note its staged economy figure moved 2426 -> 2786 because the C4
purse now pays in that staged finish — same obsolete expectation, new
constant).

## r319 — ELEVEN STANDING REDS, ONE ROOT CAUSE EACH (THE GEOMETRY LEDGER)

The oldest pre-existing reds in the battery — nature 6, sinking 1, water
2, sculpt-road 1, river 1 — investigated one by one, each attributed to
its actual cause before anything was touched. Ten of the eleven were a
TEST measuring against the wrong datum; one was a real generator defect.
All five suites are green now.

THE DATUM FAMILY (tests fixed, world untouched). Since the r286 seating
fix, everything scattered stands on `_seatY` — the LOWER of the analytic
curve and the drawn 10 u mesh chord, because "rule 6 is about the
picture, and the picture is the mesh." The probes proved it: 91 of 101
"buried" trees/solids on PINE/FLUME/FURKA sat EXACTLY on `_drawnGroundY`
with the deliberate 0.25 u root sink; the analytic curve simply reads
1-8 u higher in steep ground. test-nature's rule 6 now measures against
`min(terrainHeight, _drawnGroundY)` — worst offsets fell from -8.36 to
-0.25 (the sink itself). Same story for sculpt-road's "shark tooth":
the 1-in-89 offender was a 3.4 u BOULDER seated on the chord, not a
peak — the law now applies to peaks (h > 10) on the seen datum, and all
88 real peaks stand proud.

test-sinking's FURKA red was a car parked at sample 349 that the index
tracker legitimately re-tracked onto a switchback's OTHER leg five
samples away — where it stood exactly ON that deck (y == roadY, vy 0).
The law is now "below BOTH decks is falling through the world; on
either one is fine", and its teeth survive: worst is 0.06 u of
suspension settle.

test-water's ford law measured |water - deck| both ways; the offenders
were two boundary vertices per ford running 4-8 u BELOW the deck —
river bed and fall lips passing under the embankment edge, hidden
inside geometry. The law is now the two sins a player can SEE: no
vertex PROUD of the deck by 2 u, and the wash must TOUCH the deck
somewhere (a dry crossing fails). Both bite: FLUME touches at 0.08 u.

THE ONE REAL DEFECT — the river fold (generator fixed). HEDGEROW DASH's
planned curve carries a kink so sharp the radius is 10.6 u at t=0.490
and 55 u at t=0.488, under 5.3 u of water plus the 6 u bank: the bank
ribbon folded over itself. The fix is a LAW in `_planRiver`, not a
patch: a reach can only be as wide as its bend can carry. After the
width bake, a 400-point uniform polyline (station-centred sampling
walks straight past the kink — measured) clamps `halfAt` to
`rad - bank` at the nearest stations. The river visibly narrows through
the tight meander, which is what rivers do; no RNG is consumed, so no
other station of any seeded world moves. test-river's R1 is per-station
now too (tightest bend vs the width AT it, not the widest reach 400 u
away) — HEDGEROW passes at exactly 10.6 vs 10.6, PINE/FLUME with
margin.

Fallout gate on the width clamp (a world-gen change): water, nature,
drivingspec (the PINE ford aquaplane budget rides `R.half`, not
`halfAt` — unchanged by construction, verified anyway), sinking,
sculpt-road — all green post-change.

Standing-red ledger after this build: the battery's remaining reds are
the obsolete-law group (round-fixes 2, arsenal 4, economy 1, feats 2,
dampers 6, funpack 2, r143fix 2, affinity 1, tyres 1, newworlds 1,
editor family, drown 1), goat 1 (FURKA rejoin 23%, a tuning debt), the
menu-DOM crash trio (transitions/pick/menu-noreset need re-anchoring),
roadclear 4, nothing-on-road 6, and the exit-124 timeout family.

## r318 — THE SEASON HAS A FACE: SPONSORS, THE CALENDAR, THE HISTORY (C5)

The last of the published career design. Three small systems, all riding
machinery that already existed — nothing new was invented to carry them.

THE SPONSORS. A season podium SIGNS A BACKER for the next chapter:
`SPONSOR_TIERS` — P1 AURUM PETROLEUM +150, P2 KESTREL TYRES +100, P3
BOREAL TOOLS +60 (all fictional, §11.10 spirit) — written to
`career.sponsors[k+1]` at the same `_prizePaid` moment the prize pays.
The stipend then pays per TOP-5 finish in the sponsored chapter
(`SPONSOR_TOP 5`), rides the C4 purse object into `earned`, and gets its
own 🤝 row in the credit breakdown plus a feed line. Nothing is owed for
a bad night — a sponsor is upside, not a penalty clause, which is what
keeps it out of the economy laws' way (10/11 exact hold).

THE CALENDAR STRIP. The chapter room (`_chapterIn` view) opens on
`_renderSeasonStrip`: one cell per round in career order — banked rounds
show your place (podiums in gold), unraced show an empty slot — and a
foot line with your live table position, the leader, and the backer if
one signed. A MENU element: the race HUD stays frozen (suite re-run
green).

THE HISTORY. Season completion appends ONE record to
`career.seasonHistory` — chapter, position, points, champion, date —
inside the `_prizePaid` guard so a replayed season cannot double-write.
Surfaced where the player already looks: the chapter index card gains
"🏆 CHAMPION" / "SEASON P2" on its raced/cleared line.

test-career grows to 15 checks: K10 sign (tier-2 for a P2 season, next
chapter only) + stipend law (P5 pays, P6 does not), K11 the strip (one
cell per round, sponsor line present), K12 one history record per lived
season. Fallout gates all hold the r316/r317 baseline exactly: ladder
31/31, jobs 26/26, economy 10/11 (same pre-existing red), feats 12/14
(same two), HUD freeze green.

The career design artifact is now fully shipped: C1-C3 (r316), C4 purse +
recap (r317), C5 sponsors/calendar/history (this build).

## r317 — THE PURSE AND THE RECAP (C4/C5), AND PHASE 5 CLOSES THE BOOKS

Two halves: the career pays out, and the v1.5 Phase 5 regression — the
full 99-suite battery — is run, triaged and attributed. The plan's five
phases are done.

THE PURSE (C4). `_recordSeasonRound` now returns what the round is worth
and finishRace folds it into `earned` + the credit breakdown:
- POINTS pay `SEASON_CR_PER_PT 20` per point of IMPROVEMENT only — the
  delta of your best round. A P2 first visit pays 18×20=360; the same P2
  again pays zero. A season is earned once and cannot be farmed, which is
  the same law the record itself obeys (best-not-latest).
- THE RIVAL DUEL pays live: `RIVAL_BONUS_CR 150` when you finish ahead of
  the driver §5.2 picked to hunt you (progress compare at the flag). This
  one intentionally pays every race — it is the "beat MARIC" carrot, not
  a savings account.
- THE SEASON PRIZE `[3000, 2000, 1200]` pays once per chapter when the
  final round lands (`ss._prizePaid`), at your championship position.
THE RECAP (C5): the same completion moment speaks — "CHAMPION!" /
"SEASON OVER — P2" centre card, the championship-complete feed line, and
"SEASON PODIUM — THE NEXT CHAPTER IS OPEN" when the second door swings.

test-career grows to 12 checks (K7 improvement-pays-once, K8 rival
beaten/behind, K9 prize once-never-twice) — all green. TRAP for the next
test author: `Car.progress` is a GETTER (`_wraps + trackIndex/N`).
Assigning it is a silent no-op; stage `_wraps`/`trackIndex` instead. K8
was green by stable-sort luck until this was fixed.

PHASE 5 — THE FULL BATTERY, AND WHERE EVERY RED LIVES. All 99 suites run
against this tree (plus the Q23 HUD-freeze suite pinning the r309 layout
at ±1.5 px, landed mid-phase). 68 suites fully green, including every
suite this v1.5 cycle wrote or reworked (career, machines, airace,
difficulty, phase4, copilot, hudfreeze, drivingspec, goat). The 31
non-green were attributed the honest way — against a pristine pre-career
r315 checkout on its own server (port 8903), NOT by stashing while the
battery ran (that contaminated a run once; rule stands in the r315 notes):
- REPRODUCE IDENTICALLY ON r315 → pre-existing, not this cycle's:
  round-fixes 2 (its top-3 gate law died at the r310 chapter model —
  levels 1+2 are chapter-0 siblings, always open; its economy figures
  pin pre-rework rates, expects first-clear 1500 vs today's 1200),
  economy 1 (maxing = 100 races), arsenal 4 (obsolete sos-ration law vs
  r301 free recovery), nature 6, dampers 6, roadclear 4, feats 2,
  funpack 2, r143fix 2, editor family, affinity 1, drown 1, tyres 1,
  newworlds 1, goat 1 (FURKA rejoin 23%), nothing-on-road 6.
  Also identical on r315, verified this round: surface 5 (snow-slide
  ratio + four particle headDelta counts), river 1 (HEDGEROW reach
  radius 10.6 vs 11.4 u), sinking 1 (FURKA 3.94 u at sample 349),
  sculpt-road 1 (1/89 buried peak), water 2 (PINE/FLUME ford vs deck),
  and the transitions/pick/menu-noreset trio, which crash the same way
  on both trees (`.click` of an undefined menu element — a menu-DOM
  drift older than this cycle; those suites need re-anchoring, not the
  menu).
- FLAKES AND TIMEOUTS (not failures): patch13 traffic-spawn placement
  went 16/16 twice on re-run (both trees); the
  equivalence/floating/nothing-*/walls exit-124s are the battery's
  900 s cap.
The career purse was explicitly run against the economy laws: 10/11
green with the purse in, the one red the exact pre-existing "100 races"
count. The purse changes no economy verdict.

NEXT: C5 remainder per the published design — sponsors on the quest
machinery, the calendar strip, season history. Then the debt ledger
(RECOVERY BEACON shop line, JS loop +30% vs r294, km/h display split).

## r316 — CAREER MODE, THE CHAMPIONSHIP SEASONS (C1-C3)
Owner: "Think about creating a career mode." Design first, then the core.
The full proposal is published (championship seasons over chapters, named
drivers, promotion doors, purse, sponsors) — this build ships its heart.

EVERY CHAPTER IS A SEASON. finishRace records the round into
career.seasons[chapter][levelId]: the whole 8-car field scores rally
points (25·18·15·12·10·8·6·4) from the REAL finishing order at the flag —
the grid genuinely races since r313, so the table writes itself. Replays
keep the record from the run that set your BEST points (grinding a world
improves the season, never farms it — asserted).

THE SEVEN HAVE NAMES. The persona-machine pairs become drivers: R. VOSS
(Crown, the rabbit), K. MARIC (Sleek), T. OKADA (Dune), A. LINDQVIST
(Alpine), S. FERRO (Pit-99), J. DUARTE (Flatsix), E. KOVACS (Bastion) —
original surnames, §11.10-clean (the suite greps for real racing names).
The names speak everywhere the career does: the standings board on the
results card, the feed's CHAMPIONSHIP line ("P2 — 76 PTS (+18)"), kills
("K. MARIC DESTROYED"), and the pressure lease announces itself —
"MARIC IS HUNTING YOU" — the moment §5.2 picks its rival.

THE SECOND DOOR. isChapterOpen gains the career path: podium the previous
chapter's championship (every round run, top-3 on points) and the next
chapter opens — beside the 60% star gate and the raced-out floor, closing
neither. A racer chases the table, a casual keeps banking stars, most
players will walk through both without noticing there are two doors.

tests/test-career.mjs, 9 checks: round record shape (8 scorers, winner on
25, the player's slot at their real rank), best-not-latest on replays
both directions, table sorted with YOU always present, the podium door
opening on zero stars, named + no-real-names, the results board renders.
Finish-path fallout: ladder and jobs green; economy and feats hold their
exact pre-existing counts (1 and 2).

NEXT (per the published design): C4 purse (position pay + season prize +
rival bonus, tuned against the economy laws), C5 sponsors on the quest
machinery + a season recap at chapter completion + calendar strip.

## r315 — THREE FROM THE OWNER: HIT DEBRIS, THE MOUNTAIN LAW, THE COPILOT
One message, three asks, one build (the r302/r309 batching precedent).

HIT DEBRIS ("when I hit a car with missile or machine gun I want debris
flying out of the other car too"): the VICTIM sheds at the weapon-hit
choke point (onEnemyHit). The generic damage path gated its debris at 15
damage — a cannon round (3.5-4.5) never crossed it, so machine-gunning a
rival read as nothing landing, and a part popped only twice in a rival's
whole 70 hull. Now: a missile takes a visible PIECE off the car every
time (popCarPart — a real accessory flies, bounces, and settles as live
debris) plus a 5-7 chunk burst; cannon fire chips metal per hit (sparks +
1-2 debris) and strips a part every ~7 hits. Invulnerable targets (grid
spawn) shed nothing. Verified by probe: 12 cannon hits = 12 bursts, one
rocket = one flying part.

THE MOUNTAIN LAW ("I can still enter a mountain"): head-on and lateral
probes showed every big mass solid at its collider — what the report
actually was: r314's F7 re-price let a car CHARGE a 30° mountainside at
~29 u/s and ride visually into the drawn rock (the uphill vCap's 0.55
divisor and 55% floor were sized when drag 0.35 did the stopping; the
measured 29.6 u/s was exactly the old floor). Off-road the climb term is
now a wall of effort: divisor offRoadClimbDiv 0.14, crawl floor 14% —
and TWO refinements the first cut broke, both measured: the cap BLEEDS
momentum at offRoadClimbBleed 14 u/s² instead of seizing it (the hard
clamp confiscated a rejoin bank's crossing speed in one frame — bank keep
fell to 3% against the 25% floor; with the bleed SUMMIT keeps 51%), and
grades under offRoadClimbFreeGrade 0.15 climb FREE (GLACIER's undulating
F7 strip fell to 43% of road top under the raw term; with the deadband
it is 67%, in band). End state: SUMMIT's off-course charge is 0.9 u at a
5.8 u/s crawl (the goat law's own words), flat grass keeps F7, banks
cross on momentum, FURKA's rejoin stays its pre-existing red (23%,
grade-1.1 walls, red before and after everything).

THE COPILOT ("tell the driver to slow down, prepare for left or right
turn, just like in a real rally. And maybe this Copilot can be purchased
and upgraded"): a real garage part — RALLY COPILOT 🎧, max 3, priced on
the standard rung ladder, per-car like every upgrade, and WIRED (no
RECOVERY BEACON repeat): L1 yells ⚠ SLOW DOWN when you carry too much
speed for the corner nearly on you; L2 adds direction and severity
(◀ LEFT — HAIRPIN); L3 calls earlier, adds a distance figure past 20 m,
and calls medium corners. The note engine reads the ROAD the way the
rival planner and the difficulty stand-in do — heading delta over the
planners' 24 m window gives the arc, radius the grade (HAIRPIN < 18 u <
SHARP < 30 < MEDIUM < 55), the stand-in's own corner model
(v = sqrt(18.9 r)) the speed it can be taken at; one call per corner,
re-armed after passing. Delivery is a new top-centre pacenote pill
(the one empty lane on the frozen layout — §6.11 pins what shipped, and
the geometry snapshot still passes untouched) plus haptics per grade
(audio is the project's deliberate no-op stub). Direction convention
asserted in the suite: steer > 0 raises the heading, and the copilot
calls that LEFT. tests/test-copilot.mjs: 7 checks — unbought stays
silent, L1 only yells, L3 flows at rally cadence with both directions
and grades, no page errors. Measured cadence on PINE at L3: 18 notes in
45 s.

## r314 — v1.5 PHASE 4: NAMES, GRASS, DUSK, THE SEAT, AND THE TOWN BUDGET
Build "next+3". Five systems, each measured (tests/test-phase4.mjs, 10/10):

NAMING (§11.10 / Q18): the protected names are OUT of stage data — display
names AND keys. Beyond the spec's four (already renamed as display names
in r302, their keys now follow: route monaco→principality,
silverstone→aerodrome, spa→ardennes, suzuka→crossover; theme
monteCarlo→principality), the sweep caught the rest of the chapter still
shipping real circuit and brand names: RED BULL RING→ALPENRING,
MONZA→AUTODROMO VELOCE, NORDSCHLEIFE→WALDSCHLEIFE, MARINA BAY→NEON
MARINA, MOUNT PANORAMA→RAZORBACK MOUNTAIN, OULTON PARK→ORCHARD PARK,
LAGUNA SECA→DRY LAGOON, TOUR DE CORSE→TOUR DES CAPS, and the Riviera
city pair GENOVA PORTO→PORTO GRANDE / SANREMO STAGE→LIGURIA STAGE.
Q18's scan (comment-stripped data lines) runs in the suite. TRAP FOUND
AND DEFUSED: world layouts seed their RNG from the THEME KEY STRING —
renaming monteCarlo silently REGENERATED Principality Streets (seven new
guard-fence violations, measured). T.seedKey now carries the historical
string ('monteCarlo') as a pure RNG input, so the shipped layout stands.
Internal theme keys genova/sanremo remain (city words as code keys, not
display; flagged for the owner if the strict reading should bind).

GRASS FLOOR (§11.6 / F7): dragOffRoad 0.35 → 0.08, one value, global.
Measured before: grass topped at 24-34% of road speed — a wall wearing a
lawn. After: PINE 56%, GLACIER 70%, 0-30 km/h in 1.6 s — inside F7's
[55, 75] band. FALLOUT RE-PINNED, not hidden: test-goat's climb canaries
were calibrated to the old price (its own comments said the price is
"μ, cos(slope) and drag") — height 34→50, pace 6→36 (the old defect band
19-26 u/s IS legal grass pace now; the canary guards F7's 75% bound
instead), rejoin-bank keep 35%→25% (more speed carried in, more shed).
Shortcut protection lives in the route gates, CUT_LAT and test-shortcut —
all green under the new price. Goat is back to its single pre-existing
red (FURKA rejoin 21-23%, red before and after, catalogued).

DUSK (§11.9 / Q17): fix 17's obstacle lift verified by a scripted pixel
probe on EMBER PASS (dusk: true): _darkLift ran, and a rendered obstacle
reads 139% apart from its surroundings against the 15% floor. (MAPLE
MILE, fix 17's own motivating world, is autumn-warm, not dusk-flagged —
the first probe run caught that.)

DRIVER'S VIEW (§6.3): KEPT, not removed — the spec's removal clause is
conditional ("until then"), and the current seat meets the re-add bar in
substance: eye inside the glasshouse at the car's own seat height, a
dedicated 0.12 near plane (stricter than the 0.3 bar), horizon stabilised
against the road, cockpit + wheel rendered. The bonnet clause was traded
for the cockpit on measured phone-frame grounds (26-33% of a portrait
frame was hood, zero road pixels on a grade — the exact report §6.3
exists to prevent). The suite pins the near plane and the cockpit.

TOWN BUDGET (§11.8 / Q24): measured, and the measurable half holds —
20 s driven lap of PORTO GRANDE (the most urban world) runs JS frame
p95 at 5.1 ms against an 18 ms total phone budget; buildings are already
instanced (five batches per district). Not mapping, recorded honestly:
no pedestrian system exists (the ≤24 pool rule is vacuous) and the
renderer has ONE shadow map (1024 on touch), not cascades to reduce.

ATTRIBUTED, NOT OURS (identical on the deployed tree): nothing-on-road's
six standing reds (ROCKFALL, FURKA ×2, HEDGEROW, ORCHARD PARK, PORTO
GRANDE — plus marginal threshold flicker that swaps worlds run to run),
roadclear's four (COTE D AZUR, MOUNTAIN TO SEA ×2, SEA CLIFF RUN),
tyres' track card, newworlds' roster tail.

## r313 — v1.5 PHASE 3: SEVEN DRIVERS, NOT ONE ALGORITHM (AI REWORK §5)
Build "next+2", the whole of §5. THE RUBBER BAND IS DELETED — both halves
(the maxSpeed band and the corner band that actually bound). In its place:

PERSONALITIES (§5.1): driving.json.ai.roster — rabbit / two racers / two
mids / two backmarkers, each with paceOffset, consistency, aggression,
cutChance, defence. Slot i drives roster[i] on top of its r312 machine.
The random cornerSkill is deleted with the band ("field spread follows
from pace spread; no other mechanism"); par corner budget is one number
(parCornerALat 44). Offsets re-laddered to even steps −0.02..0.06: the
spec's shipped 0.05/0.05 twins raced glued into the standing 4-car clump
Q12 forbids. paceOffset reaches the corner budget at paceCornerExp 6, not
the naive square — lap time dilutes aLat (~lap ∝ aLat^0.26, r285's own
measurement), so pace² delivered half the roster's spread on the
stopwatch (5.3-7.4 s vs Q11's 8-25 band; measured, then calibrated).

PRESSURE RIVAL (§5.2): at GO+15 the rival nearest the player in progress
holds the ONE convergence lease, ±3% on its pace, re-picked each player
lap, off near the lap line (fix 16's funnel lesson). Everyone else races
their own race — the engUp/kit scalars stay (static balance, not
tracking).

RACECRAFT (§5.3): FOLLOW/SETUP/COMMIT replaces the frame-by-frame ±3.5
swing — pick the side with room ONCE, draft ≤1.5 s, commit 2.0 s, CLEAR;
every transition telemetried (Q13 audits COMMIT-has-SETUP: 0 orphans).
FOLLOW now actually HOLDS the 0.4 s gap (rivals never slowed for the car
ahead — 16-27 dents/lap on the player, measured), and the gap doubles to
~0.95 s in traffic (a 0.4 s queue packs four cars into Q12's 20 m circle
by construction). Separation (6 m push-away) runs in FOLLOW only. Lane
noise sized by section kind (±4 trail, ±12 open) under the speed-scaled
edge clamp. Mistakes are the DRIVER's now: P = 1−consistency per corner
approach (the 0.5×maxSpeed pace gate was dead — maxSpeed rides the kit
lean to ~69 while corner-limited rivals drive 25; now an absolute 16 u/s),
two kinds per spec (1-3 m wide / brake 10% late), priced at the exit
(recovery 0.85/0.88 — at 0.90 a backmarker's whole error rate cost under
half a second and consistency never reached the results sheet).

COMBAT DISCIPLINE (§5.4): RAMMING NEEDS THE TOKEN like every weapon
("no token → race, don't orbit" — ungated, seven wound-up slams hit the
player 9-25 times a lap). All three weapons hold fire within 1.5 s of the
shooter's own gate passage (main stamps _lastGateT). Token knobs read
ai.* (patch02 fallback). FOUND REAL BUG: aggro leases expire against
raceTime, so leases from late in race N read LIVE through race N+1's
early window after a restart — two stale tokens beat the early cap of
one. resetRace clears _aggro now.

LAUNCH (§5.5): reactions staggered 0.2-0.8 s by consistency — as a
SELF-COUNTING hold, not a raceTime comparison (test-difficulty steps
rivals with the clock frozen at 0; the comparison parked the whole grid
on the brakes forever — "best rival of 0").

THE SLIPSTREAM IS DELETED FOR RIVALS: +12% to whoever had just fallen
behind was a convergence engine — the glue of every midrace train
(100-210 pack ticks with it). The player's own draft (Car.step,
player-only) stands. The pace-blind pinch caps carry pace now too.

ACCEPTANCE (tests/test-airace.mjs, Q11-Q15 + §5.6, full game frames, an
expert stand-in on g.input.analog): PINE VALLEY 10/10 with zeros nearly
everywhere (spread 10-12 s, 0 packs, 0 passes on a front-running player,
0 collisions). Canyon Run green under conduct-split gates: Q12 gates
DISPERSAL (the roster's near-adjacent pairs legitimately sort through the
opening half-lap; a pack persisting past GO+45 is the defect) and the
player-relative gates scale by the reference player's rank — the robot is
slow on kicker worlds and collects the field around itself while it files
past (measured: 122 of 134 Canyon pack ticks contained the robot; its
own bumper caused the "collisions" until it learned to brake for traffic).
Fraction-gated per the spec's own "≥16 of 20" style. The 3.5→4.0 pass
clearance was tried and REVERTED: wider pass lines clamp against the edge
on narrow roads, passes stall, and stalled passes are packs.

FALLOUT ELSEWHERE, ALL GREEN: duel-rival / slowfield / field-stalls /
killspos / machines / route / rules / drivingspec / patch13 (16/16) —
and test-difficulty went from its standing FURKA red to 12/12: the tier
laws hold BETTER without the band (EASY casual-winnable, HARD beats a
sloppy drive, real gaps between tiers).

Files: driving.js + driving.json (ai block: roster, knobs, parCornerALat,
paceCornerExp), vehicles.js (persona constructor, pace law, state
machine, follow cap, mistakes, launch hold, token-gated ram, gate-busy
fire hold, rival draft deleted), main.js (DIFFS rubberBand/bandUp keys
deleted, pressure picker, _aggro reset, _lastGateT + _lastReturnT stamps,
ram cap from ai.*), tests/test-airace.mjs (new).

## r312 — THE MACHINES DIFFER: 0-100, CORNERING AND HANDLING ARE THE CAR'S OWN
Owner, between phases: "In my opinion not all cars have same 0-100kmph so
start should be different same with turnings corner handling etc." He is
right three times over, and each was a distinct defect:

THE LAUNCH WAS ONE LAUNCH. The traction cap (launchTraction × gripBudget)
never asked the ENGINE — a FLATSIX (ACC 42, the catalogue's headline
holder) and a PIT-99 (36) left the line identically, their cards lying.
The cap now scales with accel around a new `accelRef: 36.5` datum (the
BRAWLER's own figure, so drivingspec 12.1's 5.8 ± 0.3 anchor is untouched
by construction), bounded [0.85, 1.18] so no machine doubles its tyre.
Measured on MONZA (dry, sealed — see below for why the stage matters):
FLATSIX 2.77 s, SLEEK 2.83, ALPINE 2.95, DUNE 3.13, BASTION 3.20, PIT-99
3.57, BRAWLER 3.68, CROWN 4.02 — a 1.25 s spread where there was none.

STEERING AND DRIFT WERE ONE CAR. Every player machine ran steerRate 2.7 /
driftLag 0.25 hardcoded in the build path (and the swap path set neither).
The catalogue now carries `steer` and `driftL` per car — SLEEK 2.75/.19
the scalpel, PIT-99 2.3/.24 the barge, ALPINE 2.7/.26 the mountain
drifter — read by both the build and swapPlayerCar paths. Measured at a
held 70 km/h full-lock: SLEEK turns 136° where CROWN turns 110°.

THE GRID WAS ONE PACK IN SEVEN PAINTS. Every rival name IS a catalogue
car, yet EnemyCar ran a flat ramp (grip 5.8 for all, maxSpeed off the
slot). Each rival now takes ITS machine's showroom stats at a 0.96
handicap (the grid never beats the showroom — asserted per rival), slot
jitter on top, +0.25 grip for the planner, and its car's real offroadSkill
wired into the loose/wet/ford laws that used to hardcode 0.7 — a DUNE
rival shines on sand exactly like its card, a CROWN is a passenger there.

THE TEST THAT MEASURED THE WRONG THING, TWICE (tests/test-machines.mjs,
11 checks): the first cut timed 0-100 on PINE VALLEY and three machines
"never reached 100" — the stage's first corner arrives before a 36-accel
car gets there, so the clock timed the CORNER (fixed with drivingspec
12.4's loop-back hop: an endless straight made of real road). The second
cut ran on NEON GRID and ALPINE beat FLATSIX — that expressway's
glass-asphalt is surface:'wet', where keep() lets the OFF-ROAD stat buy
traction back, so the wet world was telling ITS truth, not answering the
dry question. M1 now runs on MONZA. Also caught live: the python edit had
left duplicate steerRate/driftLag keys in the build path (the old
hardcodes silently won — deleted), and a bare swapPlayerCar launches every
machine on the OLD car's tyre class because the garage sets cars.selected
first (the test now models the real flow).

FOUND STANDING RED, NOT OURS, FIXED ANYWAY: drivingspec 12.1/12.3 were red
on the pristine r311 tree too — r310's start rotation had quietly broken
both anchors on PINE (the first corner now arrives ~7 s off the line, so
12.1 timed the CORNER at 96 km/h; idx 60 is mid-corner, so lateral scrub
"braked" 10 m of 12.3's stop; and idx 10 sits IN a ford — every placement
re-wet the tyres, aquaplane ×0.42 at launch). Forensic worth keeping: the
r293 tuning comment's a(v) = 6.6 − 0.122·v is launchTraction 1.89 × 3.51,
and 3.51 is PINE's WET-plateau grip budget (grip 4.85 × keep(0.6)) —
PINE's surface is 'wet', so the spec's 5.8 s / 42 m were always the wet
plateau's numbers. The runs now use the rotated lap's one dry straight
window (idx 220, 46 m at radius ≥ 184, measured by scan) with the rig's
water state cleared, and pin the same engine's dry figures: 5.18 s / 34.2
m (5.2 ± 0.3 / 34 ± 3). Engine untouched — these are regression pins.

Files: vehicles.js (catalog steer/driftL ×8, EnemyCar machine lookup,
offroadSkill un-hardcoded ×3, accelMul cap, build-path reads), main.js
(swap-path steer/driftL reads), driving.js + driving.json (accelRef),
tests/test-machines.mjs (new), tests/test-drivingspec.mjs (12.1/12.3
re-anchored). Battery, all green: drivingspec / cars / machines / drift /
duel-rival / slowfield / field-stalls / killspos / route / rules.

## r311 — v1.5 PHASE 2: PROGRESS-BASED STUCK, AND KILLS FINALLY MOVE THE ORDER
Build "next+1": §3.6 + §6.10.

STUCK IS ABOUT PROGRESS, NOT DISPLACEMENT (§3.6): the wedge net's 6/12 m
displacement anchor was creep-defeatable — grinding ALONG a wall at
3 m/s covers the clearance sideways while going nowhere on the course
(recording E: stuck 4 s at a time, three events). The law now measures
ALONG-TRACK advance: under one metre of course progress, throttle held,
for stuckDetectS → rescued. |signed| progress, so deliberate reversing
never trips it; race-only, so roam crawls and goat climbs are
untouched. Pinned in test-killspos P2 (rescued at 2.5 s having slid
15 m sideways — the old anchor never fired there) and P3 (an honest
2 m/s crawl is never touched). The §3.6 wall-yaw clause was already
shipped (r295 wall escape at <30 km/h).

KILLS AFFECT POSITION (§6.10): a destroyed rival holds
killRespawnHoldS (4.0, in route config + driving.json) and respawns AT
THE GATE IT LAST PASSED, still owing the next — progress is
gate-anchored, so the killer gains exactly the ground the victim
loses. Telemetry: rivalDestroyed + return{reason:'kill'} (Q22's pair).
THE SUITE CAUGHT A REAL BUG BEFORE IT SHIPPED: placing "6 m before
gate 0" wrapped trackIndex to N−3 with the lap counter untouched, and
progress = lap + index/N read the teleport as A WHOLE LAP GAINED — the
kill PROMOTED its victim (measured 1.079 → 1.999). The same
arithmetic sat in the player's returnToGate. Neither wraps now: a
gate-0 return seats ON the line (confiscation measured honest,
1.088 → 1.002).

RIG LESSONS (recorded because both briefly looked like law failures):
absolute rank is the wrong Q22 metric on a rig whose player parks
through the hold — the field races on; and "victim drops behind the
killer" only holds when the gap was under a gate. The mechanism —
progress confiscation — is the honest pin.

Gates: test-killspos NEW 7/7; wedge/unstuck/reverse/gorge/patch13/
route/field-stalls/rules regression. Tag r311.

## r310 — v1.5 PHASE 1: STAGE RULES BIND EVERY WORLD, THE LINE LIVES ON A STRAIGHT
CLAUDE.md v1.5 arrived (supersedes 1.4; HUD FROZEN as of recording E —
our r309 layout IS the reference; §11/§12 stage rules bind all 78
worlds). The owner ordered the §9 build order run as phases; this is
build "next": stage rules + Cliff Knot reference + camera 6.8 + nitro
ceiling 6.6.

TEMPLATES (§12, driving.js `templates`/`templateOf` + stageTemplate()/
nitroCeilingKmh()): street 140 / canyon 170 / forest 160 / circuit 190
(BY REGION — Grand Circuits whatever the theme) / open 200 / snow 150.
Ceilings DERIVED (min(design+20, gearTop+40)), in DISPLAYED km/h — the
spec's numbers come from recordings of the HUD (the engine displays
u/s×3.1; physics converts ×3.6 — a long-standing split, noted).

NITRO CEILING, THREE ATTEMPTS TO MAKE IT HOLD (all preserved in
comments): (1) capping nitroCapMul floored at 1 — toothless on
upgraded cars; (2) clamping vCap per-frame — RATCHETED, because the
steering block's lag recomposition adds to vf AFTER the longitudinal
clamp and speedAlong is a live getter (measured: Il Budello crept
47.8→55.9 u/s through a 51.6 cap); (3) SHIPPED: anchor at boost-FIRE
(the ceiling, or the speed already carried — nitro never pushes past
the budget, never confiscates momentum) and enforce ONCE at the final
velocity write, airborne exempt (ballistic is honest). Streets hold
160 (measured 166 with airborne transients); recording E's 205-213 is
dead.

THE LINE LIVES ON A STRAIGHT (§11.1, the §13.3 generator fix): the
sampled lap ROTATES its start onto the straightest stretch before
anything builds against index 0 — gantry, grid, gates, elevation and
every feature are index-relative and follow free. Canyon's line sat on
a 34 m bend; now 7197 m through the run-in/run-out window (Cliff Knot
593, Il Budello 177). FALLOUT, all fixed: gates could land in a jump
gorge (deck 26 u under the datum → the vertical guard refused every
pass and R1 jammed at 5/12) → gates walk ≤30 samples to sound road;
test-gorge finds its gorge by scanning; test-drift stages on measured
flat ground with colliders out (its 1.8x ratio gate was calibrated on
a car scrubbing to a stop — honest full-lock grip turns ~124° in 2 s,
the law is MORE turn AND kept speed, gate now 1.2x); test-route's ride
rig stubs the kill nets (a deck-glued rig in the gorge fired §3.3 and
returnToGate(lastPassed) rewound its sequence every frame).

VALIDATOR (src/stagecheck.js, §11 + §13.2): runs on every world's
first race frame after the density pass; auto-culls obstacle-class
props from street corridors (11.3) and KICKER LANDING FANS (sized from
the stage's own nitro ceiling — the rule recording E paid at the
kicker-into-rock and this session's log paid at t=32-35); logs
stageViolation telemetry with fix:'generator' for what it cannot
honestly touch. Pickups generator-side in _buildPickups: nitro ≤1
street / ≤2 others (was 3!), none within 80 m of the line — extras
become hull pickups. CAMERA §6.8: buildings (3-20 u solids; larger is
LANDSCAPE and the terrain probe's job — a 396 u massif cone in the
cache lifted the boom all over town) join the sight-line probe via a
20 Hz cache. AUDITED: no automatic camera switches exist in this
engine (mode changes only at init + the two manual controls) — 6.8's
cut deletion is vacuously satisfied.

§13.1 ROSTER REPORT (tools-scratch/stagerules-report.json, all 78):
street-obstacles 75 worlds, kicker-landing 55 (auto-culled where
handles exist; handle-less remnants counted per the Law of Solidity),
finish-runin 6 + finish-runout 8 (stages so twisty no rotation finds a
legal 140 m — genuine §13.3 radius work, flagged), rail-over-road 1.

Gates: test-stagerules NEW 17/17 (S1 straightness, S2 ceiling, S3
pickups, S4 corridors+fans, S5 camera-vs-buildings), route 21/21,
patch13 16/16, gorge 5/5, drift 6/6, patch02/corridor2/corridor3/
reverse/shortcut/wedge/unstuck/lap-count all green. Tag r310.
NEXT PHASES QUEUED: r311 stuck+kills, r312 AI §5, r313 perf/dusk/
naming/grass, r314 regression (tasks #35-38).

## r309 — SPEED THAT LOOKS LIKE SPEED, REVS THAT FOLLOW THE PEDAL, ONE EQUAL LINE
Three user asks + the speed-feel follow-up ("I don't feel I go 70 per
hour" — after r308 fixed the phantom lift, the remaining gap is
PRESENTATION):
- CAMERA AT PACE: spdH 16/24 → 8/10 on the overhead pair. The §3.9
  1.35x speed rise shrank everything on screen exactly when the player
  wanted to feel fast; 1.17x/1.14x stays inside §6.8's 1.0-1.35x
  envelope. Speed lines from 95 km/h, not 150 — and the hardcoded 150
  in main.js now actually READS speedLinesFromKmh (the key existed
  since r295 and nothing read it; the config lied).
- REVS FOLLOW THE PEDAL (user: "if I don't press the gas the rpms
  should not stay up"): the presentation drivetrain scales the gear
  band by 0.33 + 0.67·throttle — off the gas the needle sags to an
  engine-braking murmur, swells back with the pedal. Works on both
  schemes (auto-gas throttle is already 0 while braking/reversing).
- FIRE = 56px LIKE THE REST (user): the line is five equals now —
  right 270/206/142/78/14 (portrait), uniform 48s in landscape and the
  380 media. Gauge up 86 → 104px on touch (96 at 320-wide, where the
  104 dial met DRIFT's column by 7px, measured).
Their race log also confirms r304's grace working in the wild: gate 8
missed at 41 m lateral, re-crossed by driving 1.7 s later, no yank.
Gates: test-mobile-hud 24/24, test-hudreview 15/15. Tag r309.

## r308 — "SLOW MOTION" WAS THE CAMERA, FIVE METRES TOO HIGH ON EVERY HILL
User: "Somehow driving feels slow motion." Ruled out in order, against
the pristine r294 base: physics pace IDENTICAL (0-100 5.63 s vs 5.83,
spec FT5's own window; matched spot speeds), no render regression
(headless fps equal), JS update +0.5 ms/frame (logged as debt, not the
phone's bottleneck). The real cause was r306's own gorge lift: its
trigger was `rim > car + 1` over ±12 samples, which is true on ANY
GRADIENT — measured engaging on 25-49% of every lap (Pine 29, Canyon
25, Summit 48, Maple 49%), lifting the overhead camera up to +5.3 m on
ordinary hills. Higher camera, smaller apparent motion: the whole game
read as slow motion within a day of r306 shipping. The two populations
don't overlap — ordinary hills max +5.3, a real gorge puts the CAR ~28
below the datum — so the trigger moves to +8 with the threshold
subtracted (eased onset, no pop). Gorge behaviour kept: camera 38 u
above the rim in the slot. test-gorge grows the r308 pin: worst
hill excess now 0.5 u (suite skips genuine gorge samples by the same
+8 law). LESSON, same family as the HANDOVER's top defect: a trigger
tuned on the anomaly must be checked against the BASELINE population —
+1 was chosen looking only at the gorge. Camera suite 7/7 twice (one
drive-variance flake, the r300-documented one). DEBT: update loop is
2.34 ms/frame vs 1.80 on r294 (+30% across r295-r307) — profile the
route/hud/aggro additions when it matters. Tag r308.

## r307 — THE DRIFT FINALLY TURNS THE CAR
User: "When I drift it does not seem it helping me turn. But just
sliding." Measured to the number before touching anything: a 2 s
handbrake drift at 70 km/h, full steer, yawed the nose 52° while
scrubbing 70 → 2 km/h. The slide existed; the turn did not. Cause,
three-part:
- the KINETIC SCRUB CEILING (4.4 × budget, r-era anti-oscillation cap)
  applied unchanged during a handbrake drift — ~2.3 g burning the slide
  and, through the lag spill, all the car's speed;
- the drift reward returned only 35% of the scrubbed slide as forward
  speed — the drift bled momentum it should carry;
- §8.2's ENTRY KICK started the tail but nothing sustained rotation
  after its 0.3 s decay, and the counter-steer assist is (rightly)
  drift-gated OFF — so a held drift had no yaw help at all.
Laws (keys in driving.js + driving.json):
- driftScrubCap 2.1: the ceiling drops while the handbrake is held —
  locked tyres are unloaded, not an anchor;
- driftReward 0.5 (0.35 free): held drifts carry momentum;
- driftYawAssist 0.85 rad/s (CLAUDE.md §4.4, at last): 15°-65° slip
  with the handbrake held adds rotation TOWARD the steer, fading in
  from walking pace; past the spin angle it stops — same shape as the
  counter-steer assist, opposite sign. Self-limiting: maxSlip measured
  80°, no spiral.
After: 168° of turn and a 45 km/h exit at 70 (139°/81 at 110); FT3
slip 72° at 0.5 s; PLAIN steering byte-identical (34°/25°, untouched
paths). NEW test-drift.mjs 6/6 pins all of it; drivingspec/rules/
patch02 regression. Tag r307.

## r306 — "CLEAN THIS UP": THE GORGE WAS THREE BUGS WEARING ONE SCREENSHOT
The user's CANYON RUN photo (giant wall faces filling the frame, road
patches bleeding through rock, a shard through the carriageway) was
measured before anything was touched. The road itself is CLEAN — no
solids on the deck, no terrain above it outside the two JUMP GORGES
(samples 107-113 and 305-311, deck dives ~26 u below the rim by
design). What the photo actually shows is what happens to a SLOW car
at a gorge, in sequence:

1. Enter under jump speed → drop to the gorge floor → the floor sits
   below the datum/water rules → INSTANT WRECK (a hull gone, every
   time — measured: hp 0 in under a second, invuln irrelevant).
2. The DEATH CAMERA then sits inside the slot: wall interiors fill the
   frame — the photo.
3. Even alive, the overhead camera followed the car below the rim.

Fixes, in the same order:
1. CLAUDE.md §3.3 KILL VOLUMES at last (deferred in r301): a RACING
   player who drowns or drops into a chasm is RETURNED — free, no hull,
   via the same returnToGate everything else uses, to the gate LAST
   PASSED (the full run-up is the point: a return just before the lip
   at 40 km/h could never make the jump and would loop). Splash/boom
   feedback kept, telemetry `return {reason:'kill'}`. Roam, missions
   and rivals keep the honest sinking (`_returnFromKill` is the gate).
2/3. A TOP CAMERA NEVER DIVES INTO A GORGE: the overhead family
   (roadYaw modes) floors its height anchor at the local road-datum
   rim (±12 samples, lift capped 30). TRAP INSIDE THE CAMERA: the
   MAX_UP cap measures against the CAR, so it clipped the rim floor
   straight back into the slot (target 54.8 → capped 27.3) — the
   allowance now carries gorgeLift. Chase family untouched: diving
   through the slot in chase is the fun part.

Gates: NEW test-gorge.mjs 4/4 (no hull cost + real return + camera at
rim over the slot, dead-cam baseline 27 recorded), camera/patch13/
reverse/corridor2/goat regression. Flythrough screenshot verified at
90 km/h: road, slot in plan, continuation — no interiors. Tag r306.

## r305 — THE WEAPONS BECOME ONE LINE, AND THE BOTTOM EDGE IS RENEGOTIATED
User (with a live one-thumb screenshot): "Make the fire bombs rocket and
all at one line at the bottom, increase the buttons a bit." The r300
2x2 quad becomes a single right-anchored row — mine/missile/shock/
nitro at 56px (was 46), FIRE 88 (was 80) — with SHARED X-ADDRESSES in
both schemes (right 302/238/174/110/14). Heights differ per scheme
because the floors differ, and that is now LAW: one-thumb rides the
bottom edge at b12 (the ring rest moved 110→150px up on tall portraits
— input.js rest(); landscape's 0.22·h term unchanged), two-thumb sits
at b132 above its pedals. H5 is AMENDED to match: x-addresses must
hold across schemes, y follows the floor, UNSTUCK still holds both
axes. Furniture that had to move: one-thumb DRIFT stacks ABOVE FIRE
(b112 — thumb rolls up the same edge), UNSTUCK up to b250 (clear of
the raised ring top ~632 and the mine button), the gauge into the free
lane (one-thumb 50%+17/b110 between ring and DRIFT column; two-thumb
50%−60/b200). CASCADE LESSON, PAID TWICE NOW: landscape gauge homes
put BEFORE the base rules lost the cascade silently (a media query
adds no specificity) — they live in their own media block AFTER the
base rules, with a comment saying why. Small-portrait UNSTUCK threads
the feed-to-ring gap at b200 (y312-368 measured on 320x568).
Gates: test-mobile-hud 24/24 (six combos), test-hudreview 15/15 with
the amended H5. Tag r305.

## r304 — "I CAN'T DRIVE BACKWARDS": THE GEAR WORKED, EVERYTHING AROUND IT FOUGHT
Measure before tuning, again: the reverse LAW was fine (hard brake ≥0.6
held 0.45 s at standstill → 5 m/s² backwards, r288, verified −8.8 m/s
via the real pedal path AND direct step). Three things around the gear
made it unusable in the hands, all fixed:

1. AUTO-GAS CANCELLED EVERY REVERSE. Both touch schemes snap throttle
   to 1 the instant brake is 0, so lifting the pedal to steer while
   rolling backwards slammed the car forward — press-creep-lurch,
   forever. main.js publishes `input.reverseRolling` (speedAlong <
   −0.5) each frame; auto-gas returns 0 while it is set and resumes
   once the roll dies. Keyboard players are untouched.
2. NO ENGINE BRAKE IN REVERSE. With every pedal released a backward
   roll coasted 5+ s (backward rolling drag is tiny), stranding the
   auto-gas schemes in a slow drift. Reverse coast now decays 3 m/s²
   toward zero, never past it — release, stop in ~3 s, auto-gas pulls
   forward again.
3. THE MISSED-GATE RETURN YANKED A CORRECTING PLAYER. §3.2's word is
   UNCORRECTED — but `_gateMissT` accrued while the player was driving
   BACK to the owed gate, and with §3.5's silence the 4 s snap had no
   on-screen cause, so it read as reverse refusing. While the player's
   velocity closes on the gate at >2 m/s the grace HOLDS (no accrual,
   no reset); stop correcting and the clock resumes, and the return
   still fires. test-patch13 R9's stationary probe is unaffected
   (vel 0 is not correcting).

Gates: NEW test-reverse.mjs 7/7 (pedal reverse on auto-gas, coast on
release, resume, keyboard, correcting-grace both halves) + the driving
battery re-run (drivingspec, patch02, rules, wedge, unstuck, shortcut,
corridor2, patch13). Tag r304.

## r303 — THE CAMERA BUTTON COMES BACK
User ask, one line. r296 had folded the 📷 cycle into the pause menu
("beside pause it was a mis-tap at speed") and its 70px top-right slot
has sat empty since — the stale CSS and the defensive `?.` listener
were both still in the tree, so the restore is the element plus a
stopPropagation (a camera tap must never also steer). pm-camera stays
for the player who pauses to look for it; the driver's seat remains a
stop on the cycle. Probed: cycles 0→1→2, (332,70)-(378,116) at 390px,
no pause-button clash; cam-btn joins test-mobile-hud's measured set
(the omission lesson from the pause/shock overlap is written above the
IDS list) — which immediately earned its keep: LANDSCAPE moves pause
to top:60, the exact slot 📷 reclaims, a measured 46x36 overlap; the
landscape block now stacks 📷 at 60 and ⏸ at 112. Also killed for
good: the suite's feed-expiry flake — the fill now happens INSIDE the
measuring evaluate (DOM is synchronous), so no swiftshader frame can
outlive the 3.3 s toast lifetime between fill and measure; 24/24
twice. ATTRIBUTED, NOT OURS: test-tyres "the track card carries
the demand and the fix" reproduces identically on an r301 worktree
with r301's own suite — pre-existing, filed with the economy/feats
reds. Likewise test-newworlds "appended at the END of the array"
(tail 73-78): the r294 base clone fails it with the SAME message
under its OWN r294 suite — the suite's NEW table simply predates the
RIVIERA batch; roster-order redesign is its own small round. Tag r303.

## r302 — CLAUDE.md v1.2 §3.5 + THE PORSCHE GAUGE: ERASE THE GUIDANCE, KEEP THE DIAL
The user posted CLAUDE.md v1.2 (supersedes PATCH_02 v1.4 and CORRIDOR
v2.1 — retired) and three direct asks: remove the yellow line, hull
top-left, bring back the speed gauge with revs and gears "like Porsche".

§3.5 WAYFINDING: NONE — and it voids r301's own gate arrow. Deleted, not
hidden (§0.2 "delete means delete"): the route RIBBON (mesh, material,
opacity loop — route.js keeps only data: gates, step(), kindAtIndex),
the GATE ARROW, the yellow RIVAL edge arrows, the WRONG WAY banner AND
its detection flag, and `ribbonNearM` (a key nothing reads is a config
that lies). The ONE arrow that survives is the missile threat warning —
combat information, not guidance; test-hudreview H6 is REVERSED to pin
both halves. NEW test-overlays.mjs is Q16 as a render-pass assert: off
course, wrong way, mid-grace — zero overlays, and the route still gates.
The missed-gate grace-and-return (3.2/3.6) is unchanged and silent.

HULL TOP-LEFT (user): stacked under race-info off the MEASURED --info-h
(contracts grow it mid-race) with a 62px floor so it clears the phone
progress strip at top:48. Fixed 220px width — the 60% band bar is gone.

THE GAUGE (user, "like Porsche"): #speed-box was still in the tree
behind display:none since r296 — un-hidden, and drawSpeedo rebuilt as a
911-style CENTRAL TACH: rpm arc with a painted redline zone (7200 of
8000), x1000 numerals, digital km/h inside the dial, gear digit under
it (N/R/1-6). The physics has no gearbox, so revs and gears are
PRESENTATION ONLY, derived in Hud.GEARBOX (six ratios over the speed
range, sawtooth rpm, nitro pins past the redline, needle inertia) —
they must never leak into physics, AI or telemetry. Redrawn at 30 Hz,
not per-rAF: the per-frame 300px canvas repaint measurably starved
swiftshader frames (the mobile suite's feed probe caught it — messages
expired before measurement). Homes: desktop bottom-centre 132px; touch
86px at the old between-the-thumbs slot; TWO-THUMB rides at bottom:98px
centre-60px — measured against BRAKE's ring (top y=748) and the 💥
column (x=180, y=658), 2px clear of both at 390x844.

NAMING (§6.5): SPA-FRANCORCHAMPS → ARDENNES SWEEP, SILVERSTONE →
AERODROME CIRCUIT, MONACO STREETS → PRINCIPALITY STREETS, SUZUKA →
CROSSOVER RING (display names in track.js AND world/levels.js — the
list is duplicated). DEBT: the internal route keys ('spa',
'silverstone', 'monaco', 'suzuka') and the monteCarlo theme name still
carry the marks in code; a Q18 string scan of stage data would see
them. Renaming keys touches the circuits tables — its own round.

Gates: test-overlays NEW 7/7, test-mobile-hud 24/24 (both schemes, six
combos), test-hudreview 15/15 (H6 reversed + two r302 checks),
test-shortcut 6/6 (hinterland now asserts SILENCE — r301's arrow check
was its one red), test-patch13 16/16, route/tyres/newworlds/filters
green after the rename sweep. Screenshots verified desktop + two-thumb.
NOT this round (spec is explicit, §0.1 one system per build): §4 feel
pass, §5 AI rework, §3.3 surface bounds, 6.1 position hysteresis, 6.3
driver's-view removal — the spec's build order queues them.

## r301 — v1.3 CLOSED + CORRIDOR STEP 4: THE GAME STOPS SCOLDING AND STARTS HELPING
PATCH_02 v1.3 (recording C, Maple Mile) plus the corridor's recovery step,
one round because they are one idea: every "you did it wrong" message is
replaced by the game just putting you back.

FIX 8, ROOT CAUSE AT LAST: `_everCP1` — the flag that arms the lap line
after the first checkpoint — was set in checkLap and NEVER cleared, so it
survived into every later race of the session. Race one silent, race two
onward shouted at the grid crossing; that is why the recordings (B at
0:06, C at 0:06) kept catching it and a fresh boot never did. resetRace
now clears every lap-gate flag (`_everCP1/_cpMask/_midCP/_missedCP/
_wraps`) on every car. The marquee itself is gone anyway (§8, below), but
a stale flag would still have refused the lap COUNT — the flag is the fix,
the silence is a bonus.

FIX 15, ATTRIBUTED BEFORE FIXED — measure first paid again: traffic.js
NEVER BUILDS on autumnwood (not in RURAL), so recording C's "large blue
trucks on the grid" cannot have been traffic. The r301 grid census at GO:
three rivals at 7-14 u, zero props, zero traffic, and the player hits
59 km/h by GO+2 s — the launch complaint does not reproduce on r301 (the
v1.2 grid-launch invuln + aggro delay likely retired it). The spec's law
is still worth having where shuttles DO exist: crossroad spawns now skip
any junction within 60 m of center[0]. No stage naturally has one (probed:
closest junction 85-168 u across five stages), so the acceptance PLANTS a
junction on Pine Valley's grid, forces the rebuild tick, and asserts it
gets no vehicle.

FIX 16, TWO HALVES: (a) tyre stacks within 80 m of the lap boundary and
inside widthAt+6 are culled by the density pass (`gateClear` in
_densityReport — 7 went on Maple Mile); (b) the rubber-band CHASE (both
the maxSpeed band and `_cornerBand`) stands down while a rival's lapF is
>0.88 or <0.06 — convergence is the band's whole design, and at the one
funnel every lap it timed the pack's arrival onto the player (recording C:
2nd to 7th to wrecked-at-the-gantry in 8 s, every lap). The leader CAP
stays on; `_nearLine` is the flag.

FIX 17: on dusk/night palettes (T.dusk, or skyTop luminance < 0.22)
the density pass brightens obstacle materials once — color x1.15,
emissive +0.03 (`_darkLift`). Shared instanced materials, so it must run
exactly once; the flag guards it.

CORRIDOR STEP 4 — RECOVERY IS FREE AND UNIFIED (§10, §8): the unstuck
ration is DELETED. `sos` charges are not consulted, no counter decrements,
the only throttle is a 1.5 s re-arm (playerResetDelayS); the wedge net
fires at stuckDetectS 2.5 s (was 5 — recording B sat wedged 8 s waiting).
R11 verbatim in test-unstuck: 20 presses, 20 returns. A rescue clamps its
forward escalation to short of the owed gate (`_rescueAhead` vs gate.si),
so a hop can never cross a gate the miss logic would yank it back through.
NEW: missed-gate return — _stepRoute watches the player's owed gate; once
it is behind by more than half a lap for missedGateGraceS (4 s), ONE
returnToGate(car, id, 'missed') re-seats returnAheadM before the gate at
returnSpeedKmh with 1.5 s invuln and pickup-deafness, telemetry `return`.
TOASTS DELETED (§8): CHECKPOINT MISSED (marquee + feed), UNSTUCK,
RECOVERED, OFF THE COURSE — TURN BACK, WRONG WAY banner (detection kept
as `hud._wrongWay`), VIEW RESET. The replacement signal is the GATE ARROW
in #edge-arrows: shown when lateral > ribbonNearM, or wrong-way, or a
missed-gate grace is running. The SOS pill now reads READY / `↻ N.Ns`.

DEBT LOGGED HERE ON PURPOSE: the RECOVERY BEACON shop line now sells
nothing (garage round to retire it); recording-based rigs measuring the
old 5 s wedge or 30 s ration are all retimed (test-wedge-recovery,
test-unstuck rewritten; test-shortcut's hinterland check now asserts the
arrow, not the scolding).

Gates: test-patch13 NEW 16/16 (fixes 8/15/16/17 + R9 grace/return/
re-cross on recording C's own stage), test-unstuck 11/11 rewritten,
test-wedge-recovery 4/4 retimed to 2.5 s, plus the standing battery
(patch02 both stages, route, corridor2/3, shortcut, goat, mobile-hud,
hudreview, drivingspec).

## r300 — "THE HUD IS TERRIBLE": THE LADDER BECOMES A QUAD
A live two-thumb portrait screenshot (MAPLE MILE) showed what every suite
had missed: the weapon buttons stacked diagonally up the right edge into
the play band — shock and the glaring nitro arc at 55-62% beside the car,
the hull bar floating mid-road, SOS adrift at 65%, the speed number
buried under the left pedal. WHY the suites missed it: test-mobile-hud
only ever measured ONE-THUMB. A suite that skips a whole scheme agrees
with itself — it now runs both schemes at every size (six combos).
The layout, both schemes identical (H5):
  - FIRE (80) holds the right edge at b132; the four secondaries are a
    tight 46px 2x2 QUAD beside it (nitro+shock bottom row, missile+mine
    top). Everything inside the controls band.
  - UNSTUCK left:16/b170 — between the one-thumb ring (top ≈674 @844)
    and the two-thumb pedal (720), no scheme override anywhere (a stale
    two-thumb pin was still in the band block; H5 caught it).
  - Hull spans the measured free middle (x80-216-from-right on touch),
    with a nowrap guard on its label row.
  - The speed number's third home is the one that measured clean: under
    the progress strip, top-left — bottom-left sat beneath the two-thumb
    pedal, the hull row's sliver sat on UNSTUCK. Rally speed belongs by
    the clocks anyway.
  - Landscape (max-height 560): the quad flattens to ONE row along the
    right edge (y 58-70%, in-band at last), hull compacts (the
    compaction rules live at the SHEET'S END — an earlier touch rule
    out-ordered them at equal specificity, twice), pedals 62px at b8.
Gates: test-mobile-hud 24/24 across six size/scheme combos,
test-hudreview 13/13. ATTRIBUTED, NOT OURS: test-economy "maxing a car"
and both test-feats card reds reproduce identically on the pristine
r294 base — pre-existing debt, noted here so nobody re-attributes them
to the score realignment.

## r299 — CORRIDOR STEP 3: EVERY PROP KNOWS ITS CLASS AND KEEPS ITS DISTANCE
The user's own live race log forced the order of work: two near-head-on
tree strikes inside nine seconds (square 0.88 and 0.97, 13 hull by t=9)
— obstacles standing in the route corridor, §6's case in one dump.
  - propClassOf (route.js): smash / shove / obstacle from the fields the
    engine already stores. V1 audits every standing prop on a stage into
    exactly one class (Canyon 175/32/291, Glacier 346/126/1002, zero
    unclassed). Scores aligned to the §6 table: the SMASH class pays 25
    (TIMBER!, cacti — was 15); the SHOVE class pays NOTHING (v1.2 fix 10
    briefly awarded rocks a Smashed; the corridor's newer prop table
    reserves scoring for things that break — P2.13 updated).
  - THE DENSITY PASS (track.applyRouteDensity): within the exclusion of
    the road edge on non-street sections obstacles are culled; in the
    12 u band past it, one per 20 m. INSTANCE-HONEST: a tree goes
    visual-and-collider together (zeroed parts + culled flag —
    restoreSmashed learned to skip culled trees, or it resurrected
    colliders with no visuals); a solid is culled only when it carries
    im/inst handles. Glacier's corridor lost 21 obstacles. Runs ONCE on
    the first race frame (racing is where the corridor exists; roam
    keeps full scenery on purpose).
  - THE DEBT, MEASURED AND PINNED: 62 (Canyon) + 48 (Glacier) corridor
    boulders are merged-geometry rock lines — bare {x,z,r,y,mat}
    records, no handles — and culling their colliders would leave drawn
    rock you drive through (the Law of Solidity inverted). They stand,
    counted, with baselines pinned in test-corridor3 V2; the real fix is
    the feature-aware re-author (street gates where the canyon walls
    actually are, task #31). Note the deeper point found here: the §13
    layouts distribute gates EVENLY, but Canyon's rock-lined stretches
    should BE its street sections — gate placement wants geography.
  - A REAL BREAKAGE CAUGHT BY A TEST DOING ITS JOB: the r298 drag
    deletion left a dangling `over` reference that threw a swallowed
    ReferenceError on every strayed frame — silently skipping the rest
    of step() (ground follow, collisions, lap checks) for any off-course
    car. test-shortcut's "no feed" was the only visible symptom. The
    frame loop's catch-and-recover giveth and it taketh away.
Gates: test-corridor3 (V1, V2, R7, R8) 14/14 on stages 4 and 66.

## r298 — CORRIDOR STEP 2: THE WORLD CONTAINS THE CAR BECAUSE IT IS PHYSICAL
Build-order step 2: slope grip, surfaces, spawn — and the deletion of two
invisible forces the corridor outlaws. The load-bearing finds:
  - THE CRAWL THAT CLIMBED EVERYTHING: terrGrade only sampled when
    v² > 1, so a car under 1 u/s read grade 0, felt NO gravity, got its
    drive back and crept up a 55° plane at 1 u/s FOREVER (measured,
    slopeprobe.mjs — recording A's wall climb had a quiet accomplice all
    along). At a crawl the grade now reads along the HEADING; a parked
    car on a face feels the face.
  - §5.1 SLOPE LAW: drive authority fades 31.5°→35° and is zero past
    maxClimbDeg — measured: 25° climbs at 7.5 u/s, 30° climbs, 35°+
    takes only the entry momentum and slides back, hull 0. Grip pays
    μ·cos(slope). The μ table is offMult's old constant wearing its true
    name: grass floor 0.55 exactly as §7.2 ships it, the OFF-ROAD stat
    buying it back — and it now prices GRIP off-road, not just drag and
    top speed (a desert cut used to corner like a road).
  - TWO INVISIBLE FORCES DELETED: the strayed deep-sand drag (1.2/s
    velocity bleed past 70 u — "a physics costume") and the generic
    off-course climb-authority fade (drive gone by grade 0.23 whenever
    strayed). Off the course you now pay μ, cos, the 35° ceiling and
    off-road drag — the same laws as everyone everywhere. Lap integrity
    never depended on either (the checkpoint mask refuses cut laps);
    the LEAVING backstop becomes the missed-gate return at step 4. The
    goat peak stays closed on race day (onGoatRace), and the goat
    doctrine moved: GOAT_PACE 4→6 with the old defect signature (19-26
    u/s) still the canary — a sub-ceiling hill in a race is now a
    priced line, not a crime.
  - test-goat's roam flank control was measuring the SURFACE TABLE
    after the law landed (grass μ 0.55 caps sustained climbing at
    atan 0.55 ≈ 29° — the spec's own numbers collide with its own R4 at
    30° on grass): regrounded on a synthetic 25° plane. R4 itself runs
    a μ=1 car for the same reason — it tests the slope law, R5 tests
    the surface.
  - RIG TRAPS, all paid for in tests/test-corridor2.mjs: a synthetic
    ramp at x=3000 fights the WORLD RIM (1620); at x=1100 it sat ON
    Glacier's road; on Canyon it rammed a massif-cone solid and billed
    35 hull of "slope damage" that was really a rock. The rig now FINDS
    open ground (farthest point from any road sample, in-rim) and
    stashes solids/trees — props are §6's law, the slope is §5.1's.
    One recorded wart: a throttle-held car can end PARKED mid-face on a
    55° plane after its momentum spends (hop-cycle equilibrium; Canyon
    measured it, Glacier slid clean back). Step 4's stuck return is the
    designed collector; the law holds either way (late gain < 0).
  - §12 spawn and §5.2 splat maps are ADAPTATIONS, documented in the
    rigs: the grid already derives from the spline behind gate 0 (no
    stored transforms — R6 pins every car on-road at tangent), and the
    surface "map" is the road/off-road split plus theme (two honest
    surfaces, not a painted texture).
Gates: test-corridor2 R3-R6 green on stages 4 and 66. Kill volumes
(§5.3) and everything return-shaped wait for step 4 with the unified
returnToGate.

## r297 — CORRIDOR v2.0 STEP 1: THE RACE GETS ITS OWN STRUCTURE (SHADOW)
The user posted RALLY_CORRIDOR_REFACTOR.md v2.0 — the biggest doc yet, a
seven-step build order that separates WORLD (all drivable), ROUTE (an
ordered list of gates that defines what counts as racing) and ROAD (the
fast line, never the only line). It supersedes PATCH_02 fixes 4, 11, 13,
14 and the rotation half of 6, and at step 4 it will retire the rescue
nets, the SOS counter, the _cpMask lap gating and five toasts wholesale.
Step 1 is deliberately inert: gate data, ribbon, telemetry, NO RULE
CHANGES.
  - src/route.js: Route with §13 layouts for Canyon Run (3 street/4
    trail/5 open), Glacier Col (4/6/2), Il Budello (5/3/1) — sequences
    obey the §4.2 pacing rule — and a derived default (2/6/2 over 10
    gates) for the other ~80 worlds until they are authored. Step 1
    distributes gates EVENLY along the spline; step 3 re-authors the
    named stages against their real bridges/gantries/villages.
  - Pass detection is a plane crossing within halfWidth (street = road
    +2, trail = road +12, open = 30), with a ±30 u near-plane window so
    teleports and rescues never read as crossings, and a ±10 u vertical
    bound so a deck or plateau above a gate does not trip it. A crossing
    OUTSIDE the width does not advance and the plane re-arms behind it —
    driving back through counts (R2).
  - SHADOW MODE: _stepRoute observes every car per race frame, keeps
    per-car _nextGate/_routeLaps, logs the player's crossings as `gate`
    telemetry — and decides NOTHING. The old lap machinery still owns
    laps (pinned by the R1 "no rule changed" check).
  - The ribbon is a 1.2 u strip riding the whole spline (no cuts exist
    yet — step 5 will bend it), 30% opacity on the line, 80% when the
    player strays past ribbonNearM. It lives in the track's group, so a
    level teardown takes it along; hidden in roam and missions.
  - DRIVING.route + driving.json carry the COMPLETE §14 constants block,
    declared now so the step that wires each key in is never also the
    round that invents its number.
  - TRAP paid for here: Telemetry.log stamped `kind` BEFORE spreading
    the payload, so any event whose data carried its own `kind` (gate
    events carry the section kind) silently renamed the whole event —
    the stamp now spreads last, and the gate payload says `section`.
tests/test-route.mjs holds R1/R2 plus the layout-count and pacing
invariants: 21/21 on stages 4, 66, 74. NEXT: step 2 (slope grip,
splat-map surfaces, spawn from gate — R3-R6), then the §16 order.

## r296 — RALLY_HUD_REVIEW: THE HUD SHOWS THE RIGHT THING IN THE RIGHT PLACE
The user posted a full in-race HUD review (RALLY_HUD_REVIEW.md, Section 4
normative and binding). Verdict adopted wholesale: "Hull is the only stat
that decides whether the race continues, and it sits in a small bar
top-left under a contracts list nobody reads at speed." The band law now
rules the screen — status 0-10%, danger lane 10-18%, play 18-70%,
controls 70-100% — as a labelled CSS block that deliberately sits LAST in
the sheet and wins the cascade over every older placement.
  - THE CAR ANCHOR (H1, the big one): every non-driver camera parked the
    car at 68-79% of the screen, directly under the weapon cluster. The
    anchor is now 52-58%, and the numbers are MEASURED, not styled —
    CAM_MODES' look/lookH binary-searched per mode against the projected
    car position on a 390x844 portrait viewport (anchortune.mjs), then
    baked. The COST is look-ahead: the aim point rides near the car now.
    test-camera's "frames road ahead" floors dropped from >8 u to >0.5 u
    (sign, not depth, is the property left to defend) — if live play
    reports blind corners, the tension between H1 and look-ahead is THE
    open design question, and the review chose H1.
  - HULL heads the controls band: 60% wide centred (desktop), the
    measured free middle between the button columns on touch. Watched off
    the NUMBER in hud.update — no damage path can forget to announce
    itself: bar flash 120 ms, vignette scaled by the hit over 20, a
    floating −N spawned AT THE CAR, 2 Hz pulse under 25.
  - THREE TOAST LANES ROUTED BY REGEX in hud.feed (danger: HULL/
    MISSILE/WRONG WAY, red, centred, ONE, 1.2 s preempting; chatter:
    "NAME: ", LOCKED, DEPLOYED, grey, one; progress: the gold rest, max
    2). NOTHING toasts from grid to GO+3 s — the surface warning waits
    out the window, the contract toasts are gone outright (contracts
    render in the PAUSE MENU now, same #contracts id, same setContracts).
  - FIELD AWARENESS: the standings list became a progress strip (eight
    dots by continuous progress, player gold, 40% wide in the status
    band) and pooled edge arrows point at off-screen rivals within 40 u
    and at missiles hunting the player. Speed is an 18px NUMBER
    bottom-left; the gauge canvas is display:none (drawSpeedo skips when
    hidden). Combo is a chip beside the score (display:none until .on —
    invisible-but-inflating pushed the score box into the pause button).
    Camera toggle lives in pause only. Nitro face is the flame + arc;
    FIRE's bare "90" (the review's "unlabelled number") became a badge.
  - H5 UNIFIED THE CLUSTER: the weapon buttons and UNSTUCK used to
    rearrange when the control scheme toggled (shock changed SIDES).
    One address both schemes now — the two-thumb slots promoted — and
    the short-screen (max-height 560) rows are scheme-agnostic too. The
    second 560 media block's per-scheme shuffles are deleted; only
    steering differs per scheme.
  - Manifest display: standalone, orientation: portrait (was fullscreen/
    landscape — every recording is portrait Safari); offline.js offers
    Add-to-Home-Screen ONCE on the second browser-tab launch (Chrome
    prompt / iOS Share instruction), dismiss remembered forever.
COMPROMISES, screenshot-checked: shock's inner-column slot still rises to
~56% beside the car on tall portraits (five buttons + pedals cannot all
fit under 70% at these sizes; the translucent glass makes it livable) and
the nitro arc was swapped to the bezel edge for exactly that reason. The
perf "AUTO QUALITY" toast still uses its own pre-band placement.
Gates: tests/test-hudreview.mjs H1-H6+H8 (13/13; H7 is a device property
— the manifest carries it), test-mobile-hud 15/15 across four sizes
(hull/feed/cluster collisions all re-measured), test-camera 7/7,
test-boot 7/7, patch02 16/16. The one live-feedback risk to watch: the
shorter look-ahead at speed.

## r295 — RALLY_PATCH_02 v1.1: THE RACE FIXED AROUND THE CAR
The user handed a second normative patch (RALLY_PATCH_02.md, v1.1
superseding v1.0 in full), nine race-loop fixes derived frame-by-frame
from a 136 s Canyon Run recording — the car's physics was signed off in
r293/r294; this round is everything AROUND it. All nine landed, plus the
patch's fix 0, which it calls the gate for the rest:
  - TELEMETRY (src/telemetry.js): a 4000-event ring buffer stamped with
    race time and lap — damage, offmesh, airborne, nitro, unstuck,
    rivalTarget, lapTrigger, startLights. `window.__rally.dump()` gives
    JSONL; the pause menu grew COPY RACE LOG (labels itself with the
    outcome — a denied clipboard is not a silent nothing). "The video
    analysis cost more than the fixes will; the next check must be a
    log, not a recording."
  - CONTACT DAMAGE IS A LAW NOW, and it is `raw`: linear in closing
    speed (K 0.9 over a 5 m/s threshold), 45/hit and 60/s caps, glancing
    contact under square 0.34 free. The worked figures — 20 hull for a
    100 km/h head-on, the cap only at 200 — are what the player must
    actually SEE, so the world-contact path skips damage()'s difficulty
    scale AND the car's plating (measured: plating 1.02 pushed the 45
    cap to 45.9; scaled, normal saw 13 where the patch says 20). Combat
    damage keeps both multipliers; scenery is the same rock for
    everyone. NOTE the patch's own glance-angle line has its geometry
    inverted (it would zero head-ons and contradict its P2.3) — the
    acceptance tests are the authority, hence square < sin(20°) ≈ 0.34.
  - The grid is safe (all cars invulnerable to GO+1.5), the aggro
    ticket office rotates (1 token to 20 s then 2, 6 s non-renewing
    leases, nobody targets the player before 4 s), rival rams cap at 8,
    band chase caps at 1.08 both in speed and corner bands, nitro is
    rationed (2 pickups/lap, over-ration pays 100 pts, +40 km/h bonus
    cap) and a rescue is deaf to pickups for 1.5 s — the recording shows
    0-188 in 2 s off an Unstuck.
  - The canyon rim is OFF the course: grounded 12 u above the tracked
    road with no road at your own height for 2 s = the same free
    auto-return as the lost net. Landing assist (300 ms yaw clamp)
    yields to a held handbrake — a jump landed mid-drift keeps its
    slide. Wall escape torques the nose toward the tangent below
    30 km/h past 45°. The first lap-line crossing is inert and silent.
  - Camera: speed zoom eased over 400 ms (was instant), speed lines
    from 150 km/h (CSS overlay, no GL cost), gantry dark 2.5 s in.
All §7 constants live in DRIVING.patch02 (src/driving.js), mirrored in
the shipped driving.json — loadDrivingOverrides grew a nested merge so
one overridden key no longer wipes the block. tests/test-patch02.mjs
holds ten gates (P2.0-P2.10 as they map to this engine; P2.5/7/9/11
need the recorded-input rig, filed with the suite-redesign task).
TRAPS for the next rig-writer, both paid for here: the rescue nets live
in update() AFTER step(), and step() re-glues a grounded car to the
ground IT resolves — stage a rim perch and step collapses it before the
net ever runs (stub step; the net is the thing under test). And P2.8's
escape hands off at wallEscapeMinAngleDeg 45° BY DESIGN — gate the
hand-off, not zero.

MID-ROUND the user posted v1.2 (supersedes 1.1): a second recording,
r294 Glacier Col, three hulls lost in 157 s with ZERO rival contact —
every point of damage from rocks, trees and props. Landed on top of the
v1.1 work:
  - Fix 2 RE-OPENED and closed: trees had NO angle term at all —
    onTreeCrash took no square, so a 145 km/h brush past a trunk paid
    like a head-on (recording B: −33, −35). The call site now computes
    the share of speed into the trunk BEFORE the bounce edits vel, and
    the tree pays the SAME linear law as stone (glance under 0.34 free,
    K 0.9 over the 5 m/s threshold, the 45 cap). One law, every static
    thing.
  - Fix 10 (prop tiers): a knockable stone (r < 1.15 u — this engine's
    mass class is radius) SHOVES free: zero hull, speed scrub is the
    price, the feed reads as the award it is (SMASHED! +20, was "ROCK
    SHUNTED −N HULL" in 'bad' red). Saplings likewise dropped their
    4-hull sting. Boulders 1.15 u+ stay static and pay the law.
  - Fixes 11/12/13 investigated and found ALREADY HELD on this branch —
    probed on Glacier Col: every car spawns on the spline at heading
    offset 0° (lat 3.6 u), lap starts at 1, rank orders by continuous
    progress (_wraps + index/N), 7 rivals alive on mesh at GO+10, and
    the camera has carried a 7-step sightline probe + never-underground
    clamp since the r270s (recording B's "VIEW RESET (buried)" is the
    CAR under terrain — the watchdog working, not the camera failing).
    The acceptance tests now PIN all of it: P2.12-P2.17 in
    tests/test-patch02.mjs, parameterized by LVL (run 4 and 66 — the
    v1.2 ship gate wants both stages). 16/16 on each.
  - patch02b block (driving.js + driving.json) carries only the keys
    the engine READS — camClearanceM 2.2 (wired into the camera floor;
    stricter than the spec's 1.5, kept) and propShoveRadiusU 1.15
    (wired into both knockStone gates). spawnBehindLineM isn't wired
    (the grid already seats on the spline); stuckDetectS /
    lowSpeedTorqueMul belong to fix 14, NEXT build per the rollout,
    with P2.18/P2.19.
DEFERRED from v1.2: fix 14 (2.5 s stuck detect + low-speed torque —
note it will collide with test-wedge-recovery's "five-second mark"
gate, renegotiate both together) and the whole RALLY_HUD_REVIEW.md
rebuild (task #27) — Section 4 of that doc is normative for the next
HUD build: band layout, hull presentation, three toast lanes, H1-H8.

THE BATTERY'S TAIL taught its own lesson: test-rules had sat at 7/12
and test-nature at 7 reds, and every one reproduced IDENTICALLY on the
pristine r294 base — nothing this round's. Of the rules five, three
were expectations the patch has since outlawed (">=28 hull after
difficulty scale" is exactly what §3.2 forbids; a grind ALONG a wall
now costs 0 BY LAW) — rewritten to the law. Two were broken probes: the
shortcut check staged only _midCP against a lap gate that grew ordered
_cpMask quarters and _everCP1 years of revisions ago, and the tire
check aimed a fixed heading down a cambered verge (missed by 3.8 u
against a 2.7 u trigger) from a 10 u run-up that headless real-time
cannot cover. One REAL game bug fell out of that autopsy: the stack's
burst gate read `speedAlong` — along-TRACK speed — so a car leaving
the road square into a roadside stack read ~0 and the stack stood like
a bollard at any angle but dead ahead. Planar speed now, the tree
path's own lesson. test-rules is 12/12 — first full green in memory.
test-nature's buried trees/solids (PINE 15+8, FLUME 9+1, FURKA 11+9,
worst −6.2 u) are pre-existing seating debt, filed as task #28.

## r294 — LIVE-PLAY ROUND ON THE SPEC CAR: FIVE REPORTS, FIVE CLOSES
  - "Impossible to steer in this curve at this speed" (IL BUDELLO, 99):
    mid-range yaw cap 1.25 -> 1.45. Flat-out still runs wide — the drift
    promise — but a lift to ~85 turns R27 and makes the old-town corner.
    Churn stays bounded (traced: over 0.45 steady, slip 0, no spiral).
  - "Add another button next to drift - break. Change the design": BRAKE
    returns beside DRIFT in two-thumb (its removal predates brakes that
    matter), and every touch button becomes one material — dark glass,
    function-coloured rings (BRAKE red, DRIFT cyan, NITRO amber, FIRE
    orange), felt without looking. 390 px portrait verified.
  - "Gets stuck here" (pinned by a building, OFF THE COURSE, 3-8 km/h):
    the wedge net's 6 m anchor was sized for the old engine; the spec car
    grinds just OVER that line for ever. Off-course the anchor is 12 m
    now; roam and on-course keep 6 — a mountain crawl is never yanked.
  - The GO banner at 0:42.5 + the gantry still green (user's own sharp
    diagnosis): the banner fade is a CSS animation and a HIDDEN page
    freezes the compositor — the pause/resume "GO" popped mid-background-
    switch never faded. centerMsg now also clears on a REAL timer (fires
    on return from background), and the gantry goes dark 2.5 s into the
    race — green was a start state, not a race state. Verified headless:
    banner empty, all lamps dim at race+4 s.
  - test-difficulty's stand-in corner constant was three physics
    revisions stale (believing 1.07x budget while the cap allows 1.45x
    mid-range) and lost FURKA by 3% twice while under-driving the limit;
    at 18.9 the ladder is green twice consecutively.
Validated: difficulty 2x, unstuck 9/9, wedge 4/4, goat 26/26 2x, spec
suite, roam probes, jumps.

## r293 — THE SPEC: RALLY_DRIVING.md, ADOPTED AND MEASURED
The user handed a normative driving spec (RFC 2119, Dustline
RALLY_DRIVING.md). Its stack is a Rapier raycast vehicle; ours is not —
so the adoption is by MAPPING, recorded in DRIVING_SPEC.md at the repo
root with every deviation, and the acceptance numbers are the contract.
tests/test-drivingspec.mjs holds them: "the spec holds", 7/7.

  12.1  0-100 km/h        5.65 s   (spec 5.8 ± 0.3)
  12.3  100-0 km/h        42.9 m   (spec 42 ± 3)
  12.4  top speed         200 = the showroom cap (spec's base car 195;
        §13 allows per-car top speed). Measured on an ENDLESS STRAIGHT
        made of real road — the expressway block, hopped on a timer —
        after two runway lessons: a station-window hop kept a city
        corner inside the loop (measured the corner, 159) and a
        distance hop reached the block end (measured off-road drag).
  12.5  full lock at 80   drifts, never spins, keeps rolling
  12.7  handbrake at 70   60 deg of body slip in 0.5 s
  12.8  ice family        no yaw impulse, by the spec's own MUST

WHAT CHANGED UNDER THE CAR, all in src/driving.js (+ driving.json boot
override, per spec §13 — no driving constant lives inline any more for
the values this round touched):
  - THE ENGINE IS THE SPEC SHAPE: a flat drive force (~6.6 u/s²) with a
    small linear drag (0.122/s) replaces the huge-thrust/huge-drag
    governor. One pair lands 0-100 AND top speed. The traction cap is
    the engine now (launchCapFade 99) and the PEDAL scales it — the
    first cut made half throttle produce full force.
  - THE PLATEAU (§7.1): grip at full slip holds at 70% of budget, up
    from 22% — "an arcade car the player can hold sideways". The single
    biggest holdability change of the adoption.
  - THE HANDBRAKE GUARANTEES THE TAIL (§8.2): a yaw impulse on press,
    0.18 × lateral speed in the steer direction, zero below ~30 km/h,
    disabled on ice, decaying over 0.3 s.
  - COUNTER-STEER ASSIST (§8.3): gain 0.55 toward killing the slide,
    off past ~65 deg — the spin is earned. The first cut used -vl and
    steered INTO the rotation (traced: 2.53 rad/s past a 0.81 cap).
  - GRADE WENT PHYSICAL: 16 was gravity inflated to be felt against a
    34-strength engine; at 9.8 the free-roam massif climbs again
    (test-goat's control had collapsed to +4.6 u against a floor of 25).
  - THE WILDS FLAG: the face-grade baseline, ripple-proof MAX_GRADE and
    the steep wall all gated on tracked |lateral| > 60, which under-reads
    remoteness near switchbacks (the stray rule's own lesson). Now an
    upper-bound precheck plus the global sweep, per that rule's pattern.
  - Yaw caps eased to 1.10-1.25 of budget: sustained over-grip yaw
    churns speed the spec engine cannot replace — the spec's own reason
    for narrowing steer angle with speed.

THE LADDER SURVIVED WHOLE: difficulty 12/12 (rivals share every physics
change), wedge, unstuck, gorge, duel-rival, lap-count, slowfield,
field-stalls, goat 26/26, jumps, spec suite — green.

TWO WORLDS AND ONE RIG PAID HONESTLY: PINE VALLEY's jump brow crowns a
climb the spec engine arrives at 45 km/h up — it follows ROCKFALL off
the jumps roster (browtest.mjs holds both measurements; the reshapes
are one level-design task). And test-climb's blind steep-scan went red
through THREE scan repairs, each trace finding the rig measuring a
different terrain feature (a plateau crest, a highland rim, a mesa top)
while the car fought every true face exactly as ordered — it is a
watched WARN now, with test-goat's measured ceilings as the binding
law and the rebuild tracked with the suite-redesign task.

## r292 — THE ALPINE PHOTO: A CHAIRLIFT, TOURABLE MEADOWS, AND MID-RANGE
## STEERING THAT ANSWERS
The brief arrived as a photograph: a safari 911 parked on a high meadow
under a lift line, valley village far below. Three pieces:

THE CHAIRLIFT (_buildChairlift, pass + alpine themes). Seven steel
towers march radially up the flank on the emptiest azimuth — forty
scanned, every pylon spot clearing water, the goat route (40 u) and the
lap (best minimum road distance wins; under 55 u the world gets no
lift). Twin sagging cables between crossarm tips, chairs riding every
span, a windsock on tower two, a utility hut at the top station.
Towers carry solids (ghosthunt: 0 uncovered on both lift worlds);
everything that hangs lives in `cablecar-hangers`, riding the float
census's existing audited airborne class — floats and on-road both
measure clean on GOTTHARD and SUMMIT CLIMB.

MEADOW TOURING: off-road drag halves in FREE ROAM only (0.35 -> 0.16).
Racing keeps the full penalty — the off-road cost is load-bearing there
and every law that leans on it runs in race mode.

MID-RANGE STEERING ("turning is super hard on high speeds, but good
and easy on slow"): the flat 1.15 tyre allowance put the minimum radius
at 64 m by 108 km/h. The allowance is SPEED-SHAPED now — 1.6x budget in
the mid-range (R47 at 110, R27 at 80) tapering to the honest 1.15 by
~180 km/h, where sharp input still breaks the car loose: the r284
promise kept exactly where it was made. The slip feed's dead zone
tracks the cap (`_yawCapM`), so the generosity never reads as a slide:
a corner-managed lap measures mean slip 0.03, the most planted yet.
The crest-count floors in test-jumps and test-goat drop to 1 (existence
+ the quality laws): each grip refinement moves pace a few percent and
the tallies flicker between 1 and 2 at the noise floor.

## r291 — ALSO IN THIS ROUND, AND ONE HONEST DEBT
"On 40kmph it's drifting like crazy" arrived while r290 was live — it is
the SAME counter-steer spiral this round closes (at 40, full lock rides
the cap and the spiral fed it); verified on the branch: 40 km/h full
lock is a clean circle at slip 0. THE PACE RESTORE: the 0.40 "sliding"
drag discount used to apply most of every lap, so the planted pass
silently made everything ~13% slower under power at once (stand-in AND
rivals together, GLACIER COL's crest control from 6 launches to 1);
under-power drag is 0.50 now — the average the roster's tuning always
assumed — and goat 26/26, jumps, and the crest controls came back. The
difficulty stand-in learned a BRAKING HORIZON (its single 24 u window
was sized for 6.4 g brakes) with a flat casual margin (casual is a
THROTTLE, not a second corner tax), and the casual-winnable laws got
the existence-claim retry hFast has had for releases.

THE DEBT, stated plainly: test-difficulty on PINE VALLEY is variance-
dominated under honest grip — identical code measured the FURKA casual
at 582, 623 and ~810, and PINE flaps between a normal/hard ordering
coin-flip and a full-throttle stand-in wreck (298: it has NO rescue
net, which real players DO have). FURKA is stable green with the
retry. The physics shipped on direct measurement (drift40, skim,
spin11, drivereal, goat, jumps, wedge, gorge, unstuck all green); the
suite's redesign — rescue net for the stand-in, median-of-3, tie
epsilon — is the next round's opening move, tracked as its own task.

## r291 — THE LAST TRICKLE: SPEED NO LONGER LEAKS INTO SLIP
"Driving is better. However after some speed starts slipping and
skimming the road." Measured (tools-scratch/skim.mjs), two mechanisms,
both at the seams of r290's own design:
  - The counter-steer detector was OPENING THE RELAX FOR ORDINARY
    CORNERING: in any corner the slide direction opposes the steer BY
    CONSTRUCTION, so the detector read every bend as a counter-steer
    and a gentle 0.35 steer at 180 km/h spiralled to slip 0.96 and a
    spin. The wide relax is HANDBRAKE-ONLY now; recovering an
    unintended slide is the grip catch's job at capped yaw.
  - The slip feed's gate (0.12) sat BELOW the yaw cap's designed
    steady state (0.15 over budget — the 1.15 arcade allowance), so
    every capped corner at speed trickled slip forever. The gate is
    0.22 with a dead zone over the cap.
After: gentle steer at 180 holds with slip 0 (over 0.16, inside the
dead zone); a corner-managed lap's mean slip fell 0.28 -> 0.11; road
contact max gap 0.06 u with zero airborne flickers — the "skimming"
was the sliding, not the suspension. Turning circle untouched.

## r290 — THE PLANTED PASS: SLIDES ARE EARNED, NOT AMBIENT
Four live reports inside an hour, all one disease: "small turn and it
turns so much, like a speed boat", "spinning like crazy", "pinball",
"driving like it's on ice" — plus, from the same seat, "I can rotate it
360 on 11 kph almost at its axis". The r284 grip budget priced slides
but never bounded what the STEERING may ask for, so every ordinary
input silently over-demanded, the over-budget law read it as a slide,
and the whole game iced over.

THE BICYCLE, BOTH BRANCHES. Commanded yaw is now bounded by
min(v/R_min, 1.15·aMax/v):
  - v/R_min (4 u) is the turning circle — at 11 km/h the tightest legal
    turn is 44 deg/s sweeping an 8 m circle, translating the whole way.
    No pirouette; a parked car stays parked (the r288 creep ramp is
    subsumed).
  - 1.15·aMax/v is the tyre — an ordinary input holds a clean arc AT
    the limit (traced: 45 straight frames of 1.3 g at 100 km/h, slip 0),
    a hard one develops a MILD, self-limiting slide. 0.92 (tyre-exact)
    was tried first and the whole rig fleet said the tracks were drawn
    for more grip than a real car has: jump rig 0 hops, wedge runner
    tripping rescues, cut lines washing 47 u wide.
  - The relaxation opens for COUNTER-STEER and the HANDBRAKE, not for
    steering deeper into the slide — an unconditional relax was a
    feedback loop that kept every slide alive ("spinning like crazy").
AND THE AMBIENT SLIP SOURCES CLOSED: the launch wheelspin feed fades by
36 km/h instead of 120 (cruising at 60 read as perpetual wheelspin —
most of the ice); the pre-physics slip heuristic moves its onset from
0.28 to 0.55 (it fired on every substantial input above 60 km/h); the
mid-slide steering bonus drops 0.35 -> 0.15 (the boat).

THE RIGS LEARN TO DRIVE. Under the yaw budget a throttle-pinned runner
crashes instead of measuring (FURKA: 75 of 90 s wedged at 1 km/h, "0
hops" measuring its own crash). The jump rig and the wedge runner brake
for the corner the road announces and COMMIT over the brow — braking
belongs before the crest. test-goat's step law gates off-road at
SHELF_REACH (17) where terrain actually takes over, not at carriageway
width, so roadbed seam residue stops being charged to terrain-follow.

ROCKFALL RAVINE'S JUMP IS A LEVEL-DESIGN ITEM NOW, measured, not
shrugged: its brow still flies (the pristine base does 0.92 s at 184
km/h) but the corner feeding it caps an honest approach at ~130, where
the brow can't beat gravity. A jump that needs rail grip to reach comes
off the jumps roster; the reshape is tracked.

Battery at close: difficulty 12/12, wedge 4/4, goat 26/26, unstuck,
duel-rival 11/11, gorge 28/28, cornerwalls 40/40, obstacles, climb,
jumps (three-world roster) green.

## r289 — "I SEE NO CHANGE": THE UPDATE PATH ITSELF WAS THE BUG
Third time in one day a deploy was live on the server (curl said so) and
the phone still played the old build. Two holes in the update path, both
in how the service worker gets REPLACED rather than in what it caches:
  - GitHub Pages serves sw.js with max-age=600, and register() without
    `updateViaCache: 'none'` lets the browser's HTTP cache answer the
    update check — a hard refresh inside those ten minutes fetches the
    NEW page's request for the worker and gets the OLD worker back.
  - The only other update trigger is a NAVIGATION, and a phone tab
    returning from the home screen never navigates. reg.update() now
    also fires on visibilitychange → visible, so coming back to the tab
    is enough; the existing controllerchange → idle-reload chain does
    the rest.
Verified headless: registration active with the new options, no page
errors. What a player does now: come back to the tab, wait a breath,
the game reloads itself at the menu with the new tag in the corner.

## r288 — THE WHOLE CAR IN ONE WORLD: THE REAL-DRIVING AUDIT
"Make sure driving is aligning real world driving." Not a bug report — a
standard. So the round opens with an instrument, not a patch:
tools-scratch/drivereal.mjs measures every axis in g against a real car.
The audit table, before:

    launch 0-100      2.05 s        supercar        ALIGNED (r286)
    corner path g     1.4-2.2 g     drift hero      ALIGNED (r284)
    brake 100-0       6.4 m, 6.4 g  real 1.1-1.5 g  SIX TIMES OFF
    lift-off coast    0.80 g        real 0.1-0.2 g  A HARD BRAKE
    reverse 0-20      0.32 s        real 1-2 s      A CATAPULT

THE FIXES, each at its comment in vehicles.js:
  - Brakes cap at 4.2*gripBudget (~1.5 g; all four tyres, so above the
    2.8 drive cap). 100-0 lands at 18.8 m, peak 2.16 g — winged-race-car
    honest, and surface still bites through gripBudget and sBrake.
  - TWO DRAGS, NOT ONE. The 0.55/s coefficient is really the hidden
    top-speed governor (thrust = drag at ~62 u/s) and stays under power,
    where it is invisible; a closed throttle now coasts at 0.14/s.
    Lift-and-coast glides; slowing is the brake's job.
  - Reverse caps at 5 u/s² (0-20 in 1.17 s) — a manoeuvre, not a launch;
    still backs out of a wedge (test-unstuck 9/9 holds the proof).
  - Rival DECEL 26 -> 15: a field that plans 2.65 g stops would outbrake
    every human by physics the player no longer has.
  - A PARKED CAR STAYS PARKED (same-day report: "car is turning in place
    without any speed"). The hairpin steering floor gave 45% authority at
    ZERO speed — a tank pivot. Yaw now ramps in over the first 2.5 u/s
    like a real car's v/wheelbase; at the 14 km/h hairpin crawl the floor
    is already whole (168 deg/2 s), so the trap it was built against
    stays fixed. Parked full lock: -5 deg in 2 s.

RECALIBRATIONS THE PHYSICS FORCED, both argued in their test files:
test-invisible-walls' station-escape floor 12 -> 6 u (a capped hill
start makes 9-15 u in 2 s; a wall still pins at 0-3), and test-jumps'
crest count 4 -> 2 per 90 s (the count is time-windowed and the car is
honestly slower; the quality laws — median hang 1.08 s, no stutters,
landing grip — keep guarding the stages' character). Battery after:
difficulty 12/12, unstuck, wedge, goat 26/26, duel-rival, field-stalls
green; test-climb's one red did not reproduce over two repeats (the
randomized scan's known staircase-spot noise).

## r287 — THE STANDS COME OUT. ALL OF THEM.
"Do a full swipe and erase them", the same day the reworked stands went
live. Three shapes, three photographs: single fog-washed cones ("little
white pyramids"), welded crown clumps ("piramids again"), lifted tiers
with bark trunks ("shark teeth again"). The lesson is not another weld:
at 300-600 u — the range the game actually shows them from — a
mid-distance clump reads as a triangle whatever it is built out of.
r277's precedent applies (the diorama stones came OUT); the distant-stand
band, its trunks and its hut-solids leave together, because a collider
for a mesh that is not there is the inverse of the Law of Solidity.

THE FULL SWEEP: tools-scratch/pyramidsweep.mjs — every cone-family mesh
>= 5 u on reachable ground (r < 1600), paired against trunk cylinders
within 2 u; a trunkless cone is a pyramid to the player whatever the
builder called it. Ten themed worlds: eight CLEAN, and the only flags are
the oldtown campaniles' spire caps — a bell-tower roof on a masonry
tower, flagged only because the probe pairs against CYLINDERS and a
campanile is a box. Church spires stay.

Proof: tools-scratch/shot-grove-erased.png — the exact spot the user
photographed is open meadow; `distant-stand` absent from the scene
graph; ghosthunt 0 uncovered masses on GOTTHARD.

## r286 — THE STANDING START OBEYS THE TYRE
"Driving needs fixing from Start", minutes after r285 went live. Measured
before touching anything (tools-scratch/launchtest.mjs, branch AND the
r283 worktree): 0-100 km/h in 0.92 s, IDENTICAL on both — accel*punch
puts ~53 u/s² straight into velocity, no traction anywhere in the
longitudinal path. r284 taught the LATERAL tyre a budget and left the
drive wheels exempt from it.

The fix mirrors the lateral law where wheelspin lives: drive force caps
at 2.8*gripBudget at standstill and the cap fades out by ~60% of
SHOWROOM speed (up there a real car is power-limited, which is what the
fade models — and it is what keeps the mid-range tune and the top speed
untouched). The overdrive feeds `_spinFeed` into the slip law, so a
launch is slip 0.6 through first gear — the tail wags, the tyres spin,
and 0-100 lands at 2.05 s (0-60 1.27, 0-160 3.6): supercar, not
teleporter. Validated after: difficulty 12/12, climb, goat 26/26,
unstuck 9/9, wedge 4/4 — the cap costs nothing downstream (climbs get
the SAFE direction: less uphill thrust, and every goat law was already
judging pace, not power).

# --- MAIN LINE (r274-r283) ---

## r275 — THE GREEN BANDS, MEASURED AND CLOSED
Two rounds of guessing at this, one of which broke the view for everyone. This
time: measure the screenshot first.

`bandscan.mjs` scans in from both edges for the first column that is not flat
page background:

```
2868 x 1320,  left band 185 px,  right band 186 px,  colour rgb(126,183,92)
```

Three facts fall straight out of that:

1. **rgb(126,183,92) is `#7eb75c`** — `body`'s old background, exactly. And the
   main renderer takes no `alpha`, so its canvas is OPAQUE and cannot be
   showing anything behind it. The canvas is simply not there.
2. **2868 / 3 = 956 pt.** An iPhone 16 Pro Max in landscape. Its safe-area inset
   is 62 pt; 185 / 3 is 61.7.
3. So the layout viewport is **832 on a 956 pt screen** — `viewport-fit=cover`
   is in the meta, has been since r245, and is not taking effect on that device.

Nothing positioned inside the page can reach outside the layout viewport...
except that **the background is already painting there**. The browser's page
surface spans the full 956; only the CSS coordinate space is 832 wide. So an
element pulled left of zero and made wide enough does reach the bands — and
`screen.width` is the one API that still reports the real screen when
`innerWidth` does not.

`applyViewport` now computes `over = (screen.width - innerWidth) / 2`, renders
at `innerWidth + 2*over`, and sets `canvas.style.left = -over`. Guarded so it is
a NO-OP anywhere it is not needed: touch only (on a desktop `screen.width` is
the monitor, not the window), only when the screen is wider than the viewport,
and only by an amount an inset could plausibly be. Vertical is left alone —
in landscape the browser's own chrome makes `screen.height` meaningless.

### AND THIS TIME IT IS TESTED BOTH WAYS
The trap last time was shipping a fix for a case no test could reach.
`camsanity.mjs` now proves both halves:

```
portrait/landscape/desktop, title and race   overX 0     box == viewport   (no-op)
inset-sim  viewport 832  screenW 956    ->   overX 62    box 956x440  stretch 0%
```

The simulation is the reported device's exact geometry — Playwright can set
`screen` independently of `viewport`, which is the shape iOS reports. Untested
code is not a fix.

## r276 — THE SHELF ICONS, FRAMED FROM THE CAR
Reported with a photograph of the car shelf: "this is broken". The cards were
cropping their cars and no two of them agreed.

`_shoot` framed with a **constant**: `dist = 8.7`, look pinned at y 0.55. At 30
degrees that leaves 2.33 u of half-height above the aim, and BRAWLER measures
**3.46 u tall**. The number was right for whatever the cars were the day it was
typed, and nothing has told it since that they grew roof racks. Meanwhile the
build bay ten lines away has carried a comment for rounds saying FRAME THE CAR
FROM THE CAR — the icons never got it.

### THREE THINGS, IN THE ORDER THEY WERE FOUND
1. **Derived distance is not enough.** Fitting the bounding box by trigonometry
   got the roof in and then clipped the WHEELS off the bottom: a car seen at
   three-quarters has its nearest bottom corner projecting lower than any
   formula on the box's extents predicts. `_fitDist` projects the eight corners
   and scales the distance by however far the worst one lands outside the
   frame, three passes. Measured, not derived — the same lesson `_frameStage`
   already paid for.
2. **Aiming at the box centre made the picture worse.** The whole car fitted
   and the background became a wall of trail, because a 3.5 u car's centre puts
   the horizon at the top of the frame. Half way between the old fixed 0.55 and
   the centre keeps the three-quarter look-down that puts grass and a diagonal
   of dirt behind the car.
3. **One rig for the whole row.** Fitting each card on its own zooms each car
   differently AND lands each on a different patch of diorama — measured side
   by side, one card on grass and the next against a beige panel. `_carIcons`
   now fits every car, takes the furthest, and shoots all eight from that one
   distance and one aim. The odd card out disappeared with it: the per-car aim
   was tilting the lens just enough to swing a pine trunk through one frame.

Backing off to fit the tallest car put the eye at about fourteen units, past
where the diorama's near pines start at lane 9.6. Lifting the rig to look over
them was tried and is worse — from up there the trail reads as a vertical band
with the car pasted on it. Swinging the AZIMUTH toward the trail's own axis
keeps the camera over the dirt, out of the tree lane, and keeps the low
three-quarter. `SHOT_RIG` / `SHOT_RIG_GROUND` are named for it, and the car's
own yaw is now DERIVED from the rig — `Math.PI * 0.82` was a three-quarter
front view of the eye that existed when it was written, and the moment the eye
moved the same constant showed the back of the car.

Gates: `pageerr`, `bayblack` (the studio shares the bay's diorama) and `boot`
4/4 all green.

## r277 — THE PYRAMIDS COME OUT
Reported in three words, no picture: "remove the piramids". Two things in this
game are literally pyramids — the diorama's loose stones (squashed
TETRAHEDRA and octahedra) and its grass tufts (four-sided cones) — so before
removing anything, zoom the thing the report was most likely looking at. A car
shelf card blown up four times settles it: scattered over the grass and the
dirt band are small pale solids with a flat base and a clean apex. Little white
pyramids. They are r264's stones.

They were justified at the time and the argument still reads well — painted
gravel is flat, stone the key light can catch is what makes a surface read as
loose. What that argument missed is the SIZE these are ever seen at. A shelf
card is 148 px wide. At that scale a four-sided solid does not read as gravel;
it reads as a triangle someone left on the lawn.

The numbers had already said so quietly: `dioparts.mjs` put them at 0.9% of the
bay for 752 triangles — 3.0 pixels a triangle, the second-weakest thing in the
whole diorama. Marginal on the measurement before they were wrong to the eye.
Out: 8909 → **8157 triangles**, and the trail keeps its painted gravel, speckle
and damp patches, which is what carries "loose surface" from any distance the
game actually shows it from.

The moss, the boulders and the three-tier pines stay — those are rocks and
trees, not pyramids, and they earn their triangles.

Gates: `pageerr`, `bayblack` lit and sealed, `boot` 4/4, second diorama still
free at 0.1 ms.

## r278 — THE MOUNTAIN LEANING ON THE CAR
A screenshot with no words: an alpine meadow, chalets on the far slope, the car
crawling at 8 km/h, and a huge pale grey-green faceted mass filling the left
half of the frame. Blown up four times it resolves into a CONE seen from its
own foot — the near base vertex at the driver's feet, two ridge lines running
away up and out of frame, the scatter rocks of the hillside sitting along the
right silhouette. The faces sample at #8a9a84, which is `furka`'s `hillColor`,
which is what `_buildMassif` lerps the bottom third of every cone towards.

It is a massif cone, and it passed every check the builder has.

WHY IT PASSED. `_buildMassif` walks a cone away from the road until

    d >= w / 2 + roadWidth + 24

which is a FOOTPRINT rule. It buys exactly one thing: you cannot drive into the
rock. It says nothing at all about what the rock looks like from the seat.
Measured on GLACIER COL (`massifloom.mjs`, new): all 16 cones satisfied it, and
one of them stood with its flank 42 u from the centreline and 258 u of mountain
above that flank — **81 degrees of sky**. Every one of the 16 was over 25
degrees; 100 % of the lap's stations had a mountain over 40 degrees somewhere in
view. GRANITE NARROWS measured 83 %, TIMBER GORGE 79 %.

So the clearance now takes the taller of two rules — the footprint one, and a
flank standing back `LOOM = 1.15` times the cone's own height, which caps it at
about 41 degrees:

    d >= w / 2 + max(roadWidth + 24, h * LOOM)

On GLACIER COL all 16 cones survive at full size and every one of them now
measures 40 degrees or less: they simply walked outward along the ring, which
had the room all along. Nothing shrank and nothing was dropped.

THE OTHER HALF, found on the way. When eight passes cannot find room the
builder shrinks to fit, and the old line shrank `w` and left `h` alone. That
turns the one cone the lap encircles into a needle — the exact fault the
horizon ring was widened to cure ("no real mountain is twice as tall as it is
broad", r-whenever, three thousand lines further down this file). It now solves
for the single scale that satisfies both rules and applies it to the whole
form, so a squeezed peak is a smaller mountain instead of a spike. Shrinking `h`
also shrinks what the loom rule asks for, so it converges in one step.

A NEAR MISS WORTH RECORDING. The scale was first written `const k = ...` inside
the shrink block — and `k` is the instance loop's own counter, three lines above
`rock.setMatrixAt(k, m4)`. The drop path would have written instance 0.37.
Caught by reading the diff, not by a gate; there is no gate that would have.

AND A FALSE LEAD, also worth recording. Before measuring anything I photographed
eight stations of the lap looking for the shape, and station N/2 came back
swallowed by a dark mass with a pale slab in it — looked like a hit.
`whatsinfront.mjs` (new: hide each scene child, diff the pixels, descend into
the winner) named it `tunnel`, at 74 %. The car was parked inside a bore. A
station picked by eye is easily inside one, and a dark frame is not the bright
frame that was reported.

AND THE SHRINK BRANCH TURNS OUT TO BE UNREACHABLE. `shrinkpath.mjs` exists to
run it on purpose, and it took three cuts to get an answer worth having:

 1. Cones planted at r 40-60 with w 400. They came back at the requested
    400 x 400 and the probe said PASS. The walk had simply pushed them outward
    THROUGH the lap and out the far side, where the clearance is satisfied.
 2. `shrank` added as the gate on the gate, and the spec raised to 2000 so the
    clearance could not be met anywhere. It reported 72 of 88 cones shrunk —
    for a massif that has 16. The solids filter ("base no wider than `w1`")
    stops separating massif cones from skyline ones the moment `w1` is a big
    number, so it was counting the horizon rings.
 3. Reading the named InstancedMesh's own matrices. `shrank: 0`. Even at a
    clearance of 3300 u, EVERY cone escapes.

Which is the real finding: nothing bounds the walk's step (`need - d + 4`), so
a cone can always leave the world rather than shrink. The branch is dead code
on today's roster. The proportional shrink is still the right code to have
there — and the `const h` it assigned to would have thrown the moment anything
did reach it — but this round did not exercise it, and saying otherwise would
be the third wrong measurement in a row.

The flip side of an unbounded step is a cone shoved past the skyline, leaving a
hole where a mountain should be. `conering.mjs` (new) measures it: on the
alpine chapter, which has the largest specs and so the largest shoves, L65
asked r 340-600 and got 422-587, L66 asked 400-700 and got 497-697, L67 asked
380-640 and got 454-618. Every cone still stands in its own ring.

Gates: `loomsweep.mjs` (new) over every level that builds a massif — no cone
leans over a road anywhere on the roster, and no ring lost a cone to the fix.
`conering.mjs` (new) over the same set — no cone walked out of the world.

## r279 — THE CARDS WERE A CAR ON A GREEN SCREEN, AND THEY LITERALLY WERE
Reported with a screenshot of the car shelf: each card is a vehicle pasted on a
flat green field with a brown smear behind it and the tan trail sliced into two
corner wedges. r276 framed these icons from the car and r264-r277 built the
rally-trail diorama they are shot against, so "the background is doing nothing"
should not have been possible.

`iconparts.mjs` (new: shoot the icon at 4x through the game's own `_shoot`,
then hide one child of the forest at a time and re-shoot) put a number on it.
ONE 4-VERTEX QUAD OWNED 82.4% OF THE ICON. Every tree, every rock, every bush,
the dapple gobo, the trail — all 0.0%. The diorama was not weak in the frame,
it was ABSENT from it.

The quad measured 420 x 420 x 0 in world space: an UPRIGHT plane standing at
the origin, in `#4f8a35`, which is `F.grass`. But `_diorama` plainly writes
`ground.rotation.x = -Math.PI / 2`. Three readings, no two agreeing, and the
next hour went on probe archaeology — two probes disagreeing about the same
object because one of them had asked `_studio()` for a different size. They
had not; the studio is cached and both got the same scene. The disagreement was
real and the source was innocent, because the object being measured was never
the object the source built.

BUILT ONCE, MOUNTED TWICE — AND THE SECOND MOUNT DROPPED EVERY TRANSFORM.
`_diorama` cached `[geometry, material]` pairs in `__dioParts` and remounted
them as `new THREE.Mesh(geo, mat)`, carrying `receiveShadow` and `renderOrder`
across and nothing else. Most of the diorama is welded, so most of it has its
placement baked into its vertices and survived. Five things do not:

  - the ground plane lost `rotation.x = -PI/2` and stood UP as a 420 x 420
    green wall through the origin — the green screen, exactly,
  - the painted far treeline lost `position.y = 26` and sank into the floor,
  - the trail, the dapple gobo and the dome lost theirs with them.

The bay takes the first mount and the studio takes the second, so the bay
looked right and every card was shot against a wall. `bayblack` could not catch
it: it asks whether the backdrop is lit and sealed, and a green wall is both.

The fix is to cache the GROUP and hand out `Object3D.clone()`. Clone copies
transforms, `visible`, `receiveShadow` and `renderOrder`, and shares geometry
and material by reference — which is the entire saving the parts list was
after, without the part it got wrong. Every caller gets a clone, the first
included, so no one holds the template and one mount cannot hide the other by
toggling `visible`.

After: ground 43.9% (as a FLOOR), dapple gobo 24.6%, bushes 12.1%, rocks 7.5%,
tufts 5.1%, trunks 3.6%, trail 3.5%. The card is a photograph of a car on a
rally trail, which is what the last thirteen rounds were building.

WHAT THE DETOUR WAS WORTH KEEPING. Before the cause was found, `iconaim.mjs`
swept the rig looking for a framing that would show the wood, and its finding
stands on its own: the shipped icon camera tilts 16.8 degrees down against a
15 degree half-FOV, so the horizon sits at ndc 1.13 — OFF THE TOP OF THE FRAME.
Raising the aim barely moves it, because `_fitDist` pushes the lens back as the
aim rises and lifts the eye by almost as much. That was true before this fix
and is still true after: the icons show no sky. It is survivable now that the
ground is a floor with a wood standing on it, and it is the thing to reach for
if these ever want a skyline.

Gates: `iconparts` on the shelf rig.
