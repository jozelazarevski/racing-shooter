/* Name the builder behind a solid. Solids carry no provenance, so this pairs
 * each offending collider with the nearest MESH in the scene and prints that
 * mesh's parent chain — which is enough to find the code that made both. */
import { chromium } from 'playwright-core';
const LV = process.env.LV ?? '49';
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
  const chain = (o) => { const a = []; for (let n = o; n && a.length < 4; n = n.parent) a.push(n.name || n.type); return a.join(' < '); };
  const bad = [];
  for (const so of t.solids ?? []) {
    // NOT `_clearsRoad`: since r246 that also refuses anything inside a
    // SQUARE, so it reports the piazza's own furniture as "in the road" and
    // buries the real offenders in false positives. The question here is the
    // census's: does this thing reach into a carriageway.
    let worst = -Infinity;
    for (let i = 0; i < t.N; i++) {
      const c = t.center[i];
      const bb = t.widthAt(i) - (Math.hypot(so.x - c.x, so.z - c.z) - so.r);
      if (bb > worst) worst = bb;
    }
    if (worst <= 0.3) continue;
    let best = null, bd = Infinity;
    g.scene.traverse((o) => {
      if (!o.isMesh && !o.isInstancedMesh) return;
      const n = o.count ?? 1;
      for (let k = 0; k < Math.min(n, 300); k++) {
        if (o.isInstancedMesh) { o.getMatrixAt(k, m4); m4.decompose(v, qq, s); v.applyMatrix4(o.matrixWorld); }
        else o.getWorldPosition(v);
        const d = Math.hypot(v.x - so.x, v.z - so.z);
        if (d < bd) { bd = d; best = { who: chain(o), geo: o.geometry?.type, d: +d.toFixed(2) }; }
      }
    });
    bad.push({ mat: so.mat, r: +so.r.toFixed(2), bite: +worst.toFixed(2),
      x: +so.x.toFixed(1), z: +so.z.toFixed(1),
      dist: +t._distToTrack(so.x, so.z).toFixed(2), nearest: best });
  }
  return { inRoad: bad.length, bad: bad.slice(0, 8) };
}), null, 1));
await b.close();
