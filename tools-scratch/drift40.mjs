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
  const runCase = (kmh, steer) => {
    const pt = t.pointAt(50, 0);
    c.alive = true; c.health = 100; c.airborne = false; c.vy = 0;
    c.pos.set(pt.x, t.groundHeightAt(50, 0) + 0.3, pt.z); c.y = c.pos.y;
    c.trackIndex = 50; c.lateral = 0; c.heading = t.headingAt(50);
    c.slip = 0; c.steerSmooth = 0;
    c.vel.set(Math.sin(c.heading), 0, Math.cos(c.heading)).multiplyScalar(kmh / 3.6);
    let maxSlip = 0;
    for (let k = 0; k < 180; k++) {
      c.step(1 / 60, { throttle: 0.5, brake: 0, steer, drift: false, hold: false });
      maxSlip = Math.max(maxSlip, c.slip);
    }
    return { kmh, steer, maxSlip: +maxSlip.toFixed(2),
      endKmh: Math.round(Math.hypot(c.vel.x, c.vel.z) * 3.6) };
  };
  return [runCase(40, 1.0), runCase(40, 0.5), runCase(60, 1.0), runCase(90, 1.0)];
});
console.log(JSON.stringify(r));
await p.close(); await browser.close();
