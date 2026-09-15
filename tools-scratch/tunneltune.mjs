import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
await p.goto('http://localhost:8901/?level=4&go=1&unlockall=1', { waitUntil: 'load', timeout: 120000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 90000 });
const r = await p.evaluate(async () => {
  const g = window.__game, t = g.track, c = g.player, N = t.center.length;
  g.startRace?.();
  const f = () => new Promise((r2) => requestAnimationFrame(r2));
  for (let i = 0; i < 900 && g.state !== 'race'; i++) { g.countdown = 0.01; await f(); }
  g.clock.getDelta = () => 1/60; if (g.composer) g.composer.render = () => {};
  const M = g.constructor.CAM_MODES[g.constructor.CAM_NAMES.indexOf('TUNNEL')];
  const tune = async (over) => {
    Object.assign(M, over);
    g.camMode = g.constructor.CAM_NAMES.indexOf('TUNNEL');
    let worst = 0;
    for (let k = 0; k < 240; k++) {
      const idx = (100 + Math.floor(k * 0.5)) % N;
      const pt = t.pointAt(idx, 0);
      c.pos.set(pt.x, t.groundHeightAt(idx, 0) + 0.3, pt.z); c.y = c.pos.y;
      c.trackIndex = idx; c.heading = t.headingAt(idx);
      c.vel.set(Math.sin(c.heading), 0, Math.cos(c.heading)).multiplyScalar(30);
      c.airborne = false; c.vy = 0; c.alive = true;
      g.frame();
      if (k < 40) continue;
      const v = c.mesh.position.clone().project(g.camera);
      if (v.z < 1) worst = Math.max(worst, (1 - (v.y + 1) / 2) * 100);
    }
    return +worst.toFixed(1);
  };
  const out = {};
  out.e4 = await tune({ back: 16, h: 7.2, look: 3, lookH: -0.8, spdH: 0.6 });
  out.f1 = await tune({ back: 16, h: 8.2, look: 2, lookH: -1.2, spdH: 0.6 });
  out.f2 = await tune({ back: 18, h: 9.0, look: 2, lookH: -1.0, spdH: 0.6 });
  out.f3 = await tune({ back: 16, h: 7.2, look: 1.5, lookH: -1.6, spdH: 0.6 });
  out.f4 = await tune({ back: 20, h: 9.5, look: 3, lookH: -1.0, spdH: 0.6 });
  return out;
});
console.log(JSON.stringify(r));
await b.close();
