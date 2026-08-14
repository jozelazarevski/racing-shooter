# COORDINATION — parallel Claude sessions on this repo

Three sessions are iterating on this game at once. This file is the shared
blackboard: what each lane owns, and measurements one session made that
another needs. Update it when you claim or finish a lane; read it before
starting work that might be someone else's.

_Last updated: 2026-08-11, by the mainline session (r153)._

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

## Rebase notes

- r151/r152/r153 touch `src/main.js` (tyre fitness, picker, boot),
  `index.html` (version ×4, `#build-veil`), `sw.js` (cache name). The version
  strings churn every release — take "theirs then re-bump" on conflict.
- Scrutineering's clearance pass touches `src/track.js` placement call sites
  (~4741, 6551, 9743, 10547, 10898, 16241, 17070, 17143). Mainline is staying
  out of those regions until it merges.
