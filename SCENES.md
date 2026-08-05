# IGNITE RALLY — Scene Plan

What each world is *of*, in the real world, and what therefore has to be in it.
This is the reference the scene work is built and checked against. Where the
game currently disagrees with the plan, that is written down as OUTSTANDING
rather than quietly left out.

## How a scene is judged

**1. You must be able to see the road.** Measured, not eyeballed: render the
world, decode the PNG in a *separate* page (reading a WebGL canvas without
`preserveDrawingBuffer` returns black), and score the **lower 60%** of the frame
— the part you drive in, not the sky — on **max channel**, because a red or
green world under-scores badly on Rec.709 luminance.

| band | mean | near-black (<46) | verdict |
|---|---|---|---|
| open daylight | 130–200 | <5% | desert, snow, ice |
| forest daylight | 75–100 | <20% | the PINE VALLEY reference: 81, 13% |
| deliberately dim | 55–80 | 30–50% | rainforest floor, redwood grove |
| night / firelight | 25–70 | 50–95% | neon, undercity, wildfire |

A world outside its band is a bug. AMAZON RAPIDS shipped at **29 mean / 84%
near-black** — two bands below where a daylight world belongs.

**2. The flora must be of the place.** A theme with no entry in `FLORA_MIX`
falls through to the default two-pine stand, which is how the Amazon came to be
planted with conifers. Every world names its species.

**3. Layers, not a single storey.** Real vegetation is emergent / canopy /
understorey / ground. One tree size repeated reads as wallpaper.

---

## The worlds

### Region: PINE VALLEY

**1 · PINE VALLEY** — *Pacific Northwest foothills, light rain.*
Douglas fir and western hemlock over birch and oak, salal understorey, wet
green pasture. Rain-dark dirt road, split-rail fences, hay, barns.
Flora: `pineA · pineB · birch · oak`. Fauna: cattle, sheep, deer.
Light 81 / 13% — **the reference band.** ✅

**12 · REDWOOD RAMPAGE** — *Humboldt County coast redwoods.*
*Sequoia sempervirens*: trunks that fill the frame, no lower branches, a fog
ceiling far overhead. Sword fern and sorrel below, root buttresses, fallen
giants. Deliberately dim — the grove floor genuinely is — but the light comes
from a bright fog ceiling, not from nothing. Light 57→**75 / 47%**. ✅

**13 · LOG FLUME FURY** — *Sierra Nevada logging country.*
Ponderosa and sugar pine, working timber: flumes, log decks, mill waste.
Flora: `pineA · pineB · birch · oak`. Light 84 / 18%. ✅

**14 · FOREST FIRE ESCAPE** — *crown fire in a lodgepole stand.*
Scorched trunks, ember glow, ash fall, smoke-filtered orange daylight.
Intentionally the darkest daylight world: 65 / 64%. Sits in the firelight band
by design — a fire escape that reads as a pleasant afternoon would be absurd —
but the bounce was raised so the road stays legible. ✅ *(by intent)*

### Region: AMAZON

**8 · AMAZON RAPIDS** — *Amazon basin, wet season.*
Three storeys, which is what actually reads as rainforest from a car:
- **emergent** — kapok (*Ceiba pentandra*), buttressed trunk, flat crown standing
  clear above everything. A minority, as in life: they read because they tower.
- **canopy** — cecropia, parasol crowns closing over the road.
- **understorey** — tree ferns in the gloom.

Flora: `cecropia 0.44 · treeFern 0.32 · kapok 0.24` — **added; the theme had no
mix at all and was planted with conifers.** ✅
The dense *corridor* trees — the ones forming the tunnel you actually drive
between — were cones too, and no scatter mix fixes that. Broadleaf themes
(jungle, redwood) now get stacked parasol crowns on a clear bole instead. ✅
Light: strong green bounce off wet leaves and a bright humid veil, not a
brighter sun (which would blow out the canopy and leave the floor black).
29 → **61 / 31%**. ✅
Fauna OUTSTANDING: capybara at the water, macaws over the canopy.

### Region: DESERT

**2 · DUST CANYON** — *Colorado Plateau.* Juniper and saltbush, red slickrock,
hoodoos. 177 / 1%. ✅
**4 · CANYON RUN** — *slot canyon.* Sheer walls, cottonwood on the floor. ✅
**9 · THE DUNE SERPENT** — *erg.* Almost no flora — that is the point. Date palm
only at the rare depression. ✅
**10 · ROCKFALL RAVINE** — *scree gorge.* Sparse scrub, loose rock. ✅
**11 · OASIS AMBUSH** — *date palm oasis.* Palm, tamarisk, irrigated green
against sand. 132 / 1%. ✅

### Region: SNOW & ICE

**3 · FROST PEAK** — *subalpine spruce.* Snow-loaded conifers, bare birch.
199 / 1%. ✅
**7 · GLACIAL PASS** — *glacier tongue.* Krummholz at the margin, blue ice. ✅
**15 · GLACIER'S GRIND** — *ice sheet.* Nearly bare: bare birch and pine only at
the moraine. ✅
**16 · AVALANCHE ALLEY** — *avalanche path.* Larch and pine, snapped stems in
the runout. ✅

### Region: VOLCANO

**5 · EMBER PASS** — *basaltic lava field.* Nothing green near the flows; scorched
trunks, ash cones, ember light. 76 / 17%. ✅

### Region: ALPINE PASSES

**6 · SUMMIT CLIMB**, **19 · GOTTHARD CLIMB**, **20 · TREMOLA DESCENT**,
**21 · FURKA RIDGE** — *Swiss alpine passes.*
Larch and spruce below the treeline, thinning to bare rock and pasture above.
Dry-stone walls, hairpin galleries, cowbells. Flora: `pineA · pineB · larch
(· birch)`. Fauna: cattle on the alp. ✅

### Region: CITY

**17 · NEON GRID EXPRESSWAY** — *night expressway.* No flora by design; light is
signage and maglev glow. 24 / 93% — night band. ✅
**18 · UNDERCITY SLIPSTREAM** — *service tunnels.* Moss and fungus only; sodium
light. 69 / 47%. ✅

---

## Fauna, by biome ✅

The herd system was already keyed per theme — the gap was the species list, not
the plumbing. Every ice world was stocked with DEER, an animal that does not
live on an ice sheet; the passes had generic goats; the deserts had camels
standing in for everything. Four species added, eleven now in the game.

| biome | animals |
|---|---|
| Pacific NW forest | cow · sheep · boar |
| redwood / logging | deer · boar · cow |
| Amazon | **capybara** · boar · deer |
| alpine passes | **ibex** · cow · sheep |
| snow edge | deer · **hare** |
| glacier / ice sheet | **seal** · hare |
| avalanche path | **ibex** · hare |
| desert / dunes / canyon / wadi | **coyote** · camel · goat |
| volcano, city | none — correctly |

## Understorey, by biome ✅

One squashed blob stood in for every ground layer — the same shape under
redwoods, in the Amazon, on an ice sheet and in a wadi. It is the layer you see
most of at eye height, so it is the layer that most gave away that the worlds
were one world repainted. Four silhouettes now:

| form | plant | worlds |
|---|---|---|
| `frond` | fern / sword fern | jungle, redwood, flume |
| `spray` | tussock / bunchgrass | alpine passes, snow, glacier, avalanche |
| `spike` | saltbush / creosote | desert, dunes, canyon, ravine, oasis |
| `blob` | broadleaf scrub | everywhere else |

A theme can override with `T.understorey`.

## Outstanding

- **Macaws over the Amazon canopy** are still not built. Every other animal in
  the plan rides the ground-herd system; birds need a flying actor, which is a
  new system rather than a new row in a table, so it is named here rather than
  half-done.
- **WILDFIRE and REDWOOD sit at the dim end of their bands** (64% and 50%
  near-black). Both are deliberately dark places; if they read as too dark in
  play, the fix is the foliage and terrain tones, not the lights — the lights
  have already been raised as far as they can go without flattening the scene.
