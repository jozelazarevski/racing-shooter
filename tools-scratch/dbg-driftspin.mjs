/* r341 debug — why do two identical hold-phases differ? Frame-level trace. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
p.on('pageerror', (e) => console.log('PAGEERR', String(e).slice(0, 120)));
await p.goto(`${BASE}/?level=1&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 300000 });
const out = await p.evaluate(() => {
  const g = window.__game, t = g.track, N = t.center.length;
  g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
  g.resetRace(); g.startRace?.();
  for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  const pl = g.player;
  for (const e of g.enemies) { e.pos.x += 5000; e.alive = false; }
  let best = 0, bestC = 1e9;
  for (let i = 0; i < N; i++) {
    let c = 0;
    for (let k = 0; k < 20; k++) {
      let d = t.headingAt((i + k + 1) % N) - t.headingAt((i + k) % N);
      while (d > Math.PI) d -= 2 * Math.PI;
      while (d < -Math.PI) d += 2 * Math.PI;
      c += Math.abs(d);
    }
    if (c < bestC) { bestC = c; best = i; }
  }
  const lines = [];
  const trial = (kmh, label, preRoll) => {
    const sp = kmh / 3.1;
    const c0 = t.center[best], h = t.headingAt(best);
    pl.pos.set(c0.x, c0.y + 0.5, c0.z);
    pl.heading = h; pl.vel.set(Math.sin(h) * sp, 0, Math.cos(h) * sp);
    pl.slip = 0; pl._hbKick = 0; pl._hbHeld = false; pl._landT = 0; pl.health = 200;
    // preRoll: settle N frames driving straight before the flick (the paired
    // trial effectively starts from the previous trial's settled ground state)
    for (let f = 0; f < preRoll; f++) {
      g.input.analog.steer = 0; g.input.analog.throttle = 1; g.input.keys.delete('ShiftLeft');
      g.frame();
    }
    lines.push(`--- ${label} kmh=${kmh} preRoll=${preRoll} spNow=${(Math.hypot(pl.vel.x, pl.vel.z) * 3.1).toFixed(0)}`);
    for (let f = 0; f < 48; f++) {
      g.input.analog.steer = 1; g.input.analog.throttle = 1;
      g.input.keys.add('ShiftLeft');
      g.frame();
      const fwd = pl.forward;
      const vf = pl.vel.x * fwd.x + pl.vel.z * fwd.z;
      const vl = pl.vel.x * fwd.z - pl.vel.z * fwd.x;
      if (f % 4 === 0) {
        lines.push(`f${String(f).padStart(2)} sp=${(Math.hypot(vf, vl) * 3.1).toFixed(0)} `
          + `beta=${(Math.atan2(Math.abs(vl), Math.max(0.5, Math.abs(vf))) * 180 / Math.PI).toFixed(0)} `
          + `slip=${pl.slip?.toFixed(2)} kick=${pl._hbKick?.toFixed(2) ?? '0'} `
          + `air=${pl.airborne ? 1 : 0} landT=${(pl._landT ?? 0).toFixed(2)} `
          + `budget=${(pl._gripBudget ?? pl.grip).toFixed(2)} capM=${pl._yawCapM?.toFixed(2)} `
          + `over=${pl._overGrip?.toFixed(2)} head=${(pl.heading * 180 / Math.PI).toFixed(0)}`);
      }
    }
    g.input.keys.delete('ShiftLeft');
    g.input.analog.steer = 0; g.input.analog.throttle = 0;
    for (let f = 0; f < 120; f++) g.frame();
  };
  trial(140, 'first(plain-order)', 0);
  trial(140, 'second(ctr-order)', 0);
  trial(140, 'settled', 30);
  return lines;
});
console.log(out.join('\n'));
await browser.close();
