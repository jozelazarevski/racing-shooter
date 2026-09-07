/* FIX-2 verify: at green, rivals launch staggered (0.2-0.8 s), no freeze
 * status, no speed cap. Sample each rival's speed at 0.5/1/2/3/5 s. */
import { chromium } from 'playwright-core';
const LVL = Number(process.env.LVL ?? 2);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
await p.goto(`http://localhost:8901/?level=${LVL}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game;
  g.clock.getDelta = () => 1 / 30; if (g.composer) g.composer.render = () => {};
  for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  const marks = [0.5, 1, 2, 3, 5], out = {};
  let t = 0, mi = 0;
  while (mi < marks.length) {
    g.frame(); t += 1 / 30;
    if (t >= marks[mi]) {
      out['t' + marks[mi]] = g.enemies.map(e => +(Math.hypot(e.vel.x, e.vel.z) * 3.6).toFixed(0));
      mi++;
    }
  }
  return { out, slowUntil: g.enemySlowUntil, raceTime: +g.raceTime.toFixed(1) };
});
console.log(JSON.stringify(r));
await browser.close();
