/* Binary-search each chase/top mode's `look` for a 55% car anchor (HUD_REVIEW
 * §4: 52-58%), measured through the real frame loop on a portrait viewport. */
import { chromium } from 'playwright-core';
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
const p = await browser.newPage({ viewport: { width: 390, height: 844 } });
await p.goto('http://localhost:8901/?level=4&go=1&unlockall=1', { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.player, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, c = g.player, t = g.track;
  g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
  for (let k = 0; k < 600 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  const MODES = g.constructor.CAM_MODES;
  const idx = 300, pt = t.pointAt(idx, 0);
  const measure = (m, sp) => {
    c.alive = true; c.airborne = false; c.vy = 0;
    c.pos.set(pt.x, t.groundHeightAt(idx, 0) + 0.3, pt.z); c.y = c.pos.y;
    c.trackIndex = idx; c.heading = t.headingAt(idx);
    let top = 0;
    for (let k = 0; k < 110; k++) {
      c.vel.set(Math.sin(c.heading), 0, Math.cos(c.heading)).multiplyScalar(sp);
      c.pos.set(pt.x, c.pos.y, pt.z);
      g.frame();
      const v = c.mesh.position.clone().project(g.camera);
      top = (1 - (v.y + 1) / 2) * 100;
    }
    return top;
  };
  const out = {};
  for (let m = 0; m < MODES.length; m++) {
    const M = MODES[m];
    if (M.driver) continue;
    g.camMode = m;
    let lo = 0, hi = M.look, best = M.look;
    for (let it = 0; it < 7; it++) {
      const mid = (lo + hi) / 2;
      M.look = mid;
      const top = measure(m, 0);
      if (top > 55) hi = mid; else lo = mid;   // more look -> car lower (bigger %)
      best = mid;
    }
    M.look = best;
    out[M.name] = { look: +best.toFixed(1), rest: +measure(m, 0).toFixed(1),
      fast: +measure(m, 50).toFixed(1) };
  }
  return out;
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
