import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 400, height: 300 } });
await p.goto('http://localhost:8901/?level=66&go=1&unlockall=1', { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track;
  const out = { centers: [], surf: [] };
  for (let i = 250; i <= 266; i++) {
    const c = t.center[i];
    out.centers.push({ i, y: +c.y.toFixed(2),
      run: +Math.hypot(t.center[i + 1].x - c.x, t.center[i + 1].z - c.z).toFixed(2) });
  }
  // walk the centreline finely from 254 to 262, sampling the car's own query
  const pos = { x: 0, y: 0, z: 0 };
  for (let f = 0; f <= 80; f++) {
    const fi = 254 + f * 0.1;
    const i0 = Math.floor(fi), fr = fi - i0;
    const a = t.center[i0], b = t.center[i0 + 1];
    pos.x = a.x + (b.x - a.x) * fr; pos.z = a.z + (b.z - a.z) * fr;
    pos.y = a.y + (b.y - a.y) * fr;
    const gy = t.groundHeightAtPos
      ? t.groundHeightAtPos(pos, i0, 0)
      : t.groundHeightAt(i0, 0);
    if (f % 4 === 0 || Math.abs(gy - pos.y) > 0.5)
      out.surf.push({ fi: +fi.toFixed(1), centerY: +pos.y.toFixed(2), gy: +gy.toFixed(2) });
  }
  return out;
});
console.log(JSON.stringify(r));
await browser.close();
