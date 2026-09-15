/* T-01 census (master spec): per world, count distinct curves (contiguous
 * runs with circumcircle R <= 120 over ~30u arc, accumulating >= 20 deg of
 * heading change) and the longest uninterrupted straight (contiguous run with
 * R > 400, in u). Spec: >= 12 curves, <= 400 u straight. Fresh browser per
 * world; crashes log and move on. */
import { chromium } from 'playwright-core';
const LVLS = (process.env.LVLS ?? Array.from({ length: 78 }, (_, i) => i + 1).join(','))
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
      const t = window.__game.track, N = t.center.length, segL = t.segLen;
      const KE = Math.max(3, Math.round(30 / segL));
      const radE = (i) => {
        const a = t.center[(i - KE + N) % N], b = t.center[i % N], c = t.center[(i + KE) % N];
        const cross = (b.x - a.x) * (c.z - b.z) - (b.z - a.z) * (c.x - b.x);
        if (Math.abs(cross) < 1e-6) return 1e9;
        return (Math.hypot(b.x - a.x, b.z - a.z) * Math.hypot(c.x - b.x, c.z - b.z)
          * Math.hypot(c.x - a.x, c.z - a.z)) / (2 * Math.abs(cross));
      };
      const hdg = (i) => Math.atan2(t.tan[i].x, t.tan[i].z);
      let curves = 0, straightMax = 0;
      let run = 0, turn = 0, sRun = 0;
      for (let i = 0; i < N; i++) {
        const R = radE(i);
        if (R <= 120) {
          if (run === 0) turn = 0;
          run++;
          let dh = hdg((i + 1) % N) - hdg(i);
          while (dh > Math.PI) dh -= 2 * Math.PI;
          while (dh < -Math.PI) dh += 2 * Math.PI;
          turn += Math.abs(dh);
        } else if (run) {
          if (turn >= Math.PI / 9) curves++;   // >= 20 deg of real bend
          run = 0;
        }
        if (R > 400) { sRun++; if (sRun * segL > straightMax) straightMax = sRun * segL; }
        else sRun = 0;
      }
      if (run && turn >= Math.PI / 9) curves++;
      return { world: window.__game.level?.name, lapU: Math.round(N * segL),
        curves, straightMax: Math.round(straightMax) };
    });
    console.log(LVL, JSON.stringify(r));
  } catch (e) { console.log(LVL, 'ERR', String(e).slice(0, 100)); }
  try { await browser?.close(); } catch {}
}
