import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const LEVEL = process.env.LEVEL ?? 1;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 400, height: 300 } });
await p.goto(`${BASE}/?level=${LEVEL}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track, N = t.center.length;
  const BINS = 18, bins = new Array(BINS).fill(0), binsNear = new Array(BINS).fill(0);
  for (const tr of t.trees) {
    const i = t.nearestIndex({ x: tr.x, y: 0, z: tr.z });
    const d = t._distToTrack(tr.x, tr.z);
    if (d < 30) bins[(i / N * BINS) | 0]++;
    if (d < 16) binsNear[(i / N * BINS) | 0]++;
  }
  return { total: t.trees.length, N, per100_30u: bins, per100_16u: binsNear };
});
console.log(JSON.stringify(r));
await browser.close();
