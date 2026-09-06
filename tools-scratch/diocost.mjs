/* WHAT THE GARAGE'S FOREST COSTS TWICE. The bay and the studio are separate
 * scenes, so each mounts its own Meshes — but the geometry and the textures
 * behind them need not be duplicated. This counts DISTINCT geometries and
 * textures across both scenes: if the two dioramas share, the count is one
 * set; if not, it is two. */
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: 420, height: 900 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
const p = await ctx.newPage(); p.setDefaultTimeout(600000);
await p.goto('http://localhost:8901/?level=1&unlockall=1', { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
await p.evaluate(() => { window.__game.showMenu(); document.getElementById('tab-btn-garage')?.click(); });
await p.waitForTimeout(2600);
console.log(JSON.stringify(await p.evaluate(() => {
  const g = window.__game;
  const geos = new Set(), texes = new Set(), mats = new Set();
  let meshes = 0, tris = 0;
  for (const sc of [g.__stage?.scene, g.__studio?.scene]) {
    if (!sc) continue;
    sc.traverse((o) => {
      if (!o.isMesh || o === g.__stage?.car) return;
      meshes++;
      if (o.geometry) {
        if (!geos.has(o.geometry)) tris += (o.geometry.attributes?.position?.count ?? 0) / 3;
        geos.add(o.geometry);
      }
      const m = Array.isArray(o.material) ? o.material[0] : o.material;
      if (m) { mats.add(m); if (m.map) texes.add(m.map); }
    });
  }
  const t0 = performance.now();
  const probe = g._diorama();
  const build = performance.now() - t0;
  probe.traverse(() => {});
  return { scenes: [!!g.__stage, !!g.__studio],
    meshes, distinctGeometries: geos.size, distinctMaterials: mats.size,
    distinctTextures: texes.size, distinctTriangles: Math.round(tris),
    aFurtherDioramaCostsMs: +build.toFixed(2),
    memoryMB: +((performance.memory?.usedJSHeapSize ?? 0) / 1048576).toFixed(1) };
}), null, 0));
await b.close();
