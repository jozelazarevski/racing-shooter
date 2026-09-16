/* WATER LYING ON THE CARRIAGEWAY — the whole roster, every water surface.
 *
 * "River in the bridge??" names a world I have been guessing at. Rather than
 * guess, measure the PROPERTY: is there a water surface inside the road
 * corridor, at or above the deck. That is theme-agnostic and finds the world
 * on its own.
 *
 * A ford is a legitimate instance of that property — the wash sits ON the deck
 * by design — so the report also says how far the offending water is from the
 * nearest planned ford and from the nearest stone bridge. Water on the deck at
 * a ford is the feature; water on the deck 200 u from any ford, or water on the
 * deck WHERE A STONE BRIDGE SPANS, is the defect.
 *
 * (A stone bridge has no deck mesh — parapets, arch faces, and a hump baked
 * into `center[].y`. The road IS the deck. Raycasting for deck geometry finds
 * nothing, which is what wasted the first attempt at this.)
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 400, height: 260 } });
p.setDefaultTimeout(900000);
const WORLDS = (process.env.WORLDS ?? Array.from({ length: 67 }, (_, i) => i + 1).join(','))
  .split(',').filter(Boolean);
console.log('world                    worst water-over-deck   at        ford  bridge  rivY');
for (const id of WORLDS) {
  await p.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 900000 })
    .catch(() => {});
  const ok = await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 900000 })
    .then(() => 1).catch(() => 0);
  if (!ok) { console.log(`level ${id}: did not build`); continue; }
  const r = await p.evaluate(async () => {
    const THREE = await import('three');
    const t = window.__game.track;
    const waters = [];
    t.group.traverse((o) => {
      if (!o.geometry?.attributes?.position) return;
      const nm = (o.name || '') + '<' + (o.parent?.name || '');
      if (/water|river|lake|sea|flume|puddle|ford/i.test(nm) && !/bank|bed|foam|crossings/i.test(nm)) waters.push(o);
    });
    const bridges = [];
    t.group.traverse((o) => {
      if (o.name !== 'stone-bridge') return;
      const c = new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3());
      bridges.push(c);
    });
    const fords = t.fords ?? [];
    const V = new THREE.Vector3(), P = new THREE.Vector3();
    let worst = -Infinity, wx = 0, wz = 0, wf = null, wb = null, n = 0;
    let rlo = Infinity, rhi = -Infinity;
    for (const w of waters) {
      const pos = w.geometry.attributes.position; w.updateWorldMatrix(true, false);
      const isRiver = /river-water/i.test(w.name || '');
      for (let i = 0; i < pos.count; i++) {
        V.fromBufferAttribute(pos, i); w.localToWorld(V);
        if (isRiver) { if (V.y < rlo) rlo = V.y; if (V.y > rhi) rhi = V.y; }
        P.set(V.x, 0, V.z);
        const idx = t.nearestIndex(P);
        const c = t.center[idx];
        // inside the carriageway?
        if (Math.hypot(V.x - c.x, V.z - c.z) > t.widthAt(idx) * 0.5) continue;
        n++;
        const over = V.y - c.y;
        if (over > worst) {
          worst = over; wx = Math.round(V.x); wz = Math.round(V.z);
          wf = fords.length ? Math.min(...fords.map((f) => Math.hypot(f.x - V.x, f.z - V.z))) : null;
          wb = bridges.length ? Math.min(...bridges.map((c2) => Math.hypot(c2.x - V.x, c2.z - V.z))) : null;
        }
      }
    }
    return { name: window.__game.level?.name, waters: waters.length, onRoad: n,
      worst: worst > -Infinity ? +worst.toFixed(2) : null, wx, wz,
      wf: wf == null ? null : +wf.toFixed(0), wb: wb == null ? null : +wb.toFixed(0),
      rlo: rlo < Infinity ? +rlo.toFixed(1) : null, rhi: rhi > -Infinity ? +rhi.toFixed(1) : null };
  });
  console.log(`${String(r.name).padEnd(24)} ${String(r.worst ?? '—').padStart(7)} u  `
    + `${String(r.wx).padStart(6)},${String(r.wz).padEnd(6)} `
    + `${String(r.wf ?? '—').padStart(5)} ${String(r.wb ?? '—').padStart(6)}  `
    + `${r.rlo}..${r.rhi}  [${r.waters} mesh, ${r.onRoad} verts on road]`);
}
await b.close();
