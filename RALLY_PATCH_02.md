# RALLY_PATCH_02.md — Repair Patch v2: AI Line, Grounding, Camera, Physics

**Status:** NORMATIVE. Supersedes v1 of this document in full.
**Authority hierarchy:** RALLY_RULES.md > RALLY_WORLD_BIBLE.md > RALLY_PATCH_02.md (this file) > RALLY_PATCH_01.md > RALLY_SYSTEMS.md. On conflict, the higher document wins.
**Evidence:** R10.MP4, 2:21 run, stage "Harvest Run", seed r379, iPhone Safari portrait. Two analysis passes: 35-frame survey + 71-frame scan with zoom verification.

## 0. Frozen constraints (MUST NOT violate)

| ID | Constraint |
|---|---|
| C-1 | In-race HUD frozen as shipped. No element added, removed, moved, restyled, resized. |
| C-2 | No new on-screen elements. No world overlays (route lines, arrows, markers). Delete any that exist. |
| C-3 | World stays fully drivable. No fences, invisible walls, kill zones, or forced respawn for leaving the road. |
| C-4 | Repair-only. Tuning, fixing, material repair in scope. New content systems out of scope. |

## 1. Defect register

### Cluster A — AI opponents (the race is not a race)

| ID | t | Observed | Root cause |
|---|---|---|---|
| A-1 | 0:18 (verified zoom) | Four opponents drive single-file in the ditch beside an empty road on a right curve | AI waypoint spline laterally offset from road mesh by ~1 road-width on curves. Opponents grind off-road drag + trees all lap: explains slow pace, invisibility after 0:30, player P1 while stuck at 2 km/h |
| A-2 | 0:06, 0:21 | One car crosses the track perpendicular at the finish gate; another drives perpendicular into forest | Spline discontinuity / heading snap at waypoint joins |
| A-3 | 0:01–0:04 | All 8 cars including player encased in ice on the grid; five opponents overlapping, two pairs interpenetrating | (a) Freeze status applied globally at t=0, likely countdown lock implemented as freeze debuff; (b) grid spawn slots collapsed |
| A-4 | 0:47 vs 2:10 | Player frozen at 194 km/h (no effect) vs frozen to a standstill | Freeze semantics inconsistent: VFX-only in one path, hard stop in another |

### Cluster B — Object grounding (levitation)

| ID | t | Observed |
|---|---|---|
| B-1 | 0:03 | Cabin floats above hillside, visible gap under base |
| B-2 | 0:42 | Green cube hovering mid-air at terrain edge |
| B-3 | 1:10 | Supply crates hovering at various heights off road right |
| B-4 | 1:42 | Distant treeline floats above dune with hard gap (terrain LOD seam) |
| B-5 | 0:05–0:07 | Black unlit mountain silhouette hanging in sky above horizon, clouds beneath it |

Root causes: props placed at authored Y without terrain-height raycast on sloped ground; far terrain LOD lacks skirts so treelines detach; distant mountain mesh unlit (renders black) and positioned above the far-plane fog cut.

### Cluster C — Camera and rendering

| ID | t | Observed | Root cause |
|---|---|---|---|
| C-A | 0:05–0:07, 2:12–2:20 | DRIVER camera: 60% of portrait frame is raw untextured cockpit geometry (gray band, black planes, raw orange hood) | Cockpit mesh has no material/lighting; driver cam framing not adapted to portrait |
| C-B | 0:30–0:35, 0:43, 1:07, 1:44 | 4–6 s stretches of blank terrain, car fully off-screen at 143–214 km/h; unseen collision at 0:33 (182→35 km/h) | No framing guarantee on slope transitions; TRAIL anchor drift |
| C-C | 0:52–1:12, 1:55–2:07 | Screen 70–100% tree geometry up to 12 s continuous | No occlusion fade, no camera collision |
| C-D | 2:16 | Scene overexposed to near white in driver cam; desert horizon blown white throughout | Exposure/fog luminance unclamped |

### Cluster D — Player physics

| ID | t | Observed | Root cause |
|---|---|---|---|
| D-A | 1:52–2:06 | Car drives on top of tree canopy; "HIT ROCK −15" while on treetops | Tree colliders are the full foliage cone acting as ramps; trunks not distinctly collidable |
| D-B | 1:28, 2:00 | Spontaneous sideways launches, all wheels airborne, no ramp (once at 11 km/h) | Collider edge pops on terrain facet seams + cone collider edges; contact offset too small |
| D-C | 1:50 | Car hovers with daylight under all four wheels on flat sand | Suspension/visual wheel offset mismatch vs collision height |
| D-D | 1:46–1:48 | Wedged nose-up on dune at 3 km/h, no recovery | No stuck detection wired to existing SOS respawn |
| D-E | 0:12–1:43 | 202–222 km/h sustained on forest floor and sand | Surface grip/drag undifferentiated |

### Cluster E — Scoring validity

| ID | t | Observed |
|---|---|---|
| E-1 | 0:17 | "CRASH −19 HULL" and "CLEAN PASS +38" in the same second |
| E-2 | 1:58 | "BIG AIR +50" with wheels on ground; also awarded mid-forest scramble |
| E-3 | 1:06, 1:30 | "ROCK SHOVED CLEAR" with no rock visible, deep in forest |
| E-4 | 2:16 | "CLEAN PASS +38" while alone off-road in driver cam |

## 2. Fix specifications

### FIX-1 (A-1, A-2): AI racing line — P0, do this first

1. Rebuild the AI path from the road mesh itself: sample the road centerline at 5 m intervals; every waypoint MUST lie on the road surface (raycast-validated at build time).
2. Per-AI lateral offset from centerline: random in ±1.5 m, clamped so the full car width stays inside road bounds.
3. Curve handling: offsets shrink toward 0 as curvature rises; no waypoint heading delta > 25° per segment (kills the perpendicular drivers).
4. Build-time check in validation.spec.ts: every AI waypoint within road bounds or the stage fails.

**Acceptance:** Top-down replay of the 0:18 curve shows all AI on the road surface. Zero AI off-road during a clean lap except when knocked off by combat.

### FIX-2 (A-3, A-4): Start grid and freeze semantics — P0

1. Countdown lock MUST be an input lock, not the freeze status effect. Clear all status effects on every car at green light. No freeze VFX on the grid.
2. Grid spawn: 6 m longitudinal, 3 m lateral, 2 columns, zero overlap; assert non-intersecting spawn AABBs.
3. Freeze status, one semantic everywhere: caps speed at 40 km/h for its duration, always shows VFX, always expires ≤ 3 s. Never VFX-only, never a hard stop from speed.

**Acceptance:** Race start shows 8 unfrozen cars in a proper grid. A frozen car at speed visibly decelerates to ≤ 40 km/h within 1 s.

### FIX-3 (B-1..B-5): Object grounding — P0

1. Placement pass: every prop (buildings, crates, cubes, signs, cones, rocks) snaps at load to terrain height at its XZ via raycast, plus per-type embed offset (buildings −0.05 m, crates 0). Slopes: align to surface normal up to 20°, else embed base.
2. Pickup crates: if intentionally floating as pickups, max hover 0.5 m above terrain, terrain-relative. The crates at 1:10 exceed this; clamp them.
3. Terrain LOD: add skirt geometry (or bias LOD morph) so distant tree rows never detach from the ground plane (1:42 seam).
4. Distant mountains: assign the lit stylized material used by near terrain (flat-shaded is fine, black is not) and lower them until bases sit below the visible horizon line from all road positions.
5. Build-time check: any static prop whose base is > 0.15 m above terrain fails validation.

**Acceptance:** Replay of 0:03, 0:42, 1:10, 1:42 positions shows every object grounded (or crates ≤ 0.5 m); no black shapes above the horizon.

### FIX-4 (C-A): Driver camera repair — P0

1. Assign the cockpit/hood mesh a lit, textured material consistent with the car body. Raw gray/black/unlit is prohibited.
2. Portrait framing: cockpit geometry MUST occupy ≤ 20% of frame height. Raise/pitch the driver cam or hide the dash mesh in portrait until true.
3. If neither is achievable this patch, remove DRIVER from the camera cycle (existing control, no HUD change) until repaired.

**Acceptance:** Driver cam at 0:05 and 2:12 positions shows ≥ 80% world, zero untextured surfaces.

### FIX-5 (C-B, C-C): Chase camera guarantees — P0

1. Sphere-cast (r = 0.4 m) camera target → camera each frame. Foliage in the cast fades to opacity 0.15 in 120 ms (dither preferred), restores in 250 ms; cap fade set at 12 trees.
2. Terrain/rock hits: pull camera in to hit point −0.5 m at ≤ 8 m/s, recover at 3 m/s. Never fade terrain.
3. Camera Y clamped ≥ 1.2 m above terrain heightfield, all modes.
4. Framing guarantee: vehicle bounding-sphere center inside central 60% of viewport; blend at ≤ 90°/s; snap after 200 ms violation. TRAIL re-anchors to vehicle transform or is removed from the cycle.

**Acceptance:** Vehicle visible ≥ 95% of frames replaying 0:30–0:35 and 1:55–2:07; never off-screen > 200 ms.

### FIX-6 (D-A, D-B, D-C): Tree colliders and physics pops — P1

1. Remove all foliage-cone colliders. Trees ≥ 2 m get one static trunk capsule, r = 0.35 m, trunk height only. Canopy is non-collidable. (Kills treetop driving and cone-edge launches.)
2. Trunk impact ≥ 60 km/h: existing debris-hit damage path, −40% speed.
3. Raise physics contact offset / use continuous collision detection for the vehicle body to stop terrain-seam pops (1:28, 2:00 launches).
4. Align visual wheel rest position with suspension raycast contact: at rest on flat ground, tire-to-ground gap ≤ 0.02 m (fixes the 1:50 hover).

**Acceptance:** Car cannot mount a canopy; 20 laps produce zero spontaneous airborne events on flat ground; no visible gap under wheels.

### FIX-7 (D-E): Surface differentiation — P1

| Surface | Grip | Top speed | Drag |
|---|---|---|---|
| Road | 1.00 | 1.00 | 1.00 |
| Grass/forest floor | 0.85 | 0.72 | 1.35 |
| Open sand | 0.80 | 0.65 | 1.55 |

0.4 s lerp between states. This is the C-3-compliant substitute for fences: off-road drivable, honestly slower. Tune AI pace AFTER this and after FIX-1, since AI currently loses most pace to off-road grinding.

**AI pace (apply last):** leaders 96% of player top speed, midfield 90%, tail 85%; forward rubber-band +8% beyond 150 m behind (decay to 0 at 40 m); reverse −5% beyond 250 m ahead (decay at 100 m).

**Acceptance:** Clean on-road run reaches P1 no earlier than 60 s. Leaving the road > 20 s costs ≥ 1 position. ≥ 1 opponent on screen ≥ 30% of an on-road lap.

### FIX-8 (D-D): Stuck recovery — P1

1. Stuck = speed < 8 km/h for 6 s with throttle > 0.5, OR roll/pitch > 75° for 3 s.
2. Auto-invoke existing SOS respawn routine. No new UI (C-1, C-2). 15 s cooldown.

**Acceptance:** The 1:46 dune wedge self-resolves within 7 s.

### FIX-9 (E-1..E-4): Scoring validity — P2

1. CLEAN PASS: opponent within 6 m lateral / 15 m longitudinal at pass moment, both on-road, no contact ±1.5 s. A crash in the same window voids it.
2. BIG AIR: all wheels off-ground ≥ 0.7 s, clean landing, within 20 m of road spline. Ground contact at award time = bug; assert against it.
3. ROCK SHOVED CLEAR: requires actual rock-collider contact event.

**Acceptance:** Zero awards replaying the 0:17 crash-pass, 1:58 grounded big-air, 1:06 phantom rock.

### FIX-10 (C-D): Exposure and fog — P2

1. Fog luminance ceiling 0.85; 3 s blends across region boundaries.
2. Tonemap clamp: no region renders > 90% of pixels above 0.9 luminance (fixes blown desert and 2:16 whiteout).
3. Anisotropic ×8 on terrain albedo; road base −12% brightness, rut normals +25% so the road reads at 150 m without overlays (C-2).

## 3. Execution order

1. FIX-1 AI line + FIX-2 grid/freeze (turns it into a race)
2. FIX-3 grounding + validator rules
3. FIX-4 driver cam + FIX-5 chase cam
4. FIX-6 colliders/physics, FIX-7 surfaces then AI pace, FIX-8 stuck
5. FIX-9 scoring, FIX-10 exposure
6. Full R10-route regression against every acceptance criterion

## 4. Regression guards

- 60 fps mobile Safari budget holds: trunk capsules are static and batched; occlusion fade capped at 12.
- validation.spec.ts gains: AI-waypoints-on-road, prop-grounding (≤ 0.15 m), material-resolution (no unlit/untextured), fog-luminance ceiling.
- No HUD-module file may appear in the diff (C-1).
