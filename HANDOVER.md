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

## THE r219 VISUAL SWEEP — what was driven, what was found, what was NOT there

Every one of the 67 worlds was DRIVEN for 40 s and shot every 5 s from the
CHASE camera with the HUD on (`tools-scratch/tour.mjs`, 536 frames). Read this
before spending a session hunting any of it again.

**Three defects, all fixed, all measured either side:**

1. THE SPEEDOMETER WAS A LID OVER THE CAR. The dial is a fixed 132 px at
   `left:50%` and the player's car sits at the bottom CENTRE of the frame in
   every camera but the driver's seat. Measured in pixels by rendering each
   view twice, once with the car keyed: at 1440x810 the DEFAULT view had 100%
   of the car behind the dial; at 800x460 it was TOP-DOWN 66, TOP FAR 100,
   TRAIL 59, CHASE 100, CHASE FAR 100. The car's footprint is a fixed FRACTION
   of the viewport (x 0.478-0.521 W, y 0.78-0.914 H) and the dial is fixed px,
   which is why a short window loses the chase views too. `left:62%` now; 0% at
   both sizes. THE PHONE LAYOUT IS DELIBERATELY UNTOUCHED — at 390 px there is
   no room to the right of the car, and `body.touch` is hand-tuned against the
   joystick and the weapon buttons.
2. THE START LINE SCOLDED YOU FOR CROSSING IT. `gridSlot(0)` is index N-10, so
   every race begins BEHIND the line and crosses it about a second after "GO!"
   — with `_cpMask` at 0, which `checkLap` could not tell from an infield cut.
   Every world, every race, opened with a full-screen "CHECKPOINT MISSED — LAP
   NOT COUNTED" (PINE VALLEY 1.10 s, EMBER PASS 0.93 s, TREMOLA 0.98 s).
   `_gridStart` now absorbs exactly that one crossing. The lap arithmetic never
   changed — it never earned a lap and still does not.
3. NINE WORLDS WERE ANOTHER WORLD'S PICTURE. Each world reduced to a 6x6x6 RGB
   histogram over the non-HUD frame, every pair ranked (`similar.py`). Median
   over 2211 pairs 0.631; the head of the list was duplication, not family
   resemblance — NEON GRID vs MARINA BAY at **0.098**, four `forest` worlds at
   0.126-0.137, MONZA/SALINE 0.137, REDWOOD/SUZUKA 0.142, FLUME/RALLYCROSS
   0.163, CANYON RUN/LAGUNA SECA 0.205. All nine carried elevation and ramp
   counts and no light of their own, while SILVERSTONE, MOUNT PANORAMA, OULTON
   PARK and ESTONIA CRESTS already had one. Nine named weathers later, the
   worst pair on the roster is 0.152 and every one of those pairs is out of the
   top 25. Per-world mean luminance is unchanged (MARINA BAY 27.4 -> 28.1, the
   darkest either way).

**And the thing that is NOT there, so nobody re-hunts it: THE ROSTER HAS NO
FLOATERS.** `tests/tool-float-census.mjs` still reports thousands, and on this
roster it is answering a different question wrongly three ways — one ribbon
mesh spanning a canyon covers every column under it, a boat on the sea has only
excluded water beneath it, and a foot-bridge is MEANT to be in the air. Swept
by RAYCAST instead (`treegap.mjs`, `standcheck.mjs`): PINE VALLEY has 15 of 743
plants off by more than 1 u and every one of them is SUNK, not floating;
CANYON RUN and ROCKFALL RAVINE — the census's worst offenders at 51 u — are
clean. What survives the ray is start gantries, arch checkpoints, campanile
belfries, tyre stacks and bridge decks, every one of them overhead on purpose.
r218's "floaters killed at source" did the job.

**Reported, not fixed — each one is a judgement call, not a defect:**
- MOUNTAIN TO SEA's `roadWidth: 5` reads as a cobbled plain rather than a road.
  The road UV maps u = 0..1 across the FULL ribbon width whatever it is, so a
  95 u carriageway stretches one texture across all of it. It cannot simply be
  tiled: `roadTexture` bakes the verge fringe into the u extremes and wraps
  ClampToEdge, so tiling u would draw five sets of verges across the road.
  Fixing it properly means separating the fringe from the surface.
- The Mediterranean set (CINQUE TERRE, AEGEAN, BRAVA, DALMATIA, AZUR, CITADEL,
  CLIFF KNOT, SEA CLIFF RUN, HARBOR QUAY) still reads as one place from the
  seat — cobbles, orange roofs, a hill town. themes.js says that cloning was
  deliberate and gives each its own element kit and frontage tints; what they
  share is the ROAD SURFACE and the composition, not the palette. HARBOR QUAY
  vs CITADEL BAY at 0.152 is now the closest pair on the roster.
- CANYON RUN's bore interior is near-black from the seat. Every other tunnel
  world reads the same way. Nothing measures tunnel-interior luminance yet.

## THE OFF-ROAD HALF OF THE r219 SWEEP — up the hills, into the water

Asked for directly: "Do climb mountains and hills off-road. Go into rivers and
waters." `tools-scratch/wild.mjs` did it on all 67 worlds — each one seated at
the foot of its highest DRIVABLE ground and driven up it, then seated at its
water and driven into it, chase camera, a shot every 5 s. 402 more frames, no
page errors.

**Two defects found and fixed, both in the HUD, both measured:**

1. THE FEED SAID THE SAME THING FIVE TIMES. `hud.feed` appended a row and
   removed it 3.3 s later without ever asking what was already on screen. 500 u
   off the course on SEA CLIFF RUN the right-hand column was five identical
   "OFF THE COURSE — TURN BACK" rows; on the racing line the same shape turns
   up with SLIPSTREAM, WET TIRES and TIMBER! (2 of 4 worlds held a duplicate
   pair within a lap). Repeats collapse into one row with a ×N tally now — and
   the check reads EVERY row, because matching only the newest still left PINE
   VALLEY with three "WET TIRES" when a TIMBER! landed between them.

2. THE BUTTONS SAT ON THE FEED. `#cam-btn` and `#pause-btn` are 46 px squares
   at right:12 and `#feed` was anchored into their column: 828 px² of a row
   behind a button at 800x460, 486 px² at 1440x810, on every world — and the
   row it ate is the one that fires first in every race ("WET ROAD — SLICK
   UNDER BRAKING") plus every contract line. Two corrections, and the obvious
   version of each was wrong: right:70px clears the column in PORTRAIT but the
   buttons turn SIDEWAYS under 560 px of height (the feed drops below them
   there instead), and 70 px still measured 486 px² at desktop size because the
   ROW MOVES — `feedin` starts at translateX(30px), so the resting edge cleared
   the button and the arriving edge did not.

**Three things measured and deliberately NOT changed — each is the next
session's call, not a slip to fix at the end of a sweep:**

- **5.04% of off-road frames have the car UNDER THE GROUND**, and the screen is
  a void for as long as it lasts: 23,040 frames over four worlds, worst 11.84%
  on SILVERSTONE, longest single void 1.22 s (`blindtime.mjs`). The state is
  already handled — `_watchCarVisible` lifts the car and re-seats the boom —
  but only after `_blindT` reaches 1.0 s. Shortening that dwell is NOT a
  one-liner: `terrainHeight` returns the RIDGE over a bore, so a car in a
  tunnel reads as buried, and the dwell is part of what stops the watchdog
  teleporting it onto the mountain. Measure `test-tunnels` before touching it.
- **6.5% of off-road frames are ≥75% ONE COLOUR against 3.2% on-road** — the
  chase camera against a slope, which main.js already names ("a single
  featureless slab of hillside... exactly what the player photographed and
  called a void") and bounds with the MAX_UP cap. The cap is doing its job;
  what is left is the honest cost of a boom behind a car parked against a bank.
- **The far field is undressed.** Past roughly 300 u the ground carries no
  trees, no rocks and no props on most worlds, and the horizon highland is a
  flat-shaded plateau at a fixed 28 u that 18 of 31 worlds share (an identical
  (674,-566) — it is the silhouette's own ground, not a mountain). Nothing is
  broken; there is simply nothing out there, and a player who drives out finds
  that out.

**And two theories killed by measurement, recorded so they are not re-run:**
- The lens is NEVER under the ground: 0 of 10,080 off-road frames (`camdig.mjs`).
  The MAX_UP pull-in loop looks like it can exit with the camera buried. It
  cannot.
- SILVERSTONE's -39 u readings are NOT a river carve gone wrong. The ground
  really is 40 u down out there; `terrainHeight` and the drawn mesh agree to
  0.35-2.0 u mean in every distance band out to 1200 u.

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
