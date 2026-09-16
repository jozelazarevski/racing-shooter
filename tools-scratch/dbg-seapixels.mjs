/* E-27: the sea is a MeshStandardMaterial lit by a warm sun, so the vertex
 * colour is NOT what reaches the screen — the owner's frame reads 18%
 * saturation where the geometry carries 80%. Measure PIXELS, which is what
 * the owner actually complained about.
 *
 * The game's rAF loop overwrites any camera I pose, so: pose, render once,
 * then stub the renderer so nothing repaints over it. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const IDS = (process.env.IDS ?? '29,76,60,53').split(',');
const TAG = process.env.TAG ?? 'now';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
for (const id of IDS) {
  const p = await b.newPage({ viewport: { width: 640, height: 400 } });
  p.setDefaultTimeout(600000);
  await p.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
  await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 600000 });
  const info = await p.evaluate(() => {
    const g = window.__game, tk = g.track, T = tk.T, N = tk.center.length;
    const C = T.coast; if (!C) return { skip: true };
    const [ax, az] = C.a, [bx, bz] = C.b;
    const L = Math.hypot(bx - ax, bz - az) || 1;
    const ux = (bx - ax) / L, uz = (bz - az) / L;
    const sx = uz, sz = -ux;                       // seaward normal
    // stand at the station with the most water in front of it
    let best = null;
    for (let i = 0; i < N; i += 3) {
      const c = tk.center[i];
      const d = (c.x - ax) * sx + (c.z - az) * sz;   // + = seaward of the line
      if (!best || d > best.d) best = { i, d, c };
    }
    const c = tk.center[best.i];
    const gy = tk.terrainHeight(c.x, c.z);
    g.camera.position.set(c.x - sx * 12, gy + 26, c.z - sz * 12);
    g.camera.lookAt(c.x + sx * 900, gy - 40, c.z + sz * 900);
    g.camera.updateProjectionMatrix();
    g.renderer.render(g.scene, g.camera);
    g.renderer.render = () => {};                   // freeze the frame
    return { name: g.level?.name, station: best.i };
  });
  if (!info.skip) {
    await p.screenshot({ path: `tools-scratch/shot-sea-${TAG}-${id}.png` });
    console.log(`${id} ${info.name}`);
  }
  await p.close();
}
await b.close();
