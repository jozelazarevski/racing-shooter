/* WHY IS THE WATER ON THE ROAD AT REDWOOD RAMPAGE?
 *
 * `_buildRiver` PASS 2b raises the surface to keep the ribbon's EDGES out of
 * the ground, and suppresses that raise at a "culvert" — a crossing that is not
 * a planned ford, where the river must pass under the embankment:
 *
 *     const culvert = f.df < 24 && (fordDist(...) > 46 || |deckC - surf| > 9);
 *
 * `f.df` is the distance from the STATION — the ribbon's CENTRELINE — to the
 * road. The ribbon is up to ~20 u wide. So a station 25 u from the road is not
 * a culvert by this test, while its inner edge is 5 u from the centreline and
 * sitting squarely on the carriageway, where the raise fires unopposed.
 *
 * This finds every water vertex lying inside the carriageway and prints, for
 * the station that owns it: df, half-width, and whether the culvert rule could
 * possibly have seen it. If df >= 24 at the offenders, that is the hole.
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 400, height: 260 } });
p.setDefaultTimeout(900000);
for (const id of (process.env.WORLDS ?? '12').split(',')) {
  await p.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 900000 });
  await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 900000 });
  const r = await p.evaluate(async () => {
    const THREE = await import('three');
    const t = window.__game.track, R = t._river;
    const waters = [];
    t.group.traverse((o) => { if (/river-water/i.test(o.name || '') && o.geometry) waters.push(o); });
    const fords = t.fords ?? [];
    const V = new THREE.Vector3(), P = new THREE.Vector3();
    const rows = [];
    for (const w of waters) {
      const pos = w.geometry.attributes.position; w.updateWorldMatrix(true, false);
      for (let i = 0; i < pos.count; i++) {
        V.fromBufferAttribute(pos, i); w.localToWorld(V);
        P.set(V.x, 0, V.z);
        const idx = t.nearestIndex(P);
        const c = t.center[idx];
        const lat = Math.hypot(V.x - c.x, V.z - c.z);
        if (lat > t.widthAt(idx) * 0.5) continue;
        const over = V.y - c.y;
        if (over < 0.05) continue;                        // under the deck is fine
        // which station owns this vertex? nearest point on the plan polyline
        const nr = t._riverNearest(V.x, V.z);
        const lp = R.line[nr.k];
        const df = t._distToTrackCoarse(lp.x, lp.z);      // the station's own df
        const half = (R.halfAt && R.halfAt[nr.k] != null) ? R.halfAt[nr.k] : R.half;
        const fd = fords.length ? Math.min(...fords.map((f) => Math.hypot(f.x - lp.x, f.z - lp.z))) : Infinity;
        rows.push({ x: Math.round(V.x), z: Math.round(V.z), over: +over.toFixed(2),
          df: +df.toFixed(1), half: +half.toFixed(1), fordDist: +fd.toFixed(0),
          culvertSeen: df < 24, lat: +lat.toFixed(1) });
      }
    }
    rows.sort((a, c2) => c2.over - a.over);
    return { name: window.__game.level?.name, n: rows.length, rows: rows.slice(0, 14),
      half: R.half, seen: rows.filter((q) => q.culvertSeen).length };
  });
  console.log(`\n${r.name}: ${r.n} water verts ON the carriageway and above the deck`
    + `  (R.half=${r.half}; the culvert rule could see ${r.seen} of them)`);
  console.log('   over    lat   station df   half  fordDist  culvert rule sees it?');
  for (const q of r.rows) {
    console.log(`  ${String(q.over).padStart(5)} u ${String(q.lat).padStart(5)} `
      + `${String(q.df).padStart(9)} ${String(q.half).padStart(6)} ${String(q.fordDist).padStart(9)}   ${q.culvertSeen}`);
  }
}
await b.close();
