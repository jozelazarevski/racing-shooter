import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 480, height: 854 } });
await p.goto('http://localhost:8901/?level=66&go=1&unlockall=1', { waitUntil: 'load' });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player);
await p.evaluate(() => {
  const g = window.__game;
  g.camMode = g.constructor.CAM_MODES.findIndex(m => m.driver);
});
await p.waitForTimeout(2500);
const clip = { x: 160, y: 530, width: 12, height: 12 };
const base = await p.screenshot({ clip });
const names = await p.evaluate(() => window.__game.scene.children.map((c, i) =>
  i + ':' + (c.name || c.type)));
console.log('scene children:', names.join(', '));
for (let i = 0; i < names.length; i++) {
  await p.evaluate((i) => { window.__game.scene.children[i].visible = false; }, i);
  await p.waitForTimeout(120);
  const shot = await p.screenshot({ clip });
  const diff = Buffer.compare(shot, base) !== 0;
  await p.evaluate((i) => { window.__game.scene.children[i].visible = true; }, i);
  if (diff) console.log('CHANGES BAND:', names[i]);
}
await browser.close();
