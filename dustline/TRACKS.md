# DUSTLINE — tracks, and the editor

## Why this exists

A track used to be a literal inside `Terrain`'s constructor, and a world's
character lived in three hand-written functions: `hills()` decided the
landscape, `roadHeight()` decided the crests, `surfaceIdAt()` decided where the
snow, mud, sand and gravel were — with the snow line at `z < -150`, the mud at
`(-210, 160) r 80`, and the sand at `x > 190`, typed in as comparisons.

That is workable for one track and impossible for twenty-five. It also means
every change to a world is a code change, which is the actual complaint that
started this: *"I waste too much time asking Claude Code to fix the worlds. I
want to do it manually and create new ones."*

So tracks are data now, and there is an editor that authors them.

## Open the editor

```bash
cd dustline
npm install
npm run dev          # then open /editor.html
```

Or in the published build: **`/racing-shooter/play-dustline/editor.html`**.

Two tracks ship: **DUSTBOWL LOOP**, the original world written out as data, and
**PROVING GROUND**, a circuit carrying 114 placed components that exercises the
whole library as content. Open either from the toolbar.

## What a track is

One JSON file — see `src/data/tracks/dustbowl.json` and the typed shape in
`src/tracks/trackDef.ts`. Everything that used to be hardcoded is a field:

| section | what it controls |
|---|---|
| `road` | the closed loop's control points, half-width, verge blend, sample count |
| `start` | the flat apron at the start line, its surface, the painted tuning rings |
| `terrain.octaves` | the rolling country — stacked waves over the map |
| `terrain.ramps` | one-sided slopes, e.g. "the north rises to a snow line" |
| `terrain.road` | the road's own elevation: waves over the lap, plus crests (jumps) |
| `surfaces.bands` | stretches of the lap with their own surface |
| `surfaces.zones` | regions that override the surface, with optional patches (ice) |
| `scenery` | per-layer scatter: which COMPONENT, how many, clearances, scale |
| `props` | hand-placed components: what, where, rotation, scale |
| `sky` | dome gradient, fog, sun, fill light, horizon mountains, clouds |
| `seed` | every scattered object derives from this — same seed, same world |

The format is designed so `dustbowl.json` reproduces the pre-refactor world
**exactly**. That is not a claim, it is a test:

```bash
npm run verify:track
```

It drives the original hardcoded implementation and the data path over 48,400
grid samples and every centreline sample, and requires them to agree. Surface
classification matches everywhere; height matches to 1.07e-14 m, and the
residual is attributed rather than waved away — one octave form computes
`sin(x*fx + z*fz)` where the original wrote `sin((x+z)*f)`, and those are not
the same float. The alternative was dropping diagonal ridges from the format.

## Components — see `COMPONENTS.md`

Everything in the world you can point at — trees, rocks, tyre stacks, hay bales
— is a **component**: one file in `src/world/props/` carrying its geometry, its
physical rules and its preview together. Adding one to the game is adding a
file; there is no manifest, and the palette thumbnail is rendered from the
geometry so it cannot go stale.

Components reach a world two ways, both through the same builder: a **scatter
layer** fills the landscape by rule, and a **placed prop** is one you dropped
somewhere on purpose.

## Using the editor

**Map (top).** The live surface. Shaded relief of the land, surfaces painted,
the road corridor at its true width, and a curvature ribbon coloured by how
fast each corner can be taken.

- `drag` a point to move it · `alt`+click a segment to insert one · `del` to remove
- `shift`+click to multi-select — dragging a selection moves that whole section
- `space`+drag, middle-drag or right-drag to pan · `wheel` to zoom · `F` to fit
- `ctrl`+`Z` / `ctrl`+`shift`+`Z` to undo and redo
- double-click anywhere to fly the 3D preview to that spot

**Palette (left).** Every component, grouped by category, previewed from its own
geometry. Drag onto the map or the 3D view, or click to arm and then click to
place. Selected props: drag to move, `[` `]` rotate, `-` `=` resize, arrows
nudge, `ctrl+D` duplicate, `del` remove.

**3D preview (bottom).** The **real** `Terrain`, the real scenery placement,
the real lighting — not an approximation. It rebuilds 220 ms after you stop
changing things, because a full build costs ~66 ms in node and ~120–160 ms in
a browser, which is fine on a pause and hopeless per mouse-move. That split is
the whole performance design: the map is live, the preview catches up.

**Panel (right).** Six tabs — SHAPE, LAND, SURFACE, SCATTER, PLACED, SKY —
exposing every field above. The snow line is a number box now. PLACED lists
every hand-placed component with exact numbers and tells you whether it is
solid at its current scale and what it weighs, read from its own file.

**Status bar.** Lap length, control-point count, the tightest corner in km/h,
the last build time, and any problems with the track.

## Validation

`validateTrack()` in `trackDef.ts` reports what makes a track unbuildable or
undrivable — not a style guide, a track is allowed to be ugly:

- **error** — fewer than 4 control points; a point outside the buildable area;
  a sample count or mesh resolution too low to resolve a road
- **warning** — two runs of road closer together than a road width (the engine
  has no overpass concept, so they merge); a band that can never apply; a
  scenery count high enough to cost frame rate

Errors block the preview rebuild, so the last good world stays on screen with
the problem named, rather than the canvas going blank.

## Getting a track out

- **Save** — into `localStorage`. Yours, survives reloads, never leaves the browser.
- **Export** — a `.json` file. Drop it in `src/data/tracks/` and add it to
  `BUILT_IN` in `registry.ts` to ship it.
- **Copy link** — the whole track packed into a URL (`?t=…`, ~3.4 kB for the
  shipped one). Anyone who opens it drives exactly that track, with no server
  and no upload. This is the bug-report format: generation is seeded, so the
  link reproduces the world, not just the outline.
- **Test drive** — opens the game on the current track in a new tab.

## Loading a track in the game

```
index.html                 the default (first built-in)
index.html?track=dustbowl  by id, from built-ins or your saved tracks
index.html?t=<packed>      a track carried in the link
```

Bad or unknown values fall back to the default with a console warning. A broken
link should still put you in a car.

## Determinism

Every scattered object — 260 pines, 150 rocks, 170 bushes, the clouds, the
mountains — used to come from raw `Math.random()`, so no two loads of the same
track agreed on where anything was. They now draw from `core/rng.ts`, seeded
per track and **forked by name**: pines, rocks and bushes each have their own
stream, so adding a rock does not move the trees. The same track builds the same
world every time, on every machine.

Gameplay randomness is deliberately left unseeded — tyre smoke and AI jitter
should vary between runs.

## Checks

```bash
npm run gate              # typecheck + the track-format equivalence proof
npm run smoke:editor      # headless editor drive, ending in the game
npm run smoke:components  # components: discovery, preview, placement, real colliders
```

The last two need a build served on :8903 — see each file's header.
