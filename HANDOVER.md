# HANDOVER — read this before touching anything

State at handover: `main` = r207, deployed and live, tree clean.
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
placement: `_buildEdgeRails` skips any station within 40 samples of a gorge,
overpass or tunnel on the grounds that those build "its own rails". The
exemption is 40 samples wide; the thing it defers to is not. **A promise made
over a wider span than the thing that keeps it.** See item 2.

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

### 2. SEA CLIFF RUN's gorge exemption — measured, named, and open
`tests/test-cornerwalls.mjs` failed on its first run and the failure is real:
SEA CLIFF RUN leaves **13 consecutive tight stations bare from sample 749**,
on both sides. Not the rail cap — the world builds every bay it asks for.
`_nearGorge(i, 40)` exempts the station; nothing rails it.

It is PINNED at 13 by name in that gate, not absorbed by raising the limit,
so a fourteenth station or the same hole elsewhere fails.

FIX SHAPE: narrow the exemption to where a barrier ACTUALLY stands. The
`guarded` test three lines below in `_buildEdgeRails` already asks exactly
that, and the deck and bridge builders run BEFORE the rail builder (8872 and
8895 against 8898), so their barriers are in the list by then. Careful: a jump
gorge probably SHOULD stay exempt — a rail across a launch is wrong — so this
wants splitting by exemption kind, and a before/after sweep with
`tests/test-cornerwalls.mjs` on every world with a gorge.

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
    tests/test-mountainrun.mjs   CAPE OLIVETO is enclosed, and OLIVE COAST is
                                 the CONTROL that must stay open ground
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
- `test-surface.mjs` and `test-menu-noreset.mjs` HARDCODE port 8901 and ignore
  `BASE`. They fail to connect silently and read as "not run".
- `pgrep -f 'ab\.mjs'` also matches `srvlab.mjs`. Killing probes has killed the
  static server mid-run more than once. Use `scratchpad/keep.sh`.
- **Version bump is 4 sites in index.html + 1 in sw.js**: `sed -i
  's/rNNN/rNNN+1/g' index.html && sed -i 's/rNNN/rNNN+1/' sw.js`. The service
  worker caches by version name; without the bump the deploy serves the old
  bundle and the change looks like it did nothing. This has happened.
- Deploy runs ONLY on push to `main` (`.github/workflows/deploy.yml`). Work
  sitting on the feature branch is not live, however green it is.
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

## OPEN, LOWER PRIORITY
- **`MIN` in `tunnelFitAt` is probably the same units error `reach` was.** The
  real minimum bore measures ~52 u against a documented ~26 u. Nothing depends
  on it yet.
- **Trees are low-poly blobs** — the biggest remaining visual gap against the
  photoreal reference the owner supplied. Buildings, roofs and ground got the
  r202/r203 detail pass; trees did not.
- **`element-prism` bucket roof tiling** needs a neutral-map and gamma decision
  before `roofTileTexture` can be wired into it.
- **The start-gate exclusion is 26-30 samples in every builder.** On TERRAZZA
  ALTA that leaves genuinely tight corners (curv 0.049) bare either side of the
  line. Consistent, deliberate-looking, and never justified by a measurement.
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
