# IGNITE RALLY — architecture: what is here, what is wrong, what to do

This is an investigation, a proposal, and the record of the first step of the
proposal being carried out. It follows the house rule the rest of this repo is
written to: **never claim what has not been measured.** Every number below was
counted from the tree at the commit this file was added in, and every claim
about behaviour was checked by running the game, not by reading it.

---

## 1. What is actually here

Three complete, separately-built games share one repository.

| | entry | lines | language | physics | last touched |
|---|---|---|---|---|---|
| **v1 — IGNITE RALLY** | `index.html` → `src/main.js` | ~31,100 | vanilla JS, ES modules, no build | hand-rolled | current |
| **v2** | `v2/index.html` | ~4,300 | TypeScript + Vite | Rapier (WASM) | 2026-08-06 |
| **dustline** | `dustline/index.html` | ~2,600 | TypeScript + Vite | raycast car | 2026-08-06 |

Two of them ship built output that is committed to the repo (`play-v2/`,
`play-dustline/`, 5.3 MB together) and both are live on Pages. v1 is the game
the README describes, the one the 30-odd test suites drive, and the only one
under active development.

This is not an accident, and it is not (yet) a mistake. `MIGRATION.md` argues —
correctly, and with evidence — that the hand-rolled physics is the root cause of
a class of bugs that keeps reappearing, and that the move to Rapier should be
staged rather than big-bang. v2 is that stage. `dustline` is an earlier,
independent attempt at the same idea from a different specification.

**But three engines is a cost that is being paid continuously and is not
written down anywhere.** The specifications have diverged into five normative
documents (`RULES.md`, `NATURE.md`, `STRUCTURES.md`, `SCENES.md`, plus
`spec/RALLY_RULES.md` and `spec/RALLY_WORLD_BIBLE.md`), and `CONFORMANCE.md`
already states the conclusion plainly: *"The specification describes a different
game from the one that exists."* Section 5 says what to do about that.

### The shape of v1

Before this change, `src/track.js` was **15,918 lines** — half the entire
codebase in one file. It held, with no separation:

- the career roster (18 shipped worlds, 57 level records)
- the hand-designed circuit control polygons
- every colour and density knob for every theme
- the destructible-prop catalogue, house templates and regional element kits
- a 152-method `Track` class that builds terrain, water, roads, walls,
  tunnels, bridges, buildings, vegetation, sky and horizon
- the seeded random-number generator
- a generic three.js resource-disposal utility

Those are seven different kinds of thing. Only one of them — the builder — is
about *how* a world is made; the rest is *what* the worlds are, and general
machinery that is not about worlds at all.

The consequence is not aesthetic. It is that **there is no way to change the
data without reading the code, and no way to test the code without loading all
the data.** A colour tweak and a terrain-generation fix touch the same file, so
they collide in review, in diffs and in merges — which is exactly how the
release described in the comment at the top of `tests/test-static.mjs` shipped
with an unresolved conflict marker in it.

---

## 2. The defects that are architectural

These are the ones that will keep producing bugs until the structure changes.
Each is a fact about the tree, not a preference.

### 2.1 Determinism is a wrapper, not a property

`withSeed()` swaps `Math.random` for a seeded generator for the duration of
world construction and swaps it back afterwards. This was the pragmatic call
and it was the right one — there are **1,229 `Math.random` occurrences** across
`src/`, and rewriting every one of them was not the way to get determinism this
year. It works: measured in this change, all 57 worlds rebuild to identical
fingerprints across page loads.

But its guarantee is *"everything the `Track` constructor touches synchronously"*
— which is a statement about **call timing**, not about **code**. Nothing stops
a future async step, a deferred texture bake, or a lazily-built prop from
falling outside the window, and nothing will fail when one does. The world will
just quietly start varying again, and — as `MIGRATION.md` documents — a world
that varies is a world whose bugs cannot be reproduced.

The fix is not to abandon the wrapper. It is to make escaping it *detectable*:
a build-time guard like v2's `withoutMathRandom()`, plus the world fingerprint
this change introduces, run in CI. See 5.2.

### 2.2 The service-worker cache list was a hand-maintained lie

`sw.js` precaches an explicit `CORE` array so the game runs with the radio off.
The module graph, meanwhile, is whatever the `import` statements say. Nothing
kept the two in agreement.

They had already drifted: **`src/sync.js` is imported by `src/main.js` and was
absent from `CORE`** — for its entire life. Nothing failed in development,
because in development the network is there. It fails on a plane, once, for a
player, as a blank screen.

This is the archetype of the whole problem: a fact stated in two places, with
no check that they agree. Fixed in this change, both the entry and the class of
bug — `tests/test-static.mjs` now walks the real import graph (resolving the
page's import map, so a renamed three.js build cannot slip out either) and fails
if `CORE` and the graph disagree in either direction.

### 2.3 Two god objects hold the program

`Track` had 152 methods and 69 distinct instance fields; `Game` in `main.js` has
134 methods. Between them they *are* the program. Every field is reachable from
every method, so there is no unit of this code smaller than "the whole world"
that can be reasoned about or tested in isolation — which is why all 30 test
suites are end-to-end browser drives. Those suites are genuinely good, and they
have caught real defects; but they are the *only* granularity available, and a
30-second browser run is not a thing you execute on every keystroke.

### 2.4 Layering runs backwards in places

`vehicles.js` imported `ROAD_HALF` and `RIM_RADIUS` from `track.js`, and
`traffic.js` imported `disposeSubtree` from it. Neither wanted the world
builder; they wanted two numbers and a utility function. But an ES module
import is all-or-nothing, so **loading a car pulled in every theme, every
circuit and the entire 15,918-line builder.** Fixed in this change.

### 2.5 The specifications outrank the code, and disagree with it

Six normative documents declare themselves authoritative. `CONFORMANCE.md`
honestly audits the gap and concludes it is a rewrite, not a backlog. That is a
defensible conclusion — but while it stands unresolved, every one of those
documents is simultaneously a promise and a known falsehood about v1, and there
is no single place that says which document governs which codebase. Section 5.4.

---

## 3. The target architecture

One rule, stated so it can be checked mechanically:

> **Dependencies point inwards, and data never imports behaviour.**
>
> `data → engine → world → game`. An arrow may never run the other way.

- **data** — what the worlds *are*. Rosters, circuit polygons, theme palettes,
  prop catalogues. Plain values. Imports nothing but three.js for geometry
  construction, and ideally not even that.
- **engine** — machinery that does not know this is a racing game. Resource
  disposal, the seeded PRNG, math helpers, pooling.
- **world** — the builder. Turns data into a scene using the engine.
- **game** — modes, career, HUD, input, the loop. Owns the world; the world
  never reaches back.

The rule matters because it is the one that was being broken (2.4), and because
it is the only property in this list that a script can enforce. A layering rule
nobody can check is a preference.

---

## 4. What this change actually did

Step one: **get the data out of the builder, and make the split provable.**

### 4.1 The new shape

```
src/
  engine/
    dispose.js        33   three.js resource disposal — knows nothing of racing
  world/
    constants.js      17   ROAD_HALF, RIM_RADIUS, tunnel bore, CENTER_SAMPLES
    levels.js        165   the career roster                        (pure data)
    circuits.js      875   circuit control polygons                 (pure data)
    themes.js      2,042   per-theme art direction                  (pure data)
    catalog.js       822   props, houses, element kits    (data + asset builders)
    rng.js            58   the seeded world generator
    sky.js           506   sky dome, sun, clouds, horizon silhouettes
    flora.js       1,911   placement rules + eleven biome vegetation builders
  track.js         9,605   the world builder
```

`src/track.js`: **15,918 → 9,605 lines, a 40% reduction.** The largest file in
the repo is still large, and section 5.1 says what happens to it next.

`sky.js` and `flora.js` are a different kind of split from the others, and the
difference is worth being precise about. Their contents are still `Track`
methods — they are installed on `Track.prototype` after the class is defined, so
`this` is the track and no call site, field or ordering changes. **That is a
physical split, not yet a decoupling.** It is worth doing anyway: it takes 2,400
lines out of the file that everything collides in, and it turns the coupling
into an import list at the top of each module, where it can be seen and then
reduced. Pretending it is more than that would be the kind of claim this repo
does not make.

### 4.2 Compatibility

`track.js` re-exports every name it used to export, so any importer that has not
been updated keeps working. The three in-tree importers *were* updated to point
at the owning module — `main.js`, `vehicles.js` and `traffic.js` — so
`vehicles.js` no longer drags the world builder in behind two constants.

### 4.3 The evidence

A refactor of this size is worth exactly as much as its proof. Three
independent checks, all of which had to pass:

1. **The executable body is unchanged.** Concatenating the split modules and
   normalising away comments, whitespace and import/export plumbing gives a
   line-for-line identical multiset to the original file: **11,588 lines on both
   sides, zero difference.** Not one statement was edited.
2. **The static gate passes**, including the two new checks it gained here.
3. **All 57 worlds are byte-identical to the pre-refactor build.** The old code
   was checked out into a second worktree and served on a second port; both
   builds were driven in headless Chromium and each world fingerprinted over its
   centreline, terrain heights, road widths, slopes and water plane, plus its
   tree / collider / building / prop counts. Every world matches, and each world
   also matches itself across two loads — which re-proves determinism survived
   the generator's move into `world/rng.js`.

Check 3 found a bug in itself first, which is worth recording: the first
fingerprint sampled live collider positions, and the *unmodified baseline
disagreed with itself* on world 1. The race is already running by the time the
probe fires, so anything the simulation mutates is timing noise. The fingerprint
now samples only pure world-geometry queries. A probe that can fail on identical
inputs cannot certify anything, and the honest move was to fix the probe rather
than to report the flake as a finding.

---

## 5. What to do next, in order

Staged, each stage shippable and gated. Same rule as `MIGRATION.md`: ship it,
gate it, and never claim what has not been measured.

### 5.1 Finish decomposing the builder

`track.js` is still 9,605 lines and 100-odd methods. The remaining groups are
already visible as contiguous runs and can move the same way `sky.js` and
`flora.js` did:

| module | what moves |
|---|---|
| `world/terrain.js` | height field, hills, highland, rim wall, river valley, road clamp, far terrain |
| `world/water.js` | rivers, creeks, fords, sea, coast, quays, underwater tests |
| `world/structures.js` | bridges, gantries, retaining walls, tunnels, arches, lighthouse, marina |
| `world/settlement.js` | element kits realised — farms, old town, streets, crossroads, spurs |
| `world/hazards.js` | ramps, boost pads, crests, obstacles, puddles, gravel, viz zones |

Do these one at a time, each proven by the same three checks. The equivalence
probe from 4.3 is committed as `tests/test-equivalence.mjs` precisely so the
next four splits cost one command each.

Then, and only then, convert the mixins into real modules that take an explicit
context object instead of `this`. That is the step that actually decouples, and
it should be paid for one module at a time, after the physical split has made
each module's true dependency list visible.

### 5.2 Make determinism checkable, not just true

Port v2's `withoutMathRandom()` guard to v1: assert that no unseeded
`Math.random` is reachable during world construction, and fail the build if one
is. Pair it with the world fingerprint from 4.3 as a committed golden file, so
an unintended world change fails a test instead of being discovered in a
screenshot three releases later.

### 5.3 Extract `main.js`

`Game` has 134 methods spanning career persistence, cloud sync, menus, HUD
wiring, race rules, missions, free-roam and the render loop. It is the same
problem as `Track` and yields to the same treatment. Career/profile persistence
is the cleanest first cut: it is already nearly separable, it is pure data
manipulation, and it is the part most worth having unit tests for, because a
save-format bug costs a player their progress.

### 5.4 Resolve the three-engine question — explicitly

This is a decision, not a refactor, and it is the highest-value thing on this
list. The options are:

- **Continue the v2 migration** as `MIGRATION.md` lays out, and formally retire
  `dustline` — it is a second answer to the question v2 is already answering,
  and keeping both means neither gets finished.
- **Freeze v1 to bug-fixes only**, so effort stops being split between an engine
  being replaced and its replacement.
- **State which specification governs which codebase**, at the top of each
  document. Six normative documents with no precedence order is worse than
  three, because every one of them is currently true of *something*.

Whatever the answer, it should be written down where the next person reads
first. The one option that is not available is leaving it implicit, which is
what it is now.

### 5.5 Then, and only then, the engine rewrite

`MIGRATION.md`'s argument for Rapier is sound and its evidence is real. Nothing
above contradicts it — 5.1 to 5.3 make it *cheaper*, because a v1 whose data is
separated from its builder is a v1 whose worlds can be fed to a new engine
without dragging fifteen thousand lines of rendering behind them. The rosters,
circuits, themes and catalogues extracted in this change are plain values with
no three.js in three of the five files: they are already portable.

That is the real argument for doing the boring split first. The data was always
the durable part; it was just locked inside the part that is being thrown away.
