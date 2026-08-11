# What to do next, and why

Written after driving all 57 worlds with an autopilot and fixing what it hit
(see [BUGS.md](BUGS.md)). Everything here is either a measurement from that
sweep or a pattern the fixes exposed. Ordered by what it buys against what it
costs.

**§1, §2, §4 and §5 are now done** — the audit lives in the game, a release
gate fails the build on any violation, and `?audit=1` paints the violations in
the world. What each one turned out to mean in practice is written into its
section. §3 is an authoring decision and stays with the owner; §6 and §7 are
open.

## 1. Make "the road is free" a gate, not a discovery — DONE

Ten separate builders each placed scenery by a lateral offset from one sample
and each put colliders in the racing line — 211 of them across 29 of 57 worlds.
Every one was a variation of the same mistake, and each was found by driving
into it. Two of the ten had a comment beside them *describing* the failure,
because someone had already hit it there and fixed it locally.

The fix that finally held was not ten fixes. It was moving the rule into the
two places every builder must pass through: `_buildableSpot` for anything that
stands, `_barrier` for anything that runs. New scenery now inherits the rule
instead of having to remember it.

**What was done instead, and why.** The obvious move was a `_solid()` helper
that every one of the ~37 direct `this.solids.push` calls goes through. Written
out, it has a hole in it: a helper that silently refuses a collider leaves the
*mesh* standing, and scenery you can see and drive through is a Law of Solidity
violation — trading a wall in the road for a ghost.

So the enforcement is a check, not a filter. `Track.roadAudit()` asks the built
world the three questions, and `tests/verify-roads.mjs` fails the build on any
answer above zero. A new call site that puts something in the road does not get
silently corrected; it gets caught, and the fix stays where the object is
placed. Colliders that genuinely belong in the road — landed rockfall, and
anything else deliberate — declare `inRoad: true` and are not findings.

## 2. Run the sweep in CI, on the cheap checks — DONE

`tests/world-matrix.mjs` covers the whole roster in ~15 minutes and needs no
car to move. Three of its checks are now invariants with a known-good value of
zero:

| check | meaning | now |
|---|---|---|
| `inLane` | a collider inside the advertised drivable width | 0 |
| `barIn` | a wall run lying inside the road | 0 |
| `deckShort` | no floor under the width the road promises | 0 |

A world that breaks any of them is broken for every player who drives it.

```bash
node tests/verify-roads.mjs          # ~12 min, exits 1 on any violation
node tests/verify-roads.mjs --levels 32,56
```

It reports `nearRule` — objects inside the documented margin but not in the
lane — without failing on it, because that number is a housekeeping figure
(891 across the roster) and not a broken world.

The driving sweep (`tests/agent-sweep.mjs`, ~55 min) is too slow for every
push, but it is the right thing to run before a release and after any change to
`track.js` geometry or `vehicles.js` collision.

## 3. The two worlds that ask more of the terrain than it can give

OLIVE CROSSING crosses itself 11 times and MOUNTAIN TO SEA 39 times with under
4 u of vertical separation. The overpass planner asks for 11.5 u of lift and
its eroder is allowed to take that back — correctly, because a road you cannot
drive up is worse than a low deck. But a route with nine crossings in one lap
spends its whole elevation budget on them.

Both worlds drive cleanly now. The remaining question is authorial, and there
are three honest answers:

- **Fewer crossings.** Redraw the routes with two or three deliberate
  crossings instead of nine and eleven. The Mediterranean worlds that do this
  (CINQUE TERRE, AEGEAN BLUE) have no flat crossings at all.
- **Accept them as junctions.** A crossing at grade is a drivable junction, and
  arguably an interesting one — two legs of the lap meeting, with traffic
  implications. That would want signage and a warning, not silence.
- **Raise the budget for knotted worlds.** Let `CLEAR` scale down and the
  approach length scale *up* with the number of crossings, so nine crossings
  get long shallow ramps rather than nine cancelled ones.

The first is the least code and the most certain.

## 4. Give the audits a home in the game, not just in tests — DONE

Every check in the sweep reads only public state — `t.solids`, `t.barriers`,
`t.widthAt`, `groundHeightAt`. That means the same code could run behind a
`?audit=1` flag and paint its findings **in the world**: a marker on every
collider inside the lane, a stripe where the deck is short, a line between
crossings that share a height.

The editor already exists and authors tracks. An author who can see the rule
being broken while sculpting will not ship the break. This is the difference
between a QA report and a ruler.

`?audit=1` does this now: a red post at every collider inside the drivable
width, an amber bar across every wall run lying in the road, a magenta patch
over every sample with no floor, and the totals in the HUD feed. Nothing it
draws is collidable and nothing is added to the physics; with the flag off it
costs nothing.

## 5. Close the loop the report opened — DONE

Two things in this pass were measured wrong before they were measured right,
and both were my own instruments:

- The flat-crossing count reported 6 because it took `.length` of a list
  already sliced to six examples. The real figure was 58.
- Trees in the lane counted cacti, which the car smashes by design, so CANYON
  RUN read three worse than it was.

Both are the same failure: **the audit did not ask the question the game
answers.**

The three road checks now live in `Track.roadAudit()`, next to the functions
that answer them, and all three consumers — the release gate, the world matrix
and the in-game overlay — call that one function. There is no longer a copy of
the rule to drift. Any new check should go the same way: against the code that
decides the behaviour, and where that is impractical, saying what it
approximates.

## 6. Smaller things worth doing

- **`_clearsRoad` is O(N) per call** — a full-lap `nearestIndex` with no hint,
  plus `_distToTrack`. It is now called for every structure and every wall
  segment at build time. Worlds still build in ~15 s, so it has not hurt, but a
  coarse spatial grid over the centreline would make it cheap enough to use
  without thinking about it.
- **The gorge trench should know its own crossing.** The fix here gates the cut
  by distance to the designed jump. The same trench geometry is used for the
  visual chasm; it is worth checking whether the ravine *looks* right where the
  road now bridges it.
- **`RED CENTRE RUN`'s hole was invisible for a reason**: nothing rendered
  differently, the collider audit was clean, and only a car that happened to
  drive that stretch found it. Any state the physics reads but nothing draws is
  a candidate for the same bug. `_jumpCut`, `_deckDip` and the overpass lift
  are the three in this codebase.
- **Documented counts drift.** README said eighteen worlds against a roster of
  fifty-seven; two code comments quoted roster sizes that were two rosters old.
  Numbers that describe the data should be derived from it or not written down.

## 7. What the sweep still cannot see

Stated plainly so it is not mistaken for coverage:

- **Free roam and missions.** The sweep drives RACE mode only.
- **Anything visual.** It reads geometry and physics. A world can pass every
  check and still look wrong — the flyover whose parapet was correctly built
  and correctly collided with is the example.
- **Real hardware.** Every frame rate here is SwiftShader and comparable only
  with itself.
- **`dustline/`.** The second game has three tracks of its own and no sweep.
  Its npm dependencies are not installed in this environment, so even its own
  verifiers do not run here.
