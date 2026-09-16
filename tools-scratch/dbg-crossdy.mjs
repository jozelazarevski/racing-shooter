import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 400, height: 300 } });
p.setDefaultTimeout(300000);
for (const lvl of (process.env.LEVELS ?? '6').split(',').map(Number)) {
  await p.goto(`${BASE}/?level=${lvl}&go=1&unlockall=1`, { waitUntil: 'load' });
  await p.waitForFunction(() => window.__game?.track?.center && window.__game.player);
  const r = await p.evaluate(() => {
    const g = window.__game, t = g.track;
    const xs = (t._overpasses ?? []).map((o) => ({
      dy: +Math.abs(t.center[o.ia].y - t.center[o.ib].y).toFixed(1) }));
    return { name: g.level?.name, theme: g.level?.theme, crossings: xs };
  });
  console.log(JSON.stringify(r));
}
await browser.close();
