# HANDOVER — read this before touching anything

State at handover: branch `claude/handover-continuation-wrq47s` = r199, eight
commits on top of r198, pushed. Tree clean.
Live (still r198 until this merges): https://jozelazarevski.github.io/racing-shooter/

## WHAT HAPPENED LAST SESSION, IN ONE LINE

The previous handover's number one priority was a bug in the PROBE, not in the
game. Extending the census properly found eight real defects instead; a
drive-through test for the tunnels found a ninth; and measuring an ASSUMPTION
the census cannot see — that every world starts at y = 0 — found a tenth.

## READ THIS FIRST: THE FENCE POSTS NEVER EXISTED

The last handover opened with "~15 posts of 0.18 x 1.05 stand in rural
carriageways, worst bite **9.5 u into a 9 u half-width**, the builder is
UNIDENTIFIED". Three sessions of grep failed to find that builder because
there is nothing to find.

`fence.mjs` rejected non-posts with

    Math.abs(q.width - 0.18) > 0.005

A sphere has no `q.width`. `Math.abs(undefined - 0.18)` is `NaN`, `NaN > 0.005`
is **false**, so the guard never fired and every sphere, torus, circle and
cylinder fell through as a "fence post" — including the pickups on the racing
line and the 9000 u world skirt. That is where 9.5 u came from.

Measured with the keys required to exist: FROST PEAK 10 posts, REDWOOD RAMPAGE
7, every one at 10.3 u lateral against a 9 u half-width — **1.21 u OUTSIDE the
drivable edge**. `test-carriageway` independently agrees ("narrow-section posts
clear the carriageway, closest 2 u outside the drivable edge").

**THE LESSON, and it is sharper than "measure twice": a filter that can be
defeated by a MISSING FIELD fails OPEN, and a probe that fails open reports
work that does not exist.** `NaN` comparisons are always false, so
`Math.abs(a - b) > eps` is not a rejection test unless `a` is known to exist.

## THE TOOL THAT NOW ANSWERS "WHAT IS ON THE ROAD"

`tests/tool-road-census.mjs` walks `track.group` and measures transformed
geometry, so a mesh with NO COLLIDER is counted like any other — the blind spot
that hid the barriers (r191), the bridge piers (r193) and the culvert parapets.
Ones with no collider within 1.5 u are flagged BARE.

Five filters keep it readable, and **every one was earned by a false positive it
removed** — do not remove them without reading why:

- the drive band, measured PER FOOTPRINT POINT against the road height at that
  point. Judged per object, every grade-pitched puddle decal in the game
  reported an 8 u bite.
- `track.props` — crates, cones, snowmen are on the drivable surface ON PURPOSE
  and carry no collider. Forty per world.
- decals — zero-thickness sheets LYING DOWN, judged by the sheet's NORMAL. An
  aspect-ratio test called an upright 9 x 2.2 sponsor board a puddle and hid a
  real defect for a while.
- foliage over a registered `track.trees` trunk. PINE VALLEY reported 29
  canopies; 743 trees and not one trunk on the road. Trunks are measured
  separately, so a tree PLANTED in the road still shows.
- landforms over 40 u. Counted and LISTED, never silently dropped.

`HITS=1` prints every hit, `BULK=1` the 12-40 u meshes.

## SCORE, PRISTINE origin/main vs THIS BRANCH, SAME TOOL

                      before    after
    blockers              60       48
    intruders            196       see census-final.txt
    trees in a lane       23        0

**THE ONE DEFECT THIS SESSION KEPT FINDING**, in nine builders now — props,
tire stacks, road cabins, quay guns, arch faces, deck rails, cacti, hoardings,
corridor pines, fallen logs. Always the same sentence: *something computes a
position that clears the road AT ONE SAMPLE, and nothing asks how far the thing
reaches from it.* `_distToTrack` searches the whole lap and answers it.
**When you meet new scenery on the road, look for this first.**

Fixed here:

1. SEA CLIFF RUN's stone-bridge arch face: 9 u of masonry 5.2 u proud of the
   road, biting 5.87 u, no collider. Offset along the SPAN's normal instead of
   its own, and never asked what ran underneath. Now uses `nrm[j]` and
   `_pierInRoad` — the 3-D question `_clearsRoad` cannot answer, since that one
   is flat and would refuse every arch face for standing under its own deck.
2. SEA CLIFF RUN's overpass deck rails, 4 of them up to 4.25 u in. `railBlocked`
   exempted 76 samples as "its own deck run" and the lap doubles back inside
   that window. The exemption now relaxes the BUFFER instead of skipping the
   road.
3. Sponsor boards — a 9 u hoarding broadside to the road with 1.4 u of room
   beside it. On cliff worlds it now stands ALONG the road. **This was on 8
   worlds**, not the 2 it was found on.
4. Cacti — three cacti and an acacia with their TRUNKS in the carriageway on
   CANYON RUN, worst 1.01 u from the centreline. `_buildCacti` never called
   `_distToTrack`.
5. SUZUKA's tree corridor — 14 trunks in the lane on a figure-of-eight, and
   these are `solid: true` pines, so hitting one stops a car dead. 14 -> 0, at
   a cost of 28 trees out of 800.
6. ESTONIA CRESTS' fallen logs — a 6.5 u log positioned by its CENTRE with a
   random yaw sweeps 3.25 u, and it was offset along the normal of a sample
   16 u away. Two lay 2.05 u from the centreline. 2 -> 0.
7. THE START GANTRY WAS BUILT AT ABSOLUTE HEIGHTS — legs, braces, cabin,
   banner, flags, lights — while only the checkered strip read `c.y`, carrying
   the comment "start area is flat (c.y = 0)". Measuring THAT assumption:
   **11 of 61 worlds do not start at y = 0.** SUZUKA (7.87) had its lights
   housing 2.57 u UNDER the tarmac and its crossbar 1.13 u over it — the gantry
   buried to its shoulders. RED CENTRE RUN (-3.99) floated it 9.29 u up. CLIFF
   KNOT (3.57) put it at windscreen height across the grid. All now measure the
   intended 5.30 u, PINE VALLEY (y = 0) unchanged as the control.

   **NOTE WHICH ONE THE CENSUS COULD NOT FIND.** SUZUKA's was the worst and the
   census never reported it: a BURIED object is not standing proud of the road,
   which is exactly the test INTRUDERS is built on. Only measuring the
   ASSUMPTION found it. A census answers the question it was given — when
   something looks wrong and the census says clean, suspect the question.
8. The census learned that an OVERLAY announces itself. COTE D AZUR's deepest
   remaining hit at 7.71 u was SEA FOAM. Anything drawn with
   `depthWrite: false` is a visual layer by construction — foam, puddles,
   tunnel light pools, contact shadows. No thickness heuristic needed; the
   material carries the answer. COTE D AZUR 9 -> 0.

## TUNNELS: 26 OF 26 BORES DRIVE IN ONE PORTAL AND OUT THE OTHER

Eight mountain worlds gained bores (FROST PEAK, SUMMIT CLIMB, GLACIAL PASS,
GLACIER'S GRIND, AVALANCHE ALLEY, COL DE TURINI x2, PIKES PEAK, DOLOMITI CORSA
x2); the roster went 15 -> 23 worlds asking.

`tests/test-tunnels.mjs` drives the real car from outside one portal to outside
the other and asserts ENTERED, EXITED THE FAR PORTAL, never above the crown,
never stopped dead. **A count cannot answer any of those** — see COORDINATION
for the three tunnel defect classes that are invisible to one.

It earned itself immediately: GLACIAL PASS and TREMOLA DESCENT both ASK for a
bore and had none, TREMOLA ever since the crest guard shipped. Cause was a
units error — `lenS` (a LENGTH) passed into a parameter named `maxHalf`, so the
gorge and crest exclusions reserved twice the ground a bore can occupy. On
GLACIAL PASS that refused 701 of 900 stations on the crest rule alone.

TREMOLA still fits nowhere and that is correct: its longest straight is 10
samples against a 12 minimum, and its one long straight carries the very crest
the guard exists for.

## THE THREE THINGS THAT MATTER NEXT, IN ORDER

### 1. SEA CLIFF RUN (level 60) — 80 u of road stacked on road, STILL OPEN
Untouched, and only its SYMPTOMS were cleared this session. Measured:
- samples **530-566 run directly over 655-682**
- centreline gap falls to **1.91 u**; under 18 u for ~80 u of lap
- vertical separation only 1.48-6.35 u
- both legs are on the racing line (~60% and ~74% of the lap)

`_planOverpasses` only fires on a true XZ segment INTERSECTION; this is a
near-parallel pass, so no crossing is registered and the two carriageways
interpenetrate. `_checkLayout` prints only the single global minimum, which
here is the legitimate overpass elsewhere on the lap. FIX SHAPE: register
near-miss pairs as crossings. Measure all eight overpass worlds with
`tools-scratch/gaps.mjs` before and after.

### 2. Finish the census backlog — it is now a short list
Everything above 6 u is cleared. What is left:

    RED CENTRE RUN   the gantry CABIN and BRACES, ~5.5 u, bare. The tower spot
                     is scored by `_clearsRoad`, which is FLAT, so it cannot
                     know another leg passes at the cabin's own height 10 u up.
                     Same 3-D question `_pierInRoad` answers for arch faces —
                     that is the fix shape. NOTE the builder already documents
                     a deliberate compromise here (TOUR DE CORSE, RALLYCROSS
                     ARENA): where nothing clears, the mesh stays and the
                     COLLIDER is dropped. Do not undo that; extend the scoring.
    rocks            `Dodecahedron 1` on CINQUE TERRE (6.28 u, instanced,
                     #807d70), PIKES PEAK (4.03, #7a9a6c), MOUNTAIN TO SEA
                     (1.34, #8e8a7a) — three different builders by colour and
                     instancing. Almost certainly the same missing check again.
    COTE D AZUR      14 stone blockers at 9.27 u — that is the TUNNEL doing its
                     job, a documented false positive. Not a defect.

### 3. Rival pace — the number that still does not exist
Nobody has measured a competent HUMAN lap time on any world. Without it there
is no baseline to tune difficulty against; tuning before you have it is
guessing. Rivals circulate 0.5-0.9 laps/30 s and never wreck (8/8 alive).

## SMALLER OPEN ITEMS
- **`MIN` in `tunnelFitAt` is probably the same units error as the reach was**:
  `Math.round(26 / segLen)` compared against a HALF, so the real minimum bore
  is ~52 u against a documented "~26 u of bore". Fixing it would give TREMOLA a
  short gallery, but it moves tunnel sizing on all 23 worlds — its own pass.
- `test-newworlds` has ONE failure, "the new worlds are appended at the END of
  the array — tail is 56,57,58,59,61,60". **PRE-EXISTING and byte-identical on
  pristine `origin/main`** — the r196 OLIVE PASS array-order note. Not a
  regression; do not chase it as one.
- `test-jumps`: 2 pre-existing FURKA RIDGE failures, "0 jumps in 90 s" on a
  stage whose whole point is crests.
- The "I jump straight up" report is UNREPRODUCED. Needs the track name and
  whether it happens driving INTO a bank or sitting on one.
- iOS cannot lock orientation from a manifest. Landscape lock needs an in-page
  portrait prompt — a design call.

## MEASUREMENT DISCIPLINE — earned the hard way, do not skip
- **A filter that fails OPEN invents work.** See the fence posts above.
- **Instrument the BUILDER, not the built scene.** Recovering "which sample does
  this mesh belong to" is guesswork on a hairpin and gave two wrong answers
  before the right one. `tools-scratch/railtrace.mjs` rewrites `src/track.js` in
  flight with `page.route` so the builder records what it decided. Reach for
  this whenever the question is "why did the generator do that".
- **ALWAYS baseline against pristine `origin/main` on a second port.**
  `srv.mjs` now takes a ROOT: `node srv.mjs 8930 /path/to/worktree`. This is how
  the `test-newworlds` failure was proved pre-existing in one run.
- Four probes two sessions ago produced CONFIDENT WRONG ANSWERS: an unsteered
  car at full throttle just drives off the road; a start index minus an end
  index cannot see a wrap, so accumulate PER FRAME; a parked player is not a
  stuck player; traffic owns its own `requestAnimationFrame` and its clock runs
  ~0.125 s per real second under swiftshader, so a 20 s sample proves nothing.

## TRAPS
- **A withheld barrier grows an edge rail.** `_buildEdgeRails` consults
  `this.barriers` ("already walled?"), so withholding a deck rail changes what
  gets built elsewhere and `solids` moves on worlds that look untouched. World
  gen is SEEDED, so this is deterministic, not noise — but a raw count diff is
  not a defect count. **Compare CLASSES.** Adding a tunnel does the same thing:
  it raises a 13 u ridge and shifts the RNG downstream.
- `git reset --hard origin/main` DISCARDS uncommitted work. Commit first.
- `test-surface.mjs` and `test-menu-noreset.mjs` HARDCODE port 8901 and ignore
  `BASE`. They fail to connect silently and read as "not run".
- `pgrep -f 'ab\.mjs'` also matches `srvlab.mjs`. Use `tools-scratch/keep.sh`.
- Version bump is 4 sites in index.html + 1 in sw.js: `sed -i 's/rNNN/rNNN+1/g'`
- `playwright-core` is not vendored, and ESM ignores NODE_PATH — install it
  anywhere and SYMLINK `node_modules` into the repo root.

## POLICY, SET BY THE OWNER
- `V2/` is a SEPARATE bundled build, live at `/racing-shooter/V2/`.
  **Deliberately NOT kept in sync.** Do not port fixes into it. A defect found
  there is not a defect in this game.
- `origin/kimi-overpass-3052a9a` holds a third-party commit that briefly
  replaced `main`. It claims to fix "overpass terrain clipping and detection
  bugs" — the same area as r190-r199. If it is ever revived, DIFF IT FIRST.

## MOUNTAIN TO SEA'S VIADUCT — two dead ends, do not repeat them
Both tried to remove deck height AFTER the solve; the inherited height is
LOAD-BEARING for the neighbouring crossing. r197 solved it from the other end —
shorten the ramp so they never overlap. The 0.72 floor is deliberate: at 0.62 a
crossing hit 9.53 u, under the 9.65 u where `nearestIndex` can capture the
wrong leg.

## TOOLS (`tools-scratch/`, committed)
`gaps.mjs`      every crossing's clearance + grade p90/max — the acceptance
                test for ANY `_planOverpasses` change. Honours BASE now.
`railtrace.mjs` patches the builder on the wire. See discipline above.
`postid.mjs`    the CORRECTED geometry measurement (keys required, instances
                handled). `fence.mjs` is kept only as the broken one.
`deckcount.mjs` counts what the clearance guards can withhold.
`piers.mjs` `ab.mjs` `launch.mjs` `offroad.mjs` `srv.mjs` `keep.sh`
