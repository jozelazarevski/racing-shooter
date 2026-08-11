# STABILITY — what went wrong in IGNITE RALLY, and what stops it here

## The principle

IGNITE RALLY's defect record is not a list of unrelated accidents. Read
`BUGS.md` and `BUGS-MATRIX.md` end to end and the same few mistakes appear over
and over, in different files, wearing different names: 211 colliders in the
drivable lane came from **one** mistake made at eight call sites; the bare
horizon came from a fix applied to one drawing path and not its twin; the hole
in RED CENTRE RUN came from a feature applied on distance alone with nothing
tying it to the crossing it was designed for.

The owner's own summary is the diagnosis:

> "I keep on debugging the game non stop for things that can be obviously
> working." · "I waste too much time asking Claude Code to fix the worlds."

And the deepest signal in the record is one word, repeated:

> "I **can still** enter the mountains instead of hitting them" · "**Still** can
> enter." (with a photograph taken from inside a hillside) · "**Still** see the
> shark mountains there" · "I **still** don't see jumping across cracks and
> gorges."

Those are not sixteen bugs. They are **fixes that did not hold** — repaired in
one code path and left live in a second, or repaired and later regressed, with
nothing standing watch either way. r148 made the massif cones solid and left
`_buildHorizon`'s rings bare on 51 of 60 worlds for five more releases, and the
whole suite passed the entire time, because every check in it was looking at
the objects that already had colliders.

So the standard here is not "we fixed it". It is:

> **A defect is not fixed until a named check fails when it comes back, that
> check runs in `gate` or `gate:full`, and somebody has watched it go red on a
> deliberately broken build.**

`REGRESSIONS.md` is the row-by-row register of that promise, and
`tools/verify-regression-memory.mjs` enforces it mechanically. **This file is
the ledger**: one section per bug class, what it was in v1, whether dustline
was vulnerable, what stands watch now, how long that costs, and — stated as
plainly as the passes — what it does not cover.

## How the numbers in this file were taken

Every runtime and every verdict below was measured on this machine on
2026-08-11 by running the tool, not by reading it. Browser tools were run
against the `../play-dustline` build of **22:27** (`main-DroMBSax.js`,
md5 `875875a5…`) unless a line says otherwise. Two caveats that belong at the
top rather than in a footnote:

- **`src/` moved while this audit ran.** A concurrent workflow rebuilt
  `../play-dustline` three times during the session (21:43, 21:53, 22:27), and
  two of the numbers below are quoted from the 21:53 build precisely because
  they show a gate going red and then green on a real fix. Where that happens
  the build is named.
- **Fixed-step or nothing.** COORDINATION.md's rule — headless SwiftShader runs
  these worlds at a few fps with `dt` capped, so a wall-clock probe runs the
  simulation at roughly one-eighth speed — is honoured by every tool here that
  reads the simulation. `verify-coverage` check 9 enforces it mechanically:
  a tool that reads a progress quantity without calling `fastForward` fails.

---

## The gates, measured

`gate` is source-only and needs no build and no browser. `gate:full` builds
first and drives real pages. The split below is what the measurements support;
`package.json` is wired by the parent session, and the two lines that do not
match this table today are called out in **Still unguarded**.

### `gate` — 15 s total measured, nothing over 9 s

Every check below was run at least twice; a range is the spread of those runs.

| check | runtime | today |
|---|---:|---|
| `tsc --noEmit` | 6.7–8.4 s | pass |
| `verify-templates.mjs` | 0.07 s | pass |
| `verify-regression-memory.mjs --static` | 0.09 s | **1 fail** |
| `verify-coverage.mjs` | 0.19–0.29 s | **2 fail** (one is a false positive — see below) |
| `verify-separation.mjs` | 0.39–0.41 s | pass |
| `verify-track-format.mjs` | 0.91–1.24 s | pass |
| `verify-generated.mjs` | 0.29–1.98 s | pass (it re-runs the generators) |
| `verify-terrain-integrity.mjs` | 1.32–2.13 s | pass |
| `verify-sdf.mjs` | 2.67–2.81 s | pass |

### `gate:full` — 842 s of checks measured, plus the build

| check | runtime | today |
|---|---:|---|
| `verify-worlds.mjs` | 18.6 s | **3 fail** — goldens stale, see class G |
| `verify-regression-memory.mjs` (full) | 18.9 s | **1 fail** |
| `verify-architecture.mjs` | 19.9 s | pass |
| `verify-physics.mjs` | 24.1 s | pass |
| `verify-clearance.mjs` | 33.9 s | pass (was 3 fail at 21:53) |
| `verify-solidity.mjs` | 36.8 s | **1 fail** (was 4 fail at 21:53) |
| `verify-boot-state.mjs` | 62.6 s | **6 fail** |
| `components-smoke.mjs` | 66.1 s | pass |
| `verify-deploy.mjs` | 99.5 s | pass |
| `editor-smoke.mjs` | 103.8 s | pass |
| `verify-mobile.mjs` | 175.7 s | pass |
| `verify-perf-budget.mjs` | 182.4 s | **9 fail** — and it is in no npm script |

Six checks are over 60 s — `verify-boot-state`, `components-smoke`,
`verify-deploy`, `editor-smoke`, `verify-mobile`, `verify-perf-budget` — and
none of them can be made cheap, because all six drive a real page. They belong
in `gate:full` and nowhere else.

---

## A. Things standing in the road

**v1.** `BUGS.md` #1: **211 colliders inside the advertised drivable lane,
across 29 of 57 worlds**, and 1,884 objects inside the clearance the road
promises. `BUGS.md` #4: dry-stone wall runs laid inside the road width — a
continuous barrier a metre inside the edge, not a clippable post. Two of the
seven driving stalls were a car parked against a culvert parapet at lateral
0.1 m, in the middle of the carriageway. The owner's words for the whole
family: *"I waste too much time asking Claude Code to fix the worlds."*

**Root cause.** One mistake made at eight call sites. Each object was pushed to
a fixed lateral offset from **its own** centreline sample and never checked
against the **rest** of the lap. On a bend the lap curls back under the offset,
so the object lands in a different stretch of road, at the same height, in the
racing line. v1's own code knew this: `_clearsRoad` existed, and three of the
eight bad sites sat directly beneath a sibling that called it correctly, with a
comment explaining why.

**Was dustline vulnerable? Yes, and it was caught red.** On the 21:53 build
`verify-clearance` reported **17 solid colliders inside the lane the road
advertises** across all three tracks — a `church` at 0.22 m from the centreline
of a 7 m half-width road and 15.8 m tall, a `farmhouseL` at 0.68 m, eight hay
bales. On the 22:27 build, after the props moved (the church from (−204, 24) to
(−217, 30)), the same check reads: closest solid thing 10.73 m / 8.22 m /
8.23 m from the centreline on dustbowl / harbour / proving-ground, against
requirements of 7.45 / 7.95 / 7.95 m. That is the loop this file exists to
create: the gate named the object and its coordinates, somebody moved it, the
gate went green.

**What stands watch.** `tools/verify-clearance.mjs`, **33.9 s**. It loads every
committed track in the real engine and walks the real Rapier colliders and real
instance matrices — it does not restate the placement rule, because every one
of v1's eight sites was correct by its own local reasoning. The bar is
`gap >= road.halfWidth + CAR_HALF`, with `CAR_HALF` = 0.95 m read from
`data/car.json`, which is v1's `lateral >= widthAt + r + carRadius` written as
one inequality. It also checks each scatter layer's `minRoadDist` against the
largest its component can grow **at any seed**, so a reseed cannot walk a rock
into the road.

**Its own mutation record** (reported by its author, and its shape is
consistent with what I observed on the 21:53 build): a `barrierBlock` injected
at a control point the spline passes exactly through was named with
`gap 0.00 m`; forcing `isSolid()` false so the builder made no colliders at all
was refused with `NOTHING WAS MEASURED` rather than reported as a clean road —
which is the failure `components-smoke.mjs` originally shipped with.

**Not covered.** Solid colliders only (a component with no collider drawn across
the road is `verify-physics`'s ground). Only the lane the road **advertises** —
run-off and the AI's actual line are not tested. The margin is a car pointing
along the road (0.95 m), not a car broadside (2.17 m); the broadside figure is
printed, not enforced. Built-in tracks only. Nothing is driven, so a stall with
no collider on record — `BUGS.md` #2's four unexplained ones — is invisible
here. The drive-under exemption is exercised only by a synthetic control,
because no committed track has a collider overhead.

---

## B. The floor that was not there

**v1.** `BUGS.md` #7, RED CENTRE RUN: the car recorded **7.43 u below
`terrainHeight`**, then 3.38 u on a later run, and nothing on the run between.
Road surface −0.4, ground under its own centreline −21.2. The owner's words:
*"if I fall off a cliff… it's doing nothing"* and *"is the car above the ground
beneath it"*.

**Root cause.** A jump gorge is a 190 u trench, and the collapse was applied to
the road **wherever the trench passed under it**, on distance alone, with
nothing tying it to the crossing it was designed for. That lap met the trench
twice: one designed jump with raised lips and a gap warning, and one bare
21.75 u drop with nothing to read it by. The report's own conclusion is why
this class needs its own tool: *"Nothing stood in the lane, nothing was drawn
wrong, every collider check passed — the floor simply was not there."*

**Was dustline vulnerable? Yes — measurably, and the fix is in the tree.** The
painted road and the collider mesh are built from `heightAt` at two different
rates, and they agree only where `heightAt` is smooth at the lattice's spacing.
`Terrain.sdf()` used to answer with the nearest **cell**, making `heightAt` a
staircase with 4.11 m treads. Measured by this gate on DUSTBOWL LOOP, that put
the painted road **1.262 m clear of the ground beneath it — 119 % of the car's
1.06 m wheel ray**, so a wheel set on the paint there cast down and found
nothing. `src/tracks/terrain.ts` now interpolates both `d` and `t` bilinearly,
citing this tool's numbers in its own comment, and the gate reads **0.511 m
(48 %)** on dustbowl, 0.219 m on harbour, 0.396 m on proving-ground. Stations
past the 0.225 m a resting wheel can droop fell from 853 to 103.

**What stands watch.** `tools/verify-terrain-integrity.mjs`, **1.32 s**, no
browser. It walks 19,680 stations per track across the full advertised width
and compares the painted ribbon with a reconstruction of the exact collider
trimesh, self-checked to 1.8e-14 m at the lattice nodes. It refuses to report
anything at all if `terrain.ts` changes the eleven expressions its
reconstruction is pinned to.

**Mutation, run here, not taken on trust.** I added RED CENTRE RUN's own hole to
proving-ground in a scratch copy of the tree — `{at: 0.30, height: −21.75,
width: 0.000004}`, narrow enough that the 4.02 m ground lattice cannot resolve
what the 480-sample ribbon draws — and the gate went from
`PASS … worst separation 0.396 m (37 % of a 1.06 m wheel ray)` to:

```
FAIL  proving-ground: there is ground under the whole advertised width — worst
      separation 13.843 m (1306% of a 1.06 m wheel ray) — road floats 4.795 m
      clear at sample 145 lateral -7.00 (painted -2.44, ground -7.48), buried
      13.843 m at sample 144 lateral -4.20. A wheel set on the painted road
      there casts 1.06 m and finds NOTHING.
PASS  no committed track carries a validateTrack error
```

The second line is the point: the game's own shipped `validateTrack` says
nothing about a 21 m hole in the road. The file was restored and the baseline
reproduced exactly.

**Not covered.** It never drives — no car, no Rapier step. It asks whether the
two surfaces **agree**, not whether either is **drivable**: a road that dives
forty metres in three, with paint and ground agreeing all the way down, passes
every check in it. (Measured while it was in there, for whoever writes the
grade check nobody owns: worst floor step between consecutive lap samples is
0.94 / 0.46 / 1.62 m on dustbowl / harbour / proving-ground.) The road corridor
only — off-road sag, and whether scattered props are seated on it, is not
measured. Committed tracks only. Rapier is not queried; the collider surface is
reconstructed, not raycast.

---

## C. Scenery you can drive into

**v1.** The bug the owner reported three times:

> "I can still enter the mountains instead of hitting them" · "Still can
> enter." (with a photograph taken from inside a hillside) · "Still see the
> shark mountains there"

r148 fixed mountain solidity **for the massif cones**. It did not fix the
skyline. `_buildHorizon`'s rings and `_buildMesaHorizon`'s mesas registered
**no colliders at all** — 3,464 bare instances across 51 of 60 worlds — while
every check in the suite passed, because every check in the suite was looking at
the objects that had colliders. Traced and fixed only at r153b.

**Root cause.** A real fix applied to one code path with a second path left
bare, and no test spanning both.

**Was dustline vulnerable? Yes, identically — and this audit watched it get
fixed.** On the 21:53 build, `verify-solidity` reported:

```
FAIL  every horizon instance carries a collider (0 of 343 across 3 tracks)
FAIL  driven at 54 m/s, fixed-step (0.00833 s), the probe STOPS at the mountain
      — dustbowl: drove 198 m at a face 8.8 m away and ended up 189.1 m inside a
      61.4 m horizon-dome at -454.3,462.7, 42.8 m of its footprint standing on
      drivable ground, still doing 50 m/s — 93% of launch speed, and out the far
      side — "Still can enter."
```

Forty-eight of dustbowl's 135 horizon instances were inside ballistic reach of
the drivable ground and five were **standing on it** — no flight needed. On the
22:27 build, after `horizonSolids()` was added to `src/render/horizon.ts` and
wired at `src/world/build.ts:216`, the same tool reads
`PASS every horizon instance carries a collider (798 of 343 across 3 tracks)`
and `PASS driven at 54 m/s, fixed-step, the probe STOPS at the mountain`. The
gate named the defect at 22:01 and confirmed the repair at 22:27.

**What stands watch.** `tools/verify-solidity.mjs`, **36.8 s**. It is not "do
mountains have colliders". It enumerates **every path that puts geometry in
front of the player** and requires each one to carry a collider or be named in
the file with a reason — because a path nobody remembered is the bug. It keeps a
second-opinion exemption table away from the components themselves, since the
`solid` flag is the thing that can be wrong (declaring `solid: false` silences
`verify-physics` entirely). And it finishes by driving a probe at the mountain
at the car's terminal speed, fixed-step, with two controls: the same probe must
cross 200 m of open air without stopping, and must stop when dropped on the
start pad.

**Still red today: one check.** `every drawable in every built world belongs to a
path with a verdict` — 2 × `CylinderGeometry/MeshBasicMaterial` on each track,
6 objects with no rule and no exemption. That is the census refusing to ignore
something nobody has classified, which is exactly its job.

**Not covered.** Built-in tracks, one seed each. The probe is **one line through
one mountain** — the nearest one on the bearing from the world origin; a
mountain solid on one flank and hollow on the other would pass. It asks whether
a collider is there, not whether it is the right shape — a horizon collider's
fit is measured by nobody. The probe flies with CCD and no gravity, so it does
not answer whether a car landing at 50 m/s tunnels through the floor; measured
on dustbowl, **without CCD it does**. And it says nothing about *where* things
stand: an object in the middle of the road passes every check in it.

---

## D. Routes that cross themselves, and the field that stopped

**v1.** `BUGS.md` #3: MOUNTAIN TO SEA had **127 places** where two stretches
more than 40 samples apart pass within 12 u, and **58 of them within 4 u
vertically** — at that separation the two roads are the same piece of ground.
`BUGS.md` #3b, "the deepest thing in this report": the barrier test knew when a
car had **cleared** a wall and nothing about a car **underneath** one, so a
parapet on a deck ten units overhead was a wall in the face of anything driving
the leg below. Driven, the whole field was pinned within a few samples of the
grid — 0.18 of a lap in a minute against a roster median of 1.39. The owner's
photograph of the pile at OLIVE CROSSING came with: *"Bridge needs to be raised
higher."*

**Root cause, in two parts.** A physics test that modelled only one side of a
wall; and routes asking for more crossings than the terrain can lift. The second
part is not a builder bug — COORDINATION.md records two generic rescues
implemented, measured and reverted, and concludes that leg separation at a waist
is a **route-authoring decision**.

**Was dustline vulnerable?** Not today, and the reason is worth stating
precisely: no committed dustline track crosses itself.
`verify-terrain-integrity` measures it rather than assuming it — 0 pairs at
least 40 samples apart come within 17 m in plan on dustbowl, 18 m on harbour and
proving-ground (the threshold is the road's own full width). It also proves the
distance field is not answering one stretch of road with another stretch's
profile: each centreline sample is answered with a lap fraction from at most
3.09 / 3.19 / 3.53 m away along the lap, against a field reach of one cell
diagonal, 5.81 m. That second check is v1's `_jumpCut` sentence written in
dustline's own units.

**Its author's mutation** built a 12-point lemniscate phased so the crossing
falls **between** control points — the case the shipped validator cannot see —
and got three simultaneous failures out of this gate (41 pairs of stretches
within 17 m, closest 0.0 m apart with 0.00 m of height between them; the field
answering sample 340 with a lap fraction from 752 m away) while
`validateTrack`'s own control-point-spacing check stayed silent.

**Not covered.** The crossing census compares the baked centreline with itself:
two stretches a road-width apart but joined by a wall or a prop are not its
business. It never drives, so COORDINATION.md's unresolved field stalls — which
survived every geometric explanation — would not show up here. `road.gaps` and
`road.crossings` are read and honoured but schema 1 defines neither, so those
exemption readers have never run in anger.

---

## E. A screen that lies, and a tap that reads as a freeze

**v1.** `BUGS.md` #5: the START button read "START RACE", unblocked, on five
worlds that refused to start. `_syncStartButton()` ran on a level pick, a car
pick, an upgrade and a mode switch and **never on boot**, so the button was only
correct after you had already pressed it once — and its own doc comment said the
opposite was intended: *"A button that looks armed and then refuses is worse
than one that tells you first."* Then r152: picking a track ran a full
synchronous world build inside the click handler, and the owner photographed a
tap with the track list still fully visible and wrote *"the game is freezing"*.

**Root cause.** State painted only on interaction and never on first paint; and
long synchronous work on the main thread with nothing said about it. The r152
fix was not a faster build — it was **paint first, build after**.

**Was dustline vulnerable? Yes, and it still is.** `verify-boot-state` is red on
six checks today, and the failures are specific:

```
FAIL  tapping a track changes the screen within 200 ms — the picture did not
      change for 3980 ms after the tap. The click handler itself returned in
      1.1 ms, so nothing in the HANDLER is slow — the wait is `boot()` resuming
      from `await chooseTrack()` in a microtask and building the whole world
      before the browser is allowed to paint
FAIL  nothing is taken off the screen before there is a world to put in its
      place — at +877 ms the picker was gone, the world object existed and the
      render loop had not drawn a frame. Worst frame 74.0% pure black
FAIL  the race HUD is never in the page with nothing in it
FAIL  the editor builds its first world once, not twice — "—" -> "building…" -> "196 ms"
```

For scale, the tool prints its own denominator: one world build in this browser
is 187–194 ms for the **cheapest part of the job alone** (Terrain and scenery,
no Rapier colliders, no environment bake, no racing line, no cars) against a
200 ms tap budget. That is the number saying the build must move off the tap's
task rather than be optimised into it — the same conclusion r152 reached.

**What stands watch.** `tools/verify-boot-state.mjs`, **62.6 s**. It does not
read the DOM in a `requestAnimationFrame` callback, and its header explains why
that instrument cannot answer this question: a rAF callback runs at the *start*
of a rendering opportunity, so what it reads is neither the last composited
frame nor the next one — the tool's own first version "found" an empty HUD that
was never on screen. It takes real composited frames with CDP
`Page.startScreencast`, decoded with the repo's own `tools/png.mjs`. A screencast
frame arrives only when the screen **changes**, so the gaps between frames are
exactly the intervals during which the picture was frozen — a measurement that
does not care how fast the rasteriser is.

**Not covered.** One track, one viewport, one rasteriser: the **order** checks (a
frame between the tap and the build; the HUD filled before it is in the page)
are rasteriser-independent, the two **budgets** are not. Only the first paint of
each entry point and the first track pick — Restart, NEXT RACE and the editor's
New/Open dialogs replace the world too and are not measured. "Not blank" is not
"correct". Nothing in it measures the simulation, deliberately: every number is
wall clock because it is about the picture.

---

## F. A suite that never looked

**v1.** `BUGS.md` #6: `tests/playtest-all.mjs:11` looped
`for (let lvl = 1; lvl <= 28; lvl++)` on a 57-world roster, and
`test-affinity.mjs` stopped at 21. Worlds 29–57 had **never been swept** — and
six of the eight worst worlds in the whole report live in that range. The suite
passed. The suite had never looked. COORDINATION.md adds the second half: the
tests read `world/levels.js` (57 worlds, stale) while the game read `LEVELS` in
`track.js` (60), so a sweep reporting "57 worlds driven" silently missed three.
And `BUGS.md` #3: *"The first sweep said 6. That was the harness counting a list
it had already truncated to six examples."* A pass over a truncated set is not a
smaller pass; it is a false one.

**Was dustline vulnerable?** Structurally less so, and the reason is citable:
`src/tracks/registry.ts` discovers tracks with
`import.meta.glob('../data/tracks/*.json')`, so there is no written list to go
stale. `verify-coverage` asserts that this is still true, that no tool carries a
hardcoded roster or roster size, that every committed track is loaded in the
real game by some tool (3 tracks, 4 tools each), and that the built bundle
carries every committed track.

**What stands watch.** `tools/verify-coverage.mjs`, **0.19 s** — the check that
keeps the other checks honest. Two of its findings today are worth reading as a
demonstration that it is not decorative:

- `every checking tool is reachable from an npm script (19 tools) — NOT RUN BY
  ANYTHING: verify-perf-budget.mjs`. True: `package.json` has no
  `verify:perf-budget` script. `verify-regression-memory` reports the same gap
  independently. Two checks, arrived at from different directions, agreeing.
- `the code/comment scanner stayed in sync over all 26 tools —
  verify-boot-state.mjs:183 comment leaked into the code stream`. **This one is
  a false positive**, and it is written up under **Still unguarded** below,
  because a gate that cries wolf is how gates stop being read.

**Not covered.** It never drives. Coverage is inferred from source,
conservatively — a tool reaching every track by a cleverer route is
under-credited, which is the safe direction. The prose scan only matches
*quantified* claims (a quantifier, then a count, then "tracks"), so a stale count
written without one gets through — and one is in the tree right now:
`TRACKS.md:28` says "Two tracks ship" while three are committed and harbour is
documented seventy lines further down. That is `BUGS.md` #9's class ("documented
counts no longer match the roster"), alive, in a documented blind spot.

---

## G. Fixes that do not hold, and worlds that cannot be rebuilt

**v1.** The class this whole file is about. `MIGRATION.md` records a world's
crest count moving **6 → 0 across two builds with no code change**, *"which is
WHY the sinking bug is still open: I could not reproduce it."* A bug you cannot
reproduce is a bug you fix by guessing, and a guess is what comes back. v1 grew
56 test files because 56 things went wrong, every one written after the
incident, with no convention forcing it.

**Was dustline vulnerable?** The determinism half is closed and measured:
`verify-regression-memory` builds each track four times in one page and requires
the same fingerprint under two different `Math.random` stubs, built first and
built last — `a92dc3aa` on dustbowl, `96f9accd` on harbour, `8a98095f` on
proving-ground — and scans all 132 modules world construction reaches for
unregistered `Math.random`, with comments blanked so a porting note does not
count. The register half is closed by convention: `REGRESSIONS.md` carries 21
rows, and the tool fails if a row names a check that does not exist, if a named
check is not reachable from `gate`/`gate:full`, or if a check-shaped tool exists
with no row claiming it.

**What stands watch.** `tools/verify-regression-memory.mjs` — **0.09 s** in its
`--static` form (checks 1 and 2, source only) and **18.9 s** for the full form
that rebuilds every world four times in a browser. `tools/verify-worlds.mjs`
(**18.6 s**) holds the golden fingerprints.

**Red today, and correctly so.** `verify-worlds` reports all three fingerprints
changed (`70668082 → 56fd6457` on dustbowl, and likewise on harbour and
proving-ground). That is the bilinear `sdf()` fix from class B: `heightAt` seats
every prop, so improving it moved every object in every world. The change was
intended and the goldens need re-blessing with
`npm run verify:worlds -- --update` **by whoever owns that change** — a fresh
build's fingerprints, blessed by someone who can say why they moved. Nobody
should bless them to make a gate quiet.

**Not covered — and one gap is measured rather than guessed.** The register
cannot tell whether a registered check is any **good**; a file printing PASS
unconditionally satisfies every rule in it, which is what mutation testing is
for. The determinism run observes the **editor preview**, which builds no
colliders at all, and compares runs within one page load on one machine. And the
gap neither fingerprint closes: a **deliberate, deterministic** change to a yaw,
an X/Z scale or a geometry is invisible to both — dropping the near horizon
ring's width factor from 1.45 to 0.35, every near hill four times too thin,
*the literal shark fin the owner reported*, leaves `verify-worlds` printing
"every world matches its fingerprint" with byte-identical goldens. The fix is
named in `REGRESSIONS.md` and in the tool's header: four lines in
`verify-worlds.mjs` to traverse instead of skipping non-`InstancedMesh` nodes
and to hash all sixteen matrix elements instead of 12/13/14 and 5. **It is not
done.** Until it is, "Still see the shark mountains there" is guarded against
re-rolling but not against being authored.

---

## H. Two games becoming one build

**v1 has no incident here — this trap is dustline's own.** There are two games
in this repository, and dustline takes a great deal *from* the older one: house
templates, the boat loft, painted textures, sky, flora, lighting numbers. All of
it was **copied and converted**, and every ported file says so in its header.
None of it is imported. One `import { X } from '../../src/textures.js'` at 2 a.m.
makes the two builds one build, after which a change to v1's 910 KB `track.js`
— which nobody in this folder reviews — can break this one. The app would still
run, so nothing would tell you.

**What stands watch.** `tools/verify-separation.mjs`, **0.39 s**: no module
specifier, file path or symlink leaves `dustline/`; no v1 artefact is named
outside a comment (naming `src/textures.js` in a provenance comment is
*required* by the porting convention, so the scan reads source with comments
blanked); three comes from the package; and `PORT.md`'s 102 cited paths all
exist.

**Mutation, run here.** Three defects introduced in a scratch copy of the tree,
each reverted after:

| what I broke | what the gate said |
|---|---|
| `import { paintRoad } from '../../../src/textures.js'` at the top of `terrain.ts` | 3 FAILs — module specifier, opened path, and v1 module named outside a comment, each with `src/tracks/terrain.ts:1` |
| `ln -s ../../../src src/v1` | `FAIL no symlink under dustline/ points outside it — src/v1 -> ../../../src` |
| `from 'three'` → `from '../../../lib/three.module.min.js'` | 3 FAILs, including `three.module.min.js` named outside a comment |

Restored, it prints `dustline reaches into nothing but its own folder`.

**Not covered.** It reads text. A dependency added to `package.json` that itself
reaches into v1 is not its business, and neither is a runtime `fetch` of a v1
URL built up from string fragments.

---

## I. On a phone, the car did not move

**v1's contribution here is the lesson, not the bug.** dustline shipped with
`core/input.ts` handling keyboard and gamepad and nothing else — no touch input
at all — on a game aimed at a phone. "Was the code written" and "does a thumb
move the car" are different questions, and only the second is the one that gets
asked when somebody picks up their phone. This is `BUGS.md`'s recurring shape in
a new place: a check that reads the DOM would have waved it through.

**What stands watch.** `tools/verify-mobile.mjs`, **175.7 s**. It loads the built
bundle in an emulated portrait phone, dispatches real touch events through the
DevTools input domain — the path a finger takes, not a synthesised DOM event —
stops the render loop outright and advances the world only through
`__dust.fastForward(n)`, so the distances are frame-rate-free. It measures 44 px
targets, overlap, notch intrusion and page-scroll suppression across 8 layouts,
and it carries an idle negative control.

**Mutation, run here.** Three defects introduced in a **copy of the built
bundle** served through the tool's own `DIST` hook — the shared tree was never
touched — each reverted after:

| what I broke, in the bundle | what the gate said |
|---|---|
| `analog.throttle = 0 * Math.max(0, …)` — the pad no longer opens the throttle | 4 FAILs: `THE CAR DRIVES … thumb 0.00 m (0 km/h avg), idle 0.00 m`; `a thumb dragged to full travel opens the throttle`; `THE STEERING … the pad did not turn the car at all`; `the touch merge is an identity … Δ 14.548 m` |
| `analog.steer = +this.shapeSteer(…)` — steering the wrong way round | 1 FAIL, naming it: `THE STEERING IS CONNECTED AND THE RIGHT WAY ROUND — thumb-left −45.7°, keyboard-left 92.8° — THE PAD STEERS THE OPPOSITE WAY TO THE KEYBOARD` |
| `touchmove` handler no longer calls `preventDefault()` | 1 FAIL: `a steering drag scrolls nothing and zooms nothing — 3 touch events, all preventDefault()ed: false` |

The second and third mutations each produced **one** failure, not a wall of
them, which is the property that makes a red run readable. Restored, the tool
prints `phone-drivable: 14.5 m of car per two thumb-seconds, 46° of steering,
and a desktop that never sees any of it`.

**Not covered.** Emulated devices, not real hardware — a real iOS Safari can
differ. The scroll check asserts on the `preventDefault()` flags, not on an
observed scroll (the emulated page does not scroll either way), and it says so.
One track, one car.

---

## J. A fidelity pass that quietly spends the frame budget

**v1's record cuts both ways here.** `BUGS.md` says every world drew at
0.5–1.3 fps under SwiftShader and warns *"do not quote them as device
performance"*; ARCHITECTURE.md quoted a software-rasteriser triangle figure
anyway. `ART-DIRECTION.md` argues the flat-shaded look partly on cost and states
the rule — *"every change that raises geometry reports its measured triangle
count and draw calls, per track, before and after"* — which is worth nothing
unless somebody takes the numbers.

**What stands watch.** `tools/verify-perf-budget.mjs`, **182.4 s**. It reports
only what is device-independent: everything counted from `renderer.info` is an
API-level count, byte-identical whether the GL underneath is SwiftShader or an
Apple GPU. It never prints a millisecond of render time. The two CPU timings are
explicitly one-sided: this machine is faster than the target phone, so passing
proves nothing and failing is proof.

**Red today, on all three tracks:**

| track | worst portrait frame | of budget | draws | of budget |
|---|---:|---:|---:|---:|
| dustbowl | 241,074 | 161 % | 271 | 136 % |
| harbour | 525,052 | 350 % | 484 | 242 % |
| proving-ground | 386,315 | 258 % | 414 | 207 % |
| budget | 150,000 | 100 % | 200 | 100 % |

It also localises the spend rather than just refusing: 71 % of proving-ground's
triangles are in two world-spanning meshes (terrain 100,352 and road 5,760) that
no camera angle culls; 52 % of the frame's draw calls are cars — 164 separate
meshes over 32 materials, of which merging by material is 132 calls per pass.
The fixed step fits its own period on this machine (0.79–0.92 ms of 8.33 ms).

**Not covered.** It is not a frame-rate measurement and does not claim to be. It
measures the world as built at fixed camera stations, not a driven lap.

---

## K. The two classes that were closed before this audit

Stated briefly, because they were already gated and both passed here.

- **A collider that is not the shape you can see.** Every building was collided
  as a circle: `houseCollider` took each template's bounding *radius* and
  returned a cylinder, wrapping the 11.8 × 9.0 m pueblo ruin in a 17 m disc —
  four metres of invisible wall off each corner, in an empty street, with
  nothing on screen to blame. `tools/verify-physics.mjs`, **24.1 s**: 86 solid
  components, every collider matched to its geometry, 51 full / 17 trunk / 18
  partial coverage declarations.
- **Objects built to no real dimension.** Get a mountain wrong by 30 % and
  nobody can tell; get a street lamp wrong by 30 % and the street looks like a
  model railway. `tools/verify-architecture.mjs`, **19.9 s**: 79 dimensional
  rules, every component carrying a rule or a stated exemption.

---

## Still unguarded

Everything in this section is either open, or a limit the gates state about
themselves. Nothing here is speculative — each item is either a run I made or a
line the tool prints about itself.

### Open red on a clean tree, today

| check | what is red | whose call |
|---|---|---|
| `verify-boot-state` | 6 checks — the 3.98 s freeze on a track tap, the black frames, the empty HUD, the editor's double build | the owner of `src/main.ts` / `src/ui/trackSelect.ts`; the fix is r152's, paint first and build after |
| `verify-perf-budget` | 9 checks — 161–350 % of the triangle budget, 136–242 % of the draw-call budget | a content decision, and the tool says so: "Cut the world, or argue with the derivation — in writing, with a source. Do not nudge the constants." |
| `verify-worlds` | 3 fingerprints moved | re-bless with `--update` after the bilinear `sdf()` change, by whoever made it |
| `verify-solidity` | 6 drawables (2 per track, `CylinderGeometry/MeshBasicMaterial`) with no rule and no exemption | classify them or exempt them by name |
| `verify-coverage`, `verify-regression-memory` | `verify-perf-budget.mjs` is in no npm script | the parent session wires `package.json` |

### Two wiring facts the parent session should fix

1. **`verify-perf-budget.mjs` runs from nothing.** Add
   `"verify:perf-budget": "node tools/verify-perf-budget.mjs"` and append it to
   `gate:full` (182.4 s measured — it is not a `gate` check).
2. **`gate` runs the browser form of `verify:regressions`.** `package.json` has
   `"verify:regressions": "node tools/verify-regression-memory.mjs"` inside
   `gate`, which launches chromium against whatever build happens to be sitting
   in `../play-dustline` — a check reporting on a build nobody made, which is
   the exact shape of problem `REGRESSIONS.md` warns about in its own "How it
   runs" section. `gate` should run `--static` (**0.09 s**, measured) and
   `gate:full` the full form (**18.9 s**, after its build).

### One gate is red for a reason that is not a defect

`verify-coverage`'s check 0 reports
`verify-boot-state.mjs:183 comment leaked into the code stream — every scan
below is now blind`. I verified this is a **false positive**, by extracting the
tool's own `split()` and running it:

- the four flagged lines (183, 184, 185, 187) all sit **inside the `INIT`
  template literal** that spans lines 177–201 of `verify-boot-state.mjs` — an
  injected browser script whose `//` lines are string content, not comments;
- `split()` is behaving correctly: the code and comment streams are the same
  length as the file, and the first real `//` line elsewhere in the file
  (line 119) **is** blanked in the code stream.

The invariant "a source line starting with `//` must be blank in the code
stream" is true for comments and false for string content. The consequence
matters more than the bug: the message says "every scan below is now blind"
when the scans below in fact ran and passed, and `gate` exits 1 on a clean tree.
A gate that cries wolf is how gates stop being read. The fix belongs to
`verify-coverage`'s author — exclude template-literal spans from the invariant,
or assert it only outside them. **I did not edit it**; sibling gate files are
not mine to write.

### One stale sentence inside a gate's failure text

`verify-terrain-integrity`'s failure message still prescribes the remedy that
has already been applied: it describes `Terrain.sdf()` as answering "with the
value of the nearest CELL" and recommends bilinear interpolation of `d`.
`src/tracks/terrain.ts` now interpolates both `d` and `t`. I saw the obsolete
text printed verbatim when I triggered the failure with the RED CENTRE RUN
mutation. The check itself is correct; only its advice is out of date.

### Environment fragility that will bite in CI

- **Three tools default to port 8907** (`verify-clearance`,
  `verify-architecture`, `verify-perf-budget`), two to 8913 (`verify-mobile`,
  `verify-regression-memory`) and three to 8903 (`components-smoke`,
  `editor-smoke`, `verify-worlds`). Run serially inside one `gate:full` this is
  harmless. Run concurrently — which happened twice during this audit — and
  `ensureServer` **reuses a foreign server it does not own**, which then
  vanishes when the other process exits. The symptom is not a clean failure:
  `verify-perf-budget` died with
  `net::ERR_CONNECTION_REFUSED at http://localhost:8907/…` and, on another run,
  `window.__dust never appeared after 180 s` while the real cause was a dead
  server. Both runs were clean when given a server of their own.
- **A concurrent `vite build` into `../play-dustline` breaks any browser tool
  mid-flight.** `verify-clearance` timed out after 200 s at 21:53 for exactly
  that reason: the hashed bundle it had been served was replaced underneath it.
  `verify-perf-budget` prints the right diagnosis for this case; the others do
  not.

### App-side hooks that were wanted and could not be added

None. Every gate here is written against what the app exposes today
(`window.__dust`, `window.__editor`, `__dust.fastForward(n)`), and
`verify-coverage` check 10 asserts that the fixed-step hook stays fixed-step:
`src/main.ts:247 fastForward steps FIXED_DT; src/core/loop.ts FIXED_DT = 1 /
FIXED_HZ`. If that hook is ever renamed or made wall-clock, four tools stop
being able to measure anything and one of them will say so.

### Classes with no owner at all

- **Drivability, as distinct from geometry.** v1's clean list included "no
  vertical step in a road surface above 2.5 u, and no grade past what the car
  can climb". Nothing here checks either. A road that dives forty metres in
  three, with paint and ground in perfect agreement, passes every gate in this
  repository. The measurements exist —
  worst floor step between consecutive lap samples 0.94 / 0.46 / 1.62 m, worst
  step across one 1.64 m wheel track 1.23 / 0.46 / 0.68 m — but nobody asserts
  on them.
- **`BUGS.md` #2's unexplained stalls.** Four of the seven had no collider on
  record at the stall point. Nothing in dustline drives a field of rivals for a
  fixed-step lap and asks whether they made progress. `verify-mobile` drives one
  car for 2 s; `verify-solidity` drives a probe in a straight line. Neither is a
  race. This is the largest hole in the roster, and it is the one COORDINATION.md
  is still open on in v1.
- **Tracks that are not committed.** localStorage tracks and `?t=` share links
  are outside every check here except the runtime `trackErrors` path. The good
  news is the converse: because `registry.ts` globs `src/data/tracks/*.json`,
  a track added there is under all of these checks the same day.
- **Deliberate, deterministic changes to yaw, X/Z scale or geometry** — see
  class G. The discrimination already exists in
  `verify-regression-memory`'s full-transform hash; only the golden is the wrong
  shape.
- **Real hardware.** Every rendering number in this repository is an API-level
  count or a software-rasteriser timing. No gate here has ever run on a phone.

---

## Running the gates

```bash
cd dustline
npm run gate        # 15 s measured, source only — no build, no browser
npx vite build      # gate:full builds first; it writes ../play-dustline
npm run gate:full   # 842 s of checks measured, plus the build
```

A single check, when one goes red and you want it alone:

```bash
node tools/verify-clearance.mjs --table          # every offender, not the first four
node tools/verify-terrain-integrity.mjs          # 1.3 s, no browser
node tools/verify-regression-memory.mjs --static # 0.09 s
BASE=http://localhost:8951/ DIST=/some/copy node tools/verify-mobile.mjs
```

The last form is how the mutations in this file were run: against a **copy** of
the tree or of the built bundle, on a private port, so the shared build is never
touched. That is the standard, and it is not optional — `REGRESSIONS.md` rows 7,
10 and 15 exist because a check failed its own mutation test and had to be
rewritten, and `components-smoke.mjs` shipped its first version passing happily
with the builder deliberately broken to sink every boat.

**A check that has never been red is not known to work.**
