import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 900, height: 620 } });
await p.goto('http://localhost:8901/?level=22&go=1&unlockall=1', { waitUntil: 'load', timeout: 120000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 90000 });
await p.evaluate(async () => {
  const g = window.__game, t = g.track, pl = g.player, N = t.center.length;
  g.startRace?.();
  const f = () => new Promise((r2) => requestAnimationFrame(r2));
  for (let i = 0; i < 900 && g.state !== 'race'; i++) { g.countdown = 0.01; await f(); }
  // find the road index nearest a big terrain fall (a drop edge by the road)
  let best = { i: 0, fall: 0 };
  for (let i = 0; i < N; i += 6) {
    const c = t.center[i], c2 = t.center[(i+1)%N];
    let sx = c2.z-c.z, sz = -(c2.x-c.x); const sl = Math.hypot(sx,sz)||1; sx/=sl; sz/=sl;
    for (const side of [1,-1]) {
      const h1 = t.terrainHeight(c.x+sx*side*12, c.z+sz*side*12);
      const h2 = t.terrainHeight(c.x+sx*side*26, c.z+sz*side*26);
      if (h1 - h2 > best.fall) best = { i, fall: h1 - h2 };
    }
  }
  pl.placeAt(best.i, 0, true);
  g.cameraMode = 1;   // TOP FAR
  for (let k = 0; k < 90; k++) { g.clock.getDelta = () => 1/60; g.frame(); }
});
await p.screenshot({ path: '/tmp/claude-0/-home-user-racing-shooter/0a1b4850-fdd3-5cf2-92f1-b12f6b9663b9/scratchpad/lipshot.png' });
await b.close();
console.log('shot saved');
