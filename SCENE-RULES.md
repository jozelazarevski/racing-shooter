# SCENE-RULES.md — hard construction rules for every world

Every rule below was paid for with a shipped defect. A new world, a rebuilt
builder, or an editor-authored scene MUST honour all of them. Sibling doc:
`SCENES.md` (what each world should contain); this file is *how* anything is
allowed to be placed. When a rule names a probe, run it before shipping.

## 1. Water and shorelines

- **The straight coastline is a lie.** `T.coast` gives a straight (du, dn)
  frame and the sea mesh lays its first row at dn = 0 — but the heightfield
  meanders. Ground can rise above `coast.level` well seaward of dn 0.
  *Never* place a wet-zone fixture (pontoon, finger, pile, mooring, boat,
  ring, slipway foot) off the frame alone: ask the ground. Use
  `wetDn(du, need)` in `_buildMarina` (walks seaward for the first dn from
  which `need` metres stay drowned) or replicate its check. Defect: AEGEAN
  BLUE moored a whole basin, its fleet and 18 bollards in a meadow.
- **Water surface height is `coast.level`, not 0.** The sea mesh's origin y
  is not the surface. Any "is this under water" test compares
  `terrainHeight(x, z)` against `coast.level` (± margin), never against the
  sea mesh position or a guessed 0. Probe: `beached.mjs` (judges every
  `marina-*`/`flotilla`-named instance; must report 0 on every coastal world).
- **Boats float on their chine.** Hull datum: a hull runs −4.30..+4.70 local,
  deck at y = 1.0; floated at `waterline + 0.38 × scale`. A positive
  freeboard number is not proof — screenshot the boats at player camera
  (defect: "boats submerged" persisted through passing metrics).
- **Quay furniture needs a quay.** Bollards/cleats only where the waterline
  actually hugs the lip (`wetDn(du) ≤ 8`); a slipway seats its foot at the
  real waterline of its du. Rings live on pontoon lips, not on a span line.
- **River lips: no water hanging over air.** Water surface must end against
  ground or a fall lip mesh (hard rule + ceiling in `test-water`).
- **Rivers that cross roads get a drawn crossing** — ford wash mesh or a
  bridge; never a bare texture seam (r122).

## 2. Terrain, cliffs and seams

- **Seam closure is a contract.** Any profile sampled around the lap
  (`_cliffProfile`, coast shapes) uses *integer* frequency multiples of one
  lap and *no* `Math.random`. Position-keyed hashes only
  (`frac(sin(n·12.9898)·43758.5453)`) so rebuilds are stable and the seam
  closes.
- **Deterministic placement.** Scatter jitter that must survive a rebuild
  (editor Apply, PWA revisit) is hash-keyed on position/index, never on
  `Math.random` captured at build time — unless the builder is explicitly
  allowed to vary per build.
- **The horizon must never show the void.** Every sightline from the road at
  chase-camera height ends on terrain, massif ring, sea, or fog that has
  something behind it. A crest that looks into raw sky-wall is a defect
  (OLIVE beige-void; GOTTHARD grey-void). Verify with player-camera renders
  at crests, not top-down shots.
- **Fog is theme-local.** Compute `fogNear = max(T.fogNear × 0.72,
  min(T.fogNear, 190))` into `scene.fog` — never write derived values back
  into the shared theme object.
- **A mountain is not a cone.** No hill, peak, massif or skyline form may be
  a `ConeGeometry` (nor a cone jittered, sheared, or scaled). Build them with
  `_mountainGeo(seed, opts)`: height is measured from a *crest segment*, not
  an apex, so the form has a ridgeline with peaks and saddles, flanks that
  curve, spurs and gullies in azimuth, and no radial symmetry. Reported by
  the player twice — "they look like shark teeth".
- **Proportion is half the silhouette.** Ranges are far wider than tall.
  Keep placed height/width ≤ ~1.0 and aim for 0.3–0.6; anything ≥ 1.6 reads
  as a tooth whatever its shape. Verify with the aspect probe, not by eye.
- **Wind faces outward.** Azimuth increases anticlockwise seen from above,
  so a ring-to-ring quad is `(a, c, b)` / `(a, d, c)`. Wound the other way,
  a front-side material culls the entire outer surface and draws the
  *interior* — which reads as thin dark slivers and curved shells hanging
  off the skyline, not as missing geometry. Cost this file two separate
  bugs; check any new lofted or generated form with fog off.

## 3. Roads, tunnels and corridors

- **Tunnels are pure tubes.** No terrain, rocks, or scatter inside the bore;
  camera goes inside the tunnel, not top-down.
- **Corridor width.** The drivable corridor (road + clear shoulder) must not
  pinch below ~1.5× road width between scenery; measure with the corridor
  probe before dressing tight coasts (open item: some Med trails still
  cramped — do not copy them).
- **Roadside object size cap.** Within 26 u of the tarmac, tree scale caps at
  1.35 (chase-camera clearance); giants live ≥ 26 u out.

## 4. Structures

- **`kind: 'wall'` carries emissive window maps.** Templates that must not
  glow (ruins, sheds) use box/cyl/cone parts only (precedent: `puebloRuin`).
- **Chimneys root on roofs.** Every template part must connect; floating
  parts read instantly at player camera (HARBOR QUAY defect).
- **`vertexColors: true` needs a white base.** Geometry must carry a white
  `color` attribute (`_white()`) or instance colours multiply to black.
- **One material serves one colour scheme.** Two instanced meshes must not
  share a material when only one has vertex/instance colours.
- **Elements seat on the ground they claim.** `_element(...)` samples
  `terrainHeight` unless an explicit `yOverride` is passed (rocky spots,
  rim ruins); a `yOverride` of `undefined` is a bug — pass `null`.

## 5. Performance budget (mobile is the target)

- **Per-world ceilings: ≈ 340 k tris, ≈ 850–980 draws** (baseline census per
  world; new features stay within +15 % tris / +10 draws of the last shipped
  baseline). Census probe: `polycensus.mjs`.
- **Instance counts are nearly free; new mesh types are draws.** Prefer
  growing an InstancedMesh over adding meshes. `_bundle(geos)` welds static
  parts into one draw; `_strut(a, b, r, seg)` poses cylinders without Euler
  traps.
- **Sprites do not batch.** Every sprite is one draw call. Cloud/foam layers
  that need dozens of quads belong in an InstancedMesh.
- **Segment counts don't sell at distance.** Detail budgets go to *variety
  and placement* (r121 lesson), not to subdivision the player never sees.

## 6. Process gates (non-negotiable before ship)

1. `tests/test-static.mjs` — parses every module in module goal (catches
   duplicate declarations `node --check` misses) and checks the build tag.
2. Browser `BUILT OK` on every touched world (`err.mjs`), plus the relevant
   suites: buildings, nature, water, jumps, roam, newworlds.
3. **Player-camera screenshots** of every visual change — portrait viewport,
   chase height, the view the player actually has. Top-down probes lie.
4. **Measure the picture, not your hypothesis.** A passing metric that
   contradicts a screenshot is a wrong metric (sails/beached-boats lessons:
   test what the image shows, then explain the image).
5. In-engine census before/after; state the deltas against the budget.
6. Merge discipline: after merging `origin/main` back, `git diff HEAD` vs
   the pre-merge commit must be *empty* (auto-merge once silently reinstated
   reverted code).
7. sw.js: `CACHE` carries the build tag; `EXTRA` length equals the world
   count; both bump with every release/world.
