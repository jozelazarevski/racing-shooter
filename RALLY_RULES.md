# RALLY_RULES.md — the owner's rules, all of them, in one place

**Authority.** CLAUDE.md names this file the top of the chain:
`RALLY_RULES.md (race outcomes) > RALLY_DRIVING.md (vehicle physics constants)
> CLAUDE.md > code`. Until 2026-09-09 the file did not exist, so the top of
the chain was a dangling reference and every rule had to be re-derived from
CLAUDE.md prose, HANDOVER narrative, or the code. That is the defect this
file closes.

**What is in here.** Every OWNER DIRECTIVE, verbatim where the words are on
record, with the operational rule it became and its current status. Specs
that are documents in their own right (RALLY_MASTER_SPEC.md,
RALLY_RACE_INTEGRITY.md, RALLY_W_CURVE_01.md) are cited, not copied — but
every rule they contain that CONFLICTS with something else is recorded in
§K, which is the section to read before implementing anything.

**How to use it.**
1. Cite rules by ID (`R-3.2`, `HRD-7`, `AI-2`). IDs never change meaning; a
   superseded rule keeps its ID and gains a SUPERSEDED-BY line.
2. Before writing code that touches a rule, check §K for a conflict on it.
3. A new owner sentence goes in here FIRST, with a status of OPEN, before
   any code is written against it.
4. Never resolve a conflict silently. Record it in §K with the resolution
   and the reason, or leave it in §L for the owner.

**Status vocabulary.** LIVE (shipped and deployed) · BUILT (in the tree,
not yet deployed) · OPEN (agreed, not yet built) · HELD (blocked on an
owner decision, see §L) · SUPERSEDED.

---

## A. Standing decisions — do not reopen

| ID | Rule | Status |
|---|---|---|
| A-1 | The world is fully drivable. No invisible walls, no rule-based speed caps, no return forces. Containment is physics (slope, surface, gravity, terrain collision) and race structure (gates). | LIVE |
| A-2 | Repair only for UI: no new on-screen elements, no world overlays. The r297 yellow centreline and rival arrows are erased with no replacement. Scope LIFTED for world and track geometry by RALLY_PATCH_02 v3 C-4. | LIVE |
| A-3 | The in-race HUD is frozen exactly as shipped in recording E. Nothing moves, resizes, restyles or is removed. Toast BEHAVIOUR may change; toast APPEARANCE may not. | LIVE |
| A-4 | No minimaps, ever, in any corner or mode (RULES.md §0.1; removed twice). Any request that seems to imply a map is re-checked against this first. | LIVE |
| A-5 | No route lines, arrows or braking markers. Corner readability comes from world design: scenery framing, tree lines tightening into curves, containment as natural signposting. | LIVE |

## B. Physics and containment

| ID | Owner sentence / source | Rule | Status |
|---|---|---|---|
| B-1 | CLAUDE.md §3.1 | Terrain is a heightfield; overhangs/tunnels/arches are separate closed trimeshes. Validator rule. | LIVE |
| B-2 | §3.3 | Above `maxClimbDeg` 35° a wheel produces no drive and lateral grip decays to 0 over 0.5 s — the car slides down rather than hanging. | LIVE |
| B-3 | "Should be wrecked at this kind of falls" (r320, PIKES PEAK shelf) | Falls past the damper-priced free band cost hull. | SUPERSEDED-BY B-4 |
| B-4 | RALLY_PATCH_02 v3 FIX-7 | A cliff fall costs −1 hull retained, respawns on the road unfrozen with 3 s invulnerability, camera stays on the player. DESTROYED by terrain alone MUST be unreachable in a normal run. | LIVE |
| B-5 | "Rule: when I get out of the cliff I need to drop immediately" (2026-09-09) | Leaving a lip hands the car to gravity on the same frame. MEASURED CAUSE: `fallEdgeDrop` is 3 m, so the car rappels the first 3 m at up to 11 u/s before going ballistic. The code's own note gives the principled value — below ~0.9 u the ground-follow ease is already inside its cap — so the threshold is ~1.0. | OPEN |
| B-6 | "Car should not drive between the trees" (§7.15) | A forest stand is a MASS: trunks stop a car like any solid, and dense stands carry heavy underbrush drag. Physics, never an invisible wall. | LIVE |
| B-7 | "Rule: I can't drive through a tree" (2026-09-09) | Every tree the car can reach is solid. THREE MEASURED GAPS: (a) the forest carpet registers colliders for the VERGE ring only — the mid ring (38-160 u, 14k instances) and horizon ring (24k) are pure paint; (b) a trunk hit at ≥16.7 m/s keeps 60% of approach speed (FIX-5, r388), which already contradicts B-6; (c) `this.trees` carries `solid:false` on saplings, snags, palms, vines, cacti and small oaks. | OPEN |
| B-8 | "Rule: I can't push trees" (2026-09-09) | No tree yields, is felled, or moves. Deletes the smash/shove class FOR TREES. CONSEQUENCE TO ACCEPT: tree-smash scoring goes with it (§1 "smash and shove props with score"). Vines (`kind: 'vine'`, hanging foliage, not a trunk) stay non-solid or the jungle gains mid-air walls. | OPEN |

## C. Recovery and resets

| ID | Owner sentence | Rule | Status |
|---|---|---|---|
| C-1 | "Don't reset the car when I go off route" (r345, §3.6c) | The player's missed-gate return is DELETED. Leaving the route costs progress, never the car. The owed gate stays armed; driving back through it clears the debt. Rivals keep their off-course recovery — a parked rival is a bug. | LIVE |
| C-2 | "Don't reset me when I am off-road" (r364, §3.6d) | The cliff-top auto-return is DELETED. Being off-road, however high, is never a fault. Only physical traps rescue: under-terrain/void, wedged under held throttle, bogged on wrong tyres, upside down, fatal falls, water. | LIVE |
| C-3 | "When car restarts after selecting goes straight to nitro. Should be stopped." (r324, §3.6b) | A restarted car STANDS: `returnSpeedKmh` 0, and every placement zeroes a burning boost. Heading-on-tangent still applies. | LIVE |
| C-4 | R-RECOVER-01 (Race Integrity) | Off-road, held throttle, under 25 km/h and under 8 m of along-track progress in the window is STUCK and is rescued. On the road the 1 m bar stands. Gated on held throttle and on being off-road, which is what keeps C-1 and C-2 intact. | BUILT (r408) |
| C-5 | R-RECOVER-01 trigger 2 | Off-road AND >15 m from the spline for 2 s → auto-reset. | HELD — see L-1 |
| C-6 | R-RECOVER-01 reset behaviour | 40 km/h rolling start. | HELD — see L-2 |

## D. Race outcomes

| ID | Rule | Status |
|---|---|---|
| D-1 | Lap counter starts at 1. Start-line trigger inert until checkpoint 1 is passed; no event, no message. (§6.1) | LIVE |
| D-2 | "I don't need 3 laps. Race is one lap only." (r364) — default lap count 1; a world's own `laps` still wins. | LIVE |
| D-3 | "Decide when track is 1 or 3 laps depending the length." (r381) — under `lapsShortTrackU` (3000 u) races 3 laps, longer races 1. | LIVE |
| D-4 | R-FINISH-01: crossing the finish MUST end the race within 500 ms, in every vehicle state. MEASURED CAUSE: there is no trigger volume — the finish is an index wrap gated on a checkpoint mask, and r311's gate-0 guard seated a return ON the line, so the teleport CONSUMED the crossing. Fixed by seating before the line (carrying lap and wrap counts back with it) and by giving every placement two frames of immunity from both wrap tests. | BUILT (r408) |
| D-5 | Kills affect position: a destroyed rival respawns at its last gate after a 4.0 s hold. (§6.6) | LIVE |

## E. World and track

| ID | Owner sentence | Rule | Status |
|---|---|---|---|
| E-1 | "All Tunels needs to be under a mountain otherwise makes no sense." (r350) | Every bore lies under real terrain mass end to end, flank overburden ≥25 m. | LIVE |
| E-2 | "Olive coast make it like small hills next to the sea." (§7.16) | On a coast world the water MUST be visible from the coast road; the band between road and waterline is rolling knolls. Acceptance is the sightline census, not the eye. | LIVE |
| E-3 | "Lower the height difference across the game. Instead of the straight climb introduce more interesting snake turns going up and down." (§7.17) | The ROAD's height range per lap is modest; a sustained climb is SNAKED and undulating, never a straight ramp. | OPEN (build reverted, see L-4) |
| E-4 | "Add more curves and jumps" (2026-09-09) | Raise corner density and kicker count roster-wide within §8 template bounds, W-CURVE-01 and T-04. | OPEN |
| E-5 | W-CURVE-02 (Race Integrity) | No segment may hold the car at top speed with zero steering for more than 12 s. Observed 45 s at 250 km/h. | OPEN |
| E-6 | Speed budget (§6.3, §7.5) | `nitroCeilingKmh = min(designSpeedKmh + 20, gearTop + 40)`. NOTE: 250 km/h was observed on an alpine world whose design speed is 160, so the ceiling should be ~180 — a breach the Race Integrity patch does not itself flag, and one that makes E-5 worse than it looks. | OPEN |
| E-7 | W-EDGE-01a (Race Integrity) | A drop beside the road needs containment along its whole length. MEASURED PROBLEM: at the patch's own numbers (>2 m within 4 m of the edge) FALKEN RIDGE — where both observed falls happened — has ONE violating station in 900, because §7.11 deliberately sets drops back beyond 3 m of verge. Band sweep on that world: 4 m → 1 station; 8 m → 299, longest run 1005 m; 15 m → 460, longest run 1771 m. The band must be derived from how far a car actually travels sideways after a hit at racing speed, not picked. | OPEN — see L-3 |

## F. Plants, scenery and structures — the HRD hard road rules

HRD-1..6 are recorded in CLAUDE.md §7A and enforced in the blocking gate.
Summarised here for citation; that table remains the operational text.

| ID | Owner sentence | Rule | Status |
|---|---|---|---|
| HRD-1 | "RULE: nothing stands at the middle of the road" | No body of any class intersects the drivable width at any station, on any leg. Gate: test-nothing-on-road. | LIVE |
| HRD-2 | "This road needs widening" | Curvature widening, bounded by W-CURVE-01.2 (±30% of approach width). | LIVE |
| HRD-3 | — | Drivable half-width never below 3.0 u. | LIVE |
| HRD-4 | — | `|widthAt(i+1) − widthAt(i)| ≤ 0.6 u` — the road tapers, never steps. | LIVE |
| HRD-5 | "there is always a mountain range from one of the sides of the road", scoped to "steep mountains… there can be field roads. That is fine." | On steep-mountain terrain every station carries rising ground on at least one side. | LIVE |
| HRD-6 | "No road floats or is on a ridge" | No station has falling ground on both sides; no road edge stands unsupported. | LIVE |
| HRD-7 | "Fix all trees that are in the house — this is A HARD RULE — swipe across whole game" (2026-09-09) | No tree, bush or tuft may stand inside a structure footprint, on any of the 78 worlds. The plant loses, not the building. MEASURED: 41,195 offenders across 67 of 78 worlds — 36,329 forest carpet, 4,619 ground cover, 247 solid stand. Worst SEA CLIFF RUN 16,322 and CLIFF KNOT 14,622. Needs a blocking-gate suite, as a hard rule. | OPEN |
| F-1 | "Pine trees are never not green… Apply this across the game." (§7.14) | Every conifer renders green foliage on every palette. LARCH IS EXEMPT by the owner's own word. | LIVE |
| F-2 | "Trees in the ice?? Fix" (2026-09-09, GLACIAL PASS) | Nothing grows inside a cliff ribbon on any cliffWalls world, and on the ice-walled worlds nothing grows in the canyon or up its ice flanks. Snowy forests (FROST PEAK) are untouched. | LIVE (r407) |
| F-3 | Structures (§7.13) | No structure base more than 0.1 m above terrain at any corner. NOTE: a race log showed `structure-hover` at 1.8 m on 2 structures while `test-nothing-floats` passed green — the gate has a blind spot for this class. | OPEN |

## G. Camera

| ID | Owner sentence | Rule | Status |
|---|---|---|---|
| G-1 | §6.4 | One camera per race; mode changes only in the pause menu. No automatic cuts. Probe raycasts terrain, canopy AND building colliders every tick including airborne. | LIVE |
| G-2 | §3.9 | Clamped closer than 6 m to the car, the camera RISES toward top-down instead of pulling in. | LIVE |
| G-3 | "There is camera shaking after the tunel" (2026-09-09) | The exit-side hand-off must be as steady as open road. r398 fixed the entry pair; its own note records the exit reaching +33 u over the crown, capped to ~+7 — a cap, not a cure. | OPEN |
| G-4 | C-CAM-01 (Race Integrity) | No frame majority-occluded by vegetation between camera and car; fade the intersecting instances. | OPEN |
| G-5 | C-CAM-02 | The camera collides with world geometry; backfaces never render full-screen. | OPEN |
| G-6 | C-CAM-03 | Airborne: car inside the central 60% of the screen; speedo shows ground speed, never 0; gear holds, never N. | OPEN |
| G-7 | FALKEN RIDGE frame (2026-09-09) | Tree crowns must not fill the frame at the camera. The canopy guard reads crown radius and top from `camTrees`, which the VERGE ring alone populates — the same registry gap as B-7(a). | OPEN |

## H. AI and difficulty

| ID | Owner sentence | Rule | Status |
|---|---|---|---|
| H-1 | §5 standing decision | DELETE THE RUBBER BAND. Removed in r313; `rubberBand`/`bandUp` are gone from EnemyCar. Convergence exists ONLY as the pressure rival's ±3% lease. Any future request to "bound rubber-banding" has nothing to bound — find the real cause. | LIVE |
| H-2 | "Opponents should match my car's strength. Needs to be a constant battle… Not me going away from them always" (2026-09-09) | `machineParity` matches grid pace to the player's machine class. | LIVE (r404) |
| H-3 | "Current hard level should be normal. Make 2 more harder levels where cars are more aggressive." (2026-09-09) | Ladder: EASY / NORMAL (= old HARD) / HARD / SAVAGE, ordered by `tier`. aiSpeed held flat at 1.06 across the top three because raising it INVERTS tier order via the `v > maxSpeed*0.55` nitro gate. Edge comes from aiCorner and aiAggression. | BUILT (r409) |
| H-4 | "Make it adaptive. If I'm driving good make them more angry" | Adaptation rides AGGRESSION ONLY, never pace — a live speed band is H-1's rubber band. Form is the player's progress lead over the best rival, smoothed 4 s, scaled by tier. EASY never gets angry. | BUILT (r409) |
| H-5 | §5.3 | FOLLOW → SETUP (≤1.5 s) → COMMIT (2.0 s) → CLEAR/YIELD. DEFECT FOUND in the owner's race log: SETUP steers to `aheadCar.lateral + side*3.5` while `aheadCar` requires `|across| ≤ 3.4` — 0.1 m outside its own detection window — so the rival loses sight of the car it is passing, drops to FOLLOW, and `_ovSetupHeld` resets, making COMMIT unreachable. Measured 18 flaps in 1.3 s; a pass never completes. | OPEN |
| H-6 | §5.4 | Token arbiter: ≤1 rival before GO+20 s, ≤2 after, rotate 6 s. OBSERVED: the same two cars re-acquire on every lapse — the cap holds but rotation does not. Top tiers raise the late cap to 3 (H-3). | LIVE / partly OPEN |
| H-7 | G-AI-01 (Race Integrity) | Bound rubber-banding both directions. NO MECHANISM EXISTS (H-1). The observed bunching and the 2nd→8th respawn swing need root-causing; H-5 is the prime suspect. | HELD — see L-5 |

## I. Rendering, sky and readability

| ID | Owner sentence | Rule | Status |
|---|---|---|---|
| I-1 | "Shades needs to be consistent and constantly there" (2026-09-09) | One shadow law applied after every builder; wider, view-biased shadow box. | LIVE (r405) |
| I-2 | "Make blues skies and sun no fog" (2026-09-09) | Sky hem 0.14 (0.5 on dusk worlds), a real sun disc on the dome, ambient fog past everything reachable, haze-band curtains deleted, dome and stars follow the camera. | LIVE (r406) |
| I-3 | "Horizont should mit be as white" (2026-09-09) | The horizon band must not read white. Re-verify per theme on HEAD; where it still does, tint `skyHorizon` off pure white and/or narrow the hem — a per-palette decision, not a global. | OPEN |
| I-4 | "Also check for any unusually fog curtains" | Audit for any remaining curtain-class body (large, `fog:false`, inward-facing). | OPEN |
| I-5 | "There some wierd white horizontal lines" + "Remove the white triangle" (2026-09-09) | ONE defect at two angles: a long pointed sliver, read as a triangle near face-on and a streak near edge-on, drawn over sky, trees and through the translucent HUD. REPRODUCED ON r407. Ruled out by two-render diffs: world-skirt (0 px), shadow acne (survives shadows off), chairlift cables (0 px), rain, cloud-bank tails, haze bands (already deleted). NOT YET IDENTIFIED. Next instrument: binary-search bisect over scene children. | OPEN |
| I-6 | §7.9 | Drop edges readable on every palette: the last 2 m before a drop uses the template's rock material. | LIVE |
| I-7 | P-PERF-01 (Race Integrity) | 60 fps sustained, no hitch above 33 ms. Measured 30-33 fps with 50-67 ms hitches. | OPEN |

## J. Delivery

| ID | Rule | Status |
|---|---|---|
| J-1 | Every deploy bumps `build-tag` in index.html, the three `?v=rNNN` module URLs, and `CACHE` in sw.js. | LIVE |
| J-2 | `node tests/validation.mjs` MUST exit 0 before any deploy. A red blocks unless it is a recorded waiver with a ledger reference. | LIVE |
| J-3 | Every deployed build gets a narrative HANDOVER.md section above the previous one. | LIVE |
| J-4 | THE OWNER MAY NOT BE SEEING THE BUILD YOU SHIPPED. sw.js is cache-first for the navigation document, so a load renders from the old cache while the new worker precaches. Confirmed: the server served r406 while every phone frame read r405 across four loads. Fix: on activate + claim, tell the page and reload once at the menu. Do NOT make navigation network-first — with `ignoreSearch: true` that yields a fresh shell against stale modules. | OPEN |

## K. Recorded conflicts and their resolutions

Never resolve one of these silently. Each was found by reading, not by a bug report.

| # | Conflict | Resolution |
|---|---|---|
| K-1 | Elevation mandates (passes 1200 m, terraces 500 m) vs WR-2.1 grades 4-12% plus a 5.5 km lap. A lap climbing AND descending H at grade g needs length ≥ 2H/g, so 12% at 5.5 km caps the range near 330 m. | Master spec is newer and higher: ELEV_MANDATE compresses to the grade-lawful range per world. Recorded, not silently traded. |
| K-2 | R-RECOVER-01 trigger 2 (>15 m off spline → reset) vs C-1 and C-2. The patch's precedence clause defers to the MASTER SPEC, which does not cover these owner overrides, so the clause cannot settle it. | Triggers 1, 3, 4 shipped; trigger 2 HELD (L-1). The patch's own acceptance case (3-13 km/h) is met without it. |
| K-3 | R-RECOVER-01's 40 km/h rolling start vs C-3 ("a restarted car STANDS"). | HELD (L-2); C-3 kept meanwhile. |
| K-4 | G-AI-01 asks to bound a rubber band vs H-1, which deleted it in r313. | No band exists to bound. Root-cause the observed bunching instead; H-5 is the prime suspect. HELD (L-5). |
| K-5 | B-8 (trees cannot be pushed) vs §1's "smash and shove props with score". | The rule wins; tree-smash scoring goes. Flagged to the owner when shipping. |
| K-6 | W-EDGE-01a's 4 m band vs §7.11's deliberate 3 m verge setback. | The band as written measures the verge, not the fall, and misses both observed falls. Derive the band from measured sideways travel after a hit. OPEN (L-3). |
| K-7 | Three different drop thresholds: W-EDGE-01a says >2 m within 4 m; the shipped rail builder uses 2.5 m at a single 7.0 m probe; §7.11 says any step over 0.15 m at the road edge. | Unreconciled. Must be settled as one number before the audit is wired into the gate. |
| K-8 | The owner titled the Race Integrity patch RALLY_PATCH_02, but `RALLY_PATCH_02.md` already holds the 2026-09-06 document RALLY_MASTER_SPEC.md supersedes. | Filed as RALLY_RACE_INTEGRITY.md so neither is lost. Cite it as RALLY_PATCH_02 (Race Integrity, R21). |
| K-9 | Adding tiers above HARD vs three sites testing `difficulty.id === 'hard'` as shorthand for "top tier" (a contract gate, the rung ladder, a 1.25× payout). | Left alone, SAVAGE would pay like NORMAL and lock the hard rungs. All three compare `tier` now. |

## L. Open questions for the owner

| # | Question |
|---|---|
| L-1 | R-RECOVER-01 trigger 2: reinstate the unconditional ">15 m off the spline for 2 s" reset, reversing C-1 and C-2? Shipped without it; the patch's own acceptance is already met. |
| L-2 | R-RECOVER-01: 40 km/h rolling start, or keep C-3's standing restart? Kept C-3. |
| L-3 | W-EDGE-01a: set the lateral band yourself, or shall I derive it from measured sideways travel after a 250 km/h hit at the two known spots? |
| L-4 | E-3: the elevation/weave build is reverted and held pending containment fixes. Re-land when? |
| L-5 | G-AI-01: accept root-causing the bunching (H-5) instead of adding a band to bound? |

---

## Appendix. Where the other documents sit

| Document | Holds |
|---|---|
| RALLY_MASTER_SPEC.md | HUD H-01..03, track T-01..05, containment W-EDGE-01 + W-CURVE-01, scenery S-01..05, vegetation V-01..02, validation VAL-01..03, change control C-01..02. Above CLAUDE.md in authority. |
| RALLY_RACE_INTEGRITY.md | The R21 patch: R-FINISH-01, W-EDGE-01a/02, R-RECOVER-01, C-CAM-01/02/03, G-DMG-01, G-WRECK-01, W-CURVE-02, G-AI-01, W-TEX-01, P-PERF-01. |
| RALLY_W_CURVE_01.md | Standalone copy of the curve containment rule. |
| RALLY_PATCH_02.md | The 2026-09-06 document, superseded entirely by the master spec. Kept for history. |
| CLAUDE.md | Working spec: build order, module map, acceptance queries, §7A HRD table, the recording ledger. |
| RULES.md | World rules and object reference: collision classes and their exact mechanics. |
| DRIVING_SPEC.md / RALLY_DRIVING.md | Vehicle physics constants. |
