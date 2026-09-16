/* Reproduce the phone report: PIKES PEAK, roll slowly off the shelf edge,
 * trace y vs ground, airborne, health. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
await p.goto(`${BASE}/?level=25&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track, car = g.player;
  g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
  for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  // find a big shelf: sample where road sits far above terrain at lateral 20
  let best = null;
  for (let i = 40; i < t.center.length - 40; i += 5) {
    const pt = t.pointAt(i, 20);
    const gap = t.center[i].y - t.terrainHeight(pt.x, pt.z);
    if (!best || gap > best.gap) best = { i, gap: +gap.toFixed(1) };
  }
  // park at the edge, give it a slow sideways push over
  const i = best.i;
  car.placeAt ? car.placeAt(i, 8) : null;
  car.trackIndex = i; car.lateral = 8; car.alive = true; car.health = 100;
  const pt = t.pointAt(i, 8);
  car.pos.set(pt.x, t.groundHeightAt(i, 8) + 0.3, pt.z); car.y = car.pos.y;
  car.vel.set(0, 0, 0); car.speedAlong = 0; car.airborne = false; car.vy = 0;
  // push outward at 4 u/s (a slow roll off the edge)
  const tan = t.tan[i]; const nx = -tan.z, nz = tan.x;
  const hp0 = car.health;
  const trace = [];
  let wentAirborne = false, minY = car.y;
  for (let k = 0; k < 300; k++) {
    car.vel.x = nx * 4; car.vel.z = nz * 4;   // hold the slow outward roll
    car.step(1 / 60, { throttle: 0, brake: 0, steer: 0, drift: false, hold: false });
    if (car.airborne) wentAirborne = true;
    minY = Math.min(minY, car.y);
    if (k % 30 === 0) trace.push({ k, y: +car.y.toFixed(1), lat: +car.lateral.toFixed(1),
      air: car.airborne, hp: car.health, vy: +car.vy.toFixed(1) });
  }
  return { shelf: best, wentAirborne, hp0, hpEnd: car.health, alive: car.alive,
    startY: +t.groundHeightAt(i, 8).toFixed(1), minY: +minY.toFixed(1), trace };
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
