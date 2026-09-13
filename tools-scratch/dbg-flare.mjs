import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
for (const lvl of (process.env.LVLS ?? '66,59,74').split(',')) {
  const p = await browser.newPage({ viewport: { width: 320, height: 200 } });
  await p.goto(`http://localhost:8901/?level=${lvl}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
  await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 300000 });
  const r = await p.evaluate(() => {
    const t = window.__game.track, N = t.center.length;
    const rad = (i) => {
      const a = t.center[(i - 6 + N) % N], b = t.center[i % N], c = t.center[(i + 6) % N];
      const abx = b.x - a.x, abz = b.z - a.z, bcx = c.x - b.x, bcz = c.z - b.z;
      const cross = abx * bcz - abz * bcx;
      if (Math.abs(cross) < 1e-6) return 1e9;
      const ab = Math.hypot(abx, abz), bc = Math.hypot(bcx, bcz), ac = Math.hypot(c.x - a.x, c.z - a.z);
      return (ab * bc * ac) / (2 * Math.abs(cross));
    };
    const ws = []; for (let i = 0; i < N; i++) ws.push(t.widthAt(i));
    const wBase = [...ws].sort((a, b) => a - b)[Math.floor(N * 0.5)];
    let wMax = 0, hairN = 0, flareBad = 0; const badAt = [];
    for (let i = 0; i < N; i++) {
      wMax = Math.max(wMax, ws[i]);
      if (rad(i) < 25) {
        hairN++;
        if (ws[i] < wBase * 1.19) { flareBad++; if (badAt.length < 6) badAt.push({ i, R: +rad(i).toFixed(1), w: +ws[i].toFixed(2) }); }
      }
    }
    // arc-true curvature sanity: min radius the ARRAY now reports
    let minRarr = 1e9;
    for (let i = 0; i < N; i++) { const c = t.curvature[i]; if (c > 1e-6) minRarr = Math.min(minRarr, 1 / c); }
    return { world: window.__game.level?.name, wBase: +wBase.toFixed(2), wMax: +wMax.toFixed(2),
      hairN, flareBad, badAt, minRarr: +minRarr.toFixed(1) };
  });
  console.log(JSON.stringify(r));
  await p.close();
}
await browser.close();
