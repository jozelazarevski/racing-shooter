/* THE FULL SWEEP: on every sampled world, find cone-family meshes whose
 * instances stand >= 5 u tall on reachable ground (rad < 1600) with NO trunk
 * cylinder within 2 u of their base — a trunkless cone is a pyramid to the
 * player, whatever the builder called it.
 *   node tools-scratch/pyramidsweep.mjs 1 6 19 21 30 44 57 62 65 73
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const LEVELS = process.argv.slice(2).length ? process.argv.slice(2) : ['19'];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
p.setDefaultTimeout(600000);
for (const lv of LEVELS) {
  await p.goto(`${BASE}/?level=${lv}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
  const ok = await p.waitForFunction(() => window.__game?.track?.center && window.__game.player,
    undefined, { timeout: 600000 }).then(() => 1).catch(() => 0);
  if (!ok) { console.log(`L${lv} SKIP no build`); continue; }
  const r = await p.evaluate(() => {
    const g = window.__game, t = g.track;
    const M4c = t.group.matrixWorld.constructor, V3c = g.player.pos.constructor, Qc = t.group.quaternion.constructor;
    const M = new M4c(), P = new V3c(), Q = new Qc(), S = new V3c();
    t.group.updateMatrixWorld(true);
    const cones = [], cyls = [];
    t.group.traverse(o => {
      if (!o.isMesh) return;
      const geo = o.geometry;
      const isCone = geo.type === 'ConeGeometry' ||
        (geo.type === 'CylinderGeometry' && geo.parameters?.radiusTop === 0);
      const isCyl = geo.type === 'CylinderGeometry' && (geo.parameters?.radiusTop ?? 1) > 0;
      if (!isCone && !isCyl) return;
      if (!geo.boundingBox) geo.computeBoundingBox();
      const gh = geo.boundingBox.max.y - geo.boundingBox.min.y;
      const rows = [];
      if (o.isInstancedMesh) {
        for (let i = 0; i < o.count; i++) {
          o.getMatrixAt(i, M); M.premultiply(o.matrixWorld); M.decompose(P, Q, S);
          rows.push({ x: P.x, z: P.z, h: gh * S.y, rad: Math.hypot(P.x, P.z) });
        }
      } else { o.getWorldPosition(P); rows.push({ x: P.x, z: P.z, h: gh * o.scale.y, rad: Math.hypot(P.x, P.z) }); }
      const mat = Array.isArray(o.material) ? o.material[0] : o.material;
      const rec = { name: o.name || o.parent?.name || '(anon)', col: '#' + (mat?.color?.getHexString?.() ?? '?'), rows };
      (isCone ? cones : cyls).push(rec);
    });
    const out = [];
    for (const c of cones) {
      const big = c.rows.filter(r => r.h >= 5 && r.rad < 1600);
      if (!big.length) continue;
      let orphans = 0, sample = null;
      for (const b of big) {
        let hasTrunk = false;
        for (const cy of cyls) {
          for (const q of cy.rows) {
            if (Math.abs(q.x - b.x) < 2 && Math.abs(q.z - b.z) < 2) { hasTrunk = true; break; }
          }
          if (hasTrunk) break;
        }
        if (!hasTrunk) { orphans++; if (!sample) sample = b; }
      }
      if (orphans) out.push({ name: c.name, col: c.col, big: big.length, orphans,
        at: sample ? [Math.round(sample.x), Math.round(sample.z)] : null,
        h: sample ? +sample.h.toFixed(1) : 0, rad: sample ? Math.round(sample.rad) : 0 });
    }
    return { world: t.level?.name, out };
  });
  console.log(`L${lv} ${r.world}: ${r.out.length ? '' : 'clean'}`);
  for (const o of r.out) console.log('   ', JSON.stringify(o));
}
await p.close(); await browser.close();
