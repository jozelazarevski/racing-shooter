/* WHAT THE WORLD COSTS RIGHT NOW. Before adding a triangle: how many are there,
 * where are they, how many draw calls, and what is the frame time on a phone
 * profile. "High poly" is trivial to ship and hard to ship WELL — the number
 * that decides it is this one. */
import { chromium } from 'playwright-core';
const LV = process.env.LV ?? '74';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: 430, height: 830 } });
const p = await ctx.newPage(); p.setDefaultTimeout(600000);
await p.goto(`http://localhost:8901/?level=${LV}&go=1&unlockall=1`, { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
await p.evaluate(() => new Promise(r => { let n=0; const f=()=>(++n>30?r():requestAnimationFrame(f)); requestAnimationFrame(f); }));
console.log(await p.evaluate(() => {
  const g = window.__game;
  g.renderer.info.reset?.();
  g.renderer.render(g.scene, g.camera);
  const inf = g.renderer.info;
  // where the triangles actually live, by object name
  const by = {};
  let sceneTris = 0;
  g.scene.traverse((o) => {
    if (!o.isMesh && !o.isInstancedMesh) return;
    const gm = o.geometry;
    const idx = gm?.index ? gm.index.count : (gm?.attributes?.position?.count ?? 0);
    const tris = (idx / 3) * (o.isInstancedMesh ? o.count : 1);
    sceneTris += tris;
    const k = o.name || o.type;
    by[k] = (by[k] || 0) + tris;
  });
  const top = Object.entries(by).sort((a, c) => c[1] - a[1]).slice(0, 8)
    .map(([k, v]) => `${k}:${Math.round(v / 1000)}k`);
  return JSON.stringify({ level: g.level.name,
    drawnTris: inf.render.triangles, drawCalls: inf.render.calls,
    sceneTris: Math.round(sceneTris), programs: inf.programs?.length ?? -1,
    geometries: inf.memory.geometries, textures: inf.memory.textures,
    heaviest: top }, null, 1);
}));
// frame cost, measured rather than assumed
console.log(await p.evaluate(() => new Promise((res) => {
  const t = []; let last = performance.now(), n = 0;
  const f = () => { const now = performance.now(); t.push(now - last); last = now;
    if (++n < 40) requestAnimationFrame(f);
    else { t.sort((a, b) => a - b); res(`median frame ${t[20].toFixed(1)}ms  worst ${t[38].toFixed(1)}ms`); } };
  requestAnimationFrame(f);
})));
await b.close();
