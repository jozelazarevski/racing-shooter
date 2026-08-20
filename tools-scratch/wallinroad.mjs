/* WHERE IS A CLIFF WALL STANDING IN SOMEBODY'S CARRIAGEWAY?
 *
 * `_buildCliffCaps` walks the wall inward until its face clears every leg of
 * the lap — but when even the FLOOR does not clear, it builds at the floor
 * anyway:
 *
 *     let out = P.base;
 *     if (!clearAt(P.base)) {
 *       out = floor;                          // <- kept even if floor fails
 *       for (let lb = floor; lb <= P.base; lb += STEP) { ... }
 *     }
 *
 * Its own note admits it: "a lap that doubles back inside the verge itself —
 * and no setback can fix that". So this measures the leftovers: stations whose
 * wall face, at the offset actually built, lies inside some part of the road.
 *
 * Reported per world as RUNS along the lap, because that is what a tunnel has
 * to span — a single station is a graze, forty in a row is a blocked road.
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8901';
const IDS = (process.env.IDS ?? '4,7,10,18,27,44').split(',').map(Number);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 400, height: 240 } });
p.setDefaultTimeout(600000);
for (const id of IDS) {
  await p.goto(`${BASE}/?level=${id}&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
  await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 600000 });
  const r = await p.evaluate(() => {
    const g = window.__game, t = g.track, N = t.center.length;
    if (!t.T.cliffWalls || !t._cliffCap) return null;
    // A station is BLOCKED when its wall's own face rows land inside the
    // drivable width of some sample — the same test the cap uses, asked of
    // what was actually built rather than of a candidate.
    const blocked = [];
    for (let j = 0; j < N; j++) {
      const c = t.center[j], n = t.nrm[j];
      for (let s = 0; s < 2; s++) {
        const side = s ? -1 : 1;
        const P = t._cliffProfile(j, side);
        let worst = 0, at = -1;
        for (const row of [0, P.l1, P.l2]) {
          const lat = P.base + row;
          const x = c.x + n.x * lat * side, z = c.z + n.z * lat * side;
          const ns = t._nearestSample(x, z);
          const bite = t.widthAt(ns.i) - ns.d;
          if (bite > worst) { worst = bite; at = ns.i; }
        }
        if (worst > 0) blocked.push({ j, side, bite: +worst.toFixed(2), victim: at, h: +P.h.toFixed(1) });
      }
    }
    const runs = [];
    let cur = null;
    for (const q of blocked) {
      if (cur && q.j - cur.to <= 4) { cur.to = q.j; cur.n++; cur.bite = Math.max(cur.bite, q.bite); cur.h = Math.max(cur.h, q.h); }
      else { cur = { from: q.j, to: q.j, n: 1, bite: q.bite, h: q.h, victim: q.victim }; runs.push(cur); }
    }
    return { name: g.level?.name, blockedSides: blocked.length, of: N * 2,
      runs: runs.sort((a, x) => x.n - a.n).slice(0, 5) };
  });
  if (!r) continue;
  console.log(`L${String(id).padStart(2)} ${String(r.name).padEnd(20)} ${String(r.blockedSides).padStart(4)}/${r.of} wall-sides inside a road`);
  for (const q of r.runs) console.log(`      stations ${q.from}-${q.to} (${q.n}) bite ${q.bite} u into sample ${q.victim}, wall ${q.h} u tall`);
}
await b.close();
