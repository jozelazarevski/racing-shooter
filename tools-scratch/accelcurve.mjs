import { chromium } from 'playwright-core';
const BASE = 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
await p.goto(`${BASE}/?level=17&go=1&unlockall=1`, { waitUntil: 'load', timeout: 240000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track, c = g.player;
  g.state = 'race'; g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
  const rows = [];
  for (const v0 of [20, 30, 40, 46, 50, 53]) {
    const pt = t.pointAt(10, 0);
    c.alive = true; c.health = 100; c.airborne = false; c.vy = 0;
    c.pos.set(pt.x, t.groundHeightAt(10, 0) + 0.3, pt.z); c.y = c.pos.y;
    c.trackIndex = 10; c.lateral = 0; c.heading = t.headingAt(10);
    c.slip = 0;
    c.vel.set(Math.sin(c.heading), 0, Math.cos(c.heading)).multiplyScalar(v0);
    const s0 = Math.hypot(c.vel.x, c.vel.z);
    for (let k = 0; k < 30; k++) c.step(1 / 60, { throttle: 1, brake: 0, steer: 0, drift: false, hold: false });
    const s1 = Math.hypot(c.vel.x, c.vel.z);
    rows.push({ v0, a: +((s1 - s0) / 0.5).toFixed(2), gb: +(c._gripBudget ?? -1).toFixed(2),
      maxSpeed: c.maxSpeed });
  }
  return rows;
});
for (const row of r) console.log(JSON.stringify(row));
await p.close(); await browser.close();
