# RALLY_MASTER_SPEC.md

**Status:** BINDING. This document supersedes RALLY_WORLD_BIBLE.md, RALLY_PATCH_01.md, and all separate world-rules documents. Where any other document conflicts with this one, this document wins.

**Scope:** All stages, current and future. No stage ships without passing every MUST rule below.

**Authority hierarchy:**
1. RALLY_MASTER_SPEC.md (this document)
2. RALLY_RULES.md (gameplay rules, where not overridden here)
3. RALLY_SYSTEMS.md / RALLY_ASSET_PIPELINE.md (implementation detail)
4. validation.spec.ts (MUST implement every validation clause in this document)

Keywords MUST, MUST NOT, MAY are normative per RFC 2119.

---

## 1. HUD and On-Screen Elements

**H-01 (MUST NOT):** The in-race HUD is frozen as shipped. No element may be added, removed, moved, resized, or restyled.

**H-02 (MUST NOT):** No new on-screen elements of any kind.

**H-03 (MUST):** No world overlays. Route lines, arrows, ghost markers, or any guidance rendered in the world are prohibited. Any that exist MUST be erased.

---

## 2. Road and Track Layout

**T-01 (MUST):** Track length expanded relative to original layouts. Applies to all similar tracks, not only the one under edit.

| Parameter | Value |
|---|---|
| Minimum stage length | 2.0x original layout |
| Minimum distinct curves per stage | 12 |
| Maximum uninterrupted straight | 400 m |

**T-02 (MUST NOT):** No walls, sand dunes, or any solid obstacle in the middle of a road. The full marked road width is drivable.

**T-03 (MUST NOT):** Roads must not run through the middle of walls (road slicing through a wall volume, or wall geometry straddling the roadway).

**T-04 (MUST):** Climbs are either gradual, or steep with curvy switchback roads surrounded by mountains and hills. Straight vertical-feeling ramps are prohibited.

**T-05 (MUST):** Vehicle speed is affected by steepness. Uphill grade reduces attainable speed; downhill grade increases it. The effect MUST be continuous with grade, not stepped.

---

## 3. Road Containment

**W-EDGE-01 (MUST): Mountain edge on narrow roads**

1. Any road segment classified as narrow (drivable width <= 2.5 car widths) or running through a canyon, gorge, or valley floor MUST be bounded by a mountain edge on at least one side (left or right) for its entire length.
2. A mountain edge is defined as: a rock face, cliff wall, or steep mountain slope rising visibly above road level, rendered with terrain geometry. Trees, bushes, or fences alone do NOT qualify as a mountain edge.
3. The edge MUST be continuous. Gaps are permitted only at intentional junctions, scenic overlooks, or shortcut entries, and each gap MUST NOT exceed 15 m of road length.
4. Both sides MAY be mountain edges (full canyon). Zero sides is a validation failure.
5. Applies to all stages, current and future, including Granite Narrows.

| Parameter | Value |
|---|---|
| Narrow-road threshold | drivable width <= 2.5 car widths |
| Minimum edge coverage | 100% of segment length, one side |
| Maximum gap per opening | 15 m |
| Maximum lateral distance, road boundary to edge geometry | 8 m |

---

## 4. World and Scenery

**S-01 (MUST):** The world stays fully drivable. No fenced-off track. Off-road terrain is traversable everywhere the player can reach.

**S-02 (MUST):** Surroundings are scenic and resemble real-world scenery. Every stage has an identifiable real-world biome reference.

**S-03 (MUST):** Mountain stages have big surrounding mountains, snow, and a change of scenery over the course of the stage.

**S-04 (MUST NOT):** No placeholder boxes or untextured primitives visible from any drivable position.

**S-05 (MUST NOT):** No screen twitching. Camera and terrain streaming MUST NOT produce visible jitter, popping at close range, or frame hitches during normal driving.

---

## 5. Vegetation

**V-01 (MUST):** Dense vegetation: a lot of trees throughout drivable areas, plus orchards where the biome supports them.

**V-02 (MUST):** High-poly definition of trees. Near-field trees use the high-detail model; low-poly impostors are permitted only beyond the near-field LOD distance and MUST NOT be distinguishable as flat or boxy from the road.

---

## 6. Validation

**VAL-01 (MUST):** validation.spec.ts implements a machine check for every MUST/MUST NOT clause above that is geometrically checkable, at minimum: T-01 table values, T-02, T-03, W-EDGE-01 (all four table parameters), S-04.

**VAL-02 (MUST):** The asset validator rejects any stage where a narrow segment has no qualifying mountain edge within 8 m laterally of either road boundary (W-EDGE-01 enforcement).

**VAL-03 (MUST):** A stage failing any validation clause does not enter the build. There is no override flag.

---

## 7. Change Control

**C-01:** Amendments to this document are made by replacing the whole document, not by patch files. RALLY_PATCH_* documents are retired.

**C-02:** Build order remains: asset validator, physics test harness, physics implementation, single Alpine Pass stage, Old Town Night last.

---

## Owner clarifications (recorded by directive, same authority as the clause they scope)

- **HRD-5 / W-EDGE-01 scope (2026-09-07):** "there can be field roads. That is fine. This should apply in steep mountains." — The always-a-mountain-side rule binds roads in steep mountain terrain (and W-EDGE-01's narrow/canyon/gorge/valley classes); open field roads through flat country need no mountain edge.
- **V-03, evergreens (2026-09-08):** "Rule: pine trees are never not green. They are evergreen. Apply this across the game." — Pine-silhouette conifers render green foliage on every palette and season, in every tree system (near meshes, imposters, horizon paintings). Scopes V-01/V-02: seasonal color belongs to broadleaf species and to larch, the deciduous conifer — the owner confirmed the exemption in the same exchange ("Larch is getting yellow. All good", 2026-09-08). The r398 census verified pines and firs already render green on every palette.
