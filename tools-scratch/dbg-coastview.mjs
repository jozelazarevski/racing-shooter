/* Free camera: stand behind the coast road and look out over the shore to the
 * sea. Renders directly so the game's boom cannot re-aim it. */
import { chromium } from 'playwright-core';
const LVL = Number(process.env.LVL ?? 29);
const OUT = process.env.OUT ?? `/tmp/coastview-${LVL}.png`;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 900, height: 500 } });
p.setDefaultTimeout(240000);
await p.goto(`http://localhost:8901/?level=${LVL}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 240000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 240000 });
const info = await p.evaluate(() => {
  const g = window.__game, t = g.track, N = t.center.length, C = t.T.coast;
  g.clock.getDelta = () => 1 / 60;
  for (let k = 0; k < 200 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  const gy = (x, z) => (t._drawnGroundY ? t._drawnGroundY(x, z) : null) ?? t.terrainHeight(x, z);
  let best = null;
  for (let i = 0; i < N; i += 5) {
    const c = t.center[i], n = t.nrm[i];
    for (const sd of [1, -1]) {
      for (let d = 40; d <= 200; d += 10) {
        if (gy(c.x + n.x * d * sd, c.z + n.z * d * sd) < (C.level ?? -2) + 0.5) {
          if (!best || d < best.d) best = { i, sd, d };
          break;
        }
      }
    }
  }
  const c = t.center[best.i], n = t.nrm[best.i];
  // eye: 22u behind the road on the landward side, 16u up; look at the water
  const ex = c.x - n.x * 22 * best.sd, ez = c.z - n.z * 22 * best.sd;
  const tx = c.x + n.x * (best.d + 120) * best.sd, tz = c.z + n.z * (best.d + 120) * best.sd;
  g.frame = () => {};                       // stop the loop re-aiming the boom
  g.camera.position.set(ex, c.y + 16, ez);
  g.camera.lookAt(tx, (C.level ?? -2), tz);
  g.camera.updateMatrixWorld();
  if (g.composer) g.composer.render(); else g.renderer.render(g.scene, g.camera);
  return { world: g.level?.name, station: best.i, waterD: best.d, roadY: +c.y.toFixed(1) };
});
await p.screenshot({ path: OUT, timeout: 120000 });
console.log(JSON.stringify(info), OUT);
await browser.close();
