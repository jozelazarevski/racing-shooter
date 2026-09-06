/* CAN YOU CUT THE CORNER?
 *
 * Asked for directly: "steep curves need to be fully walled so one can't skip
 * them." r206 built the rails; this is the line that keeps them built.
 *
 * COUNTING RAILS DOES NOT ANSWER THE QUESTION. A world can carry hundreds and
 * still leave every hairpin open — TERRAZZA ALTA carried 340, the most of any
 * world in the roster, and had 63 tight stations walled on one side and bare
 * on the other. The question is COVERAGE of the tight stations, so that is
 * what every law below measures.
 *
 * THREE LAWS:
 *
 *   1. NO CAP BITES IN SILENCE. `_buildEdgeRails` truncates its wish-list at
 *      MAXBAY. A world that asks for 374 bays and builds 340 has thirty-four
 *      corners it believes are walled and are not, and nothing in the build
 *      log says so. This is the law that found the defect: it needs no
 *      threshold, because "built what it asked for" is not a matter of taste.
 *   2. TIGHT STATIONS ARE GUARDED ON BOTH SIDES. Per-world floors, each one a
 *      measured number from the world it is written against, not a target.
 *      Both sides, because cutting happens on the inside of a bend but a car
 *      that runs wide out of one is just as gone.
 *   3. NO LONG RUN OF LAP IS FULLY OPEN AT A TIGHT CORNER. A single station
 *      reading bare is a threshold graze; seventeen in a row is a hole you can
 *      drive a car through. Runs near the start gate are exempt because every
 *      builder in the file clears 26-30 samples for the grid and gantry.
 *
 *   node tests/test-cornerwalls.mjs
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';

// Each world earns its place. The OLIVE family is what the request was about;
// SEA CLIFF RUN is the world MAXBAY was originally sized around (it wants 300)
// and is the control for law 1 — it must keep passing without the cap moving.
// Floors sit a few points UNDER the measured figure, so the law catches a
// regression without being a target to code towards. The measured value is in
// the comment; if a change moves the number up, move the floor up with it.
const WORLDS = [
  [29, 'OLIVE COAST',     92],  // measured 96 — the reference world
  [61, 'OLIVE PASS',      84],  // measured 88  (71 before the exemption fix)
  [62, 'CAPE OLIVETO',    88],  // measured 92
  [63, 'TERRAZZA ALTA',   81],  // measured 85  (82 before) — 42% of its lap is tight
  [64, 'SALINE SPRINT',   93],  // measured 97
  [60, 'SEA CLIFF RUN',   66],  // measured 71  (64 before) — cliff world
  [66, 'GLACIER COL',     86],  // measured 90  (76 before)
  [67, 'TIMBER GORGE',    90],  // measured 94  (78 before)
  [65, 'GRANITE NARROWS', 30],  // measured 35 — the low number is real, see below
  [6,  'SUMMIT CLIMB',    88],  // measured 92 — an older world, as a regression witness
];

// WHY GRANITE NARROWS' FLOOR IS 30 AND NOT A DEFECT.
//
// It measures 35% against the family's 76-78%, which looks like a hole until
// the stations are counted rather than the percentage read. It has only 69
// tight stations — a fast route has few — and 45 of them come back open in
// THREE runs: 0-9, 878-899 and 863-875. The first two are the start gate,
// which EVERY builder in the file clears (26-30 samples), and `ouninpohja`
// happens to put its tightest section across the start line. So 32 of the 45
// are the roster's own deliberate exclusion, and the denominator is small
// enough that they alone cost 46 points of coverage.
//
// The genuine item is 863-875: 13 stations, bare, adjacent to that exclusion
// zone and not covered by it. That is the same start-gate question already
// open in HANDOVER, arriving on a world whose route makes it visible.
//
// AND THE VALLEY DOES NOT COVER FOR IT. It would be easy to say the mountain
// walls this world so it needs no rails — it does not. `_valleyWall` returns
// ZERO inside the corridor blend, so for the first ~70 u either side of the
// road the ground is still at road height. Valley walls enclose a lap; they
// do not stop a corner being cut. Rails are still the only thing that does.

// The longest fully-open run any world may have at a tight corner, away from
// the start gate, in stations. Every world above measures 0-5 except one.
const MAXOPENRUN = 12;

// KNOWN AND OPEN, PINNED BY NAME AND BY NUMBER.
//
// This list held SEA CLIFF RUN at 13 stations from sample 749, with a note
// that the cause was `_buildEdgeRails` skipping anything within 40 samples of
// a gorge, overpass or bore on the grounds that those "build its own rails" —
// a promise 40 samples wide kept by something much narrower. r209 fixed that
// at the source: only a JUMP GORGE is exempt now (a rail across a launch is a
// wall in the flight path), and the hero gorge and overpass decks fall through
// to the `guarded` test, which skips a station only where masonry actually
// stands. The entry is gone because the hole is, not because the limit moved:
//
//   SEA CLIFF RUN   64% -> 71% walled both sides, rails 300 -> 328
//   GLACIER COL     76% -> 90%, its 22-station run at 753 closed
//   TIMBER GORGE    78% -> 94%, its 24-station run at 307 closed
//   OLIVE PASS      71% -> 88%     TERRAZZA ALTA  82% -> 85%
//   OLIVE COAST, SALINE SPRINT, CAPE OLIVETO, GRANITE NARROWS  unchanged
//
// Anything added here again needs the same treatment: a name, a measured
// number, and the reason — never a raised MAXOPENRUN, which would hide the
// next one for every world at once.
const KNOWN_OPEN = {};

let pass = 0, fail = 0;
const ok = (cond, msg, extra = '') => {
  if (cond) { pass++; console.log('PASS  ' + msg); }
  else { fail++; console.log('FAIL  ' + msg + (extra ? '  ' + extra : '')); }
};

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });

for (const [lv, name, floor] of WORLDS) {
  const page = await browser.newPage({ viewport: { width: 640, height: 400 } });
  page.setDefaultTimeout(600000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e.message)));
  await page.goto(`${BASE}/?level=${lv}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
  await page.waitForFunction(() => window.__game?.track?.center && window.__game.player,
    undefined, { timeout: 600000 });

  const R = await page.evaluate(() => {
    const t = window.__game.track, N = t.center.length;
    // The roster's own figure for "too bent to put anything on" — `boardMaxCurv`
    // and the ramp rules use it, and so does the builder that places the rails.
    const TIGHT = 0.02;

    // ASK THE COLLIDER LIST, NOT THE SCENE GRAPH. A rail you can see and drive
    // through is not a wall; `barriers` is the list the car cannot pass, which
    // is the only list that answers "can I skip this corner".
    const segs = t.barriers ?? [];
    const guardedAt = (px, pz) => {
      for (let b = 0; b < segs.length; b++) {
        const q = segs[b];
        const dx = q.x2 - q.x1, dz = q.z2 - q.z1;
        const L = dx * dx + dz * dz || 1;
        let u = ((px - q.x1) * dx + (pz - q.z1) * dz) / L;
        u = u < 0 ? 0 : u > 1 ? 1 : u;
        const cx = q.x1 + dx * u, cz = q.z1 + dz * u;
        // 4 u: a bay is 4.5 u long and stands 1.8 u off the edge, so anything
        // that would actually catch a car leaving here is inside this radius.
        // Wider and a wall on the far side of a field counts as a guard.
        if ((px - cx) ** 2 + (pz - cz) ** 2 < 16) return true;
      }
      return false;
    };

    let tight = 0, both = 0, one = 0;
    const openIdx = [];
    for (let i = 0; i < N; i++) {
      if (t.curvature[i] <= TIGHT) continue;
      tight++;
      const half = t.widthAt ? t.widthAt(i) : 9;
      let g = 0;
      for (const side of [1, -1]) {
        const p = t.pointAt(i, (half + 1.8) * side);
        if (guardedAt(p.x, p.z)) g++;
      }
      if (g === 2) both++;
      else if (g === 1) one++;
      else openIdx.push(i);
    }

    // longest run of consecutive fully-open stations, ignoring the start gate
    let worst = 0, worstAt = -1, run = 0, runStart = -1;
    const nearGate = (i) => Math.min(i, N - i) < 32;
    for (let k = 0; k < openIdx.length; k++) {
      const i = openIdx[k];
      if (nearGate(i)) { run = 0; continue; }
      if (k && openIdx[k - 1] === i - 1 && run) run++;
      else { run = 1; runStart = i; }
      if (run > worst) { worst = run; worstAt = runStart; }
    }

    return { name: t.level?.name, tight, both, one, open: openIdx.length,
      worstRun: worst, worstAt,
      want: t._edgeRailWant ?? 0, tightWant: t._edgeRailTightWant ?? 0,
      built: t._edgeRailCount ?? 0, dropped: t._edgeRailDropped ?? 0 };
  });

  ok(!errors.length, `${name} builds without a page error`, errors[0] ?? '');

  // LAW 1 — no cap bites in silence
  ok(R.dropped === 0,
    `${name}: builds every rail bay it asked for`,
    `wanted ${R.want} (${R.tightWant} for tight corners), built ${R.built}, DROPPED ${R.dropped}`);

  // LAW 2 — tight stations guarded on both sides
  const pct = R.tight ? Math.round((R.both / R.tight) * 100) : 100;
  ok(pct >= floor,
    `${name}: ${pct}% of ${R.tight} tight stations walled both sides (floor ${floor}%)`,
    `one side ${R.one}, open ${R.open}`);

  // LAW 3 — no long open run away from the gate. A world on the known-open
  // list is held to ITS OWN measured number, not given a free pass: one more
  // station than it has today still fails.
  const cap = KNOWN_OPEN[name] ?? MAXOPENRUN;
  ok(R.worstRun <= cap,
    `${name}: longest open run at a tight corner is ${R.worstRun} stations (max ${cap}`
      + `${KNOWN_OPEN[name] ? ', known open' : ''})`,
    R.worstAt >= 0 ? `starts at sample ${R.worstAt}` : '');

  await page.close();
}

await browser.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
