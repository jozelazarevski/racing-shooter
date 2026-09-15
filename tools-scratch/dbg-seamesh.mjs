/* Is the sea DRAWN on this world? List water-ish meshes, their extent and y,
 * and how far the nearest water surface is from the road. */
import { chromium } from 'playwright-core';
const LVL = Number(process.env.LVL ?? 29);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 320, height: 200 } });
p.setDefaultTimeout(240000);
await p.goto(`http://localhost:8901/?level=${LVL}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 240000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 240000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track;
  const out = [];
  g.scene.traverse((o) => {
    if (!o.isMesh) return;
    const nm = (o.name || '').toLowerCase();
    const col = o.material?.color ? o.material.color.getHexString() : '';
    const bluish = /sea|water|ocean|lake|river/.test(nm);
    if (!bluish) return;
    if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
    const e = o.matrixWorld.elements;
    const s = Math.max(Math.hypot(e[0], e[1], e[2]), Math.hypot(e[4], e[5], e[6]), Math.hypot(e[8], e[9], e[10]));
    out.push({ name: o.name || o.type, y: +e[13].toFixed(1),
      r: Math.round(o.geometry.boundingSphere.radius * s), col, vis: o.visible });
  });
  // nearest point where terrain is below sea level, and the sea config
  const C = t.T.coast;
  const gy = (x, z) => (t._drawnGroundY ? t._drawnGroundY(x, z) : null) ?? t.terrainHeight(x, z);
  let nearest = 1e9, at = null;
  const N = t.center.length;
  for (let i = 0; i < N; i += 5) {
    const c = t.center[i], n = t.nrm[i];
    for (const sd of [1, -1]) {
      for (let d = 20; d <= 600; d += 20) {
        if (gy(c.x + n.x * d * sd, c.z + n.z * d * sd) < (C?.level ?? -2) + 0.5) {
          if (d < nearest) { nearest = d; at = { i, sd }; }
          break;
        }
      }
    }
  }
  return { world: g.level?.name, coastCfg: C, waterMeshes: out,
    nearestWaterD: nearest === 1e9 ? null : nearest, at,
    patchHalf: t._patchHalf };
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
