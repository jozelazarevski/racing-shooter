/* Replicate the _buildGuardFence loop with per-reason skip counts, plus
 * circumcircle radius (±6, the HRD-2 metric) sharpness census. */
import { chromium } from 'playwright-core';
const LVL = Number(process.env.LVL ?? 66);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 320, height: 200 } });
await p.goto(`http://localhost:8901/?level=${LVL}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const t = window.__game.track, N = t.center.length;
  const S = t.T.guardFence;
  const segLen = t.totalLen ? t.totalLen / N : 6;
  const radAt = (i) => {
    const a = t.center[(i - 6 + N) % N], b = t.center[i], c = t.center[(i + 6) % N];
    const ab = Math.hypot(b.x - a.x, b.z - a.z), bc = Math.hypot(c.x - b.x, c.z - b.z),
      ca = Math.hypot(a.x - c.x, a.z - c.z);
    const cross = Math.abs((b.x - a.x) * (c.z - a.z) - (b.z - a.z) * (c.x - a.x));
    return cross < 1e-6 ? 1e9 : (ab * bc * ca) / (2 * cross);
  };
  const step = Math.max(2, Math.round(5.6 / segLen));
  const skip = { gate: 0, gorge: 0, noDrop: 0, crossLeg: 0, placed: 0 };
  let sharpR = 0, sharpDropOuter = 0;
  for (let i = 0; i < N; i += step) {
    if (t._circDist(i, 0) < 30) { skip.gate++; continue; }
    if (t._nearGorge(i, 42)) { skip.gorge++; continue; }
    const c = t.center[i], n = t.nrm[i];
    const lat9 = Math.max(S.lateral, t.widthAt(i) + 1.8);
    let drop = 0, side = 0;
    for (const sd of [1, -1]) {
      const d = c.y - t.terrainHeight(c.x + n.x * lat9 * sd, c.z + n.z * lat9 * sd);
      if (d > drop) { drop = d; side = sd; }
    }
    if (!side || drop < 1.4) { skip.noDrop++; continue; }
    const hd9 = t.headingAt(i);
    let bad9 = false;
    for (const [ax, az] of [[Math.sin(hd9), Math.cos(hd9)], [Math.cos(hd9), -Math.sin(hd9)]]) {
      for (const e9 of [-2.7, 0, 2.7]) {
        const p2 = { x: c.x + n.x * lat9 * side, z: c.z + n.z * lat9 * side };
        const s9 = t._nearestSample(p2.x + ax * e9, p2.z + az * e9);
        if (s9.d < t.widthAt(s9.i) + 0.3) { bad9 = true; break; }
      }
      if (bad9) break;
    }
    if (bad9) { skip.crossLeg++; continue; }
    skip.placed++;
  }
  for (let i = 0; i < N; i++) {
    const R = radAt(i);
    if (R > 30) continue;
    sharpR++;
    const c = t.center[i], n = t.nrm[i];
    const inner = Math.sign((t.center[(i + 6) % N].x - c.x) * n.x
      + (t.center[(i + 6) % N].z - c.z) * n.z) || 1;
    const lat9 = Math.max(S.lateral, t.widthAt(i) + 1.8);
    const d = c.y - t.terrainHeight(c.x - n.x * lat9 * inner, c.z - n.z * lat9 * inner);
    if (d >= 1.4) sharpDropOuter++;
  }
  return { world: window.__game.level?.name, segLen: +segLen.toFixed(2), step,
    ...skip, sharpR30: sharpR, sharpDropOuter };
});
console.log(JSON.stringify(r));
await browser.close();
