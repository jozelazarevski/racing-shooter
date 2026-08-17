/* WHO BUILDS THE 0.18 x 1.05 POSTS, AND ARE THEY REALLY ON THE ROAD?
 *
 * NOTE the filter bug this replaces: `Math.abs(q.width - 0.18) > 0.005` is
 * NaN > 0.005 === false for any geometry with no `width` (spheres, torus, the
 * 9000 u world skirt), so the old probe let all of them through and counted
 * them as posts. Require the keys to EXIST first.
 *
 * Also: an InstancedMesh sits at the origin and its instances live in
 * per-instance matrices, so getWorldPosition() on one measures nothing.
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8920';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 640, height: 400 } });
page.setDefaultTimeout(300000);

for (const id of process.argv.slice(2).map(Number)) {
  await page.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
  const ok = await page.waitForFunction(() => window.__game?.track?.center && window.__game.player,
    undefined, { timeout: 300000 }).then(() => 1).catch(() => 0);
  if (!ok) { console.log(`SKIP ${id}`); continue; }
  const r = await page.evaluate(() => {
    const t = window.__game.track, N = t.center.length;
    const near = (x, z) => { let best = Infinity, at = 0;
      for (let i = 0; i < N; i++) { const c = t.center[i];
        const d = (x - c.x) ** 2 + (z - c.z) ** 2; if (d < best) { best = d; at = i; } }
      return { d: Math.sqrt(best), i: at }; };
    const chain = (m) => { const out = []; let p = m;
      while (p) { out.push(`${p.type}${p.name ? ':' + p.name : ''}[${p.children?.length ?? 0}]`); p = p.parent; }
      return out.join(' < '); };

    const hits = [];
    t.group.traverse((m) => {
      const q = m.geometry?.parameters;
      if (!q || !('width' in q) || !('height' in q)) return;
      if (Math.abs(q.width - 0.18) > 0.005 || Math.abs(q.height - 1.05) > 0.005) return;
      const wp = new (m.position.constructor)();
      const list = [];
      if (m.isInstancedMesh) {
        const M = new (m.matrixWorld.constructor)();
        for (let k = 0; k < m.count; k++) {
          m.getMatrixAt(k, M); M.premultiply(m.matrixWorld);
          list.push({ x: M.elements[12], y: M.elements[13], z: M.elements[14] });
        }
      } else { m.getWorldPosition(wp); list.push({ x: wp.x, y: wp.y, z: wp.z }); }
      for (const p of list) {
        const { d, i } = near(p.x, p.z);
        hits.push({ chain: chain(m), mat: m.material?.color?.getHexString?.() ?? '?',
          inst: m.isInstancedMesh ? m.count : 0,
          pos: [+p.x.toFixed(1), +p.y.toFixed(1), +p.z.toFixed(1)].join(','),
          i, lat: +d.toFixed(2), half: +t.widthAt(i).toFixed(2),
          bite: +(t.widthAt(i) - (d - 0.09)).toFixed(2) });
      }
    });

    // is there a collider anywhere near the worst offender?
    const worst = hits.slice().sort((a, b) => b.bite - a.bite)[0];
    let nearSolid = null;
    if (worst) {
      const [wx, , wz] = worst.pos.split(',').map(Number);
      let bd = Infinity;
      for (const s of (t.solids ?? [])) {
        const dd = Math.hypot(s.x - wx, s.z - wz);
        if (dd < bd) { bd = dd; nearSolid = { mat: s.mat, r: s.r, d: +dd.toFixed(2) }; }
      }
    }

    const groups = new Map();
    for (const o of hits) {
      const k = o.chain + ' #' + o.mat + (o.inst ? ` inst=${o.inst}` : '');
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(o);
    }
    return { name: t.level?.name, total: hits.length, nearSolid,
      groups: [...groups].map(([k, v]) => ({ k, n: v.length,
        onRoad: v.filter((o) => o.bite > 0.15).length,
        worst: +Math.max(...v.map((o) => o.bite)).toFixed(2),
        sample: v.slice().sort((a, b) => b.bite - a.bite)[0] })) };
  });
  console.log(`\n===== ${id} ${r.name} — ${r.total} true 0.18x1.05 posts =====`);
  for (const g of r.groups) {
    console.log(`  ${String(g.n).padStart(4)} posts, ${g.onRoad} on road, worst bite ${g.worst} u`);
    console.log(`      ${g.k}`);
    console.log(`      worst: ${JSON.stringify(g.sample)}`);
  }
  console.log(`  nearest collider to the worst post: ${JSON.stringify(r.nearSolid)}`);
}
await b.close();
