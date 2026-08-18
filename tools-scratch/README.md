# Probes that outlived their session

Two graduated out of here in r200 and now live in `tests/` as standing
diagnostics: `tool-tree-clearance.mjs` and `tool-banner-clearance.mjs`. They
are the acceptance tests for the r199/r200 placement fixes, and the pass/fail
line for those fixes is pinned in `tests/test-carriageway.mjs`.

Scratch tools, not part of the test suite. They are here because each one cost
real time to get right and the next session should not rebuild them.

- `gaps.mjs`    every overpass crossing's clearance + grade p90/max, per world.
                The acceptance test for ANY change to `_planOverpasses`.
- `fence.mjs`   counts `_buildJunctionFences`' posts and checks none stands in
                a carriageway. SUPERSEDED for general "what is in the road"
                work by `tests/tool-road-census.mjs`, which walks the whole
                scene graph as of r199. It had a NaN hole until r199 and
                invented the phantom posts HANDOVER.md item 1 chased — its
                header tells that story, and it is worth reading before
                writing any other filter over `geometry.parameters`.
- `ab.mjs`      before/after across two builds on two ports: clearance, grade,
                and nearestIndex correctness together.
- `piers.mjs`   finds pier-shaped meshes standing in a road.
- `launch.mjs`  counts uncommanded launches and whether a track-index hand-off
                caused them.
- `offroad.mjs` drives deliberately off the racing line, where players go and
                line-holding harnesses never do.
- `walls.mjs`   corner-cutting coverage: of the TIGHT stations on a lap, how
                many are guarded on both sides, one side, neither. Counting
                rails does not answer this — the gate it grew into is
                `tests/test-cornerwalls.mjs`.
- `open.mjs`    the follow-up question: for each open station, WHICH of the
                rail builder's exemptions covers it (tunnel, gorge, ford,
                start gate) or none of them. This is what turned "8% open"
                into a named defect at SEA CLIFF RUN sample 749.
- `railbudget.mjs` how many rail bays a world ASKS for versus how many it gets.
                Found `MAXBAY` truncating TERRAZZA ALTA by 34 bays in silence.
- `mountains.mjs` does the road run INSIDE mountains or past them: compass
                spread of the massif's PLACED instances (not its spec), how far
                the ground rises beside the lap, and the open-ground grade that
                comes with it. Its lesson is that a flank which is another leg
                of the lap is not an open flank — counting those as misses read
                16% where 92% of the flanks that could be mountain already were.
- `claims.mjs`  every `count` in a tune is a REQUEST — this reports what the
                world actually BUILT against what it asked for (bores, stone
                bridges, crests, massif, trees). It found `stoneBridges`
                building zero everywhere and `rampCount` being a dead knob.
                Read its history before trusting a count: its first bridge
                filter matched mesh names containing "bridge" and counted the
                rope bridge's deck, and its first ramp count read a feature
                that no longer exists. BOTH were caught by a control, not by
                inspection — always measure a world you KNOW has the thing.
- `bores.mjs`   why a world got fewer tunnels than it asked for, bucketed by
                which gate refused each station (start gate / gorge / curvature
                / tunnelFitAt). Turned "asked 3, got 1" into "panorama refuses
                212 stations as too curved against CAPE OLIVETO's 59".
- `tour.mjs`    THE DRIVING TOUR: one shot every 5 s of sim time from the seat
                the player occupies, HUD included, any world list. The composer
                is stubbed between shots and restored only for the frame that is
                captured, so 40 s of driving costs 8 renders and not 2400. Set
                the camera by NAME (`CAM_NAMES.indexOf('CHASE')`) — CAM_MODES has
                been reordered before, and the default TOP-DOWN view looks almost
                straight down, which hides the whole class of defect a tour is
                looking for.
- `dialcover.mjs` how much of the player's CAR the speedo dial covers, per camera
                mode, in PIXELS. Read its header before writing any other
                screen-space probe: keying the car and thresholding the canvas
                failed twice in opposite directions — a loose key swallowed PINE
                VALLEY's lavender sky and reported a car 305 px wide, a tight one
                reported zero pixels everywhere because tone mapping never emits
                the key colour. The car is found by DIFFERENCE now (same frame
                rendered twice, once keyed), which no colour pipeline can defeat.
- `startlap.mjs` does the start line scold you for crossing it? Hooks
                `hud.centerMsg` rather than polling `_missedCP`, which is cleared
                in the frame it is read. Carries its own CONTROL: it cuts a lap
                on purpose afterwards and asserts that one IS still refused and
                still scolded.
- `treegap.mjs` / `standcheck.mjs` — DOES IT STAND ON ANYTHING, by raycast. Both
                exist because `tests/tool-float-census.mjs` answers a different
                question (is any geometry in this 2 u column?) and on this roster
                answers it wrongly three ways: one ribbon mesh spanning a canyon
                covers every column beneath it, a boat on the sea has only
                excluded water under it, and a foot-bridge is MEANT to be in the
                air. All three read as defects. Swept with the ray instead the
                roster is clean — PINE VALLEY 15 of 743 plants off by more than
                1 u and every one of them SUNK rather than floating; the named
                structures left over are start gantries, arch checkpoints,
                campanile belfries and bridge decks, all of which belong
                overhead. Read both headers before trusting any floater count:
                each carries the three wrong answers it produced first, and each
                was only caught by LOOKING at the picture the number described.
- `lookat.mjs`  park the camera off a coordinate and render it, so a number can be
                confirmed by eye before anything is changed on it. Two traps are
                baked in: `setAnimationLoop` is stopped first (the first cut set
                the camera and the next rAF handed it back to `_updateCamera`, so
                every shot came out of the start gantry whatever was asked for),
                and the eye is seated ABOVE the terrain (a lens buried in a
                hillside sees culled back faces, and produced a picture of OLIVE
                PASS with houses and boulders hanging in the sky on a world that
                turned out to be fine).
- `groundgap.mjs` the drawn ground against `terrainHeight()` by distance from the
                road — out where the flora is, not at the carriageway where
                `tests/tool-ground-mismatch.mjs` asks it. They agree to ~0.5 u
                mean at every distance out to 1200 u.
- `similar.py`  WHICH WORLDS LOOK THE SAME, measured (python3, Pillow): each world
                reduced to a 6x6x6 RGB histogram over the non-HUD part of its
                tour frames, every pair ranked by 1 - intersection. Median over
                the 2211 pairs is 0.631; anything under ~0.15 is not a family
                resemblance, it is one world wearing another's light.
- `wild.mjs`    OFF THE ROAD ON PURPOSE: takes each world up its highest
                DRIVABLE ground and into its water (river line, creek, or the
                sea's own level), shooting from the chase camera every 5 s.
                Three traps are written into it, each having wasted a run:
                seating the car ON the road and steering off it just grinds
                along an edge rail (`_buildEdgeRails` guards ~90% of the tight
                stations by design, so the tour photographed the rail);
                re-asking "highest ground within 460 u" every second never
                reaches anything, because the massif sits 430-700 u out and
                20 s of driving covers 330; and seating at radius
                (|target| - back) is fine for a summit 840 u out and puts the
                car on the start straight for water 180 u out. It also COUNTS
                the recovery net firing rather than suppressing it — a rescue
                out here means the car wedged on ground too steep to climb,
                which is the answer to "can you climb this", not noise.
                NOTE its summit search finds the far HIGHLAND on 18 of 31
                worlds — an identical (674,-566) at h 28.0 — which is the
                horizon silhouette's own plateau, not a mountain. The massif is
                scenery and is not in `terrainHeight`; what IS climbable is the
                terrain, bounded by the traction limit `test-climb` pins.
- `feedstack.mjs` two questions about the message feed at once, both in live
                DOM rects rather than off the stylesheet: how many IDENTICAL
                rows are on screen at the same moment, and how many pixels of a
                row sit under the 📷/⏸ buttons. Both were defects; both are
                fixed. Keep it pointed at more than one viewport — the buttons
                stack in portrait and turn sideways under 560px of height, and
                the two cases need opposite corrections.
- `blindtime.mjs` how long the screen is a VOID: the share of off-road frames
                with the car under the ground, and the longest unbroken run of
                them. Measured 5.04% of 23,040 frames across four worlds, worst
                11.84% on SILVERSTONE, longest single void 1.22 s.
                `_watchCarVisible` already fixes the state — it lifts the car
                and re-seats the boom — but only after `_blindT` reaches 1.0 s,
                and that second is the void. SHORTENING THAT DWELL IS NOT A
                ONE-LINE CHANGE: `terrainHeight` returns the RIDGE over a bore,
                so a car in a tunnel reads as buried, and the dwell is part of
                what stops the watchdog teleporting it onto the mountain.
                Measure `test-tunnels` before touching it.
- `camdig.mjs`  is the lens ever under the ground? 0 of 10,080 off-road frames
                across three worlds — so a black frame is NOT the camera being
                buried, and the theory that the MAX_UP pull-in loop could exit
                with the lens underground is WRONG. It was checked because the
                loop looks like it can; it cannot, and the number says so.
- `terrainrange.mjs` / `riverprofile.mjs` the world's height range against the
                DRAWN ground, and a cross-section anywhere. Between them they
                killed the theory that SILVERSTONE's -39 u readings were a
                river carve gone wrong: the ground really is 40 u down out
                there, `terrainHeight` and the mesh agree to 0.35-2.0 u mean
                across every distance band, and the black frame was a car in a
                hollow, not a hole in the terrain.
- `srv.mjs`     plain static server (`node srv.mjs 8920`).
- `keep.sh`     keeps a server alive across tool-call timeouts:
                `setsid ./keep.sh srv.mjs 8920 &`

Two rules learned the hard way, both in HANDOVER.md in full:
1. Baseline against pristine `origin/main` on a second port, or you cannot tell
   a regression from a pre-existing failure.
2. Traffic runs on its OWN requestAnimationFrame — a fixed-step `g.frame()`
   harness never drives it, and its clock runs ~1/8 real time under swiftshader.
