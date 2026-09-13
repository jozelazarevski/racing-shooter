/* ARE THE WHEELS ROUND? Measured on the built mesh, not judged from a render.
 *
 * The tyre cylinder is built about Y and then `rotateZ(PI/2)`, so its AXLE
 * runs along X and its circular cross-section lies in the Y-Z plane. Roundness
 * is therefore Y extent == Z extent, and the axle extent is the tread width.
 * Anything that scales Y and Z differently makes an ellipse.
 *
 * Reports every wheel of every car in the catalogue at each tyre upgrade
 * level, since the upgrade is the only thing that touches wheel scale.
 * Throws if a car exposes no wheels at all, so a rename cannot make this
 * report "all round" over an empty list.
 */
import { chromium } from 'playwright-core';
const PORT = process.env.PORT ?? 8901;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 320, height: 480 } });
p.setDefaultTimeout(600000);
await p.goto(`http://localhost:${PORT}/?level=1&unlockall=1`, { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
const out = await p.evaluate(async () => {
  const THREE = await import('three');
  const mod = await import('./src/vehicles.js');
  const rows = [];
  for (const car of mod.CAR_CATALOG) {
    for (const lvl of [0, 2, 4]) {
      // the tyre scale lives in `applyUpgradeKit`, not in `buildCarMesh` —
      // guessing the build signature is how the first run of this probe
      // reported scale 1,1,1 at every level and never touched the upgrade path
      const mesh = mod.buildCarMesh(car.spec);
      if (lvl) mod.applyUpgradeKit(mesh, { tires: lvl });
      const ws = mesh.userData?.wheels ?? [];
      if (!ws.length) throw new Error(`${car.key}: no wheels exposed`);
      let worst = null;
      for (const w of ws) {
        w.updateMatrixWorld(true);
        const bx = new THREE.Box3().setFromObject(w);
        const s = bx.getSize(new THREE.Vector3());
        const round = Math.max(s.y, s.z) / Math.max(1e-6, Math.min(s.y, s.z));
        if (!worst || round > worst.round) worst = {
          round: +round.toFixed(3), y: +s.y.toFixed(3), z: +s.z.toFixed(3),
          width: +s.x.toFixed(3), scale: [+w.scale.x.toFixed(2), +w.scale.y.toFixed(2), +w.scale.z.toFixed(2)] };
      }
      rows.push({ car: car.key, tires: lvl, ...worst });
    }
  }
  return rows;
});
let bad = 0;
for (const r of out) {
  const off = r.round > 1.01;
  if (off) bad++;
  console.log(`${r.car.padEnd(10)} tires ${r.tires}  y ${r.y}  z ${r.z}  width ${r.width}`
    + `  scale ${r.scale.join(',')}  ROUNDNESS ${r.round}${off ? '  <-- ELLIPSE' : ''}`);
}
console.log(bad ? `FAIL: ${bad} of ${out.length} wheel sets are not round`
  : `PASS: all ${out.length} wheel sets round`);
await b.close();
process.exit(bad ? 1 : 0);
