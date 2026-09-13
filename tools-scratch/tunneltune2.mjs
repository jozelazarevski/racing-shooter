import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
await p.goto('http://localhost:8901/?level=4&go=1&unlockall=1', { waitUntil: 'load', timeout: 120000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 90000 });
await p.evaluate(() => {
  const g = window.__game;
  g.clock.getDelta = () => 1/60; if (g.composer) g.composer.render = () => {};
  for (let k = 0; k < 300 && g.state !== 'countdown'; k++) g.frame();
});
await p.evaluate(() => {
  const g = window.__game;
  for (let k = 0; k < 600 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  for (let k = 0; k < 200; k++) g.frame();
});
const r = await p.evaluate(() => {
  const g = window.__game, c = g.player, t = g.track;
  const names = g.constructor.CAM_NAMES;
  const N = t.center.length;
  const out = {};
  const M = g.constructor.CAM_MODES[names.indexOf('TUNNEL')];
  Object.assign(M, { back: 14, h: 5.2, look: 7, lookH: 1.5, spdBack: 4, spdH: 1.2 });
  for (let m = 0; m < names.length; m++) {
    if (names[m] === 'DRIVER') continue;
    g.camMode = m;
    let worst = 0, worstK = -1, prevGY = null, skip = 0;
    for (let k = 0; k < 240; k++) {
      const idx = (100 + Math.floor(k * 0.5)) % N;
      const pt = t.pointAt(idx, 0);
      const gY = t.groundHeightAt(idx, 0) + 0.3;
      if (prevGY !== null && Math.abs(gY - prevGY) > 3) skip = 30;
      else if (skip > 0) skip--;
      prevGY = gY;
      c.pos.set(pt.x, gY, pt.z); c.y = c.pos.y;
      c.trackIndex = idx; c.heading = t.headingAt(idx);
      c.vel.set(Math.sin(c.heading), 0, Math.cos(c.heading)).multiplyScalar(30);
      c.airborne = false; c.vy = 0; c.alive = true;
      g.frame();
      if (k < 40 || skip > 0) continue;
      const v = c.mesh.position.clone().project(g.camera);
      if (v.z < 1 && (1 - (v.y + 1) / 2) * 100 > worst) { worst = (1 - (v.y + 1) / 2) * 100; worstK = k; }
    }
    out[names[m]] = { worst: +worst.toFixed(1), atK: worstK,
      camY: +g.camera.position.y.toFixed(1), carY: +c.mesh.position.y.toFixed(1),
      dist: +g.camera.position.distanceTo(c.mesh.position).toFixed(1) };
  }
  return out;
});
console.log(JSON.stringify(r, null, 1));
await b.close();
