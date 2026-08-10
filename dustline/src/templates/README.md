# `src/templates/` — the shared shape library

**Shapes, and the tools to build them. Nothing else.**

Everything in here is reusable by anything in the app. It knows nothing about
placement, scatter, the component registry, tracks or the editor, and no file in
it has a side effect on import.

```
templates/
  geometry.ts   primitives and the lofting helpers
  buildings.ts  HOUSE_TEMPLATES — 18 dwelling archetypes as part lists
  boats.ts      the hull's rig, deck gear, cabins and trim
  textures.ts   the window tile and its emissive companion
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
