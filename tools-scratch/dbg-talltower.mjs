// Find every tall structure on a world: walk the scene graph for objects
// whose world bounding box stands 6+ u tall, report position + name chain.
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const LEVEL = process.env.LEVEL ?? 32;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 400, height: 300 } });
await p.goto(`${BASE}/?level=${LEVEL}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 300000 });
const r = await p.evaluate(async () => {
  const g = window.__game, t = g.track;
  const { Box3, Vector3 } = await import('./lib/three.module.min.js');
  const out = [];
  const box = new Box3(), c = new Vector3(), s = new Vector3();
  t.group.updateMatrixWorld(true);
  t.group.traverse((o) => {
    if (!o.isMesh || o.isInstancedMesh) return;
    box.setFromObject(o);
    if (!isFinite(box.min.x)) return;
    box.getCenter(c); box.getSize(s);
    const gy = t.terrainHeight(c.x, c.z);
    if (s.y > 6 && box.min.y < gy + 4 && Math.hypot(c.x, c.z) < 900) {
      const chain = [];
      let q = o; while (q && q !== t.group) { chain.unshift(q.name || q.type); q = q.parent; }
      out.push({ x: Math.round(c.x), z: Math.round(c.z), h: +s.y.toFixed(1),
        w: +Math.max(s.x, s.z).toFixed(1), d: +t._distToTrack(c.x, c.z).toFixed(0),
        name: chain.join('/').slice(0, 60),
        col: o.material?.color ? '#' + o.material.color.getHexString() : '?' });
    }
  });
  out.sort((a, b) => a.d - b.d);
  return out.slice(0, 20);
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
