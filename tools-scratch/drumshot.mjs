/* PHOTOGRAPH THE STATIONS THE TAPER ACTUALLY CHANGES.
 *
 * Shooting the tightest-curvature corners was the wrong target: at ROCKFALL
 * RAVINE's tightest corner the cap does not bind, so before and after were the
 * same picture and the comparison said nothing. Ask instead for the stations
 * where `_cliffCap` pulled the base furthest below its natural value — those
 * are precisely the ones whose height the taper touches — and shoot those.
 */
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8901';
const ID = Number(process.env.ID ?? 10);
const OUT = process.env.OUT ?? '/tmp/drums';
fs.mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2, isMobile: true, hasTouch: true });
page.setDefaultTimeout(600000);
await page.goto(`${BASE}/?level=${ID}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await page.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 600000 });
const spots = await page.evaluate(() => {
  const g = window.__game, t = g.track, N = t.center.length;
  const CN = g.constructor.CAM_NAMES ?? [];
  const ci = CN.indexOf('TOP-DOWN'); if (ci >= 0) g.camMode = ci;
  g.clock.getDelta = () => 1 / 60;
  g._autoQuality = () => {};
  window.__real = g.composer.render.bind(g.composer);
  g.composer.render = () => {};
  for (let f = 0; f < 400 && g.state !== 'race'; f++) g.frame();
  const WALL_OFF = 10.4;
  const rows = [];
  for (let j = 0; j < N; j++) {
    const tt = j * (Math.PI * 2 / N);
    let worstFrac = 1;
    for (let s = 0; s < 2; s++) {
      const side = s ? -1 : 1, ph = side * 2.13;
      const raw = WALL_OFF + 0.65 + (t.T.cliffSetback ?? 0)
        + 0.24 * (Math.sin(31 * tt + 2.2 + ph) + 1);
      const frac = t._cliffCap[j * 2 + s] / raw;
      if (frac < worstFrac) worstFrac = frac;
    }
    rows.push({ j, frac: worstFrac });
  }
  rows.sort((a, x) => a.frac - x.frac);
  const picked = [];
  for (const q of rows) {
    if (picked.some((p2) => Math.min(Math.abs(p2.j - q.j), N - Math.abs(p2.j - q.j)) < 30)) continue;
    picked.push(q);
    if (picked.length >= 3) break;
  }
  return picked.map((q) => ({ j: q.j, frac: +q.frac.toFixed(2) }));
});
console.log(`L${ID} most-capped: ${JSON.stringify(spots)}`);
for (const sp of spots) {
  await page.evaluate((j) => {
    const g = window.__game, t = g.track, p = g.player;
    const c = t.center[j];
    for (let f = 0; f < 30; f++) {
      p.pos.set(c.x, c.y + 0.6, c.z);
      p.speed = 2; p.trackIndex = j; p.heading = t.headingAt(j);
      p.vel?.set?.(0, 0, 0);
      g.frame();
    }
    window.__real();
  }, sp.j);
  await page.screenshot({ path: `${OUT}/L${ID}-i${sp.j}.png` });
}
await b.close();
