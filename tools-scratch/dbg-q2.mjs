import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 320, height: 200 } });
await p.goto('http://localhost:8901/?level=66&go=1&unlockall=1', { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const t = window.__game.track;
  const out = [];
  for (const i of [293, 296, 298, 301]) {
    const c = t.center[i], n = t.nrm[i];
    out.push({ i,
      gorge: t._gorgeCut ? +t._gorgeCut(c.x + n.x * 20 * -1, c.z + n.z * 20 * -1).toFixed(1) : null,
      water: t.waterAt ? +t.waterAt(c.x - n.x * 20, c.z - n.z * 20).toFixed(2) : null,
      hM: +t.terrainHeight(c.x - n.x * 20, c.z - n.z * 20).toFixed(1),
      hO: +t.terrainHeight(c.x + n.x * 20, c.z + n.z * 20).toFixed(1),
      roadY: +c.y.toFixed(1) });
  }
  return { gorges: (t._jumpGorges ?? []).length, hero: !!t._gorge, out };
});
console.log(JSON.stringify(r));
await browser.close();
