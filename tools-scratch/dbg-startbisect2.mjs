import { chromium } from 'playwright-core';
const LVL = Number(process.env.LVL ?? 16);
const OUT = process.env.OUT ?? '/tmp/bis2';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 390, height: 780 } });
p.setDefaultTimeout(240000);
await p.goto(`http://localhost:8901/?level=${LVL}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 240000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 240000 });
await p.evaluate(() => {
  const g = window.__game;
  g.clock.getDelta = () => 1 / 60;
  for (let k = 0; k < 60; k++) g.frame();
});
for (const tag of ['terrain-near', 'road', 'road-skirt', 'UNNAMED', 'Points']) {
  const n = await p.evaluate((h) => {
    const g = window.__game; let hid = 0;
    g.scene.traverse((o) => { if (o.__bis) { o.visible = true; o.__bis = false; } });
    g.scene.traverse((o) => {
      if (!(o.isMesh || o.isPoints) || o.visible === false) return;
      const nm = o.name || '';
      const match = h === 'UNNAMED' ? (nm === '' && o.isMesh) : nm === h;
      if (match) { o.visible = false; o.__bis = true; hid++; }
    });
    for (let k = 0; k < 3; k++) g.frame();
    return hid;
  }, tag);
  await p.screenshot({ path: `${OUT}-${tag}.png`, timeout: 120000 });
  console.log(tag, 'hid', n);
}
await browser.close();
