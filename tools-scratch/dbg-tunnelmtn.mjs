/* r350 (owner: "All Tunels needs to be under a mountain otherwise makes no
 * sense") — v2: the heightfield HOLDS THE CORRIDOR OPEN inside bd < 13.6
 * (a heightfield cannot hold a hole), so the road-centre overburden is by
 * design −1.2 and the mountain lives in the FLANKS. Measure those:
 *   peakL/peakR  max (terrain − roadY) walking the normal 14..150 u out,
 *                at the bore mid — the mountain's shoulder height
 *   atL/atR      the lateral distance of that peak
 *   qPeaks       same peak (max of both sides) at the quarter points
 *   portalOut    terrain − roadY 25 u OUTSIDE each portal on the road line
 *                (does the road exit into a mountainside or onto a table)
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const WORLDS = (process.env.W ?? '3,4,6,7,15,16,19,20,21,22,23,25,34,45,48,50,52,54,55,56,57,59,60,61,62,63,65,66,67,78')
  .split(',').map(Number);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
for (const id of WORLDS) {
  const p = await browser.newPage({ viewport: { width: 480, height: 320 } });
  try {
    await p.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
    await p.waitForFunction(() => window.__game?.player && window.__game.track?.center,
      undefined, { timeout: 300000 });
    const r = await p.evaluate(() => {
      const g = window.__game, t = g.track, N = t.center.length;
      const th = (x, z) => t.terrainHeight(x, z);
      const out = [];
      for (const T of (t._tunnels ?? [])) {
        const flank = (gi) => {
          const c = t.center[((gi % N) + N) % N], n = t.nrm[((gi % N) + N) % N];
          const side = (s) => {
            let pk = -99, at = 0;
            for (let d = 14; d <= 150; d += 4) {
              const h = th(c.x + n.x * d * s, c.z + n.z * d * s) - c.y;
              if (h > pk) { pk = h; at = d; }
            }
            return [Math.round(pk), at];
          };
          return { L: side(-1), R: side(1) };
        };
        const m = flank(T.mid);
        const q1 = flank(T.s + ((T.e - T.s) >> 2));
        const q3 = flank(T.e - ((T.e - T.s) >> 2));
        const portal = (i, dir) => {
          const j = ((i + dir * Math.round(25 / t.segLen)) % N + N) % N;
          const c = t.center[j];
          return Math.round(th(c.x, c.z) - c.y);
        };
        out.push({ mid: T.mid, lenS: T.e - T.s, ridge: T.h,
          midL: m.L, midR: m.R,
          q1: Math.max(q1.L[0], q1.R[0]), q3: Math.max(q3.L[0], q3.R[0]),
          preS: portal(T.s, -1), postE: portal(T.e, 1) });
      }
      return { name: g.level?.name, theme: g.level?.theme, segLen: +t.segLen.toFixed(2), bores: out };
    });
    console.log(`== ${id} ${r.name} [${r.theme}] seg ${r.segLen}`);
    for (const b of r.bores) console.log('  ', JSON.stringify(b));
    if (!r.bores.length) console.log('   (no bores built)');
  } catch (e) { console.log(`== ${id} ERROR ${String(e).slice(0, 100)}`); }
  await p.close();
}
await browser.close();
