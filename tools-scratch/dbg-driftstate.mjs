import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 320, height: 200 } });
await p.goto('http://localhost:8901/?level=1&go=1&unlockall=1', { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, pl = g.player, t = g.track, N = t.center.length;
  if (g.composer) g.composer.render = () => {};
  let elapsed = g.clock.elapsedTime;
  g.clock = { getDelta: () => { elapsed += 1 / 60; return 1 / 60; }, get elapsedTime() { return elapsed; } };
  const rad = (i) => {
    const a = t.center[(i - 6 + N) % N], b = t.center[i % N], c = t.center[(i + 6) % N];
    const abx = b.x - a.x, abz = b.z - a.z, bcx = c.x - b.x, bcz = c.z - b.z;
    const cross = abx * bcz - abz * bcx;
    if (Math.abs(cross) < 1e-6) return 1e9;
    const ab = Math.hypot(abx, abz), bc = Math.hypot(bcx, bcz), ac = Math.hypot(c.x - a.x, c.z - a.z);
    return (ab * bc * ac) / (2 * Math.abs(cross));
  };
  let stage = 40, best = -1;
  for (let i = 40; i < N - 40; i += 7) {
    let w = 1e9, climb = 0;
    for (let j = 0; j < 40; j += 5) {
      w = Math.min(w, rad((i + j) % N));
      climb = Math.max(climb, Math.abs(t.center[(i + j) % N].y - t.center[i].y));
    }
    const score = Math.min(w, 2000) - climb * 50;
    if (score > best) { best = score; stage = i; }
  }
  t.obstacles = []; t.solids = []; t.barriers = []; t.trees = [];
  if (t._width) t._width = new Float32Array(N).fill(30);
  pl.placeAt(stage, 0, true);
  const v0 = 110 / 3.6;
  pl.vel.set(Math.sin(pl.heading) * v0, 0, Math.cos(pl.heading) * v0);
  pl.speedAlong = v0; pl.airborne = false;
  const snap = () => {
    const o = {};
    for (const k of Object.keys(pl)) {
      const v = pl[k];
      if (typeof v === 'number' && Number.isFinite(v)) o[k] = v;
      else if (typeof v === 'boolean') o[k] = v ? 1 : 0;
    }
    o.__speed = Math.hypot(pl.vel.x, pl.vel.z);
    return o;
  };
  let s77 = null, s79 = null;
  for (let f = 0; f < 82; f++) {
    pl.step(1 / 60, { throttle: 0.6, brake: 0, steer: 1, drift: true, hold: false });
    if (f === 76) s77 = snap();
    if (f === 79) s79 = snap();
  }
  const diff = {};
  for (const k of Object.keys(s79)) {
    const a = s77[k] ?? 0, b = s79[k];
    if (Math.abs(b - a) > 0.4) diff[k] = [+a.toFixed(2), +b.toFixed(2)];
  }
  return diff;
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
