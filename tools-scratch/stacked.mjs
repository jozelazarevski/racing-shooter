/* WHERE DOES A LAP RUN OVER ITSELF, AND IS THERE A BRIDGE THERE?
 *
 * `_checkLayout` already asks a version of this and cannot answer it. It keeps
 * the SINGLE global minimum self-approach and ignores Y altogether, so on a
 * world with one legitimate flyover the flyover IS the minimum and every other
 * overlap on the lap is invisible behind it. That is why SEA CLIFF RUN could
 * carry 80 u of road stacked on road for several sessions while the layout
 * check printed a number about somewhere else entirely.
 *
 * Two carriageways need 18 u between centrelines not to overlap (2 x ROAD_HALF).
 * Below that they share tarmac, and then only the VERTICAL gap decides what the
 * player meets:
 *
 *   dy >= 6      a flyover. One road passes over the other; fine, and normally
 *                there is a registered crossing with a deck and ramps.
 *   dy <  6      the two roadways interpenetrate. You are driving through the
 *                underside of another carriageway, or along a seam between two.
 *                THIS is the defect class, and it is what `_planOverpasses`
 *                cannot see: it only fires on a true XZ segment INTERSECTION,
 *                so a NEAR-PARALLEL pass registers no crossing at all.
 *
 * Runs are reported, not individual pairs — a 40 u overlap is one problem, not
 * two hundred — with the closest approach and the tightest vertical gap in each,
 * and whether `_overpasses` covers it.
 *
 *   node tools-scratch/stacked.mjs            # every world
 *   node tools-scratch/stacked.mjs 60 59 57   # only these
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8920';
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

let dirty = 0, totalRuns = 0, worstWorld = null;

for (const lv of worlds) {
  await page.goto(`${BASE}/?level=${lv.id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
  const built = await page.waitForFunction(() => window.__game?.track?.center && window.__game.player,
    undefined, { timeout: 600000 }).then(() => 1).catch(() => 0);
  if (!built) { console.log(`SKIP  ${lv.name}`); continue; }

  const r = await page.evaluate(() => {
    const t = window.__game.track, N = t.center.length;
    const SHARE = 18;        // 2 x ROAD_HALF: below this the tarmac overlaps
    const CLEAR = 6;         // above this vertically it is a flyover, not a clash
    const APART = 40;        // samples: closer than this along the lap is just the road

    // closest approach from each sample to any FAR-AWAY part of the lap
    const hit = new Array(N).fill(null);
    for (let i = 0; i < N; i++) {
      let bd = Infinity, bj = -1;
      for (let j = 0; j < N; j++) {
        const lap = Math.min((i - j + N) % N, (j - i + N) % N);
        if (lap < APART) continue;
        const dx = t.center[i].x - t.center[j].x, dz = t.center[i].z - t.center[j].z;
        const d2 = dx * dx + dz * dz;
        if (d2 < bd) { bd = d2; bj = j; }
      }
      const d = Math.sqrt(bd);
      const dy = Math.abs(t.center[i].y - t.center[bj].y);
      // BOTH TESTS, PER SAMPLE. Marking a sample merely "close in XZ" and then
      // reporting the run's smallest d and smallest dy takes them from
      // DIFFERENT places: on MOUNTAIN TO SEA that read "141 u of lap 0.6 u
      // apart and 0.05 u vertically", when the 0.6 u belongs to a stretch with
      // 11 u of clearance over it and the 0.05 u to a different stretch 30 u
      // away. A clash is one sample that is close in XZ AND level in Y.
      if (d < SHARE && dy < CLEAR) hit[i] = { j: bj, d, dy };
    }

    // an overpass covers this sample?
    const covered = (i) => (t._overpasses ?? []).some((o) =>
      Math.min((i - o.up + N) % N, (o.up - i + N) % N) <= o.half + 6
      || Math.min((i - o.down + N) % N, (o.down - i + N) % N) <= o.half + 6);

    // group into runs
    const runs = [];
    let cur = null;
    for (let i = 0; i < N; i++) {
      if (!hit[i]) { cur = null; continue; }
      // and break the run when the PARTNER jumps: consecutive samples pairing
      // with opposite sides of the lap are two encounters, not one.
      if (cur && Math.min((hit[i].j - cur.j + N) % N, (cur.j - hit[i].j + N) % N) > 25) cur = null;
      if (!cur) { cur = { i0: i, i1: i, minD: hit[i].d, minDy: hit[i].dy, j: hit[i].j, cov: 0, n: 0 }; runs.push(cur); }
      cur.i1 = i; cur.n++;
      cur.j = hit[i].j;
      if (hit[i].d < cur.minD) cur.minD = hit[i].d;
      cur.minDy = Math.min(cur.minDy, hit[i].dy);
      if (covered(i)) cur.cov++;
    }
    // a run that wraps the start joins the last to the first
    if (runs.length > 1 && hit[0] && hit[N - 1]) {
      const a = runs[0], b = runs[runs.length - 1];
      b.i1 = a.i1 + N; b.n += a.n; b.cov += a.cov;
      b.minD = Math.min(b.minD, a.minD); b.minDy = Math.min(b.minDy, a.minDy);
      runs.shift();
    }
    const seg = t.segLen;
    return { name: t.level?.name, overpasses: (t._overpasses ?? []).length,
      runs: runs.map((q) => ({
        from: q.i0, to: q.i1, over: q.j, len: +(q.n * seg).toFixed(0),
        gap: +q.minD.toFixed(2), dy: +q.minDy.toFixed(2),
        cov: Math.round((q.cov / q.n) * 100),
        clash: true,
      })).sort((a, b) => a.gap - b.gap) };
  });

  const bad = r.runs.filter((q) => q.clash);
  totalRuns += bad.length;
  if (bad.length) {
    dirty++;
    const w = bad[0];
    if (!worstWorld || w.gap < worstWorld.gap) worstWorld = { name: r.name, ...w };
    console.log(`•• ${String(lv.id).padStart(2)} ${r.name.padEnd(20)} ${r.overpasses} overpasses  `
      + `${bad.length} INTERPENETRATING run(s)`);
    for (const q of bad) {
      console.log(`        ${String(q.from).padStart(3)}-${String(q.to).padStart(3)} over ~${q.over}`
        + `  ${String(q.len).padStart(3)} u of lap   closest ${q.gap} u apart, only ${q.dy} u vertically`
        + `   ${q.cov}% inside a registered overpass`);
    }
  } else if (r.runs.length) {
    console.log(`   ${String(lv.id).padStart(2)} ${r.name.padEnd(20)} ${r.runs.length} overlap run(s), `
      + `all cleared vertically (tightest ${r.runs[0].dy} u)`);
  }
}

console.log(`\n===== ${dirty} worlds have road stacked on road with under 6 u between them =====`);
console.log(`   ${totalRuns} runs in total`);
if (worstWorld) {
  console.log(`   worst: ${worstWorld.name} samples ${worstWorld.from}-${worstWorld.to}, `
    + `${worstWorld.gap} u apart and ${worstWorld.dy} u vertically over ${worstWorld.len} u of lap`);
}
await browser.close();
