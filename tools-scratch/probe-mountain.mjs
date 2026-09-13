import { chromium } from 'playwright-core';
const BASE = 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
for (const [id, name] of [[19, 'GOTTHARD'], [6, 'SUMMIT CLIMB'], [1, 'PINE VALLEY']]) {
  const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
  await p.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
  await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
  const r = await p.evaluate(() => {
    const g = window.__game, t = g.track, c = g.player;
    g.state = 'race'; g.freeRoam = true; g.missionMode = false;
    g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
    // the big drawn masses: solids with large r (massif cones)
    const big = (t.solids ?? []).filter((o) => o.r > 30).slice(0, 6)
      .map((o) => ({ x: +o.x.toFixed(0), z: +o.z.toFixed(0), r: +o.r.toFixed(0), mat: o.mat }));
    const results = [];
    for (const m of big.slice(0, 4)) {
      // spawn 1.5r away, drive straight at the center for 20 s
      const d0 = m.r * 1.5 + 30;
      const ang = Math.atan2(m.x, m.z);
      const sx = m.x - Math.sin(ang) * d0, sz = m.z - Math.cos(ang) * d0;
      c.alive = true; c.health = 100; c.airborne = false; c.vy = 0;
      c.pos.set(sx, t.terrainHeight(sx, sz) + 0.4, sz); c.y = c.pos.y;
      c.heading = Math.atan2(m.x - sx, m.z - sz);
      c.trackIndex = t.nearestIndex(c.pos);
      c.vel.set(Math.sin(c.heading), 0, Math.cos(c.heading)).multiplyScalar(10);
      let minD = 1e9, inside = 0, maxPen = 0;
      for (let k = 0; k < 20 * 60; k++) {
        c.heading = Math.atan2(m.x - c.pos.x, m.z - c.pos.z); // keep aiming at it
        c.step(1 / 60, { throttle: 1, brake: 0, steer: 0, drift: false, hold: false });
        const d = Math.hypot(c.pos.x - m.x, c.pos.z - m.z);
        minD = Math.min(minD, d);
        if (d < m.r * 0.7) { inside++; maxPen = Math.max(maxPen, m.r * 0.7 - d); }
      }
      results.push({ m, minD: +minD.toFixed(0), insideFrames: inside, maxPen: +maxPen.toFixed(0),
        endY: +c.y.toFixed(1), terrY: +t.terrainHeight(c.pos.x, c.pos.z).toFixed(1) });
    }
    return { bigCount: (t.solids ?? []).filter((o) => o.r > 30).length, results };
  });
  console.log(name, JSON.stringify(r, null, 1));
  await p.close();
}
await browser.close();
