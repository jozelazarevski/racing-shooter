/* Screenshot tour: place the player mid-lap on given worlds, drive a couple
 * of seconds, shoot CAM=3 (and driver view where asked). */
import { chromium } from 'playwright-core';
const SHOTS = [ { lvl: 29, idx: 8, cam: 3, out: '/tmp/shot-olive-start.png' } ];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
for (const s of SHOTS) {
  const p = await browser.newPage({ viewport: { width: 480, height: 854 } });
  await p.goto(`http://localhost:8901/?level=${s.lvl}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
  await p.waitForFunction(() => window.__game?.track?.center && window.__game.player,
    undefined, { timeout: 300000 });
  await p.evaluate(({ idx, cam }) => {
    const g = window.__game, t = g.track, c = g.player;
    for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
    g.camMode = cam === 'driver'
      ? g.constructor.CAM_MODES.findIndex(m => m.driver) : cam;
    const pt = t.center[idx];
    c.pos.set(pt.x, pt.y + 0.4, pt.z); c.y = c.pos.y;
    c.trackIndex = idx; c.heading = t.headingAt(idx);
    c.vel.set(Math.sin(c.heading), 0, Math.cos(c.heading)).multiplyScalar(18);
    g.input.analog.throttle = 1;
  }, s);
  await p.waitForTimeout(3500);
  await p.screenshot({ path: s.out });
  console.log('saved', s.out);
  await p.close();
}
await browser.close();
