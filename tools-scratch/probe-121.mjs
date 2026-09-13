import { chromium } from 'playwright-core';
const BASE = 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
await p.goto(`${BASE}/?level=1&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track, c = g.player;
  g.state = 'race'; g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
  const dt = 1 / 60;
  const pt = t.pointAt(10, 0);
  c.alive = true; c.health = 100; c.airborne = false; c.vy = 0;
  c.pos.set(pt.x, t.groundHeightAt(10, 0) + 0.3, pt.z); c.y = c.pos.y;
  c.trackIndex = 10; c.lateral = 0; c.heading = t.headingAt(10);
  c.slip = 0; c.steerSmooth = 0;
  c.vel.set(Math.sin(c.heading), 0, Math.cos(c.heading)).multiplyScalar(0);
  const trace = [];
  for (let k = 0; k < 900; k++) {
    c.step(dt, { throttle: 1, brake: 0, steer: 0, drift: false, hold: false });
    if (k % 60 === 59) trace.push({ s: (k + 1) / 60, v: +(Math.hypot(c.vel.x, c.vel.z) * 3.6).toFixed(1),
      idx: c.trackIndex, lat: +c.lateral.toFixed(1), y: +c.y.toFixed(1),
      air: c.airborne, budget: +(c._gripBudget ?? 0).toFixed(2), alive: c.alive });
  }
  // gradient of the first 40 samples
  const grad = [];
  for (let i = 0; i <= 40; i += 10) grad.push(+t.center[i].y.toFixed(1));
  return { trace, grad, surface: t.T?.surface ?? 'dry' };
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
