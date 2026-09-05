/* WHAT IS ACTUALLY IN A CAR SHELF ICON. Reported broken: the cars are cropped
 * and there are dark wedges flaring out either side of each one.
 *
 * Re-shoots one car through the game's own `_shoot` at a big size so the thing
 * can be seen, and reports the studio scene's contents and every part of the
 * car that is visible — the lamp rig included, which is additive geometry 19 u
 * long and would project as exactly that kind of wedge if it were ever on. */
import { chromium } from 'playwright-core';
import { writeFileSync } from 'fs';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 430, height: 900 } });
p.setDefaultTimeout(600000);
await p.goto('http://localhost:8901/?level=1&unlockall=1', { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
const out = await p.evaluate(async () => {
  const g = window.__game;
  g.showMenu();
  document.getElementById('tab-btn-garage')?.click();
  const f = () => new Promise((r) => requestAnimationFrame(r));
  for (let i = 0; i < 30; i++) await f();
  const car = g.constructor.name ? null : null;
  // build the same mesh the shelf builds, and shoot it big
  const CAT = g.carCatalog || null;
  const key = g.cars?.selected;
  const spec = (window.CAR_CATALOG || []).length ? null : null;
  // easier: reuse the game's own icon path but at a readable size
  const entry = (g.cars?.list || []).find?.((c) => c.key === key);
  return { key, hasShoot: typeof g._shoot, hasCarIcons: typeof g._carIcons,
    iconKeys: Object.keys(g.__carIcons || g.carIcons || {}) };
});
console.log(JSON.stringify(out));
// re-shoot every catalogue car at 4x and save, plus report the rig state
const shots = await p.evaluate(async () => {
  const g = window.__game;
  const mod = await import('./src/vehicles.js');
  // THROUGH THE REAL SHELF PATH. `_carIcons` picks one distance for the whole
  // catalogue; shooting cars one at a time here would test a framing the
  // player never sees.
  g.__carIcons = null;
  const all = g._carIcons();
  const res = [];
  for (const car of mod.CAR_CATALOG.slice(0, 3)) {
    const mesh = mod.buildCarMesh(car.spec);
    const lt = mesh.userData.carLights;
    const before = lt ? lt.visible : 'no rig';
    const THREE = (await import('three'));
    const box = new THREE.Box3().setFromObject(mesh);
    const size = box.getSize(new THREE.Vector3());
    const url = all[car.key];
    const st = g.__studio;
    res.push({ key: car.key, lampsVisible: before,
      lampOpacity: lt ? +lt.material.opacity.toFixed(3) : null,
      meshSize: size.toArray().map((n) => +n.toFixed(2)),
      meshMin: box.min.toArray().map((n) => +n.toFixed(2)),
      meshMax: box.max.toArray().map((n) => +n.toFixed(2)),
      sweepVisible: st?.sweep?.visible, forestVisible: st?.forest?.visible,
      // WHAT IS ACTUALLY DRAWN when the studio shoots this car. One card came
      // back with a beige panel across it and the others did not, under the
      // same camera — so the difference has to be in the scene, not the lens.
      sceneVis: st ? st.scene.children.map((o) =>
        `${o.name || o.type}${o.visible ? '' : ' HIDDEN'}`) : null,
      url });
  }
  return res;
}).catch((e) => ({ err: String(e).slice(0, 200) }));
if (shots.err) { console.log('ERR', shots.err); }
else for (const s of shots) {
  writeFileSync(`tools-scratch/shot-icon-${s.key}.png`, Buffer.from(s.url.split(',')[1], 'base64'));
  console.log(s.key, 'sweep', s.sweepVisible, 'forest', s.forestVisible,
    '|', JSON.stringify(s.sceneVis));
}
await b.close();
