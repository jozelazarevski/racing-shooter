# IGNITE RALLY — World Rules & Object Reference

This is the single source of truth for how the physical world must behave.
Every object in the game belongs to exactly one **collision class**, and every
class has exact, non-negotiable mechanics. Any object that violates its class
is a bug. The conformance table at the bottom tracks the honest current state.

---

## 0. Hard UI rules

1. **NO MINIMAPS. Ever.** No map overlay of any kind, in any corner, in any
   mode — the user has removed one twice. The road itself, the HUD standings
   and the position panel carry all navigation information. Any future request
   that seems to imply a map must be re-checked against this rule first.

2. **THE GAME MUST RUN OFFLINE.** It is played on a phone, on a plane. No
   feature may add a request to a third-party origin — not a font, not a CDN
   script, not an analytics ping. Everything ships in the repo and is
   precached by `sw.js`; a remote asset does not merely fail without a
   network, it stalls the boot behind a connection timeout. Any new asset
   must be added to the `ASSETS` list in `sw.js`, and `CACHE` must be bumped
   with the `?v=` release version or phones keep serving the old build.

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

**Crush bursts (`particles.propBurst`).** Every prop breaks in its own
material — a generic grey puff for all of them reads as broken, not as
destruction. Energy comes from impact speed (`min(1, |speed|/30)`).

| Prop | What flies | Feel |
|---|---|---|
| **Crate** | 12–18 two-tone plank splinters + 4–6 pale slivers + a white snap-flash + tan dust | wood *breaking* — chunky, fast, gone in ⅔ s |
| **Barrel** | 10–16 stave shards + 2–3 dark hoop glints, in the theme's own stave/hoop colours | flatter, harder arc; hoops skip out low |
| **Hay** | 16–24 straw flecks + a hanging chaff cloud, **no hard chunks** | low gravity, long life — it floats and flutters |
| **Snowman** | 10–14 snow chunks + a powder puff that shrinks as it fades | soft, settling |
| **Cone** | 6–8 orange + 2 white shards | quick, light, flicked away |
| **Rock** | 8–10 grey chips + grey dust, in the stone-crash palette | hard, low, fast — chips, not lumps |
| **Penguin** | 6–8 dark/white flecks + feather flutter | comedic |
| **Anything else** (fence, trough, feed bin, hay rack) | 8–12 debris in the theme's splinter pair | generic but never colourless |

**Bursts may never cost a frame.** Budget is **620 sprites per frame** across
all bursts; past it later bursts thin to 40 % rather than being dropped, so
every prop still visibly crushes. ×0.6 on phones, ×`particles.fxScale` under
the quality governor, pooled sprites only (6000 cap, 46 px point-size clamp).
Crushing all 81 props of a level in a single frame costs 913 sprites — 15 % of
the pool.

### The impact & material model (SOLID mechanics, expanded)

Every SOLID collision shares the same motion response — push-out along the
contact normal, into-surface velocity killed with factor **1.05** (5 %
rebound, never pinball), tangential grind scaled by lean (below), sparks
always — but **what it does to your hull depends on what the object is made
of**. Tangential scrub along a face is **not** flat: it scales with how hard
the car leans in (`0.03 + 0.5 x lean`, lean = |normal speed| / 14), and contact
sets a minimum peel-off rate (`1.2 + 4 x lean` u/s) away from the surface. A
feather graze costs almost nothing and keeps speed; leaning on the rock grinds
you to a crawl instead of letting you ride it round the bend. `impact` = your normal (into-surface) speed in u/s:

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

**Debris is shrapnel.** A smashed prop's flung chunk is not decoration: while
it is still moving faster than **8 u/s**, any car whose centre comes within
**2.2 u** of it takes a hit. Only heavy material throws shrapnel — **crate 6,
snowman 6, barrel 9, rock 10, felled tree 14** hull, scaled by
`clamp(|chunk vel| / 25, 0.5, 1.2)`. Straw, cones, penguins and cacti are pulp
and never bite. Each chunk hits **once**, the car that flung it is immune for
the chunk's first **0.45 s** (you cannot shrapnel yourself off your own
bumper), and any one car can be hit at most once per **0.5 s** — a mine-flung
cluster stings without shredding. A hit on the player costs a damage flash, a
spark burst and a throttled "DEBRIS HIT"; a player-flung chunk that clips a
rival pays **+40**, "DEBRIS STRIKE" and extends the style chain. This is
§1.2 applied to debris: what you can see flying, you must also be able to feel.

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
| Snow surface (FROST PEAK, GLACIAL PASS) | TERRAIN | — | grip ×0.55, traction ×0.72, brakes ×0.58 | — | Whole-world condition (`theme.surface:'snow'`): slides start earlier and run ~2× longer, brakes need ~1.6× distance; AI corner speed ×0.86; powder rooster tails off the tires |
| Wet surface (PINE VALLEY, AMAZON RAPIDS) | TERRAIN | — | grip ×0.78, traction ×0.88, brakes ×0.80 | — | Rain-glossed roads (`theme.surface:'wet'`): slick under braking; AI corner speed ×0.94; water spray off the tires; rain ambient weather |
| Off-road terrain (roam) | TERRAIN | — | speed cap by car's off-road stat | — | Dust plumes while churning |
| Mud puddles | SOFT | — | heavy drag + slick grip inside | — | Brown splash while inside |
| Boost pads | TERRAIN | — | — | — | Forward impulse, yellow chevrons |
| Launch ramps | TERRAIN | — | — | — | Airborne launch — vy capped at 11 u/s and light air drag (×0.10/s) while flying, so no nitro launch ever throws a car out of the world; landing puff + brief loose grip |
| Crossroad spur | TERRAIN | — | — | — | Graded dirt side-road leaving the carriageway on rural worlds; no colliders, normal off-road rules. The junction patch itself is DECOR. Exported as `track.crossroads` (index, side, angle, len, mouth x/z, direction dx/dz, endX/endZ, halfWidth 3.4 flaring to 5.4, y) so traffic can route across |

**Wheel ruts are a soft-ground-only mark.** Dirt, sand, snow and ash record
ruts; sealed asphalt (GOTTHARD CLIMB), stone setts (TREMOLA), sheet ice,
glass-asphalt (NEON GRID) and poured concrete (UNDERCITY) never do. Declared
per theme as `theme.road.ruts`. Ruts are always the car's own track width
(2.6 u), never a lane pair.

### Cliff walls (canyon-type worlds)

Cliff rock is STONE for a real hit: impact `> 7` u/s into the face runs the
stone damage formula, rate-limited to one damage event per **1.1 s** per car.
Glancing scrapes and grinding along the wall between cooldowns cost nothing
but sparks — a long wall grind must never wreck a car on its own. The chase
camera is also clamped inside the walls (lateral ≤ 8.4) so the view never
passes through rock.

**In RACE mode the canyon is closed**: the player and all AI are held inside
the walls (the low berm by the start bowl is the only opening).

**In FREE ROAM the canyon is a door, not a fence** (Law of Solidity #3 — roam
differs only in REACH). The rock stays solid, but once a roamer has driven out
through the low start berm and is past the wall's outer face
(`base + l1 + l2 + 1.5`), the clamp releases and they stay on the open ground
beyond. Without this the clamp yanked escapees back *through* the cliff, which
stranded all 12 treasure stars on every canyon world.

### Dynamic hazards (theme-declared)

Worlds opt into live hazards with data on their theme; the runtime systems are
shared. All damage numbers pass through the player's difficulty intake scale.

| Hazard | Declared as | Law |
|---|---|---|
| Falling objects | `fallHazard {kind: rock/burningTree/icicle, period, dmg}` | Spawn ahead of the player every ~period s (≤4 airborne at once). A falling hit deals `dmg` + fling + crash drama. Rocks and burning trees land as temporary STONE solids for 18 s; icicles shatter on landing. |
| Sand geysers | `geysers {count}` | Fixed pads on a 7.5 s cycle: rumble warning, then a 1.1 s eruption that launches any car in 3.2 u (vy 15, −3 hull, 2.5 s per-car cooldown). |
| Speed strips | `strips {kind: flume/maglev, count}` | Glowing lanes on the straightest sections: any car on one is reeled to the lane center, floored at maxSpeed ×1.22, steering authority ×0.45. Works for rivals too. |
| Critters | `critters {kind: scorpion/rat, count}` | Wandering roadside pests. Drive over at >7 u/s → squashed (+25). Touch one slowly → sting: speed capped ×0.6 for 1.6 s, −2 hull (3 s per-critter cooldown). |
| Chase wall | `chase {kind: avalanche}` | Releases on the FINAL lap ~170 samples behind the player, accelerating +1.4 u/s² up to 58 u/s with distance callouts. Caught → −40 hull, hurled forward, wall resets 120 samples back. Race mode only. |

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
| Saguaro cactus | BREAKABLE | 7 u/s | 18 % speed + 4 hull | +15 | BURSTS in place — pulp splinters and a slump, never the pine topple-roll. Includes roadside cacti at canyon wall base; 30 hp vs cannon |
| Burnt snag | BREAKABLE | 7 u/s | 18 % speed + 4 hull | +15 | Trunk only, no foliage; 30 hp vs cannon |
| Palm · doum palm · kapok (s < 1.0) · broadleaf · tree fern · tanoak · burnt stump | BREAKABLE | 7 u/s | 18 % speed + 4 hull | +15 | Tropical and understory species; all yield |
| Kapok emergent (s ≥ 1.0) | SOLID **big tree** | — | up to −35 hull | — | AMAZON RAPIDS — the tree wins |
| Bush | SOFT | — | 15 % speed once per pass (2 s cooldown) | +5 | Leaf burst + dust; bush stays rooted |
| Grass tufts / flowers / pebbles | DECOR | — | — | — | All < 0.5 u, legal decor |

Solidity is read from the tree record itself:
`yields = tr.solid !== undefined ? !tr.solid : (tr.kind !== 'pine' || tr.s < 1.0)`.
Every tree carries an explicit `solid` flag, so a tropical world never inherits
pine behaviour by shape.

**Biome plausibility.** Every world carries 2–4 plausible flora species with
scale and colour jitter — no monocultures, no conifer on a tropical world, and
no livestock dressing (troughs, hay racks) on a city world.

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
| Livestock (cows, sheep, deer) | ACTOR | Graze in herds out in the pastures, well off the racing line. Any car within 18 u spooks the herd and it scatters away from the car. Contact under 4 u/s just shoves them aside; at speed the animal is killed and the car loses `10 + 22 x mass` hull (cow 1.0, deer 0.6, sheep 0.5) and 30% x mass of its speed — rate-limited to one hit per 0.8 s so ploughing a herd is expensive, not instantly fatal. Pays style points |
| Rival cars | ACTOR | Real impacts (> 9 u/s relative) dent BOTH hulls `min(20, (impact−9)×0.6)`, rate-limited 0.5 s per car; rubs are free; restitution 0.12; sparks scale with impact |
| Player car | ACTOR | Same rules; also takes wall/tree/ram/weapon damage; wreck at 0 hull → respawn with 3 s invulnerability. Hull intake scales by difficulty: EASY ×0.45, NORMAL ×0.62, HARD ×0.85 (events/drama unchanged). **Pit-crew recovery**: 5 s without taking damage → hull regenerates 3/s up to 60% of max |
| Choppers | ACTOR | 80 hp; killed by cannon (flak — altitude ignored), missiles, shockwave; +500 on kill |
| Pickups | trigger | Collected on touch: green hull / amber missiles / blue nitro / red mines / mint **shield** (4 s invulnerability, 2 per lap) |
| Style combo | meta | Smash/kill/overtake/BIG AIR (>0.7 s airtime)/CLOSE CALL (within 1.9 u of a rock at >22 u/s, 4 s cooldown)/SLIPSTREAM (1.1 s tucked behind a rival → +12% top speed) all extend one 5 s chain; multiplier `min(4, 1 + 0.25×chain)` on style points; chain ≥4 adds +0.03 nitro per event |
| Slow-field orb (violet) | trigger | GLACIAL PASS / AMAZON RAPIDS only (2 per lap). On touch: **FREEZE STRIKE! / JUNGLE FURY!** — every rival is hard-capped at `maxSpeed × 0.5` for 6 s. The cap is physical: it stomps in-flight boosts and boost pads grant rivals nothing while the field is live. +100 score |
| Mines (dropped) | trigger | Dropped ON the road surface, snapped toward the racing lane (a fixed drop height once buried them under elevated roads). Arm 0.8 s, live 45 s, trigger 4.2 u, blast 9.5 u: up to 52 dmg + knockback, levels props in 7 u |

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
| Grid spawn checkpoint credit | a fresh `placeAt` credits the far checkpoint only inside 0.4N–0.85N. The grid sits at ~0.99N, so cars start uncredited and the first line crossing after GO banks nothing — without the upper bound every "3 lap" race ran as two, with a ~1.2 s BEST LAP | vehicles.js `placeAt` |
| Respawn checkpoint credit | `placeAt(i, lat, keepCP=true)` preserves credit already earned; used by wreck-respawn and the AI pit-lift so recovery never costs a lap | vehicles.js |
| Distance vs laps | `progress = _wraps + index/N` orders the standings and must never fall; `lap` is the validated race lap and rises only on a checkpointed crossing. Sharing one counter inverted the running order the moment cars crossed the line, because the start crossing deliberately banks no lap | vehicles.js `checkLap` |
| Cliff peel-off rate | 1.4 u/s flat (was `1.2 + 4×lean`, which ping-ponged cars between dual canyon walls) | vehicles.js |
| Launch punch | +55 % thrust below 0.5 × **showroom** top speed (referencing live `maxSpeed` let difficulty and the rubber band widen the rivals' punch window) | vehicles.js |
| Wheel-rut spacing | 2.6 u — the car's own track (wheels at ±1.3) | textures.js `RUT_CX` |
| Snow ploughed swath | ±5.2 u banked berms with car-width polished wheel tracks inside | textures.js `applySnowRoad` |
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

---

## 8. Economy reference

Score is the arcade number and inflates fast (500/lap, a large finishing
bonus, points for every crate). **Credits are a deliberately small slice of
it** so a strong race funds real progress without buying out the garage.

| Rule | Value |
|---|---|
| Conversion | `credits = round(raceScore × 1/12 × difficulty)` |
| Difficulty multiplier | EASY ×0.7 · NORMAL ×1.0 · HARD ×1.5 |
| Podium bonus | 1st 200 · 2nd 120 · 3rd 60 CR |
| First conquest | +500 CR, once per world, on your first podium there |
| Free roam | banks at the same ×1/12 rate — farming off the clock must never beat racing |
| Upgrade cost | `500 + 400 × level` → 500/900/1300/1700/2100 (6,500 per line) |
| Cars | 2,000 → 8,000 CR |

Yardstick: a repeat win on NORMAL pays ≈700 CR, so a second car is ~3 races
of work and a fully maxed upgrade line is ~9.

## 9. Driving aid

`DRIVING AID` (title screen): **PRO** 0 · **STANDARD** 0.5 · **ASSIST** 1.0,
defaulting to ASSIST on touch devices and STANDARD on desktop. While the
player is *not* actively steering (|steer| < 0.25), is on the ground, above
6 u/s, within 12 u of the centreline and not hand-braking, heading is nudged
toward the road direction at `delta × assist × 2.2` rad/s. It never fights
input and never corners for you — it only stops the car wandering.

The chase cameras additionally damp their own yaw (4.5/s) toward a blend of
heading and travel direction, so flicks and drifts no longer whip the view —
that whip was what made the 3D views hard to drive.

## 10. Difficulty & rival balance

The three difficulties differ in pace, aggression, how hard the rubber band
pulls, whether rivals carry rockets, and how much hull damage the player
actually absorbs.

| Difficulty | aiSpeed | aiAggression | rubberBand | Rockets fired at the player | Player hull intake |
|---|---|---|---|---|---|
| EASY | ×0.88 | ×0.65 | ×1.25 | **never** | ×0.45 |
| NORMAL | ×1.00 | ×1.00 | ×1.00 | **~0.7/min** — first at 24 s, budget 1 per 85 s | ×0.62 |
| HARD | ×1.10 | ×1.40 | ×0.75 | **~2–3.3/min** — first at 8 s, budget 1 per 20 s | ×0.85 |

Rival grid stats: `maxSpeed` 53–60 (× aiSpeed × engine parity × rubber band,
floor ×0.7), `accel` **34.5–39.2** — deliberately inside the garage's 36–40 so
no rival out-accelerates every purchasable car, `grip` 5.8, `steerRate` 3.0.

**Engine parity.** Rival top speed rises **+2 % per player ENGINE level, capped
at +10 %**, on NORMAL and HARD only. It reads the *selected car's* upgrade
levels — upgrades are stored per car, so a global lookup silently reads zero.

**Rocket pacing is budgeted, not cooldown-gated.** Launches are metered against
race time (`fired < min(1 + floor((raceTime − first)/period), fired + 2)`, with
6 s minimum spacing), so a quiet stretch is repaid at the next real opportunity
instead of being thrown away. Rivals fire at a player 10–75 u ahead, inside a
`min(14, 4 + 0.25 × distance)` cone. Rank sets reload speed only — it must never
gate *whether* a rival can fire, because a leading rival is by definition in
front of a mid-pack player and the two conditions cancel out.

**Balance targets** (verified by probe, not by feel):

| Target | Limit | Measured |
|---|---|---|
| Launch parity, player vs pack time-to-40 u/s | ≤ 10 % advantage | −1.3 % … +1.7 % |
| Median P1–P2 gap, NORMAL | < 6 s | 0.09–0.52 s |
| Rank volatility, NORMAL | lead must change hands | player finishes P1–P3, rank swings 1↔5 |
| EASY stays casual-winnable | yes | a 0.85-pace driver still wins, gap 0.93 s |

## 11. Rural traffic

Twelve rural worlds carry civilian farm traffic. It is not scenery: it is
heavy, hittable, destructible, and it obeys the same laws everything else does.

| Object | Class | Threshold | Cost | Pays | Notes |
|---|---|---|---|---|---|
| Farm traffic (tractor, hay wagon, farm truck) | ACTOR (heavy) | destroyed by weapons (70 hp), a sustained bumper, or outright by a blast | `min(28, (impact − 6) × 1.4)`, −28 max, 0.9 s rate limit | +150, style-chained | Three rigs trundle with the race direction at 6.5–9.5 u/s hugging the lane edge; up to two more shuttle across the carriageway at `track.crossroads` junctions at 4.6–5.4 u/s, pausing at the edge to look both ways with a `TRACTOR/TRUCK CROSSING!` warning. Standard SOLID response (push-out, ×1.05 absorb) — the rig lurches, stops ~1 s and the driver wobbles. Wreck leaves a charred husk ~10 s; a fresh rig returns 6 s later. Resets pristine on race restart |

**`impact` is RELATIVE closing speed, not absolute.** Overtaking a 6.5 u/s
tractor at 12 u/s is a 5.5 u/s nudge and costs nothing; catching one at 26 is a
19.5 u/s hit. Anything else would punish you for driving fast on an empty road.

| Constant | Value | Where |
|---|---|---|
| Traffic hp / wreck life / respawn | 70 / 10 s / +6 s | traffic.js |
| Traffic collision radii | tractor & truck 2.4, wagon 2.0 | traffic.js |
| Traffic AI avoidance | ghost `{x,z,r:2.9,y:−9999}` proxies pushed into `track.solids` — seen by `Car._sense` (which reads only x/z/r), skipped by the player's y-gated solid loop | traffic.js `registerProxy` |

That proxy trick is the rule worth keeping: **a new actor can teach the AI to
avoid it without touching `vehicles.js`**, by publishing itself into the same
list mid-race rockfall already uses. Traffic keeps ownership of its own
collision response; the AI just needs to know where it is.
