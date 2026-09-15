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
  const hits = [];
  for (const m of meshes) {
    try {
      const hs = ray.intersectObject(m, false);
      for (const h of hs) hits.push(h);
    } catch (e) { /* skip broken raycast targets */ }
  }
  hits.sort((a, b) => a.distance - b.distance);
  return hits.slice(0, 8).map(h => ({ d: +h.distance.toFixed(1),
    name: h.object.name || h.object.parent?.name || h.object.type,
    mat: h.object.material?.type,
    col: h.object.material?.color?.getHexString?.(),
    opa: h.object.material?.opacity, trans: !!h.object.material?.transparent,
    geo: h.object.geometry?.type }));
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
