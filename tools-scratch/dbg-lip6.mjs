import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 640, height: 400 } });
await p.goto('http://localhost:8901/?level=12&go=1&unlockall=1', { waitUntil: 'load', timeout: 120000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 90000 });
const r = await p.evaluate(() => {
  const t = window.__game.track;
  const src = t._slopeRock.toString();
  return src.slice(-1400);
});
console.log(r);
await b.close();
