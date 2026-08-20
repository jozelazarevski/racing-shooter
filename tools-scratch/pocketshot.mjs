/* PHOTOGRAPH THE PLACES WHERE ONE LEG'S WALL STANDS IN ANOTHER'S.
 *
 * `_cliffCap[j*2+s]` holds the capped setback; the analytic formula in
 * `_cliffProfile` gives what it WOULD have been. Where the two differ, the cap
 * bound — the lap came back past that station and the wall had to be pulled
 * in. Where it was pulled all the way to the floor, it could not be pulled far
 * enough, and the neighbouring leg's rock is in this leg's view.
 *
 * (My first pass at this compared the CAPPED base to the floor, which on a
 * slot canyon is a no-op the builder's own comment warns about — it reported
 * 125 floored sides on GLACIAL PASS, a world whose counter says 0. Read the
 * uncapped formula, or read nothing.)
 *
 * Park at the middle of each such run, phone-shaped, TOP-DOWN — the camera the
 * report came from — and save the frame.
 */
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8901';
const IDS = (process.env.IDS ?? '4,10,27,44').split(',').map(Number);
const OUT = process.env.OUT ?? '/tmp/pockets';
fs.mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2, isMobile: true, hasTouch: true });
page.setDefaultTimeout(600000);
for (const id of IDS) {
  await page.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
  await page.waitForFunction(() => window.__game?.track?.center && window.__game.player,
    undefined, { timeout: 600000 });
  const spots = await page.evaluate(() => {
    const g = window.__game, t = g.track, N = t.center.length;
    if (!t.T.cliffWalls || !t._cliffCap) return [];
    const WALL_OFF = 10.4, CLEAR = 2.3;
    const hit = [];
    for (let j = 0; j < N; j++) {
      const tt = (j % N) * (Math.PI * 2 / N);
      for (let s = 0; s < 2; s++) {
        const side = s ? -1 : 1, ph = side * 2.13;
        const raw = WALL_OFF + 0.65 + (t.T.cliffSetback ?? 0)
          + 0.24 * (Math.sin(31 * tt + 2.2 + ph) + 1);
        const got = t._cliffCap[j * 2 + s];
        if (got < raw - 1e-6) hit.push({ j, side, pulled: +(raw - got).toFixed(2),
          floored: got <= t.widthAt(j) + CLEAR + 1e-6 });
      }
    }
    const runs = [];
    let cur = null;
    for (const h of hit) {
      if (cur && h.j - cur.to <= 4) { cur.to = h.j; cur.n++; cur.pull = Math.max(cur.pull, h.pulled); cur.fl = cur.fl || h.floored; }
      else { cur = { from: h.j, to: h.j, n: 1, pull: h.pulled, fl: h.floored }; runs.push(cur); }
    }
    return runs.sort((a, x) => x.pull - a.pull).slice(0, 3)
      .map((r) => ({ ...r, mid: Math.round((r.from + r.to) / 2) }));
  });
  console.log(`L${id}: ${JSON.stringify(spots)}`);
  for (const sp of spots) {
    await page.evaluate((i) => {
      const g = window.__game, t = g.track, p = g.player;
      const CN = g.constructor.CAM_NAMES ?? [];
      const ci = CN.indexOf('TOP-DOWN');
      if (ci >= 0) g.camMode = ci;
      g.clock.getDelta = () => 1 / 60;
      g._autoQuality = () => {};
      const c = t.center[i];
      for (let k = 0; k < 40; k++) {
        p.pos.set(c.x, c.y + 0.8, c.z);
        p.speed = 2; p.trackIndex = i; p.heading = t.headingAt(i);
        g.frame();
      }
    }, sp.mid);
    await page.screenshot({ path: `${OUT}/L${id}-i${sp.mid}${sp.fl ? '-FLOORED' : ''}.png` });
  }
}
await b.close();
