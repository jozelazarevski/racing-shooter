/* THE DRIVER'S VIEW, AT A REAL PHONE ASPECT.
 *
 * Reported again from a phone: the lower two thirds of the frame is black.
 * The seat was tuned on a 540x900 probe and a phone is taller than that — a
 * fixed-height dash at a fixed distance covers a share of the frame that
 * depends entirely on the VERTICAL field of view, and vertical FOV is what
 * changes when the aspect gets narrower. So this measures the thing that was
 * reported: what fraction of the frame is interior, at the aspect it was
 * reported at.
 */
import { chromium } from 'playwright-core';
import { promises as fs } from 'node:fs';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const OUT = process.env.OUT ?? '/tmp/seat.png';
const W = +(process.env.W ?? 430), H = +(process.env.H ?? 830);
const LVL = process.env.LEVEL ?? '1';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: W, height: H }, hasTouch: true,
  isMobile: true, deviceScaleFactor: 2 });
const p = await ctx.newPage();
p.setDefaultTimeout(600000);
const errs = [];
p.on('pageerror', (e) => errs.push(String(e.message)));
await p.addInitScript((c) => { window.__CAR = c; }, process.env.CAR || '');
await p.goto(`${BASE}/?level=${LVL}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 600000 });
const info = await p.evaluate(async (tune) => {
  const g = window.__game;
  // CAR is the point of this probe: the cockpit is built from the car's own
  // cab dimensions, so "the seat looks fine" is only ever a claim about the
  // car it was measured on.
  const want = window.__CAR;
  if (want && g.cars) {
    g.cars.owned = [...new Set([...(g.cars.owned || []), want])];
    g.cars.selected = want;
    g.applyCar?.(want) ?? g._applyCar?.(want);
  }
  g.camMode = window.__game.constructor.DRIVER_MODE;
  if (tune) Object.assign(g._driverTune, JSON.parse(tune));
  g.state = 'race';
  return { mode: g.camMode, tune: { ...g._driverTune } };
}, process.env.TUNE || '');
// let the camera settle into the seat over real frames
for (let f = 0; f < 30; f++) await p.evaluate(() => new Promise((r) => requestAnimationFrame(() => r())));
const shot = await p.evaluate(() => {
  const g = window.__game;
  const c = g.renderer.domElement;
  // SAME TICK. Without a render immediately before the read the drawing buffer
  // has already been composited and cleared, and `toDataURL` hands back a
  // blank page — which is exactly what the first run of this probe returned.
  // (hillshot.mjs carries the same note for the same reason.)
  if (g.composer) g.composer.render(); else g.renderer.render(g.scene, g.camera);
  const png = c.toDataURL('image/png');
  // WHAT FRACTION OF THE FRAME IS INTERIOR? Read the pixels down the CENTRE
  // column, which is the one the driver is looking along, and find the highest
  // row from the bottom that is still bodywork. A colour test would need to
  // know the trim colour; a "same as the row below it, all the way down"
  // test does not.
  // How far up the frame does the car's own bodywork reach? Read the centre
  // column of pixels from the bottom and walk up while the colour keeps
  // matching the row below it within a tolerance — interior is flat-shaded
  // and the world is not. Reported as a FRACTION, which is the thing that
  // changes with aspect and the thing the complaint was about.
  const g2 = document.createElement('canvas');
  g2.width = c.width; g2.height = c.height;
  const cx2 = g2.getContext('2d');
  cx2.drawImage(c, 0, 0);
  const col = cx2.getImageData(Math.floor(c.width / 2), 0, 1, c.height).data;
  const at = (y) => [col[y * 4], col[y * 4 + 1], col[y * 4 + 2]];
  let y = c.height - 1, runs = 0;
  for (; y > 1; y--) {
    const a = at(y), b2 = at(y - 1);
    const d = Math.abs(a[0] - b2[0]) + Math.abs(a[1] - b2[1]) + Math.abs(a[2] - b2[2]);
    if (d > 26) { runs++; if (runs > 3) break; }   // three real edges = we are out
  }
  return { png, w: c.width, h: c.height,
    interiorTop: y, interiorFrac: +(1 - y / c.height).toFixed(3),
    near: g.camera.near, fov: +g.camera.fov.toFixed(1),
    aspect: +g.camera.aspect.toFixed(3),
    tune: { ...(g._driverTune || {}) },
    car: g.cars?.selected };
});
await fs.writeFile(OUT, Buffer.from(shot.png.split(',')[1], 'base64'));
delete shot.png;
console.log(OUT, JSON.stringify({ ...info, ...shot }), errs.length ? 'ERR ' + errs[0] : '');
await b.close();
