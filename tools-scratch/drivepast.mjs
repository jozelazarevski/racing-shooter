/* PARK THE CAR AT A WORLD POINT AND LOOK FROM THE CHASE CAMERA.
 * The player's own view, at the place a number says something is wrong. After
 * seven indirect probes each returned a confident wrong answer about the
 * rivers, this is the one test with nothing to misread: if a slab of water
 * stands 5 u over the road three metres from the racing line, it is in frame. */
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8920';
const OUT = process.env.OUT ?? '/tmp/drivepast';
fs.mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 900, height: 520 } });
page.setDefaultTimeout(600000);
for (const arg of process.argv.slice(2)) {
  const id = Number(arg.split('@')[0]);
  const [X, Z] = arg.split('@')[1].split(',').map(Number);
  await page.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
  await page.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 600000 });
  for (const back of [70, 25]) {
    const info = await page.evaluate(([X, Z, back]) => {
      const g = window.__game, t = g.track, p = g.player, N = t.center.length;
      g.clock.getDelta = () => 1 / 60;
      const CN = g.constructor.CAM_NAMES ?? [];
      const ci = CN.indexOf('CHASE'); if (ci >= 0) g.camMode = ci;
      const near = t.nearestIndex(new (t.center[0].constructor)(X, 0, Z));
      const i = (near - back + N) % N;
      const c = t.center[i];
      p.pos.set(c.x, c.y + 1.2, c.z); p.y = c.y;
      p.vel.set(0, 0, 0); p.vy = 0; p.airborne = false;
      p.trackIndex = i; p.heading = t.headingAt(i);
      p.alive = true; p.health = p.maxHealth ?? 100;
      for (let f = 0; f < 120; f++) { g.input.analog.throttle = 0; g.input.analog.steer = 0; g.frame(); }
      return { name: t.level?.name, i, near,
        d: Math.round(Math.hypot(t.center[i].x - X, t.center[i].z - Z)) };
    }, [X, Z, back]);
    await page.screenshot({ path: `${OUT}/L${String(id).padStart(2, '0')}-${X}_${Z}-b${back}.png` });
    console.log(`${id} ${info.name} parked ${back} samples short (index ${info.i}, ${info.d} u from the point)`);
  }
}
await b.close();
