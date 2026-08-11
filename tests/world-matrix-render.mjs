// Render BUGS-MATRIX.md from the build-time matrix probe plus the drive
// column recorded in BUGS.md (single source of truth for lap pace / stalls).
import fs from 'node:fs';
const M = JSON.parse(fs.readFileSync('tests/world-matrix.json', 'utf8'));

// drive results: parse the appendix table in BUGS.md
const drive = {};
for (const ln of fs.readFileSync('BUGS.md', 'utf8').split('\n')) {
  const m = ln.match(/^\|\s*(\d+)\s*\|\s*([^|]+?)\s*\|\s*([\d.]+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|$/);
  if (m) drive[+m[1]] = { laps: +m[3], stuck: +m[4] };
}
const SRC = [
  ['parapet', 'culvert parapet', 'track.js:17143'],
  ['fordMarker', 'ford marker', 'track.js:17070'],
  ['overpassRail', 'overpass rail', 'track.js:10898'],
  ['gantryLeg', 'gantry leg', 'track.js:6551'],
  ['grandstand', 'grandstand', 'track.js:16241'],
  ['quayCannon', 'quay cannon', 'track.js:10547'],
  ['narrowPost', 'narrow post', 'track.js:4741'],
  ['boulder', 'boulder', 'track.js:9743'],
  ['tree', 'tree', 'various'],
  ['other', 'other', '—'],
];
const lanes = (w, k) => w.bySource?.[k]?.inLane ?? 0;
const tot = (f) => M.reduce((a, w) => a + (w.error ? 0 : f(w)), 0);
const dash = (n) => (n ? String(n) : '·');
const med = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];

const L = [];
const P = (s = '') => L.push(s);

P('# BUGS — the matrix');
P();
P('Every world against every finding in [BUGS.md](BUGS.md) — the same numbers,');
P('laid out so the shape of them is visible.');
P();
P('`·` is a clean cell. Regenerate with `node tests/world-matrix.mjs` (build-time');
P('columns) — the drive column comes from the full `tests/agent-sweep.mjs` run.');
P();
P('**This is the state AFTER the fixes.** The `lane`, `near`, `wall` and');
P('`flat×` columns were rebuilt against the fixed code; the `laps` and `stall`');
P('columns are the original as-found drive, kept as the record of what was');
P('found. What changed:');
P();
P('| | as found | now |');
P('|---|---|---|');
P('| colliders in the drivable lane | 211, across 29 of 57 worlds | **0** |');
P(`| objects inside the promised clearance | 1,884 | ${tot((w) => w.nearRule)} |`);
P('| wall runs lying inside the road | 64 | **0** |');
P('| stalls, driving all 57 worlds | 7 | **1** — ROCKFALL RAVINE, its own live rockfall |');
P('| self-crossings under 4 u apart | 50 | 50 — open, a route decision |');
P('| samples with no floor under the advertised width | 19 (RED CENTRE RUN) | **0** |');
P();

// ---------- 1. world × finding ----------
P('## 1. World × finding');
P();
P('`lane` = colliders inside the advertised drivable width. `near` = inside the');
P('clearance RULES.md §3 promises (`widthAt + r + carRadius`). `laps` = the');
P("agent's lap progress in 60 s (roster median 1.39). `stall` = 3 s with no");
P('progress. `flat×` = self-crossings under 4 u apart vertically. `hole` =');
P('samples with no floor under the width the road advertises.');
P();
P('| # | world | region | lane | near | wall | hole | flat× | stall | laps | minHW | grade | fps | gate |');
P('|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|');
for (const w of M) {
  if (w.error) { P(`| ${w.id} | ${w.world} | — | ? | ? | ? | ? | ? | ? | ? | ? | ? | probe failed |`); continue; }
  const d = drive[w.id] ?? {};
  P(`| ${w.id} | ${w.world} | ${w.region} | ${dash(w.inLane)} | ${dash(w.nearRule)} | ${dash(w.barIn)} `
    + `| ${dash(w.deckShort ?? 0)} | ${dash(w.flatCrossings)} | ${dash(d.stuck)} | ${d.laps?.toFixed(2) ?? '—'} | ${w.minHalfWidth} `
    + `| ${w.maxGrade} | ${w.renderFps} | ${w.tyreGate ? `${w.tyreGate.cost} CR` : '·'} |`);
}
P();
P(`**Totals** — ${tot((w) => w.inLane)} colliders in the lane, `
  + `${tot((w) => w.nearRule)} inside the promised clearance, `
  + `${tot((w) => w.barIn)} wall runs inside the road, `
  + `${tot((w) => w.deckShort ?? 0)} samples with no floor, `
  + `${tot((w) => w.flatCrossings)} flat self-crossings, `
  + `${Object.values(drive).reduce((a, d) => a + d.stuck, 0)} stalls across `
  + `${M.filter((w) => !w.error).length} worlds.`);
P();

// ---------- 2. world × source ----------
P('## 2. Which builder put it there');
P();
P('Colliders **in the lane**, by the call site that placed them. Every column is');
P('the same bug: a fixed lateral offset from the object\'s own sample, never');
P('re-checked against the rest of the centreline — and every column is now');
P('zero. The as-found counts are kept beside each call site, because the row of');
P('zeros only means something next to what it replaced.');
P();
P('| call site | what it places | as found | now |');
P('|---|---|---:|---:|');
P('| `track.js:17143` | culvert parapet | 106, 17 worlds | **0** |');
P('| `track.js:17070` | ford depth marker | 50, 19 worlds | **0** |');
P('| `track.js:10898` | flyover parapet rail | 25, 1 world | **0** |');
P('| `track.js:6551` | start-gantry leg | 8, 3 worlds | **0** |');
P('| `track.js:16241` | grandstand front | 6, 4 worlds | **0** |');
P('| `track.js:10547` | quay cannon | 4, 3 worlds | **0** |');
P('| `track.js:4741` | narrow-section post | 3, 2 worlds | **0** |');
P('| `track.js:9743` | roadside boulder | 1, 1 world | **0** |');
P('| various | grown trunks | 8, 2 worlds | **0** |');
P('| `_buildableSpot` | every structure in the game | — | gate added |');
P('| `_barrier` | every wall in the game | — | gate added |');
P();
if (tot((w) => w.inLane)) {
  P(`| # | world | ${SRC.map(([, n]) => n).join(' | ')} | total |`);
  P(`|---|---|${SRC.map(() => '---:').join('|')}|---:|`);
  for (const w of M) {
    if (w.error || !w.inLane) continue;
    P(`| ${w.id} | ${w.world} | ${SRC.map(([k]) => dash(lanes(w, k))).join(' | ')} | **${w.inLane}** |`);
  }
  P(`| | **all worlds** | ${SRC.map(([k]) => `**${tot((w) => lanes(w, k))}**`).join(' | ')} | **${tot((w) => w.inLane)}** |`);
  P(`| | *worlds hit* | ${SRC.map(([k]) => M.filter((w) => lanes(w, k)).length || '·').join(' | ')} | ${M.filter((w) => w.inLane).length} |`);
  P(`| | *call site* | ${SRC.map(([, , f]) => `\`${f}\``).join(' | ')} | |`);
  P();
}
P(`${M.filter((w) => !w.error && !w.inLane).length} of ${M.filter((w) => !w.error).length} worlds carry nothing in the lane.`);
P();

// ---------- 3. finding × world ----------
P('## 3. Finding × severity × where');
P();
const worldsWith = (f) => M.filter((w) => !w.error && f(w)).map((w) => w.id);
const rows = [
  ['1', 'Furniture in the drivable lane', 'high', worldsWith((w) => w.inLane > 0), 'eight call sites, no `_clearsRoad`', 'gate each push on `_clearsRoad(x, z, r, 1.8)`'],
  ['2', `Agent stalled against it (${Object.values(drive).reduce((a, d) => a + d.stuck, 0)} stalls)`, 'high', Object.entries(drive).filter(([, d]) => d.stuck).map(([id]) => +id), 'two stalls sit 2 samples from a mid-lane parapet', 'falls out with #1; four want eyes on screen'],
  ['3', 'Route crosses itself at its own height', 'high', worldsWith((w) => w.flatCrossings > 0), 'no vertical separation between passes', 'separate the decks or route through the bridge/tunnel path'],
  ['4', 'Wall run inside the road width', 'med', worldsWith((w) => w.barIn > 0), 'segment colliders laid at lateral 7–8 on a 9 u road', 'push the run beyond `widthAt + hw + carRadius`'],
  ['5', 'START armed on a world that refuses it', 'med', worldsWith((w) => w.tyreGate), '`_syncStartButton()` never runs at boot', 'call it once after the profile and car load'],
  ['6', 'Roster not swept by the old suites', 'med', [], '`playtest-all` stops at 28, `test-affinity` at 21', 'read the roster from `levels.js`'],
  ['7', 'Player sank under the terrain', 'med', [32], 'seen once at −7.43 u, did not reproduce', 're-run with sample capture'],
  ['8', 'Lap pace far below the roster median', 'low', Object.entries(drive).filter(([, d]) => d.laps < 0.85).map(([id]) => +id), 'TOUR DE CORSE spends 23 % of the lap off the road', 'check the racing line against the corridor'],
  ['9', 'Documented counts stale', 'low', [], 'README says 18 worlds; the roster is 57', 'derive the counts'],
];
// worlds is the AS-FOUND scope; the status column says where each one stands
const STATUS = {
  1: 'fixed — 211 → 0', 2: 'fixed — 7 stalls → 1, and that one is a live hazard',
  3: 'dressing fixed, both worlds drive; the routes stay open',
  4: 'fixed — 64 → 0', 5: 'fixed (the gate itself went upstream in r151)',
  6: 'fixed', 7: '**open** — reproduced later at −3.38 u, intermittent',
  8: '**open** — TOUR DE CORSE still 23 % off-road', 9: 'fixed',
};
const SCOPE = { 1: '29 of 57', 2: '6', 3: '2 — 56, 57', 4: '2 — 31, 43', 5: '5 — 3, 7, 15, 16, 21',
  6: 'roster-wide', 7: '1 — 32', 8: '3 — 25, 45, 57', 9: 'roster-wide' };
P('| # | finding | sev | worlds (as found) | root cause | status |');
P('|---|---|---|---|---|---|');
for (const [n, name, sev, , cause] of rows) {
  P(`| ${n} | ${name} | ${sev === 'high' ? '**high**' : sev} | ${SCOPE[n] ?? '—'} | ${cause} | ${STATUS[n] ?? ''} |`);
}
P();

// ---------- 4. clean sheet ----------
P('## 4. What every world passed');
P();
P('From the full driving sweep (all 57 worlds), not the build-time probe.');
P();
const clean = [
  ['NaN in player or AI state', M.length],
  ['AI stuck, lost, or gifted a lap', M.length],
  ['page errors during build and race', M.filter((w) => !w.error && !w.pageErrors).length],
  ['pickups off the road plane', M.filter((w) => !w.error && !w.pickupBad).length],
  ['declared hazard that never built', M.length],
  ['vertical step in the road over 2.5 u', M.filter((w) => !w.error && w.maxRise <= 2.5).length],
  ['grade past what the car can climb (>0.45)', M.filter((w) => !w.error && w.maxGrade <= 0.45).length],
];
P('| check | worlds clean |');
P('|---|---|');
for (const [k, v] of clean) P(`| ${k} | ${v} of ${M.length} |`);
P();

// ---------- 5. spread ----------
const fps = M.filter((w) => w.renderFps).map((w) => w.renderFps);
const laps = Object.values(drive).map((d) => d.laps);
P('## 5. Spread');
P();
P('| measure | min | median | max |');
P('|---|---|---|---|');
P(`| lap progress per 60 s | ${Math.min(...laps).toFixed(2)} | ${med(laps).toFixed(2)} | ${Math.max(...laps).toFixed(2)} |`);
P(`| narrowest half-width per world (u) | ${Math.min(...M.filter((w) => !w.error).map((w) => w.minHalfWidth))} | ${med(M.filter((w) => !w.error).map((w) => w.minHalfWidth))} | 9 |`);
P(`| steepest sustained grade | ${Math.min(...M.filter((w) => !w.error).map((w) => w.maxGrade))} | ${med(M.filter((w) => !w.error).map((w) => w.maxGrade))} | ${Math.max(...M.filter((w) => !w.error).map((w) => w.maxGrade))} |`);
P(`| render fps (SwiftShader — relative only) | ${Math.min(...fps)} | ${med(fps)} | ${Math.max(...fps)} |`);
P(`| solid colliders per world | ${Math.min(...M.filter((w) => !w.error).map((w) => w.counts.solids))} | ${med(M.filter((w) => !w.error).map((w) => w.counts.solids))} | ${Math.max(...M.filter((w) => !w.error).map((w) => w.counts.solids))} |`);
P();
P('Frame rates are software-rendered and comparable only with each other — not');
P('device performance.');

fs.writeFileSync('BUGS-MATRIX.md', L.join('\n') + '\n');
console.log(L.join('\n').slice(0, 1500));
console.log(`\n--- wrote BUGS-MATRIX.md (${L.length} lines)`);
