# DUSTLINE — world components

## What a component is

**One file. Geometry, physical rules, and preview, together.**

```
src/world/props/tyreStack.ts   ->  appears in the palette, scatterable,
                                   placeable, collidable, previewed
```

That colocation is the whole idea. Before this, an object's parts were spread
across the codebase: the pine's geometry was built in one loop in
`render/scenery.ts`, its collider was created ninety lines later in the same
loop, its placement rules were three `if`s in between, and its palette entry did
not exist because there was no palette. Changing a tree meant touching all of
them and hoping. A component keeps them in one place, where a mismatch is
visible.

## Adding one

Create `src/world/props/<id>.ts` with a default export. **There is no manifest
to update** — the registry discovers every file in the folder, so a new file is
a new component in the palette on the next reload.

```ts
import { PropTemplate, boxAt, cylinderAt, standard } from './types';

const barrier: PropTemplate = {
  id: 'barrier',
  name: 'Barrier',
  category: 'trackside',
  description: 'Concrete block. Solid, heavy, ends a bad line.',

  // Built ONCE per world and instanced. Local space, base at y = 0.
  build: () => [
    { key: 'body', geometry: boxAt(3.2, 0.9, 0.6, 0), material: standard(0xcfcabd), castShadow: true },
    { key: 'foot', geometry: boxAt(3.4, 0.18, 0.9, 0), material: standard(0xa8a294) },
  ],

  // The physical rules travel with the object.
  physics: {
    shape: (s) => ({ kind: 'box', halfExtents: [1.6 * s, 0.45 * s, 0.3 * s], centerY: 0.45 * s }),
    solid: true,
    massKg: 2200,
  },

  // How it may be placed and scattered.
  authoring: {
    scale: [0.9, 1.2],
    defaultScale: 1,
    minRoadDist: 7,
    randomYaw: false,
  },
};

export default barrier;
```

That is the entire contract. No registration, no palette entry, no thumbnail to
draw, no collider code elsewhere.

## The three parts

### Geometry — `build()`

Returns **parts**, not a finished object, because a world holds hundreds of
copies. Each part becomes one `InstancedMesh` shared by every instance, so 260
pines with four parts cost four draw calls rather than 1,040.

Two per-instance hooks:

- `tint(ctx)` — per-instance colour. The pine uses it to grow duller on snow.
- `when(ctx)` — per-instance opt-out. The pine's snow cap only exists on snow.

`ctx` carries where the instance is going and what it is standing on:
`{ x, z, y, surface, scale, rng }`.

### Physical rules — `physics`

- `shape(scale)` — the collider, **as a function of scale**. A collider that
  ignores instance scale is the classic invisible-wall bug: a small rock you can
  drive over and a large one you cannot must not share a hitbox.
- `solid` — `true`, `false`, or a predicate on scale. The rock is solid only
  above 1.1, which is exactly the rule the old scatter loop had buried in it.
- `massKg`, `friction` — recorded now because they are properties of the object.
  Inventing them per-object later is how a hay bale ends up heavier than a
  boulder.

Non-solid components get **no collider at all**, however large they look. The
bush is dressing and always has been.

### Authoring — `authoring`

`scale` range, `defaultScale` when dropped from the palette, `avoidSurfaces` and
`minRoadDist` for scattering, `randomYaw`. Scatter layers may override any of
these; hand placement never restricts you — if you put a saguaro on a glacier,
you meant to.

### Preview — nothing to write

Thumbnails are rendered from `build()` output by `props/thumbnail.ts`, framed
from the measured bounding sphere. A hand-drawn icon is a picture that starts
accurate and silently stops being; this one cannot disagree with the object
because it *is* the object.

## Getting one into a world

**Scatter** — fills a landscape by rule. A layer names a component:

```json
{ "template": "pine", "count": 260, "minRoadDist": 11, "minSpawnDist": 62, "spread": 0.944 }
```

**Placement** — puts one somewhere on purpose:

```json
{ "template": "tyreStack", "x": 150, "z": -85, "rot": 0, "scale": 1 }
```

Both go through the same builder (`world/build.ts`) into the same instanced
meshes, so a hand-placed pine costs nothing over a scattered one.

Placed props do **not** store their ground height — it is looked up at build
time, so editing the terrain under a prop moves the prop with it. That is the
behaviour you want every single time.

## Placing them in the editor

- **Drag** a palette entry onto the map, or onto the **3D view** — the 3D drop
  raycasts the real terrain, so it lands where the cursor is even on a hillside.
- **Click** a palette entry to arm it, then click the map. Hold `shift` while
  clicking to stay armed — the "twenty tyre stacks along one corner" workflow.
- Selected props: drag to move, `[` `]` rotate, `-` `=` resize, arrows nudge
  (`shift` for 5 m), `ctrl+D` duplicate, `del` remove, `esc` deselect.
- The **PLACED** tab lists every one with exact numbers, and states whether it
  is solid at its current scale and what it weighs — read from its own file.

On the map, props are drawn by **category colour** with a heading tick, at their
real collider footprint but never smaller than a few pixels: drawn honestly to
scale, a 0.66 m tyre stack is a third of a pixel with the whole world in view,
which is invisible exactly when you need to find it.

## Determinism

Each component's scatter draws from its own named stream forked off the track
seed, so **adding rocks never moves the trees**. Placed props draw from a
separate stream again, so hand-placing something does not reshuffle the
scattered world around it.

## The library — 34 components

| category | components | solid |
|---|---|---|
| **flora** | Pine, Birch, Palm, Saguaro, Dead tree, Stump | yes |
| | Bush, Reeds | no |
| **terrain** | Rock (above 1.1 scale), Boulder, Rock spire, Fallen log | yes |
| | Scree, Rock (below 1.1) | no |
| **trackside** | Tyre stack, Hay bale, Marshal post, Chevron board, Barrier block, Guardrail, Sandbag wall | yes |
| | Cone | no |
| **structure** | Barn, Shed, Grandstand, Pit building, Watchtower, Water tower, Light mast | yes |
| | Start gantry, Fence run | no |
| **debris** | Oil drum, Crate (0.7 scale and up) | yes |
| | Pallet, Spare tyre, Crate (below 0.7) | no |

Pine, Rock and Bush are ports of the three hardcoded scenery kinds, geometry
and colliders unchanged, so the shipped world still looks and drives as it did.

**The non-solid choices are decisions, not omissions.** A traffic cone that
stops a rally car is the most immersion-breaking object a track can contain, so
the cone marks a line and never blocks one. A start gantry you can hit is one
you WILL hit on the opening lap of a four-car grid. A field fence should
splinter, and until there is destruction to splinter it, driving through is
closer to the truth than bouncing off. A pallet lies on the ground and you drive
over it. Each of those is written in the component's own file, next to the
geometry it applies to, where it can be argued with.

## Checks

`npm run smoke:components` sweeps **the whole library**, not a sample — it reads
whatever is in the folder today, so a component added tomorrow is covered
without touching the test. For every one it checks that `build()` returns parts
with non-empty, NaN-free geometry; that `physics.shape()` answers with positive
dimensions at both ends of the component's own scale range; and that a
thumbnail renders. Then it places one of every component, loads them all in the
**game**, and requires each to have exactly the collider its file declares —
26 solid, 8 not, all correct.

That last check found its own bug first: with the scatter layers still in place,
colliders from nearby scattered pines were being counted against a placed
pallet, reporting a non-solid component as solid. The test now clears the
scatter, because isolating the thing under test is the difference between a
check and a coincidence.

## The proving ground

`src/data/tracks/proving-ground.json` is a second built-in track that exercises
the library as content: 114 placed components across every category, positioned
relative to the racing line — guardrail runs spaced by the component's own 6 m
length, tyre stacks on the outside of the hairpin, chevron boards on its
approach, a hay-bale chicane, cones marking a narrowing, and a farm, water tower
and pit complex out in the country.

It is *generated* (`node tools/make-proving-ground.mjs`) rather than
hand-written, because placing 114 props by typing coordinates is exactly the
work the editor exists to remove — and because anything positioned relative to
the road has to be recomputed when the road moves. Open it in the editor and
edit it like any other track; the generator only makes the starting point.
