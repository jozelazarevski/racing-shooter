/* IS THE CAR STANDING ON THE ROAD AT THE START LINE? `playermoves.mjs` found
 * NEO-KYOTO frozen at the grid — speed 0 and zero distance after six seconds
 * of held throttle, with the chase camera 197 u away — while every other world
 * drives. This reports where the car actually is against where the road is. */
import { chromium } from 'playwright-core';
const LEVELS = (process.env.LEVELS ?? '1,18').split(',');
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
for (const lvl of LEVELS) {
  const p = await b.newPage({ viewport: { width: 430, height: 800 } });
  p.setDefaultTimeout(600000);
  await p.goto(`http://localhost:8901/?level=${lvl}&go=1&unlockall=1`, { waitUntil:'load', timeout:600000 });
  await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout:600000 });
  console.log(lvl, JSON.stringify(await p.evaluate(async () => {
    const g = window.__game, pl = g.player, t = g.track;
    g.startRace?.();
    const f = () => new Promise((r) => requestAnimationFrame(r));
    for (let i = 0; i < 600 && g.state !== 'race'; i++) await f();
    const t0 = performance.now();
    while (performance.now() - t0 < 3000) {
      if (g.input?.analog) { g.input.analog.throttle = 1; g.input.analog.steer = 0; g.input.analog.brake = 0; }
      await f();
    }
    const road = t.pointAt(pl.trackIndex ?? 0, 0);
    return { name: g.level?.name, alive: pl.alive, outOfHulls: !!pl.outOfHulls,
      hull: pl.hull ?? null, trackIndex: pl.trackIndex, N: t.N,
      carY: +pl.pos.y.toFixed(2), roadY: Number.isFinite(road.y) ? +road.y.toFixed(2) : road.y,
      carXZ: [+pl.pos.x.toFixed(1), +pl.pos.z.toFixed(1)],
      roadXZ: [+road.x.toFixed(1), +road.z.toFixed(1)],
      offRoad: +Math.hypot(pl.pos.x - road.x, pl.pos.z - road.z).toFixed(1),
      speed: +pl.vel.length().toFixed(2), throttle: g.input?.throttle,
      camPos: g.camera.position.toArray().map((n) => +n.toFixed(1)) };
  })));
  await p.close();
}
await b.close();
