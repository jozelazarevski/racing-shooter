/* WHY a world got no square: run the same gates `_buildPiazzas` runs, and
 * count which one refuses each station. "It built none" is not a diagnosis. */
import { chromium } from 'playwright-core';
const LV = process.env.LV ?? '30';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await (await b.newContext({ viewport:{width:900,height:520} })).newPage();
p.setDefaultTimeout(600000);
await p.goto(`http://localhost:8901/?level=${LV}&go=1&unlockall=1`, { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
console.log(JSON.stringify(await p.evaluate(() => {
  const t = window.__game.track, T = t.T, P = T.piazza, F = T.frontage || {};
  if (!P) return { piazza: null };
  const D = P.depth ?? 16, W = P.width ?? 22;
  const lat0 = (F.lateral ?? 15.5) + D * 0.22;
  const V3 = window.__game.camera.position.constructor;
  const v = new V3(), up = new V3(0, 1, 0);
  const why = { grid: 0, curve: 0, water: 0, road: 0, seat: 0, fall: 0, ok: 0 };
  let worstFall = 0;
  for (let i = 0; i < t.N; i += 3) {
    if (t._circDist(i, 0) < 60) { why.grid++; continue; }
    if (t.curvature[i] > 0.02) { why.curve++; continue; }
    let any = false;
    for (const side of [1, -1]) {
      const c = t.pointAt(i, lat0 * side), yaw = t.headingAt(i);
      let ok = true, lo = Infinity, hi = -Infinity, fail = null;
      for (const ax of [-D / 2, 0, D / 2]) {
        for (const az of [-W / 2, 0, W / 2]) {
          v.set(ax, 0, az).applyAxisAngle(up, yaw);
          const x = c.x + v.x, z = c.z + v.z;
          if (t._inWater(x, z)) { ok = false; fail = 'water'; break; }
          if (!t._clearsRoad(x, z, 0.4, 0.8)) { ok = false; fail = 'road'; break; }
          const y = t._seatY(x, z);
          if (!Number.isFinite(y)) { ok = false; fail = 'seat'; break; }
          lo = Math.min(lo, y); hi = Math.max(hi, y);
        }
        if (!ok) break;
      }
      if (ok && hi - lo > 1.7) { ok = false; fail = 'fall'; worstFall = Math.max(worstFall, hi - lo); }
      if (ok) { any = true; break; }
      why[fail]++;
    }
    if (any) why.ok++;
  }
  return { lat0: +lat0.toFixed(1), halfWidth: +(t.widthAt ? t.widthAt(100) : 0).toFixed(1),
    worstFall: +worstFall.toFixed(1), why, squaresBuilt: (t._piazzas ?? []).length };
}), null, 0));
await b.close();
