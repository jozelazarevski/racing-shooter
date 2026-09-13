/* Coast transect: at stations whose seaward side faces the water, sample the
 * drawn ground from the road out to the waterline and report the profile plus
 * its "bumpiness" (sum |d2h| over the band). A smooth ramp reads ~0. */
import { chromium } from 'playwright-core';
const LVL = Number(process.env.LVL ?? 29);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 320, height: 200 } });
p.setDefaultTimeout(240000);
await p.goto(`http://localhost:8901/?level=${LVL}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 240000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 240000 });
const r = await p.evaluate(() => {
  const t = window.__game.track, N = t.center.length;
  const C = t.T.coast; if (!C) return { none: true };
  const gy = (x, z) => (t._drawnGroundY ? t._drawnGroundY(x, z) : null) ?? t.terrainHeight(x, z);
  const rows = []; let bumpSum = 0, nT = 0;
  for (let i = 0; i < N; i += 45) {
    const c = t.center[i], n = t.nrm[i];
    // seaward side = deeper coast depression 60u out
    const dp = (sd) => t._coastDepress(c.x + n.x * 60 * sd, c.z + n.z * 60 * sd, 10, 9999);
    const sd = dp(1) < dp(-1) ? 1 : -1;
    const prof = [];
    for (let d = 20; d <= 240; d += 20) {
      prof.push(+gy(c.x + n.x * d * sd, c.z + n.z * d * sd).toFixed(1));
    }
    if (prof[prof.length - 1] > (C.level ?? -2) + 2) continue;   // not facing water
    let bump = 0;
    for (let k = 1; k < prof.length - 1; k++) bump += Math.abs(prof[k + 1] - 2 * prof[k] + prof[k - 1]);
    bumpSum += bump; nT++;
    if (rows.length < 6) rows.push({ i, sd, bump: +bump.toFixed(1), prof });
  }
  return { world: window.__game.level?.name, transects: nT,
    avgBump: nT ? +(bumpSum / nT).toFixed(1) : 0, rows };
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
