# RALLY WORLD BIBLE

**Companion to RALLY_RULES.md.** That document governs physics and collision. This one governs appearance. Same authority level: normative. If the world does not match this document, the world is wrong.

**Purpose:** eliminate iteration. Every region below is specified to the point where two separate implementations built from this file are visually interchangeable. No mood boards, no "make it feel rugged". Numbers, hex codes, species lists, dimensions.

---

## 0. GLOBAL LAWS

These override any regional rule that contradicts them.

| # | Law |
|---|-----|
| G1 | The roadbed is always the highest-contrast element in frame. If terrain or flora out-contrasts the road at 80 m, the region is misgraded. |
| G2 | Maximum 6 hero colours per region plus greyscale. Every asset samples from the region palette. No off-palette colour above 4% of screen area. |
| G3 | Foliage saturation never exceeds 55%. Structure saturation never exceeds 45% except on the designated accent. |
| G4 | Silhouette before detail. Every Tier 4 object must be identifiable as an obstacle by silhouette alone at 100 m through fog. |
| G5 | Verticality tells the player where the road goes. Poles, trees, and walls follow the corridor before the corner is visible. |
| G6 | No region uses more than 3 weather states. Every state must be authored and lit, never a post-process tint. |
| G7 | All buildings are shells. Interiors never exist. Openings are sealed flush with the frame. |
| G8 | Every region ships with a day, a low-sun, and one adverse variant. Night is a separate authored region, not a filter. |
| G9 | Assets are instanced. A region defines archetypes, never unique hand-placed meshes inside the corridor. |
| G10 | Scale check: the reference car is 4.10 m long, 1.82 m wide, 1.36 m tall. Every asset is dimensioned against it. |

### 0.1 Deterministic build order

Run in this exact order. Later stages read earlier output and never modify it.

1. Heightfield generation from region terrain profile
2. Centreline solve, corner grading per RALLY_RULES 1.3
3. Roadbed carve, shoulder, verge, camber, gradient smoothing
4. Surface painting from the region surface mix
5. Hydrology: rivers, lakes, fords, drainage, puddle low points
6. Structures: settlements, bridges, walls, fences
7. Flora scatter from seeded density
8. Props and set dressing
9. Fauna spawn points and spline authoring
10. Lighting, sky, fog, colour grade
11. Stage lint per RALLY_RULES 15

### 0.2 Camera and post reference

| Property | Value |
|----------|-------|
| Chase camera FOV | 68° at 0 m/s, lerping to 82° at 55 m/s |
| Bonnet camera FOV | 72° fixed |
| Exposure | Physically based, EV100 auto with 0.9 s adaptation, clamped ±1.5 EV from the region base |
| Motion blur | Camera and object, shutter 180°, disabled below 8 m/s |
| Depth of field | Off in gameplay. Replay only |
| Bloom | Threshold 1.6, intensity 0.35, region overrides allowed for night and desert |
| Chromatic aberration | Off |
| Film grain | 0.02 maximum, off on tarmac regions |
| Sharpening | 0.25 after upscale |

---

## 1. MATERIAL LIBRARY

Shared across all regions. Regions tint the albedo within ±8% lightness, never change roughness.

| Material | Albedo | Roughness | Metallic | Notes |
|----------|--------|-----------|----------|-------|
| `tarmac_new` | #2E2E30 | 0.82 | 0.0 | Aggregate normal, 2 m tiling |
| `tarmac_worn` | #3A3A38 | 0.88 | 0.0 | Crack decals, patch overlay |
| `gravel_road` | #8A7E6C | 0.94 | 0.0 | Parallax occlusion, 0.6 m tiling |
| `dirt_packed` | #6E5A42 | 0.93 | 0.0 | |
| `mud_wet` | #453424 | 0.42 | 0.0 | Wetness raises specular, not albedo |
| `sand_fine` | #C9A472 | 0.96 | 0.0 | |
| `red_dirt` | #A8492C | 0.95 | 0.0 | |
| `black_sand` | #26231F | 0.90 | 0.0 | Volcanic, slight sparkle flakes |
| `snow_fresh` | #EEF2F6 | 0.72 | 0.0 | Subsurface tint #C8D8E8 |
| `snow_packed` | #DCE3EA | 0.60 | 0.0 | |
| `ice_black` | #4A5258 | 0.18 | 0.0 | Clearcoat 0.9 |
| `stone_granite` | #7A7770 | 0.85 | 0.0 | |
| `stone_limestone` | #B5AC98 | 0.88 | 0.0 | |
| `stone_rubble_wall` | #8E8578 | 0.90 | 0.0 | Mortar variation mask |
| `pise_earth` | #C08A55 | 0.92 | 0.0 | Rammed earth, straw fleck |
| `render_limewash` | #E0D6C0 | 0.86 | 0.0 | Chalky, patchy erosion mask |
| `timber_weathered` | #6B5641 | 0.88 | 0.0 | Grain aligned to plank direction |
| `timber_painted` | #6E2A26 | 0.74 | 0.0 | Falu red base, region recolour |
| `slate_roof` | #4A4E52 | 0.68 | 0.0 | |
| `terracotta_tile` | #B5623A | 0.80 | 0.0 | |
| `corrugated_iron` | #8E8478 | 0.55 | 0.85 | Rust mask driven by an age float |
| `corrugated_painted` | #B8402E | 0.50 | 0.60 | |
| `thatch` | #A88B52 | 0.95 | 0.0 | |
| `concrete_cast` | #9A9894 | 0.86 | 0.0 | |
| `steel_guardrail` | #9EA2A4 | 0.42 | 0.90 | Scuff decals at 0.6 m height |
| `glass_window` | #1A2028 | 0.08 | 0.0 | Never transparent. Faked interior gradient |
| `rust_heavy` | #7A4326 | 0.92 | 0.55 | |
| `cobble_wet` | #3E3C3A | 0.32 | 0.0 | |

---

## 2. HOUSE AND STRUCTURE KIT

All buildings are assembled from the same grammar. Regions choose parts and dimensions.

### 2.1 Grammar

```
Building
 ├─ Plinth        0.0 to 0.6 m, stone or concrete, always present on sloped ground
 ├─ Body          1 to 3 storeys, floor height 2.4 to 3.0 m
 ├─ Openings      window rhythm and door, per archetype
 ├─ Roof          pitch, overhang, material, ridge direction
 ├─ Attachments   chimney, balcony, stair, awning, woodpile, dish, aerial, sign
 └─ Weathering    age float 0.0 to 1.0 driving dirt, rust, moss, paint loss
```

### 2.2 Universal collider rules

| Part | Tier | Notes |
|------|------|-------|
| Body walls | 4 | Single box or convex hull. Never per-brick geometry |
| Roof overhang | 4 if below 3.2 m, otherwise none | |
| Windows, shutters | 2 | Breakable, cosmetic only |
| Doors | 2 | Swing or shatter |
| Balcony, external stair | 4 | Must not project into the verge |
| Chimney, aerial, dish | 0 | Above reachable height |
| Awning, sign, drying rack | 1 | Breakaway |
| Woodpile, crates, barrels | 3 | Dynamic |

### 2.3 Settlement placement

| Rule | Value |
|------|-------|
| Minimum building setback from roadbed edge | 4.0 m |
| Buffer required if a corner falls within 6 m | Bales, barriers, or a bank in front of the corner |
| Gate or arch minimum clear width | 4.5 m |
| Straight approach before a gate or arch | 20 m |
| Landmark spacing inside a settlement | One distinct silhouette per 200 m |
| Maximum continuous building frontage | 120 m before a break for a yard, alley, or field |
| Settlement length as share of stage | Never more than 18% |

### 2.4 Archetype catalogue

Dimensions are footprint width × depth in metres.

| ID | Name | Footprint | Storeys | Roof pitch | Roof | Walls | Windows | Accent | Region |
|----|------|-----------|---------|-----------|------|-------|---------|--------|--------|
| `H_ALP_CHALET` | Alpine chalet | 9.5 × 7.5 | 2 + loft | 22° | timber shingle over slate | Stone ground floor, timber upper | 1.1 × 1.3 m, paired, 4 per facade | Shutters, painted | Alpine |
| `H_ALP_STADEL` | Hay barn on stilts | 7.0 × 5.5 | 1 raised 0.9 m | 18° | timber shingle | Blackened timber, ventilation gaps | Slot vents only | None | Alpine |
| `H_OAS_KASBAH` | Pisé courtyard house | 12.0 × 12.0 | 2 | flat, 2% fall | Rammed earth over beams | Pisé, 0.6 m thick, battered 4° | 0.6 × 0.9 m, deep reveal, 3 per facade | Painted door, indigo | Oasis |
| `H_OAS_TOWER` | Corner granary tower | 4.5 × 4.5 | 3 | flat, crenellated | Earth | Pisé with palm-beam ends protruding | 0.4 × 0.6 m slits | None | Oasis |
| `H_DES_OUTPOST` | Mud brick outpost | 8.0 × 6.0 | 1 | flat, 3% fall | Earth over timber | Mud brick, whitewashed base | 0.7 × 0.8 m, 2 per facade | White plinth band | Desert |
| `H_DES_TENT` | Nomad tent | 9.0 × 5.0 | 1 | Tensile, 2.6 m peak | Goat hair cloth | Open sides | None | Rug colours | Desert |
| `H_AMZ_STILT` | Stilt house | 8.0 × 6.0 | 1 raised 1.8 m | 26° | Corrugated iron, rusted | Rough plank, gapped | Unglazed openings 0.9 × 1.1 m | Painted plank, faded blue | Amazon |
| `H_NOR_FARM` | Falu red farmhouse | 11.0 × 7.0 | 1.5 | 38° | Clay tile or metal sheet | Painted board, falu red | 1.0 × 1.2 m, white trim, 5 per facade | White corners and trim | Nordic |
| `H_MED_CORTIJO` | Limewash cottage | 10.0 × 8.0 | 1 to 2 | 20° | Terracotta pantile | Limewash render over rubble | 0.9 × 1.1 m, deep reveal, 3 per facade | Terracotta trim, iron grille | Mediterranean |
| `H_URB_TOWNHOUSE` | Old town row unit | 6.5 × 11.0 | 3 to 4 | 45° | Slate or tile | Render over masonry | 1.0 × 1.8 m, strict vertical rhythm | Ground floor shopfront | Urban |
| `H_FRM_LONGHOUSE` | Stone longhouse | 14.0 × 6.0 | 1.5 | 42° | Slate | Rubble stone, lime pointed | 0.8 × 1.0 m, irregular, 4 per facade | Painted door, dark green | Farmland |
| `H_VOL_CORRUGATE` | Corrugated house | 8.5 × 7.0 | 1 | 30° | Corrugated painted | Corrugated over timber frame | 1.0 × 1.2 m, white frames | Roof colour, red or green | Volcanic |
| `H_OUT_HOMESTEAD` | Veranda homestead | 16.0 × 10.0 | 1 | 15° | Corrugated iron, unpainted | Weatherboard | 1.0 × 1.4 m, shaded by veranda | Veranda posts, water tank | Outback |
| `S_UNI_SERVICE` | Service park tent | 12.0 × 8.0 | awning 3.2 m | flat | PVC canopy | Open | None | Sponsor banding | All |
| `S_UNI_FUEL` | Roadside fuel stop | 10.0 × 6.0 canopy | 1 | flat | Steel canopy | Render or corrugated | Glazed shopfront | Brand colours | All |
| `S_UNI_CHAPEL` | Wayside chapel | 5.0 × 7.0 | 1 + belfry | 40° | Regional | Regional | Arched 0.7 × 1.6 m | White render | All |

### 2.5 Window rhythm rule

Never randomise window placement. Use a grid: `bay width = facade width / bayCount`, window centred in each bay, sill at 0.95 m, head at 0.35 m below the ceiling line. Ground floor may substitute a door for one bay. Asymmetry comes from attachments and weathering, never from misaligned openings, which read as broken geometry at speed.

---

## 3. REGIONS

Eleven regions. Each is a complete, self-contained authoring target.

---

### 3.1 ALPINE PASS

**Region key:** `alpine_pass`. Reference: Swiss and Austrian high passes, Rallye Mont Blanc, Rally Deutschland hillside sections.

**Identity:** narrow tarmac and hardpack cut into a valley wall. The player is always aware of exposure on one side and rock on the other.

| Terrain | Value |
|---------|-------|
| Base elevation | 900 to 1850 m |
| Elevation change per stage | 550 to 900 m net |
| Dominant gradient | 8 to 18%, sustained |
| Corner grade distribution | G1 18%, G2 24%, G3 26%, G4 18%, G5 10%, G6 4% |
| Terrain character | Hard rock cut on the inside, drop on the outside, alternating every 400 to 900 m |
| Slope outside corridor | 34 to 52°, mostly non-recoverable |

| Road | Value |
|------|-------|
| Surface mix | `tarmac_patched` 55%, `tarmac_dry` 25%, `gravel_hardpack` 15%, `cobble` 5% |
| Roadbed width | 5.5 to 7.0 m, 4.2 m at two authored chokepoints |
| Edge treatment | Inside: rock cut with a 0.4 m drainage channel. Outside: stone parapet 0.55 m, then steel guardrail on the fastest sections |
| Hairpin treatment | Widen to 11 m, inside apex is a raised stone kerb 0.14 m, outside is off camber at -6% |

| Light and atmosphere | Value |
|----------------------|-------|
| Sun elevation | 38° |
| Sun azimuth | 130° relative to stage forward |
| Colour temperature | 5600 K |
| Directional intensity | 95000 lux |
| Ambient sky intensity | 0.35 |
| Shadow softness | 2.5° source angle |
| Fog model | FogExp2, density 0.00035, colour #B4C6D8 |
| Height fog | Valley floor only, base 900 m, top 1100 m, density 0.0012 |
| Base EV100 | 14.2 |

| Palette | Hex |
|---------|-----|
| Sky zenith | #2C6FBF |
| Sky horizon | #A9C8E6 |
| Ground base | #6E6A5E |
| Foliage mid | #33452C |
| Structure primary | #6B5641 |
| Accent | #C4362C |

**Flora**

| Species | Tier | Height | Trunk | Weight in scatter |
|---------|------|--------|-------|-------------------|
| Norway spruce, mature | 4 | 18 to 26 m | 0.34 to 0.50 m | 0.34 |
| Norway spruce, young | 3 | 6 to 11 m | 0.20 to 0.27 m | 0.18 |
| Larch | 4 | 15 to 22 m | 0.30 to 0.42 m | 0.14 |
| Alpine rhododendron clump | 2 | 0.9 m | n/a | 0.16 |
| Bilberry and heath mat | 0 | 0.3 m | n/a | 0.12 |
| Alpine meadow grass | 0 | 0.4 m | n/a | 0.06 |

Tree line sits at 1750 m. Above it, flora is Tier 0 and Tier 1 only, and the corridor is defined by snow poles and rock instead.

**Fauna:** chamois on distant slopes, non-collidable. Marmots as ambient Tier 0. One authored cattle crossing on a lower-altitude farmland segment. Alpine chough circling on thermals for scale reference.

**Architecture:** `H_ALP_CHALET`, `H_ALP_STADEL`, `S_UNI_CHAPEL`. Hamlets of 4 to 9 buildings at 2 or 3 points per stage, always on a shelf of flatter ground where the gradient falls below 6%. Chalets present their gable end to the road. Woodpiles stack against the uphill wall, 1.8 m high, Tier 3. Snow poles in red and white, 2.4 m, at 25 m spacing on the outside edge above 1500 m.

**Water:** meltwater channel running parallel on the inside edge, 0.4 m wide, 0.15 m deep, `water_shallow`. Two waterfall crossings where the channel passes over the road under a stone slab. One gorge bridge, stone arch, 32 m span, deck width 6.2 m, parapet 0.9 m.

**Props:** hairpin marker mirrors on a post, avalanche gallery entrance at one point, kilometre stones, cut-log stacks, hay racks, a single funicular or cable car line crossing overhead at 22 m.

**Hazard signature:** the drop. Off-camber hairpin exits and stone parapets that catch a wheel. Brake fade on the descent half is mandatory and authored, per RALLY_RULES 7.5.

**Never:** trees on the exposed side within 6 m of the edge, guardrails on hairpins, more than 80 m of continuous guardrail, snow on the road below 1400 m in the summer variant.

---

### 3.2 MOUNTAIN OASIS

**Region key:** `mountain_oasis`. Reference: High Atlas gorges, Dades and Todra, Ounila valley.

**Identity:** a dry ochre gorge with a thin green ribbon of palms and irrigated terraces on the valley floor. Extreme contrast between the shaded gorge and the sunlit rim.

| Terrain | Value |
|---------|-------|
| Base elevation | 1200 to 2100 m |
| Elevation change per stage | 400 to 700 m |
| Dominant gradient | 6 to 14%, with two 20% ramp sections |
| Corner grade distribution | G1 14%, G2 20%, G3 24%, G4 22%, G5 14%, G6 6% |
| Terrain character | Vertical gorge walls 40 to 120 m, alluvial fan floor, terraced shelves |

| Road | Value |
|------|-------|
| Surface mix | `gravel_hardpack` 40%, `dirt_dry` 30%, `tarmac_patched` 20%, `cobble` 10% |
| Roadbed width | 4.8 to 6.5 m |
| Edge treatment | Dry stone retaining wall on the downhill side, 0.8 to 2.4 m tall, Tier 4. Rock face uphill |
| Special | Three ford crossings of the wadi, per RALLY_RULES 6.3 |

| Light and atmosphere | Value |
|----------------------|-------|
| Sun elevation | 62° |
| Sun azimuth | 95° |
| Colour temperature | 5100 K |
| Directional intensity | 118000 lux |
| Ambient sky intensity | 0.42, with strong bounce from the gorge walls tinted #C58A52 |
| Shadow softness | 1.2° |
| Fog model | FogExp2, density 0.00055, colour #DCC9A6 |
| Dust haze | Additive layer, density 0.0009 below 30 m altitude above ground |
| Base EV100 | 15.4 |

| Palette | Hex |
|---------|-----|
| Sky zenith | #3F86C4 |
| Sky horizon | #E4CFA8 |
| Ground base | #B5793F |
| Foliage mid | #4B6B2E |
| Structure primary | #C08A55 |
| Accent | #2E6E7E |

**Flora**

| Species | Tier | Height | Trunk | Weight |
|---------|------|--------|-------|--------|
| Date palm | 4 | 12 to 18 m | 0.42 m | 0.22 |
| Young palm | 3 | 4 to 7 m | 0.28 m | 0.10 |
| Olive, gnarled | 4 | 5 to 8 m | 0.55 m | 0.14 |
| Fig and pomegranate | 3 | 3 to 5 m | 0.22 m | 0.12 |
| Oleander clump | 2 | 1.8 m | n/a | 0.16 |
| Tamarisk scrub | 1 | 1.2 m | n/a | 0.14 |
| Barley terrace crop | 0 | 0.7 m | n/a | 0.12 |

Flora is banded strictly by water. Palms and crops only within 40 m of the wadi line. Beyond that, bare rock and tamarisk. This banding is what makes the region readable, so do not blend it.

**Fauna:** goats on the terraces and on the retaining walls, penned behind dry stone, Tier 2 wall collider. One authored goat crossing per stage. Storks nesting on tower tops. Donkeys tethered near buildings, non-collidable, 5 m from the road minimum.

**Architecture:** `H_OAS_KASBAH`, `H_OAS_TOWER`, `S_UNI_SERVICE`. Villages cling to the gorge side at a 4° batter, stacking so the roof of one is the terrace of the next. Palm-beam ends protrude 0.35 m from walls at each floor line. Wall colour derives from local earth, so the village and the gorge share a hue within 12° of each other. Doors and window frames carry the indigo accent, and this is the only saturated colour in the region.

**Water:** a wadi with a 6 to 14 m channel, running water 0.10 to 0.30 m deep at the fords, dry gravel elsewhere. Irrigation channels 0.4 m wide crossing under the road through culverts, flagged with a 0.06 m concrete lip. Palm-shaded pools as visual anchors, never drivable.

**Props:** dry stone terracing walls stepping up the valley, threshing floors, blue-painted doors, drying dates on rooftop racks, satellite dishes, a mud brick minaret as the landmark silhouette.

**Hazard signature:** the retaining wall. Falling off the outside into the terraces below. Fords that destabilise on a bad entry angle. Blinding contrast when exiting gorge shade into full sun, which the exposure adaptation makes real.

**Never:** green grass, temperate trees, guardrails, tarmac in the villages, buildings that contrast with the rock they sit on.

---

### 3.3 DEEP DESERT

**Region key:** `deep_desert`. Reference: Namib, Erg Chebbi transition zones, Baja wash sections.

**Identity:** speed and space. Long sight lines, soft edges, and a road that is a suggestion rather than a boundary.

| Terrain | Value |
|---------|-------|
| Base elevation | 200 to 600 m |
| Elevation change per stage | 120 to 250 m |
| Dominant gradient | 2 to 7%, with dune crests up to 24% over short distances |
| Corner grade distribution | G1 4%, G2 8%, G3 14%, G4 22%, G5 28%, G6 24% |
| Terrain character | Alternating open pan, dune field, and incised wash with 2 to 5 m banks |

| Road | Value |
|------|-------|
| Surface mix | `sand` 35%, `gravel_loose` 25%, `dirt_dry` 25%, `gravel_deep` 15% |
| Roadbed width | 6.0 to 9.0 m, widening to 14 m across open pan |
| Edge treatment | None on the pan. Wash sections have hard 2 to 5 m banks, Tier 4 |
| Special | Corridor is defined by wheel tracks and marker cairns, not by geometry |

| Light and atmosphere | Value |
|----------------------|-------|
| Sun elevation | 71° for the day variant, 12° for the low-sun variant |
| Sun azimuth | 20° |
| Colour temperature | 5400 K day, 2900 K low sun |
| Directional intensity | 128000 lux day, 42000 lux low sun |
| Ambient sky intensity | 0.48, ground bounce tinted #D6A874 |
| Shadow softness | 0.9° |
| Fog model | FogExp2, density 0.00110, colour #E8D2AC |
| Heat shimmer | Screen-space distortion above 40 m distance, amplitude 0.0025, disabled in the low-sun variant |
| Base EV100 | 16.1 |

| Palette | Hex |
|---------|-----|
| Sky zenith | #2E7BC8 |
| Sky horizon | #F0D9AE |
| Ground base | #C97A46 |
| Foliage mid | #7A8455 |
| Structure primary | #9C8B6E |
| Accent | #D8D2C4 |

**Flora**

| Species | Tier | Height | Trunk | Weight |
|---------|------|--------|-------|--------|
| Acacia, mature | 4 | 6 to 9 m | 0.38 m | 0.10 |
| Acacia, young | 3 | 3 to 4 m | 0.18 m | 0.12 |
| Desert scrub bush | 1 | 0.8 m | n/a | 0.38 |
| Tussock grass clump | 0 | 0.5 m | n/a | 0.32 |
| Dead wood, fallen | 3 | n/a | n/a | 0.08 |

Total density is the lowest of any region. Emptiness is the point. Acacias are placed as navigation landmarks, one every 200 to 400 m, never in clusters.

**Fauna:** oryx and springbok at 80 to 200 m, fleeing at 40 m, never crossing. Vultures circling above a fixed point as a distance cue. One authored camel train crossing near a settlement, moving at 1.2 m/s, clearing in 1.8 s.

**Architecture:** `H_DES_OUTPOST`, `H_DES_TENT`, `S_UNI_FUEL`. Settlements are small, 3 to 6 structures, always at a well or a wash confluence. Buildings are single storey with a whitewashed plinth band 0.9 m tall, which is the only bright element and doubles as a distance marker. Tents are pitched in clusters of 3 with a shared rug-covered ground area, non-collidable.

**Water:** none permanent. One authored flash-flood wash section with 0.15 to 0.30 m of water over `gravel_loose`, only in the adverse variant. A well head with a trough, Tier 3.

**Props:** marker cairns 1.1 m tall every 120 m, oil drums painted white, wrecked truck as a landmark, tyre tracks decals, fence posts with no fence, a wind pump 8 m tall.

**Hazard signature:** the wash bank. Sand that drags a car to a stop if the line is wrong. Dune crests hiding the next corner. Low-sun variant where the sun sits directly in the driving direction for 900 m.

**Never:** green vegetation, standing water outside the authored flash flood, tarmac, dense object clusters, fog other than dust.

---

### 3.4 AMAZON RAINFOREST

**Region key:** `amazon_forest`. Reference: Rondônia logging roads, Transamazônica laterite tracks.

**Identity:** a green tunnel. Claustrophobic, wet, low contrast, and the only region where the canopy above matters as much as the road.

| Terrain | Value |
|---------|-------|
| Base elevation | 60 to 320 m |
| Elevation change per stage | 90 to 200 m |
| Dominant gradient | 3 to 11%, with short 18% clay ramps |
| Corner grade distribution | G1 10%, G2 18%, G3 26%, G4 24%, G5 16%, G6 6% |
| Terrain character | Rolling laterite ridges, steep-sided stream gullies every 300 to 600 m |

| Road | Value |
|------|-------|
| Surface mix | `dirt_wet` 35%, `mud` 25%, `dirt_dry` 20%, `gravel_loose` 15%, `water_shallow` 5% |
| Roadbed width | 4.5 to 6.0 m |
| Edge treatment | Cut bank on one side 1.5 to 4 m, drainage ditch 0.8 m deep on the other, Tier 4 |
| Special | Deep persistent ruts, `rutDepth` 0.08 to 0.12 across 60% of the stage |

| Light and atmosphere | Value |
|----------------------|-------|
| Sun elevation | 74° |
| Sun azimuth | 175° |
| Colour temperature | 6200 K, filtered through canopy to an effective 5200 K |
| Directional intensity | 110000 lux above canopy, 8000 to 22000 lux at road level |
| Canopy shadow | Animated breakup texture, 6% to 40% light transmission, scrolling at 0.15 m/s |
| Ambient sky intensity | 0.55, tinted green #2E4A2A from canopy bounce |
| Shadow softness | 4.0° |
| Fog model | FogExp2, density 0.00420, colour #C0CDBE |
| Height fog | Ground mist, base 0 m, top 6 m, density 0.0090, strongest at dawn variant |
| Base EV100 | 11.8 |

| Palette | Hex |
|---------|-----|
| Sky zenith | #7E9BA8 |
| Sky horizon | #C8D2C4 |
| Ground base | #4A3524 |
| Foliage mid | #1E4A25 |
| Structure primary | #7A6A4E |
| Accent | #C25A2E |

**Flora**

| Species | Tier | Height | Trunk | Weight |
|---------|------|--------|-------|--------|
| Emergent kapok or brazil nut | 4 | 35 to 50 m | 0.90 to 1.60 m with buttress roots | 0.06 |
| Canopy hardwood | 4 | 22 to 34 m | 0.45 to 0.75 m | 0.20 |
| Understorey tree | 3 | 8 to 15 m | 0.22 to 0.28 m | 0.16 |
| Palm, açaí type | 3 | 10 to 16 m | 0.20 m | 0.12 |
| Tree fern and heliconia | 2 | 2.0 to 3.5 m | n/a | 0.18 |
| Liana and vine curtain | 1 | hanging to 4 m | n/a | 0.12 |
| Ground fern and litter | 0 | 0.6 m | n/a | 0.16 |

Buttress roots on emergents are part of the Tier 4 collider and extend 2.5 m from the trunk. Author them, do not fake with a cylinder. Canopy closes overhead at 22 m in 70% of segments and opens fully at every stream crossing, which gives the player a light cue for the upcoming gully.

**Fauna:** macaws crossing overhead in pairs, capybara at stream edges fleeing at 40 m, one authored tapir crossing per stage, insect swarms as Tier 0 particles near water. Howler monkey audio without visible models.

**Architecture:** `H_AMZ_STILT`, `S_UNI_SERVICE`. Settlements are linear roadside clusters of 5 to 12 structures. Every building is raised 1.8 m on hardwood posts, Tier 4 posts, Tier 2 body. Roofs are rusted corrugated iron with an age float above 0.6. Walls are gapped plank in `timber_weathered`, with one painted facade per cluster in faded blue or the region accent. Laundry lines, plastic water tanks, and a satellite dish per building. A logging yard with stacked hardwood logs, Tier 3, appears once per stage.

**Water:** streams every 300 to 600 m, crossed by either a timber plank bridge, deck width 4.8 m, no guardrail, a hazard by design, or a ford 0.20 to 0.35 m deep with a `cobble` bed. Standing water in ruts across 30% of the stage. One river crossing with a two-log bridge as the signature hazard.

**Props:** oil drums, chainsaw-cut stumps 0.5 m tall inside the verge, hand-painted wooden signs, mud-caked motorcycles, a broken-down truck partly reclaimed by vines.

**Hazard signature:** the ditch. Ruts that tramline the car into the drainage channel. Mud that takes 40% of the grip away with no visual warning beyond a sheen. Plank bridges with no rails. Visibility that never exceeds 90 m.

**Never:** long sight lines, open sky above the road outside stream crossings, bright saturated greens, dry dust, stone construction.

---

### 3.5 NORDIC WINTER

**Region key:** `nordic_winter`. Reference: Rally Sweden, Arctic Lapland, Värmland forest roads.

**Identity:** a white corridor between black pine walls, with snow banks that the player uses as a resource rather than avoids.

| Terrain | Value |
|---------|-------|
| Base elevation | 80 to 340 m |
| Elevation change per stage | 100 to 220 m |
| Dominant gradient | 4 to 12%, frequent crests |
| Corner grade distribution | G1 6%, G2 14%, G3 22%, G4 26%, G5 22%, G6 10% |
| Terrain character | Rolling forested ridges, frozen lake flats, cambered forestry roads |

| Road | Value |
|------|-------|
| Surface mix | `snow_packed` 55%, `ice` 20%, `snow_deep` 15%, `gravel_hardpack` 10% |
| Roadbed width | 5.0 to 7.5 m |
| Edge treatment | Snow bank 0.9 to 1.6 m tall, Tier 2 deformable across the top 0.5 m, Tier 3 below. This is the defining mechanic of the region |
| Special | Ice sections never exceed 80 m unbroken, per RALLY_RULES 2.1 |

| Light and atmosphere | Value |
|----------------------|-------|
| Sun elevation | 9° |
| Sun azimuth | 210° |
| Colour temperature | 4200 K |
| Directional intensity | 32000 lux |
| Ambient sky intensity | 0.62, snow bounce is the dominant light source |
| Shadow softness | 3.5°, shadows are long and blue-tinted #7A9AC4 |
| Fog model | FogExp2, density 0.00095, colour #DCE6EF |
| Snowfall variant | Particle density 220 per m³, fall speed 1.1 m/s, wind shear 2.4 m/s, fog density 0.00300 |
| Base EV100 | 15.8, biased to protect snow highlights |

| Palette | Hex |
|---------|-----|
| Sky zenith | #4A6E9E |
| Sky horizon | #DCE6EF |
| Ground base | #E8EDF2 |
| Foliage mid | #1F3328 |
| Structure primary | #6E2A26 |
| Accent | #F2F4F6 |

**Flora**

| Species | Tier | Height | Trunk | Weight |
|---------|------|--------|-------|--------|
| Scots pine, mature | 4 | 20 to 28 m | 0.36 to 0.52 m | 0.30 |
| Spruce, snow laden | 4 | 14 to 22 m | 0.30 to 0.44 m | 0.26 |
| Birch, bare | 3 | 8 to 14 m | 0.18 to 0.26 m | 0.20 |
| Young pine | 3 | 4 to 7 m | 0.20 m | 0.12 |
| Buried shrub mound | 1 | 0.7 m | n/a | 0.12 |

Trunks are dark and thin against snow, which makes them the clearest Tier 4 read of any region. Keep the forest edge at a consistent 8 to 14 m from the roadbed so the corridor reads as a channel.

**Fauna:** moose as the signature hazard, one authored crossing per stage, 2.2 m tall, Tier 2 per RALLY_RULES 4.2, visible for the full 2.5 s. Reindeer herds on lake flats at distance. Ravens on posts.

**Architecture:** `H_NOR_FARM`, `S_UNI_SERVICE`, `S_UNI_CHAPEL`. Isolated farmsteads of 2 to 4 buildings at clearings, never villages. Falu red board walls with white corner trim and white window frames, which is the single strongest silhouette contrast in the game. Roofs carry 0.25 to 0.40 m of snow load with a visible overhang drip edge. Woodpiles under a lean-to, snowmobile parked, plough marks in the yard.

**Water:** frozen lakes as flat high-speed sections, `ice` surface, 300 to 700 m long, edge defined by snow banks and marker poles. Never author breaking ice. A stream under a timber bridge with icicle detail.

**Props:** reflective marker poles 1.6 m with orange tops at 20 m spacing, log stacks at forestry landings, Tier 3, snow ploughed berms at junctions, a yellow road sign silhouette as the only warm colour outside the buildings.

**Hazard signature:** the bank. Leaning on it works, hitting it square does not. Ice patches on corner exits. The moose. Low sun directly in the eyes on 40% of the stage.

**Never:** bare ground, deciduous foliage in leaf, guardrails, saturated colours other than falu red and marker orange.

---

### 3.6 MEDITERRANEAN TERRACE

**Region key:** `med_terrace`. Reference: Corsica, Sardinia, Andalusian olive country, Rallye Sanremo.

**Identity:** fast, sunlit, dusty tarmac between olive terraces and dry stone. Warm, open, and deceptively narrow.

| Terrain | Value |
|---------|-------|
| Base elevation | 60 to 700 m |
| Elevation change per stage | 250 to 500 m |
| Dominant gradient | 5 to 13% |
| Corner grade distribution | G1 10%, G2 18%, G3 24%, G4 24%, G5 16%, G6 8% |
| Terrain character | Terraced hillsides, dry ravines, coastal cliff sections on 20% of stages |

| Road | Value |
|------|-------|
| Surface mix | `tarmac_patched` 50%, `tarmac_dry` 30%, `gravel_hardpack` 12%, `cobble` 8% |
| Roadbed width | 5.2 to 7.0 m |
| Edge treatment | Dry stone wall 0.6 to 1.2 m on the uphill side, low kerb and drop on the downhill. Gravel spill from the shoulders onto the racing line at corner exits |
| Special | Persistent gravel contamination on the outside of 40% of corners, modelled as a `gravel_loose` patch 1.2 m wide |

| Light and atmosphere | Value |
|----------------------|-------|
| Sun elevation | 58° |
| Sun azimuth | 250° |
| Colour temperature | 5300 K |
| Directional intensity | 108000 lux |
| Ambient sky intensity | 0.40 |
| Shadow softness | 1.4° |
| Fog model | FogExp2, density 0.00060, colour #D8D0B8 |
| Sea haze | Coastal segments only, height fog to 40 m, density 0.0016 |
| Base EV100 | 15.2 |

| Palette | Hex |
|---------|-----|
| Sky zenith | #2F7FD1 |
| Sky horizon | #DDD6BE |
| Ground base | #B9A47E |
| Foliage mid | #6E7A4E |
| Structure primary | #E0D6C0 |
| Accent | #C0532E |

**Flora**

| Species | Tier | Height | Trunk | Weight |
|---------|------|--------|-------|--------|
| Olive, ancient | 4 | 5 to 8 m | 0.60 to 0.95 m | 0.22 |
| Olive, grove row | 3 | 3 to 5 m | 0.24 m | 0.18 |
| Cork oak | 4 | 9 to 14 m | 0.48 m | 0.10 |
| Umbrella pine | 4 | 12 to 18 m | 0.55 m | 0.08 |
| Cypress, columnar | 3 | 10 to 16 m | 0.30 m | 0.06 |
| Maquis scrub, rosemary and cistus | 1 | 0.9 to 1.5 m | n/a | 0.24 |
| Dry grass and thistle | 0 | 0.5 m | n/a | 0.12 |

Olive groves are planted on a strict 7 m grid on the terraces, which reads as ordered geometry against the organic maquis. Cypresses mark driveways and cemetery boundaries and are the tallest vertical cue.

**Fauna:** wild boar as the authored crossing, visible for the full window. Kestrels hovering. Sheep flocks behind wire on the terraces. Cicada audio bed keyed to sun elevation.

**Architecture:** `H_MED_CORTIJO`, `S_UNI_CHAPEL`, `S_UNI_FUEL`. Hamlets of 5 to 10 buildings on ridge shoulders. Limewash walls with terracotta pantile roofs at 20° and a 0.45 m overhang. Iron window grilles on the ground floor, painted shutters in the accent, external stone stairs to a first-floor door, Tier 4. Every hamlet has one chapel with a bell gable as the landmark silhouette.

**Water:** dry ravine beds crossed by single-arch stone bridges, 12 to 20 m span. One live stream with a 0.15 m ford. Irrigation cisterns as visual props. Coastal stages have the sea as a non-drivable boundary with a 3 m minimum cliff edge setback.

**Props:** dry stone terracing, olive nets rolled at the field edges, blue plastic crates, a roadside shrine every 2 km, kilometre stones painted white with a red top, mesh fencing at the outside of two fast corners.

**Hazard signature:** the stone wall. Gravel dragged onto the exit of a corner by earlier passes. Cliff edges with a 0.3 m kerb and nothing beyond.

**Never:** lush grass, deciduous northern trees, wet surfaces outside the adverse variant, cool colour temperature.

---

### 3.7 OLD TOWN NIGHT

**Region key:** `old_town_night`. Reference: European super special stages, Monte Carlo town sections, Baltic old town circuits.

**Identity:** the only urban region. Wet cobbles, sodium light, hard architecture on both sides, and zero runoff. Short, high pressure, no room for error.

| Terrain | Value |
|---------|-------|
| Base elevation | 10 to 90 m |
| Elevation change per stage | 40 to 90 m |
| Dominant gradient | 3 to 9%, with two 14% cobbled ramps |
| Corner grade distribution | G1 22%, G2 28%, G3 24%, G4 16%, G5 8%, G6 2% |
| Terrain character | Flat street grid over a hill, stepped squares, arched gateways |
| Stage length | 2.5 to 5.0 km. This region is exempt from the 3.5 km minimum |

| Road | Value |
|------|-------|
| Surface mix | `cobble` 45%, `tarmac_wet` 35%, `tarmac_patched` 15%, `ice` 5% in the winter variant |
| Roadbed width | 5.5 to 8.0 m, 4.0 m through two authored arches |
| Edge treatment | Building facade or kerb plus bollard line. Concrete blocks and tyre stacks at every corner apex and exit |
| Special | Tram rails on 25% of the route, 0.06 m raised, applying a lateral impulse per RALLY_RULES 2.3 rut crossing rules |

| Light and atmosphere | Value |
|----------------------|-------|
| Sun | None. Moon at 24° elevation, 4400 K, 0.6 lux, shadow softness 0.5° |
| Street lighting | Sodium point lights, 2100 K, 12 m spacing, 4.5 m height, 8000 lumens, radius 18 m |
| Shop and window light | Warm 2700 K emissive panels, 15% of ground floor bays lit |
| Ambient | 0.08, tinted #101828 |
| Fog model | FogExp2, density 0.00160, colour #1C2436 |
| Wet surfaces | Roughness 0.32, reflection intensity 0.85, puddle mask on 20% of the roadbed |
| Base EV100 | 6.4 |
| Bloom override | Threshold 0.9, intensity 0.55 |

| Palette | Hex |
|---------|-----|
| Sky zenith | #0A0E1A |
| Sky horizon | #1C2436 |
| Ground base | #2A2A2E |
| Foliage mid | #1A241C |
| Structure primary | #3A3430 |
| Accent | #F2A93B |

**Flora:** minimal by design. Pollarded plane trees in one square, Tier 4, trunk 0.40 m, planted in a 0.4 m raised bed. Window boxes as Tier 0. A single small park with railings, Tier 4, that the road passes but never enters.

**Fauna:** none live. Spectators only, packed behind steel barriers at 3 m minimum, backlit so the crowd reads as silhouette and camera flash. Flash frequency 0.8 per second per 10 spectators, which doubles as a corner-approach cue.

**Architecture:** `H_URB_TOWNHOUSE`, `S_UNI_CHAPEL`. Continuous frontage in rows of 4 to 9 units, each 6.5 m wide with a strict vertical window rhythm, storey height 3.0 m ground and 2.7 m above. Render in muted ochre, grey, and dusty rose, all under 45% saturation. Ground floors are shopfronts with shuttered or lit glazing. Arched gateways 4.2 to 5.0 m wide with a 4.6 m clear height, appearing twice per stage as the signature squeeze. Cathedral or town hall as the single landmark, 40 m tall, visible from three points on the route.

**Water:** none drivable. Wet surface from recent rain is the default state. A fountain in the central square, Tier 4, protected by barriers.

**Props:** steel crowd barriers with sponsor mesh, tyre stacks at every apex, concrete blocks at arch corners, bollards, tram rails and overhead wires, hanging signs, market stalls packed away, cobble drainage channels, chevron boards under every streetlight.

**Hazard signature:** no runoff. A mistake ends against masonry. Wet cobble grip that drops on the painted crossings, modelled as a 0.08 μ reduction on white paint decals. Tram rails at low crossing angles. Light and shadow banding between lamps that hides surface changes.

**Never:** daylight, dirt, open ground, guardrails, gravel, any silhouette that is not architectural.

---

### 3.8 FARMLAND HEDGEROW

**Region key:** `farmland_hedgerow`. Reference: Welsh forest fringes, Ypres and Condroz farm stages, Irish tarmac lanes.

**Identity:** narrow lanes between banked hedges. Muddy, green, low sun, and the road width never gives an inch.

| Terrain | Value |
|---------|-------|
| Base elevation | 40 to 260 m |
| Elevation change per stage | 120 to 240 m |
| Dominant gradient | 4 to 12%, frequent short crests |
| Corner grade distribution | G1 14%, G2 22%, G3 26%, G4 20%, G5 12%, G6 6% |
| Terrain character | Enclosed field pattern, sunken lanes 1 to 2.5 m below field level, farm yards |

| Road | Value |
|------|-------|
| Surface mix | `tarmac_patched` 35%, `dirt_wet` 25%, `mud` 20%, `gravel_loose` 12%, `grass_wet` 8% |
| Roadbed width | 4.2 to 5.6 m. The narrowest region outside the arches of Old Town |
| Edge treatment | Earth bank 1.2 to 2.2 m topped with hedge. Bank is Tier 4, hedge above 1.2 m is Tier 2 |
| Special | Mud dragged from field entrances onto the road at 6 to 10 points per stage, each a 12 m patch of `mud` |

| Light and atmosphere | Value |
|----------------------|-------|
| Sun elevation | 18° |
| Sun azimuth | 300° |
| Colour temperature | 4800 K |
| Directional intensity | 46000 lux, broken by cloud shadow at 0.4 cycles per minute |
| Ambient sky intensity | 0.58, overcast dominant |
| Shadow softness | 4.5° |
| Fog model | FogExp2, density 0.00150, colour #C3CBD2 |
| Height fog | Field hollows, base 0 m, top 12 m, density 0.0040 |
| Base EV100 | 12.6 |

| Palette | Hex |
|---------|-----|
| Sky zenith | #6F8CA8 |
| Sky horizon | #C3CBD2 |
| Ground base | #4E4535 |
| Foliage mid | #3E5A2E |
| Structure primary | #7E7468 |
| Accent | #2F4A3C |

**Flora**

| Species | Tier | Height | Trunk | Weight |
|---------|------|--------|-------|--------|
| Oak, hedgerow standard | 4 | 14 to 20 m | 0.55 to 0.85 m | 0.14 |
| Ash | 4 | 12 to 18 m | 0.40 m | 0.12 |
| Hawthorn hedge section | 2 | 1.6 to 2.4 m above bank | n/a | 0.34 |
| Bramble and nettle mass | 1 | 0.9 m | n/a | 0.20 |
| Bracken | 0 | 0.8 m | n/a | 0.12 |
| Pasture grass | 0 | 0.2 m | n/a | 0.08 |

Hedgerow standards are spaced 20 to 45 m apart along the bank top and are the only Tier 4 flora. They must sit at least 1.0 m back from the bank crest so the trunk is not reachable, except at three authored points per stage where one leans over the lane as a marked hazard.

**Fauna:** sheep and cattle in fields behind wire and gates, Tier 2 gate collider. One authored sheep-in-the-road event on a blind crest exit, which is the region signature. Buzzards on posts. Farm dog at one yard, fleeing.

**Architecture:** `H_FRM_LONGHOUSE`, `S_UNI_CHAPEL`. Two or three farmsteads per stage, each with a house, a stone or steel barn, and a yard the road passes directly through. Rubble stone walls with lime pointing, slate roofs at 42°, small irregular windows, dark green painted doors. Steel portal barns in muted grey with corrugated cladding sit behind the stone buildings. Yards are `mud` surfaces 20 to 40 m long with a cattle grid at each end.

**Water:** streams in the valley bottoms crossed by narrow stone bridges, 4.6 m deck, parapets 0.6 m, Tier 4. Standing water in every hollow. One 0.15 m ford through a farm yard.

**Props:** five-bar gates, tractor tyre tracks, silage bale stacks in black and green wrap, Tier 3, telegraph poles following the lane, slurry tank, stone stile, marker posts with reflective tape.

**Hazard signature:** the bank. There is nowhere to put a car that goes wide. Mud patches after field entrances with no warning. Blind crests into tightening corners. Low sun straight down the lane on the return leg.

**Never:** wide roads, open sight lines beyond 140 m, dry dust, bright colours, exposed rock.

---

### 3.9 VOLCANIC HIGHLAND

**Region key:** `volcanic_highland`. Reference: Icelandic interior F-roads, Azores calderas, Etna flanks.

**Identity:** black ground, green moss, white sky. The most graphic and least cluttered region. Weather is the antagonist.

| Terrain | Value |
|---------|-------|
| Base elevation | 300 to 900 m |
| Elevation change per stage | 200 to 420 m |
| Dominant gradient | 4 to 14%, with 20% caldera rim ramps |
| Corner grade distribution | G1 8%, G2 16%, G3 22%, G4 24%, G5 20%, G6 10% |
| Terrain character | Lava fields, ash plains, glacial outwash, moss-covered flows, crater rims |

| Road | Value |
|------|-------|
| Surface mix | `gravel_loose` 35%, `dirt_dry` 20%, `gravel_deep` 20%, `water_shallow` 10%, `snow_packed` 15% at altitude |
| Roadbed width | 5.0 to 7.0 m |
| Edge treatment | Lava rock shoulders, Tier 3 loose boulders 0.3 to 0.8 m, Tier 4 outcrops beyond the verge |
| Special | Four to six river fords per stage. This is the region with the most water crossings |

| Light and atmosphere | Value |
|----------------------|-------|
| Sun elevation | 22° |
| Sun azimuth | 340° |
| Colour temperature | 6400 K |
| Directional intensity | 38000 lux, frequently fully occluded by cloud |
| Ambient sky intensity | 0.70, overcast sky is the primary light |
| Shadow softness | 6.0°, often no visible shadow at all |
| Fog model | FogExp2, density 0.00180, colour #B8BFC2 |
| Adverse variant | Wind-driven rain, visibility 55%, fog density 0.00320, particle streaks at 22 m/s horizontal |
| Base EV100 | 13.4 |

| Palette | Hex |
|---------|-----|
| Sky zenith | #5A6E7E |
| Sky horizon | #B8BFC2 |
| Ground base | #2A2724 |
| Foliage mid | #5E6B3E |
| Structure primary | #B8402E |
| Accent | #E8E4DC |

**Flora**

| Species | Tier | Height | Trunk | Weight |
|---------|------|--------|-------|--------|
| Moss carpet on lava | 0 | 0.15 m | n/a | 0.52 |
| Dwarf birch scrub | 1 | 0.6 to 1.1 m | n/a | 0.26 |
| Arctic willow mat | 0 | 0.2 m | n/a | 0.14 |
| Lupin stand, seasonal | 1 | 0.8 m | n/a | 0.06 |
| Wind-stunted birch | 3 | 3 to 5 m | 0.16 m | 0.02 |

There are effectively no Tier 4 trees. Hard obstacles are rock, which changes the collision character of the whole region. Lava boulders replace trees as the thing that ends a run.

**Fauna:** sheep loose on the road, which is the authored crossing and can happen twice per stage here given they are genuinely free-roaming. Icelandic horses in fenced paddocks near buildings. Arctic tern colonies as ambient particles.

**Architecture:** `H_VOL_CORRUGATE`, `S_UNI_CHAPEL`. Isolated single farms or huts, 1 to 3 buildings per stage. Corrugated iron over timber frame, walls in white or pale grey, roofs in the accent red or a deep green, white window frames. A turf-roofed store shed with 0.4 m of soil and grass on the roof, Tier 4. Emergency huts painted safety orange at two points, which double as distance markers.

**Water:** glacial rivers 8 to 25 m wide, braided into 2 or 3 channels at the fords. Ford depths 0.20 to 0.45 m over `cobble` beds. Depth markers on painted poles at every crossing, mandatory. Waterfalls on the valley walls as landmarks. A crater lake as a non-drivable boundary with a 4 m rock rim.

**Props:** painted depth poles, yellow route markers on 1.8 m posts every 100 m, cairns, a single steel bridge with an open grid deck, wind-shredded sign, geothermal steam vents emitting 4 m plumes near the road, non-collidable but view-obscuring.

**Hazard signature:** the fords. Entry angle and speed both matter, and there are six of them. Loose lava boulders on the shoulder that break suspension. Crosswind on exposed rim sections, modelled as a lateral force of up to 900 N with 0.3 Hz gusting. Zero visual contrast on overcast surfaces where black ground meets white sky.

**Never:** trees, warm light, dust, guardrails, dense settlements, saturated ground colour.

---

### 3.10 OUTBACK RED DIRT

**Region key:** `outback_red`. Reference: Rally Australia, Kennedy Ranges station tracks, Finke desert road.

**Identity:** the fastest region. Red laterite, hard-packed and fast, with a fine bulldust layer that hides everything about the surface underneath.

| Terrain | Value |
|---------|-------|
| Base elevation | 150 to 480 m |
| Elevation change per stage | 80 to 180 m |
| Dominant gradient | 2 to 8%, with sharp 15% creek bank drops |
| Corner grade distribution | G1 6%, G2 12%, G3 18%, G4 24%, G5 26%, G6 14% |
| Terrain character | Flat scrub plain, mesa escarpments, dry creek crossings every 500 to 900 m |

| Road | Value |
|------|-------|
| Surface mix | `dirt_dry` 40%, `gravel_hardpack` 25%, `sand` 20%, `gravel_loose` 15% |
| Roadbed width | 6.0 to 8.5 m |
| Edge treatment | Soft shoulder falling away 0.3 m into scrub, no hard edge except at creek crossings |
| Special | Bulldust holes, 8 to 15 per stage, 4 to 12 m long, `sand` under a visually identical surface. Marked only by a subtle colour shift, and pacenoted |

| Light and atmosphere | Value |
|----------------------|-------|
| Sun elevation | 66° |
| Sun azimuth | 55° |
| Colour temperature | 5500 K |
| Directional intensity | 122000 lux |
| Ambient sky intensity | 0.44, with heavy red ground bounce tinted #B85A38 |
| Shadow softness | 1.0° |
| Fog model | FogExp2, density 0.00080, colour #E8C79A |
| Dust plume | Following-car dust persists 6 s, opacity 0.85, drift 3 m/s downwind. Mandatory feature of the region |
| Base EV100 | 15.9 |

| Palette | Hex |
|---------|-----|
| Sky zenith | #3A86C9 |
| Sky horizon | #E8C79A |
| Ground base | #A8452A |
| Foliage mid | #7E8C63 |
| Structure primary | #8E8478 |
| Accent | #2E6B5A |

**Flora**

| Species | Tier | Height | Trunk | Weight |
|---------|------|--------|-------|--------|
| River red gum, creek line | 4 | 16 to 24 m | 0.70 to 1.20 m | 0.12 |
| Desert oak | 4 | 8 to 12 m | 0.40 m | 0.10 |
| Mulga | 3 | 4 to 7 m | 0.22 m | 0.18 |
| Spinifex hummock | 1 | 0.6 m | n/a | 0.40 |
| Saltbush | 1 | 0.7 m | n/a | 0.14 |
| Dry grass | 0 | 0.4 m | n/a | 0.06 |

Red gums grow only along creek lines, which makes the tree line a reliable advance warning of a creek crossing 200 m ahead. This is a deliberate readability device and must be preserved.

**Fauna:** kangaroos as the authored crossing, with the highest event rate allowed, two per stage. Emus running parallel to the road at 40 m. Wedge-tailed eagles on carrion. Cattle unfenced near the homestead, penned by a grid.

**Architecture:** `H_OUT_HOMESTEAD`, `S_UNI_FUEL`. One station homestead per stage with a wraparound veranda at 2.7 m, corrugated iron roof, weatherboard walls bleached to grey, a circular corrugated water tank 4 m diameter and 3 m tall, Tier 4, and machinery sheds. A roadhouse with fuel canopy appears on 40% of stages. Wire fences run beside the road for kilometres, Tier 2, with a gate and cattle grid every 3 km.

**Water:** dry creek beds with `sand` bottoms, banks 1.5 to 4 m, crossed at 15% gradient in and out. One authored water crossing 0.15 m deep at a permanent waterhole. Windmill and stock tank as landmarks.

**Props:** wire fence lines, cattle grids with a rumble profile, road trains parked at a siding, station signage, rusted machinery, 44 gallon drums, warning signs for grids and floodways with white and black chevrons.

**Hazard signature:** bulldust. A hole that looks like the surface takes half the speed and all the steering. Creek banks that launch the car if hit fast. Dust from a car ahead that removes all visibility for 6 seconds. Kangaroos.

**Never:** rock walls next to the road, tight corners in sequence, cool colours, fog, green ground cover.

---

### 3.11 LEGACY BIOME MAPPING

The keys used in RALLY_RULES 3.3 map to regions as follows. Update the constants file rather than maintaining both lists.

| Old key | New region |
|---------|-----------|
| `alpine_forest` | `alpine_pass` |
| `nordic_pine` | `nordic_winter` |
| `mediterranean_scrub` | `med_terrace` |
| `farmland` | `farmland_hedgerow` |
| `desert_wash` | `deep_desert` |
| `moorland` | `volcanic_highland` |

New keys with no legacy equivalent: `mountain_oasis`, `amazon_forest`, `old_town_night`, `outback_red`.

---

## 4. REGION COMPARISON

Use this to check that a new stage is not duplicating an existing one.

| Region | Avg speed | Sight line | Contrast | Runoff | Signature threat | Surface family |
|--------|-----------|-----------|----------|--------|------------------|----------------|
| Alpine Pass | 105 km/h | 90 m | High | Minimal | Exposure and drops | Tarmac |
| Mountain Oasis | 95 km/h | 120 m | Very high | Low | Retaining walls, fords | Mixed dry |
| Deep Desert | 145 km/h | 400 m | Low | Extreme | Sand, wash banks | Loose |
| Amazon | 78 km/h | 70 m | Very low | None | Ruts, ditches, mud | Wet loose |
| Nordic Winter | 118 km/h | 160 m | High | Banks only | Ice, banks, moose | Snow |
| Mediterranean | 122 km/h | 140 m | High | Low | Stone walls, gravel spill | Tarmac |
| Old Town Night | 82 km/h | 60 m | Extreme local | None | Masonry, wet cobble | Hard wet |
| Farmland Hedgerow | 96 km/h | 100 m | Low | None | Banks, mud, blind crests | Wet mixed |
| Volcanic Highland | 112 km/h | 200 m | Very low | Moderate | Fords, boulders, wind | Loose wet |
| Outback Red | 152 km/h | 350 m | Medium | High | Bulldust, creek banks, dust | Loose dry |

**Rule:** no two consecutive stages in a rally may share both a surface family and a speed band within 15 km/h.

---

## 5. AUTHORING CHECKLIST PER REGION

Add to the RALLY_RULES 15 lint. All must pass before a region ships.

| ID | Check |
|----|-------|
| R01 | Every asset albedo falls within the region palette or greyscale, tolerance 12° hue |
| R02 | Foliage saturation ≤ 55%, structure saturation ≤ 45% except the accent |
| R03 | Region uses exactly the archetypes listed, no others |
| R04 | Scatter weights sum to 1.0 per region |
| R05 | Lighting values match this document exactly, including fog density to 5 decimals |
| R06 | Every Tier 4 object is silhouette-readable at the region sight line distance |
| R07 | Settlement frontage never exceeds 120 m without a break |
| R08 | Every ford has depth markers and a straight 20 m approach |
| R09 | Authored fauna crossings match the region rate and none sit on a blind crest |
| R10 | The negative list for the region contains zero violations |
| R11 | Region colour grade tested against the two other variants without asset changes |
| R12 | Road remains the highest-contrast element at the region sight line distance |

---

## 6. AMENDMENT PROCEDURE

Same as RALLY_RULES 18. Any change to a hex value, density, or dimension is made here first and mirrored into `biomes.constants.ts` in the same commit. Assets that disagree with this document are rebuilt, not tolerated.
