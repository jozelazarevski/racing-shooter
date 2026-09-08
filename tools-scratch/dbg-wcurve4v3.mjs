/* W-CURVE-01.4 acceptance measurement: at every sharp station (circumcircle
 * over ~30u arc <= 30) whose side falls >= 2.5 at (half+7), and where a rail
 * could lawfully stand (outside gate/jump-gorge/ford/tunnel zones, clearAll
 * passes at half+1.8), measure the distance from the rail point to the
 * nearest barrier SEGMENT. Reports the worst distance per world. */
import { chromium } from 'playwright-core';
const LVLS = (process.env.LVLS ?? '6,66,59,60').split(',').map(Number);
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
      const KE = Math.max(3, Math.round(30 / t.segLen));
      const radE = (i) => {
        const a = t.center[(i - KE + N) % N], b = t.center[i % N], c = t.center[(i + KE) % N];
        const cross = (b.x - a.x) * (c.z - b.z) - (b.z - a.z) * (c.x - b.x);
        if (Math.abs(cross) < 1e-6) return 1e9;
        return (Math.hypot(b.x - a.x, b.z - a.z) * Math.hypot(c.x - b.x, c.z - b.z)
          * Math.hypot(c.x - a.x, c.z - a.z)) / (2 * Math.abs(cross));
      };
      const segDist = (px, pz, q) => {
        const dx = q.x2 - q.x1, dz = q.z2 - q.z1;
        const L2 = dx * dx + dz * dz || 1;
        const u = Math.max(0, Math.min(1, ((px - q.x1) * dx + (pz - q.z1) * dz) / L2));
        return Math.hypot(px - (q.x1 + dx * u), pz - (q.z1 + dz * u));
      };
      let checked = 0, worst = 0, holes = [];
      for (let i = 0; i < N; i++) {
        if (radE(i) > 30) continue;
        if (t._circDist(i, 0) < 30) continue;
        if ((t._jumpGorges ?? []).some((G) => t._circDist(i, G.i) < 40)) continue;
        if (t.fords.some((f) => t._circDist(i, f.i) < 14)) continue;
        if (t._tunnels.some((tu) => i >= tu.s - 6 && i <= tu.e + 6)) continue;
        const half = t.widthAt(i);
        for (const s of [1, -1]) {
          const out = t.pointAt(i, (half + 7.0) * s);
          const drop = t.center[i].y - t.terrainHeight(out.x, out.z);
          if (drop < 2.5) continue;
          const pr = t.pointAt(i, (half + 1.8) * s);
          const tg = t.tan[i];
          const ok = [[0, 0], [tg.x * 2.4, tg.z * 2.4], [-tg.x * 2.4, -tg.z * 2.4]]
            .every(([ox, oz]) => t._distToTrack(pr.x + ox, pr.z + oz) >= half + 0.25);
          if (!ok) continue;                       // no lawful stand — apex opening
          checked++;
          let best = 1e9;
          for (const q of t.barriers) best = Math.min(best, segDist(pr.x, pr.z, q));
          if (best > worst) worst = best;
          if (best > 8) holes.push({ i, s, drop: +drop.toFixed(1), d: +best.toFixed(1) });
        }
      }
      return { world: window.__game.level?.name, KE, checked, worst: +worst.toFixed(1),
        holes: holes.slice(0, 8), barriers: t.barriers.length };
    });
    console.log(LVL, JSON.stringify(r));
  } catch (e) { console.log(LVL, 'ERR', String(e).slice(0, 120)); }
  try { await browser?.close(); } catch {}
}
