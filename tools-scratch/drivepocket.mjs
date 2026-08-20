/* DRIVE TO THE PLACES WHERE THE WALL CAP WAS FLOORED, AND PHOTOGRAPH THEM.
 *
 * Teleporting there does not work: during the countdown the car is put back on
 * its grid box every frame, so the shot is of the start line and the probe
 * says nothing about the place it claims to show. Drive instead, watch
 * `trackIndex`, and fire the shutter when the car reaches each target station.
 *
 * Phone viewport and TOP-DOWN, because that is the camera the report came from
 * and the defect is about what can be seen from it.
 */
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8901';
const ID = Number(process.env.ID ?? 4);
const OUT = process.env.OUT ?? '/tmp/pockets';
fs.mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2, isMobile: true, hasTouch: true });
page.setDefaultTimeout(600000);
await page.goto(`${BASE}/?level=${ID}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await page.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 600000 });
const targets = await page.evaluate(() => {
  const g = window.__game, t = g.track, N = t.center.length;
  const CN = g.constructor.CAM_NAMES ?? [];
  const ci = CN.indexOf('TOP-DOWN');
  if (ci >= 0) g.camMode = ci;
  g.clock.getDelta = () => 1 / 60;
  g._autoQuality = () => {};
  window.__real = g.composer.render.bind(g.composer);
  g.composer.render = () => {};
  if (!t._cliffCap) return [];
  const WALL_OFF = 10.4;
  const hit = [];
  for (let j = 0; j < N; j++) {
    const tt = j * (Math.PI * 2 / N);
    for (let s = 0; s < 2; s++) {
      const side = s ? -1 : 1, ph = side * 2.13;
      const raw = WALL_OFF + 0.65 + (t.T.cliffSetback ?? 0)
        + 0.24 * (Math.sin(31 * tt + 2.2 + ph) + 1);
      if (t._cliffCap[j * 2 + s] < raw - 1e-6) { hit.push(j); break; }
    }
  }
  const runs = [];
  let cur = null;
  for (const j of hit) {
    if (cur && j - cur.to <= 4) { cur.to = j; cur.n++; }
    else { cur = { from: j, to: j, n: 1 }; runs.push(cur); }
  }
  return runs.filter((r) => r.n >= 8).sort((a, x) => x.n - a.n).slice(0, 4)
    .map((r) => Math.round((r.from + r.to) / 2));
});
console.log(`L${ID} targets: ${JSON.stringify(targets)}`);
const want = new Set(targets);
for (let chunk = 0; chunk < 500 && want.size; chunk++) {
  const at = await page.evaluate((tg) => {
    const g = window.__game, p = g.player;
    for (let f = 0; f < 30; f++) {
      g.input.analog.throttle = 1;
      g.frame();
      for (const j of tg) {
        if (Math.abs(p.trackIndex - j) <= 4) { window.__real(); return j; }
      }
    }
    return null;
  }, [...want]);
  if (at != null) {
    await page.screenshot({ path: `${OUT}/drive-L${ID}-i${at}.png` });
    want.delete(at);
    console.log(`  shot at ${at}`);
  }
}
console.log(want.size ? `  never reached: ${[...want]}` : '  all targets photographed');
await b.close();
