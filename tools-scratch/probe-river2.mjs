import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
await p.goto(`${BASE}/?level=31&go=1&unlockall=1&nocache=${Date.now()}`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track, R = t._river;
  const L = R.halfAt.length;
  // where is the tight bend in station space?
  const N = 400;
  const rows = [];
  for (let i = 190; i < 205; i++) {
    const tpar = i / N;
    const k = Math.round(tpar * (L - 1));
    const EPS = 1 / 400;
    const a = R.curve.getPointAt(Math.max(0, tpar - EPS));
    const c = R.curve.getPointAt(tpar);
    const e = R.curve.getPointAt(Math.min(1, tpar + EPS));
    const ab = Math.hypot(c.x - a.x, c.z - a.z), bc = Math.hypot(e.x - c.x, e.z - c.z);
    const ac = Math.hypot(e.x - a.x, e.z - a.z);
    const area = Math.abs((c.x - a.x) * (e.z - a.z) - (e.x - a.x) * (c.z - a.z)) / 2;
    const rad = area < 1e-6 ? Infinity : (ab * bc * ac) / (4 * area);
    rows.push({ i, k, rad: +rad.toFixed(1), half: +R.halfAt[k].toFixed(2) });
  }
  return { L, bank: R.bank, min: Math.min(...R.halfAt).toFixed(2), rows };
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
