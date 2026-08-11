/* CENSUS: which worlds run two legs of their lap on shared tarmac at grade —
 * corridors overlapping (centerlines < 14 u) with no vertical separation.
 * A diagnostic tool, not a gate. Findings as of r153b: MOUNTAIN TO SEA
 * (5 stretches, legs down to 1.3 u apart) and SEA CLIFF RUN (2). These are
 * real authoring facts — OLIVE CROSSING's west knot also passes 3-12 u with a
 * 0.3 u height gap over a shorter stretch — but note they did NOT turn out to
 * be the field-stall cause; see test-field-stalls.mjs. */
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 480, height: 320 } });
await page.goto('http://localhost:8901/?level=1&go=1&unlockall=1', { waitUntil: 'load', timeout: 60000 });
await page.waitForFunction(() => window.__game?.track?.center && window.__game.player);
const rows = await page.evaluate(async () => {
  const g = window.__game;
  const { LEVELS } = await import('./src/track.js');
  const out = [];
  for (const L of LEVELS) {
    g.state = 'title'; g.editScene = null;
    try { g.swapLevel(L, true, null); } catch { continue; }
    const t = g.track, N = t.N;
    const runs = [];
    let cur = null;
    for (let i = 0; i < N; i += 2) {
      const a = t.center[i];
      let best = Infinity, bj = -1;
      for (let j = 0; j < N; j += 2) {
        const lapD = Math.min(Math.abs(j - i), N - Math.abs(j - i));
        if (lapD < 60) continue;
        const dx = a.x - t.center[j].x, dz = a.z - t.center[j].z;
        const d = dx * dx + dz * dz;
        if (d < best) { best = d; bj = j; }
      }
      const d = Math.sqrt(best);
      const gap = bj >= 0 ? Math.abs(a.y - t.center[bj].y) : 99;
      // overlap at grade: corridors share tarmac AND no vertical separation
      if (d < 14 && gap < 4) {
        if (cur && i - cur.end <= 6) { cur.end = i; cur.minD = Math.min(cur.minD, d); }
        else { cur = { start: i, end: i, minD: d, x: +a.x.toFixed(0), z: +a.z.toFixed(0) }; runs.push(cur); }
      }
    }
    const sig = runs.filter((r) => r.end - r.start >= 4);   // sustained, not a touch
    if (sig.length) out.push({ id: L.id, name: L.name,
      runs: sig.length,
      detail: sig.slice(0, 3).map((r) => `${(r.end - r.start) * t.segLen | 0}u@(${r.x},${r.z})d${r.minD.toFixed(1)}`) });
  }
  return out;
});
console.log(`${rows.length} worlds with sustained at-grade corridor overlaps:`);
for (const r of rows) console.log(` ${String(r.id).padStart(3)} ${r.name.padEnd(20)} ${r.runs} run(s): ${r.detail.join('  ')}`);
await b.close();
