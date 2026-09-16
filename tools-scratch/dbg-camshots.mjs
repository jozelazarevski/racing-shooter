import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
for (const lvl of [53]) {
  const p = await browser.newPage({ viewport: { width: 480, height: 854 } });
  await p.goto(`http://localhost:8901/?level=${lvl}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
  await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
  await p.evaluate(() => {
    const g = window.__game;
    for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  });
  await p.waitForTimeout(2000);
  await p.screenshot({ path: `/tmp/shot-cam0-${lvl}.png` });
  await p.close();
}
console.log('done');
await browser.close();
