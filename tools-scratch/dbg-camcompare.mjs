import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
for (const lvl of [2, 58]) {
  const p = await browser.newPage({ viewport: { width: 480, height: 854 } });
  await p.goto(`http://localhost:8901/?level=${lvl}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
  await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
  const r = await p.evaluate(() => {
    const g = window.__game, c = g.player;
    for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
    for (let k = 0; k < 90; k++) g.frame();
    const cam = g.camera?.position ?? g.camPos;
    return { lvl: g.level?.id, name: g.level?.name, camMode: g.camMode,
      dy: +(cam.y - c.pos.y).toFixed(1),
      d: +Math.hypot(cam.x - c.pos.x, cam.y - c.pos.y, cam.z - c.pos.z).toFixed(1) };
  });
  console.log(JSON.stringify(r));
  await p.close();
}
await browser.close();
