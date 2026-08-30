/* WHO put that in the road. The census names a geometry and a colour; this
 * names the BUILDER — the mesh's parent chain, its own name, its world
 * position and how deep it bites — so a defect can be fixed at its source
 * instead of guessed at from a signature. */
import { chromium } from 'playwright-core';
const LV = process.env.LV ?? '50';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await (await b.newContext({ viewport:{width:640,height:400} })).newPage();
p.setDefaultTimeout(600000);
await p.goto(`http://localhost:8901/?level=${LV}&go=1&unlockall=1`, { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
console.log(JSON.stringify(await p.evaluate(() => {
  const g = window.__game, t = g.track;
  const V3 = g.camera.position.constructor, M4 = g.camera.matrixWorld.constructor,
    QT = g.camera.quaternion.constructor;
  const v = new V3(), s = new V3(), qq = new QT(), m4 = new M4();
  const chain = (o) => {
    const out = [];
    for (let n = o; n && out.length < 5; n = n.parent) out.push(n.name || n.type);
    return out.join(' < ');
  };
  const bite = (x, z, r) => {
    let worst = -Infinity, at = -1;
    for (let i = 0; i < t.N; i++) {
      const c = t.center[i];
      const d = Math.hypot(x - c.x, z - c.z);
      const bb = t.widthAt(i) - (d - r);
      if (bb > worst) { worst = bb; at = i; }
    }
    return { bite: +worst.toFixed(2), at };
  };
  // 1. COLLIDERS in the road
  const blockers = [];
  for (const so of t.solids ?? []) {
    const bt = bite(so.x, so.z, so.r);
    if (bt.bite > 0.3) {
      // ...and what the builders' own gate says about that same point NOW: if
      // a solid sits in the road and `_clearsRoad` still calls it clear, the
      // gate is the defect, not the placement.
      const v2 = new V3(so.x, 0, so.z);
      blockers.push({ mat: so.mat, r: +so.r.toFixed(2), ...bt,
        x: +so.x.toFixed(1), z: +so.z.toFixed(1),
        clears: t._clearsRoad(so.x, so.z, so.r, 0.5),
        dist: +t._distToTrack(so.x, so.z).toFixed(2),
        nearI: t.nearestIndex(v2),
        nearW: +t.widthAt(t.nearestIndex(v2)).toFixed(2) });
    }
  }
  blockers.sort((a, c) => c.bite - a.bite);
  // 2. MESHES in the road, by builder
  const meshes = [];
  g.scene.traverse((o) => {
    if (!o.isMesh && !o.isInstancedMesh) return;
    const n = o.count ?? 1;
    for (let k = 0; k < Math.min(n, 400); k++) {
      if (o.isInstancedMesh) { o.getMatrixAt(k, m4); m4.decompose(v, qq, s); v.applyMatrix4(o.matrixWorld); }
      else { o.getWorldPosition(v); s.copy(o.scale); }
      if (!s.x && !s.y && !s.z) continue;
      const rad = Math.max(Math.abs(s.x), Math.abs(s.z)) * 0.9;
      if (rad > 40) continue;                       // landscape, not furniture
      const bt = bite(v.x, v.z, rad);
      if (bt.bite > 0.6) {
        meshes.push({ who: chain(o), geo: o.geometry?.type, r: +rad.toFixed(2),
          y: +v.y.toFixed(1), ...bt });
      }
    }
  });
  meshes.sort((a, c) => c.bite - a.bite);
  return { widthMax: +Math.max(...Array.from({ length: t.N }, (_, i) => t.widthAt(i))).toFixed(1),
    blockers: blockers.slice(0, 6), meshes: meshes.slice(0, 8) };
}), null, 1));
await b.close();
