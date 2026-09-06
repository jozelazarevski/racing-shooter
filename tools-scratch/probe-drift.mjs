/* FT3 + "does drift help you TURN": at 70 km/h, full steer, compare 2 s of
 * plain steering vs steering+drift — heading change, slip angle, speed. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
await p.goto(`${BASE}/?level=1&go=1&unlockall=1`, { waitUntil: 'load', timeout: 120000 });
await p.waitForFunction(() => window.__game?.player && window.__game.state === 'race',
  undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, pl = g.player, t = g.track, N = t.center.length;
  if (g.composer) g.composer.render = () => {};
  let elapsed = g.clock.elapsedTime;
  g.clock = { getDelta: () => { elapsed += 1 / 60; return 1 / 60; }, get elapsedTime() { return elapsed; } };
  const wrap = (a) => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
  const run = (drift, kmh0 = 70, secs = 2) => {
    // flat open spot, half a lap from the pack
    pl.placeAt((33 + Math.floor(N / 2)) % N, 0, true);
    const v0 = kmh0 / 3.6;
    pl.vel.set(Math.sin(pl.heading) * v0, 0, Math.cos(pl.heading) * v0);
    pl.speedAlong = v0; pl.airborne = false;
    const h0 = pl.heading;
    let maxSlip = 0, slipAt05 = 0;
    for (let f = 0; f < secs * 60; f++) {
      pl.step(1 / 60, { throttle: drift ? 0.6 : 0.6, brake: 0, steer: 1, drift, hold: false });
      const vAng = Math.atan2(pl.vel.x, pl.vel.z);
      const slip = Math.abs(wrap(pl.heading - vAng)) * 180 / Math.PI;
      maxSlip = Math.max(maxSlip, slip);
      if (f === 29) slipAt05 = slip;
    }
    return { turnDeg: +Math.abs(wrap(pl.heading - h0) * 180 / Math.PI).toFixed(0),
      maxSlip: +maxSlip.toFixed(0), slipAt05: +slipAt05.toFixed(0),
      endKmh: +(Math.hypot(pl.vel.x, pl.vel.z) * 3.6).toFixed(0) };
  };
  return { plain: run(false), drift: run(true),
    plain110: run(false, 110), drift110: run(true, 110) };
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
