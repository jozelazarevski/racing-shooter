# ECONOMY AND PLAYFULNESS — a plan, with the numbers it rests on

_Written 2026-08-12 by the dustline session, against r158. Every figure here
was read out of the code or measured, not estimated; where something is a
judgement call it says so._

This is a PLAN, not a change. Nothing in it has been implemented. It exists so
the decisions can be argued with before anyone spends a release on them.

---

## 1. Where the economy actually stands

r148 re-priced the whole thing after measuring that the old curve demanded 267
races to finish one car. The current shape, read from `src/main.js`:

```
upgradeCost(lvl) = 600 + lvl² × 500     →  600 / 1100 / 2600 / 5100 / 8600
one line, fully upgraded                →  18,000 CR
a strong race                           →  ~1,800 CR   (3,000 on a first clear)
```

`tests/test-economy.mjs` locks the pacing as an assertion rather than a
comment — max a car in ~70 races, own the roster in ~68, be competitive in ~7.
That test is the reason this section can be short: the curve is already
defended, and **the shape does not need changing.**

### What is missing is not money, it is REASONS

The campaign is 60 worlds and one verb: finish ahead of five rivals. Credits
arrive, upgrades get bought, and the only question a player ever answers is
"which upgrade next". Three things are absent that cost little and change the
texture a lot.

---

## 2. Three proposals, cheapest first

### 2.1 Contracts should escalate, not repeat  *(smallest change, best ratio)*

`CONTRACT_POOL` has 13 entries, three offered per race, paying 50–150 CR. They
are drawn fresh every race and never remember anything. So the fiftieth race
offers the same DEMOLITION 12 props as the first, for the same 60 CR, and by
then the player smashes twelve props without noticing.

**Proposal.** Give each contract a rung the player is standing on:

| rung | target | pay |
|---|---|---|
| I | 12 props | 60 |
| II | 25 props | 140 |
| III | 40 props + on HARD | 320 |

Completing a rung advances it *for that contract only*, persisted with the
save. A contract the player keeps completing gets harder and pays
proportionally more; one they keep failing stays where it is. This is a
difficulty curve the player writes themselves by playing, and it needs no new
systems — only a number and a level on the existing record.

**Why it is worth doing first:** the offer screen is already there, the
progress display is already there (`prog:`), and the payout already itemises.
The change is a table and a save field.

**What to watch:** rung III must not become the only sensible way to earn, or
it stops being a side objective and becomes the game. Bound it — the plan is
that a full sweep of three rung-III contracts pays about one strong race, not
three.

### 2.2 The roster should have opinions

Rivals differ by `cornerSkill`, `aggression` and `baseMaxSpeed`, and r148's own
comment records the measurement that killed the old spread: two cars with
cornerSkill 0.17 and 0.45 *finished dead level*, because corner speed goes as
the square root of the lateral budget. The budget was widened, but the field is
still five variations on one driver.

**Proposal.** Give three of the five a signature the player can name after two
races — not a stat change, a BEHAVIOUR:

- **the blocker** — defends the inside line early, fades in the last third
- **the late braker** — carries too much speed in, loses time gathering it up
- **the opportunist** — hangs back, then takes the place a collision opens

All three already have most of their machinery in `vehicles.js` (`_blockT`,
`_errT`/`_errRec`, the chaser scan). This is about *when* those fire, keyed to
the driver, rather than adding anything.

**Why:** a field you can read is a field you can race. Right now the only
information in your mirror is a colour.

**What to watch:** measure it, do not eyeball it. The bar is that a blind test
can identify which rival is which from a replay of the last third of a race.
If it cannot, the signatures are too subtle to have been worth the code.

### 2.3 A reason to drive a world you have already won

Finishing a world unlocks the next and pays less on repeat, which is correct —
it pulls the campaign forward. But it leaves 59 finished worlds inert.

**Proposal — the daily line.** One world per day, seeded from the date, with a
fixed car, fixed weather and a single target time. One attempt tracked, the
result stored, no credits at all. It costs nothing to balance because it pays
nothing; its whole value is that it is the same challenge for everybody and it
changes tomorrow.

The seeded-generation work is already done (`seedForLevel`, `withSeed`), and
`?seed=` plumbing exists. This is mostly UI.

**Why not paid:** the moment it pays, it has to be balanced against the
campaign, and then it needs anti-farming rules, and then it is a second
economy. Unpaid, it is a scoreboard.

---

## 3. Playfulness: what is missing is not features

Measured against the existing systems, the game already has weapons, combos,
style scoring, contracts, livestock, hazards and a stunt vocabulary. The gap is
not content — it is **acknowledgement**. Three cheap things:

1. **Name the moment.** `CLEAN PASS +120 (×4)` already fires. A near-miss at
   speed, a save after a slide, a jump landed on the racing line — these are
   detected or nearly detected already and pass unremarked. Style events cost
   one HUD line and are the difference between a game that watches you and one
   that does not.
2. **Let the world react once.** A rival taunt already exists (`PIT-99: "eat
   dust!"`). Nothing else in the world ever responds. A marshal flag at the
   scene of a wreck, livestock scattering *before* you arrive rather than as
   you hit them — one reaction per system, no more.
3. **End on the best thing that happened**, not on a table. The results screen
   lists placings; it could lead with the single highest-scoring moment of the
   race and the number attached to it. The data is already collected for the
   contract check.

---

## 4. What I recommend, and in what order

1. **Contract rungs** (§2.1) — smallest diff, touches one table and one save
   field, and it is the only proposal that changes what a player is *doing*
   race to race rather than how it is decorated.
2. **Style acknowledgement** (§3.1) — a day's work, no balance risk.
3. **Rival signatures** (§2.2) — worth it, but only with the blind-test bar in
   §2.2 held to, or it is invisible work.
4. **Daily line** (§2.3) — last, because it is the only one that needs new UI.

**Not recommended:** re-pricing anything. The curve was measured into place at
r148 and is defended by a test; changing it now would be motion without a
reported problem behind it.

---

## 5. Open question for whoever picks this up

Contract rungs need a save-schema change, and the mainline session owns the
save format and the economy lane (see `COORDINATION.md`). This plan is written
from the dustline lane and deliberately stops at the point where it would
touch that: **§2.1 should not be implemented without the mainline session's
agreement on where the rung level lives.**
