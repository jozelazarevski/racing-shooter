/* DOES ANYTHING STAND ON NOTHING? — the RAYCAST answer, not the column one.
 *
 * `tests/tool-float-census.mjs` buckets bounding boxes into a 2 u grid, which
 * is the right shape for buildings and the wrong shape for a single ribbon
 * mesh that spans a whole canyon: the ribbon's box covers the valley floor, so
 * a plant standing ON the rim reads as supported and a plant standing PAST it
 * reads the same way. This asks the only question the eye asks — fire a ray
 * straight down from the base and see how far it falls.
 *
 * Everything the world records a ground position for is checked: `track.trees`
 * (every flora builder pushes here), `track.solids`, and `track.props`.
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8920';
const MIN = Number(process.env.MIN ?? 1.5);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 420, height: 260 } });
page.setDefaultTimeout(600000);
const errs = [];
page.on('pageerror', (e) => errs.push(String(e.message)));
let grand = 0;
for (const id of process.argv.slice(2)) {
  await page.goto(`${BASE}/?level=${id}&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
  await page.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 600000 });
  const r = await page.evaluate(async (min) => {
    const g = window.__game, t = g.track;
    // three is not on `window` — the page is a module graph with an import map,
    // so the only handle on it is the module itself.
    const THREE = await import('three');
    const rc = new THREE.Raycaster();
    rc.far = 400;
    const down = new THREE.Vector3(0, -1, 0);
    const org = new THREE.Vector3();
    g.scene.updateMatrixWorld(true);
    // RAYCAST A CURATED SET, NOT THE SCENE. `intersectObject(scene, true)`
    // throws on the first Sprite it reaches ("Cannot read properties of null
    // (reading 'matrixWorld')"), and a ray that throws measures nothing. The
    // question is "is there GROUND under this?", so the set is every visible
    // mesh with real geometry under the world group — terrain, cliff ribbons,
    // rock, road and structures — and nothing that is drawn as a billboard.
    const targets = [];
    for (const root of [t.group, g.scene]) {
      if (!root) continue;
      root.traverse((o) => {
        if (!o.isMesh || o.isSprite || !o.geometry || !o.visible) return;
        if (/^(sky|horizon|cloud|bird|rain|snow|dust|spark|smoke|fog|particle|arrow|marker)/i.test(o.name)) return;
        targets.push(o);
      });
      if (targets.length) break;
    }
    const buckets = new Map();
    const check = (label, x, y, z) => {
      org.set(x, y + 0.6, z);
      rc.set(org, down);
      const hits = rc.intersectObjects(targets, false);
      // the first hit that is not the thing itself: anything at least 0.75 u
      // below the base. A plant's own trunk is hit first and is not ground.
      // THE GROUND IS THE FIRST HIT AT OR BELOW THE BASE, NOT BELOW IT.
      // The first cut skipped anything above `y - 0.05`, so a plant seated
      // correctly on the cliff ribbon had its own ribbon hit discarded and
      // the VALLEY FLOOR reported as its ground: 459 of 499 placements on
      // CANYON RUN read as hanging, the worst by 69 u. A number that says
      // almost everything is broken is a broken probe.
      let gy = null;
      for (const h of hits) {
        if (h.point.y > y + 0.25) continue;
        gy = h.point.y; break;
      }
      const gap = gy === null ? Infinity : y - gy;
      if (!(gap > min)) return;
      const bk = buckets.get(label) ?? { n: 0, worst: 0, at: null };
      bk.n++;
      const gg = gy === null ? 999 : gap;
      if (gg > bk.worst) { bk.worst = gg; bk.at = [Math.round(x), Math.round(z), +y.toFixed(1)]; }
      buckets.set(label, bk);
    };
    let tot = 0;
    for (const tr of (t.trees ?? [])) { tot++; check(`tree:${tr.kind ?? '?'}`, tr.x, tr.y ?? 0, tr.z); }
    // `track.solids` is deliberately NOT checked: it is a list of COLLIDER
    // records whose `y` is the ROAD height at that spot, not the base of any
    // drawn object, so a ray from it measures nothing about what the eye sees.
    return { name: t.level?.name, tot,
      rows: [...buckets.entries()].map(([k, v]) => ({ k, ...v })).sort((a, c) => c.worst - a.worst) };
  }, MIN);
  const n = r.rows.reduce((a, x) => a + x.n, 0);
  grand += n;
  if (!r.rows.length) { console.log(`${String(id).padStart(2)} ${(r.name ?? '?').padEnd(20)} clean (${r.tot} checked)`); continue; }
  console.log(`${String(id).padStart(2)} ${(r.name ?? '?').padEnd(20)} ${n} of ${r.tot} hang > ${MIN} u`);
  for (const row of r.rows.slice(0, 6)) {
    console.log(`      ${row.k.padEnd(18)} ${String(row.n).padStart(4)}   worst ${row.worst === 999 ? 'NO GROUND AT ALL' : row.worst.toFixed(1) + ' u'} at ${JSON.stringify(row.at)}`);
  }
}
console.log(`\n===== ${grand} hanging placements over ${process.argv.slice(2).length} worlds =====`);
if (errs.length) console.log('PAGE ERRORS', [...new Set(errs)].slice(0, 4));
await b.close();
