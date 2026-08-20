/* WHAT IS THE GROUND DOING UNDER PINE VALLEY'S WORST WATER LIP?
 * The lip at (-228,-82) is 22 u from the road and was already the worst on the
 * roster before the culvert cap (3.49 u proud); the cap took it to 4.59, over
 * test-river's 4.1 u ceiling. Print water surface, terrain and bed either side
 * of it, on both trees, walking along the river. */
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 400, height: 260 } });
page.setDefaultTimeout(900000);
const TX = +(process.env.TX ?? -228), TZ = +(process.env.TZ ?? -82), ID = process.env.LEVEL ?? '1';
const grab = async (root) => {
  await page.goto(`${root}/?level=${ID}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 900000 });
  await page.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 900000 });
  return page.evaluate(async ({ TX, TZ }) => {
    const THREE = await import('three');
    const t = window.__game.track, R = t._river;
    const k0 = R.line.reduce((bst, p, k) => {
      const d = Math.hypot(p.x - TX, p.z - TZ); return d < bst.d ? { k, d } : bst;
    }, { k: -1, d: Infinity }).k;
    const rows = [];
    for (let k = k0 - 6; k <= k0 + 6; k++) {
      if (k < 0 || k >= R.line.length) continue;
      const p = R.line[k];
      rows.push({ k, dRoad: +t._distToTrackCoarse(p.x, p.z).toFixed(1),
        bed: +R.bed[k].toFixed(2), ground: +t.terrainHeight(p.x, p.z).toFixed(2),
        surf: +(R.bed[k] - R.depth * 0.58).toFixed(2) });
    }
    return { k0, rows, depth: R.depth };
  }, { TX, TZ });
};
const A = await grab('http://localhost:8956'), B = await grab('http://localhost:8901');
console.log(`nearest plan station k=${A.k0}, channel depth ${A.depth}`);
console.log('   k  dRoad |  BEFORE bed  ground  surf-ground |  AFTER  bed  ground  surf-ground');
for (let i = 0; i < A.rows.length; i++) {
  const a = A.rows[i], c = B.rows[i];
  console.log(`${String(a.k).padStart(4)} ${String(a.dRoad).padStart(6)} | `
    + `${String(a.bed).padStart(11)} ${String(a.ground).padStart(7)} ${String((a.surf - a.ground).toFixed(2)).padStart(11)} | `
    + `${String(c.bed).padStart(11)} ${String(c.ground).padStart(7)} ${String((c.surf - c.ground).toFixed(2)).padStart(11)}`);
}
await b.close();
