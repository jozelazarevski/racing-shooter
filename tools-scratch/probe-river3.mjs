import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
await p.goto(`${BASE}/?level=31&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track, R = t._river;
  const N = 400, pts = [];
  for (let i = 0; i <= N; i++) pts.push(R.curve.getPointAt(i / N));
  const L = R.halfAt.length;
  const out = [];
  for (let i = 1; i < N; i++) {
    const a = pts[i - 1], c = pts[i], d = pts[i + 1];
    const ab = Math.hypot(c.x - a.x, c.z - a.z), bc = Math.hypot(d.x - c.x, d.z - c.z);
    const ac = Math.hypot(d.x - a.x, d.z - a.z);
    const area = Math.abs((c.x - a.x) * (d.z - a.z) - (d.x - a.x) * (c.z - a.z)) / 2;
    const rad = area < 1e-6 ? Infinity : (ab * bc * ac) / (4 * area);
    const k = Math.round((i / N) * (L - 1));
    const need = R.halfAt[k] + R.bank;
    if (rad < need - 0.05) {
      // re-derive what the builder clamp saw at THIS station
      const tpar = k / (L - 1), EPS = 1 / 400;
      const a2 = R.curve.getPointAt(Math.max(0, tpar - EPS));
      const c2 = R.curve.getPointAt(tpar);
      const e2 = R.curve.getPointAt(Math.min(1, tpar + EPS));
      const ab2 = Math.hypot(c2.x - a2.x, c2.z - a2.z), bc2 = Math.hypot(e2.x - c2.x, e2.z - c2.z);
      const ac2 = Math.hypot(e2.x - a2.x, e2.z - a2.z);
      const ar2 = Math.abs((c2.x - a2.x) * (e2.z - a2.z) - (e2.x - a2.x) * (c2.z - a2.z)) / 2;
      const rad2 = ar2 < 1e-6 ? Infinity : (ab2 * bc2 * ac2) / (4 * ar2);
      out.push({ i, k, rad: +rad.toFixed(1), half: +R.halfAt[k].toFixed(2),
        radAtStation: +rad2.toFixed(1), ab: +ab.toFixed(2), bc: +bc.toFixed(2) });
    }
  }
  return out;
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
