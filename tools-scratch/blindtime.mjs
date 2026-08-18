/* HOW LONG IS THE SCREEN A VOID?
 *
 * Driving off-road puts the car under the ground — into a hollow, through a
 * seam, off a ledge into a pocket. While it is under there the chase camera
 * has fifteen metres of hillside between it and the car and the frame is
 * black: the off-road sweep caught one on SILVERSTONE at 68 km/h that is 100%
 * a single colour.
 *
 * `_watchCarVisible` already fixes it — it lifts the car back to ground level
 * and re-seats the boom — but only after `_blindT` has run for a full second,
 * and that second is the void. Measured here: how many frames the car spends
 * buried, and the longest unbroken run of them.
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8920';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 640, height: 380 } });
page.setDefaultTimeout(600000);
let tot = 0, frames = 0, worstAll = 0;
for (const id of process.argv.slice(2)) {
  await page.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
  await page.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 600000 });
  const r = await page.evaluate(() => {
    const g = window.__game, t = g.track, p = g.player, N = t.center.length;
    g.clock.getDelta = () => 1 / 60;
    if (g.composer) g.composer.render = () => {};
    const CN = g.constructor.CAM_NAMES ?? [];
    const ci = CN.indexOf('CHASE'); if (ci >= 0) g.camMode = ci;
    let buried = 0, run = 0, worst = 0, n = 0;
    for (let seg = 0; seg < 12; seg++) {
      const i = Math.round(N * seg / 12), c0 = t.center[i], nrm = t.nrm[i];
      const side = seg % 2 ? 1 : -1;
      const x = c0.x + nrm.x * 80 * side, z = c0.z + nrm.z * 80 * side;
      p.pos.set(x, t.terrainHeight(x, z) + 1.2, z);
      p.y = t.terrainHeight(x, z); p.vel.set(0, 0, 0); p.vy = 0; p.airborne = false;
      p.alive = true; p.health = p.maxHealth ?? 100;
      p._lostT = 0; p._wedgeT = 0; p._bogT = 0; g._blindT = 0;
      p.trackIndex = t.nearestIndex(p.pos);
      let bestA = 0, bestH = -Infinity;
      for (let a = 0; a < 24; a++) {
        const th = a / 24 * Math.PI * 2;
        const h = t.terrainHeight(p.pos.x + Math.cos(th) * 70, p.pos.z + Math.sin(th) * 70);
        if (h > bestH) { bestH = h; bestA = th; }
      }
      p.heading = Math.atan2(Math.cos(bestA), Math.sin(bestA));
      for (let k = 0; k < 480; k++) {
        g.input.analog.throttle = 1; g.input.analog.steer = 0;
        g.frame(); n++;
        const gy = t.terrainHeight(p.pos.x, p.pos.z);
        if (p.y < gy - 1.2) { buried++; run++; if (run > worst) worst = run; }
        else run = 0;
      }
    }
    return { name: t.level?.name, buried, n, worst };
  });
  tot += r.buried; frames += r.n; if (r.worst > worstAll) worstAll = r.worst;
  console.log(`${String(id).padStart(2)} ${(r.name ?? '?').padEnd(20)} buried ${String(r.buried).padStart(5)}/${r.n} frames`
    + `  (${(r.buried / r.n * 100).toFixed(2)}%)   longest run ${r.worst} frames = ${(r.worst / 60).toFixed(2)} s`);
}
console.log(`\n===== ${tot} of ${frames} off-road frames buried (${(tot / frames * 100).toFixed(2)}%), `
  + `longest single void ${(worstAll / 60).toFixed(2)} s =====`);
await b.close();
