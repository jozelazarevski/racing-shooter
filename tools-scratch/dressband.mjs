/* HOW FAR FROM THE ROAD DOES THE WORLD STOP BEING DRESSED?
 *
 * The off-road sweep's climbs photographed bare hillsides once they were a few
 * hundred units out — no trees, no rocks, nothing but flat-shaded ground. That
 * was an impression from screenshots; this counts it. Every item the flora
 * builders registered in `track.trees`, plus the instanced scatter, bucketed by
 * distance to the nearest carriageway.
 *
 * Density, not raw count: a band 300-600 u out has far more area than one
 * 0-30 u out, so a raw tally would say the far field is well dressed on every
 * world in the game. Reported per 10,000 square units of the annulus.
 *
 * AND IT COUNTS THE INSTANCED SCENERY, NOT JUST `track.trees`. The first cut
 * read only that array and reported 0.00 items per 10,000 u² beyond 600 u on
 * every world — which is true of `trees` and false of the world. `trees` is
 * the COLLIDABLE register; `_buildDistantStand` adds up to 300 grove clumps at
 * radius 640-900 and never touches it, because nothing out there is meant to
 * be hit. Reading one register and describing the scene is the same mistake as
 * reading a plan and describing a mesh.
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8920';
const BANDS = [[0, 30], [30, 80], [80, 160], [160, 300], [300, 600], [600, 1100]];
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 420, height: 260 } });
page.setDefaultTimeout(600000);
const tot = BANDS.map(() => ({ n: 0, area: 0, worlds: 0 }));
for (const id of process.argv.slice(2)) {
  await page.goto(`${BASE}/?level=${id}&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
  await page.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 600000 });
  const r = await page.evaluate((BANDS) => {
    const g = window.__game, t = g.track;
    const rows = BANDS.map(() => 0);
    const collid = BANDS.map(() => 0);
    for (const it of (t.trees ?? [])) {
      const d = t._distToTrack(it.x, it.z);
      const bi = BANDS.findIndex(([a, c]) => d >= a && d < c);
      if (bi >= 0) { rows[bi]++; collid[bi]++; }
    }
    // every instanced prop that is drawn but not registered: the distant
    // stand, the rock and tuft fields, anything else scattered as instances
    const seen = new Set();
    for (const it of (t.trees ?? [])) seen.add(`${Math.round(it.x)},${Math.round(it.z)}`);
    const mat = new (t.center[0].constructor.prototype.constructor === Object
      ? Object : Object)();
    // ...AND WHERE THE DISTANT STAND'S NEAREST CLUMP LANDS. It is placed by
    // RADIUS FROM THE WORLD ORIGIN (640-900 u) and it is deliberately not
    // collidable, because nothing that far out is meant to be hit. A lap is
    // not a circle, though: on a route that reaches r 600 those two facts
    // combine into trees beside the road that a car drives straight through.
    let standMin = Infinity, standAt = null, standN = 0;
    t.group.traverse((o) => {
      if (o.name === 'distant-stand' && o.isInstancedMesh) {
        const a2 = o.instanceMatrix.array;
        standN += o.count;
        for (let k = 0; k < o.count; k++) {
          const x = a2[k * 16 + 12], z = a2[k * 16 + 14];
          const d = t._distToTrack(x, z);
          if (d < standMin) { standMin = d; standAt = [Math.round(x), Math.round(z)]; }
        }
      }
      if (!o.isInstancedMesh || !o.count) return;
      const arr = o.instanceMatrix.array;
      for (let k = 0; k < o.count; k++) {
        const x = arr[k * 16 + 12], z = arr[k * 16 + 14];
        if (seen.has(`${Math.round(x)},${Math.round(z)}`)) continue;
        const d = t._distToTrack(x, z);
        const bi = BANDS.findIndex(([a, c]) => d >= a && d < c);
        if (bi >= 0) rows[bi]++;
      }
    });
    // area of each band, sampled rather than integrated: a lap is not a circle
    const SAMP = 260, R = 1100;
    const area = BANDS.map(() => 0);
    for (let k = 0; k < SAMP * SAMP; k++) {
      const x = ((k % SAMP) / SAMP - 0.5) * 2 * R;
      const z = ((k / SAMP | 0) / SAMP - 0.5) * 2 * R;
      const d = t._distToTrack(x, z);
      const bi = BANDS.findIndex(([a, c]) => d >= a && d < c);
      if (bi >= 0) area[bi]++;
    }
    const cell = (2 * R / SAMP) ** 2;
    return { name: t.level?.name, rows, collid, area: area.map((a) => a * cell),
      trees: (t.trees ?? []).length,
      standN, standMin: Number.isFinite(standMin) ? +standMin.toFixed(1) : null, standAt };
  }, BANDS);
  console.log(`\n${String(id).padStart(2)} ${(r.name ?? '?').padEnd(20)} ${r.trees} collidable items`
    + `   |  distant stand: ${r.standN} clumps, nearest ${r.standMin} u from the road`
    + (r.standAt ? ` at ${JSON.stringify(r.standAt)}` : '')
    + (r.standMin !== null && r.standMin < 40 ? '   <-- DRIVE-THROUGH TREES BESIDE THE ROAD' : ''));
  r.rows.forEach((n, i) => {
    const [a, c] = BANDS[i];
    const per = r.area[i] ? (n / r.area[i] * 10000) : 0;
    tot[i].n += n; tot[i].area += r.area[i]; tot[i].worlds++;
    console.log(`     ${String(a).padStart(4)}-${String(c).padStart(4)} u:  ${String(n).padStart(5)} items  `
      + `${per.toFixed(2).padStart(6)} per 10,000 u²   (${r.collid[i]} of them collidable)`);
  });
}
console.log('\n===== ROSTER =====');
tot.forEach((x, i) => {
  const [a, c] = BANDS[i];
  console.log(`   ${String(a).padStart(4)}-${String(c).padStart(4)} u:  ${String(x.n).padStart(6)} items  `
    + `${(x.area ? x.n / x.area * 10000 : 0).toFixed(2).padStart(6)} per 10,000 u²`);
});
await b.close();
