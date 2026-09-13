/* CORRIDOR step 2 recon: what does the CURRENT tyre do on a uniform slope?
 * Terrain is overridden to a plane rising along +x at a set angle; the car
 * drives at it flat out. Measured per angle: farthest uphill progress from
 * the foot, whether it holds/creeps at the top of its run, hull cost. */
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 640, height: 400 } });
p.on('pageerror', (e) => console.log('ERR', String(e).slice(0, 120)));
await p.goto('http://localhost:8901/?level=26&mode=roam&go=1&unlockall=1', { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.player, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, c = g.player, t = g.track;
  g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
  for (let k = 0; k < 600 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  const thReal = t.terrainHeight.bind(t);
  const out = {};
  for (const deg of [25, 30, 35, 45, 55]) {
    const slope = Math.tan(deg * Math.PI / 180);
    const X0 = 3000;                       // foot of the ramp, far off the map
    t.terrainHeight = (x, z) => Math.max(0, (x - X0) * slope);
    c.alive = true; c.health = 100; c.invuln = 0; c.airborne = false; c.vy = 0;
    c._wilds = false; c._cliffT = 0; c._wedgeT = 0; c._lostT = 0;
    c.pos.set(X0 - 60, 0.3, 0); c.y = 0.3;
    c.heading = Math.PI / 2;               // +x, straight up the ramp
    c.vel.set(44, 0, 0);                   // ~160 km/h at the foot
    let maxX = 0, settled = 0;
    for (let k = 0; k < 600; k++) {
      c.step(1 / 60, { throttle: 1, brake: 0, steer: 0, drift: false });
      maxX = Math.max(maxX, c.pos.x - X0);
      if (k === 450) settled = c.pos.x - X0;
    }
    out[deg] = {
      maxUp: +maxX.toFixed(1),
      atEnd: +(c.pos.x - X0).toFixed(1),
      stillClimbing: (c.pos.x - X0) - settled > 2,
      hullLost: +(100 - c.health).toFixed(1),
      speedEnd: +Math.hypot(c.vel.x, c.vel.z).toFixed(1),
    };
  }
  t.terrainHeight = thReal;
  return out;
});
console.log(JSON.stringify(r, null, 1));
await b.close();
