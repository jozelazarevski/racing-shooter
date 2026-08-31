import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
const p = await ctx.newPage();
await p.goto('http://localhost:8901/?level=4&go=1&unlockall=1', { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.player, undefined, { timeout: 300000 });
await p.evaluate(() => {
  const g = window.__game;
  g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
  for (let k = 0; k < 600 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  for (let k = 0; k < 260; k++) { g.frame(); }
  g.raceTime = 42; g.player.health = 63;
  g.hud.feed('LAP 2/3 — 0:42.1', 'good');
  g.hud.feed('DUNE: see ya!', 'info');
  g.hud.feed('HIT ROCK  −20 HULL', 'bad');
  g.frame();
});
await p.evaluate(() => { window.__game.composer.render = window.__game.composer.constructor.prototype.render.bind(window.__game.composer); window.__game.frame(); });
await p.screenshot({ path: 'tools-scratch/hudshot.png' });
await b.close();
console.log('shot saved');
