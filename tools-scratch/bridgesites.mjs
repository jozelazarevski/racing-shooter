/* WHAT DROP IS ACTUALLY AVAILABLE FOR A STONE BRIDGE, once ford sites are off
 * the table? `_buildStoneBridges` wants "ground 4.5+ u below the deck on both
 * sides at 15 u out, curvature < 0.01". Excluding fords starved farmland to
 * zero bridges from a requested two, so this prints the distribution of the
 * best non-ford candidates per world — the threshold is picked from this, not
 * guessed. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 400, height: 260 } });
p.setDefaultTimeout(900000);
console.log('world              want  best non-ford drops (deepest first, 120-spaced)');
for (const id of (process.env.WORLDS ?? '31,35,43,62,63,67').split(',')) {
  await p.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 900000 });
  const ok = await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 900000 })
    .then(() => 1).catch(() => 0);
  if (!ok) { console.log(`level ${id}: did not build`); continue; }
  const r = await p.evaluate(() => {
    const t = window.__game.track;
    if (!t.T.stoneBridges) return { skip: true, name: window.__game.level?.name };
    const N = t.center.length;
    const cands = [];
    for (let i = 0; i < N; i += 3) {
      if (t._circDist(i, 0) < 90 || t._nearGorge(i, 60)) continue;
      if (t.curvature[i] > 0.01) continue;
      const c = t.center[i], n = t.nrm[i];
      if ((t.fords ?? []).some((f) => Math.hypot(f.x - c.x, f.z - c.z) < 62)) continue;
      const dl = c.y - t.terrainHeight(c.x + n.x * 15, c.z + n.z * 15);
      const dr = c.y - t.terrainHeight(c.x - n.x * 15, c.z - n.z * 15);
      cands.push({ i, drop: Math.min(dl, dr) });
    }
    cands.sort((a, c) => c.drop - a.drop);
    const picked = [];
    for (const q of cands) {
      if (picked.length >= 6) break;
      if (picked.some((w) => t._circDist(q.i, w.i) < 120)) continue;
      picked.push(q);
    }
    return { name: window.__game.level?.name, want: t.T.stoneBridges.count ?? 2,
      drops: picked.map((q) => +q.drop.toFixed(1)) };
  });
  if (r.skip) { console.log(`${String(r.name).padEnd(18)}  (no stoneBridges)`); continue; }
  console.log(`${String(r.name).padEnd(18)} ${String(r.want).padStart(4)}  ${r.drops.join('  ')}`);
}
await b.close();
