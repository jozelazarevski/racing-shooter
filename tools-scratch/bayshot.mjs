import { chromium } from 'playwright-core';
const W = +(process.env.W ?? 390);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: W, height: 830 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
const p = await ctx.newPage(); p.setDefaultTimeout(600000);
await p.goto('http://localhost:8901/?level=1', { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
await p.evaluate(() => { const g = window.__game; g.garage.credits = 6400;
  g.showMenu(); document.getElementById('tab-btn-garage').click();
  g._buildOpen = 'engine'; g.renderGarage(); });
await p.evaluate(() => new Promise(r => { let n=0; const f=()=>(++n>6?r():requestAnimationFrame(f)); requestAnimationFrame(f); }));
await p.evaluate(() => { const el = document.getElementById('build-bay');
  const s = document.getElementById('title-screen');
  s.scrollTop += el.getBoundingClientRect().top - 60; });
await p.screenshot({ path: 'tools-scratch/shot-buildbay.png' });
console.log('build-bay height: ' + await p.evaluate(() =>
  Math.round(document.getElementById('build-bay').getBoundingClientRect().height)));
await b.close();
