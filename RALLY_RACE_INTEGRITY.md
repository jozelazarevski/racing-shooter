# RALLY_PATCH_02 — Race Integrity Patch

> FILING NOTE (added by the build, not by the owner): the owner titled this
> document RALLY_PATCH_02. `RALLY_PATCH_02.md` in this repo is a DIFFERENT,
> older document (2026-09-06) that RALLY_MASTER_SPEC.md supersedes entirely
> per its C-01. To avoid overwriting that history, this newer patch is filed
> here under its subject. Cite it as RALLY_PATCH_02 (Race Integrity, R21).

**Status:** NORMATIVE. Subordinate to RALLY_MASTER_SPEC.md. Where this patch tightens a master-spec rule, the tighter rule wins. Where it conflicts, RALLY_MASTER_SPEC.md wins.

**Source:** Full review of gameplay capture R21.MP4 (Falken Ridge, r407, 1 lap, 3:24). All timestamps and values below are observed in that capture.

**Standing constraints honored throughout:** In-race HUD is frozen. No new on-screen elements. No world overlays (route lines, arrows). All fixes in this patch are systems-side or world-geometry-side.

---

## 1. Priority table

| ID | Fix | Priority | Observed failure |
|----|-----|----------|------------------|
| R-FINISH-01 | Finish line must end the race | P0 | Crossed at 3:21.7, gameplay continued past 3:23.7, no results state |
| W-EDGE-01a | Edge containment audit, all drop-off sections | P0 | Off-edge falls at 0:48.5 and 3:19.7 |
| W-EDGE-02 | Finish corridor containment | P0 | Final fall occurred within sight of the finish gate |
| R-RECOVER-01 | Automatic off-track recovery | P0 | Player stuck off-road 0:48 to 0:59 (11 s) at 3 to 13 km/h |
| C-CAM-01 | Camera vegetation occlusion | P0 | Screen majority-foliage at 0:18.7, 0:21.7, 2:09.1 |
| C-CAM-02 | Camera geometry collision | P0 | Camera inside dark backfaces 0:52 to 0:57 |
| C-CAM-03 | Airborne tracking and telemetry | P0 | Car at screen edge, speedo 0 km/h gear N during BIG AIR at 0:33.7 |
| G-DMG-01 | Collision damage caps | P1 | HIT ROCK dealt 33 hull in one touch |
| G-WRECK-01 | Wreck husk lifecycle | P1 | Dead husk blocking racing line at 2:56 |
| W-CURVE-02 | Straight-length cap | P1 | 45 s pinned at 250 km/h, 2:27 to 3:10 |
| G-AI-01 | Rubber-band bounds | P1 | Full pack reachable after 2 min in last; all 6 AI passed in one respawn window |
| W-TEX-01 | Bridge and structure texturing | P1 | Untextured black beams at 0:50.4 |
| P-PERF-01 | Frame-rate budget | P2 | Measured 30 to 33 effective fps, hitches of 50 to 67 ms |

---

## 2. P0 — Race integrity

### R-FINISH-01 — Finish line ends the race

**Rule.** Crossing the finish trigger volume MUST transition the race to a terminal state within 500 ms: input locked (except pause), car auto-decelerates, results presented. The finish trigger MUST be a full-road-width, full-height volume so no vehicle state (airborne, shielded, respawning) can pass through undetected.

**Root-cause check (do first).** The capture shows the player respawning at the gate inside a shield at 3:20.7 (10 km/h), then driving past it at 3:23.7 (128 km/h) with the timer still running. Two candidate causes, test both:
1. Respawn placed the car past the trigger plane, so the crossing never fired.
2. The trigger fires only in a specific state (grounded, unshielded) and the shielded pass was ignored.

**Acceptance.**
- Cross the line in each state: grounded, airborne, drifting, shielded, mid-respawn. Race ends in all five.
- Respawn point nearest the finish MUST be placed at least 30 m before the trigger plane, never past it.
- validation.spec.ts: `finish.trigger.width >= road.width`, `finish.trigger.height >= 3 * vehicle.height`, `respawn[n].distanceToFinish >= 30`.

### W-EDGE-01a — Edge containment audit

**Rule.** W-EDGE-01 (narrow and canyon roads bounded by a mountain edge on at least one side) is extended: any road segment where the terrain beside the road drops more than 2 m within 4 m of the road edge MUST have a physical containment feature on that side along the entire drop. Containment features are world objects (rock lines, berms, timber guardrails like the bridge rails already present at 2:24), never overlays.

**Known violations in Falken Ridge (fix these, then run the audit tool):**
- River gorge section, approx. race-time 0:45 to 1:00 corridor. Player exited left after a rock hit and fell to the riverbed.
- Final approach, approx. 3:15 to finish. Player exited left at speed and fell into the dark pit area visible at 3:19.7.

**Audit tooling.** Add a build-time pass that walks the road spline, samples terrain height 4 m laterally each side every 2 m of road length, and emits a violation list. Wire it into validation.spec.ts so an unbounded drop fails the build. This makes W-EDGE-01a enforceable across all stages, per the master-spec principle that directives apply game-wide.

**Acceptance.** Audit reports zero violations on Falken Ridge. Deliberate ram tests at the two known spots at 250 km/h keep the car recoverable (bounced back or held on a ledge), never in the riverbed.

### W-EDGE-02 — Finish corridor containment

**Rule.** The final 200 m before any finish line MUST be a fully contained corridor: containment on both sides regardless of drop height, no edge rocks (see G-DMG-01), no hazard spawns. The end of a race is decided by racing, not by terrain in the last five seconds.

**Acceptance.** validation.spec.ts: for the last 200 m of spline, `containment.left && containment.right` and `hazards.count == 0`.

### R-RECOVER-01 — Automatic off-track recovery

**Rule.** The game MUST detect an unrecoverable state and reset the car without player action, since no on-screen prompt or countdown is permitted (frozen HUD). Trigger conditions, any one sufficient:
- Off-road AND speed below 25 km/h for 3 continuous seconds.
- Off-road AND lateral distance from road spline above 15 m for 2 seconds.
- Car upside down or resting on its side for 1.5 seconds.
- Car below the road surface elevation by more than 5 m (fell into a gorge or river), immediate.

**Reset behavior.** Teleport to the nearest spline point behind the car's furthest progress, aligned to road direction, at 40 km/h rolling start, with the existing respawn shield (seen at 2:12.2) for 2 s. Reuse the existing SOS pipeline; this is auto-invocation of a system already in the game, not a new system. SOS remains available for manual early reset.

**Cost.** Auto-reset carries the same penalty as SOS (if any) so it cannot be exploited as a free shortcut escape. It MUST NOT cost hull or a life.

**Acceptance.** Reproduce the 0:48 fall: total time from leaving the road to driving again on the road MUST be under 5 s (was 11 s+). Reproduce the 3:19 fall: reset lands the car before the finish trigger, per R-FINISH-01.

### C-CAM-01 — Camera vegetation occlusion

**Rule.** No frame may be majority-occluded by vegetation between camera and car. Implement dithered or alpha fade on any tree or foliage instance intersecting the camera-to-car frustum (a capsule test is sufficient). Fade is a rendering behavior of world objects, not an overlay, so it is within constraints. Given the vegetation directive (many trees, high-poly definition), fading is the correct fix, not thinning the forests.

**Acceptance.** Replay the 0:15 to 0:22 corridor and the 2:09 crash spot: car and at least 20 m of road ahead visible in every frame.

### C-CAM-02 — Camera geometry collision

**Rule.** The camera MUST collide with world geometry: spherecast from car to desired camera position, pull the camera in on hit. Backfaces MUST never render full-screen; if the camera is forced inside geometry for a frame, snap to the nearest valid position rather than showing the interior. The 0:52 to 0:57 sequence (full-screen dark polygons, car invisible) must be impossible.

**Acceptance.** Drive the riverbed under the bridge manually (before W-EDGE-01a lands): car remains visible throughout.

### C-CAM-03 — Airborne tracking and telemetry

**Rule.** During airborne state the camera MUST keep the car inside the central 60 percent of the screen (widen FOV or raise the camera during jumps rather than letting the car drift to the top edge as at 0:33.7). The speedometer MUST display horizontal ground-speed magnitude while airborne, never 0, and the gear indicator MUST hold the last engaged gear, never N, while the throttle is applied.

**Acceptance.** Take the 0:33 jump at full speed: car centered, speedo continuous, gear held.

---

## 3. P1 — Fairness and track flow

### G-DMG-01 — Collision damage caps

**Rule.** Damage from static world objects is capped so that no single touch of scenery can remove more than 15 hull. Sustained scraping caps at 10 hull per second. Vehicle-versus-vehicle and weapon damage are untouched (the combat loop from 2:30 to 3:15 read well and is the fun core).

| Source | Observed | New cap |
|--------|----------|---------|
| Rock, single impact | 33 | 15 |
| Tree, single impact | approx. 20 to 38 (0:09 to 0:12 and 1:09 to 1:12 windows) | 15 |
| Scenery scrape, per second | unknown | 10 |
| Weapons, ramming | as shipped | unchanged |

**Placement rule.** High-damage rocks MUST NOT be placed within 1.5 m of the drivable road edge on the outside of curves or anywhere in the finish corridor (W-EDGE-02). A rock at the apex exit is a skill test; a rock that launches you off an unbounded edge (0:48) is a trap.

### G-WRECK-01 — Wreck husk lifecycle

**Rule.** A destroyed vehicle husk on the road (2:56) becomes non-solid to players after 4 s and despawns after 10 s with a smoke-out effect. Husks never persist as full-strength collision obstacles on the racing line.

### W-CURVE-02 — Straight-length cap

**Rule.** Extends the existing curve directives: no road segment may hold the car at top speed with zero steering input for more than 12 s. The 2:27 to 3:10 straight (approx. 45 s pinned at 250) MUST be broken with at least three curvature events (sweepers, crests, an S) while keeping the downhill character, consistent with the steepness-affects-speed directive. Apply to all similar stages per the master spec.

**Acceptance.** Bot drive with locked-straight input: goes off-road or must brake within 12 s on every segment of every stage. Add as a validation.spec.ts spline check: no spline window of 12 s at v_max with curvature below threshold.

### G-AI-01 — Rubber-band bounds

**Rule.** Rubber-banding MUST be bounded in both directions:
- Behind the player: AI ahead slow by at most 8 percent of base pace. The full pack MUST NOT bunch into a 10-second window for a player who has been last for 2 minutes (as observed at 2:30 to 3:00). Comebacks should be possible, not guaranteed.
- Ahead of the player: during the player's respawn window, AI within 100 m MUST NOT gain more than one position each. The observed 2nd-to-8th swing in a single respawn (3:17 to 3:21) reads as random, and position changes the player did not cause destroy trust in the standings.

**Acceptance.** Scripted run: idle in last place for 90 s, then drive clean; finishing position lands 5th to 7th, not 1st to 2nd. Scripted death in 2nd with the pack 3 s behind: respawn position 3rd or 4th, never 8th.

### W-TEX-01 — Bridge and structure texturing

**Rule.** The bridge at the 0:50 river crossing renders as untextured near-black beams, violating the no-placeholder-geometry rule in RALLY_MASTER_SPEC.md. All structures MUST use the timber material set already present on the guardrail bridge at 2:24. Run a material audit for pure-black or default-material meshes across all stages and fail the asset validator on hits.

---

## 4. P2 — Performance

### P-PERF-01 — Frame-rate budget

**Measured.** Effective render rate 30 to 33 fps with hitches of 50 to 67 ms (frame-duplication analysis of the 120 fps capture at two segments, 1:40 and 2:30). At 250 km/h, 30 fps costs reaction distance and reads as jitter, adjacent to the no-screen-twitching directive.

**Target.** 60 fps sustained on the capture device class, no hitch above 33 ms.

**Order of attack (measure between each step, stop when target met):**
1. Instance all vegetation (InstancedMesh per tree species). The tree density directive makes per-mesh draw calls the prime suspect.
2. Two LOD tiers for trees: high-poly inside 60 m (honors the high-poly vegetation directive where it is visible), simplified beyond.
3. Frustum-plus-distance culling on scenery; the big mountain vistas (1:57) should be single low-cost backdrops.
4. Audit per-frame allocations in the game loop (Rapier body churn, Howler instances); the 50 to 67 ms spikes pattern like GC pauses.
5. Cap pixel ratio at 2 on high-DPI phones.

**Acceptance.** Repeat the frame-duplication measurement on a new capture of the same stage: at least 55 unique fps, longest freeze under 4 frames at 120 fps capture.

---

## 5. Explicitly out of scope

- Any HUD change, including toast positioning, SOS button size or placement, and any countdown or prompt for R-RECOVER-01. HUD is frozen as shipped.
- Route lines, arrows, or braking markers of any kind. Corner readability MUST come from world design: scenery framing, tree lines tightening into curves, and containment features acting as natural signposts.
- Weapon and combat balance. The 2:30 to 3:15 combat sequence is the strongest part of the run.

## 6. Build order

1. R-FINISH-01 (single-day fix, highest player-facing payoff)
2. R-RECOVER-01 (reuses SOS pipeline)
3. W-EDGE-01a audit tool, then Falken Ridge fixes, then W-EDGE-02
4. C-CAM-01/02/03 as one camera work package
5. G-DMG-01, G-WRECK-01, G-AI-01 tuning pass
6. W-CURVE-02 track rework, W-TEX-01 material audit
7. P-PERF-01

Ship 1 through 4 together as the race-integrity release. A playtester must be able to fall off, recover in under 5 s, finish the race, and see a results screen before anything in sections 3 or 4 lands.
