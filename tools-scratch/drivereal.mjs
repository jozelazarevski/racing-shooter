/* REAL-WORLD ALIGNMENT AUDIT — every axis, measured in g and seconds,
 * against what a real (sporty) car does. PATH physics, not nose angle:
 * lateral g is read from the velocity vector's turn rate, because the slip
 * system deliberately lets the nose swing while the path stays honest.
 *
 *   axis          probe                                real reference
 *   launch        0-100 km/h full throttle             sports 4-6s, super 2.5-3.5s
 *   braking       100-0 km/h full brake                road 1.0-1.2g (~40m), race 1.5-2g
 *   coast         100 km/h, no inputs, 3s              drag+rolling ~0.05-0.15g
 *   corner path   steady lateral g at 0.5/1.0 steer,   road tyres ~0.9-1.1g,
 *                 60/100/150 km/h                      slicks/arcade hero ~1.5-2g
 *   reverse       0-20 km/h backwards                  leisurely, ~1-2s
 * 1g = 9.8 u/s² (world units are metres to a first approximation).
 *   node tools-scratch/drivereal.mjs
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
p.on('pageerror', e => console.log('pageerr:', e.message.slice(0, 120)));
await p.goto(`${BASE}/?level=1&go=1&unlockall=1`, { waitUntil: 'load', timeout: 240000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track, c = g.player;
  g.state = 'race'; g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
  const dt = 1 / 60;
  const place = (idx, kmh = 0) => {
    const pt = t.pointAt(idx, 0);
    c.alive = true; c.health = 100; c.airborne = false; c.vy = 0;
    c.pos.set(pt.x, t.groundHeightAt(idx, 0) + 0.3, pt.z); c.y = c.pos.y;
    c.trackIndex = idx; c.lateral = 0; c.heading = t.headingAt(idx);
    c.slip = 0; c.steerSmooth = 0;
    c.vel.set(Math.sin(c.heading), 0, Math.cos(c.heading)).multiplyScalar(kmh / 3.6);
  };
  const kmh = () => Math.hypot(c.vel.x, c.vel.z) * 3.6;
  const out = {};
  // launch 0-100
  place(10, 0);
  let t100 = null;
  for (let k = 0; k < 600 && t100 === null; k++) {
    c.step(dt, { throttle: 1, brake: 0, steer: 0, drift: false, hold: false });
    if (kmh() >= 100) t100 = +(k / 60).toFixed(2);
  }
  out.launch_0_100_s = t100;
  // braking 100-0
  place(60, 100);
  let dist = 0, frames = 0, peakDecel = 0, lastV = kmh() / 3.6;
  while (kmh() > 2 && frames < 600) {
    c.step(dt, { throttle: 0, brake: 1, steer: 0, drift: false, hold: false });
    const v = Math.hypot(c.vel.x, c.vel.z);
    dist += v * dt; peakDecel = Math.max(peakDecel, (lastV - v) / dt); lastV = v;
    frames++;
  }
  out.brake_100_0 = { meters: +dist.toFixed(1), seconds: +(frames / 60).toFixed(2), peak_g: +(peakDecel / 9.8).toFixed(2) };
  // coast from 100
  place(120, 100);
  const v0 = Math.hypot(c.vel.x, c.vel.z);
  for (let k = 0; k < 180; k++) c.step(dt, { throttle: 0, brake: 0, steer: 0, drift: false, hold: false });
  const v1 = Math.hypot(c.vel.x, c.vel.z);
  out.coast_decel_g = +(((v0 - v1) / 3) / 9.8).toFixed(3);
  // steady-state PATH lateral g: velocity-vector turn rate after 1s settle,
  // averaged over the next second
  out.corner = [];
  for (const [speed, steer] of [[60, 0.5], [60, 1.0], [100, 0.5], [100, 1.0], [150, 0.5], [150, 1.0]]) {
    place(200, speed);
    for (let k = 0; k < 60; k++) c.step(dt, { throttle: 0.6, brake: 0, steer, drift: false, hold: false });
    let acc = 0, n = 0, prev = Math.atan2(c.vel.x, c.vel.z);
    for (let k = 0; k < 60; k++) {
      c.step(dt, { throttle: 0.6, brake: 0, steer, drift: false, hold: false });
      const v = Math.hypot(c.vel.x, c.vel.z);
      let dir = Math.atan2(c.vel.x, c.vel.z), d = dir - prev;
      while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
      acc += Math.abs(d) / dt * v; n++; prev = dir;
    }
    out.corner.push({ kmh: speed, steer, path_lat_g: +((acc / n) / 9.8).toFixed(2),
      end_kmh: Math.round(kmh()), slip: +(c.slip ?? 0).toFixed(2) });
  }
  // reverse 0-20 backwards
  place(300, 0);
  let tRev = null;
  for (let k = 0; k < 600 && tRev === null; k++) {
    c.step(dt, { throttle: 0, brake: 1, steer: 0, drift: false, hold: false });
    if (kmh() >= 20 && k > 27) tRev = +(k / 60 - 0.45).toFixed(2);  // minus the arming delay
  }
  out.reverse_0_20_s = tRev;
  return out;
});
console.log(JSON.stringify(r, null, 1));
await p.close(); await browser.close();
