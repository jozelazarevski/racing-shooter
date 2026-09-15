import { chromium } from 'playwright-core';
const BASE = 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
await p.goto(`${BASE}/?level=10&go=1&unlockall=1`, { waitUntil: 'load', timeout: 240000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track, N = t.center.length, car = g.player;
  g.state = 'race'; g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
  const s0 = t.center[10];
  car.alive = true; car.health = 1e9;
  car.pos.set(s0.x, s0.y + 0.4, s0.z); car.y = car.pos.y; car.trackIndex = 10;
  car.heading = Math.atan2(t.center[16].x - s0.x, t.center[16].z - s0.z);
  car.vel.set(0, 0, 0); car.airborne = false;
  let adv = 0, last = 10, hops = 0, wasAir = false, brakeT = 0;
  const spd = [];
  for (let k = 0; k < 60 * 90; k++) {
    const i = car.trackIndex, aim = t.center[(i + 8) % N];
    let d = Math.atan2(aim.x - car.pos.x, aim.z - car.pos.z) - car.heading;
    while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
    const jA = (i + 6) % N, jB = (i + 14) % N;
    const hA = Math.atan2(t.center[jA].x - t.center[i].x, t.center[jA].z - t.center[i].z);
    const hB = Math.atan2(t.center[jB].x - t.center[jA].x, t.center[jB].z - t.center[jA].z);
    let turn = hB - hA;
    while (turn > Math.PI) turn -= 2 * Math.PI; while (turn < -Math.PI) turn += 2 * Math.PI;
    const su = t.segLen ?? 4;
    const R = Math.max(6, (8 * su) / Math.max(0.05, Math.abs(turn)));
    const vmax = Math.sqrt(1.15 * 14 * R);
    const v = Math.hypot(car.vel.x, car.vel.z);
    const over = v > vmax;
    if (over) brakeT += 1 / 60;
    car.step(1 / 60, { throttle: over ? 0 : 1, brake: over ? 1 : 0,
      steer: Math.max(-1, Math.min(1, d * 2)), drift: false, hold: false });
    let dd = car.trackIndex - last; if (dd > N / 2) dd -= N; if (dd < -N / 2) dd += N;
    adv += dd; last = car.trackIndex;
    if (k % 360 === 0) spd.push(Math.round(v * 3.6));
    if (car.airborne) wasAir = true; else if (wasAir) { hops++; wasAir = false; }
  }
  return { laps: +(adv / N).toFixed(2), hops, brakeT: +brakeT.toFixed(1), spd,
    maxU: +Math.max(...spd.map(s => s / 3.6)).toFixed(1) };
});
console.log(JSON.stringify(r));
await p.close(); await browser.close();
