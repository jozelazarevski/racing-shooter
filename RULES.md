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

**BREAKABLE mechanics (exact):** smash when |speed| > threshold (2 u/s for
props, 7 u/s for small vegetation); the object's mesh is flung as a physical
piece (gravity −24 u/s², tumble spin, ~2 s life), debris + smoke + splinter
burst, car keeps ≥ 80 % of its velocity, score awarded, haptic buzz. Below
the threshold the object is SOLID (push-out, no destruction).

### The impact & material model (SOLID mechanics, expanded)

Every SOLID collision shares the same motion response — push-out along the
contact normal, into-surface velocity killed with factor **1.05** (5 %
rebound, never pinball), tangential grind loss ≤ 3 %/contact-frame, sparks
always — but **what it does to your hull depends on what the object is made
of**. `impact` = your normal (into-surface) speed in u/s:

| Material | Hardness | Damage formula | Max hit | Feel & FX |
|---|---|---|---|---|
| **STONE** (boulders, hoodoos, cliffs, mesas, hero rocks) | brutal | `min(85, (impact − 6) × 3.5)` | −85 hull | Rock does not care about toy trucks. A full-speed head-on (~28 u/s) all but **wrecks a healthy car**; even a 15 u/s clip costs ~31 hull. Stone-chip splinters, debris shower, smoke, hard shake, long haptic |
| **BUILDING** (huts) | heavy | `min(50, (impact − 6) × 2.2)` | −50 hull | The house wins and it *shows*: wall planks burst off and tumble, roof-color splinters, a dust cloud rolls out, big shake — "CRASHED INTO THE HUT" |
| **BIG TREE** (pine with trunk scale ≥ 1.0) | firm-alive | `min(35, (impact − 5) × 1.8)` | −35 hull | The trunk stops you dead; the canopy sheds a needle-and-branch shower — "HIT A TREE". The tree itself never falls to a bumper |
| **METAL** (gantry legs, grandstand frame) | firm | `min(24, (impact − 8) × 0.9)` | −24 hull | Clang + spark shower, moderate hull cost — "WALL SLAM" |

Rules of thumb encoded above — the **mass law**: the heavier, harder thing
always wins, and the damage YOU take scales with how unforgiving it is.
Stone > building > living wood > steel post, and every one of them beats a
car. Glancing scrapes below each formula's threshold cost nothing but paint
and sparks.

**Impact presentation (crash drama):** any single hit that costs the player
≥ 18 hull (≥ 13 for car-on-car) triggers a slow-motion beat (~0.32 s at 30 %
speed), a camera FOV punch (+8°, easing home), and a red vignette flash — on
top of the shake/haptics. **Damage shows on the car**: crossing 66 % and
33 % hull knocks a visible accessory (bumper, pod, rack…) flying off the
car; parts bolt back on when repaired above 66 % or on respawn. **Wrecks
leave husks**: a destroyed car leaves a charred, smoking shell where it died
(~9 s, then sinks away; max 6 at once).

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

### Boundaries — there are none

**Fences are gone from the game.** Every world is open: leave the road
anywhere, in race or roam, and you're simply on rough ground — the off-road
speed cap (scaled by your car's off-road stat), extra drag and bumpy terrain
ARE the boundary. The racing line stays the fastest path by physics, not by
walls.

| Rule | Behavior |
|---|---|
| Off-road (any mode) | Speed capped at 55–100 % by the car's off-road stat, heavy dust, terrain-following suspension |
| Lap integrity | A lap only counts after passing the **far-side checkpoint** (mid-track). Cutting straight across the infield earns nothing |
| AI | Rivals race the line and never leave the road (safety clamp at the road edge) |
| Canyon cliffs | The one hard edge in the game — real STONE walls (see material model: heavy damage on hard hits). They open at the start bowl, where free-roamers can drive out |
| Respawns | Always back on the road, checkpoint credit preserved |

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
| Rock obstacles on road (hoodoos, basalt boulders) | SOLID **stone** | — | up to −85 hull | — | AI dodges them; a full-speed head-on nearly wrecks you |
| Scenery boulders / outcrops | SOLID **stone** | — | up to −85 hull | — | Every boulder with footprint > ~0.9 u; stone formula |
| Huts | SOLID **building** | — | up to −50 hull | — | Planks burst off the wall + dust cloud — "CRASHED INTO THE HUT" |
| Tire stacks | BREAKABLE | 6 u/s | 10 % speed | +10 | Tires scatter, tumble and bounce |
| Sponsor boards | BREAKABLE | 8 u/s | 15 % speed + 2 hull | +20 | "BILLBOARD DOWN" — the whole board rig topples and flies |
| Start gantry legs / grandstand | SOLID **metal** | — | up to −24 hull | — | Static colliders, clang + sparks |
| Mesa outcrops (canyon horizon) | SOLID **stone** | — | up to −85 hull | — | Reachable in free roam |
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

| Weapon | Cars | Choppers | Props | Trees | Tires/boards | Stone/cliffs | Terrain |
|---|---|---|---|---|---|---|---|
| Cannon | dmg by car's cannon stat, overheats | flak, altitude-blind | **destroys on hit** | **chips hp 24+16·size (~3–5 hits fells)** | **destroys on hit** | sparks | dust puff |
| Missile | 55→18 splash 9 u | detonates at airframe | **detonates on contact; blast levels 6 u** | **felled in blast** | **leveled in blast** | detonates on walls | hugs road profile |
| Mine | 48→14 blast 8 u + shove | — | **levels 7 u** | **felled in 7 u** | **leveled in 7 u** | — | sits on road |
| Shockwave | 26→10, 16 u + knockback | hit regardless of altitude | **flattens 16 u ring** | **felled in 16 u** | **leveled in 16 u** | — | — |
| Ramming | mutual crash damage (ACTOR rules) | — | smashes (BREAKABLE) | small: fells · **big pine: the TREE wins (−35)** | smashes (BREAKABLE) | stone wins, up to **−85 hull** | — |

---

## 5. Physics constants reference (current tuned values)

| Constant | Value | Where |
|---|---|---|
| Road half-width / road-edge line | 9 / ±9.55 | track.js / vehicles.js |
| Boundaries | NONE — open world; AI-only clamp at road edge; canyon cliffs stone-clamp (open at the start bowl, cliff height ≤ 2.5) | vehicles.js |
| Off-road speed factor | ×(0.55 + 0.45 × car off-road stat), any mode | vehicles.js |
| Lap checkpoint | must touch samples 0.4N–0.6N before the line crossing counts | vehicles.js `checkLap` |
| SOLID velocity absorb | ×1.05 (5 % rebound), all materials | vehicles.js |
| Grind tangential loss | 3 %/contact-frame (−20 % per handling lvl) | vehicles.js |
| STONE damage | impact > 6 → min(85, (i−6)×3.5) | main.js `onSolidCrash` |
| BUILDING damage | impact > 6 → min(50, (i−6)×2.2) + plank/dust burst | main.js `onSolidCrash` |
| BIG-TREE damage | impact > 5 → min(35, (i−5)×1.8); tree never falls to a car | main.js `onTreeCrash` |
| METAL damage | impact > 8 → min(24, (i−8)×0.9) | main.js `onSolidCrash` |
| Big tree threshold | pine with scale ≥ 1.0 is SOLID; smaller pines, cacti, snags yield at > 7 u/s | vehicles.js |
| Car-crash damage | impact > 9 → min(20, (i−9)×0.6), both cars, 0.5 s rate limit | main.js `_carCollisions` |
| Car-crash restitution | ±0.12 × relative velocity | main.js |
| Prop contact smash | dist < r+2.3 ∧ speed > 2 | main.js `_updateProps` |
| Small-tree smash cost / score | ×0.82 speed, −4 hull, +15 | main.js `onTreeSmash` |
| Tree hp vs cannon | 24 + 16 × trunk scale (~3–5 hits) | weapons.js |
| Tire stack / banner smash | speed > 6 / > 8, else solid push-out | vehicles.js |
| Bush brush | ×0.85 speed once per 2 s, +5 | main.js `onBushBrush` |
| Grade force / downhill cap | GRADE 16 / ×1.12 top speed | vehicles.js |
| Ramp launch rule | ground drop > 0.9 ∧ climb rate > 2.5 | vehicles.js |
| Reverse gate | brake ≥ 0.6 held 0.45 s at standstill | vehicles.js |
| Skid marks | slide > 6 u/s lateral at > 12 u/s; 7 s life, 800-mark pool | particles.js `SkidMarks` |
| Flying piece physics | gravity −24, life ~1.5–2.2 s, removed below y −3 | main.js `_updateProps` |

---

## 6. Conformance status

The full material/impact model is **implemented**:

| Rule | Status |
|---|---|
| Fences removed everywhere; world open in race + roam | ✅ |
| Off-road physics as the boundary, any mode | ✅ |
| Lap far-checkpoint (no infield shortcut laps) | ✅ |
| STONE crashes (boulders/hoodoos/cliffs/mesas) near-wreck the car | ✅ up to −85 hull |
| BUILDING crashes burst planks + dust with heavy damage | ✅ up to −50 hull |
| BIG pines are solid — the tree wins, needle shower, −35 max | ✅ |
| Small vegetation / props / tires / boards stay breakable | ✅ |
| Cannon still fells any tree (3–5 hits by size); blasts fell instantly | ✅ |
| Canyon cliffs stone-solid, open only at the start bowl | ✅ |
| AI never leaves the road | ✅ |

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
