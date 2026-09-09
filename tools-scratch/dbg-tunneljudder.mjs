/* TUNNEL CAMERA JUDDER (owner r407: "Tunel camera is sharing a lot").
 * Bot-drives a tunnel world and records per-frame camera motion, classified
 * by where the car is relative to every bore: OPEN / APPROACH (within 80
 * stations, the r398 glide window) / BORE. Reports p50/p95/max of the frame
 * delta in each class, plus the worst frames with their guard state, so a
 * spike can be attributed to a named clamp instead of "it shakes".  */
import { chromium } from 'playwright-core';
const LVL = Number(process.env.LVL ?? 4);
const FRAMES = Number(process.env.FRAMES ?? 5400);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
p.setDefaultTimeout(600000);
await p.goto(`http://localhost:8901/?level=${LVL}&go=1&unlockall=1`,
  { waitUntil: 'load', timeout: 600000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 600000 });
const r = await p.evaluate((FR) => {
  const g = window.__game, t = g.track, N = t.center.length;
  g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
  for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  const su = Math.max(0.5, Math.hypot(t.center[1].x - t.center[0].x,
    t.center[1].z - t.center[0].z));
  const c = g.player;
  const bores = (t._tunnels ?? []).map((T9) => ({ s: T9.s, e: T9.e }));
  const cls = (i) => {
    for (const b of bores) {
      const inb = b.s <= b.e ? (i >= b.s && i <= b.e) : (i >= b.s || i <= b.e);
      if (inb) return 'BORE';
    }
    for (const b of bores) {
      const d = Math.min(Math.abs(i - b.s), Math.abs(i - b.e),
        N - Math.abs(i - b.s), N - Math.abs(i - b.e));
      if (d <= 80) return 'APPROACH';
    }
    return 'OPEN';
  };
  const buckets = { OPEN: [], APPROACH: [], BORE: [] };
  const worst = [];
  let px = g.camera.position.x, py = g.camera.position.y, pz = g.camera.position.z;
  for (let k = 0; k < FR; k++) {
    // the same steering stand-in the shake probes use: aim down the line
    const sp = Math.hypot(c.vel.x, c.vel.z);
    const i = c.trackIndex;
    const aim = t.center[(i + Math.max(4, Math.round((9 + sp * 0.45) / su))) % N];
    let a = Math.atan2(aim.x - c.pos.x, aim.z - c.pos.z) - c.heading;
    while (a > Math.PI) a -= 2 * Math.PI;
    while (a < -Math.PI) a += 2 * Math.PI;
    g.input.analog.steer = Math.max(-1, Math.min(1, a * 2.2));
    g.input.analog.throttle = 1; g.input.analog.brake = 0;
    g.frame();
    const cp = g.camera.position;
    const d = Math.hypot(cp.x - px, cp.y - py, cp.z - pz);
    const dy = cp.y - py;
    px = cp.x; py = cp.y; pz = cp.z;
    if (k < 30) continue;                       // settle
    const where = cls(c.trackIndex);
    buckets[where].push(d);
    worst.push({ k, d: +d.toFixed(2), dy: +dy.toFixed(2), where,
      i: c.trackIndex, camY: +cp.y.toFixed(1), carY: +c.pos.y.toFixed(1),
      kmh: Math.round(sp * 3.6) });
  }
  const q = (arr) => { if (!arr.length) return null;
    const s = arr.slice().sort((x, y) => x - y);
    return { n: s.length, p50: +s[(s.length * 0.5) | 0].toFixed(3),
      p95: +s[(s.length * 0.95) | 0].toFixed(3), max: +s[s.length - 1].toFixed(2) }; };
  worst.sort((x, y) => y.d - x.d);
  return { world: g.level?.name, bores: bores.length,
    open: q(buckets.OPEN), approach: q(buckets.APPROACH), bore: q(buckets.BORE),
    worst: worst.slice(0, 14) };
}, FRAMES);
console.log(JSON.stringify(r, null, 1));
await browser.close();
