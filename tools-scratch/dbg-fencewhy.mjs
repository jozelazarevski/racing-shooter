/* Why does _buildGuardFence place 0 bays? Per-station stats. */
import { chromium } from 'playwright-core';
const LVL = Number(process.env.LVL ?? 21);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 320, height: 200 } });
await p.goto(`http://localhost:8901/?level=${LVL}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const t = window.__game.track, N = t.center.length;
  let sharp = 0, dropAny = 0, dropSharp = 0, maxCurv = 0, maxDrop = 0;
  const S = t.T.guardFence;
  for (let i = 0; i < N; i++) {
    const c = t.center[i], n = t.nrm[i];
    if (t.curvature[i] > maxCurv) maxCurv = t.curvature[i];
    const isSharp = t.curvature[i] > 0.045;
    if (isSharp) sharp++;
    const lat = Math.max(S.lateral, t.widthAt(i) + 1.8);
    let drop = 0;
    for (const sd of [1, -1]) {
      const d = c.y - t.terrainHeight(c.x + n.x * lat * sd, c.z + n.z * lat * sd);
      if (d > drop) drop = d;
    }
    if (drop > maxDrop) maxDrop = drop;
    if (drop >= 1.4) { dropAny++; if (isSharp) dropSharp++; }
  }
  return { world: window.__game.level?.name, hasFence: !!S, sharp,
    maxCurv: +maxCurv.toFixed(4), dropAny, dropSharp, maxDrop: +maxDrop.toFixed(1),
    fences: t.banners.filter((b) => b.kind === 'fence').length };
});
console.log(JSON.stringify(r));
await browser.close();
