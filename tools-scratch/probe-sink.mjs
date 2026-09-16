import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
await p.goto(`${BASE}/?level=21&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track, car = g.player;
  const i = 349;
  const out = { widthAt: t.widthAt ? t.widthAt(i) : null, rows: [] };
  for (const lat of [7, 9, 10]) {
    const pt = t.pointAt(i, lat);
    const road = t.groundHeightAt(i, lat);
    const terr = t.terrainHeight(pt.x, pt.z);
    const drawn = t._drawnGroundY(pt.x, pt.z);
    car.trackIndex = i; car.lateral = lat; car.alive = true; car.health = 100;
    car.airborne = false; car.vy = 0; car._climbRate = 0; car._settleT = 0;
    car.pos.set(pt.x, road + 0.3, pt.z); car.y = car.pos.y;
    car.vel.set(0, 0, 0); car.speedAlong = 0;
    for (let k = 0; k < 30; k++) car.step(1 / 60, { throttle: 0, brake: 0, steer: 0, drift: false, hold: false });
    out.rows.push({ lat, road: +road.toFixed(2), terr: +terr.toFixed(2),
      drawn: drawn === null ? null : +drawn.toFixed(2), carY: +car.y.toFixed(2) });
  }
  return out;
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
