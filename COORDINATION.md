# COORDINATION — parallel Claude sessions on this repo

Three sessions are iterating on this game at once. This file is the shared
blackboard: what each lane owns, and measurements one session made that
another needs. Update it when you claim or finish a lane; read it before
starting work that might be someone else's.

_Last updated: 2026-08-14, by the mainline session (r175)._

## Lanes

| Session | Branch | Owns right now |
|---|---|---|
| Mainline (racing-shooter-game) | `claude/racing-shooter-game-0td0g7` → main | Menu/UX, economy, tyres, editor, releases rNNN. Shipped r152 (deferred track pick — `main.js` picker + `index.html` veil). Next after r153: world-build speed pass — **waiting for the scrutineering branch to merge first** to avoid track.js conflicts. |
| Track scrutineering | `claude/agent-track-testing-bugs-f6jfms` | BUGS.md findings #1–#4: road-clearance gating at the eight placement call sites, MOUNTAIN TO SEA crossings, wall runs. agent-sweep + world-matrix harnesses. |
| Dustline | `claude/codebase-architecture-refactor-eos0rs` | The `dustline/` TypeScript rewrite, self-contained, deploys to `/V2/`. Normally no contention with `src/` — one exception below, shipped as r153b. |

## Measurements crossing lanes

**BUGS.md #8 (TOUR DE CORSE / PIKES PEAK slow laps) is a sweep-harness
artifact, not a game bug.** Measured on r152 main, fixed-step 1/60, composer
stubbed, 60 s of racing with the game's own rivals:

| World | rivals laps/60 s | rival samples off-road | sweep's number |
|---|---|---|---|
| TOUR DE CORSE | 1.67–1.74 | **0 of ~3000** | 0.67, 23 % off-road |
| PIKES PEAK | 1.84–1.90 | 0 | 0.74 |
| MONZA | 2.97–3.12 | 0 | 2.08 |
| PINE VALLEY | 2.29–2.35 | 0 | 1.29 |

The precomputed `_raceLine` also fits the corridor everywhere it was checked
(worst excess past `widthAt − 1.6`: 0.0 u on CORSE, 0.95 u on VINEYARD).
The sweep's own lookahead steering cuts the Corsican hairpins; the shipped
rival AI does not. Suggested fix lives in `tests/agent-sweep.mjs`, not in
`src/vehicles.js`.

**BUGS.md #5 is half-obsolete since r151.** The tyre gate no longer exists —
nothing refuses to start; the mismatch is priced in grip (`tyrePenalty`,
−17 %/class under, −9 %/class over). The real residue — `_syncStartButton()`
never ran on boot, so a fresh page load painted a stale button — is fixed in
r153. The FROST-PEAK-early design worry is moot for the same reason: you can
race it on stock tyres at −17 %.

**The canonical roster is `LEVELS` in `src/track.js` — 60 worlds, 14
regions.** `src/world/levels.js` (57 worlds) is a stale copy nothing in
`src/` imports; BUGS.md #6 recommends suites read the roster from it, which
would bake the staleness in. Point `agent-sweep`/`playtest-all`/`test-affinity`
at `src/track.js`'s export instead — the sweep's "57 worlds driven" missed
CITADEL BAY (58), CLIFF KNOT (59) and SEA CLIFF RUN (60).

**Horizon mountains were enterable and are now solid (r153b, dustline
session).** Reported straight to that session with a photograph taken from
inside a hillside on an r152 build. r148's massif fix never covered the
skyline: the rings from `_buildHorizon` and the mesas from `_buildMesaHorizon`
registered no colliders at all — 51 of 60 worlds, 3,464 bare instances.
Fixed with r148's own cone rule (long axis x 0.48, seated on the highland,
`h` for the full-height gate). The two edits sit at ~13790 and ~13990 in
`src/track.js` — OUTSIDE all eight placement call sites the scrutineering
lane claims. New standing test: `tests/test-horizon-solids.mjs` (census over
all 60 worlds + 4 driven runs). test-mountains and test-walls still pass.
The new solids sit >=360 u from every road; the 1-24 u clearances a sweep
will find on COL DE TURINI / GOTTHARD / OLIVE COAST are r148's own massif
cones hugging alpine roads, pre-existing and by design — do not "fix" them.

**The field-stall family (BUGS.md #2) is reproduced fixed-step, quantified,
and partially eliminated — dossier for whoever fixes it (dustline session,
2026-08-11).** Two more user photographs arrived: the whole field parked under
MOUNTAIN TO SEA's deck, and a pile at OLIVE CROSSING's crossing ("Bridge needs
to be raised higher"). `tests/test-field-stalls.mjs` (new, deliberately RED on
57/56/60) reproduces it: under a true 1/60 step the rival field runs 0.13 /
0.30 / 0.70 laps in 90 game-seconds on MOUNTAIN TO SEA / OLIVE CROSSING /
SEA CLIFF RUN, against 1.9-2.1 on PINE VALLEY, TREMOLA and SUMMIT CLIMB.
Jam sites are stable: 57 at (4,-72) frac 0.12, 56 at (-80,130) frac 0.29,
60 at (-82,-58) frac 0.67.

Eliminated (all measured): racing-line curvature / width / `_speedInv`
(healthy, equal to PINE VALLEY's); traffic (none spawns on these themes);
the grid position (rotating the route moved the start — the jam stayed at the
same world coordinates); at-grade corridor overlap ALONE (56's jam site has
28 u of vertical leg separation, 60's has 11 u — though real at-grade
overlaps DO exist, see below). Stalled rivals sit at FULL THROTTLE, v 0-6,
legal lateral, correct index, alive. Whatever pins them is physical and local
to those three sites.

Two real authoring facts found on the way, independent of the stall:
`tools`→`tests/tool-overlap-census.mjs` shows MOUNTAIN TO SEA runs two legs
of its lap 1.3-2.8 u apart for up to 62 u (shared tarmac, opposing traffic)
and OLIVE CROSSING's west knot passes 3-12 u with a 0.3 u height gap — the
"raise the bridge" request is engineering-correct there whatever the stall
turns out to be. A near-miss extension to `_planOverpasses` was tried and
REVERTED: the dedup-vs-existing-crossings and the erosion pass made it a
no-op in exactly the dense knots it targeted.

**MEASURE FIXED-STEP OR MEASURE NOTHING** (re-learned the hard way): headless
SwiftShader runs these heavy worlds at a few fps with dt capped at 50 ms, so
wall-clock probes run the sim at ~1/8 speed — `raceTime` read 1.8 s after 20
real seconds, and every wall-clock "stall" observation before that discovery
was an artifact. Same trap as BUGS.md #8.

**The field-stall family is FIXED (r154/r155, mainline session).** Taking the
dustline dossier: the pin was never the racing line or the planner — it was
three collision/build rules, found by autopsying the pinned rivals in-engine:

1. **Barriers had no underside.** The collision gate knew "cleared the
   coping" but not "passing beneath it", so a car driving under a flyover
   was stopped by the deck's own handrail 8 u overhead — that is the
   photographed field parked under MOUNTAIN TO SEA's deck. Fixed in
   vehicles.js (`pos.y < q.y - 2.6` passes under).
2. **Deck rails never asked what else runs there.** At a fixed 10.2 u off
   their own samples, in knots where two legs pass 3-12 u apart, the rails
   stood in the OTHER leg's carriageway at its grade (OLIVE CROSSING's
   west knot: the whole grid parked against them at f 0.24). Fixed in
   `_buildOverpassDecks`: a rail that would stand in another stretch's lane
   within ±(-1.5..4.2) u of its height is not built. Same-grade knots keep
   the junction mouth open; high decks keep their rails (cars now pass
   under). NOTE for scrutineering: this composes with, and does not
   replace, your `clearance < 4 → no parapet` rule — merge both.
3. **The deep-stuck pit-lift re-seated the car INSIDE the trap** (same
   trackIndex), which is why jam sites were stable forever. It now advances
   +14 samples per consecutive lift.

Plus: `_element` (template houses) now refuses to stand in any carriageway
(height-aware; editor placements exempt) — SEA CLIFF RUN had huts IN its
coast road. Measured after: 57/56/60 run 1.5-1.8 rival laps/90 s, zero
stalls (were 0.13/0.30/0.70). `tests/test-field-stalls.mjs` is now a guard
(default sweep 57,56,60) — its header records the fix.

**For scrutineering — one structures-in-lane emitter your global gate
misses:** SEA CLIFF RUN still has 3 'hut' solids (r ≈ 5.2-5.8, not
building-registered) near (-84,-76) standing in the low coast road; the
field drives around them now, but they are BUGS.md #1 family. They appear
to come from the farm-spur barn path (`r: bw * 0.62` emission ~12340) or an
_element caller not routed through your site gate — worth folding into your
clearance pass.

**New Track surface: `track.placedElements` (r155, mainline).** `_element`
now records every structure it builds as `{type, x, z, rot, scale, r,
authored}` — the same vocabulary `edit.elements` speaks. It exists so the
world editor can adopt scenery it did not place (select → erase where it
stood → re-place the same template where you drag it), and it is a cheap,
accurate census for anyone auditing structures: `placedElements` beats
scanning `solids` because it carries the template name. Cost is one push per
`_element` call. If your lane adds a placement path that bypasses `_element`,
its structures will not appear there.

**Also new in r155:** an editor WIDEN/NARROW brush writing `edit.widen`
(`{x, z, r, w}`, w = target half-width) resolved in `_applyWidenEdits` into
the `_width` profile — so anything reading `widthAt(i)` sees an edited road
automatically. If your lane adds a new width consumer, read `widthAt`, never
`ROAD_HALF`.

**Field-stall update 2 (dustline session, written against main BEFORE r154
merged): cusps fixed, standoff mechanism pinned, remaining fix flagged as
route authoring.** The lone-rival probe caught a car pinned at exactly
|lateral| = wallLim with the recovery timer cycling, at MOUNTAIN TO SEA's
chain waist — whose control points sit 2-4 u apart ([2,-155],[2,-152]) and fed
the spline 21-30 DEG/station tangent cusps. SEA CLIFF RUN carried twelve such
kinks up to 60 deg from its sketch's sharp Vs. SHIPPED: a kink-relaxation pass
over the sampled centreline (cap 13 deg/station, kink stations pulled to their
neighbours' midpoint, tangents recomputed where moved). Healthy worlds are
provably untouched — their kink census is zero, PINE VALLEY / TREMOLA still
run 1.6-2.0 rival laps/90 s fixed-step.

Written up as "does NOT clear the stalls, needs route authoring" — true of
main at the time, which did not yet have r154's barrier under-gate / rail
intrusion / progressive pit-lift. **Re-measured on the merge of both fixes
(r155 + kink-relaxation, mainline session):** test-field-stalls PASS, 0
stalled, 1.6-1.8 rival laps/90s on 57/56/60 — see the result logged just
below this merge. The two fixes are complementary, not competing: kink-
relaxation removed undrivable geometry the racing line was choking on, and
the collision/pit-lift fixes cleared the standoff the kinks were masking.
Nobody needs to redraw a route waist — recorded here so neither lane re-opens
this expecting red.

**r153d (dustline session): two player-reported bugs fixed, one lead handed
over.** (1) LAP 1/1 on three-lap circuits — `lapsTotal` was read once in the
Game CONSTRUCTOR, so it described whichever world the page BOOTED on for the
whole session. FURKA RIDGE is the only `laps: 1` world; boot there, swap
anywhere (r152 picker, next-level, menu all swap in place) and the campaign
silently became one lap. Fixed in `swapLevel` beside the other per-level
refreshes — seed, track, theme and particles were all already recomputed
there and this was the one sibling left behind. (2) A car wedged on a chasm
face at 0 km/h with the throttle held: the recovery net only rescued cars
UNDER the terrain, so on-the-ground-but-immovable was unhandled. Player-only,
five seconds of full throttle with no motion. Both have standing tests
(`test-lap-count.mjs`, `test-wedge-recovery.mjs`), both mutation-tested,
`test-walls` still 12/12.

**INVISIBLE WALLS — unresolved, with the suspects narrowed.** Two reports on
r153c. `tests/tool-corridor-solids.mjs` (new) sweeps every world for solids
reaching into the carriageway. It cleared BOTH of this session's recent
changes: the r153b horizon solids never appear (>= 360 u from any road) and
the r153c kink relaxation cannot be it (`this.curve` is read only during
construction, so nothing is placed off the un-relaxed path). Everything the
sweep does list has a visible mesh beside it. THE LIVE HYPOTHESIS, untested:
the lateral clamp reads `widthAt(trackIndex)`, and `nearestIndex` is
hint-windowed +-30 precisely so a car keeps its own leg through an overpass
stack — where two legs share XZ (the first screenshot is a start grid UNDER
an overpass, and it is the same geometry as the field-stall pile) an index
that snaps to the wrong leg would clamp the car against a road edge belonging
somewhere else. One mechanism that would explain both reports and the stalls.
Fair game for whoever gets there first.

**INVISIBLE WALLS: FOUND AND FIXED (dustline session, 2026-08-12).** Superseded
the "not reproduced" entry below, which was wrong — not in any measurement it
reported, but in the question it asked. Every sweep in it walked the COLLIDER
list, found each collider's nearest centreline station and gated it against
THAT station's height. A mountain standing on the road is legitimate against
its own footprint; the road it blocks is on another leg, at another height, and
is never consulted. Asking it the other way round — walk the ROAD, evaluate the
vehicle's own predicates at each station across the drivable width
(`tests/tool-corridor-blockers.mjs`) — found it on the first run:

| world | what | how much road |
|---|---|---|
| FURKA RIDGE | massif cone, r = 138 | 58 stations, FULL width — 135 u of carriageway inside a mountain |
| FURKA RIDGE | a second cone, r = 118 | 31 stations |
| COL DE TURINI | one cone | 16 stations |

Two independent faults; the fix needs both halves.

1. **`_buildMassif` never looked at the lap.** Cones are placed on an azimuth
   ring by radius and angle alone. They now walk clear of the corridor (the
   same "push it back" shape the coast reflection above them already used),
   shrinking to fit only if the lap encircles them. Measured: 101 cones over
   14 worlds, **0 hidden, 0 shrunk** — every one of them just moved.
2. **The collider was a cylinder of the BASE radius.** `h` makes a solid bite
   over its whole span, which r148 got right for driving into a flank, and
   wrong for a road passing one 70 u up: 118 u of collider against 96 u of
   drawn rock on FURKA, so 22 u of open carriageway was walled off by nothing.
   `Track._formProfile` reads the drawn cross-section off the geometry, band by
   band, and `solidRadiusAt` (new export in `vehicles.js`) is the one place
   that answers "how wide is this thing at my height". Massif cones, skyline
   peaks and horizon mesas all carry it.

`tests/test-invisible-walls.mjs` gates it, and every check was
mutation-tested. Two results worth passing on:

- **With the placement guard in, the taper is not load-bearing on any shipped
  world** — flatten every profile to 1 and all 60 stay green, because the
  guard's 24 u margin already keeps the base cylinder off the corridor. It is
  kept because it is the honest model and the next world with a road up a
  flank meets it first, and it gets its own check (collider radius vs the
  drawn silhouette, read off the instance in the scene) rather than riding
  along on the others.
- **A ratio-based version of that check could not see a uniformly scaled
  profile** — a hollow mountain reads as the same shape. The shipped check
  compares absolute radii and holds a band, 0.55..1.05 of the drawn rock.

The driven check independently reproduces the reported symptom: with the guard
disabled, 3 stations of FURKA's racing line pin the car, the worst moving
**2.7 u in two seconds at full throttle**.

**Superseded — the "not reproduced" write-up (kept for the record):** Two
reports, both photographed on **r153c**
— which matters, because r153d then shipped the wedge rescue (full throttle +
no motion for 5 s), and both screenshots show exactly that state: a car
stationary with the field gone. Worth re-testing on r158 before hunting
further. Measured across all 60 worlds on r158 and all clean:

- no solid or obstacle blocking a road has a MISSING MESH
  (`tests/tool-corridor-solids.mjs`, extended to check for a mesh within
  r + 2.5 of every road-blocking collider — 0 worlds)
- the lateral clamp never fires on open tarmac: sampling the corridor at
  +-75% of `widthAt` across every station, with a warm hint, produced 0
  clamp-firing points on 60 worlds
- index tracking does not swap legs: walking the CENTRELINE with the game's
  own hint-windowed `nearestIndex` reports |lateral| < 3 everywhere, 0 index
  jumps — so the overpass-leg-swap hypothesis from the last round is WRONG
- the clamp is not tighter than the drawn road either. It looks like it (the
  ribbon is drawn to `widthAt + 2.0`, the clamp sits at `widthAt + 0.55`) but
  the clamp is on the car's CENTRE and the car's radius is 1.8, so its flank
  reaches `widthAt + 2.35` — slightly PAST the painted edge, which is right.

ONE REAL DEFECT FOUND, minor: `tests/tool-ground-mismatch.mjs` (new) compares
the terrain mesh against `terrainHeight()` near the road. Three worlds carry a
step where the ground you HIT is above the ground you SEE — HEDGEROW DASH
+1.6 u, OULTON PARK +1.6 u, SILVERSTONE +1.5 u, all at d ~ 8.3, INSIDE the
drivable half-width. That is an invisible lump at the carriageway edge on
those three. Not claimed; small and self-contained.

**ECONOMY / PLAYFULNESS PLAN — `ECONOMY-PLAN.md` (new).** A plan, not a
change: contract rungs that escalate with the player, rival behavioural
signatures, an unpaid daily line, and three cheap acknowledgement wins.
Recommends NOT re-pricing anything (r148's curve is measured and test-locked).
Written from the dustline lane and it stops short of the save schema —
S2.1 needs the mainline session's call on where a rung level lives, since
mainline owns the economy and the save format.

**Unclaimed findings** (fair game for whoever gets there first, say so here):
BUGS.md #2's two remaining unexplained stalls (NORDSCHLEIFE, DOLOMITI —
re-measure after r154, the under-gate/pit-lift fixes may have cleared them),
#6 (roster-wide sweep in the standing suites), #7 (RED CENTRE RUN 7.4 u
sink — mainline tracks it as its task #69/#82 family).

**nearestIndex wrong-leg mis-seed — FIXED (r160, mainline session), the
"live hypothesis" above is confirmed and closed.** `nearestIndex`'s hint-
windowed search is seeded from last frame's own answer; where an overpass
puts two legs of the same lap ≥40 stations apart at the same XZ, a hint that
is EVER seeded on the wrong leg (a big single-frame jump, a stale hint after
a reset) can only ever return points on that same leg forever after — the
correct leg sits outside the ±30 window's reach by construction, and next
frame's hint is this frame's answer. Fixed with two complementary pieces: a
`useY` tie-break (gated `!airborne`) once both candidates ARE in the window,
and — the piece that actually recovers a mis-seed, since height alone can't
break a tie the window never offered — when the windowed answer lands near a
known crossing's ramp, also search the crossing's OTHER anchor's own window
and take whichever is genuinely closer. `tests/test-index-recovery.mjs`
(new) adversarially mis-seeds the hint on the wrong leg for every overpass on
every world that has one and asserts one-call recovery: 46/46. This is a
real, narrow defensive fix (organic driving with a warm hint mostly never
mis-seeds, matching the r158 "not reproduced with a warm hint" finding above)
— it closes the mechanism, not necessarily either screenshot; keep it in mind
if a THIRD invisible-wall report ever comes in with a description matching a
big single-frame position jump (a reset, a rescue teleport, airborne landing
near a crossing).

**MOUNTAIN TO SEA field-stall rate — MEASURED, not caused by r159, not
chased further this round.** Re-verifying the above fix on top of `main`'s
r159 (`_element` authored-jitter/live-preview) turned up `test-field-stalls`
failing on MOUNTAIN TO SEA more often than the pre-merge baseline in small
samples (3/3 fail immediately post-merge). Isolated an A/B on identical code
minus r159 (same nearestIndex fix both sides, `c003d07` vs `HEAD`, 8 fixed-
step runs per side): pre-r159 3/8 fail (37.5%), post-r159 6/8 fail (75%) —
looked real at first glance. But `git diff c003d07..HEAD -- src/*.js`
outside editor.js is r159's entire track.js patch, and every world-gen
`_element(` call site (all but the two editor/preview sites, which pass
`authored=true` explicitly) still resolves to bare `Math.random` exactly as
before — r159 cannot alter MOUNTAIN TO SEA's own generated geometry, only
authored/previewed placements. No other src/*.js file changed in the merge
range. The stall coordinates across BOTH sides of the A/B cluster in the same
zone (roughly x:-85..-50, z:60..150 — CROWN/SLEEK/DUNE all stalled there on
both premerge and postmerge runs), consistent with one pre-existing flaky
danger zone rather than something new. A follow-up 5-run/5-run batch on the
same A/B came back 40%/60% — within noise for n=5. Net read: this is
pre-existing AI-driving flakiness at a specific MOUNTAIN TO SEA location, not
a r159 regression, and not blocking r160's ship. Logged here rather than
re-litigated: if someone has spare cycles, the zone above is where a kink-
relaxation or route-authoring pass (same family as the SEA CLIFF RUN /
chain-waist fix above) would most likely land.

**"163 is broken, keeps on refreshing" — fixed (r164, mainline session).**
Reported plainly, no other detail, right in the middle of a shipping burst:
r160 (twice, different title), r161 (economy), r162, r163 all landed inside
about an hour, several from parallel sessions. `src/offline.js` reloads the
page once whenever a new service-worker controller takes over — right,
because the worker that just activated already skipped-waited and claimed,
so the OLD code stays on screen until something reloads it — but the check
that decides "new controller" runs once per navigation with no rate limit.
A player who reopens or refreshes during a burst like that hits the check
again each time, and if another deploy has landed since their last reload,
gets reloaded again. Every individual reload is correct; a few of them in
a short span reads as "it keeps refreshing on me".

Fixed with a cooldown, stamped in `sessionStorage` (survives the reload
itself — a plain variable wouldn't): an auto-reload won't fire again within
`RELOAD_COOLDOWN_MS` (45 s) of the last one. A `controllerchange` inside that
window is DELAYED to wait out the remainder rather than firing immediately —
since the delayed reload re-registers and re-checks on the fresh load it
lands on, it still converges to whatever is newest, it just stops stacking.

Confirmed the mechanism against real deploys by hand (file-swapping the
served build under a live tab, twice in quick succession) before writing it
up — worth recording since the fix looks obvious in hindsight but the
diagnosis wasn't: `?level=163` was checked and gracefully clamps to a valid
world (not it), and a single continuously-open tab can trigger *at most one*
auto-reload under the pre-fix code too (`reg.update()` only runs once, at
boot) — the loop only shows up across SEPARATE reopens/refreshes landing on
different deploys, which is exactly the shape a live shipping burst produces
and a single steady-state test won't.

`tests/test-reload-storm.mjs` (new) drives the real `src/offline.js`
unmodified, in a real page, against a mocked `navigator.serviceWorker` whose
events fire on command — deterministic, since a real end-to-end drive of
this measured 30-100s+ per hop purely on Chromium's own SW update-check
latency (unrelated to the fix) and isn't a suite anyone wants in the regular
gate. `location.reload()` itself is left real (Location objects refuse to
have `reload` redefined) and counted from the Node side. 5/5.

**"Remove all floating objects across the game" — one roster-wide cause found
and fixed (r165, mainline session); the scenery sweep is STILL OPEN.**

FIXED: the unfired bullet pool. An `InstancedMesh` comes up with every slot at
IDENTITY, and `Weapons.update` — the only code that parks unused slots at zero
scale — is called by main.js only while the state is `race` or `finished`. So
on the title screen, in the garage, and all through every countdown, all 220
additive-blended rounds sat stacked at world (0,0,0). Measured on TREMOLA
DESCENT, whose origin happens to be 39.5 u above the ground: **798 px at
max delta 252** (saturated white) hanging in clear air over the menu backdrop,
confirmed by rendering the same frame twice with the pool hidden. Fixed by
parking every slot in the constructor. `tests/test-floating.mjs` (new, 6/6)
sweeps all 60 worlds for the SIGNATURE (an exact-identity instance matrix
means "never written") and pixel-diffs the title backdrop; it also pins the
obvious wrong fix — a live bullet must still get a drawable matrix. The
roster sweep found no other pool with this mistake.

STILL OPEN — the scenery half of the report (the photographed plank bridge).
`tests/tool-float-census.mjs` is a working column-metric census: bucket every
drawn part's footprint into a 2 u grid, keep the lowest geometry per cell, and
flag parts that are the lowest thing in their own column AND clear of the
ground. Per-PART height is useless (a roof legitimately sits 9 u up because
its walls reach the ground); the column metric is what makes the output
readable. Four probe traps already paid for, do not re-pay them:
  1. measure AFTER a few frames — anything positioned in `update()` is still
     at its constructor default before the first frame;
  2. skip the instancing TEMPLATES — one trunk and one foliage cone per
     species sit at the origin with identity transforms and share their
     materials with the InstancedMesh (painting one magenta turns the whole
     world magenta, which is how they were identified);
  3. skip ZERO-EXTENT instances — a parked pool slot collapses to a point at
     the origin and otherwise reports as one floater per unused slot;
  4. near the carriageway the ROAD is the ground, not `terrainHeight` — on an
     embankment or a shelf cut into a hillside the kerbs and retaining walls
     are 30+ u above the valley floor and entirely correct.
What remains is ~3k hits dominated by classes I have NOT yet separated and
which are probably legitimate: boats/pontoons/`flotilla`/`marina-*` float on
WATER (the probe compares against the seabed), `oldtown-strings` and
`oldtown-lanterns` are bunting strung between buildings, and anything standing
on another object whose supporting mesh was too large to stamp into the column
grid. Two spot-checked worst offenders (CANYON RUN `inst:Cone` 57 u,
`element-box` 35 u) photographed as fully grounded — i.e. false positives. NO
second real scenery floater is confirmed yet, and the photographed bridge has
not been located. Next step for whoever takes it: give the census a water-level
reference and stamp large meshes by sampling, then re-triage.

**The track list is a CAREER LADDER now, and it opens where you left off
(r166, mainline session).** Asked for as "track leveling and timeline; show
available tracks; auto scroll to the available next track".

Sixty worlds in a region-grouped grid answer "show me a night rally in the
desert" well and "what do I race next" not at all. There are now two views,
switched from a pair of chips in the filter bar's top row (so a fold can
never hide which one you are in) and remembered in `ir-tracks-view`:

- **TIMELINE** (the new default): the roster in CAREER order, which is
  already the price order — `starCost` counts rungs, one star per rung — so
  laid out in array order the list tells the progression story on its own. It
  only needed a spine, a rung badge, and a word per row saying OPEN /
  CLEARED / STARS LEFT / LOCKED.
- **REGIONS**: the old grid, untouched. This is what the filters were built
  for and it stays exactly as it was.

**ONE LADDER, and this is the trap.** Regions do NOT own contiguous blocks of
career order — PINE VALLEY holds rungs 1, 6, 11, 12, 13 — so the first cut,
which kept the region headers, produced a "sequence" that counted 1, 6, 11,
3 and read as broken. The timeline drops the headers entirely, runs 1..60
unbroken, and carries the region on each card instead. It also does NOT apply
the fresh-regions-first reorder the REGIONS view does: re-ordering a ladder to
surface new content makes the ladder lie about the career.

`nextTrack()` is the single derived answer to "where am I up to", used by the
scroll, the NEXT badge and nothing else — three cases in priority order:
first OPEN rung never driven ('unraced', the common one), else the first
still holding stars ('stars'), else the gate you are working toward
('locked'). Never stored, so it cannot drift from the unlock rule. Note the
third case is only reachable with an explicit `lv.cost` override: at the
default slope, clearing every open world always unlocks more than it clears.

Auto-scroll fires on the TRACKS tab button and once on boot (two rAFs, so the
fonts have settled the row heights it measures against) — deliberately NOT on
every repaint, which would fight `_renderLevelCards`'s existing scroll-restore
and yank the list while you browse. `test-menu-noreset`'s scroll-restore
assertion still passes unchanged, which is the guard on that. A next track the
current filter has hidden is left alone rather than scrolled to.

If your lane touches `_renderLevelCards`: cards are still DIRECT children of
`.region-row` in both views, and still carry `data-lvid` plus the filter
datasets — `_applyWorldFilter`, `_markCurrentCard` and the lazy-art observer
all work untouched. The timeline is layout (`#level-select.tl-view`), not a
second card builder. `tests/test-timeline.mjs` (new, 24/24) pins the ladder
being unbroken and in career order, all four `nextTrack` cases, the scroll
actually moving and landing on screen, and REGIONS still being intact.

**Road obstructions: THREE plausible theories measured and rejected before the
one that worked (r167, mainline session).** Reported from a photograph — a car
stopped dead in a forest with two pale bars laid across the carriageway. Census
tool is committed as `tests/tool-lane-blockers.mjs`; it walks the roster and
reports every collider whose footprint overlaps the driveable width, bucketed
by kind.

If your lane is tempted by any of these, the measurement is already done:

| Theory | Result |
|---|---|
| Width-aware `_edgeOff(i, extra)` at the 6 placement sites | 342 → 340. No effect. |
| `_clearCarriageway()` post-build collider nudge | **worse** — 140 → 152 barriers across 13 worlds. Moving a wall rigidly by its worst end swings the far end across a curving road. Per-end version: 342 → 313, still spread. |
| Raising `WALL_OFF` 10.4 → 11.4 | 342 → 340. |

None of the margin theories moved the number, and **that is still unexplained**
— worth knowing before anyone spends another roster sweep on it. The actual fix
came from asking *where* the blockers sit rather than why they might be
misplaced: mean lateral 2.5 u, range down to 0.0 — dead centre, not near the
edge, so no edge margin could ever have helped. The culvert parapet builder was
offsetting along `(sin roadYaw, cos roadYaw)` — the **tangent** — where the
normal was intended, laying its two parapets flat across the road instead of
down either side. `nrm` is `(tan.z, 0, -tan.x)` and `headingAt` is
`atan2(tan.x, tan.z)`, so the normal is `(cos y, -sin y)`; the fix is that one
substitution, plus a compact round collider on the wall line.

Also measured and rejected: modelling the parapet as a `_barrier` **segment**
is the tidier model and is much worse (140 → 497) — a straight 20 u wall beside
a curving road cuts the corner.

**Culvert headwalls make the same tangent-for-normal substitution** and only
escape because `_clearsRoad` discards the bad ones. Deliberately left alone:
fixing it would start *building* stonework where none stands today, which is a
world-content change, not a bug fix.

Remaining after r167: 286 — `barrier:stone` 140 across 7 worlds (from the
general wall builder), `solid:wood` 65, `solid:metal` 25, `solid:stone` 47,
`solid:hut` 9. Unclaimed.

**The overhead cameras were capped by a constant nobody was reading (r168 →
r170, mainline session).** "Fix the top down camera" — TOP-DOWN and TOP FAR sat
behind the car's RAW heading, which is the one thing an overhead view must not
do: from directly above there is no horizon to steady the picture, so every
flick of the wheel span the world around a car that appeared not to move.
Steering felt worse the more of it you did, which is why "fix the top down
camera" and "improve the steering" arrived as one complaint. They now take the
centreline's heading (`roadYaw`), damped, ahead of the `M.chase` branch.

The trap, and the reason r168 shipped a fix that did nothing: the
ground-clearance guard held `const MAX_UP = 13`, which capped **every** mode's
height above the car regardless of its config. Editing `CAM_MODES.h` was
therefore inert — measured TOP-DOWN, TOP FAR, TRAIL and CHASE all sitting at
exactly 13.0 u up. Now `Math.max(13, (M.h||0) + (lift>0?4:0.5))`; measured
after: 46.5 / 72.5 / 26.5 / 12.4 / 17.5. **If you change a camera constant,
measure `g.camPos`, not the config** — that is the whole lesson, and it cost a
release. `tests/test-camera.mjs` (7/7) judges each family against what it
follows: overhead against the road, chase against the car.

**Feats: the garage is a set of keys now, not a slider (r169/r170, mainline
session).** Asked for as "add more fun elements per track like I have to
upgrade enough or buy elements". Contracts are the DAILY money game — three
picks, rerolled, doable anywhere — so they never make one world feel different
from the next nor give a reason to buy a PARTICULAR part. A feat is the other
axis: fixed to the world, banked permanently in the career, and gated behind
one named line of the garage at a named level. `TRACK_FEATS` holds seven
archetypes, one per upgrade line, and `featsFor(levelId)` deals each world a
seeded pair. A locked feat is SHOWN on the card — seeing "GORGE LEAP · needs
DAMPERS 2" on a track you cannot yet beat is the mechanism, it turns credits
you are saving into a thing you are saving FOR.

Teeth, asked for separately as "if those are not met I won't get anywhere near
the podium but I'll be destroyed 6th": `kitReady()` is the unlocked fraction
and `kitHandicap()` is `1 + 0.16 * (1 - kitReady())`, folded into rival
`maxSpeed` in `vehicles.js`, with rival aggression scaled by `1 + 0.9 * kitGap`
in `startRace()`. **A fully kitted car gets exactly 1.0**, so every other
suite's balance is untouched for a player who has done the work — that is the
property to preserve if you touch it. Free roam and missions are exempt.
`tests/test-feats.mjs` 14/14.

**UNSTUCK button (r171, mainline session).** The automatic rescue nets are
deliberately slow — five seconds of HELD throttle before the wedge net fires —
so an idle car on a mountainside is never yanked off it. Right for a car the
game can detect is stuck, useless for nose-in against a rock. The 🆘 button
calls the SAME recovery branch, so a hand-called rescue can never diverge from
an automatic one, and spends a 30 s cooldown — free and instant it is not a
rescue, it is a faster line through every corner (aim at the apex, hit the
wall, teleport to the centreline at zero lateral). A refused press does not
extend the timer.

One gotcha for anyone adding per-race state: **the reset belongs in
`startRace()`, not `resetRace()`** — `startRace()` is the player-facing entry
and does not call `resetRace()` in that order, so a reset placed there is never
reached. Caught by `tests/test-unstuck.mjs` (9/9), not by reading.

**r172 makes a race cost something — four rules, one idea (mainline session).**
Asked for in a single message: eight cars rather than six, three wrecks and the
race is over, ice and water that actually feel slippery "especially with wrong
tires — which I need to buy", and a car written off for sitting in the snow on
road rubber. They ship together because separately each is a difficulty knob;
together they are the reason to walk into the garage.

**THE FIELD SIZE IS ONE NUMBER NOW.** `ENEMY_COUNT` is 7 and `FIELD` is derived
from it. Six had leaked into a dozen literals: the ordinal arrays stopped at
`'6TH'` in three places, the finish bonus was a six-entry table so 7th and 8th
both fell through to a flat 100, and `racer-count` said 6 in the markup. There
is now one `ordinal(n)` helper and a geometric finish-bonus curve (2000·0.075^r,
which fits the old hand-written table to within 10 % at every entry) stretched
across `FIELD`. **Two traps if you touch this:**

- `AI_COLORS` had FIVE entries and `EnemyCar` indexes it `slot % length`, so a
  seven-rival grid put a second CROWN and a second SLEEK on the line, identical
  in name, number and paint. FLATSIX and BASTION were added — the last two
  unused body styles — so every rival is a distinct machine.
- rival pace was `53 + slot * 1.1`, tuned for five rivals. Adding two walked the
  quickest car up to 61 — a silent difficulty increase riding along with a
  grid-size change, and above every car in the showroom. It is a FRACTION of
  the field now (`slot / (fieldSize - 1)`), so the band stays where it was
  measured whatever the grid holds.

**THREE HULLS (`HULL_LIVES`).** `deaths` was counted and spent on nothing but a
−300 score hit. The third wreck now calls `_raceOver()`, which is deliberately
NOT `finishRace()`: that function writes `career.finished`, pays credits and
rolls contracts and feats, and being destroyed out of a race must reward none
of it. Nothing banked, no place recorded, no star. `player.outOfHulls` stops the
respawn tick — without it the car pops back onto the road five seconds into the
results screen. Free roam is exempt and missions keep their own one-hull rule.
The HUD row that said `WRECKS: 0` now counts DOWN in pips and — note for the
mobile lane — **is no longer hidden on touch**: it was worth no screen space as
a tally of past mistakes and is essential as a budget.

**SURFACES: ONE NUMBER, `slick`.** 1 on ice, 0.55 in the wet, 0 on a dry road,
derived from `T.surface` in the physics and exported from track.js as
`surfaceSlick(level)` for the menus, so a track card and the car under the
player quote the same rule. Three consequences:

- snow grip 0.55 → 0.40 and wet 0.68 → 0.60. At 0.55 a snow stage was a
  slightly slower dry stage.
- the OFF-ROAD stat's buy-back is `(0.62 - 0.32 * slick)`. It used to return
  62 % of the deficit on EVERY surface, which meant an off-road machine on the
  wrong rubber was fine on sheet ice — the stat was doing the tyres' job.
- `tyrePenalty(over, under, slick)` — the under-spec price is `0.11 + 0.25 *
  slick` per class, capped at 0.72, replacing a flat 0.17 capped at 0.34.
  Measured on FROST PEAK: two classes short takes lateral grip 2.72 → 0.69.
  **The right tyres still pay exactly nothing, on every surface** — that is the
  property to protect if you retune this, or it stops being a reason to shop
  and becomes a tax.

**FURKA WAS AN ICE STAGE THAT ISN'T.** `SURFACE_BY_THEME` still listed
`furka: ICE` after the theme was remade as a bright SUMMER alpine pass against
the player's own photograph — green slopes, dry asphalt — and its
`surface: 'snow'` physics went with it. FURKA RIDGE was demanding SNOW TYRES
for a dry tarmac climb and charging a grip penalty for road rubber on a road.
It is `SEALED` now.

**BOGGING DOWN COSTS A HULL.** Five seconds of held throttle going nowhere, on
a slick surface, with the wrong class fitted. The distinction that makes it
fair: wedged against a rock is the world's fault and the existing net pulls you
out free; spinning road tyres in deep snow is a garage decision the game
announced on the card, at the start line and in the tyre feed. The wedge net
had to be taught to stand down (`!bogged`) — both watch for held throttle and
no motion at the same five seconds, and the free rescue was winning that race.

**TESTING NOTE THAT COST AN HOUR, worth knowing before you write a timed test.**
Under swiftshader this page runs about **2.5 physics steps per second**. A test
that waits nine seconds of WALL CLOCK for a five-second in-game timer gets 23
steps and 1.05 s of game time, and reports a rule that is working perfectly as
broken. Two fixes, both in `tests/test-hardmode.mjs`: drive `p.update(dt, stub)`
directly at a fixed 1/60 for anything on a game-time clock, and pin the car by
wrapping `step` rather than zeroing velocity from a competing rAF — the two
callbacks interleave, so a test-side clamp lands on the wrong side of the check
and the physics has already accelerated away by the time the rule looks.

`tests/test-hardmode.mjs` — 30/30 across all four.

**r173/r174: the garage became the game, and the AI got one measured fix out of
two attempts (mainline session).**

**EVERY CONSUMABLE IS FINITE AND BOUGHT (r173).** Three new UPGRADES lines —
`magazine` (90→240 cannon rounds), `rack` (1→6 rockets AND mines), `beacon`
(1→4 SOS charges, capped at 3 levels). `PlayerCar.rounds` is new; the cannon
was infinite because heat is a rhythm, not a limit. Capacity is set in
`applyUpgrades` and FILLED in both `resetRace` and `startRace` — the r171
lesson again: `startRace()` is the player-facing entry and does not call
`resetRace()` in that order, so anything filled only there is never reached on
a retry. `cannonDamage` 7·(1+0.18·lvl) → 3.5·(1+0.52·lvl).

If your lane touches the SOS: the charge count is what makes r172's bog rule
work at all. A pure 30 s cooldown is an UNLIMITED resource on a long stage, so
a player on the wrong tyres in the snow could always wait it out.

**THE PADLOCKS CHARGE YOU NOW (r173).** `kitPenalties()` returns a per-race
multiplier set applied in `startRace` AFTER `applyUpgrades`, never stored —
CANNON 2 unmet costs 45 % of the gun on that world, TIRES 2 costs 14 % grip,
DAMPERS 2 zeroes `damperLvl`, ARMOR 2 takes 18 % hull. `LOCK_COST` mirrors it
in words and must be edited with it. `kitHandicap` 0.16 → 0.32. **A fully
kitted car still gets exactly 1.0 and zero penalties** — that is the invariant
every other suite depends on.

**CAR RETUNE, AND THE TOOL THAT MADE IT MEASURABLE (r173).** `test-affinity`
had been failing on "every machine you can buy is the quickest somewhere" for
some time — FLATSIX won 13 of 21 worlds and CROWN/DUNE/ALPINE/PIT never won
anywhere. Retuned onto a strict speed/grip frontier (sleek 53/5.65, alpine
56/5.45, flatsix 58/5.35, pit 61/5.05, crown 64/4.60; loose: dune 55/5.32/1.02,
bastion 58/5.15/0.92). After: all seven paid machines win somewhere, BRAWLER
wins nothing at mean place 7.19/8. 7/9 → 8/9.

`tests/tool-pace-dump.mjs` + `tool-pace-rate.mjs` are the reason that was
tunable at all: a world build is ~2 minutes headless, so rating 8 cars over 21
worlds by page-load is a 40-minute loop. Dump the geometry once, re-rate any
candidate table in milliseconds. The rater PARSES `CAR_CATALOG` out of
`src/vehicles.js` rather than keeping a copy, and it reproduced the in-engine
result exactly before it was trusted.

**`test-affinity` HARD-CODED PORT 8901 AND IGNORED `BASE`** — fixed. A run
believed to be against a second checkout was silently driving the first one,
and aborted mid-sweep when that tree's files were edited under it. Cost a full
21-world sweep and a wrong conclusion about which tree had been measured.
Check any suite you plan to run against a worktree.

**QUESTS (r173) — the only reward in the game paid in PARTS.** `QUESTS` +
`Game.questState/_checkQuests/_renderQuests`, stored at `career.quests`, board
rendered in the GARAGE tab. Licences count DIFFERENT worlds (keys, not a
tally), so three podiums on the easiest world is worth one. A quest whose part
is already maxed pays 3× credits instead.

**MISSIONS GOT AN ANTAGONIST (r174).** `_missionLaunch` no longer always sweeps
the field — `def.duel`/`def.pursuit` keep `enemies[0]` alive and drive it with
the real race AI. DUEL is scored on MARGIN (`M.bestGap`) and PURSUIT on
time-in-range (`M.inRange`), both "more is better", so `_missionMedal` has to
branch before its `<=` lap-time comparison or a four-second defeat wins gold.
`missionNoGuns` gates the cannon, rockets and mines in `PlayerCar.update` and
MUST be cleared by `_missionReset` or it follows you into the next race.

**VISIBLE UPGRADES (r174).** `applyUpgradeKit(mesh, upgrades)` in vehicles.js
builds one named `upgradeKit` child group; `buildVoxelRacer` now publishes
`userData.rig` (wheelR, baseY, capTop…) so the kit never guesses at a roofline
that differs per body style. Called from `applyUpgrades`, which is the one
place that reads the garage row. Stock 0 meshes, fully built 26.

**AI: READ THIS BEFORE TOUCHING `EnemyCar` STEERING.** `tests/tool-ai-audit.mjs`
drives a fixed-step race and counts wall time, stalls, off-road time, pack
frames, reverse time, yaw jerk and progress spread. Two findings:

- **the field is a train** — 26–34 % of frames have 3+ rivals inside 6 u, and
  progress spread is 0.035–0.089. Every rival aims at the same `_raceLine`
  with a ±1.25 u offset, so eight cars sit in a 2.5 u band on an 18 u road.
- **they grind walls on mountain roads** — 17.2 s/race within half a metre of a
  barrier on ROCKFALL RAVINE, 14.2 s on GOTTHARD CLIMB.

**A lateral personal-line + separation-push fix for the first one was built,
measured and REVERTED.** It broke the pack up (~70 % fewer pack frames on PINE
VALLEY) and made the AI visibly worse doing it, because spreading a field
sideways aims it at the edges. Three runs a side, seconds within 0.5 u of a
wall: PINE 1.6/1.6/1.2 → 3.0/1.6/2.1; ROCKFALL 19.6/14.4/17.6 →
24.6/29.9/24.9; GOTTHARD 8.6/15.5/18.5 → 25.9/19.3/24.5. Fading it on narrow
roads did not save it — `widthAt` returns ~9 nearly everywhere. **Do not
re-add a lateral spread term.** String the field out ALONG the lap instead:
vary braking points and corner speeds per driver.

What shipped is the speed-scaled edge margin (`1.6 + min(1.9, (v-26)·0.07)`):
ROCKFALL 17.2 → 13.9 s (−19 %), GOTTHARD unchanged in mean but spread tightens
8.6–18.5 → 13.6–15.6, PINE unchanged.

**THE PACK METRIC IS FAR TOO NOISY FOR SINGLE RUNS** — the same build measured
258, 1206 and 1113 pack-frames on GOTTHARD across three runs. Three runs a side
minimum, or you are measuring rival `Math.random()`.

**r175: TYRES ARE A FITTING NOW, NOT A RATCHET — read this before touching
`tyreClass` (mainline session).**

Reported as "misleading message, as there is no way to change tires", with a
screenshot of `START — WRONG TYRES (−18% GRIP)`. Measured on a fresh career:

    tyreClass('brawler', {tires: n}) for n = 0..5  ->  [1, 2, 2, 2, 2, 2]

**One 600 CR purchase of a line advertised as "+4 % grip" moved the only car
you own to SNOW class permanently**, and every SEALED world — CANYON RUN,
EMBER PASS, SUMMIT CLIMB, all of GRAND CIRCUITS — then read WRONG TYRES with
no route back, because class could only ever go UP. The over-tyred advice
searched the catalogue by price without excluding cars you already own, so
CANYON RUN told a BRAWLER driver to **BUY THE BRAWLER — 0 CR**.

The API changed:

- `tyreMaxClass(carKey, upgrades)` — what the car has UNLOCKED (its own class
  from `offroad`, plus the TIRES bump). This is the old `tyreClass`.
- `tyreClass(carKey, upgrades, fitted)` — what is BOLTED ON. `fitted`
  undefined returns the max, so every pre-r175 call site and every existing
  save behaves exactly as before.
- `Game.fittedTyre(carKey)` / `Game.fitTyre(cls, carKey)`, stored at
  `garage.fitted[carKey]`, **clamped on READ** — swapping cars or buying an
  upgrade can otherwise strand a stored choice above the new ceiling.

The rule: **fitting DOWN is always free and always available** (any machine
can run road rubber); only unlocking a higher compound costs money. If you
add a call site, decide deliberately whether you want the ceiling
(`tyreMaxClass` — "could this car ever be legal here") or the fitment
(`tyreClass(..., fittedTyre(k))` — "is it legal right now"). `carFitness`
wants the fitment; the "which car should I drive" search wants the ceiling.

**MINES: 0.8 s ARM DELAY WAS 40 UNITS OF ROAD.** At racing pace a rival in
your slipstream drove over a mine before it was ever live — reported as "make
mines explode at contact immediately". Now 0.12 s, and CONTACT ALWAYS COUNTS:
an unarmed mine still detonates on physical contact, with the arming delay
governing only the wider proximity fuse. The dropper is excluded by `owner`,
so the delay was never protecting anybody.

Visibility (asked for as "needs to be visible from top down or back — that is
the camera"): body 0.5 → 0.78 u, ground ring 0.55–1.6 → 1.6–4.2 u, plus a
5.2 u additive vertical beacon. From TOP-DOWN at 46 u the old mine was a
handful of pixels; from a chase camera it hid behind the player's own
bodywork. If you touch `dropMine`, the beacon material is per-mine and must be
disposed alongside `lampMat`/`ringMat` in BOTH the boom path and the
pool-recycle path.

**JOBS TAB.** Contracts and quests now share one panel (`#tab-jobs`), and a
contract can be DECLINED — `career.declined[levelId]` holds ids, and
`_pickContracts()` filters by it, so a declined contract is not dealt at all.
`_offeredContracts()` is the board's view (everything, tagged), `_pickContracts()`
is what actually runs. Note for anyone rendering contracts: `c.desc` is a
FUNCTION on several pool entries (`(n) => ...`), taking the rung's `need` —
rendering it directly prints the arrow-function source, which shipped for
about ten minutes in a screenshot.

**A PROCESS FAILURE WORTH NOT REPEATING.** `applyUpgradeKit` was written and
verified for r174 and did NOT ship in it: it was UNCOMMITTED in a worktree
when the release patch was generated with `git diff <base>..HEAD`, which sees
only committed history, and the worktree was then reset. r174's commit message
claims a feature its diff does not contain. If you develop in a worktree and
move work by patch, commit in the worktree FIRST and diff after — or use
`git diff HEAD` so uncommitted work is included.

**r178 — THE CAREER LADDER IS TWO THINGS NOW: A SLOPE AND A FLOOR.**
Reported as "tracks are opening too fast". Measured on the real 60-world price
table, a player winning every race had 19 worlds open after three races and 58
of 60 after ten.

The slope used to be pinned at exactly 1★ per rung and that was load-bearing:
the ONLY thing stopping a permanent wall was "a finish banks 1★, so a finisher
earns a rung a race". So the wall is now closed by a rule and the pace set by a
number, instead of one number doing both jobs:

- `LADDER_SLOPE` (main.js, exported) = 2.5, multiplying BOTH the index rung and
  a level's own `cost:`. A `cost:` in the level table is a RUNG, not a star
  price — scaling both is what keeps the running order fixed when the slope is
  retuned. Do not "fix" this by hard-coding star prices in track.js.
- `_freeUnlock()` — race everything you can afford and the cheapest world you
  cannot opens anyway. Exactly one, and only while the debt stands.
- `isLevelUnlocked` never re-locks a world you have RACED. This is half of the
  same mechanism, not a nicety: without it a world opened at 15★ slams shut
  when the ladder's own price passes your total, and `_freeUnlock` spends
  forever re-offering a world already behind you. Measured: the career stalls
  dead at 7 worlds.

Worlds open after 3 / 10 / 20 races, simulated over the real table, for the
three player profiles (win every race / podium / finish last):

    slope 1.0 (r177)   19/58/60    12/43/60    6/22/43
    slope 2.0           7/33/58     6/22/43    4/11/22
    slope 2.5 (r178)    6/27/51     5/17/35    4/11/21
    slope 3.0           6/22/43     5/12/29    4/11/21

All three profiles still reach 60/60 at every slope — that is the floor doing
its job, and it is why 3.0 buys almost nothing over 2.5 for a weak driver
(their pace is pinned at one world a race by the floor, not by the price).
2.5 was taken because it roughly doubles the time a winner spends unrolling the
roster without touching the worst driver in the game at all.

Knock-on: `nextTrack()`'s 'locked' answer ("here is the gate you are working
toward") is now nearly unreachable, because there is essentially always
something open and outstanding. The floor's world is deliberately offered LAST
of the open ones, so it sits underneath the "go back for the stars you left"
nudge rather than deleting it. `tests/test-timeline.mjs` case 4 was rewritten
for this; `tests/test-ladder.mjs` (25 assertions) pins the pair.

Pre-existing failures confirmed against clean `origin/main` at r177, NOT caused
by this change: `test-round-fixes` 2/6 fail ("next world locked after 5th" —
that assertion predates star pricing and levels 1-3 are free; and the economy
figure), `test-pick` 1/12 fails (preview-watcher leak 58 -> 60).

**r179 — GORGE JUMPS: THE RAMP, THE PRICE OF MISSING, AND THREE HOLES NOBODY
PUT THERE.** Reported as "jumping the gorge is not good, needs fixing",
alongside "canyon run is not playable, too many bugs on the road" and a
photograph of a car standing inside a canyon wall. Driving the shipped AI over
CANYON RUN at r177 and logging every crossing found all three in one feature.

1. **THE RAMP CRESTED SHORT OF THE EDGE.** The lip was baked at `gapS`
   (derived from `spanU * 0.61`) while the surface actually fell away wherever
   `_gorgeCutOne >= depth*0.35` said it did. The two disagreed by two samples,
   leaving a **2.1 u drop between the crest and the rim**. Whether a car flew
   came down to whether it happened to still be airborne when it reached the
   edge: measured, **5 of 7 rivals fell in every lap** at gorge 110, and the
   two that cleared were the two that went airborne one sample earlier.
   Fixed by computing `_jumpCut` FIRST (it only reads x/z) and deriving the
   crest from it — `G.rimA`/`G.rimB` are now the last samples that still carry
   roadway, and the ramp crests on them by construction.

2. **THE RAMP MAY NOT EXCEED VY_CAP.** vehicles.js refuses to launch a car
   while the ground under it rises faster than 11 u/s. At 62 u/s that caps the
   grade near 0.18, so a STEEPER ramp does not launch harder — it does not
   launch at all, and the car rides it up and follows the road down the hole.
   The ramp now lays a constant 0.15 grade and is FILLED UP TO an absolute
   height, never added on top: the CANYON RUN approach already climbs at 0.18
   on its own, which is the cap by itself.
   Corollary: the launch cannot pay for a climb, because vy is capped whatever
   the ramp does. The far rim stood **2.9 u above the near one** — 0.65 u more
   than VY_CAP buys at racing speed — so the ramp now **levels the two lips**
   by building the low side up. After: 14/14 crossings clear on CANYON RUN,
   7/7 on RED CENTRE RUN, all airborne.

3. **THE TRENCH CUT THE ROAD WHERE NOBODY PUT A JUMP.** `_gorgeCutOne` carves
   `len` (190 u) either side of the crossing — that length is what makes the
   chasm read as a canyon — and on a closed circuit it crosses other legs of
   the same lap. Measured at r177, identical in both builds before the fix:
   CANYON RUN had **three unramped holes** besides its two jumps (samples
   40-44, 238-241, 492-497 of 900) and RED CENTRE RUN a 32 u one at 95-106.
   `_planJumpGorges` now walks EVERY eligible station straightest-first and
   takes the first whose trench touches the centreline only at the jump
   (`_trenchClearsRoad`, the `_clearsRoad` rule applied to chasms), shortening
   `len` to 0.62 then 0.40 before giving up on a station. Both worlds keep
   their full complement of gorges and have zero stray holes.

4. **MISSING IT NOW COSTS SOMETHING.** `groundHeightAt` follows the carve, so a
   car that came up short did not fall — it DROVE the U, 26 m down, along, and
   out the far side at 62-66 u/s unchanged. `track.jumpChasmAt(x, z)` plus
   `Car.intoChasm(exit)` make it a wreck. NOTE THE HAND-OFF: `respawn()` puts a
   car down at its own `trackIndex`, which over a chasm is mid-air, so
   `intoChasm` sets the index to the far rim first — without that the car
   respawns in the hole and burns all three hulls in under a second. This
   deliberately withdraws the old "drive out along the chasm floor" escape that
   `_gorgeCutOne`'s end easing was shaped for; the easing still shapes the
   hole, it is just no longer a way home.

`tests/test-gorge.mjs` (23 assertions) pins all four. ROCKFALL RAVINE asks for
a gorge jump and gets none — its straightest run fails the 0.009 curvature
test. Pre-existing, unchanged, and correct: it is the twistiest world on the
roster.

Pre-existing failures confirmed against clean `origin/main` at r177 and NOT
caused by this change: `test-jumps` 2 fail (FURKA RIDGE: 0 hops), `test-climb`
2 fail (both slope assertions). `test-obstacles` times out only when four
browsers share the box — it passes run alone.

**r180 — JUMP IT OR DO NOT PASS.** Asked for in those terms: "falling and
bouncing — can you jump, or if it doesn't jump it should wreck, so it must jump
to pass the road." r179 priced falling in at NINE metres under the lip, and
nine metres was still a room to move about in. Measured with the field slowed
to 31 u/s: twelve of fourteen dropped into the gorge and only ONE wrecked. The
rest bounced around inside it and drove out.

Two changes, and one wrong turn worth not repeating:

- **The wreck line is now 3 u under the LOWER lip**, not 9 under the upper one.
- **The landing lip sits 1.6 u BELOW the take-off** (`LAND_DROP`), and the
  take-off lip went 1.3 -> 2.2 u (`LAUNCH`). This is the only margin the jump
  has left to give: vy is capped by VY_CAP and the gap width is fixed, so how
  far the car is allowed to FALL on the way across is the last free variable.

**REJECTED, WITH THE MEASUREMENT — "touch the footprint at all and wreck".**
It is the obvious reading of the request and it is wrong, because the trench
crosses the road at a SKEW (`J.skew`, 0.5 rad) so its edge is a diagonal across
the carriageway, while `_jumpCut` — the thing that actually removes the roadway
— is one number PER SAMPLE with no lateral variation. A car out at the edge of
the road is therefore inside the geometric footprint while still on solid
tarmac. Measured: 11 of 14 rivals who had cleared the jump cleanly were
wrecked. If you touch this rule, the depth guard is what makes it safe; do not
remove it.

Every crossing now reaches one of two verdicts, and "drove out" is not one of
them at any speed:

    62 u/s   14 cleared,  0 wrecked, 0 drove out
    39 u/s   14 cleared,  0 wrecked, 0 drove out
    24 u/s    0 cleared, 14 wrecked, 0 drove out

The failure band sits around 31 u/s (10 cleared, 4 wrecked) — half racing pace,
so the stunt is still a stunt.

A MEASUREMENT TRAP, since the same one will catch the next person: "fell in"
cannot be `minY < lipY - 3` over the whole crossing window. The landing ramp
DESCENDS on purpose, so that metric scores every clean jump a failure — it
reported 14/14 falling in on a build where nothing fell in at all. Sample the
minimum only between the rims, and compare against `landY`, not `lipY`.

`tests/test-gorge.mjs` is 28/28.

**r181 — JOBS: THE BOARD YOU CHOOSE FROM.** Asked for as "expand the jobs, and
I can take a job and start driving it to fulfil it". The second half is the
feature. Everything the game had was handed to you for whatever world you
happened to be standing on — contracts are dealt at the start line for the
CURRENT world, quests tick along behind whatever you were going to do anyway,
feats are stapled to a world you have to find first. None of them is a
decision, because none of them sends you anywhere.

A job is a named world, a named objective, a named price, and a button that
takes you there. Three tiers now stack in the JOBS tab: **JOBS** (choose one,
go there), **CONTRACTS** (this world's daily slate, opt-out), **QUESTS** (the
long chains, passive).

- `JOB_POOL` — twelve kinds. `where` gates the worlds a kind can post on,
  `need` turns world + seeded roll into a target (null declines the world),
  `extra` adds kind-specific data (FACTORY DRIVE picks a marque you actually
  own), and the objective is checked by the SAME
  `check`/`prog`/`atFinish`/`lap` shape the per-race contracts use.
- `career.job` holds ONE, as plain data, rebuilt through the pool on every
  read — a saved job can never carry a stale objective.
- `_jobContract()` returns the job **as a contract**, and `startRace` unshifts
  it into `this.contracts` only for the world the job names. That is what buys
  it the per-frame progress, the lap/finish hooks and the HUD row without a
  second copy of any of them. `job: true` is read in exactly ONE place
  (`_completeContract`), where it takes the credit and returns BEFORE the rung
  ladder — a job has no ladder to climb.
- `career.jobsDone` closes a banked kind for the calendar day. Without it the
  board reposts the kind you just cleared and one BOUNTY is an unlimited
  credit tap.

**PAY IS CAPPED AND THE CAP IS THE POINT.** `_jobPay` scales the kind's base by
the world's ladder rung. Uncapped (`1 + rung/34`) rung 58 paid 2.7x and a
single CLEAN SWEEP posting came to **2,970 CR plus a free part** — against the
~1,800 CR ECONOMY-PLAN prices a strong race at, and the 2,200 ceiling
`test-rungs` holds the whole contract sweep under. Capped at 1.9x with the
CLEAN SWEEP base cut 1100 -> 900, the richest posting on a fresh career is
930 CR and on a maxed one about 1,700. If you add a kind, keep it under that
line or racing becomes the side activity.

`tests/test-jobs.mjs` (22 assertions) pins the board's stability, the
one-at-a-time hold, DRIVE IT actually swapping worlds and starting the race,
the contract-plumbing ride, and that finishing pays / clears / closes for the
day. test-rungs 28/28, test-quests 9/9, test-boot 7/7 unchanged.

**r182 — JOBS, SECOND PASS.** Four things r181 left, one of them a bug r181
itself introduced.

- **TAKING WORK COST YOU MONEY.** r181 unshifted the held job into
  `this.contracts` to reuse its plumbing — and `sweepCr` is
  `contracts.every(c => c.done)`, so a missed JOB silently cancelled the 600 CR
  all-contracts sweep bonus. Accepting work was a net loss whenever you did not
  finish it. The sweep is now computed over `contracts.filter(c => !c.job)`.
  ANY future code that reads `this.contracts` as "the slate" has the same trap:
  the job is in that list and is not part of the slate.
- **A MISSED JOB READ AS A LOST JOB.** The breakdown row was a bare
  `✗ JOB · CLEAN SWEEP —`, identical to a forfeited contract, when in fact the
  job is still held and RACE AGAIN is the retry. The row says so now.
- **THE START BUTTON KNOWS ABOUT THE JOB.** On the job's world it names it
  (`JOB: BOUNTY — destroy 2 rivals`) and takes a green inset edge; on any other
  world it says `JOB IS AT <world> — THIS RACE WILL NOT COUNT FOR IT`. The
  objective only rides on the world the job names (see `_jobContract`), so
  without this a player can race all evening against a job that was never
  running.
- **`_flushPick` repaints the jobs board.** The CONTRACTS half of that tab is
  per-world; swapping worlds from the tracks tab left it showing the previous
  world's slate.

`tests/test-jobs.mjs` 26/26 (was 22). test-rungs 28/28, test-boot 7/7,
test-select 19/19.

**r183 — THE OTHER HALF OF THE SKEW, AND A FLAKY TEST THAT WAS RIGHT TO
COMPLAIN.** Found while re-running the suites after a repo cleanup: `test-gorge`
had gone intermittent, failing "NOBODY drives out of the gorge" on some runs.

- **THE RULE HAD A REVERSE GAP.** r180 fixed the half where the geometric
  footprint said "in the hole" and the car was on tarmac. This is the other
  half: the footprint said "clear" while the roadway UNDER the car was gone.
  Same cause — the trench is a skewed diagonal, `_jumpCut` is one number per
  sample with no lateral variation — so neither test is sufficient alone.
  `jumpChasmAt(x, z, idx)` now takes the car's trackIndex and fires on EITHER
  the footprint or a cut sample near that gorge. If you touch it, both halves
  are load-bearing and each one alone has shipped a bug.

- **AND THE TEST'S OWN THRESHOLD WAS TOO TIGHT** — the same trap already
  recorded once at r180, in a new place. "Sank" was `y < landY - 3`, three
  metres under the landing lip, which flags a car that dips 3.1 u WHILE FLYING.
  Measured, the flagged cars crossed on the racing line (lateral 1.2-1.8 u) in
  1.9 s — identical to a clean jump — and twenty metres above the floor. They
  never entered the gorge. Now `landY - 8`: nothing that clears goes eight
  metres under the far lip, anything that falls goes twenty.

- **TWO ASSERTIONS WERE OVER-FITTED.** Demanding 14/14 from eight cars fighting
  over one ramp fails on a legitimate racing incident — occasionally a rival
  goes off it sideways, which is the jump working. Now `>= n - 1` at both ends,
  with `droveOut === 0` doing the actual pinning. The slow sweep also moved
  0.40 -> 0.35: the failure band sits near 31 u/s and cars vary about +/-3
  around the field mean, so a mean of 24 put the fastest car ON the threshold.

Four consecutive runs, 28/28 each, `droveOut` zero at every speed.

### Repo cleanup done at the same time

- **11 stale agent/workflow worktrees removed** (9-12 days old, 243 MB). Every
  one had its uncommitted state COMMITTED TO ITS OWN BRANCH first, so nothing
  was discarded — the refs are `worktree-agent-*`, `worktree-wf_*` and
  `archive/gfx`, and the commit message on each says it is an archive and not
  for merge. Three of those branches carry merge commits that are not in main;
  all three are far BEHIND main (they would delete ~47k lines) and their
  features shipped long ago.
- Local `main` fast-forwarded from two weeks stale to `origin/main`.
- Five gitignored probe screenshots removed from the repo root (2.5 MB).
- `git gc` was NOT run — blocked in this environment. `.git` is 166 MB and
  would repack smaller; worth doing where it is permitted.
- **`dustline/` is 104 MB of tracked files in this repo** (240 files, a
  sibling dossier project). Left alone deliberately — removing it is a call for
  whoever owns it, not a cleanup.

**r184 — WHAT IS STANDING ON THE ROAD, ACROSS ALL SIXTY WORLDS.** Asked for as
"clean the maps". `test-carriageway` measures the right quantity but only on
the six worlds a census once found problems on — that guards those regressions,
it does not answer "is the roster clean". The two have had different answers
before: the gorge trench cut unramped holes for months while every carriageway
assertion passed, because no test walked the worlds it happened on.

`tests/tool-road-census.mjs` is new and walks ALL of them, reporting per world:
solids reaching inside the drivable width (measured against that sample's OWN
half-width — the roster runs 5 u pinches to 9 u boulevards), bare holes in the
surface, floating solids, and the narrowest point on the lap.

**BEFORE: 159 blockers across 43 of 60 worlds.** Two builders were more than
half of them, and both placed by an offset that is only true at one sample:

- **FORD DEPTH MARKERS** (`r 0.35`, mat `wood`) offset by the RIVER's
  half-width along the RIVER's bearing, so where a ford crosses at a slant the
  marker lands on the carriageway. **67 of the 159**, worst **0.23 u from the
  centreline** on PIKES PEAK.
- **NARROW-SECTION POSTS** (`r 0.45`, mat `metal`) offset by `widthAt(j)` at
  the sample they flag — and a narrow section is by definition somewhere the
  road is doing something, so a few samples on the centreline swings back under
  them. Worst **1 u out** on RED CENTRE RUN.

The stone teeth placed ten lines below those posts ALREADY carried
`_clearsRoad`, with a comment saying exactly why. Both now do too.

**AFTER: 82 blockers.** All 67 wood gone; metal 34 -> 24. Pinned in
`test-carriageway` by material signature on the four worlds the census measured
them worst on, so a future builder cannot quietly reintroduce them.

**WHAT IS LEFT, HONESTLY.** 82 blockers remain, 57 of them `stone`, and the
deepest readings are a KNOWN FALSE POSITIVE: a tunnel bore is narrower than the
road it carries and its wall colliders sit at the bore half-width, so every
tunnelled world (SUZUKA, HARBOR QUAY, COTE D AZUR, SILVERSTONE) reports them.
That is the tunnel doing its job. The rest are stone set-pieces — quay cannons
placed in citadel-local coordinates, culvert parapets — which need per-builder
judgement rather than a blanket guard: several are colliders that stop you
driving off a bridge or a quay, and deleting them would trade a blocker for a
hole. Not attempted here; the tool makes it tractable.

Also measured and unchanged by this: **bare holes 0 across all 60 worlds** —
the r179/r183 gorge work holds roster-wide. **Floaters 162**, highest 41.8 u on
CORNICHE; that is task #89 and a separate problem.

Of 40 `solids.push` sites in track.js, 36 have no clearance guard. Most are
fine because their placement rule keeps them off the road by construction. If
you add a new one, ask `_clearsRoad` — and then run the census, because "it
looked fine on the world I was testing" is exactly how both of these shipped.

**r185 — OPEN ALL AS A SETTING, AND AN UPGRADE KIT THE CHASE CAMERA CAN SEE.**

**OPEN ALL.** `?unlockall=1` has always existed and has always been the only
way in — which means it lasts exactly as long as the browser tab and is gone
the moment the game is opened from the home screen or as a PWA. It is now a
remembered setting (`ir-openall`) with chips in SETUP beside DIFFICULTY. The URL
flag still forces it on (every headless suite passes it) and now also WRITES
the setting, so arriving by link and reloading keeps it.

It lends the CAR CATALOGUE too, which it did not before: `renderCarShop` reads
`owned || unlockAll`, and the click handler writes `cars.selected` to the save
ONLY for a car you actually own — otherwise switching back would leave you
driving something you never bought and `_loadProfileState` would bounce you to
the starter. Career, stars and credits are untouched either way.
Measured: 3 worlds -> 60, 0 of 8 cars locked, `cars.owned` still `[]` after.

**THE UPGRADE KIT NOW FACES THE CAMERA.** r174 gave the car bodywork per
upgrade and most of it pointed FORWARD — hood scoop, cannon barrels over the
nose — which is the one part of the car the player never sees. A chase camera
sees the tail and the flanks. New, all rear or side:

- ENGINE 3/5: a **rear wing** on twin uprights, gaining a gold upper flap and
  endplates at 5. The single biggest silhouette change available.
- ARMOR 3/5: **wide-body flares** over all four wheels (reads from behind AND
  down the side), then a rear bar with towing eyes and a **brake strip**.
- NITRO 3/5: **side pipes** down the flanks with lit mouths, then twin
  **afterburner cones** under the tail.
- HANDLING 2/4: had NO bodywork at all on a five-level line. Now a **rear
  diffuser** with strakes, dead centre of the chase view, plus dive planes and
  a splitter.
- BEACON 1+: an **amber roof bar**, one lamp per level.
- TIRES 3: **mud flaps**. DAMPERS 4: a **spare** on the tail.
  MAGAZINE 3: a belt feed down the flank.

Emissive parts are `MeshBasicMaterial` on purpose — unlit, so they hold their
colour in a tunnel and at dusk where a standard material goes to mud.

TWO THINGS THE RENDERS CHANGED, and both were invisible in the source:
the spare wheel dead centre on the tail was the biggest object in the chase
camera and buried the diffuser, the brake strip and the afterburners behind it
— it is offset to one side now, the way a rally car carries it. And the side
pipes at x 1.36 sat exactly where a level-3 flare cants out over the tyre, so
the whole run disappeared; 1.52 puts them proud of the widest bodywork.
Kit mesh count 0 / 21 / 65 at upgrade level 0 / 2 / 5.

To photograph the kit: build the mesh standalone with `buildCarMesh` +
`applyUpgradeKit` in an offscreen renderer (see how `_carIcons` does it) rather
than moving the game camera. Freezing `g.frame` to steal the camera renders
black, and NOT freezing it means the chase camera is put back before the
screenshot lands — both were tried.

**r186 — THE GUN ON THE ROOF, AND THE WHOLE MATRIX RENDERED.** Asked for as
"move the guns to a visible place, should apply to all 8".

The cannon was a barrel at `capTop - 0.5, z 1.9`: forward of the cabin and
BELOW the roofline — the one place a chase camera never looks. It is the
loudest thing the player buys and it was invisible from the only angle the game
is played at. The assembly now sits ON the roof: receiver and ammo drum facing
straight back at the camera, barrel running forward over the bonnet where it
breaks the skyline, and a pintle down onto the roof so it reads as mounted
rather than floating. CANNON 5 adds flank SPONSONS for the side view.

APPLIES TO ALL EIGHT BY CONSTRUCTION, and that is the reason it is hung off
`capTop`: `buildVoxelRacer` publishes that per car, so each rig gets the gun at
its own roof height. A constant would bury it in the CROWN's cabin and float it
over the DUNE's. Anything else added to the kit should hang off the rig the
same way.

Rendered the full matrix to check it — 8 cars x 6 upgrade levels x 2 angles,
96 renders. Kit part counts on the BRAWLER run 0 / 2 / 24 / 41 / 60 / 73 for
L0..L5, so every level adds something. Note L1 is only 2 parts (the beacon bar
and its first lamp): every other line starts at level 2, so level 1 is a thin
step by design of the thresholds, not a bug.

The render harness lives in the scratchpad, but the shape is worth repeating:
build the mesh standalone with `buildCarMesh` + `applyUpgradeKit` into an
offscreen `WebGLRenderer`, `toDataURL('image/webp', 0.86)`, and call
`applyUpgradeKit(mesh, {})` afterwards so the kit's geometries are disposed —
96 kits leak fast otherwise. `import('/lib/three.module.min.js')` is the path
in the page (see the importmap); `/vendor/three.module.js` does not exist.

**r187 — THE KIT FITS ALL EIGHT NOW, NOT THE ONE IT WAS TUNED ON.** Asked for
as "apply for all cars".

The upgrade kit was already BUILT for every car — identical part counts, 0 / 2 /
24 / 41 / 60 / 73 across the tiers on all eight — so the honest first check said
it applied everywhere. It did not FIT everywhere, and that is a different
question that needed a different measurement.

`capTop` was published back at r174 so bodywork could sit at each car's own roof
height. That fixed the vertical axis and nothing else: every LONGITUDINAL offset
stayed a constant tuned against the BRAWLER. Measured, the roster runs 5.6 u
(SLEEK) to 6.4 u (BASTION) nose to tail, and the kit's reach past each end
varied accordingly:

    car        len   past TAIL   past NOSE        (negative = inside the body)
    sleek      5.6      +0.10      +0.17
    brawler    6.0      -0.10      -0.03          <- the one it was tuned on
    crown      6.3      -0.25      -0.18
    bastion    6.4      -0.30      -0.23
    spread              0.40       0.40

The sign flips: the same gun muzzle poked 0.17 u PAST the SLEEK's nose and sat
0.23 u INSIDE the BASTION's.

`buildVoxelRacer` now measures the finished object and publishes `zRear`,
`zFront` and `halfW` alongside `capTop`. `applyUpgradeKit` gets two anchors —
`T(o)` is `o` units forward of the TAIL, `Nz(o)` is `o` back from the NOSE — and
all 25 lengthways offsets are expressed against them. The reference numbers are
the old constants re-stated against the BRAWLER (tail -3.0, nose +3.0), so the
car that always fitted is pixel-identical and the other seven now match it.
After: spread 0.00 at both ends.

`halfW` measured 1.8 on all eight, so the lateral offsets needed no change —
published anyway, because the next part to be added should not have to
rediscover that.

RULE FOR ANYTHING ADDED TO THE KIT: heights hang off `capTop` / `baseY` /
`wheelY`, lengths off `T()` / `Nz()`. A bare number on the z axis is the bug
this release fixed. `tests/test-cars.mjs` pins the spread at <= 0.05 u on both
ends, so a constant reintroduced later fails.

**r188 — VERIFIED IN THE LIVE GAME, AND A TEST-FUNDS BUTTON.** Asked for as
"make sure it is reflected in the game too / add 300k credits so I test it out".

**IT IS REFLECTED, AND HERE IS THE CHECK.** Everything from r185-r187 had been
verified by building the mesh STANDALONE in an offscreen renderer, which proves
`applyUpgradeKit` works and proves nothing about the car the player drives.
Measured in a live race instead: the player mesh carries the new rig
(`zRear -3, zFront 3` on the BRAWLER) and 73 kit parts at max upgrades, and the
kit reads in the CHASE view. Rivals carry rigs but 0 kit parts, which is the
existing design — only the player buys bodywork.

CAMERA INDICES, since two attempts were wasted on this: `camMode` 0 is
TOP-DOWN and it is the DEFAULT. CHASE is index **3** (0 TOP-DOWN, 1 TOP FAR,
2 TRAIL, 3 CHASE, 4 CHASE FAR). A screenshot taken without setting it is an
overhead shot of the whole field, which is why the first two "chase" renders
showed no car detail at all. Hide `#hud` as well — the speedometer sits over
the car at the bottom of frame.

**TEST FUNDS.** A `+300,000 CR` button in SETUP under OPEN ALL, and
`?credits=300000` on the URL for handing someone a stocked save by link.
Deliberately a REAL credit written to the garage the same way a race payout is,
not a display-only fiction like OPEN ALL: a fake balance that empties on reload
is worse than no button. Verified 0 -> 300,000, persisted to
`ir-p<id>-garage`, and still there after a reload. The URL form is capped at
9,000,000 and grants once per page load.

## r190 — the parallel track sweep

Five read-only agents over all 60 worlds (overpasses, tunnels/bridges, the
curviest, the field driving, the rest of the roster), then every finding
re-measured here before anything was touched. What shipped, with numbers:

**OVERPASSES THAT NEVER EARNED CLEARANCE.** Not the slope eroder — every
crossing kept its full 11.5 u lift. Two causes: which leg flies was picked by
a COUNTER (`k % 2`), which on OLIVE CROSSING elected to fly the leg sitting
15.35 u BELOW the other; and `bump` takes the max over +-HALF, so one
crossing's ramp lifts its neighbours' under-legs (MOUNTAIN TO SEA's crossing
506 spans 471-541, containing 519 and 524 — two other crossings' under-legs).
Now the ground picks the flying leg, and each pass asks only for the shortfall
on a re-measured gap. Crossings under 6 u: 5 -> 0. p90 grade FELL on all eight
overpass worlds.

**THE ERODER NOW CUTS BOTH WAYS.** It only trimmed `lift`; excavations have
flanks too. Digging under-legs took CLIFF KNOT 27 % -> 34 %; trimming digs as
well gives 24 %, below where it started.

**nearestIndex RESCUE WAS ORDER-DEPENDENT.** It gated each crossing's
proximity test on a `best` the loop had already moved, so an earlier crossing
could capture the answer and the crossing the car stood on was never searched.
Latent in main; the r190 elevations exposed it. Gates on the pre-rescue seed
now. test-index-recovery 46/46.

**ROAD FURNITURE.** Culvert parapets are offset from the STREAM crossing point
(accepted up to 16 u off the centreline), so they straddled the water and only
straddled the road by luck — SILVERSTONE 713 put a collider at lateral -1.39
under a 19 m bar drawn along the racing line. Now asks `_clearsRoad`, as the
headwall and ford markers already did. Stone blockers 17 -> 2 across the
census slice; the 2 left are HARBOR QUAY's quay cannons, a different builder.

**START GANTRY + GRANDSTAND.** Both were sited off sample 0 / a fixed 26 u and
never asked where the rest of the lap went. The gantry now scores candidates
and keeps the best (a first cut that walked outward and built at the last spot
tried made TOUR DE CORSE WORSE, 4.52 -> 7.59 u — the census caught it); a leg
that still cannot clear keeps its mesh and drops its collider. The grandstand
relocates: 7 of 60 worlds had spectators standing in the carriageway, all 7
now clear, none dropped.

**TUNNEL OVER A CREST.** `_buildCrests` runs before `_planTunnels` and cannot
refuse tunnels; `tunnelFitAt` never asked about crests. TREMOLA's bore carried
6.48 u of rise and the car left through the roof at -0.07 u clearance at the
VIPER's STOCK top speed — silently, because the bore has wall colliders and no
roof. Refused now, the way gorges already are.

**TRAFFIC FREEZE.** `ent.fi` advanced with `%`, which keeps its left operand's
sign; a negative index made `roadPose` throw, and the try/catch wraps every
entity with a latching `warned`, so one bad tractor parked ALL traffic on the
racing line for the rest of the race behind one console line.

Rejected with measurements: capping the overpass ramp against the world's own
terrain grade (the eroder was never the problem — measured 0 lift lost); and
gating the grandstand by withholding its mesh (leaves the start line bare —
moving it works on all 7).


## r191 — the river is a line, and the guns are off the road

**A RIVER IS A LINE, NOT A STRING OF BEADS.** `_riverNearest` measured the
distance to the polyline's POINTS. Those sit `curve.getLength() / 11` apart —
10.98 to 11.05 u typical, up to 20.47 — against a channel half-width of 4.0,
so the water existed in 4 u discs around each dot and nowhere between them.
Measured on r190: of 4661 polyline midpoints across eight worlds, **31 read
wet**. PINE VALLEY managed 3 of 615. Eleven of sixteen fords were bone dry at
the exact centreline while the visible water — a continuous ribbon off the
curve, plus the ford's own wash mesh — showed an unbroken sheet. You drove
through solid water and got splash, drag and wet tyres over about two thirds
of it, in a pattern nothing on screen explained.

Measuring the SEGMENTS instead makes the channel continuous at any spacing.
Midpoints wet **31 -> 4661**, fords dry at the centreline **11 of 16 -> 0**,
wet span across the carriageway **0.62-0.84 -> 1.0**. Same lesson the barrier
runs already carry ("walls are segments, not dots").

`_riverDist` was a byte-for-byte copy of `_riverNearest` that discarded the
index, so it carried the same bug and would have needed the same fix twice.
It delegates now — one implementation, one behaviour.

**THE QUAY GUNS.** `at(u, -19)` puts a cannon up by the wall rather than out
on the sand, which is a fact about the QUAY and says nothing about where the
carriageway runs. Two of three landed on it, one of them the deepest single
intrusion in the roster census: HARBOR QUAY sample 328, lateral -0.47 with
r 1.5, biting 10 u into a 9 u half-width — a cannon on the centreline. They
now try the designed spot, then nudge along the quay and in toward the wall,
and a gun with nowhere clear is not built. Census on HARBOR QUAY: **2 blockers
-> 0**.

Note for anyone touching instanced dressing: `gunIron.count` has to follow the
number actually placed. An InstancedMesh draws every slot it was allocated and
an unwritten matrix is the identity, so a skipped gun appears at the world
origin instead of not at all.

Verified: test-water, test-river, test-carriageway all pass; test-surface
20/20. (test-surface hardcodes port 8901 and ignores BASE — serve there.)


## r192 — the board reads in the order you can drive it

**OPEN WORLDS SORT FIRST.** The career array is rung order and the PRICES are
not monotonic with it — a world may carry its own `cost` — so the board ran
58, 60, 63 and then 20 a few cards later. Add the free-unlock floor on top and
OLIVE COAST sat OPEN underneath three padlocks: the one world the player could
actually race, buried below three they could not. Unlocked now sort first and
the locked half is ordered by star cost, which is the order a wall is read in.
Display only — pricing, progression and `nextTrack` still read the array. This
does override the timeline view's old "rung 12 follows rung 11" rule, which
assumed prices rise with the array; they do not.

**LADDER_SLOPE 2.5 -> 0.5.** A rung cost two and a half stars, so a star
bought less than half a world: 16 stars in hand against neighbours priced
55/58/60/63, "39 TO GO" on the very next card. At 0.5 one star opens about two
worlds and those same neighbours price at 11/12/12/13. Measured pace, three
profiles, worlds open after 3/10/20 races:
    winner   39/60/60      podium 27/60/60      finisher 12/43/60
This deliberately REVERSES r178, which set the same number the other way after
"tracks are opening too fast". The roster has grown since and the report
reversed; a knob set by report is reset by report.

**AND THE LADDER SUITE HAD TO BE RE-AIMED, NOT SILENCED.** Eleven assertions
failed because they encoded r178's intent — `a3 <= 10`, `a10 <= 40`, "the
roster is not fully open even at twenty races". Keeping them would have had
the suite defend a decision the player had just asked to reverse, which is how
a test stops being a spec and becomes a fossil. They now assert the opposite
property: that the board is never a wall.

The floor needed different handling. At slope 0.5 `_freeUnlock` CANNOT fire —
a finisher banks a whole star per race against rungs costing half of one, so
affordability outruns racing and nothing is ever owed. Rather than delete the
seven floor assertions, that block now runs against a deliberately steep price
(`starCost * 6`), so the safety-net logic stays covered whatever the slope is
set to next. 24/24.

### Traffic: measured, NOT a defect (recorded so it is not re-hunted)

Chasing "cars are stuck", traffic looked frozen: 1-2 of 6-7 vehicles at
exactly 0.0 u after 20 real seconds, on every world. They are crossroad
shuttles mid-wait. Traffic owns its own rAF and its clock advances ~0.125 s
per real second under swiftshader, so the 9 s look-both-ways pause takes ~75 s
of wall clock to expire — the trace shows `wait` 9.43 -> 6.83 across the
window. Any traffic probe needs a MINUTES-long window or a driven rAF; a
20 s sample proves nothing.

Ruled out in the same hunt, all measured: physics, tracks, the AI field
(0.5-0.9 laps/30 s, 8/8 alive), the driven player (0.44-0.93 laps/30 s on six
worlds), the touch pad (drag up -> throttle 0.96), page errors (none), and any
r190 vs r191 difference (identical). The original report is still unreproduced.


## r193 — the bridge stops putting columns in the road it bridges

`_buildOverpassDecks` stood one pier at `c.x, c.z` — the FLYOVER's own
centreline — and asked nothing about what was underneath. Directly over a
crossing that centreline IS the lower carriageway, so the bridge planted a
column in the middle of the road it was there to span. Photographed from the
driver's seat: two grey columns dead ahead in the lane, deck overhead.

r190 made it worse. Earning those decks their full clearance means a taller
deck, a taller deck clears the `c.y - ground > 2.5` test at more stations, so
more columns and each of them longer.

Piers now build in PAIRS offset +-6 u to the deck edges — which is how a
viaduct carries its deck anyway — and each asks `_clearsRoad` first. Over the
crossing neither qualifies, so the span stays open, which is the point of a
flyover. Each pier takes the ground under ITSELF; the two sides of a viaduct
are rarely level.

Measured, OLIVE CROSSING: **8 pier meshes with 4 in the road, worst biting
10.1 u into the lane at sample 205 -> 4 meshes, 0 in the road.** MOUNTAIN TO
SEA clean before and after.

**WHY NO CENSUS EVER CAUGHT THIS.** Piers are meshes with NO collider — you
drive through them — so `tool-road-census` (which walks `solids`) and
`test-carriageway` both scored these worlds clean while a column stood in the
racing line. Same blind spot as the barriers (see r190, task #109), one layer
further out: the census sees colliders, not geometry. `scratchpad/piers.mjs`
walks `track.group` and measures pier-shaped meshes against `widthAt` instead;
that approach is what any "is something standing in the road" question needs
now, because three separate object classes have hidden in this gap.


## V2/ IS NOT MAINTAINED — do not sync it

`V2/` on `main` is a second, self-contained build (~2.9 MB, bundled and
minified, with its own `editor.html`), live at
`https://jozelazarevski.github.io/racing-shooter/V2/`. It arrived in 069ee7f
("The playable build moves to /V2, and gets its own Pages link") and has not
been edited since; the only later commit touching it is the gh-pages deploy
sync carrying it along.

DECISION, from the owner: **it is deliberately NOT kept in sync.** None of
r182-r194 exists in it — not the overpass clearance work, the piers, the
culvert parapets, the river, the ladder, the list sorting, none of it. Do not
port fixes into it, do not "bring it up to date", and do not treat a defect
found there as a defect in this game. It is a different lineage and a compiled
artifact: the only meaningful comparison with it is behavioural, not textual.

(Asked whether "kimi" had deployed anything: no. Every commit on every ref is
authored by `Claude <noreply@anthropic.com>` or the owner's two GitHub
identities; no branch, PR or commit trailer mentions it. The one textual hit
was a chance byte sequence inside V2's minified bundle.)


## Rebase notes

- r151/r152/r153 touch `src/main.js` (tyre fitness, picker, boot),
  `index.html` (version ×4, `#build-veil`), `sw.js` (cache name). The version
  strings churn every release — take "theirs then re-bump" on conflict.
- Scrutineering's clearance pass touches `src/track.js` placement call sites
  (~4741, 6551, 9743, 10547, 10898, 16241, 17070, 17143). Mainline is staying
  out of those regions until it merges.
