# IGNITE RALLY — World Rules & Object Reference

This is the single source of truth for how the physical world must behave.
Every object in the game belongs to exactly one **collision class**, and every
class has exact, non-negotiable mechanics. Any object that violates its class
is a bug. The conformance table at the bottom tracks the honest current state.

---

## 1. The Law of Solidity

1. **Nothing readable as an object may be intangible.** If the player can see
   it and it is taller than their bumper (~0.5 u), driving into it MUST do
   something: stop them, slow them, break it, or break them. "Ghost scenery"
   is forbidden.
2. **Every interaction feeds back three ways** — you *see* it (particles,
   flying pieces, deformation), you *feel* it (speed change, shake, haptics),
   and you're *scored* for it (points/credits, or hull damage as the price).
   An interaction missing any of the three reads as broken.
3. **Race and free roam differ only in reach, never in behavior.** A crate
   behaves identically in both modes; roam just lets you reach more of the
   world. No object may be destructible in one mode and ghost in the other.
4. **Weapons and bodywork are equivalent destroyers.** Anything the bumper
   can break, the cannon / missiles / mines / shockwave must also break.
5. **Destruction is never free, and never fatal by itself.** Breaking through
   the world costs speed (and sometimes a little hull) but pays score. Solid
   hits can hurt badly, but no single scenery collision may wreck a healthy
   car outright.
6. **The material law: if it's crushable material, it can be crashed.**
   Wood, straw, snow, cardboard, tires and sheet-metal boards are crushable —
   including the plank fences around the track. Only rock and masonry
   (cliffs, boulders, hoodoos, buildings, mesas) are truly immovable. A
   material may never be breakable in one place and magically solid in
   another.

---

## 2. Collision classes

| Class | Drive into it | Shoot it | Purpose |
|---|---|---|---|
| **TERRAIN** | Drive on it; height & grip vary | Bullets die on it (dust puff) | Road, dirt, hills |
| **DECOR** | No effect — but must be < 0.5 u tall (pebbles, flowers, grass) | No effect | Ground dressing only |
| **SOFT** | Pass through with drag/grip penalty + VFX while inside | No effect | Puddles, (bushes → see gaps) |
| **BREAKABLE** | Above a speed threshold: object is destroyed — pieces fly, you lose speed, gain score. Below it: SOLID push-out | Destroyed by any weapon hit/blast | Props, trees, snowmen |
| **SOLID** | Push-out + velocity absorbed along the normal (≤ 5 % rebound — never pinball); hard hits cost hull, scrapes shower sparks | Impact sparks only (indestructible) | Fences, cliffs, rock obstacles, buildings |
| **ACTOR** | Car-vs-car / chopper rules: mutual damage on real impacts, positional separation, soft restitution | Full weapon damage model | Cars, choppers |

**SOLID mechanics (exact):** kill the into-surface velocity with factor
**1.05** (5 % rebound), tangential grind loss ≤ 3 %/contact-frame, damage
`min(24, (impact − 8) × 0.9)` hull when normal impact > 8 u/s, sparks always,
splinters/chips when impact > 6, shake + haptics for the player above 12.

**BREAKABLE mechanics (exact):** smash when |speed| > threshold (2 u/s for
props, 7 u/s for trees); the object's mesh is flung as a physical piece
(gravity −24 u/s², tumble spin, ~2 s life), debris + smoke + splinter burst,
car keeps ≥ 80 % of its velocity, score awarded, haptic buzz. Below the
threshold the object is SOLID (push-out, no destruction).

---

## 3. Master object table

"Threshold" = minimum speed to break it by contact. "Cost" = what the driver
pays; "Pays" = score. All objects also obey their class mechanics above.

### Drivable world

| Object | Class | Threshold | Cost | Pays | Notes |
|---|---|---|---|---|---|
| Road | TERRAIN | — | — | — | Full grip; elevation grades apply (GRADE 16) |
| Off-road terrain (roam) | TERRAIN | — | speed cap by car's off-road stat | — | Dust plumes while churning |
| Mud puddles | SOFT | — | heavy drag + slick grip inside | — | Brown splash while inside |
| Boost pads | TERRAIN | — | — | — | Forward impulse, yellow chevrons |
| Launch ramps | TERRAIN | — | — | — | Airborne launch; landing puff + brief loose grip |

### Barriers

| Object | Class | Threshold | Cost | Pays | Notes |
|---|---|---|---|---|---|
| Wooden pole fence | BREAKABLE (hard) / SOLID (soft) | 14 u/s normal impact | 25 % speed + 6 hull | +30 | Below 14 u/s it scrapes like SOLID (sparks, grind, slam damage). At/above it the section **shatters**: planks fly, a visible hole opens, and the car punches through into off-road. Broken holes stay open for the rest of the session; cars re-enter freely. The start/finish stretch (gate + grandstand) is never breakable. AI never leaves the track |
| Pole fence (roam crossing) | BREAKABLE | 8 u/s | 20 % speed | +15 | Splinters + sparks + a hole in the ribbon |
| Off-road beyond a hole (race) | TERRAIN | — | off-road speed cap by car's off-road stat | — | Same physics as free-roam off-road; drive back in through any gap |
| Canyon cliffs | SOLID | — | SOLID class damage | — | Rock: never breakable (material law) |

### Destructibles (props — 52 per world)

| Object | Class | Threshold | Cost | Pays | Notes |
|---|---|---|---|---|---|
| Crate | BREAKABLE | 2 u/s | — | +50 | ~25 % carry a pickup (hull/missile/nitro/mine) |
| Cone | BREAKABLE | 2 u/s | — | +25 | |
| Barrel | BREAKABLE | 2 u/s | — | +60 | |
| Hay bale | BREAKABLE | 2 u/s | — | +40 | |
| Snowman | BREAKABLE | 2 u/s | — | +75 | Snow burst |
| Loose rock (canyon prop) | BREAKABLE | 2 u/s | — | +20 | |

### Vegetation

| Object | Class | Threshold | Cost | Pays | Notes |
|---|---|---|---|---|---|
| Pine tree | BREAKABLE | 7 u/s | 18 % speed + 4 hull | +15 | "TIMBER!" — felled trunk flies with topple spin. 30 hp vs cannon (~3 hits fells it); blasts fell instantly |
| Saguaro cactus | BREAKABLE | 7 u/s | 18 % speed + 4 hull | +15 | Includes roadside cacti at canyon wall base; 30 hp vs cannon |
| Burnt snag | BREAKABLE | 7 u/s | 18 % speed + 4 hull | +15 | Trunk only, no foliage; 30 hp vs cannon |
| Bush | SOFT | — | 15 % speed once per pass (2 s cooldown) | +5 | Leaf burst + dust; bush stays rooted |
| Grass tufts / flowers / pebbles | DECOR | — | — | — | All < 0.5 u, legal decor |

### Structures & trackside

| Object | Class | Threshold | Cost | Pays | Notes |
|---|---|---|---|---|---|
| Rock obstacles on road (hoodoos, basalt boulders) | SOLID | — | class SOLID damage | — | AI dodges them; never breakable (material law) |
| Scenery boulders / outcrops | SOLID | — | class SOLID damage | — | Every boulder with footprint > ~0.9 u is solid |
| Huts | SOLID | — | class SOLID damage | — | One collider per hut |
| Tire stacks | BREAKABLE | 6 u/s | 10 % speed | +10 | Tires scatter, tumble and bounce |
| Sponsor boards | BREAKABLE | 8 u/s | 15 % speed + 2 hull | +20 | "BILLBOARD DOWN" — the whole board rig topples and flies |
| Start gantry legs / grandstand | SOLID | — | class SOLID damage | — | Static colliders; fence near them is unbreakable |
| Mesa outcrops (desert horizon) | SOLID | — | class SOLID damage | — | Reachable in free roam; rock (material law) |
| Canyon foot-bridges (overhead) | DECOR | — | — | — | Deck is above car height; ground posts (if any) SOLID |

### Actors & pickups

| Object | Class | Behavior |
|---|---|---|
| Rival cars | ACTOR | Real impacts (> 9 u/s relative) dent BOTH hulls `min(20, (impact−9)×0.6)`, rate-limited 0.5 s per car; rubs are free; restitution 0.12; sparks scale with impact |
| Player car | ACTOR | Same rules; also takes wall/tree/ram/weapon damage; wreck at 0 hull → respawn with brief invulnerability |
| Choppers | ACTOR | 80 hp; killed by cannon (flak — altitude ignored), missiles, shockwave; +500 on kill |
| Pickups | trigger | Collected on touch: green hull / amber missiles / blue nitro / red mines |
| Mines (dropped) | trigger | Arm 1.1 s, blast 8 u: up to 48 dmg + knockback, levels props in 7 u |

---

## 4. Weapons interaction matrix

| Weapon | Cars | Choppers | Props | Trees | Tires/boards | Fences/cliffs | Terrain |
|---|---|---|---|---|---|---|---|
| Cannon | dmg by car's cannon stat, overheats | flak, altitude-blind | **destroys on hit** | **chips 30 hp, ~3 hits fells** | **destroys on hit** | sparks | dust puff |
| Missile | 55→18 splash 9 u | detonates at airframe | **detonates on contact; blast levels 6 u** | **felled in blast** | **leveled in blast** | detonates on walls | hugs road profile |
| Mine | 48→14 blast 8 u + shove | — | **levels 7 u** | **felled in 7 u** | **leveled in 7 u** | — | sits on road |
| Shockwave | 26→10, 16 u + knockback | hit regardless of altitude | **flattens 16 u ring** | **felled in 16 u** | **leveled in 16 u** | — | — |
| Ramming | mutual crash damage (ACTOR rules) | — | smashes (BREAKABLE) | fells (BREAKABLE) | smashes (BREAKABLE) | breaks wooden fence > 14 u/s; cliffs SOLID | — |

---

## 5. Physics constants reference (current tuned values)

| Constant | Value | Where |
|---|---|---|
| Road half-width / wall clamp | 9 / ±9.55 | track.js / vehicles.js |
| Wall & obstacle velocity absorb | ×1.05 (5 % rebound) | vehicles.js |
| Wall grind tangential loss | 3 %/contact-frame (−20 % per handling lvl) | vehicles.js |
| Wall damage | impact > 8 → min(24, (i−8)×0.9) | vehicles.js `onWallHit` |
| Car-crash damage | impact > 9 → min(20, (i−9)×0.6), both cars, 0.5 s rate limit | main.js `_carCollisions` |
| Car-crash restitution | ±0.12 × relative velocity | main.js |
| Prop contact smash | dist < r+2.3 ∧ speed > 2 | main.js `_updateProps` |
| Tree smash | dist < r+1.7 ∧ speed > 7, else solid push-out | vehicles.js |
| Tree cost / score | ×0.82 speed, −4 hull, +15 | main.js `onTreeSmash` |
| Roam fence burst | crossing ±9.55 at > 8 u/s: ×0.8 speed, +15 | vehicles.js
| Race fence break-through | normal impact > 14 u/s: hole punched, ×0.75 speed, −6 hull, +30 | vehicles.js / main.js `onFenceBreak`
| Tree hp vs cannon | 30 (≈3 hits) | weapons.js
| Tire stack / banner smash | speed > 6 / > 8, else solid push-out | vehicles.js
| Bush brush | ×0.85 speed once per 2 s, +5 | main.js `onBushBrush` |
| Grade force / downhill cap | GRADE 16 / ×1.12 top speed | vehicles.js |
| Ramp launch rule | ground drop > 0.9 ∧ climb rate > 2.5 | vehicles.js |
| Reverse gate | brake ≥ 0.6 held 0.45 s at standstill | vehicles.js |
| Skid marks | slide > 6 u/s lateral at > 12 u/s; 7 s life, 800-mark pool | particles.js `SkidMarks` |
| Flying piece physics | gravity −24, life ~1.5–2.2 s, removed below y −3 | main.js `_updateProps` |

---

## 6. Conformance status

All ten gaps from the original audit are now **implemented**:

| # | Object | Class | Status |
|---|---|---|---|
| 1 | Scenery boulders | SOLID | ✅ colliders for every boulder with footprint > ~0.9 u |
| 2 | Huts | SOLID | ✅ one collider per hut |
| 3 | Tire stacks | BREAKABLE 6 u/s | ✅ stacks burst into tumbling tires |
| 4 | Bushes | SOFT | ✅ leaf burst + drag, once per pass |
| 5 | Sponsor boards | BREAKABLE 8 u/s | ✅ whole rig topples and flies |
| 6 | Start gantry legs, grandstand | SOLID | ✅ static colliders; fence unbreakable there |
| 7 | Bridge posts (canyon) | SOLID | ✅ where posts reach the ground |
| 8 | Fence holes (visual) | hole in ribbon | ✅ breakFence collapses the ribbon verts |
| 9 | Trees vs cannon | 30 hp, ~3 hits | ✅ chips then fells; blasts fell instantly |
| 10 | Mesa outcrops | SOLID | ✅ large-radius colliders |
| — | **Wooden fence crashable in races** (material law) | BREAKABLE > 14 u/s | ✅ hole + planks + off-road escape |

Conformance is enforced by the headless suites (`test-destruction.mjs`,
`test-roam.mjs`, `test-crash-physics.mjs`, `test-rules.mjs`,
`test-final-integration.mjs`).

> **If the live game seems to ignore rules marked conformant:** the deploy
> may be cache-stale — GitHub Pages caches for up to 10 minutes and the
> browser may hold old JS. Hard-refresh (pull-to-refresh twice on mobile, or
> Ctrl/Cmd-Shift-R) before filing it as a violation.

---

## 7. Scoring & economy reference

| Action | Score |
|---|---|
| Crate / cone / hay / barrel / snowman / rock | +50 / +25 / +40 / +60 / +75 / +20 |
| Tree felled, fence burst (roam) | +15 each |
| Rival wrecked | +400 (+ kill nitro) |
| Chopper downed | +500 |
| Lap / finish position | lap bonus + placement bonus |
| Credits | race: score = credits banked; roam: destruction score banked on exit |
| Upgrades | ENGINE/ARMOR/CANNON/NITRO/HANDLING, 5 lvls, 400 CR base, cost scales per lvl |
| Cars | BRAWLER free · SLEEK 2000 · CROWN 3500 · DUNE 4500 · ALPINE 6000 · PIT-99 8000 |
