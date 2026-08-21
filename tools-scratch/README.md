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
- `piazza.mjs`  where the squares landed: lap fraction, how far each inner edge
                clears the driveable edge, and how many frontage blocks stand
                inside one — which must be zero, because a square the terrace
                did not stop for is a fountain in somebody's front room.
- `piazzashot.mjs` the driver's view OF a square rather than down the street;
                `BACK` and `UP` move the camera back and lift it, and `FACE=1`
                stands IN the square looking at its church — the only shot
                that shows a facade, and the one that caught a door and a rose
                window built on the wrong side of their own wall.
- `townsfolk.mjs` how many people were placed, how many stand in a square, how
                many are BURIED in one, and how many are on a carriageway. The
                last three are the ones that have been wrong.
- `towncost.mjs` what a town world costs: draw calls, instances and texture
                megabytes, plus a part-by-part list of the frontage and square
                kit. Run it stashed and unstashed around any detail pass — the
                whole of r248 is seven draw calls and 1.9 MB, and that is only
                knowable by measuring both ends.
- `pzcount.mjs` draw calls and instances the squares cost, against the scene's
                total.
- `floaters.mjs` every solid sitting more than 2.5 u above the ground under
                it, with its radius and whether it belongs to a square — the
                road census reports the COUNT, this says which ones and why.
- `balconies.mjs` how many balconies and awnings sit on a storey line the
                facade painter actually drew, against how many exist. It is
                what turned "the balcony is all over the place" into 196/319,
                and it falls back to `townhouseBays` on older builds so the
                baseline can be measured on the commit before the fix.
- `roadlum.mjs` the mean colour of the carriageway and of BOTH walls from the
                driver's shot, plus how much of each is above 240. Written
                because "the road is blown out" was wrong three times running:
                it sits at 158 with nothing clipped, and only looks white
                beside a shaded wall at 67. Run it before touching a light or
                a surface palette.
- `roadtex.mjs` what the RUNNING theme's road spec is, and the road mesh's own
                map dumped per mesh. Companion to `facetex.mjs`, same rule: if
                an edit does not show up here it is not reaching the render.
- `skyjunk.mjs` anything hanging in the sky near the camera - name, height,
                size, parent, material. It named the floating chimneys r244
                fixed, which had been in every seafront shot since r238.
- `lightprobe.mjs` the lights, the tone mapping and the road material the
                running world actually has, when a tune edit seems not to land.
- `srv.mjs`     plain static server (`node srv.mjs 8920`).
- `keep.sh`     keeps a server alive across tool-call timeouts:
                `setsid ./keep.sh srv.mjs 8920 &`

Two rules learned the hard way, both in HANDOVER.md in full:
1. Baseline against pristine `origin/main` on a second port, or you cannot tell
   a regression from a pre-existing failure.
2. Traffic runs on its OWN requestAnimationFrame — a fixed-step `g.frame()`
   harness never drives it, and its clock runs ~1/8 real time under swiftshader.
