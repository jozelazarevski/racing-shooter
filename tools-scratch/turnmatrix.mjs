/* Turn response matrix: at each speed, full lock for 2 s on flat road —
 * report path radius actually driven, slip, and speed kept. */
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
  const out = [];
  for (const kmh of [40, 80, 110, 140, 180]) {
    const pt = t.pointAt(50, 0);
    c.alive = true; c.health = 100; c.airborne = false; c.vy = 0;
    c.pos.set(pt.x, t.groundHeightAt(50, 0) + 0.3, pt.z); c.y = c.pos.y;
    c.trackIndex = 50; c.lateral = 0; c.heading = t.headingAt(50);
    c.slip = 0; c.steerSmooth = 0;
    c.vel.set(Math.sin(c.heading), 0, Math.cos(c.heading)).multiplyScalar(kmh / 3.6);
    let swept = 0, prev = Math.atan2(c.vel.x, c.vel.z), dist = 0, maxSlip = 0;
    for (let k = 0; k < 120; k++) {
      c.step(1 / 60, { throttle: 0.6, brake: 0, steer: 1, drift: false, hold: false });
      const v = Math.hypot(c.vel.x, c.vel.z);
      let dd = Math.atan2(c.vel.x, c.vel.z) - prev;
      while (dd > Math.PI) dd -= 2 * Math.PI; while (dd < -Math.PI) dd += 2 * Math.PI;
      swept += Math.abs(dd); prev = Math.atan2(c.vel.x, c.vel.z);
      dist += v / 60; maxSlip = Math.max(maxSlip, c.slip);
    }
    out.push({ kmh, pathRadius: swept > 0.05 ? Math.round(dist / swept) : 9999,
      degPerS: Math.round(swept * 30 / Math.PI * 180) / 10 > 0 ? +(swept / 2 * 180 / Math.PI).toFixed(0) : 0,
      maxSlip: +maxSlip.toFixed(2), endKmh: Math.round(Math.hypot(c.vel.x, c.vel.z) * 3.6) });
  }
  return out;
});
for (const row of r) console.log(JSON.stringify(row));
await p.close(); await browser.close();
