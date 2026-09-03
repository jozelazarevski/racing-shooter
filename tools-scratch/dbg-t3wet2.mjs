/* r346 — replicate T3 with the ford guard and stamp each WET toast with
 * position, sample, lateral, and water context. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 480, height: 320 } });
await p.goto(`${BASE}/?level=12&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.player && window.__game.state === 'race',
  undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track, N = t.center.length, pl = g.player;
  g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
  const events = [];
  const hudFeed = g.hud.feed.bind(g.hud);
  g.hud.feed = (txt, cls) => {
    if (/WET|TYRE|TIRE|GRIP|SLICK/i.test(String(txt))) {
      const gi = t.nearestIndex ? t.nearestIndex(pl.pos, null) : -1;
      const c = t.center[gi];
      const fd = (t.fords ?? []).map((f) =>
        Math.min((gi - f.i + N) % N, (f.i - gi + N) % N) * t.segLen);
      events.push({ txt: String(txt), gi,
        lat: +Math.hypot(pl.pos.x - c.x, pl.pos.z - c.z).toFixed(1),
        y: +pl.pos.y.toFixed(1), terr: +t.terrainHeight(pl.pos.x, pl.pos.z).toFixed(1),
        minFordU: +Math.min(...fd, 9999).toFixed(1),
        wet: pl.wetTimer ?? pl._wetT ?? null });
    }
    return hudFeed(txt, cls);
  };
  const fordNear = (i) => (t.fords ?? []).some((f) =>
    Math.min((i - f.i + N) % N, (f.i - i + N) % N) * t.segLen < (f.half ?? 4) + 10);
  const wetVerge = (i) => {
    const v = t.pointAt(i, 13);
    return Math.abs(t.terrainHeight(v.x, v.z) - t.center[i].y) > 3;
  };
  for (let s = 0; s < 30; s++) {
    let idx = (200 + s * 7) % N;
    while (fordNear(idx) || wetVerge(idx)) idx = (idx + 4) % N;
    pl.placeAt(idx, s % 2 ? 0 : 13, true);
    for (let k = 0; k < 60; k++) {
      g.input.analog = { steer: 0, throttle: 1, brake: 0 };
      g.frame();
    }
  }
  return { events, fords: (t.fords ?? []).map((f) => f.i) };
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
