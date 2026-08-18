/* IS HALF THE TRACK IN THE DARK? — measured on a PHONE, which is where it was
 * reported and where nothing in this directory had ever looked.
 *
 * `tour.mjs` shoots 800x460 desktop frames and `slab.py` asks whether a frame
 * is ONE colour. Neither catches the reported defect, which is a frame that is
 * half bright road and half near-black ground with a hard straight edge
 * between them: two colours, both present, and the picture unreadable.
 *
 * So this measures DARKNESS, not uniformity: the share of the non-HUD frame
 * under a luminance floor, at 390x844 with touch emulation on so the phone
 * layout is the one being photographed.
 */
import { chromium, devices } from 'playwright-core';
import fs from 'node:fs';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8920';
const OUT = process.env.OUT ?? '';
const FLOOR = Number(process.env.FLOOR ?? 30);
const SHOTS = Number(process.env.SHOTS ?? 4);
const STEP = Number(process.env.STEP ?? 300);
if (OUT) fs.mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
page.setDefaultTimeout(600000);
const rows = [];
for (const id of process.argv.slice(2)) {
  await page.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
  const ok = await page.waitForFunction(() => window.__game?.track?.center && window.__game.player,
    undefined, { timeout: 600000 }).then(() => 1).catch(() => 0);
  if (!ok) { console.log(`${id} SKIP`); continue; }
  await page.evaluate(() => {
    const g = window.__game;
    g.clock.getDelta = () => 1 / 60;
    g.__realRender = g.composer.render.bind(g.composer);
    g.composer.render = () => { if (g.__want) g.__realRender(); };
    g.__drive = (n) => {
      const t = g.track, N = t.center.length, p = g.player;
      for (let k = 0; k < n; k++) {
        const v = Math.abs(p.speedAlong ?? 0);
        const aim = t.center[(p.trackIndex + Math.round(6 + v * 0.45)) % N];
        let want = Math.atan2(aim.x - p.pos.x, aim.z - p.pos.z) - p.heading;
        while (want > Math.PI) want -= 2 * Math.PI;
        while (want < -Math.PI) want += 2 * Math.PI;
        const s = Math.max(-1, Math.min(1, want * 2));
        g.input.analog.steer = s;
        g.input.analog.throttle = Math.max(0.35, 1 - Math.abs(s) * 0.8);
        g.frame();
      }
    };
    // MEASURE THE RENDER, NOT THE PAGE. Reading the canvas straight avoids
    // paying for a PNG per sample and keeps the HUD out of it by construction.
    g.__dark = (floor) => {
      const cv = g.renderer.domElement;
      const t = document.createElement('canvas');
      t.width = Math.min(300, cv.width); t.height = Math.round(t.width * cv.height / cv.width);
      const c2 = t.getContext('2d');
      c2.drawImage(cv, 0, 0, t.width, t.height);
      const px = c2.getImageData(0, 0, t.width, t.height).data;
      let dark = 0, n = 0, rowsDark = [];
      for (let y = 0; y < t.height; y++) {
        let d = 0;
        for (let x = 0; x < t.width; x++) {
          const i = (y * t.width + x) * 4;
          const L = 0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2];
          if (L < floor) { dark++; d++; }
          n++;
        }
        rowsDark.push(d / t.width);
      }
      // the WORST BAND: the darkest run of 20% of the frame's height, which is
      // what a slab across the road looks like and a scattering of shadow does
      // not
      const band = Math.max(1, Math.round(t.height * 0.2));
      let best = 0, sum = 0;
      for (let y = 0; y < rowsDark.length; y++) {
        sum += rowsDark[y];
        if (y >= band) sum -= rowsDark[y - band];
        if (y >= band - 1) best = Math.max(best, sum / band);
      }
      return { dark: dark / n, band: best };
    };
  });
  let worst = { dark: 0, band: 0, s: 0 }, name = '?';
  for (let s = 0; s < SHOTS; s++) {
    const r = await page.evaluate(([n, floor]) => {
      const g = window.__game;
      g.__drive(n);
      g.__want = 1; g.frame(); g.__want = 0;
      return { name: g.track.level?.name ?? '?', ...g.__dark(floor) };
    }, [STEP, FLOOR]);
    name = r.name;
    if (r.band > worst.band) worst = { dark: r.dark, band: r.band, s: s + 1 };
    if (OUT) await page.screenshot({ path: `${OUT}/L${String(id).padStart(2, '0')}-p${(s + 1) * 5}s.png` });
  }
  rows.push({ id, name, ...worst });
  console.log(`${String(id).padStart(2)} ${name.padEnd(20)} darkest 20% band ${(worst.band * 100).toFixed(1)}%`
    + `   whole frame ${(worst.dark * 100).toFixed(1)}%   (t=${worst.s * 5}s)`);
}
rows.sort((a, c) => c.band - a.band);
console.log('\n===== WORST BANDS =====');
for (const r of rows.slice(0, 12)) {
  console.log(`  ${(r.band * 100).toFixed(1).padStart(5)}%  L${String(r.id).padStart(2, '0')} ${r.name}`);
}
await b.close();
