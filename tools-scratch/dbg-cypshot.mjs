import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 480, height: 854 } });
await p.goto('http://localhost:8901/?level=61&go=1&unlockall=1', { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
await p.evaluate(() => {
  const g = window.__game, t = g.track, c = g.player;
  for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  const cyp = (t.trees ?? []).filter(tr => tr.kind === 'cypress');
  // nearest cypress to the route
  let best = null, bd = 1e9;
  for (const tr of cyp) {
    for (let i = 0; i < t.center.length; i += 10) {
      const d = Math.hypot(tr.x - t.center[i].x, tr.z - t.center[i].z);
      if (d < bd) { bd = d; best = { tr, i }; }
    }
  }
  if (best) {
    const i = best.i, pt = t.center[i];
    c.pos.set(pt.x, pt.y + 0.4, pt.z); c.y = c.pos.y; c.trackIndex = i;
    c.heading = Math.atan2(best.tr.x - pt.x, best.tr.z - pt.z);
    c.vel.set(0, 0, 0);
    g.camMode = 3;
  }
});
await p.waitForTimeout(2500);
await p.screenshot({ path: '/tmp/shot-cypress.png' });
console.log('saved');
await browser.close();
