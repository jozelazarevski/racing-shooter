/* Free camera at a station, looking along the road (or at an offset target). */
import { chromium } from 'playwright-core';
const LVL = Number(process.env.LVL ?? 32), ST = Number(process.env.ST ?? 880);
const AHEAD = Number(process.env.AHEAD ?? 60), UP = Number(process.env.UP ?? 12);
const OUT = process.env.OUT ?? `/tmp/look-${LVL}-${ST}.png`;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 900, height: 520 } });
p.setDefaultTimeout(240000);
await p.goto(`http://localhost:8901/?level=${LVL}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 240000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 240000 });
const info = await p.evaluate(({ ST9, AHEAD9, UP9, process9 }) => {
  const g = window.__game, t = g.track, N = t.center.length;
  g.clock.getDelta = () => 1 / 60;
  for (let k = 0; k < 200 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  const i = ((ST9 % N) + N) % N, c = t.center[i], aim = t.center[(i + AHEAD9) % N];
  g.frame = () => {};
  if (process9.TOP) {
    g.camera.position.set(c.x, c.y + UP9, c.z + 0.01);
    g.camera.lookAt(c.x, c.y, c.z);
  } else {
    g.camera.position.set(c.x, c.y + UP9, c.z);
    g.camera.lookAt(aim.x, aim.y + 2, aim.z);
  }
  g.camera.updateMatrixWorld();
  if (g.composer) g.composer.render(); else g.renderer.render(g.scene, g.camera);
  return { world: g.level?.name, station: i, roadY: +c.y.toFixed(1) };
}, { ST9: ST, AHEAD9: AHEAD, UP9: UP, process9: { TOP: !!process.env.TOP } });
await p.screenshot({ path: OUT, timeout: 120000 });
console.log(JSON.stringify(info), OUT);
await browser.close();
