/* LOCAL ROTATION AND WORLD BOX, IN ONE READING.
 *
 * `iconwho` printed part 2's local rotation as [0,0,0] while `iconrig`
 * measured its world box as 420 x 420 x 0, and `_diorama` plainly writes
 * `ground.rotation.x = -Math.PI / 2`. Three readings, no two agreeing — which
 * means at least one probe was looking at a different object list. The two
 * probes asked `g._studio()` for DIFFERENT SIZES, so if the studio is built
 * per size they were never describing the same scene.
 *
 * This asks once, for one studio, and prints both facts side by side.
 */
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 430, height: 900 } });
p.setDefaultTimeout(600000);
await p.goto('http://localhost:8901/?level=1&unlockall=1', { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
const out = await p.evaluate(async () => {
  const THREE = await import('three');
  const g = window.__game;
  const a = g._studio(148, 96), c = g._studio(592, 384);
  const read = (st) => {
    st.forest.updateMatrixWorld(true);
    return st.forest.children.map((o, i) => {
      const box = new THREE.Box3().setFromObject(o);
      const s = box.getSize(new THREE.Vector3()), m = box.getCenter(new THREE.Vector3());
      return { i, geo: o.geometry?.type,
        rot: [o.rotation.x, o.rotation.y, o.rotation.z].map((v) => +v.toFixed(2)),
        world: s.toArray().map((v) => +v.toFixed(1)),
        at: m.toArray().map((v) => +v.toFixed(1)),
        colour: o.material?.color ? '#' + o.material.color.getHexString() : null };
    });
  };
  return { sameStudio: a === c, sameForest: a.forest === c.forest,
    kids: a.forest.children.length, rows: read(a) };
});
console.log('same studio object for 148x96 and 592x384:', out.sameStudio,
  '| same forest:', out.sameForest, '| children:', out.kids);
console.log(' i  geo              localRot             worldSize              at                   colour');
for (const r of out.rows)
  console.log(`${String(r.i).padStart(2)}  ${String(r.geo).padEnd(16)} ${String(r.rot).padEnd(20)} ${String(r.world).padEnd(22)} ${String(r.at).padEnd(20)} ${r.colour ?? ''}`);
await b.close();
