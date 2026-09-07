import { chromium } from 'playwright-core';
const LEVELS = (process.env.LEVELS ?? '29,61').split(',').map(Number);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
for (const lvl of LEVELS) {
  const p = await browser.newPage({ viewport: { width: 400, height: 300 } });
  await p.goto(`http://localhost:8901/?level=${lvl}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
  await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
  const r = await p.evaluate(() => {
    const g = window.__game, t = g.track;
    let live = 0, culled = 0, buried = 0;
    for (const tr of t.trees ?? []) {
      if (tr.culled) { culled++; continue; }
      live++;
      if (t.terrainHeight(tr.x, tr.z) - tr.y > 1.5) buried++;
    }
    return { name: g.level?.name, live, culled, buried, conf: t._treesConformed };
  });
  console.log(JSON.stringify(r));
  await p.close();
}
await browser.close();
