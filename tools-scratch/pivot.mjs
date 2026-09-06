/* Yaw at standstill and at crawl: parked must be 0, hairpin crawl must steer. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
await p.goto(`${BASE}/?level=1&go=1&unlockall=1`, { waitUntil: 'load', timeout: 240000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track, c = g.player;
  g.state = 'race'; g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
  const test = (kmh) => {
    const pt = t.pointAt(50, 0);
    c.alive = true; c.health = 100; c.airborne = false; c.vy = 0;
    c.pos.set(pt.x, t.groundHeightAt(50, 0) + 0.3, pt.z); c.y = c.pos.y;
    c.trackIndex = 50; c.heading = t.headingAt(50); c.slip = 0; c.steerSmooth = 0;
    c.vel.set(Math.sin(c.heading), 0, Math.cos(c.heading)).multiplyScalar(kmh / 3.6);
    const h0 = c.heading;
    for (let k = 0; k < 120; k++) c.step(1 / 60, { throttle: 0, brake: 0, steer: 1, drift: false, hold: false });
    return +((c.heading - h0) * 180 / Math.PI).toFixed(1);
  };
  return { parked_deg_2s: test(0), kmh5: test(5), kmh14: test(14), kmh30: test(30) };
});
console.log(JSON.stringify(r));
await p.close(); await browser.close();
