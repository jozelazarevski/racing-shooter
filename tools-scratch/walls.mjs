/* CAN YOU CUT THE CORNER? For every TIGHT station on the lap, is there a
 * barrier standing beside it on each side — the thing that stops a car
 * leaving the road across the apex.
 *
 * Counting rails is not the question; COVERAGE of the tight stations is. A
 * world can carry hundreds of rails and still leave every hairpin open.
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8920';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 640, height: 400 } });
page.setDefaultTimeout(300000);
for (const id of process.argv.slice(2).map(Number)) {
  await page.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
  await page.waitForFunction(() => window.__game?.track?.center && window.__game.player,
    undefined, { timeout: 300000 });
  const r = await page.evaluate(() => {
    const t = window.__game.track, N = t.center.length;
    const TIGHT = 0.02;
    // a barrier segment counts as guarding station i on `side` if any part of
    // it lies within 4 u of the point 1.8 u outside that edge
    const segs = (t.barriers ?? []).map((q) => ({
      x1: q.x1, z1: q.z1, x2: q.x2, z2: q.z2 }));
    const near = (px, pz) => {
      for (const q of segs) {
        const dx = q.x2 - q.x1, dz = q.z2 - q.z1;
        const L = dx * dx + dz * dz || 1;
        let u = ((px - q.x1) * dx + (pz - q.z1) * dz) / L;
        u = u < 0 ? 0 : u > 1 ? 1 : u;
        const cx = q.x1 + dx * u, cz = q.z1 + dz * u;
        if ((px - cx) ** 2 + (pz - cz) ** 2 < 16) return true;
      }
      return false;
    };
    let tight = 0, both = 0, one = 0, none = 0;
    for (let i = 0; i < N; i++) {
      if (t.curvature[i] <= TIGHT) continue;
      tight++;
      const half = t.widthAt ? t.widthAt(i) : 9;
      let g = 0;
      for (const side of [1, -1]) {
        const p = t.pointAt(i, (half + 1.8) * side);
        if (near(p.x, p.z)) g++;
      }
      if (g === 2) both++; else if (g === 1) one++; else none++;
    }
    return { name: t.level?.name, tight, both, one, none,
      rails: t._edgeRailCount ?? 0, bars: (t.barriers ?? []).length };
  });
  const pct = r.tight ? Math.round((r.both / r.tight) * 100) : 0;
  const open = r.tight ? Math.round((r.none / r.tight) * 100) : 0;
  console.log(`${String(id).padStart(2)} ${(r.name ?? '?').padEnd(15)} ${String(r.tight).padStart(3)} tight stations  `
    + `both sides ${String(pct).padStart(3)}%  one side ${String(r.one).padStart(3)}  `
    + `OPEN ${String(r.none).padStart(3)} (${open}%)   rails ${r.rails}  barriers ${r.bars}`);
}
await b.close();
