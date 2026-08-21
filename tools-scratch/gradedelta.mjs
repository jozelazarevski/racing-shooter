/* WHAT DOES THE GRADE PIVOT CHANGE COST EVERY OTHER WORLD?
 *
 * Fixing the pivot is a change to the one shader every frame of every world
 * goes through, so "it fixed the dark one" is not the whole answer. Measure
 * the blast radius: park the car at the SAME four stations on each world,
 * point it along the road, and read mean frame luminance, the darkest decile
 * (which is the shadow detail the old pivot was crushing), and saturation.
 *
 * Run against two servers — one pristine, one patched — and diff. Parked, not
 * driven: a driven comparison scores two different races and the scene
 * difference swamps the grade difference. Same station, same heading, same
 * frame count, both sides.
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8901';
const IDS = (process.env.IDS ?? '18').split(',').map(Number);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 480, height: 280 } });
page.setDefaultTimeout(600000);
for (const id of IDS) {
  await page.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
  await page.waitForFunction(() => window.__game?.track?.center && window.__game.player,
    undefined, { timeout: 600000 });
  const r = await page.evaluate(async () => {
    const g = window.__game, t = g.track, p = g.player;
    const CN = g.constructor.CAM_NAMES ?? [];
    const ci = CN.indexOf('CHASE'); if (ci >= 0) g.camMode = ci;
    g.clock.getDelta = () => 1 / 60;
    g._autoQuality = () => {};
    const real = g.composer.render.bind(g.composer);
    g.composer.render = () => {};
    const N = t.center.length;
    const outs = [];
    for (const frac of [0.1, 0.35, 0.6, 0.85]) {
      const i = Math.floor(N * frac);
      const c = t.center[i];
      for (let k = 0; k < 30; k++) {
        p.pos.set(c.x, c.y + 1.0, c.z);
        p.speed = 0; p.vel?.set?.(0, 0, 0);
        p.trackIndex = i; p.heading = t.headingAt(i);
        g.frame();
      }
      real();
      const cv = g.renderer.domElement;
      const cc = document.createElement('canvas');
      cc.width = cv.width; cc.height = cv.height;
      cc.getContext('2d').drawImage(cv, 0, 0);
      const px = cc.getContext('2d').getImageData(0, 0, cc.width, cc.height).data;
      const L = [];
      let sat = 0, n = 0;
      for (let q = 0; q < px.length; q += 4) {
        L.push(px[q] * 0.299 + px[q + 1] * 0.587 + px[q + 2] * 0.114);
        const mx = Math.max(px[q], px[q + 1], px[q + 2]);
        const mn = Math.min(px[q], px[q + 1], px[q + 2]);
        sat += mx ? (mx - mn) / mx : 0; n++;
      }
      L.sort((a, x) => a - x);
      outs.push({ mean: L.reduce((a, x) => a + x, 0) / L.length,
        p10: L[(L.length * 0.1) | 0], sat: sat / n });
    }
    g.composer.render = real;
    const med = (a) => a.slice().sort((x, y) => x - y)[a.length >> 1];
    return { name: g.level?.name,
      mean: +med(outs.map((o) => o.mean)).toFixed(1),
      p10: +med(outs.map((o) => o.p10)).toFixed(1),
      sat: +med(outs.map((o) => o.sat)).toFixed(3) };
  });
  console.log(JSON.stringify({ id, ...r }));
}
await b.close();
