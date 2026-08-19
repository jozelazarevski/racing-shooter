/* WHICH AUTO-QUALITY TIER BLANKS THE SCREEN?
 *
 * The sweep caught 52 frames across the roster showing the EXACT page
 * background (#7fb85c) over 30-45% of the frame, with the HUD drawn normally
 * on top and the car driving at speed — most reliably right after the lights
 * go out. That colour cannot come out of a render; it is `html,body{background}`
 * showing through a canvas that drew nothing. Every one of those frames also
 * carries "AUTO QUALITY n/3".
 *
 * `_autoQuality` only fires when measured fps drops under 26, which is a
 * condition a swiftshader harness meets constantly and a phone meets sometimes.
 * So rather than wait for it, each tier is applied DIRECTLY and the frame is
 * measured — background share, and the canvas's own backing-store size against
 * the composer's, which is the thing q=1 changes.
 */
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8920';
const OUT = process.env.OUT ?? '';
if (OUT) fs.mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 800, height: 460 } });
page.setDefaultTimeout(600000);
for (const id of process.argv.slice(2)) {
  await page.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
  await page.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 600000 });
  const rows = await page.evaluate(() => {
    const g = window.__game;
    g.clock.getDelta = () => 1 / 60;
    const bgOf = () => {
      const cv = g.renderer.domElement;
      const c = document.createElement('canvas');
      c.width = cv.width; c.height = cv.height;
      c.getContext('2d').drawImage(cv, 0, 0);
      const px = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      // the canvas itself is transparent where nothing drew — count that, and
      // separately count the page colour in a composited screenshot
      let clear = 0, n = 0;
      for (let i = 0; i < px.length; i += 4) { if (px[i + 3] < 8) clear++; n++; }
      return { clear: +(clear / n * 100).toFixed(1) };
    };
    const sizes = () => {
      const cv = g.renderer.domElement;
      const rt = g.composer.renderTarget1;
      return { canvas: [cv.width, cv.height],
        css: [Math.round(cv.getBoundingClientRect().width), Math.round(cv.getBoundingClientRect().height)],
        target: rt ? [rt.width, rt.height] : null,
        rendererDpr: +g.renderer.getPixelRatio().toFixed(3),
        composerDpr: +(g.composer._pixelRatio ?? -1).toFixed(3) };
    };
    const out = [];
    for (let q = 0; q <= 3; q++) {
      if (q > 0) { g._quality = q - 1; g._fpsWin = performance.now() - 5000; g._fpsN = 1; g._autoQuality(); }
      for (let k = 0; k < 20; k++) { g.input.analog.throttle = 1; g.frame(); }
      out.push({ q, ...sizes(), ...bgOf() });
    }
    return out;
  });
  console.log(`\n=== level ${id} ===`);
  for (const r of rows) {
    console.log(`  q=${r.q}  canvas ${JSON.stringify(r.canvas)}  css ${JSON.stringify(r.css)}  `
      + `composer target ${JSON.stringify(r.target)}  dpr renderer ${r.rendererDpr} / composer ${r.composerDpr}  `
      + `transparent ${r.clear}%`);
    if (OUT) await page.screenshot({ path: `${OUT}/L${String(id).padStart(2, '0')}-q${r.q}.png` });
  }
}
await b.close();
