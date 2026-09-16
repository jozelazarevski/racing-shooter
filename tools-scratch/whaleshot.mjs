import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 900, height: 620 } });
await p.goto('http://localhost:8901/?level=23&go=1&unlockall=1', { waitUntil: 'load', timeout: 240000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
await p.evaluate(async () => {
  const g = window.__game, t = g.track, pl = g.player, N = t.center.length;
  g.startRace?.();
  const f = () => new Promise((r2) => requestAnimationFrame(r2));
  for (let i = 0; i < 900 && g.state !== 'race'; i++) { g.countdown = 0.01; g.frame(); }
  g.clock.getDelta = () => 1/60; if (g.composer) g.composer.render = () => {};
  // nearest whale to the road; seat the player on the closest road sample
  let best = null;
  for (const w of t.animated.whales) {
    for (let i = 0; i < N; i += 4) {
      const d = Math.hypot(t.center[i].x - w.g.position.x, t.center[i].z - w.g.position.z);
      if (!best || d < best.d) best = { w, i, d };
    }
  }
  pl.placeAt(best.i, 0, true);
  g.camMode = 1;   // TOP FAR
  // hold the whole pod mid-breach
  for (const w of t.animated.whales) { w.period = 1e9; w.phase = 1e9 * 0.11 - performance.now() / 1000; }
  for (let k = 0; k < 120; k++) g.frame();
  // aim the camera at the nearest whale
  g.camPos.set(best.w.g.position.x - 60, 46, best.w.g.position.z - 60);
  g.camLook.copy(best.w.g.position);
  g.camera.position.copy(g.camPos);
  g.camera.lookAt(g.camLook);
  const real = g.frame.bind(g);
  g.composer.render = Object.getPrototypeOf(g.composer).render.bind(g.composer);
  g.composer.render(1/60);
});
await p.screenshot({ path: '/tmp/claude-0/-home-user-racing-shooter/0a1b4850-fdd3-5cf2-92f1-b12f6b9663b9/scratchpad/whaleshot.png' });
await b.close();
console.log('shot saved');
