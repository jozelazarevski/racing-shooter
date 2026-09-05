/* What is hanging in the SKY near the camera: any mesh (or instance) whose
 * world Y clears the rooflines by a margin, with its name, height and size.
 * Written for two black slabs floating over the seafront at r244. */
import { chromium } from 'playwright-core';
const LV = process.env.LV ?? '73', F = +(process.env.F ?? 0.4);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await (await b.newContext({ viewport:{width:900,height:520} })).newPage();
p.setDefaultTimeout(600000);
await p.goto(`http://localhost:8901/?level=${LV}&go=1&unlockall=1`, { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
console.log(JSON.stringify(await p.evaluate(({F, THRESH, R}) => {
  const g = window.__game, t = g.track, i = Math.floor(t.N * F), c = t.center[i];
  const out = [];
  const T3 = g.THREE ?? g.camera.constructor.prototype.constructor.__proto__ ?? null;
  const m4 = new (g.camera.matrixWorld.constructor)(), v = new (g.camera.position.constructor)(),
    s = new (g.camera.position.constructor)(), qq = new (g.camera.quaternion.constructor)();
  g.scene.traverse(o => {
    if (!o.isMesh && !o.isInstancedMesh) return;
    const n = o.count ?? 1;
    for (let k = 0; k < n; k++) {
      if (o.isInstancedMesh) { o.getMatrixAt(k, m4); m4.decompose(v, qq, s); v.applyMatrix4(o.matrixWorld); }
      else { o.getWorldPosition(v); s.copy(o.scale); }
      const d = Math.hypot(v.x - c.x, v.z - c.z);
      if (d > R) continue;
      if (v.y - c.y < THRESH) continue;
      const mat = Array.isArray(o.material) ? o.material[0] : o.material;
      out.push({ name: o.name || '(anon)', y: +(v.y - c.y).toFixed(1), d: +d.toFixed(1),
        s: [s.x, s.y, s.z].map(q => +q.toFixed(2)),
        geo: o.geometry?.type, par: o.parent?.name || o.parent?.type,
        col: mat?.color ? '#' + mat.color.getHexString() : null,
        matType: mat?.type, vis: o.visible });
    }
  });
  out.sort((a, b2) => b2.y - a.y);
  return out.slice(0, 14);
}, { F, THRESH: +(process.env.THRESH ?? 20), R: +(process.env.R ?? 90) }), null, 0));
await b.close();
