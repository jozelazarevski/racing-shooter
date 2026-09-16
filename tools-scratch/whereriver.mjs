/* WHERE IS THE RIVER on a level — ford stations, reach extent, and whether a
 * river-water mesh exists at all. One page load, prints and exits. */
import { chromium } from 'playwright-core';
const PORT = process.env.PORT ?? 8901;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 320, height: 480 } });
p.setDefaultTimeout(600000);
await p.goto(`http://localhost:${PORT}/?level=${process.env.LEVEL ?? 43}&go=1&unlockall=1`,
  { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
console.log(JSON.stringify(await p.evaluate(() => {
  const t = window.__game.track;
  let water = null, bank = null;
  t.group.traverse((o) => { if (o.name === 'river-water') water = o;
    if (o.name === 'river-bank') bank = o; });
  return { N: t.N, fords: (t.fords ?? []).map((f) => ({ i: f.i, half: f.half })),
    hasWater: !!water, hasBank: !!bank,
    waterVerts: water?.geometry?.attributes?.position?.count ?? 0 };
})));
await b.close();
