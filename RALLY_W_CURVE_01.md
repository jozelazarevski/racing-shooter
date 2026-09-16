# W-CURVE-01: Sharp Curves and Hairpins

**Status:** BINDING. This rule is part of RALLY_MASTER_SPEC.md Section 3 (Road Containment). This standalone copy exists for implementation handoff. If this file and RALLY_MASTER_SPEC.md ever differ, RALLY_MASTER_SPEC.md wins.

**Scope:** All stages, current and future, including Glacier Col.

Keywords MUST, MUST NOT, MAY are normative per RFC 2119.

---

## Rule

1. A sharp curve is any road segment with centerline radius <= 30 m or direction change >= 90 degrees within 60 m of road length. Hairpins (direction change >= 150 degrees) are the strictest case.

2. Road width through a sharp curve MUST stay constant within +/- 30% of the approach width. The curve MUST NOT open into an amorphous paved apron or plaza; inner and outer road edges are defined for the full arc.

3. Both edges of a sharp curve MUST be visually bounded for the full arc: grass verge, rock, barrier, or terrain break. The road surface MUST NOT bleed edge-less into surrounding terrain.

4. Where the outer edge of a sharp curve faces a drop, downslope, or water, a guard barrier (fence, stone wall, or rock line) MUST run continuously along the outer arc. Barrier segments MUST be connected and grounded: no floating, scattered, or fragmented fence pieces, and no gaps > 8 m except one intentional shortcut opening per curve.

5. The inner apex MUST be solid, textured terrain or road. No holes, black voids, or missing geometry at the apex.

6. Road surface texture through the curve MUST follow the curve (UVs mapped along the arc). Radial smearing, stretching, or pinwheel artifacts at curve centers are a validation failure.

7. Sharp curves on gradient MUST be banked toward the inside between 2 and 8 degrees.

8. W-EDGE-01 applies through sharp curves without interruption: on narrow roads, the mountain edge continues around the arc on at least one side.

## Parameters

| Parameter | Value |
|---|---|
| Sharp-curve threshold | radius <= 30 m, or >= 90 degrees per 60 m |
| Hairpin threshold | >= 150 degrees direction change |
| Width tolerance through curve | +/- 30% of approach width |
| Outer barrier max gap (drop-side) | 8 m, max one opening per curve |
| Banking range on gradient | 2 to 8 degrees inward |
| Minimum hairpin centerline radius | 9 m |

## Validation

- validation.spec.ts MUST machine-check: width tolerance, barrier continuity and grounding, apex geometry present, banking range.
- A stage failing any check does not enter the build. No override flag.
