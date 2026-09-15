import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 460, height: 780 } });
await p.goto('http://localhost:8901/?level=4&go=1&unlockall=1', { waitUntil: 'load', timeout: 120000 });
await p.waitForFunction(() => window.__game?.player && window.__game.track?.center, undefined, { timeout: 180000 });
await p.evaluate(() => {
  const g = window.__game, pl = g.player;
  if (!g._realRender) g._realRender = g.composer.render.bind(g.composer);
  g.composer.render = () => {};
  let elapsed = g.clock.elapsedTime;
  g.clock = { getDelta: () => { elapsed += 1 / 60; return 1 / 60; }, get elapsedTime() { return elapsed; } };
  for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  g.camMode = 0;
  pl.placeAt(90, 0, true);
  pl.vel.set(Math.sin(pl.heading) * 24, 0, Math.cos(pl.heading) * 24);
  g.input.analog.throttle = 1;
  for (let f = 0; f < 35; f++) g.frame();
  g.composer.render = g._realRender;          // real paint for the last stretch
  for (let f = 0; f < 10; f++) g.frame();
});
await p.screenshot({ timeout: 120000, path: '/tmp/claude-0/-home-user-racing-shooter/0a1b4850-fdd3-5cf2-92f1-b12f6b9663b9/scratchpad/gorge-fly.png' });
await browser.close();
console.log('done');
