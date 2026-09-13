import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 480, height: 854 } });
await p.goto('http://localhost:8901/?level=58&go=1&unlockall=1', { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
const r = await p.evaluate(async () => {
  const THREE = await import('/lib/three.module.min.js');
  const g = window.__game;
  for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  const target = new THREE.Vector3(1049, 31, -48);
  const out = [];
  const wp = new THREE.Vector3();
  g.scene.traverse((o) => {
    if (!o.isMesh || !o.visible) return;
    o.getWorldPosition(wp);
    if (wp.distanceTo(target) < 90) {
      const par = o.geometry?.parameters ?? {};
      out.push({ d: +wp.distanceTo(target).toFixed(0), y: +wp.y.toFixed(1),
        geo: o.geometry?.type, w: par.width ?? par.radius, h: par.height,
        name: o.name || o.parent?.name || o.parent?.parent?.name || '?',
        col: o.material?.color?.getHexString?.(), map: !!o.material?.map,
        sx: +o.scale.x.toFixed(1), sy: +o.scale.y.toFixed(1) });
    }
  });
  out.sort((a, b) => a.d - b.d);
  return out.slice(0, 16);
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
