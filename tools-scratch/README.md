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
- `srv.mjs`     plain static server (`node srv.mjs 8920`).
- `keep.sh`     keeps a server alive across tool-call timeouts:
                `setsid ./keep.sh srv.mjs 8920 &`

Two rules learned the hard way, both in HANDOVER.md in full:
1. Baseline against pristine `origin/main` on a second port, or you cannot tell
   a regression from a pre-existing failure.
2. Traffic runs on its OWN requestAnimationFrame — a fixed-step `g.frame()`
   harness never drives it, and its clock runs ~1/8 real time under swiftshader.
