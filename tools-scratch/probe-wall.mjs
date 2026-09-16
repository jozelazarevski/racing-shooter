import { chromium } from 'playwright-core';
const BASE = 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
for (const [id, name] of [[4, 'CANYON RUN'], [66, 'GLACIER COL'], [59, 'CLIFF KNOT']]) {
  const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
  await p.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
  await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
  const r = await p.evaluate(() => {
    const g = window.__game, t = g.track, c = g.player, N = t.center.length;
    g.state = 'race'; g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
    const runs = [];
    // every ~90 samples, drive perpendicular off the road for 12 s each side
    for (let si = 40; si < N; si += 180) {
      for (const side of [1, -1]) {
        const pt = t.pointAt(si, 0);
        const hd = t.headingAt(si) + side * Math.PI / 2;   // straight off the road
        c.alive = true; c.health = 100; c.airborne = false; c.vy = 0;
        c.pos.set(pt.x, t.groundHeightAt(si, 0) + 0.3, pt.z); c.y = c.pos.y;
        c.heading = hd; c.trackIndex = si; c.lateral = 0;
        c._wetT = 0; c._fordNow = 0;
        c.vel.set(Math.sin(hd), 0, Math.cos(hd)).multiplyScalar(8);
        const y0 = c.y;
        let maxLat = 0;
        for (let k = 0; k < 12 * 60; k++) {
          c.heading = hd;  // hold the perpendicular
          c.step(1 / 60, { throttle: 1, brake: 0, steer: 0, drift: false, hold: false });
          if (!c.alive) break;
        }
        const dx = c.pos.x - pt.x, dz = c.pos.z - pt.z;
        maxLat = Math.hypot(dx, dz);
        const rise = c.y - y0;
        runs.push({ si, side, lat: +maxLat.toFixed(0), rise: +rise.toFixed(1),
          alive: c.alive, v: +Math.hypot(c.vel.x, c.vel.z).toFixed(1) });
      }
    }
    // suspicious: went far AND high (inside the wall mass) or far at speed on a walled world
    return runs;
  });
  const far = r.filter((x) => x.lat > 60);
  console.log(name, 'runs:', r.length, 'went >60u off-road:', far.length);
  console.log(JSON.stringify(far.slice(0, 8)));
  await p.close();
}
await browser.close();
