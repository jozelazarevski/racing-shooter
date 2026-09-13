/* Find the green-shard class: flat (height < 0.8), green-ish meshes within
 * the road corridor or its verge on GLACIER COL. */
import { chromium } from 'playwright-core';
const LVL = Number(process.env.LVL ?? 66);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 400, height: 300 } });
await p.goto(`http://localhost:8901/?level=${LVL}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
const r = await p.evaluate(async () => {
  const THREE = await import('/lib/three.module.min.js');
  const g = window.__game, t = g.track;
  const found = new Map();
  const box = new THREE.Box3(), wp = new THREE.Vector3();
  const distToRoad = (x, z) => {
    const s = t._nearestSample ? t._nearestSample(x, z) : null;
    return s ? s.d - t.widthAt(s.i) : 1e9;
  };
  const consider = (o, x, z, sy, sxz, colHex) => {
    const d = distToRoad(x, z);
    if (d > 6) return;
    const key = (o.name || o.geometry?.type) + '|' + colHex;
    const e = found.get(key) ?? { key, n: 0, minD: 1e9, flat: sy < 0.9, sxz: +sxz.toFixed(1) };
    e.n++; if (d < e.minD) e.minD = +d.toFixed(1);
    found.set(key, e);
  };
  t.group.traverse((o) => {
    if (!o.isMesh && !o.isInstancedMesh) return;
    if (!o.visible || !o.material?.color) return;
    const c = o.material.color;
    // green-ish: g dominant
    if (!(c.g > c.r * 1.15 && c.g > c.b * 1.15)) return;
    if (o.isInstancedMesh) {
      const bb = o.geometry.boundingBox ?? (o.geometry.computeBoundingBox(), o.geometry.boundingBox);
      const m4 = new THREE.Matrix4(), v = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3();
      const step = Math.max(1, Math.floor(o.count / 800));
      for (let k = 0; k < o.count; k += step) {
        o.getMatrixAt(k, m4);
        m4.decompose(v, q, s);
        const sy = (bb.max.y - bb.min.y) * s.y;
        const sxz = Math.max((bb.max.x - bb.min.x) * s.x, (bb.max.z - bb.min.z) * s.z);
        if (sy < 0.9 && sxz > 1.2) consider(o, v.x, v.z, sy, sxz, c.getHexString());
      }
    } else {
      box.setFromObject(o);
      if (box.isEmpty()) return;
      const sy = box.max.y - box.min.y;
      const sxz = Math.max(box.max.x - box.min.x, box.max.z - box.min.z);
      if (sy < 0.9 && sxz > 1.2 && sxz < 100) {
        o.getWorldPosition(wp);
        consider(o, wp.x, wp.z, sy, sxz, c.getHexString());
      }
    }
  });
  return [...found.values()].sort((a, b) => a.minD - b.minD).slice(0, 12);
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
