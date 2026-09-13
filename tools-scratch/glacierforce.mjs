/* THE GLACIER'S CLEARANCE RULE, FORCED.
 *
 * On the shipped roster the tongue is nowhere near the lap — measured, both
 * furka levels, `glacierloom` — so the walk-out-of-the-way loop added to
 * `_buildGlacier` never executes there and a run against FURKA RIDGE or
 * GLACIER COL proves precisely nothing about it. That is the `shrinkpath`
 * lesson: an unreachable branch is where the mistake hides.
 *
 * So this MOVES THE ROAD under the ice and rebuilds. It translates every
 * centreline sample onto the tongue's own wedge, rebuilds the sample grid,
 * calls the real `_buildGlacier` again, and reads the new instance matrices.
 *
 * `walked` is the gate on the gate: if no slab moved, the branch did not run
 * and this run measured nothing.
 *
 *   LEVEL=21 node glacierforce.mjs
 */
import { chromium } from 'playwright-core';
const PORT = process.env.PORT ?? '8912', LV = process.env.LEVEL ?? 21;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 320, height: 480 } });
p.setDefaultTimeout(900000);
const errs = [];
p.on('pageerror', (e) => errs.push(String(e)));
p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
await p.goto(`http://localhost:${PORT}/?level=${LV}&go=1&unlockall=1`, { waitUntil:'load', timeout:900000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:900000 });
const r = await p.evaluate(async () => {
  const THREE = await import('three');
  const t = window.__game.track;
  if (!t.T?.glacier) return { err: 'this level has no glacier in its theme' };
  const read = (mesh) => {
    const pos = mesh.geometry.attributes.position;
    const m = new THREE.Matrix4(), P = new THREE.Vector3();
    const q = new THREE.Quaternion(), sc = new THREE.Vector3(), v = new THREE.Vector3();
    const out = [];
    for (let k = 0; k < mesh.count; k++) {
      mesh.getMatrixAt(k, m); m.decompose(P, q, sc);
      if (P.y < -9999) { out.push({ k, dropped: true }); continue; }
      let top = -1e9, maxr = 0;
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i).applyMatrix4(m);
        if (v.y > top) top = v.y;
        const rr = Math.hypot(v.x - P.x, v.z - P.z);
        if (rr > maxr) maxr = rr;
      }
      let near = null;
      for (let i = 0; i < t.N; i++) {
        const c = t.center[i];
        const d = Math.hypot(c.x - P.x, c.z - P.z) - maxr;
        const deg = d <= 0 ? 90 : Math.atan2(top - (c.y + 1.6), d) * 180 / Math.PI;
        if (!near || deg > near.deg) near = { i, d, deg };
      }
      out.push({ k, x: P.x, z: P.z, w: +sc.x.toFixed(0), h: +sc.y.toFixed(0),
        flank: +maxr.toFixed(0), d: +near.d.toFixed(1), deg: +near.deg.toFixed(1),
        road: +(t.widthAt?.(near.i) ?? 9).toFixed(1) });
    }
    return out;
  };
  const first = t.group.children.find((o) => o.name === 'glacier');
  if (!first) return { err: "no InstancedMesh named 'glacier' to compare against" };
  const before = read(first);
  // walk the lap onto the tongue's wedge: the centroid of the road goes to the
  // middle of the ring, at the tongue's own azimuth
  const A0 = -2.25, R = 700;
  let cx = 0, cz = 0;
  for (let i = 0; i < t.N; i++) { cx += t.center[i].x; cz += t.center[i].z; }
  cx /= t.N; cz /= t.N;
  const ox = Math.cos(A0) * R - cx, oz = Math.sin(A0) * R - cz;
  for (let i = 0; i < t.N; i++) { t.center[i].x += ox; t.center[i].z += oz; }
  t._buildSampleGrid();
  t._buildGlacier(new THREE.Matrix4());
  const meshes = t.group.children.filter((o) => o.name === 'glacier');
  if (meshes.length < 2) return { err: 'the forced rebuild produced no second glacier mesh' };
  const after = read(meshes[meshes.length - 1]);
  return { before, after, moved: { ox: +ox.toFixed(0), oz: +oz.toFixed(0) } };
});
if (r.err) { console.log('PROBE FAILED: ' + r.err); await b.close(); process.exit(2); }
console.log(`road translated by (${r.moved.ox}, ${r.moved.oz}) onto the tongue`);
let walked = 0, shrunk = 0, dropped = 0, over = 0, on = 0;
for (const a of r.after) {
  const bfr = r.before[a.k];
  if (a.dropped) { dropped++; console.log(`   slab ${a.k}: DROPPED`); continue; }
  const dx = Math.hypot(a.x - bfr.x, a.z - bfr.z);
  if (dx > 1) walked++;
  if (a.w < bfr.w - 1) shrunk++;
  // the OUTCOME, not a restatement of the builder's arithmetic: the footprint
  // floor is `roadWidth + 24` of clear ground, and the loom rule is the angle
  if (a.deg > 41) over++;
  if (a.d <= 0) on++;
  console.log(`   slab ${a.k}: walked ${dx.toFixed(0)} u, ${a.w}w x ${a.h}h`
    + `, worst station ${a.deg} deg at ${a.d} u (floor ${(a.road + 24).toFixed(0)})`
    + (a.deg > 41 ? '  LOOMS' : '') + (a.d <= 0 ? '  ON THE ROAD' : ''));
}
console.log(`walked ${walked}, shrank ${shrunk}, dropped ${dropped}, looming ${over}, on the road ${on}`);
if (dropped === r.after.length) console.log('EVERY SLAB DROPPED — clearing the road by deleting the glacier');
if (errs.length) console.log('errors:', errs.slice(0, 3));
const bad = errs.length || over || on || !walked;
if (!walked) console.log('NOTHING MOVED — the clearance branch never ran, this run measured nothing');
console.log(bad ? 'FAIL' : `PASS: every slab cleared the road it was planted on`);
await b.close();
process.exit(bad ? 1 : 0);
