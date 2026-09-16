import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const IDS = ['race-info','health-box','score-box','speed-box','feed','weapon-box',
  't-fire','t-missile','t-mine','t-shock','t-nitro','t-drift','t-brake',
  'cam-btn','view-btn','pause-btn'];
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
const p = await ctx.newPage();
await p.goto(`${BASE}/?level=1&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 600000 });
await p.evaluate(() => { window.__game.state = 'race';
  for (let i=0;i<6;i++) window.__game.hud.feed(`TEST ${i} — LONGER TEXT`, 'info'); });
for (let f=0;f<6;f++) await p.evaluate(() => new Promise(r=>requestAnimationFrame(()=>r())));
console.log(await p.evaluate((IDS) => IDS.map((id) => {
  const e = document.getElementById(id);
  if (!e) return `${id}: ABSENT from the DOM`;
  const cs = getComputedStyle(e), r = e.getBoundingClientRect();
  const why = cs.display==='none' ? 'display:none' : cs.visibility==='hidden' ? 'visibility:hidden'
    : +cs.opacity===0 ? 'opacity:0' : (r.width<1||r.height<1) ? `zero box ${r.width}x${r.height}` : null;
  return `${id}: ${why ? 'SKIPPED — ' + why : `measured ${Math.round(r.width)}x${Math.round(r.height)} at ${Math.round(r.left)},${Math.round(r.top)}`}`;
}).join('\n'), IDS));
await b.close();
