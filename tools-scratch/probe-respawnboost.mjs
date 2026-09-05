import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
await p.goto(`${BASE}/?level=1&go=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, car = g.player;
  g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
  for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  // A: wreck mid-boost, respawn
  car.boostTimer = 3.0;
  car.health = 1; car.invuln = 0;
  car.damage(50, null, true);
  const dead = !car.alive;
  car.respawnTimer = 0.01;
  for (let k = 0; k < 30 && !car.alive; k++) g.frame();
  const a = { dead, aliveAgain: car.alive, boostAfter: +car.boostTimer.toFixed(2),
    speedAfter: +Math.hypot(car.vel.x, car.vel.z).toFixed(1) };
  // B: returnToGate speed + boost
  car.boostTimer = 3.0;
  g.returnToGate(car, (car._nextGate ?? 1) % 4 || 1, 'probe');
  const b = { speed: +Math.hypot(car.vel.x, car.vel.z).toFixed(1),
    boost: +car.boostTimer.toFixed(2) };
  return { a, b };
});
console.log(JSON.stringify(r));
await browser.close();
