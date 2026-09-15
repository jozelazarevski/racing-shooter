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
  const halfAt = R.halfAt ?? null;
  const localHalf = (i) => halfAt ? halfAt[Math.round(i / N * (halfAt.length - 1))] : R.half;
  const rows = [];
  for (let i = 1; i < N; i++) {
    const a = pts[i - 1], c = pts[i], d = pts[i + 1];
    const ab = Math.hypot(c.x - a.x, c.z - a.z), bc = Math.hypot(d.x - c.x, d.z - c.z);
    const ac = Math.hypot(d.x - a.x, d.z - a.z);
    const area = Math.abs((c.x - a.x) * (d.z - a.z) - (d.x - a.x) * (c.z - a.z)) / 2;
    const rad = area < 1e-6 ? Infinity : (ab * bc * ac) / (4 * area);
    const needG = (halfAt ? Math.max(...halfAt) : R.half) + (R.bank ?? 0);
    const needL = localHalf(i) + (R.bank ?? 0);
    if (rad < needG) rows.push({ i, rad: +rad.toFixed(1), localHalf: +localHalf(i).toFixed(1),
      needLocal: +needL.toFixed(1), foldLocal: rad < needL });
  }
  return { widest: halfAt ? Math.max(...halfAt) : R.half, bank: R.bank, rows };
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
