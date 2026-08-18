/* IS THE RIM CACTUS FLOATING, OR STANDING ON A CLIFF THE GATE CANNOT SEE?
 *
 * test-nothing-floats measures against the near TERRAIN PATCH's vertex buffer.
 * A saguaro silhouetted on a canyon rim stands on the CLIFF RIBBON, which is a
 * different mesh. If the ribbon is there under its feet, the 88 "floaters" on
 * CANYON RUN are the gate measuring the wrong surface; if nothing is there, they
 * are genuinely in the air and the datum seating is the bug. Those two need
 * opposite fixes, so this asks before anything is changed.
 *
 * For each reported floater: the analytic terrain height, the drawn terrain
 * height, and the nearest VERTEX of any other mesh below it within 2 u laterally.
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 480, height: 300 } });
p.setDefaultTimeout(600000);
await p.goto(`${BASE}/?level=4&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 600000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track;
  const V = new (g.player.pos.constructor)();
  // find the cactus instances and their world positions
  const found = [];
  const M = new (g.camera.matrixWorld.constructor)();
  t.group.traverse((o) => {
    if (!o.isInstancedMesh) return;
    const gp = o.geometry?.parameters ?? {};
    // the saguaro trunk: CapsuleGeometry(0.5, 3.6)
    if (!(Math.abs((gp.radius ?? 0) - 0.5) < 0.01 && Math.abs((gp.length ?? 0) - 3.6) < 0.01)) return;
    o.updateWorldMatrix(true, false);
    for (let i = 0; i < o.count && found.length < 400; i++) {
      o.getMatrixAt(i, M);
      V.set(M.elements[12], M.elements[13], M.elements[14]).applyMatrix4(o.matrixWorld);
      if (V.lengthSq() < 1) continue;                 // parked slot
      found.push({ x: V.x, y: V.y, z: V.z });
    }
  });
  // for each, analytic ground and the nearest lower vertex of any OTHER mesh
  const out = [];
  const probe = found.slice(0, 8);
  for (const f of probe) {
    const th = t.terrainHeight(f.x, f.z);
    let bestOther = -1e9, ownerName = '-';
    t.group.traverse((o) => {
      const pos = o.geometry?.attributes?.position; if (!pos) return;
      if (o.isInstancedMesh) return;                  // scatter, not ground
      o.updateWorldMatrix(true, false);
      for (let k = 0; k < pos.count; k += 3) {
        V.fromBufferAttribute(pos, k); o.localToWorld(V);
        if (Math.abs(V.x - f.x) > 2.5 || Math.abs(V.z - f.z) > 2.5) continue;
        if (V.y <= f.y + 0.5 && V.y > bestOther) { bestOther = V.y; ownerName = o.name || o.type; }
      }
    });
    out.push({ at: [Math.round(f.x), Math.round(f.z)], footY: +f.y.toFixed(2),
      terrain: +th.toFixed(2), gapVsTerrain: +(f.y - th).toFixed(2),
      nearestMeshBelow: bestOther > -1e8 ? +bestOther.toFixed(2) : null,
      gapVsMesh: bestOther > -1e8 ? +(f.y - bestOther).toFixed(2) : null, owner: ownerName });
  }
  return { total: found.length, out };
});
console.log(`saguaro instances found: ${r.total}\n`);
for (const q of r.out) {
  console.log(`at ${String(q.at).padEnd(14)} foot ${String(q.footY).padStart(7)} | `
    + `terrain ${String(q.terrain).padStart(7)} (gap ${String(q.gapVsTerrain).padStart(6)}) | `
    + `nearest mesh below ${String(q.nearestMeshBelow).padStart(7)} (gap ${String(q.gapVsMesh).padStart(6)}) `
    + `[${q.owner}]`);
}
await b.close();
