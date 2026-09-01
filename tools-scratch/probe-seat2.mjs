import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const OUT = '/tmp/claude-0/-home-user-racing-shooter/0a1b4850-fdd3-5cf2-92f1-b12f6b9663b9/scratchpad';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 430, height: 932 } });
await p.goto(`${BASE}/?level=25&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
await p.evaluate(() => {
  const g = window.__game, t = g.track, car = g.player;
  g.clock.getDelta = () => 1 / 60;
  for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  g.setDriverView(true);
  // the ravine bottom under the big shelf (the r320 fall site)
  const i = 325;
  const pt = t.pointAt(i, 17);
  car.trackIndex = i; car.lateral = 17; car.alive = true; car.invuln = 0;
  const ty = t.terrainHeight(pt.x, pt.z);
  car.pos.set(pt.x, ty + 0.3, pt.z); car.y = car.pos.y;
  car.vel.set(0, 0, 0); car.speedAlong = 0; car.airborne = false; car.vy = 0;
  car._lastGY = car.y; car._climbRate = 0;
  for (let k = 0; k < 60; k++) g.frame();
});
await p.screenshot({ path: `${OUT}/seat-ravine.png`, timeout: 90000 });
await browser.close();
console.log('shot');
