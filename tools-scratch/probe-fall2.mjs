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
  let best = null;
  for (let i = 40; i < t.center.length - 40; i += 5) {
    const pt = t.pointAt(i, 20);
    const gap = t.center[i].y - t.terrainHeight(pt.x, pt.z);
    if (!best || gap > best.gap) best = { i, gap: +gap.toFixed(1) };
  }
  const i = best.i;
  // place JUST past the deck edge at deck height — the frame after leaving
  const pt = t.pointAt(i, 17);
  car.trackIndex = i; car.lateral = 17; car.alive = true; car.health = 100;
  car.pos.set(pt.x, t.center[i].y + 0.3, pt.z); car.y = car.pos.y;
  car.vel.set(0, 0, 0); car.speedAlong = 0; car.airborne = false; car.vy = 0;
  car._climbRate = 0; car._settleT = 0; car._lastGY = car.y;
  const trace = [];
  let wentAirborne = false;
  for (let k = 0; k < 240; k++) {
    car.step(1 / 60, { throttle: 0, brake: 0, steer: 0, drift: false, hold: false });
    if (car.airborne) wentAirborne = true;
    if (k < 6 || k % 30 === 0) trace.push({ k, y: +car.y.toFixed(1), lat: +car.lateral.toFixed(1),
      air: car.airborne, hp: Math.round(car.health), vy: +car.vy.toFixed(1) });
  }
  return { shelf: best, wentAirborne, hpEnd: Math.round(car.health), alive: car.alive,
    deckY: +t.center[i].y.toFixed(1),
    terrY: +t.terrainHeight(pt.x, pt.z).toFixed(1), trace };
});
console.log(JSON.stringify(r));
await browser.close();
