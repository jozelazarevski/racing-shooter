import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
for (const lvl of (process.env.LVLS ?? '66,59,74,4').split(',')) {
  const p = await browser.newPage({ viewport: { width: 320, height: 200 } });
  await p.goto(`http://localhost:8901/?level=${lvl}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
  await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 300000 });
  const r = await p.evaluate(() => {
    const t = window.__game.track, N = t.center.length;
    let wMin = 1e9, wStep = 0, at = -1;
    for (let i = 0; i < N; i++) {
      const a = t.widthAt(i), b = t.widthAt((i + 1) % N);
      wMin = Math.min(wMin, a);
      if (Math.abs(b - a) > wStep) { wStep = Math.abs(b - a); at = i; }
    }
    const rad = (i) => {
      const a = t.center[(i - 6 + N) % N], b = t.center[i % N], c = t.center[(i + 6) % N];
      const abx = b.x - a.x, abz = b.z - a.z, bcx = c.x - b.x, bcz = c.z - b.z;
      const cross = abx * bcz - abz * bcx;
      if (Math.abs(cross) < 1e-6) return 1e9;
      const ab = Math.hypot(abx, abz), bc = Math.hypot(bcx, bcz), ac = Math.hypot(c.x - a.x, c.z - a.z);
      return (ab * bc * ac) / (2 * Math.abs(cross));
    };
    let hair = 0, minR = 1e9;
    for (let i = 0; i < N; i++) { const R = rad(i); minR = Math.min(minR, R); if (R < 25) hair++; }
    return { world: window.__game.level?.name, wMin: +wMin.toFixed(2),
      wStep: +wStep.toFixed(3), at, minR: +minR.toFixed(1), hairpinStations: hair };
  });
  console.log(JSON.stringify(r));
  await p.close();
}
await browser.close();
