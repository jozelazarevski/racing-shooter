# RALLY GAME DESIGN RULESET

**Authority level: normative.** Every rule here is binding on implementation. Where a rule and a request conflict, the rule wins unless the rule is explicitly amended in this file. Do not invent values that are not in this document. If a value is missing, add it to the tuning table first, then use it.

**Stack assumption:** TypeScript, Three.js (render), Rapier.js (physics), Vite. If the stack differs, the numbers still hold; only the API bindings change.

---

## 0. NON-NEGOTIABLES

| # | Rule |
|---|------|
| N1 | Physics runs at a fixed timestep of 1/120 s with 4 solver substeps. Rendering is decoupled and interpolated. No physics logic in the render loop. |
| N2 | All units are SI. Metres, kilograms, seconds, newtons, radians internally. Degrees and km/h only at the UI boundary. |
| N3 | Coordinate system is right-handed, Y up, stage forward is -Z at spawn. |
| N4 | All randomness comes from one seeded PRNG per stage. Same seed produces the same world, byte for byte. |
| N5 | No object may exist in the playable corridor without an explicit collision tier assigned. Untiered geometry is a build failure. |
| N6 | The car never passes through world geometry. Continuous collision detection is mandatory above 25 m/s. |
| N7 | Every collision must produce audio, a particle response, and a damage evaluation. Silent collisions are a bug. |
| N8 | A stage must be completable at 100% throttle discipline without a reset. If it cannot, the stage is misdesigned. |

---

## 1. WORLD STRUCTURE

### 1.1 Spatial hierarchy

```
Stage
 └─ Sector (500 m of centreline, used for timing, streaming, LOD)
     └─ Segment (25 m of centreline, the authoring atom)
         ├─ Roadbed        (drivable surface)
         ├─ Shoulder       (soft runoff, both sides)
         ├─ Verge          (transition, soft obstacles only)
         ├─ Barrier band   (hard obstacles allowed)
         └─ Backdrop       (no colliders, visual only)
```

### 1.2 Corridor widths (binding)

| Band | Gravel stage | Tarmac stage | Snow stage | Notes |
|------|--------------|--------------|------------|-------|
| Roadbed | 4.5 to 7.0 m | 5.5 to 8.0 m | 5.0 to 7.5 m | Absolute minimum 3.6 m at a chokepoint, max 12 m at a hairpin |
| Shoulder | 1.5 to 4.0 m | 0.8 to 2.5 m | 2.0 to 5.0 m | Drivable with a grip penalty, never a hard stop |
| Verge | 2.0 to 6.0 m | 1.5 to 4.0 m | 2.0 to 6.0 m | Tier 1 and Tier 2 objects only |
| Barrier band | beyond verge | beyond verge | beyond verge | Tier 3 and Tier 4 allowed here and nowhere closer |

**Hard rule:** no Tier 4 object within 2.5 m of the roadbed edge on gravel, 2.0 m on tarmac. Exceptions require an explicit `hazard: true` flag and a visible warning marker at least 60 m upstream at stage pace.

### 1.3 Corner classification

Classify every corner by minimum centreline radius. This single value drives pacenotes, AI speed targets, camera framing, and scatter density.

| Grade | Radius | Pacenote | Target entry speed (gravel) | Runoff required |
|-------|--------|----------|------------------------------|-----------------|
| 6 | > 200 m | flat | no lift | 1.5 m |
| 5 | 120 to 200 m | fast | 130 to 160 km/h | 2.5 m |
| 4 | 80 to 120 m | medium | 100 to 130 km/h | 3.0 m |
| 3 | 50 to 80 m | slow | 75 to 100 km/h | 3.5 m |
| 2 | 30 to 50 m | acute | 50 to 75 km/h | 4.0 m |
| 1 | < 30 m | hairpin | 30 to 50 km/h | 5.0 m |

Runoff is measured on the outside of the corner and must be free of Tier 3 and Tier 4 objects.

### 1.4 Gradient and camber

| Property | Limit | Behaviour past the limit |
|----------|-------|--------------------------|
| Climb gradient | 22% sustained, 30% over less than 40 m | Non-navigable, dress as terrain |
| Descent gradient | 25% sustained, 34% over less than 40 m | Brake fade risk flag, mandatory |
| Camber | +8% (banked) to -8% (off camber) | Off camber beyond -8% must be flagged and pacenoted |
| Crest curvature | vertical radius min 45 m | Below 45 m it becomes a jump, see section 8 |
| Terrain slope outside corridor | up to 35° traversable | Above 35° dress as a bank or a cliff, mark as non-recoverable |

### 1.5 Sight lines

Minimum forward visible distance at any point equals `v_max_local × 2.6 s`. At 160 km/h that is 116 m of clear sight. Where terrain, flora, or a crest breaks this, one of the following is mandatory:

1. Reduce the local speed target with a preceding corner.
2. Place a hazard marker (chevron board, marshal post, straw bale line).
3. Add a pacenote call with a `caution` flag.

Blind crests and blind corners are allowed and desirable. Blind crests with a Tier 4 object inside 25 m of the landing zone are forbidden.

---

## 2. SURFACES

Every triangle of drivable ground carries a `surfaceId`. Surface controls grip, rolling resistance, deformation, particles, sound, and tyre wear.

### 2.1 Surface table

| surfaceId | μ long peak | μ lat peak | Rolling resist | Deform depth | Particle | Notes |
|-----------|-------------|------------|----------------|--------------|----------|-------|
| `tarmac_dry` | 1.15 | 1.10 | 0.013 | 0.00 m | none | Baseline reference |
| `tarmac_wet` | 0.85 | 0.80 | 0.016 | 0.00 m | spray | Aquaplaning above 42 m/s in standing water |
| `tarmac_patched` | 1.02 | 0.96 | 0.015 | 0.00 m | dust | Random μ ripple of ±0.04 |
| `gravel_hardpack` | 0.92 | 0.86 | 0.028 | 0.02 m | dust | Fast racing line |
| `gravel_loose` | 0.76 | 0.70 | 0.042 | 0.06 m | stones | Builds ruts, see 2.3 |
| `gravel_deep` | 0.68 | 0.60 | 0.070 | 0.12 m | stones | Off line, punishes width |
| `dirt_dry` | 0.86 | 0.80 | 0.032 | 0.05 m | dust | |
| `dirt_wet` | 0.62 | 0.56 | 0.048 | 0.09 m | mud | |
| `mud` | 0.52 | 0.46 | 0.085 | 0.18 m | mud | Steering authority ×0.7 |
| `grass_dry` | 0.62 | 0.58 | 0.050 | 0.03 m | grass | |
| `grass_wet` | 0.45 | 0.40 | 0.055 | 0.04 m | grass | |
| `sand` | 0.66 | 0.58 | 0.110 | 0.15 m | sand | Heavy drag, momentum critical |
| `snow_packed` | 0.42 | 0.38 | 0.035 | 0.02 m | snow | |
| `snow_deep` | 0.34 | 0.30 | 0.095 | 0.22 m | snow | |
| `ice` | 0.16 | 0.14 | 0.020 | 0.00 m | none | Never more than 80 m unbroken |
| `water_shallow` | 0.48 | 0.42 | 0.130 | n/a | splash | Depth under 0.15 m |
| `bridge_plank` | 0.94 | 0.88 | 0.020 | 0.00 m | none | Adds 12 Hz rumble at speed |
| `cattle_grid` | 0.80 | 0.72 | 0.030 | 0.00 m | none | Adds 30 Hz rumble, 0.03 m vertical noise |
| `cobble` | 0.95 | 0.90 | 0.024 | 0.00 m | none | 0.02 m vertical noise, unsettles the car |

### 2.2 Studded tyre and compound modifiers

Multiply the surface μ by the compound factor. Never stack more than two modifiers.

| Compound | tarmac | gravel | snow | ice |
|----------|--------|--------|------|-----|
| Tarmac slick | 1.00 | 0.62 | 0.55 | 0.50 |
| Gravel | 0.78 | 1.00 | 0.82 | 0.70 |
| Snow studded | 0.60 | 0.85 | 1.00 | 2.30 |

Ice with studs reaches an effective μ of 0.37, which is the intended playable value.

### 2.3 Rut formation

Ruts are a deterministic function of pass count, not of live deformation on single player. Model them as a per segment scalar `rutDepth` in the range 0 to 0.12 m.

- Rut depth increases grip in the rut by +0.06 μ lateral and reduces steering authority by 15% while both wheels of an axle are inside it.
- Escaping a rut requires a lateral force above `0.35 × Fz`. Below that the car tramlines.
- Rut edges apply a lateral impulse of `0.18 × m × g` over 0.08 s when crossed at an angle under 20°.

### 2.4 Surface transitions

Grip must never step. Blend μ over 0.35 m of travel or 60 ms, whichever is longer. A hard step causes a visible snap and is a bug.

---

## 3. FLORA

### 3.1 Classification

| Class | Trunk or stem diameter | Tier | Collider | Behaviour on impact |
|-------|------------------------|------|----------|---------------------|
| Grass, ferns, reeds | n/a | 0 | none | Vertex bend shader only |
| Sapling, shrub, small bush | < 0.12 m | 1 | capsule, sensor | Breaks away, speed loss 1 to 3%, leaf burst |
| Large bush, hedge segment | 0.12 to 0.20 m | 2 | box, dynamic | Speed loss 6 to 14%, deflects car by up to 4°, cosmetic damage only |
| Young tree | 0.20 to 0.28 m | 3 | cylinder, dynamic, 180 to 400 kg | Falls, momentum exchange, panel and mechanical damage |
| Mature tree | > 0.28 m | 4 | cylinder, static | Full stop, terminal damage above 12 m/s normal |
| Fallen log, root ball | any | 3 | convex hull, dynamic | Launches the car if hit at an angle under 25° |
| Stump | any | 4 | cylinder, static, 0.4 m tall | Suspension killer, must be visible |

### 3.2 Placement rules

1. Tier 4 trees are forbidden inside 2.5 m of the roadbed edge (2.0 m tarmac).
2. Anything inside the verge band must be Tier 1 or Tier 2.
3. Minimum spacing between two Tier 3 or Tier 4 trunks is 1.2 m. Closer than this reads as a wall and creates unreadable collision.
4. No tree may occlude a corner apex from a point 80 m upstream on the racing line.
5. Tree canopies may overhang the road. Canopy geometry carries no collider below 3.2 m of clearance. Above that, no collider at all.
6. Scatter density is seeded per biome from the table below and never hand placed inside the corridor.

### 3.3 Biome scatter density (objects per 100 m² outside the roadbed)

| Biome | Tier 0 | Tier 1 | Tier 2 | Tier 3 | Tier 4 |
|-------|--------|--------|--------|--------|--------|
| Alpine forest | 40 | 6.0 | 2.0 | 0.8 | 1.6 |
| Nordic pine | 25 | 3.5 | 1.2 | 0.6 | 2.2 |
| Mediterranean scrub | 55 | 9.0 | 3.0 | 0.3 | 0.4 |
| Farmland | 70 | 2.0 | 0.8 | 0.1 | 0.2 |
| Desert wash | 12 | 1.5 | 0.5 | 0.05 | 0.1 |
| Moorland | 60 | 1.0 | 0.3 | 0.02 | 0.05 |

### 3.4 Visual coherence

- Tier 4 trunks use a bark material with a visible base flare so the collision origin is readable at speed.
- Any tree that can be destroyed must look different from one that cannot. Tier 3 uses a lighter, thinner silhouette. This distinction is a gameplay requirement, not a styling choice.
- Foliage never uses pure green. Sample the biome palette and keep saturation under 55% so the road reads as the brightest element in frame.

---

## 4. FAUNA

Fauna exists for atmosphere and for one specific gameplay purpose: creating a readable, avoidable hazard that punishes tunnel vision. It never exists to randomly end a run.

### 4.1 Categories

| Category | Examples | Tier | Collision result |
|----------|----------|------|------------------|
| Ambient distant | birds, high circling raptors | 0 | none, never enters the corridor |
| Ambient near | rabbits, ground birds, insects | 0 | flee at 40 m, cannot be hit |
| Livestock penned | sheep, cattle behind fencing | 2 fence | fence is the collider, animal despawns behind it |
| Crossing event | deer, sheep, dog | 2 | speed loss 8%, 4° yaw disturbance, cosmetic damage, no gore |
| Spectators | crowd on banks | see 4.3 | never collidable |

### 4.2 Crossing event rules

1. A crossing animal must be visible for at least 2.5 s at the local maximum speed before reaching the racing line. Spawn distance is `v_local × 2.5`.
2. Never spawn on a blind crest, inside a blind corner, or in the landing zone of a jump.
3. Maximum one crossing event per 1.5 km of stage.
4. The animal follows a fixed spline and clears the road in 1.8 s. It does not react to the player and it does not stop in the road.
5. Collision is survivable by design. It costs time and paint. It never causes terminal damage and never triggers a reset.
6. No blood, no ragdoll dismemberment, no lingering carcass. The animal stumbles off screen. This is a hard content rule.

### 4.3 Spectators

- Minimum 3.0 m from the roadbed edge, always behind a barrier, a bank, or a rope line.
- Spectators are non-collidable. The barrier in front of them is the collider.
- Flee animation triggers when the car's projected path passes within 4 m, evaluated 1.2 s ahead.
- Spectators never stand in a runoff area or in the outside of a Grade 1 to Grade 3 corner.
- Density scales with stage prestige, not with danger. Do not use crowds to signal a hazard.

---

## 5. STRUCTURES

### 5.1 Structure table

| Object | Tier | Mass | Restitution | Damage on 10 m/s normal hit | Notes |
|--------|------|------|-------------|------------------------------|-------|
| Hay bale, round | 2 | 320 kg | 0.10 | panel | Rolls, becomes a hazard for later cars |
| Straw bale, rectangular | 2 | 180 kg | 0.05 | cosmetic | Standard soft chicane material |
| Plastic barrier, empty | 2 | 45 kg | 0.15 | cosmetic | Flips easily, low mass |
| Plastic barrier, water filled | 3 | 480 kg | 0.10 | mechanical minor | |
| Wooden fence panel | 2 | 60 kg | 0.05 | cosmetic | Shatters into 4 to 7 pieces |
| Stone wall | 4 | static | 0.20 | terminal | Never inside the verge |
| Concrete block | 4 | static | 0.22 | terminal | Tunnel and bridge approaches only |
| Wooden post, marker | 1 | 12 kg | 0.05 | none | Snaps at the base |
| Metal signpost | 3 | 90 kg | 0.18 | mechanical minor | Bends, does not detach |
| Telegraph pole | 4 | static | 0.20 | terminal | Minimum 4 m from roadbed |
| House wall | 4 | static | 0.18 | terminal | Minimum 4 m from roadbed |
| House window, shutter | 2 | 8 kg | 0.05 | cosmetic | Breakable, purely visual |
| Barn door | 2 | 70 kg | 0.08 | cosmetic | Swings open on contact |
| Water trough, barrel | 3 | 220 kg | 0.12 | panel | |
| Tyre stack | 2 | 110 kg | 0.35 | cosmetic | High restitution, deliberate bounce |
| Guardrail, steel | 4 | static | 0.25 | major | Designed to glance, see 7.4 |
| Chevron board | 1 | 15 kg | 0.05 | none | Always breakable, never a hard object |

### 5.2 Buildings and villages

1. Buildings define the corridor visually. They must never narrow the roadbed below 3.6 m.
2. Any building corner inside 6 m of the roadbed requires a soft buffer in front of it: bales, barriers, or a bank.
3. Village sections must include at least one alternative visual landmark per 200 m so the player can pace by memory.
4. Interiors are never enterable. Doorways are sealed with a static collider set flush to the frame.
5. Courtyards and farm passes must have a minimum 4.5 m gate width and a straight approach of at least 20 m.

### 5.3 Bridges

| Property | Rule |
|----------|------|
| Deck width | Roadbed width plus 0.6 m minimum, never narrower than the approach |
| Approach | Straight for at least 25 m at stage speed, or preceded by a Grade 3 or slower corner |
| Deck lip | Maximum 0.08 m vertical step at each end, ramped over 0.4 m |
| Surface | `bridge_plank` for timber, `tarmac_patched` or `cobble` for stone |
| Guardrail | Tier 4, 0.90 m high, continuous, restitution 0.25, tuned to deflect rather than stop |
| Rail gap | No gaps wider than 0.25 m. The car must never fall through a rail |
| Pylons and abutments | Tier 4 static, must be shielded by the guardrail line |
| Underside | Fully modelled if the river below is drivable, otherwise a simple shell |
| Collapse | Only as a scripted, authored event with a pre-triggered visual cue. Never emergent |

**Bridge failure mode:** a car that clears a guardrail is treated as off stage. Trigger the reset sequence in section 11 after 2.0 s of no ground contact below deck level.

### 5.4 Tunnels and underpasses

- Minimum internal width equals roadbed plus 1.2 m, minimum height 4.5 m.
- Walls are Tier 4 with restitution 0.20 and a 0.35 m chamfer at the base so the car glances rather than catches.
- Audio switches to an enclosed reverb bus within 3 m of the mouth. Exposure adaptation takes 0.8 s in and 0.5 s out.
- No tunnel longer than 180 m without an interior light source.

---

## 6. WATER

### 6.1 Depth bands

| Depth | Grip | Drag | Effect |
|-------|------|------|--------|
| 0.00 to 0.05 m | surface μ × 0.92 | negligible | Spray particles, wet tyre trail |
| 0.05 to 0.15 m | surface μ × 0.80 | light | Heavy spray, screen wash, 3% speed bleed per second |
| 0.15 to 0.35 m | 0.48 | moderate | Steering authority ×0.75, 10% speed bleed per second, engine note dampens |
| 0.35 to 0.60 m | 0.38 | heavy | 22% speed bleed per second, bogging risk, spray blocks 40% of view |
| > 0.60 m | n/a | full | Buoyancy engages, drowning timer starts |

### 6.2 Hydrodynamics

Apply per submerged wheel and per submerged chassis volume:

```
F_drag = 0.5 × ρ × Cd × A_submerged × v²      ρ = 1000, Cd = 0.90
F_buoyancy = ρ × V_submerged × g              applied at the centre of submerged volume
```

- Buoyancy engages only when submerged volume exceeds 40% of chassis volume.
- Wheel contact with the riverbed is retained until submerged volume exceeds 65%.
- Above 65% submerged, drive torque is cut to zero and the engine stalls after 1.2 s.

### 6.3 Fords

1. A ford must be entered within ±20° of perpendicular to the water line. Beyond that, apply a lateral destabilising impulse of `0.25 × m × g`.
2. Entry speed above 90 km/h in water deeper than 0.20 m triggers a nose lift of up to 9° of pitch and a front axle grip loss for 0.6 s.
3. Riverbed surface is always `gravel_loose` or `cobble`, never `mud`. Mud in a ford creates an unrecoverable trap.
4. Exit ramp gradient must not exceed 14%.
5. Ford width must equal the roadbed width plus 1.0 m on each side, with visible depth markers.

### 6.4 Rivers and lakes as boundaries

- Any water body deeper than 0.60 m adjacent to the corridor is an out of bounds volume.
- Out of bounds water triggers a drowning timer of 3.0 s, then the reset sequence in section 11 with a 10 s penalty.
- The camera stays above the waterline during the drowning window. No underwater view.
- Rivers running parallel to the road must be separated by at least a 1.5 m bank or a Tier 4 barrier. A player must never fall in from a simple slide.

### 6.5 Standing water and aquaplaning

On `tarmac_wet` with a puddle depth above 0.03 m, aquaplaning starts at:

```
v_aqua = 6.35 × sqrt(P_tyre)     P_tyre in kPa, result in m/s
```

At 200 kPa this is 90 m/s, which is out of range, so scale the constant to 3.2 for gameplay, giving 45 m/s. Above `v_aqua` reduce μ to 0.10 and disable steering authority progressively over 0.4 s.

---

## 7. VEHICLE PHYSICS

### 7.1 Reference vehicle

| Property | Value |
|----------|-------|
| Mass with crew | 1230 kg |
| Weight distribution | 58 front, 42 rear |
| CoG height | 0.52 m |
| Wheelbase | 2.55 m |
| Track width | 1.60 m |
| Yaw inertia | 1750 kg·m² |
| Roll inertia | 480 kg·m² |
| Pitch inertia | 1680 kg·m² |
| Peak power | 220 kW at 6000 rpm |
| Peak torque | 425 Nm at 3500 rpm |
| Rev limit | 7200 rpm |
| Gearbox | 5 speed sequential, 60 ms shift, no torque cut modelling below 40 ms |
| Drivetrain | AWD, centre diff 50/50, lockable, front LSD 40% lock, rear LSD 65% lock |
| Cd | 0.38 |
| Frontal area | 2.10 m² |
| Downforce | 180 N at 40 m/s, scaling with v² |

### 7.2 Suspension

| Property | Gravel | Tarmac |
|----------|--------|--------|
| Travel | 0.20 m | 0.08 m |
| Spring rate front | 42 N/mm | 88 N/mm |
| Spring rate rear | 38 N/mm | 76 N/mm |
| Bump damping | 4200 N·s/m | 6800 N·s/m |
| Rebound damping | 6100 N·s/m | 9200 N·s/m |
| Anti roll front | 620 Nm/deg | 1450 Nm/deg |
| Anti roll rear | 480 Nm/deg | 1100 Nm/deg |
| Bump stop engagement | last 0.03 m, rate ×6 | last 0.015 m, rate ×8 |

Bump stop contact above 3.5 m/s of compression velocity counts as a suspension impact event and feeds the damage model.

### 7.3 Tyre model

Use a simplified Pacejka curve per axis:

```
F = D × sin(C × atan(B × slip − E × (B × slip − atan(B × slip))))
D = μ_surface × Fz × loadSensitivity × compoundFactor × weatherFactor
loadSensitivity = 1 − 0.12 × ((Fz − Fz_nominal) / Fz_nominal)
```

| Parameter | Tarmac | Gravel | Snow | Ice |
|-----------|--------|--------|------|-----|
| B longitudinal | 11.0 | 6.5 | 5.0 | 4.0 |
| C longitudinal | 1.65 | 1.55 | 1.50 | 1.45 |
| E longitudinal | 0.95 | 0.88 | 0.85 | 0.80 |
| B lateral | 10.5 | 6.0 | 4.6 | 3.6 |
| C lateral | 1.35 | 1.28 | 1.22 | 1.18 |
| E lateral | 0.95 | 0.90 | 0.86 | 0.82 |

- Combined slip uses the friction ellipse. Longitudinal and lateral demand together never exceed `D`.
- Relaxation length is 0.30 m on tarmac, 0.45 m on loose. Forces do not appear instantly.
- Loose surfaces gain a bulldozing term: `F_extra = k_bull × rutDepth × Fz × sin(slipAngle)`, with `k_bull = 0.55`. This is why gravel rewards a sliding entry.

### 7.4 Steering

| Property | Value |
|----------|-------|
| Maximum lock | 35° gravel, 28° tarmac |
| Speed sensitive reduction | lock × (1 − 0.55 × clamp(v / 55, 0, 1)) |
| Rack speed | 420 °/s at the wheel |
| Self aligning torque | from the tyre model, fed to force feedback and to controller rumble |
| Counter steer assist | off by default, maximum 25% of required correction on assist level 1 |

### 7.5 Braking and handbrake

- Brake torque: 3200 Nm front, 1900 Nm rear, bias adjustable 58 to 68% front.
- ABS off by default. Locked wheels lose 22% of longitudinal μ and 45% of lateral μ.
- Handbrake locks the rear axle in 0.12 s, cuts drive to the rear diff, and applies a 0.85 multiplier to rear lateral μ while engaged.
- Brake fade: pad temperature rises with `energy dissipated / thermal mass`. Above 620 °C, torque falls linearly to 62% at 780 °C. Cooling is 0.8 °C per second at 30 m/s airflow. Fade is mandatory on any descent longer than 800 m at more than 12% gradient.

### 7.6 Weight transfer

Longitudinal and lateral transfer must be computed from CoG height and track or wheelbase, not faked with a curve.

```
ΔFz_long = (m × a_x × h_cog) / wheelbase
ΔFz_lat  = (m × a_y × h_cog) / track
```

Transfer must lag the input by the suspension response, not appear in the same frame. This lag is the difference between a car that feels alive and one that feels like a brick on rails.

---

## 8. AIR, JUMPS, LANDINGS

### 8.1 Gravity

Use -11.0 m/s². Real gravity makes rally jumps feel floaty at game scale and camera FOV. This is a deliberate deviation and it applies to the car and to all dynamic props equally so the world stays consistent.

### 8.2 Launch

- A crest becomes a jump when vertical radius drops below 45 m.
- Launch angle equals the terrain tangent at the last contact point. Do not add artificial pop.
- Maximum intended airtime is 1.8 s. Anything above 2.4 s is a design error unless the jump is a signature feature with a prepared, graded landing.
- Rotation at launch carries forward. A car that leaves the crest with yaw keeps that yaw.

### 8.3 Air control

| Axis | Authority | Notes |
|------|-----------|-------|
| Pitch | ±14 °/s | Throttle pitches the nose up via drivetrain inertia, brake pitches it down |
| Yaw | ±9 °/s | From steering input only |
| Roll | ±4 °/s | Minimal, and only above 0.6 s of airtime |

Authority decays to 40% after 1.5 s of airtime so long jumps cannot be fully corrected.

### 8.4 Landing evaluation

Compute `Δpitch` as the angle between the chassis forward axis and the terrain tangent at the landing point, and `v_vert` as the vertical closing speed.

| Δpitch | v_vert | Outcome |
|--------|--------|---------|
| ≤ 5° | ≤ 6 m/s | Clean. No speed loss beyond suspension damping |
| ≤ 15° | ≤ 8 m/s | Good. 3 to 6% speed loss, visible compression |
| ≤ 30° | ≤ 11 m/s | Harsh. 10 to 18% speed loss, bump stop impact, suspension damage roll |
| ≤ 30° | > 11 m/s | Severe. Suspension damage guaranteed, possible steering damage |
| > 30° nose down | any | Nose dig. Massive pitch impulse, likely rollover |
| > 30° nose up | any | Tail slap. Rear suspension damage, yaw instability for 1.5 s |

- Landing on a slope that falls away in the direction of travel reduces `v_vert` by the slope component. Downhill landings are the intended reward for a good crest.
- Landing zones must be free of Tier 3 and Tier 4 objects for `v_launch × 2.2 s` beyond the crest.

### 8.5 Rollover

- Rollover triggers when the roll angle exceeds 68° and the lateral load transfer has fully unloaded the inside axle.
- A rolling car retains angular momentum. It does not snap upright.
- A car resting on its roof for 2.5 s with no player input triggers the reset sequence. Player input during that window allows a rocking recovery attempt with a 4 s window.

---

## 9. COLLISIONS

### 9.1 Tier definitions

| Tier | Name | Collider | Player consequence |
|------|------|----------|--------------------|
| 0 | Cosmetic | none | None |
| 1 | Yielding | sensor | 1 to 3% speed loss, no damage |
| 2 | Deformable | dynamic, low mass | 6 to 14% speed loss, cosmetic damage, ≤4° yaw disturbance |
| 3 | Heavy movable | dynamic, high mass | Full momentum exchange, mechanical damage possible |
| 4 | Hard static | static | Full impulse, damage by energy, possible terminal |

### 9.2 Collision layer matrix

| | Car | Tier1 | Tier2 | Tier3 | Tier4 | Terrain | Water | Trigger |
|---|---|---|---|---|---|---|---|---|
| Car | yes | sensor | yes | yes | yes | yes | sensor | yes |
| Tier2 | yes | no | yes | yes | yes | yes | yes | no |
| Tier3 | yes | no | yes | yes | yes | yes | yes | no |
| Tier4 | yes | no | yes | yes | no | no | no | no |

### 9.3 Impact decomposition

Every impact decomposes the incoming velocity against the contact normal:

```
v_n = (v · n) n          normal component
v_t = v − v_n            tangential component
v_n' = −e × v_n          e = restitution from the object table
v_t' = v_t × (1 − μ_scrape)
```

`μ_scrape` by material: steel guardrail 0.12, stone 0.28, concrete 0.24, timber 0.20, earth bank 0.42, tree bark 0.35.

### 9.4 Angle of incidence rules

Let θ be the angle between the velocity vector and the contact surface plane.

| θ | Classification | Behaviour |
|---|----------------|-----------|
| 0 to 12° | Graze | Sparks, paint, 2 to 5% speed loss, no yaw change beyond 2° |
| 12 to 25° | Scrape | 6 to 12% speed loss, yaw disturbance up to 8°, panel damage |
| 25 to 45° | Glance | 15 to 30% speed loss, significant yaw, mechanical damage roll |
| 45 to 70° | Impact | 40 to 70% speed loss, damage by energy, high spin risk |
| 70 to 90° | Head on | Near full stop, damage by energy, likely terminal above 14 m/s |

**Design intent:** a wall parallel to the road should be survivable at speed. A wall across the road should not. Guardrails and stone walls must be authored so that a car sliding wide meets them at a low θ.

### 9.5 Damage model

```
E_impact = 0.5 × m_effective × |v_n|²      in joules
```

| Energy | Class | Effect |
|--------|-------|--------|
| < 5 kJ | Cosmetic | Paint, dents, lights |
| 5 to 25 kJ | Panel | Bodywork, bumper detach, aero loss up to 15% |
| 25 to 60 kJ | Mechanical minor | Radiator, alignment drift up to 1.5°, 5% power loss |
| 60 to 120 kJ | Major | Suspension arm, steering rack, differential. Alignment drift up to 5°, power loss up to 25% |
| > 120 kJ | Terminal | Retirement, or in arcade mode a 30 s repair penalty |

### 9.6 Component damage table

| Component | Trigger | Effect at 50% | Effect at 100% |
|-----------|---------|---------------|----------------|
| Radiator | front impacts, mud packing | Coolant rises 30% faster | Overheat, power cut to 60% after 90 s |
| Suspension per corner | bump stop hits, landings, kerbs | Damping ×0.7, ride height drop 0.02 m | Damping ×0.25, camber drift 3°, tramlining |
| Steering | front and diagonal impacts | Centre offset 2°, deadzone 1.5° | Centre offset 6°, rack speed ×0.6 |
| Gearbox | rev limit abuse, driveline shock | Shift time 90 ms | 4th and 5th unavailable |
| Turbo | overheat, impact | Boost lag +0.4 s | Boost lost, power ×0.55 |
| Tyre | sidewall impacts, sustained slip | Grip ×0.9 | Puncture, grip ×0.35 on that corner |
| Windscreen | debris, rollover | Cracks obscure 10% of view | Shattered, view obscured, wipers ineffective |

Damage is never invisible. Every level must have a matching visual, an audio change, and a handling change. Damage that only shows in a menu is forbidden.

---

## 10. WEATHER AND TIME

### 10.1 Grip multipliers

| Condition | μ multiplier | Visibility | Notes |
|-----------|--------------|------------|-------|
| Clear dry | 1.00 | 100% | |
| Overcast | 1.00 | 92% | |
| Light rain | 0.88 | 78% | Surface darkens over 40 s |
| Heavy rain | 0.74 | 55% | Puddles form in ruts and low points |
| Fog | 0.94 | 30% | Sight line rule in 1.5 is halved, speed targets must drop |
| Snowfall | 0.70 | 60% | Accumulates, shifts surface toward `snow_deep` |
| Night | 1.00 | headlight cone only | Sight line becomes the lighting range, 70 m low beam, 140 m high beam |

### 10.2 Rules

1. Weather never changes instantaneously. Transition over at least 45 s of stage time.
2. Night stages must have their speed targets recomputed from the headlight range, not inherited from the day version.
3. Fog and night together are allowed only on stages with Grade 4 or slower corners throughout.
4. Water accumulation is deterministic per seed. Puddles appear in authored low points, never randomly under the racing line at a Grade 1 or Grade 2 corner.

---

## 11. RESET, PENALTIES, BOUNDARIES

### 11.1 Reset triggers

| Trigger | Delay before reset |
|---------|--------------------|
| On roof, no input | 2.5 s |
| Submerged beyond 0.60 m | 3.0 s |
| Outside the stage volume | 2.0 s |
| Vertical drop with no ground contact below deck level | 2.0 s |
| Player requested | 0.5 s |
| Stuck, speed under 0.5 m/s with throttle held | 6.0 s |

### 11.2 Reset behaviour

1. Respawn at the nearest upstream centreline node that the car legitimately passed.
2. Face the stage direction. Zero velocity, zero angular velocity.
3. Ride height settled, no spawn drop.
4. 2.5 s of collision immunity, ending early on first throttle input.
5. Time penalty: 10 s standard, 5 s in casual mode, 20 s in career mode.
6. Damage is not repaired by a reset. Only a service park repairs damage.

### 11.3 Cutting

- The corridor is defined by the roadbed plus the shoulder.
- A cut is registered when three or more wheels leave the corridor for more than 1.2 s and the exit point is later on the centreline than the entry point.
- Penalty: 2 s per cut, escalating to 5 s on the third cut in one stage.
- Cutting must also be discouraged physically. Place `grass_wet`, `mud`, or a ditch on the inside of any corner where a cut would gain time. Physical discouragement is preferred over a penalty timer.

---

## 12. PACENOTES AND CO-DRIVER

1. Notes derive automatically from the corner classification in 1.3, gradient, and hazard flags. No hand authored note lists.
2. Call timing: the note is delivered when the car is `v × 3.2 s` from the corner entry, with a minimum of 45 m and a maximum of 180 m.
3. Notes queue. If two corners fall inside one window, they are linked with "into" and delivered as a single phrase.
4. Modifiers, in order of priority: `caution`, `don't cut`, `over crest`, `into`, `long`, `tightens`, `opens`, `bumpy`.
5. The co-driver never speaks during an impact and never comments on the driver's performance mid stage.

---

## 13. PERFORMANCE BUDGETS

| Budget | Target |
|--------|--------|
| Frame time | 8.3 ms at 120 Hz target, 16.6 ms floor |
| Physics time | 2.5 ms per frame maximum |
| Active rigid bodies | 400 maximum, 120 typical |
| Active colliders within 150 m | 1200 maximum |
| Draw calls | 900 maximum |
| Triangles in frame | 4.5 M maximum |
| Texture memory | 2.2 GB |
| Streaming radius | 600 m ahead, 250 m behind |

### 13.1 LOD and collider activation

| Distance from car | Collider state | Visual LOD |
|-------------------|----------------|------------|
| 0 to 60 m | full, dynamic active | LOD0 |
| 60 to 150 m | full, dynamic sleeping | LOD1 |
| 150 to 300 m | static only | LOD2 |
| 300 to 600 m | none | LOD3, instanced |
| > 600 m | none | Impostor or culled |

Trees, rocks, and fence sections use GPU instancing with per instance colour and scale variation. Never place them as individual meshes.

---

## 14. DETERMINISM AND REPLAY

1. Fixed timestep, accumulator based, with a maximum of 5 catch up steps per frame to avoid a spiral.
2. Input is sampled and timestamped at physics rate, not at render rate.
3. One seeded PRNG instance per system: `scatter`, `weather`, `ambient`, `damageRoll`. Never share.
4. Replays store input plus periodic state snapshots every 2 s for correction. Full state streams are forbidden.
5. No floating point behaviour may depend on frame rate. Any `deltaTime` in gameplay logic outside the physics step is a bug.

---

## 15. STAGE VALIDATION LINT

A stage does not ship until every check passes. Implement this as a build step that fails loudly.

| ID | Check |
|----|-------|
| L01 | Every drivable triangle has a valid `surfaceId` |
| L02 | Every collidable object has an explicit tier |
| L03 | No Tier 4 object inside the verge band |
| L04 | Roadbed width never below the minimum for the surface type |
| L05 | Sight line rule satisfied at every centreline node |
| L06 | Every corner has a computed grade and a generated pacenote |
| L07 | Every jump has a clear landing zone for `v × 2.2 s` |
| L08 | Runoff present and clear on the outside of every Grade 1 to Grade 3 corner |
| L09 | No surface μ step greater than 0.15 without a blend zone |
| L10 | Every water body deeper than 0.60 m is inside an out of bounds volume |
| L11 | Every bridge has continuous guardrails with no gap above 0.25 m |
| L12 | Reset nodes exist at least every 120 m of centreline |
| L13 | No fauna spawn point on a blind crest, blind corner, or landing zone |
| L14 | Collider count within any 150 m window is below budget |
| L15 | Stage completable by the AI reference lap with zero resets and under 8 kJ of cumulative impact energy |
| L16 | Total stage length between 3.5 km and 22 km |
| L17 | Grade distribution within tolerance: no more than 40% of corners in any single grade |

---

## 16. DATA SCHEMAS

### 16.1 World object

```json
{
  "id": "tree_pine_mature_0421",
  "archetype": "tree_pine_mature",
  "tier": 4,
  "transform": { "position": [x, y, z], "rotation": [x, y, z, w], "scale": 1.0 },
  "collider": { "shape": "cylinder", "radius": 0.22, "height": 14.0, "offset": [0, 7.0, 0] },
  "physics": { "mass": 0, "restitution": 0.18, "scrapeFriction": 0.35 },
  "damage": { "maxEnergyBeforeBreak": null, "breakInto": null },
  "hazard": false,
  "seedGroup": "scatter"
}
```

### 16.2 Segment

```json
{
  "index": 128,
  "centreline": [[x, y, z], [x, y, z]],
  "roadbedWidth": 5.4,
  "shoulderWidth": [2.1, 1.8],
  "surfaceId": "gravel_loose",
  "rutDepth": 0.05,
  "gradient": -0.14,
  "camber": 0.03,
  "cornerGrade": 3,
  "cornerRadius": 62.0,
  "hazards": ["off_camber"],
  "pacenote": { "call": "3 right long", "modifiers": ["long"], "distanceToNext": 85 },
  "resetNode": { "position": [x, y, z], "heading": [x, y, z] }
}
```

### 16.3 Surface definition

```json
{
  "id": "gravel_loose",
  "muLong": 0.76,
  "muLat": 0.70,
  "rollingResistance": 0.042,
  "deformDepth": 0.06,
  "bulldozeCoefficient": 0.55,
  "pacejka": { "Bx": 6.5, "Cx": 1.55, "Ex": 0.88, "By": 6.0, "Cy": 1.28, "Ey": 0.90 },
  "particle": "stones",
  "audio": "gravel_roll",
  "tyreWearRate": 1.4
}
```

---

## 17. WHAT THE GAME IS NOT

State these so the implementation does not drift toward them.

1. Not a demolition game. Destruction serves readability and consequence, never spectacle for its own sake.
2. Not a physics sandbox. Every dynamic object exists because it changes a driving decision.
3. Not a track racer. There is no ideal line painted by other cars, no rubbering in, no overtaking model.
4. Not a simulator with hidden numbers. Every handling change must be perceivable through sound, image, and force feedback within 200 ms.

---

## 18. AMENDMENT PROCEDURE

Any value changed during implementation must be updated in this file in the same commit, with the old value recorded in a changelog line at the bottom of the affected table. Code that disagrees with this document is wrong by definition.
