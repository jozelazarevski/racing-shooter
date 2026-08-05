# IGNITE RALLY — Nature Rules

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

## Known violations — open

These are measured, unfixed, and listed here so the file stays honest rather
than aspirational.

| # | Rule | Status |
|---|---|---|
| 1 | Waterfalls fall vertically | **OPEN** — angled water sheets on open terrain |
| 9 | Car follows the inclination | **OPEN** — the body does not pitch/roll to the ground normal |
| 10 | Buildings clear the road | **FIXED** — hut placement now re-checks against the nearest leg anywhere on the lap, with a 3.5 u margin |

## A note on measuring any of this

**World generation is randomised per load.** The same world built twice gives
different prop placement and different terrain detail — measured, one world's
crest count moved from 6 to 0 across two loads with no code change at all. Any
probe that samples a world ONCE cannot tell a fix from noise. Sample repeatedly,
or compare only differences far larger than the observed spread.
