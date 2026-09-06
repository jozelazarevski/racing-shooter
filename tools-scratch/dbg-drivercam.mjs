import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 480, height: 854 } }); // portrait, like R10
await p.goto('http://localhost:8901/?level=66&go=1&unlockall=1', { waitUntil: 'load' });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player);
await p.evaluate(() => {
  const g = window.__game;
  const di = g.constructor.CAM_MODES.findIndex(m => m.driver);
  g.camMode = di;
  // drive forward a bit
  if (g.player.inputs) g.player.inputs.throttle = 1; else g.player.throttle = 1;
});
await p.waitForTimeout(12000);
await p.screenshot({ path: '/tmp/f4-driver.png' });
console.log('saved /tmp/f4-driver.png');
await browser.close();
