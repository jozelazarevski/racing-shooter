/* r397 verification: sharp stations (arc-scaled circumcircle <= 30) with an
 * outer-side drop >= 1.4 at the theme lateral must carry a fence bay within
 * 6u of the verge anchor. Also reports total bays and their min distance to
 * any carriageway (must clear widthAt + 0.3). */
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
  const KF = Math.max(3, Math.round(30 / t.segLen));
  const radF = (i) => {
    const a = t.center[(i - KF + N) % N], b = t.center[i], c = t.center[(i + KF) % N];
    const cross = (b.x - a.x) * (c.z - b.z) - (b.z - a.z) * (c.x - b.x);
    if (Math.abs(cross) < 1e-6) return 1e9;
    return (Math.hypot(b.x - a.x, b.z - a.z) * Math.hypot(c.x - b.x, c.z - b.z)
      * Math.hypot(c.x - a.x, c.z - a.z)) / (2 * Math.abs(cross));
  };
  const fences = t.banners.filter((b) => b.kind === 'fence');
  let sharpDrop = 0, covered = 0; const holes = [];
  let minClear = 1e9;
  for (const f of fences) {
    const s = t._nearestSample(f.x, f.z);
    minClear = Math.min(minClear, +(s.d - t.widthAt(s.i)).toFixed(2));
  }
  for (let i = 0; i < N; i++) {
    if (radF(i) > 30) continue;
    if (t._circDist(i, 0) < 30 || t._nearGorge(i, 42)) continue;
    const c = t.center[i], n = t.nrm[i];
    const inner = Math.sign((t.center[(i + KF) % N].x - c.x) * n.x
      + (t.center[(i + KF) % N].z - c.z) * n.z) || 1;
    const dl = Math.max(S.lateral, t.widthAt(i) + 1.8);
    const pp = t.pointAt(i, dl * -inner);
    if (pp.y - t._terrainMeshHeight(pp.x, pp.z) < 1.4) continue;
    sharpDrop++;
    const al = t.widthAt(i) + 0.9;
    const ax = c.x - n.x * al * inner, az = c.z - n.z * al * inner;
    let best = 1e9;
    for (const f of fences) best = Math.min(best, Math.hypot(f.x - ax, f.z - az));
    if (best < 6) covered++; else holes.push({ i, gap: +best.toFixed(1) });
  }
  return { world: window.__game.level?.name, KF, fences: fences.length,
    minClearBeyondWidth: minClear, sharpDrop, covered, holes: holes.slice(0, 10) };
});
console.log(JSON.stringify(r));
await browser.close();
