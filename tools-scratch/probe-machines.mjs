import { chromium } from 'playwright-core';
const BASE = 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
await p.goto(`${BASE}/?level=1&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player && window.__CARS, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track;
  g.state = 'race'; g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
  const dt = 1 / 60;
  const place = (idx, kmh = 0) => {
    const c = g.player; const pt = t.pointAt(idx, 0);
    c.alive = true; c.health = c.maxHealth; c.airborne = false; c.vy = 0;
    c.pos.set(pt.x, t.groundHeightAt(idx, 0) + 0.3, pt.z); c.y = c.pos.y;
    c.trackIndex = idx; c.lateral = 0; c.heading = t.headingAt(idx);
    c.slip = 0; c.steerSmooth = 0; c._hbKick = 0; c._hbHeld = false;
    c.vel.set(Math.sin(c.heading), 0, Math.cos(c.heading)).multiplyScalar(kmh / 3.6);
  };
  const out = [];
  // BEFORE any swap: the boot player (brawler), same as drivingspec
  const runOne = (label) => {
    const c = g.player;
    place(10, 0);
    const trace = [];
    for (let k = 0; k < 900; k++) {
      c.step(dt, { throttle: 1, brake: 0, steer: 0, drift: false, hold: false });
      if (k % 120 === 119) trace.push(+(Math.hypot(c.vel.x, c.vel.z) * 3.6).toFixed(1));
    }
    out.push({ label, accel: c.accel, grip: c.grip, budget: c._gripBudget,
      maxSpeed: c.maxSpeed, offroadSkill: c.offroadSkill, tyre: c.tyreClass ?? c._tyre ?? null,
      trace });
  };
  runOne('boot-brawler');
  g.swapPlayerCar(window.__CARS[0]); runOne('swapped-brawler');
  g.swapPlayerCar(window.__CARS.find((e) => e.name === 'CROWN')); runOne('swapped-crown');
  g.swapPlayerCar(window.__CARS.find((e) => e.name === 'FLATSIX')); runOne('swapped-flatsix');
  const up = g.carUpgrades ? g.carUpgrades() : null;
  return { out, up, fitted: { engine: g.fittedPart?.('engine'), spoiler: g.fittedPart?.('spoiler') } };
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
