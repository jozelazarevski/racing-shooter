import { chromium } from 'playwright-core';
const W = +(process.env.W ?? 390);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: W, height: 830 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
const p = await ctx.newPage(); p.setDefaultTimeout(600000);
const errs = []; p.on('pageerror', e => errs.push(String(e.message)));
await p.goto('http://localhost:8901/?level=1', { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
await p.evaluate(() => { const g = window.__game; g.garage.credits = 12500;
  g.showMenu(); document.getElementById('tab-btn-garage').click(); g.renderGarage(); });
await p.evaluate(() => new Promise(r => { let n=0; const f=()=>(++n>8?r():requestAnimationFrame(f)); requestAnimationFrame(f); }));
console.log(await p.evaluate(() => {
  const art = [...document.querySelectorAll('#garage-bays .pc-art')];
  return { bays: document.querySelectorAll('.bay').length,
    partCards: document.querySelectorAll('.part-card').length,
    upCards: document.querySelectorAll('.up-card').length,
    thumbsDrawn: art.filter(i => (i.getAttribute('src')||'').length > 2000).length,
    previewDrawn: (document.querySelector('.bp-art')?.getAttribute('src')||'').length > 5000,
    tyreBay: !!document.querySelector('.bay #tyre-bay .tyre-opt') };
}));
await p.evaluate(() => { const el = document.getElementById('build-preview');
  const s = document.getElementById('title-screen'); s.scrollTop += el.getBoundingClientRect().top - 60; });
await p.screenshot({ path: `tools-scratch/shot-garage-top.png` });
await p.evaluate(() => { const el = document.querySelectorAll('.bay')[2];
  const s = document.getElementById('title-screen'); s.scrollTop += el.getBoundingClientRect().top - 60; });
await p.screenshot({ path: `tools-scratch/shot-garage-mid.png` });
if (errs.length) console.log('ERR ' + errs.slice(0,3).join(' | '));
await b.close();
