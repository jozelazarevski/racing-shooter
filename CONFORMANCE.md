# Conformance against the RALLY specification

The normative documents now live in `spec/`:

- `spec/RALLY_RULES.md` — physics, collision, world structure, lint
- `spec/RALLY_WORLD_BIBLE.md` — appearance, regions, palettes, architecture
- `spec/rally.constants.ts` — machine-readable mirror of the rules
- `spec/biomes.constants.ts` — machine-readable mirror of the bible

Both documents declare themselves **normative**: "code that disagrees with this
document is wrong by definition". This file is the honest audit of where the
code stands against them, because a conformance claim without an audit is just
a promise.

## The headline, stated plainly

**The specification describes a different game from the one that exists.** Not a
better-specified version of IGNITE RALLY — a different one. The gap is not a
backlog of fixes; it is a rewrite. Every row below is a fact, not an opinion.

| | Specification | IGNITE RALLY today |
|---|---|---|
| Stack | TypeScript, **Rapier.js** physics, Vite | Vanilla JS ES modules, **custom arcade physics**, no build step |
| Timestep | Fixed **1/120 s**, 4 solver substeps, render decoupled | Variable, tied to `requestAnimationFrame` |
| Units | **SI throughout** — metres, kg, newtons | Arbitrary "units"; `segLen` ≈ 2.4 u, car ≈ 4.4 u |
| Course | **Point-to-point stages, 3.5–22 km** | **Closed lap circuits, ~1.1–2.8 k units, 3 laps** |
| Tyres | **Pacejka** curve per axis, friction ellipse, relaxation length | Scalar grip with slip/drift terms |
| Damage | **Joules**: `½ m v_n²`, five energy bands | Hull 0–100, tuned by feel |
| Determinism | **One seeded PRNG per stage**, byte-identical rebuilds | Randomised per load — measured, a world differs between two builds |
| Collision | Every object carries an explicit **tier 0–4**; untiered geometry is a build failure | Material tags (`stone`/`hut`/`metal`), no tier system |
| Co-driver | **Auto-generated pacenotes** from corner grade | None |
| Content | No weapons. Rally only | Cannon, missiles, mines, shockwave, choppers, hostiles, score combos |

Two of those are not gaps but **direct contradictions** with things this game
was explicitly asked for and built around:

1. **Weapons and arcade combat.** The spec's §17 says what the game is not, and
   nothing in either document has a weapon in it. IGNITE RALLY is a combat
   racer by request.
2. **Laps versus stages.** The whole progression — 3 laps, lap counter, rally
   stars, per-lap contracts — assumes a closed circuit. The spec assumes
   point-to-point.

I cannot follow the specification 100 % *and* keep those. That is a decision
only the owner can make, so it is recorded here rather than silently resolved.

## What can be adopted without contradiction, in order of value

These are real, and none of them fight the existing game:

| # | Item | Why it is first |
|---|---|---|
| 1 | **§9.4 angle-of-incidence bands** — graze / scrape / glance / impact / head-on with exact speed-loss and yaw figures | The game already computes an incidence term (r65). Adopting the spec's five named bands and its numbers replaces a hand-tuned curve with a specified one, and directly serves the reported "brush vs direct hit" complaint |
| 2 | **§1.3 corner grading G1–G6 by radius** | Purely additive. The measurement already exists (min radius per route); grading it gives every corner a name and unlocks pacenotes later |
| 3 | **§3.1 flora tiers 0–4 with trunk diameters** | Maps cleanly onto the existing tree/rock/hut classes and makes "what will this do to me" readable from silhouette, which is a stated design goal in both documents |
| 4 | **§5.3 bridge rules** — deck width, approach, rail gap, off-deck reset | The flying-bridge bug is open in `STRUCTURES.md`; the spec gives exact numbers to fix it against |
| 5 | **Region palettes and lighting** from the bible | The existing themes already have fog/sun/palette fields. Replacing hand-picked values with specified ones is a data change, not an engine change |
| 6 | **§15 stage lint** — the L01–L17 checks | The repo already has a test harness and gates every release. Lint checks are exactly the shape of work that has been working here |

## What cannot be adopted without a rewrite

`SIM.fixedTimestep`, Rapier, the Pacejka model, SI conversion, stages instead of
laps, and seeded determinism. Each of these is load-bearing for the others: SI
units without a fixed timestep buys nothing, and Pacejka without SI mass and
newtons is meaningless. They land together or not at all.

## Status

The documents are vendored, the gap is measured, and the two contradictions are
resolved in `MIGRATION.md` (weapons stay; stages replace laps at Phase 3).

**Landed — `v2/`, Phase 0: determinism.** N4 and §14.3 are implemented and
gated. One seeded PRNG set per stage, four independent channels, named forks,
state snapshots, and a `withoutMathRandom()` guard. `npm run world -- <stage>`
prints a fingerprint that is identical on every machine and every run.
Its first consumer, `v2/src/world/scatter.ts`, also implements §3.2 rules 1–3,
§3.3 biome density, the §16.1 object shape and lint checks L02 and L03 — so
item 3 of the table above (flora tiers) is partly done as a side effect.
58 tests; see `v2/DETERMINISM.md`.

**Not landed.** Everything else in both tables, including the four open v1
bugs. v1 still ships r77 with 778 unseeded `Math.random` calls and is untouched
by this work — deliberately, so it stays playable throughout the migration.
Determinism now applies to v2 world generation only, not to v1 and not yet to
physics (§14.1–14.2 arrive with Rapier in Phase 2).

Adoption continues at item 1 of the "can be adopted" table, each shipped and
verified the way every other change here has been.
