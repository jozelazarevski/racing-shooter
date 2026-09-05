/* Why does the jump rig post 0 hops on FURKA? Same rig, with telemetry:
 * distance covered, laps, mean speed, off-road time, min speed windows. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
await p.goto(`${BASE}/?level=21&go=1&unlockall=1`, { waitUntil: 'load', timeout: 240000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track, N = t.center.length, car = g.player;
  g.state = 'race'; g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
  const s0 = t.center[10];
  car.alive = true; car.health = 1e9;
  car.pos.set(s0.x, s0.y + 0.4, s0.z); car.y = car.pos.y; car.trackIndex = 10;
  car.heading = Math.atan2(t.center[16].x - s0.x, t.center[16].z - s0.z);
  car.vel.set(0, 0, 0); car.airborne = false;
  let adv = 0, last = 10, offT = 0, air = 0, hops = 0, wasAir = false, minKmh = 1e9, slowT = 0;
  const spd = [];
  for (let k = 0; k < 60 * 90; k++) {
    const i = car.trackIndex, aim = t.center[(i + 8) % N];
    let d = Math.atan2(aim.x - car.pos.x, aim.z - car.pos.z) - car.heading;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    car.step(1 / 60, { throttle: 1, brake: 0, steer: Math.max(-1, Math.min(1, d * 2)), drift: false, hold: false });
    let dd = car.trackIndex - last; if (dd > N / 2) dd -= N; if (dd < -N / 2) dd += N;
    adv += dd; last = car.trackIndex;
    const kmh = Math.hypot(car.vel.x, car.vel.z) * 3.6;
    if (k % 60 === 0) spd.push(Math.round(kmh));
    if (kmh < 30) slowT += 1 / 60;
    if (Math.abs(car.lateral) > 9) offT += 1 / 60;
    if (car.airborne) { wasAir = true; } else if (wasAir) { hops++; wasAir = false; }
  }
  return { lapsAdv: +(adv / N).toFixed(2), hops, offT: +offT.toFixed(1), slowT: +slowT.toFixed(1),
    speeds: spd.filter((_, i) => i % 6 === 0) };
});
console.log(JSON.stringify(r));
await p.close(); await browser.close();
