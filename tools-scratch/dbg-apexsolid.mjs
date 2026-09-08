/* W-CURVE-01.5 apex solidity: at sharp stations (circumcircle <= 30), sample
 * the DRAWN ground across the inner verge (widthAt .. widthAt+4): report the
 * deepest dip below the banked road edge. A pit or fold reads as a big drop. */
import { chromium } from 'playwright-core';
const LVLS = (process.env.LVLS ?? '66,59,74').split(',').map(Number);
for (const LVL of LVLS) {
  let browser;
  try {
    browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
      args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
    const p = await browser.newPage({ viewport: { width: 320, height: 200 } });
    p.setDefaultTimeout(240000);
    await p.goto(`http://localhost:8901/?level=${LVL}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 240000 });
    await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 240000 });
    const r = await p.evaluate(() => {
      const t = window.__game.track, N = t.center.length;
      const KE = Math.max(3, Math.round(30 / t.segLen));
      const radE = (i) => {
        const a = t.center[(i - KE + N) % N], b = t.center[i % N], c = t.center[(i + KE) % N];
        const cross = (b.x - a.x) * (c.z - b.z) - (b.z - a.z) * (c.x - b.x);
        if (Math.abs(cross) < 1e-6) return 1e9;
        return (Math.hypot(b.x - a.x, b.z - a.z) * Math.hypot(c.x - b.x, c.z - b.z)
          * Math.hypot(c.x - a.x, c.z - a.z)) / (2 * Math.abs(cross));
      };
      let sharp = 0, worstDip = 0, wi = -1;
      for (let i = 0; i < N; i++) {
        if (radE(i) > 30) continue;
        sharp++;
        const c = t.center[i], n = t.nrm[i], w = t.widthAt(i);
        for (const s of [1, -1]) {
          const edgeY = c.y + (t.bankOffset ? t.bankOffset(i, w * s) : 0);
          for (const d of [0.5, 1.5, 2.5, 3.5]) {
            const x = c.x + n.x * (w + d) * s, z = c.z + n.z * (w + d) * s;
            const g = t._drawnGroundY ? t._drawnGroundY(x, z) : t.terrainHeight(x, z);
            const dip = edgeY - (g ?? t.terrainHeight(x, z));
            if (dip > worstDip) { worstDip = dip; wi = i; }
          }
        }
      }
      return { world: window.__game.level?.name, sharp, worstDip: +worstDip.toFixed(2), wi };
    });
    console.log(LVL, JSON.stringify(r));
  } catch (e) { console.log(LVL, 'ERR', String(e).slice(0, 100)); }
  try { await browser?.close(); } catch {}
}
