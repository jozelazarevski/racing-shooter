/* WHAT IS ACTUALLY AT A FORD, AND WHAT IS ACTUALLY AT A STONE BRIDGE.
 *
 * Reported as "River in the bridge??". Two candidate mechanisms:
 *   (a) `_buildStoneBridges` picks "ground 4.5 u below the deck both sides,
 *       straight road" — a description of a river valley — and spaces its picks
 *       only from EACH OTHER, never from a ford. A bridge on a ford is a
 *       contradiction: if the road bridges the river there is no weir.
 *   (b) `_buildRiver` PASS 2 lifts the water TO the deck at a ford.
 * Together they would pour the river along the carriageway between two
 * masonry parapets.
 *
 * So: for every ford and every stone bridge, print the road height, the water
 * height, and the distance between them. No raycasts, no name-matching for
 * geometry that does not exist (a stone bridge has NO deck mesh — the road is
 * the deck, which is why the first probe found "0 deck meshes").
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 480, height: 320 } });
p.setDefaultTimeout(600000);
for (const id of (process.env.WORLDS ?? '31,35,43').split(',')) {
  await p.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
  const ok = await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 600000 })
    .then(() => 1).catch(() => 0);
  if (!ok) { console.log(`level ${id}: did not build`); continue; }
  const r = await p.evaluate(async () => {
    const THREE = await import('three');
    const t = window.__game.track;
    const waters = [];
    t.group.traverse((o) => {
      if (/river-water/i.test(o.name || '') && o.geometry?.attributes?.position) waters.push(o);
    });
    const V = new THREE.Vector3();
    // highest and lowest water vertex within `rad` of (x,z)
    const waterAt = (x, z, rad) => {
      let hi = -Infinity, lo = Infinity, n = 0;
      for (const w of waters) {
        const pos = w.geometry.attributes.position; w.updateWorldMatrix(true, false);
        for (let i = 0; i < pos.count; i++) {
          V.fromBufferAttribute(pos, i); w.localToWorld(V);
          if (Math.hypot(V.x - x, V.z - z) > rad) continue;
          n++; if (V.y > hi) hi = V.y; if (V.y < lo) lo = V.y;
        }
      }
      return { n, hi: n ? +hi.toFixed(2) : null, lo: n ? +lo.toFixed(2) : null };
    };
    const bridges = [];
    t.group.traverse((o) => {
      if (o.name !== 'stone-bridge') return;
      const c = new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3());
      bridges.push({ x: c.x, z: c.z, i: t.nearestIndex(new THREE.Vector3(c.x, 0, c.z)) });
    });
    const fords = (t.fords ?? []).map((f) => ({ i: f.i, x: f.x, z: f.z, y: +t.center[f.i].y.toFixed(2) }));
    const rows = [];
    for (const f of fords) {
      const w = waterAt(f.x, f.z, 20);
      let nb = Infinity;
      for (const br of bridges) nb = Math.min(nb, Math.hypot(br.x - f.x, br.z - f.z));
      rows.push({ what: 'ford  ', i: f.i, road: f.y, ...w, other: +nb.toFixed(1) });
    }
    for (const br of bridges) {
      const w = waterAt(br.x, br.z, 20);
      let nf = Infinity;
      for (const f of fords) nf = Math.min(nf, Math.hypot(br.x - f.x, br.z - f.z));
      rows.push({ what: 'bridge', i: br.i, road: +t.center[br.i].y.toFixed(2), ...w, other: +nf.toFixed(1) });
    }
    return { rows, waters: waters.length, name: window.__game.level?.name };
  });
  console.log(`\n${r.name}   (${r.waters} water mesh)`);
  console.log('  what     i    road   waterHi  waterLo  verts  dist to the other thing');
  for (const q of r.rows) {
    console.log(`  ${q.what} ${String(q.i).padStart(4)} ${String(q.road).padStart(7)} `
      + `${String(q.hi ?? '—').padStart(8)} ${String(q.lo ?? '—').padStart(8)} `
      + `${String(q.n).padStart(6)}   ${q.other} u`);
  }
}
await b.close();
