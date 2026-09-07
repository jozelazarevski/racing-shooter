import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 854, height: 480 } });
await p.goto('http://localhost:8901/?level=29&go=1&unlockall=1', { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 300000 });
await p.evaluate(() => {
  const g = window.__game, t = g.track;
  for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  const c = t.center[70];
  const C = t.T.coast;
  // seaward normal of the coast line
  const abx = C.b[0] - C.a[0], abz = C.b[1] - C.a[1];
  const L = Math.hypot(abx, abz);
  const nx = abz / L, nz = -abx / L;
  // park the player and aim the camera out over the bay
  g.player.pos.set(c.x, c.y + 0.5, c.z); g.player.y = c.y + 0.5;
  g.player.vel.set(0, 0, 0);
  g.frame();
  g._updateCamera = () => {};
  g.camera.position.set(c.x - nx * 8, c.y + 14, c.z - nz * 8);
  g.camera.lookAt(c.x + nx * 400, c.y - 20, c.z + nz * 400);
  g.composer?.render ? g.composer.render() : g.renderer.render(g.scene, g.camera);
});
await p.waitForTimeout(600);
await p.screenshot({ path: '/tmp/shot-seaward.png' });
console.log('saved');
await browser.close();
