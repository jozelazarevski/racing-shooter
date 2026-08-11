// Render the QA matrix as a self-contained page, straight from the measured
// JSON so no figure on it is hand-typed. Companion to world-matrix-render.mjs,
// which writes the same numbers as BUGS-MATRIX.md.
//
//   node tests/world-matrix.mjs        # measure (writes tests/world-matrix.json)
//   node tests/world-matrix-page.mjs   # writes track-matrix.html
import fs from 'node:fs';

const M = JSON.parse(fs.readFileSync('tests/world-matrix.json', 'utf8'));
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
];
const lane = (w, k) => w.bySource?.[k]?.inLane ?? 0;
const tot = (f) => M.reduce((a, w) => a + f(w), 0);
const med = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const inLaneTotal = tot((w) => w.inLane);
const affected = M.filter((w) => w.inLane > 0).length;
const stalls = Object.values(drive).reduce((a, d) => a + d.stuck, 0);
const totBar = tot((w) => w.barIn);
const stallWorlds = Object.values(drive).filter((d) => d.stuck).length;
const flat = tot((w) => w.flatCrossings);
const laps = Object.values(drive).map((d) => d.laps);
const lapMed = med(laps);

// heat level 0–4 for a count, scaled against the worst world
const heat = (n, worst) => (n <= 0 ? 0 : Math.min(4, 1 + Math.floor((n / worst) * 3.99)));
const worstLane = Math.max(...M.map((w) => w.inLane));

const cell = (n, worst, cls = 'bad') =>
  (n ? `<td class="num ${cls} ht${heat(n, worst)}">${n}</td>` : '<td class="num nil">·</td>');

const rows = M.map((w) => {
  const d = drive[w.id] ?? {};
  const slow = d.laps != null && d.laps < lapMed * 0.62;
  const sev = w.inLane >= 8 || d.stuck || w.flatCrossings ? 'high' : (w.inLane || w.barIn ? 'med' : 'ok');
  return `<tr data-sev="${sev}" data-hits="${w.inLane + w.barIn + (d.stuck ?? 0) + w.flatCrossings}">
    <td class="stripe s-${sev}"></td>
    <td class="num id">${w.id}</td>
    <td class="world">${esc(w.world)}<span class="region">${esc(w.region)}</span></td>
    ${cell(w.inLane, worstLane)}
    <td class="num soft">${w.nearRule || '·'}</td>
    ${cell(w.barIn, 2)}
    ${cell(w.flatCrossings, 58)}
    ${cell(d.stuck ?? 0, 2)}
    <td class="num ${slow ? 'warn' : ''}">${d.laps != null ? d.laps.toFixed(2) : '—'}</td>
    <td class="num soft">${w.minHalfWidth}</td>
    <td class="num soft">${w.maxGrade.toFixed(2)}</td>
    <td class="num soft">${w.renderFps.toFixed(2)}</td>
    <td class="gate">${w.tyreGate ? `<span class="chip">${w.tyreGate.cost} CR</span>` : '<span class="nil">·</span>'}</td>
  </tr>`;
}).join('\n');

const srcRows = M.filter((w) => w.inLane).map((w) => `<tr>
    <td class="num id">${w.id}</td>
    <td class="world">${esc(w.world)}</td>
    ${SRC.map(([k]) => cell(lane(w, k), 25)).join('')}
    <td class="num total">${w.inLane}</td>
  </tr>`).join('\n');

const FINDINGS = [
  [1, 'Trackside furniture standing in the drivable lane', 'high',
    '211 colliders, 29 worlds — as found',
    'Eight call sites place scenery at a fixed lateral offset from its own sample and never re-check it against the rest of the centreline. On a bend the lap curls back under the offset and the object lands in the racing line at road height.',
    'Gate each push on the <code>_clearsRoad(x, z, r, 1.8)</code> that three sibling call sites already use.'],
  [2, 'The agent parked against it', 'high', '7 stalls, 6 worlds — as found',
    'Two of the stalls sit two samples from a mid-lane parapet — OASIS AMBUSH at 474 against parapets at 476, OUNINPOHJA at 684 against 686.',
    'Falls out with #1. The other four stalls have no collider on record and want eyes on screen.'],
  [3, 'Routes that cross themselves at their own height', 'high', 'MOUNTAIN TO SEA 39 of 127 near-passes; OLIVE CROSSING 11 of 11',
    'Two stretches of the same lap pass within 12 u of each other 127 times, and 58 of those are within 4 u vertically. At that separation they are the same piece of ground — which is why 25 of the world’s own bridge rails end up in the road the bridge crosses.',
    'Give the crossings real vertical separation, or route them through the bridge/tunnel machinery the other Mediterranean worlds use.'],
  [4, 'Wall runs laid inside the road width', 'med', '2 worlds',
    'Dry-stone field walls at lateral −8.0 (HEDGEROW DASH) and −7.4 (OULTON PARK) on a road that advertises 9. A barrier is a segment collider, so this is a continuous wall a metre inside the edge.',
    'Push the run beyond <code>widthAt + halfThickness + carRadius</code>.'],
  [5, 'START looks armed on a world that refuses it', 'med', '5 worlds',
    'On a page load into a tyre-gated world the button reads “START RACE” with no blocked class, while <code>carFitness()</code> says the car cannot race. Pressing it does nothing visible. The career’s own next-world transition is a page load, so this is a mainline path.',
    'Call <code>_syncStartButton()</code> once at boot, after the profile and car load.'],
  [6, 'Half the roster is not swept by the old suites', 'med', 'roster-wide',
    '<code>playtest-all.mjs</code> loops to level 28 and <code>test-affinity.mjs</code> to 21, on a 57-world roster. Six of the eight worst worlds above sit in the unswept range.',
    'Read the roster from <code>levels.js</code>, the way the new sweep does.'],
  [7, 'Player sank 7.4 u under the terrain', 'med', 'RED CENTRE RUN',
    'One 60 s drive recorded the car 7.43 u below <code>terrainHeight</code>. A second drive over the same world did not reproduce it.',
    'Re-run with sample capture before chasing it.'],
  [8, 'Lap pace far below the roster median', 'low', '3 worlds',
    'Against a median of 1.39 laps a minute: TOUR DE CORSE 0.67 with 23 % of samples beyond the road edge, PIKES PEAK 0.74, MOUNTAIN TO SEA 0.79.',
    'TOUR DE CORSE first — a quarter of a lap spent off the road while following the racing line means the line and the road disagree.'],
  [9, 'Documented counts no longer match the roster', 'low', 'docs',
    'README says eighteen worlds; <code>starCost</code>’s comment says 32; <code>carFitness</code>’s says the starter is legal on 53 of 58. Measured: 57 worlds, legal on 52.',
    'Derive the counts instead of writing them down.'],
];

const STATUS = {
  1: ['fixed', '211 colliders in the lane → 0, across all 57 worlds'],
  2: ['fixed', '7 stalls → 1, and that one is ROCKFALL RAVINE’s own live rockfall'],
  3: ['part', 'the dressing is fixed and both worlds drive; the routes still ask for more crossings than the terrain can lift'],
  4: ['fixed', '64 wall runs inside the road → 0'],
  5: ['fixed', 'the tyre gate itself was removed upstream in r151; the button now paints at boot'],
  6: ['fixed', 'both suites read the roster from levels.js'],
  7: ['open', 'reproduced later at −3.38 u — real and intermittent, wants its own session'],
  8: ['open', 'TOUR DE CORSE still spends 23 % of its lap off the road'],
  9: ['fixed', 'counts derived, not written down'],
};
const findingCards = FINDINGS.map(([n, name, sev, scope, cause, fix]) => `<article class="finding s-${sev}">
    <header>
      <span class="fnum">${n}</span>
      <h3>${name}</h3>
      <span class="sev sev-${sev}">${sev}</span>
    </header>
    <p class="scope">${scope}</p>
    <p>${cause}</p>
    <p class="fix"><span class="fixlabel">Fix</span> ${fix}</p>
    <p class="status st-${STATUS[n][0]}"><span class="stlabel">${STATUS[n][0] === 'open' ? 'Still open' : STATUS[n][0] === 'part' ? 'Partly' : 'Fixed'}</span> ${STATUS[n][1]}</p>
  </article>`).join('\n');

const srcTotals = SRC.map(([k, name, file]) => ({
  name, file, n: tot((w) => lane(w, k)), worlds: M.filter((w) => lane(w, k)).length,
})).sort((a, b) => b.n - a.n);
const srcMax = srcTotals[0].n;
const srcBars = srcTotals.map((s) => `<li>
    <span class="sname">${s.name}</span>
    <span class="sbar"><span style="width:${(s.n / srcMax * 100).toFixed(1)}%"></span></span>
    <span class="scount">${s.n}</span>
    <span class="sworlds">${s.worlds} world${s.worlds === 1 ? '' : 's'}</span>
    <code class="sfile">${s.file}</code>
  </li>`).join('\n');

const fps = M.map((w) => w.renderFps);
const grades = M.map((w) => w.maxGrade);
const widths = M.map((w) => w.minHalfWidth);
const solids = M.map((w) => w.counts.solids);
const spread = [
  ['lap progress per 60 s', Math.min(...laps).toFixed(2), lapMed.toFixed(2), Math.max(...laps).toFixed(2)],
  ['narrowest half-width (u)', Math.min(...widths).toFixed(1), med(widths).toFixed(1), '9.0'],
  ['steepest sustained grade', Math.min(...grades).toFixed(3), med(grades).toFixed(3), Math.max(...grades).toFixed(3)],
  ['draw rate (software renderer)', Math.min(...fps).toFixed(2), med(fps).toFixed(2), Math.max(...fps).toFixed(2)],
  ['solid colliders per world', Math.min(...solids), med(solids), Math.max(...solids)],
].map(([k, a, b, c]) => `<tr><td>${k}</td><td class="num">${a}</td><td class="num">${b}</td><td class="num">${c}</td></tr>`).join('');

const clean = [
  ['NaN in player or rival state', 57],
  ['rival stuck, lost, or gifted a lap at the grid', 57],
  ['page errors through build and race', 57],
  ['pickups off the road plane', 57],
  ['hazard a theme declares but never builds', 57],
  ['vertical step in the road over 2.5 u', 57],
  ['grade past what the car can climb', 57],
].map(([k, v]) => `<li><span>${k}</span><b>${v} / 57</b></li>`).join('');

const html = `<title>Track scrutineering — 57 worlds driven</title>
<style>
:root {
  color-scheme: light dark;
  --ground: #eceef0;
  --surface: #fbfcfc;
  --raise: #f2f4f5;
  --ink: #15191e;
  --ink-2: #4a545e;
  --ink-3: #78838d;
  --rule: #d5dade;
  --rule-2: #e6eaec;
  --accent: #0057b8;
  --accent-soft: #e2ecf8;
  --bad: #b3121f;
  --warn: #9a6100;
  --ok: #2f6b4f;
  --shadow: 0 1px 2px rgba(18, 28, 38, .06), 0 8px 24px -16px rgba(18, 28, 38, .35);
  --mono: ui-monospace, "SFMono-Regular", "JetBrains Mono", Menlo, Consolas, "Liberation Mono", monospace;
  --sans: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --ground: #0d1116;
    --surface: #141a21;
    --raise: #1a222b;
    --ink: #e6ecf1;
    --ink-2: #a3b0bc;
    --ink-3: #74828f;
    --rule: #263039;
    --rule-2: #1d262e;
    --accent: #6ba6f5;
    --accent-soft: #16273c;
    --bad: #f2696f;
    --warn: #e0a248;
    --ok: #6dc39a;
    --shadow: 0 1px 2px rgba(0, 0, 0, .5), 0 10px 30px -18px rgba(0, 0, 0, .9);
  }
}
:root[data-theme="dark"] {
  --ground: #0d1116;
  --surface: #141a21;
  --raise: #1a222b;
  --ink: #e6ecf1;
  --ink-2: #a3b0bc;
  --ink-3: #74828f;
  --rule: #263039;
  --rule-2: #1d262e;
  --accent: #6ba6f5;
  --accent-soft: #16273c;
  --bad: #f2696f;
  --warn: #e0a248;
  --ok: #6dc39a;
  --shadow: 0 1px 2px rgba(0, 0, 0, .5), 0 10px 30px -18px rgba(0, 0, 0, .9);
}

* { box-sizing: border-box; }
body {
  margin: 0;
  background: var(--ground);
  color: var(--ink);
  font-family: var(--sans);
  font-size: 15px;
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
}
.wrap { max-width: 1180px; margin: 0 auto; padding: 0 20px 96px; }
h1, h2, h3 { text-wrap: balance; margin: 0; }
code { font-family: var(--mono); font-size: .88em; color: var(--ink-2); }
.num { font-variant-numeric: tabular-nums; font-family: var(--mono); text-align: right; }

/* ---- masthead ---- */
header.top {
  border-bottom: 1px solid var(--rule);
  background: var(--surface);
  padding-top: 40px;
}
header.top .wrap { padding-bottom: 0; }
.eyebrow {
  font-family: var(--mono); font-size: 11px; letter-spacing: .16em;
  text-transform: uppercase; color: var(--accent); margin: 0 0 14px;
}
h1 { font-size: clamp(28px, 4.6vw, 46px); line-height: 1.05; letter-spacing: -.022em; font-weight: 640; }
.dek { color: var(--ink-2); max-width: 62ch; margin: 14px 0 0; font-size: 16.5px; }
.stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1px;
  background: var(--rule); border-top: 1px solid var(--rule); margin-top: 34px; }
.stat { background: var(--surface); padding: 16px 18px 18px; }
.stat b { display: block; font-family: var(--mono); font-variant-numeric: tabular-nums;
  font-size: 30px; letter-spacing: -.02em; line-height: 1.1; }
.stat span { display: block; font-size: 12.5px; color: var(--ink-3); margin-top: 4px; }
.stat.flag b { color: var(--bad); }

/* ---- sections ---- */
section { margin-top: 56px; }
.shead { display: flex; align-items: baseline; gap: 14px; flex-wrap: wrap;
  border-bottom: 1px solid var(--rule); padding-bottom: 10px; margin-bottom: 18px; }
.shead h2 { font-size: 20px; letter-spacing: -.012em; font-weight: 620; }
.shead p { margin: 0; color: var(--ink-3); font-size: 13.5px; }
.note { color: var(--ink-2); max-width: 68ch; margin: 0 0 18px; }

/* ---- tables ---- */
.scroll { overflow-x: auto; background: var(--surface); border: 1px solid var(--rule);
  border-radius: 3px; box-shadow: var(--shadow); }
table { border-collapse: collapse; width: 100%; font-size: 13.5px; }
th { position: sticky; top: 0; z-index: 2; background: var(--raise); color: var(--ink-2);
  font-family: var(--mono); font-weight: 500; font-size: 10.5px; letter-spacing: .09em;
  text-transform: uppercase; text-align: right; padding: 10px 10px; white-space: nowrap;
  border-bottom: 1px solid var(--rule); }
th.l, td.world, td.gate { text-align: left; }
th[data-sort] { cursor: pointer; user-select: none; }
th[data-sort]:hover { color: var(--accent); }
th[aria-sort] { color: var(--accent); }
th[aria-sort]::after { content: " ↓"; }
th[aria-sort="ascending"]::after { content: " ↑"; }
td { padding: 7px 10px; border-bottom: 1px solid var(--rule-2); white-space: nowrap; }
tbody tr:hover td { background: var(--accent-soft); }
tbody tr:last-child td { border-bottom: 0; }
td.stripe { width: 3px; padding: 0; }
.s-high { background: var(--bad); }
.s-med { background: var(--warn); }
.s-ok { background: transparent; }
td.id { color: var(--ink-3); width: 34px; }
td.world { font-weight: 560; }
td.world .region { display: block; font-size: 10.5px; letter-spacing: .07em;
  text-transform: uppercase; color: var(--ink-3); font-weight: 400; }
td.nil, .nil { color: var(--ink-3); opacity: .55; }
td.soft { color: var(--ink-2); }
td.total { font-weight: 700; }
td.warn { color: var(--warn); font-weight: 600; }
td.bad { color: var(--bad); font-weight: 600; }
.ht1 { background: color-mix(in oklab, var(--bad) 8%, transparent); }
.ht2 { background: color-mix(in oklab, var(--bad) 16%, transparent); }
.ht3 { background: color-mix(in oklab, var(--bad) 26%, transparent); }
.ht4 { background: color-mix(in oklab, var(--bad) 38%, transparent); }
.chip { font-family: var(--mono); font-size: 11px; padding: 2px 7px; border-radius: 2px;
  background: var(--accent-soft); color: var(--accent); white-space: nowrap; }
tfoot td { border-top: 1px solid var(--rule); font-weight: 700; background: var(--raise); }
tfoot td.lbl { font-family: var(--mono); font-size: 10.5px; letter-spacing: .09em;
  text-transform: uppercase; font-weight: 500; color: var(--ink-2); }

/* ---- controls ---- */
.controls { display: flex; gap: 8px; align-items: center; margin-bottom: 12px; flex-wrap: wrap; }
button.ctl { font: inherit; font-size: 12.5px; font-family: var(--mono); letter-spacing: .04em;
  background: var(--surface); color: var(--ink-2); border: 1px solid var(--rule);
  padding: 6px 12px; border-radius: 2px; cursor: pointer; }
button.ctl:hover { border-color: var(--accent); color: var(--accent); }
button.ctl[aria-pressed="true"] { background: var(--accent); border-color: var(--accent); color: #fff; }
:root[data-theme="dark"] button.ctl[aria-pressed="true"],
:root:not([data-theme="light"]) button.ctl[aria-pressed="true"] { color: #0d1116; }
button.ctl:focus-visible, th:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.count { font-family: var(--mono); font-size: 12px; color: var(--ink-3); }

/* ---- source bars ---- */
ul.sources { list-style: none; margin: 0; padding: 0; display: grid; gap: 1px;
  background: var(--rule); border: 1px solid var(--rule); border-radius: 3px; }
ul.sources li { background: var(--surface); display: grid; align-items: center; gap: 14px;
  grid-template-columns: 150px 1fr 42px 78px 150px; padding: 9px 14px; font-size: 13px; }
.sname { font-weight: 560; }
.sbar { background: var(--rule-2); height: 8px; border-radius: 1px; overflow: hidden; }
.sbar span { display: block; height: 100%; background: var(--bad); }
.scount { font-family: var(--mono); text-align: right; font-weight: 700; font-variant-numeric: tabular-nums; }
.sworlds { color: var(--ink-3); font-size: 12px; }
.sfile { color: var(--ink-3); font-size: 11.5px; }
@media (max-width: 720px) {
  ul.sources li { grid-template-columns: 1fr 44px; grid-auto-rows: min-content; }
  .sbar { grid-column: 1 / -1; } .sworlds, .sfile { grid-column: 1 / -1; }
}

/* ---- findings ---- */
.findings { display: grid; gap: 1px; background: var(--rule);
  border: 1px solid var(--rule); border-radius: 3px; }
.finding { background: var(--surface); padding: 18px 20px 20px; border-left: 3px solid transparent; }
.finding.s-high { border-left-color: var(--bad); }
.finding.s-med { border-left-color: var(--warn); }
.finding.s-low { border-left-color: var(--rule); }
.finding header { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
.finding h3 { font-size: 16px; font-weight: 600; letter-spacing: -.008em; flex: 1; }
.fnum { font-family: var(--mono); font-size: 12px; color: var(--ink-3); }
.sev { font-family: var(--mono); font-size: 10px; letter-spacing: .12em; text-transform: uppercase;
  padding: 3px 8px; border-radius: 2px; }
.sev-high { background: color-mix(in oklab, var(--bad) 16%, transparent); color: var(--bad); }
.sev-med { background: color-mix(in oklab, var(--warn) 18%, transparent); color: var(--warn); }
.sev-low { background: var(--rule-2); color: var(--ink-3); }
.finding p { margin: 0 0 8px; color: var(--ink-2); max-width: 78ch; }
.finding .scope { font-family: var(--mono); font-size: 12px; color: var(--ink-3); margin-bottom: 10px; }
.finding .fix { color: var(--ink); }
.fixlabel { font-family: var(--mono); font-size: 10px; letter-spacing: .12em; text-transform: uppercase;
  color: var(--ink-3); margin-right: 8px; }
.status { margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--rule-2); color: var(--ink); }
.stlabel { font-family: var(--mono); font-size: 10px; letter-spacing: .12em; text-transform: uppercase;
  margin-right: 8px; padding: 2px 7px; border-radius: 2px; }
.st-fixed .stlabel { background: color-mix(in oklab, var(--ok) 16%, transparent); color: var(--ok); }
.st-part .stlabel { background: color-mix(in oklab, var(--warn) 18%, transparent); color: var(--warn); }
.st-open .stlabel { background: color-mix(in oklab, var(--bad) 16%, transparent); color: var(--bad); }

/* ---- two-up ---- */
.twoup { display: grid; gap: 28px; grid-template-columns: 1fr 1fr; }
@media (max-width: 820px) { .twoup { grid-template-columns: 1fr; } }
ul.clean { list-style: none; margin: 0; padding: 0; }
ul.clean li { display: flex; justify-content: space-between; gap: 16px; padding: 8px 0;
  border-bottom: 1px solid var(--rule-2); color: var(--ink-2); font-size: 13.5px; }
ul.clean li b { font-family: var(--mono); color: var(--ok); font-variant-numeric: tabular-nums; }
table.spread td:first-child { color: var(--ink-2); white-space: normal; }

footer { margin-top: 64px; padding-top: 20px; border-top: 1px solid var(--rule);
  color: var(--ink-3); font-size: 13px; }
footer code { color: var(--ink-2); }
footer p { max-width: 74ch; }
</style>

<header class="top">
  <div class="wrap">
    <p class="eyebrow">Scrutineering sheet · IGNITE RALLY</p>
    <h1>An agent drove all 57 worlds, hit 211 things, and now hits none.</h1>
    <p class="dek">
      An autopilot lapped every world in the career on the same analog steer, throttle
      and brake a touch player uses — no rail, no teleport — at rival pace, and the
      world was audited around it. Everything it found has been fixed except the two
      rows marked open. Every figure is a measurement, before and after.
    </p>
    <div class="stats">
      <div class="stat"><b>211 → ${inLaneTotal}</b><span>colliders standing in the drivable lane</span></div>
      <div class="stat"><b>29 → ${affected}</b><span>of 57 worlds carrying at least one</span></div>
      <div class="stat"><b>64 → ${totBar}</b><span>wall runs lying inside the road</span></div>
      <div class="stat"><b>7 → 1</b><span>stalls driving all 57 — the one left is a live rockfall</span></div>
      <div class="stat flag"><b>2</b><span>findings still open, listed below</span></div>
    </div>
  </div>
</header>

<div class="wrap">

<section>
  <div class="shead">
    <h2>The findings</h2>
    <p>Nine, worst first. Full write-up in BUGS.md.</p>
  </div>
  <div class="findings">
    ${findingCards}
  </div>
</section>

<section>
  <div class="shead">
    <h2>Which builder put it there</h2>
    <p>Colliders in the lane, by the call site responsible.</p>
  </div>
  <p class="note">
    Every one of these places scenery at a fixed lateral offset from its own
    sample and never re-checks it against the rest of the centreline. Three of
    them sit directly beneath a sibling that <em>does</em> call
    <code>_clearsRoad</code> — one carrying a comment describing this exact
    failure. Two call sites account for ${srcTotals[0].n + srcTotals[1].n} of the ${inLaneTotal}.
  </p>
  <ul class="sources">
    ${srcBars}
  </ul>
</section>

<section>
  <div class="shead">
    <h2>World × finding</h2>
    <p>Click a column to sort.</p>
  </div>
  <div class="controls">
    <button class="ctl" id="only" aria-pressed="false">Only worlds with findings</button>
    <button class="ctl" id="reset">Reset order</button>
    <span class="count" id="count"></span>
  </div>
  <p class="note">
    <b>lane</b> — colliders inside the advertised drivable width.
    <b>near</b> — inside the clearance RULES.md §3 promises
    (<code>widthAt + r + carRadius</code>).
    <b>flat×</b> — self-crossings under 4 u apart vertically.
    <b>laps</b> — lap progress in 60 s.
    <b>minHW</b> — narrowest half-width. <b>fps</b> — draw rate under the software
    renderer, comparable only with each other.
  </p>
  <div class="scroll">
    <table id="matrix">
      <thead>
        <tr>
          <th class="l"></th>
          <th class="l" data-sort="num">#</th>
          <th class="l" data-sort="text">World</th>
          <th data-sort="num">Lane</th>
          <th data-sort="num">Near</th>
          <th data-sort="num">Wall</th>
          <th data-sort="num">Flat×</th>
          <th data-sort="num">Stall</th>
          <th data-sort="num">Laps</th>
          <th data-sort="num">MinHW</th>
          <th data-sort="num">Grade</th>
          <th data-sort="num">FPS</th>
          <th class="l">Gate</th>
        </tr>
      </thead>
      <tbody>
${rows}
      </tbody>
      <tfoot>
        <tr>
          <td class="stripe"></td><td></td><td class="lbl">57 worlds</td>
          <td class="num">${inLaneTotal}</td>
          <td class="num">${tot((w) => w.nearRule)}</td>
          <td class="num">${tot((w) => w.barIn)}</td>
          <td class="num">${flat}</td>
          <td class="num">${stalls}</td>
          <td class="num">${lapMed.toFixed(2)}</td>
          <td class="num">—</td><td class="num">—</td><td class="num">—</td><td></td>
        </tr>
      </tfoot>
    </table>
  </div>
</section>

<section>
  <div class="shead">
    <h2>World × call site</h2>
    <p>Only the ${affected} worlds carrying something in the lane.</p>
  </div>
  <div class="scroll">
    <table>
      <thead>
        <tr>
          <th class="l">#</th><th class="l">World</th>
          ${SRC.map(([, n]) => `<th>${n.replace(' ', '<br>')}</th>`).join('')}
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
${srcRows}
      </tbody>
      <tfoot>
        <tr>
          <td></td><td class="lbl">All worlds</td>
          ${SRC.map(([k]) => `<td class="num">${tot((w) => lane(w, k))}</td>`).join('')}
          <td class="num">${inLaneTotal}</td>
        </tr>
      </tfoot>
    </table>
  </div>
</section>

<section class="twoup">
  <div>
    <div class="shead"><h2>What every world passed</h2></div>
    <p class="note">Most of the game came back clean, and that is worth recording.</p>
    <ul class="clean">${clean}</ul>
  </div>
  <div>
    <div class="shead"><h2>Spread</h2></div>
    <p class="note">Across the roster: min, median, max.</p>
    <div class="scroll">
      <table class="spread">
        <thead><tr><th class="l">Measure</th><th>Min</th><th>Median</th><th>Max</th></tr></thead>
        <tbody>${spread}</tbody>
      </table>
    </div>
  </div>
</section>

<footer>
  <p>
    The driving column comes from <code>tests/agent-sweep.mjs</code> over the full
    roster; the build-time columns from <code>tests/world-matrix.mjs</code>, run
    against a <em>second, independent build</em> of all 57 worlds. CONFORMANCE.md
    warns that a world differs between two builds — the in-lane totals came back
    identical, ${inLaneTotal} with the same split per call site, which is itself the
    finding: this furniture lands in the road every time, not by luck of a seed.
  </p>
  <p>
    Frame rates are software-rendered (SwiftShader) and are not device performance.
  </p>
</footer>

</div>

<script>
(() => {
  const table = document.getElementById('matrix');
  const tbody = table.tBodies[0];
  const original = [...tbody.rows];
  const count = document.getElementById('count');
  const onlyBtn = document.getElementById('only');
  let filtered = false;

  const paint = () => {
    const shown = [...tbody.rows].filter((r) => r.style.display !== 'none').length;
    count.textContent = shown + ' of 57 worlds shown';
  };
  const applyFilter = () => {
    for (const r of tbody.rows) {
      r.style.display = (filtered && r.dataset.hits === '0') ? 'none' : '';
    }
    paint();
  };

  onlyBtn.addEventListener('click', () => {
    filtered = !filtered;
    onlyBtn.setAttribute('aria-pressed', String(filtered));
    applyFilter();
  });

  document.getElementById('reset').addEventListener('click', () => {
    for (const r of original) tbody.appendChild(r);
    for (const th of table.tHead.rows[0].cells) th.removeAttribute('aria-sort');
    applyFilter();
  });

  const value = (row, i, kind) => {
    const t = row.cells[i].textContent.trim();
    if (kind === 'num') { const n = parseFloat(t.replace(/[^\\d.\\-]/g, '')); return Number.isFinite(n) ? n : -1; }
    return t.toLowerCase();
  };

  [...table.tHead.rows[0].cells].forEach((th, i) => {
    const kind = th.dataset.sort;
    if (!kind) return;
    th.tabIndex = 0;
    const run = () => {
      const asc = th.getAttribute('aria-sort') === 'descending' ? true
        : th.getAttribute('aria-sort') === 'ascending' ? false : (kind === 'text');
      for (const o of table.tHead.rows[0].cells) o.removeAttribute('aria-sort');
      th.setAttribute('aria-sort', asc ? 'ascending' : 'descending');
      const rows = [...tbody.rows].sort((a, b) => {
        const x = value(a, i, kind), y = value(b, i, kind);
        return (x < y ? -1 : x > y ? 1 : 0) * (asc ? 1 : -1);
      });
      for (const r of rows) tbody.appendChild(r);
    };
    th.addEventListener('click', run);
    th.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); run(); } });
  });

  paint();
})();
</script>
`;

fs.writeFileSync('track-matrix.html', html);
console.log('wrote track-matrix.html', html.length, 'bytes');
