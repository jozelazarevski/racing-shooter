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

| Tool | What it does |
|---|---|
| **RAISE / LOWER** | Push the ground up or down under the brush. |
| **SMOOTH** | Pull the middle toward the average height around the brush ring — flattens lumps without picking a level. |
| **FLATTEN** | Pull everything toward the height where you first pressed — the way to cut a terrace or a building pad. |
| **PLACE** | Drop the selected preset from the palette. Ghost markers show the layout; the real buildings appear at APPLY. |
| **ERASE** | Remove objects *you* placed, inside the brush. (Sculpt strokes come off with UNDO.) |
| **CLEAR AREA** | Delete what the WORLD built — trees, rocks, villages, dressing. Generated scenery is invented afresh on every build and has no stored identity, so the editor records a keep-out circle and the builders skip it. The red ring shows what goes; it takes effect at APPLY. |
| **ROAD** | Add a tunnel or a bridge. Pick TUNNEL or BRIDGE in the WORLD RECIPE panel, then tap ROAD. These are built *by* the road system — they need a straight enough run and the right ground — so this asks for one more and the builder chooses a spot it can actually carry. |
| **ORBIT** | Camera-only mode, for when a drag should never paint. |

**SIZE** is the brush radius, **FORCE** the height change per dab.

## World recipe

The panel on the right builds a NEW world out of old parts, which is the
cheapest way to get somewhere new: nothing here needs new art.

- **LOOK** — wear another world's palette on this world's route. Pick
  CITADEL, DESERT, NEON CITY, ALPINE and so on; the route, the corners and
  the elevation stay exactly as they were, everything you see changes.
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

## Saving

**SAVE** stores the scene in the browser under a name you choose; **LOAD**
brings one back. Saved scenes appear at the top of the track list under
**MY SCENES**, and launch like any other world — base world plus your edits.
They are not part of the career: no stars, no credits, no unlock.

A scene is small (a heavily edited one is a few kB): it stores the dabs, the
placed objects and the base world id, never a mesh.

**TEST DRIVE** applies any pending edits and drops you straight into the world
to drive it.

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
- **Unknown presets are skipped, not fatal**, so a scene saved against a later
  palette still loads on an older build.

See `SCENE-RULES.md` for the construction rules every world — hand-built or
edited — has to satisfy.

## Not in this version

Road centreline editing, bridges/tunnels as placeable pieces, tree and rock
placement, water-level editing, and export/import codes for moving scenes
between devices. The scene format carries a version field (`v: 1`) so these
can be added without breaking saved work.
