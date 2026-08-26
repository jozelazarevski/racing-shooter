import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 640, height: 400 } });
p.setDefaultTimeout(300000);
await p.goto(`${BASE}/?level=21&go=1&unlockall=1`, { waitUntil:'load', timeout:120000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout:120000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track, car = g.player;
  const pt = t.pointAt(170, 30);
  const bars = [];
  for (const q of t.barriers ?? []) {
    const mx = (q.x1 + q.x2) / 2, mz = (q.z1 + q.z2) / 2;
    const d = Math.hypot(mx - pt.x, mz - pt.z);
    if (d < 25) bars.push({ d: +d.toFixed(1), y: +q.y.toFixed(1), h: q.h, hw: q.hw, mat: q.mat ?? '?', over: !!q.over });
  }
  bars.sort((a, z) => a.d - z.d);
  // and re-run the test's own manoeuvre, tracing what the car hits
  const ground = t.terrainHeight(pt.x, pt.z);
  car.trackIndex = 170; car.lateral = 30;
  car.alive = true; car.health = 100; car.airborne = false;
  car.vy = 0; car._climbRate = 0; car._settleT = 0; car._steepFed = 0;
  car.pos.set(pt.x, ground + 0.4, pt.z); car.y = car.pos.y;
  const nx = t.center[176];
  car.heading = Math.atan2(nx.x - pt.x, nx.z - pt.z);
  car.speedAlong = 30;
  car.vel.set(Math.sin(car.heading) * 30, 0, Math.cos(car.heading) * 30);
  let feeds = [];
  const realFeed = g.hud?.feed;
  if (g.hud) g.hud.feed = (m) => { if (feeds.length < 6) feeds.push(m); };
  const trace = [];
  for (let k = 0; k < 150; k++) {
    car.step(1 / 60, { throttle: 1, brake: 0, steer: 0, drift: false, hold: false });
    if (k % 15 === 0) trace.push({ k, v: +Math.abs(car.speedAlong).toFixed(1),
      y: +car.y.toFixed(1), lat: +(car.lateral ?? 0).toFixed(1), gy: +t.terrainHeight(car.pos.x, car.pos.z).toFixed(1) });
  }
  if (g.hud && realFeed) g.hud.feed = realFeed;
  return { bars: bars.slice(0, 8), feeds, trace };
});
console.log(JSON.stringify(r, null, 1));
await b.close();
