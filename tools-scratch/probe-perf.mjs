import { chromium } from 'playwright-core';
const BASE = 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
for (const [id, name] of [[77, 'PORTO GRANDE'], [17, 'NEON GRID']]) {
  const p = await browser.newPage({ viewport: { width: 430, height: 830 } });
  await p.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
  await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
  const r = await p.evaluate(() => {
    const g = window.__game, t = g.track, c = g.player;
    g.clock.getDelta = () => 1 / 60;
    if (g.composer) g.composer.render = () => {};   // JS budget only: swiftshader GPU time is not a phone's
    for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
    // drive the lap with REAL rendering for 60 s, measure JS frame time
    const times = [];
    const N = t.center.length;
    const su = Math.max(0.5, Math.hypot(t.center[1].x - t.center[0].x, t.center[1].z - t.center[0].z));
    for (let k = 0; k < 60 * 60; k++) {
      // simple driver
      const sp = Math.hypot(c.vel.x, c.vel.z);
      const aim = t.center[(c.trackIndex + Math.max(4, Math.round((9 + sp * 0.45) / su))) % N];
      let a = Math.atan2(aim.x - c.pos.x, aim.z - c.pos.z) - c.heading;
      while (a > Math.PI) a -= 2 * Math.PI;
      while (a < -Math.PI) a += 2 * Math.PI;
      g.input.analog.steer = Math.max(-1, Math.min(1, a * 1.8));
      g.input.analog.throttle = 0.8;
      const t0 = performance.now();
      g.frame();
      times.push(performance.now() - t0);
    }
    times.sort((x, y) => x - y);
    const q = (f) => +times[Math.floor(times.length * f)].toFixed(2);
    return { p50: q(0.5), p95: q(0.95), p99: q(0.99), max: +times[times.length - 1].toFixed(2) };
  });
  console.log(name, JSON.stringify(r));
  await p.close();
}
await browser.close();
