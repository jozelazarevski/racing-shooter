import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 400, height: 300 } });
await p.goto('http://localhost:8901/?level=66&go=1&unlockall=1', { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
const r = await p.evaluate(async () => {
  const THREE = await import('/lib/three.module.min.js');
  const g = window.__game, t = g.track;
  const mesh = t._guardFenceMesh;
  if (!mesh || !mesh.count) return 'no fence';
  const m4 = new THREE.Matrix4(), v = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3();
  const out = [];
  for (let k = 0; k < Math.min(4, mesh.count); k++) {
    mesh.getMatrixAt(k, m4);
    m4.decompose(v, q, s);
    const beamDir = new THREE.Vector3(1, 0, 0).applyQuaternion(q); // local X
    const ns = t._nearestSample(v.x, v.z);
    const tan = t.tan[ns.i];
    const dot = Math.abs(beamDir.x * tan.x + beamDir.z * tan.z);
    out.push({ k, alongRoad: +dot.toFixed(2), d: +ns.d.toFixed(1),
      w: +t.widthAt(ns.i).toFixed(1) });
  }
  // also count bays whose beam tip reaches into the carriageway
  let reach = 0;
  for (let k = 0; k < mesh.count; k++) {
    mesh.getMatrixAt(k, m4);
    m4.decompose(v, q, s);
    const bd = new THREE.Vector3(1, 0, 0).applyQuaternion(q);
    for (const e of [-2.7, 2.7]) {
      const ex = v.x + bd.x * e, ez = v.z + bd.z * e;
      const ns = t._nearestSample(ex, ez);
      if (ns.d < t.widthAt(ns.i) - 0.3) { reach++; break; }
    }
  }
  return { count: mesh.count, sample: out, baysReachingRoad: reach };
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
