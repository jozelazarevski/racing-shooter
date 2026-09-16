import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: 390, height: 830 }, hasTouch: true, isMobile: true });
const p = await ctx.newPage(); p.setDefaultTimeout(600000);
await p.goto('http://localhost:8901/?level=1&unlockall=1', { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
await p.evaluate(() => window.__game.showMenu());
const rep = (t) => p.evaluate((t) => {
  const s = document.getElementById('title-screen');
  s.scrollTop = 0;
  const r = document.querySelector('.game-title').getBoundingClientRect();
  return `${t}  scrollTop=${s.scrollTop}  title top=${Math.round(r.top)} h=${Math.round(r.height)}`;
}, t).then(console.log);
await rep('index      ');
await p.evaluate(() => { const g=window.__game; g._chapterIn=g.chapters()[1].n; g._renderLevelCards(); g._syncBackBtn(); });
await rep('in chapter ');
await b.close();
