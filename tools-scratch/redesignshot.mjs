import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const TAG = process.env.TAG ?? 'after';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: 390, height: 830 }, hasTouch: true, isMobile: true,
  deviceScaleFactor: 2 });
const p = await ctx.newPage(); p.setDefaultTimeout(600000);
await p.goto(`${BASE}/?level=1&unlockall=1`, { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
await p.evaluate(() => window.__game.showMenu());
// the WebGL scene behind the menu needs a frame of its own or it shoots black
await p.evaluate(() => new Promise(r => { let n = 0;
  const f = () => (++n > 6 ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); }));
// the timeline auto-scrolls to the next track and it lands a frame or two in,
// so the reset has to come AFTER the settle or it is simply overwritten
await p.evaluate(() => { document.getElementById('title-screen').scrollTop = 0; });
await p.screenshot({ path: `tools-scratch/shot-${TAG}-index.png` });
await p.evaluate(() => { const g=window.__game; g._chapterIn=g.chapters()[1].n;
  g._renderLevelCards(); g._syncBackBtn(); });
await p.evaluate(() => new Promise(r => { let n = 0;
  const f = () => (++n > 6 ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); }));
await p.evaluate(() => { document.getElementById('title-screen').scrollTop = 0; });
await p.screenshot({ path: `tools-scratch/shot-${TAG}-chapter.png` });
await b.close();
console.log('shot-' + TAG + '-{index,chapter}.png');
