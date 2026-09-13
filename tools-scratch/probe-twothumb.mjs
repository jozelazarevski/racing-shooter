import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
const p = await ctx.newPage();
await p.goto('http://localhost:8901/?level=1&go=1&unlockall=1', { waitUntil: 'load', timeout: 120000 });
await p.waitForFunction(() => window.__game?.player, undefined, { timeout: 180000 });
const r = await p.evaluate(() => {
  document.body.classList.add('two-thumb');
  const out = {};
  for (const id of ['speed-box', 't-brake', 't-drift', 't-mine', 't-shock', 't-nitro', 't-missile', 't-unstuck', 'speedo']) {
    const e = document.getElementById(id);
    if (!e) continue;
    const b = e.getBoundingClientRect();
    out[id] = [Math.round(b.left), Math.round(b.top), Math.round(b.right), Math.round(b.bottom)];
  }
  return out;
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
