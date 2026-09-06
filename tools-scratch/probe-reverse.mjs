/* Can the car back up? Standstill, hard brake held — reverse should engage
 * at 0.45 s and build backward speed. Run against BASE (default 8901). */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
const errs = [];
p.on('pageerror', (e) => errs.push(String(e.message).slice(0, 120)));
await p.goto(`${BASE}/?level=1&go=1&unlockall=1`, { waitUntil: 'load', timeout: 120000 });
await p.waitForFunction(() => window.__game?.player && window.__game.state === 'race',
  undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, pl = g.player;
  if (g.composer) g.composer.render = () => {};
  let elapsed = g.clock.elapsedTime;
  g.clock = { getDelta: () => { elapsed += 1 / 60; return 1 / 60; }, get elapsedTime() { return elapsed; } };
  const out = {};
  // A: standstill, hard brake 2 s (via the real input path)
  pl.vel.set(0, 0, 0); pl.speedAlong = 0;
  g.input.analog.throttle = 0; g.input.analog.brake = 1; g.input.analog.steer = 0;
  const trace = [];
  for (let f = 0; f < 120; f++) {
    g._frameBody();
    if (f % 15 === 14) trace.push(+pl.speedAlong.toFixed(2));
  }
  out.viaFrame = { trace, revTimer: +(pl.reverseTimer ?? -1).toFixed(2),
    brakeSeen: g.input.brake, kmh: +(Math.hypot(pl.vel.x, pl.vel.z) * 3.6).toFixed(1) };
  // B: direct step() with forced inputs — isolates physics from input plumbing
  g.input.analog.brake = 0;
  pl.vel.set(0, 0, 0); pl.speedAlong = 0; pl.reverseTimer = 0;
  for (let f = 0; f < 120; f++) {
    pl.step(1 / 60, { throttle: 0, brake: 1, steer: 0, drift: false, hold: false });
  }
  out.direct = { speedAlong: +pl.speedAlong.toFixed(2),
    kmh: +(Math.hypot(pl.vel.x, pl.vel.z) * 3.6).toFixed(1) };
  return out;
});
console.log(JSON.stringify(r), 'errors:', errs.slice(0, 3).join(' | ') || 'none');
await browser.close();
