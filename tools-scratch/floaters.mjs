/* Which solids are floating, how far, and whether they belong to a square. */
import { chromium } from 'playwright-core';
const LV = process.env.LV ?? '77';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await (await b.newContext({ viewport:{width:900,height:520} })).newPage();
p.setDefaultTimeout(600000);
await p.goto(`http://localhost:8901/?level=${LV}&go=1&unlockall=1`, { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
console.log(JSON.stringify(await p.evaluate(() => {
  const t = window.__game.track, out = [];
  for (const s of t.solids ?? []) {
    if (s.y == null || !Number.isFinite(s.y) || s.mat === 'traffic') continue;
    if ((t._gorgeCut?.(s.x, s.z) ?? 0) > 1) continue;
    const g = t.terrainHeight(s.x, s.z);
    if (!Number.isFinite(g)) continue;
    const air = s.y - g;
    if (air > 2.5) {
      let near = Infinity;
      for (const pz of t._piazzas ?? []) near = Math.min(near, Math.hypot(s.x - pz.x, s.z - pz.z));
      out.push({ mat: s.mat, r: s.r, air: +air.toFixed(1),
        distToNearestSquare: Number.isFinite(near) ? +near.toFixed(1) : null,
        inSquareRect: t._inPiazza(s.x, s.z, 0) });
    }
  }
  return { squares: (t._piazzas ?? []).length, floaters: out };
}), null, 1));
await b.close();
