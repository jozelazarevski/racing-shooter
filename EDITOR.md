# WORLD EDITOR

The owner's build tool, inside the game. Open it from the title screen:
**🛠 WORLD EDITOR**, under START RACE. It always edits the world currently
selected in the track list.

## What it is

The editor does **not** draw its own world. It records *edits* and hands them
to the real Track builder, which rebuilds the world from scratch with those
edits in place. So what you sculpt is what the car drives on — the physics,
the tree scatter, the road drape, the waterline and the drawn ground all come
from the same rebuilt world.

That is why there is an **APPLY** button. Sculpting shows an immediate preview
on the drawn ground; APPLY is the moment the whole world is rebuilt around it.

## Tools

The rail is grouped by what the tool does to the world.

### SCULPT — the ground

| Tool | What it does |
|---|---|
| **RAISE / LOWER** | Push the ground up or down under the brush. |
| **SMOOTH** | Pull the middle toward the average height around the brush ring — flattens lumps without picking a level. |
| **FLATTEN** | Pull everything toward the height where you first pressed — the way to cut a terrace or a building pad. |
| **NOISE** | Roughen the ground: a scatter of small up-and-down lumps inside the brush. Broken hillsides, quarry floors, moraine. |

**SIZE** is the brush radius, **FORCE** the height change per dab, and **EDGE**
the *shape* of the brush. SOFT is the classic falloff — it meets zero with zero
gradient, so a stroke reads as a hillside with no crease at the rim. Turn EDGE
up and the brush gets a flat top and a defined shoulder, which is what a
terrace, a plateau or a quarry bench actually looks like. The shape is stored
per stroke, so a scene keeps the ground it was carved with.

### BUILD — things in the world

| Tool | What it does |
|---|---|
| **PLACE** | Drop the selected preset from the palette. Ghost markers show the layout; the real buildings appear at APPLY. |
| **NATURE** | Plant trees, bushes and rocks by hand. Pick a kind, then tap. **COUNT** turns one tap into a whole copse scattered across the brush, with the sizes and angles jittered — nobody is tapping four hundred times for a wood. |
| **WATER** | Tap to sink a lake (SIZE sets it). The tool digs the bowl *and* stands the water in it; SELECT the lake afterwards to set its **level** and width, which is how you flood a valley rather than puddle a field. |
| **ROAD** | Add a tunnel, a bridge or a river crossing. Pick TUNNEL, BRIDGE or RIVER under the ROAD button, then tap the road. These are built *by* the road system — they need a straight enough run and the right ground — so the tap means "about here" and the builder sites it at the nearest station that works, and says how far it had to go. |
| **MOVE ROAD** | Drag a marker on the racing line and the lap bends to follow it. The pull is stored, not baked: the terrain blend, the scenery, the elevation and the overpasses all read the moved line, so the world follows the road rather than the road sliding across the old world. |
| **WIDEN** | Tap the road and the carriageway there opens out; WIDER/NARROWER picks the direction and FORCE is metres of half-width per tap. Stated in world space like every other brush, so it survives a MOVE ROAD underneath it — the pull is on *the road near here*, wherever that road ends up. |

### EDIT — everything you have already made

| Tool | What it does |
|---|---|
| **SELECT** | Tap any object at all and it is picked up: one you placed, one the *world* built, or any solid — a tree, a rock, a wall. **Drag it on the ground to move it**, ROTATE to turn it, DELETE to remove it, and it leaves the built world immediately rather than waiting for APPLY. Taking a world-built structure over adopts it: a keep-out circle where it stood and an element of the same template where you put it. Tap a lake, a clear zone or a road pin instead and the panel on the right edits *its* numbers. ROT and SCALE aim the selection rather than the next placement; ROTATE, DUPLICATE and DELETE are on the panel, and on `ctrl+D` / `delete`. Anything with no template can be removed but not moved, and the panel says so rather than pretending. |
| **ERASE** | Remove what is under the brush — your buildings and your plants first, and if there were none, the world's own scenery instead. It always says which of the two it did. |
| **CLEAR AREA** | Delete what the WORLD built — trees, rocks, villages, dressing. Generated scenery is invented afresh on every build and has no stored identity, so the editor records a keep-out circle and the builders skip it. The red ring shows what goes; it takes effect at APPLY. |
| **ORBIT** | Camera-only mode, for when a drag should never paint. |

**More than one.** SHIFT-TAP a second object and it joins the selection;
shift-tap it again and it leaves. Everything the panel does then applies to
the whole group — move, turn, duplicate, delete — as one undo step, and a
group drag keeps the spacing between them, so a village moves as a village
rather than into a heap.

**Nudge.** A drag is how you place something; the **arrow keys** are how you
get it exactly right afterwards, which no amount of zoom lets a mouse do. One
unit a press, ten with SHIFT held.

One selection is described in **one** place — the panel on the right rail.

**SNAP** puts every placement on a grid, in units. Off by default.

The **CHANGES** panel on the right is a live itemised account of everything not
yet applied — dabs, objects, plants, removals, road moves, width changes,
lakes — because the editor's whole model is deferred and a sentence in the
status bar that the next action overwrites is not an account of your work.

## World recipe

The panel on the right builds a NEW world out of old parts, which is the
cheapest way to get somewhere new: nothing here needs new art.

- **LOOK** — wear another world's palette on this world's route. Pick
  CITADEL, DESERT, NEON CITY, ALPINE and so on; the route, the corners and
  the elevation stay exactly as they were, everything you see changes. Plants
  you placed by hand change with it — they take their colours from the live
  theme, so a hand-planted wood belongs to whichever country the scene is
  wearing.
- **SKY** — CLEAR, RAIN, SNOW or FOG. A deck is a patch over the theme in the
  theme's own language: it drives the ambient particles, tells the physics the
  road is wet or snowed, and closes the fog down in a squall. CLEAR strips a
  deck the world shipped with.

Both are saved with the scene, so a recombined world reloads exactly.

## Camera

- **Drag** — paint with the current tool (or orbit, in ORBIT mode).
- **Right-drag / middle-drag** — orbit, in any mode.
- **Two fingers** — pinch to zoom, drag to pan.
- **Wheel** — zoom.
- `1` top-down, `2` low angle, `0` back to the start line, `\` frame the
  selection.

## Keyboard

Press **?** for the full list, which is generated from the same table the
handler reads — the two cannot drift. In short: `Q W E R T` are the sculpt
brushes, `A S D F G` the build tools, `V X C` the edit tools, `[` and `]`
size the brush, the **arrow keys** nudge the selection (SHIFT for ten units),
`ctrl+Z` / `ctrl+shift+Z` undo and redo, `ENTER` applies, `P` test-drives,
`K` checks, and `ESC` closes whatever is open.

## Undo, and redo

One stack for everything, and it goes both ways. Every tool records the whole
scene either side of what it did, so a new tool is undoable the moment it
exists — there is no per-tool inverse to write and therefore none to get
wrong. A sculpt stroke is one step, not forty; a scattered copse is one step,
not twenty-five; a slider drag is one step, not one per pixel.

The selection tools also blank instances in the *built* world so a delete or a
move is visible before APPLY, and that lives on the GPU rather than in the
model. An action that hid something hands back a closure to put it back on
screen; the model is always the snapshot's job. That is what keeps the picture
and the scene from ever disagreeing about what is there.

A restore rebuilds every object in the scene from its snapshot, so anything
holding the old ones is holding corpses — which is why an undo drops the
selection rather than leaving it pointing at objects that are in no list at
all. Undo, then select again.

## Saving

**SAVE** stores the scene in the browser under a name you choose. **SCENES**
opens the browser: every saved scene with its base world, its recipe, what it
contains and how big it is, and LOAD / RENAME / DUPLICATE / DELETE on each.
Saved scenes appear at the top of the track list under **MY SCENES**, and
launch like any other world — base world plus your edits. They are not part
of the career: no stars, no credits, no unlock.

A scene is small (a heavily edited one is a few kB): it stores the dabs, the
placed objects, the plants and the base world id, never a mesh.

**CODES.** A scene code is the whole scene as text. Copy it out of one device
and paste it into another and you have the same world, because the code
carries the base world id with it. This is the path that does not need an
account or a network.

**THE DRAFT.** Work that has not been saved is written to a draft as you go,
and offered back the next time you open the editor on that world. It is
offered, never restored behind your back.

**TEST DRIVE** applies any pending edits and drops you straight into the world
to drive it. **CHECK** is the pass that reads the scene against the things
that only show up at speed: something standing in the carriageway, water
above the road it covers, a clear zone that swallowed the start line, a
sculpt too steep for ground to hold, a scene too big to save comfortably.

## Rules the editor enforces for you

- **The road is always drivable.** A sculpt is applied *before* the road
  clamps, so raising ground beside the carriageway banks it up against the
  road instead of burying it. You cannot accidentally wall the track in.
- **The drawn ground and the physics ground can never diverge.** Both ground
  functions read the sculpt (`terrainHeight` and `_terrainMeshHeight`), and
  `tests/test-editor.mjs` fails if they ever disagree — this was a real bug:
  the numbers reported a 34 u hill while the screen showed flat grass.
- **Placed buildings cost no draw calls.** They join the same batched
  instanced meshes the world's own buildings use.
- **Hand-planted nature costs one draw call per part per kind**, however many
  you plant, and it is real: an authored pine is in the world's tree list so
  it fells, and an authored boulder is in the solid list so it stops a car.
- **Unknown presets are skipped, not fatal**, so a scene saved against a later
  palette still loads on an older build. The same is true of plant kinds.
- **No water hangs over air.** A lake's rim is found, not clipped: each spoke
  searches outward for the radius where the ground crosses the water level,
  so the edge *is* the shoreline.

See `SCENE-RULES.md` for the construction rules every world — hand-built or
edited — has to satisfy.

## Scene format

`v: 2`. Version 1 scenes load unchanged: they had no `props`, their dabs
carried no brush shape, and their road features were counts rather than
places, and all three cases are read the way they were written.

```js
{ v, base, name, dabs[], erase[], waters[], warp[], widen[], props[],
  elements[], theme, weather, road: { tunnels[], bridge, rivers[] } }
```

## Not in this version

Road centreline editing beyond the drag handles (no adding or removing
control points), painting the ground surface directly, and animated or
scripted objects. The scene format carries a version field so these can be
added without breaking saved work.
