/* W-CURVE-01.4 roster census: on MOUNTAIN worlds without a guardFence theme,
 * count sharp stations (circumcircle R<=30, the HRD-2 metric) whose OUTER side
 * faces a drop >= 1.4 at the fence lateral AND has no existing protection
 * (barrier/solid/banner) within 6u of the anchor point. Fresh browser per
 * world; a crash logs and moves on. */
import { chromium } from 'playwright-core';
const LVLS = (process.env.LVLS ?? '3,5,6,7,16,19,20,22,23,25,33,57,59,60,72,78')
  .split(',').map(Number);
for (const LVL of LVLS) {
  let browser;
  try {
    browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
      args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
    const p = await browser.newPage({ viewport: { width: 320, height: 200 } });
    await p.goto(`http://localhost:8901/?level=${LVL}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 240000 });
    await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 240000 });
    const r = await p.evaluate(() => {
      const t = window.__game.track, N = t.center.length;
      const segL = t.segLen;
      const K = Math.max(3, Math.round(30 / segL));   // fixed ~30u arc window
      const radAt = (i) => {
        const a = t.center[(i - K + N) % N], b = t.center[i], c = t.center[(i + K) % N];
        const ab = Math.hypot(b.x - a.x, b.z - a.z), bc = Math.hypot(c.x - b.x, c.z - b.z),
          ca = Math.hypot(a.x - c.x, a.z - c.z);
        const cross = Math.abs((b.x - a.x) * (c.z - a.z) - (b.z - a.z) * (c.x - a.x));
        return cross < 1e-6 ? 1e9 : (ab * bc * ca) / (2 * cross);
      };
      const guards = [];
      for (const arr of [t.barriers ?? [], t.solids ?? [], t.banners ?? []]) {
        for (const b of arr) if (b && Number.isFinite(b.x) && Number.isFinite(b.z)) guards.push(b);
      }
      let sharp = 0, exposed = 0; const runs = []; let cur = null;
      for (let i = 0; i < N; i++) {
        const R = radAt(i);
        if (R > 30) { if (cur) { runs.push(cur); cur = null; } continue; }
        sharp++;
        const c = t.center[i], n = t.nrm[i];
        const inner = Math.sign((t.center[(i + K) % N].x - c.x) * n.x
          + (t.center[(i + K) % N].z - c.z) * n.z) || 1;
        const lat = t.widthAt(i) + 1.8;
        const ax = c.x - n.x * lat * inner, az = c.z - n.z * lat * inner;
        const drop = c.y - t.terrainHeight(ax, az);
        if (drop < 1.4 || t._nearGorge?.(i, 42) || t._circDist(i, 0) < 30) {
          if (cur) { runs.push(cur); cur = null; } continue;
        }
        let prot = false;
        for (const g of guards) {
          if (Math.hypot(g.x - ax, g.z - az) < 6) { prot = true; break; }
        }
        if (!prot) {
          exposed++;
          if (!cur) cur = { i0: i, i1: i, drop: +drop.toFixed(1) };
          else { cur.i1 = i; if (drop > cur.drop) cur.drop = +drop.toFixed(1); }
        } else if (cur) { runs.push(cur); cur = null; }
      }
      if (cur) runs.push(cur);
      return { world: window.__game.level?.name, theme: window.__game.level?.theme,
        segL: +segL.toFixed(2), K, sharp, exposed, runs: runs.slice(0, 8) };
    });
    console.log(LVL, JSON.stringify(r));
  } catch (e) {
    console.log(LVL, 'ERR', String(e).slice(0, 120));
  }
  try { await browser?.close(); } catch {}
}
