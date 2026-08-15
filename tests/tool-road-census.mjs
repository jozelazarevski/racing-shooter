/* WHAT IS ON THE ROAD, ACROSS THE WHOLE ROSTER.
 *
 * `test-carriageway` measures the same quantity but only on the six worlds a
 * census once found problems on. That is a guard against those regressions
 * coming back — it is not an answer to "is the roster clean", and the two
 * questions have had different answers before: the gorge trench cut unramped
 * holes in CANYON RUN and RED CENTRE RUN for months while every carriageway
 * assertion passed, because no test walked the worlds it happened on.
 *
 * So this walks ALL of them and reports four things per world:
 *
 *   BLOCKERS   a solid whose radius reaches inside the drivable width. These
 *              push the car. Measured as `|lateral| - radius` against that
 *              sample's OWN half-width, because the roster runs from 7 u
 *              pinches to 13 u boulevards and one constant would be wrong at
 *              both ends.
 *   HOLES      road samples with no surface that are not at a gorge jump —
 *              the r179 class of defect, which is invisible until you drive
 *              into it at 60 u/s.
 *   FLOATERS   solids whose base sits well above the ground under them.
 *   NARROWS    the tightest drivable width on the lap, so a world that is
 *              merely hard to thread is not confused with one that is blocked.
 *
 * KNOWN FALSE POSITIVE, not filtered because filtering it would hide real
 * ones: a TUNNEL BORE is narrower than the road it carries, and its wall
 * colliders sit at the bore's half-width. Those show as BLOCKERS on every
 * world with a tunnel and they are the tunnel doing its job. Read `stone`
 * counts on SUZUKA, HARBOR QUAY, COTE D AZUR and SILVERSTONE with that in
 * mind, and compare runs against each other rather than against zero.
 *
 * A TOOL, not a test: it prints a census and exits 0. The pass/fail line
 * belongs in test-carriageway, which is where a fix gets pinned once this has
 * found something.
 *
 *   node tests/tool-road-census.mjs            # every world
 *   node tests/tool-road-census.mjs 4 32 40    # only these
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';
const only = process.argv.slice(2).map(Number).filter(Boolean);

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 640, height: 400 } });
page.setDefaultTimeout(600000);

await page.goto(`${BASE}/?level=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await page.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 600000 });
const roster = await page.evaluate(async () => {
  const { LEVELS } = await import('./src/track.js');
  return LEVELS.map((l) => ({ id: l.id, name: l.name }));
});
const worlds = only.length ? roster.filter((l) => only.includes(l.id)) : roster;

const totals = { blockers: 0, holes: 0, floaters: 0, worlds: 0, dirty: 0 };
const byKind = new Map();
const rows = [];

for (const lv of worlds) {
  await page.goto(`${BASE}/?level=${lv.id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
  const built = await page.waitForFunction(() => window.__game?.track?.center && window.__game.player,
    undefined, { timeout: 600000 }).then(() => 1).catch(() => 0);
  if (!built) { console.log(`SKIP  ${lv.name}`); continue; }

  const r = await page.evaluate(() => {
    const t = window.__game.track, N = t.center.length;
    // Nearest point on the centreline POLYLINE, not the nearest sample's
    // normal: on a hairpin the other leg swings underneath and the error is
    // the same size as the thing being measured.
    const nearest = (x, z) => {
      let best = Infinity, at = 0;
      for (let i = 0; i < N; i++) {
        const c = t.center[i];
        const d = (x - c.x) * (x - c.x) + (z - c.z) * (z - c.z);
        if (d < best) { best = d; at = i; }
      }
      return { d: Math.sqrt(best), i: at };
    };

    // ---- BLOCKERS ---------------------------------------------------------
    const blockers = [];
    let narrowest = Infinity;
    for (let i = 0; i < N; i++) narrowest = Math.min(narrowest, t.widthAt(i));
    for (const s of (t.solids ?? [])) {
      if (!Number.isFinite(s.x) || !Number.isFinite(s.z)) continue;
      // TRAFFIC BELONGS ON THE ROAD. traffic.js parks its avoid-marker at a
      // sentinel coordinate and its live vehicles drive the carriageway on
      // purpose; counting either as an intrusion buries the real ones.
      if (s.mat === 'traffic') continue;
      const { d, i } = nearest(s.x, s.z);
      const rad = s.r ?? 1;
      const half = t.widthAt(i);
      // how far INSIDE the drivable edge the solid reaches; > 0 means it is
      // standing on road the car is entitled to use
      const bite = half - (d - rad);
      if (bite > 0.15) {
        blockers.push({ mat: s.mat ?? '?', i, bite: +bite.toFixed(2),
          lat: +d.toFixed(2), r: +rad.toFixed(2), half: +half.toFixed(2) });
      }
    }
    blockers.sort((a, b) => b.bite - a.bite);

    // ---- HOLES ------------------------------------------------------------
    const gorges = (t._jumpGorges ?? []).map((G) => G.i);
    const holes = [];
    if (t._jumpCut) {
      let run = null;
      for (let i = 0; i < N; i++) {
        if (t._jumpCut[i] > 0.5) { if (!run) { run = [i, i]; holes.push(run); } else run[1] = i; }
        else run = null;
      }
    }
    const stray = holes.filter((h) => !gorges.some((gi) => t._circDist(h[0], gi) <= 10))
      .map((h) => `${h[0]}-${h[1]}`);

    // ---- FLOATERS ---------------------------------------------------------
    const floaters = [];
    for (const s of (t.solids ?? [])) {
      if (s.y == null || !Number.isFinite(s.y) || s.mat === 'traffic') continue;
      // A CHASM MAKES ITS OWN RIM LOOK LIKE IT IS FLYING. `terrainHeight`
      // reads the carve, so anything standing on the lip of a gorge measures
      // as twenty-plus metres of air. Skip the carve's footprint rather than
      // report the hole as a floating object.
      if ((t._gorgeCut?.(s.x, s.z) ?? 0) > 1) continue;
      const g = t.terrainHeight(s.x, s.z);
      if (!Number.isFinite(g)) continue;
      const air = s.y - g;
      if (air > 2.5) floaters.push({ mat: s.mat ?? '?', air: +air.toFixed(1) });
    }
    floaters.sort((a, b) => b.air - a.air);

    return { solids: (t.solids ?? []).length, blockers, stray, floaters,
      narrowest: +narrowest.toFixed(1) };
  });

  totals.worlds++;
  totals.blockers += r.blockers.length;
  totals.holes += r.stray.length;
  totals.floaters += r.floaters.length;
  const dirty = r.blockers.length || r.stray.length || r.floaters.length;
  if (dirty) totals.dirty++;
  for (const b of r.blockers) byKind.set(b.mat, (byKind.get(b.mat) ?? 0) + 1);

  const bits = [];
  if (r.blockers.length) {
    const kinds = {};
    for (const b of r.blockers) kinds[b.mat] = (kinds[b.mat] ?? 0) + 1;
    bits.push(`${r.blockers.length} BLOCKERS (${Object.entries(kinds)
      .map(([k, n]) => `${k}x${n}`).join(' ')}) worst bite ${r.blockers[0].bite} u`);
  }
  if (r.stray.length) bits.push(`${r.stray.length} BARE HOLES at ${r.stray.join(', ')}`);
  if (r.floaters.length) bits.push(`${r.floaters.length} FLOATERS, highest ${r.floaters[0].air} u`);
  console.log(`${dirty ? '••' : '  '} ${String(lv.id).padStart(2)} ${lv.name.padEnd(22)}`
    + `${String(r.solids).padStart(5)} solids  narrowest ${String(r.narrowest).padStart(5)} u  `
    + (bits.length ? bits.join(' | ') : 'clean'));
  rows.push({ id: lv.id, name: lv.name, ...r });
}

console.log(`\n===== ${totals.dirty} of ${totals.worlds} worlds have something on the road =====`);
console.log(`   blockers ${totals.blockers}   bare holes ${totals.holes}   floaters ${totals.floaters}`);
if (byKind.size) {
  console.log('\n--- blockers by material ---');
  for (const [k, n] of [...byKind].sort((a, b) => b[1] - a[1])) console.log(`   ${k.padEnd(14)} ${n}`);
}
const worst = rows.filter((r) => r.blockers.length)
  .sort((a, b) => b.blockers[0].bite - a.blockers[0].bite).slice(0, 10);
if (worst.length) {
  console.log('\n--- deepest single intrusions ---');
  for (const w of worst) {
    const b = w.blockers[0];
    console.log(`   ${w.name.padEnd(22)} ${b.mat} bites ${b.bite} u into a ${b.half} u half-width `
      + `(sample ${b.i}, centre ${b.lat} u out, r ${b.r})`);
  }
}

await browser.close();
