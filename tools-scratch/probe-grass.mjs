import { chromium } from 'playwright-core';
const BASE = 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const out = {};
for (const [id, name] of [[74, 'IL BUDELLO'], [66, 'GLACIER COL'], [1, 'PINE VALLEY']]) {
  const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
  await p.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
  await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
  out[name] = {};
  for (const drag of [0.35, 0.12, 0.08]) {
  out[name]['drag' + drag] = await p.evaluate((dragV) => {
    window.__DRIVING.dragOffRoad = dragV;
    const g = window.__game, t = g.track, c = g.player;
    g.state = 'race'; g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
    const run = (lat) => {
      // endless straight via loop-back hop; lat 0 = road, lat 14 = off-road
      const place = (sp) => {
        c.alive = true; c.health = 100; c.airborne = false; c.vy = 0;
        const pt = t.pointAt(220, lat);
        c.pos.set(pt.x, (lat === 0 ? t.groundHeightAt(220, 0) : t.terrainHeight(pt.x, pt.z)) + 0.3, pt.z);
        c.y = c.pos.y; c.trackIndex = 220; c.lateral = lat; c.heading = t.headingAt(220);
        c.slip = 0; c._wetT = 0; c._fordNow = 0; c._wetMax = 0;
        c.vel.set(Math.sin(c.heading), 0, Math.cos(c.heading)).multiplyScalar(sp);
      };
      place(0);
      let vTop = 0, t30 = null;
      for (let k = 0; k < 1200; k++) {
        if (k > 0 && k % 90 === 0) place(Math.hypot(c.vel.x, c.vel.z));
        c.step(1 / 60, { throttle: 1, brake: 0, steer: 0, drift: false, hold: false });
        const v = Math.hypot(c.vel.x, c.vel.z);
        vTop = Math.max(vTop, v);
        if (t30 === null && v * 3.6 >= 30) t30 = +(k / 60).toFixed(2);
      }
      return { top: +(vTop * 3.6).toFixed(0), t30 };
    };
    const road = run(0), grass = run(14);
    return { road: road.top, grass: grass.top, t30: grass.t30, pct: +(grass.top / road.top * 100).toFixed(0) };
  }, drag);
  }
  await p.close();
}
console.log(JSON.stringify(out, null, 1));
await browser.close();
