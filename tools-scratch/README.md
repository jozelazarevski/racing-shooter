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
- `bandscan.mjs` what the bands down the edges of a screenshot ARE: it scans in
                from both sides for the first column that is not flat page
                background and reports width, share and exact colour. "Safe-area
                inset", "stale canvas width" and "letterbox" look identical at a
                glance and have completely different fixes; the colour and the
                symmetry tell them apart. It identified the device from the
                arithmetic alone.
- `gates.mjs`   EVERY GATE, ONE COMMAND, ONE EXIT CODE — run it before pushing.
                `FAST=1` skips the slow sweeps. It exists because r271 shipped a
                broken view past a "suite" that was three scripts somebody
                remembered. Every gate it calls MUST exit non-zero on failure;
                adding one that only prints its verdict is the same as not
                adding one.
- `camsanity.mjs` THE GATE FOR "everything looks wrong". Asserts the canvas BOX
                equals the screen, that the drawing buffer shares the box's
                aspect (or the whole image is stretched), and that
                `camera.aspect` agrees — in title and race, portrait, landscape
                and desktop. It caught the canvas laying itself out at BUFFER
                size, 703x1529 on a 402x874 screen. No other gate could: nothing
                threw, the game booted and drove. It was a layout fact.
- `titlecar.mjs` is your car in the ATTRACT SHOT behind the menu: whether the
                mesh is in the scene, visible, has a hidden ancestor, and where
                it projects — then a screenshot with the menu chrome hidden,
                which is the only way to see what is really behind the panel.
                It found the car at NDC x 0.87 while every flag said "visible".
- `landscape.mjs` does the game fill the screen, and which HUD boxes land on
                each other, at a set of real device sizes. It measures
                `#joy-base` (the ring you can see) and NOT `#joy-zone` (the
                invisible 52% touch region every button is meant to sit on) —
                counting the zone made the whole report false positives.
- `wedgetest.mjs` can a car pinned on a barrier ever get out. It does NOT wait
                for the rescue to fire — that needs 5 s of `dt` at 0.05 and
                swiftshader gives two frames a second — and it does NOT pass on
                the car having travelled, which a car steering round the
                obstruction also does. It pins the car, injects the jitter a
                real wall gives, and counts how often the wedge timer goes
                BACKWARDS. That is the thing the fix changed.
- `camoccl.mjs`  is anything between the eye and the car, every few frames of a
                real run. A probe can `import('three')` in the page — the
                import map applies — so this uses a real Raycaster and needs no
                screenshot readback. It prints the size of the solid set and
                what it dropped, because the failure mode of this probe is
                casting against a set that does not contain the thing.
- `camtrail.mjs` per-frame camera log over a driven run: car NDC, camera and
                car lateral offset, heights, speed, index gap. For "where does
                the camera go wrong" when you do not know which pose to pick —
                and posed reproductions had already failed three times.
- `cliffgap.mjs` how close the cliff face actually comes, station by station,
                against the constant the camera is allowed out to. It found
                CANYON RUN's nominal 37 u face pulled in to 11.3 at sixteen
                stations by `_cliffCap`, which the camera's `lim = 8.4` knew
                nothing about.
- `camstuck.mjs` how much of your own car you can see: keyed magenta once with
                depth and once forced on top, and the ratio is the occluded
                fraction. The watchdog tests hidden, buried and off screen —
                not occluded — so this is the symptom it does not cover.
- `fieldshot.mjs` the WHOLE FIELD in one frame, for judging anything per-car:
                packs the rivals round the player and shoots a named camera
                mode, printing each car's lamp state beside the picture. "Do
                all the cars have headlights" should be a photograph, not an
                argument.
- `caproll.mjs`  the camera round a WHOLE LAP without teleporting it. Rails the
                car one small index step a frame and samples occlusion, camera
                distance and where the car projects. Teleporting between
                stations is what the earlier `camstuck.mjs` did and it invents
                its own bug: a camera asked to catch up from a third of a lap
                is not a thing a player ever does. It caught the cliff-world
                runaway — 51 to 490 u and never recovering — against PINE
                VALLEY holding 51-52 on the same rail.
- `camstuck.mjs` the same idea by parking the car at fixed stations and
                lateral offsets. Kept for the occlusion measurement (key the
                car magenta, render with depth and without, and the ratio is
                how much of it you can see); its station-jumping is NOT a
                sound way to judge the camera — see `caproll.mjs`.
- `lampcheck.mjs` which cars have a headlight rig and whether it is on, on the
                grid and again racing, because "no lights" and "lights that
                only arrive after the lights go green" are different bugs.
- `beamread.mjs` how much headlight survives per camera mode: the opacity
                `fadeCarLights` settles on, which is exact, plus a count of
                pixels that change when every rig is hidden — and that COUNT is
                not usable on an animated world like NEON GRID, where it is
                mostly neon and particles. Trust the opacity.
- `swallowed.mjs` EVERY EXCEPTION THE FRAME LOOP IS EATING. Drives each level
                with throttle, steering and all four weapons, and collects what
                `Game.frame()`'s catch printed. Anything it lists is a real bug
                the game is hiding. It THROWS if a method it means to call is
                missing, because its first cut used five names that do not
                exist and `?.` made every one a silent no-op — it reported
                clean having tested nothing but driving in a straight line.
- `carvisible.mjs` can you SEE the cars: each car masked with a key colour,
                then every one of its pixels scored in CIE76 against the ground
                ring around it. Report `visiblePct`, not the mean — a car
                holding black tyres and pale bodywork averages out to the
                colour of the road while every part of it separates cleanly,
                and that artefact cost r267 a whole invented bug. `PLATE=off`
                is the shape of a correct A/B: hide the thing under test, never
                rebuild the scene without it.
- `playermoves.mjs` DOES THE PLAYER'S CAR DRIVE. Holds the throttle, then
                asserts the car moves, the chase camera is not at the world
                ORIGIN, and nothing was swallowed by the frame loop's catch.
                It exists because `_syncLights` on the wrong class made
                `PlayerCar.update` throw on its first line on every level, and
                the frame loop's recovery meant no crash, no stack, and
                `boot.mjs` green at 4/4. `camToCar` is reported, not asserted.
- `worldcast.mjs` a world's colour cast from the camera it is played from:
                mean RGB, green excess over the red/blue average, luminance,
                blown and dark fractions, with the theme's own light constants
                beside them. Reads the frame through a SCREENSHOT — the
                renderer has no `preserveDrawingBuffer`, so drawImage off its
                canvas returns black, and so does re-running the composer.
- `castsweep.mjs` tune a world's lights WITHOUT RELOADING IT. Patches the
                hemisphere and sun in the running scene, re-measures, repeats —
                five tunes in one load, against ninety seconds a reload.
- `shotcast.mjs` the colour cast of an image file, for matching a phone shot of
                the deployed build against a theme in the repo.
- `gridsit.mjs` where the car actually is at the start line versus where the
                road is, when a level looks like it will not drive.
- `lvlerr.mjs`  does this level build and run: page errors, console errors,
                scene contents, camera and car positions, lights and fog. It is
                what surfaced the once-a-frame TypeError the game recovers from
                and never reports.
- `flatsurf.mjs` which surface in the bay is FLATTEST. Each welded piece is
                masked (hide it, diff), then the spread of luminance over its
                own pixels is reported — sd and p10-p90 — beside its share of
                the frame. A big surface with a tiny spread is a flat fill
                pretending to be a material. It named the pine skirts: 9.9% of
                the bay at sd 14, the lowest of anything large.
- `tintab.mjs`  the per-tree vertex tints, A/B'd WITHOUT MOVING A TREE — it
                flips `material.vertexColors` on the already-built geometry,
                because rebuilding the scene re-rolls its layout and then the
                two halves are different forests. It reports `distinctTints`
                first: a run where both columns match to the tenth is nearly
                always a weld that carried ONE colour, since
                `BufferGeometry.clone()` copies `userData` by reference and
                `q.userData.tint = t` writes into the source geometry's object.
- `baypair.mjs`  the same bay, the same PARKED turntable angle, from a port you
                name: `node baypair.mjs 8902 out.png 2.05`. A before/after is
                worthless if the car is at a different angle in each shot, and
                `_stageRun` rewrites `pivot.rotation.y` every frame — so it
                stops the loop first. It prints the build tag it actually
                loaded, because srv.mjs has served one branch on both ports.
- `shotcmp.mjs` screenshot a local HTML file (`node shotcmp.mjs page.html
                out.png`). Lives here because this is where playwright-core
                resolves from; used to compose before/after sheets.
- `dustlook.mjs` the turntable dust, PARKED. `bayshot2.mjs`'s SPIN is useless
                for this: the next frame of the stage loop overwrites
                `pivot.rotation.y` before the screenshot lands, so a puff
                behind the rear wheels is never in shot. This one calls
                `_stageRun(false)` first, then parks the pivot, then reads each
                puff's opacity off the MATERIAL rather than recomputing the
                curve — a probe carrying its own copy of the curve reports the
                curve it was written against, not the one in the code.
- `farplane.mjs` every camera's near/far measured against the bounding sphere
                of everything its scene draws — race, stage and studio in one
                pass. Objects with `frustumCulled === false` are EXEMPT: the
                particle pool parks its dead at y -9999 and draws
                unconditionally, so its bounds sit ten thousand units out and
                mean nothing. Run it before redesigning anything that looks
                too small; twice now a backdrop was merely being clipped.
- `diocost.mjs` what the garage diorama costs: geometries, materials, textures,
                triangles, JS heap, and the wall-clock of building a SECOND
                one. That last number is the sharing gate — 64.5 ms means each
                scene builds its own forest, 0.1 ms means they share.
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
- `lapshots.mjs` eight CHASE-camera stations round one lap onto a contact
                sheet - the cheap way to go looking for a reported shape when
                the report has no station in it.
- `spikes.mjs`  terrain needles: the biggest rise between two samples a fixed
                baseline apart, per level. Clean on the alpine chapter, which is
                how the search moved off the terrain and onto the massif.
- `pixat.mjs`   the colour under a given pixel of a saved frame. Sampling the
                reported slab at #8a9a84 is what identified it as `hillColor`,
                and `hillColor` is what the massif lerps its foot towards.

(`bigtrans.mjs` and `nearbig.mjs` are gone, and why is worth a line: the first
projected bounding-box corners without checking they were IN FRONT of the
camera - `project()` on a point behind it returns garbage, and it reported 1600%
coverage. The second called the world's enclosing shells - the r9000 skirt, the
haze bands - "overlapping the road", which they do, by design, because they
enclose everything.)

- `iconparts.mjs` what is actually IN a car shelf icon: shoots it at 4x through
                the game's own `_shoot`, then hides one child of the diorama at
                a time and re-shoots. It is what found r279 — one 4-vertex quad
                owning 82% of the frame and every tree, rock and bush at 0.0%.
                `dioparts` cannot stand in for it: that measures the BAY, which
                is a different camera at a different distance.
- `iconrig.mjs` / `iconflat.mjs` the icon camera's own position, aim and pitch,
                and every forest part's LOCAL ROTATION beside its WORLD BOX.
                The pair exists because those two disagreed, and the
                disagreement was the bug: `_diorama`'s second mount rebuilt
                meshes from geometry alone and dropped their transforms.
- `iconaim.mjs` / `iconaim2.mjs` candidate icon rigs rendered as a contact
                sheet with the horizon's clip-space position printed on each.
                `hNdc >= 1` means the horizon is off the top of the frame and
                the shot CANNOT show a skyline — the shipped rig is 1.13.
- `iconwho.mjs` geometry type, local rotation, material colour and blending for
                every diorama part, plus the icon re-shot with each of the
                first few hidden. Names a part when a diff says "this one" and
                the index alone is not enough.
- `shelfshot.mjs` the garage tab at phone width, so the icons get judged at the
                148 px they are drawn at rather than the 4x a probe prefers.
- `wallshare.mjs` how much of a race frame is wall within 45 u, and how much is
                sky, over a driven lap. The wall number counts the road and so
                runs ~50% everywhere; SKY is the column that ranks enclosure —
                L4 and L10 at 22%, CAPE OLIVETO 11%, GRANITE NARROWS 10%,
                GLACIER COL 3%.
- `massifloom.mjs` how many DEGREES of sky the nearest massif cone fills from
                each road station. The builder's own clearance rule is a
                footprint rule, so it can pass while a 258 u mountain stands 42 u
                off the centreline; this is the angle, which is what the driver
                sees.
- `massifshape.mjs` every massif cone's width, height, aspect and flank
                distance. Catches the other half: the shrink-to-fit path used to
                narrow `w` and leave `h`, which makes needles.
- `loomsweep.mjs` `massifloom`'s pass/fail across every level that builds a
                massif, guarding BOTH directions - no cone may lean over a road,
                and the ring may not lose cones to the fix.
- `conering.mjs` where each massif cone ENDED UP, against the r0..r1 its spec
                asked for. Nothing bounds the walk's step, so a bigger clearance
                is a bigger shove and a cone can be pushed past the skyline,
                leaving a hole where a mountain should be. Companion gate to
                `loomsweep`: that one stops the wall, this one stops the hole.
- `shrinkpath.mjs` `_buildMassif`'s "eight passes could not find room" branch,
                forced. Point it at a tree whose massif spec plants the cones ON
                the road (see r278 in HANDOVER) and it checks the build raises
                no error, every instance was written, and nothing came out a
                needle. r278 recorded that the branch COULD NOT BE REACHED —
                nothing bounded the walk's step, so a cone always escaped
                rather than shrink. The walk is now bounded to `r1 * 1.35`, and
                on the same fixture (16 cones, w and h 2000, planted on GLACIER
                COL's lap) it reports 16 of 16 through the branch at aspect 1,
                none dropped. This is the probe that says so.
- `massifframe.mjs` the mountain ring in a RACE frame. Reads the live instance
                matrices, picks the station/cone pair that subtends the largest
                angle, parks the car there with the race running and aims the
                game's own camera at that cone. A ring has no useful centroid —
                `spread: 6.0` puts cones all the way round, so their mean is the
                world origin and a camera aimed at it photographs the lap. Fails
                loudly on no mesh, no surviving cone, or a race that never
                starts (`PORT=8914 LEVEL=66 TAG=-after`).
- `massifwho.mjs` whether a level asks for a massif AND whether the mesh exists.
                `conering` and `loomsweep` are both silent when the named
                InstancedMesh is missing, and silence there reads as clean —
                this tells the two apart. It is how L32 RED CENTRE RUN was found
                to carry an outback massif spec (7 cones at r 460-720) and build
                no `massif` mesh at all, which neither gate can see.
- `lapextent.mjs` how far from the world centre the lap itself runs, per level.
                Needed to choose an "ON the road" ring for `shrinkpath`'s
                fixture: GLACIER COL's lap only reaches 271 u.
- `loomshot.mjs` measures the worst station then parks there and photographs it,
                so the number and the picture are the same event
                (`LEVEL=66 STATION=895 TAG=-x`).
- `glacierloom.mjs` the same two numbers for the GLACIER, per slab: the gap
                from the drawn flank to the nearest centreline sample, and the
                degrees of sky the slab's top subtends there. It reads the
                InstancedMesh named `glacier` and its geometry — those slabs
                are NOT in `solids`, so a probe reading that roster finds no
                glacier at all and reports clean. FAILS LOUDLY when it cannot
                find the mesh. FURKA RIDGE 197 u / 12.4 deg, GLACIER COL
                330 u / 25.8 deg.
- `glacierforce.mjs` the glacier's clearance walk, FORCED. The tongue is
                nowhere near either furka lap, so the walk never runs there and
                a green run against the roster proves nothing (the `shrinkpath`
                lesson). This translates the whole centreline onto the tongue's
                wedge, rebuilds the sample grid, calls `_buildGlacier` again and
                reads the new matrices. `walked` is the gate on the gate.
- `glacshot.mjs` measures the worst slab that is actually AHEAD of the car, then
                parks at that station and photographs it (`LEVEL=66 TAG=-before`),
                and reports what SHARE of that frame the ice draws — hide the
                mesh, render again, diff — because "no slab leans over the road"
                is also what deleting the glacier would report. Render through
                `g.composer`, not `renderer.render`: the latter leaves the last
                pass's target bound, nothing reaches the default framebuffer and
                readPixels hands back the same stale bytes twice (0.00%). And
                pick the station with the CAMERA's half-angle (~18 deg
                horizontal on a portrait 56 deg vertical fov), not a roomy
                cone: at 45 deg "ahead" every slab projected past ndc x = 2.4,
                off the side of the picture, and the pale ice in that frame was
                the horizon ring, not the glacier at all.
- `glacpix.mjs`  settles "is the ice actually in this frame" three ways at one
                station: readPixels after a composer render (is the buffer even
                populated), the instance matrices projected through the live
                camera (how many slabs land inside the frustum, and where), and
                a screenshot with the mesh hidden written beside the normal one.
- `roadreach.mjs` how far the lap gets from the WORLD ORIGIN, overall and inside
                the wedge the glacier's ring occupies. The glacier is placed in
                origin coordinates, so whether it clears the road is a fact
                about the route: FURKA RIDGE reaches r 318, GLACIER COL r 271.
- `whatsinfront.mjs` names the thing filling the frame by elimination: hides one
                scene child at a time, diffs the pixels, then descends into the
                winner. Sanity-check its answer - at L67 station 450 it
                correctly named `tunnel`, which is why that shot was dark, and
                a station picked by eye is easily inside one.
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
