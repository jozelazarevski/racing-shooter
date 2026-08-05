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

**Phase 0 — determinism first.** One seeded PRNG per world, per `RNG_CHANNELS`
(`scatter`, `weather`, `ambient`, `damageRoll`). No engine change. This alone
makes every open bug reproducible, and it is the single highest-value change
available: it converts "I cannot reproduce it" into a test case. *Do this before
anything else.*

**Phase 1 — adopt the spec's numbers where the engine already agrees.** The
angle-of-incidence bands (§9.4), corner grades (§1.3), flora tiers (§3.1),
bridge rules (§5.3), region palettes, and as much of the L01–L17 lint as the
current world model can answer. No rewrite; hand-tuned curves replaced by
specified ones.

**Phase 2 — Rapier under the car, TypeScript at the edges.** Introduce Vite and
`tsc`, port `vehicles.js` to a Rapier rigid body on a heightfield collider with
the spec's fixed 1/120 s step and 4 substeps, SI units, and the Pacejka tyre
model. The rest of the game keeps running against a thin adapter. **This is
where the five bugs in the table above stop existing.**

**Phase 3 — stages.** Point-to-point courses, sectors, reset nodes, corner
grading feeding auto-generated pacenotes. Progression reworked off laps.

**Phase 4 — the bible.** Region palettes, lighting to five decimals, archetype
architecture, scatter densities, and the R01–R12 region lint.

## The rule for every phase

Ship it, gate it, and never claim what has not been measured. That has been the
only thing keeping this codebase honest, and a new engine does not change it.
