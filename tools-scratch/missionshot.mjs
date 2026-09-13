import { chromium } from 'playwright-core';
const W = +(process.env.W ?? 390);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: W, height: 830 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
const p = await ctx.newPage(); p.setDefaultTimeout(600000);
const errs = []; p.on('pageerror', e => errs.push(String(e.message)));
await p.goto(`http://localhost:8901/?level=1&mode=missions`, { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
await p.evaluate(() => { window.__game.showMenu(); document.getElementById('tab-btn-mode').click(); });
await p.evaluate(() => new Promise(r => { let n=0; const f=()=>(++n>6?r():requestAnimationFrame(f)); requestAnimationFrame(f); }));
await p.evaluate(() => { document.getElementById('title-screen').scrollTop = 0; });
await p.screenshot({ path: 'tools-scratch/shot-missions-top.png' });
// and the mission list itself
const info = await p.evaluate(() => {
  const sel = document.getElementById('mission-select');
  const chips = [...sel.querySelectorAll('.mission-chip')];
  const s = document.getElementById('title-screen');
  s.scrollTop = sel.getBoundingClientRect().top + s.scrollTop - 60;
  const clip = chips.filter(c => { const n = c.querySelector('.mname');
    return n && n.scrollWidth > n.clientWidth + 1; }).map(c => c.querySelector('.mname').textContent);
  return { n: chips.length, truncatedNames: clip,
    names: chips.map(c => c.querySelector('.mname')?.textContent),
    h: chips.map(c => Math.round(c.getBoundingClientRect().height)),
    listH: Math.round(sel.getBoundingClientRect().height) };
});
await p.evaluate(() => new Promise(r => { let n=0; const f=()=>(++n>4?r():requestAnimationFrame(f)); requestAnimationFrame(f); }));
await p.screenshot({ path: 'tools-scratch/shot-missions-list.png' });
console.log(JSON.stringify(info, null, 1));
if (errs.length) console.log('ERR ' + errs.slice(0,2).join(' | '));
await b.close();
