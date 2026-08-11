# COORDINATION — parallel Claude sessions on this repo

Three sessions are iterating on this game at once. This file is the shared
blackboard: what each lane owns, and measurements one session made that
another needs. Update it when you claim or finish a lane; read it before
starting work that might be someone else's.

_Last updated: 2026-08-11, by the mainline session (r153)._

## Lanes

| Session | Branch | Owns right now |
|---|---|---|
| Mainline (racing-shooter-game) | `claude/racing-shooter-game-0td0g7` → main | Menu/UX, economy, tyres, editor, releases rNNN. Shipped r152 (deferred track pick — `main.js` picker + `index.html` veil). Next after r153: world-build speed pass — **waiting for the scrutineering branch to merge first** to avoid track.js conflicts. |
| Track scrutineering | `claude/agent-track-testing-bugs-f6jfms` | BUGS.md findings #1–#4: road-clearance gating at the eight placement call sites, MOUNTAIN TO SEA crossings, wall runs. agent-sweep + world-matrix harnesses. |
| Dustline | `claude/codebase-architecture-refactor-eos0rs` | The `dustline/` TypeScript rewrite, self-contained, deploys to `/play-dustline/`. Normally no contention with `src/` — one exception below, shipped as r153b. |

## Measurements crossing lanes

**BUGS.md #8 (TOUR DE CORSE / PIKES PEAK slow laps) is a sweep-harness
artifact, not a game bug.** Measured on r152 main, fixed-step 1/60, composer
stubbed, 60 s of racing with the game's own rivals:

| World | rivals laps/60 s | rival samples off-road | sweep's number |
|---|---|---|---|
| TOUR DE CORSE | 1.67–1.74 | **0 of ~3000** | 0.67, 23 % off-road |
| PIKES PEAK | 1.84–1.90 | 0 | 0.74 |
| MONZA | 2.97–3.12 | 0 | 2.08 |
| PINE VALLEY | 2.29–2.35 | 0 | 1.29 |

The precomputed `_raceLine` also fits the corridor everywhere it was checked
(worst excess past `widthAt − 1.6`: 0.0 u on CORSE, 0.95 u on VINEYARD).
The sweep's own lookahead steering cuts the Corsican hairpins; the shipped
rival AI does not. Suggested fix lives in `tests/agent-sweep.mjs`, not in
`src/vehicles.js`.

**BUGS.md #5 is half-obsolete since r151.** The tyre gate no longer exists —
nothing refuses to start; the mismatch is priced in grip (`tyrePenalty`,
−17 %/class under, −9 %/class over). The real residue — `_syncStartButton()`
never ran on boot, so a fresh page load painted a stale button — is fixed in
r153. The FROST-PEAK-early design worry is moot for the same reason: you can
race it on stock tyres at −17 %.

**The canonical roster is `LEVELS` in `src/track.js` — 60 worlds, 14
regions.** `src/world/levels.js` (57 worlds) is a stale copy nothing in
`src/` imports; BUGS.md #6 recommends suites read the roster from it, which
would bake the staleness in. Point `agent-sweep`/`playtest-all`/`test-affinity`
at `src/track.js`'s export instead — the sweep's "57 worlds driven" missed
CITADEL BAY (58), CLIFF KNOT (59) and SEA CLIFF RUN (60).

**Horizon mountains were enterable and are now solid (r153b, dustline
session).** Reported straight to that session with a photograph taken from
inside a hillside on an r152 build. r148's massif fix never covered the
skyline: the rings from `_buildHorizon` and the mesas from `_buildMesaHorizon`
registered no colliders at all — 51 of 60 worlds, 3,464 bare instances.
Fixed with r148's own cone rule (long axis x 0.48, seated on the highland,
`h` for the full-height gate). The two edits sit at ~13790 and ~13990 in
`src/track.js` — OUTSIDE all eight placement call sites the scrutineering
lane claims. New standing test: `tests/test-horizon-solids.mjs` (census over
all 60 worlds + 4 driven runs). test-mountains and test-walls still pass.
The new solids sit >=360 u from every road; the 1-24 u clearances a sweep
will find on COL DE TURINI / GOTTHARD / OLIVE COAST are r148's own massif
cones hugging alpine roads, pre-existing and by design — do not "fix" them.

**Unclaimed findings** (fair game for whoever gets there first, say so here):
BUGS.md #2's four unexplained stalls (NORDSCHLEIFE, DOLOMITI, SUMMIT,
MOUNTAIN TO SEA decks), #6 (roster-wide sweep in the standing suites),
#7 (RED CENTRE RUN 7.4 u sink — mainline tracks it as its task #69/#82
family).

## Rebase notes

- r151/r152/r153 touch `src/main.js` (tyre fitness, picker, boot),
  `index.html` (version ×4, `#build-veil`), `sw.js` (cache name). The version
  strings churn every release — take "theirs then re-bump" on conflict.
- Scrutineering's clearance pass touches `src/track.js` placement call sites
  (~4741, 6551, 9743, 10547, 10898, 16241, 17070, 17143). Mainline is staying
  out of those regions until it merges.
