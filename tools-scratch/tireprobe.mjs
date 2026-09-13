import { chromium } from 'playwright-core';
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
await p.goto('http://localhost:8901/?level=1&mode=roam&unlockall=1', { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, pl = g.player, t = g.track;
  g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
  const st = t.tireStacks.find(s => !s.dead);
  const trail = [];
  pl.pos.set(st.x - 10, (st.y ?? 0) + 0.5, st.z);
  pl.y = pl.pos.y; pl.vy = 0; pl.airborne = false;
  pl.heading = Math.PI / 2;
  for (let k = 0; k < 240 && !st.dead; k++) {
    pl.vel.set(22, 0, 0);
    g.frame();
    if (k % 30 === 0) trail.push({
      d: +Math.hypot(pl.pos.x - st.x, pl.pos.z - st.z).toFixed(1),
      dy: +(pl.pos.y - (st.y ?? 0)).toFixed(1),
      sp: +Math.hypot(pl.vel.x, pl.vel.z).toFixed(1),
      spAlong: +(pl.speedAlong ?? 0).toFixed(1),
    });
  }
  return { dead: !!st.dead, stR: st.r, stY: st.y, state: g.state, trail };
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
