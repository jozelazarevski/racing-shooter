# CLAUDE.md
## Ignite Rally, working spec for Claude Code

Version 2.3. Supersedes 2.2. Fourth pass on recording F (full-res crops of the status band and the far field): progress metric frozen, field-wide stall, floating building foundations, traffic blocking rivals. Third pass on recording F at 1 fps full resolution: pickups inside terrain, wet state toggling on grass, respawn velocity inconsistent, drop edges unreadable in daylight, regen numbers recorded. One earlier claim corrected (3.6 note). Evidence base: six recorded races, builds r293 to r31x (ledger in Appendix A).

AUTHORITY: RALLY_RULES.md (race outcomes) > RALLY_DRIVING.md (vehicle physics constants) > this file > code. Tables win over prose. MUST / MUST NOT / SHOULD are binding (RFC 2119). Every tuning number lives in `driving.json`; a literal in `.ts` is a bug.

STANDING DECISIONS (owner, do not reopen):
1. The world is fully drivable. No invisible walls, no rule-based speed caps, no return forces. Containment is physics (slope, surface, gravity, terrain collision) and race structure (gates).
2. Repair only. No new on-screen elements, no world overlays. The r297 yellow centreline and rival arrows are erased with no replacement.
3. The in-race HUD is frozen exactly as shipped in recording E. Nothing moves, resizes, restyles or is removed. Toast behaviour (when they fire) may change; toast appearance may not.

---

### 0. Working rules for Claude Code sessions

1. **One system per build.** Physics, AI, stage rules, race systems, rendering: never two in one change-set.
2. **Delete means delete.** A removed element has no render call, no asset reference, no CSS. Restyling is not removal (the r296 marquee).
3. **A fix that failed twice has a second code path.** Fix 8 survived two builds; damage bypassed PROP colliders. Search every emitter before touching the first one again.
4. **Prove with the race log.** Every build gate in §12 is a query in §13. A build is done when its queries pass on one scripted run and one hand-driven run per affected stage.
5. **Constants audit after every build:** `grep -rn "[0-9]\." src/physics src/ai src/race src/stage` and move anything behavioural to `driving.json`.
6. **Base model semantics of RALLY_DRIVING.md are untouched** except where §3 says so (slope grip, landing assist, fall handling).

---

### 1. Current state

Verified working: telemetry with Copy race log; grid weapon and damage lock; impact-speed contact damage on both collider paths; smash and shove props with score; wet-road modifier; spawn shield; home-screen prompt; chase view on road; grid clear of trucks; countdown; driving feel (corners 48 to 90 km/h in streets, sharp response, drift marks).

Open, in priority order. Each row is a repair of observed behaviour.

| # | Fault | Sev | Section |
|---|---|---|---|
| 1 | Car falls THROUGH terrain on steep faces (single-sided trimesh, raycasts start inside); hangs on 60 to 70[deg] walls; 30 to 40 m falls cost nothing; camera inside the mountain | HIGH | 3.1 to 3.4 |
| 2 | Rivals travel as one pack, pile up at the finish, drive off at hairpins and never recover (5 to 6 parked on grass for 20+ s) | HIGH | 5 |
| 3 | Stage layout faults repeat per world: corner directly after the finish gate, nitro pickup on the finish straight or a cliff hairpin, obstacle rocks in streets, huts and rails on the apex, tunnels below camera clearance | HIGH | 7, 8, 9 |
| 4 | Camera auto-switches on nitro, in tunnels and plazas; enters buildings and walls | HIGH | 6.4 |
| 5 | Nitro reaches 205 to 213 in streets built for 140 | HIGH | 6.3 |
| 6 | Off-road surface per world is inconsistent: grass at road grip on Pikes Peak and r294 Glacier Col, tar pit on r297 Spa, under-floor on Cliff Knot. Splat map missing on some worlds; waterfall decals read as wet surface | HIGH | 3.5, 7.6 |
| 7 | Position display flaps in a pack; pinned 8th while five rivals sit stationary; kills do not change position | HIGH | 6.1, 6.6 |
| 8 | Recovery: stuck timer ~4 to 5 s and creep-defeatable; respawn ignores tangent heading and 40 km/h; three unrelated recovery systems; SOS ration | MED | 3.6 |
| 9 | Status toast spam (WET TIRES every 0.3 to 0.7 s) | MED | 6.5 |
| 10 | Kicker landing zones contain obstacle rocks | MED | 7.3 |
| 11 | Frame drops in town stages (auto-quality step) | MED | 6.7 |
| 12 | Driver's view renders 45% black | MED | 6.8 |
| 13 | Dusk stages: obstacles unreadable | MED | 7.9 |
| 14 | Real names in stage data: Spa-Francorchamps, Silverstone, Monaco, Suzuka, Pikes Peak | MED | 7.10 |
| 15 | Lap counter starts at 0; checkpoint marquee on first crossing (not seen in E or F; verify closed) | LOW | 6.1 |

---

### 2. Module map

| Module | Owns |
|---|---|
| `stage/terrain.ts` | Heightfield terrain collider, closed trimeshes for overhangs and tunnels |
| `stage/route.ts` | Gates, course polyline (internal, never rendered), per-segment corner speeds |
| `stage/surfaces.ts` | Splat-map sampling per wheel contact, global surface table |
| `stage/props.ts` | Prop classes, placement validator |
| `stage/generator.ts` | Template-driven world build, §8 |
| `tools/validate.ts` | §7 rules; release build refuses a failing world |
| `physics/vehicle.ts` | RALLY_DRIVING model, slope grip, landing assist, fall handling, below-terrain watchdog |
| `race/state.ts` | GRID, LAUNCH, RACING, FINISH |
| `race/progress.ts` | Progress metric, position, laps, gate passage |
| `race/recovery.ts` | Single `returnToGate` for players and rivals |
| `ai/personality.ts`, `ai/racecraft.ts`, `ai/combat.ts` | §5 |
| `telemetry.ts` | Event stream, Copy race log |

---

### 3. Physics containment (the world contains the car because the world is physical)

**3.1 Terrain collider.** Every world's terrain MUST be a Rapier heightfield. Heightfields are hit from either side and cannot be tunnelled by a raycast vehicle. Overhangs, tunnels, arches and bridge undersides that a heightfield cannot express are separate closed trimeshes. Validator rule.

**3.2 Below-terrain watchdog.** Each tick: if the chassis origin is more than 1.0 m below `terrainHeight(x, z)` or inside any closed collider, `returnToGate(lastPassed)` immediately, reason `void`. This is the safety net; its firing in a release log is logged as a failure of 3.1.

**3.3 Slope grip.** Per wheel, in the force step: mu_eff *= cos(slope); drive force -= sin(slope)*m*g*wheelShare. Above `maxClimbDeg` = 35[deg] the wheel produces no drive and its lateral grip decays to 0 over 0.5 s, so the car slides down instead of hanging.

**3.4 Fall handling.** Airborne with vertical drop > `fatalDropM` = 12 m from the last ground contact -> `returnToGate(lastPassed)` at the apex, no landing. Under 12 m: land, damage = 0.9 * max(0, vVertical - 6) hull, cap 30. Water deeper than 1.2 m -> return. Camera probe MUST run while airborne and on any slope > 35[deg], clamping against terrain from the car outward.

**3.5 Surfaces.** Surface ID from the world's splat map at each wheel contact; multipliers from RALLY_DRIVING §7.2; the surface table is global so grass behaves identically on every world. Both bounds binding on every flat drivable surface: top speed 55 to 75% of road top speed AND 0 to 30 km/h in under 3.0 s. Waterfall streaks and similar are decals, never surface IDs; wet state comes only from the stage weather flag or the wet-tyre pickup. A world without a splat map fails validation.

**3.6 Recovery, one system.** `returnToGate(gateId)`: fade 0.4 s, respawn 6 m before the gate on its tangent at 40 km/h with drive enabled under the shield, fade in. Triggers, players and rivals alike: missed gate (4.0 s grace), void (3.2), fall or water (3.4), stuck (forward progress < 1 m over 2.5 s with throttle held; below 30 km/h against a wall, apply yaw toward the road tangent first), upside down (roll > 100[deg], no wheel contact, 2.0 s), player button (1.5 s delay, unlimited). The SOS counter, its badge logic and the RECOVERED and VIEW RESET paths are deleted; the SOS button stays where the HUD has it and simply has no count.

**3.8 Road mesh.** The road is currently a separate slab laid over the terrain: recording F shows its brown underside from below (0:03.3), a vertical side face about 1 m tall at the hairpin (0:10.7), and the car stuck at 1 to 3 km/h on the grass trying to climb that face back onto the road (0:10 to 0:12). Rules: the road ribbon MUST be conformed to the heightfield (vertices projected onto terrain height, terrain carved to meet the ribbon at cliff edges) so there is no gap, no exposed underside and no side face; where a road edge meets a drop, the terrain edge is the drop, not the slab. Any road-edge step over 0.15 m is a validator violation. Tyre stacks, hay bales and fences at hairpin outsides are shove or smash class and sit outside the 4 m band; they do not substitute for a proper edge.

**3.9 Camera close-clamp.** When the probe clamps the camera closer than 6 m to the car (the waterfall frames at 0:33 show a camera a few metres away, nearly edge-on), it MUST rise toward top-down instead of pulling in, keeping the car and at least 15 m of surroundings in frame.

**3.6b Respawn velocity, owner override (r324, 2026-09-01).** "When car restarts after selecting goes straight to nitro. Should be stopped." A restarted car STANDS: `returnSpeedKmh` = 0 and every placement zeroes any burning boost (the wreck respawn was carrying `boostTimer` through death). This supersedes the 40 km/h in 3.6 and the >= 35 km/h clause of P5; the heading-on-tangent clause of P5 stands.

**3.6a Respawn velocity, corrected evidence.** Fall 2 respawn (0:20) leaves the car at 0 km/h with the joystick centred; fall 3 respawn (0:34) leaves it at 32 km/h coasting. The earlier "0 to 14 over 4 s" reading was partly the player not pushing. The fault that stands: respawn velocity is inconsistent and never the specified 40 km/h along the tangent; P5 covers it.

**3.7 Landing assist.** For 300 ms after touchdown: lateral velocity blended toward heading at 80% per 100 ms, yaw rate clamped 60[deg]/s, steer honoured, handbrake cancels and preserves the slide.

---

### 4. Driving feel

Verified good in recordings E and F. Do not touch grip, steering, drift or acceleration values. The feel targets remain the regression floor:

| ID | Metric | Target |
|---|---|---|
| FT1 | Reference 30 m / 90[deg] gravel corner, steady state | 65 to 80 km/h (street corners 48 to 90) |
| FT2 | Input-to-yaw latency at 100 km/h | < 120 ms |
| FT3 | Handbrake at 70 + full steer -> slip > 40[deg] | < 0.5 s, 10/10 |
| FT4 | Counter-steer recovery from 45[deg] | < 0.8 s |
| FT5 | 0 to 100 km/h on road | 5.5 to 6.5 s |
| FT6 | Landing, no handbrake: slip < 20[deg] | within 300 ms |

---

### 5. Rival AI

Delete the rubber band. Rivals are individuals with a pace, a plan and manners; behaviour only, no visuals.

**5.1 Personalities** (`ai.roster`): paceOffset -0.02 to +0.06 vs stage par, consistency 0.6 to 0.98, aggression, cutChance, defence. One rabbit, two racers, two mid, two backmarkers. Field spread follows from pace spread.

**5.2 Pressure rival.** At GO + 15 s pick the one rival nearest the player's live pace; re-pick each lap. Only its target pace may track the player, clamped +-3%, never by force or teleport.

**5.3 Racecraft tick.**
```
line    = courseLine.offset(personalNoise)      // +-4 m trail, +-12 m open
vTarget = cornerSpeed(lookahead) * paceFactor   // same per-segment table as the player's FT1 target
sep     = push-away from cars within 6 m        // off during SETUP/COMMIT
FOLLOW (gap > 0.4 s) -> SETUP (pick side, <= 1.5 s) -> COMMIT (hold 2.0 s) -> CLEAR | YIELD
defender: 1 line change per straight, then hold
mistake: per corner P = 1 - consistency -> 1 to 3 m wide or brake 10% late, recover on line
```
No convergence, catch-up or slow-down toward any car within 10 s of a lap boundary, and none globally except the pressure rival. Hairpin radii come from the template (§8) so the generator cannot produce a corner the AI cannot take. Rivals are subject to 3.6 recovery: stuck 2.5 s, or more than halfWidth + 12 m off the course line for 3 s -> return.

**5.4 Combat discipline.** Token arbiter: player targetable by <= 1 rival before GO + 20 s, <= 2 after, rotate 6 s. Fire requires line of sight, range, unshielded target, shooter not within 1.5 s of its own gate. Rival ram damage to player <= 8. No token -> race, don't orbit.

**5.5 Start.** Launch reactions staggered 0.2 to 0.8 s by consistency.

**5.7 Traffic.** At 0:20.5 a rival sits behind a tractor on the upper road, stationary. Rivals treat traffic as a slow car in the FOLLOW -> SETUP -> COMMIT machine and pass it; they never queue behind it. Traffic itself never stops on the driving surface: a tractor crossing is a scripted pass with a gap of at least 3 s between crossings, and a traffic vehicle that is blocked for 2 s despawns and respawns off-road.

**5.6 Acceptance (20 logged races per stage):** never > 3 cars within 20 m after GO + 15 s (lap 1 turn 1 excepted); P1-to-P8 spread 8 to 25 s at lap 1; 0 to 3 overtakes on the player per lap, each with a logged SETUP; <= 1 rival-player collision per lap; pressure rival within 5 s at the flag in > 60%; zero rivals stationary off course > 3.5 s.

---

### 6. Race systems

**6.1 Position and laps.** Recording F shows the player's dot on the field strip pinned at 0% for the whole 34 s, including a gate crossing at 0:23, while the seven rival dots advance about 5% of a lap in the same time. The progress metric is not updating for the player, and the field as a whole is nearly stationary. progress = gatesPassed * 1000 + fraction along the current segment, recomputed every tick for every car; the strip and the position display read that value and nothing else (HUD appearance unchanged). Display order updates <= 2 Hz and only after the new order persists 1.0 s; ties by time of passage. Lap counter starts at 1. Start-line trigger inert until checkpoint 1 is passed this lap; no event, no message.

**6.2 Damage (holding).** amount = 0.9 * max(0, vN - 5), glancing < 20[deg] = 0, cap 45/hit and 60/s, both collider paths. Grid lock to GO + 1.5 s; AI targeting from GO + 4 s. Hull regen as shipped.

**6.3 Nitro.** Bonus <= +40 km/h over gear top speed, 2.0 s, never granted by recovery, cut while off course. Ceiling derived per world: `nitroCeilingKmh = min(designSpeedKmh + 20, gearTop + 40)`; street template gives 160.

**6.4 Camera.** One camera per race; mode changes only in the pause menu. Delete the automatic cuts on nitro fire, tunnel entry and plaza entry; stages MUST NOT carry camera-cut triggers. Top-down height 1.0x to 1.35x with speed, 400 ms ease. Probe raycasts terrain, canopy AND building colliders every tick including airborne, clamps at hit - 1.5 m. Chase target height +0.4 m.

**6.5 Toasts and wet state (behaviour only).** Status types (WET TIRES, NITRO LOW, wet road) fire once per state change with a 10 s cooldown per type; sampling loops MUST NOT emit toasts. Root cause on Pikes Peak: WET TIRES fires on dry grass at 0:26 and on every road-to-grass transition, so the wet flag is being evaluated per surface sample. Wet is a stage-wide weather state plus the wet-tyre pickup timer, evaluated once per state change, never per surface. Appearance frozen.

**6.5a Hull regen, recorded, not changed.** Regen is +3 hull/s starting 4 s after the last damage, cap 124 on this car. A -23 rock heals in 8 s; damage only matters in bursts. Left as shipped under the repair-only rule; flagged for a later balance pass.

**6.6 Kills affect position.** A destroyed rival respawns at its last gate after a 4.0 s hold, so the shooter gains the places earned.

**6.7 Town performance.** 60 fps on the reference phone, p95 frame time < 18 ms, no auto-quality step: pedestrians pooled and distance-culled (<= 24), building LOD at 60 m, 2 shadow cascades on street worlds.

**6.8 Driver's view.** Removed from the pause menu (dead code, not hidden) until: camera 1.1 m above chassis origin at the windscreen, near plane 0.3 m, bonnet visible, horizon stabilised.

---

### 7. Stage rules (bind every world; enforced in generator AND validator)

A world failing validation MUST NOT load in a release build; in dev it loads and logs `stageViolation`.

| Area | Rule |
|---|---|
| **7.1 Line** | Straight run-out after the finish gate >= 80 m before any corner tighter than 60 m radius; run-in >= 60 m; finish gate >= full road width, no narrowing within 80 m; grid clear zone 60 m around gate 0 from spawn to GO + 5 s; pacing <= 3 consecutive street, <= 2 consecutive open, >= 1 of each kind |
| **7.2 Pickups** | Nitro charge >= 200 m of road before any corner tighter than 60 m, never on the finish straight, never on a cliff-edge hairpin; <= 2 per lap (street <= 1); hull, ammo, shield never within 30 m of a gate, inside an apex band, or on a kicker approach; <= 1 pickup on the racing line per 150 m, others offset >= 2 m |
| **7.3 Props** | No obstacle-class prop on the driving surface, any kind; none within 4 m of the course line except street facades; <= 1 per 20 m at 4 to 12 m; no rocks of any class in street segments; rails and fences fully outside the road mesh; huts and stalls outside the 4 m band; one class per mesh per world; kicker landing zones (full speed range incl. nitro) free of obstacle props and of shove props over 0.6 m |
| **7.4 Clearance** | Tunnels, arches, bridge undersides: vertical clearance >= camera height at top speed x 1.35 + 1.5 m (`minClearanceM` per template); tunnel width >= road + 2 m each side; building colliders in the probe layer; no camera-cut triggers |
| **7.5 Speed budget** | Each world declares `designSpeedKmh` from its template; nitro ceiling derived (6.3); corner radii sized so base-car steady-state corner speed meets FT1 per template |
| **7.6 Surfaces** | Splat map mandatory; terrain heightfield mandatory (3.1); F7 bounds pass on every drivable surface; decals never carry surface IDs |
| **7.7 Gate spacing** | Mountain template: no two consecutive gates > 150 m of road apart, so a fall costs one switchback; other templates <= 300 m |
| **7.8 Performance** | Per 6.7 by template |
| **7.9 Readability** | Drop edges MUST be readable on every palette, not only dusk: the last 2 m of terrain before a drop uses the template's rock material, not grass (at 0:01 and 0:30 the grass shelf runs to the lip with no visual change and the car drives straight over). Dusk/night palettes additionally: rim-light or +15% edge on obstacles and drop edges, fences at max contrast, verified on the chapter's darkest world; obstacles >= 1.6 m and darkest tone, smash/shove <= 1.4 m and lighter. Material changes only; no new objects |
| **7.10 Naming** | No real circuit, city, mountain, brand or driver names in stage data |
| **7.12 Pickups on surface** | Every pickup MUST sit on a drivable surface within 0.5 m of terrain or road height and never below terrain or inside a closed collider (0:08 to 0:09 shows a wet-tyre pickup beacon floating inside the mountain). Validator rule; generator projects pickups onto the surface at placement |
| **7.13 Structures** | Buildings and huts sit on the terrain; foundation plates MUST be sunk so no base edge or gap is visible (the chalet at 0:31 floats on a white slab). Same conform rule as the road. Validator: no structure base more than 0.1 m above terrain at any corner |
| **7.11 Road edge** | Road ribbon conformed to terrain (3.8); no step over 0.15 m between road and adjacent terrain anywhere; no exposed underside or side face; a road edge that meets a drop is a terrain edge with the drop-return rule, and the drop side MUST NOT be reachable at speed from the racing line without crossing at least 3 m of verge |

---

### 8. Stage templates (generator inputs; §7 is checked on the output regardless)

| Parameter | street | canyon | forest / alpine | circuit | open | mountain (switchbacks) | snow / ice |
|---|---|---|---|---|---|---|---|
| designSpeedKmh | 140 | 170 | 160 | 190 | 200 | 130 | 150 |
| road halfWidth m | 4.5 | 6 | 5 | 7 | 8 | 5 | 6 |
| gate mix street / trail / open | 60/30/10 | 20/50/30 | 20/60/20 | 30/50/20 | 0/30/70 | 40/60/0 | 20/50/30 |
| min corner radius m | 22 | 35 | 30 | 45 | 60 | 18 (hairpin), 30 elsewhere | 40 |
| finish run-out m | 80 | 100 | 80 | 120 | 120 | 80 | 100 |
| gate spacing max m | 300 | 300 | 300 | 300 | 300 | 150 | 300 |
| nitro pickups per lap | 1 | 2 | 2 | 2 | 2 | 1 (never at a hairpin) | 1 |
| obstacle within 4 m | facades only | none | none | none | none | none | none |
| off surface | dirt_packed | dirt_loose | grass | grass | sand | grass / rock | snow |
| boundary | slope + water | slope, drop return | slope | slope | none | slope, drop return | slope + water |
| kickers per lap | 0 to 1 | 1 to 3 | 1 to 2 | 0 to 1 | 1 to 3 | 0 | 0 to 1 |
| tunnels / arches | at minClearanceM | yes | none | none | none | none | none |
| pedestrians | <= 24 pooled | 0 | 0 | <= 8 | 0 | 0 | 0 |
| readability pass | if dusk/night | required | if dusk | no | no | required | required (dark base band) |

Per-world overrides: `designSpeedKmh` +- 10 and pedestrians downward only.

---

### 9. Roster migration (78 worlds, 13 chapters)

1. Validator sweep in dev mode; one report of `stageViolation` per rule per world.
2. Deterministic auto-fixes, in order: terrain trimesh -> heightfield; delete obstacle rocks from street segments; one class per mesh; relocate pickups violating 7.2; delete camera-cut triggers; strip surface IDs from decals; rename per 7.10; set nitro ceilings.
3. Generator changes, then regenerate the flagged worlds: finish run-out and run-in, tunnel clearance, corner radius, rails over road, gate spacing.
4. Hand-built worlds go through the same validator and are marked `validated: <build>`.
5. Nothing is added to any world. World count, chapters and star ratings unchanged.

---

### 10. driving.json (consolidated additions)

```json
{
  "physics": {
    "maxClimbDeg": 35, "slopeLatDecayS": 0.5, "fatalDropM": 12, "waterDepthM": 1.2,
    "landDamageK": 0.9, "landDamageThresholdMs": 6, "landDamageCap": 30,
    "belowTerrainM": 1.0,
    "landingAssistMs": 300, "landingLatBlend": 0.8, "landingYawClampDps": 60
  },
  "route": {
    "streetPadM": 2, "trailPadM": 12, "openMinHalfWidthM": 30, "openMaxHalfWidthM": 60,
    "missedGateGraceS": 4.0, "returnAheadM": 6, "returnSpeedKmh": 40,
    "offroadMinTopSpeedPct": 55, "offroadMaxTopSpeedPct": 75,
    "smashMaxKg": 80, "shoveMaxKg": 600,
    "obstacleMinHeightM": 1.6, "obstacleExclusionM": 4, "obstacleDensityPer20m": 1,
    "gateClearZoneM": 60, "finishRunOutM": 80, "finishRunInM": 60, "finishNarrowExclusionM": 80,
    "nitroPickupCornerDistM": 200,
    "stuckDetectS": 2.5, "stuckProgressM": 1.0, "upsideDownS": 2.0, "playerResetDelayS": 1.5,
    "camClearanceM": 1.5, "camHeightMinMul": 1.0, "camHeightMaxMul": 1.35, "camEaseMs": 400,
    "statusToastCooldownS": 10, "killRespawnHoldS": 4.0
  },
  "ai": {
    "roster": [
      { "name": "rabbit", "paceOffset": -0.02, "consistency": 0.95, "aggression": 0.4, "cutChance": 0.2, "defence": 0.8 },
      { "name": "racer1", "paceOffset": 0.00, "consistency": 0.90, "aggression": 0.6, "cutChance": 0.2, "defence": 0.7 },
      { "name": "racer2", "paceOffset": 0.01, "consistency": 0.88, "aggression": 0.7, "cutChance": 0.3, "defence": 0.6 },
      { "name": "mid1", "paceOffset": 0.02, "consistency": 0.80, "aggression": 0.5, "cutChance": 0.3, "defence": 0.5 },
      { "name": "mid2", "paceOffset": 0.03, "consistency": 0.80, "aggression": 0.8, "cutChance": 0.3, "defence": 0.4 },
      { "name": "back1", "paceOffset": 0.05, "consistency": 0.65, "aggression": 0.3, "cutChance": 0.5, "defence": 0.3 },
      { "name": "back2", "paceOffset": 0.05, "consistency": 0.65, "aggression": 0.9, "cutChance": 0.4, "defence": 0.3 }
    ],
    "pressureClampPct": 3, "pressurePickAfterS": 15,
    "separationM": 6, "followGapS": 0.4, "setupMaxS": 1.5, "commitS": 2.0,
    "defenceMovesPerStraight": 1, "lapBoundaryNoConvergeS": 10,
    "offCourseReturnPadM": 12, "offCourseReturnS": 3.0,
    "playerTokensEarly": 1, "playerTokensLate": 2, "tokenRotateS": 6, "rivalRamCapPerHit": 8,
    "launchReactionMinS": 0.2, "launchReactionMaxS": 0.8,
    "lateralNoiseTrailM": 4, "lateralNoiseOpenM": 12
  }
}
```

### 11. Telemetry events used by acceptance

`gate {car, id, passed, lateralM}`, `return {car, reason, gateId, secondsOff}`, `posDisplay {order[]}`, `aiState {rival, state, targetId}`, `overtake {rival, phase, side}`, `mistake {rival, corner, kind}`, `damage {car, src, amount, vNormal, angleDeg, collider}`, `surface {car, id, muApplied}`, `landing {car, slipDeg0, slipDeg300ms, vVertical}`, `slope {car, deg, progress}`, `void {car, depthM}`, `camera {mode, cause}`, `toast {type}`, `stageViolation {world, rule, detail}`, `frame {p95ms, autoQuality}`.

---

### 12. Build order (one system each)

| Build | Content | Gate |
|---|---|---|
| B1 | Physics containment §3: heightfield terrain, watchdog, slope grip, fall handling, camera airborne probe, recovery 3.6, landing assist | P1 to P8 |
| B2 | Stage rules §7 in validator and generator; templates §8; migration §9 steps 1 to 2; nitro ceiling 6.3; toast cooldown 6.5; camera cuts removed 6.4 | R1 to R9, S5 |
| B3 | Migration §9 steps 3 to 5 (generator changes, regeneration, hand-built worlds) | R10, R11 |
| B4 | Race systems: position and laps 6.1, kills-to-position 6.6 | S1 to S4 |
| B5 | AI §5 complete, including rival recovery | A1 to A7 |
| B6 | Rendering: town performance 6.7, dusk 7.9, driver's view removal 6.8 | S6 to S8 |
| B7 | Regression: replay recordings A to F inputs, full suite | X1 |

---

### 13. Acceptance queries (race log JSONL unless stated)

**Physics**
- P1 Scripted drive into every cliff face on the mountain template at 60 and 120 km/h: chassis never > 1.0 m below terrain height; zero `void` returns.
- P2 60[deg] face at 60 km/h: car slides back within 3 s, never holds position; camera never inside terrain.
- P3 30 m drop: `return` reason `kill` before landing; no hull change; no landing event.
- P4 8 m drop: landing event, damage per 3.4, no return.
- P5 Every `return`: within 0.5 s speed >= 35 km/h and heading within 5[deg] of tangent.
- P6 Wedge at 0 km/h with throttle: return in 2.5 s; creeping at 3 km/h does not reset the timer.
- P7 20 scripted jumps: `landing.slipDeg300ms` < 20 in >= 19.
- P8 FT1 to FT6 unchanged from the B0 baseline (feel regression floor).
- P9 Road edge: scripted rejoin from grass onto the road at 10 km/h at 50 random points per world: succeeds within 1.5 s everywhere; validator finds no road-to-terrain step over 0.15 m.
- P10 Camera: no frame with camera-to-car distance < 6 m; on any such clamp the camera pitch rises instead.
- P11 Pickups: validator finds every pickup within 0.5 m of surface height and above terrain on all 78 worlds; scripted lap logs no pickup collected while `void` or airborne below terrain.
- P12 Drop edges: every drop lip on every world has the rock material on the last 2 m (validator material check).

**Stage rules**
- R1 Zero `stageViolation` across all 78 worlds in a release build; report attached.
- R2 20 fresh worlds per template: zero violations without auto-fix.
- R3 Scripted full-nitro line crossing on every world reaches the next gate on the road.
- R4 Scripted lap on every tunnel world: zero camera-in-collider frames.
- R5 Every kicker on every world: landing zone clear across the speed range (validator).
- R6 F7 surface bounds pass on every world, both bounds.
- R7 No `surface` event with id `wet` unless weather flag or wet-tyre pickup active.
- R8 Mountain worlds: no consecutive gates > 150 m apart.
- R9 String scan: none of the protected names in stage data.
- R10 Regenerated worlds pass R1 to R8 with no auto-fix applied.
- R11 Every hand-built world carries `validated: <build>`.

**AI**
- A1 to A7: the §5.6 metrics, one query each, over 20 logged races per stage.

**Systems**
- S1 `posDisplay` events >= 500 ms apart; no A->B->A within 3 s.
- S1b Progress: every car's progress value is monotonic along the course between returns and increases at every gate passage; a scripted lap moves the player's strip position from 0 to 100%.
- S10 Traffic: no traffic vehicle stationary on the driving surface > 2 s; no rival with speed < 10 km/h behind a traffic vehicle > 2 s.
- S2 Lap field starts at 1; first line crossing emits no event and no message.
- S3 Every `rivalDestroyed` followed by that rival's `return` at its last gate with >= 4.0 s hold; killer's position improves or holds.
- S4 Five rivals stationary off course -> player position reflects checkpoint progress within 1 s.
- S5 Any status toast type <= 1 event per 10 s; zero `camera` events not preceded by a pause-menu event; zero wet-state changes without a weather or pickup event in the same tick.
- S6 60 s scripted town lap: no autoQuality event, p95 < 18 ms.
- S7 Darkest world screenshot: obstacle edge luminance >= 15% above surroundings.
- S8 Pause menu snapshot lacks the driver's view entry; the module is unreferenced.
- S9 HUD layout snapshot pixel-identical to the recording E reference; any diff fails the build.

**Regression**
- X1 Recordings A to F input logs replayed: no interval > 8 s with speed < 10 and no return; no void returns; no camera-in-collider frames; no return storms (> 3 in 30 s); position changes only with an on-screen cause; all P, R, A, S green.

---

### Appendix A. Recording ledger

| Rec | Build | World | Headline |
|---|---|---|---|
| A | r293 | Canyon Run | Grid attacks pre-GO; four-car rubber-band pack; wall climb to plateau; two rocks per hull |
| B | r294 | Glacier Col | Three wreck-outs on rocks with zero rival contact; grass at road grip; lap zero; camera buried |
| C | r296 | Maple Mile | Damage economy fixed; grid trucks; finish gantry derby; checkpoint marquee |
| D | r297 | Spa | Position flapping; grass tar pit; driver's view black; lost with no way home; yellow line and arrows (erased) |
| E | r30x | Cliff Knot | Driving good; town built for 140 driven at 205; camera cuts; nitro before finish corner; HUD frozen here |
| F | r31x | Pikes Peak | Player progress frozen at 0% on the strip; field advances 5% of a lap in 34 s; fall through terrain; hang on 70[deg] wall; road slab with exposed side and underside; grass shelf runs to the lip unmarked; pickup beacon inside the mountain; wet flag toggles per surface; rivals parked off road; respawn velocity 0 or 32, never 40; camera clamps to a few metres on the waterfall; regen +3/s |
