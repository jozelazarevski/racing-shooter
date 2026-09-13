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
  const place = (idx, kmh = 0) => {
    const pt = t.pointAt(idx, 0);
    c.alive = true; c.health = 100; c.airborne = false; c.vy = 0;
    c.pos.set(pt.x, t.groundHeightAt(idx, 0) + 0.3, pt.z); c.y = c.pos.y;
    c.trackIndex = idx; c.lateral = 0; c.heading = t.headingAt(idx);
    c.slip = 0; c.steerSmooth = 0; c._hbKick = 0; c._hbHeld = false;
    c.vel.set(Math.sin(c.heading), 0, Math.cos(c.heading)).multiplyScalar(kmh / 3.6);
  };
  const kmh = () => Math.hypot(c.vel.x, c.vel.z) * 3.6;
  place(10, 0);
  const rows = [];
  for (let k = 0; k < 600; k++) {
    const pre = kmh();
    if (k > 0 && k % 90 === 0) {
      place(10, pre);
      rows.push({ k, event: 'hop', pre: +pre.toFixed(1), post: +kmh().toFixed(1) });
    }
    c.step(dt, { throttle: 1, brake: 0, steer: 0, drift: false, hold: false });
    if (k % 30 === 29) rows.push({ k, v: +kmh().toFixed(1), budget: +(c._gripBudget ?? 0).toFixed(2),
      wetT: +(c._wetT ?? 0).toFixed(2), slip: +(c.slip ?? 0).toFixed(2), land: +(c.landGrip ?? 0).toFixed(2) });
  }
  return rows;
});
console.log(JSON.stringify(r));
await browser.close();
