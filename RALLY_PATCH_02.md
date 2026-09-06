# RALLY_PATCH_02.md — Repair + Track Directive v3

**Status:** NORMATIVE. Supersedes v1 and v2 in full.
**Authority hierarchy:** RALLY_RULES.md > RALLY_WORLD_BIBLE.md > RALLY_PATCH_02.md (this file) > RALLY_PATCH_01.md > RALLY_SYSTEMS.md.
**Evidence:** R10.MP4 (Harvest Run, 2:21) and R11.MP4 (Glacier Col, 2:14, ended DESTROYED: 3 hulls spent, race not finished, 0 credits). Two-pass frame analysis with zoom verification on both.

## 0. Constraints (amended 2026-09-06 by owner directive)

| ID | Constraint |
|---|---|
| C-1 | In-race HUD frozen as shipped. No element added, removed, moved, restyled, resized. |
| C-2 | No new on-screen elements. No world overlays (route lines, arrows, markers). Delete any that exist. |
| C-3 | World stays fully drivable. No invisible walls or kill zones. Physical guardrails are permitted where they already exist as a world element and MUST be breakable. |
| C-4 | AMENDED: world and track content changes are authorized (track geometry, length, curvature, mountains, snow, scenery bands, valley composition). Repair-only restriction lifted for world/track scope. HUD (C-1) and overlay (C-2) restrictions unchanged. |

## PART I — Cross-stage defects (evidence from both videos)

### Cluster A — AI opponents

| ID | Evidence | Defect | Root cause |
|---|---|---|---|
| A-1 | R10 0:18 (zoom-verified) | Four opponents single-file in the ditch beside an empty road on curves | AI spline laterally offset from road mesh ~1 road-width on curves; AI grinds off-road drag all lap |
| A-2 | R10 0:06, 0:21 | Cars driving perpendicular to track | Heading snap at waypoint joins |
| A-3 | R10 0:01–0:04; R11 0:05 | All cars incl. player frozen in ice on the grid; opponents overlapping/interpenetrating | Countdown lock implemented as freeze debuff at t=0; spawn slots collapsed |
| A-4 | R10 0:47 vs 2:10; R11 0:40 respawn | Freeze inconsistent: no effect at 194 km/h, hard stop elsewhere, respawn delivers player frozen at 12 km/h | Two freeze code paths; respawn applies freeze |
| A-5 | R11 0:52 | Six AI in one touching blob, bodies clipping; position oscillates 8th→2nd→1st in 4 s | No AI-AI separation/avoidance; convoy target spacing 0 |

### Cluster B — Object grounding (levitation)

| ID | Evidence | Defect |
|---|---|---|
| B-1 | R10 0:03 | Cabin floating above hillside |
| B-2 | R10 0:42, 1:10; R11 1:14 | Cubes and crates hovering mid-air |
| B-3 | R10 1:42 | Distant treeline detached above dune (LOD seam) |
| B-4 | R10 0:05; R11 1:20 | Black unlit meshes hanging in sky/void |
| B-5 | R11 0:14, 0:28, 0:56–1:24 | Floating white sphere; white untextured rectangle in sky; persistent translucent green shards hovering over road |
| B-6 | R11 0:05 | Start gate is a thin checkered strip floating above the road, not a grounded arch |

Root causes: props placed without terrain raycast; LOD without skirts; unlit distant meshes; orphaned billboard/decal planes (green shards, white rectangle) with broken transforms.

### Cluster C — Camera and rendering

| ID | Evidence | Defect |
|---|---|---|
| C-A | R10 0:05, 2:12 | Driver cam: 60% of portrait frame is untextured gray/black/raw-orange cockpit mesh |
| C-B | R10 0:30–0:35, 1:07; R11 0:03 | Car fully off-screen for 4–6 s stretches; unseen collision at 182 km/h |
| C-C | R10 0:52–1:12, 1:55–2:07 | Screen 70–100% blocked by tree geometry up to 12 s |
| C-D | R11 0:32–0:34 | During the cliff fall the camera frames an AI car, not the player |
| C-E | R10 2:16; both | Overexposure to near-white; blown horizons |

### Cluster D — Player physics

| ID | Evidence | Defect |
|---|---|---|
| D-A | R10 1:52–2:06 | Car drives on tree canopy (cone colliders act as ramps) |
| D-B | R10 1:28, 2:00 | Spontaneous sideways launches on flat ground |
| D-C | R10 1:50 | Car hovers with daylight under all wheels |
| D-D | R10 1:46; R11 falls | No stuck recovery; cliff fall = instant −300 wreck |
| D-E | R10 all; R11 climb | Off-road speed = road speed; **no slope physics: 139→201 km/h accelerating up a steep grade (R11 1:14–1:24), 35→123 uphill (0:18–0:24)** |

### Cluster E — Scoring validity

CRASH+CLEAN PASS same second (R10 0:17); BIG AIR grounded (R10 1:58); ROCK SHOVED CLEAR with no rock (R10 1:06); CLEAN PASS while alone (R10 2:16); score/position jitter both runs.

## PART II — Fixes (execution order in §4)

### FIX-1 (A-1, A-2): AI racing line — P0
Rebuild AI path from road mesh centerline, 5 m samples, raycast-validated on-road. Per-AI lateral offset ±1.5 m clamped inside road bounds, shrinking with curvature. Max heading delta 25°/segment. validation.spec.ts: any off-road waypoint fails the stage.
**Accept:** zero AI off-road in a clean lap except combat knock-offs.

### FIX-2 (A-3, A-4, A-5): Grid, freeze, separation — P0
Countdown = input lock, never freeze debuff; clear all statuses at green. Grid 6 m × 3 m, 2 columns, assert non-overlap. Freeze = 40 km/h cap, ≤ 3 s, one code path; respawn never applies freeze. AI-AI separation: min 2.5 m following distance, lateral avoidance steering; convoy spacing target 8–25 m staggered.
**Accept:** clean grid start; no interpenetration in 20 laps; field spreads within 30 s.

### FIX-3 (B-1..B-6): Grounding sweep — P0
Terrain-raycast snap for every static prop at load (base gap ≤ 0.15 m validation). Pickups hover ≤ 0.5 m terrain-relative. LOD skirts for distant treelines. Distant meshes lit, bases below horizon. Delete orphaned billboard planes (green shards, white rectangle, white sphere) — trace their spawner and fix or remove. Start gate: grounded arch posts on both verges.
**Accept:** replay of every Part I B timestamp shows grounded objects; zero floating shards over any road.

### FIX-4 (C-A..C-E): Camera package — P0
Driver cam: lit textured cockpit ≤ 20% of frame or remove DRIVER from cycle. Chase: occlusion sphere-cast with foliage fade (0.15 opacity, 120 ms, cap 12), terrain pull-in, camera ≥ 1.2 m above heightfield. Framing guarantee: vehicle inside central 60% of viewport, snap after 200 ms; camera target is ALWAYS the player vehicle, including falls and wreck cinematics. Exposure: fog luminance ≤ 0.85, ≤ 90% pixels above 0.9.
**Accept:** vehicle visible ≥ 95% of frames on both R10 and R11 routes; player framed throughout a forced cliff fall.

### FIX-5 (D-A..D-C): Colliders and pops — P1
Trunk capsules (r 0.35 m) replace cone colliders; canopy non-collidable. CCD + raised contact offset on vehicle body. Wheel visual/raycast alignment: rest gap ≤ 0.02 m.
**Accept:** no canopy mounting, no spontaneous launches in 20 laps, no hover.

### FIX-6 (D-E): Surface AND slope physics — P1
Surfaces: road 1.00/1.00/1.00; grass 0.85/0.72/1.35; sand 0.80/0.65/1.55; snow 0.75/0.85/1.15 (grip/top-speed/drag), 0.4 s lerp.
**Slope:** longitudinal gravity in the powertrain: available acceleration = engine acceleration − g·sin(θ) − drag. Normative outcomes: at 10% uphill grade, top speed −25% and acceleration −35% vs flat; at 10% downhill, +15% top speed with engine braking; the car MUST decelerate when grade demand exceeds engine power. No stage may permit gaining speed up a sustained ≥ 8% climb at full throttle above 80% of flat top speed.
**Accept:** R11 climb replay shows monotonic speed loss on the 1:14–1:24 grade at constant throttle.

### FIX-7 (D-D): Falls, wrecks, recovery — P1
Cliff fall: −1 hull retained, respawn on road, unfrozen, 3 s invulnerability, camera on player throughout. Stuck detection (< 8 km/h, 6 s, throttle > 0.5, or roll/pitch > 75° for 3 s) auto-invokes existing SOS respawn, 15 s cooldown. Continuous breakable guardrail on any drop > 15 m (C-3-compliant: breakable).
**Accept:** R11's three-wreck DESTROYED outcome is unreachable by terrain alone in a normal run.

### FIX-8 (E-*): Scoring validity — P2
CLEAN PASS: opponent within 6 m/15 m, both on-road, no contact ±1.5 s. BIG AIR: all wheels off ≥ 0.7 s, clean landing, ≤ 20 m from road spline. ROCK SHOVED CLEAR: requires rock-collider contact. AI pace (apply LAST, after FIX-1 and FIX-6): leaders 96% / mid 90% / tail 85% of player top speed; rubber-bands +8% (> 150 m behind) / −5% (> 250 m ahead).

## PART III — Track Design Directive (owner-ordered, applies to ALL rally stages)

Applies to every stage in the rally class: Harvest Run, Glacier Col, Alpine Pass, Old Town Night (when built), and any future stage. Existing stages are rebuilt to this spec; RALLY_WORLD_BIBLE.md route sections are updated to match.

### TD-1: Length and curvature

| Parameter | Current (observed) | Normative target |
|---|---|---|
| Lap length | ~2.0–2.5 km (est.) | 4.5 km minimum, 5.5 km target |
| Corner density | long 10+ s straights | ≥ 7 corners per km |
| Max straight | > 600 m | 300 m |
| Hairpins per lap (R 12–20 m) | 0 observed | ≥ 2, stacked on climbs |
| Medium corners per lap (R 30–60 m) | few | ≥ 6 |
| Sweepers (R 80–150 m) | some | ≥ 4 |
| Chicanes per lap | 0 | ≥ 1 |
| Sustained grades | present, no effect | 6–12%, with crests; slope physics per FIX-6 |

Corner sequencing MUST alternate direction at least every 3 corners; no more than 2 identical-radius corners in a row.

### TD-2: Valley and mountain composition
1. Every stage gets layered mountain massifs on BOTH sides of the route: 2–3 ridge layers at 300–1500 m, peaks rising above the road's visual horizon from all road positions. The road is never the highest visible geometry.
2. Cloud sea: permitted only as a layer ≥ 60 m BELOW road edge, only in the high-altitude band, rendered as soft layered planes with depth fade. A flat white plane beside or level with the road is prohibited. The void sections at R11 0:16 and 1:16–1:24 are the reference violation.
3. Valley floors exist and are visible from edges: terrain, forest carpet, or cloud sea per rule 2 — never untextured void.

### TD-3: Altitude scenery bands (change of scenery per climb)
| Band (of stage max altitude) | Scenery |
|---|---|
| 0–40% | Valley: dense forest, cabins, meadows (stage-themed) |
| 40–70% | Treeline: thinning trees, exposed rock, patchy snow on verges |
| 70–100% | Full snow: snow albedo on shoulders and terrain, snow-dusted trees, snow surface physics (FIX-6), existing snowman props relocated here |

Glacier Col MUST reach band 3 (it is named for a glacier and currently shows zero snow while snowman props sit on grass). Harvest Run may cap at band 2 rock/autumn transition. Band transitions blend over ≥ 150 m of route.

### TD-4: Validation
validation.spec.ts gains: lap-length ≥ 4500 m; corner-density ≥ 7/km; max-straight ≤ 300 m; grade-effect test (constant-throttle speed must fall on ≥ 8% grades); cloud-plane altitude check (≥ 60 m below nearest road edge); band-coverage check per stage.

## 4. Execution order
1. FIX-1 AI line + FIX-2 grid/freeze/separation
2. FIX-3 grounding + FIX-4 camera package
3. FIX-6 slope + surfaces (before any track rebuild, so new geometry is tuned against real physics)
4. PART III track rebuild: Glacier Col first (worst offender), then Harvest Run, applying TD-1/2/3 to both
5. FIX-5 colliders, FIX-7 falls/recovery on the rebuilt tracks
6. FIX-8 scoring + AI pace last
7. Full regression on rebuilt stages against every acceptance criterion and TD-4 checks

## 5. Regression guards
60 fps mobile Safari budget holds: ridge layers are low-poly silhouettes with baked lighting; cloud sea max 3 planes; trunk capsules static and batched; occlusion fade cap 12. No HUD-module file in the diff (C-1). No overlays introduced by the track rebuild (C-2).
