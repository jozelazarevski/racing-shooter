/* Visual sweep: teleport the player to stations around the lap, let the chase
 * cam settle, screenshot each. LVL=66 IDX=140,200,258,300 node dbg-vissweep.mjs */
import { chromium } from 'playwright-core';
const LVL = Number(process.env.LVL ?? 66);
const IDX = (process.env.IDX ?? '0,80,160,240,320,400').split(',').map(Number);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 460, height: 900 } });
await p.goto(`http://localhost:8901/?level=${LVL}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
await p.evaluate(() => {
  const g = window.__game;
  g.clock.getDelta = () => 1 / 60;
  for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
});
for (const i of IDX) {
  await p.evaluate((i) => {
    const g = window.__game, t = g.track, N = t.center.length, c = g.player;
    const j = ((i % N) + N) % N;
    c.pos.x = t.center[j].x; c.pos.z = t.center[j].z;
    c.pos.y = t.center[j].y + 0.5;
    c.heading = t.headingAt(j);
    c.vel.x = Math.sin(c.heading) * 8; c.vel.z = Math.cos(c.heading) * 8;
    c.trackIndex = j; if (c.vy !== undefined) c.vy = 0;
    for (let k = 0; k < 90; k++) g.frame();   // cam settles, car rolls a bit
  }, i);
  await p.screenshot({ path: `${process.env.OUT ?? '/tmp'}/vis-${LVL}-${i}.png`, timeout: 150000 });
}
console.log('done');
await browser.close();
