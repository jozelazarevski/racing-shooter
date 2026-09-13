/* THE CAR SHELF AS THE PLAYER SEES IT — the garage tab, at phone width, so the
 * icons are judged at the 148 px they are actually drawn at rather than at the
 * 4x a probe finds convenient. */
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 430, height: 900 }, deviceScaleFactor: 2 });
p.setDefaultTimeout(600000);
await p.goto('http://localhost:8916/?level=1&unlockall=1', { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
await p.evaluate(async () => {
  const g = window.__game;
  g.showMenu();
  document.getElementById('tab-btn-garage')?.click();
  const f = () => new Promise((r) => requestAnimationFrame(r));
  for (let i = 0; i < 60; i++) await f();
});
await p.screenshot({ path: 'tools-scratch/shot-shelf-after.png' });
console.log('wrote tools-scratch/shot-shelf-after.png');
await b.close();
