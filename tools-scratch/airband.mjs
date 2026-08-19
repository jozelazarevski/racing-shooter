/* WHERE IS THE WATER STANDING PROUD OF THE GROUND — as a function of how far
 * that station is from the road.
 *
 * `_blendHeight` fades the river's channel carve to nothing over d = 22 -> 9 u
 * from the CARRIAGEWAY, so a ford stays a shallow wash instead of a trench.
 * The water ribbon is drawn at the bed profile regardless. If that fade is why
 * PIKES PEAK and REDWOOD RAMPAGE have slabs of water hanging over a hillside,
 * the air will be concentrated inside that band and absent outside it. If it
 * is spread evenly with distance, the fade is not the cause and this is the
 * wrong fix.
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8920';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 420, height: 260 } });
page.setDefaultTimeout(600000);
const BANDS = [[0, 9], [9, 22], [22, 40], [40, 80], [80, 200], [200, 1e9]];
for (const id of process.argv.slice(2)) {
  await page.goto(`${BASE}/?level=${id}&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
  await page.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 600000 });
  const r = await page.evaluate((BANDS) => {
    const g = window.__game, t = g.track, R = t._river;
    if (!R) return { name: t.level?.name, none: true };
    g.scene.updateMatrixWorld(true);
    let w = null;
    t.group.traverse((o) => { if (o.name === 'river-water' && o.geometry) w = o; });
    if (!w) return { name: t.level?.name, none: true };
    w.updateMatrixWorld(true);
    const pa = w.geometry.attributes.position, m = w.matrixWorld.elements;
    const rows = BANDS.map(() => ({ n: 0, air: 0, worst: 0 }));
    for (let i = 0; i < pa.count; i++) {
      const x0 = pa.getX(i), y0 = pa.getY(i), z0 = pa.getZ(i);
      const X = m[0] * x0 + m[4] * y0 + m[8] * z0 + m[12];
      const Y = m[1] * x0 + m[5] * y0 + m[9] * z0 + m[13];
      const Z = m[2] * x0 + m[6] * y0 + m[10] * z0 + m[14];
      if (Math.hypot(X, Z) > 1620) continue;
      const d = t._distToTrack(X, Z);
      // AGAINST THE GROUND THAT IS DRAWN, not the analytic one. `track.js`
      // documents the difference and why it matters: the visible ground is a
      // 10 u triangle lattice, and "between two vertices the drawn surface is
      // the CHORD, and where the field bends faster than a 10 u cell can
      // follow, the chord runs well below the curve" — measured at 27 u of air
      // under a boulder whose analytic seating error was 0.00. A river channel
      // is about one cell wide at the floor, so the lattice can step straight
      // over the cut and leave the water lying on an uncut hillside. Comparing
      // water against `terrainHeight` cannot see any of that.
      const drawn = t._drawnGroundY ? t._drawnGroundY(X, Z) : null;
      const gY = drawn == null ? t.terrainHeight(X, Z) : drawn;
      const air = Y - gY;
      const bi = BANDS.findIndex(([a, c]) => d >= a && d < c);
      if (bi < 0) continue;
      const R2 = rows[bi];
      R2.n++;
      if (air > 1.5) R2.air++;
      if (air > R2.worst) R2.worst = air;
    }
    return { name: t.level?.name, rows };
  }, BANDS);
  if (r.none) { console.log(`${id} ${r.name}: no river`); continue; }
  console.log(`\n${String(id).padStart(2)} ${r.name}`);
  r.rows.forEach((x, i) => {
    const [a, c] = BANDS[i];
    if (!x.n) return;
    console.log(`     ${String(a).padStart(3)}-${c > 1e8 ? '  +' : String(c).padStart(3)} u from the road: `
      + `${String(x.air).padStart(5)}/${String(x.n).padStart(5)} vertices over 1.5 u above the ground `
      + `(${(x.air / x.n * 100).toFixed(1)}%), worst ${x.worst.toFixed(2)} u`);
  });
}
await b.close();
