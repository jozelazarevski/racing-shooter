import { chromium } from 'playwright-core';
const BASE = 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
await p.goto(`${BASE}/?level=1&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track, c = g.player;
  g.state = 'race'; g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
  const N = t.center.length;
  const radiusAt = (i, k = 6) => {
    const a = t.center[(i - k + N) % N], b = t.center[i % N], d = t.center[(i + k) % N];
    const abx = b.x - a.x, abz = b.z - a.z, bcx = d.x - b.x, bcz = d.z - b.z;
    const cross = abx * bcz - abz * bcx;
    if (Math.abs(cross) < 1e-6) return 1e9;
    const ab = Math.hypot(abx, abz), bc = Math.hypot(bcx, bcz), ac = Math.hypot(d.x - a.x, d.z - a.z);
    return (ab * bc * ac) / (2 * Math.abs(cross));
  };
  const wetProbe = (idx) => {
    const pt = t.pointAt(idx, 0);
    c.alive = true; c.airborne = false; c.vy = 0;
    c.pos.set(pt.x, t.groundHeightAt(idx, 0) + 0.3, pt.z); c.y = c.pos.y;
    c.trackIndex = idx; c.lateral = 0; c.heading = t.headingAt(idx);
    c._wetT = 0; c._fordNow = 0; c._wetMax = 0; c.slip = 0;
    c.vel.set(Math.sin(c.heading), 0, Math.cos(c.heading)).multiplyScalar(8);
    for (let k = 0; k < 5; k++) c.step(1 / 60, { throttle: 0.3, brake: 0, steer: 0, drift: false, hold: false });
    return (c._fordNow > 0) || (c._wetT > 0);
  };
  const segLen = Math.hypot(t.center[1].x - t.center[0].x, t.center[1].z - t.center[0].z);
  const rows = [];
  for (let idx = 0; idx < Math.min(N, 400); idx += 5) {
    // window: 25 samples ahead must be straight-ish (r>=150) and dry
    let minR = 1e9, wet = false;
    for (let j = 0; j <= 25; j += 5) {
      minR = Math.min(minR, radiusAt(idx + j));
      if (wetProbe((idx + j) % N)) wet = true;
    }
    rows.push({ idx, minR: Math.round(Math.min(minR, 9999)), wet });
  }
  return { segLen: +segLen.toFixed(2), N, rows: rows.filter((r) => !r.wet && r.minR >= 150) };
});
console.log(JSON.stringify(r));
await browser.close();
