# DRIVING_SPEC.md — RALLY_DRIVING.md, adapted to this engine (r293)

The user-supplied `RALLY_DRIVING.md` (Dustline, v1.0) is the normative feel
target. This engine is not the spec's Rapier `DynamicRayCastVehicleController`
— it is a custom single-body arcade model in `src/vehicles.js` — so this
document records HOW each spec section maps, and every deviation. Where the
spec's tables state values in Newtons/kg for a raycast vehicle, the mapped
equivalent lives in `src/driving.js` (overridable by `driving.json` at boot,
per spec §13) and is measure-tuned to the spec's §12 acceptance numbers,
which are the real contract.

## Adopted (measure-verified in tests/test-drivingspec.mjs)

| Spec | Adaptation | Where |
|---|---|---|
| §1 design intent | the whole r284→r293 arc: planted, loose, recoverable | — |
| §6 / 12.1 | 0–100 in 5.8 s ± 0.3 (measured 5.65) via flat drive force ≈ 6.6 u/s² + linear drag 0.122/s — the spec's force-plus-small-drag shape replaces the old huge-thrust/huge-drag governor | `launchTraction`, `dragPower` |
| §6 / 12.4 | top speed = drag/force equilibrium ≈ showroom cap (~195–200 for base cars) | same pair |
| §8.1 / 12.3 | 100–0 in 42 m ± 3 (measured 42.9) | `brakeCap` |
| §7.1 post-peak plateau | grip at full slip holds at 70% of budget (was 22%) — "an arcade car the player can hold sideways" | `slipGripFloor` |
| §8.2 handbrake | yaw impulse 0.18 × lateral speed on press, in the steer direction, scaled to 0 below ~30 km/h, disabled on the ice family, decays ~0.3 s | `hbYawImpulse`, `hbMinSpeed`, `hbIceDisabled` |
| §8.3 counter-steer assist | gain 0.55 toward killing lateral velocity, active above slip 0.22, OFF past ~65° body slip — the spin is earned | `csAssistGain`, `spinSlipAngle` |
| §8.3 spin threshold / 12.5 | full lock at 80 on open ground drifts and recovers, never spins | test 12.5 |
| §12.7 / 12.8 | handbrake slip > 40° in 0.5 s; no impulse on snow/ice | tests |
| §13 tuning surface | `src/driving.js` + `driving.json` boot override, `window.__DRIVING` dev poke | `driving.js` |

## Deviations, each with its reason

- **Steering (§5) is expressed in yaw-rate space, not wheel angle.** This
  engine has no steering rack; the equivalent is the two-branch yaw bound
  `ω ≤ min(v/R_min, capM·a_max/v)` with capM 1.25→1.10 over speed. The spec's
  angle table and this bound produce the same on-road result: full agility at
  low speed, grip-limited arcs at high speed. The mid-range generosity was
  measured DOWN from 1.6 when the spec engine landed: sustained over-grip yaw
  churns speed the weak engine cannot replace (the spec's own reason for
  narrowing angle with speed).
- **§2/§3 rigid body, §9 airborne torques**: no Rapier body; suspension,
  anti-roll and air-control torque tables do not map. Airborne behavior is
  the r-era ballistic model (velocity kept, small attitude authority), which
  answers the same design goal ("no flying corners you had no line for").
- **§7.2 surface table**: this engine has world-level surfaces (`snow`,
  `wet`, dry) plus off-road multipliers, not per-tile IDs. Snow ≈ the spec's
  snow/ice family (0.40–0.44 vs spec 0.45/0.22); wet 0.60 vs 0.78; the
  off-road grass/dirt penalty plays the gravel/grass rows. Full per-tile
  surfaces are a level-format change. [CONFIRM: future round]
- **§6 gears**: no gearbox; the torque-curve feel is approximated by the
  launch wheelspin feed and the force/drag curve. The rev-limit "bounce" does
  not exist. [CONFIRM: audio-only shift blips would be cheap]
- **12.2 (gravel 0-100), 12.6 (Scandinavian flick), 12.9 (kicker), 12.13
  (bottom-out)**: not encoded — no flat gravel plane, no scripted-flick
  harness, jump distances covered by test-jumps/test-goat instead.
- **12.10 determinism**: NOT met. The engine uses unseeded `Math.random` in
  rival racecraft and world scatter. Replays are out of scope. [CONFIRM]
- **12.11/12.12 damage floor and auto-reset**: this game's damage/rescue
  systems predate the spec and are guarded by test-unstuck and
  test-wedge-recovery; the spec's exact floors are not implemented.
- **§10 assists**: this game's driving aid (assist toward road heading) and
  rescue net predate the spec and stay as-is; stability control and wall
  cushion are not implemented as specified.

## The authority note

RALLY_RULES.md and RALLY_SYSTEMS.md (spec §0) do not exist in this repo;
where the spec defers to them, current game behavior stands. Within driving,
`driving.json` tables win over any prose, matching spec §0.3.
