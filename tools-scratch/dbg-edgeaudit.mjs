/* W-EDGE-01a audit (Race Integrity patch, build-order item 3).
 *
 * "Any road segment where the terrain beside the road drops more than 2 m
 *  within 4 m of the road edge MUST have a physical containment feature on
 *  that side along the entire drop."
 *
 * The shipped rail builder tests a SINGLE probe 7.0 m out against a 2.5 m
 * threshold. This walks the band from the edge to 4 m in 0.5 m steps and
 * takes the WORST drop in it, which is the patch's test, and asks whether
 * any barrier stands within reach on that side. */
import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 320, height: 200 } });
p.setDefaultTimeout(1800000);
await p.goto('http://localhost:8901/?level=21&go=1&unlockall=1',
  { waitUntil: 'load', timeout: 1800000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 1800000 });
const only = process.env.ONLY ? process.env.ONLY.split(',') : null;
const r = await p.evaluate(async ({ only, BAND9 }) => {
  const g = window.__game; const { LEVELS } = await import('./src/track.js');
  const DROP = +(BAND9.drop), BAND = +(BAND9.band), STEP = 0.5, NEAR = 12;   // NEAR: barrier reach, as the builder uses
  const out = [];
  for (const L of LEVELS) {
    if (only && !only.includes(L.name)) continue;
    g.state = 'title'; g.editScene = null;
    try { g.swapLevel(L, true, null); } catch (e) { continue; }
    const t = g.track, N = t.center.length;
    let stations = 0, viol = 0, worst = 0, worstAt = null;
    const runs = [];
    let inRun = null;
    for (let i = 0; i < N; i++) {
      const half = t.widthAt(i);
      let bad = false;
      for (const side of [1, -1]) {
        let d = 0;
        for (let o = 0; o <= BAND; o += STEP) {
          const q = t.pointAt(i, (half + o) * side);
          d = Math.max(d, t.center[i].y - t.terrainHeight(q.x, q.z));
        }
        if (d <= DROP) continue;
        // is anything standing there?
        const e = t.pointAt(i, (half + 1.5) * side);
        let guarded = false;
        for (const q of (t.barriers ?? [])) {
          const mx = (q.x1 + q.x2) / 2, mz = (q.z1 + q.z2) / 2;
          if ((mx - e.x) ** 2 + (mz - e.z) ** 2 < NEAR * NEAR) { guarded = true; break; }
        }
        if (guarded) continue;
        bad = true;
        if (d > worst) { worst = d; worstAt = { i, side, drop: +d.toFixed(1) }; }
      }
      stations++;
      if (bad) { viol++; inRun = inRun ?? i; }
      else if (inRun !== null) { runs.push([inRun, i - 1]); inRun = null; }
    }
    if (inRun !== null) runs.push([inRun, N - 1]);
    const segLen = t.segLen ?? 4;
    runs.sort((a, b) => (b[1] - b[0]) - (a[1] - a[0]));
    out.push({ world: L.name, theme: L.theme, stations, viol,
      pct: +(100 * viol / stations).toFixed(1),
      worst: worstAt, longestRunM: runs.length ? Math.round((runs[0][1] - runs[0][0] + 1) * segLen) : 0,
      topRuns: runs.slice(0, 3).map((x) => `${x[0]}-${x[1]}`) });
  }
  return out;
}, { only, BAND9: { drop: process.env.DROP ?? 2, band: process.env.BAND ?? 4 } });
const bad = r.filter((x) => x.viol > 0);
console.log(JSON.stringify({ worlds: r.length, withViolations: bad.length,
  totalStations: r.reduce((a, x) => a + x.viol, 0),
  rows: bad.sort((a, b) => b.viol - a.viol).slice(0, 15) }, null, 1));
await browser.close();
