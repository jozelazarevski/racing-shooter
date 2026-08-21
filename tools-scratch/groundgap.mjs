/* THE DRAWN GROUND AGAINST THE ANALYTIC GROUND, BY DISTANCE FROM THE ROAD.
 *
 * `tests/tool-ground-mismatch.mjs` asks this question at the carriageway, where
 * a step is an invisible wall. This asks it OUT IN THE FIELD, because that is
 * where the trees are: PINE VALLEY seats a pine at y = 8.8 where
 * `terrainHeight` says 9.56, and a ray straight down from it falls 16.7 u
 * before it hits anything drawn. One of those two surfaces is not the one the
 * flora is standing on.
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8920';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 420, height: 260 } });
page.setDefaultTimeout(600000);
for (const id of process.argv.slice(2)) {
  await page.goto(`${BASE}/?level=${id}&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
  await page.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 600000 });
  const r = await page.evaluate(async () => {
    const THREE = await import('three');
    const g = window.__game, t = g.track;
    g.scene.updateMatrixWorld(true);
    const targets = [];
    t.group.traverse((o) => {
      if (!o.isMesh || !o.geometry || !o.visible) return;
      if (/^(sky|horizon|cloud|bird|rain|snow|dust|spark|smoke|fog|particle)/i.test(o.name)) return;
      targets.push(o);
    });
    const rc = new THREE.Raycaster(); rc.far = 900;
    const down = new THREE.Vector3(0, -1, 0), org = new THREE.Vector3();
    const bands = [[0, 20], [20, 60], [60, 140], [140, 300], [300, 600], [600, 1200]];
    const acc = bands.map(() => ({ n: 0, sum: 0, worst: 0, at: null }));
    for (let k = 0; k < 4000; k++) {
      const i = (Math.random() * t.N) | 0;
      const d = Math.random() * 1200;
      const side = Math.random() < 0.5 ? 1 : -1;
      const p = t.pointAt(i, side * d);
      const th = t.terrainHeight(p.x, p.z);
      org.set(p.x, th + 220, p.z);
      rc.set(org, down);
      const hits = rc.intersectObjects(targets, false);
      if (!hits.length) continue;
      const drawn = hits[0].point.y;
      const gap = th - drawn;
      const bi = bands.findIndex(([a, c]) => d >= a && d < c);
      if (bi < 0) continue;
      const A = acc[bi];
      A.n++; A.sum += Math.abs(gap);
      if (Math.abs(gap) > Math.abs(A.worst)) { A.worst = gap; A.at = [Math.round(p.x), Math.round(p.z)]; }
    }
    return { name: t.level?.name, rows: bands.map(([a, c], i2) => ({
      band: `${a}-${c}`, n: acc[i2].n,
      mean: acc[i2].n ? +(acc[i2].sum / acc[i2].n).toFixed(2) : 0,
      worst: +acc[i2].worst.toFixed(2), at: acc[i2].at })) };
  });
  console.log(`\n=== ${id} ${r.name} — terrainHeight() minus the DRAWN ground ===`);
  for (const row of r.rows) {
    console.log(`   ${row.band.padStart(9)} u off the road   n=${String(row.n).padStart(4)}   mean |gap| ${String(row.mean).padStart(6)}   worst ${String(row.worst).padStart(7)} at ${JSON.stringify(row.at)}`);
  }
}
await b.close();
