/* CAN YOU SEE THE ROAD FROM THE SEAT? Sampled around a lap, not at the line.
 *
 * The report is a phone screenshot in which the car's own bodywork meets the
 * horizon and there is no road in the frame at all. Every previous measurement
 * of this view was taken parked on the start line, where the answer is always
 * yes — so this drives the car and samples as it goes.
 *
 * Two numbers per sample, both read off the rendered pixels rather than from
 * the scene graph, because what the report is about is what reaches the screen:
 *   interiorFrac  how far up the frame the car's own body reaches, centre column
 *   roadRows      how many rows between the horizon and the interior show road
 * A road you cannot see is roadRows ~ 0, whatever the interior fraction says.
 */
import { chromium } from 'playwright-core';
import { promises as fs } from 'node:fs';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const CAR = process.env.CAR || '';
const LVL = process.env.LEVEL ?? '1';
const N = +(process.env.N ?? 10);
const DIR = process.env.DIR ?? '/tmp';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: 430, height: 830 }, hasTouch: true,
  isMobile: true, deviceScaleFactor: 2 });
const p = await ctx.newPage();
p.setDefaultTimeout(900000);
await p.addInitScript((c) => { window.__CAR = c; }, CAR);
await p.goto(`${BASE}/?level=${LVL}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 900000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 900000 });
await p.evaluate(() => {
  const g = window.__game;
  const want = window.__CAR;
  if (want && g.cars) {
    g.cars.owned = [...new Set([...(g.cars.owned || []), want])];
    g.cars.selected = want;
    g.applyCar?.(want) ?? g._applyCar?.(want);
  }
  g.camMode = g.constructor.DRIVER_MODE;
  g.state = 'race';
});
const sample = async (tag) => p.evaluate((tag) => {
  const g = window.__game;
  const c = g.renderer.domElement;
  if (g.composer) g.composer.render(); else g.renderer.render(g.scene, g.camera);
  const cv = document.createElement('canvas');
  cv.width = c.width; cv.height = c.height;
  cv.getContext('2d').drawImage(c, 0, 0);
  const col = cv.getContext('2d').getImageData(Math.floor(c.width / 2), 0, 1, c.height).data;
  const at = (y) => [col[y * 4], col[y * 4 + 1], col[y * 4 + 2]];
  // walk up from the bottom until three real colour edges have gone by — that
  // is out of the flat-shaded interior and into the world
  let y = c.height - 1, runs = 0;
  for (; y > 1; y--) {
    const a = at(y), b2 = at(y - 1);
    if (Math.abs(a[0] - b2[0]) + Math.abs(a[1] - b2[1]) + Math.abs(a[2] - b2[2]) > 26) {
      if (++runs > 3) break;
    }
  }
  // the horizon: the highest row that is not sky-blue, scanning down from the top
  let hz = 0;
  for (let k = 0; k < y; k++) {
    const [r2, g2, b3] = at(k);
    if (!(b3 > r2 + 12 && b3 > 90)) { hz = k; break; }   // no longer sky
  }
  return { tag, h: c.height, interiorTop: y, hz,
    interiorFrac: +(1 - y / c.height).toFixed(3),
    roadRows: Math.max(0, y - hz),
    roadFrac: +(Math.max(0, y - hz) / c.height).toFixed(3),
    speed: Math.round(Math.hypot(g.player.vel.x, g.player.vel.z) * 3.6),
    png: null };
}, tag);
const out = [];
for (let i = 0; i < N; i++) {
  // drive: full throttle, let the assist steer
  await p.evaluate(() => { const g = window.__game; g.input.throttle = 1; g.input.brake = 0; });
  for (let f = 0; f < 45; f++) await p.evaluate(() => new Promise((r) => requestAnimationFrame(() => r())));
  out.push(await sample(i));
}
console.log(` n  speed  horizon  interiorTop  interior%  road%`);
for (const r of out) {
  console.log(`${String(r.tag).padStart(2)} ${String(r.speed).padStart(6)} ${String(r.hz).padStart(8)} `
    + `${String(r.interiorTop).padStart(12)} ${String((r.interiorFrac * 100).toFixed(1)).padStart(9)} `
    + `${String((r.roadFrac * 100).toFixed(1)).padStart(6)}`);
}
const worst = out.slice().sort((a, c) => a.roadFrac - c.roadFrac)[0];
const avgI = out.reduce((s, r) => s + r.interiorFrac, 0) / out.length;
console.log(`\nworst road band ${(worst.roadFrac * 100).toFixed(1)}% at ${worst.speed} km/h; `
  + `mean interior ${(avgI * 100).toFixed(1)}%`);
await b.close();
