import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 400, height: 300 } });
await p.goto('http://localhost:8901/?level=29&go=1&unlockall=1', { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track, C = t.T.coast;
  if (!C) return { err: 'no coast' };
  // distance from each sample to the coastline segment
  const ax = C.a[0], az = C.a[1], bx = C.b[0], bz = C.b[1];
  const abx = bx - ax, abz = bz - az, L2 = abx * abx + abz * abz;
  let best = 0, bd = 1e9;
  for (let i = 0; i < t.center.length; i += 5) {
    const c = t.center[i];
    const tt = Math.max(0, Math.min(1, ((c.x - ax) * abx + (c.z - az) * abz) / L2));
    const d = Math.hypot(c.x - (ax + abx * tt), c.z - (az + abz * tt));
    if (d < bd) { bd = d; best = i; }
  }
  return { best, bd: +bd.toFixed(0), coast: C, y: +t.center[best].y.toFixed(0) };
});
console.log(JSON.stringify(r));
await browser.close();
