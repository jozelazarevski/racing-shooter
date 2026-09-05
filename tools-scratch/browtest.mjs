/* Does ROCKFALL still launch? Find the 3 sharpest brows in the road profile,
 * place the car 40 samples before each at racing speed, drive straight
 * through at full throttle, report airborne. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const LVL = process.argv[2] ?? '10';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
await p.goto(`${BASE}/?level=${LVL}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 240000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track, N = t.center.length, car = g.player;
  g.state = 'race'; g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
  // brow score: second difference of y (downward curvature)
  const brows = [];
  for (let i = 0; i < N; i++) {
    const y0 = t.center[(i - 4 + N) % N].y, y1 = t.center[i].y, y2 = t.center[(i + 4) % N].y;
    brows.push({ i, curv: (y1 - y0) + (y1 - y2) });
  }
  brows.sort((a, b) => b.curv - a.curv);
  const out = [];
  for (const b of brows.slice(0, 3)) {
    const s = (b.i - 40 + N) % N;
    car.alive = true; car.health = 1e9; car.airborne = false; car.vy = 0;
    const c0 = t.center[s];
    car.pos.set(c0.x, c0.y + 0.4, c0.z); car.y = car.pos.y; car.trackIndex = s;
    car.heading = t.headingAt(s);
    car.vel.set(Math.sin(car.heading), 0, Math.cos(car.heading)).multiplyScalar(44); // 158 km/h
    car.slip = 0;
    let launched = false, maxAir = 0, air = 0;
    for (let k = 0; k < 300; k++) {
      const i2 = car.trackIndex, aim = t.center[(i2 + 8) % N];
      let d = Math.atan2(aim.x - car.pos.x, aim.z - car.pos.z) - car.heading;
      while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
      car.step(1 / 60, { throttle: 1, brake: 0, steer: Math.max(-1, Math.min(1, d * 2)), drift: false, hold: false });
      if (car.airborne) { launched = true; air += 1 / 60; maxAir = Math.max(maxAir, air); } else air = 0;
    }
    out.push({ brow: b.i, curv: +b.curv.toFixed(2), launched, maxAir: +maxAir.toFixed(2),
      kmhAtEnd: Math.round(Math.hypot(car.vel.x, car.vel.z) * 3.6) });
  }
  return out;
});
console.log(JSON.stringify(r));
await p.close(); await browser.close();
