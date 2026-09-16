/* "Cars are jumping and shaking": drive the bot 60 s on a world and measure
 * (a) airborne transitions per minute at steady on-road speed, (b) vy sign
 * flips per second while grounded (the shake), (c) frame-to-frame ground
 * height deltas under the wheels, (d) worst hop height. */
import { chromium } from 'playwright-core';
const LVL = Number(process.env.LVL ?? 66);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
await p.goto(`http://localhost:8901/?level=${LVL}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track, N = t.center.length;
  g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
  for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  const su = Math.max(0.5, Math.hypot(t.center[1].x - t.center[0].x, t.center[1].z - t.center[0].z));
  const c = g.player, skill = 0.9;
  let airborneFlips = 0, prevAir = false, vyFlips = 0, prevVy = 0;
  let maxHop = 0, hopStartY = 0, groundedFrames = 0, movingFrames = 0;
  let worstDy = 0, prevY = c.pos.y, launches = 0; const spots = [];
  const FR = 60 * 60;
  for (let k = 0; k < FR; k++) {
    const sp = Math.hypot(c.vel.x, c.vel.z);
    const i = c.trackIndex;
    const aim = t.center[(i + Math.max(4, Math.round((9 + sp * 0.45) / su))) % N];
    let a = Math.atan2(aim.x - c.pos.x, aim.z - c.pos.z) - c.heading;
    while (a > Math.PI) a -= 2 * Math.PI;
    while (a < -Math.PI) a += 2 * Math.PI;
    const K2 = Math.max(4, Math.round(24 / su));
    let vAllow = 1e9;
    for (let kk = 0; kk <= Math.max(K2, Math.round((24 + sp * sp / 24) / su)); kk += 2) {
      const j = (i + kk) % N;
      let tn = t.headingAt((j + K2) % N) - t.headingAt(j);
      while (tn > Math.PI) tn -= 2 * Math.PI;
      while (tn < -Math.PI) tn += 2 * Math.PI;
      const vm = Math.sqrt(18.9 * (24 / Math.max(0.06, Math.abs(tn)))) * 0.93;
      const vh = kk === 0 ? vm : Math.sqrt(vm * vm + 2 * 12 * kk * su);
      if (vh < vAllow) vAllow = vh;
    }
    g.input.analog.steer = Math.max(-1, Math.min(1, a * 1.8));
    g.input.analog.throttle = sp > vAllow ? 0 : skill;
    g.input.analog.brake = sp > vAllow + 3 ? 0.9 : 0;
    g.frame();
    const moving = sp > 8;
    if (moving) movingFrames++;
    if (c.airborne !== prevAir) {
      if (c.airborne && moving) { airborneFlips++; hopStartY = c.pos.y; }
      prevAir = c.airborne;
    }
    if (c.airborne) maxHop = Math.max(maxHop, c.pos.y - hopStartY);
    if (!c.airborne && moving) {
      groundedFrames++;
      const vy = c.vy ?? 0;
      if (vy * prevVy < -0.01) vyFlips++;
      prevVy = vy;
      const dy = Math.abs(c.pos.y - prevY);
      if (dy > worstDy) worstDy = dy;
      if (dy > 0.3) spots.push({ i: c.trackIndex, dy: +dy.toFixed(2), v: +(sp * 3.6).toFixed(0) });
      if ((c.vy ?? 0) > 6) launches++;
    }
    prevY = c.pos.y;
  }
  return { world: g.level?.name,
    airbornePerMin: +(airborneFlips / 1).toFixed(1),
    vyFlipsPerSec: +(vyFlips / (groundedFrames / 60)).toFixed(1),
    worstGroundedDy: +worstDy.toFixed(2), maxHop: +maxHop.toFixed(2),
    strongLaunches: launches,
    movingPct: Math.round(100 * movingFrames / FR), spots: spots.slice(0, 12) };
});
console.log(JSON.stringify(r));
await browser.close();
