import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
await p.goto(`${BASE}/?level=10&go=1&unlockall=1`, { waitUntil: 'load', timeout: 240000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track, N = t.center.length, car = g.player;
  g.state = 'race'; g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
  const s = (118 - 40 + N) % N, c0 = t.center[s];
  car.alive = true; car.health = 1e9; car.airborne = false; car.vy = 0;
  car.pos.set(c0.x, c0.y + 0.4, c0.z); car.y = car.pos.y; car.trackIndex = s;
  car.heading = t.headingAt(s);
  car.vel.set(Math.sin(car.heading), 0, Math.cos(car.heading)).multiplyScalar(44);
  car.slip = 0;
  const rows = [];
  for (let k = 0; k < 160; k++) {
    const i2 = car.trackIndex, aim = t.center[(i2 + 8) % N];
    let d = Math.atan2(aim.x - car.pos.x, aim.z - car.pos.z) - car.heading;
    while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
    car.step(1 / 60, { throttle: 1, brake: 0, steer: Math.max(-1, Math.min(1, d * 2)), drift: false, hold: false });
    const near = ((i2 - 112 + N) % N) < 14;
    if (near || car.airborne) rows.push({ k, idx: car.trackIndex,
      kmh: Math.round(Math.hypot(car.vel.x, car.vel.z) * 3.6),
      y: +car.y.toFixed(2), cr: +(car._climbRate ?? 0).toFixed(1),
      air: car.airborne ? 1 : 0, lat: +(car.lateral ?? 0).toFixed(1) });
  }
  return rows.slice(0, 26);
});
for (const row of r) console.log(JSON.stringify(row));
await p.close(); await browser.close();
