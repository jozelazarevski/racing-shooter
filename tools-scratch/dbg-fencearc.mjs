/* W-CURVE-01.4 probe (r397): on a guardFence world, walk every sharp station
 * (curvature > 0.045) whose OUTER side faces a drop >= 1.4 and measure the
 * distance to the nearest fence bay. Reports per-arc max gap (goal ~<= 8u
 * outside cross-leg skips), bay counts in/out of sharp zones, and the MAX cap
 * headroom. */
import { chromium } from 'playwright-core';
const LVL = Number(process.env.LVL ?? 66);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 320, height: 200 } });
await p.goto(`http://localhost:8901/?level=${LVL}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const t = window.__game.track, N = t.center.length;
  const fences = t.banners.filter((b) => b.kind === 'fence');
  const segLen = t.segLen ?? (t.totalLen ? t.totalLen / N : 0);
  // per-station: sharp? outer drop? nearest fence bay distance
  const arcs = []; let cur = null;
  let sharpOuterDrop = 0, sharpCovered = 0;
  for (let i = 0; i < N; i++) {
    const sharp = t.curvature[i] > 0.045;
    if (!sharp) { if (cur) { arcs.push(cur); cur = null; } continue; }
    const c = t.center[i], n = t.nrm[i];
    const inner = Math.sign(
      (t.center[(i + 6) % N].x - c.x) * n.x + (t.center[(i + 6) % N].z - c.z) * n.z) || 1;
    const outer = -inner;
    // drop on the outer side? (same lat law as the builder)
    const lat = Math.max(t.T.guardFence?.lateral ?? 10, t.widthAt(i) + 1.8);
    const gx = c.x + n.x * lat * outer, gz = c.z + n.z * lat * outer;
    const drop = c.y - t.terrainHeight(gx, gz);
    if (drop < 1.4) { if (cur) { arcs.push(cur); cur = null; } continue; }
    sharpOuterDrop++;
    // nearest bay on the outer side of THIS station
    let best = 1e9;
    for (const f of fences) {
      const d = Math.hypot(f.x - (c.x + n.x * lat * outer), f.z - (c.z + n.z * lat * outer));
      if (d < best) best = d;
    }
    if (best < 6) sharpCovered++;
    if (!cur) cur = { i0: i, i1: i, maxGap: best, gate: t._circDist(i, 0) < 30, gorge: !!t._nearGorge?.(i, 42) };
    else { cur.i1 = i; if (best > cur.maxGap) cur.maxGap = best; cur.gorge = cur.gorge || !!t._nearGorge?.(i, 42); }
  }
  if (cur) arcs.push(cur);
  return { world: window.__game.level?.name, N, segLen: +segLen.toFixed(2),
    fenceBays: fences.length, max: t.T.guardFence?.max ?? null,
    sharpOuterDrop, sharpCovered,
    arcs: arcs.map((a) => ({ ...a, maxGap: +a.maxGap.toFixed(1), len: a.i1 - a.i0 + 1 })) };
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
