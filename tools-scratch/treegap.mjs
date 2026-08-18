/* EVERY TREE, AND WHAT IS UNDER IT. Three numbers per plant so the answer
 * cannot be blamed on one of them: the seat the builder chose, the analytic
 * ground `terrainHeight` reports there, and the DRAWN ground a ray finds. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8920';
const MIN = Number(process.env.MIN ?? 1.0);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 420, height: 260 } });
page.setDefaultTimeout(600000);
let grand = 0, worldsHit = 0;
for (const id of process.argv.slice(2)) {
  await page.goto(`${BASE}/?level=${id}&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
  await page.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 600000 });
  const r = await page.evaluate(async (min) => {
    const THREE = await import('three');
    const g = window.__game, t = g.track;
    g.scene.updateMatrixWorld(true);
    const targets = [];
    t.group.traverse((o) => {
      if (!o.isMesh || !o.geometry || !o.visible) return;
      // NOT THE FLORA ITSELF. Every plant in this game is an InstancedMesh and
      // the ray starts ABOVE the plant, so leaving them in means the first
      // thing hit is the tree's own canopy: the second cut reported 743 of 743
      // PINE VALLEY trees "sunk 25 u" with a drawn ground of +23.5 where the
      // terrain is -1.6, which is the crown, not the ground.
      if (o.isInstancedMesh) return;
      if (/^(sky|horizon|cloud|bird|rain|snow|dust|spark|smoke|fog|particle)/i.test(o.name)) return;
      targets.push(o);
    });
    const rc = new THREE.Raycaster(); rc.far = 600;
    const down = new THREE.Vector3(0, -1, 0), org = new THREE.Vector3();
    const buckets = new Map();
    let tot = 0;
    for (const tr of (t.trees ?? [])) {
      tot++;
      const y = tr.y ?? 0;
      const th = t.terrainHeight(tr.x, tr.z);
      org.set(tr.x, y + 60, tr.z);
      rc.set(org, down);
      const hits = rc.intersectObjects(targets, false);
      // THE TOPMOST SURFACE, WHATEVER HEIGHT IT IS AT — and the gap is
      // SIGNED. The first cut took the first hit at or below the seat, which
      // silently turned every BURIED plant into a hanging one: the drawn
      // ground above it was skipped and the ray fell through to a skirt mesh
      // at a constant -7.86, so 367 of 743 PINE VALLEY trees "hung 16.7 u"
      // when what they actually did was sit 0.75 u too low. A gap that comes
      // back as the same number three times is a fixture, not a measurement.
      const drawn = hits.length ? hits[0].point.y : null;
      const gap = drawn === null ? 999 : y - drawn;
      if (!(Math.abs(gap) > min)) continue;
      const k = tr.kind ?? '?';
      const bk = buckets.get(k) ?? { n: 0, worst: 0, at: null, up: 0, down: 0 };
      bk.n++; if (gap > 0) bk.up = (bk.up ?? 0) + 1; else bk.down = (bk.down ?? 0) + 1;
      if (Math.abs(gap) > Math.abs(bk.worst)) { bk.worst = gap; bk.at = [Math.round(tr.x), Math.round(tr.z), +y.toFixed(2), +th.toFixed(2), drawn === null ? null : +drawn.toFixed(2)]; }
      buckets.set(k, bk);
    }
    return { name: t.level?.name, tot,
      rows: [...buckets.entries()].map(([k, v]) => ({ k, ...v })).sort((a, c) => c.n - a.n) };
  }, MIN);
  const n = r.rows.reduce((a, x) => a + x.n, 0);
  grand += n; if (n) worldsHit++;
  if (!n) { console.log(`${String(id).padStart(2)} ${(r.name ?? '?').padEnd(20)} clean (${r.tot})`); continue; }
  console.log(`${String(id).padStart(2)} ${(r.name ?? '?').padEnd(20)} ${n}/${r.tot} hang > ${MIN} u`);
  for (const row of r.rows.slice(0, 5)) {
    console.log(`      ${row.k.padEnd(12)} ${String(row.n).padStart(4)}  (${row.up} float / ${row.down} sunk)  worst ${row.worst === 999 ? 'NOTHING UNDER IT' : row.worst.toFixed(1) + ' u'}  [x,z,seatY,terrainH,drawnY]=${JSON.stringify(row.at)}`);
  }
}
console.log(`\n===== ${grand} hanging plants across ${worldsHit} worlds =====`);
await b.close();
