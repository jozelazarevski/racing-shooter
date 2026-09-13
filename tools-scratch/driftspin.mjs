/* r341 probe — "Drift is spinning the car way too much" (owner, on r340).
 * Measure, don't guess: at a sweep of road speeds, flick a drift the way a
 * thumb does (drift + full steer held ~0.8 s through a corner entry, then
 * released), and log what the car actually does:
 *   - peak slip angle beta while held and after release
 *   - total heading rotation while held, and EXTRA rotation after release
 *     (the "keeps spinning" number)
 *   - time from release to slip < 10 deg with hands off
 *   - same again with counter-steer applied at release (FT4's shape)
 */
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

const rows = await p.evaluate(() => {
  const g = window.__game, t = g.track, N = t.center.length;
  g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
  g.resetRace(); g.startRace?.();
  for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  const pl = g.player;
  // rivals out of the experiment
  for (const e of g.enemies) { e.pos.x += 5000; e.alive = false; }
  // find a long straight: lowest curvature over a 20-sample window
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
  const norm = (a) => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
  const trial = (kmh, holdS, counter) => {
    const sp = kmh / 3.1;
    const c0 = t.center[best], h = t.headingAt(best);
    pl.pos.set(c0.x, c0.y + 0.5, c0.z);
    pl.heading = h; pl.vel.set(Math.sin(h) * sp, 0, Math.cos(h) * sp);
    pl.slip = 0; pl._hbKick = 0; pl._hbHeld = false; pl._landT = 0; pl.health = 200;
    let prevH = pl.heading, rotHold = 0, rotAfter = 0, maxBetaHold = 0, maxBetaAfter = 0;
    let recoverT = null, spinFrames = 0;
    const F = Math.round(holdS * 60), AFTER = 180;
    for (let f = 0; f < F + AFTER; f++) {
      const held = f < F;
      g.input.analog.steer = held ? 1 : (counter ? -1 : 0);
      g.input.analog.throttle = held ? 1 : (counter ? 0.5 : 0);
      g.input.analog.brake = 0;
      if (held) g.input.keys.add('ShiftLeft'); else g.input.keys.delete('ShiftLeft');
      g.frame();
      const fwd = pl.forward;
      const vf = pl.vel.x * fwd.x + pl.vel.z * fwd.z;
      const vl = pl.vel.x * fwd.z - pl.vel.z * fwd.x;
      const beta = Math.atan2(Math.abs(vl), Math.max(0.5, Math.abs(vf))) * 180 / Math.PI;
      const dH = norm(pl.heading - prevH); prevH = pl.heading;
      if (held) { rotHold += dH; maxBetaHold = Math.max(maxBetaHold, beta); }
      else {
        rotAfter += dH; maxBetaAfter = Math.max(maxBetaAfter, beta);
        if (beta > 65) spinFrames++;
        if (recoverT === null && beta < 10) recoverT = (f - F) / 60;
        if (counter && recoverT !== null) { g.input.analog.steer = 0; }
      }
    }
    return {
      kmh, holdS, counter: !!counter,
      rotHoldDeg: +(rotHold * 180 / Math.PI).toFixed(0),
      rotAfterDeg: +(rotAfter * 180 / Math.PI).toFixed(0),
      maxBetaHold: +maxBetaHold.toFixed(0), maxBetaAfter: +maxBetaAfter.toFixed(0),
      spinFrames, recoverS: recoverT === null ? '>3' : +recoverT.toFixed(2),
      endKmh: +(Math.hypot(pl.vel.x, pl.vel.z) * 3.1).toFixed(0),
    };
  };
  const out = [];
  for (const kmh of [40, 60, 70, 90, 110, 140, 170]) {
    out.push(trial(kmh, 0.8, false));
    out.push(trial(kmh, 0.8, true));
  }
  // long held drift, the "hold it through the whole corner" case
  for (const kmh of [70, 110, 140]) out.push(trial(kmh, 2.0, false));
  return out;
});
for (const r of rows) {
  console.log(`${String(r.kmh).padStart(3)} km/h hold ${r.holdS}s${r.counter ? ' +ctr' : '     '}  `
    + `rotHold ${String(r.rotHoldDeg).padStart(4)}°  rotAfter ${String(r.rotAfterDeg).padStart(4)}°  `
    + `betaHold ${String(r.maxBetaHold).padStart(3)}°  betaAfter ${String(r.maxBetaAfter).padStart(3)}°  `
    + `spinFr ${String(r.spinFrames).padStart(3)}  recover ${r.recoverS}s  end ${r.endKmh} km/h`);
}
await browser.close();
