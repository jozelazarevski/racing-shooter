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
await p.waitForTimeout(3000);
const out = await p.evaluate(() => {
  const g = window.__game;
  const THREE_V3 = g.camera.position.constructor; // Vector3 class via instance
  const res = [];
  // Build a raycaster without THREE global: use camera's own methods
  for (const py of [450, 500, 540, 580, 620, 700, 800]) {
    const ndcX = 0, ndcY = -(py / 854) * 2 + 1;
    const v = new THREE_V3(ndcX, ndcY, 0.5).unproject(g.camera);
    const dir = v.sub(g.camera.position).normalize();
    // manual raycast via renderer scene? Use game's raycaster if present
    const rc = g._probeRay || (g._probeRay = new (Object.getPrototypeOf(g.renderer).constructor ? Function : Function)());
    res.push({ py, dir: [ +dir.x.toFixed(2), +dir.y.toFixed(2), +dir.z.toFixed(2) ],
      camY: +g.camera.position.y.toFixed(1),
      terrAlong: (() => {
        // march the ray against terrainHeight to find ground hit distance
        for (let d = 0.5; d < 400; d += 0.5) {
          const x = g.camera.position.x + dir.x * d;
          const y = g.camera.position.y + dir.y * d;
          const z = g.camera.position.z + dir.z * d;
          if (y <= g.track.terrainHeight(x, z)) return +d.toFixed(1);
        }
        return null;
      })() });
  }
  return { res, camPos: g.camera.position.toArray().map(n => +n.toFixed(1)),
    playerPos: [ +g.player.pos.x.toFixed(1), +g.player.y.toFixed(1), +g.player.pos.z.toFixed(1) ],
    fog: g.scene.fog ? { near: g.scene.fog.near, far: g.scene.fog.far, color: '#' + g.scene.fog.color.getHexString() } : null,
    bg: g.scene.background && g.scene.background.getHexString ? '#' + g.scene.background.getHexString() : String(g.scene.background) };
});
console.log(JSON.stringify(out, null, 1));
await browser.close();
