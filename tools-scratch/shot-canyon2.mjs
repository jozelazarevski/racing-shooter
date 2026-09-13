import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 460, height: 780 } });
await p.goto('http://localhost:8901/?level=4&go=1&unlockall=1', { waitUntil: 'load', timeout: 120000 });
await p.waitForFunction(() => window.__game?.player && window.__game.track?.center, undefined, { timeout: 180000 });
const info = await p.evaluate(() => {
  const g = window.__game, t = g.track;
  for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  return { crs: (t.crossroads ?? []).map((c) => c.index) };
});
console.log('crossroads at', JSON.stringify(info.crs));
for (const idx of [275, 292, 320]) {
  await p.evaluate(async (i) => {
    const g = window.__game, pl = g.player;
    g.camMode = 0;
    pl.placeAt(i, 0, true); pl.health = 100; pl.alive = true;
    pl.vel.set(Math.sin(pl.heading) * 14, 0, Math.cos(pl.heading) * 14);
    for (let k = 0; k < 25; k++) g.frame();
  }, idx);
  await p.screenshot({ timeout: 120000, path: `/tmp/claude-0/-home-user-racing-shooter/0a1b4850-fdd3-5cf2-92f1-b12f6b9663b9/scratchpad/gorge-${idx}.png` });
}
await browser.close();
console.log('done');
