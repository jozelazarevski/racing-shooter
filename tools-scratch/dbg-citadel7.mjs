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
  const planes = [];
  g.scene.traverse((o) => {
    if (o.isMesh && o.visible && o.geometry?.type === 'PlaneGeometry') {
      const wp = new THREE.Vector3();
      o.getWorldPosition(wp);
      const par = o.geometry.parameters ?? {};
      planes.push({ y: +wp.y.toFixed(1), x: +wp.x.toFixed(0), z: +wp.z.toFixed(0),
        w: par.width, h: par.height,
        name: o.name || o.parent?.name || '?', rotX: +o.rotation.x.toFixed(2),
        hasMap: !!o.material?.map, trans: !!o.material?.transparent,
        opa: o.material?.opacity });
    }
  });
  planes.sort((a, b) => (b.w ?? 0) - (a.w ?? 0));
  return { playerY: +c.pos.y.toFixed(1), planes: planes.slice(0, 12) };
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
