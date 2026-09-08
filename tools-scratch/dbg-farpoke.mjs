/* Far-mesh poke census: for each station, the far mesh's post-sink height vs
 * the road. Positive margin = the far sheet stands over the carriageway. */
import { chromium } from 'playwright-core';
const LVLS = (process.env.LVLS ?? Array.from({ length: 78 }, (_, i) => i + 1).join(',')).split(',').map(Number);
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
      const ph = t._patchHalf ?? 1000, sinkTo = ph - 180;
      const ss = (v) => { const c = Math.min(1, Math.max(0, v)); return c * c * (3 - 2 * c); };
      let worst = -1e9, wi = -1, over = 0, worstNew = -1e9;
      for (let i = 0; i < N; i++) {
        const c = t.center[i];
        let h0 = t._hillNoise(c.x, c.z);
        if (t.T.coast) h0 = t._coastDepress(c.x, c.z, h0, 9999);
        const m = Math.max(Math.abs(c.x), Math.abs(c.z));
        const s9 = ss((m - sinkTo) / 80);
        const hOld = h0 - 60 * (1 - s9);
        const hNew = -80 + (h0 + 80) * s9;
        const margin = hOld - 0.52 - c.y;
        if (margin > worst) { worst = margin; wi = i; }
        if (margin > 0) over++;
        worstNew = Math.max(worstNew, hNew - 0.52 - c.y);
      }
      return { world: window.__game.level?.name, patchHalf: ph,
        worst: +worst.toFixed(1), wi, overStations: over,
        worstNew: +worstNew.toFixed(1), N };
    });
    console.log(LVL, JSON.stringify(r));
  } catch (e) { console.log(LVL, 'ERR', String(e).slice(0, 100)); }
  try { await browser?.close(); } catch {}
}
