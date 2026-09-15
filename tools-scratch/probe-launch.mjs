import { chromium } from 'playwright-core';
const BASE = 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
await p.goto(`${BASE}/?level=17&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player && window.__CARS, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track;
  g.state = 'race'; g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
  const dt = 1 / 60;
  const place = (idx, speedU = 0) => {
    const c = g.player; const pt = t.pointAt(idx, 0);
    c.alive = true; c.health = c.maxHealth; c.airborne = false; c.vy = 0;
    c.pos.set(pt.x, t.groundHeightAt(idx, 0) + 0.3, pt.z); c.y = c.pos.y;
    c.trackIndex = idx; c.lateral = 0; c.heading = t.headingAt(idx);
    c.slip = 0; c.steerSmooth = 0; c._hbKick = 0; c._hbHeld = false;
    c.vel.set(Math.sin(c.heading), 0, Math.cos(c.heading)).multiplyScalar(speedU);
  };
  const out = {};
  for (const nm of ['ALPINE', 'FLATSIX', 'CROWN']) {
    const entry = window.__CARS.find((e) => e.name === nm);
    g.cars.selected = entry.key; g.swapPlayerCar(entry);
    const c = g.player;
    place(10, 0);
    const snap = [];
    for (let k = 0; k < 480; k++) {
      if (k > 0 && k % 90 === 0) place(10, Math.hypot(c.vel.x, c.vel.z));
      c.step(dt, { throttle: 1, brake: 0, steer: 0, drift: false, hold: false });
      if (k === 5 || k === 60 || k === 180 || k === 300) {
        snap.push({ k, v: +(Math.hypot(c.vel.x, c.vel.z) * 3.6).toFixed(1),
          budget: +(c._gripBudget ?? 0).toFixed(2), tf: +(c._tyreFactor ?? 1).toFixed(3),
          slip: +(c.slip ?? 0).toFixed(2) });
      }
    }
    out[nm] = { accel: c.accel, grip: c.grip, over: c._tyreOver, under: c._tyreUnder, snap };
  }
  return out;
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
