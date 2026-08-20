/* IS THE TOP OF A WALL SOLID GROUND?
 *
 * "Wall needs to be removed. I can't be driving on it." A wall you can drive
 * ALONG THE TOP OF means its upper surface is being treated as ground. The
 * cliff ribbon has a rim plateau — row 3, the flat the saguaros stand on — and
 * if the height field agrees with it, that plateau is a road.
 *
 * Ask the height field, which is what the car stands on: sample the plateau's
 * own coordinates and compare `terrainHeight` there against the rim's height.
 * Agreement means solid; a big gap means the ribbon is scenery and a car would
 * fall through it.
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8901';
const IDS = (process.env.IDS ?? '4,7,10,18,27,44').split(',').map(Number);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 400, height: 240 } });
p.setDefaultTimeout(600000);
console.log('  world                 rim y over road   ground there   gap   verdict');
for (const id of IDS) {
  await p.goto(`${BASE}/?level=${id}&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
  await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 600000 });
  const r = await p.evaluate(() => {
    const g = window.__game, t = g.track, N = t.center.length;
    if (!t.T.cliffWalls || !t._cliffRimTop) return null;
    let n = 0, sumGap = 0, solid = 0, worst = 0;
    for (let j = 0; j < N; j += 7) {
      for (const side of [1, -1]) {
        const R = t._cliffRimTop(j, side);
        const c = t.center[j], nn = t.nrm[j];
        const lat = (R.latIn + R.latOut) / 2;
        const x = c.x + nn.x * lat * side, z = c.z + nn.z * lat * side;
        const rimY = c.y + R.yTop;
        const gy = t.terrainHeight(x, z);
        const gap = rimY - gy;                 // + = rim floats above ground
        sumGap += gap; n++;
        if (Math.abs(gap) < 1.5) solid++;      // the ground IS the rim here
        if (Math.abs(gap) > Math.abs(worst)) worst = gap;
      }
    }
    return { name: g.level?.name, n, mean: +(sumGap / n).toFixed(1),
      solidPct: +(100 * solid / n).toFixed(1), worst: +worst.toFixed(1) };
  });
  if (!r) continue;
  const verdict = r.solidPct > 50 ? 'RIM IS GROUND — drivable'
    : r.solidPct > 5 ? 'partly' : 'scenery only';
  console.log(`  L${String(id).padStart(2)} ${String(r.name).padEnd(20)} `
    + `${String(r.mean).padStart(8)} u        ${String(r.solidPct).padStart(6)}%  ${String(r.worst).padStart(7)}  ${verdict}`);
}
await b.close();
