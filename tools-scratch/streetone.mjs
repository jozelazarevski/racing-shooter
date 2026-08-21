/* One world's built frontage, with the REFUSAL REASONS counted.
 * `put()` has five ways to say no; a world that builds nothing has been
 * refused 2600 times for one of them, and only the counter says which. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8920';
const LV = +(process.env.LV ?? 57);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 400, height: 260 } });
p.setDefaultTimeout(600000);
await p.goto(`${BASE}/?level=${LV}&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 600000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track, F = t.T.frontage ?? {};
  let n = 0;
  t.group.traverse((o) => {
    if (o.name === 'oldtown-frontage' && o.isInstancedMesh) {
      const m = new (Object.getPrototypeOf(o.matrix).constructor)();
      for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, m); if (m.elements[5] > 0.01) n++; }
    }
  });
  // WHY. Walk the same candidate lattice put() walks and count each refusal.
  const N = t.center.length;
  const reasons = { seaOpen: 0, road: 0, tree: 0, prop: 0, ok: 0 };
  // the kerb shift `_buildOldTown` applies, or this counter reports 900
  // refusals for a world that just built 88 houses (it did, once)
  const lat = (F.lateral ?? 15.5) + (t._kerbHalf() - 9), dep = F.depth ?? 8, unit = F.unit ?? 7;
  const r0 = Math.hypot(unit, dep) / 2;
  for (let i = 0; i < N; i += 2) for (const side of [-1, 1]) {
    const pt = t.pointAt(i, lat * side);
    if (F.seaOpen && t.T.coast && t._coastSide(pt.x, pt.z) > -F.seaOpen) { reasons.seaOpen++; continue; }
    if (!t._clearsRoad(pt.x, pt.z, r0, 1.6)) { reasons.road++; continue; }
    let hit = false;
    for (const tr of t.trees) if ((tr.x - pt.x) ** 2 + (tr.z - pt.z) ** 2 < (r0 + 1.4) ** 2) { hit = true; break; }
    if (hit) { reasons.tree++; continue; }
    for (const pr of t.props) if ((pr.x - pt.x) ** 2 + (pr.z - pt.z) ** 2 < (r0 + 1.0) ** 2) { hit = true; break; }
    if (hit) { reasons.prop++; continue; }
    reasons.ok++;
  }
  return { name: g.level?.name, theme: g.level?.theme, built: n, F, reasons,
    coast: !!t.T.coast, coastLevel: t.T.coast?.level };
});
console.log(JSON.stringify(r, null, 1));
await b.close();
