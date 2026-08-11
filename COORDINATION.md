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
| Dustline | `claude/codebase-architecture-refactor-eos0rs` | The `dustline/` TypeScript rewrite, self-contained, deploys to `/play-dustline/`. Normally no contention with `src/` — one exception below, shipped as r153b. |

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

**Field-stall update 2 (dustline session): cusps fixed, standoff mechanism
pinned, remaining fix is route authoring.** The lone-rival probe caught a car
pinned at exactly |lateral| = wallLim with the recovery timer cycling, at
MOUNTAIN TO SEA's chain waist — whose control points sit 2-4 u apart
([2,-155],[2,-152]) and fed the spline 21-30 DEG/station tangent cusps.
SEA CLIFF RUN carried twelve such kinks up to 60 deg from its sketch's sharp
Vs. SHIPPED: a kink-relaxation pass over the sampled centreline (cap 13
deg/station, kink stations pulled to their neighbours' midpoint, tangents
recomputed where moved. Healthy worlds are provably untouched — their kink
census is zero, and PINE VALLEY / TREMOLA still run 1.6-2.0 rival laps/90 s
fixed-step).

That removes undrivable geometry but does NOT clear the stalls: the field
still parks at the shared-tarmac overlaps, and the fixed-step state now shows
the mechanism plainly — on MOUNTAIN TO SEA half the field sits at frac 0.16
and half at frac 0.97 AT THE SAME WORLD COORDINATES, the two legs of the
overlap, head-on; OLIVE CROSSING's five all park at its at-grade west knot
(frac 0.24-0.25). Two generic rescues were implemented, measured, and
REVERTED: near-miss overpasses (deduped/eroded to a no-op in the dense knots)
and lateral leg separation (unstable on serpentine geometry — adjacent
stations choose opposite push sides and shred the road, 83 kinks up to 175
deg). CONCLUSION: which side each leg takes at a waist is a route-authoring
decision. The three routes need their waists redrawn with >= 20 u of leg
separation (or a deliberate bridge where the sketch says "crossing") —
mainline's call, since the routes are its design. test-field-stalls stays RED
on 56/57/60 as the definition of done.

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

**Unclaimed findings** (fair game for whoever gets there first, say so here):
BUGS.md #2's four unexplained stalls (NORDSCHLEIFE, DOLOMITI, SUMMIT,
MOUNTAIN TO SEA decks), #6 (roster-wide sweep in the standing suites),
#7 (RED CENTRE RUN 7.4 u sink — mainline tracks it as its task #69/#82
family).

## Rebase notes

- r151/r152/r153 touch `src/main.js` (tyre fitness, picker, boot),
  `index.html` (version ×4, `#build-veil`), `sw.js` (cache name). The version
  strings churn every release — take "theirs then re-bump" on conflict.
- Scrutineering's clearance pass touches `src/track.js` placement call sites
  (~4741, 6551, 9743, 10547, 10898, 16241, 17070, 17143). Mainline is staying
  out of those regions until it merges.
