# Engine decision, and the migration

> **STATUS: SETTLED. The engine is `dustline/`.**
>
> This document made the case for moving off hand-rolled physics to Rapier +
> TypeScript. That case was accepted and the argument below still stands — but
> the code that carried it out is **not** the `v2/` tree this document
> describes. `v2/` has been **deleted**, along with its built output in
> `play-v2/`, and every `v2/…` path named below is gone with it.
>
> **`dustline/` is the game under active development.** It is TypeScript +
> Vite, Rapier under a raycast car, and it reaches the conclusion this document
> argued for by a different road. Read sections 1–3 for *why* the move was
> right; read `ARCHITECTURE.md` §5.4 for what is actually next.
>
> The phase log at the end is kept as a record of what was learned, not as a
> plan. It is marked accordingly.

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

## Phases — HISTORICAL RECORD of the deleted `v2/` tree

**None of the code or paths below still exists.** `v2/` was removed when
`dustline/` became the engine. This section is kept because the *findings* cost
real effort and remain true of any engine this project builds; the file paths
are retained verbatim so the record stays checkable against git history rather
than being quietly reworded into something that never shipped.

Three things here are worth carrying into dustline, and are listed as work in
`ARCHITECTURE.md` §5.4:

1. **Seeded RNG per stage, in named channels**, with a guard that turns an
   unseeded call into a build failure. Determinism is cheapest to add before
   there is content, and v1 proves what it costs to add after.
2. **A stage lint that runs on boot and prints its verdict**, so a malformed
   course fails loudly instead of subtly.
3. **A content fingerprint that must never change**, which is what turns "did
   this refactor alter the world?" from a judgement call into a test.

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

~~Live at **/racing-shooter/play-v2/**~~ — that build has been deleted and the
URL no longer resolves. v1 was untouched by this work and was on r77 at the time.

Ten defects were found and fixed on the way, all by measurement rather than by
reading code — a transposed Rapier heightfield, persistent forces integrating
into a catapult, an inverted damper sign, a doubly-negated tyre force, missing
reflected engine inertia, a centre of mass 50% too high. Each is written up in
`v2/PHASES.md`, along with the gaps that are absent rather than pretended.

**Phase 3 — stages. NEVER BUILT.** Point-to-point courses, sectors, reset nodes,
corner grading feeding auto-generated pacenotes. Progression reworked off laps.

**Phase 4 — the bible. NEVER BUILT.** Region palettes, lighting to five
decimals, archetype architecture, scatter densities, and the R01–R12 region lint.

Phases 3 and 4 were planned for `v2/` and never reached it. dustline arrives at
the same place from its own spec (`dustline/CLAUDE.md`, milestones M1–M8) and is
at M3; its equivalent of Phase 3 is M5–M6.

## The rule for every phase

Ship it, gate it, and never claim what has not been measured. That has been the
only thing keeping this codebase honest, and a new engine does not change it —
nor does deleting one. This document was rewritten rather than deleted for
exactly that reason: the record of a path not taken is worth more than a clean
file, provided it is labelled honestly as a path not taken.
