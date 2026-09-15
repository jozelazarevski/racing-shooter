/* Trace the exact builder decisions at GLACIER's sharp-drop stations. */
import { chromium } from 'playwright-core';
const LVL = Number(process.env.LVL ?? 66);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 320, height: 200 } });
await p.goto(`http://localhost:8901/?level=${LVL}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const t = window.__game.track, N = t.center.length;
  const S = t.T.guardFence, LAT = S.lateral;
  const KF = Math.max(3, Math.round(30 / t.segLen));
  const radF = (i) => {
    const a = t.center[(i - KF + N) % N], b = t.center[i], c = t.center[(i + KF) % N];
    const cross = (b.x - a.x) * (c.z - b.z) - (b.z - a.z) * (c.x - b.x);
    if (Math.abs(cross) < 1e-6) return 1e9;
    return (Math.hypot(b.x - a.x, b.z - a.z) * Math.hypot(c.x - b.x, c.z - b.z)
      * Math.hypot(c.x - a.x, c.z - a.z)) / (2 * Math.abs(cross));
  };
  const out = [];
  for (const i of [253, 255, 296, 297, 300, 517]) {
    const row = { i, R: +radF(i).toFixed(1) };
    row.sharp = radF(i) <= 30;
    row.gate = t._circDist(i, 0) < 30;
    row.gorge = !!t._nearGorge(i, 42);
    const c = t.center[i], n = t.nrm[i];
    const inner9 = Math.sign((t.center[(i + KF) % N].x - c.x) * n.x
      + (t.center[(i + KF) % N].z - c.z) * n.z) || 1;
    row.inner = inner9;
    const dropLat9 = Math.max(LAT, t.widthAt(i) + 1.8);
    for (const side of [1, -1]) {
      const p0 = t.pointAt(i, dropLat9 * side);
      const key = side === 1 ? 'p' : 'm';
      row['drop_' + key] = +(p0.y - t._terrainMeshHeight(p0.x, p0.z)).toFixed(2);
      const lat9 = t.widthAt(i) + 0.9;
      const pp = t.pointAt(i, lat9 * side);
      const s9 = t._nearestSample(pp.x, pp.z);
      row['margin_' + key] = +(s9.d - t.widthAt(s9.i)).toFixed(2);
    }
    out.push(row);
  }
  return { segLen: +t.segLen.toFixed(2), KF, out };
});
console.log(JSON.stringify(r));
await browser.close();
