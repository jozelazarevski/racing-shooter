# ART DIRECTION — the look dustline is aiming at

This file exists because "make it look better" is not a specification and cannot
be checked. The owner supplied six reference images; the images themselves live
outside the repository, so what they actually demand is written down here in
terms an implementer can act on and a reviewer can hold work against.

Everything below is a description of the references, not an aspiration invented
here. Where a number is given it is a target to measure against, not a taste.

## The reference set

Six frames, all of the same game, all shot on a phone in portrait except the
last two:

1. **Harbour, from the pier.** A Mediterranean basin packed with moored hulls —
   forty or more, in three or four ranks. A stone town rises behind it in stacked
   terracotta rows. Wooden decking underfoot, palms in planters, a control tower.
2. **Coast road, from above.** A cliff road cut into terraced rock, sea below,
   scrub and small trees layered down the slope.
3. **Forest stage, golden hour.** Dense pine, low sun through the trunks, a dirt
   road with a berm, undergrowth continuous rather than scattered — cones,
   rocks, tussocks, ferns.
4. **Breakwater.** A cobbled quay on a stone mole, sailboats at anchor, a
   lighthouse, warm stone, soft contact shadow under every hull.
5. **Dalmatian town at sunset — the key frame.** A cobbled road winding down
   through a walled town to a bay. Terracotta roofs, a stone campanile, columnar
   cypress, lavender in flower at the roadside, cast-iron lamp posts, sailboats,
   rock islands offshore. Long warm shadows, low sun, haze on the water.
6. **Vineyard circuit.** Hundreds of vine rows following the contour of rolling
   hills, a villa, a windmill, spectator stands, banners, a tarmac road.

## What actually carries that look, ranked

The ranking matters: the first item is worth more than the rest combined, and
work done in the wrong order will look like nothing happened.

### 1. Light and grade

Frame 5 is carried almost entirely by light. The geometry underneath it is not
complicated — it is a low sun, long shadows, warm bounce into the shaded sides,
haze separating each headland from the next, and a soft highlight roll-off.

Concretely: a low sun elevation, ACES tone mapping with the exposure v1 already
tuned, bloom on the specular hits, an irradiance environment so shaded faces
pick up sky and ground colour instead of going flat grey, and ambient occlusion
in the contact between an object and the ground. Every reference has a visible
dark seat under every boat, wall and tree. dustline currently has none.

### 2. Density

The references are dense everywhere. Frame 1 has forty-plus hulls where
`harbour.json` places single digits. Frame 6 has hundreds of vine rows. Frame 3
has continuous undergrowth, not scattered props on visible bare ground.

This is mostly track data and scatter rules, not engine work — which makes it
the cheapest large win available, provided instancing holds up.

### 3. Material, not just colour

Frames 4 and 5 both put a cobbled road across most of the frame, and the cobbles
are legible — individual stones, worn and irregular. The town's roofs read as
tile courses. dustline paints its surfaces with flat vertex colour and no map at
all: six colours in `SURF_COLORS`, lerped against grass. That is why the current
render looks like a diagram of a world rather than a place.

### 4. Subdivision — the "high poly" ask

Every silhouette in the references is curved. Rocks are faceted but irregular;
tree crowns are lumpy; hulls are lofted; walls have thickness and a coping.
dustline's horizon is five-sided cones and much of the library is boxes.

Subdivision is listed fourth deliberately. A subdivided box under flat light
still looks like a box; the same box under item 1 with a contact shadow already
reads. Spend here after the light is right, and spend it on silhouettes the
camera gets close to.

### 5. Sky and distance

Frames 2, 5 and 6 all have layered distance — headlands fading into haze, an
horizon that is rock rather than triangles, a sun with visible atmosphere around
it. Frame 5 has offshore rock islands, which is a shape the format can already
describe and no track uses.

## What we already have that serves this

More than expected, which is why this is a fidelity pass and not a new library.
The component set is already Mediterranean: `campanile`, `church`, `lighthouse`,
`townhouse`, `towerhouse` (the Ligurian terrace), `oliveTree`, `vineRow`,
`terraceWall`, `quayWall`, `breakwater`, `slipway`, `mooringPost`, the four
hulls, `jetty`, `harbourCrane`. `harbour.json` is already a shoreline village
and the vineyard preset already terraces a slope.

The references are not asking for a different world. They are asking for the
world we have, lit properly and populated at ten times the density.

## What is missing, by name

- **Cypress.** Columnar, 8–15 m, dark — the single most identifying plant in
  frame 5 and absent from the library.
- **A cobbled surface.** See the note on cost below.
- **Flowering shrub.** Lavender at the roadside in frame 5; the references use
  flower colour as the only saturated accent against stone.
- **Rock islands / sea stacks.** Frame 5's bay is defined by them.
- **Roof tile, wall render and cobble textures.** v1 has a 38-generator texture
  library that dustline uses two functions from.
- **Ambient occlusion.** No contact shadow anywhere in the current build.

## The cobblestone decision, and its real cost

A cobbled road is central to two references, and there are two ways to get it,
with very different prices:

- **As a texture on an existing surface** — a map and a normal on `tarmac`.
  Cheap, visual only, no physics consequence, lands immediately.
- **As a seventh `SurfaceId`** — a new grip value that ripples into the tyre
  model, the baked racing line's speed profile, the AI, and the `verify:track`
  golden that proves surface classification is unchanged.

Take the texture first. The second is a gameplay change wearing an art costume,
and it should be decided as one, on its own, when somebody wants cobbles to
*drive* differently rather than to look right.

## The budget, stated before it is spent

**The references are phone screenshots.** Mobile Safari is the target, and it is
where uniform subdivision plus ten-times density stops being a look and becomes
a slideshow. Measured today, harbour is 303k triangles.

So the rule is: polygons go where the camera is, and density is bought with
instancing and distance LOD, never with more distinct draws. Every change that
raises geometry reports its measured triangle count and draw calls, per track,
before and after — the same discipline the rest of this repository already
applies to timings. A fidelity pass that ships an unplayable frame rate has
failed, and it fails silently unless the numbers are taken.

## What is deliberately not being chased

The references are rendered stills with painterly falloff and, in at least two
frames, hand-illustrated elements. A real-time rasteriser does not produce that
for free, and pretending otherwise sets up a target nothing can hit. What is
being chased is the *read* — warm low sun, dense inhabited world, legible
material, curved silhouette. Not a pixel match to a painting.

## How this gets checked

`npm run make:shots` renders documentation images with the real engine from the
committed tracks. The honest check on any of the work above is to add reference
angles to that tool, regenerate, and look — an engine render next to the target,
rather than a description of an improvement.
