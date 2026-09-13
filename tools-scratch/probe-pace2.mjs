import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
for (const [name, base] of [['r307-tree', 'http://localhost:8901'], ['r294-base', 'http://localhost:8902']]) {
  const p = await browser.newPage({ viewport: { width: 480, height: 320 } });
  await p.goto(`${base}/?level=1&go=1&unlockall=1`, { waitUntil: 'load', timeout: 180000 });
  await p.waitForFunction(() => window.__game?.player && window.__game.state === 'race',
    undefined, { timeout: 300000 });
  const r = await p.evaluate(() => {
    const g = window.__game, pl = g.player, t = g.track, N = t.center.length;
    if (g.composer) g.composer.render = () => {};
    let elapsed = g.clock.elapsedTime;
    g.clock = { getDelta: () => { elapsed += 1 / 60; return 1 / 60; }, get elapsedTime() { return elapsed; } };
    const out = {};
    // 0-100 through the real frame loop from the start line
    pl.placeAt(40, 0, true); pl.vel.set(0, 0, 0); pl.speedAlong = 0;
    g.input.analog.throttle = 1; g.input.analog.steer = 0; g.input.analog.brake = 0;
    let t100 = -1;
    for (let f = 0; f < 600; f++) {
      g._frameBody();
      if (t100 < 0 && Math.hypot(pl.vel.x, pl.vel.z) * 3.6 >= 100) { t100 = +(f / 60).toFixed(2); break; }
    }
    out.t100 = t100;
    // held top speed on varied spots: 4 s from 30 km/h each
    out.spots = [];
    for (const i of [80, 300, 500, 700]) {
      pl.placeAt(i, 0, true);
      const v0 = 30 / 3.6;
      pl.vel.set(Math.sin(pl.heading) * v0, 0, Math.cos(pl.heading) * v0);
      pl.speedAlong = v0;
      for (let f = 0; f < 240; f++) g._frameBody();
      out.spots.push(+(Math.hypot(pl.vel.x, pl.vel.z) * 3.6).toFixed(0));
    }
    g.input.analog.throttle = 0;
    return out;
  });
  console.log(name, JSON.stringify(r));
  await p.close();
}
await browser.close();
