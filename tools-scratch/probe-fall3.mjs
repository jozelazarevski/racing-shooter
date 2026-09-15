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
  const i = 325;
  const pt = t.pointAt(i, 17);
  car.trackIndex = i; car.lateral = 17; car.alive = true; car.health = 100;
  car.pos.set(pt.x, t.center[i].y + 0.3, pt.z); car.y = car.pos.y;
  car.vel.set(0, 0, 0); car.speedAlong = 0; car.airborne = false; car.vy = 0;
  car._climbRate = 0; car._settleT = 0; car._lastGY = car.y; car.invuln = 0;
  const dmgCalls = [];
  const origDamage = car.damage.bind(car);
  car.damage = (a, at, raw) => { dmgCalls.push({ a: +a.toFixed(1), invuln: +(car.invuln ?? 0).toFixed(2) }); return origDamage(a, at, raw); };
  const origOnLand = car.onLand.bind(car);
  let landImpact = null;
  car.onLand = () => { landImpact = +(car._impactVy ?? 0).toFixed(1); return origOnLand(); };
  for (let k = 0; k < 240; k++) {
    car.step(1 / 60, { throttle: 0, brake: 0, steer: 0, drift: false, hold: false });
  }
  return { landImpact, dmgCalls, hp: Math.round(car.health), alive: car.alive,
    invulnNow: +(car.invuln ?? 0).toFixed(2), damperLvl: car.damperLvl ?? 0 };
});
console.log(JSON.stringify(r));
await browser.close();
