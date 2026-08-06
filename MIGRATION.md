# Engine decision, and the migration

## The judgement: yes, move to Rapier + TypeScript. Staged, not big-bang.

The deciding argument is not in the specification. It is this, from the owner:

> *"I keep on debugging the game non stop for things that can be obviously
> working."*

That is not a run of bad luck. It is the exact signature of hand-rolled physics,
and the evidence is this session's own bug list:

| Reported | Root cause |
|---|---|
| Car sinks into the road | Hand-written ground-follow eases toward a different height source when it thinks it is off-road |
| Car doesn't follow the inclination | Body pitch derived from **climb rate**, which is zero when stopped |
| Hanging bridge flies | Structure placed without checking the ground under it |
| Car jumps constantly | A launch heuristic reading vertical acceleration off a sampled surface |
| House standing on the road | Placement measured from one track index on a course that doubles back |

Every one is the same defect: **the game approximates something a physics
engine gives you as a consequence.** A rigid body resting on a heightfield
cannot sink into it, cannot float above it, and cannot fail to lie along the
slope — not because someone wrote code for those cases, but because there is no
representation in which they are possible. I have been writing, and debugging,
the cases.

Three further forces point the same way:

1. **Determinism.** `RALLY_RULES` N4 requires one seeded PRNG per stage,
   byte-identical rebuilds. Today the world is randomised per load — measured,
   a world's crest count moved 6 → 0 across two builds with no code change.
   That is *why* the sinking bug is still open: I could not reproduce it. Every
   probe in this repo has had to fight that noise, and several of my
   measurements were wrong because of it. Determinism is not a nice-to-have; it
   is the precondition for debugging anything.
2. **Types.** The spec is 400+ named constants with units. Vanilla JS has caught
   none of my unit and shape errors; TypeScript catches them at the keystroke.
3. **A specification to test against.** L01–L17 turn "does this feel right" into
   a build that fails loudly. This repo's gates have caught real defects every
   time they existed; the spec supplies sixteen more.

### What this costs, stated honestly

A rewrite of ~13,000 lines. It puts at risk the things that currently work: 28
worlds, the art direction, weapons, the rally-star progression, the offline PWA,
and every tuned feel value. A from-scratch restart that ships nothing for weeks
would be a worse outcome than the bugs.

So: **staged, with the current game playable throughout.**

## The two contradictions, resolved

`CONFORMANCE.md` put two conflicts on the table. Taking "adopt and redesign what
needs redesigning" as the instruction:

- **Weapons stay.** Nothing in the spec's physics, collision, surface, water,
  air or damage model conflicts with a car that also carries a cannon. §17 is a
  statement of *design intent for a rally sim*; the tiers, joules and incidence
  bands are indifferent to whether a projectile also exists. Weapons are an
  additive layer on top of a conformant core.
- **Stages replace laps, eventually.** This is a real redesign and it is
  correct: point-to-point is what makes pacenotes, reset nodes, sector timing
  and the 3.5–22 km lint meaningful. It lands in Phase 3, not before, because
  the progression and HUD are built on laps.

## Phases

Each phase ships, is verified, and leaves the game playable.

**Phase 0 — determinism first. LANDED.** One seeded PRNG per stage, per
`RNG_CHANNELS` (`scatter`, `weather`, `ambient`, `damageRoll`), living in `v2/`
alongside the untouched v1 game. No engine change. See `v2/DETERMINISM.md`.

- `v2/src/core/rng.ts` — xoshiro128\*\*, all-uint32 state, named forks,
  snapshots, unbiased `int()`, Box–Muller `gaussian()`
- `v2/src/core/stageRng.ts` — the four spec channels, independent by
  construction; content fingerprints; a `withoutMathRandom()` guard that turns
  the 779th unseeded call into a build failure
- `v2/src/world/scatter.ts` — the first consumer, conformant to §3.2 rules 1–3,
  §3.3 density and §16.1 object shape
- `v2/src/tools/dumpWorld.ts` — `npm run world -- <stage>` prints a fingerprint
  that must never change

58 tests, `cd v2 && npm run gate`. It caught two defects in its own first hour
(an inverted §3.3 density basis, and draw accounting that ignored forks) — both
recorded in `v2/DETERMINISM.md` rather than quietly fixed.

What it does *not* do: the four open v1 bugs are still open and still not
reproducible, because v1 remains unseeded and v2 has no car yet. Phase 0 built
the instrument; Phases 1 and 2 point it at the patient.

**Phase 1 — the specified world. LANDED.** Corridor bands (§1.2), corner
grading G1-G6 (§1.3), flora tiers and densities (§3), terrain limits (§13), the
§15 stage lint, and six real stages from 4.1 to 5.7 km on gravel, tarmac and
snow. The lint runs in the browser on every boot and prints its verdict on
screen. See `v2/PHASES.md`.

**Phase 2 — Rapier under the car. LANDED.** Fixed 1/120 s accumulator, input
sampled at physics rate, Pacejka tyres with a friction ellipse and relaxation
length, specified springs and dampers, the spec's mass and inertia tensor, SI
units, §9.4 incidence bands and damage in joules. **The five bugs in the table
above are now assertions in `v2/tools/smoke.mjs` and they pass on all six
stages** — including the one v1 could never do, body attitude taken from the
ground at zero speed.

Live at **/racing-shooter/play-v2/**. v1 is untouched and still on r77.

Ten defects were found and fixed on the way, all by measurement rather than by
reading code — a transposed Rapier heightfield, persistent forces integrating
into a catapult, an inverted damper sign, a doubly-negated tyre force, missing
reflected engine inertia, a centre of mass 50% too high. Each is written up in
`v2/PHASES.md`, along with the gaps that are absent rather than pretended.

**Phase 3 — stages. IN PROGRESS.** Point-to-point courses, sectors and
auto-generated pacenotes landed with the race slice. This round added the racing
line, its speed profile, and a driver that follows both — and in the course of
driving the stages end to end for the first time, found three defects that were
not about the AI at all:

- **steering was inverted**, on every input path, including the player's. `+1`
  meant right to the keyboard, the touch pad and the camera, and left to the
  geometry. Measured: hold `+0.5` at 93 km/h and the car goes 7.2 m the other
  way.
- **the finish line could not be crossed.** Progress is read from the centreline
  cursor, which is quantised to the 4 m grid and stops one step short of the
  stage length; the finish fired a metre short of the length itself. v2 had
  never had a completable race.
- **§1.3 runoff was built on the inside of every slow corner**, and the L08 lint
  read the same inverted index, so it agreed with the bug.

The AI reference lap (§15 L15) now exists as a measurement — `npm run reference`
— and went from **0 of 6 stages completed to 6 of 6**.

§11 followed: reset nodes every 120 m (**L12 now passes**, 17 checks a stage
instead of 16), the six triggers with the spec's own delays, respawn at the
nearest upstream node, a 10 s penalty on every reset including the player's own
R key, and §11.3 cutting. That took the reference lap back to 4 of 6, and the
regression is the honest kind: the old recovery moved the car FORWARD past
obstacles it could not drive past, and the specified one does not. What the AI
cannot do is two particular hairpins, and it never could.

Progression landed on the same principle: §11.2.6 says only a service park
repairs damage, which is only meaningful if damage outlives a stage. A rally is
now six legs in order, a classification of driving plus every §11 penalty,
damage carried between legs, one service park, and retirement at §9's terminal
band. Testing it caught a progression lock that was silently handing the
reference-lap harness the wrong stage — six requests, one stage, and a reported
clean sweep of L15. See `v2/PHASES.md`.

**Phase 4 — the bible. STARTED.** Region palettes, lighting and fog now come
from `RALLY_WORLD_BIBLE.md` rather than from six hand-picked hex values per
biome, and §5's region lint is implemented for the six checks answerable from
data. It immediately found nine failures across the bible's ten regions —
three saturation caps exceeded by the document's own palettes, six roads that
do not out-contrast their own terrain — none of which are fixed in code,
because §6 says a hex value changes in the document first.

Three things the renderer cannot honour are written down rather than fudged:
the exposure was being applied twice, `baseEV100` has no consumer in a
non-physically-based pipeline, and the lux ratios have to be bounded or Nordic
Winter clips to white. Architecture, water and fauna are still absent.

## The rule for every phase

Ship it, gate it, and never claim what has not been measured. That has been the
only thing keeping this codebase honest, and a new engine does not change it.
