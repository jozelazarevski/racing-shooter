import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 480, height: 854 } });
await p.goto('http://localhost:8901/?level=66&go=1&unlockall=1', { waitUntil: 'load' });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player);
await p.evaluate(() => {
  const g = window.__game;
  g.camMode = g.constructor.CAM_MODES.findIndex(m => m.driver);
});
await p.waitForTimeout(2500);
const out = await p.evaluate(async () => {
  const THREE = await import('/lib/three.module.min.js');
  const g = window.__game;
  const rc = new THREE.Raycaster();
  rc.near = 0.01;
  const res = [];
  for (const [px, py] of [[160, 540], [240, 560], [340, 520], [240, 460], [240, 300]]) {
    const ndc = new THREE.Vector2((px / 480) * 2 - 1, -(py / 854) * 2 + 1);
    rc.setFromCamera(ndc, g.camera);
    const hits = rc.intersectObjects(g.scene.children, true).slice(0, 3).map(h => ({
      d: +h.distance.toFixed(2),
      name: h.object.name || h.object.geometry?.type,
      mat: h.object.material?.type,
      col: h.object.material?.color ? '#' + h.object.material.color.getHexString() : null,
      inst: h.instanceId ?? null,
      parent: h.object.parent?.name || (h.object.parent === g.player?.mesh ? 'PLAYER' : ''),
    }));
    res.push({ px, py, hits });
  }
  return res;
});
console.log(JSON.stringify(out, null, 1));
await browser.close();
