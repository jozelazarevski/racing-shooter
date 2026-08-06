# v2 — Phases 0 to 3

**Live: https://jozelazarevski.github.io/racing-shooter/play-v2/**

v1 is untouched and still live at `/racing-shooter/`. It stays that way for the
whole migration, exactly as `MIGRATION.md` promised.

```
cd v2
npm run gate       # typecheck + 121 unit tests
npm run lint       # build all six stages, run §15 against each, fail loudly
npm run build      # -> ../play-v2
npm run smoke      # drive every stage headless (needs a server on :8902)
npm run reference  # §15 L15: a full AI lap of every stage, measured
```

---

## Phase 0 — determinism. Done.

See `DETERMINISM.md`. One seeded PRNG set per stage, four independent channels,
named forks, a `withoutMathRandom()` guard. Every stage prints a fingerprint
that is identical on every machine and every run.

## Phase 1 — the specified world. Done.

| Spec | Where |
|---|---|
| §1.2 corridor bands — roadbed / shoulder / verge / barrier | `world/corridor.ts` |
| §1.3 corner grading G1–G6 by radius, with pacenote calls | `world/corridor.ts` |
| §3.1 flora tiers 0–4, trunk diameters, masses | `world/scatter.ts` |
| §3.2 placement rules 1–3 | `world/scatter.ts` |
| §3.3 biome scatter density | `world/scatter.ts` |
| §12 GPU instancing, chunked for frustum culling | `render/scene.ts` |
| §13 terrain gradient and camber limits | `world/corridor.ts` |
| §15 stage lint L01–L17 | `world/lint.ts` |
| §16.1/16.2 object and segment schemas | `world/scatter.ts`, `world/corridor.ts` |

Six stages — Ouninpohja, Col de Turini, Fafe, Monte Carlo, Safari, Sweet Lamb —
4.1 to 5.7 km, gravel, tarmac and snow. All six pass §15. The lint runs **in the
browser on every boot** and prints its result on screen, so a broken stage says
so rather than shipping quietly.

**A correction to the spec mirror.** §1.2 of `RALLY_RULES.md` defines five
bands; `rally.constants.ts` carried only two, with the **verge row missing
entirely**. That row is what separates "Tier 1 and Tier 2 only" from "Tier 3 and
Tier 4 allowed here and nowhere closer". Added per the constants file's own
rule — the document wins.

## Phase 2 — Rapier under the car. Done.

| Spec | Where |
|---|---|
| §14.1 fixed 1/120 s, accumulator, max 5 catch-up steps | `physics/world.ts` |
| §14.2 input sampled at physics rate | `core/input.ts` |
| §8 Pacejka Magic Formula per axis, friction ellipse, relaxation length | `physics/tyre.ts` |
| §8 load sensitivity, compound and weather factors | `physics/tyre.ts` |
| §5 springs, bump/rebound damping, bump stops | `physics/vehicle.ts` |
| §3 mass, CoG height, inertia tensor, aero, gearing | `physics/vehicle.ts` |
| §4 speed-sensitive steering with a rack rate limit | `physics/vehicle.ts` |
| §9.4 incidence bands, §9 damage in joules | `physics/vehicle.ts` |
| §6 air control authority and decay | `physics/vehicle.ts` |
| SI units throughout | everywhere |

### The five v1 bugs, as tests

`tools/smoke.mjs` boots every stage and asserts:

- **does not sink into the ground** — body 0.51 m above the surface
- **does not float above it** — same number, both bounds
- **all four wheels find the ground** — 4/4, compressions 0.07–0.09 m
- **rests still, does not launch itself** — vy 0.000 m/s
- **suspension carries the car, not the hull** — every wheel between 0.01 and 0.19 m
- **body attitude comes from the ground AT ZERO SPEED** — the one v1 could never
  do, because it derived pitch from climb rate

All pass on all six stages.

---

## What went wrong on the way, because it is the useful part

Every one of these was found by measuring, not by reading the code.

1. **The heightfield was transposed.** Rapier reads its buffer as a
   column-major matrix whose *first* index is z and second is x — the transpose
   of the natural layout. It builds without error and drops the car through the
   world. Settled with a ramp probe (`tools/hf-probe.mjs`) rather than by
   reading docs. The probe also needed `world.step()` first: Rapier's ray
   queries return nothing until the query pipeline has been built once.
2. **`addForce` is persistent in Rapier**, not per-step. Aerodynamic drag
   opposes velocity, so a car falling at 1 m/s gets a small upward force — still
   applied next step, and the next. At 120 Hz it reached tens of kilonewtons and
   threw the car 86 m up. The tell was that no wheel ever reported contact while
   the car was being launched, so it could not be the springs.
3. **The damper sign was inverted.** `F = k·x − c·ẋ` instead of `+`. A damper
   that subtracts energy became one that adds it; the car pitched, rebounded and
   bounced itself off the ground in half a second.
4. **The lateral tyre force was negated twice** — once in the slip angle, once
   in the Magic Formula. Sideways drift generated force that *reinforced* it.
   The car spun and rolled on every stage.
5. **Reflected engine inertia was missing.** A wheel is not 1.4 kg·m²; through
   first gear the engine adds ~10 more. Without it, full throttle from rest spun
   the wheels past the friction peak, the revs triggered an upshift, and the car
   sat at the start line in fourth gear doing 25 km/h.
6. **The centre of mass was 50% too high.** Taking mass from the hull collider
   put the CoG at 0.77 m against the specified 0.52 m, dropping the rollover
   threshold from 1.54 g to 1.04 g — below what a tarmac tyre generates, so the
   car tipped over in corners it should take. It also ignored the specified
   inertia tensor entirely.
7. **Stages crossed over themselves.** A 2D heightfield holds one height per xz.
   Col de Turini had two pieces of road 0.8 m apart horizontally and 23 m
   vertically, one of them necessarily hanging in mid-air. Lint check X04 now
   measures it, and the switchback helper keeps ladders even-numbered so they
   cannot march back over themselves.
8. **§3.3 density inverted the spec table** — 664 young trees against 191 large
   bushes where the table says 0.8 and 2.0 per 100 m².
9. **One instanced mesh per stage is never frustum-culled**, so every blade of
   grass behind the camera was still submitted: 1.09 M triangles. Chunked to
   300 m, it is 227 k.
10. **5,529 dynamic prop bodies ran at 1 fps.** Static colliders on one fixed
    body run at full speed.

---

## Known gaps — absent, not pretended

- **§5 anti-roll bars: FIXED.** The two failed attempts were both single-pass —
  a wheel read its partner's compression a step stale, and a 620 Nm/deg bar fed
  stale data oscillates whichever sign it uses. Split into a probe pass and a
  force pass so both compressions are current, and the bar became a spring
  between two known positions. Col de Turini no longer rolls the car.
- **Tier 3 does not fall.** §3.1 specifies "falls, momentum exchange"; here
  young trees are static colliders. Collision, tier and damage classification
  are correct — only knock-down is missing. Needs collider streaming.
- **Col de Turini rolled the test autopilot** in the switchbacks, and was
  reported as `KNOWN` by the smoke test. It was inverted steering, not the
  switchbacks; the KNOWN list is now empty. See Phase 3.
- **§15 L07, L10, L11, L13 and L15 are SKIPPED**, each with its reason printed.
  They need a ballistic launch model, water volumes, bridges and fauna. L12 —
  reset nodes — landed in Phase 3 and now passes on every stage. L15 is
  different in kind: it is a claim about a car driving, so the lint can never
  answer it and `npm run reference` does instead. A lint that returned green for
  a check it did not run would be worse than no lint.
- **§3.2 rules 4–5** (apex occlusion, canopy clearance) need canopy geometry.
  The racing line half of that arrived in Phase 3, so rule 4 is now reachable.
- **Region palettes are placeholders**, not the `RALLY_WORLD_BIBLE` values.
  Phase 4.
- **No progression across stages** in v2 yet. Weapons and a rival have landed;
  the career, the garage, upgrades and the 28 v1 worlds have not.
- **Content parity with v1 is a long way off.** v1 is ~13,000 lines: weapons,
  choppers, hostiles, traffic, 28 worlds, the rally-star progression, the
  garage, upgrades, audio, the offline PWA. v2 has none of it. What has come
  across is the *feel* layer — controls, cameras, the race — and the engine
  underneath. Content is the remaining migration, not a finishing pass.
- **Frame rate is unverified on real hardware.** The headless harness runs on
  SwiftShader, a software rasteriser, at roughly a third of real time. 227 k
  triangles and ~1.5 ms of physics per step should be comfortable on a GPU, but
  that is an expectation, not a measurement.

## The race slice — landed

A stage is now a race rather than a drive.

- **Countdown** — 3, 2, 1, GO. Brakes held, steering live so you can set up.
- **Clock in physics time**, not wall time, so a dropped frame or a background
  tab cannot cost you a run.
- **Sector splits every 500 m**, which is §1.1's definition of a sector, not
  three arbitrary thirds. Each split shows the delta against your best for that
  same sector, green or red.
- **Personal best per stage**, in `localStorage`. Survives a corrupt or blocked
  store rather than failing the race.
- **A rival** — same `Vehicle` class, same tyres, same physics; the only
  difference is who supplies the input. A rival on a different model would teach
  the player the wrong thing about grip. It runs a line 2 m off the centreline
  so it is not fighting you for the same piece of road on the start straight.
- **Results panel** with every sector, the delta to your previous best, and
  whether you beat the rival.
- **Recovery** — §7's 2.5 s on the roof, plus off-world and stuck detection.

`src/race/driver.ts` is the pure-pursuit controller the smoke test used to
prove the car was drivable. It earned promotion to being the rival: one
implementation, so the thing the tests exercise is the thing that ships.

Two more things found by measuring:

- **The car could drive off the edge of the world** and fall for ever. Measured
  on Safari, it reached 575 km/h straight down — which is exactly the terminal
  velocity the spec's own drag coefficient and 11 m/s² gravity imply, so at
  least the aerodynamics were right. Now caught and reset.
- **The final sector never recorded.** The finish fired at `length − 1` and
  closed the race before the boundary at `length` could be crossed.

### Known gap in the race — CLOSED, and it was not what it looked like

This section used to read: *"the AI cannot yet complete a full stage cleanly at
high skill... racing it over a whole stage is a driver-quality problem, not a
physics one."* Half of that was wrong. The AI could not complete a stage because
**the finish line was unreachable and the steering was inverted**, and no amount
of driver quality would have fixed either. See Phase 3 below. The rival now runs
the stage's racing line at skill 0.82.

## Controls and cameras — brought across from v1

Ported with their numbers, because every one was set in response to a specific
complaint about how v1 felt on a phone, and re-deriving them would mean
re-earning the same complaints.

**The pad.** Drag anywhere in the left half: left/right steers, up is throttle,
down is brake. The base re-centres wherever the thumb lands, so it works blind
and in either orientation.

- 62 px of travel to full lock. 52 px meant a thumb twitch was half a turn.
- 0.14 deadzone, so a resting thumb does not steer.
- An expo curve, `0.42a + 0.58a³`. Linear travel spends the whole useful range —
  the small corrections you actually make on a straight — in the first few
  millimetres of thumb. That is what "way too sensitive" feels like. Measured:
  half travel gives 0.218 of lock, not 0.5.
- **Sensitivity 0.5×–1.8×**, read live, stored. At 1.8× that same half travel
  gives 0.393.

**Two schemes**, stored per player:

- **One thumb** — the pad steers and drives.
- **Two thumbs** — the pad rails to horizontal and steers *only*; GAS and BRAKE
  move to buttons with the throttle held open. Without the rail, the same drag
  that turns the car also lifts off, which is exactly the coupling two thumbs
  exist to remove. Verified: in two-thumb, dragging the pad down does not brake.

**On-screen buttons** — CAM, RESET, HAND, plus GAS and BRAKE in two-thumb. Any
element with `data-key` behaves like that keyboard key, so keyboard, gamepad
and touch all arrive through one path.

**Six cameras**, v1's five plus BONNET, opening on CHASE:

| | back | height | look | notes |
|---|---:|---:|---:|---|
| TOP-DOWN | 20 | 52 | 7 | |
| TOP FAR | 24 | 84 | 1 | |
| TRAIL | 21 | 26 | 15 | exists to make rocks readable |
| CHASE | 17 | 11.5 | 19 | the default |
| CHASE FAR | 26 | 17 | 22 | |
| BONNET | −0.4 | 1.35 | 22 | |

v1's units and v2's metres are the same scale — a car is 4.4 u there and 4.2 m
here — so the figures transfer directly. Speed pulls the camera back and up
(`spdBack`, `spdH`), so the faster you go the further you see. Chase views take
the car's heading; the overhead ones take the damped direction of *travel*,
because at 50 m up raw heading whips on every steering flick. All of them are
yaw-only: following roll and pitch makes the horizon tumble over a crest and
the player loses the road, which is the one thing a camera exists to show.

## Graphics — the first pass toward v1

- **Wheel spray**, and it is not decoration. Which particle a surface throws is
  specified — `SURFACES[id].particle` is dust / stones / mud / grass / sand /
  snow / spray / splash — so this reads that field rather than guessing from a
  surface name. Rate scales with speed and much harder with §8's `utilisation`,
  which is literally "how far into the friction budget this tyre is". A sliding
  tyre throws visibly more than a gripping one, so you can *see* the limit
  before you feel it. One draw call, a ring buffer of 1,400 points, no
  allocation per particle — a GC pause is a physics spiral waiting to happen.
- **The car casts a shadow.** Only the car: a 4 km stage of shadow-casting trees
  is not a frame budget, and the car's own shadow is the one that matters — it
  is what tells you where you are about to land after a crest. The shadow
  frustum is 28 m across and follows the car, because one big enough to cover
  the stage would put 4 km into 1024 texels and smear.
- **A gradient sky dome** instead of a flat clear colour, which made every stage
  look shot against paper. Two stops, one inverted sphere, no texture. It is
  what makes the fog colour read as distance rather than as a grey wall.
- **ACES tone mapping and sRGB output.** Without them the specified palettes come
  out flat: a Lambert surface under a 2.3-intensity sun clips to white in linear
  space long before it should.

Measured after: 120–166 k triangles, 29–41 draw calls.

## Weapons — landed

`CONFORMANCE.md` settled the contradiction: §17 says the game has no weapons,
but nothing in the spec's physics, collision, surface, water, air or damage
model conflicts with a car that also carries a cannon. So weapons are an
**additive layer on a conformant core**, and the code keeps it that way:

- a hit is scored in **joules** and classified by `DAMAGE_ENERGY_BANDS_J` — the
  same currency a collision uses. A shell and a tree are the same kind of event
  to the damage model. The cannon's 0.9 kg at 400 m/s is 72 kJ, which lands in
  the "major" band against a 120 kJ terminal figure.
- what a hit *does* is decided by the object's **§3.1 tier**, the same table
  that decides what happens when you drive into it. Tier 4 is "hard static,
  full stop" and shrugs a shell off; Tier 1–3 break away. The world stays
  readable — silhouette tells you what an object will do whether you hit it or
  shoot it.

Shells are **raycast along the segment travelled each step**, not simulated as
bodies. At 400 m/s and 1/120 s a shell moves 3.3 m per tick, so a body would
tunnel through every trunk on the stage and a point test would walk straight
through a 0.24 m one. They also drop — about 1.4 m over the 420 m range, which
is what makes aiming a skill.

Recoil is real and correctly sized: 0.9 kg × 400 m/s is 360 N·s against 1230 kg,
about 0.3 m/s. Enough to feel at the limit, not enough to be a weapon against
yourself. Firing is stepped inside the fixed timestep, so a shell's flight does
not depend on the frame rate.

Verified end to end: fired at a Tier 3 trunk it hits, reports 72 kJ, removes the
collider, hides the instance and scores. Fired at a hillside it hits the
hillside — **you cannot shoot through terrain**, which cost me three confusing
test runs before I recognised it as the right answer.

## Phase 3, part one — the racing line, and three bugs it found

The plan for this round was "a better AI line". Building one meant driving the
stages end to end for the first time, and that turned up three defects that had
nothing to do with the AI and everything to do with the game.

### 1. Steering was inverted. All of it.

`ArrowRight` produced `+1`. The touch pad's rightward drag produced `+1`. The
camera swung right on `+1`. And `+1` turned the car **left**.

`steerAngle` is a rotation about the body's up axis. A positive rotation about
`+y` carries the car's local forward (`+z`) toward local `+x` — and with forward
at `+z`, the car's right is `−x`, because right = forward × up. So the geometry
meant "left" by the number every caller meant "right" by.

Measured rather than reasoned, because a sign argument is exactly the kind of
thing one talks oneself into: hold `+0.5` on Safari's opening straight at
93 km/h and the car moves **7.2 m toward −normal**, which is the driver's left.
`.probe/steer-sign.mjs` is four lines and settled it in one run.

**Why nothing caught it.** The only thing that had ever driven v2 was the smoke
test's autopilot, and that was inverted too — it steered away from every corner.
The check that should have failed, "an autopilot can keep it on the road",
allowed 25 m of drift over 12 s, and Sweet Lamb passed it at **24.3 m**. Col de
Turini, a col of hairpins, was slow enough to be recorded as a KNOWN issue with
a plausible explanation about cautious autopilots. It was not a cautious
autopilot. With the sign fixed, the same dummy finishes **0.2 m** from the
centreline on Col de Turini, the KNOWN list is empty, and the tolerance is 14 m.

### 2. The finish line could not be crossed.

The race reads progress from the driver's centreline cursor, so the number it
sees is a *segment's* distance — quantised to the 4 m grid, and therefore never
larger than `length − 4`. The finish fired at `length − 1`. No car at any speed
could ever cross it.

The first reference lap made it unmissable: 36 resets, all of them between
4,709 m and 4,713 m of a 4,719 m stage, the car reaching the end of the road and
being recovered onto it over and over while the clock ran. **v2 has never had a
completable race.**

The unit tests passed throughout, because they fed a continuous distance that
reached the stage length exactly. There is now a test that feeds the quantised
distance the game actually supplies, and it fails against the old threshold.

### 3. §1.3 runoff was built on the inside of every slow corner.

A hairpin gets 5 m of shoulder as runoff — the room a car that misses the corner
needs. Which shoulder was chosen by a `direction === 'left' ? 1 : 0` mapping,
written backwards in the builder; the L08 lint read the same inverted index, so
it agreed with the bug and reported a pass on every stage.

Measured by projecting the displacement across each corner run onto its entry
normal: the road bends toward the widened side. It was the inside — where no car
has ever left the road. The lint now derives the side from that measurement
instead of asking the code, and `corridor.test.ts` asserts it independently.

*A lint that shares its assumption with the code it checks is not a lint.*

### The line itself

`race/line.ts`. A minimum-curvature path inside the roadbed, found by
constrained Laplacian relaxation: move each point toward the midpoint of its
neighbours, clamp it back inside the road, repeat. Out-in-out is not written
anywhere — it is what the clamp produces, binding on the inside at the apex and
the outside at entry and exit.

Two things had to be got right:

- **The clamp has to be smooth.** §1.2 widths carry ±0.25 m of seeded jitter, so
  the raw limit rattles by a decimetre between points 4 m apart. Through a
  corner the line lies against the clamp the whole way and inherits the rattle —
  and a 0.1 m wobble over a 4 m baseline *is* a 320 m radius. It turned
  Ouninpohja's 140 m corner into a 116 m one and cost 10 km/h through every fast
  corner on every stage. A minimum filter followed by a blur is smooth and
  provably still inside the road, provided the filter radius is at least the
  number of blur passes.
- **Curvature is measured over a 2-segment stride, not post-smoothed.** Menger
  curvature through three points on a circle is exactly 1/R at any spacing, so a
  wider baseline is free on a real corner and divides the noise on a straight by
  four. Blurring the curvature afterwards would also flatten the peak at a
  hairpin, which is the one number the speed profile must not be optimistic
  about.

**The honest measurement of the geometry: it is worth almost nothing.** Ideal
time on the relaxed line against ideal time on the centreline, same profile:

| | centreline | racing line | gain |
|---|---:|---:|---:|
| Ouninpohja | 137.8 s | 137.8 s | 0.0 s |
| Col de Turini | 144.8 s | 143.6 s | 1.1 s |
| Fafe | 123.3 s | 123.6 s | −0.4 s |
| Monte Carlo | 206.5 s | 205.0 s | 1.5 s |
| Safari | 143.1 s | 143.2 s | −0.1 s |
| Sweet Lamb | 150.6 s | 150.0 s | 0.6 s |

A rally road is 4.5–8 m wide. After a car's track width and a margin there is
about ±1.2 m of freedom, and swinging across that costs more curvature in the
transition than it buys at the apex. So the line hugs the inside of tight
corners rather than sweeping out-in-out, and that is correct for this corridor
rather than a limitation to apologise for. **The improvement in the AI comes
from the speed profile, not the geometry.**

### The speed profile

Three passes over the line: the lateral friction limit at each point, a backward
pass so every point is slow enough for what follows, a forward pass under
traction and then power. It replaces "if the tightest grade within v² × 0.05 m
is slower than now, brake" — a horizon heuristic — with the exact answer to
where braking must start.

It also carries a **crest limit**, and that one was found by crashing. The first
profile limited lateral acceleration and nothing else, so it sent the car over
Ouninpohja's 240 m crest at 135 km/h. The crest's vertical radius is about 80 m:
v²/r is over 2 g, so the car was thrown into the air with every wheel unloaded,
drifted while it had no grip to correct with, and landed off the road. The
driver was blamed twice before the trace showed `grounded: 0` for half a second
in the middle of the excursion. The profile now caps vertical demand at 1.3 g —
a hop over a real crest, not a launch.

### The driver

- **Feed-forward plus feedback.** Pure pursuit alone does not steer this car: it
  is a *kinematic* law describing a car whose tyres do not slip, and on
  Ouninpohja's first fast corner it asked for 0.07 of lock where the corner
  needed about 0.13. The car ran wide while still under its target speed, which
  is what made the cause obvious. The command is now the angle the corner needs
  at this speed — `L·κ + K_us·a_y` — with pure pursuit correcting the rest.
- **It never asks for more lock than the tyre can use.** Beyond `L·a/v² +
  K_us·a`, more steering produces *less* grip, because the front slip angle is
  past §8's Magic Formula peak. Without the cap, a small drift at 135 km/h made
  the driver wind on half a turn and the correction became the accident.
- **§8's friction ellipse, applied by the driver.** Grip spent turning is not
  available for accelerating, so the throttle comes out in proportion to what
  the steering is using. Before it, the car was spending 63% of its friction
  budget on throttle alone at 135 km/h while asking for a correction as well.
- **Off the line, slow down.** The profile answers "how fast through this corner
  *on the line*" and says nothing about being three metres wide of it. Monte
  Carlo's snow hairpin: the car ran wide, held its 52 km/h because the profile
  still said 52, and hit a tree 4 m off the line. Lifting is the only control
  left once the steering is already saturated.

### §15 L15 — the AI reference lap, measured

`tools/reference-lap.mjs` and `npm run reference`. The static lint cannot answer
L15 and never will: it is a claim about a car driving a stage, and `lintStage`
has no physics. So the game answers it, with the same driver, the same line and
the same physics the player gets, and the harness reports it.

| | before | after |
|---|---|---|
| Stages completed | **0 of 6** | **6 of 6** |
| Total recoveries | — (none finished) | 21 |
| L15 clean (zero resets) | 0 | 1 — Sweet Lamb |
| Average | — | 80.8 km/h |

Before this round the AI could not finish a single stage. It now finishes all
six, at rally speeds, and one of them cleanly enough to pass L15 outright.

**The gap, stated plainly.** Five stages still need recoveries — 10 on Col de
Turini and 7 on Monte Carlo, the two switchback stages, and 1–2 on the others.
Every one is the same event: the car understeers wide at a hairpin exit on a
low-grip surface and hits scenery. L15 is therefore reported as **FAIL on five
of six stages**, with the metre mark of every recovery printed, and it stays
that way in the output until it is fixed. The lint still reports L15 as SKIPPED,
because the lint still cannot run a car.

## Phase 3, part two — §11, and what a specified reset costs

`race/reset.ts`. Reset nodes, the six triggers with their delays, the six rules
for what a reset does, and cutting. **L12 is no longer skipped**: every stage
now passes 17 checks instead of 16.

What was there before was one hand-written rule — if the car is upside down,
outside the world, or has not moved for four seconds, put it back two segments
*ahead* of wherever it stopped. None of that is in the spec. It could gain you
ground: two segments ahead of a car beached on the outside of a hairpin is past
the hairpin. And it cost nothing at all.

- **Reset nodes** every ≤120 m, placed on the straightest road the spacing
  allows. A node in the middle of a 20 m hairpin respawns you pointing at the
  apex with no run-up, so each node is the flattest segment in its window —
  flatness dominates the score, position breaks ties, and the spacing limit is
  never traded away for a nicer node. Under 20% of Col de Turini's nodes sit in
  anything tighter than a 40 m radius.
- **Upstream, not nearest.** A car that has just fallen off the outside of a
  corner is often physically closest to a node it has *not* reached. The
  respawn uses the driver's monotonic distance, which cannot be advanced by a
  car being thrown down a mountain.
- **Six triggers, six clocks.** Roof 2.5 s, out of bounds 2.0 s, off deck
  2.0 s, player 0.5 s, stuck 6.0 s under 0.5 m/s. One shared timer would answer
  "which trigger fired" with whichever was noticed first; a car on its roof at
  the bottom of a ravine should be recovered by the 2.0 s rule, not the 2.5 s
  one.
- **It costs 10 s.** Including the R key. A reset that is free is a teleport,
  and the fastest way round Col de Turini would be to press R at every hairpin.
- **Cutting**, §11.3: three wheels outside roadbed + shoulder for 1.2 s *with a
  forward exit*. The second half is what makes it a cut rather than a mistake —
  a car that runs wide, stops and rejoins behind itself has gained nothing and
  is not penalised. 2 s, escalating to 5 s on the third.
- **§11.2.4 immunity is read as DAMAGE immunity.** Taken literally, "collision
  immunity" would mean driving through scenery for 2.5 s after every reset,
  which turns a reset into a shortcut through a forest. The impact still
  happens and still slows the car; the joules do not count.

### Two bugs this uncovered, both about time and place

- **A backwards respawn broke the driver's cursor.** `locate` searches forward
  only, which is what stops a hairpin teleporting the cursor onto its other leg
  — and it made the cursor unable to follow a car legitimately moved back up to
  120 m. The driver kept steering for a point it had passed. Measured: Col de
  Turini reset at 2,261 m thirty-three times without moving. `seek()` now moves
  the cursor with the car.
- **`enforceWorldBounds` was fed a constant `dt`.** Every §11.1 trigger is a
  time, so a constant meant they ran at whatever multiple of real time the
  constant happened to be — three times fast at 60 fps, seven times fast in the
  headless harness, where "stuck for six seconds" fired after eight tenths of
  one. Fafe's smoke autopilot stopped at 128 m because of it. The parameter is
  now required rather than defaulted, so no caller can forget to measure it.

### The reference lap after §11, and an honest regression

| | after part one | after part two |
|---|---|---|
| Stages completed | 6 of 6 | **4 of 6** |
| Total recoveries | 21 | 12 |
| Clean (L15 pass) | 1 | 1 |
| Average | 80.8 km/h | 94.8 km/h |

**Two stages got worse, and it is the right kind of worse.** The old recovery
put the car *forward* of where it stopped, which walked it past obstacles it
could not drive past. §11.2's upstream respawn does not, so Col de Turini and
Monte Carlo now do what a deterministic car must: respawn, drive the same
corner the same way, beach in the same place, repeat. The harness detects that
and reports `RESET LOOP at 2,242 m` instead of a DNF that would read as though
the car had stopped there.

So the number that went down is the number that was being flattered. What the
AI cannot do is get round two particular hairpins, and it could never do it —
the old recovery was carrying it past.

**Grip was not the cause, and this was measured rather than assumed.** The
profile's friction fraction is not monotonic in outcome: at 0.75 Monte Carlo
went from 15 recoveries to 3 while Col de Turini got much worse (DNF at 1.25 km
against 2.26 km); at 0.85 both were worse than either. It stays at 0.92.

## Phase 3, part three — the rally

Six stages existed and each was a separate, forgetful event: drive it, see a
time, reload. `race/rally.ts` gives them somewhere to accumulate.

The design is not invented. It is **§11.2.6** — *"Damage is not repaired by a
reset. Only a service park repairs damage"* — taken seriously. That sentence has
no content unless damage survives the end of a stage; if it survives there must
be somewhere it stops surviving, and the spec names it; and if it accumulates
across an itinerary then §9's terminal band stops being an abstract ceiling and
becomes retirement.

So a rally is: six legs in order, a classification that is driving **plus every
§11 penalty**, damage carried from leg to leg, one service park that clears it,
and retirement at 120 kJ. Nothing here is a new mechanic — it is the ones
already built given consequences that outlive a single stage.

- The service park sits between Fafe and Monte Carlo, on the principle that the
  two stages most likely to destroy the car — the switchback ones — should not
  both fall on the same side of it.
- A stage you have already reached can be re-driven, and the itinerary says
  `practice — does not count` on the top panel while you drive it. The
  classification only counts the leg you are on.
- Corrupt storage starts a new rally rather than throwing, the same rule the
  personal best follows.

### Two bugs found by testing it

**A progression lock silently substituted a different stage.** `?stage=` for a
locked stage opened the current leg instead. `npm run reference` asked for six
stages, was handed Ouninpohja six times, and reported **"every stage passes
L15"** — a clean sweep in a run where five stages were never driven. It looked
like the best result the project has ever produced.

Two changes, and the second matters more than the first. A URL now opens any
stage that exists, because a lock on a query parameter is not access control and
the select already gates the UI path. And the harness now compares the stage it
was given with the stage it asked for and fails loudly on a mismatch: *a harness
that cannot tell it was handed the wrong subject is worse than no harness.*

**The steering pad covered the bottom-left controls.** `#pad` takes the left 52%
of the screen at `z-index: 3` so a drag can start anywhere; the panel holding the
stage select and the CONTROLS button had no z-index at all. The CSS comment two
lines above says those panels "re-enable pointer events" — they did, and it made
no difference. On a phone, that panel has never responded to a touch. Found by a
click that timed out with `#pad intercepts pointer events`.

## Next

1. **The two hairpins.** Col de Turini at ~1,220 m and Monte Carlo at 2,285 m.
   The car arrives, understeers into the bank and beaches with full lock on and
   the throttle open. The controller has no way out of that — a real driver
   would reverse, and there is no reverse gear.
2. **§3.2 rule 4**, apex occlusion, now that a racing line exists.
3. **Phase 4 — the bible.** Region palettes, lighting, archetype architecture,
   and the R01–R12 region lint.
