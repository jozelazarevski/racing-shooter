# IGNITE RALLY — World Rules & Object Reference

> **Scope: IGNITE RALLY (`src/`, the game at the repository root).**
> This document is normative for v1 and says nothing about `dustline/`,
> which is a separate game with its own specification in
> `dustline/CLAUDE.md`. A rule here is not a rule there.

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

2. **FIRST LOAD IS SACRED, AND OFFLINE STORING IS OPTIONAL.** The service
   worker precaches the **CORE** only — shell, module graph, three.js, fonts —
   all of which the page has already fetched, so caching them is nearly free.
   The 21 world previews (**1.15 MB, 40 % of everything the game ships**) are
   **EXTRA**: stored one at a time, in the background, and only when asked for.
   The card art is lazy too. Measured on a cold load, before → after:

   | | before | after |
   |---|---|---|
   | bytes at boot | 2913 KB | **2031 KB** |
   | requests at boot | 48 | **32** |
   | preview jpgs at boot | 21 | **5** |

   Deferring is only a win if the art still **arrives**: an IntersectionObserver
   alone left 16 of 21 cards blank even after the track list was opened, because
   the region rows scroll horizontally inside a clipped container and never
   tripped it. The observer stays for eagerness; opening the TRACKS tab force-
   loads the rest. Never ship lazy loading without checking the load happens.

   Boot cost is **CPU, not network**. First paint is at 156 ms; what follows is
   ~16 s of main-thread blocking on a software renderer, dominated by the world
   build (~3.5 s) and the shader warm (**9.4 s for 77 programs**). `_warmShaders`
   prefers `compileAsync`, which hands the link to the driver through
   `KHR_parallel_shader_compile` — **unverifiable in this test environment**,
   which is SwiftShader and does not expose that extension. It should help on
   real mobile GPUs, which do. Do not claim a win for it without a device
   measurement.

3. **THE GAME MUST RUN OFFLINE.** It is played on a phone, on a plane. No
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
of**, **how fast you were going**, and **what angle you arrived at**.

Two numbers describe every contact:

- `impact` — your **normal** (into-surface) speed in u/s. Damage goes as
  `impact²`, because that is what energy is. A touch costs almost nothing; a
  real hit is heavy.
- `square` — the **angle of attack**: the share of your speed pointed into the
  surface, `|normal speed| / total speed`. `1` = dead-on, `0` = running
  parallel to the face. Anything below **0.55** is a GLANCE.

`square` exists because a sideswipe and a head-on can arrive with the same
normal speed, and before it they were the same event. Measured on a boulder at
the identical normal speed, a 44 u/s brush cost **more** hull (8.5) than
driving square into the rock at 17 (7.4) — and got the same "HIT ROCK" banner,
the same shake, the same 0.32 s hit-stop freeze. That is what made a graze read
as a wreck.

A glance now:

- pays `0.45 + 0.55 × square` of the hull figure (dead-on is **exactly**
  unchanged, a pure brush pays about half),
- **never hit-stops** — freezing the frame is the loudest thing the game does
  and it must not be spent on a brush; a hard glance gets `glanceDrama()`
  (fov punch + light flash) instead,
- throws its sparks **along** the surface rather than off it,
- keeps its momentum: tangential scrub on the wall path is `(0.03 + 0.5 ×
  lean) × square`, and one graze is **one** event (0.55 s contact cooldown,
  up from 0.18) rather than three as the car scrapes past,
- says so — `SIDESWIPED ROCK` / `CLIPPED THE HUT` / `SCRAPED THE BARRIER` /
  `ROCK FLICKED`, at a lower feed threshold, so the difference can be learned.

Tangential scrub along a face is **not** flat: it scales with how hard the car
leans in (`0.03 + 0.5 x lean`, lean = |normal speed| / 14, **× square**), and
contact sets a minimum peel-off rate away from the surface. A feather graze
costs almost nothing and keeps speed; leaning on the rock grinds you to a crawl
instead of letting you ride it round the bend.

| Material | Hardness | Damage formula (× angle) | Max hit | Feel & FX |
|---|---|---|---|---|
| **STONE** (boulders, hoodoos, cliffs, mesas, hero rocks) | brutal | `min(85·heft, (impact − 6)² × 0.175 · heft) × (0.45 + 0.55·square)` | −85 hull | Rock does not care about toy trucks. A full-speed head-on (~28 u/s) all but **wrecks a healthy car**. `heft = clamp(r/1.4, 0.34, 1)` — a kerb stone is not a cliff. Stone-chip splinters, debris shower, smoke, hard shake, long haptic |
| **BUILDING** (huts) | heavy | `min(50, (impact − 6)² × 0.11) × (0.45 + 0.55·square)` | −50 hull | The house wins and it *shows*: wall planks burst off and tumble, roof-color splinters, a dust cloud rolls out, big shake — "CRASHED INTO THE HUT" |
| **BIG TREE** (pine with trunk scale ≥ 1.0) | firm-alive | `min(35, (impact − 5) × 1.8)` | −35 hull | The trunk stops you dead; the canopy sheds a needle-and-branch shower — "HIT A TREE". The tree itself never falls to a bumper |
| **METAL** (gantry legs, grandstand frame) | firm | `min(24, (impact − 8) × 0.9) × (0.45 + 0.55·square)` | −24 hull | Clang + spark shower, moderate hull cost — "WALL SLAM" |

Rules of thumb encoded above — the **mass law**: the heavier, harder thing
always wins, and the damage YOU take scales with how unforgiving it is.
Stone > building > living wood > steel post, and every one of them beats a
car. Glancing scrapes below each formula's threshold cost nothing but paint
and sparks.

Measured on a flat boulder at 29 u/s, sweeping the approach from square-on to
a brush (`square` is what the physics actually reported at contact):

| square | 1.00 | 0.91 | 0.80 | 0.64 | 0.49 | 0.33 | 0.18 |
|---|---|---|---|---|---|---|---|
| hull | 20.3 | 13.7 | 8.1 | 3.0 | 3.1 | 0 | 0 |
| speed kept | 5 % | 41 % | 60 % | 75 % | 86 % | 93 % | 97 % |
| hit-stop | yes | yes | — | — | — | — | — |

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
| Narrow section (pinch) | TERRAIN | — | drivable half-width falls 9 → 5.0–5.7 u and back, cosine shoulders over the outer 35 % | — | 1–4 per world on straights / mild curves (curvature ≤ 0.016), never within 90 samples of the grid and never on a cliff-walled world. Ramps, boost pads, obstacles, puddles and in-lane props are all kept out of the squeeze. Exported as `track.widthAt(i)`; road ribbon, skirts, AI clamp and off-road line all follow it |
| River ford | SOFT | — | hull drag ×(1 − 0.5·dt) inside; WET TIRES for 3.5 s after (see §5) | — | A 6–10 u shallow water band washing **over** the road, with the stream meandering off into the landscape both sides and foam lines at the water's edge. Bow-wave + entry-curtain spray while crossing, `WET TIRES` feed + haptic. Exported as `track.fords` `[{i, x, z, y, half}]` |
| Visibility zone | — (data) | — | sight distance cut for the length of the zone | — | `track.vizZones` `[{i0, i1, len, mid, half, kind, strength}]`, kind `'forest'` (dense pine corridor + canopy-gloom decal) / `'fogbank'` / `'squall'`. main.js lerps `scene.fog` in and back out; rivals slow to 0.82 × top speed inside |

**A pinch is a squeeze, never a trap.** Every marker beside a narrow section —
striped posts, stone teeth — and every trunk in a forest corridor is pushed out
until its *collision face* clears the declared drivable width: `lateral ≥
widthAt + r + carRadius` (1.8 u for `solids`, 1.7 u for `trees`). The width the
road advertises is always genuinely free at racing speed; clipping a marker
means you were already off the road.

**Nothing may roof the road.** The default camera is TOP-DOWN, so a solid
canopy, tunnel ceiling or overhead decal above the carriageway blacks out the
play view. Forest tunnels are sold with dense edge trees, an inward lean, a
translucent gloom decal *on the ground* and a fog pull — never a lid.

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
| Falling objects | `fallHazard {kind: rock/burningTree/icicle, period, dmg}` | Spawn ahead of the player every ~period s (≤4 airborne at once). A falling hit deals `dmg` + fling + crash drama. Rocks and burning trees land as temporary STONE solids for 18 s; icicles shatter on landing. **Every faller must come from somewhere** — see below. |

**A hazard may never materialise in mid-air.** Fallers used to be spawned 30 u
straight up over the middle of the road and dropped, so on screen a boulder
simply appeared in clear sky ("rocks are falling from the sky, which is funny
and not correct"). Nothing was above it, because nothing put it there. Each
kind is now launched off the thing it would actually come from:

| Kind | Origin | Mechanics |
|---|---|---|
| **rock**, **icicle** | the canyon **RIM** | `_cliffProfile(idx, side)` gives the wall's height and lateral reach; the hazard starts on the rock face and is given the horizontal velocity that carries it to the intended landing spot, so it visibly lets go and arcs down. Dust bursts off the face where it broke away. Measured on ROCKFALL RAVINE and GLACIER'S GRIND: starts ~19–20 u up at lateral 13–15 (road half is 9), **zero** spawned over the carriageway |
| **burningTree** | the **VERGE** | it does not drop, it **TOPPLES** — standing at `roadHalf + 1.2` and rotating about its stump at the angular acceleration of a real falling rod (`3g·sin θ / 2L`), so it starts almost imperceptibly and arrives all at once. The trunk *sweeps*: past ~55° it can catch a car anywhere along its span. The fallen collider sits at the trunk's **mid-span**, lying across the road, not back at the stump |

The landing point is unchanged in every case, so each hazard is exactly as
dangerous as it was — it just has a cause now.

**A hazard you cannot see is a tax, not a hazard.** Coming off the rim fixed
where the rock is *from*; it did nothing for whether you can *pick it out*. The
falling rock was a flat `0x8a6a4c` box against a red-brown cliff — measured, a
max-channel contrast of **31/255 (12 %)** against the wall behind it. Three
things now carry the read, and they are worth keeping in that order:

1. **A fresh break is pale.** The rock takes the theme's own chip colour
   (`T.splinter[0]`) lightened 55 % toward white, with ±12 % per-lump variation.
   Unweathered rock really is much brighter than the face it left, so this is
   physics and legibility agreeing.
2. **A grit trail.** One dust sprite every 40 ms for the whole flight (~29 per
   rock, against a 620/frame budget). At 50 u the rock is a 1 u box; the
   hanging trail is what you actually see, and it points back at the wall.
3. **A plume on impact.** 9 debris + 5 dust, because a rock lands **111–197 u
   ahead** of you and you are still **3.7–6.6 s of driving away** when it hits
   — the plume is usually the first thing you see of the hazard, and four bits
   of debris was not enough to notice.

Measured on one **identical** forced flight (same rim, same target, same camera,
same sample frames), by frame-differencing the scene with and against the
faller hidden: the fall went from **0.61 %** of the frame to **1.51 %** — 2.5×.

Measuring this needs two things or the number is a lie: **pause the game**
(`state = 'paused'`) between the two shots, or the RAF loop advances the world
and you are differencing two different moments — the ravine sandstorm alone
moves 3–9 % of pixels per frame; and **step `particles.update()` by hand**,
because `spawn()` only writes CPU arrays and nothing reaches the GPU until
`update()` flags the attributes dirty. A paused loop never calls it, so a
naive harness cannot see particle effects at all.

The spawn point must also have a **wall worth falling off**: `_cliffProfile`
drops to a 1.7 u berm where the canyon opens around the start bowl, and a rock
launched there fell 3.4 u in 0.42 s — no readable origin and no time to react.
Spawning samples up to 6 candidate points for a face of `h ≥ 8` first, and only
falls back to a plain vertical drop on a world with no cliffs at all.
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
| Gun nests | ACTOR (SOLID) | 70 hp, dug in 17–26 u off the racing line. **Only where combat is the point**: 5 in FREE ROAM, 4 in the SURVIVOR mission. Never in a race — a rally is a rally — and never in the other four missions, which are driving tests against a clock. Being shot at by scenery you cannot answer is not difficulty, it is noise |
| Raiders | ACTOR | 120 hp, top speed 46; hunt the player in the combat modes with CLOSE / STAND / PUSH states and a 4.5 s ram cooldown |
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
| Road half-width / road-edge line | 9 / ±9.55 (open road); inside a pinch both follow `track.widthAt(i)` | track.js / vehicles.js |
| Pinch floor / length / spacing | 0.55–0.65 × ROAD_HALF (≥ 5 u), 34–68 samples, ≥ 110 samples apart; per-theme count in `NARROW_TUNE`, or `theme.narrows` | track.js `_buildWidthProfile` |
| Pinch marker clearance | marker lateral ≥ widthAt + r + car radius (1.8 solids / 1.7 trees) | track.js `_buildNarrowDressing`, `_buildVizCorridors` |
| AI through a pinch | corner-speed cap `min(vMax, 16 + 3.6 × widthAt)` (≈ 36 u/s at a 5.5 u pinch); lateral target clamped to `min(widthAt now, widthAt ahead) − 1.6` | vehicles.js `EnemyCar` |
| Ford placement | 2–3 per water world (forest, alpine, jungle, oasis, flume, redwood), curvature ≤ 0.013, ≥ 150 samples apart, clear of grid / ramps / pads / obstacles / pinches | track.js `_buildFords`, `FORD_TUNE` |
| Ford WET TIRES | `_wetT = 3.5 s`, `_wetMax = 3.5`; grip × (1 − 0.2 × _wetT/_wetMax) → **×0.80** leaving the water, fading linearly to ×1.00 | vehicles.js |
| Puddle wet tires | `_wetT = 0.14 s`, flat grip ×0.75 — a puddle never cuts a ford's longer fade short | vehicles.js |
| Viz-zone fog targets (near/far) | forest 45/200, fogbank 20/140, squall 40/180 — each clamped to ≤ the theme's own fog and **far ≥ 110** so it never goes blind-black | main.js `_updateVizZones` |
| Viz-zone fog lerp | k = min(1, 2.2 × dt) — ~96 % of the way in 1.5 s, in and out alike | main.js |
| Squall rain | ×2 on the theme's ambient rain rate; only placed on `weather.type === 'rain'` worlds, and the shared THEMES object is handed back unmodified when the world changes | main.js / track.js `VIZ_TUNE` |
| AI in a viz zone | corner-speed cap ×0.82 top speed while the lookahead sample is inside a zone | vehicles.js `EnemyCar` |
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
| STONE damage | impact > 6 → min(85·heft, (i−6)²×0.175·heft) × angle | main.js `onSolidCrash` |
| BUILDING damage | impact > 6 → min(50, (i−6)²×0.11) × angle + plank/dust burst | main.js `onSolidCrash` |
| BIG-TREE damage | impact > 5 → min(35, (i−5)×1.8); tree never falls to a car | main.js `onTreeCrash` |
| METAL damage | impact > 8 → min(24, (i−8)×0.9) × angle | main.js `onSolidCrash` |
| Angle of attack | `square = |normal speed| / speed`; angle factor `0.45 + 0.55·square`; glance below 0.55 — no hit-stop, sparks along the face, 0.55 s cooldown | vehicles.js + main.js `onSolidCrash` |
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
| Track width varies, and a pinch stays passable at racing speed | ✅ player through a 5.5 u pinch at 197 km/h, no hull lost, max lateral 1.46 |
| Rivals thread a pinch instead of pile up | ✅ 5 rivals entered abreast (±6 u), all cleared, 0 edge-grind frames, min speed 32–34 u/s |
| River fords: visible water, splash on the way through, wet tires after | ✅ measured grip ×0.816 at wetT 3.2 s → ×0.956 at 0.75 s → ×1.00 (dry 3.900) |
| Visibility zones dim and restore without collapsing the far plane | ✅ fogbank 26/170, forest 45/200, squall ×2 rain; fog returns to the theme base on exit |

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

### A world is a ROUTE over a THEME

`theme` is the **look** (fog, sky, palette, flora, props). `route` is the
**shape** (the control-point loop). They used to be the same key, so a new
circuit cost a whole new art set and no two worlds could share a palette. Real
rally does not work that way — Monte Carlo and Sweden are both snow-and-mountain
and drive nothing alike.

A level may now name:

- `route` — which entry of `CIRCUITS` to drive. Defaults to `theme`, so every
  pre-existing world is untouched.
- `tune` — an object **layered over** the theme, so anything a theme sets can be
  overridden per level: `elev`, `rampCount` (jumps), `cliffWalls`, `heroBridge`.

Two things that will bite whoever adds the next route:

1. **`switchbackStack` has a direction, and the joins matter.** The first leg
   must start on the side the approach *arrives* from (`dir: -1` starts on the
   right), and the descent must pick up on the side the last leg *ends*. Get it
   wrong and the spline whips across the map between two adjacent control
   points — measured, the first cut of COL DE TURINI and PIKES PEAK bottomed out
   at a **one-unit** corner radius, where the tightest hairpin anywhere else on
   the roster is four. Always check `minR` on a new route.
2. **`DEMAND_BOUNDS` caps climb at 6.8.** An `elev.amp` that pushes past it
   clamps to 1.00 and the affinity system can no longer tell those worlds apart.
   The first cut had five of seven new worlds pinned at 1.00.

**Deriving DEMANDS for a new world.** `twist` and `climb` are measurable —
mean curvature and mean absolute grade, normalised through `DEMAND_BOUNDS`.
Validate the formula by reproducing the published values for the existing
worlds *before* trusting it on a new one (it currently lands within 0.02 twist
and 0.12 climb). `fast` could **not** be reproduced that way; for new worlds it
is assigned from the share of lap above a 120 u radius, which rank-orders
against the published values at Spearman **0.65** — directionally right, not
exact. Say so rather than implying it is measured.

**World card art is optional.** Only the original 21 have hand-shot previews.
A card whose `w{id}.jpg` 404s falls back to a themed wash with the circuit
outline drawn over it, so a new world needs no art to ship.

### Progression: RALLY STARS, not a chain

A world used to open only on a **podium** finish on the one before it. One
track you could not crack ended the career — which is exactly what happened on
ROCKFALL RAVINE. Stars replace the chain with a bank:

| | |
|---|---|
| ★ | FINISH — cross the line |
| ★★ | PODIUM — top three |
| ★★★ | WIN |

Your **best ever** is kept per world, the total is the currency, and a world
opens when your total reaches its cost. So you pick what to race, anything you
race pays into everything else, and a world you already beat is still worth
returning to for the stars you left on it.

**Three stars and not five.** Driving clean and sweeping all three contracts
were stars in the first cut, and that put a **5× spread** between what an ace
and a finisher bank per race — no single threshold curve survives that.
Simulated across the roster, every slope gentle enough to keep a finish-only
driver moving let an ace open all 21 worlds in **four races**. At three stars
the spread is 3× and both ends work. Clean runs (+200 CR) and contract sweeps
(+250 CR) pay credits instead, where a wide spread is harmless because nothing
is gated on money.

**Cost is exactly one star per career slot** (first three free). That slope is
load-bearing, not a round number: a finish-only driver banks 1★ a race, so at
any slope above 1 they eventually hit a wall they can never clear. Measured —
a 1.8 slope walled them in after three worlds, 1.25 after fifteen, 1.0 never.

Simulated to completion, with the natural strategy of always racing your
weakest open world:

| driver | races to open all 21 | fewest worlds open at once | ever stuck? |
|---|---|---|---|
| wins every race (3★) | 6 | 3 | no |
| podiums only (2★) | 9 | 3 | no |
| finishes only (1★) | 18 | 3 | no |

The last world costs 19 of a possible 63, so a third of the roster can go
unraced and the finale is still reachable.

### Career order is the LEVELS array, not the world ids

A world opens only on a **podium (top 3)** finish on the one before it in
career order — and career order is the order of the `LEVELS` array. Those were
the same thing as `id - 1` until ROCKFALL RAVINE moved, so `isLevelUnlocked`
now walks the array (`_prevLevel`) instead of doing arithmetic on ids. **Ids
stay fixed**: saved careers key off them, preview art is `w{id}.jpg`, the
`DEMANDS` table is keyed by id, and `?level=` resolves by id so every existing
link still lands on the world it always meant.

Two consequences to keep in mind when reordering again:

- Menu cards group by **region**, which no longer matches career order. A
  locked card therefore states what opens it (`PODIUM <world>`), or the player
  is left hunting.
- `levelIndex` is a position in the array; `career.finished` is keyed by id.
  Never mix them.

**ROCKFALL RAVINE was moved from career slot 10 to slot 18.** Measured across
all 21 worlds, it is the hardest circuit in the game: **25.8 %** of its lap
sits under a 40 u corner radius and **14.3 %** under 25 u — both the worst
figures on the roster, ahead of GOTTHARD (22.9 / 11.8) and TREMOLA
(21.3 / 10.8) — on the tightest median radius (**87 u**). It is also one of
only five worlds with solid cliff walls, and one of only two that combine
walls with a live falling hazard (the other, GLACIER'S GRIND, is far more open
at 15.1 % tight). Sitting at slot 10 of 21 behind a podium gate, the game's
hardest circuit blocked the entire back half of the career. The track itself is
unchanged — its difficulty is its identity, and it now sits where that
difficulty belongs, as the technical exam before the alpine finale.

Note for anyone re-measuring this: **AI attrition is not a difficulty proxy.**
Rival cars are clamped to the road on every level (`vehicles.js`, "AI safety
net"), so they never touch the cliff walls that punish a human. Measured over
an identical window the AI lost 4 hull on ROCKFALL RAVINE and 17 on CANYON RUN,
which says nothing about either track. Judge these from track geometry.
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

The chase cameras additionally damp their own yaw (3.6/s) toward a blend of
heading and travel direction, so flicks and drifts no longer whip the view —
that whip was what made the 3D views hard to drive.

### The six camera views

| View | back | height | elevation | distance | notes |
|---|---|---|---|---|---|
| **TOP-DOWN** | 20 | 52 | 69° | 56 u | the default |
| **TOP FAR** | 24 | 84 | 74° | 87 u | the whole corner at once |
| **TRAIL** | 21 | 26 | 51° | 33 u | **for spotting solids.** From overhead a boulder is a flat disc — no side face, no useful shadow, and the car is small enough that judging a gap is guesswork. At 51° every solid shows its side and its cast shadow, and the car is roughly twice the size |
| **CHASE** | 17 | 11.5 | 34° | 21 u | bumper height |
| **CHASE FAR** | 26 | 17 | 33° | 31 u | bumper height, further out |
| **DRIVER** | −0.42 | the car's own roofline | — | 0 u | the driver's seat |

`chase: true` (TRAIL and both CHASE views) takes the damped travel-direction
yaw; without it the camera sits on the RAW heading and whips on every flick,
which is only tolerable from near-overhead.

### DRIVER'S VIEW is not a short boom

`driver: true` sends `_updateCamera` down a separate path (`_driverCamera`).
None of the machinery the five boom views share applies to it, because all of
that machinery exists to keep the line between a distant lens and the car clear
— of hillsides, cliff faces and pine trunks. From the seat there is no such
line: the lens *is* the car. Run on it, the ground-clearance rule lifts the eye
over the hill in front and puts it on the roof.

What it does instead:

- **The eye is read off the car, not written down.** `userData.rig.capTop − 0.25`
  — the roster runs 2.5–3.5 u tall, so a constant seats a BRAWLER driver at
  chest height and a SLEEK driver through the roof. 0.42 u ahead of the car's
  centre, i.e. in the cabin. `h`/`back` in `CAM_MODES` are the fallback and what
  `_watchCarVisible` re-seats with.
- **The player's own car is not drawn.** Measured at 430x932 on PINE VALLEY in
  a BRAWLER, the bodywork filled the bottom **32%** of the frame — a black bar,
  a white sponsor decal reading APEX in mirror writing, then the bonnet — and
  the road vanished behind it at 68% of screen height. The bodies are authored
  to be seen from outside: the decals are one-sided and face away, and the
  styles carry roll cages, roof spares, jerry cans, exhaust stacks and a ladder,
  none of which have an inside. Only the PLAYER's mesh is hidden; every rival
  stays drawn, and `syncMesh` restores it on the next frame after a view change.
- **Rigid mount, no positional lerp.** A lerped eye inside a cabin swims, and
  swimming at 55 u/s on a 430 px screen is nausea. Everything that moves is a
  small bounded offset on top: ±0.16 u fore/aft and ±0.10 u vertical of head
  mass under acceleration, ±0.20 u of lean under lateral load.
- **Yaw is the car's heading**, a third of the way blended toward the travel
  direction so a slide shows where the car is actually going, damped at **14/s**
  — not the chase family's 3.6. A boom may lag turn-in because you can watch the
  car rotate under it; from the seat, lag reads as disconnected steering.
- **Pitch follows the ROAD.** The look-point takes the height of the centreline
  34 u up the lap, so a crest and a compression both stay full of road, then is
  clamped to a cone of 5.9° up / 17.7° down. Up is tight because sky is never
  information.
- **Its own lens**: base FOV +6 and nearly double the speed stretch
  (`spdFov` 11 against 6). With no boom, pace has to be sold by the frame, and
  the width buys back the peripheral road a cockpit loses by sitting 12 u
  closer to it than CHASE.
- **Bank comes from the body**, measured as how far the car's up-vector leans
  toward the camera's right rather than read off `mesh.rotation.z`, which is an
  Euler component in the car's own frame. That carries the ground camber, which
  is the one cue a fixed eye loses when the bodywork leaves the screen.
- **Impact shake is halved.** 1.6 u of jitter on a 20 u boom is a wobble; the
  same figure on an eye already inside the cabin makes the road unreadable
  exactly when you have just been hit.
- **`_watchCarVisible` skips it.** Not seeing your own car is the feature here,
  and the watchdog would otherwise fire once a second forever and yank the eye
  back onto a boom. The half of it that still means something — the car being
  under the ground — is kept.
- **It costs what the scenery costs, and that is worth watching on a phone.**
  Draw calls, 12 matched samples a lap, CHASE -> DRIVER: PINE VALLEY 211 -> 249,
  SAFARI PLAINS 218 -> 168, COL DE TURINI 196 -> 192, GOTTHARD CLIMB 242 -> 211.
  No systematic penalty in the mean — but both views are wildly position
  dependent (chase spans 120-737 calls, driver 88-661), and at a few specific
  places the low eye is much dearer: PINE VALLEY sample 600 is 152 -> 543.
  Cause, measured by frustum census at that sample: meshes in frustum 149 ->
  472, of which loose `BoxGeometry`/`MeshStandardMaterial` scenery goes 54 ->
  254. A boom 15 u up and tilted 34 degrees down clips the far ground out of
  frame; an eye at 2.7 u looks along a long shallow wedge that sweeps in every
  piece of un-instanced roadside furniture for hundreds of units. This is a
  content-density property the view SURFACES rather than one it creates — the
  fix is batching that furniture, not moving the camera.

**Switching**: the 👁 button on the HUD (`.icon-btn`, third in the top-right
stack, lit while active), `V` on a keyboard, `DRIVER'S VIEW` in the pause menu,
or the 📷 cycle, which reaches it last. The button is a *toggle* and remembers
which boom you came from, because six taps in and four out is not a switch you
use mid-corner.

**`cliffLift`** — any low view is a poor fit for a walled canyon: `clampCam`
stops the camera passing *through* rock, but on the outside of a bend the face
sits in the sightline and eats the road ahead (measured on CANYON RUN: TRAIL
saw about half the road TOP-DOWN did from the same spot). Modes carrying
`cliffLift` rise by that much on `cliffWalls` worlds — TRAIL by 11 — so they
stay usable everywhere instead of being unusable on a third of the roster.

### Steering is scaled to the view you are driving in

From above, a yaw change moves the car against a fixed world. From behind, the
camera yaws *with* the car, so the whole scene swings and every correction
overshoots — the reported symptom is "way too sensitive". The player's steering
rate is therefore scaled per camera: **TOP-DOWN / TOP FAR ×1**, **TRAIL ×0.9**,
**CHASE ×0.76**, **CHASE FAR ×0.84**. The AI is never scaled.

The scale **fades in with speed** (none below 6 u/s, full by 18 u/s), and that
is load-bearing, not polish. GOTTHARD, FURKA and SUMMIT carry ~5 m hairpins that
already ask for full lock; measured, a flat cut put several of them beyond what
the car can physically turn. Twitchiness is a fast-road problem and gets a
fast-road answer — at hairpin speed the chase views keep 98% of their lock.

The touch joystick's steer axis runs an expo curve on top (`0.42a + 0.58a³`
over a 62 px travel radius, throttle and brake stay linear). Linear travel spent
the entire useful range in the first few millimetres of thumb; half travel now
yields ~0.22 steer instead of ~0.53, and full lock still arrives at full
deflection. A player who wants the old rate back sets `STEERING: SHARP` (×1.25).

`JOYSTICK` (Setup tab, touch devices only) is the fine adjustment: a 50–180%
slider, default 100%, stored as `ir-joysens`, multiplying the expo curve before
the clamp. Below 100% the thumb travels further for the same lock; above it,
less. It applies live while you drag it.

### Two control schemes, and the player picks

`CONTROLS` (Setup tab and the pause menu, touch only, stored as `ir-controls`):

- **ONE THUMB** — the pad does everything: left/right steers, up/down is
  throttle and brake.
- **TWO THUMB** — the left pad steers and *nothing else* (`input.steerOnly`
  clamps the knob to a horizontal rail), and the right thumb works GAS and
  BRAKE pedals. The pedals ride the existing `data-key` plumbing on
  ArrowUp/ArrowDown, so the scheme adds no new input path. `body.two-thumb`
  moves the weapon cluster up a row to free the bottom-right corner.

Both schemes are switchable mid-race, because you find out a scheme is wrong for
you while driving, not before. `tests/test-transitions.mjs` and the HUD layout
audit check both schemes at portrait, narrow and landscape sizes: no two touch
controls may overlap, and none may sit off screen.

### Jumps are part of the road

Every world gets `rampCount + 3` crests (4–6 in practice, was 2–4), each with its
own rolled height (~2.1–4.6 u) and length (~15–33 samples) so a short sharp
launch and a long floating brow are different jumps rather than one repeated.
They are baked into the elevation profile, not bolted on, so taking one slowly
just rolls over it. If a circuit is too twisty to offer straight windows, the
straightness limit relaxes until the quota fills — PINE VALLEY was shipping a
single jump a lap under the old "stop at two" rule. Measured at racing speed,
33 of 35 crests across seven worlds put the car in the air (0.1–4.5 s).

## 9a. Which car for which world

The worlds reward different machines, and that falls out of the physics rather
than being a label on top of it. Two mechanisms do the work:

1. **Gradient** already scales with a car's own top speed and the grade force
   (`GRADE = 16`), so steep worlds separate the machines by themselves.
2. **Surface** did not. The snow/wet penalty was a flat multiplier, so every car
   in the game slid identically on ice and `OFF-ROAD` only ever meant "copes in
   the grass". It now buys back part of the loss:
   `keep(base) = base + (1 − base) × 0.62 × offroad`. On snow the DUNE (1.0)
   runs 0.83 of dry grip where the CROWN (0.42) runs 0.67 — a 24% difference.
   On dry the base is 1, so the term vanishes and nobody gains anything.
   Rivals use a fixed 0.7; the grid is balanced by `aiSpeed` and the rubber band,
   and giving them the player's spread would only add noise.

**The rating shown in the menu is NOT a simulated lap.** That was tried first
and thrown away: two different autopilots produced opposite rankings on the same
world — one put the DUNE first at FROST PEAK, the other put it last, and five
worlds failed to complete at all. A crude driver's lap time measures the driver.

`paceEstimate(car, track)` instead walks the real centreline and takes the lowest
of the three limits the integrator actually imposes, using that car's constants:
the slope-aware speed cap, the steering-authority limit against the corner's
curvature, and the speed at which the sustained slide (`v²k / grip`, with the
surface term above) still fits inside the road. Deterministic, driver-free, every
term traceable to a line of `vehicles.js`. Acceleration is a transient and is
deliberately not modelled; the UI never claims otherwise.

Catalogue stats are **orthogonal on purpose** — each machine maximal on one axis
and clearly weak on another — because a car that is good at everything makes the
rest of the garage pointless. Measured across all 21 worlds: PIT-99 quickest on
8, DUNE 5, SLEEK 5, ALPINE 2, CROWN 1, BRAWLER 0. The BRAWLER never winning is
correct: it is free, and being beaten everywhere is the reason to upgrade.
`tests/test-affinity.mjs` fails if any car you can *buy* stops being the right
answer somewhere, or if the world-character table drifts from the real geometry.

## 9b. Nothing may reload the page

Every screen transition is IN PLACE. A reload throws away the module graph, the
WebGL context, every compiled shader and the whole world in order to change what
is usually one boolean — a second of white screen on a phone, every time.

| Transition | Mechanism |
|---|---|
| Track pick | `swapLevel()` |
| RACE / FREE ROAM / MISSIONS | `setMode()` → `_rebuildModeWorld()` |
| Car pick | `swapPlayerCar()` |
| Pause → EXIT, results → GARAGE, mission debrief | `showMenu(tab)` |
| Results → NEXT LEVEL | `swapLevel()` + `startRace()`, score carried in memory |
| Profile create / switch / delete, career reset | `_applyProfileInPlace()` |

`fadeTo()` survives only as a fallback for the cases the UI cannot reach (a swap
declining mid-race). The address bar is kept in step with `history.replaceState`
via `_softURL()`, so a refresh or a shared link still lands where the player is.

`worldLayer` is torn down by a LEVEL swap, never by a MODE swap, so everything
mode-scoped (gun nests, roam stars, mission gates, choppers) must be removed by
hand in `_rebuildModeWorld()`. `tests/test-transitions.mjs` cycles the modes 36
times and fails if the world layer or the light count has moved.

## 9c. Never compile a shader during play

WebGL links a shader program the first time a material is drawn, on the main
thread, and nothing else happens until it finishes. Measured on this game: one
render call that introduced 16 new programs blocked for **1083 ms**. Three rules
follow, and all three were broken at once in r49:

1. **Warm the cache at boot.** `_warmShaders()` unhides the whole graph for the
   length of one `renderer.compile()` (compile does not draw) so every hidden
   transient — bullets, sparks, smoke, husks, debris — is compiled while the
   title screen is up. Re-run after every `swapLevel()`.
2. **Never change the light count during play.** It is part of every material's
   cache key, so adding one light recompiles the ENTIRE scene. Explosion flashes
   are a fixed pool of 4 `PointLight`s created once and parented to the *scene*
   (not `worldLayer`, which a track swap would take); a flash sets a position
   and an intensity. They used to be constructed per explosion — and leaked,
   because they were added to `worldLayer` and removed from `scene`.
3. **Never toggle `castShadow` on a light during play.** Same reasoning: the
   shadow-caster count is in the cache key. The auto-quality ladder shrinks the
   shadow map (`mapSize` 512 + drop the map) instead, which costs one texture
   reallocation and no shader work.

Measured after: 3 minutes of continuous fire, p50 8 ms, p99 18 ms, worst frame
45.8 ms, **zero** frames over 100 ms. Before: two frames over 1.2 s.

## 10. Difficulty & rival balance

The three difficulties differ in pace, aggression, how hard the rubber band
pulls, whether rivals carry rockets, and how much hull damage the player
actually absorbs.

| Difficulty | aiSpeed | aiCorner | aiAggression | rubberBand | Rockets fired at the player | Player hull intake |
|---|---|---|---|---|---|---|
| EASY | ×0.90 | ×0.85 | ×0.65 | ×1.25 | **never** | ×0.45 |
| NORMAL | ×1.00 | ×1.10 | ×1.00 | ×0.95 | **~0.7/min** — first at 24 s, budget 1 per 85 s | ×0.62 |
| HARD | ×1.15 | ×1.60 | ×1.40 | ×0.15 | **~2–3.3/min** — first at 8 s, budget 1 per 20 s | ×0.85 |

**`aiCorner` exists because `aiSpeed` is a weak lever.** A rival's pace is set by
its braking model, not its top speed: it corners at `vMax = sqrt(aLat /
curvature)`, and `aLat` carried `aiSpeed`. Under that square root, raising
aiSpeed 16 % bought 7.7 % of corner speed — measured, exactly the +7 % of race
distance it produced. Pushing aiSpeed far enough to matter would have made
rivals quicker in a straight line than any car in the garage (rival base 53–60,
player cars 54–63). So top speed and cornering are separate knobs: `aiSpeed`
stays near the player's range, `aiCorner` multiplies the lateral grip budget and
is what actually makes a tier fast, because corners are where the time is.

**The rubber band used to cancel the difficulty knob.** It ran backwards against
`aiSpeed` — EASY carried the biggest catch-up boost and HARD the smallest — so
at the moment the player was leading, which is exactly when a difficulty setting
is supposed to bite, the three tiers converged to within **11 %** of each other
against a nominal spread of 25 %. Measured over 70 s, the best HARD rival was
only 15 % quicker than the best EASY one, and a stand-in player holding
**three-quarter throttle finished P1 of 6 on all three tiers**. Both knobs now
point the same way: HARD races to its own pace (band nearly off — a mistake is
not repaid), EASY keeps its strong band because that is what makes it forgiving.

**`hullMul` was never a field.** Earlier versions of this table listed it as a
difficulty property; it does not exist and never did. The scaling lives inside
`Car.damage()`, and `knockStone` read `this.difficulty?.hullMul ?? 0.62`, so
**rock damage was applied at the NORMAL rate on every difficulty**. Fixed in r87
by routing that path through `damage()` — the intake column above is now true for
rocks too, not just for crashes.

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
| **Rival pace rises with tier** | strict ordering | PINE VALLEY 1330 < 1491 < 1707; FURKA 945 < 1087 < 1210 |
| **EASY→HARD rival spread** | ≥ 20 % | **28 %** on both worlds (was 15 %) |
| **HARD punishes a sloppy lap** | a 75 %-throttle drive must not stroll away | rival best within 2 % of the player, P1 by 23–24 samples (was P1 by 126) |
| **HARD still winnable clean** | yes | full throttle wins by 139–297 samples |

The last three are enforced by `tests/test-difficulty.mjs`, which reads the
shipping `DIFFS` table via `window.__DIFFS` rather than a copy, and asserts the
SHAPE of the ladder rather than distances — terrain differs per world, so a
distance target would be a change-detector. Its player stand-in drives a perfect
line and never lifts, so its absolute margin flatters it; the rival-to-rival
comparison is the honest half and is what the ordering checks rest on.

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
