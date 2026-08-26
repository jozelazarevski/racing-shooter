import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 640, height: 400 } });
p.setDefaultTimeout(300000);
await p.goto(`${BASE}/?level=21&go=1&unlockall=1`, { waitUntil:'load', timeout:120000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout:120000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track;
  // rebuild the test's bank-finder and look at what it found
  let best = null;
  const tops = [];
  for (let i = 60; i < t.center.length - 60; i += 11) {
    const pt = t.pointAt(i, 30);
    const rise = t.terrainHeight(pt.x, pt.z) - (t.center[i]?.y ?? 0);
    tops.push({ i, rise: +rise.toFixed(1) });
    if (!best || rise > best.rise) best = { i, rise: +rise.toFixed(1), x: pt.x, z: pt.z };
  }
  tops.sort((a, z) => z.rise - a.rise);
  // what stands within 25 u of the chosen spot?
  const near = [];
  for (const ob of t.obstacles ?? []) {
    const d = Math.hypot(ob.x - best.x, ob.z - best.z);
    if (d < 30) near.push({ what: 'obstacle', d: +d.toFixed(1), r: +(ob.r ?? 0).toFixed(1), mat: ob.mat ?? '?' });
  }
  for (const s of t.solids ?? []) {
    const d = Math.hypot(s.x - best.x, s.z - best.z);
    if (d < 30) near.push({ what: 'solid', d: +d.toFixed(1), r: +(s.r ?? 0).toFixed(1), mat: s.mat ?? '?', y: s.y });
  }
  // terrain slice across the cut at the chosen sample: lat 0..60
  const slice = [];
  for (let L = 0; L <= 60; L += 6) {
    const q = t.pointAt(best.i, L);
    slice.push({ L, h: +(t.terrainHeight(q.x, q.z) - t.center[best.i].y).toFixed(1) });
  }
  return { best, top5: tops.slice(0, 5), near, slice };
});
console.log(JSON.stringify(r, null, 1));
await b.close();
