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
- `pzwhy.mjs`   WHY a world got no square: re-runs every gate in the site
                search and counts which one refused each station. "It built
                none" is not a diagnosis — this turned it into "350 of 481 on
                FALL, worst 26.6 u", which is a hill town, not a bug.
- `piazzashot.mjs` the driver's view OF a square rather than down the street;
                `BACK` and `UP` move the camera back and lift it, and `FACE=1`
                stands IN the square looking at its church — the only shot
                that shows a facade, and the one that caught a door and a rose
                window built on the wrong side of their own wall.
- `whosolid.mjs` names the BUILDER behind a collider standing in the road:
                solids carry no provenance, so it pairs each with the nearest
                mesh and prints that mesh's parent chain. Do not make it ask
                `_clearsRoad` — since r246 that also refuses anything inside a
                square, and it buried four real offenders under every piazza
                lamp on the world.
- `offenders.mjs` the same question from the mesh side, plus the world's
                widest half-width — which is how MOUNTAIN TO SEA's 45 u turned
                out to be `roadWidth: 5` working exactly as asked.
- `buildtime.mjs` does each world BUILD, how long it takes, and what page
                error stopped it. Written after r253 shipped a ReferenceError
                that stopped SANREMO STAGE producing a track at all: boot.mjs
                builds levels 1 and 6, neither of which has a piazza, and the
                road census reports a world that will not build as a quiet
                `SKIP` in the middle of its results. Run it over the town list
                after any change to a shared builder.
- `beamlook.mjs` the lamp rig from EVERY camera the game has. Drives the game's
                own `_updateCamera` per mode on a night world, then diffs the
                frame with the rig hidden against the frame with it shown, and
                reports what the lamps actually add. `NOFADE=1` pins the
                material to its unfaded value for the baseline, in the same
                frame rather than from memory; `PORTRAIT=1` uses a phone
                viewport; `KEEPA=1` also writes the no-rig frame.
- `wedge.mjs`   the same question as a road metric: pixels in the band ahead of
                the nose sitting more than 22 above the road's own median.
                Weaker than `beamlook` on a neon world, where the emissive edge
                lines dominate the band — kept for daylight-road work.
- `conehunt.mjs` / `conehunt2.mjs` naming an artefact painted ON the road.
                `conehunt` rules out the shadow machinery (cast off, frustum
                2.5x, re-bias); `conehunt2` hides one object at a time and
                scores on the wedge metric, skipping the road itself. Scored on
                frame-wide brightness instead, the hunt names `road` and stops,
                because on a neon world the bright pixels ARE the road's
                emissive lines.
- `roadgloss.mjs` sweeps the wet road's roughness and envMapIntensity at the
                worst point on the lap. Its lesson is a negative one: roughness
                0.52 → 0.92 moved bright pixels 0.88% → 0.86% and only darkened
                the surface, and no env map is bound at all.
- `nightroad.mjs` the road material and every light that reaches it on a dark
                world, plus how much of the frame clips.
- `frontagegaps.mjs` is the streetwall continuous? Projects every frontage
                block onto the centreline and measures the along-street gap
                between neighbours on the same side. Two traps it was written
                wrong into first: the along-street width is COLUMN 0 of the
                instance matrix (column 2 is the 8.5 u depth, and taking the
                max of the two makes an abutting terrace read as gaps), and
                `oldtown-frontage` carries the sparse back ranks as well as
                the street, so the frontage rank has to be filtered out by
                lateral first. Wrong both ways it reported 53-71% open; right,
                17-38%.
- `shadefloor.mjs` sweeps the hemisphere fill against the facade's P10/P50/P90
                and reports the cost — road and whole-frame means — beside the
                gain. Its lesson is a negative one: 1x to 3x moves the shade
                floor 10 → 17 and the frame mean 96 → 126. Light multiplies
                albedo; it cannot brighten a near-black texel.
- `facadeshot.mjs` the buildings framed WHERE THEY STAND. The old-town
                frontage does not line the whole lap — this reads every
                `oldtown-frontage` instance's position, finds the densest ~6%
                window and shoots from there, so a world with a fine main
                street is not judged on an empty verge. Prints coverage:
                COTE D AZUR 22%, CINQUE TERRE 15%, SANREMO 28%, GENOVA 22%.
- `facadelum.mjs` what colour the walls actually COME OUT. Renders the frame
                twice — normally, then with the frontage flat-white and
                everything else hidden — and averages the first over the mask
                the second draws. Reports mean, saturation and the P10/P90
                lit-shade spread, which is the number that matters: the game
                bottoms out at 9-15 where the reference bottoms at 68.
- `facadetint.mjs` whether the theme's paint reaches the wall: the tints asked
                for, the instance colours actually written, and the facade
                texture's MODE (not its mean — a facade texture is render plus
                black panes and iron, so its average is always a mid grey and
                says nothing about the paint).
- `refluma.mjs` the same luminance read taken on the REFERENCE illustration
                itself, over the terrace, the mid-town blocks and the rampart.
                "Too dark" is worth nothing as an opinion; this is what it is
                compared against.
- `nightshot.mjs` a dark world with the car parked on the racing line and the
                camera set to the GAME's own CHASE rig (back 17, height 11.5,
                look 19 ahead). `CAM=front` stands up the road with the car
                coming at you; `CAM=rear` drops low and close behind for the
                tail lamps. Judging headlights from an invented camera is how
                a beam the car's own roofline hides gets called fine — the
                first cut of this probe sat at 6.5 up and reported a puddle.
- `lightdiff.mjs` renders the same frame twice, lamp rig hidden then shown,
                and reports the pixel delta: how many changed, by how much,
                and the box they fall in. This is what proved the road beam
                was contributing nothing outside the car's own footprint.
                `LIFT=0.6` raises the rig to tell "not drawn" from "buried in
                the road".
- `lightiso.mjs` the rig with EVERY other mesh hidden, so where each quad
                lands is a picture. `KEEPCAR=1` keeps the bodywork for scale;
                `RANGE=start,count` draws one quad. It corrected a false read:
                the red bars at the tail are the car's own modelled lenses,
                not the rig, and the rig had to be measured without them.
- `lightgeom.mjs` local centre, size, colour and screen position of every quad
                on the player's rig.
- `litworlds.mjs` one line per level: sky, dusk flag, and how many of the
                eight cars have their lamps lit. A daylight world reading
                `8/8 lit` is the bug it exists to catch.
- `pageerr.mjs`  did the page even boot, and what stopped it — ten seconds,
                one answer. RUN THIS AFTER ANY EDIT TO main.js. `node --check`
                parses a file as a SCRIPT, so it accepts things the module
                loader rejects: a duplicate `const` in one scope shipped past
                a green syntax check as `Identifier 'lamp' has already been
                declared`, and every later probe just timed out waiting for a
                game that was never going to exist.
- `bayboth.mjs` the bay for a dark, a light and a mid car as three files. The
                room is repainted from the car, so one screenshot proves
                nothing.
- `dioparts.mjs` what each welded piece of the garage diorama is worth: hide
                it, count the pixels that change, and print its triangle count
                beside them. It caught 150 grass tufts costing 1800 triangles —
                22% of the diorama's geometry — for 1.4% of the frame, because
                at that camera distance a 0.75 u blade is two pixels.
- `bayblack.mjs` how much of the bay canvas is black, in a 4x4 grid so the
                answer says WHICH part is unlit, with the scene graph beside
                it. It is what showed the bay was already fine and sent the
                "light up the garage" report to the shelf cards instead.
- `garageblack.mjs` the whole garage tab: the dark and transparent fraction of
                every canvas and image on it, plus a shot of the top and of
                the part shop. The panel scrolls, not the page — it finds the
                element that actually overflows rather than scrolling `body`.
- `bayshot2.mjs` the build bay as the garage tab renders it, plus `fill` —
                how much of the panel the car actually covers. `SPIN=rad`
                parks the turntable. "The car is small" is a framing
                multiplier, and a multiplier is a number.
- `bayfit.mjs`  sweeps the bay camera's distance against the car's measured
                pixel box. The small-angle fit in `_frameStage` is a long way
                out at this range — near end vs far end differ by three — so
                the multiplier is read off this, not off the algebra.
- `nosefit.mjs` the upgrade kit's nose and tail gap per car, measured against
                the bodywork box AND against the box including the lamp rig.
                Written to settle whether a `test-cars` failure was the rig's
                doing. It was.
- `shadowprobe.mjs` which contact-shadow decals reach into a carriageway. Its
                own lesson: it asked `nearestIndex` and reported zero while the
                census reported a 4 u bite — on a stacked lap the road a decal
                hangs OVER is not the road it is nearest to, and a probe that
                asks the wrong question confirms the wrong answer.
- `skyshot.mjs`  the sky, pitched up, so the frame is mostly cloud. A bank
                tuned from a street shot is tuned on the one strip of sky a
                building has not already covered — which is how a cloud field
                that looked fine at eye level turned out to be a lid.
- `skyprobe.mjs` the cloud bank the running world built: theme tint, the
                per-instance colours it produced, material type, and the
                renderer's tone mapping and exposure (which is what was
                clipping the shading flat).
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

`bayblack.mjs`'s `transparentPct` is the gate for the garage backdrop: a
diorama whose sky sits beyond the stage camera's FAR PLANE renders as a hole
with the panel showing through, and it looks exactly like a backdrop that is
merely too small.

(`baycontrast.mjs` and `baylamps.mjs` are gone: they measured the painted
room and its coloured lamps, and r261 replaced both with a forest.)

Three rules learned the hard way, all in HANDOVER.md in full:
1. Baseline against pristine `origin/main` on a second port, or you cannot tell
   a regression from a pre-existing failure.
2. `srv.mjs` takes its root from `argv[3]` and DEFAULTS TO THE WORKING TREE,
   whatever the CWD. `cd`-ing into a worktree and starting it there serves your
   own branch on both ports — the page loads, the game runs, the numbers look
   plausible, and the A/B is worthless. Pass the root explicitly and check with
   `curl <port>/src/<file> | grep`.
3. Traffic runs on its OWN requestAnimationFrame — a fixed-step `g.frame()`
   harness never drives it, and its clock runs ~1/8 real time under swiftshader.
