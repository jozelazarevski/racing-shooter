# RALLY_MASTER_SPEC.md — One Specification, All Stages

**Status:** NORMATIVE. This single document supersedes and replaces RALLY_WORLD_RULES.md and RALLY_PATCH_02.md (v1–v3 and Addendum A). It applies to every stage, biome, camera mode, and system, current and future.
**Authority hierarchy:** RALLY_RULES.md > RALLY_MASTER_SPEC.md (this file) > RALLY_WORLD_BIBLE.md > RALLY_PATCH_01.md > RALLY_SYSTEMS.md. Content violating this file is a build failure, not a style choice.
**Evidence base:** R10.MP4 (Harvest Run r379), R11.MP4 (Glacier Col, ended DESTROYED), screenshots Olive Coast r384 and Citadel Bay r379. Full defect evidence in Appendix A.

---

## §1 Constraints

| ID | Constraint |
|---|---|
| C-1 | In-race HUD frozen as shipped. No element added, removed, moved, restyled, resized. No HUD-module file may appear in any diff. |
| C-2 | No new on-screen elements. No world overlays (route lines, arrows, floating markers). Delete any that exist. |
| C-3 | World stays fully drivable. No invisible walls or kill zones. Physical guardrails permitted and MUST be breakable. Orchard and forest plantings keep drivable gaps. |
| C-4 | World and track content changes are authorized (owner directive, Sep 2026). C-1 and C-2 unchanged. |

---

## §2 World Rules (WR) — apply to every stage

### WR-1 Road placement
1. No road against a sheer wall: max adjacent slope within 8 m of the road edge is 45°; steeper terrain sets back ≥ 8 m or benches into ≤ 6 m terraces.
2. Roads sit like real mountain roads: valley floors, hillside shoulders (cut side + view side), ridgelines, switchback stacks. Canyon trenches ≤ 10% of lap length, vistas at both ends, never containing the start/finish zone.
3. Clearance envelope: road width + 2 m each side, 6 m height; no terrain, dunes, walls, rocks, or buildings inside it. Gameplay objects only, leaving ≥ 60% of width passable. Terrain never pierces the road surface.
4. Crests are smooth or naturally rocky; sawtooth noise-spike silhouettes prohibited.

### WR-2 Elevation and climbs
1. Two climb archetypes only: gradual-curvy (4–7% grade, sweepers R 60–150 m, switchbacks 250–500 m apart) or steep-curvy (8–12%, hairpins R 12–25 m, 120–250 m apart). No climb segment > 200 m without a direction change.
2. Climbs visually enclosed by mountain/hill massing; never into empty sky or void.
3. Crests reveal composed vistas, never a blank plane.
4. Slope physics (§3 FIX-6) applies everywhere.

### WR-3 Scenic composition
1. Every frame from every road position: mid-ground layer (vegetation, rock, structures) + background layer (ridges, peaks, sea horizon, sky gradient). Single-layer views prohibited.
2. 2–3 ridge silhouette layers with depth fade on open sightlines; the road is never the highest visible geometry on mountain stages.
3. Clouds ≥ 60 m below the road edge or in the sky; hard white planes at road level prohibited. Sea is composed (water shading, shoreline transition, horizon fade), never flat hard bands.
4. Featureless terrain > 100 m × 100 m within 300 m of any road fails review.

### WR-4 Camera and image stability — zero twitching
1. Camera interpolated on fixed timestep, critically damped, never sampling raw physics. Angular velocity ≤ 120°/s normal driving; impact kick once, ≤ 0.3 s, ≤ 4°, no ringing.
2. Post-process cleanliness: no artifact lines in sky or terrain (wavy scanline patterns are a hard failure). Chromatic aberration DISABLED game-wide. No visible HDR/bloom banding in flat sky gradients.
3. Texture frequency: no shimmer/moiré in motion at 60 fps; finest tile feature ≥ 4 px at chase-camera distance; anisotropic ×8.
4. Shadow integrity: every shadow has a visible caster and matches its silhouette. Casterless shadow blobs prohibited; blob shadows only under vehicles, vehicle-sized.
5. Occlusion and framing: foliage between camera and car fades to 0.15 opacity in 120 ms (cap 12 trees); terrain hits pull the camera in, never fade; camera ≥ 1.2 m above terrain; vehicle stays inside the central 60% of viewport (snap after 200 ms violation); the camera target is ALWAYS the player vehicle, including falls and wrecks.

### WR-5 No boxes, no placeholders
1. No untextured, unlit, or default-material geometry in any camera mode: no gray boxes, white planes/cylinders, black faces, raw meshes. Driver cam cockpit is lit and textured and ≤ 20% of frame height, or DRIVER leaves the camera cycle.
2. Build-time placeholder sweep is a hard failure; runtime material failure falls back to lit biome ground color.
3. No texture corruption (foreign pixel garbage) on any surface.
4. Debug geometry compiled out of shipping builds.

### WR-6 Real-world resemblance
1. Every stage names a real-world reference region in RALLY_WORLD_BIBLE.md and derives palette, props, lighting, fog from it: Olive Coast → Mediterranean coastal hills; Citadel Bay → fortified northern coastline; Glacier Col → Swiss alpine pass; Harvest Run → autumn valley farmland. Low-poly is the render style; composition follows the reference.
2. Objects grounded; one-sun shadow consistency; altitude-consistent fog; no neon terrain strips; biome transitions blend ≥ 150 m.
3. Dunes only in desert-referenced stages, only beside roads. No dune or wall crosses any road.
4. Scale sanity: trees 4–12 m, buildings 1–3 stories, mountains read as kilometers via layering; no prop > 2× reference scale.
5. Stage names are promises: Olive Coast has olive groves, Glacier Col has its glacier and snow band, Citadel Bay has a citadel visible from the route, Harvest Run has farmland.

### WR-7 Vegetation — density, orchards, tree quality
1. Density minimums within 150 m of any road: forest bands ≥ 400 trees/km of route; Mediterranean/coastal ≥ 250/km including groves. Only alpine band 3 and desert-reference zones may fall below. Bare hillsides beside roads prohibited elsewhere.
2. Orchards are first-class scenery on agricultural and Mediterranean stages: olive groves (Olive Coast), fruit orchards (Harvest Run), vineyard rows where the reference supports them; contour-following rows, 6–10 m spacing, drivable gaps (C-3).
3. Tree quality tiers:

| Tier | Distance | Spec |
|---|---|---|
| T0 hero | < 60 m of road | 800–2000 tris, distinct species silhouette, trunk + branches + crown clusters, wind sway |
| T1 mid | 60–200 m | 200–500 tris, species-recognizable |
| T2 far | > 200 m | ≤ 80 tris or batched impostors, silhouette-correct |

4. The single-cone tree is retired near roads; cones survive only as T2 impostors.
5. ≥ 3 species per stage from the reference region, mixed naturally, size variance ±25%.
6. Placement: terrain-raycast grounded; no trees on slopes > 50°; none inside the road clearance envelope; canopy non-collidable, trunk capsules only (§3 FIX-5).
7. Vegetation ≤ 15% of frame time at 60 fps mobile Safari; instancing mandatory; LOD dissolves without popping.

### WR-8 Altitude scenery bands
| Band (of stage max altitude) | Scenery |
|---|---|
| 0–40% | Valley: dense forest/groves, farms, structures per stage theme |
| 40–70% | Treeline: thinning trees, exposed rock, patchy snow verges (alpine stages) |
| 70–100% | Alpine stages: full snow — snow albedo, snow-dusted trees, snow surface physics; snowman props live here |

Glacier Col MUST reach band 3. Transitions blend ≥ 150 m.

---

## §3 System Fixes (FIX) — engine level, all stages

**FIX-1 AI racing line.** AI path rebuilt from the road mesh centerline (5 m samples, raycast-validated on-road). Per-AI lateral offset ±1.5 m inside road bounds, shrinking with curvature; max heading delta 25°/segment. Accept: zero AI off-road in a clean lap except combat knock-offs.

**FIX-2 Grid, freeze, separation.** Countdown is an input lock, never the freeze debuff; all statuses cleared at green (defect confirmed on three stages). Grid 6 m × 3 m, 2 columns, non-overlapping spawn AABBs. Freeze has one semantic: 40 km/h cap, ≤ 3 s, always-visible VFX; respawn never applies freeze. AI-AI separation: min 2.5 m following, lateral avoidance; field spacing 8–25 m staggered. Accept: clean grid, no interpenetration in 20 laps, field spreads within 30 s.

**FIX-3 Grounding sweep.** Every static prop terrain-raycast snapped at load (base gap ≤ 0.15 m). Pickups hover ≤ 0.5 m terrain-relative. LOD skirts on distant treelines. Distant meshes lit, bases below the horizon. Orphaned billboards/decals (shards, rectangles, spheres, cylinders) traced and fixed or deleted. Start gates are grounded arches.

**FIX-4 Camera package.** Implements WR-4 in full: occlusion fade, terrain pull-in, height clamp, framing guarantee, player-always-target, driver-cam repair, exposure clamp (fog luminance ≤ 0.85; ≤ 90% of pixels above 0.9), post-process artifact elimination, chromatic aberration off. Accept: vehicle visible ≥ 95% of frames on both video routes; zero sky pixel-crawl in the static-capture diff.

**FIX-5 Colliders and physics pops.** Tree cone colliders removed; trunk capsules r 0.35 m, canopy non-collidable. Trunk impact ≥ 60 km/h uses the existing debris damage path, −40% speed. CCD + raised contact offset on the vehicle body. Wheel visual/raycast rest gap ≤ 0.02 m. Accept: no canopy mounting, no spontaneous launches in 20 laps, no wheel hover.

**FIX-6 Surfaces and slope physics.**

| Surface | Grip | Top speed | Drag |
|---|---|---|---|
| Road | 1.00 | 1.00 | 1.00 |
| Grass/forest floor | 0.85 | 0.72 | 1.35 |
| Open sand | 0.80 | 0.65 | 1.55 |
| Snow | 0.75 | 0.85 | 1.15 |

0.4 s lerp between states. Slope: available acceleration = engine − g·sin(θ) − drag. At 10% uphill: top speed −25%, acceleration −35%; at 10% downhill: +15% with engine braking. The car MUST decelerate when grade demand exceeds engine power; no stage permits gaining speed up a sustained ≥ 8% climb above 80% of flat top speed. Accept: monotonic speed loss on the R11 1:14–1:24 grade at constant throttle.

**FIX-7 Falls, wrecks, recovery.** Cliff fall: −1 hull retained, respawn on road, unfrozen, 3 s invulnerability, camera on player throughout. Stuck detection (< 8 km/h for 6 s with throttle > 0.5, or roll/pitch > 75° for 3 s) auto-invokes the existing SOS respawn, 15 s cooldown. Continuous breakable guardrail on any drop > 15 m. Accept: a three-wreck DESTROYED outcome is unreachable by terrain alone.

**FIX-8 Scoring validity and AI pace.** CLEAN PASS: opponent within 6 m lateral / 15 m longitudinal, both on-road, no contact ±1.5 s. BIG AIR: all wheels off ≥ 0.7 s, clean landing, ≤ 20 m from the road spline. ROCK SHOVED CLEAR requires rock-collider contact. AI pace, tuned LAST (after FIX-1 and FIX-6): leaders 96% / midfield 90% / tail 85% of player top speed; rubber-bands +8% when > 150 m behind (decay to 0 at 40 m), −5% when > 250 m ahead (decay at 100 m). Accept: P1 takes ≥ 60 s on a clean lap; leaving the road > 20 s costs ≥ 1 position; ≥ 1 opponent on screen ≥ 30% of an on-road lap.

---

## §4 Track Design (TD) — geometry targets, all stages

| Parameter | Target |
|---|---|
| Lap length | ≥ 4.5 km, target 5.5 km |
| Corner density | ≥ 7 corners/km |
| Max straight | 300 m |
| Hairpins per lap (R 12–20 m) | ≥ 2, stacked on climbs |
| Medium corners per lap (R 30–60 m) | ≥ 6 |
| Sweepers (R 80–150 m) | ≥ 4 |
| Chicanes per lap | ≥ 1 |
| Sustained grades | 6–12% with crests, physics-affecting |

Corner direction alternates at least every 3 corners; no more than 2 identical-radius corners in a row. Existing stages are rebuilt to §2 + §4; RALLY_WORLD_BIBLE.md route sections updated to match.

---

## §5 Execution order

1. Engine first: FIX-2 (freeze/grid, systemic across three stages), FIX-4 camera + post-process, FIX-1 AI line.
2. FIX-6 slope + surfaces (before rebuilding any geometry, so climbs are tuned against real physics).
3. FIX-3 grounding sweep + FIX-5 colliders.
4. Stage rebuilds to §2 + §4, in order: Glacier Col, Olive Coast, Harvest Run, Citadel Bay — each including WR-7 vegetation and WR-8 bands.
5. FIX-7 falls/recovery on rebuilt geometry.
6. FIX-8 scoring + AI pace last.
7. Full regression: both video routes replayed against every acceptance criterion and §6 checks.

---

## §6 Enforcement

validation.spec.ts (build-time, hard failures): road-corridor clearance; adjacent-slope ≤ 45°; crest-noise check; climb-archetype conformance; lap length / corner density / max straight; grade-effect test (constant-throttle speed falls on ≥ 8% grades); sightline layer check every 50 m; cloud-altitude ≥ 60 m below road; sea-band check on coastal stages; placeholder-material and texture-corruption sweep; shadow-caster audit; texture-frequency cap; AI-waypoints-on-road; prop grounding ≤ 0.15 m; vegetation density per km; T0/T1 tree presence near road; prop-scale bounds; camera twitch harness (angular-velocity reversal > 3 Hz fails) + sky pixel-crawl diff.

Rules without automated checks are verified by scripted flythrough capture reviewed against this document before a stage ships. Performance budget holds throughout: 60 fps mobile Safari; vegetation ≤ 15% frame time; occlusion fade cap 12; ridge layers as baked low-poly silhouettes; cloud sea ≤ 3 planes.

This file changes only by owner directive.

---

## Appendix A — Defect evidence (timestamps)

**R10 Harvest Run:** AI single-file in the ditch 0:18; perpendicular drivers 0:06, 0:21; all cars frozen on grid 0:01–0:04; freeze ineffective at 194 km/h 0:47 vs hard stop 2:10; floating cabin 0:03; floating cube 0:42; floating crates 1:10; detached treeline 1:42; black sky mesh 0:05; car off-screen 0:30–0:35 with unseen collision (182→35 km/h); tree occlusion 0:52–1:12, 1:55–2:07; driver-cam untextured cockpit 0:05, 2:12; canopy driving 1:52–2:06; sideways launches 1:28, 2:00; wheel hover 1:50; stuck at 2 km/h 1:46; CRASH+CLEAN PASS same second 0:17; grounded BIG AIR 1:58; phantom ROCK SHOVED 1:06; 8th→1st in 19 s.

**R11 Glacier Col:** run ended DESTROYED (3 hulls, race not finished, 0 credits); white void beside road 0:16, 1:16–1:24; accelerating uphill 35→123 (0:18–0:24) and 139→201 (1:14–1:24); cliff-fall insta-wreck −300 at 0:36 with camera framing an AI car 0:32; six-car AI blob with clipping 0:52; frozen respawn 0:40; floating white sphere 0:14, white rectangle in sky 0:28, green shards over road 0:56–1:24, black void mesh 1:20; snowmen on grass, zero snow; floating start-gate strip 0:05.

**Olive Coast r384 (screenshots):** start grid in a two-wall trench; sawtooth crest spikes; micro-trees pinned to walls; casterless shadow blobs on road; crest into white void; floating RALLY CO. sign and white cylinder; green pixel corruption on cliff; no olive trees.

**Citadel Bay r379 (screenshot):** full field frozen at t=0 (third stage); frozen opponent overlapping player at spawn; wavy sky artifact lines + chromatic fringing; high-frequency cobble moiré; near-treeless terrain; sea as flat bands; no citadel sighted.
