/* CAN A BORE GO WHERE THE WALL IS IN THE ROAD?
 *
 * UNDERCITY SLIPSTREAM's two legs pass ~20 u apart, so each one's wall — at
 * its natural 11.4 u setback — lands inside the other's 9 u half-width. The
 * cap tries, floors at 11.3, still does not clear, and builds there anyway;
 * its own comment says no setback can fix it. A bore can: put the road through
 * the rock instead of alongside it.
 *
 * But `_planTunnels` will not site a bore anywhere: `tunnelFitAt` demands a
 * straight enough run with no crest in reach. So ask it, at and around both
 * crossings, BEFORE writing a tune that might be silently refused — a bore
 * that is declined leaves no trace except the defect still being there.
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8901';
const ID = Number(process.env.ID ?? 18);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 400, height: 240 } });
p.setDefaultTimeout(600000);
await p.goto(`${BASE}/?level=${ID}&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 600000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track, N = t.center.length;
  const lenS = Math.round(80 / t.segLen);
  const scan = (from, to) => {
    const rows = [];
    for (let i = from; i <= to; i++) {
      const j = ((i % N) + N) % N;
      rows.push({ j, fit: t.tunnelFitAt(j, lenS), curv: +(t.curvature[j] ?? 0).toFixed(4),
        frac: +(j / N).toFixed(4) });
    }
    return rows;
  };
  const a = scan(140, 190), c = scan(590, 640);
  const bestOf = (rows) => rows.reduce((m, q) => (q.fit > m.fit ? q : m), rows[0]);
  return { name: g.level?.name, N, segLen: +t.segLen.toFixed(2), lenS,
    existingTunnels: (t._tunnels ?? []).map((x) => ({ mid: x.mid, s: x.s, e: x.e })),
    declared: t.T.tunnels ?? null,
    crossingA: { best: bestOf(a), anyFit: a.filter((x) => x.fit > 0).length, of: a.length },
    crossingB: { best: bestOf(c), anyFit: c.filter((x) => x.fit > 0).length, of: c.length },
    crestsNear: (t.crests ?? []).map((cr) => (typeof cr === 'number' ? cr : cr.i ?? cr.index))
      .filter((ci) => ci != null && (Math.abs(ci - 162) < 60 || Math.abs(ci - 611) < 60)) };
});
console.log(JSON.stringify(r, null, 1));
await b.close();
