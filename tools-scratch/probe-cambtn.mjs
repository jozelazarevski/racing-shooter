import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
const p = await ctx.newPage();
await p.goto('http://localhost:8901/?level=1&go=1&unlockall=1', { waitUntil: 'load', timeout: 120000 });
await p.waitForFunction(() => window.__game?.player, undefined, { timeout: 180000 });
const r = await p.evaluate(() => {
  const g = window.__game;
  const b = document.getElementById('cam-btn');
  const rect = b.getBoundingClientRect();
  const before = g.camMode;
  b.click();
  const after1 = g.camMode;
  b.click();
  const after2 = g.camMode;
  const pause = document.getElementById('pause-btn').getBoundingClientRect();
  const clash = !(rect.bottom < pause.top || rect.top > pause.bottom
    || rect.right < pause.left || rect.left > pause.right);
  return { rect: [Math.round(rect.left), Math.round(rect.top), Math.round(rect.right), Math.round(rect.bottom)],
    before, after1, after2, clash, paused: g.paused ?? g.state };
});
console.log(JSON.stringify(r));
await browser.close();
