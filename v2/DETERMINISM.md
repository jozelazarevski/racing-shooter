# Determinism — Phase 0

> `RALLY_RULES` N4: *All randomness comes from one seeded PRNG per stage. Same
> seed produces the same world, byte for byte.*
> `RALLY_RULES` §14.3: *One seeded PRNG instance per system: `scatter`,
> `weather`, `ambient`, `damageRoll`. Never share.*

This is the first thing built in `v2/`, before any engine work, for one reason:
**it is what turns "I cannot reproduce it" into a test case.**

## Why this came first

Four bugs are open against the shipped game — the car sinking into the road,
the hanging bridge floating, waterfalls running at an angle, the body not
following the ground inclination. Every one is stuck at the same place: I know
the mechanism, I cannot make it happen on demand.

That is not bad luck. v1 calls `Math.random` **778 times** across the world
builder:

| module | calls |
|---|---:|
| `track.js` | 302 |
| `textures.js` | 174 |
| `particles.js` | 156 |
| `main.js` | 64 |
| `vehicles.js` | 52 |
| everything else | 30 |

So every load builds a different world. Measured on the live game, one world's
crest count moved 6 → 0 across two builds with no code change. Several of this
project's own measurements were wrong because of that noise. Determinism is not
a nice-to-have here; it is the precondition for debugging anything.

## What exists now

```
v2/src/core/rng.ts        xoshiro128**, forks, snapshots, distributions
v2/src/core/stageRng.ts   one PRNG set per stage, four spec channels, guard
v2/src/world/scatter.ts   the first consumer — spec-conformant scatter
v2/src/tools/dumpWorld.ts the reproduction CLI
```

58 tests, `npm run gate` (typecheck + suite) in about 4 s.

## How to use it

```ts
const stage = new StageRng('ouninpohja');   // seed derives from the NAME

const trees  = stage.scatter.fork('trees');
const rocks  = stage.scatter.fork('rocks');
const rain   = stage.weather;
```

Three rules, and they are all load-bearing:

1. **Take a channel, never a shared stream.** `scatter`, `weather`, `ambient`,
   `damageRoll`. They are independent by construction — draining `weather`
   cannot move a tree, which is what makes a scatter bug attributable.
2. **Fork per pass, by name.** `stage.scatter.fork('trees')`. Forks derive from
   *(seed, label)*, never from the parent's live position, so adding a fence
   pass tomorrow does not move a single tree. Without this, determinism is
   technically true and practically useless: every new draw call reshuffles
   everything after it and no world diff is ever readable.
3. **Never call `Math.random` in a build.** Wrap stage construction in
   `withoutMathRandom(...)` and it throws with a stack pointing at the
   offender. v1 reached 778 calls one honest line at a time, and no reviewer
   was ever going to catch the 779th.

### Reproducing a world

```
$ npm run world -- ouninpohja
stage        ouninpohja
seed         1293828207
objects      47886
draws        {"scatter":298696,"weather":0,"ambient":0,"damageRoll":0}
fingerprint  d23ff6de
```

Same fingerprint on every machine, every run, forever. `--json` dumps the
objects for diffing. A changed fingerprint with no intended change **is the
bug**, ahead of whatever bug you were chasing.

## Design notes worth knowing

- **xoshiro128\***, not `Math.random` (unseedable), not an LCG (visible lattice
  structure in 2D — scatter would sit on diagonal lines), not a 64-bit design
  (doubles cannot hold 64-bit integer state exactly, which is the exact
  reproducibility hazard this file exists to remove). All state is uint32, so
  no floating-point rounding enters the stream on any platform.
- **Golden vectors are pinned** in `rng.test.ts`. If one fails, the algorithm
  changed — that is either a bug or a deliberate `SEED_EPOCH` bump, never
  something to fix by re-recording the expectation.
- **`int()` uses rejection, not modulo.** `next() % 5` is biased toward the low
  buckets, and with five tree species that is a visibly wrong forest.
- **Rejected placements still consume their draws.** In `scatter.ts`, an object
  refused by the 1.2 m spacing rule draws its diameter, height, rotation, scale
  and mass anyway. Otherwise one extra neighbour at metre 40 shifts every
  object for the rest of the stage.
- **Snapshots carry the Box–Muller spare.** A restore that dropped it would
  give a different next `gaussian()` — a desync that would only surface minutes
  into a replay.

## Two defects this found in its own first hour

Worth recording, because they are the kind of thing determinism is supposed to
surface and it surfaced them immediately:

1. **Scatter density inverted the spec table.** §3.3 is *objects per 100 m²
   outside the roadbed* — one area basis for every tier. Crediting Tier 3/4
   with the full 22 m backdrop while Tier 0–2 got only the 2.4 m verge produced
   664 young trees against 191 large bushes, where the table specifies 0.8 and
   2.0 respectively. Now measured per tier by a test.
2. **`draws()` reported zero for a stage with 47,886 objects in it**, because
   passes take forks and forks were not counted. Fixed with `totalDraws` /
   `drawTree()`, which is also the tool for "which system moved" when a
   fingerprint changes.

## What Phase 0 does NOT do — stated plainly

- **The four open v1 bugs are not fixed, and not yet reproducible.** v1 is not
  seeded and v2 has no car in it. This phase builds the machinery; applying it
  is Phase 1 (world) and Phase 2 (vehicle).
- **v1 is untouched.** The shipped game at `/racing-shooter/` still runs r77
  with 778 unseeded draws. Nothing here changes it, and it stays playable for
  the whole migration.
- **Scatter covers §3.2 rules 1–3 only.** Rule 4 (apex occlusion) needs a
  racing line; rule 5 (canopy clearance) needs canopy geometry. Both are
  Phase 1. They are absent, not silently skipped.
- **The corridor in `dumpWorld.ts` is a placeholder shape**, not real stage
  geometry. It exercises the property; it is not a stage.
- **Physics determinism is not addressed.** N4 covers world generation; §14.1's
  fixed timestep and §14.2's input timestamping arrive with Rapier in Phase 2.

## The gate

```
cd v2 && npm run gate
```

Typecheck plus 58 tests. It is pure computation, so any flake is a real defect,
not a busy machine.
