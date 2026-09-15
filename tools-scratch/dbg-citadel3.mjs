import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 480, height: 854 } });
await p.goto('http://localhost:8901/?level=58&go=1&unlockall=1', { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track, c = g.player;
  for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  for (let k = 0; k < 30; k++) g.frame();
  const cam = g.camera?.position ?? g.camPos;
  const near = t.camTreesNear ? t.camTreesNear(cam.x, cam.z).map(tr => ({
    d: +Math.hypot(tr.x - cam.x, tr.z - cam.z).toFixed(1),
    r: +(+tr.r).toFixed(1), top: +(+tr.top).toFixed(1) })) : 'none';
  // also stats over the whole registry
  const reg = t.camTrees ?? [];
  let maxTop = -1e9, n = reg.length, bad = 0;
  for (const tr of reg) {
    if (tr.top > maxTop) maxTop = tr.top;
    const ty = t.terrainHeight(tr.x, tr.z);
    if (tr.top > ty + 40) bad++;
  }
  return { near, regN: n, maxTop: +maxTop.toFixed(1), topsOver40AboveGround: bad };
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
