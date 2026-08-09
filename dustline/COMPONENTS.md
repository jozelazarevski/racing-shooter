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

## The library

| category | components |
|---|---|
| flora | Pine, Bush, Dead tree, Saguaro |
| terrain | Rock, Boulder |
| trackside | Tyre stack, Hay bale, Marshal post |

Pine, Rock and Bush are ports of the three hardcoded scenery kinds, geometry
and colliders unchanged, so the shipped world still looks and drives as it did.

## Checks

`npm run smoke:components` drives the whole path headless: every component is
discovered and previews itself, scatter builds through the component system,
an armed click places one, it reaches the preview as real geometry, and — in
the **game** — the declared physical rules become real Rapier colliders,
including that a non-solid component gets none and a scale-dependent rule is
respected on both sides of its threshold.
