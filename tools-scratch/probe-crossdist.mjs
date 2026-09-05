/* Which RURAL stage has a junction near the grid? Print crossroad distances
 * from center[0] plus traffic spawn distances, per level. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
for (const lvl of (process.env.LVLS ?? '1,31,70,71,22').split(',')) {
  const p = await browser.newPage({ viewport: { width: 480, height: 320 } });
  try {
    await p.goto(`${BASE}/?level=${lvl}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 120000 });
    await p.waitForFunction(() => window.__game?.track?.center && window.__game.__traffic,
      undefined, { timeout: 180000 });
    const r = await p.evaluate(() => {
      const g = window.__game, t = g.track, c0 = t.center[0];
      const crs = (t.crossroads ?? []).map((c) => +Math.hypot(c.x - c0.x, c.z - c0.z).toFixed(0));
      const ents = (g.__traffic?.ents ?? []).map((e) => ({
        kind: e.kind ?? (e.cross ? 'cross' : 'road'), cross: !!e.cross,
        d: +Math.hypot(e.x - c0.x, e.z - c0.z).toFixed(0) }));
      return { name: g.level?.name, crs, ents };
    });
    console.log(lvl, JSON.stringify(r));
  } catch (e) { console.log(lvl, 'ERR', String(e).slice(0, 80)); }
  await p.close();
}
await browser.close();
