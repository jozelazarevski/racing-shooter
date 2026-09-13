import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 400, height: 300 } });
await p.goto('http://localhost:8901/?level=66&go=1&unlockall=1', { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track;
  return {
    gorges: (t._jumpGorges ?? []).map(G => G.i),
    overpasses: (t._overpasses ?? []).map(o => ({ up: o.up, down: o.down })),
    bridges: t._stoneBridges?.length ?? 'n/a',
    theme: g.level?.theme,
  };
});
console.log(JSON.stringify(r));
await browser.close();
