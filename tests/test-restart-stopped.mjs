/* r324 — A RESTARTED CAR STANDS (owner: "When car restarts after selecting
 * goes straight to nitro. Should be stopped.")
 *
 * Measured before the fix: a wreck respawn carried boostTimer 3.0 s through
 * death (the car came back SURGING with the nitro flame), and returnToGate
 * handed every recovery 40 km/h on top. Now every placement (placeAt) kills
 * any burning boost, and returnSpeedKmh is 0 — owner override of §3.6,
 * recorded as CLAUDE.md 3.6b.
 *
 *   T1  a wreck mid-boost respawns with ZERO boost and zero speed
 *   T2  returnToGate (SOS/stuck/missed gate share it) leaves the car
 *       standing, boost dead, heading on the tangent
 *   T3  the race-start grid is still clean after a car swap (no stale state)
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';
let fail = 0;
const check = (n, ok, d = '') => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  ' + d : ''}`); };

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
const errs = [];
p.on('pageerror', (e) => errs.push(String(e).slice(0, 140)));
await p.goto(`${BASE}/?level=1&go=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 300000 });

const r = await p.evaluate(async () => {
  const g = window.__game, car = g.player;
  g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
  for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  // T1: wreck mid-boost
  car.boostTimer = 3.0; car.health = 1; car.invuln = 0;
  car.damage(50, null, true);
  car.respawnTimer = 0.01;
  for (let k = 0; k < 30 && !car.alive; k++) g.frame();
  const t1 = { alive: car.alive, boost: +car.boostTimer.toFixed(2),
    speed: +Math.hypot(car.vel.x, car.vel.z).toFixed(1) };
  // T2: the one return function
  car.boostTimer = 3.0;
  const gid = 1;
  g.returnToGate(car, gid, 'probe');
  const tan = g.track.headingAt(car.trackIndex);
  const dh = Math.abs(((car.heading - tan + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
  const t2 = { speed: +Math.hypot(car.vel.x, car.vel.z).toFixed(1),
    boost: +car.boostTimer.toFixed(2), headErr: +dh.toFixed(2) };
  // T3: swap machine, full reset, sample the grid with zero input
  const { CAR_CATALOG } = await import('./src/vehicles.js');
  g.cars.owned = ['brawler', 'sleek']; g.cars.selected = 'sleek';
  g.swapPlayerCar(CAR_CATALOG.find((c) => c.key === 'sleek'));
  g.resetRace();
  const t3 = { speed: +Math.hypot(car.vel.x, car.vel.z).toFixed(1),
    boost: +car.boostTimer.toFixed(2) };
  return { t1, t2, t3 };
});

check('T1  a wreck mid-boost respawns standing, boost dead',
  r.t1.alive && r.t1.boost === 0 && r.t1.speed === 0, JSON.stringify(r.t1));
check('T2  returnToGate leaves the car stopped on the tangent',
  r.t2.speed === 0 && r.t2.boost === 0 && r.t2.headErr < 0.1, JSON.stringify(r.t2));
check('T3  the grid is clean after selecting a different machine',
  r.t3.speed === 0 && r.t3.boost === 0, JSON.stringify(r.t3));
check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));

await browser.close();
console.log(fail ? `\n${fail} FAILED` : '\na restart stands still');
process.exit(fail ? 1 : 0);
