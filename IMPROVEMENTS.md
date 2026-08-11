# What to do next, and why

Written after driving all 57 worlds with an autopilot and fixing what it hit
(see [BUGS.md](BUGS.md)). Everything here is either a measurement from that
sweep or a pattern the fixes exposed. Ordered by what it buys against what it
costs.

## 1. Make "the road is free" a gate, not a discovery

Ten separate builders each placed scenery by a lateral offset from one sample
and each put colliders in the racing line — 211 of them across 29 of 57 worlds.
Every one was a variation of the same mistake, and each was found by driving
into it. Two of the ten had a comment beside them *describing* the failure,
because someone had already hit it there and fixed it locally.

The fix that finally held was not ten fixes. It was moving the rule into the
two places every builder must pass through: `_buildableSpot` for anything that
stands, `_barrier` for anything that runs. New scenery now inherits the rule
instead of having to remember it.

**Do the same for the remaining shared choke points.** `this.solids.push` is
still called directly from ~37 sites. A `_solid(x, z, r, y, mat)` helper that
applies the clearance rule — with an explicit `{ onRoad: true }` opt-out for
the handful of things that genuinely belong in the lane (landed rockfall,
toppled trees) — would close the class permanently rather than per-world.

Cost: an afternoon. Value: this class of bug stops recurring.

## 2. Run the sweep in CI, on the two cheap checks

`tests/world-matrix.mjs` covers the whole roster in ~15 minutes and needs no
car to move. Three of its checks are now invariants with a known-good value of
zero:

| check | meaning | now |
|---|---|---|
| `inLane` | a collider inside the advertised drivable width | 0 |
| `barIn` | a wall run lying inside the road | 0 |
| `deckShort` | no floor under the width the road promises | 0 |

A world that breaks any of them is broken for every player who drives it. They
belong in the release gate next to `verify:track` — not as a report someone
reads, but as a build that fails.

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

## 4. Give the audits a home in the game, not just in tests

Every check in the sweep reads only public state — `t.solids`, `t.barriers`,
`t.widthAt`, `groundHeightAt`. That means the same code could run behind a
`?audit=1` flag and paint its findings **in the world**: a marker on every
collider inside the lane, a stripe where the deck is short, a line between
crossings that share a height.

The editor already exists and authors tracks. An author who can see the rule
being broken while sculpting will not ship the break. This is the difference
between a QA report and a ruler.

## 5. Close the loop the report opened

Two things in this pass were measured wrong before they were measured right,
and both were my own instruments:

- The flat-crossing count reported 6 because it took `.length` of a list
  already sliced to six examples. The real figure was 58.
- Trees in the lane counted cacti, which the car smashes by design, so CANYON
  RUN read three worse than it was.

Both are the same failure: **the audit did not ask the question the game
answers.** The tree check now calls the same predicate `vehicles.js` uses. Any
new check should be written the same way — against the function that decides
the behaviour, not against a re-derivation of it. Where that is impractical,
the check should say what it approximates.

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
