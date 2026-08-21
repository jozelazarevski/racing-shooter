/* THE TIGHTEST CORNERS, FROM THE CAMERA THE REPORT USED.
 *
 * The reported frame is a circular bowl of banded rock with a sandy floor and
 * the car crawling at 2 km/h in the middle of it. A cliff ribbon wrapped round
 * a very tight hairpin IS a cylinder, and from TOP-DOWN a cylinder is a bowl —
 * so the tightest corners are where to look. `vehicles.js` already names one:
 * "ROCKFALL RAVINE's tightest corner (5.6 m, between cliff walls)".
 *
 * Teleport only AFTER the countdown — `g.state === 'race'` — because until
 * then the car is replaced on its grid box every frame and the shot is of the
 * start line no matter which station was asked for.
 */
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8901';
const IDS = (process.env.IDS ?? '4,10').split(',').map(Number);
const OUT = process.env.OUT ?? '/tmp/hairpins';
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
    const CN = g.constructor.CAM_NAMES ?? [];
    const ci = CN.indexOf('TOP-DOWN'); if (ci >= 0) g.camMode = ci;
    g.clock.getDelta = () => 1 / 60;
    g._autoQuality = () => {};
    window.__real = g.composer.render.bind(g.composer);
    g.composer.render = () => {};
    // run the countdown out so a teleport will stick
    for (let f = 0; f < 400 && g.state !== 'race'; f++) { g.frame(); }
    const k = [];
    for (let j = 0; j < N; j++) k.push({ j, c: t.curvature?.[j] ?? 0 });
    k.sort((a, x) => x.c - a.c);
    const picked = [];
    for (const q of k) {
      if (picked.some((p2) => Math.min(Math.abs(p2 - q.j), N - Math.abs(p2 - q.j)) < 25)) continue;
      picked.push(q.j);
      if (picked.length >= 4) break;
    }
    return picked.map((j) => ({ j, radius: +(1 / Math.max(t.curvature[j], 1e-6)).toFixed(1) }));
  });
  console.log(`L${id} tightest: ${JSON.stringify(spots)}`);
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
    await page.screenshot({ path: `${OUT}/L${id}-hairpin${sp.j}-r${sp.radius}.png` });
  }
}
await b.close();
