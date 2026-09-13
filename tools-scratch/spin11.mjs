/* The 11 km/h pirouette, measured: hold full lock + throttle to keep ~11
 * km/h for 10 s. Report total heading swept, net displacement, and the
 * radius of the circle actually driven (displacement pattern). A real car:
 * ~44 deg/s on a ~4 m circle -> 360 takes ~8 s and the car ORBITS. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
await p.goto(`${BASE}/?level=1&go=1&unlockall=1`, { waitUntil: 'load', timeout: 240000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track, c = g.player;
  g.state = 'race'; g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
  const pt = t.pointAt(50, 0);
  c.alive = true; c.health = 100; c.airborne = false; c.vy = 0;
  c.pos.set(pt.x, t.groundHeightAt(50, 0) + 0.3, pt.z); c.y = c.pos.y;
  c.trackIndex = 50; c.heading = t.headingAt(50); c.slip = 0; c.steerSmooth = 0;
  c.vel.set(Math.sin(c.heading), 0, Math.cos(c.heading)).multiplyScalar(11 / 3.6);
  const h0 = c.heading, x0 = c.pos.x, z0 = c.pos.z;
  let swept = 0, prev = c.heading, minX = 1e9, maxX = -1e9, minZ = 1e9, maxZ = -1e9;
  for (let k = 0; k < 600; k++) {
    const kmh = Math.hypot(c.vel.x, c.vel.z) * 3.6;
    const throttle = kmh < 11 ? 0.5 : 0;               // hold ~11 km/h
    c.step(1 / 60, { throttle, brake: 0, steer: 1, drift: false, hold: false });
    swept += Math.abs(c.heading - prev); prev = c.heading;
    minX = Math.min(minX, c.pos.x); maxX = Math.max(maxX, c.pos.x);
    minZ = Math.min(minZ, c.pos.z); maxZ = Math.max(maxZ, c.pos.z);
  }
  return { swept_deg_10s: +(swept * 180 / Math.PI).toFixed(0),
    deg_per_s: +((swept * 180 / Math.PI) / 10).toFixed(1),
    circle_w: +(maxX - minX).toFixed(1), circle_h: +(maxZ - minZ).toFixed(1),
    net_disp: +Math.hypot(c.pos.x - x0, c.pos.z - z0).toFixed(1),
    end_kmh: +(Math.hypot(c.vel.x, c.vel.z) * 3.6).toFixed(1) };
});
console.log(JSON.stringify(r));
await p.close(); await browser.close();
