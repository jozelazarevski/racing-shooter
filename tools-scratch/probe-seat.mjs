/* Driver view on PIKES PEAK: shoot the seat at the steepest climb station,
 * a flat station, and a descent — plus report where the road ahead sits
 * vs the aim cone. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const OUT = '/tmp/claude-0/-home-user-racing-shooter/0a1b4850-fdd3-5cf2-92f1-b12f6b9663b9/scratchpad';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 430, height: 932 } });
await p.goto(`${BASE}/?level=25&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
const stations = await p.evaluate(() => {
  const g = window.__game, t = g.track;
  g.clock.getDelta = () => 1 / 60;
  for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  g.setDriverView(true);
  // find steepest climb, steepest descent, flattest over 34 u lookahead
  const N = t.center.length, L = Math.round(34 / t.segLen);
  let up = { i: 0, g: -9 }, down = { i: 0, g: 9 }, flat = { i: 0, g: 9 };
  for (let i = 20; i < N - 20; i += 3) {
    const dy = t.center[(i + L) % N].y - t.center[i].y;
    const gr = dy / 34;
    if (gr > up.g) up = { i, g: gr };
    if (gr < down.g) down = { i, g: gr };
    if (Math.abs(gr) < Math.abs(flat.g)) flat = { i, g: gr };
  }
  return { up, down, flat, L };
});
console.log('stations', JSON.stringify(stations));
for (const [name, st] of [['climb', stations.up], ['flat', stations.flat], ['descent', stations.down]]) {
  await p.evaluate((i) => {
    const g = window.__game, car = g.player;
    car.placeAt(i, 0);
    car.vel.set(0, 0, 0); car.speedAlong = 0;
    for (let k = 0; k < 40; k++) g.frame();   // let the seat settle
  }, st.i);
  await p.screenshot({ path: `${OUT}/seat-${name}.png`, timeout: 90000 });
}
await browser.close();
console.log('shot');
