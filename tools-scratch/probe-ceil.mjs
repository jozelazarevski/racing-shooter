import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 480, height: 320 } });
await p.goto('http://localhost:8901/?level=74&go=1&unlockall=1', { waitUntil: 'load', timeout: 180000 });
await p.waitForFunction(() => window.__game?.player && window.__game.track?.center, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, pl = g.player, t = g.track, N = t.center.length;
  if (g.composer) g.composer.render = () => {};
  let elapsed = g.clock.elapsedTime;
  g.clock = { getDelta: () => { elapsed += 1 / 60; return 1 / 60; }, get elapsedTime() { return elapsed; } };
  for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  pl.placeAt(Math.floor(N * 0.5), 0, true);
  const v0 = 30; pl.speedAlong = v0;
  pl.vel.set(Math.sin(pl.heading) * v0, 0, Math.cos(pl.heading) * v0);
  g.input.analog.throttle = 1;
  const trace = [];
  for (let f = 0; f < 360; f++) {
    pl.nitro = 1; pl.boostTimer = 1;
    g._frameBody();
    if (f % 60 === 59) trace.push({ f, sA: +pl.speedAlong.toFixed(1), boost: pl.boostTimer > 0,
      ceil: +(g._nitroCeilU ?? -1).toFixed(1), max: pl.maxSpeed });
  }
  return trace;
});
console.log(JSON.stringify(r));
await browser.close();
