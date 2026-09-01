import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 480, height: 320 } });
await p.goto('http://localhost:8901/?level=4&go=1&unlockall=1', { waitUntil: 'load', timeout: 180000 });
await p.waitForFunction(() => window.__game?.player && window.__game.track?.center, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track, N = t.center.length;
  for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  return g.route.gates.map((gt) => ({ id: gt.id, si: gt.si, kind: gt.kind,
    dy: +(t.center[gt.si].y - t.groundHeightAt(gt.si, 0)).toFixed(1),
    gy: +gt.y.toFixed(1) }));
});
console.log(JSON.stringify(r));
await browser.close();
