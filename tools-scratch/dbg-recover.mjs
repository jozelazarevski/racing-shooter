/* R-RECOVER-01 acceptance: the off-road crawl that used to take 11 s is
 * rescued inside the window, and neither an on-road crawl nor an IDLE
 * off-road car (§3.6c/§3.6d) is touched. */
import { chromium } from 'playwright-core';
const LVL = Number(process.env.LVL ?? 21);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 320, height: 200 } });
p.setDefaultTimeout(600000);
await p.goto(`http://localhost:8901/?level=${LVL}&go=1&unlockall=1`,
  { waitUntil: 'load', timeout: 600000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 600000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track, N = t.center.length;
  g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
  for (let k = 0; k < 500 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  const c = g.player;
  // crawl the car forward at `kmh` at a given lateral, holding throttle,
  // and report how long until a rescue moves it (trackIndex jump / _wedgeT)
  const crawl = (lat, kmh, throttle, secs) => {
    const i0 = Math.round(N * 0.5);
    c.placeAt(i0, lat, true);
    c._wedgeT = 0; c._wedgeIdx = null; c._teleportFrames = 0;
    const v = kmh / 3.6, dt = 1 / 60;
    let fired = null;
    for (let k = 0; k < secs * 60; k++) {
      const tan = t.tan[c.trackIndex];
      c.pos.x += tan.x * v * dt; c.pos.z += tan.z * v * dt;
      c.vel.set(tan.x * v, 0, tan.z * v);
      c.trackIndex = t.nearestIndex(c.pos);
      g.input.analog.throttle = throttle; g.input.analog.steer = 0;
      g.frame();
      if (fired === null && (c._wedgeT ?? 0) >= (window.__DRIVING?.route?.stuckDetectS ?? 2.5)) {
        fired = +(k / 60).toFixed(2);
      }
    }
    return { fired, wedgeT: +(c._wedgeT ?? 0).toFixed(2), bar: c._wedgeBar,
      off: c._wedgeOff, slow: c._wedgeSlow,
      dist: +(t._distToTrack ? t._distToTrack(c.pos.x, c.pos.z) : -1).toFixed(1),
      halfAt: +t.widthAt(c.trackIndex).toFixed(1),
      kmh: Math.round(Math.hypot(c.vel.x, c.vel.z) * 3.6) };
  };
  const halfW = t.widthAt(Math.round(N * 0.5));
  return {
    halfWidth: +halfW.toFixed(1),
    offroadCrawl_throttle: crawl(halfW + 9, 8, 1, 6),   // the reported case
    onroadCrawl_throttle:  crawl(0, 8, 1, 6),           // a slow lap: untouched
    offroadIdle_noThrottle: crawl(halfW + 9, 0, 0, 6),  // parked: untouched (3.6d)
    offroadMoving_throttle: crawl(halfW + 9, 30, 1, 6), // getting somewhere: untouched
  };
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
