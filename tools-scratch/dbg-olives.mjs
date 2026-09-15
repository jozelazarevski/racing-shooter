/* E-28: "the olive trees a bit more definition". The crown is already a
 * faceted 9x6 sphere on a flat-shaded material, so "no facets" is not the
 * answer. Look at them: pose a camera at the verge, freeze the frame (the
 * game's rAF loop repaints over any pose, so stub the renderer after one
 * render) and photograph the trees the chase camera actually drives past. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const ID = process.env.ID ?? '29';
const TAG = process.env.TAG ?? 'now';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 760, height: 460 } });
p.setDefaultTimeout(600000);
await p.goto(`${BASE}/?level=${ID}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 600000 });
console.log(JSON.stringify(await p.evaluate(() => {
  const g = window.__game, tk = g.track, N = tk.center.length;
  // stand where the grove actually is: the station with the most registered
  // carpet trees within 30 u
  let best = null;
  for (let i = 0; i < N; i += 4) {
    const c = tk.center[i];
    let n = 0;
    for (const t of tk.camTreesNear(c.x, c.z)) if (Math.hypot(t.x - c.x, t.z - c.z) < 30) n++;
    if (!best || n > best.n) best = { i, n, c };
  }
  const c = tk.center[best.i], nv = tk.nrm[best.i];
  const gy = tk.terrainHeight(c.x, c.z);
  // eye height, a few metres back from the verge, looking along the trees
  g.camera.position.set(c.x + nv.x * 4, gy + 3.2, c.z + nv.z * 4);
  const h = tk.headingAt(best.i);
  g.camera.lookAt(c.x + nv.x * 26 + Math.sin(h) * 22, gy + 3.0, c.z + nv.z * 26 + Math.cos(h) * 22);
  g.camera.updateProjectionMatrix();
  g.renderer.render(g.scene, g.camera);
  g.renderer.render = () => {};
  // and the budget, so any change can be priced
  let tris = 0, inst = 0;
  tk.group.traverse((o) => {
    if (o.isInstancedMesh && /carpet-foliage/.test(o.name || '')) {
      const ix = o.geometry.getIndex();
      tris += (ix ? ix.count : o.geometry.getAttribute('position').count) / 3 * o.count;
      inst += o.count;
    }
  });
  return { world: g.level?.name, station: best.i, treesWithin30u: best.n,
    carpetInstances: inst, carpetTriangles: Math.round(tris) };
})));
await p.screenshot({ path: `tools-scratch/shot-olive-${TAG}-${ID}.png` });
await b.close();
