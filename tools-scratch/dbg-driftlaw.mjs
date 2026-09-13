/* r341 debug 2 — replicate test-drift's exact protocol (direct pl.step,
 * 70/3.6 u/s, throttle 0.6, steer 1, drift held 2 s) and trace dTheta, vl,
 * carry-relevant state per frame via __gripProbe. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
p.on('pageerror', (e) => console.log('PAGEERR', String(e).slice(0, 140)));
await p.goto(`${BASE}/?level=1&go=1&unlockall=1`, { waitUntil: 'load', timeout: 120000 });
await p.waitForFunction(() => window.__game?.player && window.__game.state === 'race',
  undefined, { timeout: 300000 });
const out = await p.evaluate(() => {
  const g = window.__game, pl = g.player, N = g.track.center.length, t = g.track;
  if (g.composer) g.composer.render = () => {};
  const wrap = (a) => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
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
  const kept = { o: t.obstacles, s: t.solids, b: t.barriers, tr: t.trees };
  t.obstacles = []; t.solids = []; t.barriers = []; t.trees = [];
  g.__gripProbe = {};
  pl.placeAt(stage, 0, true);
  const v0 = 70 / 3.6;
  pl.vel.set(Math.sin(pl.heading) * v0, 0, Math.cos(pl.heading) * v0);
  pl.speedAlong = v0; pl.airborne = false;
  const h0 = pl.heading;
  const lines = [];
  let prevH = pl.heading;
  for (let f = 0; f < 120; f++) {
    pl.step(1 / 60, { throttle: 0.6, brake: 0, steer: 1, drift: true, hold: false });
    const gp = g.__gripProbe;
    const beta = Math.abs(wrap(pl.heading - Math.atan2(pl.vel.x, pl.vel.z))) * 180 / Math.PI;
    const dH = wrap(pl.heading - prevH) * 180 / Math.PI; prevH = pl.heading;
    if (f % 6 === 0 || f === 119) {
      lines.push(`f${String(f).padStart(3)} dH=${dH.toFixed(2)}° dTheta=${(gp.dTheta * 180 / Math.PI).toFixed(2)}° `
        + `beta=${beta.toFixed(0)} slip=${pl.slip?.toFixed(2)} over=${gp.over?.toFixed(2)} lag=${gp.lag?.toFixed(2)} `
        + `vf=${gp.vf} vl=${gp.vl} kick=${pl._hbKick?.toFixed(2)} budget=${(pl._gripBudget ?? pl.grip).toFixed(2)} `
        + `sp=${(Math.hypot(pl.vel.x, pl.vel.z) * 3.6).toFixed(0)}kmh turn=${Math.abs(wrap(pl.heading - h0)) * 180 / Math.PI | 0}°`);
    }
  }
  t.obstacles = kept.o; t.solids = kept.s; t.barriers = kept.b; t.trees = kept.tr;
  return lines;
});
console.log(out.join('\n'));
await browser.close();
