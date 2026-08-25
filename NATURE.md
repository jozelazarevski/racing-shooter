# IGNITE RALLY — Nature Rules

> **Scope: IGNITE RALLY (`src/`, the game at the repository root).**
> This document is normative for v1 and says nothing about `dustline/`,
> which is a separate game with its own specification in
> `dustline/CLAUDE.md`. A rule here is not a rule there.

`RULES.md` governs how the world *behaves* under a car. This file governs
whether the world is **believable**. A voxel rally game can be stylised as far
as it likes, but it may not break the handful of physical facts every player
knows in their body without being told. When one of these is broken the scene
stops reading as a place and starts reading as a bug — which is exactly how
each rule below got written.

Every rule here is **testable**. If a rule cannot be checked by a probe, it is
too vague to enforce and should be rewritten until it can.

---

## 1. Gravity is vertical, and water obeys it

1. **Falling water falls straight down.** A waterfall is vertical, full stop.
   It may *begin* on a slope and it may *land* in a pool, but the falling span
   itself is plumb — never a tilted ribbon pasted across a hillside.
   *Reported:* water sheets running diagonally across open terrain at a fixed
   angle, floating over the ground rather than lying in it.
   *Test:* for every water surface, the angle between its normal and world-up
   is either ~0° (a level pool or a river surface) or ~90° (a fall face).
   Nothing in between is legal.

2. **Flowing water runs downhill, along the fall line.** A river's surface
   height must never increase along its direction of flow, and its channel must
   sit *in* the terrain, not on top of it.
   *Test:* sample the centreline of every waterway; `y` is monotonically
   non-increasing downstream, and terrain height at each bank is ≥ the water
   surface.

3. **Standing water is level.** A lake or pool has one surface height across
   its whole extent. Water does not slope.

4. **Water finds the low ground.** A waterway may not run along a ridge. Its
   channel must be at or below the terrain within a few units either side.

## 2. Things that grow, grow up

5. **Trunks and stems are vertical**, whatever the ground does under them. A
   tree on a 30 % slope stands plumb; it does not lean with the hillside. Only
   a *fallen* or *burning* tree may lie at an angle, and then it lies on the
   ground rather than hovering above it.

6. **Everything that stands, stands ON the ground.** No gap under a trunk, a
   rock, a fence post or a building; nothing half-buried unless it is meant to
   be a boulder or an outcrop.

## 3. Rock, snow and slope

7. **Rock falls from rock.** A falling hazard must detach from a real surface
   that is actually above the road — a cliff rim, an overhang — never from open
   sky. (Enforced; see RULES.md "A hazard may never materialise in mid-air".)

8. **Snow lies on up-facing surfaces.** Snow caps sit on tops, not on vertical
   faces or overhangs.

9. **A vehicle sits on the surface it is on.** A car resting or driving on a
   slope is pitched and rolled to that slope. A car drawn level on a 30 %
   incline reads as floating, which is exactly how it was reported.
   *Test:* the car's up vector matches the ground normal beneath it to within a
   few degrees whenever it is grounded.

## 4. Scale and place

10. **Buildings belong beside the road, never on it.** A house on the
    carriageway is not scenery, it is an invisible 50-hull wall. Placement must
    clear the road *anywhere on the lap*, not just near the leg it was measured
    against — on a course that doubles back, a prop a clear 20 u from its own
    leg can be sitting on the next one.

11. **A building is bigger than a car and smaller than a hill.** A cottage is a
    little wider than a car is long, and about as tall again.

12. **Shadows agree with the sun.** Every world's key light is aimed from the
    bearing its sky actually draws the sun at, so shadows point the right way.

---

## Status — every rule, measured

Nothing in this table is an opinion. Each row names the probe that decides it,
because a rule with no probe is a belief: rule 1 sat here marked OPEN, then
FIXED, while the largest river in the game ran at 41.8° for two releases —
the fix had been applied to the small streams and verified on the wrong mesh.

| # | Rule | Status | Enforced by |
|---|---|---|---|
| 1 | Falling water falls straight down | **CONFORMANT** — 0 % of water triangles lie between 3° and 87°, on every water mesh in the world | `tests/test-water.mjs` |
| 2 | Flowing water runs downhill | **CONFORMANT in the open river** — 0 upstream rises over 473–532 stations. Fords are a declared exception, below | `tests/test-nature.mjs` |
| 3 | Standing water is level | **UNTESTED** — no standing water exists yet; there is nothing to check | — |
| 4 | Water finds the low ground | **UNVERIFIED** — see "rule 4" below. Not claimed either way | reported only |
| 5 | Trunks and stems are vertical | **UNTESTED** — needs instance-matrix introspection | — |
| 6 | Everything that stands, stands ON the ground | **CONFORMANT** — 0 floating, 0 buried, measured against `_seatY`, the ground the builders actually seat on (the drawn mesh where it runs below the analytic field). Probing `terrainHeight` alone reported 47 correctly-seated items as "buried" on steep facets — a stale instrument, not a wrong world. | `tests/test-nature.mjs` |
| 7 | Rock falls from rock | **CONFORMANT** | RULES.md hazard rule |
| 8 | Snow lies on up-facing surfaces | **UNTESTED** | — |
| 9 | A vehicle sits on the surface it is on | **CONFORMANT** — pitches to road gradient (0.12–0.17 rad on a 0.22–0.29 grade) and rolls to an off-road cross-slope | `tests/test-nature.mjs` |
| 10 | Buildings belong beside the road | **CONFORMANT** — and it was only half-true when first marked fixed: `_buildHuts` had the lap-wide check, `_buildRoadCabins` did not, and four of five cabins on FURKA RIDGE were on the carriageway, one at lateral 0.25 with a 5 u solid radius | `tests/test-carriageway.mjs` |
| 11 | A building is bigger than a car, smaller than a hill | **UNTESTED** | — |
| 12 | Shadows agree with the sun | **CONFORMANT** — key light bearing matches the drawn sun to 0.0° on every world measured | `tests/test-nature.mjs` |

### The ford exception to rule 2

Where the road crosses a stream, the wash sits on the **deck**: the embankment
dams the water and its surface climbs to meet the road. Along the direction of
flow that is water running uphill, and rule 2 forbids it.

It is allowed anyway, deliberately. The alternative is dipping the road into
the channel at every crossing, which changes the racing line on a dozen worlds
to satisfy a rule about scenery. Measured, the exception is exactly that narrow:
**all** upstream rises are inside the ford band — 4 of 4 on LOG FLUME FURY,
3 of 3 on PINE VALLEY — and **0** occur in open water. `test-nature.mjs` counts
ford rises separately and reports them rather than hiding them in a threshold.

The band is measured **from the planned crossing** (`R.fords`), not from the
road: the wash blends onto the deck across a 30–46 u approach around each
ford, and the builder's own road-distance metric disagrees with the probe's
by enough that a lifted station 37 u out read as open water. In the builder,
the monotone pass (2c) now exempts exactly the stations the deck lift touched
— a station raised by anything else obeys the running minimum, however close
to a road it stands.

### Why rule 4 is unverified rather than passing or failing

`terrainHeight` folds the river valley in through `_riverValley`, while the
channel bed lives in a separate `_river.bed` array, and the two do not obviously
describe the same surface. Two reasonable formulations of "is the water above
its banks" gave 79/169 and 87/169 on the same world — the signature of measuring
the wrong thing, not of a world that is wrong. Rather than assert a pass or
raise a false alarm, the probe prints its numbers and this row says unverified.

Per the opening of this file: a rule that cannot be checked by a probe is too
vague to enforce. Rule 4 needs a probe against the carved bed, and until it has
one its status is unknown.

## A note on measuring any of this

**World generation is seeded** (`seedForLevel` / `withSeed`, since r81): the same
level built twice is byte-identical, which is what makes single-sample probes
meaningful at all. `?seed=<n>` builds a different world reproducibly.

This was not always true. It used to say here that generation was randomised per
load, and that any probe sampling a world once could not tell a fix from noise —
which was correct at the time and is why several early measurements in this repo
have to be read with suspicion.

Two traps that have each cost a full measurement cycle, recorded so they are not
paid for a third time:

- **Check which tree your server is serving.** Ports get taken. A measurement
  run once reported a fix as having zero effect because another process held the
  port and was serving an older checkout.
- **Headless Chromium under swiftshader runs at roughly 1 FPS.** Anything that
  waits in wall-clock time for simulated time to pass is measuring the frame
  rate, not the game.
