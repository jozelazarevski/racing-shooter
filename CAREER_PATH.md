# CAREER_PATH.md — the progression path, planned

Version 1.0 (r345 planning). Owner request: "I still miss a career
progression path — Plan this out."

AUTHORITY: sits under CLAUDE.md v2.3 in the chain. The in-race HUD stays
frozen (v2.3 standing decision 3) — everything here lives in menus, the
home screen, cards and telemetry. World count, chapters, star ratings
unchanged (§9.5). This is NEW DESIGN by owner request, not repair.

---

## 1. What already exists (the plan builds ON these, not beside them)

| System | State |
|---|---|
| CHAPTERS (13, named, contiguous) | shipped — gate = 60% of previous chapter's stars, floor rule keeps weak drivers moving |
| Stars per world (3/2/1 = win/podium/finish) | shipped (`starsFor`/`starsIn`) |
| Championship seasons per chapter | shipped (C1–C5: `career.seasons`, sponsors, calendar, history) |
| Feats (2 per world, kit-gated) + kit lean (+32% grid, penalties) | shipped |
| Quests (pay upgrade PARTS) and daily contracts (pay credits) | shipped |
| Car catalog (priced) + per-car 7-part garage | shipped |
| Roster pace ramp (+10% by world 78, r342) | shipped |

## 2. Why it still doesn't feel like a path (the gap, named)

1. **No destination moments.** A chapter opens when a star fraction
   ticks over — you SLIDE into the next chapter mid-menu. Nothing ends;
   nothing is won. The seasons compute a champion nobody has to beat.
2. **The machine ladder is silent.** Cars are priced and worlds take
   kit, but nothing ever says "this part of the career is where you buy
   a better machine". The r342 ramp rises smoothly; the garage never
   gets its moment either.
3. **No forward signpost.** The player is never told the ONE next thing:
   how many stars to the gate, what the finale needs, what to buy for
   the chapter after.
4. **The rivals are strangers.** Seven named personas race every event,
   but no chapter belongs to any of them — there is nobody to beat.

## 3. The plan — five builds, one system each (CP1–CP5)

### CP1 — THE SIGNPOST (path made visible)
A single `careerObjective()` computed from save state, one sentence,
shown on the home screen and the chapter card. Priority order:
1. finale unlocked and unwon → "WIN THE <CHAPTER> FINALE"
2. gate short → "<n> STARS TO THE <NEXT CHAPTER> FINALE"
3. season title contested → "TAKE THE TITLE FROM <nemesis>"
4. kit below next chapter's tier → "THE <TIER> GARAGE AWAITS — <car>"
5. all done → "CHAPTER COMPLETE — <next chapter name>"
One function, one place; every screen that mentions progress reads it
(the card, the home prompt, the results screen's "next" line). Menu UI
only; appearance follows the r321 showroom's design language.

### CP2 — THE FINALE (chapters end with an event)
The LAST world of each chapter (career order) is its FINALE.
- Entry: the chapter's gate stars (the existing 60% fraction, floor rule
  intact) — the gate becomes a door you walk through, not a threshold
  that ticks.
- The finale is featured: the chapter's nemesis on pole rhetoric
  (pre-race card), double credits, and a chapter TROPHY on win —
  `career.trophies[chapter] = { at, car, place }`, shown in the season
  history and the showroom shelf.
- Chapter N+1 opens on FINALE PODIUM **or** the old star fraction of
  chapter N (whichever first) — nobody is walled who wasn't before; the
  finale is the intended path, the fraction is the safety valve.
- Migration: existing saves grant trophies retroactively from season
  standings (champion of chapter = trophy), so nobody restarts.

### CP3 — THE MACHINE LADDER (garage tied to chapters)
Four tiers across 13 chapters:
| Tier | Chapters | Catalog band |
|---|---|---|
| ROOKIE | 1–3 | starter cars |
| CLUB | 4–7 | mid catalog |
| PRO | 8–11 | upper catalog |
| WORKS | 12–13 | flagships |
- The catalog groups by tier in the showroom; each chapter card carries
  its tier chip.
- The r342 pace ramp RE-ANCHORS to chapter tier for career races
  (rosterProg stays for free play): the grid steps up at tier
  boundaries instead of creeping — the step IS the "buy a car" moment.
  EASY keeps its half ramp.
- Economy budget, MEASURED not felt: chapter income (race pay + feats +
  finale double) must let a podium-most player afford the next tier's
  entry car + 2 kit levels by each tier boundary. Tuned via the CP5 sim
  against a `prize table` in driving.json (career block) — no literals
  in .ts, per the standing rule.

### CP4 — THE NEMESIS THREAD (someone to beat)
- Each chapter names ONE roster persona its nemesis (deterministic:
  chapter n → persona, spread so all seven feature; the hardest
  chapters get the racers).
- In that chapter's races the nemesis takes the pressure-rival lease by
  default (§5.2 machinery unchanged — same clamp, never force) and the
  finale card introduces them by name and record.
- Beating them for the season title writes a history beat
  ("CHAPTER 3 — TOOK THE TITLE FROM K. MARIC"), joining the C5 history.
- Behaviour budget unchanged: §5.6 laws bind exactly as today.

### CP5 — THE CAREER SIM (acceptance, before any deploy)
A scripted median-skill career bot (the airace stand-in at skill ~0.85)
plays the path front to back in accelerated sim. Gates:
- **CS1 no dead ends**: finishing-only stars still open every chapter
  (the existing floor, restated and tested).
- **CS2 solvency**: at every tier boundary the sim's bank covers the
  tier's entry car + 2 kit levels. Prize table adjusts, not the test.
- **CS3 the wall is where we put it**: a stock ROOKIE car cannot podium
  a CLUB finale or beyond (kit lean + tier ramp express); with the
  tier's car and kit it can.
- **CS4 the signpost never lies**: at every sim state,
  `careerObjective()` names an action that is actually available.
- **CS5 regression**: airace, difficulty (as-is), progression, drift,
  patch02 stay green; HUD snapshot untouched.

## 4. Data model (all additive; saves migrate, never reset)
- `career.trophies[chapterKey] = { at, car, place }`
- `driving.json` gains a `career` block: `prizeBase`, `finaleMul: 2`,
  `tierOf(chapter)` table, `tierRampPct` (replaces rosterProg for
  career races), `feats/contracts` pay stays where it is.
- No schema change to seasons/quests/feats.

## 5. Decisions taken (defaults — say the word to change any)
- Free play / roam untouched; career is the lens, not a cage.
- Difficulty tiers unchanged; rewards do not scale by tier (out of
  scope, noted for a later pass).
- Finales reuse the existing last world per chapter — no new worlds
  (§9.5), no route edits; "featured" is presentation + grid + pay.
- In-race HUD pixel-identical throughout (S9 binds every CP build).

## 6. Build order and effort
CP1 (small) → CP2 (medium) → CP3 (medium, includes economy sim tuning)
→ CP4 (small) → CP5 (the gate, runs throughout). Each CP is one
deploy, gated green like B1–B7 were.
