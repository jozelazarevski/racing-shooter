# IGNITE RALLY — Structure Rules

`NATURE.md` governs the natural world. This file governs everything **built** —
bridges, gantries, fences, buildings, walls, jumps. Same standard: every rule
is testable, and a rule that cannot be checked by a probe is too vague to
enforce and must be rewritten until it can.

The organising idea is **load path**. A built thing is believable when you can
see what holds it up. The moment a structure has no visible route for its
weight to reach the ground, it stops being a bridge and becomes a decal.

---

## 1. Every structure reaches the ground

1. **No structure floats.** Every built object has at least one member whose
   base is at or below terrain height. A deck, a beam or a railing with nothing
   under it is a bug, not scenery.
   *Test:* for every structure, `min(memberBaseY) ≤ terrainHeight` at that
   member's `(x, z)`, within a small tolerance.

2. **Posts stand on the ground they are over**, not on the ground the structure
   was placed from. On sloping or uneven terrain each post is individually
   long enough to reach; they are not all cut to one length.
   *Test:* every post's foot is within ~0.5 u of terrain height at its own
   `(x, z)`.

## 2. A bridge spans a gap, or it is not a bridge

3. **A bridge requires a gap to span.** A span may only be built where the
   ground genuinely falls away beneath it — a gorge, a river, a ravine. Over
   flat ground there is nothing to bridge, and a deck hanging above an
   unbroken surface reads as flying.
   *Reported:* a hanging rope bridge suspended across the road on open
   rolling ground, with continuous terrain underneath it and daylight beneath
   the deck.
   *Test:* along the span, terrain height must drop at least `deckY − 3 u`
   below the deck for the middle half of the crossing. If it does not, the
   bridge must not be built at all.

4. **A span is carried at both ends.** Both abutments land on ground that is at
   or above the deck line, so the road runs *onto* the bridge rather than
   stepping up to it in mid-air.

5. **A suspended deck hangs from something.** A rope or cable bridge needs
   towers or anchors at both ends, and the cables must terminate on them.

6. **What you can drive on is what is drawn.** The drivable surface follows the
   deck exactly: no invisible ramp before it, no lip at the join, and the
   collider matches the visible structure.

## 3. Roadside structures

7. **Nothing built stands on the carriageway.** Buildings, gantry legs, fence
   posts and bridge portals clear the drivable width — checked against the
   nearest part of the lap *anywhere*, because a course that doubles back can
   put a prop a clear 20 u from its own leg and right on the next one.
   (Enforced for huts; see RULES.md.)

8. **A gantry spans the road with headroom.** Its legs are outside the
   carriageway and its beam is above the tallest vehicle.

9. **Fences follow the ground.** A fence line steps with the terrain under it
   rather than holding one height across a dip.

---

## Known violations — open

| # | Rule | Status |
|---|---|---|
| 3 | A bridge requires a gap to span | **OPEN** — hanging bridge built over unbroken rolling ground; deck and posts float |
| 1 | No structure floats | **OPEN** — same bridge; posts do not reach terrain |
| 7 | Nothing built stands on the carriageway | **FIXED for huts** — placement re-checks against the nearest leg anywhere on the lap |

## Measuring

Same caution as `NATURE.md`: **world generation is randomised per load**, so a
structure that clears the road in one build may not in the next. Any probe must
sample repeatedly, or compare only differences much larger than the observed
spread.
