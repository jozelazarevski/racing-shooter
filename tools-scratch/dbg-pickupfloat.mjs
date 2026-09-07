/* FIX-3 / §7.12: every pickup within 0.5 u of surface height. */
import { chromium } from 'playwright-core';
const LEVELS = (process.env.LEVELS ?? '61,29,56,58').split(',').map(Number);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
for (const lvl of LEVELS) {
  const p = await browser.newPage({ viewport: { width: 400, height: 300 } });
  await p.goto(`http://localhost:8901/?level=${lvl}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
  await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
  const r = await p.evaluate(() => {
    const g = window.__game, t = g.track;
    const bad = [];
    for (const pk of g.pickups ?? []) {
      const px = pk.pos?.x ?? pk.x, py = pk.pos?.y ?? pk.y, pz = pk.pos?.z ?? pk.z;
      if (px == null) continue;
      const gnd = Math.max(t.terrainHeight(px, pz), t.groundHeightAt
        ? -1e9 : -1e9);
      const road = t._nearestSample ? t._nearestSample(px, pz) : null;
      const roadY = road && road.d < t.widthAt(road.i) ? t.center[road.i].y : -1e9;
      const ref = Math.max(gnd, roadY);
      const dh = py - ref;
      if (dh > 1.6 || dh < -0.5) bad.push({ type: pk.type, dh: +dh.toFixed(1),
        x: Math.round(px), z: Math.round(pz) });
    }
    return { name: g.level?.name, n: (g.pickups ?? []).length, bad: bad.slice(0, 8), nBad: bad.length };
  });
  console.log(JSON.stringify(r));
  await p.close();
}
await browser.close();
