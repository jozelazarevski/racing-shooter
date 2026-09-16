/* HOW CLOSE — AND HOW BIG — IS THE GLACIER FROM THE ROAD?
 *
 * `_buildGlacier` seats 14 ice slabs on an azimuth ring with no knowledge of
 * where the lap goes. Its sibling `_buildMassif` walks its cones out of the
 * way and then makes them stand back `LOOM` times their own height; the
 * glacier got neither rule. This measures, per slab, the gap from the drawn
 * flank to the nearest road centreline sample and the angle the slab's top
 * subtends from the driver's eye at that sample — the same two numbers the
 * massif's clearance is written in.
 *
 * FAILS LOUDLY if it cannot find its subject. The slabs are an InstancedMesh
 * named 'glacier' and are NOT pushed into `track.solids`, so a probe reading
 * the solids roster sees nothing and reports clean. This reads the instance
 * matrices and the slab's own geometry: every vertex is transformed to world
 * space, so the flank radius is the radius the player can SEE, per azimuth,
 * not an assumed circle.
 *
 *   LEVELS=21,66 node glacierloom.mjs
 */
import { chromium } from 'playwright-core';
const PORT = process.env.PORT ?? '8912';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 320, height: 480 } });
p.setDefaultTimeout(900000);
let bad = 0, missing = 0;
for (const lv of (process.env.LEVELS ?? '21,66').split(',')) {
  await p.goto(`http://localhost:${PORT}/?level=${lv}&go=1&unlockall=1`, { waitUntil:'load', timeout:900000 });
  await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:900000 });
  const r = await p.evaluate(async () => {
    const THREE = await import('three');
    const t = window.__game.track;
    if (!t.T?.glacier) return { err: 'this level has no glacier in its theme' };
    const mesh = t.group.children.find((o) => o.name === 'glacier');
    if (!mesh) return { err: "no InstancedMesh named 'glacier' in track.group" };
    const pos = mesh.geometry.attributes.position;
    if (!pos) return { err: 'glacier mesh has no position attribute' };
    const m = new THREE.Matrix4(), P = new THREE.Vector3();
    const q = new THREE.Quaternion(), sc = new THREE.Vector3(), v = new THREE.Vector3();
    const BINS = 72;
    const slabs = [];
    for (let k = 0; k < mesh.count; k++) {
      mesh.getMatrixAt(k, m); m.decompose(P, q, sc);
      if (P.y < -9999 || sc.x < 1e-3) { slabs.push({ k, dropped: true }); continue; }
      // world-space hull: max horizontal radius per azimuth bin, and the top
      const rad = new Float64Array(BINS);
      let top = -1e9, foot = 1e9, maxr = 0;
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i).applyMatrix4(m);
        if (v.y > top) top = v.y;
        if (v.y < foot) foot = v.y;
        const dx = v.x - P.x, dz = v.z - P.z;
        const rr = Math.hypot(dx, dz);
        if (rr > maxr) maxr = rr;
        let bn = Math.floor(((Math.atan2(dz, dx) + Math.PI) / (2 * Math.PI)) * BINS) % BINS;
        if (bn < 0) bn += BINS;
        if (rr > rad[bn]) rad[bn] = rr;
      }
      // widen each bin by its neighbours: a bin with no vertex must not read
      // as a notch of zero radius the road could sneak into
      const sm = rad.map((_, i) => Math.max(rad[(i + BINS - 1) % BINS], rad[i], rad[(i + 1) % BINS]));
      let near = null, loom = null;
      for (let i = 0; i < t.N; i++) {
        const c = t.center[i];
        const dx = c.x - P.x, dz = c.z - P.z;
        const dc = Math.hypot(dx, dz);
        let bn = Math.floor(((Math.atan2(dz, dx) + Math.PI) / (2 * Math.PI)) * BINS) % BINS;
        if (bn < 0) bn += BINS;
        const d = dc - sm[bn];                         // gap to the drawn flank
        const deg = d <= 0 ? 90
          : Math.atan2(top - (c.y + 1.6), d) * 180 / Math.PI;
        if (!near || d < near.d) near = { i, d, deg, dc };
        if (!loom || deg > loom.deg) loom = { i, d, deg, dc };
      }
      slabs.push({ k, x: +P.x.toFixed(0), z: +P.z.toFixed(0),
        r: +Math.hypot(P.x, P.z).toFixed(0),
        w: +(maxr * 2).toFixed(0), h: +(top - foot).toFixed(0), top: +top.toFixed(0),
        nearI: near.i, nearD: +near.d.toFixed(1), nearDeg: +near.deg.toFixed(1),
        loomI: loom.i, loomD: +loom.d.toFixed(1), loomDeg: +loom.deg.toFixed(1),
        road: +(t.widthAt?.(near.i) ?? 9).toFixed(1) });
    }
    return { name: t.T?.name ?? '', N: t.N, count: mesh.count, slabs };
  });
  if (r.err) { console.log(`L${lv} PROBE FAILED: ${r.err}`); missing++; continue; }
  const live = r.slabs.filter((s) => !s.dropped);
  console.log(`L${lv} ${r.name} — ${live.length}/${r.count} slabs live, ${r.N} stations`);
  for (const s of r.slabs) {
    if (s.dropped) { console.log(`   slab ${s.k}: DROPPED`); continue; }
    console.log(`   slab ${String(s.k).padStart(2)}: ${String(s.w).padStart(3)}w x ${String(s.h).padStart(3)}h  ring r=${s.r}`
      + `  nearest st ${s.nearI} gap ${s.nearD} u (${s.nearDeg} deg)`
      + `  worst st ${s.loomI} ${s.loomDeg} deg at ${s.loomD} u`
      + (s.loomDeg > 41 ? '   LOOMS' : '') + (s.nearD <= 0 ? '   ON THE ROAD' : ''));
  }
  const over = live.filter((s) => s.loomDeg > 41).length;
  const on = live.filter((s) => s.nearD <= 0).length;
  const worst = live.reduce((a, s) => (!a || s.loomDeg > a.loomDeg ? s : a), null);
  console.log(`   => ${on} slab(s) standing on a road, ${over} leaning over one`
    + (worst ? `, worst ${worst.loomDeg} deg (slab ${worst.k})` : ''));
  if (over || on) bad++;
}
if (missing) { console.log(`FAIL: probe could not find the glacier on ${missing} level(s)`); process.exitCode = 2; }
else console.log(bad ? `FAIL: ${bad} level(s) have a glacier slab over the road` : 'PASS: no slab stands on or leans over a road');
await b.close();
process.exit(missing ? 2 : (bad ? 1 : 0));
