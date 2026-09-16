import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 480, height: 854 } });
await p.goto('http://localhost:8901/?level=58&go=1&unlockall=1', { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
const r = await p.evaluate(async () => {
  const THREE = await import('/lib/three.module.min.js');
  const g = window.__game, c = g.player;
  for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  for (let k = 0; k < 30; k++) g.frame();
  const meshes = [];
  g.scene.traverse((o) => { if (o.isMesh && o.visible && o.material) meshes.push(o); });
  const cam = g.camera.position.clone();
  const dir = new THREE.Vector3().subVectors(c.pos, cam).normalize();
  const ray = new THREE.Raycaster(cam, dir, 0.1, 200);
  let first = null;
  for (const m of meshes) {
    try {
      const hs = ray.intersectObject(m, false);
      for (const h of hs) if (!first || h.distance < first.distance) first = h;
    } catch (e) {}
  }
  if (!first) return 'no hit';
  const o = first.object;
  const wp = new THREE.Vector3(); o.getWorldPosition(wp);
  const chain = [];
  let q = o; while (q) { chain.push(q.name || q.type); q = q.parent; }
  return { d: +first.distance.toFixed(1),
    hitPt: { x: +first.point.x.toFixed(0), y: +first.point.y.toFixed(1), z: +first.point.z.toFixed(0) },
    origin: { x: +wp.x.toFixed(0), y: +wp.y.toFixed(1), z: +wp.z.toFixed(0) },
    rot: [+o.rotation.x.toFixed(2), +o.rotation.y.toFixed(2), +o.rotation.z.toFixed(2)],
    params: o.geometry?.parameters, chain, mat: o.material?.type,
    col: o.material?.color?.getHexString?.(), map: !!o.material?.map,
    renderOrder: o.renderOrder };
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
