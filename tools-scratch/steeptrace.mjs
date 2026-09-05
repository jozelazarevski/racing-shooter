import { chromium } from 'playwright-core';
const BASE = 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
await p.goto(`${BASE}/?level=21&go=1&unlockall=1`, { waitUntil: 'load', timeout: 240000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track, c = g.player;
  g.state = 'race'; g.freeRoam = true; g.missionMode = false;
  g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
  // find one steep remote spot exactly like the test
  const TH = (x, z) => t.terrainHeight(x, z);
  const up = (x, z, h = 4) => {
    const gx = (TH(x + h, z) - TH(x - h, z)) / (2 * h);
    const gz = (TH(x, z + h) - TH(x, z - h)) / (2 * h);
    const m = Math.hypot(gx, gz) || 1e-9;
    return { x: gx / m, z: gz / m, g: m };
  };
  let spot = null;
  for (let tr = 0; tr < 6000 && !spot; tr++) {
    const a = Math.random() * Math.PI * 2, rad = 200 + Math.random() * 900;
    const x = Math.cos(a) * rad, z = Math.sin(a) * rad;
    if (t._nearGoat?.(x, z, 30)) continue;
    let gmin = 1e9;
    for (let q = 0; q < t.center.length; q += 2) {
      const cc = t.center[q], d = Math.hypot(x - cc.x, z - cc.z);
      if (d < gmin) gmin = d;
    }
    if (gmin < 90) continue;
    const u = up(x, z);
    if (u.g < 1.0 || u.g > 3.0) continue;
    const g2 = (TH(x + u.x * 8, z + u.z * 8) - TH(x, z)) / 8;
    if (g2 < 1.0 || g2 > 3.0) continue;
    spot = { x, z, ux: u.x, uz: u.z, g: +u.g.toFixed(2), gmin: Math.round(gmin) };
  }
  if (!spot) return { none: true };
  c.alive = true; c.health = 100; c.airborne = false; c.vy = 0;
  c.pos.set(spot.x, TH(spot.x, spot.z) + 0.3, spot.z); c.y = c.pos.y;
  c.heading = Math.atan2(spot.ux, spot.uz);
  c.vel.set(spot.ux * 8, 0, spot.uz * 8);
  c.trackIndex = t.nearestIndex(c.pos);
  const rows = [{ spot }];
  const x0 = c.pos.x, z0 = c.pos.z, y0 = c.y;
  for (let k = 0; k < 360; k++) {
    c.step(1 / 60, { throttle: 1, brake: 0, steer: 0, drift: false, hold: false });
    if (k % 45 === 0 || k === 359) rows.push({ k,
      d: +Math.hypot(c.pos.x - x0, c.pos.z - z0).toFixed(1), rise: +(c.y - y0).toFixed(1),
      vf: +Math.hypot(c.vel.x, c.vel.z).toFixed(1), wilds: c._wilds ? 1 : 0,
      lat: Math.round(c.lateral ?? 0), slip: +c.slip.toFixed(2) });
  }
  return rows;
});
for (const row of (Array.isArray(r) ? r : [r])) console.log(JSON.stringify(row));
await p.close(); await browser.close();
