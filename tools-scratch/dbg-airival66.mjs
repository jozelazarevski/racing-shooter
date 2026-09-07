/* Rival health on the rebuilt GLACIER COL: run 150 s of game time with the
 * full grid, sample each rival every 0.5 s, report max continuous stall
 * (speed < 1 u/s while alive) and final progress spread. */
import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
await p.goto('http://localhost:8901/?level=66&go=1&unlockall=1', { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game;
  g.clock.getDelta = () => 1 / 30; if (g.composer) g.composer.render = () => {};
  for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  const rivals = g.cars.filter(c => c !== g.player);
  const stall = new Map(rivals.map(c => [c, { cur: 0, max: 0 }]));
  for (let k = 0; k < 150 * 30; k++) {
    g.frame();
    if (k % 15 === 0) {
      for (const c of rivals) {
        const s = stall.get(c);
        if (c.alive && Math.hypot(c.vel.x, c.vel.z) < 1) s.cur += 0.5; else s.cur = 0;
        s.max = Math.max(s.max, s.cur);
      }
    }
  }
  const out = rivals.map(c => ({
    n: c.name ?? c.machine?.id ?? '?', maxStallS: stall.get(c).max,
    prog: +(c.trackIndex ?? -1), alive: c.alive }));
  return { out, playerIdx: g.player.trackIndex };
});
console.log(JSON.stringify(r));
await browser.close();
