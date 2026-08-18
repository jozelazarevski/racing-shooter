/* IS THE LENS EVER UNDER THE GROUND?
 *
 * The off-road sweep produced a frame of SILVERSTONE that is 100% BLACK at
 * 67 km/h — HUD lit, world gone. `_updateCamera` promises this cannot happen
 * ("...and never underground wherever it ended up": cp.y = max(cp.y, ground +
 * 2.2)) — but the MAX_UP cap runs AFTERWARDS and can put it straight back
 * under, then tries to recover by pulling the boom in, six times, and gives up
 * silently if six is not enough.
 *
 * So: drive off the road, and after every frame compare the camera's own y
 * with the ground under the camera. Counted, with the worst depth and the
 * camera mode it happened in.
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8920';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 640, height: 380 } });
page.setDefaultTimeout(600000);
let totBad = 0, totFrames = 0, worlds = 0, dirty = 0;
for (const id of process.argv.slice(2)) {
  await page.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
  await page.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 600000 });
  const r = await page.evaluate(() => {
    const g = window.__game, t = g.track, p = g.player, N = t.center.length;
    g.clock.getDelta = () => 1 / 60;
    if (g.composer) g.composer.render = () => {};
    const CN = g.constructor.CAM_NAMES ?? [];
    const ci = CN.indexOf('CHASE'); if (ci >= 0) g.camMode = ci;
    let bad = 0, frames = 0, worst = 0, at = null;
    // eight excursions, each seated well off the road and driven at the
    // steepest ground it can find — where the lift term is largest
    for (let seg = 0; seg < 8; seg++) {
      const i = Math.round(N * seg / 8), c0 = t.center[i], n = t.nrm[i];
      const side = seg % 2 ? 1 : -1;
      const x = c0.x + n.x * 70 * side, z = c0.z + n.z * 70 * side;
      p.pos.set(x, t.terrainHeight(x, z) + 1.2, z);
      p.y = t.terrainHeight(x, z); p.vel.set(0, 0, 0); p.vy = 0; p.airborne = false;
      p.alive = true; p.health = p.maxHealth ?? 100;
      p._lostT = 0; p._wedgeT = 0; p._bogT = 0;
      p.trackIndex = t.nearestIndex(p.pos);
      // aim uphill: sample a ring and take the steepest rise
      let bestA = 0, bestH = -Infinity;
      for (let a = 0; a < 24; a++) {
        const th = a / 24 * Math.PI * 2;
        const h = t.terrainHeight(p.pos.x + Math.cos(th) * 60, p.pos.z + Math.sin(th) * 60);
        if (h > bestH) { bestH = h; bestA = th; }
      }
      p.heading = Math.atan2(Math.cos(bestA), Math.sin(bestA));
      for (let k = 0; k < 420; k++) {            // 7 s per excursion
        g.input.analog.throttle = 1;
        g.input.analog.steer = 0;
        g.frame();
        frames++;
        const cy = g.camera.position.y;
        const gy = t.terrainHeight(g.camera.position.x, g.camera.position.z);
        const dig = gy - cy;
        if (dig > 0) {
          bad++;
          if (dig > worst) { worst = dig; at = [Math.round(g.camera.position.x),
            Math.round(g.camera.position.z), +cy.toFixed(1), +gy.toFixed(1)]; }
        }
      }
    }
    return { name: t.level?.name, bad, frames, worst: +worst.toFixed(1), at };
  });
  worlds++; totBad += r.bad; totFrames += r.frames;
  if (r.bad) dirty++;
  console.log(`${String(id).padStart(2)} ${(r.name ?? '?').padEnd(20)} `
    + `${String(r.bad).padStart(5)}/${r.frames} frames with the lens under the ground`
    + (r.bad ? `   worst ${r.worst} u  [camx,camz,camy,groundy]=${JSON.stringify(r.at)}` : ''));
}
console.log(`\n===== ${totBad} of ${totFrames} frames (${(totBad / totFrames * 100).toFixed(2)}%) `
  + `across ${dirty} of ${worlds} worlds =====`);
await b.close();
