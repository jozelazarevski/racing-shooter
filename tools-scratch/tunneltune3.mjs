import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
await p.goto('http://localhost:8901/?level=4&go=1&unlockall=1', { waitUntil: 'load', timeout: 120000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 90000 });
const r = await p.evaluate(async () => {
  const g = window.__game, c = g.player, t = g.track, N = t.center.length;
  g.clock.getDelta = () => 1/60; if (g.composer) g.composer.render = () => {};
  const f = () => new Promise((r2) => requestAnimationFrame(r2));
  for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  g.camMode = g.constructor.CAM_NAMES.indexOf('TUNNEL');
  const rows = [];
  const probe = new (c.pos.constructor)();
  for (let k = 0; k < 240; k++) {
    const idx = (100 + Math.floor(k * 0.5)) % N;
    const pt = t.pointAt(idx, 0);
    c.pos.set(pt.x, t.groundHeightAt(idx, 0) + 0.3, pt.z); c.y = c.pos.y;
    c.trackIndex = idx; c.heading = t.headingAt(idx);
    c.vel.set(Math.sin(c.heading), 0, Math.cos(c.heading)).multiplyScalar(30);
    c.airborne = false; c.vy = 0; c.alive = true;
    g.frame();
    if (k < 175) continue;
    const v = c.mesh.position.clone().project(g.camera);
    const depth = (1 - (v.y + 1) / 2) * 100;
    const bore = t.tunnelAt ? !!t.tunnelAt(probe.set(c.pos.x, 0, c.pos.z), c.trackIndex, 10) : null;
    if (k % 5 === 0 || depth > 70) rows.push({ k, idx, depth: +depth.toFixed(0),
      camY: +g.camera.position.y.toFixed(1), carY: +c.pos.y.toFixed(1), bore,
      shake: +g.shake.toFixed(2) });
  }
  return rows.filter((x, i) => i % 2 === 0 || x.depth > 70).slice(0, 40);
});
console.log(JSON.stringify(r));
await b.close();
