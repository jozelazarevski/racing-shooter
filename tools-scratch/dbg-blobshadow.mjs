import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 400, height: 300 } });
await p.goto('http://localhost:8901/?level=29&go=1&unlockall=1', { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track, c = t.center[40];
  const near = [];
  g.scene.traverse(o => {
    if (!o.isMesh || !o.castShadow) return;
    o.updateWorldMatrix(true, false);
    const e = o.matrixWorld.elements;
    const d = Math.hypot(e[12] - c.x, e[14] - c.z);
    o.geometry.computeBoundingSphere?.();
    const r2 = (o.geometry.boundingSphere?.radius ?? 0) *
      Math.max(Math.hypot(e[0], e[1], e[2]), Math.hypot(e[8], e[9], e[10]));
    if (d < 400 && r2 > 25) {
      near.push({ name: o.name || o.geometry.type, inst: !!o.isInstancedMesh,
        d: +d.toFixed(0), r: +r2.toFixed(0), y: +e[13].toFixed(0) });
    }
  });
  near.sort((a, b) => a.d - b.d);
  // also: shadow decal instanced meshes (the _addShadow pool)
  const dec = [];
  t.group.traverse(o => {
    if (o.isMesh && /shadow/i.test(o.name || '')) dec.push({ name: o.name, count: o.count ?? 1 });
  });
  return { near: near.slice(0, 12), dec };
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
