import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 480, height: 854 } });
await p.goto('http://localhost:8901/?level=66&go=1&unlockall=1', { waitUntil: 'load' });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player);
await p.evaluate(() => {
  const g = window.__game;
  const di = g.constructor.CAM_MODES.findIndex(m => m.driver);
  g.camMode = di;
});
await p.waitForTimeout(4000);
await p.screenshot({ path: '/tmp/f4-drv-car.png' });
await p.evaluate(() => { window.__game.player.mesh.visible = false; });
await p.waitForTimeout(300);
await p.screenshot({ path: '/tmp/f4-drv-nocar.png' });
// also: what fraction of the canvas do the two frames differ on?
console.log('saved both');
await browser.close();
