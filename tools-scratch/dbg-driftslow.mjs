/* Drift slowdown probe: 70 km/h entry, handbrake+full steer held 1.5 s.
 * Reports slip formation time (FT3) and speed lost. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 400, height: 300 } });
p.setDefaultTimeout(300000);
await p.goto(`${BASE}/?level=1&go=1&unlockall=1`, { waitUntil: 'load' });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player);
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track, p2 = g.player;
  g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
  const runs = [];
  for (let trial = 0; trial < 3; trial++) {
    // long straight spot: index 300 + trial*100
    const i0 = 250 + trial * 120;
    const c = t.center[i0], tn = t.tan[i0];
    p2.pos.set(c.x, c.y + 0.5, c.z);
    p2.heading = Math.atan2(tn.x, tn.z);
    const v0 = 70 / 3.6;
    p2.vel.set(tn.x * v0, 0, tn.z * v0);
    p2.trackIndex = i0; p2.slip = 0; p2._wedgeT = 0;
    let slipAt = null, f = 0;
    const spd = () => Math.hypot(p2.vel.x, p2.vel.z) * 3.6;
    const s0 = spd();
    for (f = 0; f < 90; f++) {   // 1.5 s
      g.input.analog.steer = 1; g.input.analog.throttle = 0;
      g.input.analog.brake = 0; g.input.drift = true; g.input.analog.drift = true;
      if (g.input.keys) g.input.keys.Space = true;
      g._frameBody ? g._frameBody() : g.frame();
      if (slipAt === null && (p2.slip ?? 0) > 0.6) slipAt = f / 60;
    }
    const s1 = spd();
    g.input.drift = false; g.input.analog.drift = false;
    if (g.input.keys) g.input.keys.Space = false;
    g.input.analog.steer = 0;
    runs.push({ entry: +s0.toFixed(0), exit: +s1.toFixed(0),
      lostPct: +((1 - s1 / s0) * 100).toFixed(0), slipAtS: slipAt });
  }
  return runs;
});
console.log(JSON.stringify(r));
await browser.close();
