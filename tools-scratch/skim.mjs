/* At 170-190 km/h: (a) does gentle steering feed slip? (b) does the car
 * track the road surface, or float above it on descents? */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
await p.goto(`${BASE}/?level=21&go=1&unlockall=1`, { waitUntil: 'load', timeout: 240000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track, N = t.center.length, c = g.player;
  g.state = 'race'; g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
  g.__gripProbe = {};
  // (a) gentle bend at speed on PINE-like straight: steer 0.3 at 180
  const laneY = (car) => {
    const i = car.trackIndex;
    return t.groundHeightAt ? t.groundHeightAt(i, car.lateral ?? 0) : t.center[i].y;
  };
  const place = (idx, kmh) => {
    const pt = t.pointAt(idx, 0);
    c.alive = true; c.health = 100; c.airborne = false; c.vy = 0;
    c.pos.set(pt.x, t.groundHeightAt(idx, 0) + 0.3, pt.z); c.y = c.pos.y;
    c.trackIndex = idx; c.lateral = 0; c.heading = t.headingAt(idx);
    c.slip = 0; c.steerSmooth = 0;
    c.vel.set(Math.sin(c.heading), 0, Math.cos(c.heading)).multiplyScalar(kmh / 3.6);
  };
  place(30, 180);
  let maxSlip = 0, maxOver = 0;
  for (let k = 0; k < 120; k++) {
    c.step(1 / 60, { throttle: 1, brake: 0, steer: 0.35, drift: false, hold: false });
    maxSlip = Math.max(maxSlip, c.slip); maxOver = Math.max(maxOver, g.__gripProbe.over ?? 0);
  }
  const gentle = { maxSlip: +maxSlip.toFixed(2), maxOver: +maxOver.toFixed(2),
    kmh: Math.round(Math.hypot(c.vel.x, c.vel.z) * 3.6) };
  // (b) follow the lap at speed for 30 s, track gap above the lane and airborne flickers
  place(60, 170);
  let maxGap = 0, airFlicks = 0, wasAir = false, gapSum = 0, nG = 0, slipSum = 0;
  for (let k = 0; k < 1800; k++) {
    const i = c.trackIndex, aim = t.center[(i + 8) % N];
    let d = Math.atan2(aim.x - c.pos.x, aim.z - c.pos.z) - c.heading;
    while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
    // corner-managed so it stays on road
    const jA = (i + 6) % N, jB = (i + 14) % N;
    const hA = Math.atan2(t.center[jA].x - t.center[i].x, t.center[jA].z - t.center[i].z);
    const hB = Math.atan2(t.center[jB].x - t.center[jA].x, t.center[jB].z - t.center[jA].z);
    let trn = hB - hA; while (trn > Math.PI) trn -= 2 * Math.PI; while (trn < -Math.PI) trn += 2 * Math.PI;
    const R = Math.max(6, (8 * (t.segLen ?? 4)) / Math.max(0.05, Math.abs(trn)));
    const vmax = Math.sqrt(1.15 * 14 * R), v = Math.hypot(c.vel.x, c.vel.z);
    const over = v > vmax;
    c.step(1 / 60, { throttle: over ? 0 : 1, brake: over ? 1 : 0,
      steer: Math.max(-1, Math.min(1, d * 2)), drift: false, hold: false });
    if (c.airborne) { if (!wasAir) airFlicks++; wasAir = true; }
    else {
      wasAir = false;
      if (Math.abs(c.lateral) < 9) {
        const gap = c.y - laneY(c);
        maxGap = Math.max(maxGap, gap); gapSum += Math.max(0, gap); nG++;
        slipSum += c.slip;
      }
    }
  }
  return { gentle, lap: { maxGap: +maxGap.toFixed(2), meanGap: +(gapSum / Math.max(1, nG)).toFixed(2),
    airFlicks, meanSlip: +(slipSum / Math.max(1, nG)).toFixed(2) } };
});
console.log(JSON.stringify(r));
await p.close(); await browser.close();
