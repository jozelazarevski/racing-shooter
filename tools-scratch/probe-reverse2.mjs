/* The user's own scheme: two-thumb (autoThrottle), BRAKE pedal held.
 * Teleported clear of the pack so nothing shoves the measurement. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
const errs = [];
p.on('pageerror', (e) => errs.push(String(e.message).slice(0, 120)));
await p.goto(`${BASE}/?level=1&go=1&unlockall=1`, { waitUntil: 'load', timeout: 120000 });
await p.waitForFunction(() => window.__game?.player && window.__game.state === 'race',
  undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, pl = g.player;
  if (g.composer) g.composer.render = () => {};
  let elapsed = g.clock.elapsedTime;
  g.clock = { getDelta: () => { elapsed += 1 / 60; return 1 / 60; }, get elapsedTime() { return elapsed; } };
  g.input.autoThrottle = true;                    // two-thumb scheme
  // park half a lap from the pack
  const N = g.track.center.length;
  pl.placeAt((pl.trackIndex + Math.floor(N / 2)) % N, 0, true);
  pl.vel.set(0, 0, 0);
  const idx0 = pl.trackIndex;
  // BRAKE pedal down (data-key ArrowDown -> keys set)
  g.input.keys.add('ArrowDown');
  const trace = [], rev = [];
  for (let f = 0; f < 240; f++) {                 // 4 s of held pedal
    g._frameBody();
    if (f % 30 === 29) { trace.push(+pl.speedAlong.toFixed(2)); rev.push(+(pl.reverseTimer ?? -1).toFixed(2)); }
  }
  const backed = pl.trackIndex - idx0;
  g.input.keys.delete('ArrowDown');
  // ...and can they STEER while reversing? re-engage, then hold steer too
  pl.vel.set(0, 0, 0); pl.speedAlong = 0; pl.reverseTimer = 0;
  const h0 = pl.heading;
  g.input.keys.add('ArrowDown'); g.input.keys.add('ArrowLeft');
  let turned = 0;
  for (let f = 0; f < 240; f++) { g._frameBody(); }
  turned = Math.abs(pl.heading - h0);
  const bothSteerTrap = g.input.bothSteer;
  g.input.keys.delete('ArrowDown'); g.input.keys.delete('ArrowLeft');
  return { trace, rev, backed, idx0,
    steerRev: { turned: +turned.toFixed(2), endSpeed: +pl.speedAlong.toFixed(2), bothSteerTrap },
    unstuckCool: pl.unstuckCool, wedgeT: pl._wedgeT };
});
console.log(JSON.stringify(r), 'errors:', errs.slice(0, 3).join(' | ') || 'none');
await browser.close();
