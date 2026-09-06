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
  const i = 349, lat = 10;
  const pt = t.pointAt(i, lat);
  const road0 = t.groundHeightAt(i, lat);
  car.trackIndex = i; car.lateral = lat; car.alive = true; car.health = 100;
  car.airborne = false; car.vy = 0; car._climbRate = 0; car._settleT = 0;
  car.pos.set(pt.x, road0 + 0.3, pt.z); car.y = car.pos.y;
  car.vel.set(0, 0, 0); car.speedAlong = 0;
  const frames = [];
  for (let k = 0; k < 30; k++) {
    car.step(1 / 60, { throttle: 0, brake: 0, steer: 0, drift: false, hold: false });
    if (k < 8 || k === 29) {
      const roadY = t.groundHeightAtPos ? t.groundHeightAtPos(car.pos, car.trackIndex, car.lateral)
        : t.groundHeightAt(car.trackIndex, car.lateral);
      frames.push({ k, y: +car.y.toFixed(2), lat: +car.lateral.toFixed(2),
        idx: car.trackIndex, roadY: +roadY.toFixed(2),
        terr: +t.terrainHeight(car.pos.x, car.pos.z).toFixed(2),
        air: car.airborne, vy: +car.vy.toFixed(2) });
    }
  }
  return { widthAt: t.widthAt(349), frames };
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
