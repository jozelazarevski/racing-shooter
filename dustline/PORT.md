# PORT LEDGER — what dustline took from IGNITE RALLY

## The rule

There are two games in this repository. **IGNITE RALLY** is at the root: vanilla
JS, hand-rolled physics, 60 worlds, its own vendored `lib/three.module.min.js`
and `lib/postprocessing/`. **dustline** is this folder: TypeScript, Vite, Rapier,
`three` from npm.

dustline takes a great deal from the older game — the house templates, the boat
loft, all 37 painted textures, the sky, the flora, the lighting numbers. **All of
it was copied across. None of it is imported.**

That distinction is the migration. A copy can be read, typed, reseeded and fixed
here without touching a game that still ships. An import makes the two builds one
build: a change to v1's `src/track.js` — 910 KB that nobody in this folder is
reviewing — could then break this one, and dustline could no longer be built,
tested or moved on its own.

**No file under `dustline/` may resolve a path outside `dustline/`.** Two escapes
are allowed and both are named in the gate: `../V2`, which is
dustline's own build output, and `../ARCHITECTURE.md`, which is a document that
`verify-templates.mjs` cross-checks a count against. Neither is v1 code.

### How it is enforced

`npm run verify:separation` (in the `gate` script) runs
`dustline/tools/verify-separation.mjs`, which checks six things:

1. no module specifier resolves outside `dustline/`;
2. no file path opened by dustline code points outside it either — checked
   against both the importing file and the working directory, because a
   `readFileSync` in `tools/` resolves against the latter;
3. no v1 module name, no `lib/postprocessing`, no vendored three appears
   **outside a comment** — naming `src/textures.js` in a provenance header is
   required by the porting convention, so the scan blanks comments first;
4. `three` is an npm dependency, every three import names the package, and no
   dependency is resolved from a local path;
5. no symlink under `dustline/` points outside it;
6. every file this ledger cites still exists, at both ends.

It exits non-zero on any failure. It was tested by planting five deliberate
violations — an import of `../../src/textures.js`, a `readFileSync('../src/main.js')`,
a string naming `lib/postprocessing/`, an import of `../../lib/three.module.min.js`,
and a `src/__v1link -> ../../src` symlink — and confirming each one is reported.

The `templates/` boundary is a separate, narrower rule with its own gate
(`npm run verify:templates`): at runtime `dustline/src/templates/` may import only
`three` and `../core/`.

## How to read this ledger

Paths are written so the two projects cannot be confused: a **v1 source** is
root-relative (`src/textures.js`), a **dustline destination** carries its folder
(`dustline/src/templates/textures.ts`).

| Column | Meaning |
|---|---|
| **VERBATIM** | The geometry, the constants and v1's own explanatory comments came across unchanged. |
| **ADAPTED** | Numbers or structure were deliberately changed. The reason is written in the destination file's header, at the site of the change. |
| **DERIVED** | Not a copy. Built here from a v1 part list, rule or idiom, and the header says which. |

Two conversions apply to **every** row and are not repeated in the table:

- **JS → TypeScript.** Where the original is a method on `Track`, it is a plain
  function here.
- **`Math.random()` → `Rng`** (`dustline/src/core/rng.ts`), with a fixed seed, so
  worlds and textures rebuild identically. `Math.random()` is banned in dustline
  world and art construction. Where a painter called it fifteen times, the stream
  is swapped underneath by `withStubbedRandom` rather than the call sites being
  rewritten — see the header of `dustline/src/templates/surfaces.ts` for why.

This ledger was built by reading the provenance headers actually in the tree, not
from the migration plan.

---

## 1. Painted textures

v1 paints every surface in that game in code — no image files. All 37 painter
functions in `src/textures.js` have a same-named counterpart here; the two files'
exports were diffed by name to confirm it, and nothing in v1's set is missing.

| v1 source | dustline | How | What changed |
|---|---|---|---|
| `src/textures.js` — `make`, `noiseTile`, `noiseOverlay`, `hexRgb` | `dustline/src/templates/canvas.ts` | ADAPTED | Private helpers in v1, because one file held all its textures; shared here because the textures are split by subject. The dither is seeded — `verify:generated` compares committed contact sheets against a fresh render, so a tile that repaints differently every load would fail that check forever. |
| `src/textures.js` — `stoneTexture`, `plankTexture`, `cliffTexture`, `crateTexture`, `coneTexture`, `barrelTexture`, `grassTexture` | `dustline/src/templates/surfaces.ts` | VERBATIM | Bodies character for character, comments included. Each is memoised, and `repeat` is a palette key rather than something a caller sets on the shared instance. |
| `src/textures.js` — `chevronTexture`, `checkerTexture`, `hazardTexture`, `awningTexture`, `crowdTexture` | `dustline/src/templates/markings.ts` | VERBATIM | Split from `surfaces.ts` by what the texture *is*: a surface is what a thing is made of, a marking is what somebody put on it. A marking rarely wants the noise pass. |
| `src/textures.js` — the remaining 25 painters: the road and its five surface-condition overlays (`applyWetRoad`, `applySnowRoad`, `applyIceRoad`, `applyCobbleRoad`, `applySandRipples`), `paintNeonLines`, ground cover, junction splat, fence, water maps, town facades, sky sprites, signage | `dustline/src/templates/textures.ts` | ADAPTED | Seven deliberate changes, each noted at its site. The two that alter numbers: the wheel-track geometry is a **parameter** (v1's `RUT_HALF_W = 1.3 / 22` is a car's half-track over the width of *its* road ribbon, correct only for a 22 u ribbon — it defaults to 22 here so an unmodified call paints v1's tile texel for texel), and `townhouseGlowTexture` mixes variant and `litFrac` into its seed so two facades differ in which rooms are lit. |

**Known and unresolved:** `roadTexture` is painted in v1's orientation (canvas x
across the ribbon, y along it). dustline's road ribbon uses the opposite
convention — `dustline/src/tracks/terrain.ts` writes u along the loop and v across
the width. Wiring this map to that mesh needs the UVs swapped or the map rotated a
quarter turn; a straight assignment would lay the wear marks across the road.
Recorded in the destination header.

## 2. Shape library

| v1 source | dustline | How | What changed |
|---|---|---|---|
| `src/track.js` + `src/world/catalog.js` — geometry helpers (`tri`, `quad`, `soup`, `bundle`, `strut`, `sailGeo`, `gablePrismGeo`, `boatHull`, `mergeGeoms`, `craggy`, …) | `dustline/src/templates/geometry.ts` | VERBATIM | Bodies unchanged; `Track` methods become plain functions. |
| `src/world/catalog.js` — `HOUSE_TEMPLATES` | `dustline/src/templates/buildings.ts` | VERBATIM | **26 archetypes, the same keys in the same order** (compared key-by-key against v1). Same part lists, same numbers, same comments. One change: the transform is applied to the geometry at build time instead of to an instance matrix at draw time, because a dustline component is one shared geometry per material rather than five world-wide instancing buckets. Composition order — scale, roll about Z, translate — is identical, so a part lands where v1 puts it. |
| `src/track.js` — `Track._buildMarina`, `Track._buildSea` (hull loft, rig, deck gear, trawler gantry, coachroof, fenders, portholes) | `dustline/src/templates/boats.ts` | VERBATIM | Same single change as the houses: offsets baked into the geometry rather than posed per instance. Numbers unchanged. |
| `src/world/sky.js` — `_horizonForms`, `_horizonGrad` | `dustline/src/templates/horizon.ts` | VERBATIM | The six skyline silhouettes — pyramid, spire, whaleback dome, mesa, asymmetric horn, saw-tooth ridge — plus the gradient dome and haze band. Each authored as a unit form (height 1, centred on the origin) so any seat-and-scale placement can use them. |

## 3. Rendering

| v1 source | dustline | How | What changed |
|---|---|---|---|
| `src/main.js` — `Game` constructor :912-942 (composer chain), `_applyTheme` :1926-1955 (PMREM dome) | `dustline/src/render/post.ts` | ADAPTED | Pass order, bloom numbers (strength 0.38, radius 0.45, threshold 0.88), the grade shader character for character with its uniforms, and the PMREM dome with its four dimming multipliers, all verbatim. **The passes come from the npm package** (`three/examples/jsm/postprocessing/*.js`), never v1's vendored `lib/postprocessing/`. The chain is optional and switches itself off under a software rasteriser, which v1 has no need for because it has no headless suite. The dome reads `TrackDef.sky` rather than a v1 theme object. Not ported: v1's per-level retune of exposure. |
| `src/main.js` — `Game` constructor :858-871 (renderer), :886-910 (sun) | `dustline/src/render/scene.ts` | ADAPTED | The renderer and shadow tuning. dustline had the same lights in the same places with none of the tuning; every number v1 sets there names the artefact it removes. `buildCarVisual` is dustline's own and was not touched. |
| `src/main.js` — `composer.render()` :6519, composer resize :1011, `_updateCamera` :1918 | `dustline/src/main.ts` | ADAPTED | The frame now goes through the composer, and v1's moving shadow rig re-aims the sun at the player every frame. |
| `src/world/sky.js` — `_buildSky` / `skyMethods` | `dustline/src/render/sky.ts` | ADAPTED | Five layers and their order; the shader; both haze rings; the whole cloud field with its formulas (`ceil(count * 1.5)` sprites, the squared size bias, the warm rim, the recession, the drift wrap); the 340-point star field. **Every length is v1's multiplied by `K`**, because v1's sky is authored around an absolute 900 u hill ring and a dustline track states its own in `sky.mountains.radius`. The dome is not v1's 3000 u — the arithmetic is at `domeR`. Sprite maps are cloned, because the editor's `disposeDeep` would otherwise dispose the shared cached instance and it would render black without logging. |
| `src/world/sky.js` — the range placement of `_buildHorizon` | `dustline/src/render/horizon.ts` | ADAPTED | The placement half: massifs clump into groups with open sky between them, and a group keeps one form and one height band so it reads as a single range. Ring radius and height come from the track's own `sky.mountains` rather than v1's per-theme constants. |
| `src/particles.js` — the pooled system, all 20 recipes; `src/vehicles.js:1150-1174` (the snow/water rooster tail, ported as `Particles.spray()`) | `dustline/src/render/particles.ts` | ADAPTED | Both shaders, the integrator and **every number in every recipe** verbatim. Six changes: the pool stays on `THREE.Points` because v1 sizes sprites in screen pixels and converting would mean re-deriving ~200 size constants by eye; the random stream is seeded (a deliberate departure from `core/rng.ts`'s note that runtime jitter is *not* seeded, argued in the header); per-call colour allocations hoisted out of the hot path; the mobile check is lazy so importing the file does nothing; `aColor` uploads only after a spawn; positions are `Vec3Like` so call sites need no allocation. dustline's own `WheelFX` was kept separate rather than folded in — its per-surface table is SPEC §1.2, not v1's. |
| `src/particles.js:658-736` — `SkidMarks`; `src/vehicles.js:1198-1210` — the emission gate | `dustline/src/render/skidMarks.ts` | ADAPTED | Quad size, colour, opacity, polygon offset, render order, 7 s life, 1.4 s shrink and the ring-buffer pool verbatim. Pool default raised 800 → 2000: a sliding car holds 7 / 0.028 × 2 = 500 slots and dustline races four, where v1's 800 covers one and a half and the ring wraps mid-corner. The emission clock moved here as `due()` and carries its remainder so mark spacing does not change with frame rate. |

**Not verified:** a skid mark is a flat quad at fixed Y and does not follow the
terrain. On dustline's crowned road the lift clears the crown at the centre; a
mark laid on one carriageway and viewed from the other has not been checked for
z-fighting. Recorded in the destination header.

## 4. World lighting presets

| v1 source | dustline | How | What changed |
|---|---|---|---|
| `src/world/themes.js` — `THEMES` (sky stops, fog distances, sun colour and intensity, hemisphere fill, cloud counts) | `dustline/src/tracks/presets.ts` | ADAPTED | Restructured from a flat theme list into **two independent axes — 8 lands × 7 weathers** (counted in the file), because alpine in snowfall and alpine at golden hour are the same terrain lit differently. v1's lighting numbers are carried into the entries. Fields with no v1 counterpart (octaves, scatter layers, surface zones) are new, because v1 generates terrain a different way. |

## 5. Touch controls

| v1 source | dustline | How | What changed |
|---|---|---|---|
| `src/input.js` — `bindJoystick`, `bindTouchButtons` | `dustline/src/core/input.ts` | ADAPTED | The floating base, `JOY_R = 62`, `JOY_DEAD = 0.14`, the `joyShape` rescale, the `0.42·a + 0.58·a³` steer blend, the resting-base placement, the mouse fallback and `passive: false` on exactly the two listeners that call `preventDefault()` — all verbatim. dustline had no touch input at all; on a phone the car did not move. Five changes: one shared `press()` path instead of v1's polled edge-trigger set; the touch axes merge into the existing `InputState` fields rather than adding a required field other files would have to satisfy; the merge is an identity when nothing is touched, so keyboard and pad behaviour is bit-identical to before; `autoThrottle`/`bothSteer` are **not** ported, because they belong to v1's two-button scheme and dustline's layout is a steering pad — shipping them would be a control nothing on screen can operate; the `data-key` codes are dustline's (handbrake is `Space`, nitro is `ShiftLeft`). |
| `index.html` — `#touch-ui`, `#joy-zone`/`#joy-base`/`#joy-knob`, `.tbtn`; `src/main.js:806`, :1000-1020, :1188-1196; `src/hud.js:95` — `drawSpeedo` | `dustline/src/ui/touch.ts`, `dustline/index.html` | ADAPTED | The speedometer geometry verbatim (0.75π start, 1.5π sweep, radii as canvas fractions, 24 arc segments, 40 km/h ticks, needle overhang), and v1's habit of re-placing the joystick base after a resize with delayed repeats. Five changes: detection is `(pointer: coarse)` alone, because v1 also accepts `'ontouchstart' in window` which is true on a touchscreen laptop; the palette is dustline's HUD cyan/amber, geometry unchanged; the dial redraws only when the rounded km/h or boost flag changed; `touch-action: none` is **not** set on `html`/`body` as v1 does, because an ancestor's `none` cannot be opted out of and the track picker is a list a thumb must drag; the FIRE button is drawn disabled with no `data-key`, because combat is M4 and unbuilt. |

## 6. World components

`dustline/src/world/props/` holds **109 components**, one file per placeable
thing, discovered by glob. **62 came from v1.** Every file names its v1 source in
its own header; the tables below are those headers.

### 6.1 Dwellings — `HOUSE_TEMPLATES` in `src/world/catalog.js`

All 26 are VERBATIM part lists. Each component file is a thin wrapper over
`dwelling()` in `dustline/src/templates/buildings.ts`; the shape is the template.

| v1 template | dustline |
|---|---|
| `adobe` | `dustline/src/world/props/adobeHouse.ts` |
| `barn` | `dustline/src/world/props/barn.ts` |
| `chapel` | `dustline/src/world/props/church.ts` |
| `cottageA` | `dustline/src/world/props/cottage.ts` |
| `cottageB` | `dustline/src/world/props/cottageHipped.ts` |
| `cottageC` | `dustline/src/world/props/cottageLong.ts` |
| `cottageD` | `dustline/src/world/props/farmhouseL.ts` |
| `cottageE` | `dustline/src/world/props/townhouse.ts` |
| `cottageF` | `dustline/src/world/props/halfTimbered.ts` |
| `cottageG` | `dustline/src/world/props/stoneCottage.ts` |
| `cottageH` | `dustline/src/world/props/chalet.ts` |
| `courtyard` | `dustline/src/world/props/courtyardHouse.ts` |
| `cube` | `dustline/src/world/props/cubeHouse.ts` |
| `domed` | `dustline/src/world/props/domedHouse.ts` |
| `house` | `dustline/src/world/props/farmhouse.ts` |
| `kiosk` | `dustline/src/world/props/kiosk.ts` |
| `logpile` | `dustline/src/world/props/logPile.ts` |
| `puebloRuin` | `dustline/src/world/props/puebloRuin.ts` |
| `shed` | `dustline/src/world/props/shed.ts` |
| `signalhut` | `dustline/src/world/props/signalHut.ts` |
| `silo` | `dustline/src/world/props/silo.ts` |
| `stilt` | `dustline/src/world/props/stiltHouse.ts` |
| `towerhouse` | `dustline/src/world/props/towerhouse.ts` |
| `watchtower` | `dustline/src/world/props/watchtower.ts` |
| `well` | `dustline/src/world/props/wellHouse.ts` |
| `windmill` | `dustline/src/world/props/windmill.ts` |

### 6.2 Flora — `src/world/flora.js`

| v1 function and species | dustline | How | What changed |
|---|---|---|---|
| `_buildForest(m4)`, species `pineB` | `dustline/src/world/props/pine.ts` | ADAPTED | Rebuilt on the three-tier conifer rather than the two-tier `pineA` this file was first built from. |
| `_buildForest(m4)`, two of nine species | `dustline/src/world/props/birch.ts` | VERBATIM | — |
| `_buildForest(m4)`, species `oak` | `dustline/src/world/props/oak.ts` | VERBATIM | — |
| `_buildOliveGrove(m4)`, species `oliveOld` | `dustline/src/world/props/oliveTree.ts` | VERBATIM | Crowns use `THREE.SphereGeometry` directly rather than `sphereAt`, because they are flattened and v1's segment counts (7,5) and (6,5) are not expressible through the helper. |
| `_buildOliveGrove(m4)`, species `oliveRow` | `dustline/src/world/props/orchardTree.ts` | ADAPTED | v1's numbers kept. A three-limb scaffold is added, because a pruned fruit tree is an open goblet on a clear stem. |
| `_buildPalms(m4)`, DATE PALM | `dustline/src/world/props/palm.ts` | VERBATIM | — |
| `_buildCacti(m4)`, SAGUARO | `dustline/src/world/props/cactus.ts` | VERBATIM | — |
| `_buildCharredTrees(m4)`, SNAG | `dustline/src/world/props/deadTree.ts` | VERBATIM | — |
| `_buildGroundCover(m4)`, understorey block | `dustline/src/world/props/bush.ts` | VERBATIM | No collider at any size, as in v1. |
| `_buildGroundCover(m4)`, grass-tuft block | `dustline/src/world/props/grassTuft.ts` | VERBATIM | Two crossed alpha-cut planes with `alphaTest: 0.45`, `DoubleSide`, `roughness: 1`. The first cut of this file built six solid triangles instead and was replaced. Palettes are v1's own, from `src/world/themes.js`. |
| `_buildForestFloorDecor(m4)` (sawn top) + `_buildCharredTrees(m4)` (`stRoot`, root flare) | `dustline/src/world/props/stump.ts` | ADAPTED | The pale cut disc and the root flare came across onto this file's existing bole. Without the cut face the component read as a brown lump from the only angle it is seen from. |
| `_buildForestFloorDecor(m4)` | `dustline/src/world/props/fallenLog.ts` | DERIVED | **The geometry is not v1's** — the header says so plainly; v1's log is a single 2.8 m cylinder and this one is better. What came across is v1's moss rule: two in five logs lerped 0.45 toward the foliage tone. |

### 6.3 Marine and harbour — `src/track.js`

| v1 source | dustline | How | What changed |
|---|---|---|---|
| `Track._buildMarina`, `KIND` 0 at `SCALE_OF` 0.86 | `dustline/src/world/props/launch.ts` | VERBATIM | — |
| `Track._buildMarina`, `KIND` 3 at `SCALE_OF` 1.10 | `dustline/src/world/props/fishingBoat.ts` | VERBATIM | — |
| `Track._buildSea`, the unrigged flotilla boat at scale 0.42 | `dustline/src/world/props/rowboat.ts` | ADAPTED | A floating component's origin is its waterline, not its keel. |
| `Track._buildSea`, the rigged flotilla boat at 0.62–0.72 | `dustline/src/world/props/sailboat.ts` | VERBATIM | — |
| `Track._buildMarina` — pontoon, fingers, piles | `dustline/src/world/props/jetty.ts` | VERBATIM | `shore` placement, not `water`: it stands on the bed. |
| `Track._buildMarina` — the docking ramp | `dustline/src/world/props/slipway.ts` | VERBATIM | — |
| `Track._buildQuayside` | `dustline/src/world/props/quayWall.ts` | VERBATIM | — |
| `Track._buildLighthouse` | `dustline/src/world/props/lighthouse.ts` | VERBATIM | Carried across part for part: battered plinth, banded tapering tower, corbelled gallery, glazed lantern with astragals, domed cap, finial. |
| `Track._buildLighthouse` — the mole | `dustline/src/world/props/breakwater.ts` | VERBATIM | Numbers intact. |
| `Track._buildLighthouse`, via `lighthouse.ts` | `dustline/src/world/props/beacon.ts` | DERIVED | The same part list at a quarter of the size — a 5.6 m harbour-mouth light, not a redesign. A lighthouse is a landmark, one to a coastline; a harbour needs three of the other thing. |

### 6.4 Civil and trackside structures — `src/track.js`

| v1 source | dustline | How | What changed |
|---|---|---|---|
| `Track._buildStoneBridges` (:5735) | `dustline/src/world/props/stoneBridge.ts` | VERBATIM | Section verbatim: 1.1 × 1.6 parapets, 2.2 × 9 × 3.2 arch blocks. Deck runs along +Z. |
| `Track._buildBridges` (:8554) + `Track._buildHeroBridge` (:3405) | `dustline/src/world/props/timberBridge.ts` | VERBATIM | Structure from the first, deck from the second. Same +Z convention, so the two bridges are interchangeable over a gully. |
| `Track._buildTunnel` (:6090) + `src/world/constants.js` | `dustline/src/world/props/tunnelMouth.ts` | VERBATIM | The bore profile including v1's constants. |
| `Track._buildArchGateway` | `dustline/src/world/props/archGateway.ts` | VERBATIM | Part for part. |
| `Track._buildCampanile` | `dustline/src/world/props/campanile.ts` | VERBATIM | Part for part; the tallest thing in the library. |
| `Track._buildRetainingWalls` (:3343) | `dustline/src/world/props/retainingWall.ts` | VERBATIM | 3.4 × 0.9 blocks; this run is three of them. |
| `Track._buildRiverCrossings` (:9245), non-ford branch | `dustline/src/world/props/culvert.ts` | VERBATIM | — |
| `Track._buildRiverCrossings` — depth markers | `dustline/src/world/props/fordStones.ts` | VERBATIM | `shore` placement. |
| `Track._spurDressing` (:6927) | `dustline/src/world/props/cattleGrid.ts` | VERBATIM | — |
| `_buildVineRows()` | `dustline/src/world/props/vineRow.ts` | VERBATIM | One 8.1 m bay; rows step 2.9 m across local X. |
| `_buildVineRows()` | `dustline/src/world/props/cropRow.ts` | DERIVED | By analogy, not by copy — a tilled strip with standing crop rather than trained vines, on the same +Z axis convention. |
| `_fieldProp(…, 'feedbin', K)` | `dustline/src/world/props/feedBin.ts` | VERBATIM | Box for box. |
| `_fieldProp(…, 'hayrack', K)` | `dustline/src/world/props/hayRack.ts` | VERBATIM | Box for box. |
| `_fieldProp(…, 'trough', K)` | `dustline/src/world/props/waterTrough.ts` | VERBATIM | Box for box. |

### 6.5 Built for dustline — 47 components with no v1 origin

Listed because a ledger is only trustworthy if it says what is *not* in it. Each
of these files states in its own header either that v1 has no equivalent, or
which v1 idiom it was built in the style of.

`barrelStack`, `barrierBlock`, `boatShed`, `boulder`, `buoy`, `busShelter`,
`capstan`, `chevronSign`, `cone`, `crate`, `dockLadder`, `fenceRun`, `fountain`,
`grandstand`, `guardrail`, `harbourCrane`, `hayBale`, `lightMast`, `lobsterPots`,
`marketStall`, `marshalPost`, `milestone`, `mooringPost`, `netLoft`, `oilDrum`,
`pallet`, `pitBuilding`, `quaySteps`, `reeds`, `roadSign`, `rock`, `rockSpire`,
`sandbagWall`, `scarecrow`, `scree`, `signpost`, `spareTyre`, `startGantry`,
`stoneWall`, `streetLamp`, `telegraphPole`, `terraceWall`, `trellisPost`,
`tyreStack`, `waterTower`, `willow`, `winePress`.

Two of these carry a partial debt worth naming: `trellisPost` uses v1's vine
stake (0.2 m square, 2.1 m of it) with a brace and foot built here, and `rock`
was ported from dustline's own earlier hardcoded `buildRocks` loop, not from v1.

## 7. Not ported from v1 at all

These are dustline's own and owe v1 nothing: the Rapier physics and vehicle
controller, the AI drivers and racing line, the race director, the track format
and terrain evaluator, the editor, the seeded RNG, the HUD and telemetry, the
track registry and picker, `WheelFX`, and `buildCarVisual`.

`dustline/src/core/rng.ts` is dustline's own code, but its header credits v1 for
the lesson: a world's crest count moved 6 → 0 across two loads there with no code
change, and a sinking-car report stayed open for weeks because it could not be
made to happen twice.
