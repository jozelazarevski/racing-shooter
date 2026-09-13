import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 320, height: 200 } });
p.setDefaultTimeout(240000);
await p.goto('http://localhost:8901/?level=29&go=1&unlockall=1', { waitUntil: 'load', timeout: 240000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 240000 });
const r = await p.evaluate(() => {
  const t = window.__game.track, i = 55;
  const c = t.center[i], n = t.nrm[i];
  const gy = (x, z) => (t._drawnGroundY ? t._drawnGroundY(x, z) : null) ?? t.terrainHeight(x, z);
  const rows = [];
  for (let d = 0; d <= 220; d += 20) {
    const x = c.x + n.x * d, z = c.z + n.z * d;
    rows.push({ d, sd: +t._coastSide(x, z).toFixed(0),
      drawn: +gy(x, z).toFixed(1), analytic: +t.terrainHeight(x, z).toFixed(1),
      hill: +t._hillNoise(x, z).toFixed(1),
      depressed: +t._coastDepress(x, z, t._hillNoise(x, z), 9999).toFixed(1) });
  }
  return { world: window.__game.level?.name, roadY: +c.y.toFixed(1), rows };
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
