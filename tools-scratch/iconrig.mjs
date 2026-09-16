/* WHERE THE ICON CAMERA IS, AND WHAT IS IN FRONT OF IT.
 *
 * `iconparts` says one 4-vertex quad owns 82% of a shelf icon and every tree,
 * rock and bush in the diorama owns 0%. That is a framing fact, so this prints
 * the framing: the icon camera's own position and aim, and every part of the
 * forest with its bounding box and whether it falls inside the frustum.
 *
 * `inFrame` is a real frustum test on the part's world box, so "the trees are
 * not in the picture" is checked rather than inferred from a diff.
 */
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 430, height: 900 } });
p.setDefaultTimeout(600000);
await p.goto('http://localhost:8901/?level=1&unlockall=1', { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
console.log(JSON.stringify(await p.evaluate(async () => {
  const THREE = await import('three');
  const g = window.__game;
  const mod = await import('./src/vehicles.js');
  const W = 148, H = 96;
  const st = g._studio(W, H);
  const mesh = mod.buildCarMesh(mod.CAR_CATALOG[0].spec);
  // rebuild the icon camera exactly as `_shoot(ground:true)` does
  const cam = new THREE.PerspectiveCamera(30, W / H, 0.1, 600);
  const bx = new THREE.Box3().setFromObject(mesh);
  const mid = bx.getCenter(new THREE.Vector3());
  const aim = 0.55 + (mid.y - 0.55) * 0.5;
  const rig = g.constructor.SHOT_RIG_GROUND
    ?? new THREE.Vector3(3.9, 3.3, 7.4);           // mirrors main.js
  const fit = g._fitDist(bx, cam, aim, 0.86, rig);
  cam.position.copy(rig).normalize().multiplyScalar(fit);
  cam.lookAt(0, aim, 0);
  cam.updateMatrixWorld(); cam.updateProjectionMatrix();
  const fr = new THREE.Frustum().setFromProjectionMatrix(
    new THREE.Matrix4().multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
  st.forest.updateMatrixWorld(true);
  const parts = st.forest.children.map((o, i) => {
    const box = new THREE.Box3().setFromObject(o);
    const c = box.getCenter(new THREE.Vector3()), s = box.getSize(new THREE.Vector3());
    return { i, verts: o.geometry?.attributes?.position?.count ?? 0,
      centre: [+c.x.toFixed(1), +c.y.toFixed(1), +c.z.toFixed(1)],
      size: [+s.x.toFixed(1), +s.y.toFixed(1), +s.z.toFixed(1)],
      inFrame: fr.intersectsBox(box) };
  });
  return {
    car: { size: [+bx.getSize(new THREE.Vector3()).x.toFixed(2),
      +bx.getSize(new THREE.Vector3()).y.toFixed(2),
      +bx.getSize(new THREE.Vector3()).z.toFixed(2)] },
    cam: { at: cam.position.toArray().map((v) => +v.toFixed(2)),
      aim: +aim.toFixed(2), dist: +fit.toFixed(2),
      elevDeg: +(Math.atan2(cam.position.y, Math.hypot(cam.position.x, cam.position.z)) * 180 / Math.PI).toFixed(1) },
    forestPos: st.forest.position.toArray().map((v) => +v.toFixed(1)),
    parts,
  };
}), null, 1));
await b.close();
