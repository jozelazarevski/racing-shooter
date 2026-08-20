/* THE FOOTER: flush to the bottom edge, edge to edge, at every scroll depth —
 * and the last card in the list still clear of it. */
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: 390, height: 830 }, hasTouch: true, isMobile: true });
const p = await ctx.newPage(); p.setDefaultTimeout(600000);
await p.goto('http://localhost:8901/?level=1&unlockall=1', { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
await p.evaluate(() => { const g=window.__game; g.showMenu(); g._chapterIn=g.chapters()[1].n;
  g._renderLevelCards(); g._syncBackBtn(); });
for (const f of [0, 0.5, 1]) {
  console.log(await p.evaluate((f) => {
    const s = document.getElementById('title-screen');
    s.scrollTop = (s.scrollHeight - s.clientHeight) * f;
    const btn = document.getElementById('start-btn').getBoundingClientRect();
    const bar = document.getElementById('topbar').getBoundingClientRect();
    const cards = [...document.querySelectorAll('#level-select .level-chip')];
    const last = cards[cards.length - 1].getBoundingClientRect();
    return `scroll ${String(Math.round(f*100)).padStart(3)}%  `
      + `BACK top=${Math.round(bar.top)}  `
      + `START ${Math.round(btn.left)}..${Math.round(btn.right)} bottom=${Math.round(innerHeight - btn.bottom)}  `
      + `last card clears by ${Math.round(btn.top - last.bottom)}px`;
  }, f));
}
await b.close();
