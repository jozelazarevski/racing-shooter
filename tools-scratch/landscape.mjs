/* DOES THE GAME FILL THE SCREEN IN LANDSCAPE? Reported from a phone held
 * sideways: a green band down each edge, which is `body`'s background showing
 * past the canvas.
 *
 * Reports the visual viewport, the canvas's box and its drawing buffer, and
 * the HUD boxes that overlap each other — in landscape the touch controls are
 * laid out for a tall screen and land on top of the panels.
 *
 *   node landscape.mjs
 */
import { chromium } from 'playwright-core';
const SIZES = (process.env.SIZES ?? 'iphone-landscape,phone-portrait').split(',').map((n) => ({
  'iphone-landscape': ['iphone-landscape', 874, 402, 3],
  'small-landscape': ['small-landscape', 740, 360, 3],
  'ipad-landscape': ['ipad-landscape', 1180, 820, 2],
  'phone-portrait': ['phone-portrait', 402, 874, 3],
}[n]));
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
let bad = 0;
for (const [name, w, h, dpr] of SIZES) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr,
    hasTouch: true, isMobile: true });
  const p = await ctx.newPage();
  p.setDefaultTimeout(600000);
  await p.goto('http://localhost:8901/?level=1&go=1&unlockall=1', { waitUntil:'load', timeout:600000 });
  await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
  await p.evaluate(async () => {
    const g = window.__game; g.startRace?.();
    const f = () => new Promise((r) => requestAnimationFrame(r));
    for (let i = 0; i < 600 && g.state !== 'race'; i++) await f();
    for (let i = 0; i < 40; i++) await f();
  });
  const res = await p.evaluate(() => {
    const c = document.getElementById('game-canvas');
    const r = c.getBoundingClientRect();
    const g = window.__game;
    // every visible HUD box, so overlaps can be counted rather than squinted at
    // `#joy-zone` is the invisible TOUCH REGION — 52% of the screen by
    // design, and every button is meant to sit on top of it. Counting it as a
    // box made the report all false positives. `#joy-base` is the ring you can
    // actually see, and that is what must not land on a panel.
    const boxes = [...document.querySelectorAll('#hud .panel, #touch-ui .tbtn, #joy-base, #speedo, #t-nitro, #t-drift')]
      .filter((e) => e.offsetParent !== null)
      .map((e) => ({ id: e.id || e.className, b: e.getBoundingClientRect() }));
    const hit = [];
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i].b, d = boxes[j].b;
      const ov = Math.max(0, Math.min(a.right, d.right) - Math.max(a.left, d.left))
        * Math.max(0, Math.min(a.bottom, d.bottom) - Math.max(a.top, d.top));
      if (ov > 200) hit.push(`${boxes[i].id} x ${boxes[j].id} = ${Math.round(ov)}px2`);
    }
    return { inner: [innerWidth, innerHeight],
      visual: [Math.round(visualViewport.width), Math.round(visualViewport.height)],
      canvasBox: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)],
      canvasAttr: [c.width, c.height],
      fillsWidth: Math.abs(r.width - innerWidth) < 1 && Math.abs(r.left) < 1,
      fov: +g.camera.fov.toFixed(1), aspect: +g.camera.aspect.toFixed(2),
      overlaps: hit };
  });
  if (!res.fillsWidth || res.overlaps.length) bad++;
  console.log(`${(!res.fillsWidth || res.overlaps.length) ? 'FAIL' : 'PASS'} ${name} `
    + JSON.stringify({ canvas: res.canvasBox, fills: res.fillsWidth, overlaps: res.overlaps }));
  await p.screenshot({ path: `tools-scratch/shot-land-${name}.png` });
  await ctx.close();
}
console.log(bad ? `FAIL: ${bad} layout faults` : 'PASS: no visible overlaps, canvas fills');
await b.close();
process.exit(bad ? 0 + bad : 0);
