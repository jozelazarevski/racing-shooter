/* DOES THE WEDGE NET SEE THE THROTTLE THE HARNESS IS HOLDING?
 *
 * The free rescue fires on `_wedgeT > 5`, and `_wedgeT` accumulates only while
 * `input.throttle > 0.5` with the car barely moving. The harness sets
 * `g.input.analog.throttle`, which is not obviously the same field — and if it
 * is not, a 45-second trace showing "the game never recovers the car" is a
 * fact about the harness and nothing else.
 *
 * So read the state the net reads, every second, while driving into the rock:
 * the resolved throttle, controlsLive, the wedge and lost clocks, speed and
 * lateral. Whatever the net is missing will be visible in its own inputs.
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8901';
const ID = Number(process.env.ID ?? 4);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 400, height: 240 } });
page.setDefaultTimeout(600000);
await page.goto(`${BASE}/?level=${ID}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await page.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 600000 });
const r = await page.evaluate(() => {
  const g = window.__game, p = g.player;
  g.clock.getDelta = () => 1 / 60;
  g._autoQuality = () => {};
  g.composer.render = () => {};
  const trace = [];
  const feeds = [];
  const realFeed = g.hud.feed.bind(g.hud);
  g.hud.feed = (t, k) => { feeds.push(t); return realFeed(t, k); };
  for (let f = 0; f < 3600; f++) {
    g.input.analog.throttle = 1;
    g.frame();
    if (f % 60 === 0) trace.push({
      s: f / 60,
      resolvedThrottle: +(g.input.throttle ?? -1).toFixed(2),
      analog: +(g.input.analog?.throttle ?? -1).toFixed(2),
      wedgeT: +(p._wedgeT ?? -1).toFixed(2),
      lostT: +(p._lostT ?? -1).toFixed(2),
      bogT: +(p._bogT ?? -1).toFixed(2),
      spd: +Math.hypot(p.vel.x, p.vel.z).toFixed(2),
      lat: +(p.lateral ?? 0).toFixed(1),
      idx: p.trackIndex,
    });
  }
  return { state: g.state, trace: trace.filter((_, i) => i % 5 === 0 || i < 12),
    feeds: [...new Set(feeds)].slice(0, 12) };
});
console.log('state', r.state);
console.log('   s  resolvedThr  analog  wedgeT  lostT   bogT   speed    lat   idx');
for (const t of r.trace) {
  console.log(`  ${String(t.s).padStart(3)}  ${String(t.resolvedThrottle).padStart(11)} `
    + `${String(t.analog).padStart(7)} ${String(t.wedgeT).padStart(7)} ${String(t.lostT).padStart(6)} `
    + `${String(t.bogT).padStart(6)} ${String(t.spd).padStart(7)} ${String(t.lat).padStart(6)} ${String(t.idx).padStart(5)}`);
}
console.log('\nfeed messages seen:', JSON.stringify(r.feeds));
await b.close();
