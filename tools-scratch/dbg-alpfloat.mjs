/* ALPENRING float at (-79,-283): find every mesh part near that spot, its
 * height vs drawn ground, and which collection it belongs to. */
import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 320, height: 200 } });
await p.goto('http://localhost:8901/?level=33&go=1&unlockall=1', { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track, THREE = window.__THREE ?? null;
  const X = -79, Z = -283, R = 14;
  const out = [];
  const ground = (x, z) => t.terrainHeight(x, z);
  // scan scene meshes incl. instanced
  g.scene.traverse((o) => {
    if (!o.isMesh) return;
    if (o.isInstancedMesh) {
      const m = new (o.matrixWorld.constructor)();
      const v = { x: 0, y: 0, z: 0 };
      for (let i = 0; i < o.count; i++) {
        o.getMatrixAt(i, m);
        const e = m.elements;
        const x = e[12], y = e[13], z = e[14];
        if (Math.abs(x - X) < R && Math.abs(z - Z) < R) {
          out.push({ kind: 'inst', name: o.name || o.geometry?.type,
            geo: o.geometry?.parameters ? JSON.stringify(o.geometry.parameters).slice(0, 60) : o.geometry?.type,
            i, x: +x.toFixed(1), y: +y.toFixed(1), z: +z.toFixed(1),
            gy: +ground(x, z).toFixed(1), over: +(y - ground(x, z)).toFixed(1) });
        }
      }
    } else {
      const x = o.position.x, z = o.position.z;
      if (Math.abs(x - X) < R && Math.abs(z - Z) < R) {
        out.push({ kind: 'mesh', name: o.name || o.geometry?.type,
          x: +x.toFixed(1), y: +o.position.y.toFixed(1), z: +z.toFixed(1),
          gy: +ground(x, z).toFixed(1), over: +(o.position.y - ground(x, z)).toFixed(1) });
      }
    }
  });
  // nearest road station + width there
  const ns = t._nearestSample ? t._nearestSample(X, Z) : null;
  const roadInfo = ns ? { i: ns.i, d: +ns.d.toFixed(1), roadY: +t.center[ns.i].y.toFixed(1), w: +t.widthAt(ns.i).toFixed(1) } : null;
  // trees registry near the spot
  const trees = (t.trees ?? []).filter((tr) => Math.abs(tr.x - X) < R && Math.abs(tr.z - Z) < R)
    .map((tr) => ({ x: +tr.x.toFixed(1), y: +(tr.y ?? 0).toFixed(1), z: +tr.z.toFixed(1),
      r: tr.r, culled: !!tr.culled, gy: +ground(tr.x, tr.z).toFixed(1) }));
  return { roadInfo, trees, meshes: out.filter((m) => Math.abs(m.over) > 2 || m.kind === 'mesh').slice(0, 20), total: out.length };
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
