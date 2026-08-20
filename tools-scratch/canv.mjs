import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
for (const [w, h] of [[430, 800], [430, 932]]) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  p.setDefaultTimeout(600000);
  await p.goto(`${BASE}/?level=12&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
  await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 600000 });
  const r = await p.evaluate(() => {
    const c = document.querySelector('canvas');
    const cs = getComputedStyle(c), bb = c.getBoundingClientRect();
    return { win: [innerWidth, innerHeight], attr: [c.width, c.height],
      css: [cs.width, cs.height], box: [Math.round(bb.width), Math.round(bb.height),
        Math.round(bb.top), Math.round(bb.bottom)],
      dpr: devicePixelRatio, size: window.__game.renderer?.getSize
        ? (() => { const v = new (window.__game.player.pos.constructor)(); return 'n/a'; })() : 'n/a' };
  });
  console.log(`viewport ${w}x${h}: canvas attr ${r.attr}  css ${r.css}  rect ${r.box}  dpr ${r.dpr}`);
  console.log(`   window ${r.win} -> canvas covers ${(r.box[1] / r.win[1] * 100).toFixed(1)}% of the height`);
  await p.close();
}
await b.close();
