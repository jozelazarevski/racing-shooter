/* THE LAW OF SOLIDITY, ENFORCED BY CENSUS: every big drawn mass must be
 * backed by SOMETHING — a solid, a barrier, an obstacle, or terrain that
 * actually rises to meet it. The mountain-sinking round fixed the gate that
 * ignored seated mountains from downhill; this asks the wider question the
 * player keeps asking: is there ANY mass left you can drive inside?
 *
 * For every world: every mesh/instance taller than 8 u with a footprint over
 * 6 u, inside the rim (r < 1600). Covered means: a solid whose radius reaches
 * the instance centre at foot height, or a barrier/obstacle within the
 * footprint, or terrainHeight at the centre within 3 u of the mass's top
 * (terrain-conforming decoration). Named hollow/overhead structures — bores,
 * bridges, decks, gantries, arches — are exempt: driving UNDER them is their
 * whole point. Trees and props are exempt: they smash, which is solidity by
 * other means.
 *
 *   node tools-scratch/ghosthunt.mjs            all worlds
 *   LEVELS=6,21 node tools-scratch/ghosthunt.mjs
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 480, height: 320 } });
page.setDefaultTimeout(900000);
await page.goto(`${BASE}/?level=1&go=1&unlockall=1`, { waitUntil: 'load', timeout: 120000 });
await page.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 120000 });
const only = process.env.LEVELS ? process.env.LEVELS.split(',').map(Number) : null;
const rows = await page.evaluate(async (only) => {
  const g = window.__game;
  const THREE = await import('three');
  const { LEVELS } = await import('./src/track.js');
  const EXEMPT = /tunnel|bore|bridge|deck|gantry|arch|portal|banner|sign|cloud|haze|sky|water|sea|road|tree|pine|palm|forest|prop|crate|cone|barrel|husk|lamp|beam|wire|cable|flag|balcon|awning|roof|chimney|smoke/i;
  const out = [];
  const box = new THREE.Box3(), v = new THREE.Vector3(), m4 = new THREE.Matrix4();
  const pos = new THREE.Vector3(), quat = new THREE.Quaternion(), scl = new THREE.Vector3();
  for (const L of LEVELS) {
    if (only && !only.includes(L.id)) continue;
    g.state = 'title'; g.editScene = null;
    try { g.swapLevel(L, true, null); } catch { out.push({ id: L.id, name: L.name, fail: 'no build' }); continue; }
    const t = g.track;
    const covered = (x, z, foot, footY) => {
      for (const s of t.solids ?? []) {
        if ((s.y ?? 0) < -1000) continue;
        const rr = (s.r ?? 0);
        if (Math.hypot(s.x - x, s.z - z) < Math.max(rr, foot * 0.35) + 2) return true;
      }
      for (const ob of t.obstacles ?? []) {
        if (Math.hypot(ob.x - x, ob.z - z) < Math.max(ob.r ?? 0, foot * 0.35) + 2) return true;
      }
      for (const q of t.barriers ?? []) {
        const mx = (q.x1 + q.x2) / 2, mz = (q.z1 + q.z2) / 2;
        if (Math.hypot(mx - x, mz - z) < foot * 0.5 + 4) return true;
      }
      // a smashable tree is solid by other means — hitting it does something
      for (const tr of t.trees ?? []) {
        if (Math.hypot(tr.x - x, tr.z - z) < foot * 0.5 + 2) return true;
      }
      return false;
    };
    const bad = {};
    t.group?.traverse?.((o) => {
      if (!o.isMesh || EXEMPT.test(o.name || '') || EXEMPT.test(o.parent?.name || '')) return;
      if (!o.geometry?.boundingBox) o.geometry?.computeBoundingBox?.();
      const bb = o.geometry?.boundingBox;
      if (!bb) return;
      const insts = o.isInstancedMesh ? o.count : 1;
      for (let i = 0; i < insts; i++) {
        if (o.isInstancedMesh) { o.getMatrixAt(i, m4); m4.decompose(pos, quat, scl); }
        else { o.updateWorldMatrix(true, false); m4.copy(o.matrixWorld); m4.decompose(pos, quat, scl); }
        const h = (bb.max.y - bb.min.y) * Math.abs(scl.y);
        const fx = (bb.max.x - bb.min.x) * Math.abs(scl.x);
        const fz = (bb.max.z - bb.min.z) * Math.abs(scl.z);
        const foot = Math.min(fx, fz);
        if (h < 8 || foot < 6) continue;
        const x = pos.x + (o.isInstancedMesh ? 0 : 0), z = pos.z;
        const r = Math.hypot(x, z);
        if (r > 1600 || pos.y < -500) continue;             // behind the rim / parked offstage
        if (t._inWater?.(x, z)) continue;                   // the sea is the drown system's boundary, not ours
        const gy = t.terrainHeight(x, z);
        const topY = pos.y + (bb.max.y * scl.y);
        if (gy > topY - 3) continue;                        // terrain rises to meet it
        if (covered(x, z, Math.max(fx, fz), gy)) continue;
        const key = o.name || o.parent?.name || o.geometry?.type || 'mesh';
        bad[key] = bad[key] ?? { n: 0, worst: null };
        bad[key].n++;
        if (!bad[key].worst || h > bad[key].worst.h) bad[key].worst = { x: +x.toFixed(0), z: +z.toFixed(0), h: +h.toFixed(0), foot: +foot.toFixed(0), r: +r.toFixed(0) };
      }
    });
    out.push({ id: L.id, name: L.name, bad });
    await new Promise((r2) => setTimeout(r2, 30));
  }
  return out;
}, only);
let ghosts = 0;
for (const r of rows) {
  if (r.fail) { console.log(`${String(r.id).padStart(2)} ${r.name}  FAIL ${r.fail}`); continue; }
  const ks = Object.entries(r.bad ?? {});
  if (!ks.length) continue;
  console.log(`${String(r.id).padStart(2)} ${r.name}`);
  for (const [k, vv] of ks) { ghosts += vv.n; console.log(`     ${k}: ${vv.n} uncovered  worst ${JSON.stringify(vv.worst)}`); }
}
console.log(`\n${ghosts} uncovered masses across ${rows.length} worlds`);
await b.close();
