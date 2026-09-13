/* Is r307 slower than the base — in TIME (fps/sim pace) or in CAR (accel/top)?
 * Real rendering, wall-clocked, then physics pace via deterministic step. */
import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
for (const [name, base] of [['r307-tree', 'http://localhost:8901'], ['r294-base', 'http://localhost:8902']]) {
  const p = await browser.newPage({ viewport: { width: 390, height: 700 } });
  await p.goto(`${base}/?level=1&go=1&unlockall=1`, { waitUntil: 'load', timeout: 180000 });
  await p.waitForFunction(() => window.__game?.player && window.__game.state === 'race',
    undefined, { timeout: 300000 }).catch(() => {});
  const r = await p.evaluate(async () => {
    const g = window.__game, pl = g.player;
    // A) REAL frame pacing for 6 wall seconds, driving straight
    g.input.analog.throttle = 1;
    let frames = 0;
    const rt0 = g.raceTime, w0 = performance.now();
    const rafCount = () => new Promise((res) => {
      const tick = () => { frames++; (performance.now() - w0 < 6000) ? requestAnimationFrame(tick) : res(); };
      requestAnimationFrame(tick);
    });
    await rafCount();
    const wall = (performance.now() - w0) / 1000;
    const simAdvance = g.raceTime - rt0;
    // B) PHYSICS pace, deterministic: 0-100 km/h and 5 s top-speed run
    pl.placeAt(200, 0, true); pl.vel.set(0, 0, 0); pl.speedAlong = 0;
    let t100 = -1;
    for (let f = 0; f < 600; f++) {
      pl.step(1 / 60, { throttle: 1, brake: 0, steer: 0, drift: false, hold: false });
      if (t100 < 0 && Math.abs(pl.speedAlong) * 3.6 >= 100) { t100 = f / 60; break; }
    }
    pl.placeAt(200, 0, true);
    const v0 = 30; pl.speedAlong = v0;
    pl.vel.set(Math.sin(pl.heading) * v0, 0, Math.cos(pl.heading) * v0);
    for (let f = 0; f < 300; f++) pl.step(1 / 60, { throttle: 1, brake: 0, steer: 0, drift: false, hold: false });
    return { fps: +(frames / wall).toFixed(1), simRatio: +(simAdvance / wall).toFixed(2),
      t100: +t100.toFixed(2), top5s: +(Math.abs(pl.speedAlong) * 3.6).toFixed(0) };
  });
  console.log(name, JSON.stringify(r));
  await p.close();
}
await browser.close();
