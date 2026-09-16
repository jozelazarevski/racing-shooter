import { chromium } from 'playwright-core';
const LVL = Number(process.env.LVL ?? 16);
const OUT = process.env.OUT ?? '/tmp/bisect';
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
const passes = [
  ['all', null],
  ['noshadows', 'contact-shadows'],
  ['nocarpet', 'carpet-foliage'],
  ['nosnowfx', 'SNOWFX'],       // weather particles: match by name fragment below
];
for (const [tag, hide] of passes) {
  const names = await p.evaluate((h) => {
    const g = window.__game; const hid = [];
    g.scene.traverse((o) => {
      if (o.__bis) { o.visible = true; o.__bis = false; }
    });
    if (h) {
      g.scene.traverse((o) => {
        const nm = (o.name || '').toLowerCase();
        if (h === 'SNOWFX' ? (o.isPoints || nm.includes('snow') || nm.includes('weather') || nm.includes('rain'))
          : nm === h) { if (o.visible) { o.visible = false; o.__bis = true; hid.push(o.name || o.type); } }
      });
    }
    for (let k = 0; k < 3; k++) g.frame();
    return hid.slice(0, 6);
  }, hide);
  await p.screenshot({ path: `${OUT}-${tag}.png`, timeout: 120000 });
  console.log(tag, 'hid:', JSON.stringify(names));
}
await browser.close();
