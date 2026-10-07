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

A second batch of five arrived after the first, and it changes the reading:

7. **Vineyard grand prix, flat vector.** The same subject as 6, captioned
   **"LOW POLY RACING"** in the frame. Flat fills, no texture anywhere.
8. **A marina circuit — the only photograph in the set.** Superyachts moored
   three deep along a street circuit, grandstands, a city behind. Read as a
   *content* reference, not a style one: it says a harbour circuit lined with
   moored hulls is wanted. v1 already has MARINA BAY.
9. **Coastal rally stage, flat vector.** Red cliffs, a switchback descending to
   a bay, cypress, spectators, a stage timer in the corner.
10. **Alpine pass, low-poly 3D.** Faceted snow peaks, a gravel switchback, a
    turquoise glacial lake, scattered pines. **Untextured** — the road surface
    is flat colour. Dense: hundreds of individual facets and trees.
11. **Six arctic frames.** Ice cave under aurora, snow forest track, frozen
    waterfall canyon, night desert, a research station, a crevasse field. All
    flat-shaded low-poly, all vehicle-scale.

## Surface style — DECIDED, and it reverses part of this document

The two batches pull in different directions. Frame 5 has legible cobblestones
and roof tiles; frames 7, 10 and 11 have no textures at all, and one of them
says "LOW POLY" in the picture. That is a fork, not a nuance, so it was put to
the owner rather than guessed.

**The decision: flat-shaded faceted geometry everywhere, with the road textured.**

- Terrain, rock, foliage, buildings, boats, horizon: vertex colour on faceted
  geometry. No albedo maps, no normal maps. Silhouette and light do the work.
- The road surface and its markings: fully textured — cobble, tarmac, kerbs,
  start line, painted strips.

The reasoning is that the road is the one surface on screen for the entire race,
so it is where a texture budget returns the most, and it is exactly the surface
frame 5 makes legible. Everything else keeps the look of frames 10 and 11 and
costs a fraction as much on a phone.

**This reverses item 3 below.** That section was written from the first batch
alone and ranked material third across the whole world. It is now scoped to the
road, and the budget it would have spent moves to items 2 and 4 — which is the
better trade anyway, because "highly poly" means triangles.

**And it re-scopes the texture port already underway.** v1's 38 canvas
generators are still worth having, but for the road, markings, banners, number
plates, chevrons, kerbs and the finish gantry — not for cladding every wall and
roof in the world.

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

### 3. The road surface — and only the road

Frames 4 and 5 both put a cobbled road across most of the frame, and the cobbles
are legible: individual stones, worn and irregular. dustline paints every
surface with flat vertex colour and no map at all — six colours in
`SURF_COLORS`, lerped against grass — so the road reads as a grey ribbon rather
than a thing with a material.

Per the decision above this is now the *whole* texture programme. The road, its
kerbs, its painted markings and the gantry banners get real maps. Nothing else
does, and the walls and roofs stay flat-shaded, which is what frames 10 and 11
look like anyway.

### 4. Subdivision — the "high poly" ask

Every silhouette in the references is curved or crisply faceted, never a plain
box. Rocks are irregular; tree crowns are lumpy; hulls are lofted; walls have
thickness and a coping. Frame 10 is the clearest statement of the target: it is
untextured, and it reads well *entirely* because there are a great many facets
and a great many individual objects.

That is what "highly poly" means here — high triangle count in a low-poly style,
not photorealism. It is also why this item is worth more than it looks: with the
texture programme scoped down to the road, triangles are where the budget goes.

Subdivision is still listed after light, deliberately. A subdivided box under
flat light is still a box; the same box under item 1 with a contact shadow
already reads. Spend here once the light is right, and spend it on silhouettes
the camera gets close to.

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

**The flat-shaded decision buys headroom here, which is why it is the right one
for this target and not only an aesthetic call.** An untextured vertex-coloured
mesh costs no texture fetch, no texture memory and very little fill; a phone
running it is bound by vertices and draw calls rather than by fragments. That is
the cheap axis, and it is precisely the axis "more triangles" spends on. One
textured surface — the road — is a bounded exception rather than a policy.

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
