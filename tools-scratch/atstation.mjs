/* SHOOT NAMED STATIONS, so the same place can be compared across builds.
 * Station-picking probes choose different targets on each build once the build
 * has changed, which makes a before/after of two different places. */
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8901';
const ID = Number(process.env.ID ?? 4);
const STATIONS = (process.env.ST ?? '820,857,368').split(',').map(Number);
const OUT = process.env.OUT ?? '/tmp/atstation';
fs.mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2, isMobile: true, hasTouch: true });
page.setDefaultTimeout(600000);
await page.goto(`${BASE}/?level=${ID}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await page.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 600000 });
await page.evaluate(() => {
  const g = window.__game;
  const CN = g.constructor.CAM_NAMES ?? [];
  const ci = CN.indexOf('TOP-DOWN'); if (ci >= 0) g.camMode = ci;
  g.clock.getDelta = () => 1 / 60;
  g._autoQuality = () => {};
  window.__real = g.composer.render.bind(g.composer);
  g.composer.render = () => {};
  for (let f = 0; f < 400 && g.state !== 'race'; f++) g.frame();
});
for (const j of STATIONS) {
  await page.evaluate((k) => {
    const g = window.__game, t = g.track, p = g.player;
    const c = t.center[k];
    for (let f = 0; f < 30; f++) {
      p.pos.set(c.x, c.y + 0.6, c.z);
      p.speed = 2; p.trackIndex = k; p.heading = t.headingAt(k);
      p.vel?.set?.(0, 0, 0);
      g.frame();
    }
    window.__real();
  }, j);
  await page.screenshot({ path: `${OUT}/L${ID}-i${j}.png` });
}
await b.close();
