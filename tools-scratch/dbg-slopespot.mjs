/* r346 — what did slopegrip T1 pick at 2x? Terrain vs game ground vs solids. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 480, height: 320 } });
await p.goto(`${BASE}/?level=12&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.player && window.__game.track?.center,
  undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track, N = t.center.length, pl = g.player;
  for (let i = 0; i < 900 && g.state !== 'race'; i++) { g.countdown = 0.01; g._frameBody(); }
  g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
  let spot = null;
  for (let i = 0; i < N && !spot; i += 12) {
    const c = t.center[i], c2 = t.center[(i + 1) % N];
    let sx = c2.z - c.z, sz = -(c2.x - c.x);
    const sl = Math.hypot(sx, sz) || 1; sx /= sl; sz /= sl;
    for (const side of [1, -1]) {
      for (const dist of [70, 90, 120]) {
        const x = c.x + sx * side * dist, z = c.z + sz * side * dist;
        const E = 4;
        const gx = (t.terrainHeight(x + E, z) - t.terrainHeight(x - E, z)) / (2 * E);
        const gz = (t.terrainHeight(x, z + E) - t.terrainHeight(x, z - E)) / (2 * E);
        const gm = Math.hypot(gx, gz);
        if (gm < 1.4 || gm > 5) continue;
        const ux = gx / gm, uz = gz / gm;
        if ((t.terrainHeight(x + ux * 14, z + uz * 14) - t.terrainHeight(x, z)) / 14 < 1.0) continue;
        spot = { i, x: +x.toFixed(0), z: +z.toFixed(0), grade: +gm.toFixed(2) };
        break;
      }
      if (spot) break;
    }
  }
  if (!spot) return { fail: 'none' };
  const terr = t.terrainHeight(spot.x, spot.z);
  const near = (t.solids ?? []).filter((o) =>
    Math.hypot(o.x - spot.x, o.z - spot.z) < (o.r ?? 0) + 10 && (o.r ?? 0) > 15)
    .map((o) => ({ r: +o.r.toFixed(0), d: +Math.hypot(o.x - spot.x, o.z - spot.z).toFixed(0),
      prof: !!o.prof, y: +(+o.y).toFixed(0) }));
  pl.pos.x = spot.x; pl.pos.z = spot.z; pl.y = terr;
  pl.vel.set(0, 0, 0); pl.vy = 0; pl.airborne = false; pl.invuln = 20;
  const y0 = pl.y;
  g.input.analog = { steer: 0, throttle: 0, brake: 0 };
  g.frame();
  return { spot, terr: +terr.toFixed(1), y0: +y0.toFixed(1),
    yAfter1: +pl.y.toFixed(1), snap: +(pl.y - y0).toFixed(1), nearSolids: near };
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
