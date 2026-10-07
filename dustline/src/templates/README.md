# `src/templates/` — the shared shape library

**Shapes, and the tools to build them. Nothing else.**

Everything in here is reusable by anything in the app. It knows nothing about
placement, scatter, the component registry, tracks or the editor, and no file in
it has a side effect on import.

```
templates/
  canvas.ts     make(), the value-noise tile, and the texture memo cache
  geometry.ts   primitives and the lofting helpers
  buildings.ts  HOUSE_TEMPLATES — 18 dwelling archetypes as part lists
  boats.ts      the hull's rig, deck gear, cabins and trim
  textures.ts   the window tile and its emissive companion
  surfaces.ts   what a thing is made of — stone, planks, rock face, crate
                boards, barrel staves, cone wrap, grass blades
  markings.ts   what somebody painted on it — chevrons, checkers, hazard
                stripes, awnings, a grandstand crowd
  horizon.ts    the six skyline silhouettes
  index.ts      one import for all of it
```

## Why it exists

These shapes were spread across three folders because of where they were first
needed, not because of what they are:

| was | is |
|---|---|
| `world/props/kit.ts` | `templates/geometry.ts` |
| `world/props/houseTemplates.ts` | `templates/buildings.ts` |
| `world/props/boatParts.ts` | `templates/boats.ts` |
| `world/props/wallTexture.ts` | `templates/textures.ts` |
| bottom of `world/props/types.ts` | `templates/geometry.ts` |
| shapes inside `render/horizon.ts` | `templates/horizon.ts` |
| v1 `src/textures.js` (surfaces) | `templates/surfaces.ts` |
| v1 `src/textures.js` (graphics) | `templates/markings.ts` |
| v1 `src/textures.js` (helpers) | `templates/canvas.ts` |

Three of those sat in `world/props/`, which is the **component catalogue** — one
file per placeable thing. They were not components. The registry globs that
folder and had to skip them by inspection, which is a small tell that they were
in the wrong place; the larger one is that a shared shape library had ended up
inside the contract for one of its consumers, so anything outside `props/`
wanting a mountain, a hull or a gable roof had to reach into a folder about
something else.

## The line

**`templates/` is what a thing is made of. `world/props/` is what a thing is.**

A component (`world/props/*.ts`) is one placeable object: an id, a category, a
description, physical rules, authoring rules — and geometry it builds *from*
these templates. It is discovered by the registry and appears in the palette.

A template is a shape or a helper. It has no id, no collider, no category, and
nothing discovers it. `buildings.ts` and `boats.ts` import types from
`world/props/types.ts` so the shapes they return fit the component contract —
those are **type-only imports**, erased at build time, so there is no runtime
dependency from templates back onto props.

## Using it

```ts
// several things
import { HOUSE_TEMPLATES, realize, boatHull, strut } from '../templates';

// or one, straight from its file
import { gablePrismGeo } from '../templates/geometry';
```

Component files import the primitives through `world/props/types.ts`, which
re-exports them — a component gets one import for "the thing I am and the tools
I build with", and nothing in `props/` had to change when this folder appeared.

## Where the shapes came from

Almost all of it is **IGNITE RALLY's**, ported verbatim with its comments. See
the header of each file for the exact v1 function, and `COMPONENTS.md` for why
copying rather than redesigning was the right call. In short: the other game in
this repository had already found the bugs, and its sources say plainly what my
first attempts looked like from the driving seat.

## Textures

Of the 109 components, **four had a texture and a hundred and five were flat
colour** — while the other game in this repository already had thirty-eight
hand-painted maps tuned against its own worlds. A flat-shaded stone wall next
to v1's is not a stylistic choice; it is the same wall with the detail missing.
So `surfaces.ts` and `markings.ts` are v1's painters, ported with their
comments.

Two things about them are not v1's, and both are forced by checks this project
has and that one does not:

1. **They are seeded.** Every one draws with `Math.random()`. Rewriting fifteen
   call sites per function into a seeded generator is exactly the reinvention
   that loses the look, so the *generator is swapped underneath* instead, with
   `withStubbedRandom` from `core/`. It matters because `verify:generated`
   compares the committed contact sheets against a fresh render — a wall that
   re-rolls its blocks each load would fail that check forever.
2. **They are memoised, and dropped with the part cache.** `build()` runs per
   component, so an uncached `crateTexture()` is a fresh canvas and a fresh GPU
   upload per crate. The cache is registered so `resetPartCache()` clears it:
   a disposed texture handed out again renders black and logs nothing.

Anything that varies per surface — how many times a tile repeats across it —
goes in the **palette**, not on the returned texture. These are shared
instances; `tex.repeat.set(...)` at a call site silently re-tiles every other
component holding the same one.

### Fitting a texture to geometry

A map is only an improvement where the geometry has a surface to take it, and
`mergeGeoms` drops UVs — use `mergeGeomsUV` on anything that carries a map.
Where a texture was tried and backed out, it was for a reason worth repeating:

Wired in (each verified with a close-up render before it stayed):

| component | map | note |
|---|---|---|
| crate | `crateTexture` | boards, braces, nail heads |
| quay wall face | `stoneTexture({repeat})` | the one big flat surface on it |
| jetty deck | `plankTexture([1, 6])` | flat slabs with no boards modelled — the case the map is FOR |
| start gantry banner | `checkerTexture([3, 1])` | a single beam, so its own box UVs survive |
| market stall awning | `awningTexture('#ffffff', '#a9a9a9')` | PALE stripes under the per-instance tint — v1's own townhouse technique, so every stall keeps its own colour |

| component | why not |
|---|---|
| oil drum | `barrelTexture` is an oak cask; the drum is painted steel, and its saturated instance tints multiplied the wood brown into mud |
| barrel stack | the casks already have hoop *geometry*; the texture paints hoops too, so they doubled |
| stone wall | already models every block as geometry — a block texture on blocks |
| terrace wall | same — its courses are modelled |
| timber bridge deck | twenty modelled baulks; the plank map would paint boards on boards |
| chevron sign | the three chevrons are modelled bars; `chevronTexture` on the board behind them would double the arrows |
| traffic cone | the reflective band is already a mesh; the wrap only added white patches to the base flange |
| grandstand | `crowdTexture` needs a surface facing the track; the benches are 16 cm tall |

Use `node tools/shot-component.mjs <id>` to look before deciding. At contact
sheet distance a painted masonry tile and a grey fill are the same few pixels.
