/* #53 — why is grass at lat 28 faster than the road at the same sample?
 * Replicates test-shortcut's controlled pair with per-step telemetry. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 480, height: 320 } });
await p.goto(`${BASE}/?level=21&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.player && window.__game.track?.center,
  undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, car = g.player, t = g.track;
  let flat = null;
  for (let i = 60; i < t.center.length - 60; i += 11) {
    const pt = t.pointAt(i, 30);
    const rise = t.terrainHeight(pt.x, pt.z) - (t.center[i]?.y ?? 0);
    if (!flat || Math.abs(rise) < Math.abs(flat.rise)) flat = { i, rise: +rise.toFixed(2) };
  }
  const kept = { obstacles: t.obstacles, solids: t.solids, barriers: t.barriers };
  t.obstacles = []; t.solids = []; t.barriers = [];
  const run = (i, lat) => {
    const pt = t.pointAt(i, lat);
    const ground = t.terrainHeight(pt.x, pt.z);
    car.trackIndex = i; car.lateral = lat;
    car.alive = true; car.health = 100; car.airborne = false;
    car.vy = 0; car._climbRate = 0; car._settleT = 0; car._steepFed = 0;
    car.pos.set(pt.x, ground + 0.4, pt.z); car.y = car.pos.y;
    const nx = t.center[(i + 6) % t.center.length];
    car.heading = Math.atan2(nx.x - pt.x, nx.z - pt.z);
    car.speedAlong = 30;
    car.vel.set(Math.sin(car.heading) * 30, 0, Math.cos(car.heading) * 30);
    const trace = [];
    const y0 = car.y;
    for (let k = 0; k < 150; k++) {
      car.step(1 / 60, { throttle: 1, brake: 0, steer: 0, drift: false, hold: false });
      if (k % 25 === 24) {
        const gi = t.nearestIndex ? t.nearestIndex(car.pos, null) : -1;
        const c = t.center[gi];
        const latNow = Math.hypot(car.pos.x - c.x, car.pos.z - c.z);
        trace.push({ s: +((k + 1) / 60).toFixed(1), v: +car.speedAlong.toFixed(1),
          dy: +(car.y - y0).toFixed(1), lat: +latNow.toFixed(0),
          onRoad: latNow < (t.widthAt?.(gi) ?? 9) });
      }
    }
    return trace;
  };
  const on = run(flat.i, 0);
  const off = run(flat.i, 28);
  t.obstacles = kept.obstacles; t.solids = kept.solids; t.barriers = kept.barriers;
  return { flat, on, off };
});
console.log('flat sample', JSON.stringify(r.flat));
console.log('ON :', r.on.map((x) => JSON.stringify(x)).join(' '));
console.log('OFF:', r.off.map((x) => JSON.stringify(x)).join(' '));
await browser.close();
