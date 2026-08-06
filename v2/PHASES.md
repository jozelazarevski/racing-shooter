# v2 — Phases 0, 1 and 2

**Live: https://jozelazarevski.github.io/racing-shooter/play-v2/**

v1 is untouched and still live at `/racing-shooter/`. It stays that way for the
whole migration, exactly as `MIGRATION.md` promised.

```
cd v2
npm run gate     # typecheck + 58 unit tests
npm run lint     # build all six stages, run §15 against each, fail loudly
npm run build    # -> ../play-v2
node tools/smoke.mjs   # drive every stage headless (needs a server on :8902)
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

- **§5 anti-roll bars are not implemented.** Two attempts made the car
  measurably *worse* than no bar: a wheel reads its partner's compression a step
  stale, and feeding that through a stiff bar oscillates. Left out deliberately.
- **Tier 3 does not fall.** §3.1 specifies "falls, momentum exchange"; here
  young trees are static colliders. Collision, tier and damage classification
  are correct — only knock-down is missing. Needs collider streaming.
- **Col de Turini rolls the test autopilot** in the switchbacks. Reported as
  `KNOWN` by the smoke test on every run so it stays visible.
- **§15 L07, L10–L13, L15 are SKIPPED**, each with its reason printed. They need
  a ballistic launch model, water volumes, bridges, reset nodes, fauna and an AI
  reference lap. A lint that returned green for a check it did not run would be
  worse than no lint.
- **§3.2 rules 4–5** (apex occlusion, canopy clearance) need a racing line and
  canopy geometry.
- **Region palettes are placeholders**, not the `RALLY_WORLD_BIBLE` values.
  Phase 4.
- **No weapons, no AI rivals, no progression** in v2 yet. They live in v1.
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

### Known gap in the race

**The AI cannot yet complete a full stage cleanly at high skill.** At skill 1.0
it crashes and beaches itself; auto-recovery gets it moving again, but a clean
AI run start to finish is not proven. The rival runs at 0.78, which is
conservative enough to be a fair pacer over the early sectors. Racing it over a
whole stage is a driver-quality problem, not a physics one, and it is the next
thing to fix.

## Next

**Phase 3 proper.** Reset nodes every 120 m (lint L12), a better AI line
(racing line rather than centreline + offset), and progression across stages.
