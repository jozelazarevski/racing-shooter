/* DOES A QUALITY CHANGE LEAVE THE CANVAS BLANK?
 *
 * The sweep caught 52 frames of pure page background with a live HUD over
 * them, every one carrying "AUTO QUALITY n/3" — but it ran four browsers on
 * four cores, and neither the stubbed nor the unstubbed harness reproduces it
 * on a quiet machine. So the question is not "is the harness lying" but "what
 * does a quality change do to the frame that is already on screen", which is
 * answerable directly and does not need a starved CPU.
 *
 * Render, then apply the resize `_autoQuality` applies, then read the canvas
 * WITHOUT rendering again — which is exactly the window a screenshot, or a
 * browser composite, can land in.
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8920';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 800, height: 460 } });
page.setDefaultTimeout(600000);
await page.goto(`${BASE}/?level=3&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await page.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 600000 });
const r = await page.evaluate(() => {
  const g = window.__game;
  g.clock.getDelta = () => 1 / 60;
  const lit = () => {
    const cv = g.renderer.domElement;
    const c = document.createElement('canvas');
    c.width = cv.width; c.height = cv.height;
    c.getContext('2d').drawImage(cv, 0, 0);
    const px = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let on = 0, n = 0;
    for (let i = 0; i < px.length; i += 4) {
      if (px[i + 3] > 8 && px[i] + px[i + 1] + px[i + 2] > 12) on++;
      n++;
    }
    return +(on / n * 100).toFixed(1);
  };
  for (let k = 0; k < 60; k++) { g.input.analog.throttle = 1; g.frame(); }
  const out = {};
  out.beforeAnything = lit();
  // the q=1 branch, verbatim
  const baseDpr = Math.min(devicePixelRatio, g.isTouch ? 1.75 : 2);
  g.renderer.setPixelRatio(baseDpr * 0.75);
  g.composer.setSize(innerWidth, innerHeight);
  out.afterResizeNoRender = lit();
  g.composer.render();
  out.afterOneRender = lit();
  // and the q=3 branch, which also resizes
  g.bloom.enabled = false;
  g.renderer.setPixelRatio(Math.min(baseDpr, 1));
  g.composer.setSize(innerWidth, innerHeight);
  out.afterQ3ResizeNoRender = lit();
  g.composer.render();
  out.afterQ3OneRender = lit();
  return out;
});
console.log(JSON.stringify(r, null, 1));
await b.close();
