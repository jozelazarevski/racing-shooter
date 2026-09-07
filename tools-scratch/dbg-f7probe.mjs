/* Replicate phase4's F7 grass run on a world and log what limits the car. */
import { chromium } from 'playwright-core';
const LVL = Number(process.env.LVL ?? 66);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
await p.goto(`http://localhost:8901/?level=${LVL}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track, c = g.player;
  g.state = 'race'; g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
  const place = (sp, lat) => {
    c.alive = true; c.health = 100; c.airborne = false; c.vy = 0;
    const pt = t.pointAt(220, lat);
    c.pos.set(pt.x, (lat === 0 ? t.groundHeightAt(220, 0) : t.terrainHeight(pt.x, pt.z)) + 0.3, pt.z);
    c.y = c.pos.y; c.trackIndex = 220; c.lateral = lat; c.heading = t.headingAt(220);
    c.slip = 0; c._wetT = 0; c._fordNow = 0; c._wetMax = 0;
    c.vel.set(Math.sin(c.heading), 0, Math.cos(c.heading)).multiplyScalar(sp);
  };
  const log = [];
  place(0, 14);
  for (let k = 0; k < 360; k++) {
    if (k > 0 && k % 90 === 0) place(Math.hypot(c.vel.x, c.vel.z), 14);
    c.step(1 / 60, { throttle: 1, brake: 0, steer: 0, drift: false, hold: false });
    if (k % 30 === 0) {
      const h0 = t.terrainHeight(c.pos.x, c.pos.z);
      const dirx = Math.sin(c.heading), dirz = Math.cos(c.heading);
      const gAlong = (t.terrainHeight(c.pos.x + dirx * 4, c.pos.z + dirz * 4) - h0) / 4;
      log.push({ k, v: +(Math.hypot(c.vel.x, c.vel.z) * 3.6).toFixed(1),
        gAlong: +gAlong.toFixed(2),
        wilds: !!c._wilds, surf: c.surfaceId ?? c.surface ?? '?',
        wet: c._wetT ?? 0, bog: c._bogT ?? c._boggedT ?? 0,
        y: +c.pos.y.toFixed(1), terr: +h0.toFixed(1) });
    }
  }
  // road reference spot grade
  const rg = t.slopeAt ? t.slopeAt(220) : null;
  return { log, roadSlopeAt220: rg && +rg.toFixed(3), topSpeed: +((c.maxSpeed ?? 0) * 3.6).toFixed(0) };
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
