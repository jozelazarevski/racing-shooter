/* DOES EACH NAMED STRUCTURE STAND ON THE GROUND? — raycast, not column.
 *
 * `tests/tool-float-census.mjs` answers a DIFFERENT question (is any geometry
 * in this thing's 2 u column?) and on this roster it answers it wrongly three
 * ways: a single ribbon mesh spanning a canyon covers every column under it,
 * a boat on the sea has water beneath it and water is excluded, and a
 * foot-bridge is supposed to be in the air. All three showed up as defects.
 *
 * This asks the eye's question instead. For every named object it takes the
 * bottom of the world-space box and fires a ray down at the GROUND-BEARING
 * set only — the big non-instanced meshes: terrain, cliff ribbons, road, and
 * the structures themselves. A positive gap is air under the thing.
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8920';
const MIN = Number(process.env.MIN ?? 2.0);
// named groups whose whole point is to be in the air, each with its reason
const AIRBORNE = /^(foot-bridge|sky|horizon|cloud|bird|sea|water|river|lake|rain|snow|dust|spark|smoke|fog|particle|whale|flotilla|marina-|chopper|heli|banner|gantry|start-lights|oldtown-strings|.*shadow|.*-lightpool|.*-veil)/i;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 420, height: 260 } });
page.setDefaultTimeout(600000);
let grand = 0, hitWorlds = 0;
for (const id of process.argv.slice(2)) {
  await page.goto(`${BASE}/?level=${id}&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
  await page.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 600000 });
  const r = await page.evaluate(async ({ min, air }) => {
    const THREE = await import('three');
    const AIR = new RegExp(air.source, air.flags);
    const g = window.__game, t = g.track;
    g.scene.updateMatrixWorld(true);
    // GROUND is what a thing can stand on: the big drawn surfaces. Instanced
    // flora and the object under test are not ground.
    const ground = [];
    t.group.traverse((o) => {
      if (!o.isMesh || o.isInstancedMesh || !o.geometry || !o.visible) return;
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
      const bb = o.geometry.boundingBox;
      const area = (bb.max.x - bb.min.x) * (bb.max.z - bb.min.z);
      if (area < 2000) return;                    // a wall is not a floor
      ground.push(o);
    });
    const rc = new THREE.Raycaster(); rc.far = 900;
    const down = new THREE.Vector3(0, -1, 0), org = new THREE.Vector3();
    const box = new THREE.Box3();
    const buckets = new Map();
    let tot = 0;
    const walk = (o, label) => {
      const name = o.name || label;
      if (name && AIR.test(name)) return;
      // a named group is measured as ONE object; unnamed children inherit
      if (o.isMesh && o.geometry) {
        box.setFromObject(o);
        if (!isFinite(box.min.y)) return;
        const cx = (box.min.x + box.max.x) / 2, cz = (box.min.z + box.max.z) / 2;
        tot++;
        org.set(cx, box.min.y + 300, cz);
        rc.set(org, down);
        const hits = rc.intersectObjects(ground, false);
        if (!hits.length) return;                 // no drawn ground here at all
        const gap = box.min.y - hits[0].point.y;
        if (!(gap > min)) return;
        const k = name || o.type;
        const bk = buckets.get(k) ?? { n: 0, worst: 0, at: null };
        bk.n++;
        if (gap > bk.worst) { bk.worst = gap; bk.at = [Math.round(cx), Math.round(cz), +box.min.y.toFixed(1), +hits[0].point.y.toFixed(1)]; }
        buckets.set(k, bk);
        return;
      }
      for (const c of o.children) walk(c, name);
    };
    for (const c of t.group.children) walk(c, '');
    return { name: t.level?.name, tot,
      rows: [...buckets.entries()].map(([k, v]) => ({ k, ...v })).sort((a, c) => c.worst - a.worst) };
  }, { min: MIN, air: AIRBORNE });
  const n = r.rows.reduce((a, x) => a + x.n, 0);
  grand += n; if (n) hitWorlds++;
  if (!n) { console.log(`${String(id).padStart(2)} ${(r.name ?? '?').padEnd(20)} clean (${r.tot} parts)`); continue; }
  console.log(`${String(id).padStart(2)} ${(r.name ?? '?').padEnd(20)} ${n}/${r.tot} stand on air > ${MIN} u`);
  for (const row of r.rows.slice(0, 6)) {
    console.log(`      ${row.k.padEnd(22)} ${String(row.n).padStart(4)}  worst ${row.worst.toFixed(1)} u  [x,z,base,ground]=${JSON.stringify(row.at)}`);
  }
}
console.log(`\n===== ${grand} parts standing on air across ${hitWorlds} worlds =====`);
await b.close();
