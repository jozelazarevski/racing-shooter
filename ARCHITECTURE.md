# IGNITE RALLY — architecture: what is here, what is wrong, what to do

This is an investigation, a proposal, and the record of the first step of the
proposal being carried out. It follows the house rule the rest of this repo is
written to: **never claim what has not been measured.** Every number below was
counted from the tree at the commit this file was added in, and every claim
about behaviour was checked by running the game, not by reading it.

---

## 1. What is actually here

Three complete, separately-built games share one repository.

| | entry | lines | language | physics | role |
|---|---|---|---|---|---|
| **dustline** | `dustline/index.html` | ~2,000 | TypeScript + Vite | Rapier + raycast car | **active development** |
| **v1 — IGNITE RALLY** | `index.html` → `src/main.js` | ~31,100 | vanilla JS, ES modules, no build | hand-rolled | shipped, legacy |

> **Correction, and it matters.** The first draft of this document asserted that
> v1 was "the only one under active development", and section 5.4 offered
> retiring `dustline` as an option. Both were wrong, and the error was mine: I
> inferred the active project from commit recency on `src/` instead of asking.
> **`dustline` is the game under active development.** v1 is what currently
> ships at the repo root. Everything below is written to that fact.

There was a third engine, `v2/` — a staged Rapier migration of v1, with its
built output in `play-v2/`. **It has been deleted.** The question section 5.4
used to pose is therefore answered: dustline is the engine, and the migration
argument in `MIGRATION.md` has already landed there rather than in v2.

What remains is a real cost that is still not written down: the specifications
have diverged across `RULES.md`, `NATURE.md`, `STRUCTURES.md`, `SCENES.md`,
`spec/RALLY_RULES.md` and `spec/RALLY_WORLD_BIBLE.md` — six normative documents,
all describing v1's world, none of them scoped to dustline, which has its own
spec in `dustline/CLAUDE.md`. `CONFORMANCE.md` already states the conclusion
plainly: *"The specification describes a different game from the one that
exists."* Section 5.4 says what to do about that now.

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

**Priority is dustline.** 5.1–5.3 are v1 maintenance and should be treated as
such: worth doing when v1 needs work, not worth doing ahead of the active game.
5.4 is where the effort belongs.

### 5.1 Finish decomposing the builder — *v1, opportunistic*

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

### 5.2 Make determinism checkable, not just true — *v1, opportunistic*

Assert that no unseeded `Math.random` is reachable during world construction and
fail the build if one is — v2 had a `withoutMathRandom()` guard doing exactly
this, and the idea is worth keeping even though the code that implemented it has
been deleted. Pair it with the world fingerprint from 4.3 as a committed golden
file, so an unintended world change fails a test instead of being discovered in
a screenshot three releases later.

### 5.3 Extract `main.js` — *v1, opportunistic*

`Game` has 134 methods spanning career persistence, cloud sync, menus, HUD
wiring, race rules, missions, free-roam and the render loop. It is the same
problem as `Track` and yields to the same treatment. Career/profile persistence
is the cleanest first cut: it is already nearly separable, it is pure data
manipulation, and it is the part most worth having unit tests for, because a
save-format bug costs a player their progress.

### 5.4 dustline — track authoring. DONE.

The engine question is settled: dustline is it, and v2 is deleted. The first
three things dustline needed have landed; see `dustline/TRACKS.md`.

**A track was a literal.** `terrain.ts` defined the one and only course as
eleven `[x, z]` pairs inside the `Terrain` constructor, and its *character* was
worse — the snow line was `z < -150`, the mud flat was a circle written into an
`if`, the jump was a gaussian typed into `roadHeight()`. There was no track id,
no registry, no way to select a second one.

Now: a **track format** (`src/tracks/trackDef.ts`, tracks in
`src/data/tracks/*.json`) that carries the loop, the landscape octaves, the
road's elevation profile with named crests, the surface zones and bands, the
scenery layers and the sky. `Terrain` evaluates it and contains none of it.

An **editor** (`editor.html`) that authors the format: a live 2D map with shaded
relief, painted surfaces and corner-speed colouring, over a 3D preview that
builds the real `Terrain`. The 2D view is live and the 3D view is debounced at
220 ms, because a full build measures ~66 ms in node and ~120–160 ms in a
browser — fine on a pause, hopeless per mouse-move.

**Determinism**, which was the third item and is now paid for before there is
content rather than after: `src/core/rng.ts` seeds every scattered object per
track and forks the stream by layer name, so the same track builds the same
world and adding a rock does not move the trees. v1 shows what skipping this
costs — `MIGRATION.md` records a world's crest count moving 6 → 0 across two
loads with no code change, and a bug that could not be reproduced for weeks.

The format is proved rather than asserted: `npm run verify:track` drives the
original hardcoded implementation and the data path over 48,400 grid samples
and every centreline sample and requires them to agree. Surfaces match
everywhere; height matches to 1.07e-14 m, and that residual is attributed to a
single octave form (`sin(x*fx + z*fz)` where the original wrote `sin((x+z)*f)`,
which is not the same float) rather than absorbed into a loose tolerance.

**The road-distance bake — done, and smaller than it looked.** It was brute
force: every grid cell against every road sample, 23.2 M distance tests. It is
now a bucketed nearest-neighbour search with row coherence (each cell starts
from its neighbour's winner, which makes the search bound tight immediately).
Measured in isolation: **2.0–2.3x faster, 21–24 ms saved per world build**, and
the baked field is **bit-identical** to the old loop on every track —
`npm run verify:sdf` keeps the original as an oracle and compares cell for cell,
not within a tolerance.

Two things worth recording because they are counter-intuitive:

- **A chamfer distance transform would have been wrong.** It is the obvious
  answer and it is one pass instead of a search, but chamfer distance is an
  approximation a few percent out — and this field decides where the road
  surface ends, where the terrain stops being flattened, and how far scenery
  keeps clear. A few percent is a different world.
- **Smaller buckets made it slower.** Most of a 900 m map is far from a 1.5 km
  loop, so the cost is dominated by cells walking empty buckets outward until
  they find the road, not by distance tests near it. Measured across six bucket
  sizes; the sweep is why the constant is S/12 rather than a guess.

**And the win is smaller end-to-end than in isolation, which is the honest
figure.** The editor's preview rebuild measured 121 ms median in a browser both
before and after — within noise. The bake is no longer the dominant cost; the
vertex/colour loop is, because `colorAt` calls `heightAt` five times per vertex
for its slope shading. That one is NOT being taken: computing slope from
neighbouring grid heights instead would be much cheaper and would change every
vertex colour, and a visual change is not a refactor.

**Water, and what a world is made of.** The component library is now 64 files
across seven categories, and the two newest categories exist because of a plain
gap: there were farm buildings and trackside furniture, and nothing anybody
lived in. **settlement** adds eleven dwellings, a church, a windmill and street
furniture; **marine** adds four boats, a jetty, a lighthouse and quayside gear.

**Their shapes are v1's, copied across, and that is the interesting part of
this repository's two-games problem turning into an asset.** The first cut of
all of them was hand-rolled boxes, and v1's own sources say exactly what that
looks like: its first boats were "a BOX WITH A CONE ON TOP", its first
lighthouse "read as a traffic bollard from the quay", and it had already
shipped the same roof bug twice because two builders each rolled their own
dwelling geometry. So `HOUSE_TEMPLATES`, the nine-station lofted hull, the rig
and the lighthouse came over verbatim into `props/houseTemplates.ts`,
`props/kit.ts` and `props/boatParts.ts` — comments included, because the
comments are the record of what was learned. A settlement component is now a
name and a sentence with no geometry in it.

Rendering the ported library found two bugs that are in the v1 table too: a
rolled part is still base-anchored, which is right for the pueblo ruin's
protruding vigas and wrong for a diameter, so the windmill's four sails came
out as a 135° fan with every arm on one side of the hub, and the well's winch
barrel hung 2.6 m past one post. Both are marked where they are repaired.

Boats needed something to float on, so `TrackDef` grew an optional
`water: { level, … }` — **one number**, below which the land is wet. Not a lake
system: the terrain is already a heightfield, so "below this line" describes a
sea, a flooded valley and a pond in a hollow at once, and where the water goes
is decided by the land. Making a coast is then a ramp with a negative slope
instead of a positive one, which is one sign flip in `rampAt` away from the
snow-line ramps the format already had.

A component declares `placement: 'land' | 'water' | 'shore'`, and a floating
one's origin is the WATERLINE rather than its keel — which is why a rowboat in
1 m of water and one in 8 m sit correctly without either knowing the depth.

`harbour.json` is the worked example and is generated (`npm run make:harbour`)
for a reason beyond the proving ground's: the shoreline is not typed anywhere,
it is wherever the land crosses the level, so it MOVES whenever an octave, a
ramp or the level changes. Every piece of the village is placed relative to the
shore found by marching outward from dry land.

That generator recomputes land height from the track's own octaves and ramps —
real duplication of engine arithmetic — so it is **checked rather than
trusted**: `npm run smoke:components` loads the harbour in the game and reads
the actual instance matrices out of the built world, requiring every floating
component to be at the water level and every land one on the ground. The first
version of that check restated the placement rule instead of measuring the
result, and passed happily with the builder deliberately broken to sink every
boat. Adding all of this left `dustbowl` and `proving-ground` **bit-identical**
(`npm run verify:worlds`, fingerprints unchanged), which is the point of having
kept the golden file.

### 5.5 State which specification governs which codebase — DONE

Six normative documents — `RULES.md`, `NATURE.md`, `STRUCTURES.md`, `SCENES.md`,
`spec/RALLY_RULES.md`, `spec/RALLY_WORLD_BIBLE.md` — all describe v1's world.
dustline has a seventh in `dustline/CLAUDE.md`, written to a different game.
None of them said at the top which codebase it governed, so all seven read as
authoritative over everything.

Every one now carries a scope banner in its first five lines, and
`dustline/CLAUDE.md` carries the mirror image disclaiming the root documents.
`CONFORMANCE.md` states the same thing in its status section. It was the
cheapest correction on this list and the one with the worst failure mode: a
normative document that is silently false about half the repository is worse
than no document at all.
