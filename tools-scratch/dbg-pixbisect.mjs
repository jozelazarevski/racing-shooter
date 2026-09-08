/* Binary-search the scene for whatever paints a given pixel. */
import { chromium } from 'playwright-core';
const LVL = Number(process.env.LVL ?? 32), ST = Number(process.env.ST ?? 870);
const PX = Number(process.env.PX ?? 500), PY = Number(process.env.PY ?? 165);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 900, height: 520 } });
p.setDefaultTimeout(240000);
await p.goto(`http://localhost:8901/?level=${LVL}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 240000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 240000 });
const r = await p.evaluate(({ ST9, PX9, PY9 }) => {
  const g = window.__game, t = g.track, N = t.center.length;
  g.clock.getDelta = () => 1 / 60;
  for (let k = 0; k < 200 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  const i = ((ST9 % N) + N) % N, c = t.center[i], aim = t.center[(i + 50) % N];
  g.frame = () => {};
  g.camera.position.set(c.x, c.y + 10, c.z);
  g.camera.lookAt(aim.x, aim.y + 2, aim.z);
  g.camera.updateMatrixWorld();
  const cv = document.createElement('canvas');
  cv.width = 900; cv.height = 520;
  const ctx = cv.getContext('2d');
  const sample = () => {
    if (g.composer) g.composer.render(); else g.renderer.render(g.scene, g.camera);
    ctx.drawImage(g.renderer.domElement, 0, 0, 900, 520);
    const d = ctx.getImageData(PX9, PY9, 1, 1).data;
    return [d[0], d[1], d[2]];
  };
  const meshes = [];
  g.scene.traverse((o) => { if (o.isMesh && o.visible) meshes.push(o); });
  const base = sample();
  const dark = base[0] + base[1] + base[2];
  // binary search: hide a half, see if the pixel changes a lot
  let lo = 0, hi = meshes.length, guard = 0;
  const diff = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
  while (hi - lo > 1 && guard++ < 24) {
    const mid = (lo + hi) >> 1;
    for (let k = lo; k < mid; k++) meshes[k].visible = false;
    const s = sample();
    for (let k = lo; k < mid; k++) meshes[k].visible = true;
    if (diff(s, base) > 30) hi = mid; else lo = mid;
  }
  const culprit = meshes[lo];
  const e = culprit.matrixWorld.elements;
  if (!culprit.geometry.boundingSphere) culprit.geometry.computeBoundingSphere();
  return { world: g.level?.name, basePixel: base, sum: dark, idx: lo, total: meshes.length,
    name: culprit.name || culprit.parent?.name || culprit.type,
    parent: culprit.parent?.name || culprit.parent?.type,
    mat: culprit.material?.type,
    col: culprit.material?.color ? '#' + culprit.material.color.getHexString() : null,
    radius: Math.round(culprit.geometry.boundingSphere.radius),
    world3: [Math.round(e[12]), Math.round(e[13]), Math.round(e[14])],
    tris: Math.round((culprit.geometry.index?.count ?? culprit.geometry.attributes.position.count) / 3),
    inst: culprit.isInstancedMesh ? culprit.count : 1 };
}, { ST9: ST, PX9: PX, PY9: PY });
console.log(JSON.stringify(r, null, 1));
await browser.close();
