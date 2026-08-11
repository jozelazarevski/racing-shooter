# REGRESSIONS — every defect that was fixed, and the check that keeps it fixed

This file exists because of one word in the complaint record: **"still"**.

> "I can still enter the mountains instead of hitting them" · "Still can enter."
> · "Still see the shark mountains there" · "I still don't see jumping across
> cracks and gorges." · "I don't see the new complex tracks."
> · "I keep on debugging the game non stop for things that can be obviously
> working." · "I waste too much time asking Claude Code to fix the worlds."

IGNITE RALLY's commit log records the same shape twice over — *"Reported twice
with the same photograph"*, *"Reported with a photograph taken from inside a
hillside: 'Still can enter.'"* Those are not separate bugs. They are **fixes
that did not hold**: a defect repaired in one code path and left live in a
second, or repaired and later regressed, with nothing standing watch either
way. r148 fixed mountain solidity — for the massif cones. The skyline stayed
bare on 51 of 60 worlds for five more releases, and every check in the suite
passed the whole time, because every check in the suite was looking at the
objects that already had colliders.

v1 ended up with 56 test files because 56 things went wrong. Every one of them
was written *after* an incident, and nothing forced it. So the convention is
written down here instead of hoped for:

> **A defect is not fixed until a named check will fail if it comes back, and
> that check runs in `gate` or `gate:full`.**

`tools/verify-regression-memory.mjs` reads this file and enforces exactly that.
It fails if a row names a check that does not exist, if a named check is not
reachable from `gate`/`gate:full`, or if a check-shaped tool exists in `tools/`
with no row here claiming it. Adding a row is how you close a bug; deleting the
check without deleting the row is how you find out you did.

## How to add a row

1. Fix the defect.
2. Write the check that fails when it comes back — measuring the built world,
   not restating the rule you just wrote. (`tools/components-smoke.mjs` learned
   that the expensive way: its first version restated the placement rule and
   passed happily with the builder deliberately broken to sink every boat.)
3. Wire it into `gate` or `gate:full` in `package.json`.
4. Add the row. The owner's words go in verbatim if the defect was reported;
   `—` if it was found by a tool rather than by a person.

## How it runs

`node tools/verify-regression-memory.mjs` has three checks. Checks 1 and 2 read
source and cost nothing; check 3 builds every committed track four times in a
headless browser and takes a couple of minutes.

```
node tools/verify-regression-memory.mjs --static        # 1 and 2, no browser — belongs in `gate`
npx vite build && node tools/verify-regression-memory.mjs   # all three — belongs in `gate:full`
node tools/verify-regression-memory.mjs --fingerprints  # print the full vs golden hash per track
```

`gate` does not run `npm run build`, so a plain invocation there measures
whatever happens to be sitting in `../play-dustline` — which is a check
reporting on a build nobody made, the exact shape of problem this file is
about. Wire the `--static` form into `gate` and the full form into `gate:full`,
which builds first.

## The register

| # | The defect, and where it came from | Reported as | The check that stands watch |
|---|---|---|---|
| 1 | **The horizon was scenery you could drive into.** IGNITE RALLY r148 fixed mountain solidity for the massif cones and left `_buildHorizon`'s rings and `_buildMesaHorizon`'s mesas registering **no colliders at all** — 3,464 bare instances across 51 of 60 worlds — for five more releases. Fixed in r153b. dustline had the same gap in its own tree and shipped `verify-solidity` because of it. | "I can still enter the mountains instead of hitting them" / "Still can enter." (with a photograph taken from inside a hillside) / "Still see the shark mountains there" | `tools/verify-solidity.mjs` |
| 2 | **Trackside furniture standing in the drivable lane.** BUGS.md #1: 211 colliders inside the advertised road width on 29 of 57 worlds, and 1,884 objects inside the clearance the road promises. One mistake made at eight call sites — each object pushed to a fixed lateral offset from *its own* centreline sample and never checked against the rest of the lap. Three of the eight sat directly beneath a sibling that called `_clearsRoad` correctly. | "I waste too much time asking Claude Code to fix the worlds." | `tools/verify-clearance.mjs` |
| 3 | **A hole in the road.** BUGS.md #7, RED CENTRE RUN: a jump gorge is a 190 u trench and the collapse was applied wherever the trench passed under the road, on distance alone. The lap met it twice, so one crossing got a designed jump and the other a bare 21.75 u drop. Road surface −0.4, ground under its own centreline −21.2. Not reproducible run to run, which is why it stayed open. | "if I fall off a cliff... it's doing nothing" / "is the car above the ground beneath it" | `tools/verify-terrain-integrity.mjs` |
| 4 | **Half the roster was never swept, and the suite said it was clean.** BUGS.md #6: `playtest-all.mjs:11` looped `lvl <= 28` on a 57-world roster and `test-affinity.mjs` stopped at 21; six of the eight worst worlds live above 28. COORDINATION.md: the tests read `world/levels.js` (57, stale) while the game reads `LEVELS` in `track.js` (60). A pass over a truncated set is not a smaller pass, it is a false one. | "I keep on debugging the game non stop for things that can be obviously working." | `tools/verify-coverage.mjs` |
| 5 | **The first paint told a lie, and a tap read as a freeze.** BUGS.md #5: `_syncStartButton()` ran on every interaction and never on boot, so START read "START RACE" on five worlds that refused it. r152: picking a track ran a full synchronous world build inside the click handler, so the menu froze before the new highlight had painted. | "the game is freezing" | `tools/verify-boot-state.mjs` |
| 6 | **Every building was collided as a circle.** `houseCollider` took each template's bounding *radius* and returned a cylinder, which wraps anything longer than it is wide in a disc the size of its diagonal: the pueblo ruin is 11.8 × 9.0 m and was collided as a 17 m circle. Four metres of invisible wall off each corner, in an empty street, with nothing on screen to blame. Twenty-six components came through that factory. | — (found by measurement) | `tools/verify-physics.mjs` |
| 7 | **The world fingerprint hashed translation only while claiming to cover scale.** Caught by mutation, not by review: widening one component's scale range sailed straight through the first version of `verify-worlds`. It now also hashes matrix element `m22`. A check that cannot fail is not a check. | — | `tools/verify-worlds.mjs` |
| 8 | **That fingerprint is still blind to yaw, to non-uniform X/Z scale, and to geometry.** `m22` is the scale only for a *uniform* scale under a Y rotation. The horizon massifs are scaled `(w, h, w·(0.5–1.2))` at `render/horizon.ts:130` — so `m22` is their height and their **width and depth are unhashed**, which is precisely the shark-fin proportion the owner kept reporting. Instance yaw lives in elements 0/2/8/10 and is unhashed too, and it is fed to the box colliders at `world/build.ts:275`. Non-instanced meshes — terrain, road, water, sky, clouds — are skipped outright. | "Still see the shark mountains there" | `tools/verify-regression-memory.mjs` |
| 9 | **Unseeded randomness in world construction.** v1 re-rolled 260 pines, 150 rocks, 170 bushes, 14 clouds and 30 mountains on every load. The cost is not that worlds vary — it is that no complaint can be reproduced: MIGRATION.md records a world's crest count moving 6 → 0 across two builds with no code change, "which is WHY the sinking bug is still open: I could not reproduce it." A bug you cannot reproduce is a bug you fix by guessing. | — | `tools/verify-regression-memory.mjs` |
| 10 | **Boats that did not float, in a check that passed.** `components-smoke`'s first version restated the placement rule instead of reading the built world, and passed happily with the builder deliberately broken to sink every boat. It now reads the real instance matrices out of the running game. | — | `tools/components-smoke.mjs` |
| 11 | **A coefficient lost in the lift from code to data.** The track format was made by pulling literals out of the constructor, `hills()`, `roadHeight()` and `surfaceIdAt()`. A snow line 10 m out or a crest 0.01 of a lap early looks fine and drives differently. | — | `tools/verify-track-format.mjs` |
| 12 | **A faster road-distance bake that is a different world.** The bake decides where the road ends, where the terrain stops being flattened and how far scenery must keep clear. "Nearly right" there is not a smaller version of right — it is the verge in a different place and the trees moved. | — | `tools/verify-sdf.mjs` |
| 13 | **Committed generated artifacts drifting from their generators.** Found real drift on its first run: the marine contact sheet predated the breakwater's shore→water fix, and five sheets were orphans still shipping to Pages. Every other check asked whether an artifact was *consistent*; none asked whether it was *current*. | — | `tools/verify-generated.mjs` |
| 14 | **The shape library quietly becoming a second tangle.** `templates/` is reusable only as long as nothing in it imports the component registry, the editor or a track — which changes one convenient import at a time. And `export *` drops a name silently when two modules export it, so the failure lands at the import site rather than at the cause. | — | `tools/verify-templates.mjs` |
| 15 | **Components arriving with no dimensional standard applied.** Get a mountain wrong by 30% and nobody can tell; get a street lamp wrong by 30% and the street looks like a model railway. The rule itself was wrong first (a heritage lamp judged against a highway column), and a mutation dropping that lamp to 3.33 m — visibly a toy — passed with 3 cm to spare until the bound was set from the real range instead of by backing off the component. | — | `tools/verify-architecture.mjs` |
| 16 | **dustline importing IGNITE RALLY.** One `import { X } from '../../src/textures.js'` makes the two builds one build, and then a change to v1's 910 KB `track.js` can break this one. The app would still run, so nothing would tell you. Everything ported here is a copy that says so in its header; none of it is imported. | — | `tools/verify-separation.mjs` |
| 17 | **A site that works locally and is broken on Pages.** GitHub Pages serves this from a `/racing-shooter/` sub-path, so every absolute path resolves one level too high — invisible at `/`, total once deployed. | — | `tools/verify-deploy.mjs` |
| 18 | **An editor that loses the track.** The editor is the only way a track is authored, and a preview that drifts from the game or a pack/unpack round trip that drops a field is invisible until somebody loses work. It drives the built editor: preview builds the real terrain, edits move the road, validation refuses a track that cannot be built, and a packed URL opens as that same track in the game. | "I don't see the new complex tracks" | `tools/editor-smoke.mjs` |
| 19 | **On a phone, the car did not move.** dustline shipped with `core/input.ts` handling keyboard and gamepad and nothing else — no touch input at all — on a game aimed at a phone. "Was the code written" and "does a thumb move the car" are different questions, and only the second one is the one that gets asked when somebody picks up their phone. | — | `tools/verify-mobile.mjs` |
| 20 | **A fidelity pass that quietly spends the frame budget.** `ART-DIRECTION.md` argues the flat-shaded look partly on cost and states the rule — "every change that raises geometry reports its measured triangle count and draw calls, per track, before and after" — which is worth nothing unless somebody takes the numbers. v1's own record shows how this goes wrong in both directions: ARCHITECTURE.md quotes a software-rasteriser figure as if it were performance, and BUGS.md #8 reports three worlds "lapping at half pace" that were not. | "the game is freezing" | `tools/verify-perf-budget.mjs` |
| 21 | **A fix with no standing check behind it.** The class this whole file is about. v1 grew 56 test files, every one written after an incident, with no convention forcing it — so a fix applied to one code path and not its twin was reported again, with the same photograph. | "Still can enter." | `tools/verify-regression-memory.mjs` |

## What this register does not do

It checks that a named check **exists** and **runs**. It cannot check that the
check is any *good* — a file called `verify-solidity.mjs` that prints PASS
unconditionally satisfies every rule here. That is what mutation testing is
for, and the standard this repo already set for itself is that a check is not
believed until it has been made to go red on a deliberately introduced defect.
Rows 7, 10 and 15 are here because a check failed that test and had to be
rewritten.

It also cannot know about a defect nobody wrote down. It is a register, not a
detector: it makes forgetting visible, it does not make remembering automatic.

## One row is only half closed — row 8

Row 8 is registered against `verify-regression-memory`, and that check catches
the *unseeded* half of it: a yaw or an X/Z scale that re-rolls between loads
now fails, where `verify-worlds` passes. Measured head to head on one build,
with every horizon massif's depth and every scattered prop's yaw re-rolling
unseeded:

| | `verify-worlds` | `verify-regression-memory` |
|---|---|---|
| dustbowl | PASS | **FAIL** — `78d59e92` vs `9dd71e6d` under two seeds |
| harbour | PASS | **FAIL** — `2c514942` vs `9ea29cc4` |
| proving-ground | PASS | **FAIL** — `16437996` vs `354600ce` |
| its golden hashes | `4b996042` / `a5e1e543` / `65557997`, unchanged | — |

The other half is still open, and it is the half the owner actually reported. A
**deliberate, deterministic** change to a yaw, an X/Z scale or a geometry — the
near horizon ring's width factor moved 1.45 → 0.35, every near hill four times
too thin — is invisible to *both* checks: `verify-worlds` prints "every world
matches its fingerprint and is fully seeded" with byte-identical goldens, and
the run-to-run comparison stays green because the change is perfectly
consistent. Only a golden file can catch that one, and the golden is the wrong
shape.

**The fix is four lines in `tools/verify-worlds.mjs`**: traverse the built
world instead of skipping every non-`InstancedMesh`, and hash all sixteen
matrix elements instead of 12/13/14 and 5. The full-transform hash already
separates that mutant (`a92dc3aa` → `a6356523` on dustbowl), so the
discrimination exists; only the golden is missing it. A second golden committed
against this file instead would have to be blessed by hand alongside the first
one on every intended world change, which teaches people to bless without
looking — which is how "still" happens in the first place.
