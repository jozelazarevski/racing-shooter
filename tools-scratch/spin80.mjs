import { chromium } from 'playwright-core';
const BASE = 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
await p.goto(`${BASE}/?level=1&go=1&unlockall=1`, { waitUntil: 'load', timeout: 240000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track, c = g.player;
  g.state = 'race'; g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
  g.__gripProbe = {};
  const pt = t.pointAt(200, 0);
  c.alive = true; c.health = 100; c.airborne = false; c.vy = 0;
  c.pos.set(pt.x, t.groundHeightAt(200, 0) + 0.3, pt.z); c.y = c.pos.y;
  c.trackIndex = 200; c.lateral = 0; c.heading = t.headingAt(200);
  c.slip = 0; c.steerSmooth = 0; c._hbKick = 0;
  c.vel.set(Math.sin(c.heading), 0, Math.cos(c.heading)).multiplyScalar(80 / 3.6);
  const rows = [];
  for (let k = 0; k < 180; k++) {
    c.step(1 / 60, { throttle: 0.6, brake: 0, steer: 1, drift: false, hold: false });
    if (k % 12 === 0) {
      const sp = Math.hypot(c.vel.x, c.vel.z);
      const f = c.forward, dot = sp > 0.5 ? (f.x * c.vel.x + f.z * c.vel.z) / sp : 1;
      rows.push({ k, kmh: Math.round(sp * 3.6), slip: +c.slip.toFixed(2),
        beta: Math.round(Math.acos(Math.max(-1, Math.min(1, Math.abs(dot)))) * 180 / Math.PI),
        over: +(g.__gripProbe.over ?? 0).toFixed(2),
        dTh: +((g.__gripProbe.dTheta ?? 0) * 60).toFixed(2),
        vf: g.__gripProbe.vf, vl: g.__gripProbe.vl, offRd: Math.abs(c.lateral) > 10 ? 1 : 0 });
    }
  }
  return rows;
});
for (const row of r) console.log(JSON.stringify(row));
await p.close(); await browser.close();
